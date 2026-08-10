#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  V4_REVIEW_DIMENSIONS,
  auditCaseRecord,
  findCasePath,
  readCaseRecord,
  renderCaseRecord,
  validateCaseRecord,
  writeCaseRecord,
} from './development-case.mjs';
import { validateProjectStateRecord } from './project-state.mjs';
import { validateIterationStateRecord } from './project-iteration.mjs';
import { withProjectCommitLock } from './project-commit-lock.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_DIMENSIONS = new Set([
  'project_intent', 'users_and_stakeholders', 'problem_scenarios', 'product_behavior',
  'user_experience', 'runtime_surfaces', 'identity_access', 'data_state',
  'integration_boundaries', 'architecture_foundation', 'implementation_coverage',
  'quality_validation', 'security_privacy', 'delivery_operation',
  'observability_support', 'maintainability_handoff', 'iteration_governance',
]);
const REVIEW_FINDING_KINDS = new Set(['error', 'omission', 'excess']);

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function effectiveReviewCycleLimit(review) {
  return review.policy.initial_max_cycles + review.additional_cycles_authorized;
}

function validateGapV4(gap, label, errors, { candidate = false } = {}) {
  if (!gap || typeof gap !== 'object' || Array.isArray(gap)) {
    errors.push(`${label} must be an object`);
    return;
  }
  for (const key of ['id', 'goal', 'reason']) if (typeof gap[key] !== 'string' || !gap[key]) errors.push(`${label}.${key} is required`);
  if (!['agent', 'human', 'external'].includes(gap.responsibility)) errors.push(`${label}.responsibility is invalid`);
  for (const key of ['derived_from', 'blocked_by', 'evidence_required']) if (!Array.isArray(gap[key])) errors.push(`${label}.${key} must be an array`);
  if (!gap.priority_basis || typeof gap.priority_basis !== 'object' || Array.isArray(gap.priority_basis) || Object.keys(gap.priority_basis).length === 0) errors.push(`${label}.priority_basis is required`);
  if (!candidate && (gap.status !== 'open' || gap.resolution !== null)) errors.push(`${label} new gap must be open with null resolution`);
}

