import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  agentSkillInvocationForPhase,
  assertInstalledAgentSkillCompatibility,
  capabilitiesForBinding,
  invalidCapabilityBindings,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  resolveCapabilityEntrypoint,
  runtimeCapabilityForEntrypoint
} from "../src/capability-registry.mjs";
import {
  compileAgentTaskPrompt,
  compileControllerPlanPrompt,
  compileControllerReviewPrompt,
  canonicalizeControllerPlanSelectedGap,
  controllerPlanFailureReason,
  authorizedPacketFailureReason,
  createAgentTasks,
  mergeAgentReports,
  normalizeControllerReviewReportReferences,
  normalizePacketWorkerTasks,
  shouldRetryControllerPlan
} from "../src/agent-orchestrator.mjs";
import { writeLedger } from "../src/ledger-writer.mjs";
import { ensureArckitProject } from "../src/project-initializer.mjs";
import { createStateStore } from "../src/state-store.mjs";
import { selectNextRound } from "../src/loop-controller.mjs";
import { runLedgerScript } from "../src/ledger-scripts.mjs";
import { reduceWorkerReports } from "../src/controller-reducer.mjs";
import {
  FACET_KEYS,
  auditCaseRecord,
  readCaseRecord,
  writeCaseRecord
} from "../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs";
import { applyCaseTransition } from "../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs";
import { applyRuntimeCaseControl } from "../../../entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs";
import { createCaseControlRuntimeResult } from "../src/kernel/runtime-result-builder.mjs";
import { shouldPrepareLedgerWriteback } from "../src/kernel/runtime-result-builder.mjs";
import { runtimeRecordRefForRun } from "../src/runtime-record-ref.mjs";

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

test("Runtime verifies the installed Controller skill matches the repository protocol source", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "arckit-controller-skill-compat-"));
  const sourceRoot = join(fixtureRoot, "source", "using-arckit");
  const codexHome = join(fixtureRoot, "codex-home");
  const installedRoot = join(codexHome, "skills", "using-arckit");
  await mkdir(sourceRoot, { recursive: true });
  await mkdir(installedRoot, { recursive: true });
  const manifest = {
    schema_version: "arckit-capability/v1",
    id: "using-arckit",
    protocol_revision: "controller-runtime-actions/v1",
    binding_targets: ["controller"],
    invocation: { type: "agent_skill", skill_trigger: "$using-arckit", phases: ["controller_plan"] }
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(sourceRoot, "arckit.capability.json"), manifestText);
  await writeFile(join(sourceRoot, "SKILL.md"), "# Controller protocol\n");
  await writeFile(join(installedRoot, "arckit.capability.json"), manifestText);
  await writeFile(join(installedRoot, "SKILL.md"), "# Controller protocol\n");
  const capability = {
    ...manifest,
    capability_root: sourceRoot,
    source: "repository"
  };

  const checked = await assertInstalledAgentSkillCompatibility([capability], { codexHome });
  assert.equal(checked[0].protocol_revision, "controller-runtime-actions/v1");

  await writeFile(join(installedRoot, "SKILL.md"), "# Stale controller protocol\n");
  await assert.rejects(
    () => assertInstalledAgentSkillCompatibility([capability], { codexHome }),
    /has drifted/
  );
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
  const candidatePlan = controllerPlan(["arckit-spec"]);
  assert.equal(controllerPlanFailureReason(candidatePlan, workers, {
    case_id: "",
    candidate_case_gaps: [],
    candidate_cases: [{
      case_id: "CASE-20260726-001",
      candidate_gaps: [candidatePlan.route_plan.selected_gap]
    }]
  }), "");

  assert.throws(() => createAgentTasks({
    ...taskFixture(),
    selectedCapabilities: workers,
    controllerPlan: invalidPlan
  }), /non-worker or unavailable/);

  assert.throws(() => normalizePacketWorkerTasks([{
    id: "TASK-01",
    worker_type: "implementation",
    role: "implementer",
    loop_frame_excerpt: {
      case_id: "CASE-20260726-001",
      case_updated_at: "2026-07-26T00:00:00.000Z",
      selected_gap: controllerPlan(["arckit-development-ledger"]).route_plan.selected_gap
    },
    scope: { allowed_skills: ["arckit-development-ledger"] }
  }], {
    case_id: "CASE-20260726-001",
    case_updated_at: "2026-07-26T00:00:00.000Z",
    selected_gap: controllerPlan(["arckit-development-ledger"]).route_plan.selected_gap,
    conversation_locale: "en"
  }, workers), /non-worker or unavailable/);
});

test("Controller runtime actions and Worker dispatch are structurally exclusive", () => {
  const plan = controllerPlan([]);
  plan.execution_plan = {
    plane: "runtime",
    runtime_actions: [{
      type: "case_control",
      action: "create_case",
      case_id: "",
      title: "Create a bounded Case",
      intent: "Bind the operator request before Case work starts.",
      artifact_type: "code",
      selection_reason: "No active Case represents the request."
    }]
  };
  assert.match(controllerPlanFailureReason(plan, []), /mutually exclusive/);
  assert.equal(shouldRetryControllerPlan({ plan, failureReason: "mutually exclusive", attempt: 1 }), true);
  assert.equal(shouldRetryControllerPlan({ plan, failureReason: "mutually exclusive", attempt: 2 }), false);
  assert.equal(shouldRetryControllerPlan({
    plan: { status: "blocked", summary: "Codex controller did not return a valid arckit-controller-plan/v3 JSON object." },
    failureReason: "invalid output",
    attempt: 1
  }), true);
});

test("Controller may plan an evidence-backed Case transition with zero Workers", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const workers = capabilitiesForBinding(capabilities, policy, "worker");
  const plan = controllerPlan([]);
  plan.execution_plan.plane = "none";
  plan.worker_intents = [];

  assert.equal(controllerPlanFailureReason(plan, workers), "");
});

