import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentAdapter } from "./agent-adapter.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import {
  agentSkillInvocationForPhase,
  capabilitiesForBinding,
  capabilityIds,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  resolveCapabilityEntrypoint
} from "./capability-registry.mjs";
import {
  buildArtifactOwnershipScan,
  createArtifactImpactScan,
  normalizeArtifactPathReferences
} from "./artifact-ownership-map.mjs";
import { createCaseControlRuntimeResult } from "./kernel/runtime-result-builder.mjs";
import { firstSafeSemanticText, safeSemanticText, SEMANTIC_LIMITS } from "./context-boundary.mjs";
import { endLifecycleSpan, startLifecycleSpan } from "./observability/lifecycle-trace.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const agentLoopResultSchemaPath = join(here, "../schemas/agent-loop-result.schema.json");

export async function runAgenticLoop(input) {
  const options = input.options || {};
  const span = startLifecycleSpan(options, {
    name: "runtime.agentic_loop",
    category: "runtime",
    cost_center: "orchestration",
    attributes: { round_index: options.lifecycleRoundIndex || input.round?.round_index || 0 }
  });
  try {
    const result = await runCoherentAgentLoop({
      ...input,
      options: {
        ...options,
        lifecycleParentSpanId: span?.span_id || options.lifecycleParentSpanId,
        lifecycleCostCenter: "orchestration"
      }
    });
    endLifecycleSpan(options, span, { status: "ok", attributes: { round_result: result.runtimeResult?.round_result || "" } });
    return result;
  } catch (error) {
    endLifecycleSpan(options, span, { status: "error", error });
    throw error;
  }
}

async function runCoherentAgentLoop({ projectRoot, snapshot, round, compiledPrompt, options = {} }) {
  const conversationLocale = options.conversationLocale || compiledPrompt.conversation_locale || round.conversation_locale || "en";
  round.conversation_locale = conversationLocale;
  const capabilityPolicy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ projectRoot, capabilityPolicy });
  const controllerCapabilities = capabilitiesForBinding(capabilities, capabilityPolicy, "controller");
  const runtimeCapabilities = capabilitiesForBinding(capabilities, capabilityPolicy, "runtime");
  const adapter = options.agentAdapter || createAgentAdapter(options.dryRun ? "dry-run" : options.adapter || "codex-app-server", options);
  const outputSchema = JSON.parse(await readFile(agentLoopResultSchemaPath, "utf8"));
  const loopFrame = createLoopFrame({ snapshot, round, task: options.task || "", controllerCapabilities, runtimeCapabilities, options });
  const prompt = compileCoherentAgentLoopPrompt({ snapshot, loopFrame, round, options, controllerCapabilities });
  const events = [];
  let agentLoopResult = null;
  emit(events, {
    type: "runtime.agent_loop.started",
    round_index: options.lifecycleRoundIndex || round.round_index || 0,
    thread_key: coherentAgentThreadKey(options),
    active_case_count: snapshot.activeCases?.length || 0
  }, options);
  for await (const event of adapter.runTurn({
    projectRoot,
    prompt,
    options: {
      ...options,
      threadKey: coherentAgentThreadKey(options),
      outputSchema,
      resultKind: "agent-loop-result",
      lifecycleCostCenter: "task_execution"
    }
  })) {
    events.push(event);
    if (options.streamEvents) console.error(JSON.stringify({ event }));
    if (event.type === "runtime.agent_loop_result") agentLoopResult = normalizeAgentLoopResult(event.result);
  }
  if (!agentLoopResult) agentLoopResult = invalidAgentLoopResult("Codex Agent completed without returning arckit-agent-loop-result/v2.");
  const issue = agentLoopResultFailureReason(agentLoopResult, snapshot);
  if (issue) agentLoopResult = invalidAgentLoopResult(issue);
  emit(events, {
    type: "runtime.agent_loop.completed",
    action: agentLoopResult.action,
    summary: agentLoopResult.summary,
    case_id: agentLoopResult.case_command?.case_id || agentLoopResult.case_transition?.case_id || ""
  }, options);
  const runtimeResult = await createRuntimeResultFromAgentLoop({ agentLoopResult, loopFrame, round, snapshot, compiledPrompt });
  const validation = validateRuntimeResult(runtimeResult);
  emit(events, { type: "runtime.result", result: runtimeResult, validation }, options);
  return {
    adapter,
    loopFrame,
    events,
    runtimeResult,
    validation,
    agentLoopResult
  };
}

