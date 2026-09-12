import assert from 'node:assert/strict';
import test from 'node:test';

import { createStateStore } from '../src/state-store.mjs';
import { projectWithCases, progressTransition, cleanReviewTransition, makeReviewReady } from './helpers/ledger-cases.mjs';
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
