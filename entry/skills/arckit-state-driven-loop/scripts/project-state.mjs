#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultSoftwareDefinition, validateCoreDecisionAreas } from './project-software-definition.mjs';
import { defaultSoftwareInvariants, validateCoreSoftwareInvariants } from './project-invariants.mjs';

const PROJECT_ROOT = path.join(process.cwd(), 'arckit', 'project');
const STATE_PATH = path.join(PROJECT_ROOT, 'STATE.md');
const STATE_RECORD_PATH = path.join(PROJECT_ROOT, 'state.record.json');
const VOLATILE_PREFIXES = ['/tmp/', '/private/tmp/', '/var/folders/'];
const PROJECT_KEYS = new Set(['schema_version', 'project', 'advancement', 'software_definition', 'software_invariants']);
const PROJECT_INFO_KEYS = new Set(['name', 'status', 'intent', 'created_at', 'updated_at', 'revision']);
const ADVANCEMENT_KEYS = new Set(['active_iteration_ref', 'active_case_refs', 'project_gaps', 'selection_context']);
const AREA_KEYS = new Set(['id', 'question', 'decision_expectation', 'evidence_expectation', 'decision', 'gap_refs']);
const DECISION_KEYS = new Set(['revision', 'status', 'statement', 'reason', 'evidence', 'confidence', 'resume_condition']);
const INVARIANT_KEYS = new Set(['id', 'applies_when', 'must_hold', 'evidence_expectation', 'priority']);
const GAP_KEYS = new Set(['id', 'goal', 'reason', 'affects', 'priority_basis', 'dependencies', 'candidate_case_ref']);
const TARGET_KEYS = new Set(['kind', 'ref']);

