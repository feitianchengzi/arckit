import test from "node:test";
import assert from "node:assert/strict";
import { buildDesktopOperatorEvent } from "../src/kernel/operator-event.mjs";
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

test("desktop operator event summarizes prior activity instead of embedding raw semantic pollution", () => {
  const event = buildDesktopOperatorEvent({
    action: "auto_continue",
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
      loop_control: {
        next_transition: rawOperatorTask,
        continuation_prompt: rawOperatorTask
      }
    },
    latestNextPrompt: "继续下一轮"
  });

  assert.equal(event.controller_context.controller_frame.round_goal, "");
  assert.equal(event.controller_context.loop_handoff.next_prompt, "");
  assert.equal(event.project_loop_control.next_transition, "");
  assert.equal(event.source_run.id, "RUN-1");
});

test("polluted loop control does not become the next round goal", () => {
  const snapshot = {
    projectState: {
      state_gaps: [],
      loop_control: {
        next_transition: rawOperatorTask
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
  assert.equal(round.loop_control.next_transition, "");
});

test("loop frame and worker task keep raw operator task out of semantic fields", () => {
  const snapshot = {
    projectState: {
      active_case_refs: ["arckit/cases/active/CASE-1.md"],
      loop_control: {
        next_responsibility: "agent",
        trigger_mode: "manual_bridge"
      }
    },
    summary: {
      project_name: "demo",
      current_phase: "implementation"
    },
    projectRoot: "/tmp/demo"
  };
  const round = {
    round_goal: "实现并验证双模式任务管理应用。",
    conversation_locale: "zh-Hans",
    gap_id: "AGENT-SELECTED",
    dimension: "agent_selected",
    current_state: "unknown",
    target_state: "defined",
    urgency: "medium",
    risk: "medium",
    impact: "",
    required_context_refs: ["arckit/project/state.record.json"],
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
        { worker_type: "implementation", role: "实现者", objective: "实现应用。", allowed_skills: [] }
      ]
    }
  });

  assert.equal(frame.round_goal, "实现并验证双模式任务管理应用。");
  assert.equal(frame.controller_frame.round_goal, "实现并验证双模式任务管理应用。");
  assert.equal(tasks[0].inputs.user_request_excerpt, "实现并验证双模式任务管理应用。");
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
    schema_version: "arckit-runtime-result/v1",
    round_result: "continue",
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
      workflow_memory: "none",
      agent_context: "none",
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
      version: "loop-handoff/v1",
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
