import { auditCaseRecord } from './development-case.mjs';

const COMMAND_VERSION = 'arckit-semantic-case-command/v1';
const DISPOSITIONS = new Set(['not_relevant', 'upheld', 'threatened', 'undetermined']);
const EFFECTS = new Set(['upheld', 'threatened', 'undetermined']);
const RESPONSIBILITIES = new Set(['agent', 'human', 'external']);

export class SemanticCommandError extends Error {
  constructor(issues, kind = 'claim_invalid') {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
    this.name = 'SemanticCommandError';
    this.issues = issues;
    this.kind = kind;
  }
}

export function validateSemanticCaseCommand(command, field = 'case_command') {
  const issues = [];
  issue(command?.schema_version === COMMAND_VERSION, `${field}.schema_version`, `must be ${COMMAND_VERSION}`, issues);
  issue(/^CASE-\d{8}-\d{3}$/.test(command?.case_id || ''), `${field}.case_id`, 'must be a canonical Case id', issues);
  validateSelection(command?.selection, `${field}.selection`, issues);
  issue(object(command?.planned_transition) && nonEmpty(command.planned_transition.goal) && nonEmpty(command.planned_transition.expected_state_change), `${field}.planned_transition`, 'requires goal and expected_state_change', issues);
  issue(command?.fresh_gap === null || object(command?.fresh_gap), `${field}.fresh_gap`, 'must be an object or null', issues);
  if (object(command?.fresh_gap)) validateNewGap(command.fresh_gap, `${field}.fresh_gap`, issues);
  validateClaim(command?.claim, `${field}.claim`, issues);
  validateProjectClaim(command?.project_claim, `${field}.project_claim`, issues);
  validateAssessment(command?.invariant_assessment, `${field}.invariant_assessment`, issues);
  issue(stringArray(command?.evidence) && command.evidence.length > 0, `${field}.evidence`, 'must contain evidence', issues);
  issue(stringArray(command?.unresolved), `${field}.unresolved`, 'must be an array of strings', issues);
  issue(['completed', 'partial', 'blocked', 'needs_human', 'external_wait'].includes(command?.round_outcome), `${field}.round_outcome`, 'is invalid', issues);
  return issues;
}

export function materializeSemanticCaseCommand({ command, snapshot }) {
  const issues = validateSemanticCaseCommand(command);
  if (issues.length) throw new SemanticCommandError(issues, 'claim_invalid');

  const project = snapshot?.canonical?.project_state;
  const active = snapshot?.canonical?.active_cases?.find((item) => item.record.id === command?.case_id);
  const protocolIssues = [];
  issue(snapshot?.state_availability === 'available', 'snapshot', 'canonical ledger state is unavailable', protocolIssues);
  issue(Boolean(project), 'snapshot.project_state', 'is missing', protocolIssues);
  if (protocolIssues.length) throw new SemanticCommandError(protocolIssues, 'protocol_incompatible');
  if (!active) {
    throw new SemanticCommandError([
      { path: 'case_command.case_id', message: 'no longer matches an active Case; reload canonical state' },
    ], 'snapshot_stale');
  }

  const record = active.record;
  const expectedToken = snapshot.selection_tokens?.[record.id];
  if (command.selection.snapshot_token !== expectedToken) {
    throw new SemanticCommandError([
      { path: 'case_command.selection.snapshot_token', message: `is stale; expected ${expectedToken || '<missing>'}` },
    ], 'snapshot_stale');
  }

  const refs = createReferenceResolver({ command, project, record, issues });
  const fresh = command.fresh_gap !== null;
  const selectedGap = fresh
    ? materializeGap(command.fresh_gap, refs, issues)
    : selectedPersistedGap({ command, snapshot, record, issues });
  const expectedSelectedRef = fresh ? command.fresh_gap.ref : `case-gap:${record.id}:${selectedGap?.id || ''}`;
  issue(command.selection.selected_ref === expectedSelectedRef, 'case_command.selection.selected_ref', `must be ${expectedSelectedRef}`, issues);

  const gapSelection = materializeSelection(command.selection, { refs, record, selectedGap, fresh, issues });
  const projectStateDelta = materializeProjectClaim(command.project_claim, { refs, project, record, issues });
  const acceptedStateDelta = materializeClaim(command.claim, { refs, project, record, selectedGap, issues, projectStateDelta });
  const invariantAssessment = materializeAssessment(command.invariant_assessment, { refs, project, issues });

  if (issues.length) throw new SemanticCommandError(issues);
  return {
    transition: {
      schema_version: 'arckit-case-transition/v8',
      case_id: record.id,
      case_updated_at: record.updated_at,
      project_revision: project.project.revision,
      gap_selection: gapSelection,
      selected_gap: selectedGap,
      planned_transition: structuredClone(command.planned_transition),
      accepted_state_delta: acceptedStateDelta,
      project_state_delta: projectStateDelta,
      invariant_assessment: invariantAssessment,
      evidence: [...command.evidence],
      unresolved: [...command.unresolved],
      round_outcome: command.round_outcome,
      case_resolution: { claimed_status: 'unresolved', reason: 'Canonical Case resolution is derived by the trusted ledger after applying the semantic command.' },
    },
    canonical_id_mapping: refs.mapping(),
  };
}

