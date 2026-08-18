import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
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

export async function runLedgerScript(projectRoot, args, { capability = null } = {}) {
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
  let stdout;
  if (script === "protocol-compatibility.mjs" && rest[0] === "probe") {
    const module = await import(pathToFileURL(scriptPath).href);
    stdout = `${JSON.stringify(module.probeProtocolCompatibility(projectRoot), null, 2)}\n`;
  } else if (script === "loop-snapshot.mjs" && rest[0] === "read") {
    const module = await import(pathToFileURL(scriptPath).href);
    const afterCommitIndex = rest.indexOf("--after-commit");
    const afterCommitToken = afterCommitIndex >= 0 ? rest[afterCommitIndex + 1] || "" : "";
    stdout = `${JSON.stringify(module.readLedgerSnapshot(projectRoot, { afterCommitToken }), null, 2)}\n`;
  } else {
    const operationsPath = join(dirname(scriptPath), "trusted-ledger-operations.mjs");
    const operations = await import(pathToFileURL(operationsPath).href);
    stdout = operations.executeTrustedLedgerCommand(projectRoot, [script, ...rest]);
  }
  return {
    stdout,
    stderr: "",
    status: 0
  };
}
