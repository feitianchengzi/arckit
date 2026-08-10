import assert from 'node:assert/strict';
import test from 'node:test';

import {
  auditCaseRecord,
  createDefaultCaseRecord,
  validateCaseRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import {
  applyCaseTransitionToRecord,
  validateCaseTransition,
} from '../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs';
import { validateCaseControlHandoff } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs';
import { createControllerContextDigest } from '../src/agent-orchestrator.mjs';
import { runAgenticLoop } from '../src/agent-orchestrator.mjs';
import { evaluateRuntimeGates } from '../src/gate-engine.mjs';
import { compilePrompt } from '../src/prompt-compiler.mjs';

test('new bug Case starts from facts and one diagnosis gap without facet ceremony', () => {
  const record = bugCase();
  assert.equal(record.schema_version, 'development-case-record/v4');
  assert.equal(Object.hasOwn(record, 'facets'), false);
  assert.equal(Object.hasOwn(record.case_resolution, 'base_ready'), false);
  assert.deepEqual(record.case_resolution.candidate_gaps.map((gap) => gap.id), ['GAP-DIAGNOSE']);
  assert.equal(record.case_resolution.candidate_gaps[0].goal, 'Find the root cause.');
});

test('closing the last gap for a threatened condition requires the impact to be reconciled', () => {
  const record = bugCase({ threatened: true });
  const staleImpact = transition(record, {
    resolved_gap: resolution('GAP-DIAGNOSE'),
  });
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), staleImpact), /must bind at least one open gap/);

  const reconciled = transition(record, {
    resolved_gap: resolution('GAP-DIAGNOSE'),
    impacts_updated: [{
      id: 'IMPACT-ARCH', fact_id: 'FACT-BUG', fact_revision: 1,
      condition_ref: 'architecture_foundation.changed-contracts-remain-explainable',
      effect: 'upheld', reason: 'The diagnosis identified the exact contract boundary.',
      gap_ids: [], evidence: ['debug/root-cause.md'],
    }],
  });
  const next = applyCaseTransitionToRecord(structuredClone(record), reconciled);
  assert.equal(next.state_impacts[0].effect, 'upheld');
  assert.equal(next.case_resolution.stage, 'review_ready');
});

test('v4 completion review is implementation-focused and resolves the current revision', () => {
  let record = bugCase();
  record = applyCaseTransitionToRecord(record, transition(record, { resolved_gap: resolution('GAP-DIAGNOSE') }));
  const reviewGap = auditCaseRecord(record, record.updated_at).candidate_gaps[0];
  const review = baseTransition(record, reviewGap);
  review.accepted_state_delta.completion_review_result = {
    outcome: 'clean', reviewer: 'agent', reviewed_content_revision: record.content_revision,
    dimensions: {
      implementation_correctness: 'clean', problem_resolution: 'clean', verification_credibility: 'clean',
      regression_risk: 'clean', minimality: 'clean',
    },
    findings: [], evidence: ['test/state-condition-case.test.mjs'],
  };
  review.case_resolution = { claimed_status: 'resolved', reason: 'The implementation-focused review is clean.' };
  review.unresolved = [];
  const closed = applyCaseTransitionToRecord(record, review);
  assert.equal(closed.case_resolution.status, 'resolved');
  assert.deepEqual(validateCaseRecord(closed), []);
});

test('Runtime digest exposes Project conditions and v4 facts without inventing facet mappings', () => {
  const record = bugCase();
  const digest = createControllerContextDigest({
    snapshot: {
      projectState: {
        project: { name: 'Fixture', updated_at: 'project-rev' }, case_control: {}, state_gaps: [],
        completeness_dimensions: {
          architecture_foundation: { desired_conditions: [{ id: 'changed-contracts-remain-explainable', applies_when: 'A contract changes', must_hold: 'Changed contracts remain explainable', evidence_expectation: 'Durable architecture evidence', priority: 'required', status: 'active' }] },
        },
      },
      activeCases: [{ ref: 'arckit/cases/active/fixture.md', record }],
      paths: { projectState: 'arckit/project/state.record.json', activeIteration: '' }, summary: {},
    },
    loopFrame: { project_updated_at: 'project-rev', case_id: '' },
  });
  assert.equal(digest.project.desired_conditions[0].ref, 'architecture_foundation.changed-contracts-remain-explainable');
  assert.equal(digest.active_cases[0].facts[0].id, 'FACT-BUG');
  assert.equal(Object.hasOwn(digest.active_cases[0], 'facets'), false);
});

test('Case control requires semantic initial state instead of ledger-generated checklist gaps', () => {
  const valid = {
    schema_version: 'arckit-case-control-handoff/v1', action: 'create_case', expected_project_updated_at: 'project-rev', case_id: '',
    title: 'Diagnose restore bug', intent: 'Fix restore bug', expected_outcome: 'Restore keeps newest data', artifact_type: 'code',
    selection_reason: 'No active Case covers the bug.', initial_facts: bugCase().facts, initial_impacts: [], initial_gaps: bugCase().gaps,
    review_policy: { max_autonomous_cycles: 3, source: 'test-policy' },
  };
  assert.deepEqual(validateCaseControlHandoff(valid), []);
  assert.match(validateCaseControlHandoff({ ...valid, initial_gaps: [] }).join('\n'), /initial_gap/);
});