function validateCaseTransitionV4(transition, file = '<transition>') {
  const errors = [];
  if (transition?.schema_version !== 'arckit-case-transition/v4') return [`${file}: schema_version must be arckit-case-transition/v4`];
  if (!/^CASE-\d{8}-\d{3}$/.test(transition.case_id || '')) errors.push(`${file}: invalid case_id`);
  for (const key of ['case_updated_at', 'project_updated_at']) if (typeof transition[key] !== 'string' || !transition[key]) errors.push(`${file}: ${key} must be non-empty`);
  validateGapV4(transition.selected_gap, `${file}: selected_gap`, errors, { candidate: true });
  if (!transition.planned_transition?.goal || !transition.planned_transition?.expected_state_change) errors.push(`${file}: planned_transition is incomplete`);
  const delta = transition.accepted_state_delta;
  const arrayKeys = ['facts_added', 'facts_superseded', 'impacts_added', 'impacts_updated', 'gaps_added', 'gaps_cancelled', 'resolved_open_questions', 'completed_handoffs', 'resolved_review_findings'];
  if (!delta || !Object.hasOwn(delta, 'resolved_gap') || !Object.hasOwn(delta, 'completion_review_result') || !Object.hasOwn(delta, 'review_budget_extension')) errors.push(`${file}: accepted_state_delta is incomplete`);
  for (const key of arrayKeys) if (!Array.isArray(delta?.[key])) errors.push(`${file}: accepted_state_delta.${key} must be an array`);
  for (const [index, gap] of (delta?.gaps_added || []).entries()) validateGapV4(gap, `${file}: accepted_state_delta.gaps_added[${index}]`, errors);
  if (delta?.resolved_gap !== null && (!delta.resolved_gap?.id || !['resolved', 'cancelled'].includes(delta.resolved_gap?.status) || !delta.resolved_gap?.outcome || !delta.resolved_gap?.reason || !Array.isArray(delta.resolved_gap?.evidence) || delta.resolved_gap.evidence.length === 0)) errors.push(`${file}: accepted_state_delta.resolved_gap is invalid`);
  for (const [index, fact] of (delta?.facts_added || []).entries()) if (!fact?.id || !Number.isInteger(fact.revision) || fact.revision < 1 || fact.status !== 'accepted' || !fact.statement || !fact.basis || !Array.isArray(fact.evidence) || fact.evidence.length === 0) errors.push(`${file}: accepted_state_delta.facts_added[${index}] is invalid`);
  for (const [index, item] of (delta?.facts_superseded || []).entries()) if (!item?.id || !Number.isInteger(item.revision) || !item.reason || !Array.isArray(item.evidence) || item.evidence.length === 0) errors.push(`${file}: accepted_state_delta.facts_superseded[${index}] is invalid`);
  for (const [index, impact] of [...(delta?.impacts_added || []), ...(delta?.impacts_updated || [])].entries()) if (!impact?.id || !impact.fact_id || !Number.isInteger(impact.fact_revision) || !impact.condition_ref || !['upheld', 'threatened', 'undetermined'].includes(impact.effect) || !impact.reason || !Array.isArray(impact.gap_ids) || !Array.isArray(impact.evidence)) errors.push(`${file}: impact delta[${index}] is invalid`);
  const review = delta?.completion_review_result;
  if (review !== null && review !== undefined) {
    if (!['clean', 'findings', 'needs_human'].includes(review?.outcome) || !['agent', 'human'].includes(review?.reviewer) || !Number.isInteger(review?.reviewed_content_revision) || !Array.isArray(review?.findings) || !Array.isArray(review?.evidence) || review.evidence.length === 0 || !V4_REVIEW_DIMENSIONS.every((key) => ['clean', 'findings'].includes(review?.dimensions?.[key]))) errors.push(`${file}: completion_review_result is invalid`);
    for (const [index, finding] of (review?.findings || []).entries()) if (!finding?.id || !REVIEW_FINDING_KINDS.has(finding.kind) || !finding.statement || !['agent', 'human', 'external'].includes(finding.responsibility) || !Array.isArray(finding.artifact_refs) || !Array.isArray(finding.evidence) || finding.evidence.length === 0) errors.push(`${file}: completion_review_result.findings[${index}] is invalid`);
  }
  if (!Array.isArray(transition.evidence) || transition.evidence.length === 0) errors.push(`${file}: evidence must be non-empty`);
  if (!Array.isArray(transition.unresolved)) errors.push(`${file}: unresolved must be an array`);
  if (!['completed', 'partial', 'blocked', 'needs_human', 'external_wait'].includes(transition.round_outcome)) errors.push(`${file}: invalid round_outcome`);
  if (!['unresolved', 'resolved'].includes(transition.case_resolution?.claimed_status)) errors.push(`${file}: invalid case_resolution.claimed_status`);
  const impact = transition.project_impact_candidate;
  if (!['none', 'proposed', 'accepted'].includes(impact?.status) || !Array.isArray(impact?.changes) || !Array.isArray(impact?.condition_changes) || !Array.isArray(impact?.evidence)) errors.push(`${file}: invalid project_impact_candidate`);
  for (const [index, change] of (impact?.condition_changes || []).entries()) if (!['add', 'update', 'retire'].includes(change?.action) || !PROJECT_DIMENSIONS.has(change?.dimension) || !change?.condition?.id || !change.reason || !Array.isArray(change.evidence) || change.evidence.length === 0) errors.push(`${file}: project_impact_candidate.condition_changes[${index}] is invalid`);
  if (impact?.status === 'accepted' && (impact.changes.length + impact.condition_changes.length === 0 || impact.evidence.length === 0)) errors.push(`${file}: accepted project_impact_candidate requires changes and evidence`);
  return errors;
}

export function validateCaseTransition(transition, file = '<transition>') {
  if (transition?.schema_version !== 'arckit-case-transition/v4') {
    return [`${file}: schema_version must be arckit-case-transition/v4`];
  }
  return validateCaseTransitionV4(transition, file);
}

function sameCandidate(left, right) {
  return isDeepStrictEqual(left, right);
}

