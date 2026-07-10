import { buildArtifactOwnershipScan, normalizeArtifactPathReferences } from "./artifact-ownership-map.mjs";

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
  const allEvidence = unique(reports.flatMap((report) => [
    ...(report.evidence || []),
    ...(report.artifact_impacts || []).flatMap((impact) => impact.evidence || [])
  ]));
  const artifactImpactAudit = auditArtifactImpacts({ reports, expectedPackets });
  const allChanges = artifactImpactAudit.changedArtifactPaths;
  const allRisks = unique(reports.flatMap((report) => report.risks || []));
  const allUnknowns = unique(reports.flatMap((report) => report.unknowns || []));
  const ownershipScan = buildArtifactOwnershipScan(allChanges);
  const sourceFactRound = loopFrame.route_plan?.mode === "source_fact_establishment";
  const sourceFactEvidenceSatisfied = !sourceFactRound
    || ownershipScan.source_facts_changed.length > 0
    || allEvidence.some((item) => /^arckit\/(spec|tech|interaction|visual)\//.test(item));
  const humanDecisionRequired = humanDecisionReports.length > 0;
  const infrastructureFailures = reports.filter(isInfrastructureFailureReport);
  const infrastructureFailureIds = new Set(infrastructureFailures.map((report) => report.task_id));
  const blockers = [
    ...infrastructureFailures.map((report) => createGateBlocker({
      type: "infrastructure_failure",
      severity: "blocked",
      recoverable_by: "runtime",
      target: report.task_id || report.role || "unknown",
      suggested_action: "fix_runtime_infrastructure",
      summary: `${report.task_id || report.role || "unknown"}: runtime infrastructure failed - ${report.summary}`
    })),
    ...rejected
      .filter((report) => !infrastructureFailureIds.has(report.task_id))
      .map((report) => createGateBlocker({
        type: report.status === "invalid" ? "invalid_report" : "failed_report",
        severity: "recoverable",
        recoverable_by: "agent",
        target: report.task_id || report.role || "unknown",
        suggested_action: report.status === "invalid" ? "request_valid_report" : "rerun_worker",
        summary: `${report.task_id || report.role || "unknown"}: ${report.status} report - ${report.summary}`
      })),
    ...blocked.map((report) => createGateBlocker({
      type: "blocked_report",
      severity: report.requires_human_decision === true ? "needs_human" : "blocked",
      recoverable_by: report.requires_human_decision === true ? "human" : "runtime",
      target: report.task_id || report.role || "unknown",
      suggested_action: report.requires_human_decision === true ? "request_human_decision" : "inspect_blocker",
      summary: `${report.task_id || report.role || "unknown"}: blocked - ${report.summary}`
    })),
    ...partial.map((report) => createGateBlocker({
      type: "partial_report",
      severity: "recoverable",
      recoverable_by: "agent",
      target: report.task_id || report.role || "unknown",
      suggested_action: "revise_worker",
      summary: `${report.task_id || report.role || "unknown"}: partial - ${report.summary}`
    })),
    ...incompleteReports.map((report) => createGateBlocker({
      type: "incomplete_report",
      severity: "recoverable",
      recoverable_by: "agent",
      target: report.task_id || report.role || "unknown",
      suggested_action: "request_valid_report",
      summary: `${report.task_id || report.role || "unknown"}: incomplete report shape`
    })),
    ...missingReports.map((workerId) => createGateBlocker({
      type: "missing_report",
      severity: "recoverable",
      recoverable_by: "agent",
      target: workerId,
      suggested_action: "rerun_worker",
      summary: `${workerId}: missing worker report`
    })),
    ...allRisks.map((risk) => createGateBlocker({
      type: "risk",
      severity: humanDecisionRequired ? "needs_human" : "recoverable",
      recoverable_by: humanDecisionRequired ? "human" : "agent",
      target: "",
      suggested_action: humanDecisionRequired ? "request_human_decision" : "resolve_risk",
      summary: `risk: ${risk}`
    })),
    ...allUnknowns.map((unknown) => createGateBlocker({
      type: "unknown",
      severity: humanDecisionRequired ? "needs_human" : "recoverable",
      recoverable_by: humanDecisionRequired ? "human" : "agent",
      target: "",
      suggested_action: humanDecisionRequired ? "request_human_decision" : "resolve_unknown",
      summary: `unknown: ${unknown}`
    })),
    ...artifactImpactAudit.blockers
  ];

  if (sourceFactRound && !sourceFactEvidenceSatisfied) {
    blockers.push(createGateBlocker({
      type: "source_fact_evidence_missing",
      severity: "recoverable",
      recoverable_by: "agent",
      target: loopFrame.selected_gap?.id || round.gap_id || "",
      suggested_action: "establish_source_fact",
      summary: "source_fact_establishment claim lacks source-fact evidence accepted by protocol conditions."
    }));
  }
  if (expectedWorkerIds.length === 0) {
    blockers.push(createGateBlocker({
      type: "no_expected_worker_packets",
      severity: "blocked",
      recoverable_by: "agent",
      target: loopFrame.case_id || round.gap_id || "",
      suggested_action: "retry_controller_planning",
      summary: "no expected worker packets were issued for this round."
    }));
  }
  if (allEvidence.length === 0) {
    blockers.push(createGateBlocker({
      type: "evidence_missing",
      severity: "recoverable",
      recoverable_by: "agent",
      target: "",
      suggested_action: "collect_evidence",
      summary: "worker reports did not provide required evidence."
    }));
  }
  if (loopFrame.execution_gate?.status !== "authorized") {
    blockers.push(createGateBlocker({
      type: "execution_gate_unauthorized",
      severity: "needs_human",
      recoverable_by: "human",
      target: "execution_gate",
      suggested_action: "request_authorization",
      summary: t(conversationLocale, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - executor not authorized`, `execution_gate: ${loopFrame.execution_gate?.status || "unknown"} - 执行器未授权`)
    }));
  }
  if (humanDecisionRequired) {
    blockers.push(createGateBlocker({
      type: "human_decision_required",
      severity: "needs_human",
      recoverable_by: "human",
      target: humanDecisionReports.map((report) => report.task_id).filter(Boolean).join(", "),
      suggested_action: "request_human_decision",
      summary: "requires_human_decision=true from worker report."
    }));
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
    && blockers.length === 0
    && allEvidence.length > 0
    && sourceFactEvidenceSatisfied
    && !humanDecisionRequired;

  const hardGateStatus = canClose
    ? "pass"
    : blockers.some((blocker) => blocker.severity === "blocked")
      ? "blocked"
      : blockers.some((blocker) => blocker.severity === "needs_human")
        ? "needs_human"
        : "continue";
  const hardGateReason = gateReason({ dryRun, infrastructureFailures, blockers, reducerActions, canClose, conversationLocale });
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
	    hard_gate: {
	      status: hardGateStatus,
	      can_close: canClose,
	      blockers,
	      reason: hardGateReason
	    },
	    artifact_ownership_scan: ownershipScan,
	    source_projection_check: {
	      source_facts_changed: ownershipScan.source_facts_changed,
	      projection_artifacts_changed: ownershipScan.projection_artifacts_changed,
	      source_unknown: allUnknowns.length > 0 || rejected.length > 0 || blocked.length > 0 || missingReports.length > 0 || (sourceFactRound && !sourceFactEvidenceSatisfied),
	      deferred_projections: dryRun ? ["real worker execution", "ledger writeback"] : [],
	      blocked_projections: blockers.map(formatGateBlocker)
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
      reason: hardGateReason
    }
  };
}

function gateReason({ dryRun, infrastructureFailures, blockers, reducerActions, canClose, conversationLocale }) {
  if (dryRun) {
    return t(conversationLocale, "Dry-run proves orchestration shape but not real software progress.", "Controller Preview 只证明编排形状，不代表真实软件进展。");
  }
  if (infrastructureFailures.length > 0) {
    return t(conversationLocale, `Runtime infrastructure blocked execution: ${infrastructureFailures[0].summary}`, `Runtime 基础设施阻塞执行：${infrastructureFailures[0].summary}`);
  }
  if (blockers.length > 0) {
    const summaries = blockers.slice(0, 5).map(formatGateBlocker).join(" | ");
    return t(conversationLocale, `Loop cannot close: ${summaries}`, `本轮不能关闭：${summaries}`);
  }
  if (reducerActions.length > 0 && !canClose) {
    return t(conversationLocale, `Controller reducer consumed ${reducerActions.length} internal decision request(s).`, `Controller Reducer 已消费 ${reducerActions.length} 个内部决策请求。`);
  }
  return t(conversationLocale, "All required worker reports are complete, risk-free, and supported by evidence.", "所有必需 worker report 均已完成、无风险，并有证据支持。");
}

function createGateBlocker({ type, severity, recoverable_by, target, suggested_action, summary }) {
  return {
    type,
    severity,
    recoverable_by,
    target: target || "",
    suggested_action,
    summary
  };
}

function formatGateBlocker(blocker) {
  if (typeof blocker === "string") {
    return blocker;
  }
  return blocker?.summary || "";
}

function reportIsComplete(report) {
  if (!report || typeof report !== "object") {
    return false;
  }
  const arrays = ["findings", "evidence", "changes", "artifact_impacts", "risks", "unknowns"];
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

function auditArtifactImpacts({ reports, expectedPackets }) {
  const packetByWorkerId = new Map(expectedPackets.map((packet) => [packet.worker_id, packet]));
  const changedArtifactPaths = [];
  const blockers = [];
  for (const report of reports) {
    const impacts = Array.isArray(report.artifact_impacts) ? report.artifact_impacts : [];
    if ((report.changes || []).length > 0 && impacts.length === 0) {
      blockers.push(createGateBlocker({
        type: "artifact_impacts_missing",
        severity: "recoverable",
        recoverable_by: "agent",
        target: report.task_id || report.role || "unknown",
        suggested_action: "request_valid_report",
        summary: `${report.task_id || report.role || "unknown"}: report.changes is descriptive but artifact_impacts is empty; Runtime requires structured artifact references for gates.`
      }));
    }
    const packet = packetByWorkerId.get(report.task_id);
    for (const impact of impacts) {
      const artifact = normalizeArtifactPathReferences([impact.artifact])[0] || "";
      if (!artifact) {
        blockers.push(createGateBlocker({
          type: "invalid_artifact_reference",
          severity: "recoverable",
          recoverable_by: "agent",
          target: report.task_id || report.role || "unknown",
          suggested_action: "request_valid_report",
          summary: `${report.task_id || report.role || "unknown"}: artifact impact has an invalid artifact reference.`
        }));
        continue;
      }
      if (packet && !pathAllowedByPacket(artifact, packet)) {
        blockers.push(createGateBlocker({
          type: "artifact_outside_worker_scope",
          severity: "blocked",
          recoverable_by: "runtime",
          target: artifact,
          suggested_action: "revise_worker_packet_scope",
          summary: `${report.task_id || report.role || "unknown"}: artifact impact is outside worker allowed_paths: ${artifact}`
        }));
      }
      if (!impact.claim || !impact.summary) {
        blockers.push(createGateBlocker({
          type: "artifact_claim_incomplete",
          severity: "recoverable",
          recoverable_by: "agent",
          target: artifact,
          suggested_action: "request_valid_report",
          summary: `${report.task_id || report.role || "unknown"}: artifact impact lacks claim or summary: ${artifact}`
        }));
      }
      if (isMutatingOperation(impact.operation)) {
        changedArtifactPaths.push(artifact);
        if (!Array.isArray(impact.evidence) || impact.evidence.length === 0) {
          blockers.push(createGateBlocker({
            type: "artifact_evidence_missing",
            severity: "recoverable",
            recoverable_by: "agent",
            target: artifact,
            suggested_action: "collect_evidence",
            summary: `${report.task_id || report.role || "unknown"}: mutating artifact impact lacks evidence: ${artifact}`
          }));
        }
      }
    }
  }
  return {
    changedArtifactPaths: unique(changedArtifactPaths),
    blockers
  };
}

function isMutatingOperation(operation) {
  return ["created", "updated", "deleted"].includes(operation);
}

function pathAllowedByPacket(path, packet) {
  const allowedPaths = Array.isArray(packet.allowed_paths) ? packet.allowed_paths : [];
  if (allowedPaths.length === 0) {
    return true;
  }
  return allowedPaths.some((allowed) => {
    const normalized = normalizeArtifactPathReferences([allowed])[0] || String(allowed || "").trim().replaceAll("\\", "/").replace(/^\.\//, "");
    if (!normalized) {
      return false;
    }
    return normalized.endsWith("/") ? path.startsWith(normalized) : path === normalized;
  });
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
