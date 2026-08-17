import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadRuntimeCapabilityForEntrypoint } from './capability-registry.mjs';
import { runLedgerScript } from './ledger-scripts.mjs';

export function createStateStore(projectRoot) {
  const root = resolve(projectRoot);
  let snapshotCapabilityPromise = null;
  return {
    root,
    async readSnapshot({ afterCommitToken = '' } = {}) {
      snapshotCapabilityPromise ||= loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: 'loop_snapshot' });
      const args = ['loop-snapshot.mjs', 'read'];
      if (afterCommitToken) args.push('--after-commit', afterCommitToken);
      const snapshotResult = await runLedgerScript(root, args, {
        capability: await snapshotCapabilityPromise,
      });
      const receipt = JSON.parse(snapshotResult.stdout);
      const projectState = receipt.canonical?.project_state || {};
      const activeCases = receipt.canonical?.active_cases || [];
      const iterationRecord = receipt.canonical?.iteration_record || null;
      const activeCaseRefs = receipt.paths?.active_cases || [];
      const documents = await Promise.all([
        readTextIfExists(join(root, 'arckit/project/STATE.md')),
        readTextIfExists(join(root, 'arckit/cases/INDEX.md')),
        readTextIfExists(join(root, 'arckit/spec/INDEX.md')),
        readTextIfExists(join(root, 'arckit/interaction/INDEX.md')),
        readTextIfExists(join(root, 'arckit/visual/INDEX.md')),
        readTextIfExists(join(root, 'arckit/tech/INDEX.md')),
      ]);
      const [stateBrief, casesIndex, specIndex, interactionIndex, visualIndex, techIndex] = documents;

      return {
        projectRoot: root,
        ledgerSnapshot: receipt,
        snapshotToken: receipt.snapshot_token,
        candidateCatalog: receipt.candidate_catalog,
        paths: {
          projectState: receipt.paths?.project_state || 'arckit/project/state.record.json',
          stateBrief: receipt.paths?.state_brief || 'arckit/project/STATE.md',
          activeIteration: receipt.paths?.active_iteration || '',
          activeCases: activeCaseRefs,
          casesIndex: receipt.paths?.cases_index || 'arckit/cases/INDEX.md',
          specIndex: receipt.paths?.spec_index || 'arckit/spec/INDEX.md',
          interactionIndex: receipt.paths?.interaction_index || 'arckit/interaction/INDEX.md',
          visualIndex: receipt.paths?.visual_index || 'arckit/visual/INDEX.md',
          techIndex: receipt.paths?.tech_index || 'arckit/tech/INDEX.md',
        },
        projectState,
        stateBrief,
        iterationRecord,
        activeCases,
        casesIndex,
        specIndex,
        interactionIndex,
        visualIndex,
        techIndex,
        stateAvailability: receipt.state_availability,
        compatibility: receipt.compatibility?.status === 'compatible' ? null : receipt.compatibility,
        summary: receipt.state_availability === 'available'
          ? summarize(projectState, iterationRecord, activeCases)
          : recoverySummary(projectState),
      };
    },
  };
}

async function readTextIfExists(file) {
  return existsSync(file) ? readFile(file, 'utf8') : '';
}

function recoverySummary(projectState) {
  return { project_name: projectState?.project?.name || '', project_status: projectState?.project?.status || '', current_phase: 'protocol_recovery', active_iteration: '', next_case_intent: '', active_case_count: 0, project_gap_count: 0 };
}

function summarize(projectState, iterationRecord, activeCases) {
  const gaps = Array.isArray(projectState.advancement?.project_gaps) ? projectState.advancement.project_gaps : [];
  return {
    project_name: projectState.project?.name || '',
    project_status: projectState.project?.status || '',
    current_phase: projectState.advancement?.selection_context?.current_focus || '',
    active_iteration: iterationRecord?.id || '',
    next_case_intent: projectState.advancement?.selection_context?.current_focus || '',
    active_case_count: activeCases.length,
    project_gap_count: gaps.length,
  };
}
