import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { posix as pathPosix, win32 as pathWin32 } from "node:path";

const MUTABLE_OWNERS = new Set(["standalone", "npm", "homebrew"]);
const UPDATE_STATES = new Set([
  "unknown",
  "checking",
  "up-to-date",
  "update-available",
  "ahead-of-channel",
  "channel-mismatch",
  "owner-conflict",
  "check-failed",
  "unsupported-owner"
]);
const RELEASE_CHANNEL_URL = "https://releases.openai.com/codex/channels/latest";

export function parseCodexVersion(value) {
  const match = String(value || "").match(/(?:^|[^0-9])(?:rust-v|v)?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?=$|[^0-9A-Za-z.-])/u);
  if (!match) return null;
  const prerelease = match[4] ? match[4].split(".").filter(Boolean) : [];
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
    value: `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}${prerelease.length ? `-${prerelease.join(".")}` : ""}`
  };
}

export function compareCodexVersions(leftValue, rightValue) {
  const left = typeof leftValue === "object" && leftValue ? leftValue : parseCodexVersion(leftValue);
  const right = typeof rightValue === "object" && rightValue ? rightValue : parseCodexVersion(rightValue);
  if (!left || !right) return null;
  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  }
  if (left.prerelease.length === 0 && right.prerelease.length > 0) return 1;
  if (right.prerelease.length === 0 && left.prerelease.length > 0) return -1;
  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index += 1) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumber = /^\d+$/u.test(leftPart) ? Number(leftPart) : null;
    const rightNumber = /^\d+$/u.test(rightPart) ? Number(rightPart) : null;
    if (leftNumber !== null && rightNumber !== null) return leftNumber > rightNumber ? 1 : -1;
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart.localeCompare(rightPart) > 0 ? 1 : -1;
  }
  return 0;
}

export function buildCodexSetupNetworkEnv(baseEnv = process.env, proxy = {}) {
  const env = { ...baseEnv };
  if (!proxy?.enabled || !String(proxy.url || "").trim()) return env;
  const proxyUrl = String(proxy.url).trim();
  const noProxy = String(proxy.no_proxy || proxy.noProxy || readEnv(env, "NO_PROXY") || "").trim();
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) env[key] = proxyUrl;
  if (noProxy) {
    env.NO_PROXY = noProxy;
    env.no_proxy = noProxy;
  }
  return env;
}

export function createCodexInstallAdvice({ platform = process.platform, installations = [], capabilities = {} } = {}) {
  const healthy = installations.filter((item) => item.available && item.state === "ready");
  if (healthy.length > 0) {
    const active = healthy.find((item) => item.active) || healthy[0];
    return [{
      method: active.owner,
      suitability: "recommended",
      execution_scope: active.execution_scope,
      reason: "继续使用当前健康 installation 的同一 owner。",
      blockers: []
    }];
  }
  const advice = [{
    method: "standalone",
    suitability: ["darwin", "linux", "win32"].includes(platform) ? "recommended" : "blocked",
    execution_scope: `native:${platform}`,
    reason: "无需预装 Node、npm 或 Homebrew，使用 OpenAI 官方 standalone installer。",
    blockers: ["darwin", "linux", "win32"].includes(platform) ? [] : ["platform-unsupported"]
  }];
  advice.push(capabilityAdvice("npm", capabilities.npm, "已检测到可用且全局目标可写的 npm。", platform));
  advice.push(platform === "darwin"
    ? capabilityAdvice("homebrew", capabilities.homebrew, "已检测到健康 Homebrew 与 Codex cask。", platform)
    : { method: "homebrew", suitability: "blocked", execution_scope: `native:${platform}`, reason: "Homebrew Codex cask 仅适用于 macOS。", blockers: ["platform-unsupported"] });
  if (platform === "win32") {
    advice.push({
      method: "wsl",
      suitability: capabilities.wsl?.distro ? "available" : "blocked",
      execution_scope: capabilities.wsl?.distro ? `wsl:${capabilities.wsl.distro}` : "wsl:selection-required",
      reason: capabilities.wsl?.distro ? "仅在明确选择的 WSL distro 内安装和运行。" : "必须先明确选择 WSL distro。",
      blockers: capabilities.wsl?.distro ? [] : ["wsl-distro-required"]
    });
  }
  return advice;
}

