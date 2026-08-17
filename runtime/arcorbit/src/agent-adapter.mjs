import { createDryRunAdapter } from "../adapters/dry-run-adapter.mjs";
import { createCodexAppServerAdapter } from "../adapters/codex-app-server-adapter.mjs";

export function createAgentAdapter(name, options = {}) {
  if (!name || name === "dry-run") {
    return createDryRunAdapter();
  }
  if (name === "codex-app-server") {
    return createCodexAppServerAdapter(options);
  }
  throw new Error(`Unsupported agent adapter: ${name}`);
}
