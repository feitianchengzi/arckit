const RESPONSIBILITIES = new Set(['agent', 'human', 'external']);
const EFFECTS = new Set(['upheld', 'threatened', 'undetermined']);

export class CaseControlClaimError extends Error {
  constructor(issues) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
    this.name = 'CaseControlClaimError';
    this.kind = 'claim_invalid';
    this.issues = issues;
  }
}

export function validateSemanticCreateCaseHandoff(handoff, field = 'case_control_handoff') {
  const issues = [];
  const facts = items(handoff?.initial_facts);
  const impacts = items(handoff?.initial_impacts);
  const gaps = items(handoff?.initial_gaps);

  issue(Array.isArray(handoff?.initial_facts) && facts.length > 0, `${field}.initial_facts`, 'must contain at least one semantic fact', issues);
  issue(Array.isArray(handoff?.initial_impacts), `${field}.initial_impacts`, 'must be an array', issues);
  issue(Array.isArray(handoff?.initial_gaps) && gaps.length > 0, `${field}.initial_gaps`, 'must contain at least one semantic gap', issues);

  for (const [index, fact] of facts.entries()) {
    issue(object(fact)
      && onlyKeys(fact, ['ref', 'statement', 'basis', 'evidence'])
      && localRef(fact.ref, 'fact')
      && nonEmpty(fact.statement)
      && nonEmpty(fact.basis)
      && nonEmptyStringArray(fact.evidence), `${field}.initial_facts[${index}]`, 'must be a semantic fact with a local:fact:<handle> ref and evidence', issues);
  }
  for (const [index, gap] of gaps.entries()) {
    issue(object(gap)
      && onlyKeys(gap, ['ref', 'goal', 'reason', 'derived_from', 'blocked_by', 'priority_basis', 'responsibility', 'evidence_required'])
      && localRef(gap.ref, 'gap')
      && nonEmpty(gap.goal)
      && nonEmpty(gap.reason)
      && nonEmptyStringArray(gap.derived_from)
      && stringArray(gap.blocked_by)
      && object(gap.priority_basis)
      && Object.keys(gap.priority_basis).length > 0
      && RESPONSIBILITIES.has(gap.responsibility)
      && stringArray(gap.evidence_required), `${field}.initial_gaps[${index}]`, 'must be a semantic gap with a local:gap:<handle> ref', issues);
  }
  for (const [index, impact] of impacts.entries()) {
    const valid = object(impact)
      && onlyKeys(impact, ['ref', 'fact_ref', 'target_ref', 'effect', 'reason', 'gap_refs', 'evidence'])
      && localRef(impact.ref, 'impact')
      && localRef(impact.fact_ref, 'fact')
      && projectTargetRef(impact.target_ref)
      && EFFECTS.has(impact.effect)
      && nonEmpty(impact.reason)
      && stringArray(impact.gap_refs)
      && stringArray(impact.evidence);
    issue(valid, `${field}.initial_impacts[${index}]`, 'must be a semantic impact with typed local and Project refs', issues);
    if (!object(impact)) continue;
    if (impact.effect === 'upheld') issue(nonEmptyStringArray(impact.evidence), `${field}.initial_impacts[${index}].evidence`, 'upheld requires evidence', issues);
    if (['threatened', 'undetermined'].includes(impact.effect)) issue((impact.gap_refs || []).length > 0, `${field}.initial_impacts[${index}].gap_refs`, `${impact.effect} requires at least one gap ref`, issues);
  }

  validateUnique(facts.map((item) => item?.ref), `${field}.initial_facts`, 'fact ref', issues);
  validateUnique(gaps.map((item) => item?.ref), `${field}.initial_gaps`, 'gap ref', issues);
  validateUnique(impacts.map((item) => item?.ref), `${field}.initial_impacts`, 'impact ref', issues);
  return issues;
}

