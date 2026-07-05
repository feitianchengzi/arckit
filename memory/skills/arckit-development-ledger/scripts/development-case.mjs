#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const CASES_ROOT = path.join(process.cwd(), 'arckit', 'cases');
const ACTIVE_DIR = path.join(CASES_ROOT, 'active');
const CLOSED_DIR = path.join(CASES_ROOT, 'closed');
const INDEX_PATH = path.join(CASES_ROOT, 'INDEX.md');
const VALID_STRUCTURE_STATUS = new Set([
  'unknown',
  'needed',
  'satisfied',
  'not_applicable',
  'deferred',
  'blocked',
]);
const VALID_CASE_STATUS = new Set(['active', 'blocked', 'handoff', 'deferred', 'closed']);
const VALID_ARTIFACT_TYPE = new Set(['code', 'skill', 'document', 'workflow', 'mixed', 'unknown']);
const VALID_EVIDENCE_MATURITY = new Set(['none', 'exploratory', 'confirmed', 'formalized']);
const VALID_ROUTE_DECISION = new Set(['selected', 'deferred', 'not_applicable', 'blocked']);
const STRUCTURE_KEYS = [
  'product_expectation',
  'interaction_expectation',
  'visual_expectation',
  'technical_expectation',
  'implementation_state',
  'verification_state',
  'open_questions',
  'pending_handoffs',
  'workflow_memory_signals',
];
const EVIDENCE_REQUIRED_ON_SATISFIED = new Set([
  'product_expectation',
  'interaction_expectation',
  'visual_expectation',
  'technical_expectation',
  'implementation_state',
  'verification_state',
]);

function usage(exitCode = 0) {
  const message = [
    'Usage:',
    '  node <skill-dir>/scripts/development-case.mjs new --title "Title" [--artifact-type skill] [--intent "..."]',
    '  node <skill-dir>/scripts/development-case.mjs validate [case-file]',
    '  node <skill-dir>/scripts/development-case.mjs audit <case-file> [--write]',
    '  node <skill-dir>/scripts/development-case.mjs close <case-file> [--force]',
    '  node <skill-dir>/scripts/development-case.mjs index',
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
    if (key === 'write') {
      args.write = true;
      continue;
    }
    if (key === 'force') {
      args.force = true;
      continue;
    }
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
  fs.mkdirSync(ACTIVE_DIR, { recursive: true });
  fs.mkdirSync(CLOSED_DIR, { recursive: true });
  fs.mkdirSync(path.join(CASES_ROOT, 'schema'), { recursive: true });
}

function todayCompact() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'development-case';
}

function listCaseFiles() {
  ensureDirs();
  return [ACTIVE_DIR, CLOSED_DIR].flatMap((dir) =>
    fs.readdirSync(dir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.join(dir, name))
  ).sort();
}

function nextCaseId() {
  const date = todayCompact();
  const used = listCaseFiles()
    .map((file) => path.basename(file))
    .map((name) => name.match(new RegExp(`^CASE-${date}-(\\d{3})`)))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  const next = used.length === 0 ? 1 : Math.max(...used) + 1;
  return `CASE-${date}-${String(next).padStart(3, '0')}`;
}

function defaultStructure(status = 'unknown', reason = '') {
  return { status, reason, evidence: [], evidence_maturity: 'none', next: '' };
}

function defaultRoundStrategyDecision() {
  return {
    selected_route: 'unknown',
    reason: '',
    considered_routes: [],
    next_route_triggers: [],
    user_visible_summary: '',
  };
}

function defaultProjectStateDelta(timestamp = '') {
  return {
    changed: [],
    unchanged_unknown: [],
    deferred: [],
    blocked: [],
    next_project_question: '',
    updated_at: timestamp,
  };
}

