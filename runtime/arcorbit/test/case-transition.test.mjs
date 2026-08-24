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
import { createProjectStateRecord } from '../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs';
import { selectNextRound } from '../src/loop-controller.mjs';

test('the ledger accepts only current Case and transition schema versions', () => {
  const record = caseRecord();
  const unsupportedRecord = { ...structuredClone(record), schema_version: 'unsupported-case-state' };
  assert.match(validateCaseRecord(unsupportedRecord).join('\n'), /development-case-record\/v5/);
  assert.throws(() => auditCaseRecord(unsupportedRecord), /expected development-case-record\/v5/);

  const unsupportedTransition = { ...transition(record), schema_version: 'unsupported-case-transition' };
  assert.match(validateCaseTransition(unsupportedTransition).join('\n'), /arckit-case-transition\/v8/);
  assert.throws(() => applyCaseTransitionToRecord(unsupportedRecord, unsupportedTransition), /arckit-case-transition\/v8/);
});

test('a selected persisted gap uses canonical identity while allowing Agent-authored descriptions', () => {
  const record = caseRecord();
  const input = transition(record);
  input.selected_gap.goal = '用 Agent 自己的语言完成当前诊断。';
  input.selected_gap.reason = '这是同一个 ready gap 的语义等价说明。';
  const next = applyCaseTransitionToRecord(record, input);
  assert.equal(next.rounds[0].selected_gap.id, 'GAP-DIAGNOSE');
  assert.equal(next.rounds[0].selected_gap.goal, 'Find the root cause.');
  assert.equal(next.rounds[0].selected_gap.reason, 'The cause is unknown.');
});

test('a selected persisted gap still rejects an identity that is not currently ready', () => {
  const record = caseRecord();
  const input = transition(record);
  input.selected_gap.id = 'GAP-NOT-READY';
  input.gap_selection.selected_ref = `case-gap:${record.id}:GAP-NOT-READY`;
  input.gap_selection.considered[0].ref = input.gap_selection.selected_ref;
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

test('a diagnosis Round exposes a Tech-like judgment Gap without completing that second result', () => {
  const project = createProjectStateRecord({ name: 'Fixture', intent: 'Keep restore contracts explainable.' });
  const record = caseRecord();
  const input = transition(record, {
    facts_added: [{
      id: 'FACT-CONTRACT', revision: 1, status: 'accepted',
      statement: 'The diagnosed restore fix changes the durable recovery contract.',
      basis: 'The source path and persisted state semantics agree.', evidence: ['debug/root-cause.md'],
    }],
    gaps_added: [{
      id: 'GAP-TECH-CONTRACT', status: 'open', goal: 'Decide and record the changed recovery contract.',
      reason: 'The diagnosis established a stable technical-contract question that is not part of the root-cause claim.',
      derived_from: ['FACT-CONTRACT'], blocked_by: [],
      priority_basis: { blocking: 'high', uncertainty: 'medium', risk: 'high', user_impact: 'medium' },
      responsibility: 'agent', evidence_required: ['Durable technical decision evidence.'], resolution: null,
    }],
  });
  input.invariant_assessment = assessmentFor(project, {
    'technical-decisions-remain-explainable': {
      disposition: 'threatened', reason: 'The newly accepted contract fact still needs an explicit technical result.',
      fact_refs: ['FACT-CONTRACT'], evidence: [], gap_refs: ['GAP-TECH-CONTRACT'],
    },
  });

  const next = applyCaseTransitionToRecord(record, input, { projectState: project });
  assert.equal(next.rounds.length, 1);
  assert.equal(next.rounds[0].selected_gap.id, 'GAP-DIAGNOSE');
  assert.equal(next.gaps.find((gap) => gap.id === 'GAP-TECH-CONTRACT').status, 'open');
  assert.deepEqual(next.case_resolution.candidate_gaps.map((gap) => gap.id), ['GAP-TECH-CONTRACT']);
});

test('trusted invariant assessment rejects missing, duplicate and stale coverage', () => {
  const project = createProjectStateRecord({ name: 'Fixture', intent: 'Validate invariant coverage.' });
  const record = caseRecord();
  const valid = transition(record);
  valid.invariant_assessment = assessmentFor(project);

  const missing = structuredClone(valid);
  missing.invariant_assessment.judgments.pop();
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), missing, { projectState: project }), /cover the current Project invariant catalog exactly/);

  const duplicate = structuredClone(valid);
  duplicate.invariant_assessment.judgments.push(structuredClone(duplicate.invariant_assessment.judgments[0]));
  assert.match(validateCaseTransition(duplicate).join('\n'), /duplicated/);

  const stale = structuredClone(valid);
  stale.invariant_assessment.project_revision += 1;
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), stale, { projectState: project }), /current Project revision/);
});

