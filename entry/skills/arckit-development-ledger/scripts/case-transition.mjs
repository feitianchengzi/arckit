#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { REVIEW_DIMENSIONS, auditCaseRecord, findCasePath, readCaseRecord, renderCaseRecord, validateCaseRecord, writeCaseRecord } from './development-case.mjs';
import { projectTargetRefs, validateProjectStateRecord } from './project-state.mjs';
import { coreSoftwareInvariantIds } from './project-invariants.mjs';
import { validateIterationStateRecord } from './project-iteration.mjs';
import { withProjectCommitLock } from './project-commit-lock.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const FINDING_KINDS = new Set(['error', 'omission', 'excess']);

function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function nextTimestamp(...values) { return new Date(Math.max(Date.now(), ...values.map((value) => Date.parse(value || '') + 1 || 0))).toISOString(); }
function hasProjectChanges(delta) { return Boolean(delta && (delta.software_definition_changes.length || delta.software_invariant_changes.length || delta.project_gap_changes.length || delta.selection_context_change)); }

function validateGap(gap, label, errors, { candidate = false } = {}) {
  if (!isObject(gap)) return errors.push(`${label} must be an object`);
  for (const key of ['id', 'goal', 'reason']) if (typeof gap[key] !== 'string' || !gap[key]) errors.push(`${label}.${key} is required`);
  if (!['agent', 'human', 'external'].includes(gap.responsibility)) errors.push(`${label}.responsibility is invalid`);
  for (const key of ['derived_from', 'blocked_by', 'evidence_required']) if (!Array.isArray(gap[key])) errors.push(`${label}.${key} must be an array`);
  if (!isObject(gap.priority_basis) || Object.keys(gap.priority_basis).length === 0) errors.push(`${label}.priority_basis is required`);
  if (!candidate && (gap.status !== 'open' || gap.resolution !== null)) errors.push(`${label} new gap must be open with null resolution`);
}

function validateImpact(impact, label, errors) {
  if (!impact?.id || !impact.fact_id || !Number.isInteger(impact.fact_revision) || !isObject(impact.target) || !['software_decision', 'software_invariant'].includes(impact.target.kind) || !impact.target.ref || (impact.target.kind === 'software_decision' ? !Number.isInteger(impact.target.revision) : impact.target.revision !== null) || !['upheld', 'threatened', 'undetermined'].includes(impact.effect) || !impact.reason || !Array.isArray(impact.gap_ids) || !Array.isArray(impact.evidence)) errors.push(`${label} is invalid`);
}

function validateProjectStateDelta(delta, label, errors) {
  if (!isObject(delta)) return errors.push(`${label} must be an object`);
  for (const key of ['software_definition_changes', 'software_invariant_changes', 'project_gap_changes', 'evidence']) if (!Array.isArray(delta[key])) errors.push(`${label}.${key} must be an array`);
  if (!Object.hasOwn(delta, 'selection_context_change') || (delta.selection_context_change !== null && !isObject(delta.selection_context_change))) errors.push(`${label}.selection_context_change must be object or null`);
  for (const [index, change] of (delta.software_definition_changes || []).entries()) {
    if (!change?.area_ref || !Number.isInteger(change.observed_revision) || !isObject(change.set_decision) || !Array.isArray(change.gap_refs) || !change.reason || !Array.isArray(change.evidence) || change.evidence.length === 0) errors.push(`${label}.software_definition_changes[${index}] is invalid`);
  }
  for (const [index, change] of (delta.software_invariant_changes || []).entries()) {
    if (!['add', 'update', 'retire'].includes(change?.action) || !change?.invariant?.id || !change.reason || !Array.isArray(change.evidence) || change.evidence.length === 0) errors.push(`${label}.software_invariant_changes[${index}] is invalid`);
    else if (coreSoftwareInvariantIds().has(change.invariant.id)) errors.push(`${label}.software_invariant_changes[${index}] cannot change a protocol-defined core software invariant`);
  }
  for (const [index, change] of (delta.project_gap_changes || []).entries()) {
    if (!['add', 'update', 'resolve'].includes(change?.action) || (change.action === 'add' || change.action === 'update' ? !change.gap?.id : !change.gap_id) || !change.reason || !Array.isArray(change.evidence) || change.evidence.length === 0) errors.push(`${label}.project_gap_changes[${index}] is invalid`);
  }
  if (hasProjectChanges(delta) && delta.evidence.length === 0) errors.push(`${label}.evidence must be non-empty when Project State changes`);
}

