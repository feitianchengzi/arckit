# Fix packaged Runtime readiness detection

Case: CASE-20260814-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-14T10:15:56.269Z

## User Intent

Correct Arckit skill availability reporting and make packaged Arckit Runtime reliably discover and launch an installed Codex CLI outside the GUI process PATH.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260814-003",
  "title": "Fix packaged Runtime readiness detection",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-14T09:30:27.597Z",
  "updated_at": "2026-08-14T10:15:56.269Z",
  "user_intent": "Correct Arckit skill availability reporting and make packaged Arckit Runtime reliably discover and launch an installed Codex CLI outside the GUI process PATH.",
  "expected_outcome": "Setup Readiness reports the exact ambient, on-demand, deferred and loader boundaries, and the packaged Desktop resolves one verified Codex executable for readiness, app-server execution and CLI handoff.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-READINESS-001",
      "revision": 1,
      "status": "superseded",
      "statement": "The packaged Arckit payload contains 13 Arckit skills: 7 user-ambient, 5 user-on-demand and 1 project-ambient, while the readiness summary collapses the first two modes into the text 12 user skills and separately defers the project skill.",
      "basis": "Packaged payload manifest, source availability manifest and deterministic readiness snapshot inspection.",
      "evidence": [
        "runtime/arckit-runtime/dist-package/resources/provisioning/arckit-skills/payload.manifest.json",
        "arcforge.skill-project.json",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
      ]
    },
    {
      "id": "FACT-READINESS-002",
      "revision": 1,
      "status": "accepted",
      "statement": "On this macOS host Codex CLI is installed under an NVM-managed directory; the Runtime default bare-name probe succeeds with the interactive shell PATH and deterministically returns ENOENT with a GUI-like system PATH.",
      "basis": "Direct reproduction through createSkillProvisioningManager using the same packaged resources under inherited and GUI-like PATH values.",
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
      ]
    },
    {
      "id": "FACT-READINESS-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Packaged Desktop still defaults its host Node executable to the bare command node for project ledger initialization and Runtime child launch; a GUI process without the NVM bin directory can therefore fail before Codex app-server starts.",
      "basis": "Desktop Run Manager and project initializer execution-path inspection after the Codex executable boundary was implemented.",
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "verification: GUI-like PATH does not resolve node on the current NVM-based host"
      ]
    },
    {
      "id": "FACT-READINESS-004",
      "revision": 1,
      "status": "accepted",
      "statement": "The packaged Electron executable provides Node 20.18.0 compatibility through ELECTRON_RUN_AS_NODE=1 and can execute the packaged app.asar Runtime CLI under a GUI-like minimal PATH.",
      "basis": "Direct execution of the locally packaged x64 application binary and app.asar Runtime entrypoint.",
      "evidence": [
        "runtime/arckit-runtime/release/mac/arckit-runtime.app/Contents/MacOS/arckit-runtime",
        "runtime/arckit-runtime/release/mac/arckit-runtime.app/Contents/Resources/app.asar",
        "verification: embedded Electron reported Node 20.18.0 and Electron 31.7.7",
        "verification: packaged app.asar Runtime CLI help succeeded with minimal PATH"
      ]
    },
    {
      "id": "FACT-READINESS-001",
      "revision": 2,
      "status": "accepted",
      "statement": "The packaged Arckit payload contains 13 Arckit skills and Setup Readiness reports them as 7 user-ambient, 5 user-on-demand and 1 project-ambient deferred; its one ArcForge loader target is displayed separately and is not counted as an Arckit skill.",
      "basis": "Implemented snapshot contract, renderer projection and packaged distribution smoke evidence.",
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-CODEX-EXECUTABLE",
      "fact_id": "FACT-READINESS-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "The Codex app-server/CLI adapter boundary now uses one verified executable and preserves the launcher runtime PATH.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
        "runtime/arckit-runtime/desktop/main.mjs"
      ]
    },
    {
      "id": "IMPACT-PACKAGED-NODE",
      "fact_id": "FACT-READINESS-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Packaged Desktop-owned Node scripts now execute through the bundled Electron binary and no longer depend on a shell-visible host node.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "verification: packaged app.asar Runtime CLI succeeded under minimal PATH"
      ]
    },
    {
      "id": "IMPACT-SKILL-AVAILABILITY",
      "fact_id": "FACT-READINESS-001",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 8
      },
      "effect": "upheld",
      "reason": "Setup Readiness now presents the governed availability and install-target boundaries without conflating modes or loader assets.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-CODEX-EXECUTABLE-RESOLUTION",
      "status": "resolved",
      "goal": "Resolve and consistently reuse a verified Codex executable across packaged Setup Readiness, Codex app-server execution and interactive CLI handoff when Codex is installed outside the GUI process PATH.",
      "reason": "The current bare-name probe blocks packaged Desktop startup and the same unresolved command would fail later execution surfaces.",
      "derived_from": [
        "case_intent",
        "FACT-READINESS-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Cross-platform resolver tests including macOS GUI-like PATH and NVM installation behavior.",
        "Integration evidence that readiness and execution surfaces consume the same resolved absolute executable."
      ],
      "resolution": {
        "id": "GAP-CODEX-EXECUTABLE-RESOLUTION",
        "status": "resolved",
        "outcome": "Runtime now discovers and verifies Codex across PATH and supported user/version-manager locations, preserves the sibling runtime PATH needed by script launchers, and reuses that result in Setup, app-server child execution and CLI handoff.",
        "reason": "Unit, integration and real-host GUI-like PATH reproductions all pass with the resolved absolute NVM Codex executable and fail closed for invalid executables.",
        "evidence": [
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
          "verification: 20 targeted tests passed",
          "verification: GUI-like PATH resolved /Users/Glare/.nvm/versions/node/v22.22.2/bin/codex and reported codex-cli 0.147.0"
        ],
        "occurred_at": "2026-08-14T09:44:37.100Z"
      }
    },
    {
      "id": "GAP-PACKAGED-NODE-EXECUTION",
      "status": "resolved",
      "goal": "Make packaged Desktop project ledger operations and Runtime child execution independent of a host shell node command.",
      "reason": "The GUI environment that hid NVM Codex also hides the bare node command used before and during Runtime startup.",
      "derived_from": [
        "case_intent",
        "FACT-READINESS-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Packaged-host execution design and tests proving project initialization and Runtime launch work with a GUI-like PATH and no system node command."
      ],
      "resolution": {
        "id": "GAP-PACKAGED-NODE-EXECUTION",
        "status": "resolved",
        "outcome": "Desktop now uses process.execPath and Electron RUN_AS_NODE mode consistently for project, ledger and Runtime script processes instead of a bare host node command.",
        "reason": "Implementation propagation tests and an actual packaged app.asar invocation under a minimal GUI-like PATH both pass.",
        "evidence": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/project-initializer.mjs",
          "runtime/arckit-runtime/src/ledger-scripts.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: 17 targeted tests passed",
          "verification: packaged Electron x64 executed app.asar/bin/arckit-runtime.mjs --help with ELECTRON_RUN_AS_NODE=1 and a minimal PATH"
        ],
        "occurred_at": "2026-08-14T09:48:59.034Z"
      }
    },
    {
      "id": "GAP-SKILL-AVAILABILITY-REPORTING",
      "status": "resolved",
      "goal": "Report the packaged Arckit skill total and each user-ambient, user-on-demand, project-deferred and ArcForge loader boundary accurately in Setup Readiness.",
      "reason": "The current 12 user skills summary obscures the actual install destinations and makes the correct 13-skill payload appear miscounted.",
      "derived_from": [
        "case_intent",
        "FACT-READINESS-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Readiness snapshot and renderer tests for the exact 7/5/1 packaged classification plus the separate loader boundary."
      ],
      "resolution": {
        "id": "GAP-SKILL-AVAILABILITY-REPORTING",
        "status": "resolved",
        "outcome": "Setup Readiness now derives a structured availability breakdown from the payload and provider plan, renders it separately from drift counts, and keeps ArcForge loader targets outside the Arckit skill total.",
        "reason": "Snapshot, renderer, interaction projection, fixture tests and the packaged distribution smoke agree on the exact 13/7/5/1 plus loader contract.",
        "evidence": [
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "verification: 11 targeted tests passed",
          "verification: packaged distribution smoke reported total 13, ambient 7, on-demand 5, deferred arckit-code-swiftui and one loader target"
        ],
        "occurred_at": "2026-08-14T09:53:36.146Z"
      }
    },
    {
      "id": "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
      "status": "resolved",
      "goal": "Resolve review finding: The packaged Runtime child retains ELECTRON_RUN_AS_NODE=1 after bootstrap and can leak Electron-specific Node mode into Codex and other descendant processes.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:3"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arckit-runtime/bin/arckit-runtime.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs: Runtime child env includes nodeEnv",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs: app-server inherits process.env",
        "review: no bootstrap cleanup or regression assertion exists"
      ],
      "resolution": {
        "id": "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
        "status": "resolved",
        "outcome": "The Runtime entrypoint now clears ELECTRON_RUN_AS_NODE before dynamically loading the CLI graph, so Codex and other Runtime descendants inherit the normal environment while packaged Electron still supplies the Node host.",
        "reason": "Focused bootstrap tests, the full suite, a rebuilt app.asar, minimal-PATH packaged CLI execution and packaged distribution smoke all pass.",
        "evidence": [
          "runtime/arckit-runtime/bin/arckit-runtime.mjs",
          "runtime/arckit-runtime/src/runtime-process-environment.mjs",
          "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: 21 focused tests passed",
          "verification: full check passed 176 with one environment-gated skip and zero failures",
          "verification: rebuilt packaged app.asar CLI started under minimal PATH",
          "verification: packaged distribution smoke passed"
        ],
        "occurred_at": "2026-08-14T10:07:50.598Z"
      }
    },
    {
      "id": "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
      "status": "resolved",
      "goal": "Resolve review finding: The resolver discovers Windows npm codex.cmd shims but verifies them with direct execFile, which cannot reliably launch .cmd files and can misreport an installed Codex CLI as unavailable.",
      "reason": "error found by completion review",
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
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
        "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
        "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs: defaultRunVersion directly calls execFile for every platform",
        "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs: .cmd and .bat already require a structured PowerShell shim",
        "review: resolver coverage includes NVM/macOS but no Windows .cmd version-probe assertion"
      ],
      "resolution": {
        "id": "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
        "status": "resolved",
        "outcome": "Windows .cmd/.bat Codex candidates are now version-probed through a fixed non-interactive PowerShell boundary with the executable and JSON arguments carried in environment variables; native binaries remain direct.",
        "reason": "Focused cross-platform launch-spec assertions, existing JSON-RPC shim tests, the full suite and rebuilt package verification all pass.",
        "evidence": [
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
          "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
          "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: 13 focused tests passed",
          "verification: full check passed 178 with one environment-gated skip and zero failures",
          "verification: rebuilt packaged app.asar CLI started under minimal PATH",
          "verification: packaged distribution smoke passed"
        ],
        "occurred_at": "2026-08-14T10:14:18.419Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit default autonomous completion review policy",
      "snapshotted_at": "2026-08-14T09:30:27.597Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 3,
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
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-ELECTRON-RUN-AS-NODE-ENV"
        ],
        "evidence": [
          "npm --prefix runtime/arckit-runtime run check: 175 tests, 174 passed, 1 environment-gated skip",
          "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
          "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
          "verification: packaged distribution smoke passed 13/7/5/1 plus one loader",
          "git diff --check",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
        ],
        "occurred_at": "2026-08-14T09:58:24.655Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-WINDOWS-CODEX-CMD-PROBE"
        ],
        "evidence": [
          "npm --prefix runtime/arckit-runtime run check: 177 tests, 176 passed, 1 environment-gated skip",
          "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
          "verification: packaged app.asar CLI started under minimal PATH",
          "verification: packaged distribution smoke passed",
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
          "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs"
        ],
        "occurred_at": "2026-08-14T10:09:46.644Z"
      },
      {
        "cycle": 3,
        "autonomous_cycle": 3,
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
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs and renderer expose exact 13/7/5/1 plus separate loader semantics",
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs verifies native, NVM/FNM and Windows command-shim candidates",
          "runtime/arckit-runtime/bin/arckit-runtime.mjs removes Electron bootstrap state before loading the CLI graph",
          "npm --prefix runtime/arckit-runtime run check: 179 tests, 178 passed, 1 environment-gated skip, 0 failures",
          "verification: focused cross-platform and bootstrap tests passed 13/13",
          "verification: packaged app.asar Runtime CLI started under minimal GUI PATH",
          "verification: packaged distribution smoke passed with 13/7/5/1 plus one loader",
          "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg sha256 1f15620442406cabe25b8de7423d50f7b2cd752c8e16cc99d3fa492c4f164468",
          "git diff --check"
        ],
        "occurred_at": "2026-08-14T10:15:56.269Z"
      }
    ],
    "evidence": [
      "npm --prefix runtime/arckit-runtime run check: 175 tests, 174 passed, 1 environment-gated skip",
      "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
      "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
      "verification: packaged distribution smoke passed 13/7/5/1 plus one loader",
      "git diff --check",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "npm --prefix runtime/arckit-runtime run check: 177 tests, 176 passed, 1 environment-gated skip",
      "verification: packaged app.asar CLI started under minimal PATH",
      "verification: packaged distribution smoke passed",
      "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
      "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
      "runtime/arckit-runtime/src/skill-provisioning-manager.mjs and renderer expose exact 13/7/5/1 plus separate loader semantics",
      "runtime/arckit-runtime/src/codex-executable-resolver.mjs verifies native, NVM/FNM and Windows command-shim candidates",
      "runtime/arckit-runtime/bin/arckit-runtime.mjs removes Electron bootstrap state before loading the CLI graph",
      "npm --prefix runtime/arckit-runtime run check: 179 tests, 178 passed, 1 environment-gated skip, 0 failures",
      "verification: focused cross-platform and bootstrap tests passed 13/13",
      "verification: packaged app.asar Runtime CLI started under minimal GUI PATH",
      "verification: packaged distribution smoke passed with 13/7/5/1 plus one loader",
      "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg sha256 1f15620442406cabe25b8de7423d50f7b2cd752c8e16cc99d3fa492c4f164468"
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
      "goal": "Establish one verified Codex executable resolution result and reuse it across readiness, Runtime app-server execution and interactive CLI handoff.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Codex resolver defect blocks Setup Ready and would also break both app-server and CLI execution, so it has the highest immediate user impact and risk.",
        "snapshot_token": "9b65358c50038d8ec5679c871f788eb7db6081f59a44875c21fc9de881a7f175",
        "selected_ref": "case-gap:CASE-20260814-003:GAP-CODEX-EXECUTABLE-RESOLUTION",
        "comparison_summary": "Compared all four Project candidates, the Case candidate and two actually discovered fresh candidates; selected the blocking executable chain and deferred independent readiness reporting and host Node execution work.",
        "fresh_discovery_summary": "Confirmed the skill availability summary needs its own correction and discovered that packaged Desktop still depends on a bare host node command before Runtime execution.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Scenario evaluation is unrelated to the packaged executable defect."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "This broad Project gap includes unrelated timeout and compaction work and is not claimed by the bounded Case transition."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Permission-bearing project validation is unrelated to executable discovery."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record auditing is unrelated to the executable resolution implementation."
          },
          {
            "ref": "case-gap:CASE-20260814-003:GAP-CODEX-EXECUTABLE-RESOLUTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It blocks packaged startup and all Codex execution surfaces."
          },
          {
            "ref": "fresh-gap:CASE-20260814-003:GAP-SKILL-AVAILABILITY-REPORTING",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "The reporting defect is independent and does not precede executable resolution."
          },
          {
            "ref": "fresh-gap:CASE-20260814-003:GAP-PACKAGED-NODE-EXECUTION",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The host Node dependency was discovered during this round and must be selected only after this transition is accepted and fresh-read."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-CODEX-EXECUTABLE-RESOLUTION",
        "responsibility": "agent",
        "goal": "Resolve and consistently reuse a verified Codex executable across packaged Setup Readiness, Codex app-server execution and interactive CLI handoff when Codex is installed outside the GUI process PATH.",
        "reason": "The current bare-name probe blocks packaged Desktop startup and the same unresolved command would fail later execution surfaces.",
        "derived_from": [
          "case_intent",
          "FACT-READINESS-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Cross-platform resolver tests including macOS GUI-like PATH and NVM installation behavior.",
          "Integration evidence that readiness and execution surfaces consume the same resolved absolute executable."
        ]
      },
      "planned_transition": {
        "goal": "Establish one verified Codex executable resolution result and reuse it across readiness, Runtime app-server execution and interactive CLI handoff.",
        "expected_state_change": "Packaged Desktop no longer depends on its GUI PATH to discover or execute an NVM/FNM/user-installed Codex CLI, while failures remain fail-closed."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-CODEX-EXECUTABLE-RESOLUTION",
          "status": "resolved",
          "outcome": "Runtime now discovers and verifies Codex across PATH and supported user/version-manager locations, preserves the sibling runtime PATH needed by script launchers, and reuses that result in Setup, app-server child execution and CLI handoff.",
          "reason": "Unit, integration and real-host GUI-like PATH reproductions all pass with the resolved absolute NVM Codex executable and fail closed for invalid executables.",
          "evidence": [
            "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
            "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
            "verification: 20 targeted tests passed",
            "verification: GUI-like PATH resolved /Users/Glare/.nvm/versions/node/v22.22.2/bin/codex and reported codex-cli 0.147.0"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-READINESS-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Packaged Desktop still defaults its host Node executable to the bare command node for project ledger initialization and Runtime child launch; a GUI process without the NVM bin directory can therefore fail before Codex app-server starts.",
            "basis": "Desktop Run Manager and project initializer execution-path inspection after the Codex executable boundary was implemented.",
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/project-initializer.mjs",
              "runtime/arckit-runtime/src/ledger-scripts.mjs",
              "verification: GUI-like PATH does not resolve node on the current NVM-based host"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-CODEX-EXECUTABLE",
            "fact_id": "FACT-READINESS-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "The Codex app-server/CLI adapter boundary now uses one verified executable and preserves the launcher runtime PATH.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
              "runtime/arckit-runtime/desktop/main.mjs"
            ]
          },
          {
            "id": "IMPACT-PACKAGED-NODE",
            "fact_id": "FACT-READINESS-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The standalone installer outcome is not fully realized while GUI-launched project and Runtime scripts require an unresolved host node command.",
            "gap_ids": [
              "GAP-PACKAGED-NODE-EXECUTION"
            ],
            "evidence": []
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-PACKAGED-NODE-EXECUTION",
            "status": "open",
            "goal": "Make packaged Desktop project ledger operations and Runtime child execution independent of a host shell node command.",
            "reason": "The GUI environment that hid NVM Codex also hides the bare node command used before and during Runtime startup.",
            "derived_from": [
              "case_intent",
              "FACT-READINESS-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Packaged-host execution design and tests proving project initialization and Runtime launch work with a GUI-like PATH and no system node command."
            ],
            "resolution": null
          },
          {
            "id": "GAP-SKILL-AVAILABILITY-REPORTING",
            "status": "open",
            "goal": "Report the packaged Arckit skill total and each user-ambient, user-on-demand, project-deferred and ArcForge loader boundary accurately in Setup Readiness.",
            "reason": "The current 12 user skills summary obscures the actual install destinations and makes the correct 13-skill payload appear miscounted.",
            "derived_from": [
              "case_intent",
              "FACT-READINESS-001"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Readiness snapshot and renderer tests for the exact 7/5/1 packaged classification plus the separate loader boundary."
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted packaged Setup Readiness capability remains explicit and the implementation now realizes its Codex discoverability boundary.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The existing blocked-versus-ready interaction remains coherent and the probe now distinguishes missing from runnable Codex without changing user flow.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Executable discovery changes no visual-language or presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The executable ownership, verification, PATH preservation, retry and shared-consumer boundary is durable in the installer technical solution.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/codex-executable-resolver.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Codex discovery is realized, but the newly accepted host Node dependency still prevents the installer-only execution outcome under the same GUI environment.",
            "fact_refs": [
              "FACT-READINESS-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-PACKAGED-NODE-EXECUTION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The resolver risk is covered by fail-closed invalid-executable tests, GUI-like NVM tests, consumer propagation tests and a real-host reproduction.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
              "verification: 20 targeted tests passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: 20 targeted tests passed",
        "verification: real GUI-like PATH resolves codex-cli 0.147.0"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T09:44:37.100Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Use the packaged Electron executable as the Node-compatible host for every Desktop-owned script process.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The host Node dependency directly blocks installer-only execution and carries the Case threatened realization impact.",
        "snapshot_token": "7e23955f6b8fbc3a0f847e1bfca6bbf9cba263a4cddf1e34afc4858f284ff0a7",
        "selected_ref": "case-gap:CASE-20260814-003:GAP-PACKAGED-NODE-EXECUTION",
        "comparison_summary": "Compared all Project and Case candidates; selected the blocking host execution gap and deferred the independent reporting correction.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered during the bounded embedded Node implementation.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Unrelated scenario evaluation remains outside this Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The broad resilience Project gap remains outside this bounded host execution fix."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Permission validation is unrelated to embedded Node execution."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record audit is unrelated to the packaged host command boundary."
          },
          {
            "ref": "case-gap:CASE-20260814-003:GAP-PACKAGED-NODE-EXECUTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It blocks all project and Runtime scripts in the packaged GUI environment and reconciles the threatened realization impact."
          },
          {
            "ref": "case-gap:CASE-20260814-003:GAP-SKILL-AVAILABILITY-REPORTING",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "The reporting correction is independent and less blocking than executable host availability."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PACKAGED-NODE-EXECUTION",
        "responsibility": "agent",
        "goal": "Make packaged Desktop project ledger operations and Runtime child execution independent of a host shell node command.",
        "reason": "The GUI environment that hid NVM Codex also hides the bare node command used before and during Runtime startup.",
        "derived_from": [
          "case_intent",
          "FACT-READINESS-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Packaged-host execution design and tests proving project initialization and Runtime launch work with a GUI-like PATH and no system node command."
        ]
      },
      "planned_transition": {
        "goal": "Use the packaged Electron executable as the Node-compatible host for every Desktop-owned script process.",
        "expected_state_change": "Project initialization, Runtime child execution and ledger commands run from the package with a GUI-like PATH and no external node command."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PACKAGED-NODE-EXECUTION",
          "status": "resolved",
          "outcome": "Desktop now uses process.execPath and Electron RUN_AS_NODE mode consistently for project, ledger and Runtime script processes instead of a bare host node command.",
          "reason": "Implementation propagation tests and an actual packaged app.asar invocation under a minimal GUI-like PATH both pass.",
          "evidence": [
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/project-initializer.mjs",
            "runtime/arckit-runtime/src/ledger-scripts.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: 17 targeted tests passed",
            "verification: packaged Electron x64 executed app.asar/bin/arckit-runtime.mjs --help with ELECTRON_RUN_AS_NODE=1 and a minimal PATH"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-READINESS-004",
            "revision": 1,
            "status": "accepted",
            "statement": "The packaged Electron executable provides Node 20.18.0 compatibility through ELECTRON_RUN_AS_NODE=1 and can execute the packaged app.asar Runtime CLI under a GUI-like minimal PATH.",
            "basis": "Direct execution of the locally packaged x64 application binary and app.asar Runtime entrypoint.",
            "evidence": [
              "runtime/arckit-runtime/release/mac/arckit-runtime.app/Contents/MacOS/arckit-runtime",
              "runtime/arckit-runtime/release/mac/arckit-runtime.app/Contents/Resources/app.asar",
              "verification: embedded Electron reported Node 20.18.0 and Electron 31.7.7",
              "verification: packaged app.asar Runtime CLI help succeeded with minimal PATH"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGED-NODE",
            "fact_id": "FACT-READINESS-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Packaged Desktop-owned Node scripts now execute through the bundled Electron binary and no longer depend on a shell-visible host node.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/project-initializer.mjs",
              "runtime/arckit-runtime/src/ledger-scripts.mjs",
              "verification: packaged app.asar Runtime CLI succeeded under minimal PATH"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The installer-only product outcome remains explicit and is now realized without an external Node installation.",
            "fact_refs": [
              "FACT-READINESS-003",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Project addition and task-start interactions retain their established states while their supporting script processes now work in the packaged GUI environment.",
            "fact_refs": [
              "FACT-READINESS-003"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The host process execution change has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The packaged Node host, environment contract and affected process boundaries are explicit in the technical solution and implementation.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/ledger-scripts.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The previously threatened standalone execution fact is realized by the embedded Electron Node mode across all Desktop-owned script consumers.",
            "fact_refs": [
              "FACT-READINESS-003",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "verification: packaged app.asar Runtime CLI succeeded under minimal PATH"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The host dependency claim is covered by propagation tests and real packaged-binary execution in the failing environment class.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
              "verification: 17 targeted tests passed",
              "verification: packaged app.asar Runtime CLI succeeded under minimal PATH"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: 17 targeted tests passed",
        "verification: packaged Electron and app.asar Runtime CLI succeeded under minimal PATH"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T09:48:59.034Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Expose and render one unambiguous availability count contract for packaged Arckit skills and the separate ArcForge loader.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "This is the only remaining ordinary Case gap and directly corrects the user-reported count and classification mismatch.",
        "snapshot_token": "4f70b666f813ea2d3c1e8ea3e73b9b91ece95cdc92377b93f157a6726adf6f2e",
        "selected_ref": "case-gap:CASE-20260814-003:GAP-SKILL-AVAILABILITY-REPORTING",
        "comparison_summary": "Compared all Project and Case candidates; selected the sole readiness reporting candidate and excluded unrelated Project work.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered while aligning the snapshot, renderer and interaction projections.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Unrelated scenario evaluation remains outside this Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Runtime resilience work is independent of availability reporting."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Permission validation is unrelated to Setup classification."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record auditing is unrelated to the readiness summary projection."
          },
          {
            "ref": "case-gap:CASE-20260814-003:GAP-SKILL-AVAILABILITY-REPORTING",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It is the only remaining Case obligation and has direct user-visible impact."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SKILL-AVAILABILITY-REPORTING",
        "responsibility": "agent",
        "goal": "Report the packaged Arckit skill total and each user-ambient, user-on-demand, project-deferred and ArcForge loader boundary accurately in Setup Readiness.",
        "reason": "The current 12 user skills summary obscures the actual install destinations and makes the correct 13-skill payload appear miscounted.",
        "derived_from": [
          "case_intent",
          "FACT-READINESS-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "Readiness snapshot and renderer tests for the exact 7/5/1 packaged classification plus the separate loader boundary."
        ]
      },
      "planned_transition": {
        "goal": "Expose and render one unambiguous availability count contract for packaged Arckit skills and the separate ArcForge loader.",
        "expected_state_change": "Setup Readiness reports 13 Arckit skills as 7 user-ambient, 5 user-on-demand and 1 project-ambient deferred, while showing one loader target separately."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SKILL-AVAILABILITY-REPORTING",
          "status": "resolved",
          "outcome": "Setup Readiness now derives a structured availability breakdown from the payload and provider plan, renders it separately from drift counts, and keeps ArcForge loader targets outside the Arckit skill total.",
          "reason": "Snapshot, renderer, interaction projection, fixture tests and the packaged distribution smoke agree on the exact 13/7/5/1 plus loader contract.",
          "evidence": [
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "verification: 11 targeted tests passed",
            "verification: packaged distribution smoke reported total 13, ambient 7, on-demand 5, deferred arckit-code-swiftui and one loader target"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-READINESS-001",
            "revision": 2,
            "status": "accepted",
            "statement": "The packaged Arckit payload contains 13 Arckit skills and Setup Readiness reports them as 7 user-ambient, 5 user-on-demand and 1 project-ambient deferred; its one ArcForge loader target is displayed separately and is not counted as an Arckit skill.",
            "basis": "Implemented snapshot contract, renderer projection and packaged distribution smoke evidence.",
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-READINESS-001",
            "revision": 1,
            "reason": "The misleading collapsed user-skill summary has been replaced by the accepted exact availability contract.",
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: packaged distribution smoke passed"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-SKILL-AVAILABILITY",
            "fact_id": "FACT-READINESS-001",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "Setup Readiness now presents the governed availability and install-target boundaries without conflating modes or loader assets.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [],
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The governed skill provisioning capability is now reported using the exact payload and loader boundary already required by the product contract.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Setup summary, expanded plan and Ready result now expose the same availability counts and separate loader semantics.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Count text changed within existing components without changing visual-language rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The snapshot contract now carries explicit availability fields derived from authoritative payload and provider plan data.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The shipped payload classification is realized identically in the manager snapshot, renderer projection and distribution smoke result.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "verification: packaged distribution smoke reported 13/7/5/1 plus one loader"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Regression coverage asserts structured counts and exact summary text, while the real packaged payload smoke verifies the production classification.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: 11 targeted tests passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "verification: 11 targeted tests passed",
        "verification: packaged distribution smoke passed with 13/7/5/1 and one loader"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T09:53:36.146Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 3 across implementation correctness, problem resolution, verification credibility, regression risk and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the ledger-derived completion review is the only eligible Case candidate.",
        "snapshot_token": "dd6e274177b07cb5af14c09f32c43d13bc80dbca6bccab73fd1d864424cdaa69",
        "selected_ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:1",
        "comparison_summary": "Compared the derived review with all persisted Project candidates and selected the Case terminal quality gate.",
        "fresh_discovery_summary": "Review discovered one environment-leak regression risk that requires a separate ordinary repair gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project scenario evaluation is outside this Case review."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The broader resilience backlog is not part of this implementation review."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Real permission validation is outside this Case review."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project-wide cross-record auditing is outside this Case review."
          },
          {
            "ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the sole Case candidate after ordinary work closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-003:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:3"
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
        "goal": "Review content revision 3 across implementation correctness, problem resolution, verification credibility, regression risk and minimality.",
        "expected_state_change": "Record one bounded finding for the inherited Electron Node-mode environment without changing implementation content."
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-ELECTRON-RUN-AS-NODE-ENV",
              "kind": "error",
              "statement": "The packaged Runtime child retains ELECTRON_RUN_AS_NODE=1 after bootstrap and can leak Electron-specific Node mode into Codex and other descendant processes.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arckit-runtime/bin/arckit-runtime.mjs",
                "runtime/arckit-runtime/src/desktop-run-manager.mjs",
                "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/desktop-run-manager.mjs: Runtime child env includes nodeEnv",
                "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs: app-server inherits process.env",
                "review: no bootstrap cleanup or regression assertion exists"
              ]
            }
          ],
          "evidence": [
            "npm --prefix runtime/arckit-runtime run check: 175 tests, 174 passed, 1 environment-gated skip",
            "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
            "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
            "verification: packaged distribution smoke passed 13/7/5/1 plus one loader",
            "git diff --check",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed product outcomes and skill availability contract remain explicit despite the isolated child-environment finding.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed Setup and execution journeys remain coherent and accurately projected.",
            "fact_refs": [
              "FACT-READINESS-001"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The review finding concerns a process environment and does not affect visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The embedded Node host boundary is incomplete until its bootstrap-only environment is prevented from leaking into external descendants.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The two reported user failures are resolved in the rebuilt package and the accepted 13/7/5/1 plus loader and Codex discoverability facts are directly realized.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "npm --prefix runtime/arckit-runtime run check: 175 tests, 174 passed, 1 environment-gated skip",
              "verification: packaged resolver found codex-cli 0.147.0",
              "verification: packaged distribution smoke passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Review identified an untested descendant-process environment risk that must be controlled before the Case can close cleanly.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV"
            ]
          }
        ]
      },
      "evidence": [
        "npm --prefix runtime/arckit-runtime run check: 175 tests, 174 passed, 1 environment-gated skip",
        "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
        "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
        "verification: packaged distribution smoke passed 13/7/5/1 plus one loader",
        "git diff --check",
        "review finding: ELECTRON_RUN_AS_NODE descendant leakage"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T09:58:24.655Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Limit ELECTRON_RUN_AS_NODE to the packaged Electron-to-Node bootstrap boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The completion review finding is the only ready Case gap and blocks trustworthy closeout of the packaged Runtime fix.",
        "snapshot_token": "ed919017ffc72381a271fb3ee8448652f4d9513aa68ebd37f2fb5ce99a2f4024",
        "selected_ref": "case-gap:CASE-20260814-003:CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
        "comparison_summary": "Compared the ready review-finding repair with all persisted Project gaps and selected the Case-local high-risk blocker.",
        "fresh_discovery_summary": "No additional fresh gap was discovered after implementing and validating the bootstrap environment boundary.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The Project-wide scenario evaluation is outside this focused repair Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Broader resilience and adapter work is independent of this concrete packaged-process leak."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Permission-bearing real-project validation is outside this packaged bootstrap repair."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record auditing does not supersede the active Case blocker."
          },
          {
            "ref": "case-gap:CASE-20260814-003:CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "It is the sole ready Case obligation and directly affects safe Codex process launch."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
        "responsibility": "agent",
        "goal": "Resolve review finding: The packaged Runtime child retains ELECTRON_RUN_AS_NODE=1 after bootstrap and can leak Electron-specific Node mode into Codex and other descendant processes.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:3"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arckit-runtime/bin/arckit-runtime.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs: Runtime child env includes nodeEnv",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs: app-server inherits process.env",
          "review: no bootstrap cleanup or regression assertion exists"
        ]
      },
      "planned_transition": {
        "goal": "Limit ELECTRON_RUN_AS_NODE to the packaged Electron-to-Node bootstrap boundary.",
        "expected_state_change": "The Runtime entrypoint clears the Electron-only flag before loading the CLI graph, regression coverage locks the ordering, and the review finding is resolved."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
          "status": "resolved",
          "outcome": "The Runtime entrypoint now clears ELECTRON_RUN_AS_NODE before dynamically loading the CLI graph, so Codex and other Runtime descendants inherit the normal environment while packaged Electron still supplies the Node host.",
          "reason": "Focused bootstrap tests, the full suite, a rebuilt app.asar, minimal-PATH packaged CLI execution and packaged distribution smoke all pass.",
          "evidence": [
            "runtime/arckit-runtime/bin/arckit-runtime.mjs",
            "runtime/arckit-runtime/src/runtime-process-environment.mjs",
            "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: 21 focused tests passed",
            "verification: full check passed 176 with one environment-gated skip and zero failures",
            "verification: rebuilt packaged app.asar CLI started under minimal PATH",
            "verification: packaged distribution smoke passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "FINDING-ELECTRON-RUN-AS-NODE-ENV",
            "resolution": "resolved",
            "reason": "The bootstrap flag is removed before any Runtime CLI module can launch external descendants.",
            "evidence": [
              "runtime/arckit-runtime/bin/arckit-runtime.mjs",
              "runtime/arckit-runtime/src/runtime-process-environment.mjs",
              "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
              "verification: packaged app.asar contains the sanitized bootstrap and starts under minimal PATH"
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The packaged readiness and full-feature experience outcomes remain explicit and unchanged by the focused process-boundary repair.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup and Runtime launch behavior remain coherent while the implementation now protects descendants transparently.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This repair changes only the Runtime process environment and has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical contract now explicitly separates Electron's bootstrap-only Node mode from the normal environment inherited by Runtime descendants.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/bin/arckit-runtime.mjs",
              "runtime/arckit-runtime/src/runtime-process-environment.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The standalone package still starts through its embedded host, resolves Codex, and reports the accepted governed-skill classification.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "verification: rebuilt packaged app.asar CLI started under minimal PATH",
              "verification: packaged distribution smoke passed 13/7/5/1 plus one loader"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The previously untested environment leak now has focused ordering and mutation coverage plus full-suite and rebuilt-package evidence.",
            "fact_refs": [
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
              "verification: 21 focused tests passed",
              "verification: full check passed 176 with one environment-gated skip and zero failures",
              "verification: rebuilt packaged app.asar CLI started under minimal PATH"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/bin/arckit-runtime.mjs",
        "runtime/arckit-runtime/src/runtime-process-environment.mjs",
        "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
        "verification: 21 focused tests passed",
        "verification: full check passed 176 with one environment-gated skip and zero failures",
        "verification: rebuilt packaged app.asar CLI started under minimal PATH",
        "verification: packaged distribution smoke passed",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T10:07:50.598Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 4 across all five completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the fresh content-revision-4 completion review is the only eligible Case candidate.",
        "snapshot_token": "70f0591d619cffec7df01fef97c6c1bdf1be0f0310702a88a0de8d3e95361d49",
        "selected_ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:2",
        "comparison_summary": "Compared the derived review with all persisted Project candidates and selected the Case terminal quality gate.",
        "fresh_discovery_summary": "Review discovered one Windows npm command-shim probe gap requiring a separate ordinary repair round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project scenario evaluation is outside this Case review."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The broader resilience backlog is not part of this implementation review."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Real permission validation is outside this Case review."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project-wide cross-record auditing is outside this Case review."
          },
          {
            "ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the sole Case candidate after the review-finding repair closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-003:completion-review:2",
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
        "goal": "Review content revision 4 across all five completion dimensions.",
        "expected_state_change": "Record the Windows command-shim probe finding without changing implementation content."
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
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-WINDOWS-CODEX-CMD-PROBE",
              "kind": "error",
              "statement": "The resolver discovers Windows npm codex.cmd shims but verifies them with direct execFile, which cannot reliably launch .cmd files and can misreport an installed Codex CLI as unavailable.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
                "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
                "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/codex-executable-resolver.mjs: defaultRunVersion directly calls execFile for every platform",
                "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs: .cmd and .bat already require a structured PowerShell shim",
                "review: resolver coverage includes NVM/macOS but no Windows .cmd version-probe assertion"
              ]
            }
          ],
          "evidence": [
            "npm --prefix runtime/arckit-runtime run check: 177 tests, 176 passed, 1 environment-gated skip",
            "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
            "verification: packaged app.asar CLI started under minimal PATH",
            "verification: packaged distribution smoke passed",
            "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
            "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs"
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The intended standalone readiness outcomes remain explicit despite the isolated Windows implementation gap.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Setup interaction contract correctly requires discovery; the finding concerns its Windows executable adapter.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The Windows process-launch finding has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The cross-platform executable resolution contract is incomplete until Windows command shims are probed through a safe supported host.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reported macOS environment and packaged skills outcome are realized; the newly found Windows gap does not negate that direct evidence.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
              "verification: packaged distribution smoke passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Windows npm shim behavior lacks a supported probe path and regression assertion.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE"
            ]
          }
        ]
      },
      "evidence": [
        "npm --prefix runtime/arckit-runtime run check: 177 tests, 176 passed, 1 environment-gated skip",
        "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
        "verification: packaged app.asar CLI started under minimal PATH",
        "verification: packaged distribution smoke passed",
        "review finding: Windows codex.cmd probe uses unsupported direct execFile boundary"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T10:09:46.644Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Probe Windows npm Codex command shims through a safe supported process host.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Windows command-shim probe finding is the only ready Case gap and blocks cross-platform Setup Readiness correctness.",
        "snapshot_token": "cc0c99ff086f1353be16fadd794499309142405dfbf5eaaa9614f482ee13f110",
        "selected_ref": "case-gap:CASE-20260814-003:CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
        "comparison_summary": "Compared the ready review repair with all persisted Project gaps and selected the Case-local cross-platform blocker.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered after aligning version probing with the existing safe Windows command-shim boundary.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The Project-wide scenario evaluation remains outside this Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Broader Runtime resilience is independent of this focused probe repair."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Real-project permission validation is unrelated to executable probing."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record auditing does not supersede the active Case blocker."
          },
          {
            "ref": "case-gap:CASE-20260814-003:CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "It is the sole ready Case obligation and corrects Windows installed-Codex detection."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
        "responsibility": "agent",
        "goal": "Resolve review finding: The resolver discovers Windows npm codex.cmd shims but verifies them with direct execFile, which cannot reliably launch .cmd files and can misreport an installed Codex CLI as unavailable.",
        "reason": "error found by completion review",
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
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
          "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
          "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
          "runtime/arckit-runtime/src/codex-executable-resolver.mjs: defaultRunVersion directly calls execFile for every platform",
          "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs: .cmd and .bat already require a structured PowerShell shim",
          "review: resolver coverage includes NVM/macOS but no Windows .cmd version-probe assertion"
        ]
      },
      "planned_transition": {
        "goal": "Probe Windows npm Codex command shims through a safe supported process host.",
        "expected_state_change": "The resolver uses a fixed PowerShell script with structured environment arguments for .cmd/.bat and retains direct execution for native binaries."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE",
          "status": "resolved",
          "outcome": "Windows .cmd/.bat Codex candidates are now version-probed through a fixed non-interactive PowerShell boundary with the executable and JSON arguments carried in environment variables; native binaries remain direct.",
          "reason": "Focused cross-platform launch-spec assertions, existing JSON-RPC shim tests, the full suite and rebuilt package verification all pass.",
          "evidence": [
            "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
            "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
            "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: 13 focused tests passed",
            "verification: full check passed 178 with one environment-gated skip and zero failures",
            "verification: rebuilt packaged app.asar CLI started under minimal PATH",
            "verification: packaged distribution smoke passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "FINDING-WINDOWS-CODEX-CMD-PROBE",
            "resolution": "resolved",
            "reason": "The version probe now uses the supported structured PowerShell host for Windows npm command shims.",
            "evidence": [
              "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
              "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
              "verification: Windows command-shim and native executable probe-spec tests passed"
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The standalone readiness outcomes remain explicit and are now supported across native and Windows npm executable forms.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup reports the same accurate ready or blocked states while Windows detection now follows a supported launch boundary.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This cross-platform process repair has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical contract and code now distinguish native executable probes from safely hosted Windows command shims.",
            "fact_refs": [
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/codex-executable-resolver.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Codex discoverability is realized for GUI-hidden NVM installations and has a verified Windows npm shim execution specification, while packaged skill reporting remains exact.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
              "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
              "verification: packaged distribution smoke passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Both native/NVM and Windows command-shim probe forms have focused assertions, and the full package regression suite is clean.",
            "fact_refs": [
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
              "runtime/arckit-runtime/test/json-rpc-stdio-client.test.mjs",
              "verification: 13 focused tests passed",
              "verification: full check passed 178 with one environment-gated skip and zero failures"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
        "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
        "verification: 13 focused tests passed",
        "verification: full check passed 178 with one environment-gated skip and zero failures",
        "verification: rebuilt packaged app.asar CLI started under minimal PATH",
        "verification: packaged distribution smoke passed",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T10:14:18.419Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the implementation-focused review of content revision 5.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and both prior review findings are resolved, so completion review for content revision 5 is the sole eligible Case candidate.",
        "snapshot_token": "3574005595cdb51b1230a9bb0662f3987823606927c99be20b8d57a7cfd9017f",
        "selected_ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:3",
        "comparison_summary": "Compared the terminal Case review with every persisted Project candidate and selected the only Case-local closeout gate.",
        "fresh_discovery_summary": "No more important fresh gap was found after reviewing the final code, tests, durable documents, rebuilt package and distribution smoke evidence.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project scenario evaluation is outside this resolved packaging-readiness Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The broader resilience backlog remains independent Project work."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Real permission validation is outside this Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Project-wide audit work does not block this Case-specific clean review."
          },
          {
            "ref": "case-gap:CASE-20260814-003:CASE-20260814-003:completion-review:3",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the sole Case candidate and reviews the final content revision."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-003:completion-review:3",
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
        "goal": "Complete the implementation-focused review of content revision 5.",
        "expected_state_change": "Record a clean five-dimensional review and resolve the Case without implementation changes."
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
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs and renderer expose exact 13/7/5/1 plus separate loader semantics",
            "runtime/arckit-runtime/src/codex-executable-resolver.mjs verifies native, NVM/FNM and Windows command-shim candidates",
            "runtime/arckit-runtime/bin/arckit-runtime.mjs removes Electron bootstrap state before loading the CLI graph",
            "npm --prefix runtime/arckit-runtime run check: 179 tests, 178 passed, 1 environment-gated skip, 0 failures",
            "verification: focused cross-platform and bootstrap tests passed 13/13",
            "verification: packaged app.asar Runtime CLI started under minimal GUI PATH",
            "verification: packaged distribution smoke passed with 13/7/5/1 plus one loader",
            "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg sha256 1f15620442406cabe25b8de7423d50f7b2cd752c8e16cc99d3fa492c4f164468",
            "git diff --check"
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
        "project_revision": 54,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final package behavior and governed skill availability remain explicit in the product and interaction sources.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup reports exact skill modes and a separate loader while both detection failure and success states remain recoverable.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The final changes reuse existing Setup components and introduce no visual-language decision.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Absolute Codex resolution, sibling PATH propagation, Windows shim probing and Electron bootstrap cleanup are documented and reflected directly in code.",
            "fact_refs": [
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
              "runtime/arckit-runtime/bin/arckit-runtime.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The rebuilt package realizes accurate 13/7/5/1 reporting, separate ArcForge loader semantics, GUI-independent Codex discovery and embedded Node execution.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-003",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "verification: packaged resolver found codex-cli 0.147.0 under minimal PATH",
              "verification: packaged app.asar CLI started under minimal PATH",
              "verification: packaged distribution smoke passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The final implementation has focused native/NVM, Windows shim, Electron bootstrap, renderer and provisioning assertions, a clean full suite and rebuilt-package smoke evidence.",
            "fact_refs": [
              "FACT-READINESS-001",
              "FACT-READINESS-002",
              "FACT-READINESS-004"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/codex-executable-resolver.test.mjs",
              "runtime/arckit-runtime/test/runtime-process-environment.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "verification: full check passed 178 with one environment-gated skip and zero failures",
              "verification: rebuilt packaged distribution smoke passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/src/codex-executable-resolver.mjs",
        "runtime/arckit-runtime/src/runtime-process-environment.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "npm --prefix runtime/arckit-runtime run check: 179 tests, 178 passed, 1 environment-gated skip, 0 failures",
        "verification: packaged app.asar CLI started under minimal GUI PATH",
        "verification: packaged distribution smoke passed with 13/7/5/1 plus one loader",
        "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg sha256 1f15620442406cabe25b8de7423d50f7b2cd752c8e16cc99d3fa492c4f164468",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T10:15:56.269Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-CODEX-EXECUTABLE-RESOLUTION",
      "GAP-PACKAGED-NODE-EXECUTION",
      "GAP-SKILL-AVAILABILITY-REPORTING",
      "CASE-20260814-003:review-finding:FINDING-ELECTRON-RUN-AS-NODE-ENV",
      "CASE-20260814-003:review-finding:FINDING-WINDOWS-CODEX-CMD-PROBE"
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
    "updated_at": "2026-08-14T10:15:56.269Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
