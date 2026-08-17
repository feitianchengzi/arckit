import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { JsonRpcStdioClient } from "../src/json-rpc-stdio-client.mjs";
import { AsyncEventQueue } from "../src/async-event-queue.mjs";
import { assertCodexOutputSchema } from "../src/codex-output-schema.mjs";
import { endLifecycleSpan, startLifecycleSpan } from "../src/observability/lifecycle-trace.mjs";

export function createCodexAppServerAdapter(adapterOptions = {}) {
  let client = null;
  let initialized = false;
  let initializedProjectRoot = "";
  let initializeResult = null;
  let activeTurn = null;
  let activeCompaction = null;
  let stdinControls = null;
  const threads = new Map();
  const loadedThreadIds = new Set();
  const latestUsageByThread = new Map();
  const activeCommands = new Map();
  const commandItems = new Map();

  const adapter = {
    name: "codex-app-server",
    async *runTurn({ projectRoot, prompt, options = {} }) {
      const effectiveOptions = { ...adapterOptions, ...options };
      if (effectiveOptions.outputSchema) {
        assertCodexOutputSchema(effectiveOptions.outputSchema, { name: `${effectiveOptions.resultKind || "turn"}.outputSchema` });
      }
      if (activeTurn) {
        throw new Error("Codex app-server adapter supports one active turn at a time.");
      }
      if (initializedProjectRoot && initializedProjectRoot !== resolve(projectRoot)) {
        throw new Error(`Codex app-server adapter is already bound to ${initializedProjectRoot}.`);
      }
      const queue = new AsyncEventQueue();
      const tracedOptions = {
        ...effectiveOptions,
        lifecycleEventSink(event) {
          if (effectiveOptions.streamEvents) console.error(JSON.stringify({ event }));
        }
      };
      const state = {
        threadId: null,
        turnId: null,
        agentText: "",
        lastCompletedAgentText: "",
        lastError: null,
        completed: false,
        turnStarted: false,
        resultKind: "runtime-result",
        turnSpan: null,
        itemSpans: new Map()
      };
      activeTurn = { queue, state, options: tracedOptions };

      try {
        if (!client) {
          client = createClient(projectRoot, effectiveOptions);
          initializedProjectRoot = resolve(projectRoot);
          client.onNotification((message) => {
            rememberTokenUsage(message, latestUsageByThread);
            settleCompactionNotification(message, activeCompaction);
            if (activeTurn) {
              handleNotification({
                message,
                queue: activeTurn.queue,
                state: activeTurn.state,
                options: activeTurn.options,
                activeCommands,
                commandItems
              });
            }
          });
          client.onRequest((message) => handleServerRequest({
            message,
            queue: activeTurn?.queue || new AsyncEventQueue(),
            options: activeTurn?.options || tracedOptions,
            activeCommands,
            commandItems
          }));
          client.onClose(({ error }) => {
            if (activeTurn && !activeTurn.state.completed) {
              activeTurn.queue.fail(error || new Error("Codex app-server exited before turn completion."));
            }
            client = null;
            initialized = false;
            threads.clear();
            loadedThreadIds.clear();
            activeCommands.clear();
            commandItems.clear();
          });
        }
        if (!initialized) {
          const initializeSpan = startLifecycleSpan(tracedOptions, {
            name: "codex.initialize",
            category: "agent_runtime",
            cost_center: tracedOptions.lifecycleCostCenter || "orchestration"
          });
          try {
            initializeResult = await initializeClient(client);
            initialized = true;
            endLifecycleSpan(tracedOptions, initializeSpan, { status: "ok" });
          } catch (error) {
            endLifecycleSpan(tracedOptions, initializeSpan, { status: "error", error });
            throw error;
          }
        }
        state.resultKind = effectiveOptions.resultKind || "runtime-result";
        queue.push({ type: "codex.initialize.completed", result: initializeResult });

        const threadKey = String(effectiveOptions.threadKey || "").trim();
        state.threadId = effectiveOptions.threadId || (threadKey ? threads.get(threadKey) : null) || null;
        const threadWasReused = Boolean(state.threadId);
        let threadWasResumed = threadWasReused;
        if (state.threadId && !loadedThreadIds.has(state.threadId)) {
          const resumeSpan = startLifecycleSpan(tracedOptions, {
            name: "codex.thread_resume",
            category: "agent_runtime",
            cost_center: tracedOptions.lifecycleCostCenter || "orchestration"
          });
          try {
            const resumeResult = await client.request("thread/resume", {
              threadId: state.threadId,
              cwd: projectRoot,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              model: effectiveOptions.model || null
            });
            loadedThreadIds.add(state.threadId);
            if (threadKey) threads.set(threadKey, state.threadId);
            queue.push({
              type: "codex.thread.resume.completed",
              thread_id: state.threadId,
              thread_key: threadKey || null,
              thread: resumeResult?.thread || null
            });
            endLifecycleSpan(tracedOptions, resumeSpan, { status: "ok" });
          } catch (error) {
            endLifecycleSpan(tracedOptions, resumeSpan, { status: "error", error });
            if (!isMissingThreadError(error)) {
              throw new Error(`Unable to resume persisted Codex thread ${state.threadId}: ${error.message}`, { cause: error });
            }
            const missingThreadId = state.threadId;
            const fallback = await client.request("thread/start", {
              cwd: projectRoot,
              ephemeral: false,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              approvalsReviewer: "user",
              model: effectiveOptions.model || null,
              runtimeWorkspaceRoots: [projectRoot]
            });
            state.threadId = readId(fallback?.thread);
            if (!state.threadId) throw new Error("Thread recovery fallback did not return a thread id.");
            loadedThreadIds.add(state.threadId);
            if (threadKey) threads.set(threadKey, state.threadId);
            threadWasResumed = false;
            queue.push({
              type: "codex.thread.recovery_fallback",
              missing_thread_id: missingThreadId,
              thread_id: state.threadId,
              thread_key: threadKey || null,
              reason: error.message
            });
          }
        } else if (state.threadId) {
          const reuseSpan = startLifecycleSpan(tracedOptions, {
            name: "codex.thread_reuse",
            category: "agent_runtime",
            cost_center: tracedOptions.lifecycleCostCenter || "orchestration"
          });
          queue.push({
            type: "codex.thread.reused",
            thread_id: state.threadId,
            thread_key: threadKey || null
          });
          endLifecycleSpan(tracedOptions, reuseSpan, { status: "ok", attributes: { reused: true } });
        } else {
          const threadSpan = startLifecycleSpan(tracedOptions, {
            name: "codex.thread_start",
            category: "agent_runtime",
            cost_center: tracedOptions.lifecycleCostCenter || "orchestration"
          });
          let threadStartResult;
          try {
            threadStartResult = await client.request("thread/start", {
              cwd: projectRoot,
              ephemeral: false,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              approvalsReviewer: "user",
              model: effectiveOptions.model || null,
              runtimeWorkspaceRoots: [projectRoot]
            });
            state.threadId = readId(threadStartResult?.thread);
            if (!state.threadId) {
              throw new Error("thread/start did not return a thread id.");
            }
            if (threadKey) {
              threads.set(threadKey, state.threadId);
            }
            loadedThreadIds.add(state.threadId);
            endLifecycleSpan(tracedOptions, threadSpan, { status: "ok", attributes: { reused: false } });
          } catch (error) {
            endLifecycleSpan(tracedOptions, threadSpan, { status: "error", error });
            throw error;
          }
          queue.push({
            type: "codex.thread.start.completed",
            thread_id: state.threadId,
            thread_key: threadKey || null,
            thread: threadStartResult?.thread || null
          });
        }

        if (typeof effectiveOptions.onThreadBound === "function") {
          await effectiveOptions.onThreadBound({
            threadId: state.threadId,
            threadKey: threadKey || null,
            resumed: threadWasResumed,
            boundAt: new Date().toISOString()
          });
        }

        if (effectiveOptions.superviseStdin && !stdinControls) {
          stdinControls = attachStdinControls({ client, getActiveTurn: () => activeTurn });
        }

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
        state.turnSpan = startLifecycleSpan(tracedOptions, {
          name: "codex.turn",
          category: "agent",
          cost_center: tracedOptions.lifecycleCostCenter || "unclassified",
          attributes: {
            result_kind: state.resultKind,
            thread_reused: threadWasReused
          }
        });
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
        endLifecycleSpan(tracedOptions, state.turnSpan, { status: "error", error });
        for (const span of state.itemSpans.values()) endLifecycleSpan(tracedOptions, span, { status: "error", error });
        activeTurn = null;
        client?.close();
        client = null;
        initialized = false;
        initializedProjectRoot = "";
        initializeResult = null;
        threads.clear();
        loadedThreadIds.clear();
        activeCommands.clear();
        commandItems.clear();
        throw error;
      }

      try {
        for await (const event of queue) {
          yield event;
        }
      } finally {
        if (!state.completed) {
          endLifecycleSpan(tracedOptions, state.turnSpan, {
            status: "cancelled",
            attributes: { reason: "turn_stream_closed" }
          });
          for (const span of state.itemSpans.values()) {
            endLifecycleSpan(tracedOptions, span, { status: "cancelled", attributes: { reason: "turn_stream_closed" } });
          }
        }
        if (activeTurn?.state === state) {
          activeTurn = null;
        }
      }
    },
    close() {
      stdinControls?.close();
      stdinControls = null;
      activeTurn?.queue.fail(new Error("Codex app-server adapter closed during an active turn."));
      activeTurn = null;
      activeCompaction?.reject(new Error("Codex app-server adapter closed during context compaction."));
      activeCompaction = null;
      client?.close();
      client = null;
      initialized = false;
      initializedProjectRoot = "";
      initializeResult = null;
      threads.clear();
      loadedThreadIds.clear();
      latestUsageByThread.clear();
      activeCommands.clear();
      commandItems.clear();
    },
    threadId(threadKey) {
      return threads.get(String(threadKey || "").trim()) || null;
    },
    latestContextUsage(threadKey) {
      const threadId = threads.get(String(threadKey || "").trim()) || String(threadKey || "").trim();
      return latestUsageByThread.get(threadId) || null;
    },
    async compactThread({ threadKey = "", threadId = "", options = {} } = {}) {
      if (activeTurn) throw new Error("Cannot compact a Codex thread while a turn is active.");
      if (activeCompaction) throw new Error("Codex app-server adapter supports one active compaction at a time.");
      const id = String(threadId || threads.get(String(threadKey || "").trim()) || "").trim();
      if (!id || !loadedThreadIds.has(id) || !client || !initialized) throw new Error("Cannot compact an unloaded Codex thread.");
      const compaction = createCompactionWaiter(id);
      activeCompaction = compaction;
      try {
        const result = await client.request("thread/compact/start", { threadId: id });
        compaction.turnId = readId(result?.turn) || "";
        await compaction.promise;
        return { thread_id: id, turn_id: compaction.turnId, result };
      } finally {
        activeCompaction = null;
      }
    }
  };
  return adapter;
}

