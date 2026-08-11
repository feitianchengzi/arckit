const CORE_DECISION_AREAS = Object.freeze([
  ['product_intent_and_scope', 'What problem does the software solve, for whom, with what success outcome and scope boundary?', 'State the project outcome, intended users, primary scenarios, success basis, and important non-goals.', 'Durable product evidence sufficient to recover the intended outcome and scope.'],
  ['product_capabilities', 'What core product capabilities must the software provide?', 'State the capability set, the problem each capability solves, and important capabilities intentionally excluded.', 'Durable product evidence sufficient to recover the capability decisions.'],
  ['runtime_surfaces', 'Which clients, applications, services, or runtime surfaces comprise the software?', 'State which desktop, web, mobile, server, admin, CLI, extension, or other surfaces exist and the responsibility of each.', 'Durable evidence sufficient to recover the system surfaces and their responsibilities.'],
  ['experience_and_interaction', 'How do users complete the main journeys and recover from interaction states?', 'State the important journeys, navigation, inputs, feedback, error recovery, and accessibility expectations.', 'Durable interaction evidence sufficient to understand and verify affected journeys.'],
  ['visual_language', 'What visual language and presentation adaptations does the software require?', 'State the theme, brand, layout, token, component, responsive, and platform-presentation expectations that matter.', 'Durable visual evidence sufficient to recover the project visual language.'],
  ['identity_and_access', 'Does the software require identity, login, roles, permissions, sessions, or entitlement?', 'State the identity subjects, authentication and authorization boundaries, entitlement behavior, and explicitly excluded access capabilities.', 'Durable product and technical evidence sufficient to recover access decisions.'],
  ['data_and_state', 'What data does the software own and how is it stored, synchronized, migrated, backed up, and recovered?', 'State the important data, sources of truth, local and remote relationships, lifecycle, consistency, migration, and recovery expectations.', 'Durable data and technical evidence sufficient to recover the state model.'],
  ['external_integrations', 'Which external platforms, devices, services, protocols, or data formats does the software integrate with?', 'State each material dependency, its boundary, failure behavior, and required fallback or recovery behavior.', 'Durable contract evidence sufficient to recover material integration boundaries.'],
  ['feedback_and_support', 'Does the software require user feedback, issue reporting, help, or support loops?', 'State the feedback entry, context collection, handling, status return, and support boundary, or explicitly decide that it is not required.', 'Durable product and operational evidence sufficient to recover the feedback decision.'],
  ['commercialization_and_entitlement', 'Does the software require payment, subscription, licensing, trials, quotas, or feature entitlement?', 'State the commercial and entitlement model, recovery rules, and intentionally excluded mechanisms.', 'Durable product and technical evidence sufficient to recover commercial and entitlement decisions.'],
  ['technical_foundation', 'Which technology stack, architecture shape, build system, and engineering organization does the software use?', 'State the languages, frameworks, build system, architecture boundaries, repository organization, and material technical constraints.', 'Durable technical evidence sufficient to recover the engineering foundation.'],
  ['security_privacy_compliance', 'What security, privacy, permission, and compliance responsibilities apply?', 'State sensitive data, credentials, trust boundaries, threats, privacy expectations, and applicable compliance requirements.', 'Durable risk and technical evidence sufficient to recover the governing protections.'],
  ['quality_and_validation', 'How must the project prove correct behavior and control regression risk?', 'State material quality risks, test layers, inspection, real-environment validation, and acceptance responsibility.', 'Durable validation evidence proportionate to the identified risks.'],
  ['delivery_and_distribution', 'How is the software built, released, installed, upgraded, and rolled back?', 'State target delivery platforms, build artifacts, release channels, version policy, upgrade behavior, and rollback expectations.', 'Durable delivery evidence sufficient to recover and verify the release model.'],
  ['observability_and_operation', 'How are runtime problems detected, diagnosed, supported, and recovered?', 'State logging, metrics, crashes, alerts, diagnostics, operational support, recovery, and retention expectations.', 'Durable operational evidence sufficient to diagnose and support the software.'],
]);

function area([id, question, decisionExpectation, evidenceExpectation]) {
  return {
    id,
    question,
    decision_expectation: decisionExpectation,
    evidence_expectation: evidenceExpectation,
    decision: {
      revision: 0,
      status: 'open',
      statement: '',
      reason: '',
      evidence: [],
      confidence: 'medium',
      resume_condition: '',
    },
    gap_refs: [],
  };
}

export function defaultSoftwareDefinition() {
  return {
    summary: '',
    decision_areas: CORE_DECISION_AREAS.map(area),
  };
}

export function coreDecisionAreaDefinitions() {
  return CORE_DECISION_AREAS.map(([id, question, decision_expectation, evidence_expectation]) => ({
    id, question, decision_expectation, evidence_expectation,
  }));
}

export function validateCoreDecisionAreas(record, file = '<record>') {
  const errors = [];
  const areas = record?.software_definition?.decision_areas;
  if (!Array.isArray(areas)) return [`${file}: software_definition.decision_areas must be an array`];
  for (const expected of coreDecisionAreaDefinitions()) {
    const actual = areas.find((item) => item?.id === expected.id);
    if (!actual) {
      errors.push(`${file}: software_definition.decision_areas must include core decision area ${expected.id}`);
      continue;
    }
    for (const key of ['question', 'decision_expectation', 'evidence_expectation']) {
      if (actual[key] !== expected[key]) errors.push(`${file}: core decision area ${expected.id}.${key} must match the current protocol definition exactly`);
    }
  }
  return errors;
}

