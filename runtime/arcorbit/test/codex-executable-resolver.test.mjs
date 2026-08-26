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

test("Codex resolver finds and verifies an NVM installation outside a GUI-like PATH", async () => {
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
  assert.match(result.summary, /已找到但无法运行/);
  assert.equal(result.command, "");
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
