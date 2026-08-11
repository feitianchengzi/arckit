import { createAgentAdapter } from "./agent-adapter.mjs";
import { compilePrompt } from "./prompt-compiler.mjs";
import { selectNextRound } from "./loop-controller.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import { writeLedger } from "./ledger-writer.mjs";
import { runAgenticLoop } from "./agent-orchestrator.mjs";
import { endLifecycleSpan, startLifecycleSpan } from "./observability/lifecycle-trace.mjs";

export async function runStateDrivenSession({ projectRoot, stateStore, options = {}, dependencies = {} }) {
  const createAdapter = dependencies.createAdapter || createAgentAdapter;
  const runRound = dependencies.runRound || runAgenticLoop;
  const writeRoundLedger = dependencies.writeRoundLedger || writeLedger;
  const adapterName = options.dryRun ? "dry-run" : options.adapter || "codex-app-server";
  const adapter = options.agentAdapter || createAdapter(adapterName, options);
  const rounds = [];
  let nextTask = options.task || "";
  const originalTask = options.originalTask || options.task || "";
  let noProgressRounds = 0;
  let finalEnvelope = null;
  let stopReason = "";
  let taskThreadId = String(options.threadId || "");
  let closeoutResult = null;
  let lastCompactedTurnId = "";
  const taskThreadKey = `agent-loop:${String(options.taskId || options.lifecycleRunId || "active-session").trim() || "active-session"}`;
  const sessionSpan = startLifecycleSpan(options, {
    name: "runtime.session",
    category: "runtime",
    cost_center: "orchestration",
    attributes: { run_id: options.lifecycleRunId || "", adapter: adapterName }
  });
  const sessionOptions = {
    ...options,
    lifecycleParentSpanId: sessionSpan?.span_id || options.lifecycleParentSpanId,
    lifecycleCostCenter: "orchestration"
  };
  let activeRoundSpan = null;
  let sessionFailure = null;

  try {
    if (options.runtimeContext?.closeout_only === true) {
      closeoutResult = await runSameThreadCloseout({
        adapter,
        projectRoot,
        originalTask,
        threadKey: taskThreadKey,
        threadId: taskThreadId,
        options: sessionOptions
      });
      taskThreadId = adapter.threadId?.(taskThreadKey) || taskThreadId;
      stopReason = closeoutResult.status === "completed"
        ? "completed"
        : closeoutResult.status === "needs_human" ? "human_intervention" : "closeout_failed";
      finalEnvelope = {
        runtime_version: "arckit-runtime/v0.3-state-driven",
        project_root: projectRoot,
        mode: adapterName === "dry-run" ? "dry-run" : "execute",
        adapter: adapterName,
        runtime_result: null,
        validation: { valid: closeoutResult.status === "completed", issues: [] },
        ledger_write_result: null
      };
    }
    if (finalEnvelope) {
      return {
        ...finalEnvelope,
        session_mode: "state-driven",
        round_count: 0,
        session_rounds: [],
        thread_id: taskThreadId,
        closeout_result: closeoutResult,
        stop_reason: stopReason,
        paused_for_human: stopReason === "human_intervention",
        next_action: stopReason === "completed" ? "Same-thread task closeout completed." : `Same-thread task closeout stopped: ${stopReason}.`
      };
    }
    for (let roundIndex = 1; ; roundIndex += 1) {
      activeRoundSpan = startLifecycleSpan(sessionOptions, {
        name: "runtime.round",
        category: "runtime",
        cost_center: "orchestration",
        attributes: { round_index: roundIndex }
      });
      const snapshotSpan = startLifecycleSpan({
        ...sessionOptions,
        lifecycleParentSpanId: activeRoundSpan?.span_id || sessionOptions.lifecycleParentSpanId
      }, {
        name: "runtime.snapshot_read",
        category: "state",
        cost_center: "orchestration",
        attributes: { round_index: roundIndex }
      });
      const snapshot = await stateStore.readSnapshot();
      endLifecycleSpan(sessionOptions, snapshotSpan, {
        status: "ok",
        attributes: { active_case_count: (snapshot.activeCases || []).length }
      });
      snapshot.projectRoot = projectRoot;
      emitSessionEvent(options, {
        type: "runtime.session_round.started",
        round_index: roundIndex,
        project_revision: snapshot.projectState?.project?.revision ?? 0,
        active_case_revisions: (snapshot.activeCases || []).map(({ record }) => ({
          case_id: record.id,
          updated_at: record.updated_at
        }))
      });

      const roundOptions = {
        ...sessionOptions,
        task: nextTask,
        originalTask,
        agentAdapter: adapter,
        lifecycleRoundIndex: roundIndex,
        lifecycleParentSpanId: activeRoundSpan?.span_id || sessionOptions.lifecycleParentSpanId
      };
      const preparationSpan = startLifecycleSpan(roundOptions, {
        name: "runtime.round_prepare",
        category: "runtime",
        cost_center: "orchestration",
        attributes: { round_index: roundIndex }
      });
      const round = selectNextRound(snapshot, roundOptions);
      const compiledPrompt = compilePrompt(snapshot, round, roundOptions);
      endLifecycleSpan(roundOptions, preparationSpan, { status: "ok" });
      const loop = await runRound({
        projectRoot,
        snapshot,
        round,
        compiledPrompt,
        options: roundOptions
      });
      taskThreadId = adapter.threadId?.(taskThreadKey) || taskThreadId;
      const validation = loop.validation || validateRuntimeResult(loop.runtimeResult);
      const roundEnvelope = buildRoundEnvelope({
        projectRoot,
        adapter,
        snapshot,
        round,
        compiledPrompt,
        loop,
        validation,
        conversationLocale: options.conversationLocale
      });
      let ledgerWriteResult = null;

      if (!options.dryRun && validation.valid && requiresLedgerWrite(loop.runtimeResult)) {
        const ledgerSpan = startLifecycleSpan(roundOptions, {
          name: "ledger.write",
          category: "ledger",
          cost_center: "orchestration",
          attributes: { round_index: roundIndex }
        });
        try {
          ledgerWriteResult = await writeRoundLedger({
            projectRoot,
            runtimeResult: loop.runtimeResult,
            envelope: roundEnvelope,
            snapshot,
            runtimeRecordRef: options.runtimeRecordRef || ""
          });
        } catch (error) {
          ledgerWriteResult = {
            schema_version: "arckit-ledger-write/v2",
            written: false,
            dry_run: false,
            gate: null,
            rejection: {
              kind: "ledger_write_failed",
              recoverable: true,
              responsibility: "agent",
              reason: error?.message || String(error),
              recovery_action: "replan_from_fresh_state"
            },
            plan: [],
            changed_files: []
          };
        }
        endLifecycleSpan(roundOptions, ledgerSpan, {
          status: ledgerWriteResult?.written === true ? "ok" : "error",
          attributes: {
            written: ledgerWriteResult?.written === true,
            changed_file_count: ledgerWriteResult?.changed_files?.length || 0
          },
          error: ledgerWriteResult?.rejection?.reason || null
        });
        emitSessionEvent(options, {
          type: "runtime.ledger_write.completed",
          round_index: roundIndex,
          result: ledgerWriteResult
        });
      }

      finalEnvelope = {
        ...roundEnvelope,
        ledger_write_result: ledgerWriteResult
      };
      rounds.push({
        round_index: roundIndex,
        selected_gap: loop.loopFrame?.selected_gap || null,
        agent_loop_result: loop.agentLoopResult ? {
          action: loop.agentLoopResult.action,
          summary: loop.agentLoopResult.summary,
          case_id: loop.agentLoopResult.case_transition?.case_id || "",
          selected_gap_id: loop.agentLoopResult.case_transition?.selected_gap?.id || ""
        } : null,
        round_result: loop.runtimeResult?.round_result || "",
        validation_valid: validation.valid,
        ledger_written: ledgerWriteResult?.written === true,
        ledger_changed_files: ledgerWriteResult?.changed_files || [],
        loop_handoff: authoritativeHandoff(loop.runtimeResult, ledgerWriteResult)
      });
      emitSessionEvent(options, {
        type: "runtime.session_round.completed",
        ...rounds.at(-1)
      });
      endLifecycleSpan(roundOptions, activeRoundSpan, {
        status: validation.valid ? "ok" : "error",
        attributes: {
          round_index: roundIndex,
          round_result: loop.runtimeResult?.round_result || "",
          ledger_written: ledgerWriteResult?.written === true
        }
      });
      activeRoundSpan = null;

      if (options.dryRun) {
        stopReason = "dry_run";
        break;
      }
      if (!validation.valid) {
        stopReason = "invalid_result";
        break;
      }

      const handoff = authoritativeHandoff(loop.runtimeResult, ledgerWriteResult);
      const decision = decideSessionContinuation({
        runtimeResult: loop.runtimeResult,
        ledgerWriteResult,
        handoff,
        noProgressRounds,
        maxNoProgressRounds: effectiveNoProgressLimit(options.maxNoProgressRounds, handoff)
      });
      if (!decision.continue) {
        stopReason = decision.reason;
        if (stopReason === "completed") {
          closeoutResult = await runSameThreadCloseout({
            adapter,
            projectRoot,
            originalTask,
            threadKey: taskThreadKey,
            threadId: taskThreadId,
            options: roundOptions
          });
          if (closeoutResult.status === "needs_human") stopReason = "human_intervention";
          else if (closeoutResult.status !== "completed") stopReason = "closeout_failed";
        }
        break;
      }

      noProgressRounds = decision.madeProgress ? 0 : noProgressRounds + 1;
      if (decision.madeProgress) {
        const usage = adapter.latestContextUsage?.(taskThreadKey);
        if (usage?.context_utilization >= 0.8 && usage.turn_id && usage.turn_id !== lastCompactedTurnId) {
          emitSessionEvent(options, {
            type: "runtime.context_compaction.started",
            thread_id: taskThreadId,
            turn_id: usage.turn_id,
            context_utilization: usage.context_utilization
          });
          const compacted = await adapter.compactThread({ threadKey: taskThreadKey, threadId: taskThreadId, options: roundOptions });
          lastCompactedTurnId = usage.turn_id;
          emitSessionEvent(options, {
            type: "runtime.context_compaction.completed",
            thread_id: taskThreadId,
            source_turn_id: usage.turn_id,
            compaction_turn_id: compacted.turn_id,
            context_utilization: usage.context_utilization
          });
        }
      }
      nextTask = handoff?.next_prompt || "Reload fresh Project and Case State, then advance the next agent-owned gap.";
    }
  } catch (error) {
    sessionFailure = error;
    endLifecycleSpan(sessionOptions, activeRoundSpan, { status: "error", error });
    throw error;
  } finally {
    const closeSpan = startLifecycleSpan(sessionOptions, {
      name: "runtime.adapter_close",
      category: "runtime",
      cost_center: "orchestration"
    });
    await adapter.close?.();
    endLifecycleSpan(sessionOptions, closeSpan, { status: "ok" });
    endLifecycleSpan(options, sessionSpan, {
      status: sessionFailure ? "error" : "ok",
      attributes: { stop_reason: stopReason || "unknown", round_count: rounds.length },
      error: sessionFailure
    });
  }

  if (!finalEnvelope) {
    throw new Error("State-driven Runtime session completed without a round result.");
  }
  return {
    ...finalEnvelope,
    runtime_version: "arckit-runtime/v0.3-state-driven",
    session_mode: "state-driven",
    round_count: rounds.length,
    session_rounds: rounds,
    thread_id: taskThreadId,
    closeout_result: closeoutResult,
    stop_reason: stopReason,
    paused_for_human: stopReason === "human_intervention",
    next_action: nextActionForStopReason(stopReason, finalEnvelope)
  };
}

