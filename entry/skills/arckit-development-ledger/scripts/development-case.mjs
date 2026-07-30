#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CASES_ROOT = path.join(process.cwd(), 'arckit', 'cases');
const ACTIVE_DIR = path.join(CASES_ROOT, 'active');
const CLOSED_DIR = path.join(CASES_ROOT, 'closed');
const INDEX_PATH = path.join(CASES_ROOT, 'INDEX.md');

export const FACET_KEYS = [
  'product_expectation',
  'interaction_expectation',
  'visual_expectation',
  'technical_expectation',
  'implementation_state',
  'verification_state',
];

const MATURITY_ORDER = ['unknown', 'exploratory', 'confirmed', 'formalized'];
const APPLICABILITY = new Set(['unknown', 'required', 'not_required']);
const ALIGNMENT = new Set(['unknown', 'unreconciled', 'stale', 'diverged', 'aligned']);
const RESOLUTION = new Set(['unresolved', 'resolved', 'blocked']);
const CASE_STATUS = new Set(['active', 'blocked', 'handoff', 'closed']);
const ARTIFACT_TYPES = new Set(['code', 'skill', 'document', 'workflow', 'mixed', 'unknown']);
const REVIEW_STATUSES = new Set(['pending', 'findings_open', 'clean', 'needs_human']);
const REVIEW_DIMENSIONS = ['correctness', 'completeness', 'minimality'];
const REVIEW_DIMENSION_STATES = new Set(['unknown', 'clean', 'findings']);
const REVIEW_FINDING_KINDS = new Set(['error', 'omission', 'excess']);
const REVIEW_FINDING_STATUSES = new Set(['open', 'resolved', 'dismissed']);
const REVIEW_OUTCOMES_FOR_RECORD = new Set(['clean', 'findings', 'needs_human']);
const RESPONSIBILITIES = new Set(['agent', 'human', 'external']);
const STRUCTURED_RECORD_PATTERN = /(## Structured Record[\s\S]*?```json\s*\n)([\s\S]*?)(\n```)/;

function nowIso() {
  return new Date().toISOString();
}

function ensureDirs() {
  fs.mkdirSync(ACTIVE_DIR, { recursive: true });
  fs.mkdirSync(CLOSED_DIR, { recursive: true });
}

function listCaseFiles() {
  ensureDirs();
  return [ACTIVE_DIR, CLOSED_DIR].flatMap((dir) => fs.readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(dir, name)))
    .sort();
}

function nextCaseId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const used = listCaseFiles()
    .map((file) => path.basename(file).match(new RegExp(`^CASE-${date}-(\\d{3})`)))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return `CASE-${date}-${String(used.length ? Math.max(...used) + 1 : 1).padStart(3, '0')}`;
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'development-case';
}

export function defaultFacet() {
  return {
    applicability: 'unknown',
    maturity: 'unknown',
    target_maturity: 'unknown',
    alignment: 'unknown',
    target_alignment: 'unknown',
    resolution: 'unresolved',
    reason: '',
    evidence: [],
    next_transition: '',
  };
}

function defaultProjectImpactCandidate() {
  return { status: 'none', changes: [], evidence: [] };
}

export function defaultCompletionReview({ maxCycles, source, timestamp }) {
  if (!Number.isInteger(maxCycles) || maxCycles < 1) throw new Error('maxReviewCycles must be a positive integer');
  if (typeof source !== 'string' || !source.trim()) throw new Error('reviewPolicySource must be a non-empty string');
  return {
    status: 'pending',
    policy: {
      initial_max_cycles: maxCycles,
      source,
      snapshotted_at: timestamp,
    },
    additional_cycles_authorized: 0,
    cycle_count: 0,
    reviewed_content_revision: null,
    dimensions: Object.fromEntries(REVIEW_DIMENSIONS.map((key) => [key, 'unknown'])),
    findings: [],
    cycles: [],
    evidence: [],
    escalation: null,
    human_authorizations: [],
  };
}

