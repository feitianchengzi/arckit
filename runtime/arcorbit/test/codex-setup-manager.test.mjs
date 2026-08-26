import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  activeCodexOwnersFromStore,
  buildCodexCommandSpec,
  buildCodexLoginSpec,
  buildOfficialInstallerSpec,
  createCodexSetupManager,
  extractDeviceAuthChallenge,
  MAX_INSTALLER_RESPONSE_BYTES,
  runControlledProcess,
  runOfficialInstaller
} from "../src/codex-setup-manager.mjs";

const execFileAsync = promisify(execFile);

const executable = {
  available: true,
  command: "/fixture/.local/bin/codex",
  pathEntries: ["/fixture/.local/bin"],
  provenance: "standalone",
  summary: "codex-cli 1.2.3"
};

test("official installer specs are fixed per supported platform and never use a shell string", () => {
  assert.deepEqual(buildOfficialInstallerSpec({ platform: "darwin", scriptPath: "/tmp/install.sh", env: { SAFE: "1" } }), {
    command: "/bin/sh", args: ["/tmp/install.sh"], env: { SAFE: "1" }, windowsHide: false
  });
  assert.deepEqual(buildOfficialInstallerSpec({ platform: "linux", scriptPath: "/tmp/install.sh", env: {} }), {
    command: "/bin/sh", args: ["/tmp/install.sh"], env: {}, windowsHide: false
  });
  assert.deepEqual(buildOfficialInstallerSpec({ platform: "win32", scriptPath: "C:\\Temp\\install.ps1", env: {} }), {
    command: "powershell.exe",
    args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", "C:\\Temp\\install.ps1"],
    env: {},
    windowsHide: true
  });
  assert.throws(() => buildOfficialInstallerSpec({ platform: "freebsd", scriptPath: "/tmp/install" }), /不支持/);
});

test("controlled process cancellation and timeout settle only after the child closes", async () => {
  for (const scenario of [
    { name: "cancellation", code: "ABORT_ERR", timeout: 5_000, cancel: true },
    { name: "timeout", code: "PROCESS_TIMEOUT", timeout: 1_000, cancel: false }
  ]) {
    const controller = new AbortController();
    let ready;
    let terminating;
    const childReady = new Promise((resolve) => { ready = resolve; });
    const childTerminating = new Promise((resolve) => { terminating = resolve; });
    const pending = runControlledProcess({
      command: process.execPath,
      args: ["-e", [
        "process.on('SIGTERM', () => {",
        "  process.stdout.write('terminating\\n');",
        "  setTimeout(() => process.exit(0), 120);",
        "});",
        "process.stdout.write('ready\\n');",
        "setInterval(() => {}, 1_000);"
      ].join("\n")],
      signal: controller.signal,
      timeout: scenario.timeout,
      onOutput: ({ text }) => {
        if (text.includes("ready")) ready();
        if (text.includes("terminating")) terminating();
      }
    });
    let settled = false;
    void pending.then(() => { settled = true; }, () => { settled = true; });

    await childReady;
    if (scenario.cancel) controller.abort();
    await childTerminating;
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(settled, false, `${scenario.name} must wait for the child close event`);
    await assert.rejects(pending, (error) => error.code === scenario.code);
    assert.equal(settled, true);
  }
});

test("secret login specs frame credentials as controllable stdin buffers", () => {
  const snapshot = {
    installation: { ...executable, path_entries: executable.pathEntries },
    authentication: { capabilities: { api_key: true, access_token: true } }
  };
  for (const [method, flag] of [["api-key", "--with-api-key"], ["access-token", "--with-access-token"]]) {
    const secret = `${method}-super-secret`;
    const spec = buildCodexLoginSpec({ method, secret, snapshot, env: { PATH: "/usr/bin", SAFE: "1" } });
    assert.deepEqual(spec.args, ["login", flag]);
    assert.equal(Buffer.isBuffer(spec.stdin), true);
    assert.equal(spec.stdin.toString("utf8"), `${secret}\n`);
    assert.equal(JSON.stringify({ command: spec.command, args: spec.args, env: spec.env }).includes(secret), false);
  }
});

