import { readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// Host-owned observations, separate from canonical Project/Case facts. Restarts
// retain protocol retry guards. Agent progress claims are observations only.
export function executionProgress(controlFile) {
  const path = controlFile ? `${controlFile}.progress.json` : null;
  let state = { version: 2, round_count: 0, snapshot_replan_attempts: 0, repair_attempts: 0, blocked_reason: '', recent_rounds: [] };
  if (path) {
    try { state = JSON.parse(readFileSync(path, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (state.version === 1) {
      // Retire the semantic guard while retaining history and real protocol failures.
      state.version = 2;
      state.snapshot_replan_attempts = 0;
      delete state.no_progress_rounds;
      if (state.blocked_reason === 'no_progress_limit') state.blocked_reason = '';
    }
    if (state.version !== 2 || !Array.isArray(state.recent_rounds)
      || !['round_count', 'snapshot_replan_attempts', 'repair_attempts'].every(key => Number.isSafeInteger(state[key]) && state[key] >= 0)) {
      throw new Error('Invalid execution progress record; operator review is required.');
    }
  }
  function save() {
    if (!path) return;
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 });
    renameSync(temporary, path);
  }
  return {
    snapshot: () => structuredClone(state),
    assertContinuable() {
      if (!state.blocked_reason) return;
      const error = new Error(`Execution requires operator review before continuing: ${state.blocked_reason}`);
      error.code = 'ARCORBIT_PROGRESS_REVIEW_REQUIRED';
      throw error;
    },
    record(round, decision) {
      state.round_count += 1;
      if (round.validation_valid && (round.ledger_written || ['agent_continuation', 'human_intervention', 'external_wait', 'completed', 'stopped'].includes(decision.reason))) {
        state.repair_attempts = 0;
        state.snapshot_replan_attempts = 0;
      }
      if (decision.reason === 'agent_repair') state.repair_attempts += 1;
      if (decision.reason === 'fresh_replan') state.snapshot_replan_attempts += 1;
      if (['snapshot_stale_limit', 'agent_repair_limit'].includes(decision.reason)) state.blocked_reason = decision.reason;
      state.recent_rounds.push({ ...round, sequence: state.round_count, continuation: decision, observed_at: new Date().toISOString() });
      state.recent_rounds = state.recent_rounds.slice(-16);
      save();
      return structuredClone(state);
    },
    authorizeRecovery() {
      state.snapshot_replan_attempts = 0;
      state.repair_attempts = 0;
      state.blocked_reason = '';
      state.recovery_authorized_at = new Date().toISOString();
      save();
    }
  };
}
