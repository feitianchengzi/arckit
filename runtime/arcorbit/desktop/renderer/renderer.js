import {
  isConversationSurfaceMessageVisible,
  mergeAutomationTranscript,
  statusGlyph,
  structuredResultPresentation,
  summarizeLoopStatus,
  summarizeToolActivity,
  transcriptMessageType
} from "../../src/desktop/transcript-presentation.mjs";
import { renderRestrictedMarkdown, resolveWorkTaskReference, workTaskReference, workTaskReferenceSelection } from "./restricted-markdown.mjs";
import { summarizeAutomationExecution } from "../../src/desktop/automation-execution-summary.mjs";
import { createConversationSurface } from "./conversation-surface.mjs";
import {
  buildTaskCommentContent,
  normalizeTaskAttachmentUrl,
  parseTaskAttachmentContent,
  taskAttachmentFileName,
  taskCommentTextToMarkdown
} from "../../src/work-task-attachment-content.mjs";
import {
  captureTaskAttachmentRequest,
  invalidateTaskAttachmentCaches,
  isTaskAttachmentRequestCurrent,
  taskAttachmentIdentityKey
} from "../../src/work-task-attachment-cache.mjs";
import { createChatStateCoordinator } from "./chat-state-coordinator.mjs";
import { CHAT_SESSION_PREVIEW_LIMIT, chatSessionVisibility, groupChatSessions } from "./chat-session-groups.mjs";
import { createWorkQueryState, normalizeWorkQuery, workQueryKey } from "./work-query-state.mjs";
import { completedAcceptanceSelectionAfterSuccess, nextCompletedAcceptanceTaskId } from "./work-task-selection.mjs";
import { taskDisplayTitle } from "../../src/task-display-title.mjs";
import { initializeWindowControls } from "./window-controls.mjs";
import { activityOwnerMatchesRun, applyRunActivityPatch, createSingleFlightActivitySync } from "./run-activity-sync.mjs";
import {
  createWorkInspectorWidthPersistence,
  effectiveWorkInspectorWidth,
  normalizeWorkInspectorWidth,
  workInspectorKeyboardWidth,
  workInspectorPointerWidth,
  WORK_INSPECTOR_DEFAULT_WIDTH
} from "../../src/desktop/work-inspector-preference.mjs";
import {
  canManageProject,
  deriveAutomationGuidance,
  deriveTaskExecutorAutomationHelp,
  deriveWorkEligibilityGuidance,
  isCurrentProjectUser
} from "../../src/desktop/today-guidance.mjs";
import { deriveTodayWorkspace } from "../../src/desktop/today-workspace.mjs";

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
const FEEDBACK_STATE_LABELS = {
  pending: "待处理",
  accepted: "已确认",
  in_progress: "开发中",
  completed: "已完成",
  converted: "已转待办",
  ignored: "已忽略"
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
  case_reconciliation_failed: "Case 对账失败",
  case_binding_missing: "需要确认任务对应的 Case"
};
const RECOVERY_ACTION_LABELS = {
  retry_sync: "重新同步",
  retry_start: "重试同一任务",
  retry_case_reuse: "复用已有 Case",
  retry_as_new_case: "作为新事项继续",
  retry_cli_handoff: "重试切换到 CLI",
  retry_complete: "重试完成写回",
  feedback_continue: "补充说明并继续",
  accept_server_state: "接受服务器事实",
  mark_blocked: "标记为已阻塞"
};

function displayTaskTitle(task, fallback = "") {
  if (!task || typeof task !== "object") return taskDisplayTitle(task, fallback);
  return taskDisplayTitle(task.content ?? task.display_title ?? task.title, fallback || task.id);
}

function wireSelectableRow(row, { selected = false } = {}) {
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-selected", String(selected));
  row.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    row.click();
  });
}

const state = {
  setup: null,
  setupBusy: false,
  setupActionError: "",
  setupCleanupPlanDigest: "",
  setupCleanupPaths: [],
  setupRecoveryAssessmentDigest: "",
  setupRecoveryPaths: [],
  setupReviewPlanDigest: "",
  setupReviewPlanChanged: false,
  codexAuthMethod: "",
  codexAuthFlow: "",
  codexInstallMethod: "",
  page: "today",
  selectedProjectId: "all",
  todaySelectedProjectId: "all",
  todayMode: "",
  todaySelectedItemId: "",
  todayProjectSearch: "",
  todayDrafts: {},
  todayResult: null,
  todaySubmittingItemId: "",
  todayActionError: "",
  todaySetupByProject: {},
  todaySetupOperationProjectId: "",
  todayPreferenceHydrated: false,
  todayPreferenceTimer: 0,
  todayLastPersistedPreference: "",
  selectedState: "pending",
  acceptanceFeedbackOnly: false,
  selectedTaskId: "",
  selectedPlatformTaskId: "",
  platformTaskSelectionIntentEpoch: 0,
  platformTaskSelectionContextEpoch: 0,
  selectedFeedbackId: "",
  snapshot: emptySnapshot(),
  platform: emptyPlatformSnapshot(),
  platformWorkFilter: "",
  platformWorkFilters: defaultWorkFilters(),
  workQuery: { key: "", projection: null, loading: false, error: "" },
  workQueryOffset: 0,
  platformTaskAttachments: {},
  pendingTaskCommentResources: {},
  workInspectorWidthPx: WORK_INSPECTOR_DEFAULT_WIDTH,
  platformTaskAttachmentPreviews: {},
  taskAttachmentCacheEpoch: 0,
  taskAttachmentIdentityEpoch: 0,
  feedbackFilter: "",
  feedbackState: "all",
  feedbackSort: "newest",
  feedbackLinkRecoveries: {},
  feedbackConversations: {},
  feedbackSnapshotEpoch: 0,
  feedbackConversationRequestSequence: 0,
  feedbackImagePreviews: {},
  feedbackImageInputs: {},
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
  workbenchMode: "review",
  workbenchRun: null,
  workbenchCompletion: null,
  workbenchTask: null,
  workbenchFeedbackId: "",
  interventionSubmitting: false,
  taskFilter: "",
  refreshing: false,
  manualSyncing: false
};

let platformActionResolver = null;
let platformActionSubmitter = null;
let platformActionBusy = false;
let platformActionDisabledControls = new Map();

const els = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map((element) => [element.id, element]));
let refreshQueued = false;
let automationRefreshQueued = false;
let chatRefreshTimer = null;
let chatRefreshPromise = null;
let chatRefreshRequested = false;
let chatRefreshQuiet = true;
let chatRefreshResetOwner = false;
let renderedChatProjectOptions = "";
let renderedChatSessionList = "";
let toastTimer;
let verificationTimer;
let workFilterTimer;
let platformWorkInspectorRender = { taskId: "", html: "" };
let workInspectorResizeSession = null;
let workInspectorResizeObserver = null;
const workInspectorWidthPersistence = createWorkInspectorWidthPersistence({
  initialWidth: state.workInspectorWidthPx,
  persistWidth: (width) => api.setWorkInspectorWidth(width),
  onVisibleWidth: (width) => {
    state.workInspectorWidthPx = width;
    applyWorkInspectorWidth();
  },
  onConfirmedWidth: (width) => {
    if (state.platform.ui_preferences) {
      state.platform.ui_preferences.work_inspector_width_px = width;
    }
  }
});
const activityRefreshQueue = createSingleFlightActivitySync({
  consume: (event) => refreshVisibleAutomationActivity(event),
  isEligible: (event) => activityEventOwnerIsVisible(event),
  shouldPause: () => state.refreshing,
  schedule: (callback, delay) => window.setTimeout(callback, delay),
  onError: (error) => showToast(error.message)
});
const taskAttachmentPreviewQueue = [];
let activeTaskAttachmentPreviews = 0;
const TASK_ATTACHMENT_PREVIEW_CONCURRENCY = 3;
const feedbackImagePreviewQueue = [];
let activeFeedbackImagePreviews = 0;
const FEEDBACK_IMAGE_PREVIEW_CONCURRENCY = 3;
const expandedChatProjectIds = new Set();
const workQueryState = createWorkQueryState({ cacheLimit: 12 });
const WORK_QUERY_WINDOW_SIZE = 80;
const chatStateCoordinator = createChatStateCoordinator({
  api,
  normalizeSnapshot: normalizeChatSnapshot,
  createRequestId: () => window.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  setTimer: window.setTimeout.bind(window),
  clearTimer: window.clearTimeout.bind(window)
});
const chatConversationSurface = createConversationSurface({
  element: els.chatTranscript,
  jumpButton: els.chatJumpLatestButton,
  formatTime,
  onApproval: (message, decision) => runAction(async () => {
    if (!chatState().owner.session_id) return;
    await chatStateCoordinator.decideApproval(message.approval_request_id, decision);
    renderChat();
  }),
  onExternalLink: (url) => runAction(() => api.openWorkExternalLink(url)),
  performAction: runAction,
});
const workbenchConversationSurface = createConversationSurface({
  element: els.transcriptList,
  jumpButton: els.jumpToLatestButton,
  formatTime,
  onExternalLink: (url) => runAction(() => api.openWorkExternalLink(url)),
  performAction: runAction,
});

initializeWindowControls({
  api,
  closeButton: els.windowCloseButton,
  minimizeButton: els.windowMinimizeButton,
  maximizeButton: els.windowMaximizeButton,
  dragRegion: els.titlebarDrag,
  onError: (error) => showToast(error.message || "窗口控制失败")
});

function chatState() {
  return chatStateCoordinator.getState();
}

boot();

async function boot() {
  wireEvents();
  const [setup, settings, authentication, productFeedback, chat] = await Promise.all([
    api.getSetupReadiness(), api.getSettings(), api.getAuthStatus(), api.getProductFeedbackStatus(), api.chatSnapshot({})
  ]);
  state.setup = setup;
  state.settings = normalizeSettings(settings);
  state.authentication = normalizeAuthentication(authentication);
  state.productFeedback = normalizeProductFeedbackStatus(productFeedback);
  await chatStateCoordinator.initialize(chat);
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
    if (state.todaySetupOperationProjectId) {
      state.todaySetupByProject[state.todaySetupOperationProjectId] = readiness;
      state.todayActionError = "";
      if (state.page === "today") renderToday();
      return;
    }
    state.setup = readiness;
    state.setupActionError = "";
    renderSetup();
  });
  api.onAutomationEvent(() => scheduleAutomationRefresh());
  api.onWorkSyncEvent(() => scheduleRefresh());
  api.onChatEvent((event) => {
    if (event?.type === "chat.draft.changed") return;
    if (event?.type === "chat.message.changed") {
      if (chatStateCoordinator.applyStreamEvent(event)) renderChat();
      return;
    }
    scheduleChatRefresh();
  });
  api.onEvent((event) => {
    if (["run.started", "run.finished", "message.added"].includes(event.type)) {
      state.transcriptSessionId = "";
    }
    if (event.type === "run.activity_changed") {
      scheduleActivityRefresh(event, 120);
      return;
    }
    if (["run.started", "run.finished", "run.command_result", "message.added"].includes(event.type)) {
      scheduleRefresh(0);
    }
  });
  window.setInterval(() => {
    const refresh = state.page === "work" ? refreshWorkQuery({ quiet: true }) : refreshSnapshot({ quiet: true });
    refresh.catch(() => {});
  }, 30_000);
  window.setInterval(() => {
    if (state.setup?.codex_setup?.operation?.started_at) renderCodexSetup();
  }, 1_000);
}

function wireEvents() {
  initializeWorkInspectorResize();
  els.setupRetryButton.addEventListener("click", () => runAction(async () => {
    state.setupActionError = "";
    state.setupBusy = true;
    renderSetup();
    try {
      await checkSetupReadinessForSelection();
    } finally {
      state.setupBusy = false;
      renderSetup();
    }
  }));
  els.codexInstallButton.addEventListener("click", () => runAction(async () => {
    const method = els.codexInstallMethod.value || state.codexInstallMethod || "standalone";
    await runConfirmedCodexSetupAction("install", (input) => api.installCodex(input), { method });
  }));
  els.codexUpdateButton.addEventListener("click", () => runAction(async () => {
    await runConfirmedCodexSetupAction("update", (input) => api.updateCodex(input));
  }));
  els.codexMigrateButton.addEventListener("click", () => runAction(async () => {
    await runConfirmedCodexSetupAction("migrate", (input) => api.migrateCodexToStandalone(input));
  }));
  els.codexCheckUpdatesButton.addEventListener("click", () => runAction(async () => {
    await runCodexSetupAction(() => api.checkCodexUpdates());
  }));
  els.codexInstallMethod.addEventListener("change", () => {
    state.codexInstallMethod = els.codexInstallMethod.value;
  });
  els.codexAuthMethods.addEventListener("change", (event) => {
    state.codexAuthMethod = String(event.target?.value || "");
    state.codexAuthFlow = "";
    for (const input of els.codexChatgptFlows.querySelectorAll('input[type="radio"]')) input.checked = false;
    els.codexSecretInput.value = "";
    renderCodexSetup();
  });
  els.codexChatgptFlows.addEventListener("change", (event) => {
    state.codexAuthFlow = String(event.target?.value || "");
    renderCodexSetup();
  });
  els.codexSecretInput.addEventListener("input", () => renderCodexSetup());
  els.codexLoginButton.addEventListener("click", () => runAction(async () => {
    const method = state.codexAuthMethod;
    const flow = state.codexAuthFlow;
    if (["api-key", "access-token"].includes(method)) {
      const secret = els.codexSecretInput.value;
      els.codexSecretInput.value = "";
      await runConfirmedCodexSetupAction("login", (input) => api.loginCodexWithSecret({ ...input, secret }), { method, flow: "" });
      return;
    }
    await runConfirmedCodexSetupAction("login", (input) => api.loginCodex(input), { method, flow });
  }));
  els.codexLogoutButton.addEventListener("click", () => runAction(async () => {
    await runConfirmedCodexSetupAction("logout", (input) => api.logoutCodex(input));
  }));
  els.codexCancelButton.addEventListener("click", () => runAction(async () => {
    const operation = state.setup?.codex_setup?.operation;
    if (operation?.cancellable !== true || !operation.id) return;
    state.setup = await api.cancelCodexSetup({ operation_id: operation.id });
    renderSetup();
  }));
  els.setupRecoveryGuideButton.addEventListener("click", () => runAction(async () => {
    await navigator.clipboard.writeText(setupRecoveryGuide(state.setup));
    window.alert("恢复说明已复制。请按其中的路径与条件处理后重新检查。");
  }));
  els.setupApplyButton.addEventListener("click", () => runAction(async () => {
    state.setupActionError = "";
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
    const action = upgrade?.can_backup_and_restore
      ? "backup-and-restore"
      : upgrade?.can_backup_and_overwrite_selected
        ? "backup-and-overwrite-selected"
        : upgrade?.can_backup_and_reinstall ? "backup-and-reinstall" : "";
    if (!action) return;
    const selectedPaths = action === "backup-and-overwrite-selected" ? [...state.setupRecoveryPaths] : [];
    if (action === "backup-and-overwrite-selected" && selectedPaths.length === 0) return;
    const selectedItems = (upgrade?.items || []).filter((item) => selectedPaths.includes(item.path));
    const confirmation = action === "backup-and-overwrite-selected"
      ? `将先完整备份以下 ${selectedItems.length} 个同名 skill，再使用当前 ArcOrbit 应用包中的内容覆盖：\n\n${selectedItems.map((item) => `${item.name}\n${item.path}\n当前 ${shortDigest(item.current_digest)} → 内置 ${shortDigest(item.incoming_digest)}`).join("\n\n")}\n\n备份位置：${upgrade.recovery_root}\n评估摘要：${upgrade.digest}\n\n未选择和无关内容不会改变。是否继续？`
      : action === "backup-and-reinstall"
        ? "将先完整备份当前冲突内容，再以当前 ArcOrbit 应用包中的内容为准重新安装，并建立新的受管理关系。是否继续？"
      : "将先把本地修改完整备份，再恢复受管理内容。恢复完成后如有新版迁移计划，仍需再次确认。";
    if (!window.confirm(confirmation)) return;
    state.setupActionError = "";
    state.setupBusy = true;
    renderSetup();
    try {
      state.setup = await api.recoverSetupUpgrade({ assessmentDigest: upgrade.digest, action, selectedPaths });
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
  els.setupExitButton.addEventListener("click", () => runAction(() => api.closeWindow()));
  els.setupReviewed.addEventListener("change", () => {
    if (els.setupReviewed.checked) state.setupReviewPlanChanged = false;
    renderSetupActions();
  });
  els.setupCleanupButton.addEventListener("click", () => {
    runAction(async () => {
      const selected = new Set(state.setupCleanupPaths);
      const paths = (state.setup?.plan?.cleanup || []).map((item) => item.path).filter((item) => selected.has(item));
      if (!paths.length) return;
      state.setupActionError = "";
      state.setupBusy = true;
      renderSetup();
      try {
        const removal = await api.planSetupRemoval(paths);
        if (!window.confirm(`将只移除以下 ${paths.length} 个 ArcForge 已证明的 managed-stale 路径：\n\n${paths.join("\n")}\n\n确认摘要：${removal.confirmationDigest}`)) return;
        state.setup = await api.removeManagedSetupPaths({ managedPaths: paths, confirmationDigest: removal.confirmationDigest });
        resetSetupCleanupSelection();
      } finally {
        state.setupBusy = false;
        renderSetup();
      }
    });
  });
  els.setupCleanupPanel.addEventListener("change", (event) => {
    if (event.target === els.setupCleanupSelectAll) {
      state.setupCleanupPaths = event.target.checked ? (state.setup?.plan?.cleanup || []).map((item) => item.path) : [];
      renderSetupCleanup();
      renderSetupActions();
      return;
    }
    const checkbox = event.target.closest("[data-setup-cleanup-path]");
    if (!checkbox) return;
    const item = state.setup?.plan?.cleanup?.[Number(checkbox.dataset.setupCleanupPath)];
    if (!item) return;
    const selected = new Set(state.setupCleanupPaths);
    if (checkbox.checked) selected.add(item.path);
    else selected.delete(item.path);
    state.setupCleanupPaths = [...selected];
    renderSetupCleanup();
    renderSetupActions();
  });
  els.setupConflictPanel.addEventListener("change", (event) => {
    const upgrade = state.setup?.source_upgrade;
    const eligible = (upgrade?.items || []).filter((item) => item.recovery_eligible);
    if (event.target.matches("[data-setup-recovery-all]")) {
      state.setupRecoveryPaths = event.target.checked ? eligible.map((item) => item.path) : [];
      renderSetup();
      return;
    }
    const checkbox = event.target.closest("[data-setup-recovery-path]");
    if (!checkbox) return;
    const item = upgrade?.items?.[Number(checkbox.dataset.setupRecoveryPath)];
    if (!item?.recovery_eligible) return;
    const selected = new Set(state.setupRecoveryPaths);
    if (checkbox.checked) selected.add(item.path);
    else selected.delete(item.path);
    state.setupRecoveryPaths = [...selected];
    renderSetup();
  });
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  els.newChatButton.addEventListener("click", () => runAction(async () => {
    const projectId = defaultChatDraftProject()?.id || "";
    await chatStateCoordinator.newDraft(projectId);
    renderChat();
    els.chatInput.focus();
  }));
  els.chatProjectSelect.addEventListener("change", () => runAction(async () => {
    const projectId = els.chatProjectSelect.value;
    await chatStateCoordinator.changeDraftWorkspace(projectId);
    renderChat();
  }));
  els.renameChatButton.addEventListener("click", () => runAction(async () => {
    const session = selectedChatSession();
    if (!session) return;
    const title = window.prompt("重命名对话", session.title);
    if (title === null || !title.trim()) return;
    await chatStateCoordinator.renameCurrentSession(title.trim());
    renderChat();
  }));
  els.deleteChatButton.addEventListener("click", () => runAction(async () => {
    const session = selectedChatSession();
    if (!session || !window.confirm(`删除“${session.title}”？活动回答会先安全停止。本操作只删除 ArcOrbit 本地会话与恢复记录。`)) return;
    await chatStateCoordinator.deleteCurrentSession();
    renderChat();
  }));
  els.chatInput.addEventListener("input", () => {
    chatStateCoordinator.setDraft(els.chatInput.value);
    renderChatComposer();
  });
  els.chatInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    runAction(sendChat);
  });
  els.chatSendButton.addEventListener("click", () => runAction(sendChat));
  els.chatStopButton.addEventListener("click", () => runAction(async () => {
    const session = selectedChatSession();
    if (!session) return;
    await chatStateCoordinator.interruptCurrentSession();
    renderChat();
  }));
  els.syncButton.addEventListener("click", () => runAction(syncAutomationNow));
  els.automationRefreshButton.addEventListener("click", () => runAction(syncAutomationNow));
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
  els.recoveryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-recovery-action]");
    if (!button || !els.recoveryList.contains(button)) return;
    runAction(() => resolveRecoveryAction(button));
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
  els.taskFilterInput.addEventListener("input", () => {
    state.taskFilter = els.taskFilterInput.value.trim().toLowerCase();
    renderTaskTable();
  });
  els.platformWorkFilter.addEventListener("input", () => {
    state.platformWorkFilter = els.platformWorkFilter.value.trim().toLowerCase();
    scheduleWorkFilterRefresh();
  });
  els.workStateSelect.addEventListener("change", () => openWorkState(els.workStateSelect.value));
  els.platformWorkTable.addEventListener("click", (event) => {
    const row = event.target.closest("[data-platform-task-select]");
    if (row && els.platformWorkTable.contains(row)) {
      setPlatformTaskSelectionIntent(row.dataset.platformTaskSelect);
      els.platformWorkTable.querySelectorAll("[data-platform-task-select]").forEach((item) => {
        const selected = item === row;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      renderPlatformWorkInspector(findPlatformTask(state.selectedPlatformTaskId));
      return;
    }
    const pageButton = event.target.closest("[data-work-query-offset]");
    if (!pageButton || !els.platformWorkTable.contains(pageButton)) return;
    state.workQueryOffset = Math.max(0, Number(pageButton.dataset.workQueryOffset) || 0);
    setPlatformTaskSelectionIntent("");
    refreshWorkQuery().catch((error) => showToast(error.message));
  });
  [els.workCreatorFilter, els.workExecutorFilter, els.workTagFilter, els.workPriorityFilter, els.workStartDateFilter, els.workEndDateFilter].forEach((element) => element.addEventListener("change", () => {
    readWorkFiltersFromControls();
    renderWorkFilterSummaries();
    scheduleWorkFilterRefresh(0);
  }));
  document.querySelectorAll("[data-work-filter-menu]").forEach((menu) => menu.addEventListener("toggle", () => {
    if (!menu.open) return;
    document.querySelectorAll("[data-work-filter-menu]").forEach((other) => { if (other !== menu) other.open = false; });
    positionWorkFilterPopover(menu);
  }));
  window.addEventListener("resize", () => {
    document.querySelectorAll("[data-work-filter-menu][open]").forEach(positionWorkFilterPopover);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-work-filter-menu]")) return;
    document.querySelectorAll("[data-work-filter-menu][open]").forEach((menu) => { menu.open = false; });
  });
  els.resetWorkFiltersButton.addEventListener("click", () => {
    state.platformWorkFilter = "";
    state.platformWorkFilters = defaultWorkFilters();
    scheduleWorkFilterRefresh(0);
  });
  els.worksetSelect.addEventListener("change", () => runAction(async () => {
    markPlatformTaskSelectionIntent();
    state.selectedProjectId = "all";
    workQueryState.clear();
    state.workQuery = { key: "", projection: null, loading: false, error: "" };
    await api.setActiveWorkset(els.worksetSelect.value);
    await refreshSnapshot();
  }));
  els.productScopeSelect.addEventListener("change", () => runAction(async () => {
    state.selectedProjectId = els.productScopeSelect.value;
    state.selectedTaskId = "";
    setPlatformTaskSelectionIntent("");
    state.selectedFeedbackId = "";
    state.workQueryOffset = 0;
    if (state.page === "work") await refreshWorkQuery();
    else await refreshSnapshot();
  }));
  els.editWorksetButton.addEventListener("click", () => runAction(editCurrentWorkset));
  els.createOrganizationButton.addEventListener("click", () => runAction(createOrganization));
  els.joinByCodeButton.addEventListener("click", () => runAction(joinByInvitationCode));
  els.organizationTabs.querySelectorAll("[data-organization-section]").forEach((button) => button.addEventListener("click", () => {
    state.organizationSection = button.dataset.organizationSection;
    renderOrganization();
  }));
  els.createTaskButton.addEventListener("click", () => runAction(createTask));
  els.createTagButton.addEventListener("click", () => runAction(createTag));
  els.openTaskReferenceButton.addEventListener("click", () => runAction(openWorkTaskReference));
  els.feedbackSearchInput.addEventListener("input", () => {
    state.feedbackFilter = els.feedbackSearchInput.value.trim().toLowerCase();
    renderPlatformFeedback();
  });
  els.feedbackStateFilter.addEventListener("change", () => {
    state.feedbackState = els.feedbackStateFilter.value;
    renderPlatformFeedback();
  });
  els.feedbackSortSelect.addEventListener("change", () => {
    state.feedbackSort = els.feedbackSortSelect.value;
    renderPlatformFeedback();
  });
  els.feedbackRefreshButton.addEventListener("click", () => runAction(refreshFeedbackWorkspace));
  els.closePlatformActionButton.addEventListener("click", () => closePlatformAction(null));
  els.cancelPlatformActionButton.addEventListener("click", () => closePlatformAction(null));
  els.platformActionOverlay.addEventListener("click", (event) => {
    if (event.target === els.platformActionOverlay) closePlatformAction(null);
  });
  els.platformActionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (platformActionSubmitter) {
      submitManagedPlatformAction();
      return;
    }
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
        await api.submitIntervention({ execution_id: state.snapshot.selected_execution_id, taskId: active.task_id, message: els.interventionInput.value });
      }
      els.interventionInput.value = "";
      await refreshSnapshot();
      if (!acceptanceReview) showPage("command");
    } finally {
      state.interventionSubmitting = false;
      if (state.page === "workbench") renderWorkbench();
    }
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePlatformAction(null);
      closeSettings();
      if (["tasks", "workbench", "recovery"].includes(state.page)) showPage("command");
    }
  });
}

function initializeWorkInspectorResize() {
  const separator = els.workInspectorSeparator;
  const layout = els.platformWorkLayout;
  if (!separator || !layout) return;
  const finishPointerResize = (event, persist) => {
    const session = workInspectorResizeSession;
    if (!session || event.pointerId !== session.pointerId) return;
    workInspectorResizeSession = null;
    separator.classList.remove("is-resizing");
    document.body.classList.remove("is-resizing-work-inspector");
    if (separator.hasPointerCapture?.(event.pointerId)) separator.releasePointerCapture(event.pointerId);
    if (persist) runAction(() => persistWorkInspectorWidth(session.previewWidth));
    else applyWorkInspectorWidth();
  };
  separator.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    workInspectorResizeSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: state.workInspectorWidthPx,
      previewWidth: state.workInspectorWidthPx
    };
    separator.setPointerCapture?.(event.pointerId);
    separator.classList.add("is-resizing");
    document.body.classList.add("is-resizing-work-inspector");
  });
  separator.addEventListener("pointermove", (event) => {
    const session = workInspectorResizeSession;
    if (!session || event.pointerId !== session.pointerId) return;
    session.previewWidth = workInspectorPointerWidth(session.startWidth, session.startX, event.clientX);
    applyWorkInspectorWidth(session.previewWidth);
  });
  separator.addEventListener("pointerup", (event) => finishPointerResize(event, true));
  separator.addEventListener("pointercancel", (event) => finishPointerResize(event, false));
  separator.addEventListener("keydown", (event) => {
    const width = workInspectorKeyboardWidth(state.workInspectorWidthPx, event.key, event.shiftKey);
    if (width === null) return;
    event.preventDefault();
    runAction(() => persistWorkInspectorWidth(width));
  });
  separator.addEventListener("dblclick", (event) => {
    event.preventDefault();
    runAction(() => persistWorkInspectorWidth(WORK_INSPECTOR_DEFAULT_WIDTH));
  });
  if (typeof ResizeObserver === "function") {
    workInspectorResizeObserver = new ResizeObserver(() => applyWorkInspectorWidth());
    workInspectorResizeObserver.observe(layout);
  } else {
    window.addEventListener("resize", () => applyWorkInspectorWidth());
  }
  applyWorkInspectorWidth();
}

function syncWorkInspectorWidth(platform) {
  workInspectorWidthPersistence.synchronize(platform?.ui_preferences?.work_inspector_width_px);
}

function applyWorkInspectorWidth(requestedWidth = state.workInspectorWidthPx) {
  const layout = els.platformWorkLayout;
  const separator = els.workInspectorSeparator;
  if (!layout || !separator) return;
  const savedWidth = normalizeWorkInspectorWidth(requestedWidth);
  const effectiveWidth = effectiveWorkInspectorWidth(savedWidth, layout.clientWidth);
  layout.style.setProperty("--work-inspector-width", `${effectiveWidth}px`);
  layout.classList.toggle("is-inspector-narrow", effectiveWidth < 400);
  separator.setAttribute("aria-valuenow", String(savedWidth));
  separator.setAttribute("aria-valuetext", effectiveWidth === savedWidth
    ? `${savedWidth} 像素`
    : `保存 ${savedWidth} 像素，当前窗口有效 ${effectiveWidth} 像素`);
}