test("Runtime canonicalizes descriptive Controller gap fields without retrying planning", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const workers = capabilitiesForBinding(capabilities, policy, "worker");
  const plan = controllerPlan([]);
  const candidate = {
    id: plan.route_plan.selected_gap.id,
    facet: plan.route_plan.selected_gap.facet,
    responsibility: "agent",
    current_state: "applicability=unknown; maturity=unknown; alignment=unknown; resolution=unresolved",
    target_state: "evidence-backed applicability and same-facet advancement as far as accepted evidence supports",
    next_transition: "Use the current Case evidence."
  };

  const loopFrame = {
    case_id: '',
    candidate_case_gaps: [],
    candidate_cases: [{ case_id: plan.route_plan.selected_gap.case_id, candidate_gaps: [candidate] }]
  };
  const canonicalized = canonicalizeControllerPlanSelectedGap(plan, loopFrame);

  assert.deepEqual(canonicalized.normalized_fields, ["current_state", "target_state", "next_transition"]);
  assert.deepEqual(canonicalized.plan.route_plan.selected_gap, {
    ...plan.route_plan.selected_gap,
    responsibility: candidate.responsibility,
    current_state: candidate.current_state,
    target_state: candidate.target_state,
    next_transition: candidate.next_transition
  });
  assert.equal(controllerPlanFailureReason(canonicalized.plan, workers, loopFrame), "");
  assert.equal(shouldRetryControllerPlan({
    plan: canonicalized.plan,
    failureReason: controllerPlanFailureReason(canonicalized.plan, workers, loopFrame),
    attempt: 1
  }), false);
});

test("Controller review canonicalizes a uniquely annotated report id", () => {
  const taskId = "TASK-01-产品定义与稳定规格维护 Worker";
  const review = {
    accepted_reports: [`${taskId}：报告身份与证据均有效。`],
    rejected_reports: ["UNKNOWN：仍应被门禁拒绝。"]
  };

  const normalized = normalizeControllerReviewReportReferences(review, [{ task_id: taskId }]);

  assert.deepEqual(normalized.accepted_reports, [taskId]);
  assert.deepEqual(normalized.rejected_reports, ["UNKNOWN：仍应被门禁拒绝。"]);
});

test("Controller review canonicalizes a unique TASK ordinal with a descriptive suffix", () => {
  const taskId = "TASK-01-Qt UI 缺陷诊断 Worker";
  const normalized = normalizeControllerReviewReportReferences({
    accepted_reports: ["TASK-01 的诊断报告"],
    rejected_reports: []
  }, [{ task_id: taskId }]);

  assert.deepEqual(normalized.accepted_reports, [taskId]);
});

test("Runtime initialization repairs persisted candidate-gap projections through the trusted ledger", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-derived-case-gaps-"));
  await initializeProjectWithCase({ projectRoot, intent: "Verify fresh candidate-gap derivation." });
  const initial = await createStateStore(projectRoot).readSnapshot();
  const activeCase = initial.activeCases[0];
  const casePath = join(projectRoot, activeCase.ref);
  const { text, record } = readCaseRecord(casePath);
  const selectedGap = record.case_resolution.candidate_gaps[0];
  const staleTransition = "Replay a persisted Runtime continuation instruction.";
  selectedGap.next_transition = staleTransition;
  record.current_round.selected_gap = { ...selectedGap };
  writeCaseRecord(casePath, text, record);

  const initialization = await ensureArckitProject({
    projectRoot,
    intent: "Continue from the latest authoritative Case state."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const refreshedRecord = snapshot.activeCases[0].record;
  const expected = auditCaseRecord(record, record.updated_at).candidate_gaps[0];
  const refreshed = refreshedRecord.case_resolution.candidate_gaps[0];
  const round = selectNextRound(snapshot);

  assert.equal(initialization.repaired, true);
  assert.ok(initialization.changed_files.includes(activeCase.ref));
  assert.equal(refreshed.next_transition, expected.next_transition);
  assert.notEqual(refreshed.next_transition, staleTransition);
  assert.equal(refreshedRecord.current_round.selected_gap, null);
  assert.equal(round.gap_id, "CASE-GAP-AGENT-SELECTED");
  assert.equal(round.candidate_cases[0].candidate_gaps[0].next_transition, expected.next_transition);
});

test("Runtime initialization removes only stale Runtime refs from Project canonical artifacts", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-runtime-ref-repair-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Runtime Ref Repair",
    intent: "Repair a historical Runtime artifact reference."
  });
  const statePath = join(projectRoot, "arckit/project/state.record.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const danglingLegacyRef = "arckit/project/runtime-results/RUN-20260803-074008648Z.json";
  const misplacedOpaqueRef = "arckit-runtime://runs/RUN-20260803-074008648Z";
  state.canonical_artifact_refs.push(danglingLegacyRef, misplacedOpaqueRef);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  await runLedgerScript(projectRoot, ["project-state.mjs", "render", "arckit/project/state.record.json"]);

  await assert.rejects(
    runLedgerScript(projectRoot, ["project-state.mjs", "audit", "arckit/project/state.record.json"]),
    /canonical_artifact_ref does not exist/
  );
  const initialization = await ensureArckitProject({
    projectRoot,
    intent: "Continue from repaired canonical Project State."
  });
  const repairedState = JSON.parse(readFileSync(statePath, "utf8"));

  assert.equal(initialization.repaired, true);
  assert.ok(initialization.changed_files.includes("arckit/project/state.record.json"));
  assert.ok(initialization.changed_files.includes("arckit/project/STATE.md"));
  assert.equal(repairedState.canonical_artifact_refs.includes(danglingLegacyRef), false);
  assert.equal(repairedState.canonical_artifact_refs.includes(misplacedOpaqueRef), false);
  await assert.doesNotReject(
    runLedgerScript(projectRoot, ["project-state.mjs", "audit", "arckit/project/state.record.json"])
  );
});

