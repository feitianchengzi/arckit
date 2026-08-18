# Implement ArcOrbit multi-product development platform

Case: CASE-20260817-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-17T20:10:30.815Z

## User Intent

Evolve ArcOrbit into the approved multi-product software-development platform while preserving the implemented core semantics of ArcOrbit, Workshop Todo, and Workshop Feedback.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260817-005",
  "title": "Implement ArcOrbit multi-product development platform",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-17T18:52:21.827Z",
  "updated_at": "2026-08-17T20:10:30.815Z",
  "user_intent": "Evolve ArcOrbit into the approved multi-product software-development platform while preserving the implemented core semantics of ArcOrbit, Workshop Todo, and Workshop Feedback.",
  "expected_outcome": "ArcOrbit provides a production-quality platform surface that integrates organization, product, member, todo, execution, and feedback capabilities with evidence-backed compatibility to the existing services and Runtime core.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The approved direction is a local-project-anchored, multi-product ArcOrbit platform that expands into organization, product, member, todo, execution, and feedback workflows without changing the existing ArcOrbit, Workshop Todo, or Workshop Feedback product cores.",
      "basis": "The user approved the platform direction, required state-driven implementation, and explicitly constrained every feature to the existing implementation details before platform expansion.",
      "evidence": [
        "arckit/pending/prototypes/arcorbit-platform-next/README.md",
        "arckit/pending/items/2026-07-14-ai-native-desktop-platform-prototype.md",
        "arckit/pending/items/2026-07-14-ai-native-software-product-development-platform-blueprint.md",
        "runtime/arcorbit/README.md"
      ]
    },
    {
      "id": "FACT-PLATFORM-COMPOSITION-BASELINE",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Product Workspace is a Desktop-owned composition that maps an existing Workshop Project to a local repository and local execution state; a multi-product workset is local display and coordination state, not a new server Team or Product entity and not a product switch.",
      "basis": "Workshop Todo owns Organization, Project, membership, invitation, task, attachment, and feedback entities, while ArcOrbit already owns local project bindings, participation, execution, intervention, and recovery state.",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "../../hoewo/workshop-todo/internal/model",
        "../../hoewo/workshop-todo/internal/handler"
      ]
    },
    {
      "id": "FACT-ARCORBIT-PROTECTED-CORE",
      "revision": 1,
      "status": "accepted",
      "statement": "The platform expansion must preserve ArcOrbit's one-global-active-execution coordinator, current-user assigned pending-task automation boundary, explicit binding plus participation gates, deterministic queue, one persistent Codex thread per automated todo, trusted Case transitions, and separately queued acceptance-feedback lane.",
      "basis": "These behaviors are implemented and exercised by the current coordinator, task adapter, run manager, persistent store, and automated test suite; they are product core rather than prototype choices.",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test"
      ]
    },
    {
      "id": "FACT-SERVICE-CONTRACT-GAPS",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop Todo currently provides organization/project/member/invitation and seven-state task behavior plus V1 feedback, while Feedback V2 is only evidenced as a client contract in the provided repositories; atomic task claim via If-Match, server-side add-member authorization, task history, and installed-dependency web build evidence are not currently proven end to end.",
      "basis": "Direct route, handler, model, web client, Feedback SDK, and validation inspection found these exact implementation boundaries and mismatches.",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "../../hoewo/workshop-todo/internal/handler",
        "../../hoewo/workshop-todo/internal/model",
        "../../hoewo/workshop-todo-website/src",
        "../../hoewo/Workshop-Feedbacks/packages"
      ]
    },
    {
      "id": "FACT-PLATFORM-ARCHITECTURE",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit implements the platform as a main-process Platform Coordinator over a restricted Workshop Platform Adapter and Desktop Store v10: remote Organization, Project, membership, Task and ordinary Feedback remain Workshop-owned; local worksets and Product Workspace preferences are ArcOrbit-owned; existing Automation Coordinator and Runtime execution semantics remain isolated and unchanged.",
      "basis": "The technical solution assigns data ownership, component responsibilities, IPC commands, store migration, permission gates, V1/V2 capability behavior, consistency, cache lifetime, recovery states, and regression seams to the verified source contracts.",
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs"
      ]
    },
    {
      "id": "FACT-PLATFORM-FOUNDATION-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit production code now persists simultaneous multi-product worksets independently of Automation participation, reads Workshop organizations, organization/project members, complete project tasks and Feedback V1 through a bounded main-process adapter, composes project-scoped partial-success snapshots, and exposes only typed platform state commands through preload IPC.",
      "basis": "Store migration, adapter, coordinator, static IPC, isolation, partial-failure, focused, and complete regression tests exercise the implemented boundaries.",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
      ]
    },
    {
      "id": "FACT-PLATFORM-SHELL-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "The production ArcOrbit Desktop now provides one six-surface platform shell whose local Workset can simultaneously present multiple Workshop products; Today coordinates cross-product work and attention, Products edits display membership without changing Automation participation, Team projects real organization/project memberships, Work projects complete seven-state team tasks, Feedback separates Workshop V1 from ArcOrbit acceptance feedback, and Automation retains its existing single-execution, Workbench, intervention, recovery, Setup, and authentication behavior.",
      "basis": "The formal interaction projection maps each implemented state to existing service and Runtime facts, renderer structural checks protect Workset isolation and the preserved Automation paths, and the complete ArcOrbit suite passes.",
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
      ]
    },
    {
      "id": "FACT-PLATFORM-MANAGEMENT-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "The production ArcOrbit platform now provides bounded, permission-aware Workshop Organization, Project, membership, Task, TaskAttachment, project Tag, and Feedback V1 management from the simultaneous multi-product shell; it preserves server ownership and ArcOrbit Automation isolation, explicitly excludes the unprotected direct project-member add endpoint, and reports non-atomic Feedback V1-to-Task partial success with the created task id.",
      "basis": "Direct Workshop handler inspection determined exact request fields and permission boundaries, the main-process Adapter and Coordinator implement a fixed allowlist, Renderer actions reflect owner/admin/member and task/attachment rules, and contract plus full regression tests pass.",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-PLATFORM-INTERACTION-REALIZATION",
      "fact_id": "FACT-PLATFORM-COMPOSITION-BASELINE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted multi-product journeys, source identity, Workset isolation, partial failure, empty state, dual feedback and Automation recovery handoff are now recoverable in formal interaction artifacts and production renderer code.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/interaction/platform-workspace/collaboration-views.html",
        "arckit/interaction/platform-workspace/states.html",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-PLATFORM-TECHNICAL-BOUNDARY",
      "fact_id": "FACT-SERVICE-CONTRACT-GAPS",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The architecture assigns every discovered service mismatch to explicit adapter capability, fallback, weak-consistency, restricted-action, or recovery behavior.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "IMPACT-PLATFORM-IMPLEMENTATION",
      "fact_id": "FACT-ARCORBIT-PROTECTED-CORE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The platform composition, six user-visible surfaces and protected ArcOrbit execution core are implemented and covered by focused structural and complete regression tests.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
      ]
    },
    {
      "id": "IMPACT-PLATFORM-MANAGEMENT-REALIZATION",
      "fact_id": "FACT-PLATFORM-MANAGEMENT-REALIZED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The management capabilities required by the accepted platform specification are realized through bounded source contracts, permission-aware interactions, and repeatable tests.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-BASELINE",
      "status": "resolved",
      "goal": "Establish an implementation-grade, feature-by-feature capability and contract baseline for ArcOrbit, Workshop Todo, and Workshop Feedback that distinguishes implemented behavior, reusable integration, missing platform work, and protected product-core boundaries.",
      "reason": "The user identified prototype details that do not match actual implementations; downstream architecture and coding scope would change depending on the verified service, UI, permission, state, and Runtime contracts.",
      "derived_from": [
        "FACT-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable feature-by-feature baseline with direct source/API/model evidence for all three products",
        "Explicit protected-core invariants and platform-extension seams",
        "Verified repository and runtime validation entrypoints for downstream implementation"
      ],
      "resolution": {
        "id": "GAP-BASELINE",
        "status": "resolved",
        "outcome": "An implementation-grade platform capability baseline now distinguishes protected ArcOrbit execution semantics, actual Workshop organization/project/member/todo behavior, ordinary feedback contracts, local composition state, and unimplemented integration assumptions.",
        "reason": "The formal specification is backed by direct model, route, handler, UI, SDK, Runtime, test, and validation evidence from all repositories in scope.",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "../../hoewo/workshop-todo/internal/handler",
          "../../hoewo/workshop-todo-website/src",
          "../../hoewo/Workshop-Feedbacks/packages"
        ],
        "occurred_at": "2026-08-17T19:10:36.210Z"
      }
    },
    {
      "id": "GAP-PLATFORM-ARCHITECTURE",
      "status": "resolved",
      "goal": "Define an implementation-ready ArcOrbit platform architecture and bounded Desktop contracts that compose organization, project, member, todo, execution, and ordinary feedback capabilities without changing the protected Runtime or service cores.",
      "reason": "The research baseline is stable, but production coding still needs an explicit Product Workspace/workset model, adapter and IPC boundaries, V1/V2 capability gating, mutation safety rules, migration behavior, and test seams.",
      "derived_from": [
        "FACT-PLATFORM-COMPOSITION-BASELINE",
        "FACT-ARCORBIT-PROTECTED-CORE",
        "FACT-SERVICE-CONTRACT-GAPS"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable technical solution mapping remote source entities to local Product Workspace and multi-product workset state",
        "Explicit adapter, IPC, migration, mutation, permission, V1/V2 gating, and failure/recovery contracts",
        "Implementation slices and regression seams that preserve one global execution coordinator and persistent-thread semantics"
      ],
      "resolution": {
        "id": "GAP-PLATFORM-ARCHITECTURE",
        "status": "resolved",
        "outcome": "The platform composition architecture now defines Product Workspace and workset ownership, Store v10 migration, Workshop Platform Adapter and Coordinator responsibilities, restricted IPC, permission gates, feedback capability gating, consistency, failure recovery, and regression boundaries.",
        "reason": "The formal solution maps every accepted product capability and discovered service mismatch to a bounded production component without changing the Runtime Kernel or remote source-of-truth entities.",
        "evidence": [
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/INDEX.md",
          "arckit/tech/_map/RELATIONS.md",
          "arckit/tech/_map/feature-matrix.md"
        ],
        "occurred_at": "2026-08-17T19:15:42.949Z"
      }
    },
    {
      "id": "GAP-PLATFORM-FOUNDATION",
      "status": "resolved",
      "goal": "Implement and verify the ArcOrbit platform foundation: Store v10 worksets and Product Workspace preferences, Workshop platform domain reads, Platform Coordinator snapshot composition, restricted IPC, and compatibility with the existing Automation Coordinator.",
      "reason": "The architecture is accepted and the first bounded production slice can establish real multi-product state and service composition before replacing the renderer journeys.",
      "derived_from": [
        "FACT-PLATFORM-ARCHITECTURE"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Store v9-to-v10 migration and workset tests, including proof that workset selection does not mutate Automation participation",
        "Workshop platform adapter and Platform Coordinator tests for organization/project/member/full-task/V1-feedback reads, partial failure, and source identity",
        "Restricted preload/main IPC with input validation and no credential exposure",
        "Existing ArcOrbit automation and persistent-thread test suites remain compatible"
      ],
      "resolution": {
        "id": "GAP-PLATFORM-FOUNDATION",
        "status": "resolved",
        "outcome": "ArcOrbit now has a production Store v10 platform state, persistent multi-product worksets, Organization/Project/member/full-task/Feedback V1 adapter reads, Platform Coordinator composition, partial failure projection, and restricted credential-free IPC while retaining the existing Automation execution plane.",
        "reason": "Focused tests prove source normalization and workset isolation, and the complete ArcOrbit check passes all 201 active tests with one explicit layout skip.",
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/task-source-adapter.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
        ],
        "occurred_at": "2026-08-17T19:26:30.029Z"
      }
    },
    {
      "id": "GAP-PLATFORM-SHELL",
      "status": "resolved",
      "goal": "Implement and verify the production ArcOrbit platform shell across Today, Products, Team, Work, Automation, and Feedback, using persistent multi-product worksets while preserving the complete existing Workbench, intervention, recovery, Setup Readiness, and authentication journeys.",
      "reason": "The foundation now supplies real platform snapshots and state commands; the remaining user-visible gap is to replace product switching and the Automation-only surface with simultaneous multi-product workflows without regressing existing execution controls.",
      "derived_from": [
        "FACT-PLATFORM-FOUNDATION-REALIZED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable interaction facts for workset selection, six platform surfaces, cross-product source identity, dual feedback lanes, and recovery",
        "Production renderer consumes Platform Snapshot and supports empty, single-product, multi-product, partial-error, logged-out, attention, recovery, and active-execution states",
        "Existing Automation, Workbench, Setup Readiness, authentication, intervention and recovery actions remain available and regression-tested",
        "Full ArcOrbit check and renderer structural tests pass"
      ],
      "resolution": {
        "id": "GAP-PLATFORM-SHELL",
        "status": "resolved",
        "outcome": "ArcOrbit now opens as a simultaneous multi-product platform with Today, Products, Team, Work, Automation, and Feedback; persistent Worksets control presentation only, Workshop organization/member/full-task/Feedback V1 facts remain authoritative, and the existing Automation, Workbench, intervention, recovery, Setup Readiness, and authentication journeys remain available.",
        "reason": "Durable interaction projections and production renderer tests prove the six-surface shell, Workset/participation isolation, source identity, dual feedback lanes, protected execution core, and complete regression compatibility.",
        "evidence": [
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/interaction/platform-workspace/collaboration-views.html",
          "arckit/interaction/platform-workspace/states.html",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/sidebar-layout.html",
          "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
        ],
        "occurred_at": "2026-08-17T19:44:22.875Z"
      }
    },
    {
      "id": "CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
      "status": "resolved",
      "goal": "Resolve review finding: The production platform shell reads real projects, organizations, members, complete tasks, and Feedback V1, but it does not yet provide the safe management capabilities required by the accepted product specification: authorized project and organization management, supported member-role/invitation actions while keeping unsafe direct project-member addition disabled, complete task create/edit/tree/assignee/priority/tag/attachment/delete workflows, and supported Feedback V1 detail/update/association actions.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:390",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:402",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:412",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:434"
      ],
      "resolution": {
        "id": "CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
        "status": "resolved",
        "outcome": "ArcOrbit now supports authorized Organization and Project management and invitations, service-backed member role/duty/removal/exit operations, complete Task create/edit/parent/assignee/priority/tag/attachment/delete workflows, and Feedback V1 create/edit/delete/to-task association from the multi-product Desktop while omitting unsafe direct project-member addition.",
        "reason": "The implementation uses existing Workshop routes and exact fields through a fixed main-process command allowlist, narrows Renderer actions to handler permission rules, refreshes authoritative snapshots after mutations, makes V1 conversion partial success explicit, and passes focused and full regression validation.",
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
        ],
        "occurred_at": "2026-08-17T20:07:53.211Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-17T18:52:21.827Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 5,
    "dimensions": {
      "implementation_correctness": "clean",
      "problem_resolution": "clean",
      "verification_credibility": "clean",
      "regression_risk": "clean",
      "minimality": "clean"
    },
    "findings": [],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-PLATFORM-MANAGEMENT-CAPABILITIES"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
        ],
        "occurred_at": "2026-08-17T19:46:02.569Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 5,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
        ],
        "occurred_at": "2026-08-17T20:10:30.815Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
      "arckit/interaction/platform-workspace/interaction.md",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)",
      "arckit/tech/arcorbit/platform-composition-solution.md",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
      "runtime/arcorbit/test/platform-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
    ],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Inspect actual ArcOrbit Runtime/Desktop, Workshop Todo service/web, and Workshop Feedback console/SDK behavior, then make the stable product boundary recoverable.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The implementation baseline is the only ready Case Gap and is blocking every architecture or coding decision for the requested platform expansion.",
        "snapshot_token": "857e37d3973e395e3a2a3611037c7f48e5afd7d6e5cf030b1bfac73d5e324887",
        "selected_ref": "case-gap:CASE-20260817-005:GAP-BASELINE",
        "comparison_summary": "Selected GAP-BASELINE over four unrelated Project gaps that each require a separate Case.",
        "fresh_discovery_summary": "Source inspection exposed contract mismatches and one bounded next Gap for an implementation-ready platform architecture; that downstream Gap is recorded but not executed in this Round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "This cross-scenario protocol evaluation requires its own Case and does not establish the ArcOrbit product baseline."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This generic Runtime resilience obligation requires its own Case; the current Case protects the existing Runtime core while expanding the Desktop product surface."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This repository-wide validation obligation requires a separate permission-bearing project and does not replace feature-by-feature product research."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "This ledger audit obligation requires its own Case and is unrelated to the platform capability baseline."
          },
          {
            "ref": "case-gap:CASE-20260817-005:GAP-BASELINE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Every downstream platform decision depends on verified ArcOrbit, Workshop Todo, and Workshop Feedback contracts."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-BASELINE",
        "responsibility": "agent",
        "goal": "Establish an implementation-grade, feature-by-feature capability and contract baseline for ArcOrbit, Workshop Todo, and Workshop Feedback that distinguishes implemented behavior, reusable integration, missing platform work, and protected product-core boundaries.",
        "reason": "The user identified prototype details that do not match actual implementations; downstream architecture and coding scope would change depending on the verified service, UI, permission, state, and Runtime contracts.",
        "derived_from": [
          "FACT-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "Durable feature-by-feature baseline with direct source/API/model evidence for all three products",
          "Explicit protected-core invariants and platform-extension seams",
          "Verified repository and runtime validation entrypoints for downstream implementation"
        ]
      },
      "planned_transition": {
        "goal": "Inspect actual ArcOrbit Runtime/Desktop, Workshop Todo service/web, and Workshop Feedback console/SDK behavior, then make the stable product boundary recoverable.",
        "expected_state_change": "Resolve the research Gap with accepted source-backed facts, update the relevant product-definition decisions, and expose one implementation-architecture Gap without executing it."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-BASELINE",
          "status": "resolved",
          "outcome": "An implementation-grade platform capability baseline now distinguishes protected ArcOrbit execution semantics, actual Workshop organization/project/member/todo behavior, ordinary feedback contracts, local composition state, and unimplemented integration assumptions.",
          "reason": "The formal specification is backed by direct model, route, handler, UI, SDK, Runtime, test, and validation evidence from all repositories in scope.",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "../../hoewo/workshop-todo/internal/handler",
            "../../hoewo/workshop-todo-website/src",
            "../../hoewo/Workshop-Feedbacks/packages"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PLATFORM-COMPOSITION-BASELINE",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Product Workspace is a Desktop-owned composition that maps an existing Workshop Project to a local repository and local execution state; a multi-product workset is local display and coordination state, not a new server Team or Product entity and not a product switch.",
            "basis": "Workshop Todo owns Organization, Project, membership, invitation, task, attachment, and feedback entities, while ArcOrbit already owns local project bindings, participation, execution, intervention, and recovery state.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "../../hoewo/workshop-todo/internal/model",
              "../../hoewo/workshop-todo/internal/handler"
            ]
          },
          {
            "id": "FACT-ARCORBIT-PROTECTED-CORE",
            "revision": 1,
            "status": "accepted",
            "statement": "The platform expansion must preserve ArcOrbit's one-global-active-execution coordinator, current-user assigned pending-task automation boundary, explicit binding plus participation gates, deterministic queue, one persistent Codex thread per automated todo, trusted Case transitions, and separately queued acceptance-feedback lane.",
            "basis": "These behaviors are implemented and exercised by the current coordinator, task adapter, run manager, persistent store, and automated test suite; they are product core rather than prototype choices.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test"
            ]
          },
          {
            "id": "FACT-SERVICE-CONTRACT-GAPS",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop Todo currently provides organization/project/member/invitation and seven-state task behavior plus V1 feedback, while Feedback V2 is only evidenced as a client contract in the provided repositories; atomic task claim via If-Match, server-side add-member authorization, task history, and installed-dependency web build evidence are not currently proven end to end.",
            "basis": "Direct route, handler, model, web client, Feedback SDK, and validation inspection found these exact implementation boundaries and mismatches.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "../../hoewo/workshop-todo/internal/handler",
              "../../hoewo/workshop-todo/internal/model",
              "../../hoewo/workshop-todo-website/src",
              "../../hoewo/Workshop-Feedbacks/packages"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-PLATFORM-INTERACTION-REALIZATION",
            "fact_id": "FACT-PLATFORM-COMPOSITION-BASELINE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The approved multi-product coordination model is specified and prototyped but is not yet implemented in the production Desktop renderer and state model.",
            "gap_ids": [
              "GAP-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "arckit/pending/prototypes/arcorbit-platform-next/README.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-TECHNICAL-BOUNDARY",
            "fact_id": "FACT-SERVICE-CONTRACT-GAPS",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Platform adapters and mutation policy cannot be implemented safely until the discovered service/client mismatches are assigned explicit boundaries and fallbacks.",
            "gap_ids": [
              "GAP-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "../../hoewo/workshop-todo/internal/handler"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-IMPLEMENTATION",
            "fact_id": "FACT-ARCORBIT-PROTECTED-CORE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The existing execution core is realized, but the accepted platform composition and integrated product journeys are not yet production code.",
            "gap_ids": [
              "GAP-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-PLATFORM-ARCHITECTURE",
            "status": "open",
            "goal": "Define an implementation-ready ArcOrbit platform architecture and bounded Desktop contracts that compose organization, project, member, todo, execution, and ordinary feedback capabilities without changing the protected Runtime or service cores.",
            "reason": "The research baseline is stable, but production coding still needs an explicit Product Workspace/workset model, adapter and IPC boundaries, V1/V2 capability gating, mutation safety rules, migration behavior, and test seams.",
            "derived_from": [
              "FACT-PLATFORM-COMPOSITION-BASELINE",
              "FACT-ARCORBIT-PROTECTED-CORE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Durable technical solution mapping remote source entities to local Product Workspace and multi-product workset state",
              "Explicit adapter, IPC, migration, mutation, permission, V1/V2 gating, and failure/recovery contracts",
              "Implementation slices and regression seams that preserve one global execution coordinator and persistent-thread semantics"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "product_intent_and_scope",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation.",
              "reason": "The user approved the multi-product platform direction while explicitly preserving the existing ArcOrbit, Workshop Todo, and Workshop Feedback cores.",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/pending/prototypes/arcorbit-platform-next/README.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit only if the server ownership boundary or protected ArcOrbit Runtime semantics change."
            },
            "gap_refs": [],
            "reason": "The product scope now includes the approved platform expansion and its explicit non-goals.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "area_ref": "product_capabilities",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery, and acceptance feedback while adding Desktop composition of Workshop organizations, projects, memberships, seven-state todos, ordinary user feedback, local Product Workspaces, and a persistent multi-product workset that supports simultaneous coordination rather than forced product switching.",
              "reason": "The capability set is grounded in existing source behavior; platform additions compose those capabilities without redefining their source-of-truth semantics.",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "runtime/arcorbit/README.md"
              ],
              "confidence": "high",
              "resume_condition": "Resolve GAP-PLATFORM-ARCHITECTURE before treating the added platform composition as implemented."
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "The approved platform domains and protected execution semantics are now explicit capabilities.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "After Setup Readiness and session restoration, users work in one ArcOrbit platform shell across Today, Products, Team, Work, Automation, and Feedback. A persistent local workset controls which products are shown together, enabling simultaneous multi-product planning and execution while preserving drill-down to one product, visible source identity, intervention/recovery, and separate ordinary-feedback versus acceptance-feedback journeys.",
              "reason": "AI-era multi-product operation is the approved interaction premise, and the source research distinguishes which journeys can be composed without inventing server behavior.",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/pending/prototypes/arcorbit-platform-next/README.md"
              ],
              "confidence": "high",
              "resume_condition": "The production interaction must be refined and verified after architecture fixes the executable state and adapter boundaries."
            },
            "gap_refs": [],
            "reason": "The main journey now expands from an automation workspace into a multi-product platform shell.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/pending/prototypes/arcorbit-platform-next/README.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository.",
              "reason": "Separating remote domain authority from local composition and Runtime state allows platform expansion without duplicating or replacing existing services.",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs"
              ],
              "confidence": "high",
              "resume_condition": "Architecture must specify schema migration and stale/offline behavior before new local state ships."
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "Product Workspace and multi-product workset ownership are new stable data decisions.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "Implement the ArcOrbit multi-product software-development platform from the verified service and Runtime baseline while preserving existing product cores."
        },
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/pending/prototypes/arcorbit-platform-next/README.md",
          "runtime/arcorbit/README.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 82,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The approved platform scope, protected cores, source authority, and explicit non-goals are now recorded as durable product facts and decisions.",
            "fact_refs": [
              "FACT-001",
              "FACT-PLATFORM-COMPOSITION-BASELINE",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The simultaneous multi-product journey is recoverable in specification and prototype but not yet executable in the production Desktop.",
            "fact_refs": [
              "FACT-PLATFORM-COMPOSITION-BASELINE"
            ],
            "evidence": [
              "arckit/pending/prototypes/arcorbit-platform-next/README.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-PLATFORM-ARCHITECTURE"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This research Round defines behavior and authority boundaries and does not change the production visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "Source authority is explainable, but the platform adapter, IPC, migration, and contract-mismatch decisions remain to be formalized.",
            "fact_refs": [
              "FACT-ARCORBIT-PROTECTED-CORE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": [
              "GAP-PLATFORM-ARCHITECTURE"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Existing product-core facts are realized, but the newly accepted local composition and multi-product platform behaviors are not yet production code.",
            "fact_refs": [
              "FACT-PLATFORM-COMPOSITION-BASELINE",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": [
              "GAP-PLATFORM-ARCHITECTURE"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The Round records direct evidence for permission, concurrency, missing API, V1/V2, and validation-environment risks instead of treating prototype assumptions as implemented behavior.",
            "fact_refs": [
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/test",
              "../../hoewo/workshop-todo/internal/handler"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/feature-matrix.md",
        "arckit/spec/_map/RELATIONS.md",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "../../hoewo/workshop-todo/internal/handler",
        "../../hoewo/workshop-todo/internal/model",
        "../../hoewo/workshop-todo-website/src",
        "../../hoewo/Workshop-Feedbacks/packages"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T19:10:36.210Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Define the product composition layer, local state schema, Workshop platform adapter, coordinator, restricted IPC, mutation consistency, capability gates, migration, and verification boundaries.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The platform architecture is the only ready Case Gap and is required before changing the production store, service adapter, IPC, or renderer.",
        "snapshot_token": "0e881d7573f5923a35091ccd05fe77c8b12b4aaea48b1331770226ab17e26ce9",
        "selected_ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-ARCHITECTURE",
        "comparison_summary": "Selected the ready platform architecture Gap over four unrelated Project gaps that each require a separate Case.",
        "fresh_discovery_summary": "The accepted architecture exposes one bounded production foundation Gap for Store v10, worksets, Workshop platform reads, coordinator composition, restricted IPC, and focused tests; renderer replacement remains downstream.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It requires a separate protocol-evaluation Case and does not define this product architecture."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It is a generic Runtime obligation; this architecture explicitly preserves rather than reworks the Runtime Kernel."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It requires a separate real permission-bearing project and does not replace bounded platform security design."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "It requires a separate ledger-audit Case and is unrelated to the Desktop composition boundary."
          },
          {
            "ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-ARCHITECTURE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It converts the accepted capability baseline into implementation-safe component, state, contract, migration, and recovery decisions."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PLATFORM-ARCHITECTURE",
        "responsibility": "agent",
        "goal": "Define an implementation-ready ArcOrbit platform architecture and bounded Desktop contracts that compose organization, project, member, todo, execution, and ordinary feedback capabilities without changing the protected Runtime or service cores.",
        "reason": "The research baseline is stable, but production coding still needs an explicit Product Workspace/workset model, adapter and IPC boundaries, V1/V2 capability gating, mutation safety rules, migration behavior, and test seams.",
        "derived_from": [
          "FACT-PLATFORM-COMPOSITION-BASELINE",
          "FACT-ARCORBIT-PROTECTED-CORE",
          "FACT-SERVICE-CONTRACT-GAPS"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable technical solution mapping remote source entities to local Product Workspace and multi-product workset state",
          "Explicit adapter, IPC, migration, mutation, permission, V1/V2 gating, and failure/recovery contracts",
          "Implementation slices and regression seams that preserve one global execution coordinator and persistent-thread semantics"
        ]
      },
      "planned_transition": {
        "goal": "Define the product composition layer, local state schema, Workshop platform adapter, coordinator, restricted IPC, mutation consistency, capability gates, migration, and verification boundaries.",
        "expected_state_change": "Resolve the architecture Gap with one accepted technical fact, clear the technical-boundary impact, and expose one production foundation implementation Gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PLATFORM-ARCHITECTURE",
          "status": "resolved",
          "outcome": "The platform composition architecture now defines Product Workspace and workset ownership, Store v10 migration, Workshop Platform Adapter and Coordinator responsibilities, restricted IPC, permission gates, feedback capability gating, consistency, failure recovery, and regression boundaries.",
          "reason": "The formal solution maps every accepted product capability and discovered service mismatch to a bounded production component without changing the Runtime Kernel or remote source-of-truth entities.",
          "evidence": [
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/tech/INDEX.md",
            "arckit/tech/_map/RELATIONS.md",
            "arckit/tech/_map/feature-matrix.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PLATFORM-ARCHITECTURE",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit implements the platform as a main-process Platform Coordinator over a restricted Workshop Platform Adapter and Desktop Store v10: remote Organization, Project, membership, Task and ordinary Feedback remain Workshop-owned; local worksets and Product Workspace preferences are ArcOrbit-owned; existing Automation Coordinator and Runtime execution semantics remain isolated and unchanged.",
            "basis": "The technical solution assigns data ownership, component responsibilities, IPC commands, store migration, permission gates, V1/V2 capability behavior, consistency, cache lifetime, recovery states, and regression seams to the verified source contracts.",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PLATFORM-INTERACTION-REALIZATION",
            "fact_id": "FACT-PLATFORM-COMPOSITION-BASELINE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The simultaneous multi-product journey now has an executable state and component contract but is not yet implemented in the production Desktop.",
            "gap_ids": [
              "GAP-PLATFORM-FOUNDATION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-TECHNICAL-BOUNDARY",
            "fact_id": "FACT-SERVICE-CONTRACT-GAPS",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The architecture assigns every discovered service mismatch to explicit adapter capability, fallback, weak-consistency, restricted-action, or recovery behavior.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-IMPLEMENTATION",
            "fact_id": "FACT-ARCORBIT-PROTECTED-CORE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The protected execution core remains realized, but Store v10, worksets, platform domain reads, IPC, and platform shell are not yet production code.",
            "gap_ids": [
              "GAP-PLATFORM-FOUNDATION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-PLATFORM-FOUNDATION",
            "status": "open",
            "goal": "Implement and verify the ArcOrbit platform foundation: Store v10 worksets and Product Workspace preferences, Workshop platform domain reads, Platform Coordinator snapshot composition, restricted IPC, and compatibility with the existing Automation Coordinator.",
            "reason": "The architecture is accepted and the first bounded production slice can establish real multi-product state and service composition before replacing the renderer journeys.",
            "derived_from": [
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Store v9-to-v10 migration and workset tests, including proof that workset selection does not mutate Automation participation",
              "Workshop platform adapter and Platform Coordinator tests for organization/project/member/full-task/V1-feedback reads, partial failure, and source identity",
              "Restricted preload/main IPC with input validation and no credential exposure",
              "Existing ArcOrbit automation and persistent-thread test suites remain compatible"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "runtime_surfaces",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "The software comprises repository-owned Arckit skills and Node.js ledger CLIs plus ArcOrbit, an Electron platform Desktop with Setup Readiness, skill provisioning, a main-process Platform Coordinator, restricted Workshop Platform Adapter, Automation Coordinator, Runtime supervisor, Codex adapter, and packaged trusted capability resources. Workshop web clients remain available administration and source surfaces but are not required for ArcOrbit daily work.",
              "reason": "The accepted composition architecture adds a bounded platform plane around the existing execution plane without moving service or Runtime responsibilities into Renderer.",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if a new server, mobile, or externally hosted ArcOrbit surface becomes authoritative."
            },
            "gap_refs": [],
            "reason": "Platform Coordinator and Workshop Platform Adapter are now explicit ArcOrbit runtime surfaces.",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback V1 domains. Feedback V2 remains disabled until a separately trusted adapter proves capability; missing conditional update, member authorization and task-history service contracts are surfaced as weak consistency or unavailable actions rather than invented behavior.",
              "reason": "The platform architecture separates execution-safe task access from broader product-domain access and assigns every unproven server capability an explicit fail-closed behavior.",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Workshop adds verified conditional update, member authorization, task history, or Feedback V2 server contracts."
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The Workshop platform-domain adapter and capability-gating boundary are stable integration decisions.",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 15,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2, persistent one-thread-per-todo model and trusted capabilities remain unchanged. The platform composition layer adds Desktop Store v10 local worksets and workspace preferences, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC; remote Workshop records are not duplicated as local authority, and Renderer never receives credentials or generic request access.",
              "reason": "This foundation extends the Desktop product surface through isolated composition components while preserving the protocol, Runtime, source-of-truth, credential, and execution boundaries.",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if implementation evidence requires changing protected Runtime or remote authority boundaries."
            },
            "gap_refs": [],
            "reason": "The accepted platform composition components and Store v10 boundary are now part of the technical foundation.",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 83,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The architecture preserves every accepted platform capability, source authority, protected core and non-goal.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Workset and platform shell behavior now have executable contracts but remain absent from the production renderer.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": [
              "GAP-PLATFORM-FOUNDATION"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The platform foundation architecture does not change accepted visual tokens or component styling.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Component ownership, data authority, IPC, consistency, capability gates, migration and recovery behavior are explicit and source-backed.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The architecture is accepted but the Store v10, adapter, coordinator and IPC production slice is not yet realized.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": [
              "GAP-PLATFORM-FOUNDATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Permission, weak consistency, non-atomic V1 conversion, unavailable V2, cache staleness, credential isolation, migration and regression risks each have explicit treatment and verification boundaries.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/INDEX.md",
        "arckit/tech/_map/RELATIONS.md",
        "arckit/tech/_map/feature-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T19:15:42.949Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement Store v10, multi-product worksets, Workshop platform domain normalization, partial-success snapshot composition, bounded IPC, and compatibility tests.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The platform foundation is the only ready Case Gap and is the bounded prerequisite for rendering real multi-product journeys.",
        "snapshot_token": "2c1f687adeb958754c89961581b1acdee39ae4626a1effba903f837b9331721d",
        "selected_ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-FOUNDATION",
        "comparison_summary": "Selected the ready production foundation Gap over four unrelated Project gaps that each require a separate Case.",
        "fresh_discovery_summary": "Implementation and regression evidence expose one next Gap: replace the production renderer with the multi-product platform shell while preserving existing Automation, Workbench, intervention, and recovery behaviors.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It requires a separate protocol-evaluation Case and is unrelated to this product foundation."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It requires a separate Runtime Case; the foundation preserves the existing Runtime core and passes its regression suite."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It requires a separate real-project Case; this foundation provides bounded credential-free IPC and test evidence."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "It requires a separate ledger-audit Case and does not advance the Desktop implementation."
          },
          {
            "ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-FOUNDATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It realizes the accepted platform state and service composition boundaries and directly enables the renderer Gap."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PLATFORM-FOUNDATION",
        "responsibility": "agent",
        "goal": "Implement and verify the ArcOrbit platform foundation: Store v10 worksets and Product Workspace preferences, Workshop platform domain reads, Platform Coordinator snapshot composition, restricted IPC, and compatibility with the existing Automation Coordinator.",
        "reason": "The architecture is accepted and the first bounded production slice can establish real multi-product state and service composition before replacing the renderer journeys.",
        "derived_from": [
          "FACT-PLATFORM-ARCHITECTURE"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Store v9-to-v10 migration and workset tests, including proof that workset selection does not mutate Automation participation",
          "Workshop platform adapter and Platform Coordinator tests for organization/project/member/full-task/V1-feedback reads, partial failure, and source identity",
          "Restricted preload/main IPC with input validation and no credential exposure",
          "Existing ArcOrbit automation and persistent-thread test suites remain compatible"
        ]
      },
      "planned_transition": {
        "goal": "Implement Store v10, multi-product worksets, Workshop platform domain normalization, partial-success snapshot composition, bounded IPC, and compatibility tests.",
        "expected_state_change": "Resolve the platform foundation Gap with accepted implementation evidence and expose one production shell Gap without executing it."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PLATFORM-FOUNDATION",
          "status": "resolved",
          "outcome": "ArcOrbit now has a production Store v10 platform state, persistent multi-product worksets, Organization/Project/member/full-task/Feedback V1 adapter reads, Platform Coordinator composition, partial failure projection, and restricted credential-free IPC while retaining the existing Automation execution plane.",
          "reason": "Focused tests prove source normalization and workset isolation, and the complete ArcOrbit check passes all 201 active tests with one explicit layout skip.",
          "evidence": [
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/task-source-adapter.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PLATFORM-FOUNDATION-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit production code now persists simultaneous multi-product worksets independently of Automation participation, reads Workshop organizations, organization/project members, complete project tasks and Feedback V1 through a bounded main-process adapter, composes project-scoped partial-success snapshots, and exposes only typed platform state commands through preload IPC.",
            "basis": "Store migration, adapter, coordinator, static IPC, isolation, partial-failure, focused, and complete regression tests exercise the implemented boundaries.",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PLATFORM-INTERACTION-REALIZATION",
            "fact_id": "FACT-PLATFORM-COMPOSITION-BASELINE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The multi-product state and data plane are production code, but the current renderer still exposes the prior Automation-centered navigation rather than the accepted platform journeys.",
            "gap_ids": [
              "GAP-PLATFORM-SHELL"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-IMPLEMENTATION",
            "fact_id": "FACT-ARCORBIT-PROTECTED-CORE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The platform foundation and protected execution core are realized, but Today, Products, Team, Work, Automation and Feedback are not yet integrated in the production renderer.",
            "gap_ids": [
              "GAP-PLATFORM-SHELL"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-PLATFORM-SHELL",
            "status": "open",
            "goal": "Implement and verify the production ArcOrbit platform shell across Today, Products, Team, Work, Automation, and Feedback, using persistent multi-product worksets while preserving the complete existing Workbench, intervention, recovery, Setup Readiness, and authentication journeys.",
            "reason": "The foundation now supplies real platform snapshots and state commands; the remaining user-visible gap is to replace product switching and the Automation-only surface with simultaneous multi-product workflows without regressing existing execution controls.",
            "derived_from": [
              "FACT-PLATFORM-FOUNDATION-REALIZED"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Durable interaction facts for workset selection, six platform surfaces, cross-product source identity, dual feedback lanes, and recovery",
              "Production renderer consumes Platform Snapshot and supports empty, single-product, multi-product, partial-error, logged-out, attention, recovery, and active-execution states",
              "Existing Automation, Workbench, Setup Readiness, authentication, intervention and recovery actions remain available and regression-tested",
              "Full ArcOrbit check and renderer structural tests pass"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 84,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implementation follows the accepted remote authority, local composition, multi-product and protected-core boundaries.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The platform state plane is available but the accepted six-surface multi-product renderer is not yet realized.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-PLATFORM-SHELL"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This foundation Round does not change renderer visual tokens or components.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Store migration, adapter scope, coordinator composition, partial errors, capabilities and IPC are implemented as the accepted architecture defines.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-PLATFORM-ARCHITECTURE"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The foundation is realized and verified, but the accepted user-visible platform shell remains missing.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-PLATFORM-COMPOSITION-BASELINE"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-PLATFORM-SHELL"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused isolation and partial-failure tests plus the complete ArcOrbit regression suite cover migration, credential boundary, source identity, Automation compatibility and the previously unstable parallel timing path.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 skip, 0 fail)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T19:26:30.029Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the production multi-product platform shell, preserve existing execution journeys, formalize its interaction states, and verify the whole ArcOrbit regression surface.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The platform shell is the only ready Case Gap and completes the user-visible multi-product product loop on top of the accepted foundation.",
        "snapshot_token": "fded806bbee2b9bca21ad90c80aad821e5ab78f80105f1155dfb6e2d6496abc1",
        "selected_ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-SHELL",
        "comparison_summary": "Selected the ready ArcOrbit platform shell Gap over four unrelated Project gaps that require separate Cases.",
        "fresh_discovery_summary": "Implementation, interaction projection, static boundary checks, and the full regression suite expose no additional ordinary Gap; implementation-focused Completion Review remains.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "It requires a separate protocol-evaluation Case and does not advance this product implementation."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It requires a separate Runtime Case; this round preserves and regression-tests the existing Runtime core."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "It requires a separate real-project permission Case; this renderer consumes credential-free typed snapshots."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "It requires a separate ledger-audit Case and is outside the platform shell result."
          },
          {
            "ref": "case-gap:CASE-20260817-005:GAP-PLATFORM-SHELL",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the remaining user-visible obligation and directly realizes the accepted simultaneous multi-product journeys."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PLATFORM-SHELL",
        "responsibility": "agent",
        "goal": "Implement and verify the production ArcOrbit platform shell across Today, Products, Team, Work, Automation, and Feedback, using persistent multi-product worksets while preserving the complete existing Workbench, intervention, recovery, Setup Readiness, and authentication journeys.",
        "reason": "The foundation now supplies real platform snapshots and state commands; the remaining user-visible gap is to replace product switching and the Automation-only surface with simultaneous multi-product workflows without regressing existing execution controls.",
        "derived_from": [
          "FACT-PLATFORM-FOUNDATION-REALIZED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable interaction facts for workset selection, six platform surfaces, cross-product source identity, dual feedback lanes, and recovery",
          "Production renderer consumes Platform Snapshot and supports empty, single-product, multi-product, partial-error, logged-out, attention, recovery, and active-execution states",
          "Existing Automation, Workbench, Setup Readiness, authentication, intervention and recovery actions remain available and regression-tested",
          "Full ArcOrbit check and renderer structural tests pass"
        ]
      },
      "planned_transition": {
        "goal": "Realize the production multi-product platform shell, preserve existing execution journeys, formalize its interaction states, and verify the whole ArcOrbit regression surface.",
        "expected_state_change": "Resolve the final ordinary Case Gap, reconcile both threatened implementation impacts, and leave only Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PLATFORM-SHELL",
          "status": "resolved",
          "outcome": "ArcOrbit now opens as a simultaneous multi-product platform with Today, Products, Team, Work, Automation, and Feedback; persistent Worksets control presentation only, Workshop organization/member/full-task/Feedback V1 facts remain authoritative, and the existing Automation, Workbench, intervention, recovery, Setup Readiness, and authentication journeys remain available.",
          "reason": "Durable interaction projections and production renderer tests prove the six-surface shell, Workset/participation isolation, source identity, dual feedback lanes, protected execution core, and complete regression compatibility.",
          "evidence": [
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "arckit/interaction/platform-workspace/collaboration-views.html",
            "arckit/interaction/platform-workspace/states.html",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/sidebar-layout.html",
            "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PLATFORM-SHELL-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "The production ArcOrbit Desktop now provides one six-surface platform shell whose local Workset can simultaneously present multiple Workshop products; Today coordinates cross-product work and attention, Products edits display membership without changing Automation participation, Team projects real organization/project memberships, Work projects complete seven-state team tasks, Feedback separates Workshop V1 from ArcOrbit acceptance feedback, and Automation retains its existing single-execution, Workbench, intervention, recovery, Setup, and authentication behavior.",
            "basis": "The formal interaction projection maps each implemented state to existing service and Runtime facts, renderer structural checks protect Workset isolation and the preserved Automation paths, and the complete ArcOrbit suite passes.",
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PLATFORM-INTERACTION-REALIZATION",
            "fact_id": "FACT-PLATFORM-COMPOSITION-BASELINE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted multi-product journeys, source identity, Workset isolation, partial failure, empty state, dual feedback and Automation recovery handoff are now recoverable in formal interaction artifacts and production renderer code.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "arckit/interaction/platform-workspace/states.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-PLATFORM-IMPLEMENTATION",
            "fact_id": "FACT-ARCORBIT-PROTECTED-CORE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The platform composition, six user-visible surfaces and protected ArcOrbit execution core are implemented and covered by focused structural and complete regression tests.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "After Setup Readiness and session restoration, users work in one production ArcOrbit platform shell across Today, Products, Team, Work, Automation, and Feedback. A persistent local Workset controls which Workshop products are shown together without changing Automation participation, enabling simultaneous multi-product coordination while preserving product source identity, the complete seven-state team workload, real organization/project membership, separate ordinary versus acceptance feedback, and existing intervention/recovery journeys.",
              "reason": "The approved AI-era multi-product premise is now realized against the verified Workshop and ArcOrbit implementation boundaries rather than a product-switching prototype.",
              "evidence": [
                "arckit/interaction/platform-workspace/interaction.md",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Workshop safely exposes direct member management, task history, or Feedback V2, or when a new platform surface becomes authoritative."
            },
            "gap_refs": [],
            "reason": "The stable interaction decision now points to production behavior and formal page-level recovery facts.",
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 84,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The production shell realizes the accepted platform outcome without redefining Workshop or ArcOrbit product cores.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "All six platform surfaces, Workset isolation, source identity, empty/degraded states and execution recovery handoffs have stable interaction and production evidence.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "arckit/interaction/platform-workspace/states.html",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The platform surfaces extend the existing Desktop tokens, cards, tables, status pills, responsive shell and Workbench geometry rather than introducing a separate visual system.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/fixtures/sidebar-layout.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer reads only the typed Platform Snapshot, Workset mutations remain isolated from participation, and unproven server capabilities stay explicitly unavailable.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted platform composition and protected execution facts are now present in production data, IPC and renderer layers.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Static isolation assertions and the complete regression suite cover participation separation, source ownership, IPC boundaries and preservation of the execution core; the real-render layout check remains an explicit environment-gated regression rather than a hidden success claim.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/interaction/platform-workspace/collaboration-views.html",
        "arckit/interaction/platform-workspace/states.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/RELATIONS.md",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/desktop-sidebar-layout.test.mjs",
        "runtime/arcorbit/test/fixtures/sidebar-layout.html",
        "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T19:44:22.875Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform implementation-focused Completion Review against the accepted platform capabilities and production evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary implementation obligations are closed, so the derived implementation-focused Completion Review is the only ready Case candidate.",
        "snapshot_token": "ef303f7a2c946ccf446d90348b446786053e4893a4cc2f86dc1bd01e5295d3f4",
        "selected_ref": "case-gap:CASE-20260817-005:CASE-20260817-005:completion-review:1",
        "comparison_summary": "Selected Completion Review over four unrelated Project gaps that require separate Cases.",
        "fresh_discovery_summary": "Review against the accepted product capability specification found that the six-surface shell is real but Products, Team, Work, and ordinary Feedback stop at read-oriented coordination instead of providing the specified safe management capabilities.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Separate protocol-evaluation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate Runtime resilience Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate real-project permission Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Separate cross-record audit Case."
          },
          {
            "ref": "case-gap:CASE-20260817-005:CASE-20260817-005:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only remaining Case gate and must compare production behavior with the accepted platform capabilities."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-005:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Perform implementation-focused Completion Review against the accepted platform capabilities and production evidence.",
        "expected_state_change": "Record the missing management capability finding as an ordinary repair Gap without fixing it in this review Round."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 4,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-PLATFORM-MANAGEMENT-CAPABILITIES",
              "kind": "omission",
              "statement": "The production platform shell reads real projects, organizations, members, complete tasks, and Feedback V1, but it does not yet provide the safe management capabilities required by the accepted product specification: authorized project and organization management, supported member-role/invitation actions while keeping unsafe direct project-member addition disabled, complete task create/edit/tree/assignee/priority/tag/attachment/delete workflows, and supported Feedback V1 detail/update/association actions.",
              "responsibility": "agent",
              "artifact_refs": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/platform-workspace/interaction.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:390",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:402",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:412",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:434",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit: npm run check (202 tests, 201 pass, 1 explicit layout skip, 0 fail)"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 85,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted full management scope is recoverable in the specification and the review finding explicitly preserves it.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Implemented shell and recovery interactions remain documented; the review finding identifies the missing management depth rather than losing the intended journeys.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "No visual mutation occurs in Completion Review and the existing renderer remains consistent.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The review distinguishes supported service mutations from unsafe or unavailable contracts instead of broadening IPC generically.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Previously accepted foundation and shell facts remain realized; the review finding concerns omitted accepted management capability depth and is now carried by the generated repair Gap.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-FOUNDATION-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The review does not treat a passing regression suite as proof of omitted management behavior and retains the known unsafe member-add and environment-gated layout risks.",
            "fact_refs": [
              "FACT-SERVICE-CONTRACT-GAPS",
              "FACT-PLATFORM-SHELL-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T19:46:02.569Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the accepted management depth on the production multi-product shell and verify it against actual Workshop handler contracts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The generated management-capability repair Gap is the only ready Case obligation and directly closes the omission found by Completion Review.",
        "snapshot_token": "872e8da1d0c2f0c8d59d5645acf1bf4d9cc9588a23facde13d626d9d9021539d",
        "selected_ref": "case-gap:CASE-20260817-005:CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
        "comparison_summary": "Selected the ready platform management repair over four unrelated Project gaps that each require a separate Case.",
        "fresh_discovery_summary": "Handler-level permission reinspection, bounded adapter/IPC implementation, production renderer management journeys, interaction updates, focused contract tests, and the complete regression suite expose no further ordinary Case Gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Separate protocol-evaluation Case unrelated to the platform omission."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate Runtime resilience Case; this result preserves the execution core."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate permission-bearing real-project Case; adapter tests do not claim live authorization evidence."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Separate ledger-audit Case unrelated to the platform product result."
          },
          {
            "ref": "case-gap:CASE-20260817-005:CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "Only ready Case Gap; it closes the accepted management scope omitted by the first shell."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
        "responsibility": "agent",
        "goal": "Resolve review finding: The production platform shell reads real projects, organizations, members, complete tasks, and Feedback V1, but it does not yet provide the safe management capabilities required by the accepted product specification: authorized project and organization management, supported member-role/invitation actions while keeping unsafe direct project-member addition disabled, complete task create/edit/tree/assignee/priority/tag/attachment/delete workflows, and supported Feedback V1 detail/update/association actions.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:390",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:402",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:412",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:434"
        ]
      },
      "planned_transition": {
        "goal": "Realize the accepted management depth on the production multi-product shell and verify it against actual Workshop handler contracts.",
        "expected_state_change": "Resolve the review repair Gap, record the realized bounded management capability, close the review finding, and return the Case to Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES",
          "status": "resolved",
          "outcome": "ArcOrbit now supports authorized Organization and Project management and invitations, service-backed member role/duty/removal/exit operations, complete Task create/edit/parent/assignee/priority/tag/attachment/delete workflows, and Feedback V1 create/edit/delete/to-task association from the multi-product Desktop while omitting unsafe direct project-member addition.",
          "reason": "The implementation uses existing Workshop routes and exact fields through a fixed main-process command allowlist, narrows Renderer actions to handler permission rules, refreshes authoritative snapshots after mutations, makes V1 conversion partial success explicit, and passes focused and full regression validation.",
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PLATFORM-MANAGEMENT-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "The production ArcOrbit platform now provides bounded, permission-aware Workshop Organization, Project, membership, Task, TaskAttachment, project Tag, and Feedback V1 management from the simultaneous multi-product shell; it preserves server ownership and ArcOrbit Automation isolation, explicitly excludes the unprotected direct project-member add endpoint, and reports non-atomic Feedback V1-to-Task partial success with the created task id.",
            "basis": "Direct Workshop handler inspection determined exact request fields and permission boundaries, the main-process Adapter and Coordinator implement a fixed allowlist, Renderer actions reflect owner/admin/member and task/attachment rules, and contract plus full regression tests pass.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-PLATFORM-MANAGEMENT-REALIZATION",
            "fact_id": "FACT-PLATFORM-MANAGEMENT-REALIZED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The management capabilities required by the accepted platform specification are realized through bounded source contracts, permission-aware interactions, and repeatable tests.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "CR-PLATFORM-MANAGEMENT-CAPABILITIES",
            "resolution": "resolved",
            "reason": "All safe currently supported management operations are implemented and verified; unsafe direct add remains absent.",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs"
            ]
          }
        ],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 85,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The product baseline and production implementation agree on safe daily management while retaining explicit unavailable capabilities.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Products, Team, Work, and Feedback management journeys and permission, partial-success, unavailable, and destructive-confirmation states are recoverable.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The management modal, row actions, member lists, and task metadata reuse the established Desktop tokens and components.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Exact Workshop routes and fields, a fixed allowlist, and explicit unavailable direct-add, history, and V2 boundaries keep the implementation explainable.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED",
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Accepted management scope is present in the production adapter, Coordinator, typed IPC, Renderer, and tests without changing Automation.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED",
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Contract, Coordinator, Renderer isolation, and full-suite tests cover primary risks; real Electron layout remains explicitly environment-gated.",
            "fact_refs": [
              "FACT-PLATFORM-MANAGEMENT-REALIZED",
              "FACT-SERVICE-CONTRACT-GAPS"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/collaboration-views.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T20:07:53.211Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform a fresh implementation-focused Completion Review of the repaired ArcOrbit multi-product platform.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps, review findings, questions, handoffs, and threatened impacts are closed, making the fresh implementation-focused Completion Review the only ready Case candidate.",
        "snapshot_token": "25694c5163f3c4a1076f8eb8b3f18b99a5617d35515a21a67d1b057f32b115ee",
        "selected_ref": "case-gap:CASE-20260817-005:CASE-20260817-005:completion-review:2",
        "comparison_summary": "Selected Completion Review over four unrelated Project gaps that require separate Cases.",
        "fresh_discovery_summary": "Fresh review of accepted scope, handler permissions, bounded IPC, Renderer journeys, Automation isolation, unavailable contracts, and full regression evidence found no additional error, omission, or excess.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Separate protocol-evaluation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate Runtime resilience Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Separate live permission-bearing validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Separate cross-record audit Case."
          },
          {
            "ref": "case-gap:CASE-20260817-005:CASE-20260817-005:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Only remaining Case gate after management repair and complete regression validation."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-005:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:5"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Perform a fresh implementation-focused Completion Review of the repaired ArcOrbit multi-product platform.",
        "expected_state_change": "Record a clean five-dimension review and close the Case without mutating implementation content."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 5,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 85,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Source-backed specification, Product Workspace, Workset behavior, shell, and safe management preserve the intended platform without changing protected cores.",
            "fact_refs": [
              "FACT-PLATFORM-COMPOSITION-BASELINE",
              "FACT-ARCORBIT-PROTECTED-CORE",
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Six surfaces, multi-product coordination, permissions, confirmations, failures, unavailable capabilities, intervention, and recovery are documented and implemented.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Platform and management reuse the shell, tokens, responsive surfaces, tables, modal, status pills, and Workbench geometry.",
            "fact_refs": [
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/fixtures/sidebar-layout.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Ownership, Store v10, adapter/coordinator, fixed allowlist, Automation isolation, V1 partial success, weak claim consistency, and unavailable contracts have durable rationale.",
            "fact_refs": [
              "FACT-PLATFORM-ARCHITECTURE",
              "FACT-SERVICE-CONTRACT-GAPS",
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted Case facts are realized across Store, normalization, composition, IPC, Renderer, preserved Automation, and management operations.",
            "fact_refs": [
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-PLATFORM-SHELL-REALIZED",
              "FACT-PLATFORM-MANAGEMENT-REALIZED",
              "FACT-ARCORBIT-PROTECTED-CORE"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Full suite, route/body contracts, unsafe-command rejection, workset isolation, Renderer assertions, and explicit layout skip cover risks without overstating live-service evidence.",
            "fact_refs": [
              "FACT-SERVICE-CONTRACT-GAPS",
              "FACT-PLATFORM-FOUNDATION-REALIZED",
              "FACT-PLATFORM-MANAGEMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit: npm run check (205 tests, 204 pass, 1 explicit layout skip, 0 fail)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T20:10:30.815Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-BASELINE",
      "GAP-PLATFORM-ARCHITECTURE",
      "GAP-PLATFORM-FOUNDATION",
      "GAP-PLATFORM-SHELL",
      "CASE-20260817-005:review-finding:CR-PLATFORM-MANAGEMENT-CAPABILITIES"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All dynamic gaps and state impacts are closed and the current implementation passed completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The current Case revision passed completion review.",
      "next_prompt": "",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-17T20:10:30.815Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
