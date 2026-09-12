import { startLifecycleSpan, endLifecycleSpan } from '../observability/lifecycle-trace.mjs';
import { createAgentAdapter } from '../agent-adapter.mjs';
import { runStateDrivenSession } from '../state-driven-runner.mjs';
import { compactSessionThread } from '../kernel/session-thread.mjs';
import { createExecutionCheckpoint, acceptCloseoutCheckpoint, executionRuntimeContext,
  caseCheckpointFromExecution, executionCheckpointFromCase } from './execution-checkpoint.mjs';
import { requireAutomationDeliveryPolicy } from './delivery-policy.mjs';
import { TASK_CLOSEOUT_VERSION, taskCloseoutOutputSchema, isTaskCloseoutResult,
  invalidTaskCloseoutResult, taskCloseoutStopReason } from '../task-closeout-contract.mjs';

// Product composition: accepted Case -> authorized delivery -> optional fresh Case continuation.
// One adapter and thread belong to the whole task, not to individual stages or Cases.
export async function runAutomationSession({ projectRoot, stateStore, options = {}, dependencies = {} }) {
  const deliveryPolicy = requireAutomationDeliveryPolicy(options.runtimeContext?.delivery_policy);
  let checkpoint = createExecutionCheckpoint(options.runtimeContext);
  const adapter = options.agentAdapter || (dependencies.createAdapter || createAgentAdapter)(
    options.dryRun ? 'dry-run' : options.adapter || 'codex-app-server', options);
  const threadKey = `agent-loop:${String(options.taskId || options.lifecycleRunId || 'active-session').trim() || 'active-session'}`;
  const threadState = {};
  let threadId = String(options.threadId || '');
  let envelope = null;
  const rounds = [];
  let repairs = 0;
  const emit = event => {
    options.onEvent?.(event);
    if (options.streamEvents) console.error(JSON.stringify({ event }));
  };
  const persist = next => { checkpoint = next; emit({ type: 'runtime.execution_checkpoint', checkpoint: structuredClone(next) }); };
  try {
    persist(checkpoint);
    for (;;) {
      if (checkpoint.phase === 'loop') {
        const { execution_checkpoint, closeout_only, ...context } = executionRuntimeContext(options.runtimeContext, checkpoint);
        envelope = await runStateDrivenSession({ projectRoot, stateStore, dependencies, agentAdapter: adapter, threadState,
          options: { ...options, threadId, roundIndexOffset: rounds.length,
            runtimeContext: { ...context, case_checkpoint: caseCheckpointFromExecution(checkpoint) },
            onEvent(event) {
              if (event.type === 'runtime.case_checkpoint') persist(executionCheckpointFromCase(event.checkpoint));
              else options.onEvent?.(event);
            } } });
        threadId = envelope.thread_id || adapter.threadId?.(threadKey) || threadId;
        rounds.push(...envelope.session_rounds);
        repairs += envelope.agent_repair_attempt_count || 0;
        if (envelope.stop_reason !== 'completed') return finish(envelope.stop_reason);
      }
      // A previously completed delivery is durable: restarting must not invoke Git again.
      let result = checkpoint.closeout_result?.status === 'completed' ? checkpoint.closeout_result : null;
      if (!result) {
        result = await runGitCloseout({ adapter, projectRoot, threadKey, threadId, checkpoint, deliveryPolicy,
          options: { ...options, runtimeContext: executionRuntimeContext(options.runtimeContext, checkpoint) } });
        persist(acceptCloseoutCheckpoint(checkpoint, result));
        threadId = adapter.threadId?.(threadKey) || threadId;
      }
      if (result.status !== 'resume_loop') return finish(taskCloseoutStopReason(result));
      emit({ type: 'runtime.closeout.resume_requested', round_index: rounds.length, result });
      await compactSessionThread({ adapter, threadKey, threadId, options, state: threadState });
    }
  } finally {
    const span = startLifecycleSpan(options, { name: 'runtime.adapter_close', category: 'runtime', cost_center: 'orchestration' });
    try {
      await adapter.close?.();
      endLifecycleSpan(options, span, { status: 'ok' });
    } catch (error) {
      endLifecycleSpan(options, span, { status: 'error', error });
      throw error;
    }
  }
  function finish(stopReason) {
    return { ...(envelope || { runtime_version: 'arcorbit/v0.3-state-driven', project_root: projectRoot,
      runtime_result: null, validation: { valid: true, issues: [] }, ledger_write_result: null }),
      session_mode: 'state-driven', round_count: rounds.length, session_rounds: rounds,
      agent_repair_attempt_count: repairs, thread_id: threadId, execution_checkpoint: checkpoint,
      closeout_result: checkpoint.closeout_result, stop_reason: stopReason,
      paused_for_human: stopReason === 'human_intervention',
      next_action: checkpoint.closeout_result ? checkpoint.closeout_result.summary : envelope?.next_action || stopReason };
  }
}

async function runGitCloseout({ adapter, projectRoot, threadKey, threadId, checkpoint, deliveryPolicy, options }) {
  if (checkpoint.phase !== 'closeout' || !checkpoint.case_id) throw new Error('Git delivery requires an accepted bound Case completion.');
  const prompt = ["Complete the explicitly authorized local Git delivery for this task in the current conversation.", '', JSON.stringify({
    schema_version: 'arcorbit-git-delivery-request/v1', phase: 'task_closeout',
    original_user_input: options.runtimeContext?.original_task || options.originalTask || options.task || '',
    current_instruction: options.task || '',
    task_context: { ...options.runtimeContext, authoritative_case_id: checkpoint.case_id,
      trusted_ledger_changed_files: checkpoint.trusted_ledger_changed_files },
    case_completion: 'trusted_ledger_accepted',
    delivery_contract: {
      scope: 'Commit the reviewed work belonging to this authorized task on the current branch. Preserve unrelated staged and unstaged changes. Trusted Ledger paths are evidence, not an exhaustive allowlist. Local commit authorization does not authorize push, tags or branch changes.',
      completion: 'Report completed with outcome committed and the actual commit hash, or no_changes when the task work is already committed or has no remaining diff.',
      continuation: 'Do not add content changes or another semantic review during delivery. If concrete evidence reveals substantive unfinished work, return resume_loop with a nonempty summary and evidence; Automation will resume the normal fresh-read Loop in this same thread.',
      responsibility: 'Respect current user instructions and any stop request. Report stopped for a requested stop, needs_human only for a required human decision, external_wait for a concrete external dependency, and failed for an actual technical error. Include the relevant evidence and recovery condition; authorized Agent work does not become human responsibility merely because delivery has started.'
    },
    execution_authorization: { workspace_root: projectRoot, git_commit_allowed: deliveryPolicy.commit_authorized },
    output_contract: TASK_CLOSEOUT_VERSION
  }, null, 2)].join('\n');
  let result = null;
  for await (const event of adapter.runTurn({ projectRoot, prompt, options: { ...options,
    threadKey, threadId, resultKind: 'task-closeout-result', outputSchema: taskCloseoutOutputSchema(), lifecycleCostCenter: 'closeout' } })) {
    if (options.streamEvents) console.error(JSON.stringify({ event }));
    if (event.type === 'runtime.task_closeout_result') result = event.result;
  }
  return isTaskCloseoutResult(result) ? result : invalidTaskCloseoutResult('Missing or invalid structured closeout result.');
}
