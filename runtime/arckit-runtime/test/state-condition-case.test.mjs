import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  auditCaseRecord,
  createDefaultCaseRecord,
  validateCaseRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import {
  applyCaseTransition,
  applyCaseTransitionToRecord,
  validateCaseTransition,
} from '../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs';
import { createProjectStateRecord } from '../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs';
import { validateCaseControlHandoff } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs';
import { createControllerContextDigest } from '../src/agent-orchestrator.mjs';

test('new bug Case starts from facts and one diagnosis gap without facet ceremony', () => {
  const record = bugCase();
  assert.equal(record.schema_version, 'development-case-record/v5');
  assert.equal(Object.hasOwn(record, 'facets'), false);
  assert.equal(Object.hasOwn(record.case_resolution, 'base_ready'), false);
  assert.deepEqual(record.case_resolution.candidate_gaps.map((gap) => gap.id), ['GAP-DIAGNOSE']);
});

test('closing the last gap for a threatened invariant requires the impact to be reconciled', () => {
  const record = bugCase({ threatened: true });
  const staleImpact = transition(record, { resolved_gap: resolution('GAP-DIAGNOSE') });
  assert.throws(() => applyCaseTransitionToRecord(structuredClone(record), staleImpact), /must bind at least one open gap/);

  const reconciled = transition(record, {
    resolved_gap: resolution('GAP-DIAGNOSE'),
    impacts_updated: [{
      id: 'IMPACT-ARCH', fact_id: 'FACT-BUG', fact_revision: 1,
      target: { kind: 'software_invariant', ref: 'changed-contracts-remain-explainable', revision: null },
      effect: 'upheld', reason: 'The diagnosis identified the exact recovery contract boundary.',
      gap_ids: [], evidence: ['debug/root-cause.md'],
    }],
  });
  const next = applyCaseTransitionToRecord(structuredClone(record), reconciled);
  assert.equal(next.state_impacts[0].effect, 'upheld');
  assert.equal(next.case_resolution.stage, 'review_ready');
});

