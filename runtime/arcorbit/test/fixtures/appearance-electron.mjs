import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppearance, appearanceBackground, registerAppearanceIpc } from '../../src/desktop/appearance.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'arcorbit-appearance-electron-'));
const evidence = process.env.ARCORBIT_VISUAL_EVIDENCE;
app.setPath('userData', scratch);
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
const actualPreload = await readFile(join(here, '../../desktop/preload.cjs'), 'utf8');
const appearanceBridge = actualPreload.slice(actualPreload.indexOf('  initialAppearance:'), actualPreload.indexOf('  setWorkspaceSurface:'));
const preload = (await readFile(join(here, 'organization-center-preload.cjs'), 'utf8')).replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
${appearanceBridge}
  productSnapshot: async () => ({projects:[], records:[], ideas:[], organizations:[], errors:[]}),
  releaseSnapshot: async () => ({projects:[], records:[]}),
  engineeringSnapshot: async () => ({revision:1, catalogVersion:'fixture', skills:[], scenes:[{id:'chat', managedCount:0},{id:'automation', managedCount:0}]}),
  projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
  projectWorkbenchDetail:async id=>({task:platform.tasks.find(t=>t.id===id),scene:{task_id:id,revision:0,criteria:[],agreements:[],plan:[],context:[],reports:[],events:[],receipts:{}},executions:[],history:[],attention:[],recovery:[],children:[],feedback:[],attachments:[],messages:[],runs:[]}),
  projectWorkbenchCommand:async()=>({}),onProjectWorkbenchEvent:()=>{},
`);
await writeFile(join(scratch, 'preload.cjs'), preload);
app.whenReady().then(async () => {
const path = join(scratch, 'appearance.json');
await writeFile(path, '{"preference":"dark"}');
const owner = await createAppearance({ path, nativeTheme });
let win;
registerAppearanceIpc({ ipcMain, appearance: owner, getWindow: () => win });
owner.subscribe(snapshot => { win?.setBackgroundColor(appearanceBackground(snapshot)); win?.webContents.send('arckit:appearance-changed', snapshot); });
const errors = [], checks = [], pages = [];
const open = async () => {
  win = new BrowserWindow({ show:false, width:1440, height:960, backgroundColor:appearanceBackground(owner.snapshot()), webPreferences:{preload:join(scratch,'preload.cjs'),contextIsolation:true,sandbox:false} });
  win.webContents.on('console-message', (_e,level,message) => { if(level>=3) errors.push(message); });
  await win.loadFile(join(here,'../../desktop/renderer/index.html'));
};
const js = code => win.webContents.executeJavaScript(code);
const wait = () => new Promise(r=>setTimeout(r,200));
const select = async value => { await js(`document.getElementById('appearanceTheme').value=${JSON.stringify(value)};document.getElementById('appearanceTheme').dispatchEvent(new Event('change'))`); await wait(); };
const capture = async name => { if(evidence){await mkdir(evidence,{recursive:true});await writeFile(join(evidence,name+'.png'),(await win.webContents.capturePage()).toPNG());} };
try {
  await open();
  assert.equal(await js('document.documentElement.dataset.theme'),'dark');
  assert.equal(win.getBackgroundColor(),'#121722');
  await wait();
  checks.push('persisted dark applied before showing the actual Renderer, with dark native background');
  for(const mode of ['dark','light']) {
    await owner.setPreference(mode);await wait();
    for(const page of ['today','product','work','feedback','command','chat','idea','organization','release','operations','engineering']) {
      await js(`document.querySelector('[data-page="${page}"]').click()`);await wait();
      const result = await js(`(() => {const root=document.querySelector('[data-page-view="${page}"]');const visible=n=>n.checkVisibility()&&n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0;return {page:'${page}',mode:'${mode}',visible:visible(root),sidebar:getComputedStyle(document.querySelector('.sidebar')).backgroundColor,whiteSurfaces:[...root.querySelectorAll('*')].filter(n=>visible(n)&&getComputedStyle(n).backgroundColor==='rgb(255, 255, 255)').map(n=>n.className).slice(0,15)}})()`);
      assert.equal(result.visible,true,page);
      assert.equal(result.sidebar,mode==='dark'?'rgb(18, 23, 34)':'rgb(247, 248, 250)',page);
      if(mode==='dark') assert.deepEqual(result.whiteSurfaces,[],`${page}: white surface remains`);
      pages.push(result);
      if(mode==='dark'&&['work','chat','release'].includes(page))await capture(page+'-dark');
    }
  }
  checks.push('11 production page shells adapt in both themes without white surfaces in dark mode');
  await js("document.querySelector('#accountButton').click()");await wait();
  const callsBefore = await js('arckitDesktop.getTestCalls()');
  await js("document.querySelector('#codexChatModel').value='unsaved-model';document.querySelector('#appearanceTheme').focus()");
  win.webContents.focus();
  await select('dark');
  assert.equal(await js("document.querySelector('#codexChatModel').value"),'unsaved-model');
  assert.equal(await js('document.activeElement.id'),'appearanceTheme');
  assert.deepEqual(await js('arckitDesktop.getTestCalls()'),callsBefore);
  assert.equal(JSON.parse(await readFile(path,'utf8')).preference,'dark');
  await capture('settings-dark');
  checks.push('real IPC saves appearance independently; no business call, lost form draft or lost focus');
  await rename(path,path+'.saved');await mkdir(path);
  await select('light');
  assert.equal(await js('document.documentElement.dataset.theme'),'dark');
  assert.equal(await js("document.querySelector('#appearanceTheme').value"),'dark');
  assert.match(await js("document.querySelector('#appearanceFeedback').textContent"),/未能保存/);
  await rm(path,{recursive:true});await rename(path+'.saved',path);
  await select('light');
  assert.equal(owner.snapshot().preference,'light');
  checks.push('real filesystem write failure restores prior preference; retry succeeds');
  await js("for(const value of ['dark','system','light','dark']){const s=document.querySelector('#appearanceTheme');s.value=value;s.dispatchEvent(new Event('change'));}");await wait();
  assert.equal(owner.snapshot().preference,'dark');
  checks.push('rapid updates persist the last successful choice');
  win.destroy();win=null;await open();await wait();
  assert.equal(await js('document.documentElement.dataset.theme'),'dark');
  await js("document.querySelector('#accountButton').click()");await wait();
  assert.equal(await js("document.querySelector('#appearanceTheme').value"),'dark');
  checks.push('recreated window receives current persisted preference through production preload bridge');
  await js("document.querySelector('#settingsOverlay').classList.add('login-gate');document.querySelector('#authLoginPanel').classList.remove('hidden')");
  assert.equal(await js("document.querySelector('#appearanceTheme').checkVisibility()"),true);
  await select('light');await select('dark');
  await capture('login-dark');
  checks.push('appearance remains available in the unauthenticated login surface');
  await js("document.querySelector('#settingsOverlay').classList.add('hidden');document.querySelector('#setupReadiness').classList.remove('hidden')");
  await capture('setup-dark');
  assert.deepEqual(errors,[]);
  const result={checks,pages,errors,limitations:['business services use isolated fixtures','Windows/Linux native controls not executed on this macOS host']};
  if(evidence)await writeFile(join(evidence,'verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
} catch(error){console.error(error.stack);process.exitCode=1;}
finally{win?.destroy();owner.dispose();await rm(scratch,{recursive:true,force:true});app.exit(process.exitCode||0);}

}).catch(error => { console.error(error); app.exit(1); });
