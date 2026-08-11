#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectTargetRefs } from './project-state.mjs';

const ROOT = path.join(process.cwd(), 'arckit', 'project');
const DIR = path.join(ROOT, 'iterations');
const INDEX = path.join(ROOT, 'ITERATIONS.md');
const KINDS = new Set(['software_decision', 'software_invariant', 'project_gap']);
function nowIso() { return new Date().toISOString(); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function unique(values) { return [...new Set(values || [])]; }

function listRecords() { fs.mkdirSync(DIR, { recursive: true }); return fs.readdirSync(DIR).filter((name) => name.endsWith('.record.json')).map((name) => path.join(DIR, name)).sort(); }
function nextId() { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); const used = listRecords().map((file) => path.basename(file).match(new RegExp(`^ITER-${date}-(\\d{3})`))).filter(Boolean).map((match) => Number(match[1])); return `ITER-${date}-${String(used.length ? Math.max(...used) + 1 : 1).padStart(3, '0')}`; }
function slugify(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'iteration'; }
function createRecord({ title, goal = '' }) { const timestamp = nowIso(); return { schema_version: 'iteration-state-record/v3', id: nextId(), title, status: 'active', created_at: timestamp, updated_at: timestamp, iteration_goal: goal, project_state_ref: 'arckit/project/state.record.json', targets: [], accepted_project_changes: [], acceptance: { status: 'working', evidence: [], remaining_project_gaps: [] }, blocking_project_gaps: [], active_case_refs: [], closed_case_refs: [], close_condition: '', last_case_aggregation: { case_ref: '', project_changes: [], evidence: [], updated_at: timestamp } }; }

export function validateIterationStateRecord(record, file = '<record>') {
  const errors = [];
  if (!isObject(record) || record.schema_version !== 'iteration-state-record/v3') return [`${file}: schema_version must be iteration-state-record/v3`];
  if (!/^ITER-\d{8}-\d{3}$/.test(record.id || '') || !record.title || !['planned', 'active', 'blocked', 'closed'].includes(record.status)) errors.push(`${file}: iteration identity is invalid`);
  for (const key of ['targets', 'accepted_project_changes', 'blocking_project_gaps', 'active_case_refs', 'closed_case_refs']) if (!Array.isArray(record[key])) errors.push(`${file}: ${key} must be an array`);
  for (const [index, target] of (record.targets || []).entries()) if (!isObject(target) || !KINDS.has(target.kind) || !target.ref || !target.expected || !target.reason) errors.push(`${file}: targets[${index}] is invalid`);
  for (const [index, change] of (record.accepted_project_changes || []).entries()) if (!isObject(change) || !KINDS.has(change.kind) || !change.ref || !change.outcome || !Array.isArray(change.evidence) || change.evidence.length === 0 || !change.case_ref) errors.push(`${file}: accepted_project_changes[${index}] is invalid`);
  if (!isObject(record.acceptance) || !['working', 'verified', 'accepted', 'blocked'].includes(record.acceptance?.status) || !Array.isArray(record.acceptance?.evidence) || !Array.isArray(record.acceptance?.remaining_project_gaps)) errors.push(`${file}: acceptance is invalid`);
  if (!isObject(record.last_case_aggregation) || !Array.isArray(record.last_case_aggregation?.project_changes) || !Array.isArray(record.last_case_aggregation?.evidence)) errors.push(`${file}: last_case_aggregation is invalid`);
  return errors;
}

export function auditIterationStateRecord(record, file = '<record>', projectRoot = process.cwd()) {
  const errors = validateIterationStateRecord(record, file);
  const projectFile = path.join(projectRoot, record.project_state_ref || '');
  if (!fs.existsSync(projectFile)) return [...errors, `${file}: project_state_ref does not exist`];
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  if (project.schema_version !== 'project-state-record/v5') errors.push(`${file}: project_state_ref must use project-state-record/v5`);
  const refs = projectTargetRefs(project);
  refs.project_gap = new Set(project.advancement?.project_gaps?.map((gap) => gap.id) || []);
  for (const target of record.targets || []) if (!refs[target.kind]?.has(target.ref) && target.kind !== 'project_gap') errors.push(`${file}: target references unknown ${target.kind}: ${target.ref}`);
  return errors;
}

