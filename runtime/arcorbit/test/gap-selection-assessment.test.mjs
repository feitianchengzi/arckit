import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { selectionAssessment } from './helpers/selection-assessment.mjs';
import { validateSelectionAssessment, validateSelectionAssessmentAgainstState, validateSelectionAssessmentAgainstHistory } from '../../../entry/skills/arckit-development-ledger/scripts/selection-assessment.mjs';
import { readStateDefinition } from '../../../entry/skills/arckit-development-ledger/scripts/state-definition.mjs';

test('formal delivery requires prior expectations, carriers and satisfied prerequisites', () => {
  const delivery = selectionAssessment({
    delivers_realization: true,
    invariant_refs: ['accepted-facts-are-realized'],
    implementation_carriers: ['entry/skills/example/SKILL.md'],
    expected_fact_refs: ['arckit/spec/example.md'],
    prerequisites: [{ statement: 'The local accepted contract is sufficient.', status: 'satisfied', evidence: ['arckit/spec/example.md'] }],
  });
  assert.deepEqual(validateSelectionAssessment(delivery), []);
  for (const override of [
    { expected_fact_refs: [] }, { implementation_carriers: [] }, { invariant_refs: [] },
    { establishes_expectations: true }, { conclusion_kind: 'exploration' },
    { prerequisites: [{ ...delivery.prerequisites[0], status: 'unresolved' }] },
    { prerequisites: [{ ...delivery.prerequisites[0], evidence: [] }] },
  ]) assert.ok(validateSelectionAssessment({ ...delivery, ...override }).length, JSON.stringify(override));
});

test('exploration and grouped expectations remain legal without declaring formal delivery', () => {
  assert.deepEqual(validateSelectionAssessment(selectionAssessment({
    conclusion_kind: 'exploration',
    acceptance: ['Determine whether the approach is feasible; a reproducible negative result is sufficient.'],
    deferred: ['The product contract and formal delivery remain open.'],
  })), []);
  assert.deepEqual(validateSelectionAssessment(selectionAssessment({
    establishes_expectations: true,
    invariant_refs: ['product-expectations-remain-recoverable'],
    acceptance: ['Define the local behavior.', 'Define the closely related error behavior.'],
    boundary_reason: 'Both follow the same settled contract and can be accepted together.',
  })), []);
  assert.ok(validateSelectionAssessment(undefined).length);
  assert.ok(validateSelectionAssessment(selectionAssessment({ acceptance: [] })).length);
});

test('selection responsibility references must exist in the current project', () => {
  const project = { software_invariants: [{ id: 'local-responsibility' }] };
  assert.deepEqual(validateSelectionAssessmentAgainstState(selectionAssessment({ invariant_refs: ['local-responsibility'] }), project), []);
  assert.match(validateSelectionAssessmentAgainstState(selectionAssessment({ invariant_refs: ['unknown'] }), project).join('\n'), /unknown invariant/);
});

test('direct and Agent output schemas share the same selection declaration contract', () => {
  const read = (file) => JSON.parse(readFileSync(new URL(`../../../entry/skills/arckit-development-ledger/schema/${file}`, import.meta.url), 'utf8'));
  const { $schema, ...direct } = read('selection-assessment.schema.json');
  const embedded = read('agent-contracts.schema.json').$defs.selection_assessment;
  assert.deepEqual(embedded, direct);
  const state = readStateDefinition();
  assert.equal(state.definition.id, 'software-development');
  assert.match(state.digest, /^[a-f0-9]{64}$/);
});

test('accepted context can be referenced without inheriting previous conclusions or requirements', () => {
  const stored = selectionAssessment({ implementation_carriers: ['skills/example/SKILL.md'], establishes_expectations: true });
  const record = { rounds: [{ round: 1, selected_gap: { id: 'GAP-DEFINITION' }, planned_transition: { selection_assessment: stored } }] };
  const current = selectionAssessment({
    context_ref: 'case:round:1', maintenance_object: null, implementation_carriers: null, activation: null, verification: null,
    delivers_realization: true, invariant_refs: ['accepted-facts-are-realized'], expected_fact_refs: ['spec:accepted'],
  });
  assert.deepEqual(validateSelectionAssessment(current), []);
  assert.deepEqual(validateSelectionAssessmentAgainstHistory(current, record, 'GAP-IMPLEMENTATION'), []);
  assert.ok(validateSelectionAssessmentAgainstHistory(current, record, 'GAP-DEFINITION').length);
  assert.match(validateSelectionAssessmentAgainstHistory({ ...current, context_ref: 'case:round:99' }, record, 'GAP-IMPLEMENTATION').join(' '), /accepted context/);
  assert.ok(validateSelectionAssessment({ ...current, maintenance_object: 'Ambiguous override' }).length);
  const emptyCarriers = structuredClone(record);
  emptyCarriers.rounds[0].planned_transition.selection_assessment.implementation_carriers = [];
  assert.match(validateSelectionAssessmentAgainstHistory(current, emptyCarriers, 'GAP-IMPLEMENTATION').join(' '), /implementation carriers/);
  const cyclic = { rounds: [{ round: 1, planned_transition: { selection_assessment: current } }] };
  assert.match(validateSelectionAssessmentAgainstHistory(current, cyclic, 'GAP-IMPLEMENTATION').join(' '), /cycle/);
});
