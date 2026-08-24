import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-work-status-performance-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: { preload: join(fixtureDir, "organization-center-preload.cjs"), contextIsolation: true, sandbox: false }
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      const click = (selector) => document.querySelector(selector).click();
      await window.arckitDesktop.setTestPlatformSnapshotDelay(240);
      click('[data-page="work"]');
      await wait(280);

      const callsBeforeSwitch = (await window.arckitDesktop.getTestCalls()).length;
      const started = performance.now();
      click('[data-work-state="completed"]');
      const immediate = {
        elapsed_ms: Number((performance.now() - started).toFixed(2)),
        completed_pressed: document.querySelector('[data-work-state="completed"]').getAttribute('aria-pressed') === 'true',
        pending_pressed: document.querySelector('[data-work-state="pending"]').getAttribute('aria-pressed') === 'true',
        row_count: document.querySelectorAll('#platformWorkTable tbody tr').length,
        loading_visible: document.querySelector('#workStateSummary').textContent.includes('本地查询中')
      };
      await wait(280);
      const completedVisible = [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Completed work'));
      const switchCalls = (await window.arckitDesktop.getTestCalls()).slice(callsBeforeSwitch).map(([name]) => name);

      await window.arckitDesktop.setTestPlatformSnapshotDelay(120);
      click('[data-work-state="accepted"]');
      await wait(5);
      click('[data-work-state="pending"]');
      await wait(150);
      const rapid = {
        pending_pressed: document.querySelector('[data-work-state="pending"]').getAttribute('aria-pressed') === 'true',
        accepted_visible: [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Accepted work')),
        pending_visible: [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Scoped pending work'))
      };

      const sameKeyTask = (title) => ({
        id: 'SAME-KEY', project_id: '11', project_name: 'ArcOrbit', title,
        content: 'Same-key cache generation', state: 'pending', terminal: false, priority: 99,
        raw: { priority: 1 }, executor_id: '7', assignee: { id: '7', username: 'Glare' }, tags: ''
      });
      await window.arckitDesktop.queueTestPlatformWorkQueries([
        { delay_ms: 120, tasks: [sameKeyTask('Same-key old')] },
        { delay_ms: 0, tasks: [sameKeyTask('Same-key new')] }
      ]);
      click('[data-work-state="pending"]');
      await wait(5);
      click('[data-work-state="pending"]');
      await wait(140);
      await window.arckitDesktop.setTestPlatformSnapshotDelay(0);
      click('[data-work-state="completed"]');
      await wait(10);
      await window.arckitDesktop.queueTestPlatformWorkQueries([{ delay_ms: 120, tasks: [sameKeyTask('Same-key latest')] }]);
      click('[data-work-state="pending"]');
      const sameKeyCache = {
        new_visible: [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Same-key new')),
        old_visible: [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Same-key old')),
        loading_visible: document.querySelector('#workStateSummary').textContent.includes('本地查询中')
      };
      await wait(130);

      await window.arckitDesktop.queueTestPlatformWorkQueries([
        { delay_ms: 120, tasks: [sameKeyTask('Pre-clear stale')] }
      ]);
      click('[data-work-state="pending"]');
      await wait(5);
      document.querySelector('#worksetSelect').dispatchEvent(new Event('change'));
      await wait(140);
      await window.arckitDesktop.queueTestPlatformWorkQueries([
        { delay_ms: 120, tasks: [sameKeyTask('Post-clear latest')] }
      ]);
      click('[data-work-state="pending"]');
      const clearCache = {
        stale_visible: [...document.querySelectorAll('#platformWorkTable tbody tr')].some((row) => row.textContent.includes('Pre-clear stale')),
        row_count: document.querySelectorAll('#platformWorkTable tbody tr').length,
        loading_visible: document.querySelector('#workStateSummary').textContent.includes('本地查询中')
      };
      await wait(130);

      const manyTasks = Array.from({ length: 1000 }, (_, index) => ({
        id: 'SCALE-' + index, project_id: '11', project_name: 'ArcOrbit', title: 'Scale task ' + index,
        content: 'Windowed renderer', state: 'pending_review', terminal: false, priority: 1000 - index,
        raw: { priority: 1 }, executor_id: '7', assignee: { id: '7', username: 'Glare' }, tags: ''
      }));
      await window.arckitDesktop.setTestPlatformTasks(manyTasks);
      await window.arckitDesktop.setTestPlatformSnapshotDelay(0);
      const scaleStarted = performance.now();
      click('[data-work-state="pending_review"]');
      while (document.querySelectorAll('#platformWorkTable tbody tr').length === 0 && performance.now() - scaleStarted < 500) await wait(1);
      const scale = {
        first_interactive_ms: Number((performance.now() - scaleStarted).toFixed(2)),
        rendered_rows: document.querySelectorAll('#platformWorkTable tbody tr').length,
        pager_text: document.querySelector('.work-query-pager')?.textContent || ''
      };
      return { immediate, completed_visible: completedVisible, switch_calls: switchCalls, rapid, same_key_cache: sameKeyCache, clear_cache: clearCache, scale };
    })()`);
    await new Promise((resolveWrite) => process.stdout.write(`${JSON.stringify(result)}\n`, resolveWrite));
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  await new Promise((resolveWrite) => process.stderr.write(`${error.stack || error.message}\n`, resolveWrite));
  app.exit(1);
});
