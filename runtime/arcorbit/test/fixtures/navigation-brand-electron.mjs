import { app, BrowserWindow } from 'electron';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = mkdtempSync(join(tmpdir(), 'arcorbit-navigation-'));
const renderer = fileURLToPath(new URL('../../desktop/renderer/', import.meta.url));
app.setPath('userData', join(base, 'user'));
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
const win = new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { backgroundThrottling: false } });
let status = 0;
try {
  // Exercise the production DOM and full stylesheet cascade without backend state.
  const html = (await readFile(join(renderer, 'index.html'), 'utf8'))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace('<head>', `<head><base href="file://${renderer}">`);
  await writeFile(join(base, 'navigation.html'), html);
  await win.loadFile(join(base, 'navigation.html'));
  await win.webContents.executeJavaScript("document.querySelectorAll('#authBootScreen,#setupReadiness').forEach(e => e.remove())");
  const measurements = [];
  for (const width of [1280, 900, 600]) {
    win.setSize(width, 900);
    for (const theme of ['light', 'dark']) {
      const result = await win.webContents.executeJavaScript(`(() => {
        document.documentElement.dataset.theme = '${theme}';
        const rect = e => { const r=e.getBoundingClientRect(); return [r.x,r.y,r.width,r.height]; };
        // The baseline mobile drawer is available on Thing and Chat; other pages require the separate global-shell change.
        const pages = ${width} <= 760 ? ['project-workbench-active', 'chat-active'] : ['', 'project-workbench-active', 'chat-active'];
        return pages.map(page => {
          document.body.className = page + (${width} <= 760 ? ' page-navigation-open' : '');
          const nav = document.querySelector('.primary-nav');
          const badges = [...nav.querySelectorAll('.nav-experiment-badge')].map(e => ({
            page:e.closest('button').dataset.page, rect:rect(e),
            button:rect(e.closest('button')), text:e.textContent,
            warning:e.closest('button').title,
            display:getComputedStyle(e).display,
            color:getComputedStyle(e).color, background:getComputedStyle(e).backgroundColor
          }));
          return {page, brand:rect(document.querySelector('.sidebar-brand')), mark:rect(document.querySelector('.sidebar-orbit-mark')), word:rect(document.querySelector('.sidebar-brand strong')), badges};
        });
      })()`);
      for (const state of result) {
        assert.deepEqual(state.brand, result[0].brand, `brand ${width} ${theme} ${state.page}`);
        assert.deepEqual(state.mark, result[0].mark, `mark ${width} ${theme} ${state.page}`);
        assert.deepEqual(state.word, result[0].word, `word ${width} ${theme} ${state.page}`);
        assert.deepEqual(state.badges.map(b => b.page), ['today','project-workbench','product','idea','release','operations']);
        for (const badge of state.badges) {
          assert.equal(badge.text, '实验中');
          assert.match(badge.warning, /暂不建议使用/);
          assert.ok(badge.rect[2] > 0 && badge.rect[3] > 0);
          assert.ok(badge.rect[0] >= badge.button[0] && badge.rect[0]+badge.rect[2] <= badge.button[0]+badge.button[2], `${badge.page} badge overflows`);
        }
      }
      measurements.push({ width, theme, result });
      await new Promise(resolve => setTimeout(resolve, 100));
      if (width === 1280) {
        const out = process.env.ARCORBIT_NAV_EVIDENCE;
        if (out) await writeFile(join(out, `navigation-${theme}.png`), (await win.webContents.capturePage({x:0,y:0,width:228,height:900})).toPNG());
      }
    }
  }
  console.log(JSON.stringify({ passed: true, measurements }));
} catch (error) { console.error(error); status = 1; }
finally { win.destroy(); await rm(base, {recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(() => {}); app.exit(status); }

});
