import assert from "node:assert/strict";
import test from "node:test";
import { deriveProjectConfiguration, deriveTodayWorkspace } from "../src/desktop/today-workspace.mjs";

function project(id, input = {}) {
  return { id, name: `Project ${id}`, current_user_id: "me", source_status: "healthy", ...input };
}

test("project configuration contains only the four Automation execution prerequisites", () => {
  const configuration = deriveProjectConfiguration(project("p1", { local_project_id: "local-1", participating: true }), { setup: { status: "ready" } });
  assert.equal(configuration.ready, true);
  assert.deepEqual(configuration.steps.map((step) => step.id), ["project_access", "local_workspace", "project_setup", "project_participation"]);
  assert.equal(configuration.steps.some((step) => ["work_qualification", "global_automation", "queue"].includes(step.id)), false);
});

test("configuration exposes exactly one current blocker per project", () => {
  assert.equal(deriveProjectConfiguration(project("p1"), { setup: { status: "ready" } }).blocker.code, "local_workspace_missing");
  assert.equal(deriveProjectConfiguration(project("p1", { local_project_id: "l1" }), { setup: { status: "checking" } }).blocker.code, "setup_checking");
  assert.equal(deriveProjectConfiguration(project("p1", { local_project_id: "l1" }), { setup: { status: "conflict" } }).blocker.code, "setup_action_required");
  assert.equal(deriveProjectConfiguration(project("p1", { local_project_id: "l1" }), { setup: { status: "ready" } }).blocker.code, "participation_disabled");
});

test("workspace defaults a newcomer to configuration and keeps parallel project states", () => {
  const view = deriveTodayWorkspace({
    platform: { projects: [project("a"), project("b", { local_project_id: "lb", participating: true }), project("c", { local_project_id: "lc" })] },
    setup: { status: "ready" },
    setupByProject: { c: { status: "checking" } }
  });
  assert.equal(view.mode, "configuration");
  assert.deepEqual(view.configurations.map((item) => [item.project_id, item.configuration.blocker.code]), [
    ["a", "local_workspace_missing"],
    ["c", "setup_checking"]
  ]);
  assert.equal(view.projects.find((item) => item.id === "b").configuration.ready, true);
  assert.equal(view.non_human_summary.ready_projects, 1);
});

test("Today scope starts empty, adds multiple projects independently, and never hides an unselected human responsibility", () => {
  const empty = deriveTodayWorkspace({
    platform: { today_project_ids: [], projects: [project("a"), project("b")] },
    setup: { status: "ready" }
  });
  assert.deepEqual(empty.projects, []);
  assert.equal(empty.mode, "configuration");

  const parallel = deriveTodayWorkspace({
    selectedMode: "configuration",
    platform: {
      today_project_ids: ["a", "b"],
      projects: [project("a"), project("b", { local_project_id: "lb", participating: true }), project("c", { local_project_id: "lc", participating: true })],
      today_tasks: [{ id: "c-review", project_id: "c", executor_id: "me", state: "pending_review" }]
    },
    setup: { status: "ready" }
  });
  assert.deepEqual(parallel.projects.map((item) => item.id).sort(), ["a", "b", "c"]);
  assert.deepEqual(parallel.configurations.map((item) => item.project_id), ["a"]);
  assert.equal(parallel.projects.find((item) => item.id === "b").configuration.ready, true);
  assert.equal(parallel.projects.find((item) => item.id === "c").in_today_scope, false);
  assert.equal(parallel.counts.configured_projects, 2);
  assert.equal(parallel.counts.configuration_incomplete, 1);
  assert.equal(parallel.non_human_summary.ready_projects, 1);
  assert.equal(parallel.interventions[0].project_id, "c");
});

test("workspace aggregates explicit human responsibilities and excludes routine pending work", () => {
  const view = deriveTodayWorkspace({
    selectedMode: "intervention",
    platform: {
      projects: [project("p1", { local_project_id: "l1", participating: true })],
      tasks: [
        { id: "routine", project_id: "p1", executor_id: "me", state: "pending", content: "Routine work" },
        { id: "review", project_id: "p1", executor_id: "me", state: "pending_review", content: "Needs confirmation" },
        { id: "someone-else", project_id: "p1", executor_id: "other", state: "pending_review", content: "Not my responsibility" },
        { id: "unassigned", project_id: "p1", executor_id: "", state: "pending_review", content: "No explicit responsibility" },
        { id: "accepted", project_id: "p1", executor_id: "me", state: "accepted", content: "History" }
      ]
    },
    setup: { status: "ready" },
    automation: {
      attention_items: [{ id: "decision", project_id: "p1", task_id: "t1", question: "Choose a scope", actions: ["submit_intervention"] }],
      recovery_items: []
    }
  });
  assert.deepEqual(view.interventions.map((item) => item.kind), ["automation_attention", "work_pending_review"]);
  assert.equal(JSON.stringify(view).includes("Routine work"), false);
  assert.equal(JSON.stringify(view).includes("History"), false);
  assert.equal(JSON.stringify(view).includes("Not my responsibility"), false);
  assert.equal(JSON.stringify(view).includes("No explicit responsibility"), false);
});

