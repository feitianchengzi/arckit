#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const ITERATIONS_DIR = path.join(PROJECT_ROOT, 'iterations');
const INDEX_PATH = path.join(PROJECT_ROOT, 'ITERATIONS.md');

const ITERATION_KEYS = new Set([
  'schema_version', 'id', 'title', 'status', 'created_at', 'updated_at', 'iteration_goal',
  'project_state_ref', 'target_project_states', 'accepted_project_changes', 'acceptance',
  'blocking_project_gaps', 'active_case_refs', 'closed_case_refs', 'close_condition',
  'last_case_aggregation',
]);
const PROJECT_DIMENSIONS = new Set([
  'project_intent', 'users_and_stakeholders', 'problem_scenarios', 'product_behavior',
  'user_experience', 'runtime_surfaces', 'identity_access', 'data_state',
  'integration_boundaries', 'architecture_foundation', 'implementation_coverage',
  'quality_validation', 'security_privacy', 'delivery_operation',
  'observability_support', 'maintainability_handoff', 'iteration_governance',
]);
const VALID_ITERATION_STATUS = new Set(['planned', 'active', 'blocked', 'closed']);
const VALID_STATE_VALUE = new Set([
  'unknown', 'not_required', 'needed', 'defined', 'designed', 'implemented', 'integrated',
  'verified', 'accepted', 'released', 'operational', 'deferred', 'blocked',
]);
const VALID_ACCEPTANCE_STATUS = new Set(['working', 'verified', 'accepted', 'blocked']);