export function createDefaultCaseRecord({ title, artifactType = 'unknown', intent = '', maxReviewCycles, reviewPolicySource }) {
  const timestamp = nowIso();
  const record = {
    schema_version: 'development-case-record/v3',
    id: nextCaseId(),
    title,
    status: 'active',
    artifact_type: artifactType,
    created_at: timestamp,
    updated_at: timestamp,
    user_intent: intent,
    expected_outcome: '',
    project_state_ref: 'arckit/project/state.record.json',
    current_round: { goal: '', selected_gap: null },
    facets: Object.fromEntries(FACET_KEYS.map((key) => [key, defaultFacet()])),
    content_revision: 0,
    completion_review: defaultCompletionReview({ maxCycles: maxReviewCycles, source: reviewPolicySource, timestamp }),
    open_questions: [],
    decisions: [],
    pending_handoffs: [],
    process_notes: [],
    rounds: [],
    case_resolution: null,
    project_impact_candidate: defaultProjectImpactCandidate(),
  };
  record.case_resolution = auditCaseRecord(record, timestamp);
  record.current_round = emptyCurrentRound();
  return record;
}

function facetStateText(facet) {
  return `applicability=${facet.applicability}; maturity=${facet.maturity}; alignment=${facet.alignment}; resolution=${facet.resolution}`;
}

function facetTargetText(facet) {
  if (facet.applicability === 'unknown') return 'applicability=required|not_required with evidence';
  if (facet.applicability === 'not_required') return 'not_required judgment with reason and evidence';
  return `maturity=${facet.target_maturity}; alignment=${facet.target_alignment}; resolution=resolved`;
}

function facetSatisfied(facet) {
  if (facet.resolution === 'blocked') return false;
  if (facet.applicability === 'not_required') {
    return facet.resolution === 'resolved' && facet.reason.trim().length > 0 && facet.evidence.length > 0;
  }
  if (facet.applicability !== 'required') return false;
  if (facet.target_maturity === 'unknown' || facet.target_alignment !== 'aligned') return false;
  return facet.resolution === 'resolved'
    && MATURITY_ORDER.indexOf(facet.maturity) >= MATURITY_ORDER.indexOf(facet.target_maturity)
    && facet.alignment === facet.target_alignment
    && facet.evidence.length > 0;
}

function nextTransitionForFacet(key, facet) {
  if (facet.next_transition) return facet.next_transition;
  if (facet.applicability === 'unknown') {
    return `Decide whether ${key} is required for this case and record the evidence-backed judgment.`;
  }
  if (facet.applicability === 'not_required') {
    return `Record why ${key} is not required and bind that judgment to evidence.`;
  }
  if (facet.target_maturity === 'unknown' || facet.target_alignment === 'unknown') {
    return `Define the target maturity and alignment for ${key}.`;
  }
  return `Advance ${key} to maturity=${facet.target_maturity}, alignment=${facet.target_alignment}, then reconcile it with implementation evidence.`;
}

function gapForFacet(caseId, key, facet) {
  return {
    id: `${caseId}:${key}`,
    facet: key,
    responsibility: 'agent',
    current_state: facetStateText(facet),
    target_state: facetTargetText(facet),
    next_transition: nextTransitionForFacet(key, facet),
    evidence_required: ['fact source or explicit scope judgment', 'implementation/verification evidence when applicable'],
  };
}

function effectiveReviewCycleLimit(review) {
  return review.policy.initial_max_cycles + review.additional_cycles_authorized;
}

function openReviewFindings(record) {
  return record.completion_review.findings.filter((finding) => finding.status === 'open');
}

function completionReviewGap(record) {
  const review = record.completion_review;
  return {
    id: `${record.id}:completion-review:${review.cycle_count + 1}`,
    facet: 'completion_review',
    responsibility: 'agent',
    current_state: `pending; content_revision=${record.content_revision}; completed_cycles=${review.cycle_count}`,
    target_state: `clean for content_revision=${record.content_revision}`,
    next_transition: 'Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.',
    evidence_required: ['review evidence covering correctness, completeness, and minimality', `content_revision=${record.content_revision}`],
  };
}

