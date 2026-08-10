import { validateRuntimeResult } from './validator.mjs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { loadRuntimeCapabilityForEntrypoint, resolveCapabilityEntrypoint } from './capability-registry.mjs';

export async function evaluateRuntimeGates({ runtimeResult, snapshot = null, projectRoot = '' }) {
  const validation = validateRuntimeResult(runtimeResult);
  const reasons = validation.issues.map((issue) => `${issue.path}: ${issue.message}`);
  const warnings = [];
  const transition = runtimeResult?.case_transition;
  const caseControlHandoff = runtimeResult?.case_control_handoff;
  const isCaseControl = Boolean(caseControlHandoff && typeof caseControlHandoff === 'object' && !Array.isArray(caseControlHandoff));
  const root = projectRoot || snapshot?.projectRoot || '';
  if (root) {
    const entrypointName = isCaseControl ? 'case_control' : 'case_transition';
    const capability = await loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: entrypointName });
    const entrypoint = await import(pathToFileURL(resolveCapabilityEntrypoint(capability, entrypointName)).href);
    const entrypointIssues = isCaseControl
      ? entrypoint.validateCaseControlHandoff(caseControlHandoff, 'case_control_handoff')
      : entrypoint.validateCaseTransition(transition, 'case_transition');
    for (const issue of entrypointIssues) reasons.push(issue);
  }

  if (runtimeResult?.ledger_stage?.status !== 'gate_ready' || runtimeResult?.ledger_stage?.writeback_required !== true) {
    reasons.push('ledger_stage must explicitly mark an accepted Case transition as gate_ready and writeback_required.');
  }
  if (isCaseControl) {
    if (snapshot?.projectState?.project?.revision !== caseControlHandoff.expected_project_revision) reasons.push('case_control_handoff is stale for Project State.');
  } else {
    if (transition?.schema_version !== 'arckit-case-transition/v5') reasons.push('case_transition must use arckit-case-transition/v5.');
    if (!transition?.case_id || !transition?.selected_gap?.id) reasons.push('case_transition must identify a concrete Case gap.');
    if (!transition?.case_updated_at) reasons.push('case_transition must bind the expected Case updated_at revision.');
    if (!Number.isInteger(transition?.project_revision)) reasons.push('case_transition must bind the observed Project revision.');
    if (!transition?.planned_transition?.goal || !transition?.planned_transition?.expected_state_change) reasons.push('case_transition.planned_transition is incomplete.');
    if (!Array.isArray(transition?.evidence) || transition.evidence.length === 0) reasons.push('case_transition.evidence must be non-empty.');
    const delta = transition?.accepted_state_delta;
    if (!delta || !Object.hasOwn(delta, 'resolved_gap') || !Array.isArray(delta.facts_added) || !Array.isArray(delta.impacts_added) || !Array.isArray(delta.impacts_updated) || !Array.isArray(delta.gaps_added)) reasons.push('case_transition.accepted_state_delta is incomplete.');
    if (transition?.round_outcome === 'blocked') reasons.push('A blocked round is not eligible for automatic Case transition writeback.');
    const projectDelta = transition?.project_state_delta;
    const changesProject = Boolean(projectDelta && (projectDelta.software_definition_changes?.length || projectDelta.software_invariant_changes?.length || projectDelta.project_gap_changes?.length || projectDelta.selection_context_change));
    if (changesProject && snapshot?.projectState?.project?.revision !== transition?.project_revision) reasons.push('Project-changing case_transition is stale for Project State.');

    const activeCase = (snapshot?.activeCases || []).find((item) => item.record?.id === transition?.case_id);
    if (snapshot && !activeCase) reasons.push(`case_transition.case_id is not an active Case: ${transition?.case_id || '<missing>'}`);
    if (activeCase?.record?.case_resolution?.status === 'resolved') reasons.push(`Case ${transition.case_id} is already resolved.`);
    if (activeCase && activeCase.record.updated_at !== transition?.case_updated_at) reasons.push(`case_transition is stale for ${transition.case_id}.`);
    const activeGap = (activeCase?.record?.case_resolution?.candidate_gaps || []).find((gap) => gap.id === transition?.selected_gap?.id);
    if (activeCase && !activeGap) {
      reasons.push(`case_transition.selected_gap is not an unresolved candidate of ${transition.case_id}.`);
    } else if (activeGap) {
      if (!isDeepStrictEqual(activeGap, transition.selected_gap)) reasons.push(`case_transition.selected_gap snapshot is stale for ${transition.case_id}.`);
    }
  }

  const unsafeChangedFiles = findUnsafeChangedFiles(runtimeResult?.changed_files || []);
  if (unsafeChangedFiles.length) reasons.push(`changed_files contains unsafe paths: ${unsafeChangedFiles.join(', ')}`);
  if (runtimeResult?.artifact_ownership_scan?.unknown_artifacts?.length) reasons.push(`artifact ownership contains unknown artifacts: ${runtimeResult.artifact_ownership_scan.unknown_artifacts.join(', ')}`);
  const projection = runtimeResult?.source_projection_check || {};
  if (projection.source_unknown === true && (projection.projection_artifacts_changed || []).length > 0 && (projection.source_facts_changed || []).length === 0) reasons.push('projection-only changes with unknown source facts cannot update Case State.');
  if (runtimeResult?.loop_handoff?.next_responsibility === 'human' || runtimeResult?.loop_handoff?.next_responsibility === 'external') {
    warnings.push('The accepted transition may be written, but Runtime must stop after writeback for the human/external handoff.');
  }

  return {
    schema_version: 'arckit-runtime-gate/v2',
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'block',
    reasons,
    warnings,
    write_scope: reasons.length === 0
      ? isCaseControl
        ? ['case_creation_or_selection', 'project_case_binding', 'indexes_and_projections']
        : ['case_transition', 'resolved_case_project_aggregation', 'indexes_and_projections']
      : [],
    validation,
    case_id: isCaseControl ? caseControlHandoff.case_id || '' : transition?.case_id || '',
  };
}

function findUnsafeChangedFiles(paths) {
  return paths.filter((item) => typeof item !== 'string' || !item || item.startsWith('/') || item.includes('..') || item.includes('\0'));
}