export function compileCoherentAgentLoopPrompt({ snapshot, loopFrame, round, options = {}, controllerCapabilities = [] }) {
  const invocation = agentSkillInvocationForPhase(controllerCapabilities, "agent_loop");
  const firstTurn = Number(options.lifecycleRoundIndex || 1) === 1;
  const protocolRecovery = snapshot?.compatibility?.status === "incompatible";
  return [invocation.skill_trigger, "", JSON.stringify({
    schema_version: "arckit-agent-loop-invocation/v1",
    phase: "agent_loop",
    conversation_locale: options.conversationLocale || round.conversation_locale || "en",
    original_user_input: firstTurn ? options.originalTask || options.task || "" : "",
    current_instruction: options.task || "",
    conversation_contract: {
      user_visible_commentary: {
        required: true,
        message_channel: "commentary",
        item_identity: "Preserve every commentary message as its own Codex agentMessage item; do not merge commentary by turn.",
        cadence: "When tools are needed, explain the immediate goal before the first tool call and add concise updates at meaningful phase boundaries, after material findings or decisions, and before the structured final result.",
        content: "State user-readable progress, discoveries, judgments, decision basis, and the next action. Write original analysis summaries rather than fixed Runtime status text."
      },
      final_result: {
        channel: "final",
        output_schema_required: true,
        separation: "Return the schema-bound Agent Loop result as the final machine contract; do not paste its JSON into commentary."
      },
      reasoning_visibility: "Do not expose hidden chain-of-thought. A reasoning message is displayable only when Codex provides a non-empty reasoning summary; reasoning token counts alone are not displayable text.",
      automation_projection: "Loop, Case, Gap, ledger, validation, receipts, and structured JSON belong to Automation side panels, while user, Agent commentary/result, non-empty reasoning summaries, tools, approvals, and errors belong to the conversation timeline."
    },
    canonical_context: createControllerContextDigest({ snapshot, loopFrame }),
    execution_authorization: {
      status: loopFrame.execution_gate.status,
      executor: loopFrame.executor_binding.executor,
      workspace_root: snapshot.projectRoot || "",
      trusted_protocol_recovery: loopFrame.protocol_recovery,
      trusted_ledger_snapshot: loopFrame.ledger_snapshot
    },
    loop_contract: {
      one_gap: !protocolRecovery,
      one_acceptance_claim: !protocolRecovery,
      execute_in_current_turn: true,
      fresh_gap_selection: !protocolRecovery,
      future_gap_preplanning: false,
      newly_discovered_work_must_wait_for_post_commit_fresh_read: !protocolRecovery,
      complete_project_invariant_assessment_required: !protocolRecovery,
      invariant_assessment_is_semantic_agent_work: true,
      invariant_judgment_contract: {
        not_relevant: "reason required; evidence=[]; gap_refs=[]",
        upheld: "persistent evidence required; gap_refs=[]",
        threatened_or_undetermined: "accepted fact_refs and open gap_refs required"
      },
      semantic_case_command_contract: {
        agent_owns: ["fact and gap meaning", "impact target and effect", "Project decision intent", "invariant disposition and explicit relations"],
        ledger_owns: ["canonical ids", "Case and Project revisions", "selected candidate rehydration", "reverse relation projection", "internal transition", "atomic commit receipt"],
        typed_refs: ["local:fact:<handle>", "local:gap:<handle>", "local:impact:<handle>", "case:fact:<id>", "case:gap:<id>", "case:impact:<id>", "project:decision:<id>", "project:invariant:<id>", "project:project-gap:<id>", "system:<source>"],
        forbidden_agent_bookkeeping: ["new canonical ids", "fact or decision revisions", "Case updated_at", "selected Gap copies", "decision gap_refs reverse indexes", "arckit-case-transition/v8"]
      },
      completion_review_is_only_semantic_self_check: true,
      native_skill_discovery: true,
      ledger_write_forbidden: true,
      ordinary_ledger_write_forbidden: true,
      protocol_recovery: protocolRecovery,
      ordinary_case_progress_forbidden: protocolRecovery,
      trusted_protocol_reconciliation_allowed: protocolRecovery,
      snapshot_bound_selection: !protocolRecovery,
      persisted_candidate_comparison_required: !protocolRecovery,
      round_closeout_is_ledger_receipt: true,
      post_write_snapshot_required: true,
      valid_actions: protocolRecovery ? ["handoff"] : ["case_control", "case_command", "handoff"]
    }
  }, null, 2)].join("\n");
}

