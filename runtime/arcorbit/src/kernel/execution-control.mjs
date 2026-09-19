import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';

// Execution stop is independent of Agent output and canonical Case completion.
export function executionControlPath(projectRoot, options = {}) {
  if (options.executionControlFile || process.env.ARCORBIT_EXECUTION_CONTROL_FILE) return options.executionControlFile || process.env.ARCORBIT_EXECUTION_CONTROL_FILE;
  const identity = options.taskId || options.threadId || options.originalTask || options.task;
  if (!identity) throw new Error('A persistent task identity is required for execution supervision.');
  const key = createHash('sha256').update(`${projectRoot}\n${identity}`).digest('hex');
  return options.threadBindingFile ? `${options.threadBindingFile}.control.json` : join(homedir(), '.arcorbit', 'execution-controls', `${key}.json`);
}
export function executionStopError() {
  const error = new Error('Execution stopped by operator.');
  error.code = 'ARCORBIT_EXECUTION_STOPPED';
  error.reason = 'operator_stop';
  return error;
}
export function requestExecutionStop(path) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify({ requested_at: new Date().toISOString() }), { mode: 0o600 });
  renameSync(temporary, `${path}.stop`);
}
export function createExecutionControl(path) {
  return { assertRunning() { if (existsSync(`${path}.stop`)) throw executionStopError(); } };
}
