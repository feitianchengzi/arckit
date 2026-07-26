#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FACET_KEYS,
  auditCaseRecord,
  findCasePath,
  readCaseRecord,
  validateCaseRecord,
  writeCaseRecord,
} from './development-case.mjs';
import { validateProjectStateRecord } from './project-state.mjs';
import { validateIterationStateRecord } from './project-iteration.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_FACET_FIELDS = new Set([
  'applicability',
  'maturity',
  'target_maturity',
  'alignment',
  'target_alignment',
  'resolution',
  'reason',
  'next_transition',
]);
const PROJECT_DIMENSIONS = new Set([
  'project_intent', 'users_and_stakeholders', 'problem_scenarios', 'product_behavior',
  'user_experience', 'runtime_surfaces', 'identity_access', 'data_state',
  'integration_boundaries', 'architecture_foundation', 'implementation_coverage',
  'quality_validation', 'security_privacy', 'delivery_operation',
  'observability_support', 'maintainability_handoff', 'iteration_governance',
]);
const PROJECT_STATES = new Set([
  'unknown', 'not_required', 'needed', 'defined', 'designed', 'implemented',
  'integrated', 'verified', 'accepted', 'released', 'operational', 'deferred', 'blocked',
]);
const EVIDENCE_MATURITY = new Set(['none', 'exploratory', 'confirmed', 'formalized', 'validated']);
const REVIEW_DIMENSIONS = ['correctness', 'completeness', 'minimality'];
const REVIEW_OUTCOMES = new Set(['clean', 'findings', 'needs_human']);
const REVIEW_FINDING_KINDS = new Set(['error', 'omission', 'excess']);

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function validateCaseTransition(transition, file = '<transition>') {
  const errors = [];
  if (!transition || typeof transition !== 'object' || Array.isArray(transition)) return [`${file}: transition must be an object`];
  if (transition.schema_version !== 'arckit-case-transition/v2') errors.push(`${file}: schema_version must be arckit-case-transition/v2`);
  if (!/^CASE-\d{8}-\d{3}$/.test(transition.case_id || '')) errors.push(`${file}: invalid case_id`);
  if (typeof transition.case_updated_at !== 'string' || !transition.case_updated_at) errors.push(`${file}: case_updated_at must be non-empty`);
  if (!transition.selected_gap?.id || !transition.selected_gap?.facet || !transition.selected_gap?.next_transition
    || !['agent', 'human', 'external'].includes(transition.selected_gap?.responsibility)
    || typeof transition.selected_gap?.current_state !== 'string'
    || typeof transition.selected_gap?.target_state !== 'string') errors.push(`${file}: selected_gap is incomplete`);
  if (!transition.planned_transition?.goal || !transition.planned_transition?.expected_state_change) errors.push(`${file}: planned_transition is incomplete`);
  const delta = transition.accepted_state_delta;
  if (!delta || !Array.isArray(delta.facets) || !Array.isArray(delta.resolved_open_questions) || !Array.isArray(delta.completed_handoffs) || !Array.isArray(delta.resolved_review_findings) || !Object.hasOwn(delta, 'completion_review_result') || !Object.hasOwn(delta, 'review_budget_extension')) errors.push(`${file}: accepted_state_delta is incomplete`);
  for (const [index, delta] of (transition.accepted_state_delta?.facets || []).entries()) {
    if (!FACET_KEYS.includes(delta?.facet)) errors.push(`${file}: accepted_state_delta.facets[${index}].facet is invalid`);
    if (!delta?.set || typeof delta.set !== 'object' || Array.isArray(delta.set) || Object.keys(delta.set).length === 0) errors.push(`${file}: accepted_state_delta.facets[${index}].set is invalid`);
    for (const key of Object.keys(delta?.set || {})) if (!ALLOWED_FACET_FIELDS.has(key)) errors.push(`${file}: accepted_state_delta.facets[${index}].set.${key} is not writable`);
    if (!Array.isArray(delta?.evidence) || delta.evidence.length === 0) errors.push(`${file}: accepted_state_delta.facets[${index}].evidence must be non-empty`);
  }
  const reviewResult = delta?.completion_review_result;
  if (reviewResult !== null && reviewResult !== undefined) {
    if (!REVIEW_OUTCOMES.has(reviewResult?.outcome) || !['agent', 'human'].includes(reviewResult?.reviewer) || !Number.isInteger(reviewResult?.reviewed_content_revision) || reviewResult.reviewed_content_revision < 0 || !Array.isArray(reviewResult?.findings) || !Array.isArray(reviewResult?.evidence) || reviewResult.evidence.length === 0) errors.push(`${file}: completion_review_result is invalid`);
    for (const dimension of REVIEW_DIMENSIONS) if (!['clean', 'findings'].includes(reviewResult?.dimensions?.[dimension])) errors.push(`${file}: completion_review_result.dimensions.${dimension} is invalid`);
    for (const [index, finding] of (reviewResult?.findings || []).entries()) {
      if (!finding?.id || !REVIEW_FINDING_KINDS.has(finding?.kind) || !finding?.statement || !['agent', 'human', 'external'].includes(finding?.responsibility) || !Array.isArray(finding?.affected_facets) || !Array.isArray(finding?.artifact_refs) || !Array.isArray(finding?.evidence) || finding.evidence.length === 0) errors.push(`${file}: completion_review_result.findings[${index}] is invalid`);
    }
  }
  for (const [index, item] of (delta?.resolved_review_findings || []).entries()) {
    if (!item?.id || !['resolved', 'dismissed'].includes(item?.resolution) || !item?.reason || !Array.isArray(item?.evidence) || item.evidence.length === 0) errors.push(`${file}: resolved_review_findings[${index}] is invalid`);
  }
  const extension = delta?.review_budget_extension;
  if (extension !== null && extension !== undefined && (!Number.isInteger(extension?.additional_cycles) || extension.additional_cycles < 1 || extension?.authorized_by !== 'human' || !extension?.reason || !Array.isArray(extension?.evidence) || extension.evidence.length === 0)) errors.push(`${file}: review_budget_extension is invalid`);
  if (!Array.isArray(transition.evidence) || transition.evidence.length === 0) errors.push(`${file}: evidence must be non-empty`);
  if (!Array.isArray(transition.unresolved)) errors.push(`${file}: unresolved must be an array`);
  if (!['completed', 'partial', 'blocked', 'needs_human', 'external_wait'].includes(transition.round_outcome)) errors.push(`${file}: invalid round_outcome`);
  if (!['unresolved', 'resolved', 'blocked'].includes(transition.case_resolution?.claimed_status)) errors.push(`${file}: invalid case_resolution.claimed_status`);
  const impact = transition.project_impact_candidate;
  if (!['none', 'proposed', 'accepted'].includes(impact?.status) || !Array.isArray(impact?.changes) || !Array.isArray(impact?.evidence)) errors.push(`${file}: invalid project_impact_candidate`);
  for (const [index, change] of (impact?.changes || []).entries()) {
    if (!PROJECT_DIMENSIONS.has(change?.dimension)) errors.push(`${file}: project_impact_candidate.changes[${index}].dimension is invalid`);
    if (!PROJECT_STATES.has(change?.from_state) || !PROJECT_STATES.has(change?.to_state)) errors.push(`${file}: project_impact_candidate.changes[${index}] states are invalid`);
    if (change?.from_state === change?.to_state) errors.push(`${file}: project_impact_candidate.changes[${index}] must change state`);
    if (typeof change?.reason !== 'string' || !change.reason) errors.push(`${file}: project_impact_candidate.changes[${index}].reason is required`);
    if (!Array.isArray(change?.evidence) || change.evidence.length === 0) errors.push(`${file}: project_impact_candidate.changes[${index}].evidence must be non-empty`);
    if (change?.evidence_maturity !== undefined && !EVIDENCE_MATURITY.has(change.evidence_maturity)) errors.push(`${file}: project_impact_candidate.changes[${index}].evidence_maturity is invalid`);
  }
  if (impact?.status === 'accepted' && ((impact.changes || []).length === 0 || (impact.evidence || []).length === 0)) errors.push(`${file}: accepted project_impact_candidate requires changes and evidence`);
  return errors;
}