function nowIso() { return new Date().toISOString(); }
function unique(values) { return [...new Set(values)]; }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isVolatile(ref) { return VOLATILE_PREFIXES.some((prefix) => String(ref).startsWith(prefix)); }
function normalize(text) { return String(text).replaceAll('\r\n', '\n').trim(); }

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) args._.push(token);
    else {
      const key = token.slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function rejectUnknownKeys(value, allowed, label, errors, file) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${file}: ${label}.${key} is not allowed`);
}

function validateStringArray(value, label, errors, file, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) return errors.push(`${file}: ${label} must be an array`);
  if (nonEmpty && value.length === 0) errors.push(`${file}: ${label} must not be empty`);
  if (new Set(value).size !== value.length) errors.push(`${file}: ${label} must be unique`);
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !item) errors.push(`${file}: ${label}[${index}] must be a non-empty string`);
  });
}

export function createProjectStateRecord({ name, intent = '' }) {
  const timestamp = nowIso();
  return {
    schema_version: 'project-state-record/v5',
    project: { name, status: 'active', intent, created_at: timestamp, updated_at: timestamp, revision: 0 },
    advancement: {
      active_iteration_ref: '',
      active_case_refs: [],
      project_gaps: [],
      selection_context: { current_focus: '', project_priorities: [] },
    },
    software_definition: defaultSoftwareDefinition(),
    software_invariants: defaultSoftwareInvariants(),
  };
}

export function projectTargetRefs(record) {
  return {
    software_decision: new Set((record?.software_definition?.decision_areas || []).map((area) => area.id)),
    software_invariant: new Set((record?.software_invariants || []).map((item) => item.id)),
    project_intent: new Set(['project.intent']),
  };
}

function validateDecisionArea(area, index, gapIds, errors, file) {
  const label = `software_definition.decision_areas[${index}]`;
  if (!isObject(area)) return errors.push(`${file}: ${label} must be an object`);
  rejectUnknownKeys(area, AREA_KEYS, label, errors, file);
  for (const key of ['id', 'question', 'decision_expectation', 'evidence_expectation']) if (typeof area[key] !== 'string' || !area[key]) errors.push(`${file}: ${label}.${key} must be a non-empty string`);
  validateStringArray(area.gap_refs, `${label}.gap_refs`, errors, file);
  for (const gapRef of area.gap_refs || []) if (!gapIds.has(gapRef)) errors.push(`${file}: ${label}.gap_refs references unknown Project gap ${gapRef}`);
  const decision = area.decision;
  if (!isObject(decision)) return errors.push(`${file}: ${label}.decision must be an object`);
  rejectUnknownKeys(decision, DECISION_KEYS, `${label}.decision`, errors, file);
  if (!Number.isInteger(decision.revision) || decision.revision < 0) errors.push(`${file}: ${label}.decision.revision must be a non-negative integer`);
  if (!['open', 'settled', 'deferred', 'stale'].includes(decision.status)) errors.push(`${file}: ${label}.decision.status is invalid`);
  for (const key of ['statement', 'reason', 'resume_condition']) if (typeof decision[key] !== 'string') errors.push(`${file}: ${label}.decision.${key} must be a string`);
  validateStringArray(decision.evidence, `${label}.decision.evidence`, errors, file);
  for (const ref of decision.evidence || []) if (isVolatile(ref)) errors.push(`${file}: ${label}.decision.evidence contains volatile ref: ${ref}`);
  if (!['low', 'medium', 'high'].includes(decision.confidence)) errors.push(`${file}: ${label}.decision.confidence is invalid`);
  if (decision.status === 'settled' && (!decision.statement || !decision.reason || decision.evidence.length === 0)) errors.push(`${file}: ${label}.decision settled requires statement, reason, and durable evidence`);
  if (decision.status === 'deferred' && (!decision.reason || !decision.resume_condition)) errors.push(`${file}: ${label}.decision deferred requires reason and resume_condition`);
  if (decision.status === 'stale' && area.gap_refs.length === 0) errors.push(`${file}: ${label}.decision stale requires an active Project gap`);
}

function validateInvariant(invariant, index, errors, file) {
  const label = `software_invariants[${index}]`;
  if (!isObject(invariant)) return errors.push(`${file}: ${label} must be an object`);
  rejectUnknownKeys(invariant, INVARIANT_KEYS, label, errors, file);
  for (const key of ['id', 'applies_when', 'must_hold', 'evidence_expectation']) if (typeof invariant[key] !== 'string' || !invariant[key]) errors.push(`${file}: ${label}.${key} must be a non-empty string`);
  if (!['required', 'recommended', 'informational'].includes(invariant.priority)) errors.push(`${file}: ${label}.priority is invalid`);
}

function validateProjectGap(gap, index, refs, allGapIds, errors, file) {
  const label = `advancement.project_gaps[${index}]`;
  if (!isObject(gap)) return errors.push(`${file}: ${label} must be an object`);
  rejectUnknownKeys(gap, GAP_KEYS, label, errors, file);
  for (const key of ['id', 'goal', 'reason', 'candidate_case_ref']) if (typeof gap[key] !== 'string' || (key !== 'candidate_case_ref' && !gap[key])) errors.push(`${file}: ${label}.${key} must be ${key === 'candidate_case_ref' ? 'a string' : 'a non-empty string'}`);
  if (!isObject(gap.priority_basis) || Object.keys(gap.priority_basis).length === 0) errors.push(`${file}: ${label}.priority_basis must be a non-empty object`);
  validateStringArray(gap.dependencies, `${label}.dependencies`, errors, file);
  for (const dependency of gap.dependencies || []) if (!allGapIds.has(dependency)) errors.push(`${file}: ${label}.dependencies references unknown gap ${dependency}`);
  if (!Array.isArray(gap.affects) || gap.affects.length === 0) errors.push(`${file}: ${label}.affects must be a non-empty array`);
  for (const [targetIndex, target] of (gap.affects || []).entries()) {
    const targetLabel = `${label}.affects[${targetIndex}]`;
    if (!isObject(target)) { errors.push(`${file}: ${targetLabel} must be an object`); continue; }
    rejectUnknownKeys(target, TARGET_KEYS, targetLabel, errors, file);
    if (!refs[target.kind]?.has(target.ref)) errors.push(`${file}: ${targetLabel} references unknown ${target.kind || 'target'} ${target.ref || ''}`);
  }
}

export function validateProjectStateRecord(record, file = '<record>') {
  const errors = [];
  if (!isObject(record)) return [`${file}: record must be an object`];
  if (record.schema_version !== 'project-state-record/v5') return [`${file}: schema_version must be project-state-record/v5`];
  rejectUnknownKeys(record, PROJECT_KEYS, 'record', errors, file);
  if (!isObject(record.project)) errors.push(`${file}: project must be an object`);
  else {
    rejectUnknownKeys(record.project, PROJECT_INFO_KEYS, 'project', errors, file);
    if (!record.project.name || !['active', 'paused', 'archived'].includes(record.project.status) || typeof record.project.intent !== 'string') errors.push(`${file}: project identity is invalid`);
    if (!Number.isInteger(record.project.revision) || record.project.revision < 0) errors.push(`${file}: project.revision must be a non-negative integer`);
  }
  const advancement = record.advancement;
  if (!isObject(advancement)) errors.push(`${file}: advancement must be an object`);
  else {
    rejectUnknownKeys(advancement, ADVANCEMENT_KEYS, 'advancement', errors, file);
    if (typeof advancement.active_iteration_ref !== 'string') errors.push(`${file}: advancement.active_iteration_ref must be a string`);
    validateStringArray(advancement.active_case_refs, 'advancement.active_case_refs', errors, file);
    if (!isObject(advancement.selection_context) || typeof advancement.selection_context?.current_focus !== 'string') errors.push(`${file}: advancement.selection_context is invalid`);
    else validateStringArray(advancement.selection_context.project_priorities, 'advancement.selection_context.project_priorities', errors, file);
  }
  if (!isObject(record.software_definition) || typeof record.software_definition?.summary !== 'string' || !Array.isArray(record.software_definition?.decision_areas)) errors.push(`${file}: software_definition is invalid`);
  if (!Array.isArray(record.software_invariants)) errors.push(`${file}: software_invariants must be an array`);
  const gaps = Array.isArray(advancement?.project_gaps) ? advancement.project_gaps : [];
  const gapIds = new Set(gaps.map((gap) => gap?.id).filter(Boolean));
  if (gapIds.size !== gaps.length) errors.push(`${file}: advancement.project_gaps ids must be unique`);
  const areas = record.software_definition?.decision_areas || [];
  const areaIds = areas.map((area) => area?.id);
  if (new Set(areaIds).size !== areaIds.length) errors.push(`${file}: software_definition.decision_areas ids must be unique`);
  areas.forEach((area, index) => validateDecisionArea(area, index, gapIds, errors, file));
  const invariantIds = (record.software_invariants || []).map((item) => item?.id);
  if (new Set(invariantIds).size !== invariantIds.length) errors.push(`${file}: software_invariants ids must be unique`);
  (record.software_invariants || []).forEach((item, index) => validateInvariant(item, index, errors, file));
  const refs = projectTargetRefs(record);
  gaps.forEach((gap, index) => validateProjectGap(gap, index, refs, gapIds, errors, file));
  errors.push(...validateCoreDecisionAreas(record, file), ...validateCoreSoftwareInvariants(record, file));
  return errors;
}

export function renderProjectState(record) {
  const areas = record.software_definition.decision_areas;
  const gaps = record.advancement.project_gaps;
  return [
    `# ${record.project.name} Project State`, '',
    `Status: ${record.project.status}`, `Revision: ${record.project.revision}`, `Updated: ${record.project.updated_at}`, 'Canonical Record: state.record.json', '',
    '## Project Intent', '', record.project.intent || 'TBD', '',
    '## Current Focus', '', record.advancement.selection_context.current_focus || 'No explicit focus.', '',
    '## Active Work', '', `- Active cases: ${record.advancement.active_case_refs.length}`, `- Project gaps: ${gaps.length}`,
    ...gaps.map((gap) => `- ${gap.id}: ${gap.goal}`), '',
    '## Software Definition', '', record.software_definition.summary || 'No project summary yet.', '',
    '| Decision Area | Status | Revision | Current Decision | Project Gaps |',
    '| --- | --- | ---: | --- | --- |',
    ...areas.map((area) => `| ${area.id} | ${area.decision.status} | ${area.decision.revision} | ${area.decision.statement || 'TBD'} | ${area.gap_refs.join(', ') || '-'} |`), '',
    '## Software Invariants', '',
    ...record.software_invariants.map((item) => `- ${item.id}: ${item.must_hold}`), '',
    '## Read For Precision', '', '- state.record.json',
    ...(record.advancement.active_iteration_ref ? [`- ${record.advancement.active_iteration_ref}`] : []),
    ...record.advancement.active_case_refs.map((ref) => `- ${ref}`),
  ].join('\n');
}

