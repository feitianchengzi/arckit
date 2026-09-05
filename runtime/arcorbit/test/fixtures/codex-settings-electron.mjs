import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-codex-settings-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({ show: false, width: 1200, height: 820, webPreferences: {
    preload: join(fixtureDir, "organization-center-preload.cjs"), contextIsolation: true, sandbox: false
  } });
  window.webContents.on("console-message", (_event, level, message) => { if (level >= 2) errors.push(message); });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const waitFor = async (predicate) => {
        const deadline = Date.now() + 5000;
        while (!predicate()) { if (Date.now() > deadline) throw new Error('UI wait timeout'); await new Promise(r => setTimeout(r, 20)); }
      };
      const el = id => document.getElementById(id);
      const type = (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event('input', { bubbles: true })); };
      await waitFor(() => !document.body.classList.contains('auth-pending'));
      el('settingsButton').click();
      await waitFor(() => !el('settingsOverlay').classList.contains('hidden'));
      const defaults = [el('codexModel').value, el('codexEffort').value];
      type('codexModel', 'test-model');
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      const preservedDraft = el('codexModel').value;
      const levels = Array.from(el('codexEffortOptions').options, option => option.value);
      const retainedLevel = el('codexEffort').value;
      type('codexEffort', 'max');
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('已保存'));
      const savedInPlace = !el('settingsOverlay').classList.contains('hidden');
      const saveFeedback = el('codexSettingsFeedback').textContent;
      el('closeSettingsButton').click();
      el('settingsButton').click();
      await waitFor(() => !el('settingsOverlay').classList.contains('hidden'));
      const restored = [el('codexModel').value, el('codexEffort').value];
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      await window.arckitDesktop.setTestCodexFailures({ catalog: true, save: true });
      type('codexModel', 'future-model');
      el('refreshCodexModelsButton').click();
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      const manualFallback = el('codexCatalogFeedback').textContent;
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('保存失败'));
      const failedDraft = el('codexModel').value;
      await window.arckitDesktop.setTestCodexFailures({ catalog: false, save: false });
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('已保存'));
      const calls = await window.arckitDesktop.getTestCalls();
      return { defaults, preservedDraft, levels, retainedLevel, savedInPlace, saveFeedback, restored, manualFallback, failedDraft,
        saves: calls.filter(([method]) => method === 'updateSettings'),
        modelInputType: el('codexModel').type, effortInputType: el('codexEffort').type,
        hasLiveFeedback: el('codexSettingsFeedback').getAttribute('aria-live') === 'polite',
        fieldWidth: el('codexModel').getBoundingClientRect().width };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => { process.stderr.write(`${error.stack}\n`); app.exit(1); });
