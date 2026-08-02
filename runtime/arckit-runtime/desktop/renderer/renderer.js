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
  safe_stop_requested: "正在安全停止"
};
const RECOVERY_ACTION_LABELS = {
  retry_sync: "重新同步",
  retry_start: "重试同一任务",
  retry_complete: "重试完成写回",
  accept_server_state: "接受服务器事实",
  mark_blocked: "标记为已阻塞"
};

const state = {
  page: "command",
  selectedProjectId: "all",
  selectedState: "pending",
  selectedTaskId: "",
  snapshot: emptySnapshot(),
  settings: defaultSettings(),
  transcript: [],
  workbenchMode: "review",
  workbenchRun: null,
  workbenchCompletion: null,
  interventionSubmitting: false,
  taskFilter: "",
  refreshing: false
};

const els = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map((element) => [element.id, element]));
let refreshQueued = false;
let toastTimer;

boot();

async function boot() {
  wireEvents();
  state.settings = normalizeSettings(await api.getSettings());
  await refreshSnapshot();
  api.onAutomationEvent(() => scheduleRefresh());
  api.onEvent((event) => {
    if (["run.started", "run.finished", "run.event_line", "run.command_result", "message.added"].includes(event.type)) {
      scheduleRefresh(event.type === "run.event_line" ? 250 : 0);
    }
  });
  window.setInterval(() => refreshSnapshot({ quiet: true }), 30_000);
}