test("Windows npm command shims use a fixed PowerShell boundary while secrets remain stdin-only", () => {
  const secret = "windows-fixture-secret";
  const command = "C:\\Users\\fixture\\AppData\\Roaming\\npm\\codex.cmd";
  const spec = buildCodexCommandSpec({
    platform: "win32",
    command,
    args: ["login", "--with-api-key"],
    env: { SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32" },
    stdin: Buffer.from(`${secret}\n`, "utf8")
  });
  assert.equal(spec.command, "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
  assert.equal(spec.args.includes(command), false);
  assert.equal(spec.env.ARCORBIT_CODEX_SETUP_COMMAND, command);
  assert.equal(spec.env.ARCORBIT_CODEX_SETUP_ARGS, JSON.stringify(["login", "--with-api-key"]));
  assert.doesNotMatch(spec.args.at(-1), /\[string\[\]\]/);
  assert.equal(Buffer.isBuffer(spec.stdin), true);
  assert.equal(spec.stdin.toString("utf8"), `${secret}\n`);
  assert.equal(JSON.stringify({ command: spec.command, args: spec.args, env: spec.env }).includes(secret), false);
});

test("Windows PowerShell 5.1 preserves Codex setup command argument boundaries", { skip: process.platform !== "win32" }, async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "arcorbit-codex-setup-shim-"));
  const command = path.join(fixtureRoot, "fixture command.cmd");
  const captureScript = path.join(fixtureRoot, "capture.mjs");
  const args = ["login", "--help", "value with spaces"];
  try {
    await writeFile(captureScript, "process.stdout.write(JSON.stringify(process.argv.slice(2)));\n", "utf8");
    await writeFile(command, `@ECHO OFF\r\n"${process.execPath}" "${captureScript}" %*\r\n`, "utf8");
    const spec = buildCodexCommandSpec({
      platform: "win32",
      command,
      args,
      env: { ...process.env, SystemRoot: process.env.SystemRoot }
    });

    const { stdout } = await execFileAsync(spec.command, spec.args, {
      env: spec.env,
      windowsHide: spec.windowsHide
    });
    assert.deepEqual(JSON.parse(stdout), args);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("controlled process writes framed stdin and clears its buffer before child close", async () => {
  const secret = "process-secret";
  const stdin = Buffer.from(`${secret}\n`, "utf8");
  let received;
  const childReceived = new Promise((resolve) => { received = resolve; });
  const pending = runControlledProcess({
    command: process.execPath,
    args: ["-e", [
      "let input = '';",
      "process.stdin.setEncoding('utf8');",
      "process.stdin.on('data', (chunk) => { input += chunk; });",
      "process.stdin.on('end', () => {",
      "  process.stdout.write(JSON.stringify({ lines: input.split('\\n').length - 1, terminated: input.endsWith('\\n') }) + '\\n');",
      "  setTimeout(() => process.exit(0), 120);",
      "});"
    ].join("\n")],
    stdin,
    onOutput: ({ text }) => {
      if (text.includes('"terminated":true')) received(text);
    }
  });
  let settled = false;
  void pending.then(() => { settled = true; }, () => { settled = true; });

  const output = await childReceived;
  assert.match(output, /"lines":1/);
  assert.equal(settled, false);
  assert.equal(stdin.every((byte) => byte === 0), true);
  const result = await pending;
  assert.equal(result.exitCode, 0);
});

test("ChatGPT login requires an explicit flow and gates device auth by capability", () => {
  const snapshot = {
    installation: { ...executable, path_entries: executable.pathEntries },
    authentication: { capabilities: { device_auth: false } }
  };
  assert.throws(() => buildCodexLoginSpec({ method: "chatgpt", snapshot }), /请选择系统浏览器或设备码/);
  assert.deepEqual(buildCodexLoginSpec({ method: "chatgpt", flow: "browser", snapshot }).args, ["login"]);
  assert.throws(() => buildCodexLoginSpec({ method: "chatgpt", flow: "device", snapshot }), /不支持/);
  snapshot.authentication.capabilities.device_auth = true;
  assert.deepEqual(buildCodexLoginSpec({ method: "chatgpt", flow: "device", snapshot }).args, ["login", "--device-auth"]);
});

test("device auth output parser exposes only an official HTTPS URL and one-time code", () => {
  assert.deepEqual(extractDeviceAuthChallenge("\u001b[36mOpen https://auth.openai.com/codex/device.\u001b[0m\nCode: ABCD-EFGH"), {
    verification_url: "https://auth.openai.com/codex/device",
    user_code: "ABCD-EFGH"
  });
  assert.equal(extractDeviceAuthChallenge("Open https://phishing.invalid/device\nCode: WXYZ-1234"), null);
  assert.equal(extractDeviceAuthChallenge("raw process diagnostics only"), null);
});

test("manager reports selection-required with no inferred auth method", async () => {
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--device-auth --with-api-key --with-access-token", stderr: "" }
      : { exitCode: 1, stdout: "", stderr: "not logged in" }
  });
  const snapshot = await manager.check();
  assert.equal(snapshot.status, "selection-required");
  assert.equal(snapshot.authentication.state, "logged-out");
  assert.equal(snapshot.authentication.method, "");
  assert.equal(snapshot.authentication.capabilities.device_auth, true);
  assert.equal(snapshot.authentication.capabilities.access_token, true);
});

