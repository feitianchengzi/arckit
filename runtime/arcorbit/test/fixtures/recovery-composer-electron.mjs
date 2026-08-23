import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-recovery-composer-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 820,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  let exitCode = 0;
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const waitForRefresh = () => new Promise((resolve) => setTimeout(resolve, 180));
      await window.arckitDesktop.setTestRecoveryItems([
        { id: 'RECOVERY-global', type: 'runtime_incomplete', task_id: 'T-11', project_id: '11', message: 'Global recovery remains visible', freeze_scope: 'global', responsibility: 'operator', actions: ['retry_sync', 'feedback_continue'] }
      ]);
      await window.arckitDesktop.emitTestAutomationEvent({ type: 'automation.changed', reason: 'test-setup' });
      await waitForRefresh();
      const commandNavigation = document.querySelector('[data-page="command"]');
      commandNavigation?.click();
      await waitForRefresh();
      const openRecovery = document.querySelector('#openRecoveryButton');
      if (!commandNavigation || !openRecovery) return {
        fixtureError: 'Recovery entry was not rendered',
        hasCommandNavigation: Boolean(commandNavigation),
        hasOpenRecovery: Boolean(openRecovery),
        pageTitle: document.querySelector('#pageTitle')?.textContent || '',
        attentionText: document.querySelector('#attentionHost')?.textContent || '',
        bodyText: document.body.textContent.slice(0, 300)
      };
      openRecovery.click();
      const original = document.querySelector('[data-recovery-feedback="RECOVERY-global"]');
      original.value = '请保留这段恢复说明';
      original.focus();
      const initiallyFocused = document.activeElement === original;

      await window.arckitDesktop.emitTestAutomationEvent({ type: 'automation.changed', reason: 'test-refresh' });
      await waitForRefresh();
      const afterEvent = document.querySelector('[data-recovery-feedback="RECOVERY-global"]');
      const eventPreserved = afterEvent === original && afterEvent.value === '请保留这段恢复说明' && document.activeElement === original;

      await window.arckitDesktop.setTestRecoveryItems([
        { id: 'RECOVERY-global', type: 'runtime_incomplete', task_id: 'T-11', message: 'Recovery details updated', freeze_scope: 'project:11', responsibility: 'operator', actions: ['feedback_continue', 'mark_blocked'] },
        { id: 'RECOVERY-extra', type: 'claim_failed', task_id: 'T-12', message: 'Second recovery item', freeze_scope: 'project:12', responsibility: 'operator', actions: ['retry_sync'] }
      ]);
      await window.arckitDesktop.emitTestAutomationEvent({ type: 'automation.changed', reason: 'test-update' });
      await waitForRefresh();
      const afterUpdate = document.querySelector('[data-recovery-feedback="RECOVERY-global"]');
      const updatePreserved = afterUpdate === original && afterUpdate.value === '请保留这段恢复说明' && document.activeElement === original;
      const updatedMessage = document.querySelector('[data-recovery-item="RECOVERY-global"] .recovery-body > p').textContent;
      const updatedActions = [...document.querySelectorAll('[data-recovery-item="RECOVERY-global"] [data-recovery-action]')].map((button) => button.dataset.recoveryAction);
      const extraAdded = Boolean(document.querySelector('[data-recovery-item="RECOVERY-extra"]'));

      await window.arckitDesktop.setTestRecoveryItems([
        { id: 'RECOVERY-global', type: 'runtime_incomplete', task_id: 'T-11', message: 'Recovery details updated', freeze_scope: 'project:11', responsibility: 'operator', actions: ['feedback_continue', 'mark_blocked'] }
      ]);
      await window.arckitDesktop.emitTestAutomationEvent({ type: 'automation.changed', reason: 'test-delete' });
      await waitForRefresh();
      const afterDelete = document.querySelector('[data-recovery-feedback="RECOVERY-global"]');
      const deletePreserved = afterDelete === original && afterDelete.value === '请保留这段恢复说明' && document.activeElement === original;
      const extraRemoved = !document.querySelector('[data-recovery-item="RECOVERY-extra"]');

      document.querySelector('[data-recovery-item="RECOVERY-global"] [data-recovery-action="feedback_continue"]').click();
      await waitForRefresh();
      const calls = await window.arckitDesktop.getTestCalls();
      const submitCall = calls.find(([name]) => name === 'resolveAutomationRecovery');
      return { initiallyFocused, eventPreserved, updatePreserved, deletePreserved, updatedMessage, updatedActions, extraAdded, extraRemoved, submitCall };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    exitCode = 1;
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    process.exitCode = exitCode;
    app.quit();
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
