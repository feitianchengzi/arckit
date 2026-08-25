import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-setup-readiness-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1200,
    height: 820,
    webPreferences: {
      preload: join(fixtureDir, "setup-readiness-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      console.error = () => {};
      window.confirm = () => true;
      const wait = () => new Promise((resolve) => setTimeout(resolve, 120));
      await window.arckitDesktop.emitSetupScenario('needs-install');
      await wait();
      const planSummary = document.querySelector('#setupPlanSummary');
      const planSummaryVisible = !planSummary.classList.contains('hidden');
      const planSummaryText = planSummary.textContent;
      const review = document.querySelector('#setupReviewed');
      const applyButton = document.querySelector('#setupApplyButton');
      const planDetailsForApply = document.querySelector('#setupPlanDetails');
      const initialApplyDisabled = applyButton.disabled;
      review.checked = true;
      review.dispatchEvent(new Event('change', { bubbles: true }));
      const enabledWithoutDetails = !applyButton.disabled && !planDetailsForApply.open;
      planDetailsForApply.open = true;
      await wait();
      const enabledWithDetailsOpen = !applyButton.disabled;
      planDetailsForApply.open = false;
      await wait();
      const enabledAfterDetailsClose = !applyButton.disabled;
      await window.arckitDesktop.emitSetupScenario('updated-install');
      await wait();
      const resetAfterPlanUpdate = !review.checked && applyButton.disabled;
      const planUpdateHint = document.querySelector('#setupReviewHint').textContent;
      const focusedAfterPlanUpdate = document.activeElement?.id;
      review.checked = true;
      review.dispatchEvent(new Event('change', { bubbles: true }));
      const confirmedHint = document.querySelector('#setupReviewHint').textContent;
      applyButton.click();
      await wait();
      await window.arckitDesktop.emitSetupScenario('drifted');
      await wait();
      const cleanupPanel = document.querySelector('#setupCleanupPanel');
      const planDetails = document.querySelector('#setupPlanDetails');
      const initialButton = document.querySelector('#setupCleanupButton');
      const initialDisabled = initialButton.disabled;
      const cleanupPanelVisible = !cleanupPanel.classList.contains('hidden');
      const selectAll = document.querySelector('#setupCleanupSelectAll');
      selectAll.checked = true;
      selectAll.dispatchEvent(new Event('change', { bubbles: true }));
      const selectedAfterSelectAll = document.querySelectorAll('[data-setup-cleanup-path]:checked').length;
      const skillCheckbox = document.querySelector('[data-setup-cleanup-path="0"]');
      skillCheckbox.checked = false;
      skillCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      const selectedButton = document.querySelector('#setupCleanupButton');
      const selectedButtonText = selectedButton.textContent;
      const selectedButtonDisabled = selectedButton.disabled;
      selectedButton.click();
      await wait();
      const errorPanel = document.querySelector('#setupErrorPanel');
      const actionErrorVisible = !errorPanel.classList.contains('hidden');
      const actionErrorText = errorPanel.textContent;
      const setupZIndex = Number(getComputedStyle(document.querySelector('#setupReadiness')).zIndex);
      const toastZIndex = Number(getComputedStyle(document.querySelector('#toast')).zIndex);
      document.querySelector('#setupCleanupButton').click();
      await wait();
      const calls = await window.arckitDesktop.getTestCalls();
      return {
        planSummaryVisible,
        planSummaryText,
        initialApplyDisabled,
        enabledWithoutDetails,
        enabledWithDetailsOpen,
        enabledAfterDetailsClose,
        resetAfterPlanUpdate,
        planUpdateHint,
        focusedAfterPlanUpdate,
        confirmedHint,
        initialDisabled,
        cleanupPanelVisible,
        cleanupBeforeChecks: Boolean(cleanupPanel.compareDocumentPosition(document.querySelector('#setupChecks')) & Node.DOCUMENT_POSITION_FOLLOWING),
        planCollapsed: !planDetails.open,
        selectedAfterSelectAll,
        selectedButtonText,
        selectedButtonDisabled,
        actionErrorVisible,
        actionErrorText,
        toastAboveSetup: toastZIndex > setupZIndex,
        setupHiddenAfterRemoval: document.querySelector('#setupReadiness').classList.contains('hidden'),
        calls
      };
    })()`);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.quit();
  }
}).catch(async (error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  await rm(userData, { recursive: true, force: true }).catch(() => undefined);
  app.exit(1);
});
