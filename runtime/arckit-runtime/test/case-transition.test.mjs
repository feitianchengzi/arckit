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
import { selectNextRound } from '../src/loop-controller.mjs';

test('the ledger accepts only current Case and transition schema versions', () => {
  const record = caseRecord();
  const unsupportedRecord = { ...structuredClone(record), schema_version: 'unsupported-case-state' };
  assert.match(validateCaseRecord(unsupportedRecord).join('\n'), /development-case-record\/v5/);
  assert.throws(() => auditCaseRecord(unsupportedRecord), /expected development-case-record\/v5/);

  const unsupportedTransition = { ...transition(record), schema_version: 'unsupported-case-transition' };
  assert.match(validateCaseTransition(unsupportedTransition).join('\n'), /arckit-case-transition\/v6/);
  assert.throws(() => applyCaseTransitionToRecord(unsupportedRecord, unsupportedTransition), /arckit-case-transition\/v6/);
});

test('a selected gap must match the complete fresh candidate snapshot', () => {
  const record = caseRecord();
  const input = transition(record);
  input.selected_gap.reason = 'Stale reason from an earlier revision.';
  assert.throws(() => applyCaseTransitionToRecord(record, input), /stale or not ready/);
});

test('a transition rejects a stale Case revision', () => {
  const record = caseRecord();
  const input = transition(record);
  input.case_updated_at = '2026-07-25T00:00:00.000Z';
  assert.throws(() => applyCaseTransitionToRecord(record, input), /Stale Case transition/);
});

test('one dynamic gap may produce facts and the next gap without any document checklist', () => {
  const record = caseRecord();
  const input = transition(record, {
    facts_added: [{
      id: 'FACT-ROOT-CAUSE', revision: 1, status: 'accepted',
      statement: 'The restore path applies stale data after the freshness guard.',
      basis: 'Trace and code-path evidence agree.', evidence: ['debug/root-cause.md'],
    }],
    gaps_added: [{
      id: 'GAP-FIX', status: 'open', goal: 'Fix and verify the restore ordering.',
      reason: 'The accepted root cause now makes a bounded fix possible.',
      derived_from: ['FACT-ROOT-CAUSE'], blocked_by: [],
      priority_basis: { blocking: 'high', uncertainty: 'low', risk: 'high', user_impact: 'high' },
      responsibility: 'agent', evidence_required: ['Focused implementation and regression evidence.'], resolution: null,
    }],
  });
  const next = applyCaseTransitionToRecord(record, input);
  assert.equal(next.facts.at(-1).id, 'FACT-ROOT-CAUSE');
  assert.deepEqual(next.case_resolution.candidate_gaps.map((gap) => gap.id), ['GAP-FIX']);
  assert.equal(Object.hasOwn(next, 'facets'), false);
});

test('a fresh gap may be selected and completed without being preplanned by the prior transition', () => {
  let record = caseRecord();
  record = applyCaseTransitionToRecord(record, transition(record));
  assert.match(record.case_resolution.candidate_gaps[0].id, /completion-review/);

  const selected = {
    id: 'GAP-FRESH-VERIFY-RACE',
    goal: 'Verify the newly discovered restore race.',
    reason: 'Current-turn trace evidence exposed a material race before completion review.',
    derived_from: ['FACT-BUG', 'trace:fresh-race'],
    blocked_by: ['GAP-DIAGNOSE'],
    priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'high', user_impact: 'high' },
    responsibility: 'agent',
    evidence_required: ['Focused race verification.'],
  };
  const input = baseTransition(record, selected, 'fresh');
  input.accepted_state_delta.resolved_gap = resolution(selected.id, 'The race is verified and bounded.');
  input.evidence = ['trace:fresh-race'];
  const next = applyCaseTransitionToRecord(record, input);

  assert.equal(next.gaps.find((gap) => gap.id === selected.id)?.status, 'resolved');
  assert.equal(next.rounds.at(-1).gap_selection.mode, 'fresh');
  assert.equal(next.completion_review.status, 'pending');
  assert.match(next.case_resolution.candidate_gaps[0].id, /completion-review/);
});

