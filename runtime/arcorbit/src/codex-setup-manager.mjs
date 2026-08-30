import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { win32 as pathWin32 } from "node:path";
import {
  compareCodexVersions,
  createCodexInstallAdvice,
  parseCodexVersion,
  runCodexOwnerUpdate
} from "./codex-installation-lifecycle.mjs";

const SNAPSHOT_VERSION = "arcorbit-codex-setup/v2";
const ACTIVE_CHAT_STATUSES = new Set(["starting", "running", "waiting_approval", "interrupting"]);
const INSTALLER_URLS = Object.freeze({
  darwin: "https://chatgpt.com/codex/install.sh",
  linux: "https://chatgpt.com/codex/install.sh",
  win32: "https://chatgpt.com/codex/install.ps1"
});
export const MAX_INSTALLER_RESPONSE_BYTES = 1024 * 1024;
const AUTH_METHODS = new Set(["chatgpt", "api-key", "access-token"]);
const WINDOWS_COMMAND_EXTENSIONS = new Set([".bat", ".cmd"]);
const WINDOWS_CODEX_COMMAND_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$codexCommand = $env:ARCORBIT_CODEX_SETUP_COMMAND",
  "$codexArgs = ConvertFrom-Json -InputObject $env:ARCORBIT_CODEX_SETUP_ARGS",
  "& $codexCommand @codexArgs",
  "exit $LASTEXITCODE"
].join("; ");

