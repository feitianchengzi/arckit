import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  deriveAutomationGuidance,
  deriveReadinessSteps,
  deriveTaskExecutorAutomationHelp,
  deriveTodayGuidance,
  deriveWorkEligibilityGuidance,
  isCurrentProjectUser
} from "../src/desktop/today-guidance.mjs";

const ownerWorkspace = (overrides = {}) => ({
  id: "p1",
  name: "ArcOrbit",
  current_user_id: "u1",
  current_user_role: "owner",
  local_project_id: "local-1",
  local_project_path: "/workspace",
  participating: true,
  source_status: "healthy",
  ...overrides
});

const platform = (workspace = ownerWorkspace(), overrides = {}) => ({
  source_status: "healthy",
  user: { id: "u1", username: "Glare" },
  product_workspaces: workspace ? [workspace] : [],
  errors: [],
  ...overrides
});

const automation = (tasks = [], overrides = {}) => ({
  source_status: "healthy",
  enabled: true,
  queue_paused: false,
  tasks,
  queue: tasks.filter((task) => task.state === "pending"),
  blocked_pending_tasks: [],
  attention_items: [],
  recovery_items: [],
  active_executions: [],
  ...overrides
});

test("Today derives the formal first-run progression without persisted onboarding state", () => {
  const setup = { status: "ready" };
  assert.equal(deriveTodayGuidance({ platform: platform(null), automation: automation(), setup, authentication: { authenticated: true } }).kind, "select_project");
  assert.equal(deriveTodayGuidance({ platform: platform(ownerWorkspace({ local_project_id: "", local_project_path: "" })), automation: automation(), setup, authentication: { authenticated: true } }).kind, "bind_workspace");
  assert.equal(deriveTodayGuidance({ platform: platform(), automation: automation(), setup: { status: "codex-action-required" }, authentication: { authenticated: true } }).kind, "project_setup");
  assert.equal(deriveTodayGuidance({ platform: platform(ownerWorkspace({ participating: false })), automation: automation(), setup, authentication: { authenticated: true } }).kind, "enable_project");
  assert.equal(deriveTodayGuidance({ platform: platform(), automation: automation([{ id: "t1", project_id: "p1", executor_id: "u1", state: "pending_review" }]), setup, authentication: { authenticated: true } }).kind, "review_task");
  assert.equal(deriveTodayGuidance({ platform: platform(), automation: automation(), setup, authentication: { authenticated: true } }).kind, "create_task");
  assert.equal(deriveTodayGuidance({ platform: platform(), automation: automation([{ id: "t1", project_id: "p1", executor_id: "u1", state: "pending" }], { enabled: false }), setup, authentication: { authenticated: true } }).kind, "enable_automation");
});

test("Today prioritizes human and completion responsibilities before preparation", () => {
  const incomplete = platform(ownerWorkspace({ local_project_id: "", local_project_path: "", participating: false }));
  const setup = { status: "ready" };
  assert.equal(deriveTodayGuidance({ platform: incomplete, automation: automation([], { recovery_items: [{ type: "runtime_incomplete", message: "Recover" }] }), setup, authentication: { authenticated: true } }).kind, "human_attention");
  assert.equal(deriveTodayGuidance({ platform: incomplete, automation: automation([{ id: "done", project_id: "p1", executor_id: "u1", state: "completed" }]), setup, authentication: { authenticated: true } }).kind, "completion_review");
});

test("Today resolves current task ownership per Product Workspace instead of the global login identity", () => {
  const workspaces = [
    ownerWorkspace({ id: "p1", current_user_id: "7" }),
    ownerWorkspace({ id: "p2", current_user_id: "8", local_project_id: "local-2" })
  ];
  const tasks = [
    { id: "mine-p1", project_id: "p1", executor_id: "7", state: "pending" },
    { id: "other-p2", project_id: "p2", executor_id: "7", state: "pending" }
  ];
  const uuidPlatform = platform(null, {
    user: { id: "8f14e45f-ea7f-4d31-9f15-0c9f8a7b6c5d", username: "Glare" },
    product_workspaces: workspaces
  });
  const guidance = deriveTodayGuidance({
    platform: uuidPlatform,
    automation: automation(tasks, { enabled: false }),
    setup: { status: "ready" },
    authentication: { authenticated: true }
  });
  assert.equal(guidance.kind, "create_task");
  assert.equal(guidance.workspace.id, "p2");

  const selectedProjectGuidance = deriveTodayGuidance({
    platform: uuidPlatform,
    automation: automation(tasks, { enabled: false }),
    setup: { status: "ready" },
    authentication: { authenticated: true },
    selectedProjectId: "p1"
  });
  assert.equal(selectedProjectGuidance.kind, "enable_automation");
  assert.equal(selectedProjectGuidance.workspace.id, "p1");

  const missingProjectIdentity = deriveTodayGuidance({
    platform: platform(ownerWorkspace({ current_user_id: "" }), { user: uuidPlatform.user }),
    automation: automation([tasks[0]], { enabled: false }),
    setup: { status: "ready" },
    authentication: { authenticated: true }
  });
  assert.equal(missingProjectIdentity.kind, "create_task");
});

