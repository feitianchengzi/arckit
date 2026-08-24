import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ensureArckitProject } from '../src/project-initializer.mjs';
import { runLedgerScript } from '../src/ledger-scripts.mjs';
import { readLedgerSnapshot } from '../../../entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs';
import { materializeSemanticCaseCommand, SemanticCommandError, validateSemanticCaseCommand } from '../../../entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs';
import { applyRuntimeLedgerWriteback, rejectionPolicy } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs';

test('Semantic Case Command materializes identities, revisions and reverse relations without reading prose', async () => {
  const projectRoot = await fixtureProject();
  const snapshot = readLedgerSnapshot(projectRoot);
  const active = snapshot.canonical.active_cases[0];
  const command = semanticCommand(snapshot, active.record);
  const paraphrased = structuredClone(command);
  paraphrased.claim.facts_added[0].statement = 'Completely different prose with the same explicit typed relations.';
  paraphrased.claim.facts_added[0].basis = 'The materializer must not branch on these words.';

  const first = materializeSemanticCaseCommand({ command, snapshot });
  const second = materializeSemanticCaseCommand({ command: paraphrased, snapshot });
  assert.deepEqual(first.canonical_id_mapping, second.canonical_id_mapping);
  assert.equal(first.transition.case_updated_at, active.record.updated_at);
  assert.equal(first.transition.project_revision, snapshot.project_revision);
  assert.equal(first.transition.selected_gap.id, 'GAP-WORK');
  assert.equal(first.transition.accepted_state_delta.facts_added[0].revision, 1);
  assert.equal(first.transition.project_state_delta.software_definition_changes[0].observed_revision, 0);
  assert.equal(first.transition.accepted_state_delta.impacts_added[0].target.revision, 1);

  const result = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: command },
    snapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(result.written, true);
  assert.equal(result.command_receipt.status, 'accepted');
  assert.deepEqual(result.command_receipt.canonical_id_mapping, first.canonical_id_mapping);

  const fresh = readLedgerSnapshot(projectRoot, { afterCommitToken: result.post_commit_snapshot_token });
  const nextCase = fresh.canonical.active_cases.find((item) => item.record.id === active.record.id).record;
  const nextProject = fresh.canonical.project_state;
  const factId = first.canonical_id_mapping['local:fact:result'];
  const gapId = first.canonical_id_mapping['local:gap:followup'];
  const projectGapId = first.canonical_id_mapping['local:project-gap:runtime-boundary'];
  assert.equal(nextCase.facts.find((item) => item.id === factId).statement, command.claim.facts_added[0].statement);
  assert.equal(nextCase.gaps.find((item) => item.id === gapId).derived_from.includes(factId), true);
  assert.equal(nextCase.state_impacts[0].target.revision, 1);
  assert.equal(nextProject.software_definition.decision_areas.find((item) => item.id === 'technical_foundation').gap_refs.includes(projectGapId), true);
});

test('Semantic Case Command reports claim and freshness rejections without mixing repair responsibility', async () => {
  const projectRoot = await fixtureProject();
  const snapshot = readLedgerSnapshot(projectRoot);
  const active = snapshot.canonical.active_cases[0];
  const invalid = semanticCommand(snapshot, active.record);
  invalid.claim.impacts_added[0].target_ref = 'project:decision:missing-area';
  invalid.claim.gaps_added[0].derived_from = ['case:fact:missing-fact'];
  assert.throws(
    () => materializeSemanticCaseCommand({ command: invalid, snapshot }),
    (error) => error instanceof SemanticCommandError
      && error.kind === 'claim_invalid'
      && error.issues.some((issue) => issue.path.includes('target_ref'))
      && error.issues.some((issue) => issue.path.includes('derived_from'))
  );

  const stale = semanticCommand(snapshot, active.record);
  stale.selection.snapshot_token = 'stale-token';
  const result = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: stale },
    snapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(result.rejection.kind, 'snapshot_stale');
  assert.equal(result.rejection.counts_toward_agent_repair, false);
  assert.equal(result.rejection.recovery_action, 'replan_from_fresh_state');
});

test('Ledger rejection taxonomy assigns repair only to claim_invalid', () => {
  const policies = Object.fromEntries([
    'claim_invalid', 'snapshot_stale', 'protocol_incompatible', 'materialization_failed', 'infrastructure_failed',
  ].map((kind) => [kind, rejectionPolicy(kind)]));
  assert.equal(policies.claim_invalid.counts_toward_agent_repair, true);
  for (const kind of Object.keys(policies).filter((item) => item !== 'claim_invalid')) {
    assert.equal(policies[kind].counts_toward_agent_repair, false, kind);
  }
  assert.equal(policies.protocol_incompatible.recovery_action, 'trusted_protocol_reconciliation');
  assert.equal(policies.materialization_failed.responsibility, 'ledger');
  assert.equal(policies.infrastructure_failed.responsibility, 'runtime');
});