export async function inspectCodexOwnerCapabilities({ platform = process.platform, env = process.env, processRunner, accessFile = access } = {}) {
  const npm = await inspectNpmCapability({ platform, env, processRunner, accessFile });
  const homebrew = platform === "darwin"
    ? await inspectHomebrewCapability({ platform, env, processRunner, accessFile })
    : { available: false, blockers: ["platform-unsupported"] };
  return { npm, homebrew };
}

export async function resolveCodexInstallationOwners({ installations = [], platform = process.platform, env = process.env, processRunner, receipts = [] } = {}) {
  const results = [];
  for (const installation of installations) {
    const hint = installation.owner || installation.provenance || "unknown-external";
    const fallback = {
      owner: hint,
      owner_confidence: installation.owner_confidence || "inferred",
      owner_identity: installation.owner_identity || "",
      owner_executable: installation.owner_executable || ""
    };
    const proofs = [];
    const receipt = receipts.find((item) => samePath(item.command, installation.command, platform));
    if (receipt) proofs.push({ owner: "standalone", owner_confidence: "proven", owner_identity: String(receipt.id || installation.id), owner_executable: "" });
    if (!new Set(["configured", "desktop-runtime"]).has(hint)) {
      const npmProof = await proveNpmOwner({ installation, platform, env, processRunner });
      if (npmProof.owner_confidence === "proven") proofs.push(npmProof);
      if (platform === "darwin") {
        const homebrewProof = await proveHomebrewOwner({ installation, platform, env, processRunner });
        if (homebrewProof.owner_confidence === "proven") proofs.push(homebrewProof);
      }
    }
    const uniqueProofs = [...new Map(proofs.map((proof) => [`${proof.owner}:${proof.owner_identity}`, proof])).values()];
    const proof = uniqueProofs.length === 1
      ? uniqueProofs[0]
      : uniqueProofs.length > 1
        ? { ...fallback, owner_confidence: "unknown", owner_identity: "", owner_executable: "", owner_conflict: true }
        : fallback;
    results.push({ ...installation, ...proof });
  }
  return results;
}

export function createCodexUpdateChecker({
  processRunner,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  ttlMs = 15 * 60_000
} = {}) {
  const cache = new Map();
  return async function checkUpdate(installation, { force = false, env = process.env, networkFetch = fetchImpl } = {}) {
    const key = `${installation.id || installation.command}:${installation.owner_identity || installation.owner}`;
    const cached = cache.get(key);
    if (!force && cached && now() - cached.checkedAt < ttlMs) return structuredClone(cached.value);
    const installedVersion = parseCodexVersion(installation.version || installation.version_summary)?.value || "";
    if (!installation.available) return updateSnapshot("unknown", installedVersion);
    if (installation.owner_confidence !== "proven" || !MUTABLE_OWNERS.has(installation.owner)) {
      return updateSnapshot(installation.owner_conflict ? "owner-conflict" : "unsupported-owner", installedVersion, "", ownerChannel(installation));
    }
    try {
      const latestVersion = await latestVersionForOwner(installation, { env, processRunner, fetchImpl: networkFetch });
      const comparison = compareCodexVersions(installedVersion, latestVersion);
      if (comparison === null) return updateSnapshot("channel-mismatch", installedVersion, latestVersion, ownerChannel(installation));
      const state = comparison < 0 ? "update-available" : comparison > 0 ? "ahead-of-channel" : "up-to-date";
      const value = updateSnapshot(state, installedVersion, latestVersion, ownerChannel(installation), new Date(now()).toISOString());
      cache.set(key, { checkedAt: now(), value });
      return structuredClone(value);
    } catch (error) {
      return updateSnapshot("check-failed", installedVersion, "", ownerChannel(installation), new Date(now()).toISOString(), classifyUpdateError(error));
    }
  };
}

export async function runCodexOwnerUpdate({ installation, platform = process.platform, env = process.env, signal, processRunner, installerRunner, installerUrl, fetchImpl, onProgress = () => {} } = {}) {
  if (installation.owner_confidence !== "proven") throw lifecycleError("CODEX_OWNER_UNPROVEN", "Codex owner 未被证明，不能执行更新。", "owner");
  if (installation.owner === "standalone") {
    return installerRunner({ platform, url: installerUrl, signal, onProgress, env, fetchImpl });
  }
  const adapter = ownerUpdateSpec(installation, { platform, env });
  onProgress("executing");
  const result = await processRunner({ ...adapter, signal, timeout: 5 * 60_000 });
  if (result.exitCode !== 0) throw lifecycleError("OWNER_UPDATE_FAILED", `${installation.owner} Codex 更新未成功完成。`, "update");
  onProgress("discovering");
  return result;
}