export function applyCaseTransitionToRecord(record, transition, { timestamp = new Date().toISOString(), runtimeResultRef = '' } = {}) {
  const transitionErrors = validateCaseTransition(transition);
  if (transitionErrors.length) throw new Error(transitionErrors.join('\n'));
  if (record.id !== transition.case_id) throw new Error(`Transition case_id ${transition.case_id} does not match ${record.id}`);
  if (record.updated_at !== transition.case_updated_at) throw new Error(`Stale Case transition for ${record.id}: expected updated_at=${record.updated_at}, received ${transition.case_updated_at}`);
  if (record.case_resolution.status === 'resolved') throw new Error(`Case ${record.id} is already resolved`);
  const candidate = auditCaseRecord(record, record.updated_at).candidate_gaps.find((gap) => gap.id === transition.selected_gap.id && gap.facet === transition.selected_gap.facet);
  if (!candidate) throw new Error(`Selected gap is not an unresolved candidate of ${record.id}: ${transition.selected_gap.id}`);
  for (const field of ['responsibility', 'current_state', 'target_state', 'next_transition']) {
    if (candidate[field] !== transition.selected_gap[field]) throw new Error(`Stale selected gap ${transition.selected_gap.id}: ${field} no longer matches Case State`);
  }
  const selectedFacet = transition.selected_gap.facet;
  const selectedFindingId = transition.selected_gap.id.split(':review-finding:')[1] || '';
  const selectedFacetAdvanced = transition.accepted_state_delta.facets.some((delta) => delta.facet === selectedFacet)
    || (selectedFacet === 'open_questions' && transition.accepted_state_delta.resolved_open_questions.length > 0)
    || (selectedFacet === 'pending_handoffs' && transition.accepted_state_delta.completed_handoffs.length > 0)
    || (selectedFacet === 'review_findings' && transition.accepted_state_delta.resolved_review_findings.some((item) => item.id === selectedFindingId))
    || (selectedFacet === 'completion_review' && (transition.accepted_state_delta.completion_review_result || transition.accepted_state_delta.review_budget_extension || transition.accepted_state_delta.resolved_review_findings.length > 0));
  if (!selectedFacetAdvanced) throw new Error(`Accepted delta does not advance selected Case gap facet: ${selectedFacet}`);

  const hasContentMutation = transition.accepted_state_delta.facets.length > 0
    || transition.accepted_state_delta.resolved_review_findings.length > 0;
  if (transition.accepted_state_delta.completion_review_result && hasContentMutation) {
    throw new Error('A completion review result cannot be committed in the same transition as a content mutation');
  }
  if (transition.accepted_state_delta.completion_review_result && transition.accepted_state_delta.review_budget_extension) {
    throw new Error('A completion review result and review budget extension require separate transitions');
  }

  for (const delta of transition.accepted_state_delta.facets) {
    record.facets[delta.facet] = {
      ...record.facets[delta.facet],
      ...delta.set,
      evidence: unique([...record.facets[delta.facet].evidence, ...delta.evidence]),
    };
  }
  for (const id of transition.accepted_state_delta.resolved_open_questions) {
    const item = record.open_questions.find((question) => question.id === id);
    if (!item) throw new Error(`Unknown open question: ${id}`);
    item.status = 'resolved';
    item.evidence = unique([...item.evidence, ...transition.evidence]);
  }
  for (const id of transition.accepted_state_delta.completed_handoffs) {
    const item = record.pending_handoffs.find((handoff) => handoff.id === id);
    if (!item) throw new Error(`Unknown pending handoff: ${id}`);
    item.status = 'completed';
    item.evidence = unique([...item.evidence, ...transition.evidence]);
  }
  for (const item of transition.accepted_state_delta.resolved_review_findings) {
    const finding = record.completion_review.findings.find((candidateFinding) => candidateFinding.id === item.id);
    if (!finding) throw new Error(`Unknown completion review finding: ${item.id}`);
    if (finding.status !== 'open') throw new Error(`Completion review finding is already closed: ${item.id}`);
    finding.status = item.resolution;
    finding.resolution_reason = item.reason;
    finding.resolution_evidence = unique([...finding.resolution_evidence, ...item.evidence]);
  }

  if (hasContentMutation) {
    record.content_revision += 1;
    record.completion_review.status = record.completion_review.findings.some((finding) => finding.status === 'open') ? 'findings_open' : 'pending';
    record.completion_review.escalation = null;
  }

  const extension = transition.accepted_state_delta.review_budget_extension;
  if (extension) {
    if (candidate.responsibility !== 'human') throw new Error('Only a human-responsibility completion review gap may extend the review budget');
    record.completion_review.additional_cycles_authorized += extension.additional_cycles;
    record.completion_review.human_authorizations.push({
      additional_cycles: extension.additional_cycles,
      reason: extension.reason,
      evidence: unique(extension.evidence),
      authorized_at: timestamp,
    });
    record.completion_review.status = record.completion_review.findings.some((finding) => finding.status === 'open') ? 'findings_open' : 'pending';
    record.completion_review.escalation = null;
    record.completion_review.evidence = unique([...record.completion_review.evidence, ...extension.evidence]);
  }

  const reviewResult = transition.accepted_state_delta.completion_review_result;
  if (reviewResult) applyCompletionReviewResult(record, reviewResult, candidate, timestamp);

  const provisionalAudit = auditCaseRecord(record, timestamp);
  if (transition.case_resolution.claimed_status === 'resolved' && provisionalAudit.status !== 'resolved') {
    throw new Error(`Controller claimed Case resolved, but ledger audit still finds: ${provisionalAudit.remaining.join(', ')}`);
  }
  if (transition.project_impact_candidate.status === 'accepted' && provisionalAudit.status !== 'resolved') {
    throw new Error('Project impact cannot be accepted before Case resolution');
  }

  record.project_impact_candidate = transition.project_impact_candidate;
  record.rounds.push({
    round: record.rounds.length + 1,
    goal: transition.planned_transition.goal,
    outcome: transition.round_outcome,
    planned_transition: transition.planned_transition.expected_state_change,
    accepted_state_delta: structuredClone(transition.accepted_state_delta),
    evidence: unique(transition.evidence),
    runtime_result_ref: runtimeResultRef || transition.runtime_result_ref || '',
    occurred_at: timestamp,
  });
  record.updated_at = timestamp;
  record.case_resolution = auditCaseRecord(record, timestamp);
  record.current_round = { goal: '', selected_gap: null };
  record.status = record.case_resolution.status === 'resolved'
    ? 'closed'
    : record.case_resolution.status === 'blocked'
      ? 'blocked'
      : ['needs_human', 'external_wait'].includes(record.case_resolution.loop_handoff.status)
        ? 'handoff'
        : 'active';

  const recordErrors = validateCaseRecord(record);
  if (recordErrors.length) throw new Error(recordErrors.join('\n'));
  return record;
}

