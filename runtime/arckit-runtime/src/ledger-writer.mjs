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