test("preflight waits for the active mutation without replacing its operation projection", async () => {
  let installed = false;
  let installerStarted;
  let releaseInstaller;
  const enteredInstaller = new Promise((resolve) => { installerStarted = resolve; });
  const installerReleased = new Promise((resolve) => { releaseInstaller = resolve; });
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => installed ? executable : { available: false, summary: "missing" },
    installerRunner: async () => {
      installerStarted();
      await installerReleased;
      installed = true;
    },
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 0, stdout: "", stderr: "" }
  });

  const install = manager.install();
  await enteredInstaller;
  const beforePreflight = manager.getSnapshot();
  assert.equal(beforePreflight.status, "installing");
  assert.equal(Boolean(beforePreflight.operation?.id), true);
  assert.equal(beforePreflight.operation?.cancellable, true);

  let preflightSettled = false;
  const preflight = manager.assertReady().finally(() => { preflightSettled = true; });
  await new Promise((resolve) => setImmediate(resolve));

  const whilePreflightQueued = manager.getSnapshot();
  assert.equal(preflightSettled, false);
  assert.equal(whilePreflightQueued.status, "installing");
  assert.equal(whilePreflightQueued.operation?.id, beforePreflight.operation.id);
  assert.equal(whilePreflightQueued.operation?.cancellable, true);

  releaseInstaller();
  const [installedSnapshot, preflightSnapshot] = await Promise.all([install, preflight]);
  assert.equal(installedSnapshot.status, "ready");
  assert.equal(installedSnapshot.operation, null);
  assert.equal(preflightSnapshot.status, "ready");
  assert.equal(preflightSnapshot.operation, null);
});

test("fresh login-status distinguishes expired authentication and normalizes probe failures", async () => {
  let authenticated = true;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args }) => {
      if (args.join(" ") === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
      if (authenticated) return { exitCode: 0, stdout: "", stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "not logged in" };
    }
  });
  assert.equal((await manager.check()).authentication.state, "authenticated");
  authenticated = false;
  const expired = await manager.check();
  assert.equal(expired.status, "selection-required");
  assert.equal(expired.authentication.state, "expired");
  assert.equal(expired.authentication.authenticated, false);

  const failing = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args }) => {
      if (args.join(" ") === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
      throw Object.assign(new Error("sensitive status diagnostic"), { code: "PROCESS_TIMEOUT" });
    }
  });
  const failed = await failing.check();
  assert.equal(failed.status, "login-failed");
  assert.equal(failed.authentication.state, "login-failed");
  assert.equal(failed.error.code, "AUTH_STATUS_CHECK_FAILED");
  assert.equal(JSON.stringify(failed).includes("sensitive status diagnostic"), false);
});

test("API key login never projects the secret and becomes ready only after login-status succeeds", async () => {
  const secret = "fixture-api-key-secret";
  const calls = [];
  let authenticated = false;
  const manager = createCodexSetupManager({
    platform: "linux",
    env: { PATH: "/usr/bin", SAFE: "1" },
    probeExecutable: async () => executable,
    processRunner: async (spec) => {
      calls.push(spec);
      if (spec.args.join(" ") === "login --help") return { exitCode: 0, stdout: "--device-auth --with-api-key --with-access-token", stderr: "" };
      if (spec.args.join(" ") === "login status") return { exitCode: authenticated ? 0 : 1, stdout: "", stderr: "" };
      if (spec.args.join(" ") === "login --with-api-key") {
        assert.equal(Buffer.isBuffer(spec.stdin), true);
        assert.equal(spec.stdin.toString("utf8"), `${secret}\n`);
        assert.equal(JSON.stringify({ command: spec.command, args: spec.args, env: spec.env }).includes(secret), false);
        authenticated = true;
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "" };
    }
  });
  const snapshot = await manager.login({ method: "api-key", secret });
  assert.equal(snapshot.status, "ready");
  assert.equal(snapshot.authentication.authenticated, true);
  assert.equal(JSON.stringify(snapshot).includes(secret), false);
  const loginCall = calls.find((call) => call.args.join(" ") === "login --with-api-key");
  assert.equal(Buffer.isBuffer(loginCall.stdin), true);
  assert.equal(loginCall.stdin.every((byte) => byte === 0), true);
});

test("successful login process reports login-failed until fresh status proves authentication", async () => {
  const secret = "fixture-unconfirmed-api-key";
  let statusChecks = 0;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args, stdin }) => {
      const command = args.join(" ");
      if (command === "login --help") return { exitCode: 0, stdout: "--with-api-key", stderr: "" };
      if (command === "login status") {
        statusChecks += 1;
        return { exitCode: 1, stdout: "", stderr: "" };
      }
      if (command === "login --with-api-key") {
        assert.equal(Buffer.isBuffer(stdin), true);
        assert.equal(stdin.toString("utf8"), `${secret}\n`);
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "" };
    }
  });

  const snapshot = await manager.login({ method: "api-key", secret });
  assert.equal(snapshot.status, "login-failed");
  assert.equal(snapshot.authentication.state, "login-failed");
  assert.equal(snapshot.authentication.authenticated, false);
  assert.equal(snapshot.error.code, "LOGIN_POSTCONDITION_FAILED");
  assert.equal(statusChecks, 3);
  assert.equal(JSON.stringify(snapshot).includes(secret), false);
});

