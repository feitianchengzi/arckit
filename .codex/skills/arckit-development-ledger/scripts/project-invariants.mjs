export const CORE_SOFTWARE_INVARIANTS = Object.freeze([
  Object.freeze({ id: 'product-expectations-remain-recoverable', applies_when: 'Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable product outcome, capability, business rule, or acceptance meaning.', must_hold: 'Every materially affected product expectation is accurate, unambiguous, and durably recoverable.', evidence_expectation: 'Authoritative durable evidence sufficient to recover the affected product expectation and the basis for accepting it.', priority: 'required' }),
  Object.freeze({ id: 'interaction-expectations-remain-recoverable', applies_when: 'Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with how a person progresses through actions, states, feedback, navigation, or recovery.', must_hold: 'Every materially affected interaction expectation is coherent, complete enough to recover its decisions and states, and durably recoverable.', evidence_expectation: 'Authoritative durable evidence sufficient to recover the affected interaction expectation and its accepted state and response semantics.', priority: 'required' }),
  Object.freeze({ id: 'visual-language-remains-consistent', applies_when: 'Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable visual-language or presentation rule.', must_hold: 'Every materially affected visual expectation remains intentional, internally consistent, and durably recoverable.', evidence_expectation: 'Authoritative durable evidence sufficient to recover the affected visual expectation and its relationship to the project visual language.', priority: 'required' }),
  Object.freeze({ id: 'technical-decisions-remain-explainable', applies_when: 'Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable technical decision, structure, boundary, model, lifecycle, or constraint.', must_hold: 'Every materially affected technical decision remains coherent, explainable, and durably recoverable, including its rationale and affected relationships.', evidence_expectation: 'Authoritative durable evidence sufficient to recover the affected technical decision, rationale, constraints, and relationships.', priority: 'required' }),
  Object.freeze({ id: 'accepted-facts-are-realized', applies_when: 'Fresh Case facts or the selected Gap make a material claim about the actual software state relative to accepted durable expectations.', must_hold: 'The accepted software state realizes every materially relevant accepted fact and upheld Project decision and invariant.', evidence_expectation: 'Direct, traceable realization evidence sufficient to show that the actual software state conforms to the governing accepted facts.', priority: 'required' }),
  Object.freeze({ id: 'material-risks-have-credible-evidence', applies_when: 'Fresh Case facts or the selected Gap expose a material risk, alter its boundary, or claim that it is controlled.', must_hold: 'Every material risk claim accepted in the Case is supported by credible, repeatable, and proportionate evidence.', evidence_expectation: 'Repeatable, proportionate evidence sufficient to support the accepted risk claim and its scope.', priority: 'required' }),
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
