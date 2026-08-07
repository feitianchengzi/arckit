import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createAgentAdapter } from "./agent-adapter.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import {
  agentSkillInvocationForPhase,
  assertInstalledAgentSkillCompatibility,
  capabilitiesForBinding,
  capabilityIds,
  invalidCapabilityBindings,
  loadCapabilityPolicy,
  loadRuntimeCapabilities,
  selectCapabilitiesForRound
} from "./capability-registry.mjs";
import { artifactPathAllowedByPatterns, buildArtifactOwnershipScan, normalizeArtifactPathReferences } from "./artifact-ownership-map.mjs";
import { reduceWorkerReports } from "./controller-reducer.mjs";
import { createRoundStateMachine, transitionRoundState } from "./round-state-machine.mjs";
import { createCaseControlRuntimeResult, createRuntimeResultFromMerge, stateFromMergeResult } from "./kernel/runtime-result-builder.mjs";
import { WORKER_TYPES, normalizeWorkerType } from "./orchestration/role-definitions.mjs";
import { firstSafeSemanticText, safeSemanticText, SEMANTIC_LIMITS } from "./context-boundary.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const workerReportSchemaPath = join(here, "../schemas/worker-report.schema.json");
const controllerPlanSchemaPath = join(here, "../schemas/controller-plan.schema.json");
const controllerReviewSchemaPath = join(here, "../schemas/controller-review.schema.json");

export async function runAgenticLoop({ projectRoot, snapshot, round, compiledPrompt, options = {} }) {
  const conversationLocale = options.conversationLocale || compiledPrompt.conversation_locale || round.conversation_locale || "en";
  round.conversation_locale = conversationLocale;
  const packetEnvelope = options.packetEnvelope || null;
  const capabilityPolicy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ projectRoot, capabilityPolicy });
  const controllerCapabilities = capabilitiesForBinding(capabilities, capabilityPolicy, "controller");
  const runtimeCapabilities = capabilitiesForBinding(capabilities, capabilityPolicy, "runtime");
  const workerCapabilities = capabilitiesForBinding(capabilities, capabilityPolicy, "worker");
  const selectedCapabilities = selectCapabilitiesForRound(workerCapabilities, round, options.task || "");
  const loopFrame = packetEnvelope
    ? authorizePacketLoopFrame(packetEnvelope.loop_frame, options)
    : createLoopFrame({
      snapshot,
      round,
      task: options.task || "",
      selectedCapabilities,
      controllerCapabilities,
      runtimeCapabilities,
      options
    });
  loopFrame.capability_bindings = capabilityBindings({
    controllerCapabilities,
    runtimeCapabilities,
    workerCapabilities: selectedCapabilities
  });
  const adapterName = options.dryRun ? "dry-run" : options.adapter || "codex-app-server";
  if (adapterName === "codex-app-server") {
    await assertInstalledAgentSkillCompatibility(controllerCapabilities, { codexHome: options.codexHome });
  }
  const adapter = options.agentAdapter || createAgentAdapter(adapterName, options);
  const controllerPlanSchema = JSON.parse(await readFile(controllerPlanSchemaPath, "utf8"));
  const controllerReviewSchema = JSON.parse(await readFile(controllerReviewSchemaPath, "utf8"));
  const workerReportSchema = JSON.parse(await readFile(workerReportSchemaPath, "utf8"));
  const events = [];
  const controllerPlan = packetEnvelope
    ? {
      usable: false,
      plan: null,
      failure_reason: "Existing packet execution uses the packet route without Controller Agent replanning."
    }
    : await maybeRunControllerPlanner({
      adapter,
      projectRoot,
      loopFrame,
      round,
      snapshot,
      task: options.task || "",
      selectedCapabilities,
      controllerCapabilities,
      runtimeCapabilities,
      controllerPlanSchema,
      options,
      events
    });
  const routePlan = packetEnvelope
    ? createRoutePlanFromPacket(loopFrame)
    : createRoutePlanFromControllerPlan({ controllerPlan: controllerPlan.plan, loopFrame });
  loopFrame.selected_gap = routePlan.selected_gap;
  loopFrame.case_id = routePlan.selected_gap?.case_id || loopFrame.case_id;
  const routedCase = (snapshot.activeCases || []).find((item) => item.record?.id === loopFrame.case_id);
  if (packetEnvelope) {
    const packetFailure = authorizedPacketFailureReason({ loopFrame, routePlan, snapshot, routedCase });
    if (packetFailure) throw new Error(packetFailure);
  }
  const routedGap = (routedCase?.record?.case_resolution?.candidate_gaps || []).find(
    (gap) => gap.id === routePlan.selected_gap?.id && gap.facet === routePlan.selected_gap?.facet
  );
  if (routedGap) {
    routePlan.selected_gap = canonicalizeSelectedGap(routePlan.selected_gap, routedGap).selected_gap;
  }
  loopFrame.case_updated_at = routedCase?.record?.updated_at || loopFrame.case_updated_at;
  loopFrame.controller_frame.case_id = loopFrame.case_id;
  loopFrame.controller_frame.selected_gap = routePlan.selected_gap;
  const controllerSemanticGoal = semanticGoalFromControllerPlan(controllerPlan?.plan, routePlan, loopFrame.round_goal);
  if (controllerSemanticGoal) {
    loopFrame.round_goal = controllerSemanticGoal;
    loopFrame.controller_frame.round_goal = controllerSemanticGoal;
  }
  loopFrame.controller_frame.controller_plan = controllerPlan?.plan || null;
  loopFrame.controller_frame.controller_plan_source = packetEnvelope ? "packet" : "controller_agent";
  loopFrame.controller_frame.controller_plan_failure_reason = controllerPlan?.failure_reason || "";
  loopFrame.route_plan = routePlan;
  loopFrame.controller_frame.route_plan = routePlan;
  const roundState = createRoundStateMachine("planned", "Controller reducer created the round plan.");
  const caseControlAction = caseControlRuntimeAction(controllerPlan?.plan);
  if (!packetEnvelope && controllerPlan?.usable && caseControlAction) {
    yieldEvent({ events, event: { type: "runtime.loop_frame.created", loop_frame: loopFrame }, stream: options.streamEvents });
    emitRoundState({ events, roundState, stream: options.streamEvents });
    if (loopFrame.execution_gate?.status === "authorized") {
      transitionRoundState(roundState, "authorized", "Execution gate authorized deterministic Case control for this round.");
      emitRoundState({ events, roundState, stream: options.streamEvents });
    }
    const runtimeResult = await createCaseControlRuntimeResult({
      controllerPlan: controllerPlan.plan,
      loopFrame,
      round,
      snapshot,
      compiledPrompt,
      roundState
    });
    const validation = validateRuntimeResult(runtimeResult);
    yieldEvent({
      events,
      event: {
        type: "runtime.case_control.ready",
        case_control_handoff: runtimeResult.case_control_handoff
      },
      stream: options.streamEvents
    });
    yieldEvent({
      events,
      event: {
        type: "runtime.result",
        result: runtimeResult,
        validation
      },
      stream: options.streamEvents
    });
    return {
      adapter,
      loopFrame,
      agentTasks: [],
      agentReports: [],
      mergeResult: null,
      events,
      runtimeResult,
      validation
    };
  }
  const agentTasks = packetEnvelope
    ? normalizePacketWorkerTasks(packetEnvelope.worker_tasks || [], loopFrame, selectedCapabilities)
    : controllerPlan?.usable ? createAgentTasks({
      loopFrame,
      round,
      snapshot,
      task: options.task || "",
      selectedCapabilities,
      controllerPlan: controllerPlan?.usable ? controllerPlan.plan : null
    }) : [];
  loopFrame.round_execution_packet.worker_packets = agentTasks.map(toWorkerPacket);
  loopFrame.worker_packets = loopFrame.round_execution_packet.worker_packets;
  const reports = [];

  yieldEvent({
    events,
    event: {
      type: "runtime.loop_frame.created",
      loop_frame: loopFrame
    },
    stream: options.streamEvents
  });
  emitRoundState({ events, roundState, stream: options.streamEvents });

  if (loopFrame.execution_gate?.status === "authorized") {
    transitionRoundState(roundState, "authorized", "Execution gate authorized an executor for this round.");
    emitRoundState({ events, roundState, stream: options.streamEvents });
  }

  if (!packetEnvelope && !controllerPlan?.usable && !options.dryRun) {
    const mergeResult = createControllerUnavailableMergeResult({ loopFrame, round, controllerPlan, conversationLocale });
    yieldEvent({
      events,
      event: {
        type: "runtime.merge.completed",
        merge_result: mergeResult
      },
      stream: options.streamEvents
    });
    const runtimeResult = createRuntimeResultFromMerge({
      mergeResult,
      reports,
      loopFrame,
      round,
      compiledPrompt,
      dryRun: false,
      roundState
    });
    const validation = validateRuntimeResult(runtimeResult);
    yieldEvent({
      events,
      event: {
        type: "runtime.result",
        result: runtimeResult,
        validation
      },
      stream: options.streamEvents
    });
    return {
      adapter,
      loopFrame,
      agentTasks,
      agentReports: reports,
      mergeResult,
      events,
      runtimeResult,
      validation
    };
  }

  if (options.dryRun) {
    const mergeResult = createPacketPreviewMergeResult({ loopFrame, round });
    yieldEvent({
      events,
      event: {
        type: "runtime.packet_preview.created",
        worker_packets: loopFrame.worker_packets,
        execution_gate: loopFrame.execution_gate
      },
      stream: options.streamEvents
    });
    yieldEvent({
      events,
      event: {
        type: "runtime.merge.completed",
        merge_result: mergeResult
      },
      stream: options.streamEvents
    });
    const runtimeResult = createRuntimeResultFromMerge({
      mergeResult,
      reports,
      loopFrame,
      round,
      compiledPrompt,
      dryRun: true,
      roundState
    });
    const validation = validateRuntimeResult(runtimeResult);
    yieldEvent({
      events,
      event: {
        type: "runtime.result",
        result: runtimeResult,
        validation
      },
      stream: options.streamEvents
    });
    return {
      adapter,
      loopFrame,
      agentTasks,
      agentReports: reports,
      mergeResult,
      events,
      runtimeResult,
      validation
    };
  }

  transitionRoundState(roundState, "workers_running", "Runtime started bounded worker dispatch.");
  emitRoundState({ events, roundState, stream: options.streamEvents });

  for (const [taskIndex, agentTask] of agentTasks.entries()) {
    const effectiveAgentTask = expandAgentTaskScopeWithPreviousChanges(agentTask, reports, loopFrame.worker_packets.slice(0, taskIndex));
    agentTasks[taskIndex] = effectiveAgentTask;
    loopFrame.worker_packets[taskIndex] = toWorkerPacket(effectiveAgentTask);
    loopFrame.round_execution_packet.worker_packets = loopFrame.worker_packets;
    yieldEvent({
      events,
      event: {
        type: "runtime.agent_task.started",
        task_id: effectiveAgentTask.id,
        worker_type: effectiveAgentTask.worker_type,
        workstream_id: effectiveAgentTask.workstream_id,
        role: effectiveAgentTask.role,
        worker_thread_key: effectiveAgentTask.worker_thread_key,
        context_scope_signature: workerContextScopeSignature(effectiveAgentTask),
        context_digest_version: effectiveAgentTask.inputs?.context_digest?.schema_version || "",
        context_ref_count: effectiveAgentTask.inputs?.context_digest?.context_refs?.length || 0,
        prior_report_count: reports.length,
        objective: effectiveAgentTask.objective,
        task: effectiveAgentTask
      },
      stream: options.streamEvents
    });

    const report = await executeAgentTask({
      adapter,
      projectRoot,
      agentTask: effectiveAgentTask,
      previousReports: reports,
      workerReportSchema,
      options,
      events
    });
    reports.push(report);
    if (isInfrastructureFailureReport(report)) {
      adapter.discardThread?.(effectiveAgentTask.worker_thread_key);
      const failFastEvent = {
        type: "runtime.agent_task.fail_fast",
        task_id: report.task_id,
        worker_type: report.worker_type,
        workstream_id: effectiveAgentTask.workstream_id,
        role: report.role,
        worker_thread_key: effectiveAgentTask.worker_thread_key,
        reason: report.summary
      };
      events.push(failFastEvent);
      if (options.streamEvents) {
        console.error(JSON.stringify({ event: failFastEvent }));
      }
      break;
    }
  }

  transitionRoundState(roundState, "reports_collected", "Runtime collected available worker reports.");
  emitRoundState({ events, roundState, stream: options.streamEvents });
  const controllerReview = await maybeRunControllerReviewer({
    adapter,
    projectRoot,
    loopFrame,
    round,
    reports,
    controllerCapabilities,
    controllerReviewSchema,
    options,
    events
  });
  transitionRoundState(roundState, "merge_ready", "Controller reducer is ready to merge reports.");
  emitRoundState({ events, roundState, stream: options.streamEvents });

  const mergeResult = mergeAgentReports({ reports, loopFrame, round, compiledPrompt, dryRun: options.dryRun, controllerReview });
  transitionRoundState(roundState, stateFromMergeResult(mergeResult), mergeResult.loop_gate?.reason || "Controller reducer produced next control state.");
  yieldEvent({
    events,
    event: {
      type: "runtime.merge.completed",
      merge_result: mergeResult
    },
    stream: options.streamEvents
  });
  emitRoundState({ events, roundState, stream: options.streamEvents });

  const runtimeResult = createRuntimeResultFromMerge({
    mergeResult,
    reports,
    loopFrame,
    round,
    compiledPrompt,
    dryRun: options.dryRun,
    roundState
  });
  const validation = validateRuntimeResult(runtimeResult);
  yieldEvent({
    events,
    event: {
      type: "runtime.result",
      result: runtimeResult,
      validation
    },
    stream: options.streamEvents
  });

  return {
    adapter,
    loopFrame,
    agentTasks,
    agentReports: reports,
    mergeResult,
    events,
    runtimeResult,
    validation
  };
}

