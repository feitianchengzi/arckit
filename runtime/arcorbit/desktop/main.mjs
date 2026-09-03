import { app, BrowserWindow, dialog, ipcMain, powerMonitor, session, shell, utilityProcess, WebContentsView } from "electron";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDesktopRunManager } from "../src/desktop-run-manager.mjs";
import { createChatCoordinator } from "../src/chat-coordinator.mjs";
import { createAutomationCoordinator } from "../src/automation-coordinator.mjs";
import { createCodexExecutableResolver } from "../src/codex-executable-resolver.mjs";
import { activeCodexOwnersFromStore, codexProbeFromSetupSnapshot, createCodexSetupManager, runControlledProcess } from "../src/codex-setup-manager.mjs";
import {
  buildCodexSetupNetworkEnv,
  createCodexUpdateChecker,
  inspectCodexOwnerCapabilities,
  resolveCodexInstallationOwners
} from "../src/codex-installation-lifecycle.mjs";
import { createCodexOwnerReceiptStore } from "../src/codex-owner-receipt-store.mjs";
import { createInteractiveCodexCliLauncher } from "../src/interactive-cli-launcher.mjs";
import { createPlatformCoordinator } from "../src/platform-coordinator.mjs";
import { createSkillProvisioningManager } from "../src/skill-provisioning-manager.mjs";
import { createWorkshopTaskSource } from "../src/task-source-adapter.mjs";
import { canonicalArcOrbitUserDataPath } from "../src/desktop-user-data.mjs";
import { createElectronUtilityRuntimeHost } from "../src/electron-utility-runtime-host.mjs";
import { createProductFeedbackService } from "../src/product-feedback-service.mjs";
import { createProductFeedbackSurface } from "../src/product-feedback-window.mjs";
import { requireFeedbackAttachmentUrl } from "../src/feedback-attachment-url.mjs";
import { requireWorkExternalLinkUrl } from "../src/work-external-link.mjs";
import { WORK_TASK_FILE_MAX_BYTES, WORK_TASK_IMAGE_MAX_BYTES, requireTrustedResourceUrl } from "../src/work-task-attachment-resource.mjs";
import { createImageViewer } from "../src/work-task-image-viewer.mjs";
import { installMainWindowNavigationBoundary } from "../src/desktop-navigation-boundary.mjs";
import { checkCoordinatedDesktopSetupReadiness, combineDesktopSetupReadiness, shouldStartAutomationAfterSetupReadiness } from "../src/desktop-setup-readiness-context.mjs";
import { registerCodexSetupIpc } from "../src/desktop/codex-setup-ipc.mjs";
import { createWorkshopRealtimeAdapter } from "../src/workshop-realtime-adapter.mjs";
import { createWorkSyncCoordinator } from "../src/work-sync-coordinator.mjs";
import { mainWindowChromeOptions, mainWindowState, observeMainWindowState, performMainWindowAction } from "../src/main-window-controls.mjs";
import feedbackV2Ipc from "./feedback-v2-ipc.cjs";

const { settleFeedbackV2Ipc } = feedbackV2Ipc;

const desktopDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = dirname(desktopDir);
const rendererLoadSmoke = process.argv.includes("--renderer-load-smoke");
const rendererSmokeUserData = String(process.env.ARCORBIT_RENDERER_SMOKE_USER_DATA || "").trim();

if (rendererLoadSmoke && rendererSmokeUserData) {
  if (!isAbsolute(rendererSmokeUserData)) throw new Error("ARCORBIT_RENDERER_SMOKE_USER_DATA must be an absolute path.");
  app.setPath("userData", resolve(rendererSmokeUserData));
} else {
  app.setPath("userData", canonicalArcOrbitUserDataPath(app.getPath("appData")));
}

