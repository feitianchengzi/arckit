const DEFAULT_LOCALE = "en";

export function detectConversationLocale(text = "") {
  const value = String(text || "").trim();
  if (!value) {
    return DEFAULT_LOCALE;
  }
  const cjkMatches = value.match(/[\u3400-\u9fff]/g) || [];
  if (cjkMatches.length >= 2) {
    return "zh-Hans";
  }
  return DEFAULT_LOCALE;
}

export function conversationLocaleInstruction(locale) {
  if (locale === "zh-Hans") {
    return "Use Simplified Chinese for all human-readable text values, summaries, next prompts, worker packet tasks, worker reports, recommendations, and user-facing explanations. Keep schema keys, enum values, IDs, file paths, commands, and code identifiers unchanged.";
  }
  return "Use the same language as the operator task for all human-readable text values. Keep schema keys, enum values, IDs, file paths, commands, and code identifiers unchanged.";
}