export function coherentAgentThreadKey(options = {}) {
  const identity = String(options.taskId || options.lifecycleRunId || "active-session").trim();
  return `agent-loop:${identity || "active-session"}`;
}

export function createLoopFrame({ snapshot, round, task, controllerCapabilities = [], runtimeCapabilities = [], options = {} }) {
  const roundGoal = firstSafeSemanticText([task, round.round_goal, round.next_transition], { maxLength: SEMANTIC_LIMITS.goal })
    || "Select and advance one evidence-backed Case gap.";
  const selectedGap = {
    id: round.gap_id || "",
    scope: round.scope || "case",
    case_id: round.case_id || "",
    responsibility: round.responsibility || "agent",
    goal: roundGoal,
    reason: safeSemanticText(round.impact || "", { maxLength: SEMANTIC_LIMITS.reason }),
    derived_from: [],
    blocked_by: [],
    priority_basis: {},
    evidence_required: []
  };
  const protocolRecovery = protocolRecoveryBinding(snapshot, runtimeCapabilities);
  const ledgerSnapshot = ledgerSnapshotBinding(snapshot, runtimeCapabilities);
  return {
    schema_version: "arckit-loop-frame/v1",
    case_id: round.case_id || "",
    case_updated_at: round.case_updated_at || "",
    project_revision: Number(snapshot.projectState?.project?.revision || 0),
    project_name: snapshot.summary?.project_name || "",
    project_root: snapshot.projectRoot || "",
    operator_task: task,
    runtime_context: options.runtimeContext || null,
    protocol_recovery: protocolRecovery,
    ledger_snapshot: ledgerSnapshot,
    round_goal: roundGoal,
    conversation_locale: options.conversationLocale || round.conversation_locale || "en",
    controller_frame: {
      schema_version: "arckit-controller-frame/v1",
      case_id: round.case_id || "",
      round_goal: roundGoal,
      round_status: "agent_loop",
      selected_gap: selectedGap,
      source_projection_check: {
        source_facts_changed: [], projection_artifacts_changed: [], implementation_evidence: [], pending_items: [], source_unknown: false
      }
    },
    execution_gate: {
      schema_version: "arckit-execution-gate/v1",
      status: options.dryRun ? "pending" : "authorized",
      required_decision: options.dryRun ? "Execution authorization is required." : "Current Runtime run is authorized.",
      allowed_executors: ["desktop_runtime", "current_agent"],
      executor_binding_required: true
    },
    executor_binding: {
      schema_version: "arckit-executor-binding/v1",
      executor: options.dryRun ? "none" : "desktop_runtime",
      authorization_source: options.dryRun ? "none" : "desktop_run",
      reason: options.dryRun ? "Dry-run does not execute an Agent turn." : "The operator started an executing Runtime run."
    },
    selected_gap: selectedGap,
    capability_bindings: {
      schema_version: "arckit-capability-bindings/v1",
      controller_capability_ids: [...capabilityIds(controllerCapabilities)],
      runtime_capability_ids: [...capabilityIds(runtimeCapabilities)]
    },
    stop_conditions: round.stop_conditions || [],
    case_control: round.case_control || {},
    candidate_cases: round.candidate_cases || [],
    candidate_case_gaps: round.candidate_case_gaps || [],
    candidate_catalog: snapshot.candidateCatalog || { persisted_candidates: [], persisted_obligations: [] }
  };
}

