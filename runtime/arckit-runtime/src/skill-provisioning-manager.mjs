import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { cp, lstat, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const API_VERSION = "arcforge-embedded-provider/v1";
const SNAPSHOT_VERSION = "arckit-setup-readiness/v1";

export function createSkillProvisioningManager(options = {}) {
  const resourcesRoot = path.resolve(requiredPath(options.resourcesRoot, "resourcesRoot"));
  const dataRoot = path.resolve(requiredPath(options.dataRoot, "dataRoot"));
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const stateRoot = path.resolve(options.stateRoot || path.join(homeDir, ".arcforge"));
  const consumerRoot = path.resolve(options.consumerRoot || dataRoot);
  const sourceStoreRoot = path.join(dataRoot, "skill-sources", "arckit");
  const currentRoot = path.join(sourceStoreRoot, "current");
  const versionsRoot = path.join(sourceStoreRoot, "versions");
  const previousRoot = path.join(sourceStoreRoot, "previous");
  const providerLoader = options.providerLoader || defaultProviderLoader;
  const codexProbe = options.codexProbe || defaultCodexProbe;
  const listeners = new Set();
  let operation = Promise.resolve();
  let internalPlan = null;
  let snapshot = baseSnapshot("checking");

  function runExclusive(task) {
    const next = operation.then(task, task);
    operation = next.catch(() => undefined);
    return next;
  }

  function emit() {
    const value = structuredClone(snapshot);
    for (const listener of listeners) listener(value);
  }

  function setSnapshot(value) {
    snapshot = { ...value, schema_version: SNAPSHOT_VERSION, updated_at: new Date().toISOString() };
    emit();
    return structuredClone(snapshot);
  }

  async function check() {
    return runExclusive(async () => {
      internalPlan = null;
      setSnapshot(baseSnapshot("checking"));
      try {
        const bundle = await inspectBundle(resourcesRoot);
        const provider = await providerLoader(bundle.providerEntrypoint);
        assertProviderApi(provider);
        const providerInfo = await provider.inspectProvider();
        assertProviderLock(providerInfo, bundle.lock.arcforgeProvider);
        const source = await prepareSourceContext({ bundle, provider });
        const probe = await safeCodexProbe(codexProbe);
        const analyzed = analyzePlan(source.plan, source.drift, { allowManagedUpdate: Boolean(source.upgrade) });
        internalPlan = { provider, bundle, source, ...analyzed };
        const status = probe.available ? analyzed.status : "blocked";
        return setSnapshot(publicSnapshot({ status, bundle, providerInfo, source, analyzed, probe }));
      } catch (error) {
        return setSnapshot(blockedSnapshot(error));
      }
    });
  }

  async function apply({ planDigest, cleanupPaths = [] } = {}) {
    return runExclusive(async () => {
      if (!internalPlan || !planDigest || planDigest !== internalPlan.source.plan.planDigest) {
        throw setupError("PLAN_STALE", "安装计划已变化，请重新检查后再确认。", "plan");
      }
      if (internalPlan.conflicts.length) {
        throw setupError("TARGET_CONFLICT", "存在 changed 或 loader conflict，不能静默覆盖。", "plan");
      }
      const allowedCleanup = new Set(internalPlan.cleanup.map((item) => path.resolve(item.path)));
      const normalizedCleanup = [...new Set(cleanupPaths.map((item) => path.resolve(item)))];
      if (normalizedCleanup.some((item) => !allowedCleanup.has(item))) {
        throw setupError("CLEANUP_NOT_IN_PLAN", "清理路径不属于当前 managed-stale 计划。", "plan");
      }
      setSnapshot({ ...snapshot, status: "applying", can_apply: false, can_continue: false, progress: { stage: "source-staging", completed: [] } });
      let upgrade;
      try {
        upgrade = await activateUpgrade(internalPlan.source.upgrade);
        const fresh = await internalPlan.provider.createProvisioningPlan(provisioningOptions(internalPlan.bundle, internalPlan.source.selectedSkills));
        if (fresh.planDigest !== planDigest) throw setupError("PLAN_STALE", "来源或目标在确认后发生变化，请重新检查。", "apply");
        setSnapshot({ ...snapshot, progress: { stage: "target-directories", completed: ["source-staging"] } });
        await internalPlan.provider.applyProvisioningPlan({
          ...provisioningOptions(internalPlan.bundle, internalPlan.source.selectedSkills),
          expectedPlanDigest: planDigest,
          cleanupPaths: normalizedCleanup,
          confirm: true
        });
        await finalizeUpgrade(upgrade);
      } catch (error) {
        await rollbackUpgrade(upgrade).catch((rollbackError) => {
          throw new AggregateError([error, rollbackError], "Skill provisioning failed and source rollback was incomplete.");
        });
        internalPlan = null;
        setSnapshot(blockedSnapshot(error, { rollback_complete: !(error instanceof AggregateError) }));
        return structuredClone(snapshot);
      }
      internalPlan = null;
      const result = await checkUnlocked();
      if (result.status === "blocked" && result.error?.code === "CODEX_UNAVAILABLE") {
        return setSnapshot({ ...result, first_install: true });
      }
      if (result.status !== "ready") {
        return setSnapshot(blockedSnapshot(setupError("POST_DRIFT_FAILED", "安装后校验未达到 ready。", "post-drift"), { previous: result }));
      }
      return setSnapshot({ ...result, first_install: true });
    });
  }

  async function checkUnlocked() {
    try {
      const bundle = await inspectBundle(resourcesRoot);
      const provider = await providerLoader(bundle.providerEntrypoint);
      assertProviderApi(provider);
      const providerInfo = await provider.inspectProvider();
      assertProviderLock(providerInfo, bundle.lock.arcforgeProvider);
      const source = await prepareSourceContext({ bundle, provider });
      const probe = await safeCodexProbe(codexProbe);
      const analyzed = analyzePlan(source.plan, source.drift, { allowManagedUpdate: Boolean(source.upgrade) });
      internalPlan = { provider, bundle, source, ...analyzed };
      return setSnapshot(publicSnapshot({ status: probe.available ? analyzed.status : "blocked", bundle, providerInfo, source, analyzed, probe }));
    } catch (error) {
      return setSnapshot(blockedSnapshot(error));
    }
  }

  async function planManagedRemoval(managedPaths = []) {
    return runExclusive(async () => {
      if (!internalPlan) throw setupError("CHECK_REQUIRED", "请先重新检查环境。", "cleanup");
      return internalPlan.provider.removeManagedProvisioning({
        consumerRoot, stateRoot, sourceRoot: currentRoot, managedPaths
      });
    });
  }

  async function removeManaged({ managedPaths = [], confirmationDigest } = {}) {
    return runExclusive(async () => {
      if (!internalPlan) throw setupError("CHECK_REQUIRED", "请先重新检查环境。", "cleanup");
      await internalPlan.provider.removeManagedProvisioning({
        consumerRoot, stateRoot, sourceRoot: currentRoot, managedPaths,
        confirmationDigest, confirm: true
      });
      internalPlan = null;
      return checkUnlocked();
    });
  }

  async function assertReady() {
    const current = await check();
    if (current.status !== "ready") throw setupError("SETUP_NOT_READY", "Arckit skills 尚未达到可运行状态。", "preflight");
    return current;
  }

  async function waitForIdle() { await operation; }

  function onEvent(listener) { listeners.add(listener); return () => listeners.delete(listener); }

  async function prepareSourceContext({ bundle, provider }) {
    await mkdir(versionsRoot, { recursive: true });
    await mkdir(previousRoot, { recursive: true });
    const desiredDigest = bundle.payloadManifest.payloadDigest;
    const versionRoot = path.join(versionsRoot, desiredDigest);
    await ensureVersionSource(bundle.payloadRoot, versionRoot, bundle.payloadManifest);
    const current = await inspectInstalledSource(currentRoot);
    if (!current) {
      await replaceDirectory(versionRoot, currentRoot);
      const generated = await generatePlan(provider, bundle, selectedSkills(bundle));
      return { ...generated, selectedSkills: selectedSkills(bundle), deferredSkills: deferredSkills(bundle), upgrade: null };
    }
    await verifyPayload(currentRoot, current.manifest);
    if (current.manifest.payloadDigest === desiredDigest) {
      const generated = await generatePlan(provider, bundle, selectedSkills(bundle));
      return { ...generated, selectedSkills: selectedSkills(bundle), deferredSkills: deferredSkills(bundle), upgrade: null };
    }

    const currentSelected = selectedSkills({ ...bundle, payloadManifest: current.manifest, sourceManifest: await readJson(path.join(currentRoot, "arcforge.skill-project.json")) });
    const oldDrift = await provider.driftProvisioningPlan(provisioningOptions(bundle, currentSelected));
    const relations = await provider.listProvisioningRelations({ consumerRoot, stateRoot, sourceRoot: currentRoot });
    if (relations.length && !isCleanDrift(oldDrift)) {
      throw setupError("SOURCE_UPGRADE_CONFLICT", "旧版本目标存在 drift；保留旧 source，需先处理冲突。", "source-upgrade", { drift: summarizeDrift(oldDrift) });
    }
    const preview = await previewUpgrade(versionRoot, async () => generatePlan(provider, bundle, selectedSkills(bundle)));
    return {
      ...preview, selectedSkills: selectedSkills(bundle), deferredSkills: deferredSkills(bundle),
      upgrade: { versionRoot, previousDigest: current.manifest.payloadDigest, desiredDigest }
    };
  }

  async function previewUpgrade(versionRoot, callback) {
    const backup = path.join(sourceStoreRoot, `.current-preview-${crypto.randomUUID()}`);
    await rename(currentRoot, backup);
    try {
      await replaceDirectory(versionRoot, currentRoot);
      return await callback();
    } finally {
      await rm(currentRoot, { recursive: true, force: true });
      await rename(backup, currentRoot);
    }
  }

  async function activateUpgrade(upgrade) {
    if (!upgrade) return null;
    const current = await inspectInstalledSource(currentRoot);
    if (!current || current.manifest.payloadDigest !== upgrade.previousDigest) {
      throw setupError("PLAN_STALE", "current source 在确认后发生变化。", "source-upgrade");
    }
    const backup = path.join(sourceStoreRoot, `.current-apply-${crypto.randomUUID()}`);
    await rename(currentRoot, backup);
    try {
      await replaceDirectory(upgrade.versionRoot, currentRoot);
      return { ...upgrade, backup };
    } catch (error) {
      await rename(backup, currentRoot);
      throw error;
    }
  }

  async function finalizeUpgrade(upgrade) {
    if (!upgrade) return;
    const destination = path.join(previousRoot, upgrade.previousDigest);
    await rm(destination, { recursive: true, force: true });
    await rename(upgrade.backup, destination);
  }

  async function rollbackUpgrade(upgrade) {
    if (!upgrade?.backup) return;
    await rm(currentRoot, { recursive: true, force: true });
    await rename(upgrade.backup, currentRoot);
  }

  function provisioningOptions(bundle, skills) {
    return {
      sourceRoot: currentRoot,
      consumerRoot,
      stateRoot,
      homeDir,
      profile: bundle.lock.skillPayload.profile,
      skills,
      agentTargetIds: ["codex"]
    };
  }

  async function generatePlan(provider, bundle, skills) {
    const options = provisioningOptions(bundle, skills);
    const plan = await provider.createProvisioningPlan(options);
    const drift = await provider.driftProvisioningPlan(options);
    return { plan, drift };
  }

  return {
    check, apply, planManagedRemoval, removeManaged, assertReady, waitForIdle, onEvent,
    getSnapshot: () => structuredClone(snapshot),
    paths: { resourcesRoot, dataRoot, stateRoot, consumerRoot, currentRoot }
  };
}

async function inspectBundle(resourcesRoot) {
  const provisioningRoot = path.join(resourcesRoot, "provisioning");
  const lock = await readJson(path.join(provisioningRoot, "distribution-lock.json"));
  if (lock.schemaVersion !== "arckit-runtime-distribution/v1") throw setupError("DISTRIBUTION_LOCK_INVALID", "不支持的 distribution lock。", "resources");
  await verifyChecksums(resourcesRoot, path.join(provisioningRoot, "checksums.txt"));
  const payloadRoot = path.join(provisioningRoot, "arckit-skills");
  const payloadManifest = await readJson(path.join(payloadRoot, "payload.manifest.json"));
  const sourceManifest = await readJson(path.join(payloadRoot, "arcforge.skill-project.json"));
  await verifyPayload(payloadRoot, payloadManifest);
  if (payloadManifest.payloadDigest !== lock.skillPayload.payloadDigest || payloadManifest.sourceManifestDigest !== lock.skillPayload.sourceManifestDigest) {
    throw setupError("PAYLOAD_LOCK_MISMATCH", "skill payload 与 distribution lock 不一致。", "resources");
  }
  const providerRoot = path.join(provisioningRoot, "arcforge-provider");
  const providerEntrypoint = path.join(providerRoot, "dist", "provider", "index.js");
  await lstat(providerEntrypoint);
  return { resourcesRoot, provisioningRoot, payloadRoot, payloadManifest, sourceManifest, lock, providerRoot, providerEntrypoint };
}

async function verifyChecksums(resourcesRoot, checksumsPath) {
  const lines = (await readFile(checksumsPath, "utf8")).split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw setupError("RESOURCE_CHECKSUMS_EMPTY", "资源校验清单为空。", "resources");
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw setupError("RESOURCE_CHECKSUMS_INVALID", "资源校验清单格式无效。", "resources");
    const target = safeChild(resourcesRoot, match[2]);
    const stats = await lstat(target);
    if (!stats.isFile() || stats.isSymbolicLink()) throw setupError("RESOURCE_TYPE_INVALID", `资源不是普通文件：${match[2]}`, "resources");
    const actual = sha256(await readFile(target));
    if (!safeDigestEqual(actual, match[1])) throw setupError("RESOURCE_DIGEST_MISMATCH", `资源摘要不匹配：${match[2]}`, "resources");
  }
}