test("explicit logout revalidation reports logged-out instead of expired", async () => {
  let authenticated = true;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args }) => {
      const command = args.join(" ");
      if (command === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
      if (command === "login status") return { exitCode: authenticated ? 0 : 1, stdout: "", stderr: "" };
      if (command === "logout") {
        authenticated = false;
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "" };
    }
  });
  const snapshot = await manager.logout();
  assert.equal(snapshot.status, "selection-required");
  assert.equal(snapshot.authentication.state, "logged-out");
  assert.equal(snapshot.authentication.authenticated, false);
});

test("logout succeeds only when fresh status proves the session is logged out", async () => {
  for (const scenario of [
    { name: "still authenticated", code: "LOGOUT_POSTCONDITION_FAILED" },
    { name: "status probe failed", code: "AUTH_STATUS_CHECK_FAILED", statusFailure: true }
  ]) {
    let statusChecks = 0;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => executable,
      processRunner: async ({ args }) => {
        const command = args.join(" ");
        if (command === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
        if (command === "login status") {
          statusChecks += 1;
          if (scenario.statusFailure && statusChecks > 1) {
            throw Object.assign(new Error("sensitive status failure"), { code: "PROCESS_TIMEOUT" });
          }
          return { exitCode: 0, stdout: "", stderr: "" };
        }
        if (command === "logout") return { exitCode: 0, stdout: "", stderr: "" };
        return { exitCode: 1, stdout: "", stderr: "" };
      }
    });

    const snapshot = await manager.logout();
    assert.equal(statusChecks, 2, `${scenario.name} must include a fresh post-logout status probe`);
    assert.equal(snapshot.status, "logout-failed");
    assert.equal(snapshot.error.code, scenario.code);
    assert.equal(snapshot.operation, null);
    assert.equal(JSON.stringify(snapshot).includes("sensitive status failure"), false);
    if (!scenario.statusFailure) {
      assert.equal(snapshot.authentication.state, "authenticated");
      assert.equal(snapshot.authentication.authenticated, true);
      assert.match(snapshot.error.message, /仍报告已认证/);
    }
  }
});

test("device login projects a bounded challenge while the official process is running", async () => {
  let authenticated = false;
  let finishLogin;
  const loginFinished = new Promise((resolve) => { finishLogin = resolve; });
  let challengeSeen;
  const challengeProjected = new Promise((resolve) => { challengeSeen = resolve; });
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async (spec) => {
      const args = spec.args.join(" ");
      if (args === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
      if (args === "login status") return { exitCode: authenticated ? 0 : 1, stdout: "", stderr: "" };
      if (args === "login --device-auth") {
        spec.onOutput?.({ stream: "stdout", text: "Open https://auth.openai.com/codex/device\n" });
        spec.onOutput?.({ stream: "stderr", text: "Code: TEST-2026\nraw-sensitive-diagnostic" });
        await loginFinished;
        authenticated = true;
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "" };
    }
  });
  manager.onEvent((value) => {
    if (value.operation?.device_auth?.user_code) challengeSeen(value);
  });

  const pending = manager.login({ method: "chatgpt", flow: "device" });
  const running = await challengeProjected;
  assert.equal(running.status, "login-in-progress");
  assert.equal(running.operation.phase, "awaiting-device-auth");
  assert.equal(Number.isFinite(Date.parse(running.operation.started_at)), true);
  assert.deepEqual(running.operation.device_auth, {
    verification_url: "https://auth.openai.com/codex/device",
    user_code: "TEST-2026"
  });
  assert.equal(JSON.stringify(running).includes("raw-sensitive-diagnostic"), false);

  finishLogin();
  const ready = await pending;
  assert.equal(ready.status, "ready");
  assert.equal(ready.operation, null);
});

test("standalone update is blocked while any Codex owner is active", async () => {
  let installerCalls = 0;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    activeOwners: async () => [{ kind: "automation", id: "EXEC-1" }],
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 0, stdout: "", stderr: "" },
    installerRunner: async () => { installerCalls += 1; }
  });
  await assert.rejects(() => manager.update(), (error) => {
    assert.equal(error.code, "CODEX_UPDATE_ACTIVE_TASKS");
    assert.deepEqual(error.owners, [{ kind: "automation", id: "EXEC-1" }]);
    return true;
  });
  assert.equal(manager.getSnapshot().error.code, "CODEX_UPDATE_ACTIVE_TASKS");
  assert.deepEqual(manager.getSnapshot().error.owners, [{ kind: "automation", id: "EXEC-1" }]);
  assert.equal(installerCalls, 0);
});

