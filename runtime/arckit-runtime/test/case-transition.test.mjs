import test from 'node:test';
import assert from 'node:assert/strict';

import { FACET_KEYS, auditCaseRecord, defaultCompletionReview, defaultFacet, validateCaseRecord } from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import { applyCaseTransitionToRecord } from '../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs';
import { selectNextRound } from '../src/loop-controller.mjs';

test('spec-first progress resolves a definition facet without pretending the Case is done', () => {
  const record = caseRecord();
  const next = applyCaseTransitionToRecord(record, transition(record, {
    facet: 'product_expectation',
    set: requiredResolved('formalized', 'Product behavior is formalized before implementation.'),
    evidence: ['arckit/spec/example/feature.md'],
  }));

  assert.equal(next.facets.product_expectation.resolution, 'resolved');
  assert.equal(next.case_resolution.status, 'unresolved');
  assert.ok(next.case_resolution.candidate_gaps.some((gap) => gap.facet === 'interaction_expectation'));
});

test('code-first progress leaves observed definition facts unreconciled and drives the next loop', () => {
  const record = caseRecord();
  const next = applyCaseTransitionToRecord(record, transition(record, {
    facet: 'implementation_state',
    set: requiredResolved('confirmed', 'Working code exists and is bound to tests.'),
    evidence: ['src/example.mjs', 'test/example.test.mjs'],
    extraFacets: [{
      facet: 'product_expectation',
      set: {
        applicability: 'required',
        maturity: 'exploratory',
        target_maturity: 'formalized',
        alignment: 'unreconciled',
        target_alignment: 'aligned',
        resolution: 'unresolved',
        reason: 'Stable behavior was observed from code but is not formalized yet.',
        next_transition: 'Formalize the observed behavior and reconcile it with implementation.'
      },
      evidence: ['src/example.mjs']
    }]
  }));

  assert.equal(next.facets.implementation_state.resolution, 'resolved');
  assert.equal(next.facets.product_expectation.alignment, 'unreconciled');
  assert.ok(next.case_resolution.candidate_gaps.some((gap) => gap.facet === 'product_expectation'));
});

test('not-required judgments need evidence and lead to completion review without creating artificial documents', () => {
  const record = caseRecord();
  for (const key of FACET_KEYS) {
    record.facets[key] = {
      ...defaultFacet(),
      applicability: 'not_required',
      resolution: 'resolved',
      reason: `${key} is outside this bounded non-UI documentation-only Case.`,
      evidence: [`case-scope:${key}`],
    };
  }
  record.facets.visual_expectation.evidence = [];
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  record.current_round = { goal: '', selected_gap: null };

  assert.equal(record.case_resolution.status, 'unresolved');
  assert.deepEqual(record.case_resolution.candidate_gaps.map((gap) => gap.facet), ['visual_expectation']);

  const next = applyCaseTransitionToRecord(record, transition(record, {
    facet: 'visual_expectation',
    set: { applicability: 'not_required', resolution: 'resolved', reason: 'The bounded change has no visual surface.' },
    evidence: ['case-scope:no-visual-surface'],
  }));
  assert.equal(next.case_resolution.status, 'unresolved');
  assert.equal(next.case_resolution.stage, 'review_ready');
  assert.equal(next.case_resolution.candidate_gaps[0].facet, 'completion_review');
});

test('a clean completion review for the current content revision resolves the Case', () => {
  const record = baseReadyCaseRecord();
  const next = applyCaseTransitionToRecord(record, reviewTransition(record, cleanReview(record)));

  assert.equal(next.completion_review.status, 'clean');
  assert.equal(next.completion_review.reviewed_content_revision, next.content_revision);
  assert.equal(next.case_resolution.status, 'resolved');
  assert.equal(next.case_resolution.stage, 'resolved');
  assert.equal(next.status, 'closed');
});