export function createCodexSetupManager(options = {}) {
  const platform = options.platform || process.platform;
  const env = { ...(options.env || process.env) };
  const probeExecutable = requiredFunction(options.probeExecutable, "probeExecutable");
  const preferStandalone = typeof options.preferStandalone === "function" ? options.preferStandalone : () => {};
  const activeOwners = typeof options.activeOwners === "function" ? options.activeOwners : async () => [];
  const processRunner = options.processRunner || runControlledProcess;
  const installerRunner = options.installerRunner || runOfficialInstaller;
  const getNetworkContext = typeof options.getNetworkContext === "function"
    ? options.getNetworkContext
    : async () => ({ env });
  const ownerResolver = typeof options.ownerResolver === "function"
    ? options.ownerResolver
    : async (installations) => installations;
  const capabilityInspector = typeof options.capabilityInspector === "function"
    ? options.capabilityInspector
    : async () => ({});
  const updateChecker = typeof options.updateChecker === "function"
    ? options.updateChecker
    : async (installation) => ({
        state: installation?.available && installation?.owner_confidence === "proven" && ["standalone", "npm", "homebrew"].includes(installation?.owner)
          ? "update-available"
          : "unknown",
        installed_version: installation?.version || "",
        latest_version: installation?.version || "",
        channel: "",
        checked_at: "",
        error: null
      });
  const receiptStore = options.receiptStore && typeof options.receiptStore.read === "function" && typeof options.receiptStore.record === "function"
    ? options.receiptStore
    : { read: async () => [], record: async () => undefined };
  const recheckReadiness = typeof options.recheckReadiness === "function" ? options.recheckReadiness : async () => undefined;
  const createOperationId = typeof options.createOperationId === "function" ? options.createOperationId : randomUUID;
  const listeners = new Set();
  let currentController = null;
  let currentOperationId = "";
  let operation = Promise.resolve();
  let snapshot = baseSnapshot();

  function emit() {
    const value = structuredClone(snapshot);
    for (const listener of listeners) listener(value);
  }

  function setSnapshot(value, { emitEvent = true } = {}) {
    snapshot = { ...value, schema_version: SNAPSHOT_VERSION, updated_at: new Date().toISOString() };
    if (emitEvent) emit();
    return structuredClone(snapshot);
  }

  async function inspect({ announce = true, operationContext = null, forceUpdate = false } = {}) {
    const previousAuthentication = snapshot.authentication || authenticationSnapshot("checking");
    const previousOperation = snapshot.operation;
    if (announce) setSnapshot({
      ...snapshot,
      status: "checking",
      update: { ...(snapshot.update || emptyUpdateSnapshot()), state: "checking", error: null },
      operation: null,
      error: null
    });
    announceVerificationStage(operationContext, "rechecking-executable");
    let versionStageAnnounced = false;
    const rawProbe = await safeProbe(probeExecutable, {
      onStage: (stage) => {
        if (stage !== "version") return;
        versionStageAnnounced = true;
        announceVerificationStage(operationContext, "rechecking-version");
      }
    });
    if (rawProbe.available && !versionStageAnnounced) announceVerificationStage(operationContext, "rechecking-version");
    const networkContext = await safeNetworkContext(getNetworkContext, env);
    const probe = await enrichProbe(rawProbe, {
      platform,
      env: networkContext.env,
      ownerResolver,
      capabilityInspector,
      updateChecker,
      receiptStore,
      processRunner,
      forceUpdate,
      fetchImpl: networkContext.fetchImpl
    });
    if (!probe.available) {
      const installationState = ["missing", "broken", "check-failed"].includes(probe.state)
        ? probe.state
        : probe.discovered
          ? "broken"
          : "check-failed";
      const inspectionError = installationState === "broken"
        ? setupErrorPayload(probe.errorCode || "CODEX_BROKEN", probe.summary, "executable")
        : installationState === "check-failed"
          ? setupErrorPayload(probe.errorCode || "CODEX_DISCOVERY_FAILED", probe.summary, "discovery")
          : null;
      return finishInspection({
        ...baseSnapshot(),
        status: installationState,
        installation: installationSnapshot(probe, installationState),
        authentication: authenticationSnapshot("unavailable"),
        error: inspectionError
      }, operationContext, probe);
    }

    const commandEnv = prependResolvedPath(networkContext.env, probe.pathEntries, platform);
    announceVerificationStage(operationContext, "rechecking-login-status");
    const [statusProbe, capabilityProbe] = await Promise.all([
      settleProcessProbe(processRunner, { ...buildCodexCommandSpec({ command: probe.command, args: ["login", "status"], env: commandEnv, platform }), timeout: 10_000 }),
      settleProcessProbe(processRunner, { ...buildCodexCommandSpec({ command: probe.command, args: ["login", "--help"], env: commandEnv, platform }), timeout: 10_000 })
    ]);
    const capabilityResult = capabilityProbe.result || {};
    const help = `${capabilityResult.stdout || ""}\n${capabilityResult.stderr || ""}`;
    const capabilities = {
      browser: true,
      device_auth: capabilityProbe.ok && capabilityResult.exitCode === 0 && help.includes("--device-auth"),
      api_key: true,
      access_token: capabilityProbe.ok && capabilityResult.exitCode === 0 && help.includes("--with-access-token")
    };
    if (!statusProbe.ok || !Number.isInteger(statusProbe.result?.exitCode)) {
      return finishInspection({
        ...baseSnapshot(),
        status: "login-failed",
        installation: installationSnapshot(probe, "installed"),
        authentication: { ...authenticationSnapshot("login-failed"), capabilities },
        error: setupErrorPayload("AUTH_STATUS_CHECK_FAILED", "Codex 登录状态复核失败，请重试。", "login-status")
      }, operationContext, probe);
    }

    const authenticated = statusProbe.result.exitCode === 0;
    const authenticationState = authenticated
      ? "authenticated"
      : previousOperation?.kind === "logout"
        ? "logged-out"
        : previousAuthentication.authenticated || previousAuthentication.state === "authenticated"
        ? "expired"
        : "logged-out";
    return finishInspection({
      ...baseSnapshot(),
      status: authenticated ? "ready" : "selection-required",
      installation: installationSnapshot(probe, "installed"),
      authentication: {
        ...authenticationSnapshot(authenticationState),
        capabilities
      }
    }, operationContext, probe);
  }

  async function finishInspection(value, operationContext, codexProbe) {
    if (operationContext) {
      announceVerificationStage(operationContext, "rechecking-readiness");
      await recheckReadiness({ codexProbe });
    }
    return setSnapshot({
      ...value,
      installations: structuredClone(codexProbe.installations || []),
      active_binding: codexProbe.installationId || "",
      install_advice: structuredClone(codexProbe.installAdvice || []),
      install_capabilities: structuredClone(codexProbe.installCapabilities || {}),
      update: structuredClone(codexProbe.update || emptyUpdateSnapshot())
    });
  }

  function runExclusive(task) {
    const next = operation.then(task, task);
    operation = next.catch(() => undefined);
    return next;
  }

  function announceVerificationStage(operationContext, phase) {
    if (!operationContext) return null;
    return setSnapshot({
      ...snapshot,
      status: "checking",
      operation: {
        kind: operationContext.kind,
        phase,
        started_at: operationContext.started_at,
        cancellable: false
      },
      error: null
    });
  }

  async function mutate(kind, task, { guardOwners = false, prepare = async () => undefined, revalidatePrepared, recheckOnFailure = false, validatePostcondition } = {}) {
    return runExclusive(async () => {
      if (currentController) throw setupError("OPERATION_ACTIVE", "已有 Codex Setup 操作正在进行。", "operation");
      let prepared = await prepare();
      if (guardOwners) {
        try {
          await assertNoActiveOwners(activeOwners);
        } catch (error) {
          if (error?.code === "CODEX_UPDATE_ACTIVE_TASKS") {
            setSnapshot({
              ...snapshot,
              operation: null,
              error: setupErrorPayload(error.code, error.message, error.stage, { owners: error.owners })
            });
          }
          throw error;
        }
      }
      if (typeof revalidatePrepared === "function") prepared = await revalidatePrepared(prepared);
      const controller = new AbortController();
      const operationId = String(createOperationId());
      const startedAt = new Date().toISOString();
      currentController = controller;
      currentOperationId = operationId;
      setSnapshot({ ...snapshot, status: operationStatus(kind), operation: { id: operationId, kind, phase: "starting", started_at: startedAt, cancellable: true }, error: null });
      try {
        await task({
          prepared,
          signal: controller.signal,
          progress: (phase, detail = {}) => setSnapshot({
            ...snapshot,
            operation: {
              id: operationId,
              kind,
              phase,
              started_at: startedAt,
              cancellable: true,
              ...(detail.device_auth ? { device_auth: { ...detail.device_auth } } : {})
            }
          })
        });
        currentController = null;
        currentOperationId = "";
        const checked = await inspect({ announce: false, operationContext: { kind, started_at: startedAt }, forceUpdate: kind === "update" });
        const validated = typeof validatePostcondition === "function" ? await validatePostcondition(checked, prepared) : null;
        return setSnapshot({ ...(validated || checked), operation: null });
      } catch (error) {
        currentController = null;
        currentOperationId = "";
        const cancelled = error?.name === "AbortError" || error?.code === "ABORT_ERR";
        if (recheckOnFailure) {
          const checked = await inspect({ announce: false, operationContext: { kind, started_at: startedAt } });
          if (kind !== "login") {
            return setSnapshot({
              ...checked,
              status: cancelled ? "cancelled" : failureStatus(kind),
              operation: null,
              error: setupErrorPayload(
                cancelled ? "OPERATION_CANCELLED" : (error?.code || "CODEX_SETUP_FAILED"),
                cancelled ? "操作已取消；已重新检查当前 Codex 状态。" : safeOperationMessage(kind, error?.code),
                kind
              )
            });
          }
          if (checked.status === "ready") return setSnapshot({ ...checked, operation: null, error: null });
          const statusCheckFailed = checked.status === "login-failed" && checked.error?.code === "AUTH_STATUS_CHECK_FAILED";
          return setSnapshot({
            ...checked,
            status: "login-failed",
            authentication: {
              ...checked.authentication,
              state: "login-failed",
              authenticated: false
            },
            operation: null,
            error: statusCheckFailed
              ? checked.error
              : setupErrorPayload(
                  cancelled ? "OPERATION_CANCELLED" : (error?.code || "LOGIN_FAILED"),
                  cancelled ? "Codex 登录已取消；重新验证确认当前未登录。" : "Codex 登录未成功；重新验证确认当前未登录。",
                  kind
                )
          });
        }
        return setSnapshot({
          ...snapshot,
          status: cancelled ? "cancelled" : failureStatus(kind),
          operation: null,
          error: setupErrorPayload(cancelled ? "OPERATION_CANCELLED" : (error?.code || "CODEX_SETUP_FAILED"), cancelled ? "操作已取消，正在等待重新检查。" : safeOperationMessage(kind, error?.code), kind)
        });
      }
    });
  }

  async function install(input = {}) {
    return mutate("install", async ({ prepared, signal, progress }) => {
      if (prepared.method === "standalone") {
        await installerRunner({ platform, url: requireInstallerUrl(platform), signal, onProgress: progress, env: prepared.network.env, fetchImpl: prepared.network.fetchImpl });
        preferStandalone();
        return;
      }
      const args = prepared.method === "npm"
        ? ["install", "--global", "@openai/codex@latest"]
        : ["install", "--cask", "codex"];
      progress("executing");
      const result = await processRunner({ ...buildCodexCommandSpec({ command: prepared.executable, args, env: prepared.network.env, platform }), signal, timeout: 5 * 60_000 });
      if (result.exitCode !== 0) throw setupError("INSTALLER_FAILED", `${prepared.method} Codex 安装未成功完成。`, "install");
      progress("discovering");
    }, {
      guardOwners: true,
      prepare: async () => {
        const current = await inspect({ announce: false });
        if (current.installation.state !== "missing" && current.installation.state !== "broken") {
          throw setupError("INSTALL_NOT_REQUIRED", "Codex 已存在；请使用更新或显式迁移。", "install");
        }
        const requestedMethod = String(input.method || current.install_advice?.find((item) => item.suitability === "recommended")?.method || "standalone");
        const advice = current.install_advice?.find((item) => item.method === requestedMethod);
        if (!advice || advice.suitability === "blocked") throw setupError("INSTALL_METHOD_BLOCKED", "所选 Codex 安装方式不满足当前电脑的前置条件。", "install");
        const capability = current.install_capabilities?.[requestedMethod];
        return { method: requestedMethod, executable: capability?.executable || "", network: await safeNetworkContext(getNetworkContext, env) };
      },
      recheckOnFailure: true,
      validatePostcondition: async (checked, prepared) => {
        if (!checked.installation?.available) {
          throw setupError(
            "INSTALL_POSTCONDITION_FAILED",
            "Codex installer 已结束，但 ArcOrbit 仍未发现可运行的 Codex CLI。",
            "install"
          );
        }
        if (prepared.method !== "standalone" && checked.installation.owner !== prepared.method) {
          throw setupError("INSTALL_POSTCONDITION_CONFLICT", "Codex 已安装，但 active binding 与所选安装方式不一致。", "install");
        }
        if (prepared.method === "standalone") {
          const recorded = await recordStandaloneReceipt(receiptStore, checked.installation);
          return recorded ? inspect({ announce: false }) : checked;
        }
        return checked;
      }
    });
  }

  async function update() {
    return mutate("update", async ({ prepared, signal, progress }) => {
      await runCodexOwnerUpdate({
        installation: prepared.installation,
        platform,
        env: prepared.network.env,
        signal,
        processRunner,
        installerRunner,
        installerUrl: requireInstallerUrl(platform),
        fetchImpl: prepared.network.fetchImpl,
        onProgress: progress
      });
      if (prepared.installation.owner === "standalone") preferStandalone();
    }, {
      guardOwners: true,
      prepare: async () => {
        const current = await inspect({ announce: false, forceUpdate: true });
        if (!current.installation.available || current.installation.owner_confidence !== "proven" || !["standalone", "npm", "homebrew"].includes(current.installation.owner)) {
          throw setupError("CODEX_EXTERNAL_INSTALLATION", "仅 proven standalone、npm 或 Homebrew installation 可由 ArcOrbit 直接更新。", "update");
        }
        if (current.update?.state === "up-to-date") throw setupError("UPDATE_NOT_REQUIRED", "当前 Codex 已是 owner channel 的最新版本。", "update");
        if (current.update?.state !== "update-available") throw setupError("UPDATE_CHECK_REQUIRED", "需要先成功确认同一 owner channel 的更新版本。", "update");
        return { installation: { ...current.installation }, targetVersion: current.update.latest_version, network: await safeNetworkContext(getNetworkContext, env) };
      },
      revalidatePrepared: async (prepared) => {
        const fresh = await inspect({ announce: false });
        if (fresh.installation.id !== prepared.installation.id
          || fresh.installation.execution_scope !== prepared.installation.execution_scope
          || fresh.installation.owner !== prepared.installation.owner
          || fresh.installation.owner_identity !== prepared.installation.owner_identity
          || fresh.installation.version !== prepared.installation.version) {
          throw setupError("UPDATE_TARGET_CHANGED", "Codex active binding 在更新开始前发生变化；请重新检查并确认。", "update");
        }
        return { ...prepared, network: await safeNetworkContext(getNetworkContext, env) };
      },
      recheckOnFailure: true,
      validatePostcondition: async (checked, prepared) => {
        const comparison = compareCodexVersions(checked.installation?.version, prepared.targetVersion);
        if (!checked.installation?.available
          || checked.installation.id !== prepared.installation.id
          || checked.installation.owner !== prepared.installation.owner
          || checked.installation.owner_confidence !== "proven"
          || comparison === null
          || comparison < 0) {
          throw setupError(
            "UPDATE_POSTCONDITION_FAILED",
            "Codex 更新已结束，但目标 installation、owner 或版本 postcondition 未成立。",
            "update"
          );
        }
        if (prepared.installation.owner === "standalone") await recordStandaloneReceipt(receiptStore, checked.installation);
        return checked;
      }
    });
  }

  async function migrateToStandalone() {
    return mutate("migrate", async ({ prepared, signal, progress }) => {
      await installerRunner({ platform, url: requireInstallerUrl(platform), signal, onProgress: progress, env: prepared.network.env, fetchImpl: prepared.network.fetchImpl });
      preferStandalone();
    }, {
      guardOwners: true,
      prepare: async () => {
        const current = await inspect({ announce: false });
        const inferredStandalone = current.installation.provenance === "standalone" && current.installation.owner_confidence !== "proven";
        if (!inferredStandalone && !["configured", "npm", "homebrew", "desktop-runtime", "unknown-external"].includes(current.installation.provenance)) {
          throw setupError("MIGRATION_NOT_REQUIRED", "当前 Codex 不需要迁移到 standalone。", "migrate");
        }
        return { network: await safeNetworkContext(getNetworkContext, env) };
      },
      recheckOnFailure: true,
      validatePostcondition: async (checked) => {
        if (!checked.installation?.available || checked.installation.provenance !== "standalone") {
          throw setupError(
            "MIGRATION_POSTCONDITION_FAILED",
            "standalone 已安装，但 ArcOrbit 仍未选择它；请处理 executable 配置或 PATH 冲突后重试。",
            "migrate"
          );
        }
        const recorded = await recordStandaloneReceipt(receiptStore, checked.installation);
        return recorded ? inspect({ announce: false }) : checked;
      }
    });
  }

  async function login(input = {}) {
    const method = String(input.method || "");
    const flow = String(input.flow || "");
    if (!AUTH_METHODS.has(method)) throw setupError("AUTH_METHOD_REQUIRED", "请选择一种 Codex 认证方式。", "login");
    return mutate("login", async ({ prepared: spec, signal, progress }) => {
      progress("authenticating");
      let deviceAuthOutput = "";
      const onOutput = method === "chatgpt" && flow === "device"
        ? ({ text }) => {
            deviceAuthOutput = boundedOutput(deviceAuthOutput, text);
            const deviceAuth = extractDeviceAuthChallenge(deviceAuthOutput);
            if (deviceAuth) progress("awaiting-device-auth", { device_auth: deviceAuth });
          }
        : undefined;
      let result;
      try {
        result = await processRunner({ ...spec, signal, timeout: 5 * 60_000, ...(onOutput ? { onOutput } : {}) });
      } finally {
        clearSensitiveStdin(spec.stdin);
      }
      if (result.exitCode !== 0) throw setupError("LOGIN_FAILED", "Codex 登录流程未成功完成。", "login");
    }, {
      prepare: async () => {
        const current = await inspect({ announce: false });
        if (!current.installation.available) throw setupError("CODEX_UNAVAILABLE", "请先安装可运行的 Codex CLI。", "login");
        const network = await safeNetworkContext(getNetworkContext, env);
        return buildCodexLoginSpec({ method, flow, secret: input.secret, snapshot: current, env: network.env, platform });
      },
      recheckOnFailure: true,
      validatePostcondition: (checked) => {
        if (checked.status !== "ready" || !checked.authentication?.authenticated) {
          throw setupError(
            "LOGIN_POSTCONDITION_FAILED",
            "Codex 登录流程已结束，但登录状态复核未确认认证成功。",
            "login"
          );
        }
      }
    });
  }

  async function logout() {
    return mutate("logout", async ({ prepared, signal }) => {
      const current = prepared.snapshot;
      const result = await processRunner({ ...buildCodexCommandSpec({
        command: current.installation.command,
        args: ["logout"],
        env: prependResolvedPath(prepared.network.env, current.installation.path_entries, platform),
        platform
      }), signal, timeout: 30_000 });
      if (result.exitCode !== 0) throw setupError("LOGOUT_FAILED", "Codex logout 未成功完成。", "logout");
    }, {
      guardOwners: true,
      prepare: async () => {
        const current = await inspect({ announce: false });
        if (!current.installation.available) throw setupError("CODEX_UNAVAILABLE", "未找到可运行的 Codex CLI。", "logout");
        return { snapshot: current, network: await safeNetworkContext(getNetworkContext, env) };
      },
      validatePostcondition: (checked) => {
        if (checked.status === "selection-required" && checked.authentication?.state === "logged-out") return;
        if (checked.error?.code) {
          throw setupError(checked.error.code, checked.error.message, checked.error.stage || "logout");
        }
        throw setupError(
          "LOGOUT_POSTCONDITION_FAILED",
          "Codex logout 后仍报告已认证；请重试退出。",
          "logout"
        );
      }
    });
  }

  function cancel(input = {}) {
    if (!currentController) throw setupError("OPERATION_NOT_ACTIVE", "当前没有可取消的 Codex Setup 操作。", "cancel");
    if (!input.operation_id || input.operation_id !== currentOperationId) {
      throw setupError("OPERATION_MISMATCH", "Codex Setup operation 已变化，请刷新状态后重试。", "cancel");
    }
    currentController.abort();
    return structuredClone(snapshot);
  }

  async function assertReady() {
    if (currentController || snapshot.operation) {
      throw setupError("CODEX_SETUP_NOT_READY", "Codex Setup 操作仍在进行。", "preflight");
    }
    const current = snapshot.status === "ready"
      ? structuredClone(snapshot)
      : await runExclusive(async () => {
          if (currentController || snapshot.operation) {
            throw setupError("CODEX_SETUP_NOT_READY", "Codex Setup 操作仍在进行。", "preflight");
          }
          return inspect();
        });
    if (current.status !== "ready") throw setupError("CODEX_SETUP_NOT_READY", "Codex CLI 尚未安装并完成认证。", "preflight");
    return current;
  }

  return {
    check: () => runExclusive(() => inspect()),
    checkUpdates: ({ force = true } = {}) => runExclusive(() => inspect({ forceUpdate: force })),
    getSnapshot: () => structuredClone(snapshot),
    install,
    update,
    migrateToStandalone,
    login,
    logout,
    cancel,
    assertReady,
    waitForIdle: async () => operation,
    onEvent(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}

export function codexProbeFromSetupSnapshot(snapshot = {}) {
  const installation = snapshot.installation || {};
  return {
    available: Boolean(installation.available),
    discovered: Boolean(installation.discovered),
    state: String(installation.state || "checking"),
    errorCode: String(snapshot.error?.code || ""),
    command: installation.available ? String(installation.command || "") : "",
    pathEntries: installation.available && Array.isArray(installation.path_entries) ? [...installation.path_entries] : [],
    provenance: installation.available ? String(installation.provenance || "unknown-external") : "none",
    summary: String(installation.version_summary || "")
  };
}

export function buildCodexLoginSpec({ method, flow = "", secret, snapshot, env = process.env, platform = process.platform } = {}) {
  const installation = snapshot?.installation || {};
  if (!installation.available || !installation.command) throw setupError("CODEX_UNAVAILABLE", "未找到可运行的 Codex CLI。", "login");
  const commandEnv = prependResolvedPath(env, installation.path_entries, platform);
  if (method === "chatgpt") {
    if (!flow) throw setupError("AUTH_FLOW_REQUIRED", "请选择系统浏览器或设备码登录。", "login");
    if (flow === "browser") return buildCodexCommandSpec({ command: installation.command, args: ["login"], env: commandEnv, platform });
    if (flow === "device" && snapshot.authentication?.capabilities?.device_auth) {
      return buildCodexCommandSpec({ command: installation.command, args: ["login", "--device-auth"], env: commandEnv, platform });
    }
    throw setupError("AUTH_FLOW_UNAVAILABLE", "当前 Codex 不支持所选 ChatGPT 登录流程。", "login");
  }
  if (method === "api-key" || method === "access-token") {
    const capability = method === "api-key" ? "api_key" : "access_token";
    if (!snapshot.authentication?.capabilities?.[capability]) throw setupError("AUTH_METHOD_UNAVAILABLE", "当前 Codex 不支持所选凭证方式。", "login");
    const value = String(secret || "");
    if (!value) throw setupError("SECRET_REQUIRED", "请输入凭证后继续。", "login");
    return buildCodexCommandSpec({
      command: installation.command,
      args: ["login", method === "api-key" ? "--with-api-key" : "--with-access-token"],
      env: commandEnv,
      platform,
      stdin: Buffer.from(`${value}\n`, "utf8")
    });
  }
  throw setupError("AUTH_METHOD_REQUIRED", "请选择一种 Codex 认证方式。", "login");
}

export function buildCodexCommandSpec({ command, args = [], env = process.env, platform = process.platform, stdin } = {}) {
  const extension = platform === "win32" ? pathWin32.extname(command).toLowerCase() : "";
  if (platform === "win32" && WINDOWS_COMMAND_EXTENSIONS.has(extension)) {
    const systemRootKey = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === "SYSTEMROOT");
    const systemRoot = systemRootKey ? String(env[systemRootKey] || "") : "";
    return {
      command: systemRoot ? pathWin32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe") : "powershell.exe",
      args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", WINDOWS_CODEX_COMMAND_SCRIPT],
      env: { ...env, ARCORBIT_CODEX_SETUP_COMMAND: command, ARCORBIT_CODEX_SETUP_ARGS: JSON.stringify(args) },
      windowsHide: true,
      ...(stdin === undefined ? {} : { stdin })
    };
  }
  return { command, args, env, windowsHide: platform === "win32", ...(stdin === undefined ? {} : { stdin }) };
}

export function extractDeviceAuthChallenge(output = "") {
  const sanitized = stripTerminalControlSequences(String(output));
  const verificationUrl = (sanitized.match(/https:\/\/[^\s<>"'`]+/giu) || [])
    .map(normalizeDeviceAuthUrl)
    .find(Boolean) || "";
  const userCode = sanitized.match(/\b[A-Z0-9]{4,8}(?:-[A-Z0-9]{4,8})+\b/u)?.[0] || "";
  if (!verificationUrl) return null;
  return { verification_url: verificationUrl, user_code: userCode };
}

export function buildOfficialInstallerSpec({ platform = process.platform, scriptPath, env = process.env } = {}) {
  if (platform === "win32") {
    return {
      command: "powershell.exe",
      args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      env,
      windowsHide: true
    };
  }
  if (platform === "darwin" || platform === "linux") {
    return { command: "/bin/sh", args: [scriptPath], env, windowsHide: false };
  }
  throw setupError("PLATFORM_UNSUPPORTED", `Codex standalone installer 不支持 ${platform}。`, "install");
}

export async function runOfficialInstaller({ platform = process.platform, url, signal, onProgress = () => {}, env = process.env, fetchImpl = globalThis.fetch, processRunner = runControlledProcess } = {}) {
  if (url !== requireInstallerUrl(platform)) throw setupError("INSTALLER_URL_INVALID", "installer URL 不在受控 allowlist。", "download");
  if (typeof fetchImpl !== "function") throw setupError("FETCH_UNAVAILABLE", "当前 Runtime 无法下载 Codex installer。", "download");
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "arcorbit-codex-installer-"));
  const scriptPath = path.join(tempRoot, platform === "win32" ? "install.ps1" : "install.sh");
  try {
    onProgress("downloading");
    let response;
    try {
      response = await fetchImpl(url, { redirect: "follow", signal, cache: "no-store", credentials: "omit" });
    } catch (error) {
      throw installerNetworkError(error);
    }
    if (!response.ok) throw setupError("INSTALLER_DOWNLOAD_FAILED", `installer 下载失败（HTTP ${response.status}）。`, "download");
    const installerBytes = await readBoundedInstallerResponse(response);
    await writeFile(scriptPath, installerBytes, { mode: 0o700 });
    if (platform !== "win32") await chmod(scriptPath, 0o700);
    onProgress("executing");
    const result = await processRunner({ ...buildOfficialInstallerSpec({ platform, scriptPath, env }), signal, timeout: 5 * 60_000 });
    if (result.exitCode !== 0) throw setupError("INSTALLER_FAILED", "Codex installer 未成功完成。", "install");
    onProgress("discovering");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function readBoundedInstallerResponse(response, maxBytes = MAX_INSTALLER_RESPONSE_BYTES) {
  const contentLength = response.headers?.get?.("content-length");
  if (contentLength !== null && contentLength !== undefined && contentLength !== "") {
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0) {
      throw setupError("INSTALLER_DOWNLOAD_FAILED", "installer 响应大小无效。", "download");
    }
    if (declaredBytes > maxBytes) throw installerResponseTooLarge();
  }

  const reader = response.body?.getReader?.();
  if (!reader) {
    throw setupError("INSTALLER_DOWNLOAD_FAILED", "installer 响应不支持受控流式读取。", "download");
  }

  const chunks = [];
  let receivedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      receivedBytes += chunk.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw installerResponseTooLarge();
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock?.();
  }
  return Buffer.concat(chunks, receivedBytes);
}

function installerResponseTooLarge() {
  return setupError("INSTALLER_RESPONSE_TOO_LARGE", "installer 响应超过允许的大小上限。", "download");
}

function installerNetworkError(error) {
  const code = String(error?.code || error?.cause?.code || "");
  if (/ENOTFOUND|EAI_AGAIN/iu.test(code)) return setupError("INSTALLER_DNS_FAILED", "installer 下载 DNS 解析失败。", "download");
  if (/PROXY/iu.test(code)) return setupError("INSTALLER_PROXY_FAILED", "installer 下载无法连接代理。", "download");
  if (/CERT|TLS|SSL/iu.test(code)) return setupError("INSTALLER_TLS_FAILED", "installer 下载 TLS 校验失败。", "download");
  return setupError("INSTALLER_NETWORK_FAILED", "installer 下载网络请求失败。", "download");
}

export function runControlledProcess({ command, args = [], env = process.env, stdin, signal, timeout = 30_000, windowsHide = true, onOutput } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, windowsHide, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    const stdinBuffer = stdin === undefined ? null : (Buffer.isBuffer(stdin) ? stdin : Buffer.from(String(stdin), "utf8"));
    let stdout = "";
    let stderr = "";
    let settled = false;
    let terminationError = null;
    let forceKillTimer = null;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(forceKillTimer);
      signal?.removeEventListener("abort", abort);
      clearSensitiveStdin(stdinBuffer);
      callback(value);
    };
    const terminate = (error) => {
      if (settled || terminationError) return;
      terminationError = error;
      child.kill();
      forceKillTimer = setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 2_000);
    };
    const abort = () => terminate(Object.assign(new Error("Operation cancelled."), { name: "AbortError", code: "ABORT_ERR" }));
    const timer = setTimeout(() => {
      terminate(Object.assign(new Error("Controlled process timed out."), { code: "PROCESS_TIMEOUT" }));
    }, timeout);
    child.stdout.on("data", (chunk) => {
      stdout = boundedOutput(stdout, chunk);
      notifyControlledOutput(onOutput, "stdout", chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = boundedOutput(stderr, chunk);
      notifyControlledOutput(onOutput, "stderr", chunk);
    });
    child.once("error", (error) => finish(reject, error));
    child.once("close", (exitCode, childSignal) => {
      if (terminationError) return finish(reject, terminationError);
      finish(resolve, { exitCode: Number.isInteger(exitCode) ? exitCode : 1, signal: childSignal || "", stdout, stderr });
    });
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (stdinBuffer) child.stdin.end(stdinBuffer, () => clearSensitiveStdin(stdinBuffer));
    else child.stdin.end();
  });
}

