import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  agentSkillInvocationForPhase,
  capabilitiesForBinding,
  invalidCapabilityBindings,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  resolveCapabilityEntrypoint,
  runtimeCapabilityForEntrypoint
} from "../src/capability-registry.mjs";
import {
  compileControllerPlanPrompt,
  compileControllerReviewPrompt,
  controllerPlanFailureReason,
  createAgentTasks,
  normalizePacketWorkerTasks
} from "../src/agent-orchestrator.mjs";
import { writeLedger } from "../src/ledger-writer.mjs";
import { ensureArckitProject } from "../src/project-initializer.mjs";
import { createStateStore } from "../src/state-store.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));

const EXPECTED_BINDINGS = {
  controller: ["using-arckit"],
  runtime: ["arckit-development-ledger"],
  worker: [
    "arckit-debug-diagnosis",
    "arckit-interaction",
    "arckit-spec",
    "arckit-tech",
    "arckit-visual"
  ]
};

const EXPECTED_CAPABILITIES = Object.values(EXPECTED_BINDINGS).flat().sort();

test("default capability policy exposes exactly the retained skills in one execution plane each", async () => {
  const policy = await loadCapabilityPolicy();
  assert.equal(policy.schema_version, "arckit-capability-policy/v2");
  assert.deepEqual(policy.controller_capability_ids, EXPECTED_BINDINGS.controller);
  assert.deepEqual(policy.runtime_capability_ids, EXPECTED_BINDINGS.runtime);
  assert.deepEqual([...policy.worker_capability_ids].sort(), EXPECTED_BINDINGS.worker);

  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-capability-policy-"));
  const extraSkill = join(projectRoot, "skills", "removed-skill");
  await mkdir(extraSkill, { recursive: true });
  await writeFile(join(extraSkill, "arckit.capability.json"), JSON.stringify({
    schema_version: "arckit-capability/v1",
    id: "removed-skill",
    kind: "test",
    binding_targets: ["worker"]
  }));

  const capabilities = await loadRuntimeCapabilities({ projectRoot, capabilityPolicy: policy });
  assert.deepEqual(capabilities.map((capability) => capability.id), EXPECTED_CAPABILITIES);
  assert.equal(capabilities.some((capability) => capability.id === "removed-skill"), false);

  for (const [bindingTarget, expectedIds] of Object.entries(EXPECTED_BINDINGS)) {
    const bound = capabilitiesForBinding(capabilities, policy, bindingTarget);
    assert.deepEqual(bound.map((capability) => capability.id), expectedIds);
    assert.ok(bound.every((capability) => capability.binding_targets.includes(bindingTarget)));
  }
});

test("worker binding validation rejects controller, runtime, and unknown capability ids", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const workers = capabilitiesForBinding(capabilities, policy, "worker");

  assert.deepEqual(invalidCapabilityBindings(["arckit-spec"], workers), []);
  assert.deepEqual(
    invalidCapabilityBindings(["using-arckit", "arckit-development-ledger", "removed-skill"], workers),
    ["using-arckit", "arckit-development-ledger", "removed-skill"]
  );

  const invalidPlan = controllerPlan(["using-arckit"]);
  assert.match(controllerPlanFailureReason(invalidPlan, workers), /non-worker or unavailable/);
  assert.equal(controllerPlanFailureReason(controllerPlan(["arckit-spec"]), workers), "");

  assert.throws(() => createAgentTasks({
    ...taskFixture(),
    selectedCapabilities: workers,
    controllerPlan: invalidPlan
  }), /non-worker or unavailable/);

  assert.throws(() => normalizePacketWorkerTasks([{
    id: "TASK-01",
    worker_type: "implementation",
    role: "implementer",
    scope: { allowed_skills: ["arckit-development-ledger"] }
  }], { conversation_locale: "en" }, workers), /non-worker or unavailable/);
});

test("controller phases invoke using-arckit through the native skill trigger", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const controllers = capabilitiesForBinding(capabilities, policy, "controller");

  assert.equal(agentSkillInvocationForPhase(controllers, "controller_plan").skill_trigger, "$using-arckit");
  assert.equal(agentSkillInvocationForPhase(controllers, "controller_review").skill_trigger, "$using-arckit");

  const planPrompt = compileControllerPlanPrompt({
    ...taskFixture(),
    selectedCapabilities: capabilitiesForBinding(capabilities, policy, "worker"),
    controllerCapabilities: controllers,
    runtimeCapabilities: capabilitiesForBinding(capabilities, policy, "runtime")
  });
  assert.ok(planPrompt.startsWith("$using-arckit\n"));
  assert.match(planPrompt, /phase=controller_plan/);
  assert.doesNotMatch(planPrompt, /Every round must follow these steps/i);

  const reviewPrompt = compileControllerReviewPrompt({
    loopFrame: taskFixture().loopFrame,
    round: taskFixture().round,
    reports: [],
    controllerCapabilities: controllers
  });
  assert.ok(reviewPrompt.startsWith("$using-arckit\n"));
  assert.match(reviewPrompt, /phase=controller_review/);
});

