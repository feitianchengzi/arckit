import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PassThrough } from "node:stream";
import { createElectronUtilityRuntimeHost } from "../src/electron-utility-runtime-host.mjs";

test("Electron utility host launches the Runtime module and sends typed controls", () => {
  const calls = [];
  const messages = [];
  const utilityChild = new EventEmitter();
  utilityChild.pid = 42;
  utilityChild.stdout = new PassThrough();
  utilityChild.stderr = new PassThrough();
  utilityChild.postMessage = (message) => messages.push(message);
  utilityChild.kill = () => true;
  const host = createElectronUtilityRuntimeHost({
    fork(modulePath, args, options) {
      calls.push({ modulePath, args, options });
      return utilityChild;
    }
  });

  const child = host.spawn("/app.asar/bin/arcorbit.mjs", ["run", "--project", "/project"], {
    cwd: "/resources",
    env: { PATH: "/usr/bin", ELECTRON_RUN_AS_NODE: "1" }
  });
  host.sendControl(child, { type: "steer", message: "continue" });

  assert.equal(host.controlMode, "parent-port");
  assert.deepEqual(calls, [{
    modulePath: "/app.asar/bin/arcorbit.mjs",
    args: ["run", "--project", "/project"],
    options: { cwd: "/resources", env: { PATH: "/usr/bin" }, stdio: "pipe", serviceName: "ArcOrbit Runtime" }
  }]);
  assert.deepEqual(messages, [{ schema_version: "arcorbit-runtime-control/v1", type: "steer", message: "continue" }]);
});

test("Runtime and trusted ledger production paths do not bootstrap Electron as Node", async () => {
  const files = [
    new URL("../bin/arcorbit.mjs", import.meta.url),
    new URL("../src/desktop-run-manager.mjs", import.meta.url),
    new URL("../src/ledger-scripts.mjs", import.meta.url),
    new URL("../../../entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs", import.meta.url),
    new URL("../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs", import.meta.url),
    new URL("../../../entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs", import.meta.url)
  ];
  for (const file of files) {
    const source = await readFile(fileURLToPath(file), "utf8");
    assert.doesNotMatch(source, /ELECTRON_RUN_AS_NODE/);
    if (file.pathname.includes("arckit-development-ledger")) {
      assert.doesNotMatch(source, /spawnSync\(process\.execPath/);
    }
  }
});

test("Runtime entrypoint closes output pipes before its required utility-process exit", async () => {
  const source = await readFile(new URL("../bin/arcorbit.mjs", import.meta.url), "utf8");

  assert.match(source, /closeOutput\(process\.stdout\)/);
  assert.match(source, /closeOutput\(process\.stderr\)/);
  assert.match(source, /stream\.end\(resolve\)/);
  assert.doesNotMatch(source, /process\.stdout\.write\(""/);
});