test("workspace combines Chat, Automation, Work and Feedback actions with typed contracts", () => {
  const view = deriveTodayWorkspace({
    selectedMode: "intervention",
    platform: {
      projects: [project("p1", { local_project_id: "l1", participating: true })],
      task_replacements: [{ id: "p1:old", status: "source_delete_failed", source_project_id: "p1", source_task_id: "old", target_project_id: "p2", target_task_id: "new" }],
      tasks: [
        { id: "done", project_id: "p1", executor_id: "me", state: "completed" },
        { id: "blocked", project_id: "p1", executor_id: "me", state: "blocked", blocked_reason: "Missing input" }
      ]
    },
    setup: { status: "ready" },
    chat: {
      sessions: [{ id: "s1", project_id: "p1", title: "Implement" }],
      pending_approvals: [{ id: "m1", session_id: "s1", approval_request_id: "approve-1", content: "Write src/app.js" }]
    },
    automation: { recovery_items: [{ id: "r1", project_id: "p1", task_id: "t1", type: "runtime_incomplete", actions: ["retry_start", "feedback_continue"] }] },
    feedbackLinkRecoveries: { f1: { project_id: "p1", task_id: "new-task" } }
  });
  assert.deepEqual(view.interventions.map((item) => item.kind), [
    "chat_approval",
    "automation_recovery",
    "feedback_link_recovery",
    "work_replacement_recovery",
    "work_completed",
    "work_blocked"
  ]);
  assert.deepEqual(view.interventions[0].actions, ["allow_once", "decline_and_continue"]);
  assert.deepEqual(view.interventions[2].actions, ["retry_feedback_link"]);
  assert.deepEqual(view.interventions[3].actions, ["retry_task_replacement", "keep_task_replacement"]);
});

test("completed Work responsibility preserves acceptance issue text, status, progress, and selection", () => {
  const view = deriveTodayWorkspace({
    selectedMode: "intervention",
    selectedItemId: "work:done:completed",
    platform: {
      projects: [project("p1", { local_project_id: "l1", participating: true })],
      tasks: [{
        id: "done",
        project_id: "p1",
        executor_id: "me",
        state: "completed",
        acceptance_feedback_items: [{
          feedback_id: "ISSUE-23",
          original_feedback: "恢复后输入焦点丢失",
          status: "running",
          progress: "正在修复焦点恢复"
        }]
      }]
    },
    setup: { status: "ready" }
  });

  assert.equal(view.selected_item_id, "work:done:completed");
  assert.deepEqual(view.selected_item.acceptance_feedback_items, [{
    feedback_id: "ISSUE-23",
    original_feedback: "恢复后输入焦点丢失",
    status: "running",
    progress: "正在修复焦点恢复"
  }]);
});

test("project scope filters the lists without changing global Today counts", () => {
  const view = deriveTodayWorkspace({
    selectedMode: "intervention",
    selectedProjectId: "b",
    platform: {
      projects: [project("a", { local_project_id: "la", participating: true }), project("b", { local_project_id: "lb", participating: true })],
      tasks: [
        { id: "a1", project_id: "a", executor_id: "me", state: "pending_review" },
        { id: "b1", project_id: "b", executor_id: "me", state: "pending_review" }
      ]
    },
    setup: { status: "ready" }
  });
  assert.deepEqual(view.interventions.map((item) => item.project_id), ["b"]);
  assert.equal(view.counts.responsibilities, 2);
});

test("automatic recovery and running state stay in the minimal non-human summary", () => {
  const view = deriveTodayWorkspace({
    selectedMode: "intervention",
    platform: { projects: [project("a", { local_project_id: "la", participating: true }), project("b", { local_project_id: "lb", participating: true })] },
    setup: { status: "ready" },
    automation: {
      active_executions: [{ execution_id: "e1", project_id: "a" }],
      recovery_items: [{ id: "r1", project_id: "b", responsibility: "automation", type: "safe_stop_requested" }]
    }
  });
  assert.equal(view.interventions.length, 0);
  assert.deepEqual(view.non_human_summary, { ready_projects: 2, running_projects: 1, automatic_recovery_projects: 1, unknown_sources: [] });
});

test("selection is preserved while valid and falls to the adjacent first item after source removal", () => {
  const input = {
    selectedMode: "intervention",
    platform: {
      projects: [project("p1", { local_project_id: "l1", participating: true })],
      tasks: [
        { id: "one", project_id: "p1", executor_id: "me", state: "pending_review", created_at: "2026-01-01T00:00:00Z" },
        { id: "two", project_id: "p1", executor_id: "me", state: "blocked", created_at: "2026-01-02T00:00:00Z" }
      ]
    },
    setup: { status: "ready" },
    selectedItemId: "work:two:blocked"
  };
  assert.equal(deriveTodayWorkspace(input).selected_item_id, "work:two:blocked");
  input.platform.tasks = input.platform.tasks.filter((task) => task.id !== "two");
  assert.equal(deriveTodayWorkspace(input).selected_item_id, "work:one:pending_review");
});
