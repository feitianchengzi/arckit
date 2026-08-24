import { pathToFileURL } from "node:url";
import { evaluateRuntimeGates } from "./gate-engine.mjs";
import {
  loadRuntimeCapabilityForEntrypoint,
  resolveCapabilityEntrypoint
} from "./capability-registry.mjs";
import { normalizeRuntimeRecordRef } from "./runtime-record-ref.mjs";

export async function writeLedger({
  projectRoot,
  runtimeResult,
  envelope,
  snapshot,
  dryRun = false,
  ledgerCapability = null,
  runtimeRecordRef = ""
}) {
  const normalizedRuntimeRecordRef = normalizeRuntimeRecordRef(runtimeRecordRef);
  const gate = await evaluateRuntimeGates({ runtimeResult, snapshot, envelope, projectRoot });
  if (!gate.allowed) {
    return {
      schema_version: "arckit-ledger-write/v2",
      written: false,
      dry_run: dryRun,
      gate,
      rejection: gateRejection(gate, runtimeResult),
      plan: [],
      changed_files: []
    };
  }

  const entrypointName = runtimeResult?.case_control_handoff ? "case_control" : "writeback";
  const capability = ledgerCapability || await loadRuntimeCapabilityForEntrypoint({
    projectRoot,
    entrypoint: entrypointName
  });
  const entrypointPath = resolveCapabilityEntrypoint(capability, entrypointName);
  const entrypoint = await import(pathToFileURL(entrypointPath).href);
  const apply = entrypointName === "case_control"
    ? entrypoint.applyRuntimeCaseControl
    : entrypoint.applyRuntimeLedgerWriteback;
  if (typeof apply !== "function") {
    throw new Error(`Runtime capability ${capability.id} ${entrypointName} entrypoint does not export the required apply function.`);
  }
  return apply({
    projectRoot,
    runtimeResult,
    envelope,
    snapshot,
    gate,
    dryRun,
    runtimeRecordRef: normalizedRuntimeRecordRef
  });
}

function gateRejection(gate, runtimeResult) {
  const transition = runtimeResult?.case_transition || {};
  const command = runtimeResult?.case_command || {};
  const caseControl = runtimeResult?.case_control_handoff || {};
  const issues = (gate?.reasons || []).filter(Boolean).map((reason) => ({
    path: gateIssuePath(reason),
    message: String(reason)
  }));
  const stale = gateRecoveryAction(gate?.reasons) === "replan_from_fresh_state";
  return {
    kind: stale ? "snapshot_stale" : "claim_invalid",
    recoverable: true,
    responsibility: "agent",
    reason: gate?.reasons?.filter(Boolean).join("\n") || "The trusted ledger gate rejected this writeback.",
    issues,
    case_id: command.case_id || transition.case_id || caseControl.case_id || "",
    selected_gap_id: command.selection?.selected_ref || transition.selected_gap?.id || "",
    recovery_action: stale ? "replan_from_fresh_state" : "repair_rejected_claim",
    counts_toward_agent_repair: !stale
  };
}

function gateIssuePath(reason) {
  const match = String(reason || "").match(/^([a-zA-Z0-9_.\[\]-]+):/);
  return match?.[1] || "case_command";
}

function gateRecoveryAction(reasons = []) {
  return reasons.some((reason) => /\b(stale|snapshot|revision)\b/i.test(String(reason || "")))
    ? "replan_from_fresh_state"
    : "repair_rejected_claim";
}
