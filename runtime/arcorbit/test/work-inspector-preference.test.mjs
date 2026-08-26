import assert from "node:assert/strict";
import test from "node:test";
import {
  createWorkInspectorWidthPersistence,
  effectiveWorkInspectorWidth,
  normalizeWorkInspectorWidth,
  workInspectorKeyboardWidth,
  workInspectorPointerWidth
} from "../src/desktop/work-inspector-preference.mjs";

test("Work Inspector preference normalizes default, bounds, integer and invalid values", () => {
  assert.equal(normalizeWorkInspectorWidth(undefined), 440);
  assert.equal(normalizeWorkInspectorWidth("invalid"), 440);
  assert.equal(normalizeWorkInspectorWidth(359), 360);
  assert.equal(normalizeWorkInspectorWidth(641), 640);
  assert.equal(normalizeWorkInspectorWidth(511.6), 512);
});

test("Work Inspector window constraints preserve list space without changing the saved preference", () => {
  assert.equal(effectiveWorkInspectorWidth(600, 1200), 600);
  assert.equal(effectiveWorkInspectorWidth(600, 900), 468);
  assert.equal(effectiveWorkInspectorWidth(440, 748), 316);
  assert.equal(effectiveWorkInspectorWidth(440, 1200), 440);
});

test("Work Inspector keyboard adjustment uses 16px and Shift 48px steps", () => {
  assert.equal(workInspectorKeyboardWidth(440, "ArrowLeft"), 456);
  assert.equal(workInspectorKeyboardWidth(440, "ArrowRight"), 424);
  assert.equal(workInspectorKeyboardWidth(440, "ArrowLeft", true), 488);
  assert.equal(workInspectorKeyboardWidth(440, "ArrowRight", true), 392);
  assert.equal(workInspectorKeyboardWidth(440, "Enter"), null);
});

test("Work Inspector pointer adjustment grows leftward and persists only a normalized candidate", () => {
  assert.equal(workInspectorPointerWidth(440, 800, 760), 480);
  assert.equal(workInspectorPointerWidth(440, 800, 840), 400);
  assert.equal(workInspectorPointerWidth(440, 800, 100), 640);
  assert.equal(workInspectorPointerWidth(440, 800, 1200), 360);
});

test("Work Inspector persistence serializes intents without letting an older response replace the latest width", async () => {
  const requests = [];
  const visible = [];
  const confirmed = [];
  const persistence = createWorkInspectorWidthPersistence({
    initialWidth: 440,
    persistWidth: (width) => new Promise((resolve, reject) => requests.push({ width, resolve, reject })),
    onVisibleWidth: (width) => visible.push(width),
    onConfirmedWidth: (width) => confirmed.push(width)
  });

  const first = persistence.persist(456);
  const second = persistence.persist(472);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(requests.map((request) => request.width), [456]);
  assert.equal(visible.at(-1), 472);

  requests[0].resolve({ work_inspector_width_px: 456 });
  assert.equal(await first, 456);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(requests.map((request) => request.width), [456, 472]);
  assert.equal(visible.at(-1), 472);

  requests[1].resolve({ work_inspector_width_px: 472 });
  assert.equal(await second, 472);
  assert.equal(visible.at(-1), 472);
  assert.deepEqual(confirmed, [456, 472]);
});

test("Work Inspector persistence keeps the latest optimistic intent when an older request fails", async () => {
  const requests = [];
  const visible = [];
  const persistence = createWorkInspectorWidthPersistence({
    initialWidth: 440,
    persistWidth: (width) => new Promise((resolve, reject) => requests.push({ width, resolve, reject })),
    onVisibleWidth: (width) => visible.push(width)
  });

  const first = persistence.persist(456);
  const second = persistence.persist(472);
  await new Promise((resolve) => setImmediate(resolve));
  requests[0].reject(new Error("first write failed"));
  await assert.rejects(first, /first write failed/);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(visible.at(-1), 472);

  requests[1].resolve({ work_inspector_width_px: 472 });
  assert.equal(await second, 472);
  assert.equal(visible.at(-1), 472);
});