let mainWindow;
let runManager;
let automationCoordinator;
let chatCoordinator;
let platformCoordinator;
let workshopService;
let skillProvisioningManager;
let codexSetupManager;
let productFeedbackService;
let imageViewer;
let workshopRealtimeAdapter;
let workSyncCoordinator;
let quitAfterCleanup = false;
let syncTimer;
let realtimeSubscriptionTimer;
let productFeedbackUnreadTimer;
let automationStarted = false;
let stopObservingMainWindowState = () => {};

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
  workSyncCoordinator = createWorkSyncCoordinator({
    runManager,
    taskSource: workshopService,
    platformSource: workshopService.platform
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
    surface: productFeedbackSurface,
    projectId: process.env.ARCORBIT_FEEDBACK_PROJECT_ID,
    apiKey: process.env.ARCORBIT_FEEDBACK_API_KEY
  });
  productFeedbackService.onUnreadCount((count) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:product-feedback-unread", count);
  });
  const resourcesRoot = app.isPackaged ? process.resourcesPath : join(runtimeRoot, "dist-package", "resources");
  skillProvisioningManager = createSkillProvisioningManager({
    resourcesRoot,
    dataRoot: app.getPath("userData"),
    codexProbe: async () => codexProbeFromSetupSnapshot(codexSetupManager.getSnapshot())
  });
  const codexNetworkSession = session.fromPartition("persist:arcorbit-codex-setup");
  let codexProxyAuthority = "";
  const getCodexNetworkContext = async () => {
    const settings = await runManager.getSettings();
    const proxy = settings.codex_proxy || {};
    const authority = proxy.enabled ? String(proxy.url || "").trim() : "direct";
    if (authority !== codexProxyAuthority) {
      await codexNetworkSession.setProxy(authority === "direct"
        ? { mode: "direct" }
        : { mode: "fixed_servers", proxyRules: authority });
      codexProxyAuthority = authority;
    }
    return {
      env: buildCodexSetupNetworkEnv(process.env, proxy),
      fetchImpl: (url, init) => codexNetworkSession.fetch(url, init)
    };
  };
  codexSetupManager = createCodexSetupManager({
    probeExecutable: (input) => codexExecutableResolver.probe(input),
    preferStandalone: () => codexExecutableResolver.preferStandalone(),
    activeOwners: async () => activeCodexOwnersFromStore(await runManager.readDesktopStore()),
    getNetworkContext: getCodexNetworkContext,
    ownerResolver: (installations, context) => resolveCodexInstallationOwners({ installations, ...context }),
    capabilityInspector: (context) => inspectCodexOwnerCapabilities(context),
    updateChecker: createCodexUpdateChecker({ processRunner: runControlledProcess }),
    receiptStore: createCodexOwnerReceiptStore(join(app.getPath("userData"), "codex-owner-receipts.json")),
    recheckReadiness: ({ codexProbe }) => skillProvisioningManager.check({ quiet: true, codexProbeResult: codexProbe })
  });
  chatCoordinator = createChatCoordinator({
    runManager,
    getCodexExecutable: () => codexExecutableResolver.getResolved(),
    setupReadinessPreflight: async (projectRoot) => {
      await codexSetupManager.assertReady();
      return skillProvisioningManager.assertReady(projectRoot);
    }
  });
  chatCoordinator.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:chat-event", event);
  });
  automationCoordinator = createAutomationCoordinator({
    runManager,
    workSync: workSyncCoordinator,
    setupReadinessPreflight: async (projectRoot) => {
      await codexSetupManager.assertReady();
      return skillProvisioningManager.assertReady(projectRoot);
    },
    cliLauncher: createInteractiveCodexCliLauncher({
      getCodexExecutable: () => codexExecutableResolver.getResolved()
    })
  });
  workshopRealtimeAdapter = createWorkshopRealtimeAdapter({
    taskSource: workshopService,
    readProjectState: (projectId) => workSyncCoordinator.getRealtimeProjectState(projectId),
    writeProjectState: (projectId, update) => workSyncCoordinator.updateRealtimeProjectState(projectId, update),
    onInvalidate: async (projectId, { event_types: eventTypes = [] } = {}) => {
      await workSyncCoordinator.invalidateProject(projectId, { event_types: eventTypes });
    }
  });
  workshopRealtimeAdapter.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:work-sync-event", { type: "work.sync", ...event });
  });
  platformCoordinator = createPlatformCoordinator({
    runManager,
    platformSource: workshopService.platform,
    workSync: workSyncCoordinator,
    automationCoordinator
  });
  imageViewer = createImageViewer({
    BrowserWindow,
    dialog,
    writeFile,
    shellFile: join(desktopDir, "image-viewer/index.html"),
    preloadFile: join(desktopDir, "image-viewer/preload.cjs"),
    loadImage: loadImageResource,
    getParentWindow: () => mainWindow
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
    scheduleRealtimeSubscriptions();
  });
  workSyncCoordinator.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:work-sync-event", event);
    if (event.type === "work.changed") {
      automationCoordinator.handleTaskProjectionChanged(event).catch((error) => console.error("Automation local projection handling failed:", error));
    }
    scheduleRealtimeSubscriptions();
  });
  skillProvisioningManager.onEvent(() => publishSetupReadiness());
  codexSetupManager.onEvent(() => publishSetupReadiness());
  registerIpc();
  await runManager.warmRunSummaryIndex({ limit: 20 });
  await createWindow({ show: !rendererLoadSmoke });
  if (rendererLoadSmoke) {
    await runRendererLoadSmoke();
    return;
  }
  startProductFeedbackUnreadSync();
  const readiness = await checkCombinedSetupReadiness();
  if (shouldStartAutomationAfterSetupReadiness(readiness)) {
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
    if (realtimeSubscriptionTimer) {
      clearTimeout(realtimeSubscriptionTimer);
      realtimeSubscriptionTimer = null;
    }
    workshopRealtimeAdapter?.stop();
    powerMonitor.removeListener("resume", handleSystemResume);
    if (productFeedbackUnreadTimer) {
      clearInterval(productFeedbackUnreadTimer);
      productFeedbackUnreadTimer = null;
    }
    automationCoordinator?.dispose();
    await chatCoordinator?.close();
    productFeedbackService?.close();
    imageViewer?.close();
    await skillProvisioningManager?.waitForIdle();
    await codexSetupManager?.waitForIdle();
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
    ...mainWindowChromeOptions(process.platform),
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
  stopObservingMainWindowState();
  stopObservingMainWindowState = observeMainWindowState(mainWindow, (state) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:window-state-changed", state);
  });
  mainWindow.once("closed", () => {
    stopObservingMainWindowState();
    stopObservingMainWindowState = () => {};
    mainWindow = null;
  });
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