async function runSameThreadCloseout({ adapter, projectRoot, originalTask, threadKey, threadId, options }) {
  let result = null;
  const prompt = [
    "$using-arckit",
    "",
    JSON.stringify({
      schema_version: "arckit-task-closeout-invocation/v1",
      phase: "task_closeout",
      original_user_input: originalTask,
      instruction: "The Case already passed Completion Review. Perform Git-only closeout in this same conversation: create one intentional commit from the already-reviewed task-scoped changes, or return no_changes when there is nothing in scope to commit. Do not inspect semantic correctness, run validation, edit files, or repair content. If safe commit scope requires a content change or new semantic judgment, return needs_human.",
      execution_authorization: { workspace_root: projectRoot, git_commit_allowed: true },
      output_contract: "arckit-task-closeout-result/v1"
    }, null, 2)
  ].join("\n");
  for await (const event of adapter.runTurn({
    projectRoot,
    prompt,
    options: {
      ...options,
      threadKey,
      threadId,
      resultKind: "task-closeout-result",
      outputSchema: taskCloseoutOutputSchema(),
      lifecycleCostCenter: "closeout"
    }
  })) {
    if (options.streamEvents) console.error(JSON.stringify({ event }));
    if (event.type === "runtime.task_closeout_result") result = event.result;
  }
  return result || {
    schema_version: "arckit-task-closeout-result/v1",
    status: "failed",
    outcome: "none",
    summary: "Codex Agent completed closeout without returning a structured result.",
    evidence: [],
    commit_hash: "",
    error: "missing_closeout_result"
  };
}

function taskCloseoutOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["schema_version", "status", "outcome", "summary", "evidence", "commit_hash", "error"],
    properties: {
      schema_version: { type: "string", const: "arckit-task-closeout-result/v1" },
      status: { type: "string", enum: ["completed", "needs_human", "failed"] },
      outcome: { type: "string", enum: ["committed", "no_changes", "none"] },
      summary: { type: "string" },
      evidence: { type: "array", items: { type: "string" } },
      commit_hash: { type: "string" },
      error: { type: "string" }
    }
  };
}

export function decideSessionContinuation({
  runtimeResult,
  ledgerWriteResult,
  handoff,
  noProgressRounds = 0,
  maxNoProgressRounds = 8
}) {
  const madeProgress = ledgerWriteResult?.written === true;
  if (handoff?.human_decision_required === true || handoff?.next_responsibility === "human") {
    return { continue: false, madeProgress, reason: "human_intervention" };
  }
  if (handoff?.next_responsibility === "external" || handoff?.status === "external_wait") {
    return { continue: false, madeProgress, reason: "external_wait" };
  }
  if (ledgerWriteResult?.rejection && noProgressRounds + 1 >= maxNoProgressRounds) {
    return { continue: false, madeProgress: false, reason: "ledger_retry_limit" };
  }
  if (ledgerWriteResult?.written === false && ledgerWriteResult?.rejection?.recoverable === true) {
    return { continue: true, madeProgress: false, reason: "fresh_state_replan" };
  }
  if (ledgerWriteResult?.case_control_result) {
    return { continue: true, madeProgress: true, reason: "case_created" };
  }
  if (handoff?.next_responsibility === "agent"
    && handoff?.agent_continuation_available === true
    && Boolean(handoff?.next_prompt)) {
    if (!madeProgress && noProgressRounds + 1 >= maxNoProgressRounds) {
      return { continue: false, madeProgress: false, reason: "no_progress_limit" };
    }
    return { continue: true, madeProgress, reason: "agent_continuation" };
  }
  if (runtimeResult?.round_result === "done" || handoff?.next_responsibility === "none") {
    return { continue: false, madeProgress, reason: "completed" };
  }
  return { continue: false, madeProgress, reason: "terminal_runtime_result" };
}

