import { app, BrowserWindow, ipcMain } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStallMonitor } from '../../src/desktop/stall-monitor.mjs';
import { traceStallOperation } from '../../src/desktop/stall-operations.mjs';
import { createStallRecords } from '../../src/desktop/stall-records.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const base = await mkdtemp(join(tmpdir(), 'arcorbit-stall-electron-'));
const output = process.env.ARCORBIT_TEST_OUTPUT || await mkdtemp(join(tmpdir(), 'arcorbit-stall-evidence-'));
app.setPath('userData', join(base, 'profile')); app.disableHardwareAcceleration(); app.on('window-all-closed', () => {});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 20000) { const start = Date.now(); while (Date.now() - start < timeout) { if (await fn()) return; await pause(100); } throw Error('condition timed out'); }
app.whenReady().then(async () => {
let win, monitor, code = 0;
const checks = [], errors = [];
try {
  await mkdir(output, { recursive: true });
  const directory = join(base, 'stalls');
  monitor = createStallMonitor({ directory, version: app.getVersion(), getMetrics: () => app.getAppMetrics(), timing: { thresholdMs: 1000, tickMs: 100, recoveryMs: 500 } });
  ipcMain.on('arckit:appearance-initial', event => { event.returnValue = { preference: 'light', resolved: 'light' }; });
  ipcMain.on('arckit:stall-heartbeat', (_event, active) => monitor.rendererBeat(active));
  win = new BrowserWindow({ show: true, width: 500, height: 300, webPreferences: { backgroundThrottling: false, preload: join(here, '../../desktop/preload.cjs'), contextIsolation: true } });
  await win.loadURL('data:text/html,<title>Stall heartbeat test</title><p>Diagnostic integration test</p>');
  await pause(1200);
  function simulatedElectronMainWork() { const end = Date.now() + 1600; while (Date.now() < end) { Math.sqrt(Date.now()); } }
  traceStallOperation('test.electron.main-load', simulatedElectronMainWork, { items: 123 });
  await until(async () => (await monitor.pending()).length > 0);
  const mainFiles = (await readdir(directory)).filter(name => name.endsWith('.json'));
  const mainRecord = JSON.parse(await readFile(join(directory, mainFiles[0]), 'utf8'));
  assert.equal(mainRecord.source, 'main');
  assert.equal(mainRecord.cpu_profile.status, 'captured', JSON.stringify(mainRecord.cpu_profile));
  assert.ok(mainRecord.cpu_profile.top.some(x=>x.stack.some(frame=>frame.fn==='simulatedElectronMainWork')), JSON.stringify(mainRecord.cpu_profile));
  assert.ok(Date.parse(mainRecord.metrics_after.at) >= Date.parse(mainRecord.recovered_at));
  assert.ok(mainRecord.operations.some(x=>x.name==='test.electron.main-load' && x.duration_ms>=1500));
  await writeFile(join(output, 'main-stall.json'), JSON.stringify(mainRecord, null, 2));
  checks.push('Real Electron main block identifies the busy function, operation duration and a new recovery sample');
  for (const name of mainFiles) await rm(join(directory, name));
  await win.webContents.executeJavaScript('const until=performance.now()+1600;while(performance.now()<until){};true');
  let reports;
  await until(async () => { reports = await monitor.pending(); return reports.length > 0; });
  assert.equal(reports[0].source, 'renderer');
  checks.push('Production sandbox preload detects a real renderer block');
  win.destroy(); await monitor.close(); monitor = null;
  const records = createStallRecords({directory});
  // Keep both incidents for a genuine multi-record context handoff.
  await writeFile(join(directory, mainFiles[0]), JSON.stringify(mainRecord));
  ipcMain.handle('stall-fixture-overview', (_event,range)=>records.overview(range));
  ipcMain.handle('stall-fixture-analysis', (_event,range)=>records.analysis(range));
  ipcMain.handle('stall-fixture-prompt', () => records.promptSettings());
  ipcMain.handle('stall-fixture-prompt-save', (_event,template) => records.savePrompt(template));
  ipcMain.handle('stall-fixture-clear', (_event,tokens)=>records.clear(tokens));
  let preload = await readFile(join(here, 'organization-center-preload.cjs'), 'utf8');
  preload = preload.replace('const codexSettingsFixture = process.env.ARCORBIT_CODEX_SETTINGS_FIXTURE === "1";', 'const codexSettingsFixture = true;');
  preload = preload.replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
    chatFiles:async()=>({workspace:'',entries:[]}),
    stallOverview:range=>ipcRenderer.invoke('stall-fixture-overview',range),
    stallPrompt:()=>ipcRenderer.invoke('stall-fixture-prompt'),
    saveStallPrompt:template=>ipcRenderer.invoke('stall-fixture-prompt-save',template),
    stallAnalysis:range=>ipcRenderer.invoke('stall-fixture-analysis',range),
    clearStalls:tokens=>ipcRenderer.invoke('stall-fixture-clear',tokens),
    releaseSnapshot:async()=>({projects:[],records:[]}),releaseDetail:async()=>({}),syncWork:async()=>({}),
    projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
    projectWorkbenchDetail:async()=>({}),onProjectWorkbenchEvent:()=>{},`);
  await writeFile(join(base, 'preload.cjs'), preload);
  win = new BrowserWindow({ show: true, width: 1280, height: 900, webPreferences: { backgroundThrottling: false, preload: join(base, 'preload.cjs'), contextIsolation: true, sandbox: false } });
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  const js = text => win.webContents.executeJavaScript(text);
  await win.loadFile(join(here, '../../desktop/renderer/index.html'));
  await until(()=>js(`!document.body.classList.contains('auth-pending')`));
  assert.equal(await js(`document.getElementById('platformActionOverlay').classList.contains('hidden')`), true);
  await pause(500);
  await js(`document.getElementById('settingsButton').click()`);
  await until(()=>js(`!document.getElementById('settingsOverlay').classList.contains('hidden')`));
  await js(`document.querySelector('[data-settings-tab="diagnostics"]').click()`);
  await until(()=>js(`document.querySelector('#stallDiagnostics [data-summary]').textContent.includes('2 次卡顿')`));
  await pause(300);
  assert.equal(await js(`document.getElementById('settingsOverlay').classList.contains('hidden')`),false);
  await writeFile(join(output,'diagnostics.png'),(await win.webContents.capturePage()).toPNG());
  await js(`document.querySelector('#stallDiagnostics [data-prompt-panel]').open=true;document.querySelector('#stallDiagnostics [data-prompt]').value='';document.querySelector('#stallDiagnostics [data-prompt]').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#stallDiagnostics [data-prompt-save]').click();void 0`);
  await until(()=>js(`document.querySelector('#stallDiagnostics [data-prompt-status]').textContent.includes('不能为空')`));
  assert.equal(await js(`document.querySelector('#stallDiagnostics [data-prompt]').value`),'');
  assert.equal((await records.promptSettings()).is_default,true);
  await js(`arckitDesktop.stallPrompt().then(settings=>{document.querySelector('#stallDiagnostics [data-prompt]').value=settings.template;})`);
  await js(`document.querySelector('#stallDiagnostics [data-prompt-panel]').open=true;const editor=document.querySelector('#stallDiagnostics [data-prompt]');editor.value+='\\n请重点关注当前项目。';editor.dispatchEvent(new Event('input',{bubbles:true}));void 0`);
  assert.equal(await js(`document.querySelector('#stallDiagnostics [data-analyze]').disabled`),true);
  await js(`document.querySelector('#stallDiagnostics [data-prompt-save]').click()`);
  await until(()=>js(`document.querySelector('#stallDiagnostics [data-prompt-status]').textContent.includes('已保存')`));
  assert.match((await createStallRecords({directory}).promptSettings()).template,/请重点关注当前项目/);
  assert.ok(await js(`document.querySelector('#stallDiagnostics [data-prompt]').getBoundingClientRect().width > 500`));
  await js(`document.querySelector('#stallDiagnostics [data-prompt-panel]').scrollIntoView({block:'start'});void 0`);
  await pause(100);
  await writeFile(join(output,'prompt-editor.png'),(await win.webContents.capturePage()).toPNG());
  await js(`document.querySelector('#stallDiagnostics [data-analyze]').click()`);
  await until(()=>js(`arckitDesktop.getTestCalls().then(c=>c.some(x=>x[0]==='sendChatMessage'))`));
  const calls=await js(`arckitDesktop.getTestCalls()`);
  const sent=calls.filter(x=>x[0]==='sendChatMessage');
  assert.equal(sent.length,1);assert.equal(sent[0][1].session_id,'');
  assert.equal(sent[0][1].project_id,'local-11');
  assert.ok(sent[0][1].text.includes(directory));
  assert.ok(!sent[0][1].text.includes(mainRecord.id));
  assert.match(sent[0][1].text,/时间范围.*started_at/);
  assert.ok(sent[0][1].text.length < 2000);
  assert.match(sent[0][1].text,/不创建待办/);
  assert.match(sent[0][1].text,/请重点关注当前项目/);
  assert.equal((await records.overview('all')).count,2);
  assert.equal(await js(`document.getElementById('settingsOverlay').classList.contains('hidden')`),true);
  checks.push('Production settings preserve invalid drafts, save persistent custom prompts, and send populated context into a new scoped Chat');
  await js(`document.getElementById('settingsButton').click();window.confirm=()=>true;void 0`);
  await until(()=>js(`!document.querySelector('#stallDiagnostics [data-clear]').disabled`));
  await js(`document.querySelector('#stallDiagnostics [data-prompt-reset]').click()`);
  await until(()=>js(`document.querySelector('#stallDiagnostics [data-prompt-status]').textContent.includes('默认')`));
  assert.equal((await createStallRecords({directory}).promptSettings()).is_default,true);
  await js(`document.querySelector('#stallDiagnostics [data-clear]').click()`);
  await until(async()=>!(await records.overview('all')).count);
  assert.ok(!(await readdir(directory)).includes('analyses'));
  checks.push('Manual range cleanup removes records; analysis creates no snapshot');
  assert.deepEqual(errors,[]);
  await writeFile(join(output, 'result.json'), JSON.stringify({ status: 'passed', checks, boundary: 'Real Electron worker, production preload and renderer. Chat API uses an isolated fixture; no live Agent or remote task is started.' }, null, 2));
  console.log(JSON.stringify({ status: 'passed', checks, output }));
} catch (error) { code = 1; console.error(error); await writeFile(join(output, 'failure.json'), JSON.stringify({ error: String(error.stack), checks, errors, ui: win && !win.isDestroyed() ? await win.webContents.executeJavaScript(`(async()=>({focused:document.hasFocus(),visibility:document.visibilityState,authentication:await arckitDesktop.getAuthStatus(),title:document.getElementById('platformActionTitle')?.textContent,dialogs:document.querySelectorAll('dialog[open]').length,toast:document.getElementById('toast')?.textContent}))()`).catch(()=>null) : null }, null, 2)); }
finally { if (win && !win.isDestroyed()) win.destroy(); await monitor?.close(); await rm(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); app.exit(code); }

});