export function validateCaseTransition(transition, file = '<transition>') {
  const errors = [];
  if (transition?.schema_version !== 'arckit-case-transition/v5') return [`${file}: schema_version must be arckit-case-transition/v5`];
  if (!/^CASE-\d{8}-\d{3}$/.test(transition.case_id || '')) errors.push(`${file}: invalid case_id`);
  if (!transition.case_updated_at || !Number.isInteger(transition.project_revision)) errors.push(`${file}: Case and Project revisions are required`);
  validateGap(transition.selected_gap, `${file}: selected_gap`, errors, { candidate: true });
  if (!transition.planned_transition?.goal || !transition.planned_transition?.expected_state_change) errors.push(`${file}: planned_transition is incomplete`);
  const delta = transition.accepted_state_delta;
  const arrays = ['facts_added', 'facts_superseded', 'impacts_added', 'impacts_updated', 'gaps_added', 'gaps_cancelled', 'resolved_open_questions', 'completed_handoffs', 'resolved_review_findings'];
  if (!isObject(delta) || !Object.hasOwn(delta, 'resolved_gap') || !Object.hasOwn(delta, 'completion_review_result') || !Object.hasOwn(delta, 'review_budget_extension')) errors.push(`${file}: accepted_state_delta is incomplete`);
  for (const key of arrays) if (!Array.isArray(delta?.[key])) errors.push(`${file}: accepted_state_delta.${key} must be an array`);
  for (const [index, fact] of (delta?.facts_added || []).entries()) if (!fact?.id || !Number.isInteger(fact.revision) || fact.status !== 'accepted' || !fact.statement || !fact.basis || !Array.isArray(fact.evidence) || fact.evidence.length === 0) errors.push(`${file}: facts_added[${index}] is invalid`);
  for (const [index, impact] of [...(delta?.impacts_added || []), ...(delta?.impacts_updated || [])].entries()) validateImpact(impact, `${file}: impact delta[${index}]`, errors);
  for (const [index, gap] of (delta?.gaps_added || []).entries()) validateGap(gap, `${file}: gaps_added[${index}]`, errors);
  if (delta?.resolved_gap !== null && (!delta.resolved_gap?.id || !['resolved', 'cancelled'].includes(delta.resolved_gap.status) || !delta.resolved_gap.outcome || !delta.resolved_gap.reason || !Array.isArray(delta.resolved_gap.evidence) || delta.resolved_gap.evidence.length === 0)) errors.push(`${file}: resolved_gap is invalid`);
  if (!Array.isArray(transition.evidence) || transition.evidence.length === 0 || !Array.isArray(transition.unresolved)) errors.push(`${file}: evidence and unresolved are required arrays`);
  if (!['completed', 'partial', 'blocked', 'needs_human', 'external_wait'].includes(transition.round_outcome)) errors.push(`${file}: round_outcome is invalid`);
  if (!['unresolved', 'resolved'].includes(transition.case_resolution?.claimed_status)) errors.push(`${file}: case_resolution.claimed_status is invalid`);
  validateProjectStateDelta(transition.project_state_delta, `${file}: project_state_delta`, errors);
  return errors;
}

function validateTargetAgainstProject(impact, project, label) {
  const refs = projectTargetRefs(project);
  if (!refs[impact.target.kind]?.has(impact.target.ref)) throw new Error(`${label} references unknown Project ${impact.target.kind}: ${impact.target.ref}`);
  if (impact.target.kind === 'software_decision') {
    const area = project.software_definition.decision_areas.find((item) => item.id === impact.target.ref);
    if (area.decision.revision !== impact.target.revision) throw new Error(`${label} references stale software decision ${impact.target.ref}@${impact.target.revision}; current revision is ${area.decision.revision}`);
  }
}