export function createControllerContextDigest({ snapshot, loopFrame }) {
  const projectState = snapshot?.projectState || {};
  const activeCases = (snapshot?.activeCases || []).map(summarizeCase);
  return {
    schema_version: "arckit-controller-context-digest/v1",
    authority: "current_operator_input_and_canonical_digest_supersede_thread_history",
    phase: "agent_loop",
    state_availability: snapshot?.stateAvailability || "available",
    protocol_compatibility: snapshot?.compatibility || null,
    protocol_recovery: loopFrame?.protocol_recovery || null,
    ledger_snapshot: snapshot?.ledgerSnapshot ? {
      schema_version: snapshot.ledgerSnapshot.schema_version,
      observed_at: snapshot.ledgerSnapshot.observed_at,
      snapshot_token: snapshot.ledgerSnapshot.snapshot_token,
      selection_tokens: snapshot.ledgerSnapshot.selection_tokens || {},
      observed_after_commit: snapshot.ledgerSnapshot.observed_after_commit,
      project_revision: snapshot.ledgerSnapshot.project_revision,
      case_revisions: snapshot.ledgerSnapshot.case_revisions,
    } : null,
    candidate_catalog: snapshot?.candidateCatalog || { persisted_candidates: [], persisted_obligations: [] },
    project: {
      name: safeSemanticText(snapshot?.summary?.project_name || projectState?.project?.name || "", { maxLength: 240 }),
      phase: safeSemanticText(snapshot?.summary?.current_phase || "", { maxLength: 240 }),
      revision: Number(projectState?.project?.revision || loopFrame?.project_revision || 0),
      advancement: {
        current_focus: safeSemanticText(projectState?.advancement?.selection_context?.current_focus || "", { maxLength: SEMANTIC_LIMITS.transition }),
        project_priorities: strings(projectState?.advancement?.selection_context?.project_priorities),
      },
      project_gaps: (projectState?.advancement?.project_gaps || []).map((gap) => ({
        id: String(gap?.id || ""),
        goal: safeSemanticText(gap?.goal || "", { maxLength: SEMANTIC_LIMITS.goal }),
        reason: safeSemanticText(gap?.reason || "", { maxLength: SEMANTIC_LIMITS.reason }),
        affects: Array.isArray(gap?.affects) ? gap.affects : [],
        priority_basis: object(gap?.priority_basis) ? gap.priority_basis : {},
        dependencies: strings(gap?.dependencies),
        candidate_case_ref: String(gap?.candidate_case_ref || "")
      })),
      software_definition: (projectState?.software_definition?.decision_areas || []).map((area) => ({
        id: String(area.id || ""), question: safeSemanticText(area.question || "", { maxLength: SEMANTIC_LIMITS.reason }),
        decision_expectation: safeSemanticText(area.decision_expectation || "", { maxLength: SEMANTIC_LIMITS.reason }),
        evidence_expectation: safeSemanticText(area.evidence_expectation || "", { maxLength: SEMANTIC_LIMITS.reason }),
        decision: area.decision || {}, gap_refs: strings(area.gap_refs)
      })),
      software_invariants: (projectState?.software_invariants || []).map((invariant) => ({
        id: String(invariant.id || ""), applies_when: safeSemanticText(invariant.applies_when || "", { maxLength: SEMANTIC_LIMITS.reason }),
        must_hold: safeSemanticText(invariant.must_hold || "", { maxLength: SEMANTIC_LIMITS.reason }),
        evidence_expectation: safeSemanticText(invariant.evidence_expectation || "", { maxLength: SEMANTIC_LIMITS.reason }), priority: String(invariant.priority || "required")
      }))
    },
    selected_case_id: String(loopFrame?.case_id || ""),
    active_cases: activeCases,
    context_refs: unique([
      snapshot?.paths?.projectState,
      snapshot?.paths?.activeIteration,
      ...activeCases.map((item) => item.ref),
      ...(snapshot?.compatibility?.affected_refs || [])
    ]).slice(0, 32)
  };
}

function protocolRecoveryBinding(snapshot, runtimeCapabilities) {
  if (snapshot?.compatibility?.status !== "incompatible") return null;
  const capability = runtimeCapabilities.find((item) => typeof item?.runtime_entrypoints?.protocol_compatibility === "string");
  if (!capability) return {
    authorized: false,
    entrypoint: "",
    contract_refs: [],
    allowed_commands: []
  };
  const entrypoint = resolveCapabilityEntrypoint(capability, "protocol_compatibility");
  return {
    authorized: true,
    capability_id: capability.id,
    entrypoint,
    contract_refs: [
      join(capability.capability_root, "schema/protocol-reconciliation.schema.json"),
      join(capability.capability_root, "references/protocol-reconciliation.md")
    ],
    allowed_commands: ["probe", "validate", "reconcile"]
  };
}

function ledgerSnapshotBinding(snapshot, runtimeCapabilities) {
  const capability = runtimeCapabilities.find((item) => typeof item?.runtime_entrypoints?.loop_snapshot === "string");
  if (!capability) return { authorized: false, capability_id: "", entrypoint: "", snapshot_token: "", allowed_commands: [] };
  return {
    authorized: true,
    capability_id: capability.id,
    entrypoint: resolveCapabilityEntrypoint(capability, "loop_snapshot"),
    snapshot_token: snapshot?.snapshotToken || "",
    selection_tokens: snapshot?.ledgerSnapshot?.selection_tokens || {},
    contract_refs: [join(capability.capability_root, "schema/ledger-snapshot.schema.json")],
    allowed_commands: ["read"]
  };
}

