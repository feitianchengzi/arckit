import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/setup-readiness-electron.mjs", import.meta.url));

test("Setup Readiness selects managed-stale paths explicitly and keeps action failures visible", {
  skip: process.env.ARCORBIT_ELECTRON_SETUP_TEST !== "1" && "set ARCORBIT_ELECTRON_SETUP_TEST=1 to run the real-render Setup regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.initialDisabled, true);
  assert.equal(result.cleanupPanelVisible, true);
  assert.equal(result.cleanupBeforeChecks, true);
  assert.equal(result.planCollapsed, true);
  assert.equal(result.selectedAfterSelectAll, 2);
  assert.equal(result.selectedButtonDisabled, false);
  assert.match(result.selectedButtonText, /所选（1）/);
  assert.equal(result.actionErrorVisible, true);
  assert.match(result.actionErrorText, /SETUP_ACTION_FAILED/);
  assert.match(result.actionErrorText, /fixture managed removal failure/);
  assert.equal(result.toastAboveSetup, true);
  assert.equal(result.setupHiddenAfterRemoval, true);
  assert.deepEqual(result.calls, [
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["remove", { managedPaths: ["/fixture/.codex/skills/arcforge-on-demand"], confirmationDigest: "b".repeat(64) }]
  ]);
});
