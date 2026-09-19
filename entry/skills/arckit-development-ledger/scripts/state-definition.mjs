import fs from 'node:fs';
import { createHash } from 'node:crypto';

const definitionUrl = new URL('../templates/software-state-definition.json', import.meta.url);

// The trusted adapter owns this resource. No project-controlled code or routing is loaded.
export function readStateDefinition() {
  const raw = fs.readFileSync(definitionUrl, 'utf8');
  const definition = JSON.parse(raw);
  if (definition.schema_version !== 'arckit-state-definition/v1'
    || !definition.id || !Number.isInteger(definition.revision)
    || !definition.fact_types || !definition.invariant_source || !definition.decision_source
    || ['implementation_guidance', 'selection_rules', 'completion_rules'].some((key) =>
      !Array.isArray(definition[key]) || !definition[key].length
      || definition[key].some((item) => typeof item !== 'string' || !item.trim()))) {
    throw new Error('Trusted State definition is invalid.');
  }
  return { definition, digest: createHash('sha256').update(raw).digest('hex') };
}
