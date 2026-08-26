import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-work-acceptance-selection-${process.pid}`);
const preserveUserSelection = process.argv.includes("--preserve-user-selection");
const preserveProductSelection = process.argv.includes("--preserve-product-selection");
const preserveReplacementSelection = process.argv.includes("--preserve-replacement-selection");
const logoutWhilePending = process.argv.includes("--logout-while-pending");
if (preserveReplacementSelection) process.env.ARCORBIT_WORK_ACCEPTANCE_REPLACEMENT_TEST = "1";
if (logoutWhilePending) process.env.ARCORBIT_WORK_ACCEPTANCE_LOGOUT_TEST = "1";
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
      const task = (id, priority, updatedAt) => ({
        id,
        project_id: '11',
        project_name: 'ArcOrbit',
        title: id,
        content: id,
        state: 'completed',
        terminal: true,
        priority,
        raw: { priority: 1 },
        executor_id: '7',
        assignee: { id: '7', username: 'Glare' },
        tags: '',
        updated_at: updatedAt
      });
      const targetTask = (id, priority, updatedAt) => ({
        ...task(id, priority, updatedAt),
        project_id: '12',
        project_name: 'Workshop Todo',
        executor_id: '8',
        assignee: { id: '8', username: 'Lin' }
      });
      await waitFor(() => document.querySelector('[data-page="work"]'), 'Work navigation');
      await window.arckitDesktop.setTestPlatformTasks([
        task('completed-newest', 300, '2026-08-26T03:00:00Z'),
        task('completed-middle', 200, '2026-08-26T02:00:00Z'),
        task('completed-oldest', 100, '2026-08-26T01:00:00Z'),
        targetTask('W-12-NEW', 90, '2026-08-26T00:30:00Z')
      ]);
      document.querySelector('[data-page="work"]').click();
      document.querySelector('[data-work-state="completed"]').click();
      await waitFor(() => document.querySelector('#productScopeSelect option[value="11"]'), 'ArcOrbit product scope');
      document.querySelector('#productScopeSelect').value = '11';
      document.querySelector('#productScopeSelect').dispatchEvent(new Event('change', { bubbles: true }));
      await waitFor(() => document.querySelectorAll('[data-platform-task-select]').length === 3, 'three completed rows');
      document.querySelector('[data-platform-task-select="completed-oldest"]').click();
      await waitFor(() => document.querySelector('#platformWorkInspector h2')?.textContent === '待办 completed-oldest', 'oldest selection');

      await window.arckitDesktop.armTestAcceptanceActionBarrier();
      document.querySelector('[data-work-task-action="accept"]').click();
      await window.arckitDesktop.waitForTestAcceptanceActionEvent();
      await waitFor(() => (
        !document.querySelector('[data-platform-task-select="completed-oldest"]')
        && document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect === 'completed-newest'
      ), 'Work Sync system fallback');
      const fallbackSelection = document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '';

      let userSelection = '';
      let productSelection = '';
      let replacementSelection = '';
      let replacementFallbackCandidate = '';
      let replacementTargetQueriesBeforeRelease = 0;
      let logoutSelection = '';
      let workQueriesAfterLogout = 0;
      let workQueriesBeforeStaleAcceptance = 0;
      let workQueriesDuringSettingsWait = 0;
      if (${JSON.stringify(preserveUserSelection)}) {
        document.querySelector('[data-platform-task-select="completed-newest"]').click();
        userSelection = document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '';
      }
      if (${JSON.stringify(preserveProductSelection)}) {
        document.querySelector('[data-page="today"]').click();
        await waitFor(() => document.querySelector('[data-product-work="11"]'), 'Today product card');
        document.querySelector('[data-product-work="11"]').click();
        await waitFor(() => (
          document.querySelector('#productScopeSelect').value === '11'
          && document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect === 'completed-newest'
        ), 'Today product selection');
        productSelection = document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '';
      }
      if (${JSON.stringify(preserveReplacementSelection)}) {
        window.confirm = () => true;
        document.querySelector('[data-work-inspector-edit="completed-newest"]').click();
        await waitFor(() => !document.querySelector('#platformActionOverlay').classList.contains('hidden'), 'replacement edit Sheet');
        document.querySelector('[name="project_id"]').value = '12';
        document.querySelector('[name="project_id"]').dispatchEvent(new Event('change', { bubbles: true }));
        await window.arckitDesktop.setTestTaskReplacementScenario('delete_failure');
        document.querySelector('#platformActionForm').requestSubmit();
        await waitFor(() => document.querySelector('[data-platform-task-replacement-retry="11:W-11"]'), 'replacement recovery action');
        await window.arckitDesktop.setTestTaskReplacementScenario('success');
        document.querySelector('[data-platform-task-replacement-retry="11:W-11"]').click();
        await waitFor(() => (
          document.querySelector('#productScopeSelect').value === '12'
          && document.querySelector('[data-platform-task-select="W-12-NEW"]')
          && document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect === 'W-12-NEW'
        ), 'replacement target scope');
        replacementSelection = document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '';
        await window.arckitDesktop.setTestPlatformTasks([
          task('completed-newest', 300, '2026-08-26T03:00:00Z'),
          task('completed-middle', 200, '2026-08-26T02:00:00Z'),
          targetTask('W-12-FALLBACK', 500, '2026-08-26T04:00:00Z'),
          targetTask('W-12-NEW', 90, '2026-08-26T00:30:00Z')
        ]);
        await window.arckitDesktop.emitTestWorkSyncEvent();
        await waitFor(() => (
          document.querySelector('#platformWorkTable [data-platform-task-select]')?.dataset.platformTaskSelect === 'W-12-FALLBACK'
          && document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect === 'W-12-NEW'
        ), 'replacement target with fallback candidate');
        replacementTargetQueriesBeforeRelease = (await window.arckitDesktop.getTestCalls()).filter(([name, input]) => (
          name === 'platformWorkQuery' && input?.project_id === '12'
        )).length;
      }
      if (${JSON.stringify(logoutWhilePending)}) {
        document.querySelector('#settingsButton').click();
        await waitFor(() => !document.querySelector('#settingsOverlay').classList.contains('hidden'), 'settings overlay');
        await window.arckitDesktop.armTestSettingsBarrier();
        document.querySelector('#logoutButton').click();
        await window.arckitDesktop.waitForTestSettingsBarrier();
        workQueriesBeforeStaleAcceptance = (await window.arckitDesktop.getTestCalls()).filter(([name]) => name === 'platformWorkQuery').length;
        await window.arckitDesktop.releaseTestAcceptanceAction();
        await waitFor(() => document.querySelector('#toast')?.textContent.includes('已验收'), 'stale acceptance completion during settings wait');
        await sleep(100);
        workQueriesDuringSettingsWait = (await window.arckitDesktop.getTestCalls()).filter(([name]) => name === 'platformWorkQuery').length;
        await window.arckitDesktop.releaseTestSettingsBarrier();
        await waitFor(() => document.querySelector('#settingsOverlay').classList.contains('login-gate'), 'logout login gate');
        logoutSelection = document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '';
        workQueriesAfterLogout = (await window.arckitDesktop.getTestCalls()).filter(([name]) => name === 'platformWorkQuery').length;
      }
      if (!${JSON.stringify(logoutWhilePending)}) await window.arckitDesktop.releaseTestAcceptanceAction();
      if (${JSON.stringify(preserveReplacementSelection)}) {
        await waitFor(async () => {
          const calls = await window.arckitDesktop.getTestCalls();
          return calls.filter(([name, input]) => (
            name === 'platformWorkQuery' && input?.project_id === '12'
          )).length > replacementTargetQueriesBeforeRelease;
        }, 'post-acceptance target query');
      }
      await waitFor(() => !document.querySelector('#workStateSummary')?.textContent.includes('本地查询中'), 'acceptance query completion');
      if (${JSON.stringify(logoutWhilePending)}) await sleep(100);
      if (${JSON.stringify(preserveReplacementSelection)}) {
        await waitFor(() => (
          document.querySelector('#platformWorkTable [data-platform-task-select]')?.dataset.platformTaskSelect === 'W-12-FALLBACK'
        ), 'post-acceptance fallback candidate render');
        replacementFallbackCandidate = document.querySelector('#platformWorkTable [data-platform-task-select]')?.dataset.platformTaskSelect || '';
      }
      return {
        fallback_selection: fallbackSelection,
        user_selection: userSelection,
        product_selection: productSelection,
        replacement_selection: replacementSelection,
        replacement_fallback_candidate: replacementFallbackCandidate,
        logout_selection: logoutSelection,
        work_queries_after_logout: workQueriesAfterLogout,
        work_queries_before_stale_acceptance: workQueriesBeforeStaleAcceptance,
        work_queries_during_settings_wait: workQueriesDuringSettingsWait,
        final_work_queries: (await window.arckitDesktop.getTestCalls()).filter(([name]) => name === 'platformWorkQuery').length,
        final_selection: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '',
        accepted_removed: !document.querySelector('[data-platform-task-select="completed-oldest"]'),
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