async function checkCombinedSetupReadiness(input) {
  return checkCoordinatedDesktopSetupReadiness({
    input,
    readDesktopStore: () => runManager.readDesktopStore(),
    checkCodex: () => codexSetupManager.check(),
    checkSkills: (setupInput) => skillProvisioningManager.check(setupInput)
  });
}

async function refreshAfterCodexOperation(operation) {
  const codex = await operation();
  return combinedSetupReadiness(undefined, codex);
}

function publishSetupReadiness() {
  if (mainWindow?.isDestroyed()) return;
  mainWindow.webContents.send("arckit:setup-event", combinedSetupReadiness());
}

function combinedSetupReadiness(
  skills = skillProvisioningManager?.getSnapshot(),
  codex = codexSetupManager?.getSnapshot()
) {
  return combineDesktopSetupReadiness(skills, codex);
}

function registerIpc() {
  ipcMain.handle("arckit:window-state", async (event) => {
    assertMainRenderer(event);
    return mainWindowState(mainWindow);
  });
  ipcMain.handle("arckit:window-minimize", async (event) => {
    assertMainRenderer(event);
    return performMainWindowAction(mainWindow, "minimize");
  });
  ipcMain.handle("arckit:window-toggle-maximize", async (event) => {
    assertMainRenderer(event);
    return performMainWindowAction(mainWindow, "toggle-maximize");
  });
  ipcMain.handle("arckit:window-close", async (event) => {
    assertMainRenderer(event);
    return performMainWindowAction(mainWindow, "close");
  });
  ipcMain.handle("arckit:setup-status", async () => combinedSetupReadiness());
  ipcMain.handle("arckit:setup-check", async (_event, input) => checkCombinedSetupReadiness(input));
  ipcMain.handle("arckit:setup-apply", async (_event, input) => combinedSetupReadiness(await skillProvisioningManager.apply(input)));
  ipcMain.handle("arckit:setup-recover-upgrade", async (_event, input) => combinedSetupReadiness(await skillProvisioningManager.recoverSourceUpgrade(input)));
  ipcMain.handle("arckit:setup-removal-plan", async (_event, managedPaths) => skillProvisioningManager.planManagedRemoval(managedPaths));
  ipcMain.handle("arckit:setup-remove", async (_event, input) => combinedSetupReadiness(await skillProvisioningManager.removeManaged(input)));
  registerCodexSetupIpc({
    ipcMain,
    codexSetupManager,
    combinedSetupReadiness,
    checkCombinedSetupReadiness,
    refreshAfterCodexOperation,
    authorizeSender: assertMainRenderer,
    confirmAction: confirmCodexSetupAction
  });
  ipcMain.handle("arckit:setup-continue", async () => {
    const readiness = combinedSetupReadiness();
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
  ipcMain.handle("arckit:chat-snapshot", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.getSnapshot(input);
  });
  ipcMain.handle("arckit:chat-create", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.createDraft(input);
  });
  ipcMain.handle("arckit:chat-select", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.select(input);
  });
  ipcMain.handle("arckit:chat-rename", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.rename(input);
  });
  ipcMain.handle("arckit:chat-delete", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.delete(input);
  });
  ipcMain.handle("arckit:chat-send", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.send(input);
  });
  ipcMain.handle("arckit:chat-interrupt", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.interrupt(input);
  });
  ipcMain.handle("arckit:chat-approval-decision", async (event, input) => {
    assertMainRenderer(event);
    return chatCoordinator.decideApproval(input);
  });
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
    await workSyncCoordinator.reconcile({ reason: "login" });
    productFeedbackService.refreshUnread().catch(() => {});
    return authentication;
  });
  ipcMain.handle("arckit:auth-logout", async (_event, input = {}) => {
    const snapshot = await automationCoordinator.getSnapshot();
    if (snapshot.active_executions?.length && !input.confirm_active_task) {
      return {
        requires_confirmation: true,
        active_task: snapshot.active_task,
        active_executions: snapshot.active_executions,
        authentication: await workshopService.getAuthStatus()
      };
    }
    if (snapshot.active_executions?.length) {
      await automationCoordinator.stopAll();
    }
    const authentication = await workshopService.logout();
    productFeedbackService.resetSession();
    await workSyncCoordinator.clearSession();
    await automationCoordinator.clearRemoteSession();
    return { requires_confirmation: false, authentication };
  });
  ipcMain.handle("arckit:automation-snapshot", async (_event, filter) => automationCoordinator.getSnapshot(filter));
  ipcMain.handle("arckit:run-activity-snapshot", async (_event, runId) => runManager.getRunActivitySnapshot(runId));
  ipcMain.handle("arckit:automation-select-execution", async (_event, executionId) => automationCoordinator.selectExecution(executionId));
  ipcMain.handle("arckit:automation-sync", async () => {
    await workSyncCoordinator.reconcile({ dispatch: false, reason: "explicit-sync" });
    await reconcileRealtimeSubscriptions();
    await automationCoordinator.maybeStartNext();
    return automationCoordinator.getSnapshot();
  });
  ipcMain.handle("arckit:work-sync", async () => workSyncCoordinator.reconcile({ reason: "explicit-work-sync" }));
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
  ipcMain.handle("arckit:automation-stop", async (_event, input) => automationCoordinator.stopCurrent(input));
  ipcMain.handle("arckit:automation-handoff-cli", async (_event, input) => automationCoordinator.handoffToCodexCli(input));
  ipcMain.handle("arckit:automation-reopen-cli", async (_event, input) => automationCoordinator.reopenCodexCli(input));
  ipcMain.handle("arckit:automation-resume-runtime", async (_event, input) => automationCoordinator.resumeRuntimeFromCodexCli(input));
  ipcMain.handle("arckit:automation-confirm-external-dependency", async (_event, input) => automationCoordinator.confirmExternalDependency(input));
  ipcMain.handle("arckit:automation-recovery", async (_event, input) => automationCoordinator.resolveRecovery(input));
  ipcMain.handle("arckit:platform-snapshot", async (_event, input) => platformCoordinator.getSnapshot(input));
  ipcMain.handle("arckit:platform-work-query", async (_event, input) => platformCoordinator.queryWork(input));
  ipcMain.handle("arckit:platform-workset-create", async (_event, input) => platformCoordinator.createWorkset(input));
  ipcMain.handle("arckit:platform-workset-update", async (_event, input) => platformCoordinator.updateWorkset(input));
  ipcMain.handle("arckit:platform-workset-delete", async (_event, worksetId) => platformCoordinator.deleteWorkset(worksetId));
  ipcMain.handle("arckit:platform-workset-active", async (_event, worksetId) => platformCoordinator.setActiveWorkset(worksetId));
  ipcMain.handle("arckit:platform-today-projects", async (_event, projectIds) => platformCoordinator.setTodayProjects(projectIds));
  ipcMain.handle("arckit:platform-today-preference", async (_event, input) => platformCoordinator.setTodayPreference(input));
  ipcMain.handle("arckit:platform-workspace-preference", async (_event, projectId, input) => (
    platformCoordinator.setWorkspacePreference(projectId, input)
  ));
  ipcMain.handle("arckit:platform-work-inspector-width", async (_event, widthPx) => (
    platformCoordinator.setWorkInspectorWidth(widthPx)
  ));
  ipcMain.handle("arckit:platform-action", async (_event, command, input) => platformCoordinator.executeAction(command, input));
  ipcMain.handle("arckit:feedback-v2-messages", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.getFeedbackV2Messages(input));
  });
  ipcMain.handle("arckit:feedback-v2-reply", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.sendFeedbackV2Reply(input));
  });
  ipcMain.handle("arckit:feedback-v2-read", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.markFeedbackV2Read(input));
  });
  ipcMain.handle("arckit:feedback-v2-ignore", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.ignoreFeedbackV2(input));
  });
  ipcMain.handle("arckit:feedback-v2-restore", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.restoreFeedbackV2(input));
  });
  ipcMain.handle("arckit:feedback-v2-update", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.updateFeedbackV2(input));
  });
  ipcMain.handle("arckit:feedback-v2-delete", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.deleteFeedbackV2(input));
  });
  ipcMain.handle("arckit:feedback-v2-convert", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(() => platformCoordinator.convertFeedbackV2ToTask(input));
  });
  ipcMain.handle("arckit:feedback-v2-attachment-open", async (event, input) => {
    assertMainRenderer(event);
    return settleFeedbackV2Ipc(async () => {
      const url = requireFeedbackAttachmentUrl(await platformCoordinator.getFeedbackV2AttachmentUrl(input));
      await shell.openExternal(url);
      return { opened: true };
    });
  });
  ipcMain.handle("arckit:feedback-attachment-open", async (event, value) => {
    assertMainRenderer(event);
    const url = requireFeedbackAttachmentUrl(value);
    await shell.openExternal(url);
    return { opened: true };
  });
  ipcMain.handle("arckit:work-external-link-open", async (event, value) => {
    assertMainRenderer(event);
    const url = requireWorkExternalLinkUrl(value);
    await shell.openExternal(url);
    return { opened: true };
  });
  ipcMain.handle("arckit:work-task-attachment-pick", async (event, input) => {
    assertMainRenderer(event);
    const kind = input?.kind === "image" ? "image" : input?.kind === "file" ? "file" : "";
    if (!kind) throw new TypeError("评论资源类型无效。");
    const result = await dialog.showOpenDialog(mainWindow, {
      title: kind === "image" ? "选择评论图片" : "选择评论文件",
      properties: ["openFile"],
      ...(kind === "image" ? { filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }] } : {})
    });
    if (result.canceled || result.filePaths.length !== 1) return null;
    const filePath = result.filePaths[0];
    const fileInfo = await stat(filePath);
    const maxBytes = kind === "image" ? WORK_TASK_IMAGE_MAX_BYTES : WORK_TASK_FILE_MAX_BYTES;
    if (!fileInfo.isFile() || fileInfo.size <= 0 || fileInfo.size > maxBytes) throw new Error(`所选${kind === "image" ? "图片" : "文件"}大小超出限制。`);
    const fileName = filePath.split(/[\\/]/).pop() || "attachment";
    const mimeType = workAttachmentMimeType(fileName, kind);
    const bytes = new Uint8Array(await readFile(filePath));
    return platformCoordinator.uploadTaskAttachmentResource({
      project_id: input?.project_id,
      task_id: input?.task_id,
      kind,
      file: { file_name: fileName, mime_type: mimeType, size: bytes.byteLength, bytes }
    });
  });
  ipcMain.handle("arckit:work-task-attachment-preview", async (event, input) => {
    assertMainRenderer(event);
    const image = await loadImageResource({ ...input, source: "work-task" });
    return { data_url: image.data_url };
  });
  ipcMain.handle("arckit:image-preview", async (event, input) => {
    assertMainRenderer(event);
    const image = await loadImageResource(input);
    return { data_url: image.data_url };
  });
  ipcMain.handle("arckit:image-viewer-open", async (event, input) => {
    assertMainRenderer(event);
    return imageViewer.open(input);
  });
  ipcMain.handle("arckit:image-viewer-save", async (event) => {
    if (!imageViewer.owns(event.sender)) throw new Error("Image save is only available from the managed ArcOrbit image viewer.");
    return imageViewer.save(event.sender);
  });
  ipcMain.handle("arckit:image-viewer-retry", async (event) => {
    if (!imageViewer.owns(event.sender)) throw new Error("Image retry is only available from the managed ArcOrbit image viewer.");
    return imageViewer.retry(event.sender);
  });
  ipcMain.handle("arckit:work-task-attachment-open", async (event, input) => {
    assertMainRenderer(event);
    const url = requireTrustedResourceUrl(await platformCoordinator.getTaskAttachmentResourceUrl({ ...input, download: true }));
    await shell.openExternal(url);
    return { opened: true };
  });
}

