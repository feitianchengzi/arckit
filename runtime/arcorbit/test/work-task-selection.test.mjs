import assert from "node:assert/strict";
import test from "node:test";
import {
  completedAcceptanceSelectionAfterSuccess,
  nextCompletedAcceptanceTaskId
} from "../desktop/renderer/work-task-selection.mjs";

const completed = (id, extra = {}) => ({ id, state: "completed", ...extra });

test("completed acceptance moves from the newest task to the next older task", () => {
  assert.equal(nextCompletedAcceptanceTaskId([
    completed("newest"), completed("next"), completed("oldest")
  ], "newest"), "next");
});

test("completed acceptance moves from a middle task to its adjacent newer task", () => {
  assert.equal(nextCompletedAcceptanceTaskId([
    completed("newest"), completed("middle"), completed("older")
  ], "middle"), "newest");
  assert.equal(nextCompletedAcceptanceTaskId([
    completed("newest"), completed("middle"), completed("oldest")
  ], "oldest"), "middle");
});

test("completed acceptance ignores tree lineage rows when choosing the adjacent task", () => {
  assert.equal(nextCompletedAcceptanceTaskId([
    completed("newest"),
    { id: "parent", state: "pending", tree_matched: false },
    completed("lineage-completed", { tree_matched: false }),
    completed("middle")
  ], "middle"), "newest");
});

test("completed acceptance has no forced selection when no adjacent completed task exists", () => {
  assert.equal(nextCompletedAcceptanceTaskId([completed("only")], "only"), "");
  assert.equal(nextCompletedAcceptanceTaskId([completed("one"), completed("two")], "missing"), "");
});

test("completed acceptance applies the adjacent target while explicit selection intent is unchanged", () => {
  assert.equal(completedAcceptanceSelectionAfterSuccess({
    currentSelectedTaskId: "accepted",
    adjacentTaskId: "adjacent",
    acceptanceSelectionIntentEpoch: 3,
    currentSelectionIntentEpoch: 3
  }), "adjacent");
  assert.equal(completedAcceptanceSelectionAfterSuccess({
    currentSelectedTaskId: "new-user-selection",
    adjacentTaskId: "adjacent",
    acceptanceSelectionIntentEpoch: 3,
    currentSelectionIntentEpoch: 4
  }), "new-user-selection");
  assert.equal(completedAcceptanceSelectionAfterSuccess({
    currentSelectedTaskId: "",
    adjacentTaskId: "adjacent",
    acceptanceSelectionIntentEpoch: 3,
    currentSelectionIntentEpoch: 4
  }), "");
});

test("completed acceptance survives a Work Sync fallback before the action promise resolves", async () => {
  let selectedTaskId = "accepted-oldest";
  let selectionIntentEpoch = 7;
  const acceptanceSelectionIntentEpoch = selectionIntentEpoch;
  let resolveAction;
  const action = new Promise((resolve) => { resolveAction = resolve; });
  const completion = action.then(() => completedAcceptanceSelectionAfterSuccess({
    currentSelectedTaskId: selectedTaskId,
    adjacentTaskId: "adjacent-middle",
    acceptanceSelectionIntentEpoch,
    currentSelectionIntentEpoch: selectionIntentEpoch
  }));

  selectedTaskId = "newest-system-fallback";
  resolveAction();

  assert.equal(await completion, "adjacent-middle");
});

test("completed acceptance preserves a newer user choice after an early Work Sync fallback", async () => {
  let selectedTaskId = "accepted-oldest";
  let selectionIntentEpoch = 7;
  const acceptanceSelectionIntentEpoch = selectionIntentEpoch;
  let resolveAction;
  const action = new Promise((resolve) => { resolveAction = resolve; });
  const completion = action.then(() => completedAcceptanceSelectionAfterSuccess({
    currentSelectedTaskId: selectedTaskId,
    adjacentTaskId: "adjacent-middle",
    acceptanceSelectionIntentEpoch,
    currentSelectionIntentEpoch: selectionIntentEpoch
  }));

  selectedTaskId = "newest-system-fallback";
  selectedTaskId = "newer-user-selection";
  selectionIntentEpoch += 1;
  resolveAction();

  assert.equal(await completion, "newer-user-selection");
});
