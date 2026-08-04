import assert from 'node:assert/strict';
import test from 'node:test';

import { migrateProjectStateV4, validateProjectStateRecord } from '../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs';
import { auditIterationStateRecord, renderIteration, validateIterationStateRecord } from '../../../entry/skills/arckit-development-ledger/scripts/project-iteration.mjs';

const DIMENSIONS = [
  'project_intent', 'users_and_stakeholders', 'problem_scenarios', 'product_behavior',
  'user_experience', 'runtime_surfaces', 'identity_access', 'data_state',
  'integration_boundaries', 'architecture_foundation', 'implementation_coverage',
  'quality_validation', 'security_privacy', 'delivery_operation',
  'observability_support', 'maintainability_handoff', 'iteration_governance',
];

test('Project State v3 migration removes exclusive Case selection and preserves active refs', () => {
  const legacy = projectRecord();
  legacy.schema_version = 'project-state-record/v3';
  legacy.active_case_refs = ['arckit/cases/active/CASE-20260726-901-example.md'];
  legacy.case_control = {
    selected_case_ref: legacy.active_case_refs[0],
    selection_reason: 'Legacy exclusive selection.',
    next_case_intent: 'Advance the bounded work.',
    priority_basis: 'Legacy priority basis.',
    stop_condition: 'Legacy stop condition.',
  };

  const { record, migrated } = migrateProjectStateV4(legacy, { timestamp: '2026-07-27T00:00:00.000Z' });
  assert.equal(migrated, true);
  assert.equal(record.schema_version, 'project-state-record/v4');
  assert.deepEqual(record.active_case_refs, legacy.active_case_refs);
  assert.equal(Object.hasOwn(record.case_control, 'selected_case_ref'), false);
  assert.equal(Object.hasOwn(record.case_control, 'selection_reason'), false);
  assert.deepEqual(validateProjectStateRecord(record), []);
});

test('Iteration v2 rejects Loop state, legacy versions, and no-op Project changes', () => {
  const valid = iterationRecord();
  assert.deepEqual(validateIterationStateRecord(valid), []);

  const withLoopState = structuredClone(valid);
  withLoopState.loop_control = { trigger_mode: 'manual_bridge' };
  assert.match(validateIterationStateRecord(withLoopState).join('\n'), /loop_control is not allowed/);

  const legacy = structuredClone(valid);
  legacy.schema_version = 'iteration-state-record/v1';
  assert.match(validateIterationStateRecord(legacy).join('\n'), /iteration-state-record\/v2/);

  const noOp = structuredClone(valid);
  noOp.accepted_project_changes.push({
    dimension: 'product_behavior',
    from_state: 'implemented',
    to_state: 'implemented',
    reason: 'A no-op must not become an iteration transition.',
    evidence: ['arckit/cases/closed/CASE-20260726-001-example.md'],
    case_ref: 'arckit/cases/closed/CASE-20260726-001-example.md',
  });
  assert.match(validateIterationStateRecord(noOp).join('\n'), /must change state/);
});

test('Iteration projection derives the current side from Project State and never renders a stale reverse transition', () => {
  const record = iterationRecord();
  record.target_project_states = [{
    dimension: 'product_behavior',
    target_state: 'accepted',
    reason: 'Accept behavior through real-agent scenarios.',
  }];
  const project = projectRecord();
  project.completeness_dimensions.product_behavior = dimension({
    current: 'implemented',
    target: 'accepted',
    gap: 'Real-agent evaluation remains.',
    priority: 'high',
  });
  project.state_gaps = [gap({
    id: 'GAP-product',
    dimension: 'product_behavior',
    current: 'implemented',
    target: 'accepted',
    covered: ['product_behavior'],
  })];
  record.acceptance.remaining_project_gaps = ['GAP-product'];

  const projection = renderIteration(record, project);
  assert.match(projection, /product_behavior: implemented -> accepted/);
  assert.doesNotMatch(projection, /implemented -> designed/);
});

test('Project State requires every actionable dimension to be covered by a Project gap', () => {
  const project = projectRecord();
  project.completeness_dimensions.product_behavior = dimension({
    current: 'implemented',
    target: 'accepted',
    gap: 'Real-agent evaluation remains.',
    priority: 'high',
  });
  assert.match(validateProjectStateRecord(project).join('\n'), /not covered by state_gaps: product_behavior/);

  project.state_gaps = [gap({
    id: 'GAP-product',
    dimension: 'product_behavior',
    current: 'implemented',
    target: 'accepted',
    covered: ['product_behavior'],
  })];
  assert.deepEqual(validateProjectStateRecord(project), []);
});

test('durable state records reject volatile evidence references', () => {
  const project = projectRecord();
  project.completeness_dimensions.product_behavior.evidence = ['/tmp/transient-result.json'];
  project.canonical_artifact_refs = ['/private/tmp/transient-result.json'];
  const projectErrors = validateProjectStateRecord(project).join('\n');
  assert.match(projectErrors, /evidence contains volatile ref/);
  assert.match(projectErrors, /canonical_artifact_refs contains volatile ref/);

  const iteration = iterationRecord();
  iteration.acceptance.evidence = ['/tmp/transient-result.json'];
  assert.match(validateIterationStateRecord(iteration).join('\n'), /volatile ref/);
});

