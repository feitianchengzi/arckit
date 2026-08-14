#!/usr/bin/env node
import { sanitizeRuntimeProcessEnvironment } from "../src/runtime-process-environment.mjs";

// Packaged Desktop launches this entrypoint through Electron's embedded Node
// host. That bootstrap flag must not be inherited by Codex or other children.
sanitizeRuntimeProcessEnvironment();

const { main } = await import("../src/cli.mjs");

main(process.argv.slice(2)).catch((error) => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
