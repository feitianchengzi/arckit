import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { JsonRpcStdioClient } from "../src/json-rpc-stdio-client.mjs";
import { AsyncEventQueue } from "../src/async-event-queue.mjs";

export function createCodexAppServerAdapter(adapterOptions = {}) {
  return {
    name: "codex-app-server",
    async *runTurn({ projectRoot, prompt, options = {} }) {
      const effectiveOptions = { ...adapterOptions, ...options };
      const queue = new AsyncEventQueue();
      const client = createClient(projectRoot, effectiveOptions);
      const state = {
        threadId: null,
        turnId: null,
        agentText: "",
        lastCompletedAgentText: "",
        lastError: null,
        completed: false,
        resultKind: "runtime-result"
      };
      let stdinControls = null;

      client.onNotification((message) => {
        handleNotification({ message, queue, state, client });
      });
      client.onRequest((message) => handleServerRequest({ message, queue, options: effectiveOptions }));
      client.onClose(({ error }) => {
        if (!state.completed) {
          queue.fail(error || new Error("Codex app-server exited before turn completion."));
        }
      });

      try {
        const initializeResult = await initializeClient(client);
        state.resultKind = effectiveOptions.resultKind || "runtime-result";
        queue.push({ type: "codex.initialize.completed", result: initializeResult });

        const threadStartResult = await client.request("thread/start", {
          cwd: projectRoot,
          ephemeral: true,
          approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
          approvalsReviewer: "user",
          model: effectiveOptions.model || null,
          runtimeWorkspaceRoots: [projectRoot]
        });
        state.threadId = readId(threadStartResult?.thread);
        if (!state.threadId) {
          throw new Error("thread/start did not return a thread id.");
        }
        queue.push({
          type: "codex.thread.start.completed",
          thread_id: state.threadId,
          thread: threadStartResult?.thread || null
        });

        stdinControls = effectiveOptions.superviseStdin
          ? attachStdinControls({ client, queue, state })
          : null;

        const turnStartParams = {
          threadId: state.threadId,
          cwd: projectRoot,
          approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
          approvalsReviewer: "user",
          model: effectiveOptions.model || null,
          input: [{ type: "text", text: prompt }]
        };
        if (effectiveOptions.outputSchema) {
          turnStartParams.outputSchema = effectiveOptions.outputSchema;
        }
        const turnStartResult = await client.request("turn/start", turnStartParams);
        state.turnId = readId(turnStartResult?.turn);
        if (!state.turnId) {
          throw new Error("turn/start did not return a turn id.");
        }
        queue.push({
          type: "codex.turn.start.completed",
          thread_id: state.threadId,
          turn_id: state.turnId,
          turn: turnStartResult?.turn || null
        });
      } catch (error) {
        stdinControls?.close();
        client.close();
        throw error;
      }

      try {
        for await (const event of queue) {
          yield event;
        }
      } finally {
        stdinControls?.close();
        client.close();
      }
    }
  };
}

function handleServerRequest({ message, queue, options }) {
  queue.push({
    type: `codex.server_request.${message.method.replaceAll("/", ".")}`,
    method: message.method,
    params: message.params || null,
    approval_policy: options.approvalPolicy || "on-request"
  });

  switch (message.method) {
    case "currentTime/read":
      return { currentTimeAt: Math.floor(Date.now() / 1000) };
    case "item/commandExecution/requestApproval":
    case "execCommandApproval":
      return approvalDecision(options, "command");
    case "item/fileChange/requestApproval":
    case "applyPatchApproval":
      return approvalDecision(options, "fileChange");
    case "item/tool/requestUserInput":
      return { answers: {} };
    case "mcpServer/elicitation/request":
      return { action: "decline", content: null };
    case "item/permissions/requestApproval":
      return permissionDecision(options);
    default:
      throw new Error(`Unhandled server request: ${message.method}`);
  }
}

