import test from "node:test";
import assert from "node:assert/strict";
import { buildControllerOperatorTask, buildDesktopOperatorEvent } from "../src/kernel/operator-event.mjs";
import { compilePrompt } from "../src/prompt-compiler.mjs";
import { selectNextRound } from "../src/loop-controller.mjs";
import { createLoopFrame, createAgentTasks } from "../src/agent-orchestrator.mjs";
import { validateRuntimeResult } from "../src/validator.mjs";

const rawOperatorTask = [
  "Arckit Desktop operator event.",
  "",
  "{",
  '  "schema_version": "arckit-desktop-operator-event/v1",',
  '  "user_input": "验收通过"',
  "}"
].join("\n");

test("desktop operator context never becomes generated human prompt content", () => {
  const event = buildDesktopOperatorEvent({
    action: "auto_continue",
    userInput: "人类真实输入",
    controlState: {
      state: "agent_auto_continue_ready",
      primary_action: "auto_continue",
      primary_label: "Auto Continue",
      reason: "continue"
    },
    project: { id: "p1", name: "demo", path: "/tmp/demo" },
    session: { id: "s1", title: "demo" },
    run: {
      id: "RUN-1",
      status: "completed",
      adapter: "codex-app-server",
      result_file: "/tmp/result.json",
      activity_file: "/tmp/activity.json"
    },
    activity: {
      controller_frame: {
        round_goal: rawOperatorTask,
        route_plan: {
          reason: rawOperatorTask,
          selected_gap: { next_transition: rawOperatorTask }
        },
        controller_plan: { summary: rawOperatorTask, status: "planned" }
      },
      loop_handoff: {
        next_prompt: rawOperatorTask,
        agent_instruction: { goal: rawOperatorTask, required_context_refs: ["arckit/project/state.record.json"] },
        progress_guard: { expected_state_change: rawOperatorTask }
      }
    },
    projectStatus: {
      case_control: {
        next_case_intent: rawOperatorTask,
        selection_reason: rawOperatorTask
      }
    },
    latestNextPrompt: "继续下一轮"
  });

  assert.equal(event.controller_context.controller_frame.round_goal, "");
  assert.equal(event.controller_context.loop_handoff.next_prompt, "");
  assert.equal(event.project_case_control.next_case_intent, "");
  assert.equal(event.source_run.id, "RUN-1");
  assert.equal(buildControllerOperatorTask(event), "人类真实输入");
  assert.equal(buildControllerOperatorTask({ ...event, user_input: "" }), "");
});

test("legacy compiled prompt preserves only operator input and machine metadata", () => {
  const compiled = compilePrompt({}, {
    conversation_locale: "zh-Hans",
    required_outputs: ["case_transition"],
    required_context_refs: ["arckit/project/state.record.json"]
  }, { task: "实现并验证任务。" });

  assert.equal(compiled.prompt, "实现并验证任务。");
  assert.equal(compiled.operator_input, "实现并验证任务。");
  assert.deepEqual(compiled.context_refs, ["arckit/project/state.record.json"]);
  assert.doesNotMatch(compiled.prompt, /Arckit Supervised Runtime Turn|Required Checks|Stop Conditions/);
});

test("polluted Project case control does not become the next Case round goal", () => {
  const snapshot = {
    projectState: {
      state_gaps: [],
      case_control: {
        next_case_intent: rawOperatorTask
      }
    },
    paths: {
      projectState: "arckit/project/state.record.json",
      stateBrief: "arckit/project/STATE.md",
      activeCases: []
    }
  };
  const round = selectNextRound(snapshot, {});
  assert.ok(!round.round_goal.includes("arckit-desktop-operator-event/v1"));
  assert.equal(round.case_control.next_case_intent, "");
});