test('completion review stays implementation-focused and resolves the current revision', () => {
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

test('Runtime digest exposes the explicit software checklist, invariants and Case facts', () => {
  const record = bugCase();
  const projectState = createProjectStateRecord({ name: 'Fixture', intent: 'Fix restore behavior.' });
  const digest = createControllerContextDigest({
    snapshot: {
      projectState,
      activeCases: [{ ref: 'arckit/cases/active/fixture.md', record }],
      paths: { projectState: 'arckit/project/state.record.json', activeIteration: '' }, summary: {},
    },
    loopFrame: { project_revision: 0, case_id: '' },
  });
  assert.equal(digest.project.software_definition.length, 15);
  assert.equal(digest.project.software_definition[0].id, 'product_intent_and_scope');
  assert.equal(digest.project.software_invariants.some((item) => item.id === 'accepted-facts-are-realized'), true);
  assert.equal(digest.active_cases[0].facts[0].id, 'FACT-BUG');
  assert.equal(Object.hasOwn(digest.active_cases[0], 'facets'), false);
});

test('Case control binds numeric Project revision and requires semantic initial gaps', () => {
  const valid = {
    schema_version: 'arckit-case-control-handoff/v1', action: 'create_case', expected_project_revision: 2, case_id: '',
    title: 'Diagnose restore bug', intent: 'Fix restore bug', expected_outcome: 'Restore keeps newest data', artifact_type: 'code',
    selection_reason: 'No active Case covers the bug.', initial_facts: bugCase().facts, initial_impacts: [], initial_gaps: bugCase().gaps,
    review_policy: { max_autonomous_cycles: 3, source: 'test-policy' },
  };
  assert.deepEqual(validateCaseControlHandoff(valid), []);
  assert.match(validateCaseControlHandoff({ ...valid, initial_gaps: [] }).join('\n'), /initial_gap/);
});

test('Case transition cannot rewrite a protocol-defined core software invariant', () => {
  const record = bugCase();
  const result = baseTransition(record, record.case_resolution.candidate_gaps[0]);
  result.project_state_delta.software_invariant_changes = [{
    action: 'update',
    invariant: {
      id: 'changed-contracts-remain-explainable', applies_when: 'Qt changes.',
      must_hold: 'Qt code follows a project-specific rule.', evidence_expectation: 'Qt code.', priority: 'required',
    },
    reason: 'Attempt to replace an abstract invariant with a concrete project rule.', evidence: ['debug/root-cause.md'],
  }];
  result.project_state_delta.evidence = ['debug/root-cause.md'];
  assert.match(validateCaseTransition(result).join('\n'), /cannot change a protocol-defined core software invariant/);
});

test('an accepted Gap transition updates its Project decision immediately before Case review', async () => {
  const root = await mkdtemp(join(tmpdir(), 'arckit-project-delta-'));
  const caseRef = 'arckit/cases/active/CASE-20260810-001-define-foundation.md';
  try {
    await mkdir(join(root, 'arckit/project'), { recursive: true });
    await mkdir(join(root, 'arckit/cases/active'), { recursive: true });
    const project = createProjectStateRecord({ name: 'Fixture', intent: 'Define the software.' });
    project.advancement.active_case_refs = [caseRef];
    project.advancement.project_gaps = [{
      id: 'GAP-PROJECT-DECISION', goal: 'Settle the technical foundation.', reason: 'The stack is undecided.',
      affects: [{ kind: 'software_decision', ref: 'technical_foundation' }],
      priority_basis: { blocking: 'high' }, dependencies: [], candidate_case_ref: caseRef,
    }];
    project.software_definition.decision_areas.find((area) => area.id === 'technical_foundation').gap_refs = ['GAP-PROJECT-DECISION'];
    await writeFile(join(root, 'arckit/project/state.record.json'), `${JSON.stringify(project, null, 2)}\n`);

    const record = createDefaultCaseRecord({
      title: 'Define foundation', artifactType: 'document', intent: 'Settle stack', expectedOutcome: 'Technical foundation is explicit',
      maxReviewCycles: 3, reviewPolicySource: 'test-policy',
      initialFacts: [{ id: 'FACT-STACK', revision: 1, status: 'accepted', statement: 'The repository runs on Node.js.', basis: 'Package and source evidence.', evidence: ['package.json'] }],
      initialImpacts: [],
      initialGaps: [{ id: 'GAP-DEFINE', status: 'open', goal: 'Settle the technical foundation.', reason: 'The decision is open.', derived_from: ['FACT-STACK'], blocked_by: [], priority_basis: { blocking: 'high' }, responsibility: 'agent', evidence_required: ['package.json'], resolution: null }],
    });
    record.id = 'CASE-20260810-001';
    const caseFile = join(root, caseRef);
    await writeFile(caseFile, `# Define foundation\n\nStatus: active\nArtifact Type: document\nSelected Gap: none\nUpdated: ${record.updated_at}\n\n## Structured Record\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`);

    const input = transition(record, { resolved_gap: resolution('GAP-DEFINE') });
    input.project_state_delta = {
      software_definition_changes: [{
        area_ref: 'technical_foundation', observed_revision: 0,
        set_decision: { status: 'settled', statement: 'Use Node.js ES modules.', reason: 'Package and source evidence agree.', evidence: ['package.json'], confidence: 'high', resume_condition: '' },
        gap_refs: [], reason: 'The selected Gap settled the stack.', evidence: ['package.json'],
      }],
      software_invariant_changes: [],
      project_gap_changes: [{ action: 'resolve', gap: null, gap_id: 'GAP-PROJECT-DECISION', reason: 'The decision is settled.', evidence: ['package.json'] }],
      selection_context_change: null,
      evidence: ['package.json'],
    };
    const applied = await applyCaseTransition({ projectRoot: root, casePath: caseRef, transition: input });
    const nextProject = JSON.parse(await readFile(join(root, 'arckit/project/state.record.json'), 'utf8'));
    const nextDecision = nextProject.software_definition.decision_areas.find((area) => area.id === 'technical_foundation').decision;
    assert.equal(applied.case_resolution.stage, 'review_ready');
    assert.equal(nextDecision.status, 'settled');
    assert.equal(nextDecision.revision, 1);
    assert.equal(nextProject.advancement.project_gaps.some((gap) => gap.id === 'GAP-PROJECT-DECISION'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function bugCase({ threatened = false } = {}) {
  return createDefaultCaseRecord({
    title: 'Diagnose restore bug', artifactType: 'code', intent: 'Fix restore bug', expectedOutcome: 'Restore keeps newest data',
    maxReviewCycles: 3, reviewPolicySource: 'test-policy',
    initialFacts: [{ id: 'FACT-BUG', revision: 1, status: 'accepted', statement: 'Restoring can overwrite newer data.', basis: 'User report and reproduction.', evidence: ['debug/reproduction.md'] }],
    initialImpacts: threatened ? [{
      id: 'IMPACT-ARCH', fact_id: 'FACT-BUG', fact_revision: 1,
      target: { kind: 'software_invariant', ref: 'changed-contracts-remain-explainable', revision: null },
      effect: 'threatened', reason: 'The recovery contract is not yet understood.', gap_ids: ['GAP-DIAGNOSE'], evidence: [],
    }] : [],
    initialGaps: [{ id: 'GAP-DIAGNOSE', status: 'open', goal: 'Find the root cause.', reason: 'The root cause is unknown and blocks a safe fix.', derived_from: ['case_intent', 'FACT-BUG'], blocked_by: [], priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'high', user_impact: 'high' }, responsibility: 'agent', evidence_required: ['Reproduction and code-path evidence.'], resolution: null }],
  });
}

function resolution(id) {
  return { id, status: 'resolved', outcome: 'Root cause identified.', reason: 'Trace and code evidence agree.', evidence: ['debug/root-cause.md'] };
}

function transition(record, overrides = {}) {
  const result = baseTransition(record, record.case_resolution.candidate_gaps[0]);
  result.accepted_state_delta = { ...result.accepted_state_delta, ...overrides };
  assert.deepEqual(validateCaseTransition(result), []);
  return result;
}

function baseTransition(record, selected) {
  return {
    schema_version: 'arckit-case-transition/v5', case_id: record.id, case_updated_at: record.updated_at, project_revision: 0, selected_gap: structuredClone(selected),
    planned_transition: { goal: selected.goal, expected_state_change: 'Advance the selected dynamic gap.' },
    accepted_state_delta: { resolved_gap: null, facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null },
    project_state_delta: { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    evidence: ['debug/root-cause.md'], unresolved: ['completion_review'], round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'More Case work remains.' },
  };
}
