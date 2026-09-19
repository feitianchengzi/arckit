import { app, BrowserWindow } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'arcorbit-visual-'));
app.setPath('userData', scratch);
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
const preload = (await readFile(join(here, 'organization-center-preload.cjs'), 'utf8')).replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
  productSnapshot: async () => ({projects:[], records:[], ideas:[], organizations:[], errors:[]}),
  releaseSnapshot: async () => ({projects:[], records:[]}),
  engineeringSnapshot: async () => ({revision:1, catalogVersion:'fixture', skills:[], scenes:[{id:'chat', managedCount:0},{id:'automation', managedCount:0}]}),
`);
await writeFile(join(scratch, 'preload.cjs'), preload);
app.whenReady().then(async () => {
const window = new BrowserWindow({ show: false, width: 1440, height: 960, webPreferences: {
  preload: join(scratch, 'preload.cjs'), contextIsolation: true, sandbox: false
} });
const screenshots = process.env.ARCORBIT_VISUAL_EVIDENCE;
async function capture(name) {
  if (!screenshots) return;
  await window.webContents.executeJavaScript("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))");
  await mkdir(screenshots, { recursive: true });
  await writeFile(join(screenshots, `${name}.png`), (await window.webContents.capturePage()).toPNG());
}
try {
  await window.loadFile(join(here, '../../desktop/renderer/index.html'));
  await new Promise(r => setTimeout(r, 350));
  const js = source => window.webContents.executeJavaScript(source);
  const pages = ['today','product','work','feedback','command','chat','idea','organization','release','operations','engineering'];
  const checks = [];
  for (const page of pages) {
    const result = await js(`(async () => {
      document.querySelector('[data-page="${page}"]').click();
      await new Promise(r => setTimeout(r, 150));
      const visible = n => n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0;
      const root = document.querySelector('[data-page-view="${page}"]');
      const sidebar = getComputedStyle(document.querySelector('.sidebar'));
      const primary = [...root.querySelectorAll('.primary-button')].filter(n => visible(n) && !n.disabled).map(n => {
        const s = getComputedStyle(n); return { background:s.backgroundColor, color:s.color, image:s.backgroundImage };
      });
      return {page:'${page}', visible:visible(root), sidebar:sidebar.backgroundColor, primary};
    })()`);
    assert.equal(result.visible, true, page);
    assert.equal(result.sidebar, 'rgb(247, 248, 250)', page);
    for (const button of result.primary) {
      assert.equal(button.background, 'rgb(244, 183, 125)', page);
      assert.equal(button.color, 'rgb(51, 44, 38)', page);
      assert.equal(button.image, 'none', page);
    }
    checks.push(result);
    await capture(page);
  }
  // Real settings entry, without modifying account or executing commands.
  await js(`document.querySelector('#accountButton').click()`);
  await new Promise(r => setTimeout(r, 150));
  await capture('settings');
  window.webContents.focus();
  const controls = await js(`(() => {
    const node = document.querySelector('.window-control');
    const target = document.querySelector('#codexChatModel');
    target?.focus();
    return {windowColor:getComputedStyle(node).color, focus:target ? getComputedStyle(target).outlineColor : null,
      primary:getComputedStyle(document.querySelector('#loginButton')).backgroundColor};
  })()`);
  assert.equal(controls.windowColor, 'rgb(18, 23, 34)');
  assert.equal(controls.primary, 'rgb(244, 183, 125)');
  assert.equal(controls.focus, 'rgb(155, 87, 45)');
  // The unauthenticated visual state shares this actual settings panel.
  await js(`document.querySelector('#settingsOverlay').classList.add('login-gate'); document.querySelector('#authLoginPanel').classList.remove('hidden')`);
  await capture('login');
  console.log(JSON.stringify({ pages: checks, controls }));
} catch (error) {
  console.error(error.stack); process.exitCode = 1;
} finally {
  window.destroy(); await rm(scratch, { recursive: true, force: true }); app.exit(process.exitCode || 0);
}

});
