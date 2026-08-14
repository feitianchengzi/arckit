const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("arckitDesktop", {
  getSetupReadiness: () => ipcRenderer.invoke("arckit:setup-status"),
  checkSetupReadiness: () => ipcRenderer.invoke("arckit:setup-check"),
  applySetupPlan: (input) => ipcRenderer.invoke("arckit:setup-apply", input),
  planSetupRemoval: (managedPaths) => ipcRenderer.invoke("arckit:setup-removal-plan", managedPaths),
  removeManagedSetupPaths: (input) => ipcRenderer.invoke("arckit:setup-remove", input),
  continueFromSetup: () => ipcRenderer.invoke("arckit:setup-continue"),
  pickProject: () => ipcRenderer.invoke("arckit:pick-project"),
  listRuns: (filter) => ipcRenderer.invoke("arckit:list-runs", filter),
  listMessages: (projectId, sessionId) => ipcRenderer.invoke("arckit:list-messages", projectId, sessionId),
  getSettings: () => ipcRenderer.invoke("arckit:get-settings"),
  updateSettings: (input) => ipcRenderer.invoke("arckit:update-settings", input),
  getAuthStatus: () => ipcRenderer.invoke("arckit:auth-status"),
  sendAuthVerification: (input) => ipcRenderer.invoke("arckit:auth-send-verification", input),
  loginWithCode: (input) => ipcRenderer.invoke("arckit:auth-login", input),
  logoutAuth: (input) => ipcRenderer.invoke("arckit:auth-logout", input),
  automationSnapshot: (filter) => ipcRenderer.invoke("arckit:automation-snapshot", filter),
  syncAutomation: () => ipcRenderer.invoke("arckit:automation-sync"),
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
  stopAutomationRun: () => ipcRenderer.invoke("arckit:automation-stop"),
  handoffAutomationToCli: () => ipcRenderer.invoke("arckit:automation-handoff-cli"),
  reopenAutomationCli: () => ipcRenderer.invoke("arckit:automation-reopen-cli"),
  resumeAutomationRuntime: () => ipcRenderer.invoke("arckit:automation-resume-runtime"),
  resolveAutomationRecovery: (input) => ipcRenderer.invoke("arckit:automation-recovery", input),
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
  onSetupEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:setup-event", handler);
    return () => ipcRenderer.off("arckit:setup-event", handler);
  }
});
