import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  applyProtocolReconciliation,
  probeProtocolCompatibility,
} from '../../../entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs';
import {
  readCaseRecord,
  writeCaseRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs';
import { createProjectStateRecord } from '../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs';
import { readLedgerSnapshot } from '../../../entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs';
import { compileCoherentAgentLoopPrompt, createLoopFrame } from '../src/agent-orchestrator.mjs';
import { ensureArckitProject } from '../src/project-initializer.mjs';
import { runLedgerScript } from '../src/ledger-scripts.mjs';
import { selectNextRound } from '../src/loop-controller.mjs';
import { createStateStore } from '../src/state-store.mjs';

test('Runtime exposes an incompatible canonical state as a protocol recovery round', async () => {
  const root = await tempProject();
  try {
    const current = createProjectStateRecord({ name: 'Legacy Fixture', intent: 'Preserve recoverable project state.' });
    await writeProject(root, { ...current, schema_version: 'project-state-record/v4' });

    const initialization = await ensureArckitProject({ projectRoot: root, intent: 'Continue the original task.' });
    assert.equal(initialization.recovery_required, true);
    assert.equal(initialization.compatibility.recovery_mode, 'protocol_reconciliation');

    const snapshot = await createStateStore(root).readSnapshot();
    assert.equal(snapshot.stateAvailability, 'unavailable');
    assert.equal(snapshot.compatibility.observed[0].condition, 'older_protocol');
    const round = selectNextRound(snapshot, { task: 'Continue the original task.', conversationLocale: 'en' });
    assert.equal(round.scope, 'ledger');
    assert.equal(round.gap_id, 'LEDGER-PROTOCOL-RECOVERY');
    assert.deepEqual(round.candidate_cases, []);
    assert.match(round.stop_conditions.join('\n'), /Do not create or advance a normal Case/);

    const controllerCapability = {
      id: 'using-arckit',
      binding_targets: ['controller'],
      invocation: { type: 'agent_skill', skill_trigger: '$using-arckit', phases: ['agent_loop'] },
    };
    const ledgerCapability = {
      id: 'arckit-development-ledger',
      capability_root: join(process.cwd(), 'entry/skills/arckit-development-ledger'),
      runtime_entrypoints: { protocol_compatibility: 'scripts/protocol-compatibility.mjs' },
    };
    const loopFrame = createLoopFrame({ snapshot, round, task: 'Continue the original task.', runtimeCapabilities: [ledgerCapability] });
    const prompt = compileCoherentAgentLoopPrompt({
      snapshot,
      loopFrame,
      round,
      options: { task: 'Continue the original task.', originalTask: 'Continue the original task.', lifecycleRoundIndex: 1 },
      controllerCapabilities: [controllerCapability],
    });
    const invocation = JSON.parse(prompt.slice(prompt.indexOf('{')));
    assert.equal(invocation.canonical_context.state_availability, 'unavailable');
    assert.equal(invocation.canonical_context.protocol_compatibility.snapshot_token, snapshot.compatibility.snapshot_token);
    assert.equal(invocation.loop_contract.protocol_recovery, true);
    assert.equal(invocation.loop_contract.trusted_protocol_reconciliation_allowed, true);
    assert.deepEqual(invocation.loop_contract.valid_actions, ['handoff']);
    assert.equal(invocation.execution_authorization.trusted_protocol_recovery.authorized, true);
    assert.match(invocation.execution_authorization.trusted_protocol_recovery.entrypoint, /protocol-compatibility\.mjs$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('trusted reconciliation upgrades Project and active Case records and returns to compatible state', async () => {
  const root = await tempProject();
  try {
    await ensureArckitProject({ projectRoot: root, projectName: 'Upgrade Fixture', intent: 'Preserve active work.' });
    const caseRef = await createRegisteredCase(root);
    const projectPath = join(root, 'arckit/project/state.record.json');
    const casePath = join(root, caseRef);
    const currentProject = JSON.parse(await readFile(projectPath, 'utf8'));
    const { text, record: currentCase } = readCaseRecord(casePath);
    await writeProject(root, { ...currentProject, schema_version: 'project-state-record/v4' });
    writeCaseRecord(casePath, text, { ...currentCase, schema_version: 'development-case-record/v4' });

    const compatibility = probeProtocolCompatibility(root);
    assert.deepEqual(new Set(compatibility.affected_refs), new Set(['arckit/project/state.record.json', caseRef]));
    const result = await applyProtocolReconciliation({
      projectRoot: root,
      plan: reconciliationPlan(compatibility, {
        'arckit/project/state.record.json': currentProject,
        [caseRef]: currentCase,
      }),
    });

    assert.equal(result.applied, true);
    assert.equal(result.compatibility_after, 'compatible');
    assert.equal(probeProtocolCompatibility(root).status, 'compatible');
    assert.equal(JSON.parse(await readFile(projectPath, 'utf8')).schema_version, 'project-state-record/v5');
    assert.equal(readCaseRecord(casePath).record.schema_version, 'development-case-record/v5');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('current schema content drift triggers repair without being mislabeled as a version upgrade', async () => {
  const root = await tempProject();
  try {
    const current = createProjectStateRecord({ name: 'Drift Fixture', intent: 'Repair current-schema structural drift.' });
    const invalid = structuredClone(current);
    invalid.software_definition.decision_areas.shift();
    await writeProject(root, invalid);

    const compatibility = probeProtocolCompatibility(root);
    assert.equal(compatibility.recovery_mode, 'current_protocol_repair');
    assert.equal(compatibility.observed[0].condition, 'current_protocol_invalid');
    assert.match(compatibility.observed[0].issues.join('\n'), /must include core decision area/);
    const snapshot = await createStateStore(root).readSnapshot();
    assert.equal(snapshot.stateAvailability, 'unavailable');

    const result = await applyProtocolReconciliation({
      projectRoot: root,
      plan: reconciliationPlan(compatibility, { 'arckit/project/state.record.json': current }),
    });
    assert.equal(result.compatibility_after, 'compatible');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('compatibility probe rejects corrupted persisted v8 invariant assessment', async () => {
  const root = await tempProject();
  try {
    await ensureArckitProject({ projectRoot: root, projectName: 'Assessment Drift Fixture', intent: 'Reject corrupted Case history.' });
    const caseRef = await createRegisteredCase(root);
    const casePath = join(root, caseRef);
    const { text, record } = readCaseRecord(casePath);
    record.rounds.push({
      round: 1,
      transition_schema_version: 'arckit-case-transition/v8',
      invariant_assessment: { project_revision: 1, judgments: [] },
      occurred_at: record.updated_at,
    });
    writeCaseRecord(casePath, text, record);

    const compatibility = probeProtocolCompatibility(root);
    const observation = compatibility.observed.find((item) => item.ref === caseRef);
    assert.equal(compatibility.status, 'incompatible');
    assert.equal(observation.condition, 'current_protocol_invalid');
    assert.match(observation.issues.join('\n'), /invariant_assessment is invalid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('direct Codex can recover canonical core-invariant drift before any Case exists', async () => {
  const root = await tempProject();
  try {
    const current = createProjectStateRecord({ name: 'Direct Recovery Fixture', intent: 'Recover without registering a Case.' });
    const drifted = structuredClone(current);
    drifted.software_invariants[0].must_hold = 'Legacy core invariant wording.';
    await writeProject(root, drifted);

    const before = readLedgerSnapshot(root);
    assert.equal(before.state_availability, 'unavailable');
    assert.equal(before.canonical.active_cases.length, 0);
    assert.match(before.compatibility.observed[0].issues.join('\n'), /must match the current protocol definition exactly/);

    const result = await applyProtocolReconciliation({
      projectRoot: root,
      plan: reconciliationPlan(before.compatibility, { 'arckit/project/state.record.json': current }),
    });
    assert.equal(result.compatibility_after, 'compatible');

    const cliRead = await runLedgerScript(root, ['loop-snapshot.mjs', 'read']);
    const after = JSON.parse(cliRead.stdout);
    assert.equal(after.state_availability, 'available');
    assert.deepEqual(after.canonical.project_state.advancement.active_case_refs, []);
    const verified = readLedgerSnapshot(root, { afterCommitToken: after.snapshot_token });
    assert.equal(verified.observed_after_commit, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('trusted reconciliation rejects a stale compatibility snapshot', async () => {
  const root = await tempProject();
  try {
    const current = createProjectStateRecord({ name: 'Stale Fixture', intent: 'Do not overwrite concurrent changes.' });
    const legacy = { ...current, schema_version: 'project-state-record/v4' };
    await writeProject(root, legacy);
    const compatibility = probeProtocolCompatibility(root);
    const plan = reconciliationPlan(compatibility, { 'arckit/project/state.record.json': current });
    await writeFile(join(root, 'arckit/project/state.record.json'), `${JSON.stringify(legacy, null, 2)}\n\n`);

    await assert.rejects(
      applyProtocolReconciliation({ projectRoot: root, plan }),
      /observed_snapshot_token is stale|source_digest is stale/,
    );
    assert.equal(JSON.parse(await readFile(join(root, 'arckit/project/state.record.json'), 'utf8')).schema_version, 'project-state-record/v4');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('failed projection regeneration rolls back all reconciled canonical writes', async () => {
  const root = await tempProject();
  try {
    const current = createProjectStateRecord({ name: 'Rollback Fixture', intent: 'Keep the legacy record recoverable.' });
    const legacy = { ...current, schema_version: 'project-state-record/v4' };
    await writeProject(root, legacy);
    const projectPath = join(root, 'arckit/project/state.record.json');
    const before = await readFile(projectPath, 'utf8');
    const compatibility = probeProtocolCompatibility(root);
    await mkdir(join(root, 'arckit/cases/closed'), { recursive: true });
    await writeFile(join(root, 'arckit/cases/closed/CASE-20260811-999-broken.md'), '# Broken\n\n## Structured Record\n\n```json\n{not json}\n```\n');

    await assert.rejects(
      applyProtocolReconciliation({
        projectRoot: root,
        plan: reconciliationPlan(compatibility, { 'arckit/project/state.record.json': current }),
      }),
      /development-case\.mjs index failed/,
    );
    assert.equal(await readFile(projectPath, 'utf8'), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function tempProject() {
  const root = await mkdtemp(join(tmpdir(), 'arckit-protocol-compatibility-'));
  await mkdir(join(root, 'arckit/project'), { recursive: true });
  return root;
}

async function writeProject(root, record) {
  await mkdir(join(root, 'arckit/project'), { recursive: true });
  await writeFile(join(root, 'arckit/project/state.record.json'), `${JSON.stringify(record, null, 2)}\n`);
}

async function createRegisteredCase(root) {
  const created = await runLedgerScript(root, [
    'development-case.mjs',
    'new',
    '--title', 'Legacy active Case',
    '--artifact-type', 'mixed',
    '--intent', 'Preserve the accepted Case intent.',
    '--expected-outcome', 'The Case remains active after protocol reconciliation.',
    '--initial-facts', JSON.stringify([{ id: 'FACT-INTENT', revision: 1, status: 'accepted', statement: 'Protocol reconciliation must preserve active work.', basis: 'test fixture', evidence: ['fixture:protocol-reconciliation'] }]),
    '--initial-impacts', '[]',
    '--initial-gaps', JSON.stringify([{ id: 'GAP-WORK', status: 'open', goal: 'Continue the original work.', reason: 'The product task remains unfinished.', derived_from: ['FACT-INTENT'], blocked_by: [], priority_basis: { blocking: 'high', uncertainty: 'low', risk: 'medium', user_impact: 'high' }, responsibility: 'agent', evidence_required: ['fixture completion evidence'], resolution: null }]),
    '--max-review-cycles', '3',
    '--review-policy-source', 'test-policy',
  ]);
  const absolute = created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1).replaceAll('\\', '/');
  const caseRef = absolute.slice(absolute.lastIndexOf('/arckit/cases/') + 1);
  await runLedgerScript(root, ['project-state.mjs', 'register-case', '--case-ref', caseRef, '--intent', 'Preserve active work.', '--reason', 'Test fixture.']);
  return caseRef;
}

function reconciliationPlan(compatibility, records) {
  const replacements = compatibility.observed
    .filter((item) => Object.hasOwn(records, item.ref))
    .map((item) => ({
      ref: item.ref,
      kind: item.kind,
      observed_schema_version: item.schema_version,
      target_schema_version: compatibility.expected[item.kind],
      source_digest: item.source_digest,
      record: records[item.ref],
      semantic_basis: `The fixture's ${item.kind} state is preserved while adopting the current canonical schema.`,
      uncertainties: [],
    }));
  return {
    schema_version: 'arckit-protocol-reconciliation/v1',
    observed_snapshot_token: compatibility.snapshot_token,
    reason: 'Upgrade legacy canonical records without advancing ordinary Case work.',
    evidence: ['fixture:legacy-records', 'fixture:current-schemas'],
    preservation_claims: ['Project identity, accepted facts, open gaps, and active references are preserved.'],
    replacements,
  };
}
