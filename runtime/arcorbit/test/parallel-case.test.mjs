import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ensureArckitProject } from '../src/project-initializer.mjs';
import { runLedgerScript } from '../src/ledger-scripts.mjs';
import { createStateStore } from '../src/state-store.mjs';
import {
  auditCaseRecord,
  readCaseRecord,
  writeCaseRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import { applyCaseTransition } from '../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs';
import { applyRuntimeLedgerWriteback } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs';

test('different active Cases advance concurrently without changing Project selection state', async () => {
  const projectRoot = await projectWithCases(2);
  const initial = await createStateStore(projectRoot).readSnapshot();
  const projectRevision = initial.projectState.project.revision;
  const [first, second] = initial.activeCases;

  await Promise.all([
    applyCaseTransition({
      projectRoot,
      casePath: first.ref,
      transition: progressTransition(first.record, projectRevision, 'parallel:first', initial),
    }),
    applyCaseTransition({
      projectRoot,
      casePath: second.ref,
      transition: progressTransition(second.record, projectRevision, 'parallel:second', initial),
    }),
  ]);

  const updated = await createStateStore(projectRoot).readSnapshot();
  assert.equal(updated.projectState.project.revision, projectRevision);
  assert.equal(Object.hasOwn(updated.projectState.advancement.selection_context, 'selected_case_ref'), false);
  assert.equal(updated.activeCases.length, 2);
  assert.deepEqual(updated.activeCases.map((item) => item.record.gaps[0].status), ['resolved', 'resolved']);
});

test('parallel resolved closeouts keep one Case active and return a recoverable stale rejection', async () => {
  const projectRoot = await projectWithCases(2);
  let snapshot = await createStateStore(projectRoot).readSnapshot();
  for (const activeCase of snapshot.activeCases) makeReviewReady(projectRoot, activeCase);
  snapshot = await createStateStore(projectRoot).readSnapshot();
  const projectRevision = snapshot.projectState.project.revision;
  const [first, second] = snapshot.activeCases;
  const firstTransition = cleanReviewTransition(first.record, projectRevision, 'review:first', snapshot);
  const staleSecondTransition = cleanReviewTransition(second.record, projectRevision, 'review:second', snapshot);

  const closeoutResults = await Promise.all([
    applyRuntimeLedgerWriteback({
      projectRoot,
      runtimeResult: { case_transition: firstTransition },
      snapshot,
      gate: { allowed: true, reasons: [] },
    }),
    applyRuntimeLedgerWriteback({
      projectRoot,
      runtimeResult: { case_transition: staleSecondTransition },
      snapshot,
      gate: { allowed: true, reasons: [] },
    }),
  ]);
  assert.equal(closeoutResults.filter((result) => result.written).length, 1);
  const rejected = closeoutResults.find((result) => !result.written);
  assert.equal(rejected.rejection.recoverable, true);
  assert.equal(rejected.rejection.recovery_action, 'replan_from_fresh_state');
  assert.match(rejected.rejection.reason, /Stale (Project transition|ledger selection snapshot)/);

  snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.equal(snapshot.projectState.advancement.active_case_refs.length, 1);
  assert.equal(snapshot.activeCases.length, 1);
  assert.equal(Object.hasOwn(snapshot.projectState.advancement.selection_context, 'selected_case_ref'), false);

  const remaining = snapshot.activeCases[0];
  await applyCaseTransition({
    projectRoot,
    casePath: remaining.ref,
    transition: cleanReviewTransition(
      remaining.record,
      snapshot.projectState.project.revision,
      'review:remaining:fresh',
      snapshot,
    ),
  });
  snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.deepEqual(snapshot.projectState.advancement.active_case_refs, []);
});

async function projectWithCases(count) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'arckit-parallel-cases-'));
  await ensureArckitProject({ projectRoot, projectName: 'Parallel Case Fixture', intent: 'Exercise independent active Cases.' });
  for (let index = 0; index < count; index += 1) {
    const created = await runLedgerScript(projectRoot, [
      'development-case.mjs',
      'new',
      '--title', `Parallel Case ${index + 1}`,
      '--artifact-type', 'mixed',
      '--intent', `Advance parallel Case ${index + 1}.`,
      '--expected-outcome', `Parallel Case ${index + 1} is complete.`,
      '--initial-facts', JSON.stringify([{ id: 'FACT-INTENT', revision: 1, status: 'accepted', statement: `Parallel Case ${index + 1} is requested.`, basis: 'test fixture', evidence: [`fixture:intent:${index + 1}`] }]),
      '--initial-impacts', '[]',
      '--initial-gaps', JSON.stringify([{ id: 'GAP-WORK', status: 'open', goal: `Complete parallel Case ${index + 1}.`, reason: 'Fixture work remains.', derived_from: ['case_intent', 'FACT-INTENT'], blocked_by: [], priority_basis: { blocking: 'high', uncertainty: 'low', risk: 'low', user_impact: 'medium' }, responsibility: 'agent', evidence_required: ['fixture evidence'], resolution: null }]),
      '--max-review-cycles', '3',
      '--review-policy-source', 'test-policy',
    ]);
    const absolutePath = created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1).replaceAll('\\', '/');
    const marker = absolutePath.lastIndexOf('/arckit/cases/');
    const caseRef = absolutePath.slice(marker + 1);
    await runLedgerScript(projectRoot, [
      'project-state.mjs',
      'register-case',
      '--case-ref', caseRef,
      '--intent', 'Keep all bounded Cases available to independent Loops.',
      '--reason', 'The fixture explicitly admits multiple active Cases.',
    ]);
  }
  await runLedgerScript(projectRoot, ['development-case.mjs', 'index']);
  return projectRoot;
}

