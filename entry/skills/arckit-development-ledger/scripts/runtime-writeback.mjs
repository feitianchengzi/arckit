import { basename, resolve } from 'node:path';
import { applyCaseTransition, applyCaseTransitionUnlocked } from './case-transition.mjs';
import { readLedgerSnapshot } from './loop-snapshot.mjs';
import { withProjectCommitLock } from './project-commit-lock.mjs';
import { materializeSemanticCaseCommand, SemanticCommandError, validateSemanticCaseCommand } from './semantic-case-command.mjs';

export { validateSemanticCaseCommand };

export async function applyRuntimeLedgerWriteback({ projectRoot, runtimeResult, snapshot, gate, dryRun = false, runtimeRecordRef = '' }) {
  const root = resolve(projectRoot);
  if (!gate?.allowed) return emptyResult(gate, dryRun);

  if (runtimeResult.case_command) {
    if (dryRun) return applySemanticWritebackUnlocked({ root, runtimeResult, gate, dryRun: true, runtimeRecordRef });
    return withProjectCommitLock(root, () => applySemanticWritebackUnlocked({ root, runtimeResult, gate, dryRun: false, runtimeRecordRef }));
  }

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
    round_closeout: caseResult.round_closeout,
    post_commit_snapshot_token: caseResult.round_closeout?.post_commit_snapshot_token || '',
    changed_files: [...new Set(caseResult.changed_files)],
  };
}

async function applySemanticWritebackUnlocked({ root, runtimeResult, gate, dryRun, runtimeRecordRef }) {
  let snapshot;
  try {
    snapshot = readLedgerSnapshot(root);
  } catch (error) {
    return classifiedRejectionResult({
      gate, dryRun, error, command: runtimeResult.case_command,
      kind: 'infrastructure_failed', issuePath: 'ledger_snapshot',
    });
  }
  let materialized;
  try {
    materialized = materializeSemanticCaseCommand({ command: runtimeResult.case_command, snapshot });
  } catch (error) {
    return classifiedRejectionResult({
      gate, dryRun, error, command: runtimeResult.case_command,
      kind: error instanceof SemanticCommandError ? error.kind : 'materialization_failed',
    });
  }
  const transition = materialized.transition;
  const activeCaseRef = resolveActiveCaseRef(snapshot, transition.case_id);
  if (!activeCaseRef) return classifiedRejectionResult({
    gate, dryRun, error: new Error(`No active Case ref matches ${transition.case_id}`),
    command: runtimeResult.case_command, kind: 'materialization_failed', issuePath: 'materializer.case_path',
  });
  let caseResult;
  try {
    caseResult = await applyCaseTransitionUnlocked({
      projectRoot: root, casePath: activeCaseRef, transition: { ...transition, runtime_result_ref: runtimeRecordRef },
      runtimeResultRef: runtimeRecordRef, dryRun,
    });
  } catch (error) {
    return classifiedRejectionResult({
      gate, dryRun, error, command: runtimeResult.case_command,
      kind: 'materialization_failed', issuePath: 'materializer.internal_transition',
    });
  }
  const plan = [
    { action: 'materialize_semantic_case_command', path: activeCaseRef },
    { action: 'apply_case_transition', path: activeCaseRef },
    { action: 'render_case_index', path: 'arckit/cases/INDEX.md' },
  ];
  if (dryRun) return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: true, gate, runtime_result_ref: runtimeRecordRef, plan, changed_files: [] };
  return {
    schema_version: 'arckit-ledger-write/v2', written: true, dry_run: false, gate,
    runtime_result_ref: runtimeRecordRef, plan,
    command_receipt: {
      schema_version: 'arckit-semantic-command-receipt/v1', status: 'accepted',
      case_id: caseResult.case_id, command_schema_version: runtimeResult.case_command.schema_version,
      canonical_id_mapping: materialized.canonical_id_mapping,
    },
    case_transition_result: caseResult,
    round_closeout: caseResult.round_closeout,
    post_commit_snapshot_token: caseResult.round_closeout?.post_commit_snapshot_token || '',
    changed_files: [...new Set(caseResult.changed_files)],
  };
}

function transitionRejectionResult({ gate, dryRun, error, transition }) {
  const reason = error?.message || String(error);
  const stale = /\b(stale|snapshot|revision)\b/i.test(reason);
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: false,
    dry_run: dryRun,
    gate,
    rejection: {
      kind: stale ? 'snapshot_stale' : 'claim_invalid',
      recoverable: true,
      responsibility: 'agent',
      reason,
      issues: [{ path: 'case_transition', message: reason }],
      case_id: transition?.case_id || '',
      selected_gap_id: transition?.selected_gap?.id || '',
      recovery_action: stale ? 'replan_from_fresh_state' : 'repair_rejected_claim',
      counts_toward_agent_repair: !stale,
    },
    plan: [],
    changed_files: [],
  };
}

function classifiedRejectionResult({ gate, dryRun, error, command, kind, issuePath = 'case_command' }) {
  const reason = error?.message || String(error);
  const issues = error instanceof SemanticCommandError
    ? error.issues
    : [{ path: issuePath, message: reason }];
  const policy = rejectionPolicy(kind);
  return {
    schema_version: 'arckit-ledger-write/v2', written: false, dry_run: dryRun, gate,
    rejection: {
      kind, ...policy, reason, issues,
      case_id: command?.case_id || '', selected_gap_id: command?.selection?.selected_ref || '',
    },
    plan: [], changed_files: [],
  };
}

export function rejectionPolicy(kind) {
  switch (kind) {
    case 'claim_invalid':
      return { recoverable: true, responsibility: 'agent', recovery_action: 'repair_rejected_claim', counts_toward_agent_repair: true };
    case 'snapshot_stale':
      return { recoverable: true, responsibility: 'agent', recovery_action: 'replan_from_fresh_state', counts_toward_agent_repair: false };
    case 'protocol_incompatible':
      return { recoverable: false, responsibility: 'ledger', recovery_action: 'trusted_protocol_reconciliation', counts_toward_agent_repair: false };
    case 'infrastructure_failed':
      return { recoverable: true, responsibility: 'runtime', recovery_action: 'runtime_recovery', counts_toward_agent_repair: false };
    default:
      return { recoverable: false, responsibility: 'ledger', recovery_action: 'inspect_materializer', counts_toward_agent_repair: false };
  }
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
  const refs = snapshot?.paths?.active_cases || snapshot?.paths?.activeCases || snapshot?.canonical?.project_state?.advancement?.active_case_refs || snapshot?.projectState?.advancement?.active_case_refs || [];
  return refs.find((ref) => basename(ref).startsWith(`${caseId}-`)) || '';
}