function createReferenceResolver({ command, project, record, issues }) {
  const local = new Map();
  const used = new Set([
    ...record.facts.map((item) => item.id), ...record.gaps.map((item) => item.id),
    ...record.state_impacts.map((item) => item.id), ...project.advancement.project_gaps.map((item) => item.id),
    ...project.software_invariants.map((item) => item.id),
  ]);
  const counters = new Map();
  const caseKey = record.id.replace(/^CASE-/, '');
  const prefixes = { fact: 'FACT', gap: 'GAP', impact: 'IMPACT', 'project-gap': 'GAP-PROJECT', invariant: 'INVARIANT', 'review-finding': 'FINDING' };

  const allocate = (ref, expectedType, path) => {
    const parsed = parseRef(ref);
    issue(parsed?.scope === 'local' && parsed.type === expectedType, path, `must be local:${expectedType}:<handle>`, issues);
    if (!parsed || parsed.scope !== 'local' || parsed.type !== expectedType) return '';
    if (local.has(ref)) {
      issue(local.get(ref).type === expectedType, path, 'reuses a local handle with a different type', issues);
      return local.get(ref).id;
    }
    let counter = (counters.get(expectedType) || 0) + 1;
    let id = `${prefixes[expectedType]}-${caseKey}-${String(counter).padStart(3, '0')}`;
    while (used.has(id)) { counter += 1; id = `${prefixes[expectedType]}-${caseKey}-${String(counter).padStart(3, '0')}`; }
    counters.set(expectedType, counter); used.add(id); local.set(ref, { type: expectedType, id });
    return id;
  };

  for (const item of command.claim.facts_added) allocate(item.ref, 'fact', `case_command.claim.facts_added.${item.ref}`);
  for (const item of command.claim.gaps_added) allocate(item.ref, 'gap', `case_command.claim.gaps_added.${item.ref}`);
  for (const item of command.claim.impacts_added) allocate(item.ref, 'impact', `case_command.claim.impacts_added.${item.ref}`);
  for (const item of command.claim.completion_review_result?.findings || []) allocate(item.ref, 'review-finding', `case_command.claim.completion_review_result.findings.${item.ref}`);
  if (command.fresh_gap) allocate(command.fresh_gap.ref, 'gap', 'case_command.fresh_gap.ref');
  for (const item of command.project_claim.project_gap_changes) if (item.action === 'add') allocate(item.ref, 'project-gap', `case_command.project_claim.project_gap_changes.${item.ref}`);
  for (const item of command.project_claim.invariant_changes) if (item.action === 'add') allocate(item.ref, 'invariant', `case_command.project_claim.invariant_changes.${item.ref}`);

  function resolve(ref, expectedType, path, { allowSystem = false } = {}) {
    const parsed = parseRef(ref);
    if (!parsed) { issue(false, path, 'must be an explicit typed ref', issues); return ''; }
    if (parsed.scope === 'local') {
      const mapped = local.get(ref);
      issue(Boolean(mapped) && mapped?.type === expectedType, path, `references an unknown local ${expectedType}`, issues);
      return mapped?.id || '';
    }
    if (allowSystem && parsed.scope === 'system') return parsed.id;
    const expectedScope = ['fact', 'gap', 'impact'].includes(expectedType) ? 'case' : 'project';
    issue(parsed.scope === expectedScope && parsed.type === expectedType, path, `must reference ${expectedScope}:${expectedType}`, issues);
    if (parsed.scope !== expectedScope || parsed.type !== expectedType) return '';
    const exists = expectedType === 'fact' ? record.facts.some((item) => item.id === parsed.id)
      : expectedType === 'gap' ? record.gaps.some((item) => item.id === parsed.id)
        : expectedType === 'impact' ? record.state_impacts.some((item) => item.id === parsed.id)
          : expectedType === 'decision' ? project.software_definition.decision_areas.some((item) => item.id === parsed.id)
            : expectedType === 'invariant' ? project.software_invariants.some((item) => item.id === parsed.id)
              : expectedType === 'project-gap' ? project.advancement.project_gaps.some((item) => item.id === parsed.id) : false;
    issue(exists, path, `references unknown ${expectedType} ${parsed.id}`, issues);
    return parsed.id;
  }

  return { allocate, resolve, mapping: () => Object.fromEntries([...local.entries()].map(([ref, value]) => [ref, value.id])) };
}