test('strict records reject malformed collection entries and duplicate gap identities', () => {
  const project = projectRecord();
  project.completeness_dimensions.product_behavior.evidence = [42];
  project.completeness_dimensions.product_behavior.blockers = ['blocked', 'blocked'];
  project.state_gaps = [
    gap({ id: 'GAP-duplicate', dimension: 'product_behavior', current: 'unknown', target: 'unknown', covered: ['product_behavior'] }),
    gap({ id: 'GAP-duplicate', dimension: 'quality_validation', current: 'unknown', target: 'unknown', covered: ['quality_validation'] }),
  ];
  project.last_state_delta.state_transitions = [{ dimension: 'product_behavior', from_state: 'implemented', to_state: 'implemented', reason: '' }];
  const projectErrors = validateProjectStateRecord(project).join('\n');
  assert.match(projectErrors, /evidence\[0\] must be a non-empty string/);
  assert.match(projectErrors, /blockers must be unique/);
  assert.match(projectErrors, /state_gaps ids must be unique/);
  assert.match(projectErrors, /states must describe a real Project state change/);

  const iteration = iterationRecord();
  iteration.active_case_refs = ['arckit/cases/active/CASE-20260726-901.md', 'arckit/cases/active/CASE-20260726-901.md'];
  iteration.acceptance.remaining_project_gaps = [7];
  const iterationErrors = validateIterationStateRecord(iteration).join('\n');
  assert.match(iterationErrors, /active_case_refs must be unique/);
  assert.match(iterationErrors, /remaining_project_gaps\[0\] must be a non-empty string/);
});

test('strict validation and audit fail closed without dereferencing malformed nested entries', () => {
  const project = projectRecord();
  project.completeness_dimensions.product_behavior = null;
  project.state_gaps = [null];
  assert.doesNotThrow(() => validateProjectStateRecord(project));
  assert.match(validateProjectStateRecord(project).join('\n'), /product_behavior is required/);
  assert.match(validateProjectStateRecord(project).join('\n'), /state_gaps\[0\] must be an object/);

  const iteration = iterationRecord();
  iteration.target_project_states = [null];
  iteration.accepted_project_changes = {};
  iteration.acceptance.evidence = {};
  iteration.last_case_aggregation = null;
  assert.doesNotThrow(() => validateIterationStateRecord(iteration));
  assert.doesNotThrow(() => auditIterationStateRecord(iteration, '/nonexistent/iteration.record.json'));
  assert.match(auditIterationStateRecord(iteration, '/nonexistent/iteration.record.json').join('\n'), /target_project_states\[0\].dimension is invalid/);
});

function iterationRecord() {
  return {
    schema_version: 'iteration-state-record/v2',
    id: 'ITER-20260726-901',
    title: 'Strict iteration fixture',
    status: 'active',
    created_at: '2026-07-26T00:00:00.000Z',
    updated_at: '2026-07-26T00:00:00.000Z',
    iteration_goal: 'Test strict macro aggregation.',
    project_state_ref: 'arckit/project/state.record.json',
    target_project_states: [],
    accepted_project_changes: [],
    acceptance: { status: 'working', evidence: [], remaining_project_gaps: [] },
    blocking_project_gaps: [],
    active_case_refs: [],
    closed_case_refs: [],
    close_condition: 'Close after acceptance.',
    last_case_aggregation: {
      case_ref: '',
      project_changes: [],
      evidence: [],
      updated_at: '2026-07-26T00:00:00.000Z',
    },
  };
}

function projectRecord() {
  return {
    schema_version: 'project-state-record/v4',
    project: {
      name: 'Fixture',
      status: 'active',
      created_at: '2026-07-26T00:00:00.000Z',
      updated_at: '2026-07-26T00:00:00.000Z',
      original_intent: 'Test Project governance.',
      current_phase: 'test',
    },
    active_iteration_ref: '',
    active_case_refs: [],
    completeness_dimensions: Object.fromEntries(DIMENSIONS.map((key) => [key, dimension({})])),
    state_gaps: [],
    case_control: {
      next_case_intent: '',
      priority_basis: '',
      stop_condition: '',
    },
    active_constraints: [],
    open_questions: [],
    canonical_artifact_refs: [],
    last_state_delta: {
      changed_dimensions: [],
      state_transitions: [],
      deferred_dimensions: [],
      blocked_dimensions: [],
      case_refs: [],
      iteration_ref: '',
      next_project_focus: '',
      updated_at: '2026-07-26T00:00:00.000Z',
    },
  };
}

function dimension({ current = 'unknown', target = 'unknown', gap: gapText = '', priority = 'none' }) {
  return {
    current_state: current,
    target_state: target,
    state_reason: 'Fixture state.',
    evidence: current === 'unknown' ? [] : ['fixture:evidence'],
    evidence_maturity: current === 'unknown' ? 'none' : 'confirmed',
    gap: gapText,
    next_transition: gapText ? 'Advance this dimension.' : '',
    blockers: [],
    priority,
    confidence: 'medium',
  };
}

function gap({ id, dimension: dimensionKey, current, target, covered }) {
  return {
    id,
    dimension: dimensionKey,
    current_state: current,
    target_state: target,
    impact: 'Fixture impact.',
    urgency: 'medium',
    risk: 'medium',
    dependencies: [],
    covered_dimensions: covered,
    next_transition: 'Create or select a bounded Case.',
  };
}
