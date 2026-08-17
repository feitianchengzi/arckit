import assert from "node:assert/strict";
import crypto from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createSkillProvisioningManager } from "../src/skill-provisioning-manager.mjs";

test("Setup Readiness installs governed skills, preserves unrelated skills, detects drift, and rolls back an upgrade source", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-manager-"));
  const resourcesRoot = path.join(fixture, "resources");
  const dataRoot = path.join(fixture, "data");
  const homeDir = path.join(fixture, "home");
  const stateRoot = path.join(fixture, "arcforge");
  const fake = createFakeProvider();
  try {
    await writeBundle(resourcesRoot, "1.0.0-tf.b1", "ambient-v1");
    const unrelated = path.join(homeDir, ".codex", "skills", "unrelated-tool");
    await mkdir(unrelated, { recursive: true });
    await writeFile(path.join(unrelated, "SKILL.md"), "unrelated\n");
    const manager = createSkillProvisioningManager({
      resourcesRoot, dataRoot, homeDir, stateRoot,
      providerLoader: async () => fake.provider,
      codexProbe: async () => ({ available: true, summary: "fixture Codex" })
    });

    const planned = await manager.check();
    assert.equal(planned.status, "needs-install");
    assert.equal(planned.plan.items.length, 2);
    assert.deepEqual(planned.plan.deferred_project_skills, ["project-skill"]);
    assert.deepEqual(planned.plan.availability, {
      arckit_total: 3,
      user_ambient: 1,
      user_on_demand: 1,
      project_ambient_deferred: 1,
      shared_assets: 0,
      other: 0,
      arcforge_loader_targets: 1
    });
    assert.equal(planned.checks.find((item) => item.id === "skills").summary, "共 3 个 Arckit skills：1 个 user-ambient，1 个 user-on-demand，1 个 project-ambient 延后；0 个 shared assets；1 个 ArcForge loader target");
    assert.equal(planned.drift.counts.uncertain, 1);
    assert.equal(planned.can_apply, true);

    const installed = await manager.apply({ planDigest: planned.plan.digest });
    assert.equal(installed.status, "ready");
    assert.equal(installed.first_install, true);
    assert.equal(await readFile(path.join(unrelated, "SKILL.md"), "utf8"), "unrelated\n");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v1\n");
    assert.equal(await readFile(path.join(stateRoot, "catalog", "fixture", "on-demand-skill", "SKILL.md"), "utf8"), "on-demand-v1\n");

    const preflightEvents = [];
    const unsubscribe = manager.onEvent((event) => preflightEvents.push(event));
    const preflight = await manager.assertReady();
    unsubscribe();
    assert.equal(preflight.status, "ready");
    assert.deepEqual(preflightEvents, []);

    await writeFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "local edit\n");
    const conflict = await manager.check();
    assert.equal(conflict.status, "conflict");
    assert.equal(conflict.can_apply, false);
    assert.equal(conflict.can_recover, true);
    assert.equal(conflict.source_upgrade.can_backup_and_restore, true);
    const repaired = await manager.recoverSourceUpgrade({ assessmentDigest: conflict.source_upgrade.digest, action: "backup-and-restore" });
    assert.equal(repaired.status, "ready");
    assert.equal(await readFile(path.join(repaired.recovery_backup.path, "ambient-skill", "SKILL.md"), "utf8"), "local edit\n");

    await writeBundle(resourcesRoot, "1.0.0-tf.b2", "ambient-v2");
    const upgrade = await manager.check();
    assert.equal(upgrade.status, "needs-install");
    assert.equal(upgrade.drift.counts.changed, 1);
    fake.failApply = true;
    const failed = await manager.apply({ planDigest: upgrade.plan.digest });
    assert.equal(failed.status, "blocked");
    assert.equal(failed.error.rollback_complete, true);
    const currentManifest = JSON.parse(await readFile(path.join(dataRoot, "skill-sources", "arckit", "current", "payload.manifest.json"), "utf8"));
    assert.equal(currentManifest.payloadDigest, fake.payloadDigests.get("1.0.0-tf.b1"));
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v1\n");

    fake.failApply = false;
    const retry = await manager.check();
    const upgraded = await manager.apply({ planDigest: retry.plan.digest });
    assert.equal(upgraded.status, "ready");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v2\n");
    assert.equal(await readFile(path.join(dataRoot, "skill-sources", "arckit", "previous", fake.payloadDigests.get("1.0.0-tf.b1"), "code", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v1\n");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }

  async function writeBundle(root, packageVersion, ambientContent) {
    await rm(root, { recursive: true, force: true });
    const payloadRoot = path.join(root, "provisioning", "arckit-skills");
    const providerRoot = path.join(root, "provisioning", "arcforge-provider");
    const skillDefinitions = [
      ["code/skills/ambient-skill", `${ambientContent}\n`],
      ["code/skills/on-demand-skill", "on-demand-v1\n"],
      ["code/skills/project-skill", "project-only\n"]
    ];
    for (const [relative, content] of skillDefinitions) {
      await mkdir(path.join(payloadRoot, relative), { recursive: true });
      await writeFile(path.join(payloadRoot, relative, "SKILL.md"), content);
    }
    const sourceManifest = { version: 1, sourceDir: ".", availability: { defaultMode: "user-ambient", skills: [{ path: "code/skills/on-demand-skill", mode: "user-on-demand" }, { path: "code/skills/project-skill", mode: "project-ambient" }] } };
    const config = { version: 1, sourceDir: ".", profiles: [{ name: "arckit-runtime", skills: ["*"], targets: ["codex"] }] };
    await writeFile(path.join(payloadRoot, "arcforge.skill-project.json"), `${JSON.stringify(sourceManifest)}\n`);
    await writeFile(path.join(payloadRoot, "arcforge.config.json"), `${JSON.stringify(config)}\n`);
    const files = await fileManifest(payloadRoot);
    const payloadDigest = sha256(JSON.stringify(files));
    fake.payloadDigests.set(packageVersion, payloadDigest);
    const payloadManifest = { schemaVersion: "arckit-skill-payload/v1", profile: "arckit-runtime", sourceCommit: "a".repeat(40), sourceManifestDigest: sha256(`${JSON.stringify(sourceManifest)}\n`), skillPaths: skillDefinitions.map(([relative]) => relative), files, payloadDigest };
    await writeFile(path.join(payloadRoot, "payload.manifest.json"), `${JSON.stringify(payloadManifest)}\n`);
    await mkdir(path.join(providerRoot, "dist", "provider"), { recursive: true });
    await writeFile(path.join(providerRoot, "dist", "provider", "index.js"), "export const fixture = true;\n");
    const lock = { schemaVersion: "arckit-runtime-distribution/v1", runtime: { packageVersion }, arckit: { releaseTag: `tf/v1.0.0-${packageVersion.endsWith("b2") ? "b2" : "b1"}` }, skillPayload: { profile: "arckit-runtime", payloadDigest, sourceManifestDigest: payloadManifest.sourceManifestDigest }, arcforgeProvider: { apiVersion: "arcforge-embedded-provider/v1", providerVersion: "1.0.0", buildCommit: "b".repeat(40), capabilities: ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"] } };
    await writeFile(path.join(root, "provisioning", "distribution-lock.json"), `${JSON.stringify(lock)}\n`);
    const resourceFiles = await fileManifest(root);
    await writeFile(path.join(root, "provisioning", "checksums.txt"), `${resourceFiles.map((item) => `${item.sha256}  ${item.path}`).join("\n")}\n`);
  }
});

test("Setup Readiness backs up and reinstalls current bundled content when a renamed consumer has no relationship", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-renamed-consumer-"));
  const resourcesRoot = path.join(fixture, "resources");
  const oldDataRoot = path.join(fixture, "old-data");
  const renamedDataRoot = path.join(fixture, "renamed-data");
  const homeDir = path.join(fixture, "home");
  const stateRoot = path.join(fixture, "state");
  const target = path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md");
  const fake = createFakeProvider();
  try {
    await createMinimalBundle(resourcesRoot);
    const oldManager = createSkillProvisioningManager({
      resourcesRoot, dataRoot: oldDataRoot, homeDir, stateRoot,
      providerLoader: async () => fake.provider,
      codexProbe: async () => ({ available: true, summary: "fixture Codex" })
    });
    const first = await oldManager.check();
    await oldManager.apply({ planDigest: first.plan.digest });
    await writeFile(target, "local edit under renamed consumer\n");

    const manager = createSkillProvisioningManager({
      resourcesRoot, dataRoot: renamedDataRoot, homeDir, stateRoot,
      providerLoader: async () => fake.provider,
      codexProbe: async () => ({ available: true, summary: "fixture Codex" })
    });
    const conflict = await manager.check();
    assert.equal(conflict.status, "conflict");
    assert.equal(conflict.can_recover, true);
    assert.equal(conflict.source_upgrade.can_backup_and_restore, false);
    assert.equal(conflict.source_upgrade.can_backup_and_reinstall, true);
    assert.equal(conflict.source_upgrade.recovery_kind, "current-bundle-reinstall");
    assert.equal(conflict.source_upgrade.items.some((item) => item.disposition === "unmanaged-conflict" && item.name === "ambient-skill"), true);

    await writeFile(target, "changed after confirmation\n");
    const stale = await manager.recoverSourceUpgrade({ assessmentDigest: conflict.source_upgrade.digest, action: "backup-and-reinstall" });
    assert.equal(stale.status, "blocked");
    assert.match(stale.error.message, /assessment changed/);
    assert.equal(await readFile(target, "utf8"), "changed after confirmation\n");

    let fresh = await manager.check();
    fake.failRecoveryAfterReplace = true;
    const failed = await manager.recoverSourceUpgrade({ assessmentDigest: fresh.source_upgrade.digest, action: "backup-and-reinstall" });
    assert.equal(failed.status, "blocked");
    assert.equal(failed.write_state, "rolled_back");
    assert.equal(await readFile(target, "utf8"), "changed after confirmation\n");

    fake.failRecoveryAfterReplace = false;
    fresh = await manager.check();
    const recovered = await manager.recoverSourceUpgrade({ assessmentDigest: fresh.source_upgrade.digest, action: "backup-and-reinstall" });
    assert.equal(recovered.status, "ready");
    assert.equal(recovered.write_state, "committed");
    assert.equal(await readFile(target, "utf8"), "ambient-v1\n");
    assert.equal(await readFile(path.join(recovered.recovery_backup.path, "ambient-skill", "SKILL.md"), "utf8"), "changed after confirmation\n");
    assert.equal((await fake.provider.listProvisioningRelations({ consumerRoot: renamedDataRoot, stateRoot, sourceRoot: manager.paths.currentRoot })).length, 1);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("Setup Readiness blocks tampered resources and preserves a safe plan when Codex is unavailable", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-blocked-"));
  try {
    const resourcesRoot = path.join(fixture, "resources");
    await createMinimalBundle(resourcesRoot);
    const fake = createFakeProvider();
    const manager = createSkillProvisioningManager({ resourcesRoot, dataRoot: path.join(fixture, "data"), homeDir: path.join(fixture, "home"), stateRoot: path.join(fixture, "state"), providerLoader: async () => fake.provider, codexProbe: async () => ({ available: false, summary: "Codex missing" }) });
    const blocked = await manager.check();
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.error.code, "CODEX_UNAVAILABLE");
    assert.equal(blocked.can_apply, true);
    await writeFile(path.join(resourcesRoot, "provisioning", "arckit-skills", "code", "skills", "ambient-skill", "SKILL.md"), "tampered\n");
    const tampered = await manager.check();
    assert.equal(tampered.status, "blocked");
    assert.equal(tampered.error.code, "RESOURCE_DIGEST_MISMATCH");
    assert.equal(tampered.can_apply, false);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("Setup Readiness blocks a provider plan that omits a manifest-declared shared asset", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-shared-plan-"));
  try {
    const resourcesRoot = path.join(fixture, "resources");
    await createMinimalBundle(resourcesRoot, { includeSharedAsset: true });
    const fake = createFakeProvider();
    const manager = createSkillProvisioningManager({
      resourcesRoot,
      dataRoot: path.join(fixture, "data"),
      homeDir: path.join(fixture, "home"),
      stateRoot: path.join(fixture, "state"),
      providerLoader: async () => fake.provider,
      codexProbe: async () => ({ available: true, summary: "fixture Codex" })
    });
    const blocked = await manager.check();
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.error.code, "SHARED_ASSET_PLAN_MISSING");
    assert.deepEqual(blocked.error.details.missing, ["definition/skills/_arckit_shared"]);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("Setup Readiness classifies the reported missing catalog targets and managed loader update as an actionable source upgrade", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-upgrade-repair-"));
  const resourcesRoot = path.join(fixture, "resources");
  const dataRoot = path.join(fixture, "data");
  const homeDir = path.join(fixture, "home");
  const stateRoot = path.join(fixture, "state");
  const fake = createFakeProvider();
  try {
    await createUpgradeBundle(resourcesRoot, "1.0.0-tf.b1", "ambient-v1\n");
    const manager = createSkillProvisioningManager({
      resourcesRoot, dataRoot, homeDir, stateRoot,
      providerLoader: async () => fake.provider,
      codexProbe: async () => ({ available: true, summary: "fixture Codex" })
    });
    const first = await manager.check();
    await manager.apply({ planDigest: first.plan.digest });
    await rm(path.join(stateRoot, "catalog", "fixture", "on-demand-skill"), { recursive: true, force: true });
    await writeFile(path.join(homeDir, ".codex", "skills", "arcforge-on-demand", "SKILL.md"), "provider loader v2\n");
    await createUpgradeBundle(resourcesRoot, "1.0.0-tf.b2", "ambient-v2\n");

    const upgrade = await manager.check();
    assert.equal(upgrade.status, "needs-install");
    assert.equal(upgrade.can_apply, true);
    assert.equal(upgrade.write_state, "not_started");
    assert.equal(upgrade.error, null);
    assert.equal(upgrade.source_upgrade.can_proceed, true);
    assert.equal(upgrade.source_upgrade.items.some((item) => item.disposition === "managed-repair" && item.name === "on-demand-skill"), true);
    assert.equal(upgrade.source_upgrade.items.some((item) => item.disposition === "managed-migration" && item.name === "arcforge-on-demand"), true);

    const applied = await manager.apply({ planDigest: upgrade.plan.digest });
    assert.equal(applied.status, "ready");
    assert.equal(applied.write_state, "committed");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v2\n");
    assert.equal(await readFile(path.join(stateRoot, "catalog", "fixture", "on-demand-skill", "SKILL.md"), "utf8"), "on-demand-v1\n");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "arcforge-on-demand", "SKILL.md"), "utf8"), "loader\n");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("Setup Readiness backs up changed managed content before presenting the fresh upgrade plan", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-setup-upgrade-backup-"));
  const resourcesRoot = path.join(fixture, "resources");
  const dataRoot = path.join(fixture, "data");
  const homeDir = path.join(fixture, "home");
  const stateRoot = path.join(fixture, "state");
  const fake = createFakeProvider();
  try {
    await createUpgradeBundle(resourcesRoot, "1.0.0-tf.b1", "ambient-v1\n");
    const manager = createSkillProvisioningManager({ resourcesRoot, dataRoot, homeDir, stateRoot, providerLoader: async () => fake.provider, codexProbe: async () => ({ available: true, summary: "fixture Codex" }) });
    const first = await manager.check();
    await manager.apply({ planDigest: first.plan.digest });
    await writeFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "my local customization\n");
    await createUpgradeBundle(resourcesRoot, "1.0.0-tf.b2", "ambient-v2\n");

    const conflict = await manager.check();
    assert.equal(conflict.status, "conflict");
    assert.equal(conflict.can_recover, true);
    assert.equal(conflict.can_apply, false);
    assert.equal(conflict.write_state, "not_started");
    assert.equal(conflict.source_upgrade.items.some((item) => item.disposition === "unverified-managed" && item.name === "ambient-skill"), true);

    const recovered = await manager.recoverSourceUpgrade({ assessmentDigest: conflict.source_upgrade.digest, action: "backup-and-restore" });
    assert.equal(recovered.status, "needs-install");
    assert.equal(recovered.write_state, "committed");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v1\n");
    assert.equal(await readFile(path.join(recovered.recovery_backup.path, "ambient-skill", "SKILL.md"), "utf8"), "my local customization\n");
    const applied = await manager.apply({ planDigest: recovered.plan.digest });
    assert.equal(applied.status, "ready");
    assert.equal(await readFile(path.join(homeDir, ".codex", "skills", "ambient-skill", "SKILL.md"), "utf8"), "ambient-v2\n");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

async function createUpgradeBundle(root, packageVersion, ambientContent) {
  await rm(root, { recursive: true, force: true });
  const payloadRoot = path.join(root, "provisioning", "arckit-skills");
  const providerRoot = path.join(root, "provisioning", "arcforge-provider");
  for (const [relative, content] of [["code/skills/ambient-skill", ambientContent], ["code/skills/on-demand-skill", "on-demand-v1\n"]]) {
    await mkdir(path.join(payloadRoot, relative), { recursive: true });
    await writeFile(path.join(payloadRoot, relative, "SKILL.md"), content);
  }
  const sourceManifest = { version: 1, sourceDir: ".", availability: { defaultMode: "user-ambient", skills: [{ path: "code/skills/on-demand-skill", mode: "user-on-demand" }] } };
  await writeFile(path.join(payloadRoot, "arcforge.skill-project.json"), `${JSON.stringify(sourceManifest)}\n`);
  await writeFile(path.join(payloadRoot, "arcforge.config.json"), `${JSON.stringify({ version: 1, sourceDir: ".", profiles: [{ name: "arckit-runtime", skills: ["*"], targets: ["codex"] }] })}\n`);
  const files = await fileManifest(payloadRoot);
  const payloadDigest = sha256(JSON.stringify(files));
  const manifest = { schemaVersion: "arckit-skill-payload/v1", profile: "arckit-runtime", sourceCommit: "a".repeat(40), sourceManifestDigest: sha256(`${JSON.stringify(sourceManifest)}\n`), skillPaths: ["code/skills/ambient-skill", "code/skills/on-demand-skill"], files, payloadDigest };
  await writeFile(path.join(payloadRoot, "payload.manifest.json"), `${JSON.stringify(manifest)}\n`);
  await mkdir(path.join(providerRoot, "dist", "provider"), { recursive: true });
  await writeFile(path.join(providerRoot, "dist", "provider", "index.js"), "fixture\n");
  const lock = { schemaVersion: "arckit-runtime-distribution/v1", runtime: { packageVersion }, arckit: { releaseTag: `tf/${packageVersion}` }, skillPayload: { profile: "arckit-runtime", payloadDigest, sourceManifestDigest: manifest.sourceManifestDigest }, arcforgeProvider: { apiVersion: "arcforge-embedded-provider/v1", providerVersion: "1.0.0", buildCommit: "b".repeat(40), capabilities: ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"] } };
  await writeFile(path.join(root, "provisioning", "distribution-lock.json"), `${JSON.stringify(lock)}\n`);
  const resourceFiles = await fileManifest(root);
  await writeFile(path.join(root, "provisioning", "checksums.txt"), `${resourceFiles.map((item) => `${item.sha256}  ${item.path}`).join("\n")}\n`);
}

async function createMinimalBundle(root, { includeSharedAsset = false } = {}) {
  const payloadRoot = path.join(root, "provisioning", "arckit-skills");
  await mkdir(path.join(payloadRoot, "code", "skills", "ambient-skill"), { recursive: true });
  await writeFile(path.join(payloadRoot, "code", "skills", "ambient-skill", "SKILL.md"), "ambient-v1\n");
  if (includeSharedAsset) {
    await mkdir(path.join(payloadRoot, "definition", "skills", "_arckit_shared"), { recursive: true });
    await writeFile(path.join(payloadRoot, "definition", "skills", "_arckit_shared", "contract.md"), "shared contract\n");
  }
  const sourceManifest = { version: 1, sourceDir: ".", availability: { defaultMode: "user-ambient", skills: [] } };
  await writeFile(path.join(payloadRoot, "arcforge.skill-project.json"), `${JSON.stringify(sourceManifest)}\n`);
  await writeFile(path.join(payloadRoot, "arcforge.config.json"), `${JSON.stringify({ version: 1, sourceDir: ".", profiles: [{ name: "arckit-runtime", skills: ["*"], targets: ["codex"] }] })}\n`);
  const files = await fileManifest(payloadRoot);
  const payloadDigest = sha256(JSON.stringify(files));
  const manifest = { schemaVersion: "arckit-skill-payload/v1", profile: "arckit-runtime", sourceCommit: "a".repeat(40), sourceManifestDigest: sha256(`${JSON.stringify(sourceManifest)}\n`), skillPaths: ["code/skills/ambient-skill"], sharedAssetPaths: includeSharedAsset ? ["definition/skills/_arckit_shared"] : [], files, payloadDigest };
  await writeFile(path.join(payloadRoot, "payload.manifest.json"), `${JSON.stringify(manifest)}\n`);
  await mkdir(path.join(root, "provisioning", "arcforge-provider", "dist", "provider"), { recursive: true });
  await writeFile(path.join(root, "provisioning", "arcforge-provider", "dist", "provider", "index.js"), "fixture\n");
  const lock = { schemaVersion: "arckit-runtime-distribution/v1", runtime: { packageVersion: "1.0.0-tf.b1" }, arckit: { releaseTag: "tf/v1.0.0-b1" }, skillPayload: { profile: "arckit-runtime", payloadDigest, sourceManifestDigest: manifest.sourceManifestDigest }, arcforgeProvider: { apiVersion: "arcforge-embedded-provider/v1", providerVersion: "1.0.0", buildCommit: "b".repeat(40), capabilities: ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"] } };
  await writeFile(path.join(root, "provisioning", "distribution-lock.json"), `${JSON.stringify(lock)}\n`);
  const resourceFiles = await fileManifest(root);
  await writeFile(path.join(root, "provisioning", "checksums.txt"), `${resourceFiles.map((item) => `${item.sha256}  ${item.path}`).join("\n")}\n`);
}

function createFakeProvider() {
  const records = [];
  const state = { failApply: false, failRecoveryAfterReplace: false, payloadDigests: new Map() };
  const provider = {
    async inspectProvider() { return { apiVersion: "arcforge-embedded-provider/v1", providerVersion: "1.0.0", buildCommit: "b".repeat(40), loaderDigest: "c".repeat(64), capabilities: ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"] }; },
    async createProvisioningPlan(options) {
      const payload = JSON.parse(await readFile(path.join(options.sourceRoot, "payload.manifest.json"), "utf8"));
      const sourceManifest = JSON.parse(await readFile(path.join(options.sourceRoot, "arcforge.skill-project.json"), "utf8"));
      const modeByPath = new Map((sourceManifest.availability.skills || []).map((item) => [item.path, item.mode]));
      const items = [];
      for (const relative of payload.skillPaths) {
        const skill = path.basename(relative);
        if (!options.skills.includes(skill)) continue;
        const mode = modeByPath.get(relative) || sourceManifest.availability.defaultMode;
        const destination = mode === "user-on-demand" ? path.join(options.stateRoot, "catalog", "fixture", skill) : path.join(options.homeDir, ".codex", "skills", skill);
        items.push({ skill, sourcePath: relative, effectiveMode: mode, policyOrigin: "source", destinations: [{ kind: mode === "user-on-demand" ? "user-catalog" : "user-agent", path: destination }], contentDigest: sha256(await readFile(path.join(options.sourceRoot, relative, "SKILL.md"))) });
      }
      const loaderPath = items.some((item) => item.effectiveMode === "user-on-demand") ? path.join(options.homeDir, ".codex", "skills", "arcforge-on-demand") : "";
      const loaderExists = loaderPath ? await readFile(path.join(loaderPath, "SKILL.md"), "utf8").then(() => true, (error) => error.code === "ENOENT" ? false : Promise.reject(error)) : false;
      const loaderTargets = loaderPath ? [{ agentId: "codex", path: loaderPath, status: await sameFile(path.join(loaderPath, "SKILL.md"), "loader\n") ? "same" : loaderExists && records.length ? "managed-update" : "missing", expectedDigest: sha256("loader\n"), ...(loaderExists ? { existingDigest: sha256(await readFile(path.join(loaderPath, "SKILL.md"))) } : {}) }] : [];
      const plan = { sourceKey: "fixture", sourceIdentity: options.sourceRoot, profile: options.profile, items, loaderTargets, cleanup: [], diagnostics: [], requiresConfirm: true };
      return { apiVersion: "arcforge-embedded-provider/v1", planDigest: sha256(JSON.stringify(plan)), plan, targetEvidence: [] };
    },
    async driftProvisioningPlan(options) {
      const envelope = await provider.createProvisioningPlan(options);
      const relation = records.find((item) => item.sourceRoot === options.sourceRoot);
      const items = [];
      for (const item of envelope.plan.items) {
        for (const destination of item.destinations) {
          const source = await readFile(path.join(options.sourceRoot, item.sourcePath, "SKILL.md"));
          let status = "missing";
          try { status = Buffer.compare(source, await readFile(path.join(destination.path, "SKILL.md"))) === 0 ? "same" : "changed"; } catch (error) { if (error.code !== "ENOENT") throw error; }
          items.push({ skill: item.skill, kind: "skill", status, sourcePath: path.join(options.sourceRoot, item.sourcePath), targetPath: destination.path });
        }
      }
      for (const loader of envelope.plan.loaderTargets) items.push({ skill: "arcforge-on-demand", kind: "loader", status: loader.status === "same" ? "same" : loader.status === "managed-update" ? "changed" : "missing", sourcePath: "fixture-loader", targetPath: loader.path });
      const ambientRoot = path.join(options.homeDir, ".codex", "skills");
      const expected = new Set([...envelope.plan.items.flatMap((item) => item.destinations.filter((entry) => entry.kind === "user-agent").map((entry) => path.basename(entry.path))), ...(envelope.plan.loaderTargets.length ? ["arcforge-on-demand"] : [])]);
      const extras = (await readdir(ambientRoot, { withFileTypes: true }).catch(() => [])).filter((item) => item.isDirectory() && !expected.has(item.name)).map((item) => ({ name: item.name, kind: "skill", classification: "uncertain", targetPath: path.join(ambientRoot, item.name), reason: "unmanaged" }));
      return { profile: options.profile, targetDir: "", items, targetExtras: extras, policyDrift: envelope.plan.items.map((item) => ({ skill: item.skill, status: relation ? "same" : "changed", currentMode: item.effectiveMode, currentPaths: item.destinations.map((entry) => entry.path), reason: relation ? "same" : "new" })), availabilityPlan: envelope.plan };
    },
    async applyProvisioningPlan(options) {
      const fresh = await provider.createProvisioningPlan(options);
      if (fresh.planDigest !== options.expectedPlanDigest) throw new Error("plan changed after confirmation");
      if (state.failApply) throw new Error("fixture provider apply failed before commit");
      for (const item of fresh.plan.items) for (const destination of item.destinations) { await rm(destination.path, { recursive: true, force: true }); await cp(path.join(options.sourceRoot, item.sourcePath), destination.path, { recursive: true }); }
      for (const loader of fresh.plan.loaderTargets) { await mkdir(loader.path, { recursive: true }); await writeFile(path.join(loader.path, "SKILL.md"), "loader\n"); }
      const index = records.findIndex((item) => item.sourceRoot === options.sourceRoot);
      const record = { id: "fixture-relation", sourceRoot: options.sourceRoot, profile: options.profile, targetDir: "", skills: fresh.plan.items.map((item) => item.skill), managedSkillNames: fresh.plan.items.map((item) => item.skill), availabilityItems: fresh.plan.items.map((item) => ({ skill: item.skill, mode: item.effectiveMode, policyOrigin: "source", destinations: item.destinations.map((entry) => entry.path) })), updatedAt: new Date().toISOString() };
      if (index >= 0) records[index] = record; else records.push(record);
      return { result: { copied: fresh.plan.items.map((item) => item.skill) }, record };
    },
    async listProvisioningRelations(options) { return records.filter((item) => !options.sourceRoot || item.sourceRoot === options.sourceRoot); },
    async assessProvisioningUpgrade(options) {
      const drift = await provider.driftProvisioningPlan(options);
      const relation = records.find((item) => item.sourceRoot === options.sourceRoot);
      const managed = new Set(relation?.availabilityItems?.flatMap((item) => item.destinations) || []);
      if (relation?.availabilityItems?.some((item) => item.mode === "user-on-demand")) managed.add(path.join(options.homeDir, ".codex", "skills", "arcforge-on-demand"));
      const items = drift.items.filter((item) => item.status !== "same").map((item) => ({
        disposition: !managed.has(item.targetPath) ? "unmanaged-conflict" : item.status === "missing" ? "managed-repair" : item.kind === "loader" ? "managed-migration" : "unverified-managed",
        name: item.skill,
        kind: item.kind,
        path: item.targetPath,
        sourcePath: item.sourcePath,
        observedStatus: item.status,
        reason: "fixture assessment"
      }));
      for (const item of items) {
        if (item.observedStatus === "changed") item.observedDigest = sha256(await readFile(path.join(item.path, "SKILL.md")));
      }
      const blocking = items.filter((item) => ["unmanaged-conflict", "unverified-managed", "local-content-conflict"].includes(item.disposition));
      const base = { apiVersion: "arcforge-embedded-provider/v1", sourceRoot: options.sourceRoot, relationIds: relation ? [relation.id] : [], items, canProceed: blocking.length === 0, canBackupAndRestore: blocking.length > 0 && blocking.every((item) => item.disposition === "unverified-managed"), canBackupAndReinstall: blocking.length > 0 && blocking.every((item) => item.sourcePath), writeState: "not_started" };
      return { ...base, assessmentDigest: sha256(JSON.stringify(base)) };
    },
    async recoverProvisioningUpgrade(options) {
      const assessment = await provider.assessProvisioningUpgrade(options);
      if (assessment.assessmentDigest !== options.expectedAssessmentDigest) throw new Error("fixture assessment changed");
      if (options.action === "backup-and-restore" && !assessment.canBackupAndRestore) throw new Error("fixture managed recovery unavailable");
      if (options.action === "backup-and-reinstall" && !assessment.canBackupAndReinstall) throw new Error("fixture reinstall recovery unavailable");
      const backupPath = path.join(options.backupRoot, "fixture-backup");
      const restoredPaths = [];
      const originals = [];
      for (const item of assessment.items.filter((entry) => options.action === "backup-and-reinstall" ? ["unmanaged-conflict", "unverified-managed", "local-content-conflict"].includes(entry.disposition) : entry.disposition === "unverified-managed")) {
        const itemBackup = path.join(backupPath, item.name);
        await mkdir(path.dirname(itemBackup), { recursive: true });
        await cp(item.path, itemBackup, { recursive: true });
        originals.push({ target: item.path, backup: itemBackup });
        await rm(item.path, { recursive: true, force: true });
        await cp(item.sourcePath, item.path, { recursive: true });
        restoredPaths.push(item.path);
      }
      if (state.failRecoveryAfterReplace) {
        for (const item of originals.reverse()) {
          await rm(item.target, { recursive: true, force: true });
          await cp(item.backup, item.target, { recursive: true });
        }
        throw new Error("fixture recovery failed after replacement and rolled back");
      }
      if (options.action === "backup-and-reinstall") {
        const fresh = await provider.createProvisioningPlan(options);
        await provider.applyProvisioningPlan({ ...options, expectedPlanDigest: fresh.planDigest, confirm: true });
      }
      return { assessment, backupPath, restoredPaths };
    },
    async removeManagedProvisioning() { throw new Error("not used by fixture"); }
  };
  return Object.assign(state, { provider });
}

async function sameFile(file, expected) { try { return (await readFile(file, "utf8")) === expected; } catch (error) { if (error.code === "ENOENT") return false; throw error; } }
async function fileManifest(root) { const files = []; async function walk(directory) { for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const target = path.join(directory, entry.name); if (entry.isDirectory()) await walk(target); else if (entry.isFile()) files.push({ path: path.relative(root, target).replaceAll(path.sep, "/"), sha256: sha256(await readFile(target)) }); } } await walk(root); return files; }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
