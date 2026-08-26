const { contextBridge, ipcRenderer } = require("electron");

// The main window uses Electron's sandboxed preload runtime. Keep this file
// self-contained because the sandbox require shim cannot load relative files.
const FEEDBACK_V2_RESULT_VERSION = "feedback-v2-ipc-result/v1";

function unwrapFeedbackV2Ipc(result) {
  if (!result || result.version !== FEEDBACK_V2_RESULT_VERSION || typeof result.ok !== "boolean") {
    throw Object.assign(new Error("Feedback V2 IPC result is invalid."), { code: "feedback_v2_ipc_contract_invalid" });
  }
  if (result.ok) return result.value;
  const payload = result.error && typeof result.error === "object" ? result.error : {};
  const error = new Error(boundedText(payload.message || "Feedback V2 request failed.", 1000));
  error.code = boundedText(payload.code || "feedback_v2_request_failed", 100);
  const status = httpStatus(payload.status);
  if (status) error.status = status;
  throw error;
}

function boundedText(value, limit) {
  return String(value || "").slice(0, limit);
}

function httpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
}

const invokeFeedbackV2 = (channel, input) => ipcRenderer.invoke(channel, input).then(unwrapFeedbackV2Ipc);

contextBridge.exposeInMainWorld("arckitDesktop", {
  windowControlMode: process.platform === "darwin" ? "native-macos" : "custom",
  getWindowState: () => ipcRenderer.invoke("arckit:window-state"),
  minimizeWindow: () => ipcRenderer.invoke("arckit:window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("arckit:window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("arckit:window-close"),
  getSetupReadiness: () => ipcRenderer.invoke("arckit:setup-status"),
  checkSetupReadiness: (input) => ipcRenderer.invoke("arckit:setup-check", input),
  applySetupPlan: (input) => ipcRenderer.invoke("arckit:setup-apply", input),
  recoverSetupUpgrade: (input) => ipcRenderer.invoke("arckit:setup-recover-upgrade", input),
  planSetupRemoval: (managedPaths) => ipcRenderer.invoke("arckit:setup-removal-plan", managedPaths),
  removeManagedSetupPaths: (input) => ipcRenderer.invoke("arckit:setup-remove", input),
  confirmCodexSetup: (input) => ipcRenderer.invoke("arckit:codex-setup-confirm", input),
  installCodex: (input) => ipcRenderer.invoke("arckit:codex-setup-install", input),
  updateCodex: (input) => ipcRenderer.invoke("arckit:codex-setup-update", input),
  migrateCodexToStandalone: (input) => ipcRenderer.invoke("arckit:codex-setup-migrate", input),
  loginCodex: (input) => ipcRenderer.invoke("arckit:codex-setup-login", input),
  loginCodexWithSecret: (input) => ipcRenderer.invoke("arckit:codex-setup-login-secret", input),
  cancelCodexSetup: (input) => ipcRenderer.invoke("arckit:codex-setup-cancel", input),
  logoutCodex: (input) => ipcRenderer.invoke("arckit:codex-setup-logout", input),
  recheckCodexSetup: () => ipcRenderer.invoke("arckit:codex-setup-recheck"),
  continueFromSetup: () => ipcRenderer.invoke("arckit:setup-continue"),
  pickProject: () => ipcRenderer.invoke("arckit:pick-project"),
  listRuns: (filter) => ipcRenderer.invoke("arckit:list-runs", filter),
  listMessages: (projectId, sessionId) => ipcRenderer.invoke("arckit:list-messages", projectId, sessionId),
  chatSnapshot: (input) => ipcRenderer.invoke("arckit:chat-snapshot", input),
  createChat: (input) => ipcRenderer.invoke("arckit:chat-create", input),
  selectChat: (input) => ipcRenderer.invoke("arckit:chat-select", input),
  renameChat: (input) => ipcRenderer.invoke("arckit:chat-rename", input),
  deleteChat: (input) => ipcRenderer.invoke("arckit:chat-delete", input),
  sendChatMessage: (input) => ipcRenderer.invoke("arckit:chat-send", input),
  interruptChat: (input) => ipcRenderer.invoke("arckit:chat-interrupt", input),
  decideChatApproval: (input) => ipcRenderer.invoke("arckit:chat-approval-decision", input),
  getSettings: () => ipcRenderer.invoke("arckit:get-settings"),
  updateSettings: (input) => ipcRenderer.invoke("arckit:update-settings", input),
  getProductFeedbackStatus: () => ipcRenderer.invoke("arckit:product-feedback-status"),
  openProductFeedback: (mode) => ipcRenderer.invoke("arckit:product-feedback-open", mode),
  refreshProductFeedbackUnread: () => ipcRenderer.invoke("arckit:product-feedback-refresh-unread"),
  getAuthStatus: () => ipcRenderer.invoke("arckit:auth-status"),
  sendAuthVerification: (input) => ipcRenderer.invoke("arckit:auth-send-verification", input),
  loginWithCode: (input) => ipcRenderer.invoke("arckit:auth-login", input),
  logoutAuth: (input) => ipcRenderer.invoke("arckit:auth-logout", input),
  automationSnapshot: (filter) => ipcRenderer.invoke("arckit:automation-snapshot", filter),
  selectAutomationExecution: (executionId) => ipcRenderer.invoke("arckit:automation-select-execution", executionId),
  syncAutomation: () => ipcRenderer.invoke("arckit:automation-sync"),
  syncWork: () => ipcRenderer.invoke("arckit:work-sync"),
  setAutomationEnabled: (enabled) => ipcRenderer.invoke("arckit:automation-enabled", enabled),
  setQueuePaused: (paused) => ipcRenderer.invoke("arckit:automation-pause", paused),
  bindAutomationProject: (remoteProjectId, localProjectId) => (
    ipcRenderer.invoke("arckit:automation-bind-project", remoteProjectId, localProjectId)
  ),
  setProjectParticipation: (remoteProjectId, participating) => (
    ipcRenderer.invoke("arckit:automation-project-participation", remoteProjectId, participating)
  ),
  updateAutomationTaskState: (input) => ipcRenderer.invoke("arckit:automation-task-state", input),
  submitIntervention: (input) => ipcRenderer.invoke("arckit:automation-intervene", input),
  submitAcceptanceFeedback: (input) => ipcRenderer.invoke("arckit:automation-acceptance-feedback", input),
  stopAutomationRun: (input) => ipcRenderer.invoke("arckit:automation-stop", input),
  handoffAutomationToCli: (input) => ipcRenderer.invoke("arckit:automation-handoff-cli", input),
  reopenAutomationCli: (input) => ipcRenderer.invoke("arckit:automation-reopen-cli", input),
  resumeAutomationRuntime: (input) => ipcRenderer.invoke("arckit:automation-resume-runtime", input),
  resolveAutomationRecovery: (input) => ipcRenderer.invoke("arckit:automation-recovery", input),
  platformSnapshot: (input) => ipcRenderer.invoke("arckit:platform-snapshot", input),
  platformWorkQuery: (input) => ipcRenderer.invoke("arckit:platform-work-query", input),
  createWorkset: (input) => ipcRenderer.invoke("arckit:platform-workset-create", input),
  updateWorkset: (input) => ipcRenderer.invoke("arckit:platform-workset-update", input),
  deleteWorkset: (worksetId) => ipcRenderer.invoke("arckit:platform-workset-delete", worksetId),
  setActiveWorkset: (worksetId) => ipcRenderer.invoke("arckit:platform-workset-active", worksetId),
  setWorkspacePreference: (projectId, input) => (
    ipcRenderer.invoke("arckit:platform-workspace-preference", projectId, input)
  ),
  setWorkInspectorWidth: (widthPx) => ipcRenderer.invoke("arckit:platform-work-inspector-width", widthPx),
  executePlatformAction: (command, input) => ipcRenderer.invoke("arckit:platform-action", command, input),
  getFeedbackV2Messages: (input) => invokeFeedbackV2("arckit:feedback-v2-messages", input),
  sendFeedbackV2Reply: (input) => invokeFeedbackV2("arckit:feedback-v2-reply", input),
  markFeedbackV2Read: (input) => invokeFeedbackV2("arckit:feedback-v2-read", input),
  ignoreFeedbackV2: (input) => invokeFeedbackV2("arckit:feedback-v2-ignore", input),
  updateFeedbackV2: (input) => invokeFeedbackV2("arckit:feedback-v2-update", input),
  deleteFeedbackV2: (input) => invokeFeedbackV2("arckit:feedback-v2-delete", input),
  convertFeedbackV2ToTask: (input) => invokeFeedbackV2("arckit:feedback-v2-convert", input),
  openFeedbackV2Attachment: (input) => invokeFeedbackV2("arckit:feedback-v2-attachment-open", input),
  openFeedbackAttachment: (value) => ipcRenderer.invoke("arckit:feedback-attachment-open", value),
  previewImage: (input) => ipcRenderer.invoke("arckit:image-preview", input),
  openImageViewer: (input) => ipcRenderer.invoke("arckit:image-viewer-open", input),
  openWorkExternalLink: (value) => ipcRenderer.invoke("arckit:work-external-link-open", value),
  pickWorkTaskAttachment: (input) => ipcRenderer.invoke("arckit:work-task-attachment-pick", input),
  previewWorkTaskAttachment: (input) => ipcRenderer.invoke("arckit:work-task-attachment-preview", input),
  openWorkTaskAttachment: (input) => ipcRenderer.invoke("arckit:work-task-attachment-open", input),
  onWindowState: (listener) => {
    const handler = (_event, state) => listener(state);
    ipcRenderer.on("arckit:window-state-changed", handler);
    return () => ipcRenderer.off("arckit:window-state-changed", handler);
  },
  onProductFeedbackUnread: (listener) => {
    const handler = (_event, count) => listener(count);
    ipcRenderer.on("arckit:product-feedback-unread", handler);
    return () => ipcRenderer.off("arckit:product-feedback-unread", handler);
  },
  onEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:event", handler);
    return () => ipcRenderer.off("arckit:event", handler);
  },
  onAutomationEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:automation-event", handler);
    return () => ipcRenderer.off("arckit:automation-event", handler);
  },
  onWorkSyncEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:work-sync-event", handler);
    return () => ipcRenderer.off("arckit:work-sync-event", handler);
  },
  onChatEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:chat-event", handler);
    return () => ipcRenderer.off("arckit:chat-event", handler);
  },
  onSetupEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:setup-event", handler);
    return () => ipcRenderer.off("arckit:setup-event", handler);
  }
});
