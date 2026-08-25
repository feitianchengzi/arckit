import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-work-detail-refresh-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const waitFor = async (predicate, label, timeout = 4000) => {
        const started = Date.now();
        while (Date.now() - started < timeout) {
          const value = await predicate();
          if (value) return value;
          await sleep(20);
        }
        throw new Error('Timed out waiting for ' + label);
      };
      await waitFor(() => document.querySelector('[data-page="work"]'), 'Work navigation');
      document.querySelector('[data-page="work"]').click();
      const commentInput = await waitFor(() => document.querySelector('[data-task-comment-input]'), 'comment composer');
      commentInput.value = 'draft-comment';
      await waitFor(() => document.querySelector('[data-task-attachment-image] img'), 'attachment preview');
      const attachment = {
        same_node: document.querySelector('[data-task-comment-input]') === commentInput,
        value: document.querySelector('[data-task-comment-input]')?.value || '',
        preview_loaded: Boolean(document.querySelector('[data-task-attachment-image] img'))
      };

      await window.arckitDesktop.setTestPlatformSnapshotDelay(160);
      const observeRefresh = async (emit, editor, selector) => {
        await emit();
        await waitFor(() => document.querySelector('#workStateSummary')?.textContent.includes('本地查询中'), 'query start');
        const during = {
          same_node: document.querySelector(selector) === editor,
          value: document.querySelector(selector)?.value || '',
          selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || ''
        };
        await waitFor(() => !document.querySelector('#workStateSummary')?.textContent.includes('本地查询中'), 'query completion');
        return {
          during,
          after: {
            same_node: document.querySelector(selector) === editor,
            value: document.querySelector(selector)?.value || '',
            selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || ''
          }
        };
      };
      const automation = await observeRefresh(
        () => window.arckitDesktop.emitTestAutomationEvent({ type: 'automation.changed' }),
        commentInput,
        '[data-task-comment-input]'
      );
      const workSync = await observeRefresh(
        () => window.arckitDesktop.emitTestWorkSyncEvent({ type: 'work-sync.changed' }),
        commentInput,
        '[data-task-comment-input]'
      );

      document.querySelector('[data-task-comment-submit]').click();
      await waitFor(() => document.querySelector('[data-task-comment-input]')?.value === '', 'submitted comment reset');
      const commentSubmit = {
        same_node: document.querySelector('[data-task-comment-input]') === commentInput,
        value: document.querySelector('[data-task-comment-input]')?.value || ''
      };

      document.querySelector('[data-work-state="completed"]').click();
      const acceptanceInput = await waitFor(() => document.querySelector('#workAcceptanceFeedbackInput'), 'acceptance composer');
      acceptanceInput.value = 'draft-acceptance';
      const callsBeforePeriodic = (await window.arckitDesktop.getTestCalls()).filter(([name]) => name === 'platformWorkQuery').length;
      await waitFor(async () => {
        const calls = await window.arckitDesktop.getTestCalls();
        return calls.filter(([name]) => name === 'platformWorkQuery').length > callsBeforePeriodic
          && document.querySelector('#workStateSummary')?.textContent.includes('本地查询中');
      }, '30-second periodic query', 32_000);
      const periodicDuring = {
        same_node: document.querySelector('#workAcceptanceFeedbackInput') === acceptanceInput,
        value: document.querySelector('#workAcceptanceFeedbackInput')?.value || '',
        selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || ''
      };
      await waitFor(() => !document.querySelector('#workStateSummary')?.textContent.includes('本地查询中'), 'periodic query completion');
      const periodicAfter = {
        same_node: document.querySelector('#workAcceptanceFeedbackInput') === acceptanceInput,
        value: document.querySelector('#workAcceptanceFeedbackInput')?.value || '',
        selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || ''
      };

      document.querySelector('[data-work-state="accepted"]').click();
      await waitFor(() => document.querySelector('#platformWorkInspector')?.textContent.includes('验收通过'), 'accepted detail');
      return {
        attachment,
        automation,
        work_sync: workSync,
        periodic: { during: periodicDuring, after: periodicAfter },
        comment_submit: commentSubmit,
        accepted_removed_composer: !document.querySelector('#workAcceptanceFeedbackInput'),
        calls: await window.arckitDesktop.getTestCalls()
      };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
