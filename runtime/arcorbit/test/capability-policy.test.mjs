import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  agentSkillInvocationForPhase,
  capabilitiesForBinding,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  resolvePackagedCapabilityRoot,
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

test("new Cases receive ten autonomous completion-review cycles", async () => {
  const policy = JSON.parse(await readFile(new URL("../config/case-policy.json", import.meta.url), "utf8"));
  assert.equal(policy.schema_version, "arckit-case-policy/v1");
  assert.equal(policy.completion_review.max_autonomous_cycles, 10);
});

test("packaged capabilities prefer ArcOrbit resources and retain the legacy resource fallback", async () => {
  const resourcesRoot = await mkdtemp(path.join(tmpdir(), "arcorbit-capabilities-"));
  const legacyManifest = path.join(resourcesRoot, "arckit-runtime", "trusted-capabilities", "arckit-development-ledger", "arckit.capability.json");
  const canonicalManifest = path.join(resourcesRoot, "arcorbit", "trusted-capabilities", "arckit-development-ledger", "arckit.capability.json");
  try {
    await mkdir(path.dirname(legacyManifest), { recursive: true });
    await writeFile(legacyManifest, "{}\n");
    assert.equal(await resolvePackagedCapabilityRoot(resourcesRoot), path.join(resourcesRoot, "arckit-runtime", "trusted-capabilities"));

    await mkdir(path.dirname(canonicalManifest), { recursive: true });
    await writeFile(canonicalManifest, "{}\n");
    assert.equal(await resolvePackagedCapabilityRoot(resourcesRoot), path.join(resourcesRoot, "arcorbit", "trusted-capabilities"));
  } finally {
    await rm(resourcesRoot, { recursive: true, force: true });
  }
});
