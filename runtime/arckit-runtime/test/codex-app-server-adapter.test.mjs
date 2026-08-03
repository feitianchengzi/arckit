import assert from "node:assert/strict";
import test from "node:test";
import { waitForActiveTurn } from "../adapters/codex-app-server-adapter.mjs";

test("operator control waits for turn/started after turn/start returns", async () => {
  const state = {
    threadId: "THREAD-1",
    turnId: "TURN-1",
    turnStarted: false,
    completed: false
  };
  const waiting = waitForActiveTurn(state, { timeoutMs: 100, pollIntervalMs: 1 });
  setTimeout(() => {
    state.turnStarted = true;
  }, 5);
  await waiting;
});

test("operator control does not wait past a completed turn", async () => {
  await assert.rejects(
    waitForActiveTurn({ turnStarted: false, completed: true }, { timeoutMs: 10, pollIntervalMs: 1 }),
    /already completed/
  );
});