async function executeAgentTask({ adapter, projectRoot, agentTask, previousReports, workerReportSchema, options, events }) {
  const prompt = compileAgentTaskPrompt({ agentTask, previousReports });
  let report = null;
  for await (const event of adapter.runTurn({
    projectRoot,
    prompt,
    options: {
      ...options,
      threadKey: agentTask.worker_thread_key,
      outputSchema: workerReportSchema,
      resultKind: "worker-report"
    }
  })) {
    const wrapped = {
      ...event,
      task_id: agentTask.id,
      worker_type: agentTask.worker_type,
      workstream_id: agentTask.workstream_id,
      role: agentTask.role,
      worker_thread_key: agentTask.worker_thread_key
    };
    events.push(wrapped);
    if (options.streamEvents) {
      console.error(JSON.stringify({ event: wrapped }));
    }
    if (event.type === "runtime.worker_report") {
      report = normalizeAgentReport(event.report, agentTask);
    }
  }
  if (!report) {
    report = createInvalidAgentReport(agentTask, t(agentTask.conversation_locale, "Worker completed without returning an arckit-worker-report/v2 object.", "Worker 已完成，但没有返回 arckit-worker-report/v2 对象。"));
  }
  const completedEvent = {
    type: "runtime.worker_report.completed",
    task_id: report.task_id,
    worker_type: report.worker_type,
    workstream_id: agentTask.workstream_id,
    role: report.role,
    worker_thread_key: agentTask.worker_thread_key,
    status: report.status,
    report
  };
  events.push(completedEvent);
  if (options.streamEvents) {
    console.error(JSON.stringify({ event: completedEvent }));
  }
  return report;
}

async function maybeRunControllerPlanner({
  adapter,
  projectRoot,
  loopFrame,
  round,
  snapshot,
  task,
  selectedCapabilities,
  controllerCapabilities,
  runtimeCapabilities,
  controllerPlanSchema,
  options,
  events
}) {
  if (options.dryRun || options.controllerAgent === "disabled") {
    return {
      usable: false,
      plan: null,
      failure_reason: options.dryRun
        ? "Dry-run cannot create a worker route without executing a Controller Agent."
        : "Controller Agent planning is disabled by runtime options."
    };
  }

  let plan = null;
  let failureReason = "";
  let attempts = 0;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    attempts = attempt;
    if (attempt > 1) {
      const retryEvent = { type: "runtime.controller_plan.retry", attempt, failure_reason: failureReason };
      events.push(retryEvent);
      if (options.streamEvents) console.error(JSON.stringify({ event: retryEvent }));
    }
    const prompt = compileControllerPlanPrompt({
      loopFrame,
      round,
      snapshot,
      task,
      selectedCapabilities,
      controllerCapabilities,
      runtimeCapabilities,
      controllerFeedback: attempt > 1 ? { validation_error: failureReason, rejected_plan: plan } : null
    });
    plan = null;
    try {
      for await (const event of adapter.runTurn({
        projectRoot,
        prompt,
        options: {
          ...options,
          threadKey: controllerThreadKey({ phase: "planning" }),
          outputSchema: controllerPlanSchema,
          resultKind: "controller-plan"
        }
      })) {
        const wrapped = { ...event, controller_role: "controller_planner", controller_attempt: attempt };
        events.push(wrapped);
        if (options.streamEvents) console.error(JSON.stringify({ event: wrapped }));
        if (event.type === "runtime.controller_plan") plan = normalizeControllerPlan(event.plan);
      }
    } catch (error) {
      failureReason = error?.message || String(error);
      const failedPlan = createControllerPlanFailure(`Controller Agent planning failed before route selection: ${failureReason}`);
      const completedEvent = {
        type: "runtime.controller_plan.completed",
        status: "planning_failed",
        controller_plan: failedPlan,
        failure_reason: failureReason,
        attempts
      };
      events.push(completedEvent);
      if (options.streamEvents) console.error(JSON.stringify({ event: completedEvent }));
      return { usable: false, plan: failedPlan, failure_reason: failureReason };
    }
    const canonicalized = canonicalizeControllerPlanSelectedGap(plan, loopFrame);
    plan = canonicalized.plan;
    if (canonicalized.normalized_fields.length > 0) {
      const normalizedEvent = {
        type: "runtime.controller_plan.normalized",
        selected_gap_id: plan.route_plan.selected_gap.id,
        normalized_fields: canonicalized.normalized_fields
      };
      events.push(normalizedEvent);
      if (options.streamEvents) console.error(JSON.stringify({ event: normalizedEvent }));
    }
    failureReason = controllerPlanFailureReason(plan, selectedCapabilities, loopFrame);
    if (!shouldRetryControllerPlan({ plan, failureReason, attempt, maxAttempts: 2 })) break;
  }

  const completedStatus = controllerPlanCompletedStatus({ plan, failureReason });
  const completedEvent = {
    type: "runtime.controller_plan.completed",
    status: completedStatus,
    controller_plan: plan || null,
    failure_reason: failureReason,
    attempts
  };
  events.push(completedEvent);
  if (options.streamEvents) {
    console.error(JSON.stringify({ event: completedEvent }));
  }
  return {
    usable: !failureReason,
    plan: plan || createControllerPlanFailure("Controller Agent planning completed without a controller plan."),
    failure_reason: failureReason
  };
}

export function shouldRetryControllerPlan({ plan, failureReason, attempt, maxAttempts = 2 }) {
  const adapterStructureFailure = plan?.status === "blocked"
    && /failed before returning|did not return a valid arckit-controller-plan/i.test(plan?.summary || "");
  return Boolean(failureReason) && (plan?.status === "planned" || adapterStructureFailure) && attempt < maxAttempts;
}

export function compileControllerPlanPrompt({
  loopFrame,
  round,
  snapshot,
  task,
  selectedCapabilities,
  controllerCapabilities,
  runtimeCapabilities,
  controllerFeedback = null
}) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || "en";
  const invocation = agentSkillInvocationForPhase(controllerCapabilities, "controller_plan");
  const runtimeInput = {
    schema_version: "arckit-agent-invocation/v1",
    phase: invocation.phase,
    conversation_locale: conversationLocale,
    operator_input: task || "",
    state: {
      required_context_refs: round.required_context_refs || [],
      expected_project_updated_at: snapshot.projectState?.project?.updated_at || "",
      expected_case_id: loopFrame.case_id || round.case_id || "",
      expected_case_updated_at: loopFrame.case_updated_at || round.case_updated_at || ""
    },
    execution_authorization: {
      status: loopFrame.execution_gate?.status || "",
      executor: loopFrame.executor_binding?.executor || ""
    },
    runtime_context: loopFrame.runtime_context || null,
    ...(controllerFeedback ? { controller_feedback: controllerFeedback } : {}),
    capabilities: {
      runtime: runtimeCapabilities.map(toCapabilityRef),
      workers: selectedCapabilities.map(toCapabilityRef)
    },
    threading_contract: {
      controller_planning_scope: "project",
      controller_review_scope: "case",
      worker_thread_scope: "case + worker_type + stable workstream_id",
      workstream_rule: "Reuse a workstream_id only for a coherent objective and path domain across rounds; assign a different stable id to an independent sub-workstream. Runtime does not infer this semantic identity."
    }
  };
  return [
    invocation.skill_trigger,
    "",
    JSON.stringify(runtimeInput, null, 2)
  ].join("\n");
}

function normalizeControllerPlan(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }
  return {
    schema_version: plan.schema_version === "arckit-controller-plan/v3" ? plan.schema_version : "arckit-controller-plan/v3",
    status: ["planned", "needs_human", "blocked"].includes(plan.status) ? plan.status : "blocked",
    summary: stringValue(plan.summary, ""),
    execution_plan: {
      plane: ["runtime", "worker", "none"].includes(plan.execution_plan?.plane) ? plan.execution_plan.plane : "none",
      runtime_actions: Array.isArray(plan.execution_plan?.runtime_actions)
        ? plan.execution_plan.runtime_actions.map(normalizeRuntimeAction).filter(Boolean)
        : []
    },
    route_plan: {
      mode: stringValue(plan.route_plan?.mode, "agent_selected_route"),
      selected_gap: normalizeSelectedGap(plan.route_plan?.selected_gap),
      reason: stringValue(plan.route_plan?.reason, ""),
      requires_human_confirmation: plan.route_plan?.requires_human_confirmation === true
    },
    worker_intents: Array.isArray(plan.worker_intents)
      ? plan.worker_intents
        .map((intent) => ({
          worker_type: normalizeWorkerType(intent.worker_type),
          workstream_id: normalizeWorkstreamId(intent.workstream_id, ""),
          role: stringValue(intent.role, ""),
          objective: stringValue(intent.objective, ""),
          reason: stringValue(intent.reason, ""),
          allowed_paths: arrayOfStrings(intent.allowed_paths),
          allowed_actions: arrayOfStrings(intent.allowed_actions),
          forbidden_actions: arrayOfStrings(intent.forbidden_actions),
          allowed_skills: arrayOfStrings(intent.allowed_skills),
          expected_case_impact: stringValue(intent.expected_case_impact, ""),
          stop_condition: stringValue(intent.stop_condition, "")
        }))
        .filter((intent) => intent.role)
      : [],
    planned_transition: {
      goal: safeSemanticText(plan.planned_transition?.goal || "", { maxLength: SEMANTIC_LIMITS.goal }),
      expected_state_change: safeSemanticText(plan.planned_transition?.expected_state_change || "", { maxLength: SEMANTIC_LIMITS.transition })
    },
    continuation_intent: normalizeContinuationIntent(plan.continuation_intent),
    risks: arrayOfStrings(plan.risks),
    unknowns: arrayOfStrings(plan.unknowns),
    next_controller_action: stringValue(plan.next_controller_action, "")
  };
}

function normalizeRuntimeAction(action) {
  if (!action || typeof action !== "object" || action.type !== "case_control") {
    return null;
  }
  return {
    type: "case_control",
    action: action.action === "create_case" ? action.action : "",
    case_id: stringValue(action.case_id, ""),
    title: safeSemanticText(action.title || "", { maxLength: 240 }),
    intent: safeSemanticText(action.intent || "", { maxLength: SEMANTIC_LIMITS.reason }),
    artifact_type: ["code", "skill", "document", "workflow", "mixed", "unknown"].includes(action.artifact_type)
      ? action.artifact_type
      : "unknown",
    selection_reason: safeSemanticText(action.selection_reason || "", { maxLength: SEMANTIC_LIMITS.reason })
  };
}

