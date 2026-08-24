export const TASK_DISPLAY_TITLE_GRAPHEME_LIMIT = 64;

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function taskDisplayTitle(value, fallback = "") {
  const primary = String(value ?? "").trim().replace(/\s+/gu, " ");
  const normalized = primary || String(fallback ?? "").trim().replace(/\s+/gu, " ");
  const graphemes = [...graphemeSegmenter.segment(normalized)].map((part) => part.segment);
  if (graphemes.length <= TASK_DISPLAY_TITLE_GRAPHEME_LIMIT) return normalized;
  return `${graphemes.slice(0, TASK_DISPLAY_TITLE_GRAPHEME_LIMIT - 1).join("")}…`;
}