test("Today and Automation preserve unknown data instead of projecting empty work", () => {
  const degraded = platform(ownerWorkspace(), { source_status: "degraded", errors: [{ section: "tasks", project_id: "p1" }] });
  assert.equal(deriveTodayGuidance({ platform: degraded, automation: automation(), setup: { status: "ready" }, authentication: { authenticated: true } }).kind, "unknown");
  assert.equal(deriveAutomationGuidance({ platform: degraded, automation: automation() }).kind, "unknown");
});

test("Work never describes pending review or another assignee as automatically executable", () => {
  const workspace = ownerWorkspace();
  const review = deriveWorkEligibilityGuidance({ task: { id: "t1", project_id: "p1", executor_id: "u1", state: "pending_review" }, workspace, currentUserId: "u1", canManageTask: true });
  assert.equal(review.kind, "confirm_review");
  const other = deriveWorkEligibilityGuidance({ task: { id: "t2", project_id: "p1", executor_id: "u2", state: "pending" }, workspace, currentUserId: "u1", canManageTask: true });
  assert.equal(other.kind, "assign_current_user");
  assert.match(other.reason, /不是当前用户/);
  const ready = deriveWorkEligibilityGuidance({ task: { id: "t3", project_id: "p1", executor_id: "u1", state: "pending" }, workspace, automationTask: { eligible: true, queue_position: 2 }, currentUserId: "u1", canManageTask: true });
  assert.equal(ready.kind, "eligible");
});

test("new task executor guidance distinguishes all Automation qualification combinations", () => {
  const unassigned = deriveTaskExecutorAutomationHelp({ executorId: "", currentUserId: "u1", state: "pending" });
  assert.match(unassigned, /未分配/);
  assert.match(unassigned, /不会进入 Automation 候选/);

  const other = deriveTaskExecutorAutomationHelp({ executorId: "u2", currentUserId: "u1", state: "pending" });
  assert.match(other, /其他成员/);
  assert.match(other, /不会进入你的 Automation 候选/);

  const review = deriveTaskExecutorAutomationHelp({ executorId: "u1", currentUserId: "u1", state: "pending_review" });
  assert.match(review, /当前状态不是待处理/);
  assert.match(review, /不会进入 Automation 候选/);

  const pending = deriveTaskExecutorAutomationHelp({ executorId: "u1", currentUserId: "u1", state: "pending" });
  assert.match(pending, /项目连接、项目授权和全局领取/);
  assert.match(pending, /不表示已经进入队列/);
});

test("project ownership checks fail closed when either identity is missing", () => {
  assert.equal(isCurrentProjectUser("7", "7"), true);
  assert.equal(isCurrentProjectUser("", ""), false);
  assert.equal(isCurrentProjectUser("7", ""), false);
  assert.equal(isCurrentProjectUser("", "7"), false);
  assert.equal(isCurrentProjectUser("7", "8"), false);
});

test("permission-limited project gaps produce responsibility handoff without a failing action", () => {
  const workspace = ownerWorkspace({ current_user_role: "member", local_project_id: "", local_project_path: "", participating: false });
  const today = deriveTodayGuidance({ platform: platform(workspace), automation: automation(), setup: { status: "ready" }, authentication: { authenticated: true } });
  assert.equal(today.responsibility, "project_admin");
  assert.equal(today.action_id, "copy_handoff");
  const work = deriveWorkEligibilityGuidance({ task: { id: "t1", project_id: "p1", executor_id: "u1", state: "pending" }, workspace, currentUserId: "u1", canManageTask: true });
  assert.equal(work.responsibility, "project_admin");
  assert.equal(work.action_id, "copy_handoff");
});

