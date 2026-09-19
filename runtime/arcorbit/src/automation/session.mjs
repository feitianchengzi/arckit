import { writePromptContext } from "../prompt-compiler.mjs";
import { executionControlPath, createExecutionControl } from "../kernel/execution-control.mjs";
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
  if (!options.dryRun && !(options.agentAdapter || dependencies.createAdapter)) {
    options = { ...options, executionControlFile: executionControlPath(projectRoot, options) };
    createExecutionControl(options.executionControlFile).assertRunning();
  }
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
        const { execution_checkpoint, closeout_only, delivery_policy, ...context } = executionRuntimeContext(options.runtimeContext, checkpoint);
        envelope = await runStateDrivenSession({ projectRoot, stateStore, dependencies, agentAdapter: adapter, threadState,
          options: { ...options, automationLoop: true, threadId, roundIndexOffset: rounds.length,
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
  const contextPath = await writePromptContext({
    current_instruction: options.task || "",
    task_context: options.runtimeContext, authoritative_case_id: checkpoint.case_id,
    trusted_ledger_changed_files: checkpoint.trusted_ledger_changed_files,
    execution_checkpoint: checkpoint
  });
  const prompt = [
    'Phase: task_closeout. Complete the explicitly authorized final local Git delivery in this same conversation.',
    `Original task: ${options.runtimeContext?.original_task || options.originalTask || options.task || ''}`,
    `Read the delivery context and accepted Case evidence at ${contextPath}.`,
    'The trusted Ledger has accepted the bound Case. Confirm the accepted work covers the original task before committing.',
    'Create one final commit for the reviewed task work on the current branch. Preserve unrelated staged and unstaged changes. Ledger paths are evidence, not an exhaustive allowlist. Do not push, tag or change branches.',
    'Do not add content changes or another semantic review here. If concrete evidence shows unfinished original-task work, return resume_loop with evidence before committing. Independent new issues are hints, not authorization to resume work.',
    'Return completed with outcome committed and the actual commit hash, or no_changes if already committed or no task diff remains. Respect user stop.',
    `Output contract: ${TASK_CLOSEOUT_VERSION}. Git commit authorized: ${deliveryPolicy.commit_authorized}.`
  ].join('\n');
  let result = null;
  for await (const event of adapter.runTurn({ projectRoot, prompt, options: { ...options,
    threadKey, threadId, resultKind: 'task-closeout-result', outputSchema: taskCloseoutOutputSchema(), lifecycleCostCenter: 'closeout' } })) {
    if (options.streamEvents) console.error(JSON.stringify({ event }));
    if (event.type === 'runtime.task_closeout_result') result = event.result;
  }
  return isTaskCloseoutResult(result) ? result : invalidTaskCloseoutResult('Missing or invalid structured closeout result.');
}
