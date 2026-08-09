import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runAgenticLoop } from "../src/agent-orchestrator.mjs";
import { compilePrompt } from "../src/prompt-compiler.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDir, "../../..");

test("default execution uses one coherent using-arckit Agent turn for one Case gap", async () => {
  const gap = {
    id: "CASE-1:implementation_state",
    facet: "implementation_state",
    responsibility: "agent",
    current_state: "unresolved",
    target_state: "resolved",
    next_transition: "Implement and verify the bounded change.",
    evidence_required: ["implementation and test evidence"]
  };
  const snapshot = {
    projectRoot: repositoryRoot,
    summary: { project_name: "Arckit", current_phase: "implementation", active_case_count: 1 },
    projectState: {
      project: { updated_at: "2026-08-09T00:00:00.000Z" },
      state_gaps: [],
      active_case_refs: ["arckit/cases/active/CASE-1.md"]
    },
    activeCases: [{
      ref: "arckit/cases/active/CASE-1.md",
      record: {
        id: "CASE-1",
        title: "Coherent Agent Loop",
        status: "active",
        updated_at: "2026-08-09T00:01:00.000Z",
        user_intent: "Implement the bounded change.",
        facets: {},
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
    case_id: "CASE-1",
    case_updated_at: "2026-08-09T00:01:00.000Z",
    gap_id: gap.id,
    facet: gap.facet,
    responsibility: gap.responsibility,
    current_state: gap.current_state,
    target_state: gap.target_state,
    next_transition: gap.next_transition,
    evidence_required: gap.evidence_required,
    required_context_refs: ["arckit/cases/active/CASE-1.md"],
    required_outputs: [],
    stop_conditions: [],
    conversation_locale: "en",
    candidate_cases: [{ case_id: "CASE-1", candidate_gaps: [gap] }],
    candidate_case_gaps: [gap]
  };
  const calls = [];
  const agentAdapter = {
    name: "codex-app-server",
    async *runTurn(input) {
      calls.push(input);
      yield {
        type: "runtime.agent_loop_result",
        result: agentLoopResult(gap)
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
});

function agentLoopResult(gap) {
  return {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "Implemented and verified one bounded Case gap.",
    case_control: null,
    case_transition: {
      schema_version: "arckit-case-transition/v3",
      case_id: "CASE-1",
      case_updated_at: "2026-08-09T00:01:00.000Z",
      project_updated_at: "2026-08-09T00:00:00.000Z",
      selected_gap: gap,
      planned_transition: {
        goal: "Implement and verify the bounded change.",
        expected_state_change: "implementation_state unresolved -> resolved"
      },
      accepted_state_delta: {
        facets: [{
          facet: "implementation_state",
          set: {
            applicability: "required",
            maturity: "formalized",
            target_maturity: "formalized",
            alignment: "aligned",
            target_alignment: "aligned",
            resolution: "resolved",
            reason: "The bounded change and focused verification are complete.",
            next_transition: null
          },
          evidence: ["test:coherent-agent-loop"],
          unresolved: []
        }],
        resolved_open_questions: [],
        completed_handoffs: [],
        completion_review_result: null,
        resolved_review_findings: [],
        review_budget_extension: null
      },
      evidence: ["test:coherent-agent-loop"],
      unresolved: ["verification_state"],
      round_outcome: "completed",
      case_resolution: { claimed_status: "unresolved", reason: "Verification remains." },
      project_impact_candidate: { status: "none", changes: [], evidence: [] }
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