test("Automation distinguishes blocked candidates, review-only work and a truly empty queue", () => {
  const basePlatform = platform();
  const blocked = deriveAutomationGuidance({
    platform: basePlatform,
    automation: automation([], { blocked_pending_tasks: [{ id: "t1", project_id: "p1", state: "pending", eligibility_code: "project_unbound" }] })
  });
  assert.equal(blocked.kind, "bind_workspace");
  assert.equal(blocked.candidate_count, 1);
  const reviewOnly = deriveAutomationGuidance({ platform: basePlatform, automation: automation([{ id: "t2", project_id: "p1", state: "pending_review" }], { queue: [] }) });
  assert.equal(reviewOnly.kind, "review_task");
  const empty = deriveAutomationGuidance({ platform: basePlatform, automation: automation() });
  assert.equal(empty.kind, "empty");
});

test("Today and Automation expose queue pause as the next directly recoverable fact", () => {
  const task = { id: "t1", project_id: "p1", executor_id: "u1", state: "pending" };
  const paused = automation([task], { queue_paused: true });
  const today = deriveTodayGuidance({
    platform: platform(), automation: paused, setup: { status: "ready" }, authentication: { authenticated: true }
  });
  assert.equal(today.kind, "resume_queue");
  assert.equal(today.action_id, "resume_queue");
  assert.match(today.reason, /只解除队列暂停/);
  const command = deriveAutomationGuidance({ platform: platform(), automation: paused });
  assert.equal(command.kind, "resume_queue");
  assert.equal(command.candidate_count, 1);
  assert.equal(command.action_label, "继续领取");
  const steps = deriveReadinessSteps({ workspace: ownerWorkspace(), setup: { status: "ready" }, automation: paused, userTasks: [task] });
  assert.equal(steps.at(-1).status, "current");
});

test("readiness steps are derived from current facts and mark only one current step", () => {
  const steps = deriveReadinessSteps({ workspace: ownerWorkspace({ participating: false }), setup: { status: "ready" }, automation: { enabled: false }, userTasks: [] });
  assert.deepEqual(steps.map((step) => step.status), ["complete", "complete", "complete", "current", "later", "later"]);
});

test("Renderer reuses owned mutations, fresh-reads after success, and preserves ordinary Work defaults", async () => {
  const source = await readFile(new URL("../desktop/renderer/renderer.js", import.meta.url), "utf8");
  assert.match(source, /state: "pending", executor_id: executorId/);
  assert.match(source, /projectCurrentUserExecutorId\(values\.project_id\)/);
  assert.doesNotMatch(source, /executor_id: state\.platform\.user\.id/);
  assert.doesNotMatch(source, /currentUserId: state\.platform\.user/);
  assert.doesNotMatch(source, /String\(state\.platform\.user\?\.id/);
  assert.match(source, /platformField\("state", "状态", \{ type: "select", value: "pending_review"/);
  assert.match(source, /taskProjectFields\(defaultProjectId, \{ includeExecutorAutomationHelp: true, taskState: "pending_review" \}\)/);
  assert.match(source, /bindTaskFormProjectScope\(defaultProjectId, \{ includeExecutorAutomationHelp: true \}\)/);
  assert.match(source, /deriveTaskExecutorAutomationHelp\(\{[\s\S]*executorId: executorSelect\.value,[\s\S]*state: stateSelect\?\.value/);
  assert.match(source, /async function bindAutomationWorkspace[\s\S]*await api\.bindAutomationProject\(remoteProjectId, localProjectId\);[\s\S]*await refreshSnapshot\(\{ quiet: true \}\);/);
  assert.match(source, /await api\.setProjectParticipation\(workspace\.id, true\);[\s\S]*await refreshSnapshot\(\);/);
  assert.match(source, /await api\.setAutomationEnabled\(true\);[\s\S]*await refreshSnapshot\(\);/);
  assert.match(source, /case "resume_queue":[\s\S]*await api\.setQueuePaused\(false\);[\s\S]*await refreshSnapshot\(\);/);
  assert.match(source, /openChatWorkspaceSetup[\s\S]*await refreshChat\(\{ quiet: true, resetOwner: true \}\);/);
  assert.doesNotMatch(source, /onboarding_(?:state|progress)|readiness_percentage/);
});
