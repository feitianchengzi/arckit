import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runAgenticLoop } from "../src/agent-orchestrator.mjs";
import { compilePrompt } from "../src/prompt-compiler.mjs";
import { createProjectStateRecord } from "../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDir, "../../..");

test("default execution accepts candidate and current-turn fresh gaps from one coherent using-arckit Agent", async () => {
  const caseId = "CASE-20260810-001";
  const gap = {
    id: "GAP-IMPLEMENT",
    responsibility: "agent",
    goal: "Implement and verify the bounded change.",
    reason: "The diagnosed behavior now has a bounded implementation path.",
    derived_from: ["FACT-ROOT-CAUSE"],
    blocked_by: [],
    priority_basis: { blocking: "high", uncertainty: "low", risk: "high", user_impact: "high" },
    evidence_required: ["implementation and test evidence"]
  };
  const snapshot = {
    projectRoot: repositoryRoot,
    summary: { project_name: "Arckit", current_phase: "implementation", active_case_count: 1 },
    projectState: (() => {
      const state = createProjectStateRecord({ name: "Arckit", intent: "Advance one coherent Agent loop." });
      state.advancement.active_case_refs = ["arckit/cases/active/CASE-1.md"];
      return state;
    })(),
    activeCases: [{
      ref: "arckit/cases/active/CASE-1.md",
      record: {
        id: caseId,
        title: "Coherent Agent Loop",
        status: "active",
        schema_version: "development-case-record/v5",
        artifact_type: "code",
        updated_at: "2026-08-09T00:01:00.000Z",
        user_intent: "Implement the bounded change.",
        expected_outcome: "The bounded behavior is correct and verified.",
        facts: [{ id: "FACT-ROOT-CAUSE", revision: 1, status: "accepted", statement: "The root cause is known.", basis: "Trace evidence.", evidence: ["debug/root-cause.md"] }],
        state_impacts: [],
        gaps: [{ ...gap, status: "open", resolution: null }],
        content_revision: 0,
        rounds: [],
        open_questions: [],
        pending_handoffs: [],
        case_resolution: { status: "unresolved", stage: "working", candidate_gaps: [gap] },
        completion_review: { status: "pending", policy: { initial_max_cycles: 3 }, findings: [] }
      }
    }],
    paths: {
      projectState: "arckit/project/state.record.json",
      activeCases: ["arckit/cases/active/CASE-1.md"]
    }
  };
  const round = {
    round_index: 1,
    case_id: caseId,
    case_updated_at: "2026-08-09T00:01:00.000Z",
    gap_id: gap.id,
    responsibility: gap.responsibility,
    goal: gap.goal,
    reason: gap.reason,
    derived_from: gap.derived_from,
    blocked_by: gap.blocked_by,
    priority_basis: gap.priority_basis,
    evidence_required: gap.evidence_required,
    required_context_refs: ["arckit/cases/active/CASE-1.md"],
    required_outputs: [],
    stop_conditions: [],
    conversation_locale: "en",
    candidate_cases: [{ case_id: caseId, candidate_gaps: [gap] }],
    candidate_case_gaps: [gap]
  };
  const calls = [];
  const agentAdapter = {
    name: "codex-app-server",
    async *runTurn(input) {
      calls.push(input);
      yield {
        type: "runtime.agent_loop_result",
        result: agentLoopResult(gap, caseId)
      };
    }
  };

  const result = await runAgenticLoop({
    projectRoot: repositoryRoot,
    snapshot,
    round,
    compiledPrompt: compilePrompt(snapshot, round, { task: "Implement the bounded change." }),
    options: {
      task: "Implement the bounded change.",
      originalTask: "Implement the bounded change.",
      taskId: "TASK-1",
      codexHome: "/runtime-must-not-read-codex-home",
      agentAdapter,
      adapter: "codex-app-server",
      conversationLocale: "en"
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.threadKey, "agent-loop:TASK-1");
  assert.equal(calls[0].options.resultKind, "agent-loop-result");
  assert.equal("skillInputs" in calls[0].options, false);
  assert.ok(calls[0].prompt.startsWith("$using-arckit\n"));
  assert.match(calls[0].prompt, /"execute_in_current_turn": true/);
  assert.equal("agentTasks" in result, false);
  assert.equal("agentReports" in result, false);
  assert.equal("mergeResult" in result, false);
  assert.equal(result.runtimeResult.ledger_stage.writeback_required, true);
  assert.equal(result.runtimeResult.case_transition.selected_gap.id, gap.id);
  assert.equal(result.validation.valid, true, JSON.stringify(result.validation.issues));

  const freshGap = {
    ...gap,
    id: "GAP-FRESH-RACE",
    goal: "Verify a race exposed by current-turn evidence.",
    reason: "Current-turn trace evidence makes this more important than the persisted candidate.",
    derived_from: ["FACT-ROOT-CAUSE", "trace:fresh-race"]
  };
  const freshAdapter = {
    name: "codex-app-server",
    async *runTurn() {
      yield { type: "runtime.agent_loop_result", result: agentLoopResult(freshGap, caseId, "fresh") };
    }
  };
  const freshResult = await runAgenticLoop({
    projectRoot: repositoryRoot, snapshot, round,
    compiledPrompt: compilePrompt(snapshot, round, { task: "Verify the newly exposed race." }),
    options: { task: "Verify the newly exposed race.", taskId: "TASK-2", agentAdapter: freshAdapter, adapter: "codex-app-server", conversationLocale: "en" }
  });
  assert.equal(freshResult.runtimeResult.case_transition.gap_selection.mode, "fresh");
  assert.equal(freshResult.runtimeResult.case_transition.selected_gap.id, freshGap.id);
  assert.equal(freshResult.runtimeResult.ledger_stage.writeback_required, true);
  assert.equal(freshResult.validation.valid, true, JSON.stringify(freshResult.validation.issues));
});

function agentLoopResult(gap, caseId, mode = "candidate") {
  return {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "Implemented and verified one bounded Case gap.",
    case_control: null,
    case_transition: {
      schema_version: "arckit-case-transition/v6",
      case_id: caseId,
      case_updated_at: "2026-08-09T00:01:00.000Z",
      project_revision: 0,
      gap_selection: { mode, basis: mode === "fresh" ? "Current-turn evidence makes this fresh gap the most important current action." : "This ledger candidate is the most important current action." },
      selected_gap: gap,
      planned_transition: {
        goal: "Implement and verify the bounded change.",
        expected_state_change: "Resolve GAP-IMPLEMENT with implementation and verification evidence."
      },
      accepted_state_delta: {
        resolved_gap: { id: gap.id, status: "resolved", outcome: "The bounded change is implemented and verified.", reason: "Focused implementation and tests passed.", evidence: ["test:coherent-agent-loop"] },
        facts_added: [],
        facts_superseded: [],
        impacts_added: [],
        impacts_updated: [],
        gaps_added: [],
        gaps_cancelled: [],
        resolved_open_questions: [],
        completed_handoffs: [],
        completion_review_result: null,
        resolved_review_findings: [],
        review_budget_extension: null
      },
      project_state_delta: {
        software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [],
        selection_context_change: null, evidence: []
      },
      evidence: ["test:coherent-agent-loop"],
      unresolved: ["completion_review"],
      round_outcome: "completed",
      case_resolution: { claimed_status: "unresolved", reason: "Verification remains." }
    },
    changed_files: ["runtime/arckit-runtime/src/agent-orchestrator.mjs"],
    artifact_impacts: [{
      path: "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      claim: "updated",
      summary: "Runs one coherent Agent turn by default."
    }],
    risks: [],
    unknowns: [],
    handoff: {
      next_responsibility: "agent",
      reason: "Fresh state contains the next Case gap.",
      next_prompt: "Reload fresh state and advance the next gap.",
      human_decision_required: false
    }
  };
}
