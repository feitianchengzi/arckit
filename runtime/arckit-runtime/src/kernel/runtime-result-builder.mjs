import { buildArtifactOwnershipScan, createArtifactImpactScan } from '../artifact-ownership-map.mjs';
import { stateFromLoopGate } from '../round-state-machine.mjs';
import { firstSafeSemanticText, SEMANTIC_LIMITS } from '../context-boundary.mjs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const casePolicyRef = 'runtime/arckit-runtime/config/case-policy.json';
const casePolicyPath = join(runtimeRoot, 'config/case-policy.json');

export function stateFromMergeResult(mergeResult) {
  return shouldPrepareLedgerWriteback(mergeResult) ? 'ledger_gate_ready' : stateFromLoopGate(mergeResult.loop_gate);
}

export function shouldPrepareLedgerWriteback(mergeResult) {
  const review = mergeResult.controller_reducer_result?.controller_review;
  if (!review || mergeResult.controller_reducer_result?.controller_review_failure_reason) return false;
  const intake = mergeResult.report_intake || {};
  const unresolvedReports = [
    ...(intake.rejected || []),
    ...(intake.needs_revision || []),
    ...(intake.missing || []),
  ];
  if (unresolvedReports.length) return false;
  const delta = review.accepted_case_state_delta || {};
  return (delta.facets || []).length > 0
    || (delta.resolved_open_questions || []).length > 0
    || (delta.completed_handoffs || []).length > 0
    || delta.completion_review_result != null
    || (delta.resolved_review_findings || []).length > 0
    || delta.review_budget_extension != null;
}

export async function createCaseControlRuntimeResult({ controllerPlan, loopFrame, round, snapshot, compiledPrompt, roundState }) {
  const policy = JSON.parse(await readFile(casePolicyPath, 'utf8'));
  const maxReviewCycles = policy?.completion_review?.max_autonomous_cycles;
  if (policy?.schema_version !== 'arckit-case-policy/v1' || !Number.isInteger(maxReviewCycles) || maxReviewCycles < 1) {
    throw new Error(`Invalid Runtime Case policy: ${casePolicyPath}`);
  }
  const control = (controllerPlan?.execution_plan?.runtime_actions || []).find((action) => action?.type === 'case_control');
  if (!control) {
    throw new Error('Controller plan does not contain a case_control Runtime action.');
  }
  const locale = loopFrame.conversation_locale || round.conversation_locale || compiledPrompt.conversation_locale || 'en';
  const reason = t(locale, `Controller requested creation and registration of a bounded Case: ${control.title}.`, `Controller 请求创建并登记有边界的 Case：${control.title}。`);
  const handoff = {
    schema_version: 'arckit-case-control-handoff/v1',
    action: control.action,
    expected_project_updated_at: snapshot.projectState?.project?.updated_at || '',
    case_id: control.case_id || '',
    title: control.title || '',
    intent: control.intent || '',
    artifact_type: control.artifact_type || 'unknown',
    selection_reason: control.selection_reason || '',
    review_policy: {
      max_autonomous_cycles: maxReviewCycles,
      source: casePolicyRef,
    },
  };
  const emptyOwnership = buildArtifactOwnershipScan([]);
  const nextPrompt = controllerPlan.continuation_intent.next_prompt;
  const controlRoundState = {
    ...(roundState || {}),
    state: 'ledger_gate_ready',
    history: [
      ...(roundState?.history || []),
      { state: 'ledger_gate_ready', at: new Date().toISOString(), reason },
    ],
  };
  return {
    schema_version: 'arckit-runtime-result/v2',
    round_result: 'continue',
    round_outcome: { status: 'completed', reason },
    case_outcome: { status: 'unresolved', reason, unresolved: ['case_control'] },
    project_impact: { status: 'none', changes: [], evidence: [] },
    case_transition: null,
    case_control_handoff: handoff,
    round_state: controlRoundState.state,
    round_state_history: controlRoundState.history,
    summary: reason,
    changed_files: [],
    artifact_impact_scan: createArtifactImpactScan(emptyOwnership, { dryRun: false }),
    artifact_ownership_scan: emptyOwnership,
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: false,
      deferred_projections: ['Case creation/selection is pending deterministic ledger application.'],
      blocked_projections: [],
    },
    controller_reducer_result: { controller_plan: controllerPlan, control_handoff: handoff },
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    worker_packets: [],
    report_intake: { accepted: [], rejected: [], needs_revision: [], needs_controller_decision: [], needs_human_decision: [], missing: [] },
    ledger_stage: {
      schema_version: 'arckit-ledger-stage/v1',
      status: 'gate_ready',
      gate_required: true,
      writeback_required: true,
      reason,
    },
    validation_evidence: unique([
      'runtime/arckit-runtime/schemas/controller-plan.schema.json',
      casePolicyRef,
      compiledPrompt.output_schema,
    ]),
    loop_handoff: {
      version: 'loop-handoff/v2',
      status: 'continue',
      next_responsibility: 'agent',
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: 'auto_bridge',
      responsibility_reason: reason,
      next_prompt: nextPrompt,
      agent_instruction: {
        goal: controllerPlan.continuation_intent.goal,
        required_context_refs: round.required_context_refs,
        required_actions: ['Reload Project and Case State after the deterministic Case control handoff is applied.'],
        required_checks: ['registered Case ref', 'fresh Case revision', 'derived candidate_gaps'],
        stop_condition: round.stop_conditions.join(' '),
      },
      human_gate: { required: false, reason: '', decision_needed: '' },
      progress_guard: {
        expected_state_change: controllerPlan.continuation_intent.state_transition,
        actual_state_change: 'Controller produced an authorized Case control handoff pending deterministic ledger application.',
        no_progress_limit: 1,
        max_auto_rounds: Number.isInteger(round.max_auto_rounds) ? round.max_auto_rounds : 8,
      },
    },
  };
}

