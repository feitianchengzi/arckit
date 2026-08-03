import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertCodexOutputSchema, codexOutputSchemaIssues } from "../src/codex-output-schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(here, "../schemas");

test("Codex model output schemas satisfy strict structured-output requirements", async () => {
  for (const filename of ["controller-plan.schema.json", "controller-review.schema.json", "worker-report.schema.json"]) {
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

test("Codex output schema preflight reports the failures rejected by app-server", () => {
  const issues = codexOutputSchemaIssues({
    type: "object",
    properties: {
      schema_version: { const: "example/v1" },
      values: { type: "array" },
      payload: { type: "object", properties: { value: { type: "string" } }, additionalProperties: true }
    },
    required: ["schema_version", "values"],
    additionalProperties: false
  });
  assert.ok(issues.some((issue) => issue.includes("const without an explicit type")));
  assert.ok(issues.some((issue) => issue.includes("array without items")));
  assert.ok(issues.some((issue) => issue.includes("additionalProperties to false")));
  assert.ok(issues.some((issue) => issue.includes("payload.properties.value must be listed in required")));
});

function findUntypedConsts(value, path = "$") {
  if (!value || typeof value !== "object") return [];
  const issues = Object.hasOwn(value, "const") && !Object.hasOwn(value, "type") ? [path] : [];
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") issues.push(...findUntypedConsts(child, `${path}.${key}`));
  }
  return issues;
}