export function ownerUpdateSpec(installation, { platform = process.platform, env = process.env } = {}) {
  if (installation.owner === "npm" && installation.owner_executable) {
    return commandSpec(installation.owner_executable, ["install", "--global", "@openai/codex@latest"], { platform, env });
  }
  if (installation.owner === "homebrew" && installation.owner_executable) {
    return commandSpec(installation.owner_executable, ["upgrade", "--cask", "codex"], { platform, env });
  }
  throw lifecycleError("CODEX_OWNER_UNSUPPORTED", "当前 Codex owner 不支持由 ArcOrbit 更新。", "owner");
}

async function latestVersionForOwner(installation, { env, processRunner, fetchImpl }) {
  if (installation.owner === "standalone") {
    if (typeof fetchImpl !== "function") throw lifecycleError("UPDATE_FETCH_UNAVAILABLE", "无法查询 Codex release channel。", "update-check");
    const response = await fetchImpl(RELEASE_CHANNEL_URL, { redirect: "follow", cache: "no-store", credentials: "omit" });
    if (!response.ok) throw lifecycleError("UPDATE_HTTP_FAILED", `Codex release channel 返回 HTTP ${response.status}。`, "update-check");
    const payload = await response.json();
    const version = parseCodexVersion(payload?.tag_name || payload?.version || payload?.name)?.value;
    if (!version) throw lifecycleError("UPDATE_METADATA_INVALID", "Codex release channel metadata 无有效版本。", "update-check");
    return version;
  }
  if (installation.owner === "npm") {
    const result = await processRunner({ ...commandSpec(installation.owner_executable, ["view", "@openai/codex", "dist-tags.latest", "--json"], { platform: installation.platform || process.platform, env }), timeout: 30_000 });
    if (result.exitCode !== 0) throw lifecycleError("NPM_METADATA_FAILED", "npm registry 版本查询失败。", "update-check");
    const parsed = parseJson(result.stdout);
    const version = parseCodexVersion(typeof parsed === "string" ? parsed : parsed?.latest || result.stdout)?.value;
    if (!version) throw lifecycleError("NPM_METADATA_INVALID", "npm registry 未返回有效 Codex 版本。", "update-check");
    return version;
  }
  if (installation.owner === "homebrew") {
    const [outdatedResult, infoResult] = await Promise.all([
      processRunner({ ...commandSpec(installation.owner_executable, ["outdated", "--cask", "--json=v2", "codex"], { platform: "darwin", env }), timeout: 30_000 }),
      processRunner({ ...commandSpec(installation.owner_executable, ["info", "--cask", "codex", "--json=v2"], { platform: "darwin", env }), timeout: 30_000 })
    ]);
    if (outdatedResult.exitCode !== 0 || infoResult.exitCode !== 0 || !parseJson(outdatedResult.stdout)) {
      throw lifecycleError("HOMEBREW_METADATA_FAILED", "Homebrew cask 版本查询失败。", "update-check");
    }
    const payload = parseJson(infoResult.stdout);
    const cask = payload?.casks?.[0];
    const version = parseCodexVersion(cask?.version || cask?.installed?.[0]?.version)?.value;
    if (!version) throw lifecycleError("HOMEBREW_METADATA_INVALID", "Homebrew 未返回有效 Codex cask 版本。", "update-check");
    return version;
  }
  throw lifecycleError("CODEX_OWNER_UNSUPPORTED", "当前 Codex owner 没有更新查询 adapter。", "update-check");
}

async function proveNpmOwner({ installation, platform, env, processRunner }) {
  const npmExecutable = npmExecutableForInstallation(installation.command, platform);
  if (!npmExecutable || typeof processRunner !== "function") return inferredOwner(installation, "npm");
  try {
    const [prefixResult, packageResult] = await Promise.all([
      processRunner({ ...commandSpec(npmExecutable, ["prefix", "--global"], { platform, env }), timeout: 10_000 }),
      processRunner({ ...commandSpec(npmExecutable, ["ls", "--global", "@openai/codex", "--depth=0", "--json"], { platform, env }), timeout: 15_000 })
    ]);
    const prefix = String(prefixResult.stdout || "").trim();
    const packageJson = parseJson(packageResult.stdout);
    const packageRecord = packageJson?.dependencies?.["@openai/codex"];
    if (prefixResult.exitCode !== 0 || packageResult.exitCode !== 0 || !prefix || !packageRecord?.version || !pathWithinPrefix(installation.command, prefix, platform)) {
      return inferredOwner(installation, "npm");
    }
    return { owner: "npm", owner_confidence: "proven", owner_identity: `npm:${normalizePath(prefix, platform)}`, owner_executable: npmExecutable };
  } catch {
    return inferredOwner(installation, "npm");
  }
}