export function caseControlRuntimeAction(plan) {
  const actions = Array.isArray(plan?.execution_plan?.runtime_actions) ? plan.execution_plan.runtime_actions : [];
  return actions.find((action) => action?.type === "case_control") || null;
}

function activeCandidateGap(loopFrame, selectedGap) {
  const selectedCaseCandidate = (loopFrame?.candidate_cases || []).find(
    (candidate) => candidate.case_id === selectedGap?.case_id
  );
  const allowedGaps = selectedCaseCandidate?.candidate_gaps || [];
  return allowedGaps.find((gap) => gap.id === selectedGap?.id && gap.facet === selectedGap?.facet) || null;
}

function canonicalizeSelectedGap(selectedGap, activeGap) {
  const canonicalFields = ["responsibility", "current_state", "target_state", "next_transition"];
  const normalizedFields = canonicalFields.filter((field) => selectedGap?.[field] !== activeGap?.[field]);
  return {
    selected_gap: {
      ...selectedGap,
      ...Object.fromEntries(canonicalFields.map((field) => [field, activeGap?.[field] || ""]))
    },
    normalized_fields: normalizedFields
  };
}

export function controllerPlanFailureReason(plan, workerCapabilities = [], loopFrame = null) {
  if (!plan) {
    return "Controller Agent did not return a usable plan.";
  }
  if (plan.schema_version !== "arckit-controller-plan/v3") {
    return "Controller Agent returned an unsupported plan schema.";
  }
  if (plan.status !== "planned") {
    return `Controller Agent plan status is ${plan.status}.`;
  }
  if (!Array.isArray(plan.worker_intents)) {
    return "Controller Agent worker_intents must be an array.";
  }
  const executionPlan = plan.execution_plan || {};
  if (!["runtime", "worker", "none"].includes(executionPlan.plane) || !Array.isArray(executionPlan.runtime_actions)) {
    return "Controller Agent must return a supported execution_plan.";
  }
  if (executionPlan.runtime_actions.length > 1) {
    return "Controller Agent may request at most one Runtime action per plan.";
  }
  const caseControl = caseControlRuntimeAction(plan);
  if (executionPlan.plane === "runtime") {
    if (!caseControl || executionPlan.runtime_actions.length !== 1) {
      return "Controller Agent runtime execution plane requires exactly one supported Runtime action.";
    }
    if (plan.worker_intents.length > 0) {
      return "Controller Agent runtime actions and Worker dispatch are mutually exclusive.";
    }
    if (plan.route_plan?.requires_human_confirmation === true) {
      return "Controller Agent runtime action cannot also request human confirmation.";
    }
  } else if (executionPlan.runtime_actions.length > 0) {
    return `Controller Agent execution plane ${executionPlan.plane} cannot contain Runtime actions.`;
  }
  if (executionPlan.plane === "worker" && plan.worker_intents.length === 0) {
    return "Controller Agent worker execution plane requires at least one Worker intent.";
  }
  if (executionPlan.plane === "none" && plan.worker_intents.length > 0) {
    return "Controller Agent none execution plane cannot contain Worker intents.";
  }
  if (executionPlan.plane === "runtime") {
    if (caseControl.action !== "create_case") {
      return "Controller Agent must return a supported case_control Runtime action.";
    }
    if (caseControl.action === "create_case") {
      if (!caseControl.title || !caseControl.intent || !caseControl.selection_reason) {
        return "Controller Agent create_case handoff must include title, intent, and selection_reason.";
      }
      if (caseControl.case_id) {
        return "Controller Agent must leave case_control.case_id empty for create_case; the ledger allocates it.";
      }
      return completeControllerControlPlanFailureReason(plan);
    }
  }
  if (plan.route_plan?.selected_gap?.scope !== "case" || !plan.route_plan?.selected_gap?.case_id || !plan.route_plan?.selected_gap?.facet) {
    return "Controller Agent must select a concrete Case State gap.";
  }
  if (loopFrame) {
    const activeGap = activeCandidateGap(loopFrame, plan.route_plan.selected_gap);
    if (!activeGap) {
      return "Controller Agent selected a gap that is not in the active Case candidate_gaps.";
    }
  }
  if (!plan.planned_transition?.goal || !plan.planned_transition?.expected_state_change) {
    return "Controller Agent did not return a complete planned_transition.";
  }
  if (plan.worker_intents.some((intent) => !intent.expected_case_impact)) {
    return "Every worker intent must declare expected_case_impact.";
  }
  if (plan.worker_intents.some((intent) => !isValidWorkstreamId(intent.workstream_id))) {
    return "Every worker intent must declare a stable lowercase workstream_id.";
  }
  if (plan.worker_intents.some((intent) => !intent.objective || !intent.stop_condition)) {
    return "Every worker intent must declare objective and stop_condition.";
  }
  if (plan.worker_intents.some((intent) => arrayOfStrings(intent.allowed_paths).length === 0 || arrayOfStrings(intent.allowed_actions).length === 0)) {
    return "Every worker intent must declare non-empty allowed_paths and allowed_actions.";
  }
  const invalidPaths = plan.worker_intents.flatMap((intent) => arrayOfStrings(intent.allowed_paths)).filter((path) => !isProjectRelativeAllowedPath(path));
  if (invalidPaths.length > 0) {
    return `Worker intent allowed_paths must stay within the project: ${unique(invalidPaths).join(", ")}.`;
  }
  const runtimeOwnedActions = plan.worker_intents.flatMap((intent) => arrayOfStrings(intent.allowed_actions)).filter(isRuntimeOwnedAction);
  if (runtimeOwnedActions.length > 0) {
    return `Worker intent cannot authorize Runtime-owned actions: ${unique(runtimeOwnedActions).join(", ")}.`;
  }
  const invalidBindings = invalidCapabilityBindings(
    plan.worker_intents.flatMap((intent) => arrayOfStrings(intent.allowed_skills)),
    workerCapabilities
  );
  if (invalidBindings.length > 0) {
    return `Controller Agent bound non-worker or unavailable capabilities: ${invalidBindings.join(", ")}.`;
  }
  if (!plan.continuation_intent?.goal || !plan.continuation_intent?.state_transition || !plan.continuation_intent?.next_prompt) {
    return "Controller Agent did not return a complete continuation_intent.";
  }
  return "";
}

function completeControllerControlPlanFailureReason(plan) {
  if (!plan.planned_transition?.goal || !plan.planned_transition?.expected_state_change) {
    return "Controller Agent did not return a complete planned_transition for Case control.";
  }
  if (!plan.continuation_intent?.goal || !plan.continuation_intent?.state_transition || !plan.continuation_intent?.next_prompt) {
    return "Controller Agent did not return a complete continuation_intent for Case control.";
  }
  return "";
}

export function authorizedPacketFailureReason({ loopFrame, routePlan, snapshot, routedCase = null }) {
  const selectedGap = routePlan?.selected_gap || {};
  const activeCase = routedCase || (snapshot?.activeCases || []).find((item) => item.record?.id === selectedGap.case_id);
  if (!activeCase) return `Authorized packet targets a Case that is no longer active: ${selectedGap.case_id || '<missing>'}.`;
  if (!loopFrame?.case_updated_at || loopFrame.case_updated_at !== activeCase.record.updated_at) {
    return `Authorized packet is stale for ${activeCase.record.id}: expected Case revision ${activeCase.record.updated_at}, received ${loopFrame?.case_updated_at || '<missing>'}.`;
  }
  const activeGap = (activeCase.record.case_resolution?.candidate_gaps || []).find((gap) => gap.id === selectedGap.id && gap.facet === selectedGap.facet);
  if (!activeGap) return `Authorized packet selected gap is no longer unresolved: ${selectedGap.id || '<missing>'}.`;
  return "";
}

export function canonicalizeControllerPlanSelectedGap(plan, loopFrame = null) {
  const selectedGap = plan?.route_plan?.selected_gap;
  if (!selectedGap || !loopFrame) return { plan, normalized_fields: [] };
  const activeGap = activeCandidateGap(loopFrame, selectedGap);
  if (!activeGap) return { plan, normalized_fields: [] };
  const { selected_gap, normalized_fields } = canonicalizeSelectedGap(selectedGap, activeGap);
  return {
    plan: {
      ...plan,
      route_plan: {
        ...plan.route_plan,
        selected_gap
      }
    },
    normalized_fields
  };
}

function controllerPlanCompletedStatus({ plan, failureReason }) {
  if (!plan) {
    return "planning_failed";
  }
  if (plan.status === "needs_human") {
    return "needs_human";
  }
  if (plan.status === "blocked") {
    return "blocked";
  }
  if (failureReason) {
    return "planning_failed";
  }
  return "planned";
}

function createControllerPlanFailure(summary) {
  return {
    schema_version: "arckit-controller-plan/v3",
    status: "blocked",
    summary,
    execution_plan: {
      plane: "none",
      runtime_actions: []
    },
    route_plan: {
      mode: "agent_selected_route",
      selected_gap: emptySelectedGap(),
      reason: summary,
      requires_human_confirmation: false
    },
    worker_intents: [],
    planned_transition: {
      goal: "",
      expected_state_change: ""
    },
    continuation_intent: {
      goal: "",
      state_transition: "",
      next_prompt: ""
    },
    risks: [summary],
    unknowns: [],
    next_controller_action: "Retry Controller planning with a valid arckit-controller-plan/v3 output."
  };
}

async function maybeRunControllerReviewer({
  adapter,
  projectRoot,
  loopFrame,
  round,
  reports,
  controllerCapabilities,
  controllerReviewSchema,
  options,
  events
}) {
  if (options.dryRun || options.controllerAgent === "disabled") {
    return {
      usable: false,
      review: null,
      failure_reason: options.dryRun
        ? "Dry-run cannot review worker reports without executing a Controller Agent."
        : "Controller Agent review is disabled by runtime options."
    };
  }

  const prompt = compileControllerReviewPrompt({ loopFrame, round, reports, controllerCapabilities });
  let review = null;
  try {
    for await (const event of adapter.runTurn({
      projectRoot,
      prompt,
      options: {
        ...options,
        threadKey: controllerThreadKey({ phase: "review", caseId: loopFrame.case_id }),
        outputSchema: controllerReviewSchema,
        resultKind: "controller-review"
      }
    })) {
      const wrapped = {
        ...event,
        controller_role: "controller_reviewer"
      };
      events.push(wrapped);
      if (options.streamEvents) {
        console.error(JSON.stringify({ event: wrapped }));
      }
      if (event.type === "runtime.controller_review") {
        review = normalizeControllerReviewReportReferences(normalizeControllerReview(event.review), reports);
      }
    }
  } catch (error) {
    const failureReason = error?.message || String(error);
    const failedReview = createControllerReviewFailure(`Controller Agent review failed before merge: ${failureReason}`);
    const completedEvent = {
      type: "runtime.controller_review.completed",
      status: "review_failed",
      controller_review: failedReview,
      failure_reason: failureReason
    };
    events.push(completedEvent);
    if (options.streamEvents) {
      console.error(JSON.stringify({ event: completedEvent }));
    }
    return {
      usable: false,
      review: failedReview,
      failure_reason: failureReason
    };
  }

  const failureReason = controllerReviewFailureReason(review, reports);
  const completedEvent = {
    type: "runtime.controller_review.completed",
    status: failureReason ? "review_failed" : "reviewed",
    controller_review: review || null,
    failure_reason: failureReason
  };
  events.push(completedEvent);
  if (options.streamEvents) {
    console.error(JSON.stringify({ event: completedEvent }));
  }
  return {
    usable: !failureReason,
    review: review || createControllerReviewFailure("Controller Agent review completed without a controller review."),
    failure_reason: failureReason
  };
}

