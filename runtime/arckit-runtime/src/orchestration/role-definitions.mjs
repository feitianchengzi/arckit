export const WORKER_TYPES = [
  "product",
  "tech",
  "implementation",
  "verification",
  "diagnosis",
  "closeout"
];

export const DEFAULT_WORKER_TYPE = "implementation";

export function normalizeWorkerType(value) {
  return WORKER_TYPES.includes(value) ? value : DEFAULT_WORKER_TYPE;
}
