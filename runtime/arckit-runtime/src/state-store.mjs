import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export function createStateStore(projectRoot) {
  const root = resolve(projectRoot);

  return {
    root,
    async readSnapshot() {
      const projectStatePath = join(root, "arckit/project/state.record.json");
      if (!existsSync(projectStatePath)) {
        throw new Error(`Missing project state record: ${projectStatePath}`);
      }

      const projectState = await readJson(projectStatePath);
      const stateBrief = await readTextIfExists(join(root, "arckit/project/STATE.md"));
      const iterationRecord = projectState.active_iteration_ref
        ? await readJsonIfExists(join(root, projectState.active_iteration_ref))
        : null;
      const casesIndex = await readTextIfExists(join(root, "arckit/cases/INDEX.md"));
      const pendingIndex = await readTextIfExists(join(root, "arckit/pending/INDEX.md"));
      const techIndex = await readTextIfExists(join(root, "arckit/tech/INDEX.md"));
      const specIndex = await readTextIfExists(join(root, "arckit/spec/INDEX.md"));

      return {
        projectRoot: root,
        paths: {
          projectState: "arckit/project/state.record.json",
          stateBrief: "arckit/project/STATE.md",
          activeIteration: projectState.active_iteration_ref || "",
          casesIndex: "arckit/cases/INDEX.md",
          pendingIndex: "arckit/pending/INDEX.md",
          specIndex: "arckit/spec/INDEX.md",
          techIndex: "arckit/tech/INDEX.md"
        },
        projectState,
        stateBrief,
        iterationRecord,
        casesIndex,
        pendingIndex,
        specIndex,
        techIndex,
        summary: summarize(projectState, iterationRecord)
      };
    }
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readJsonIfExists(path) {
  if (!existsSync(path)) {
    return null;
  }
  return readJson(path);
}

async function readTextIfExists(path) {
  if (!existsSync(path)) {
    return "";
  }
  return readFile(path, "utf8");
}

function summarize(projectState, iterationRecord) {
  const gaps = Array.isArray(projectState.state_gaps) ? projectState.state_gaps : [];
  const topGap = gaps[0];
  return {
    project_name: projectState.project?.name || "",
    project_status: projectState.project?.status || "",
    current_phase: projectState.project?.current_phase || "",
    active_iteration: iterationRecord?.id || "",
    loop_focus: projectState.loop_control?.current_loop_focus || "",
    next_transition: projectState.loop_control?.next_transition || "",
    top_gap: topGap?.id || "",
    top_gap_dimension: topGap?.dimension || ""
  };
}
