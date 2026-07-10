import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDesktopRunManager } from "../src/desktop-run-manager.mjs";

const desktopDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = dirname(desktopDir);

let mainWindow;
let runManager;
let quitAfterCleanup = false;

app.whenReady().then(async () => {
  runManager = createDesktopRunManager({
    runtimeRoot,
    dataDir: join(app.getPath("userData"), "runtime")
  });
  registerIpc();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  if (quitAfterCleanup || !runManager) {
    return;
  }
  event.preventDefault();
  quitAfterCleanup = true;
  try {
    await runManager.abortActiveRuns({
      reason: "Arckit Desktop is quitting; active runs were aborted."
    });
  } catch (error) {
    console.error("Failed to abort active runs during Desktop shutdown:", error);
  } finally {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 700,
    title: "Arckit Desktop",
    backgroundColor: "#f7f8fa",
    webPreferences: {
      preload: join(desktopDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  runManager.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("arckit:event", event);
    }
  });

  mainWindow.loadFile(join(desktopDir, "renderer/index.html"));
}

function registerIpc() {
  ipcMain.handle("arckit:runtime-info", async () => ({
    runtimeRoot,
    userData: app.getPath("userData")
  }));

  ipcMain.handle("arckit:pick-project", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select a local project"
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return runManager.addProject(result.filePaths[0]);
  });

  ipcMain.handle("arckit:add-project", async (_event, projectPath) => runManager.addProject(projectPath));
  ipcMain.handle("arckit:list-projects", async () => runManager.listProjects());
  ipcMain.handle("arckit:remove-project", async (_event, projectId) => runManager.removeProject(projectId));
  ipcMain.handle("arckit:project-status", async (_event, projectId) => runManager.getProjectStatus(projectId));
  ipcMain.handle("arckit:list-runs", async () => runManager.listRuns());
  ipcMain.handle("arckit:list-sessions", async (_event, projectId) => runManager.listSessions(projectId));
  ipcMain.handle("arckit:create-session", async (_event, projectId, input) => runManager.createSession(projectId, input));
  ipcMain.handle("arckit:list-messages", async (_event, projectId, sessionId) => runManager.listMessages(projectId, sessionId));
  ipcMain.handle("arckit:add-message", async (_event, projectId, message) => runManager.addMessage(projectId, message));
  ipcMain.handle("arckit:get-settings", async () => runManager.getSettings());
  ipcMain.handle("arckit:update-settings", async (_event, input) => runManager.updateSettings(input));
  ipcMain.handle("arckit:start-run", async (_event, input) => runManager.startRun(input));
  ipcMain.handle("arckit:control-run", async (_event, runId, control) => runManager.controlRun(runId, control));
  ipcMain.handle("arckit:gate-run", async (_event, runId) => runManager.gateRun(runId));
  ipcMain.handle("arckit:write-ledger", async (_event, runId, options) => runManager.writeLedgerForRun(runId, options));
}
