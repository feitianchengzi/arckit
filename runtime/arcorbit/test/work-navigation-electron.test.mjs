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
const fixturePath = fileURLToPath(new URL("./fixtures/work-navigation-electron.mjs", import.meta.url));

test("Work and Feedback keep one control rail above independently scrolling remaining-height panes", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST !== "1" && "set ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 to run the Electron Work navigation regression"
}, async () => {
  const resultDir = await mkdtemp(join(tmpdir(), "arcorbit-work-navigation-electron-"));
  const resultPath = join(resultDir, "result.json");
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true", ARCORBIT_ELECTRON_RESULT_FILE: resultPath };
  delete env.ELECTRON_RUN_AS_NODE;
  let result;
  try {
    await execFileAsync(electron, [fixturePath], { env, timeout: 10_000 });
    result = JSON.parse(await readFile(resultPath, "utf8"));
    if (result.fixture_error) throw new Error([result.fixture_error, ...(result.errors || [])].join("\n"));
  } finally {
    await rm(resultDir, { recursive: true, force: true });
  }

  assert.equal(result.immediate_active, true);
  assert.ok(result.click_duration_ms < 80, `Work navigation click took ${result.click_duration_ms}ms`);
  assert.equal(result.work_query_state, "pending");
  assert.equal(result.work_query_has_complete_key, true);
  assert.equal(result.failure_immediate_active, true);
  assert.ok(result.cached_rows_after_failure > 0);
  assert.equal(result.failure_toast_visible, true);
  for (const geometry of [result.loading_layout, result.error_layout, result.populated_layout, result.empty_layout]) {
    assert.equal(geometry.direct_children, 2);
    assert.equal(geometry.rail_height, 44);
    assert.equal(geometry.rail_single_line, true);
    assert.equal(geometry.rail_before_layout, true);
    assert.equal(geometry.layout_within_page, true);
    assert.equal(geometry.header_visible, true);
  }
  assert.equal(result.populated_layout.list_scrolls, true);
  assert.equal(result.populated_layout.list_overflow_y, "auto");
  assert.equal(result.populated_layout.detail_scrolls, true);
  assert.equal(result.populated_layout.detail_overflow_y, "auto");
  assert.equal(result.empty_layout.list_scrolls, false);
  assert.ok(Math.abs(result.populated_layout.layout_height - result.empty_layout.layout_height) < 0.5);
  assert.equal(result.desktop_work_rail.state_buttons_visible, true);
  assert.equal(result.desktop_work_rail.compact_state_hidden, true);

  assert.equal(result.feedback_layout.direct_children, 2);
  assert.equal(result.feedback_layout.rail_height, 44);
  assert.equal(result.feedback_layout.rail_single_line, true);
  assert.equal(result.feedback_layout.rail_before_layout, true);
  assert.equal(result.feedback_layout.layout_within_page, true);
  assert.equal(result.feedback_layout.list_scrolls, true, JSON.stringify(result.feedback_layout));
  assert.equal(result.feedback_layout.detail_scrolls, true);
  assert.equal(result.feedback_layout.list_overflow_y, "auto");
  assert.equal(result.feedback_layout.detail_overflow_y, "auto");

  assert.equal(result.compact_feedback.rail_single_line, true);
  assert.equal(result.compact_feedback.more_visible, true);
  assert.equal(result.compact_feedback.layout_within_page, true);
  assert.equal(result.compact_feedback.selected, result.feedback_context.selected);
  assert.equal(result.compact_feedback.list_scroll, result.feedback_context.list_scroll);
  assert.equal(result.compact_feedback.detail_scroll, result.feedback_context.detail_scroll);

  assert.equal(result.compact_work.rail_single_line, true);
  assert.equal(result.compact_work.state_buttons_hidden, true);
  assert.equal(result.compact_work.compact_state_visible, true);
  assert.ok(result.compact_work.filter_popover.left >= 12);
  assert.ok(result.compact_work.filter_popover.top >= 12);
  assert.ok(result.compact_work.filter_popover.right <= result.compact_work.filter_popover.viewport_width - 12);
  assert.ok(result.compact_work.filter_popover.bottom <= result.compact_work.filter_popover.viewport_height - 12);
  assert.ok(result.compact_work.list_scroll > 0);
  assert.ok(result.compact_work.detail_scroll > 0);
  assert.equal(result.minimum_work.rail_single_line, true);
  assert.equal(result.minimum_work.layout_within_page, true);
  assert.ok(result.minimum_work.layout_height > 400);
  assert.ok(result.minimum_work.filter_popover.left >= 12);
  assert.ok(result.minimum_work.filter_popover.top >= 12);
  assert.ok(result.minimum_work.filter_popover.right <= result.minimum_work.filter_popover.viewport_width - 12);
  assert.ok(result.minimum_work.filter_popover.bottom <= result.minimum_work.filter_popover.viewport_height - 12);
  assert.ok(result.minimum_work.filter_popover.columns <= 2);
  assert.equal(result.minimum_work.selected, result.compact_work.selected);
  assert.equal(result.minimum_work.list_scroll, result.compact_work.list_scroll);
  assert.equal(result.minimum_work.detail_scroll, result.compact_work.detail_scroll);
});
