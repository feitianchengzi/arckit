import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-today-task-edit-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  let exitCode = 0;
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
      const wait = () => new Promise((resolve) => setTimeout(resolve, 90));
      document.querySelector('[data-page="today"]').click();
      await wait();
      document.querySelector('[data-today-mode="intervention"]').click();
      await wait();
      const row = document.querySelector('[data-today-item^="work:W-COMPLETED:"]');
      if (!row) throw new Error('Missing completed Today work row: ' + [...document.querySelectorAll('[data-today-item]')].map((item) => item.dataset.todayItem).join(','));
      row.click();
      await wait();
      const selectedBefore = document.querySelector('#todayResponsibilityList .today-responsibility-row.is-active')?.dataset.todayItem || '';
      const editButtonVisible = Boolean(document.querySelector('[data-today-edit-task="W-COMPLETED"]'));
      if (!editButtonVisible) throw new Error('Missing Today task edit button: ' + document.querySelector('#todayOperator').textContent);
      document.querySelector('[data-today-edit-task="W-COMPLETED"]').click();
      await wait();
      const initialDraft = document.querySelector('#platformActionForm [name="content"]').value;
      document.querySelector('#platformActionForm [name="content"]').value = 'Corrected in Today';
      await window.arckitDesktop.failNextTestTaskUpdate('Fixture version conflict');
      document.querySelector('#platformActionForm').requestSubmit();
      await wait();
      const failureSheetVisible = !document.querySelector('#platformActionOverlay').classList.contains('hidden');
      const failureStatus = document.querySelector('#platformActionStatus').textContent;
      const failureDraft = document.querySelector('#platformActionForm [name="content"]').value;
      const selectedAfterFailure = document.querySelector('#todayResponsibilityList .today-responsibility-row.is-active')?.dataset.todayItem || '';
      document.querySelector('#platformActionForm').requestSubmit();
      await wait();
      await wait();
      const successSheetClosed = document.querySelector('#platformActionOverlay').classList.contains('hidden');
      const selectedAfterSuccess = document.querySelector('#todayResponsibilityList .today-responsibility-row.is-active')?.dataset.todayItem || '';
      const detailAfterSuccess = document.querySelector('#todayOperator').textContent;
      const calls = await window.arckitDesktop.getTestCalls();
      return { selectedBefore, editButtonVisible, initialDraft, failureSheetVisible, failureStatus, failureDraft, selectedAfterFailure, successSheetClosed, selectedAfterSuccess, detailAfterSuccess, calls };
    })()`);
    await new Promise((resolve) => process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`, resolve));
  } catch (error) {
    exitCode = 1;
    await new Promise((resolve) => process.stderr.write(`${error.stack || error.message}\n`, resolve));
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(exitCode);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