async function loadImageResource(input = {}) {
  let url;
  let validateUrl;
  if (input.source === "work-task") {
    url = requireTrustedResourceUrl(await platformCoordinator.getTaskAttachmentResourceUrl({ ...input, download: false }));
    validateUrl = requireTrustedResourceUrl;
  } else if (input.source === "feedback-v2") {
    url = requireFeedbackAttachmentUrl(await platformCoordinator.getFeedbackV2AttachmentUrl(input));
    validateUrl = requireFeedbackAttachmentUrl;
  } else if (input.source === "feedback-file") {
    url = requireFeedbackAttachmentUrl(await platformCoordinator.getFeedbackAttachmentUrl(input));
    validateUrl = requireFeedbackAttachmentUrl;
  } else {
    throw new TypeError("图片资源来源无效。");
  }
  const response = await fetch(url);
  validateUrl(response.url);
  const declaredType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const fileName = String(input.file_name || input.object_key || "image").split(/[\\/]/).pop() || "image";
  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  if (declaredType && !allowedTypes.includes(declaredType)) throw new Error("图片响应类型无效。");
  const contentType = declaredType || workAttachmentMimeType(fileName, "image");
  const announcedSize = Number(response.headers.get("content-length") || 0);
  if (!response.ok || announcedSize > WORK_TASK_IMAGE_MAX_BYTES) throw new Error("图片预览不可用。");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > WORK_TASK_IMAGE_MAX_BYTES) throw new Error("图片预览大小无效。");
  return {
    bytes,
    content_type: contentType,
    file_name: fileName,
    data_url: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`
  };
}

function assertMainRenderer(event) {
  if (event.sender !== mainWindow?.webContents) throw new Error("Main-window actions can only be invoked from the main ArcOrbit window.");
}

async function confirmCodexSetupAction(action, snapshot, intent = {}) {
  const loginMethod = {
    "chatgpt:browser": "将启动 Codex 官方系统浏览器登录流程。",
    "chatgpt:device": "将启动 Codex 官方设备码登录流程。",
    "api-key:": "将通过 child stdin 一次性提交当前 API Key；不会写入配置、日志或环境变量。",
    "access-token:": "将通过 child stdin 一次性提交当前 Enterprise Access Token；不会写入配置、日志或环境变量。"
  }[`${intent.method || ""}:${intent.flow || ""}`];
  const installMethod = { standalone: "OpenAI 官方 standalone installer", npm: "当前电脑已验证的 npm", homebrew: "当前电脑已验证的 Homebrew cask" }[intent.method] || "推荐方式";
  const updateOwner = snapshot?.installation?.owner || snapshot?.installation?.provenance || "当前 owner";
  const migrationMessage = snapshot?.installation?.owner === "standalone"
    ? "将重新执行官方 standalone installer，并在 fresh discovery 成功后记录 ArcOrbit 管理权。"
    : "将保留当前外部 Codex 安装，并另行安装官方 standalone 后切换 ArcOrbit 使用目标。";
  const messages = {
    install: ["安装 Codex", `将通过${installMethod}安装 Codex，完成后立即刷新完整 installation inventory。`],
    update: ["更新 Codex", `将通过 proven ${updateOwner} adapter 更新当前 active installation；活动 Chat 或 Automation 会阻止此操作。`],
    migrate: ["迁移到 standalone", migrationMessage],
    login: ["登录 Codex", loginMethod],
    logout: ["退出 Codex", "将调用 Codex CLI logout；活动 owner 会阻止此操作。"]
  };
  const [title, message] = messages[action] || [];
  if (!title) return false;
  const result = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title,
    message,
    detail: "该确认仅对当前 Setup 状态和本次操作有效。",
    buttons: ["取消", "继续"],
    defaultId: 0,
    cancelId: 0,
    noLink: true
  });
  return result.response === 1;
}

function workAttachmentMimeType(fileName, kind) {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase();
  const imageTypes = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
  if (kind === "image") {
    if (!imageTypes[extension]) throw new TypeError("仅支持 PNG、JPEG、GIF 或 WebP 评论图片。");
    return imageTypes[extension];
  }
  return { pdf: "application/pdf", txt: "text/plain", md: "text/markdown", json: "application/json", zip: "application/zip" }[extension] || "application/octet-stream";
}

function startAutomation() {
  if (automationStarted) return;
  automationStarted = true;
  workSyncCoordinator.reconcile({ dispatch: false, reason: "startup" })
    .then(async () => {
      await automationCoordinator.handleTaskProjectionChanged({ type: "work.changed", reason: "startup", resumeRecoverable: true });
      await reconcileRealtimeSubscriptions();
      await automationCoordinator.maybeStartNext();
    })
    .catch((error) => console.error("Initial task sync failed:", error));
  syncTimer = setInterval(() => {
    workSyncCoordinator.reconcile({ dispatch: true, reason: "periodic-reconciliation" })
      .then(() => reconcileRealtimeSubscriptions())
      .catch((error) => console.error("Periodic reconciliation failed:", error));
  }, 15 * 60_000);
  powerMonitor.on("resume", handleSystemResume);
}

function scheduleRealtimeSubscriptions() {
  if (!automationStarted || realtimeSubscriptionTimer) return;
  realtimeSubscriptionTimer = setTimeout(() => {
    realtimeSubscriptionTimer = null;
    reconcileRealtimeSubscriptions().catch((error) => console.error("Realtime subscription reconciliation failed:", error));
  }, 0);
}

async function reconcileRealtimeSubscriptions() {
  const projectIds = await workSyncCoordinator.realtimeProjectIds();
  await workshopRealtimeAdapter.updateProjects(projectIds);
}

function handleSystemResume() {
  workshopRealtimeAdapter?.reconnectAll();
  workSyncCoordinator?.reconcile({ dispatch: true, reason: "system-resume" })
    .then(() => reconcileRealtimeSubscriptions())
    .catch((error) => console.error("Resume reconciliation failed:", error));
}

function startProductFeedbackUnreadSync() {
  if (productFeedbackUnreadTimer) return;
  productFeedbackService.refreshUnread().catch(() => {});
  productFeedbackUnreadTimer = setInterval(() => {
    productFeedbackService.refreshUnread().catch(() => {});
  }, 60_000);
}