function createRecord({ title, artifactType = 'unknown', intent = '' }) {
  const id = nextCaseId();
  const timestamp = nowIso();
  return {
    schema_version: 'development-case-record/v1',
    id,
    title,
    status: 'active',
    artifact_type: artifactType,
    created_at: timestamp,
    updated_at: timestamp,
    user_intent: intent,
    expected_outcome: '',
    current_round_goal: '',
    current_round_gap: 'unknown',
    project_state_ref: 'arckit/project/STATE.md',
    project_state_delta: defaultProjectStateDelta(timestamp),
    round_strategy_decision: defaultRoundStrategyDecision(),
    structures: {
      product_expectation: defaultStructure(),
      interaction_expectation: defaultStructure(),
      visual_expectation: defaultStructure(),
      technical_expectation: defaultStructure(),
      implementation_state: defaultStructure(),
      verification_state: defaultStructure(),
      open_questions: defaultStructure(),
      pending_handoffs: defaultStructure(),
      workflow_memory_signals: defaultStructure(),
    },
    open_questions: [],
    decisions: [],
    pending_handoffs: [],
    workflow_memory_signals: [],
    rounds: [],
    completion_audit: {
      status: 'unknown',
      satisfied: [],
      remaining: STRUCTURE_KEYS,
      blocked: [],
      next_round_goal: '',
      updated_at: timestamp,
    },
  };
}

