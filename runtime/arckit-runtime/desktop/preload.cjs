const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("arckitDesktop", {
  runtimeInfo: () => ipcRenderer.invoke("arckit:runtime-info"),
  pickProject: () => ipcRenderer.invoke("arckit:pick-project"),
  addProject: (projectPath) => ipcRenderer.invoke("arckit:add-project", projectPath),
  listProjects: () => ipcRenderer.invoke("arckit:list-projects"),
  removeProject: (projectId) => ipcRenderer.invoke("arckit:remove-project", projectId),
  projectStatus: (projectId) => ipcRenderer.invoke("arckit:project-status", projectId),
  listRuns: () => ipcRenderer.invoke("arckit:list-runs"),
  listSessions: (projectId) => ipcRenderer.invoke("arckit:list-sessions", projectId),
  createSession: (projectId, input) => ipcRenderer.invoke("arckit:create-session", projectId, input),
  listMessages: (projectId, sessionId) => ipcRenderer.invoke("arckit:list-messages", projectId, sessionId),
  addMessage: (projectId, message) => ipcRenderer.invoke("arckit:add-message", projectId, message),
  getSettings: () => ipcRenderer.invoke("arckit:get-settings"),
  updateSettings: (input) => ipcRenderer.invoke("arckit:update-settings", input),
  startRun: (input) => ipcRenderer.invoke("arckit:start-run", input),
  controlRun: (runId, control) => ipcRenderer.invoke("arckit:control-run", runId, control),
  gateRun: (runId) => ipcRenderer.invoke("arckit:gate-run", runId),
  writeLedger: (runId, options) => ipcRenderer.invoke("arckit:write-ledger", runId, options),
  onEvent: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("arckit:event", handler);
    return () => ipcRenderer.off("arckit:event", handler);
  }
});