test('review findings drive repair and require another review after content revision changes', () => {
  const record = baseReadyCaseRecord();
  const reviewed = applyCaseTransitionToRecord(record, reviewTransition(record, findingsReview(record, 'CR-1')));
  assert.equal(reviewed.case_resolution.stage, 'repairing');
  assert.equal(reviewed.completion_review.cycle_count, 1);

  const reviewedRevision = reviewed.content_revision;
  const repaired = applyCaseTransitionToRecord(reviewed, findingResolutionTransition(reviewed, 'CR-1'));
  assert.equal(repaired.content_revision, reviewedRevision + 1);
  assert.equal(repaired.completion_review.status, 'pending');
  assert.equal(repaired.case_resolution.stage, 'review_ready');
  assert.notEqual(repaired.completion_review.reviewed_content_revision, repaired.content_revision);

  const clean = applyCaseTransitionToRecord(repaired, reviewTransition(repaired, cleanReview(repaired)));
  assert.equal(clean.case_resolution.status, 'resolved');
  assert.equal(clean.completion_review.cycle_count, 2);
});

test('the last authorized autonomous review with findings forces a human handoff', () => {
  const record = baseReadyCaseRecord({ maxReviewCycles: 1 });
  const next = applyCaseTransitionToRecord(record, reviewTransition(record, findingsReview(record, 'CR-LIMIT')));

  assert.equal(next.completion_review.status, 'needs_human');
  assert.equal(next.completion_review.escalation.reason, 'review_cycle_limit_reached');
  assert.equal(next.case_resolution.stage, 'needs_human');
  assert.equal(next.case_resolution.loop_handoff.status, 'needs_human');
  assert.equal(next.case_resolution.loop_handoff.next_responsibility, 'human');
  assert.equal(next.status, 'handoff');
  assert.equal(next.case_resolution.candidate_gaps[0].responsibility, 'human');
});

test('only a human gap can extend exhausted review budget without resetting prior usage', () => {
  const record = baseReadyCaseRecord({ maxReviewCycles: 1 });
  const exhausted = applyCaseTransitionToRecord(record, reviewTransition(record, findingsReview(record, 'CR-EXTEND')));
  const extended = applyCaseTransitionToRecord(exhausted, humanExtensionTransition(exhausted, 2));

  assert.equal(extended.completion_review.policy.initial_max_cycles, 1);
  assert.equal(extended.completion_review.additional_cycles_authorized, 2);
  assert.equal(extended.completion_review.cycle_count, 1);
  assert.equal(extended.case_resolution.stage, 'repairing');
  assert.equal(extended.case_resolution.candidate_gaps[0].facet, 'review_findings');
});

test('Runtime exposes all selected Case candidate gaps without imposing a facet order', () => {
  const record = caseRecord();
  const ref = 'arckit/cases/active/CASE-20260726-901-case-state.md';
  const round = selectNextRound({
    projectState: {
      case_control: { selected_case_ref: ref, next_case_intent: 'Advance this Case.' },
      state_gaps: [{ id: 'PROJECT-GAP', dimension: 'quality_validation', current_state: 'unknown', target_state: 'verified', next_transition: 'Create a validation Case.' }]
    },
    activeCases: [{ ref, record }],
    paths: { projectState: 'arckit/project/state.record.json', stateBrief: 'arckit/project/STATE.md', activeIteration: '', activeCases: [ref], casesIndex: 'arckit/cases/INDEX.md', specIndex: '', interactionIndex: '', visualIndex: '', techIndex: '' }
  });

  assert.equal(round.scope, 'case');
  assert.equal(round.case_id, record.id);
  assert.equal(round.facet, '');
  assert.equal(round.candidate_case_gaps.length, FACET_KEYS.length);
  assert.deepEqual(round.candidate_case_gaps.map((gap) => gap.facet), FACET_KEYS);
  assert.equal(round.candidate_project_gaps[0].id, 'PROJECT-GAP');
});

test('agent-actionable Case gaps take precedence over an external pending handoff', () => {
  const record = caseRecord();
  record.pending_handoffs.push({
    id: 'HANDOFF-1',
    target: 'deployment platform',
    owner: 'external',
    status: 'pending',
    resume_condition: 'Wait for deployment completion.',
    evidence: []
  });
  const audit = auditCaseRecord(record, record.updated_at);

  assert.equal(audit.loop_handoff.next_responsibility, 'agent');
  assert.equal(audit.loop_handoff.status, 'continue');
});

