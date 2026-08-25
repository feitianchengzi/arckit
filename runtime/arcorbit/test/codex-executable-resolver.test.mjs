import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildCodexVersionProbeSpec,
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
  assert.equal(result.summary, "codex-cli desktop-current");
  assert.deepEqual(probed.map((candidate) => candidate.toLowerCase()), [current.toLowerCase()]);
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