async function verifyPayload(root, manifest) {
  if (manifest.schemaVersion !== "arckit-skill-payload/v1" || !Array.isArray(manifest.files)) throw setupError("PAYLOAD_MANIFEST_INVALID", "skill payload manifest 无效。", "source");
  for (const item of manifest.files) {
    const target = safeChild(root, item.path);
    if (!safeDigestEqual(sha256(await readFile(target)), item.sha256)) throw setupError("PAYLOAD_DIGEST_MISMATCH", `skill payload 已损坏：${item.path}`, "source");
  }
  const digest = sha256(JSON.stringify(manifest.files));
  if (!safeDigestEqual(digest, manifest.payloadDigest)) throw setupError("PAYLOAD_DIGEST_MISMATCH", "skill payload 总摘要无效。", "source");
}

async function ensureVersionSource(packagedRoot, versionRoot, manifest) {
  const installed = await inspectInstalledSource(versionRoot);
  if (installed) {
    await verifyPayload(versionRoot, installed.manifest);
    if (installed.manifest.payloadDigest !== manifest.payloadDigest) throw setupError("SOURCE_STORE_CONFLICT", "版本化 source 目录与期望摘要不一致。", "source");
    return;
  }
  await replaceDirectory(packagedRoot, versionRoot);
  await verifyPayload(versionRoot, manifest);
}