export function compileControllerReviewPrompt({ loopFrame, round, reports, controllerCapabilities }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || "en";
  const invocation = agentSkillInvocationForPhase(controllerCapabilities, "controller_review");
  const runtimeInput = {
    schema_version: "arckit-agent-invocation/v1",
    phase: invocation.phase,
    conversation_locale: conversationLocale,
    case_context: {
      case_id: loopFrame.case_id || "",
      case_updated_at: loopFrame.case_updated_at || "",
      round_goal: loopFrame.round_goal || "",
      selected_gap: loopFrame.selected_gap || null,
      route_plan: loopFrame.route_plan || null,
      planned_transition: loopFrame.controller_frame?.controller_plan?.planned_transition || null
    },
    execution_authorization: {
      status: loopFrame.execution_gate?.status || "",
      executor: loopFrame.executor_binding?.executor || ""
    },
    runtime_context: loopFrame.runtime_context || null,
    worker_reports: reports
  };
  return [
    invocation.skill_trigger,
    "",
    JSON.stringify(runtimeInput, null, 2)
  ].join("\n");
}

function normalizeControllerReview(review) {
  if (!review || typeof review !== "object") {
    return null;
  }
  return {
    schema_version: review.schema_version === "arckit-controller-review/v3" ? review.schema_version : "arckit-controller-review/v3",
    status: ["done", "continue", "needs_human", "blocked", "external_wait"].includes(review.status) ? review.status : "blocked",
    summary: stringValue(review.summary, ""),
    accepted_reports: arrayOfStrings(review.accepted_reports),
    rejected_reports: arrayOfStrings(review.rejected_reports),
    accepted_case_state_delta: normalizeAcceptedCaseStateDelta(review.accepted_case_state_delta),
    evidence: arrayOfStrings(review.evidence),
    case_resolution: {
      claimed_status: ["unresolved", "resolved", "blocked"].includes(review.case_resolution?.claimed_status) ? review.case_resolution.claimed_status : "blocked",
      reason: stringValue(review.case_resolution?.reason, ""),
      unresolved: arrayOfStrings(review.case_resolution?.unresolved)
    },
    project_impact_candidate: normalizeProjectImpactCandidate(review.project_impact_candidate),
    risks: arrayOfStrings(review.risks),
    unknowns: arrayOfStrings(review.unknowns),
    next_prompt: stringValue(review.next_prompt, ""),
    continuation_intent: normalizeContinuationIntent(review.continuation_intent),
    human_decision_required: review.human_decision_required === true
  };
}

export function normalizeControllerReviewReportReferences(review, reports = []) {
  if (!review) return review;
  const reportIds = reports.map((report) => report?.task_id).filter(Boolean);
  return {
    ...review,
    accepted_reports: unique(arrayOfStrings(review.accepted_reports).map((value) => canonicalReportReference(value, reportIds))),
    rejected_reports: unique(arrayOfStrings(review.rejected_reports).map((value) => canonicalReportReference(value, reportIds)))
  };
}

function canonicalReportReference(value, reportIds) {
  const reference = String(value || "").trim();
  if (reportIds.includes(reference)) return reference;
  const matches = reportIds.filter((reportId) => {
    if (!reference.startsWith(reportId)) return false;
    const suffix = reference.slice(reportId.length);
    return /^[\s:：\-—(（]/.test(suffix);
  });
  if (matches.length === 1) return matches[0];
  const ordinal = reference.match(/^TASK-(\d{2})(?:\D|$)/)?.[1] || "";
  if (ordinal) {
    const ordinalMatches = reportIds.filter((reportId) => reportId.startsWith(`TASK-${ordinal}-`));
    if (ordinalMatches.length === 1) return ordinalMatches[0];
  }
  return reference;
}

function controllerReviewFailureReason(review, reports = []) {
  if (!review) {
    return "Controller Agent did not return a usable review.";
  }
  if (review.schema_version !== "arckit-controller-review/v3") {
    return "Controller Agent returned an unsupported review schema.";
  }
  if (!["done", "continue", "needs_human", "blocked", "external_wait"].includes(review.status)) {
    return "Controller Agent returned an unsupported review status.";
  }
  if (!review.continuation_intent?.goal || !review.continuation_intent?.state_transition || !review.continuation_intent?.next_prompt) {
    return "Controller Agent review did not return a complete continuation_intent.";
  }
  if (!review.accepted_case_state_delta || !review.case_resolution || !review.project_impact_candidate) {
    return "Controller Agent review did not return Case State closeout semantics.";
  }
  if (caseDeltaHasChanges(review.accepted_case_state_delta) && (!Array.isArray(review.evidence) || review.evidence.length === 0)) {
    return "Controller Agent review accepted a Case State delta without evidence.";
  }
  const reportIds = reports.map((report) => report.task_id).filter(Boolean);
  const accepted = new Set(review.accepted_reports);
  const rejected = new Set(review.rejected_reports);
  const overlapping = reportIds.filter((id) => accepted.has(id) && rejected.has(id));
  if (overlapping.length > 0) {
    return `Controller Agent review both accepted and rejected reports: ${unique(overlapping).join(", ")}.`;
  }
  const unknown = [...accepted, ...rejected].filter((id) => !reportIds.includes(id));
  if (unknown.length > 0) {
    return `Controller Agent review referenced unknown reports: ${unique(unknown).join(", ")}.`;
  }
  const unreviewed = reportIds.filter((id) => !accepted.has(id) && !rejected.has(id));
  if (unreviewed.length > 0) {
    return `Controller Agent review did not accept or reject reports: ${unique(unreviewed).join(", ")}.`;
  }
  return "";
}

function createControllerReviewFailure(summary) {
  return {
    schema_version: "arckit-controller-review/v3",
    status: "blocked",
    summary,
    accepted_reports: [],
    rejected_reports: [],
    accepted_case_state_delta: { facets: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null },
    evidence: [],
    case_resolution: { claimed_status: "blocked", reason: summary, unresolved: [summary] },
    project_impact_candidate: { status: "none", changes: [], evidence: [] },
    risks: [summary],
    unknowns: [],
    next_prompt: "Retry Controller review with a valid arckit-controller-review/v3 output.",
    continuation_intent: {
      goal: "",
      state_transition: "",
      next_prompt: ""
    },
    human_decision_required: false
  };
}

export function createLoopFrame({
  snapshot,
  round,
  task,
  selectedCapabilities = [],
  controllerCapabilities = [],
  runtimeCapabilities = [],
  options = {}
}) {
  const initialRoundGoal = firstSafeSemanticText([
    task,
    round.round_goal,
    round.next_transition
  ], { maxLength: SEMANTIC_LIMITS.goal })
    || "Controller must derive this round goal from the operator task, project state, candidate gaps, and evidence.";
  const caseNextTransition = safeSemanticText(round.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition });
  const frame = {
    schema_version: "arckit-loop-frame/v1",
    case_id: round.case_id || "",
    case_updated_at: round.case_updated_at || "",
    project_updated_at: snapshot.projectState?.project?.updated_at || "",
    project_name: snapshot.summary.project_name,
    project_root: snapshot.projectRoot || "",
    operator_task: task,
    runtime_context: options.runtimeContext || null,
    round_goal: initialRoundGoal,
    conversation_locale: options.conversationLocale || round.conversation_locale || "en",
    controller_frame: createControllerFrame({ snapshot, round, task, roundGoal: initialRoundGoal }),
    execution_gate: createExecutionGate({ options }),
    executor_binding: createExecutorBinding({ options }),
    selected_gap: {
      id: round.gap_id,
      scope: "case",
      case_id: round.case_id || "",
      facet: round.facet || "",
      responsibility: round.responsibility || "agent",
      current_state: round.current_state,
      target_state: round.target_state,
      impact: round.impact,
      next_transition: caseNextTransition
    },
    source_projection_check: {
      source_facts: {
        known: round.required_context_refs,
        unknown: [],
        changed_this_round: []
      },
      projection_targets: {
        to_read: round.required_context_refs,
        to_update: [],
        deferred: []
      },
      implementation_evidence: [],
      pending_items: []
    },
    selected_capabilities: selectedCapabilities.map((capability) => capability.id),
    selected_capability_manifests: selectedCapabilities.map((capability) => ({
      id: capability.id,
      kind: capability.kind,
      runtime_role: capability.runtime_role || [],
      binding_targets: capability.binding_targets || [],
      manifest_path: capability.manifest_path,
      source: capability.source || ""
    })),
    selected_capability_contexts: selectedCapabilities.map(toCapabilityContext),
    capability_bindings: capabilityBindings({
      controllerCapabilities,
      runtimeCapabilities,
      workerCapabilities: selectedCapabilities
    }),
    stop_conditions: round.stop_conditions,
    case_control: round.case_control || {},
    candidate_cases: round.candidate_cases || [],
    candidate_case_gaps: round.candidate_case_gaps || [],
    report_intake_rules: createReportIntakeRules(),
    closeout_rules: createCloseoutRules(),
    round_execution_packet: {
      schema_version: "arckit-round-execution-packet/v1",
      controller_frame: null,
      execution_gate: null,
      executor_binding: null,
      worker_packets: [],
      report_intake_rules: null,
      closeout_rules: null
    }
  };
  frame.round_execution_packet.controller_frame = frame.controller_frame;
  frame.round_execution_packet.execution_gate = frame.execution_gate;
  frame.round_execution_packet.executor_binding = frame.executor_binding;
  frame.round_execution_packet.report_intake_rules = frame.report_intake_rules;
  frame.round_execution_packet.closeout_rules = frame.closeout_rules;
  return frame;
}

function createRoutePlanFromPacket(loopFrame) {
  const roles = (loopFrame.worker_packets || []).map((packet) => packet.role).filter(Boolean);
  const workerTypes = (loopFrame.worker_packets || []).map((packet) => packet.worker_type).filter(Boolean);
  return {
    schema_version: "arckit-dynamic-route-plan/v1",
    mode: "packet_execution",
    selected_roles: unique(roles),
    selected_worker_types: unique(workerTypes),
    suppressed_roles: [],
    selected_gap: loopFrame.selected_gap || {},
    reason: "Executing roles from an existing authorized packet.",
    requires_human_confirmation: false
  };
}

function createRoutePlanFromControllerPlan({ controllerPlan, loopFrame }) {
  const plannedRoles = unique(arrayOfStrings(controllerPlan?.worker_intents?.map((intent) => intent.role)));
  const plannedWorkerTypes = unique(arrayOfStrings(controllerPlan?.worker_intents?.map((intent) => intent.worker_type)).map(normalizeWorkerType));
  return {
    schema_version: "arckit-dynamic-route-plan/v1",
    mode: controllerPlan?.route_plan?.mode || "agent_selected_route",
    selected_roles: plannedRoles,
    selected_worker_types: plannedWorkerTypes,
    suppressed_roles: [],
    selected_gap: normalizeSelectedGap(controllerPlan?.route_plan?.selected_gap) || loopFrame.selected_gap,
    reason: [
      controllerPlan?.route_plan?.reason || "",
      controllerPlan?.summary ? `Controller Agent: ${controllerPlan.summary}` : ""
    ].filter(Boolean).join(" "),
    requires_human_confirmation: controllerPlan?.route_plan?.requires_human_confirmation === true
  };
}

