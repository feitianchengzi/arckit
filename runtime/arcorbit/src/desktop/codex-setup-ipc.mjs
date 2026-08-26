import { randomUUID } from "node:crypto";

const CONFIRMED_ACTIONS = new Set(["install", "update", "migrate", "login", "logout"]);

export function registerCodexSetupIpc({
  ipcMain,
  codexSetupManager,
  combinedSetupReadiness,
  checkCombinedSetupReadiness,
  refreshAfterCodexOperation,
  authorizeSender,
  confirmAction,
  createConfirmationId = randomUUID
} = {}) {
  requiredFunction(ipcMain?.handle, "ipcMain.handle");
  requiredFunction(codexSetupManager?.install, "codexSetupManager.install");
  requiredFunction(combinedSetupReadiness, "combinedSetupReadiness");
  requiredFunction(checkCombinedSetupReadiness, "checkCombinedSetupReadiness");
  requiredFunction(refreshAfterCodexOperation, "refreshAfterCodexOperation");
  requiredFunction(authorizeSender, "authorizeSender");
  requiredFunction(confirmAction, "confirmAction");
  requiredFunction(createConfirmationId, "createConfirmationId");

  const confirmations = new Map();
  const authorized = (handler) => async (event, ...args) => {
    authorizeSender(event);
    return handler(...args);
  };
  const confirmed = (action, operation, intentFromInput = () => null) => authorized(async (input) => {
    const intent = intentFromInput(input);
    consumeConfirmation(confirmations, action, input, codexSetupManager.getSnapshot(), intent);
    return refreshAfterCodexOperation(() => operation(input));
  });

  ipcMain.handle("arckit:codex-setup-confirm", authorized(async (input) => {
    const action = requireConfirmedAction(input?.action);
    const intent = confirmationIntent(action, input);
    const snapshot = codexSetupManager.getSnapshot();
    const accepted = await confirmAction(action, snapshot, intent);
    if (!accepted) return { confirmed: false, confirmation_id: "" };
    const confirmationId = String(createConfirmationId());
    confirmations.clear();
    confirmations.set(confirmationId, { action, snapshot: snapshotAuthority(snapshot), intent: intentAuthority(intent) });
    return { confirmed: true, confirmation_id: confirmationId };
  }));
  ipcMain.handle("arckit:codex-setup-install", confirmed("install", () => codexSetupManager.install()));
  ipcMain.handle("arckit:codex-setup-update", confirmed("update", () => codexSetupManager.update()));
  ipcMain.handle("arckit:codex-setup-migrate", confirmed("migrate", () => codexSetupManager.migrateToStandalone()));
  ipcMain.handle("arckit:codex-setup-login", confirmed(
    "login",
    (input) => codexSetupManager.login(requireCodexLoginInput(input, false)),
    loginIntentFromInput
  ));
  ipcMain.handle("arckit:codex-setup-login-secret", confirmed(
    "login",
    (input) => codexSetupManager.login(requireCodexLoginInput(input, true)),
    loginIntentFromInput
  ));
  ipcMain.handle("arckit:codex-setup-cancel", authorized(async (input) => (
    combinedSetupReadiness(undefined, codexSetupManager.cancel(requireOperationInput(input)))
  )));
  ipcMain.handle("arckit:codex-setup-logout", confirmed("logout", () => codexSetupManager.logout()));
  ipcMain.handle("arckit:codex-setup-recheck", authorized(async () => checkCombinedSetupReadiness()));
}

function consumeConfirmation(confirmations, action, input, snapshot, intent = null) {
  const confirmationId = String(input?.confirmation_id || "");
  const confirmation = confirmations.get(confirmationId);
  confirmations.delete(confirmationId);
  if (!confirmation || confirmation.action !== action) throw ipcError("CONFIRMATION_INVALID", "Codex Setup confirmation is missing, invalid, or already used.");
  if (confirmation.snapshot !== snapshotAuthority(snapshot)) throw ipcError("CONFIRMATION_STALE", "Codex Setup state changed; confirm the action again.");
  if (confirmation.intent !== intentAuthority(intent)) throw ipcError("CONFIRMATION_INTENT_MISMATCH", "Codex Setup action changed; confirm the selected login method again.");
}

function requireConfirmedAction(value) {
  const action = String(value || "");
  if (!CONFIRMED_ACTIONS.has(action)) throw ipcError("CONFIRMATION_ACTION_INVALID", "Codex Setup confirmation action is invalid.");
  return action;
}

function confirmationIntent(action, input) {
  return action === "login" ? loginIntentFromInput(input) : null;
}

function loginIntentFromInput(input) {
  const { method, flow } = requireCodexLoginInput(input, false);
  if (!new Set(["chatgpt", "api-key", "access-token"]).has(method)) {
    throw ipcError("AUTH_METHOD_REQUIRED", "Select a supported Codex login method before confirming.");
  }
  if (method === "chatgpt" && !new Set(["browser", "device"]).has(flow)) {
    throw ipcError("AUTH_FLOW_REQUIRED", "Select a supported ChatGPT login flow before confirming.");
  }
  return { method, flow: method === "chatgpt" ? flow : "" };
}

function intentAuthority(intent) {
  return JSON.stringify(intent || null);
}

function requireOperationInput(input) {
  const operationId = String(input?.operation_id || "");
  if (!operationId) throw ipcError("OPERATION_ID_REQUIRED", "Codex Setup operation id is required.");
  return { operation_id: operationId };
}

function snapshotAuthority(snapshot = {}) {
  return JSON.stringify({
    updated_at: snapshot.updated_at,
    status: snapshot.status,
    installation: snapshot.installation,
    authentication: snapshot.authentication,
    operation: snapshot.operation,
    error: snapshot.error
  });
}

function ipcError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function requireCodexLoginInput(input, withSecret) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Codex login input is required.");
  const value = {
    method: String(input.method || "").slice(0, 32),
    flow: String(input.flow || "").slice(0, 32)
  };
  if (withSecret) value.secret = String(input.secret || "").slice(0, 32_768);
  return value;
}

function requiredFunction(value, name) {
  if (typeof value !== "function") throw new TypeError(`${name} must be a function.`);
  return value;
}
