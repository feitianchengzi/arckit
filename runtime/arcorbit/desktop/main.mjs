import { app, BrowserWindow, dialog, ipcMain, powerMonitor, shell, utilityProcess, WebContentsView } from "electron";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDesktopRunManager } from "../src/desktop-run-manager.mjs";
import { createChatCoordinator } from "../src/chat-coordinator.mjs";
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
import { requireWorkExternalLinkUrl } from "../src/work-external-link.mjs";
import { WORK_TASK_FILE_MAX_BYTES, WORK_TASK_IMAGE_MAX_BYTES, requireTrustedResourceUrl } from "../src/work-task-attachment-resource.mjs";
import { createImageViewer } from "../src/work-task-image-viewer.mjs";
import { installMainWindowNavigationBoundary } from "../src/desktop-navigation-boundary.mjs";
import { checkDesktopSetupReadiness } from "../src/desktop-setup-readiness-context.mjs";
import { createWorkshopRealtimeAdapter } from "../src/workshop-realtime-adapter.mjs";
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
let productFeedbackService;
let imageViewer;
let workshopRealtimeAdapter;
let quitAfterCleanup = false;
let syncTimer;
let realtimeSubscriptionTimer;
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
  chatCoordinator = createChatCoordinator({
    runManager,
    getCodexExecutable: () => codexExecutableResolver.getResolved(),
    setupReadinessPreflight: async (projectRoot) => {
      const store = await runManager.readDesktopStore();
      return skillProvisioningManager.assertReady(projectRoot, [], store.projects.map((item) => item.path).filter(Boolean));
    }
  });
  chatCoordinator.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:chat-event", event);
  });
  automationCoordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: () => workshopService,
    setupReadinessPreflight: async (projectRoot) => {
      const store = await runManager.readDesktopStore();
      return skillProvisioningManager.assertReady(projectRoot, [], store.projects.map((item) => item.path).filter(Boolean));
    },
    cliLauncher: createInteractiveCodexCliLauncher({
      getCodexExecutable: () => codexExecutableResolver.getResolved()
    })
  });
  workshopRealtimeAdapter = createWorkshopRealtimeAdapter({
    taskSource: workshopService,
    readProjectState: (projectId) => automationCoordinator.getRealtimeProjectState(projectId),
    writeProjectState: (projectId, update) => automationCoordinator.updateRealtimeProjectState(projectId, update),
    onInvalidate: async (projectId, { event_types: eventTypes = [] } = {}) => {
      const taskOnly = eventTypes.length > 0 && eventTypes.every((event) => event.startsWith("task.") || event.startsWith("task_attachment."));
      if (taskOnly) await automationCoordinator.refreshProject(projectId, { dispatch: false });
      else await automationCoordinator.sync({ dispatch: false });
      await automationCoordinator.maybeStartNext();
    }
  });
  workshopRealtimeAdapter.onEvent((event) => {
    if (!mainWindow?.isDestroyed()) mainWindow.webContents.send("arckit:automation-event", { type: "automation.realtime", ...event });
  });
  platformCoordinator = createPlatformCoordinator({
    runManager,
    platformSource: workshopService.platform,
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
  skillProvisioningManager.onEvent((readiness) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("arckit:setup-event", readiness);
    }
  });
  registerIpc();
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
  ipcMain.handle("arckit:setup-check", async (_event, input) => checkDesktopSetupReadiness({
    input,
    readDesktopStore: () => runManager.readDesktopStore(),
    check: (setupInput) => skillProvisioningManager.check(setupInput)
  }));
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
  ipcMain.handle("arckit:automation-sync", async () => {
    await automationCoordinator.sync({ dispatch: false });
    await reconcileRealtimeSubscriptions();
    await automationCoordinator.maybeStartNext();
    return automationCoordinator.getSnapshot();
  });
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
  ipcMain.handle("arckit:platform-work-query", async (_event, input) => platformCoordinator.queryWork(input));
  ipcMain.handle("arckit:platform-workset-create", async (_event, input) => platformCoordinator.createWorkset(input));
  ipcMain.handle("arckit:platform-workset-update", async (_event, input) => platformCoordinator.updateWorkset(input));
  ipcMain.handle("arckit:platform-workset-delete", async (_event, worksetId) => platformCoordinator.deleteWorkset(worksetId));
  ipcMain.handle("arckit:platform-workset-active", async (_event, worksetId) => platformCoordinator.setActiveWorkset(worksetId));
  ipcMain.handle("arckit:platform-workspace-preference", async (_event, projectId, input) => (
    platformCoordinator.setWorkspacePreference(projectId, input)
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
  automationCoordinator.sync({ resumeRecoverable: true, dispatch: false })
    .then(async () => {
      await reconcileRealtimeSubscriptions();
      await automationCoordinator.maybeStartNext();
    })
    .catch((error) => console.error("Initial task sync failed:", error));
  syncTimer = setInterval(() => {
    automationCoordinator.sync({ dispatch: true })
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
  const projectIds = await automationCoordinator.realtimeProjectIds();
  await workshopRealtimeAdapter.updateProjects(projectIds);
}

function handleSystemResume() {
  workshopRealtimeAdapter?.reconnectAll();
  automationCoordinator?.sync({ dispatch: true })
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
