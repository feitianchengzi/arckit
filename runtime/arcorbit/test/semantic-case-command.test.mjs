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

test('Semantic validation rejects malformed containers without escaping as an internal exception', () => {
  const issues = validateSemanticCaseCommand({
    schema_version: 'arckit-semantic-case-command/v1', case_id: 'CASE-20260824-001',
    selection: { basis: 'x', snapshot_token: 'x', selected_ref: 'x', comparison_summary: 'x', fresh_discovery_summary: 'x', considered: {} },
    planned_transition: { goal: 'x', expected_state_change: 'x' }, fresh_gap: null,
    claim: {
      resolve_selected_gap: null, facts_added: {}, facts_superseded: {}, impacts_added: {}, impacts_updated: {},
      gaps_added: {}, gaps_cancelled: {}, resolved_open_questions: {}, completed_handoffs: {},
      completion_review_result: null, resolved_review_findings: {}, review_budget_extension: null,
    },
    project_claim: { decision_changes: {}, invariant_changes: {}, project_gap_changes: {}, selection_context_change: null, evidence: {} },
    invariant_assessment: { judgments: {} }, evidence: [], unresolved: {}, round_outcome: 'completed',
  });
  assert.ok(issues.length > 0);
  assert.ok(issues.some((item) => item.path === 'case_command.selection.considered'));
});

