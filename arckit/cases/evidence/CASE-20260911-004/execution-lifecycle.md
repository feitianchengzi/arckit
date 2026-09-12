# Execution lifecycle architecture evidence

## Accepted scope

Preserve Project State -> Case -> serial single-Gap Loop, trusted atomic writes,
completion review and post-commit fresh-read. Separate execution disposition
from software completion. Source maintenance only; no installed application,
remote task, existing Run or active Automation store was patched.

## Ownership and implementation

- `kernel/execution-outcome.mjs` interprets stop, human, external, completion and
  execution failures for live delivery, detached recovery and process completion.
  Required-write failures and invalid results cannot be concealed by a stop.
- Runner requires trusted accepted Case completion for Git closeout. A standalone
  Agent stop ends execution without a Case completion claim or fabricated binding.
- Automation passes existing provenance-backed Case binding and original task
  context on recovery and intervention. It archives stops, releases the lane,
  preserves remote task state and excludes stopped tasks from restart discovery.
  Returning a task to pending starts a new execution and clears its old stop archive.
- External waiting remains external through persistence and restart. Technical
  faults remain runtime recovery; neither is implicitly a human decision.
- Prompt references the skill workflow instead of copying its Gap algorithm and
  typed-ref catalog. The synthetic round no longer supplies arbitrary priority
  judgments or blanket cross-workspace stop policy.
- Using Arckit retains its single-Gap protocol and describes host execution stop
  separately from Ledger-derived resolved handoffs. Product, technical and
  interaction source/projections match that boundary.

## Verification

- Complete `npm run check --workspace @arckit/arcorbit`: 686 passed, 30 skipped,
  two Electron startup failures (experience-realization and task-replacement-sheet).
  The first failed with SIGABRT before assertions; escalation retry could not be
  created (`approval request failed`). These GUI paths are not claimed verified.
- Final targeted set: 154 passed (Automation, disposition, persistence, renderer).
- Final Loop/Agent/protocol set: 29 passed. Tests preserve accepted-write/fresh-read
  ordering and same thread, and check prompt context and absence of duplicated rules.
- Other targeted run: desktop Run manager, Today and schema checks passed; the only
  failing expectation was the old truncated task title, corrected to original content.
- JavaScript syntax check, result-schema JSON parsing, changed skill reference links,
  and `git diff --check` passed.

No live model evaluation of the changed skill or installed-app acceptance was run.
The state-machine fixtures exercise real coordinator mutations and persistence
normalization, with an Agent test double rather than a live external service.

## Skill maintenance handoff

post_maintenance_handoff:
  recommended_next_step: verify_with_skill_first
  reason: Host stop semantics and prompt composition changed; isolated Agent evaluation complements deterministic regressions.
  formal_source_path: entry/skills/using-arckit
  working_copy_path: entry/skills/using-arckit
  maintenance_source_path: entry/skills/using-arckit
  validation_required: true
  governance_required: false
  arcforge_action_hint: none
  user_confirmation_required: false

Optional isolated scenario: in a temporary fixture repo, advance one Gap, discover
an unresolved finding, receive a user stop instruction, and report stop without
claiming Case completion. Separately resume with the same trusted Case binding and
continue from fresh state. Only fixture files may be written; no remote task or
installed skill writes. Observe single-Gap boundaries and honest responsibility.

## Completion review and repair

First review found duplicated required-write interpretation in Automation outside
executionOutcome. The finding was accepted as RF-20260911-004-001, then repaired
in its own Gap after a trusted post-commit snapshot. Live and detached consumers
now use the shared disposition; the obsolete ledgerFailureReason helper was
removed. Fault reasons and their declared responsibility are retained, and Today
only projects human/operator responsibility. A real coordinator regression proves
that a complete result receipt succeeds even when the activity tail is empty.
The repair regression set passed 72 tests with no failures.

The subsequent review checks implementation correctness, original stop/restart
behavior, evidence limits, regression risk and scope. Existing unrelated dirty
workspace changes are preserved. The source change is ready for distribution;
GUI and live-model evaluation remain explicitly unclaimed validation channels,
not fabricated human decisions or a requirement to mark the original todo done.
