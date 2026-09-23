import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import { deriveTodayWorkspace } from "../src/desktop/today-workspace.mjs";
import { createTodayAcceptanceState } from "./fixtures/today-acceptance-state.mjs";

const renderer = await readFile(new URL("../desktop/renderer/renderer.js", import.meta.url), "utf8");
function extract(name) {
  const match = renderer.match(new RegExp(`^(?:async )?function ${name}\\(`, "m"));
  assert.ok(match);
  return renderer.slice(match.index, renderer.indexOf("\n}\n", match.index) + 2);
}
function rendererContext(fixture) {
  const state = { page: "today", selectedProjectId: "12", selectedTaskId: "", todaySelectedItemId: "work:W-COMPLETED:completed", todayDrafts: {}, refreshing: false, organizationScopeId: "personal", feedbackSnapshotEpoch: 0 };
  const context = vm.createContext({ state, Date, window: { setTimeout() {} },
    api: {
      submitAcceptanceFeedback: (input) => fixture.automation.submitAcceptanceFeedback(input),
      automationSnapshot: (input) => fixture.automation.getSnapshot(input),
      platformSnapshot: (input) => fixture.platform.getSnapshot(input), async getAuthStatus() { return {}; }
    },
    normalizeAuthentication: (value) => value, taskAttachmentIdentityKey: () => "synthetic",
    invalidateTaskAttachmentCaches() {}, hydrateTodayPreference() {}, syncWorkInspectorWidth() {}, scopedTaskFilter: () => true,
    routeAuthentication() {}, renderSyncing() {}, render() {}, renderToday() {}, scheduleTodayPreferencePersistence() {}, todayKindLabel: () => "验收问题",
    escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"), feedbackTone: () => "neutral"
  });
  vm.runInContext(["todayFactRows", "renderTodaySourceContext", "refreshSnapshot", "performTodayAction"].map(extract).join("\n"), context);
  return context;
}
function selected(context) {
  return deriveTodayWorkspace({ platform: context.state.platform, automation: context.state.snapshot, selectedProjectId: "11", selectedMode: "intervention", selectedItemId: context.state.todaySelectedItemId }).selected_item;
}
function barrier() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("Today joins disk-owned issues for workset members outside the Automation view, preserving Work facts and exact project identity", async () => {
  const fixture = await createTodayAcceptanceState();
  try {
    const context = rendererContext(fixture);
    await context.refreshSnapshot({ quiet: true });
    assert.equal(selected(context).acceptance_feedback_items.length, 0);
    context.state.todayDrafts[context.state.todaySelectedItemId] = "问题 <原文>";
    await context.performTodayAction(selected(context), "raise_acceptance_issue");
    assert.equal(context.state.snapshot.tasks.some((task) => task.project_id === "11"), false);
    assert.equal(context.state.platform.tasks.find((task) => task.project_id === "11").state, "completed");
    assert.equal(context.state.todaySelectedItemId, "work:W-COMPLETED:completed");
    const item = selected(context);
    assert.equal(item.acceptance_feedback_items.length, 1);
    assert.equal(item.state, "completed");
    assert.equal(item.content, "Ready for acceptance check");
    assert.match(context.renderTodaySourceContext(item), /问题 &lt;原文>/);
    assert.match(context.renderTodaySourceContext(item), /queued/);
    assert.equal(fixture.messages.length, 1);
    assert.equal((await fixture.runManager.readDesktopStore()).automation.acceptance_feedback_items.length, 1);
    assert.equal(Object.hasOwn(fixture.projection.tasks[0], "acceptance_feedback_items"), false);
    assert.equal(context.state.platform.today_tasks.find((task) => task.project_id === "12").acceptance_feedback_items.length, 0);
    await fixture.runManager.updateDesktopStore((store) => {
      const issue = store.automation.acceptance_feedback_items[0];
      issue.status = "resolved"; issue.progress = "验证通过";
      store.automation.acceptance_feedback_items.push({ ...issue, feedback_id: "OTHER", source_project_id: "12", original_feedback: "不可串入" });
    });
    await context.refreshSnapshot({ quiet: true });
    assert.match(context.renderTodaySourceContext(selected(context)), /验证通过/);
    assert.match(context.renderTodaySourceContext(selected(context)), /resolved/);
    assert.doesNotMatch(context.renderTodaySourceContext(selected(context)), /不可串入/);
    await fixture.runManager.updateDesktopStore((store) => { store.automation.acceptance_feedback_items = []; });
    await context.refreshSnapshot({ quiet: true });
    assert.equal(selected(context).acceptance_feedback_items.length, 0);
  } finally { await fixture.dispose(); }
});

test("Today submit waits for an older refresh then fetches fresh issues without overwriting a newer selection", async () => {
  const fixture = await createTodayAcceptanceState();
  try {
    const context = rendererContext(fixture);
    await context.refreshSnapshot({ quiet: true });
    const entered = barrier(), release = barrier(), submitted = barrier();
    const submitFeedback = context.api.submitAcceptanceFeedback;
    context.api.submitAcceptanceFeedback = async (input) => {
      const result = await submitFeedback(input);
      submitted.resolve();
      return result;
    };
    const platformSnapshot = context.api.platformSnapshot;
    let reads = 0;
    context.api.platformSnapshot = async (input) => {
      const result = await platformSnapshot(input);
      if (++reads === 1) { entered.resolve(); await release.promise; }
      return result;
    };
    const oldRefresh = context.refreshSnapshot({ quiet: true });
    await entered.promise;
    context.state.todayDrafts[context.state.todaySelectedItemId] = "Concurrent issue";
    const submit = context.performTodayAction(selected(context), "raise_acceptance_issue");
    context.state.todaySelectedItemId = "work:W-OTHER:completed";
    await submitted.promise;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(context.state.refreshing, true);
    assert.notEqual(context.state.todaySubmittingItemId, "");
    release.resolve();
    await Promise.all([oldRefresh, submit]);
    assert.equal(reads, 2);
    assert.equal(context.state.todaySelectedItemId, "work:W-OTHER:completed");
    assert.equal(context.state.platform.today_tasks.find((task) => task.id === "W-COMPLETED" && task.project_id === "11").acceptance_feedback_items.length, 1);
    assert.equal(selected(context).acceptance_feedback_items.length, 0);
  } finally { await fixture.dispose(); }
});

test("Today failed submission preserves draft and selection and does not publish an issue", async () => {
  const fixture = await createTodayAcceptanceState();
  try {
    const context = rendererContext(fixture);
    await context.refreshSnapshot({ quiet: true });
    context.api.submitAcceptanceFeedback = async () => { throw new Error("Synthetic submission failure"); };
    context.state.todayDrafts[context.state.todaySelectedItemId] = "Keep draft";
    await assert.rejects(context.performTodayAction(selected(context), "raise_acceptance_issue"), /Synthetic submission failure/);
    assert.equal(context.state.todaySelectedItemId, "work:W-COMPLETED:completed");
    assert.equal(context.state.todayDrafts[context.state.todaySelectedItemId], "Keep draft");
    assert.equal(selected(context).acceptance_feedback_items.length, 0);
  } finally { await fixture.dispose(); }
});
