import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { applyCaseTransition } from './case-transition.mjs';

export async function applyRuntimeLedgerWriteback({ projectRoot, runtimeResult, snapshot, gate, dryRun = false }) {
  const root = resolve(projectRoot);
  if (!gate?.allowed) return emptyResult(gate, dryRun);

  const transition = runtimeResult.case_transition;
  const activeCaseRef = resolveActiveCaseRef(snapshot, transition.case_id);
  if (!activeCaseRef) throw new Error(`No active Case ref matches ${transition.case_id}`);

  const timestamp = new Date().toISOString();
  const runId = `RUN-${timestamp.replaceAll(/[-:.]/g, '').replace('T', '-').replace('Z', 'Z')}`;
  const runtimeRecordPath = join(root, 'arckit/project/runtime-results', `${runId}.json`);
  const runtimeRecordRef = relativeToProject(root, runtimeRecordPath);
  const preflight = await applyCaseTransition({
    projectRoot: root,
    casePath: activeCaseRef,
    transition: { ...transition, runtime_result_ref: runtimeRecordRef },
    runtimeResultRef: runtimeRecordRef,
    dryRun: true,
  });
  const plan = [
    { action: 'write_runtime_execution_record', path: runtimeRecordRef },
    { action: 'apply_case_transition', path: activeCaseRef },
    { action: 'render_case_index', path: 'arckit/cases/INDEX.md' },
  ];
  if (preflight.case_resolution.status === 'resolved') {
    plan.push({ action: 'aggregate_resolved_case_to_project', path: 'arckit/project/state.record.json' });
    if (snapshot?.projectState?.active_iteration_ref) plan.push({ action: 'aggregate_resolved_case_to_iteration', path: snapshot.projectState.active_iteration_ref });
  }

  if (dryRun) {
    return {
      schema_version: 'arckit-ledger-write/v2',
      written: false,
      dry_run: true,
      gate,
      run_id: runId,
      plan,
      changed_files: [],
    };
  }

  await mkdir(dirname(runtimeRecordPath), { recursive: true });
  await writeJson(runtimeRecordPath, {
    schema_version: 'arckit-runtime-execution-record/v2',
    id: runId,
    created_at: timestamp,
    case_id: transition.case_id,
    runtime_result: runtimeResult,
    gate,
  });

  let caseResult;
  try {
    caseResult = await applyCaseTransition({
      projectRoot: root,
      casePath: activeCaseRef,
      transition: { ...transition, runtime_result_ref: runtimeRecordRef },
      runtimeResultRef: runtimeRecordRef,
    });
  } catch (error) {
    await unlink(runtimeRecordPath).catch(() => {});
    throw error;
  }
  const changedFiles = [runtimeRecordRef, ...caseResult.changed_files];
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: true,
    dry_run: false,
    gate,
    run_id: runId,
    plan,
    case_transition_result: caseResult,
    changed_files: [...new Set(changedFiles)],
  };
}

function emptyResult(gate, dryRun) {
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: false,
    dry_run: dryRun,
    gate,
    plan: [],
    changed_files: [],
  };
}

function resolveActiveCaseRef(snapshot, caseId) {
  const refs = snapshot?.paths?.activeCases || snapshot?.projectState?.active_case_refs || [];
  return refs.find((ref) => basename(ref).startsWith(`${caseId}-`)) || '';
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function relativeToProject(root, file) {
  return file.startsWith(root) ? file.slice(root.length + 1) : file;
}
