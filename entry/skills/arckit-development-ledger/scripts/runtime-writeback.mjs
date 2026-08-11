import { basename, resolve } from 'node:path';
import { applyCaseTransition } from './case-transition.mjs';

export async function applyRuntimeLedgerWriteback({ projectRoot, runtimeResult, snapshot, gate, dryRun = false, runtimeRecordRef = '' }) {
  const root = resolve(projectRoot);
  if (!gate?.allowed) return emptyResult(gate, dryRun);

  const transition = runtimeResult.case_transition;
  const activeCaseRef = resolveActiveCaseRef(snapshot, transition.case_id);
  if (!activeCaseRef) throw new Error(`No active Case ref matches ${transition.case_id}`);

  let preflight;
  try {
    preflight = await applyCaseTransition({
      projectRoot: root,
      casePath: activeCaseRef,
      transition: { ...transition, runtime_result_ref: runtimeRecordRef },
      runtimeResultRef: runtimeRecordRef,
      dryRun: true,
    });
  } catch (error) {
    return transitionRejectionResult({ gate, dryRun, error, transition });
  }
  const plan = [
    { action: 'apply_case_transition', path: activeCaseRef },
    { action: 'render_case_index', path: 'arckit/cases/INDEX.md' },
  ];
  if (preflight.case_resolution.status === 'resolved') {
    plan.push({ action: 'aggregate_resolved_case_to_project', path: 'arckit/project/state.record.json' });
    if (snapshot?.projectState?.advancement?.active_iteration_ref) plan.push({ action: 'aggregate_resolved_case_to_iteration', path: snapshot.projectState.advancement.active_iteration_ref });
  }

  if (dryRun) {
    return {
      schema_version: 'arckit-ledger-write/v2',
      written: false,
      dry_run: true,
      gate,
      runtime_result_ref: runtimeRecordRef,
      plan,
      changed_files: [],
    };
  }

  let caseResult;
  try {
    caseResult = await applyCaseTransition({
      projectRoot: root,
      casePath: activeCaseRef,
      transition: { ...transition, runtime_result_ref: runtimeRecordRef },
      runtimeResultRef: runtimeRecordRef,
    });
  } catch (error) {
    return transitionRejectionResult({ gate, dryRun: false, error, transition });
  }
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: true,
    dry_run: false,
    gate,
    runtime_result_ref: runtimeRecordRef,
    plan,
    case_transition_result: caseResult,
    changed_files: [...new Set(caseResult.changed_files)],
  };
}

function transitionRejectionResult({ gate, dryRun, error, transition }) {
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: false,
    dry_run: dryRun,
    gate,
    rejection: {
      kind: 'case_transition_rejected',
      recoverable: true,
      responsibility: 'agent',
      reason: error?.message || String(error),
      case_id: transition?.case_id || '',
      selected_gap_id: transition?.selected_gap?.id || '',
      recovery_action: 'replan_from_fresh_state',
    },
    plan: [],
    changed_files: [],
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
  const refs = snapshot?.paths?.activeCases || snapshot?.projectState?.advancement?.active_case_refs || [];
  return refs.find((ref) => basename(ref).startsWith(`${caseId}-`)) || '';
}
