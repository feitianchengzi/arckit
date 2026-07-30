import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
  authorizedPacketFailureReason,
  createAgentTasks,
  normalizePacketWorkerTasks
} from "../src/agent-orchestrator.mjs";
import { writeLedger } from "../src/ledger-writer.mjs";
import { ensureArckitProject } from "../src/project-initializer.mjs";
import { createStateStore } from "../src/state-store.mjs";
import { runLedgerScript } from "../src/ledger-scripts.mjs";
import { reduceWorkerReports } from "../src/controller-reducer.mjs";
import {
  FACET_KEYS,
  auditCaseRecord,
  readCaseRecord,
  writeCaseRecord
} from "../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs";
import { applyCaseTransition } from "../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs";

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

test("Controller may plan an evidence-backed Case transition with zero Workers", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const workers = capabilitiesForBinding(capabilities, policy, "worker");
  const plan = controllerPlan([]);
  plan.route_plan.selected_worker_types = [];
  plan.route_plan.selected_roles = [];
  plan.worker_intents = [];

  assert.equal(controllerPlanFailureReason(plan, workers), "");
});

test("Controller plan rejects a stale candidate-gap field before Worker dispatch", async () => {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ capabilityPolicy: policy });
  const workers = capabilitiesForBinding(capabilities, policy, "worker");
  const plan = controllerPlan([]);
  const candidate = {
    id: plan.route_plan.selected_gap.id,
    facet: plan.route_plan.selected_gap.facet,
    responsibility: "agent",
    current_state: "unresolved",
    target_state: "resolved",
    next_transition: "Use the current Case evidence."
  };

  assert.match(controllerPlanFailureReason(plan, workers, {
    case_id: plan.route_plan.selected_gap.case_id,
    candidate_case_gaps: [candidate],
    candidate_cases: []
  }), /stale Case gap: next_transition/);
});

test("authorized packet rejects a stale Case revision before Worker execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-stale-packet-"));
  await ensureArckitProject({ projectRoot, intent: "Create a packet revision fixture." });
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

test("case transition CLI accepts ephemeral transition input from stdin", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-transition-stdin-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Transition Stdin Test",
    intent: "Verify fileless Case transition transport."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const transition = validProgressRuntimeResult(activeCase.record).case_transition;
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
  await ensureArckitProject({
    projectRoot,
    projectName: "Ledger Writeback Test",
    intent: "Verify direct runtime capability invocation."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record);
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
});

test("Case transition dry-run and apply preserve replacement-token evidence verbatim", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-case-render-roundtrip-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Case Renderer Round Trip Test",
    intent: "Preserve arbitrary command evidence through Case rendering."
  });
  const snapshot = await createStateStore(projectRoot).readSnapshot();
  const activeCase = snapshot.activeCases[0];
  const runtimeResult = validProgressRuntimeResult(activeCase.record);
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

test("Runtime leaves existing active Cases for Controller selection and the accepted transition binds that selection", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-controller-case-selection-"));
  await ensureArckitProject({
    projectRoot,
    projectName: "Controller Case Selection Test",
    intent: "Create one neutral Case."
  });
  const statePath = join(projectRoot, "arckit/project/state.record.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const existingCaseRef = state.active_case_refs[0];
  state.case_control = {
    selected_case_ref: "",
    selection_reason: "No Case is selected yet.",
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

  const runtimeResult = validProgressRuntimeResult(snapshot.activeCases[0].record);
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
  assert.equal(snapshot.projectState.case_control.selected_case_ref, existingCaseRef);
  assert.equal(snapshot.activeCases.length, 1);
});

test("a final clean review closes the selected Case and aggregates it through the shared ledger path", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-commit-"));
  await ensureArckitProject({
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
  const runtimeResult = validProgressRuntimeResult(record);
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
    dryRun: false
  });

  const projectState = JSON.parse(readFileSync(join(projectRoot, "arckit/project/state.record.json"), "utf8"));
  const closedRef = activeCase.ref.replace("/active/", "/closed/");
  assert.equal(result.written, true, JSON.stringify(result.gate?.reasons || result));
  assert.equal(result.case_transition_result.case_resolution.status, "resolved");
  assert.equal(existsSync(join(projectRoot, activeCase.ref)), false);
  assert.equal(existsSync(join(projectRoot, closedRef)), true);
  assert.deepEqual(projectState.active_case_refs, []);
  assert.equal(projectState.case_control.selected_case_ref, "");
  assert.ok(projectState.canonical_artifact_refs.includes(closedRef));
});

test("ledger commit rolls Case and Project files back when a projection step fails", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-ledger-rollback-"));
  await ensureArckitProject({
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
  const progressResult = validProgressRuntimeResult(record);
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
    schema_version: "arckit-controller-plan/v2",
    status: "planned",
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
      selected_worker_types: ["implementation"],
      selected_roles: ["implementer"],
      reason: "The Case gap requires implementation evidence.",
      requires_human_confirmation: false
    },
    worker_intents: [{
      worker_type: "implementation",
      role: "implementer",
      objective: "Implement the bounded change.",
      reason: "The state gap requires implementation evidence.",
      allowed_skills: allowedSkills,
      expected_case_impact: "Advance implementation_state with evidence."
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

function taskFixture() {
  return {
    loopFrame: {
      round_goal: "Implement the bounded change.",
      conversation_locale: "en",
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

function validProgressRuntimeResult(caseRecord) {
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
      schema_version: "arckit-case-transition/v2",
      case_id: caseId,
      case_updated_at: caseRecord.updated_at,
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
    schema_version: "arckit-case-transition/v2",
    case_id: caseRecord.id,
    case_updated_at: caseRecord.updated_at,
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