export function createRuntimeResultFromMerge({ mergeResult, reports, loopFrame, round, compiledPrompt, dryRun, roundState }) {
  const locale = loopFrame.conversation_locale || round.conversation_locale || compiledPrompt.conversation_locale || 'en';
  const review = mergeResult.controller_reducer_result?.controller_review || null;
  const ledgerReady = !dryRun && shouldPrepareLedgerWriteback(mergeResult);
  const roundOutcome = deriveRoundOutcome(mergeResult, reports, dryRun);
  const caseOutcome = review?.case_resolution || {
    claimed_status: 'blocked',
    reason: mergeResult.loop_gate.reason || 'Controller review did not produce a Case outcome.',
    unresolved: ['controller_review'],
  };
  const projectImpact = review?.project_impact_candidate || { status: 'none', changes: [], evidence: [] };
  const continuation = deriveContinuationFields({ mergeResult, loopFrame, round });
  const loopHandoff = buildLoopHandoff({
    caseOutcome,
    review,
    loopGate: mergeResult.loop_gate,
    continuation,
    round,
    ledgerReady,
    locale,
  });
  const caseTransition = buildCaseTransition({ loopFrame, round, review, mergeResult, roundOutcome, caseOutcome, projectImpact });
  const roundResult = caseOutcome.claimed_status === 'resolved'
    ? 'done'
    : loopHandoff.next_responsibility === 'human'
      ? 'needs_human'
      : loopHandoff.next_responsibility === 'external'
        ? 'external_wait'
        : caseOutcome.claimed_status === 'blocked'
          ? 'blocked'
          : 'continue';
  const summary = [
    t(locale, `Round outcome: ${roundOutcome.status}.`, `本轮结果：${roundOutcome.status}。`),
    t(locale, `Case outcome claim: ${caseOutcome.claimed_status}.`, `Case 结果声明：${caseOutcome.claimed_status}。`),
    mergeResult.loop_gate.reason,
  ].filter(Boolean).join(' ');

  return {
    schema_version: 'arckit-runtime-result/v2',
    round_result: roundResult,
    round_outcome: { status: roundOutcome.status, reason: roundOutcome.reason },
    case_outcome: { status: caseOutcome.claimed_status, reason: caseOutcome.reason, unresolved: caseOutcome.unresolved || [] },
    project_impact: projectImpact,
    case_transition: caseTransition,
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
      schema_version: 'arckit-ledger-stage/v1',
      status: ledgerReady ? 'gate_ready' : dryRun ? 'not_ready' : loopHandoff.next_responsibility === 'human' ? 'human_blocked' : 'blocked',
      gate_required: ledgerReady,
      writeback_required: ledgerReady,
      reason: ledgerReady
        ? t(locale, 'Controller accepted an evidence-backed Case transition for deterministic ledger application.', 'Controller 已接受有证据支持的 Case transition，可进入确定性 ledger 写回。')
        : mergeResult.loop_gate.reason,
    },
    validation_evidence: unique([
      ...mergeResult.evidence,
      'runtime/arckit-runtime/schemas/worker-packet.schema.json',
      'runtime/arckit-runtime/schemas/worker-report.schema.json',
      'runtime/arckit-runtime/schemas/controller-plan.schema.json',
      'runtime/arckit-runtime/schemas/controller-review.schema.json',
      compiledPrompt.output_schema,
    ]),
    loop_handoff: loopHandoff,
  };
}

