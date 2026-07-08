export function createDryRunResult(snapshot, round, compiledPrompt) {
  return {
    schema_version: "arckit-runtime-result/v1",
    round_result: "blocked",
    summary: "Dry run generated a controlled prompt and did not execute an agent turn.",
    changed_files: [],
    artifact_impact_scan: {
      project: "read",
      intake: "none",
      cases: "none",
      spec: "none",
      interaction: "none",
      visual: "none",
      tech: "none",
      debug: "none",
      pending: "none",
      workflow_memory: "none",
      agent_context: "none",
      handoff: "generated"
    },
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: false,
      deferred_projections: [],
      blocked_projections: []
    },
    validation_evidence: [
      snapshot.paths.projectState,
      compiledPrompt.output_schema
    ],
    loop_handoff: {
      version: "loop-handoff/v1",
      status: "continue",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "manual_bridge",
      responsibility_reason: "Dry run produced the next supervised agent instruction; no human decision is needed to execute it.",
      next_prompt: compiledPrompt.prompt,
      agent_instruction: {
        goal: round.round_goal,
        required_context_refs: round.required_context_refs,
        required_actions: [
          "Execute the compiled Arckit supervised runtime turn.",
          "Return a runtime result matching the schema."
        ],
        required_checks: [
          "artifact_impact_scan",
          "source_projection_check",
          "loop_handoff"
        ],
        stop_condition: round.stop_conditions.join(" ")
      },
      human_gate: {
        required: false,
        reason: "",
        decision_needed: ""
      },
      progress_guard: {
        expected_state_change: round.round_goal,
        actual_state_change: "No state change in dry-run mode.",
        no_progress_limit: 1,
        max_auto_rounds: 1
      }
    }
  };
}