test('Semantic preflight rejects contract contradictions before canonical apply', async () => {
  const projectRoot = await fixtureProject();
  const snapshot = readLedgerSnapshot(projectRoot);
  const active = snapshot.canonical.active_cases[0];
  const mutations = [
    {
      name: 'duplicate selection identity', path: 'case_command.selection.considered',
      mutate(command) { command.selection.considered.push({ ...structuredClone(command.selection.considered[0]), disposition: 'deferred' }); },
    },
    {
      name: 'ordinary gap without resolution', path: 'case_command.claim.resolve_selected_gap',
      mutate(command) { command.claim.resolve_selected_gap = null; },
    },
    {
      name: 'selected fresh gap assigned away from the Agent', path: 'case_command.fresh_gap.responsibility',
      mutate(command) {
        command.selection.considered[0].disposition = 'deferred';
        command.selection.considered.push({
          ref: 'local:gap:fresh-human', source: 'fresh', eligibility: 'ready', disposition: 'selected',
          priority_basis: priority(), reason: 'Attempt to select a human-owned fresh gap.',
        });
        command.selection.selected_ref = 'local:gap:fresh-human';
        command.fresh_gap = {
          ref: 'local:gap:fresh-human', goal: 'Wait for a human.', reason: 'This cannot be fresh Agent work.',
          derived_from: ['case:fact:FACT-INTENT'], blocked_by: [], priority_basis: priority(),
          responsibility: 'human', evidence_required: ['fixture:human'],
        };
      },
    },
    {
      name: 'duplicate local fact identity', path: 'case_command.claim.facts_added',
      mutate(command) { command.claim.facts_added.push(structuredClone(command.claim.facts_added[0])); },
    },
    {
      name: 'duplicate decision mutation', path: 'case_command.project_claim.decision_changes',
      mutate(command) { command.project_claim.decision_changes.push(structuredClone(command.project_claim.decision_changes[0])); },
    },
    {
      name: 'Project mutation without aggregate evidence', path: 'case_command.project_claim.evidence',
      mutate(command) { command.project_claim.evidence = []; },
    },
    {
      name: 'Project gap add without its content', path: 'case_command.project_claim.project_gap_changes[0].gap',
      mutate(command) { command.project_claim.project_gap_changes[0].gap = null; },
    },
    {
      name: 'new gap without a derivation', path: 'case_command.claim.gaps_added[0]',
      mutate(command) { command.claim.gaps_added[0].derived_from = []; },
    },
    {
      name: 'threatened impact whose last gap closes in the same command', path: 'case_command.claim.impacts_added',
      mutate(command) {
        command.claim.impacts_added[0].gap_refs = ['case:gap:GAP-WORK'];
        command.claim.gaps_added = [];
        command.invariant_assessment.judgments = command.invariant_assessment.judgments.map((item) => ({
          invariant_ref: item.invariant_ref, disposition: 'not_relevant', reason: 'This scenario isolates projected impact closure.',
          fact_refs: [], evidence: [], gap_refs: [],
        }));
      },
    },
    {
      name: 'stale decision without a resulting Project gap', path: 'case_command.project_claim.decision_changes',
      mutate(command) {
        command.project_claim.decision_changes[0].set_decision.status = 'stale';
        command.project_claim.project_gap_changes = [];
      },
    },
    {
      name: 'core invariant mutation outside sync', path: 'case_command.project_claim.invariant_changes[0].action',
      mutate(command) {
        command.project_claim.invariant_changes = [{
          action: 'update', ref: 'project:invariant:accepted-facts-are-realized',
          definition: {
            applies_when: 'Changed.', must_hold: 'Changed.', evidence_expectation: 'Changed.', priority: 'required',
          },
          reason: 'Attempt a forbidden core rewrite.', evidence: ['fixture:architecture'],
        }];
      },
    },
    {
      name: 'upheld invariant without evidence', path: 'case_command.invariant_assessment.judgments',
      mutate(command) {
        const judgment = command.invariant_assessment.judgments.find((item) => item.disposition === 'upheld');
        judgment.evidence = [];
      },
    },
  ];

  for (const scenario of mutations) {
    const command = semanticCommand(snapshot, active.record);
    scenario.mutate(command);
    assert.throws(
      () => materializeSemanticCaseCommand({ command, snapshot }),
      (error) => error instanceof SemanticCommandError
        && error.kind === 'claim_invalid'
        && error.issues.some((item) => item.path.includes(scenario.path)),
      scenario.name,
    );
  }

  const rejected = semanticCommand(snapshot, active.record);
  rejected.claim.resolve_selected_gap = null;
  const result = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: rejected },
    snapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(result.rejection.kind, 'claim_invalid');
  assert.equal(result.rejection.responsibility, 'agent');
  assert.equal(result.rejection.recovery_action, 'repair_rejected_claim');
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
  const { projectRoot, snapshot, active } = await reviewReadyFixture();
  const command = completionReviewCommand(snapshot, active.record);
  assert.deepEqual(validateSemanticCaseCommand(command), []);

  const invalid = structuredClone(command);
  invalid.claim.resolve_selected_gap = {
    outcome: 'The derived review candidate is also resolved.', reason: 'This duplicates the review result.', evidence: ['fixture:review'],
  };
  assert.throws(
    () => materializeSemanticCaseCommand({ command: invalid, snapshot }),
    (error) => error instanceof SemanticCommandError
      && error.kind === 'claim_invalid'
      && error.issues.some((issue) => issue.path === 'case_command.claim.resolve_selected_gap')
  );
  const rejected = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: invalid },
    snapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(rejected.rejection.kind, 'claim_invalid');
  assert.equal(rejected.rejection.responsibility, 'agent');
  assert.equal(rejected.rejection.recovery_action, 'repair_rejected_claim');
  assert.equal(rejected.rejection.counts_toward_agent_repair, true);

  const materialized = materializeSemanticCaseCommand({ command, snapshot });
  assert.equal(materialized.transition.accepted_state_delta.resolved_gap, null);
  assert.equal(materialized.transition.accepted_state_delta.completion_review_result.outcome, 'clean');
  const accepted = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: command },
    snapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(accepted.written, true);
  assert.equal(accepted.case_transition_result.case_resolution.status, 'resolved');
});

test('Semantic Completion Review rejects responsibility, outcome and identity contradictions', async () => {
  const { snapshot, active } = await reviewReadyFixture();
  const scenarios = [
    {
      name: 'reviewer responsibility mismatch', path: 'completion_review_result.reviewer',
      mutate(command) { command.claim.completion_review_result.reviewer = 'human'; },
    },
    {
      name: 'clean outcome with a finding dimension', path: 'completion_review_result.outcome',
      mutate(command) { command.claim.completion_review_result.dimensions.regression_risk = 'findings'; },
    },
    {
      name: 'duplicate finding identity', path: 'completion_review_result.findings',
      mutate(command) {
        command.claim.completion_review_result.outcome = 'findings';
        command.claim.completion_review_result.dimensions.regression_risk = 'findings';
        const finding = {
          ref: 'local:review-finding:duplicate', kind: 'error', statement: 'A duplicated finding identity.',
          responsibility: 'agent', artifact_refs: ['fixture:source'], evidence: ['fixture:review'],
        };
        command.claim.completion_review_result.findings = [finding, structuredClone(finding)];
      },
    },
  ];

  for (const scenario of scenarios) {
    const command = completionReviewCommand(snapshot, active.record);
    scenario.mutate(command);
    assert.throws(
      () => materializeSemanticCaseCommand({ command, snapshot }),
      (error) => error instanceof SemanticCommandError
        && error.kind === 'claim_invalid'
        && error.issues.some((item) => item.path.includes(scenario.path)),
      scenario.name,
    );
  }
});