function rememberTokenUsage(message, latestUsageByThread) {
  if (message?.method !== "thread/tokenUsage/updated") return;
  const params = message.params || {};
  const threadId = String(params.threadId || "").trim();
  const inputTokens = Number(params.tokenUsage?.last?.inputTokens || 0);
  const modelContextWindow = Number(params.tokenUsage?.modelContextWindow || 0);
  if (!threadId || !Number.isFinite(inputTokens) || !Number.isFinite(modelContextWindow)) return;
  latestUsageByThread.set(threadId, {
    thread_id: threadId,
    turn_id: String(params.turnId || ""),
    input_tokens: Math.max(0, inputTokens),
    model_context_window: Math.max(0, modelContextWindow),
    context_utilization: modelContextWindow > 0 ? Math.min(Math.max(inputTokens / modelContextWindow, 0), 1) : 0,
    updated_at: new Date().toISOString()
  });
}

function createCompactionWaiter(threadId) {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { threadId, turnId: "", promise, resolve: resolvePromise, reject: rejectPromise };
}

function settleCompactionNotification(message, compaction) {
  if (!compaction) return;
  const params = message.params || {};
  const threadId = String(params.threadId || "");
  const turnId = String(readId(params.turn) || params.turnId || "");
  if (threadId && threadId !== compaction.threadId) return;
  if (compaction.turnId && turnId && turnId !== compaction.turnId) return;
  if (message.method === "error" && params.willRetry !== true) {
    compaction.reject(new Error(codexErrorMessage(params.error || params)));
    return;
  }
  if (message.method === "turn/completed") compaction.resolve();
}