test('persisted v8 assessment corruption fails closed before Completion Review', () => {
  const project = createProjectStateRecord({ name: 'Fixture', intent: 'Fail closed on corrupted assessment history.' });
  const record = caseRecord();
  const input = transition(record);
  input.invariant_assessment = assessmentFor(project);
  const applied = applyCaseTransitionToRecord(record, input, { projectState: project });
  assert.match(applied.case_resolution.candidate_gaps[0].id, /completion-review/);

  const empty = structuredClone(applied);
  empty.rounds.at(-1).invariant_assessment.judgments = [];
  empty.case_resolution = auditCaseRecord(empty, empty.updated_at);
  assert.equal(empty.case_resolution.candidate_gaps.some((gap) => gap.id.includes(':completion-review:')), false);
  assert.match(validateCaseRecord(empty).join('\n'), /invariant_assessment is invalid/);

  const invalidDisposition = structuredClone(applied);
  const upheld = invalidDisposition.rounds.at(-1).invariant_assessment.judgments[0];
  upheld.disposition = 'upheld';
  upheld.evidence = [];
  invalidDisposition.case_resolution = auditCaseRecord(invalidDisposition, invalidDisposition.updated_at);
  assert.match(validateCaseRecord(invalidDisposition).join('\n'), /invalid judgment/);
});

test('later facts can reopen an invariant judgment that an earlier Round upheld', () => {
  const project = createProjectStateRecord({ name: 'Fixture', intent: 'Reassess contracts after every fact change.' });
  let record = caseRecord();
  const first = transition(record);
  first.invariant_assessment = assessmentFor(project, {
    'technical-decisions-remain-explainable': {
      disposition: 'upheld', reason: 'The first diagnosis is fully explained by durable evidence.',
      fact_refs: ['FACT-BUG'], evidence: ['debug/root-cause.md'], gap_refs: [],
    },
  });
  record = applyCaseTransitionToRecord(record, first, { projectState: project });

  const fresh = {
    id: 'GAP-FRESH-CONTRACT-DISCOVERY', goal: 'Establish whether a later trace changes the recovery contract.',
    reason: 'A fresh trace exposed a distinct bounded uncertainty before completion review.',
    derived_from: ['FACT-BUG', 'trace:later-contract'], blocked_by: ['GAP-DIAGNOSE'],
    priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'high', user_impact: 'medium' },
    responsibility: 'agent', evidence_required: ['Focused trace evidence.'],
  };
  const second = baseTransition(record, fresh, 'fresh');
  second.accepted_state_delta.resolved_gap = resolution(fresh.id, 'The later trace establishes a changed contract.');
  second.accepted_state_delta.facts_added = [{
    id: 'FACT-LATER-CONTRACT', revision: 1, status: 'accepted', statement: 'The later trace changes the recovery contract.',
    basis: 'Focused trace evidence.', evidence: ['trace:later-contract'],
  }];
  second.accepted_state_delta.gaps_added = [{
    id: 'GAP-TECH-REOPENED', status: 'open', goal: 'Update the durable technical recovery contract.',
    reason: 'The later accepted fact invalidates the prior upheld judgment.', derived_from: ['FACT-LATER-CONTRACT'], blocked_by: [],
    priority_basis: { blocking: 'high', uncertainty: 'low', risk: 'high', user_impact: 'medium' }, responsibility: 'agent',
    evidence_required: ['Updated durable technical decision.'], resolution: null,
  }];
  second.invariant_assessment = assessmentFor(project, {
    'technical-decisions-remain-explainable': {
      disposition: 'threatened', reason: 'The later fact reopens the previously upheld contract judgment.',
      fact_refs: ['FACT-LATER-CONTRACT'], evidence: [], gap_refs: ['GAP-TECH-REOPENED'],
    },
  });
  second.evidence = ['trace:later-contract'];
  record = applyCaseTransitionToRecord(record, second, { projectState: project });

  assert.equal(record.rounds.at(-2).invariant_assessment.judgments.find((item) => item.invariant_ref === 'technical-decisions-remain-explainable').disposition, 'upheld');
  assert.equal(record.rounds.at(-1).invariant_assessment.judgments.find((item) => item.invariant_ref === 'technical-decisions-remain-explainable').disposition, 'threatened');
  assert.deepEqual(record.case_resolution.candidate_gaps.map((gap) => gap.id), ['GAP-TECH-REOPENED']);
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

  const repeatedIdReview = baseTransition(structuredClone(repaired), repaired.case_resolution.candidate_gaps[0]);
  repeatedIdReview.accepted_state_delta.completion_review_result = {
    outcome: 'findings', reviewer: 'agent', reviewed_content_revision: repaired.content_revision,
    dimensions: reviewDimensions('findings'),
    findings: [{
      id: 'CR-1', kind: 'error', statement: 'A different defect must not reuse a prior finding identity.', responsibility: 'agent',
      artifact_refs: ['src/restore.mjs'], evidence: ['test:second-review-collision'],
    }],
    evidence: ['test:second-review-collision'],
  };
  assert.throws(
    () => applyCaseTransitionToRecord(structuredClone(repaired), repeatedIdReview),
    /Completion review finding id already exists: CR-1/,
  );

  const secondReview = structuredClone(repeatedIdReview);
  secondReview.accepted_state_delta.completion_review_result.findings[0].id = 'CR-2';
  const rereviewed = applyCaseTransitionToRecord(repaired, secondReview);
  assert.equal(rereviewed.gaps.filter((gap) => gap.id.includes(':review-finding:')).length, 2);
  assert.match(rereviewed.case_resolution.candidate_gaps[0].id, /review-finding:CR-2$/);
});

