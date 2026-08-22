const RESULT_VERSION = "feedback-v2-ipc-result/v1";

async function settleFeedbackV2Ipc(action) {
  try {
    return { version: RESULT_VERSION, ok: true, value: await action() };
  } catch (error) {
    return {
      version: RESULT_VERSION,
      ok: false,
      error: {
        code: boundedText(error?.code || "feedback_v2_request_failed", 100),
        status: httpStatus(error?.status ?? error?.details?.status),
        message: boundedText(error?.message || "Feedback V2 request failed.", 1000)
      }
    };
  }
}

function unwrapFeedbackV2Ipc(result) {
  if (!result || result.version !== RESULT_VERSION || typeof result.ok !== "boolean") {
    throw Object.assign(new Error("Feedback V2 IPC result is invalid."), { code: "feedback_v2_ipc_contract_invalid" });
  }
  if (result.ok) return result.value;
  const payload = result.error && typeof result.error === "object" ? result.error : {};
  const error = new Error(boundedText(payload.message || "Feedback V2 request failed.", 1000));
  error.code = boundedText(payload.code || "feedback_v2_request_failed", 100);
  const status = httpStatus(payload.status);
  if (status) error.status = status;
  throw error;
}

function boundedText(value, limit) {
  return String(value || "").slice(0, limit);
}

function httpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
}

module.exports = { RESULT_VERSION, settleFeedbackV2Ipc, unwrapFeedbackV2Ipc };
