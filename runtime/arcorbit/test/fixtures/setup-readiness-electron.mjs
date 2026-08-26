import { app, BrowserWindow, ipcMain } from "electron";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCodexSetupManager } from "../../src/codex-setup-manager.mjs";
import { registerCodexSetupIpc } from "../../src/desktop/codex-setup-ipc.mjs";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-setup-readiness-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

const fixtureState = {
  mode: "",
  installation: { available: false, command: "", pathEntries: [], provenance: "none", summary: "Codex missing" },
  authenticated: false,
  processCalls: [],
  installerCalls: [],
  activeOwners: [],
  blockNextProbe: false,
  probeStarted: null,
  releaseProbe: null,
  blockNextVersion: false,
  versionStarted: null,
  releaseVersion: null,
  blockNextLoginStatus: false,
  loginStatusStarted: null,
  releaseLoginStatus: null,
  blockNextReadiness: false,
  readinessStarted: null,
  releaseReadiness: null,
  readinessCodexProbe: null
};
let authorizedSetupSender = null;
let confirmationSequence = 0;

const codexSetupManager = createCodexSetupManager({
  platform: "darwin",
  env: { PATH: "/fixture/bin" },
  probeExecutable: async ({ onStage } = {}) => {
    if (fixtureState.blockNextProbe) {
      fixtureState.blockNextProbe = false;
      fixtureState.probeStarted?.();
      await new Promise((resolve) => { fixtureState.releaseProbe = resolve; });
    }
    if (fixtureState.installation.available) {
      onStage?.("version");
      if (fixtureState.blockNextVersion) {
        fixtureState.blockNextVersion = false;
        fixtureState.versionStarted?.();
        await new Promise((resolve) => { fixtureState.releaseVersion = resolve; });
      }
    }
    return { ...fixtureState.installation };
  },
  preferStandalone: () => {
    fixtureState.installation = standaloneInstallation();
  },
  activeOwners: async () => fixtureState.activeOwners,
  installerRunner: async ({ platform, url, signal, onProgress }) => {
    fixtureState.installerCalls.push({ mode: fixtureState.mode, platform, url });
    onProgress("downloading");
    if (signal.aborted) throw abortError();
    onProgress("executing");
    fixtureState.installation = standaloneInstallation();
    if (fixtureState.mode === "install-success-recheck") {
      fixtureState.blockNextProbe = true;
      fixtureState.blockNextVersion = true;
      fixtureState.blockNextLoginStatus = true;
      fixtureState.blockNextReadiness = true;
    }
    onProgress("discovering");
  },
  processRunner: async (spec) => {
    const args = [...(spec.args || [])];
    fixtureState.processCalls.push({ mode: fixtureState.mode, command: spec.command, args });
    if (args[0] === "login" && args[1] === "status") {
      if (fixtureState.blockNextLoginStatus) {
        fixtureState.blockNextLoginStatus = false;
        fixtureState.loginStatusStarted?.();
        await new Promise((resolve) => { fixtureState.releaseLoginStatus = resolve; });
      }
      return processResult(fixtureState.authenticated ? 0 : 1);
    }
    if (args[0] === "login" && args[1] === "--help") {
      return processResult(0, "--device-auth\n--with-api-key\n--with-access-token\n");
    }
    if (args[0] === "login") {
      if (fixtureState.mode === "browser-success") {
        fixtureState.authenticated = true;
        return processResult(0);
      }
      if (fixtureState.mode === "device-success") {
        spec.onOutput?.({ stream: "stdout", text: "Open https://auth.openai.com/device and enter ABCD-EFGH\n" });
        fixtureState.authenticated = true;
        return processResult(0);
      }
      if (fixtureState.mode === "cancel") {
        return new Promise((resolve, reject) => {
          const onAbort = () => reject(abortError());
          if (spec.signal?.aborted) onAbort();
          else spec.signal?.addEventListener("abort", onAbort, { once: true });
        });
      }
      if (fixtureState.mode === "timeout") throw Object.assign(new Error("fixture timeout"), { code: "PROCESS_TIMEOUT" });
      if (fixtureState.mode === "failure") return processResult(1);
    }
    return processResult(0);
  },
  recheckReadiness: async ({ codexProbe }) => {
    fixtureState.readinessCodexProbe = structuredClone(codexProbe);
    if (!fixtureState.blockNextReadiness) return;
    fixtureState.blockNextReadiness = false;
    fixtureState.readinessStarted?.();
    await new Promise((resolve) => { fixtureState.releaseReadiness = resolve; });
  }
});