function applyCaseTransitionToRecordV4(record, transition, { timestamp = new Date().toISOString(), runtimeResultRef = '', conditionRefs = null } = {}) {
  const errors = validateCaseTransitionV4(transition);
  if (errors.length) throw new Error(errors.join('\n'));
  if (record.id !== transition.case_id || record.updated_at !== transition.case_updated_at) throw new Error(`Stale Case transition for ${record.id}`);
  if (record.case_resolution.status === 'resolved') throw new Error(`Case ${record.id} is already resolved`);
  const candidate = auditCaseRecord(record, record.updated_at).candidate_gaps.find((gap) => gap.id === transition.selected_gap.id);
  if (!candidate || !sameCandidate(candidate, transition.selected_gap)) throw new Error(`Selected dynamic gap is stale or not ready: ${transition.selected_gap.id}`);
  const delta = transition.accepted_state_delta;
  const isReview = candidate.id.includes(':completion-review:');
  const selectedQuestionId = candidate.id.split(':open-question:')[1] || '';
  const selectedHandoffId = candidate.id.split(':handoff:')[1] || '';
  const isVirtual = Boolean(selectedQuestionId || selectedHandoffId);
  const contentMutation = delta.facts_added.length || delta.facts_superseded.length || delta.impacts_added.length || delta.impacts_updated.length || delta.gaps_added.length || delta.gaps_cancelled.length || delta.resolved_open_questions.length || delta.completed_handoffs.length || delta.resolved_review_findings.length || delta.resolved_gap;
  if (isReview && contentMutation) throw new Error('Completion review cannot be committed with a content mutation');
  if (!isReview && !isVirtual && (!delta.resolved_gap || delta.resolved_gap.id !== candidate.id)) throw new Error('A normal v4 transition must resolve its selected dynamic gap');
  if (selectedQuestionId && !delta.resolved_open_questions.includes(selectedQuestionId)) throw new Error('Selected open question must be resolved by this transition');
  if (selectedHandoffId && !delta.completed_handoffs.includes(selectedHandoffId)) throw new Error('Selected handoff must be completed by this transition');
  if (isReview && !delta.completion_review_result && !delta.review_budget_extension) throw new Error('Completion review candidate requires a review result or human budget extension');

  const facts = new Map(record.facts.filter((fact) => fact.status === 'accepted').map((fact) => [fact.id, fact]));
  const superseded = new Map();
  for (const item of delta.facts_superseded) {
    const fact = facts.get(item.id);
    if (!fact || fact.status !== 'accepted' || fact.revision !== item.revision) throw new Error(`Cannot supersede missing/current fact ${item.id}@${item.revision}`);
    fact.status = 'superseded';
    superseded.set(item.id, fact);
    facts.delete(item.id);
  }
  for (const fact of delta.facts_added) {
    if (facts.has(fact.id)) throw new Error(`Fact ${fact.id} already has an accepted revision`);
    const prior = superseded.get(fact.id);
    if (prior && fact.revision <= prior.revision) throw new Error(`Replacement fact ${fact.id} must increment revision beyond ${prior.revision}`);
    if (!prior && record.facts.some((item) => item.id === fact.id)) throw new Error(`Fact ${fact.id} revision requires explicit supersession`);
    record.facts.push(structuredClone(fact));
    facts.set(fact.id, fact);
  }
  const gapMap = new Map(record.gaps.map((gap) => [gap.id, gap]));
  for (const gap of delta.gaps_added) {
    if (gapMap.has(gap.id)) throw new Error(`Duplicate gap id: ${gap.id}`);
    record.gaps.push(structuredClone(gap));
    gapMap.set(gap.id, gap);
  }
  if (delta.resolved_gap) {
    const gap = gapMap.get(delta.resolved_gap.id);
    if (!gap || gap.status !== 'open') throw new Error(`Selected gap is not open: ${delta.resolved_gap.id}`);
    gap.status = delta.resolved_gap.status;
    gap.resolution = { ...structuredClone(delta.resolved_gap), occurred_at: timestamp };
    delete gap.resolution.id;
  }
  for (const item of delta.gaps_cancelled) {
    const gap = gapMap.get(item.id);
    if (!gap || gap.status !== 'open' || item.id === candidate.id) throw new Error(`Cannot cancel gap ${item.id}`);
    gap.status = 'cancelled';
    gap.resolution = { status: 'cancelled', outcome: item.outcome, reason: item.reason, evidence: unique(item.evidence), occurred_at: timestamp };
  }
  const impacts = new Map(record.state_impacts.map((impact) => [impact.id, impact]));
  for (const impact of delta.impacts_added) {
    if (impacts.has(impact.id)) throw new Error(`Duplicate impact id: ${impact.id}`);
    record.state_impacts.push(structuredClone(impact));
    impacts.set(impact.id, impact);
  }
  for (const impact of delta.impacts_updated) {
    const index = record.state_impacts.findIndex((item) => item.id === impact.id);
    if (index < 0) throw new Error(`Unknown impact id: ${impact.id}`);
    record.state_impacts[index] = structuredClone(impact);
  }
  if (conditionRefs) for (const impact of record.state_impacts) if (!conditionRefs.has(impact.condition_ref)) throw new Error(`Unknown Project desired condition: ${impact.condition_ref}`);
  for (const id of delta.resolved_open_questions) {
    const item = record.open_questions.find((question) => question.id === id);
    if (!item) throw new Error(`Unknown open question: ${id}`);
    item.status = 'resolved';
    item.evidence = unique([...(item.evidence || []), ...transition.evidence]);
  }
  for (const id of delta.completed_handoffs) {
    const item = record.pending_handoffs.find((handoff) => handoff.id === id);
    if (!item) throw new Error(`Unknown pending handoff: ${id}`);
    item.status = 'completed';
    item.evidence = unique([...(item.evidence || []), ...transition.evidence]);
  }
  if (contentMutation) {
    record.content_revision += 1;
    record.completion_review.status = 'pending';
    record.completion_review.reviewed_content_revision = null;
    record.completion_review.escalation = null;
  }
  if (delta.completion_review_result) applyCompletionReviewResultV4(record, delta.completion_review_result, candidate, timestamp);
  if (delta.review_budget_extension) {
    const extension = delta.review_budget_extension;
    if (candidate.responsibility !== 'human' || extension.authorized_by !== 'human' || !Number.isInteger(extension.additional_cycles) || extension.additional_cycles < 1) throw new Error('Invalid human review budget extension');
    record.completion_review.additional_cycles_authorized += extension.additional_cycles;
    record.completion_review.human_authorizations.push({ ...structuredClone(extension), authorized_at: timestamp });
    record.completion_review.status = 'pending';
  }
  const provisional = auditCaseRecord(record, timestamp);
  if (transition.case_resolution.claimed_status === 'resolved' && provisional.status !== 'resolved') throw new Error(`Controller claimed Case resolved, but ledger still finds: ${provisional.remaining.join(', ')}`);
  if (transition.project_impact_candidate.status === 'accepted' && provisional.status !== 'resolved') throw new Error('Project impact cannot be accepted before Case resolution');
  record.project_impact_candidate = structuredClone(transition.project_impact_candidate);
  record.rounds.push({ round: record.rounds.length + 1, goal: transition.planned_transition.goal, outcome: transition.round_outcome, planned_transition: transition.planned_transition.expected_state_change, accepted_state_delta: structuredClone(delta), evidence: unique(transition.evidence), runtime_result_ref: runtimeResultRef || transition.runtime_result_ref || '', occurred_at: timestamp });
  record.updated_at = timestamp;
  record.case_resolution = auditCaseRecord(record, timestamp);
  record.current_round = { goal: '', selected_gap: null };
  record.status = record.case_resolution.status === 'resolved' ? 'closed' : record.case_resolution.loop_handoff.next_responsibility === 'human' ? 'handoff' : 'active';
  const recordErrors = validateCaseRecord(record);
  if (recordErrors.length) throw new Error(recordErrors.join('\n'));
  return record;
}