function isMissingThreadError(error) {
  const text = codexErrorMessage(error).toLowerCase();
  return /thread/.test(text) && /(not found|unknown|missing|404)/.test(text);
}

function handleServerRequest({ message, queue, options, activeCommands, commandItems }) {
  queue.push({
    type: `codex.server_request.${message.method.replaceAll("/", ".")}`,
    method: message.method,
    params: message.params || null,
    approval_policy: options.approvalPolicy || "on-request"
  });

  switch (message.method) {
    case "currentTime/read":
      return { currentTimeAt: Math.floor(Date.now() / 1000) };
    case "item/commandExecution/requestApproval": {
      if ((options.approvalPolicy || "on-request") === "never") {
        return modernApprovalDecision(options);
      }
      const duplicate = registerCommandApproval(message.params, activeCommands, commandItems);
      if (duplicate) {
        queue.push({
          type: "codex.command.duplicate.suppressed",
          command: message.params?.command || "",
          cwd: message.params?.cwd || "",
          item_id: message.params?.itemId || null,
          active_item_id: duplicate.item_id || null,
          active_started_at_ms: duplicate.started_at_ms || null,
          warning: "An equivalent command is already running in this workspace."
        });
        return {
          decision: "decline"
        };
      }
      return modernApprovalDecision(options);
    }
    case "execCommandApproval": {
      const duplicate = registerCommandApproval(message.params, activeCommands, commandItems);
      if (duplicate) {
        return {
          decision: {
            denied: {
              rejection: `Equivalent command already running as ${duplicate.item_id || "an active item"}.`
            }
          }
        };
      }
      return legacyApprovalDecision(options);
    }
    case "item/fileChange/requestApproval":
      return modernApprovalDecision(options);
    case "applyPatchApproval":
      return legacyApprovalDecision(options);
    case "item/tool/requestUserInput":
      return { answers: {} };
    case "mcpServer/elicitation/request":
      return { action: "decline", content: null };
    case "item/permissions/requestApproval":
      return permissionDecision(options, message.params);
    default:
      throw new Error(`Unhandled server request: ${message.method}`);
  }
}

