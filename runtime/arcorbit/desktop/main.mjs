import { app, BrowserWindow, dialog, ipcMain, shell, utilityProcess, WebContentsView } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDesktopRunManager } from "../src/desktop-run-manager.mjs";
import { createAutomationCoordinator } from "../src/automation-coordinator.mjs";
import { createCodexExecutableResolver } from "../src/codex-executable-resolver.mjs";
import { createInteractiveCodexCliLauncher } from "../src/interactive-cli-launcher.mjs";
import { createPlatformCoordinator } from "../src/platform-coordinator.mjs";
import { createSkillProvisioningManager } from "../src/skill-provisioning-manager.mjs";
import { createWorkshopTaskSource } from "../src/task-source-adapter.mjs";
import { canonicalArcOrbitUserDataPath } from "../src/desktop-user-data.mjs";
import { createElectronUtilityRuntimeHost } from "../src/electron-utility-runtime-host.mjs";
import { createProductFeedbackService } from "../src/product-feedback-service.mjs";
import { createProductFeedbackSurface } from "../src/product-feedback-window.mjs";
import { requireFeedbackAttachmentUrl } from "../src/feedback-attachment-url.mjs";
import { installMainWindowNavigationBoundary } from "../src/desktop-navigation-boundary.mjs";

const desktopDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = dirname(desktopDir);

app.setPath("userData", canonicalArcOrbitUserDataPath(app.getPath("appData")));

let mainWindow;
let runManager;
let automationCoordinator;
let platformCoordinator;
let workshopService;
let skillProvisioningManager;
let productFeedbackService;
let quitAfterCleanup = false;
let syncTimer;
let productFeedbackUnreadTimer;
let automationStarted = false;

app.whenReady().then(async () => {
  const codexExecutableResolver = createCodexExecutableResolver();
  const runtimeHost = createElectronUtilityRuntimeHost(utilityProcess);
  if (process.argv.includes("--runtime-host-smoke")) {
    await runRuntimeHostSmoke(runtimeHost);
    return;
  }
  runManager = createDesktopRunManager({
    runtimeRoot,
    runtimeCwd: app.isPackaged ? process.resourcesPath : runtimeRoot,
    dataDir: join(app.getPath("userData"), "runtime"),
    runtimeHost,
    getCodexExecutable: () => codexExecutableResolver.getResolved()
  });
  workshopService = createWorkshopTaskSource({
    readSettings: () => runManager.getTaskSourceSettings(),
    saveSettings: (settings) => runManager.replaceTaskSourceSettings(settings)
  });
  const productFeedbackSurface = createProductFeedbackSurface({
    BrowserWindow,
    WebContentsView,
    shellFile: join(desktopDir, "product-feedback/index.html"),
    shellPreload: join(desktopDir, "product-feedback/preload.cjs"),
    getParentWindow: () => mainWindow,
    onUnreadCount: (count) => productFeedbackService?.acceptUnreadCount(count)
  });
  productFeedbackService = createProductFeedbackService({
    getAuthStatus: () => workshopService.getAuthStatus(),
    getCurrentUser: () => workshopService.getCurrentUser(),
    surface: productFeedbackSurface
  });
  productFeedbackService.onUnreadCount((count) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:product-feedback-unread", count);
  });
  const resourcesRoot = app.isPackaged ? process.resourcesPath : join(runtimeRoot, "dist-package", "resources");
  skillProvisioningManager = createSkillProvisioningManager({
    resourcesRoot,
    dataRoot: app.getPath("userData"),
    codexProbe: () => codexExecutableResolver.probe()
  });
  automationCoordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: () => workshopService,
    setupReadinessPreflight: () => skillProvisioningManager.assertReady(),
    cliLauncher: createInteractiveCodexCliLauncher({
      getCodexExecutable: () => codexExecutableResolver.getResolved()
    })
  });
  platformCoordinator = createPlatformCoordinator({
    runManager,
    platformSource: workshopService.platform,
    automationCoordinator
  });
  runManager.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("arckit:event", event);
    }
  });
  automationCoordinator.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("arckit:automation-event", event);
    }
  });
  skillProvisioningManager.onEvent((readiness) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("arckit:setup-event", readiness);
    }
  });
  registerIpc();
  const rendererLoadSmoke = process.argv.includes("--renderer-load-smoke");
  await createWindow({ show: !rendererLoadSmoke });
  if (rendererLoadSmoke) {
    await runRendererLoadSmoke();
    return;
  }
  startProductFeedbackUnreadSync();
  const readiness = await skillProvisioningManager.check();
  if (readiness.status === "ready" && !readiness.first_install) {
    startAutomation();
  }
}).catch((error) => {
  console.error("ArcOrbit startup failed:", error);
  app.exit(1);
});

