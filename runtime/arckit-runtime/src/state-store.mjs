import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export function createStateStore(projectRoot) {
  const root = resolve(projectRoot);
  return {
    root,
    async readSnapshot() {
      const projectStatePath = join(root, 'arckit/project/state.record.json');
      if (!existsSync(projectStatePath)) throw new Error(`Missing project state record: ${projectStatePath}`);
      const projectState = await readJson(projectStatePath);
      if (projectState.schema_version !== 'project-state-record/v5') throw new Error('Runtime requires project-state-record/v5');

      const activeCaseRefs = Array.isArray(projectState.advancement?.active_case_refs) ? projectState.advancement.active_case_refs : [];
      const activeCases = [];
      for (const ref of activeCaseRefs) {
        const record = await readCaseRecordIfExists(join(root, ref));
        if (!record) throw new Error(`Active Case ref cannot be read: ${ref}`);
        if (record.schema_version !== 'development-case-record/v5') throw new Error(`Runtime requires development-case-record/v5: ${ref}`);
        activeCases.push({ ref, record });
      }

      const iterationRecord = projectState.advancement.active_iteration_ref
        ? await readJsonIfExists(join(root, projectState.advancement.active_iteration_ref))
        : null;
      if (iterationRecord && iterationRecord.schema_version !== 'iteration-state-record/v3') {
        throw new Error(`Runtime requires iteration-state-record/v3: ${projectState.advancement.active_iteration_ref}`);
      }
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
        paths: {
          projectState: 'arckit/project/state.record.json',
          stateBrief: 'arckit/project/STATE.md',
          activeIteration: projectState.advancement.active_iteration_ref || '',
          activeCases: activeCaseRefs,
          casesIndex: 'arckit/cases/INDEX.md',
          specIndex: 'arckit/spec/INDEX.md',
          interactionIndex: 'arckit/interaction/INDEX.md',
          visualIndex: 'arckit/visual/INDEX.md',
          techIndex: 'arckit/tech/INDEX.md',
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
        summary: summarize(projectState, iterationRecord, activeCases),
      };
    },
  };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function readJsonIfExists(file) {
  return existsSync(file) ? readJson(file) : null;
}

async function readTextIfExists(file) {
  return existsSync(file) ? readFile(file, 'utf8') : '';
}

async function readCaseRecordIfExists(file) {
  if (!existsSync(file)) return null;
  const text = await readFile(file, 'utf8');
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`${file}: missing Structured Record json block`);
  return JSON.parse(match[1]);
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
