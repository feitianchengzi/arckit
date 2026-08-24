import assert from "node:assert/strict";
import test from "node:test";
import { taskDisplayTitle, TASK_DISPLAY_TITLE_GRAPHEME_LIMIT } from "../src/task-display-title.mjs";

const countGraphemes = (value) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].length;

test("task display title folds Unicode whitespace and preserves the 63/64/65 grapheme boundary", () => {
  assert.equal(taskDisplayTitle("  第一行\n\t第二行\u00a0第三行  ", "fallback"), "第一行 第二行 第三行");
  assert.equal(taskDisplayTitle("a".repeat(63)), "a".repeat(63));
  assert.equal(taskDisplayTitle("a".repeat(64)), "a".repeat(64));
  assert.equal(taskDisplayTitle("a".repeat(65)), `${"a".repeat(63)}…`);
  assert.equal(countGraphemes(taskDisplayTitle("a".repeat(65))), TASK_DISPLAY_TITLE_GRAPHEME_LIMIT);
});

test("task display title never splits combining characters, surrogate pairs, or ZWJ emoji", () => {
  const combining = "e\u0301";
  const emoji = "👨‍👩‍👧‍👦";
  const supplementary = "𠮷";
  for (const grapheme of [combining, emoji, supplementary]) {
    const title = taskDisplayTitle(grapheme.repeat(65));
    assert.equal(countGraphemes(title), TASK_DISPLAY_TITLE_GRAPHEME_LIMIT);
    assert.equal(title, `${grapheme.repeat(63)}…`);
    assert.equal(title.includes("�"), false);
  }
});

test("task display title uses a normalized fallback only when the source is empty", () => {
  assert.equal(taskDisplayTitle(" \n ", " Task\n42 "), "Task 42");
});