async function runRuntimeHostSmoke(runtimeHost) {
  const runtimeBin = join(runtimeRoot, "bin/arcorbit.mjs");
  const projectOptionIndex = process.argv.indexOf("--runtime-host-smoke-project");
  const projectRoot = projectOptionIndex >= 0 ? process.argv[projectOptionIndex + 1] : "";
  if (projectOptionIndex >= 0 && !projectRoot) throw new Error("--runtime-host-smoke-project requires a path.");
  const runtimeArgs = projectRoot
    ? ["init-project", "--project", projectRoot, "--name", "ArcOrbit Runtime Host Smoke", "--intent", "Verify packaged utility Runtime and trusted ledger APIs."]
    : ["help"];
  const child = runtimeHost.spawn(runtimeBin, runtimeArgs, {
    cwd: app.isPackaged ? process.resourcesPath : runtimeRoot,
    env: { ...process.env }
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  await new Promise((resolvePromise, rejectPromise) => {
    child.on("error", rejectPromise);
    child.on("close", (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(stderr || `Utility Runtime exited with ${code}.`)));
  });
  process.stdout.write(`${JSON.stringify({ schema_version: "arcorbit-runtime-host-smoke/v1", status: "passed", command: runtimeArgs[0], runtime_output: stdout.trim() })}\n`);
  app.quit();
}

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
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
    if (productFeedbackUnreadTimer) {
      clearInterval(productFeedbackUnreadTimer);
      productFeedbackUnreadTimer = null;
    }
    automationCoordinator?.dispose();
    productFeedbackService?.close();
    await skillProvisioningManager?.waitForIdle();
    await runManager.abortActiveRuns({
      reason: "ArcOrbit is quitting; active runs were aborted."
    });
  } catch (error) {
    console.error("Failed to abort active runs during Desktop shutdown:", error);
  } finally {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => {
      console.error("ArcOrbit window restoration failed:", error);
    });
  }
});