function findingGap(record, finding) {
  return {
    id: `${record.id}:review-finding:${finding.id}`,
    facet: 'review_findings',
    responsibility: finding.responsibility,
    current_state: `${finding.kind}; open; ${finding.statement}`,
    target_state: 'resolved_or_evidence_backed_dismissed',
    next_transition: `Resolve review finding ${finding.id}: ${finding.statement}`,
    evidence_required: ['repair or disposition evidence', ...finding.artifact_refs],
  };
}

function reviewLimitGap(record) {
  const review = record.completion_review;
  return {
    id: `${record.id}:completion-review:human-decision`,
    facet: 'completion_review',
    responsibility: 'human',
    current_state: `needs_human; completed_cycles=${review.cycle_count}; effective_max_cycles=${effectiveReviewCycleLimit(review)}`,
    target_state: 'human disposition or explicitly authorized additional review cycles',
    next_transition: 'Review unresolved completion findings and decide whether to accept risk, repair manually, split work, stop the Case, or authorize a bounded number of additional review cycles.',
    evidence_required: ['explicit human decision', 'decision reason', 'authorization evidence when extending the review budget'],
  };
}

function emptyCurrentRound() {
  return {
    goal: '',
    selected_gap: null,
  };
}

function defaultLoopHandoff(record, status, candidateGaps, blocked) {
  const actionable = candidateGaps.find((gap) => gap.responsibility === 'agent' && !blocked.includes(gap.facet));
  const humanGap = candidateGaps.find((gap) => gap.responsibility === 'human');
  const externalGap = candidateGaps.find((gap) => gap.responsibility === 'external');
  const nextResponsibility = status === 'resolved'
    ? 'none'
    : actionable
      ? 'agent'
      : humanGap
        ? 'human'
        : externalGap
          ? 'external'
          : 'agent';
  const triggerMode = nextResponsibility === 'none'
    ? 'none'
    : nextResponsibility === 'human'
      ? 'user_decision'
      : nextResponsibility === 'external'
        ? 'external_wait'
        : 'manual_bridge';
  const goal = status === 'resolved'
    ? ''
    : `Select one evidence-backed transition from ${candidateGaps.length} unresolved Case gap(s).`;
  return {
    version: 'loop-handoff/v2',
    status: status === 'resolved' ? 'done' : nextResponsibility === 'human' ? 'needs_human' : nextResponsibility === 'external' ? 'external_wait' : blocked.length ? 'blocked' : 'continue',
    next_responsibility: nextResponsibility,
    agent_continuation_available: nextResponsibility === 'agent',
    human_decision_required: nextResponsibility === 'human',
    trigger_mode: triggerMode,
    responsibility_reason: status === 'resolved'
      ? 'The Case State has no unresolved content gap and the current content revision has a clean completion review.'
      : nextResponsibility === 'external'
        ? `Waiting for external Case gap ${externalGap.id}.`
      : nextResponsibility === 'human'
          ? humanGap.next_transition || `Case is blocked by ${blocked[0] || 'a decision that cannot be made silently'}.`
          : `The Case State exposes ${candidateGaps.length} unresolved candidate gap(s) for Controller selection.`,
    next_prompt: nextResponsibility === 'agent' ? `Continue ${record.id}: inspect candidate_gaps and select one bounded evidence-backed transition.` : '',
    agent_instruction: {
      goal,
      required_context_refs: [record.project_state_ref, `case:${record.id}`],
      required_actions: nextResponsibility === 'agent' ? [goal] : [],
      required_checks: ['case_transition evidence', 'derived case_resolution'],
      stop_condition: 'Stop after applying one evidence-backed Case transition or producing a human/external handoff.',
    },
    human_gate: {
      required: nextResponsibility === 'human',
      reason: nextResponsibility === 'human' ? humanGap.next_transition || blocked[0] || goal : '',
      decision_needed: nextResponsibility === 'human' ? humanGap.next_transition || goal : '',
    },
    progress_guard: {
      expected_state_change: goal,
      actual_state_change: '',
      no_progress_limit: 2,
      max_auto_rounds: 3,
    },
  };
}