test("Runtime ref repair preserves valid legacy artifacts and fails closed for unrelated dangling refs", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-runtime-ref-repair-scope-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Runtime Ref Repair Scope",
    intent: "Keep repair scope narrow."
  });
  const statePath = join(projectRoot, "arckit/project/state.record.json");
  const existingLegacyRef = "arckit/project/runtime-results/RUN-EXISTING.json";
  const unrelatedDanglingRef = "arckit/spec/missing-canonical-artifact.md";
  await mkdir(join(projectRoot, "arckit/project/runtime-results"), { recursive: true });
  await writeFile(join(projectRoot, existingLegacyRef), "{}\n");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  state.canonical_artifact_refs.push(existingLegacyRef, unrelatedDanglingRef);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  await runLedgerScript(projectRoot, ["project-state.mjs", "render", "arckit/project/state.record.json"]);

  await assert.rejects(
    ensureArckitProject({ projectRoot, intent: "Do not hide unrelated state corruption." }),
    /canonical_artifact_ref does not exist: arckit\/spec\/missing-canonical-artifact\.md/
  );
  const unchangedState = JSON.parse(readFileSync(statePath, "utf8"));
  assert.ok(unchangedState.canonical_artifact_refs.includes(existingLegacyRef));
  assert.ok(unchangedState.canonical_artifact_refs.includes(unrelatedDanglingRef));
});

test("authorized packet rejects a stale Case revision before Worker execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-stale-packet-"));
  await initializeProjectWithCase({ projectRoot, intent: "Create a packet revision fixture." });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const gap = activeCase.record.case_resolution.candidate_gaps[0];
  const routePlan = {
    selected_gap: {
      ...gap,
      scope: "case",
      case_id: activeCase.record.id,
      impact: "Advance the selected Case."
    }
  };

  assert.match(authorizedPacketFailureReason({
    loopFrame: { case_updated_at: "2026-07-25T00:00:00.000Z" },
    routePlan,
    snapshot,
    routedCase: activeCase
  }), /Authorized packet is stale/);
});

test("authorized packet does not reject descriptive gap text when identity and revision are current", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-canonical-packet-gap-"));
  await initializeProjectWithCase({ projectRoot, intent: "Canonicalize packet gap semantics." });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const gap = activeCase.record.case_resolution.candidate_gaps[0];
  const routePlan = {
    selected_gap: {
      ...gap,
      scope: "case",
      case_id: activeCase.record.id,
      impact: "Advance the selected Case.",
      target_state: "A more specific Controller description."
    }
  };

  assert.equal(authorizedPacketFailureReason({
    loopFrame: { case_updated_at: activeCase.record.updated_at },
    routePlan,
    snapshot,
    routedCase: activeCase
  }), "");
});

test("Controller evidence can close a zero-Worker runtime gate", () => {
  const result = reduceWorkerReports({
    reports: [],
    loopFrame: {
      case_id: "CASE-20260726-001",
      worker_packets: [],
      execution_gate: { status: "authorized" }
    },
    round: { gap_id: "CASE-20260726-001:product_expectation" },
    allowNoWorkers: true,
    controllerEvidence: ["arckit/spec/example.md"],
    dryRun: false
  });

  assert.equal(result.decision, "accepted");
  assert.equal(result.hard_gate.can_close, true);
  assert.deepEqual(result.evidence, ["arckit/spec/example.md"]);
});

test("Controller explicitly authorizes a verification Worker to add focused executable coverage", () => {
  const plan = controllerPlan([]);
  plan.worker_intents[0] = {
    ...plan.worker_intents[0],
    worker_type: "verification",
    role: "behavior-verifier",
    objective: "Add and run focused executable behavior coverage.",
    allowed_paths: ["sources/tests/test_data_conversion_tool.cpp", "sources/tests/CMakeLists.txt"],
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    forbidden_actions: ["write_ledger_directly", "change_unrelated_files"],
    stop_condition: "Stop after the focused tests pass or return an evidence-backed blocker."
  };

  assert.equal(controllerPlanFailureReason(plan, []), "");
  const [task] = createAgentTasks({ ...taskFixture(), controllerPlan: plan });
  assert.equal(task.worker_type, "verification");
  assert.ok(task.scope.allowed_actions.includes("edit_allowed_paths"));
  assert.deepEqual(task.scope.allowed_paths, plan.worker_intents[0].allowed_paths);
  assert.equal(task.stop_condition, plan.worker_intents[0].stop_condition);
});

