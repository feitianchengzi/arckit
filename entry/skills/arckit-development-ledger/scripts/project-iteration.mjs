#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const ITERATIONS_DIR = path.join(PROJECT_ROOT, 'iterations');
const INDEX_PATH = path.join(PROJECT_ROOT, 'ITERATIONS.md');

const VALID_ITERATION_STATUS = new Set(['planned', 'active', 'blocked', 'deferred', 'closed']);
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
const VALID_ACCEPTANCE_STATE = new Set(['unknown', 'defined', 'implemented', 'verified', 'accepted', 'blocked']);

function usage(exitCode = 0) {
  const message = [
    'Usage:',
    '  node <skill-dir>/scripts/project-iteration.mjs new --title "Title" [--goal "..."]',
    '  node <skill-dir>/scripts/project-iteration.mjs migrate [legacy-iteration-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs render [record-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs audit [record-file|iteration-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs validate [record-file|iteration-file]',
    '  node <skill-dir>/scripts/project-iteration.mjs index',
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
  fs.mkdirSync(ITERATIONS_DIR, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function todayCompact() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'project-iteration';
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

function listLegacyIterationFiles() {
  ensureDirs();
  return fs.readdirSync(ITERATIONS_DIR)
    .filter((name) => name.endsWith('.md') && !fs.existsSync(path.join(ITERATIONS_DIR, name.replace(/\.md$/, '.record.json'))))
    .map((name) => path.join(ITERATIONS_DIR, name))
    .sort();
}

function listReadableIterationRecords() {
  return [
    ...listIterationRecordFiles(),
    ...listLegacyIterationFiles(),
  ].sort();
}

function nextIterationId() {
  const date = todayCompact();
  const used = listReadableIterationRecords()
    .map((file) => path.basename(file))
    .map((name) => name.match(new RegExp(`^ITER-${date}-(\\d{3})`)))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  const next = used.length === 0 ? 1 : Math.max(...used) + 1;
  return `ITER-${date}-${String(next).padStart(3, '0')}`;
}

function createRecord({ title, goal = '' }) {
  const timestamp = nowIso();
  return {
    schema_version: 'iteration-state-record/v1',
    id: nextIterationId(),
    title,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
    iteration_goal: goal,
    project_state_ref: 'arckit/project/state.record.json',
    target_state_delta: [],
    current_state_delta: [],
    acceptance_state: {
      current_state: 'unknown',
      evidence: [],
      remaining_gaps: [],
    },
    blocking_gaps: [],
    active_case_refs: [],
    closed_case_refs: [],
    close_condition: '',
    last_iteration_delta: {
      changed: [],
      blocked: [],
      deferred: [],
      next_iteration_focus: '',
      updated_at: timestamp,
    },
  };
}

function renderIteration(record) {
  const latestByDimension = new Map();
  for (const item of record.current_state_delta || []) {
    latestByDimension.set(item.dimension, item);
  }
  const target = (record.target_state_delta || []).find((item) => {
    const latest = latestByDimension.get(item.dimension);
    return !latest || latest.to_state !== item.to_state;
  }) || (record.target_state_delta || [])[0] || {};
  const latestForTarget = target.dimension ? latestByDimension.get(target.dimension) : null;
  const nextTarget = target.dimension
    ? {
      ...target,
      from_state: latestForTarget?.to_state || target.from_state,
    }
    : {};
  const currentChanges = (record.current_state_delta || []).slice(-5);
  const remaining = record.acceptance_state?.remaining_gaps || [];
  const readRefs = [
    recordPathForProjection(`${record.id}-${slugify(record.title)}.md`).split('/').pop(),
    record.project_state_ref,
    ...(record.active_case_refs || []),
    ...(record.closed_case_refs || []).slice(-3),
  ].filter(Boolean);
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
    '## Next State Transition',
    '',
    `- Transition: ${nextTarget.dimension ? `${nextTarget.dimension}: ${nextTarget.from_state} -> ${nextTarget.to_state}` : 'TBD'}`,
    `- Why: ${nextTarget.reason || 'TBD'}`,
    '',
    '## Acceptance',
    '',
    `- Current state: ${record.acceptance_state?.current_state || 'unknown'}`,
    `- Close condition: ${record.close_condition || 'TBD'}`,
    '',
    '## Remaining Gaps',
    '',
    ...(remaining.length > 0 ? remaining.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Recent State Changes',
    '',
    ...(currentChanges.length > 0
      ? currentChanges.map((item) => `- ${item.dimension}: ${item.from_state} -> ${item.to_state}; ${item.reason || ''}`)
      : ['- none']),
    '',
    '## Blocking Gaps',
    '',
    ...((record.blocking_gaps || []).length > 0 ? record.blocking_gaps.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Read For Precision',
    '',
    ...readRefs.map((ref) => `- ${ref}`),
    '',
    '## Notes',
    '',
    '- This Markdown file is a generated iteration decision brief.',
    '- Update the canonical `*.record.json` file and render this projection.',
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

function resolveRecordPathFromProjection(text, file) {
  const match = text.match(/^Canonical Record:\s*(.+)$/m);
  if (!match) return null;
  const ref = match[1].trim();
  if (!ref) return null;
  return path.resolve(path.dirname(file), ref);
}

function readRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    return { text, record: readJsonRecord(file), recordFile: file, projectionFile: projectionPathForRecord(file) };
  }
  const recordPath = resolveRecordPathFromProjection(text, file);
  if (recordPath && fs.existsSync(recordPath)) {
    return { text, record: readJsonRecord(recordPath), recordFile: recordPath, projectionFile: file };
  }
  return { text, record: extractRecordFromMarkdown(text, file), recordFile: file, projectionFile: file };
}

function writeRecord(record, file) {
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
}

function writeProjection(record, file) {
  fs.writeFileSync(file, renderIteration(record));
}

function renderIndex() {
  ensureDirs();
  const records = listReadableIterationRecords().map((file) => {
    const { record, recordFile } = readRecord(file);
    return { file: projectionPathForRecord(recordFile), record };
  });
  const active = records.filter(({ record }) => record.status !== 'closed');
  const closed = records.filter(({ record }) => record.status === 'closed');
  const rows = (items) => items.map(({ file, record }) => {
    const rel = path.relative(PROJECT_ROOT, file);
    return `| [${record.id}](${rel}) | ${record.status} | ${record.title} | ${record.updated_at} |`;
  });
  return [
    '# Project Iterations',
    '',
    '`arckit/project/iterations` stores iteration state. Each `*.record.json` is canonical; each `.md` file is a generated iteration decision brief.',
    '',
    '## Active Iterations',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...rows(active),
    '',
    '## Closed Iterations',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...rows(closed),
    '',
  ].join('\n');
}

function writeIndex() {
  fs.writeFileSync(INDEX_PATH, renderIndex());
}

function normalizeText(value) {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

function validateTransition(item, pathLabel, errors, file) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${file}: ${pathLabel} must be an object`);
    return;
  }
  if (typeof item.dimension !== 'string' || item.dimension.length === 0) {
    errors.push(`${file}: ${pathLabel}.dimension must be a non-empty string`);
  }
  if (!VALID_STATE_VALUE.has(item.from_state)) {
    errors.push(`${file}: ${pathLabel}.from_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  if (!VALID_STATE_VALUE.has(item.to_state)) {
    errors.push(`${file}: ${pathLabel}.to_state must be one of ${Array.from(VALID_STATE_VALUE).join(', ')}`);
  }
  if (typeof item.reason !== 'string') {
    errors.push(`${file}: ${pathLabel}.reason must be a string`);
  }
  if (item.evidence !== undefined && !Array.isArray(item.evidence)) {
    errors.push(`${file}: ${pathLabel}.evidence must be an array when present`);
  }
}

function validateRecord(record, file = '<record>') {
  const errors = [];
  for (const key of ['schema_version', 'id', 'title', 'status', 'created_at', 'updated_at', 'iteration_goal', 'project_state_ref', 'close_condition']) {
    if (typeof record[key] !== 'string') {
      errors.push(`${file}: ${key} must be a string`);
    }
  }
  if (record.schema_version !== 'iteration-state-record/v1') {
    errors.push(`${file}: schema_version must be iteration-state-record/v1`);
  }
  if (!/^ITER-\d{8}-\d{3}$/.test(record.id || '')) {
    errors.push(`${file}: id must match ITER-YYYYMMDD-###`);
  }
  if (!VALID_ITERATION_STATUS.has(record.status)) {
    errors.push(`${file}: status must be one of ${Array.from(VALID_ITERATION_STATUS).join(', ')}`);
  }
  for (const key of ['target_state_delta', 'current_state_delta', 'blocking_gaps', 'active_case_refs']) {
    if (!Array.isArray(record[key])) {
      errors.push(`${file}: ${key} must be an array`);
    }
  }
  if (record.closed_case_refs !== undefined && !Array.isArray(record.closed_case_refs)) {
    errors.push(`${file}: closed_case_refs must be an array when present`);
  }
  if (Array.isArray(record.target_state_delta)) {
    record.target_state_delta.forEach((item, index) => validateTransition(item, `target_state_delta[${index}]`, errors, file));
  }
  if (Array.isArray(record.current_state_delta)) {
    record.current_state_delta.forEach((item, index) => validateTransition(item, `current_state_delta[${index}]`, errors, file));
  }
  if (!record.acceptance_state || typeof record.acceptance_state !== 'object' || Array.isArray(record.acceptance_state)) {
    errors.push(`${file}: acceptance_state must be an object`);
  } else {
    if (!VALID_ACCEPTANCE_STATE.has(record.acceptance_state.current_state)) {
      errors.push(`${file}: acceptance_state.current_state must be one of ${Array.from(VALID_ACCEPTANCE_STATE).join(', ')}`);
    }
    if (!Array.isArray(record.acceptance_state.evidence)) {
      errors.push(`${file}: acceptance_state.evidence must be an array`);
    }
    if (!Array.isArray(record.acceptance_state.remaining_gaps)) {
      errors.push(`${file}: acceptance_state.remaining_gaps must be an array`);
    }
  }
  if (!record.last_iteration_delta || typeof record.last_iteration_delta !== 'object' || Array.isArray(record.last_iteration_delta)) {
    errors.push(`${file}: last_iteration_delta must be an object`);
  } else {
    for (const key of ['changed', 'blocked', 'deferred']) {
      if (!Array.isArray(record.last_iteration_delta[key])) {
        errors.push(`${file}: last_iteration_delta.${key} must be an array`);
      }
    }
    if (typeof record.last_iteration_delta.next_iteration_focus !== 'string') {
      errors.push(`${file}: last_iteration_delta.next_iteration_focus must be a string`);
    }
    if (typeof record.last_iteration_delta.updated_at !== 'string') {
      errors.push(`${file}: last_iteration_delta.updated_at must be a string`);
    }
  }
  return errors;
}

function auditRecord(record, recordFile, projectionFile) {
  const errors = validateRecord(record, recordFile);
  const expectedProjection = projectionPathForRecord(recordFile);
  const file = projectionFile || expectedProjection;
  if (fs.existsSync(file)) {
    if (normalizeText(fs.readFileSync(file, 'utf8')) !== normalizeText(renderIteration(record))) {
      errors.push(`${file}: projection is stale; run project-iteration.mjs render`);
    }
  } else {
    errors.push(`${file}: missing projection; run project-iteration.mjs render`);
  }
  if (record.project_state_ref && !fs.existsSync(path.resolve(process.cwd(), record.project_state_ref))) {
    errors.push(`${recordFile}: project_state_ref does not exist: ${record.project_state_ref}`);
  }
  for (const ref of record.active_case_refs || []) {
    if (!fs.existsSync(path.resolve(process.cwd(), ref))) {
      errors.push(`${recordFile}: active_case_ref does not exist: ${ref}`);
    }
    if (!ref.includes('/active/')) {
      errors.push(`${recordFile}: active_case_ref should point under arckit/cases/active: ${ref}`);
    }
  }
  if (!fs.existsSync(INDEX_PATH)) {
    errors.push(`${INDEX_PATH}: missing iteration index; run project-iteration.mjs index`);
  } else if (normalizeText(fs.readFileSync(INDEX_PATH, 'utf8')) !== normalizeText(renderIndex())) {
    errors.push(`${INDEX_PATH}: iteration index is stale; run project-iteration.mjs index`);
  }
  return errors;
}

function commandNew(args) {
  ensureDirs();
  if (!args.title) throw new Error('new requires --title');
  const record = createRecord({ title: args.title, goal: args.goal || '' });
  const basename = `${record.id}-${slugify(record.title)}`;
  const recordFile = path.join(ITERATIONS_DIR, `${basename}.record.json`);
  const projectionFile = path.join(ITERATIONS_DIR, `${basename}.md`);
  writeRecord(record, recordFile);
  writeProjection(record, projectionFile);
  writeIndex();
  console.log(projectionFile);
}

function commandMigrate(args) {
  ensureDirs();
  const file = args._[1] ? path.resolve(args._[1]) : null;
  if (!file) throw new Error('migrate requires a legacy iteration file');
  const { record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  if (record.project_state_ref === 'arckit/project/STATE.md') {
    record.project_state_ref = 'arckit/project/state.record.json';
  }
  const recordFile = recordPathForProjection(file);
  writeRecord(record, recordFile);
  writeProjection(record, projectionPathForRecord(recordFile));
  writeIndex();
  console.log(recordFile);
}

function commandRender(args) {
  const file = path.resolve(args._[1] || '');
  if (!args._[1]) throw new Error('render requires a record-file');
  const { record, recordFile } = readRecord(file);
  const errors = validateRecord(record, recordFile);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  const projectionFile = projectionPathForRecord(recordFile);
  writeProjection(record, projectionFile);
  console.log(projectionFile);
}

function commandValidate(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listReadableIterationRecords();
  if (files.length === 0) {
    console.log('No iteration records found.');
    return;
  }
  let failed = false;
  for (const file of files) {
    const { record, recordFile } = readRecord(file);
    const errors = validateRecord(record, recordFile);
    if (errors.length > 0) {
      failed = true;
      for (const error of errors) console.error(error);
    } else {
      console.log(`${recordFile}: ok`);
    }
  }
  if (failed) process.exit(1);
}

function commandAudit(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listReadableIterationRecords();
  if (files.length === 0) {
    console.log('No iteration records found.');
    return;
  }
  let failed = false;
  for (const file of files) {
    const { record, recordFile, projectionFile } = readRecord(file);
    const errors = auditRecord(record, recordFile, projectionFile);
    if (errors.length > 0) {
      failed = true;
      for (const error of errors) console.error(error);
    } else {
      console.log(`${recordFile}: audit ok`);
    }
  }
  if (failed) process.exit(1);
}

function commandIndex() {
  writeIndex();
  console.log(INDEX_PATH);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command || command === 'help' || command === '--help') usage(0);
  if (command === 'new') return commandNew(args);
  if (command === 'migrate') return commandMigrate(args);
  if (command === 'render') return commandRender(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'index') return commandIndex();
  usage(1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