function clearSensitiveStdin(stdin) {
  if (Buffer.isBuffer(stdin)) stdin.fill(0);
}

export function activeCodexOwnersFromStore(store = {}) {
  const automation = Object.values(store.automation?.active_executions || {}).map((item) => ({ kind: "automation", id: String(item.execution_id || item.task_id || "active") }));
  const chats = Object.values(store.sessions || {}).flat()
    .filter((session) => session?.kind === "chat" && ACTIVE_CHAT_STATUSES.has(session.status))
    .map((session) => ({ kind: "chat", id: String(session.id || "active") }));
  return [...automation, ...chats];
}

async function assertNoActiveOwners(provider) {
  const owners = await provider();
  if (Array.isArray(owners) && owners.length > 0) {
    const ownerRefs = normalizeOwnerRefs(owners);
    throw setupError(
      "CODEX_UPDATE_ACTIVE_TASKS",
      `仍有 ${owners.length} 个活动 Codex owner；请先结束相关 Chat 或 Automation。`,
      "owner-guard",
      { owners: ownerRefs }
    );
  }
}

function normalizeOwnerRefs(owners) {
  const refs = [];
  const seen = new Set();
  for (const owner of owners) {
    const kind = String(owner?.kind || "").trim().toLowerCase();
    const id = String(owner?.id || "").replace(/[\u0000-\u001F\u007F]/gu, "").trim().slice(0, 160);
    if (!new Set(["automation", "chat", "codex"]).has(kind) || !id) continue;
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ kind, id });
  }
  return refs;
}