function applyProjectStateDelta(record, delta, timestamp) {
  if (!hasProjectChanges(delta)) return false;
  const coreIds = coreSoftwareInvariantIds();
  for (const change of delta.project_gap_changes) {
    const gaps = record.advancement.project_gaps;
    const index = gaps.findIndex((gap) => gap.id === (change.gap?.id || change.gap_id));
    if (change.action === 'add') {
      if (index >= 0) throw new Error(`Project gap already exists: ${change.gap.id}`);
      gaps.push(structuredClone(change.gap));
    } else if (change.action === 'update') {
      if (index < 0) throw new Error(`Project gap does not exist: ${change.gap.id}`);
      gaps[index] = structuredClone(change.gap);
    } else {
      if (index < 0) throw new Error(`Project gap does not exist: ${change.gap_id}`);
      gaps.splice(index, 1);
      for (const area of record.software_definition.decision_areas) area.gap_refs = area.gap_refs.filter((id) => id !== change.gap_id);
    }
  }
  for (const change of delta.software_definition_changes) {
    const area = record.software_definition.decision_areas.find((item) => item.id === change.area_ref);
    if (!area) throw new Error(`Unknown software decision area: ${change.area_ref}`);
    if (area.decision.revision !== change.observed_revision) throw new Error(`Stale software decision ${change.area_ref}: expected revision ${area.decision.revision}, received ${change.observed_revision}`);
    area.decision = { ...structuredClone(change.set_decision), revision: change.observed_revision + 1 };
    area.gap_refs = unique(change.gap_refs);
  }
  for (const change of delta.software_invariant_changes) {
    if (coreIds.has(change.invariant.id)) throw new Error(`Core software invariant cannot change: ${change.invariant.id}`);
    const index = record.software_invariants.findIndex((item) => item.id === change.invariant.id);
    if (change.action === 'add') {
      if (index >= 0) throw new Error(`Software invariant already exists: ${change.invariant.id}`);
      record.software_invariants.push(structuredClone(change.invariant));
    } else if (change.action === 'update') {
      if (index < 0) throw new Error(`Software invariant does not exist: ${change.invariant.id}`);
      record.software_invariants[index] = structuredClone(change.invariant);
    } else {
      if (index < 0) throw new Error(`Software invariant does not exist: ${change.invariant.id}`);
      record.software_invariants.splice(index, 1);
    }
  }
  if (delta.selection_context_change) record.advancement.selection_context = { ...record.advancement.selection_context, ...structuredClone(delta.selection_context_change) };
  record.project.revision += 1;
  record.project.updated_at = timestamp;
  return true;
}

function applyReview(record, result, candidate, timestamp) {
  if (!result || !['clean', 'findings', 'needs_human'].includes(result.outcome) || !['agent', 'human'].includes(result.reviewer) || result.reviewed_content_revision !== record.content_revision || !Array.isArray(result.findings) || !Array.isArray(result.evidence) || result.evidence.length === 0 || !REVIEW_DIMENSIONS.every((key) => ['clean', 'findings'].includes(result.dimensions?.[key]))) throw new Error('completion_review_result is invalid');
  if (result.reviewer !== candidate.responsibility) throw new Error('Completion review responsibility mismatch');
  const hasFindings = result.findings.length > 0 || REVIEW_DIMENSIONS.some((key) => result.dimensions[key] === 'findings');
  if ((result.outcome === 'clean') === hasFindings) throw new Error('Completion review outcome and findings disagree');
  const review = record.completion_review;
  const limit = review.policy.initial_max_cycles + review.additional_cycles_authorized;
  if (result.reviewer === 'agent') {
    if (review.cycle_count >= limit) throw new Error('Autonomous completion review budget is exhausted');
    review.cycle_count += 1;
  }
  for (const finding of result.findings) {
    if (!finding?.id || !FINDING_KINDS.has(finding.kind) || !finding.statement || !['agent', 'human', 'external'].includes(finding.responsibility) || !Array.isArray(finding.artifact_refs) || !Array.isArray(finding.evidence) || finding.evidence.length === 0) throw new Error(`Invalid completion review finding: ${finding?.id || '<missing>'}`);
    const gapId = `${record.id}:review-finding:${finding.id}`;
    record.gaps.push({ id: gapId, status: 'open', goal: `Resolve review finding: ${finding.statement}`, reason: `${finding.kind} found by completion review`, derived_from: ['completion_review', `content_revision:${record.content_revision}`], blocked_by: [], priority_basis: { blocking: 'high', risk: 'high' }, responsibility: finding.responsibility, evidence_required: unique([...finding.artifact_refs, ...finding.evidence]), resolution: null });
  }
  review.reviewed_content_revision = record.content_revision;
  review.dimensions = structuredClone(result.dimensions);
  review.evidence = unique([...review.evidence, ...result.evidence]);
  review.cycles.push({ cycle: review.cycles.length + 1, autonomous_cycle: result.reviewer === 'agent' ? review.cycle_count : null, reviewer: result.reviewer, outcome: result.outcome, content_revision: record.content_revision, dimensions: structuredClone(result.dimensions), finding_ids: result.findings.map((item) => item.id), evidence: unique(result.evidence), occurred_at: timestamp });
  review.status = result.outcome === 'clean' ? 'clean' : result.outcome === 'needs_human' || (result.reviewer === 'agent' && review.cycle_count >= limit) ? 'needs_human' : 'findings_open';
  review.escalation = review.status === 'needs_human' ? { reason: 'review_requires_human', triggered_at_cycle: review.cycle_count, effective_max_cycles: limit, evidence: unique(result.evidence), triggered_at: timestamp } : null;
}

