import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(sourceDir, "..");
const ledgerScriptsDir = join(runtimeRoot, "ledger-scripts");

export function runLedgerScript(projectRoot, args, { nodeBin = process.execPath } = {}) {
  const [script, ...rest] = args;
  const scriptPath = join(ledgerScriptsDir, script);
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
