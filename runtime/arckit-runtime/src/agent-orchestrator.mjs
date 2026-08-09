import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentAdapter } from "./agent-adapter.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import {
  agentSkillInvocationForPhase,
  assertInstalledAgentSkillCompatibility,
  capabilitiesForBinding,
  capabilityIds,
  loadCapabilityPolicy,
  loadRuntimeCapabilities
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
  if (!options.dryRun) await assertInstalledAgentSkillCompatibility(controllerCapabilities, { codexHome: options.codexHome });
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
  if (!agentLoopResult) agentLoopResult = invalidAgentLoopResult("Codex Agent completed without returning arckit-agent-loop-result/v1.");
  const issue = agentLoopResultFailureReason(agentLoopResult, snapshot);
  if (issue) agentLoopResult = invalidAgentLoopResult(issue);
  emit(events, {
    type: "runtime.agent_loop.completed",
    action: agentLoopResult.action,
    summary: agentLoopResult.summary,
    case_id: agentLoopResult.case_transition?.case_id || ""
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
  return [invocation.skill_trigger, "", JSON.stringify({
    schema_version: "arckit-agent-loop-invocation/v1",
    phase: "agent_loop",
    conversation_locale: options.conversationLocale || round.conversation_locale || "en",
    original_user_input: firstTurn ? options.originalTask || options.task || "" : "",
    current_instruction: options.task || "",
    canonical_context: createControllerContextDigest({ snapshot, loopFrame }),
    execution_authorization: {
      status: loopFrame.execution_gate.status,
      executor: loopFrame.executor_binding.executor,
      workspace_root: snapshot.projectRoot || ""
    },
    loop_contract: {
      one_gap: true,
      execute_in_current_turn: true,
      native_skill_discovery: true,
      ledger_write_forbidden: true,
      valid_actions: ["case_control", "case_transition", "handoff"]
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
    scope: "case",
    case_id: round.case_id || "",
    facet: round.facet || "",
    responsibility: round.responsibility || "agent",
    current_state: safeSemanticText(round.current_state || "", { maxLength: SEMANTIC_LIMITS.reason }),
    target_state: safeSemanticText(round.target_state || "", { maxLength: SEMANTIC_LIMITS.reason }),
    impact: safeSemanticText(round.impact || "", { maxLength: SEMANTIC_LIMITS.reason }),
    next_transition: safeSemanticText(round.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition })
  };
  return {
    schema_version: "arckit-loop-frame/v1",
    case_id: round.case_id || "",
    case_updated_at: round.case_updated_at || "",
    project_updated_at: snapshot.projectState?.project?.updated_at || "",
    project_name: snapshot.summary?.project_name || "",
    project_root: snapshot.projectRoot || "",
    operator_task: task,
    runtime_context: options.runtimeContext || null,
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
    candidate_case_gaps: round.candidate_case_gaps || []
  };
}

export function createControllerContextDigest({ snapshot, loopFrame }) {
  const projectState = snapshot?.projectState || {};
  const activeCases = (snapshot?.activeCases || []).map(summarizeCase);
  return {
    schema_version: "arckit-controller-context-digest/v1",
    authority: "current_operator_input_and_canonical_digest_supersede_thread_history",
    phase: "agent_loop",
    project: {
      name: safeSemanticText(snapshot?.summary?.project_name || projectState?.project?.name || "", { maxLength: 240 }),
      phase: safeSemanticText(snapshot?.summary?.current_phase || "", { maxLength: 240 }),
      updated_at: String(projectState?.project?.updated_at || loopFrame?.project_updated_at || ""),
      case_control: {
        next_case_intent: safeSemanticText(projectState?.case_control?.next_case_intent || "", { maxLength: SEMANTIC_LIMITS.transition }),
        priority_basis: safeSemanticText(projectState?.case_control?.priority_basis || "", { maxLength: SEMANTIC_LIMITS.reason }),
        stop_condition: safeSemanticText(projectState?.case_control?.stop_condition || "", { maxLength: SEMANTIC_LIMITS.reason })
      },
      state_gaps: (projectState?.state_gaps || []).map((gap) => ({
        id: String(gap?.id || ""),
        dimension: String(gap?.dimension || ""),
        current_state: String(gap?.current_state || "unknown"),
        target_state: String(gap?.target_state || "unknown"),
        impact: safeSemanticText(gap?.impact || "", { maxLength: SEMANTIC_LIMITS.reason }),
        next_transition: safeSemanticText(gap?.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition }),
        candidate_case_ref: String(gap?.candidate_case_ref || "")
      }))
    },
    selected_case_id: String(loopFrame?.case_id || ""),
    active_cases: activeCases,
    context_refs: unique([
      snapshot?.paths?.projectState,
      snapshot?.paths?.activeIteration,
      ...activeCases.map((item) => item.ref)
    ]).slice(0, 32)
  };
}

function summarizeCase(item) {
  const record = item?.record || {};
  return {
    ref: String(item?.ref || ""),
    case_id: String(record.id || ""),
    title: safeSemanticText(record.title || "", { maxLength: 240 }),
    status: String(record.status || ""),
    artifact_type: String(record.artifact_type || "unknown"),
    updated_at: String(record.updated_at || ""),
    user_intent: safeSemanticText(record.user_intent || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    expected_outcome: safeSemanticText(record.expected_outcome || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    content_revision: Number(record.content_revision || 0),
    facets: Object.fromEntries(Object.entries(record.facets || {}).map(([facet, state]) => [facet, {
      applicability: String(state?.applicability || "unknown"),
      maturity: String(state?.maturity || "unknown"),
      target_maturity: String(state?.target_maturity || "unknown"),
      alignment: String(state?.alignment || "unknown"),
      target_alignment: String(state?.target_alignment || "unknown"),
      resolution: String(state?.resolution || "unresolved"),
      reason: safeSemanticText(state?.reason || "", { maxLength: SEMANTIC_LIMITS.reason }),
      evidence: strings(state?.evidence).slice(-8)
    }])),
    case_resolution: {
      status: String(record.case_resolution?.status || "unresolved"),
      stage: String(record.case_resolution?.stage || "working"),
      base_ready: record.case_resolution?.base_ready === true,
      remaining: strings(record.case_resolution?.remaining),
      candidate_gaps: (record.case_resolution?.candidate_gaps || []).map((gap) => ({
        id: String(gap?.id || ""), facet: String(gap?.facet || ""), responsibility: String(gap?.responsibility || "agent"),
        current_state: safeSemanticText(gap?.current_state || "", { maxLength: SEMANTIC_LIMITS.reason }),
        target_state: safeSemanticText(gap?.target_state || "", { maxLength: SEMANTIC_LIMITS.reason }),
        next_transition: safeSemanticText(gap?.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition }),
        evidence_required: strings(gap?.evidence_required).slice(0, 8)
      }))
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
  if (result?.schema_version !== "arckit-agent-loop-result/v1") return "Agent Loop returned an unsupported schema version.";
  if (!result.summary) return "Agent Loop result requires a summary.";
  if (!["case_control", "case_transition", "handoff"].includes(result.action)) return "Agent Loop result action is invalid.";
  if (result.action === "case_control" && (!result.case_control || result.case_transition || result.case_control.action !== "create_case")) return "case_control action is incomplete.";
  if (result.action === "case_transition") {
    if (!result.case_transition || result.case_control) return "case_transition action is incomplete.";
    const transition = result.case_transition;
    const activeCase = (snapshot.activeCases || []).find((item) => item.record?.id === transition.case_id);
    if (!activeCase) return `Agent Loop selected a non-active Case: ${transition.case_id || "<missing>"}.`;
    if (activeCase.record.updated_at !== transition.case_updated_at) return `Agent Loop Case revision is stale for ${transition.case_id}.`;
    const gap = (activeCase.record.case_resolution?.candidate_gaps || []).find((item) => item.id === transition.selected_gap?.id && item.facet === transition.selected_gap?.facet);
    if (!gap) return `Agent Loop selected a non-candidate gap: ${transition.selected_gap?.id || "<missing>"}.`;
    if (!Array.isArray(transition.evidence) || transition.evidence.length === 0) return "Agent Loop transition requires evidence.";
  }
  if (result.action === "handoff" && (result.case_control || result.case_transition)) return "handoff action cannot include Case payloads.";
  if (result.handoff.human_decision_required && result.handoff.next_responsibility !== "human") return "human_decision_required requires human responsibility.";
  return "";
}

function invalidAgentLoopResult(reason) {
  return {
    schema_version: "arckit-agent-loop-result/v1", action: "handoff", summary: reason, case_control: null, case_transition: null,
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
    result.validation_evidence = ["runtime/arckit-runtime/schemas/agent-loop-result.schema.json"];
    return result;
  }
  const transition = agentLoopResult.case_transition;
  const ownership = buildArtifactOwnershipScan(agentLoopResult.changed_files);
  const handoff = agentLoopResult.handoff;
  const transitionReady = agentLoopResult.action === "case_transition" && transition?.round_outcome !== "blocked";
  const caseStatus = transition?.case_resolution?.claimed_status || "blocked";
  const responsibility = caseStatus === "resolved" ? "none" : handoff.next_responsibility;
  const roundResult = caseStatus === "resolved" ? "done" : responsibility === "human" ? "needs_human" : responsibility === "external" ? "external_wait" : agentLoopResult.action === "handoff" ? "blocked" : "continue";
  if (transition) {
    loopFrame.case_id = transition.case_id;
    loopFrame.case_updated_at = transition.case_updated_at;
    loopFrame.project_updated_at = transition.project_updated_at;
    loopFrame.selected_gap = { ...transition.selected_gap, scope: "case", case_id: transition.case_id };
    loopFrame.round_goal = transition.planned_transition?.goal || agentLoopResult.summary;
    loopFrame.controller_frame.case_id = transition.case_id;
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
      required_context_refs: round.required_context_refs || [], required_actions: responsibility === "agent" ? ["Reload fresh Project/Case State and advance one candidate gap."] : [],
      required_checks: ["fresh revisions", "candidate gap", "ledger-derived handoff"], stop_condition: (round.stop_conditions || []).join(" ")
    },
    human_gate: { required: responsibility === "human", reason: responsibility === "human" ? handoff.reason : "", decision_needed: responsibility === "human" ? handoff.next_prompt : "" },
    progress_guard: {
      expected_state_change: transition?.planned_transition?.expected_state_change || handoff.next_prompt || "Fresh-state recovery",
      actual_state_change: transitionReady ? "Agent submitted a Case transition pending deterministic ledger writeback." : "",
      no_progress_limit: 2, max_auto_rounds: Number.isInteger(round.max_auto_rounds) ? round.max_auto_rounds : 8
    }
  };
  return {
    schema_version: "arckit-runtime-result/v2",
    round_result: roundResult,
    round_outcome: { status: transition?.round_outcome || (responsibility === "human" ? "needs_human" : responsibility === "external" ? "external_wait" : "blocked"), reason: agentLoopResult.summary },
    case_outcome: { status: caseStatus, reason: transition?.case_resolution?.reason || handoff.reason, unresolved: transition?.unresolved || [] },
    project_impact: transition?.project_impact_candidate || { status: "none", changes: [], evidence: [] },
    case_transition: transition || null,
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
      reason: transitionReady ? "Agent submitted an evidence-backed Case transition for deterministic ledger application." : handoff.reason
    },
    validation_evidence: unique(["runtime/arckit-runtime/schemas/agent-loop-result.schema.json", ...(transition?.evidence || [])]),
    loop_handoff: loopHandoff
  };
}

function agentLoopProjection(result) {
  return {
    schema_version: "arckit-agent-loop-projection/v1", action: result.action, summary: result.summary,
    case_id: result.case_transition?.case_id || "", selected_gap_id: result.case_transition?.selected_gap?.id || "",
    risks: result.risks, unknowns: result.unknowns
  };
}

function normalizeAcceptedDelta(delta) {
  return {
    facets: Array.isArray(delta?.facets) ? delta.facets.filter(object).map((claim) => ({
      facet: String(claim.facet || ""), set: normalizeFacetSet(claim.set), evidence: strings(claim.evidence), unresolved: strings(claim.unresolved)
    })) : [],
    resolved_open_questions: strings(delta?.resolved_open_questions), completed_handoffs: strings(delta?.completed_handoffs),
    completion_review_result: objectOrNull(delta?.completion_review_result),
    resolved_review_findings: Array.isArray(delta?.resolved_review_findings) ? delta.resolved_review_findings.filter(object) : [],
    review_budget_extension: objectOrNull(delta?.review_budget_extension)
  };
}

function normalizeFacetSet(value) {
  if (!object(value)) return {};
  const allowed = new Set(["applicability", "maturity", "target_maturity", "alignment", "target_alignment", "resolution", "reason", "next_transition"]);
  return Object.fromEntries(Object.entries(value).filter(([key, field]) => allowed.has(key) && field !== null && field !== undefined));
}

function emit(events, event, options) {
  events.push(event);
  if (options.streamEvents) console.error(JSON.stringify({ event }));
}

function object(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function objectOrNull(value) { return object(value) ? value : null; }
function strings(value) { return Array.isArray(value) ? value.map(String).filter(Boolean) : []; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