function baseSnapshot() {
  return {
    schema_version: SNAPSHOT_VERSION,
    status: "checking",
    installation: installationSnapshot({}, "checking"),
    installations: [],
    active_binding: "",
    install_advice: [],
    install_capabilities: {},
    update: emptyUpdateSnapshot(),
    authentication: authenticationSnapshot("checking"),
    operation: null,
    error: null,
    updated_at: new Date().toISOString()
  };
}

function normalizeDeviceAuthUrl(candidate) {
  try {
    const value = new URL(String(candidate).replace(/[),.;!?]+$/u, ""));
    const hostname = value.hostname.toLowerCase();
    const officialHost = hostname === "openai.com" || hostname.endsWith(".openai.com")
      || hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com");
    return value.protocol === "https:" && officialHost ? value.toString() : "";
  } catch {
    return "";
  }
}

function stripTerminalControlSequences(value) {
  return value
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/gu, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "");
}

function notifyControlledOutput(listener, stream, chunk) {
  if (typeof listener !== "function") return;
  try {
    listener({ stream, text: String(chunk) });
  } catch {
    // Process output observers cannot alter the controlled child lifecycle.
  }
}

function installationSnapshot(probe = {}, state = "checking") {
  const discovered = Boolean(probe.discovered || probe.command);
  const owner = discovered ? String(probe.owner || probe.provenance || "unknown-external") : "none";
  const ownerConfidence = discovered ? String(probe.ownerConfidence || probe.owner_confidence || "unknown") : "unknown";
  return {
    id: discovered ? String(probe.installationId || probe.id || "") : "",
    execution_scope: discovered ? String(probe.executionScope || probe.execution_scope || `native:${process.platform}`) : "",
    state,
    available: Boolean(probe.available),
    discovered,
    command: discovered ? String(probe.command || "") : "",
    path_entries: discovered ? [...(probe.pathEntries || [])] : [],
    provenance: owner,
    owner,
    owner_confidence: ownerConfidence,
    owner_identity: discovered ? String(probe.ownerIdentity || probe.owner_identity || "") : "",
    owner_executable: discovered ? String(probe.ownerExecutable || probe.owner_executable || "") : "",
    version: String(probe.version || parseCodexVersion(probe.summary)?.value || ""),
    version_summary: String(probe.summary || ""),
    can_install: state === "missing" || state === "broken",
    can_update: Boolean(probe.available && ownerConfidence === "proven" && ["standalone", "npm", "homebrew"].includes(owner) && probe.update?.state === "update-available"),
    can_migrate: Boolean(probe.available && (["configured", "desktop-runtime", "unknown-external"].includes(owner) || ownerConfidence !== "proven"))
  };
}