function progressTransition(record, projectRevision, evidence, snapshot) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.id === 'GAP-WORK');
  return {
    schema_version: 'arckit-case-transition/v8',
    case_id: record.id,
    case_updated_at: record.updated_at,
    project_revision: projectRevision,
    gap_selection: selectionTrace(record, gap, snapshot, 'This ledger candidate is the most important current action.'),
    selected_gap: gap,
    planned_transition: { goal: gap.goal, expected_state_change: 'Open fixture work becomes resolved.' },
    accepted_state_delta: {
      resolved_gap: { id: gap.id, status: 'resolved', outcome: 'Fixture work completed.', reason: 'The independent transition completed.', evidence: [evidence] },
      facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    project_state_delta: { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    invariant_assessment: invariantAssessment(snapshot.projectState, evidence),
    evidence: [evidence],
    unresolved: ['completion_review'],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'Completion review remains.' },
  };
}

function makeReviewReady(projectRoot, activeCase) {
  const casePath = join(projectRoot, activeCase.ref);
  const { text, record } = readCaseRecord(casePath);
  record.gaps[0].status = 'resolved';
  record.gaps[0].resolution = { status: 'resolved', outcome: 'Fixture work completed.', reason: 'Prepared for concurrent closeout.', evidence: ['fixture:ready'], occurred_at: record.updated_at };
  record.content_revision = 1;
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  record.current_round = { goal: '', selected_gap: null };
  writeCaseRecord(casePath, text, record);
}

function cleanReviewTransition(record, projectRevision, evidence, snapshot) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.id.includes(':completion-review:'));
  return {
    schema_version: 'arckit-case-transition/v8',
    case_id: record.id,
    case_updated_at: record.updated_at,
    project_revision: projectRevision,
    gap_selection: selectionTrace(record, gap, snapshot, 'Completion Review is the only remaining semantic check.'),
    selected_gap: gap,
    planned_transition: { goal: gap.goal, expected_state_change: 'Record a clean implementation-focused completion review.' },
    accepted_state_delta: {
      resolved_gap: null, facts_added: [], facts_superseded: [], impacts_added: [], impacts_updated: [], gaps_added: [], gaps_cancelled: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: {
        outcome: 'clean',
        reviewer: gap.responsibility,
        reviewed_content_revision: record.content_revision,
        dimensions: { implementation_correctness: 'clean', problem_resolution: 'clean', verification_credibility: 'clean', regression_risk: 'clean', minimality: 'clean' },
        findings: [],
        evidence: [evidence],
      },
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    project_state_delta: { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    invariant_assessment: invariantAssessment(snapshot.projectState, evidence),
    evidence: [evidence],
    unresolved: [],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'resolved', reason: 'The current content revision is clean.' },
  };
}

function invariantAssessment(project, evidence) {
  return {
    project_revision: project.project.revision,
    judgments: project.software_invariants.map((invariant) => ({
      invariant_ref: invariant.id,
      disposition: 'upheld',
      reason: 'The isolated fixture transition preserves this invariant.',
      fact_refs: [],
      evidence: [evidence],
      gap_refs: [],
    })),
  };
}

function selectionTrace(record, selected, snapshot, basis) {
  return {
    mode: 'candidate', basis, snapshot_token: snapshot.ledgerSnapshot.selection_tokens[record.id],
    selected_ref: `case-gap:${record.id}:${selected.id}`,
    comparison_summary: 'Compared every persisted candidate in the selected Case scope.',
    fresh_discovery_summary: 'No more important fresh candidate was discovered.',
    considered: (record.case_resolution?.candidate_gaps || []).map((gap) => ({
      ref: `case-gap:${record.id}:${gap.id}`, source: 'persisted', eligibility: 'ready', disposition: gap.id === selected.id ? 'selected' : 'deferred',
      priority_basis: gap.priority_basis || {}, reason: gap.id === selected.id ? 'Selected for this round.' : 'Deferred after comparison.',
    })),
  };
}
