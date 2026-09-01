import assert from "node:assert/strict";
import test from "node:test";
import { createRunActivityPatch } from "../src/projection/run-activity-patch.mjs";
import {
  activityOwnerMatchesRun,
  applyRunActivityPatch,
  createSingleFlightActivitySync
} from "../desktop/renderer/run-activity-sync.mjs";

test("run activity patch carries only changed fields and message upserts", () => {
  const previous = {
    run_id: "RUN-1",
    projection_revision: 0,
    status: "running",
    current_step: "Starting",
    messages: [{ id: "M-1", revision: 1, content: "A" }],
    stable_history: [{ id: "H-1" }]
  };
  const current = {
    ...previous,
    current_step: "Working",
    messages: [
      { id: "M-1", revision: 2, content: "AB" },
      { id: "M-2", revision: 1, content: "Done" }
    ]
  };

  const patch = createRunActivityPatch({ runId: "RUN-1", previous, current, baseRevision: 0, revision: 1 });
  const run = applyRunActivityPatch({ id: "RUN-1", activity: previous }, patch);

  assert.deepEqual(Object.keys(patch.changed), ["current_step"]);
  assert.deepEqual(patch.message_upserts.map((message) => message.id), ["M-1", "M-2"]);
  assert.equal("stable_history" in patch.changed, false);
  assert.equal(run.activity.projection_revision, 1);
  assert.equal(run.activity.current_step, "Working");
  assert.deepEqual(run.activity.messages, current.messages);
  assert.equal(applyRunActivityPatch(run, patch), null);
});

test("activity owner rejects stale run ownership", () => {
  const run = { id: "RUN-1", project_id: "P-1", session_id: "S-1", task_id: "T-1" };
  assert.equal(activityOwnerMatchesRun({ run_id: "RUN-1", project_id: "P-1" }, run), true);
  assert.equal(activityOwnerMatchesRun({ run_id: "RUN-OLD", project_id: "P-1" }, run), false);
  assert.equal(activityOwnerMatchesRun({ run_id: "RUN-1", task_id: "T-OLD" }, run), false);
});

test("one hundred activity invalidations remain strictly single-flight", async () => {
  const scheduled = [];
  let concurrent = 0;
  let maxConcurrent = 0;
  let consumed = 0;
  const sync = createSingleFlightActivitySync({
    isEligible: (event) => event.visible,
    schedule(callback) {
      scheduled.push(callback);
      return callback;
    },
    async consume() {
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setImmediate(resolve));
      consumed += 1;
      concurrent -= 1;
    }
  });

  assert.equal(sync.enqueue({ visible: false }), false);
  for (let index = 0; index < 100; index += 1) sync.enqueue({ visible: true, revision: index + 1 });

  assert.equal(scheduled.length, 1);
  await scheduled.shift()();
  assert.deepEqual(sync.state(), { pending: 0, scheduled: false, in_flight: false });
  assert.equal(consumed, 100);
  assert.equal(maxConcurrent, 1);
});