function registerCommandApproval(params = {}, activeCommands, commandItems) {
  const command = String(params.command || "").trim();
  if (!command || !activeCommands || !commandItems) return null;
  const itemId = String(params.itemId || "").trim();
  const fingerprint = `${String(params.cwd || "").trim()}\n${canonicalCommand(command)}`;
  const existing = activeCommands.get(fingerprint);
  if (existing && existing.item_id !== itemId) return existing;
  const entry = {
    fingerprint,
    item_id: itemId,
    command,
    cwd: String(params.cwd || ""),
    started_at_ms: Number(params.startedAtMs || Date.now())
  };
  activeCommands.set(fingerprint, entry);
  if (itemId) commandItems.set(itemId, fingerprint);
  return null;
}

function canonicalCommand(command) {
  const normalized = String(command || "").trim().replace(/\s+/g, " ");
  if (!/\bcmake\s+--build\b/.test(normalized)) return normalized;
  return normalized
    .replace(/\s(?:-j\s*\d+|-j\d+|--parallel(?:[=\s]\d+)?)(?=\s|['"]|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function modernApprovalDecision(options) {
  const policy = options.approvalPolicy || "on-request";
  if (policy === "never") {
    return { decision: "decline" };
  }
  return { decision: "accept" };
}

function legacyApprovalDecision(options) {
  const policy = options.approvalPolicy || "on-request";
  if (policy === "never") {
    return { decision: { denied: { rejection: "ArcOrbit approval policy denied the request." } } };
  }
  return { decision: "approved" };
}

function permissionDecision(options, params = {}) {
  const policy = options.approvalPolicy || "on-request";
  const requested = params?.permissions && typeof params.permissions === "object" ? params.permissions : {};
  return {
    permissions: policy === "never" ? {} : {
      ...(Object.hasOwn(requested, "fileSystem") ? { fileSystem: requested.fileSystem } : {}),
      ...(Object.hasOwn(requested, "network") ? { network: requested.network } : {})
    },
    scope: "turn"
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
  if (typeof options.clientFactory === "function") {
    return options.clientFactory({ projectRoot, options });
  }
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
      name: "arcorbit",
      title: "ArcOrbit",
      version: "0.1.0"
    },
    capabilities: {
      experimentalApi: true
    }
  });
  client.notify("initialized", {});
  return result;
}

function handleNotification({ message, queue, state, options, activeCommands, commandItems }) {
  const event = normalizeNotification(message);
  queue.push(event);

  if (message.method === "item/started") {
    const item = message.params?.item || {};
    const itemId = String(item.id || message.params?.itemId || "").trim();
    if (itemId && ["commandExecution", "toolCall", "webSearch", "fileChange"].includes(item.type)) {
      const span = startLifecycleSpan({
        ...options,
        lifecycleParentSpanId: state.turnSpan?.span_id || options.lifecycleParentSpanId
      }, {
        name: `codex.tool.${item.type}`,
        category: "tool",
        cost_center: options.lifecycleCostCenter || "unclassified",
        attributes: {
          item_id: itemId,
          item_type: item.type,
          command_family: item.type === "commandExecution" ? commandFamily(item.command || item.cmd) : ""
        }
      });
      if (span) state.itemSpans.set(itemId, span);
    }
  }

  if (message.method === "thread/started") {
    state.threadId = message.params?.threadId || readId(message.params?.thread) || state.threadId;
  }
  if (message.method === "turn/started") {
    state.threadId = message.params?.threadId || state.threadId;
    state.turnId = readId(message.params?.turn) || state.turnId;
    state.turnStarted = true;
  }
  if (message.method === "item/agentMessage/delta") {
    state.agentText += message.params?.delta || "";
  }
  if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
    state.lastCompletedAgentText = message.params.item.text || state.lastCompletedAgentText;
  }
  if (message.method === "item/completed") {
    const item = message.params?.item || {};
    const itemId = String(item.id || message.params?.itemId || "").trim();
    releaseCommand(itemId, activeCommands, commandItems);
    const span = state.itemSpans.get(itemId);
    if (span) {
      const exitCode = item.exitCode ?? item.exit_code;
      endLifecycleSpan(options, span, {
        status: exitCode === undefined || exitCode === null || exitCode === 0 ? "ok" : "error",
        attributes: {
          item_id: itemId,
          exit_code: Number.isInteger(exitCode) ? exitCode : -1
        },
        error: Number.isInteger(exitCode) && exitCode !== 0 ? `Tool exited with code ${exitCode}` : null
      });
      state.itemSpans.delete(itemId);
    }
  }
  if (message.method === "error" && message.params?.willRetry !== true) {
    state.lastError = message.params?.error || message.params || message;
  }
  if (message.method === "item/agentMessage/delta" && message.params?.delta) {
    state.lastError = null;
  }
  if (message.method === "turn/completed") {
    state.turnStarted = false;
    state.completed = true;
    for (const span of state.itemSpans.values()) {
      endLifecycleSpan(options, span, { status: "cancelled", attributes: { reason: "turn_completed" } });
    }
    state.itemSpans.clear();
    endLifecycleSpan(options, state.turnSpan, {
      status: state.lastError ? "error" : "ok",
      attributes: { turn_id: state.turnId || "" },
      error: state.lastError
    });
    if (state.lastError && state.resultKind === "agent-loop-result") {
      activeCommands?.clear();
      commandItems?.clear();
      queue.fail(createTerminalCodexTurnError(state.lastError));
      return;
    }
    const parsed = parseStructuredOutput({
      text: state.lastCompletedAgentText || state.agentText,
      completionParams: message.params,
      resultKind: state.resultKind || "runtime-result",
      error: state.lastError
    });
    queue.push(parsed);
    activeCommands?.clear();
    commandItems?.clear();
    queue.close();
  }
}

