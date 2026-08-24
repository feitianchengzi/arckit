import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/feedback-v2-images-electron.mjs", import.meta.url));

test("Feedback V2 message images default-load, recover locally, and reuse the managed viewer", {
  skip: process.env.ARCORBIT_ELECTRON_FEEDBACK_V2_TEST !== "1" && "set ARCORBIT_ELECTRON_FEEDBACK_V2_TEST=1 to run the interactive Electron regression"
}, async () => {
  const resultDir = await mkdtemp(join(tmpdir(), "arcorbit-feedback-v2-result-"));
  const resultFile = join(resultDir, "result.json");
  const env = {
    ...process.env,
    ARCORBIT_ELECTRON_FEEDBACK_V2_TEST: "1",
    ARCORBIT_ELECTRON_RESULT_FILE: resultFile,
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true"
  };
  delete env.ELECTRON_RUN_AS_NODE;
  let result;
  try {
    await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
    result = JSON.parse(await readFile(resultFile, "utf8"));
    if (result.fixture_error) throw new Error(result.fixture_error);
  } finally {
    await rm(resultDir, { recursive: true, force: true });
  }

  assert.equal(result.selectedFeedbackId, "F-11-V2");
  assert.equal(result.conversationVisibleAfterFailure, true);
  assert.equal(result.retryVisible, true);
  assert.equal(result.imageLoadedAfterRetry, true);
  assert.equal(result.calls.some(([command, input]) => command === "getFeedbackV2Messages"
    && input.feedback_id === "F-11-V2"), true);
  assert.equal(result.calls.filter(([command, input]) => command === "previewImage"
    && input.source === "feedback-v2"
    && input.feedback_id === "F-11-V2"
    && input.attachment_id === "A-F-11-V2-1").length, 2);
  assert.equal(result.calls.some(([command, input]) => command === "openImageViewer"
    && input.source === "feedback-v2"
    && input.feedback_id === "F-11-V2"
    && input.attachment_id === "A-F-11-V2-1"), true);
  assert.deepEqual(result.errors, []);
});