function materializeSelection(selection, { refs, record, selectedGap, fresh, issues }) {
  const selectedInternalRef = fresh ? `fresh-gap:${record.id}:${selectedGap.id}` : `case-gap:${record.id}:${selectedGap.id}`;
  const considered = selection.considered.map((item, index) => {
    const ref = item.ref === selection.selected_ref && fresh ? selectedInternalRef : item.ref;
    return { ...structuredClone(item), ref };
  });
  issue(considered.filter((item) => item.disposition === 'selected').length === 1, 'case_command.selection.considered', 'must contain exactly one selected item', issues);
  return {
    mode: fresh ? 'fresh' : 'candidate', basis: selection.basis,
    snapshot_token: selection.snapshot_token || '', selected_ref: selectedInternalRef,
    comparison_summary: selection.comparison_summary, fresh_discovery_summary: selection.fresh_discovery_summary,
    considered,
  };
}

function selectedPersistedGap({ command, snapshot, record, issues }) {
  const candidate = snapshot.candidate_catalog.persisted_candidates.find((item) => item.ref === command.selection.selected_ref && item.case_id === record.id);
  issue(Boolean(candidate), 'case_command.selection.selected_ref', 'must identify a ready persisted gap in the selected Case', issues);
  return structuredClone(candidate?.gap || emptyGap());
}