function summarizeCase(item) {
  const record = item?.record || {};
  if (record.schema_version !== "development-case-record/v5") {
    throw new Error(`Unsupported Case State schema: ${record.schema_version || "<missing>"}; expected development-case-record/v5`);
  }
  return {
    schema_version: String(record.schema_version || ""),
    ref: String(item?.ref || ""),
    case_id: String(record.id || ""),
    title: safeSemanticText(record.title || "", { maxLength: 240 }),
    status: String(record.status || ""),
    artifact_type: String(record.artifact_type || "unknown"),
    updated_at: String(record.updated_at || ""),
    user_intent: safeSemanticText(record.user_intent || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    expected_outcome: safeSemanticText(record.expected_outcome || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    content_revision: Number(record.content_revision || 0),
    facts: (record.facts || []).map((fact) => ({ id: String(fact.id || ""), revision: Number(fact.revision || 0), status: String(fact.status || ""), statement: safeSemanticText(fact.statement || "", { maxLength: SEMANTIC_LIMITS.contextSummary }), basis: safeSemanticText(fact.basis || "", { maxLength: SEMANTIC_LIMITS.reason }), evidence: strings(fact.evidence).slice(-8) })),
    state_impacts: (record.state_impacts || []).map((impact) => ({ id: String(impact.id || ""), fact_id: String(impact.fact_id || ""), fact_revision: Number(impact.fact_revision || 0), target: impact.target || {}, effect: String(impact.effect || ""), reason: safeSemanticText(impact.reason || "", { maxLength: SEMANTIC_LIMITS.reason }), gap_ids: strings(impact.gap_ids), evidence: strings(impact.evidence).slice(-8) })),
    gaps: (record.gaps || []).map((gap) => ({ id: String(gap.id || ""), status: String(gap.status || ""), goal: safeSemanticText(gap.goal || "", { maxLength: SEMANTIC_LIMITS.goal }), reason: safeSemanticText(gap.reason || "", { maxLength: SEMANTIC_LIMITS.reason }), derived_from: strings(gap.derived_from), blocked_by: strings(gap.blocked_by), priority_basis: object(gap.priority_basis) ? gap.priority_basis : {}, responsibility: String(gap.responsibility || "agent"), evidence_required: strings(gap.evidence_required), resolution: objectOrNull(gap.resolution) })),
    case_resolution: {
      status: String(record.case_resolution?.status || "unresolved"),
      stage: String(record.case_resolution?.stage || "working"),
      remaining: strings(record.case_resolution?.remaining),
      candidate_gaps: (record.case_resolution?.candidate_gaps || []).map((gap) => ({ id: String(gap?.id || ""), responsibility: String(gap?.responsibility || "agent"), goal: safeSemanticText(gap?.goal || "", { maxLength: SEMANTIC_LIMITS.goal }), reason: safeSemanticText(gap?.reason || "", { maxLength: SEMANTIC_LIMITS.reason }), derived_from: strings(gap?.derived_from), blocked_by: strings(gap?.blocked_by), priority_basis: object(gap?.priority_basis) ? gap.priority_basis : {}, evidence_required: strings(gap?.evidence_required).slice(0, 8) }))
    },
    completion_review: {
      status: String(record.completion_review?.status || "pending"),
      reviewed_content_revision: record.completion_review?.reviewed_content_revision ?? null,
      cycle_count: Number(record.completion_review?.cycle_count || 0),
      open_findings: (record.completion_review?.findings || []).filter((finding) => finding?.status === "open").map((finding) => ({
        id: String(finding.id || ""), kind: String(finding.kind || ""),
        statement: safeSemanticText(finding.statement || "", { maxLength: SEMANTIC_LIMITS.reason }),
        responsibility: String(finding.responsibility || "agent"), evidence: strings(finding.evidence).slice(-8)
      }))
    },
    open_questions: summarizeOpenItems(record.open_questions),
    pending_handoffs: summarizeOpenItems(record.pending_handoffs),
    recent_transitions: (record.rounds || []).slice(-3).map((round) => ({
      round: Number(round?.round || 0), goal: safeSemanticText(round?.goal || "", { maxLength: SEMANTIC_LIMITS.goal }),
      outcome: String(round?.outcome || ""), state_change: safeSemanticText(round?.planned_transition || "", { maxLength: SEMANTIC_LIMITS.transition }),
      invariant_assessment: objectOrNull(round?.invariant_assessment),
      evidence: strings(round?.evidence).slice(-8)
    }))
  };
}

function summarizeOpenItems(items) {
  return (items || []).filter((item) => !["resolved", "completed", "cancelled"].includes(String(item?.status || ""))).map((item) => ({
    id: String(item?.id || ""), status: String(item?.status || "open"), responsibility: String(item?.responsibility || item?.owner || ""),
    statement: safeSemanticText(item?.question || item?.statement || item?.summary || item?.reason || "", { maxLength: SEMANTIC_LIMITS.reason }),
    evidence: strings(item?.evidence).slice(-8)
  }));
}

function normalizeAgentLoopResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    schema_version: value.schema_version,
    action: value.action,
    summary: String(value.summary || ""),
    case_control: objectOrNull(value.case_control),
    case_command: objectOrNull(value.case_command),
    case_transition: value.case_transition ? {
      ...value.case_transition,
      accepted_state_delta: normalizeAcceptedDelta(value.case_transition.accepted_state_delta)
    } : null,
    changed_files: normalizeArtifactPathReferences(strings(value.changed_files)),
    artifact_impacts: Array.isArray(value.artifact_impacts) ? value.artifact_impacts : [],
    risks: strings(value.risks),
    unknowns: strings(value.unknowns),
    handoff: {
      next_responsibility: value.handoff?.next_responsibility || "agent",
      reason: String(value.handoff?.reason || value.summary || ""),
      next_prompt: String(value.handoff?.next_prompt || ""),
      human_decision_required: value.handoff?.human_decision_required === true
    }
  };
}

