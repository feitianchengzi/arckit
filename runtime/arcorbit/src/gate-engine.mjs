import { validateRuntimeResult } from './validator.mjs';
import { pathToFileURL } from 'node:url';
import { loadRuntimeCapabilityForEntrypoint, resolveCapabilityEntrypoint } from './capability-registry.mjs';

export async function evaluateRuntimeGates({ runtimeResult, snapshot = null, projectRoot = '' }) {
  const validation = validateRuntimeResult(runtimeResult);
  const reasons = validation.issues.map((issue) => `${issue.path}: ${issue.message}`);
  const warnings = [];
  const transition = runtimeResult?.case_transition;
  const command = runtimeResult?.case_command;
  const caseControlHandoff = runtimeResult?.case_control_handoff;
  const isCaseControl = Boolean(caseControlHandoff && typeof caseControlHandoff === 'object' && !Array.isArray(caseControlHandoff));
  const root = projectRoot || snapshot?.projectRoot || '';
  if (root) {
    const entrypointName = isCaseControl ? 'case_control' : command ? 'writeback' : 'case_transition';
    const capability = await loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: entrypointName });
    const entrypoint = await import(pathToFileURL(resolveCapabilityEntrypoint(capability, entrypointName)).href);
    const entrypointIssues = isCaseControl
      ? entrypoint.validateCaseControlHandoff(caseControlHandoff, 'case_control_handoff')
      : command
        ? entrypoint.validateSemanticCaseCommand(command, 'case_command')
        : entrypoint.validateCaseTransition(transition, 'case_transition');
    for (const issue of entrypointIssues) reasons.push(typeof issue === 'string' ? issue : `${issue.path}: ${issue.message}`);
  }

  if (runtimeResult?.ledger_stage?.status !== 'gate_ready' || runtimeResult?.ledger_stage?.writeback_required !== true) {
    reasons.push('ledger_stage must explicitly mark an accepted Case transition as gate_ready and writeback_required.');
  }
  if (isCaseControl) {
    if (snapshot?.projectState?.project?.revision !== caseControlHandoff.expected_project_revision) reasons.push('case_control_handoff is stale for Project State.');
  } else {
    if ((command?.round_outcome || transition?.round_outcome) === 'blocked') reasons.push('A blocked round is not eligible for automatic Case writeback.');
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
        : [command ? 'semantic_case_command' : 'case_transition', 'resolved_case_project_aggregation', 'indexes_and_projections']
      : [],
    validation,
    case_id: isCaseControl ? caseControlHandoff.case_id || '' : command?.case_id || transition?.case_id || '',
  };
}

function findUnsafeChangedFiles(paths) {
  return paths.filter((item) => typeof item !== 'string' || !item || item.startsWith('/') || item.includes('..') || item.includes('\0'));
}