function authenticationSnapshot(state) {
  return { state, authenticated: state === "authenticated", method: "", capabilities: { browser: true, device_auth: false, api_key: true, access_token: false } };
}

function prependResolvedPath(env, entries = [], platform = process.platform) {
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === "PATH") || "PATH";
  const delimiter = platform === "win32" ? ";" : ":";
  const prefix = [...new Set(entries.map(String).filter(Boolean))].join(delimiter);
  return { ...env, [key]: [prefix, env?.[key] || ""].filter(Boolean).join(delimiter) };
}

function requireInstallerUrl(platform) {
  const url = INSTALLER_URLS[platform];
  if (!url) throw setupError("PLATFORM_UNSUPPORTED", `Codex standalone installer 不支持 ${platform}。`, "install");
  return url;
}

async function safeProbe(probe, input) {
  try {
    const result = await probe(input);
    return result?.available
      ? { ...result, available: true }
      : {
          ...result,
          available: false,
          discovered: Boolean(result?.discovered || result?.command),
          state: result?.state || (result?.discovered || result?.command ? "broken" : "missing"),
          summary: result?.summary || "未找到 Codex CLI。"
        };
  } catch (error) {
    return {
      available: false,
      discovered: false,
      state: error?.code === "ENOENT" ? "missing" : "check-failed",
      errorCode: error?.code === "ENOENT" ? "CODEX_NOT_FOUND" : "CODEX_DISCOVERY_FAILED",
      summary: error?.code === "ENOENT" ? "未找到 Codex CLI。" : "Codex executable 检测失败，请重新检测。"
    };
  }
}