async function proveHomebrewOwner({ installation, platform, env, processRunner }) {
  if (platform !== "darwin" || typeof processRunner !== "function") return inferredOwner(installation, "homebrew");
  const brewExecutable = brewExecutableForInstallation(installation.command);
  try {
    const result = await processRunner({ ...commandSpec(brewExecutable, ["info", "--cask", "codex", "--json=v2"], { platform, env }), timeout: 15_000 });
    const cask = parseJson(result.stdout)?.casks?.[0];
    if (result.exitCode !== 0 || !Array.isArray(cask?.installed) || cask.installed.length === 0 || !pathWithinPrefix(installation.command, brewPrefix(brewExecutable), platform)) {
      return inferredOwner(installation, "homebrew");
    }
    return { owner: "homebrew", owner_confidence: "proven", owner_identity: `homebrew:${brewPrefix(brewExecutable)}`, owner_executable: brewExecutable };
  } catch {
    return inferredOwner(installation, "homebrew");
  }
}

async function inspectNpmCapability({ platform, env, processRunner, accessFile }) {
  const npmExecutable = await firstAccessibleCommand("npm", { platform, env, accessFile });
  if (!npmExecutable || typeof processRunner !== "function") return { available: false, blockers: ["npm-unavailable"] };
  try {
    const prefixResult = await processRunner({ ...commandSpec(npmExecutable, ["prefix", "--global"], { platform, env }), timeout: 10_000 });
    const prefix = String(prefixResult.stdout || "").trim();
    if (prefixResult.exitCode !== 0 || !prefix) return { available: false, executable: npmExecutable, blockers: ["npm-prefix-unavailable"] };
    await accessFile(platform === "win32" ? prefix : pathPosix.join(prefix, "bin"), constants.W_OK);
    return { available: true, executable: npmExecutable, prefix, blockers: [] };
  } catch {
    return { available: false, executable: npmExecutable, blockers: ["npm-prefix-not-writable"] };
  }
}

async function inspectHomebrewCapability({ platform, env, processRunner, accessFile }) {
  const brewExecutable = await firstAccessibleCommand("brew", { platform, env, accessFile });
  if (!brewExecutable || typeof processRunner !== "function") return { available: false, blockers: ["homebrew-unavailable"] };
  try {
    const [prefixResult, caskResult] = await Promise.all([
      processRunner({ ...commandSpec(brewExecutable, ["--prefix"], { platform, env }), timeout: 10_000 }),
      processRunner({ ...commandSpec(brewExecutable, ["info", "--cask", "codex", "--json=v2"], { platform, env }), timeout: 15_000 })
    ]);
    const prefix = String(prefixResult.stdout || "").trim();
    if (prefixResult.exitCode !== 0 || caskResult.exitCode !== 0 || !prefix || !parseJson(caskResult.stdout)?.casks?.[0]) {
      return { available: false, executable: brewExecutable, blockers: ["homebrew-cask-unavailable"] };
    }
    await accessFile(prefix, constants.W_OK);
    return { available: true, executable: brewExecutable, prefix, blockers: [] };
  } catch {
    return { available: false, executable: brewExecutable, blockers: ["homebrew-prefix-not-writable"] };
  }
}

function updateSnapshot(state, installedVersion = "", latestVersion = "", channel = "", checkedAt = "", error = null) {
  return {
    state: UPDATE_STATES.has(state) ? state : "unknown",
    installed_version: installedVersion,
    latest_version: latestVersion,
    channel,
    checked_at: checkedAt,
    error
  };
}

function ownerChannel(installation) {
  if (installation.owner === "standalone") return "openai:stable";
  if (installation.owner === "npm") return `${installation.owner_identity || "npm"}:dist-tags.latest`;
  if (installation.owner === "homebrew") return `${installation.owner_identity || "homebrew"}:cask/codex`;
  return "";
}