export function createAgentTasks({ loopFrame, round, snapshot, task, selectedCapabilities = [], controllerPlan = null }) {
  const intents = Array.isArray(controllerPlan?.worker_intents) ? controllerPlan.worker_intents : [];
  const availableCapabilityIds = capabilityIds(selectedCapabilities);
  const contextRefs = workerContextRefs({ snapshot, round, caseId: loopFrame.case_id });
  const contextDigest = createWorkerContextDigest({ snapshot, loopFrame, contextRefs });
  const userRequestExcerpt = firstSafeSemanticText([
    controllerPlan?.continuation_intent?.goal,
    loopFrame.round_goal,
    task
  ], { maxLength: SEMANTIC_LIMITS.workerUserRequest });
  return intents.map((intent, index) => {
    const workerType = normalizeWorkerType(intent.worker_type);
    const role = intent.role || workerType;
    const allowedSkills = unique(arrayOfStrings(intent.allowed_skills));
    const invalidBindings = allowedSkills.filter((skill) => !availableCapabilityIds.has(skill));
    if (invalidBindings.length > 0) {
      throw new Error(`Worker intent ${role} bound non-worker or unavailable capabilities: ${invalidBindings.join(", ")}.`);
    }
    const capabilityContexts = selectedCapabilities
      .filter((capability) => allowedSkills.includes(capability.id))
      .map(toCapabilityContext);
    const agentTask = {
      schema_version: "arckit-worker-task/v1",
      id: `TASK-${String(index + 1).padStart(2, "0")}-${role}`,
      worker_type: workerType,
      workstream_id: normalizeWorkstreamId(intent.workstream_id),
      role,
      objective: intent.objective,
      conversation_locale: loopFrame.conversation_locale || round.conversation_locale || "en",
      loop_frame_excerpt: {
        case_id: loopFrame.case_id,
        case_updated_at: loopFrame.case_updated_at,
        round_goal: safeSemanticText(loopFrame.round_goal, { maxLength: SEMANTIC_LIMITS.goal }),
        conversation_locale: loopFrame.conversation_locale || round.conversation_locale || "en",
        selected_gap: loopFrame.route_plan?.selected_gap || loopFrame.selected_gap,
        selected_capabilities: allowedSkills,
        stop_conditions: loopFrame.stop_conditions
      },
      inputs: {
        user_request_excerpt: userRequestExcerpt,
        known_state_paths: contextRefs,
        context_digest: contextDigest,
        known_facts: [
          `project=${snapshot.summary.project_name}`,
          `phase=${snapshot.summary.current_phase}`,
          `selected_gap=${loopFrame.route_plan?.selected_gap?.id || round.gap_id}`
        ],
        capability_contexts: capabilityContexts,
        assumptions: [],
        pending_questions: []
      },
      scope: {
        allowed_paths: intent.allowed_paths,
        allowed_skills: allowedSkills,
        allowed_actions: intent.allowed_actions,
        forbidden_actions: intent.forbidden_actions
      },
      expected_output: {
        format: "arckit-worker-report/v2",
        required_fields: [
          "task_id",
          "worker_type",
          "role",
          "status",
          "summary",
          "findings",
          "evidence",
          "changes",
          "artifact_impacts",
          "case_state_claims",
          "risks",
          "unknowns",
          "recommendation",
          "requires_main_agent_decision",
          "requires_human_decision"
        ]
      },
      expected_case_impact: intent.expected_case_impact,
      stop_condition: intent.stop_condition
    };
    return {
      ...agentTask,
      worker_thread_key: workerThreadKeyForTask(agentTask)
    };
  });
}

export function workerThreadKeyForTask(agentTask) {
  const caseId = String(agentTask?.loop_frame_excerpt?.case_id || "").trim();
  const workerType = normalizeWorkerType(agentTask?.worker_type);
  const workstreamId = normalizeWorkstreamId(agentTask?.workstream_id);
  if (!caseId) {
    return "";
  }
  return `worker:${caseId}:${workerType}:${workstreamId}`;
}

export function controllerThreadKey({ phase, caseId = "" } = {}) {
  if (phase === "review" && String(caseId || "").trim()) {
    return `controller:case:${String(caseId).trim()}:review`;
  }
  return "controller:project:planning";
}

export function normalizeWorkstreamId(value, fallback = "default") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

export function workerContextScopeSignature(agentTask) {
  const paths = arrayOfStrings(agentTask?.scope?.allowed_paths).map(normalizeScopeValue).sort();
  const skills = arrayOfStrings(agentTask?.scope?.allowed_skills).map(normalizeScopeValue).sort();
  return createHash("sha256").update(JSON.stringify({ paths, skills })).digest("hex").slice(0, 16);
}

export function compileAgentTaskPrompt({ agentTask, previousReports }) {
  const runtimeInput = {
    schema_version: "arckit-agent-invocation/v1",
    phase: "worker",
    conversation_locale: agentTask.conversation_locale || agentTask.loop_frame_excerpt?.conversation_locale || "en",
    execution_context: {
      thread_key: agentTask.worker_thread_key || "",
      workstream_id: agentTask.workstream_id || "",
      authorization_rule: "current_task_packet_supersedes_prior_thread_context"
    },
    task_packet: toWorkerPacket(agentTask),
    previous_reports: previousReports
  };
  return [
    formatExplicitSkillTriggers(agentTask.scope?.allowed_skills),
    JSON.stringify(runtimeInput, null, 2)
  ].filter(Boolean).join("\n\n");
}