test('a human review-budget decision reopens autonomous review without resetting prior cycles', () => {
  let record = caseRecord({ maxReviewCycles: 1 });
  record = applyCaseTransitionToRecord(record, transition(record));

  const firstReview = baseTransition(record, record.case_resolution.candidate_gaps[0]);
  firstReview.accepted_state_delta.completion_review_result = {
    outcome: 'findings', reviewer: 'agent', reviewed_content_revision: record.content_revision,
    dimensions: reviewDimensions('findings'),
    findings: [{
      id: 'CR-BUDGET', kind: 'omission', statement: 'One bounded case is still uncovered.', responsibility: 'agent',
      artifact_refs: ['src/restore.mjs'], evidence: ['test:missing-budget-case'],
    }],
    evidence: ['test:missing-budget-case'],
  };
  record = applyCaseTransitionToRecord(record, firstReview);

  const repairGap = record.case_resolution.candidate_gaps[0];
  const repair = baseTransition(record, repairGap);
  repair.accepted_state_delta.resolved_gap = resolution(repairGap.id, 'The missing budget case is now covered.');
  repair.accepted_state_delta.resolved_review_findings = [{
    id: 'CR-BUDGET', resolution: 'resolved', reason: 'Focused regression evidence passes.', evidence: ['test:budget-case-pass'],
  }];
  repair.evidence = ['test:budget-case-pass'];
  record = applyCaseTransitionToRecord(record, repair);
  assert.equal(record.case_resolution.candidate_gaps[0].responsibility, 'human');

  const humanDecision = baseTransition(record, record.case_resolution.candidate_gaps[0]);
  humanDecision.accepted_state_delta.review_budget_extension = {
    additional_cycles: 2,
    authorized_by: 'human',
    reason: 'Allow two bounded autonomous review cycles.',
    evidence: ['human-decision:allow-two-review-cycles'],
  };
  humanDecision.evidence = ['human-decision:allow-two-review-cycles'];
  record = applyCaseTransitionToRecord(record, humanDecision);

  assert.equal(record.completion_review.cycle_count, 1);
  assert.equal(record.completion_review.additional_cycles_authorized, 2);
  assert.equal(record.completion_review.human_authorizations.length, 1);
  assert.equal(record.completion_review.human_authorizations[0].effective_max_cycles, 3);
  assert.equal(record.completion_review.escalation, null);
  assert.equal(record.case_resolution.stage, 'review_ready');
  assert.equal(record.case_resolution.candidate_gaps[0].responsibility, 'agent');
  assert.deepEqual(validateCaseRecord(record), []);

  const finalReview = baseTransition(record, record.case_resolution.candidate_gaps[0]);
  finalReview.accepted_state_delta.completion_review_result = {
    outcome: 'clean', reviewer: 'agent', reviewed_content_revision: record.content_revision,
    dimensions: reviewDimensions('clean'), findings: [], evidence: ['test:final-review-clean'],
  };
  finalReview.case_resolution = { claimed_status: 'resolved', reason: 'The authorized final review is clean.' };
  finalReview.unresolved = [];
  const closed = applyCaseTransitionToRecord(record, finalReview);
  assert.equal(closed.completion_review.cycle_count, 2);
  assert.equal(closed.case_resolution.status, 'resolved');
});

