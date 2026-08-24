import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import electron from "electron";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/experience-realization-electron.mjs", import.meta.url));

const { stdout } = await execFileAsync(electron, electronFixtureArguments(fixturePath), {
  timeout: 25_000,
  maxBuffer: 1024 * 1024
});

const result = JSON.parse(stdout.trim());
assert.equal(result.pages.length, 10);
assert.equal(result.visible_text_below_11, 0);
assert.equal(result.standard_control_violations, 0);
assert.equal(result.checkbox_target_violations, 0);
assert.equal(result.selectable_row_violations, 0);
assert.equal(result.keyboard_selection_changed, true);
assert.equal(result.work_display_title.includes("\n"), false);
assert.equal(result.work_display_title.endsWith("…"), true);
assert.equal([...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(result.work_display_title)].length, 64);
assert.equal(result.work_inspector_title, "待办 W-11");
assert.match(result.work_inspector_content, /Verify Work state scope/);
assert.match(result.work_inspector_content, /👩‍💻/);
assert.equal(result.current_run_display_title.includes("\n"), false);
assert.equal(result.current_run_display_title.endsWith("…"), true);
assert.equal(result.current_run_single_line, true);
assert.equal(result.core_navigation_vector_icons, 10);
assert.equal(result.core_navigation_text_icons, 0);
assert.equal(result.table_font_px, 14);
assert.equal(result.conversation_font_px, 15);
