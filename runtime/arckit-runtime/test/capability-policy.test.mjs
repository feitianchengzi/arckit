import assert from "node:assert/strict";
import test from "node:test";
import {
  agentSkillInvocationForPhase,
  capabilitiesForBinding,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  runtimeCapabilityForEntrypoint
} from "../src/capability-registry.mjs";

test("Runtime policy binds only using-arckit and the trusted ledger", async () => {
  const policy = await loadCapabilityPolicy();
  assert.equal(policy.schema_version, "arckit-capability-policy/v3");
  assert.deepEqual(policy.controller_capability_ids, ["using-arckit"]);
  assert.deepEqual(policy.runtime_capability_ids, ["arckit-development-ledger"]);
  assert.equal("worker_capability_ids" in policy, false);

  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  assert.deepEqual(capabilities.map((item) => item.id).sort(), ["arckit-development-ledger", "using-arckit"]);
  const agent = capabilitiesForBinding(capabilities, policy, "controller");
  const runtime = capabilitiesForBinding(capabilities, policy, "runtime");
  assert.equal(agentSkillInvocationForPhase(agent, "agent_loop").skill_trigger, "$using-arckit");
  assert.equal(runtimeCapabilityForEntrypoint(runtime, "case_transition").id, "arckit-development-ledger");
});
