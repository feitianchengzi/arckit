export const RAW_OPERATOR_EVENT_MARKERS = [
  "arckit-desktop-operator-event/v1",
  "Arckit Desktop operator event."
];

export const SEMANTIC_LIMITS = {
  goal: 800,
  transition: 800,
  nextPrompt: 1200,
  reason: 1200,
  workerObjective: 800,
  workerUserRequest: 1200,
  contextSummary: 1600
};

export function containsRawOperatorEvent(value) {
  if (value === null || value === undefined) {
    return false;
  }
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return RAW_OPERATOR_EVENT_MARKERS.some((marker) => text.includes(marker));
}

export function compactText(value, maxLength = SEMANTIC_LIMITS.contextSummary) {
  const text = stringValue(value).trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function safeSemanticText(value, {
  maxLength = SEMANTIC_LIMITS.goal,
  fallback = "",
  allowRawOperatorEvent = false
} = {}) {
  const text = stringValue(value).trim();
  if (!text) {
    return fallback;
  }
  if (!allowRawOperatorEvent && containsRawOperatorEvent(text)) {
    return fallback;
  }
  return compactText(text, maxLength);
}

export function semanticFieldIssue(value, path, {
  maxLength = SEMANTIC_LIMITS.goal,
  allowEmpty = true
} = {}) {
  if (typeof value !== "string") {
    return null;
  }
  if (!allowEmpty && !value.trim()) {
    return { path, message: "Expected a non-empty semantic field." };
  }
  if (containsRawOperatorEvent(value)) {
    return { path, message: "Semantic field must not contain a raw Desktop operator event." };
  }
  if (value.length > maxLength) {
    return { path, message: `Semantic field exceeds ${maxLength} characters.` };
  }
  return null;
}

export function firstSafeSemanticText(values, options = {}) {
  for (const value of values) {
    const text = safeSemanticText(value, options);
    if (text) {
      return text;
    }
  }
  return options.fallback || "";
}

function stringValue(value) {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}
