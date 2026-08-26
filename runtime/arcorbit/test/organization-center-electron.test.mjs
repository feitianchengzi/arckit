import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/organization-center-electron.mjs", import.meta.url));

test("production todo surfaces resolve executor names without exposing ids", {
  skip: process.env.ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST !== "1" && "set ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST=1 to run the focused Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.workInspectorExecutor, "Glare");
  assert.deepEqual(result.workExecutorCells, [
    { id: "W-11", label: "Glare" },
    { id: "W-NAMELESS", label: "执行人姓名不可用" },
    { id: "W-UNKNOWN", label: "执行人姓名不可用" },
    { id: "W-UNASSIGNED", label: "未分配" }
  ]);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · Glare"), true);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · 执行人姓名不可用"), true);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · 未分配"), true);
  assert.equal(result.switchedProductExecutorOptions.find((item) => item.value === "9")?.label, "成员姓名不可用");
  assert.equal(result.feedbackExecutorOptions.find((item) => item.value === "9")?.label, "成员姓名不可用");
  assert.deepEqual(result.rendererErrors, []);
  assert.deepEqual(result.errors, []);
});

test("production Organization Center keeps governance independent and invitations project-bound", {
  skip: process.env.ARCORBIT_ELECTRON_ORGANIZATION_TEST !== "1" && "set ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 to run the interactive Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  assert.equal(result.accountName, "Glare");
  assert.equal(result.authIdentity, "Glare");
  assert.deepEqual(result.productScopeProjectIds, ["all", "11", "12"]);
  assert.deepEqual(result.automationBindingProjectIds, ["11", "12"]);
  assert.deepEqual(result.automationFeedbackIds, ["AF-11"]);
  assert.equal(result.hasGlobalRecoveryAction, true);
  assert.match(result.currentRunText, /Outside Workset active execution/);
  assert.match(result.currentRunText, /CASE-OUTSIDE/);
  assert.equal(result.ordinaryQueueInitiallyVisible, true);
  assert.equal(result.acceptanceOnlyPressed, "true");
  assert.equal(result.ordinaryQueueHidden, true);
  assert.equal(result.feedbackQueueVisible, true);
  assert.equal(result.selectedProductTaskDefault, "12");
  assert.deepEqual(result.selectedProductExecutorOptions, [{ value: "", label: "未分配" }, { value: "8", label: "Lin" }]);
  assert.deepEqual(result.selectedProductTagLabels, ["Docs"]);
  assert.deepEqual(result.priorityOptionLabels, ["无优先级", "最高 · 紧急且重要", "高 · 优先处理", "中 · 正常处理", "低 · 可以延后"]);
  assert.deepEqual(result.switchedProductExecutorOptions, [{ value: "", label: "未分配" }, { value: "7", label: "Glare" }, { value: "8", label: "Lin" }, { value: "9", label: "成员姓名不可用" }]);
  assert.deepEqual(result.switchedProductParentIds, ["", "W-RUNNING", "W-11", "W-NAMELESS", "W-UNKNOWN", "W-UNASSIGNED", "W-COMPLETED", "W-ACCEPTED"]);
  assert.deepEqual(result.switchedProductTagLabels, ["Bug", "Desktop"]);
  assert.notEqual(result.createdTaskTagId, "");
  assert.equal(result.editedTaskTagVisible, true);
  assert.equal(result.deletedTaskTagAbsent, true);
  assert.equal(result.allProductsTaskDefault, "11");
  assert.deepEqual(result.workStateIds, ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"]);
  assert.equal(result.pendingStatusCount, "4");
  assert.equal(result.scopePersistedInWork, "11");
  assert.equal(result.workInspectorTitle, "待办 W-11");
  assert.equal(result.workInspectorProduct, "ArcOrbit");
  assert.equal(result.workInspectorRuntime, "未关联");
  assert.equal(result.workInspectorHasProductProperty, false);
  assert.match(result.workInspectorText, /Verify Work state scope/);
  assert.match(result.workInspectorText, /不在当前用户 Automation 范围/);
  assert.equal(result.workInspectorExecutor, "Glare");
  assert.deepEqual(result.workExecutorCells, [
    { id: "W-11", label: "Glare" },
    { id: "W-NAMELESS", label: "执行人姓名不可用" },
    { id: "W-UNKNOWN", label: "执行人姓名不可用" },
    { id: "W-UNASSIGNED", label: "未分配" }
  ]);
  assert.equal(result.selectedWorkRows, 1);
  assert.deepEqual(result.editExecutorOptions, [{ value: "", label: "未分配" }, { value: "7", label: "Glare" }, { value: "8", label: "Lin" }, { value: "9", label: "成员姓名不可用" }]);
  assert.equal(result.editPriorityValue, "1");
  assert.deepEqual(result.editSelectedTagIds, ["201"]);
  assert.equal(result.completedHasAcceptanceComposer, true);
  assert.equal(result.completedInspectorRuntime, "RUN-W-COMPLETED · 已完成");
  assert.equal(result.runningInspectorRuntime, "RUN-W-RUNNING · 自动执行中");
  assert.equal(result.runningInspectorAction, "打开运行");
  assert.equal(result.runningWorkbenchActive, true);
  assert.equal(result.runningWorkbenchRun, "RUN-W-RUNNING");
  assert.equal(result.calls.some(([command, input]) => command === "selectAutomationExecution" && input === "EXECUTION-W-RUNNING"), true);
  assert.equal(result.missingRuntimeAction, "进入恢复中心");
  assert.equal(result.missingRuntimeRecoveryActive, true);
  assert.equal(result.multipleRuntimeAction, "进入恢复中心");
  assert.equal(result.multipleRuntimeRecoveryActive, true);
  assert.equal(result.invalidWorkspaceAction, "进入恢复中心");
  assert.equal(result.invalidWorkspaceRecoveryActive, true);
  assert.equal(result.interleavedRefreshInitialAction, "打开运行");
  assert.equal(result.interleavedRefreshFinalAction, "进入恢复中心");
  assert.match(result.completedInspectorText, /提出验收问题/);
  assert.equal(result.acceptedHasAcceptanceComposer, false);
  assert.match(result.acceptedInspectorText, /验收通过/);
  assert.match(result.acceptedInspectorText, /不再接受新的验收问题/);
  assert.deepEqual(result.todayProductIds, ["11"]);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · Glare"), true);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · 执行人姓名不可用"), true);
  assert.equal(result.todayTaskMeta.some((value) => value === "ArcOrbit · 未分配"), true);
  assert.deepEqual(result.ordinaryFeedbackIds, ["F-11", "F-11-LINKED"]);
  assert.equal(result.scopePersistedInFeedback, "11");
  assert.equal(result.feedbackHasCreateButton, false);
  assert.equal(result.feedbackHasVersionText, false);
  assert.match(result.feedbackInspectorText, /Visible in the selected product/);
  assert.match(result.feedbackInspectorText, /customer-11/);
  assert.match(result.feedbackInspectorText, /13800000011/);
  assert.match(result.feedbackInspectorText, /customer11@example\.test/);
  assert.equal(result.feedbackImageLoaded, true);
  assert.equal(result.feedbackDetailScrollsInternally, true);
  assert.equal(result.singleFeedbackRowHeight, 40);
  assert.equal(result.calls.some(([command, input]) => command === "previewImage"
    && input.source === "feedback-file" && input.feedback_id === "F-11"), true);
  assert.equal(result.calls.some(([command, input]) => command === "openImageViewer"
    && input.source === "feedback-file" && input.feedback_id === "F-11"), true);
  assert.equal(result.selectedFeedbackRows, 1);
  assert.deepEqual(result.searchedFeedbackIds, ["F-11"]);
  assert.deepEqual(result.convertedFeedbackIds, ["F-11-LINKED"]);
  assert.equal(result.linkedFeedbackHasTaskAction, false);
  assert.deepEqual(result.oldestFeedbackIds, ["F-11-LINKED", "F-11"]);
  assert.deepEqual(result.feedbackActionLabels, ["忽略", "刷新", "转为待办", "删除"]);
  assert.equal(result.feedbackTaskContent, "Visible in the selected product");
  assert.deepEqual(result.feedbackExecutorOptions, [
    { value: "", label: "未分配" },
    { value: "7", label: "Glare" },
    { value: "8", label: "Lin" },
    { value: "9", label: "成员姓名不可用" }
  ]);
  assert.equal(result.calls.some(([command, input]) => command === "task.create"
    && input.project_id === "11"
    && input.executor_id === "8"
    && input.priority === "1"
    && input.tags === "201"), true);
  assert.equal(result.calls.some(([command, input]) => command === "task.update"
    && input.task_id === "W-11"
    && input.priority === null
    && input.tags === "201,202"), true);
  assert.equal(result.calls.some(([command, input]) => command === "tag.create" && input.name === "[Feature](#ff10b981)"), true);
  assert.equal(result.calls.some(([command, input]) => command === "tag.update" && input.name === "[Feature updated](#ff10b981)"), true);
  assert.equal(result.calls.some(([command]) => command === "tag.delete"), true);
  assert.equal(result.calls.some(([command, input]) => command === "feedback.to_task"
    && input.feedback_id === "F-11"
    && input.task_content === "Visible in the selected product"
    && input.executor_id === "8"), true);
  assert.equal(result.calls.some(([command, input]) => command === "feedback.update"
    && input.feedback_id === "F-11"
    && input.data.priority === "P2"), true);
  assert.equal(result.calls.some(([command, input]) => command === "feedback.update"
    && input.feedback_id === "F-11"
    && input.data.ignored === true), true);
  assert.equal(result.automationNavCount, "2");
  assert.equal(result.feedbackQueueNavCount, "2");
  assert.equal(result.attentionNavCount, "1");
  assert.equal(result.hasAddLocalOption, true);
  assert.equal(result.calls.some(([command, input]) => command === "bindAutomationProject" && input.remoteId === "12" && input.localId === "local-new"), true);
  assert.equal(result.initialHeading, "飞天橙子");
  assert.equal(result.matrixRows, 2);
  assert.match(result.memberText, /为何这里没有项目邀请/);
  assert.match(result.memberText, /已有项目关系/);
  assert.equal(result.memberProjectHasInvite, false);
  assert.equal(result.inviteFormTitle, "邀请加入 ArcOrbit");
  assert.equal(result.inviteResultTitle, "项目邀请已生成 · ArcOrbit");
  assert.match(result.inviteResultText, /不绑定某位成员/);
  assert.match(result.inviteResultLead, /不支持邀请历史、再次查看或撤销/);
  assert.equal(result.editHasOrganizationMutation, false);
  assert.equal(result.editScopeIsReadonly, true);
  assert.equal(result.worksetChoices, 3);
  assert.equal(result.calls.some(([command, input]) => command === "project.invite" && input.project_id === "11"), true);
  assert.equal(result.calls.some(([command, input]) => command === "project.join" && input.invite_code === "JOIN-CODE"), true);
  assert.equal(result.calls.some(([command]) => command === "updateWorkset"), true);
  assert.deepEqual(result.rendererErrors, []);
  assert.deepEqual(result.errors, []);
});
