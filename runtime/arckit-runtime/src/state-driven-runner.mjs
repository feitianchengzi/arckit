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
  let packetEnvelope = options.packetEnvelope || null;
  let nextTask = options.task || "";
  let noProgressRounds = 0;
  let finalEnvelope = null;
  let stopReason = "";
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
        project_updated_at: snapshot.projectState?.project?.updated_at || "",
        active_case_revisions: (snapshot.activeCases || []).map(({ record }) => ({
          case_id: record.id,
          updated_at: record.updated_at
        }))
      });

      const roundOptions = {
        ...sessionOptions,
        task: nextTask,
        packetEnvelope,
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
      const round = packetEnvelope?.selected_round || selectNextRound(snapshot, roundOptions);
      const compiledPrompt = packetEnvelope?.compiled_prompt || compilePrompt(snapshot, round, roundOptions);
      endLifecycleSpan(roundOptions, preparationSpan, { status: "ok" });
      const loop = await runRound({
        projectRoot,
        snapshot,
        round,
        compiledPrompt,
        options: roundOptions
      });
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

      packetEnvelope = null;
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
        maxNoProgressRounds: options.maxAutoRounds || 8
      });
      if (!decision.continue) {
        stopReason = decision.reason;
        break;
      }

      noProgressRounds = decision.madeProgress ? 0 : noProgressRounds + 1;
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
    stop_reason: stopReason,
    paused_for_human: stopReason === "human_intervention",
    next_action: nextActionForStopReason(stopReason, finalEnvelope)
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
    worker_tasks: loop.agentTasks,
    worker_reports: loop.agentReports,
    merge_result: loop.mergeResult,
    events: loop.events,
    runtime_result: loop.runtimeResult,
    validation
  };
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
  if (stopReason === "dry_run") return "Review the generated execution packet before execution.";
  return `State-driven Runtime stopped: ${stopReason}.`;
}
