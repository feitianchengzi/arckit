// Resolve after scene options so an explicit device choice applies everywhere.
export function resolveCodexExecutionPolicy(options, projectRoot) {
  if (options.yoloMode === undefined) return options;
  if (typeof options.yoloMode !== "boolean") throw new TypeError("yoloMode must be a boolean.");
  const sandboxPolicy = options.yoloMode
    ? { type: "dangerFullAccess" }
    : (['readOnly', 'workspaceWrite'].includes(options.sandboxPolicy?.type) ? options.sandboxPolicy : null) || {
      type: "workspaceWrite", writableRoots: [projectRoot], networkAccess: false,
      excludeTmpdirEnvVar: false, excludeSlashTmp: false
    };
  return {
    ...options,
    approvalPolicy: options.yoloMode ? "never" : "on-request",
    sandboxPolicy,
    sandbox: { dangerFullAccess: "danger-full-access", readOnly: "read-only", workspaceWrite: "workspace-write" }[sandboxPolicy.type]
  };
}
