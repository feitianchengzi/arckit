// Automation's existing task contract includes committing its reviewed local result.
// Only the product dispatch boundary supplies this policy; the generic Loop has no default.
export function automationDeliveryPolicy() {
  return { schema_version: 'arcorbit-automation-delivery/v1', kind: 'git_commit', commit_authorized: true };
}
export function requireAutomationDeliveryPolicy(value) {
  if (value?.schema_version !== 'arcorbit-automation-delivery/v1' || value.kind !== 'git_commit'
    || value.commit_authorized !== true) throw new Error('Automation Git delivery requires an explicit authorized delivery policy.');
  return structuredClone(value);
}
