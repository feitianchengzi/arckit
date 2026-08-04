#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const STATE_PATH = path.join(PROJECT_ROOT, 'STATE.md');
const STATE_RECORD_PATH = path.join(PROJECT_ROOT, 'state.record.json');
const ITERATIONS_INDEX_PATH = path.join(PROJECT_ROOT, 'ITERATIONS.md');

const VALID_STATE_VALUE = new Set([
  'unknown',
  'not_required',
  'needed',
  'defined',
  'designed',
  'implemented',
  'integrated',
  'verified',
  'accepted',
  'released',
  'operational',
  'deferred',
  'blocked',
]);
const VALID_EVIDENCE_MATURITY = new Set([
  'none',
  'exploratory',
  'confirmed',
  'formalized',
  'validated',
]);
const VALID_PROJECT_STATUS = new Set(['active', 'paused', 'archived']);
const VALID_PRIORITY = new Set(['none', 'low', 'medium', 'high', 'critical']);
const VALID_CONFIDENCE = new Set(['low', 'medium', 'high']);
const PROJECT_KEYS = new Set([
  'schema_version', 'project', 'active_iteration_ref', 'active_case_refs',
  'completeness_dimensions', 'state_gaps', 'case_control', 'active_constraints',
  'open_questions', 'canonical_artifact_refs', 'last_state_delta',
]);
const PROJECT_INFO_KEYS = new Set(['name', 'status', 'created_at', 'updated_at', 'original_intent', 'current_phase']);
const DIMENSION_KEYS = new Set([
  'current_state', 'target_state', 'state_reason', 'evidence', 'evidence_maturity',
  'gap', 'next_transition', 'blockers', 'priority', 'confidence',
]);
const GAP_KEYS = new Set([
  'id', 'dimension', 'current_state', 'target_state', 'impact', 'urgency', 'risk',
  'dependencies', 'covered_dimensions', 'next_transition', 'candidate_case_ref',
]);
const CASE_CONTROL_KEYS = new Set(['next_case_intent', 'priority_basis', 'stop_condition']);
const LAST_DELTA_KEYS = new Set([
  'changed_dimensions', 'state_transitions', 'deferred_dimensions', 'blocked_dimensions',
  'case_refs', 'iteration_ref', 'next_project_focus', 'updated_at',
]);
const LEGACY_RUNTIME_RESULT_REF_PATTERN = /^arckit\/project\/runtime-results\/(RUN-[A-Za-z0-9][A-Za-z0-9._-]*)\.json$/;
const OPAQUE_RUNTIME_RESULT_REF_PATTERN = /^arckit-runtime:\/\/runs\/(RUN-[A-Za-z0-9][A-Za-z0-9._-]*)$/;

const COMPLETENESS_DIMENSION_KEYS = [
  'project_intent',
  'users_and_stakeholders',
  'problem_scenarios',
  'product_behavior',
  'user_experience',
  'runtime_surfaces',
  'identity_access',
  'data_state',
  'integration_boundaries',
  'architecture_foundation',
  'implementation_coverage',
  'quality_validation',
  'security_privacy',
  'delivery_operation',
  'observability_support',
  'maintainability_handoff',
  'iteration_governance',
];

