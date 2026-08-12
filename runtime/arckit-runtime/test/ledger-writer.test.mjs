import assert from "node:assert/strict";
import test from "node:test";
import { writeLedger } from "../src/ledger-writer.mjs";

test("blocked Runtime gate returns a recoverable Agent rejection", async () => {
  const result = await writeLedger({
    projectRoot: "",
    runtimeResult: {},
    snapshot: null
  });

  assert.equal(result.written, false);
  assert.equal(result.gate.allowed, false);
  assert.deepEqual(result.rejection, {
    kind: "ledger_gate_rejected",
    recoverable: true,
    responsibility: "agent",
    reason: result.gate.reasons.join("\n"),
    case_id: "",
    selected_gap_id: "",
    recovery_action: "replan_from_fresh_state"
  });
  assert.match(result.rejection.reason, /ledger_stage/);
});
