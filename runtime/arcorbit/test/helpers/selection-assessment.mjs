// Explicit test declarations, not production defaults or inferred artifact roles.
export function selectionAssessment(overrides = {}) {
  return {
    context_ref: null,
    scope: 'Bounded ledger protocol fixture.',
    maintenance_object: 'Fixture Case state.',
    implementation_carriers: [],
    activation: 'Accept the fixture transition through the trusted ledger.',
    verification: 'Assert canonical state and accepted receipt.',
    conclusion_kind: 'establishment',
    invariant_refs: [],
    acceptance: ['The fixture state claim is accepted without losing obligations.'],
    prerequisites: [],
    expected_fact_refs: [],
    establishes_expectations: false,
    delivers_realization: false,
    boundary_reason: 'This fixture checks a control claim, not formal software delivery.',
    deferred: [],
    ...overrides,
  };
}
