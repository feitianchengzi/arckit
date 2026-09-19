import { app, BrowserWindow } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mainWindowChromeOptions } from '../../src/main-window-controls.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'arcorbit-titlebar-free-'));
const output = resolve(process.env.ARCORBIT_CHROME_EVIDENCE || join(scratch, 'evidence'));
app.setPath('userData', join(scratch, 'user'));
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
let status = 0;
app.whenReady().then(async () => {
try {
  await mkdir(output, { recursive: true });
  const results = [];
  for (const mode of ['native-macos', 'custom']) {
    const preload = (await readFile(join(here, 'organization-center-preload.cjs'), 'utf8'))
      .replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
        windowControlMode: '${mode}',
        projectWorkbenchSnapshot: async () => ({projects:[],tasks:[],runtime:{},user:{name:'Glare'},account_scope:'fixture'}),
        projectWorkbenchDetail: async () => null,
        projectWorkbenchCommand: async () => ({}),
        setChromeSync: async (value) => { Object.assign(automation,value); for(const fn of automationListeners) fn({type:'automation.changed'}); },
      `);
    const preloadPath = join(scratch, `preload-${mode}.cjs`);
    await writeFile(preloadPath, preload);
    const win = new BrowserWindow({ show: false, width: 1440, height: 960,
      ...mainWindowChromeOptions(mode === 'native-macos' ? 'darwin' : 'win32'),
      webPreferences: { preload: preloadPath, contextIsolation: true, sandbox: false } });
    const errors = [];
    win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
    const js = code => win.webContents.executeJavaScript(code);
    const pause = () => new Promise(r => setTimeout(r, 300));
    try {
      await win.loadFile(join(here, '../../desktop/renderer/index.html'));
      await pause();
      for (const page of ['command', 'chat', 'project-workbench']) {
        win.setSize(1440, 960);
        await js(`document.querySelector('[data-page="${page}"]').click()`);
        await pause();
        for (const width of page === 'command' ? [1440] : [1440, 760, 390]) {
          win.setSize(width, 960); await pause();
          const geometry = await js(`(() => {
            const q=s=>document.querySelector(s), rect=s=>q(s).getBoundingClientRect().toJSON();
            const controls=rect('.window-controls');
            const heading=q('.is-active .chat-page-heading') || q('.is-active .pw-top') || q('.commandbar');
            return {width:innerWidth,stage:rect('.app-stage'),sidebar:rect('.sidebar'),controls,
              titlebar:!!q('.titlebar'),overflow:document.documentElement.scrollWidth>innerWidth,
              syncInsideSettings:q('#accountButton').contains(q('#accountSync')),
              heading:heading.getBoundingClientRect().toJSON(),
              drag:getComputedStyle(heading).webkitAppRegion,
              controlDrag:getComputedStyle(q('.window-controls')).webkitAppRegion};
          })()`);
          assert.equal(geometry.titlebar, false);
          assert.equal(geometry.stage.top, 0);
          assert.equal(geometry.stage.bottom, 960);
          assert.equal(geometry.overflow, false);
          assert.equal(geometry.syncInsideSettings, true);
          assert.equal(geometry.drag, 'drag');
          assert.equal(geometry.controlDrag, 'no-drag');
          if (mode === 'custom') assert.equal(geometry.controls.width, 138);
          else assert.equal(geometry.controls.width, 0);
          if (width <= 760) {
            await js(`document.querySelector('#legacyPagesButton').click()`); await pause();
            const drawer = await js(`(() => {const n=document.querySelector('#accountSync'),r=n.getBoundingClientRect();return {visible:r.width>0&&r.height>0,bottom:r.bottom,within:r.right<=innerWidth};})()`);
            assert.equal(drawer.visible, true); assert.equal(drawer.within, true); assert.ok(drawer.bottom <= 960);
            await js(`document.querySelector('#legacyPagesButton').click()`);
          }
          results.push({ mode, page, ...geometry });
          await writeFile(join(output, `${mode}-${page}-${width}.png`), (await win.webContents.capturePage()).toPNG());
        }
      }
      win.setSize(1440, 960);
      await js(`document.querySelector('[data-page="command"]').click()`); await pause();
      const initial = await js(`document.querySelector('#accountSync').textContent`);
      assert.match(initial, /同步于/);
      await js(`window.arckitDesktop.setChromeSync({source_status:'syncing'})`); await pause();
      assert.equal(await js(`document.querySelector('#accountSync').textContent`), '同步中');
      await js(`window.arckitDesktop.setChromeSync({source_status:'error'})`); await pause();
      assert.equal(await js(`document.querySelector('#accountSync').classList.contains('error')`), true);
      assert.equal(await js(`document.querySelector('#accountSync').textContent`), initial);
      await js(`document.querySelector('#accountButton').click()`); await pause();
      assert.equal(await js(`document.querySelector('#settingsOverlay').classList.contains('hidden')`), false);
      assert.deepEqual(errors, []);
    } finally { win.destroy(); }
  }
  await writeFile(join(output, 'result.json'), JSON.stringify({results, checks:['production shell geometry','settings entry and sync state updates','native/custom layout projections'], limitations:['Business data and IPC are fixture-backed. Native OS behavior is tested separately.']}, null, 2));
  console.log(JSON.stringify({passed:true,measurements:results.length,output}));
} catch (error) { status = 1; console.error(error.stack); }
finally { await rm(scratch, {recursive:true,force:true}); app.exit(status); }

}).catch(error => { console.error(error); app.exit(1); });
