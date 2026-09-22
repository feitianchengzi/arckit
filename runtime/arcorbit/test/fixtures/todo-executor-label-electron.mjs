import { app, BrowserWindow } from 'electron';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-executor-label-${process.pid}`);
app.setPath('userData', userData);
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
const window = new BrowserWindow({ show: false, width: 1440, height: 900,
  webPreferences: { preload: join(fixtureDir, 'organization-center-preload.cjs'), contextIsolation: true, sandbox: false } });
let exitCode = 0;
try {
  await window.loadFile(join(fixtureDir, '../../desktop/renderer/index.html'));
  const result = await window.webContents.executeJavaScript(`(async () => {
    const wait = () => new Promise(resolve => setTimeout(resolve, 150));
    const click = selector => { const node = document.querySelector(selector); if (!node) throw new Error('Missing: ' + selector); node.click(); };
    const options = () => [...document.querySelectorAll('[name="executor_id"] option')].map(o => ({ value: o.value, label: o.textContent }));
    await wait();
    click('[data-page="work"]'); await wait();
    const scope = document.querySelector('#productScopeSelect'); scope.value = '11'; scope.dispatchEvent(new Event('change', { bubbles: true })); await wait();
    click('[data-work-state="pending"]'); await wait();
    click('[data-platform-task-select="W-11"]'); await wait();
    const workExecutorCells = [...document.querySelectorAll('#platformWorkTable tbody tr')].map(row => ({ id: row.dataset.platformTaskSelect, label: row.lastElementChild.textContent }));
    const workInspectorExecutor = [...document.querySelectorAll('#platformWorkInspector .fact-row')].find(row => row.querySelector('small')?.textContent === '执行人')?.querySelector('strong')?.textContent;
    const executorFilter = document.querySelector('#workExecutorFilter').textContent;
    click('[data-work-inspector-edit="W-11"]'); await wait(); const editExecutorOptions = options();
    click('#cancelPlatformActionButton'); await wait();
    scope.value = 'all'; scope.dispatchEvent(new Event('change', { bubbles: true })); await wait();
    click('#createTaskButton'); await wait(); const createExecutorOptions = options();
    document.querySelector('[name="project_id"]').value = '12'; document.querySelector('[name="project_id"]').dispatchEvent(new Event('change', { bubbles: true })); await wait();
    const otherProjectOptions = options();
    click('#cancelPlatformActionButton'); await wait();
    scope.value = '11'; scope.dispatchEvent(new Event('change', { bubbles: true })); await wait();
    click('[data-page="today"]'); await wait();
    const completed = [...document.querySelectorAll('[data-today-item]')].find(node => node.dataset.todayItem.includes('W-COMPLETED'));
    if (!completed) throw new Error('Missing Today completed task');
    completed.click(); await wait();
    const todayExecutor = [...document.querySelectorAll('.today-facts > div')].find(row => row.querySelector('dt')?.textContent === '执行人')?.querySelector('dd')?.textContent;
    return { workExecutorCells, workInspectorExecutor, executorFilter, editExecutorOptions, createExecutorOptions, otherProjectOptions, todayExecutor };
  })()`);
  await new Promise(resolve => process.stdout.write(JSON.stringify(result) + '\n', resolve));
} catch (error) {
  exitCode = 1;
  process.stderr.write(error.stack + '\n');
} finally {
  window.destroy();
  await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  app.exit(exitCode);
}

}).catch(error => { console.error(error); app.exit(1); });
