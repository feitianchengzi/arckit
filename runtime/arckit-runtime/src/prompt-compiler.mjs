import { conversationLocaleInstruction } from "./conversation-locale.mjs";
import { safeSemanticText, SEMANTIC_LIMITS } from "./context-boundary.mjs";

export function compilePrompt(snapshot, round, options = {}) {
  const runtimeResultSchemaPath = "runtime/arckit-runtime/schemas/runtime-result.schema.json";
  const conversationLocale = options.conversationLocale || round.conversation_locale || "en";
  const nextCaseIntent = safeSemanticText(snapshot.summary.next_case_intent, { maxLength: SEMANTIC_LIMITS.transition });
  const roundGoal = safeSemanticText(round.round_goal, { maxLength: SEMANTIC_LIMITS.goal })
    || "Controller must derive the round goal from the operator task, project state, candidate gaps, and local evidence.";
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
    `- Selected Case: ${snapshot.summary.selected_case_ref || "Controller must select a Case"}`,
    `- Next Case intent: ${nextCaseIntent || "Inspect Project and Case State."}`,
    "",
    "## Runtime Selection Frame",
    "Runtime has not preselected the workflow strategy. Treat the following values as a neutral frame for agent analysis, not as a semantic decision.",
    `- Gap ID: ${round.gap_id}`,
    `- Scope: ${round.scope}`,
    `- Case: ${round.case_id || "not selected"}`,
    `- Facet: ${round.facet || "not selected"}`,
    `- Current state: ${round.current_state}`,
    `- Target state: ${round.target_state}`,
    `- Impact: ${round.impact}`,
    "",
    "## Candidate Cases",
    JSON.stringify(round.candidate_cases || [], null, 2),
    "",
    "## Selected Case Candidate Gaps (unordered)",
    JSON.stringify(round.candidate_case_gaps || [], null, 2),
    "",
    "## Candidate Project Gaps (Case selection context only)",
    JSON.stringify(round.candidate_project_gaps || [], null, 2),
    "",
    "## Round Goal",
    roundGoal,
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
    "- Read Project State and the full selected Case State before acting.",
    "- Select one bounded Case gap and state the planned Case transition before dispatch.",
    "- Identify whether the turn changes source facts, projection artifacts, implementation evidence, pending context, or only runtime evidence.",
    "- Produce an artifact impact scan covering project, cases, spec, interaction, visual, tech, debug, pending, and handoff.",
    "- Produce round_outcome, case_outcome, project_impact, case_transition, and Loop Handoff as separate semantics.",
    "- Do not close the round if the route, evidence, risks, unknowns, or required validation are missing.",
    "",
    "## Stop Conditions",
    ...round.stop_conditions.map((condition) => `- ${condition}`),
    "",
    "## Final Output Contract",
    `Return a JSON object matching ${runtimeResultSchemaPath}. Do not wrap it in Markdown.`,
    "",
    "## Runtime Options",
    `- max_auto_rounds: ${round.max_auto_rounds}`,
    `- adapter: ${options.adapter || "unspecified"}`
  ].join("\n");

  return {
    prompt,
    conversation_locale: conversationLocale,
    output_schema: runtimeResultSchemaPath,
    required_contracts: round.required_outputs
  };
}
