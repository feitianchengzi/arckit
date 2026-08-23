import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/recovery-composer-electron.mjs", import.meta.url));

test("Recovery Center preserves the active Composer across automation snapshot refreshes", {
  skip: process.env.ARCORBIT_ELECTRON_RECOVERY_TEST !== "1" && "set ARCORBIT_ELECTRON_RECOVERY_TEST=1 to run the real-render Recovery Center regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  assert.equal(result.initiallyFocused, true);
  assert.equal(result.eventPreserved, true);
  assert.equal(result.updatePreserved, true);
  assert.equal(result.deletePreserved, true);
  assert.equal(result.updatedMessage, "Recovery details updated");
  assert.deepEqual(result.updatedActions, ["feedback_continue", "mark_blocked"]);
  assert.equal(result.extraAdded, true);
  assert.equal(result.extraRemoved, true);
  assert.deepEqual(result.submitCall, ["resolveAutomationRecovery", {
    recoveryId: "RECOVERY-global",
    action: "feedback_continue",
    message: "请保留这段恢复说明"
  }]);
  assert.deepEqual(result.errors, []);
});
