import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { evaluateRuntimeGates } from "./gate-engine.mjs";
import { runLedgerScript } from "./ledger-scripts.mjs";

export async function writeLedger({ projectRoot, runtimeResult, envelope, snapshot, dryRun = false }) {
  const root = resolve(projectRoot);
  const gate = evaluateRuntimeGates({ runtimeResult, snapshot, envelope });
  if (!gate.allowed) {
    return {
      schema_version: "arckit-ledger-write/v1",
      written: false,
      dry_run: dryRun,
      gate,
      plan: [],
      changed_files: []
    };
  }

  const timestamp = new Date().toISOString();
  const runId = `RUN-${timestamp.replaceAll(/[-:.]/g, "").replace("T", "-").replace("Z", "Z")}`;
  const selectedRound = resolveSelectedRound({ envelope, runtimeResult });
  const finalWriteback = isFinalWriteback(runtimeResult);
  const projectStatePath = join(root, "arckit/project/state.record.json");
  const iterationPath = snapshot?.projectState?.active_iteration_ref
    ? join(root, snapshot.projectState.active_iteration_ref)
    : "";
  const activeCasePath = firstExistingPath(root, snapshot?.projectState?.active_case_refs || []);
  const runtimeRecordPath = join(root, "arckit/project/runtime-results", `${runId}.json`);
  const relativeRuntimeRecordPath = relativeToProject(root, runtimeRecordPath);

  const plan = [
    { action: "write_runtime_execution_record", path: relativeRuntimeRecordPath },
    { action: "update_project_state", path: "arckit/project/state.record.json" }
  ];
  if (iterationPath) {
    plan.push({ action: "update_iteration_state", path: relativeToProject(root, iterationPath) });
  }
  if (activeCasePath) {
    plan.push({ action: "update_active_case", path: relativeToProject(root, activeCasePath) });
  }
  plan.push({ action: "render_and_index_ledgers", path: "arckit/project, arckit/cases" });

  if (dryRun) {
    return {
      schema_version: "arckit-ledger-write/v1",
      written: false,
      dry_run: true,
      gate,
      run_id: runId,
      plan,
      changed_files: []
    };
  }

  const changedFiles = [];
  await mkdir(dirname(runtimeRecordPath), { recursive: true });
  await writeJson(runtimeRecordPath, {
    schema_version: "arckit-runtime-execution-record/v1",
    id: runId,
    created_at: timestamp,
    writeback_mode: finalWriteback ? "final" : "progress",
    selected_round: selectedRound,
    runtime_result: runtimeResult,
    gate
  });
  changedFiles.push(relativeRuntimeRecordPath);

  const projectState = await readJson(projectStatePath);
  applyProjectStateWriteback(projectState, { timestamp, runtimeResult, selectedRound, runtimeRecordPath: relativeRuntimeRecordPath, finalWriteback });
  await writeJson(projectStatePath, projectState);
  changedFiles.push("arckit/project/state.record.json");

  if (iterationPath && existsSync(iterationPath)) {
    const iteration = await readJson(iterationPath);
    applyIterationWriteback(iteration, { timestamp, runtimeResult, selectedRound, runtimeRecordPath: relativeRuntimeRecordPath, finalWriteback });
    await writeJson(iterationPath, iteration);
    changedFiles.push(relativeToProject(root, iterationPath));
  }

  if (activeCasePath) {
    const { text, record } = await readCaseRecord(activeCasePath);
    applyCaseWriteback(record, { timestamp, runtimeResult, selectedRound, runtimeRecordPath: relativeRuntimeRecordPath, finalWriteback });
    await writeCaseRecord(activeCasePath, text, record);
    changedFiles.push(relativeToProject(root, activeCasePath));
  }

  runLedgerScript(root, ["project-state.mjs", "render", "arckit/project/state.record.json"]);
  changedFiles.push("arckit/project/STATE.md");
  if (iterationPath) {
    runLedgerScript(root, ["project-iteration.mjs", "render", relativeToProject(root, iterationPath)]);
    runLedgerScript(root, ["project-iteration.mjs", "index"]);
    changedFiles.push(iterationPath.replace(/\.record\.json$/, ".md").slice(root.length + 1));
    changedFiles.push("arckit/project/ITERATIONS.md");
  }
  runLedgerScript(root, ["development-case.mjs", "index"]);
  changedFiles.push("arckit/cases/INDEX.md");

  return {
    schema_version: "arckit-ledger-write/v1",
    written: true,
    dry_run: false,
    gate,
    run_id: runId,
    plan,
    changed_files: Array.from(new Set(changedFiles))
  };
}

