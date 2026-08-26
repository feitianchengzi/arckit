import assert from "node:assert/strict";
import test from "node:test";
import { registerCodexSetupIpc } from "../src/desktop/codex-setup-ipc.mjs";

test("Codex Setup IPC rejects foreign senders and stale or replayed confirmations", async () => {
  const handlers = new Map();
  const sender = { id: "main-window" };
  let snapshot = setupSnapshot("snapshot-1");
  let installCalls = 0;
  let confirmationSequence = 0;
  const manager = {
    getSnapshot: () => structuredClone(snapshot),
    install: async () => { installCalls += 1; return snapshot; },
    update: async () => snapshot,
    migrateToStandalone: async () => snapshot,
    login: async () => snapshot,
    cancel: () => snapshot,
    logout: async () => snapshot
  };
  registerCodexSetupIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    codexSetupManager: manager,
    combinedSetupReadiness: (_skills, codex = snapshot) => ({ codex_setup: codex }),
    checkCombinedSetupReadiness: async () => ({ codex_setup: snapshot }),
    refreshAfterCodexOperation: async (operation) => ({ codex_setup: await operation() }),
    authorizeSender: (event) => {
      if (event.sender !== sender) throw Object.assign(new Error("foreign sender"), { code: "IPC_SENDER_REJECTED" });
    },
    confirmAction: async () => true,
    createConfirmationId: () => `confirmation-${++confirmationSequence}`
  });

  await assert.rejects(
    () => handlers.get("arckit:codex-setup-recheck")({ sender: { id: "other" } }),
    (error) => error.code === "IPC_SENDER_REJECTED"
  );

  const stale = await handlers.get("arckit:codex-setup-confirm")({ sender }, { action: "install" });
  snapshot = setupSnapshot("snapshot-2");
  await assert.rejects(
    () => handlers.get("arckit:codex-setup-install")({ sender }, { confirmation_id: stale.confirmation_id }),
    (error) => error.code === "CONFIRMATION_STALE"
  );

  const fresh = await handlers.get("arckit:codex-setup-confirm")({ sender }, { action: "install" });
  await handlers.get("arckit:codex-setup-install")({ sender }, { confirmation_id: fresh.confirmation_id });
  await assert.rejects(
    () => handlers.get("arckit:codex-setup-install")({ sender }, { confirmation_id: fresh.confirmation_id }),
    (error) => error.code === "CONFIRMATION_INVALID"
  );
  assert.equal(installCalls, 1);
});

test("Codex Setup IPC requires cancel operation identity", async () => {
  const handlers = new Map();
  const sender = { id: "main-window" };
  const snapshot = setupSnapshot("snapshot-1");
  let cancelInput = null;
  registerCodexSetupIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    codexSetupManager: {
      getSnapshot: () => snapshot,
      install: async () => snapshot,
      update: async () => snapshot,
      migrateToStandalone: async () => snapshot,
      login: async () => snapshot,
      cancel: (input) => { cancelInput = input; return snapshot; },
      logout: async () => snapshot
    },
    combinedSetupReadiness: (_skills, codex = snapshot) => ({ codex_setup: codex }),
    checkCombinedSetupReadiness: async () => ({ codex_setup: snapshot }),
    refreshAfterCodexOperation: async (operation) => ({ codex_setup: await operation() }),
    authorizeSender: (event) => assert.equal(event.sender, sender),
    confirmAction: async () => true
  });

  await assert.rejects(
    () => handlers.get("arckit:codex-setup-cancel")({ sender }, {}),
    (error) => error.code === "OPERATION_ID_REQUIRED"
  );
  await handlers.get("arckit:codex-setup-cancel")({ sender }, { operation_id: "operation-1" });
  assert.deepEqual(cancelInput, { operation_id: "operation-1" });
});

test("Codex Setup IPC binds one-time confirmation to the selected login intent without exposing secrets", async () => {
  const handlers = new Map();
  const sender = { id: "main-window" };
  const snapshot = setupSnapshot("snapshot-1");
  const confirmations = [];
  const loginInputs = [];
  let confirmationSequence = 0;
  registerCodexSetupIpc({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    codexSetupManager: {
      getSnapshot: () => snapshot,
      install: async () => snapshot,
      update: async () => snapshot,
      migrateToStandalone: async () => snapshot,
      login: async (input) => { loginInputs.push(input); return snapshot; },
      cancel: () => snapshot,
      logout: async () => snapshot
    },
    combinedSetupReadiness: (_skills, codex = snapshot) => ({ codex_setup: codex }),
    checkCombinedSetupReadiness: async () => ({ codex_setup: snapshot }),
    refreshAfterCodexOperation: async (operation) => ({ codex_setup: await operation() }),
    authorizeSender: (event) => assert.equal(event.sender, sender),
    confirmAction: async (action, _snapshot, intent) => { confirmations.push({ action, intent }); return true; },
    createConfirmationId: () => `confirmation-${++confirmationSequence}`
  });

  await assert.rejects(
    () => handlers.get("arckit:codex-setup-login")({ sender }, { method: "chatgpt", flow: "browser" }),
    (error) => error.code === "CONFIRMATION_INVALID"
  );

  const mismatched = await handlers.get("arckit:codex-setup-confirm")({ sender }, { action: "login", method: "chatgpt", flow: "browser" });
  await assert.rejects(
    () => handlers.get("arckit:codex-setup-login")({ sender }, { method: "chatgpt", flow: "device", confirmation_id: mismatched.confirmation_id }),
    (error) => error.code === "CONFIRMATION_INTENT_MISMATCH"
  );

  const secret = "fixture-api-key-secret";
  const confirmed = await handlers.get("arckit:codex-setup-confirm")({ sender }, { action: "login", method: "api-key" });
  await handlers.get("arckit:codex-setup-login-secret")({ sender }, { method: "api-key", secret, confirmation_id: confirmed.confirmation_id });
  await assert.rejects(
    () => handlers.get("arckit:codex-setup-login-secret")({ sender }, { method: "api-key", secret, confirmation_id: confirmed.confirmation_id }),
    (error) => error.code === "CONFIRMATION_INVALID"
  );

  assert.deepEqual(confirmations, [
    { action: "login", intent: { method: "chatgpt", flow: "browser" } },
    { action: "login", intent: { method: "api-key", flow: "" } }
  ]);
  assert.equal(JSON.stringify(confirmations).includes(secret), false);
  assert.deepEqual(loginInputs, [{ method: "api-key", flow: "", secret }]);
});

function setupSnapshot(updatedAt) {
  return {
    status: "missing",
    updated_at: updatedAt,
    installation: { state: "missing", available: false },
    authentication: { state: "unavailable", authenticated: false },
    operation: null,
    error: null
  };
}