function materializeClaim(claim, { refs, project, record, selectedGap, issues, projectStateDelta }) {
  const factsAdded = claim.facts_added.map((item, index) => ({
    id: refs.resolve(item.ref, 'fact', `case_command.claim.facts_added[${index}].ref`), revision: 1, status: 'accepted',
    statement: item.statement, basis: item.basis, evidence: [...item.evidence],
  }));
  const factsSuperseded = claim.facts_superseded.map((item, index) => {
    const id = refs.resolve(item.fact_ref, 'fact', `case_command.claim.facts_superseded[${index}].fact_ref`);
    const fact = record.facts.find((candidate) => candidate.id === id && candidate.status === 'accepted');
    issue(Boolean(fact), `case_command.claim.facts_superseded[${index}].fact_ref`, 'must reference an accepted fact', issues);
    return { id, revision: fact?.revision || 0, reason: item.reason, evidence: [...item.evidence] };
  });
  const projectedDecisionRevisions = new Map(project.software_definition.decision_areas.map((area) => [area.id, area.decision.revision]));
  for (const change of projectStateDelta.software_definition_changes) projectedDecisionRevisions.set(change.area_ref, change.observed_revision + 1);
  const impact = (item, index, action) => {
    const id = action === 'add'
      ? refs.resolve(item.ref, 'impact', `case_command.claim.impacts_${action}ed[${index}].ref`)
      : refs.resolve(item.ref, 'impact', `case_command.claim.impacts_updated[${index}].ref`);
    const factId = refs.resolve(item.fact_ref, 'fact', `case_command.claim.impacts_${action}ed[${index}].fact_ref`);
    const fact = [...record.facts, ...factsAdded].find((candidate) => candidate.id === factId && candidate.status === 'accepted');
    issue(Boolean(fact), `case_command.claim.impacts_${action}ed[${index}].fact_ref`, 'must reference an accepted fact', issues);
    const target = parseRef(item.target_ref);
    issue(target?.scope === 'project' && ['decision', 'invariant'].includes(target?.type), `case_command.claim.impacts_${action}ed[${index}].target_ref`, 'must reference a Project decision or invariant', issues);
    const targetId = target ? refs.resolve(item.target_ref, target.type, `case_command.claim.impacts_${action}ed[${index}].target_ref`) : '';
    return {
      id, fact_id: factId, fact_revision: fact?.revision || 1,
      target: { kind: target?.type === 'decision' ? 'software_decision' : 'software_invariant', ref: targetId, revision: target?.type === 'decision' ? projectedDecisionRevisions.get(targetId) : null },
      effect: item.effect, reason: item.reason,
      gap_ids: item.gap_refs.map((ref, refIndex) => refs.resolve(ref, 'gap', `case_command.claim.impacts_${action}ed[${index}].gap_refs[${refIndex}]`)),
      evidence: [...item.evidence],
    };
  };
  const gapsAdded = claim.gaps_added.map((item) => materializeGap(item, refs, issues));
  const resolvedGap = claim.resolve_selected_gap === null ? null : {
    id: selectedGap.id, status: 'resolved', outcome: claim.resolve_selected_gap.outcome,
    reason: claim.resolve_selected_gap.reason, evidence: [...claim.resolve_selected_gap.evidence],
  };
  return {
    resolved_gap: resolvedGap,
    facts_added: factsAdded,
    facts_superseded: factsSuperseded,
    impacts_added: claim.impacts_added.map((item, index) => impact(item, index, 'add')),
    impacts_updated: claim.impacts_updated.map((item, index) => impact(item, index, 'updat')),
    gaps_added: gapsAdded,
    gaps_cancelled: claim.gaps_cancelled.map((item, index) => ({
      id: refs.resolve(item.gap_ref, 'gap', `case_command.claim.gaps_cancelled[${index}].gap_ref`), status: 'cancelled',
      outcome: item.outcome, reason: item.reason, evidence: [...item.evidence],
    })),
    resolved_open_questions: [...claim.resolved_open_questions], completed_handoffs: [...claim.completed_handoffs],
    completion_review_result: claim.completion_review_result === null ? null : {
      ...structuredClone(claim.completion_review_result),
      findings: claim.completion_review_result.findings.map((finding, index) => ({
        id: refs.resolve(finding.ref, 'review-finding', `case_command.claim.completion_review_result.findings[${index}].ref`),
        kind: finding.kind, statement: finding.statement, responsibility: finding.responsibility,
        artifact_refs: [...finding.artifact_refs], evidence: [...finding.evidence],
      })),
      reviewed_content_revision: record.content_revision,
    },
    resolved_review_findings: [...claim.resolved_review_findings],
    review_budget_extension: structuredClone(claim.review_budget_extension),
  };
}

function materializeGap(item, refs, issues) {
  return {
    id: refs.resolve(item.ref, 'gap', `semantic_gap.${item.ref}`), status: 'open', goal: item.goal, reason: item.reason,
    derived_from: item.derived_from.map((ref, index) => resolveDerivation(refs, ref, `semantic_gap.${item.ref}.derived_from[${index}]`, issues)),
    blocked_by: item.blocked_by.map((ref, index) => refs.resolve(ref, 'gap', `semantic_gap.${item.ref}.blocked_by[${index}]`)),
    priority_basis: structuredClone(item.priority_basis), responsibility: item.responsibility,
    evidence_required: [...item.evidence_required], resolution: null,
  };
}