test("loop frame and worker task keep raw operator task out of semantic fields", () => {
  const snapshot = {
    projectState: {
      active_case_refs: ["arckit/cases/active/CASE-1.md"],
      case_control: { next_case_intent: "Select one active Case for this Loop." }
    },
    summary: {
      project_name: "demo",
      current_phase: "implementation"
    },
    activeCases: [{
      ref: "arckit/cases/active/CASE-20260726-001-demo.md",
      record: {
        id: "CASE-20260726-001",
        updated_at: "2026-07-26T00:00:00.000Z",
        user_intent: "实现并验证双模式任务管理应用。",
        expected_outcome: "实现证据可恢复。",
        facets: {
          implementation_state: {
            applicability: "required",
            maturity: "confirmed",
            alignment: "diverged",
            resolution: "unresolved",
            reason: "实现尚未完成。",
            evidence: ["arckit/spec/demo.md"]
          }
        },
        rounds: [{ round: 1, goal: "确认范围。", outcome: "completed", planned_transition: "范围已确认。", evidence: ["arckit/spec/demo.md"] }],
        open_questions: [{ id: "Q-1", status: "open", question: "是否覆盖恢复路径？" }],
        pending_handoffs: []
      }
    }],
    projectRoot: "/tmp/demo"
  };
  const round = {
    round_goal: "实现并验证双模式任务管理应用。",
    conversation_locale: "zh-Hans",
    gap_id: "AGENT-SELECTED",
    scope: "case",
    case_id: "CASE-20260726-001",
    facet: "implementation_state",
    current_state: "unknown",
    target_state: "defined",
    impact: "",
    required_context_refs: [
      "arckit/project/state.record.json",
      "arckit/cases/active/CASE-20260726-001-demo.md",
      "arckit/cases/active/CASE-OTHER-unrelated.md"
    ],
    stop_conditions: []
  };
  const frame = createLoopFrame({ snapshot, round, task: rawOperatorTask });
  const tasks = createAgentTasks({
    loopFrame: frame,
    round,
    snapshot,
    task: rawOperatorTask,
    controllerPlan: {
      continuation_intent: {
        goal: "实现并验证双模式任务管理应用。",
        state_transition: "implementation_coverage unknown -> verified",
        next_prompt: "继续实现并验证。"
      },
      worker_intents: [
        {
          worker_type: "implementation",
          workstream_id: "application-core",
          role: "实现者",
          objective: "实现应用。",
          allowed_paths: ["src/"],
          allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks"],
          forbidden_actions: ["write_ledger_directly"],
          allowed_skills: [],
          expected_case_impact: "推进 implementation_state。",
          stop_condition: "实现和验证证据齐全后停止。"
        }
      ]
    }
  });

  assert.equal(frame.round_goal, "实现并验证双模式任务管理应用。");
  assert.equal(frame.controller_frame.round_goal, "实现并验证双模式任务管理应用。");
  assert.equal(tasks[0].inputs.user_request_excerpt, "实现并验证双模式任务管理应用。");
  assert.equal(tasks[0].inputs.context_digest.case_updated_at, "2026-07-26T00:00:00.000Z");
  assert.equal(tasks[0].inputs.context_digest.facet_state.reason, "实现尚未完成。");
  assert.deepEqual(tasks[0].inputs.context_digest.open_questions, ["是否覆盖恢复路径？"]);
  assert.equal(tasks[0].inputs.context_digest.context_refs.includes("arckit/cases/active/CASE-OTHER-unrelated.md"), false);
  assert.ok(!tasks[0].loop_frame_excerpt.round_goal.includes("arckit-desktop-operator-event/v1"));
});

test("runtime validator rejects raw operator event in handoff semantic fields", () => {
  const result = minimalRuntimeResult();
  result.loop_handoff.agent_instruction.goal = rawOperatorTask;
  const validation = validateRuntimeResult(result);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.path === "loop_handoff.agent_instruction.goal"));
});

function minimalRuntimeResult() {
  return {
    schema_version: "arckit-runtime-result/v2",
    round_result: "continue",
    round_outcome: { status: "completed", reason: "claims accepted" },
    case_outcome: { status: "unresolved", reason: "more work", unresolved: ["verification_state"] },
    project_impact: { status: "none", changes: [], evidence: [] },
    case_transition: {
      schema_version: "arckit-case-transition/v3",
      case_id: "CASE-20260726-001",
      case_updated_at: "2026-07-26T00:00:00.000Z",
      project_updated_at: "2026-07-26T00:00:00.000Z",
      selected_gap: { id: "CASE-20260726-001:implementation_state", facet: "implementation_state", responsibility: "agent", current_state: "unresolved", target_state: "resolved", next_transition: "继续实现并验证。", evidence_required: [] },
      planned_transition: { goal: "继续实现并验证。", expected_state_change: "implementation_state unresolved -> resolved" },
      accepted_state_delta: { facets: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null },
      evidence: ["test"],
      unresolved: ["verification_state"],
      round_outcome: "completed",
      case_resolution: { claimed_status: "unresolved", reason: "more work" },
      project_impact_candidate: { status: "none", changes: [], evidence: [] }
    },
    round_state: "ledger_gate_ready",
    round_state_history: [],
    changed_files: ["arckit/project/state.record.json"],
    artifact_impact_scan: {
      project: "write",
      intake: "none",
      cases: "write",
      spec: "none",
      interaction: "none",
      visual: "none",
      tech: "none",
      debug: "none",
      pending: "none",
      handoff: "none"
    },
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
      round_goal: "继续实现并验证。",
      route_plan: {
        selected_gap: {
          next_transition: "继续实现并验证。"
        }
      }
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
      reason: "validated"
    },
    validation_evidence: ["test"],
    loop_handoff: {
      version: "loop-handoff/v2",
      status: "continue",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "auto_bridge",
      responsibility_reason: "继续实现。",
      next_prompt: "继续实现并验证。",
      agent_instruction: {
        goal: "继续实现并验证。",
        required_context_refs: [],
        required_actions: [],
        required_checks: [],
        stop_condition: "Stop when verified."
      },
      human_gate: {
        required: false,
        reason: "",
        decision_needed: ""
      },
      progress_guard: {
        expected_state_change: "implementation_coverage unknown -> verified",
        actual_state_change: "reports collected",
        no_progress_limit: 1,
        max_auto_rounds: 1
      }
    }
  };
}
