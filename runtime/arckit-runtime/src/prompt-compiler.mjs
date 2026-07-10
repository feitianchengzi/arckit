import { conversationLocaleInstruction } from "./conversation-locale.mjs";

export function compilePrompt(snapshot, round, options = {}) {
  const runtimeResultSchemaPath = "runtime/arckit-runtime/schemas/runtime-result.schema.json";
  const conversationLocale = options.conversationLocale || round.conversation_locale || "en";
  const prompt = [
    "# Arckit Supervised Runtime Turn",
    "",
    "You are executing one bounded Arckit runtime round. The runtime, not the agent, owns loop control.",
    "",
    "## Conversation Locale",
    `- conversation_locale: ${conversationLocale}`,
    `- ${conversationLocaleInstruction(conversationLocale)}`,
    "",
    "## Project State",
    `- Project: ${snapshot.summary.project_name}`,
    `- Current phase: ${snapshot.summary.current_phase}`,
    `- Loop focus: ${snapshot.summary.loop_focus}`,
    `- Next transition: ${snapshot.summary.next_transition}`,
    "",
    "## Runtime Selection Frame",
    "Runtime has not preselected the workflow strategy. Treat the following values as a neutral frame for agent analysis, not as a semantic decision.",
    `- Gap ID: ${round.gap_id}`,
    `- Dimension: ${round.dimension}`,
    `- Current state: ${round.current_state}`,
    `- Target state: ${round.target_state}`,
    `- Urgency: ${round.urgency}`,
    `- Risk: ${round.risk}`,
    `- Impact: ${round.impact}`,
    "",
    "## Candidate State Gaps",
    JSON.stringify(round.candidate_gaps || [], null, 2),
    "",
    "## Round Goal",
    round.round_goal,
    "",
    ...(options.task ? [
      "## Operator Task",
      options.task,
      ""
    ] : []),
    "## Required Context Refs",
    ...round.required_context_refs.map((ref) => `- ${ref}`),
    "",
    "## Required Checks",
    "- Read the project state before acting.",
    "- Decide the route, state target, and evidence requirements from the operator task, project state, candidate gaps, and local evidence.",
    "- Identify whether the turn changes source facts, projection artifacts, implementation evidence, pending context, or only runtime evidence.",
    "- Produce an artifact impact scan covering project, cases, spec, interaction, visual, tech, pending, workflow_memory, agent_context, and handoff.",
    "- Produce a Loop Handoff that separates next_responsibility from trigger_mode.",
    "- Do not close the round if the route, evidence, risks, unknowns, or required validation are missing.",
    "",
    "## Stop Conditions",
    ...round.stop_conditions.map((condition) => `- ${condition}`),
    "",
    "## Final Output Contract",
    `Return a JSON object matching ${runtimeResultSchemaPath}. Do not wrap it in Markdown.`,
    "",
    "## Runtime Options",
    `- max_rounds: ${round.max_rounds}`,
    `- adapter: ${options.adapter || "unspecified"}`
  ].join("\n");

  return {
    prompt,
    conversation_locale: conversationLocale,
    output_schema: runtimeResultSchemaPath,
    required_contracts: round.required_outputs
  };
}