function standaloneInstallation() {
  return { available: true, command: "/fixture/.local/bin/codex", pathEntries: ["/fixture/.local/bin"], provenance: "standalone", summary: "codex fixture" };
}

function processResult(exitCode, stdout = "") {
  return { exitCode, signal: "", stdout, stderr: "" };
}

function abortError() {
  return Object.assign(new Error("fixture cancelled"), { name: "AbortError", code: "ABORT_ERR" });
}

function skillSnapshot() {
  return {
    status: "ready",
    first_install: false,
    checks: [{ id: "resources", status: "passed", summary: "fixture resources" }],
    can_continue: true,
    error: null
  };
}

function combineSetup(skills = skillSnapshot(), codex = codexSetupManager.getSnapshot()) {
  return {
    ...skills,
    status: codex.operation ? "applying" : codex.status === "ready" ? "ready" : codex.error ? "blocked" : "codex-action-required",
    checks: [...(skills.checks || []), { id: "codex", status: codex.status === "ready" ? "passed" : codex.error ? "failed" : "pending", summary: codex.status }],
    codex: codex.installation,
    codex_setup: codex,
    can_continue: codex.status === "ready",
    error: codex.error || null
  };
}

async function checkCombinedSetup() {
  return combineSetup(skillSnapshot(), await codexSetupManager.check());
}

async function refreshAfterCodexOperation(operation) {
  return combineSetup(skillSnapshot(), await operation());
}

registerCodexSetupIpc({
  ipcMain,
  codexSetupManager,
  combinedSetupReadiness: combineSetup,
  checkCombinedSetupReadiness: checkCombinedSetup,
  refreshAfterCodexOperation,
  authorizeSender: (event) => {
    if (event.sender !== authorizedSetupSender) throw new Error("fixture sender rejected");
  },
  confirmAction: async () => true,
  createConfirmationId: () => `fixture-confirmation-${++confirmationSequence}`
});
ipcMain.handle("arckit:setup-status", async () => combineSetup());
ipcMain.handle("arckit:setup-check", async () => checkCombinedSetup());

function resetCodexScenario(mode, { installed = true, authenticated = false } = {}) {
  fixtureState.mode = mode;
  fixtureState.installation = installed ? standaloneInstallation() : { available: false, command: "", pathEntries: [], provenance: "none", summary: "Codex missing" };
  fixtureState.authenticated = authenticated;
  fixtureState.processCalls = [];
  fixtureState.installerCalls = [];
  fixtureState.activeOwners = [];
  fixtureState.blockNextProbe = false;
  fixtureState.probeStarted = null;
  fixtureState.releaseProbe = null;
  fixtureState.blockNextVersion = false;
  fixtureState.versionStarted = null;
  fixtureState.releaseVersion = null;
  fixtureState.blockNextLoginStatus = false;
  fixtureState.loginStatusStarted = null;
  fixtureState.releaseLoginStatus = null;
  fixtureState.blockNextReadiness = false;
  fixtureState.readinessStarted = null;
  fixtureState.releaseReadiness = null;
  fixtureState.readinessCodexProbe = null;
}