test("external installations reject direct update with the stable recovery code", async () => {
  for (const provenance of ["configured", "npm", "homebrew", "desktop-runtime", "unknown-external"]) {
    let installerCalls = 0;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => ({
        ...executable,
        command: `/external/${provenance}/codex`,
        pathEntries: [`/external/${provenance}`],
        provenance
      }),
      processRunner: async ({ args }) => args.at(-1) === "--help"
        ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
        : { exitCode: 0, stdout: "", stderr: "" },
      installerRunner: async () => { installerCalls += 1; }
    });

    await assert.rejects(() => manager.update(), (error) => {
      assert.equal(error.code, "CODEX_EXTERNAL_INSTALLATION");
      assert.equal(error.stage, "update");
      return true;
    });
    assert.equal(manager.getSnapshot().installation.provenance, provenance);
    assert.equal(manager.getSnapshot().installation.can_update, false);
    assert.equal(manager.getSnapshot().installation.can_migrate, true);
    assert.equal(installerCalls, 0);
  }
});

test("standalone update succeeds only when fresh discovery remains proven standalone", async () => {
  const external = {
    ...executable,
    command: "/configured/codex",
    pathEntries: ["/configured"],
    provenance: "configured"
  };
  const scenarios = [
    { after: { available: false, summary: "missing" }, expectedState: "missing", expectedProvenance: "none" },
    { after: external, expectedState: "installed", expectedProvenance: "configured" }
  ];

  for (const scenario of scenarios) {
    let updated = false;
    let installerCalls = 0;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => updated ? scenario.after : executable,
      preferStandalone: () => {},
      installerRunner: async () => {
        installerCalls += 1;
        updated = true;
      },
      processRunner: async ({ args }) => args.at(-1) === "--help"
        ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
        : { exitCode: 1, stdout: "", stderr: "" }
    });

    const snapshot = await manager.update();
    assert.equal(snapshot.status, "update-failed");
    assert.equal(snapshot.installation.state, scenario.expectedState);
    assert.equal(snapshot.installation.provenance, scenario.expectedProvenance);
    assert.equal(snapshot.error.code, "UPDATE_POSTCONDITION_FAILED");
    assert.equal(snapshot.operation, null);
    assert.equal(installerCalls, 1);
  }
});

test("install is blocked while any Codex owner is active", async () => {
  let ownerCalls = 0;
  let installerCalls = 0;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => ({ available: false, summary: "missing" }),
    activeOwners: async () => {
      ownerCalls += 1;
      return [{ kind: "chat", id: "CHAT-1" }];
    },
    installerRunner: async () => { installerCalls += 1; }
  });

  await assert.rejects(() => manager.install(), (error) => {
    assert.equal(error.code, "CODEX_UPDATE_ACTIVE_TASKS");
    assert.deepEqual(error.owners, [{ kind: "chat", id: "CHAT-1" }]);
    return true;
  });
  assert.deepEqual(manager.getSnapshot().error.owners, [{ kind: "chat", id: "CHAT-1" }]);
  assert.equal(ownerCalls, 1);
  assert.equal(installerCalls, 0);
});

test("active owner recovery projection contains only bounded non-sensitive owner refs", async () => {
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    activeOwners: async () => [
      { kind: "automation", id: "EXEC-1" },
      { kind: "automation", id: "EXEC-1" },
      { kind: "chat", id: "CHAT-1\u0000\n" },
      { kind: "unexpected", id: "private-owner" },
      { kind: "codex", id: "C".repeat(200), secret: "must-not-project" }
    ],
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 0, stdout: "", stderr: "" }
  });

  await assert.rejects(() => manager.update(), (error) => error.code === "CODEX_UPDATE_ACTIVE_TASKS");
  assert.deepEqual(manager.getSnapshot().error.owners, [
    { kind: "automation", id: "EXEC-1" },
    { kind: "chat", id: "CHAT-1" },
    { kind: "codex", id: "C".repeat(160) }
  ]);
  assert.equal(JSON.stringify(manager.getSnapshot()).includes("must-not-project"), false);
  assert.equal(JSON.stringify(manager.getSnapshot()).includes("private-owner"), false);
});

test("install uses the allowlisted platform URL then revalidates without restart", async () => {
  let installed = false;
  let preferred = 0;
  let observedUrl = "";
  const manager = createCodexSetupManager({
    platform: "win32",
    probeExecutable: async () => installed ? { ...executable, command: "C:\\Users\\fixture\\.local\\bin\\codex.exe" } : { available: false, summary: "missing" },
    preferStandalone: () => { preferred += 1; },
    installerRunner: async ({ url, onProgress }) => { observedUrl = url; onProgress("executing"); installed = true; },
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 1, stdout: "", stderr: "" }
  });
  const snapshot = await manager.install();
  assert.equal(observedUrl, "https://chatgpt.com/codex/install.ps1");
  assert.equal(preferred, 1);
  assert.equal(snapshot.installation.available, true);
  assert.equal(snapshot.status, "selection-required");
});

test("successful installer reports install-failed until fresh discovery proves Codex is available", async () => {
  let probes = 0;
  let installerCalls = 0;
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => {
      probes += 1;
      return { available: false, summary: "missing" };
    },
    preferStandalone: () => {},
    installerRunner: async () => { installerCalls += 1; },
    processRunner: async () => ({ exitCode: 1, stdout: "", stderr: "" })
  });

  const snapshot = await manager.install();
  assert.equal(snapshot.status, "install-failed");
  assert.equal(snapshot.installation.available, false);
  assert.equal(snapshot.installation.state, "missing");
  assert.equal(snapshot.error.code, "INSTALL_POSTCONDITION_FAILED");
  assert.equal(snapshot.operation, null);
  assert.equal(installerCalls, 1);
  assert.equal(probes, 3);
});