export function auditCaseRecord(record, timestamp = nowIso()) {
  const satisfied = [];
  const remaining = [];
  const blocked = [];
  const candidateGaps = [];

  for (const key of FACET_KEYS) {
    const facet = record.facets[key];
    if (facetSatisfied(facet)) {
      satisfied.push(key);
      continue;
    }
    remaining.push(key);
    if (facet.resolution === 'blocked') blocked.push(key);
    candidateGaps.push(gapForFacet(record.id, key, facet));
  }

  const openQuestions = record.open_questions.filter((item) => item.status === 'open');
  if (openQuestions.length) {
    remaining.push('open_questions');
    for (const item of openQuestions) {
      candidateGaps.push({
        id: `${record.id}:open-question:${item.id}`,
        facet: 'open_questions',
        responsibility: item.owner,
        current_state: 'open',
        target_state: item.owner === 'agent' ? 'resolved' : 'transferred_or_resolved',
        next_transition: item.question,
        evidence_required: ['answer, decision, or explicit transfer evidence'],
      });
    }
  }

  const pendingHandoffs = record.pending_handoffs.filter((item) => item.status === 'pending');
  if (pendingHandoffs.length) {
    remaining.push('pending_handoffs');
    for (const item of pendingHandoffs) {
      candidateGaps.push({
        id: `${record.id}:handoff:${item.id}`,
        facet: 'pending_handoffs',
        responsibility: item.owner,
        current_state: 'pending',
        target_state: 'completed_or_cancelled',
        next_transition: item.resume_condition || `Complete handoff ${item.id} with ${item.target}.`,
        evidence_required: ['handoff completion or cancellation evidence'],
      });
    }
  }

  const baseReady = remaining.length === 0;
  let stage = blocked.length ? 'blocked' : 'working';
  if (baseReady) {
    const review = record.completion_review;
    const openFindings = openReviewFindings(record);
    const reviewCurrent = review.status === 'clean'
      && review.reviewed_content_revision === record.content_revision
      && openFindings.length === 0;
    if (reviewCurrent) {
      satisfied.push('completion_review');
      stage = 'resolved';
    } else {
      remaining.push('completion_review');
      if (review.status === 'needs_human' || review.cycle_count >= effectiveReviewCycleLimit(review)) {
        stage = 'needs_human';
        candidateGaps.push(reviewLimitGap(record));
      } else if (openFindings.length) {
        stage = 'repairing';
        candidateGaps.push(...openFindings.map((finding) => findingGap(record, finding)));
      } else {
        stage = 'review_ready';
        candidateGaps.push(completionReviewGap(record));
      }
    }
  }

  const status = stage === 'resolved' ? 'resolved' : stage === 'blocked' ? 'blocked' : 'unresolved';
  return {
    status,
    stage,
    base_ready: baseReady,
    satisfied,
    remaining,
    blocked,
    reason: status === 'resolved'
      ? 'All Case content is complete and the current content revision has a clean completion review.'
      : stage === 'needs_human'
        ? `Completion review did not reach clean within ${effectiveReviewCycleLimit(record.completion_review)} authorized cycle(s); human handling is required.`
      : `Case State still has ${remaining.length} unresolved area(s).`,
    candidate_gaps: candidateGaps,
    loop_handoff: defaultLoopHandoff(record, status, candidateGaps, blocked),
    updated_at: timestamp,
  };
}