function commandFamily(value) {
  const command = String(value || "").trim();
  if (!command) return "";
  return command.split(/\s+/)[0].split("/").at(-1).slice(0, 80);
}

function releaseCommand(itemId, activeCommands, commandItems) {
  const normalized = String(itemId || "").trim();
  if (!normalized || !commandItems) return;
  const fingerprint = commandItems.get(normalized);
  if (fingerprint) activeCommands?.delete(fingerprint);
  commandItems.delete(normalized);
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

function attachStdinControls({ client, getActiveTurn }) {
  const readline = createInterface({ input: process.stdin, terminal: false });
  readline.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    const active = getActiveTurn();
    if (!active) {
      return;
    }
    const { queue, state } = active;
    try {
      if (trimmed === "/interrupt") {
        await waitForActiveTurn(state);
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
        await waitForActiveTurn(state);
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

export async function waitForActiveTurn(state, { timeoutMs = 5_000, pollIntervalMs = 10 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (!state?.turnStarted) {
    if (state?.completed) throw new Error("The Codex turn already completed before the operator command could be sent.");
    if (Date.now() >= deadline) throw new Error("No active Codex turn became available before the operator command timeout.");
    await new Promise((resolvePromise) => setTimeout(resolvePromise, pollIntervalMs));
  }
  if (!state.threadId || !state.turnId) throw new Error("No active Codex turn is available yet.");
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

function parseStructuredOutput({ text, completionParams, resultKind, error }) {
  if (resultKind === "task-closeout-result") {
    if (error) return {
      type: "runtime.task_closeout_result",
      result: invalidTaskCloseoutResult(codexErrorMessage(error))
    };
    try {
      return { type: "runtime.task_closeout_result", result: parseJsonFromText(text) };
    } catch (parseError) {
      return { type: "runtime.task_closeout_result", result: invalidTaskCloseoutResult(parseError.message) };
    }
  }
  if (resultKind === "agent-loop-result") {
    if (error) {
      return {
        type: "runtime.agent_loop_result",
        result: createInvalidAgentLoopResult(`Codex Agent failed before returning arckit-agent-loop-result/v1: ${codexErrorMessage(error)}`)
      };
    }
    try {
      return {
        type: "runtime.agent_loop_result",
        result: parseJsonFromText(text)
      };
    } catch (error) {
      return {
        type: "runtime.agent_loop_result",
        result: createInvalidAgentLoopResult(`Codex Agent did not return valid arckit-agent-loop-result/v1 JSON: ${error.message}`)
      };
    }
  }
  return {
    type: "runtime.result",
    result: parseRuntimeResultOrBlocked(text, completionParams)
  };
}

function invalidTaskCloseoutResult(message) {
  return {
    schema_version: "arckit-task-closeout-result/v1",
    status: "failed",
    outcome: "none",
    summary: "Task closeout failed.",
    evidence: [],
    commit_hash: "",
    error: String(message || "unknown_closeout_error")
  };
}

function parseRuntimeResultOrBlocked(text, completionParams) {
  try {
    return parseJsonFromText(text).runtime_result || parseJsonFromText(text);
  } catch (error) {
    return createBlockedRuntimeResult({
      summary: `Codex turn completed but did not return a valid arckit-runtime-result/v2 JSON envelope: ${error.message}`,
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

function createInvalidAgentLoopResult(summary) {
  return {
    schema_version: "arckit-agent-loop-result/v1",
    action: "handoff",
    summary,
    case_control: null,
    case_transition: null,
    changed_files: [],
    artifact_impacts: [],
    risks: [summary],
    unknowns: [],
    handoff: {
      next_responsibility: "agent",
      reason: summary,
      next_prompt: "Retry from fresh canonical state.",
      human_decision_required: false
    }
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

function createTerminalCodexTurnError(error) {
  const failure = new Error(`Codex Agent turn failed before returning arckit-agent-loop-result/v1: ${codexErrorMessage(error)}`);
  failure.name = "CodexTurnError";
  failure.code = codexErrorCode(error) || "codex_turn_failed";
  failure.retryable = false;
  return failure;
}

function codexErrorCode(error) {
  if (typeof error === "object" && error !== null) {
    if (typeof error.code === "string") return error.code;
    if (typeof error.error?.code === "string") return error.error.code;
  }
  const message = typeof error === "string" ? error : error?.message || error?.additionalDetails || "";
  try {
    const parsed = JSON.parse(message);
    return parsed?.error?.code || parsed?.code || "";
  } catch {
    return "";
  }
}

function createBlockedRuntimeResult({ summary, completionParams }) {
  return {
    schema_version: "arckit-runtime-result/v2",
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
      version: "loop-handoff/v2",
      status: "blocked",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "manual_bridge",
      responsibility_reason: "Runtime needs a follow-up turn that returns a valid structured result before ledger writeback.",
      next_prompt: "Return a valid arckit-runtime-result/v2 JSON object for the completed turn.",
      agent_instruction: {
        goal: "Return a valid arckit-runtime-result/v2 JSON object for the completed turn.",
        required_context_refs: [],
        required_actions: [
          "Return only a valid arckit-runtime-result/v2 JSON object."
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
