export const ARCORBIT_FEEDBACK_PROJECT_ID = 107;

// ArcOrbit ships this project-scoped credential with the desktop client.
// Rotate this value and rebuild the app when the Feedback credential changes.
const ARCORBIT_FEEDBACK_API_KEY = "ak_93d390476707d767e12c281cd9665d94718fb8f431bc9d7f48b7f2e142664257";

export function createProductFeedbackService({
  getAuthStatus,
  getCurrentUser,
  surface,
  projectId = ARCORBIT_FEEDBACK_PROJECT_ID,
  apiKey = ARCORBIT_FEEDBACK_API_KEY
}) {
  const configuredProjectId = positiveInteger(projectId);
  const configuredApiKey = String(apiKey || "").trim();
  if (!configuredProjectId) throw new Error("Product feedback projectId must be a positive safe integer.");
  if (!configuredApiKey) throw new Error("Product feedback apiKey is required.");
  let unreadCount = 0;
  const unreadListeners = new Set();

  function setUnreadCount(value) {
    const next = Math.max(0, Math.trunc(Number(value) || 0));
    if (next === unreadCount) return;
    unreadCount = next;
    for (const listener of unreadListeners) listener(unreadCount);
  }

  async function getStatus() {
    return {
      integration_mode: "sdk-webview",
      sdk_auth_mode: "apiKey",
      notifications_enabled: true,
      credential_strategy: "bundled-static",
      configured: true,
      project_id: configuredProjectId,
      unread_count: unreadCount
    };
  }

  async function open(mode = "submit") {
    const action = normalizeMode(mode);
    const resolved = await resolveRuntimeConfig();
    if (!resolved.config) return resolved.result;
    await surface.open({ mode: action, config: resolved.config });
    return { status: "opened", mode: action };
  }

  async function refreshUnread() {
    const resolved = await resolveRuntimeConfig();
    if (!resolved.config) {
      setUnreadCount(0);
      return { ...resolved.result, unread_count: unreadCount };
    }
    await surface.prepare({ config: resolved.config });
    return { status: "ready", unread_count: unreadCount };
  }

  async function resolveRuntimeConfig() {
    const authentication = await getAuthStatus();
    if (!authentication?.authenticated) return { result: { status: "requires_auth", reason: "workshop_login_required" } };
    let user;
    try {
      user = await getCurrentUser();
    } catch {
      return { result: { status: "requires_auth", reason: "current_user_unavailable" } };
    }
    const customUserId = scalarId(user?.id);
    if (!customUserId) return { result: { status: "requires_auth", reason: "current_user_unavailable" } };
    return {
      config: {
        feedbackV2Enabled: true,
        feedbackV2AuthMode: "apiKey",
        apiKey: configuredApiKey,
        projectId: configuredProjectId,
        customUserId,
        gatewayUrl: "https://api.feitianchengzi.com",
        theme: "system",
        feedbackV2NotificationsEnabled: true
      }
    };
  }

  return {
    getStatus,
    open,
    refreshUnread,
    acceptUnreadCount: setUnreadCount,
    onUnreadCount(listener) {
      unreadListeners.add(listener);
      return () => unreadListeners.delete(listener);
    },
    switchMode: (mode) => surface.switchMode(normalizeMode(mode)),
    retry: () => surface.retry(),
    close: () => surface.close(),
    resetSession() {
      surface.close();
      setUnreadCount(0);
    }
  };
}

export function normalizeProductFeedbackMode(value) {
  return normalizeMode(value);
}

function normalizeMode(value) {
  if (!["submit", "status"].includes(value)) throw feedbackError("invalid_feedback_mode", "反馈中心模式无效。");
  return value;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function scalarId(value) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function feedbackError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