function materializeProjectClaim(claim, { refs, project, record, issues }) {
  const projectGapChanges = claim.project_gap_changes.map((item, index) => {
    const id = item.action === 'add'
      ? refs.resolve(item.ref, 'project-gap', `case_command.project_claim.project_gap_changes[${index}].ref`)
      : refs.resolve(item.ref, 'project-gap', `case_command.project_claim.project_gap_changes[${index}].ref`);
    const gap = item.gap === null ? null : {
      id, goal: item.gap.goal, reason: item.gap.reason,
      affects: item.gap.affects.map((ref, refIndex) => {
        const parsed = parseRef(ref);
        issue(parsed?.scope === 'project' && ['decision', 'invariant'].includes(parsed?.type), `case_command.project_claim.project_gap_changes[${index}].gap.affects[${refIndex}]`, 'must reference a Project decision or invariant', issues);
        return { kind: parsed?.type === 'decision' ? 'software_decision' : 'software_invariant', ref: parsed ? refs.resolve(ref, parsed.type, `case_command.project_claim.project_gap_changes[${index}].gap.affects[${refIndex}]`) : '' };
      }),
      priority_basis: structuredClone(item.gap.priority_basis),
      dependencies: item.gap.dependencies.map((ref, refIndex) => refs.resolve(ref, 'project-gap', `case_command.project_claim.project_gap_changes[${index}].gap.dependencies[${refIndex}]`)),
      candidate_case_ref: item.gap.candidate_case_ref === 'case:current'
        ? project.advancement.active_case_refs.find((ref) => ref.split('/').at(-1)?.startsWith(`${record.id}-`)) || ''
        : '',
    };
    return { action: item.action, gap, gap_id: item.action === 'resolve' ? id : '', reason: item.reason, evidence: [...item.evidence] };
  });
  const projectedGaps = structuredClone(project.advancement.project_gaps);
  for (const change of projectGapChanges) {
    const index = projectedGaps.findIndex((gap) => gap.id === (change.gap?.id || change.gap_id));
    if (change.action === 'add') projectedGaps.push(change.gap);
    else if (change.action === 'update' && index >= 0) projectedGaps[index] = change.gap;
    else if (change.action === 'resolve' && index >= 0) projectedGaps.splice(index, 1);
  }
  const decisionChanges = claim.decision_changes.map((item, index) => {
    const areaRef = refs.resolve(item.area_ref, 'decision', `case_command.project_claim.decision_changes[${index}].area_ref`);
    const area = project.software_definition.decision_areas.find((candidate) => candidate.id === areaRef);
    return {
      area_ref: areaRef, observed_revision: area?.decision.revision ?? -1, set_decision: structuredClone(item.set_decision),
      gap_refs: projectedGaps.filter((gap) => gap.affects.some((target) => target.kind === 'software_decision' && target.ref === areaRef)).map((gap) => gap.id),
      reason: item.reason, evidence: [...item.evidence],
    };
  });
  const invariantChanges = claim.invariant_changes.map((item, index) => {
    const id = item.action === 'add'
      ? refs.resolve(item.ref, 'invariant', `case_command.project_claim.invariant_changes[${index}].ref`)
      : refs.resolve(item.ref, 'invariant', `case_command.project_claim.invariant_changes[${index}].ref`);
    return { action: item.action, invariant: { id, ...structuredClone(item.definition) }, reason: item.reason, evidence: [...item.evidence] };
  });
  return {
    software_definition_changes: decisionChanges,
    software_invariant_changes: invariantChanges,
    project_gap_changes: projectGapChanges,
    selection_context_change: structuredClone(claim.selection_context_change),
    evidence: [...claim.evidence],
  };
}

function materializeAssessment(assessment, { refs, project, issues }) {
  const judgments = assessment.judgments.map((item, index) => ({
    invariant_ref: refs.resolve(item.invariant_ref, 'invariant', `case_command.invariant_assessment.judgments[${index}].invariant_ref`),
    disposition: item.disposition, reason: item.reason,
    fact_refs: item.fact_refs.map((ref, refIndex) => refs.resolve(ref, 'fact', `case_command.invariant_assessment.judgments[${index}].fact_refs[${refIndex}]`)),
    evidence: [...item.evidence],
    gap_refs: item.gap_refs.map((ref, refIndex) => refs.resolve(ref, 'gap', `case_command.invariant_assessment.judgments[${index}].gap_refs[${refIndex}]`)),
  }));
  const expected = project.software_invariants.map((item) => item.id);
  const actual = judgments.map((item) => item.invariant_ref);
  issue(expected.length === actual.length && expected.every((id) => actual.includes(id)), 'case_command.invariant_assessment.judgments', 'must cover the current invariant catalog exactly', issues);
  return { project_revision: project.project.revision, judgments };
}