function applyCompletionReviewResult(record, result, candidate, timestamp) {
  if (result.reviewed_content_revision !== record.content_revision) throw new Error(`Completion review must cover current content_revision=${record.content_revision}`);
  if (result.reviewer !== candidate.responsibility) throw new Error(`Completion review reviewer=${result.reviewer} does not match selected gap responsibility=${candidate.responsibility}`);
  if (record.completion_review.findings.some((finding) => finding.status === 'open')) throw new Error('Completion review cannot run while prior findings remain open');
  const hasFindingDimension = REVIEW_DIMENSIONS.some((key) => result.dimensions[key] === 'findings');
  if (result.outcome === 'clean' && (hasFindingDimension || result.findings.length > 0)) throw new Error('A clean completion review cannot contain findings');
  if (result.outcome === 'findings' && (!hasFindingDimension || result.findings.length === 0)) throw new Error('A findings completion review requires a finding dimension and at least one finding');
  if (result.outcome === 'needs_human' && candidate.responsibility !== 'human' && result.findings.length === 0) throw new Error('An agent needs_human review result must explain the escalation with findings');
  const existingIds = new Set(record.completion_review.findings.map((finding) => finding.id));
  for (const finding of result.findings) {
    if (existingIds.has(finding.id)) throw new Error(`Duplicate completion review finding id: ${finding.id}`);
    existingIds.add(finding.id);
  }
  const effectiveLimit = record.completion_review.policy.initial_max_cycles + record.completion_review.additional_cycles_authorized;
  if (result.reviewer === 'agent' && record.completion_review.cycle_count >= effectiveLimit) throw new Error('Autonomous completion review budget is exhausted; human handling is required');
  if (result.reviewer === 'agent') record.completion_review.cycle_count += 1;
  const cycleNumber = record.completion_review.cycles.length + 1;
  record.completion_review.findings.push(...result.findings.map((finding) => ({
    ...finding,
    status: 'open',
    resolution_reason: '',
    resolution_evidence: [],
    discovered_in_cycle: cycleNumber,
  })));
  record.completion_review.cycles.push({
    cycle: cycleNumber,
    autonomous_cycle: result.reviewer === 'agent' ? record.completion_review.cycle_count : null,
    reviewer: result.reviewer,
    outcome: result.outcome,
    content_revision: record.content_revision,
    dimensions: { ...result.dimensions },
    finding_ids: result.findings.map((finding) => finding.id),
    evidence: unique(result.evidence),
    occurred_at: timestamp,
  });
  record.completion_review.reviewed_content_revision = record.content_revision;
  record.completion_review.dimensions = { ...result.dimensions };
  record.completion_review.evidence = unique([...record.completion_review.evidence, ...result.evidence]);

  const limitReachedWithFindings = result.reviewer === 'agent'
    && result.outcome !== 'clean'
    && record.completion_review.cycle_count >= effectiveLimit;
  if (result.outcome === 'clean') {
    record.completion_review.status = 'clean';
    record.completion_review.escalation = null;
  } else if (result.outcome === 'needs_human' || limitReachedWithFindings || result.reviewer === 'human') {
    record.completion_review.status = 'needs_human';
    record.completion_review.escalation = {
      reason: limitReachedWithFindings ? 'review_cycle_limit_reached' : 'review_requires_human',
      triggered_at_cycle: record.completion_review.cycle_count,
      effective_max_cycles: effectiveLimit,
      unresolved_findings: record.completion_review.findings.filter((finding) => finding.status === 'open').map((finding) => finding.id),
      evidence: unique(result.evidence),
      triggered_at: timestamp,
    };
  } else {
    record.completion_review.status = 'findings_open';
    record.completion_review.escalation = null;
  }
}

