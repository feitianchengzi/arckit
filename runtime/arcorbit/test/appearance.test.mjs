import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppearance, registerAppearanceIpc } from '../src/desktop/appearance.mjs';

class NativeTheme extends EventEmitter {
  source = 'system';
  dark = false;
  get themeSource() { return this.source; }
  set themeSource(value) { this.source = value; this.emit('updated'); }
  get shouldUseDarkColors() { return this.source === 'system' ? this.dark : this.source === 'dark'; }
  system(dark) { this.dark = dark; this.emit('updated'); }
}
async function setup(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'arcorbit-appearance-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const nativeTheme = new NativeTheme();
  const path = join(dir, 'appearance.json');
  const owner = await createAppearance({ path, nativeTheme, ...options });
  t.after(() => owner.dispose());
  return { owner, nativeTheme, path };
}
test('appearance follows the system, explicit choice survives changes and process recreation', async t => {
  const { owner, nativeTheme, path } = await setup(t);
  assert.equal(owner.snapshot().preference, 'system');
  nativeTheme.system(true);
  assert.equal(owner.snapshot().resolved, 'dark');
  await owner.setPreference('light');
  nativeTheme.system(false); nativeTheme.system(true);
  assert.equal(owner.snapshot().resolved, 'light');
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { preference: 'light' });
  owner.dispose();
  const restored = await createAppearance({ path, nativeTheme: new NativeTheme() });
  assert.equal(restored.snapshot().preference, 'light');
  restored.dispose();
  await writeFile(path, 'null');
  const fallback = await createAppearance({ path, nativeTheme: new NativeTheme() });
  assert.equal(fallback.snapshot().preference, 'system');
  fallback.dispose();
});
test('failed writes do not publish and serialized updates recover in request order', async t => {
  const writes = [], events = [];
  const { owner, nativeTheme } = await setup(t, { persist: async (_path, value) => {
    writes.push(value);
    await new Promise(resolve => setTimeout(resolve, value === 'dark' ? 20 : 1));
    if (writes.length === 1) throw new Error('disk unavailable');
  } });
  owner.subscribe(value => events.push(value));
  await assert.rejects(owner.setPreference('invalid'));
  const failed = owner.setPreference('dark');
  const success = owner.setPreference('light');
  await assert.rejects(failed, /disk unavailable/);
  await success;
  assert.deepEqual(writes, ['dark', 'light']);
  assert.equal(nativeTheme.themeSource, 'light');
  assert.equal(events.length, 1);
  assert.equal(events[0].preference, 'light');
  await Promise.all([owner.setPreference('dark'), owner.setPreference('system')]);
  assert.equal(owner.snapshot().preference, 'system');
});
test('appearance IPC accepts only the managed main frame', async t => {
  const { owner } = await setup(t);
  const handlers = new Map();
  const frame = {}, sender = { mainFrame: frame };
  registerAppearanceIpc({ ipcMain: { on: (key, fn) => handlers.set(key, fn), handle: (key, fn) => handlers.set(key, fn) }, appearance: owner, getWindow: () => ({ webContents: sender }) });
  const get = handlers.get('arckit:appearance-get'), set = handlers.get('arckit:appearance-set');
  assert.throws(() => get({ sender, senderFrame: {} }), /main ArcOrbit frame/);
  assert.throws(() => set({ sender: { mainFrame: frame }, senderFrame: frame }, 'dark'));
  await set({ sender, senderFrame: frame }, 'dark');
  assert.equal(get({ sender, senderFrame: frame }).resolved, 'dark');
});


test('production appearance bridge preserves drafts and recovers from persistence failures', {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== '1' && 'Set ARCORBIT_ELECTRON_LAYOUT_TEST=1'
}, async () => {
  const [{ execFile }, { promisify }, { fileURLToPath }, { default: electron }, { electronFixtureArguments }] = await Promise.all([
    import('node:child_process'), import('node:util'), import('node:url'), import('electron'), import('./electron-fixture-launch.mjs')
  ]);
  const fixture = fileURLToPath(new URL('./fixtures/appearance-electron.mjs', import.meta.url));
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, electronFixtureArguments(fixture), { env, timeout: 45000 });
  assert.equal(JSON.parse(stdout.trim()).pages.length, 22);
});