async function inspectInstalledSource(root) {
  try { return { manifest: await readJson(path.join(root, "payload.manifest.json")) }; }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

async function replaceDirectory(source, target) {
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.stage-${crypto.randomUUID()}`);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, temporary, { recursive: true, errorOnExist: true });
  try {
    await rm(target, { recursive: true, force: true });
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

function selectedSkills(bundle) {
  const deferred = new Set((bundle.sourceManifest.availability?.skills || []).filter((item) => item.mode === "project-ambient").map((item) => item.path));
  return bundle.payloadManifest.skillPaths.filter((item) => !deferred.has(item)).map((item) => path.posix.basename(item));
}

function deferredSkills(bundle) {
  const deferred = new Set((bundle.sourceManifest.availability?.skills || []).filter((item) => item.mode === "project-ambient").map((item) => item.path));
  return bundle.payloadManifest.skillPaths.filter((item) => deferred.has(item)).map((item) => path.posix.basename(item));
}

function analyzePlan(envelope, drift, { allowManagedUpdate = false } = {}) {
  const errors = envelope.plan.diagnostics.filter((item) => item.severity === "error");
  if (errors.length) throw setupError("PLAN_INVALID", `计划包含 ${errors.length} 个阻塞诊断。`, "plan", { diagnostics: errors });
  const changed = drift.items.filter((item) => item.status === "changed");
  const missing = drift.items.filter((item) => item.status === "missing");
  const conflicts = [...(allowManagedUpdate ? [] : changed), ...envelope.plan.loaderTargets.filter((item) => item.status === "conflict")];
  const cleanup = envelope.plan.cleanup || [];
  const status = conflicts.length ? "conflict" : cleanup.length ? "drifted" : missing.length || changed.length || envelope.plan.loaderTargets.some((item) => item.status !== "same") || drift.policyDrift?.some((item) => item.status !== "same") ? "needs-install" : "ready";
  return { status, conflicts, cleanup, counts: { missing: missing.length, changed: changed.length, same: drift.items.filter((item) => item.status === "same").length, managed_stale: cleanup.length, uncertain: (drift.targetExtras || []).filter((item) => item.classification === "uncertain").length } };
}

function isCleanDrift(drift) {
  return drift.items.every((item) => item.status === "same")
    && (drift.policyDrift || []).every((item) => item.status === "same")
    && !(drift.targetExtras || []).some((item) => item.classification === "managed-stale")
    && (drift.availabilityPlan?.loaderTargets || []).every((item) => item.status === "same");
}

function publicSnapshot({ status, bundle, providerInfo, source, analyzed, probe }) {
  const plan = source.plan.plan;
  return {
    status,
    checks: [
      { id: "resources", status: "passed", summary: "distribution lock 与 bundled resources 已验证" },
      { id: "provider", status: "passed", summary: `${providerInfo.apiVersion} · ${providerInfo.providerVersion}` },
      { id: "skills", status: analyzed.status === "ready" ? "passed" : "pending", summary: `${plan.items.length} 个用户 skills，${source.deferredSkills.length} 个 project skills 延后` },
      { id: "codex", status: probe.available ? "passed" : "failed", summary: probe.summary }
    ],
    distribution: { runtime_version: bundle.lock.runtime.packageVersion, release_tag: bundle.lock.arckit.releaseTag, payload_digest: bundle.lock.skillPayload.payloadDigest, provider_version: providerInfo.providerVersion },
    plan: {
      digest: source.plan.planDigest,
      profile: plan.profile,
      items: plan.items.map((item) => ({ skill: item.skill, mode: item.effectiveMode, destinations: item.destinations.map((entry) => ({ kind: entry.kind, path: entry.path })) })),
      loader_targets: plan.loaderTargets.map((item) => ({ agent: item.agentId, path: item.path, status: item.status })),
      cleanup: analyzed.cleanup.map((item) => ({ skill: item.skill, path: item.path, reason: item.reason })),
      deferred_project_skills: source.deferredSkills
    },
    drift: { counts: analyzed.counts, conflicts: analyzed.conflicts.map((item) => ({ skill: item.skill, path: item.targetPath || item.path, status: item.status })), extras: (source.drift.targetExtras || []).map((item) => ({ name: item.name, classification: item.classification, path: item.targetPath })) },
    codex: probe,
    can_apply: analyzed.status === "needs-install",
    can_continue: status === "ready",
    first_install: source.plan.plan.items.some((item) => item.destinations.some((destination) => source.drift.items.some((driftItem) => driftItem.targetPath === destination.path && driftItem.status === "missing"))),
    progress: null,
    error: probe.available ? null : { code: "CODEX_UNAVAILABLE", stage: "codex-probe", message: probe.summary, rollback_complete: true }
  };
}

function blockedSnapshot(error, extra = {}) {
  const normalized = normalizeError(error);
  return { ...baseSnapshot("blocked"), error: { ...normalized, rollback_complete: extra.rollback_complete ?? true }, previous: extra.previous || null };
}

function baseSnapshot(status) { return { schema_version: SNAPSHOT_VERSION, status, checks: [], distribution: null, plan: null, drift: null, codex: null, can_apply: false, can_continue: false, first_install: false, progress: null, error: null, updated_at: new Date().toISOString() }; }
function summarizeDrift(drift) { return { changed: drift.items.filter((item) => item.status === "changed").length, missing: drift.items.filter((item) => item.status === "missing").length, managed_stale: (drift.targetExtras || []).filter((item) => item.classification === "managed-stale").length }; }
function setupError(code, message, stage, details) { const error = new Error(message); error.code = code; error.stage = stage; error.details = details; return error; }
function normalizeError(error) { if (error instanceof AggregateError) return { code: "ROLLBACK_INCOMPLETE", stage: "rollback", message: error.message, details: error.errors.map((item) => String(item?.message || item)) }; return { code: error?.code || "SETUP_FAILED", stage: error?.stage || "unknown", message: error?.message || String(error), details: error?.details || null }; }
function requiredPath(value, name) { if (!value || !path.isAbsolute(value)) throw new Error(`${name} must be an explicit absolute path.`); return value; }
function safeChild(root, relative) { if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..")) throw setupError("RESOURCE_PATH_INVALID", `资源路径无效：${relative}`, "resources"); const target = path.resolve(root, relative); if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw setupError("RESOURCE_PATH_INVALID", `资源路径越界：${relative}`, "resources"); return target; }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function safeDigestEqual(left, right) { return typeof left === "string" && typeof right === "string" && /^[a-f0-9]{64}$/.test(left) && /^[a-f0-9]{64}$/.test(right) && crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right)); }
async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
function assertProviderApi(provider) { for (const name of ["inspectProvider","createProvisioningPlan","driftProvisioningPlan","applyProvisioningPlan","listProvisioningRelations","removeManagedProvisioning"]) if (typeof provider[name] !== "function") throw setupError("PROVIDER_API_INVALID", `ArcForge provider 缺少 ${name}。`, "provider"); }
function assertProviderLock(info, locked) { if (info.apiVersion !== API_VERSION || info.apiVersion !== locked.apiVersion || info.providerVersion !== locked.providerVersion || info.buildCommit !== locked.buildCommit) throw setupError("PROVIDER_LOCK_MISMATCH", "ArcForge provider 与 distribution lock 不一致。", "provider"); }
async function defaultProviderLoader(entrypoint) { return import(pathToFileURL(entrypoint).href); }
async function defaultCodexProbe() { const { stdout, stderr } = await execFileAsync("codex", ["--version"], { timeout: 10_000 }); return { available: true, summary: (stdout || stderr).trim() || "Codex 可用" }; }
async function safeCodexProbe(probe) { try { const result = await probe(); return result?.available === false ? { available: false, summary: result.summary || "Codex 不可用" } : { available: true, summary: result?.summary || "Codex 可用" }; } catch (error) { return { available: false, summary: error?.code === "ENOENT" ? "未找到 Codex CLI，请先安装后重新检测。" : `Codex 检测失败：${error.message}` }; } }
