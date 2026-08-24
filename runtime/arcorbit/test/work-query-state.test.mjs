import assert from "node:assert/strict";
import test from "node:test";
import { createWorkQueryState, normalizeWorkQuery, workQueryKey } from "../desktop/renderer/work-query-state.mjs";

test("Work query keys cover scope, state, search, filters, dates and window with canonical multi-value ordering", () => {
  const left = workQueryKey({
    workset_id: "W-1", project_id: "all", state: "pending", search_key: " Release ", offset: 0, limit: 80,
    filters: { creator_ids: ["8", "7"], executor_ids: ["9"], tag_ids: ["2", "1"], priorities: ["1"], start_time: "2026-01-01", end_time: "2026-08-24" }
  });
  const right = workQueryKey({
    workset_id: "W-1", project_id: "all", state: "pending", search_key: "release", offset: 0, limit: 80,
    filters: { creator_ids: ["7", "8"], executor_ids: ["9"], tag_ids: ["1", "2"], priorities: ["1"], start_time: "2026-01-01", end_time: "2026-08-24" }
  });
  assert.equal(left, right);
  assert.deepEqual(normalizeWorkQuery(JSON.parse(left)), JSON.parse(left));
});

test("Work query state keeps a bounded SWR cache and rejects stale or mismatched responses", () => {
  const state = createWorkQueryState({ cacheLimit: 2 });
  const pending = state.begin({ state: "pending" });
  const completed = state.begin({ state: "completed" });
  assert.deepEqual(state.accept(pending, { query_key: pending.key, tasks: ["old"] }), { current: false, accepted: true });
  assert.deepEqual(state.accept(completed, { query_key: "wrong", tasks: [] }), { current: false, accepted: false });
  assert.deepEqual(state.accept(completed, { query_key: completed.key, tasks: ["new"] }), { current: true, accepted: true });
  const pendingAgain = state.begin({ state: "pending" });
  assert.deepEqual(pendingAgain.cached.tasks, ["old"]);
  const blocked = state.begin({ state: "blocked" });
  state.accept(blocked, { query_key: blocked.key, tasks: [] });
  assert.equal(state.size(), 2);
  assert.equal(state.get(completed.key), null);
});

test("Work query state does not let an older same-key response overwrite a newer cached projection", () => {
  const state = createWorkQueryState();
  const older = state.begin({ state: "pending" });
  const newer = state.begin({ state: "pending" });

  assert.deepEqual(state.accept(newer, { query_key: newer.key, version: "new" }), { current: true, accepted: true });
  assert.deepEqual(state.accept(older, { query_key: older.key, version: "old" }), { current: false, accepted: true });

  assert.equal(state.begin({ state: "pending" }).cached.version, "new");
});