test("Controller-accepted negative Worker evidence can write a repair transition", () => {
  const taskId = "TASK-01-behavior-verifier";
  const loopFrame = {
    case_id: "CASE-20260726-001",
    case_updated_at: "2026-07-26T00:00:00.000Z",
    conversation_locale: "en",
    selected_gap: controllerPlan([]).route_plan.selected_gap,
    controller_frame: { controller_plan: controllerPlan([]), route_plan: controllerPlan([]).route_plan },
    execution_gate: { status: "authorized" },
    executor_binding: { executor: "desktop_runtime" },
    worker_packets: [{
      worker_id: taskId,
      worker_type: "verification",
      role: "behavior-verifier",
      allowed_paths: ["sources/tests/"],
      allowed_actions: ["read_files", "run_non_destructive_checks", "report_evidence"]
    }]
  };
  const report = {
    schema_version: "arckit-worker-report/v2",
    task_id: taskId,
    worker_type: "verification",
    role: "behavior-verifier",
    status: "blocked",
    summary: "Executable coverage is missing and the current packet does not authorize editing tests.",
    findings: ["The existing test target does not cover the requested field-label routing behavior."],
    evidence: ["sources/tests/test_data_conversion_tool.cpp"],
    changes: [],
    artifact_impacts: [],
    case_state_claims: [],
    risks: [],
    unknowns: [],
    recommendation: "Authorize a focused test edit and rerun verification.",
    requires_main_agent_decision: true,
    requires_human_decision: false
  };
  const review = {
    schema_version: "arckit-controller-review/v3",
    status: "continue",
    summary: "Accept the negative verification evidence and record the repair gap.",
    accepted_reports: [taskId],
    rejected_reports: [],
    accepted_case_state_delta: {
      facets: [{
        facet: "implementation_state",
        set: { resolution: "unresolved", alignment: "diverged", reason: "Focused executable behavior coverage is missing.", next_transition: "Add and run the focused test." },
        evidence: ["sources/tests/test_data_conversion_tool.cpp"],
        unresolved: ["Focused executable behavior coverage is missing."]
      }],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: null
    },
    evidence: ["sources/tests/test_data_conversion_tool.cpp"],
    case_resolution: { claimed_status: "unresolved", reason: "The Agent can add the focused test next.", unresolved: ["Focused executable behavior coverage is missing."] },
    project_impact_candidate: { status: "none", changes: [], evidence: [] },
    risks: [],
    unknowns: [],
    next_prompt: "Add and run the focused executable behavior coverage.",
    continuation_intent: {
      goal: "Add and run the focused executable behavior coverage.",
      state_transition: "verification diverged -> aligned",
      next_prompt: "Authorize a Worker to edit only the focused test files and run the tests."
    },
    human_decision_required: false
  };
  const merge = mergeAgentReports({
    reports: [report],
    loopFrame,
    round: { gap_id: loopFrame.selected_gap.id, conversation_locale: "en" },
    compiledPrompt: { conversation_locale: "en" },
    dryRun: false,
    controllerReview: { usable: true, review, failure_reason: "" }
  });

  assert.equal(merge.decision, "continue");
  assert.equal(merge.loop_gate.status, "continue");
  assert.equal(merge.controller_reducer_result.runtime_guard.status, "agent_recoverable");
  assert.equal(merge.controller_reducer_result.runtime_guard.vetoed_controller_review, false);
  assert.deepEqual(merge.report_intake.accepted, [taskId]);
  assert.deepEqual(merge.report_intake.needs_controller_decision, []);
  assert.equal(shouldPrepareLedgerWriteback(merge), true);
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
  assert.match(planPrompt, /"phase": "controller_plan"/);
  assert.match(planPrompt, /"operator_input": "Implement the bounded change\."/);
  assert.match(planPrompt, /"kind": "auto_continuation"/);
  assert.doesNotMatch(planPrompt, /Project Snapshot|active_cases|Runtime-owned Constraints|Output Contract/);
  assert.doesNotMatch(planPrompt, /Select one bounded Case gap|planned_transition describes|Return only/);

  const repairPrompt = compileControllerPlanPrompt({
    ...taskFixture(),
    selectedCapabilities: capabilitiesForBinding(capabilities, policy, "worker"),
    controllerCapabilities: controllers,
    runtimeCapabilities: capabilitiesForBinding(capabilities, policy, "runtime"),
    controllerFeedback: {
      validation_error: "Runtime actions and Worker dispatch are mutually exclusive.",
      rejected_plan: { execution_plan: { plane: "runtime" }, worker_intents: [{}] }
    }
  });
  assert.match(repairPrompt, /"controller_feedback"/);
  assert.match(repairPrompt, /mutually exclusive/);

  const reviewPrompt = compileControllerReviewPrompt({
    loopFrame: taskFixture().loopFrame,
    round: taskFixture().round,
    reports: [],
    controllerCapabilities: controllers
  });
  assert.ok(reviewPrompt.startsWith("$using-arckit\n"));
  assert.match(reviewPrompt, /"phase": "controller_review"/);
  assert.match(reviewPrompt, /"kind": "auto_continuation"/);
  assert.doesNotMatch(reviewPrompt, /Runtime-owned Constraints|Output Contract|human-responsibility completion_review/);

  const workerPrompt = compileAgentTaskPrompt({
    agentTask: createAgentTasks({
      ...taskFixture(),
      selectedCapabilities: capabilitiesForBinding(capabilities, policy, "worker"),
      controllerPlan: controllerPlan(["arckit-tech"])
    })[0],
    previousReports: []
  });
  assert.ok(workerPrompt.startsWith("$arckit-tech\n"));
  assert.match(workerPrompt, /"phase": "worker"/);
  assert.match(workerPrompt, /"thread_key": "worker:CASE-20260726-001:implementation:runtime-core"/);
  assert.match(workerPrompt, /"context_digest"/);
  assert.match(workerPrompt, /"authorization_rule": "current_task_packet_supersedes_prior_thread_context"/);
  assert.match(workerPrompt, /"schema_version": "arckit-worker-packet\/v2"/);
  assert.doesNotMatch(workerPrompt, /Required Behavior|Allowed Capability Context|Output Contract|You are one bounded Worker/);
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
  assert.match(resolveCapabilityEntrypoint(ledger, "case_control"), /entry\/skills\/arckit-development-ledger\/scripts\/runtime-case-control\.mjs$/);
  assert.match(resolveCapabilityEntrypoint(ledger, "case_transition"), /entry\/skills\/arckit-development-ledger\/scripts\/case-transition\.mjs$/);
  for (const script of ["project-state.mjs", "project-iteration.mjs", "development-case.mjs"]) {
    assert.equal(existsSync(resolve(testDir, "../ledger-scripts", script)), false);
  }

  assert.throws(() => resolveCapabilityEntrypoint({
    id: "escape",
    capability_root: shadowSkill,
    runtime_entrypoints: { writeback: "../outside.mjs" }
  }, "writeback"), /escapes its capability root/);
});