export function applyCaseTransitionToRecord(record, transition, { timestamp = new Date().toISOString(), runtimeResultRef = '', projectState = null } = {}) {
  const errors = validateCaseTransition(transition);
  if (errors.length) throw new Error(errors.join('\n'));
  if (record.schema_version !== 'development-case-record/v5') throw new Error(`Unsupported Case State schema: ${record.schema_version || '<missing>'}`);
  if (record.id !== transition.case_id) throw new Error(`Case transition targets ${transition.case_id}, not ${record.id}`);
  if (record.updated_at !== transition.case_updated_at) throw new Error(`Stale Case transition for ${record.id}`);
  const candidate = auditCaseRecord(record, record.updated_at).candidate_gaps.find((gap) => gap.id === transition.selected_gap.id);
  if (!candidate || !isDeepStrictEqual(candidate, transition.selected_gap)) throw new Error(`Selected dynamic gap is stale or not ready: ${transition.selected_gap.id}`);
  const delta = transition.accepted_state_delta;
  const isReview = candidate.id.includes(':completion-review:');
  const questionId = candidate.id.split(':open-question:')[1] || '';
  const handoffId = candidate.id.split(':handoff:')[1] || '';
  const contentMutation = Boolean(delta.resolved_gap || delta.facts_added.length || delta.facts_superseded.length || delta.impacts_added.length || delta.impacts_updated.length || delta.gaps_added.length || delta.gaps_cancelled.length || delta.resolved_open_questions.length || delta.completed_handoffs.length || delta.resolved_review_findings.length);
  if (isReview && contentMutation) throw new Error('Completion review cannot be committed with a content mutation');
  if (!isReview && !questionId && !handoffId && delta.resolved_gap?.id !== candidate.id) throw new Error('A normal transition must resolve its selected dynamic gap');
  if (questionId && !delta.resolved_open_questions.includes(questionId)) throw new Error('Selected question must be resolved');
  if (handoffId && !delta.completed_handoffs.includes(handoffId)) throw new Error('Selected handoff must be completed');

  const acceptedFacts = new Map(record.facts.filter((fact) => fact.status === 'accepted').map((fact) => [fact.id, fact]));
  for (const item of delta.facts_superseded) {
    const fact = acceptedFacts.get(item.id);
    if (!fact || fact.revision !== item.revision || !item.reason || !Array.isArray(item.evidence) || item.evidence.length === 0) throw new Error(`Cannot supersede fact ${item.id}@${item.revision}`);
    fact.status = 'superseded';
    acceptedFacts.delete(item.id);
  }
  for (const fact of delta.facts_added) {
    if (acceptedFacts.has(fact.id)) throw new Error(`Fact ${fact.id} already has an accepted revision`);
    record.facts.push(structuredClone(fact));
    acceptedFacts.set(fact.id, fact);
  }
  const gaps = new Map(record.gaps.map((gap) => [gap.id, gap]));
  for (const gap of delta.gaps_added) {
    if (gaps.has(gap.id)) throw new Error(`Duplicate gap id: ${gap.id}`);
    record.gaps.push(structuredClone(gap)); gaps.set(gap.id, gap);
  }
  if (delta.resolved_gap) Object.assign(gaps.get(delta.resolved_gap.id), { status: delta.resolved_gap.status, resolution: { ...structuredClone(delta.resolved_gap), occurred_at: timestamp } });
  for (const item of delta.gaps_cancelled) {
    const gap = gaps.get(item.id);
    if (!gap || gap.status !== 'open' || !item.reason || !Array.isArray(item.evidence) || item.evidence.length === 0) throw new Error(`Cannot cancel gap ${item.id}`);
    gap.status = 'cancelled'; gap.resolution = { status: 'cancelled', outcome: item.outcome || 'Cancelled', reason: item.reason, evidence: item.evidence, occurred_at: timestamp };
  }
  const impacts = new Map(record.state_impacts.map((impact) => [impact.id, impact]));
  for (const impact of delta.impacts_added) {
    if (impacts.has(impact.id)) throw new Error(`Duplicate impact id: ${impact.id}`);
    record.state_impacts.push(structuredClone(impact)); impacts.set(impact.id, impact);
  }
  for (const impact of delta.impacts_updated) {
    if (!impacts.has(impact.id)) throw new Error(`Unknown impact id: ${impact.id}`);
    Object.assign(impacts.get(impact.id), structuredClone(impact));
  }
  for (const id of delta.resolved_open_questions) { const item = record.open_questions.find((value) => value.id === id); if (!item) throw new Error(`Unknown question ${id}`); item.status = 'resolved'; }
  for (const id of delta.completed_handoffs) { const item = record.pending_handoffs.find((value) => value.id === id); if (!item) throw new Error(`Unknown handoff ${id}`); item.status = 'completed'; }
  if (isReview) applyReview(record, delta.completion_review_result, candidate, timestamp);
  if (contentMutation) { record.content_revision += 1; record.completion_review.status = 'pending'; record.completion_review.reviewed_content_revision = null; }
  if (projectState) for (const [index, impact] of record.state_impacts.entries()) validateTargetAgainstProject(impact, projectState, `state_impacts[${index}]`);
  record.rounds.push({ round: record.rounds.length + 1, goal: transition.planned_transition.goal, outcome: transition.round_outcome, selected_gap: structuredClone(transition.selected_gap), planned_transition: structuredClone(transition.planned_transition), accepted_state_delta: structuredClone(delta), project_state_delta: structuredClone(transition.project_state_delta), evidence: unique(transition.evidence), runtime_result_ref: runtimeResultRef, occurred_at: timestamp });
  record.updated_at = timestamp;
  record.case_resolution = auditCaseRecord(record, timestamp);
  if (transition.case_resolution.claimed_status === 'resolved' && record.case_resolution.status !== 'resolved') throw new Error('Claimed resolved is stronger than deterministic Case audit');
  record.status = record.case_resolution.status === 'resolved' ? 'closed' : record.case_resolution.stage === 'blocked' ? 'blocked' : record.case_resolution.loop_handoff.next_responsibility === 'human' ? 'handoff' : 'active';
  const recordErrors = validateCaseRecord(record);
  if (recordErrors.length) throw new Error(recordErrors.join('\n'));
  return record;
}

