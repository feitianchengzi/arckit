export const TASK_DISPLAY_TITLE_GRAPHEME_LIMIT = 64;

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function taskDisplayTitle(value, fallback = "") {
  const primary = String(value ?? "").trim().replace(/\s+/gu, " ");
  const normalized = primary || String(fallback ?? "").trim().replace(/\s+/gu, " ");
  // Only the first 65 graphemes can affect this bounded display title.
  // Do not allocate segments for an entire task description on every store update.
  const prefix = [];
  let count = 0;
  for (const part of graphemeSegmenter.segment(normalized)) {
    count += 1;
    if (count > TASK_DISPLAY_TITLE_GRAPHEME_LIMIT) return `${prefix.join("")}…`;
    if (count < TASK_DISPLAY_TITLE_GRAPHEME_LIMIT) prefix.push(part.segment);
  }
  return normalized;
}
