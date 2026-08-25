import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { promisify } from "node:util";
import {
  buildJsonRpcSpawnSpec,
  JsonRpcStdioClient,
  resolveWindowsCommand
} from "../src/json-rpc-stdio-client.mjs";

const execFileAsync = promisify(execFile);

test("non-Windows JSON-RPC commands keep direct argument boundaries", () => {
  const spec = buildJsonRpcSpawnSpec({
    command: "/opt/codex/bin/codex",
    args: ["app-server", "--stdio"],
    cwd: "/workspace/project",
    platform: "linux",
    env: { PATH: "/opt/codex/bin" }
  });

  assert.equal(spec.command, "/opt/codex/bin/codex");
  assert.deepEqual(spec.args, ["app-server", "--stdio"]);
  assert.equal(spec.launchMode, "direct");
  assert.equal(spec.options.cwd, "/workspace/project");
});

test("Windows PATH and PATHEXT resolve an executable before a command shim", () => {
  const files = new Set([
    "C:\\Tools\\codex.exe",
    "C:\\Users\\Example User\\AppData\\Roaming\\npm\\codex.cmd"
  ]);
  const resolved = resolveWindowsCommand("codex", {
    env: {
      Path: "C:\\Tools;C:\\Users\\Example User\\AppData\\Roaming\\npm",
      PATHEXT: ".EXE;.CMD"
    },
    isFile: (candidate) => [...files].some((file) => file.toLowerCase() === candidate.toLowerCase())
  });

  assert.equal(resolved.toLowerCase(), "c:\\tools\\codex.exe");
});

test("Windows npm command shims use a static PowerShell command and structured environment arguments", () => {
  const command = "C:\\Users\\Example User & Team\\AppData\\Roaming\\npm\\codex.cmd";
  const args = ["app-server", "--stdio", "value with spaces", "value&with|metacharacters"];
  const spec = buildJsonRpcSpawnSpec({
    command,
    args,
    cwd: "C:\\Workspaces\\Arckit Project",
    platform: "win32",
    env: { SystemRoot: "C:\\Windows" },
    isFile: (candidate) => candidate === command
  });

  assert.equal(spec.command, "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
  assert.equal(spec.launchMode, "windows-command-shim");
  assert.equal(spec.options.shell, undefined);
  assert.equal(spec.options.windowsHide, true);
  assert.equal(spec.options.env.ARCKIT_JSON_RPC_COMMAND, command);
  assert.deepEqual(JSON.parse(spec.options.env.ARCKIT_JSON_RPC_ARGS), args);
  assert.equal(spec.args.includes(command), false);
  assert.equal(spec.args.some((value) => value.includes("value&with")), false);
  assert.match(spec.args.at(-1), /ConvertFrom-Json/);
  assert.doesNotMatch(spec.args.at(-1), /\[string\[\]\]/);
});

test("Windows PowerShell 5.1 preserves npm app-server argument boundaries", { skip: process.platform !== "win32" }, async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "arcorbit-json-rpc-shim-"));
  const command = path.join(fixtureRoot, "fixture command.cmd");
  const captureScript = path.join(fixtureRoot, "capture.mjs");
  const args = ["app-server", "--stdio", "value with spaces"];
  try {
    await writeFile(captureScript, "process.stdout.write(JSON.stringify(process.argv.slice(2)));\n", "utf8");
    await writeFile(command, `@ECHO OFF\r\n"${process.execPath}" "${captureScript}" %*\r\n`, "utf8");
    const spec = buildJsonRpcSpawnSpec({
      command,
      args,
      cwd: fixtureRoot,
      platform: "win32",
      env: { ...process.env, SystemRoot: process.env.SystemRoot },
      isFile: (candidate) => candidate === command
    });

    const { stdout } = await execFileAsync(spec.command, spec.args, {
      cwd: spec.options.cwd,
      env: spec.options.env,
      windowsHide: spec.options.windowsHide
    });
    assert.deepEqual(JSON.parse(stdout), args);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("the default Windows codex command resolves an npm shim through PATH", () => {
  const shim = "C:\\Users\\Example User\\AppData\\Roaming\\npm\\codex.CMD";
  const spec = buildJsonRpcSpawnSpec({
    command: "codex",
    args: ["app-server", "--stdio"],
    cwd: "C:\\Workspaces\\Arckit Project",
    platform: "win32",
    env: {
      Path: "C:\\Users\\Example User\\AppData\\Roaming\\npm",
      PATHEXT: ".EXE;.CMD",
      SystemRoot: "C:\\Windows"
    },
    isFile: (candidate) => candidate.toLowerCase() === shim.toLowerCase()
  });

  assert.equal(spec.launchMode, "windows-command-shim");
  assert.equal(spec.resolvedCommand.toLowerCase(), shim.toLowerCase());
  assert.equal(spec.options.env.ARCKIT_JSON_RPC_COMMAND.toLowerCase(), shim.toLowerCase());
  assert.deepEqual(JSON.parse(spec.options.env.ARCKIT_JSON_RPC_ARGS), ["app-server", "--stdio"]);
});

test("Windows explicit executables launch directly even when their path contains spaces", () => {
  const command = "C:\\Program Files\\OpenAI\\codex.exe";
  const spec = buildJsonRpcSpawnSpec({
    command,
    args: ["app-server", "--stdio"],
    cwd: "C:\\Workspaces\\Arckit Project",
    platform: "win32",
    env: {},
    isFile: (candidate) => candidate === command
  });

  assert.equal(spec.command, command);
  assert.deepEqual(spec.args, ["app-server", "--stdio"]);
  assert.equal(spec.launchMode, "direct");
  assert.equal(spec.options.shell, undefined);
});

test("JSON-RPC startup errors include the requested command, platform, mode, and cwd", async () => {
  const fakeProcess = new EventEmitter();
  fakeProcess.stdin = new PassThrough();
  fakeProcess.stdout = new PassThrough();
  fakeProcess.kill = () => {};
  const client = new JsonRpcStdioClient({
    command: "missing-codex",
    cwd: "/workspace/project",
    platform: "linux",
    spawnProcess: () => fakeProcess
  });
  const closed = new Promise((resolve) => client.onClose(resolve));

  queueMicrotask(() => {
    const error = new Error("spawn ENOENT");
    error.code = "ENOENT";
    fakeProcess.emit("error", error);
  });
  const result = await closed;

  assert.equal(result.error.code, "ENOENT");
  assert.match(result.error.message, /missing-codex/);
  assert.match(result.error.message, /mode=direct/);
  assert.match(result.error.message, /platform=linux/);
  assert.match(result.error.message, /workspace\/project/);
});
