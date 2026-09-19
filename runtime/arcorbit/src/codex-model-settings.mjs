export const DEFAULT_CODEX_MODEL = "gpt-6-astra";
export const DEFAULT_CODEX_REASONING_EFFORT = "high";

export function validCodexSetting(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/u.test(value);
}

export function normalizeCodexExecutionSettings(value = {}, fallback = {}) {
  return {
    model: validCodexSetting(value?.model)
      ? value.model.trim()
      : validCodexSetting(fallback?.model) ? fallback.model.trim() : DEFAULT_CODEX_MODEL,
    reasoning_effort: validCodexSetting(value?.reasoning_effort)
      ? value.reasoning_effort.trim()
      : validCodexSetting(fallback?.reasoning_effort) ? fallback.reasoning_effort.trim() : DEFAULT_CODEX_REASONING_EFFORT
  };
}

export function normalizeCodexSettings(value = {}) {
  const legacy = normalizeCodexExecutionSettings(value);
  return {
    yolo_mode: value?.yolo_mode === true,
    chat: normalizeCodexExecutionSettings(value?.chat, legacy),
    automation: normalizeCodexExecutionSettings(value?.automation, legacy)
  };
}

export function validateCodexExecutionSettingsPatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).length !== 2
      || Object.entries(value).some(([key, item]) => !["model", "reasoning_effort"].includes(key) || !validCodexSetting(item))) {
    throw new Error("Model 和 Level 必须是 1–200 个字符的非空文本，不能包含控制字符。");
  }
}

export function validateCodexSettingsPatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).length === 0
      || Object.entries(value).some(([key, item]) => {
        if (key === "yolo_mode") return typeof item !== "boolean";
        if (!["chat", "automation"].includes(key)) return true;
        try { validateCodexExecutionSettingsPatch(item); return false; } catch { return true; }
      })) {
    throw new Error("Chat 与 Automation 的 Model 和 Level 配置必须完整且有效。");
  }
}
