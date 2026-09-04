import assert from "node:assert/strict";
import test from "node:test";
import { createKeyedDetailSurface } from "../desktop/renderer/keyed-detail-surface.mjs";

function createHarness() {
  const ownerDocument = { activeElement: null };
  let writes = 0;
  let scroll = null;
  let focusTarget = null;
  const host = {
    ownerDocument,
    contains(candidate) { return candidate === focusTarget; },
    querySelector(selector) { return selector === ".scroll" ? scroll : null; },
    querySelectorAll(selector) { return selector === "[data-detail-focus-key]" && focusTarget ? [focusTarget] : []; },
    set innerHTML(value) {
      writes += 1;
      this._html = value;
      ownerDocument.activeElement = null;
      scroll = { scrollTop: 0 };
      focusTarget = createFocusTarget(ownerDocument);
    },
    get innerHTML() { return this._html || ""; }
  };
  return {
    host,
    ownerDocument,
    surface: createKeyedDetailSurface({ host, scrollSelector: ".scroll" }),
    writes: () => writes,
    scroll: () => scroll,
    focus: () => focusTarget
  };
}

function createFocusTarget(ownerDocument) {
  return {
    value: "",
    selectionStart: 0,
    selectionEnd: 0,
    selectionDirection: "none",
    getAttribute(name) { return name === "data-detail-focus-key" ? "draft" : null; },
    focus() { ownerDocument.activeElement = this; },
    setSelectionRange(start, end, direction) {
      this.selectionStart = Math.min(start, this.value.length);
      this.selectionEnd = Math.min(end, this.value.length);
      this.selectionDirection = direction;
    }
  };
}

test("Keyed Detail Surface skips an unchanged projection without replacing the active context DOM", () => {
  const harness = createHarness();
  harness.surface.render({ contextId: "ITEM-A", html: "<div>A</div>" });
  const originalScroll = harness.scroll();
  originalScroll.scrollTop = 240;

  const result = harness.surface.render({ contextId: "ITEM-A", html: "<div>A</div>" });

  assert.deepEqual(result, { changed: false, contextChanged: false });
  assert.equal(harness.writes(), 1);
  assert.equal(harness.scroll(), originalScroll);
  assert.equal(harness.scroll().scrollTop, 240);
});

test("Keyed Detail Surface restores a focused control value before its selection when the same context changes", () => {
  const harness = createHarness();
  harness.surface.render({ contextId: "ITEM-A", html: "<div>A</div>" });
  harness.scroll().scrollTop = 240;
  harness.focus().value = "draft text";
  harness.focus().focus();
  harness.focus().setSelectionRange(3, 7, "backward");

  const result = harness.surface.render({ contextId: "ITEM-A", html: "<div>A updated</div>" });

  assert.deepEqual(result, { changed: true, contextChanged: false });
  assert.equal(harness.writes(), 2);
  assert.equal(harness.scroll().scrollTop, 240);
  assert.equal(harness.ownerDocument.activeElement, harness.focus());
  assert.equal(harness.focus().value, "draft text");
  assert.deepEqual(
    [harness.focus().selectionStart, harness.focus().selectionEnd, harness.focus().selectionDirection],
    [3, 7, "backward"]
  );
});

test("Keyed Detail Surface starts a different context at the top without transferring focus", () => {
  const harness = createHarness();
  harness.surface.render({ contextId: "ITEM-A", html: "<div>A</div>" });
  harness.scroll().scrollTop = 240;
  harness.focus().focus();

  const result = harness.surface.render({ contextId: "ITEM-B", html: "<div>B</div>" });

  assert.deepEqual(result, { changed: true, contextChanged: true });
  assert.equal(harness.writes(), 2);
  assert.equal(harness.scroll().scrollTop, 0);
  assert.notEqual(harness.ownerDocument.activeElement, harness.focus());
});