test("runtime resolves trusted development-ledger entrypoints from the skill source", async () => {
  const policy = await loadCapabilityPolicy();
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-runtime-entrypoint-"));
  const shadowSkill = join(projectRoot, "skills", "arckit-development-ledger");
  await mkdir(shadowSkill, { recursive: true });
  await writeFile(join(shadowSkill, "arckit.capability.json"), JSON.stringify({
    schema_version: "arckit-capability/v1",
    id: "arckit-development-ledger",
    kind: "state_ledger",
    binding_targets: ["runtime"],
    runtime_entrypoints: { writeback: "scripts/untrusted.mjs" }
  }));

  const capabilities = await loadRuntimeCapabilities({ projectRoot, capabilityPolicy: policy });
  const runtimeCapabilities = capabilitiesForBinding(capabilities, policy, "runtime");
  const ledger = runtimeCapabilityForEntrypoint(runtimeCapabilities, "writeback");
  assert.equal(ledger.id, "arckit-development-ledger");
  assert.equal(ledger.source, "repository");
  assert.match(resolveCapabilityEntrypoint(ledger, "writeback"), /entry\/skills\/arckit-development-ledger\/scripts\/runtime-writeback\.mjs$/);
  assert.match(resolveCapabilityEntrypoint(ledger, "project_state"), /entry\/skills\/arckit-development-ledger\/scripts\/project-state\.mjs$/);
  for (const script of ["project-state.mjs", "project-iteration.mjs", "development-case.mjs"]) {
    assert.equal(existsSync(resolve(testDir, "../ledger-scripts", script)), false);
  }

  assert.throws(() => resolveCapabilityEntrypoint({
    id: "escape",
    capability_root: shadowSkill,
    runtime_entrypoints: { writeback: "../outside.mjs" }
  }, "writeback"), /escapes its capability root/);
});

test("runtime ledger gate delegates dry-run writeback to the development-ledger skill", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-writeback-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Ledger Writeback Test",
    intent: "Verify direct runtime capability invocation."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validDoneRuntimeResult();
  const result = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: {
      selected_round: {
        gap_id: "GAP-TEST",
        dimension: "quality_validation",
        current_state: "verified",
        target_state: "accepted",
        round_goal: "Verify ledger capability invocation.",
        next_transition: "Record the verified runtime capability boundary."
      }
    },
    snapshot,
    dryRun: true
  });

  assert.equal(result.gate.allowed, true);
  assert.equal(result.dry_run, true);
  assert.equal(result.written, false);
  assert.ok(result.plan.some((item) => item.action === "update_project_state"));
});

function controllerPlan(allowedSkills) {
  return {
    schema_version: "arckit-controller-plan/v1",
    status: "planned",
    worker_intents: [{
      worker_type: "implementation",
      role: "implementer",
      objective: "Implement the bounded change.",
      reason: "The state gap requires implementation evidence.",
      allowed_skills: allowedSkills
    }],
    continuation_intent: {
      goal: "Implement the bounded change.",
      state_transition: "implementation unknown -> evidenced",
      next_prompt: "Review the implementation evidence."
    }
  };
}

function taskFixture() {
  return {
    loopFrame: {
      round_goal: "Implement the bounded change.",
      conversation_locale: "en",
      selected_gap: {},
      stop_conditions: [],
      case_id: "CASE-1"
    },
    round: {
      conversation_locale: "en",
      required_context_refs: [],
      stop_conditions: [],
      gap_id: "GAP-1"
    },
    snapshot: {
      summary: {
        project_name: "demo",
        current_phase: "implementation"
      }
    },
    task: "Implement the bounded change."
  };
}

function validDoneRuntimeResult() {
  const noImpact = Object.fromEntries([
    "project", "intake", "cases", "spec", "interaction", "visual", "tech", "debug", "pending", "handoff"
  ].map((key) => [key, "none"]));
  return {
    schema_version: "arckit-runtime-result/v1",
    round_result: "done",
    round_state: "ledger_gate_ready",
    round_state_history: [],
    summary: "Runtime capability invocation verified.",
    changed_files: [],
    artifact_impact_scan: noImpact,
    artifact_ownership_scan: {
      schema_version: "arckit-artifact-ownership-scan/v1",
      classified: [],
      source_facts_changed: [],
      projection_artifacts_changed: [],
      implementation_evidence: [],
      pending_items: [],
      runtime_logs: [],
      unknown_artifacts: []
    },
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: false,
      deferred_projections: [],
      blocked_projections: []
    },
    controller_reducer_result: {},
    controller_frame: {
      round_goal: "Verify ledger capability invocation.",
      route_plan: { selected_gap: { next_transition: "Record the verified runtime capability boundary." } }
    },
    execution_gate: {},
    executor_binding: {},
    worker_packets: [],
    report_intake: {},
    ledger_stage: {
      schema_version: "arckit-ledger-stage/v1",
      status: "gate_ready",
      gate_required: true,
      writeback_required: true,
      reason: "Validated result is ready for ledger writeback."
    },
    validation_evidence: ["runtime capability test"],
    loop_handoff: {
      version: "loop-handoff/v1",
      status: "done",
      next_responsibility: "none",
      agent_continuation_available: false,
      human_decision_required: false,
      trigger_mode: "none",
      responsibility_reason: "The bounded verification is complete.",
      next_prompt: "No continuation is required.",
      agent_instruction: {
        goal: "Preserve the verified runtime capability boundary.",
        required_context_refs: [],
        required_actions: [],
        required_checks: [],
        stop_condition: "Stop after the writeback plan is verified."
      },
      human_gate: { required: false, reason: "", decision_needed: "" },
      progress_guard: {
        expected_state_change: "Record the verified runtime capability boundary.",
        actual_state_change: "The writeback plan resolved the skill entrypoint.",
        no_progress_limit: 1,
        max_auto_rounds: 1
      }
    }
  };
}
