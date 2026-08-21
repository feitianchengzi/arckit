import { resolve } from "node:path";

export function desktopSetupCheckInput(store = {}, input = {}) {
  const projectId = String(input?.projectId || "").trim();
  if (!projectId) return undefined;

  const projects = Array.isArray(store.projects) ? store.projects : [];
  const selectedProject = projects.find((project) => String(project?.id || "") === projectId);
  if (!selectedProject?.path) {
    throw new Error(`Unknown local Product Workspace: ${projectId}`);
  }

  const projectRoot = [...new Set(projects
    .map((project) => String(project?.path || "").trim())
    .filter(Boolean)
    .map((projectPath) => resolve(projectPath)))]
    .sort();

  return { projectRoot };
}

export async function checkDesktopSetupReadiness({ input, readDesktopStore, check }) {
  if (typeof check !== "function") throw new TypeError("A Setup Readiness check function is required.");
  if (!input?.projectId) return check();
  if (typeof readDesktopStore !== "function") throw new TypeError("A Desktop Store reader is required for project-scoped Setup Readiness.");

  const store = await readDesktopStore();
  return check(desktopSetupCheckInput(store, input));
}