export function createWorkerContextDigest({ snapshot, loopFrame, contextRefs = [] }) {
  const caseId = String(loopFrame?.case_id || "").trim();
  const activeCase = (snapshot?.activeCases || []).find((item) => item.record?.id === caseId);
  const record = activeCase?.record || {};
  const selectedGap = loopFrame?.route_plan?.selected_gap || loopFrame?.selected_gap || {};
  const facet = String(selectedGap.facet || "");
  const facetState = record.facets?.[facet] || {};
  return {
    schema_version: "arckit-worker-context-digest/v1",
    authority: "current_packet_and_canonical_facts_supersede_thread_history",
    case_id: caseId,
    case_updated_at: String(record.updated_at || loopFrame?.case_updated_at || ""),
    case_intent: safeSemanticText(record.user_intent || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    expected_outcome: safeSemanticText(record.expected_outcome || "", { maxLength: SEMANTIC_LIMITS.contextSummary }),
    selected_facet: facet,
    facet_state: {
      applicability: String(facetState.applicability || "unknown"),
      maturity: String(facetState.maturity || "unknown"),
      alignment: String(facetState.alignment || "unknown"),
      resolution: String(facetState.resolution || "unresolved"),
      reason: safeSemanticText(facetState.reason || "", { maxLength: SEMANTIC_LIMITS.reason }),
      evidence: arrayOfStrings(facetState.evidence).slice(-12)
    },
    recent_transitions: (Array.isArray(record.rounds) ? record.rounds : []).slice(-3).map((item, index) => ({
      round: Number(item.round || Math.max(1, (record.rounds?.length || 0) - 2 + index)),
      goal: safeSemanticText(item.goal || "", { maxLength: SEMANTIC_LIMITS.goal }),
      outcome: String(item.outcome || ""),
      state_change: safeSemanticText(item.planned_transition || "", { maxLength: SEMANTIC_LIMITS.transition }),
      evidence: arrayOfStrings(item.evidence).slice(-8)
    })),
    open_questions: summarizeCaseItems(record.open_questions, 8),
    pending_handoffs: summarizeCaseItems(record.pending_handoffs, 8),
    context_refs: unique(arrayOfStrings(contextRefs)).slice(0, 24)
  };
}

export function workerContextRefs({ snapshot, round, caseId }) {
  const activeCase = (snapshot?.activeCases || []).find((item) => item.record?.id === caseId);
  const refs = unique([
    ...(round?.required_context_refs || []),
    activeCase?.ref || ""
  ].map((value) => String(value || "").trim()));
  return refs.filter((ref) => {
    if (!ref.includes("arckit/cases/active/") && !ref.startsWith("case:")) return true;
    return ref.includes(String(caseId || ""));
  });
}

function normalizeWorkerContextDigest(value, loopFrame, contextRefs) {
  if (value?.schema_version === "arckit-worker-context-digest/v1") {
    return value;
  }
  return createWorkerContextDigest({ snapshot: { activeCases: [] }, loopFrame, contextRefs });
}

function summarizeCaseItems(items, limit) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => !["resolved", "completed", "cancelled"].includes(String(item?.status || "")))
    .map((item) => safeSemanticText(
      typeof item === "string" ? item : item?.question || item?.statement || item?.summary || item?.reason || item?.id || "",
      { maxLength: SEMANTIC_LIMITS.reason }
    ))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeScopeValue(value) {
  return String(value || "").trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function isValidWorkstreamId(value) {
  return /^[a-z0-9][a-z0-9._-]{0,79}$/.test(String(value || ""));
}

function formatExplicitSkillTriggers(skills) {
  const allowedSkills = unique(Array.isArray(skills) ? skills.map((skill) => String(skill)).filter(Boolean) : []);
  if (allowedSkills.length === 0) {
    return "";
  }
  return allowedSkills.map((skill) => `$${skill}`).join("\n");
}

function expandAgentTaskScopeWithPreviousChanges(agentTask, previousReports, previousPackets = []) {
  const changedPaths = normalizeArtifactPathReferences(previousReports.flatMap((report) => artifactPathsFromReport(report, previousPackets)));
  if (changedPaths.length === 0) {
    return agentTask;
  }
  return {
    ...agentTask,
    inputs: {
      ...agentTask.inputs,
      known_state_paths: unique([
        ...(agentTask.inputs?.known_state_paths || []),
        ...changedPaths
      ])
    },
    scope: {
      ...agentTask.scope,
      allowed_paths: unique([
        ...(agentTask.scope?.allowed_paths || []),
        ...changedPaths
      ])
    }
  };
}

function artifactPathsFromReport(report, previousPackets = []) {
  const packet = previousPackets.find((item) => item.worker_id === report?.task_id);
  return Array.isArray(report?.artifact_impacts)
    ? report.artifact_impacts
      .map((impact) => normalizeArtifactPathReferences([impact.artifact])[0] || "")
      .filter((artifact) => artifact && (!packet || artifactAllowedByPacket(artifact, packet)))
    : [];
}

function artifactAllowedByPacket(artifact, packet) {
  return artifactPathAllowedByPatterns(artifact, packet.allowed_paths);
}

export function mergeAgentReports({ reports, loopFrame, round, compiledPrompt, dryRun, controllerReview }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || compiledPrompt.conversation_locale || "en";
  const review = controllerReview?.review || null;
  const reviewUsable = controllerReview?.usable === true;
  const zeroWorkerTransition = (loopFrame.worker_packets || []).length === 0
    && reviewUsable
    && caseDeltaHasChanges(review.accepted_case_state_delta);
  const reducerResult = reduceWorkerReports({
    reports,
    loopFrame,
    round,
    dryRun,
    conversationLocale,
    allowNoWorkers: zeroWorkerTransition,
    controllerEvidence: reviewUsable ? review.evidence : []
  });
  const reviewStatus = reviewUsable ? review.status : "blocked";
  const reviewLoopGate = reviewUsable
    ? {
      status: reviewStatus,
      next_responsibility: reviewStatus === "done" ? "none" : reviewStatus === "external_wait" ? "external" : review.human_decision_required || reviewStatus === "needs_human" ? "human" : "agent",
      trigger_mode: reviewStatus === "done" ? "none" : reviewStatus === "external_wait" ? "external_wait" : review.human_decision_required || reviewStatus === "needs_human" ? "user_decision" : "manual_bridge",
      human_decision_required: review.human_decision_required || reviewStatus === "needs_human",
      reason: review.summary
    }
    : {
      status: "blocked",
      next_responsibility: "agent",
      trigger_mode: "manual_bridge",
      human_decision_required: false,
      reason: controllerReview?.failure_reason || "Controller Agent review is required before merge can close."
    };
  const guarded = applyRuntimeGuardToLoopGate({
    reviewLoopGate,
    reducerResult,
    reviewUsable,
    conversationLocale
  });
  const loopGate = guarded.loop_gate;
  const decision = loopGate.status === "done" ? "accepted" : loopGate.status === "blocked" ? "blocked" : "continue";
  const reportIntake = reviewUsable
    ? reviewedReportIntake(reducerResult.report_intake, review)
    : reducerResult.report_intake;

  return {
    schema_version: "arckit-merge-result/v1",
    decision,
    accepted_reports: reviewUsable ? review.accepted_reports : reducerResult.accepted_reports,
    partial_reports: reducerResult.partial_reports,
    blocked_reports: reducerResult.blocked_reports,
    rejected_reports: reviewUsable ? review.rejected_reports : reducerResult.rejected_reports,
    evidence: reducerResult.evidence,
    changed_files: reducerResult.changed_files,
    risks: unique([...reducerResult.risks, ...(reviewUsable ? review.risks : [])]),
    unknowns: unique([...reducerResult.unknowns, ...(reviewUsable ? review.unknowns : [])]),
    artifact_ownership_scan: reducerResult.artifact_ownership_scan,
    source_projection_check: reducerResult.source_projection_check,
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    report_intake: reportIntake,
    loop_gate: loopGate,
    controller_reducer_result: {
      ...reducerResult,
      controller_review: review || null,
      controller_review_failure_reason: controllerReview?.failure_reason || "",
      controller_review_loop_gate: reviewLoopGate,
      runtime_guard: guarded.runtime_guard,
      decision,
      loop_gate: loopGate
    },
    next_prompt: reviewUsable && review.next_prompt ? review.next_prompt : dryRun
      ? t(conversationLocale, `Use the generated worker packets for ${loopFrame.case_id || round.gap_id}, then return worker reports to the Arckit Controller.`, `使用为 ${loopFrame.case_id || round.gap_id} 生成的 worker packets，然后把 worker reports 返回给 Arckit Controller。`)
      : t(conversationLocale, `Continue Arckit loop for ${loopFrame.case_id || round.gap_id}: resolve remaining risks and write eligible ledger updates.`, `继续 ${loopFrame.case_id || round.gap_id} 的 Arckit loop：解决剩余风险，并写入符合条件的 ledger 更新。`)
  };
}

function reviewedReportIntake(reducerIntake, review) {
  const accepted = new Set(review.accepted_reports || []);
  return {
    ...reducerIntake,
    accepted: [...accepted],
    rejected: [...(review.rejected_reports || [])],
    needs_revision: (reducerIntake.needs_revision || []).filter((id) => !accepted.has(id)),
    needs_controller_decision: (reducerIntake.needs_controller_decision || []).filter((id) => !accepted.has(id))
  };
}

function applyRuntimeGuardToLoopGate({ reviewLoopGate, reducerResult, reviewUsable, conversationLocale }) {
  const hardGate = reducerResult?.hard_gate || {
    status: reducerResult?.loop_gate?.status === "done" ? "pass" : reducerResult?.loop_gate?.status || "blocked",
    can_close: reducerResult?.loop_gate?.status === "done",
    blockers: reducerResult?.source_projection_check?.blocked_projections || [],
    reason: reducerResult?.loop_gate?.reason || "Runtime Guard could not prove the round can close."
  };
  const runtimeGuard = {
    schema_version: "arckit-runtime-guard/v1",
    status: hardGate.status,
    can_close: hardGate.can_close === true,
    blockers: normalizeRuntimeGuardBlockers(hardGate.blockers),
    reason: hardGate.reason || ""
  };
  if (!reviewUsable) {
    return {
      runtime_guard: runtimeGuard,
      loop_gate: reviewLoopGate
    };
  }
  if (reviewLoopGate.status === "done" && !runtimeGuard.can_close) {
    const status = runtimeGuard.status === "needs_human"
      ? "needs_human"
      : runtimeGuard.status === "blocked"
        ? "blocked"
        : "continue";
    return {
      runtime_guard: {
        ...runtimeGuard,
        vetoed_controller_review: true
      },
      loop_gate: {
        status,
        next_responsibility: status === "needs_human" ? "human" : "agent",
        trigger_mode: status === "needs_human" ? "user_decision" : "manual_bridge",
        human_decision_required: status === "needs_human",
        reason: t(conversationLocale, `Runtime Guard vetoed Controller Review done: ${runtimeGuard.reason}`, `Runtime Guard 否决了 Controller Review 的 done 判断：${runtimeGuard.reason}`)
      }
    };
  }
  if (runtimeGuard.status === "blocked" && !["blocked", "needs_human"].includes(reviewLoopGate.status)) {
    return {
      runtime_guard: {
        ...runtimeGuard,
        vetoed_controller_review: true
      },
      loop_gate: {
        status: "blocked",
        next_responsibility: "agent",
        trigger_mode: "manual_bridge",
        human_decision_required: false,
        reason: t(conversationLocale, `Runtime Guard blocked merge: ${runtimeGuard.reason}`, `Runtime Guard 阻断了 merge：${runtimeGuard.reason}`)
      }
    };
  }
  if (runtimeGuard.status === "agent_recoverable" && reviewLoopGate.status === "done") {
    return {
      runtime_guard: {
        ...runtimeGuard,
        vetoed_controller_review: true
      },
      loop_gate: {
        status: "continue",
        next_responsibility: "agent",
        trigger_mode: "auto_bridge",
        human_decision_required: false,
        reason: t(conversationLocale, `Runtime Guard found agent-recoverable follow-up work: ${runtimeGuard.reason}`, `Runtime Guard 发现可由 Agent 继续处理的后续工作：${runtimeGuard.reason}`)
      }
    };
  }
  if (runtimeGuard.status === "needs_human" && reviewLoopGate.status === "continue") {
    return {
      runtime_guard: {
        ...runtimeGuard,
        vetoed_controller_review: true
      },
      loop_gate: {
        status: "needs_human",
        next_responsibility: "human",
        trigger_mode: "user_decision",
        human_decision_required: true,
        reason: t(conversationLocale, `Runtime Guard requires human decision: ${runtimeGuard.reason}`, `Runtime Guard 要求人类决策：${runtimeGuard.reason}`)
      }
    };
  }
  return {
    runtime_guard: {
      ...runtimeGuard,
      vetoed_controller_review: false
    },
    loop_gate: reviewLoopGate
  };
}

function normalizeRuntimeGuardBlockers(blockers) {
  if (!Array.isArray(blockers)) {
    return [];
  }
  return blockers.map((blocker) => {
    if (blocker && typeof blocker === "object") {
      return {
        type: stringValue(blocker.type, "unknown"),
      severity: ["recoverable", "needs_human", "blocked"].includes(blocker.severity) ? blocker.severity : "blocked",
        recoverable_by: ["agent", "human", "runtime", "none"].includes(blocker.recoverable_by) ? blocker.recoverable_by : "none",
        target: stringValue(blocker.target, ""),
        suggested_action: stringValue(blocker.suggested_action, ""),
        summary: stringValue(blocker.summary, "")
      };
    }
    return {
      type: "unknown",
      severity: "blocked",
      recoverable_by: "none",
      target: "",
      suggested_action: "",
      summary: String(blocker || "")
    };
  }).filter((blocker) => blocker.summary);
}

function createControllerUnavailableMergeResult({ loopFrame, round, controllerPlan, conversationLocale }) {
  const reason = controllerPlan?.failure_reason || "Controller Agent planning is required before worker dispatch.";
  const needsHuman = controllerPlan?.plan?.status === "needs_human"
    || controllerPlan?.plan?.route_plan?.requires_human_confirmation === true;
  const loopStatus = needsHuman ? "needs_human" : "blocked";
  const decision = needsHuman ? "continue" : "blocked";
  const nextResponsibility = needsHuman ? "human" : "agent";
  const triggerMode = needsHuman ? "user_decision" : "manual_bridge";
  const artifactOwnershipScan = buildArtifactOwnershipScan([]);
  return {
    schema_version: "arckit-merge-result/v1",
    decision,
    accepted_reports: [],
    partial_reports: [],
    blocked_reports: [],
    rejected_reports: [],
    evidence: ["controller_plan"],
    changed_files: [],
    risks: [reason],
    unknowns: [],
    artifact_ownership_scan: artifactOwnershipScan,
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: true,
      deferred_projections: [],
      blocked_projections: [reason]
    },
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    report_intake: {
      accepted: [],
      rejected: [],
      needs_revision: [],
      needs_controller_decision: [],
      needs_human_decision: needsHuman ? [reason] : [],
      missing: []
    },
    loop_gate: {
      status: loopStatus,
      next_responsibility: nextResponsibility,
      trigger_mode: triggerMode,
      human_decision_required: needsHuman,
      reason
    },
    controller_reducer_result: {
      schema_version: "arckit-controller-reducer-result/v1",
      decision,
      reducer_actions: [],
      accepted_reports: [],
      partial_reports: [],
      blocked_reports: [],
      rejected_reports: [],
      evidence: ["controller_plan"],
      changed_files: [],
      risks: [reason],
      unknowns: [],
      artifact_ownership_scan: artifactOwnershipScan,
      source_projection_check: {
        source_facts_changed: [],
        projection_artifacts_changed: [],
        source_unknown: true,
        deferred_projections: [],
        blocked_projections: [reason]
      },
      report_intake: {
        accepted: [],
        rejected: [],
        needs_revision: [],
        needs_controller_decision: [],
        needs_human_decision: needsHuman ? [reason] : [],
        missing: []
      },
      loop_gate: {
        status: loopStatus,
        next_responsibility: nextResponsibility,
        trigger_mode: triggerMode,
        human_decision_required: needsHuman,
        reason
      },
      controller_plan: controllerPlan?.plan || null
    },
    next_prompt: needsHuman
      ? t(conversationLocale, `Resolve the Controller Agent human decision for ${loopFrame.case_id || round.gap_id}, then run Controller planning again.`, `先处理 ${loopFrame.case_id || round.gap_id} 的 Controller Agent 人类决策，再重新执行 Controller planning。`)
      : t(conversationLocale, `Retry Controller planning for ${loopFrame.case_id || round.gap_id} and return a valid arckit-controller-plan/v3.`, `重新为 ${loopFrame.case_id || round.gap_id} 执行 Controller planning，并返回有效的 arckit-controller-plan/v3。`)
  };
}

function createPacketPreviewMergeResult({ loopFrame, round }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || "en";
  const missingWorkers = (loopFrame.worker_packets || []).map((packet) => packet.worker_id).filter(Boolean);
  const reason = missingWorkers.length > 0
    ? t(conversationLocale, "Controller preview loaded existing worker packets only; execution is pending authorization.", "Controller Preview 只加载已有 worker packets；执行仍在等待授权。")
    : t(conversationLocale, "Controller preview cannot generate worker packets without executing Controller Agent planning.", "没有执行 Controller Agent planning 时，Controller Preview 不能生成 worker packets。");
  const artifactOwnershipScan = buildArtifactOwnershipScan([]);
  return {
    schema_version: "arckit-merge-result/v1",
    decision: "continue",
    accepted_reports: [],
    partial_reports: [],
    blocked_reports: [],
    rejected_reports: [],
    evidence: [
      "round_execution_packet",
      "controller_frame",
      "execution_gate",
      "worker_packets"
    ],
    changed_files: [],
    risks: [],
    unknowns: [],
    artifact_ownership_scan: artifactOwnershipScan,
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: false,
      deferred_projections: missingWorkers.length > 0 ? ["worker execution", "worker report intake", "ledger writeback"] : ["controller planning", "worker execution", "worker report intake", "ledger writeback"],
      blocked_projections: [t(conversationLocale, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - executor not authorized`, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - 执行器未授权`)]
    },
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    report_intake: {
      accepted: [],
      rejected: [],
      needs_revision: [],
      needs_controller_decision: [],
      needs_human_decision: [],
      missing: missingWorkers
    },
    loop_gate: {
      status: "continue",
      next_responsibility: "human",
      trigger_mode: "user_decision",
      human_decision_required: true,
      reason
    },
    controller_reducer_result: {
      schema_version: "arckit-controller-reducer-result/v1",
      decision: "continue",
      reducer_actions: [],
      accepted_reports: [],
      partial_reports: [],
      blocked_reports: [],
      rejected_reports: [],
      evidence: [],
      changed_files: [],
      risks: [],
      unknowns: [],
      artifact_ownership_scan: artifactOwnershipScan,
      source_projection_check: {
        source_facts_changed: [],
        projection_artifacts_changed: [],
        source_unknown: false,
          deferred_projections: missingWorkers.length > 0 ? ["worker execution", "worker report intake", "ledger writeback"] : ["controller planning", "worker execution", "worker report intake", "ledger writeback"],
        blocked_projections: [t(conversationLocale, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - executor not authorized`, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - 执行器未授权`)]
      },
      report_intake: {
        accepted: [],
        rejected: [],
        needs_revision: [],
        needs_controller_decision: [],
        needs_human_decision: [],
        missing: missingWorkers
      },
      loop_gate: {
        status: "continue",
        next_responsibility: "human",
        trigger_mode: "user_decision",
        human_decision_required: true,
        reason
      }
    },
    next_prompt: missingWorkers.length > 0
      ? t(conversationLocale, `Authorize execution for ${loopFrame.case_id || round.gap_id}, or copy the existing worker packets to worker Agent chats and return reports to the Arckit Controller.`, `授权执行 ${loopFrame.case_id || round.gap_id}，或把已有 worker packets 复制到 worker Agent 对话，再把 reports 返回给 Arckit Controller。`)
      : t(conversationLocale, `Run Controller Agent planning for ${loopFrame.case_id || round.gap_id} before worker packet execution.`, `先为 ${loopFrame.case_id || round.gap_id} 执行 Controller Agent planning，再执行 worker packets。`)
  };
}