export function materializeSemanticCreateCaseHandoff({ handoff, projectState, caseId }) {
  const issues = validateSemanticCreateCaseHandoff(handoff);
  if (issues.length) throw new CaseControlClaimError(issues);
  issue(/^CASE-\d{8}-\d{3}$/.test(caseId || ''), 'case_control_handoff.case_id', 'trusted Ledger did not allocate a canonical Case id', issues);
  issue(object(projectState), 'project_state', 'is unavailable', issues);
  if (issues.length) throw new CaseControlClaimError(issues);

  const mapping = allocateCanonicalIds(handoff, caseId);
  const facts = handoff.initial_facts.map((fact) => ({
    id: mapping[fact.ref],
    revision: 1,
    status: 'accepted',
    statement: fact.statement,
    basis: fact.basis,
    evidence: [...fact.evidence],
  }));
  const gaps = handoff.initial_gaps.map((gap, index) => ({
    id: mapping[gap.ref],
    status: 'open',
    goal: gap.goal,
    reason: gap.reason,
    derived_from: gap.derived_from.map((ref, refIndex) => resolveDerivation(ref, mapping, `case_control_handoff.initial_gaps[${index}].derived_from[${refIndex}]`, issues)),
    blocked_by: gap.blocked_by.map((ref, refIndex) => resolveLocal(ref, 'gap', mapping, `case_control_handoff.initial_gaps[${index}].blocked_by[${refIndex}]`, issues)),
    priority_basis: structuredClone(gap.priority_basis),
    responsibility: gap.responsibility,
    evidence_required: [...gap.evidence_required],
    resolution: null,
  }));
  const decisionRevisions = new Map((projectState.software_definition?.decision_areas || []).map((area) => [area.id, area.decision.revision]));
  const invariants = new Set((projectState.software_invariants || []).map((item) => item.id));
  const impacts = handoff.initial_impacts.map((impact, index) => {
    const target = parseRef(impact.target_ref);
    const targetExists = target?.type === 'decision' ? decisionRevisions.has(target.id) : target?.type === 'invariant' && invariants.has(target.id);
    issue(targetExists, `case_control_handoff.initial_impacts[${index}].target_ref`, `references unknown Project target ${impact.target_ref}`, issues);
    return {
      id: mapping[impact.ref],
      fact_id: resolveLocal(impact.fact_ref, 'fact', mapping, `case_control_handoff.initial_impacts[${index}].fact_ref`, issues),
      fact_revision: 1,
      target: {
        kind: target?.type === 'decision' ? 'software_decision' : 'software_invariant',
        ref: target?.id || '',
        revision: target?.type === 'decision' ? decisionRevisions.get(target.id) : null,
      },
      effect: impact.effect,
      reason: impact.reason,
      gap_ids: impact.gap_refs.map((ref, refIndex) => resolveLocal(ref, 'gap', mapping, `case_control_handoff.initial_impacts[${index}].gap_refs[${refIndex}]`, issues)),
      evidence: [...impact.evidence],
    };
  });

  const gapIds = new Set(gaps.map((gap) => gap.id));
  for (const [index, gap] of gaps.entries()) {
    issue(gap.blocked_by.every((id) => gapIds.has(id) && id !== gap.id), `case_control_handoff.initial_gaps[${index}].blocked_by`, 'must reference another initial gap', issues);
  }
  if (issues.length) throw new CaseControlClaimError(issues);
  return { facts, impacts, gaps, canonical_id_mapping: mapping };
}

function allocateCanonicalIds(handoff, caseId) {
  const caseKey = caseId.replace(/^CASE-/, '');
  const mapping = {};
  const allocate = (itemsToAllocate, prefix) => itemsToAllocate.forEach((item, index) => {
    mapping[item.ref] = `${prefix}-${caseKey}-${String(index + 1).padStart(3, '0')}`;
  });
  allocate(handoff.initial_facts, 'FACT');
  allocate(handoff.initial_gaps, 'GAP');
  allocate(handoff.initial_impacts, 'IMPACT');
  return mapping;
}

function resolveDerivation(ref, mapping, path, issues) {
  const parsed = parseRef(ref);
  if (parsed?.scope === 'system') return parsed.id;
  if (parsed?.scope === 'local' && ['fact', 'gap'].includes(parsed.type)) return resolveLocal(ref, parsed.type, mapping, path, issues);
  issue(false, path, 'must reference a local fact/gap or system source', issues);
  return '';
}

function resolveLocal(ref, expectedType, mapping, path, issues) {
  issue(localRef(ref, expectedType), path, `must be local:${expectedType}:<handle>`, issues);
  issue(nonEmpty(mapping[ref]), path, `references unknown local ${expectedType}`, issues);
  return mapping[ref] || '';
}

function parseRef(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(local|project):([a-z-]+):(.+)$/);
  if (match) return { scope: match[1], type: match[2], id: match[3] };
  const system = value.match(/^system:(.+)$/);
  return system ? { scope: 'system', type: 'source', id: system[1] } : null;
}

function localRef(value, type) { const parsed = parseRef(value); return parsed?.scope === 'local' && parsed.type === type; }
function projectTargetRef(value) { const parsed = parseRef(value); return parsed?.scope === 'project' && ['decision', 'invariant'].includes(parsed.type); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function onlyKeys(value, allowed) { return Object.keys(value).every((key) => allowed.includes(key)); }
function items(value) { return Array.isArray(value) ? value : []; }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function stringArray(value) { return Array.isArray(value) && value.every((item) => typeof item === 'string'); }
function nonEmptyStringArray(value) { return stringArray(value) && value.length > 0 && value.every(nonEmpty); }
function issue(condition, path, message, issues) { if (!condition) issues.push({ path, message }); }

function validateUnique(values, path, label, issues) {
  const seen = new Set();
  for (const value of values.filter(nonEmpty)) {
    issue(!seen.has(value), path, `${label} ${value} must appear only once`, issues);
    seen.add(value);
  }
}
