import { workbenchAgentOptions } from '../src/workbench/agent-bridge.mjs';
import { resolveCodexExecutionPolicy } from '../src/codex-execution-policy.mjs';
import { createExecutionControl, executionStopError, requestExecutionStop } from "../src/kernel/execution-control.mjs";
import { invalidTaskCloseoutResult } from '../src/task-closeout-contract.mjs';
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { JsonRpcStdioClient } from "../src/json-rpc-stdio-client.mjs";
import { AsyncEventQueue } from "../src/async-event-queue.mjs";
import { assertCodexOutputSchema } from "../src/codex-output-schema.mjs";
import { configureCodexSceneSkills } from "../src/codex-scene-skills.mjs";
import { endLifecycleSpan, startLifecycleSpan } from "../src/observability/lifecycle-trace.mjs";

const RESPONSES_TEXT_LIMIT = 10 * 1024 * 1024;
const DEFAULT_AGENT_TEXT_LIMIT = 8 * 1024 * 1024;
const DEFAULT_STRUCTURED_AGENT_TEXT_LIMIT = 1024 * 1024;
const DEFAULT_TRAILING_WHITESPACE_LIMIT = 64 * 1024;
const DEFAULT_PROJECTION_TEXT_LIMIT = 256_000;

export function createCodexAppServerAdapter(adapterOptions = {}) {
  let client = null;
  let stopRequested = false;
  const controlFile = adapterOptions.executionControlFile || process.env.ARCORBIT_EXECUTION_CONTROL_FILE;
  const executionControl = controlFile ? createExecutionControl(controlFile) : null;
  function assertRunning() {
    if (stopRequested) throw executionStopError('operator_stop');
    executionControl?.assertRunning();
  }
  function stopExecution(error = executionStopError('operator_stop')) {
    if (stopRequested) return;
    stopRequested = true;
    // Persist stdin/utility-host stops too; a process restart must not clear them.
    // Failure to persist must never prevent immediate termination.
    if (controlFile) {
      try { requestExecutionStop(controlFile); }
      catch (persistenceError) { console.error(`Could not persist execution stop: ${persistenceError.message}`); }
    }
    const state = activeTurn?.state;
    if (state?.threadId && state?.turnId) client?.request('turn/interrupt', { threadId: state.threadId, turnId: state.turnId }).catch(() => {});
    activeTurn?.queue.fail(error);
    activeCompaction?.reject(error);
    client?.close();
  }
  let initialized = false;
  let initializedProjectRoot = "";
  let initializeResult = null;
  let sceneSkills = null;
  let activeTurn = null;
  let activeCompaction = null;
  let stdinControls = null;
  const threads = new Map();
  const loadedThreadIds = new Set();
  const latestUsageByThread = new Map();
  const activeCommands = new Map();
  const commandItems = new Map();

  const watchdog = executionControl ? setInterval(() => {
    try { assertRunning(); }
    catch (error) { stopExecution(error); }
  }, 1000) : null;
  watchdog?.unref();

  const adapter = {
    name: "codex-app-server",
    async *runTurn({ projectRoot, prompt, options = {} }) {
      assertRunning();
      const effectiveOptions = resolveCodexExecutionPolicy({ ...workbenchAgentOptions(options.env || process.env), ...adapterOptions, ...options }, projectRoot);
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
        itemSpans: new Map(),
        outputGuardError: null,
        outputGuardInterrupt: null,
        outputMetrics: { total_chars: 0, trailing_whitespace_chars: 0 },
        outputLimits: null
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
                client,
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
            state: activeTurn?.state,
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
            sceneSkills = null;
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
        if (effectiveOptions.sceneSkillBinding) {
          if (sceneSkills && sceneSkills.fingerprint !== effectiveOptions.sceneSkillBinding.fingerprint) throw new Error('Scene skills changed; recreate the idle adapter and resume the same thread.');
          if (!sceneSkills) sceneSkills = await configureCodexSceneSkills(client, projectRoot, effectiveOptions.sceneSkillBinding);
        }
        if (sceneSkills?.dynamicTools) {
          const upstream = effectiveOptions.dynamicToolProvider;
          effectiveOptions.dynamicTools = [...(effectiveOptions.dynamicTools || []).filter(t => !sceneSkills.dynamicTools.some(s => s.name === t.name)), ...sceneSkills.dynamicTools];
          effectiveOptions.dynamicToolProvider = params => sceneSkills.dynamicTools.some(t => t.name === params.tool) ? sceneSkills.dynamicToolProvider(params) : upstream?.(params);
          tracedOptions.dynamicToolProvider = effectiveOptions.dynamicToolProvider;
        }
        if (effectiveOptions.dynamicTools) {
          // MCP-style tools omit the discriminator; app-server requires one format
          // across the entire list, including tools added by scene configuration.
          effectiveOptions.dynamicTools = effectiveOptions.dynamicTools.map(tool => ({ type: 'function', ...tool }));
          tracedOptions.dynamicTools = effectiveOptions.dynamicTools;
        }
        state.resultKind = effectiveOptions.resultKind || "runtime-result";
        state.outputLimits = resolveAgentOutputLimits(effectiveOptions, state.resultKind);
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
              ...((sceneSkills || effectiveOptions.threadConfig) ? { config: {...(sceneSkills?.config || {}), ...(effectiveOptions.threadConfig || {})}, ...(sceneSkills?.developerInstructions ? {developerInstructions: sceneSkills.developerInstructions} : {}) } : {}),
              threadId: state.threadId,
              cwd: projectRoot,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              ...(effectiveOptions.sandbox ? { sandbox: effectiveOptions.sandbox } : {}),
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
              ...((sceneSkills || effectiveOptions.threadConfig) ? { config: {...(sceneSkills?.config || {}), ...(effectiveOptions.threadConfig || {})}, ...(sceneSkills?.developerInstructions ? {developerInstructions: sceneSkills.developerInstructions} : {}) } : {}),
              cwd: projectRoot,
              ephemeral: false,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              ...(effectiveOptions.sandbox ? { sandbox: effectiveOptions.sandbox } : {}),
              approvalsReviewer: "user",
              model: effectiveOptions.model || null,
              runtimeWorkspaceRoots: [projectRoot],
              ...(effectiveOptions.dynamicTools ? { dynamicTools: effectiveOptions.dynamicTools } : {})
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
              ...((sceneSkills || effectiveOptions.threadConfig) ? { config: {...(sceneSkills?.config || {}), ...(effectiveOptions.threadConfig || {})}, ...(sceneSkills?.developerInstructions ? {developerInstructions: sceneSkills.developerInstructions} : {}) } : {}),
              cwd: projectRoot,
              ephemeral: false,
              approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
              ...(effectiveOptions.sandbox ? { sandbox: effectiveOptions.sandbox } : {}),
              approvalsReviewer: "user",
              model: effectiveOptions.model || null,
              runtimeWorkspaceRoots: [projectRoot],
              ...(effectiveOptions.dynamicTools ? { dynamicTools: effectiveOptions.dynamicTools } : {})
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

        if (threadWasReused && isStructuredAutomationResultKind(state.resultKind)) {
          const repair = await repairUnhealthyThreadHistory({
            client,
            threadId: state.threadId,
            limits: state.outputLimits
          });
          if (repair) {
            queue.push({
              type: "codex.thread.history.repaired",
              thread_id: state.threadId,
              removed_from_turn_id: repair.before_turn_id,
              reason: repair.reason,
              observed_length: repair.observed_length,
              limit: repair.limit
            });
          }
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
          stdinControls = attachStdinControls({ client, getActiveTurn: () => activeTurn, stopExecution });
        }
        if (effectiveOptions.superviseParentPort && !stdinControls) {
          stdinControls = attachParentPortControls({ client, getActiveTurn: () => activeTurn, stopExecution });
        }

        const turnStartParams = {
          threadId: state.threadId,
          cwd: projectRoot,
          approvalPolicy: effectiveOptions.approvalPolicy || "on-request",
          approvalsReviewer: "user",
          model: effectiveOptions.model || null,
          input: [{ type: "text", text: prompt }, ...(effectiveOptions.skillInputs || [])]
        };
        if (effectiveOptions.sandboxPolicy) turnStartParams.sandboxPolicy = effectiveOptions.sandboxPolicy;
        if (effectiveOptions.reasoningEffort) {
          turnStartParams.effort = effectiveOptions.reasoningEffort;
        }
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
        assertRunning();
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
        await client?.close();
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
    async interrupt() {
      if (!activeTurn || !client) throw new Error("No active Codex turn is available.");
      await waitForActiveTurn(activeTurn.state);
      const { state, queue } = activeTurn;
      const result = await client.request("turn/interrupt", {
        threadId: state.threadId,
        turnId: state.turnId
      });
      queue.push({ type: "codex.turn.interrupt.sent", thread_id: state.threadId, turn_id: state.turnId });
      return { thread_id: state.threadId, turn_id: state.turnId, result };
    },
    async close() {
      clearInterval(watchdog);
      stdinControls?.close();
      stdinControls = null;
      activeTurn?.queue.fail(new Error("Codex app-server adapter closed during an active turn."));
      activeTurn = null;
      activeCompaction?.reject(new Error("Codex app-server adapter closed during context compaction."));
      activeCompaction = null;
      await client?.close();
      client = null;
      initialized = false;
      initializedProjectRoot = "";
      initializeResult = null;
      sceneSkills = null;
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
      assertRunning();
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

function isStructuredAutomationResultKind(resultKind) {
  return ["agent-loop-result", "task-closeout-result"].includes(String(resultKind || ""));
}

function resolveAgentOutputLimits(options, resultKind) {
  const structured = isStructuredAutomationResultKind(resultKind);
  return {
    agent_text_limit: positiveLimit(
      options.agentOutputMaxChars,
      structured ? DEFAULT_STRUCTURED_AGENT_TEXT_LIMIT : DEFAULT_AGENT_TEXT_LIMIT
    ),
    history_text_limit: positiveLimit(options.historyTextMaxChars, DEFAULT_AGENT_TEXT_LIMIT),
    trailing_whitespace_limit: positiveLimit(options.agentOutputMaxTrailingWhitespaceChars, DEFAULT_TRAILING_WHITESPACE_LIMIT),
    projection_text_limit: positiveLimit(options.projectionTextMaxChars, DEFAULT_PROJECTION_TEXT_LIMIT)
  };
}

function positiveLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), RESPONSES_TEXT_LIMIT - 1) : fallback;
}

function observeOutputNotification(message, state) {
  if (state.outputGuardError) return null;
  const limits = state.outputLimits || resolveAgentOutputLimits({}, state.resultKind);
  if (message.method === "item/agentMessage/delta") {
    const delta = String(message.params?.delta || "");
    state.outputMetrics.total_chars += delta.length;
    state.outputMetrics.trailing_whitespace_chars = trailingWhitespaceAfterDelta(
      state.outputMetrics.trailing_whitespace_chars,
      delta
    );
    if (state.outputMetrics.trailing_whitespace_chars > limits.trailing_whitespace_limit) {
      return {
        reason: "trailing_whitespace_limit",
        observed_length: state.outputMetrics.trailing_whitespace_chars,
        limit: limits.trailing_whitespace_limit
      };
    }
    if (state.outputMetrics.total_chars > limits.agent_text_limit) {
      return {
        reason: "agent_text_limit",
        observed_length: state.outputMetrics.total_chars,
        limit: limits.agent_text_limit
      };
    }
    return null;
  }
  if (message.method !== "item/completed") return null;
  const item = message.params?.item || {};
  if (item.type === "agentMessage") {
    const text = String(item.text || "");
    const trailing = trailingWhitespaceLength(text);
    state.outputMetrics.total_chars = Math.max(state.outputMetrics.total_chars, text.length);
    state.outputMetrics.trailing_whitespace_chars = Math.max(state.outputMetrics.trailing_whitespace_chars, trailing);
    if (trailing > limits.trailing_whitespace_limit) {
      return { reason: "trailing_whitespace_limit", observed_length: trailing, limit: limits.trailing_whitespace_limit };
    }
    if (text.length > limits.agent_text_limit) {
      return { reason: "agent_text_limit", observed_length: text.length, limit: limits.agent_text_limit };
    }
  }
  const unsafe = findUnhealthyText(item, limits, "item");
  return unsafe ? {
    reason: unsafe.reason,
    observed_length: unsafe.observed_length,
    limit: unsafe.limit,
    path: unsafe.path
  } : null;
}

function trailingWhitespaceAfterDelta(previousLength, delta) {
  if (!delta) return previousLength;
  const trailing = trailingWhitespaceLength(delta);
  return trailing === delta.length ? previousLength + trailing : trailing;
}

function trailingWhitespaceLength(value) {
  const text = String(value || "");
  return text.length - text.trimEnd().length;
}

function createAgentOutputGuardError(observation, state) {
  const error = new Error(
    `Codex Agent output was interrupted by ArcOrbit (${observation.reason}: ${observation.observed_length} > ${observation.limit}).`
  );
  error.name = "CodexAgentOutputGuardError";
  error.code = "codex_agent_output_limit_exceeded";
  error.retryable = false;
  error.history_repair_required = true;
  error.thread_id = state.threadId || "";
  error.turn_id = state.turnId || "";
  error.reason = observation.reason;
  error.observed_length = observation.observed_length;
  error.limit = observation.limit;
  if (observation.path) error.item_path = observation.path;
  return error;
}

async function repairUnhealthyThreadHistory({ client, threadId, limits }) {
  let before;
  try {
    before = await client.request("thread/read", { threadId, includeTurns: true });
  } catch (cause) {
    throw createThreadHistoryError("codex_thread_history_preflight_failed", `Unable to inspect persisted Codex thread ${threadId}: ${cause.message}`, cause);
  }
  const thread = before?.thread || before || {};
  const unhealthy = findUnhealthyTurn(thread.turns, limits);
  if (!unhealthy) return null;
  try {
    await client.request("thread/revert", { threadId, beforeTurnId: unhealthy.turn_id });
    const verified = await client.request("thread/read", { threadId, includeTurns: true });
    const remaining = findUnhealthyTurn((verified?.thread || verified || {}).turns, limits);
    if (remaining) {
      throw new Error(`unhealthy text remains in turn ${remaining.turn_id}`);
    }
  } catch (cause) {
    throw createThreadHistoryError(
      "codex_thread_history_repair_failed",
      `Unable to repair persisted Codex thread ${threadId} before turn ${unhealthy.turn_id}: ${cause.message}`,
      cause
    );
  }
  return {
    before_turn_id: unhealthy.turn_id,
    reason: unhealthy.reason,
    observed_length: unhealthy.observed_length,
    limit: unhealthy.limit
  };
}

function findUnhealthyTurn(turns, limits) {
  for (const turn of Array.isArray(turns) ? turns : []) {
    const unhealthy = findUnhealthyText(turn, limits, "turn");
    if (unhealthy) return { ...unhealthy, turn_id: String(turn?.id || "") };
  }
  return null;
}

function findUnhealthyText(value, limits, path, seen = new Set()) {
  if (typeof value === "string") {
    if (value.length > limits.history_text_limit) {
      return { reason: "history_text_limit", observed_length: value.length, limit: limits.history_text_limit, path };
    }
    const trailing = trailingWhitespaceLength(value);
    if (trailing > limits.trailing_whitespace_limit) {
      return { reason: "trailing_whitespace_limit", observed_length: trailing, limit: limits.trailing_whitespace_limit, path };
    }
    return null;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    const unhealthy = findUnhealthyText(child, limits, `${path}.${key}`, seen);
    if (unhealthy) return unhealthy;
  }
  return null;
}

function createThreadHistoryError(code, message, cause) {
  const error = new Error(message, { cause });
  error.name = "CodexThreadHistoryError";
  error.code = code;
  error.retryable = false;
  return error;
}

function sanitizeNotificationForProjection(message, limit = DEFAULT_PROJECTION_TEXT_LIMIT) {
  const sanitized = sanitizeProjectionValue(message, limit);
  if (message?.method !== "item/completed" || message.params?.item?.type !== "agentMessage") return sanitized;
  const originalText = String(message.params.item.text || "");
  if (originalText.length <= limit) return sanitized;
  sanitized.params.item.textTruncated = true;
  sanitized.params.item.originalTextLength = originalText.length;
  return sanitized;
}

function sanitizeProjectionValue(value, limit, seen = new Map()) {
  if (typeof value === "string") return truncateProjectionText(value, limit);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, child] of Object.entries(value)) copy[key] = sanitizeProjectionValue(child, limit, seen);
  return copy;
}