test("Runtime applies an Agent-directed create_case handoff and registers the fresh Case", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-case-control-create-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Agent Directed Case Control",
    intent: "Let the Controller decide whether a Case is needed."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.equal(snapshot.activeCases.length, 0);
  assert.equal(Object.hasOwn(snapshot.projectState.case_control, "selected_case_ref"), false);

  const plan = {
    ...controllerPlan([]),
    summary: "The operator request is a new bounded development concern.",
    execution_plan: {
      plane: "runtime",
      runtime_actions: [{
        type: "case_control",
        action: "create_case",
        case_id: "",
        title: "Add demand-driven Case control",
        intent: "Create and register a Case chosen by Controller semantics.",
        artifact_type: "code",
        selection_reason: "No active Case represents the operator request."
      }]
    },
    route_plan: {
      mode: "case_control",
      selected_gap: {
        id: "",
        scope: "project",
        case_id: "",
        facet: "",
        responsibility: "agent",
        current_state: "No matching Case is active.",
        target_state: "A bounded Case is registered.",
        impact: "Register the operator request before Worker execution.",
        next_transition: "Create and register the Controller-defined Case."
      },
      reason: "Case control must complete before Case gap planning.",
      requires_human_confirmation: false
    },
    worker_intents: [],
    planned_transition: {
      goal: "Create and register the Controller-defined Case.",
      expected_state_change: "Project active Case refs include a fresh bounded Case."
    },
    continuation_intent: {
      goal: "Plan the first evidence-backed transition of the fresh Case.",
      state_transition: "Fresh Case State exposes candidate gaps.",
      next_prompt: "Reload Project and Case State, then select one candidate gap."
    },
    risks: [],
    unknowns: [],
    next_controller_action: "Continue after deterministic Case control writeback."
  };
  assert.equal(controllerPlanFailureReason(plan, [], { candidate_cases: [], candidate_case_gaps: [] }), "");

  const loopFrame = {
    conversation_locale: "en",
    controller_frame: { round_goal: plan.planned_transition.goal, route_plan: plan.route_plan, controller_plan: plan },
    execution_gate: { status: "authorized" },
    executor_binding: { executor: "desktop_runtime" }
  };
  const runtimeResult = await createCaseControlRuntimeResult({
    controllerPlan: plan,
    loopFrame,
    round: { conversation_locale: "en", required_context_refs: ["arckit/project/state.record.json"], stop_conditions: [], max_auto_rounds: 8 },
    snapshot,
    compiledPrompt: { conversation_locale: "en", output_schema: "runtime/arckit-runtime/schemas/runtime-result.schema.json" },
    roundState: { state: "planned", history: [] }
  });
  const result = await writeLedger({ projectRoot, runtimeResult, envelope: {}, snapshot, dryRun: false });
  const freshSnapshot = await createStateStore(projectRoot).readSnapshot();

  assert.equal(result.written, true, JSON.stringify(result.gate?.reasons || result));
  assert.equal(result.case_control_result.action, "create_case");
  assert.equal(freshSnapshot.activeCases.length, 1);
  assert.equal(freshSnapshot.activeCases[0].ref, result.case_control_result.registered_case_ref);
  assert.equal(freshSnapshot.activeCases[0].record.title, plan.execution_plan.runtime_actions[0].title);
  assert.equal(freshSnapshot.activeCases[0].record.user_intent, plan.execution_plan.runtime_actions[0].intent);
  assert.equal(existsSync(join(projectRoot, "arckit/project/runtime-results")), false);
});

test("Agent-directed Case creation rolls back when Project registration cannot commit", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-case-control-rollback-"));
  await ensureArckitProject({ projectRoot, projectName: "Case Control Rollback", intent: "Verify atomic control writeback." });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const statePath = join(projectRoot, "arckit/project/state.record.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  state.active_iteration_ref = "arckit/project/iterations/MISSING.record.json";
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  const runtimeResult = {
    case_control_handoff: {
      schema_version: "arckit-case-control-handoff/v1",
      action: "create_case",
      expected_project_updated_at: state.project.updated_at,
      case_id: "",
      title: "Rollback fixture",
      intent: "No partial Case survives a failed selection.",
      artifact_type: "code",
      selection_reason: "The Controller chose a fresh bounded Case.",
      review_policy: { max_autonomous_cycles: 3, source: "test-fixture" }
    }
  };

  await assert.rejects(() => applyRuntimeCaseControl({
    projectRoot,
    runtimeResult,
    snapshot,
    gate: { allowed: true },
    dryRun: false
  }), /active_iteration_ref must exist/);
  assert.deepEqual(fsCaseNames(projectRoot), []);
  assert.equal(Object.hasOwn(JSON.parse(readFileSync(statePath, "utf8")).case_control, "selected_case_ref"), false);
});

test("case transition CLI accepts ephemeral transition input from stdin", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-transition-stdin-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Transition Stdin Test",
    intent: "Verify fileless Case transition transport."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const transition = validProgressRuntimeResult(activeCase.record, snapshot.projectState.project.updated_at).case_transition;
  const script = resolve(testDir, "../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs");
  const input = JSON.stringify(transition);

  const validation = spawnSync(process.execPath, [script, "validate", "-"], {
    cwd: projectRoot,
    input,
    encoding: "utf8"
  });
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  assert.match(validation.stdout, /<stdin>: ok/);

  const preview = spawnSync(process.execPath, [
    script,
    "apply",
    "--case", activeCase.ref,
    "--transition", "-",
    "--dry-run", "true"
  ], {
    cwd: projectRoot,
    input,
    encoding: "utf8"
  });
  assert.equal(preview.status, 0, preview.stderr || preview.stdout);
  assert.equal(JSON.parse(preview.stdout).dry_run, true);
  assert.equal((await createStateStore(projectRoot).readSnapshot()).activeCases[0].record.updated_at, activeCase.record.updated_at);
});

test("runtime ledger gate delegates dry-run writeback to the development-ledger skill", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-writeback-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Ledger Writeback Test",
    intent: "Verify direct runtime capability invocation."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record, snapshot.projectState.project.updated_at);
  const result = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: {
      selected_round: {
        gap_id: "GAP-TEST",
        scope: "case",
        case_id: snapshot.activeCases[0].record.id,
        facet: "product_expectation",
        current_state: "verified",
        target_state: "accepted",
        round_goal: "Verify ledger capability invocation.",
        next_transition: "Record the verified runtime capability boundary."
      }
    },
    snapshot,
    dryRun: true
  });

  assert.equal(result.gate.allowed, true, JSON.stringify(result.gate.reasons));
  assert.equal(result.dry_run, true);
  assert.equal(result.written, false);
  assert.ok(result.plan.some((item) => item.action === "apply_case_transition"));
  assert.equal(result.plan.some((item) => item.action === "write_runtime_execution_record"), false);
});

