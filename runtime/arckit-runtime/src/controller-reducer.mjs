import { buildArtifactOwnershipScan } from "./artifact-ownership-map.mjs";

export function reduceWorkerReports({ reports = [], loopFrame, round, dryRun = false, conversationLocale = "en" }) {
  const expectedPackets = Array.isArray(loopFrame.worker_packets) ? loopFrame.worker_packets : [];
  const expectedWorkerIds = expectedPackets.map((packet) => packet.worker_id).filter(Boolean);
  const rejected = reports.filter((report) => ["failed", "invalid"].includes(report.status));
  const blocked = reports.filter((report) => report.status === "blocked");
  const partial = reports.filter((report) => report.status === "partial");
  const accepted = reports.filter((report) => report.status === "completed");
  const humanDecisionReports = reports.filter((report) => report.requires_human_decision === true);
  const controllerDecisionReports = reports.filter((report) => report.requires_main_agent_decision === true);
  const incompleteReports = reports.filter((report) => !reportIsComplete(report));
  const missingReports = expectedWorkerIds.filter((workerId) => !reports.some((report) => report.task_id === workerId));
  const allEvidence = unique(reports.flatMap((report) => report.evidence || []));
  const allChanges = unique(reports.flatMap((report) => report.changes || []));
  const allRisks = unique(reports.flatMap((report) => report.risks || []));
  const allUnknowns = unique(reports.flatMap((report) => report.unknowns || []));
  const ownershipScan = buildArtifactOwnershipScan(allChanges);
  const sourceFactRound = loopFrame.route_plan?.mode === "source_fact_establishment";
  const sourceFactEvidenceSatisfied = !sourceFactRound
    || ownershipScan.source_facts_changed.length > 0
    || allEvidence.some((item) => /^arckit\/(spec|tech|interaction|visual)\//.test(item));
  const humanDecisionRequired = humanDecisionReports.length > 0;
  const blockers = [
    ...rejected.map((report) => `${report.task_id}: rejected (${report.status}) - ${report.summary}`),
    ...blocked.map((report) => `${report.task_id}: blocked - ${report.summary}`),
    ...partial.map((report) => `${report.task_id}: partial - ${report.summary}`),
    ...incompleteReports.map((report) => `${report.task_id || report.role || "unknown"}: incomplete report shape`),
    ...missingReports.map((workerId) => `${workerId}: missing worker report`),
    ...allRisks.map((risk) => `risk: ${risk}`),
    ...allUnknowns.map((unknown) => `unknown: ${unknown}`)
  ];

  if (sourceFactRound && !sourceFactEvidenceSatisfied) {
    blockers.push("source_fact_establishment claim lacks source-fact evidence accepted by protocol conditions.");
  }
  if (loopFrame.execution_gate?.status !== "authorized") {
    blockers.push(t(conversationLocale, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - executor not authorized`, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - 执行器未授权`));
  }
  if (humanDecisionRequired) {
    blockers.push("requires_human_decision=true from worker report.");
  }

  const reducerActions = controllerDecisionReports.map((report) => ({
    type: "controller_decision",
    task_id: report.task_id,
    reason: report.recommendation || report.summary
  }));
  const canClose = !dryRun
    && loopFrame.execution_gate?.status === "authorized"
    && expectedWorkerIds.length > 0
    && reports.length >= expectedWorkerIds.length
    && missingReports.length === 0
    && rejected.length === 0
    && blocked.length === 0
    && partial.length === 0
    && incompleteReports.length === 0
    && allRisks.length === 0
    && allUnknowns.length === 0
    && allEvidence.length > 0
    && sourceFactEvidenceSatisfied
    && !humanDecisionRequired;

  const infrastructureFailures = reports.filter(isInfrastructureFailureReport);
  const loopStatus = infrastructureFailures.length > 0
    ? "blocked"
    : humanDecisionRequired
      ? "needs_human"
      : canClose
        ? "done"
        : "continue";
  const decision = infrastructureFailures.length > 0
    ? "blocked"
    : canClose
      ? "accepted"
      : "continue";

  return {
    schema_version: "arckit-controller-reducer-result/v1",
    decision,
    reducer_actions: reducerActions,
    accepted_reports: accepted.map((report) => report.task_id),
    partial_reports: partial.map((report) => report.task_id),
    blocked_reports: blocked.map((report) => report.task_id),
    rejected_reports: rejected.map((report) => report.task_id),
    evidence: allEvidence,
    changed_files: allChanges,
    risks: allRisks,
    unknowns: allUnknowns,
    artifact_ownership_scan: ownershipScan,
    source_projection_check: {
      source_facts_changed: ownershipScan.source_facts_changed,
      projection_artifacts_changed: ownershipScan.projection_artifacts_changed,
      source_unknown: allUnknowns.length > 0 || rejected.length > 0 || blocked.length > 0 || missingReports.length > 0 || (sourceFactRound && !sourceFactEvidenceSatisfied),
      deferred_projections: dryRun ? ["real worker execution", "ledger writeback"] : [],
      blocked_projections: blockers
    },
    report_intake: {
      accepted: accepted.map((report) => report.task_id),
      rejected: rejected.map((report) => report.task_id),
      needs_revision: [...partial.map((report) => report.task_id), ...incompleteReports.map((report) => report.task_id || report.role || "unknown")],
      needs_controller_decision: controllerDecisionReports.map((report) => report.task_id),
      needs_human_decision: humanDecisionReports.map((report) => report.task_id),
      missing: missingReports
    },
    loop_gate: {
      status: loopStatus,
      next_responsibility: canClose ? "none" : humanDecisionRequired ? "human" : "agent",
      trigger_mode: canClose ? "none" : humanDecisionRequired ? "user_decision" : "manual_bridge",
      human_decision_required: humanDecisionRequired,
      reason: gateReason({ dryRun, infrastructureFailures, blockers, reducerActions, canClose, conversationLocale })
    }
  };
}

function gateReason({ dryRun, infrastructureFailures, blockers, reducerActions, canClose, conversationLocale }) {
  if (dryRun) {
    return t(conversationLocale, "Dry-run proves orchestration shape but not real software progress.", "Packet Preview 只证明编排形状，不代表真实软件进展。");
  }
  if (infrastructureFailures.length > 0) {
    return t(conversationLocale, `Runtime infrastructure blocked execution: ${infrastructureFailures[0].summary}`, `Runtime 基础设施阻塞执行：${infrastructureFailures[0].summary}`);
  }
  if (blockers.length > 0) {
    return t(conversationLocale, `Loop cannot close: ${blockers.slice(0, 5).join(" | ")}`, `本轮不能关闭：${blockers.slice(0, 5).join(" | ")}`);
  }
  if (reducerActions.length > 0 && !canClose) {
    return t(conversationLocale, `Controller reducer consumed ${reducerActions.length} internal decision request(s).`, `Controller Reducer 已消费 ${reducerActions.length} 个内部决策请求。`);
  }
  return t(conversationLocale, "All required worker reports are complete, risk-free, and supported by evidence.", "所有必需 worker report 均已完成、无风险，并有证据支持。");
}

function reportIsComplete(report) {
  if (!report || typeof report !== "object") {
    return false;
  }
  const arrays = ["findings", "evidence", "changes", "risks", "unknowns"];
  return report.schema_version === "arckit-worker-report/v1"
    && Boolean(report.task_id)
    && Boolean(report.role)
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function t(language, english, zhHans) {
  return language === "zh-Hans" ? zhHans : english;
}
