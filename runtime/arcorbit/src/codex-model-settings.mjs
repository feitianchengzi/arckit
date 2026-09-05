export const DEFAULT_CODEX_MODEL = "gpt-6-astra";
export const DEFAULT_CODEX_REASONING_EFFORT = "high";

export function validCodexSetting(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/u.test(value);
}

export function normalizeCodexSettings(value = {}) {
  return {
    model: validCodexSetting(value?.model) ? value.model.trim() : DEFAULT_CODEX_MODEL,
    reasoning_effort: validCodexSetting(value?.reasoning_effort) ? value.reasoning_effort.trim() : DEFAULT_CODEX_REASONING_EFFORT
  };
}

export function validateCodexSettingsPatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.entries(value).some(([key, item]) => !["model", "reasoning_effort"].includes(key) || !validCodexSetting(item))) {
    throw new Error("Model 和 Level 必须是 1–200 个字符的非空文本，不能包含控制字符。");
  }
}
