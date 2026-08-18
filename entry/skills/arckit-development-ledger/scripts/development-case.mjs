#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CASES_ROOT = path.join(process.cwd(), 'arckit', 'cases');
const ACTIVE_DIR = path.join(CASES_ROOT, 'active');
const CLOSED_DIR = path.join(CASES_ROOT, 'closed');
const INDEX_PATH = path.join(CASES_ROOT, 'INDEX.md');

const CASE_STATUS = new Set(['active', 'blocked', 'handoff', 'closed']);
const ARTIFACT_TYPES = new Set(['code', 'skill', 'document', 'workflow', 'mixed', 'unknown']);
const REVIEW_STATUSES = new Set(['pending', 'findings_open', 'clean', 'needs_human']);
const REVIEW_DIMENSION_STATES = new Set(['unknown', 'clean', 'findings']);
const INVARIANT_DISPOSITIONS = new Set(['not_relevant', 'upheld', 'threatened', 'undetermined']);
export const REVIEW_DIMENSIONS = ['implementation_correctness', 'problem_resolution', 'verification_credibility', 'regression_risk', 'minimality'];
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

function listActiveCaseFiles() {
  ensureDirs();
  return fs.readdirSync(ACTIVE_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(ACTIVE_DIR, name))
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

export function createDefaultCaseRecord({ id = '', title, artifactType = 'unknown', intent = '', expectedOutcome = '', initialFacts = [], initialImpacts = [], initialGaps = [], maxReviewCycles, reviewPolicySource }) {
  const timestamp = nowIso();
  if (!Array.isArray(initialGaps) || initialGaps.length === 0) throw new Error('new v5 Case requires at least one semantic initial gap');
  const record = {
    schema_version: 'development-case-record/v5',
    id: id || nextCaseId(),
    title,
    status: 'active',
    artifact_type: artifactType,
    created_at: timestamp,
    updated_at: timestamp,
    user_intent: intent,
    expected_outcome: expectedOutcome,
    project_state_ref: 'arckit/project/state.record.json',
    current_round: { goal: '', selected_gap: null },
    facts: structuredClone(initialFacts),
    state_impacts: structuredClone(initialImpacts),
    gaps: structuredClone(initialGaps),
    content_revision: 0,
    completion_review: defaultCompletionReview({ maxCycles: maxReviewCycles, source: reviewPolicySource, timestamp }),
    open_questions: [],
    decisions: [],
    pending_handoffs: [],
    process_notes: [],
    rounds: [],
    case_resolution: null,
  };
  record.case_resolution = auditCaseRecord(record, timestamp);
  record.current_round = emptyCurrentRound();
  const errors = validateCaseRecord(record);
  if (errors.length) throw new Error(errors.join('\n'));
  return record;
}

function effectiveReviewCycleLimit(review) {
  return review.policy.initial_max_cycles + review.additional_cycles_authorized;
}

function emptyCurrentRound() {
  return {
    goal: '',
    selected_gap: null,
  };
}

function candidateGap(gap) {
  return {
    id: gap.id,
    responsibility: gap.responsibility,
    goal: gap.goal,
    reason: gap.reason,
    derived_from: [...gap.derived_from],
    blocked_by: [...gap.blocked_by],
    priority_basis: { blocking: '', uncertainty: '', risk: '', user_impact: '', ...structuredClone(gap.priority_basis) },
    evidence_required: [...gap.evidence_required],
  };
}

function reviewCandidate(record, responsibility = 'agent') {
  const review = record.completion_review;
  const human = responsibility === 'human';
  return {
    id: `${record.id}:completion-review:${human ? 'human-decision' : review.cycle_count + 1}`,
    responsibility,
    goal: human
      ? 'Decide how to handle the exhausted completion review budget.'
      : 'Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.',
    reason: human ? 'The autonomous completion review budget is exhausted.' : 'All ordinary Case gaps and state impacts are closed.',
    derived_from: ['case_result', `content_revision:${record.content_revision}`],
    blocked_by: [],
    priority_basis: { blocking: 'high', uncertainty: 'low', risk: 'high', user_impact: 'high' },
    evidence_required: human ? ['explicit human disposition'] : ['review evidence for all five completion dimensions'],
  };
}

function loopHandoff(record, status, stage, candidateGaps) {
  const human = candidateGaps.find((gap) => gap.responsibility === 'human');
  const agent = candidateGaps.find((gap) => gap.responsibility === 'agent');
  const external = candidateGaps.find((gap) => gap.responsibility === 'external');
  const next = status === 'resolved' ? 'none' : human ? 'human' : agent ? 'agent' : external ? 'external' : 'agent';
  return {
    version: 'loop-handoff/v2',
    status: status === 'resolved' ? 'done' : next === 'human' ? 'needs_human' : next === 'external' ? 'external_wait' : stage === 'blocked' ? 'blocked' : 'continue',
    next_responsibility: next,
    agent_continuation_available: next === 'agent',
    human_decision_required: next === 'human',
    trigger_mode: next === 'none' ? 'none' : next === 'human' ? 'user_decision' : next === 'external' ? 'external_wait' : 'automatic',
    responsibility_reason: status === 'resolved' ? 'The current Case revision passed completion review.' : (human || agent || external)?.reason || 'No ready gap is currently available.',
    next_prompt: next === 'agent' ? `Continue ${record.id}: compare the ready dynamic gaps and advance one evidence-backed transition.` : '',
    human_gate: { required: next === 'human', reason: human?.reason || '', decision_needed: human?.goal || '' },
  };
}

function auditCaseRecordV5(record, timestamp = nowIso()) {
  const gaps = Array.isArray(record.gaps) ? record.gaps : [];
  const open = gaps.filter((gap) => gap.status === 'open');
  const closedIds = new Set(gaps.filter((gap) => ['resolved', 'cancelled'].includes(gap.status)).map((gap) => gap.id));
  const ready = open.filter((gap) => gap.blocked_by.every((id) => closedIds.has(id))).map(candidateGap);
  const openQuestions = (record.open_questions || []).filter((item) => item.status === 'open');
  const pendingHandoffs = (record.pending_handoffs || []).filter((item) => item.status === 'pending');
  ready.push(...openQuestions.map((item) => ({
    id: `${record.id}:open-question:${item.id}`, responsibility: item.owner, goal: item.question,
    reason: 'An explicit Case question remains open.', derived_from: [`question:${item.id}`], blocked_by: [],
    priority_basis: { blocking: 'high', uncertainty: 'high', risk: 'medium', user_impact: 'medium' }, evidence_required: ['answer or transfer evidence'],
  })));
  ready.push(...pendingHandoffs.map((item) => ({
    id: `${record.id}:handoff:${item.id}`, responsibility: item.owner, goal: item.resume_condition || `Complete handoff ${item.id}.`,
    reason: `Pending handoff to ${item.target}.`, derived_from: [`handoff:${item.id}`], blocked_by: [],
    priority_basis: { blocking: 'high', uncertainty: 'medium', risk: 'medium', user_impact: 'medium' }, evidence_required: ['handoff completion evidence'],
  })));
  const humanReady = ready.filter((gap) => gap.responsibility === 'human');
  const agentReady = ready.filter((gap) => gap.responsibility === 'agent');
  const externalReady = ready.filter((gap) => gap.responsibility === 'external');
  let candidateGaps = humanReady.length ? humanReady : agentReady.length ? agentReady : externalReady;
  const unsettledImpacts = (record.state_impacts || []).filter((impact) => ['threatened', 'undetermined'].includes(impact.effect));
  const latestRound = (record.rounds || []).at(-1);
  const latestAssessmentClosed = latestRound?.transition_schema_version !== 'arckit-case-transition/v8'
    || (Array.isArray(latestRound.invariant_assessment?.judgments)
      && latestRound.invariant_assessment.judgments.length > 0
      && latestRound.invariant_assessment.judgments.every((judgment) => ['not_relevant', 'upheld'].includes(judgment.disposition)));
  const ordinaryClosed = open.length === 0 && openQuestions.length === 0 && pendingHandoffs.length === 0 && unsettledImpacts.length === 0 && latestAssessmentClosed;
  const review = record.completion_review;
  const reviewCurrent = review?.status === 'clean'
    && review.reviewed_content_revision === record.content_revision
      && REVIEW_DIMENSIONS.every((key) => review.dimensions?.[key] === 'clean');
  let stage = ordinaryClosed ? 'review_ready' : ready.length ? 'working' : open.length ? 'blocked' : 'working';
  if (ordinaryClosed && reviewCurrent) stage = 'resolved';
  else if (ordinaryClosed) {
    const limit = effectiveReviewCycleLimit(review);
    const responsibility = review.status === 'needs_human' || review.cycle_count >= limit ? 'human' : 'agent';
    candidateGaps = [reviewCandidate(record, responsibility)];
    if (responsibility === 'human') stage = 'needs_human';
  }
  const status = stage === 'resolved' ? 'resolved' : 'unresolved';
  const remaining = ordinaryClosed ? (reviewCurrent ? [] : ['completion_review']) : [
    ...open.map((gap) => gap.id),
    ...openQuestions.map((item) => `question:${item.id}`),
    ...pendingHandoffs.map((item) => `handoff:${item.id}`),
    ...unsettledImpacts.map((impact) => `impact:${impact.id}`),
  ];
  return {
    status,
    stage,
    satisfied: gaps.filter((gap) => gap.status !== 'open').map((gap) => gap.id),
    remaining: [...new Set(remaining)],
    blocked: stage === 'blocked' ? open.map((gap) => gap.id) : [],
    reason: status === 'resolved' ? 'All dynamic gaps and state impacts are closed and the current implementation passed completion review.' : `${remaining.length} Case obligation(s) remain.`,
    candidate_gaps: candidateGaps,
    loop_handoff: loopHandoff(record, status, stage, candidateGaps),
    updated_at: timestamp,
  };
}

export function auditCaseRecord(record, timestamp = nowIso()) {
  if (record?.schema_version !== 'development-case-record/v5') {
    throw new Error(`Unsupported Case State schema: ${record?.schema_version || '<missing>'}; expected development-case-record/v5`);
  }
  return auditCaseRecordV5(record, timestamp);
}

function validateResolution(value, label, errors, file) {
  if (value === null) return;
  if (!value || typeof value !== 'object' || !['resolved', 'cancelled'].includes(value.status) || !value.outcome || !value.reason || !Array.isArray(value.evidence) || value.evidence.length === 0 || !value.occurred_at) errors.push(`${file}: ${label} is invalid`);
}

function validateCaseRecordV5(record, file = '<record>') {
  const errors = [];
  if (!/^CASE-\d{8}-\d{3}$/.test(record.id || '')) errors.push(`${file}: invalid case id`);
  if (!CASE_STATUS.has(record.status)) errors.push(`${file}: invalid status`);
  if (!ARTIFACT_TYPES.has(record.artifact_type)) errors.push(`${file}: invalid artifact_type`);
  for (const key of ['title', 'created_at', 'updated_at', 'project_state_ref']) if (typeof record[key] !== 'string' || !record[key]) errors.push(`${file}: ${key} must be a non-empty string`);
  for (const key of ['facts', 'state_impacts', 'gaps', 'open_questions', 'decisions', 'pending_handoffs', 'process_notes', 'rounds']) if (!Array.isArray(record[key])) errors.push(`${file}: ${key} must be an array`);
  const facts = new Map();
  const factRevisions = new Set();
  for (const [index, fact] of (record.facts || []).entries()) {
    if (!fact?.id || !Number.isInteger(fact.revision) || fact.revision < 1 || !['accepted', 'superseded'].includes(fact.status) || !fact.statement || !fact.basis || !Array.isArray(fact.evidence) || fact.evidence.length === 0) errors.push(`${file}: facts[${index}] is invalid`);
    const revisionKey = `${fact?.id}@${fact?.revision}`;
    if (factRevisions.has(revisionKey)) errors.push(`${file}: duplicate fact revision ${revisionKey}`);
    factRevisions.add(revisionKey);
    if (fact?.status === 'accepted') {
      if (facts.has(fact.id)) errors.push(`${file}: multiple accepted revisions for fact ${fact.id}`);
      facts.set(fact.id, fact);
    }
  }
  const gaps = new Map();
  for (const [index, gap] of (record.gaps || []).entries()) {
    if (!gap?.id || !['open', 'resolved', 'cancelled'].includes(gap.status) || !gap.goal || !gap.reason || !Array.isArray(gap.derived_from) || gap.derived_from.length === 0 || !Array.isArray(gap.blocked_by) || !gap.priority_basis || typeof gap.priority_basis !== 'object' || Object.keys(gap.priority_basis).length === 0 || !RESPONSIBILITIES.has(gap.responsibility) || !Array.isArray(gap.evidence_required)) errors.push(`${file}: gaps[${index}] is invalid`);
    if (gaps.has(gap?.id)) errors.push(`${file}: duplicate gap id ${gap.id}`);
    if (gap?.status === 'open' && gap.resolution !== null) errors.push(`${file}: gaps[${index}] open gap requires null resolution`);
    if (gap && gap.status !== 'open') validateResolution(gap.resolution, `gaps[${index}].resolution`, errors, file);
    gaps.set(gap?.id, gap);
  }
  for (const [index, gap] of (record.gaps || []).entries()) for (const dependency of gap.blocked_by || []) if (!gaps.has(dependency) || dependency === gap.id) errors.push(`${file}: gaps[${index}] has invalid blocked_by ${dependency}`);
  for (const [index, impact] of (record.state_impacts || []).entries()) {
    const fact = facts.get(impact?.fact_id);
    const target = impact?.target;
    const targetValid = target && ['software_decision', 'software_invariant'].includes(target.kind) && typeof target.ref === 'string' && target.ref && (target.kind === 'software_decision' ? Number.isInteger(target.revision) && target.revision >= 0 : target.revision === null);
    if (!impact?.id || !fact || fact.status !== 'accepted' || impact.fact_revision !== fact.revision || !targetValid || !['upheld', 'threatened', 'undetermined'].includes(impact.effect) || !impact.reason || !Array.isArray(impact.gap_ids) || !Array.isArray(impact.evidence)) errors.push(`${file}: state_impacts[${index}] is invalid`);
    if (impact?.effect === 'upheld' && impact.evidence.length === 0) errors.push(`${file}: state_impacts[${index}] upheld requires evidence`);
    if (['threatened', 'undetermined'].includes(impact?.effect)) {
      if (impact.gap_ids.length === 0 || impact.gap_ids.some((id) => !gaps.has(id)) || impact.gap_ids.every((id) => gaps.get(id)?.status !== 'open')) errors.push(`${file}: state_impacts[${index}] must bind at least one open gap`);
    }
  }
  if (!Number.isInteger(record.content_revision) || record.content_revision < 0) errors.push(`${file}: content_revision must be a non-negative integer`);
  const review = record.completion_review;
  if (!review || !REVIEW_STATUSES.has(review.status) || !Number.isInteger(review.policy?.initial_max_cycles) || review.policy.initial_max_cycles < 1 || !Number.isInteger(review.additional_cycles_authorized) || review.additional_cycles_authorized < 0 || !Number.isInteger(review.cycle_count) || review.cycle_count < 0 || !Array.isArray(review.cycles) || !Array.isArray(review.findings) || !Array.isArray(review.human_authorizations) || !REVIEW_DIMENSIONS.every((key) => REVIEW_DIMENSION_STATES.has(review.dimensions?.[key]))) errors.push(`${file}: completion_review is invalid`);
  if (review && Array.isArray(review.human_authorizations)) {
    let authorizedCycles = 0;
    for (const [index, authorization] of review.human_authorizations.entries()) {
      const valid = authorization?.authorized_by === 'human'
        && Number.isInteger(authorization.additional_cycles) && authorization.additional_cycles > 0
        && typeof authorization.reason === 'string' && authorization.reason.trim()
        && Array.isArray(authorization.evidence) && authorization.evidence.length > 0
        && authorization.evidence.every((item) => typeof item === 'string' && item.trim())
        && Number.isInteger(authorization.effective_max_cycles) && authorization.effective_max_cycles > 0
        && typeof authorization.occurred_at === 'string' && authorization.occurred_at;
      if (!valid) errors.push(`${file}: completion_review.human_authorizations[${index}] is invalid`);
      else authorizedCycles += authorization.additional_cycles;
    }
    if (Number.isInteger(review.additional_cycles_authorized) && authorizedCycles !== review.additional_cycles_authorized) errors.push(`${file}: completion_review.additional_cycles_authorized does not match human authorizations`);
  }
  if (!record.current_round || !Object.hasOwn(record.current_round, 'selected_gap')) errors.push(`${file}: current_round is invalid`);
  for (const [index, round] of (record.rounds || []).entries()) {
    if (round?.transition_schema_version !== 'arckit-case-transition/v8') continue;
    const assessment = round.invariant_assessment;
    if (!assessment || !Number.isInteger(assessment.project_revision) || !Array.isArray(assessment.judgments) || assessment.judgments.length === 0) {
      errors.push(`${file}: rounds[${index}].invariant_assessment is invalid`);
      continue;
    }
    const refs = new Set();
    for (const judgment of assessment.judgments) {
      const structurallyValid = judgment?.invariant_ref && !refs.has(judgment.invariant_ref)
        && INVARIANT_DISPOSITIONS.has(judgment.disposition) && judgment.reason
        && Array.isArray(judgment.fact_refs) && Array.isArray(judgment.evidence) && Array.isArray(judgment.gap_refs);
      const dispositionValid = structurallyValid && (
        (judgment.disposition === 'not_relevant' && judgment.evidence.length === 0 && judgment.gap_refs.length === 0)
        || (judgment.disposition === 'upheld' && judgment.evidence.length > 0 && judgment.gap_refs.length === 0)
        || (['threatened', 'undetermined'].includes(judgment.disposition) && judgment.fact_refs.length > 0 && judgment.gap_refs.length > 0)
      );
      const factRefsValid = structurallyValid && judgment.fact_refs.every((id) => (record.facts || []).some((fact) => fact.id === id));
      const gapRefsValid = structurallyValid && judgment.gap_refs.every((id) => (record.gaps || []).some((gap) => gap.id === id));
      if (!dispositionValid || !factRefsValid || !gapRefsValid) errors.push(`${file}: rounds[${index}].invariant_assessment has an invalid judgment`);
      refs.add(judgment?.invariant_ref);
    }
  }
  if (!record.case_resolution || !['unresolved', 'resolved'].includes(record.case_resolution.status)) errors.push(`${file}: case_resolution is invalid`);
  const derived = errors.length ? null : auditCaseRecordV5(record, record.case_resolution.updated_at);
  if (derived && JSON.stringify({ ...derived, updated_at: '' }) !== JSON.stringify({ ...record.case_resolution, updated_at: '' })) errors.push(`${file}: case_resolution is not the deterministic projection of Case State; run audit --write`);
  if (record.status === 'closed' && record.case_resolution?.status !== 'resolved') errors.push(`${file}: closed case must be resolved`);
  return errors;
}

export function validateCaseRecord(record, file = '<record>') {
  if (record?.schema_version !== 'development-case-record/v5') {
    return [`${file}: schema_version must be development-case-record/v5`];
  }
  return validateCaseRecordV5(record, file);
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
  const parseArray = (key) => {
    try {
      const value = JSON.parse(args[key] || '[]');
      if (!Array.isArray(value)) throw new Error('must be an array');
      return value;
    } catch (error) {
      throw new Error(`--${key} must be a JSON array: ${error.message}`);
    }
  };
  const record = createDefaultCaseRecord({
    title: args.title,
    artifactType,
    intent: args.intent || '',
    expectedOutcome: args['expected-outcome'] || '',
    initialFacts: parseArray('initial-facts'),
    initialImpacts: parseArray('initial-impacts'),
    initialGaps: parseArray('initial-gaps'),
    maxReviewCycles,
    reviewPolicySource: args['review-policy-source'],
  });
  ensureDirs();
  const file = path.join(ACTIVE_DIR, `${record.id}-${slugify(record.title)}.md`);
  fs.writeFileSync(file, renderCase(record));
  console.log(file);
}

function commandValidate(args) {
  const files = args._[1] ? [path.resolve(args._[1])] : listActiveCaseFiles();
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
    '  development-case.mjs new --title "Title" --max-review-cycles <n> --review-policy-source <source> --initial-facts <json> --initial-impacts <json> --initial-gaps <json> [--artifact-type code] [--intent "..."]',
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