function usage(exitCode = 0) {
  console.log([
    'Usage:',
    '  node <skill-dir>/scripts/project-iteration.mjs new --title "Title" [--goal "..."]',
    '  node <skill-dir>/scripts/project-iteration.mjs render <record-file>',
    '  node <skill-dir>/scripts/project-iteration.mjs audit [record-file|iteration-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs validate [record-file|iteration-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs index',
  ].join('\n'));
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function ensureDirs() {
  fs.mkdirSync(ITERATIONS_DIR, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function todayCompact() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'project-iteration';
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function sortedUnique(values) {
  return unique(values).sort();
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

function projectionPathForRecord(file) {
  return file.endsWith('.record.json') ? file.replace(/\.record\.json$/, '.md') : file;
}

function recordPathForProjection(file) {
  return file.endsWith('.md') ? file.replace(/\.md$/, '.record.json') : file;
}

function listIterationRecordFiles() {
  ensureDirs();
  return fs.readdirSync(ITERATIONS_DIR)
    .filter((name) => name.endsWith('.record.json'))
    .map((name) => path.join(ITERATIONS_DIR, name))
    .sort();
}

function nextIterationId() {
  const date = todayCompact();
  const used = listIterationRecordFiles()
    .map((file) => path.basename(file).match(new RegExp(`^ITER-${date}-(\\d{3})`)))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return `ITER-${date}-${String(used.length === 0 ? 1 : Math.max(...used) + 1).padStart(3, '0')}`;
}

function createRecord({ title, goal = '' }) {
  const timestamp = nowIso();
  return {
    schema_version: 'iteration-state-record/v2',
    id: nextIterationId(),
    title,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
    iteration_goal: goal,
    project_state_ref: 'arckit/project/state.record.json',
    target_project_states: [],
    accepted_project_changes: [],
    acceptance: { status: 'working', evidence: [], remaining_project_gaps: [] },
    blocking_project_gaps: [],
    active_case_refs: [],
    closed_case_refs: [],
    close_condition: '',
    last_case_aggregation: { case_ref: '', project_changes: [], evidence: [], updated_at: timestamp },
  };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error.message}`);
  }
}

function resolveRecordPathFromProjection(text, file) {
  const match = text.match(/^Canonical Record:\s*(.+)$/m);
  if (!match?.[1]?.trim()) return null;
  return path.resolve(path.dirname(file), match[1].trim());
}

function readRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) return { text, record: readJson(file), recordFile: file, projectionFile: projectionPathForRecord(file) };
  const recordFile = resolveRecordPathFromProjection(text, file);
  if (recordFile && fs.existsSync(recordFile)) return { text, record: readJson(recordFile), recordFile, projectionFile: file };
  throw new Error(`${file}: canonical iteration state record could not be resolved`);
}

function readProjectState(record) {
  if (typeof record.project_state_ref !== 'string' || !record.project_state_ref) return null;
  const file = path.resolve(process.cwd(), record.project_state_ref);
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

export function renderIteration(record, projectState = readProjectState(record)) {
  const targetRows = (record.target_project_states || []).map((target) => ({
    ...target,
    current_state: projectState?.completeness_dimensions?.[target.dimension]?.current_state || 'unknown',
  }));
  const nextTarget = targetRows.find((target) => target.current_state !== target.target_state) || null;
  const currentChanges = (record.accepted_project_changes || []).slice(-5);
  const gapsById = new Map((projectState?.state_gaps || []).map((gap) => [gap.id, gap]));
  const remaining = (record.acceptance?.remaining_project_gaps || []).map((id) => {
    const gap = gapsById.get(id);
    return gap ? `${id}: ${gap.impact}` : id;
  });
  const readRefs = unique([
    recordPathForProjection(`${record.id}-${slugify(record.title)}.md`).split('/').pop(),
    record.project_state_ref,
    ...(record.active_case_refs || []),
    ...(record.closed_case_refs || []).slice(-3),
  ]);
  return [
    `# ${record.title}`,
    '',
    `Iteration: ${record.id}`,
    `Status: ${record.status}`,
    `Updated: ${record.updated_at}`,
    `Canonical Record: ${path.basename(recordPathForProjection(`${record.id}-${slugify(record.title)}.md`))}`,
    '',
    '## Goal',
    '',
    record.iteration_goal || 'TBD',
    '',
    '## Next Project State Target',
    '',
    `- Transition: ${nextTarget ? `${nextTarget.dimension}: ${nextTarget.current_state} -> ${nextTarget.target_state}` : 'none'}`,
    `- Why: ${nextTarget?.reason || 'All iteration target states are currently satisfied.'}`,
    '',
    '## Acceptance',
    '',
    `- Status: ${record.acceptance?.status || 'working'}`,
    `- Close condition: ${record.close_condition || 'TBD'}`,
    '',
    '## Remaining Project Gaps',
    '',
    ...(remaining.length ? remaining.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Accepted Project Changes',
    '',
    ...(currentChanges.length
      ? currentChanges.map((item) => `- ${item.dimension}: ${item.from_state} -> ${item.to_state}; Case=${item.case_ref}; ${item.reason}`)
      : ['- none']),
    '',
    '## Blocking Project Gaps',
    '',
    ...((record.blocking_project_gaps || []).length ? record.blocking_project_gaps.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Read For Precision',
    '',
    ...readRefs.map((ref) => `- ${ref}`),
    '',
    '## Notes',
    '',
    '- This Markdown file is a generated iteration decision brief.',
    '- Iteration State contains macro targets and resolved-Case aggregation only; Case handoff and Loop continuation are not stored here.',
    '- Update the canonical `*.record.json` through the development ledger and render this projection.',
    '',
  ].join('\n');
}

function writeRecord(record, file) {
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
}

function writeProjection(record, file) {
  fs.writeFileSync(file, renderIteration(record));
}

function renderIndex() {
  const records = listIterationRecordFiles().map((file) => ({ file: projectionPathForRecord(file), record: readRecord(file).record }));
  const rows = (items) => items.map(({ file, record }) => `| [${record.id}](${path.relative(PROJECT_ROOT, file)}) | ${record.status} | ${record.title} | ${record.updated_at} |`);
  return [
    '# Project Iterations',
    '',
    '`arckit/project/iterations` stores macro iteration state. Each `*.record.json` is canonical; each `.md` is a generated decision brief.',
    '',
    '## Active Iterations',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...rows(records.filter(({ record }) => record.status !== 'closed')),
    '',
    '## Closed Iterations',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...rows(records.filter(({ record }) => record.status === 'closed')),
    '',
  ].join('\n');
}

function normalizeText(value) {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

function rejectUnknownKeys(value, allowed, pathLabel, errors, file) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${file}: ${pathLabel}.${key} is not allowed`);
}

function validateTarget(item, index, errors, file) {
  const label = `target_project_states[${index}]`;
  rejectUnknownKeys(item, new Set(['dimension', 'target_state', 'reason']), label, errors, file);
  if (!PROJECT_DIMENSIONS.has(item?.dimension)) errors.push(`${file}: ${label}.dimension is invalid`);
  if (!VALID_STATE_VALUE.has(item?.target_state)) errors.push(`${file}: ${label}.target_state is invalid`);
  if (typeof item?.reason !== 'string' || !item.reason) errors.push(`${file}: ${label}.reason must be non-empty`);
}

function validateAcceptedChange(item, index, errors, file) {
  const label = `accepted_project_changes[${index}]`;
  rejectUnknownKeys(item, new Set(['dimension', 'from_state', 'to_state', 'reason', 'evidence', 'case_ref']), label, errors, file);
  if (!PROJECT_DIMENSIONS.has(item?.dimension)) errors.push(`${file}: ${label}.dimension is invalid`);
  if (!VALID_STATE_VALUE.has(item?.from_state) || !VALID_STATE_VALUE.has(item?.to_state)) errors.push(`${file}: ${label} states are invalid`);
  if (item?.from_state === item?.to_state) errors.push(`${file}: ${label} must change state`);
  if (typeof item?.reason !== 'string' || !item.reason) errors.push(`${file}: ${label}.reason must be non-empty`);
  if (!Array.isArray(item?.evidence) || item.evidence.length === 0) errors.push(`${file}: ${label}.evidence must be non-empty`);
  else validateStringArray(item.evidence, `${label}.evidence`, errors, file, { nonEmpty: true, unique: true });
  for (const evidence of Array.isArray(item?.evidence) ? item.evidence : []) if (isVolatileEvidenceRef(evidence)) errors.push(`${file}: ${label}.evidence contains volatile ref: ${evidence}`);
  if (typeof item?.case_ref !== 'string' || !item.case_ref.includes('/closed/')) errors.push(`${file}: ${label}.case_ref must reference a closed Case`);
}

export function validateIterationStateRecord(record, file = '<record>') {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [`${file}: iteration record must be an object`];
  rejectUnknownKeys(record, ITERATION_KEYS, 'record', errors, file);
  if (record.schema_version !== 'iteration-state-record/v2') errors.push(`${file}: schema_version must be iteration-state-record/v2`);
  if (!/^ITER-\d{8}-\d{3}$/.test(record.id || '')) errors.push(`${file}: id must match ITER-YYYYMMDD-###`);
  for (const key of ['title', 'created_at', 'updated_at', 'iteration_goal', 'project_state_ref', 'close_condition']) {
    if (typeof record[key] !== 'string') errors.push(`${file}: ${key} must be a string`);
  }
  for (const key of ['title', 'created_at', 'updated_at', 'project_state_ref']) if (typeof record[key] === 'string' && !record[key]) errors.push(`${file}: ${key} must be non-empty`);
  if (!VALID_ITERATION_STATUS.has(record.status)) errors.push(`${file}: status is invalid`);
  for (const key of ['target_project_states', 'accepted_project_changes']) {
    if (!Array.isArray(record[key])) errors.push(`${file}: ${key} must be an array`);
  }
  for (const key of ['blocking_project_gaps', 'active_case_refs', 'closed_case_refs']) validateStringArray(record[key], key, errors, file, { nonEmpty: true, unique: true });
  const targets = Array.isArray(record.target_project_states) ? record.target_project_states : [];
  targets.forEach((item, index) => validateTarget(item, index, errors, file));
  const targetDimensions = targets.map((item) => item?.dimension).filter(Boolean);
  if (new Set(targetDimensions).size !== targetDimensions.length) errors.push(`${file}: target_project_states dimensions must be unique`);
  const acceptedChanges = Array.isArray(record.accepted_project_changes) ? record.accepted_project_changes : [];
  acceptedChanges.forEach((item, index) => validateAcceptedChange(item, index, errors, file));
  if (!record.acceptance || typeof record.acceptance !== 'object' || Array.isArray(record.acceptance)) {
    errors.push(`${file}: acceptance must be an object`);
  } else {
    rejectUnknownKeys(record.acceptance, new Set(['status', 'evidence', 'remaining_project_gaps']), 'acceptance', errors, file);
    if (!VALID_ACCEPTANCE_STATUS.has(record.acceptance.status)) errors.push(`${file}: acceptance.status is invalid`);
    validateStringArray(record.acceptance.evidence, 'acceptance.evidence', errors, file, { nonEmpty: true, unique: true });
    for (const evidence of Array.isArray(record.acceptance.evidence) ? record.acceptance.evidence : []) if (isVolatileEvidenceRef(evidence)) errors.push(`${file}: acceptance.evidence contains volatile ref: ${evidence}`);
    validateStringArray(record.acceptance.remaining_project_gaps, 'acceptance.remaining_project_gaps', errors, file, { nonEmpty: true, unique: true });
  }
  if (!record.last_case_aggregation || typeof record.last_case_aggregation !== 'object' || Array.isArray(record.last_case_aggregation)) {
    errors.push(`${file}: last_case_aggregation must be an object`);
  } else {
    rejectUnknownKeys(record.last_case_aggregation, new Set(['case_ref', 'project_changes', 'evidence', 'updated_at']), 'last_case_aggregation', errors, file);
    if (typeof record.last_case_aggregation.case_ref !== 'string') errors.push(`${file}: last_case_aggregation.case_ref must be a string`);
    if (!Array.isArray(record.last_case_aggregation.project_changes)) errors.push(`${file}: last_case_aggregation.project_changes must be an array`);
    validateStringArray(record.last_case_aggregation.evidence, 'last_case_aggregation.evidence', errors, file, { nonEmpty: true, unique: true });
    for (const evidence of Array.isArray(record.last_case_aggregation.evidence) ? record.last_case_aggregation.evidence : []) if (isVolatileEvidenceRef(evidence)) errors.push(`${file}: last_case_aggregation.evidence contains volatile ref: ${evidence}`);
    if (typeof record.last_case_aggregation.updated_at !== 'string' || !record.last_case_aggregation.updated_at) errors.push(`${file}: last_case_aggregation.updated_at must be non-empty`);
    for (const [index, change] of (Array.isArray(record.last_case_aggregation.project_changes) ? record.last_case_aggregation.project_changes : []).entries()) {
      rejectUnknownKeys(change, new Set(['dimension', 'from_state', 'to_state']), `last_case_aggregation.project_changes[${index}]`, errors, file);
      if (!PROJECT_DIMENSIONS.has(change?.dimension) || !VALID_STATE_VALUE.has(change?.from_state) || !VALID_STATE_VALUE.has(change?.to_state) || change.from_state === change.to_state) errors.push(`${file}: last_case_aggregation.project_changes[${index}] is invalid`);
    }
  }
  return errors;
}

export function auditIterationStateRecord(record, recordFile, projectionFile = projectionPathForRecord(recordFile)) {
  const errors = validateIterationStateRecord(record, recordFile);
  if (errors.length) return errors;
  const projectState = readProjectState(record);
  if (!projectState) {
    errors.push(`${recordFile}: project_state_ref does not exist: ${record.project_state_ref}`);
    return errors;
  }
  if (projectState.schema_version !== 'project-state-record/v4') errors.push(`${recordFile}: project_state_ref must use project-state-record/v4`);
  const relativeRecord = path.relative(process.cwd(), recordFile);
  if (record.status === 'active' && projectState.active_iteration_ref !== relativeRecord) errors.push(`${recordFile}: active iteration must match Project active_iteration_ref`);
  if (JSON.stringify(sortedUnique(record.active_case_refs)) !== JSON.stringify(sortedUnique(projectState.active_case_refs))) errors.push(`${recordFile}: active_case_refs must match Project active_case_refs`);
  for (const ref of record.active_case_refs || []) {
    if (typeof ref !== 'string') continue;
    if (!ref.includes('/active/') || !fs.existsSync(path.resolve(process.cwd(), ref))) errors.push(`${recordFile}: invalid active_case_ref: ${ref}`);
  }
  for (const ref of record.closed_case_refs || []) {
    if (typeof ref !== 'string') continue;
    if (!ref.includes('/closed/') || !fs.existsSync(path.resolve(process.cwd(), ref))) errors.push(`${recordFile}: invalid closed_case_ref: ${ref}`);
  }
  for (const target of record.target_project_states || []) {
    const dimension = projectState.completeness_dimensions?.[target.dimension];
    if (!dimension) errors.push(`${recordFile}: target dimension is absent from Project State: ${target.dimension}`);
    else if (dimension.target_state !== target.target_state) errors.push(`${recordFile}: target ${target.dimension} must match Project target_state=${dimension.target_state}`);
  }
  const projectGapIds = new Set((projectState.state_gaps || []).map((gap) => gap.id));
  for (const gap of record.acceptance?.remaining_project_gaps || []) if (!projectGapIds.has(gap)) errors.push(`${recordFile}: unknown remaining_project_gap: ${gap}`);
  for (const gap of record.blocking_project_gaps || []) if (!projectGapIds.has(gap)) errors.push(`${recordFile}: unknown blocking_project_gap: ${gap}`);
  for (const change of record.accepted_project_changes || []) {
    if (!(record.closed_case_refs || []).includes(change.case_ref)) errors.push(`${recordFile}: accepted change Case is not in closed_case_refs: ${change.case_ref}`);
  }
  if (record.last_case_aggregation.case_ref && !(record.closed_case_refs || []).includes(record.last_case_aggregation.case_ref)) errors.push(`${recordFile}: last_case_aggregation.case_ref must belong to closed_case_refs`);
  if (fs.existsSync(projectionFile)) {
    if (normalizeText(fs.readFileSync(projectionFile, 'utf8')) !== normalizeText(renderIteration(record, projectState))) errors.push(`${projectionFile}: projection is stale; run project-iteration.mjs render`);
  } else errors.push(`${projectionFile}: missing projection; run project-iteration.mjs render`);
  if (!fs.existsSync(INDEX_PATH)) errors.push(`${INDEX_PATH}: missing iteration index; run project-iteration.mjs index`);
  else if (normalizeText(fs.readFileSync(INDEX_PATH, 'utf8')) !== normalizeText(renderIndex())) errors.push(`${INDEX_PATH}: iteration index is stale; run project-iteration.mjs index`);
  return errors;
}

function commandNew(args) {
  ensureDirs();
  if (!args.title) throw new Error('new requires --title');
  const record = createRecord({ title: args.title, goal: args.goal || '' });
  const basename = `${record.id}-${slugify(record.title)}`;
  const recordFile = path.join(ITERATIONS_DIR, `${basename}.record.json`);
  writeRecord(record, recordFile);
  writeProjection(record, projectionPathForRecord(recordFile));
  fs.writeFileSync(INDEX_PATH, renderIndex());
  console.log(projectionPathForRecord(recordFile));
}

function commandRender(args) {
  if (!args._[1]) throw new Error('render requires a record-file');
  const { record, recordFile } = readRecord(path.resolve(args._[1]));
  const errors = validateIterationStateRecord(record, recordFile);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  writeProjection(record, projectionPathForRecord(recordFile));
  console.log(projectionPathForRecord(recordFile));
}

function commandValidate(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listIterationRecordFiles();
  let failed = false;
  if (!files.length) console.log('No iteration records found.');
  for (const file of files) {
    const { record, recordFile } = readRecord(file);
    const errors = validateIterationStateRecord(record, recordFile);
    if (errors.length) {
      failed = true;
      for (const error of errors) console.error(error);
    } else console.log(`${recordFile}: ok`);
  }
  if (failed) process.exit(1);
}

function commandAudit(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listIterationRecordFiles();
  let failed = false;
  if (!files.length) console.log('No iteration records found.');
  for (const file of files) {
    const { record, recordFile, projectionFile } = readRecord(file);
    const errors = auditIterationStateRecord(record, recordFile, projectionFile);
    if (errors.length) {
      failed = true;
      for (const error of errors) console.error(error);
    } else console.log(`${recordFile}: audit ok`);
  }
  if (failed) process.exit(1);
}

function commandIndex() {
  ensureDirs();
  fs.writeFileSync(INDEX_PATH, renderIndex());
  console.log(INDEX_PATH);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command || command === 'help' || command === '--help') usage(0);
  if (command === 'new') return commandNew(args);
  if (command === 'render') return commandRender(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'index') return commandIndex();
  usage(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