function deriveRoundOutcome(mergeResult, reports, dryRun) {
  if (dryRun) return { status: 'partial', reason: 'Preview produced no executed Case transition.' };
  if (mergeResult.loop_gate.status === 'blocked') return { status: 'blocked', reason: mergeResult.loop_gate.reason };
  if (mergeResult.loop_gate.status === 'needs_human') return { status: 'needs_human', reason: mergeResult.loop_gate.reason };
  if (mergeResult.loop_gate.status === 'external_wait') return { status: 'external_wait', reason: mergeResult.loop_gate.reason };
  const partial = reports.some((report) => report.status !== 'completed');
  return { status: partial ? 'partial' : 'completed', reason: mergeResult.loop_gate.reason };
}

function buildCaseTransition({ loopFrame, round, review, mergeResult, roundOutcome, caseOutcome, projectImpact }) {
  const selected = loopFrame.controller_frame?.route_plan?.selected_gap || loopFrame.selected_gap || {};
  const plan = loopFrame.controller_frame?.controller_plan?.planned_transition || {
    goal: round.round_goal,
    expected_state_change: selected.next_transition || round.next_transition || round.round_goal,
  };
  return {
    schema_version: 'arckit-case-transition/v3',
    case_id: selected.case_id || loopFrame.case_id || '',
    case_updated_at: loopFrame.case_updated_at || '',
    project_updated_at: loopFrame.project_updated_at || '',
    selected_gap: {
      id: selected.id || round.gap_id || '',
      facet: selected.facet || round.facet || '',
      responsibility: selected.responsibility || 'agent',
      current_state: selected.current_state || round.current_state || '',
      target_state: selected.target_state || round.target_state || '',
      next_transition: selected.next_transition || round.next_transition || plan.expected_state_change,
      evidence_required: ['accepted Worker evidence', 'Controller closeout judgment'],
    },
    planned_transition: plan,
    accepted_state_delta: review?.accepted_case_state_delta || { facets: [], resolved_open_questions: [], completed_handoffs: [], completion_review_result: null, resolved_review_findings: [], review_budget_extension: null },
    evidence: unique(mergeResult.evidence),
    unresolved: caseOutcome.unresolved || [],
    round_outcome: roundOutcome.status,
    case_resolution: { claimed_status: caseOutcome.claimed_status, reason: caseOutcome.reason },
    project_impact_candidate: projectImpact,
  };
}