function approvalDecision(options, kind) {
  const policy = options.approvalPolicy || "on-request";
  if (policy === "never") {
    return { decision: kind === "fileChange" ? "decline" : "denied" };
  }
  return {
    decision: "approve",
    approved: true,
    reason: `Arckit Runtime approved ${kind} under approvalPolicy=${policy}.`
  };
}

function permissionDecision(options) {
  const policy = options.approvalPolicy || "on-request";
  if (policy === "never") {
    return { decision: "denied", approved: false };
  }
  return {
    decision: "approve",
    approved: true,
    reason: `Arckit Runtime approved requested permissions under approvalPolicy=${policy}.`
  };
}

export async function probeCodexAppServer(options = {}) {
  const projectRoot = resolve(options.project || ".");
  const client = createClient(projectRoot, options);
  const notifications = [];
  client.onNotification((message) => notifications.push(message.method));
  try {
    const initialize = await initializeClient(client);
    client.close();
    return {
      ok: true,
      codex_bin: options.codexBin || "codex",
      project_root: projectRoot,
      initialize,
      notifications
    };
  } catch (error) {
    client.close();
    return {
      ok: false,
      codex_bin: options.codexBin || "codex",
      project_root: projectRoot,
      error: String(error)
    };
  }
}

function createClient(projectRoot, options) {
  return new JsonRpcStdioClient({
    command: options.codexBin || "codex",
    args: ["app-server", "--stdio"],
    cwd: projectRoot,
    stderr: "inherit"
  });
}

async function initializeClient(client) {
  const result = await client.request("initialize", {
    clientInfo: {
      name: "arckit-runtime",
      title: "Arckit Runtime",
      version: "0.1.0"
    },
    capabilities: {
      experimentalApi: true
    }
  });
  client.notify("initialized", {});
  return result;
}

function handleNotification({ message, queue, state, client }) {
  const event = normalizeNotification(message);
  queue.push(event);

  if (message.method === "thread/started") {
    state.threadId = message.params?.threadId || readId(message.params?.thread) || state.threadId;
  }
  if (message.method === "turn/started") {
    state.threadId = message.params?.threadId || state.threadId;
    state.turnId = readId(message.params?.turn) || state.turnId;
  }
  if (message.method === "item/agentMessage/delta") {
    state.agentText += message.params?.delta || "";
  }
  if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
    state.lastCompletedAgentText = message.params.item.text || state.lastCompletedAgentText;
  }
  if (message.method === "error" && message.params?.willRetry !== true) {
    state.lastError = message.params?.error || message.params || message;
  }
  if (message.method === "item/agentMessage/delta" && message.params?.delta) {
    state.lastError = null;
  }
  if (message.method === "turn/completed") {
    state.completed = true;
    const parsed = parseWorkerOutput({
      text: state.lastCompletedAgentText || state.agentText,
      completionParams: message.params,
      resultKind: state.resultKind || "runtime-result",
      error: state.lastError
    });
    queue.push(parsed);
    queue.close();
    client.close();
  }
}

function normalizeNotification(message) {
  const params = message.params || {};
  const raw_rpc = {
    method: message.method,
    params
  };
  switch (message.method) {
    case "thread/started":
      return {
        type: "codex.thread.started",
        raw_rpc,
        thread_id: params.threadId || readId(params.thread),
        thread: params.thread || null
      };
    case "turn/started":
      return {
        type: "codex.turn.started",
        raw_rpc,
        thread_id: params.threadId || null,
        turn_id: readId(params.turn),
        turn: params.turn || null
      };
    case "turn/completed":
      return {
        type: "codex.turn.completed",
        raw_rpc,
        thread_id: params.threadId || null,
        turn_id: readId(params.turn),
        turn: params.turn || null
      };
    case "item/agentMessage/delta":
      return {
        type: "codex.agent_message.delta",
        raw_rpc,
        text: params.delta || "",
        item_id: params.itemId || null
      };
    case "turn/plan/updated":
      return {
        type: "codex.plan.updated",
        raw_rpc,
        plan: params.plan || params
      };
    case "item/commandExecution/outputDelta":
      return {
        type: "codex.command.output.delta",
        raw_rpc,
        text: params.delta || "",
        item_id: params.itemId || null
      };
    case "item/reasoning/summaryTextDelta":
    case "item/reasoning/textDelta":
      return {
        type: "codex.reasoning.delta",
        raw_rpc,
        text: params.delta || "",
        item_id: params.itemId || null
      };
    default:
      return {
        type: `codex.${message.method.replaceAll("/", ".")}`,
        raw_rpc,
        method: message.method,
        params
      };
  }
}

