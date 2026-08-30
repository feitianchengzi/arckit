import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildCodexVersionProbeSpec,
  classifyCodexProvenance,
  createCodexExecutableResolver,
  discoverCodexCandidates,
  resolveCodexExecutable
} from "../src/codex-executable-resolver.mjs";

test("Codex resolver finds and verifies an NVM installation outside a GUI-like PATH", { skip: process.platform === "win32" }, async () => {
  const homeDir = await mkdtemp(path.join(tmpdir(), "arckit-codex-nvm-"));
  const binDir = path.join(homeDir, ".nvm", "versions", "node", "v22.22.2", "bin");
  const codexBin = path.join(binDir, "codex");
  try {
    await mkdir(binDir, { recursive: true });
    await symlink(process.execPath, path.join(binDir, "node"));
    await writeFile(codexBin, "#!/usr/bin/env node\nconsole.log('codex-cli fixture')\n");
    await chmod(codexBin, 0o755);

    const result = await resolveCodexExecutable({
      platform: "darwin",
      env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin" },
      homeDir
    });

    assert.equal(result.available, true);
    assert.equal(result.command, codexBin);
    assert.deepEqual(result.pathEntries, [binDir]);
    assert.equal(result.summary, "codex-cli fixture");
    assert.equal(result.provenance, "npm");
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
});

test("Codex resolver fails closed when a discovered executable cannot run", async () => {
  const result = await resolveCodexExecutable({
    platform: "darwin",
    env: { PATH: "/fixture/bin" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/fixture/bin/codex",
    readDirectory: async () => [],
    runVersion: async () => { throw new Error("invalid executable"); }
  });

  assert.equal(result.available, false);
  assert.equal(result.discovered, true);
  assert.equal(result.state, "broken");
  assert.equal(result.errorCode, "CODEX_EXECUTABLE_UNRUNNABLE");
  assert.match(result.summary, /已找到但无法运行/);
  assert.equal(result.command, "/fixture/bin/codex");
  assert.deepEqual(result.pathEntries, ["/fixture/bin"]);
});

test("optional candidate source failures do not suppress an independently runnable Codex", async () => {
  const denied = Object.assign(new Error("denied"), { code: "EACCES" });
  const result = await resolveCodexExecutable({
    platform: "darwin",
    env: { PATH: "/usr/local/bin" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/usr/local/bin/codex",
    readDirectory: async (root) => {
      if (root.includes(".nvm")) throw denied;
      return [];
    },
    runVersion: async () => "codex-cli fixture"
  });

  assert.equal(result.available, true);
  assert.equal(result.command, "/usr/local/bin/codex");
});

test("GUI discovery falls back to the login shell PATH and launches with that PATH", async () => {
  let observedPath = "";
  const result = await resolveCodexExecutable({
    platform: "darwin",
    env: { PATH: "/usr/bin:/bin", SHELL: "/bin/zsh" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/custom/codex/bin/codex",
    readDirectory: async () => [],
    readShellPath: async () => "/custom/codex/bin:/custom/node/bin:/usr/bin:/bin",
    runVersion: async (_candidate, { env }) => {
      observedPath = env.PATH;
      return "codex-cli shell-fixture";
    }
  });

  assert.equal(result.available, true);
  assert.equal(result.command, "/custom/codex/bin/codex");
  assert.match(observedPath, /^\/custom\/codex\/bin:\/custom\/node\/bin:/u);
});

test("incomplete candidate discovery is not mislabeled as a missing installation", async () => {
  const denied = Object.assign(new Error("denied"), { code: "EACCES" });
  const result = await resolveCodexExecutable({
    platform: "linux",
    env: { PATH: "/usr/bin:/bin" },
    homeDir: "/fixture/home",
    accessFile: async () => false,
    readDirectory: async (root) => {
      if (root.includes(".nvm")) throw denied;
      return [];
    },
    readShellPath: async () => { throw denied; }
  });

  assert.equal(result.available, false);
  assert.equal(result.discovered, false);
  assert.equal(result.state, "check-failed");
  assert.equal(result.errorCode, "CODEX_DISCOVERY_FAILED");
});

test("shared Codex resolver exposes only a successfully probed command", async () => {
  const resolver = createCodexExecutableResolver({
    platform: "darwin",
    env: { PATH: "/fixture/bin" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/fixture/bin/codex",
    readDirectory: async () => [],
    runVersion: async () => "codex-cli fixture"
  });

  assert.throws(() => resolver.getResolved(), /has not been resolved/);
  assert.equal((await resolver.probe()).available, true);
  assert.deepEqual(resolver.getResolved(), {
    command: "/fixture/bin/codex",
    pathEntries: ["/fixture/bin"]
  });
});

test("shared resolver reuses a shell-discovered executable before querying the shell again", async () => {
  let shellPathReads = 0;
  const resolver = createCodexExecutableResolver({
    platform: "darwin",
    env: { PATH: "/usr/bin:/bin", SHELL: "/bin/zsh" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/custom/codex/bin/codex",
    readDirectory: async () => [],
    readShellPath: async () => {
      shellPathReads += 1;
      return "/custom/codex/bin:/usr/bin:/bin";
    },
    runVersion: async () => "codex-cli fixture"
  });

  assert.equal((await resolver.probe()).available, true);
  assert.equal((await resolver.probe()).available, true);
  assert.equal(shellPathReads, 1);
});

test("transient version launch failures receive one bounded retry", async () => {
  let attempts = 0;
  const waits = [];
  const result = await resolveCodexExecutable({
    platform: "linux",
    env: { PATH: "/fixture/bin" },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === "/fixture/bin/codex",
    readDirectory: async () => [],
    runVersion: async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error("busy"), { code: "EBUSY" });
      return "codex-cli fixture";
    },
    wait: async (milliseconds) => { waits.push(milliseconds); }
  });

  assert.equal(result.available, true);
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [150]);
});

test("resolver stage callbacks begin before the corresponding discovery and version work settles", async () => {
  const stages = [];
  let startVersion;
  let releaseVersion;
  const versionStarted = new Promise((resolve) => { startVersion = resolve; });
  const versionReleased = new Promise((resolve) => { releaseVersion = resolve; });
  const pending = resolveCodexExecutable({
    platform: "linux",
    env: { ARCORBIT_CODEX_BIN: "/fixture/codex", PATH: "" },
    homeDir: "/fixture/home",
    accessFile: async () => true,
    readDirectory: async () => [],
    runVersion: async () => {
      startVersion();
      await versionReleased;
      return "codex fixture";
    },
    onStage: (stage) => stages.push(stage)
  });

  await versionStarted;
  assert.deepEqual(stages, ["executable", "version"]);
  releaseVersion();
  assert.equal((await pending).available, true);
});

test("Windows npm command shims are version-probed through a structured PowerShell boundary", () => {
  const command = "C:\\Users\\Example User\\AppData\\Roaming\\npm\\codex.cmd";
  const spec = buildCodexVersionProbeSpec({
    command,
    platform: "win32",
    env: { SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32" }
  });

  assert.equal(spec.command, "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
  assert.equal(spec.launchMode, "windows-command-shim");
  assert.equal(spec.env.ARCORBIT_CODEX_PROBE_COMMAND, command);
  assert.equal(spec.env.ARCORBIT_CODEX_PROBE_ARGS, JSON.stringify(["--version"]));
  assert.equal(spec.args.includes(command), false);
  assert.match(spec.args.at(-1), /ARCORBIT_CODEX_PROBE_COMMAND/);
  assert.doesNotMatch(spec.args.at(-1), /\[string\[\]\]/);
});

test("Windows resolver discovers the newest verified Codex Desktop runtime without a CLI", async () => {
  const localAppData = "C:\\Users\\Example User\\AppData\\Local";
  const binRoot = `${localAppData}\\OpenAI\\Codex\\bin`;
  const older = `${binRoot}\\older-runtime\\codex.exe`;
  const current = `${binRoot}\\current-runtime\\codex.exe`;
  const probed = [];
  const entries = [
    { name: "older-runtime", isDirectory: () => true },
    { name: "current-runtime", isDirectory: () => true },
    { name: "codex.exe", isDirectory: () => false }
  ];
  const result = await resolveCodexExecutable({
    platform: "win32",
    env: { LOCALAPPDATA: localAppData, PATH: "", PATHEXT: ".EXE;.CMD" },
    homeDir: "C:\\Users\\Example User",
    readDirectory: async (root) => root.toLowerCase() === binRoot.toLowerCase() ? entries : [],
    statFile: async (candidate) => ({ mtimeMs: candidate.toLowerCase() === current.toLowerCase() ? 200 : 100 }),
    accessFile: async (candidate) => candidate.toLowerCase() === current.toLowerCase() || candidate.toLowerCase() === older.toLowerCase(),
    runVersion: async (candidate) => {
      probed.push(candidate);
      return candidate.toLowerCase() === current.toLowerCase() ? "codex-cli desktop-current" : "codex-cli desktop-old";
    }
  });

  assert.equal(result.available, true);
  assert.equal(result.command.toLowerCase(), current.toLowerCase());
  assert.equal(result.provenance, "desktop-runtime");
  assert.equal(result.summary, "codex-cli desktop-current");
  assert.deepEqual(probed.map((candidate) => candidate.toLowerCase()), [current.toLowerCase(), older.toLowerCase()]);
  assert.deepEqual(result.installations.map((installation) => ({
    command: installation.command.toLowerCase(),
    active: installation.active,
    owner: installation.owner,
    scope: installation.execution_scope
  })), [
    { command: current.toLowerCase(), active: true, owner: "desktop-runtime", scope: "native:win32" },
    { command: older.toLowerCase(), active: false, owner: "desktop-runtime", scope: "native:win32" }
  ]);
});

test("Codex resolver prefers the ArcOrbit override and accepts the legacy override as fallback", async () => {
  const canonical = await discoverCodexCandidates({
    platform: "darwin",
    env: { PATH: "/usr/bin", ARCORBIT_CODEX_BIN: "/canonical/codex", ARCKIT_CODEX_BIN: "/legacy/codex" },
    homeDir: "/fixture/home",
    readDirectory: async () => []
  });
  const legacy = await discoverCodexCandidates({
    platform: "darwin",
    env: { PATH: "/usr/bin", ARCKIT_CODEX_BIN: "/legacy/codex" },
    homeDir: "/fixture/home",
    readDirectory: async () => []
  });

  assert.equal(canonical[0], "/canonical/codex");
  assert.equal(legacy[0], "/legacy/codex");
});

test("native Codex executables keep a direct version probe", () => {
  const env = { PATH: "/usr/bin:/bin" };
  assert.deepEqual(buildCodexVersionProbeSpec({ command: "/opt/bin/codex", platform: "darwin", env }), {
    command: "/opt/bin/codex",
    args: ["--version"],
    env,
    windowsHide: false,
    launchMode: "direct"
  });
});

test("Codex provenance distinguishes standalone, package-manager, configured, and unknown executables", () => {
  const env = { PATH: "/usr/bin", ARCORBIT_CODEX_BIN: "/custom/codex" };
  assert.equal(classifyCodexProvenance("/fixture/home/.local/bin/codex", { platform: "linux", env, homeDir: "/fixture/home" }), "standalone");
  assert.equal(classifyCodexProvenance("/opt/homebrew/bin/codex", { platform: "darwin", env, homeDir: "/fixture/home" }), "homebrew");
  assert.equal(classifyCodexProvenance("/fixture/home/.nvm/versions/node/v22/bin/codex", { platform: "linux", env, homeDir: "/fixture/home" }), "npm");
  assert.equal(classifyCodexProvenance("/custom/codex", { platform: "linux", env, homeDir: "/fixture/home" }), "configured");
  assert.equal(classifyCodexProvenance("/usr/bin/codex", { platform: "linux", env, homeDir: "/fixture/home" }), "unknown-external");
  assert.equal(classifyCodexProvenance("C:\\Users\\Example\\AppData\\Local\\OpenAI\\Codex\\bin\\runtime-1\\codex.exe", {
    platform: "win32",
    env: { LOCALAPPDATA: "C:\\Users\\Example\\AppData\\Local", PATH: "" },
    homeDir: "C:\\Users\\Example"
  }), "desktop-runtime");
});

test("Windows candidate order keeps standalone ahead of the Desktop runtime fallback", async () => {
  const homeDir = "C:\\Users\\Example";
  const localAppData = `${homeDir}\\AppData\\Local`;
  const desktopRuntime = `${localAppData}\\OpenAI\\Codex\\bin\\runtime-1\\codex.exe`;
  const options = {
    platform: "win32",
    env: {
      ARCORBIT_CODEX_BIN: "C:\\Configured\\codex.exe",
      PATH: "C:\\Path",
      PATHEXT: ".EXE;.CMD",
      APPDATA: `${homeDir}\\AppData\\Roaming`,
      LOCALAPPDATA: localAppData
    },
    homeDir,
    readDirectory: async (root) => root.endsWith("OpenAI\\Codex\\bin")
      ? [{ name: "runtime-1", isDirectory: () => true }]
      : [],
    statFile: async () => ({ mtimeMs: 1 })
  };

  const normal = await discoverCodexCandidates(options);
  assert.ok(normal.indexOf(`${homeDir}\\.local\\bin\\codex.exe`) < normal.indexOf(desktopRuntime));
  const preferred = await discoverCodexCandidates({ ...options, preferStandalone: true });
  assert.equal(preferred[0], `${homeDir}\\.local\\bin\\codex.exe`);
  assert.ok(preferred.indexOf("C:\\Configured\\codex.exe") < preferred.indexOf(desktopRuntime));
});

test("explicit standalone preference changes only ArcOrbit resolution order", async () => {
  const candidates = await discoverCodexCandidates({
    platform: "linux",
    env: { PATH: "/external/bin", ARCORBIT_CODEX_BIN: "/configured/codex" },
    homeDir: "/fixture/home",
    preferStandalone: true,
    readDirectory: async () => []
  });
  assert.equal(candidates[0], "/fixture/home/.local/bin/codex");
  assert.equal(candidates.includes("/configured/codex"), true);
  assert.equal(candidates.includes("/external/bin/codex"), true);
});

test("shared resolver selects the verified standalone executable after explicit preference", async () => {
  const standalone = "/fixture/home/.local/bin/codex";
  const configured = "/configured/codex";
  const resolver = createCodexExecutableResolver({
    platform: "linux",
    env: { PATH: "/external/bin", ARCORBIT_CODEX_BIN: configured },
    homeDir: "/fixture/home",
    accessFile: async (candidate) => candidate === standalone || candidate === configured || candidate === "/external/bin/codex",
    readDirectory: async () => [],
    runVersion: async (command) => `codex fixture ${command}`
  });

  const before = await resolver.probe();
  assert.equal(before.command, configured);
  assert.equal(before.provenance, "configured");

  resolver.preferStandalone();
  const after = await resolver.probe();
  assert.equal(after.command, standalone);
  assert.equal(after.provenance, "standalone");
  assert.deepEqual(resolver.getResolved(), { command: standalone, pathEntries: ["/fixture/home/.local/bin"] });
});