export async function applyCaseTransition({ projectRoot, casePath = '', transition, runtimeResultRef = '', dryRun = false }) {
  if (dryRun) return applyUnlocked({ projectRoot, casePath, transition, runtimeResultRef, dryRun });
  return withProjectCommitLock(projectRoot, () => applyUnlocked({ projectRoot, casePath, transition, runtimeResultRef, dryRun: false }));
}

async function applyUnlocked({ projectRoot, casePath, transition, runtimeResultRef, dryRun }) {
  const root = path.resolve(projectRoot);
  const caseFile = casePath ? path.resolve(root, casePath) : findCasePath(transition.case_id);
  if (!caseFile || !caseFile.startsWith(root + path.sep)) throw new Error(`Case path is missing or outside project root for ${transition.case_id}`);
  const activeCaseRef = path.relative(root, caseFile).replaceAll('\\', '/');
  const projectFile = path.join(root, 'arckit/project/state.record.json');
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  if (!project.advancement.active_case_refs.includes(activeCaseRef)) throw new Error(`Case is not registered in advancement.active_case_refs: ${activeCaseRef}`);
  const closesCase = transition.case_resolution?.claimed_status === 'resolved';
  if ((hasProjectChanges(transition.project_state_delta) || closesCase) && project.project.revision !== transition.project_revision) throw new Error(`Stale Project transition: expected revision ${project.project.revision}, received ${transition.project_revision}`);
  const timestamp = nextTimestamp(project.project.updated_at, readCaseRecord(caseFile).record.updated_at);
  const projectedProject = structuredClone(project);
  const projectChangedByDelta = applyProjectStateDelta(projectedProject, transition.project_state_delta, timestamp);
  const { text, record } = readCaseRecord(caseFile);
  const nextCase = applyCaseTransitionToRecord(structuredClone(record), transition, { timestamp, runtimeResultRef, projectState: projectedProject });
  let projectChanged = projectChangedByDelta;
  const closedCaseRef = activeCaseRef.replace('/active/', '/closed/');
  if (nextCase.case_resolution.status === 'resolved') {
    projectedProject.advancement.active_case_refs = projectedProject.advancement.active_case_refs.filter((ref) => ref !== activeCaseRef);
    projectedProject.advancement.project_gaps = projectedProject.advancement.project_gaps.map((gap) => gap.candidate_case_ref === activeCaseRef ? { ...gap, candidate_case_ref: '' } : gap);
    if (!projectChangedByDelta) { projectedProject.project.revision += 1; projectedProject.project.updated_at = timestamp; }
    projectChanged = true;
  }
  const projectErrors = validateProjectStateRecord(projectedProject, projectFile);
  if (projectErrors.length) throw new Error(projectErrors.join('\n'));
  renderCaseRecord(text, nextCase, caseFile);
  runLedger(root, ['development-case.mjs', 'index', '--dry-run', 'true']);
  if (dryRun) return { schema_version: 'arckit-case-transition-result/v2', applied: false, dry_run: true, case_id: nextCase.id, case_resolution: nextCase.case_resolution, project_state_delta: transition.project_state_delta, changed_files: [] };
  const closedFile = path.join(root, closedCaseRef);
  const iterationRef = projectedProject.advancement.active_iteration_ref;
  const transactionFiles = unique([caseFile, closedFile, projectFile, path.join(root, 'arckit/project/STATE.md'), path.join(root, 'arckit/cases/INDEX.md'), iterationRef ? path.join(root, iterationRef) : '', iterationRef ? path.join(root, iterationRef.replace(/\.record\.json$/, '.md')) : '', path.join(root, 'arckit/project/ITERATIONS.md')]);
  const snapshots = transactionFiles.map((file) => ({ file, existed: fs.existsSync(file), content: fs.existsSync(file) ? fs.readFileSync(file) : null }));
  let writtenCaseRef = activeCaseRef;
  const changedFiles = [];
  try {
    writeCaseRecord(caseFile, text, nextCase); changedFiles.push(activeCaseRef);
    if (nextCase.status === 'closed') { fs.mkdirSync(path.dirname(closedFile), { recursive: true }); fs.renameSync(caseFile, closedFile); writtenCaseRef = closedCaseRef; changedFiles.splice(0, 1, closedCaseRef); }
    if (projectChanged) { fs.writeFileSync(projectFile, `${JSON.stringify(projectedProject, null, 2)}\n`); runLedger(root, ['project-state.mjs', 'render', 'arckit/project/state.record.json']); changedFiles.push('arckit/project/state.record.json', 'arckit/project/STATE.md'); }
    if (iterationRef && fs.existsSync(path.join(root, iterationRef))) {
      const iteration = JSON.parse(fs.readFileSync(path.join(root, iterationRef), 'utf8'));
      aggregateIteration(iteration, { timestamp, caseRef: writtenCaseRef, activeCaseRef, project: projectedProject, delta: transition.project_state_delta, resolved: nextCase.status === 'closed' });
      const iterationErrors = validateIterationStateRecord(iteration, path.join(root, iterationRef));
      if (iterationErrors.length) throw new Error(iterationErrors.join('\n'));
      fs.writeFileSync(path.join(root, iterationRef), `${JSON.stringify(iteration, null, 2)}\n`); runLedger(root, ['project-iteration.mjs', 'render', iterationRef]); runLedger(root, ['project-iteration.mjs', 'index']); changedFiles.push(iterationRef, iterationRef.replace(/\.record\.json$/, '.md'), 'arckit/project/ITERATIONS.md');
    }
    runLedger(root, ['development-case.mjs', 'index']); changedFiles.push('arckit/cases/INDEX.md');
  } catch (error) {
    for (const snapshot of snapshots) { if (snapshot.existed) { fs.mkdirSync(path.dirname(snapshot.file), { recursive: true }); fs.writeFileSync(snapshot.file, snapshot.content); } else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file); }
    throw error;
  }
  return { schema_version: 'arckit-case-transition-result/v2', applied: true, dry_run: false, case_path: writtenCaseRef, case_id: nextCase.id, round_outcome: transition.round_outcome, case_resolution: nextCase.case_resolution, project_state_delta: transition.project_state_delta, changed_files: unique(changedFiles) };
}