function applyCompletionReviewResultV4(record, result, candidate, timestamp) {
  if (result.reviewed_content_revision !== record.content_revision) throw new Error(`Completion review must cover content_revision=${record.content_revision}`);
  if (result.reviewer !== candidate.responsibility) throw new Error('Completion review responsibility mismatch');
  const hasFindings = result.findings.length > 0 || V4_REVIEW_DIMENSIONS.some((key) => result.dimensions[key] === 'findings');
  if ((result.outcome === 'clean') === hasFindings) throw new Error('Completion review outcome and findings disagree');
  const limit = effectiveReviewCycleLimit(record.completion_review);
  if (result.reviewer === 'agent' && record.completion_review.cycle_count >= limit) throw new Error('Autonomous completion review budget is exhausted');
  if (result.reviewer === 'agent') record.completion_review.cycle_count += 1;
  for (const finding of result.findings) {
    const gapId = `${record.id}:review-finding:${finding.id}`;
    if (record.gaps.some((gap) => gap.id === gapId)) throw new Error(`Duplicate review finding: ${finding.id}`);
    record.gaps.push({ id: gapId, status: 'open', goal: `Resolve review finding: ${finding.statement}`, reason: `${finding.kind} found by completion review`, derived_from: ['completion_review', `content_revision:${record.content_revision}`], blocked_by: [], priority_basis: { blocking: 'high', risk: 'high' }, responsibility: finding.responsibility, evidence_required: unique([...finding.artifact_refs, ...finding.evidence]), resolution: null });
  }
  record.completion_review.reviewed_content_revision = record.content_revision;
  record.completion_review.dimensions = structuredClone(result.dimensions);
  record.completion_review.evidence = unique([...record.completion_review.evidence, ...result.evidence]);
  record.completion_review.cycles.push({ cycle: record.completion_review.cycles.length + 1, autonomous_cycle: result.reviewer === 'agent' ? record.completion_review.cycle_count : null, reviewer: result.reviewer, outcome: result.outcome, content_revision: record.content_revision, dimensions: structuredClone(result.dimensions), finding_ids: result.findings.map((finding) => finding.id), evidence: unique(result.evidence), occurred_at: timestamp });
  record.completion_review.status = result.outcome === 'clean' ? 'clean' : result.outcome === 'needs_human' || (result.reviewer === 'agent' && record.completion_review.cycle_count >= limit) ? 'needs_human' : 'findings_open';
  record.completion_review.escalation = record.completion_review.status === 'needs_human' ? { reason: 'review_requires_human', triggered_at_cycle: record.completion_review.cycle_count, effective_max_cycles: limit, evidence: unique(result.evidence), triggered_at: timestamp } : null;
}

