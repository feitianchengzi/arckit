import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRuntimeRecordRef, runtimeRecordRefForRun } from "../src/runtime-record-ref.mjs";

test("Runtime run references are opaque and contain no local filesystem path", () => {
  const ref = runtimeRecordRefForRun("RUN-20260803-072154820Z");

  assert.equal(ref, "arckit-runtime://runs/RUN-20260803-072154820Z");
  assert.equal(normalizeRuntimeRecordRef(ref), ref);
  assert.equal(normalizeRuntimeRecordRef(""), "");
});

test("Runtime run references reject project and absolute filesystem paths", () => {
  assert.throws(
    () => normalizeRuntimeRecordRef("arckit/project/runtime-results/RUN-1.json"),
    /arckit-runtime:\/\/runs/
  );
  assert.throws(
    () => normalizeRuntimeRecordRef("/tmp/RUN-1/result.json"),
    /arckit-runtime:\/\/runs/
  );
});