test("successful mutations clear cancellation identity before fresh inspection", async () => {
  let installed = false;
  let startDiscovery;
  let releaseDiscovery;
  let startVersion;
  let releaseVersion;
  let startLoginStatus;
  let releaseLoginStatus;
  let startReadiness;
  let releaseReadiness;
  let readinessCodexProbe;
  const discoveryStarted = new Promise((resolve) => { startDiscovery = resolve; });
  const discoveryReleased = new Promise((resolve) => { releaseDiscovery = resolve; });
  const versionStarted = new Promise((resolve) => { startVersion = resolve; });
  const versionReleased = new Promise((resolve) => { releaseVersion = resolve; });
  const loginStatusStarted = new Promise((resolve) => { startLoginStatus = resolve; });
  const loginStatusReleased = new Promise((resolve) => { releaseLoginStatus = resolve; });
  const readinessStarted = new Promise((resolve) => { startReadiness = resolve; });
  const readinessReleased = new Promise((resolve) => { releaseReadiness = resolve; });
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async ({ onStage } = {}) => {
      if (installed) {
        startDiscovery();
        await discoveryReleased;
        onStage?.("version");
        startVersion();
        await versionReleased;
        return executable;
      }
      return { available: false, summary: "missing" };
    },
    preferStandalone: () => {},
    installerRunner: async () => { installed = true; },
    processRunner: async ({ args }) => {
      if (args.at(-1) === "--help") return { exitCode: 0, stdout: "--with-api-key", stderr: "" };
      startLoginStatus();
      await loginStatusReleased;
      return { exitCode: 1, stdout: "", stderr: "" };
    },
    recheckReadiness: async ({ codexProbe }) => {
      readinessCodexProbe = codexProbe;
      startReadiness();
      await readinessReleased;
    }
  });
  const operationEvents = [];
  manager.onEvent((value) => {
    if (value.operation) operationEvents.push(value.operation);
  });

  const pending = manager.install();
  await discoveryStarted;
  const discovery = manager.getSnapshot();
  assert.equal(discovery.status, "checking");
  assert.equal(discovery.operation.kind, "install");
  assert.equal(discovery.operation.phase, "rechecking-executable");
  assert.equal(discovery.operation.cancellable, false);
  assert.equal(Number.isFinite(Date.parse(discovery.operation.started_at)), true);
  assert.equal(Object.hasOwn(discovery.operation, "id"), false);
  assert.throws(
    () => manager.cancel({ operation_id: "stale-install-operation" }),
    (error) => error.code === "OPERATION_NOT_ACTIVE"
  );

  releaseDiscovery();
  await versionStarted;
  assert.equal(manager.getSnapshot().operation.phase, "rechecking-version");
  releaseVersion();
  await loginStatusStarted;
  assert.equal(manager.getSnapshot().operation.phase, "rechecking-login-status");
  releaseLoginStatus();
  await readinessStarted;
  assert.equal(manager.getSnapshot().operation.phase, "rechecking-readiness");
  releaseReadiness();
  const snapshot = await pending;
  assert.equal(snapshot.status, "selection-required");
  assert.equal(snapshot.operation, null);
  assert.deepEqual(readinessCodexProbe, executable);
  const recheckEvents = operationEvents.filter((item) => item.phase.startsWith("rechecking-"));
  assert.deepEqual(recheckEvents.map((item) => item.phase), [
    "rechecking-executable",
    "rechecking-version",
    "rechecking-login-status",
    "rechecking-readiness"
  ]);
  assert.equal(new Set(operationEvents.map((item) => item.started_at)).size, 1);
});

test("standalone migration succeeds only when fresh discovery selects proven standalone", async () => {
  const external = {
    ...executable,
    command: "/configured/codex",
    pathEntries: ["/configured"],
    provenance: "configured"
  };
  for (const selectsStandalone of [true, false]) {
    let preferred = false;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => preferred && selectsStandalone ? executable : external,
      preferStandalone: () => { preferred = true; },
      installerRunner: async ({ onProgress }) => onProgress("discovering"),
      processRunner: async ({ args }) => args.at(-1) === "--help"
        ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
        : { exitCode: 1, stdout: "", stderr: "" }
    });

    const snapshot = await manager.migrateToStandalone();
    if (selectsStandalone) {
      assert.equal(snapshot.status, "selection-required");
      assert.equal(snapshot.installation.provenance, "standalone");
      assert.equal(snapshot.installation.command, executable.command);
      assert.equal(snapshot.error, null);
    } else {
      assert.equal(snapshot.status, "migrate-failed");
      assert.equal(snapshot.installation.provenance, "configured");
      assert.equal(snapshot.installation.command, external.command);
      assert.equal(snapshot.error.code, "MIGRATION_POSTCONDITION_FAILED");
      assert.match(snapshot.error.message, /executable 配置或 PATH 冲突/);
    }
  }
});