async function enrichProbe(probe, {
  platform,
  env,
  ownerResolver,
  capabilityInspector,
  updateChecker,
  receiptStore,
  processRunner,
  forceUpdate,
  fetchImpl
}) {
  const legacyInstallation = probe.discovered || probe.command
    ? [{
        id: String(probe.installationId || "legacy-active"),
        execution_scope: String(probe.executionScope || `native:${platform}`),
        platform,
        available: Boolean(probe.available),
        discovered: Boolean(probe.discovered || probe.command),
        state: probe.available ? "ready" : probe.state || "broken",
        command: String(probe.command || ""),
        path_entries: [...(probe.pathEntries || [])],
        owner: String(probe.provenance || "unknown-external"),
        provenance: String(probe.provenance || "unknown-external"),
        owner_confidence: String(probe.ownerConfidence || (probe.installations ? "inferred" : probe.provenance === "standalone" ? "proven" : "inferred")),
        owner_identity: String(probe.ownerIdentity || ""),
        owner_executable: String(probe.ownerExecutable || ""),
        version: String(probe.version || parseCodexVersion(probe.summary)?.value || ""),
        version_summary: String(probe.summary || ""),
        active: true,
        selection_reason: "兼容单 installation probe。"
      }]
    : [];
  const rawInstallations = Array.isArray(probe.installations) ? probe.installations : legacyInstallation;
  let installations = rawInstallations;
  try {
    installations = await ownerResolver(rawInstallations, {
      platform,
      env,
      processRunner,
      receipts: await receiptStore.read()
    });
  } catch {
    installations = rawInstallations;
  }
  const active = installations.find((item) => item.active && item.available)
    || installations.find((item) => item.available)
    || installations.find((item) => item.active)
    || installations[0];
  let installCapabilities = {};
  if (!active?.available) {
    try {
      installCapabilities = await capabilityInspector({ platform, env, processRunner });
    } catch {
      installCapabilities = {};
    }
  }
  const installAdvice = createCodexInstallAdvice({ platform, installations, capabilities: installCapabilities });
  const update = active
    ? await updateChecker(active, { force: forceUpdate, env, networkFetch: fetchImpl })
    : emptyUpdateSnapshot();
  if (!active) return { ...probe, installations, installAdvice, installCapabilities, update };
  return {
    ...probe,
    available: Boolean(active.available),
    discovered: true,
    state: active.available ? "ready" : active.state,
    command: active.command,
    pathEntries: [...(active.path_entries || [])],
    provenance: active.owner,
    owner: active.owner,
    ownerConfidence: active.owner_confidence,
    ownerIdentity: active.owner_identity,
    ownerExecutable: active.owner_executable,
    version: active.version,
    summary: active.version_summary,
    installationId: active.id,
    executionScope: active.execution_scope,
    installations: installations.map((item) => ({ ...item, active: item.id === active.id })),
    installAdvice,
    installCapabilities,
    update
  };
}