export function validateCaseRecord(record, file = '<record>') {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [`${file}: record must be an object`];
  if (record.schema_version !== 'development-case-record/v3') errors.push(`${file}: schema_version must be development-case-record/v3`);
  if (!/^CASE-\d{8}-\d{3}$/.test(record.id || '')) errors.push(`${file}: invalid case id`);
  if (!CASE_STATUS.has(record.status)) errors.push(`${file}: invalid status`);
  if (!ARTIFACT_TYPES.has(record.artifact_type)) errors.push(`${file}: invalid artifact_type`);
  for (const key of ['title', 'created_at', 'updated_at', 'project_state_ref']) {
    if (typeof record[key] !== 'string' || !record[key]) errors.push(`${file}: ${key} must be a non-empty string`);
  }
  if (!record.facets || typeof record.facets !== 'object') {
    errors.push(`${file}: facets must be an object`);
  } else {
    for (const key of FACET_KEYS) {
      const facet = record.facets[key];
      if (!facet || typeof facet !== 'object') {
        errors.push(`${file}: facets.${key} is required`);
        continue;
      }
      if (!APPLICABILITY.has(facet.applicability)) errors.push(`${file}: facets.${key}.applicability is invalid`);
      if (!MATURITY_ORDER.includes(facet.maturity) || !MATURITY_ORDER.includes(facet.target_maturity)) errors.push(`${file}: facets.${key} maturity is invalid`);
      if (!ALIGNMENT.has(facet.alignment) || !ALIGNMENT.has(facet.target_alignment)) errors.push(`${file}: facets.${key} alignment is invalid`);
      if (!RESOLUTION.has(facet.resolution)) errors.push(`${file}: facets.${key}.resolution is invalid`);
      if (!Array.isArray(facet.evidence)) errors.push(`${file}: facets.${key}.evidence must be an array`);
      if (facet.applicability === 'required' && facet.resolution === 'resolved' && !facetSatisfied(facet)) errors.push(`${file}: facets.${key} claims resolved without reaching its evidence-backed target`);
      if (facet.applicability === 'not_required' && facet.resolution === 'resolved' && !facetSatisfied(facet)) errors.push(`${file}: facets.${key} not_required judgment requires reason and evidence`);
    }
  }
  for (const key of ['open_questions', 'decisions', 'pending_handoffs', 'process_notes', 'rounds']) {
    if (!Array.isArray(record[key])) errors.push(`${file}: ${key} must be an array`);
  }
  if (!Number.isInteger(record.content_revision) || record.content_revision < 0) errors.push(`${file}: content_revision must be a non-negative integer`);
  const review = record.completion_review;
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    errors.push(`${file}: completion_review is required`);
  } else {
    if (!REVIEW_STATUSES.has(review.status)) errors.push(`${file}: completion_review.status is invalid`);
    if (!Number.isInteger(review.policy?.initial_max_cycles) || review.policy.initial_max_cycles < 1 || typeof review.policy?.source !== 'string' || !review.policy.source || typeof review.policy?.snapshotted_at !== 'string' || !review.policy.snapshotted_at) errors.push(`${file}: completion_review.policy is invalid`);
    if (!Number.isInteger(review.additional_cycles_authorized) || review.additional_cycles_authorized < 0) errors.push(`${file}: completion_review.additional_cycles_authorized is invalid`);
    const autonomousCycleCount = Array.isArray(review.cycles) ? review.cycles.filter((cycle) => cycle?.reviewer === 'agent').length : -1;
    if (!Number.isInteger(review.cycle_count) || review.cycle_count < 0 || review.cycle_count !== autonomousCycleCount) errors.push(`${file}: completion_review.cycle_count is invalid`);
    if (review.reviewed_content_revision !== null && (!Number.isInteger(review.reviewed_content_revision) || review.reviewed_content_revision < 0)) errors.push(`${file}: completion_review.reviewed_content_revision is invalid`);
    for (const dimension of REVIEW_DIMENSIONS) if (!REVIEW_DIMENSION_STATES.has(review.dimensions?.[dimension])) errors.push(`${file}: completion_review.dimensions.${dimension} is invalid`);
    if (!Array.isArray(review.findings) || !Array.isArray(review.cycles) || !Array.isArray(review.evidence) || !Array.isArray(review.human_authorizations)) errors.push(`${file}: completion_review collections are invalid`);
    const effectiveLimit = Number.isInteger(review.policy?.initial_max_cycles) && Number.isInteger(review.additional_cycles_authorized)
      ? effectiveReviewCycleLimit(review)
      : -1;
    if (effectiveLimit >= 0 && review.cycle_count > effectiveLimit) errors.push(`${file}: completion_review.cycle_count exceeds the authorized limit`);
    const findingIds = new Set();
    for (const [index, finding] of (review.findings || []).entries()) {
      if (!finding?.id || findingIds.has(finding.id) || !REVIEW_FINDING_KINDS.has(finding?.kind) || !finding?.statement || !REVIEW_FINDING_STATUSES.has(finding?.status) || !RESPONSIBILITIES.has(finding?.responsibility) || !Array.isArray(finding?.affected_facets) || !Array.isArray(finding?.artifact_refs) || !Array.isArray(finding?.evidence) || !Array.isArray(finding?.resolution_evidence)) errors.push(`${file}: completion_review.findings[${index}] is invalid`);
      findingIds.add(finding?.id);
    }
    for (const [index, cycle] of (review.cycles || []).entries()) {
      if (cycle?.cycle !== index + 1 || !['agent', 'human'].includes(cycle?.reviewer) || !REVIEW_OUTCOMES_FOR_RECORD.has(cycle?.outcome) || !Number.isInteger(cycle?.content_revision) || !Array.isArray(cycle?.finding_ids) || !Array.isArray(cycle?.evidence) || cycle.evidence.length === 0 || typeof cycle?.occurred_at !== 'string' || !cycle.occurred_at) errors.push(`${file}: completion_review.cycles[${index}] is invalid`);
      for (const dimension of REVIEW_DIMENSIONS) if (!['clean', 'findings'].includes(cycle?.dimensions?.[dimension])) errors.push(`${file}: completion_review.cycles[${index}].dimensions.${dimension} is invalid`);
    }
    const authorizedTotal = (review.human_authorizations || []).reduce((sum, authorization) => sum + (Number.isInteger(authorization?.additional_cycles) ? authorization.additional_cycles : 0), 0);
    if (authorizedTotal !== review.additional_cycles_authorized) errors.push(`${file}: completion_review.additional_cycles_authorized must equal the human authorization history`);
    const openFindingCount = (review.findings || []).filter((finding) => finding.status === 'open').length;
    if (review.status === 'findings_open' && openFindingCount === 0) errors.push(`${file}: findings_open completion_review requires an open finding`);
    if (review.status === 'pending' && openFindingCount > 0) errors.push(`${file}: pending completion_review cannot have open findings`);
    if (effectiveLimit >= 0 && review.cycle_count >= effectiveLimit && !['clean', 'needs_human'].includes(review.status)) errors.push(`${file}: exhausted completion_review budget requires clean or needs_human`);
    if (review.status === 'clean' && (review.reviewed_content_revision !== record.content_revision || openReviewFindings(record).length > 0 || REVIEW_DIMENSIONS.some((key) => review.dimensions[key] !== 'clean'))) errors.push(`${file}: clean completion_review must cover the current content revision with all dimensions clean and no open findings`);
    if (review.status === 'needs_human' && !review.escalation) errors.push(`${file}: needs_human completion_review requires escalation`);
  }
  for (const [index, item] of (record.open_questions || []).entries()) {
    if (!item?.id || !item?.question || !['open', 'resolved', 'transferred'].includes(item.status) || !['agent', 'human', 'external'].includes(item.owner) || !Array.isArray(item.evidence)) errors.push(`${file}: open_questions[${index}] is invalid`);
  }
  for (const [index, item] of (record.pending_handoffs || []).entries()) {
    if (!item?.id || !item?.target || !['agent', 'human', 'external'].includes(item.owner) || !['pending', 'completed', 'cancelled'].includes(item.status) || !Array.isArray(item.evidence)) errors.push(`${file}: pending_handoffs[${index}] is invalid`);
  }
  if (!record.current_round || !Object.hasOwn(record.current_round, 'selected_gap')) errors.push(`${file}: current_round is invalid`);
  if (!record.case_resolution || !RESOLUTION.has(record.case_resolution.status)) errors.push(`${file}: case_resolution is invalid`);
  if (!record.project_impact_candidate || !['none', 'proposed', 'accepted'].includes(record.project_impact_candidate.status)) errors.push(`${file}: project_impact_candidate is invalid`);
  const derived = errors.length ? null : auditCaseRecord(record, record.case_resolution.updated_at);
  if (derived && JSON.stringify({ ...derived, updated_at: '' }) !== JSON.stringify({ ...record.case_resolution, updated_at: '' })) errors.push(`${file}: case_resolution is not the deterministic projection of Case State; run audit --write`);
  if (record.status === 'closed' && record.case_resolution?.status !== 'resolved') errors.push(`${file}: closed case must be resolved`);
  return errors;
}