function agentLoopResultFailureReason(result, snapshot) {
  if (!["arckit-agent-loop-result/v1", "arckit-agent-loop-result/v2"].includes(result?.schema_version)) return "Agent Loop returned an unsupported schema version.";
  if (!result.summary) return "Agent Loop result requires a summary.";
  if (!["case_control", "case_command", "case_transition", "handoff"].includes(result.action)) return "Agent Loop result action is invalid.";
  if (snapshot?.compatibility?.status === "incompatible" && result.action !== "handoff") {
    return "Protocol-incompatible canonical state forbids ordinary Case control and transitions; reconcile through the trusted ledger entrypoint first.";
  }
  if (result.action === "case_control" && (!result.case_control || result.case_command || result.case_transition || result.case_control.action !== "create_case")) return "case_control action is incomplete.";
  if (result.action === "case_command") {
    if (!result.case_command || result.case_control || result.case_transition) return "case_command action is incomplete.";
    if (!Array.isArray(result.case_command.evidence) || result.case_command.evidence.length === 0) return "Agent Loop semantic command requires evidence.";
  }
  if (result.action === "case_transition") {
    if (!result.case_transition || result.case_control) return "case_transition action is incomplete.";
    const transition = result.case_transition;
    if (!Array.isArray(transition.evidence) || transition.evidence.length === 0) return "Agent Loop transition requires evidence.";
  }
  if (result.action === "handoff" && (result.case_control || result.case_command || result.case_transition)) return "handoff action cannot include Case payloads.";
  if (result.handoff.human_decision_required && result.handoff.next_responsibility !== "human") return "human_decision_required requires human responsibility.";
  return "";
}

function invalidAgentLoopResult(reason) {
  return {
    schema_version: "arckit-agent-loop-result/v2", action: "handoff", summary: reason, case_control: null, case_command: null, case_transition: null,
    changed_files: [], artifact_impacts: [], risks: [reason], unknowns: [],
    handoff: { next_responsibility: "agent", reason, next_prompt: "Retry from fresh canonical state.", human_decision_required: false }
  };
}