export function effectiveNoProgressLimit(configuredLimit, handoff) {
  const configured = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 8;
  const guardLimit = handoff?.progress_guard?.no_progress_limit;
  return Number.isInteger(guardLimit) && guardLimit > 0 ? Math.min(configured, guardLimit) : configured;
}

function buildRoundEnvelope({
  projectRoot,
  adapter,
  snapshot,
  round,
  compiledPrompt,
  loop,
  validation,
  conversationLocale
}) {
  return {
    runtime_version: "arckit-runtime/v0.3-state-driven",
    project_root: projectRoot,
    mode: adapter.name === "dry-run" ? "dry-run" : "execute",
    adapter: adapter.name,
    snapshot_summary: snapshot.summary,
    selected_round: round,
    conversation_locale: conversationLocale,
    compiled_prompt: compiledPrompt,
    loop_frame: loop.loopFrame,
    agent_loop_result: loop.agentLoopResult ? {
      schema_version: loop.agentLoopResult.schema_version,
      action: loop.agentLoopResult.action,
      summary: loop.agentLoopResult.summary,
      case_id: loop.agentLoopResult.case_transition?.case_id || "",
      selected_gap_id: loop.agentLoopResult.case_transition?.selected_gap?.id || ""
    } : null,
    events: compactPersistedEvents(loop.events),
    runtime_result: loop.runtimeResult,
    validation
  };
}

function compactPersistedEvents(events = []) {
  const semanticTypes = new Set([
    "runtime.agent_loop.started",
    "runtime.agent_loop.completed",
    "runtime.loop_frame.created",
    "runtime.result"
  ]);
  return (Array.isArray(events) ? events : [])
    .filter((event) => semanticTypes.has(event?.type))
    .map((event) => event?.type === "runtime.result"
      ? { type: event.type, validation: event.validation || null }
      : event);
}

function requiresLedgerWrite(runtimeResult) {
  return runtimeResult?.ledger_stage?.status === "gate_ready"
    && runtimeResult?.ledger_stage?.writeback_required === true
    && ["done", "continue"].includes(runtimeResult?.round_result);
}

function authoritativeHandoff(runtimeResult, ledgerWriteResult) {
  return ledgerWriteResult?.case_transition_result?.case_resolution?.loop_handoff
    || runtimeResult?.loop_handoff
    || null;
}

function emitSessionEvent(options, event) {
  if (options.streamEvents) {
    console.error(JSON.stringify({ event }));
  }
}

function nextActionForStopReason(stopReason, envelope) {
  if (stopReason === "completed") return "State-driven Runtime session completed.";
  if (stopReason === "human_intervention") {
    return envelope.runtime_result?.loop_handoff?.next_prompt || "Wait for the required human decision.";
  }
  if (stopReason === "external_wait") {
    return envelope.runtime_result?.loop_handoff?.next_prompt || "Wait for the required external result.";
  }
  if (stopReason === "dry_run") return "Review the generated Agent invocation before execution.";
  return `State-driven Runtime stopped: ${stopReason}.`;
}