function attachStdinControls({ client, queue, state }) {
  const readline = createInterface({ input: process.stdin, terminal: false });
  readline.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    try {
      if (trimmed === "/interrupt") {
        requireActiveTurn(state);
        const result = await client.request("turn/interrupt", {
          threadId: state.threadId,
          turnId: state.turnId
        });
        queue.push({
          type: "runtime.operator.interrupt.sent",
          thread_id: state.threadId,
          turn_id: state.turnId,
          result
        });
        return;
      }
      if (trimmed.startsWith("/steer ")) {
        requireActiveTurn(state);
        const text = trimmed.slice("/steer ".length).trim();
        if (!text) {
          throw new Error("/steer requires non-empty text.");
        }
        const result = await client.request("turn/steer", {
          threadId: state.threadId,
          expectedTurnId: state.turnId,
          input: [{ type: "text", text }]
        });
        queue.push({
          type: "runtime.operator.steer.sent",
          thread_id: state.threadId,
          turn_id: state.turnId,
          text,
          result
        });
        return;
      }
      queue.push({
        type: "runtime.operator.input.ignored",
        message: "Use /steer <text> or /interrupt."
      });
    } catch (error) {
      queue.push({
        type: "runtime.operator.command.failed",
        message: String(error)
      });
    }
  });
  return readline;
}

function requireActiveTurn(state) {
  if (!state.threadId || !state.turnId) {
    throw new Error("No active Codex turn is available yet.");
  }
}

function readId(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return value.id || value.turnId || value.threadId || null;
}

function parseWorkerOutput({ text, completionParams, resultKind, error }) {
  if (resultKind === "controller-review") {
    if (error) {
      return {
        type: "runtime.controller_review",
        review: createInvalidControllerReview(`Codex controller failed before returning an arckit-controller-review/v1 JSON object: ${codexErrorMessage(error)}`)
      };
    }
    try {
      return {
        type: "runtime.controller_review",
        review: parseJsonFromText(text)
      };
    } catch (error) {
      return {
        type: "runtime.controller_review",
        review: createInvalidControllerReview(`Codex controller did not return a valid arckit-controller-review/v1 JSON object: ${error.message}`)
      };
    }
  }
  if (resultKind === "controller-plan") {
    if (error) {
      return {
        type: "runtime.controller_plan",
        plan: createInvalidControllerPlan(`Codex controller failed before returning an arckit-controller-plan/v1 JSON object: ${codexErrorMessage(error)}`)
      };
    }
    try {
      return {
        type: "runtime.controller_plan",
        plan: parseJsonFromText(text)
      };
    } catch (error) {
      return {
        type: "runtime.controller_plan",
        plan: createInvalidControllerPlan(`Codex controller did not return a valid arckit-controller-plan/v1 JSON object: ${error.message}`)
      };
    }
  }
  if (resultKind === "worker-report") {
    if (error) {
      return {
        type: "runtime.worker_report",
        report: createInvalidWorkerReport(`Codex worker failed before returning an arckit-worker-report/v1 JSON object: ${codexErrorMessage(error)}`)
      };
    }
    try {
      return {
        type: "runtime.worker_report",
        report: parseJsonFromText(text)
      };
    } catch (error) {
      return {
        type: "runtime.worker_report",
        report: createInvalidWorkerReport(`Codex worker did not return a valid arckit-worker-report/v1 JSON object: ${error.message}`)
      };
    }
  }
  return {
    type: "runtime.result",
    result: parseRuntimeResultOrBlocked(text, completionParams)
  };
}

