import { buildArtifactOwnershipScan, createArtifactImpactScan } from "../artifact-ownership-map.mjs";
import { stateFromLoopGate } from "../round-state-machine.mjs";

export function stateFromMergeResult(mergeResult) {
  return shouldPrepareLedgerWriteback(mergeResult)
    ? "ledger_gate_ready"
    : stateFromLoopGate(mergeResult.loop_gate);
}

export function shouldPrepareLedgerWriteback(mergeResult) {
  if (mergeResult.loop_gate.status === "done") {
    return true;
  }
  if (mergeResult.loop_gate.status !== "continue") {
    return false;
  }
  const reportIntake = mergeResult.report_intake || {};
  const unresolved = [
    ...(reportIntake.rejected || []),
    ...(reportIntake.needs_revision || []),
    ...(reportIntake.needs_human_decision || []),
    ...(reportIntake.missing || [])
  ];
  if (unresolved.length > 0) {
    return false;
  }
  const ownership = mergeResult.artifact_ownership_scan || {};
  return [
    ...(ownership.source_facts_changed || []),
    ...(ownership.pending_items || []),
    ...(ownership.runtime_logs || [])
  ].length > 0;
}

export function createRuntimeResultFromMerge({ mergeResult, reports, loopFrame, round, compiledPrompt, dryRun, roundState }) {
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

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function t(language, english, zhHans) {
  return language === "zh-Hans" ? zhHans : english;
}