test('review-budget extensions reject malformed or non-human decisions', () => {
  let record = caseRecord();
  const ordinary = transition(record);
  ordinary.accepted_state_delta.review_budget_extension = {
    additional_cycles: 1, authorized_by: 'human', reason: 'Not at a human decision.', evidence: ['human-decision:invalid-scope'],
  };
  assert.throws(() => applyCaseTransitionToRecord(record, ordinary), /current human completion-review decision/);

  const malformed = transition(record);
  malformed.accepted_state_delta.review_budget_extension = {
    additional_cycles: 0, authorized_by: 'agent', reason: '', evidence: [],
  };
  assert.match(validateCaseTransition(malformed).join('\n'), /additional_cycles must be a positive integer/);
  assert.match(validateCaseTransition(malformed).join('\n'), /authorized_by must be human/);
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

function caseRecord({ maxReviewCycles = 3 } = {}) {
  return createDefaultCaseRecord({
    title: 'Restore ordering', artifactType: 'code', intent: 'Fix stale restore behavior', expectedOutcome: 'Newer data is preserved',
    maxReviewCycles, reviewPolicySource: 'test-policy',
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
    schema_version: 'arckit-case-transition/v8', case_id: record.id, case_updated_at: record.updated_at,
    project_revision: 0, gap_selection: selectionTrace(record, selected, mode), selected_gap: structuredClone(selected),
    planned_transition: { goal: selected.goal, expected_state_change: 'Advance the selected dynamic gap.' },
    accepted_state_delta: {
      resolved_gap: null, facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [],
      resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null,
    },
    project_state_delta: { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    invariant_assessment: assessmentFor(createProjectStateRecord({ name: 'Fixture', intent: 'Validate a bounded transition.' })),
    evidence: ['debug/root-cause.md'], unresolved: ['completion_review'], round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'More Case work remains.' },
  };
}

function selectionTrace(record, selected, mode) {
  const persisted = (record.case_resolution?.candidate_gaps || []).map((gap) => ({
    ref: `case-gap:${record.id}:${gap.id}`, source: 'persisted', eligibility: 'ready',
    disposition: mode === 'candidate' && gap.id === selected.id ? 'selected' : 'deferred',
    priority_basis: gap.priority_basis || {}, reason: gap.id === selected.id && mode === 'candidate' ? 'Selected for this bounded round.' : 'A different current action has higher priority.',
  }));
  if (mode === 'fresh') persisted.push({ ref: `fresh-gap:${record.id}:${selected.id}`, source: 'fresh', eligibility: 'ready', disposition: 'selected', priority_basis: selected.priority_basis || {}, reason: 'Current-turn evidence makes this fresh gap most important.' });
  return {
    mode, basis: mode === 'fresh' ? 'Current evidence makes this new gap the most important current action.' : 'This ledger candidate is the most important current action.',
    snapshot_token: 'fixture-selection-token', selected_ref: mode === 'fresh' ? `fresh-gap:${record.id}:${selected.id}` : `case-gap:${record.id}:${selected.id}`,
    comparison_summary: 'Compared every persisted ready candidate with fresh work exposed by current evidence.',
    fresh_discovery_summary: mode === 'fresh' ? 'One necessary fresh candidate was discovered.' : 'No more important fresh candidate was discovered.', considered: persisted,
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

function assessmentFor(project, overrides = {}) {
  return {
    project_revision: project.project.revision,
    judgments: project.software_invariants.map((invariant) => ({
      invariant_ref: invariant.id,
      disposition: 'not_relevant',
      reason: 'Current accepted facts do not materially involve this invariant.',
      fact_refs: [],
      evidence: [],
      gap_refs: [],
      ...(overrides[invariant.id] || {}),
    })),
  };
}