test('fresh selection rejects existing, non-Agent, reserved, and blocked gaps', () => {
  const record = caseRecord();
  const fresh = (overrides = {}) => {
    const selected = {
      id: 'GAP-FRESH', goal: 'Do current-turn work.', reason: 'New evidence makes it the most important next action.',
      derived_from: ['FACT-BUG'], blocked_by: [], priority_basis: { blocking: 'high' }, responsibility: 'agent',
      evidence_required: ['Focused evidence.'], ...overrides,
    };
    const input = baseTransition(structuredClone(record), selected, 'fresh');
    input.accepted_state_delta.resolved_gap = resolution(selected.id, 'Fresh work completed.');
    return input;
  };
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), fresh({ id: 'GAP-DIAGNOSE' })), /already exists/);
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), fresh({ responsibility: 'human' })), /Agent-owned/);
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), fresh({ id: `${record.id}:completion-review:forged` })), /reserved id/);
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), fresh({ blocked_by: ['GAP-UNKNOWN'] })), /not ready/);
});

test('completion review findings become ordinary repair gaps and invalidate the old clean revision', () => {
  let record = caseRecord();
  record = applyCaseTransitionToRecord(record, transition(record));
  const reviewGap = record.case_resolution.candidate_gaps[0];
  const review = baseTransition(record, reviewGap);
  review.accepted_state_delta.completion_review_result = {
    outcome: 'findings', reviewer: 'agent', reviewed_content_revision: record.content_revision,
    dimensions: reviewDimensions('findings'),
    findings: [{
      id: 'CR-1', kind: 'error', statement: 'The boundary case is still incorrect.', responsibility: 'agent',
      artifact_refs: ['src/restore.mjs'], evidence: ['test:restore-boundary-failure'],
    }],
    evidence: ['test:restore-boundary-failure'],
  };
  const reviewed = applyCaseTransitionToRecord(record, review);
  const repairGap = reviewed.case_resolution.candidate_gaps[0];
  assert.match(repairGap.id, /review-finding:CR-1$/);

  const repair = baseTransition(reviewed, repairGap);
  repair.accepted_state_delta.resolved_gap = resolution(repairGap.id, 'The boundary case is fixed.');
  repair.accepted_state_delta.resolved_review_findings = [{ id: 'CR-1', resolution: 'resolved', reason: 'Focused fix passed.', evidence: ['test:restore-boundary-pass'] }];
  repair.evidence = ['test:restore-boundary-pass'];
  const repaired = applyCaseTransitionToRecord(reviewed, repair);
  assert.equal(repaired.completion_review.status, 'pending');
  assert.equal(repaired.completion_review.reviewed_content_revision, null);
  assert.equal(repaired.case_resolution.stage, 'review_ready');
});

test('human questions pause while external handoffs wait only when no Agent gap is ready', () => {
  const human = caseRecord();
  human.open_questions.push({ id: 'Q-1', question: 'Which policy is authoritative?', owner: 'human', status: 'open', evidence: [] });
  const humanAudit = auditCaseRecord(human);
  assert.equal(humanAudit.loop_handoff.next_responsibility, 'human');

  const external = caseRecord();
  external.pending_handoffs.push({ id: 'H-1', target: 'deployment', owner: 'external', status: 'pending', resume_condition: 'Wait for deployment evidence.', evidence: [] });
  assert.equal(auditCaseRecord(external).loop_handoff.next_responsibility, 'agent');
  external.gaps[0].status = 'resolved';
  external.gaps[0].resolution = { status: 'resolved', outcome: 'Diagnosis complete.', reason: 'Evidence agrees.', evidence: ['debug/root-cause.md'], occurred_at: new Date().toISOString() };
  assert.equal(auditCaseRecord(external).loop_handoff.next_responsibility, 'external');
});

