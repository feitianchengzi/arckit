#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const STATE_PATH = path.join(PROJECT_ROOT, 'STATE.md');
const STATE_RECORD_PATH = path.join(PROJECT_ROOT, 'state.record.json');

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
    '  node <skill-dir>/scripts/project-state.mjs migrate [legacy-state-file]',
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

function defaultDimension(currentState = 'unknown', targetState = 'accepted', stateReason = '') {
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
    schema_version: 'project-state-record/v2',
    project: {
      name,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp,
      original_intent: intent,
      current_phase: 'state-discovery',
    },
    active_iteration_ref: '',
    active_case_refs: [],
    completeness_dimensions: Object.fromEntries(
      COMPLETENESS_DIMENSION_KEYS.map((key) => [key, defaultDimension()])
    ),
    state_gaps: [],
    loop_control: {
      current_loop_focus: '',
      next_transition: '',
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
      next_loop_focus: '',
      updated_at: timestamp,
    },
  };
}

function renderState(record) {
  const stateGaps = (record.state_gaps || []).slice(0, 3);
  const primaryGap = stateGaps[0] || {};
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
    '## Loop Focus',
    '',
    record.loop_control?.current_loop_focus || 'TBD',
    '',
    '## Next State Transition',
    '',
    `- Transition: ${primaryGap.dimension ? `${primaryGap.dimension}: ${primaryGap.current_state} -> ${primaryGap.target_state}` : record.loop_control?.next_transition || 'TBD'}`,
    `- Why now: ${primaryGap.impact || record.loop_control?.priority_basis || 'TBD'}`,
    `- Next action: ${primaryGap.next_transition || record.loop_control?.next_transition || 'TBD'}`,
    '',
    '## Current Risks',
    '',
    ...(stateGaps.length > 0
      ? stateGaps.map((gap) => `- ${gap.id}: ${gap.impact} Risk=${gap.risk || 'unknown'} Urgency=${gap.urgency || 'unknown'}`)
      : ['- none']),
    '',
    '## Do Not Treat As Complete',
    '',
    `- Stop condition: ${record.loop_control?.stop_condition || 'TBD'}`,
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
    '- `STATE.md` is a generated loop decision brief. It is intentionally lossy and should not mirror the full JSON record.',
    '- Store iteration state under `arckit/project/iterations/` and case evidence under `arckit/cases/`.',
    '',
  ].join('\n');
}