export function applyCaseTransitionToRecord(record, transition, options = {}) {
  if (record?.schema_version !== 'development-case-record/v4') {
    throw new Error(`Unsupported Case State schema: ${record?.schema_version || '<missing>'}; expected development-case-record/v4`);
  }
  return applyCaseTransitionToRecordV4(record, transition, options);
}

export async function applyCaseTransition({ projectRoot, casePath = '', transition, runtimeResultRef = '', dryRun = false }) {
  if (dryRun) return applyCaseTransitionUnlocked({ projectRoot, casePath, transition, runtimeResultRef, dryRun });
  return withProjectCommitLock(projectRoot, () => applyCaseTransitionUnlocked({
    projectRoot,
    casePath,
    transition,
    runtimeResultRef,
    dryRun: false,
  }));
}

async function applyCaseTransitionUnlocked({ projectRoot, casePath = '', transition, runtimeResultRef = '', dryRun = false }) {
  const root = path.resolve(projectRoot);
  const resolvedCasePath = casePath
    ? path.resolve(root, casePath)
    : findCasePath(transition.case_id);
  if (!resolvedCasePath || !resolvedCasePath.startsWith(root + path.sep)) throw new Error(`Case path is missing or outside project root for ${transition.case_id}`);
  const { text, record } = readCaseRecord(resolvedCasePath);
  const activeCaseRef = path.relative(root, resolvedCasePath);
  const projectStatePath = path.join(root, 'arckit', 'project', 'state.record.json');
  const projectState = readJson(projectStatePath);
  if (!(projectState.active_case_refs || []).includes(activeCaseRef)) {
    throw new Error(`Case transition target is not registered in Project active_case_refs: ${activeCaseRef}`);
  }
  const timestamp = nextRevisionTimestamp(record.updated_at, projectState.project?.updated_at);
  const conditionRefs = new Set(Object.entries(projectState.completeness_dimensions || {}).flatMap(([dimension, state]) => (state.desired_conditions || []).map((condition) => `${dimension}.${condition.id}`)));
  const nextRecord = applyCaseTransitionToRecord(structuredClone(record), transition, { timestamp, runtimeResultRef, conditionRefs });
  let projectStateChanged = false;
  let iteration = null;
  let iterationRef = '';
  const changedFiles = [];
  if (nextRecord.case_resolution.status === 'resolved') {
    if (projectState.project?.updated_at !== transition.project_updated_at) {
      throw new Error(`Stale Project aggregation for ${nextRecord.id}: expected updated_at=${projectState.project?.updated_at || '<missing>'}, received ${transition.project_updated_at}`);
    }
    const closedCaseRef = activeCaseRef.replace('/active/', '/closed/');
    applyResolvedCaseToProject(projectState, {
      timestamp: nextRecord.updated_at,
      activeCaseRef,
      closedCaseRef,
      projectImpact: nextRecord.project_impact_candidate,
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
        projectState,
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
  renderCaseRecord(text, nextRecord, resolvedCasePath);
  runLedgerScript(root, ['development-case.mjs', 'index', '--dry-run', 'true']);
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

function nextRevisionTimestamp(...revisions) {
  const latestRevision = Math.max(0, ...revisions.map((revision) => Date.parse(revision || '') || 0));
  return new Date(Math.max(Date.now(), latestRevision + 1)).toISOString();
}

function applyResolvedCaseToProject(record, { timestamp, activeCaseRef, closedCaseRef, projectImpact }) {
  record.project.updated_at = timestamp;
  record.active_case_refs = (record.active_case_refs || []).filter((ref) => ref !== activeCaseRef);
  const transitions = projectImpact.status === 'accepted' ? projectImpact.changes : [];
  const conditionChanges = projectImpact.status === 'accepted' ? (projectImpact.condition_changes || []) : [];
  for (const change of transitions) {
    const dimension = record.completeness_dimensions?.[change.dimension];
    if (!dimension) throw new Error(`Unknown project impact dimension: ${change.dimension}`);
    if (change.from_state && dimension.current_state !== change.from_state) {
      throw new Error(`Project impact from_state mismatch for ${change.dimension}: expected ${dimension.current_state}, received ${change.from_state}`);
    }
    dimension.current_state = change.to_state;
    dimension.state_reason = change.reason;
    dimension.evidence = unique([...dimension.evidence, ...(change.evidence || []), closedCaseRef]);
    dimension.evidence_maturity = change.evidence_maturity || 'confirmed';
    dimension.gap = change.gap || (dimension.current_state === dimension.target_state ? '' : dimension.gap);
    dimension.next_transition = change.next_transition || '';
    dimension.priority = dimension.current_state === dimension.target_state ? 'none' : dimension.priority;
  }
  for (const change of conditionChanges) {
    const dimension = record.completeness_dimensions?.[change.dimension];
    if (!dimension) throw new Error(`Unknown condition dimension: ${change.dimension}`);
    dimension.desired_conditions ||= [];
    const index = dimension.desired_conditions.findIndex((condition) => condition.id === change.condition.id);
    if (change.action === 'add') {
      if (index >= 0) throw new Error(`Condition already exists: ${change.dimension}.${change.condition.id}`);
      dimension.desired_conditions.push(structuredClone(change.condition));
    } else {
      if (index < 0) throw new Error(`Condition does not exist: ${change.dimension}.${change.condition.id}`);
      dimension.desired_conditions[index] = change.action === 'retire'
        ? { ...dimension.desired_conditions[index], status: 'retired' }
        : structuredClone(change.condition);
    }
  }
  record.state_gaps = (record.state_gaps || []).map((gap) => {
    const coveredDimensions = unique(gap.covered_dimensions || [gap.dimension]);
    const stillUnresolved = coveredDimensions.some((key) => {
      const dimension = record.completeness_dimensions?.[key];
      return dimension && dimension.current_state !== dimension.target_state;
    });
    if (!stillUnresolved) return null;
    const primary = record.completeness_dimensions?.[gap.dimension];
    const next = {
      ...gap,
      current_state: primary?.current_state || gap.current_state,
      target_state: primary?.target_state || gap.target_state,
    };
    if (gap.candidate_case_ref === activeCaseRef) delete next.candidate_case_ref;
    return next;
  }).filter(Boolean);
  record.case_control = {
    next_case_intent: record.active_case_refs.length
      ? 'Select one active Case for each independent Loop.'
      : record.state_gaps.length ? 'Create the next bounded Case from the remaining Project state_gaps.' : '',
    priority_basis: record.state_gaps.length ? 'Controller must compare current intent, impact, urgency, risk, and dependencies; state_gaps array order is not priority.' : 'No remaining Project state gap requires selection.',
    stop_condition: record.active_case_refs.length || record.state_gaps.length ? 'Stop after one active Case and one candidate gap are selected for the current Loop.' : 'Stop when no further project-level advancement is intended.',
  };
  record.last_state_delta = {
    changed_dimensions: transitions.map((change) => change.dimension),
    state_transitions: transitions.map((change) => ({
      dimension: change.dimension,
      from_state: change.from_state,
      to_state: change.to_state,
      reason: change.reason,
    })),
    condition_changes: conditionChanges.map((change) => ({ action: change.action, dimension: change.dimension, condition_id: change.condition.id })),
    deferred_dimensions: [],
    blocked_dimensions: [],
    case_refs: [closedCaseRef],
    iteration_ref: record.active_iteration_ref || '',
    next_project_focus: record.case_control.next_case_intent,
    updated_at: timestamp,
  };
  record.canonical_artifact_refs = unique([
    ...(record.canonical_artifact_refs || []).map((ref) => ref === activeCaseRef ? closedCaseRef : ref),
    closedCaseRef,
  ]);
}

function applyResolvedCaseToIteration(record, { timestamp, activeCaseRef, closedCaseRef, projectImpact, projectState }) {
  const transitions = projectImpact.status === 'accepted' ? projectImpact.changes : [];
  const conditionChanges = projectImpact.status === 'accepted' ? (projectImpact.condition_changes || []) : [];
  record.updated_at = timestamp;
  record.active_case_refs = unique(projectState.active_case_refs || []).filter((ref) => ref !== activeCaseRef);
  record.closed_case_refs = unique([...(record.closed_case_refs || []), closedCaseRef]);
  record.accepted_project_changes = [
    ...(record.accepted_project_changes || []),
    ...transitions.map((change) => ({
      dimension: change.dimension,
      from_state: change.from_state,
      to_state: change.to_state,
      reason: change.reason,
      evidence: unique([...(change.evidence || []), closedCaseRef]),
      case_ref: closedCaseRef,
    })),
  ];
  const targetDimensions = new Set((record.target_project_states || []).map((target) => target.dimension));
  record.acceptance.remaining_project_gaps = (projectState.state_gaps || [])
    .filter((gap) => (gap.covered_dimensions || [gap.dimension]).some((dimension) => targetDimensions.has(dimension)))
    .map((gap) => gap.id);
  const targetsSatisfied = (record.target_project_states || []).every((target) => projectState.completeness_dimensions?.[target.dimension]?.current_state === target.target_state);
  if (targetsSatisfied) record.acceptance.status = 'accepted';
  record.acceptance.evidence = unique([...(record.acceptance.evidence || []), closedCaseRef]);
  record.last_case_aggregation = {
    case_ref: closedCaseRef,
    project_changes: transitions.map((change) => ({
      dimension: change.dimension,
      from_state: change.from_state,
      to_state: change.to_state,
    })),
    condition_changes: conditionChanges.map((change) => ({ action: change.action, dimension: change.dimension, condition_id: change.condition.id })),
    evidence: unique([closedCaseRef, ...transitions.flatMap((change) => change.evidence || [])]),
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
    if (!args._[1]) throw new Error('validate requires <transition.json|->');
    const transition = readTransitionInput(args._[1]);
    const errors = validateCaseTransition(transition, inputLabel(args._[1]));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${inputLabel(args._[1])}: ok`);
    return;
  }
  if (args._[0] === 'apply') {
    if (!args.case || !args.transition) throw new Error('apply requires --case and --transition');
    const transition = readTransitionInput(args.transition);
    console.log(JSON.stringify(await applyCaseTransition({
      projectRoot: process.cwd(),
      casePath: args.case,
      transition,
      dryRun: args['dry-run'] === 'true',
    }), null, 2));
    return;
  }
  console.log('Usage: case-transition.mjs validate <transition.json|-> | apply --case <case.md> --transition <transition.json|-> [--dry-run true]');
}

function readTransitionInput(input) {
  const text = input === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(input), 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${inputLabel(input)}: invalid transition json: ${error.message}`);
  }
}

function inputLabel(input) {
  return input === '-' ? '<stdin>' : input;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
