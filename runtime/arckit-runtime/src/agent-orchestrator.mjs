import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createAgentAdapter } from "./agent-adapter.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import { loadRuntimeCapabilities, selectCapabilitiesForRound } from "./capability-registry.mjs";
import { conversationLocaleInstruction } from "./conversation-locale.mjs";
import { buildArtifactOwnershipScan, createArtifactImpactScan, normalizeArtifactPathReferences } from "./artifact-ownership-map.mjs";
import { reduceWorkerReports } from "./controller-reducer.mjs";
import { createRoundStateMachine, stateFromLoopGate, transitionRoundState } from "./round-state-machine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const workerReportSchemaPath = join(here, "../schemas/worker-report.schema.json");
const controllerPlanSchemaPath = join(here, "../schemas/controller-plan.schema.json");
const controllerReviewSchemaPath = join(here, "../schemas/controller-review.schema.json");

const ROLE_DEFINITIONS = {
  controller_state_reader: {
    objective: "Recover the project state, active case context, and known fact-source surfaces before any work is attempted.",
    allowed_actions: ["read_files", "inspect_state", "report_evidence"],
    allowed_skills: ["arckit-development-ledger", "arckit-agent-context"],
    forbidden_actions: ["edit_files", "decide_case_closed", "change_loop_status_directly"]
  },
  controller_route_auditor: {
    objective: "Audit source/projection boundaries and choose the minimum capability set required for this round.",
    allowed_actions: ["inspect_state", "propose_routes", "report_evidence"],
    allowed_skills: ["using-arckit", "arckit-development-ledger", "arckit-pending", "arckit-tech", "arckit-spec"],
    forbidden_actions: ["edit_files", "rewrite_source_truth_without_result_skill", "decide_case_closed"]
  },
  source_fact_worker: {
    objective: "Establish or update the minimum stable source facts for the selected gap, and route unsupported assumptions to pending context.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["using-arckit", "arckit-spec", "arckit-pending", "arckit-tech", "arckit-development-ledger", "arckit-architecture-decision"],
    forbidden_actions: ["implement_product_code", "write_ledger_directly", "silently_expand_scope", "decide_human_gate", "decide_case_closed"]
  },
  implementation_worker: {
    objective: "Execute only the bounded worker packet after the runtime has authorized execution and bound an executor.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["arckit-implementation-handoff", "arckit-debug-diagnosis", "arckit-tech", "arckit-spec"],
    forbidden_actions: ["silently_expand_scope", "decide_human_gate", "decide_case_closed"]
  },
  verification_worker: {
    objective: "Verify the work output, command evidence, schema shape, and state-write readiness independently.",
    allowed_actions: ["read_files", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["arckit-development-ledger"],
    forbidden_actions: ["edit_files", "fix_issues_without_task_authorization", "decide_case_closed"]
  },
  closeout_controller: {
    objective: "Check whether the round can close, continue, block, or require a human decision.",
    allowed_actions: ["inspect_reports", "audit_loop_gate", "report_evidence"],
    allowed_skills: ["arckit-development-ledger", "arckit-workflow-memory"],
    forbidden_actions: ["write_ledger_directly", "decide_next_responsibility_without_main_agent"]
  }
};

const DEFAULT_ROLES = [
  "controller_state_reader",
  "controller_route_auditor",
  "source_fact_worker",
  "implementation_worker",
  "verification_worker",
  "closeout_controller"
];

export async function runAgenticLoop({ projectRoot, snapshot, round, compiledPrompt, options = {} }) {
  const conversationLocale = options.conversationLocale || compiledPrompt.conversation_locale || round.conversation_locale || "en";
  round.conversation_locale = conversationLocale;
  const packetEnvelope = options.packetEnvelope || null;
  const capabilities = packetEnvelope ? [] : await loadRuntimeCapabilities();
  const selectedCapabilities = packetEnvelope ? [] : selectCapabilitiesForRound(capabilities, round, options.task || "");
  const loopFrame = packetEnvelope
    ? authorizePacketLoopFrame(packetEnvelope.loop_frame, options)
    : createLoopFrame({ snapshot, round, task: options.task || "", selectedCapabilities, options });
  const adapterName = options.dryRun ? "dry-run" : options.adapter || "codex-app-server";
  const adapter = createAgentAdapter(adapterName, options);
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
      controllerPlanSchema,
      options,
      events
    });
  const routePlan = packetEnvelope
    ? createRoutePlanFromPacket(loopFrame)
    : createRoutePlanFromControllerPlan({ controllerPlan: controllerPlan.plan, loopFrame });
  loopFrame.controller_frame.controller_plan = controllerPlan?.plan || null;
  loopFrame.controller_frame.controller_plan_source = packetEnvelope ? "packet" : "controller_agent";
  loopFrame.controller_frame.controller_plan_failure_reason = controllerPlan?.failure_reason || "";
  loopFrame.route_plan = routePlan;
  loopFrame.controller_frame.route_plan = routePlan;
  const agentTasks = packetEnvelope
    ? normalizePacketWorkerTasks(packetEnvelope.worker_tasks || [], loopFrame)
    : controllerPlan?.usable ? createAgentTasks({
      loopFrame,
      round,
      snapshot,
      task: options.task || "",
      selectedCapabilities,
      roles: routePlan.selected_roles,
      controllerPlan: controllerPlan?.usable ? controllerPlan.plan : null
    }) : [];
  loopFrame.round_execution_packet.worker_packets = agentTasks.map(toWorkerPacket);
  loopFrame.worker_packets = loopFrame.round_execution_packet.worker_packets;
  const roundState = createRoundStateMachine("planned", "Controller reducer created the round plan.");
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
        role: effectiveAgentTask.role,
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
      const failFastEvent = {
        type: "runtime.agent_task.fail_fast",
        task_id: report.task_id,
        role: report.role,
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
      outputSchema: workerReportSchema,
      resultKind: "worker-report"
    }
  })) {
    const wrapped = {
      ...event,
      task_id: agentTask.id,
      role: agentTask.role
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
    report = createInvalidAgentReport(agentTask, t(agentTask.conversation_locale, "Worker completed without returning an arckit-worker-report/v1 object.", "Worker 已完成，但没有返回 arckit-worker-report/v1 对象。"));
  }
  const completedEvent = {
    type: "runtime.worker_report.completed",
    task_id: report.task_id,
    role: report.role,
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

  const prompt = compileControllerPlanPrompt({
    loopFrame,
    round,
    snapshot,
    task,
    selectedCapabilities
  });
  let plan = null;
  try {
    for await (const event of adapter.runTurn({
      projectRoot,
      prompt,
      options: {
        ...options,
        outputSchema: controllerPlanSchema,
        resultKind: "controller-plan"
      }
    })) {
      const wrapped = {
        ...event,
        controller_role: "controller_planner"
      };
      events.push(wrapped);
      if (options.streamEvents) {
        console.error(JSON.stringify({ event: wrapped }));
      }
      if (event.type === "runtime.controller_plan") {
        plan = normalizeControllerPlan(event.plan);
      }
    }
  } catch (error) {
    const failureReason = error?.message || String(error);
    const failedPlan = createControllerPlanFailure(`Controller Agent planning failed before route selection: ${failureReason}`);
    const completedEvent = {
      type: "runtime.controller_plan.completed",
      status: "planning_failed",
      controller_plan: failedPlan,
      failure_reason: failureReason
    };
    events.push(completedEvent);
    if (options.streamEvents) {
      console.error(JSON.stringify({ event: completedEvent }));
    }
    return {
      usable: false,
      plan: failedPlan,
      failure_reason: failureReason
    };
  }

  const failureReason = controllerPlanFailureReason(plan);
  const completedStatus = controllerPlanCompletedStatus({ plan, failureReason });
  const completedEvent = {
    type: "runtime.controller_plan.completed",
    status: completedStatus,
    controller_plan: plan || null,
    failure_reason: failureReason
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

function compileControllerPlanPrompt({ loopFrame, round, snapshot, task, selectedCapabilities }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || "en";
  return [
    "# Arckit Controller Planning Turn",
    "",
    "You are the Controller Agent inside Arckit Runtime. Your job is to plan the minimum bounded worker set for this runtime round.",
    "",
    "The Runtime owns final validation, permission boundaries, worker execution, report intake, ledger writeback, and stop conditions. You provide semantic routing evidence; do not execute worker tasks yourself.",
    "",
    "## Conversation Locale",
    `- conversation_locale: ${conversationLocale}`,
    `- ${conversationLocaleInstruction(conversationLocale)}`,
    "",
    "## Project Snapshot",
    JSON.stringify({
      project_root: snapshot.projectRoot || "",
      summary: snapshot.summary || {},
      selected_gap: loopFrame.selected_gap,
      loop_control: loopFrame.loop_control,
      required_context_refs: round.required_context_refs,
      stop_conditions: round.stop_conditions
    }, null, 2),
    "",
    "## Operator Task",
    task || round.round_goal || "",
    "",
    "## Selected Capabilities",
    JSON.stringify(selectedCapabilities.map(toCapabilityContext), null, 2),
    "",
    "## Planning Rules",
    "- Select only the worker roles needed for this round.",
    "- Include controller_state_reader for every dispatchable worker route.",
    "- Prefer source fact work before implementation when project state or selected gap is unknown.",
    "- Include verification when a worker may change files, source facts, implementation evidence, or pending context.",
    "- Include closeout_controller unless the route is blocked before workers can run.",
    "- Do not use workers to make human-owned product, aesthetic, business, release, or risk-acceptance decisions.",
    "- If a route requires human confirmation, set status=needs_human and explain the needed decision.",
    "- Keep worker_intents concise and role-scoped. Runtime will enforce role permissions and block the round if your plan is invalid.",
    "",
    "## Output Contract",
    "Return only a JSON object with schema_version=arckit-controller-plan/v1. Do not wrap it in Markdown."
  ].join("\n");
}

function normalizeControllerPlan(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }
  return {
    schema_version: plan.schema_version === "arckit-controller-plan/v1" ? plan.schema_version : "arckit-controller-plan/v1",
    status: ["planned", "needs_human", "blocked"].includes(plan.status) ? plan.status : "blocked",
    summary: stringValue(plan.summary, ""),
    route_plan: {
      mode: ["source_fact_establishment", "implementation_execution", "route_review", "packet_execution"].includes(plan.route_plan?.mode) ? plan.route_plan.mode : "route_review",
      selected_roles: unique(arrayOfStrings(plan.route_plan?.selected_roles).filter((role) => ROLE_DEFINITIONS[role])),
      reason: stringValue(plan.route_plan?.reason, ""),
      requires_human_confirmation: plan.route_plan?.requires_human_confirmation === true
    },
    worker_intents: Array.isArray(plan.worker_intents)
      ? plan.worker_intents
        .filter((intent) => ROLE_DEFINITIONS[intent?.role])
        .map((intent) => ({
          role: intent.role,
          objective: stringValue(intent.objective, ""),
          reason: stringValue(intent.reason, "")
        }))
      : [],
    risks: arrayOfStrings(plan.risks),
    unknowns: arrayOfStrings(plan.unknowns),
    next_controller_action: stringValue(plan.next_controller_action, "")
  };
}

function controllerPlanFailureReason(plan) {
  if (!plan) {
    return "Controller Agent did not return a usable plan.";
  }
  if (plan.schema_version !== "arckit-controller-plan/v1") {
    return "Controller Agent returned an unsupported plan schema.";
  }
  if (plan.status !== "planned") {
    return `Controller Agent plan status is ${plan.status}.`;
  }
  if (!Array.isArray(plan.route_plan?.selected_roles) || plan.route_plan.selected_roles.length === 0) {
    return "Controller Agent did not select any worker roles.";
  }
  if (!plan.route_plan.selected_roles.includes("controller_state_reader")) {
    return "Controller Agent did not include controller_state_reader for the dispatchable route.";
  }
  if (plan.route_plan.selected_roles.some((role) => ["source_fact_worker", "implementation_worker"].includes(role))
    && !plan.route_plan.selected_roles.includes("verification_worker")) {
    return "Controller Agent did not include verification_worker for a route that may change files, source facts, implementation evidence, or pending context.";
  }
  if (!plan.route_plan.selected_roles.includes("closeout_controller")) {
    return "Controller Agent did not include closeout_controller for the dispatchable route.";
  }
  return "";
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
    schema_version: "arckit-controller-plan/v1",
    status: "blocked",
    summary,
    route_plan: {
      mode: "route_review",
      selected_roles: [],
      reason: summary,
      requires_human_confirmation: false
    },
    worker_intents: [],
    risks: [summary],
    unknowns: [],
    next_controller_action: "Retry Controller planning with a valid arckit-controller-plan/v1 output."
  };
}

async function maybeRunControllerReviewer({
  adapter,
  projectRoot,
  loopFrame,
  round,
  reports,
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

  const prompt = compileControllerReviewPrompt({ loopFrame, round, reports });
  let review = null;
  try {
    for await (const event of adapter.runTurn({
      projectRoot,
      prompt,
      options: {
        ...options,
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
        review = normalizeControllerReview(event.review);
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

  const failureReason = controllerReviewFailureReason(review);
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

function compileControllerReviewPrompt({ loopFrame, round, reports }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || "en";
  return [
    "# Arckit Controller Review Turn",
    "",
    "You are the Controller Agent inside Arckit Runtime. Review bounded worker reports and decide the next loop state.",
    "",
    "The Runtime owns schema validation, permission boundaries, and ledger writeback. You provide the semantic closeout judgment for this round.",
    "",
    "## Conversation Locale",
    `- conversation_locale: ${conversationLocale}`,
    `- ${conversationLocaleInstruction(conversationLocale)}`,
    "",
    "## Loop Frame",
    JSON.stringify({
      case_id: loopFrame.case_id,
      round_goal: loopFrame.round_goal,
      selected_gap: loopFrame.selected_gap,
      route_plan: loopFrame.route_plan,
      stop_conditions: loopFrame.stop_conditions
    }, null, 2),
    "",
    "## Worker Reports",
    JSON.stringify(reports, null, 2),
    "",
    "## Review Rules",
    "- Return done only when worker evidence proves the round goal is satisfied and no risk or unknown blocks closeout.",
    "- Return continue when the next step is still agent/runtime work.",
    "- Return needs_human only when a human decision, risk acceptance, or product/business judgment is required.",
    "- Return blocked when required reports, permissions, schemas, tools, or evidence are missing.",
    "- Do not perform ledger writeback; only describe the next prompt and closeout judgment.",
    "",
    "## Output Contract",
    "Return only a JSON object with schema_version=arckit-controller-review/v1. Do not wrap it in Markdown."
  ].join("\n");
}

function normalizeControllerReview(review) {
  if (!review || typeof review !== "object") {
    return null;
  }
  return {
    schema_version: review.schema_version === "arckit-controller-review/v1" ? review.schema_version : "arckit-controller-review/v1",
    status: ["done", "continue", "needs_human", "blocked"].includes(review.status) ? review.status : "blocked",
    summary: stringValue(review.summary, ""),
    accepted_reports: arrayOfStrings(review.accepted_reports),
    rejected_reports: arrayOfStrings(review.rejected_reports),
    risks: arrayOfStrings(review.risks),
    unknowns: arrayOfStrings(review.unknowns),
    next_prompt: stringValue(review.next_prompt, ""),
    human_decision_required: review.human_decision_required === true
  };
}

function controllerReviewFailureReason(review) {
  if (!review) {
    return "Controller Agent did not return a usable review.";
  }
  if (review.schema_version !== "arckit-controller-review/v1") {
    return "Controller Agent returned an unsupported review schema.";
  }
  if (!["done", "continue", "needs_human", "blocked"].includes(review.status)) {
    return "Controller Agent returned an unsupported review status.";
  }
  return "";
}

function createControllerReviewFailure(summary) {
  return {
    schema_version: "arckit-controller-review/v1",
    status: "blocked",
    summary,
    accepted_reports: [],
    rejected_reports: [],
    risks: [summary],
    unknowns: [],
    next_prompt: "Retry Controller review with a valid arckit-controller-review/v1 output.",
    human_decision_required: false
  };
}

export function createLoopFrame({ snapshot, round, task, selectedCapabilities = [], options = {} }) {
  const loopControl = snapshot.projectState.loop_control || {};
  const frame = {
    schema_version: "arckit-loop-frame/v1",
    case_id: first(snapshot.projectState.active_case_refs) || "",
    project_name: snapshot.summary.project_name,
    project_root: snapshot.projectRoot || "",
    operator_task: task,
    round_goal: task || round.round_goal,
    conversation_locale: options.conversationLocale || round.conversation_locale || "en",
    controller_frame: createControllerFrame({ snapshot, round, task }),
    execution_gate: createExecutionGate({ options }),
    executor_binding: createExecutorBinding({ options }),
    selected_gap: {
      id: round.gap_id,
      dimension: round.dimension,
      current_state: round.current_state,
      target_state: round.target_state,
      urgency: round.urgency,
      risk: round.risk,
      impact: round.impact
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
      manifest_path: capability.manifest_path,
      source: capability.source || ""
    })),
    selected_capability_contexts: selectedCapabilities.map(toCapabilityContext),
    stop_conditions: round.stop_conditions,
    loop_control: {
      next_responsibility: loopControl.next_responsibility || "agent",
      trigger_mode: loopControl.trigger_mode || "manual_bridge",
      current_loop_focus: loopControl.current_loop_focus || "",
      next_transition: loopControl.next_transition || ""
    },
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
  return {
    schema_version: "arckit-dynamic-route-plan/v1",
    mode: "packet_execution",
    selected_roles: unique(roles),
    suppressed_roles: DEFAULT_ROLES.filter((role) => !roles.includes(role)),
    selected_gap: loopFrame.selected_gap || {},
    reason: "Executing roles from an existing authorized packet.",
    requires_human_confirmation: false
  };
}

function createRoutePlanFromControllerPlan({ controllerPlan, loopFrame }) {
  const plannedRoles = unique(arrayOfStrings(controllerPlan?.route_plan?.selected_roles).filter((role) => ROLE_DEFINITIONS[role]));
  return {
    schema_version: "arckit-dynamic-route-plan/v1",
    mode: controllerPlan?.route_plan?.mode || "route_review",
    selected_roles: plannedRoles,
    suppressed_roles: DEFAULT_ROLES.filter((role) => !plannedRoles.includes(role)),
    selected_gap: loopFrame.selected_gap,
    reason: [
      controllerPlan?.route_plan?.reason || "",
      controllerPlan?.summary ? `Controller Agent: ${controllerPlan.summary}` : ""
    ].filter(Boolean).join(" "),
    requires_human_confirmation: controllerPlan?.route_plan?.requires_human_confirmation === true
  };
}

export function createAgentTasks({ loopFrame, round, snapshot, task, selectedCapabilities = [], roles = DEFAULT_ROLES, controllerPlan = null }) {
  return roles.map((role, index) => {
    const definition = ROLE_DEFINITIONS[role];
    if (!definition) {
      throw new Error(`Unknown Arckit worker role: ${role}`);
    }
    const capabilityContexts = selectedCapabilities
      .filter((capability) => definition.allowed_skills.includes(capability.id))
      .map(toCapabilityContext);
    const workerIntent = Array.isArray(controllerPlan?.worker_intents)
      ? controllerPlan.worker_intents.find((intent) => intent.role === role)
      : null;
    const objective = workerIntent?.objective
      ? workerIntent.objective
      : role === "implementation_worker" && task
        ? `${definition.objective} Operator task: ${task}`
        : role === "source_fact_worker" && task
          ? `${definition.objective} Operator task: ${task}`
          : definition.objective;
    return {
      schema_version: "arckit-worker-task/v1",
      id: `TASK-${String(index + 1).padStart(2, "0")}-${role}`,
      role,
      objective,
      conversation_locale: loopFrame.conversation_locale || round.conversation_locale || "en",
      loop_frame_excerpt: {
        case_id: loopFrame.case_id,
        round_goal: loopFrame.round_goal,
        conversation_locale: loopFrame.conversation_locale || round.conversation_locale || "en",
        selected_gap: loopFrame.selected_gap,
        selected_capabilities: loopFrame.selected_capabilities,
        stop_conditions: loopFrame.stop_conditions
      },
      inputs: {
        user_request_excerpt: task,
        known_state_paths: round.required_context_refs,
        known_facts: [
          `project=${snapshot.summary.project_name}`,
          `phase=${snapshot.summary.current_phase}`,
          `selected_gap=${round.gap_id}`
        ],
        capability_contexts: capabilityContexts,
        assumptions: [],
        pending_questions: []
      },
      scope: {
        allowed_paths: allowedPathsForRole(role, round.required_context_refs),
        allowed_skills: definition.allowed_skills,
        allowed_actions: definition.allowed_actions,
        forbidden_actions: definition.forbidden_actions
      },
      expected_output: {
        format: "arckit-worker-report/v1",
        required_fields: [
          "task_id",
          "role",
          "status",
          "summary",
          "findings",
          "evidence",
          "changes",
          "artifact_impacts",
          "risks",
          "unknowns",
          "recommendation",
          "requires_main_agent_decision",
          "requires_human_decision"
        ]
      },
      stop_condition: round.stop_conditions.join(" ")
    };
  });
}

function compileAgentTaskPrompt({ agentTask, previousReports }) {
  const conversationLocale = agentTask.conversation_locale || agentTask.loop_frame_excerpt?.conversation_locale || "en";
  return [
    "# Arckit Worker Packet",
    "",
    "You are one bounded Worker inside Arckit Runtime. The Controller owns turn delta, packet validity, report intake, closeout, ledger writeback, and next responsibility.",
    "",
    "## Conversation Locale",
    `- conversation_locale: ${conversationLocale}`,
    `- ${conversationLocaleInstruction(conversationLocale)}`,
    "",
    "## Task Packet",
    JSON.stringify(agentTask, null, 2),
    "",
    "## Previous Reports",
    previousReports.length > 0 ? JSON.stringify(previousReports, null, 2) : "[]",
    "",
    "## Explicit Skill Triggers",
    formatExplicitSkillTriggers(agentTask.scope?.allowed_skills),
    "",
    "## Allowed Capability Context",
    JSON.stringify(agentTask.inputs.capability_contexts || [], null, 2),
    "",
    "## Required Behavior",
    "- Do only the task packet's role.",
    "- Use the explicit skill triggers above when an installed skill is needed.",
    "- Do not infer additional skills from capability context metadata.",
    "- Treat capability context as routing and boundary metadata, not as the skill body or runtime architecture source.",
    "- Do not close the case or decide the final loop gate.",
    "- Do not change the project direction or invalidate other packets.",
    "- Do not silently expand scope.",
    "- Use report.artifact_impacts for every artifact you created, updated, deleted, or read as evidence.",
    "- Each artifact_impacts item must bind one relative artifact path to operation, claim, summary, and evidence.",
    "- Keep report.changes as human-readable prose only; Runtime will not use changes for source/projection gates.",
    "- Return only valid JSON matching arckit-worker-report/v1.",
    "",
    "## Output Contract",
    "Return a JSON object with schema_version=arckit-worker-report/v1. Do not wrap it in Markdown."
  ].join("\n");
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
  const allowedPaths = Array.isArray(packet.allowed_paths) ? packet.allowed_paths : [];
  if (allowedPaths.length === 0) {
    return true;
  }
  return allowedPaths.some((allowed) => {
    const normalized = normalizeArtifactPathReferences([allowed])[0] || String(allowed || "").trim().replaceAll("\\", "/").replace(/^\.\//, "");
    if (!normalized) {
      return false;
    }
    return normalized.endsWith("/") ? artifact.startsWith(normalized) : artifact === normalized;
  });
}

function formatExplicitSkillTriggers(skills) {
  const allowedSkills = unique(Array.isArray(skills) ? skills.map((skill) => String(skill)) : []);
  if (allowedSkills.length === 0) {
    return "[]";
  }
  return allowedSkills.map((skill) => `- $${skill}`).join("\n");
}

function mergeAgentReports({ reports, loopFrame, round, compiledPrompt, dryRun, controllerReview }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || compiledPrompt.conversation_locale || "en";
  const reducerResult = reduceWorkerReports({
    reports,
    loopFrame,
    round,
    dryRun,
    conversationLocale
  });
  const review = controllerReview?.review || null;
  const reviewUsable = controllerReview?.usable === true;
  const reviewStatus = reviewUsable ? review.status : "blocked";
  const reviewLoopGate = reviewUsable
    ? {
      status: reviewStatus,
      next_responsibility: reviewStatus === "done" ? "none" : review.human_decision_required || reviewStatus === "needs_human" ? "human" : "agent",
      trigger_mode: reviewStatus === "done" ? "none" : review.human_decision_required || reviewStatus === "needs_human" ? "user_decision" : "manual_bridge",
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
    report_intake: reducerResult.report_intake,
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
      : t(conversationLocale, `Retry Controller planning for ${loopFrame.case_id || round.gap_id} and return a valid arckit-controller-plan/v1.`, `重新为 ${loopFrame.case_id || round.gap_id} 执行 Controller planning，并返回有效的 arckit-controller-plan/v1。`)
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
  const arrays = ["findings", "evidence", "changes", "artifact_impacts", "risks", "unknowns"];
  return report.schema_version === "arckit-worker-report/v1"
    && Boolean(report.task_id)
    && Boolean(ROLE_DEFINITIONS[report.role])
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
    kind: capability.kind || "",
    runtime_role: capability.runtime_role || [],
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

function stateFromMergeResult(mergeResult) {
  return shouldPrepareLedgerWriteback(mergeResult)
    ? "ledger_gate_ready"
    : stateFromLoopGate(mergeResult.loop_gate);
}

function shouldPrepareLedgerWriteback(mergeResult) {
  const loopGate = mergeResult?.loop_gate || {};
  if (loopGate.status === "done") {
    return true;
  }
  if (loopGate.status !== "continue") {
    return false;
  }
  if (loopGate.human_decision_required === true || ["human", "external"].includes(loopGate.next_responsibility)) {
    return false;
  }
  const intake = mergeResult?.report_intake || {};
  const unresolvedReports = [
    ...(Array.isArray(intake.rejected) ? intake.rejected : []),
    ...(Array.isArray(intake.needs_revision) ? intake.needs_revision : []),
    ...(Array.isArray(intake.needs_human_decision) ? intake.needs_human_decision : []),
    ...(Array.isArray(intake.missing) ? intake.missing : [])
  ];
  if (unresolvedReports.length > 0) {
    return false;
  }
  const ownership = mergeResult?.artifact_ownership_scan || {};
  const changedFiles = Array.isArray(mergeResult?.changed_files) ? mergeResult.changed_files : [];
  const sourceChanged = Array.isArray(ownership.source_facts_changed) && ownership.source_facts_changed.length > 0;
  const pendingChanged = Array.isArray(ownership.pending_items) && ownership.pending_items.length > 0;
  const ledgerChanged = changedFiles.some((path) => /^arckit\/(project|cases)\//.test(path));
  const evidence = Array.isArray(mergeResult?.evidence) ? mergeResult.evidence : [];
  return evidence.length > 0 && (sourceChanged || pendingChanged || ledgerChanged);
}

function createRuntimeResultFromMerge({ mergeResult, reports, loopFrame, round, compiledPrompt, dryRun, roundState }) {
  const conversationLocale = loopFrame.conversation_locale || round.conversation_locale || compiledPrompt.conversation_locale || "en";
  const loopDone = mergeResult.loop_gate.status === "done";
  const loopBlocked = mergeResult.loop_gate.status === "blocked";
  const needsHuman = mergeResult.loop_gate.human_decision_required === true;
  const ledgerWritebackReady = shouldPrepareLedgerWriteback(mergeResult);
  const progressWriteback = ledgerWritebackReady && !loopDone;
  const roundResult = loopDone ? "done" : needsHuman ? "needs_human" : loopBlocked ? "blocked" : "continue";
  const handoffStatus = loopDone ? "done" : needsHuman ? "needs_human" : loopBlocked ? "blocked" : "continue";
  const runModeText = dryRun
    ? t(conversationLocale, "controller preview", "Controller 预览")
    : t(conversationLocale, "execution", "执行");
  const summary = [
    t(conversationLocale, `Agentic loop ${runModeText} completed with ${reports.length} worker reports.`, `Agentic loop ${runModeText}已完成，收到 ${reports.length} 个 worker reports。`),
    t(conversationLocale, `Merge decision: ${mergeResult.decision}.`, `合并决策：${mergeResult.decision}。`),
    mergeResult.loop_gate.reason
  ].join(" ");

  return {
    schema_version: "arckit-runtime-result/v1",
    round_result: roundResult,
    round_state: roundState?.state || stateFromLoopGate(mergeResult.loop_gate),
    round_state_history: Array.isArray(roundState?.history) ? roundState.history : [],
    summary,
    changed_files: mergeResult.changed_files,
    artifact_impact_scan: createArtifactImpactScan(mergeResult.artifact_ownership_scan || buildArtifactOwnershipScan(mergeResult.changed_files), { dryRun }),
    artifact_ownership_scan: mergeResult.artifact_ownership_scan || buildArtifactOwnershipScan(mergeResult.changed_files),
    source_projection_check: mergeResult.source_projection_check,
    controller_reducer_result: mergeResult.controller_reducer_result || {},
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    worker_packets: loopFrame.worker_packets,
    report_intake: mergeResult.report_intake,
    ledger_stage: {
      schema_version: "arckit-ledger-stage/v1",
      status: ledgerWritebackReady ? "gate_ready" : needsHuman ? "human_blocked" : loopBlocked ? "blocked" : "not_ready",
      gate_required: ledgerWritebackReady,
      writeback_required: ledgerWritebackReady,
      reason: loopDone
        ? t(conversationLocale, "Runtime result is eligible for deterministic ledger gate evaluation.", "Runtime result 可以进入确定性 ledger gate。")
        : progressWriteback
          ? t(conversationLocale, "Runtime result has validated progress that must be written before the next round.", "Runtime result 已产生经过验证的阶段进展，进入下一轮前必须先写回 ledger。")
        : mergeResult.loop_gate.reason
    },
    validation_evidence: unique([
      ...mergeResult.evidence,
      "runtime/arckit-runtime/schemas/worker-packet.schema.json",
      "runtime/arckit-runtime/schemas/worker-report.schema.json",
      "runtime/arckit-runtime/schemas/controller-plan.schema.json",
      "runtime/arckit-runtime/schemas/controller-review.schema.json",
      compiledPrompt.output_schema
    ]),
    loop_handoff: {
      version: "loop-handoff/v1",
      status: handoffStatus,
      next_responsibility: loopDone ? "none" : needsHuman ? "human" : "agent",
      agent_continuation_available: !loopDone && !needsHuman,
      human_decision_required: needsHuman,
      trigger_mode: loopDone ? "none" : needsHuman ? "user_decision" : "manual_bridge",
      responsibility_reason: mergeResult.loop_gate.reason,
      next_prompt: mergeResult.next_prompt,
      agent_instruction: {
        goal: loopDone ? t(conversationLocale, "No continuation required.", "无需继续。") : loopFrame.round_goal || round.round_goal,
        required_context_refs: round.required_context_refs,
        required_actions: loopDone
          ? []
          : needsHuman
            ? [
              t(conversationLocale, "Review worker reports that require a main-agent or human decision.", "审核需要主 Agent 或人类决策的 worker reports。"),
              t(conversationLocale, "Decide whether to continue, narrow scope, or change project facts before the next runtime round.", "在下一轮 runtime round 前，决定是继续、收窄范围，还是变更项目事实。")
            ]
            : progressWriteback
              ? [
                t(conversationLocale, "Write this validated progress to the project ledger before starting the next round.", "进入下一轮前，先把本轮经过验证的阶段进展写回项目 ledger。"),
                t(conversationLocale, "Keep the active case open and continue from the ledger handoff after writeback.", "保持 active case 打开，并在写回后按 ledger handoff 继续。")
              ]
            : [
              t(conversationLocale, "Authorize execution or return worker reports to the Arckit Controller.", "授权执行，或把 worker reports 返回给 Arckit Controller。"),
              t(conversationLocale, "Resolve blocked, partial, or unknown worker report items.", "解决 blocked、partial 或 unknown 的 worker report 项。"),
              t(conversationLocale, "Return structured reports and a validated runtime result.", "返回结构化 reports 和通过验证的 runtime result。")
          ],
        required_checks: [
          "worker_reports",
          "merge_result",
          "source_projection_check",
          "loop_handoff"
        ],
        stop_condition: round.stop_conditions.join(" ")
      },
      human_gate: {
        required: needsHuman,
        reason: needsHuman ? mergeResult.loop_gate.reason : "",
        decision_needed: needsHuman ? t(conversationLocale, "Resolve worker report recommendations that require main-agent decision.", "处理需要主 Agent 决策的 worker report 建议。") : ""
      },
      progress_guard: {
        expected_state_change: loopFrame.round_goal || round.round_goal,
        actual_state_change: loopDone ? summary : t(conversationLocale, "Agentic loop produced reports but did not close the round.", "Agentic loop 已生成 reports，但本轮尚未关闭。"),
        no_progress_limit: 1,
        max_auto_rounds: 1
      }
    }
  };
}

function createControllerFrame({ snapshot, round, task }) {
  const hasTask = Boolean(String(task || "").trim());
  return {
    schema_version: "arckit-controller-frame/v1",
    case_id: first(snapshot.projectState.active_case_refs) || "",
    turn_delta: {
      relation_to_previous_loop: hasTask ? "continue_case" : "resume_next_prompt",
      reason: hasTask ? "Operator supplied a project task for this round." : "No explicit task supplied; continue from project state and loop handoff.",
      packet_effect: hasTask ? "revise" : "keep"
    },
    round_goal: task || round.round_goal,
    round_status: "planning",
    old_packet_valid: true,
    selected_gap: {
      id: round.gap_id,
      dimension: round.dimension
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

function normalizePacketWorkerTasks(tasks, loopFrame) {
  return tasks.map((task, index) => ({
    ...task,
    schema_version: "arckit-worker-task/v1",
    id: task.id || task.worker_id || `TASK-${String(index + 1).padStart(2, "0")}-${task.role || "worker"}`,
    role: task.role || "implementation_worker",
    objective: task.objective || task.task || "",
    conversation_locale: task.conversation_locale || loopFrame.conversation_locale || "en",
    loop_frame_excerpt: task.loop_frame_excerpt || {
      case_id: loopFrame.case_id || "",
      round_goal: loopFrame.round_goal || "",
      conversation_locale: loopFrame.conversation_locale || task.conversation_locale || "en",
      selected_gap: loopFrame.selected_gap || {},
      selected_capabilities: loopFrame.selected_capabilities || [],
      stop_conditions: loopFrame.stop_conditions || []
    },
    inputs: task.inputs || {
      user_request_excerpt: loopFrame.operator_task || "",
      known_state_paths: task.context_refs || [],
      known_facts: [],
      capability_contexts: [],
      assumptions: [],
      pending_questions: []
    },
    scope: task.scope || {
      allowed_paths: task.allowed_paths || [],
      allowed_skills: [],
      allowed_actions: task.allowed_actions || [],
      forbidden_actions: task.forbidden_actions || []
    },
    expected_output: task.expected_output || {
      format: "arckit-worker-report/v1",
      required_fields: [
        "task_id",
        "role",
        "status",
        "summary",
        "findings",
        "evidence",
        "changes",
        "artifact_impacts",
        "risks",
        "unknowns",
        "recommendation",
        "requires_main_agent_decision",
        "requires_human_decision"
      ]
    },
    stop_condition: task.stop_condition || ""
  }));
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
    schema_version: "arckit-worker-packet/v1",
    worker_id: agentTask.id,
    role: agentTask.role,
    task: agentTask.objective,
    context_refs: agentTask.inputs.known_state_paths,
    allowed_actions: agentTask.scope.allowed_actions,
    forbidden_actions: agentTask.scope.forbidden_actions,
    allowed_paths: agentTask.scope.allowed_paths,
    allowed_skills: agentTask.scope.allowed_skills,
    expected_report_schema: "arckit-worker-report/v1",
    stop_condition: agentTask.stop_condition
  };
}

function normalizeAgentReport(report, agentTask) {
  if (!report || typeof report !== "object") {
    return createInvalidAgentReport(agentTask, t(agentTask.conversation_locale, "Worker returned a non-object report.", "Worker 返回了非对象 report。"));
  }
  return {
    schema_version: report.schema_version === "arckit-worker-report/v1" ? report.schema_version : "arckit-worker-report/v1",
    task_id: report.task_id === agentTask.id ? report.task_id : agentTask.id,
    role: report.role === agentTask.role ? report.role : agentTask.role,
    status: ["completed", "partial", "blocked", "failed", "invalid"].includes(report.status) ? report.status : "invalid",
    summary: stringValue(report.summary, t(agentTask.conversation_locale, "Worker returned a report without summary.", "Worker 返回的 report 缺少 summary。")),
    findings: arrayOfStrings(report.findings),
    evidence: arrayOfStrings(report.evidence),
    changes: arrayOfStrings(report.changes),
    artifact_impacts: normalizeArtifactImpacts(report.artifact_impacts),
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

function createInvalidAgentReport(agentTask, message) {
  const conversationLocale = agentTask.conversation_locale || "en";
  return {
    schema_version: "arckit-worker-report/v1",
    task_id: agentTask.id,
    role: agentTask.role,
    status: "invalid",
    summary: message,
    findings: [],
    evidence: [],
    changes: [],
    artifact_impacts: [],
    risks: [message],
    unknowns: [],
    recommendation: t(conversationLocale, "Retry this worker task with a valid arckit-worker-report/v1 output.", "使用有效的 arckit-worker-report/v1 输出重新运行这个 worker task。"),
    requires_main_agent_decision: true,
    requires_human_decision: false
  };
}

function allowedPathsForRole(role, requiredContextRefs) {
  if (role === "implementation_worker") {
    return ["."];
  }
  if (role === "source_fact_worker") {
    return unique([
      ...requiredContextRefs,
      "arckit/spec/",
      "arckit/pending/",
      "arckit/tech/"
    ]);
  }
  return requiredContextRefs.length > 0 ? requiredContextRefs : ["arckit/"];
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