export function parseCaseRecordText(text, file = '<case>') {
  const match = text.match(STRUCTURED_RECORD_PATTERN);
  if (!match) throw new Error(`${file}: missing Structured Record json block`);
  try {
    return JSON.parse(match[2]);
  } catch (error) {
    throw new Error(`${file}: invalid Structured Record json: ${error.message}`);
  }
}

export function readCaseRecord(file) {
  const text = fs.readFileSync(file, 'utf8');
  return { text, record: parseCaseRecordText(text, file) };
}

export function renderCaseRecord(text, record, file = '<case>') {
  const json = JSON.stringify(record, null, 2);
  const gap = record.current_round?.selected_gap?.id || 'none';
  const next = text
    .replace(/^Status: .*$/m, () => `Status: ${record.status}`)
    .replace(/^Artifact Type: .*$/m, () => `Artifact Type: ${record.artifact_type}`)
    .replace(/^Selected Gap: .*$/m, () => `Selected Gap: ${gap}`)
    .replace(/^Updated: .*$/m, () => `Updated: ${record.updated_at}`)
    .replace(STRUCTURED_RECORD_PATTERN, (_match, prefix, _existingJson, suffix) => `${prefix}${json}${suffix}`);
  const roundTripRecord = parseCaseRecordText(next, file);
  if (JSON.stringify(roundTripRecord) !== JSON.stringify(record)) {
    throw new Error(`${file}: Structured Record render did not preserve the Case record exactly`);
  }
  return next;
}