function extractRecordFromMarkdown(text, file) {
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error(`${file}: missing Structured Record json block and no canonical record could be resolved`);
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error.message}`);
  }
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
  return { text, record: extractRecordFromMarkdown(text, file), recordFile: file };
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

function auditRecord(record, recordFile = STATE_RECORD_PATH) {
  const errors = validateRecord(record, recordFile);
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
  for (const ref of record.active_case_refs || []) {
    if (!fs.existsSync(resolveProjectPath(ref))) {
      errors.push(`${recordFile}: active_case_ref does not exist: ${ref}`);
    }
    if (!ref.includes('/active/')) {
      errors.push(`${recordFile}: active_case_ref should point under arckit/cases/active: ${ref}`);
    }
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
  }
  if (!VALID_EVIDENCE_MATURITY.has(item.evidence_maturity)) {
    errors.push(`${file}: completeness_dimensions.${key}.evidence_maturity must be one of ${Array.from(VALID_EVIDENCE_MATURITY).join(', ')}`);
  }
  if (item.blockers !== undefined && !Array.isArray(item.blockers)) {
    errors.push(`${file}: completeness_dimensions.${key}.blockers must be an array when present`);
  }
  if (!VALID_PRIORITY.has(item.priority)) {
    errors.push(`${file}: completeness_dimensions.${key}.priority must be one of ${Array.from(VALID_PRIORITY).join(', ')}`);
  }
  if (!VALID_CONFIDENCE.has(item.confidence)) {
    errors.push(`${file}: completeness_dimensions.${key}.confidence must be one of ${Array.from(VALID_CONFIDENCE).join(', ')}`);
  }
  if (
    ['defined', 'designed', 'implemented', 'integrated', 'verified', 'accepted', 'released', 'operational'].includes(item.current_state) &&
    item.evidence.length === 0
  ) {
    errors.push(`${file}: completeness_dimensions.${key}.evidence must not be empty when current_state is ${item.current_state}`);
  }
}

function validateStateGap(gap, index, errors, file) {
  if (!gap || typeof gap !== 'object' || Array.isArray(gap)) {
    errors.push(`${file}: state_gaps[${index}] must be an object`);
    return;
  }
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
  if (!VALID_PRIORITY.has(gap.urgency)) {
    errors.push(`${file}: state_gaps[${index}].urgency must be one of ${Array.from(VALID_PRIORITY).filter((item) => item !== 'none').join(', ')}`);
  }
  if (!VALID_PRIORITY.has(gap.risk)) {
    errors.push(`${file}: state_gaps[${index}].risk must be one of ${Array.from(VALID_PRIORITY).filter((item) => item !== 'none').join(', ')}`);
  }
  if (gap.dependencies !== undefined && !Array.isArray(gap.dependencies)) {
    errors.push(`${file}: state_gaps[${index}].dependencies must be an array when present`);
  }
}

function validateRecord(record, file = '<record>') {
  const errors = [];
  if (record.schema_version !== 'project-state-record/v2') {
    errors.push(`${file}: schema_version must be project-state-record/v2`);
  }
  if (!record.project || typeof record.project !== 'object' || Array.isArray(record.project)) {
    errors.push(`${file}: project must be an object`);
  } else {
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
  }
  validateString(record, 'active_iteration_ref', errors, file);
  if (!Array.isArray(record.active_case_refs)) {
    errors.push(`${file}: active_case_refs must be an array`);
  }
  if (!record.completeness_dimensions || typeof record.completeness_dimensions !== 'object' || Array.isArray(record.completeness_dimensions)) {
    errors.push(`${file}: completeness_dimensions must be an object`);
  } else {
    for (const key of COMPLETENESS_DIMENSION_KEYS) {
      validateDimension(record.completeness_dimensions[key], key, errors, file);
    }
  }
  if (!Array.isArray(record.state_gaps)) {
    errors.push(`${file}: state_gaps must be an array`);
  } else {
    record.state_gaps.forEach((gap, index) => validateStateGap(gap, index, errors, file));
  }
  if (!record.loop_control || typeof record.loop_control !== 'object' || Array.isArray(record.loop_control)) {
    errors.push(`${file}: loop_control must be an object`);
  } else {
    for (const key of ['current_loop_focus', 'next_transition', 'priority_basis', 'stop_condition']) {
      if (typeof record.loop_control[key] !== 'string') {
        errors.push(`${file}: loop_control.${key} must be a string`);
      }
    }
  }
  for (const key of ['active_constraints', 'open_questions', 'canonical_artifact_refs']) {
    if (!Array.isArray(record[key])) {
      errors.push(`${file}: ${key} must be an array`);
    }
  }
  if (!record.last_state_delta || typeof record.last_state_delta !== 'object' || Array.isArray(record.last_state_delta)) {
    errors.push(`${file}: last_state_delta must be an object`);
  } else {
    for (const key of ['changed_dimensions', 'state_transitions', 'deferred_dimensions', 'blocked_dimensions']) {
      if (!Array.isArray(record.last_state_delta[key])) {
        errors.push(`${file}: last_state_delta.${key} must be an array`);
      }
    }
    if (typeof record.last_state_delta.next_loop_focus !== 'string') {
      errors.push(`${file}: last_state_delta.next_loop_focus must be a string`);
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
    loop_control: record.loop_control || {},
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

function commandMigrate(args) {
  ensureDirs();
  const file = path.resolve(args._[1] || STATE_PATH);
  const { record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  writeRecord(record);
  writeStateProjection(record);
  console.log(STATE_RECORD_PATH);
}

function commandRender(args) {
  ensureDirs();
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  writeStateProjection(record);
  console.log(STATE_PATH);
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
  const errors = validateRecord(record, recordFile || file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`${recordFile || file}: ok`);
}

function commandSummary(args) {
  const file = path.resolve(args._[1] || STATE_RECORD_PATH);
  const { record, recordFile } = readRecord(file);
  const errors = validateRecord(record, recordFile || file);
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
  if (command === 'migrate') return commandMigrate(args);
  if (command === 'render') return commandRender(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'summary') return commandSummary(args);
  usage(1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