function persistWorkInspectorWidth(width) {
  return workInspectorWidthPersistence.persist(width);
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
    "codex-action-required": ["需要恢复 Codex 环境", "完成安装或显式登录后会自动重新验证，无需重启 ArcOrbit。"],
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
  renderCodexSetup();
  els.setupDistribution.innerHTML = setup.distribution ? [
    ["Runtime", setup.distribution.runtime_version], ["Release intent", setup.distribution.release_tag],
    ["ArcForge provider", setup.distribution.provider_version], ["Payload", shortDigest(setup.distribution.payload_digest)]
  ].map(([label, value]) => `<div class="fact-row"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("") : `<p class="muted-copy">尚未读取 distribution lock。</p>`;
  const counts = setup.drift?.counts;
  els.setupCounts.innerHTML = counts ? `<div><strong>${Number(counts.missing || 0)}</strong><span>将新增</span></div><div><strong>${Number(counts.same || 0)}</strong><span>已一致</span></div><div><strong>${Number(counts.changed || 0)}</strong><span>changed</span></div><div><strong>${Number(counts.managed_stale || 0)}</strong><span>stale</span></div><div><strong>${Number(counts.uncertain || 0)}</strong><span>uncertain</span></div>` : "";
  renderSetupCleanup();
  renderSetupPlan();
  const setupError = setup.error || (state.setupActionError ? { code: "SETUP_ACTION_FAILED", stage: "setup-action", message: state.setupActionError } : null);
  els.setupErrorPanel.classList.toggle("hidden", !setupError);
  const writeSummary = setup.write_state === "not_started" ? "写入：未开始" : setup.write_state === "committed" ? "写入：已完成" : setup.write_state === "rolled_back" ? "写入：已回滚" : setup.write_state === "rollback_incomplete" ? "写入：回滚需人工检查" : "写入：进行中";
  els.setupErrorPanel.innerHTML = setupError ? `<strong>${escapeHtml(setupError.code)}</strong><p>${escapeHtml(setupError.message)}</p>${renderCodexOwnerBlockers(setupError)}<small>阶段：${escapeHtml(setupError.stage)} · ${writeSummary}</small>` : "";
  const upgradeItems = setup.source_upgrade?.items || [];
  syncSetupRecoverySelection(setup.source_upgrade);
  const conflicts = setup.drift?.conflicts || [];
  const selectableRecovery = Boolean(setup.source_upgrade?.can_backup_and_overwrite_selected && !setup.source_upgrade?.can_backup_and_restore);
  const selectedRecovery = new Set(state.setupRecoveryPaths);
  const eligibleRecovery = upgradeItems.filter((item) => item.recovery_eligible);
  const recoverySelectAll = selectableRecovery && eligibleRecovery.length
    ? `<label class="setup-cleanup-row"><input data-setup-recovery-all type="checkbox" ${selectedRecovery.size === eligibleRecovery.length ? "checked" : ""} ${state.setupBusy ? "disabled" : ""}><span><strong>全选可恢复项</strong><small>${selectedRecovery.size} / ${eligibleRecovery.length}；只选择 provider fresh assessment 证明安全的目标</small></span></label>`
    : "";
  els.setupConflictPanel.classList.toggle("hidden", upgradeItems.length === 0 && conflicts.length === 0 && !setup.recovery_backup);
  els.setupConflictPanel.innerHTML = upgradeItems.length
    ? `<h2>冲突与恢复分类</h2>${recoverySelectAll}${upgradeItems.map((item, index) => `<label class="setup-path-row">${selectableRecovery && item.recovery_eligible ? `<input data-setup-recovery-path="${index}" type="checkbox" ${selectedRecovery.has(item.path) ? "checked" : ""} ${state.setupBusy ? "disabled" : ""}>` : ""}<strong>${escapeHtml(item.diagnostic_code || upgradeDispositionLabel(item.disposition))} · ${escapeHtml(item.name)}</strong><code>${escapeHtml(item.path)}</code>${item.current_digest || item.incoming_digest ? `<small>当前 ${escapeHtml(shortDigest(item.current_digest))} · 内置 ${escapeHtml(shortDigest(item.incoming_digest))}</small>` : ""}<small>${escapeHtml(item.reason)}</small>${item.recovery_blocked_reason ? `<small>${escapeHtml(item.recovery_blocked_reason)}</small>` : ""}${item.files?.length ? `<ul>${item.files.map((file) => `<li><code>${escapeHtml(file.status)} · ${escapeHtml(file.path)}</code></li>`).join("")}</ul>` : ""}</label>`).join("")}`
    : conflicts.length
      ? `<h2>不会自动覆盖</h2>${conflicts.map((item) => `<div class="setup-path-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}`
      : setup.recovery_backup
        ? `<h2>本地修改已备份</h2><div class="setup-path-row"><code>${escapeHtml(setup.recovery_backup.path)}</code></div>`
        : "";
  renderSetupActions();
}

function renderCodexOwnerBlockers(error) {
  const owners = Array.isArray(error?.owners) ? error.owners : [];
  if (error?.code !== "CODEX_UPDATE_ACTIVE_TASKS" || owners.length === 0) return "";
  return `<ul class="codex-owner-blockers">${owners.map((owner) => {
    const kind = owner?.kind === "automation" ? "Automation" : owner?.kind === "chat" ? "Chat" : "Codex";
    return `<li><strong>${kind}</strong><code>${escapeHtml(owner?.id || "")}</code></li>`;
  }).join("")}</ul>`;
}

function codexOperationFeedback(operation) {
  const phaseLabels = {
    starting: "正在启动",
    downloading: "正在下载安装程序",
    executing: "正在执行",
    discovering: "正在重新发现 executable",
    "awaiting-device-auth": "正在等待设备验证",
    "rechecking-executable": "正在重新发现 executable",
    "rechecking-version": "正在复核 version",
    "rechecking-login-status": "正在复核 login status",
    "rechecking-readiness": "正在复核其它 readiness"
  };
  const startedAt = Date.parse(String(operation?.started_at || ""));
  const elapsedSeconds = Number.isFinite(startedAt) ? Math.max(0, Math.floor((Date.now() - startedAt) / 1_000)) : null;
  const elapsed = elapsedSeconds === null ? "" : ` · 已等待 ${elapsedSeconds} 秒`;
  return `${operation?.kind || "setup"} · ${phaseLabels[operation?.phase] || operation?.phase || "进行中"}${elapsed}`;
}

function renderCodexSetup() {
  const codex = state.setup?.codex_setup || {};
  const installation = codex.installation || {};
  const installations = Array.isArray(codex.installations) ? codex.installations : [];
  const update = codex.update || {};
  const installAdvice = Array.isArray(codex.install_advice) ? codex.install_advice : [];
  const authentication = codex.authentication || {};
  const capabilities = authentication.capabilities || {};
  const operating = Boolean(codex.operation) || state.setupBusy;
  const status = String(codex.status || "checking");
  els.codexSetupStatus.textContent = status.toUpperCase();
  els.codexSetupStatus.className = `health-badge ${status === "ready" ? "success" : codex.error ? "danger" : "warning"}`;
  els.codexSetupFacts.innerHTML = [
    ["Executable", installation.command || "未发现"],
    ["State", installation.state || "等待检测"],
    ["Owner", `${installation.owner || installation.provenance || "none"} · ${installation.owner_confidence || "unknown"}`],
    ["Version", installation.version || installation.version_summary || "等待检测"],
    ["Update", update.state || "unknown"],
    ["Latest", update.latest_version || "尚未确认"],
    ["Authentication", authentication.authenticated ? "已认证" : authentication.state || "等待检测"]
  ].map(([label, value]) => `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");

  els.codexInventory.innerHTML = installations.length > 1
    ? installations.map((item) => `<div class="codex-inventory-item"><strong>${item.active ? "当前 · " : ""}${escapeHtml(item.owner || item.provenance || "unknown")}</strong><span>${escapeHtml(item.version || item.state || "unknown")}</span><small>${escapeHtml(item.command || "")}${item.selection_reason ? ` · ${escapeHtml(item.selection_reason)}` : ""}</small></div>`).join("")
    : "";

  const installChoices = installAdvice.filter((item) => item.suitability !== "blocked");
  const selectedInstallMethod = installChoices.some((item) => item.method === state.codexInstallMethod)
    ? state.codexInstallMethod
    : installChoices.find((item) => item.suitability === "recommended")?.method || installChoices[0]?.method || "";
  state.codexInstallMethod = selectedInstallMethod;
  els.codexInstallMethod.innerHTML = installChoices.map((item) => `<option value="${escapeHtml(item.method)}"${item.method === selectedInstallMethod ? " selected" : ""}>${escapeHtml(item.method)} · ${escapeHtml(item.suitability)}</option>`).join("");
  els.codexInstallMethodRegion.classList.toggle("hidden", !installation.can_install || installChoices.length < 2);

  els.codexInstallButton.classList.toggle("hidden", !installation.can_install);
  els.codexUpdateButton.classList.toggle("hidden", !installation.can_update);
  els.codexCheckUpdatesButton.classList.toggle("hidden", !installation.available || installation.owner_confidence !== "proven" || !["standalone", "npm", "homebrew"].includes(installation.owner));
  els.codexMigrateButton.classList.toggle("hidden", !installation.can_migrate);
  els.codexMigrateButton.textContent = installation.owner === "standalone" ? "确认 standalone 管理" : "迁移到 standalone";
  const ownerBlocked = codex.error?.code === "CODEX_UPDATE_ACTIVE_TASKS";
  for (const button of [els.codexInstallButton, els.codexUpdateButton, els.codexCheckUpdatesButton, els.codexMigrateButton]) button.disabled = operating || ownerBlocked;
  els.codexInstallMethod.disabled = operating;

  const needsAuthentication = Boolean(installation.available && !authentication.authenticated);
  els.codexAuthPanel.classList.toggle("hidden", !needsAuthentication);
  els.codexAccessTokenOption.classList.toggle("hidden", !capabilities.access_token);
  els.codexDeviceFlowOption.classList.toggle("hidden", !capabilities.device_auth);
  if (!capabilities.access_token && state.codexAuthMethod === "access-token") clearCodexAuthSelection();
  if (!capabilities.device_auth && state.codexAuthFlow === "device") state.codexAuthFlow = "";
  const chatgpt = state.codexAuthMethod === "chatgpt";
  const secretMethod = ["api-key", "access-token"].includes(state.codexAuthMethod);
  els.codexChatgptFlows.classList.toggle("hidden", !chatgpt);
  els.codexSecretRegion.classList.toggle("hidden", !secretMethod);
  els.codexSecretLabel.textContent = state.codexAuthMethod === "access-token" ? "Enterprise Access Token" : "API Key";
  const choiceComplete = Boolean(state.codexAuthMethod)
    && (!chatgpt || Boolean(state.codexAuthFlow))
    && (!secretMethod || Boolean(els.codexSecretInput.value));
  els.codexLoginButton.disabled = operating || !choiceComplete;
  for (const input of els.codexAuthPanel.querySelectorAll("input")) input.disabled = operating;
  els.codexLogoutButton.classList.toggle("hidden", !authentication.authenticated);
  els.codexLogoutButton.disabled = operating;
  const cancellableOperation = codex.operation?.cancellable === true && Boolean(codex.operation?.id);
  els.codexCancelButton.classList.toggle("hidden", !cancellableOperation);
  els.codexCancelButton.disabled = !cancellableOperation;
  const deviceAuth = codex.operation?.device_auth || null;
  const deviceAuthFeedback = deviceAuth
    ? [
        deviceAuth.verification_url ? `请在浏览器打开 ${deviceAuth.verification_url}` : "请按 Codex 官方设备码流程打开验证页面",
        deviceAuth.user_code ? `并输入一次性代码 ${deviceAuth.user_code}` : "正在等待一次性代码"
      ].join("，")
    : "";
  const idleFeedback = update.state === "check-failed"
    ? update.error?.message || "更新检查失败；当前健康 Codex 仍可继续使用。"
    : authentication.authenticated
      ? "Codex 与 Workshop 认证保持独立；当前 Codex 状态已由 login status 复核。"
      : installation.available
        ? "请选择认证方式；所有选项默认未选。"
        : installAdvice.find((item) => item.method === selectedInstallMethod)?.reason || "安装与更新只调用 main process 固定 owner adapter。";
  els.codexSetupFeedback.textContent = codex.error?.message || (codex.operation
    ? [deviceAuthFeedback, codexOperationFeedback(codex.operation)].filter(Boolean).join("；")
    : idleFeedback);
}

function clearCodexAuthSelection() {
  state.codexAuthMethod = "";
  state.codexAuthFlow = "";
  els.codexSecretInput.value = "";
  for (const input of els.codexAuthPanel.querySelectorAll('input[type="radio"]')) input.checked = false;
}

async function runCodexSetupAction(action) {
  state.setupActionError = "";
  state.setupBusy = true;
  renderSetup();
  try {
    state.setup = await action();
    if (state.setup?.codex_setup?.status === "ready") clearCodexAuthSelection();
  } finally {
    state.setupBusy = false;
    renderSetup();
  }
}

async function runConfirmedCodexSetupAction(action, operation, intent = {}) {
  const confirmation = await api.confirmCodexSetup({ action, ...intent });
  if (!confirmation?.confirmed || !confirmation.confirmation_id) return;
  await runCodexSetupAction(() => operation({ ...intent, confirmation_id: confirmation.confirmation_id }));
}

function renderSetupPlan() {
  const plan = state.setup?.plan;
  syncSetupCleanupSelection(plan);
  syncSetupReview(plan);
  els.setupPlanSummary.classList.toggle("hidden", !plan);
  els.setupPlanDetails.classList.toggle("hidden", !plan);
  els.setupReviewRegion.classList.toggle("hidden", !state.setup?.can_apply || !plan);
  if (!plan) {
    els.setupPlanSummaryBody.innerHTML = "";
    els.setupPlan.innerHTML = "";
    return;
  }
  const groups = Object.groupBy ? Object.groupBy(plan.items, (item) => item.mode || "unclassified") : plan.items.reduce((result, item) => ((result[item.mode || "unclassified"] ||= []).push(item), result), {});
  const availability = plan.availability;
  const counts = state.setup?.drift?.counts || {};
  const projectRootItems = plan.project_roots?.length
    ? plan.project_roots.map((projectRoot) => `<code>${escapeHtml(projectRoot)}</code>`).join("")
    : `<span>尚未绑定可写 Product Workspace 项目</span>`;
  const userBoundary = plan.scope === "project"
    ? plan.cleanup_included_in_upgrade
      ? `不会安装新的用户级 skill；仅按当前 plan 迁移或收束 ${Number(plan.cleanup?.length || 0)} 个旧 managed target`
      : "无；只写入绑定的 Product Workspace 项目，不安装到 Codex 用户级 skill 目录"
    : "以当前 plan 显示的目标为准";
  const changeSummary = `新增 ${Number(counts.missing || 0)} · 已一致 ${Number(counts.same || 0)} · changed ${Number(counts.changed || 0)} · managed-stale ${Number(counts.managed_stale || 0)} · uncertain ${Number(counts.uncertain || 0)}`;
  els.setupPlanSummaryBody.innerHTML = `<div class="setup-plan-summary-row"><strong>项目绝对目标</strong><span class="setup-plan-summary-targets">${projectRootItems}</span></div><div class="setup-plan-summary-row"><strong>Codex 用户级写入</strong><span>${escapeHtml(userBoundary)}</span></div><div class="setup-plan-summary-row"><strong>变更分类</strong><span>${escapeHtml(changeSummary)}</span></div>`;
  const availabilityHtml = availability ? `<p class="setup-digest">Arckit skills <strong>${availability.arckit_total}</strong> · user-ambient ${availability.user_ambient} · user-on-demand ${availability.user_on_demand} · project-ambient 延后 ${availability.project_ambient_deferred} · shared assets ${availability.shared_assets} · ArcForge loader ${availability.arcforge_loader_targets}</p>` : "";
  const projectRoots = plan.project_roots?.length ? `<section class="setup-plan-group"><h3>Product Workspace projects · ${plan.project_roots.length}</h3>${plan.project_roots.map((projectRoot) => `<div class="setup-skill-row"><strong>项目目标</strong><code>${escapeHtml(projectRoot)}</code></div>`).join("")}</section>` : "";
  const groupHtml = Object.entries(groups).map(([mode, items]) => `<section class="setup-plan-group"><h3>${escapeHtml(mode)} · ${items.length}</h3>${items.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong>${item.destinations.map((destination) => `<code>${escapeHtml(destination.path)}</code>`).join("")}</div>`).join("")}</section>`).join("");
  const sharedAssets = plan.shared_assets?.length ? `<section class="setup-plan-group"><h3>shared assets · ${plan.shared_assets.length}</h3>${plan.shared_assets.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.name)}</strong>${item.destinations.map((destination) => `<code>${escapeHtml(destination.path)}</code>`).join("")}</div>`).join("")}</section>` : "";
  const loaderTargets = plan.loader_targets?.length ? `<section class="setup-plan-group"><h3>on-demand loader · ${plan.loader_targets.length}</h3>${plan.loader_targets.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.agent)} · ${escapeHtml(item.status)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("")}</section>` : "";
  const cleanupItems = plan.cleanup?.map((item) => `<div class="setup-skill-row"><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code></div>`).join("") || "";
  const cleanup = plan.cleanup?.length ? `<section class="setup-plan-group warning"><h3>managed-stale · ${plan.cleanup.length}</h3>${cleanupItems}<p>${plan.cleanup_included_in_upgrade ? "这些 relationship-proven 旧目标已包含在本次迁移确认中。" : "清理选择与确认位于页面主区；这里仅保留计划依据。"}</p></section>` : "";
  const deferred = plan.deferred_project_skills?.length ? `<section class="setup-plan-group"><h3>project-ambient · 延后</h3><p>${plan.deferred_project_skills.map(escapeHtml).join("、")}</p></section>` : "";
  els.setupPlan.innerHTML = `${availabilityHtml}<p class="setup-digest">Plan digest <code>${escapeHtml(plan.digest)}</code></p>${projectRoots}${groupHtml}${sharedAssets}${loaderTargets}${cleanup}${deferred}`;
}

function renderSetupCleanup() {
  const plan = state.setup?.plan;
  syncSetupCleanupSelection(plan);
  const cleanup = plan?.cleanup || [];
  const visible = state.setup?.status === "drifted" && cleanup.length > 0 && !plan.cleanup_included_in_upgrade;
  els.setupCleanupPanel.classList.toggle("hidden", !visible);
  if (!visible) {
    els.setupCleanupList.innerHTML = "";
    els.setupCleanupCount.textContent = "0 / 0";
    els.setupCleanupSelectAll.checked = false;
    els.setupCleanupSelectAll.indeterminate = false;
    return;
  }
  const allowed = new Set(cleanup.map((item) => item.path));
  state.setupCleanupPaths = state.setupCleanupPaths.filter((item) => allowed.has(item));
  const selected = new Set(state.setupCleanupPaths);
  els.setupCleanupList.innerHTML = cleanup.map((item, index) => `<label class="setup-cleanup-row"><input data-setup-cleanup-path="${index}" type="checkbox" ${selected.has(item.path) ? "checked" : ""} ${state.setupBusy ? "disabled" : ""}><span><strong>${escapeHtml(item.skill)}</strong><code>${escapeHtml(item.path)}</code><small>${escapeHtml(item.reason || "relationship-proven managed-stale")}</small></span></label>`).join("");
  els.setupCleanupCount.textContent = `${selected.size} / ${cleanup.length}`;
  els.setupCleanupSelectAll.checked = selected.size === cleanup.length;
  els.setupCleanupSelectAll.indeterminate = selected.size > 0 && selected.size < cleanup.length;
  els.setupCleanupSelectAll.disabled = state.setupBusy;
}

function renderSetupActions() {
  const setup = state.setup || {};
  const applying = state.setupBusy || ["checking", "applying"].includes(setup.status);
  els.setupRetryButton.disabled = applying;
  els.setupRetryButton.classList.toggle("hidden", setup.status === "ready");
  els.setupApplyButton.classList.toggle("hidden", !setup.can_apply);
  els.setupApplyButton.textContent = setup.source_upgrade?.can_proceed ? "修复缺失并迁移" : "安装并继续";
  els.setupApplyButton.disabled = applying || !els.setupReviewed.checked;
  els.setupReviewed.disabled = applying;
  const reviewed = els.setupReviewed.checked;
  els.setupReviewHint.textContent = state.setupReviewPlanChanged
    ? "安装计划已更新，请重新确认上方写入目标与变更摘要。"
    : reviewed
      ? "已确认当前写入边界；可以安装并继续。"
      : "请先确认上方写入目标与变更摘要；无需展开完整安装明细。";
  els.setupReviewHint.classList.toggle("is-confirmed", reviewed);
  els.setupRecoverButton.classList.toggle("hidden", !setup.can_recover);
  els.setupRecoverButton.textContent = setup.source_upgrade?.can_backup_and_restore
    ? "备份修改并恢复"
    : setup.source_upgrade?.can_backup_and_overwrite_selected
      ? `备份并使用当前应用包覆盖所选同名 skill（${state.setupRecoveryPaths.length}）`
      : "备份并按当前应用包重装";
  els.setupRecoverButton.disabled = applying || Boolean(setup.source_upgrade?.can_backup_and_overwrite_selected && !setup.source_upgrade?.can_backup_and_restore && state.setupRecoveryPaths.length === 0);
  const cleanupAvailable = setup.status === "drifted" && setup.plan?.cleanup?.length > 0 && !setup.plan.cleanup_included_in_upgrade;
  els.setupCleanupButton.classList.toggle("hidden", !cleanupAvailable);
  els.setupCleanupButton.textContent = `确认并清理所选（${state.setupCleanupPaths.length}）`;
  els.setupCleanupButton.disabled = applying || state.setupCleanupPaths.length === 0;
  els.setupRecoveryGuideButton.classList.toggle("hidden", !(["conflict", "blocked"].includes(setup.status) && !setup.can_recover));
  els.setupRecoveryGuideButton.disabled = applying;
  els.setupContinueButton.classList.toggle("hidden", setup.status !== "ready");
  els.setupContinueButton.disabled = applying;
  els.setupExitButton.textContent = setup.source_upgrade && !setup.source_upgrade.can_proceed ? "保留当前内容并退出" : "退出应用";
  els.setupExitButton.disabled = setup.status === "applying";
}

function setupRecoveryGuide(setup = {}) {
  const targets = (setup.source_upgrade?.items || setup.drift?.conflicts || [])
    .map((item) => `${item.diagnostic_code || item.disposition || item.status || "conflict"}: ${item.name || item.skill || "unknown"}\n  ${item.path}${item.current_digest || item.incoming_digest ? `\n  current=${item.current_digest || "unknown"}\n  bundled=${item.incoming_digest || "unknown"}` : ""}${item.reason ? `\n  ${item.reason}` : ""}`)
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

async function refreshSnapshot({ quiet = false, surface = "all" } = {}) {
  if (state.refreshing) return;
  const workSurface = surface === "work";
  state.refreshing = true;
  if (!quiet) renderSyncing(true);
  try {
    let [snapshot, platform, authentication] = await Promise.all([
      workSurface ? Promise.resolve(state.snapshot) : api.automationSnapshot({
        project_id: state.selectedProjectId,
        state: state.page === "tasks" ? state.selectedState : ""
      }),
      api.platformSnapshot({
        sections: workSurface ? ["tasks"] : ["overview", "organizations", "members", "tasks", "feedback", "today"],
        task_filters: state.page === "work" ? platformTaskFilters() : {}
      }),
      workSurface ? Promise.resolve(state.authentication) : api.getAuthStatus()
    ]);
    platform ||= emptyPlatformSnapshot();
    if (workSurface) platform = mergeWorkPlatformSnapshot(state.platform, platform);
    authentication = normalizeAuthentication(authentication);
    const identityChanged = taskAttachmentIdentityKey({ platform: state.platform, authentication: state.authentication })
      !== taskAttachmentIdentityKey({ platform, authentication });
    const worksetProjectIds = new Set((platform.active_workset?.project_ids || []).map(String));
    if (state.selectedProjectId !== "all" && !worksetProjectIds.has(state.selectedProjectId)) {
      state.selectedProjectId = "all";
      snapshot = await api.automationSnapshot({ project_id: "all", state: state.page === "tasks" ? state.selectedState : "" });
      showToast("当前产品已不在产品集中，查看范围已切回项目集全部。");
    }
    invalidateTaskAttachmentCaches(state, { clearPending: identityChanged });
    state.snapshot = snapshot;
    state.platform = platform;
    hydrateTodayPreference(platform.ui_preferences?.today);
    if (!workSurface) state.feedbackSnapshotEpoch += 1;
    syncWorkInspectorWidth(platform);
    const scopeIds = new Set((state.platform.organization_scopes || []).map((item) => String(item.id)));
    if ((!state.organizationScopeChosen && scopeIds.size > 0) || !state.organizationScopeId || (state.organizationScopeId !== "personal" && !scopeIds.has(state.organizationScopeId))) {
      state.organizationScopeId = String(state.platform.organization_scopes?.[0]?.id || "personal");
      state.organizationSection = state.organizationScopeId === "personal" ? "projects" : "overview";
    }
    if (state.workbenchTask) {
      state.workbenchTask = snapshot.tasks.find((task) => String(task.id) === String(state.workbenchTask.id)) || state.workbenchTask;
    }
    state.authentication = authentication;
    const visibleTasks = state.snapshot.tasks.filter(scopedTaskFilter);
    if (state.selectedTaskId && !visibleTasks.some((task) => String(task.id) === state.selectedTaskId)) {
      state.selectedTaskId = visibleTasks[0]?.id || "";
    }
    if (!state.selectedTaskId && visibleTasks.length > 0) {
      state.selectedTaskId = visibleTasks[0].id;
    }
    if (state.page === "workbench") await loadTranscript();
    if (workSurface && state.page === "work") renderWorkSurface();
    else render();
    routeAuthentication();
  } finally {
    state.refreshing = false;
    renderSyncing(false);
  }
}

async function refreshWorkQuery({ quiet = false } = {}) {
  const input = currentWorkQueryInput();
  const request = workQueryState.begin(input);
  state.workQuery = {
    key: request.key,
    projection: request.cached || emptyWorkQueryProjection(request.key, request.query),
    loading: true,
    error: ""
  };
  if (state.page === "work") renderWorkSurface();
  try {
    const projection = await api.platformWorkQuery({ query_key: request.key, ...request.query });
    const result = workQueryState.accept(request, projection);
    if (!result.accepted) throw new Error("Work 查询返回了不匹配的 query key。");
    if (!result.current) return projection;
    state.workQuery = { key: request.key, projection, loading: false, error: "" };
    if (state.page === "work") renderWorkSurface();
    return projection;
  } catch (error) {
    if (workQueryState.isCurrent(request)) {
      state.workQuery = {
        key: request.key,
        projection: request.cached || emptyWorkQueryProjection(request.key, request.query),
        loading: false,
        error: String(error?.message || "Work 查询失败")
      };
      if (state.page === "work") renderWorkSurface();
    }
    throw error;
  }
}

function mergeWorkPlatformSnapshot(current, incoming) {
  const previousWorkspaces = new Map((current.product_workspaces || []).map((workspace) => [String(workspace.id), workspace]));
  const productWorkspaces = (incoming.product_workspaces || []).map((workspace) => {
    const previous = previousWorkspaces.get(String(workspace.id)) || {};
    return {
      ...previous,
      ...workspace,
      members: previous.members || [],
      feedback_v1: previous.feedback_v1 || [],
      feedback_count: previous.feedback_count ?? workspace.feedback_count ?? 0,
      feedback_management: previous.feedback_management || workspace.feedback_management
    };
  });
  const retainedErrors = (current.errors || []).filter((item) => !["tasks", "task_counts", "tags"].includes(item.section));
  return {
    ...current,
    generated_at: incoming.generated_at,
    source_status: incoming.source_status,
    user: incoming.user,
    worksets: incoming.worksets,
    active_workset: incoming.active_workset,
    ui_preferences: incoming.ui_preferences,
    projects: incoming.projects,
    product_workspaces: productWorkspaces,
    tasks: incoming.tasks,
    task_trees: incoming.task_trees,
    tags: incoming.tags,
    task_replacements: incoming.task_replacements || [],
    automation: incoming.automation,
    errors: [...retainedErrors, ...(incoming.errors || [])]
  };
}

function scheduleRefresh(delay = 80) {
  if (refreshQueued) return;
  refreshQueued = true;
  window.setTimeout(async () => {
    refreshQueued = false;
    const refresh = state.page === "work" ? refreshWorkQuery({ quiet: true }) : refreshSnapshot({ quiet: true });
    await refresh.catch((error) => showToast(error.message));
  }, delay);
}

function scheduleAutomationRefresh(delay = 80) {
  if (automationRefreshQueued) return;
  automationRefreshQueued = true;
  window.setTimeout(async () => {
    automationRefreshQueued = false;
    if (state.refreshing) {
      scheduleAutomationRefresh(delay);
      return;
    }
    await refreshSnapshot({ quiet: true }).catch((error) => showToast(error.message));
  }, delay);
}

function scheduleActivityRefresh(event, delay = 120) {
  activityRefreshQueue.enqueue(event, delay);
}

function activityRunIsVisible(runId) {
  if (!runId || !["command", "workbench"].includes(state.page)) return false;
  const visibleRun = state.page === "workbench"
    ? state.workbenchRun || state.snapshot.active_run
    : state.snapshot.active_run;
  return String(visibleRun?.id || "") === String(runId);
}

async function refreshVisibleAutomationActivity(runId) {
  const event = typeof runId === "object" && runId ? runId : { runId };
  if (!activityEventOwnerIsVisible(event)) return;
  const page = state.page;
  const visibleRun = visibleAutomationRun();
  let nextRun = applyRunActivityPatch(visibleRun, event.patch);
  if (!nextRun) {
    const snapshot = await api.runActivitySnapshot(event.runId);
    if (state.page !== page || !activityEventOwnerIsVisible(event)) return;
    if (!snapshot?.run || !activityOwnerMatchesRun(snapshot.owner, visibleAutomationRun())) return;
    nextRun = snapshot.run;
  }
  if (state.page !== page || !activityEventOwnerIsVisible(event)) return;
  adoptVisibleAutomationRun(nextRun);
  if (page === "workbench") {
    await loadTranscript();
    if (state.page === page && activityRunIsVisible(event.runId)) renderWorkbench();
    return;
  }
  renderCommandCenter();
}

function visibleAutomationRun() {
  return state.page === "workbench"
    ? state.workbenchRun || state.snapshot.active_run
    : state.snapshot.active_run;
}

function activityEventOwnerIsVisible(event) {
  if (!event?.runId || !["command", "workbench"].includes(state.page)) return false;
  const run = visibleAutomationRun();
  return String(run?.id || "") === String(event.runId) && activityOwnerMatchesRun(event.owner, run);
}

function adoptVisibleAutomationRun(run) {
  if (String(state.snapshot.active_run?.id || "") === String(run?.id || "")) {
    state.snapshot = { ...state.snapshot, active_run: run };
  }
  if (String(state.workbenchRun?.id || "") === String(run?.id || "")) {
    state.workbenchRun = run;
  }
}

function scheduleWorkFilterRefresh(delay = 280) {
  window.clearTimeout(workFilterTimer);
  workFilterTimer = window.setTimeout(() => {
    setPlatformTaskSelectionIntent("");
    state.workQueryOffset = 0;
    refreshWorkQuery().catch((error) => showToast(error.message));
  }, delay);
}

function defaultWorkFilters() {
  const end = new Date();
  const start = new Date(end.getTime() - 99 * 24 * 60 * 60 * 1000);
  return {
    creator_ids: [], executor_ids: [], tag_ids: [], priorities: [],
    start_time: dateInputValue(start), end_time: dateInputValue(end)
  };
}

function dateInputValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function selectedValues(element) {
  return [...element.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value).filter(Boolean);
}

function readWorkFiltersFromControls() {
  state.platformWorkFilters = {
    creator_ids: selectedValues(els.workCreatorFilter),
    executor_ids: selectedValues(els.workExecutorFilter),
    tag_ids: selectedValues(els.workTagFilter),
    priorities: selectedValues(els.workPriorityFilter),
    start_time: els.workStartDateFilter.value,
    end_time: els.workEndDateFilter.value
  };
}

function platformTaskFilters() {
  return {
    tree: true,
    states: [state.selectedState],
    search_key: state.platformWorkFilter,
    ...state.platformWorkFilters
  };
}

function currentWorkQueryInput() {
  return {
    workset_id: state.platform.active_workset?.id || "",
    project_id: state.selectedProjectId,
    state: state.selectedState,
    search_key: state.platformWorkFilter,
    filters: state.platformWorkFilters,
    offset: state.workQueryOffset,
    limit: WORK_QUERY_WINDOW_SIZE
  };
}

function emptyWorkQueryProjection(key = "", query = normalizeWorkQuery({})) {
  return {
    schema_version: "arcorbit-work-query/v1",
    query_key: key || workQueryKey(query),
    generated_at: "",
    source_status: "loading",
    active_workset: state.platform.active_workset,
    projects: [],
    product_workspaces: [],
    tasks: [],
    task_trees: [],
    tags: [],
    window: { offset: query.offset || 0, limit: query.limit || WORK_QUERY_WINDOW_SIZE, returned: 0, total: 0, has_more: false },
    errors: []
  };
}

async function refreshChat({ quiet = false, resetOwner = false } = {}) {
  chatRefreshRequested = true;
  chatRefreshQuiet = chatRefreshQuiet && quiet;
  chatRefreshResetOwner = chatRefreshResetOwner || resetOwner;
  if (chatRefreshPromise) return chatRefreshPromise;
  chatRefreshPromise = (async () => {
    let result = null;
    while (chatRefreshRequested) {
      const nextQuiet = chatRefreshQuiet;
      const nextResetOwner = chatRefreshResetOwner;
      chatRefreshRequested = false;
      chatRefreshQuiet = true;
      chatRefreshResetOwner = false;
      if (!nextQuiet) renderChat();
      try {
        result = await chatStateCoordinator.refresh({ quiet: nextQuiet, resetOwner: nextResetOwner });
      } finally {
        renderChat();
        if (state.page === "today") renderToday();
      }
    }
    return result;
  })();
  try {
    return await chatRefreshPromise;
  } finally {
    chatRefreshPromise = null;
    if (chatRefreshRequested) scheduleChatRefresh(0);
  }
}

function scheduleChatRefresh(delay = 32) {
  if (chatRefreshTimer !== null) return;
  chatRefreshTimer = window.setTimeout(() => {
    chatRefreshTimer = null;
    refreshChat({ quiet: true }).catch(() => {});
  }, delay);
}

function selectedChatSession() {
  const chat = chatState();
  return chat.snapshot.sessions.find((session) => session.id === chat.owner.session_id) || null;
}

function selectedChatProject() {
  const chat = chatState();
  const session = selectedChatSession();
  if (session) return chat.snapshot.projects.find((project) => project.id === session.project_id) || null;
  const candidateIds = [chat.owner.project_id, chat.snapshot.draft.project_id, chat.snapshot.projects[0]?.id];
  return candidateIds.map((projectId) => chat.snapshot.projects.find((project) => project.id === projectId)).find(Boolean) || null;
}

function defaultChatDraftProject() {
  const chat = chatState();
  const session = selectedChatSession();
  const candidateIds = [session?.project_id, chat.snapshot.draft.project_id, chat.owner.project_id, chat.snapshot.projects[0]?.id];
  return candidateIds.map((projectId) => chat.snapshot.projects.find((project) => project.id === projectId)).find(Boolean) || null;
}

function renderChatSession(item, selectedSessionId) {
  return `<button class="chat-session ${item.id === selectedSessionId ? "is-active" : ""}" data-chat-session-id="${escapeHtml(item.id)}" type="button"><strong>${escapeHtml(item.title)}</strong><span class="chat-session-status ${escapeHtml(item.status)}" aria-label="${escapeHtml(chatStatusLabel(item.status))}"></span><small>${escapeHtml(chatStatusLabel(item.status))} · ${escapeHtml(formatDateTime(item.updated_at))}</small></button>`;
}

function renderChatSessionGroups(chat) {
  const groups = groupChatSessions({ sessions: chat.snapshot.sessions, projects: chat.snapshot.projects });
  const currentProjectIds = new Set(groups.map((group) => group.project_id));
  for (const projectId of expandedChatProjectIds) {
    if (!currentProjectIds.has(projectId)) expandedChatProjectIds.delete(projectId);
  }
  return groups.map((group) => {
    const visibility = chatSessionVisibility(group, {
      expanded: expandedChatProjectIds.has(group.project_id),
      selectedSessionId: chat.owner.session_id,
      limit: CHAT_SESSION_PREVIEW_LIMIT
    });
    if (visibility.selected_requires_history) expandedChatProjectIds.add(group.project_id);
    const unavailable = group.available ? "" : `<span class="chat-project-unavailable">不可用</span>`;
    const historyControl = visibility.hidden_count
      ? `<button class="chat-history-toggle" data-chat-history-project-id="${escapeHtml(group.project_id)}" type="button" aria-expanded="${visibility.expanded}" ${visibility.selected_requires_history ? "disabled title=\"当前会话位于历史中\"" : ""}>${visibility.expanded ? "收起历史会话" : `查看历史会话（其余 ${visibility.hidden_count} 个）`}</button>`
      : "";
    return `<section class="chat-project-group" data-chat-project-group="${escapeHtml(group.project_id)}"><div class="chat-project-group-head"><strong>${escapeHtml(group.project_name)}</strong><span>${group.sessions.length} 个会话</span>${unavailable}</div><div class="chat-project-sessions">${visibility.sessions.map((item) => renderChatSession(item, chat.owner.session_id)).join("")}</div>${historyControl}</section>`;
  }).join("");
}

function renderChat() {
  if (!els.chatTranscript) return;
  const chat = chatState();
  const session = selectedChatSession();
  const project = selectedChatProject();
  const bindableRemoteProjects = state.platform.projects || [];
  const unavailableSessionProjectOption = session && !project
    ? `<option value="${escapeHtml(session.project_id)}" selected>${escapeHtml(session.project_id)}（不可用）</option>`
    : "";
  const projectOptions = chat.snapshot.projects.length || unavailableSessionProjectOption
    ? unavailableSessionProjectOption + chat.snapshot.projects.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === project?.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")
    : `<option value="">尚无本地 Product Workspace</option>`;
  if (projectOptions !== renderedChatProjectOptions) {
    els.chatProjectSelect.innerHTML = projectOptions;
    renderedChatProjectOptions = projectOptions;
  }
  els.chatProjectSelect.disabled = Boolean(session) || chat.snapshot.projects.length === 0;
  els.chatWorkspacePickerLabel.textContent = session ? "固定归属" : "新对话属于";
  els.newChatButton.disabled = chat.snapshot.projects.length === 0;
  const sessionList = chat.snapshot.sessions.length
    ? renderChatSessionGroups(chat)
    : `<div class="chat-empty-list">还没有对话。发送第一条消息时才会创建会话。</div>`;
  if (sessionList !== renderedChatSessionList) {
    els.chatSessionList.innerHTML = sessionList;
    renderedChatSessionList = sessionList;
    els.chatSessionList.querySelectorAll("[data-chat-session-id]").forEach((button) => button.addEventListener("click", () => runAction(async () => {
      await chatStateCoordinator.selectSession(button.dataset.chatSessionId);
      renderChat();
    })));
    els.chatSessionList.querySelectorAll("[data-chat-history-project-id]").forEach((button) => button.addEventListener("click", () => {
      const projectId = button.dataset.chatHistoryProjectId;
      if (expandedChatProjectIds.has(projectId)) expandedChatProjectIds.delete(projectId);
      else expandedChatProjectIds.add(projectId);
      renderedChatSessionList = "";
      renderChat();
    }));
  }
  els.chatWorkspaceLabel.textContent = project?.name
    ? `LOCAL WORKSPACE · ${project.name}`
    : session?.project_id ? `LOCAL WORKSPACE · ${session.project_id} · 不可用` : "选择本地工作区";
  els.chatTitle.textContent = session?.title || "新对话";
  els.chatStatusText.textContent = session
    ? `${chatStatusLabel(session.status)}${chat.refreshing ? " · 正在同步" : ""}${session.error ? ` · ${session.error}` : ""}`
    : chat.refreshing ? "正在同步最新会话…"
      : project ? "发送第一条消息后创建持久会话和 Codex thread。" : "先在 Workset 中配置一个本地 Product Workspace。";
  els.chatTranscript.setAttribute("aria-busy", String(chat.refreshing));
  els.renameChatButton.disabled = !session;
  els.deleteChatButton.disabled = !session;
  els.chatErrorHost.innerHTML = chat.error || session?.error
    ? `<div class="chat-error" role="alert"><span>${escapeHtml(chat.error || session.error)}</span>${session?.status === "failed" ? `<button class="secondary-button" data-chat-retry-last type="button">编辑后重试</button>` : ""}</div>`
    : "";
  chatConversationSurface.render({
    contextId: session?.id || "chat-draft",
    messages: session ? chat.snapshot.messages : [],
    emptyHtml: session
      ? `<div class="chat-empty"><strong>开始这段对话</strong><p>向 Codex 提问，或说明希望它在 ${escapeHtml(project?.name || "当前项目")} 中完成什么。</p></div>`
      : `<div class="chat-empty"><strong>${project ? "开始新的自由对话" : "需要本地工作区"}</strong><p>${project ? "会话与 Automation、Case 和待办执行完全隔离；停止回答后可在同一 thread 继续。" : "选择 Workshop Project 和对应本地目录后返回当前草稿；该动作不创建组织、不邀请成员，也不修改 Workset。"}</p>${project ? "" : bindableRemoteProjects.length ? `<button class="primary-button" data-chat-add-workspace type="button">选择项目并绑定本地目录</button>` : `<button class="secondary-button" data-chat-copy-workspace-handoff type="button">复制项目连接说明</button>`}</div>`,
  });
  els.chatErrorHost.querySelector("[data-chat-retry-last]")?.addEventListener("click", () => {
    chatStateCoordinator.prepareRetry();
    renderChatComposer();
    els.chatInput.focus();
  });
  els.chatTranscript.querySelector("[data-chat-add-workspace]")?.addEventListener("click", () => runAction(openChatWorkspaceSetup));
  els.chatTranscript.querySelector("[data-chat-copy-workspace-handoff]")?.addEventListener("click", () => runAction(async () => {
    await navigator.clipboard.writeText("Chat 需要一个已绑定本地目录的 Product Workspace。当前账户没有可访问的 Workshop Project；请先加入或创建项目，再为自己选择本地目录。");
    showToast("项目连接说明已复制；聊天草稿保持不变。");
  }));
  renderChatComposer();
}

async function openChatWorkspaceSetup() {
  const projects = (state.platform.projects || []).map((project) => ({ value: project.id, label: project.name }));
  if (!projects.length) throw new Error("当前账户没有可访问的远端项目；请先加入或创建 Workshop Project。");
  await openPlatformAction({
    title: "让 Chat 进入一个本地项目",
    lead: "选择远端项目后再选择它对应的本地目录。绑定期间保留当前 Chat 草稿；失败不会清空选择或草稿。",
    confirmLabel: "选择目录并绑定",
    fields: [
      platformField("project_id", "远端项目", { type: "select", required: true, options: projects }),
      platformField("boundary", "不会连带修改", { value: "Organization、成员、Workset、任务和 Automation 授权", readonly: true })
    ],
    onSubmit: async (values) => {
      const localProject = await api.pickProject();
      if (!localProject) return { keepOpen: true };
      await bindAutomationWorkspace(values.project_id, localProject.id);
      await refreshChat({ quiet: true, resetOwner: true });
      showToast("Product Workspace 已绑定；聊天草稿已保留。");
      return { close: true };
    }
  });
}

function renderChatComposer() {
  const chat = chatState();
  const session = selectedChatSession();
  const project = selectedChatProject();
  const active = isChatActive(session?.status);
  if (els.chatInput.value !== chat.draft) els.chatInput.value = chat.draft;
  els.chatInput.disabled = !project;
  els.chatInput.placeholder = project ? "向 Codex 提问或说明希望它在当前项目中完成什么…" : "先配置本地 Product Workspace…";
  els.chatSendButton.disabled = !project || active || chat.sending || !chat.draft.trim();
  els.chatSendButton.classList.toggle("hidden", active);
  els.chatStopButton.classList.toggle("hidden", !active);
  els.chatStopButton.disabled = session?.status === "interrupting";
  els.chatComposerHint.textContent = active
    ? session?.status === "waiting_approval" ? "Codex 正在等待你的审批；也可以随时停止。" : "回答进行中；停止后保留已有内容，可在同一 thread 继续。"
    : "Enter 发送 · Shift+Enter 换行";
}

async function sendChat() {
  try {
    renderChatComposer();
    await chatStateCoordinator.send();
  } finally {
    renderChat();
  }
}

function isChatActive(status) {
  return ["starting", "running", "waiting_approval", "interrupting"].includes(status);
}

function chatStatusLabel(status) {
  return ({ starting: "正在启动", running: "Codex 正在回答", waiting_approval: "等待审批", interrupting: "正在停止", completed: "已完成", interrupted: "已停止", failed: "失败" })[status] || "就绪";
}

function render() {
  renderPageVisibility();
  renderNavigation();
  renderCommandBar();
  renderWorkset();
  renderToday();
  renderChat();
  renderOrganization();
  renderPlatformWork();
  renderPlatformFeedback();
  renderCommandCenter();
  renderTaskBrowser();
  renderWorkbench();
  renderRecovery();
}

function renderWorkSurface() {
  renderPageVisibility();
  renderNavigation();
  renderCommandBar();
  renderWorkset();
  renderPlatformWork();
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
  els.automationNavCount.textContent = String(snapshot.queue.filter(scopedTaskFilter).length + (snapshot.active_executions || []).length);
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
  const organizationCapabilityPage = ["organization", "engineering"].includes(state.page);
  els.scopeTitle.textContent = organizationCapabilityPage
    ? organizationScope?.name || "个人项目"
    : project?.name || state.platform.active_workset?.name || "项目集全部";
  els.pageTitle.textContent = {
    today: "Today", chat: "Chat", idea: "Idea", organization: "Organization", engineering: "Engineering",
    work: "Work", feedback: "Feedback", command: "Automation", release: "Release", operations: "Operations",
    tasks: STATE_LABELS[state.selectedState], workbench: "人工介入", recovery: "恢复中心"
  }[state.page] || "ArcOrbit";
  els.automationEnabled.checked = Boolean(state.snapshot.enabled);
  els.automationEnabled.disabled = !state.authentication.authenticated;
  els.productSetCluster.classList.toggle("hidden", organizationCapabilityPage);
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
  const view = deriveTodayWorkspace({
    platform: state.platform,
    automation: state.snapshot,
    setup: state.setup,
    setupByProject: state.todaySetupByProject,
    chat: chatState().snapshot,
    feedbackLinkRecoveries: state.feedbackLinkRecoveries,
    selectedProjectId: state.todaySelectedProjectId,
    selectedMode: state.todayMode,
    selectedItemId: state.todaySelectedItemId
  });
  state.todaySelectedProjectId = view.selected_project_id;
  state.todayMode = view.mode;
  state.todaySelectedItemId = view.selected_item_id;
  const visibleProjects = view.projects.filter((project) => !state.todayProjectSearch || `${project.name} ${project.id}`.toLowerCase().includes(state.todayProjectSearch.toLowerCase()));
  const sourceTone = state.platform.source_status === "healthy" ? "success" : state.platform.source_status === "degraded" ? "warning" : "danger";
  els.todaySummary.textContent = view.counts.responsibilities
    ? `${view.counts.responsibilities} 项明确责任正在等待你；普通工作继续留在各自页面。`
    : "当前没有需要你介入的责任；这里只展示必要的自动状态。";
  els.platformHealthBadge.className = `health-badge ${sourceTone}`;
  els.platformHealthBadge.textContent = state.platform.source_status === "healthy" ? "来源已同步" : state.platform.source_status === "degraded" ? "部分来源未知" : sourceStatusLabel(state.platform.source_status);
  els.todayFreshness.textContent = state.platform.generated_at ? `读取于 ${formatDateTime(state.platform.generated_at)}` : "尚无可信快照";
  els.platformErrorHost.innerHTML = view.counts.unknown_sources
    ? `<div class="platform-error"><strong>${view.counts.unknown_sources} 个来源状态未知</strong><span>保留最近可信责任；不会用 0 覆盖未知。</span><button class="secondary-button compact" data-today-retry-sources type="button">重试失败来源</button></div>`
    : "";
  els.todayInterventionCount.textContent = String(view.counts.responsibilities);
  els.todayConfigurationCount.textContent = String(view.counts.configuration_incomplete);
  document.querySelectorAll("[data-today-mode]").forEach((button) => {
    const active = button.dataset.todayMode === view.mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.addEventListener("click", () => {
      state.todayMode = button.dataset.todayMode;
      state.todaySelectedItemId = "";
      state.todayActionError = "";
      scheduleTodayPreferencePersistence();
      renderToday();
    }, { once: true });
  });
  els.todayProjectSearch.value = state.todayProjectSearch;
  els.todayProjectSearch.oninput = () => { state.todayProjectSearch = els.todayProjectSearch.value; renderToday(); };
  els.todayProjectRail.innerHTML = [
    `<button class="today-project-row ${view.selected_project_id === "all" ? "is-active" : ""}" data-today-project="all" type="button"><span><strong>全部项目</strong><small>${view.projects.length} 个相关项目</small></span><em>${view.counts.responsibilities}</em></button>`,
    ...visibleProjects.map((project) => `<button class="today-project-row ${view.selected_project_id === project.id ? "is-active" : ""}" data-today-project="${escapeHtml(project.id)}" type="button"><i>${escapeHtml((project.name || "P").slice(0, 1).toUpperCase())}</i><span><strong>${escapeHtml(project.name || project.id)}</strong><small>${todayProjectStatus(project)}</small></span>${project.responsibility_count ? `<em>${project.responsibility_count}</em>` : ""}</button>`)
  ].join("");
  els.todayProjectRail.querySelectorAll("[data-today-project]").forEach((button) => button.addEventListener("click", () => {
    state.todaySelectedProjectId = button.dataset.todayProject;
    state.todaySelectedItemId = "";
    state.todayActionError = "";
    scheduleTodayPreferencePersistence();
    renderToday();
  }));
  const items = view.mode === "configuration" ? view.configurations : view.interventions;
  const readyHandoff = view.mode === "configuration" && view.non_human_summary.ready_projects > 0 && items.length
    ? `<div class="today-ready-handoff"><span><strong>${view.non_human_summary.ready_projects} 个项目已可使用</strong><small>按真实需要到 Work 新建待办</small></span><button class="secondary-button compact" data-today-open-work type="button">前往 Work</button></div>`
    : "";
  els.todayResponsibilityList.innerHTML = items.length
    ? `${readyHandoff}${items.map((item) => todayResponsibilityRow(item, view.selected_item_id)).join("")}`
    : todayEmptyState(view);
  els.todayResponsibilityList.querySelectorAll("[data-today-item]").forEach((button) => button.addEventListener("click", () => {
    state.todaySelectedItemId = button.dataset.todayItem;
    state.todayActionError = "";
    scheduleTodayPreferencePersistence();
    renderToday();
  }));
  els.todayAutomaticSummary.innerHTML = `<strong>系统状态</strong><span>${view.non_human_summary.ready_projects} 个项目可自动工作 · ${view.non_human_summary.running_projects} 个正在推进${view.non_human_summary.automatic_recovery_projects ? ` · ${view.non_human_summary.automatic_recovery_projects} 个自动恢复中` : ""}</span>`;
  els.todayOperator.innerHTML = `${renderTodayResult()}${renderTodayOperator(view.selected_item, view)}`;
  wireTodayOperatorDraft(view.selected_item);
  els.todayOperator.querySelectorAll("[data-today-action]").forEach((button) => button.addEventListener("click", () => runAction(() => performTodayAction(view.selected_item, button.dataset.todayAction))));
  els.todayResponsibilityList.querySelector("[data-today-open-work]")?.addEventListener("click", () => showPage("work"));
  els.todayResponsibilityList.querySelector("[data-today-empty-add]")?.addEventListener("click", () => runAction(openTodayProjectCatalog));
  els.todayAddProjectButton.onclick = () => runAction(openTodayProjectCatalog);
  els.platformErrorHost.querySelector("[data-today-retry-sources]")?.addEventListener("click", () => runAction(() => refreshSnapshot()));
  els.attentionNavCount.textContent = view.counts.unknown_sources ? `${view.counts.responsibilities}+?` : String(view.counts.responsibilities);
}

function renderTodayResult() {
  if (!state.todayResult && !state.todayActionError) return "";
  if (state.todayActionError) return `<div class="today-action-result is-error"><strong>来源未确认操作</strong><span>${escapeHtml(state.todayActionError)}</span></div>`;
  return `<div class="today-action-result is-success"><strong>来源已确认</strong><span>${escapeHtml(state.todayResult.message)} · ${escapeHtml(state.todayResult.source_object_id || "")} · ${escapeHtml(formatDateTime(state.todayResult.confirmed_at))}</span></div>`;
}

function todayProjectStatus(project) {
  if (!project.in_today_scope) return project.responsibility_count ? `${project.responsibility_count} 项需要你处理` : "责任来源项目";
  if (project.configuration.blocker?.code === "project_source_unknown") return "状态未知";
  if (!project.configuration.ready) return project.configuration.blocker?.label || "配置未完成";
  if (project.automatic_status === "running") return "自动推进中";
  return "配置完成 · 当前待命";
}

function todayResponsibilityRow(item, selectedId) {
  const selected = item.id === selectedId ? "is-active" : "";
  const label = todayKindLabel(item.kind);
  return `<button class="today-responsibility-row ${selected}" data-today-item="${escapeHtml(item.id)}" type="button"><span class="today-responsibility-kind">${escapeHtml(label)}</span><strong>${escapeHtml(item.title || "需要处理")}</strong><p>${escapeHtml(item.reason || "")}</p><small>${escapeHtml(projectName(item.project_id))}${item.updated_at ? ` · ${escapeHtml(formatDateTime(item.updated_at))}` : ""}</small></button>`;
}

function todayKindLabel(kind) {
  return ({ project_configuration: "项目配置", chat_approval: "Chat 授权", automation_attention: "Automation 决定", automation_recovery: "Automation 恢复", feedback_link_recovery: "Feedback 收口", work_replacement_recovery: "Work 移动收口", work_pending_review: "Work 确认", work_completed: "Work 验收", work_blocked: "Work 阻塞" })[kind] || "人工责任";
}

function todayEmptyState(view) {
  if (view.mode === "configuration" && view.counts.configured_projects === 0) return `<div class="today-list-empty"><strong>先添加一个项目</strong><p>可以新建个人项目、从可访问目录选择，或使用邀请码加入。</p><button class="primary-button" data-today-empty-add type="button">添加项目</button></div>`;
  if (view.mode === "configuration") return `<div class="today-list-empty"><strong>当前范围配置完成</strong><p>项目已满足 Automation 执行前置；创建待办请前往 Work。</p><button class="secondary-button" data-today-open-work type="button">前往 Work 新建待办</button></div>`;
  return `<div class="today-list-empty"><strong>没有需要你处理的事情</strong><p>Automation 和其他页面会在责任明确交给你时发布到这里。</p></div>`;
}

function renderTodayOperator(item, view) {
  if (!item) return `<div class="today-operator-empty"><span>✓</span><h2>${view.mode === "configuration" ? "选择一个项目继续配置" : "当前无需人工介入"}</h2><p>${view.mode === "configuration" ? "项目之间独立检查；配置一个项目不会中断其他项目。" : "普通待办、完整运行进度和已处理历史不会出现在 Today。"}</p></div>`;
  const project = view.projects.find((candidate) => candidate.id === item.project_id) || item.context || {};
  if (item.kind === "project_configuration") return renderTodayConfigurationOperator(item, project);
  const draft = state.todayDrafts[item.id] || "";
  const automationTimeline = item.source === "automation" ? `<section class="today-operator-section"><h3>人机接力</h3><div class="today-handoff-timeline"><span class="is-complete">自动执行</span><span class="is-current">等待你</span><span>来源校验</span><span>恢复原执行</span></div></section>` : "";
  const contextRows = [
    ["项目", project.name || projectName(item.project_id)],
    ["来源", todayKindLabel(item.kind)],
    ["对象", item.source_object_id || "—"],
    ["最近同步", item.updated_at ? formatDateTime(item.updated_at) : "当前快照"]
  ];
  const needsDraft = item.source === "automation" || item.actions.includes("raise_acceptance_issue");
  const busy = state.todaySubmittingItemId === item.id;
  return `<div class="today-operator-scroll"><header class="today-operator-header"><div><p class="eyebrow">${escapeHtml(todayKindLabel(item.kind))}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(project.name || projectName(item.project_id))}</p></div><span class="status-pill ${busy ? "in_progress" : "pending_review"}">${busy ? "提交中" : "等待你"}</span></header><section class="today-operator-section today-reason"><h3>为什么需要你</h3><p>${escapeHtml(item.reason)}</p><small>不处理会使当前来源对象保持等待或留下未收口事务。</small></section>${renderTodaySourceContext(item)}<section class="today-operator-section"><h3>关联身份</h3><dl class="today-facts">${contextRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>${automationTimeline}<section class="today-operator-section"><h3>操作</h3>${needsDraft ? `<label class="today-field"><span>${item.actions.includes("raise_acceptance_issue") ? "验收问题或补充说明" : "补充说明"}</span><textarea data-today-draft rows="4" placeholder="切换项目或责任项不会丢失当前输入。">${escapeHtml(draft)}</textarea></label>` : `<p class="today-action-explanation">提交后由来源确认新状态；确认前不会从 Today 移除。</p>`}</section></div><footer class="today-operator-actions">${item.actions.map((action, index) => `<button class="${index === 0 ? "primary-button" : "secondary-button"}" data-today-action="${escapeHtml(action)}" type="button" ${busy ? "disabled aria-busy=\"true\"" : ""}>${busy ? "正在等待来源…" : escapeHtml(todayActionLabel(action))}</button>`).join("")}</footer>`;
}

function renderTodaySourceContext(item) {
  if (item.source === "chat") return todayContextSection("请求边界", [
    ["会话", item.context?.session_title || item.context?.session_id],
    ["Turn", item.context?.turn_id],
    ["Request", item.source_object_id],
    ["工具动作", item.context?.approval_method || item.context?.content],
    ["授权范围", "仅当前请求；拒绝结果同样返回原 turn"]
  ]);
  if (item.kind === "work_replacement_recovery") return todayContextSection("部分成功事务", [
    ["源待办", item.source_task_id],
    ["目标待办", item.target_task_id],
    ["目标项目", projectName(item.target_project_id)],
    ["恢复边界", "只删除源待办，绝不再次创建目标待办"]
  ]);
  if (item.source === "work") {
    const issues = (item.acceptance_feedback_items || []).map((issue) => `<li><strong>${escapeHtml(issue.original_feedback || issue.title || issue.feedback_id || "验收问题")}</strong><small>${escapeHtml(issue.status || "unknown")}${issue.progress ? ` · ${escapeHtml(issue.progress)}` : ""}</small></li>`).join("");
    return `<section class="today-operator-section"><h3>完整待办上下文</h3><p class="today-source-copy">${escapeHtml(item.content || item.blocked_reason || "来源未提供更多内容。")}</p><dl class="today-facts">${todayFactRows([["状态", item.state], ["提交者", item.creator_name || item.creator_id], ["执行人", item.executor_name || item.executor_id], ["版本", item.version], ["优先级", item.priority ?? item.raw?.priority]])}</dl>${issues ? `<details class="today-context-disclosure"><summary>验收问题 · ${(item.acceptance_feedback_items || []).length}</summary><ul>${issues}</ul></details>` : ""}</section>`;
  }
  if (item.source === "feedback") return todayContextSection("关联事务", [
    ["Feedback", item.feedback_id || item.source_object_id],
    ["已创建 Task", item.task_id],
    ["事务身份", item.transaction_id || item.idempotency_key || item.source_item_id],
    ["恢复边界", "只重试关联，不创建第二个 Task"]
  ]);
  if (item.source === "automation") return todayContextSection(item.kind === "automation_recovery" ? "恢复证据" : "决定上下文", [
    ["Task", item.task_id],
    ["Run / Execution", item.run_id || item.execution_id],
    ["Case", item.case_id],
    ["Thread / Session", item.thread_id || item.session_id],
    ["冻结范围", item.freeze_scope || "当前项目 lane"],
    ["恢复类型", item.source_kind || item.type]
  ]);
  return "";
}

function todayFactRows(rows) {
  return rows.filter(([, value]) => value !== undefined && value !== null && String(value) !== "").map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join("");
}

function todayContextSection(title, rows) {
  const facts = todayFactRows(rows);
  return facts ? `<section class="today-operator-section"><h3>${escapeHtml(title)}</h3><dl class="today-facts">${facts}</dl></section>` : "";
}

function renderTodayConfigurationOperator(item, project) {
  const configuration = item.configuration;
  const setup = todayProjectSetup(project);
  const setupDetails = configuration.blocker?.code === "setup_action_required" ? renderTodaySetupDetails(setup) : "";
  const actions = todayConfigurationActions(item, setup);
  return `<div class="today-operator-scroll"><header class="today-operator-header"><div><p class="eyebrow">PROJECT CONFIGURATION</p><h2>${escapeHtml(project.name || item.project_id)}</h2><p>当前设备上的 Automation 执行前置</p></div><span class="status-pill ${configuration.ready ? "accepted" : "pending_review"}">${configuration.ready ? "READY" : "待配置"}</span></header><section class="today-operator-section today-reason"><h3>当前唯一阻塞</h3><p>${escapeHtml(configuration.blocker?.label || "配置完成")}</p><small>待办数量、全局自动领取、队列和第一次运行不属于项目配置。</small></section><section class="today-operator-section"><h3>四项完成口径</h3><div class="today-readiness-list">${configuration.steps.map((step) => `<div class="${step.complete ? "is-complete" : ""}"><i>${step.complete ? "✓" : "○"}</i><span><strong>${escapeHtml(step.label)}</strong><small>${step.complete ? "已确认" : step.id === configuration.blocker?.code ? "当前" : "等待前置"}</small></span></div>`).join("")}</div></section>${setupDetails}<section class="today-operator-section"><h3>项目与设备</h3><dl class="today-facts"><div><dt>项目</dt><dd>${escapeHtml(project.name || item.project_id)}</dd></div><div><dt>本地目录</dt><dd>${escapeHtml(project.local_project_path || "尚未选择")}</dd></div><div><dt>参与范围</dt><dd>当前用户 · 当前设备</dd></div></dl></section></div><footer class="today-operator-actions">${actions.map((action, index) => `<button class="${index === 0 ? "primary-button" : "secondary-button"}" data-today-action="${escapeHtml(action)}" type="button">${escapeHtml(todayActionLabel(action))}</button>`).join("")}</footer>`;
}

function todayProjectSetup(project = {}) {
  const projectId = String(project.id || "");
  const localProjectId = String(project.local_project_id || "");
  return state.todaySetupByProject[projectId] || state.todaySetupByProject[localProjectId] || null;
}

function todayConfigurationActions(item, setup) {
  if (item.configuration?.blocker?.code !== "setup_action_required" || !setup) return item.actions;
  if (setup.can_apply) return ["apply_project_setup", "check_setup"];
  if (setup.can_recover) return ["recover_project_setup", "check_setup"];
  if (["blocked", "conflict"].includes(setup.status)) return ["copy_project_setup_guide", "check_setup"];
  return item.actions;
}

function renderTodaySetupDetails(setup) {
  if (!setup) return "";
  const counts = setup.drift?.counts || {};
  const targets = (setup.plan?.project_roots || []).slice(0, 4);
  const conflicts = setup.source_upgrade?.items || setup.drift?.conflicts || [];
  return `<section class="today-operator-section"><h3>项目 Setup 事实</h3><dl class="today-facts"><div><dt>检查状态</dt><dd>${escapeHtml(String(setup.status || "unknown"))}</dd></div><div><dt>变更摘要</dt><dd>新增 ${Number(counts.missing || 0)} · 变化 ${Number(counts.changed || 0)} · 冲突 ${conflicts.length}</dd></div>${targets.length ? `<div class="wide"><dt>写入目标</dt><dd>${targets.map((target) => escapeHtml(target)).join("<br>")}</dd></div>` : ""}${setup.error?.message ? `<div class="wide"><dt>阻塞原因</dt><dd>${escapeHtml(setup.error.message)}</dd></div>` : ""}</dl><p class="today-action-explanation">写入或恢复会先显示准确边界并要求确认；操作完成后只重新计算此项目。</p></section>`;
}

function todayActionLabel(action) {
  return ({ bind_workspace: "选择本地目录", check_setup: "重新检查项目环境", apply_project_setup: "确认写入项目环境", recover_project_setup: "备份并恢复", copy_project_setup_guide: "复制恢复说明", enable_project: "允许本机参与", retry_project_source: "重试项目来源", allow_once: "本次允许", decline_and_continue: "拒绝并继续", submit_intervention: "提交决定", confirm_external_dependency: "已处理，重新检查", retry_start: "重试同一启动", feedback_continue: "补充说明并继续", retry_case_reuse: "复用已有 Case", retry_as_new_case: "作为新事项继续", retry_sync: "重新同步", retry_cli_handoff: "重试交接", retry_complete: "重试写回", accept_server_state: "接受服务器事实", mark_blocked: "标记阻塞", confirm_work: "确认可处理", accept_work: "标记已验收", raise_acceptance_issue: "提出验收问题", return_work: "返回待处理", cancel_work: "取消待办", retry_feedback_link: "仅重试关联", retry_task_replacement: "重试删除源待办", keep_task_replacement: "保留两份" })[action] || action;
}

function wireTodayOperatorDraft(item) {
  const textarea = els.todayOperator.querySelector("[data-today-draft]");
  if (textarea && item) textarea.addEventListener("input", () => {
    state.todayDrafts[item.id] = textarea.value;
    scheduleTodayPreferencePersistence(300);
  });
}

function todayPreference() {
  return {
    selected_project_id: state.todaySelectedProjectId,
    selected_mode: state.todayMode,
    selected_item_id: state.todaySelectedItemId,
    drafts: state.todayDrafts
  };
}

function hydrateTodayPreference(preference = {}) {
  if (state.todayPreferenceHydrated) return;
  state.todaySelectedProjectId = String(preference.selected_project_id || "all");
  state.todayMode = ["intervention", "configuration"].includes(preference.selected_mode) ? preference.selected_mode : "";
  state.todaySelectedItemId = String(preference.selected_item_id || "");
  state.todayDrafts = preference.drafts && typeof preference.drafts === "object" ? { ...preference.drafts } : {};
  state.todayPreferenceHydrated = true;
  state.todayLastPersistedPreference = JSON.stringify(todayPreference());
}

function scheduleTodayPreferencePersistence(delay = 80) {
  window.clearTimeout(state.todayPreferenceTimer);
  state.todayPreferenceTimer = window.setTimeout(async () => {
    const preference = todayPreference();
    const serialized = JSON.stringify(preference);
    if (serialized === state.todayLastPersistedPreference) return;
    try {
      await api.setTodayPreference(preference);
      state.todayLastPersistedPreference = serialized;
    } catch (error) {
      showToast(`Today 状态保存失败：${error?.message || String(error)}`, true);
    }
  }, delay);
}

async function performTodayAction(item, action) {
  if (!item || state.todaySubmittingItemId) return;
  state.todaySubmittingItemId = item.id;
  state.todayActionError = "";
  state.todayResult = null;
  renderToday();
  try {
    const draft = String(state.todayDrafts[item.id] || "").trim();
    if (action === "allow_once" || action === "decline_and_continue") {
      await api.decideChatApproval({ session_id: item.context?.session_id, request_id: item.source_object_id, decision: action === "allow_once" ? "accept" : "decline" });
      await refreshChat({ quiet: true });
    } else if (action === "submit_intervention") {
      if (!draft) throw new Error("请先填写要交给 Agent 的决定或事实。");
      await api.submitIntervention({ execution_id: item.execution_id || state.snapshot.selected_execution_id, taskId: item.task_id, message: draft });
      await refreshSnapshot({ quiet: true });
    } else if (action === "confirm_external_dependency") {
      await api.confirmAutomationExternalDependency({ execution_id: item.execution_id || state.snapshot.selected_execution_id });
      await refreshSnapshot({ quiet: true });
    } else if (item.kind === "automation_recovery") {
      if (action === "feedback_continue" && !draft) throw new Error("请先填写补充说明。");
      await api.resolveAutomationRecovery({ recoveryId: item.source_item_id, action, message: action === "feedback_continue" ? draft : "" });
      await refreshSnapshot({ quiet: true });
    } else if (action === "confirm_work") {
      await executeManagedAction("task.update", { task_id: item.source_object_id, state: "pending", expected_state: "pending_review" }, "待办已确认为待处理");
    } else if (action === "accept_work") {
      const openIssues = (item.acceptance_feedback_items || []).filter((issue) => !["resolved", "cancelled"].includes(issue.status));
      if (openIssues.length) throw new Error(`仍有 ${openIssues.length} 个验收问题未解决，暂不能标记已验收。`);
      await executeManagedAction("task.update", { task_id: item.source_object_id, state: "accepted", expected_state: "completed" }, "待办已验收");
    } else if (action === "raise_acceptance_issue") {
      if (!draft) throw new Error("请先描述验收问题。");
      const idempotencyKey = globalThis.crypto?.randomUUID?.() || `${item.source_object_id}-${Date.now()}`;
      await api.submitAcceptanceFeedback({ taskId: item.source_object_id, message: draft, idempotencyKey });
      await refreshSnapshot({ quiet: true });
    } else if (action === "return_work" || action === "cancel_work") {
      const nextState = action === "return_work" ? "pending" : "cancelled";
      await executeManagedAction("task.update", { task_id: item.source_object_id, state: nextState, expected_state: "blocked" }, action === "return_work" ? "待办已返回待处理" : "待办已取消");
    } else if (action === "retry_feedback_link") {
      await retryFeedbackTaskLink(item.source_object_id);
    } else if (action === "retry_task_replacement") {
      await retryTaskProjectReplacement(item.source_object_id);
    } else if (action === "keep_task_replacement") {
      await keepTaskProjectReplacement(item.source_object_id);
    } else if (action === "bind_workspace") {
      await bindProjectWorkspace(item.context, { surface: "today" });
    } else if (action === "check_setup") {
      await checkSetupReadinessForSelection(item.context?.local_project_id, { presentSetup: false });
      await refreshSnapshot({ quiet: true });
    } else if (["apply_project_setup", "recover_project_setup", "copy_project_setup_guide"].includes(action)) {
      const completed = await performTodayProjectSetupAction(item, action);
      if (!completed) return;
      await refreshSnapshot({ quiet: true });
    } else if (action === "enable_project") {
      await api.setProjectParticipation(item.project_id, true);
      await refreshSnapshot({ quiet: true });
    } else if (action === "retry_project_source") {
      await refreshSnapshot({ quiet: true });
    } else {
      throw new Error(`Today 尚不支持动作 ${action}。`);
    }
    delete state.todayDrafts[item.id];
    state.todaySelectedItemId = "";
    scheduleTodayPreferencePersistence();
    state.todayResult = { item_id: item.id, source_object_id: item.source_object_id, message: `${todayKindLabel(item.kind)}已完成，来源状态已更新`, confirmed_at: new Date().toISOString() };
  } catch (error) {
    state.todayActionError = error?.message || String(error);
    throw error;
  } finally {
    state.todaySubmittingItemId = "";
    renderToday();
    if (state.todayResult) window.setTimeout(() => { state.todayResult = null; if (state.page === "today") renderToday(); }, 4200);
  }
}

async function performTodayProjectSetupAction(item, action) {
  const localProjectId = String(item.context?.local_project_id || "");
  const setup = todayProjectSetup(item.context);
  if (!localProjectId || !setup) throw new Error("项目 Setup 事实已变化，请重新检查。");
  if (action === "copy_project_setup_guide") {
    await navigator.clipboard.writeText(setupRecoveryGuide(setup));
    showToast("项目恢复说明已复制。", false);
    return true;
  }
  state.todaySetupOperationProjectId = localProjectId;
  try {
    if (action === "apply_project_setup") {
      const targets = (setup.plan?.project_roots || []).join("\n") || item.context?.local_project_path || localProjectId;
      if (!window.confirm(`将按当前 fresh plan 写入此项目的受管理能力：\n\n${targets}\n\nPlan digest：${setup.plan?.digest || "未提供"}\n\n未列出的项目和目录不会改变。是否继续？`)) return false;
      state.todaySetupByProject[localProjectId] = await api.applySetupPlan({ planDigest: setup.plan?.digest });
      return true;
    }
    const upgrade = setup.source_upgrade || {};
    const recoveryAction = upgrade.can_backup_and_restore
      ? "backup-and-restore"
      : upgrade.can_backup_and_reinstall
        ? "backup-and-reinstall"
        : upgrade.can_backup_and_overwrite_selected ? "backup-and-overwrite-selected" : "";
    if (!recoveryAction) throw new Error("当前检查没有可执行的安全恢复路径，请复制恢复说明。");
    let selectedPaths = [];
    if (recoveryAction === "backup-and-overwrite-selected") {
      const eligible = (upgrade.items || []).filter((entry) => entry.recovery_eligible);
      const values = await openPlatformAction({
        title: `恢复 ${item.context?.name || "项目"} 的 Setup`,
        lead: `先备份所选同名能力，再使用当前 ArcOrbit 应用包恢复。备份位置：${upgrade.recovery_root || "由主进程确定"}`,
        confirmLabel: "备份并恢复所选",
        fields: [platformCheckboxGroup("paths", "选择可安全恢复的目标", eligible.map((entry) => ({ value: entry.path, label: entry.name || entry.path, detail: entry.reason || entry.path })))]
      });
      if (!values) return false;
      selectedPaths = Array.isArray(values.paths) ? values.paths : values.paths ? [values.paths] : [];
      if (!selectedPaths.length) throw new Error("请至少选择一个可恢复目标。");
    } else if (!window.confirm("ArcOrbit 会先完整备份当前内容，再按 fresh assessment 恢复此项目的受管理能力。未列出的内容不会改变。是否继续？")) return false;
    state.todaySetupByProject[localProjectId] = await api.recoverSetupUpgrade({ assessmentDigest: upgrade.digest, action: recoveryAction, selectedPaths });
    return true;
  } finally {
    state.todaySetupOperationProjectId = "";
  }
}

async function openTodayProjectCatalog() {
  const selected = new Set((state.platform.today_project_ids || []).map(String));
  const accessibleProjects = (state.platform.projects || []).filter((project) => !selected.has(String(project.id)));
  const sourceField = platformField("source", "项目来源", {
    type: "select",
    value: accessibleProjects.length ? "accessible" : "create_personal",
    options: [
      { value: "accessible", label: "从可访问项目中选择" },
      { value: "create_personal", label: "新建个人项目" },
      { value: "invitation", label: "使用邀请码加入" }
    ]
  });
  const action = openPlatformAction({
    title: "添加项目到 Today",
    lead: "项目会立即进入 Today 的独立配置流程；这里不创建待办，也不修改组织角色或其他设备。",
    confirmLabel: "添加项目",
    fields: [
      sourceField,
      `<div data-today-project-source="accessible">${platformCheckboxGroup("project_ids", "可访问项目（可多选）", accessibleProjects.map((project) => ({ value: project.id, label: project.name, detail: project.organization_id ? organizationName(project.organization_id) : "个人项目" })))}</div>`,
      `<div data-today-project-source="create_personal">${platformField("name", "个人项目名称", { placeholder: "例如：ArcOrbit Desktop" })}${platformField("git_url", "Git 地址", { placeholder: "可选" })}</div>`,
      `<div data-today-project-source="invitation">${platformField("invite_kind", "邀请类型", { type: "select", options: [{ value: "project", label: "项目邀请" }, { value: "organization", label: "组织邀请" }] })}${platformField("invite_code", "邀请码", { placeholder: "输入收到的邀请码" })}</div>`
    ],
    onSubmit: async (values) => {
      const beforeIds = new Set((state.platform.projects || []).map((project) => String(project.id)));
      let addedIds = [];
      if (values.source === "accessible") {
        addedIds = Array.isArray(values.project_ids) ? values.project_ids : values.project_ids ? [values.project_ids] : [];
        if (!addedIds.length) throw new Error("请至少选择一个可访问项目。");
      } else if (values.source === "create_personal") {
        const name = String(values.name || "").trim();
        if (!name) throw new Error("请输入个人项目名称。");
        const created = await executeManagedAction("project.create", { name, git_url: String(values.git_url || "").trim() }, "个人项目已创建", { refresh: false });
        const createdId = String(created?.id || created?.project?.id || "");
        if (createdId) addedIds = [createdId];
      } else {
        const inviteCode = String(values.invite_code || "").trim();
        if (!inviteCode) throw new Error("请输入邀请码。");
        await executeManagedAction(values.invite_kind === "organization" ? "organization.join" : "project.join", { invite_code: inviteCode }, "邀请已确认", { refresh: false });
      }
      if (!addedIds.length) {
        await refreshSnapshot({ quiet: true });
        addedIds = (state.platform.projects || []).map((project) => String(project.id)).filter((id) => !beforeIds.has(id));
      }
      if (!addedIds.length) throw new Error("来源已确认，但未发现新加入的项目；请刷新来源后重试。");
      const nextIds = [...new Set([...selected, ...addedIds.map(String)])];
      await api.setTodayProjects(nextIds);
      state.todayMode = "configuration";
      state.todaySelectedProjectId = addedIds[0];
      state.todaySelectedItemId = "";
      scheduleTodayPreferencePersistence();
      await refreshSnapshot({ quiet: true });
      showToast(`已添加 ${addedIds.length} 个项目；正在分别计算配置状态。`);
      return { close: true };
    }
  });
  const sourceSelect = els.platformActionFields.querySelector('[name="source"]');
  const syncSource = () => {
    const activeSource = sourceSelect?.value || "accessible";
    els.platformActionFields.querySelectorAll("[data-today-project-source]").forEach((section) => {
      const active = section.dataset.todayProjectSource === activeSource;
      section.classList.toggle("hidden", !active);
      section.querySelectorAll("input, select, textarea").forEach((control) => { control.disabled = !active; });
    });
    els.confirmPlatformActionButton.textContent = activeSource === "accessible" ? "添加所选项目" : activeSource === "create_personal" ? "创建并添加" : "加入并添加";
  };
  sourceSelect?.addEventListener("change", syncSource);
  syncSource();
  await action;
}

async function performGuidanceAction(guidance, { task = guidance.task, workspace = guidance.workspace } = {}) {
  switch (guidance.action_id) {
    case "open_auth":
      await openSettings({ loginGate: true });
      return;
    case "open_recovery": showPage("recovery"); return;
    case "open_attention": openWorkbench("intervention"); return;
    case "review_completion": openWorkGuidanceTask(task, "completed"); return;
    case "manage_workset":
      if (state.platform.active_workset) await editCurrentWorkset();
      else showPage("organization");
      return;
    case "bind_workspace": await bindProjectWorkspace(workspace); return;
    case "check_setup": await checkSetupReadinessForSelection(workspace?.local_project_id); return;
    case "enable_project":
      await api.setProjectParticipation(workspace.id, true);
      await refreshSnapshot();
      return;
    case "review_task": openWorkGuidanceTask(task, "pending_review"); return;
    case "create_for_arcorbit": await createTaskForArcOrbit(workspace?.id); return;
    case "enable_automation":
      if (!window.confirm("开始自动执行只开启全局新任务领取；不会修改任务状态、项目授权或停止当前运行。继续吗？")) return;
      await api.setAutomationEnabled(true);
      await refreshSnapshot();
      return;
    case "resume_queue":
      await api.setQueuePaused(false);
      await refreshSnapshot();
      return;
    case "view_automation": showPage("command"); return;
    case "retry_refresh": await refreshSnapshot(); return;
    case "edit_assignee": await editTask(task.id, { focusField: "executor_id" }); return;
    case "confirm_review":
      await executeManagedAction("task.update", { task_id: task.id, state: "pending", expected_state: "pending_review" }, "任务已确认为待处理；正在重新计算执行资格");
      return;
    case "copy_handoff":
      await navigator.clipboard.writeText(`${workspace?.name || task?.project_name || "当前项目"}\n${guidance.title}\n${guidance.reason}\n责任角色：Project owner / admin`);
      showToast("处理说明已复制；ArcOrbit 未发送外部消息。");
      return;
    default: return;
  }
}

function openWorkGuidanceTask(task, targetState = task?.state || "pending") {
  if (task?.project_id) state.selectedProjectId = String(task.project_id);
  if (task?.id) setPlatformTaskSelectionIntent(task.id);
  state.selectedState = targetState;
  state.platformWorkFilter = "";
  state.platformWorkFilters = defaultWorkFilters();
  state.workQueryOffset = 0;
  showPage("work");
}

async function bindProjectWorkspace(workspace, { surface = "setup" } = {}) {
  if (!workspace?.id) throw new Error("未找到要绑定的远端项目。");
  const localProject = await api.pickProject();
  if (!localProject) return;
  await bindAutomationWorkspace(workspace.id, localProject.id, { surface });
  showToast(`${workspace.name || "项目"} 已绑定本地目录；正在使用 fresh 状态计算下一步。`);
}

async function bindAutomationWorkspace(remoteProjectId, localProjectId, { surface = "setup" } = {}) {
  await api.bindAutomationProject(remoteProjectId, localProjectId);
  let setupError = null;
  if (localProjectId) {
    try {
      await checkSetupReadinessForSelection(localProjectId, { presentSetup: surface !== "today" });
    } catch (error) {
      setupError = error;
    }
  }
  await refreshSnapshot({ quiet: true });
  if (setupError) throw setupError;
}

async function createTaskForArcOrbit(defaultProjectId = "") {
  const projects = workspaceOptions().filter((project) => !defaultProjectId || String(project.value) === String(defaultProjectId));
  if (!projects.length) throw new Error("当前没有可由你创建待处理任务的产品。");
  const initialProjectId = defaultProjectId || projects[0].value;
  if (!projectCurrentUserExecutorId(initialProjectId)) {
    throw new Error("无法确认当前用户在所选产品中的执行人身份，请刷新项目后重试。");
  }
  await openPlatformAction({
    title: "创建并交给 ArcOrbit",
    lead: "这是明确的自动执行意图：执行人固定为当前用户，状态固定为待处理。普通 Work 创建仍默认待评审。",
    confirmLabel: "创建并进入待处理",
    fields: [
      platformField("project_id", "产品", { type: "select", required: true, value: initialProjectId, options: projects }),
      platformField("content", "待办内容", { type: "textarea", required: true }),
      platformField("executor", "执行人", { value: `${currentWorkshopUserName()} · 我`, readonly: true }),
      platformField("task_state", "状态", { value: "待处理 · 进入 Automation 候选", readonly: true }),
      platformField("priority", "优先级", { type: "select", value: "", options: taskPriorityOptions() })
    ],
    onSubmit: async (values) => {
      const executorId = projectCurrentUserExecutorId(values.project_id);
      if (!executorId) throw new Error("无法确认当前用户在所选产品中的执行人身份，请刷新项目后重试。");
      const input = { project_id: values.project_id, content: values.content, state: "pending", executor_id: executorId };
      if (values.priority !== "") input.priority = values.priority;
      await executeManagedAction("task.create", input, "待处理任务已创建；正在重新计算下一步", { tolerateRefreshFailure: true });
      return { close: true };
    }
  });
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
  els.organizationContent.innerHTML = `${!personal && scope.project_visibility !== "all_projects" ? `<div class="capability-notice"><strong>当前显示你参与的项目</strong><span>组织全部项目仅 owner/admin 可见。</span></div>` : ""}<div class="organization-detail-grid"><section class="panel-card"><div class="section-title-row"><div><span class="section-icon">▦</span><div><h2>${personal ? "个人与外部参与项目" : "组织项目"}</h2><p>项目治理不受 Workset 过滤</p></div></div><button data-project-create type="button">创建项目</button></div>${projects.length ? `<div class="project-directory">${projects.map((project) => `<button class="project-directory-row ${String(project.id) === String(selected?.id) ? "is-active" : ""}" data-organization-project-open="${escapeHtml(project.id)}" type="button"><span class="product-identity"><i>${escapeHtml(project.name.slice(0, 1).toUpperCase())}</i><span><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.current_user_role || "只读")} · ${project.local_project_path ? "本地已绑定" : "仅远端"}</small></span></span><span class="product-facts"><em>${selectedWorkset.has(String(project.id)) ? "当前 Workset" : "未展示"}</em><em>${project.participating ? "Automation 已授权" : "Automation 未授权"}</em></span></button>`).join("")}</div>` : `<div class="empty-state">当前范围没有可见项目。</div>`}</section><aside class="inspector-card organization-inspector">${selected ? `<p class="eyebrow">PROJECT · ${escapeHtml(selected.current_user_role || "READ ONLY")}</p><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.git_url || "未设置 Git 地址")}</p><div class="project-connection-list"><span><strong>组织归属</strong><small>${escapeHtml(selectedScopeLabel)} · 创建后不可在 ArcOrbit 迁移</small></span><span><strong>本地项目</strong><small>${escapeHtml(selected.local_project_path || "尚未绑定")}</small></span><span><strong>推进范围</strong><small>${selectedWorkset.has(String(selected.id)) ? `已在 ${escapeHtml(state.platform.active_workset?.name || "当前产品集")}` : "当前 Workset 不展示"}</small></span><span><strong>Automation</strong><small>${selected.participating ? "已授权自动领取" : "未授权自动领取"}</small></span></div>${organizationProjectGuidance(selected, canManage)}<div class="row-actions project-detail-actions"><button data-project-workset-toggle="${escapeHtml(selected.id)}" type="button">${selectedWorkset.has(String(selected.id)) ? "移出当前 Workset" : "加入当前 Workset"}</button>${canManage ? `<button data-product-edit="${escapeHtml(selected.id)}" type="button">编辑事实</button><button data-product-invite="${escapeHtml(selected.id)}" type="button">生成项目邀请</button>` : ""}${selected.current_user_role === "owner" ? `<button class="danger-action" data-product-delete="${escapeHtml(selected.id)}" type="button">删除项目</button>` : ""}</div><h3>项目成员 · ${members.length}</h3>${members.length ? `<div class="compact-list">${members.map((member) => { const canEdit = selected.current_user_role === "owner" && member.role !== "owner"; const canRemove = member.is_me || (["owner", "admin"].includes(selected.current_user_role) && member.role !== "owner"); return `<div class="compact-row"><span><strong>${escapeHtml(member.username)}${member.is_me ? " · 我" : ""}</strong><small>${escapeHtml(member.role)} · ${escapeHtml(member.duty || "未填写职责")}${member.is_external ? " · 外部" : ""}</small></span><span class="row-actions">${canEdit ? `<button data-project-member-edit="${escapeHtml(member.id)}" data-member-project="${escapeHtml(selected.id)}" type="button">角色/职责</button>` : ""}${canRemove ? `<button class="danger-action" data-project-member-delete="${escapeHtml(member.id)}" data-member-project="${escapeHtml(selected.id)}" type="button">${member.is_me ? "退出" : "移除"}</button>` : ""}</span></div>`; }).join("")}</div>` : `<div class="empty-state compact">尚无可显示成员。</div>`}` : `<div class="empty-state">选择一个项目查看详情。</div>`}</aside></div>`;
}

function organizationProjectGuidance(project, canManage) {
  if (!project.local_project_path && !project.local_project_id) return `<div class="inline-guidance"><strong>本地连接未完成</strong><p>绑定目录是当前设备上的个人工作区设置，会启用 Chat 和本地 Automation；不会加入 Workset、修改项目成员或授权领取。</p><button class="primary-button" data-organization-bind-workspace="${escapeHtml(project.id)}" type="button">选择本地目录</button></div>`;
  if (!project.participating) return `<div class="inline-guidance"><strong>项目尚未允许自动领取</strong><p>项目目录已绑定；授权只扩大该项目候选范围。</p>${canManage ? `<button class="primary-button" data-organization-enable-project="${escapeHtml(project.id)}" type="button">允许此项目</button>` : `<small>责任角色：Project owner / admin。当前角色 ${escapeHtml(project.current_user_role || "只读")} 无法完成此动作。</small><button class="secondary-button" data-organization-copy-handoff="${escapeHtml(project.id)}" type="button">复制处理说明</button>`}</div>`;
  return `<div class="inline-guidance is-ready"><strong>项目连接已准备</strong><p>本地目录和项目授权已就绪；Workset 仍只控制观察范围。</p></div>`;
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
  els.organizationContent.querySelectorAll("[data-organization-bind-workspace]").forEach((button) => button.addEventListener("click", () => runAction(() => bindProjectWorkspace(findWorkspace(button.dataset.organizationBindWorkspace)))));
  els.organizationContent.querySelectorAll("[data-organization-enable-project]").forEach((button) => button.addEventListener("click", () => runAction(async () => {
    await api.setProjectParticipation(button.dataset.organizationEnableProject, true);
    await refreshSnapshot();
  })));
  els.organizationContent.querySelectorAll("[data-organization-copy-handoff]").forEach((button) => button.addEventListener("click", () => runAction(() => performGuidanceAction({ action_id: "copy_handoff", title: "完成项目连接准备", reason: "需要绑定本地目录或允许项目自动领取。", workspace: findWorkspace(button.dataset.organizationCopyHandoff) }))));
  els.organizationContent.querySelectorAll("[data-organization-member-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editOrganizationMember(button.dataset.organizationMemberEdit, button.dataset.memberOrganization))));
  els.organizationContent.querySelectorAll("[data-organization-member-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteOrganizationMember(button.dataset.organizationMemberDelete, button.dataset.memberOrganization))));
  els.organizationContent.querySelectorAll("[data-project-member-edit]").forEach((button) => button.addEventListener("click", () => runAction(() => editProjectMember(button.dataset.projectMemberEdit, button.dataset.memberProject))));
  els.organizationContent.querySelectorAll("[data-project-member-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteProjectMember(button.dataset.projectMemberDelete, button.dataset.memberProject))));
}

function renderPlatformWork() {
  els.platformWorkFilter.value = state.platformWorkFilter;
  renderWorkFilterControls();
  const projection = state.workQuery.projection || emptyWorkQueryProjection();
  const scopedTasks = (projection.tasks || []).filter(platformItemMatchesSelectedProject);
  const stateCounts = workStateCounts(projection);
  els.workStateFilters.innerHTML = TASK_STATES.map((taskState) => `<button class="work-state-filter ${state.selectedState === taskState ? "is-active" : ""}" data-work-state="${taskState}" type="button" aria-label="${STATE_LABELS[taskState]}，${stateCounts[taskState]} 项" aria-pressed="${state.selectedState === taskState}"><span>${STATE_ICONS[taskState]}</span><strong>${STATE_LABELS[taskState]}</strong><em aria-hidden="true">${stateCounts[taskState]}</em></button>`).join("");
  els.workStateSelect.innerHTML = TASK_STATES.map((taskState) => `<option value="${taskState}" ${state.selectedState === taskState ? "selected" : ""}>${STATE_LABELS[taskState]} · ${stateCounts[taskState]}</option>`).join("");
  const treeSummaries = (projection.task_trees || []).filter(platformItemMatchesSelectedProject);
  const matchedTotal = treeSummaries.reduce((sum, item) => sum + Number(item.matched_total || 0), 0);
  const completedTotal = treeSummaries.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const hasTreeSummary = treeSummaries.length > 0;
  const queryStatus = state.workQuery.loading ? " · 本地查询中" : state.workQuery.error ? " · 本地查询失败，保留匹配结果" : "";
  els.workStateSummary.textContent = `${currentProject()?.name || state.platform.active_workset?.name || "当前产品集"} · 命中 ${hasTreeSummary ? matchedTotal : stateCounts[state.selectedState]} / 补全树 ${hasTreeSummary ? completedTotal : projection.window?.total || scopedTasks.length} · ${STATE_LABELS[state.selectedState]} ${stateCounts[state.selectedState]} 项${queryStatus}`;
  els.workStateFilters.querySelectorAll("[data-work-state]").forEach((button) => button.addEventListener("click", () => openWorkState(button.dataset.workState)));
  const stateTasks = scopedTasks.filter((task) => task.state === state.selectedState);
  const tasks = scopedTasks.some((task) => Number.isInteger(task.tree_depth)) ? scopedTasks : rankTasks(stateTasks);
  if (!tasks.some((task) => String(task.id) === String(state.selectedPlatformTaskId))) state.selectedPlatformTaskId = String(tasks[0]?.id || "");
  const selectedTask = tasks.find((task) => String(task.id) === String(state.selectedPlatformTaskId)) || null;
  const table = tasks.length ? `<table class="data-table platform-work-table"><colgroup><col style="width:90px"><col><col style="width:130px"><col style="width:92px"><col style="width:72px"><col style="width:100px"></colgroup><thead><tr><th>待办</th><th>内容</th><th>产品</th><th>状态</th><th>优先级</th><th>执行人</th></tr></thead><tbody>${tasks.map((task) => { const depth = Math.max(0, Number(task.tree_depth || 0)); const lineageOnly = task.state !== state.selectedState || task.tree_matched === false; const rowContext = [lineageOnly ? "用于补全层级" : "", task.tags ? `标签：${Array.isArray(task.tags) ? task.tags.join(" · ") : task.tags}` : ""].filter(Boolean).join(" · "); return `<tr class="${String(task.id) === state.selectedPlatformTaskId ? "selected" : ""} ${lineageOnly ? "tree-lineage" : ""}" data-platform-task-select="${escapeHtml(task.id)}"><td class="queue-number">${escapeHtml(task.id)}</td><td class="task-title-cell" style="--task-tree-depth:${depth}" title="${escapeHtml(rowContext)}"><span class="task-tree-title">${depth ? "↳ " : ""}${escapeHtml(displayTaskTitle(task))}</span></td><td>${escapeHtml(task.project_name)}</td><td><span class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</span></td><td>${escapeHtml(formatPriority(task.priority))}</td><td>${escapeHtml(taskExecutorName(task))}</td></tr>`; }).join("")}</tbody></table>` : `<div class="empty-state">${state.workQuery.loading ? "正在载入与当前查询匹配的待办…" : state.workQuery.error ? `加载失败：${escapeHtml(state.workQuery.error)}` : "当前产品集或筛选条件下没有待办。"}</div>`;
  const windowInfo = projection.window || { offset: 0, returned: tasks.length, total: tasks.length, has_more: false };
  const previousOffset = Math.max(0, Number(windowInfo.offset || 0) - WORK_QUERY_WINDOW_SIZE);
  const nextOffset = Number(windowInfo.offset || 0) + Number(windowInfo.returned || 0);
  const pager = Number(windowInfo.total || 0) > 0 ? `<div class="work-query-pager"><span>显示 ${Number(windowInfo.offset || 0) + 1}–${Number(windowInfo.offset || 0) + Number(windowInfo.returned || 0)} / ${Number(windowInfo.total || 0)}</span><div><button type="button" data-work-query-offset="${previousOffset}" ${Number(windowInfo.offset || 0) === 0 ? "disabled" : ""}>上一页</button><button type="button" data-work-query-offset="${nextOffset}" ${windowInfo.has_more ? "" : "disabled"}>下一页</button></div></div>` : "";
  els.platformWorkTable.innerHTML = `${table}${pager}`;
  els.platformWorkTable.querySelectorAll("[data-platform-task-select]").forEach((row) => wireSelectableRow(row, {
    selected: String(row.dataset.platformTaskSelect) === String(state.selectedPlatformTaskId)
  }));
  renderPlatformWorkInspector(selectedTask);
}

function workStateCounts(projection) {
  const workspaces = (projection.product_workspaces || []).filter(platformItemMatchesSelectedProject);
  return Object.fromEntries(TASK_STATES.map((taskState) => [
    taskState,
    workspaces.reduce((sum, workspace) => sum + Number(workspace.task_counts?.[taskState] || 0), 0)
  ]));
}

function renderWorkFilterControls() {
  const selectedProjectIds = new Set((state.selectedProjectId === "all" ? state.platform.active_workset?.project_ids || [] : [state.selectedProjectId]).map(String));
  const members = (state.platform.members || []).filter((item) => selectedProjectIds.has(String(item.project_id)));
  const uniqueMembers = [...new Map(members.map((item) => [String(item.user_id), item])).values()];
  const memberOptions = uniqueMembers.map((item) => ({ value: item.user_id, label: memberName(item) }));
  const queryTags = state.workQuery.projection?.tags || [];
  const tags = (queryTags.length > 0 ? queryTags : state.platform.tags || []).filter((item) => selectedProjectIds.has(String(item.project_id)));
  setMultiSelectOptions(els.workCreatorFilter, memberOptions, state.platformWorkFilters.creator_ids);
  setMultiSelectOptions(els.workExecutorFilter, memberOptions, state.platformWorkFilters.executor_ids);
  setMultiSelectOptions(els.workTagFilter, tags.map((item) => ({ value: item.id, label: `${item.project_name || "产品"} · ${parseWorkshopTag(item.name).displayName}` })), state.platformWorkFilters.tag_ids);
  setMultiSelectOptions(els.workPriorityFilter, [
    { value: "0", label: "最高" }, { value: "1", label: "高" }, { value: "2", label: "中" }, { value: "3", label: "低" }
  ], state.platformWorkFilters.priorities);
  els.workStartDateFilter.value = state.platformWorkFilters.start_time;
  els.workEndDateFilter.value = state.platformWorkFilters.end_time;
  renderWorkFilterSummaries();
}

function positionWorkFilterPopover(menu) {
  if (!menu?.open) return;
  window.requestAnimationFrame(() => {
    if (!menu.open) return;
    const trigger = menu.querySelector("summary");
    const popover = menu.querySelector(".work-filter-popover");
    if (!trigger || !popover) return;
    const viewportMargin = 12;
    const triggerGap = 5;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const width = Math.min(popoverRect.width, Math.max(0, viewportWidth - (viewportMargin * 2)));
    const maxLeft = Math.max(viewportMargin, viewportWidth - viewportMargin - width);
    const left = Math.min(maxLeft, Math.max(viewportMargin, triggerRect.right - width));
    const preferredHeight = Math.min(popover.scrollHeight, 520);
    const availableBelow = Math.max(0, viewportHeight - triggerRect.bottom - triggerGap - viewportMargin);
    const availableAbove = Math.max(0, triggerRect.top - triggerGap - viewportMargin);
    const placeAbove = availableBelow < Math.min(preferredHeight, 260) && availableAbove > availableBelow;
    const availableHeight = Math.max(80, placeAbove ? availableAbove : availableBelow);
    const renderedHeight = Math.min(preferredHeight, availableHeight);
    const top = placeAbove
      ? Math.max(viewportMargin, triggerRect.top - triggerGap - renderedHeight)
      : Math.min(viewportHeight - viewportMargin - renderedHeight, triggerRect.bottom + triggerGap);
    popover.style.setProperty("--work-filter-popover-left", `${left}px`);
    popover.style.setProperty("--work-filter-popover-top", `${Math.max(viewportMargin, top)}px`);
    popover.style.setProperty("--work-filter-popover-max-height", `${availableHeight}px`);
  });
}

function setMultiSelectOptions(element, options, selectedValues) {
  const selected = new Set((selectedValues || []).map(String));
  element.innerHTML = options.length
    ? options.map((option) => `<label class="work-filter-option"><input type="checkbox" value="${escapeHtml(option.value)}" ${selected.has(String(option.value)) ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`).join("")
    : `<span class="work-filter-empty">当前范围没有可选项</span>`;
}

function renderWorkFilterSummaries() {
  const selectedCount = [els.workCreatorFilter, els.workExecutorFilter, els.workTagFilter, els.workPriorityFilter]
    .reduce((total, element) => total + element.querySelectorAll('input[type="checkbox"]:checked').length, 0);
  const dateCount = Number(Boolean(els.workStartDateFilter.value)) + Number(Boolean(els.workEndDateFilter.value));
  const total = selectedCount + dateCount;
  els.workFilterSummary.textContent = total ? `${total} 项` : "全部";
}

function workInspectorRuntimeContext(taskId) {
  const activeExecutions = (state.snapshot.active_executions || []).filter((execution) => String(execution.task_id) === String(taskId));
  const completion = (state.snapshot.recent_completions || []).find((item) => String(item.task_id) === String(taskId)) || null;
  return { activeExecutions, completion };
}

function workInspectorRuntimeSummary(taskId) {
  const { activeExecutions, completion } = workInspectorRuntimeContext(taskId);
  if (activeExecutions.length > 1) return `${activeExecutions.length} 个活动 Runtime · 需要恢复`;
  if (activeExecutions.length === 1) {
    const execution = activeExecutions[0];
    const runtimeRef = execution.run_id || execution.case_id || execution.execution_id;
    return runtimeRef
      ? `${runtimeRef} · ${automationPhaseLabel(execution.phase)}`
      : `正在启动 · ${automationPhaseLabel(execution.phase)}`;
  }
  return completion?.run_id ? `${completion.run_id} · 已完成` : "未关联";
}

function workInspectorRuntimeNavigation(task, automationTask, workspace) {
  const { activeExecutions } = workInspectorRuntimeContext(task.id);
  const workspaceValid = Boolean(automationTask?.local_project_path || workspace?.local_project_path);
  return activeExecutions.length === 1 && workspaceValid
    ? { destination: "runtime", execution: activeExecutions[0] }
    : { destination: "recovery", execution: null };
}

function renderPlatformWorkInspector(task) {
  if (!task) {
    updatePlatformWorkInspector("", `<div class="empty-state">选择待办查看详情与允许操作。</div>`);
    return;
  }
  const workspace = state.platform.product_workspaces.find((item) => String(item.id) === String(task.project_id));
  const automationTask = state.snapshot.tasks.find((item) => String(item.id) === String(task.id)) || null;
  const feedbackItems = automationTask?.acceptance_feedback_items || [];
  const canManage = canManagePlatformTask(task);
  const eligibilityGuidance = deriveWorkEligibilityGuidance({
    task,
    workspace,
    automationTask,
    currentUserId: projectCurrentUserExecutorId(task.project_id),
    canManageTask: canManage,
    errors: state.platform.errors
  });
  const inspectorActions = workInspectorActions(task, automationTask, workspace, canManage);
  const replacement = (state.platform.task_replacements || []).find((item) => (
    String(item.source_task_id) === String(task.id) || String(item.target_task_id) === String(task.id)
  ));
  const replacementRecovery = replacement
    ? `<div class="feedback-link-recovery task-replacement-recovery"><span><strong>目标待办 ${escapeHtml(replacement.target_task_id)} 已创建，源待办 ${escapeHtml(replacement.source_task_id)} 尚未删除</strong><small>${escapeHtml(replacement.error || "可以安全重试删除源待办，或明确保留两条待办。重试不会再次创建目标待办。")}</small></span><span class="task-replacement-recovery-actions"><button class="primary-button" data-task-replacement-retry="${escapeHtml(replacement.id)}" type="button">重试删除源待办</button><button class="secondary-button" data-task-replacement-keep="${escapeHtml(replacement.id)}" type="button">保留两者</button></span></div>`
    : "";
  const acceptanceFeedback = automationTask?.state === "completed" ? `<section class="acceptance-feedback-panel"><div class="section-title-row"><div><h3>验收问题与进展</h3><p>${feedbackItems.length} 项验收问题</p></div></div><div class="acceptance-feedback-list">${feedbackItems.length ? feedbackItems.map((item) => `<button class="acceptance-feedback-item" data-work-task-feedback="${escapeHtml(item.feedback_id)}" type="button"><span><strong>${escapeHtml(item.original_feedback)}</strong><small>${escapeHtml(item.feedback_id)} · ${escapeHtml(item.progress)}</small></span><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></button>`).join("") : `<div class="empty-state compact">尚未发现验收问题。</div>`}</div><label class="acceptance-feedback-composer"><span>提出验收问题</span><textarea id="workAcceptanceFeedbackInput" rows="3" placeholder="描述验收中发现的问题…"></textarea><small>待办保持已完成；问题进入 Automation 独立队列并复用同一 Agent 对话。</small><button id="submitWorkAcceptanceFeedbackButton" class="primary-button" type="button">提出验收问题</button></label></section>` : automationTask?.state === "accepted" ? `<section class="acceptance-feedback-panel acceptance-clear"><div class="section-title-row"><div><h3>验收通过</h3><p>当前没有待处理的验收问题</p></div></div><div class="empty-state compact">该待办已验收，不再接受新的验收问题。</div></section>` : "";
  const inspectorHtml = `<section class="work-inspector-section work-inspector-identity"><div class="work-inspector-identity-row"><div class="work-inspector-identity-copy"><h2>待办 ${escapeHtml(task.id)}</h2><p class="work-inspector-identity-product">${escapeHtml(task.project_name || projectName(task.project_id))}</p></div><span class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</span></div>${replacementRecovery}${renderInlineGuidance(eligibilityGuidance)}${inspectorActions.length ? `<div class="task-actions platform-work-state-actions">${inspectorActions.map((action) => `<button class="${action.primary ? "primary-button" : "secondary-button"}" data-work-task-action="${action.id}" type="button">${action.label}</button>`).join("")}</div>` : ""}</section><section class="work-inspector-section work-inspector-content"><div class="work-inspector-section-heading"><h3>内容</h3></div><article class="task-markdown-detail">${renderRestrictedMarkdown(task.content)}</article></section><section class="work-inspector-section work-inspector-properties"><div class="work-inspector-section-heading"><h3>属性</h3></div><div class="work-inspector-facts">${factRows([
    ["待办标识", task.id],
    ["创建人", taskCreatorName(task)],
    ["执行人", taskExecutorName(task)],
    ["优先级", formatPriority(task.priority)],
    ["标签", taskTagNames(task), { wide: true }],
    ["父待办", task.father_id || "无"],
    ["创建时间", formatDateTime(task.created_at)],
    ["更新时间", formatDateTime(task.updated_at)],
    ["完成时间", task.completion_at ? formatDateTime(task.completion_at) : "未完成"],
    ["本地工作区", automationTask?.local_project_path || workspace?.local_path || "未绑定", { wide: true }],
    ["自动执行资格", automationTask ? (automationTask.eligible ? `队列第 ${automationTask.queue_position} 项` : automationTask.eligibility_reason || "不适用于当前状态") : "不在当前用户 Automation 范围", { wide: true }],
    ["关联 Runtime", workInspectorRuntimeSummary(task.id), { wide: true }]
  ])}</div></section><section class="work-inspector-section work-inspector-collaboration"><div class="work-inspector-section-heading"><h3>协作</h3></div><div class="task-actions platform-work-management"><button class="secondary-button" data-work-inspector-copy-reference="${escapeHtml(task.id)}" type="button">复制任务引用</button>${canManage ? `<button class="secondary-button" data-work-inspector-edit="${escapeHtml(task.id)}" type="button">编辑</button><button class="secondary-button" data-work-inspector-subtask="${escapeHtml(task.id)}" type="button">创建子待办</button><button class="secondary-button" data-work-inspector-reparent="${escapeHtml(task.id)}" type="button">调整父待办</button>` : ""}<button class="secondary-button" data-work-inspector-attachment="${escapeHtml(task.id)}" type="button">管理附件</button>${canManage ? `<button class="secondary-button danger-action" data-work-inspector-delete="${escapeHtml(task.id)}" type="button">删除</button>` : ""}</div>${taskAttachmentPanel(task)}</section>${acceptanceFeedback}`;
  if (!updatePlatformWorkInspector(String(task.id), inspectorHtml)) {
    if (!state.platformTaskAttachments[String(task.id)]) loadTaskAttachments(task.id);
    else loadMissingTaskAttachmentPreviews(task);
    return;
  }
  els.platformWorkInspector.querySelector("[data-work-inspector-copy-reference]")?.addEventListener("click", () => runAction(() => copyWorkTaskReference(task)));
  els.platformWorkInspector.querySelector("[data-guidance-action]")?.addEventListener("click", () => runAction(() => performGuidanceAction(eligibilityGuidance, { task, workspace })));
  els.platformWorkInspector.querySelectorAll("[data-task-markdown-external-link]").forEach((button) => button.addEventListener("click", () => runAction(() => api.openWorkExternalLink(button.dataset.taskMarkdownExternalLink))));
  els.platformWorkInspector.querySelector("[data-work-inspector-edit]")?.addEventListener("click", () => runAction(() => editTask(task.id)));
  els.platformWorkInspector.querySelector("[data-work-inspector-subtask]")?.addEventListener("click", () => runAction(() => createSubtask(task.id)));
  els.platformWorkInspector.querySelector("[data-work-inspector-reparent]")?.addEventListener("click", () => runAction(() => reparentTask(task.id)));
  els.platformWorkInspector.querySelector("[data-work-inspector-attachment]")?.addEventListener("click", () => runAction(() => manageTaskAttachments(task.id)));
  els.platformWorkInspector.querySelector("[data-task-attachment-retry]")?.addEventListener("click", () => loadTaskAttachments(task.id));
  els.platformWorkInspector.querySelector("[data-work-inspector-delete]")?.addEventListener("click", () => runAction(() => deleteTask(task.id)));
  els.platformWorkInspector.querySelector("[data-task-replacement-retry]")?.addEventListener("click", (event) => runAction(() => retryTaskProjectReplacement(event.currentTarget.dataset.taskReplacementRetry)));
  els.platformWorkInspector.querySelector("[data-task-replacement-keep]")?.addEventListener("click", (event) => runAction(() => keepTaskProjectReplacement(event.currentTarget.dataset.taskReplacementKeep)));
  els.platformWorkInspector.querySelectorAll("[data-work-task-action]").forEach((button) => button.addEventListener("click", () => runAction(() => executeWorkTaskAction(task, automationTask, workspace, button.dataset.workTaskAction))));
  els.platformWorkInspector.querySelector("[data-task-comment-submit]")?.addEventListener("click", () => runAction(() => createTaskComment(task.id)));
  els.platformWorkInspector.querySelector("[data-task-comment-add-link]")?.addEventListener("click", () => runAction(() => addTaskCommentLink(task.id)));
  els.platformWorkInspector.querySelector("[data-task-comment-add-image]")?.addEventListener("click", () => runAction(() => pickTaskCommentResource(task, "image")));
  els.platformWorkInspector.querySelector("[data-task-comment-add-file]")?.addEventListener("click", () => runAction(() => pickTaskCommentResource(task, "file")));
  els.platformWorkInspector.querySelectorAll("[data-task-comment-resource-remove]").forEach((button) => button.addEventListener("click", () => removeTaskCommentResource(task.id, button.dataset.taskCommentResourceRemove)));
  els.platformWorkInspector.querySelectorAll("[data-task-attachment-image]").forEach((button) => button.addEventListener("click", () => runAction(() => api.openImageViewer(taskAttachmentResourceInput(button)))));
  els.platformWorkInspector.querySelectorAll("[data-task-attachment-image-retry]").forEach((button) => button.addEventListener("click", () => queueTaskAttachmentPreview(taskAttachmentResourceInput(button), { force: true })));
  els.platformWorkInspector.querySelectorAll("[data-task-attachment-file]").forEach((button) => button.addEventListener("click", () => runAction(() => api.openWorkTaskAttachment(taskAttachmentResourceInput(button)))));
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
  if (!state.platformTaskAttachments[String(task.id)]) loadTaskAttachments(task.id);
  else loadMissingTaskAttachmentPreviews(task);
}

function renderInlineGuidance(guidance) {
  const button = guidance.action_id
    ? `<button class="${guidance.tone === "info" ? "secondary-button" : "primary-button"}" data-guidance-action="${escapeHtml(guidance.action_id)}" type="button">${escapeHtml(guidance.action_label)}</button>`
    : "";
  return `<section class="inline-guidance ${guidance.tone === "info" ? "is-ready" : ""}"><strong>${escapeHtml(guidance.title)}</strong><p>${escapeHtml(guidance.reason)}</p>${guidance.responsibility === "project_admin" ? `<small>责任角色：Project owner / admin。不会展示必然失败的修改按钮。</small>` : ""}${button}</section>`;
}

function updatePlatformWorkInspector(taskId, html) {
  const sameTask = platformWorkInspectorRender.taskId === taskId;
  if (sameTask && platformWorkInspectorRender.html === html) return false;
  const preservedEditors = sameTask
    ? ["[data-task-comment-input]", "#workAcceptanceFeedbackInput"]
      .map((selector) => [selector, els.platformWorkInspector.querySelector(selector)])
      .filter(([, editor]) => editor)
    : [];
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const [selector, editor] of preservedEditors) {
    template.content.querySelector(selector)?.replaceWith(editor);
  }
  els.platformWorkInspector.replaceChildren(template.content);
  platformWorkInspectorRender = { taskId, html };
  return true;
}

function taskCreatorName(task) {
  if (task.creator?.username || task.creator?.name) return task.creator.username || task.creator.name;
  const member = (state.platform.members || []).find((item) => String(item.project_id) === String(task.project_id) && String(item.user_id) === String(task.creator_id));
  return member?.username || member?.name || task.creator_id || "未知";
}

function taskTagNames(task) {
  const values = Array.isArray(task.tags) ? task.tags : String(task.tags || "").split(",");
  const projectTags = (state.platform.tags || []).filter((item) => String(item.project_id) === String(task.project_id));
  const names = values.map((value) => String(value).trim()).filter(Boolean).map((value) => {
    const tag = projectTags.find((item) => String(item.id) === value);
    return parseWorkshopTag(tag?.name || value).displayName;
  });
  return names.length ? names.join("、") : "无";
}

async function copyWorkTaskReference(task) {
  await navigator.clipboard.writeText(workTaskReference(task));
  showToast("任务引用已复制，可恢复同一产品和待办上下文。");
}

async function openWorkTaskReference() {
  const reference = window.prompt("粘贴 ArcOrbit 任务引用");
  if (reference === null) return;
  const platform = await api.platformSnapshot({
    sections: ["tasks"],
    task_filters: { tree: false, states: TASK_STATES }
  });
  const target = resolveWorkTaskReference(reference, platform);
  const createdDate = dateInputValue(target.created_at);
  const previous = {
    page: state.page,
    selectedProjectId: state.selectedProjectId,
    selectedState: state.selectedState,
    selectedPlatformTaskId: state.selectedPlatformTaskId,
    platformWorkFilter: state.platformWorkFilter,
    platformWorkFilters: state.platformWorkFilters
  };
  try {
    markPlatformTaskSelectionIntent();
    Object.assign(state, workTaskReferenceSelection(target));
    state.platformWorkFilter = "";
    state.platformWorkFilters = {
      ...defaultWorkFilters(),
      ...(createdDate ? { start_time: createdDate, end_time: createdDate } : {})
    };
    await refreshSnapshot();
    const restored = state.platform.tasks.some((task) => String(task.project_id) === target.project_id && String(task.id) === target.task_id);
    if (!restored) throw new Error("引用待办已不可见，请刷新后重试。");
    showToast(`已恢复 ${projectName(target.project_id)} 的待办 ${target.task_id}。`);
  } catch (error) {
    Object.assign(state, previous);
    await refreshSnapshot({ quiet: true }).catch(() => render());
    throw error;
  }
}

function taskAttachmentPanel(task) {
  const record = state.platformTaskAttachments[String(task.id)];
  if (!record || record.status === "loading") return `<section class="task-comment-panel"><h3>评论与附件</h3><div class="empty-state compact">正在载入时间线…</div></section>`;
  if (record.status === "error") return `<section class="task-comment-panel"><h3>评论与附件</h3><div class="platform-error"><span>${escapeHtml(record.error)}</span></div><button class="secondary-button" data-task-attachment-retry="${escapeHtml(task.id)}" type="button">重试</button></section>`;
  const items = [...record.items].sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)));
  const pending = state.pendingTaskCommentResources[String(task.id)] || [];
  return `<section class="task-comment-panel"><div class="section-title-row"><div><h3>评论与附件</h3><p>${items.length} 条 TaskAttachment 记录</p></div></div><div class="task-comment-timeline">${items.length ? items.map((item) => taskAttachmentItem(task, item)).join("") : `<div class="empty-state compact">还没有评论或附件。</div>`}</div><label class="task-comment-composer"><span>新增评论</span><textarea data-task-comment-input rows="3" placeholder="记录进展、问题或协作说明；链接、图片和文件会保留其类型…"></textarea>${pending.length ? `<div class="task-comment-pending-resources">${pending.map((resource, index) => `<span>${resource.kind === "image" ? "图片" : "文件"} · ${escapeHtml(resource.file_name || taskAttachmentFileName(resource.object_key))}<button type="button" data-task-comment-resource-remove="${index}" aria-label="移除资源">×</button></span>`).join("")}</div>` : ""}<div class="task-comment-composer-actions"><span><button class="secondary-button" data-task-comment-add-link type="button">添加链接</button><button class="secondary-button" data-task-comment-add-image type="button">添加图片</button><button class="secondary-button" data-task-comment-add-file type="button">添加文件</button></span><button class="primary-button" data-task-comment-submit type="button">发表评论</button></div></label></section>`;
}

function taskAttachmentItem(task, item) {
  let parsed;
  try {
    parsed = parseTaskAttachmentContent(item);
  } catch {
    return `<article class="task-comment-item text"><header><strong>无法解析的记录</strong><time>${escapeHtml(formatTime(item.created_at || item.updated_at))}</time></header><p>${escapeHtml(item.content)}</p></article>`;
  }
  const resourceInput = (key) => `data-task-id="${escapeHtml(task.id)}" data-attachment-id="${escapeHtml(item.id)}" data-object-key="${escapeHtml(key)}"`;
  const images = parsed.images.map((key) => {
    const preview = state.platformTaskAttachmentPreviews[taskAttachmentPreviewKey(task.id, item.id, key)];
    if (preview?.status === "loaded") return `<button class="task-comment-image is-loaded" type="button" data-task-attachment-image ${resourceInput(key)} title="在独立窗口中浏览"><img src="${escapeHtml(preview.data_url)}" alt="${escapeHtml(taskAttachmentFileName(key))}"></button>`;
    if (preview?.status === "error") return `<button class="task-comment-image is-error" type="button" data-task-attachment-image-retry ${resourceInput(key)}>加载失败 · 重试<br><small>${escapeHtml(preview.error)}</small></button>`;
    return `<div class="task-comment-image is-loading" role="status">正在加载图片 · ${escapeHtml(taskAttachmentFileName(key))}</div>`;
  }).join("");
  const files = parsed.files.map((key) => `<button class="task-comment-file" type="button" data-task-attachment-file ${resourceInput(key)}>下载文件 · ${escapeHtml(taskAttachmentFileName(key))}</button>`).join("");
  const body = parsed.text ? `<div class="task-comment-body task-markdown">${renderRestrictedMarkdown(taskCommentTextToMarkdown(parsed.text))}</div>` : "";
  const url = parsed.external_url ? `<button class="task-markdown-link task-comment-url" type="button" data-task-markdown-external-link="${escapeHtml(parsed.external_url)}">${escapeHtml(parsed.external_url)}</button>` : "";
  return `<article class="task-comment-item ${escapeHtml(parsed.type)}"><header><strong>${escapeHtml(taskAttachmentCreatorName(task, item))} · ${parsed.type === "text" ? "评论" : parsed.type === "url" ? "链接" : "文件"}</strong><time>${escapeHtml(formatTime(item.created_at || item.updated_at))}</time></header>${images ? `<div class="task-comment-images">${images}</div>` : ""}${body}${url}${files ? `<div class="task-comment-files">${files}</div>` : ""}</article>`;
}

function taskAttachmentCreatorName(task, item) {
  const member = (state.platform.members || []).find((entry) => String(entry.project_id) === String(task.project_id) && String(entry.user_id) === String(item.creator_id));
  return member?.username || member?.name || (isCurrentProjectUser(item.creator_id, projectCurrentUserExecutorId(task.project_id)) ? "我" : `成员 ${item.creator_id || "未知"}`);
}

async function loadTaskAttachments(taskId) {
  const key = String(taskId);
  const request = captureTaskAttachmentRequest(state);
  state.platformTaskAttachments[key] = { status: "loading", items: [], error: "" };
  try {
    const items = await api.executePlatformAction("task.attachments.list", { task_id: taskId });
    if (!isTaskAttachmentRequestCurrent(state, request)) return;
    state.platformTaskAttachments[key] = { status: "loaded", items: items || [], error: "" };
  } catch (error) {
    if (!isTaskAttachmentRequestCurrent(state, request)) return;
    state.platformTaskAttachments[key] = { status: "error", items: [], error: error?.message || String(error) };
  }
  if (String(state.selectedPlatformTaskId) === key) renderPlatformWorkInspector(findPlatformTask(key));
}

async function createTaskComment(taskId) {
  const request = captureTaskAttachmentRequest(state, { identityOnly: true });
  const input = els.platformWorkInspector.querySelector("[data-task-comment-input]");
  const pending = state.pendingTaskCommentResources[String(taskId)] || [];
  const content = buildTaskCommentContent({
    text: String(input?.value || ""),
    images: pending.filter((item) => item.kind === "image").map((item) => item.object_key),
    files: pending.filter((item) => item.kind === "file").map((item) => item.object_key)
  });
  await executeManagedAction("task.attachment.create", { task_id: taskId, type: "text", content }, "评论已发表", { refresh: false });
  if (!isTaskAttachmentRequestCurrent(state, request)) return;
  if (input) input.value = "";
  delete state.pendingTaskCommentResources[String(taskId)];
  delete state.platformTaskAttachments[String(taskId)];
  await loadTaskAttachments(taskId);
}

async function addTaskCommentLink(taskId) {
  const input = els.platformWorkInspector.querySelector("[data-task-comment-input]");
  const value = window.prompt("输入要添加的 http、https 或 mailto 链接：", "https://");
  if (value === null) return;
  const url = normalizeTaskAttachmentUrl(value);
  const label = window.prompt("链接显示名称（可留空）：", "")?.trim() || url;
  input.value = `${input.value.trim()}${input.value.trim() ? " " : ""}[link](${url}|${label.replace(/[|)]/g, "")})`;
  input.focus();
}

async function pickTaskCommentResource(task, kind) {
  const request = captureTaskAttachmentRequest(state, { identityOnly: true });
  const resource = await api.pickWorkTaskAttachment({ project_id: task.project_id, task_id: task.id, kind });
  if (!resource || !isTaskAttachmentRequestCurrent(state, request)) return;
  const key = String(task.id);
  state.pendingTaskCommentResources[key] = [...(state.pendingTaskCommentResources[key] || []), resource];
  renderPlatformWorkInspector(task);
}

function removeTaskCommentResource(taskId, index) {
  const key = String(taskId);
  state.pendingTaskCommentResources[key] = (state.pendingTaskCommentResources[key] || []).filter((_item, itemIndex) => itemIndex !== Number(index));
  renderPlatformWorkInspector(findPlatformTask(taskId));
}

function loadMissingTaskAttachmentPreviews(task) {
  const record = state.platformTaskAttachments[String(task.id)];
  if (record?.status !== "loaded") return;
  for (const item of record.items || []) {
    let parsed;
    try { parsed = parseTaskAttachmentContent(item); } catch { continue; }
    for (const objectKey of parsed.images) {
      queueTaskAttachmentPreview({ task_id: task.id, attachment_id: item.id, object_key: objectKey });
    }
  }
}

function queueTaskAttachmentPreview(input, { force = false } = {}) {
  const key = taskAttachmentPreviewKey(input.task_id, input.attachment_id, input.object_key);
  const existing = state.platformTaskAttachmentPreviews[key];
  if (!force && ["loading", "loaded"].includes(existing?.status)) return;
  state.platformTaskAttachmentPreviews[key] = { status: "loading", data_url: "", error: "" };
  taskAttachmentPreviewQueue.push({ input, key, request: captureTaskAttachmentRequest(state) });
  if (String(state.selectedPlatformTaskId) === String(input.task_id)) renderPlatformWorkInspector(findPlatformTask(input.task_id));
  pumpTaskAttachmentPreviewQueue();
}

function pumpTaskAttachmentPreviewQueue() {
  while (activeTaskAttachmentPreviews < TASK_ATTACHMENT_PREVIEW_CONCURRENCY && taskAttachmentPreviewQueue.length > 0) {
    const job = taskAttachmentPreviewQueue.shift();
    activeTaskAttachmentPreviews += 1;
    api.previewWorkTaskAttachment(job.input).then((result) => {
      if (!isTaskAttachmentRequestCurrent(state, job.request)) return;
      state.platformTaskAttachmentPreviews[job.key] = { status: "loaded", data_url: result.data_url, error: "" };
    }).catch((error) => {
      if (!isTaskAttachmentRequestCurrent(state, job.request)) return;
      state.platformTaskAttachmentPreviews[job.key] = { status: "error", data_url: "", error: error?.message || "评论图片不可用。" };
    }).finally(() => {
      activeTaskAttachmentPreviews -= 1;
      if (isTaskAttachmentRequestCurrent(state, job.request) && String(state.selectedPlatformTaskId) === String(job.input.task_id)) {
        renderPlatformWorkInspector(findPlatformTask(job.input.task_id));
      }
      pumpTaskAttachmentPreviewQueue();
    });
  }
}

function taskAttachmentResourceInput(button) {
  return { source: "work-task", task_id: button.dataset.taskId, attachment_id: button.dataset.attachmentId, object_key: button.dataset.objectKey };
}

function taskAttachmentPreviewKey(taskId, attachmentId, objectKey) {
  return `${taskId}:${attachmentId}:${objectKey}`;
}

function renderPlatformFeedback() {
  els.feedbackSearchInput.value = state.feedbackFilter;
  els.feedbackStateFilter.value = state.feedbackState;
  els.feedbackSortSelect.value = state.feedbackSort;
  const scoped = (state.platform.feedback_v1 || []).filter(platformItemMatchesSelectedProject);
  const filtered = scoped.filter((item) => {
    const haystack = [item.short_id, item.title, item.content, item.custom_user_id, item.user_phone, item.user_email, item.project_name].join(" ").toLowerCase();
    return (!state.feedbackFilter || haystack.includes(state.feedbackFilter))
      && (state.feedbackState === "all" || feedbackProcessingState(item) === state.feedbackState);
  });
  const ordinary = [...filtered].sort(compareFeedbackItems);
  if (!ordinary.some((item) => String(item.id) === String(state.selectedFeedbackId))) state.selectedFeedbackId = String(ordinary[0]?.id || "");
  const selected = ordinary.find((item) => String(item.id) === String(state.selectedFeedbackId)) || null;
  const managementUnread = (state.platform.product_workspaces || []).filter(platformItemMatchesSelectedProject).reduce((total, workspace) => total + Number(workspace.feedback_management?.unread_count || 0), 0);
  els.feedbackListSummary.textContent = `${filtered.length === scoped.length ? `${scoped.length} 条` : `${filtered.length} / ${scoped.length} 条`}${managementUnread ? ` · ${managementUnread} 未读` : ""}`;
  els.ordinaryFeedbackTable.innerHTML = ordinary.length ? ordinary.map((item) => {
    const processingState = feedbackProcessingState(item);
    const workspace = feedbackWorkspace(item);
    const unread = workspace?.feedback_management?.unread_feedback_ids?.map(String).includes(String(item.id));
    return `<button class="feedback-list-item ${String(item.id) === state.selectedFeedbackId ? "is-active" : ""}" data-feedback-select="${escapeHtml(item.id)}" type="button"><span class="feedback-list-copy"><strong>${unread ? `<i class="feedback-unread-dot" aria-label="有未读回复"></i>` : ""}${escapeHtml(item.title || feedbackExcerpt(item.content) || "未命名反馈")}</strong><small>${escapeHtml(item.short_id || item.id)} · ${escapeHtml(item.project_name || "未知产品")}</small></span><span class="feedback-list-meta"><em class="feedback-priority ${item.priority ? "has-priority" : ""}">${escapeHtml(item.priority || "未定级")}</em><span class="status-pill ${escapeHtml(processingState)}">${escapeHtml(FEEDBACK_STATE_LABELS[processingState])}</span><time>${escapeHtml(formatFeedbackDate(item.created_at || item.updated_at))}</time></span></button>`;
  }).join("") : `<div class="empty-state">${scoped.length ? "没有符合搜索或筛选条件的反馈。" : "当前产品集没有用户反馈。"}</div>`;
  els.ordinaryFeedbackTable.querySelectorAll("[data-feedback-select]").forEach((button) => button.addEventListener("click", () => {
    state.selectedFeedbackId = button.dataset.feedbackSelect;
    renderPlatformFeedback();
  }));
  renderFeedbackInspector(selected);
}

function renderFeedbackInspector(feedback) {
  const currentScroll = els.feedbackInspector.querySelector(".feedback-inspector-scroll");
  const previousScrollTop = feedback && currentScroll?.dataset.feedbackId === String(feedback.id) ? currentScroll.scrollTop : 0;
  if (!feedback) {
    els.feedbackInspector.innerHTML = `<div class="feedback-inspector-scroll"><div class="empty-panel"><strong>选择一条反馈</strong><p>右侧将显示不可编辑的用户反馈事实和可用处理动作。</p></div></div>`;
    return;
  }
  const workspace = state.platform.product_workspaces.find((item) => String(item.id) === String(feedback.project_id));
  const feedbackManagement = workspace?.feedback_management || { status: "unavailable", features: {}, errors: {} };
  const useV2 = feedback.feedback_source === "v2" && ["available", "degraded"].includes(feedbackManagement.status);
  const canDelete = ["owner", "admin"].includes(workspace?.current_user_role);
  if (feedback.linked_task_id) delete state.feedbackLinkRecoveries[String(feedback.id)];
  const linkRecovery = state.feedbackLinkRecoveries[String(feedback.id)] || null;
  const processingState = feedbackProcessingState(feedback);
  const attachment = feedback.file ? renderFeedbackFile(feedback) : `<span class="muted-copy">没有附件</span>`;
  const priorityAction = feedback.linked_task_id
    ? `<div class="feedback-priority-readonly"><span>优先级</span><strong>${escapeHtml(feedback.priority || "P2")}</strong><small>已转为待办，请在 Work 中继续调整。</small></div>`
    : `<label><span>优先级</span><select data-feedback-priority="${escapeHtml(feedback.id)}">${["P1", "P2", "P3"].map((value) => `<option value="${value}" ${feedback.priority === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;
  const recoveryNotice = linkRecovery && !feedback.linked_task_id
    ? `<div class="feedback-link-recovery"><span><strong>待办 ${escapeHtml(linkRecovery.task_id)} 已创建，但尚未关联</strong><small>重试只会保存当前反馈与该待办的关联，不会创建新待办。</small></span><button class="primary-button" data-feedback-link-retry type="button">仅重试关联</button></div>`
    : "";
  els.feedbackInspector.innerHTML = `<div class="feedback-inspector-scroll" data-feedback-id="${escapeHtml(feedback.id)}"><div class="feedback-inspector-header"><div><p class="eyebrow">${escapeHtml(feedback.short_id || feedback.id)}</p><h2>${escapeHtml(feedback.title || "用户反馈")}</h2><p>${escapeHtml(feedback.project_name || "未知产品")}</p></div><span class="status-pill ${escapeHtml(processingState)}">${escapeHtml(FEEDBACK_STATE_LABELS[processingState])}</span></div>${recoveryNotice}<div class="feedback-processing-actions">${priorityAction}${!feedback.ignored && !feedback.linked_task_id ? `<button class="secondary-button" data-feedback-ignore="${escapeHtml(feedback.id)}" type="button">忽略</button>` : ""}${feedback.ignored && !feedback.linked_task_id ? `<button class="secondary-button" data-feedback-restore="${escapeHtml(feedback.id)}" type="button">恢复为待处理</button>` : ""}<button class="secondary-button" data-feedback-refresh type="button">刷新</button>${!feedback.linked_task_id && !linkRecovery ? `<button class="primary-button" data-feedback-task="${escapeHtml(feedback.id)}" type="button">转为待办</button>` : ""}${canDelete ? `<button class="secondary-button danger-action" data-feedback-delete="${escapeHtml(feedback.id)}" type="button">删除</button>` : ""}</div><section class="feedback-content-card"><h3>反馈原文</h3><p>${escapeHtml(feedback.content || "用户没有提供正文。")}</p>${attachment}</section>${factRows([
    ["反馈标识", feedback.id],
    ["所属产品", feedback.project_name || feedback.project_id],
    ["用户 ID", feedback.custom_user_id || "未提供"],
    ["联系电话", feedback.user_phone || "未提供"],
    ["联系邮箱", feedback.user_email || "未提供"],
    ["提交时间", formatFeedbackDate(feedback.created_at)],
    ["最近更新", formatFeedbackDate(feedback.updated_at)],
    ["关联待办", feedback.linked_task_id ? `${feedback.linked_task_id}${feedback.linked_task_state ? ` · ${STATE_LABELS[feedback.linked_task_state] || feedback.linked_task_state}` : ""}` : "未关联"]
  ])}${useV2 ? renderFeedbackConversation(feedback, feedbackManagement) : ""}</div>`;
  els.feedbackInspector.querySelector("[data-feedback-priority]")?.addEventListener("change", (event) => runAction(() => updateFeedbackPriority(feedback.id, event.currentTarget.value)));
  els.feedbackInspector.querySelector("[data-feedback-ignore]")?.addEventListener("click", () => runAction(() => ignoreFeedback(feedback.id)));
  els.feedbackInspector.querySelector("[data-feedback-restore]")?.addEventListener("click", (event) => runAction(() => restoreFeedback(feedback.id, event.currentTarget)));
  els.feedbackInspector.querySelector("[data-feedback-refresh]")?.addEventListener("click", () => runAction(refreshFeedbackWorkspace));
  els.feedbackInspector.querySelector("[data-feedback-task]")?.addEventListener("click", () => runAction(() => feedbackToTask(feedback.id)));
  els.feedbackInspector.querySelector("[data-feedback-link-retry]")?.addEventListener("click", () => runAction(() => retryFeedbackTaskLink(feedback.id)));
  els.feedbackInspector.querySelector("[data-feedback-delete]")?.addEventListener("click", () => runAction(() => deleteFeedback(feedback.id)));
  wireFeedbackImages(feedback);
  wireFeedbackConversation(feedback, feedbackManagement);
  els.feedbackInspector.querySelector(".feedback-inspector-scroll").scrollTop = previousScrollTop;
  if (feedbackConversationNeedsLoad(feedback, useV2)) {
    void loadFeedbackConversation(feedback, {
      force: Boolean(state.feedbackConversations[String(feedback.id)])
    });
  }
}

function renderFeedbackFile(feedback) {
  if (!feedbackResourceIsImage({ file_name: feedbackFileName(feedback.file), url: feedback.file })) {
    return `<button class="feedback-attachment" data-feedback-attachment type="button">查看用户附件</button>`;
  }
  return renderFeedbackImage({
    source: "feedback-file",
    project_id: feedback.project_id,
    feedback_id: feedback.id,
    feedback_source: feedback.feedback_source || "v1",
    file_name: feedbackFileName(feedback.file),
    resource_version: feedback.updated_at || feedback.file
  });
}

function renderFeedbackImage(input) {
  const key = feedbackImagePreviewKey(input);
  state.feedbackImageInputs[key] = input;
  const preview = state.feedbackImagePreviews[key];
  if (!preview) queueFeedbackImagePreview(input);
  if (preview?.status === "loaded") return `<button class="feedback-image-preview is-loaded" data-feedback-image="${escapeHtml(key)}" type="button" title="在独立窗口中浏览"><img src="${escapeHtml(preview.data_url)}" alt="${escapeHtml(input.file_name || "反馈图片")}"></button>`;
  if (preview?.status === "error") return `<button class="feedback-image-preview is-error" data-feedback-image-retry="${escapeHtml(key)}" type="button">加载失败 · 重试<br><small>${escapeHtml(preview.error)}</small></button>`;
  return `<div class="feedback-image-preview is-loading" role="status">正在加载图片 · ${escapeHtml(input.file_name || "反馈图片")}</div>`;
}

function wireFeedbackImages(feedback) {
  els.feedbackInspector.querySelector("[data-feedback-attachment]")?.addEventListener("click", () => runAction(() => api.openFeedbackAttachment(feedback.file)));
  els.feedbackInspector.querySelectorAll("[data-feedback-image]").forEach((button) => button.addEventListener("click", () => runAction(() => api.openImageViewer(state.feedbackImageInputs[button.dataset.feedbackImage]))));
  els.feedbackInspector.querySelectorAll("[data-feedback-image-retry]").forEach((button) => button.addEventListener("click", () => {
    const input = state.feedbackImageInputs[button.dataset.feedbackImageRetry];
    if (!input) return;
    queueFeedbackImagePreview(input, { force: true });
    renderFeedbackInspector(feedback);
  }));
}

function feedbackWorkspace(feedback) {
  return (state.platform.product_workspaces || []).find((item) => String(item.id) === String(feedback.project_id));
}

function feedbackUsesV2(feedback) {
  const status = feedbackWorkspace(feedback)?.feedback_management?.status;
  return feedback?.feedback_source === "v2" && ["available", "degraded"].includes(status);
}

function feedbackIsUnread(feedback) {
  return Boolean(feedbackWorkspace(feedback)?.feedback_management?.unread_feedback_ids?.map(String).includes(String(feedback?.id)));
}

function feedbackConversationIdentity(feedback) {
  return `${String(feedback?.project_id || "")}:${String(feedback?.id || "")}`;
}

function feedbackConversationRequestIsCurrent(id, requestId, requestKey) {
  const current = state.feedbackConversations[String(id)];
  return current?.request_id === requestId && current?.request_key === requestKey;
}

function feedbackConversationNeedsLoad(feedback, useV2 = feedbackUsesV2(feedback)) {
  if (!useV2 || state.page !== "feedback") return false;
  const conversation = state.feedbackConversations[String(feedback.id)];
  if (!conversation) return true;
  return feedbackIsUnread(feedback) && conversation.last_unread_refresh_epoch !== state.feedbackSnapshotEpoch;
}

async function refreshFeedbackWorkspace({ quiet = false } = {}) {
  await refreshSnapshot({ quiet });
  const feedback = (state.platform.feedback_v1 || []).find((item) => String(item.id) === String(state.selectedFeedbackId));
  if (feedback && feedbackUsesV2(feedback)) await loadFeedbackConversation(feedback, { force: true });
}

function applyFeedbackReadState(feedback, result) {
  const management = feedbackWorkspace(feedback)?.feedback_management;
  if (!management) return;
  const feedbackId = String(feedback.id);
  const markedCount = Math.max(0, Math.trunc(Number(result?.marked_count) || 0));
  management.unread_count = Math.max(0, Math.trunc(Number(management.unread_count) || 0) - markedCount);
  management.unread_feedback_ids = (management.unread_feedback_ids || []).map(String).filter((id) => id !== feedbackId);
}

function renderFeedbackConversation(feedback, management) {
  const conversation = state.feedbackConversations[String(feedback.id)] || { loading: true, messages: [], error: "", readError: "", draft: "", file: null, sending: false };
  const messages = conversation.messages || [];
  const error = conversation.error ? `<div class="feedback-conversation-error"><span>${escapeHtml(conversation.error)}</span><button data-feedback-messages-retry type="button">重试</button></div>` : "";
  const readError = conversation.readError ? `<small class="feedback-read-error">消息已加载，但未读状态保存失败；可稍后重试。</small>` : "";
  const timeline = conversation.loading
    ? `<div class="feedback-conversation-loading">正在读取沟通记录…</div>`
    : messages.length
      ? `<div class="feedback-message-list">${messages.map((message) => `<article class="feedback-message ${escapeHtml(message.sender_type)}"><header><strong>${message.sender_type === "customer" ? "用户" : message.sender_type === "developer" ? "开发者" : "系统"}</strong><time>${escapeHtml(formatFeedbackDate(message.created_at))}</time></header>${message.content ? `<p>${escapeHtml(message.content)}</p>` : ""}${(message.attachments || []).length ? `<div class="feedback-message-attachments">${message.attachments.map((attachment) => feedbackResourceIsImage(attachment) ? renderFeedbackImage({ source: "feedback-v2", project_id: feedback.project_id, feedback_id: feedback.id, attachment_id: attachment.id, object_key: attachment.object_key, file_name: attachment.file_name || feedbackFileName(attachment.object_key), mime_type: attachment.mime_type, resource_version: attachment.id || attachment.object_key }) : `<button data-feedback-message-attachment data-attachment-id="${escapeHtml(attachment.id)}" data-object-key="${escapeHtml(attachment.object_key)}" type="button">${escapeHtml(attachment.file_name || attachment.object_key || "查看附件")}</button>`).join("")}</div>` : ""}</article>`).join("")}</div>`
      : `<div class="empty-state compact">尚无沟通记录。</div>`;
  return `<section class="feedback-conversation" aria-label="反馈沟通"><div class="section-title-row"><div><span class="section-icon">✦</span><div><h3>沟通记录</h3><p>${management.unread_count ? `${management.unread_count} 条未读` : "用户、开发者与系统消息"}</p></div></div><button class="secondary-button" data-feedback-conversation-refresh type="button" ${conversation.loading ? "disabled" : ""}>刷新</button></div>${error}${readError}${timeline}<div class="feedback-reply-composer"><textarea data-feedback-reply rows="3" placeholder="回复用户，失败时会保留草稿">${escapeHtml(conversation.draft || "")}</textarea><label><span>回复附件</span><input data-feedback-reply-file type="file" ${conversation.sending ? "disabled" : ""}><small>${conversation.file ? escapeHtml(conversation.file.name) : "可选，最大 25 MB"}</small></label><button class="primary-button" data-feedback-reply-send type="button" ${conversation.sending ? "disabled" : ""}>${conversation.sending ? "发送中…" : "发送回复"}</button></div></section>`;
}

function wireFeedbackConversation(feedback, management) {
  const id = String(feedback.id);
  const conversation = state.feedbackConversations[id];
  if (!conversation && feedback.feedback_source !== "v2") return;
  els.feedbackInspector.querySelector("[data-feedback-conversation-refresh]")?.addEventListener("click", () => runAction(refreshFeedbackWorkspace));
  els.feedbackInspector.querySelector("[data-feedback-messages-retry]")?.addEventListener("click", () => runAction(() => loadFeedbackConversation(feedback, { force: true })));
  els.feedbackInspector.querySelector("[data-feedback-reply]")?.addEventListener("input", (event) => {
    (state.feedbackConversations[id] ||= { messages: [] }).draft = event.currentTarget.value;
  });
  els.feedbackInspector.querySelector("[data-feedback-reply-file]")?.addEventListener("change", (event) => {
    (state.feedbackConversations[id] ||= { messages: [] }).file = event.currentTarget.files?.[0] || null;
    renderFeedbackInspector(feedback);
  });
  els.feedbackInspector.querySelector("[data-feedback-reply-send]")?.addEventListener("click", () => runAction(() => sendFeedbackReply(feedback)));
  els.feedbackInspector.querySelectorAll("[data-feedback-message-attachment]").forEach((button) => button.addEventListener("click", () => {
    void runAction(() => runFeedbackV2Request(() => api.openFeedbackV2Attachment({
      project_id: feedback.project_id,
      feedback_id: feedback.id,
      attachment_id: button.dataset.attachmentId,
      object_key: button.dataset.objectKey
    })));
  }));
}

function feedbackResourceIsImage(value = {}) {
  if (value.type === "image" || String(value.mime_type || "").toLowerCase().startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp)(?:$|[?#])/i.test(String(value.file_name || value.object_key || value.url || ""));
}

function feedbackFileName(value) {
  try {
    const path = new URL(String(value || "")).pathname;
    return decodeURIComponent(path.split("/").pop() || "feedback-image");
  } catch {
    return String(value || "feedback-image").split(/[\\/]/).pop() || "feedback-image";
  }
}

function feedbackImagePreviewKey(input) {
  return [input.source, input.project_id, input.feedback_id, input.attachment_id, input.object_key, input.file_name, input.resource_version].map((value) => String(value || "")).join(":");
}

function queueFeedbackImagePreview(input, { force = false } = {}) {
  const key = feedbackImagePreviewKey(input);
  const existing = state.feedbackImagePreviews[key];
  if (!force && ["loading", "loaded"].includes(existing?.status)) return;
  state.feedbackImageInputs[key] = input;
  state.feedbackImagePreviews[key] = { status: "loading", data_url: "", error: "" };
  feedbackImagePreviewQueue.push({ input, key });
  pumpFeedbackImagePreviewQueue();
}

function pumpFeedbackImagePreviewQueue() {
  while (activeFeedbackImagePreviews < FEEDBACK_IMAGE_PREVIEW_CONCURRENCY && feedbackImagePreviewQueue.length > 0) {
    const job = feedbackImagePreviewQueue.shift();
    activeFeedbackImagePreviews += 1;
    api.previewImage(job.input).then((result) => {
      state.feedbackImagePreviews[job.key] = { status: "loaded", data_url: result.data_url, error: "" };
    }).catch((error) => {
      state.feedbackImagePreviews[job.key] = { status: "error", data_url: "", error: error?.message || "反馈图片不可用。" };
    }).finally(() => {
      activeFeedbackImagePreviews -= 1;
      if (String(state.selectedFeedbackId) === String(job.input.feedback_id)) {
        const feedback = (state.platform.feedback_v1 || []).find((item) => String(item.id) === String(job.input.feedback_id));
        if (feedback) renderFeedbackInspector(feedback);
      }
      pumpFeedbackImagePreviewQueue();
    });
  }
}

async function loadFeedbackConversation(feedback, { force = false } = {}) {
  const id = String(feedback.id);
  const requestKey = feedbackConversationIdentity(feedback);
  const current = state.feedbackConversations[id];
  if (current?.loading && current.request_key === requestKey) return;
  if (current && !force && (!current.request_key || current.request_key === requestKey) && !current.error) return;
  const preserved = !current?.request_key || current.request_key === requestKey ? current : null;
  const requestId = state.feedbackConversationRequestSequence = (Number(state.feedbackConversationRequestSequence) || 0) + 1;
  const unreadRefreshEpoch = feedbackIsUnread(feedback) ? state.feedbackSnapshotEpoch : preserved?.last_unread_refresh_epoch;
  let refreshFeedbackList = false;
  state.feedbackConversations[id] = {
    ...preserved,
    messages: preserved?.messages || [],
    draft: preserved?.draft || "",
    file: preserved?.file || null,
    loading: true,
    sending: preserved?.sending || false,
    error: "",
    readError: preserved?.readError || "",
    request_id: requestId,
    request_key: requestKey,
    last_unread_refresh_epoch: unreadRefreshEpoch
  };
  renderFeedbackInspector(feedback);
  try {
    const messages = await runFeedbackV2Request(() => api.getFeedbackV2Messages({ project_id: feedback.project_id, feedback_id: feedback.id }));
    if (!feedbackConversationRequestIsCurrent(id, requestId, requestKey)) return;
    state.feedbackConversations[id] = { ...state.feedbackConversations[id], messages: Array.isArray(messages) ? messages : [], loading: false, error: "" };
    const management = feedbackWorkspace(feedback)?.feedback_management;
    if (management?.features?.mark_read === true && feedbackIsUnread(feedback)) {
      try {
        const result = await runFeedbackV2Request(() => api.markFeedbackV2Read({ project_id: feedback.project_id, feedback_id: feedback.id }));
        if (!feedbackConversationRequestIsCurrent(id, requestId, requestKey)) return;
        applyFeedbackReadState(feedback, result);
        refreshFeedbackList = true;
        state.feedbackConversations[id].readError = "";
      } catch (error) {
        if (!feedbackConversationRequestIsCurrent(id, requestId, requestKey)) return;
        state.feedbackConversations[id].readError = error?.message || "已读回写失败";
      }
    } else {
      state.feedbackConversations[id].readError = "";
    }
  } catch (error) {
    if (!feedbackConversationRequestIsCurrent(id, requestId, requestKey)) return;
    state.feedbackConversations[id] = { ...state.feedbackConversations[id], loading: false, error: error?.message || "加载消息失败" };
  }
  if (!feedbackConversationRequestIsCurrent(id, requestId, requestKey)) return;
  if (refreshFeedbackList) renderPlatformFeedback();
  else if (String(state.selectedFeedbackId) === id) renderFeedbackInspector(feedback);
}

async function sendFeedbackReply(feedback) {
  const id = String(feedback.id);
  const conversation = state.feedbackConversations[id] || { messages: [], draft: "", file: null };
  const content = String(conversation.draft || "").trim();
  if (!content && !conversation.file) throw new Error("请输入回复内容或选择附件。");
  conversation.sending = true;
  conversation.error = "";
  renderFeedbackInspector(feedback);
  try {
    let file;
    if (conversation.file) {
      const bytes = await conversation.file.arrayBuffer();
      file = { file_name: conversation.file.name, mime_type: conversation.file.type, size: conversation.file.size, bytes };
    }
    const message = await runFeedbackV2Request(() => api.sendFeedbackV2Reply({ project_id: feedback.project_id, feedback_id: feedback.id, content, file }));
    conversation.messages = [...(conversation.messages || []), message];
    conversation.draft = "";
    conversation.file = null;
  } catch (error) {
    conversation.error = error?.message || "发送回复失败";
    throw error;
  } finally {
    conversation.sending = false;
    state.feedbackConversations[id] = conversation;
    if (String(state.selectedFeedbackId) === id) renderFeedbackInspector(feedback);
  }
}

function feedbackProcessingState(feedback) {
  if (feedback.linked_task_id) return "converted";
  if (feedback.ignored) return "ignored";
  const explicit = String(feedback.processing_state || feedback.metadata?.feedback_state || feedback.metadata?.status || "").toLowerCase();
  return Object.hasOwn(FEEDBACK_STATE_LABELS, explicit) ? explicit : "pending";
}

function compareFeedbackItems(left, right) {
  const leftTime = Date.parse(left.created_at || left.updated_at || "") || 0;
  const rightTime = Date.parse(right.created_at || right.updated_at || "") || 0;
  if (state.feedbackSort === "oldest") return leftTime - rightTime || String(left.id).localeCompare(String(right.id));
  if (state.feedbackSort === "priority") {
    const priorityRank = { P1: 1, P2: 2, P3: 3 };
    return (priorityRank[left.priority] || 4) - (priorityRank[right.priority] || 4) || rightTime - leftTime || String(left.id).localeCompare(String(right.id));
  }
  return rightTime - leftTime || String(left.id).localeCompare(String(right.id));
}

function feedbackExcerpt(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 54 ? `${text.slice(0, 54)}…` : text;
}

function formatFeedbackDate(value) {
  return value ? formatTime(value) : "未知";
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
  const action = openPlatformAction({
    title: "创建待办",
    lead: "待办写入 Workshop；是否进入 Automation 仍由分配对象、状态和项目授权共同决定。",
    confirmLabel: "创建待办",
    fields: [
      platformField("project_id", "产品", { type: "select", required: true, value: defaultProjectId, options: projects }),
      platformField("content", "待办内容", { type: "textarea", required: true }),
      platformField("state", "状态", { type: "select", value: "pending_review", options: taskStateOptions(), help: "可直接选择任一待办状态；Automation 只消费创建成功后的状态。" }),
      taskProjectFields(defaultProjectId, { includeExecutorAutomationHelp: true, taskState: "pending_review" }),
      platformField("priority", "优先级", { type: "select", value: "", options: taskPriorityOptions(), help: "最高优先处理；无优先级表示创建时不设置该字段。" })
    ]
  });
  bindTaskFormProjectScope(defaultProjectId, { includeExecutorAutomationHelp: true });
  const values = normalizeTaskFormValues(await action);
  if (!values) return;
  await executeManagedAction("task.create", values, "待办已创建");
}

async function editTask(taskId, { focusField = "" } = {}) {
  const task = findPlatformTask(taskId);
  const projects = workspaceOptions();
  const action = openPlatformAction({
    title: `编辑待办 ${task.id}`,
    lead: "切换产品会先创建新待办，确认成功后再删除旧待办。新待办获得新 ID；评论、附件和 Automation 执行关系不会迁移。",
    confirmLabel: "保存",
    fields: [
      platformField("project_id", "产品", { type: "select", required: true, value: task.project_id, options: projects }),
      platformField("content", "待办内容", { type: "textarea", required: true, value: task.content ?? "" }),
      platformField("state", "状态", { type: "select", value: task.state, options: taskStateOptions(), help: "Automation 归属不限制 Work 修改状态；保存后由 Work Sync 等待服务器确认。" }),
      taskProjectFields(task.project_id, { executorId: task.executor_id, fatherId: task.father_id, excludedTaskId: task.id, tags: task.tags }),
      platformField("priority", "优先级", { type: "select", value: workshopTaskPriority(task), options: taskPriorityOptions(), help: "最高优先处理；无优先级保留服务端未设置语义。" })
    ],
    onSubmit: (values) => submitTaskEdit(task, values)
  });
  bindTaskFormProjectScope(task.project_id, {
    executorId: task.executor_id,
    fatherId: task.father_id,
    excludedTaskId: task.id,
    tags: task.tags
  });
  if (focusField) els.platformActionForm.querySelector(`[name="${focusField}"]`)?.focus();
  await action;
}

async function submitTaskEdit(task, rawValues) {
  const values = normalizeTaskFormValues(rawValues, { emptyPriority: "null" });
  const targetProjectId = String(values.project_id || "");
  if (targetProjectId !== String(task.project_id)) {
    if (!window.confirm("切换产品会创建一条新待办并删除旧待办。新 ID 不继承评论、附件、Run、thread、Gate 或验收问题。确定继续吗？")) {
      clearPlatformActionStatus();
      return { keepOpen: true };
    }
    const { project_id: _projectId, ...replacementValues } = values;
    try {
      const result = await executeManagedAction("task.replace_project", {
        source_task_id: task.id,
        target_project_id: targetProjectId,
        ...replacementValues
      }, "新待办已创建，旧待办已删除", { tolerateRefreshFailure: true });
      await selectTaskReplacementTarget(result, targetProjectId);
      return { close: true };
    } catch (error) {
      if (!error?.partial_result?.replacement_id) throw error;
      showTaskReplacementRecoveryInSheet(error.partial_result, error?.message || "目标待办已创建，但源待办尚未删除。");
      return { keepOpen: true };
    }
  }
  const { project_id: _projectId, ...updateValues } = values;
  await executeManagedAction("task.update", { task_id: task.id, expected_state: task.state, ...updateValues }, "待办已更新");
  return { close: true };
}

async function retryTaskProjectReplacement(replacementId) {
  await executeManagedAction("task.replace_project.retry_delete", { replacement_id: replacementId }, "源待办已删除，产品切换完成");
}

async function keepTaskProjectReplacement(replacementId) {
  if (!window.confirm("确定保留源待办和目标待办吗？确认后 ArcOrbit 将关闭本次恢复事项，不再自动删除源待办。")) return;
  await executeManagedAction("task.replace_project.keep_both", { replacement_id: replacementId }, "已保留两条待办");
}

async function createSubtask(taskId) {
  const parent = findPlatformTask(taskId);
  const values = normalizeTaskFormValues(await openPlatformAction({
    title: `创建 ${parent.id} 的子待办`,
    lead: `子待办保留在 ${parent.project_name}，初始状态固定为待评审。`,
    confirmLabel: "创建子待办",
    fields: [
      platformField("content", "待办内容", { type: "textarea", required: true }),
      platformField("state", "状态", { type: "select", value: "pending_review", options: taskStateOptions(), help: "子待办也可直接选择任一待办状态。" }),
      taskProjectFields(parent.project_id, { includeFather: false }),
      platformField("priority", "优先级", { type: "select", value: "", options: taskPriorityOptions() })
    ]
  }));
  if (!values) return;
  await executeManagedAction("task.subtask.create", { ...values, project_id: parent.project_id, father_id: parent.id }, "子待办已创建");
}

async function reparentTask(taskId) {
  const task = findPlatformTask(taskId);
  const values = await openPlatformAction({
    title: `调整待办 ${task.id} 的父待办`,
    lead: "ArcOrbit 会先检查同产品归属与循环关系，Workshop 服务端仍作最终校验。",
    confirmLabel: "保存父待办",
    fields: [platformField("father_id", "父待办", { type: "select", value: task.father_id, options: taskSelectOptions(task.project_id, task.id) })]
  });
  if (!values) return;
  await executeManagedAction("task.reparent", { task_id: task.id, project_id: task.project_id, father_id: values.father_id || null }, "父待办已更新");
}

async function deleteTask(taskId) {
  const task = findPlatformTask(taskId);
  if (!window.confirm(`确定删除待办“${displayTaskTitle(task)}”吗？`)) return;
  await executeManagedAction("task.delete", { task_id: task.id }, "待办已删除");
}

async function manageTaskAttachments(taskId) {
  const task = findPlatformTask(taskId);
  const attachments = await api.executePlatformAction("task.attachments.list", { task_id: task.id });
  const userId = projectCurrentUserExecutorId(task.project_id);
  const role = findWorkspace(task.project_id).current_user_role;
  const editable = (attachments || []).filter((item) => isCurrentProjectUser(item.creator_id, userId) && ["text", "url"].includes(item.type));
  const deletable = (attachments || []).filter((item) => isCurrentProjectUser(item.creator_id, userId) || isCurrentProjectUser(task.creator_id, userId) || ["owner", "admin"].includes(role));
  if (editable.length === 0 && deletable.length === 0) {
    showToast("新评论和资源可在 Inspector 中添加；当前记录没有可管理操作。");
    return;
  }
  const operation = await openPlatformAction({
    title: `待办 ${task.id} 的附件`,
    lead: `${attachments?.length || 0} 条记录；新评论、链接、图片和文件请使用 Inspector 的类型化评论编辑器。创建者可改文本或链接，删除还允许待办创建者和项目 admin/owner。`,
    confirmLabel: "下一步",
    fields: [platformField("operation", "操作", { type: "select", options: [...(editable.length ? [{ value: "update", label: "更新我创建的文本或链接" }] : []), ...(deletable.length ? [{ value: "delete", label: "删除有权限的记录" }] : [])] })]
  });
  if (!operation) return;
  const candidates = operation.operation === "update" ? editable : deletable;
  const selection = await openPlatformAction({
    title: operation.operation === "update" ? "选择要编辑的评论或链接" : "选择要删除的记录",
    confirmLabel: "下一步",
    fields: [platformField("attachment_id", "记录", { type: "select", options: candidates.map((item) => ({ value: item.id, label: taskAttachmentSummary(item) })) })]
  });
  if (!selection) return;
  if (operation.operation === "update") {
    const attachment = editable.find((item) => String(item.id) === String(selection.attachment_id));
    if (!attachment) throw new Error("未找到可编辑的评论记录。");
    const parsed = parseTaskAttachmentContent(attachment);
    const edit = await openPlatformAction({
      title: attachment.type === "url" ? "编辑链接" : "编辑评论",
      confirmLabel: "保存",
      fields: [platformField("content", attachment.type === "url" ? "链接地址" : "评论正文", { type: "textarea", required: true, value: attachment.type === "url" ? parsed.external_url : parsed.text })]
    });
    if (!edit) return;
    const content = attachment.type === "url"
      ? normalizeTaskAttachmentUrl(edit.content)
      : buildTaskCommentContent({ text: edit.content, images: parsed.images, files: parsed.files });
    await executeManagedAction("task.attachment.update", { attachment_id: attachment.id, content }, "评论记录已更新");
  } else {
    await executeManagedAction("task.attachment.delete", selection, "评论记录已删除");
  }
  delete state.platformTaskAttachments[String(task.id)];
  await loadTaskAttachments(task.id);
}

function taskAttachmentSummary(item) {
  try {
    const parsed = parseTaskAttachmentContent(item);
    const summary = parsed.text || parsed.external_url || parsed.files[0] || parsed.images[0] || "空记录";
    return `${item.id} · ${item.type} · ${summary.slice(0, 50)}`;
  } catch {
    return `${item.id} · ${item.type} · 无法解析`;
  }
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

async function updateFeedbackPriority(feedbackId, priority) {
  const feedback = findFeedback(feedbackId);
  if (feedback.linked_task_id) throw new Error(`该反馈已关联待办 ${feedback.linked_task_id}，请在 Work 中调整优先级。`);
  if (!["P1", "P2", "P3"].includes(priority)) throw new Error("反馈优先级无效。");
  if (feedback.feedback_source === "v2") {
    await runFeedbackV2Request(() => api.updateFeedbackV2({ project_id: feedback.project_id, feedback_id: feedback.id, data: { ...feedback.metadata, priority } }));
    await refreshSnapshot();
    showToast("反馈优先级已更新");
    return;
  }
  await executeManagedAction("feedback.update", { feedback_id: feedback.id, data: { ...feedback.metadata, priority } }, "反馈优先级已更新");
}

async function ignoreFeedback(feedbackId) {
  const feedback = findFeedback(feedbackId);
  if (feedback.feedback_source === "v2") {
    await runFeedbackV2Request(() => api.ignoreFeedbackV2({ project_id: feedback.project_id, feedback_id: feedback.id }));
    await refreshSnapshot();
    showToast("反馈已忽略");
    return;
  }
  await executeManagedAction("feedback.update", { feedback_id: feedback.id, data: { ...feedback.metadata, ignored: true } }, "反馈已忽略");
}

async function restoreFeedback(feedbackId, button) {
  const feedback = findFeedback(feedbackId);
  if (!feedback.ignored || feedback.linked_task_id) throw new Error("只有已忽略且未关联待办的反馈可以恢复为待处理。");
  const previousLabel = button?.textContent || "恢复为待处理";
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "恢复中…";
  }
  try {
    if (feedback.feedback_source === "v2") {
      await runFeedbackV2Request(() => api.restoreFeedbackV2({ project_id: feedback.project_id, feedback_id: feedback.id }));
      await refreshSnapshot();
      showToast("反馈已恢复为待处理");
      return;
    }
    await executeManagedAction("feedback.update", {
      feedback_id: feedback.id,
      data: { ...feedback.metadata, ignored: false, feedback_state: "pending", status: "analyzing" }
    }, "反馈已恢复为待处理");
  } finally {
    if (button?.isConnected) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = previousLabel;
    }
  }
}

async function feedbackToTask(feedbackId) {
  const feedback = findFeedback(feedbackId);
  if (feedback.linked_task_id) throw new Error(`该反馈已关联待办 ${feedback.linked_task_id}，请在 Work 中继续处理。`);
  const values = await openPlatformAction({
    title: "反馈转待办",
    lead: feedback.feedback_source === "v2" ? "由 Workshop 服务原子创建待办并关联反馈；失败时不会在 ArcOrbit 侧补做第二次创建。" : "先创建待办，再保存反馈与待办的关联；若关联保存失败，会明确保留已经创建的待办信息。",
    confirmLabel: feedback.feedback_source === "v2" ? "原子转为待办" : "创建并关联",
    fields: [
      platformField("task_content", "待办内容", { type: "textarea", required: true, value: feedback.content }),
      platformField("task_state", "初始状态", { type: "select", value: "pending_review", options: taskStateOptions() }),
      platformField("executor_id", "执行人", { type: "select", options: memberSelectOptions(feedback.project_id) }),
      platformField("task_priority", "服务优先级", { type: "number", value: "0", min: 0 }),
      platformField("task_tags", "标签")
    ]
  });
  if (!values) return;
  if (feedback.feedback_source === "v2") {
    await runFeedbackV2Request(() => api.convertFeedbackV2ToTask({
      project_id: feedback.project_id,
      feedback_id: feedback.id,
      content: values.task_content,
      state: values.task_state,
      executor_id: values.executor_id,
      priority: values.task_priority,
      tags: values.task_tags
    }));
    await refreshSnapshot();
    showToast("反馈已原子转为待办");
    return;
  }
  try {
    await executeManagedAction("feedback.to_task", { feedback_id: feedback.id, project_id: feedback.project_id, metadata: feedback.metadata, ...values }, "反馈已转为待办并完成关联");
  } catch (error) {
    if (!error?.partial_result?.task_id) throw error;
    state.feedbackLinkRecoveries[String(feedback.id)] = {
      project_id: String(feedback.project_id),
      task_id: String(error.partial_result.task_id),
      task_state: String(error.partial_result.task_state || values.task_state || "pending_review")
    };
    renderPlatformFeedback();
    throw new Error(`待办 ${error.partial_result.task_id} 已创建，但反馈关联失败；请使用“仅重试关联”。`);
  }
}

async function retryFeedbackTaskLink(feedbackId) {
  const feedback = findFeedback(feedbackId);
  const recovery = state.feedbackLinkRecoveries[String(feedback.id)];
  if (!recovery?.task_id) throw new Error("没有可恢复的反馈关联。请刷新后重试。");
  await executeManagedAction("feedback.link_task", {
    feedback_id: feedback.id,
    project_id: feedback.project_id,
    task_id: recovery.task_id,
    task_state: recovery.task_state
  }, `反馈已关联待办 ${recovery.task_id}`);
  delete state.feedbackLinkRecoveries[String(feedback.id)];
}

async function deleteFeedback(feedbackId) {
  const feedback = findFeedback(feedbackId);
  if (!window.confirm(`确定删除反馈“${feedback.title || feedback.short_id || feedback.id}”吗？`)) return;
  if (feedback.feedback_source === "v2") {
    await runFeedbackV2Request(() => api.deleteFeedbackV2({ project_id: feedback.project_id, feedback_id: feedback.id }));
    await refreshSnapshot();
    showToast("反馈已删除");
    return;
  }
  await executeManagedAction("feedback.delete", { feedback_id: feedback.id }, "反馈已删除");
}

async function runFeedbackV2Request(action) {
  try {
    return await action();
  } catch (error) {
    const status = Number(error?.status || error?.details?.status || 0);
    if (status === 401 || error?.code === "unauthenticated") {
      try {
        state.authentication = normalizeAuthentication(await api.getAuthStatus());
      } catch {
        state.authentication = normalizeAuthentication({ status: "expired", authenticated: false, error: error?.message || "Workshop 登录已失效。" });
      }
      showLoginGate();
    } else if (status === 404 || error?.code === "not_found") {
      await refreshSnapshot({ quiet: true }).catch(() => {});
    }
    throw error;
  }
}

async function executeManagedAction(command, input, message, { refresh = true, tolerateRefreshFailure = false } = {}) {
  try {
    const result = await api.executePlatformAction(command, input);
    if (result?.status === "partial" && result.partial_result) {
      const partialError = new Error(result.error?.message || "平台操作只完成了一部分。");
      partialError.code = result.error?.code || "platform_action_partial";
      partialError.partial_result = result.partial_result;
      if (refresh) {
        try {
          await refreshSnapshot();
        } catch (refreshError) {
          partialError.message = `${partialError.message} 当前状态刷新失败：${refreshError?.message || String(refreshError)}`;
        }
      }
      throw partialError;
    }
    if (refresh) {
      try {
        await refreshSnapshot();
      } catch (refreshError) {
        if (!tolerateRefreshFailure) throw refreshError;
        showToast(`${message}，但当前视图刷新失败：${refreshError?.message || String(refreshError)}`);
        return result;
      }
    }
    showToast(message);
    return result;
  } catch (error) {
    throw error;
  }
}

function openPlatformAction({ title, lead = "", confirmLabel = "确认", fields = [], onSubmit = null }) {
  if (platformActionResolver) closePlatformAction(null);
  els.platformActionTitle.textContent = title;
  els.platformActionLead.textContent = lead;
  els.confirmPlatformActionButton.textContent = confirmLabel;
  els.platformActionFields.innerHTML = fields.join("");
  platformActionSubmitter = typeof onSubmit === "function" ? onSubmit : null;
  platformActionBusy = false;
  platformActionDisabledControls = new Map();
  clearPlatformActionStatus();
  setPlatformActionBusy(false);
  els.platformActionOverlay.classList.remove("hidden");
  els.platformActionFields.querySelector("input, textarea, select")?.focus();
  return new Promise((resolve) => { platformActionResolver = resolve; });
}

function closePlatformAction(value) {
  if (!platformActionResolver || platformActionBusy) return;
  const resolve = platformActionResolver;
  platformActionResolver = null;
  platformActionSubmitter = null;
  clearPlatformActionStatus();
  els.platformActionOverlay.classList.add("hidden");
  resolve(value);
}

async function submitManagedPlatformAction() {
  if (!platformActionSubmitter || platformActionBusy) return;
  const submitter = platformActionSubmitter;
  const values = serializePlatformAction();
  setPlatformActionStatus("正在提交并等待 Workshop 确认…", "pending");
  setPlatformActionBusy(true);
  try {
    const result = await submitter(values);
    setPlatformActionBusy(false);
    if (!result?.keepOpen) closePlatformAction(null);
  } catch (error) {
    setPlatformActionBusy(false);
    setPlatformActionStatus(error?.message || String(error), "error");
  }
}

function setPlatformActionBusy(busy) {
  platformActionBusy = Boolean(busy);
  const controls = [
    ...els.platformActionForm.querySelectorAll("input, textarea, select, button"),
    ...els.platformActionStatus.querySelectorAll("button"),
    els.closePlatformActionButton
  ];
  if (platformActionBusy) {
    platformActionDisabledControls = new Map(controls.map((control) => [control, control.disabled]));
    controls.forEach((control) => { control.disabled = true; });
    els.platformActionForm.setAttribute("aria-busy", "true");
    return;
  }
  for (const control of controls) control.disabled = platformActionDisabledControls.get(control) || false;
  platformActionDisabledControls = new Map();
  els.platformActionForm.removeAttribute("aria-busy");
}

function setPlatformActionStatus(message, tone = "info", { html = false } = {}) {
  if (html) els.platformActionStatus.innerHTML = String(message || "");
  else els.platformActionStatus.textContent = String(message || "");
  els.platformActionStatus.dataset.tone = tone;
  els.platformActionStatus.classList.toggle("hidden", !message);
}

function clearPlatformActionStatus() {
  setPlatformActionStatus("");
}

function showTaskReplacementRecoveryInSheet(partial, message) {
  setPlatformActionStatus(`<span><strong>目标待办 ${escapeHtml(partial.target_task_id)} 已创建，源待办 ${escapeHtml(partial.source_task_id)} 尚未删除</strong><small>${escapeHtml(message)} 重试不会再次创建目标待办。</small></span><span class="task-replacement-recovery-actions"><button class="primary-button" data-platform-task-replacement-retry="${escapeHtml(partial.replacement_id)}" type="button">重试删除源待办</button><button class="secondary-button" data-platform-task-replacement-keep="${escapeHtml(partial.replacement_id)}" type="button">保留两者</button></span>`, "warning", { html: true });
  els.platformActionStatus.querySelector("[data-platform-task-replacement-retry]")?.addEventListener("click", () => runTaskReplacementSheetRecovery(async () => {
    const result = await executeManagedAction("task.replace_project.retry_delete", { replacement_id: partial.replacement_id }, "源待办已删除，产品切换完成", { tolerateRefreshFailure: true });
    await selectTaskReplacementTarget(result, partial.target_project_id, partial.target_task_id);
  }));
  els.platformActionStatus.querySelector("[data-platform-task-replacement-keep]")?.addEventListener("click", () => runTaskReplacementSheetRecovery(async () => {
    if (!window.confirm("确定保留源待办和目标待办吗？确认后 ArcOrbit 将关闭本次恢复事项，不再自动删除源待办。")) return false;
    const result = await executeManagedAction("task.replace_project.keep_both", { replacement_id: partial.replacement_id }, "已保留两条待办", { tolerateRefreshFailure: true });
    await selectTaskReplacementTarget(result, partial.target_project_id, partial.target_task_id);
    return true;
  }));
}

async function runTaskReplacementSheetRecovery(action) {
  if (platformActionBusy) return;
  setPlatformActionBusy(true);
  try {
    const completed = await action();
    setPlatformActionBusy(false);
    if (completed !== false) closePlatformAction(null);
  } catch (error) {
    setPlatformActionBusy(false);
    if (error?.partial_result?.replacement_id) {
      showTaskReplacementRecoveryInSheet(error.partial_result, error?.message || "目标待办已创建，但源待办尚未删除。");
    } else {
      setPlatformActionStatus(error?.message || String(error), "error");
    }
  }
}

async function selectTaskReplacementTarget(result, fallbackProjectId = "", fallbackTaskId = "") {
  const targetProjectId = String(result?.target_project_id || fallbackProjectId || "");
  const targetTaskId = String(result?.target_task_id || fallbackTaskId || "");
  if (!targetProjectId || !targetTaskId) return;
  state.selectedProjectId = targetProjectId;
  setPlatformTaskSelectionIntent(targetTaskId);
  await refreshWorkQuery().catch((error) => showToast(`产品切换已完成，但目标待办刷新失败：${error?.message || String(error)}`));
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

function taskProjectFields(projectId, { executorId = "", fatherId = "", excludedTaskId = "", tags = "", includeFather = true, includeExecutorAutomationHelp = false, taskState = "" } = {}) {
  return `<div class="task-project-fields" data-task-project-fields data-project-id="${escapeHtml(projectId)}">${taskProjectFieldControls(projectId, { executorId, fatherId, excludedTaskId, tags, includeFather, includeExecutorAutomationHelp, taskState })}</div>`;
}

function taskProjectFieldControls(projectId, { executorId = "", fatherId = "", excludedTaskId = "", tags = "", includeFather = true, includeExecutorAutomationHelp = false, taskState = "" } = {}) {
  return [
    platformField("executor_id", "执行人", {
      type: "select",
      value: executorId,
      options: memberSelectOptions(projectId),
      help: includeExecutorAutomationHelp ? deriveTaskExecutorAutomationHelp({ executorId, currentUserId: projectCurrentUserExecutorId(projectId), state: taskState }) : ""
    }),
    ...(includeFather ? [platformField("father_id", "父待办", { type: "select", value: fatherId, options: taskSelectOptions(projectId, excludedTaskId) })] : []),
    taskTagField(projectId, tags)
  ].join("");
}

function bindTaskFormProjectScope(defaultProjectId, initial = {}) {
  const projectSelect = els.platformActionForm.querySelector('[name="project_id"]');
  if (!projectSelect) return;
  const stateSelect = els.platformActionForm.querySelector('[name="state"]');
  const includeExecutorAutomationHelp = initial.includeExecutorAutomationHelp === true;
  const projectInitial = { ...initial };
  delete projectInitial.includeExecutorAutomationHelp;
  const updateExecutorAutomationHelp = () => {
    if (!includeExecutorAutomationHelp) return;
    const executorSelect = els.platformActionForm.querySelector('[name="executor_id"]');
    const help = executorSelect?.closest(".platform-action-field")?.querySelector("small");
    if (!executorSelect || !help) return;
    help.textContent = deriveTaskExecutorAutomationHelp({
      executorId: executorSelect.value,
      currentUserId: projectCurrentUserExecutorId(projectSelect.value),
      state: stateSelect?.value || ""
    });
  };
  const bindExecutorAutomationHelp = () => {
    if (!includeExecutorAutomationHelp) return;
    els.platformActionForm.querySelector('[name="executor_id"]')?.addEventListener("change", updateExecutorAutomationHelp);
    updateExecutorAutomationHelp();
  };
  const renderProjectFields = (projectId) => {
    const host = els.platformActionForm.querySelector("[data-task-project-fields]");
    if (!host) return;
    host.dataset.projectId = projectId;
    host.innerHTML = taskProjectFieldControls(projectId, {
      includeExecutorAutomationHelp,
      taskState: stateSelect?.value || ""
    });
    bindTaskTagManager(projectId);
    bindExecutorAutomationHelp();
  };
  projectSelect.addEventListener("change", () => renderProjectFields(projectSelect.value));
  if (includeExecutorAutomationHelp) stateSelect?.addEventListener("change", updateExecutorAutomationHelp);
  const host = els.platformActionForm.querySelector("[data-task-project-fields]");
  if (host) host.innerHTML = taskProjectFieldControls(defaultProjectId, {
    ...projectInitial,
    includeExecutorAutomationHelp,
    taskState: stateSelect?.value || ""
  });
  bindTaskTagManager(defaultProjectId);
  bindExecutorAutomationHelp();
}

function normalizeTaskFormValues(values, { emptyPriority = "omit" } = {}) {
  if (!values) return null;
  const normalized = { ...values, tags: (Array.isArray(values.tag_ids) ? values.tag_ids : []).join(",") };
  delete normalized.tag_ids;
  if (normalized.priority === "") {
    if (emptyPriority === "null") normalized.priority = null;
    else delete normalized.priority;
  }
  return normalized;
}

function taskTagField(projectId, currentTags = "") {
  const selected = new Set(Array.isArray(currentTags) ? currentTags.map(String) : parseTaskTagIds(currentTags));
  const tags = projectTags(projectId);
  const rows = tags.length
    ? tags.map((tag) => {
        const definition = parseWorkshopTag(tag.name);
        return `<div class="task-tag-row" data-task-tag-row="${escapeHtml(tag.id)}"><label><input name="tag_ids" type="checkbox" value="${escapeHtml(tag.id)}" ${selected.has(String(tag.id)) ? "checked" : ""}><i class="task-tag-dot" style="--task-tag-color:${escapeHtml(definition.cssColor)}"></i><span>${escapeHtml(definition.displayName)}</span></label><span class="row-actions"><button data-task-tag-edit="${escapeHtml(tag.id)}" type="button">编辑</button><button class="danger-action" data-task-tag-delete="${escapeHtml(tag.id)}" type="button">删除</button></span></div>`;
      }).join("")
    : `<div class="empty-state compact">该产品还没有标签，可在下方直接创建。</div>`;
  return `<fieldset class="platform-action-field task-tag-field" data-task-tag-field data-multiple-field="tag_ids" data-project-id="${escapeHtml(projectId)}"><legend>标签</legend><div class="task-tag-list">${rows}</div><div class="task-tag-create"><input data-task-tag-new-name type="text" placeholder="新标签名称" aria-label="新标签名称"><input data-task-tag-new-color type="color" value="#6b7280" aria-label="新标签颜色"><button class="secondary-button" data-task-tag-create type="button">创建并选中</button></div><small>标签属于当前产品；待办保存标签 ID，名称和颜色由 Workshop 标签实体管理。</small></fieldset>`;
}

function bindTaskTagManager(projectId) {
  const field = els.platformActionForm.querySelector("[data-task-tag-field]");
  if (!field || String(field.dataset.projectId) !== String(projectId)) return;
  field.querySelector("[data-task-tag-create]")?.addEventListener("click", () => runAction(() => createTaskFormTag(projectId)));
  field.querySelectorAll("[data-task-tag-edit]").forEach((button) => button.addEventListener("click", () => showTaskTagEditor(projectId, button.dataset.taskTagEdit)));
  field.querySelectorAll("[data-task-tag-delete]").forEach((button) => button.addEventListener("click", () => runAction(() => deleteTaskFormTag(projectId, button.dataset.taskTagDelete))));
}

async function createTaskFormTag(projectId) {
  const field = els.platformActionForm.querySelector("[data-task-tag-field]");
  const input = field?.querySelector("[data-task-tag-new-name]");
  const colorInput = field?.querySelector("[data-task-tag-new-color]");
  const displayName = String(input?.value || "").trim();
  if (!displayName) throw new Error("请输入新标签名称。");
  const selected = selectedTaskTagIds();
  const name = buildWorkshopTagName(displayName, colorInput?.value || "#6b7280");
  const created = await executeManagedAction("tag.create", { project_id: projectId, name }, "标签已创建");
  const createdId = String(created?.id || created?.tag?.id || projectTags(projectId).find((tag) => tag.name === name)?.id || "");
  if (createdId) selected.push(createdId);
  renderTaskTagField(projectId, selected);
}

function showTaskTagEditor(projectId, tagId) {
  const tag = projectTags(projectId).find((item) => String(item.id) === String(tagId));
  const row = [...els.platformActionForm.querySelectorAll("[data-task-tag-row]")].find((item) => String(item.dataset.taskTagRow) === String(tagId));
  if (!tag || !row) return;
  const definition = parseWorkshopTag(tag.name);
  row.innerHTML = `<div class="task-tag-editor"><input data-task-tag-edit-name type="text" value="${escapeHtml(definition.displayName)}" aria-label="标签名称"><input data-task-tag-edit-color type="color" value="${escapeHtml(definition.cssColor)}" aria-label="标签颜色"></div><span class="row-actions"><button data-task-tag-save type="button">保存</button><button data-task-tag-cancel type="button">取消</button></span>`;
  row.querySelector("[data-task-tag-save]").addEventListener("click", () => runAction(() => updateTaskFormTag(projectId, tagId, row)));
  row.querySelector("[data-task-tag-cancel]").addEventListener("click", () => renderTaskTagField(projectId, selectedTaskTagIds()));
  row.querySelector("[data-task-tag-edit-name]")?.focus();
}

async function updateTaskFormTag(projectId, tagId, row) {
  const displayName = String(row.querySelector("[data-task-tag-edit-name]")?.value || "").trim();
  const color = row.querySelector("[data-task-tag-edit-color]")?.value || "#6b7280";
  if (!displayName) throw new Error("标签名称不能为空。");
  const selected = selectedTaskTagIds();
  await executeManagedAction("tag.update", { tag_id: tagId, name: buildWorkshopTagName(displayName, color) }, "标签已更新");
  renderTaskTagField(projectId, selected);
}

async function deleteTaskFormTag(projectId, tagId) {
  const tag = projectTags(projectId).find((item) => String(item.id) === String(tagId));
  if (!tag || !window.confirm(`确定删除标签“${parseWorkshopTag(tag.name).displayName}”吗？`)) return;
  const selected = selectedTaskTagIds().filter((id) => String(id) !== String(tagId));
  await executeManagedAction("tag.delete", { tag_id: tagId }, "标签已删除");
  renderTaskTagField(projectId, selected);
}

function renderTaskTagField(projectId, selectedIds) {
  const current = els.platformActionForm.querySelector("[data-task-tag-field]");
  if (!current) return;
  current.outerHTML = taskTagField(projectId, selectedIds);
  bindTaskTagManager(projectId);
}

function selectedTaskTagIds() {
  return [...els.platformActionForm.querySelectorAll('[name="tag_ids"]:checked')].map((input) => String(input.value));
}

function projectTags(projectId) {
  return (state.platform.tags || []).filter((tag) => String(tag.project_id) === String(projectId));
}

function parseTaskTagIds(value) {
  return String(value || "").split(",").map((id) => id.trim()).filter(Boolean);
}

function parseWorkshopTag(value) {
  const name = String(value || "").trim();
  const match = name.match(/^\[([^\]]+)\]\(#([0-9a-f]{8})\)$/i);
  if (!match) return { displayName: name || "未命名标签", cssColor: "#6b7280" };
  return { displayName: match[1], cssColor: `#${match[2].slice(2)}` };
}

function buildWorkshopTagName(displayName, color) {
  const name = String(displayName || "").trim();
  if (!name || /[\[\]]/.test(name)) throw new Error("标签名称不能为空且不能包含方括号。");
  const hex = String(color || "").replace("#", "").toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(hex)) throw new Error("标签颜色必须是有效的六位十六进制颜色。");
  return `[${name}](#ff${hex})`;
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
function taskPriorityOptions() { return [{ value: "", label: "无优先级" }, { value: "0", label: "最高 · 紧急且重要" }, { value: "1", label: "高 · 优先处理" }, { value: "2", label: "中 · 正常处理" }, { value: "3", label: "低 · 可以延后" }]; }
function workspaceOptions() { return (state.platform.product_workspaces || []).map((item) => ({ value: item.id, label: item.name })); }
function projectCurrentUserExecutorId(projectId) {
  const value = String((state.platform.product_workspaces || []).find((item) => String(item.id) === String(projectId))?.current_user_id || "").trim();
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? value : "";
}
function taskCreationDefaultProjectId(projects) {
  return projects.some((project) => String(project.value) === String(state.selectedProjectId))
    ? state.selectedProjectId
    : projects[0]?.value || "";
}
function organizationOptions() { return (state.platform.organizations || []).map((item) => ({ value: item.id, label: item.name })); }
function memberSelectOptions(projectId = "") { return [{ value: "", label: "未分配" }, ...(state.platform.members || []).filter((item) => !projectId || String(item.project_id) === String(projectId)).map((item) => ({ value: item.user_id, label: memberName(item) }))]; }
function taskSelectOptions(projectId = "", excludedTaskId = "") { return [{ value: "", label: "根待办" }, ...(state.platform.tasks || []).filter((item) => (!projectId || String(item.project_id) === String(projectId)) && String(item.id) !== String(excludedTaskId)).map((item) => ({ value: item.id, label: `${projectId ? "" : `${item.project_name} · `}${item.id} · ${item.title}` }))]; }
function findProject(id) { const value = state.platform.projects.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到产品。"); return value; }
function currentOrganizationScope() { return (state.platform.organization_scopes || []).find((item) => String(item.id) === String(state.organizationScopeId)) || null; }
function organizationName(id) { return (state.platform.organization_scopes || []).find((item) => String(item.id) === String(id))?.name || "组织项目"; }
function findOrganization(id) { const value = state.platform.organizations.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到组织。"); return value; }
function findOrganizationMember(id, organizationId) { const value = state.platform.organization_members.find((item) => String(item.id) === String(id) && String(item.organization_id) === String(organizationId)); if (!value) throw new Error("未找到组织成员。"); return value; }
function findWorkspace(id) { const value = state.platform.product_workspaces.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到产品工作区。"); return value; }
function findProjectMember(id, projectId) { const value = (state.platform.project_members || []).find((item) => String(item.id) === String(id) && String(item.project_id) === String(projectId)); if (!value) throw new Error("未找到项目成员。"); return value; }
function findPlatformTask(id) {
  const value = (state.workQuery.projection?.tasks || []).find((item) => String(item.id) === String(id))
    || state.platform.tasks.find((item) => String(item.id) === String(id));
  if (!value) throw new Error("未找到待办。");
  return value;
}
function findFeedback(id) { const value = state.platform.feedback_v1.find((item) => String(item.id) === String(id)); if (!value) throw new Error("未找到反馈。"); return value; }
function canManagePlatformTask(task) { const role = findWorkspace(task.project_id).current_user_role; return task.state !== "in_progress" || ["owner", "admin"].includes(role) || isCurrentProjectUser(task.executor_id, projectCurrentUserExecutorId(task.project_id)); }
function servicePriority(value) { const number = Number(value || 0); return number > 0 ? Math.max(0, 100 - number) : 0; }
function workshopTaskPriority(task) {
  const raw = task?.raw?.priority;
  if (raw === null || raw === undefined || raw === "") return "";
  const number = Number(raw);
  return Number.isFinite(number) ? String(number) : String(servicePriority(task?.priority));
}

function renderCommandCenter() {
  const snapshot = state.snapshot;
  const worksetProjects = automationProjectsInActiveWorkset();
  const scopedProjects = state.selectedProjectId === "all" ? worksetProjects : worksetProjects.filter((project) => String(project.id) === state.selectedProjectId);
  const scopedQueue = snapshot.queue.filter(scopedTaskFilter);
  const scopedBlockedPending = (snapshot.blocked_pending_tasks || []).filter(scopedTaskFilter);
  const scopedFeedback = (snapshot.acceptance_feedback_queue || []).filter(scopedTaskFilter);
  els.commandHeading.textContent = state.selectedProjectId === "all" ? "产品集自动领取态势" : `${currentProject()?.name || "项目"} 自动领取态势`;
  els.commandSummary.textContent = `${scopedProjects.length} 个项目 · ${scopedProjects.filter((project) => project.participating).length} 个允许自动领取 · ${scopedProjects.filter((project) => project.eligible).length} 个具备执行资格 · ${realtimeStatusLabel(snapshot.realtime)} · 最近同步 ${snapshot.synced_at ? formatTime(snapshot.synced_at) : "尚未完成"}`;
  els.healthBadge.className = `health-badge ${snapshot.health?.tone === "success" ? "success" : snapshot.health?.tone === "danger" ? "danger" : snapshot.health?.tone === "warning" ? "warning" : ""}`;
  els.healthBadge.textContent = snapshot.health?.label || "待命";
  els.queuePauseButton.textContent = snapshot.queue_paused ? "继续领取" : "暂停领取";
  els.queuePauseButton.disabled = !snapshot.enabled;
  els.acceptanceFeedbackOnlyButton.classList.toggle("is-active", state.acceptanceFeedbackOnly);
  els.acceptanceFeedbackOnlyButton.setAttribute("aria-pressed", String(state.acceptanceFeedbackOnly));
  els.acceptanceFeedbackOnlyButton.textContent = state.acceptanceFeedbackOnly ? "显示全部自动化" : "仅看验收问题";
  els.ordinaryQueueCard.classList.toggle("hidden", state.acceptanceFeedbackOnly);
  els.recentCompletionsCard.classList.toggle("hidden", state.acceptanceFeedbackOnly);

  const runningCount = (snapshot.active_executions || []).length;
  const humanAttentionCount = snapshot.attention_items.filter(scopedTaskFilter).length;
  const recoveryCount = snapshot.recovery_items.length;
  const attentionCount = humanAttentionCount + recoveryCount;
  const metrics = [
    metric("自动领取", snapshot.health?.label || "待命", sourceStatusLabel(snapshot.source_status), snapshot.health?.tone === "success" ? "healthy" : ""),
    metric("待处理事项", attentionCount, humanAttentionCount
      ? `${humanAttentionCount} 项需要人工介入`
      : recoveryCount
        ? `${recoveryCount} 项需要人工恢复自动化`
        : "没有待处理事项", attentionCount ? "attention" : ""),
    metric("运行中", runningCount, runningCount ? `${snapshot.concurrency?.available ?? 0} 个并行槽位可用` : "没有活动任务", runningCount ? "running" : ""),
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
  els.feedbackQueueTable.querySelectorAll("[data-feedback-id]").forEach((row) => {
    wireSelectableRow(row);
    row.addEventListener("click", () => {
      const item = items.find((entry) => entry.feedback_id === row.dataset.feedbackId);
      const task = state.snapshot.tasks.find((entry) => String(entry.id) === String(row.dataset.feedbackTask));
      if (item?.current_run_id || item?.source_run_id) openWorkbench("review", item.current_run_id || item.source_run_id, { task, feedbackId: item.feedback_id });
      else openTaskBrowser(task?.state || "completed", task?.id || row.dataset.feedbackTask);
    });
  });
}

function renderAttention(blockedPendingTasks = []) {
  const guidance = deriveAutomationGuidance({
    automation: state.snapshot,
    platform: state.platform,
    selectedProjectId: state.selectedProjectId
  });
  if (guidance.kind !== "human_attention") {
    const button = guidance.action_id ? `<button class="${guidance.tone === "info" ? "secondary-button" : "primary-button"}" data-automation-guidance-action="${escapeHtml(guidance.action_id)}" type="button">${escapeHtml(guidance.action_label)}</button>` : "";
    els.attentionHost.innerHTML = `<div class="attention-strip ${guidance.kind === "unknown" ? "danger" : guidance.tone === "info" ? "is-ready" : ""}"><span>${guidance.kind === "empty" || guidance.kind === "queue_ready" ? "✓" : "!"}</span><div class="attention-copy"><strong>${escapeHtml(guidance.title)}</strong><p>${escapeHtml(guidance.reason)}</p>${guidance.responsibility === "project_admin" ? `<small>责任角色：Project owner / admin。当前页面不展示必然失败的按钮。</small>` : ""}</div>${button}</div>`;
    els.attentionHost.querySelector("[data-automation-guidance-action]")?.addEventListener("click", () => runAction(() => performGuidanceAction(guidance)));
    return;
  }
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
  const externalDependency = attention.kind === "external_dependency";
  els.attentionHost.innerHTML = `<div class="attention-strip"><span>?</span><div class="attention-copy"><strong>${externalDependency ? "需要人工介入 · 外部依赖" : escapeHtml(attention.reason || "Runtime 需要人工判断")}</strong><p>${escapeHtml(externalDependency ? `${attention.reason || "存在 Automation 无法自行完成的外部依赖。"} 恢复条件：${attention.question || "请协调依赖完成后确认。"}` : attention.question || "查看请求并提供处理结果。")}</p></div><button id="openAttentionButton" class="primary-button" type="button">${externalDependency ? "已处理，重新检查" : "处理"}</button></div>`;
  document.getElementById("openAttentionButton").addEventListener("click", () => {
    if (!externalDependency) {
      openWorkbench("intervention");
      return;
    }
    runAction(async () => {
      await api.confirmAutomationExternalDependency({ execution_id: state.snapshot.selected_execution_id });
      await refreshSnapshot();
    });
  });
}

function renderCurrentRun(blockedPendingTasks = []) {
  const executions = state.snapshot.active_executions || [];
  const active = state.snapshot.active_task;
  const run = state.snapshot.active_run;
  if (!activeExecutionMatchesSelectedProject(active)) {
    els.currentRunPanel.innerHTML = `<div class="run-empty"><div><strong>没有活动任务</strong><p>${state.snapshot.queue.some(scopedTaskFilter) ? "自动化将从下一队列领取一项任务。" : blockedPendingTasks.length ? "存在待处理任务，但项目尚未满足自动执行条件。" : "同步后继续监听待处理任务。"}</p></div></div>`;
    els.currentRunActions.innerHTML = "";
    return;
  }
  const phases = runtimeStages(active.phase, run);
  const executionRef = active.case_id || active.run_id || "等待 Runtime 启动";
  const executionSelector = executions.length > 1
    ? `<div class="execution-lane-list" aria-label="活动项目执行">${executions.map((execution) => `<button class="execution-lane ${execution.execution_id === state.snapshot.selected_execution_id ? "is-active" : ""}" data-automation-execution="${escapeHtml(execution.execution_id)}" type="button"><span><strong>${escapeHtml(projectName(execution.project_id))}</strong><small>${escapeHtml(taskDisplayTitle(execution.task_title, execution.task_id))}</small></span><span class="status-pill in_progress">${escapeHtml(automationPhaseLabel(execution.phase))}</span></button>`).join("")}</div>`
    : "";
  const externalDependency = active.phase === "awaiting_human" && active.intervention_kind === "external_dependency";
  const externalDependencyNotice = externalDependency
    ? `<div class="empty-state"><strong>需要人工介入 · 外部依赖</strong><br>${escapeHtml(active.intervention_reason || "存在 Automation 无法自行完成的外部依赖。")}${active.intervention_resume_condition ? `<br><small>恢复条件：${escapeHtml(active.intervention_resume_condition)}</small>` : ""}</div>`
    : "";
  els.currentRunPanel.innerHTML = `${executionSelector}<div class="run-heading"><div><h3>${escapeHtml(taskDisplayTitle(active.task_title, active.task_id))}</h3><p>${escapeHtml(projectName(active.project_id))} · ${escapeHtml(active.workspace_key || active.local_project_id || "未绑定工作区")} · ${escapeHtml(executionRef)}</p></div><span class="status-pill in_progress">${escapeHtml(automationPhaseLabel(active.phase))}</span></div><div class="stage-grid">${phases.map((phase) => `<div class="stage-item ${phase.state}">${escapeHtml(phase.label)}</div>`).join("")}</div>${externalDependencyNotice}`;
  els.currentRunPanel.querySelectorAll("[data-automation-execution]").forEach((button) => button.addEventListener("click", () => runAction(async () => {
    state.snapshot = await api.selectAutomationExecution(button.dataset.automationExecution);
    renderCommandCenter();
  })));
  if (active.phase === "cli_handoff") {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="reopenCliButton" class="text-button" type="button">重新打开终端</button><button id="resumeRuntimeButton" class="primary-button" type="button">恢复自动执行</button>`;
  } else if (active.phase === "switching_to_cli") {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button class="secondary-button" type="button" disabled>正在安全切换…</button>`;
  } else if (["starting", "running", "continuing"].includes(active.phase)) {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="handoffCliButton" class="primary-button" type="button">切换到 Codex CLI</button><button id="stopRunButton" class="secondary-button" type="button">停止当前运行</button>`;
  } else if (externalDependency) {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button><button id="confirmExternalDependencyButton" class="primary-button" type="button">已处理，重新检查</button>`;
  } else {
    els.currentRunActions.innerHTML = `<button id="reviewRunButton" class="text-button" type="button">查看对话</button>`;
  }
  document.getElementById("reviewRunButton").addEventListener("click", () => openWorkbench("review"));
  document.getElementById("handoffCliButton")?.addEventListener("click", () => runAction(async () => {
    await api.handoffAutomationToCli({ execution_id: state.snapshot.selected_execution_id });
    await refreshSnapshot();
  }));
  document.getElementById("reopenCliButton")?.addEventListener("click", () => runAction(async () => {
    await api.reopenAutomationCli({ execution_id: state.snapshot.selected_execution_id });
    await refreshSnapshot();
  }));
  document.getElementById("resumeRuntimeButton")?.addEventListener("click", () => runAction(async () => {
    await api.resumeAutomationRuntime({ execution_id: state.snapshot.selected_execution_id });
    await refreshSnapshot();
  }));
  document.getElementById("confirmExternalDependencyButton")?.addEventListener("click", () => runAction(async () => {
    await api.confirmAutomationExternalDependency({ execution_id: state.snapshot.selected_execution_id });
    await refreshSnapshot();
  }));
  document.getElementById("stopRunButton")?.addEventListener("click", () => runAction(async () => {
    if (!window.confirm("停止请求会在安全停止点中断 Runtime，远端任务仍保持进行中。继续吗？")) return;
    await api.stopAutomationRun({ execution_id: state.snapshot.selected_execution_id });
    await refreshSnapshot();
    showPage("recovery");
  }));
}

function renderQueue(queue, blockedPendingTasks = []) {
  if (queue.length === 0) {
    els.queueTable.innerHTML = `<div class="empty-state">${blockedPendingTasks.length ? `${blockedPendingTasks.length} 项待处理被项目执行条件阻止，请先完成上方提示。` : "当前范围没有符合资格的待处理任务。"}</div>`;
    return;
  }
  els.queueTable.innerHTML = `<table class="data-table"><colgroup><col style="width:42px"><col><col style="width:130px"><col style="width:76px"><col style="width:100px"></colgroup><thead><tr><th>#</th><th>任务</th><th>项目</th><th>优先级</th><th>状态</th></tr></thead><tbody>${queue.slice(0, 8).map((task) => `<tr data-queue-task="${escapeHtml(task.id)}"><td class="queue-number">${task.queue_position}</td><td class="task-title-cell">${escapeHtml(displayTaskTitle(task))}</td><td>${escapeHtml(task.project_name)}</td><td>${formatPriority(task.priority)}</td><td><span class="status-pill pending">待处理</span></td></tr>`).join("")}</tbody></table>`;
  els.queueTable.querySelectorAll("[data-queue-task]").forEach((row) => {
    wireSelectableRow(row);
    row.addEventListener("click", () => openTaskBrowser("pending", row.dataset.queueTask));
  });
}

function renderRecentCompletions() {
  const items = state.snapshot.recent_completions.filter(scopedTaskFilter).slice(0, 5);
  els.recentCompletions.innerHTML = items.length ? items.map((item) => `<button class="completion-item" data-completion-run="${escapeHtml(item.run_id)}" type="button"><span><strong>${escapeHtml(taskDisplayTitle(item.title, item.task_id))}</strong><small>${escapeHtml(item.project_id)} · ${formatDateTime(item.completed_at)}</small></span><span class="status-pill completed">已完成</span></button>`).join("") : `<div class="empty-state">暂无由自动化完成的任务。</div>`;
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
    ["实时连接", realtimeStatusLabel(snapshot.realtime)],
    ["认证用户", snapshot.user?.name || "未确认"],
    ["远端项目", String(projects.length)],
    ["最近同步", snapshot.synced_at ? formatDateTime(snapshot.synced_at) : "尚未同步"]
  ]);
  els.executionBoundary.innerHTML = factRows([
    ["自动领取总闸", snapshot.enabled ? snapshot.queue_paused ? "已开启 · 暂停领取" : "已开启" : "已关闭"],
    ["活动执行", String(snapshot.active_executions?.length || 0)],
    ["当前选择", snapshot.active_task?.task_id || "无"],
    ["当前责任方", snapshot.attention_items.length
      ? snapshot.active_task?.intervention_kind === "external_dependency" ? "Human · 外部依赖" : "Human"
      : snapshot.recovery_items.length
        ? "Human · 恢复自动化"
      : snapshot.active_task?.phase === "cli_handoff"
        ? "Human · Codex CLI"
        : snapshot.active_task?.phase === "remote_completion_pending"
          ? "Automation Coordinator / 任务源"
          : snapshot.active_task ? "Runtime" : "Automation Coordinator"],
    ["并发边界", `${snapshot.concurrency?.active || 0} / ${snapshot.concurrency?.limit || 3} 工作区槽位；同工作区串行`]
  ]);
  els.projectBindingList.innerHTML = projects.length ? projects.map((project) => {
    const options = [
      `<option value="">未绑定</option>`,
      ...snapshot.local_projects.map((local) => `<option value="${escapeHtml(local.id)}" ${local.id === project.local_project_id ? "selected" : ""}>${escapeHtml(local.name)}</option>`),
      `<option value="__add_local_project__">＋ 添加本地项目…</option>`
    ].join("");
    const readinessLabel = project.source_status === "healthy"
      ? project.supplemental_status === "degraded" ? "已具备资格 · 标签同步降级" : "已具备资格"
      : project.source_status === "syncing" ? "正在恢复任务"
        : project.source_status === "error" ? "任务同步异常"
          : "任务尚未就绪";
    const qualification = !project.local_project_id ? "先绑定工作区" : project.participating ? readinessLabel : "尚未允许";
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
      if (localProjectId) await checkSetupReadinessForSelection(localProjectId);
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
  const tasks = state.snapshot.tasks.filter(scopedTaskFilter).filter((task) => !state.taskFilter || `${task.content} ${task.project_name} ${task.id}`.toLowerCase().includes(state.taskFilter));
  if (!tasks.length) {
    els.taskTable.innerHTML = `<div class="empty-state">当前筛选没有${STATE_LABELS[state.selectedState]}任务。</div>`;
    return;
  }
  els.taskTable.innerHTML = `<table class="data-table"><colgroup><col style="width:90px"><col><col style="width:130px"><col style="width:96px"><col style="width:86px"></colgroup><thead><tr><th>任务</th><th>内容</th><th>项目</th><th>更新时间</th><th>状态</th></tr></thead><tbody>${tasks.map((task) => `<tr class="${String(task.id) === String(state.selectedTaskId) ? "selected" : ""}" data-task-id="${escapeHtml(task.id)}"><td>${escapeHtml(task.id)}</td><td class="task-title-cell">${escapeHtml(displayTaskTitle(task))}</td><td>${escapeHtml(task.project_name)}</td><td>${formatTime(task.updated_at || task.state_changed_at)}</td><td><span class="status-pill ${task.state}">${escapeHtml(task.state_label)}</span></td></tr>`).join("")}</tbody></table>`;
  els.taskTable.querySelectorAll("[data-task-id]").forEach((row) => {
    wireSelectableRow(row, { selected: String(row.dataset.taskId) === String(state.selectedTaskId) });
    row.addEventListener("click", () => {
      state.selectedTaskId = row.dataset.taskId;
      renderTaskTable();
      renderTaskInspector();
    });
  });
}

function renderTaskInspector() {
  const task = selectedTask();
  if (!task) {
    els.taskInspector.innerHTML = `<div class="empty-state">选择任务查看详情与允许操作。</div>`;
    return;
  }
  const feedbackItems = task.acceptance_feedback_items || [];
  const acceptanceFeedback = task.state === "completed" ? `<section class="acceptance-feedback-panel"><div class="section-title-row"><div><h3>验收问题与进展</h3><p>${feedbackItems.length} 项验收问题</p></div></div><div class="acceptance-feedback-list">${feedbackItems.length ? feedbackItems.map((item) => `<button class="acceptance-feedback-item" data-task-feedback="${escapeHtml(item.feedback_id)}" type="button"><span><strong>${escapeHtml(item.original_feedback)}</strong><small>${escapeHtml(item.feedback_id)} · ${escapeHtml(item.progress)}</small></span><span class="status-pill ${feedbackTone(item.status)}">${escapeHtml(item.status)}</span></button>`).join("") : `<div class="empty-state compact">尚未发现验收问题。</div>`}</div><label class="acceptance-feedback-composer"><span>提出验收问题</span><textarea id="acceptanceFeedbackInput" rows="3" placeholder="描述验收中发现的问题…"></textarea><small>待办保持已完成；问题进入 Automation 独立队列并复用同一 Agent 对话。</small><button id="submitAcceptanceFeedbackButton" class="primary-button" type="button">提出验收问题</button></label></section>` : task.state === "accepted" ? `<section class="acceptance-feedback-panel acceptance-clear"><div class="section-title-row"><div><h3>验收通过</h3><p>当前没有待处理的验收问题</p></div></div><div class="empty-state compact">该待办已验收，不再接受新的验收问题。</div></section>` : "";
  els.taskInspector.innerHTML = `<h2>待办 ${escapeHtml(task.id)}</h2><p>${escapeHtml(task.content || "没有补充内容")}</p><span class="status-pill ${task.state}">${escapeHtml(task.state_label)}</span>${factRows([
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
  const transition = taskActionTransition(task, action);
  if (!transition) return;
  if (["cancel", "block", "resume"].includes(action) && !window.confirm(`确认将任务 ${task.id} 更新为${STATE_LABELS[transition[0]]}？`)) return;
  await api.updateAutomationTaskState({ taskId: task.id, state: transition[0], expectedState: transition[1] });
  await refreshSnapshot();
}

async function executeWorkTaskAction(task, automationTask, workspace, action) {
  if (action === "review") {
    if (task.state === "in_progress") {
      const target = workInspectorRuntimeNavigation(task, automationTask, workspace);
      if (target.destination === "recovery") return showPage("recovery");
      state.snapshot = await api.selectAutomationExecution(target.execution.execution_id);
      return openWorkbench("review", target.execution.run_id || "", { task: automationTask || task });
    }
    if (!automationTask) return;
    return executeTaskAction(automationTask, action);
  }
  const transition = taskActionTransition(task, action);
  if (!transition) return;
  if (["cancel", "block", "resume"].includes(action) && !window.confirm(`确认将任务 ${task.id} 更新为${STATE_LABELS[transition[0]]}？`)) return;
  const acceptanceSelection = action === "accept" ? workAcceptanceSelectionTarget(task.id) : "";
  const acceptanceSelectionIntentEpoch = action === "accept" ? state.platformTaskSelectionIntentEpoch : 0;
  const acceptanceSelectionContextEpoch = action === "accept" ? state.platformTaskSelectionContextEpoch : 0;
  const result = await executeManagedAction("task.update", {
    task_id: task.id,
    state: transition[0],
    expected_state: transition[1]
  }, `待办状态已更新为${STATE_LABELS[transition[0]] || transition[0]}`, { refresh: action !== "accept" });
  if (action === "accept" && acceptanceSelectionContextEpoch !== state.platformTaskSelectionContextEpoch) return result;
  if (action === "accept") {
    state.selectedPlatformTaskId = completedAcceptanceSelectionAfterSuccess({
      currentSelectedTaskId: state.selectedPlatformTaskId,
      adjacentTaskId: acceptanceSelection,
      acceptanceSelectionIntentEpoch,
      currentSelectionIntentEpoch: state.platformTaskSelectionIntentEpoch
    });
    await refreshWorkQuery().catch((error) => showToast(`待办已验收，但列表刷新失败：${error?.message || String(error)}`));
  }
  return result;
}

function workAcceptanceSelectionTarget(taskId) {
  const tasksById = new Map((state.workQuery.projection?.tasks || []).map((task) => [String(task.id), task]));
  const orderedVisibleTasks = [...els.platformWorkTable.querySelectorAll("[data-platform-task-select]")]
    .map((row) => tasksById.get(String(row.dataset.platformTaskSelect)))
    .filter(Boolean);
  return nextCompletedAcceptanceTaskId(orderedVisibleTasks, taskId);
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
  workbenchConversationSurface.followLatest();
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
  state.transcript = mergeAutomationTranscript({
    sessionMessages: state.transcriptSessionMessages,
    runs: state.transcriptRuns,
    taskId
  });
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
  els.workbenchTitle.textContent = sourceTask
    ? displayTaskTitle(sourceTask)
    : taskDisplayTitle(completion?.title || active?.task_title, "执行对话审查");
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
  const executionSummary = summarizeAutomationExecution(state.transcriptRuns.length ? state.transcriptRuns : run ? [run] : []);
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
  workbenchConversationSurface.render({
    messages: state.transcript,
    emptyHtml: `<div class="chat-empty"><strong>当前没有已加载的对话</strong><p>Runtime 产生用户、Agent、reasoning 或 tool 消息后会显示在这里；Automation 轮次与结构化结果保留在右栏。</p></div>`,
  });
  const automationMessages = state.transcript.filter((message) => !isConversationSurfaceMessageVisible(message));
  els.workbenchEvidence.innerHTML = `${renderAutomationExecutionOverview(executionSummary)}<section class="workbench-evidence-section"><h4>当前 Run 与证据</h4>${factRows([
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
  ])}</section>${renderAutomationPanelActivity(automationMessages)}`;
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

function renderAutomationExecutionOverview(summary) {
  const timeRange = summary.started_at
    ? `${formatDateTime(summary.started_at)} → ${summary.finished_at ? formatDateTime(summary.finished_at) : "执行中"}`
    : "尚无执行记录";
  const rounds = summary.gap_rounds.length
    ? summary.gap_rounds.map((round, index) => `<article class="gap-round-card status-${escapeHtml(round.status)}"><div class="gap-round-head"><span>GAP ${index + 1}</span><strong>${escapeHtml(round.selected_gap_id || `Round ${round.round_index || index + 1}`)}</strong><em>${escapeHtml(round.status)}</em></div><dl><div><dt>目标</dt><dd>${escapeHtml(round.goal || round.selection_summary || "本轮目标未记录")}</dd></div><div><dt>完成的工作</dt><dd>${escapeHtml(round.work_summary || "正在执行或旧版 Activity 未记录工作摘要")}</dd></div><div><dt>结果</dt><dd>${escapeHtml(round.outcome || "尚未 closeout")}</dd></div></dl><small>${escapeHtml(round.case_id || "Case 未记录")} · ${escapeHtml(round.started_at ? formatDateTime(round.started_at) : "开始时间未知")}${round.finished_at ? ` → ${escapeHtml(formatDateTime(round.finished_at))}` : ""}</small></article>`).join("")
    : `<div class="automation-overview-empty">尚未进入 gap round。</div>`;
  return `<section class="automation-execution-overview"><div class="automation-overview-title"><div><span>完整执行总览</span><strong>${summary.active ? "执行中" : "已收束"}</strong></div><em>${summary.gap_round_count} 轮 GAP</em></div><div class="automation-time-summary"><strong>${escapeHtml(formatDuration(summary.duration_ms))}</strong><small>${escapeHtml(timeRange)} · ${summary.run_count} 个 Run</small></div>${summary.complete_projection ? "" : `<p class="automation-projection-note">旧版 Run 仅能恢复最后一轮摘要；新 Run 会完整记录每轮 gap。</p>`}<div class="gap-round-list">${rounds}</div></section>`;
}

function renderAutomationPanelActivity(messages) {
  if (!messages.length) return `<section class="workbench-evidence-section"><h4>Automation 事件与结构化结果</h4><div class="automation-overview-empty">尚无面板专属事件。</div></section>`;
  return `<section class="workbench-evidence-section automation-panel-activity"><h4>Automation 事件与结构化结果</h4>${messages.map((message) => {
    const type = transcriptMessageType(message);
    if (type === "structured") return renderStructuredResult(message);
    if (type === "loop") return renderLoopStatus(message);
    return renderToolActivity(message);
  }).join("")}</section>`;
}

function renderRecovery() {
  const items = state.snapshot.recovery_items;
  if (!items.length) {
    els.recoveryList.innerHTML = `<div class="panel-card empty-state"><div><strong>没有待恢复事项</strong><p>服务器事实、本地 Runtime 与队列状态一致。</p></div></div>`;
    return;
  }
  const existingCards = new Map(
    [...els.recoveryList.querySelectorAll(":scope > [data-recovery-item]")]
      .map((card) => [card.dataset.recoveryItem, card])
  );
  items.forEach((item, index) => {
    const itemId = String(item.id);
    const card = existingCards.get(itemId) || createRecoveryCard(itemId);
    updateRecoveryCard(card, item);
    const currentCard = els.recoveryList.children[index];
    if (currentCard !== card) els.recoveryList.insertBefore(card, currentCard || null);
    existingCards.delete(itemId);
  });
  existingCards.forEach((card) => card.remove());
  [...els.recoveryList.children].slice(items.length).forEach((child) => child.remove());
}

function createRecoveryCard(itemId) {
  const card = document.createElement("article");
  card.className = "recovery-card";
  card.dataset.recoveryItem = itemId;
  card.innerHTML = `<div class="recovery-marker"></div><div class="recovery-body"><h2></h2><p></p><div class="recovery-meta"><span></span><span></span><span></span></div><div class="recovery-actions"></div></div>`;
  return card;
}

function updateRecoveryCard(card, item) {
  const itemId = String(item.id);
  const body = card.querySelector(".recovery-body");
  const meta = card.querySelectorAll(".recovery-meta span");
  card.dataset.recoveryItem = itemId;
  body.querySelector("h2").textContent = RECOVERY_LABELS[item.type] || item.type;
  body.querySelector(":scope > p").textContent = item.message;
  meta[0].textContent = `任务 ${item.task_id}`;
  meta[1].textContent = `冻结范围 ${item.freeze_scope}`;
  meta[2].textContent = `责任方 ${item.responsibility === "operator" ? "Runtime 操作员" : item.responsibility}`;

  let feedback = body.querySelector(":scope > .recovery-feedback");
  if (item.actions.includes("feedback_continue")) {
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "recovery-feedback";
      feedback.innerHTML = `<label>补充给 Agent 的说明</label><textarea rows="3" placeholder="补充事实、纠正方向或说明希望 Agent 如何继续…"></textarea><small>说明会发送到当前任务的同一 Agent 对话，并在对话页面保留。</small>`;
      body.insertBefore(feedback, body.querySelector(":scope > .recovery-actions"));
    }
    const textarea = feedback.querySelector("textarea");
    const inputId = `feedback-${itemId}`;
    feedback.querySelector("label").htmlFor = inputId;
    textarea.id = inputId;
    textarea.dataset.recoveryFeedback = itemId;
  } else {
    feedback?.remove();
  }

  const actions = body.querySelector(":scope > .recovery-actions");
  const buttons = item.actions.map((action) => {
    const button = document.createElement("button");
    button.className = action === "mark_blocked" ? "secondary-button" : "primary-button";
    button.dataset.recoveryId = itemId;
    button.dataset.recoveryAction = action;
    button.type = "button";
    button.textContent = RECOVERY_ACTION_LABELS[action] || action;
    return button;
  });
  actions.replaceChildren(...buttons);
}

async function resolveRecoveryAction(button) {
  const action = button.dataset.recoveryAction;
  if (action === "mark_blocked" && !window.confirm("标记阻塞会更新远端任务状态并释放活动任务。继续吗？")) return;
  const feedback = action === "feedback_continue"
    ? els.recoveryList.querySelector(`[data-recovery-feedback="${CSS.escape(button.dataset.recoveryId)}"]`)?.value || ""
    : "";
  await api.resolveAutomationRecovery({ recoveryId: button.dataset.recoveryId, action, message: feedback });
  await refreshSnapshot();
  if (action === "feedback_continue") await openWorkbench("review");
  else if (!state.snapshot.recovery_items.length) showPage("command");
}

function openTaskBrowser(taskState = "pending", taskId = "") {
  state.selectedState = TASK_STATES.includes(taskState) ? taskState : "pending";
  state.selectedTaskId = taskId;
  state.page = "tasks";
  refreshSnapshot().catch((error) => showToast(error.message));
}

function openWorkState(taskState = "pending") {
  state.selectedState = TASK_STATES.includes(taskState) ? taskState : "pending";
  setPlatformTaskSelectionIntent("");
  state.workQueryOffset = 0;
  state.page = "work";
  refreshWorkQuery().catch((error) => showToast(error.message));
}

function markPlatformTaskSelectionIntent() {
  state.platformTaskSelectionIntentEpoch += 1;
}

function setPlatformTaskSelectionIntent(taskId = "") {
  markPlatformTaskSelectionIntent();
  state.selectedPlatformTaskId = String(taskId || "");
}

function invalidatePlatformTaskSelectionContext() {
  state.platformTaskSelectionContextEpoch += 1;
  setPlatformTaskSelectionIntent("");
}

function showPage(page) {
  state.page = page;
  if (page === "chat") {
    renderPageVisibility();
    renderNavigation();
    renderCommandBar();
    renderChat();
    refreshChat().catch((error) => showToast(error.message));
    return;
  }
  if (page === "work") {
    renderPageVisibility();
    renderNavigation();
    renderCommandBar();
    renderWorkset();
    state.workQueryOffset = 0;
    refreshWorkQuery().catch((error) => showToast(error.message));
    return;
  }
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
    workQueryState.clear();
    state.workQuery = { key: "", projection: null, loading: false, error: "" };
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
      const taskName = taskDisplayTitle(result.active_task?.task_title, result.active_task?.task_id || "当前任务");
      const executionCount = result.active_executions?.length || 1;
      if (!window.confirm(`退出会安全停止 ${executionCount} 条活动执行（当前选择“${taskName}”）并清空远端项目快照，继续吗？`)) return;
      result = await api.logoutAuth({ confirm_active_task: true });
    }
    state.authentication = normalizeAuthentication(result.authentication);
    invalidatePlatformTaskSelectionContext();
    state.settings = normalizeSettings(await api.getSettings());
    state.snapshot = emptySnapshot();
    state.platform = emptyPlatformSnapshot();
    workQueryState.clear();
    state.workQuery = { key: "", projection: null, loading: false, error: "" };
    invalidateTaskAttachmentCaches(state, { clearPending: true });
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
  await api.syncWork();
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

function selectedSetupProjectId() {
  return String(currentProject()?.local_project_id || "");
}

async function checkSetupReadinessForSelection(projectId = selectedSetupProjectId(), { presentSetup = true } = {}) {
  state.setupActionError = "";
  resetSetupCleanupSelection();
  const readiness = await api.checkSetupReadiness(projectId ? { projectId } : undefined);
  if (projectId) state.todaySetupByProject[String(projectId)] = readiness;
  if (presentSetup) {
    state.setup = readiness;
    renderSetup();
  } else if (state.page === "today") renderToday();
  return readiness;
}

function resetSetupCleanupSelection() {
  state.setupCleanupPlanDigest = "";
  state.setupCleanupPaths = [];
  state.setupRecoveryAssessmentDigest = "";
  state.setupRecoveryPaths = [];
}

function syncSetupCleanupSelection(plan) {
  const digest = String(plan?.digest || "");
  if (state.setupCleanupPlanDigest === digest) return;
  state.setupCleanupPlanDigest = digest;
  state.setupCleanupPaths = [];
}

function syncSetupRecoverySelection(assessment) {
  const digest = String(assessment?.digest || "");
  if (state.setupRecoveryAssessmentDigest === digest) return;
  state.setupRecoveryAssessmentDigest = digest;
  state.setupRecoveryPaths = [];
}

function syncSetupReview(plan) {
  const digest = String(plan?.digest || "");
  if (state.setupReviewPlanDigest === digest) return;
  const previousDigest = state.setupReviewPlanDigest;
  state.setupReviewPlanDigest = digest;
  state.setupReviewPlanChanged = Boolean(previousDigest && digest);
  els.setupReviewed.checked = false;
  if (state.setupReviewPlanChanged) {
    window.requestAnimationFrame(() => els.setupPlanSummary.focus());
  }
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
  return `<div class="compact-row"><span><strong>${escapeHtml(displayTaskTitle(task))}</strong><small>${escapeHtml(task.project_name)} · ${escapeHtml(taskExecutorName(task))}</small></span><em class="status-pill ${escapeHtml(task.state)}">${escapeHtml(STATE_LABELS[task.state] || task.state)}</em></div>`;
}

function personName(value) {
  if (typeof value === "string") return value.trim();
  return String(value?.username || value?.name || value?.user?.username || value?.user?.name || "").trim();
}

function memberName(member) {
  return personName(member) || "成员姓名不可用";
}

function taskExecutorName(task) {
  const embeddedName = personName(task?.assignee);
  if (embeddedName) return embeddedName;
  const executorId = String(task?.executor_id || "").trim();
  if (!executorId) return "未分配";
  const projectId = String(task?.project_id || "");
  const member = [...(state.platform.members || []), ...(state.platform.project_members || [])]
    .find((item) => String(item.project_id || "") === projectId && String(item.user_id || "") === executorId);
  return personName(member) || "执行人姓名不可用";
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
  return rows.map(([label, value, options = {}]) => `<div class="fact-row${options.wide ? " is-wide" : ""}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value ?? "")}</strong></div>`).join("");
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

function workInspectorActions(task, automationTask, workspace, canManage) {
  const runtimeNavigation = task.state === "in_progress"
    ? workInspectorRuntimeNavigation(task, automationTask, workspace)
    : null;
  return taskActions({ ...task, acceptance_feedback_items: automationTask?.acceptance_feedback_items || [] })
    .filter((action) => action.id === "review" ? task.state === "in_progress" || Boolean(automationTask) : canManage)
    .map((action) => action.id === "review" && runtimeNavigation
      ? { ...action, label: runtimeNavigation.destination === "runtime" ? "打开运行" : "进入恢复中心" }
      : action);
}

function taskActionTransition(task, action) {
  return {
    confirm: ["pending", "pending_review"],
    accept: ["accepted", "completed"],
    cancel: ["cancelled", task.state],
    block: ["blocked", "in_progress"],
    resume: ["pending", "blocked"]
  }[action] || null;
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
  if (phase === "awaiting_human") {
    return [
      { label: "1 Automation 已暂停", state: "complete" },
      { label: "2 介入原因已记录", state: "complete" },
      { label: "3 需要人工介入", state: "active" },
      { label: "4 恢复同线程执行", state: "" }
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
    awaiting_human: "需要人工介入",
    closeout_starting: "准备同线程收尾",
    closeout_running: "同线程 Git 收尾",
    remote_completion_pending: "Case 已完成，等待远端收尾",
    completing: "完成写回",
    recovery: "需要人工介入 · 恢复自动化"
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

function realtimeStatusLabel(value = {}) {
  const status = typeof value === "string" ? value : value?.status;
  const mode = typeof value === "object" ? value?.mode : "unknown";
  if (status === "connected" && mode === "legacy") return "实时兼容连接";
  if (status === "connected" && mode === "mixed") return "实时混合连接";
  return {
    idle: "实时未订阅",
    connecting: "实时连接中",
    recovering: mode === "legacy" ? "兼容同步中" : "实时补取中",
    connected: "实时已连接",
    reconnecting: "实时重连中",
    degraded: "实时连接异常 · 可立即同步"
  }[status] || "实时未订阅";
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
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ${minutes % 60}m`;
}

function renderSyncing(active) {
  const busy = active || state.manualSyncing;
  els.syncButton.disabled = busy || !state.authentication.authenticated;
  els.syncButton.textContent = busy ? "…" : "↻";
  els.automationRefreshButton.disabled = busy || !state.authentication.authenticated;
  els.automationRefreshButton.textContent = busy ? "同步中…" : "立即同步";
}

async function syncAutomationNow() {
  if (state.manualSyncing || !state.authentication.authenticated) return;
  state.manualSyncing = true;
  renderSyncing(false);
  try {
    await api.syncWork();
    await refreshSnapshot({ quiet: true });
    showToast("Workshop 当前状态已同步。");
  } finally {
    state.manualSyncing = false;
    renderSyncing(false);
  }
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    console.error(error);
    if (!els.setupReadiness.classList.contains("hidden")) {
      state.setupActionError = error?.message || String(error);
      renderSetup();
    }
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
    credential_strategy: "operator-injected",
    configured: false,
    project_id: 0,
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

function normalizeChatSnapshot(value = {}) {
  const defaults = emptyChatSnapshot();
  return {
    generated_at: String(value.generated_at || ""),
    projects: Array.isArray(value.projects) ? value.projects.map((project) => ({ id: String(project.id || ""), name: String(project.name || "未命名项目") })).filter((project) => project.id) : [],
    sessions: Array.isArray(value.sessions) ? value.sessions.map((session) => ({
      id: String(session.id || ""),
      project_id: String(session.project_id || ""),
      title: String(session.title || "新对话"),
      status: String(session.status || "completed"),
      error: String(session.error || ""),
      retry_client_request_id: String(session.retry_client_request_id || ""),
      created_at: String(session.created_at || ""),
      updated_at: String(session.updated_at || session.created_at || "")
    })).filter((session) => session.id) : [],
    selected_session_id: String(value.selected_session_id || ""),
    messages: Array.isArray(value.messages) ? value.messages.map((message) => ({
      id: String(message.id || ""),
      role: String(message.role || "system"),
      kind: String(message.kind || "text"),
      content: String(message.content || ""),
      status: String(message.status || "completed"),
      approval_request_id: String(message.approval_request_id || ""),
      created_at: String(message.created_at || ""),
      updated_at: String(message.updated_at || message.created_at || "")
    })) : [],
    pending_approvals: Array.isArray(value.pending_approvals) ? value.pending_approvals.map((approval) => ({
      ...approval,
      id: String(approval.id || ""),
      session_id: String(approval.session_id || ""),
      project_id: String(approval.project_id || ""),
      approval_request_id: String(approval.approval_request_id || ""),
      content: String(approval.content || ""),
      status: String(approval.status || "pending")
    })) : [],
    draft: { ...defaults.draft, ...(value.draft || {}), project_id: String(value.draft?.project_id || ""), text: String(value.draft?.text || "") }
  };
}

function emptyChatSnapshot() {
  return { generated_at: "", projects: [], sessions: [], selected_session_id: "", messages: [], pending_approvals: [], draft: { project_id: "", text: "" } };
}

function emptySnapshot() {
  return {
    enabled: false,
    queue_paused: false,
    source_status: "logged_out",
    source_errors: [],
    realtime: { status: "idle", mode: "unknown", last_refreshed_at: "", projects: {} },
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
    active_executions: [],
    active_execution: null,
    active_task: null,
    active_run: null,
    selected_execution_id: "",
    concurrency: { limit: 3, active: 0, available: 3 },
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
    today_project_ids: [],
    ui_preferences: { work_inspector_width_px: WORK_INSPECTOR_DEFAULT_WIDTH, today: { selected_project_id: "all", selected_mode: "", selected_item_id: "", drafts: {} } },
    projects: [],
    organizations: [],
    organization_scopes: [],
    personal_projects: [],
    organization_members: [],
    project_members: [],
    product_workspaces: [],
    members: [],
    tasks: [],
    today_tasks: [],
    task_trees: [],
    task_replacements: [],
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