test("failed installer and cancelled login stay recoverable without projecting process details", async () => {
  let available = false;
  const failing = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => available ? executable : { available: false, summary: "missing" },
    installerRunner: async () => { throw Object.assign(new Error("sensitive installer output"), { code: "PROCESS_TIMEOUT" }); },
    processRunner: async () => ({ exitCode: 1, stdout: "", stderr: "" })
  });
  const failed = await failing.install();
  assert.equal(failed.status, "install-failed");
  assert.equal(failed.error.code, "PROCESS_TIMEOUT");
  assert.equal(JSON.stringify(failed).includes("sensitive installer output"), false);

  let loginStarted;
  const started = new Promise((resolve) => { loginStarted = resolve; });
  const cancelling = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => executable,
    processRunner: async ({ args, signal }) => {
      if (args.join(" ") === "login --help") return { exitCode: 0, stdout: "--with-api-key", stderr: "" };
      if (args.join(" ") === "login status") return { exitCode: 1, stdout: "", stderr: "" };
      loginStarted();
      return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelled"), { name: "AbortError", code: "ABORT_ERR" })), { once: true }));
    }
  });
  let recheckingSeen = false;
  cancelling.onEvent((value) => {
    if (value.operation?.phase?.startsWith("rechecking-")) recheckingSeen = true;
  });
  const pending = cancelling.login({ method: "chatgpt", flow: "browser" });
  await started;
  const operationId = cancelling.getSnapshot().operation.id;
  assert.throws(() => cancelling.cancel({ operation_id: "stale-operation" }), (error) => error.code === "OPERATION_MISMATCH");
  cancelling.cancel({ operation_id: operationId });
  const cancelled = await pending;
  assert.equal(cancelled.status, "login-failed");
  assert.equal(cancelled.authentication.state, "login-failed");
  assert.equal(cancelled.error.code, "OPERATION_CANCELLED");
  assert.match(cancelled.error.message, /重新验证确认当前未登录/);
  assert.equal(recheckingSeen, true);
});

test("failed installer mutations refresh executable state while preserving failure classification", async () => {
  const external = {
    ...executable,
    command: "/configured/codex",
    pathEntries: ["/configured"],
    provenance: "configured",
    summary: "codex-cli 1.2.2"
  };
  const cases = [
    { action: "install", before: { available: false, summary: "missing" }, after: executable },
    { action: "update", before: { ...executable, summary: "codex-cli 1.2.2" }, after: { ...executable, summary: "codex-cli 1.2.4" } },
    { action: "migrateToStandalone", kind: "migrate", before: external, after: executable }
  ];

  for (const scenario of cases) {
    let installerChangedState = false;
    let probes = 0;
    let recheckingSeen = false;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => {
        probes += 1;
        return installerChangedState ? scenario.after : scenario.before;
      },
      preferStandalone: () => {},
      installerRunner: async () => {
        installerChangedState = true;
        throw Object.assign(new Error("sensitive installer timeout"), { code: "PROCESS_TIMEOUT" });
      },
      processRunner: async ({ args }) => args.at(-1) === "--help"
        ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
        : { exitCode: 1, stdout: "", stderr: "" }
    });
    manager.onEvent((value) => {
      if (value.operation?.phase?.startsWith("rechecking-")) recheckingSeen = true;
    });

    const snapshot = await manager[scenario.action]();
    const kind = scenario.kind || scenario.action;
    assert.equal(probes, 2, `${kind} should probe before the mutation and after its failure`);
    assert.equal(recheckingSeen, true, `${kind} should expose a non-cancellable recheck phase`);
    assert.equal(snapshot.status, `${kind}-failed`);
    assert.equal(snapshot.installation.command, scenario.after.command);
    assert.equal(snapshot.installation.provenance, scenario.after.provenance);
    assert.equal(snapshot.installation.version_summary, scenario.after.summary);
    assert.equal(snapshot.error.code, "PROCESS_TIMEOUT");
    assert.equal(JSON.stringify(snapshot).includes("sensitive installer timeout"), false);
  }
});

test("cancelled installer refreshes executable state before returning the cancellation", async () => {
  let installed = false;
  let probes = 0;
  let installerStarted;
  const started = new Promise((resolve) => { installerStarted = resolve; });
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => {
      probes += 1;
      return installed ? executable : { available: false, summary: "missing" };
    },
    preferStandalone: () => {},
    installerRunner: async ({ signal }) => {
      installed = true;
      installerStarted();
      await new Promise((_resolve, reject) => signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("cancelled"), { name: "AbortError", code: "ABORT_ERR" }));
      }, { once: true }));
    },
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 1, stdout: "", stderr: "" }
  });

  const pending = manager.install();
  await started;
  manager.cancel({ operation_id: manager.getSnapshot().operation.id });
  const snapshot = await pending;
  assert.equal(probes, 2);
  assert.equal(snapshot.status, "cancelled");
  assert.equal(snapshot.installation.available, true);
  assert.equal(snapshot.installation.provenance, "standalone");
  assert.equal(snapshot.error.code, "OPERATION_CANCELLED");
  assert.match(snapshot.error.message, /已重新检查/);
});