test('Case waits externally only when no agent or human gap remains', () => {
  const record = caseRecord();
  for (const key of FACET_KEYS) {
    record.facets[key] = {
      ...defaultFacet(),
      applicability: 'not_required',
      resolution: 'resolved',
      reason: `${key} is outside this handoff-only fixture.`,
      evidence: [`fixture:${key}`]
    };
  }
  record.pending_handoffs.push({
    id: 'HANDOFF-1',
    target: 'deployment platform',
    owner: 'external',
    status: 'pending',
    resume_condition: 'Wait for deployment completion.',
    evidence: []
  });
  const audit = auditCaseRecord(record, record.updated_at);

  assert.equal(audit.loop_handoff.next_responsibility, 'external');
  assert.equal(audit.loop_handoff.status, 'external_wait');
});

test('a human-owned question takes responsibility when the related facet is blocked', () => {
  const record = caseRecord();
  for (const key of FACET_KEYS.filter((item) => item !== 'product_expectation')) {
    record.facets[key] = {
      ...defaultFacet(),
      applicability: 'not_required',
      resolution: 'resolved',
      reason: `${key} is outside this decision-only fixture.`,
      evidence: [`fixture:${key}`]
    };
  }
  record.facets.product_expectation = {
    ...record.facets.product_expectation,
    applicability: 'required',
    resolution: 'blocked',
    reason: 'Product policy requires an explicit owner decision.'
  };
  record.open_questions.push({
    id: 'QUESTION-1',
    question: 'Which product policy should apply?',
    owner: 'human',
    status: 'open',
    evidence: []
  });
  const audit = auditCaseRecord(record, record.updated_at);

  assert.equal(audit.loop_handoff.next_responsibility, 'human');
  assert.equal(audit.loop_handoff.status, 'needs_human');
});

test('Case transition rejects a stale Case revision', () => {
  const record = caseRecord();
  const input = transition(record, {
    facet: 'product_expectation',
    set: requiredResolved('formalized', 'Product behavior is formalized.'),
    evidence: ['arckit/spec/example/feature.md']
  });
  input.case_updated_at = '2026-07-25T00:00:00.000Z';

  assert.throws(() => applyCaseTransitionToRecord(record, input), /Stale Case transition/);
});