function usage(exitCode = 0) {
  const message = [
    'Usage:',
    '  node <skill-dir>/scripts/project-state.mjs init --name "Project Name" [--intent "..."]',
    '  node <skill-dir>/scripts/project-state.mjs register-case --case-ref "arckit/cases/active/CASE-...md" [--intent "..."] [--reason "..."]',
    '  node <skill-dir>/scripts/project-state.mjs migrate-v4 [record-file]',
    '  node <skill-dir>/scripts/project-state.mjs repair-runtime-refs [record-file]',
    '  node <skill-dir>/scripts/project-state.mjs render [record-file]',
    '  node <skill-dir>/scripts/project-state.mjs audit [record-file|state-file]',
    '  node <skill-dir>/scripts/project-state.mjs validate [record-file|state-file]',
    '  node <skill-dir>/scripts/project-state.mjs summary [record-file|state-file]',
  ].join('\n');
  console.log(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function ensureDirs() {
  fs.mkdirSync(PROJECT_ROOT, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function defaultDimension(currentState = 'unknown', targetState = 'unknown', stateReason = '') {
  return {
    current_state: currentState,
    target_state: targetState,
    state_reason: stateReason,
    evidence: [],
    evidence_maturity: 'none',
    gap: currentState === targetState ? '' : `Move ${currentState} toward ${targetState}.`,
    next_transition: '',
    blockers: [],
    priority: currentState === targetState || currentState === 'not_required' ? 'none' : 'medium',
    confidence: 'medium',
  };
}

function createRecord({ name, intent = '' }) {
  const timestamp = nowIso();
  return {
    schema_version: 'project-state-record/v4',
    project: {
      name,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp,
      original_intent: intent,
      current_phase: 'runtime-loop',
    },
    active_iteration_ref: '',
    active_case_refs: [],
    completeness_dimensions: Object.fromEntries(
      COMPLETENESS_DIMENSION_KEYS.map((key) => [key, defaultDimension()])
    ),
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
      updated_at: timestamp,
    },
  };
}

function renderState(record) {
  const stateGaps = (record.state_gaps || []).slice(0, 3);
  const priorityDimensions = Object.entries(record.completeness_dimensions || {})
    .filter(([, value]) => ['critical', 'high'].includes(value.priority))
    .slice(0, 6)
    .map(([key, value]) => `- ${key}: ${value.current_state} -> ${value.target_state}; next: ${value.next_transition || 'none'}`);
  const readRefs = [
    'state.record.json',
    record.active_iteration_ref || '',
    ...(record.active_case_refs || []),
  ].filter(Boolean);
  return [
    `# ${record.project.name} Project State`,
    '',
    `Status: ${record.project.status}`,
    `Updated: ${record.project.updated_at}`,
    `Canonical Record: state.record.json`,
    '',
    '## Purpose',
    '',
    record.project.original_intent || 'TBD',
    '',
    '## Case Selection Intent',
    '',
    record.case_control?.next_case_intent || 'TBD',
    '',
    '## Case Selection Basis',
    '',
    `- Active cases: ${(record.active_case_refs || []).length}`,
    `- Next case intent: ${record.case_control?.next_case_intent || 'TBD'}`,
    `- Priority basis: ${record.case_control?.priority_basis || 'TBD'}`,
    '- Each Loop selects exactly one active Case; Project State does not hold an exclusive execution selection.',
    '',
    '## Project Gap Candidates',
    '',
    '- Array order is not execution priority; Controller compares intent, impact, urgency, risk, and dependencies.',
    ...(stateGaps.length > 0
      ? stateGaps.map((gap) => `- ${gap.id}: ${gap.impact} Risk=${gap.risk || 'unknown'} Urgency=${gap.urgency || 'unknown'}`)
      : ['- none']),
    '',
    '## Do Not Treat As Complete',
    '',
    `- Stop condition: ${record.case_control?.stop_condition || 'TBD'}`,
    '- Do not edit this file as source state; update `state.record.json` and render this projection.',
    '- Do not close the active iteration until its close condition is met.',
    '',
    '## High-Priority Dimensions',
    '',
    ...(priorityDimensions.length > 0 ? priorityDimensions : ['- none']),
    '',
    '## Read For Precision',
    '',
    ...readRefs.map((ref) => `- ${ref}`),
    '',
    '## Open Questions',
    '',
    ...((record.open_questions || []).length > 0 ? record.open_questions.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Notes',
    '',
    '- `state.record.json` is the canonical machine-readable project state.',
    '- `STATE.md` is a generated Project/Case-selection decision brief. It is intentionally lossy and should not mirror the full JSON record.',
    '- Store iteration state under `arckit/project/iterations/` and case evidence under `arckit/cases/`.',
    '',
  ].join('\n');
}

function readJsonRecord(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error.message}`);
  }
}

function resolveRecordPathFromState(text, file) {
  const match = text.match(/^Canonical Record:\s*(.+)$/m);
  if (!match) return null;
  const ref = match[1].trim();
  if (!ref) return null;
  return path.resolve(path.dirname(file), ref);
}

function readRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    return { text, record: readJsonRecord(file), recordFile: file };
  }
  const recordPath = resolveRecordPathFromState(text, file);
  if (recordPath && fs.existsSync(recordPath)) {
    return { text, record: readJsonRecord(recordPath), recordFile: recordPath };
  }
  throw new Error(`${file}: canonical project state record could not be resolved`);
}

function writeRecord(record, file = STATE_RECORD_PATH) {
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
}

function writeStateProjection(record, file = STATE_PATH) {
  fs.writeFileSync(file, renderState(record));
}

function normalizeText(value) {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

function resolveProjectPath(ref) {
  return path.resolve(process.cwd(), ref);
}

function sortedUnique(values) {
  return [...new Set((values || []).filter(Boolean))].sort();
}

function rejectUnknownKeys(value, allowed, pathLabel, errors, file) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${file}: ${pathLabel}.${key} is not allowed`);
}

function isVolatileEvidenceRef(value) {
  return typeof value === 'string' && (value.startsWith('/tmp/') || value.startsWith('/private/tmp/') || value.startsWith('/var/folders/'));
}

function validateStringArray(value, label, errors, file, { nonEmpty = false, unique = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${file}: ${label} must be an array`);
    return;
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || (nonEmpty && item.length === 0)) errors.push(`${file}: ${label}[${index}] must be ${nonEmpty ? 'a non-empty string' : 'a string'}`);
  }
  if (unique && new Set(value).size !== value.length) errors.push(`${file}: ${label} must be unique`);
}

function auditRecord(record, recordFile = STATE_RECORD_PATH) {
  const errors = validateProjectStateRecord(record, recordFile);
  if (errors.length) return errors;
  if (fs.existsSync(STATE_PATH)) {
    const expected = normalizeText(renderState(record));
    const actual = normalizeText(fs.readFileSync(STATE_PATH, 'utf8'));
    if (actual !== expected) {
      errors.push(`${STATE_PATH}: projection is stale; run project-state.mjs render`);
    }
  } else {
    errors.push(`${STATE_PATH}: missing projection; run project-state.mjs render`);
  }
  if (record.active_iteration_ref && !fs.existsSync(resolveProjectPath(record.active_iteration_ref))) {
    errors.push(`${recordFile}: active_iteration_ref does not exist: ${record.active_iteration_ref}`);
  }
  if (record.active_iteration_ref && fs.existsSync(resolveProjectPath(record.active_iteration_ref))) {
    const iterationPath = resolveProjectPath(record.active_iteration_ref);
    const iteration = readJsonRecord(iterationPath);
    if (iteration.schema_version !== 'iteration-state-record/v2') errors.push(`${iterationPath}: active iteration must use iteration-state-record/v2`);
    if (iteration.project_state_ref !== path.relative(process.cwd(), recordFile)) errors.push(`${iterationPath}: project_state_ref must reference ${path.relative(process.cwd(), recordFile)}`);
    if (JSON.stringify(sortedUnique(iteration.active_case_refs)) !== JSON.stringify(sortedUnique(record.active_case_refs))) errors.push(`${iterationPath}: active_case_refs must match Project active_case_refs`);
  }
  for (const ref of record.active_case_refs || []) {
    if (typeof ref !== 'string') continue;
    if (!fs.existsSync(resolveProjectPath(ref))) {
      errors.push(`${recordFile}: active_case_ref does not exist: ${ref}`);
    }
    if (!ref.includes('/active/')) {
      errors.push(`${recordFile}: active_case_ref should point under arckit/cases/active: ${ref}`);
    }
  }
  for (const gap of record.state_gaps || []) {
    if (typeof gap?.candidate_case_ref === 'string' && gap.candidate_case_ref && (!(record.active_case_refs || []).includes(gap.candidate_case_ref) || !fs.existsSync(resolveProjectPath(gap.candidate_case_ref)))) {
      errors.push(`${recordFile}: state gap ${gap.id} candidate_case_ref must be an active Case: ${gap.candidate_case_ref}`);
    }
  }
  for (const ref of record.canonical_artifact_refs || []) {
    if (typeof ref === 'string' && !path.isAbsolute(ref) && !fs.existsSync(resolveProjectPath(ref))) errors.push(`${recordFile}: canonical_artifact_ref does not exist: ${ref}`);
  }
  return errors;
}

function validateString(record, key, errors, file) {
  if (typeof record[key] !== 'string') {
    errors.push(`${file}: ${key} must be a string`);
  }
}

function validateDimension(item, key, errors, file) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${file}: completeness_dimensions.${key} is required`);
    return;
  }
  rejectUnknownKeys(item, DIMENSION_KEYS, `completeness_dimensions.${key}`, errors, file);
  if (!VALID_STATE_VALUE.has(item.current_state)) {
    errors.push(`${file}: completeness_dimensions.${key}.current_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  if (!VALID_STATE_VALUE.has(item.target_state)) {
    errors.push(`${file}: completeness_dimensions.${key}.target_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  for (const field of ['state_reason', 'gap', 'next_transition']) {
    if (typeof item[field] !== 'string') {
      errors.push(`${file}: completeness_dimensions.${key}.${field} must be a string`);
    }
  }
  if (!Array.isArray(item.evidence)) {
    errors.push(`${file}: completeness_dimensions.${key}.evidence must be an array`);
  } else {
    for (const [index, evidence] of item.evidence.entries()) {
      if (typeof evidence !== 'string' || evidence.length === 0) errors.push(`${file}: completeness_dimensions.${key}.evidence[${index}] must be a non-empty string`);
      if (isVolatileEvidenceRef(evidence)) errors.push(`${file}: completeness_dimensions.${key}.evidence contains volatile ref: ${evidence}`);
    }
  }
  if (!VALID_EVIDENCE_MATURITY.has(item.evidence_maturity)) {
    errors.push(`${file}: completeness_dimensions.${key}.evidence_maturity must be one of ${Array.from(VALID_EVIDENCE_MATURITY).join(', ')}`);
  }
  if (item.blockers !== undefined) validateStringArray(item.blockers, `completeness_dimensions.${key}.blockers`, errors, file, { nonEmpty: true, unique: true });
  if (!VALID_PRIORITY.has(item.priority)) {
    errors.push(`${file}: completeness_dimensions.${key}.priority must be one of ${Array.from(VALID_PRIORITY).join(', ')}`);
  }
  if (!VALID_CONFIDENCE.has(item.confidence)) {
    errors.push(`${file}: completeness_dimensions.${key}.confidence must be one of ${Array.from(VALID_CONFIDENCE).join(', ')}`);
  }
  if (
    ['defined', 'designed', 'implemented', 'integrated', 'verified', 'accepted', 'released', 'operational'].includes(item.current_state) &&
    (!Array.isArray(item.evidence) || item.evidence.length === 0)
  ) {
    errors.push(`${file}: completeness_dimensions.${key}.evidence must not be empty when current_state is ${item.current_state}`);
  }
}

function validateStateGap(gap, index, errors, file) {
  if (!gap || typeof gap !== 'object' || Array.isArray(gap)) {
    errors.push(`${file}: state_gaps[${index}] must be an object`);
    return;
  }
  rejectUnknownKeys(gap, GAP_KEYS, `state_gaps[${index}]`, errors, file);
  for (const field of ['id', 'dimension', 'impact', 'next_transition']) {
    if (typeof gap[field] !== 'string' || gap[field].length === 0) {
      errors.push(`${file}: state_gaps[${index}].${field} must be a non-empty string`);
    }
  }
  if (!VALID_STATE_VALUE.has(gap.current_state)) {
    errors.push(`${file}: state_gaps[${index}].current_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  if (!VALID_STATE_VALUE.has(gap.target_state)) {
    errors.push(`${file}: state_gaps[${index}].target_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  if (!VALID_PRIORITY.has(gap.urgency) || gap.urgency === 'none') {
    errors.push(`${file}: state_gaps[${index}].urgency must be one of ${Array.from(VALID_PRIORITY).filter((item) => item !== 'none').join(', ')}`);
  }
  if (!VALID_PRIORITY.has(gap.risk) || gap.risk === 'none') {
    errors.push(`${file}: state_gaps[${index}].risk must be one of ${Array.from(VALID_PRIORITY).filter((item) => item !== 'none').join(', ')}`);
  }
  if (gap.dependencies !== undefined) validateStringArray(gap.dependencies, `state_gaps[${index}].dependencies`, errors, file, { nonEmpty: true, unique: true });
  if (gap.candidate_case_ref !== undefined && (typeof gap.candidate_case_ref !== 'string' || !gap.candidate_case_ref)) errors.push(`${file}: state_gaps[${index}].candidate_case_ref must be a non-empty string when present`);
  if (!Array.isArray(gap.covered_dimensions) || gap.covered_dimensions.length === 0) {
    errors.push(`${file}: state_gaps[${index}].covered_dimensions must be non-empty`);
  } else {
    if (!gap.covered_dimensions.includes(gap.dimension)) errors.push(`${file}: state_gaps[${index}].covered_dimensions must include its primary dimension`);
    if (new Set(gap.covered_dimensions).size !== gap.covered_dimensions.length) errors.push(`${file}: state_gaps[${index}].covered_dimensions must be unique`);
    for (const dimension of gap.covered_dimensions) if (!COMPLETENESS_DIMENSION_KEYS.includes(dimension)) errors.push(`${file}: state_gaps[${index}] covers unknown dimension: ${dimension}`);
  }
}

export function validateProjectStateRecord(record, file = '<record>') {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [`${file}: project state must be an object`];
  rejectUnknownKeys(record, PROJECT_KEYS, 'record', errors, file);
  if (record.schema_version !== 'project-state-record/v4') {
    errors.push(`${file}: schema_version must be project-state-record/v4`);
  }
  if (!record.project || typeof record.project !== 'object' || Array.isArray(record.project)) {
    errors.push(`${file}: project must be an object`);
  } else {
    rejectUnknownKeys(record.project, PROJECT_INFO_KEYS, 'project', errors, file);
    if (typeof record.project.name !== 'string' || record.project.name.length === 0) {
      errors.push(`${file}: project.name must be a non-empty string`);
    }
    if (!VALID_PROJECT_STATUS.has(record.project.status)) {
      errors.push(`${file}: project.status must be one of ${Array.from(VALID_PROJECT_STATUS).join(', ')}`);
    }
    for (const key of ['created_at', 'updated_at', 'original_intent']) {
      if (typeof record.project[key] !== 'string') {
        errors.push(`${file}: project.${key} must be a string`);
      }
    }
    if (record.project.current_phase !== undefined && typeof record.project.current_phase !== 'string') errors.push(`${file}: project.current_phase must be a string when present`);
  }
  validateString(record, 'active_iteration_ref', errors, file);
  validateStringArray(record.active_case_refs, 'active_case_refs', errors, file, { nonEmpty: true, unique: true });
  if (!record.completeness_dimensions || typeof record.completeness_dimensions !== 'object' || Array.isArray(record.completeness_dimensions)) {
    errors.push(`${file}: completeness_dimensions must be an object`);
  } else {
    rejectUnknownKeys(record.completeness_dimensions, new Set(COMPLETENESS_DIMENSION_KEYS), 'completeness_dimensions', errors, file);
    for (const key of COMPLETENESS_DIMENSION_KEYS) {
      validateDimension(record.completeness_dimensions[key], key, errors, file);
    }
  }
  if (!Array.isArray(record.state_gaps)) {
    errors.push(`${file}: state_gaps must be an array`);
  } else {
    record.state_gaps.forEach((gap, index) => validateStateGap(gap, index, errors, file));
    const validGaps = record.state_gaps.filter((gap) => gap && typeof gap === 'object' && !Array.isArray(gap));
    const gapIds = validGaps.map((gap) => gap.id);
    if (new Set(gapIds).size !== gapIds.length) errors.push(`${file}: state_gaps ids must be unique`);
    const coveredDimensions = new Set(validGaps.flatMap((gap) => Array.isArray(gap.covered_dimensions) ? gap.covered_dimensions : []));
    for (const [dimension, value] of Object.entries(record.completeness_dimensions || {})) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const actionable = value.current_state !== value.target_state && Boolean(value.gap) && value.priority !== 'none';
      if (actionable && !coveredDimensions.has(dimension)) errors.push(`${file}: actionable Project dimension is not covered by state_gaps: ${dimension}`);
    }
    for (const [index, gap] of validGaps.entries()) {
      const primary = record.completeness_dimensions?.[gap.dimension];
      if (primary && (gap.current_state !== primary.current_state || gap.target_state !== primary.target_state)) errors.push(`${file}: state_gaps[${index}] states must match primary dimension ${gap.dimension}`);
    }
  }
  if (!record.case_control || typeof record.case_control !== 'object' || Array.isArray(record.case_control)) {
    errors.push(`${file}: case_control must be an object`);
  } else {
    rejectUnknownKeys(record.case_control, CASE_CONTROL_KEYS, 'case_control', errors, file);
    for (const key of ['next_case_intent', 'priority_basis', 'stop_condition']) {
      if (typeof record.case_control[key] !== 'string') {
        errors.push(`${file}: case_control.${key} must be a string`);
      }
    }
  }
  for (const key of ['active_constraints', 'open_questions', 'canonical_artifact_refs']) validateStringArray(record[key], key, errors, file, { nonEmpty: true, unique: true });
  for (const ref of Array.isArray(record.canonical_artifact_refs) ? record.canonical_artifact_refs : []) {
    if (isVolatileEvidenceRef(ref)) errors.push(`${file}: canonical_artifact_refs contains volatile ref: ${ref}`);
  }
  if (!record.last_state_delta || typeof record.last_state_delta !== 'object' || Array.isArray(record.last_state_delta)) {
    errors.push(`${file}: last_state_delta must be an object`);
  } else {
    rejectUnknownKeys(record.last_state_delta, LAST_DELTA_KEYS, 'last_state_delta', errors, file);
    for (const key of ['changed_dimensions', 'deferred_dimensions', 'blocked_dimensions', 'case_refs']) {
      validateStringArray(record.last_state_delta[key], `last_state_delta.${key}`, errors, file, { nonEmpty: true, unique: true });
    }
    if (!Array.isArray(record.last_state_delta.state_transitions)) {
      errors.push(`${file}: last_state_delta.state_transitions must be an array`);
    } else {
      for (const [index, transition] of record.last_state_delta.state_transitions.entries()) {
        const label = `last_state_delta.state_transitions[${index}]`;
        rejectUnknownKeys(transition, new Set(['dimension', 'from_state', 'to_state', 'reason']), label, errors, file);
        if (!COMPLETENESS_DIMENSION_KEYS.includes(transition?.dimension)) errors.push(`${file}: ${label}.dimension is invalid`);
        if (!VALID_STATE_VALUE.has(transition?.from_state) || !VALID_STATE_VALUE.has(transition?.to_state) || transition?.from_state === transition?.to_state) errors.push(`${file}: ${label} states must describe a real Project state change`);
        if (typeof transition?.reason !== 'string' || !transition.reason) errors.push(`${file}: ${label}.reason must be a non-empty string`);
      }
    }
    if (typeof record.last_state_delta.iteration_ref !== 'string') errors.push(`${file}: last_state_delta.iteration_ref must be a string`);
    if (typeof record.last_state_delta.next_project_focus !== 'string') {
      errors.push(`${file}: last_state_delta.next_project_focus must be a string`);
    }
    if (typeof record.last_state_delta.updated_at !== 'string') {
      errors.push(`${file}: last_state_delta.updated_at must be a string`);
    }
  }
  return errors;
}

function summarize(record) {
  const dimensions = Object.entries(record.completeness_dimensions || {}).map(([key, value]) => ({
    key,
    current_state: value.current_state,
    target_state: value.target_state,
    priority: value.priority,
    confidence: value.confidence,
    gap: value.gap || '',
    next_transition: value.next_transition || '',
  }));
  return {
    project: record.project?.name || '',
    status: record.project?.status || '',
    current_phase: record.project?.current_phase || '',
    updated_at: record.project?.updated_at || '',
    active_iteration_ref: record.active_iteration_ref || '',
    active_case_refs: record.active_case_refs || [],
    case_control: record.case_control || {},
    state_gaps: record.state_gaps || [],
    dimensions,
    open_questions: record.open_questions || [],
    last_state_delta: record.last_state_delta || {},
  };
}

function commandInit(args) {
  ensureDirs();
  if (fs.existsSync(STATE_RECORD_PATH)) {
    console.log(STATE_RECORD_PATH);
    return;
  }
  const name = args.name;
  if (!name) throw new Error('init requires --name');
  const record = createRecord({ name, intent: args.intent || '' });
  writeRecord(record);
  writeStateProjection(record);
  console.log(STATE_RECORD_PATH);
}

function commandRegisterCase(args) {
  const caseRef = args['case-ref'];
  if (!caseRef) throw new Error('register-case requires --case-ref');
  const { record } = readRecord(STATE_RECORD_PATH);
  if (!caseRef.includes('/active/') || !fs.existsSync(resolveProjectPath(caseRef))) throw new Error(`register-case target must be an existing active Case: ${caseRef}`);
  const timestamp = nowIso();
  if (!record.active_case_refs.includes(caseRef)) record.active_case_refs.push(caseRef);
  record.case_control = {
    next_case_intent: args.intent || '',
    priority_basis: args.reason || 'Controller compares the active Cases against current intent, impact, risk, and dependencies for each Loop.',
    stop_condition: 'Stop after one active Case and one of its candidate gaps are selected for the current Loop.',
  };
  record.project.updated_at = timestamp;
  record.last_state_delta = {
    changed_dimensions: [],
    state_transitions: [],
    deferred_dimensions: [],
    blocked_dimensions: [],
    case_refs: [caseRef],
    iteration_ref: record.active_iteration_ref || '',
    next_project_focus: args.intent || '',
    updated_at: timestamp,
  };
  const projectErrors = validateProjectStateRecord(record, STATE_RECORD_PATH);
  if (projectErrors.length) throw new Error(projectErrors.join('\n'));
  const iterationPath = record.active_iteration_ref ? resolveProjectPath(record.active_iteration_ref) : '';
  if (iterationPath && !fs.existsSync(iterationPath)) throw new Error(`${iterationPath}: active_iteration_ref must exist before selecting a Case`);
  const iteration = iterationPath && fs.existsSync(iterationPath) ? readJsonRecord(iterationPath) : null;
  if (iteration) {
    if (iteration.schema_version !== 'iteration-state-record/v2') throw new Error(`${iterationPath}: active iteration must use iteration-state-record/v2`);
    if (iteration.project_state_ref !== path.relative(process.cwd(), STATE_RECORD_PATH)) throw new Error(`${iterationPath}: project_state_ref must reference ${path.relative(process.cwd(), STATE_RECORD_PATH)}`);
    iteration.active_case_refs = sortedUnique([...(iteration.active_case_refs || []), caseRef]);
    iteration.updated_at = timestamp;
  }
  const snapshots = [STATE_RECORD_PATH, STATE_PATH, iterationPath, iterationPath ? iterationPath.replace(/\.record\.json$/, '.md') : '', ITERATIONS_INDEX_PATH]
    .filter(Boolean)
    .map((file) => ({ file, exists: fs.existsSync(file), content: fs.existsSync(file) ? fs.readFileSync(file) : null }));
  try {
    writeRecord(record, STATE_RECORD_PATH);
    writeStateProjection(record, STATE_PATH);
    if (iteration) {
      writeRecord(iteration, iterationPath);
      runIterationScript(['render', record.active_iteration_ref]);
      runIterationScript(['index']);
    }
  } catch (error) {
    for (const snapshot of snapshots) {
      if (snapshot.exists) fs.writeFileSync(snapshot.file, snapshot.content);
      else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
    }
    throw error;
  }
  console.log(STATE_RECORD_PATH);
}

export function migrateProjectStateV4(record, { timestamp = nowIso() } = {}) {
  if (record?.schema_version === 'project-state-record/v4') return { record, migrated: false };
  if (record?.schema_version !== 'project-state-record/v3') {
    throw new Error(`Unsupported Project State migration source: ${record?.schema_version || '<missing>'}`);
  }
  const previousControl = record.case_control || {};
  const next = structuredClone(record);
  next.schema_version = 'project-state-record/v4';
  next.project.updated_at = timestamp;
  next.case_control = {
    next_case_intent: previousControl.next_case_intent || (next.active_case_refs?.length
      ? 'Select one active Case for each independent Loop.'
      : 'Create a bounded Case from the remaining Project state gaps.'),
    priority_basis: previousControl.priority_basis || 'Controller compares current intent, impact, urgency, risk, and dependencies; array order is not priority.',
    stop_condition: 'Stop after one active Case and one of its candidate gaps are selected for the current Loop.',
  };
  next.last_state_delta = {
    ...(next.last_state_delta || {}),
    next_project_focus: next.case_control.next_case_intent,
    updated_at: timestamp,
  };
  return { record: next, migrated: true };
}

function commandMigrateV4(args) {
  ensureDirs();
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const canonicalFile = path.resolve(recordFile || file);
  const migration = migrateProjectStateV4(record);
  if (!migration.migrated) {
    console.log(JSON.stringify({ schema_version: 'project-state-migration/v1', migrated: false, changed_files: [] }, null, 2));
    return;
  }
  const errors = validateProjectStateRecord(migration.record, canonicalFile);
  if (errors.length) throw new Error(errors.join('\n'));
  const snapshots = [canonicalFile, STATE_PATH].map((snapshotFile) => ({
    file: snapshotFile,
    exists: fs.existsSync(snapshotFile),
    content: fs.existsSync(snapshotFile) ? fs.readFileSync(snapshotFile) : null,
  }));
  try {
    writeRecord(migration.record, canonicalFile);
    writeStateProjection(migration.record, STATE_PATH);
  } catch (error) {
    for (const snapshot of snapshots) {
      if (snapshot.exists) fs.writeFileSync(snapshot.file, snapshot.content);
      else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
    }
    throw error;
  }
  console.log(JSON.stringify({
    schema_version: 'project-state-migration/v1',
    migrated: true,
    changed_files: ['arckit/project/state.record.json', 'arckit/project/STATE.md'],
  }, null, 2));
}

function runIterationScript(args) {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'project-iteration.mjs');
  const result = spawnSync(process.execPath, [script, ...args], { cwd: process.cwd(), encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`project-iteration.mjs ${args.join(' ')} failed\n${result.stderr || result.stdout}`);
}

function commandRender(args) {
  ensureDirs();
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record } = readRecord(file);
  const errors = validateProjectStateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  writeStateProjection(record);
  console.log(STATE_PATH);
}

function commandRepairRuntimeRefs(args) {
  ensureDirs();
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const canonicalRecordFile = path.resolve(recordFile || file);
  if (canonicalRecordFile !== path.resolve(STATE_RECORD_PATH)) {
    throw new Error(`repair-runtime-refs requires ${path.resolve(STATE_RECORD_PATH)}`);
  }
  const errors = validateProjectStateRecord(record, canonicalRecordFile);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  const removedRefs = (record.canonical_artifact_refs || []).filter((ref) => (
    OPAQUE_RUNTIME_RESULT_REF_PATTERN.test(ref)
    || (LEGACY_RUNTIME_RESULT_REF_PATTERN.test(ref) && !fs.existsSync(resolveProjectPath(ref)))
  ));
  if (removedRefs.length === 0) {
    console.log(JSON.stringify({
      schema_version: 'project-state-runtime-ref-repair/v1',
      repaired: false,
      removed_canonical_artifact_refs: [],
      changed_files: [],
    }, null, 2));
    return;
  }

  const removed = new Set(removedRefs);
  record.canonical_artifact_refs = record.canonical_artifact_refs.filter((ref) => !removed.has(ref));
  record.project.updated_at = nowIso();
  const repairedErrors = validateProjectStateRecord(record, canonicalRecordFile);
  if (repairedErrors.length > 0) throw new Error(repairedErrors.join('\n'));

  const snapshots = [canonicalRecordFile, STATE_PATH].map((snapshotFile) => ({
    file: snapshotFile,
    exists: fs.existsSync(snapshotFile),
    content: fs.existsSync(snapshotFile) ? fs.readFileSync(snapshotFile) : null,
  }));
  try {
    writeRecord(record, canonicalRecordFile);
    writeStateProjection(record, STATE_PATH);
  } catch (error) {
    for (const snapshot of snapshots) {
      if (snapshot.exists) fs.writeFileSync(snapshot.file, snapshot.content);
      else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
    }
    throw error;
  }
  console.log(JSON.stringify({
    schema_version: 'project-state-runtime-ref-repair/v1',
    repaired: true,
    removed_canonical_artifact_refs: removedRefs,
    changed_files: ['arckit/project/state.record.json', 'arckit/project/STATE.md'],
  }, null, 2));
}

function commandAudit(args) {
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const errors = auditRecord(record, recordFile || file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`${recordFile || file}: audit ok`);
}

function commandValidate(args) {
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const errors = validateProjectStateRecord(record, recordFile || file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`${recordFile || file}: ok`);
}

function commandSummary(args) {
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const errors = validateProjectStateRecord(record, recordFile || file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify(summarize(record), null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command || command === 'help' || command === '--help') usage(0);
  if (command === 'init') return commandInit(args);
  if (command === 'register-case' || command === 'select-case') return commandRegisterCase(args);
  if (command === 'migrate-v4') return commandMigrateV4(args);
  if (command === 'repair-runtime-refs') return commandRepairRuntimeRefs(args);
  if (command === 'render') return commandRender(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'summary') return commandSummary(args);
  usage(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