export async function applyCaseTransition({ projectRoot, casePath = '', transition, runtimeResultRef = '', dryRun = false }) {
  const root = path.resolve(projectRoot);
  const resolvedCasePath = casePath
    ? path.resolve(root, casePath)
    : findCasePath(transition.case_id);
  if (!resolvedCasePath || !resolvedCasePath.startsWith(root + path.sep)) throw new Error(`Case path is missing or outside project root for ${transition.case_id}`);
  const { text, record } = readCaseRecord(resolvedCasePath);
  const nextRecord = applyCaseTransitionToRecord(structuredClone(record), transition, { runtimeResultRef });
  const activeCaseRef = path.relative(root, resolvedCasePath);
  const projectStatePath = path.join(root, 'arckit', 'project', 'state.record.json');
  const projectState = readJson(projectStatePath);
  const selectedCaseRef = projectState.case_control?.selected_case_ref || '';
  if (!(projectState.active_case_refs || []).includes(activeCaseRef)) {
    throw new Error(`Case transition target is not registered in Project active_case_refs: ${activeCaseRef}`);
  }
  if (selectedCaseRef && selectedCaseRef !== activeCaseRef) {
    throw new Error(`Case transition must target the Project-selected Case: expected ${selectedCaseRef}, received ${activeCaseRef}`);
  }
  let projectStateChanged = false;
  if (!selectedCaseRef) {
    projectState.project.updated_at = nextRecord.updated_at;
    projectState.case_control = {
      selected_case_ref: activeCaseRef,
      selection_reason: `Accepted Case transition selected ${nextRecord.id}.`,
      next_case_intent: nextRecord.user_intent || nextRecord.title,
      priority_basis: `Controller selected ${transition.selected_gap.id} from this Case candidate_gaps.`,
      stop_condition: 'Stop project-level selection after binding this Case; subsequent Loops select from its candidate_gaps.',
    };
    projectStateChanged = true;
  }
  let iteration = null;
  let iterationRef = '';
  const changedFiles = [];
  if (nextRecord.case_resolution.status === 'resolved') {
    const closedCaseRef = activeCaseRef.replace('/active/', '/closed/');
    applyResolvedCaseToProject(projectState, {
      timestamp: nextRecord.updated_at,
      activeCaseRef,
      closedCaseRef,
      projectImpact: nextRecord.project_impact_candidate,
      runtimeResultRef,
    });
    projectStateChanged = true;
    iterationRef = projectState.active_iteration_ref || '';
    if (iterationRef && fs.existsSync(path.join(root, iterationRef))) {
      iteration = readJson(path.join(root, iterationRef));
      applyResolvedCaseToIteration(iteration, {
        timestamp: nextRecord.updated_at,
        activeCaseRef,
        closedCaseRef,
        projectImpact: nextRecord.project_impact_candidate,
        runtimeResultRef,
      });
    }
  }
  if (projectStateChanged) {
    const projectErrors = validateProjectStateRecord(projectState, projectStatePath);
    if (projectErrors.length) throw new Error(projectErrors.join('\n'));
  }
  if (iteration) {
    const iterationErrors = validateIterationStateRecord(iteration, path.join(root, iterationRef));
    if (iterationErrors.length) throw new Error(iterationErrors.join('\n'));
  }
  let writtenCasePath = resolvedCasePath;
  if (!dryRun) {
    const closedCasePath = path.join(root, 'arckit', 'cases', 'closed', path.basename(resolvedCasePath));
    const transactionPaths = unique([
      resolvedCasePath,
      closedCasePath,
      projectStatePath,
      path.join(root, 'arckit', 'project', 'STATE.md'),
      iterationRef ? path.join(root, iterationRef) : '',
      iterationRef ? path.join(root, iterationRef.replace(/\.record\.json$/, '.md')) : '',
      path.join(root, 'arckit', 'project', 'ITERATIONS.md'),
      path.join(root, 'arckit', 'cases', 'INDEX.md'),
    ]);
    const snapshots = snapshotFiles(transactionPaths);
    try {
      writeCaseRecord(resolvedCasePath, text, nextRecord);
      changedFiles.push(activeCaseRef);
      if (nextRecord.status === 'closed' && resolvedCasePath.includes(`${path.sep}active${path.sep}`)) {
        const closedDir = path.dirname(closedCasePath);
        fs.mkdirSync(closedDir, { recursive: true });
        writtenCasePath = closedCasePath;
        fs.renameSync(resolvedCasePath, writtenCasePath);
        changedFiles.splice(changedFiles.indexOf(activeCaseRef), 1, path.relative(root, writtenCasePath));
      }
      if (projectStateChanged) {
        writeJson(projectStatePath, projectState);
        runLedgerScript(root, ['project-state.mjs', 'render', 'arckit/project/state.record.json']);
        changedFiles.push('arckit/project/state.record.json', 'arckit/project/STATE.md');
      }
      if (iteration) {
        writeJson(path.join(root, iterationRef), iteration);
        runLedgerScript(root, ['project-iteration.mjs', 'render', iterationRef]);
        runLedgerScript(root, ['project-iteration.mjs', 'index']);
        changedFiles.push(iterationRef, iterationRef.replace(/\.record\.json$/, '.md'), 'arckit/project/ITERATIONS.md');
      }
      runLedgerScript(root, ['development-case.mjs', 'index']);
      changedFiles.push('arckit/cases/INDEX.md');
    } catch (error) {
      restoreFileSnapshots(snapshots);
      throw error;
    }
  }
  return {
    schema_version: 'arckit-case-transition-result/v1',
    applied: !dryRun,
    dry_run: dryRun,
    case_path: path.relative(root, writtenCasePath),
    case_id: nextRecord.id,
    round_outcome: transition.round_outcome,
    case_resolution: nextRecord.case_resolution,
    project_impact_candidate: nextRecord.project_impact_candidate,
    changed_files: unique(changedFiles),
  };
}