function classifyUpdateError(error) {
  const code = String(error?.code || error?.cause?.code || "UPDATE_CHECK_FAILED");
  if (/ENOTFOUND|EAI_AGAIN/iu.test(code)) return updateError("UPDATE_DNS_FAILED", "Codex 更新检查 DNS 解析失败；请检查代理或网络后重试。");
  if (/PROXY/iu.test(code)) return updateError("UPDATE_PROXY_FAILED", "Codex 更新检查无法连接代理；请核对 ArcOrbit 代理设置。");
  if (/CERT|TLS|SSL/iu.test(code)) return updateError("UPDATE_TLS_FAILED", "Codex 更新检查 TLS 校验失败；请检查代理证书或系统时间。");
  if (/ECONN|ETIMEDOUT|FETCH/iu.test(code)) return updateError("UPDATE_NETWORK_FAILED", "Codex 更新检查网络请求失败；请检查代理或网络后重试。");
  return updateError(code, "Codex 更新检查失败；当前已安装版本仍可继续使用。");
}

function updateError(code, message) {
  return { code, stage: "update-check", message };
}

function commandSpec(command, args, { platform, env }) {
  const extension = platform === "win32" ? pathWin32.extname(command).toLowerCase() : "";
  if (platform === "win32" && new Set([".cmd", ".bat"]).has(extension)) {
    const systemRoot = readEnv(env, "SYSTEMROOT");
    const script = "$ErrorActionPreference='Stop'; $c=$env:ARCORBIT_OWNER_COMMAND; $a=ConvertFrom-Json $env:ARCORBIT_OWNER_ARGS; & $c @a; exit $LASTEXITCODE";
    return {
      command: systemRoot ? pathWin32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe") : "powershell.exe",
      args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
      env: { ...env, ARCORBIT_OWNER_COMMAND: command, ARCORBIT_OWNER_ARGS: JSON.stringify(args) },
      windowsHide: true
    };
  }
  return { command, args, env, windowsHide: platform === "win32" };
}

function npmExecutableForInstallation(command, platform) {
  const pathApi = platform === "win32" ? pathWin32 : pathPosix;
  const directory = pathApi.dirname(command);
  return pathApi.join(directory, platform === "win32" ? "npm.cmd" : "npm");
}

function brewExecutableForInstallation(command) {
  return String(command).startsWith("/opt/homebrew/") ? "/opt/homebrew/bin/brew" : "/usr/local/bin/brew";
}

function brewPrefix(executable) {
  return executable.startsWith("/opt/homebrew/") ? "/opt/homebrew" : "/usr/local";
}

async function firstAccessibleCommand(command, { platform, env, accessFile }) {
  const pathApi = platform === "win32" ? pathWin32 : pathPosix;
  const delimiter = platform === "win32" ? ";" : ":";
  const extensions = platform === "win32" ? [".cmd", ".exe", ".bat", ""] : [""];
  for (const directory of readEnv(env, "PATH").split(delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = pathApi.join(directory, `${command}${extension}`);
      try {
        await accessFile(candidate, platform === "win32" ? constants.F_OK : constants.X_OK);
        return candidate;
      } catch {
        // A missing PATH candidate does not invalidate other candidates.
      }
    }
  }
  return "";
}

function capabilityAdvice(method, capability, reason, platform) {
  return {
    method,
    suitability: capability?.available ? "available" : "blocked",
    execution_scope: `native:${platform}`,
    reason: capability?.available ? reason : `${method} 前置能力或目标写权限不满足。`,
    blockers: capability?.available ? [] : [...(capability?.blockers || [`${method}-unavailable`])]
  };
}

function inferredOwner(installation, owner) {
  return { owner, owner_confidence: installation.owner_confidence || "inferred", owner_identity: "", owner_executable: "" };
}

function pathWithinPrefix(command, prefix, platform) {
  const normalizedCommand = normalizePath(command, platform);
  const normalizedPrefix = normalizePath(prefix, platform);
  const separator = platform === "win32" ? "\\" : "/";
  return normalizedCommand === normalizedPrefix || normalizedCommand.startsWith(`${normalizedPrefix}${separator}`);
}

function samePath(left, right, platform) {
  return normalizePath(left, platform) === normalizePath(right, platform);
}

function normalizePath(value, platform) {
  const normalized = (platform === "win32" ? pathWin32 : pathPosix).normalize(String(value || ""));
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

function parseJson(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function readEnv(env, name) {
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === name);
  return key ? String(env[key] || "") : "";
}

function lifecycleError(code, message, stage) {
  return Object.assign(new Error(message), { code, stage });
}

export const CODEX_RELEASE_CHANNEL_URL = RELEASE_CHANNEL_URL;
