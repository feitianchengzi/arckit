export const CORE_SOFTWARE_INVARIANTS = Object.freeze([
  Object.freeze({ id: 'observable-behavior-has-durable-expectation', applies_when: 'A Case adds or changes user-observable behavior, business rules, or acceptance semantics.', must_hold: 'The relevant product expectation is accurate, unambiguous, and durably recoverable.', evidence_expectation: 'Persistent evidence sufficient to recover the expected behavior and its acceptance basis.', priority: 'required' }),
  Object.freeze({ id: 'changed-interactions-remain-recoverable', applies_when: 'A Case adds or changes a user journey, interaction rule, navigation, feedback, or operable state.', must_hold: 'The changed interaction expectation is coherent and durably recoverable.', evidence_expectation: 'Persistent evidence sufficient to understand and verify the affected interaction behavior.', priority: 'required' }),
  Object.freeze({ id: 'changed-visual-language-remains-consistent', applies_when: 'A Case adds or changes visual appearance, layout, theme, token, or component presentation.', must_hold: 'The changed visual expectation remains consistent with the project visual language and is durably recoverable.', evidence_expectation: 'Persistent visual specification or equivalent evidence for the affected surface.', priority: 'required' }),
  Object.freeze({ id: 'changed-contracts-remain-explainable', applies_when: 'A Case changes architecture, data models, APIs, integration boundaries, runtime contracts, or important technical constraints.', must_hold: 'The resulting technical contract is coherent, explainable, and durably recoverable.', evidence_expectation: 'Persistent technical evidence sufficient to recover the decision, constraints, and affected boundaries.', priority: 'required' }),
  Object.freeze({ id: 'accepted-facts-are-realized', applies_when: 'A Case requires executable behavior or changes existing implementation.', must_hold: 'The implementation realizes all relevant accepted facts and upheld project decisions and invariants.', evidence_expectation: 'Code and implementation evidence traceable to the relevant Case facts and Project State.', priority: 'required' }),
  Object.freeze({ id: 'material-risks-have-credible-evidence', applies_when: 'A Case changes behavior, contracts, implementation, data, integration, security, delivery, or another risk-bearing surface.', must_hold: 'Material correctness and regression risks are covered by credible, repeatable verification evidence.', evidence_expectation: 'Tests, checks, inspection, or operational evidence proportionate to the identified risks.', priority: 'required' }),
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
