import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import os from "node:os";
import { posix as pathPosix, win32 as pathWin32 } from "node:path";
import { promisify } from "node:util";
import { parseCodexVersion } from "./codex-installation-lifecycle.mjs";

const execFileAsync = promisify(execFile);
const WINDOWS_COMMAND_EXTENSIONS = new Set([".bat", ".cmd"]);
const TRANSIENT_VERSION_PROBE_CODES = new Set(["EAGAIN", "EBUSY", "ENOENT", "ETIMEDOUT", "ETXTBSY"]);
const WINDOWS_VERSION_PROBE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$probeCommand = $env:ARCORBIT_CODEX_PROBE_COMMAND",
  "$probeArgs = ConvertFrom-Json -InputObject $env:ARCORBIT_CODEX_PROBE_ARGS",
  "& $probeCommand @probeArgs",
  "exit $LASTEXITCODE"
].join("; ");

export function createCodexExecutableResolver(options = {}) {
  let resolved = null;
  let lastResolved = null;
  let standalonePreferred = false;

  return {
    async probe(input = {}) {
      const result = await resolveCodexExecutable({
        ...options,
        preferredCommand: standalonePreferred ? "" : lastResolved?.command,
        preferStandalone: standalonePreferred,
        onStage: input.onStage
      });
      resolved = result.available
        ? { command: result.command, pathEntries: [...result.pathEntries] }
        : null;
      if (resolved) lastResolved = resolved;
      return result;
    },
    getResolved() {
      if (!resolved) {
        throw new Error("Codex executable has not been resolved by Setup Readiness.");
      }
      return { command: resolved.command, pathEntries: [...resolved.pathEntries] };
    },
    preferStandalone() {
      standalonePreferred = true;
      resolved = null;
    }
  };
}

