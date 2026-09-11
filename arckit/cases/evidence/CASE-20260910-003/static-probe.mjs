// Diagnostic characterization, NOT a macOS reproduction or a passing repair test.
// Run from any cwd: node arckit/cases/evidence/CASE-20260910-003/static-probe.mjs
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createImageViewer } from '../../../../runtime/arcorbit/src/work-task-image-viewer.mjs';

const sourceRoot = new URL('../../../../runtime/arcorbit/', import.meta.url);
const renderer = readFileSync(new URL('desktop/image-viewer/renderer.js', sourceRoot), 'utf8');
const start = renderer.indexOf('function handleKeydown(event) {');
const end = renderer.indexOf('\nfunction endPan()', start);
assert.ok(start >= 0 && end > start);
// Execute the actual handler, without loading a DOM, Electron, or an image.
const getHandler = new Function('window', `${renderer.slice(start, end)}; return handleKeydown;`);
let domCloseCalls = 0;
let prevented = false;
let stopped = false;
getHandler({ close() { domCloseCalls += 1; } })({
  key: 'Escape', preventDefault() { prevented = true; },
  stopPropagation() { stopped = true; }
});
assert.equal(domCloseCalls, 1);
assert.equal(prevented, false);
assert.equal(stopped, false);
const results = [{ scenario: 'actual-renderer-Escape-handler', domCloseCalls, prevented, stopped }];

async function fixture(fullScreen) {
  let child;
  const parent = {
    showCount: 0, focusCount: 0, fullScreenReads: 0,
    isDestroyed: () => false,
    isFullScreen() { this.fullScreenReads += 1; return true; },
    show() { this.showCount += 1; }, focus() { this.focusCount += 1; }
  };
  class Window extends EventEmitter {
    constructor(options) {
      super(); child = this; this.options = options; this.fullScreen = fullScreen;
      this.destroyed = false; this.exitRequests = 0;
      this.webContents = new EventEmitter();
      this.webContents.setWindowOpenHandler = () => {};
      this.webContents.send = () => {};
    }
    loadFile() { this.webContents.emit('did-finish-load'); }
    show() {} focus() {} setTitle() {}
    isDestroyed() { return this.destroyed; }
    isFullScreen() { return this.fullScreen; }
    setFullScreen(value) { assert.equal(value, false); this.exitRequests += 1; }
    close() {
      let cancelled = false;
      this.emit('close', { preventDefault() { cancelled = true; } });
      if (cancelled || this.destroyed) return;
      this.destroyed = true; this.emit('closed');
    }
  }
  const viewer = createImageViewer({
    BrowserWindow: Window, dialog: {}, writeFile: async () => {},
    shellFile: 'fixture.html', preloadFile: 'fixture.cjs', platform: 'darwin',
    getParentWindow: () => parent,
    loadImage: async () => ({ bytes: Buffer.from([1]), data_url: 'data:image/png;base64,AQ==' })
  });
  await viewer.open({ object_key: 'fixture.png' });
  assert.equal(child.options.webPreferences.sandbox, true);
  return { child, parent };
}

for (const scenario of ['parent-fullscreen-child-not-fullscreen', 'normal-leave-event', 'flag-cleared-before-leave-event']) {
  const { child, parent } = await fixture(scenario !== 'parent-fullscreen-child-not-fullscreen');
  child.close();
  if (scenario === 'normal-leave-event') {
    assert.equal(child.destroyed, false);
    child.fullScreen = false;
    child.emit('leave-full-screen');
  } else if (scenario === 'flag-cleared-before-leave-event') {
    assert.equal(child.destroyed, false);
    // Deliberately supplied event ordering: proves a branch hole, not that macOS used it.
    child.fullScreen = false;
    child.close();
  }
  const expectedRecovery = scenario === 'normal-leave-event' ? 1 : 0;
  assert.equal(child.destroyed, true);
  assert.equal(parent.showCount, expectedRecovery);
  assert.equal(parent.focusCount, expectedRecovery);
  assert.equal(parent.fullScreenReads, 0);
  results.push({ scenario, destroyed: child.destroyed, exitRequests: child.exitRequests,
    parentShowCount: parent.showCount, parentFocusCount: parent.focusCount,
    parentFullScreenReads: parent.fullScreenReads });
}

const { extractFile } = await import('@electron/asar');
const installedAsar = process.argv[2] || '/Applications/arcorbit.app/Contents/Resources/app.asar';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['src/work-task-image-viewer.mjs', 'desktop/image-viewer/renderer.js',
  'desktop/image-viewer/preload.cjs', 'desktop/main.mjs'];
const coverage = files.map(file => {
  const installed = extractFile(installedAsar, file);
  const workspace = readFileSync(new URL(file, sourceRoot));
  return { file, installed_sha256: hash(installed), workspace_sha256: hash(workspace), equal: installed.equals(workspace) };
});
console.log(JSON.stringify({ scope: 'static and injected-state characterization only', results, installedAsar, coverage }, null, 2));
