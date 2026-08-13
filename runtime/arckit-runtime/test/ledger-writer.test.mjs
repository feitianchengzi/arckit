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
  assert.equal(result.rejection.kind, "ledger_gate_rejected");
  assert.equal(result.rejection.recoverable, true);
  assert.equal(result.rejection.responsibility, "agent");
  assert.equal(result.rejection.reason, result.gate.reasons.join("\n"));
  assert.equal(result.rejection.issues.length, result.gate.reasons.length);
  assert.deepEqual(result.rejection.issues[0], {
    path: "schema_version",
    message: result.gate.reasons[0]
  });
  assert.equal(result.rejection.case_id, "");
  assert.equal(result.rejection.selected_gap_id, "");
  assert.equal(result.rejection.recovery_action, "repair_rejected_claim");
  assert.match(result.rejection.reason, /ledger_stage/);
});