function parseRuntimeResultOrBlocked(text, completionParams) {
  try {
    return parseJsonFromText(text).runtime_result || parseJsonFromText(text);
  } catch (error) {
    return createBlockedRuntimeResult({
      summary: `Codex turn completed but did not return a valid arckit-runtime-result/v1 JSON envelope: ${error.message}`,
      completionParams
    });
  }
}

function parseJsonFromText(text) {
  const candidates = [];
  const trimmed = text.trim();
  if (trimmed) {
    candidates.push(trimmed);
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    candidates.push(fenced[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return parsed.runtime_result || parsed;
    } catch {
      // Try the next extraction shape.
    }
  }
  throw new Error("No parseable JSON object found in final assistant text.");
}

function createInvalidControllerReview(summary) {
  return {
    schema_version: "arckit-controller-review/v1",
    status: "blocked",
    summary,
    accepted_reports: [],
    rejected_reports: [],
    risks: [summary],
    unknowns: [],
    next_prompt: "Retry Controller review with the required arckit-controller-review/v1 output contract.",
    human_decision_required: false
  };
}

function createInvalidControllerPlan(summary) {
  return {
    schema_version: "arckit-controller-plan/v1",
    status: "blocked",
    summary,
    route_plan: {
      mode: "agent_selected_route",
      selected_gap: {
        id: "",
        dimension: "",
        current_state: "",
        target_state: "",
        urgency: "",
        risk: "",
        impact: "",
        next_transition: ""
      },
      selected_worker_types: [],
      selected_roles: [],
      reason: summary,
      requires_human_confirmation: false
    },
    worker_intents: [],
    risks: [summary],
    unknowns: [],
    next_controller_action: "Retry Controller planning with the required arckit-controller-plan/v1 output contract."
  };
}

function createInvalidWorkerReport(summary) {
  return {
    schema_version: "arckit-worker-report/v1",
    task_id: "",
    worker_type: "implementation",
    role: "agent_defined_worker",
    status: "invalid",
    summary,
    findings: [],
    evidence: [],
    changes: [],
    artifact_impacts: [],
    risks: [summary],
    unknowns: [],
    recommendation: "Retry the worker with the required arckit-worker-report/v1 output contract.",
    requires_main_agent_decision: true,
    requires_human_decision: false
  };
}

function codexErrorMessage(error) {
  const message = typeof error === "string" ? error : error?.message || error?.additionalDetails || JSON.stringify(error);
  if (!message) {
    return "Unknown Codex app-server error.";
  }
  try {
    const parsed = JSON.parse(message);
    return parsed?.error?.message || parsed?.message || message;
  } catch {
    return message;
  }
}

function createBlockedRuntimeResult({ summary, completionParams }) {
  return {
    schema_version: "arckit-runtime-result/v1",
    round_result: "blocked",
    summary,
    changed_files: [],
    artifact_impact_scan: {
      project: "none",
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
      handoff: "none"
    },
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: true,
      deferred_projections: [],
      blocked_projections: []
    },
    validation_evidence: [],
    loop_handoff: {
      version: "loop-handoff/v1",
      status: "blocked",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "manual_bridge",
      responsibility_reason: "Runtime needs a follow-up turn that returns a valid structured result before ledger writeback.",
      next_prompt: "Return a valid arckit-runtime-result/v1 JSON object for the completed turn.",
      agent_instruction: {
        goal: "Return a valid arckit-runtime-result/v1 JSON object for the completed turn.",
        required_context_refs: [],
        required_actions: [
          "Return only a valid arckit-runtime-result/v1 JSON object."
        ],
        required_checks: [
          "runtime result validation"
        ],
        stop_condition: completionParams
          ? `Previous turn completion params: ${JSON.stringify(completionParams)}`
          : "Stop after producing a valid runtime result."
      },
      human_gate: {
        required: false,
        reason: "",
        decision_needed: ""
      },
      progress_guard: {
        expected_state_change: "Valid structured runtime result.",
        actual_state_change: "Codex turn did not return parseable runtime JSON.",
        no_progress_limit: 1,
        max_auto_rounds: 1
      }
    }
  };
}