function applyResolvedCaseToProject(record, { timestamp, activeCaseRef, closedCaseRef, projectImpact, runtimeResultRef }) {
  record.project.updated_at = timestamp;
  record.active_case_refs = (record.active_case_refs || []).filter((ref) => ref !== activeCaseRef);
  const transitions = projectImpact.status === 'accepted' ? projectImpact.changes : [];
  for (const change of transitions) {
    const dimension = record.completeness_dimensions?.[change.dimension];
    if (!dimension) throw new Error(`Unknown project impact dimension: ${change.dimension}`);
    if (change.from_state && dimension.current_state !== change.from_state) {
      throw new Error(`Project impact from_state mismatch for ${change.dimension}: expected ${dimension.current_state}, received ${change.from_state}`);
    }
    dimension.current_state = change.to_state;
    dimension.state_reason = change.reason;
    dimension.evidence = unique([...dimension.evidence, ...(change.evidence || []), runtimeResultRef, closedCaseRef]);
    dimension.evidence_maturity = change.evidence_maturity || 'confirmed';
    dimension.gap = change.gap || (dimension.current_state === dimension.target_state ? '' : dimension.gap);
    dimension.next_transition = change.next_transition || '';
    dimension.priority = dimension.current_state === dimension.target_state ? 'none' : dimension.priority;
  }
  record.state_gaps = (record.state_gaps || []).filter((gap) => gap.candidate_case_ref !== activeCaseRef);
  record.case_control = {
    selected_case_ref: '',
    selection_reason: `Resolved Case ${closedCaseRef}.`,
    next_case_intent: record.state_gaps.length ? 'Select or create the next bounded Case from the remaining Project state_gaps.' : '',
    priority_basis: record.state_gaps.length ? 'Controller must compare current intent, impact, urgency, risk, and dependencies; state_gaps array order is not priority.' : 'No remaining Project state gap requires selection.',
    stop_condition: record.state_gaps.length ? 'Stop after selecting or creating the next bounded Case.' : 'Stop when no further project-level advancement is intended.',
  };
  record.last_state_delta = {
    changed_dimensions: transitions.map((change) => change.dimension),
    state_transitions: transitions.map((change) => ({
      dimension: change.dimension,
      from_state: change.from_state,
      to_state: change.to_state,
      reason: change.reason,
    })),
    deferred_dimensions: [],
    blocked_dimensions: [],
    case_refs: [closedCaseRef],
    iteration_ref: record.active_iteration_ref || '',
    next_project_focus: record.case_control.next_case_intent,
    updated_at: timestamp,
  };
  record.canonical_artifact_refs = unique([...(record.canonical_artifact_refs || []), closedCaseRef, runtimeResultRef]);
}