test('Semantic materialization allocates a new finding identity across Completion Review cycles', async () => {
  const { snapshot, active } = await reviewReadyFixture();
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
  const command = completionReviewCommand(snapshot, active.record);
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

async function reviewReadyFixture() {
  const projectRoot = await fixtureProject();
  const initialSnapshot = readLedgerSnapshot(projectRoot);
  const initial = initialSnapshot.canonical.active_cases[0];
  const ordinaryResult = await applyRuntimeLedgerWriteback({
    projectRoot,
    runtimeResult: { case_command: ordinaryResolutionCommand(initialSnapshot, initial.record) },
    snapshot: initialSnapshot,
    gate: { allowed: true, reasons: [] },
  });
  assert.equal(ordinaryResult.written, true);
  const snapshot = readLedgerSnapshot(projectRoot, { afterCommitToken: ordinaryResult.post_commit_snapshot_token });
  return {
    projectRoot,
    snapshot,
    active: snapshot.canonical.active_cases.find((item) => item.record.id === initial.record.id),
  };
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

function ordinaryResolutionCommand(snapshot, record) {
  const command = semanticCommand(snapshot, record);
  command.claim.facts_added = [];
  command.claim.impacts_added = [];
  command.claim.gaps_added = [];
  command.project_claim.decision_changes = [];
  command.project_claim.project_gap_changes = [];
  command.project_claim.evidence = [];
  command.invariant_assessment.judgments = snapshot.canonical.project_state.software_invariants.map((invariant) => ({
    invariant_ref: `project:invariant:${invariant.id}`, disposition: 'not_relevant',
    reason: 'The fixture only resolves its ordinary implementation gap.', fact_refs: [], evidence: [], gap_refs: [],
  }));
  command.evidence = ['fixture:evidence'];
  command.unresolved = ['completion_review'];
  return command;
}

function completionReviewCommand(snapshot, record) {
  const command = ordinaryResolutionCommand(snapshot, record);
  const reviewGap = record.case_resolution.candidate_gaps.find((gap) => gap.id.includes(':completion-review:'));
  const selectedRef = `case-gap:${record.id}:${reviewGap.id}`;
  command.selection.selected_ref = selectedRef;
  command.selection.considered = snapshot.candidate_catalog.persisted_candidates
    .filter((item) => !item.case_id || item.case_id === record.id)
    .map((item) => ({
      ref: item.ref, source: 'persisted', eligibility: item.kind === 'project_gap' ? 'case_required' : 'ready',
      disposition: item.ref === selectedRef ? 'selected' : 'deferred', priority_basis: { ...priority(), ...(item.gap.priority_basis || {}) },
      reason: item.ref === selectedRef ? 'This is the selected Completion Review.' : 'This candidate requires a separate Case.',
    }));
  command.planned_transition = { goal: 'Review the completed fixture.', expected_state_change: 'Record a clean Completion Review.' };
  command.claim.resolve_selected_gap = null;
  command.claim.completion_review_result = {
    outcome: 'clean', reviewer: 'agent',
    dimensions: {
      implementation_correctness: 'clean', problem_resolution: 'clean', verification_credibility: 'clean',
      regression_risk: 'clean', minimality: 'clean',
    },
    findings: [], evidence: ['fixture:review'],
  };
  command.evidence = ['fixture:review'];
  command.unresolved = [];
  return command;
}

function priority() {
  return { blocking: 'high', uncertainty: 'low', risk: 'medium', user_impact: 'high' };
}
