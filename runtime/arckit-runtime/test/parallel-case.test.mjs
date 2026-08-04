import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ensureArckitProject } from '../src/project-initializer.mjs';
import { runLedgerScript } from '../src/ledger-scripts.mjs';
import { createStateStore } from '../src/state-store.mjs';
import {
  FACET_KEYS,
  auditCaseRecord,
  readCaseRecord,
  writeCaseRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import { applyCaseTransition } from '../../../entry/skills/arckit-development-ledger/scripts/case-transition.mjs';
import { applyRuntimeLedgerWriteback } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs';

test('different active Cases advance concurrently without changing Project selection state', async () => {
  const projectRoot = await projectWithCases(2);
  const initial = await createStateStore(projectRoot).readSnapshot();
  const projectRevision = initial.projectState.project.updated_at;
  const [first, second] = initial.activeCases;

  await Promise.all([
    applyCaseTransition({
      projectRoot,
      casePath: first.ref,
      transition: progressTransition(first.record, projectRevision, 'parallel:first'),
    }),
    applyCaseTransition({
      projectRoot,
      casePath: second.ref,
      transition: progressTransition(second.record, projectRevision, 'parallel:second'),
    }),
  ]);

  const updated = await createStateStore(projectRoot).readSnapshot();
  assert.equal(updated.projectState.project.updated_at, projectRevision);
  assert.equal(Object.hasOwn(updated.projectState.case_control, 'selected_case_ref'), false);
  assert.equal(updated.activeCases.length, 2);
  assert.deepEqual(
    updated.activeCases.map((item) => item.record.facets.product_expectation.resolution),
    ['resolved', 'resolved'],
  );
});

test('parallel resolved closeouts keep one Case active and return a recoverable stale rejection', async () => {
  const projectRoot = await projectWithCases(2);
  let snapshot = await createStateStore(projectRoot).readSnapshot();
  for (const activeCase of snapshot.activeCases) makeReviewReady(projectRoot, activeCase);
  snapshot = await createStateStore(projectRoot).readSnapshot();
  const projectRevision = snapshot.projectState.project.updated_at;
  const [first, second] = snapshot.activeCases;
  const firstTransition = cleanReviewTransition(first.record, projectRevision, 'review:first');
  const staleSecondTransition = cleanReviewTransition(second.record, projectRevision, 'review:second');

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
  assert.match(rejected.rejection.reason, /Stale Project aggregation/);

  snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.equal(snapshot.projectState.active_case_refs.length, 1);
  assert.equal(snapshot.activeCases.length, 1);
  assert.equal(Object.hasOwn(snapshot.projectState.case_control, 'selected_case_ref'), false);

  const remaining = snapshot.activeCases[0];
  await applyCaseTransition({
    projectRoot,
    casePath: remaining.ref,
    transition: cleanReviewTransition(
      remaining.record,
      snapshot.projectState.project.updated_at,
      'review:remaining:fresh',
    ),
  });
  snapshot = await createStateStore(projectRoot).readSnapshot();
  assert.deepEqual(snapshot.projectState.active_case_refs, []);
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

function progressTransition(record, projectUpdatedAt, evidence) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.facet === 'product_expectation');
  return {
    schema_version: 'arckit-case-transition/v3',
    case_id: record.id,
    case_updated_at: record.updated_at,
    project_updated_at: projectUpdatedAt,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: 'Resolve product expectation applicability.' },
    accepted_state_delta: {
      facets: [{
        facet: 'product_expectation',
        set: { applicability: 'not_required', resolution: 'resolved', reason: 'Not required by the parallel ledger fixture.' },
        evidence: [evidence],
      }],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    evidence: [evidence],
    unresolved: ['remaining Case facets'],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'unresolved', reason: 'Other facets remain.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}

function makeReviewReady(projectRoot, activeCase) {
  const casePath = join(projectRoot, activeCase.ref);
  const { text, record } = readCaseRecord(casePath);
  for (const facet of FACET_KEYS) {
    record.facets[facet] = {
      ...record.facets[facet],
      applicability: 'not_required',
      resolution: 'resolved',
      reason: `${facet} is outside the closeout fixture.`,
      evidence: [`fixture:${facet}`],
    };
  }
  record.content_revision = 1;
  record.case_resolution = auditCaseRecord(record, record.updated_at);
  record.current_round = { goal: '', selected_gap: null };
  writeCaseRecord(casePath, text, record);
}

function cleanReviewTransition(record, projectUpdatedAt, evidence) {
  const gap = record.case_resolution.candidate_gaps.find((item) => item.facet === 'completion_review');
  return {
    schema_version: 'arckit-case-transition/v3',
    case_id: record.id,
    case_updated_at: record.updated_at,
    project_updated_at: projectUpdatedAt,
    selected_gap: gap,
    planned_transition: { goal: gap.next_transition, expected_state_change: 'Record a clean completion review.' },
    accepted_state_delta: {
      facets: [],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: {
        outcome: 'clean',
        reviewer: gap.responsibility,
        reviewed_content_revision: record.content_revision,
        dimensions: { correctness: 'clean', completeness: 'clean', minimality: 'clean' },
        findings: [],
        evidence: [evidence],
      },
      resolved_review_findings: [],
      review_budget_extension: null,
    },
    evidence: [evidence],
    unresolved: [],
    round_outcome: 'completed',
    case_resolution: { claimed_status: 'resolved', reason: 'The current content revision is clean.' },
    project_impact_candidate: { status: 'none', changes: [], evidence: [] },
  };
}
