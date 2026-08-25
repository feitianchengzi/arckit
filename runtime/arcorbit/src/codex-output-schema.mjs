export function codexOutputSchemaIssues(schema, { name = "outputSchema" } = {}) {
  const issues = [];
  visitSchema(schema, name, issues);
  return issues;
}

export function assertCodexOutputSchema(schema, options = {}) {
  const issues = codexOutputSchemaIssues(schema, options);
  if (issues.length > 0) {
    throw new Error(`Invalid Codex outputSchema:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
  }
  return schema;
}

function visitSchema(schema, path, issues) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    issues.push(`${path} must be a JSON Schema object.`);
    return;
  }
  if (typeof schema.$ref === "string") return;

  if ((Object.hasOwn(schema, "const") || Object.hasOwn(schema, "enum")) && !Object.hasOwn(schema, "type")) {
    issues.push(`${path} uses const or enum without an explicit type.`);
  }
  if (Array.isArray(schema.oneOf)) {
    issues.push(`${path} uses oneOf, which Codex strict output schemas do not permit; use supported anyOf branches instead.`);
  }

  const types = new Set(Array.isArray(schema.type) ? schema.type : [schema.type].filter(Boolean));
  if (types.has("object")) {
    const properties = schema.properties;
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
      issues.push(`${path} is an object without explicit properties.`);
    } else {
      if (schema.additionalProperties !== false) {
        issues.push(`${path} must set additionalProperties to false.`);
      }
      const required = new Set(Array.isArray(schema.required) ? schema.required : []);
      for (const key of Object.keys(properties)) {
        if (!required.has(key)) issues.push(`${path}.properties.${key} must be listed in required.`);
      }
      for (const [key, child] of Object.entries(properties)) {
        visitSchema(child, `${path}.properties.${key}`, issues);
      }
    }
  }

  if (types.has("array")) {
    if (!schema.items) issues.push(`${path} is an array without items.`);
    else visitSchema(schema.items, `${path}.items`, issues);
  }

  for (const keyword of ["anyOf", "allOf", "oneOf"]) {
    if (!Array.isArray(schema[keyword])) continue;
    schema[keyword].forEach((child, index) => visitSchema(child, `${path}.${keyword}[${index}]`, issues));
  }
  if (schema.$defs && typeof schema.$defs === "object") {
    for (const [key, child] of Object.entries(schema.$defs)) {
      visitSchema(child, `${path}.$defs.${key}`, issues);
    }
  }
}
