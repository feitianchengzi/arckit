import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

test("real settings page offers model-specific suggestions, saves in place and recovers failures", {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== "1" && "set ARCORBIT_ELECTRON_LAYOUT_TEST=1 for Electron behavior verification"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, [fileURLToPath(new URL("./fixtures/codex-settings-electron.mjs", import.meta.url))], { env, timeout: 20_000 });
  const result = JSON.parse(stdout.trim());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.defaults, ["gpt-6-astra", "high", "gpt-6-astra", "high"]);
  assert.equal(result.yoloDefault, false);
  assert.equal(result.yoloRestored, true);
  assert.equal(result.preservedDraft, "test-model");
  assert.deepEqual(result.levels, ["low", "max"]);
  assert.equal(result.retainedLevel, "high");
  assert.equal(result.savedInPlace, true);
  assert.match(result.saveFeedback, /新对话使用 Chat 默认值/);
  assert.deepEqual(result.restored, ["test-model", "max", "automation-model", "low"]);
  assert.match(result.manualFallback, /手动输入/);
  assert.equal(result.failedDraft, "future-model");
  assert.deepEqual(result.saves.at(-1)[1], { codex: {
    yolo_mode: true,
    chat: { model: "future-model", reasoning_effort: "max" },
    automation: { model: "automation-model", reasoning_effort: "low" }
  } });
  assert.deepEqual(result.composerDefaults, ["future-model", "max"]);
  assert.deepEqual(result.composerModels, ["future-model", "gpt-6-astra", "test-model"]);
  assert.deepEqual(result.composerDrafts.at(-1)[1], {
    session_id: "",
    project_id: "local-11",
    text: "",
    model: "test-model",
    reasoning_effort: "max"
  });
  assert.equal(result.modelInputType, "text");
  assert.equal(result.effortInputType, "text");
  assert.equal(result.hasLiveFeedback, true);
  assert.ok(result.fieldWidth > 100);
});
