import { spawnSync } from "node:child_process";
import { basename } from "node:path";
import {
  loadRuntimeCapabilityForEntrypoint,
  resolveCapabilityEntrypoint
} from "./capability-registry.mjs";

const SCRIPT_ENTRYPOINTS = {
  "project-state.mjs": "project_state",
  "project-iteration.mjs": "project_iteration",
  "development-case.mjs": "development_case",
  "protocol-compatibility.mjs": "protocol_compatibility",
  "loop-snapshot.mjs": "loop_snapshot"
};

export async function runLedgerScript(projectRoot, args, { nodeBin = process.execPath, capability = null } = {}) {
  const [script, ...rest] = args;
  const entrypoint = SCRIPT_ENTRYPOINTS[script];
  if (!entrypoint) {
    throw new Error(`Unsupported ledger capability script: ${script}`);
  }
  const selectedCapability = capability || await loadRuntimeCapabilityForEntrypoint({
    projectRoot,
    entrypoint
  });
  const scriptPath = resolveCapabilityEntrypoint(selectedCapability, entrypoint);
  const result = spawnSync(nodeBin, [scriptPath, ...rest], {
    cwd: projectRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Ledger script failed: ${basename(script)} ${rest.join(" ")}\n${result.stderr || result.stdout}`);
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status
  };
}
