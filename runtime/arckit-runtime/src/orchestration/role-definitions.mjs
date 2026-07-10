export const ROLE_DEFINITIONS = {
  controller_state_reader: {
    objective: "Recover the project state, active case context, and known fact-source surfaces before any work is attempted.",
    allowed_actions: ["read_files", "inspect_state", "report_evidence"],
    allowed_skills: ["arckit-development-ledger", "arckit-agent-context"],
    forbidden_actions: ["edit_files", "decide_case_closed", "change_loop_status_directly"]
  },
  controller_route_auditor: {
    objective: "Audit source/projection boundaries and choose the minimum capability set required for this round.",
    allowed_actions: ["inspect_state", "propose_routes", "report_evidence"],
    allowed_skills: ["using-arckit", "arckit-development-ledger", "arckit-pending", "arckit-tech", "arckit-spec"],
    forbidden_actions: ["edit_files", "rewrite_source_truth_without_result_skill", "decide_case_closed"]
  },
  source_fact_worker: {
    objective: "Establish or update the minimum stable source facts for the selected gap, and route unsupported assumptions to pending context.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["using-arckit", "arckit-spec", "arckit-pending", "arckit-tech", "arckit-development-ledger", "arckit-architecture-decision"],
    forbidden_actions: ["implement_product_code", "write_ledger_directly", "silently_expand_scope", "decide_human_gate", "decide_case_closed"]
  },
  implementation_worker: {
    objective: "Execute only the bounded worker packet after the runtime has authorized execution and bound an executor.",
    allowed_actions: ["read_files", "edit_allowed_paths", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["arckit-implementation-handoff", "arckit-debug-diagnosis", "arckit-tech", "arckit-spec"],
    forbidden_actions: ["silently_expand_scope", "decide_human_gate", "decide_case_closed"]
  },
  verification_worker: {
    objective: "Verify the work output, command evidence, schema shape, and state-write readiness independently.",
    allowed_actions: ["read_files", "run_non_destructive_checks", "report_evidence"],
    allowed_skills: ["arckit-development-ledger"],
    forbidden_actions: ["edit_files", "fix_issues_without_task_authorization", "decide_case_closed"]
  },
  closeout_controller: {
    objective: "Check whether the round can close, continue, block, or require a human decision.",
    allowed_actions: ["inspect_reports", "audit_loop_gate", "report_evidence"],
    allowed_skills: ["arckit-development-ledger", "arckit-workflow-memory"],
    forbidden_actions: ["write_ledger_directly", "decide_next_responsibility_without_main_agent"]
  }
};

export const DEFAULT_ROLES = [
  "controller_state_reader",
  "controller_route_auditor",
  "source_fact_worker",
  "implementation_worker",
  "verification_worker",
  "closeout_controller"
];
