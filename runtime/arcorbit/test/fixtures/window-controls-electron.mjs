import { app, BrowserWindow, ipcMain } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mainWindowChromeOptions, mainWindowControlMode, mainWindowState, observeMainWindowState, performMainWindowAction } from "../../src/main-window-controls.mjs";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-window-controls-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();
app.on("window-all-closed", () => {});

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: true,
    ...mainWindowChromeOptions(process.platform),
    width: 720,
    height: 480,
    minWidth: 500,
    minHeight: 320,
    webPreferences: {
      preload: join(fixtureDir, "../../desktop/preload.cjs"),
      contextIsolation: true,
      sandbox: true
    }
  });
  const assertOwner = (event) => {
    if (event.sender !== window.webContents) throw new Error("Unexpected window control owner.");
  };
  ipcMain.handle("arckit:window-state", (event) => { assertOwner(event); return mainWindowState(window); });
  ipcMain.handle("arckit:window-minimize", (event) => { assertOwner(event); return performMainWindowAction(window, "minimize"); });
  ipcMain.handle("arckit:window-toggle-maximize", (event) => { assertOwner(event); return performMainWindowAction(window, "toggle-maximize"); });
  ipcMain.handle("arckit:window-close", (event) => { assertOwner(event); return performMainWindowAction(window, "close"); });
  const stopObserving = observeMainWindowState(window, (state) => {
    if (!window.isDestroyed()) window.webContents.send("arckit:window-state-changed", state);
  });
  const waitFor = async (predicate, label) => {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Timed out waiting for ${label}.`);
  };

  try {
    await window.loadFile(join(fixtureDir, "window-controls.html"));
    await waitFor(() => window.webContents.executeJavaScript("document.documentElement.dataset.ready").catch(() => ""), "renderer readiness");
    const bounds = window.getBounds();
    const contentBounds = window.getContentBounds();
    const result = {
      platform: process.platform,
      control_mode: mainWindowControlMode(process.platform),
      frame_content_delta: { width: bounds.width - contentBounds.width, height: bounds.height - contentBounds.height },
      resizable: window.isResizable(),
      movable: window.isMovable()
    };
    if (process.platform === "darwin") {
      result.window_button_position = window.getWindowButtonPosition();
      result.custom_controls_hidden = await window.webContents.executeJavaScript("document.getElementById('windowCloseButton').getAttribute('aria-hidden') === 'true' && document.getElementById('windowCloseButton').tabIndex === -1");
      window.setFullScreen(true);
      await waitFor(() => window.isFullScreen(), "native full screen");
      result.entered_full_screen = mainWindowState(window).maximized;
      window.setFullScreen(false);
      await waitFor(() => !window.isFullScreen(), "leave native full screen");
      result.left_full_screen = !mainWindowState(window).maximized;
      window.destroy();
    } else {
      await window.webContents.executeJavaScript("document.getElementById('windowMinimizeButton').click()");
      await waitFor(() => window.isMinimized(), "minimize");
      window.restore();
      await waitFor(() => !window.isMinimized(), "restore from minimize");
      await window.webContents.executeJavaScript("document.getElementById('windowMaximizeButton').click()");
      await waitFor(() => window.isMaximized(), "maximize");
      result.maximized_label = await window.webContents.executeJavaScript("document.getElementById('windowMaximizeButton').getAttribute('aria-label')");
      await window.webContents.executeJavaScript("document.getElementById('windowMaximizeButton').click()");
      await waitFor(() => !window.isMaximized(), "restore from maximize");
      result.restored_label = await window.webContents.executeJavaScript("document.getElementById('windowMaximizeButton').getAttribute('aria-label')");
      await window.webContents.executeJavaScript("document.getElementById('windowCloseButton').click()");
      await waitFor(() => window.isDestroyed(), "close");
    }
    await new Promise((resolve, reject) => {
      process.stdout.write(`${JSON.stringify(result)}\n`, (error) => error ? reject(error) : resolve());
    });
  } finally {
    stopObserving();
    if (!window.isDestroyed()) window.destroy();
    await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    app.exit(0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