export function renderIteration(record, project = null) {
  const statusFor = (target) => target.kind === 'software_decision' ? project?.software_definition?.decision_areas?.find((area) => area.id === target.ref)?.decision?.status || 'unknown' : target.kind === 'project_gap' ? project?.advancement?.project_gaps?.some((gap) => gap.id === target.ref) ? 'open' : 'resolved' : project?.software_invariants?.some((item) => item.id === target.ref) ? 'active' : 'missing';
  return [`# ${record.title}`, '', `Iteration: ${record.id}`, `Status: ${record.status}`, `Updated: ${record.updated_at}`, `Canonical Record: ${path.basename(record._file || '') || `${record.id}.record.json`}`, '', '## Goal', '', record.iteration_goal || 'TBD', '', '## Targets', '', ...(record.targets.length ? record.targets.map((target) => `- ${target.kind}.${target.ref}: ${statusFor(target)} -> ${target.expected}; ${target.reason}`) : ['- none']), '', '## Accepted Project Changes', '', ...(record.accepted_project_changes.length ? record.accepted_project_changes.slice(-10).map((change) => `- ${change.kind}.${change.ref}: ${change.outcome} (${change.case_ref})`) : ['- none']), '', '## Remaining Project Gaps', '', ...(record.acceptance.remaining_project_gaps.length ? record.acceptance.remaining_project_gaps.map((id) => `- ${id}`) : ['- none'])].join('\n');
}
function parseArgs(argv) { const args = { _: [] }; for (let i = 0; i < argv.length; i += 1) { if (!argv[i].startsWith('--')) args._.push(argv[i]); else { const key = argv[i].slice(2); const value = argv[i + 1]; if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`); args[key] = value; i += 1; } } return args; }
function resolve(input) { const file = path.resolve(input); return { file, record: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
function renderFile(file, record) { const projectFile = path.join(process.cwd(), record.project_state_ref); const project = fs.existsSync(projectFile) ? JSON.parse(fs.readFileSync(projectFile, 'utf8')) : null; record._file = file; const text = renderIteration(record, project); delete record._file; const target = file.replace(/\.record\.json$/, '.md'); fs.writeFileSync(target, `${text}\n`); return target; }
function writeIndex() { const records = listRecords().map((file) => ({ file, record: JSON.parse(fs.readFileSync(file, 'utf8')) })); const lines = ['# Project Iterations', '', '| ID | Status | Title | Updated |', '| --- | --- | --- | --- |', ...records.map(({ file, record }) => `| [${record.id}](iterations/${path.basename(file).replace(/\.record\.json$/, '.md')}) | ${record.status} | ${record.title} | ${record.updated_at} |`), '']; fs.writeFileSync(INDEX, lines.join('\n')); console.log(INDEX); }

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2)); const command = args._[0];
    if (command === 'new') { if (!args.title) throw new Error('new requires --title'); const record = createRecord({ title: args.title, goal: args.goal || '' }); fs.mkdirSync(DIR, { recursive: true }); const file = path.join(DIR, `${record.id}-${slugify(record.title)}.record.json`); fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`); renderFile(file, record); writeIndex(); console.log(file); }
    else if (command === 'render') { const { file, record } = resolve(args._[1]); const errors = validateIterationStateRecord(record, file); if (errors.length) throw new Error(errors.join('\n')); console.log(renderFile(file, record)); }
    else if (command === 'validate' || command === 'audit') { const { file, record } = resolve(args._[1]); const errors = command === 'audit' ? auditIterationStateRecord(record, file) : validateIterationStateRecord(record, file); if (errors.length) throw new Error(errors.join('\n')); console.log(`${file}: ${command} ok`); }
    else if (command === 'index') writeIndex();
    else console.log('Usage: project-iteration.mjs new|render|validate|audit|index');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
