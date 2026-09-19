import { executionProgress } from "./kernel/execution-progress.mjs";
import { executionControlPath, createExecutionControl } from "./kernel/execution-control.mjs";
import { createCaseCheckpoint, acceptLedgerCheckpoint, caseRuntimeContext, acceptedCaseCompletion } from './kernel/case-execution.mjs';
import { compactSessionThread } from './kernel/session-thread.mjs';
import { createAgentAdapter } from "./agent-adapter.mjs";
import { compilePrompt } from "./prompt-compiler.mjs";
import { selectNextRound } from "./loop-controller.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import { writeLedger } from "./ledger-writer.mjs";
import { runAgenticLoop } from "./agent-orchestrator.mjs";
import { endLifecycleSpan, startLifecycleSpan } from "./observability/lifecycle-trace.mjs";

export async function runStateDrivenSession({ projectRoot, stateStore, options = {}, dependencies = {}, agentAdapter = null, threadState = {} }) {
  if (!options.dryRun && !(agentAdapter || options.agentAdapter || dependencies.createAdapter)) {
    options = { ...options, executionControlFile: executionControlPath(projectRoot, options) };
    createExecutionControl(options.executionControlFile).assertRunning();
  }
  const createAdapter = dependencies.createAdapter || createAgentAdapter;
  const runRound = dependencies.runRound || runAgenticLoop;
  const writeRoundLedger = dependencies.writeRoundLedger || writeLedger;
  const adapterName = options.dryRun ? "dry-run" : options.adapter || "codex-app-server";
  const controlFile = options.executionControlFile || process.env.ARCORBIT_EXECUTION_CONTROL_FILE;
  const executionControl = controlFile ? createExecutionControl(controlFile) : null;
  const rounds = [];
  let nextTask = options.task || "";
  const originalTask = options.runtimeContext?.original_task || options.originalTask || options.task || "";
  const progressJournal = executionProgress(options.dryRun ? null : controlFile);
  const adapter = agentAdapter || options.agentAdapter || createAdapter(adapterName, options);
  let snapshotReplanAttempts = progressJournal.snapshot().snapshot_replan_attempts;
  let agentRepairAttempts = progressJournal.snapshot().repair_attempts;
  let totalAgentRepairAttempts = 0;
  const maxAgentRepairAttempts = effectiveAgentRepairLimit(options.maxAgentRepairAttempts);
  let finalEnvelope = null;
  let stopReason = "";
  let taskThreadId = String(options.threadId || "");
  let checkpoint = createCaseCheckpoint(options.runtimeContext || {});
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
  let prefetchedSnapshot = null;
  const persistCheckpoint = (next) => {
    checkpoint = next;
    emitSessionEvent(options, { type: 'runtime.case_checkpoint', checkpoint: structuredClone(checkpoint) });
  };
  const compactBetweenRounds = (roundOptions) => compactSessionThread({ adapter, threadKey: taskThreadKey,
    threadId: taskThreadId, options: roundOptions, state: threadState });
  if (checkpoint.pending_continuation) nextTask = JSON.stringify({
    original_user_input: originalTask, current_instruction: options.task || '',
    authoritative_case_id: checkpoint.case_id, continuation_discovery: checkpoint.pending_continuation
  });

  try {
    persistCheckpoint(checkpoint);
    if (checkpoint.phase === 'completed') return {
      runtime_version: 'arcorbit/v0.3-state-driven', project_root: projectRoot,
      session_mode: 'state-driven', runtime_result: null, validation: { valid: true, issues: [] },
      ledger_write_result: null, round_count: 0, session_rounds: [], thread_id: taskThreadId,
      case_checkpoint: checkpoint, stop_reason: 'completed', paused_for_human: false,
      next_action: 'The accepted Case is complete.'
    };
    for (let roundIndex = (options.roundIndexOffset || 0) + 1; ; roundIndex += 1) {
      executionControl?.assertRunning();
      progressJournal.assertContinuable();
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
      const snapshot = prefetchedSnapshot || await stateStore.readSnapshot();
      prefetchedSnapshot = null;
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
      emitSessionEvent(options, {
        type: "runtime.round_candidates",
        round_index: roundIndex,
        snapshot_token: snapshot.snapshotToken || snapshot.ledgerSnapshot?.snapshot_token || "",
        candidate_catalog: snapshot.candidateCatalog || { persisted_candidates: [], persisted_obligations: [] }
      });

      const roundOptions = {
        ...sessionOptions,
        runtimeContext: caseRuntimeContext(options.runtimeContext || {}, checkpoint),
        executionProgress: progressJournal.snapshot(),
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
      const gapSelection = agentGapSelection(loop.agentLoopResult);
      if (gapSelection) {
        emitSessionEvent(options, {
          type: "runtime.round_selection",
          round_index: roundIndex,
          case_id: agentCaseId(loop.agentLoopResult),
          selected_gap: agentSelectedGap(loop.agentLoopResult, loop.loopFrame),
          gap_selection: gapSelection
        });
      }
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
          executionControl?.assertRunning();
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
              kind: "infrastructure_failed",
              recoverable: true,
              responsibility: "runtime",
              reason: error?.message || String(error),
              issues: [{ path: "ledger_write", message: error?.message || String(error) }],
              recovery_action: "runtime_recovery",
              counts_toward_agent_repair: false
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
        if (ledgerWriteResult?.round_closeout) {
          emitSessionEvent(options, {
            type: "runtime.round_closeout",
            round_index: roundIndex,
            receipt: ledgerWriteResult.round_closeout
          });
        }
        if (ledgerWriteResult?.written === true) {
          persistCheckpoint(acceptLedgerCheckpoint(checkpoint, ledgerWriteResult));
        }
        if (ledgerWriteResult?.written === true && ledgerWriteResult?.post_commit_snapshot_token) {
          prefetchedSnapshot = await stateStore.readSnapshot({
            afterCommitToken: ledgerWriteResult.post_commit_snapshot_token
          });
          emitSessionEvent(options, {
            type: "runtime.fresh_read.completed",
            round_index: roundIndex,
            receipt: freshReadProjection(prefetchedSnapshot.ledgerSnapshot)
          });
        }
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
          case_id: agentCaseId(loop.agentLoopResult),
          selected_gap_id: agentSelectedGapRef(loop.agentLoopResult)
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
      const handoff = authoritativeHandoff(loop.runtimeResult, ledgerWriteResult);
      const decision = validation.valid ? decideSessionContinuation({
        runtimeResult: loop.runtimeResult,
        ledgerWriteResult,
        handoff,
        snapshotReplanAttempts,
        agentRepairAttempts,
        maxAgentRepairAttempts,
        authoritativeCaseId: checkpoint.case_id
      }) : { continue: agentRepairAttempts < maxAgentRepairAttempts,
        reason: agentRepairAttempts < maxAgentRepairAttempts ? "agent_repair" : "agent_repair_limit" };
      const progressState = progressJournal.record({
        round_index: roundIndex, case_id: checkpoint.case_id,
        selected_gap_id: agentSelectedGapRef(loop.agentLoopResult),
        task_progress: loop.runtimeResult?.task_progress || null,
        validation_valid: validation.valid, ledger_written: ledgerWriteResult?.written === true
      }, decision);
      snapshotReplanAttempts = progressState.snapshot_replan_attempts;
      agentRepairAttempts = progressState.repair_attempts;
      Object.assign(rounds.at(-1), { task_progress: loop.runtimeResult?.task_progress || null, continuation: decision });
      emitSessionEvent(options, { type: 'runtime.execution_progress', round_index: roundIndex, progress: progressState });
      if (!decision.continue) {
        stopReason = decision.reason;

        break;
      }

      if (decision.reason === "agent_repair") {
        totalAgentRepairAttempts += 1;
        const rejection = validation.valid ? ledgerWriteResult.rejection : validationRejection(validation);
        nextTask = buildAgentRepairInstruction({
          rejection,
          loop,
          attempt: agentRepairAttempts,
          maxAttempts: maxAgentRepairAttempts
        });
        emitAgentRepairRequested(options, {
          roundIndex,
          attempt: agentRepairAttempts,
          maxAttempts: maxAgentRepairAttempts,
          rejection,
          loop
        });
        continue;
      }

      if (decision.reason === "fresh_replan") {
        prefetchedSnapshot = await stateStore.readSnapshot();
        nextTask = buildFreshReplanInstruction({
          rejection: ledgerWriteResult.rejection,
          loop
        });
        emitSessionEvent(options, {
          type: "runtime.fresh_replan.requested",
          round_index: roundIndex,
          rejection: ledgerWriteResult.rejection
        });
        continue;
      }

      await compactBetweenRounds(roundOptions);
      nextTask = handoff?.next_prompt || "Reload fresh Project and Case State, then advance the next agent-owned gap.";
    }
  } catch (error) {
    sessionFailure = error;
    endLifecycleSpan(sessionOptions, activeRoundSpan, { status: "error", error });
    throw error;
  } finally {
    if (!agentAdapter) {
      const closeSpan = startLifecycleSpan(sessionOptions, {
        name: 'runtime.adapter_close', category: 'runtime', cost_center: 'orchestration'
      });
      await adapter.close?.();
      endLifecycleSpan(sessionOptions, closeSpan, { status: 'ok' });
    }
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
    runtime_version: "arcorbit/v0.3-state-driven",
    session_mode: "state-driven",
    round_count: rounds.length,
    agent_repair_attempt_count: totalAgentRepairAttempts,
    max_agent_repair_attempts: maxAgentRepairAttempts,
    execution_progress: progressJournal.snapshot(),
    session_rounds: rounds,
    thread_id: taskThreadId,
    case_checkpoint: checkpoint,
    stop_reason: stopReason,
    paused_for_human: stopReason === "human_intervention",
    next_action: nextActionForStopReason(stopReason, finalEnvelope)
  };
}

export function decideSessionContinuation({
  runtimeResult,
  ledgerWriteResult,
  handoff,
  snapshotReplanAttempts = 0,
  maxSnapshotReplanAttempts = 8,
  agentRepairAttempts = 0,
  maxAgentRepairAttempts = 2,
  authoritativeCaseId = ""
}) {
  const written = ledgerWriteResult?.written === true;
  const writebackRequired = runtimeResult?.ledger_stage?.writeback_required === true;
  if (!written && ledgerWriteResult?.rejection) {
    const rejectionKind = classifyRejection(ledgerWriteResult.rejection);
    if (rejectionKind === "snapshot_stale") {
      if (snapshotReplanAttempts >= maxSnapshotReplanAttempts) {
        return { continue: false, reason: "snapshot_stale_limit" };
      }
      return { continue: true, reason: "fresh_replan" };
    }
    if (rejectionKind === "claim_invalid"
      && agentRepairAttempts < maxAgentRepairAttempts) {
      return { continue: true, reason: "agent_repair" };
    }
    if (rejectionKind === "claim_invalid") {
      return { continue: false, reason: "agent_repair_limit" };
    }
    if (rejectionKind === "protocol_incompatible") {
      return { continue: false, reason: "protocol_incompatible" };
    }
    if (rejectionKind === "materialization_failed") {
      return { continue: false, reason: "materialization_failed" };
    }
    if (rejectionKind === "infrastructure_failed") {
      return { continue: false, reason: "infrastructure_recovery" };
    }
    return { continue: false, reason: "ledger_write_failed" };
  }
  if (writebackRequired && !written) {
    return { continue: false, reason: "ledger_write_failed" };
  }
  if (handoff?.human_decision_required === true || handoff?.next_responsibility === "human") {
    return { continue: false, reason: "human_intervention" };
  }
  if (handoff?.next_responsibility === "external" || handoff?.status === "external_wait") {
    return { continue: false, reason: "external_wait" };
  }
  if (ledgerWriteResult?.case_control_result) {
    if (ledgerWriteResult.case_control_result.action === "bind_closed_case") {
      return { continue: false, reason: "completed" };
    }
    // Case registration is an accepted control action, not a Runtime progress judgment.
    // Continue only through the Agent handoff below.
  }
  if (handoff?.next_responsibility === "agent"
    && handoff?.agent_continuation_available === true
    && Boolean(handoff?.next_prompt)) {
    return { continue: true, reason: "agent_continuation" };
  }
  if (acceptedCaseCompletion(ledgerWriteResult)) {
    if (!String(authoritativeCaseId || "").trim()) {
      return { continue: false, reason: "case_binding_required" };
    }
    return { continue: false, reason: "completed" };
  }
  if (handoff?.next_responsibility === "none") return { continue: false, reason: "stopped" };
  return { continue: false, reason: "terminal_runtime_result" };
}

function classifyRejection(rejection) {
  const kind = String(rejection?.kind || "");
  if (["claim_invalid", "snapshot_stale", "protocol_incompatible", "materialization_failed", "infrastructure_failed"].includes(kind)) return kind;
  if (rejection?.recovery_action === "repair_rejected_claim" && rejection?.responsibility === "agent") return "claim_invalid";
  if (rejection?.recovery_action === "replan_from_fresh_state") return "snapshot_stale";
  return kind;
}

export function effectiveAgentRepairLimit(configuredLimit) {
  return Number.isInteger(configuredLimit) && configuredLimit >= 0 ? configuredLimit : 2;
}

export function buildAgentRepairInstruction({ rejection, loop, attempt, maxAttempts }) {
  const issues = normalizeRepairIssues(rejection);
  return JSON.stringify({
    schema_version: "arckit-agent-repair-instruction/v1",
    phase: "repair_rejected_claim",
    attempt,
    max_attempts: maxAttempts,
    rejection: {
      kind: String(rejection?.kind || "runtime_result_rejected"),
      reason: String(rejection?.reason || "The Runtime rejected the previous Agent result."),
      recovery_action: String(rejection?.recovery_action || "repair_rejected_claim"),
      issues
    },
    rejected_agent_output: loop?.agentLoopResult || null,
    canonical_state: {
      write_accepted: false,
      instruction: "Reload the fresh trusted Project and Case snapshot supplied by this turn before returning a replacement claim."
    },
    recovery_context: { authorization_changed: false }
  }, null, 2);
}

export function buildFreshReplanInstruction({ rejection, loop }) {
  return JSON.stringify({
    schema_version: "arckit-agent-fresh-replan-instruction/v1",
    phase: "replan_from_fresh_state",
    rejection: {
      kind: "snapshot_stale",
      reason: String(rejection?.reason || "The semantic command was based on stale canonical state."),
      issues: normalizeRepairIssues(rejection)
    },
    rejected_agent_output: loop?.agentLoopResult || null,
    canonical_state: {
      write_accepted: false,
      instruction: "Use the fresh trusted snapshot supplied by this turn and select or replan the current semantic work."
    },
    replan_contract: {
      same_persistent_thread: true,
      does_not_consume_agent_repair_budget: true,
      do_not_repeat_completed_implementation_work: true,
      do_not_copy_stale_identity_or_revision: true,
      return_complete_replacement_agent_loop_result: true
    }
  }, null, 2);
}

function validationRejection(validation) {
  const issues = (validation?.issues || []).map((issue) => ({
    path: String(issue?.path || "runtime_result"),
    message: String(issue?.message || "Invalid Runtime result.")
  }));
  return {
    kind: "runtime_result_validation_rejected",
    recoverable: true,
    responsibility: "agent",
    reason: issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n") || "Runtime result validation failed.",
    issues,
    recovery_action: "repair_rejected_claim"
  };
}

function normalizeRepairIssues(rejection) {
  if (Array.isArray(rejection?.issues) && rejection.issues.length > 0) {
    return rejection.issues.map((issue) => typeof issue === "string"
      ? { path: "case_command", message: issue }
      : {
        path: String(issue?.path || "case_command"),
        message: String(issue?.message || rejection?.reason || "Rejected claim.")
      });
  }
  return [{
    path: "case_command",
    message: String(rejection?.reason || "The trusted Ledger rejected the claim.")
  }];
}

function emitAgentRepairRequested(options, { roundIndex, attempt, maxAttempts, rejection, loop }) {
  emitSessionEvent(options, {
    type: "runtime.agent_repair.requested",
    round_index: roundIndex,
    attempt,
    max_attempts: maxAttempts,
    rejection: {
      kind: String(rejection?.kind || "runtime_result_rejected"),
      reason: String(rejection?.reason || "The Runtime rejected the previous Agent result."),
      issues: normalizeRepairIssues(rejection)
    },
    case_id: agentCaseId(loop?.agentLoopResult),
    selected_gap_id: agentSelectedGapRef(loop?.agentLoopResult)
  });
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
    runtime_version: "arcorbit/v0.3-state-driven",
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
      case_id: agentCaseId(loop.agentLoopResult),
      selected_gap_id: agentSelectedGapRef(loop.agentLoopResult)
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

function agentCaseId(result) {
  return result?.case_command?.case_id || result?.case_transition?.case_id || "";
}

function agentSelectedGapRef(result) {
  return result?.case_command?.selection?.selected_ref || result?.case_transition?.selected_gap?.id || "";
}

function agentGapSelection(result) {
  return result?.case_command?.selection || result?.case_transition?.gap_selection || null;
}

function agentSelectedGap(result, loopFrame) {
  return result?.case_transition?.selected_gap || loopFrame?.selected_gap || null;
}

function requiresLedgerWrite(runtimeResult) {
  return runtimeResult?.ledger_stage?.status === "gate_ready"
    && runtimeResult?.ledger_stage?.writeback_required === true;
}

function authoritativeHandoff(runtimeResult, ledgerWriteResult) {
  return ledgerWriteResult?.case_transition_result?.case_resolution?.loop_handoff
    || runtimeResult?.loop_handoff
    || null;
}

function emitSessionEvent(options, event) {
  options.onEvent?.(event);
  if (options.streamEvents) {
    console.error(JSON.stringify({ event }));
  }
}

function freshReadProjection(receipt) {
  if (!receipt) return null;
  return {
    schema_version: receipt.schema_version,
    snapshot_token: receipt.snapshot_token,
    observed_at: receipt.observed_at,
    observed_after_commit: receipt.observed_after_commit,
    project_revision: receipt.project_revision,
    case_revisions: receipt.case_revisions,
  };
}

function nextActionForStopReason(stopReason, envelope) {
  if (stopReason === "completed") return "State-driven Runtime session completed.";
  if (stopReason === "stopped") return "Execution stopped; unresolved Case obligations are preserved.";
  if (stopReason === "case_binding_required") return "Bind this todo through a trusted closed Case reuse receipt or create and advance a new Case before completion.";
  if (stopReason === "human_intervention") {
    return envelope.runtime_result?.loop_handoff?.next_prompt || "Wait for the required human decision.";
  }
  if (stopReason === "external_wait") {
    return envelope.runtime_result?.loop_handoff?.next_prompt || "Wait for the required external result.";
  }
  if (stopReason === "dry_run") return "Review the generated Agent invocation before execution.";
  return `State-driven Runtime stopped: ${stopReason}.`;
}
