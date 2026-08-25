import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-task-replacement-sheet-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const rendererErrors = [];
      const originalConsoleError = console.error;
      console.error = (value) => { rendererErrors.push(value?.stack || String(value)); originalConsoleError(value?.stack || value); };
      const wait = (duration = 90) => new Promise((resolve) => setTimeout(resolve, duration));
      const click = (selector) => document.querySelector(selector).click();
      window.confirm = () => true;

      click('[data-page="work"]');
      await wait();
      document.querySelector('#productScopeSelect').value = '11';
      document.querySelector('#productScopeSelect').dispatchEvent(new Event('change', { bubbles: true }));
      await wait();
      click('[data-work-inspector-edit="W-11"]');
      await wait();

      document.querySelector('[name="project_id"]').value = '12';
      document.querySelector('[name="project_id"]').dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[name="content"]').value = 'Preserve this cross-product draft';
      document.querySelector('[name="state"]').value = 'blocked';
      document.querySelector('[name="priority"]').value = '2';

      await window.arckitDesktop.setTestTaskReplacementScenario('create_failure');
      document.querySelector('#platformActionForm').requestSubmit();
      await wait(140);
      const createFailure = {
        sheetOpen: !document.querySelector('#platformActionOverlay').classList.contains('hidden'),
        projectId: document.querySelector('[name="project_id"]').value,
        content: document.querySelector('[name="content"]').value,
        state: document.querySelector('[name="state"]').value,
        priority: document.querySelector('[name="priority"]').value,
        status: document.querySelector('#platformActionStatus').textContent,
        submitEnabled: !document.querySelector('#confirmPlatformActionButton').disabled
      };

      await window.arckitDesktop.setTestTaskReplacementScenario('delete_failure');
      document.querySelector('#platformActionForm').requestSubmit();
      await wait(180);
      const deleteFailure = {
        sheetOpen: !document.querySelector('#platformActionOverlay').classList.contains('hidden'),
        content: document.querySelector('[name="content"]').value,
        status: document.querySelector('#platformActionStatus').textContent,
        retryVisible: Boolean(document.querySelector('[data-platform-task-replacement-retry="11:W-11"]')),
        keepVisible: Boolean(document.querySelector('[data-platform-task-replacement-keep="11:W-11"]'))
      };

      await window.arckitDesktop.setTestTaskReplacementScenario('success');
      click('[data-platform-task-replacement-retry="11:W-11"]');
      await wait(180);
      const recovery = {
        sheetClosed: document.querySelector('#platformActionOverlay').classList.contains('hidden'),
        selectedProduct: document.querySelector('#productScopeSelect').value
      };

      return { createFailure, deleteFailure, recovery, rendererErrors, calls: await window.arckitDesktop.getTestCalls() };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