test("runtime ledger stores an opaque Desktop run reference without writing raw results into the project", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-external-runtime-record-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "External Runtime Record Test",
    intent: "Keep raw Runtime evidence outside the project ledger."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record, snapshot.projectState.project.updated_at);
  const runtimeRecordRef = runtimeRecordRefForRun("RUN-TEST-001");

  const result = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: { selected_round: runtimeResult.case_transition.selected_gap },
    snapshot,
    dryRun: false,
    runtimeRecordRef
  });

  const updated = (await createStateStore(projectRoot).readSnapshot()).activeCases[0].record;
  assert.equal(result.written, true, JSON.stringify(result.gate?.reasons || result));
  assert.equal(result.runtime_result_ref, runtimeRecordRef);
  assert.equal(updated.rounds.at(-1).runtime_result_ref, runtimeRecordRef);
  assert.equal(result.changed_files.some((item) => item.startsWith("arckit/project/runtime-results/")), false);
  assert.equal(existsSync(join(projectRoot, "arckit/project/runtime-results")), false);
});

test("runtime ledger writeback returns a structured recoverable rejection for an invalid Case transition", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-rejection-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Ledger Rejection Test",
    intent: "Reject an internally inconsistent Case transition without mutating the ledger."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record, snapshot.projectState.project.updated_at);
  runtimeResult.case_transition.accepted_state_delta.facets[0].set = {
    applicability: "required",
    resolution: "resolved",
    reason: "The proposed transition incorrectly resolves a required facet before defining its target."
  };

  const result = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: { selected_round: runtimeResult.case_transition.selected_gap },
    snapshot,
    dryRun: false
  });

  assert.equal(result.written, false);
  assert.equal(result.gate.allowed, true);
  assert.equal(result.rejection.kind, "case_transition_rejected");
  assert.equal(result.rejection.recoverable, true);
  assert.match(result.rejection.reason, /claims resolved without reaching its evidence-backed target/);
  assert.equal((await createStateStore(projectRoot).readSnapshot()).activeCases[0].record.updated_at, snapshot.activeCases[0].record.updated_at);
});

test("Case transition dry-run and apply preserve replacement-token evidence verbatim", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-case-render-roundtrip-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Case Renderer Round Trip Test",
    intent: "Preserve arbitrary command evidence through Case rendering."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const runtimeResult = validProgressRuntimeResult(activeCase.record, snapshot.projectState.project.updated_at);
  const evidence = [
    "ctest -R 'test_mixed_effect_random_settings_dialog$'",
    "shell $$ and replacement $& with prefix $` and capture $1",
    `literal quote: "double", slash: \\, line break: first
second, Unicode: 雪`
  ];
  runtimeResult.case_transition.evidence = evidence;
  runtimeResult.case_transition.accepted_state_delta.facets[0].evidence = evidence;

  const preview = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: { selected_round: runtimeResult.case_transition.selected_gap },
    snapshot,
    dryRun: true
  });
  assert.equal(preview.gate.allowed, true, JSON.stringify(preview.gate.reasons));
  assert.equal(preview.dry_run, true);

  const applied = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: { selected_round: runtimeResult.case_transition.selected_gap },
    snapshot,
    dryRun: false
  });
  assert.equal(applied.written, true, JSON.stringify(applied.gate?.reasons || applied));
  const updated = (await createStateStore(projectRoot).readSnapshot()).activeCases[0].record;
  assert.deepEqual(updated.facets.product_expectation.evidence, evidence);
  assert.deepEqual(updated.rounds.at(-1).evidence, evidence);
  assert.deepEqual(updated.rounds.at(-1).accepted_state_delta.facets[0].evidence, evidence);
});

test("Runtime lets the Controller advance an existing active Case without a Project selection write", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-controller-case-selection-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Controller Case Selection Test",
    intent: "Create one neutral Case."
  });
  const statePath = join(projectRoot, "arckit/project/state.record.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  state.case_control = {
    next_case_intent: "Select from existing active Cases.",
    priority_basis: "Controller compares current evidence; array order is not priority.",
    stop_condition: "Stop after selecting one bounded Case."
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  await runLedgerScript(projectRoot, ["project-state.mjs", "render", "arckit/project/state.record.json"]);

  const initialization = await ensureArckitProject({ projectRoot, intent: "Continue the existing work." });
  let snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.equal(initialization.case_ref, "");
  assert.equal(snapshot.activeCases.length, 1);

  const projectRevision = snapshot.projectState.project.updated_at;
  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record, projectRevision);
  const writeResult = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: {
      selected_round: {
        gap_id: `${snapshot.activeCases[0].record.id}:product_expectation`,
        scope: "case",
        case_id: snapshot.activeCases[0].record.id,
        facet: "product_expectation",
        current_state: "applicability=unknown",
        target_state: "evidence-backed judgment",
        round_goal: "Bind the Controller-selected Case through an accepted transition.",
        next_transition: "Record the product expectation applicability judgment."
      }
    },
    snapshot,
    dryRun: false
  });
  snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.equal(writeResult.written, true, JSON.stringify(writeResult.gate?.reasons || writeResult));
  assert.equal(snapshot.projectState.project.updated_at, projectRevision);
  assert.equal(Object.hasOwn(snapshot.projectState.case_control, "selected_case_ref"), false);
  assert.equal(snapshot.activeCases.length, 1);
});

