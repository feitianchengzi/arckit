import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import os from "node:os";
import { posix as pathPosix, win32 as pathWin32 } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const WINDOWS_COMMAND_EXTENSIONS = new Set([".bat", ".cmd"]);
const WINDOWS_VERSION_PROBE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$probeCommand = $env:ARCORBIT_CODEX_PROBE_COMMAND",
  "$probeArgs = ConvertFrom-Json -InputObject $env:ARCORBIT_CODEX_PROBE_ARGS",
  "& $probeCommand @probeArgs",
  "exit $LASTEXITCODE"
].join("; ");

export function createCodexExecutableResolver(options = {}) {
  let resolved = null;
  let standalonePreferred = false;

  return {
    async probe(input = {}) {
      const result = await resolveCodexExecutable({
        ...options,
        preferStandalone: standalonePreferred,
        onStage: input.onStage
      });
      resolved = result.available
        ? { command: result.command, pathEntries: [...result.pathEntries] }
        : null;
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
  preferStandalone = false,
  accessFile = defaultAccessFile,
  readDirectory = readdir,
  statFile = stat,
  runVersion = defaultRunVersion,
  onStage
} = {}) {
  const pathApi = pathApiFor(platform);
  notifyProbeStage(onStage, "executable");
  const candidates = await discoverCodexCandidates({
    platform,
    env,
    homeDir,
    readDirectory,
    preferStandalone,
    statFile
  });
  const failures = [];

  for (const candidate of candidates) {
    if (!await accessFile(candidate, platform)) continue;
    const pathEntries = [pathApi.dirname(candidate)];
    try {
      notifyProbeStage(onStage, "version");
      const version = await runVersion(candidate, { env: prependPathEntries(env, pathEntries), platform });
      return {
        available: true,
        command: candidate,
        pathEntries,
        provenance: classifyCodexProvenance(candidate, { platform, env, homeDir }),
        summary: version || "Codex 可用"
      };
    } catch (error) {
      failures.push(`${candidate}: ${error?.message || String(error)}`);
    }
  }

  return {
    available: false,
    command: "",
    pathEntries: [],
    summary: failures.length
      ? `Codex executable 已找到但无法运行：${failures[0]}`
      : "未找到可运行的 Codex。请安装 Codex CLI，或安装并启动一次 Codex Desktop 以准备本地运行时，然后重新检测。"
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
  readDirectory = readdir,
  preferStandalone = false,
  statFile = stat
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
  candidates.push(...commandCandidates("codex", { platform, env }));

  if (platform === "win32") {
    const roamingAppData = readEnv(env, "APPDATA") || pathWin32.join(homeDir, "AppData", "Roaming");
    candidates.push(pathWin32.join(roamingAppData, "npm", "codex.cmd"));
    if (!preferStandalone) candidates.push(...standaloneCandidates);
    candidates.push(...await windowsDesktopCodexCandidates({ env, homeDir, readDirectory, statFile }));
  } else {
    if (!preferStandalone) candidates.push(...standaloneCandidates);
    candidates.push(
      pathApi.join(homeDir, ".volta", "bin", "codex"),
      pathApi.join(homeDir, ".bun", "bin", "codex"),
      "/opt/homebrew/bin/codex",
      "/usr/local/bin/codex"
    );
    candidates.push(...await nvmCandidates(homeDir, readDirectory, pathApi));
    candidates.push(...await fnmCandidates(homeDir, readDirectory, pathApi));
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
    || /[\\/]\.nvm[\\/]|[\\/]\.fnm[\\/]|[\\/]\.volta[\\/]|[\\/]\.bun[\\/]|[\\/]node_modules[\\/]/i.test(normalized)) {
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
  const prefix = [...new Set((entries || []).map(String).filter(Boolean))].join(delimiter);
  return { ...env, [key]: [prefix, current].filter(Boolean).join(delimiter) };
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