test('Semantic Completion Review uses the Agent-facing review contract', async () => {
  const projectRoot = await fixtureProject();
  const snapshot = readLedgerSnapshot(projectRoot);
  const active = snapshot.canonical.active_cases[0];
  const command = semanticCommand(snapshot, active.record);
  command.claim.completion_review_result = {
    outcome: 'clean',
    reviewer: 'agent',
    dimensions: {
      implementation_correctness: 'clean', problem_resolution: 'clean', verification_credibility: 'clean',
      regression_risk: 'clean', minimality: 'clean',
    },
    findings: [],
    evidence: ['fixture:review'],
  };
  assert.deepEqual(validateSemanticCaseCommand(command), []);
});

test('Semantic materialization allocates a new finding identity across Completion Review cycles', async () => {
  const projectRoot = await fixtureProject();
  const snapshot = readLedgerSnapshot(projectRoot);
  const active = snapshot.canonical.active_cases[0];
  const caseKey = active.record.id.replace(/^CASE-/, '');
  const priorFindingId = `FINDING-${caseKey}-001`;
  active.record.completion_review.cycles.push({
    cycle: 1, autonomous_cycle: 1, reviewer: 'agent', outcome: 'findings', content_revision: 1,
    dimensions: {
      implementation_correctness: 'findings', problem_resolution: 'findings', verification_credibility: 'findings',
      regression_risk: 'findings', minimality: 'clean',
    },
    finding_ids: [priorFindingId], evidence: ['fixture:first-review'], occurred_at: '2026-08-24T00:00:00.000Z',
  });
  active.record.gaps.push({
    id: `${active.record.id}:review-finding:${priorFindingId}`, status: 'resolved',
    goal: 'Resolve the first finding.', reason: 'The first review found an error.',
    derived_from: ['completion_review', 'content_revision:1'], blocked_by: [],
    priority_basis: { blocking: 'high', risk: 'high' }, responsibility: 'agent',
    evidence_required: ['fixture:first-review'],
    resolution: { id: `${active.record.id}:review-finding:${priorFindingId}`, status: 'resolved', outcome: 'Fixed.', reason: 'Verified.', evidence: ['fixture:first-fix'], occurred_at: '2026-08-24T00:01:00.000Z' },
  });
  const command = semanticCommand(snapshot, active.record);
  command.claim.completion_review_result = {
    outcome: 'findings', reviewer: 'agent',
    dimensions: {
      implementation_correctness: 'findings', problem_resolution: 'findings', verification_credibility: 'findings',
      regression_risk: 'findings', minimality: 'clean',
    },
    findings: [{
      ref: 'local:review-finding:second-defect', kind: 'error', statement: 'A distinct second defect exists.',
      responsibility: 'agent', artifact_refs: ['fixture:source'], evidence: ['fixture:second-review'],
    }],
    evidence: ['fixture:second-review'],
  };

  const materialized = materializeSemanticCaseCommand({ command, snapshot });
  assert.equal(materialized.canonical_id_mapping['local:review-finding:second-defect'], `FINDING-${caseKey}-002`);
  assert.equal(materialized.transition.accepted_state_delta.completion_review_result.findings[0].id, `FINDING-${caseKey}-002`);
});

async function fixtureProject() {
  const projectRoot = await mkdtemp(join(tmpdir(), 'arckit-semantic-command-'));
  await ensureArckitProject({ projectRoot, projectName: 'Semantic Command Fixture', intent: 'Exercise deterministic materialization.' });
  const created = await runLedgerScript(projectRoot, [
    'development-case.mjs', 'new',
    '--title', 'Materialize semantic command', '--artifact-type', 'mixed',
    '--intent', 'Keep semantic reasoning Agent-owned.', '--expected-outcome', 'Ledger materializes only explicit relations.',
    '--initial-facts', JSON.stringify([{ id: 'FACT-INTENT', revision: 1, status: 'accepted', statement: 'Semantic materialization is requested.', basis: 'Fixture intent.', evidence: ['fixture:intent'] }]),
    '--initial-impacts', '[]',
    '--initial-gaps', JSON.stringify([{ id: 'GAP-WORK', status: 'open', goal: 'Complete the semantic command fixture.', reason: 'Fixture work remains.', derived_from: ['FACT-INTENT'], blocked_by: [], priority_basis: priority(), responsibility: 'agent', evidence_required: ['fixture:evidence'], resolution: null }]),
    '--max-review-cycles', '3', '--review-policy-source', 'test-policy',
  ]);
  const absolutePath = created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1).replaceAll('\\', '/');
  const caseRef = absolutePath.slice(absolutePath.lastIndexOf('/arckit/cases/') + 1);
  await runLedgerScript(projectRoot, ['project-state.mjs', 'register-case', '--case-ref', caseRef, '--intent', 'Register fixture Case.', '--reason', 'The fixture needs one active Case.']);
  await runLedgerScript(projectRoot, ['development-case.mjs', 'index']);
  return projectRoot;
}

