#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const STATE_PATH = path.join(PROJECT_ROOT, 'STATE.md');

const VALID_STRUCTURE_STATUS = new Set([
  'unknown',
  'needed',
  'satisfied',
  'not_applicable',
  'deferred',
  'blocked',
]);
const VALID_EVIDENCE_MATURITY = new Set(['none', 'exploratory', 'confirmed', 'formalized']);
const VALID_PROJECT_STATUS = new Set(['active', 'paused', 'archived']);

const DIMENSION_KEYS = [
  'project_goal',
  'target_users',
  'core_scenarios',
  'platform_targets',
  'client_surface',
  'server_need',
  'account_identity',
  'data_persistence',
  'sync_collaboration',
  'deployment_distribution',
  'quality_bar',
  'technical_foundation',
  'iteration_strategy',
];

function usage(exitCode = 0) {
  const message = [
    'Usage:',
    '  node <skill-dir>/scripts/project-state.mjs init --name "Project Name" [--intent "..."]',
    '  node <skill-dir>/scripts/project-state.mjs validate [state-file]',
    '  node <skill-dir>/scripts/project-state.mjs summary [state-file]',
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

function defaultDimension(status = 'unknown', reason = '') {
  return {
    status,
    reason,
    evidence: [],
    evidence_maturity: 'none',
    next: '',
  };
}

function createRecord({ name, intent = '' }) {
  const timestamp = nowIso();
  return {
    schema_version: 'project-state-record/v1',
    project: {
      name,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp,
      original_intent: intent,
    },
    active_iteration_ref: '',
    active_case_refs: [],
    dimensions: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, defaultDimension()])),
    decisions: [],
    open_questions: [],
    project_memory: [],
    artifacts: [],
    last_project_state_delta: {
      changed: [],
      unchanged_unknown: DIMENSION_KEYS,
      deferred: [],
      blocked: [],
      next_project_question: '',
      updated_at: timestamp,
    },
  };
}

function renderState(record) {
  return [
    `# ${record.project.name} Project State`,
    '',
    `Status: ${record.project.status}`,
    `Updated: ${record.project.updated_at}`,
    '',
    '## Purpose',
    '',
    record.project.original_intent || 'TBD',
    '',
    '## Structured Record',
    '',
    '```json',
    JSON.stringify(record, null, 2),
    '```',
    '',
    '## Notes',
    '',
    '- Project state tracks the continuous software project context across cases, iterations, and restarted agent conversations.',
    '',
  ].join('\n');
}

function extractRecord(text, file) {
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error(`${file}: missing Structured Record json block`);
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error.message}`);
  }
}

function readRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  return { text, record: extractRecord(text, file) };
}

function validateRecord(record, file = '<record>') {
  const errors = [];
  if (record.schema_version !== 'project-state-record/v1') {
    errors.push(`${file}: schema_version must be project-state-record/v1`);
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
  if (!Array.isArray(record.active_case_refs)) {
    errors.push(`${file}: active_case_refs must be an array`);
  }
  if (!record.dimensions || typeof record.dimensions !== 'object' || Array.isArray(record.dimensions)) {
    errors.push(`${file}: dimensions must be an object`);
  } else {
    for (const key of DIMENSION_KEYS) {
      const item = record.dimensions[key];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`${file}: dimensions.${key} is required`);
        continue;
      }
      if (!VALID_STRUCTURE_STATUS.has(item.status)) {
        errors.push(`${file}: dimensions.${key}.status must be one of ${Array.from(VALID_STRUCTURE_STATUS).join(', ')}`);
      }
      if (!Array.isArray(item.evidence)) {
        errors.push(`${file}: dimensions.${key}.evidence must be an array`);
      }
      if (
        item.evidence_maturity !== undefined &&
        !VALID_EVIDENCE_MATURITY.has(item.evidence_maturity)
      ) {
        errors.push(`${file}: dimensions.${key}.evidence_maturity must be one of ${Array.from(VALID_EVIDENCE_MATURITY).join(', ')}`);
      }
      if (typeof item.reason !== 'string') {
        errors.push(`${file}: dimensions.${key}.reason must be a string`);
      }
      if (typeof item.next !== 'string') {
        errors.push(`${file}: dimensions.${key}.next must be a string`);
      }
    }
  }
  for (const key of ['decisions', 'open_questions', 'project_memory', 'artifacts']) {
    if (!Array.isArray(record[key])) {
      errors.push(`${file}: ${key} must be an array`);
    }
  }
  if (
    record.last_project_state_delta !== undefined &&
    (!record.last_project_state_delta || typeof record.last_project_state_delta !== 'object' || Array.isArray(record.last_project_state_delta))
  ) {
    errors.push(`${file}: last_project_state_delta must be an object when present`);
  }
  return errors;
}

function summarize(record) {
  const dimensions = Object.entries(record.dimensions || {}).map(([key, value]) => ({
    key,
    status: value.status,
    evidence_maturity: value.evidence_maturity || 'none',
    next: value.next || '',
  }));
  return {
    project: record.project?.name || '',
    status: record.project?.status || '',
    updated_at: record.project?.updated_at || '',
    active_iteration_ref: record.active_iteration_ref || '',
    active_case_refs: record.active_case_refs || [],
    dimensions,
    open_questions: record.open_questions || [],
    last_project_state_delta: record.last_project_state_delta || {},
  };
}

function commandInit(args) {
  ensureDirs();
  if (fs.existsSync(STATE_PATH)) {
    console.log(STATE_PATH);
    return;
  }
  const name = args.name;
  if (!name) throw new Error('init requires --name');
  const record = createRecord({ name, intent: args.intent || '' });
  fs.writeFileSync(STATE_PATH, renderState(record));
  console.log(STATE_PATH);
}

function commandValidate(args) {
  const file = path.resolve(args._[1] || STATE_PATH);
  const { record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`${file}: ok`);
}

function commandSummary(args) {
  const file = path.resolve(args._[1] || STATE_PATH);
  const { record } = readRecord(file);
  const errors = validateRecord(record, file);
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