function aggregateIteration(record, { timestamp, caseRef, activeCaseRef, project, delta, resolved }) {
  record.updated_at = timestamp;
  record.active_case_refs = unique(project.advancement.active_case_refs).filter((ref) => ref !== activeCaseRef);
  if (resolved) record.closed_case_refs = unique([...record.closed_case_refs, caseRef]);
  const changes = [
    ...delta.software_definition_changes.map((item) => ({ kind: 'software_decision', ref: item.area_ref, outcome: item.set_decision.status, evidence: unique([...item.evidence, caseRef]), case_ref: caseRef })),
    ...delta.software_invariant_changes.map((item) => ({ kind: 'software_invariant', ref: item.invariant.id, outcome: item.action, evidence: unique([...item.evidence, caseRef]), case_ref: caseRef })),
    ...delta.project_gap_changes.map((item) => ({ kind: 'project_gap', ref: item.gap?.id || item.gap_id, outcome: item.action, evidence: unique([...item.evidence, caseRef]), case_ref: caseRef })),
  ];
  record.accepted_project_changes.push(...changes);
  record.acceptance.remaining_project_gaps = project.advancement.project_gaps.map((gap) => gap.id);
  record.last_case_aggregation = { case_ref: caseRef, project_changes: changes.map(({ kind, ref, outcome }) => ({ kind, ref, outcome })), evidence: unique([caseRef, ...delta.evidence]), updated_at: timestamp };
}

function runLedger(root, args) {
  const [script, ...rest] = args;
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...rest], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${script} ${rest[0] || ''} failed\n${result.stderr || result.stdout}`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) args._.push(argv[index]);
    else { const key = argv[index].slice(2); const value = argv[index + 1]; if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`); args[key] = value; index += 1; }
  }
  return args;
}

function readTransition(input) { return JSON.parse(input === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(input), 'utf8')); }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._[0] === 'validate') {
    if (!args._[1]) throw new Error('validate requires <transition.json|->');
    const errors = validateCaseTransition(readTransition(args._[1]), args._[1]);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${args._[1]}: ok`);
  } else if (args._[0] === 'apply') {
    if (!args.case || !args.transition) throw new Error('apply requires --case and --transition');
    console.log(JSON.stringify(await applyCaseTransition({ projectRoot: process.cwd(), casePath: args.case, transition: readTransition(args.transition), dryRun: args['dry-run'] === 'true' }), null, 2));
  } else console.log('Usage: case-transition.mjs validate <transition.json|-> | apply --case <case.md> --transition <transition.json|-> [--dry-run true]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