export async function resolveCodexExecutable({
  platform = process.platform,
  env = process.env,
  homeDir = os.homedir(),
  preferredCommand = "",
  preferStandalone = false,
  accessFile = defaultAccessFile,
  readDirectory = readdir,
  readShellPath = defaultReadShellPath,
  statFile = stat,
  runVersion = defaultRunVersion,
  wait = defaultWait,
  onStage
} = {}) {
  const pathApi = pathApiFor(platform);
  const discoveryIssues = [];
  notifyProbeStage(onStage, "executable");
  const candidates = await discoverCodexCandidates({
    platform,
    env,
    homeDir,
    preferredCommand,
    readDirectory,
    preferStandalone,
    statFile,
    onDiscoveryIssue: (issue) => discoveryIssues.push(issue)
  });
  const failures = [];
  const installations = [];
  const attempted = new Set();

  async function probeCandidates(candidatePaths, candidateEnv) {
    for (const candidate of candidatePaths) {
      const normalized = normalizeComparablePath(candidate, platform);
      if (!normalized || attempted.has(normalized)) continue;
      attempted.add(normalized);
      let accessible = false;
      try {
        accessible = await accessFile(candidate, platform);
      } catch (error) {
        discoveryIssues.push(discoveryIssue("access", error));
      }
      if (!accessible) continue;
      const pathEntries = [pathApi.dirname(candidate)];
      try {
        notifyProbeStage(onStage, "version");
        const version = await runVersionWithRetry(runVersion, candidate, {
          env: prependPathEntries(candidateEnv, pathEntries, { platform }),
          platform,
          wait
        });
        installations.push(createInstallationRecord({
          available: true,
          state: "ready",
          command: candidate,
          pathEntries,
          provenance: classifyCodexProvenance(candidate, { platform, env: candidateEnv, homeDir }),
          summary: version || "Codex 可用",
          platform
        }));
      } catch (error) {
        failures.push({ candidate, error, pathEntries, candidateEnv });
        installations.push(createInstallationRecord({
          available: false,
          state: "broken",
          command: candidate,
          pathEntries,
          provenance: classifyCodexProvenance(candidate, { platform, env: candidateEnv, homeDir }),
          summary: `Codex executable 已找到但无法运行：${candidate}: ${error?.message || String(error)}`,
          errorCode: "CODEX_EXECUTABLE_UNRUNNABLE",
          platform
        }));
      }
    }
  }

  await probeCandidates(candidates, env);

  if (platform !== "win32" && installations.length === 0) {
    try {
      const shellPath = String(await readShellPath({ platform, env, homeDir }) || "").trim();
      if (shellPath && shellPath !== readEnv(env, "PATH")) {
        const shellEnv = replacePath(env, shellPath);
        const configured = String(env.ARCORBIT_CODEX_BIN || env.ARCKIT_CODEX_BIN || "").trim();
        const shellCandidates = [
          ...(configured && !pathApi.isAbsolute(configured) ? commandCandidates(configured, { platform, env: shellEnv }) : []),
          ...commandCandidates("codex", { platform, env: shellEnv })
        ];
        await probeCandidates(shellCandidates, shellEnv);
      }
    } catch (error) {
      discoveryIssues.push(discoveryIssue("shell-path", error));
    }
  }

  const selected = installations.find((installation) => installation.available);
  if (selected) {
    const projectedInstallations = installations.map((installation) => ({
      ...installation,
      active: installation.id === selected.id,
      selection_reason: installation.id === selected.id
        ? "按显式配置、最近成功路径与发现顺序选中首个健康 installation。"
        : installation.available
          ? "健康 installation 被更高优先级候选遮蔽。"
          : "候选存在但版本探测失败。"
    }));
    return {
      available: true,
      discovered: true,
      state: "ready",
      errorCode: "",
      command: selected.command,
      pathEntries: [...selected.path_entries],
      provenance: selected.owner,
      ownerConfidence: selected.owner_confidence,
      version: selected.version,
      summary: selected.version_summary,
      installationId: selected.id,
      executionScope: selected.execution_scope,
      installations: projectedInstallations,
      discoveryIssues
    };
  }

  const firstFailure = failures[0];
  const state = firstFailure ? "broken" : discoveryIssues.length ? "check-failed" : "missing";
  return {
    available: false,
    discovered: Boolean(firstFailure),
    state,
    errorCode: state === "broken" ? "CODEX_EXECUTABLE_UNRUNNABLE" : state === "check-failed" ? "CODEX_DISCOVERY_FAILED" : "CODEX_NOT_FOUND",
    command: firstFailure?.candidate || "",
    pathEntries: firstFailure?.pathEntries || [],
    provenance: firstFailure
      ? classifyCodexProvenance(firstFailure.candidate, { platform, env: firstFailure.candidateEnv, homeDir })
      : "none",
    summary: firstFailure
      ? `Codex executable 已找到但无法运行：${firstFailure.candidate}: ${firstFailure.error?.message || String(firstFailure.error)}`
      : discoveryIssues.length
        ? "Codex executable 检测未完成；部分本机路径或 shell 环境无法读取，请重新检测。"
        : platform === "win32"
          ? "未找到可运行的 Codex。请安装 Codex CLI，或安装并启动一次 Codex Desktop 以准备本地运行时，然后重新检测。"
          : "未找到可运行的 Codex CLI。请确认 Codex 已安装到当前用户环境，然后重新检测。",
    installationId: installations[0]?.id || "",
    executionScope: installations[0]?.execution_scope || `native:${platform}`,
    ownerConfidence: installations[0]?.owner_confidence || "unknown",
    version: "",
    installations: installations.map((installation, index) => ({
      ...installation,
      active: index === 0,
      selection_reason: "候选存在但版本探测失败。"
    })),
    discoveryIssues
  };
}

function createInstallationRecord({ available, state, command, pathEntries, provenance, summary, errorCode = "", platform }) {
  const normalizedCommand = normalizeComparablePath(command, platform);
  return {
    id: `codex-${createHash("sha256").update(`${platform}\u0000${normalizedCommand}`).digest("hex").slice(0, 20)}`,
    execution_scope: `native:${platform}`,
    platform,
    available,
    discovered: true,
    state,
    command,
    path_entries: [...pathEntries],
    owner: provenance,
    provenance,
    owner_confidence: provenance === "unknown-external" ? "unknown" : "inferred",
    owner_identity: "",
    owner_executable: "",
    version: parseCodexVersion(summary)?.value || "",
    version_summary: String(summary || ""),
    error_code: errorCode,
    active: false,
    selection_reason: ""
  };
}

