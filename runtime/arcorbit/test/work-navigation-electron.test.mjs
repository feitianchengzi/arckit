import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/work-navigation-electron.mjs", import.meta.url));

test("Work navigation is cache-first under slow and failed task refreshes", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST !== "1" && "set ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 to run the Electron Work navigation regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 10_000 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.immediate_active, true);
  assert.ok(result.click_duration_ms < 80, `Work navigation click took ${result.click_duration_ms}ms`);
  assert.equal(result.work_query_state, "pending");
  assert.equal(result.work_query_has_complete_key, true);
  assert.equal(result.failure_immediate_active, true);
  assert.ok(result.cached_rows_after_failure > 0);
  assert.equal(result.failure_toast_visible, true);
  assert.equal(result.populated_layout.direct_children, 4);
  assert.equal(result.populated_layout.status_visible, true);
  assert.equal(result.populated_layout.status_before_list, true);
  assert.equal(result.populated_layout.list_within_page, true);
  assert.equal(result.populated_layout.list_scrolls, true);
  assert.equal(result.populated_layout.list_overflow_y, "auto");
  assert.equal(result.empty_layout.direct_children, 4);
  assert.equal(result.empty_layout.status_visible, true);
  assert.equal(result.empty_layout.status_before_list, true);
  assert.equal(result.empty_layout.list_within_page, true);
  assert.equal(result.empty_layout.list_scrolls, false);
  assert.ok(Math.abs(result.populated_layout.status_height - result.empty_layout.status_height) < 0.5);
  assert.ok(Math.abs(result.populated_layout.list_height - result.empty_layout.list_height) < 0.5);
});