test('Runtime exposes all active Cases for Agent selection without preselecting a gap type', () => {
  const record = caseRecord();
  const ref = 'arckit/cases/active/CASE-example.md';
  const round = selectNextRound({
    projectState: { advancement: { selection_context: { next_case_intent: 'Advance the most valuable gap.' }, project_gaps: [] } },
    activeCases: [{ ref, record }],
    paths: { projectState: 'arckit/project/state.record.json', activeCases: [ref] },
  });
  assert.equal(round.case_id, '');
  assert.equal(round.gap_id, 'CASE-GAP-AGENT-SELECTED');
  assert.equal(Object.hasOwn(round, 'facet'), false);
  assert.deepEqual(round.candidate_cases[0].candidate_gaps.map((gap) => gap.id), ['GAP-DIAGNOSE']);
});

test('Runtime leaves Case identity empty so the Agent can create the first Case', () => {
  const round = selectNextRound({
    projectState: { advancement: { selection_context: {}, project_gaps: [] } },
    activeCases: [],
    paths: { projectState: 'arckit/project/state.record.json', activeCases: [] },
  }, { task: 'Implement a new bounded behavior.' });

  assert.equal(round.case_id, '');
  assert.deepEqual(round.candidate_cases, []);
  assert.match(round.reason, /Agent must create one/);
});

function caseRecord() {
  return createDefaultCaseRecord({
    title: 'Restore ordering', artifactType: 'code', intent: 'Fix stale restore behavior', expectedOutcome: 'Newer data is preserved',
    maxReviewCycles: 3, reviewPolicySource: 'test-policy',
    initialFacts: [{ id: 'FACT-BUG', revision: 1, status: 'accepted', statement: 'Restore can overwrite newer data.', basis: 'Reproduced report.', evidence: ['debug/reproduction.md'] }],
    initialImpacts: [],
    initialGaps: [{
      id: 'GAP-DIAGNOSE', status: 'open', goal: 'Find the root cause.', reason: 'The cause is unknown.',
      derived_from: ['FACT-BUG'], blocked_by: [], priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'high', user_impact: 'high' },
      responsibility: 'agent', evidence_required: ['Reproduction and code evidence.'], resolution: null,
    }],
  });
}

function transition(record, delta = {}) {
  const selected = record.case_resolution.candidate_gaps[0];
  const input = baseTransition(record, selected);
  input.accepted_state_delta.resolved_gap = resolution(selected.id, 'The root cause is identified.');
  Object.assign(input.accepted_state_delta, delta);
  assert.deepEqual(validateCaseTransition(input), []);
  return input;
}

function baseTransition(record, selected, mode = 'candidate') {
  return {
    schema_version: 'arckit-case-transition/v6', case_id: record.id, case_updated_at: record.updated_at,
    project_revision: 0, gap_selection: { mode, basis: mode === 'fresh' ? 'Current evidence makes this new gap the most important current action.' : 'This ledger candidate is the most important current action.' }, selected_gap: structuredClone(selected),
    planned_transition: { goal: selected.goal, expected_state_change: 'Advance the selected dynamic gap.' },
    accepted_state_delta: {
      resolved_gap: null, facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [],
      resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null,
    },
    project_state_delta: { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    evidence: ['debug/root-cause.md'], unresolved: ['completion_review'], round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'More Case work remains.' },
  };
}

function resolution(id, outcome) {
  return { id, status: 'resolved', outcome, reason: 'Persistent evidence supports the result.', evidence: ['debug/root-cause.md'] };
}

function reviewDimensions(implementationCorrectness) {
  return {
    implementation_correctness: implementationCorrectness,
    problem_resolution: 'clean', verification_credibility: 'clean', regression_risk: 'clean', minimality: 'clean',
  };
}