function applyResolvedCaseToIteration(record, { timestamp, activeCaseRef, closedCaseRef, projectImpact, runtimeResultRef }) {
  const transitions = projectImpact.status === 'accepted' ? projectImpact.changes : [];
  record.updated_at = timestamp;
  record.active_case_refs = (record.active_case_refs || []).filter((ref) => ref !== activeCaseRef);
  record.closed_case_refs = unique([...(record.closed_case_refs || []), closedCaseRef]);
  record.current_state_delta = [
    ...(record.current_state_delta || []),
    ...transitions.map((change) => ({
      dimension: change.dimension,
      from_state: change.from_state,
      to_state: change.to_state,
      reason: change.reason,
      evidence: unique([...(change.evidence || []), closedCaseRef, runtimeResultRef]),
    })),
  ];
  record.last_iteration_delta = {
    changed: transitions.map((change) => change.dimension),
    blocked: [],
    deferred: [],
    next_iteration_focus: record.blocking_gaps?.length ? 'Select the next iteration focus from blocking_gaps using current evidence; array order is not priority.' : '',
    updated_at: timestamp,
  };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error.message}`);
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function snapshotFiles(files) {
  return files.map((file) => ({
    file,
    existed: fs.existsSync(file),
    content: fs.existsSync(file) ? fs.readFileSync(file) : null,
  }));
}

function restoreFileSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      fs.mkdirSync(path.dirname(snapshot.file), { recursive: true });
      fs.writeFileSync(snapshot.file, snapshot.content);
    } else if (fs.existsSync(snapshot.file)) {
      fs.unlinkSync(snapshot.file);
    }
  }
}

function runLedgerScript(projectRoot, args) {
  const [script, ...rest] = args;
  if (!new Set(['project-state.mjs', 'project-iteration.mjs', 'development-case.mjs']).has(script)) throw new Error(`Unsupported ledger script: ${script}`);
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...rest], { cwd: projectRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Development ledger script failed: ${path.basename(script)} ${rest.join(' ')}\n${result.stderr || result.stdout}`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) args._.push(argv[i]);
    else {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._[0] === 'validate') {
    const transition = JSON.parse(fs.readFileSync(path.resolve(args._[1]), 'utf8'));
    const errors = validateCaseTransition(transition, args._[1]);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${args._[1]}: ok`);
    return;
  }
  if (args._[0] === 'apply') {
    if (!args.case || !args.transition) throw new Error('apply requires --case and --transition');
    const transition = JSON.parse(fs.readFileSync(path.resolve(args.transition), 'utf8'));
    console.log(JSON.stringify(await applyCaseTransition({
      projectRoot: process.cwd(),
      casePath: args.case,
      transition,
      dryRun: args['dry-run'] === 'true',
    }), null, 2));
    return;
  }
  console.log('Usage: case-transition.mjs validate <transition.json> | apply --case <case.md> --transition <transition.json> [--dry-run true]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