function semanticCommand(snapshot, record) {
  const selectedRef = `case-gap:${record.id}:GAP-WORK`;
  const decision = {
    status: 'settled', statement: 'Use explicit semantic commands and deterministic materialization.',
    reason: 'The responsibility boundary is explicit.', evidence: ['fixture:architecture'], confidence: 'high', resume_condition: 'Revisit when the boundary changes.',
  };
  const judgments = snapshot.canonical.project_state.software_invariants.map((invariant) => {
    if (invariant.id === 'accepted-facts-are-realized' || invariant.id === 'material-risks-have-credible-evidence') return {
      invariant_ref: `project:invariant:${invariant.id}`, disposition: 'threatened', reason: 'The follow-up remains explicitly open.',
      fact_refs: ['local:fact:result'], evidence: ['fixture:evidence'], gap_refs: ['local:gap:followup'],
    };
    if (invariant.id === 'technical-decisions-remain-explainable') return {
      invariant_ref: `project:invariant:${invariant.id}`, disposition: 'upheld', reason: 'The technical boundary is explicit.',
      fact_refs: ['local:fact:result'], evidence: ['fixture:architecture'], gap_refs: [],
    };
    return { invariant_ref: `project:invariant:${invariant.id}`, disposition: 'not_relevant', reason: 'The fixture does not affect this domain.', fact_refs: [], evidence: [], gap_refs: [] };
  });
  return {
    schema_version: 'arckit-semantic-case-command/v1', case_id: record.id,
    selection: {
      basis: 'The only ready Case gap is selected.', snapshot_token: snapshot.selection_tokens[record.id], selected_ref: selectedRef,
      comparison_summary: 'Every persisted candidate in scope was compared.', fresh_discovery_summary: 'No fresh candidate supersedes the persisted gap.',
      considered: snapshot.candidate_catalog.persisted_candidates.filter((item) => !item.case_id || item.case_id === record.id).map((item) => ({
        ref: item.ref, source: 'persisted', eligibility: item.kind === 'project_gap' ? 'case_required' : 'ready',
        disposition: item.ref === selectedRef ? 'selected' : 'deferred', priority_basis: { ...priority(), ...(item.gap.priority_basis || {}) },
        reason: item.ref === selectedRef ? 'This is the selected ready Case gap.' : 'This candidate requires a separate Case.',
      })),
    },
    planned_transition: { goal: 'Exercise semantic materialization.', expected_state_change: 'Explicit claims become a canonical transition.' },
    fresh_gap: null,
    claim: {
      resolve_selected_gap: { outcome: 'The fixture command is accepted.', reason: 'Explicit evidence supports it.', evidence: ['fixture:evidence'] },
      facts_added: [{ ref: 'local:fact:result', statement: 'The Agent explicitly selected the semantic result.', basis: 'Fixture Agent judgment.', evidence: ['fixture:evidence'] }],
      facts_superseded: [],
      impacts_added: [{ ref: 'local:impact:realization', fact_ref: 'local:fact:result', target_ref: 'project:decision:technical_foundation', effect: 'threatened', reason: 'A follow-up remains.', gap_refs: ['local:gap:followup'], evidence: ['fixture:evidence'] }],
      impacts_updated: [],
      gaps_added: [{ ref: 'local:gap:followup', goal: 'Complete the follow-up.', reason: 'Implementation remains.', derived_from: ['local:fact:result'], blocked_by: [], priority_basis: priority(), responsibility: 'agent', evidence_required: ['fixture:followup'] }],
      gaps_cancelled: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null,
    },
    project_claim: {
      decision_changes: [{ area_ref: 'project:decision:technical_foundation', set_decision: decision, reason: 'Accept the fixture boundary.', evidence: ['fixture:architecture'] }],
      invariant_changes: [],
      project_gap_changes: [{ action: 'add', ref: 'local:project-gap:runtime-boundary', gap: { goal: 'Validate the runtime boundary.', reason: 'Project validation remains.', affects: ['project:decision:technical_foundation'], priority_basis: priority(), dependencies: [], candidate_case_ref: '' }, reason: 'Record the explicit Project gap.', evidence: ['fixture:architecture'] }],
      selection_context_change: null, evidence: ['fixture:architecture'],
    },
    invariant_assessment: { judgments }, evidence: ['fixture:evidence', 'fixture:architecture'], unresolved: ['local:gap:followup'], round_outcome: 'completed',
  };
}

function priority() {
  return { blocking: 'high', uncertainty: 'low', risk: 'medium', user_impact: 'high' };
}