function notifyProbeStage(listener, stage) {
  if (typeof listener !== "function") return;
  try {
    listener(stage);
  } catch {
    // Progress observers cannot alter executable resolution.
  }
}

export async function discoverCodexCandidates({
  platform = process.platform,
  env = process.env,
  homeDir = os.homedir(),
  preferredCommand = "",
  readDirectory = readdir,
  preferStandalone = false,
  statFile = stat,
  onDiscoveryIssue
} = {}) {
  const pathApi = pathApiFor(platform);
  const candidates = [];
  const configured = String(env.ARCORBIT_CODEX_BIN || env.ARCKIT_CODEX_BIN || "").trim();
  const standaloneCandidates = platform === "win32"
    ? [
        pathApi.join(homeDir, ".local", "bin", "codex.exe"),
        pathApi.join(homeDir, ".local", "bin", "codex.cmd"),
        pathApi.join(homeDir, ".local", "bin", "codex")
      ]
    : [pathApi.join(homeDir, ".local", "bin", "codex")];
  if (preferStandalone) candidates.push(...standaloneCandidates);
  if (configured) {
    candidates.push(...(pathApi.isAbsolute(configured)
      ? [configured]
      : commandCandidates(configured, { platform, env })));
  }
  if (preferredCommand) candidates.push(preferredCommand);
  candidates.push(...commandCandidates("codex", { platform, env }));

  if (platform === "win32") {
    const roamingAppData = readEnv(env, "APPDATA") || pathWin32.join(homeDir, "AppData", "Roaming");
    candidates.push(pathWin32.join(roamingAppData, "npm", "codex.cmd"));
    if (!preferStandalone) candidates.push(...standaloneCandidates);
    candidates.push(...await optionalCandidates("windows-desktop", () => windowsDesktopCodexCandidates({ env, homeDir, readDirectory, statFile }), onDiscoveryIssue));
  } else {
    if (!preferStandalone) candidates.push(...standaloneCandidates);
    const pnpmHome = readEnv(env, "PNPM_HOME");
    const npmPrefix = readEnv(env, "NPM_CONFIG_PREFIX");
    candidates.push(
      pathApi.join(homeDir, ".volta", "bin", "codex"),
      pathApi.join(homeDir, ".bun", "bin", "codex"),
      pathApi.join(homeDir, ".asdf", "shims", "codex"),
      pathApi.join(homeDir, ".local", "share", "mise", "shims", "codex"),
      platform === "darwin" ? pathApi.join(homeDir, "Library", "pnpm", "codex") : pathApi.join(homeDir, ".local", "share", "pnpm", "codex"),
      ...(pnpmHome ? [pathApi.join(pnpmHome, "codex")] : []),
      ...(npmPrefix ? [pathApi.join(npmPrefix, "bin", "codex")] : []),
      "/opt/homebrew/bin/codex",
      "/usr/local/bin/codex"
    );
    candidates.push(...await optionalCandidates("nvm", () => nvmCandidates(homeDir, readDirectory, pathApi), onDiscoveryIssue));
    candidates.push(...await optionalCandidates("fnm", () => fnmCandidates(homeDir, readDirectory, pathApi), onDiscoveryIssue));
  }

  return [...new Set(candidates.map((candidate) => pathApi.resolve(candidate)))];
}