test('Runtime accepts a v4 dynamic-gap Agent result through its structural gate', async () => {
  const record = bugCase();
  const selected = record.case_resolution.candidate_gaps[0];
  const caseTransition = transition(record, { resolved_gap: resolution(selected.id) });
  const snapshot = {
    projectRoot: process.cwd(), summary: { project_name: 'Fixture', current_phase: 'work' },
    projectState: { project: { name: 'Fixture', updated_at: 'project-rev' }, state_gaps: [], completeness_dimensions: {}, active_case_refs: ['arckit/cases/active/fixture.md'] },
    activeCases: [{ ref: 'arckit/cases/active/fixture.md', record }],
    paths: { projectState: 'arckit/project/state.record.json', activeIteration: '', activeCases: ['arckit/cases/active/fixture.md'] },
  };
  const round = { round_index: 1, round_goal: selected.goal, required_context_refs: snapshot.paths.activeCases, required_outputs: [], stop_conditions: [], conversation_locale: 'en', candidate_cases: [{ case_id: record.id, candidate_gaps: [selected] }], candidate_case_gaps: [selected] };
  const agentAdapter = {
    async *runTurn() {
      yield {
        type: 'runtime.agent_loop_result',
        result: {
          schema_version: 'arckit-agent-loop-result/v1', action: 'case_transition', summary: 'Diagnosed the bug.',
          case_control: null, case_transition: caseTransition,
          changed_files: ['runtime/arckit-runtime/test/state-condition-case.test.mjs'], artifact_impacts: [], risks: [], unknowns: [],
          handoff: { next_responsibility: 'agent', reason: 'Completion review remains.', next_prompt: 'Fresh-read and review.', human_decision_required: false },
        },
      };
    },
  };
  const loop = await runAgenticLoop({ projectRoot: process.cwd(), snapshot, round, compiledPrompt: compilePrompt(snapshot, round, { task: selected.goal }), options: { task: selected.goal, originalTask: selected.goal, taskId: 'V4-GATE', agentAdapter, conversationLocale: 'en' } });
  assert.equal(loop.validation.valid, true, JSON.stringify(loop.validation.issues));
  const gate = await evaluateRuntimeGates({ runtimeResult: loop.runtimeResult, snapshot, projectRoot: process.cwd() });
  assert.equal(gate.allowed, true, gate.reasons.join('\n'));
});

function bugCase({ threatened = false } = {}) {
  return createDefaultCaseRecord({
    title: 'Diagnose restore bug', artifactType: 'code', intent: 'Fix restore bug', expectedOutcome: 'Restore keeps newest data',
    maxReviewCycles: 3, reviewPolicySource: 'test-policy',
    initialFacts: [{ id: 'FACT-BUG', revision: 1, status: 'accepted', statement: 'Restoring can overwrite newer data.', basis: 'User report and reproduction.', evidence: ['debug/reproduction.md'] }],
    initialImpacts: threatened ? [{ id: 'IMPACT-ARCH', fact_id: 'FACT-BUG', fact_revision: 1, condition_ref: 'architecture_foundation.changed-contracts-remain-explainable', effect: 'threatened', reason: 'The recovery contract is not yet understood.', gap_ids: ['GAP-DIAGNOSE'], evidence: [] }] : [],
    initialGaps: [{ id: 'GAP-DIAGNOSE', status: 'open', goal: 'Find the root cause.', reason: 'The root cause is unknown and blocks a safe fix.', derived_from: ['case_intent', 'FACT-BUG'], blocked_by: [], priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'high', user_impact: 'high' }, responsibility: 'agent', evidence_required: ['Reproduction and code-path evidence.'], resolution: null }],
  });
}

function resolution(id) {
  return { id, status: 'resolved', outcome: 'Root cause identified.', reason: 'Trace and code evidence agree.', evidence: ['debug/root-cause.md'] };
}

function transition(record, overrides = {}) {
  const selected = record.case_resolution.candidate_gaps[0];
  const result = baseTransition(record, selected);
  result.accepted_state_delta = { ...result.accepted_state_delta, ...overrides };
  assert.deepEqual(validateCaseTransition(result), []);
  return result;
}

function baseTransition(record, selected) {
  return {
    schema_version: 'arckit-case-transition/v4', case_id: record.id, case_updated_at: record.updated_at, project_updated_at: 'project-rev', selected_gap: selected,
    planned_transition: { goal: selected.goal, expected_state_change: 'Advance the selected dynamic gap.' },
    accepted_state_delta: { resolved_gap: null, facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null },
    evidence: ['debug/root-cause.md'], unresolved: ['completion_review'], round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'More Case work remains.' },
    project_impact_candidate: { status: 'none', changes: [], condition_changes: [], evidence: [] },
  };
}
