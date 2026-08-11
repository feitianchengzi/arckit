export const CORE_SOFTWARE_INVARIANTS = Object.freeze([
  Object.freeze({ id: 'observable-behavior-has-durable-expectation', applies_when: 'The accepted Case transition adds or changes user-observable behavior, business rules, or acceptance semantics.', must_hold: 'The behavior accepted by this transition has an accurate, unambiguous, and durably recoverable product expectation.', evidence_expectation: 'Persistent evidence sufficient to recover the accepted behavior and its acceptance basis.', priority: 'required' }),
  Object.freeze({ id: 'changed-interactions-remain-recoverable', applies_when: 'The accepted Case transition adds or changes a user journey, interaction rule, navigation, feedback, or operable state.', must_hold: 'The interaction change accepted by this transition is coherent and durably recoverable.', evidence_expectation: 'Persistent evidence sufficient to understand and verify the accepted interaction change.', priority: 'required' }),
  Object.freeze({ id: 'changed-visual-language-remains-consistent', applies_when: 'The accepted Case transition adds or changes visual appearance, layout, theme, token, or component presentation.', must_hold: 'The visual change accepted by this transition remains consistent with the project visual language and is durably recoverable.', evidence_expectation: 'Persistent visual specification or equivalent evidence for the accepted visual change.', priority: 'required' }),
  Object.freeze({ id: 'changed-contracts-remain-explainable', applies_when: 'The accepted Case transition changes architecture, data models, APIs, integration boundaries, runtime contracts, or important technical constraints.', must_hold: 'The technical contract accepted by this transition is coherent, explainable, and durably recoverable.', evidence_expectation: 'Persistent technical evidence sufficient to recover the accepted decision, constraints, and affected boundaries.', priority: 'required' }),
  Object.freeze({ id: 'accepted-facts-are-realized', applies_when: 'The accepted Case transition claims executable behavior was added or changed, or that an implementation Gap was resolved.', must_hold: 'The implementation accepted by this transition realizes its relevant accepted facts and upheld project decisions and invariants.', evidence_expectation: 'Code and implementation evidence traceable to the facts and Project State used by this transition.', priority: 'required' }),
  Object.freeze({ id: 'material-risks-have-credible-evidence', applies_when: 'The accepted Case transition changes a risk-bearing surface or claims that a material correctness or regression risk is controlled.', must_hold: 'The risk-bearing claims accepted by this transition are supported by credible, repeatable, proportionate evidence.', evidence_expectation: 'Tests, checks, inspection, or operational evidence proportionate to the risks accepted by this transition.', priority: 'required' }),
]);

export function defaultSoftwareInvariants() {
  return CORE_SOFTWARE_INVARIANTS.map((item) => structuredClone(item));
}

export function validateCoreSoftwareInvariants(record, file = '<record>') {
  const errors = [];
  const invariants = record?.software_invariants;
  if (!Array.isArray(invariants)) return [`${file}: software_invariants must be an array`];
  for (const expected of CORE_SOFTWARE_INVARIANTS) {
    const actual = invariants.find((item) => item?.id === expected.id);
    if (!actual) {
      errors.push(`${file}: software_invariants must include core software invariant ${expected.id}`);
      continue;
    }
    for (const key of ['id', 'applies_when', 'must_hold', 'evidence_expectation', 'priority']) {
      if (actual[key] !== expected[key]) errors.push(`${file}: core software invariant ${expected.id}.${key} must match the current protocol definition exactly`);
    }
  }
  return errors;
}

export function coreSoftwareInvariantIds() {
  return new Set(CORE_SOFTWARE_INVARIANTS.map((item) => item.id));
}
