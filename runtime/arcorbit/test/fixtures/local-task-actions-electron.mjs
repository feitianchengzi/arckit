import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-local-task-actions-${process.pid}`);
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
      const click = (selector) => document.querySelector(selector).click();
      const wait = (duration = 80) => new Promise((resolve) => setTimeout(resolve, duration));
      click('[data-page="work"]'); await wait();
      document.querySelector('#productScopeSelect').value = '11';
      document.querySelector('#productScopeSelect').dispatchEvent(new Event('change', { bubbles: true })); await wait();
      click('#createTaskButton'); await wait();
      document.querySelector('[name="content"]').value = 'Immediate local pending review';
      document.querySelector('[name="executor_id"]').value = '7';
      document.querySelector('#platformActionForm').requestSubmit(); await wait(160);
      click('[data-work-state="pending_review"]'); await wait(120);
      click('[data-platform-task-select="W-LOCAL-1"]'); await wait();
      const actionButtons = [...document.querySelectorAll('#platformWorkInspector [data-work-task-action]')];
      const labels = actionButtons.map((item) => item.textContent);
      actionButtons.find((item) => item.textContent === '确认可处理').click(); await wait(160);
      const calls = await window.arckitDesktop.getTestCalls();
      const updateCall = calls.find(([command, input]) => command === 'task.update' && input.task_id === 'W-LOCAL-1');
      return {
        task_visible: Boolean(document.querySelector('[data-platform-task-select="W-LOCAL-1"]')),
        task_selected: document.querySelector('#platformWorkInspector h2')?.textContent === '待办 W-LOCAL-1',
        action_labels: labels,
        manual_sync_used: calls.some(([command]) => command === 'syncAutomation'),
        create_call_count: calls.filter(([command]) => command === 'task.create').length,
        update_call: updateCall || null,
        automation_update_call_count: calls.filter(([command]) => command === 'updateAutomationTaskState').length
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