async function runProductionCodexMatrix() {
  const window = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(fixtureDir, "../../desktop/preload.cjs"),
      contextIsolation: true,
      sandbox: true
    }
  });
  authorizedSetupSender = window.webContents;
  const setupEvents = [];
  const stopEvents = codexSetupManager.onEvent((snapshot) => {
    setupEvents.push(snapshot);
    if (!window.isDestroyed()) window.webContents.send("arckit:setup-event", combineSetup(undefined, snapshot));
  });
  try {
    await window.loadFile(join(fixtureDir, "setup-readiness-ipc.html"));
    const invoke = (script) => window.webContents.executeJavaScript(script);
    const confirm = async (action, intent = {}) => invoke(`window.arckitDesktop.confirmCodexSetup(${JSON.stringify({ action, ...intent })})`);
    const invokeConfirmed = async (action, method, intent = {}) => {
      const confirmation = await confirm(action, intent);
      return invoke(`window.arckitDesktop.${method}(${JSON.stringify({ ...intent, confirmation_id: confirmation.confirmation_id })})`);
    };

    const unauthorizedWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: join(fixtureDir, "../../desktop/preload.cjs"),
        contextIsolation: true,
        sandbox: true
      }
    });
    let unauthorizedSenderRejected = false;
    try {
      await unauthorizedWindow.loadFile(join(fixtureDir, "setup-readiness-ipc.html"));
      unauthorizedSenderRejected = await unauthorizedWindow.webContents.executeJavaScript(`window.arckitDesktop.recheckCodexSetup().then(() => false, (error) => /sender rejected/.test(error.message))`);
    } finally {
      unauthorizedWindow.destroy();
    }

    resetCodexScenario("install-success", { installed: false });
    await codexSetupManager.check();
    const staleConfirmation = await confirm("install");
    await new Promise((resolve) => setTimeout(resolve, 2));
    await codexSetupManager.check();
    const staleConfirmationRejected = await invoke(`window.arckitDesktop.installCodex(${JSON.stringify({ confirmation_id: staleConfirmation.confirmation_id })}).then(() => false, (error) => /state changed/.test(error.message))`);
    const installConfirmation = await confirm("install");
    const installInput = { confirmation_id: installConfirmation.confirmation_id };
    const install = await invoke(`window.arckitDesktop.installCodex(${JSON.stringify(installInput)})`);
    const replayRejected = await invoke(`window.arckitDesktop.installCodex(${JSON.stringify(installInput)}).then(() => false, (error) => /already used/.test(error.message))`);
    const installCalls = [...fixtureState.installerCalls];

    resetCodexScenario("install-success-recheck", { installed: false });
    await codexSetupManager.check();
    const postInstallProbeStarted = new Promise((resolve) => { fixtureState.probeStarted = resolve; });
    const postInstallVersionStarted = new Promise((resolve) => { fixtureState.versionStarted = resolve; });
    const postInstallLoginStatusStarted = new Promise((resolve) => { fixtureState.loginStatusStarted = resolve; });
    const postInstallReadinessStarted = new Promise((resolve) => { fixtureState.readinessStarted = resolve; });
    const recheckConfirmation = await confirm("install");
    const recheckEventStart = setupEvents.length;
    const recheckingInstallPromise = invoke(`window.arckitDesktop.installCodex(${JSON.stringify({ confirmation_id: recheckConfirmation.confirmation_id })})`);
    await postInstallProbeStarted;
    const successfulRecheckExecutable = codexSetupManager.getSnapshot();
    const staleOperationId = setupEvents.slice(recheckEventStart).find((snapshot) => snapshot.operation?.id)?.operation?.id;
    const successfulRecheckCancelRejected = await invoke(`window.arckitDesktop.cancelCodexSetup(${JSON.stringify({ operation_id: staleOperationId })}).then(() => false, (error) => /OPERATION_NOT_ACTIVE|没有可取消/.test(error.message))`);
    fixtureState.releaseProbe?.();
    await postInstallVersionStarted;
    const successfulRecheckVersion = codexSetupManager.getSnapshot();
    fixtureState.releaseVersion?.();
    await postInstallLoginStatusStarted;
    const successfulRecheckLoginStatus = codexSetupManager.getSnapshot();
    fixtureState.releaseLoginStatus?.();
    await postInstallReadinessStarted;
    const successfulRecheckReadiness = codexSetupManager.getSnapshot();
    const successfulRecheckCodexProbe = structuredClone(fixtureState.readinessCodexProbe);
    fixtureState.releaseReadiness?.();
    await recheckingInstallPromise;
    const successfulRecheckPhases = setupEvents.slice(recheckEventStart)
      .map((snapshot) => snapshot.operation?.phase)
      .filter((phase) => phase?.startsWith("rechecking-"));

    resetCodexScenario("update-success", { authenticated: true });
    await codexSetupManager.check();
    const update = await invokeConfirmed("update", "updateCodex");
    const updateCalls = [...fixtureState.installerCalls];

    resetCodexScenario("owner-blocked", { authenticated: true });
    fixtureState.activeOwners = [{ kind: "automation", id: "EXEC-IPC-1" }, { kind: "chat", id: "CHAT-IPC-1" }];
    await codexSetupManager.check();
    const ownerConfirmation = await confirm("update");
    const ownerRejected = await invoke(`window.arckitDesktop.updateCodex(${JSON.stringify({ confirmation_id: ownerConfirmation.confirmation_id })}).then(() => false, () => true)`);
    const ownerProjection = await invoke("window.arckitDesktop.getSetupReadiness()");
    const ownerInstallerCalls = fixtureState.installerCalls.length;

    resetCodexScenario("browser-success");
    await codexSetupManager.check();
    const loginMissingConfirmationRejected = await invoke("window.arckitDesktop.loginCodex({ method: 'chatgpt', flow: 'browser' }).then(() => false, (error) => /confirmation/.test(error.message))");
    const mismatchedLoginConfirmation = await confirm("login", { method: "chatgpt", flow: "browser" });
    const loginIntentMismatchRejected = await invoke(`window.arckitDesktop.loginCodex(${JSON.stringify({ method: "chatgpt", flow: "device", confirmation_id: mismatchedLoginConfirmation.confirmation_id })}).then(() => false, (error) => /selected login method/.test(error.message))`);
    const browserConfirmation = await confirm("login", { method: "chatgpt", flow: "browser" });
    const browserInput = { method: "chatgpt", flow: "browser", confirmation_id: browserConfirmation.confirmation_id };
    const browser = await invoke(`window.arckitDesktop.loginCodex(${JSON.stringify(browserInput)})`);
    const loginReplayRejected = await invoke(`window.arckitDesktop.loginCodex(${JSON.stringify(browserInput)}).then(() => false, (error) => /already used/.test(error.message))`);
    const browserCalls = [...fixtureState.processCalls];

    resetCodexScenario("device-success");
    await codexSetupManager.check();
    const device = await invokeConfirmed("login", "loginCodex", { method: "chatgpt", flow: "device" });
    const deviceCalls = [...fixtureState.processCalls];
    const deviceChallenge = setupEvents.findLast((snapshot) => snapshot.operation?.device_auth)?.operation?.device_auth || null;

    resetCodexScenario("cancel");
    await codexSetupManager.check();
    const cancelEventStart = setupEvents.length;
    const cancelConfirmation = await confirm("login", { method: "chatgpt", flow: "browser" });
    const cancelPromise = invoke(`window.arckitDesktop.loginCodex(${JSON.stringify({ method: "chatgpt", flow: "browser", confirmation_id: cancelConfirmation.confirmation_id })})`);
    await new Promise((resolve) => setTimeout(resolve, 40));
    const operationId = codexSetupManager.getSnapshot().operation?.id;
    const wrongOperationRejected = await invoke(`window.arckitDesktop.cancelCodexSetup({ operation_id: 'wrong-operation' }).then(() => false, (error) => /operation|OPERATION_MISMATCH/i.test(error.message))`);
    await invoke(`window.arckitDesktop.cancelCodexSetup(${JSON.stringify({ operation_id: operationId })})`);
    const cancelled = await cancelPromise;

    resetCodexScenario("timeout");
    await codexSetupManager.check();
    const timeoutEventStart = setupEvents.length;
    const timedOut = await invokeConfirmed("login", "loginCodex", { method: "chatgpt", flow: "browser" });

    resetCodexScenario("failure");
    await codexSetupManager.check();
    const failureEventStart = setupEvents.length;
    const failed = await invokeConfirmed("login", "loginCodex", { method: "chatgpt", flow: "browser" });

    return {
      productionPreload: await invoke("Boolean(window.arckitDesktop?.installCodex && window.arckitDesktop?.loginCodex && window.arckitDesktop?.cancelCodexSetup)"),
      authority: { unauthorizedSenderRejected, staleConfirmationRejected, replayRejected, loginMissingConfirmationRejected, loginIntentMismatchRejected, loginReplayRejected, wrongOperationRejected },
      install: { status: install.status, codex: install.codex_setup.status, available: install.codex_setup.installation.available, provenance: install.codex_setup.installation.provenance, operation: install.codex_setup.operation, installer: installCalls[0] },
      successfulRecheck: {
        status: successfulRecheckExecutable.status,
        stages: [successfulRecheckExecutable, successfulRecheckVersion, successfulRecheckLoginStatus, successfulRecheckReadiness].map((snapshot) => ({
          kind: snapshot.operation?.kind,
          phase: snapshot.operation?.phase,
          startedAtValid: Number.isFinite(Date.parse(snapshot.operation?.started_at || "")),
          cancellable: snapshot.operation?.cancellable
        })),
        phases: successfulRecheckPhases,
        codexProbe: successfulRecheckCodexProbe,
        cancelRejected: successfulRecheckCancelRejected
      },
      update: { status: update.status, codex: update.codex_setup.status, operation: update.codex_setup.operation, installer: updateCalls[0] },
      ownerBlocked: { rejected: ownerRejected, code: ownerProjection.codex_setup.error?.code, owners: ownerProjection.codex_setup.error?.owners, installerCalls: ownerInstallerCalls },
      browser: { status: browser.status, codex: browser.codex_setup.status, args: browserCalls.find((call) => call.args[0] === "login" && call.args.length === 1)?.args || [] },
      device: { status: device.status, codex: device.codex_setup.status, args: deviceCalls.find((call) => call.args.includes("--device-auth"))?.args || [], challenge: deviceChallenge },
      cancelled: { status: cancelled.codex_setup.status, code: cancelled.codex_setup.error?.code, operation: cancelled.codex_setup.operation, rechecked: setupEvents.slice(cancelEventStart).some((snapshot) => snapshot.operation?.phase?.startsWith("rechecking-")) },
      timedOut: { status: timedOut.codex_setup.status, code: timedOut.codex_setup.error?.code, operation: timedOut.codex_setup.operation, rechecked: setupEvents.slice(timeoutEventStart).some((snapshot) => snapshot.operation?.phase?.startsWith("rechecking-")) },
      failed: { status: failed.codex_setup.status, code: failed.codex_setup.error?.code, operation: failed.codex_setup.operation, rechecked: setupEvents.slice(failureEventStart).some((snapshot) => snapshot.operation?.phase?.startsWith("rechecking-")) }
    };
  } finally {
    stopEvents();
    window.destroy();
  }
}

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
    const productionCodexMatrix = await runProductionCodexMatrix();
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      console.error = () => {};
      window.confirm = () => true;
      const wait = () => new Promise((resolve) => setTimeout(resolve, 120));
      await window.arckitDesktop.emitSetupScenario('codex-selection');
      await wait();
      const codexMethodDefaultCount = document.querySelectorAll('input[name="codexAuthMethod"]:checked').length;
      const codexFlowDefaultCount = document.querySelectorAll('input[name="codexChatgptFlow"]:checked').length;
      const codexInitialLoginDisabled = document.querySelector('#codexLoginButton').disabled;
      const codexDeviceHidden = document.querySelector('#codexDeviceFlowOption').classList.contains('hidden');
      const codexAccessTokenHidden = document.querySelector('#codexAccessTokenOption').classList.contains('hidden');
      await window.arckitDesktop.emitSetupScenario('codex-active');
      await wait();
      const codexCancelVisibleWhileActive = !document.querySelector('#codexCancelButton').classList.contains('hidden');
      const codexCancelEnabledWhileActive = !document.querySelector('#codexCancelButton').disabled;
      const codexActiveFeedback = document.querySelector('#codexSetupFeedback').textContent;
      await window.arckitDesktop.emitSetupScenario('codex-rechecking');
      await wait();
      const codexCancelHiddenWhileRechecking = document.querySelector('#codexCancelButton').classList.contains('hidden');
      const codexCancelDisabledWhileRechecking = document.querySelector('#codexCancelButton').disabled;
      const codexRecheckingFeedback = document.querySelector('#codexSetupFeedback').textContent;
      document.querySelector('#codexCancelButton').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait();
      await window.arckitDesktop.emitSetupScenario('codex-owner-blocked');
      await wait();
      const codexOwnerBlockerText = document.querySelector('#setupErrorPanel').textContent;
      const codexUpdateDisabledWhileOwnerBlocked = document.querySelector('#codexUpdateButton').disabled;
      await window.arckitDesktop.emitSetupScenario('codex-selection');
      await wait();
      const apiKeyChoice = document.querySelector('input[name="codexAuthMethod"][value="api-key"]');
      apiKeyChoice.checked = true;
      apiKeyChoice.dispatchEvent(new Event('change', { bubbles: true }));
      const secretInput = document.querySelector('#codexSecretInput');
      secretInput.value = 'fixture-secret';
      secretInput.dispatchEvent(new Event('input', { bubbles: true }));
      const codexLoginEnabledAfterSecret = !document.querySelector('#codexLoginButton').disabled;
      document.querySelector('#codexLoginButton').click();
      const codexSecretClearedImmediately = secretInput.value === '';
      await wait();
      const codexReadyWithoutRestart = document.querySelector('#codexSetupStatus').textContent === 'READY';
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
        codexMethodDefaultCount,
        codexFlowDefaultCount,
        codexInitialLoginDisabled,
        codexDeviceHidden,
        codexAccessTokenHidden,
        codexCancelVisibleWhileActive,
        codexCancelEnabledWhileActive,
        codexActiveFeedback,
        codexCancelHiddenWhileRechecking,
        codexCancelDisabledWhileRechecking,
        codexRecheckingFeedback,
        codexOwnerBlockerText,
        codexUpdateDisabledWhileOwnerBlocked,
        codexLoginEnabledAfterSecret,
        codexSecretClearedImmediately,
        codexReadyWithoutRestart,
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
        calls,
        productionCodexMatrix: ${JSON.stringify(productionCodexMatrix)}
      };
    })()`);
    const resultJson = `${JSON.stringify(result)}\n`;
    if (process.env.ARCORBIT_ELECTRON_SETUP_RESULT) await writeFile(process.env.ARCORBIT_ELECTRON_SETUP_RESULT, resultJson);
    else process.stdout.write(resultJson);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.quit();
  }
}).catch(async (error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  if (process.env.ARCORBIT_ELECTRON_SETUP_RESULT) {
    await writeFile(process.env.ARCORBIT_ELECTRON_SETUP_RESULT, JSON.stringify({ error: error.stack || error.message })).catch(() => undefined);
  }
  await rm(userData, { recursive: true, force: true }).catch(() => undefined);
  app.exit(1);
});
