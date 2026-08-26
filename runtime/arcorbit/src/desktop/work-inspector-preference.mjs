export const WORK_INSPECTOR_DEFAULT_WIDTH = 440;
export const WORK_INSPECTOR_MIN_WIDTH = 360;
export const WORK_INSPECTOR_MAX_WIDTH = 640;
export const WORK_INSPECTOR_LIST_MIN_WIDTH = 420;
export const WORK_INSPECTOR_SEPARATOR_WIDTH = 12;
export const WORK_INSPECTOR_KEYBOARD_STEP = 16;
export const WORK_INSPECTOR_KEYBOARD_LARGE_STEP = 48;

export function normalizeWorkInspectorWidth(value, fallback = WORK_INSPECTOR_DEFAULT_WIDTH) {
  if (value === null || value === undefined || value === "") return normalizeFallback(fallback);
  const number = Number(value);
  if (!Number.isFinite(number)) return normalizeFallback(fallback);
  return Math.min(WORK_INSPECTOR_MAX_WIDTH, Math.max(WORK_INSPECTOR_MIN_WIDTH, Math.round(number)));
}

export function effectiveWorkInspectorWidth(savedWidth, layoutWidth) {
  const saved = normalizeWorkInspectorWidth(savedWidth);
  const available = Number(layoutWidth);
  if (!Number.isFinite(available) || available <= 0) return saved;
  const windowMaximum = Math.max(0, Math.floor(available) - WORK_INSPECTOR_LIST_MIN_WIDTH - WORK_INSPECTOR_SEPARATOR_WIDTH);
  return Math.min(saved, windowMaximum);
}

export function workInspectorKeyboardWidth(currentWidth, key, shiftKey = false) {
  const step = shiftKey ? WORK_INSPECTOR_KEYBOARD_LARGE_STEP : WORK_INSPECTOR_KEYBOARD_STEP;
  if (key === "ArrowLeft") return normalizeWorkInspectorWidth(Number(currentWidth) + step);
  if (key === "ArrowRight") return normalizeWorkInspectorWidth(Number(currentWidth) - step);
  return null;
}

export function workInspectorPointerWidth(startWidth, startClientX, currentClientX) {
  return normalizeWorkInspectorWidth(Number(startWidth) + Number(startClientX) - Number(currentClientX));
}

export function createWorkInspectorWidthPersistence({
  initialWidth = WORK_INSPECTOR_DEFAULT_WIDTH,
  persistWidth,
  onVisibleWidth = () => {},
  onConfirmedWidth = () => {}
} = {}) {
  if (typeof persistWidth !== "function") throw new TypeError("persistWidth must be a function");
  let confirmedWidth = normalizeWorkInspectorWidth(initialWidth);
  let latestIntent = 0;
  let pendingCount = 0;
  let persistenceQueue = Promise.resolve();

  return {
    synchronize(width) {
      if (pendingCount > 0) return confirmedWidth;
      confirmedWidth = normalizeWorkInspectorWidth(width);
      onConfirmedWidth(confirmedWidth);
      onVisibleWidth(confirmedWidth);
      return confirmedWidth;
    },
    persist(width) {
      const intent = ++latestIntent;
      const candidate = normalizeWorkInspectorWidth(width);
      pendingCount += 1;
      onVisibleWidth(candidate);
      const operation = persistenceQueue.then(async () => {
        try {
          const result = await persistWidth(candidate);
          confirmedWidth = normalizeWorkInspectorWidth(result?.work_inspector_width_px);
          onConfirmedWidth(confirmedWidth);
          if (intent === latestIntent) onVisibleWidth(confirmedWidth);
          return confirmedWidth;
        } catch (error) {
          if (intent === latestIntent) onVisibleWidth(confirmedWidth);
          throw error;
        } finally {
          pendingCount -= 1;
        }
      });
      persistenceQueue = operation.catch(() => {});
      return operation;
    }
  };
}

function normalizeFallback(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return WORK_INSPECTOR_DEFAULT_WIDTH;
  return Math.min(WORK_INSPECTOR_MAX_WIDTH, Math.max(WORK_INSPECTOR_MIN_WIDTH, Math.round(number)));
}
