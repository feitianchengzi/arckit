import assert from "node:assert/strict";
import test from "node:test";
import {
  imageViewerFitScale,
  initialImageViewerTransform,
  normalizeRotation,
  reduceImageViewerTransform
} from "../desktop/image-viewer/state.mjs";

test("image viewer computes bounded fit scales for normal and rotated images", () => {
  assert.equal(imageViewerFitScale({ image_width: 1600, image_height: 900, viewport_width: 800, viewport_height: 600 }), 0.5);
  assert.equal(imageViewerFitScale({ image_width: 1600, image_height: 900, viewport_width: 800, viewport_height: 600, rotation: 90 }), 0.375);
  assert.equal(imageViewerFitScale({ image_width: 200, image_height: 100, viewport_width: 800, viewport_height: 600 }), 1);
  assert.equal(imageViewerFitScale({}), 1);
});

test("image viewer transform supports zoom, pan, rotate, actual size, fit, and reset", () => {
  let state = initialImageViewerTransform();
  state = reduceImageViewerTransform(state, { type: "zoom_by", factor: 2 });
  state = reduceImageViewerTransform(state, { type: "pan", x: 12, y: -7 });
  state = reduceImageViewerTransform(state, { type: "rotate", degrees: -90 });
  assert.deepEqual(state, { zoom: 2, rotation: 270, offset_x: 0, offset_y: 0, mode: "custom" });
  assert.deepEqual(reduceImageViewerTransform(state, { type: "actual" }), { zoom: 1, rotation: 270, offset_x: 0, offset_y: 0, mode: "actual" });
  assert.deepEqual(reduceImageViewerTransform(state, { type: "fit", zoom: 0.4 }), { zoom: 0.4, rotation: 270, offset_x: 0, offset_y: 0, mode: "fit" });
  assert.deepEqual(reduceImageViewerTransform(state, { type: "reset", zoom: 0.5 }), { zoom: 0.5, rotation: 0, offset_x: 0, offset_y: 0, mode: "fit" });
  assert.equal(normalizeRotation(450), 90);
});

test("image viewer clamps extreme zoom values", () => {
  assert.equal(reduceImageViewerTransform(initialImageViewerTransform(), { type: "zoom", zoom: 100 }).zoom, 8);
  assert.equal(reduceImageViewerTransform(initialImageViewerTransform(), { type: "zoom", zoom: 0.001 }).zoom, 0.1);
});