async function createWindow({ show = true } = {}) {
  mainWindow = new BrowserWindow({
    show,
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 700,
    title: "ArcOrbit",
    backgroundColor: "#f7f8fa",
    webPreferences: {
      preload: join(desktopDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const rendererEntry = join(desktopDir, "renderer/index.html");
  const rendererUrl = pathToFileURL(rendererEntry).href;
  installMainWindowNavigationBoundary(mainWindow.webContents, rendererUrl);
  await mainWindow.loadFile(rendererEntry);
}

async function runRendererLoadSmoke() {
  const snapshot = await mainWindow.webContents.executeJavaScript(`({
    title: document.title,
    preload_api: Boolean(window.arckitDesktop?.getSetupReadiness),
    setup_surface: Boolean(document.getElementById("setupReadiness")),
    stylesheet_count: document.styleSheets.length
  })`);
  if (snapshot.title !== "ArcOrbit" || !snapshot.preload_api || !snapshot.setup_surface || snapshot.stylesheet_count < 1) {
    throw new Error(`Packaged Renderer load smoke failed: ${JSON.stringify(snapshot)}`);
  }
  process.stdout.write(`${JSON.stringify({ schema_version: "arcorbit-renderer-load-smoke/v1", status: "passed", ...snapshot })}\n`);
  app.quit();
}

function registerIpc() {
  ipcMain.handle("arckit:setup-status", async () => skillProvisioningManager.getSnapshot());
  ipcMain.handle("arckit:setup-check", async () => skillProvisioningManager.check());
  ipcMain.handle("arckit:setup-apply", async (_event, input) => skillProvisioningManager.apply(input));
  ipcMain.handle("arckit:setup-recover-upgrade", async (_event, input) => skillProvisioningManager.recoverSourceUpgrade(input));
  ipcMain.handle("arckit:setup-removal-plan", async (_event, managedPaths) => skillProvisioningManager.planManagedRemoval(managedPaths));
  ipcMain.handle("arckit:setup-remove", async (_event, input) => skillProvisioningManager.removeManaged(input));
  ipcMain.handle("arckit:setup-continue", async () => {
    const readiness = skillProvisioningManager.getSnapshot();
    if (readiness.status !== "ready") throw new Error("Arckit Setup Readiness is not ready.");
    startAutomation();
    return readiness;
  });
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

  ipcMain.handle("arckit:list-runs", async (_event, filter) => runManager.listRuns(filter));
  ipcMain.handle("arckit:list-messages", async (_event, projectId, sessionId) => runManager.listMessages(projectId, sessionId));
  ipcMain.handle("arckit:get-settings", async () => runManager.getSettings());
  ipcMain.handle("arckit:update-settings", async (_event, input) => runManager.updateSettings(input));
  ipcMain.handle("arckit:product-feedback-status", async () => productFeedbackService.getStatus());
  ipcMain.handle("arckit:product-feedback-open", async (_event, mode) => productFeedbackService.open(mode));
  ipcMain.handle("arckit:product-feedback-refresh-unread", async () => productFeedbackService.refreshUnread());
  ipcMain.handle("arckit:product-feedback-mode", async (_event, mode) => productFeedbackService.switchMode(mode));
  ipcMain.handle("arckit:product-feedback-retry", async () => productFeedbackService.retry());
  ipcMain.handle("arckit:product-feedback-close", async () => productFeedbackService.close());
  ipcMain.handle("arckit:auth-status", async () => workshopService.getAuthStatus());
  ipcMain.handle("arckit:auth-send-verification", async (_event, input) => workshopService.sendVerification(input));
  ipcMain.handle("arckit:auth-login", async (_event, input) => {
    const authentication = await workshopService.loginWithCode(input);
    await automationCoordinator.sync();
    productFeedbackService.refreshUnread().catch(() => {});
    return authentication;
  });
  ipcMain.handle("arckit:auth-logout", async (_event, input = {}) => {
    const snapshot = await automationCoordinator.getSnapshot();
    if (snapshot.active_task && !input.confirm_active_task) {
      return {
        requires_confirmation: true,
        active_task: snapshot.active_task,
        authentication: await workshopService.getAuthStatus()
      };
    }
    if (snapshot.active_task) {
      await automationCoordinator.stopCurrent();
    }
    const authentication = await workshopService.logout();
    productFeedbackService.resetSession();
    await automationCoordinator.clearRemoteSession();
    return { requires_confirmation: false, authentication };
  });
  ipcMain.handle("arckit:automation-snapshot", async (_event, filter) => automationCoordinator.getSnapshot(filter));
  ipcMain.handle("arckit:automation-sync", async () => automationCoordinator.sync());
  ipcMain.handle("arckit:automation-enabled", async (_event, enabled) => automationCoordinator.setEnabled(enabled));
  ipcMain.handle("arckit:automation-pause", async (_event, paused) => automationCoordinator.setQueuePaused(paused));
  ipcMain.handle("arckit:automation-bind-project", async (_event, remoteProjectId, localProjectId) => (
    automationCoordinator.bindProject(remoteProjectId, localProjectId)
  ));
  ipcMain.handle("arckit:automation-project-participation", async (_event, remoteProjectId, participating) => (
    automationCoordinator.setProjectParticipation(remoteProjectId, participating)
  ));
  ipcMain.handle("arckit:automation-task-state", async (_event, input) => automationCoordinator.updateTaskState(input));
  ipcMain.handle("arckit:automation-intervene", async (_event, input) => automationCoordinator.submitIntervention(input));
  ipcMain.handle("arckit:automation-acceptance-feedback", async (_event, input) => automationCoordinator.submitAcceptanceFeedback(input));
  ipcMain.handle("arckit:automation-stop", async () => automationCoordinator.stopCurrent());
  ipcMain.handle("arckit:automation-handoff-cli", async () => automationCoordinator.handoffToCodexCli());
  ipcMain.handle("arckit:automation-reopen-cli", async () => automationCoordinator.reopenCodexCli());
  ipcMain.handle("arckit:automation-resume-runtime", async () => automationCoordinator.resumeRuntimeFromCodexCli());
  ipcMain.handle("arckit:automation-recovery", async (_event, input) => automationCoordinator.resolveRecovery(input));
  ipcMain.handle("arckit:platform-snapshot", async (_event, input) => platformCoordinator.getSnapshot(input));
  ipcMain.handle("arckit:platform-workset-create", async (_event, input) => platformCoordinator.createWorkset(input));
  ipcMain.handle("arckit:platform-workset-update", async (_event, input) => platformCoordinator.updateWorkset(input));
  ipcMain.handle("arckit:platform-workset-delete", async (_event, worksetId) => platformCoordinator.deleteWorkset(worksetId));
  ipcMain.handle("arckit:platform-workset-active", async (_event, worksetId) => platformCoordinator.setActiveWorkset(worksetId));
  ipcMain.handle("arckit:platform-workspace-preference", async (_event, projectId, input) => (
    platformCoordinator.setWorkspacePreference(projectId, input)
  ));
  ipcMain.handle("arckit:platform-action", async (_event, command, input) => platformCoordinator.executeAction(command, input));
  ipcMain.handle("arckit:feedback-attachment-open", async (event, value) => {
    if (event.sender !== mainWindow?.webContents) throw new Error("Feedback attachments can only be opened from the main ArcOrbit window.");
    const url = requireFeedbackAttachmentUrl(value);
    await shell.openExternal(url);
    return { opened: true };
  });
}

function startAutomation() {
  if (automationStarted) return;
  automationStarted = true;
  automationCoordinator.sync({ resumeRecoverable: true }).catch((error) => console.error("Initial task sync failed:", error));
  syncTimer = setInterval(() => {
    automationCoordinator.sync().catch((error) => console.error("Background task sync failed:", error));
  }, 60_000);
}

function startProductFeedbackUnreadSync() {
  if (productFeedbackUnreadTimer) return;
  productFeedbackService.refreshUnread().catch(() => {});
  productFeedbackUnreadTimer = setInterval(() => {
    productFeedbackService.refreshUnread().catch(() => {});
  }, 60_000);
}