function resolveRecord(input = STATE_RECORD_PATH) {
  const file = path.resolve(input);
  if (path.extname(file) === '.json') return { record: JSON.parse(fs.readFileSync(file, 'utf8')), file };
  throw new Error('Project State source must be the canonical state.record.json');
}

function auditCrossRecords(record, file) {
  const errors = validateProjectStateRecord(record, file);
  const root = process.cwd();
  for (const ref of record.advancement?.active_case_refs || []) {
    const caseFile = path.join(root, ref);
    if (!fs.existsSync(caseFile)) { errors.push(`${file}: active Case does not exist: ${ref}`); continue; }
    const text = fs.readFileSync(caseFile, 'utf8');
    const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
    const caseRecord = match ? JSON.parse(match[1]) : null;
    if (caseRecord?.schema_version !== 'development-case-record/v5' || caseRecord.status === 'closed') errors.push(`${file}: active Case must be unfinished development-case-record/v5: ${ref}`);
  }
  if (record.advancement?.active_iteration_ref) {
    const iterationFile = path.join(root, record.advancement.active_iteration_ref);
    if (!fs.existsSync(iterationFile)) errors.push(`${file}: active iteration does not exist: ${record.advancement.active_iteration_ref}`);
    else if (JSON.parse(fs.readFileSync(iterationFile, 'utf8')).schema_version !== 'iteration-state-record/v3') errors.push(`${file}: active iteration must use iteration-state-record/v3`);
  }
  if (path.resolve(file) === path.resolve(STATE_RECORD_PATH) && fs.existsSync(STATE_PATH)) {
    if (normalize(fs.readFileSync(STATE_PATH, 'utf8')) !== normalize(renderProjectState(record))) errors.push(`${STATE_PATH}: projection is stale`);
  }
  return errors;
}

