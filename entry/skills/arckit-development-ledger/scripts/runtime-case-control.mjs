import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_TYPES = new Set(['code', 'skill', 'document', 'workflow', 'mixed', 'unknown']);
const ACTIONS = new Set(['select_existing_case', 'create_case']);

export function validateCaseControlHandoff(handoff, field = 'case_control_handoff') {
  const issues = [];
  if (!handoff || typeof handoff !== 'object' || Array.isArray(handoff)) return [`${field} must be an object.`];
  if (handoff.schema_version !== 'arckit-case-control-handoff/v1') issues.push(`${field}.schema_version must be arckit-case-control-handoff/v1.`);
  if (!ACTIONS.has(handoff.action)) issues.push(`${field}.action must be select_existing_case or create_case.`);
  for (const key of ['expected_project_updated_at', 'case_id', 'title', 'intent', 'artifact_type', 'selection_reason']) {
    if (typeof handoff[key] !== 'string') issues.push(`${field}.${key} must be a string.`);
  }
  if (!ARTIFACT_TYPES.has(handoff.artifact_type)) issues.push(`${field}.artifact_type is invalid.`);
  if (!handoff.review_policy || typeof handoff.review_policy !== 'object' || Array.isArray(handoff.review_policy)) {
    issues.push(`${field}.review_policy must be an object.`);
  } else {
    if (!Number.isInteger(handoff.review_policy.max_autonomous_cycles) || handoff.review_policy.max_autonomous_cycles < 1) issues.push(`${field}.review_policy.max_autonomous_cycles must be a positive integer.`);
    if (typeof handoff.review_policy.source !== 'string' || !handoff.review_policy.source.trim()) issues.push(`${field}.review_policy.source must be a non-empty string.`);
  }
  if (handoff.action === 'create_case') {
    if (!handoff.title?.trim() || !handoff.intent?.trim() || !handoff.selection_reason?.trim()) issues.push(`${field} create_case requires title, intent, and selection_reason.`);
    if (handoff.case_id) issues.push(`${field}.case_id must be empty when action=create_case; the ledger allocates the id.`);
  }
  if (handoff.action === 'select_existing_case') {
    if (!/^CASE-[0-9]{8}-[0-9]{3}$/.test(handoff.case_id || '')) issues.push(`${field}.case_id must identify an existing Case.`);
    if (!handoff.intent?.trim() || !handoff.selection_reason?.trim()) issues.push(`${field} select_existing_case requires intent and selection_reason.`);
  }
  return issues;
}