async function createRuntimeResultFromAgentLoop({ agentLoopResult, loopFrame, round, snapshot, compiledPrompt }) {
  if (agentLoopResult.action === "case_control") {
    const control = agentLoopResult.case_control;
    const controllerPlan = {
      execution_plan: { plane: "runtime", runtime_actions: [{ type: "case_control", ...control, case_id: "" }] },
      planned_transition: { goal: control.intent, expected_state_change: "No suitable active Case -> registered Case" },
      continuation_intent: { goal: control.intent, state_transition: "Case unregistered -> Case registered", next_prompt: agentLoopResult.handoff.next_prompt || "Reload fresh state." }
    };
    loopFrame.controller_frame.controller_plan = controllerPlan;
    const result = await createCaseControlRuntimeResult({ controllerPlan, loopFrame, round, snapshot, compiledPrompt, roundState: { state: "authorized", history: [] } });
    result.summary = agentLoopResult.summary;
    result.agent_loop_result = agentLoopProjection(agentLoopResult);
    result.validation_evidence = ["runtime/arcorbit/schemas/agent-loop-result.schema.json"];
    return result;
  }
  const command = agentLoopResult.case_command;
  const transition = agentLoopResult.case_transition;
  const ownership = buildArtifactOwnershipScan(agentLoopResult.changed_files);
  const handoff = agentLoopResult.handoff;
  const transitionReady = (agentLoopResult.action === "case_command" && command?.round_outcome !== "blocked") || (agentLoopResult.action === "case_transition" && transition?.round_outcome !== "blocked");
  const caseStatus = transition?.case_resolution?.claimed_status || (command ? "unresolved" : "blocked");
  const responsibility = transition?.case_resolution?.claimed_status === "resolved"
    ? "none"
    : command && handoff.next_responsibility === "none" ? "agent" : handoff.next_responsibility;
  const roundResult = caseStatus === "resolved" ? "done" : responsibility === "human" ? "needs_human" : responsibility === "external" ? "external_wait" : agentLoopResult.action === "handoff" ? "blocked" : "continue";
  if (transition) {
    loopFrame.case_id = transition.case_id;
    loopFrame.case_updated_at = transition.case_updated_at;
    loopFrame.project_revision = transition.project_revision;
    loopFrame.selected_gap = { ...transition.selected_gap, scope: "case", case_id: transition.case_id };
    loopFrame.round_goal = transition.planned_transition?.goal || agentLoopResult.summary;
    loopFrame.controller_frame.case_id = transition.case_id;
    loopFrame.controller_frame.round_goal = loopFrame.round_goal;
  }
  if (command) {
    const selected = semanticSelectedGap(command, snapshot);
    loopFrame.case_id = command.case_id;
    loopFrame.selected_gap = { ...selected, scope: "case", case_id: command.case_id };
    loopFrame.round_goal = command.planned_transition?.goal || agentLoopResult.summary;
    loopFrame.controller_frame.case_id = command.case_id;
    loopFrame.controller_frame.round_goal = loopFrame.round_goal;
  }
  const status = responsibility === "none" ? "done" : responsibility === "human" ? "needs_human" : responsibility === "external" ? "external_wait" : "continue";
  const loopHandoff = {
    version: "loop-handoff/v2", status, next_responsibility: responsibility,
    agent_continuation_available: responsibility === "agent", human_decision_required: responsibility === "human",
    trigger_mode: responsibility === "none" ? "none" : responsibility === "human" ? "user_decision" : responsibility === "external" ? "external_wait" : "auto_bridge",
    responsibility_reason: handoff.reason || agentLoopResult.summary,
    next_prompt: responsibility === "agent" ? handoff.next_prompt : "",
    agent_instruction: {
      goal: responsibility === "agent" ? handoff.next_prompt || "Reload fresh state and advance one gap." : "No automatic continuation.",
      required_context_refs: round.required_context_refs || [], required_actions: responsibility === "agent" ? ["Reload fresh Project/Case State and advance the most important candidate or fresh gap."] : [],
      required_checks: ["fresh revisions", "one selected gap", "ledger-derived handoff"], stop_condition: (round.stop_conditions || []).join(" ")
    },
    human_gate: { required: responsibility === "human", reason: responsibility === "human" ? handoff.reason : "", decision_needed: responsibility === "human" ? handoff.next_prompt : "" },
    progress_guard: {
      expected_state_change: command?.planned_transition?.expected_state_change || transition?.planned_transition?.expected_state_change || handoff.next_prompt || "Fresh-state recovery",
      actual_state_change: transitionReady ? (command ? "Agent submitted a semantic Case command pending trusted Ledger materialization." : "Agent submitted a Case transition pending deterministic ledger writeback.") : "",
      no_progress_limit: 2, max_auto_rounds: Number.isInteger(round.max_auto_rounds) ? round.max_auto_rounds : 8
    }
  };
  return {
    schema_version: "arckit-runtime-result/v2",
    round_result: roundResult,
    round_outcome: { status: command?.round_outcome || transition?.round_outcome || (responsibility === "human" ? "needs_human" : responsibility === "external" ? "external_wait" : "blocked"), reason: agentLoopResult.summary },
    case_outcome: { status: caseStatus, reason: transition?.case_resolution?.reason || handoff.reason, unresolved: command?.unresolved || transition?.unresolved || [] },
    project_state_delta: transition?.project_state_delta || { software_definition_changes: [], software_invariant_changes: [], project_gap_changes: [], selection_context_change: null, evidence: [] },
    case_command: command || null, case_transition: transition || null,
    round_state: transitionReady ? "ledger_gate_ready" : responsibility === "human" ? "human_gate_required" : responsibility === "external" ? "external_wait" : "blocked",
    round_state_history: [], summary: agentLoopResult.summary, changed_files: agentLoopResult.changed_files,
    artifact_impact_scan: createArtifactImpactScan(ownership), artifact_ownership_scan: ownership,
    source_projection_check: {
      source_facts_changed: ownership.source_facts_changed, projection_artifacts_changed: ownership.projection_artifacts_changed,
      source_unknown: ownership.unknown_artifacts.length > 0, deferred_projections: [], blocked_projections: ownership.unknown_artifacts.map((path) => `Unknown artifact: ${path}`)
    },
    agent_loop_result: agentLoopProjection(agentLoopResult), controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate, executor_binding: loopFrame.executor_binding,
    ledger_stage: {
      schema_version: "arckit-ledger-stage/v1", status: transitionReady ? "gate_ready" : responsibility === "human" ? "human_blocked" : "blocked",
      gate_required: transitionReady, writeback_required: transitionReady,
      reason: transitionReady ? (command ? "Agent submitted an evidence-backed semantic Case command for trusted Ledger materialization." : "Agent submitted an evidence-backed Case transition for deterministic ledger application.") : handoff.reason
    },
    validation_evidence: unique(["runtime/arcorbit/schemas/agent-loop-result.schema.json", ...(command?.evidence || transition?.evidence || [])]),
    loop_handoff: loopHandoff
  };
}

