import { app, BrowserWindow, ipcMain, shell } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createChatFiles } from '../../src/chat-files.mjs';
import { registerChatFilesIpc } from '../../desktop/chat-files-ipc.mjs';

const base = await mkdtemp(join(tmpdir(), 'arcorbit-files-ipc-'));
const output = process.env.ARCORBIT_TEST_OUTPUT || await mkdtemp(join(tmpdir(), 'arcorbit-files-ipc-evidence-'));
await mkdir(output, { recursive: true });
app.setPath('userData', join(base, 'electron'));
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
let window, foreign, account = 'test-account', result, trashName;
app.whenReady().then(async () => {
try {
  const root = join(base, 'workspace'); await mkdir(root); await writeFile(join(root, '.env'), 'before');
  const store = { projects: [{ id: 'local', name: 'Fixture', path: root }], sessions: { local: [{ id: 's', kind: 'chat', project_id: 'local' }] } };
  const files = createChatFiles({runManager: {readDesktopChatMetadata: async () => store}, getAccountScope: async () => account,
    authorizeSession: async () => true, trashItem: path => shell.trashItem(path), revealItem: () => { throw Error('Reveal is deliberately not invoked by this fixture'); }});
  registerChatFilesIpc({ipcMain, files, assertMainRenderer: event => {
    if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw Error('Untrusted renderer');
  }});
  ipcMain.on('arckit:appearance-initial', event => { event.returnValue = {preference: 'light', effective: 'light'}; });
  const options = {show: false, webPreferences: {sandbox: true, contextIsolation: true, nodeIntegration: false, preload: fileURLToPath(new URL('../../desktop/preload.cjs', import.meta.url))}};
  window = new BrowserWindow(options);
  await window.loadURL('data:text/html,<meta charset="utf-8"><p>Chat files IPC fixture</p>');
  const invoke = (action, input) => window.webContents.executeJavaScript(`arckitDesktop.chatFiles(${JSON.stringify(action)},${JSON.stringify(input)})`);
  const owner = {session_id: 's', project_id: 'local'}, context = await invoke('context', owner);
  const input = {...owner, expected_workspace: context.workspace};
  assert.equal(context.root, undefined);
  assert.equal((await invoke('list', {...input, path: ''})).entries[0].path, '.env');
  const file = await invoke('read', {...input, path: '.env'});
  await invoke('save', {...input, path: '.env', text: 'after', revision: file.revision});
  assert.equal(await readFile(join(root, '.env'), 'utf8'), 'after');
  await assert.rejects(invoke('save', {...input, path: '.env', text: 'stale', revision: file.revision}), /变化/);
  await assert.rejects(invoke('read', {...input, path: '../outside'}), /相对路径/);
  foreign = new BrowserWindow(options); await foreign.loadURL('data:text/html,<p>untrusted</p>');
  await assert.rejects(foreign.webContents.executeJavaScript(`arckitDesktop.chatFiles('context',${JSON.stringify(owner)})`), /Untrusted renderer/);
  account = 'another-account'; await assert.rejects(invoke('list', {...input, path: ''}), /账号/); account = 'test-account';
  let nativeTrash = 'not run on this platform';
  if (process.platform === 'darwin') {
    trashName = `arcorbit-file-test-${randomUUID()}.txt`;
    await invoke('create-file', {...input, path: '', name: trashName});
    await invoke('trash', {...input, path: trashName});
    await assert.rejects(lstat(join(root, trashName)), {code: 'ENOENT'});
    assert.ok((await lstat(join(homedir(), '.Trash', trashName))).isFile());
    nativeTrash = 'created fixture file moved to system Trash; only that unique empty fixture entry cleaned';
  }
  result = {ok: true, checks: ['sandboxed production preload and registered IPC', 'hidden file list/read/save round trip', 'stale revision and traversal rejected', 'foreign renderer denied', 'account change denied'], nativeTrash,
    scope: 'Real Electron IPC and filesystem service in isolated fixture; full Chat renderer, Monaco and UI lifecycle not tested.', output};
} catch (error) { result = {ok: false, error: error.stack, output}; }
finally {
  foreign?.destroy(); window?.destroy();
  if (trashName) {
    const path = join(homedir(), '.Trash', trashName);
    try { if ((await lstat(path)).isFile() && (await readFile(path)).length === 0) await rm(path); } catch (error) { if (error.code !== 'ENOENT') result.cleanupError = error.message; }
  }
  await writeFile(join(output, 'ipc-result.json'), JSON.stringify(result, null, 2) + '\n');
  await rm(base, {recursive: true, force: true});
  console.log(JSON.stringify(result));
  app.exit(result.ok ? 0 : 1);
}
});
