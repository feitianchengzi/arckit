import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  runtimeNodeChildEnvironment,
  sanitizeRuntimeProcessEnvironment
} from "../src/runtime-process-environment.mjs";

test("Runtime bootstrap removes Electron's Node-host flag without disturbing other environment entries", () => {
  const env = {
    ELECTRON_RUN_AS_NODE: "1",
    PATH: "/opt/runtime/bin",
    ARCKIT_CODEX_BIN: "/opt/runtime/bin/codex"
  };

  assert.equal(sanitizeRuntimeProcessEnvironment(env), env);
  assert.deepEqual(env, {
    PATH: "/opt/runtime/bin",
    ARCKIT_CODEX_BIN: "/opt/runtime/bin/codex"
  });
});

test("Runtime entrypoint sanitizes the process environment before loading the CLI graph", async () => {
  const entrypoint = new URL("../bin/arcorbit.mjs", import.meta.url);
  const source = await readFile(fileURLToPath(entrypoint), "utf8");
  const sanitizeIndex = source.indexOf("sanitizeRuntimeProcessEnvironment();");
  const cliImportIndex = source.indexOf('await import("../src/cli.mjs")');

  assert.notEqual(sanitizeIndex, -1);
  assert.notEqual(cliImportIndex, -1);
  assert.ok(sanitizeIndex < cliImportIndex);
});

test("Runtime-owned Node children restore embedded Node mode without leaking it to external children", () => {
  const externalEnv = {
    ELECTRON_RUN_AS_NODE: "1",
    PATH: "/opt/runtime/bin"
  };

  sanitizeRuntimeProcessEnvironment(externalEnv);

  assert.deepEqual(externalEnv, { PATH: "/opt/runtime/bin" });
  assert.deepEqual(runtimeNodeChildEnvironment({ electron: "31.7.7", node: "20.18.0" }), {
    ELECTRON_RUN_AS_NODE: "1"
  });
  assert.deepEqual(runtimeNodeChildEnvironment({ node: "22.22.2" }), {});
});

test("every Runtime-owned Node launcher uses the shared embedded-Node environment", async () => {
  const files = [
    new URL("../src/ledger-scripts.mjs", import.meta.url),
    new URL("../src/project-initializer.mjs", import.meta.url),
    new URL("../src/desktop-run-manager.mjs", import.meta.url)
  ];

  for (const file of files) {
    const source = await readFile(fileURLToPath(file), "utf8");
    assert.match(source, /nodeEnv = runtimeNodeChildEnvironment\(\)/);
  }
});
