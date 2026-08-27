import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const mode = String(process.argv[2] || process.env.ARCORBIT_TODAY_CREATE_IDENTITY_MODE || "valid");
process.env.ARCORBIT_TODAY_CREATE_IDENTITY_MODE = mode;
const userData = join(tmpdir(), `arcorbit-today-create-identity-${mode}-${process.pid}`);
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
      const wait = (duration = 100) => new Promise((resolve) => setTimeout(resolve, duration));
      const action = document.querySelector('[data-guidance-action="create_for_arcorbit"]');
      const actionLabel = action?.textContent || '';
      action?.click();
      await wait();
      const sheetOpened = !document.querySelector('#platformActionOverlay').classList.contains('hidden');
      if (sheetOpened) {
        document.querySelector('[name="content"]').value = 'First task from Today';
        document.querySelector('#platformActionForm').requestSubmit();
        await wait(220);
      }
      const calls = await window.arckitDesktop.getTestCalls();
      return {
        action_label: actionLabel,
        sheet_opened: sheetOpened,
        sheet_closed_after_submit: document.querySelector('#platformActionOverlay').classList.contains('hidden'),
        post_submit_action_label: document.querySelector('[data-guidance-action]')?.textContent || '',
        toast: document.querySelector('#toast').textContent,
        create_calls: calls.filter(([command]) => command === 'task.create')
      };
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