function writeRecord(record) {
  fs.mkdirSync(PROJECT_ROOT, { recursive: true });
  fs.writeFileSync(STATE_RECORD_PATH, `${JSON.stringify(record, null, 2)}\n`);
  fs.writeFileSync(STATE_PATH, `${renderProjectState(record)}\n`);
}

function usage() {
  console.log('Usage: project-state.mjs init|register-case|render|validate|audit|summary [record]');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const command = args._[0];
    if (command === 'init') {
      if (!args.name) throw new Error('init requires --name');
      writeRecord(createProjectStateRecord({ name: args.name, intent: args.intent || '' }));
      console.log(STATE_RECORD_PATH);
    } else if (command === 'register-case') {
      if (!args['case-ref']) throw new Error('register-case requires --case-ref');
      const { record } = resolveRecord();
      const caseRef = args['case-ref'];
      record.advancement.active_case_refs = unique([...record.advancement.active_case_refs, caseRef]);
      if (args.intent) record.advancement.selection_context.current_focus = args.intent;
      record.project.revision += 1;
      record.project.updated_at = nowIso();
      const errors = validateProjectStateRecord(record, STATE_RECORD_PATH);
      if (errors.length) throw new Error(errors.join('\n'));
      writeRecord(record);
      console.log(STATE_RECORD_PATH);
    } else if (['render', 'validate', 'audit', 'summary'].includes(command)) {
      const { record, file } = resolveRecord(args._[1] || STATE_RECORD_PATH);
      if (command === 'render') {
        const errors = validateProjectStateRecord(record, file);
        if (errors.length) throw new Error(errors.join('\n'));
        fs.writeFileSync(STATE_PATH, `${renderProjectState(record)}\n`);
        console.log(STATE_PATH);
      } else if (command === 'validate') {
        const errors = validateProjectStateRecord(record, file);
        if (errors.length) throw new Error(errors.join('\n'));
        console.log(`${file}: ok`);
      } else if (command === 'audit') {
        const errors = auditCrossRecords(record, file);
        if (errors.length) throw new Error(errors.join('\n'));
        console.log(`${file}: audit ok`);
      } else {
        console.log(JSON.stringify({ project_name: record.project.name, project_status: record.project.status, project_revision: record.project.revision, current_focus: record.advancement.selection_context.current_focus, active_cases: record.advancement.active_case_refs, project_gaps: record.advancement.project_gaps, software_decisions: record.software_definition.decision_areas.map((area) => ({ id: area.id, status: area.decision.status, revision: area.decision.revision, statement: area.decision.statement, gap_refs: area.gap_refs })), software_invariants: record.software_invariants }, null, 2));
      }
    } else {
      usage();
      if (command) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
