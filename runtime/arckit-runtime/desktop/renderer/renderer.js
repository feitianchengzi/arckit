import {
  isTranscriptMessageVisible,
  statusGlyph,
  structuredResultPresentation,
  summarizeLoopStatus,
  summarizeToolActivity,
  transcriptMessageType
} from "../../src/desktop/transcript-presentation.mjs";

const api = window.arckitDesktop;

const TASK_STATES = ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"];
const STATE_LABELS = {
  pending_review: "待评审",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  accepted: "已验收",
  cancelled: "已取消",
  blocked: "已阻塞"
};
const STATE_ICONS = {
  pending_review: "○",
  pending: "●",
  in_progress: "◌",
  completed: "✓",
  accepted: "◆",
  cancelled: "×",
  blocked: "!"
};
const RECOVERY_LABELS = {
  claim_failed: "领取任务失败",
  start_failed: "Runtime 启动失败",
  runtime_incomplete: "Runtime 尚未收束",
  completion_writeback_failed: "完成状态写回失败",
  external_state_change: "活动任务被外部修改",
  task_missing: "活动任务缺失",
  discovered_in_progress: "发现可恢复的进行中任务",
  multiple_active_tasks: "存在多个进行中任务",
  runtime_process_missing: "Runtime 进程未连接",
  safe_stop_requested: "正在安全停止",
  cli_handoff_failed: "Codex CLI 接管失败",
  case_reconciliation_failed: "Case 对账失败"
};
const RECOVERY_ACTION_LABELS = {
  retry_sync: "重新同步",
  retry_start: "重试同一任务",
  retry_cli_handoff: "重试切换到 CLI",
  retry_complete: "重试完成写回",
  feedback_continue: "添加反馈并继续",
  accept_server_state: "接受服务器事实",
  mark_blocked: "标记为已阻塞"
};

const state = {
  setup: null,
  setupBusy: false,
  setupPlanOpened: false,
  page: "command",
  selectedProjectId: "all",
  selectedState: "pending",
  selectedTaskId: "",
  snapshot: emptySnapshot(),
  settings: defaultSettings(),
  authentication: defaultAuthentication(),
  loginGate: false,
  authType: "email",
  verificationCooldown: 0,
  authBusy: { verification: false, login: false, logout: false },
  authFeedback: { message: "", error: false },
  transcript: [],
  transcriptSessionId: "",
  transcriptSessionMessages: [],
  transcriptRuns: [],
  transcriptFollowingLatest: true,
  workbenchMode: "review",
  workbenchRun: null,
  workbenchCompletion: null,
  workbenchTask: null,
  workbenchFeedbackId: "",
  interventionSubmitting: false,
  taskFilter: "",
  refreshing: false
};

const els = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map((element) => [element.id, element]));
let refreshQueued = false;
let toastTimer;
let verificationTimer;

boot();

async function boot() {
  wireEvents();
  const [setup, settings, authentication] = await Promise.all([api.getSetupReadiness(), api.getSettings(), api.getAuthStatus()]);
  state.setup = setup;
  state.settings = normalizeSettings(settings);
  state.authentication = normalizeAuthentication(authentication);
  renderSetup();
  await refreshSnapshot();
  api.onSetupEvent((readiness) => {
    state.setup = readiness;
    renderSetup();
  });
  api.onAutomationEvent(() => scheduleRefresh());
  api.onEvent((event) => {
    if (["run.started", "run.finished", "message.added"].includes(event.type)) {
      state.transcriptSessionId = "";
    }
    if (["run.started", "run.finished", "run.activity_changed", "run.command_result", "message.added"].includes(event.type)) {
      scheduleRefresh(event.type === "run.activity_changed" ? 120 : 0);
    }
  });
  window.setInterval(() => refreshSnapshot({ quiet: true }), 30_000);
}

function wireEvents() {
  els.setupRetryButton.addEventListener("click", () => runAction(async () => {
    state.setupBusy = true;
    renderSetup();
    try {
      state.setup = await api.checkSetupReadiness();
      state.setupPlanOpened = false;
    } finally {
      state.setupBusy = false;
      renderSetup();
    }
  }));
  els.setupApplyButton.addEventListener("click", () => runAction(async () => {
    state.setupBusy = true;
    renderSetup();
    try {
      state.setup = await api.applySetupPlan({ planDigest: state.setup?.plan?.digest });
    } finally {
      state.setupBusy = false;
      renderSetup();
    }
  }));
  els.setupContinueButton.addEventListener("click", () => runAction(async () => {
    await api.continueFromSetup();
    els.setupReadiness.classList.add("hidden");
    await refreshSnapshot();
  }));
  els.setupExitButton.addEventListener("click", () => window.close());
  els.setupPlanDetails.addEventListener("toggle", () => {
    if (els.setupPlanDetails.open) state.setupPlanOpened = true;
    renderSetupActions();
  });
  els.setupReviewed.addEventListener("change", renderSetupActions);
  els.setupPlan.addEventListener("click", (event) => {
    const button = event.target.closest("[data-setup-cleanup]");
    if (!button) return;
    runAction(async () => {
      const paths = state.setup?.plan?.cleanup?.map((item) => item.path) || [];
      const removal = await api.planSetupRemoval(paths);
      if (!window.confirm(`将只移除 ${paths.length} 个 ArcForge 已证明的 managed-stale 路径。\n\n确认摘要：${removal.confirmationDigest}`)) return;
      state.setup = await api.removeManagedSetupPaths({ managedPaths: paths, confirmationDigest: removal.confirmationDigest });
      state.setupPlanOpened = false;
      els.setupReviewed.checked = false;
      renderSetup();
    });
  });
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  els.pickProjectButton.addEventListener("click", () => runAction(async () => {
    await api.pickProject();
    await refreshSnapshot();
  }));
  els.syncButton.addEventListener("click", () => runAction(async () => {
    await api.syncAutomation();
    await refreshSnapshot();
  }));
  els.automationEnabled.addEventListener("change", () => runAction(async () => {
    await api.setAutomationEnabled(els.automationEnabled.checked);
    await refreshSnapshot();
  }));
  els.queuePauseButton.addEventListener("click", () => runAction(async () => {
    await api.setQueuePaused(!state.snapshot.queue_paused);
    await refreshSnapshot();
  }));
  els.settingsButton.addEventListener("click", () => runAction(() => openSettings({ loginGate: false })));
  els.sourceHealthButton.addEventListener("click", () => {
    if (state.snapshot.recovery_items.length > 0) showPage("recovery");
    else runAction(() => openSettings({ loginGate: false }));
  });
  els.runtimeHealthButton.addEventListener("click", () => {
    if (state.snapshot.active_task) openWorkbench("review");
  });
  els.closeSettingsButton.addEventListener("click", closeSettings);
  els.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === els.settingsOverlay) closeSettings();
  });
  els.saveSettingsButton.addEventListener("click", () => runAction(saveSettings));
  els.taskSourceAuthMode.addEventListener("change", renderAuthMode);
  document.querySelectorAll("[data-auth-type]").forEach((button) => button.addEventListener("click", () => {
    state.authType = button.dataset.authType;
    renderAuthPanel();
  }));
  els.sendVerificationButton.addEventListener("click", () => runAction(sendVerification));
  els.loginButton.addEventListener("click", () => runAction(login));
  els.logoutButton.addEventListener("click", () => runAction(logout));
  els.viewPendingButton.addEventListener("click", () => openTaskBrowser("pending"));
  els.feedbackQueueNav.addEventListener("click", () => {
    showPage("command");
    els.feedbackQueueCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.backToCommandButton.addEventListener("click", () => showPage("command"));
  els.backFromWorkbenchButton.addEventListener("click", () => showPage("command"));
  els.backFromRecoveryButton.addEventListener("click", () => showPage("command"));
  els.interveneCurrentButton.addEventListener("click", () => {
    if (!state.snapshot.active_task || state.workbenchCompletion) return;
    state.workbenchMode = "intervention";
    renderWorkbench();
    els.interventionInput.focus();
  });
  els.transcriptList.addEventListener("scroll", handleTranscriptScroll, { passive: true });
  els.jumpToLatestButton.addEventListener("click", () => scrollTranscriptToLatest({ behavior: "smooth" }));
  els.taskFilterInput.addEventListener("input", () => {
    state.taskFilter = els.taskFilterInput.value.trim().toLowerCase();
    renderTaskTable();
  });
  els.submitInterventionButton.addEventListener("click", () => runAction(async () => {
    const active = state.snapshot.active_task;
    const sourceTask = state.workbenchTask || (state.workbenchCompletion
      ? state.snapshot.tasks.find((item) => String(item.id) === String(state.workbenchCompletion.task_id))
      : null);
    const acceptanceReview = Boolean(sourceTask && ["completed", "accepted"].includes(sourceTask.state));
    if (!active && !acceptanceReview) throw new Error("当前没有活动执行。");
    state.interventionSubmitting = true;
    renderWorkbench();
    try {
      if (acceptanceReview) {
        const key = globalThis.crypto?.randomUUID?.() || `${sourceTask.id}-${Date.now()}`;
        await api.submitAcceptanceFeedback({ taskId: sourceTask.id, message: els.interventionInput.value, idempotencyKey: key });
      } else {
        await api.submitIntervention({ taskId: active.task_id, message: els.interventionInput.value });
      }
      els.interventionInput.value = "";
      await refreshSnapshot();
      if (!acceptanceReview) showPage("command");
    } finally {
      state.interventionSubmitting = false;
      if (state.page === "workbench") renderWorkbench();
    }
  }));
  els.searchButton.addEventListener("click", () => {
    openTaskBrowser(state.selectedState || "pending");
    els.taskFilterInput.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
      if (["tasks", "workbench", "recovery"].includes(state.page)) showPage("command");
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openTaskBrowser(state.selectedState || "pending");
      els.taskFilterInput.focus();
    }
  });
}

