import { readFile } from "node:fs/promises";
import { resolveCapabilityContract, runtimeCapabilityForEntrypoint } from "./capability-registry.mjs";
import { assertCodexOutputSchema } from "./codex-output-schema.mjs";

export async function loadAgentOutputSchema(capabilities) {
  const envelope = JSON.parse(await readFile(new URL('../schemas/agent-loop-result.schema.json', import.meta.url), 'utf8'));
  return composeAgentOutputSchema(envelope, capabilities);
}

// The Host owns the result envelope. The trusted capability owns its payloads.
// Composition namespaces definitions and leaves semantic policy in the package.
export async function composeAgentOutputSchema(envelope, capabilities) {
  const result = structuredClone(envelope);
  result.$defs ||= {};
  const names = new Set();
  visit(result, (node) => {
    if (node.$ref?.startsWith("arckit-contract:")) names.add(node.$ref.slice("arckit-contract:".length));
  });
  if (!names.size) return assertCodexOutputSchema(result);
  const capability = runtimeCapabilityForEntrypoint(capabilities, "writeback");
  for (const name of names) {
    const contract = resolveCapabilityContract(capability, name);
    const catalog = JSON.parse(await readFile(contract.schema_path, "utf8"));
    const schema = contract.definition ? structuredClone(catalog.$defs?.[contract.definition]) : structuredClone(catalog);
    if (!schema) throw new Error(`Missing root definition for Agent contract ${name}: ${contract.definition}`);
    const declaredVersion = schema.properties?.schema_version?.const;
    if (declaredVersion && declaredVersion !== contract.schema_version) throw new Error(`Agent contract version mismatch: ${name}`);
    const definitions = {};
    const collect = (value) => visit(value, (node) => {
      if (!node.$ref?.startsWith("#/$defs/")) return;
      const key = node.$ref.slice(8);
      if (Object.hasOwn(definitions, key)) return;
      if (!catalog.$defs?.[key]) throw new Error(`Missing definition in Agent contract ${name}: ${key}`);
      definitions[key] = structuredClone(catalog.$defs[key]); collect(definitions[key]);
    });
    collect(schema);
    const prefix = `ledger_${name}__`;
    delete schema.$defs;
    delete schema.$id;
    delete schema.$schema;
    visit({ schema, definitions }, (node) => {
      if (!node.$ref) return;
      if (!node.$ref.startsWith("#/$defs/")) throw new Error(`Unsupported external reference in Agent contract ${name}: ${node.$ref}`);
      const key = node.$ref.slice(8);
      if (!Object.hasOwn(definitions, key)) throw new Error(`Missing definition in Agent contract ${name}: ${key}`);
      node.$ref = `#/$defs/${prefix}${key}`;
    });
    const rootKey = `${prefix}root`;
    for (const [key, definition] of Object.entries({ ...definitions, root: schema })) {
      if (Object.hasOwn(result.$defs, `${prefix}${key}`)) throw new Error(`Agent contract definition collision: ${prefix}${key}`);
      result.$defs[`${prefix}${key}`] = definition;
    }
    visit(result, (node) => {
      if (node.$ref === `arckit-contract:${name}`) node.$ref = `#/$defs/${rootKey}`;
    });
  }
  return assertCodexOutputSchema(result);
}

export function agentContractBindings(capabilities) {
  const capability = runtimeCapabilityForEntrypoint(capabilities, "writeback");
  return {
    capability_id: capability.id,
    protocol_revision: capability.protocol_revision,
    contracts: Object.fromEntries(Object.keys(capability.agent_contracts).map((name) => [name, resolveCapabilityContract(capability, name)]))
  };
}

function visit(value, callback) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value)) callback(value);
  for (const child of Object.values(value)) visit(child, callback);
}