export function classifyCodexProvenance(command, {
  platform = process.platform,
  env = process.env,
  homeDir = os.homedir()
} = {}) {
  const pathApi = pathApiFor(platform);
  const normalized = normalizeComparablePath(command, platform);
  const configured = String(env.ARCORBIT_CODEX_BIN || env.ARCKIT_CODEX_BIN || "").trim();
  const configuredCandidates = configured
    ? (pathApi.isAbsolute(configured) ? [configured] : commandCandidates(configured, { platform, env }))
    : [];
  if (configuredCandidates.some((candidate) => normalized === normalizeComparablePath(candidate, platform))) {
    return "configured";
  }

  const standaloneRoot = normalizeComparablePath(pathApi.join(homeDir, ".local", "bin"), platform);
  if (normalized === standaloneRoot || normalized.startsWith(`${standaloneRoot}${platform === "win32" ? "\\" : "/"}`)) {
    return "standalone";
  }

  const roamingAppData = platform === "win32"
    ? readEnv(env, "APPDATA") || pathWin32.join(homeDir, "AppData", "Roaming")
    : "";
  const npmRoot = roamingAppData ? normalizeComparablePath(pathWin32.join(roamingAppData, "npm"), platform) : "";
  if ((npmRoot && (normalized === npmRoot || normalized.startsWith(`${npmRoot}\\`)))
    || /[\\/]\.nvm[\\/]|[\\/]\.fnm[\\/]|[\\/]\.volta[\\/]|[\\/]\.bun[\\/]|[\\/]\.asdf[\\/]|[\\/]mise[\\/]|[\\/]pnpm[\\/]|[\\/]node_modules[\\/]/i.test(normalized)) {
    return "npm";
  }

  if (platform === "win32") {
    const localAppData = readEnv(env, "LOCALAPPDATA") || pathWin32.join(homeDir, "AppData", "Local");
    const desktopRuntimeRoot = normalizeComparablePath(pathWin32.join(localAppData, "OpenAI", "Codex", "bin"), platform);
    if (normalized === desktopRuntimeRoot || normalized.startsWith(`${desktopRuntimeRoot}\\`)) {
      return "desktop-runtime";
    }
  }

  if (normalized.startsWith("/opt/homebrew/") || normalized.startsWith("/usr/local/homebrew/")) return "homebrew";
  if (platform === "darwin" && normalized === "/usr/local/bin/codex") return "homebrew";
  return "unknown-external";
}

export function prependPathEntries(env, entries, { platform = process.platform } = {}) {
  const delimiter = platform === "win32" ? ";" : ":";
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === "PATH") || "PATH";
  const current = String(env?.[key] || "");
  const prefixEntries = [...new Set((entries || []).map(String).filter(Boolean))];
  const comparablePrefix = new Set(prefixEntries.map((entry) => normalizeComparablePath(entry, platform)));
  const currentEntries = current.split(delimiter).filter((entry) => entry && !comparablePrefix.has(normalizeComparablePath(entry, platform)));
  return { ...env, [key]: [...prefixEntries, ...currentEntries].join(delimiter) };
}

export function buildCodexVersionProbeSpec({ command, platform = process.platform, env = process.env } = {}) {
  const extension = platform === "win32" ? pathWin32.extname(command).toLowerCase() : "";
  if (platform === "win32" && WINDOWS_COMMAND_EXTENSIONS.has(extension)) {
    const systemRoot = readEnv(env, "SYSTEMROOT");
    return {
      command: systemRoot
        ? pathWin32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
        : "powershell.exe",
      args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", WINDOWS_VERSION_PROBE_SCRIPT],
      env: {
        ...env,
        ARCORBIT_CODEX_PROBE_COMMAND: command,
        ARCORBIT_CODEX_PROBE_ARGS: JSON.stringify(["--version"])
      },
      windowsHide: true,
      launchMode: "windows-command-shim"
    };
  }
  return { command, args: ["--version"], env, windowsHide: false, launchMode: "direct" };
}

