import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
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
test('invariant template is the sole source of content and definitions remain isolated from callers', async () => {
  const template = JSON.parse(await readFile(new URL('../../../entry/skills/arckit-development-ledger/templates/software-invariants.json', import.meta.url), 'utf8'));
  assert.deepEqual(CORE_SOFTWARE_INVARIANTS, template);
  const project = fixtureProject();
  for (const expected of template) {
    assert.ok(expected.id && expected.applies_when && expected.must_hold && expected.evidence_expectation);
    const missing = structuredClone(project);
    missing.software_invariants = missing.software_invariants.filter((item) => item.id !== expected.id);
    assert.match(validateProjectStateRecord(missing).join('\n'), /must include core software invariant/);
    const changed = structuredClone(project);
    changed.software_invariants.find((item) => item.id === expected.id).must_hold = 'Unapproved definition';
    assert.match(validateProjectStateRecord(changed).join('\n'), /must match the current protocol definition exactly/);
  }
  project.software_invariants[0].must_hold = 'Local mutation';
  assert.deepEqual(CORE_SOFTWARE_INVARIANTS, template);
});

test('the protocol checklist cannot be removed or semantically rewritten by a project', () => {
  const missing = fixtureProject();
  missing.software_definition.decision_areas.shift();
  assert.match(validateProjectStateRecord(missing).join('\n'), /must include core decision area product_intent_and_scope/);

  const rewritten = fixtureProject();
  rewritten.software_definition.decision_areas[0].question = 'Which skill owns product intent?';
  assert.match(validateProjectStateRecord(rewritten).join('\n'), /must match the current protocol definition exactly/);
});

test('the loader and core validation follow an alternate template without domain or count assumptions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'arckit-invariant-template-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'templates'));
    const source = await readFile(new URL('../../../entry/skills/arckit-development-ledger/scripts/project-invariants.mjs', import.meta.url), 'utf8');
    await writeFile(join(root, 'scripts/project-invariants.mjs'), source);
    const definitions = ['fixture-zeta', 'fixture-alpha', 'fixture-extra'].map((id) => ({
      id, applies_when: `Explicit fixture applicability for ${id}.`, must_hold: `Fixture responsibility for ${id}.`,
      evidence_expectation: `Fixture evidence for ${id}.`, priority: 'required',
    }));
    await writeFile(join(root, 'templates/software-invariants.json'), JSON.stringify(definitions));
    const loaded = await import(pathToFileURL(join(root, 'scripts/project-invariants.mjs')).href);
    assert.deepEqual(loaded.defaultSoftwareInvariants(), definitions);
    assert.deepEqual([...loaded.coreSoftwareInvariantIds()], definitions.map((item) => item.id));
    assert.deepEqual(loaded.validateCoreSoftwareInvariants({ software_invariants: [...definitions].reverse() }), []);
    assert.match(loaded.validateCoreSoftwareInvariants({ software_invariants: definitions.slice(1) }).join('\n'), /fixture-zeta/);
    const altered = structuredClone(definitions);
    altered[0].evidence_expectation = 'Other contract';
    assert.match(loaded.validateCoreSoftwareInvariants({ software_invariants: altered }).join('\n'), /evidence_expectation/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
      { kind: 'software_invariant', ref: project.software_invariants[0].id, expected: 'upheld', reason: 'Exercise a dynamically loaded target.' },
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