export function writeCaseRecord(file, text, record) {
  const next = renderCaseRecord(text, record, file);
  fs.writeFileSync(file, next);
}

export function findCasePath(caseId) {
  return listCaseFiles().find((file) => path.basename(file).startsWith(`${caseId}-`)) || '';
}

function renderCase(record) {
  return [
    `# ${record.title}`,
    '',
    `Case: ${record.id}`,
    `Status: ${record.status}`,
    `Artifact Type: ${record.artifact_type}`,
    `Selected Gap: ${record.current_round.selected_gap?.id || 'none'}`,
    `Updated: ${record.updated_at}`,
    '',
    '## User Intent',
    '',
    record.user_intent || 'TBD',
    '',
    '## Structured Record',
    '',
    '```json',
    JSON.stringify(record, null, 2),
    '```',
    '',
    '## Round Notes',
    '',
    '- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.',
    '',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) args._.push(token);
    else {
      const key = token.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function commandNew(args) {
  if (!args.title) throw new Error('new requires --title');
  if (!args['max-review-cycles']) throw new Error('new requires --max-review-cycles from an explicit Case or Runtime policy');
  if (!args['review-policy-source']) throw new Error('new requires --review-policy-source');
  const artifactType = args['artifact-type'] || 'unknown';
  if (!ARTIFACT_TYPES.has(artifactType)) throw new Error(`Invalid artifact type: ${artifactType}`);
  const maxReviewCycles = Number(args['max-review-cycles']);
  const record = createDefaultCaseRecord({ title: args.title, artifactType, intent: args.intent || '', maxReviewCycles, reviewPolicySource: args['review-policy-source'] });
  ensureDirs();
  const file = path.join(ACTIVE_DIR, `${record.id}-${slugify(record.title)}.md`);
  fs.writeFileSync(file, renderCase(record));
  console.log(file);
}

function commandValidate(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listCaseFiles();
  let failed = false;
  for (const file of files) {
    const errors = validateCaseRecord(readCaseRecord(file).record, file);
    if (errors.length) {
      failed = true;
      errors.forEach((error) => console.error(error));
    } else console.log(`${file}: ok`);
  }
  if (failed) process.exitCode = 1;
}

function commandAudit(args) {
  const file = args._[1] ? path.resolve(args._[1]) : '';
  if (!file) throw new Error('audit requires a case-file');
  const { text, record } = readCaseRecord(file);
  const errors = validateCaseRecord({ ...record, case_resolution: auditCaseRecord(record, record.case_resolution?.updated_at || nowIso()) }, file)
    .filter((error) => !error.includes('case_resolution is not'));
  if (errors.length) throw new Error(errors.join('\n'));
  const timestamp = nowIso();
  const audit = auditCaseRecord(record, timestamp);
  console.log(JSON.stringify(audit, null, 2));
  if (args.write === 'true') {
    record.case_resolution = audit;
    record.current_round = emptyCurrentRound();
    record.updated_at = timestamp;
    writeCaseRecord(file, text, record);
  }
}

function commandClose(args) {
  const file = args._[1] ? path.resolve(args._[1]) : '';
  if (!file) throw new Error('close requires a case-file');
  const { text, record } = readCaseRecord(file);
  const audit = auditCaseRecord(record);
  if (audit.status !== 'resolved') throw new Error(`Case is not resolved. Remaining: ${audit.remaining.join(', ')}`);
  record.status = 'closed';
  record.case_resolution = audit;
  record.current_round = emptyCurrentRound();
  record.updated_at = audit.updated_at;
  writeCaseRecord(file, text, record);
  ensureDirs();
  const target = path.join(CLOSED_DIR, path.basename(file));
  if (path.resolve(file) !== path.resolve(target)) fs.renameSync(file, target);
  commandIndex();
  console.log(target);
}

function tableEscape(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function commandIndex(args = {}) {
  ensureDirs();
  const active = [];
  const closed = [];
  for (const file of listCaseFiles()) {
    const { record } = readCaseRecord(file);
    (record.status === 'closed' ? closed : active).push({ file, record });
  }
  const rel = (file) => path.relative(CASES_ROOT, file);
  const content = [
    '# Development Cases',
    '',
    '`arckit/cases` stores Case State. Project State chooses or creates a Case; each Case exposes unordered evidence-backed candidate gaps; Loops apply one Controller-selected bounded Case transition.',
    '',
    '## Active Cases',
    '',
    '| ID | Status | Title | Selected Gap | Updated |',
    '| --- | --- | --- | --- | --- |',
    ...active.map(({ file, record }) => `| [${record.id}](${rel(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.current_round?.selected_gap?.id || 'none')} | ${tableEscape(record.updated_at)} |`),
    '',
    '## Closed Cases',
    '',
    '| ID | Status | Title | Updated |',
    '| --- | --- | --- | --- |',
    ...closed.map(({ file, record }) => `| [${record.id}](${rel(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.updated_at)} |`),
    '',
  ].join('\n');
  if (args['dry-run'] !== 'true') fs.writeFileSync(INDEX_PATH, content);
  console.log(INDEX_PATH);
  return content;
}

function usage() {
  console.log([
    'Usage:',
    '  development-case.mjs new --title "Title" --max-review-cycles <n> --review-policy-source <source> [--artifact-type code] [--intent "..."]',
    '  development-case.mjs validate [case-file]',
    '  development-case.mjs audit <case-file> [--write true]',
    '  development-case.mjs close <case-file>',
    '  development-case.mjs index [--dry-run true]',
  ].join('\n'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (command === 'new') return commandNew(args);
  if (command === 'validate') return commandValidate(args);
  if (command === 'audit') return commandAudit(args);
  if (command === 'close') return commandClose(args);
  if (command === 'index') return commandIndex(args);
  usage();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
