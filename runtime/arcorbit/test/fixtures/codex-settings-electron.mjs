import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-codex-settings-${process.pid}`);
process.env.ARCORBIT_CODEX_SETTINGS_FIXTURE = "1";
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
      const waitFor = async (predicate, label = 'condition') => {
        const deadline = Date.now() + 5000;
        while (!predicate()) { if (Date.now() > deadline) throw new Error('UI wait timeout: ' + label); await new Promise(r => setTimeout(r, 20)); }
      };
      const el = id => document.getElementById(id);
      const type = (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event('input', { bubbles: true })); };
      await waitFor(() => !document.body.classList.contains('auth-pending'));
      el('settingsButton').click();
      await waitFor(() => !el('settingsOverlay').classList.contains('hidden'));
      const yoloDefault = el('codexYoloMode').checked;
      el('codexYoloMode').click();
      const defaults = [el('codexChatModel').value, el('codexChatEffort').value, el('codexAutomationModel').value, el('codexAutomationEffort').value];
      type('codexChatModel', 'test-model');
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      const preservedDraft = el('codexChatModel').value;
      const levels = Array.from(el('codexChatEffortOptions').options, option => option.value);
      const retainedLevel = el('codexChatEffort').value;
      type('codexChatEffort', 'max');
      type('codexAutomationModel', 'automation-model');
      type('codexAutomationEffort', 'low');
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('已保存'));
      const savedInPlace = !el('settingsOverlay').classList.contains('hidden');
      const saveFeedback = el('codexSettingsFeedback').textContent;
      el('closeSettingsButton').click();
      el('settingsButton').click();
      await waitFor(() => !el('settingsOverlay').classList.contains('hidden'));
      const yoloRestored = el('codexYoloMode').checked;
      const restored = [el('codexChatModel').value, el('codexChatEffort').value, el('codexAutomationModel').value, el('codexAutomationEffort').value];
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      await window.arckitDesktop.setTestCodexFailures({ catalog: true, save: true });
      type('codexChatModel', 'future-model');
      el('refreshCodexModelsButton').click();
      await waitFor(() => !el('refreshCodexModelsButton').disabled);
      const manualFallback = el('codexCatalogFeedback').textContent;
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('保存失败'));
      const failedDraft = el('codexChatModel').value;
      await window.arckitDesktop.setTestCodexFailures({ catalog: false, save: false });
      el('saveCodexSettingsButton').click();
      await waitFor(() => el('codexSettingsFeedback').textContent.includes('已保存'));
      const settingsFieldWidth = el('codexChatModel').getBoundingClientRect().width;
      el('closeSettingsButton').click();
      document.querySelector('[data-page="chat"]').click();
      await waitFor(() => !el('chatCodexModel').disabled, 'Chat Composer enabled');
      const composerDefaults = [el('chatCodexModel').value, el('chatCodexEffort').value];
      el('chatCodexModel').focus();
      el('chatCodexModel').dispatchEvent(new Event('focus'));
      await waitFor(() => el('chatCodexModel').options.length > 1, 'Chat Composer catalog');
      const composerModels = Array.from(el('chatCodexModel').options, option => option.value);
      el('chatCodexModel').value='test-model';el('chatCodexModel').dispatchEvent(new Event('change',{bubbles:true}));
      el('chatCodexEffort').value='max';el('chatCodexEffort').dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(r => setTimeout(r, 450));
      const calls = await window.arckitDesktop.getTestCalls();
      return { yoloDefault, yoloRestored, defaults, preservedDraft, levels, retainedLevel, savedInPlace, saveFeedback, restored, manualFallback, failedDraft,
        saves: calls.filter(([method]) => method === 'updateSettings'),
        composerDefaults, composerModels, composerDrafts: calls.filter(([method]) => method === 'createChat'),
        modelInputType: el('codexChatModel').type, effortInputType: el('codexChatEffort').type,
        hasLiveFeedback: el('codexSettingsFeedback').getAttribute('aria-live') === 'polite',
        fieldWidth: settingsFieldWidth };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(process.exitCode || 0);
  }
}).catch((error) => { process.stderr.write(`${error.stack}\n`); app.exit(1); });