function renderSetup() {
  const setup = state.setup;
  if (!setup) return;
  const ready = setup.status === "ready";
  els.setupReadiness.classList.toggle("hidden", ready && !setup.first_install);
  if (ready && !setup.first_install) {
    api.continueFromSetup().catch((error) => console.error("Setup continuation failed:", error));
  }
  const labels = {
    checking: ["正在检查 Arckit 能力", "逐项验证安装包资源和本机目标。"],
    applying: ["正在准备完整能力", "写入由 ArcForge provider 事务化执行，请保持应用打开。"],
    ready: ["Arckit 已准备完成", "关键资源、skills drift 与 Codex discoverability 均已通过。"],
    "needs-install": ["需要安装 Arckit skills", "查看 fresh plan 的目标后确认安装。"],
    drifted: ["发现 managed-stale 路径", "清理需要独立确认，普通安装不会隐式删除。"],
    conflict: ["发现需要处理的冲突", "changed 目标或 loader conflict 不会被静默覆盖。"],
    blocked: ["Setup Readiness 被阻塞", setup.error?.message || "修复后重新检查。"]
  };
  const [title, lead] = labels[setup.status] || labels.blocked;
  els.setupTitle.textContent = title;
  els.setupLead.textContent = lead;
  els.setupStatusPill.textContent = setup.status.toUpperCase();
  els.setupStatusPill.className = `health-badge ${ready ? "success" : ["blocked", "conflict"].includes(setup.status) ? "danger" : "warning"}`;
  els.setupChecks.innerHTML = (setup.checks || []).map((item) => `<div class="setup-check ${escapeHtml(item.status)}"><span>${item.status === "passed" ? "✓" : item.status === "failed" ? "!" : "…"}</span><div><strong>${escapeHtml(setupCheckLabel(item.id))}</strong><small>${escapeHtml(item.summary)}</small></div></div>`).join("") || `<div class="setup-check pending"><span>…</span><div><strong>准备检查</strong><small>等待 main process 返回状态</small></div></div>`;
  els.setupDistribution.innerHTML = setup.distribution ? [
    ["Runtime", setup.distribution.runtime_version], ["Release intent", setup.distribution.release_tag],
    ["ArcForge provider", setup.distribution.provider_version], ["Payload", shortDigest(setup.distribution.payload_digest)]
  ].map(([label, value]) => `<div class="fact-row"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("") : `<p class="muted-copy">尚未读取 distribution lock。</p>`;
  const counts = setup.drift?.counts;
  els.setupCounts.innerHTML = counts ? `<div><strong>${counts.missing}</strong><span>将新增</span></div><div><strong>${counts.same}</strong><span>已一致</span></div><div><strong>${counts.changed}</strong><span>changed</span></div><div><strong>${counts.managed_stale}</strong><span>stale</span></div>` : "";
  renderSetupPlan();
  els.setupErrorPanel.classList.toggle("hidden", !setup.error);
  els.setupErrorPanel.innerHTML = setup.error ? `<strong>${escapeHtml(setup.error.code)}</strong><p>${escapeHtml(setup.error.message)}</p><small>阶段：${escapeHtml(setup.error.stage)} · 回滚：${setup.error.rollback_complete ? "完整" : "需要人工检查"}</small>` : "";
  const conflicts = setup.drift?.conflicts || [];
  els.setupConflictPanel.classList.toggle("hidden", conflicts.length === 0);
  els.setupConflictPanel.innerHTML = conflicts.length ? `<h2>不会自动覆盖</h2>${conflicts.map((item) => `<div class="setup-path-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}` : "";
  renderSetupActions();
}

function renderSetupPlan() {
  const plan = state.setup?.plan;
  els.setupPlanDetails.classList.toggle("hidden", !plan);
  els.setupReviewLabel.classList.toggle("hidden", !state.setup?.can_apply);
  if (!plan) { els.setupPlan.innerHTML = ""; return; }
  const groups = Object.groupBy ? Object.groupBy(plan.items, (item) => item.mode || "unclassified") : plan.items.reduce((result, item) => ((result[item.mode || "unclassified"] ||= []).push(item), result), {});
  const groupHtml = Object.entries(groups).map(([mode, items]) => `<section class="setup-plan-group"><h3>${escapeHtml(mode)} · ${items.length}</h3>${items.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong>${item.destinations.map((destination) => `<code>${escapeHtml(destination.path)}</code>`).join("")}</div>`).join("")}</section>`).join("");
  const cleanup = plan.cleanup?.length ? `<section class="setup-plan-group warning"><h3>managed-stale · ${plan.cleanup.length}</h3>${plan.cleanup.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}<button data-setup-cleanup class="secondary-button" type="button">单独确认并清理</button></section>` : "";
  const deferred = plan.deferred_project_skills?.length ? `<section class="setup-plan-group"><h3>project-ambient · 延后</h3><p>${plan.deferred_project_skills.map(escapeHtml).join("、")}</p></section>` : "";
  els.setupPlan.innerHTML = `<p class="setup-digest">Plan digest <code>${escapeHtml(plan.digest)}</code></p>${groupHtml}${cleanup}${deferred}`;
}

function renderSetupActions() {
  const setup = state.setup || {};
  const applying = state.setupBusy || ["checking", "applying"].includes(setup.status);
  els.setupRetryButton.disabled = applying;
  els.setupRetryButton.classList.toggle("hidden", setup.status === "ready");
  els.setupApplyButton.classList.toggle("hidden", !setup.can_apply);
  els.setupApplyButton.disabled = applying || !state.setupPlanOpened || !els.setupReviewed.checked;
  els.setupContinueButton.classList.toggle("hidden", setup.status !== "ready");
  els.setupContinueButton.disabled = applying;
  els.setupExitButton.disabled = setup.status === "applying";
}

function setupCheckLabel(id) { return ({resources:"受信安装资源",provider:"ArcForge provider",skills:"Arckit skills",codex:"Codex discoverability"})[id] || id; }
function shortDigest(value) { return value ? `${value.slice(0, 10)}…${value.slice(-8)}` : "--"; }

async function refreshSnapshot({ quiet = false } = {}) {
  if (state.refreshing) return;
  state.refreshing = true;
  if (!quiet) renderSyncing(true);
  try {
    const [snapshot, authentication] = await Promise.all([
      api.automationSnapshot({
        project_id: state.selectedProjectId,
        state: state.page === "tasks" ? state.selectedState : ""
      }),
      api.getAuthStatus()
    ]);
    state.snapshot = snapshot;
    if (state.workbenchTask) {
      state.workbenchTask = snapshot.tasks.find((task) => String(task.id) === String(state.workbenchTask.id)) || state.workbenchTask;
    }
    state.authentication = normalizeAuthentication(authentication);
    if (state.selectedProjectId !== "all" && !state.snapshot.projects.some((project) => String(project.id) === state.selectedProjectId)) {
      state.selectedProjectId = "all";
    }
    if (state.selectedTaskId && !state.snapshot.tasks.some((task) => String(task.id) === state.selectedTaskId)) {
      state.selectedTaskId = state.snapshot.tasks[0]?.id || "";
    }
    if (!state.selectedTaskId && state.snapshot.tasks.length > 0) {
      state.selectedTaskId = state.snapshot.tasks[0].id;
    }
    if (state.page === "workbench") await loadTranscript();
    render();
    routeAuthentication();
  } finally {
    state.refreshing = false;
    renderSyncing(false);
  }
}

function scheduleRefresh(delay = 80) {
  if (refreshQueued) return;
  refreshQueued = true;
  window.setTimeout(async () => {
    refreshQueued = false;
    await refreshSnapshot({ quiet: true }).catch((error) => showToast(error.message));
  }, delay);
}

function render() {
  renderPageVisibility();
  renderNavigation();
  renderCommandBar();
  renderCommandCenter();
  renderTaskBrowser();
  renderWorkbench();
  renderRecovery();
}

function renderPageVisibility() {
  document.querySelectorAll("[data-page-view]").forEach((view) => view.classList.toggle("is-active", view.dataset.pageView === state.page));
  document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("is-active", button.dataset.page === state.page));
}

function renderNavigation() {
  const snapshot = state.snapshot;
  const allPending = snapshot.projects.reduce((sum, project) => sum + Number(project.task_counts?.pending || 0), 0);
  els.projectNavigation.innerHTML = [
    navProject({ id: "all", name: "所有项目", count: allPending }),
    ...snapshot.projects.map((project) => navProject({ id: project.id, name: project.name, count: project.task_counts?.pending || 0, warning: !project.eligible }))
  ].join("");
  els.projectNavigation.querySelectorAll("[data-project-id]").forEach((button) => button.addEventListener("click", async () => {
    state.selectedProjectId = button.dataset.projectId;
    state.selectedTaskId = "";
    await refreshSnapshot();
  }));

  els.statusNavigation.innerHTML = TASK_STATES.map((taskState) => `
    <button class="nav-item ${state.page === "tasks" && state.selectedState === taskState ? "is-active" : ""}" data-task-state="${taskState}" type="button">
      <span>${STATE_ICONS[taskState]}</span><strong>${STATE_LABELS[taskState]}</strong><em>${state.snapshot.state_counts?.[taskState] || 0}</em>
    </button>
  `).join("");
  els.statusNavigation.querySelectorAll("[data-task-state]").forEach((button) => button.addEventListener("click", () => openTaskBrowser(button.dataset.taskState)));
  els.attentionNavCount.textContent = String(snapshot.attention_items.length + snapshot.recovery_items.length);
  els.feedbackQueueNavCount.textContent = String(snapshot.acceptance_feedback_counts?.open || 0);
  els.sourceHealthText.textContent = sourceStatusLabel(snapshot.source_status);
  els.runtimeHealthText.textContent = snapshot.health?.label || "待命";
  els.titlebarSync.className = `sync-state ${snapshot.source_status === "healthy" ? "healthy" : ["error", "unauthenticated"].includes(snapshot.source_status) ? "error" : ""}`;
  els.titlebarSync.querySelector("span").textContent = snapshot.source_status === "syncing" ? "同步中" : snapshot.synced_at ? `同步于 ${formatTime(snapshot.synced_at)}` : sourceStatusLabel(snapshot.source_status);
}

function renderCommandBar() {
  const project = currentProject();
  els.scopeTitle.textContent = project?.name || "所有项目";
  els.pageTitle.textContent = { command: "自动化总览", tasks: STATE_LABELS[state.selectedState], workbench: "人工介入", recovery: "恢复中心" }[state.page];
  els.automationEnabled.checked = Boolean(state.snapshot.enabled);
  els.automationEnabled.disabled = !state.authentication.authenticated;
}

function renderCommandCenter() {
  const snapshot = state.snapshot;
  const scopedProjects = state.selectedProjectId === "all" ? snapshot.projects : snapshot.projects.filter((project) => String(project.id) === state.selectedProjectId);
  const scopedQueue = state.selectedProjectId === "all" ? snapshot.queue : snapshot.queue.filter((task) => String(task.project_id) === state.selectedProjectId);
  const scopedBlockedPending = (snapshot.blocked_pending_tasks || []).filter(scopedTaskFilter);
  const scopedFeedback = snapshot.acceptance_feedback_queue || [];
  els.commandHeading.textContent = state.selectedProjectId === "all" ? "跨项目自动领取态势" : `${currentProject()?.name || "项目"} 自动领取态势`;
  els.commandSummary.textContent = `${scopedProjects.length} 个项目 · ${scopedProjects.filter((project) => project.participating).length} 个允许自动领取 · ${scopedProjects.filter((project) => project.eligible).length} 个具备执行资格 · 最近同步 ${snapshot.synced_at ? formatTime(snapshot.synced_at) : "尚未完成"}`;
  els.healthBadge.className = `health-badge ${snapshot.health?.tone === "success" ? "success" : snapshot.health?.tone === "danger" ? "danger" : snapshot.health?.tone === "warning" ? "warning" : ""}`;
  els.healthBadge.textContent = snapshot.health?.label || "待命";
  els.queuePauseButton.textContent = snapshot.queue_paused ? "继续领取" : "暂停领取";
  els.queuePauseButton.disabled = !snapshot.enabled;

  const runningCount = snapshot.active_task && (state.selectedProjectId === "all" || String(snapshot.active_task.project_id) === state.selectedProjectId) ? 1 : 0;
  const humanAttentionCount = snapshot.attention_items.filter(scopedTaskFilter).length;
  const recoveryCount = snapshot.recovery_items.filter(scopedTaskFilter).length;
  const attentionCount = humanAttentionCount + recoveryCount;
  els.metricGrid.innerHTML = [
    metric("自动领取", snapshot.health?.label || "待命", sourceStatusLabel(snapshot.source_status), snapshot.health?.tone === "success" ? "healthy" : ""),
    metric("待处理事项", attentionCount, humanAttentionCount
      ? `${humanAttentionCount} 项需要人工决策`
      : recoveryCount
        ? `${recoveryCount} 项需要恢复自动化`
        : "没有待处理事项", attentionCount ? "attention" : ""),
    metric("运行中", runningCount, snapshot.active_task?.phase || "没有活动任务", runningCount ? "running" : ""),
    metric("普通待办队列", scopedQueue.length, scopedQueue[0] ? `下一项 ${scopedQueue[0].id}` : scopedBlockedPending.length ? `${scopedBlockedPending.length} 项尚未启用` : "没有可执行任务", scopedBlockedPending.length ? "attention" : ""),
    metric("验收反馈队列", scopedFeedback.length, scopedFeedback.length ? `${snapshot.acceptance_feedback_counts?.queued || 0} queued · ${snapshot.acceptance_feedback_counts?.blocked || 0} blocked` : "没有待处理验收问题", scopedFeedback.length ? "running" : "")
  ].join("");
  renderAttention(scopedBlockedPending);
  renderCurrentRun(scopedBlockedPending);
  renderQueue(scopedQueue, scopedBlockedPending);
  renderAcceptanceFeedbackQueue(scopedFeedback);
  renderRecentCompletions();
  renderCommandInspector(scopedProjects);
}

function renderAcceptanceFeedbackQueue(items) {
  els.feedbackQueueSummary.textContent = `${items.length} 项`;
  if (!items.length) {
    els.feedbackQueueTable.innerHTML = `<div class="empty-state">当前范围没有待处理验收反馈。</div>`;
    return;
  }
  els.feedbackQueueTable.innerHTML = `<table class="data-table"><colgroup><col style="width:42px"><col><col style="width:110px"><col style="width:150px"><col style="width:110px"></colgroup><thead><tr><th>#</th><th>问题</th><th>来源待办</th><th>进展</th><th>状态</th></tr></thead><tbody>${items.map((item) => `<tr data-feedback-id="${escapeHtml(item.feedback_id)}" data-feedback-task="${escapeHtml(item.source_task_id)}"><td class="queue-number">${item.queue_position}</td><td class="task-title-cell">${escapeHtml(item.original_feedback)}</td><td>${escapeHtml(item.source_task_id)}</td><td>${escapeHtml(item.progress)}</td><td><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></td></tr>`).join("")}</tbody></table>`;
  els.feedbackQueueTable.querySelectorAll("[data-feedback-id]").forEach((row) => row.addEventListener("click", () => {
    const item = items.find((entry) => entry.feedback_id === row.dataset.feedbackId);
    const task = state.snapshot.tasks.find((entry) => String(entry.id) === String(row.dataset.feedbackTask));
    if (item?.current_run_id || item?.source_run_id) openWorkbench("review", item.current_run_id || item.source_run_id, { task, feedbackId: item.feedback_id });
    else openTaskBrowser(task?.state || "completed", task?.id || row.dataset.feedbackTask);
  }));
}

function renderAttention(blockedPendingTasks = []) {
  const attention = state.snapshot.attention_items.find(scopedTaskFilter);
  const recovery = state.snapshot.recovery_items.find(scopedTaskFilter);
  const blocked = blockedPendingTasks.find((task) => task.eligibility_code === "project_not_participating") || blockedPendingTasks[0];
  if (!attention && !recovery && state.snapshot.enabled && blocked) {
    const project = state.snapshot.projects.find((item) => String(item.id) === String(blocked.project_id));
    const canEnable = blocked.eligibility_code === "project_not_participating" && project?.local_project_id;
    els.attentionHost.innerHTML = `<div class="attention-strip"><span>!</span><div class="attention-copy"><strong>${blockedPendingTasks.length} 项待处理尚不可领取</strong><p>${escapeHtml(blocked.eligibility_reason)}；${escapeHtml(project?.name || blocked.project_name || blocked.project_id)} 不会进入自动领取队列。</p></div>${canEnable ? `<button id="enableBlockedProjectButton" class="primary-button" type="button">允许此项目自动领取</button>` : `<button id="configureBlockedProjectButton" class="primary-button" type="button">配置项目</button>`}</div>`;
    const button = document.getElementById(canEnable ? "enableBlockedProjectButton" : "configureBlockedProjectButton");
    button.addEventListener("click", () => runAction(async () => {
      if (canEnable) {
        await api.setProjectParticipation(project.id, true);
        await refreshSnapshot();
        return;
      }
      els.projectBindingList.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    return;
  }
  if (!attention && !recovery) {
    els.attentionHost.innerHTML = `<div class="attention-strip"><span>✓</span><div class="attention-copy"><strong>当前无需处理</strong><p>Chat 保持按需隐藏，自动化可以继续运行。</p></div></div>`;
    return;
  }
  if (recovery) {
    els.attentionHost.innerHTML = `<div class="attention-strip danger"><span>!</span><div class="attention-copy"><strong>${escapeHtml(RECOVERY_LABELS[recovery.type] || "需要恢复")}</strong><p>${escapeHtml(recovery.message)}</p></div><button id="openRecoveryButton" class="primary-button" type="button">进入恢复中心</button></div>`;
    document.getElementById("openRecoveryButton").addEventListener("click", () => showPage("recovery"));
    return;
  }
  els.attentionHost.innerHTML = `<div class="attention-strip"><span>?</span><div class="attention-copy"><strong>${escapeHtml(attention.reason || "Runtime 需要人工判断")}</strong><p>${escapeHtml(attention.question || "查看请求并提供处理结果。")}</p></div><button id="openAttentionButton" class="primary-button" type="button">处理</button></div>`;
  document.getElementById("openAttentionButton").addEventListener("click", () => openWorkbench("intervention"));
}

function renderCurrentRun(blockedPendingTasks = []) {
  const active = state.snapshot.active_task;
  const run = state.snapshot.active_run;
  if (!active || (state.selectedProjectId !== "all" && String(active.project_id) !== state.selectedProjectId)) {
    els.currentRunPanel.innerHTML = `<div class="run-empty"><div><strong>没有活动任务</strong><p>${state.snapshot.queue.length ? "自动化将从下一队列领取一项任务。" : blockedPendingTasks.length ? "存在待处理任务，但项目尚未满足自动执行条件。" : "同步后继续监听待处理任务。"}</p></div></div>`;
    els.currentRunActions.innerHTML = "";
    return;
  }
  const phases = runtimeStages(active.phase, run);
  const executionRef = active.case_id || active.run_id || "等待 Runtime 启动";
  els.currentRunPanel.innerHTML = `<div class="run-heading"><div><h3>${escapeHtml(active.task_title || active.task_id)}</h3><p>${escapeHtml(active.project_id)} · ${escapeHtml(executionRef)}</p></div><span class="status-pill in_progress">${escapeHtml(automationPhaseLabel(active.phase))}</span></div><div class="stage-grid">${phases.map((phase) => `<div class="stage-item ${phase.state}">${escapeHtml(phase.label)}</div>`).join("")}</div>`;
  if (active.phase === "cli_handoff") {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="reopenCliButton" class="text-button" type="button">重新打开终端</button><button id="resumeRuntimeButton" class="primary-button" type="button">恢复自动执行</button>`;
  } else if (active.phase === "switching_to_cli") {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button class="secondary-button" type="button" disabled>正在安全切换…</button>`;
  } else if (["starting", "running", "continuing"].includes(active.phase)) {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="handoffCliButton" class="primary-button" type="button">切换到 Codex CLI</button><button id="stopRunButton" class="secondary-button" type="button">停止当前运行</button>`;
  } else {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button>`;
  }
  document.getElementById("reviewRunButton").addEventListener("click", () => openWorkbench("review"));
  document.getElementById("handoffCliButton")?.addEventListener("click", () => runAction(async () => {
    await api.handoffAutomationToCli();
    await refreshSnapshot();
  }));
  document.getElementById("reopenCliButton")?.addEventListener("click", () => runAction(async () => {
    await api.reopenAutomationCli();
    await refreshSnapshot();
  }));
  document.getElementById("resumeRuntimeButton")?.addEventListener("click", () => runAction(async () => {
    await api.resumeAutomationRuntime();
    await refreshSnapshot();
  }));
  document.getElementById("stopRunButton")?.addEventListener("click", () => runAction(async () => {
    if (!window.confirm("停止请求会在安全停止点中断 Runtime，远端任务仍保持进行中。继续吗？")) return;
    await api.stopAutomationRun();
    await refreshSnapshot();
    showPage("recovery");
  }));
}

function renderQueue(queue, blockedPendingTasks = []) {
  if (queue.length === 0) {
    els.queueTable.innerHTML = `<div class="empty-state">${blockedPendingTasks.length ? `${blockedPendingTasks.length} 项待处理被项目执行条件阻止，请先完成上方提示。` : "当前范围没有符合资格的待处理任务。"}</div>`;
    return;
  }
  els.queueTable.innerHTML = `<table class="data-table"><colgroup><col style="width:42px"><col><col style="width:130px"><col style="width:76px"><col style="width:100px"></colgroup><thead><tr><th>#</th><th>任务</th><th>项目</th><th>优先级</th><th>状态</th></tr></thead><tbody>${queue.slice(0, 8).map((task) => `<tr data-queue-task="${escapeHtml(task.id)}"><td class="queue-number">${task.queue_position}</td><td class="task-title-cell">${escapeHtml(task.title)}</td><td>${escapeHtml(task.project_name)}</td><td>${formatPriority(task.priority)}</td><td><span class="status-pill pending">待处理</span></td></tr>`).join("")}</tbody></table>`;
  els.queueTable.querySelectorAll("[data-queue-task]").forEach((row) => row.addEventListener("click", () => openTaskBrowser("pending", row.dataset.queueTask)));
}

function renderRecentCompletions() {
  const items = state.snapshot.recent_completions.filter(scopedTaskFilter).slice(0, 5);
  els.recentCompletions.innerHTML = items.length ? items.map((item) => `<button class="completion-item" data-completion-run="${escapeHtml(item.run_id)}" type="button"><span><strong>${escapeHtml(item.title || item.task_id)}</strong><small>${escapeHtml(item.project_id)} · ${formatDateTime(item.completed_at)}</small></span><span class="status-pill completed">已完成</span></button>`).join("") : `<div class="empty-state">暂无由自动化完成的任务。</div>`;
  els.recentCompletions.querySelectorAll("[data-completion-run]").forEach((button) => button.addEventListener("click", () => {
    const completion = items.find((item) => item.run_id === button.dataset.completionRun);
    const task = state.snapshot.tasks.find((item) => String(item.id) === String(completion?.task_id));
    openWorkbench("review", button.dataset.completionRun, { task });
  }));
}

function renderCommandInspector(projects) {
  const snapshot = state.snapshot;
  els.projectSourceSummary.innerHTML = factRows([
    ["任务源", sourceStatusLabel(snapshot.source_status)],
    ["认证用户", snapshot.user?.name || "未确认"],
    ["远端项目", String(projects.length)],
    ["最近同步", snapshot.synced_at ? formatDateTime(snapshot.synced_at) : "尚未同步"]
  ]);
  els.executionBoundary.innerHTML = factRows([
    ["自动领取总闸", snapshot.enabled ? snapshot.queue_paused ? "已开启 · 暂停领取" : "已开启" : "已关闭"],
    ["活动任务", snapshot.active_task?.task_id || "无"],
    ["当前责任方", snapshot.attention_items.length
      ? "Human"
      : snapshot.active_task?.phase === "cli_handoff"
        ? "Codex CLI"
        : snapshot.active_task?.phase === "remote_completion_pending"
          ? "Automation Coordinator / 任务源"
          : snapshot.active_task ? "Runtime" : "Automation Coordinator"],
    ["并发边界", "单活动任务"]
  ]);
  els.projectBindingList.innerHTML = projects.length ? projects.map((project) => {
    const options = [`<option value="">未绑定</option>`, ...snapshot.local_projects.map((local) => `<option value="${escapeHtml(local.id)}" ${local.id === project.local_project_id ? "selected" : ""}>${escapeHtml(local.name)}</option>`)].join("");
    const qualification = !project.local_project_id ? "先绑定工作区" : project.participating ? project.source_status === "healthy" ? "已具备资格" : project.source_status : "尚未允许";
    return `<div class="binding-row" data-binding-project="${escapeHtml(project.id)}"><strong>${escapeHtml(project.name)}</strong><select aria-label="${escapeHtml(project.name)} 本地工作区">${options}</select><label class="participation-row"><input type="checkbox" ${project.participating ? "checked" : ""} ${project.local_project_id ? "" : "disabled"}>允许自动领取 · ${escapeHtml(qualification)}</label></div>`;
  }).join("") : `<div class="empty-state">同步后可绑定远端项目。</div>`;
  els.projectBindingList.querySelectorAll("[data-binding-project]").forEach((row) => {
    const remoteId = row.dataset.bindingProject;
    const select = row.querySelector("select");
    const checkbox = row.querySelector("input[type=checkbox]");
    select.addEventListener("change", () => runAction(async () => {
      await api.bindAutomationProject(remoteId, select.value);
      await refreshSnapshot();
    }));
    checkbox.addEventListener("change", () => runAction(async () => {
      await api.setProjectParticipation(remoteId, checkbox.checked);
      await refreshSnapshot();
    }));
  });
}

function renderTaskBrowser() {
  els.taskBrowserHeading.textContent = STATE_LABELS[state.selectedState];
  els.taskBrowserSummary.textContent = `${currentProject()?.name || "所有项目"} · ${state.snapshot.tasks.length} 项 · 选择只改变观察范围`;
  els.taskSnapshotTime.textContent = state.snapshot.synced_at ? `服务器快照 ${formatDateTime(state.snapshot.synced_at)}` : "尚未同步";
  els.taskFilterInput.value = state.taskFilter;
  renderTaskTable();
  renderTaskInspector();
}

function renderTaskTable() {
  const tasks = state.snapshot.tasks.filter((task) => !state.taskFilter || `${task.title} ${task.content} ${task.project_name} ${task.id}`.toLowerCase().includes(state.taskFilter));
  if (!tasks.length) {
    els.taskTable.innerHTML = `<div class="empty-state">当前筛选没有${STATE_LABELS[state.selectedState]}任务。</div>`;
    return;
  }
  els.taskTable.innerHTML = `<table class="data-table"><colgroup><col style="width:90px"><col><col style="width:130px"><col style="width:96px"><col style="width:86px"></colgroup><thead><tr><th>任务</th><th>内容</th><th>项目</th><th>更新时间</th><th>状态</th></tr></thead><tbody>${tasks.map((task) => `<tr class="${String(task.id) === String(state.selectedTaskId) ? "selected" : ""}" data-task-id="${escapeHtml(task.id)}"><td>${escapeHtml(task.id)}</td><td class="task-title-cell">${escapeHtml(task.title)}</td><td>${escapeHtml(task.project_name)}</td><td>${formatTime(task.updated_at || task.state_changed_at)}</td><td><span class="status-pill ${task.state}">${escapeHtml(task.state_label)}</span></td></tr>`).join("")}</tbody></table>`;
  els.taskTable.querySelectorAll("[data-task-id]").forEach((row) => row.addEventListener("click", () => {
    state.selectedTaskId = row.dataset.taskId;
    renderTaskTable();
    renderTaskInspector();
  }));
}

function renderTaskInspector() {
  const task = selectedTask();
  if (!task) {
    els.taskInspector.innerHTML = `<div class="empty-state">选择任务查看详情与允许操作。</div>`;
    return;
  }
  const feedbackItems = task.acceptance_feedback_items || [];
  const acceptanceFeedback = ["completed", "accepted"].includes(task.state) ? `<section class="acceptance-feedback-panel"><div class="section-title-row"><div><h3>验收问题与进展</h3><p>${feedbackItems.length} 项独立反馈</p></div></div><div class="acceptance-feedback-list">${feedbackItems.length ? feedbackItems.map((item) => `<button class="acceptance-feedback-item" data-task-feedback="${escapeHtml(item.feedback_id)}" type="button"><span><strong>${escapeHtml(item.original_feedback)}</strong><small>${escapeHtml(item.feedback_id)} · ${escapeHtml(item.progress)}</small></span><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></button>`).join("") : `<div class="empty-state compact">尚未提交验收问题。</div>`}</div><label class="acceptance-feedback-composer"><span>提交验收问题</span><textarea id="acceptanceFeedbackInput" rows="3" placeholder="描述验收中发现的问题…"></textarea><small>来源待办保持${task.state_label}；反馈进入独立队列并复用同一 Agent 对话。</small><button id="submitAcceptanceFeedbackButton" class="primary-button" type="button">提交验收问题</button></label></section>` : "";
  els.taskInspector.innerHTML = `<h2>${escapeHtml(task.title)}</h2><p>${escapeHtml(task.content || "没有补充内容")}</p><span class="status-pill ${task.state}">${escapeHtml(task.state_label)}</span>${factRows([
    ["任务标识", task.id],
    ["所属项目", task.project_name],
    ["本地工作区", task.local_project_path || "未绑定"],
    ["自动执行资格", task.eligible ? `队列第 ${task.queue_position} 项` : task.eligibility_reason || "不适用于当前状态"],
    ["服务器版本", task.version || "未提供"]
  ])}<div id="taskActions" class="task-actions"></div>${acceptanceFeedback}`;
  const actions = taskActions(task);
  document.getElementById("taskActions").innerHTML = actions.map((action) => `<button class="${action.primary ? "primary-button" : "secondary-button"}" data-task-action="${action.id}" type="button">${action.label}</button>`).join("");
  document.getElementById("taskActions").querySelectorAll("[data-task-action]").forEach((button) => button.addEventListener("click", () => runAction(() => executeTaskAction(task, button.dataset.taskAction))));
  els.taskInspector.querySelectorAll("[data-task-feedback]").forEach((button) => button.addEventListener("click", () => {
    const item = feedbackItems.find((entry) => entry.feedback_id === button.dataset.taskFeedback);
    if (item) openWorkbench("review", item.current_run_id || item.source_run_id, { task, feedbackId: item.feedback_id });
  }));
  document.getElementById("submitAcceptanceFeedbackButton")?.addEventListener("click", () => runAction(async () => {
    const input = document.getElementById("acceptanceFeedbackInput");
    const message = input.value.trim();
    if (!message) throw new Error("请先描述验收问题。");
    const key = globalThis.crypto?.randomUUID?.() || `${task.id}-${Date.now()}`;
    await api.submitAcceptanceFeedback({ taskId: task.id, message, idempotencyKey: key });
    input.value = "";
    await refreshSnapshot();
  }));
}

async function executeTaskAction(task, action) {
  if (action === "review") {
    const completion = state.snapshot.recent_completions.find((item) => String(item.task_id) === String(task.id));
    return openWorkbench("review", completion?.run_id || "", { task });
  }
  const transitions = {
    confirm: ["pending", "pending_review"],
    accept: ["accepted", "completed"],
    cancel: ["cancelled", task.state],
    block: ["blocked", "in_progress"],
    resume: ["pending", "blocked"]
  };
  const transition = transitions[action];
  if (!transition) return;
  if (["cancel", "block", "resume"].includes(action) && !window.confirm(`确认将任务 ${task.id} 更新为${STATE_LABELS[transition[0]]}？`)) return;
  await api.updateAutomationTaskState({ taskId: task.id, state: transition[0], expectedState: transition[1] });
  await refreshSnapshot();
}

async function openWorkbench(mode = "review", runId = "", context = {}) {
  state.workbenchMode = mode;
  state.workbenchCompletion = runId
    ? state.snapshot.recent_completions.find((item) => item.run_id === runId) || null
    : null;
  state.workbenchTask = context.task || null;
  state.workbenchFeedbackId = context.feedbackId || "";
  state.workbenchRun = runId && state.snapshot.active_run?.id !== runId
    ? (await api.listRuns({})).find((run) => run.id === runId) || null
    : null;
  state.transcriptSessionId = "";
  state.transcriptFollowingLatest = true;
  await loadTranscript({ force: true });
  showPage("workbench");
}

async function loadTranscript({ force = false } = {}) {
  const active = state.snapshot.active_task;
  const run = state.workbenchRun || state.snapshot.active_run;
  const localProjectId = state.workbenchTask?.local_project_id || state.workbenchCompletion?.local_project_id || active?.local_project_id || run?.project_id || "";
  if (!localProjectId || !run?.session_id) {
    state.transcript = [];
    state.transcriptSessionId = "";
    state.transcriptSessionMessages = [];
    state.transcriptRuns = [];
    return;
  }
  const taskId = state.workbenchTask?.id || state.workbenchCompletion?.task_id || active?.task_id || "";
  const sessionKey = `${localProjectId}:${run.session_id}:${taskId}`;
  if (force || state.transcriptSessionId !== sessionKey) {
    const [messages, runs] = await Promise.all([
      api.listMessages(localProjectId, run.session_id),
      api.listRuns({ projectId: localProjectId, sessionId: run.session_id })
    ]);
    state.transcriptSessionId = sessionKey;
    state.transcriptSessionMessages = messages.filter((message) => !message.task_id || String(message.task_id) === String(taskId));
    state.transcriptRuns = runs.filter((item) => !item.task_id || String(item.task_id) === String(taskId));
  }
  const currentRunIndex = state.transcriptRuns.findIndex((item) => item.id === run.id);
  if (currentRunIndex >= 0) state.transcriptRuns[currentRunIndex] = run;
  else state.transcriptRuns.push(run);
  const projectedMessages = state.transcriptRuns.flatMap((item) => (
    Array.isArray(item.activity?.messages) ? item.activity.messages : []
  ));
  const sessionMessages = projectedMessages.length
    ? state.transcriptSessionMessages.filter((message) => message.role === "user")
    : state.transcriptSessionMessages;
  const byId = new Map();
  for (const message of [...sessionMessages, ...projectedMessages]) {
    if (message.task_id && String(message.task_id) !== String(taskId)) continue;
    byId.set(`${message.run_id || "session"}:${message.id}`, message);
  }
  state.transcript = [...byId.values()]
    .filter(isTranscriptMessageVisible)
    .sort((left, right) => (
      String(left.created_at || left.updated_at || "").localeCompare(String(right.created_at || right.updated_at || ""))
    ));
}

function renderWorkbench() {
  const active = state.snapshot.active_task;
  const completion = state.workbenchCompletion;
  const sourceTask = state.workbenchTask || (completion ? state.snapshot.tasks.find((item) => String(item.id) === String(completion.task_id)) : null);
  const feedbackItem = sourceTask?.acceptance_feedback_items?.find((item) => item.feedback_id === state.workbenchFeedbackId) || null;
  const run = state.workbenchRun || state.snapshot.active_run;
  const activity = run?.activity || {};
  const attention = state.snapshot.attention_items.find((item) => !active || item.task_id === active.task_id);
  const taskId = sourceTask?.id || completion?.task_id || active?.task_id || "";
  const projectId = sourceTask?.project_id || completion?.project_id || active?.project_id || "";
  const acceptanceReview = Boolean(sourceTask && ["completed", "accepted"].includes(sourceTask.state));
  els.workbenchTitle.textContent = sourceTask?.title || completion?.title || active?.task_title || "执行对话审查";
  els.workbenchMode.className = `status-pill ${state.workbenchMode === "intervention" ? "pending" : acceptanceReview ? "completed" : "pending_review"}`;
  els.workbenchMode.textContent = state.workbenchMode === "intervention" ? "人工处理" : acceptanceReview ? "验收反馈" : "只读审查";
  els.interventionComposer.classList.toggle("hidden", state.workbenchMode !== "intervention" && !acceptanceReview);
  els.interveneCurrentButton.classList.toggle("hidden", state.workbenchMode === "intervention" || !active || Boolean(completion) || acceptanceReview);
  els.interventionInput.disabled = state.interventionSubmitting;
  els.submitInterventionButton.disabled = state.interventionSubmitting;
  els.interventionInput.placeholder = acceptanceReview ? "描述新的验收问题…" : "提供授权、事实或决策，并说明恢复条件…";
  els.submitInterventionButton.textContent = state.interventionSubmitting ? "正在提交…" : acceptanceReview ? "提交验收问题" : "提交并恢复自动化";
  const selectedGap = activity.controller_frame?.selected_gap || null;
  const sourceFacts = activity.artifact_ownership_scan?.source_facts_changed || [];
  const implementationEvidence = activity.artifact_ownership_scan?.implementation_evidence || [];
  const taskSessionId = completion?.session_id || active?.session_id || run?.session_id || "";
  const tokenUsage = activity.token_usage?.summary || {};
  const cachedShare = tokenUsage.input_tokens > 0
    ? tokenUsage.cached_input_tokens / tokenUsage.input_tokens
    : 0;
  const usageWarnings = Array.isArray(activity.usage_warnings) ? activity.usage_warnings : [];
  const contextCompactions = Array.isArray(activity.context_compactions) ? activity.context_compactions : [];
  const performance = activity.performance || {};
  const slowestCommand = [...(performance.commands || [])].sort((left, right) => Number(right.duration_ms || 0) - Number(left.duration_ms || 0))[0] || null;
  const usageBaseline = state.snapshot.usage_baseline || {};
  els.workbenchContext.innerHTML = taskId ? factRows([
    ["任务", taskId],
    ["Task Session", taskSessionId || "未建立"],
    ["远端项目", projectId],
    ["本地工作区", active?.local_project_path || completion?.local_project_id || "已归档"],
    ["审查范围", acceptanceReview ? "历史执行只读 · 可新增验收反馈" : completion ? "历史完成 Run · 只读" : state.workbenchMode === "intervention" ? "当前 Run · 人工处理" : "当前 Run · 只读"],
    ["验收反馈", acceptanceReview ? `${sourceTask.acceptance_feedback_items?.length || 0} 项${feedbackItem ? ` · 当前 ${feedbackItem.feedback_id}` : ""}` : "不适用"],
    ["Selected Gap", selectedGap?.id || "尚未选择"],
    ["已加载事实", `${sourceFacts.length} 项源事实 · ${implementationEvidence.length} 项实现证据`],
    ["执行边界", activity.controller_frame?.round_goal || run?.task || "由当前任务与 Case 限定"],
    ["人工请求", completion ? "不适用" : attention?.reason || "无"],
    ["恢复条件", completion ? "只读审查不改变任务状态" : attention?.question || "返回自动化观察"]
  ]) : `<div class="empty-state">没有可审查的任务上下文。</div>`;
  const messages = state.transcript.length
    ? state.transcript.map(renderConversationMessage).join("")
    : `<div class="empty-state compact">当前没有已加载的对话。Chat 仅在 Runtime 产生 transcript 后出现。</div>`;
  const previousScrollTop = els.transcriptList.scrollTop;
  const shouldFollowLatest = state.transcriptFollowingLatest || isTranscriptNearBottom();
  els.transcriptList.innerHTML = messages;
  if (shouldFollowLatest) scrollTranscriptToLatest();
  else els.transcriptList.scrollTop = previousScrollTop;
  updateJumpToLatestButton();
  els.workbenchEvidence.innerHTML = factRows([
    ["Run", run?.id || "无"],
    ["Run 状态", run?.status || "未启动"],
    ["远端任务", sourceTask?.state_label || (completion ? "已完成" : active?.phase || "无活动任务")],
    ["当前步骤", activity.current_step || "无"],
    ["Codex Thread", activity.thread_id || active?.thread_id || "尚未绑定"],
    ["Agent Loop", activity.agent_loop_result?.summary || "尚未收束"],
    ["Token 逻辑总量", formatTokenCount(tokenUsage.logical_total_tokens)],
    ["缓存输入", `${formatTokenCount(tokenUsage.cached_input_tokens)} · ${formatPercent(cachedShare)}`],
    ["非缓存输入", formatTokenCount(tokenUsage.uncached_input_tokens)],
    ["输出 / Reasoning", `${formatTokenCount(tokenUsage.output_tokens)} / ${formatTokenCount(tokenUsage.reasoning_output_tokens)}`],
    ["上下文峰值", formatPercent(activity.token_usage?.max_context_utilization || 0)],
    ["用量软提示", usageWarnings.length ? `${usageWarnings.length} 项 · ${usageWarnings.at(-1)?.message || "查看诊断证据"}` : "无"],
    ["上下文压缩", contextCompactions.length ? `${contextCompactions.length} 次 · ${contextCompactions.at(-1)?.status || "未知"}` : "尚未触发"],
    ["模型 Turn 耗时", formatDuration(performance.model_time_ms)],
    ["命令累计耗时", formatDuration(performance.command_time_ms)],
    ["最慢命令", slowestCommand ? `${formatDuration(slowestCommand.duration_ms)} · ${slowestCommand.command || slowestCommand.item_id}` : "无"],
    ["历史基线", usageBaseline.sample_size ? `${usageBaseline.sample_size} 个 Run 中位数 · ${formatTokenCount(usageBaseline.logical_total_tokens)}` : "尚无可比 Run"],
    ["相对历史中位数", usageBaseline.logical_total_tokens > 0 ? `${(Number(tokenUsage.logical_total_tokens || 0) / usageBaseline.logical_total_tokens).toFixed(2)}×` : "待积累"],
    ["验证", activity.validation_valid === true ? "有效" : activity.validation_valid === false ? "失败" : "未确认"],
    ["Gate", activity.gate_result?.parsed?.allowed === true ? "允许" : activity.gate_result?.parsed?.allowed === false ? "阻止" : "未执行"],
    ["Ledger", activity.ledger_write_result?.parsed?.written ? "已写回" : "未确认"],
    ["Git 收尾", activity.closeout_result?.status === "completed" ? activity.closeout_result?.outcome || "已完成" : activity.closeout_result?.status || "未开始"],
    ["影响", `${activity.artifact_ownership_scan?.classified?.length || 0} 个已分类 artifact`],
    ["执行消息", `${activity.messages?.length || 0} 条 · ${activity.artifact_paths?.messages_file ? "已归档" : "未归档"}`]
  ]);
}

function renderConversationMessage(message) {
  const type = transcriptMessageType(message);
  if (type === "tool") return renderToolActivity(message);
  if (type === "loop") return renderLoopStatus(message);
  if (type === "reasoning") return renderReasoningDisclosure(message);
  if (type === "structured") return renderStructuredResult(message);
  const label = type === "user" ? "你" : message.actor_label || "Agent";
  const status = message.status || "completed";
  return `<article class="message ${type}-message status-${escapeHtml(status)}"><div class="message-head"><span><b>${escapeHtml(label)}</b>${message.kind ? `<em>${escapeHtml(message.kind)}</em>` : ""}</span><time>${formatTime(message.updated_at || message.created_at)}</time></div><p>${escapeHtml(message.content)}</p></article>`;
}

function renderReasoningDisclosure(message) {
  const status = message.status || "completed";
  const streaming = ["streaming", "started", "running", "in_progress"].includes(status);
  return `<details class="reasoning-disclosure status-${escapeHtml(status)}"${streaming ? " open" : ""}><summary><span><span class="activity-glyph" aria-hidden="true">${statusGlyph(status)}</span><b>${streaming ? "思考中" : "思考过程"}</b></span><time>${formatTime(message.updated_at || message.created_at)}</time></summary><div class="reasoning-content">${escapeHtml(message.content)}</div></details>`;
}

function renderStructuredResult(message) {
  const status = message.status || "completed";
  const presentation = structuredResultPresentation(message);
  const fields = presentation.fields.length
    ? `<dl class="structured-result-fields">${presentation.fields.map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd>${field.values.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</dd></div>`).join("")}</dl>`
    : `<p class="structured-result-pending">结构化字段生成中…</p>`;
  const raw = presentation.raw
    ? `<details class="structured-result-raw"><summary>查看原始 JSON</summary><pre>${escapeHtml(presentation.raw)}</pre></details>`
    : "";
  return `<details class="structured-result status-${escapeHtml(status)}"><summary><span><span class="activity-glyph" aria-hidden="true">${statusGlyph(status)}</span><b>${escapeHtml(presentation.title)}</b><em>${escapeHtml(presentation.schema_version)}</em></span><time>${formatTime(message.updated_at || message.created_at)}</time></summary><div class="structured-result-body">${fields}${raw}</div></details>`;
}

function renderLoopStatus(message) {
  const status = message.status || "completed";
  return `<article class="loop-status status-${escapeHtml(status)}"><span class="activity-glyph" aria-hidden="true">${statusGlyph(status)}</span><span class="loop-status-copy"><b>Loop</b><span>${escapeHtml(summarizeLoopStatus(message))}</span></span><time>${formatTime(message.updated_at || message.created_at)}</time></article>`;
}

function renderToolActivity(message) {
  const status = message.status || "completed";
  const summary = summarizeToolActivity(message);
  return `<article class="tool-activity status-${escapeHtml(status)}" title="${escapeHtml(summary)}"><span class="activity-glyph" aria-hidden="true">${statusGlyph(status)}</span><span class="tool-activity-label">Tool</span><span class="tool-activity-summary">${escapeHtml(summary)}</span><time>${formatTime(message.updated_at || message.created_at)}</time></article>`;
}

function isTranscriptNearBottom() {
  return els.transcriptList.scrollHeight - els.transcriptList.scrollTop - els.transcriptList.clientHeight < 72;
}

function handleTranscriptScroll() {
  state.transcriptFollowingLatest = isTranscriptNearBottom();
  updateJumpToLatestButton();
}

function scrollTranscriptToLatest({ behavior = "auto" } = {}) {
  state.transcriptFollowingLatest = true;
  els.transcriptList.scrollTo({ top: els.transcriptList.scrollHeight, behavior });
  updateJumpToLatestButton();
}

function updateJumpToLatestButton() {
  els.jumpToLatestButton.classList.toggle("hidden", state.transcriptFollowingLatest || isTranscriptNearBottom());
}

function renderRecovery() {
  const items = state.snapshot.recovery_items;
  if (!items.length) {
    els.recoveryList.innerHTML = `<div class="panel-card empty-state"><div><strong>没有待恢复事项</strong><p>服务器事实、本地 Runtime 与队列状态一致。</p></div></div>`;
    return;
  }
  els.recoveryList.innerHTML = items.map((item) => `<article class="recovery-card"><div class="recovery-marker"></div><div class="recovery-body"><h2>${escapeHtml(RECOVERY_LABELS[item.type] || item.type)}</h2><p>${escapeHtml(item.message)}</p><div class="recovery-meta"><span>任务 ${escapeHtml(item.task_id)}</span><span>冻结范围 ${escapeHtml(item.freeze_scope)}</span><span>责任方 ${escapeHtml(item.responsibility === "operator" ? "Runtime 操作员" : item.responsibility)}</span></div>${item.actions.includes("feedback_continue") ? `<div class="recovery-feedback"><label for="feedback-${escapeHtml(item.id)}">补充给 Agent 的反馈</label><textarea id="feedback-${escapeHtml(item.id)}" data-recovery-feedback="${escapeHtml(item.id)}" rows="3" placeholder="补充事实、纠正方向或说明希望 Agent 如何继续…"></textarea><small>反馈会发送到当前任务的同一 Agent 对话，并在对话页面保留。</small></div>` : ""}<div class="recovery-actions">${item.actions.map((action) => `<button class="${action === "mark_blocked" ? "secondary-button" : "primary-button"}" data-recovery-id="${escapeHtml(item.id)}" data-recovery-action="${escapeHtml(action)}" type="button">${escapeHtml(RECOVERY_ACTION_LABELS[action] || action)}</button>`).join("")}</div></div></article>`).join("");
  els.recoveryList.querySelectorAll("[data-recovery-action]").forEach((button) => button.addEventListener("click", () => runAction(async () => {
    const action = button.dataset.recoveryAction;
    if (action === "mark_blocked" && !window.confirm("标记阻塞会更新远端任务状态并释放活动任务。继续吗？")) return;
    const feedback = action === "feedback_continue"
      ? els.recoveryList.querySelector(`[data-recovery-feedback="${CSS.escape(button.dataset.recoveryId)}"]`)?.value || ""
      : "";
    await api.resolveAutomationRecovery({ recoveryId: button.dataset.recoveryId, action, message: feedback });
    await refreshSnapshot();
    if (action === "feedback_continue") await openWorkbench("review");
    else if (!state.snapshot.recovery_items.length) showPage("command");
  })));
}

function openTaskBrowser(taskState = "pending", taskId = "") {
  state.selectedState = TASK_STATES.includes(taskState) ? taskState : "pending";
  state.selectedTaskId = taskId;
  state.page = "tasks";
  refreshSnapshot().catch((error) => showToast(error.message));
}

function showPage(page) {
  state.page = page;
  if (page === "tasks") {
    refreshSnapshot().catch((error) => showToast(error.message));
    return;
  }
  render();
}

async function openSettings({ loginGate = false } = {}) {
  const [settings, authentication] = await Promise.all([api.getSettings(), api.getAuthStatus()]);
  state.settings = normalizeSettings(settings);
  state.authentication = normalizeAuthentication(authentication);
  state.loginGate = loginGate || state.authentication.status === "logged_out";
  setAuthFeedback("");
  renderSettingsForm();
  renderSettingsSurface();
  els.settingsOverlay.classList.remove("hidden");
  document.body.classList.remove("auth-pending");
}

function closeSettings({ force = false } = {}) {
  if (state.loginGate && !force) return;
  els.settingsOverlay.classList.add("hidden");
  els.settingsOverlay.classList.remove("login-gate");
  state.loginGate = false;
}

function routeAuthentication() {
  if (state.authentication.status === "logged_out") {
    showLoginGate();
    return;
  }
  document.body.classList.remove("auth-pending");
  if (state.loginGate) closeSettings({ force: true });
  else if (!els.settingsOverlay.classList.contains("hidden")) renderAuthPanel();
}

function showLoginGate() {
  state.loginGate = true;
  renderSettingsForm();
  renderSettingsSurface();
  els.settingsOverlay.classList.remove("hidden");
  document.body.classList.remove("auth-pending");
}

function renderSettingsSurface() {
  els.settingsOverlay.classList.toggle("login-gate", state.loginGate);
  if (state.loginGate) {
    els.settingsPanel.removeAttribute("role");
    els.settingsPanel.removeAttribute("aria-modal");
  } else {
    els.settingsPanel.setAttribute("role", "dialog");
    els.settingsPanel.setAttribute("aria-modal", "true");
  }
  els.settingsEyebrow.textContent = state.loginGate ? "WORKSHOP ACCOUNT" : "DESKTOP SETTINGS";
  els.settingsTitle.textContent = state.loginGate ? "登录 Workshop" : "账户与 Runtime";
  els.settingsLead.textContent = state.loginGate ? "登录后同步你的项目与待办，并启动自动化队列。" : "管理 Workshop 账户、任务源与本地 Runtime。";
}

function renderSettingsForm() {
  const settings = state.settings;
  els.taskSourceEnabled.checked = settings.task_source.enabled;
  els.taskSourceBaseUrl.value = settings.task_source.base_url;
  els.taskSourceServiceName.value = settings.task_source.service_name;
  els.taskSourceAuthMode.value = settings.task_source.auth_mode;
  els.taskSourceToken.value = "";
  els.taskSourceToken.placeholder = settings.task_source.access_token_configured ? "已配置；保留为空不修改" : "输入访问令牌";
  els.taskSourceUserId.value = settings.task_source.user_id;
  els.taskSourceUsername.value = settings.task_source.username;
  els.taskSourceAppId.value = settings.task_source.app_id;
  els.taskSourceSessionId.value = settings.task_source.session_id;
  els.codexProxyEnabled.checked = settings.codex_proxy.enabled;
  els.codexProxyUrl.value = settings.codex_proxy.url;
  renderAuthMode();
  renderAuthPanel();
}

function renderAuthMode() {
  els.headerAuthFields.classList.toggle("hidden", els.taskSourceAuthMode.value !== "headers");
  els.tokenAuthFields.classList.toggle("hidden", els.taskSourceAuthMode.value !== "bearer");
}

function renderAuthPanel() {
  const auth = state.authentication;
  const authenticated = auth.authenticated;
  const expired = auth.status === "expired";
  document.querySelectorAll("[data-auth-type]").forEach((button) => button.classList.toggle("is-active", button.dataset.authType === state.authType));
  els.authTargetLabel.textContent = state.authType === "email" ? "邮箱" : "手机号";
  els.authTarget.placeholder = state.authType === "email" ? "name@example.com" : "+86 13800000000";
  els.authStatusPill.className = `account-status ${auth.status}`;
  els.authStatusPill.textContent = { authenticated: "已登录", refreshing: "刷新中", expired: "登录已过期", logged_out: "未登录" }[auth.status] || "未登录";
  els.authIdentity.textContent = authenticated ? auth.masked_identity || auth.identity || "Workshop 用户" : expired ? "请重新登录 Workshop" : "登录后同步你的项目和待办";
  els.authDescription.textContent = authenticated ? "项目和待办将按当前账户同步。" : "验证码和令牌仅由主进程处理。";
  els.authLoginPanel.classList.toggle("hidden", authenticated);
  els.authSessionPanel.classList.toggle("hidden", !authenticated);
  els.authFeedback.textContent = auth.error || state.authFeedback.message;
  els.authFeedback.classList.toggle("error", Boolean(auth.error || state.authFeedback.error));
  els.sendVerificationButton.textContent = state.authBusy.verification ? "正在发送…" : state.verificationCooldown > 0 ? `${state.verificationCooldown} 秒后重试` : "获取验证码";
  els.sendVerificationButton.disabled = state.authBusy.verification || state.verificationCooldown > 0;
  els.loginButton.disabled = state.authBusy.login;
  els.loginButton.textContent = state.authBusy.login ? "正在登录…" : "登录并同步";
  els.logoutButton.disabled = state.authBusy.logout;
  els.logoutButton.textContent = state.authBusy.logout ? "正在退出…" : "退出登录";
}

async function sendVerification() {
  state.authBusy.verification = true;
  setAuthFeedback("");
  renderAuthPanel();
  try {
    const result = await api.sendAuthVerification({ code_type: state.authType, target: els.authTarget.value });
    state.verificationCooldown = Number(result.cooldown_seconds || 60);
    setAuthFeedback(`验证码已发送至 ${result.masked_target || "目标账户"}。`);
    startVerificationCooldown();
  } finally {
    state.authBusy.verification = false;
    renderAuthPanel();
  }
}

async function login() {
  state.authBusy.login = true;
  setAuthFeedback("");
  renderAuthPanel();
  try {
    state.authentication = normalizeAuthentication(await api.loginWithCode({
      code_type: state.authType,
      target: els.authTarget.value,
      code: els.authCode.value
    }));
    state.settings = normalizeSettings(await api.getSettings());
    els.authCode.value = "";
    await refreshSnapshot();
    closeSettings({ force: true });
    showToast(["healthy", "degraded"].includes(state.snapshot.source_status)
      ? "登录成功，项目和待办已同步。"
      : "登录成功，但项目同步未完成，请稍后重试。");
  } finally {
    state.authBusy.login = false;
    renderAuthPanel();
  }
}

async function logout() {
  state.authBusy.logout = true;
  setAuthFeedback("");
  renderAuthPanel();
  try {
    let result = await api.logoutAuth({ confirm_active_task: false });
    if (result.requires_confirmation) {
      const taskName = result.active_task?.task_title || result.active_task?.task_id || "当前任务";
      if (!window.confirm(`退出会安全停止“${taskName}”并清空远端项目快照，继续吗？`)) return;
      result = await api.logoutAuth({ confirm_active_task: true });
    }
    state.authentication = normalizeAuthentication(result.authentication);
    state.settings = normalizeSettings(await api.getSettings());
    state.snapshot = emptySnapshot();
    renderSettingsForm();
    render();
    showLoginGate();
    showToast("已退出 Workshop，远端项目与待办快照已清空。");
  } finally {
    state.authBusy.logout = false;
    renderAuthPanel();
  }
}

function setAuthFeedback(message, error = false) {
  state.authFeedback = { message, error };
  els.authFeedback.textContent = message;
  els.authFeedback.classList.toggle("error", error);
}

function startVerificationCooldown() {
  window.clearInterval(verificationTimer);
  verificationTimer = window.setInterval(() => {
    state.verificationCooldown = Math.max(0, state.verificationCooldown - 1);
    renderAuthPanel();
    if (!state.verificationCooldown) window.clearInterval(verificationTimer);
  }, 1000);
}

async function saveSettings() {
  state.settings = normalizeSettings(await api.updateSettings({
    task_source: {
      enabled: els.taskSourceEnabled.checked,
      base_url: els.taskSourceBaseUrl.value,
      service_name: els.taskSourceServiceName.value,
      auth_mode: els.taskSourceAuthMode.value,
      access_token: els.taskSourceToken.value,
      user_id: els.taskSourceUserId.value,
      username: els.taskSourceUsername.value,
      app_id: els.taskSourceAppId.value,
      session_id: els.taskSourceSessionId.value
    },
    codex_proxy: {
      enabled: els.codexProxyEnabled.checked,
      url: els.codexProxyUrl.value
    }
  }));
  state.authentication = normalizeAuthentication(await api.getAuthStatus());
  closeSettings();
  await api.syncAutomation();
  await refreshSnapshot();
  showToast(!state.authentication.authenticated
    ? "设置已保存，请登录 Workshop 后同步。"
    : ["healthy", "degraded"].includes(state.snapshot.source_status)
      ? "设置已保存并完成同步。"
      : "设置已保存，但任务同步未完成。");
}

function currentProject() {
  return state.selectedProjectId === "all" ? null : state.snapshot.projects.find((project) => String(project.id) === state.selectedProjectId) || null;
}

function selectedTask() {
  return state.snapshot.tasks.find((task) => String(task.id) === String(state.selectedTaskId)) || null;
}

function scopedTaskFilter(item) {
  return state.selectedProjectId === "all" || String(item.project_id) === state.selectedProjectId;
}

function navProject({ id, name, count, warning = false }) {
  return `<button class="nav-item ${String(id) === state.selectedProjectId ? "is-active" : ""} ${warning ? "warning" : ""}" data-project-id="${escapeHtml(id)}" type="button"><span>${String(id) === "all" ? "◆" : "◇"}</span><strong>${escapeHtml(name)}</strong><em>${count}</em></button>`;
}

function metric(label, value, description, className) {
  return `<article class="metric-card ${className}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(description)}</small></article>`;
}

function feedbackTone(status) {
  if (status === "resolved") return "completed";
  if (status === "running") return "in_progress";
  if (["awaiting_human", "blocked"].includes(status)) return "blocked";
  return "pending_review";
}

function factRows(rows) {
  return rows.map(([label, value]) => `<div class="fact-row"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value ?? "")}</strong></div>`).join("");
}

function taskActions(task) {
  if (task.state === "pending_review") return [{ id: "confirm", label: "确认可处理", primary: true }, { id: "cancel", label: "取消" }];
  if (task.state === "pending") return [{ id: "cancel", label: "取消" }];
  if (task.state === "in_progress") return [{ id: "review", label: "查看运行", primary: true }, { id: "block", label: "标记阻塞" }];
  if (task.state === "completed") return [{ id: "review", label: "审查结果" }, { id: "accept", label: "标记已验收", primary: true }];
  if (task.state === "accepted") return [{ id: "review", label: "查看结果与验收反馈", primary: true }];
  if (task.state === "blocked") return [{ id: "resume", label: "返回待处理", primary: true }, { id: "cancel", label: "取消" }];
  return [];
}

function runtimeStages(phase, run) {
  if (["switching_to_cli", "cli_handoff"].includes(phase)) {
    return [
      { label: "1 Runtime 安全停止", state: phase === "switching_to_cli" ? "active" : "complete" },
      { label: "2 CLI 接管", state: phase === "cli_handoff" ? "active" : "" },
      { label: "3 Case 对账", state: "" },
      { label: "4 完成收尾", state: "" }
    ];
  }
  if (phase === "remote_completion_pending") {
    return [
      { label: "1 Case 已完成", state: "complete" },
      { label: "2 变更已提交", state: "complete" },
      { label: "3 等待任务源可用", state: "active" },
      { label: "4 远端收尾", state: "" }
    ];
  }
  const labels = ["1 同步并领取", "2 Agent Gap Loop", "3 Ledger 与上下文", "4 同线程收尾"];
  const closeout = ["closeout_starting", "closeout_running", "remote_completion_pending", "completing"].includes(phase);
  const failed = phase === "recovery";
  return labels.map((label, index) => ({
    label,
    state: failed && index === 1
      ? "error"
      : run?.status === "completed" || (closeout && index < 3) || index === 0
        ? "complete"
        : (closeout && index === 3) || (!closeout && index === 1)
          ? "active"
          : ""
  }));
}

function automationPhaseLabel(phase) {
  return {
    starting: "正在启动",
    running: "自动执行中",
    continuing: "自动续轮",
    switching_to_cli: "正在切换到 CLI",
    cli_handoff: "Codex CLI 接管",
    awaiting_human: "等待人工",
    closeout_starting: "准备同线程收尾",
    closeout_running: "同线程 Git 收尾",
    remote_completion_pending: "Case 已完成，等待远端收尾",
    completing: "完成写回",
    recovery: "需要恢复"
  }[phase] || phase || "进行中";
}

function sourceStatusLabel(value) {
  return {
    logged_out: "未登录",
    unconfigured: "未配置",
    syncing: "同步中",
    healthy: "同步正常",
    degraded: "部分项目异常",
    unauthenticated: "认证失效",
    error: "同步失败"
  }[value] || "未知";
}

function formatPriority(value) {
  const number = Number(value || 0);
  if (number >= 100) return "P0";
  if (number > 0 && number <= 100) return `P${Math.max(0, 100 - number)}`;
  return "普通";
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--" : new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "尚未确认";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatTokenCount(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "0";
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
  return String(Math.round(number));
}

function formatPercent(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? `${(number * 100).toFixed(1)}%` : "0%";
}

function formatDuration(value) {
  const milliseconds = Number(value || 0);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0s";
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function renderSyncing(active) {
  els.syncButton.disabled = active || !state.authentication.authenticated;
  els.syncButton.textContent = active ? "…" : "↻";
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    console.error(error);
    if (!els.settingsOverlay.classList.contains("hidden")) setAuthFeedback(error?.message || String(error), true);
    showToast(error?.message || String(error));
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  toastTimer = window.setTimeout(() => els.toast.classList.add("hidden"), 4200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSettings(value = {}) {
  const defaults = defaultSettings();
  return {
    codex_proxy: { ...defaults.codex_proxy, ...(value.codex_proxy || {}) },
    task_source: { ...defaults.task_source, ...(value.task_source || {}) }
  };
}

function defaultSettings() {
  return {
    codex_proxy: { enabled: false, url: "http://127.0.0.1:7890" },
    task_source: { enabled: true, base_url: "https://api.feitianchengzi.com", service_name: "workshop", auth_mode: "nebula", access_token_configured: false, user_id: "", username: "", app_id: "arckit-runtime", session_id: "" }
  };
}

function normalizeAuthentication(value = {}) {
  return { ...defaultAuthentication(), ...value };
}

function defaultAuthentication() {
  return { status: "logged_out", authenticated: false, identity: "", masked_identity: "", can_refresh: false, error: "" };
}

function emptySnapshot() {
  return {
    enabled: false,
    queue_paused: false,
    source_status: "logged_out",
    source_errors: [],
    synced_at: "",
    user: null,
    local_projects: [],
    projects: [],
    state_counts: Object.fromEntries(TASK_STATES.map((taskState) => [taskState, 0])),
    tasks: [],
    queue: [],
    todo_queue: [],
    blocked_pending_tasks: [],
    acceptance_feedback_queue: [],
    acceptance_feedback_counts: { queued: 0, running: 0, awaiting_human: 0, blocked: 0, resolved: 0, cancelled: 0, open: 0 },
    active_execution: null,
    active_task: null,
    active_run: null,
    attention_items: [],
    recovery_items: [],
    recent_completions: [],
    health: { state: "logged_out", label: "等待登录", tone: "neutral" }
  };
}
