const object = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const texts = (value) => Array.isArray(value) && value.every(text);

// Validate declarations, never infer the business role of files, facts or actions.
export function validateSelectionAssessment(value, label = 'planned_transition.selection_assessment') {
  const errors = [];
  if (!object(value)) return [`${label} is required`];
  const contextKeys = ['maintenance_object', 'implementation_carriers', 'activation', 'verification'];
  const inherited = typeof value.context_ref === 'string';
  if (value.context_ref !== null && !/^case:round:[1-9]\d*$/.test(value.context_ref || '')) errors.push(`${label}.context_ref must be null or case:round:<number>`);
  if (inherited) {
    if (contextKeys.some((key) => value[key] !== null)) errors.push(`${label} referenced context fields must be null; provide a full context with context_ref=null when it changes`);
  } else {
    for (const key of ['maintenance_object', 'activation', 'verification']) if (!text(value[key])) errors.push(`${label}.${key} must be non-empty`);
    if (!texts(value.implementation_carriers)) errors.push(`${label}.implementation_carriers must be an array of non-empty strings`);
  }
  for (const key of ['scope', 'boundary_reason']) {
    if (!text(value[key])) errors.push(`${label}.${key} must be non-empty`);
  }
  for (const key of ['invariant_refs', 'acceptance', 'expected_fact_refs', 'deferred']) {
    if (!texts(value[key])) errors.push(`${label}.${key} must be an array of non-empty strings`);
  }
  if (!value.acceptance?.length) errors.push(`${label}.acceptance must identify the bounded results`);
  if (!['exploration', 'establishment'].includes(value.conclusion_kind)) errors.push(`${label}.conclusion_kind is invalid`);
  for (const key of ['establishes_expectations', 'delivers_realization']) {
    if (typeof value[key] !== 'boolean') errors.push(`${label}.${key} must be boolean`);
  }
  if (value.establishes_expectations && value.delivers_realization) errors.push(`${label} cannot establish expectations and deliver realization in one Gap`);
  if (value.conclusion_kind === 'exploration' && (value.establishes_expectations || value.delivers_realization)) errors.push(`${label} exploration cannot claim formal adoption or realization`);
  if ((value.establishes_expectations || value.delivers_realization) && !value.invariant_refs?.length) errors.push(`${label} formal expectations or realization require invariant refs`);
  if (value.delivers_realization && (!value.expected_fact_refs?.length || (!inherited && !value.implementation_carriers?.length))) errors.push(`${label} formal realization requires accepted expectation refs and implementation carriers`);
  if (!Array.isArray(value.prerequisites)) errors.push(`${label}.prerequisites must be an array`);
  else for (const [index, item] of value.prerequisites.entries()) {
    if (!object(item) || !text(item.statement) || item.status !== 'satisfied' || !texts(item.evidence) || !item.evidence.length) {
      errors.push(`${label}.prerequisites[${index}] must declare a satisfied prerequisite with evidence; unresolved prerequisites require a different Gap or handoff`);
    }
  }
  if (texts(value.invariant_refs) && new Set(value.invariant_refs).size !== value.invariant_refs.length) errors.push(`${label}.invariant_refs must not repeat`);
  return errors;
}

export function validateSelectionAssessmentAgainstHistory(value, record, gapId) {
  const errors = [];
  // Historical rounds without this declaration remain historical; do not infer their role.
  const prior = (record?.rounds || []).filter((round) => round.selected_gap?.id === gapId)
    .map((round) => round.planned_transition?.selection_assessment).filter(Boolean);
  if ((value?.delivers_realization && prior.some((item) => item.establishes_expectations))
    || (value?.establishes_expectations && prior.some((item) => item.delivers_realization))) {
    errors.push('selection_assessment cannot combine expectations and realization across rounds of the same Gap; preserve remaining obligations and reselect a separate Gap');
  }
  if (value?.context_ref) {
    let source = value;
    const visited = new Set();
    while (source?.context_ref) {
      const ref = source.context_ref;
      if (visited.has(ref)) { errors.push('selection_assessment.context_ref contains a cycle'); return errors; }
      visited.add(ref);
      const roundNumber = Number(ref.split(':').at(-1));
      const round = (record?.rounds || []).find((item) => item.round === roundNumber);
      source = round?.planned_transition?.selection_assessment;
      if (!source) { errors.push(`selection_assessment.context_ref does not identify an accepted context: ${ref}`); return errors; }
    }
    // Inherit only stable context, never the previous goal, prerequisites or acceptance claim.
    const resolved = { ...value, context_ref: null };
    for (const key of ['maintenance_object', 'implementation_carriers', 'activation', 'verification']) resolved[key] = source[key];
    errors.push(...validateSelectionAssessment(resolved));
  }
  return errors;
}

export function validateSelectionAssessmentAgainstState(value, project) {
  const errors = validateSelectionAssessment(value);
  const ids = new Set((project?.software_invariants || []).map((item) => item.id));
  for (const ref of Array.isArray(value?.invariant_refs) ? value.invariant_refs : []) {
    if (!ids.has(ref)) errors.push(`selection_assessment references unknown invariant: ${ref}`);
  }
  return errors;
}
