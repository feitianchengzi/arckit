export const WORKER_TYPES = [
  "product",
  "tech",
  "implementation",
  "verification",
  "diagnosis",
  "closeout"
];

export const DEFAULT_WORKER_TYPE = "implementation";

const BASE_FORBIDDEN_ACTIONS = [
  "silently_expand_scope",
  "decide_human_gate",
  "decide_case_closed",
  "write_ledger_directly"
];

const WORKER_TYPE_DEFINITIONS = {
  product: {
    objective: "Clarify or maintain product expectations, acceptance boundaries, scenarios, open questions, and pending product facts.",
    allowed_actions: ["read_files", "edit_allowed_paths", "report_evidence", "route_unknowns_to_pending"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "write_code_without_implementation_handoff"]
  },
  tech: {
    objective: "Clarify or maintain technical facts, architecture decisions, constraints, implementation handoff inputs, and unresolved technical risks.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "make_unconfirmed_product_decisions"]
  },
  implementation: {
    objective: "Execute a bounded implementation or implementation-handoff task using confirmed facts, allowed paths, and explicit verification expectations.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "invent_product_behavior", "change_unrelated_files"]
  },
  verification: {
    objective: "Verify facts, reports, implementation evidence, artifact impacts, and closeout readiness without expanding product scope.",
    allowed_actions: ["read_files", "run_non_destructive_checks", "report_evidence"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "make_unverified_completion_claim"]
  },
  diagnosis: {
    objective: "Diagnose defects, regressions, failures, inconsistencies, or runtime problems using evidence and bounded investigation.",
    allowed_actions: ["read_files", "run_non_destructive_checks", "report_evidence", "propose_fix"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "rewrite_architecture_without_decision"]
  },
  closeout: {
    objective: "Audit whether the round can close, continue, wait, block, or request human decision based on worker reports and evidence.",
    allowed_actions: ["read_files", "report_evidence", "summarize_handoff"],
    forbidden_actions: [...BASE_FORBIDDEN_ACTIONS, "write_ledger_directly"]
  }
};

export function workerTypeDefinitionFor(workerType) {
  return WORKER_TYPE_DEFINITIONS[workerType] || WORKER_TYPE_DEFINITIONS[DEFAULT_WORKER_TYPE];
}

export function normalizeWorkerType(value) {
  return WORKER_TYPES.includes(value) ? value : DEFAULT_WORKER_TYPE;
}