function reportIsComplete(report) {
  if (!report || typeof report !== "object") {
    return false;
  }
  const arrays = ["findings", "evidence", "changes", "artifact_impacts", "case_state_claims", "risks", "unknowns"];
  return report.schema_version === "arckit-worker-report/v2"
    && Boolean(report.task_id)
    && WORKER_TYPES.includes(report.worker_type)
    && typeof report.role === "string"
    && report.role.length > 0
    && ["completed", "partial", "blocked", "failed", "invalid"].includes(report.status)
    && typeof report.summary === "string"
    && typeof report.recommendation === "string"
    && typeof report.requires_main_agent_decision === "boolean"
    && typeof report.requires_human_decision === "boolean"
    && arrays.every((key) => Array.isArray(report[key]));
}

function isInfrastructureFailureReport(report) {
  if (!report || !["failed", "invalid"].includes(report.status)) {
    return false;
  }
  const text = [
    report.summary,
    report.recommendation,
    ...(Array.isArray(report.risks) ? report.risks : [])
  ].join("\n");
  return /Codex worker failed before returning|invalid_json_schema|Codex app-server|response_format|systemError/i.test(text);
}

function toCapabilityContext(capability) {
  return {
    id: capability.id,
    protocol_revision: capability.protocol_revision || "",
    kind: capability.kind || "",
    runtime_role: capability.runtime_role || [],
    binding_targets: capability.binding_targets || [],
    summary: capability.summary || "",
    input_facts: capability.input_facts || [],
    outputs: capability.outputs || [],
    allowed_write_targets: capability.allowed_write_targets || [],
    forbidden_decisions: capability.forbidden_decisions || [],
    runtime_notes: capability.runtime_notes || [],
    manifest_path: capability.manifest_path || "",
    source: capability.source || ""
  };
}

function toCapabilityRef(capability) {
  return {
    id: capability.id,
    protocol_revision: capability.protocol_revision || "",
    binding_targets: capability.binding_targets || [],
    invocation: {
      type: capability.invocation?.type || "none",
      phases: capability.invocation?.phases || []
    },
    runtime_entrypoints: Object.keys(capability.runtime_entrypoints || {}).sort(),
    manifest_path: capability.manifest_path || "",
    source: capability.source || ""
  };
}

function capabilityBindings({ controllerCapabilities = [], runtimeCapabilities = [], workerCapabilities = [] }) {
  return {
    schema_version: "arckit-capability-bindings/v1",
    controller_capability_ids: [...capabilityIds(controllerCapabilities)],
    runtime_capability_ids: [...capabilityIds(runtimeCapabilities)],
    worker_capability_ids: [...capabilityIds(workerCapabilities)]
  };
}

function createControllerFrame({ snapshot, round, task, roundGoal = "" }) {
  const hasTask = Boolean(String(task || "").trim());
  return {
    schema_version: "arckit-controller-frame/v1",
    case_id: round.case_id || "",
    turn_delta: {
      relation_to_previous_loop: hasTask ? "continue_case" : "resume_next_prompt",
      reason: hasTask ? "Operator supplied a project task for this round." : "No explicit task supplied; continue from project state and loop handoff.",
      packet_effect: hasTask ? "revise" : "keep"
    },
    round_goal: roundGoal || safeSemanticText(round.round_goal, { maxLength: SEMANTIC_LIMITS.goal }),
    round_status: "planning",
    old_packet_valid: true,
    selected_gap: {
      id: round.gap_id,
      scope: "case",
      case_id: round.case_id || "",
      facet: round.facet || "",
      responsibility: round.responsibility || "agent"
    },
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      implementation_evidence: [],
      pending_items: [],
      source_unknown: false
    }
  };
}

function createExecutionGate({ options }) {
  const authorized = !options.dryRun;
  const conversationLocale = options.conversationLocale || "en";
  return {
    schema_version: "arckit-execution-gate/v1",
    status: authorized ? "authorized" : "pending",
    required_decision: authorized
      ? t(conversationLocale, "Desktop Run or CLI execute mode authorized executor binding for this round.", "Desktop Run 或 CLI execute 模式已为本轮授权 executor binding。")
      : t(conversationLocale, "Authorize execution or copy worker packets to external worker Agent chats.", "请授权执行，或把 worker packets 复制到外部 worker Agent 对话。"),
    allowed_executors: ["human_runtime", "desktop_runtime", "current_agent", "external_agent"],
    executor_binding_required: true
  };
}

function createExecutorBinding({ options }) {
  const conversationLocale = options.conversationLocale || "en";
  if (options.dryRun) {
    return {
      schema_version: "arckit-executor-binding/v1",
      executor: "none",
      authorization_source: "none",
      reason: t(conversationLocale, "Dry-run does not execute Controller Agent planning or worker turns.", "Dry-run 不执行 Controller Agent planning 或 worker turns。")
    };
  }
  return {
    schema_version: "arckit-executor-binding/v1",
    executor: "desktop_runtime",
    authorization_source: "desktop_run",
    reason: t(conversationLocale, "The operator started an executing runtime run.", "操作者启动了执行型 runtime run。")
  };
}

function authorizePacketLoopFrame(loopFrame, options) {
  const frame = JSON.parse(JSON.stringify(loopFrame || {}));
  frame.conversation_locale ||= options.conversationLocale || frame.controller_frame?.conversation_locale || "en";
  const conversationLocale = frame.conversation_locale;
  frame.execution_gate = {
    ...(frame.execution_gate || {}),
    schema_version: "arckit-execution-gate/v1",
    status: "authorized",
    required_decision: t(conversationLocale, `Execution authorized from packet file ${options.packetFile || ""}.`, `已从 packet file ${options.packetFile || ""} 授权执行。`),
    allowed_executors: frame.execution_gate?.allowed_executors || ["human_runtime", "desktop_runtime", "current_agent", "external_agent"],
    executor_binding_required: true
  };
  frame.executor_binding = {
    schema_version: "arckit-executor-binding/v1",
    executor: "desktop_runtime",
    authorization_source: "desktop_run",
    reason: t(conversationLocale, `Desktop Runtime is executing an existing packet from ${options.packetFile || "packet file"}.`, `Desktop Runtime 正在执行来自 ${options.packetFile || "packet file"} 的既有 packet。`)
  };
  frame.round_execution_packet ||= {
    schema_version: "arckit-round-execution-packet/v1",
    controller_frame: null,
    execution_gate: null,
    executor_binding: null,
    worker_packets: [],
    report_intake_rules: null,
    closeout_rules: null
  };
  frame.round_execution_packet.execution_gate = frame.execution_gate;
  frame.round_execution_packet.executor_binding = frame.executor_binding;
  frame.worker_packets = Array.isArray(frame.worker_packets) ? frame.worker_packets : frame.round_execution_packet.worker_packets || [];
  return frame;
}

export function normalizePacketWorkerTasks(tasks, loopFrame, workerCapabilities = []) {
  return tasks.map((task, index) => {
    const taskFrame = task.loop_frame_excerpt;
    if (!taskFrame?.case_updated_at || taskFrame.case_updated_at !== loopFrame.case_updated_at || taskFrame.case_id !== loopFrame.case_id) {
      throw new Error(`Authorized packet worker ${task.role || task.id || index + 1} is not bound to the current Case revision.`);
    }
    for (const field of ["id", "facet", "responsibility", "current_state", "target_state", "next_transition"]) {
      if (taskFrame.selected_gap?.[field] !== loopFrame.selected_gap?.[field]) {
        throw new Error(`Authorized packet worker ${task.role || task.id || index + 1} has a stale selected gap: ${field} differs.`);
      }
    }
    const requestedSkills = unique(arrayOfStrings(task.scope?.allowed_skills || task.allowed_skills));
    const packetContextRefs = unique(arrayOfStrings(task.inputs?.known_state_paths || task.context_refs));
    const packetContextDigest = normalizeWorkerContextDigest(task.inputs?.context_digest || task.context_digest, loopFrame, packetContextRefs);
    const invalidBindings = invalidCapabilityBindings(requestedSkills, workerCapabilities);
    if (invalidBindings.length > 0) {
      throw new Error(`Authorized packet worker ${task.role || task.id || index + 1} bound non-worker or unavailable capabilities: ${invalidBindings.join(", ")}.`);
    }
    const agentTask = {
      ...task,
      schema_version: "arckit-worker-task/v1",
      id: task.id || task.worker_id || `TASK-${String(index + 1).padStart(2, "0")}-${task.role || "worker"}`,
      worker_type: normalizeWorkerType(task.worker_type),
      workstream_id: normalizeWorkstreamId(task.workstream_id, "legacy"),
      role: task.role || "agent_defined_worker",
      objective: task.objective || task.task || "",
      conversation_locale: task.conversation_locale || loopFrame.conversation_locale || "en",
      loop_frame_excerpt: task.loop_frame_excerpt || {
        case_id: loopFrame.case_id || "",
        case_updated_at: loopFrame.case_updated_at || "",
        round_goal: loopFrame.round_goal || "",
        conversation_locale: loopFrame.conversation_locale || task.conversation_locale || "en",
        selected_gap: loopFrame.selected_gap || {},
        selected_capabilities: requestedSkills,
        stop_conditions: loopFrame.stop_conditions || []
      },
      inputs: task.inputs ? {
        ...task.inputs,
        known_state_paths: packetContextRefs,
        context_digest: packetContextDigest
      } : {
        user_request_excerpt: firstSafeSemanticText([
          loopFrame.round_goal,
          loopFrame.operator_task
        ], { maxLength: SEMANTIC_LIMITS.workerUserRequest }),
        known_state_paths: packetContextRefs,
        context_digest: packetContextDigest,
        known_facts: [],
        capability_contexts: [],
        assumptions: [],
        pending_questions: []
      },
      scope: task.scope ? {
        ...task.scope,
        allowed_skills: requestedSkills
      } : {
        allowed_paths: task.allowed_paths || [],
        allowed_skills: requestedSkills,
        allowed_actions: task.allowed_actions || [],
        forbidden_actions: task.forbidden_actions || []
      },
      expected_output: task.expected_output || {
        format: "arckit-worker-report/v2",
        required_fields: [
          "task_id",
          "worker_type",
          "role",
          "status",
          "summary",
          "findings",
          "evidence",
          "changes",
          "artifact_impacts",
          "case_state_claims",
          "risks",
          "unknowns",
          "recommendation",
          "requires_main_agent_decision",
          "requires_human_decision"
        ]
      },
      expected_case_impact: task.expected_case_impact || loopFrame.selected_gap?.next_transition || 'Produce evidence for the selected Case gap.',
      stop_condition: task.stop_condition || ""
    };
    return {
      ...agentTask,
      worker_thread_key: workerThreadKeyForTask(agentTask)
    };
  });
}

function createReportIntakeRules() {
  return {
    schema_version: "arckit-report-intake-rules/v1",
    accept_when: [
      "worker_id/task_id matches an issued worker packet",
      "role remains within packet scope",
      "status and evidence support the claimed outcome",
      "risks and unknowns are explicit"
    ],
    reject_when: [
      "worker expanded scope or changed project direction",
      "report shape is invalid",
      "completed claim lacks evidence"
    ],
    needs_revision_when: [
      "report is partial",
      "required fields or evidence are missing",
      "stable fact changes are claimed without owning capability evidence"
    ],
    needs_more_workers_when: [
      "verification is missing",
      "source/projection impact is unresolved",
      "risks or unknowns remain"
    ]
  };
}