function renderCase(record) {
  return [
    `# ${record.title}`,
    '',
    `Case: ${record.id}`,
    `Status: ${record.status}`,
    `Artifact Type: ${record.artifact_type}`,
    `Current Gap: ${record.current_round_gap}`,
    `Updated: ${record.updated_at}`,
    '',
    '## User Intent',
    '',
    record.user_intent || 'TBD',
    '',
    '## Structured Record',
    '',
    '```json',
    JSON.stringify(record, null, 2),
    '```',
    '',
    '## Round Notes',
    '',
    '- TBD',
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

function writeRecord(file, text, record) {
  const json = JSON.stringify(record, null, 2);
  const nextText = text.replace(
    /(## Structured Record[\s\S]*?```json\s*\n)([\s\S]*?)(\n```)/,
    `$1${json}$3`
  );
  fs.writeFileSync(file, syncHeader(nextText, record));
}

function syncHeader(text, record) {
  return text
    .replace(/^Status: .*$/m, `Status: ${record.status}`)
    .replace(/^Artifact Type: .*$/m, `Artifact Type: ${record.artifact_type}`)
    .replace(/^Current Gap: .*$/m, `Current Gap: ${record.current_round_gap}`)
    .replace(/^Updated: .*$/m, `Updated: ${record.updated_at}`);
}

function validateRecord(record, file = '<record>') {
  const errors = [];
  const requireString = (key) => {
    if (typeof record[key] !== 'string' || record[key].length === 0) {
      errors.push(`${file}: ${key} must be a non-empty string`);
    }
  };

  [
    'schema_version',
    'id',
    'title',
    'status',
    'artifact_type',
    'created_at',
    'updated_at',
    'current_round_gap',
  ].forEach(requireString);

  if (record.schema_version !== 'development-case-record/v1') {
    errors.push(`${file}: schema_version must be development-case-record/v1`);
  }
  if (!/^CASE-\d{8}-\d{3}$/.test(record.id || '')) {
    errors.push(`${file}: id must match CASE-YYYYMMDD-###`);
  }
  if (!VALID_CASE_STATUS.has(record.status)) {
    errors.push(`${file}: status must be one of ${Array.from(VALID_CASE_STATUS).join(', ')}`);
  }
  if (!VALID_ARTIFACT_TYPE.has(record.artifact_type)) {
    errors.push(`${file}: artifact_type must be one of ${Array.from(VALID_ARTIFACT_TYPE).join(', ')}`);
  }
  if (record.project_state_ref !== undefined && typeof record.project_state_ref !== 'string') {
    errors.push(`${file}: project_state_ref must be a string when present`);
  }
  if (
    record.project_state_delta !== undefined &&
    (!record.project_state_delta || typeof record.project_state_delta !== 'object' || Array.isArray(record.project_state_delta))
  ) {
    errors.push(`${file}: project_state_delta must be an object when present`);
  }
  if (record.round_strategy_decision !== undefined) {
    if (
      !record.round_strategy_decision ||
      typeof record.round_strategy_decision !== 'object' ||
      Array.isArray(record.round_strategy_decision)
    ) {
      errors.push(`${file}: round_strategy_decision must be an object when present`);
    } else {
      const strategy = record.round_strategy_decision;
      if (typeof strategy.selected_route !== 'string' || strategy.selected_route.length === 0) {
        errors.push(`${file}: round_strategy_decision.selected_route must be a non-empty string`);
      }
      if (strategy.considered_routes !== undefined && !Array.isArray(strategy.considered_routes)) {
        errors.push(`${file}: round_strategy_decision.considered_routes must be an array`);
      }
      if (Array.isArray(strategy.considered_routes)) {
        strategy.considered_routes.forEach((route, index) => {
          if (!route || typeof route !== 'object' || Array.isArray(route)) {
            errors.push(`${file}: round_strategy_decision.considered_routes[${index}] must be an object`);
            return;
          }
          if (typeof route.route !== 'string' || route.route.length === 0) {
            errors.push(`${file}: round_strategy_decision.considered_routes[${index}].route must be a non-empty string`);
          }
          if (route.decision !== undefined && !VALID_ROUTE_DECISION.has(route.decision)) {
            errors.push(`${file}: round_strategy_decision.considered_routes[${index}].decision must be one of ${Array.from(VALID_ROUTE_DECISION).join(', ')}`);
          }
        });
      }
    }
  }
  if (!record.structures || typeof record.structures !== 'object' || Array.isArray(record.structures)) {
    errors.push(`${file}: structures must be an object`);
  } else {
    for (const key of STRUCTURE_KEYS) {
      const item = record.structures[key];
      if (!item || typeof item !== 'object') {
        errors.push(`${file}: structures.${key} is required`);
        continue;
      }
      if (!VALID_STRUCTURE_STATUS.has(item.status)) {
        errors.push(`${file}: structures.${key}.status must be one of ${Array.from(VALID_STRUCTURE_STATUS).join(', ')}`);
      }
      if (!Array.isArray(item.evidence)) {
        errors.push(`${file}: structures.${key}.evidence must be an array`);
      }
      if (
        item.evidence_maturity !== undefined &&
        !VALID_EVIDENCE_MATURITY.has(item.evidence_maturity)
      ) {
        errors.push(`${file}: structures.${key}.evidence_maturity must be one of ${Array.from(VALID_EVIDENCE_MATURITY).join(', ')}`);
      }
      if (['satisfied', 'not_applicable', 'deferred', 'blocked'].includes(item.status)) {
        if (typeof item.reason !== 'string' || item.reason.trim().length === 0) {
          errors.push(`${file}: structures.${key}.reason is required when status is ${item.status}`);
        }
      }
      if (item.status === 'satisfied' && EVIDENCE_REQUIRED_ON_SATISFIED.has(key) && item.evidence.length === 0) {
        errors.push(`${file}: structures.${key}.evidence must not be empty when status is satisfied`);
      }
    }
  }
  for (const key of ['open_questions', 'decisions', 'pending_handoffs', 'workflow_memory_signals', 'rounds']) {
    if (!Array.isArray(record[key])) {
      errors.push(`${file}: ${key} must be an array`);
    }
  }
  return errors;
}

function auditRecord(record) {
  const satisfied = [];
  const remaining = [];
  const blocked = [];
  for (const key of STRUCTURE_KEYS) {
    const status = record.structures?.[key]?.status;
    if (['satisfied', 'not_applicable', 'deferred'].includes(status)) {
      satisfied.push(key);
    } else if (status === 'blocked') {
      blocked.push(key);
      remaining.push(key);
    } else {
      remaining.push(key);
    }
  }
  const status = remaining.length === 0 ? 'complete' : blocked.length > 0 ? 'blocked' : 'incomplete';
  return {
    status,
    satisfied,
    remaining,
    blocked,
    next_round_goal: remaining.length > 0 ? `Resolve ${remaining[0]}` : '',
    updated_at: nowIso(),
  };
}

function commandNew(args) {
  ensureDirs();
  const title = args.title;
  if (!title) throw new Error('new requires --title');
  const artifactType = args['artifact-type'] || 'unknown';
  if (!VALID_ARTIFACT_TYPE.has(artifactType)) {
    throw new Error(`Invalid --artifact-type: ${artifactType}`);
  }
  const record = createRecord({ title, artifactType, intent: args.intent || '' });
  const file = path.join(ACTIVE_DIR, `${record.id}-${slugify(title)}.md`);
  fs.writeFileSync(file, renderCase(record));
  console.log(file);
}

function commandValidate(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listCaseFiles();
  if (files.length === 0) {
    console.log('No case files found.');
    return;
  }
  let failed = false;
  for (const file of files) {
    const { record } = readRecord(file);
    const errors = validateRecord(record, file);
    if (errors.length > 0) {
      failed = true;
      for (const error of errors) console.error(error);
    } else {
      console.log(`${file}: ok`);
    }
  }
  if (failed) process.exit(1);
}

function commandAudit(args) {
  const file = args._[1] ? path.resolve(args._[1]) : null;
  if (!file) throw new Error('audit requires a case-file');
  const { text, record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  const audit = auditRecord(record);
  console.log(JSON.stringify(audit, null, 2));
  if (args.write) {
    record.completion_audit = audit;
    record.updated_at = audit.updated_at;
    record.current_round_gap = audit.remaining[0] || 'none';
    writeRecord(file, text, record);
  }
}

function commandClose(args) {
  const file = args._[1] ? path.resolve(args._[1]) : null;
  if (!file) throw new Error('close requires a case-file');
  const { text, record } = readRecord(file);
  const errors = validateRecord(record, file);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  const audit = auditRecord(record);
  if (audit.remaining.length > 0 && !args.force) {
    throw new Error(`Case is not complete. Remaining: ${audit.remaining.join(', ')}. Use --force to close anyway.`);
  }
  record.status = 'closed';
  record.completion_audit = audit;
  record.updated_at = audit.updated_at;
  record.current_round_gap = audit.remaining[0] || 'none';
  writeRecord(file, text, record);
  ensureDirs();
  const target = path.join(CLOSED_DIR, path.basename(file));
  if (path.resolve(file) !== path.resolve(target)) {
    fs.renameSync(file, target);
  }
  commandIndex();
  console.log(target);
}

function markdownLink(file) {
  return path.relative(CASES_ROOT, file);
}

function tableEscape(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function commandIndex() {
  ensureDirs();
  const active = [];
  const closed = [];
  for (const file of listCaseFiles()) {
    const { record } = readRecord(file);
    const row = { file, record };
    if (record.status === 'closed' || file.includes(`${path.sep}closed${path.sep}`)) {
      closed.push(row);
    } else {
      active.push(row);
    }
  }
  const activeRows = active.map(({ file, record }) =>
    `| [${record.id}](${markdownLink(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.current_round_gap)} | ${tableEscape(record.updated_at)} |`
  );
  const closedRows = closed.map(({ file, record }) =>
    `| [${record.id}](${markdownLink(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.updated_at)} |`
  );
  const content = [
    '# Development Cases',
    '',
    '`arckit/cases` stores development case records under the continuous project state. A case record tracks one software development matter across rounds: the project state reference, user intent, expected outcome, current round gap, structured engineering expectations, implementation state, verification state, open questions, handoffs, project state delta, and completion audit.',
    '',
    'Use `arckit-development-ledger` to create, validate, audit, close, and re-index records.',
    '',
    '## Active Cases',
    '',
    '| ID | Status | Title | Current Gap | Updated |',
    '| --- | --- | --- | --- | --- |',
    ...activeRows,
    '',
    '## Closed Cases',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...closedRows,
    '',
  ].join('\n');
  fs.writeFileSync(INDEX_PATH, content);
  console.log(INDEX_PATH);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command || command === 'help' || command === '--help') usage(0);
  if (command === 'new') return commandNew(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'close') return commandClose(args);
  if (command === 'index') return commandIndex(args);
  usage(1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
