import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertCodexOutputSchema, codexOutputSchemaIssues } from "../src/codex-output-schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(here, "../schemas");

test("Codex model output schemas satisfy strict structured-output requirements", async () => {
  for (const filename of ["agent-loop-result.schema.json"]) {
    const schema = JSON.parse(await readFile(join(schemasDir, filename), "utf8"));
    assert.doesNotThrow(() => assertCodexOutputSchema(schema, { name: filename }));
  }
});

test("every Runtime schema const declares its type", async () => {
  for (const filename of (await readdir(schemasDir)).filter((name) => name.endsWith(".schema.json"))) {
    const schema = JSON.parse(await readFile(join(schemasDir, filename), "utf8"));
    assert.deepEqual(findUntypedConsts(schema), [], filename);
  }
});

test("Agent invariant judgment schema prevents Ledger-invalid disposition combinations", async () => {
  const schema = JSON.parse(await readFile(join(schemasDir, "agent-loop-result.schema.json"), "utf8"));
  assert.equal(schema.$defs.semantic_invariant_judgment.$ref, "#/$defs/invariant_judgment");
  const variants = schema.$defs.invariant_judgment.anyOf;
  const notRelevant = variants.find((item) => item.properties.disposition.const === "not_relevant");
  const upheld = variants.find((item) => item.properties.disposition.const === "upheld");
  const open = variants.find((item) => item.properties.disposition.enum?.includes("threatened"));

  assert.equal(notRelevant.properties.evidence.maxItems, 0);
  assert.equal(notRelevant.properties.gap_refs.maxItems, 0);
  assert.equal(upheld.properties.evidence.minItems, 1);
  assert.equal(upheld.properties.gap_refs.maxItems, 0);
  assert.equal(open.properties.fact_refs.minItems, 1);
  assert.equal(open.properties.gap_refs.minItems, 1);
});

test("Agent Project-gap change schema binds content to its action", async () => {
  const schema = JSON.parse(await readFile(join(schemasDir, "agent-loop-result.schema.json"), "utf8"));
  const variants = schema.$defs.semantic_project_gap_change.anyOf;
  const mutation = variants.find((item) => item.properties.action.enum?.includes("add"));
  const resolution = variants.find((item) => item.properties.action.const === "resolve");

  assert.equal(mutation.properties.gap.$ref, "#/$defs/semantic_project_gap");
  assert.equal(resolution.properties.gap.type, "null");
});

test("Codex output schema preflight reports the failures rejected by app-server", () => {
  const issues = codexOutputSchemaIssues({
    type: "object",
    properties: {
      schema_version: { const: "example/v1" },
      status: { enum: ["ok", "failed"] },
      values: { type: "array" },
      payload: { type: "object", properties: { value: { type: "string" } }, additionalProperties: true },
      nullable_payload: { type: ["object", "null"] }
    },
    required: ["schema_version", "values"],
    additionalProperties: false
  });
  assert.ok(issues.some((issue) => issue.includes("const or enum without an explicit type")));
  assert.ok(issues.some((issue) => issue.includes("array without items")));
  assert.ok(issues.some((issue) => issue.includes("additionalProperties to false")));
  assert.ok(issues.some((issue) => issue.includes("payload.properties.value must be listed in required")));
  assert.ok(issues.some((issue) => issue.includes("nullable_payload is an object without explicit properties")));
});

function findUntypedConsts(value, path = "$") {
  if (!value || typeof value !== "object") return [];
  const issues = Object.hasOwn(value, "const") && !Object.hasOwn(value, "type") ? [path] : [];
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") issues.push(...findUntypedConsts(child, `${path}.${key}`));
  }
  return issues;
}