function createCloseoutRules() {
  return {
    schema_version: "arckit-closeout-rules/v1",
    done_when: [
      "round_goal is satisfied",
      "required worker reports are accepted",
      "evidence and changed files are traceable",
      "source/projection impact is separated",
      "case or loop handoff is recoverable"
    ],
    continue_when: [
      "next step is still agent/runtime work",
      "worker reports are missing or need revision",
      "dry-run has no Controller Agent plan or worker execution evidence"
    ],
    needs_human_when: [
      "human judgment, authorization, priority, aesthetics, risk acceptance, or release responsibility is required"
    ],
    blocked_when: [
      "state, permission, tool, dependency, or valid report is missing"
    ],
    external_wait_when: [
      "an external system or out-of-band action must complete first"
    ]
  };
}

function toWorkerPacket(agentTask) {
  return {
    schema_version: "arckit-worker-packet/v2",
    worker_id: agentTask.id,
    worker_type: agentTask.worker_type,
    workstream_id: normalizeWorkstreamId(agentTask.workstream_id, "legacy"),
    role: agentTask.role,
    task: agentTask.objective,
    case_context: {
      case_id: agentTask.loop_frame_excerpt.case_id,
      case_updated_at: agentTask.loop_frame_excerpt.case_updated_at,
      selected_gap: agentTask.loop_frame_excerpt.selected_gap
    },
    context_digest: agentTask.inputs.context_digest,
    expected_case_impact: agentTask.expected_case_impact,
    context_refs: agentTask.inputs.known_state_paths,
    allowed_actions: agentTask.scope.allowed_actions,
    forbidden_actions: agentTask.scope.forbidden_actions,
    allowed_paths: agentTask.scope.allowed_paths,
    allowed_skills: agentTask.scope.allowed_skills,
    expected_report_schema: "arckit-worker-report/v2",
    stop_condition: agentTask.stop_condition
  };
}

function normalizeAgentReport(report, agentTask) {
  if (!report || typeof report !== "object") {
    return createInvalidAgentReport(agentTask, t(agentTask.conversation_locale, "Worker returned a non-object report.", "Worker 返回了非对象 report。"));
  }
  return {
    schema_version: report.schema_version === "arckit-worker-report/v2" ? report.schema_version : "arckit-worker-report/v2",
    task_id: report.task_id === agentTask.id ? report.task_id : agentTask.id,
    worker_type: normalizeWorkerType(report.worker_type || agentTask.worker_type),
    role: report.role === agentTask.role ? report.role : agentTask.role,
    status: ["completed", "partial", "blocked", "failed", "invalid"].includes(report.status) ? report.status : "invalid",
    summary: stringValue(report.summary, t(agentTask.conversation_locale, "Worker returned a report without summary.", "Worker 返回的 report 缺少 summary。")),
    findings: arrayOfStrings(report.findings),
    evidence: arrayOfStrings(report.evidence),
    changes: arrayOfStrings(report.changes),
    artifact_impacts: normalizeArtifactImpacts(report.artifact_impacts),
    case_state_claims: normalizeCaseStateClaims(report.case_state_claims),
    risks: arrayOfStrings(report.risks),
    unknowns: arrayOfStrings(report.unknowns),
    recommendation: stringValue(report.recommendation, ""),
    requires_main_agent_decision: report.requires_main_agent_decision === true,
    requires_human_decision: report.requires_human_decision === true
  };
}

function normalizeArtifactImpacts(impacts) {
  if (!Array.isArray(impacts)) {
    return [];
  }
  return impacts
    .filter((impact) => impact && typeof impact === "object")
    .map((impact) => ({
      artifact: stringValue(impact.artifact, ""),
      operation: ["created", "updated", "deleted", "read", "none"].includes(impact.operation) ? impact.operation : "none",
      claim: stringValue(impact.claim, ""),
      summary: stringValue(impact.summary, ""),
      evidence: arrayOfStrings(impact.evidence)
    }));
}

function normalizeCaseStateClaims(claims) {
  if (!Array.isArray(claims)) return [];
  return claims.filter((claim) => claim && typeof claim === "object").map((claim) => ({
    facet: stringValue(claim.facet, ""),
    set: normalizeFacetSet(claim.set),
    evidence: arrayOfStrings(claim.evidence),
    unresolved: arrayOfStrings(claim.unresolved)
  }));
}

function normalizeFacetSet(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = new Set([
    "applicability",
    "maturity",
    "target_maturity",
    "alignment",
    "target_alignment",
    "resolution",
    "reason",
    "next_transition"
  ]);
  return Object.fromEntries(Object.entries(value)
    .filter(([key, fieldValue]) => allowed.has(key) && fieldValue !== null && fieldValue !== undefined));
}

function normalizeAcceptedCaseStateDelta(delta) {
  return {
    facets: normalizeCaseStateClaims(delta?.facets),
    resolved_open_questions: arrayOfStrings(delta?.resolved_open_questions),
    completed_handoffs: arrayOfStrings(delta?.completed_handoffs),
    completion_review_result: normalizeCompletionReviewResult(delta?.completion_review_result),
    resolved_review_findings: normalizeResolvedReviewFindings(delta?.resolved_review_findings),
    review_budget_extension: normalizeReviewBudgetExtension(delta?.review_budget_extension)
  };
}

function caseDeltaHasChanges(delta) {
  return (delta?.facets || []).length > 0
    || (delta?.resolved_open_questions || []).length > 0
    || (delta?.completed_handoffs || []).length > 0
    || delta?.completion_review_result != null
    || (delta?.resolved_review_findings || []).length > 0
    || delta?.review_budget_extension != null;
}

function normalizeCompletionReviewResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    outcome: ["clean", "findings", "needs_human"].includes(value.outcome) ? value.outcome : "needs_human",
    reviewer: ["agent", "human"].includes(value.reviewer) ? value.reviewer : "agent",
    reviewed_content_revision: Number.isInteger(value.reviewed_content_revision) ? value.reviewed_content_revision : -1,
    dimensions: {
      correctness: ["clean", "findings"].includes(value.dimensions?.correctness) ? value.dimensions.correctness : "findings",
      completeness: ["clean", "findings"].includes(value.dimensions?.completeness) ? value.dimensions.completeness : "findings",
      minimality: ["clean", "findings"].includes(value.dimensions?.minimality) ? value.dimensions.minimality : "findings"
    },
    findings: Array.isArray(value.findings) ? value.findings.filter((item) => item && typeof item === "object").map((item) => ({
      id: stringValue(item.id, ""),
      kind: ["error", "omission", "excess"].includes(item.kind) ? item.kind : "error",
      statement: stringValue(item.statement, ""),
      responsibility: ["agent", "human", "external"].includes(item.responsibility) ? item.responsibility : "agent",
      affected_facets: arrayOfStrings(item.affected_facets),
      artifact_refs: arrayOfStrings(item.artifact_refs),
      evidence: arrayOfStrings(item.evidence)
    })) : [],
    evidence: arrayOfStrings(value.evidence)
  };
}

function normalizeResolvedReviewFindings(values) {
  if (!Array.isArray(values)) return [];
  return values.filter((item) => item && typeof item === "object").map((item) => ({
    id: stringValue(item.id, ""),
    resolution: ["resolved", "dismissed"].includes(item.resolution) ? item.resolution : "resolved",
    reason: stringValue(item.reason, ""),
    evidence: arrayOfStrings(item.evidence)
  }));
}

function normalizeReviewBudgetExtension(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    additional_cycles: Number.isInteger(value.additional_cycles) ? value.additional_cycles : 0,
    authorized_by: value.authorized_by === "human" ? "human" : "",
    reason: stringValue(value.reason, ""),
    evidence: arrayOfStrings(value.evidence)
  };
}

function normalizeProjectImpactCandidate(value) {
  return {
    status: ["none", "proposed", "accepted"].includes(value?.status) ? value.status : "none",
    changes: Array.isArray(value?.changes) ? value.changes
      .filter((item) => item && typeof item === "object" && !Array.isArray(item))
      .map((item) => ({
        dimension: stringValue(item.dimension, ""),
        from_state: stringValue(item.from_state, ""),
        to_state: stringValue(item.to_state, ""),
        reason: stringValue(item.reason, ""),
        evidence: arrayOfStrings(item.evidence),
        ...(item.evidence_maturity == null ? {} : { evidence_maturity: stringValue(item.evidence_maturity, "") })
      })) : [],
    evidence: arrayOfStrings(value?.evidence)
  };
}

function createInvalidAgentReport(agentTask, message) {
  const conversationLocale = agentTask.conversation_locale || "en";
  return {
    schema_version: "arckit-worker-report/v2",
    task_id: agentTask.id,
    worker_type: agentTask.worker_type,
    role: agentTask.role,
    status: "invalid",
    summary: message,
    findings: [],
    evidence: [],
    changes: [],
    artifact_impacts: [],
    case_state_claims: [],
    risks: [message],
    unknowns: [],
    recommendation: t(conversationLocale, "Retry this worker task with a valid arckit-worker-report/v2 output.", "使用有效的 arckit-worker-report/v2 输出重新运行这个 worker task。"),
    requires_main_agent_decision: true,
    requires_human_decision: false
  };
}

function isProjectRelativeAllowedPath(value) {
  const path = String(value || "").trim().replaceAll("\\", "/");
  if (!path || path.startsWith("/") || /^[A-Za-z]:\//.test(path)) return false;
  return !path.split("/").some((segment) => segment === "..");
}

function isRuntimeOwnedAction(value) {
  return ["write_ledger_directly", "apply_ledger_writeback", "create_case"].includes(value);
}

function normalizeSelectedGap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const normalized = {
    id: stringValue(value.id, ""),
    scope: ["case", "project"].includes(value.scope) ? value.scope : "",
    case_id: stringValue(value.case_id, ""),
    facet: stringValue(value.facet, ""),
    responsibility: ["agent", "human", "external"].includes(value.responsibility) ? value.responsibility : "agent",
    current_state: safeSemanticText(value.current_state, { maxLength: SEMANTIC_LIMITS.reason }),
    target_state: safeSemanticText(value.target_state, { maxLength: SEMANTIC_LIMITS.reason }),
    impact: safeSemanticText(value.impact, { maxLength: SEMANTIC_LIMITS.reason }),
    next_transition: safeSemanticText(value.next_transition, { maxLength: SEMANTIC_LIMITS.transition })
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function normalizeContinuationIntent(value) {
  const goal = safeSemanticText(value?.goal || "", { maxLength: SEMANTIC_LIMITS.goal });
  const stateTransition = safeSemanticText(value?.state_transition || "", { maxLength: SEMANTIC_LIMITS.transition });
  const nextPrompt = safeSemanticText(value?.next_prompt || "", { maxLength: SEMANTIC_LIMITS.nextPrompt });
  return {
    goal,
    state_transition: stateTransition,
    next_prompt: nextPrompt
  };
}

function semanticGoalFromControllerPlan(plan, routePlan, fallback = "") {
  return firstSafeSemanticText([
    plan?.continuation_intent?.goal,
    plan?.continuation_intent?.state_transition,
    routePlan?.selected_gap?.next_transition,
    fallback
  ], { maxLength: SEMANTIC_LIMITS.goal });
}

function emptySelectedGap() {
  return {
    id: "",
    scope: "case",
    case_id: "",
    facet: "",
    responsibility: "agent",
    current_state: "",
    target_state: "",
    impact: "",
    next_transition: ""
  };
}

function yieldEvent({ events, event, stream }) {
  events.push(event);
  if (stream) {
    console.error(JSON.stringify({ event }));
  }
}

function emitRoundState({ events, roundState, stream }) {
  yieldEvent({
    events,
    event: {
      type: "runtime.round_state.changed",
      round_state: roundState.state,
      round_state_history: roundState.history
    },
    stream
  });
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function stringValue(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function first(values) {
  return Array.isArray(values) ? values[0] : "";
}

function t(language, english, zhHans) {
  return language === "zh-Hans" ? zhHans : english;
}