function agentLoopProjection(result) {
  return {
    schema_version: "arckit-agent-loop-projection/v1", action: result.action, summary: result.summary,
    case_id: result.case_command?.case_id || result.case_transition?.case_id || "",
    selected_gap_id: result.case_command?.selection?.selected_ref || result.case_transition?.selected_gap?.id || "",
    risks: result.risks, unknowns: result.unknowns
  };
}

function semanticSelectedGap(command, snapshot) {
  if (command.fresh_gap) return { ...command.fresh_gap, id: command.fresh_gap.ref };
  const candidates = snapshot?.candidateCatalog?.persisted_candidates || snapshot?.ledgerSnapshot?.candidate_catalog?.persisted_candidates || [];
  const selected = candidates.find((item) => item.ref === command.selection?.selected_ref);
  return selected?.gap || { id: command.selection?.selected_ref || "", responsibility: "agent", goal: command.planned_transition?.goal || "", reason: command.selection?.basis || "", derived_from: [], blocked_by: [], priority_basis: {}, evidence_required: [] };
}

function normalizeAcceptedDelta(delta) {
  return {
    resolved_gap: objectOrNull(delta?.resolved_gap),
    facts_added: Array.isArray(delta?.facts_added) ? delta.facts_added.filter(object) : [],
    facts_superseded: Array.isArray(delta?.facts_superseded) ? delta.facts_superseded.filter(object) : [],
    impacts_added: Array.isArray(delta?.impacts_added) ? delta.impacts_added.filter(object) : [],
    impacts_updated: Array.isArray(delta?.impacts_updated) ? delta.impacts_updated.filter(object) : [],
    gaps_added: Array.isArray(delta?.gaps_added) ? delta.gaps_added.filter(object) : [],
    gaps_cancelled: Array.isArray(delta?.gaps_cancelled) ? delta.gaps_cancelled.filter(object) : [],
    resolved_open_questions: strings(delta?.resolved_open_questions),
    completed_handoffs: strings(delta?.completed_handoffs),
    completion_review_result: objectOrNull(delta?.completion_review_result),
    resolved_review_findings: Array.isArray(delta?.resolved_review_findings) ? delta.resolved_review_findings.filter(object) : [],
    review_budget_extension: objectOrNull(delta?.review_budget_extension)
  };
}

function emit(events, event, options) {
  events.push(event);
  if (options.streamEvents) console.error(JSON.stringify({ event }));
}

function object(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function objectOrNull(value) { return object(value) ? value : null; }
function strings(value) { return Array.isArray(value) ? value.map(String).filter(Boolean) : []; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