function wireEvents() {
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
  els.settingsButton.addEventListener("click", openSettings);
  els.sourceHealthButton.addEventListener("click", () => {
    if (state.snapshot.recovery_items.length > 0) showPage("recovery");
    else openSettings();
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
  els.viewPendingButton.addEventListener("click", () => openTaskBrowser("pending"));
  els.backToCommandButton.addEventListener("click", () => showPage("command"));
  els.backFromWorkbenchButton.addEventListener("click", () => showPage("command"));
  els.backFromRecoveryButton.addEventListener("click", () => showPage("command"));
  els.interveneCurrentButton.addEventListener("click", () => {
    if (!state.snapshot.active_task || state.workbenchCompletion) return;
    state.workbenchMode = "intervention";
    renderWorkbench();
    els.interventionInput.focus();
  });
  els.taskFilterInput.addEventListener("input", () => {
    state.taskFilter = els.taskFilterInput.value.trim().toLowerCase();
    renderTaskTable();
  });
  els.submitInterventionButton.addEventListener("click", () => runAction(async () => {
    const active = state.snapshot.active_task;
    if (!active) throw new Error("当前没有活动任务。");
    state.interventionSubmitting = true;
    renderWorkbench();
    try {
      await api.submitIntervention({ taskId: active.task_id, message: els.interventionInput.value });
      els.interventionInput.value = "";
      await refreshSnapshot();
      showPage("command");
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

async function refreshSnapshot({ quiet = false } = {}) {
  if (state.refreshing) return;
  state.refreshing = true;
  if (!quiet) renderSyncing(true);
  try {
    state.snapshot = await api.automationSnapshot({
      project_id: state.selectedProjectId,
      state: state.page === "tasks" ? state.selectedState : ""
    });
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
}

function renderCommandCenter() {
  const snapshot = state.snapshot;
  const scopedProjects = state.selectedProjectId === "all" ? snapshot.projects : snapshot.projects.filter((project) => String(project.id) === state.selectedProjectId);
  const scopedQueue = state.selectedProjectId === "all" ? snapshot.queue : snapshot.queue.filter((task) => String(task.project_id) === state.selectedProjectId);
  els.commandHeading.textContent = state.selectedProjectId === "all" ? "跨项目自动化态势" : `${currentProject()?.name || "项目"} 自动化态势`;
  els.commandSummary.textContent = `${scopedProjects.length} 个项目 · ${scopedProjects.filter((project) => project.eligible).length} 个可执行 · 最近同步 ${snapshot.synced_at ? formatTime(snapshot.synced_at) : "尚未完成"}`;
  els.healthBadge.className = `health-badge ${snapshot.health?.tone === "success" ? "success" : snapshot.health?.tone === "danger" ? "danger" : snapshot.health?.tone === "warning" ? "warning" : ""}`;
  els.healthBadge.textContent = snapshot.health?.label || "待命";
  els.queuePauseButton.textContent = snapshot.queue_paused ? "恢复队列" : "暂停队列";
  els.queuePauseButton.disabled = !snapshot.enabled;

  const runningCount = snapshot.active_task && (state.selectedProjectId === "all" || String(snapshot.active_task.project_id) === state.selectedProjectId) ? 1 : 0;
  const attentionCount = snapshot.attention_items.filter(scopedTaskFilter).length + snapshot.recovery_items.filter(scopedTaskFilter).length;
  els.metricGrid.innerHTML = [
    metric("自动化健康", snapshot.health?.label || "待命", sourceStatusLabel(snapshot.source_status), snapshot.health?.tone === "success" ? "healthy" : ""),
    metric("需要人工处理", attentionCount, attentionCount ? "队列保持冻结" : "没有待处理人工事项", attentionCount ? "attention" : ""),
    metric("运行中", runningCount, snapshot.active_task?.phase || "没有活动任务", runningCount ? "running" : ""),
    metric("待处理队列", scopedQueue.length, scopedQueue[0] ? `下一项 ${scopedQueue[0].id}` : "没有可执行任务", "")
  ].join("");
  renderAttention();
  renderCurrentRun();
  renderQueue(scopedQueue);
  renderRecentCompletions();
  renderCommandInspector(scopedProjects);
}

function renderAttention() {
  const attention = state.snapshot.attention_items.find(scopedTaskFilter);
  const recovery = state.snapshot.recovery_items.find(scopedTaskFilter);
  if (!attention && !recovery) {
    els.attentionHost.innerHTML = `<div class="attention-strip"><span>✓</span><div class="attention-copy"><strong>当前不需要人工处理</strong><p>Chat 保持按需隐藏，自动化可以继续运行。</p></div></div>`;
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

function renderCurrentRun() {
  const active = state.snapshot.active_task;
  const run = state.snapshot.active_run;
  if (!active || (state.selectedProjectId !== "all" && String(active.project_id) !== state.selectedProjectId)) {
    els.currentRunPanel.innerHTML = `<div class="run-empty"><div><strong>没有活动任务</strong><p>${state.snapshot.queue.length ? "自动化将从下一队列领取一项任务。" : "同步后继续监听待处理任务。"}</p></div></div>`;
    els.currentRunActions.innerHTML = "";
    return;
  }
  const phases = runtimeStages(active.phase, run);
  els.currentRunPanel.innerHTML = `<div class="run-heading"><div><h3>${escapeHtml(active.task_title || active.task_id)}</h3><p>${escapeHtml(active.project_id)} · ${escapeHtml(active.run_id || "等待 Runtime 启动")}</p></div><span class="status-pill in_progress">${escapeHtml(active.phase || "进行中")}</span></div><div class="stage-grid">${phases.map((phase) => `<div class="stage-item ${phase.state}">${escapeHtml(phase.label)}</div>`).join("")}</div>`;
  els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="stopRunButton" class="secondary-button" type="button">停止当前运行</button>`;
  document.getElementById("reviewRunButton").addEventListener("click", () => openWorkbench("review"));
  document.getElementById("stopRunButton").addEventListener("click", () => runAction(async () => {
    if (!window.confirm("停止请求会在安全停止点中断 Runtime，远端任务仍保持进行中。继续吗？")) return;
    await api.stopAutomationRun();
    await refreshSnapshot();
    showPage("recovery");
  }));
}

function renderQueue(queue) {
  if (queue.length === 0) {
    els.queueTable.innerHTML = `<div class="empty-state">当前范围没有符合资格的待处理任务。</div>`;
    return;
  }
  els.queueTable.innerHTML = `<table class="data-table"><colgroup><col style="width:42px"><col><col style="width:130px"><col style="width:76px"><col style="width:100px"></colgroup><thead><tr><th>#</th><th>任务</th><th>项目</th><th>优先级</th><th>状态</th></tr></thead><tbody>${queue.slice(0, 8).map((task) => `<tr data-queue-task="${escapeHtml(task.id)}"><td class="queue-number">${task.queue_position}</td><td class="task-title-cell">${escapeHtml(task.title)}</td><td>${escapeHtml(task.project_name)}</td><td>${formatPriority(task.priority)}</td><td><span class="status-pill pending">待处理</span></td></tr>`).join("")}</tbody></table>`;
  els.queueTable.querySelectorAll("[data-queue-task]").forEach((row) => row.addEventListener("click", () => openTaskBrowser("pending", row.dataset.queueTask)));
}

function renderRecentCompletions() {
  const items = state.snapshot.recent_completions.filter(scopedTaskFilter).slice(0, 5);
  els.recentCompletions.innerHTML = items.length ? items.map((item) => `<button class="completion-item" data-completion-run="${escapeHtml(item.run_id)}" type="button"><span><strong>${escapeHtml(item.title || item.task_id)}</strong><small>${escapeHtml(item.project_id)} · ${formatDateTime(item.completed_at)}</small></span><span class="status-pill completed">已完成</span></button>`).join("") : `<div class="empty-state">暂无由自动化完成的任务。</div>`;
  els.recentCompletions.querySelectorAll("[data-completion-run]").forEach((button) => button.addEventListener("click", () => openWorkbench("review", button.dataset.completionRun)));
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
    ["自动化", snapshot.enabled ? snapshot.queue_paused ? "已开启 · 队列暂停" : "已开启" : "已关闭"],
    ["活动任务", snapshot.active_task?.task_id || "无"],
    ["当前责任方", snapshot.attention_items.length ? "Human" : snapshot.active_task ? "Runtime" : "Automation Coordinator"],
    ["并发边界", "单活动任务"]
  ]);
  els.projectBindingList.innerHTML = projects.length ? projects.map((project) => {
    const options = [`<option value="">未绑定</option>`, ...snapshot.local_projects.map((local) => `<option value="${escapeHtml(local.id)}" ${local.id === project.local_project_id ? "selected" : ""}>${escapeHtml(local.name)}</option>`)].join("");
    return `<div class="binding-row" data-binding-project="${escapeHtml(project.id)}"><strong>${escapeHtml(project.name)}</strong><select aria-label="${escapeHtml(project.name)} 本地工作区">${options}</select><label class="participation-row"><input type="checkbox" ${project.participating ? "checked" : ""} ${project.local_project_id ? "" : "disabled"}>参与自动化 · ${project.eligible ? "可执行" : escapeHtml(project.local_project_id ? project.source_status : "未绑定")}</label></div>`;
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
  els.taskInspector.innerHTML = `<h2>${escapeHtml(task.title)}</h2><p>${escapeHtml(task.content || "没有补充内容")}</p><span class="status-pill ${task.state}">${escapeHtml(task.state_label)}</span>${factRows([
    ["任务标识", task.id],
    ["所属项目", task.project_name],
    ["本地工作区", task.local_project_path || "未绑定"],
    ["自动执行资格", task.eligible ? `队列第 ${task.queue_position} 项` : task.state === "pending" ? "当前不可执行" : "不适用于当前状态"],
    ["服务器版本", task.version || "未提供"]
  ])}<div id="taskActions" class="task-actions"></div>`;
  const actions = taskActions(task);
  document.getElementById("taskActions").innerHTML = actions.map((action) => `<button class="${action.primary ? "primary-button" : "secondary-button"}" data-task-action="${action.id}" type="button">${action.label}</button>`).join("");
  document.getElementById("taskActions").querySelectorAll("[data-task-action]").forEach((button) => button.addEventListener("click", () => runAction(() => executeTaskAction(task, button.dataset.taskAction))));
}

async function executeTaskAction(task, action) {
  if (action === "review") {
    const completion = state.snapshot.recent_completions.find((item) => String(item.task_id) === String(task.id));
    return openWorkbench("review", completion?.run_id || "");
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

async function openWorkbench(mode = "review", runId = "") {
  state.workbenchMode = mode;
  state.workbenchCompletion = runId
    ? state.snapshot.recent_completions.find((item) => item.run_id === runId) || null
    : null;
  state.workbenchRun = runId && state.snapshot.active_run?.id !== runId
    ? (await api.listRuns({})).find((run) => run.id === runId) || null
    : null;
  await loadTranscript();
  showPage("workbench");
}

async function loadTranscript() {
  const active = state.snapshot.active_task;
  const run = state.workbenchRun || state.snapshot.active_run;
  const localProjectId = state.workbenchCompletion?.local_project_id || active?.local_project_id || run?.project_id || "";
  if (!localProjectId || !run?.session_id) {
    state.transcript = [];
    return;
  }
  state.transcript = await api.listMessages(localProjectId, run.session_id);
}

function renderWorkbench() {
  const active = state.snapshot.active_task;
  const completion = state.workbenchCompletion;
  const run = state.workbenchRun || state.snapshot.active_run;
  const activity = run?.activity || {};
  const attention = state.snapshot.attention_items.find((item) => !active || item.task_id === active.task_id);
  const taskId = completion?.task_id || active?.task_id || "";
  const projectId = completion?.project_id || active?.project_id || "";
  els.workbenchTitle.textContent = completion?.title || active?.task_title || "执行对话审查";
  els.workbenchMode.className = `status-pill ${state.workbenchMode === "intervention" ? "pending" : "pending_review"}`;
  els.workbenchMode.textContent = state.workbenchMode === "intervention" ? "人工处理" : "只读审查";
  els.interventionComposer.classList.toggle("hidden", state.workbenchMode !== "intervention");
  els.interveneCurrentButton.classList.toggle("hidden", state.workbenchMode === "intervention" || !active || Boolean(completion));
  els.interventionInput.disabled = state.interventionSubmitting;
  els.submitInterventionButton.disabled = state.interventionSubmitting;
  els.submitInterventionButton.textContent = state.interventionSubmitting ? "正在提交…" : "提交并恢复自动化";
  const selectedGap = activity.controller_frame?.selected_gap || activity.controller_plan?.selected_gap || null;
  const sourceFacts = activity.artifact_ownership_scan?.source_facts_changed || [];
  const implementationEvidence = activity.artifact_ownership_scan?.implementation_evidence || [];
  els.workbenchContext.innerHTML = taskId ? factRows([
    ["任务", taskId],
    ["远端项目", projectId],
    ["本地工作区", active?.local_project_path || completion?.local_project_id || "已归档"],
    ["审查范围", completion ? "历史完成 Run · 只读" : state.workbenchMode === "intervention" ? "当前 Run · 人工处理" : "当前 Run · 只读"],
    ["Selected Gap", selectedGap?.id || "尚未选择"],
    ["已加载事实", `${sourceFacts.length} 项源事实 · ${implementationEvidence.length} 项实现证据`],
    ["执行边界", activity.controller_frame?.round_goal || run?.task || "由当前任务与 Case 限定"],
    ["人工请求", completion ? "不适用" : attention?.reason || "无"],
    ["恢复条件", completion ? "只读审查不改变任务状态" : attention?.question || "返回自动化观察"]
  ]) : `<div class="empty-state">没有可审查的任务上下文。</div>`;
  const messages = state.transcript.length
    ? state.transcript.map((message) => `<article class="message ${escapeHtml(message.role)}"><div class="message-head"><span>${escapeHtml(message.role)}</span><time>${formatTime(message.created_at)}</time></div><p>${escapeHtml(message.content)}</p></article>`).join("")
    : `<div class="empty-state compact">当前没有已加载的对话。Chat 仅在 Runtime 产生 transcript 后出现。</div>`;
  els.transcriptList.innerHTML = `${messages}${renderRunPlan(activity)}${renderExecutionEvidence(activity)}`;
  els.workbenchEvidence.innerHTML = factRows([
    ["Run", run?.id || "无"],
    ["Run 状态", run?.status || "未启动"],
    ["远端任务", completion ? "已完成" : active?.phase || "无活动任务"],
    ["当前步骤", activity.current_step || "无"],
    ["Controller", activity.controller_plan_status || activity.controller_review_status || "尚未收束"],
    ["Worker", `${activity.agents?.length || 0} 个 · ${activity.reports?.length || 0} 份报告`],
    ["验证", activity.validation_valid === true ? "有效" : activity.validation_valid === false ? "失败" : "未确认"],
    ["Gate", activity.gate_result?.parsed?.allowed === true ? "允许" : activity.gate_result?.parsed?.allowed === false ? "阻止" : "未执行"],
    ["Ledger", activity.ledger_write_result?.parsed?.written ? "已写回" : "未确认"],
    ["影响", `${activity.artifact_ownership_scan?.classified?.length || 0} 个已分类 artifact`],
    ["原始证据", `${activity.raw_events?.length || 0} 个事件 · ${activity.artifact_paths?.activity_file ? "已归档" : "未归档"}`]
  ]);
}

function renderRunPlan(activity) {
  const planItems = Array.isArray(activity.plan) ? activity.plan : [];
  const fallback = [
    activity.controller_frame?.round_goal,
    activity.controller_plan?.summary,
    activity.controller_review?.summary
  ].filter(Boolean);
  const items = planItems.length ? planItems : fallback;
  return `<section class="activity-section"><div class="activity-section-heading"><strong>计划</strong><span>${items.length}</span></div>${items.length
    ? items.slice(0, 12).map((item) => `<div class="activity-line"><i></i><span>${escapeHtml(typeof item === "string" ? item : item.step || item.title || item.objective || JSON.stringify(item))}</span><em>${escapeHtml(typeof item === "object" ? item.status || "" : "")}</em></div>`).join("")
    : `<p>Controller 尚未生成可投影计划。</p>`}</section>`;
}

function renderExecutionEvidence(activity) {
  const events = Array.isArray(activity.execution_events) && activity.execution_events.length
    ? activity.execution_events
    : Array.isArray(activity.timeline) ? activity.timeline : [];
  return `<section class="activity-section"><div class="activity-section-heading"><strong>工具调用与执行证据</strong><span>${events.length}</span></div>${events.length
    ? events.slice(-12).reverse().map((event) => `<div class="activity-line"><i class="${escapeHtml(event.status || "")}"></i><span><b>${escapeHtml(event.title || event.label || event.type || "Runtime event")}</b><small>${escapeHtml(event.detail || "")}</small></span><em>${escapeHtml(event.status || "")}</em></div>`).join("")
    : `<p>当前 Run 尚未产生工具或执行事件。</p>`}</section>`;
}

function renderRecovery() {
  const items = state.snapshot.recovery_items;
  if (!items.length) {
    els.recoveryList.innerHTML = `<div class="panel-card empty-state"><div><strong>没有待恢复事项</strong><p>服务器事实、本地 Runtime 与队列状态一致。</p></div></div>`;
    return;
  }
  els.recoveryList.innerHTML = items.map((item) => `<article class="recovery-card"><div class="recovery-marker"></div><div class="recovery-body"><h2>${escapeHtml(RECOVERY_LABELS[item.type] || item.type)}</h2><p>${escapeHtml(item.message)}</p><div class="recovery-meta"><span>任务 ${escapeHtml(item.task_id)}</span><span>冻结范围 ${escapeHtml(item.freeze_scope)}</span><span>责任方 ${escapeHtml(item.responsibility)}</span></div><div class="recovery-actions">${item.actions.map((action) => `<button class="${action === "mark_blocked" ? "secondary-button" : "primary-button"}" data-recovery-id="${escapeHtml(item.id)}" data-recovery-action="${escapeHtml(action)}" type="button">${escapeHtml(RECOVERY_ACTION_LABELS[action] || action)}</button>`).join("")}</div></div></article>`).join("");
  els.recoveryList.querySelectorAll("[data-recovery-action]").forEach((button) => button.addEventListener("click", () => runAction(async () => {
    const action = button.dataset.recoveryAction;
    if (action === "mark_blocked" && !window.confirm("标记阻塞会更新远端任务状态并释放活动任务。继续吗？")) return;
    await api.resolveAutomationRecovery({ recoveryId: button.dataset.recoveryId, action });
    await refreshSnapshot();
    if (!state.snapshot.recovery_items.length) showPage("command");
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

function openSettings() {
  renderSettingsForm();
  els.settingsOverlay.classList.remove("hidden");
}

function closeSettings() {
  els.settingsOverlay.classList.add("hidden");
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
}

function renderAuthMode() {
  els.headerAuthFields.classList.toggle("hidden", els.taskSourceAuthMode.value !== "headers");
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
  closeSettings();
  await api.syncAutomation();
  await refreshSnapshot();
  showToast("设置已保存并完成同步。");
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

function factRows(rows) {
  return rows.map(([label, value]) => `<div class="fact-row"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value ?? "")}</strong></div>`).join("");
}

function taskActions(task) {
  if (task.state === "pending_review") return [{ id: "confirm", label: "确认可处理", primary: true }, { id: "cancel", label: "取消" }];
  if (task.state === "pending") return [{ id: "cancel", label: "取消" }];
  if (task.state === "in_progress") return [{ id: "review", label: "查看运行", primary: true }, { id: "block", label: "标记阻塞" }];
  if (task.state === "completed") return [{ id: "review", label: "审查结果" }, { id: "accept", label: "标记已验收", primary: true }];
  if (task.state === "blocked") return [{ id: "resume", label: "返回待处理", primary: true }, { id: "cancel", label: "取消" }];
  return [];
}

function runtimeStages(phase, run) {
  const order = ["sync", "controller", "worker", "writeback"];
  const labels = ["1 同步并领取", "2 Controller", "3 Worker 执行", "4 Gate 与写回"];
  const phaseIndex = ["starting", "running", "awaiting_human", "completing", "recovery"].indexOf(phase);
  return order.map((_, index) => ({
    label: labels[index],
    state: phase === "recovery" && index === Math.max(1, phaseIndex) ? "error" : run?.status === "completed" || index < Math.max(1, phaseIndex) ? "complete" : index === Math.min(3, Math.max(0, phaseIndex)) ? "active" : ""
  }));
}

function sourceStatusLabel(value) {
  return {
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

function renderSyncing(active) {
  els.syncButton.disabled = active;
  els.syncButton.textContent = active ? "…" : "↻";
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    console.error(error);
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
    task_source: { enabled: false, base_url: "", service_name: "workshop", auth_mode: "bearer", access_token_configured: false, user_id: "", username: "", app_id: "arckit-runtime", session_id: "" }
  };
}

function emptySnapshot() {
  return {
    enabled: false,
    queue_paused: false,
    source_status: "unconfigured",
    source_errors: [],
    synced_at: "",
    user: null,
    local_projects: [],
    projects: [],
    state_counts: Object.fromEntries(TASK_STATES.map((taskState) => [taskState, 0])),
    tasks: [],
    queue: [],
    active_task: null,
    active_run: null,
    attention_items: [],
    recovery_items: [],
    recent_completions: [],
    health: { state: "unconfigured", label: "任务源未配置", tone: "neutral" }
  };
}
