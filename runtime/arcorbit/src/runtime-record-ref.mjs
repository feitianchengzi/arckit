const RUN_ID_PATTERN = /^RUN-[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RUNTIME_RECORD_REF_PATTERN = /^arckit-runtime:\/\/runs\/(RUN-[A-Za-z0-9][A-Za-z0-9._-]*)$/;

export function runtimeRecordRefForRun(runId) {
  const normalizedRunId = String(runId || "").trim();
  if (!RUN_ID_PATTERN.test(normalizedRunId)) {
    throw new Error(`Invalid Runtime run id: ${normalizedRunId || "<missing>"}`);
  }
  return `arckit-runtime://runs/${normalizedRunId}`;
}

export function normalizeRuntimeRecordRef(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (!RUNTIME_RECORD_REF_PATTERN.test(normalized)) {
    throw new Error("runtimeRecordRef must be empty or use arckit-runtime://runs/RUN-... syntax.");
  }
  return normalized;
}