async function safeNetworkContext(provider, fallbackEnv) {
  try {
    const context = await provider();
    return { env: { ...(context?.env || fallbackEnv) }, ...(typeof context?.fetchImpl === "function" ? { fetchImpl: context.fetchImpl } : {}) };
  } catch {
    return { env: { ...fallbackEnv } };
  }
}

async function recordStandaloneReceipt(receiptStore, installation) {
  if (!installation?.id || !installation?.command) return false;
  return Boolean(await receiptStore.record({ id: installation.id, command: installation.command, version: installation.version }));
}

function emptyUpdateSnapshot() {
  return { state: "unknown", installed_version: "", latest_version: "", channel: "", checked_at: "", error: null };
}

async function settleProcessProbe(processRunner, spec) {
  try {
    return { ok: true, result: await processRunner(spec) };
  } catch (error) {
    return { ok: false, error };
  }
}

function operationStatus(kind) { return ({ install: "installing", update: "updating", migrate: "migrating", login: "login-in-progress", logout: "logout-in-progress" })[kind] || "working"; }
function failureStatus(kind) { return kind === "login" ? "login-failed" : kind === "logout" ? "logout-failed" : `${kind}-failed`; }
function safeOperationMessage(kind, code) {
  if (code === "MIGRATION_POSTCONDITION_FAILED") {
    return "standalone 已安装，但 ArcOrbit 仍未选择它；请处理 executable 配置或 PATH 冲突后重试。";
  }
  if (code === "LOGOUT_POSTCONDITION_FAILED") {
    return "Codex logout 后仍报告已认证；请重试退出。";
  }
  if (code === "INSTALLER_DNS_FAILED") return "Codex installer 下载 DNS 解析失败；请检查代理或网络后重试。";
  if (code === "INSTALLER_PROXY_FAILED") return "Codex installer 无法连接 ArcOrbit 代理；请核对代理设置后重试。";
  if (code === "INSTALLER_TLS_FAILED") return "Codex installer TLS 校验失败；请检查代理证书或系统时间。";
  if (code === "INSTALLER_NETWORK_FAILED") return "Codex installer 网络请求失败；请检查代理或网络后重试。";
  return ({ install: "Codex 安装未成功完成。", update: "Codex 更新未成功完成。", migrate: "Codex standalone 迁移未成功完成。", login: "Codex 登录未成功完成。", logout: "Codex logout 未成功完成。" })[kind] || "Codex Setup 操作未成功完成。";
}
function setupError(code, message, stage, details = {}) { return Object.assign(new Error(message), { code, stage, ...details }); }
function setupErrorPayload(code, message, stage, details = {}) { return { code, message, stage, ...details }; }
function requiredFunction(value, name) { if (typeof value !== "function") throw new TypeError(`${name} must be a function.`); return value; }
function boundedOutput(current, chunk) { return `${current}${String(chunk)}`.slice(-32_000); }