function validateSelection(selection, path, issues) {
  issue(object(selection), path, 'must be an object', issues); if (!object(selection)) return;
  for (const key of ['basis', 'snapshot_token', 'selected_ref', 'comparison_summary', 'fresh_discovery_summary']) issue(nonEmpty(selection[key]), `${path}.${key}`, 'is required', issues);
  issue(Array.isArray(selection.considered) && selection.considered.length > 0, `${path}.considered`, 'must be non-empty', issues);
  for (const [index, item] of (selection.considered || []).entries()) {
    issue(object(item) && nonEmpty(item.ref) && ['persisted', 'fresh'].includes(item.source) && ['ready', 'case_required', 'blocked', 'ineligible'].includes(item.eligibility) && ['selected', 'deferred', 'excluded'].includes(item.disposition) && object(item.priority_basis) && nonEmpty(item.reason), `${path}.considered[${index}]`, 'is invalid', issues);
  }
}

function validateClaim(claim, path, issues) {
  issue(object(claim), path, 'must be an object', issues); if (!object(claim)) return;
  for (const key of ['facts_added', 'facts_superseded', 'impacts_added', 'impacts_updated', 'gaps_added', 'gaps_cancelled', 'resolved_open_questions', 'completed_handoffs', 'resolved_review_findings']) issue(Array.isArray(claim[key]), `${path}.${key}`, 'must be an array', issues);
  issue(claim.resolve_selected_gap === null || resolution(claim.resolve_selected_gap), `${path}.resolve_selected_gap`, 'must be a semantic resolution or null', issues);
  for (const [index, item] of (claim.facts_added || []).entries()) issue(localRef(item?.ref, 'fact') && nonEmpty(item.statement) && nonEmpty(item.basis) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.facts_added[${index}]`, 'is invalid', issues);
  for (const [index, item] of (claim.facts_superseded || []).entries()) issue(typedRef(item?.fact_ref, 'case', 'fact') && nonEmpty(item.reason) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.facts_superseded[${index}]`, 'is invalid', issues);
  for (const [key, scope] of [['impacts_added', 'local'], ['impacts_updated', 'case']]) for (const [index, item] of (claim[key] || []).entries()) {
    issue(typedRef(item?.ref, scope, 'impact') && nonEmpty(item.fact_ref) && /^project:(decision|invariant):/.test(item.target_ref || '') && EFFECTS.has(item.effect) && nonEmpty(item.reason) && stringArray(item.gap_refs) && stringArray(item.evidence), `${path}.${key}[${index}]`, 'is invalid', issues);
  }
  for (const [index, item] of (claim.gaps_added || []).entries()) validateNewGap(item, `${path}.gaps_added[${index}]`, issues);
  for (const [index, item] of (claim.gaps_cancelled || []).entries()) issue(nonEmpty(item?.gap_ref) && nonEmpty(item.outcome) && nonEmpty(item.reason) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.gaps_cancelled[${index}]`, 'is invalid', issues);
  issue(claim.completion_review_result === null || object(claim.completion_review_result), `${path}.completion_review_result`, 'must be object or null', issues);
  if (object(claim.completion_review_result)) validateCompletionReview(claim.completion_review_result, `${path}.completion_review_result`, issues);
  issue(claim.review_budget_extension === null || object(claim.review_budget_extension), `${path}.review_budget_extension`, 'must be object or null', issues);
}

function validateCompletionReview(review, path, issues) {
  issue(['clean', 'findings', 'needs_human'].includes(review?.outcome), `${path}.outcome`, 'is invalid', issues);
  issue(['agent', 'human'].includes(review?.reviewer), `${path}.reviewer`, 'is invalid', issues);
  const dimensions = review?.dimensions;
  issue(object(dimensions), `${path}.dimensions`, 'must be an object', issues);
  for (const key of ['implementation_correctness', 'problem_resolution', 'verification_credibility', 'regression_risk', 'minimality']) {
    issue(['clean', 'findings'].includes(dimensions?.[key]), `${path}.dimensions.${key}`, 'is invalid', issues);
  }
  issue(Array.isArray(review?.findings), `${path}.findings`, 'must be an array', issues);
  for (const [index, finding] of (review?.findings || []).entries()) {
    issue(localRef(finding?.ref, 'review-finding') && nonEmpty(finding?.kind) && nonEmpty(finding?.statement)
      && RESPONSIBILITIES.has(finding?.responsibility) && stringArray(finding?.artifact_refs)
      && stringArray(finding?.evidence) && finding.evidence.length > 0, `${path}.findings[${index}]`, 'is invalid', issues);
  }
  issue(stringArray(review?.evidence) && review.evidence.length > 0, `${path}.evidence`, 'must contain evidence', issues);
}

function validateProjectClaim(claim, path, issues) {
  issue(object(claim), path, 'must be an object', issues); if (!object(claim)) return;
  for (const key of ['decision_changes', 'invariant_changes', 'project_gap_changes', 'evidence']) issue(Array.isArray(claim[key]), `${path}.${key}`, 'must be an array', issues);
  issue(claim.selection_context_change === null || object(claim.selection_context_change), `${path}.selection_context_change`, 'must be object or null', issues);
  for (const [index, item] of (claim.decision_changes || []).entries()) issue(typedRef(item?.area_ref, 'project', 'decision') && object(item.set_decision) && nonEmpty(item.reason) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.decision_changes[${index}]`, 'is invalid', issues);
  for (const [index, item] of (claim.invariant_changes || []).entries()) issue(['add', 'update', 'retire', 'sync_core'].includes(item?.action) && nonEmpty(item.ref) && object(item.definition) && nonEmpty(item.reason) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.invariant_changes[${index}]`, 'is invalid', issues);
  for (const [index, item] of (claim.project_gap_changes || []).entries()) issue(['add', 'update', 'resolve'].includes(item?.action) && nonEmpty(item.ref) && (item.gap === null || object(item.gap)) && nonEmpty(item.reason) && stringArray(item.evidence) && item.evidence.length > 0, `${path}.project_gap_changes[${index}]`, 'is invalid', issues);
}

function validateAssessment(assessment, path, issues) {
  issue(object(assessment) && Array.isArray(assessment.judgments) && assessment.judgments.length > 0, path, 'requires judgments', issues); if (!object(assessment)) return;
  for (const [index, item] of (assessment.judgments || []).entries()) issue(typedRef(item?.invariant_ref, 'project', 'invariant') && DISPOSITIONS.has(item.disposition) && nonEmpty(item.reason) && stringArray(item.fact_refs) && stringArray(item.evidence) && stringArray(item.gap_refs), `${path}.judgments[${index}]`, 'is invalid', issues);
}

function validateNewGap(item, path, issues) {
  issue(localRef(item?.ref, 'gap') && nonEmpty(item.goal) && nonEmpty(item.reason) && stringArray(item.derived_from) && stringArray(item.blocked_by) && object(item.priority_basis) && RESPONSIBILITIES.has(item.responsibility) && stringArray(item.evidence_required), path, 'is invalid', issues);
}

function resolveDerivation(refs, ref, path, issues) {
  const parsed = parseRef(ref);
  if (parsed?.scope === 'system') return parsed.id;
  if (parsed?.type === 'fact' || parsed?.type === 'gap') return refs.resolve(ref, parsed.type, path);
  issue(false, path, 'must reference a Case fact, Case gap, local fact/gap, or system source', issues); return '';
}

function parseRef(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(local|case|project|system):([a-z-]+):(.+)$/);
  if (match) return { scope: match[1], type: match[2], id: match[3] };
  const system = value.match(/^system:(.+)$/);
  return system ? { scope: 'system', type: 'source', id: system[1] } : null;
}
function localRef(value, type) { return typedRef(value, 'local', type); }
function typedRef(value, scope, type) { const parsed = parseRef(value); return parsed?.scope === scope && parsed.type === type; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function stringArray(value) { return Array.isArray(value) && value.every((item) => typeof item === 'string'); }
function resolution(value) { return object(value) && nonEmpty(value.outcome) && nonEmpty(value.reason) && stringArray(value.evidence) && value.evidence.length > 0; }
function issue(condition, path, message, issues) { if (!condition) issues.push({ path, message }); }
function emptyGap() { return { id: '', responsibility: 'agent', goal: '', reason: '', derived_from: [], blocked_by: [], priority_basis: {}, evidence_required: [] }; }