test("serialized mutations revalidate their preconditions after earlier queued work", async () => {
  let installed = false;
  let installerCalls = 0;
  let releaseInstaller;
  const installerReleased = new Promise((resolve) => { releaseInstaller = resolve; });
  const manager = createCodexSetupManager({
    platform: "linux",
    probeExecutable: async () => installed ? executable : { available: false, summary: "missing" },
    preferStandalone: () => {},
    installerRunner: async () => {
      installerCalls += 1;
      await installerReleased;
      installed = true;
    },
    processRunner: async ({ args }) => args.at(-1) === "--help"
      ? { exitCode: 0, stdout: "--with-api-key", stderr: "" }
      : { exitCode: 1, stdout: "", stderr: "" }
  });

  const first = manager.install();
  const second = manager.install();
  await new Promise((resolve) => setImmediate(resolve));
  releaseInstaller();
  await first;
  await assert.rejects(second, (error) => error.code === "INSTALL_NOT_REQUIRED");
  assert.equal(installerCalls, 1);
});

test("failed and timed-out login processes always recheck status before reporting login-failed", async () => {
  for (const failure of [
    { code: "LOGIN_FAILED", mode: "exit" },
    { code: "PROCESS_TIMEOUT", mode: "throw" }
  ]) {
    let statusChecks = 0;
    const manager = createCodexSetupManager({
      platform: "linux",
      probeExecutable: async () => executable,
      processRunner: async ({ args }) => {
        const command = args.join(" ");
        if (command === "login --help") return { exitCode: 0, stdout: "--device-auth", stderr: "" };
        if (command === "login status") {
          statusChecks += 1;
          return { exitCode: 1, stdout: "", stderr: "not logged in" };
        }
        if (failure.mode === "throw") throw Object.assign(new Error("sensitive login timeout"), { code: failure.code });
        return { exitCode: 1, stdout: "", stderr: "sensitive login failure" };
      }
    });
    const snapshot = await manager.login({ method: "chatgpt", flow: "browser" });
    assert.equal(statusChecks, 2);
    assert.equal(snapshot.status, "login-failed");
    assert.equal(snapshot.authentication.state, "login-failed");
    assert.equal(snapshot.error.code, failure.code);
    assert.equal(JSON.stringify(snapshot).includes("sensitive login"), false);
  }
});

test("installer download is temporary, owner-only, and removed after execution", async () => {
  let observedScript = "";
  const script = new TextEncoder().encode("#!/bin/sh\nexit 0\n");
  await runOfficialInstaller({
    platform: "linux",
    url: "https://chatgpt.com/codex/install.sh",
    fetchImpl: async () => new Response(script, { status: 200, headers: { "content-length": String(script.byteLength) } }),
    processRunner: async (spec) => {
      observedScript = spec.args[0];
      await access(observedScript);
      assert.equal(spec.command, "/bin/sh");
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  });
  await assert.rejects(() => access(observedScript), (error) => error.code === "ENOENT");
});

test("installer download rejects declared and streamed responses above the fixed size bound", async () => {
  let processCalls = 0;
  const invoke = (fetchImpl) => runOfficialInstaller({
    platform: "linux",
    url: "https://chatgpt.com/codex/install.sh",
    fetchImpl,
    processRunner: async () => {
      processCalls += 1;
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  });

  await assert.rejects(
    () => invoke(async () => new Response("ignored", {
      status: 200,
      headers: { "content-length": String(MAX_INSTALLER_RESPONSE_BYTES + 1) }
    })),
    (error) => error.code === "INSTALLER_RESPONSE_TOO_LARGE" && error.stage === "download"
  );

  const oversizedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_INSTALLER_RESPONSE_BYTES));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    }
  });
  await assert.rejects(
    () => invoke(async () => ({ ok: true, status: 200, headers: new Headers(), body: oversizedStream })),
    (error) => error.code === "INSTALLER_RESPONSE_TOO_LARGE" && error.stage === "download"
  );
  assert.equal(processCalls, 0);
});

test("active owner projection covers concurrent Automation and Chat owners", () => {
  const owners = activeCodexOwnersFromStore({
    automation: { active_executions: { local: { execution_id: "EXEC-1" } } },
    sessions: { local: [{ kind: "chat", id: "CHAT-1", status: "waiting_approval" }, { kind: "chat", id: "CHAT-2", status: "completed" }] }
  });
  assert.deepEqual(owners, [{ kind: "automation", id: "EXEC-1" }, { kind: "chat", id: "CHAT-1" }]);
});