test("a final clean review closes the selected Case and aggregates it through the shared ledger path", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-commit-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Ledger Commit Test",
    intent: "Verify the shared Case transition commit path."
  });
  let snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const casePath = join(projectRoot, activeCase.ref);
  const { text, record } = readCaseRecord(casePath);
  for (const facet of FACET_KEYS.filter((item) => item !== "product_expectation")) {
    record.facets[facet] = {
      ...record.facets[facet],
      applicability: "not_required",
      resolution: "resolved",
      reason: `${facet} is outside this bounded ledger integration fixture.`,
      evidence: [`fixture:${facet}`]
    };
  }
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  record.current_round = { goal: "", selected_gap: null };
  writeCaseRecord(casePath, text, record);

  snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validProgressRuntimeResult(record, snapshot.projectState.project.updated_at);
  const firstWrite = await writeLedger({
    projectRoot,
    runtimeResult,
    envelope: { selected_round: runtimeResult.case_transition.selected_gap },
    snapshot,
    dryRun: false
  });
  assert.equal(firstWrite.written, true, JSON.stringify(firstWrite.gate?.reasons || firstWrite));
  snapshot = await createStateStore(projectRoot).readSnapshot();
  const reviewRecord = snapshot.activeCases[0].record;
  const reviewedResult = completionReviewRuntimeResult(runtimeResult, reviewRecord);
  reviewedResult.loop_handoff = {
    ...reviewedResult.loop_handoff,
    status: "done",
    next_responsibility: "none",
    agent_continuation_available: false,
    trigger_mode: "none",
    responsibility_reason: "The Case is resolved.",
    next_prompt: "",
    agent_instruction: {
      ...reviewedResult.loop_handoff.agent_instruction,
      goal: "",
      required_actions: []
    }
  };
  const runtimeRecordRef = runtimeRecordRefForRun("RUN-RESOLVED-001");
  const result = await writeLedger({
    projectRoot,
    runtimeResult: reviewedResult,
    envelope: {
      selected_round: {
        gap_id: reviewRecord.case_resolution.candidate_gaps[0].id,
        scope: "case",
        case_id: record.id,
        facet: "completion_review",
        current_state: reviewRecord.case_resolution.candidate_gaps[0].current_state,
        target_state: reviewRecord.case_resolution.candidate_gaps[0].target_state,
        round_goal: "Review the completed Case.",
        next_transition: reviewRecord.case_resolution.candidate_gaps[0].next_transition
      }
    },
    snapshot,
    dryRun: false,
    runtimeRecordRef
  });

  const projectState = JSON.parse(readFileSync(join(projectRoot, "arckit/project/state.record.json"), "utf8"));
  const closedRef = activeCase.ref.replace("/active/", "/closed/");
  const closedCase = readCaseRecord(join(projectRoot, closedRef)).record;
  assert.equal(result.written, true, JSON.stringify(result.gate?.reasons || result));
  assert.equal(result.case_transition_result.case_resolution.status, "resolved");
  assert.equal(existsSync(join(projectRoot, activeCase.ref)), false);
  assert.equal(existsSync(join(projectRoot, closedRef)), true);
  assert.deepEqual(projectState.active_case_refs, []);
  assert.equal(Object.hasOwn(projectState.case_control, "selected_case_ref"), false);
  assert.ok(projectState.canonical_artifact_refs.includes(closedRef));
  assert.equal(closedCase.rounds.at(-1).runtime_result_ref, runtimeRecordRef);
  assert.equal(JSON.stringify(projectState).includes(runtimeRecordRef), false);
  await assert.doesNotReject(
    runLedgerScript(projectRoot, ["project-state.mjs", "audit", "arckit/project/state.record.json"])
  );
});

