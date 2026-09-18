import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAutomationCoordinator } from "../../src/automation-coordinator.mjs";
import { createPlatformCoordinator } from "../../src/platform-coordinator.mjs";

export async function createTodayAcceptanceState() {
  const scratch = await mkdtemp(join(tmpdir(), "arckit-today-acceptance-"));
  const storeFile = join(scratch, "store.json");
  const projects = [{ id: "11", name: "Synthetic project", current_user_id: "7" }, { id: "12", name: "Other project", current_user_id: "7" }];
  const tasks = [
    { id: "W-COMPLETED", project_id: "11", content: "Ready for acceptance check", executor_id: "7", state: "completed" },
    { id: "W-OTHER", project_id: "11", content: "Another completed task", executor_id: "7", state: "completed" },
    { id: "W-COMPLETED", project_id: "12", content: "Same ID, other project", executor_id: "7", state: "completed" }
  ];
  const projection = { projects, project_catalog: projects, tasks, tags: [], errors: [], user: { id: "7" }, source_status: "healthy" };
  let store = {
    projects: [{ id: "local-11", path: scratch, name: "Synthetic local" }], settings: { task_source: {} },
    platform: { active_workset_id: "w", worksets: [{ id: "w", name: "Today members", project_ids: ["11", "12"] }], today_project_ids: ["11"], ui_preferences: {}, workspace_preferences: {} },
    automation: {
      enabled: true, queue_paused: true, project_bindings: { "11": "local-11" }, project_participation: { "11": true },
      snapshot: structuredClone(projection), active_task: null, active_executions: {}, attention_items: [], recovery_items: [], acceptance_feedback_items: [],
      recent_completions: [{ task_id: "W-COMPLETED", project_id: "11", run_id: "RUN-OLD", case_id: "CASE-20260904-001", thread_id: "THREAD-SYNTHETIC", local_project_id: "local-11", session_id: "SESSION-SYNTHETIC", completed_at: "2026-09-04T00:00:00Z" }]
    }
  };
  await writeFile(storeFile, JSON.stringify(store));
  const messages = [];
  let storeUpdate = Promise.resolve();
  const runManager = {
    onEvent() { return () => {}; },
    async readDesktopStore() { return JSON.parse(await readFile(storeFile, "utf8")); },
    updateDesktopStore(updater) {
      const pending = storeUpdate.then(async () => {
        store = await runManager.readDesktopStore();
        store = await updater(store) || store;
        await writeFile(storeFile, JSON.stringify(store));
        return structuredClone(store);
      });
      storeUpdate = pending.catch(() => {});
      return pending;
    },
    async listProjects() { return store.projects; }, async listRuns() { return []; },
    async listSessions() { return []; }, async listProjectCaseStates() { return []; }, isRunActive() { return false; },
    async listMessages() { return messages; },
    async addMessage(_id, message) { const entry = { id: `MSG-${messages.length + 1}`, ...message }; messages.push(entry); return entry; },
    async startRun() { throw new Error("Test must not start a real Agent run"); }
  };
  const automation = createAutomationCoordinator({ runManager });
  const platform = createPlatformCoordinator({ runManager, automationCoordinator: automation,
    workSync: { async getSnapshot() { return structuredClone(projection); } },
    platformSource: { async listOrganizations() { return []; }, async listProjects() { return projects; }, async listProjectMembers() { return []; }, async listFeedbackV1() { return []; } }
  });
  return { automation, platform, runManager, messages, projection,
    async dispose() { automation.dispose(); await rm(scratch, { recursive: true, force: true }); }
  };
}
