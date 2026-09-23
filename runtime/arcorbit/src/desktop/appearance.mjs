import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const preferences = new Set(['system', 'light', 'dark']);
export const normalizeAppearance = value => preferences.has(value) ? value : 'system';

async function persistAppearance(path, preference) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ preference }) + '\n', { mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export async function createAppearance({ path, nativeTheme, persist = persistAppearance }) {
  let preference = 'system';
  try { preference = normalizeAppearance(JSON.parse(await readFile(path, 'utf8'))?.preference); }
  catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
  nativeTheme.themeSource = preference;
  let revision = 0;
  const read = () => ({ preference, resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light', revision });
  let current = read();
  let queue = Promise.resolve();
  const listeners = new Set();
  function publish() {
    const next = read();
    if (next.preference === current.preference && next.resolved === current.resolved) return;
    revision += 1;
    current = { ...next, revision };
    for (const listener of listeners) listener({ ...current });
  }
  nativeTheme.on('updated', publish);
  return {
    snapshot: () => ({ ...current }),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setPreference(value) {
      if (!preferences.has(value)) return Promise.reject(new Error('外观选项无效。'));
      const operation = queue.then(async () => {
        await persist(path, value);
        preference = value;
        nativeTheme.themeSource = value;
        publish();
        return { ...current };
      });
      queue = operation.catch(() => {});
      return operation;
    },
    dispose() { nativeTheme.removeListener('updated', publish); listeners.clear(); }
  };
}

export function appearanceBackground(snapshot) {
  return snapshot.resolved === 'dark' ? '#121722' : '#f7f8fa';
}

export function registerAppearanceIpc({ ipcMain, appearance, getWindow }) {
  const authorized = event => event.sender === getWindow()?.webContents && event.senderFrame === event.sender.mainFrame;
  ipcMain.on('arckit:appearance-initial', event => { event.returnValue = authorized(event) ? appearance.snapshot() : null; });
  ipcMain.handle('arckit:appearance-get', event => {
    if (!authorized(event)) throw new Error('Appearance requires the main ArcOrbit frame.');
    return appearance.snapshot();
  });
  ipcMain.handle('arckit:appearance-set', (event, preference) => {
    if (!authorized(event)) throw new Error('Appearance requires the main ArcOrbit frame.');
    return appearance.setPreference(preference);
  });
}