test("ledger commit rolls Case and Project files back when a projection step fails", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-rollback-"));
  await initializeProjectWithCase({
    projectRoot,
    projectName: "Ledger Rollback Test",
    intent: "Verify rollback after a late projection failure."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const casePath = join(projectRoot, activeCase.ref);
  const { text, record } = readCaseRecord(casePath);
  for (const facet of FACET_KEYS.filter((item) => item !== "product_expectation")) {
    record.facets[facet] = {
      ...record.facets[facet],
      applicability: "not_required",
      resolution: "resolved",
      reason: `${facet} is outside this rollback fixture.`,
      evidence: [`fixture:${facet}`]
    };
  }
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  record.current_round = { goal: "", selected_gap: null };
  writeCaseRecord(casePath, text, record);
  const progressResult = validProgressRuntimeResult(record, snapshot.projectState.project.updated_at);
  await applyCaseTransition({ projectRoot, casePath: activeCase.ref, transition: progressResult.case_transition });
  const progressed = createStateStore(projectRoot);
  const progressedSnapshot = await progressed.readSnapshot();
  const progressedRecord = progressedSnapshot.activeCases[0].record;
  const transition = completionReviewRuntimeResult(progressResult, progressedRecord).case_transition;
  const projectPath = join(projectRoot, "arckit/project/state.record.json");
  const caseBefore = readFileSync(casePath, "utf8");
  const projectBefore = readFileSync(projectPath, "utf8");
  await writeFile(join(projectRoot, "arckit/cases/active/BROKEN.md"), "not a development Case\n");

  await assert.rejects(() => applyCaseTransition({
    projectRoot,
    casePath: activeCase.ref,
    transition,
    dryRun: true
  }), /Development ledger script failed/);
  assert.equal(readFileSync(casePath, "utf8"), caseBefore);
  assert.equal(readFileSync(projectPath, "utf8"), projectBefore);

  await assert.rejects(() => applyCaseTransition({
    projectRoot,
    casePath: activeCase.ref,
    transition
  }), /Development ledger script failed/);

  assert.equal(readFileSync(casePath, "utf8"), caseBefore);
  assert.equal(readFileSync(projectPath, "utf8"), projectBefore);
  assert.equal(existsSync(join(projectRoot, activeCase.ref.replace("/active/", "/closed/"))), false);
});

function controllerPlan(allowedSkills) {
  return {
    schema_version: "arckit-controller-plan/v3",
    status: "planned",
    execution_plan: {
      plane: "worker",
      runtime_actions: []
    },
    route_plan: {
      mode: "case_gap",
      selected_gap: {
        id: "CASE-20260726-001:implementation_state",
        scope: "case",
        case_id: "CASE-20260726-001",
        facet: "implementation_state",
        responsibility: "agent",
        current_state: "unresolved",
        target_state: "resolved",
        impact: "Advance the bounded Case.",
        next_transition: "Implement the bounded change."
      },
      reason: "The Case gap requires implementation evidence.",
      requires_human_confirmation: false
    },
    worker_intents: [{
      worker_type: "implementation",
      workstream_id: "runtime-core",
      role: "implementer",
      objective: "Implement the bounded change.",
      reason: "The state gap requires implementation evidence.",
      allowed_paths: ["."],
      allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
      forbidden_actions: ["write_ledger_directly", "change_unrelated_files"],
      allowed_skills: allowedSkills,
      expected_case_impact: "Advance implementation_state with evidence.",
      stop_condition: "Stop after the bounded change is implemented and verified, or return an evidence-backed blocker."
    }],
    planned_transition: {
      goal: "Implement the bounded change.",
      expected_state_change: "implementation_state unresolved -> resolved"
    },
    continuation_intent: {
      goal: "Implement the bounded change.",
      state_transition: "implementation unknown -> evidenced",
      next_prompt: "Review the implementation evidence."
    }
  };
}

async function initializeProjectWithCase({ projectRoot, projectName = "Fixture Project", intent = "Create a bounded fixture Case." }) {
  await ensureArckitProject({ projectRoot, projectName, intent });
  const created = await runLedgerScript(projectRoot, [
    "development-case.mjs",
    "new",
    "--title", "Fixture Case",
    "--artifact-type", "mixed",
    "--intent", intent,
    "--max-review-cycles", "3",
    "--review-policy-source", "test-fixture"
  ]);
  const absoluteCasePath = created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  const normalized = absoluteCasePath.replaceAll("\\", "/");
  const marker = normalized.lastIndexOf("/arckit/cases/");
  assert.ok(marker >= 0, `Unexpected Case path: ${absoluteCasePath}`);
  const caseRef = normalized.slice(marker + 1);
  await runLedgerScript(projectRoot, [
    "project-state.mjs",
    "register-case",
    "--case-ref", caseRef,
    "--intent", intent,
    "--reason", "Test fixture explicitly selected this Case."
  ]);
  await runLedgerScript(projectRoot, ["development-case.mjs", "index"]);
  return { caseRef };
}

function fsCaseNames(projectRoot) {
  const activeDir = join(projectRoot, "arckit/cases/active");
  return existsSync(activeDir) ? readdirSync(activeDir).filter((name) => name.endsWith(".md")) : [];
}

function taskFixture() {
  return {
    loopFrame: {
      round_goal: "Implement the bounded change.",
      conversation_locale: "en",
      runtime_context: { kind: "auto_continuation", source_run_id: "RUN-1" },
      selected_gap: {},
      stop_conditions: [],
      case_id: "CASE-20260726-001"
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

function validProgressRuntimeResult(caseRecord, projectUpdatedAt) {
  const caseId = caseRecord.id;
  const selectedGap = caseRecord.case_resolution.candidate_gaps.find((gap) => gap.facet === "product_expectation");
  assert.ok(selectedGap, "Expected a product_expectation candidate gap");
  const noImpact = Object.fromEntries([
    "project", "intake", "cases", "spec", "interaction", "visual", "tech", "debug", "pending", "handoff"
  ].map((key) => [key, "none"]));
  return {
    schema_version: "arckit-runtime-result/v2",
    round_result: "continue",
    round_outcome: { status: "completed", reason: "The bounded fact judgment completed." },
    case_outcome: { status: "unresolved", reason: "Other Case facets remain.", unresolved: ["interaction_expectation"] },
    project_impact: { status: "none", changes: [], evidence: [] },
    case_transition: {
      schema_version: "arckit-case-transition/v3",
      case_id: caseId,
      case_updated_at: caseRecord.updated_at,
      project_updated_at: projectUpdatedAt,
      selected_gap: selectedGap,
      planned_transition: { goal: "Judge product expectation applicability.", expected_state_change: "product_expectation unknown -> not_required" },
      accepted_state_delta: {
        facets: [{
          facet: "product_expectation",
          set: { applicability: "not_required", resolution: "resolved", reason: "This fixture only verifies ledger delegation." },
          evidence: ["runtime capability test"]
        }],
        resolved_open_questions: [],
        completed_handoffs: [],
        completion_review_result: null,
        resolved_review_findings: [],
        review_budget_extension: null
      },
      evidence: ["runtime capability test"],
      unresolved: ["interaction_expectation"],
      round_outcome: "completed",
      case_resolution: { claimed_status: "unresolved", reason: "Other Case facets remain." },
      project_impact_candidate: { status: "none", changes: [], evidence: [] }
    },
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
      version: "loop-handoff/v2",
      status: "continue",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "auto_bridge",
      responsibility_reason: "Other Case facets remain.",
      next_prompt: "Continue from the next Case gap.",
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

function completionReviewRuntimeResult(base, caseRecord) {
  const result = structuredClone(base);
  const selectedGap = caseRecord.case_resolution.candidate_gaps.find((gap) => gap.facet === "completion_review");
  assert.ok(selectedGap, "Expected a completion_review candidate gap");
  result.round_result = "done";
  result.case_outcome = { status: "resolved", reason: "The current content revision passed completion review.", unresolved: [] };
  result.case_transition = {
    schema_version: "arckit-case-transition/v3",
    case_id: caseRecord.id,
    case_updated_at: caseRecord.updated_at,
    project_updated_at: base.case_transition.project_updated_at,
    selected_gap: selectedGap,
    planned_transition: { goal: selectedGap.next_transition, expected_state_change: "completion_review pending -> clean" },
    accepted_state_delta: {
      facets: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: {
        outcome: "clean",
        reviewer: selectedGap.responsibility,
        reviewed_content_revision: caseRecord.content_revision,
        dimensions: { correctness: "clean", completeness: "clean", minimality: "clean" },
        findings: [],
        evidence: ["runtime completion review"]
      },
      resolved_review_findings: [],
      review_budget_extension: null
    },
    evidence: ["runtime completion review"],
    unresolved: [],
    round_outcome: "completed",
    case_resolution: { claimed_status: "resolved", reason: "The current content revision passed completion review." },
    project_impact_candidate: { status: "none", changes: [], evidence: [] }
  };
  return result;
}
