export function compilePrompt(snapshot, round, options = {}) {
  const runtimeResultSchemaPath = "runtime/arcorbit/schemas/runtime-result.schema.json";
  const conversationLocale = options.conversationLocale || round.conversation_locale || "en";
  const operatorInput = String(options.task || "");

  return {
    // Compatibility field for the CLI `prompt` command. Agentic orchestration
    // compiles its phase inputs separately and never sends this value directly.
    prompt: operatorInput,
    operator_input: operatorInput,
    conversation_locale: conversationLocale,
    output_schema: runtimeResultSchemaPath,
    required_contracts: round.required_outputs,
    context_refs: round.required_context_refs || []
  };
}
