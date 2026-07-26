import { pathToFileURL } from "node:url";
import { evaluateRuntimeGates } from "./gate-engine.mjs";
import {
  loadRuntimeCapabilityForEntrypoint,
  resolveCapabilityEntrypoint
} from "./capability-registry.mjs";

export async function writeLedger({
  projectRoot,
  runtimeResult,
  envelope,
  snapshot,
  dryRun = false,
  ledgerCapability = null
}) {
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

  const capability = ledgerCapability || await loadRuntimeCapabilityForEntrypoint({
    projectRoot,
    entrypoint: "writeback"
  });
  const entrypointPath = resolveCapabilityEntrypoint(capability, "writeback");
  const entrypoint = await import(pathToFileURL(entrypointPath).href);
  if (typeof entrypoint.applyRuntimeLedgerWriteback !== "function") {
    throw new Error(`Runtime capability ${capability.id} writeback entrypoint does not export applyRuntimeLedgerWriteback().`);
  }
  return entrypoint.applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult,
    envelope,
    snapshot,
    gate,
    dryRun
  });
}
