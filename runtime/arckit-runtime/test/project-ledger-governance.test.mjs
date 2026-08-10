import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createProjectStateRecord,
  projectTargetRefs,
  validateProjectStateRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs';
import {
  coreDecisionAreaDefinitions,
} from '../../../entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs';
import {
  CORE_SOFTWARE_INVARIANTS,
} from '../../../entry/skills/arckit-development-ledger/scripts/project-invariants.mjs';
import {
  auditIterationStateRecord,
  validateIterationStateRecord,
} from '../../../entry/skills/arckit-development-ledger/scripts/project-iteration.mjs';

test('Project v5 owns the complete explicit software-definition checklist and independent invariants', () => {
  const project = createProjectStateRecord({ name: 'Fixture', intent: 'Build a bounded product.' });
  assert.equal(project.schema_version, 'project-state-record/v5');
  assert.deepEqual(project.software_definition.decision_areas.map((area) => area.id), coreDecisionAreaDefinitions().map((area) => area.id));
  assert.deepEqual(project.software_invariants, structuredClone(CORE_SOFTWARE_INVARIANTS));
  assert.equal(Object.hasOwn(project, 'completeness_dimensions'), false);
  assert.equal(Object.hasOwn(project, 'desired_conditions'), false);
  assert.deepEqual(validateProjectStateRecord(project), []);
});

test('the protocol checklist cannot be removed or semantically rewritten by a project', () => {
  const missing = fixtureProject();
  missing.software_definition.decision_areas.shift();
  assert.match(validateProjectStateRecord(missing).join('\n'), /must include core decision area product_intent_and_scope/);

  const rewritten = fixtureProject();
  rewritten.software_definition.decision_areas[0].question = 'Which skill owns product intent?';
  assert.match(validateProjectStateRecord(rewritten).join('\n'), /must match the current protocol definition exactly/);
});

test('projects personalize software decisions without inventing concrete software invariants', () => {
  const project = fixtureProject();
  const technical = area(project, 'technical_foundation');
  technical.decision = {
    revision: 1,
    status: 'settled',
    statement: 'The application uses Qt 6, C++20 and CMake.',
    reason: 'Repository code and build configuration establish the stack.',
    evidence: ['CMakeLists.txt', 'src/main.cpp'],
    confidence: 'high',
    resume_condition: '',
  };
  assert.deepEqual(validateProjectStateRecord(project), []);
  assert.equal(project.software_invariants.some((item) => item.id.includes('qt')), false);
});

test('settled, deferred and stale decisions enforce their distinct evidence obligations', () => {
  const settled = fixtureProject();
  area(settled, 'product_capabilities').decision.status = 'settled';
  assert.match(validateProjectStateRecord(settled).join('\n'), /settled requires statement, reason, and durable evidence/);

  const deferred = fixtureProject();
  area(deferred, 'commercialization_and_entitlement').decision.status = 'deferred';
  assert.match(validateProjectStateRecord(deferred).join('\n'), /deferred requires reason and resume_condition/);

  const stale = fixtureProject();
  area(stale, 'technical_foundation').decision.status = 'stale';
  assert.match(validateProjectStateRecord(stale).join('\n'), /stale requires an active Project gap/);
});

test('a real Project gap may affect multiple decisions and invariants without becoming a workflow', () => {
  const project = fixtureProject();
  project.advancement.project_gaps.push({
    id: 'GAP-1', goal: 'Resolve the restore contract.', reason: 'A stale restore can overwrite new data.',
    affects: [
      { kind: 'software_decision', ref: 'data_and_state' },
      { kind: 'software_invariant', ref: 'accepted-facts-are-realized' },
    ],
    priority_basis: { risk: 'high', uncertainty: 'high' }, dependencies: [], candidate_case_ref: '',
  });
  area(project, 'data_and_state').gap_refs = ['GAP-1'];
  assert.deepEqual(validateProjectStateRecord(project), []);
  assert.equal(Object.hasOwn(project.advancement.project_gaps[0], 'skill'), false);
  assert.equal(Object.hasOwn(project.advancement.project_gaps[0], 'facet'), false);
});

test('Project evidence remains durable and target refs are explicit', () => {
  const project = fixtureProject();
  const technical = area(project, 'technical_foundation');
  technical.decision = {
    revision: 1, status: 'settled', statement: 'Use Node.js.', reason: 'The runtime package establishes it.',
    evidence: ['/tmp/result.json'], confidence: 'high', resume_condition: '',
  };
  assert.match(validateProjectStateRecord(project).join('\n'), /volatile ref/);
  const refs = projectTargetRefs(fixtureProject());
  assert.equal(refs.software_decision.has('technical_foundation'), true);
  assert.equal(refs.software_invariant.has('accepted-facts-are-realized'), true);
});

test('Iteration v3 targets software decisions, invariants and Project gaps', async () => {
  const root = await mkdtemp(join(tmpdir(), 'arckit-iteration-v3-'));
  try {
    await mkdir(join(root, 'arckit/project'), { recursive: true });
    const project = fixtureProject();
    project.advancement.project_gaps.push({
      id: 'GAP-1', goal: 'Verify the protocol.', reason: 'Real evidence is pending.',
      affects: [{ kind: 'software_decision', ref: 'quality_and_validation' }],
      priority_basis: { risk: 'high' }, dependencies: [], candidate_case_ref: '',
    });
    await writeFile(join(root, 'arckit/project/state.record.json'), `${JSON.stringify(project)}\n`);
    const iteration = iterationFixture();
    iteration.targets = [
      { kind: 'software_decision', ref: 'quality_and_validation', expected: 'settled', reason: 'Validation must be explicit.' },
      { kind: 'software_invariant', ref: 'material-risks-have-credible-evidence', expected: 'upheld', reason: 'Risk needs evidence.' },
      { kind: 'project_gap', ref: 'GAP-1', expected: 'resolved', reason: 'The evidence gap must close.' },
    ];
    assert.deepEqual(validateIterationStateRecord(iteration), []);
    assert.deepEqual(auditIterationStateRecord(iteration, '<iteration>', root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function fixtureProject() {
  return createProjectStateRecord({ name: 'Fixture', intent: 'Build a bounded product.' });
}

function area(project, id) {
  return project.software_definition.decision_areas.find((item) => item.id === id);
}

function iterationFixture() {
  return {
    schema_version: 'iteration-state-record/v3', id: 'ITER-20260810-001', title: 'Fixture iteration', status: 'active',
    created_at: '2026-08-10T00:00:00.000Z', updated_at: '2026-08-10T00:00:00.000Z',
    iteration_goal: 'Verify State v5.', project_state_ref: 'arckit/project/state.record.json', targets: [],
    accepted_project_changes: [], acceptance: { status: 'working', evidence: [], remaining_project_gaps: ['GAP-1'] },
    blocking_project_gaps: [], active_case_refs: [], closed_case_refs: [], close_condition: 'All targets accepted.',
    last_case_aggregation: { case_ref: '', project_changes: [], evidence: [], updated_at: '2026-08-10T00:00:00.000Z' },
  };
}
