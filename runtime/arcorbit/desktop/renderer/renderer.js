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
  feedback_continue: "补充说明并继续",
  accept_server_state: "接受服务器事实",
  mark_blocked: "标记为已阻塞"
};

const state = {
  setup: null,
  setupBusy: false,
  setupPlanOpened: false,
  page: "today",
  selectedProjectId: "all",
  selectedState: "pending",
  acceptanceFeedbackOnly: false,
  selectedTaskId: "",
  selectedPlatformTaskId: "",
  snapshot: emptySnapshot(),
  platform: emptyPlatformSnapshot(),
  platformWorkFilter: "",
  organizationScopeId: "",
  organizationScopeChosen: false,
  organizationSection: "overview",
  selectedOrganizationMemberId: "",
  selectedOrganizationProjectId: "",
  settings: defaultSettings(),
  productFeedback: defaultProductFeedbackStatus(),
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

let platformActionResolver = null;

const els = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map((element) => [element.id, element]));
let refreshQueued = false;
let toastTimer;
let verificationTimer;

boot();

async function boot() {
  wireEvents();
  const [setup, settings, authentication, productFeedback] = await Promise.all([api.getSetupReadiness(), api.getSettings(), api.getAuthStatus(), api.getProductFeedbackStatus()]);
  state.setup = setup;
  state.settings = normalizeSettings(settings);
  state.authentication = normalizeAuthentication(authentication);
  state.productFeedback = normalizeProductFeedbackStatus(productFeedback);
  renderSetup();
  await refreshSnapshot();
  api.onProductFeedbackUnread((count) => {
    state.productFeedback.unread_count = Math.max(0, Math.trunc(Number(count) || 0));
    renderProductFeedbackTrigger();
  });
  api.refreshProductFeedbackUnread().then((result) => {
    if (Number.isFinite(Number(result?.unread_count))) {
      state.productFeedback.unread_count = Math.max(0, Math.trunc(Number(result.unread_count) || 0));
      renderProductFeedbackTrigger();
    }
  }).catch(() => {});
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
  els.setupRecoveryGuideButton.addEventListener("click", () => runAction(async () => {
    await navigator.clipboard.writeText(setupRecoveryGuide(state.setup));
    window.alert("恢复说明已复制。请按其中的路径与条件处理后重新检查。");
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
  els.setupRecoverButton.addEventListener("click", () => runAction(async () => {
    const upgrade = state.setup?.source_upgrade;
    const action = upgrade?.can_backup_and_restore ? "backup-and-restore" : upgrade?.can_backup_and_reinstall ? "backup-and-reinstall" : "";
    if (!action) return;
    const confirmation = action === "backup-and-reinstall"
      ? "将先完整备份当前冲突内容，再以当前 ArcOrbit 应用包中的内容为准重新安装，并建立新的受管理关系。是否继续？"
      : "将先把本地修改完整备份，再恢复受管理内容。恢复完成后如有新版迁移计划，仍需再次确认。";
    if (!window.confirm(confirmation)) return;
    state.setupBusy = true;
    renderSetup();
    try {
      state.setup = await api.recoverSetupUpgrade({ assessmentDigest: upgrade.digest, action });
      state.setupPlanOpened = false;
      els.setupReviewed.checked = false;
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
  els.syncButton.addEventListener("click", () => runAction(async () => {
    await api.syncAutomation();
    await refreshSnapshot();
  }));
  els.productFeedbackButton.addEventListener("click", () => runAction(openProductFeedback));
  els.automationEnabled.addEventListener("change", () => runAction(async () => {
    await api.setAutomationEnabled(els.automationEnabled.checked);
    await refreshSnapshot();
  }));
  els.queuePauseButton.addEventListener("click", () => runAction(async () => {
    await api.setQueuePaused(!state.snapshot.queue_paused);
    await refreshSnapshot();
  }));
  els.settingsButton.addEventListener("click", () => runAction(() => openSettings({ loginGate: false })));
  els.accountButton.addEventListener("click", () => runAction(() => openSettings({ loginGate: false })));
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
  els.viewPendingButton.addEventListener("click", () => openWorkState("pending"));
  els.acceptanceFeedbackOnlyButton.addEventListener("click", () => {
    state.acceptanceFeedbackOnly = !state.acceptanceFeedbackOnly;
    renderCommandCenter();
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
  els.platformWorkFilter.addEventListener("input", () => {
    state.platformWorkFilter = els.platformWorkFilter.value.trim().toLowerCase();
    renderPlatformWork();
  });
  els.worksetSelect.addEventListener("change", () => runAction(async () => {
    state.selectedProjectId = "all";
    await api.setActiveWorkset(els.worksetSelect.value);
    await refreshSnapshot();
  }));
  els.productScopeSelect.addEventListener("change", () => {
    state.selectedProjectId = els.productScopeSelect.value;
    state.selectedTaskId = "";
    state.selectedPlatformTaskId = "";
    refreshSnapshot().catch((error) => showToast(error.message));
  });
  els.editWorksetButton.addEventListener("click", () => runAction(editCurrentWorkset));
  els.createOrganizationButton.addEventListener("click", () => runAction(createOrganization));
  els.joinByCodeButton.addEventListener("click", () => runAction(joinByInvitationCode));
  els.organizationTabs.querySelectorAll("[data-organization-section]").forEach((button) => button.addEventListener("click", () => {
    state.organizationSection = button.dataset.organizationSection;
    renderOrganization();
  }));
  els.createTaskButton.addEventListener("click", () => runAction(createTask));
  els.createTagButton.addEventListener("click", () => runAction(createTag));
  els.createFeedbackButton.addEventListener("click", () => runAction(createFeedback));
  els.closePlatformActionButton.addEventListener("click", () => closePlatformAction(null));
  els.cancelPlatformActionButton.addEventListener("click", () => closePlatformAction(null));
  els.platformActionOverlay.addEventListener("click", (event) => {
    if (event.target === els.platformActionOverlay) closePlatformAction(null);
  });
  els.platformActionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    closePlatformAction(serializePlatformAction());
  });
  els.submitInterventionButton.addEventListener("click", () => runAction(async () => {
    const active = state.snapshot.active_task;
    const sourceTask = state.workbenchTask || (state.workbenchCompletion
      ? state.snapshot.tasks.find((item) => String(item.id) === String(state.workbenchCompletion.task_id))
      : null);
    const acceptanceReview = Boolean(sourceTask && sourceTask.state === "completed");
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
      closePlatformAction(null);
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
    conflict: ["需要选择冲突恢复方式", "每个阻塞目标都显示其所有权依据与当前可执行的恢复动作。"],
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
  const writeSummary = setup.write_state === "not_started" ? "写入：未开始" : setup.write_state === "committed" ? "写入：已完成" : setup.write_state === "rolled_back" ? "写入：已回滚" : setup.write_state === "rollback_incomplete" ? "写入：回滚需人工检查" : "写入：进行中";
  els.setupErrorPanel.innerHTML = setup.error ? `<strong>${escapeHtml(setup.error.code)}</strong><p>${escapeHtml(setup.error.message)}</p><small>阶段：${escapeHtml(setup.error.stage)} · ${writeSummary}</small>` : "";
  const upgradeItems = setup.source_upgrade?.items || [];
  const conflicts = setup.drift?.conflicts || [];
  els.setupConflictPanel.classList.toggle("hidden", upgradeItems.length === 0 && conflicts.length === 0 && !setup.recovery_backup);
  els.setupConflictPanel.innerHTML = upgradeItems.length
    ? `<h2>冲突与恢复分类</h2>${upgradeItems.map((item) => `<div class="setup-path-row"><strong>${escapeHtml(upgradeDispositionLabel(item.disposition))} · ${escapeHtml(item.name)}</strong><code>${escapeHtml(item.path)}</code><small>${escapeHtml(item.reason)}</small>${item.files?.length ? `<ul>${item.files.map((file) => `<li><code>${escapeHtml(file.status)} · ${escapeHtml(file.path)}</code></li>`).join("")}</ul>` : ""}</div>`).join("")}`
    : conflicts.length
      ? `<h2>不会自动覆盖</h2>${conflicts.map((item) => `<div class="setup-path-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}`
      : setup.recovery_backup
        ? `<h2>本地修改已备份</h2><div class="setup-path-row"><code>${escapeHtml(setup.recovery_backup.path)}</code></div>`
        : "";
  renderSetupActions();
}

function renderSetupPlan() {
  const plan = state.setup?.plan;
  els.setupPlanDetails.classList.toggle("hidden", !plan);
  els.setupReviewLabel.classList.toggle("hidden", !state.setup?.can_apply);
  if (!plan) { els.setupPlan.innerHTML = ""; return; }
  const groups = Object.groupBy ? Object.groupBy(plan.items, (item) => item.mode || "unclassified") : plan.items.reduce((result, item) => ((result[item.mode || "unclassified"] ||= []).push(item), result), {});
  const availability = plan.availability;
  const availabilityHtml = availability ? `<p class="setup-digest">Arckit skills <strong>${availability.arckit_total}</strong> · user-ambient ${availability.user_ambient} · user-on-demand ${availability.user_on_demand} · project-ambient 延后 ${availability.project_ambient_deferred} · shared assets ${availability.shared_assets} · ArcForge loader ${availability.arcforge_loader_targets}</p>` : "";
  const groupHtml = Object.entries(groups).map(([mode, items]) => `<section class="setup-plan-group"><h3>${escapeHtml(mode)} · ${items.length}</h3>${items.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong>${item.destinations.map((destination) => `<code>${escapeHtml(destination.path)}</code>`).join("")}</div>`).join("")}</section>`).join("");
  const sharedAssets = plan.shared_assets?.length ? `<section class="setup-plan-group"><h3>shared assets · ${plan.shared_assets.length}</h3>${plan.shared_assets.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.name)}</strong>${item.destinations.map((destination) => `<code>${escapeHtml(destination.path)}</code>`).join("")}</div>`).join("")}</section>` : "";
  const cleanup = plan.cleanup?.length ? `<section class="setup-plan-group warning"><h3>managed-stale · ${plan.cleanup.length}</h3>${plan.cleanup.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}${plan.cleanup_included_in_upgrade ? `<p>这些 relationship-proven 旧目标已包含在本次迁移确认中。</p>` : `<button data-setup-cleanup class="secondary-button" type="button">单独确认并清理</button>`}</section>` : "";
  const deferred = plan.deferred_project_skills?.length ? `<section class="setup-plan-group"><h3>project-ambient · 延后</h3><p>${plan.deferred_project_skills.map(escapeHtml).join("、")}</p></section>` : "";
  els.setupPlan.innerHTML = `${availabilityHtml}<p class="setup-digest">Plan digest <code>${escapeHtml(plan.digest)}</code></p>${groupHtml}${sharedAssets}${cleanup}${deferred}`;
}

function renderSetupActions() {
  const setup = state.setup || {};
  const applying = state.setupBusy || ["checking", "applying"].includes(setup.status);
  els.setupRetryButton.disabled = applying;
  els.setupRetryButton.classList.toggle("hidden", setup.status === "ready");
  els.setupApplyButton.classList.toggle("hidden", !setup.can_apply);
  els.setupApplyButton.textContent = setup.source_upgrade?.can_proceed ? "修复缺失并迁移" : "安装并继续";
  els.setupApplyButton.disabled = applying || !state.setupPlanOpened || !els.setupReviewed.checked;
  els.setupRecoverButton.classList.toggle("hidden", !setup.can_recover);
  els.setupRecoverButton.textContent = setup.source_upgrade?.can_backup_and_restore ? "备份修改并恢复" : "备份并按当前应用包重装";
  els.setupRecoverButton.disabled = applying;
  els.setupRecoveryGuideButton.classList.toggle("hidden", !(["conflict", "blocked"].includes(setup.status) && !setup.can_recover));
  els.setupRecoveryGuideButton.disabled = applying;
  els.setupContinueButton.classList.toggle("hidden", setup.status !== "ready");
  els.setupContinueButton.disabled = applying;
  els.setupExitButton.textContent = setup.source_upgrade && !setup.source_upgrade.can_proceed ? "保留当前内容并退出" : "退出应用";
  els.setupExitButton.disabled = setup.status === "applying";
}

function setupRecoveryGuide(setup = {}) {
  const targets = (setup.source_upgrade?.items || setup.drift?.conflicts || [])
    .map((item) => `${item.disposition || item.status || "conflict"}: ${item.path}${item.reason ? `\n  ${item.reason}` : ""}`)
    .join("\n");
  const error = setup.error ? `${setup.error.code}: ${setup.error.message}` : "No setup error code.";
  return [
    "ArcOrbit Setup Readiness recovery guide",
    error,
    targets || "No target paths were reported.",
    "Resolve the reported permission, resource, or ownership condition without deleting unrelated skills, then return to ArcOrbit and choose 重新检查。",
    "If bundled resources are damaged, reinstall the current ArcOrbit application package before rechecking."
  ].join("\n\n");
}

function upgradeDispositionLabel(value) {
  return ({
    "managed-repair": "可修复的 managed 缺失",
    "managed-migration": "Provider managed 迁移",
    "local-content-conflict": "本地内容已修改",
    "unverified-managed": "旧关系缺少内容证据",
    "unmanaged-conflict": "未托管冲突"
  })[value] || value;
}

function setupCheckLabel(id) { return ({resources:"受信安装资源",provider:"ArcForge provider",skills:"Arckit skills",codex:"Codex discoverability"})[id] || id; }
function shortDigest(value) { return value ? `${value.slice(0, 10)}…${value.slice(-8)}` : "--"; }

async function refreshSnapshot({ quiet = false } = {}) {
  if (state.refreshing) return;
  state.refreshing = true;
  if (!quiet) renderSyncing(true);
  try {
    let [snapshot, platform, authentication] = await Promise.all([
      api.automationSnapshot({
        project_id: state.selectedProjectId,
        state: state.page === "tasks" ? state.selectedState : ""
      }),
      api.platformSnapshot({ sections: ["overview", "organizations", "members", "tasks", "feedback"] }),
      api.getAuthStatus()
    ]);
    platform ||= emptyPlatformSnapshot();
    const worksetProjectIds = new Set((platform.active_workset?.project_ids || []).map(String));
    if (state.selectedProjectId !== "all" && !worksetProjectIds.has(state.selectedProjectId)) {
      state.selectedProjectId = "all";
      snapshot = await api.automationSnapshot({ project_id: "all", state: state.page === "tasks" ? state.selectedState : "" });
      showToast("当前产品已不在产品集中，查看范围已切回项目集全部。");
    }
    state.snapshot = snapshot;
    state.platform = platform;
    const scopeIds = new Set((state.platform.organization_scopes || []).map((item) => String(item.id)));
    if ((!state.organizationScopeChosen && scopeIds.size > 0) || !state.organizationScopeId || (state.organizationScopeId !== "personal" && !scopeIds.has(state.organizationScopeId))) {
      state.organizationScopeId = String(state.platform.organization_scopes?.[0]?.id || "personal");
      state.organizationSection = state.organizationScopeId === "personal" ? "projects" : "overview";
    }
    if (state.workbenchTask) {
      state.workbenchTask = snapshot.tasks.find((task) => String(task.id) === String(state.workbenchTask.id)) || state.workbenchTask;
    }
    state.authentication = normalizeAuthentication(authentication);
    const visibleTasks = state.snapshot.tasks.filter(scopedTaskFilter);
    if (state.selectedTaskId && !visibleTasks.some((task) => String(task.id) === state.selectedTaskId)) {
      state.selectedTaskId = visibleTasks[0]?.id || "";
    }
    if (!state.selectedTaskId && visibleTasks.length > 0) {
      state.selectedTaskId = visibleTasks[0].id;
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
  renderWorkset();
  renderToday();
  renderOrganization();
  renderPlatformWork();
  renderPlatformFeedback();
  renderCommandCenter();
  renderTaskBrowser();
  renderWorkbench();
  renderRecovery();
}

function renderPageVisibility() {
  document.querySelectorAll("[data-page-view]").forEach((view) => view.classList.toggle("is-active", view.dataset.pageView === state.page));
  const navigationPage = state.page === "tasks" ? "work" : ["workbench", "recovery"].includes(state.page) ? "command" : state.page;
  document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("is-active", button.dataset.page === navigationPage));
}

function renderNavigation() {
  const snapshot = state.snapshot;
  els.attentionNavCount.textContent = String(snapshot.attention_items.filter(scopedTaskFilter).length + snapshot.recovery_items.length);
  els.organizationNavCount.textContent = String((state.platform.organization_scopes || []).length);
  els.workNavCount.textContent = String(state.platform.tasks.filter((task) => !task.terminal && platformItemMatchesSelectedProject(task)).length);
  els.automationNavCount.textContent = String(snapshot.queue.filter(scopedTaskFilter).length + (activeExecutionMatchesSelectedProject(snapshot.active_task) ? 1 : 0));
  els.feedbackQueueNavCount.textContent = String((state.platform.feedback_v1 || []).filter(platformItemMatchesSelectedProject).length);
  const accountName = currentWorkshopUserName();
  els.accountName.textContent = accountName;
  els.accountAvatar.textContent = accountName.slice(0, 1).toUpperCase() || "W";
  els.accountStatus.textContent = state.authentication.authenticated ? sourceStatusLabel(snapshot.source_status) : "未登录";
  els.titlebarSync.className = `sync-state ${snapshot.source_status === "healthy" ? "healthy" : ["error", "unauthenticated"].includes(snapshot.source_status) ? "error" : ""}`;
  els.titlebarSync.querySelector("span").textContent = snapshot.source_status === "syncing" ? "同步中" : snapshot.synced_at ? `同步于 ${formatTime(snapshot.synced_at)}` : sourceStatusLabel(snapshot.source_status);
}

function renderCommandBar() {
  const project = currentProject();
  const organizationScope = currentOrganizationScope();
  els.scopeTitle.textContent = state.page === "organization"
    ? organizationScope?.name || "个人项目"
    : project?.name || state.platform.active_workset?.name || "项目集全部";
  els.pageTitle.textContent = {
    today: "Today", organization: "Organization", work: "Work", feedback: "Feedback",
    command: "Automation", tasks: STATE_LABELS[state.selectedState], workbench: "人工介入", recovery: "恢复中心"
  }[state.page] || "ArcOrbit";
  els.automationEnabled.checked = Boolean(state.snapshot.enabled);
  els.automationEnabled.disabled = !state.authentication.authenticated;
  els.productSetCluster.classList.toggle("hidden", state.page === "organization");
  renderProductFeedbackTrigger();
}

function renderProductFeedbackTrigger() {
  const count = state.authentication.authenticated && state.productFeedback.configured
    ? Math.max(0, Math.trunc(Number(state.productFeedback.unread_count) || 0))
    : 0;
  els.productFeedbackUnreadBadge.textContent = count > 99 ? "99+" : String(count);
  els.productFeedbackUnreadBadge.classList.toggle("hidden", count === 0);
  els.productFeedbackUnreadBadge.setAttribute("aria-label", `${count} 条未读反馈`);
}

function renderWorkset() {
  const worksets = state.platform.worksets || [];
  els.worksetSelect.innerHTML = worksets.length
    ? worksets.map((workset) => `<option value="${escapeHtml(workset.id)}" ${workset.id === state.platform.active_workset?.id ? "selected" : ""}>${escapeHtml(workset.name)} · ${workset.project_ids.length}</option>`).join("")
    : `<option value="">等待项目同步</option>`;
  els.worksetSelect.disabled = worksets.length === 0;
  els.editWorksetButton.disabled = worksets.length === 0;
  const projects = advanceProjectsInActiveWorkset();
  els.productScopeSelect.innerHTML = [
    `<option value="all">项目集全部 · ${projects.length}</option>`,
    ...projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`)
  ].join("");
  els.productScopeSelect.value = projects.some((project) => String(project.id) === state.selectedProjectId) ? state.selectedProjectId : "all";
  els.productScopeSelect.disabled = projects.length === 0;
}

function renderToday() {
  const platform = state.platform;
  const workspaces = (platform.product_workspaces || []).filter(platformItemMatchesSelectedProject);
  const tasks = (platform.tasks || []).filter(platformItemMatchesSelectedProject);
  const ordinaryFeedback = (platform.feedback_v1 || []).filter(platformItemMatchesSelectedProject);
  const openTasks = tasks.filter((task) => !task.terminal);
  const attention = [
    ...(platform.automation?.attention_items || []).map((item) => ({ ...item, kind_label: "人工介入" })),
    ...(platform.automation?.recovery_items || []).map((item) => ({ ...item, kind_label: "恢复" })),
    ...tasks.filter((task) => task.state === "blocked").map((task) => ({ ...task, task_id: task.id, kind_label: "待办阻塞", reason: task.content }))
  ].filter(scopedTaskFilter);
  els.todaySummary.textContent = `${workspaces.length} 个产品在当前查看范围 · ${openTasks.length} 项未结束工作 · ${ordinaryFeedback.length} 条普通反馈。`;
  els.platformHealthBadge.className = `health-badge ${platform.source_status === "healthy" ? "success" : platform.source_status === "degraded" ? "warning" : "danger"}`;
  els.platformHealthBadge.textContent = platform.source_status === "healthy" ? "平台已同步" : platform.source_status === "degraded" ? "部分数据降级" : sourceStatusLabel(platform.source_status);
  els.platformErrorHost.innerHTML = platform.errors.length
    ? `<div class="platform-error"><strong>${platform.errors.length} 个数据区段未完成</strong><span>${escapeHtml([...new Set(platform.errors.map((item) => `${item.section}${item.project_id ? ` · ${projectName(item.project_id)}` : ""}`))].join("、"))}</span></div>`
    : "";
  els.todayMetricGrid.innerHTML = [
    metric("当前产品集", workspaces.length, state.platform.active_workset?.name || "尚未创建", "healthy"),
    metric("待推进", tasks.filter((task) => ["pending_review", "pending"].includes(task.state)).length, "完整团队待办，不限当前执行人", ""),
    metric("进行中", tasks.filter((task) => task.state === "in_progress").length, platform.automation?.active_execution ? "ArcOrbit 有 1 个活动执行" : "ArcOrbit 当前待命", "running"),
    metric("需注意", attention.length, attention.length ? "阻塞、人工判断或恢复" : "当前没有异常", attention.length ? "attention" : ""),
    metric("用户反馈", ordinaryFeedback.length, ordinaryFeedback.length ? "来自 Workshop Feedback" : "当前没有用户反馈", "")
  ].join("");
  els.todayProductGrid.innerHTML = workspaces.length ? workspaces.map((workspace) => {
    const open = Object.entries(workspace.task_counts || {}).filter(([key]) => !["completed", "accepted", "cancelled"].includes(key)).reduce((sum, [, value]) => sum + Number(value || 0), 0);
    return `<button class="product-card" data-product-work="${escapeHtml(workspace.id)}" type="button"><span class="product-card-head"><i>${escapeHtml(workspace.name.slice(0, 1).toUpperCase())}</i><span><strong>${escapeHtml(workspace.name)}</strong><small>${escapeHtml(workspace.current_user_role || "member")} · ${workspace.local_project_path ? "已绑定本地项目" : "仅远端"}</small></span></span><span class="product-card-stats"><b>${open}<small>未结束</small></b><b>${workspace.feedback_count}<small>反馈</small></b><b>${workspace.members.length}<small>成员</small></b></span><span class="product-card-foot"><em class="status-pill ${workspace.eligible ? "accepted" : "pending_review"}">${workspace.eligible ? "可自动执行" : workspace.participating ? "待满足执行条件" : "未授权自动领取"}</em><small>打开工作 →</small></span></button>`;
  }).join("") : `<div class="empty-state platform-empty">当前产品集未选择产品。使用顶部“管理”选择一个或多个项目。</div>`;
  els.todayProductGrid.querySelectorAll("[data-product-work]").forEach((button) => button.addEventListener("click", () => {
    state.selectedProjectId = button.dataset.productWork;
    state.platformWorkFilter = "";
    showPage("work");
  }));
  els.todayWorkList.innerHTML = openTasks.length ? `<div class="compact-list">${rankTasks(openTasks).slice(0, 8).map(platformTaskRow).join("")}</div>` : `<div class="empty-state compact">当前产品集没有未结束待办。</div>`;
  els.todayAttentionList.innerHTML = attention.length ? `<div class="compact-list">${attention.slice(0, 8).map((item) => `<div class="compact-row attention"><span><strong>${escapeHtml(item.title || item.reason || item.task_id || "需要处理")}</strong><small>${escapeHtml(projectName(item.project_id))} · ${escapeHtml(item.kind_label)}</small></span><em>${escapeHtml(item.task_id || item.id || "")}</em></div>`).join("")}</div>` : `<div class="empty-state compact">当前没有人工介入、恢复或阻塞项。</div>`;
}

function renderOrganization() {
  const scopes = state.platform.organization_scopes || [];
  const scope = currentOrganizationScope();
  const personal = state.organizationScopeId === "personal" || !scope;
  const personalProjects = state.platform.personal_projects || [];
  els.organizationScopeList.innerHTML = [
    `<button class="organization-scope-item ${personal ? "is-active" : ""}" data-organization-scope="personal" type="button"><span><strong>个人项目</strong><small>个人与外部参与</small></span><em>${personalProjects.length}</em></button>`,
    ...scopes.map((item) => `<button class="organization-scope-item ${String(item.id) === state.organizationScopeId ? "is-active" : ""}" data-organization-scope="${escapeHtml(item.id)}" type="button"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.current_user_role || "只读")} · ${item.project_visibility === "all_projects" ? "全部项目" : "我参与的项目"}</small></span><em>${item.projects.length}</em></button>`)
  ].join("");
  els.organizationScopeList.querySelectorAll("[data-organization-scope]").forEach((button) => button.addEventListener("click", () => {
    state.organizationScopeId = button.dataset.organizationScope;
    state.organizationScopeChosen = true;
    state.organizationSection = state.organizationScopeId === "personal" ? "projects" : "overview";
    state.selectedOrganizationMemberId = "";
    state.selectedOrganizationProjectId = "";
    renderOrganization();
    renderCommandBar();
  }));
  els.organizationTabs.querySelectorAll("[data-organization-section]").forEach((button) => {
    const disabled = personal && button.dataset.organizationSection !== "projects";
    button.disabled = disabled;
    button.classList.toggle("is-active", button.dataset.organizationSection === state.organizationSection);
  });
  if (personal && state.organizationSection !== "projects") state.organizationSection = "projects";

  els.organizationEyebrow.textContent = personal ? "PERSONAL PROJECTS" : `ORGANIZATION · ${(scope.current_user_role || "READ ONLY").toUpperCase()}`;
  els.organizationHeading.textContent = personal ? "个人项目" : scope.name;
  els.organizationSummary.textContent = personal
    ? `${personalProjects.length} 个无组织或外部参与项目；与组织治理同级，不属于当前 Workset。`
    : `${scope.members.length} 位成员 · ${scope.projects.length} 个${scope.project_visibility === "all_projects" ? "组织项目" : "我参与的项目"}${scope.degraded ? " · 部分数据降级" : ""}`;
  const canManageOrganization = !personal && ["owner", "admin"].includes(scope.current_user_role);
  els.organizationScopeActions.innerHTML = personal
    ? `<button data-project-create type="button" class="primary-button">创建个人项目</button>`
    : `${canManageOrganization ? `<button data-organization-edit="${escapeHtml(scope.id)}" type="button" class="secondary-button">编辑组织</button><button data-organization-invite="${escapeHtml(scope.id)}" type="button" class="primary-button">生成组织邀请</button>` : ""}${scope.current_user_role === "owner" ? `<button data-organization-delete="${escapeHtml(scope.id)}" type="button" class="text-button danger-action">删除组织</button>` : ""}<button data-project-create type="button" class="secondary-button">创建组织项目</button>`;

  if (personal || state.organizationSection === "projects") renderOrganizationProjects(scope, personalProjects);
  else if (state.organizationSection === "members") renderOrganizationMembers(scope);
  else renderOrganizationOverview(scope);
  wireOrganizationActions();
}

function renderOrganizationOverview(scope) {
  const members = scope.members || [];
  const projects = scope.projects || [];
  const projectMembers = state.platform.project_members || [];
  const notice = scope.project_visibility === "all_projects"
    ? "你可以查看组织全部项目。"
    : "当前仅显示你参与的项目；组织全部项目只对 owner/admin 开放。";
  const matrix = projects.length && members.length ? `<div class="organization-matrix-wrap"><table class="data-table organization-matrix"><thead><tr><th>成员</th>${projects.map((project) => `<th><button data-organization-project-open="${escapeHtml(project.id)}" type="button">${escapeHtml(project.name)}</button></th>`).join("")}</tr></thead><tbody>${members.map((member) => `<tr><td><button data-organization-member-open="${escapeHtml(member.id)}" type="button"><strong>${escapeHtml(member.username)}</strong><small>${escapeHtml(member.role)}${member.is_me ? " · 我" : ""}</small></button></td>${projects.map((project) => { const relation = projectMembers.find((item) => String(item.project_id) === String(project.id) && String(item.user_id) === String(member.user_id)); return `<td>${relation ? `<strong>${escapeHtml(relation.role)}</strong><small>${escapeHtml(relation.duty || "未填写职责")}</small>` : "—"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">当前范围还没有可组成关系矩阵的成员与项目。</div>`;
  els.organizationContent.innerHTML = `<div class="metric-grid organization-metrics">${metric("组织成员", members.length, "Workshop OrganizationMember", "healthy")}${metric("可见项目", projects.length, scope.project_visibility === "all_projects" ? "组织全部项目" : "我参与的项目", "")}${metric("当前角色", scope.current_user_role || "只读", notice, "")}</div><div class="capability-notice"><strong>${scope.project_visibility === "all_projects" ? "完整治理范围" : "有限项目范围"}</strong><span>${escapeHtml(notice)}</span></div><section class="panel-card"><div class="section-title-row"><div><span class="section-icon">▦</span><div><h2>成员参与全貌</h2><p>只读关系矩阵；不能在单元格中直接添加成员</p></div></div></div>${matrix}</section>`;
}

function renderOrganizationMembers(scope) {
  const members = [...(scope.members || [])].sort((left, right) => Number(right.is_me) - Number(left.is_me) || left.username.localeCompare(right.username, "zh-CN"));
  const selected = members.find((member) => String(member.id) === state.selectedOrganizationMemberId) || members[0];
  if (selected) state.selectedOrganizationMemberId = String(selected.id);
  const relations = selected ? (state.platform.project_members || []).filter((item) => String(item.user_id) === String(selected.user_id) && scope.projects.some((project) => String(project.id) === String(item.project_id))) : [];
  const canChangeRole = (member) => scope.current_user_role === "owner" && member.role !== "owner";
  const canRemove = (member) => member.is_me || (["owner", "admin"].includes(scope.current_user_role) && member.role !== "owner");
  els.organizationContent.innerHTML = `<div class="organization-detail-grid"><section class="panel-card"><div class="section-title-row"><div><span class="section-icon">◎</span><div><h2>组织成员</h2><p>先管理组织身份，再查看已有项目关系</p></div></div></div>${members.length ? `<div class="member-directory">${members.map((member) => `<button class="member-directory-row ${String(member.id) === String(selected?.id) ? "is-active" : ""}" data-organization-member-open="${escapeHtml(member.id)}" type="button"><span><strong>${escapeHtml(member.username)}${member.is_me ? " · 我" : ""}</strong><small>${escapeHtml(member.role)} · ${(state.platform.project_members || []).filter((item) => String(item.user_id) === String(member.user_id) && scope.projects.some((project) => String(project.id) === String(item.project_id))).length} 个项目</small></span><em>查看 →</em></button>`).join("")}</div>` : `<div class="empty-state">尚无组织成员。</div>`}</section><aside class="inspector-card organization-inspector">${selected ? `<p class="eyebrow">MEMBER</p><h2>${escapeHtml(selected.username)}</h2><p>${escapeHtml(selected.role)}${selected.is_me ? " · 当前用户" : ""}</p><div class="row-actions">${canChangeRole(selected) ? `<button data-organization-member-edit="${escapeHtml(selected.id)}" data-member-organization="${escapeHtml(scope.id)}" type="button">调整组织角色</button>` : ""}${canRemove(selected) ? `<button class="danger-action" data-organization-member-delete="${escapeHtml(selected.id)}" data-member-organization="${escapeHtml(scope.id)}" type="button">${selected.is_me ? "退出组织" : "移除成员"}</button>` : ""}</div><h3>已有项目关系</h3>${relations.length ? `<div class="compact-list">${relations.map((relation) => `<button class="compact-row" data-organization-project-open="${escapeHtml(relation.project_id)}" type="button"><span><strong>${escapeHtml(relation.project_name)}</strong><small>${escapeHtml(relation.role)} · ${escapeHtml(relation.duty || "未填写职责")}${relation.is_external ? " · 外部成员" : ""}</small></span><em>查看项目 →</em></button>`).join("")}</div>` : `<div class="empty-state compact">在当前可见范围内没有项目关系。</div>`}<div class="capability-notice"><strong>为何这里没有项目邀请？</strong><span>项目邀请是通用凭证，不绑定当前成员。请进入明确的项目详情生成，再由对方自行使用邀请码加入。</span></div>` : `<div class="empty-state">选择一位成员查看详情。</div>`}</aside></div>`;
}

function renderOrganizationProjects(scope, personalProjects) {
  const personal = !scope;
  const projects = personal ? personalProjects : scope.projects || [];
  const selected = projects.find((project) => String(project.id) === state.selectedOrganizationProjectId) || projects[0];
  if (selected) state.selectedOrganizationProjectId = String(selected.id);
  const selectedWorkset = new Set(state.platform.active_workset?.project_ids || []);
  const members = selected ? (state.platform.project_members || []).filter((member) => String(member.project_id) === String(selected.id)) : [];
  const canManage = selected && ["owner", "admin"].includes(selected.current_user_role);
  const selectedScopeLabel = personal ? (selected?.external_participation ? "外部参与" : "个人项目") : scope?.name || "";
  els.organizationContent.innerHTML = `${!personal && scope.project_visibility !== "all_projects" ? `<div class="capability-notice"><strong>当前显示你参与的项目</strong><span>组织全部项目仅 owner/admin 可见。</span></div>` : ""}<div class="organization-detail-grid"><section class="panel-card"><div class="section-title-row"><div><span class="section-icon">▦</span><div><h2>${personal ? "个人与外部参与项目" : "组织项目"}</h2><p>项目治理不受 Workset 过滤</p></div></div><button data-project-create type="button">创建项目</button></div>${projects.length ? `<div class="project-directory">${projects.map((project) => `<button class="project-directory-row ${String(project.id) === String(selected?.id) ? "is-active" : ""}" data-organization-project-open="${escapeHtml(project.id)}" type="button"><span class="product-identity"><i>${escapeHtml(project.name.slice(0, 1).toUpperCase())}</i><span><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.current_user_role || "只读")} · ${project.local_project_path ? "本地已绑定" : "仅远端"}</small></span></span><span class="product-facts"><em>${selectedWorkset.has(String(project.id)) ? "当前 Workset" : "未展示"}</em><em>${project.participating ? "Automation 已授权" : "Automation 未授权"}</em></span></button>`).join("")}</div>` : `<div class="empty-state">当前范围没有可见项目。</div>`}</section><aside class="inspector-card organization-inspector">${selected ? `<p class="eyebrow">PROJECT · ${escapeHtml(selected.current_user_role || "READ ONLY")}</p><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.git_url || "未设置 Git 地址")}</p><div class="project-connection-list"><span><strong>组织归属</strong><small>${escapeHtml(selectedScopeLabel)} · 创建后不可在 ArcOrbit 迁移</small></span><span><strong>本地项目</strong><small>${escapeHtml(selected.local_project_path || "尚未绑定")}</small></span><span><strong>推进范围</strong><small>${selectedWorkset.has(String(selected.id)) ? `已在 ${escapeHtml(state.platform.active_workset?.name || "当前产品集")}` : "当前 Workset 不展示"}</small></span><span><strong>Automation</strong><small>${selected.participating ? "已授权自动领取" : "未授权自动领取"}</small></span></div><div class="row-actions project-detail-actions"><button data-project-workset-toggle="${escapeHtml(selected.id)}" type="button">${selectedWorkset.has(String(selected.id)) ? "移出当前 Workset" : "加入当前 Workset"}</button>${canManage ? `<button data-product-edit="${escapeHtml(selected.id)}" type="button">编辑事实</button><button data-product-invite="${escapeHtml(selected.id)}" type="button">生成项目邀请</button>` : ""}${selected.current_user_role === "owner" ? `<button class="danger-action" data-product-delete="${escapeHtml(selected.id)}" type="button">删除项目</button>` : ""}</div><h3>项目成员 · ${members.length}</h3>${members.length ? `<div class="compact-list">${members.map((member) => { const canEdit = selected.current_user_role === "owner" && member.role !== "owner"; const canRemove = member.is_me || (["owner", "admin"].includes(selected.current_user_role) && member.role !== "owner"); return `<div class="compact-row"><span><strong>${escapeHtml(member.username)}${member.is_me ? " · 我" : ""}</strong><small>${escapeHtml(member.role)} · ${escapeHtml(member.duty || "未填写职责")}${member.is_external ? " · 外部" : ""}</small></span><span class="row-actions">${canEdit ? `<button data-project-member-edit="${escapeHtml(member.id)}" data-member-project="${escapeHtml(selected.id)}" type="button">角色/职责</button>` : ""}${canRemove ? `<button class="danger-action" data-project-member-delete="${escapeHtml(member.id)}" data-member-project="${escapeHtml(selected.id)}" type="button">${member.is_me ? "退出" : "移除"}</button>` : ""}</span></div>`; }).join("")}</div>` : `<div class="empty-state compact">尚无可显示成员。</div>`}` : `<div class="empty-state">选择一个项目查看详情。</div>`}</aside></div>`;
}

function wireOrganizationActions() {
  els.organizationContent.querySelectorAll("[data-organization-member-open]").forEach((button) => button.addEventListener("click", () => { state.selectedOrganizationMemberId = button.dataset.organizationMemberOpen; state.organizationSection = "members"; renderOrganization(); }));
  els.organizationContent.querySelectorAll("[data-organization-project-open]").forEach((button) => button.addEventListener("click", () => { state.selectedOrganizationProjectId = button.dataset.organizationProjectOpen; state.organizationSection = "projects"; renderOrganization(); }));
  document.querySelectorAll("[data-project-create]").forEach((button) => button.onclick = () => runAction(createProduct));
  els.organizationScopeActions.querySelectorAll("[data-organization-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editOrganization(button.dataset.organizationEdit))));
  els.organizationScopeActions.querySelectorAll("[data-organization-invite]").forEach((button) => button.addEventListener("click", () => runAction(() => inviteOrganization(button.dataset.organizationInvite))));
  els.organizationScopeActions.querySelectorAll("[data-organization-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteOrganization(button.dataset.organizationDelete))));
  els.organizationContent.querySelectorAll("[data-product-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editProduct(button.dataset.productEdit))));
  els.organizationContent.querySelectorAll("[data-product-invite]").forEach((button) => button.addEventListener("click", () => runAction(() => inviteProject(button.dataset.productInvite))));
  els.organizationContent.querySelectorAll("[data-product-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteProduct(button.dataset.productDelete))));
  els.organizationContent.querySelectorAll("[data-project-workset-toggle]").forEach((button) => button.addEventListener("click", () => runAction(() => toggleProjectInWorkset(button.dataset.projectWorksetToggle))));
  els.organizationContent.querySelectorAll("[data-organization-member-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editOrganizationMember(button.dataset.organizationMemberEdit, button.dataset.memberOrganization))));
  els.organizationContent.querySelectorAll("[data-organization-member-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteOrganizationMember(button.dataset.organizationMemberDelete, button.dataset.memberOrganization))));
  els.organizationContent.querySelectorAll("[data-project-member-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editProjectMember(button.dataset.projectMemberEdit, button.dataset.memberProject))));
  els.organizationContent.querySelectorAll("[data-project-member-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteProjectMember(button.dataset.projectMemberDelete, button.dataset.memberProject))));
}

function renderPlatformWork() {
  els.platformWorkFilter.value = state.platformWorkFilter;
  const scopedTasks = state.platform.tasks.filter(platformItemMatchesSelectedProject);
  const stateCounts = Object.fromEntries(TASK_STATES.map((taskState) => [taskState, scopedTasks.filter((task) => task.state === taskState).length]));
  els.workStateFilters.innerHTML = TASK_STATES.map((taskState) => `<button class="work-state-filter ${state.selectedState === taskState ? "is-active" : ""}" data-work-state="${taskState}" type="button" aria-pressed="${state.selectedState === taskState}"><span>${STATE_ICONS[taskState]}</span><strong>${STATE_LABELS[taskState]}</strong><em>${stateCounts[taskState]}</em></button>`).join("");
  els.workStateSummary.textContent = `${currentProject()?.name || state.platform.active_workset?.name || "当前产品集"} · ${STATE_LABELS[state.selectedState]} ${stateCounts[state.selectedState]} 项`;
  els.workStateFilters.querySelectorAll("[data-work-state]").forEach((button) => button.addEventListener("click", () => openWorkState(button.dataset.workState)));
  const tasks = rankTasks(scopedTasks.filter((task) => task.state === state.selectedState && (!state.platformWorkFilter || `${task.title} ${task.content} ${task.project_name} ${task.id} ${task.executor_id}`.toLowerCase().includes(state.platformWorkFilter))));
  if (!tasks.some((task) => String(task.id) === String(state.selectedPlatformTaskId))) state.selectedPlatformTaskId = String(tasks[0]?.id || "");
  const selectedTask = tasks.find((task) => String(task.id) === String(state.selectedPlatformTaskId)) || null;
  els.platformWorkTable.innerHTML = tasks.length ? `<table class="data-table platform-work-table"><colgroup><col style="width:90px"><col><col style="width:130px"><col style="width:92px"><col style="width:72px"><col style="width:100px"><col style="width:165px"></colgroup><thead><tr><th>待办</th><th>内容</th><th>产品</th><th>状态</th><th>优先级</th><th>执行人</th><th>管理</th></tr></thead><tbody>${tasks.map((task) => { const canManage = canManagePlatformTask(task); return `<tr class="${String(task.id) === state.selectedPlatformTaskId ? "selected" : ""}" data-platform-task-select="${escapeHtml(task.id)}"><td class="queue-number">${escapeHtml(task.id)}</td><td class="task-title-cell">${task.father_id ? `<small class="parent-task-ref">↳ ${escapeHtml(task.father_id)}</small>` : ""}${escapeHtml(task.title)}${task.tags ? `<small class="task-tags">${escapeHtml(Array.isArray(task.tags) ? task.tags.join(" · ") : task.tags)}</small>` : ""}</td><td>${escapeHtml(task.project_name)}</td><td><span class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</span></td><td>${escapeHtml(formatPriority(task.priority))}</td><td>${escapeHtml(task.assignee?.username || task.assignee?.name || task.executor_id || "未分配")}</td><td><span class="row-actions">${canManage ? `<button data-platform-task-edit="${escapeHtml(task.id)}" type="button">编辑</button>` : ""}<button data-platform-task-attachment="${escapeHtml(task.id)}" type="button">附件</button>${canManage ? `<button class="danger-action" data-platform-task-delete="${escapeHtml(task.id)}" type="button">删除</button>` : ""}</span></td></tr>`; }).join("")}</tbody></table>` : `<div class="empty-state">当前产品集或筛选条件下没有待办。</div>`;
  els.platformWorkTable.querySelectorAll("[data-platform-task-select]").forEach((row) => row.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    state.selectedPlatformTaskId = row.dataset.platformTaskSelect;
    renderPlatformWork();
  }));
  els.platformWorkTable.querySelectorAll("[data-platform-task-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editTask(button.dataset.platformTaskEdit))));
  els.platformWorkTable.querySelectorAll("[data-platform-task-attachment]").forEach((button) => button.addEventListener("click", () => runAction(() => manageTaskAttachments(button.dataset.platformTaskAttachment))));
  els.platformWorkTable.querySelectorAll("[data-platform-task-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteTask(button.dataset.platformTaskDelete))));
  renderPlatformWorkInspector(selectedTask);
}

function renderPlatformWorkInspector(task) {
  if (!task) {
    els.platformWorkInspector.innerHTML = `<div class="empty-state">选择待办查看详情与允许操作。</div>`;
    return;
  }
  const workspace = state.platform.product_workspaces.find((item) => String(item.id) === String(task.project_id));
  const automationTask = state.snapshot.tasks.find((item) => String(item.id) === String(task.id)) || null;
  const feedbackItems = automationTask?.acceptance_feedback_items || [];
  const canManage = canManagePlatformTask(task);
  const automationActions = automationTask ? taskActions(automationTask) : [];
  const acceptanceFeedback = automationTask?.state === "completed" ? `<section class="acceptance-feedback-panel"><div class="section-title-row"><div><h3>验收问题与进展</h3><p>${feedbackItems.length} 项验收问题</p></div></div><div class="acceptance-feedback-list">${feedbackItems.length ? feedbackItems.map((item) => `<button class="acceptance-feedback-item" data-work-task-feedback="${escapeHtml(item.feedback_id)}" type="button"><span><strong>${escapeHtml(item.original_feedback)}</strong><small>${escapeHtml(item.feedback_id)} · ${escapeHtml(item.progress)}</small></span><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></button>`).join("") : `<div class="empty-state compact">尚未发现验收问题。</div>`}</div><label class="acceptance-feedback-composer"><span>提出验收问题</span><textarea id="workAcceptanceFeedbackInput" rows="3" placeholder="描述验收中发现的问题…"></textarea><small>待办保持已完成；问题进入 Automation 独立队列并复用同一 Agent 对话。</small><button id="submitWorkAcceptanceFeedbackButton" class="primary-button" type="button">提出验收问题</button></label></section>` : automationTask?.state === "accepted" ? `<section class="acceptance-feedback-panel acceptance-clear"><div class="section-title-row"><div><h3>验收通过</h3><p>当前没有待处理的验收问题</p></div></div><div class="empty-state compact">该待办已验收，不再接受新的验收问题。</div></section>` : "";
  els.platformWorkInspector.innerHTML = `<h2>${escapeHtml(task.title)}</h2><p>${escapeHtml(task.content || "没有补充内容")}</p><span class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</span>${factRows([
    ["待办标识", task.id],
    ["所属产品", task.project_name],
    ["执行人", task.assignee?.username || task.assignee?.name || task.executor_id || "未分配"],
    ["优先级", formatPriority(task.priority)],
    ["父待办", task.father_id || "无"],
    ["本地工作区", automationTask?.local_project_path || workspace?.local_path || "未绑定"],
    ["自动执行资格", automationTask ? (automationTask.eligible ? `队列第 ${automationTask.queue_position} 项` : automationTask.eligibility_reason || "不适用于当前状态") : "不在当前用户 Automation 范围"]
  ])}<div class="task-actions platform-work-management">${canManage ? `<button class="secondary-button" data-work-inspector-edit="${escapeHtml(task.id)}" type="button">编辑</button>` : ""}<button class="secondary-button" data-work-inspector-attachment="${escapeHtml(task.id)}" type="button">附件</button>${canManage ? `<button class="secondary-button danger-action" data-work-inspector-delete="${escapeHtml(task.id)}" type="button">删除</button>` : ""}</div>${automationActions.length ? `<div class="task-actions platform-work-automation">${automationActions.map((action) => `<button class="${action.primary ? "primary-button" : "secondary-button"}" data-work-task-action="${action.id}" type="button">${action.label}</button>`).join("")}</div>` : ""}${acceptanceFeedback}`;
  els.platformWorkInspector.querySelector("[data-work-inspector-edit]")?.addEventListener("click", () => runAction(() => editTask(task.id)));
  els.platformWorkInspector.querySelector("[data-work-inspector-attachment]")?.addEventListener("click", () => runAction(() => manageTaskAttachments(task.id)));
  els.platformWorkInspector.querySelector("[data-work-inspector-delete]")?.addEventListener("click", () => runAction(() => deleteTask(task.id)));
  els.platformWorkInspector.querySelectorAll("[data-work-task-action]").forEach((button) => button.addEventListener("click", () => runAction(() => executeTaskAction(automationTask, button.dataset.workTaskAction))));
  els.platformWorkInspector.querySelectorAll("[data-work-task-feedback]").forEach((button) => button.addEventListener("click", () => {
    const item = feedbackItems.find((entry) => entry.feedback_id === button.dataset.workTaskFeedback);
    if (item) openWorkbench("review", item.current_run_id || item.source_run_id, { task: automationTask, feedbackId: item.feedback_id });
  }));
  els.platformWorkInspector.querySelector("#submitWorkAcceptanceFeedbackButton")?.addEventListener("click", () => runAction(async () => {
    const input = els.platformWorkInspector.querySelector("#workAcceptanceFeedbackInput");
    const message = input.value.trim();
    if (!message) throw new Error("请先描述验收问题。");
    const key = globalThis.crypto?.randomUUID?.() || `${task.id}-${Date.now()}`;
    await api.submitAcceptanceFeedback({ taskId: task.id, message, idempotencyKey: key });
    input.value = "";
    await refreshSnapshot();
  }));
}

function renderPlatformFeedback() {
  const ordinary = (state.platform.feedback_v1 || []).filter(platformItemMatchesSelectedProject);
  els.ordinaryFeedbackTable.innerHTML = ordinary.length ? `<table class="data-table feedback-data-table"><colgroup><col style="width:75px"><col><col style="width:105px"><col style="width:70px"><col style="width:85px"><col style="width:155px"></colgroup><thead><tr><th>反馈</th><th>内容</th><th>产品</th><th>优先级</th><th>关联待办</th><th>管理</th></tr></thead><tbody>${ordinary.map((item) => `<tr><td>${escapeHtml(item.short_id || item.id)}</td><td class="task-title-cell">${escapeHtml(item.title || item.content || "未命名反馈")}${item.ignored ? " · 已忽略" : ""}</td><td>${escapeHtml(item.project_name)}</td><td>${escapeHtml(item.priority || "未设置")}</td><td>${escapeHtml(item.linked_task_id || "未关联")}</td><td><span class="row-actions"><button data-feedback-edit="${escapeHtml(item.id)}" type="button">编辑</button><button data-feedback-task="${escapeHtml(item.id)}" type="button">转待办</button>${["owner", "admin"].includes(state.platform.product_workspaces.find((workspace) => String(workspace.id) === String(item.project_id))?.current_user_role) ? `<button class="danger-action" data-feedback-delete="${escapeHtml(item.id)}" type="button">删除</button>` : ""}</span></td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">当前产品集没有普通用户反馈。</div>`;
  els.ordinaryFeedbackTable.querySelectorAll("[data-feedback-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editFeedback(button.dataset.feedbackEdit))));
  els.ordinaryFeedbackTable.querySelectorAll("[data-feedback-task]").forEach((button) => button.addEventListener("click", () => runAction(() => feedbackToTask(button.dataset.feedbackTask))));
  els.ordinaryFeedbackTable.querySelectorAll("[data-feedback-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteFeedback(button.dataset.feedbackDelete))));
  if (state.platform.capabilities.feedback_v2 === "unavailable") {
    els.ordinaryFeedbackTable.insertAdjacentHTML("afterbegin", `<div class="capability-notice"><strong>Feedback V2 尚未接入</strong><span>本页严格使用现有 Workshop Feedback V1 接口，不伪造 V2 能力。</span></div>`);
  }
}

async function createProduct() {
  const scope = currentOrganizationScope();
  const values = await openPlatformAction({
    title: scope ? `在 ${scope.name} 创建项目` : "创建个人项目",
    lead: `组织归属在创建时确定；创建后 ArcOrbit 不提供迁移入口。本地绑定、Workset 和 Automation 授权仍分别管理。`,
    confirmLabel: "创建产品",
    fields: [
      platformField("name", "产品名称", { required: true, placeholder: "例如：虚拟产品 A" }),
      platformField("git_url", "Git 地址", { placeholder: "可选" })
    ]
  });
  if (!values) return;
  await executeManagedAction("project.create", { ...values, ...(scope ? { organization_id: scope.id } : {}) }, "产品已创建");
}

async function editProduct(projectId) {
  const project = findProject(projectId);
  const values = await openPlatformAction({
    title: `编辑 ${project.name}`,
    lead: "仅更新 Workshop 项目事实，不改变当前产品集或 Automation 授权。",
    confirmLabel: "保存",
    fields: [
      platformField("name", "产品名称", { required: true, value: project.name }),
      platformField("git_url", "Git 地址", { value: project.git_url }),
      platformField("project_scope", "所属范围（只读）", { value: project.organization_id ? currentOrganizationScope()?.name || "组织项目" : "个人项目", readonly: true, help: "项目创建后不在 ArcOrbit 中迁移组织。" })
    ]
  });
  if (!values) return;
  await executeManagedAction("project.update", { project_id: project.id, ...values }, "产品信息已更新");
}

async function inviteProject(projectId) {
  const project = findProject(projectId);
  const values = await openPlatformAction({
    title: `邀请加入 ${project.name}`,
    lead: `目标项目：${project.name}。这是可转发的通用邀请，不绑定当前浏览的成员。`,
    confirmLabel: "生成邀请",
    fields: inviteFields()
  });
  if (!values) return;
  const invitation = await executeManagedAction("project.invite", { project_id: project.id, ...values }, "项目邀请已生成", { refresh: false });
  await showInvitationResult("项目邀请", project.name, invitation);
}

async function editCurrentWorkset() {
  const activeWorkset = state.platform.active_workset;
  if (!activeWorkset) throw new Error("当前没有可更新的产品集。");
  const selected = new Set(activeWorkset.project_ids || []);
  const values = await openPlatformAction({
    title: `管理 ${activeWorkset.name}`,
    lead: "同时选择要在 Today、Work、Automation 和 Feedback 展示的产品；不会改变组织治理或 Automation participation。",
    confirmLabel: "保存推进范围",
    fields: [platformCheckboxGroup("project_ids", "展示产品", (state.platform.projects || []).map((project) => ({ value: project.id, label: project.name, detail: project.organization_id ? organizationName(project.organization_id) : "个人项目", checked: selected.has(String(project.id)) })))]
  });
  if (!values) return;
  const projectIds = Array.isArray(values.project_ids) ? values.project_ids : values.project_ids ? [values.project_ids] : [];
  await api.updateWorkset({ id: activeWorkset.id, project_ids: projectIds });
  await refreshSnapshot();
  showToast(`已保存 ${projectIds.length} 个产品；Automation 授权未改变。`);
}

async function toggleProjectInWorkset(projectId) {
  const activeWorkset = state.platform.active_workset;
  if (!activeWorkset) throw new Error("当前没有可更新的产品集。");
  const projectIds = new Set(activeWorkset.project_ids || []);
  if (projectIds.has(String(projectId))) projectIds.delete(String(projectId));
  else projectIds.add(String(projectId));
  await api.updateWorkset({ id: activeWorkset.id, project_ids: [...projectIds] });
  await refreshSnapshot();
  showToast("当前产品集已更新；Automation 授权未改变。");
}

async function joinByInvitationCode() {
  const values = await openPlatformAction({
    title: "使用邀请码加入",
    lead: "加入动作由当前登录用户发起；成功后重新同步组织和项目事实。",
    confirmLabel: "加入",
    fields: [
      platformField("kind", "邀请类型", { type: "select", options: [{ value: "organization", label: "组织邀请" }, { value: "project", label: "项目邀请" }] }),
      platformField("invite_code", "邀请码", { required: true, placeholder: "输入收到的邀请码" })
    ]
  });
  if (!values) return;
  await executeManagedAction(values.kind === "organization" ? "organization.join" : "project.join", { invite_code: values.invite_code }, "已加入，正在刷新治理范围");
}

async function deleteProduct(projectId) {
  const project = findProject(projectId);
  if (!window.confirm(`确定删除产品“${project.name}”吗？该操作由 Workshop 服务执行，可能同时影响成员和待办。`)) return;
  await executeManagedAction("project.delete", { project_id: project.id }, "产品已删除");
}

async function createOrganization() {
  const values = await openPlatformAction({
    title: "创建组织",
    lead: "组织承载团队成员和产品归属。",
    confirmLabel: "创建组织",
    fields: [platformField("name", "组织名称", { required: true }), platformField("description", "说明", { type: "textarea" })]
  });
  if (!values) return;
  await executeManagedAction("organization.create", values, "组织已创建");
}

async function editOrganization(organizationId) {
  const organization = findOrganization(organizationId);
  const values = await openPlatformAction({
    title: `编辑 ${organization.name}`,
    lead: "更新 Workshop 组织的名称与说明。",
    confirmLabel: "保存",
    fields: [platformField("name", "组织名称", { required: true, value: organization.name }), platformField("description", "说明", { type: "textarea", value: organization.description })]
  });
  if (!values) return;
  await executeManagedAction("organization.update", { organization_id: organization.id, ...values }, "组织信息已更新");
}

async function inviteOrganization(organizationId) {
  const organization = findOrganization(organizationId);
  const values = await openPlatformAction({ title: `邀请加入 ${organization.name}`, lead: `目标组织：${organization.name}。生成通用邀请；加入动作由接收者完成。`, confirmLabel: "生成邀请", fields: inviteFields() });
  if (!values) return;
  const invitation = await executeManagedAction("organization.invite", { organization_id: organization.id, ...values }, "组织邀请已生成", { refresh: false });
  await showInvitationResult("组织邀请", organization.name, invitation);
}

async function deleteOrganization(organizationId) {
  const organization = findOrganization(organizationId);
  if (!window.confirm(`确定删除组织“${organization.name}”吗？请先确认其下产品已妥善处理。`)) return;
  await executeManagedAction("organization.delete", { organization_id: organization.id }, "组织已删除");
}

async function editOrganizationMember(memberId, organizationId) {
  const member = findOrganizationMember(memberId, organizationId);
  const values = await openPlatformAction({
    title: `调整 ${member.username} 的组织角色`,
    lead: "组织角色使用 Workshop 当前支持的 Admin / Member 边界。",
    confirmLabel: "保存角色",
    fields: [platformField("role", "组织角色", { type: "select", value: member.role, options: roleOptions() })]
  });
  if (!values) return;
  await executeManagedAction("organization.member.update", { organization_id: organizationId, target_user_id: member.user_id, ...values }, "组织成员角色已更新");
}

async function deleteOrganizationMember(memberId, organizationId) {
  const member = findOrganizationMember(memberId, organizationId);
  if (!window.confirm(`确定将 ${member.username} 从组织中移除吗？`)) return;
  await executeManagedAction("organization.member.delete", { organization_id: organizationId, target_user_id: member.user_id }, "组织成员已移除");
}

async function editProjectMember(memberId, projectId) {
  const member = findProjectMember(memberId, projectId);
  const values = await openPlatformAction({ title: `管理 ${member.username}`, lead: "Workshop 当前仅允许项目 Owner 维护非 Owner 成员的角色和职责。", confirmLabel: "保存", fields: [platformField("role", "项目角色", { type: "select", value: member.role, options: roleOptions() }), platformField("duty", "产品职责", { value: member.duty })] });
  if (!values) return;
  await executeManagedAction("project.member.update", { project_id: projectId, target_user_id: member.user_id, ...values }, "成员信息已更新");
}

async function deleteProjectMember(memberId, projectId) {
  const member = findProjectMember(memberId, projectId);
  if (!window.confirm(`确定将 ${member.username} 从 ${member.project_name} 移除吗？`)) return;
  await executeManagedAction("project.member.delete", { project_id: projectId, target_user_id: member.user_id }, "项目成员已移除");
}

async function createTask() {
  const projects = workspaceOptions();
  if (!projects.length) throw new Error("当前产品集没有可创建待办的产品。");
  const defaultProjectId = taskCreationDefaultProjectId(projects);
  const values = await openPlatformAction({
    title: "创建待办",
    lead: "待办写入 Workshop；是否进入 Automation 仍由分配对象、状态和项目授权共同决定。",
    confirmLabel: "创建待办",
    fields: [
      platformField("project_id", "产品", { type: "select", required: true, value: defaultProjectId, options: projects }),
      platformField("content", "待办内容", { type: "textarea", required: true }),
      platformField("state", "状态", { type: "select", value: "pending_review", options: taskStateOptions() }),
      platformField("executor_id", "执行人", { type: "select", options: memberSelectOptions() }),
      platformField("father_id", "父待办", { type: "select", options: taskSelectOptions() }),
      platformField("priority", "服务优先级", { type: "number", value: "0", min: 0, help: "Workshop 数值越小优先级越高。" }),
      platformField("tags", "标签", { placeholder: "按现有 Workshop 格式填写" })
    ]
  });
  if (!values) return;
  await executeManagedAction("task.create", values, "待办已创建");
}

async function editTask(taskId) {
  const task = findPlatformTask(taskId);
  const values = await openPlatformAction({
    title: `编辑待办 ${task.id}`,
    lead: `所属产品：${task.project_name}。父待办、执行人、优先级和标签均使用 Workshop 现有字段。`,
    confirmLabel: "保存",
    fields: [
      platformField("content", "待办内容", { type: "textarea", required: true, value: task.content || task.title }),
      platformField("state", "状态", { type: "select", value: task.state, options: taskStateOptions() }),
      platformField("executor_id", "执行人", { type: "select", value: task.executor_id, options: memberSelectOptions(task.project_id) }),
      platformField("father_id", "父待办", { type: "select", value: task.father_id, options: taskSelectOptions(task.project_id, task.id) }),
      platformField("priority", "服务优先级", { type: "number", value: servicePriority(task.priority), min: 0, help: "Workshop 数值越小优先级越高。" }),
      platformField("tags", "标签", { value: task.tags })
    ]
  });
  if (!values) return;
  const automationTask = state.snapshot.tasks.find((item) => String(item.id) === String(task.id));
  if (values.state === "accepted" && (automationTask?.acceptance_feedback_items || []).some((item) => !["resolved", "cancelled"].includes(item.status))) {
    throw new Error("仍有未解决的验收问题，不能标记为已验收。");
  }
  await executeManagedAction("task.update", { task_id: task.id, ...values }, "待办已更新");
}

async function deleteTask(taskId) {
  const task = findPlatformTask(taskId);
  if (!window.confirm(`确定删除待办“${task.title}”吗？`)) return;
  await executeManagedAction("task.delete", { task_id: task.id }, "待办已删除");
}

async function manageTaskAttachments(taskId) {
  const task = findPlatformTask(taskId);
  const attachments = await api.executePlatformAction("task.attachments.list", { task_id: task.id });
  const userId = String(state.platform.user?.id || "");
  const role = findWorkspace(task.project_id).current_user_role;
  const editable = (attachments || []).filter((item) => String(item.creator_id) === userId);
  const deletable = (attachments || []).filter((item) => String(item.creator_id) === userId || String(task.creator_id) === userId || ["owner", "admin"].includes(role));
  const operation = await openPlatformAction({
    title: `待办 ${task.id} 的附件`,
    lead: `${attachments?.length || 0} 个附件；所有项目成员可新增，只有创建者可改内容，删除还允许待办创建者和项目 admin/owner。`,
    confirmLabel: "下一步",
    fields: [platformField("operation", "操作", { type: "select", options: [{ value: "create", label: "新增" }, ...(editable.length ? [{ value: "update", label: "更新我创建的附件" }] : []), ...(deletable.length ? [{ value: "delete", label: "删除有权限的附件" }] : [])] })]
  });
  if (!operation) return;
  if (operation.operation === "create") {
    const values = await openPlatformAction({ title: "新增附件", confirmLabel: "新增", fields: [platformField("type", "类型", { type: "select", options: ["text", "file", "url"].map((value) => ({ value, label: value })) }), platformField("content", "内容", { type: "textarea", required: true })] });
    if (values) await executeManagedAction("task.attachment.create", { task_id: task.id, ...values }, "附件已新增");
    return;
  }
  const candidates = operation.operation === "update" ? editable : deletable;
  const values = await openPlatformAction({
    title: operation.operation === "update" ? "更新附件" : "删除附件",
    confirmLabel: operation.operation === "update" ? "保存" : "删除",
    fields: [platformField("attachment_id", "附件", { type: "select", options: candidates.map((item) => ({ value: item.id, label: `${item.id} · ${item.type} · ${item.content.slice(0, 50)}` })) }), ...(operation.operation === "update" ? [platformField("content", "新内容", { type: "textarea", required: true })] : [])]
  });
  if (!values) return;
  if (operation.operation === "update") await executeManagedAction("task.attachment.update", values, "附件已更新");
  else await executeManagedAction("task.attachment.delete", values, "附件已删除");
}

async function createTag() {
  const tags = state.platform.tags || [];
  const values = await openPlatformAction({
    title: "管理标签",
    lead: "标签归属于单个 Workshop 项目。更新或删除时请选择已有标签。",
    confirmLabel: "执行",
    fields: [
      platformField("operation", "操作", { type: "select", options: [{ value: "create", label: "新增" }, { value: "update", label: "重命名" }, { value: "delete", label: "删除" }] }),
      platformField("project_id", "产品", { type: "select", options: workspaceOptions() }),
      platformField("tag_id", "已有标签", { type: "select", options: [{ value: "", label: "新增时无需选择" }, ...tags.map((tag) => ({ value: tag.id, label: `${tag.project_name} · ${tag.name}` }))] }),
      platformField("name", "标签名称")
    ]
  });
  if (!values) return;
  if (values.operation === "create") await executeManagedAction("tag.create", values, "标签已创建");
  else if (values.operation === "update") await executeManagedAction("tag.update", values, "标签已更新");
  else await executeManagedAction("tag.delete", values, "标签已删除");
}

async function createFeedback() {
  const values = await feedbackForm({ title: "创建普通反馈", confirmLabel: "创建反馈" });
  if (!values) return;
  await executeManagedAction("feedback.create", feedbackPayload(values), "反馈已创建");
}

async function editFeedback(feedbackId) {
  const feedback = findFeedback(feedbackId);
  const values = await feedbackForm({ title: `编辑反馈 ${feedback.short_id || feedback.id}`, confirmLabel: "保存", feedback });
  if (!values) return;
  await executeManagedAction("feedback.update", { feedback_id: feedback.id, ...feedbackPayload(values, feedback.metadata) }, "反馈已更新");
}

async function feedbackToTask(feedbackId) {
  const feedback = findFeedback(feedbackId);
  if (feedback.linked_task_id && !window.confirm(`该反馈已关联待办 ${feedback.linked_task_id}。仍要新建另一个待办吗？`)) return;
  const values = await openPlatformAction({
    title: "反馈转待办",
    lead: "这是现有 Feedback V1 与 Todo 的非事务组合：先创建待办，再把待办 ID 写回反馈 data；若第二步失败会明确保留部分成功信息。",
    confirmLabel: "创建并关联",
    fields: [
      platformField("task_content", "待办内容", { type: "textarea", required: true, value: feedback.content }),
      platformField("task_state", "初始状态", { type: "select", value: "pending_review", options: taskStateOptions() }),
      platformField("executor_id", "执行人", { type: "select", options: memberSelectOptions(feedback.project_id) }),
      platformField("task_priority", "服务优先级", { type: "number", value: "0", min: 0 }),
      platformField("task_tags", "标签")
    ]
  });
  if (!values) return;
  await executeManagedAction("feedback.to_task", { feedback_id: feedback.id, project_id: feedback.project_id, metadata: feedback.metadata, ...values }, "反馈已转为待办并完成关联");
}

async function deleteFeedback(feedbackId) {
  const feedback = findFeedback(feedbackId);
  if (!window.confirm(`确定删除反馈“${feedback.title || feedback.short_id || feedback.id}”吗？`)) return;
  await executeManagedAction("feedback.delete", { feedback_id: feedback.id }, "反馈已删除");
}

async function feedbackForm({ title, confirmLabel, feedback = {} }) {
  return openPlatformAction({
    title,
    lead: "使用 Workshop Feedback V1 字段；优先级、忽略态和待办关联保存在 data 元数据中。",
    confirmLabel,
    fields: [
      ...(feedback.id ? [] : [platformField("project_id", "产品", { type: "select", required: true, options: workspaceOptions() })]),
      platformField("title", "标题", { required: true, value: feedback.title }),
      platformField("content", "内容", { type: "textarea", required: true, value: feedback.content }),
      platformField("priority", "优先级", { type: "select", value: feedback.priority, options: [{ value: "", label: "未设置" }, ...["P1", "P2", "P3"].map((value) => ({ value, label: value }))] }),
      platformField("ignored", "处理状态", { type: "select", value: feedback.ignored ? "true" : "false", options: [{ value: "false", label: "正常" }, { value: "true", label: "已忽略" }] }),
      platformField("custom_user_id", "外部用户 ID", { value: feedback.custom_user_id }),
      platformField("user_phone", "联系电话", { value: feedback.user_phone }),
      platformField("user_email", "联系邮箱", { value: feedback.user_email }),
      platformField("file", "附件地址", { value: feedback.file })
    ]
  });
}

function feedbackPayload(values, existingMetadata = {}) {
  const { priority, ignored, ...fields } = values;
  return { ...fields, data: { ...existingMetadata, priority, ignored: ignored === "true" } };
}

async function executeManagedAction(command, input, message, { refresh = true } = {}) {
  try {
    const result = await api.executePlatformAction(command, input);
    if (refresh) await refreshSnapshot();
    showToast(message);
    return result;
  } catch (error) {
    if (error?.partial_result) throw new Error(`${error.message}；待办 ${error.partial_result.task_id} 已创建，但反馈关联失败。`);
    throw error;
  }
}

function openPlatformAction({ title, lead = "", confirmLabel = "确认", fields = [] }) {
  if (platformActionResolver) closePlatformAction(null);
  els.platformActionTitle.textContent = title;
  els.platformActionLead.textContent = lead;
  els.confirmPlatformActionButton.textContent = confirmLabel;
  els.platformActionFields.innerHTML = fields.join("");
  els.platformActionOverlay.classList.remove("hidden");
  els.platformActionFields.querySelector("input, textarea, select")?.focus();
  return new Promise((resolve) => { platformActionResolver = resolve; });
}

function closePlatformAction(value) {
  if (!platformActionResolver) return;
  const resolve = platformActionResolver;
  platformActionResolver = null;
  els.platformActionOverlay.classList.add("hidden");
  resolve(value);
}

function serializePlatformAction() {
  const data = new FormData(els.platformActionForm);
  const values = Object.fromEntries(data.entries());
  els.platformActionForm.querySelectorAll("[data-multiple-field]").forEach((container) => {
    values[container.dataset.multipleField] = data.getAll(container.dataset.multipleField);
  });
  return values;
}

function platformField(name, label, { type = "text", value = "", required = false, readonly = false, placeholder = "", options = [], min, help = "" } = {}) {
  const attrs = `${required ? " required" : ""}${readonly ? " readonly" : ""}${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}${min !== undefined ? ` min="${escapeHtml(min)}"` : ""}`;
  const control = type === "textarea"
    ? `<textarea name="${escapeHtml(name)}" rows="4"${attrs}>${escapeHtml(value)}</textarea>`
    : type === "select"
      ? `<select name="${escapeHtml(name)}"${attrs}>${options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value ?? "") ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>`
      : `<input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"${attrs}>`;
  return `<label class="platform-action-field"><span>${escapeHtml(label)}</span>${control}${help ? `<small>${escapeHtml(help)}</small>` : ""}</label>`;
}

function platformCheckboxGroup(name, label, options) {
  return `<fieldset class="platform-action-field platform-checkbox-group" data-multiple-field="${escapeHtml(name)}"><legend>${escapeHtml(label)}</legend>${options.length ? options.map((option) => `<label><input name="${escapeHtml(name)}" type="checkbox" value="${escapeHtml(option.value)}" ${option.checked ? "checked" : ""}><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.detail || "")}</small></span></label>`).join("") : `<div class="empty-state compact">尚无可访问项目。</div>`}</fieldset>`;
}

async function showInvitationResult(kind, targetName, value) {
  const invitation = value?.invitation && typeof value.invitation === "object" ? value.invitation : value || {};
  const code = String(invitation.invite_code || invitation.code || "");
  const link = String(invitation.invite_link || invitation.link || "");
  const role = String(invitation.role || "member");
  const expiresAt = String(invitation.expires_at || invitation.expired_at || "长期有效");
  const maxUses = String(invitation.max_uses ?? "1");
  const promise = openPlatformAction({
    title: `${kind}已生成 · ${targetName}`,
    lead: "这是创建响应的一次性结果。当前 Workshop 不支持邀请历史、再次查看或撤销。",
    confirmLabel: "我已保存，关闭",
    fields: [`<section class="invitation-result"><div><span>邀请码</span><strong>${escapeHtml(code || "服务未返回")}</strong>${code ? `<button data-copy-invitation="${escapeHtml(code)}" type="button">复制邀请码</button>` : ""}</div>${link ? `<div><span>邀请链接</span><code>${escapeHtml(link)}</code><button data-copy-invitation="${escapeHtml(link)}" type="button">复制链接</button></div>` : ""}<dl><div><dt>目标</dt><dd>${escapeHtml(targetName)}</dd></div><div><dt>角色</dt><dd>${escapeHtml(role)}</dd></div><div><dt>到期</dt><dd>${escapeHtml(expiresAt)}</dd></div><div><dt>使用上限</dt><dd>${escapeHtml(maxUses)}</dd></div></dl><p>邀请不绑定某位成员。请立即复制并通过合适渠道自行转发；接收者需在自己的会话中使用邀请码加入。</p></section>`]
  });
  els.platformActionFields.querySelectorAll("[data-copy-invitation]").forEach((button) => button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.copyInvitation);
    showToast("已复制邀请信息。");
  }));
  await promise;
}

function inviteFields() {
  return [
    platformField("role", "受邀角色", { type: "select", options: roleOptions() }),
    platformField("expires_in", "有效小时数", { type: "number", value: "0", min: 0, help: "0 表示使用服务端的长期邀请语义。" }),
    platformField("max_uses", "最多使用次数", { type: "number", value: "1", min: 1 })
  ];
}

function roleOptions() { return [{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }]; }
function taskStateOptions() { return TASK_STATES.map((value) => ({ value, label: STATE_LABELS[value] || value })); }
function workspaceOptions() { return (state.platform.product_workspaces || []).map((item) => ({ value: item.id, label: item.name })); }
function taskCreationDefaultProjectId(projects) {
  return projects.some((project) => String(project.value) === String(state.selectedProjectId))
    ? state.selectedProjectId
    : projects[0]?.value || "";
}
function organizationOptions() { return (state.platform.organizations || []).map((item) => ({ value: item.id, label: item.name })); }
function memberSelectOptions(projectId = "") { return [{ value: "", label: "未分配" }, ...(state.platform.members || []).filter((item) => !projectId || String(item.project_id) === String(projectId)).map((item) => ({ value: item.user_id, label: `${item.project_name} · ${item.username}` }))]; }
function taskSelectOptions(projectId = "", excludedTaskId = "") { return [{ value: "", label: "根待办" }, ...(state.platform.tasks || []).filter((item) => (!projectId || String(item.project_id) === String(projectId)) && String(item.id) !== String(excludedTaskId)).map((item) => ({ value: item.id, label: `${item.project_name} · ${item.id} · ${item.title}` }))]; }
function findProject(id) { const value = state.platform.projects.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到产品。"); return value; }
function currentOrganizationScope() { return (state.platform.organization_scopes || []).find((item) => String(item.id) === String(state.organizationScopeId)) || null; }
function organizationName(id) { return (state.platform.organization_scopes || []).find((item) => String(item.id) === String(id))?.name || "组织项目"; }
function findOrganization(id) { const value = state.platform.organizations.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到组织。"); return value; }
function findOrganizationMember(id, organizationId) { const value = state.platform.organization_members.find((item) => String(item.id) === String(id) && String(item.organization_id) === String(organizationId)); if (!value) throw new Error("未找到组织成员。"); return value; }
function findWorkspace(id) { const value = state.platform.product_workspaces.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到产品工作区。"); return value; }
function findProjectMember(id, projectId) { const value = (state.platform.project_members || []).find((item) => String(item.id) === String(id) && String(item.project_id) === String(projectId)); if (!value) throw new Error("未找到项目成员。"); return value; }
function findPlatformTask(id) { const value = state.platform.tasks.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到待办。"); return value; }
function findFeedback(id) { const value = state.platform.feedback_v1.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到反馈。"); return value; }
function canManagePlatformTask(task) { const role = findWorkspace(task.project_id).current_user_role; return task.state !== "in_progress" || ["owner", "admin"].includes(role) || String(task.executor_id) === String(state.platform.user?.id || ""); }
function servicePriority(value) { const number = Number(value || 0); return number > 0 ? Math.max(0, 100 - number) : 0; }

function renderCommandCenter() {
  const snapshot = state.snapshot;
  const worksetProjects = automationProjectsInActiveWorkset();
  const scopedProjects = state.selectedProjectId === "all" ? worksetProjects : worksetProjects.filter((project) => String(project.id) === state.selectedProjectId);
  const scopedQueue = snapshot.queue.filter(scopedTaskFilter);
  const scopedBlockedPending = (snapshot.blocked_pending_tasks || []).filter(scopedTaskFilter);
  const scopedFeedback = (snapshot.acceptance_feedback_queue || []).filter(scopedTaskFilter);
  els.commandHeading.textContent = state.selectedProjectId === "all" ? "产品集自动领取态势" : `${currentProject()?.name || "项目"} 自动领取态势`;
  els.commandSummary.textContent = `${scopedProjects.length} 个项目 · ${scopedProjects.filter((project) => project.participating).length} 个允许自动领取 · ${scopedProjects.filter((project) => project.eligible).length} 个具备执行资格 · 最近同步 ${snapshot.synced_at ? formatTime(snapshot.synced_at) : "尚未完成"}`;
  els.healthBadge.className = `health-badge ${snapshot.health?.tone === "success" ? "success" : snapshot.health?.tone === "danger" ? "danger" : snapshot.health?.tone === "warning" ? "warning" : ""}`;
  els.healthBadge.textContent = snapshot.health?.label || "待命";
  els.queuePauseButton.textContent = snapshot.queue_paused ? "继续领取" : "暂停领取";
  els.queuePauseButton.disabled = !snapshot.enabled;
  els.acceptanceFeedbackOnlyButton.classList.toggle("is-active", state.acceptanceFeedbackOnly);
  els.acceptanceFeedbackOnlyButton.setAttribute("aria-pressed", String(state.acceptanceFeedbackOnly));
  els.acceptanceFeedbackOnlyButton.textContent = state.acceptanceFeedbackOnly ? "显示全部自动化" : "仅看验收问题";
  els.ordinaryQueueCard.classList.toggle("hidden", state.acceptanceFeedbackOnly);
  els.recentCompletionsCard.classList.toggle("hidden", state.acceptanceFeedbackOnly);

  const runningCount = activeExecutionMatchesSelectedProject(snapshot.active_task) ? 1 : 0;
  const humanAttentionCount = snapshot.attention_items.filter(scopedTaskFilter).length;
  const recoveryCount = snapshot.recovery_items.length;
  const attentionCount = humanAttentionCount + recoveryCount;
  const metrics = [
    metric("自动领取", snapshot.health?.label || "待命", sourceStatusLabel(snapshot.source_status), snapshot.health?.tone === "success" ? "healthy" : ""),
    metric("待处理事项", attentionCount, humanAttentionCount
      ? `${humanAttentionCount} 项需要人工决策`
      : recoveryCount
        ? `${recoveryCount} 项需要恢复自动化`
        : "没有待处理事项", attentionCount ? "attention" : ""),
    metric("运行中", runningCount, snapshot.active_task?.phase || "没有活动任务", runningCount ? "running" : ""),
    ...(!state.acceptanceFeedbackOnly ? [metric("普通待办队列", scopedQueue.length, scopedQueue[0] ? `下一项 ${scopedQueue[0].id}` : scopedBlockedPending.length ? `${scopedBlockedPending.length} 项尚未启用` : "没有可执行任务", scopedBlockedPending.length ? "attention" : "")] : []),
    metric("验收问题队列", scopedFeedback.length, scopedFeedback.length ? `${snapshot.acceptance_feedback_counts?.queued || 0} queued · ${snapshot.acceptance_feedback_counts?.blocked || 0} blocked` : "没有待处理验收问题", scopedFeedback.length ? "running" : "")
  ];
  els.metricGrid.innerHTML = metrics.join("");
  els.metricGrid.classList.toggle("acceptance-only", state.acceptanceFeedbackOnly);
  renderAttention(state.acceptanceFeedbackOnly ? [] : scopedBlockedPending);
  renderCurrentRun(scopedBlockedPending);
  renderQueue(scopedQueue, scopedBlockedPending);
  renderAcceptanceFeedbackQueue(scopedFeedback);
  renderRecentCompletions();
  renderCommandInspector(scopedProjects);
}

function renderAcceptanceFeedbackQueue(items) {
  els.feedbackQueueSummary.textContent = `${items.length} 项`;
  if (!items.length) {
    els.feedbackQueueTable.innerHTML = `<div class="empty-state">当前范围没有待处理验收问题。</div>`;
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
  const recovery = state.snapshot.recovery_items[0];
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
  if (!activeExecutionMatchesSelectedProject(active)) {
    els.currentRunPanel.innerHTML = `<div class="run-empty"><div><strong>没有活动任务</strong><p>${state.snapshot.queue.some(scopedTaskFilter) ? "自动化将从下一队列领取一项任务。" : blockedPendingTasks.length ? "存在待处理任务，但项目尚未满足自动执行条件。" : "同步后继续监听待处理任务。"}</p></div></div>`;
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
    const options = [
      `<option value="">未绑定</option>`,
      ...snapshot.local_projects.map((local) => `<option value="${escapeHtml(local.id)}" ${local.id === project.local_project_id ? "selected" : ""}>${escapeHtml(local.name)}</option>`),
      `<option value="__add_local_project__">＋ 添加本地项目…</option>`
    ].join("");
    const qualification = !project.local_project_id ? "先绑定工作区" : project.participating ? project.source_status === "healthy" ? "已具备资格" : project.source_status : "尚未允许";
    return `<div class="binding-row" data-binding-project="${escapeHtml(project.id)}"><strong>${escapeHtml(project.name)}</strong><select aria-label="${escapeHtml(project.name)} 本地工作区">${options}</select><label class="participation-row"><input type="checkbox" ${project.participating ? "checked" : ""} ${project.local_project_id ? "" : "disabled"}>允许自动领取 · ${escapeHtml(qualification)}</label></div>`;
  }).join("") : `<div class="empty-state">同步后可绑定远端项目。</div>`;
  els.projectBindingList.querySelectorAll("[data-binding-project]").forEach((row) => {
    const remoteId = row.dataset.bindingProject;
    const select = row.querySelector("select");
    const checkbox = row.querySelector("input[type=checkbox]");
    select.addEventListener("change", () => runAction(async () => {
      let localProjectId = select.value;
      if (localProjectId === "__add_local_project__") {
        select.value = projects.find((project) => String(project.id) === remoteId)?.local_project_id || "";
        const localProject = await api.pickProject();
        if (!localProject) return;
        localProjectId = localProject.id;
      }
      await api.bindAutomationProject(remoteId, localProjectId);
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
  els.taskBrowserSummary.textContent = `${currentProject()?.name || "项目集全部"} · ${state.snapshot.tasks.filter(scopedTaskFilter).length} 项 · 选择只改变观察范围`;
  els.taskSnapshotTime.textContent = state.snapshot.synced_at ? `服务器快照 ${formatDateTime(state.snapshot.synced_at)}` : "尚未同步";
  els.taskFilterInput.value = state.taskFilter;
  renderTaskTable();
  renderTaskInspector();
}

function renderTaskTable() {
  const tasks = state.snapshot.tasks.filter(scopedTaskFilter).filter((task) => !state.taskFilter || `${task.title} ${task.content} ${task.project_name} ${task.id}`.toLowerCase().includes(state.taskFilter));
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
  const acceptanceFeedback = task.state === "completed" ? `<section class="acceptance-feedback-panel"><div class="section-title-row"><div><h3>验收问题与进展</h3><p>${feedbackItems.length} 项验收问题</p></div></div><div class="acceptance-feedback-list">${feedbackItems.length ? feedbackItems.map((item) => `<button class="acceptance-feedback-item" data-task-feedback="${escapeHtml(item.feedback_id)}" type="button"><span><strong>${escapeHtml(item.original_feedback)}</strong><small>${escapeHtml(item.feedback_id)} · ${escapeHtml(item.progress)}</small></span><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></button>`).join("") : `<div class="empty-state compact">尚未发现验收问题。</div>`}</div><label class="acceptance-feedback-composer"><span>提出验收问题</span><textarea id="acceptanceFeedbackInput" rows="3" placeholder="描述验收中发现的问题…"></textarea><small>待办保持已完成；问题进入 Automation 独立队列并复用同一 Agent 对话。</small><button id="submitAcceptanceFeedbackButton" class="primary-button" type="button">提出验收问题</button></label></section>` : task.state === "accepted" ? `<section class="acceptance-feedback-panel acceptance-clear"><div class="section-title-row"><div><h3>验收通过</h3><p>当前没有待处理的验收问题</p></div></div><div class="empty-state compact">该待办已验收，不再接受新的验收问题。</div></section>` : "";
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
  const acceptanceReview = Boolean(sourceTask && sourceTask.state === "completed");
  els.workbenchTitle.textContent = sourceTask?.title || completion?.title || active?.task_title || "执行对话审查";
  els.workbenchMode.className = `status-pill ${state.workbenchMode === "intervention" ? "pending" : acceptanceReview ? "completed" : "pending_review"}`;
  els.workbenchMode.textContent = state.workbenchMode === "intervention" ? "人工处理" : acceptanceReview ? "验收问题" : "只读审查";
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
    ["审查范围", acceptanceReview ? "历史执行只读 · 可提出验收问题" : completion ? "历史完成 Run · 只读" : state.workbenchMode === "intervention" ? "当前 Run · 人工处理" : "当前 Run · 只读"],
    ["验收问题", acceptanceReview ? `${sourceTask.acceptance_feedback_items?.length || 0} 项${feedbackItem ? ` · 当前 ${feedbackItem.feedback_id}` : ""}` : "不适用"],
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
  els.recoveryList.innerHTML = items.map((item) => `<article class="recovery-card"><div class="recovery-marker"></div><div class="recovery-body"><h2>${escapeHtml(RECOVERY_LABELS[item.type] || item.type)}</h2><p>${escapeHtml(item.message)}</p><div class="recovery-meta"><span>任务 ${escapeHtml(item.task_id)}</span><span>冻结范围 ${escapeHtml(item.freeze_scope)}</span><span>责任方 ${escapeHtml(item.responsibility === "operator" ? "Runtime 操作员" : item.responsibility)}</span></div>${item.actions.includes("feedback_continue") ? `<div class="recovery-feedback"><label for="feedback-${escapeHtml(item.id)}">补充给 Agent 的说明</label><textarea id="feedback-${escapeHtml(item.id)}" data-recovery-feedback="${escapeHtml(item.id)}" rows="3" placeholder="补充事实、纠正方向或说明希望 Agent 如何继续…"></textarea><small>说明会发送到当前任务的同一 Agent 对话，并在对话页面保留。</small></div>` : ""}<div class="recovery-actions">${item.actions.map((action) => `<button class="${action === "mark_blocked" ? "secondary-button" : "primary-button"}" data-recovery-id="${escapeHtml(item.id)}" data-recovery-action="${escapeHtml(action)}" type="button">${escapeHtml(RECOVERY_ACTION_LABELS[action] || action)}</button>`).join("")}</div></div></article>`).join("");
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

function openWorkState(taskState = "pending") {
  state.selectedState = TASK_STATES.includes(taskState) ? taskState : "pending";
  state.selectedPlatformTaskId = "";
  state.page = "work";
  render();
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
  els.authIdentity.textContent = authenticated ? currentWorkshopUserName() : expired ? "请重新登录 Workshop" : "登录后同步你的项目和待办";
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

async function openProductFeedback() {
  const result = await api.openProductFeedback("submit");
  if (result.status === "opened") return;
  if (result.status === "requires_auth") {
    await openSettings({ loginGate: true });
    setAuthFeedback("登录 Workshop 后即可使用 ArcOrbit 产品反馈。", true);
    return;
  }
  showToast("ArcOrbit 产品反馈暂不可用，请稍后重试。", true);
}

function currentProject() {
  return state.selectedProjectId === "all" ? null
    : state.platform.projects.find((project) => String(project.id) === state.selectedProjectId)
      || state.snapshot.projects.find((project) => String(project.id) === state.selectedProjectId)
      || null;
}

function automationProjectsInActiveWorkset() {
  const projectIds = new Set((state.platform.active_workset?.project_ids || []).map(String));
  return state.snapshot.projects.filter((project) => projectIds.has(String(project.id)));
}

function advanceProjectsInActiveWorkset() {
  const projectIds = new Set((state.platform.active_workset?.project_ids || []).map(String));
  return (state.platform.projects || []).filter((project) => projectIds.has(String(project.id)));
}

function platformItemMatchesSelectedProject(item) {
  return state.selectedProjectId === "all" || String(item.project_id || item.id || "") === state.selectedProjectId;
}

function currentWorkshopUserName() {
  const platformUser = state.platform.user || {};
  const auth = state.authentication || {};
  return platformUser.name || platformUser.username || auth.display_name || auth.masked_identity || auth.identity || "Workshop 账户";
}

function activeExecutionMatchesSelectedProject(active) {
  return Boolean(active);
}

function projectName(projectId) {
  return state.platform.projects.find((project) => String(project.id) === String(projectId))?.name
    || state.snapshot.projects.find((project) => String(project.id) === String(projectId))?.name
    || (projectId ? `Project ${projectId}` : "未知产品");
}

function rankTasks(tasks) {
  const stateRank = { blocked: 0, in_progress: 1, pending_review: 2, pending: 3, completed: 4, accepted: 5, cancelled: 6 };
  return [...tasks].sort((left, right) => (
    (stateRank[left.state] ?? 9) - (stateRank[right.state] ?? 9)
    || Number(right.priority || 0) - Number(left.priority || 0)
    || String(right.updated_at || right.created_at || "").localeCompare(String(left.updated_at || left.created_at || ""))
  ));
}

function platformTaskRow(task) {
  return `<div class="compact-row"><span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.project_name)} · ${escapeHtml(task.assignee?.username || task.assignee?.name || task.executor_id || "未分配")}</small></span><em class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</em></div>`;
}

function uniqueMembers(members = []) {
  const result = new Map();
  for (const member of members) {
    const key = `${member.user_id}:${member.role}:${member.duty}:${member.is_external}`;
    const current = result.get(key) || { ...member, project_names: [] };
    if (member.project_name && !current.project_names.includes(member.project_name)) current.project_names.push(member.project_name);
    current.is_me ||= Boolean(member.is_me);
    result.set(key, current);
  }
  return [...result.values()].sort((left, right) => Number(right.is_me) - Number(left.is_me) || left.username.localeCompare(right.username, "zh-CN"));
}

function selectedTask() {
  return state.snapshot.tasks.find((task) => String(task.id) === String(state.selectedTaskId)) || null;
}

function scopedTaskFilter(item) {
  const projectId = String(item.project_id || item.source_project_id || "");
  if (!projectId && item.freeze_scope === "global") return true;
  if (state.selectedProjectId !== "all") return projectId === state.selectedProjectId;
  const projectIds = new Set((state.platform.active_workset?.project_ids || []).map(String));
  return projectIds.has(projectId);
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
  if (task.state === "completed") return [{ id: "review", label: "审查结果" }, ...((task.acceptance_feedback_items || []).some((item) => !["resolved", "cancelled"].includes(item.status)) ? [] : [{ id: "accept", label: "标记已验收", primary: true }])];
  if (task.state === "accepted") return [{ id: "review", label: "查看验收结果", primary: true }];
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

function normalizeProductFeedbackStatus(value = {}) {
  const defaults = defaultProductFeedbackStatus();
  return {
    ...defaults,
    ...value,
    configured: Boolean(value.configured),
    notifications_enabled: Boolean(value.notifications_enabled),
    unread_count: Math.max(0, Math.trunc(Number(value.unread_count) || 0))
  };
}

function defaultProductFeedbackStatus() {
  return {
    integration_mode: "sdk-webview",
    sdk_auth_mode: "apiKey",
    notifications_enabled: true,
    credential_strategy: "bundled-static",
    configured: true,
    project_id: 107,
    unread_count: 0,
    updated_at: ""
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

function emptyPlatformSnapshot() {
  return {
    generated_at: "",
    source_status: "logged_out",
    user: null,
    worksets: [],
    active_workset: null,
    projects: [],
    organizations: [],
    organization_scopes: [],
    personal_projects: [],
    organization_members: [],
    project_members: [],
    product_workspaces: [],
    members: [],
    tasks: [],
    feedback_v1: [],
    tags: [],
    automation: {
      enabled: false,
      queue_paused: false,
      source_status: "logged_out",
      health: { state: "logged_out", label: "等待登录", tone: "neutral" },
          queue: [],
          active_execution: null,
          attention_items: [],
          recovery_items: []
    },
    capabilities: {
      organizations: "unavailable",
      organization_governance: "unavailable",
      project_members: "managed_with_permissions_except_direct_add",
      invitation_lifecycle: "create_once_no_list_or_revoke",
      project_tasks: "read_write",
      platform_management: "available_with_server_permissions",
      feedback_v1: "read_write",
      feedback_v2: "unavailable",
      direct_add_project_member: "unavailable",
      task_history: "unavailable"
    },
    errors: []
  };
}