function commandCandidates(command, { platform, env }) {
  const pathApi = platform === "win32" ? pathWin32 : pathPosix;
  if (pathApi.isAbsolute(command) || command.includes("/") || command.includes("\\")) return [command];
  const pathValue = readEnv(env, "PATH");
  const delimiter = platform === "win32" ? ";" : ":";
  const directories = pathValue.split(delimiter).map((entry) => entry.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (platform !== "win32") return directories.map((directory) => pathApi.join(directory, command));
  const extensions = (readEnv(env, "PATHEXT") || ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .map((extension) => extension.trim())
    .filter(Boolean);
  return directories.flatMap((directory) => [
    ...extensions.map((extension) => pathWin32.join(directory, `${command}${extension.toLowerCase()}`)),
    pathWin32.join(directory, command)
  ]);
}

async function optionalCandidates(source, task, onDiscoveryIssue) {
  try {
    return await task();
  } catch (error) {
    if (typeof onDiscoveryIssue === "function") onDiscoveryIssue(discoveryIssue(source, error));
    return [];
  }
}

function discoveryIssue(source, error) {
  return { source, code: String(error?.code || "UNKNOWN") };
}

function replacePath(env, value) {
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === "PATH") || "PATH";
  return { ...env, [key]: value };
}

async function defaultReadShellPath({ platform, env }) {
  const shell = String(env?.SHELL || "").trim() || (platform === "darwin" ? "/bin/zsh" : "/bin/sh");
  const { stdout } = await execFileAsync(shell, ["-lc", "env"], {
    timeout: 3_000,
    env,
    windowsHide: true,
    maxBuffer: 512 * 1024
  });
  const pathLine = String(stdout || "").split(/\r?\n/u).reverse().find((line) => line.startsWith("PATH="));
  return pathLine ? pathLine.slice(5) : "";
}

async function runVersionWithRetry(runVersion, command, { env, platform, wait }) {
  try {
    return await runVersion(command, { env, platform });
  } catch (error) {
    if (!isTransientVersionProbeError(error)) throw error;
    await wait(150);
    return runVersion(command, { env, platform });
  }
}

function isTransientVersionProbeError(error) {
  return error?.killed === true || Boolean(error?.signal) || TRANSIENT_VERSION_PROBE_CODES.has(String(error?.code || "").toUpperCase());
}

function defaultWait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function windowsDesktopCodexCandidates({ env, homeDir, readDirectory, statFile }) {
  const localAppData = readEnv(env, "LOCALAPPDATA") || pathWin32.join(homeDir, "AppData", "Local");
  const binRoot = pathWin32.join(localAppData, "OpenAI", "Codex", "bin");
  const versioned = [];
  try {
    const entries = await readDirectory(binRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = pathWin32.join(binRoot, entry.name, "codex.exe");
      try {
        const metadata = await statFile(candidate);
        versioned.push({ candidate, modifiedAt: Number(metadata.mtimeMs || 0) });
      } catch (error) {
        if (error?.code !== "ENOENT" && error?.code !== "EACCES" && error?.code !== "EPERM") throw error;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT" && error?.code !== "EACCES" && error?.code !== "EPERM") throw error;
  }
  versioned.sort((left, right) => right.modifiedAt - left.modifiedAt || right.candidate.localeCompare(left.candidate));
  return [
    ...versioned.map((entry) => entry.candidate),
    pathWin32.join(binRoot, "codex.exe")
  ];
}

async function nvmCandidates(homeDir, readDirectory, pathApi = pathPosix) {
  const root = pathApi.join(homeDir, ".nvm", "versions", "node");
  const versions = await childDirectoryNames(root, readDirectory);
  return versions.sort(compareVersionNames).map((version) => pathApi.join(root, version, "bin", "codex"));
}

async function fnmCandidates(homeDir, readDirectory, pathApi = pathPosix) {
  const root = pathApi.join(homeDir, ".fnm", "node-versions");
  const versions = await childDirectoryNames(root, readDirectory);
  return versions.sort(compareVersionNames).map((version) => pathApi.join(root, version, "installation", "bin", "codex"));
}

async function childDirectoryNames(root, readDirectory) {
  try {
    const entries = await readDirectory(root, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function compareVersionNames(left, right) {
  const leftParts = String(left).replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = String(right).replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (rightParts[index] || 0) - (leftParts[index] || 0);
    if (difference) return difference;
  }
  return String(right).localeCompare(String(left));
}

function readEnv(env, name) {
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === name);
  return key ? String(env[key] || "") : "";
}

function normalizeComparablePath(value, platform) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = pathApiFor(platform).normalize(raw);
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

function pathApiFor(platform) {
  return platform === "win32" ? pathWin32 : pathPosix;
}

async function defaultAccessFile(candidate, platform) {
  try {
    await access(candidate, platform === "win32" ? constants.F_OK : constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function defaultRunVersion(command, { env, platform }) {
  const spec = buildCodexVersionProbeSpec({ command, platform, env });
  const { stdout, stderr } = await execFileAsync(spec.command, spec.args, {
    timeout: 10_000,
    env: spec.env,
    windowsHide: spec.windowsHide
  });
  return (stdout || stderr).trim();
}