function buildLoopHandoff({ caseOutcome, review, loopGate = {}, continuation, round, ledgerReady, locale }) {
  const resolved = caseOutcome.claimed_status === 'resolved';
  const external = loopGate.status === 'external_wait'
    || loopGate.next_responsibility === 'external'
    || review?.status === 'external_wait';
  const needsHuman = loopGate.status === 'needs_human'
    || loopGate.next_responsibility === 'human'
    || loopGate.human_decision_required === true
    || review?.human_decision_required === true
    || review?.status === 'needs_human';
  const blocked = loopGate.status === 'blocked'
    || caseOutcome.claimed_status === 'blocked'
    || review?.status === 'blocked';
  const responsibility = resolved ? 'none' : external ? 'external' : needsHuman ? 'human' : 'agent';
  return {
    version: 'loop-handoff/v2',
    status: resolved ? 'done' : external ? 'external_wait' : needsHuman ? 'needs_human' : blocked ? 'blocked' : 'continue',
    next_responsibility: responsibility,
    agent_continuation_available: responsibility === 'agent',
    human_decision_required: responsibility === 'human',
    trigger_mode: responsibility === 'none' ? 'none' : responsibility === 'human' ? 'user_decision' : responsibility === 'external' ? 'external_wait' : 'auto_bridge',
    responsibility_reason: loopGate.reason || caseOutcome.reason || review?.summary || '',
    next_prompt: responsibility === 'agent' ? continuation.next_prompt : '',
    agent_instruction: {
      goal: resolved ? t(locale, 'No continuation required.', '无需继续。') : continuation.goal,
      required_context_refs: round.required_context_refs,
      required_actions: responsibility === 'agent' ? [ledgerReady ? 'Apply the accepted Case transition, then select one transition from the newly derived candidate gaps.' : continuation.goal] : [],
      required_checks: ['case_transition', 'derived case_resolution', 'loop_handoff'],
      stop_condition: round.stop_conditions.join(' '),
    },
    human_gate: {
      required: responsibility === 'human',
      reason: responsibility === 'human' ? caseOutcome.reason : '',
      decision_needed: responsibility === 'human' ? review?.next_prompt || continuation.next_prompt || continuation.goal : '',
    },
    progress_guard: {
      expected_state_change: continuation.state_transition,
      actual_state_change: ledgerReady ? 'Controller accepted a Case transition pending deterministic writeback.' : '',
      no_progress_limit: 1,
      max_auto_rounds: Number.isInteger(round.max_auto_rounds) ? round.max_auto_rounds : 8,
    },
  };
}

function deriveContinuationFields({ mergeResult, loopFrame, round }) {
  const reviewIntent = mergeResult.controller_reducer_result?.controller_review?.continuation_intent || {};
  const planIntent = loopFrame.controller_frame?.controller_plan?.continuation_intent || {};
  const routeGap = loopFrame.controller_frame?.route_plan?.selected_gap || {};
  const goal = firstSafeSemanticText([reviewIntent.goal, planIntent.goal, routeGap.next_transition, round.round_goal], { maxLength: SEMANTIC_LIMITS.goal, fallback: 'Inspect the selected Case candidate gaps and choose one bounded transition.' });
  const stateTransition = firstSafeSemanticText([reviewIntent.state_transition, planIntent.state_transition, routeGap.next_transition, goal], { maxLength: SEMANTIC_LIMITS.transition, fallback: goal });
  const nextPrompt = firstSafeSemanticText([reviewIntent.next_prompt, mergeResult.next_prompt, planIntent.next_prompt, stateTransition], { maxLength: SEMANTIC_LIMITS.nextPrompt, fallback: stateTransition });
  return { goal, state_transition: stateTransition, next_prompt: nextPrompt };
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function t(language, english, zhHans) {
  return language === 'zh-Hans' ? zhHans : english;
}