function isFinalWriteback(runtimeResult) {
  return runtimeResult?.round_result === "done" || runtimeResult?.loop_handoff?.next_responsibility === "none";
}

function applyProjectStateWriteback(record, { timestamp, runtimeResult, selectedRound, runtimeRecordPath, finalWriteback }) {
  record.project.updated_at = timestamp;
  const dimension = selectedRound.dimension;
  if (dimension && record.completeness_dimensions?.[dimension]) {
    const item = record.completeness_dimensions[dimension];
    if (finalWriteback) {
      item.current_state = selectedRound.target_state || item.target_state || item.current_state;
    }
    item.state_reason = finalWriteback
      ? `Runtime accepted result for ${selectedRound.gap_id || dimension}: ${runtimeResult.summary}`
      : `Runtime recorded progress for ${selectedRound.gap_id || dimension}: ${runtimeResult.summary}`;
    item.evidence = mergeEvidence(item.evidence, [runtimeRecordPath, ...(runtimeResult.validation_evidence || []), ...(runtimeResult.changed_files || [])]);
    item.evidence_maturity = finalWriteback ? "validated" : "confirmed";
    if (finalWriteback) {
      item.gap = "";
    }
    item.next_transition = runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || "";
    if (finalWriteback) {
      item.priority = item.current_state === item.target_state ? "none" : item.priority;
      item.confidence = "high";
    }
  }

  if (finalWriteback && selectedRound.gap_id) {
    record.state_gaps = (record.state_gaps || []).filter((gap) => gap.id !== selectedRound.gap_id);
  }

  record.loop_control = {
    ...record.loop_control,
    next_transition: runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || runtimeResult.summary,
    priority_basis: `Accepted runtime result ${runtimeRecordPath}: ${runtimeResult.summary}`,
    next_responsibility: runtimeResult.loop_handoff?.next_responsibility || "none",
    agent_continuation_available: runtimeResult.loop_handoff?.agent_continuation_available === true,
    human_decision_required: runtimeResult.loop_handoff?.human_decision_required === true,
    trigger_mode: runtimeResult.loop_handoff?.trigger_mode || "none",
    continuation_prompt: runtimeResult.loop_handoff?.next_prompt || "",
    responsibility_reason: runtimeResult.loop_handoff?.responsibility_reason || ""
  };

  record.last_state_delta = {
    changed_dimensions: selectedRound.dimension && selectedRound.dimension !== "agent_selected" ? [selectedRound.dimension] : [],
    state_transitions: finalWriteback ? [
      {
        dimension: selectedRound.dimension || "agent_selected",
        from_state: selectedRound.current_state || "verified",
        to_state: selectedRound.target_state || "accepted",
        reason: `Runtime ledger writeback accepted ${selectedRound.gap_id || "selected round"}: ${runtimeResult.summary}`
      }
    ] : [],
    deferred_dimensions: runtimeResult.source_projection_check?.deferred_projections || [],
    blocked_dimensions: [],
    case_refs: record.active_case_refs || [],
    iteration_ref: record.active_iteration_ref || "",
    next_loop_focus: runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || "",
    updated_at: timestamp
  };

  record.canonical_artifact_refs = mergeEvidence(record.canonical_artifact_refs, [runtimeRecordPath]);
}

function applyIterationWriteback(record, { timestamp, runtimeResult, selectedRound, runtimeRecordPath, finalWriteback }) {
  record.updated_at = timestamp;
  record.current_state_delta = [
    ...(record.current_state_delta || []),
    {
      dimension: selectedRound.dimension || "agent_selected",
      from_state: selectedRound.current_state || "verified",
      to_state: finalWriteback ? selectedRound.target_state || "accepted" : selectedRound.current_state || "verified",
      reason: finalWriteback
        ? `Runtime ledger writeback accepted ${selectedRound.gap_id || "selected round"}: ${runtimeResult.summary}`
        : `Runtime ledger writeback recorded progress for ${selectedRound.gap_id || "selected round"}: ${runtimeResult.summary}`,
      evidence: [runtimeRecordPath, ...(runtimeResult.validation_evidence || [])]
    }
  ];
  record.acceptance_state = {
    ...(record.acceptance_state || {}),
    current_state: runtimeResult.loop_handoff?.next_responsibility === "none" ? "accepted" : "verified",
    evidence: mergeEvidence(record.acceptance_state?.evidence, [runtimeRecordPath]),
    remaining_gaps: runtimeResult.loop_handoff?.next_responsibility === "none"
      ? []
      : [runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || "Continue runtime-supervised loop."]
  };
  record.last_iteration_delta = {
    changed: selectedRound.dimension && selectedRound.dimension !== "agent_selected" ? [selectedRound.dimension] : [],
    blocked: [],
    deferred: runtimeResult.source_projection_check?.deferred_projections || [],
    next_iteration_focus: runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || "",
    updated_at: timestamp
  };
}