export async function applyRuntimeCaseControl({ projectRoot, runtimeResult, snapshot, gate, dryRun = false, runtimeRecordRef = '' }) {
  const root = path.resolve(projectRoot);
  if (!gate?.allowed) return emptyResult(gate, dryRun);
  const handoff = runtimeResult.case_control_handoff;
  const issues = validateCaseControlHandoff(handoff);
  if (issues.length) throw new Error(issues.join('\n'));

  const statePath = path.join(root, 'arckit/project/state.record.json');
  const projectState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (projectState.project?.updated_at !== handoff.expected_project_updated_at) {
    throw new Error(`Case control handoff is stale: expected Project revision ${projectState.project?.updated_at || '<missing>'}, received ${handoff.expected_project_updated_at || '<missing>'}.`);
  }

  let selectedCaseRef = '';
  if (handoff.action === 'select_existing_case') {
    selectedCaseRef = resolveActiveCaseRef(projectState.active_case_refs || [], handoff.case_id);
    if (!selectedCaseRef || !fs.existsSync(path.join(root, selectedCaseRef))) throw new Error(`No active Case ref matches ${handoff.case_id}.`);
  }

  const plan = [
    ...(handoff.action === 'create_case' ? [{ action: 'create_case', path: 'arckit/cases/active/' }] : []),
    { action: 'select_case', path: handoff.action === 'select_existing_case' ? selectedCaseRef : 'ledger_allocated_case_ref' },
    { action: 'render_case_index', path: 'arckit/cases/INDEX.md' },
  ];
  if (dryRun) return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: true, gate, runtime_result_ref: runtimeRecordRef, plan, changed_files: [] };

  const snapshots = snapshotMutableFiles(root, projectState.active_iteration_ref || '');
  const activeDir = path.join(root, 'arckit/cases/active');
  const initialActiveFiles = new Set(fs.existsSync(activeDir) ? fs.readdirSync(activeDir) : []);
  try {
    if (handoff.action === 'create_case') {
      const created = runScript(root, 'development-case.mjs', [
        'new',
        '--title', handoff.title,
        '--artifact-type', handoff.artifact_type,
        '--intent', handoff.intent,
        '--max-review-cycles', String(handoff.review_policy.max_autonomous_cycles),
        '--review-policy-source', handoff.review_policy.source,
      ]);
      selectedCaseRef = relativeCaseRef(root, created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1));
    }
    runScript(root, 'project-state.mjs', [
      'select-case',
      '--case-ref', selectedCaseRef,
      '--intent', handoff.intent,
      '--reason', handoff.selection_reason,
    ]);
    runScript(root, 'development-case.mjs', ['index']);
    runScript(root, 'project-state.mjs', ['audit', 'arckit/project/state.record.json']);
  } catch (error) {
    restoreSnapshots(snapshots);
    if (fs.existsSync(activeDir)) {
      for (const name of fs.readdirSync(activeDir)) {
        if (!initialActiveFiles.has(name)) fs.unlinkSync(path.join(activeDir, name));
      }
    }
    throw error;
  }

  const selectedCase = readCaseRecord(path.join(root, selectedCaseRef));
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: true,
    dry_run: false,
    gate,
    runtime_result_ref: runtimeRecordRef,
    plan,
    case_control_result: {
      schema_version: 'arckit-case-control-result/v1',
      action: handoff.action,
      selected_case_ref: selectedCaseRef,
      case_id: selectedCase.id,
      case_updated_at: selectedCase.updated_at,
      candidate_gaps: selectedCase.case_resolution?.candidate_gaps || [],
    },
    changed_files: [...new Set([
      ...(handoff.action === 'create_case' ? [selectedCaseRef] : []),
      'arckit/project/state.record.json',
      'arckit/project/STATE.md',
      'arckit/cases/INDEX.md',
      ...(projectState.active_iteration_ref
        ? [projectState.active_iteration_ref, projectState.active_iteration_ref.replace(/\.record\.json$/, '.md'), 'arckit/project/ITERATIONS.md']
        : []),
    ])],
  };
}

function runScript(root, name, args) {
  const result = spawnSync(process.execPath, [path.join(here, name), ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${name} ${args[0] || ''} failed\n${result.stderr || result.stdout}`);
  return result;
}

function resolveActiveCaseRef(refs, caseId) {
  return refs.find((ref) => path.basename(ref).startsWith(`${caseId}-`) && ref.includes('/active/')) || '';
}

function relativeCaseRef(root, absolutePath) {
  const resolved = fs.realpathSync(path.resolve(absolutePath));
  const canonicalRoot = fs.realpathSync(root);
  const relative = path.relative(canonicalRoot, resolved).replaceAll('\\', '/');
  if (!relative.startsWith('arckit/cases/active/') || relative.includes('..')) throw new Error(`Ledger returned an unexpected Case path: ${absolutePath}`);
  return relative;
}

function snapshotMutableFiles(root, iterationRef) {
  const refs = [
    'arckit/project/state.record.json',
    'arckit/project/STATE.md',
    'arckit/project/ITERATIONS.md',
    'arckit/cases/INDEX.md',
    iterationRef,
    iterationRef ? iterationRef.replace(/\.record\.json$/, '.md') : '',
  ].filter(Boolean);
  return refs.map((ref) => {
    const file = path.join(root, ref);
    return { file, existed: fs.existsSync(file), content: fs.existsSync(file) ? fs.readFileSync(file) : null };
  });
}

function restoreSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      fs.mkdirSync(path.dirname(snapshot.file), { recursive: true });
      fs.writeFileSync(snapshot.file, snapshot.content);
    } else if (fs.existsSync(snapshot.file)) {
      fs.unlinkSync(snapshot.file);
    }
  }
}

function readCaseRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`${file}: missing Structured Record json block`);
  return JSON.parse(match[1]);
}

function emptyResult(gate, dryRun) {
  return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: dryRun, gate, plan: [], changed_files: [] };
}
