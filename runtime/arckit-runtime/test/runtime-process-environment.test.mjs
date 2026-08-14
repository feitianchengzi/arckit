import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { sanitizeRuntimeProcessEnvironment } from "../src/runtime-process-environment.mjs";

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
  const entrypoint = new URL("../bin/arckit-runtime.mjs", import.meta.url);
  const source = await readFile(fileURLToPath(entrypoint), "utf8");
  const sanitizeIndex = source.indexOf("sanitizeRuntimeProcessEnvironment();");
  const cliImportIndex = source.indexOf('await import("../src/cli.mjs")');

  assert.notEqual(sanitizeIndex, -1);
  assert.notEqual(cliImportIndex, -1);
  assert.ok(sanitizeIndex < cliImportIndex);
});