function caseRecord({ maxReviewCycles = 3 } = {}) {
  const timestamp = '2026-07-26T00:00:00.000Z';
  const record = {
    schema_version: 'development-case-record/v3',
    id: 'CASE-20260726-901',
    title: 'Case State test',
    status: 'active',
    artifact_type: 'mixed',
    created_at: timestamp,
    updated_at: timestamp,
    user_intent: 'Test dynamic ordering.',
    expected_outcome: 'All required facts are aligned or explicitly not required.',
    project_state_ref: 'arckit/project/state.record.json',
    current_round: { goal: '', selected_gap: null },
    facets: Object.fromEntries(FACET_KEYS.map((key) => [key, defaultFacet()])),
    content_revision: 0,
    completion_review: defaultCompletionReview({ maxCycles: maxReviewCycles, source: 'test-policy', timestamp }),
    open_questions: [],
    decisions: [],
    pending_handoffs: [],
    process_notes: [],
    rounds: [],
    case_resolution: null,
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
  record.case_resolution = auditCaseRecord(record, timestamp);
  record.current_round = { goal: '', selected_gap: null };
  assert.deepEqual(validateCaseRecord(record), []);
  return record;
}

function transition(record, { facet, set, evidence, extraFacets = [], claimedStatus = 'unresolved' }) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.facet === facet);
  assert.ok(gap, `Expected ${facet} in candidate_gaps`);
  return {
    schema_version: 'arckit-case-transition/v2',
    case_id: record.id,
    case_updated_at: record.updated_at,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: `${facet} advances from evidence.` },
    accepted_state_delta: {
      facets: [{ facet, set, evidence }, ...extraFacets],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    evidence,
    unresolved: claimedStatus === 'resolved' ? [] : ['remaining Case facets'],
    round_outcome: 'completed',
    case_resolution: { claimed_status: claimedStatus, reason: claimedStatus === 'resolved' ? 'All Case facets are resolved.' : 'More Case facets remain.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}

function baseReadyCaseRecord({ maxReviewCycles = 3 } = {}) {
  const record = caseRecord({ maxReviewCycles });
  for (const key of FACET_KEYS) {
    record.facets[key] = {
      ...defaultFacet(),
      applicability: 'not_required',
      resolution: 'resolved',
      reason: `${key} is not required by this bounded fixture.`,
      evidence: [`fixture:${key}`],
    };
  }
  record.content_revision = 1;
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  assert.equal(record.case_resolution.stage, 'review_ready');
  return record;
}

function reviewTransition(record, completionReviewResult) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.facet === 'completion_review');
  assert.ok(gap, 'Expected completion_review in candidate_gaps');
  return {
    schema_version: 'arckit-case-transition/v2',
    case_id: record.id,
    case_updated_at: record.updated_at,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: 'Record a completion review result for the current content revision.' },
    accepted_state_delta: {
      facets: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: completionReviewResult,
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    evidence: completionReviewResult.evidence,
    unresolved: completionReviewResult.outcome === 'clean' ? [] : ['completion_review'],
    round_outcome: completionReviewResult.outcome === 'needs_human' ? 'needs_human' : 'completed',
    case_resolution: { claimed_status: completionReviewResult.outcome === 'clean' ? 'resolved' : 'unresolved', reason: 'Completion review result.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}

function cleanReview(record) {
  return {
    outcome: 'clean',
    reviewer: record.case_resolution.candidate_gaps[0].responsibility,
    reviewed_content_revision: record.content_revision,
    dimensions: { correctness: 'clean', completeness: 'clean', minimality: 'clean' },
    findings: [],
    evidence: ['review:correctness', 'review:completeness', 'review:minimality'],
  };
}

function findingsReview(record, id) {
  return {
    outcome: 'findings',
    reviewer: 'agent',
    reviewed_content_revision: record.content_revision,
    dimensions: { correctness: 'findings', completeness: 'clean', minimality: 'clean' },
    findings: [{
      id,
      kind: 'error',
      statement: 'The fixture contains an incorrect behavior.',
      responsibility: 'agent',
      affected_facets: ['implementation_state'],
      artifact_refs: ['src/example.mjs'],
      evidence: ['review:incorrect-behavior'],
    }],
    evidence: ['review:incorrect-behavior'],
  };
}

function findingResolutionTransition(record, id) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.id.endsWith(`:review-finding:${id}`));
  assert.ok(gap, `Expected finding ${id} in candidate_gaps`);
  return {
    schema_version: 'arckit-case-transition/v2',
    case_id: record.id,
    case_updated_at: record.updated_at,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: `Resolve ${id} and advance the content revision.` },
    accepted_state_delta: {
      facets: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [{ id, resolution: 'resolved', reason: 'The incorrect behavior was repaired.', evidence: ['fix:incorrect-behavior'] }],
      review_budget_extension: null,
    },
    evidence: ['fix:incorrect-behavior'],
    unresolved: ['completion_review'],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'A fresh completion review is required.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}

function humanExtensionTransition(record, additionalCycles) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.facet === 'completion_review' && item.responsibility === 'human');
  assert.ok(gap, 'Expected a human completion_review gap');
  return {
    schema_version: 'arckit-case-transition/v2',
    case_id: record.id,
    case_updated_at: record.updated_at,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: 'Authorize a bounded autonomous review extension.' },
    accepted_state_delta: {
      facets: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: { additional_cycles: additionalCycles, authorized_by: 'human', reason: 'Continue after human scope clarification.', evidence: ['human:review-extension'] },
    },
    evidence: ['human:review-extension'],
    unresolved: ['completion_review'],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'Human authorized more review cycles.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}

function requiredResolved(maturity, reason) {
  return {
    applicability: 'required',
    maturity,
    target_maturity: maturity,
    alignment: 'aligned',
    target_alignment: 'aligned',
    resolution: 'resolved',
    reason,
    next_transition: '',
  };
}
