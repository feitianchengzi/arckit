import fs from 'node:fs';

// Load data only: identities, count, applicability and meaning belong to the template.
// Callers must assess the current Project snapshot, not infer semantics from array order.
const templateUrl = new URL('../templates/software-invariants.json', import.meta.url);
export const CORE_SOFTWARE_INVARIANTS = Object.freeze(
  JSON.parse(fs.readFileSync(templateUrl, 'utf8')).map((item) => Object.freeze(item)),
);

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
