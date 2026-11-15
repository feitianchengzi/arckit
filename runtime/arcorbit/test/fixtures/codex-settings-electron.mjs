import { app, BrowserWindow } from "electron";
import { rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-codex-settings-${process.pid}`);
process.env.ARCORBIT_CODEX_SETTINGS_FIXTURE = "1";
app.setPath("userData", userData);
app.disableHardwareAcceleration();
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  await mkdir(userData, {recursive:true});
  const output = process.env.ARCORBIT_TEST_OUTPUT;
  if (output) await mkdir(output, {recursive:true});
  let preload = await readFile(join(fixtureDir, "organization-center-preload.cjs"), "utf8");
  preload = preload.replace('let codexSettings = { model: "gpt-6-astra", reasoning_effort: "high" };', 'let codexSettings = {yolo_mode:false,chat:{model:"gpt-6-astra",reasoning_effort:"high"},automation:{model:"gpt-6-astra",reasoning_effort:"high"}};');
  preload = preload.replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
    chatFiles:async()=>({workspace:'',entries:[]}),
    releaseSnapshot:async()=>({projects:[],records:[]}),releaseDetail:async()=>({}),
    syncWork:async()=>{calls.push(['syncWork']);return {}},
    projectWorkbenchCommand:async(action)=>{calls.push(['projectWorkbenchCommand',action]);return {}},
    projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
    projectWorkbenchDetail:async()=>({}),onProjectWorkbenchEvent:()=>{},`);
  await writeFile(join(userData, "preload.cjs"), preload);
  const errors = [];
  const window = new BrowserWindow({ show: false, width: 1200, height: 820, webPreferences: {
    preload: join(userData, "preload.cjs"), contextIsolation: true, sandbox: false
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
      const tab = key => document.querySelector('[data-settings-tab="' + key + '"]').click();
      tab('runtime');
      const nav = document.querySelector('[data-settings-tab="runtime"]');
      if(nav.getAttribute('aria-current') !== 'page') throw Error('Missing navigation current state');
      el('closeSettingsButton').focus();
      el('closeSettingsButton').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
      if(!el('settingsPanel').contains(document.activeElement)||document.activeElement===el('closeSettingsButton')) throw Error('Focus trap failed');
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
      el('saveCodexChatButton').click();
      await waitFor(() => el('codexChatFeedback').textContent.includes('已保存'));
      const afterChatSave = (await window.arckitDesktop.getSettings()).codex;
      if(afterChatSave.automation.model !== 'gpt-6-astra' || afterChatSave.yolo_mode !== false) throw Error('Chat saved unrelated drafts');
      if(el('codexAutomationModel').value !== 'automation-model' || !el('codexYoloMode').checked) throw Error('Unrelated draft lost');
      el('saveCodexAutomationButton').click();
      await waitFor(()=>el('codexAutomationFeedback').textContent.includes('已保存'));
      el('saveCodexPermissionsButton').click();
      await waitFor(()=>el('codexPermissionsFeedback').textContent.includes('已保存'));
      tab('network'); type('codexProxyUrl','http://127.0.0.1:7890');
      tab('source'); type('taskSourceServiceName','draft-service');
      tab('network');
      if(el('codexProxyUrl').value !== 'http://127.0.0.1:7890') throw Error('Navigation lost proxy draft');
      await window.arckitDesktop.setTestCodexFailures({catalog:false,save:true});
      el('saveProxySettingsButton').click();
      await waitFor(()=>el('proxySettingsFeedback').textContent.includes('保存失败'));
      if(el('codexProxyUrl').value !== 'http://127.0.0.1:7890' || el('saveProxySettingsButton').disabled) throw Error('Proxy retry lost draft or remained disabled');
      await window.arckitDesktop.setTestCodexFailures({catalog:false,save:false});
      el('saveProxySettingsButton').click();
      await waitFor(()=>el('proxySettingsFeedback').textContent.includes('已保存'));
      if(el('taskSourceServiceName').value !== 'draft-service') throw Error('Proxy save lost source draft');
      tab('source'); el('saveTaskSourceButton').click();
      await waitFor(()=>el('taskSourceSettingsFeedback').textContent.includes('已保存'));
      const beforeSync = await window.arckitDesktop.getTestCalls();
      if(beforeSync.some(x=>x[0]==='syncWork'||x[0]==='projectWorkbenchCommand'&&x[1]==='sync')) throw Error('Save unexpectedly synchronized');
      tab('workspace');el('workbenchSyncSettings').click();
      await waitFor(()=>el('toast').textContent.includes('已同步'));
      tab('runtime');
      const savedInPlace = !el('settingsOverlay').classList.contains('hidden');
      const saveFeedback = el('codexChatFeedback').textContent;
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
      el('saveCodexChatButton').click();
      await waitFor(() => el('codexChatFeedback').textContent.includes('保存失败'));
      const failedDraft = el('codexChatModel').value;
      await window.arckitDesktop.setTestCodexFailures({ catalog: false, save: false });
      el('saveCodexChatButton').click();
      await waitFor(() => el('codexChatFeedback').textContent.includes('已保存'));
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
        hasLiveFeedback: el('codexChatFeedback').getAttribute('aria-live') === 'polite',
        fieldWidth: settingsFieldWidth };
    })()`);
    for (const [name, width, height, theme] of [['desktop',1200,820,'light'],['narrow',560,760,'light'],['dark',1200,820,'dark']]) {
      window.setSize(width,height);
      await window.webContents.executeJavaScript(`document.getElementById('settingsButton').click();document.documentElement.dataset.theme='${theme}';void 0`);
      await new Promise(r=>setTimeout(r,200));
      const layout=await window.webContents.executeJavaScript(`(() => {const p=document.getElementById('settingsPanel'),r=p.getBoundingClientRect();return {inside:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overflow:p.scrollWidth>p.clientWidth,visible:[...document.querySelectorAll('[data-settings-page]')].filter(x=>!x.hidden).length}})()`);
      if(!layout.inside||layout.overflow||layout.visible!==1)throw Error('Settings layout failed '+name+JSON.stringify(layout));
      if(output)await writeFile(join(output,name+'.png'),(await window.webContents.capturePage()).toPNG());
      await window.webContents.executeJavaScript(`document.getElementById('closeSettingsButton').click()`);
    }
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    app.exit(process.exitCode || 0);
  }
}).catch((error) => { process.stderr.write(`${error.stack}\n`); app.exit(1); });