function applyCaseWriteback(record, { timestamp, runtimeResult, selectedRound, runtimeRecordPath, finalWriteback }) {
  const nextRound = (record.rounds || []).length + 1;
  record.updated_at = timestamp;
  record.current_round_goal = runtimeResult.loop_handoff?.agent_instruction?.goal || "";
  record.current_round_gap = runtimeResult.loop_handoff?.next_responsibility === "none"
    ? "none"
    : runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.responsibility_reason || "Continue runtime loop.";
  record.project_state_delta = {
    changed: selectedRound.dimension && selectedRound.dimension !== "agent_selected" ? [selectedRound.dimension] : [],
    unchanged_unknown: [],
    deferred: runtimeResult.source_projection_check?.deferred_projections || [],
    blocked: [],
    next_project_question: runtimeResult.loop_handoff?.agent_instruction?.goal || runtimeResult.loop_handoff?.next_prompt || "",
    updated_at: timestamp
  };
  record.rounds = [
    ...(record.rounds || []),
    {
      round: nextRound,
      goal: selectedRound.round_goal || selectedRound.next_transition || "Runtime ledger writeback",
      actions: [
        finalWriteback
          ? `Accepted runtime result and wrote ledger execution record ${runtimeRecordPath}.`
          : `Recorded runtime progress and wrote ledger execution record ${runtimeRecordPath}.`
      ],
      verification: runtimeResult.validation_evidence || [],
      source_projection_check: runtimeResult.source_projection_check || {}
    }
  ];
  record.completion_audit = {
    ...(record.completion_audit || {}),
    status: runtimeResult.loop_handoff?.next_responsibility === "none" ? "complete" : "incomplete",
    next_round_goal: runtimeResult.loop_handoff?.agent_instruction?.goal || "",
    loop_handoff: runtimeResult.loop_handoff,
    updated_at: timestamp
  };
}

function resolveSelectedRound({ envelope, runtimeResult }) {
  const envelopeRound = envelope?.selected_round || {};
  const routeGap = runtimeResult?.controller_frame?.route_plan?.selected_gap || runtimeResult?.controller_reducer_result?.controller_frame?.route_plan?.selected_gap || null;
  if (routeGap && typeof routeGap === "object" && (routeGap.id || routeGap.dimension)) {
    return {
      ...envelopeRound,
      gap_id: routeGap.id || envelopeRound.gap_id || "",
      dimension: routeGap.dimension || envelopeRound.dimension || "",
      current_state: routeGap.current_state || envelopeRound.current_state || "",
      target_state: routeGap.target_state || envelopeRound.target_state || "",
      round_goal: routeGap.next_transition || envelopeRound.round_goal || runtimeResult?.loop_handoff?.agent_instruction?.goal || "",
      next_transition: routeGap.next_transition || envelopeRound.next_transition || ""
    };
  }
  return envelopeRound;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function mergeEvidence(current = [], next = []) {
  return Array.from(new Set([...(Array.isArray(current) ? current : []), ...next.filter(Boolean)]));
}

function firstExistingPath(root, refs) {
  for (const ref of refs) {
    const path = join(root, ref);
    if (existsSync(path)) {
      return path;
    }
  }
  return "";
}

function relativeToProject(root, path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}

async function readCaseRecord(file) {
  const text = await readFile(file, "utf8");
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error(`${file}: missing Structured Record json block`);
  }
  return { text, record: JSON.parse(match[1]) };
}

async function writeCaseRecord(file, text, record) {
  const json = JSON.stringify(record, null, 2);
  const nextText = text
    .replace(/^Current Gap: .+$/m, `Current Gap: ${record.current_round_gap}`)
    .replace(/^Updated: .+$/m, `Updated: ${record.updated_at}`)
    .replace(/(## Structured Record[\s\S]*?```json\s*\n)([\s\S]*?)(\n```)/, `$1${json}$3`);
  await writeFile(file, nextText);
}
