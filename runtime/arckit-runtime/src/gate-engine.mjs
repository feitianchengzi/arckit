import { validateRuntimeResult } from './validator.mjs';
import { pathToFileURL } from 'node:url';
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
    if (snapshot?.projectState?.project?.updated_at !== caseControlHandoff.expected_project_updated_at) reasons.push('case_control_handoff is stale for Project State.');
  } else {
    if (!transition || transition.schema_version !== 'arckit-case-transition/v3') reasons.push('case_transition must use arckit-case-transition/v3.');
    if (!transition?.case_id || !transition?.selected_gap?.id || !transition?.selected_gap?.facet) reasons.push('case_transition must identify a concrete Case gap.');
    if (!transition?.case_updated_at) reasons.push('case_transition must bind the expected Case updated_at revision.');
    if (!transition?.project_updated_at) reasons.push('case_transition must bind the observed Project updated_at revision.');
    if (!transition?.planned_transition?.goal || !transition?.planned_transition?.expected_state_change) reasons.push('case_transition.planned_transition is incomplete.');
    if (!Array.isArray(transition?.evidence) || transition.evidence.length === 0) reasons.push('case_transition.evidence must be non-empty.');
    const delta = transition?.accepted_state_delta;
    if (!delta || !Array.isArray(delta.facets) || !Array.isArray(delta.resolved_open_questions) || !Array.isArray(delta.completed_handoffs) || !Array.isArray(delta.resolved_review_findings) || !Object.hasOwn(delta, 'completion_review_result') || !Object.hasOwn(delta, 'review_budget_extension')) reasons.push('case_transition.accepted_state_delta is incomplete.');
    for (const claim of delta?.facets || []) {
      if (!claim.facet || !claim.set || !Array.isArray(claim.evidence) || claim.evidence.length === 0) reasons.push('Every accepted facet delta must identify a facet, state update, and evidence.');
    }
    const selectedFacet = transition?.selected_gap?.facet;
    const selectedFindingId = transition?.selected_gap?.id?.split(':review-finding:')[1] || '';
    const selectedGapAdvanced = (delta?.facets || []).some((claim) => claim.facet === selectedFacet)
      || (selectedFacet === 'open_questions' && (delta?.resolved_open_questions || []).length > 0)
      || (selectedFacet === 'pending_handoffs' && (delta?.completed_handoffs || []).length > 0)
      || (selectedFacet === 'review_findings' && (delta?.resolved_review_findings || []).some((item) => item.id === selectedFindingId))
      || (selectedFacet === 'completion_review' && (delta?.completion_review_result || delta?.review_budget_extension || (delta?.resolved_review_findings || []).length > 0));
    if (!selectedGapAdvanced) reasons.push('case_transition.accepted_state_delta must advance the selected Case gap.');
    if (transition?.round_outcome === 'blocked') reasons.push('A blocked round is not eligible for automatic Case transition writeback.');
    if (transition?.project_impact_candidate?.status === 'accepted' && transition?.case_resolution?.claimed_status !== 'resolved') reasons.push('Accepted project impact requires a Controller claim that the Case is resolved.');
    if (transition?.case_resolution?.claimed_status === 'resolved' && snapshot?.projectState?.project?.updated_at !== transition?.project_updated_at) reasons.push('Resolving case_transition is stale for Project State.');

    const activeCase = (snapshot?.activeCases || []).find((item) => item.record?.id === transition?.case_id);
    if (snapshot && !activeCase) reasons.push(`case_transition.case_id is not an active Case: ${transition?.case_id || '<missing>'}`);
    if (activeCase?.record?.case_resolution?.status === 'resolved') reasons.push(`Case ${transition.case_id} is already resolved.`);
    if (activeCase && activeCase.record.updated_at !== transition?.case_updated_at) reasons.push(`case_transition is stale for ${transition.case_id}.`);
    const activeGap = (activeCase?.record?.case_resolution?.candidate_gaps || []).find((gap) => gap.id === transition?.selected_gap?.id && gap.facet === transition?.selected_gap?.facet);
    if (activeCase && !activeGap) {
      reasons.push(`case_transition.selected_gap is not an unresolved candidate of ${transition.case_id}.`);
    } else if (activeGap) {
      for (const field of ['responsibility', 'current_state', 'target_state', 'next_transition']) {
        if (activeGap[field] !== transition.selected_gap[field]) reasons.push(`case_transition.selected_gap.${field} is stale for ${transition.case_id}.`);
      }
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