function truncateProjectionText(value, limit) {
  if (value.length <= limit) return value;
  const marker = `\n…[truncated ${value.length - limit} chars]`;
  return `${value.slice(0, Math.max(0, limit - marker.length))}${marker}`;
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

async function handleServerRequest({ message, state, queue, options, activeCommands, commandItems }) {
  queue.push({
    type: `codex.server_request.${message.method.replaceAll("/", ".")}`,
    method: message.method,
    params: message.params || null,
    approval_policy: options.approvalPolicy || "on-request"
  });

  switch (message.method) {
    case "item/tool/call": {
      const params = message.params || {};
      try {
        if (!state || state.completed || params.threadId !== state.threadId || (state.turnId && params.turnId !== state.turnId)) throw new Error("Tool call does not belong to the active scene turn.");
        if (typeof options.dynamicToolProvider !== "function" || !options.dynamicTools?.some(tool => tool.name === params.tool)) throw new Error("This tool is unavailable in this conversation.");
        const result = await options.dynamicToolProvider(params);
        if (Array.isArray(result?.contentItems)) {
          if (!result.contentItems.length || result.contentItems.length > 8 || result.contentItems.some(item => !(
            item.type === "inputText" && typeof item.text === "string" ||
            item.type === "inputImage" && typeof item.imageUrl === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.imageUrl)
          ))) throw new Error("Invalid tool content.");
          return { success: true, contentItems: result.contentItems };
        }
        return { success: true, contentItems: [{ type: "inputText", text: JSON.stringify(result) }] };
      } catch (error) {
        return { success: false, contentItems: [{ type: "inputText", text: error.message }] };
      }
    }
    case "currentTime/read":
      return { currentTimeAt: Math.floor(Date.now() / 1000) };
    case "item/commandExecution/requestApproval": {
      if ((options.approvalPolicy || "on-request") === "never") {
        return modernApprovalDecision(options, message);
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
      return modernApprovalDecision(options, message);
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
      return legacyApprovalDecision(options, message);
    }
    case "item/fileChange/requestApproval":
      return modernApprovalDecision(options, message);
    case "applyPatchApproval":
      return legacyApprovalDecision(options, message);
    case "item/tool/requestUserInput":
      return { answers: {} };
    case "mcpServer/elicitation/request":
      return { action: "decline", content: null };
    case "item/permissions/requestApproval":
      return permissionDecision(options, message);
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

async function requestApproval(options, message) {
  const policy = options.approvalPolicy || "on-request";
  if (policy === "never") return false;
  if (typeof options.approvalProvider !== "function") return true;
  const decision = await options.approvalProvider({
    request_id: String(message.id || ""),
    method: String(message.method || ""),
    params: message.params || {}
  });
  return decision === true || decision?.decision === "accept" || decision?.approved === true;
}

async function modernApprovalDecision(options, message) {
  return { decision: await requestApproval(options, message) ? "accept" : "decline" };
}

async function legacyApprovalDecision(options, message) {
  if (await requestApproval(options, message)) return { decision: "approved" };
  return { decision: { denied: { rejection: "ArcOrbit approval policy denied the request." } } };
}

async function permissionDecision(options, message) {
  const params = message.params || {};
  const requested = params?.permissions && typeof params.permissions === "object" ? params.permissions : {};
  const approved = await requestApproval(options, message);
  return {
    permissions: !approved ? {} : {
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
    terminateOwnedTree: Boolean(options.executionControlFile || process.env.ARCORBIT_EXECUTION_CONTROL_FILE),
    command: options.codexBin || "codex",
    args: ["app-server", "--stdio"],
    cwd: projectRoot,
    stderr: "inherit",
    env: options.env || process.env
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

function handleNotification({ message, client, queue, state, options, activeCommands, commandItems }) {
  const outputObservation = observeOutputNotification(message, state);
  queue.push(normalizeNotification(sanitizeNotificationForProjection(message, state.outputLimits?.projection_text_limit)));
  if (outputObservation && !state.outputGuardError) {
    state.outputGuardError = createAgentOutputGuardError(outputObservation, state);
    queue.push({
      type: "codex.output_guard.triggered",
      thread_id: state.threadId,
      turn_id: state.turnId,
      reason: outputObservation.reason,
      observed_length: outputObservation.observed_length,
      limit: outputObservation.limit,
      total_chars: state.outputMetrics.total_chars,
      trailing_whitespace_chars: state.outputMetrics.trailing_whitespace_chars
    });
    if (state.threadId && state.turnId && !state.outputGuardInterrupt) {
      state.outputGuardInterrupt = client.request("turn/interrupt", {
        threadId: state.threadId,
        turnId: state.turnId
      }).catch((error) => {
        state.outputGuardError.interrupt_error = String(error?.message || error);
      });
    }
  }

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
    if (!state.outputGuardError) state.agentText += message.params?.delta || "";
  }
  if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
    if (!state.outputGuardError) state.lastCompletedAgentText = message.params.item.text || state.lastCompletedAgentText;
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
    if (state.outputGuardError) {
      state.turnStarted = false;
      state.completed = true;
      for (const span of state.itemSpans.values()) {
        endLifecycleSpan(options, span, { status: "error", error: state.outputGuardError });
      }
      state.itemSpans.clear();
      endLifecycleSpan(options, state.turnSpan, {
        status: "error",
        attributes: { turn_id: state.turnId || "", reason: "agent_output_guard" },
        error: state.outputGuardError
      });
      activeCommands?.clear();
      commandItems?.clear();
      queue.fail(state.outputGuardError);
      return;
    }
    if (message.params?.turn?.status === 'interrupted' && ['agent-loop-result', 'task-closeout-result'].includes(state.resultKind)) {
      state.completed = true;
      queue.fail(executionStopError('operator_stop'));
      return;
    }
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
    if (parsed.result?.transport_error) {
      const error = new Error(parsed.result.transport_error);
      error.code = 'INVALID_AGENT_RESULT';
      queue.fail(error);
      return;
    }
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

function attachStdinControls({ client, getActiveTurn, stopExecution }) {
  const readline = createInterface({ input: process.stdin, terminal: false });
  readline.on("line", async (line) => {
    let command = line;
    if (line.startsWith('{')) { try { command = JSON.parse(line); } catch {} }
    await handleOperatorCommand({ command, client, getActiveTurn, stopExecution });
  });
  return readline;
}

function attachParentPortControls({ client, getActiveTurn, stopExecution }) {
  const parentPort = process.parentPort;
  if (!parentPort?.on) throw new Error("--supervise-parent-port requires an Electron utility-process parent port.");
  const listener = async (event) => {
    const command = event?.data ?? event;
    if (command?.schema_version !== "arcorbit-runtime-control/v1") return;
    await handleOperatorCommand({
      command,
      client,
      getActiveTurn, stopExecution
    });
  };
  parentPort.on("message", listener);
  return { close: () => parentPort.off?.("message", listener) };
}

async function handleOperatorCommand({ command, client, getActiveTurn, stopExecution }) {
  const requestId = typeof command === 'object' ? command.request_id : '';
  const delivery = (status, error = '') => {
    if (requestId) console.error(JSON.stringify({ event: { type: 'runtime.operator.delivery', request_id: requestId, status, error } }));
  };
  const trimmed = typeof command === 'object'
    ? command.type === 'steer' ? `/steer ${String(command.message || '').trim()}` : `/${command.type}`
    : String(command || '').trim();
  if (!trimmed) return;
  if (trimmed === "/interrupt" && stopExecution) { stopExecution(); return; }
  const active = getActiveTurn();
  if (!active || active.state.completed) { delivery("queued"); return; }
  const { queue, state } = active;
  if (command?.expected_turn_id && command.expected_turn_id !== state.turnId) { delivery("queued"); return; }
  try {
    if (trimmed === "/interrupt") {
      await waitForActiveTurn(state);
      const result = await client.request("turn/interrupt", {
        threadId: state.threadId,
        turnId: state.turnId
      });
      queue.push({ type: "runtime.operator.interrupt.sent", thread_id: state.threadId, turn_id: state.turnId, result });
      return;
    }
    if (trimmed.startsWith("/steer ")) {
      await waitForActiveTurn(state);
      const text = trimmed.slice("/steer ".length).trim();
      if (!text) throw new Error("/steer requires non-empty text.");
      const result = await client.request("turn/steer", {
        threadId: state.threadId,
        expectedTurnId: state.turnId,
        input: [{ type: "text", text }]
      });
      delivery("delivered");
      queue.push({ type: "runtime.operator.steer.sent", thread_id: state.threadId, turn_id: state.turnId, text, result });
      return;
    }
    delivery("failed", "不支持的输入类型");
    queue.push({ type: "runtime.operator.input.ignored", message: "Use /steer <text> or /interrupt." });
  } catch (error) {
    delivery("failed", error.message);
    queue.push({ type: "runtime.operator.command.failed", message: String(error) });
  }
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
  if (resultKind === "chat") {
    return {
      type: "codex.chat.completed",
      text: String(text || ""),
      error: error ? codexErrorMessage(error) : ""
    };
  }
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
        result: createInvalidAgentLoopResult(`Codex Agent failed before returning arckit-agent-loop-result/v2: ${codexErrorMessage(error)}`)
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
        result: createInvalidAgentLoopResult(`Codex Agent did not return valid arckit-agent-loop-result/v2 JSON: ${error.message}`)
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
  return { transport_error: summary };
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
  const message = codexErrorMessage(error);
  const oversized = parseOversizedInputTextError(message);
  const failure = new Error(`Codex Agent turn failed before returning arckit-agent-loop-result/v2: ${message}`);
  failure.name = "CodexTurnError";
  failure.code = oversized ? "codex_history_item_too_large" : codexErrorCode(error) || "codex_turn_failed";
  failure.retryable = false;
  if (oversized) {
    failure.history_repair_required = true;
    failure.input_index = oversized.input_index;
    failure.content_index = oversized.content_index;
    failure.max_length = oversized.max_length;
    failure.actual_length = oversized.actual_length;
  }
  return failure;
}

function parseOversizedInputTextError(message) {
  const match = String(message || "").match(
    /Invalid 'input\[(\d+)]\.content\[(\d+)]\.text': string too long\. Expected a string with maximum length (\d+), but got a string with length (\d+) instead\./
  );
  if (!match) return null;
  return {
    input_index: Number(match[1]),
    content_index: Number(match[2]),
    max_length: Number(match[3]),
    actual_length: Number(match[4])
  };
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
      }
    }
  };
}
