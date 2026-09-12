export const TASK_CLOSEOUT_VERSION = 'arckit-task-closeout-result/v2';
const VERSION = TASK_CLOSEOUT_VERSION;
const STATUSES = ['completed', 'resume_loop', 'stopped', 'needs_human', 'external_wait', 'failed'];

export function isTaskCloseoutSchemaVersion(version) {
  return version === VERSION || version === 'arckit-task-closeout-result/v1';
}

export function taskCloseoutOutputSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['schema_version', 'status', 'outcome', 'summary', 'evidence', 'commit_hash', 'error'],
    properties: {
      schema_version: { type: 'string', const: VERSION },
      status: { type: 'string', enum: STATUSES },
      outcome: { type: 'string', enum: ['committed', 'no_changes', 'none'] },
      summary: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } },
      commit_hash: { type: 'string' }, error: { type: 'string' },
    },
  };
}

export function isTaskCloseoutResult(value) {
  const legacy = value?.schema_version === 'arckit-task-closeout-result/v1';
  return isTaskCloseoutSchemaVersion(value?.schema_version)
    && (legacy ? ['completed', 'needs_human', 'failed'] : STATUSES).includes(value.status)
    && ['committed', 'no_changes', 'none'].includes(value.outcome)
    && typeof value.summary === 'string' && Array.isArray(value.evidence)
    && value.evidence.every((item) => typeof item === 'string')
    && typeof value.commit_hash === 'string' && typeof value.error === 'string'
    && (legacy || value.status !== 'completed' || (value.outcome !== 'none' && (value.outcome !== 'committed' || value.commit_hash.trim().length > 0)))
    && (value.status !== 'resume_loop' || (value.outcome === 'none' && value.summary.trim().length > 0 && value.evidence.some((ref) => ref.trim())));
}

export function invalidTaskCloseoutResult(message) {
  return { schema_version: VERSION, status: 'failed', outcome: 'none', summary: 'Task closeout failed.',
    evidence: [], commit_hash: '', error: String(message || 'unknown_closeout_error') };
}

export function selectTaskCloseoutResult({ result, activity } = {}) {
  const checkpoint = result?.execution_checkpoint || activity?.execution_checkpoint;
  if (checkpoint?.phase === 'loop') return null;
  const candidates = [result?.closeout_result, checkpoint?.closeout_result, activity?.closeout_result,
    ...[...(activity?.messages || [])].reverse().map((message) => message?.structured_data?.value)];
  return candidates.find(isTaskCloseoutResult) || null;
}

export function taskCloseoutHandoff(result) {
  if (!isTaskCloseoutResult(result)) return null;
  const responsibility = { needs_human: 'human', external_wait: 'external', resume_loop: 'agent' }[result.status] || 'none';
  return {
    version: 'loop-handoff/v2', status: result.status, next_responsibility: responsibility,
    human_decision_required: responsibility === 'human', agent_continuation_available: responsibility === 'agent',
    responsibility_reason: result.error || result.summary, next_prompt: result.summary,
    human_gate: { required: responsibility === 'human', decision_needed: result.summary }
  };
}

export function taskCloseoutMessageStatus(result) {
  return result?.status === 'failed' ? 'failed' : result?.status === 'completed' ? 'completed' : 'paused';
}

export function taskCloseoutStopReason(result) {
  return { completed: 'completed', stopped: 'stopped', needs_human: 'human_intervention',
    external_wait: 'external_wait', resume_loop: '' }[result?.status] ?? 'closeout_failed';
}
