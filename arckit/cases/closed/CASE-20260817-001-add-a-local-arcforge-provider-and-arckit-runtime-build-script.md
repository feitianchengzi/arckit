# Add a local ArcForge provider and Arckit Runtime build script

Case: CASE-20260817-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-17T08:51:02.854Z

## User Intent

Provide a repository-local command that builds the sibling ArcForge provider and arckit-runtime so maintainers can validate Runtime behavior locally.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260817-001",
  "title": "Add a local ArcForge provider and Arckit Runtime build script",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-17T08:29:01.704Z",
  "updated_at": "2026-08-17T08:51:02.854Z",
  "user_intent": "Provide a repository-local command that builds the sibling ArcForge provider and arckit-runtime so maintainers can validate Runtime behavior locally.",
  "expected_outcome": "A documented, repeatable local build entrypoint produces the provider and Runtime artifacts needed for local arckit-runtime testing, with automated verification of the contract.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-LOCAL-BUILD-REQUEST",
      "revision": 1,
      "status": "accepted",
      "statement": "The maintainer needs one local build script that compiles the provider from sibling ../arcforge and arckit-runtime for local Runtime behavior validation.",
      "basis": "Explicit user request in the current conversation.",
      "evidence": [
        "Current user request dated 2026-08-17"
      ]
    },
    {
      "id": "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "The sibling ArcForge provider's canonical local entrypoint is npm run package:provider. It compiles the CLI/provider TypeScript with tsconfig.cli.json and writes a versioned .tgz, release manifest, and checksums to ../arcforge/release/provider-release; explicit --version, --commit, and --tag values bind local provenance.",
      "basis": "ArcForge package scripts, provider package implementation, README, and governed provider job agree.",
      "evidence": [
        "../arcforge/package.json",
        "../arcforge/scripts/build-provider-package.mjs",
        "../arcforge/.github/workflows/package.yml",
        "../arcforge/README.md"
      ]
    },
    {
      "id": "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit Runtime development reads embedded setup resources from runtime/arckit-runtime/dist-package/resources. A complete local Runtime build must feed the provider archive and matching manifest/digest into prepare-distribution.mjs with a Runtime-version-compatible release tag, generate the Electron builder config, run the distribution smoke, and invoke the host platform's package target; installers are written under runtime/arckit-runtime/release.",
      "basis": "Runtime package scripts, distribution assembly code, Desktop resource resolution, and the governed package workflow define the same sequence and outputs.",
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        ".github/workflows/arckit-runtime-package.yml"
      ]
    },
    {
      "id": "FACT-LOCAL-BUILD-GOVERNANCE",
      "revision": 1,
      "status": "accepted",
      "statement": "Locally built provider and Runtime artifacts are for development validation only. They must preserve manifest and digest checks, use signing disabled, and must not be represented as substitutes for the immutable-tagged governed release artifacts produced by the manual GitHub workflows.",
      "basis": "The ArcForge and Runtime documentation and workflows distinguish local verification from governed release packaging while using the same validation boundaries.",
      "evidence": [
        "../arcforge/README.md",
        "../arcforge/.github/workflows/package.yml",
        "runtime/arckit-runtime/README.md",
        ".github/workflows/arckit-runtime-package.yml",
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ]
    },
    {
      "id": "FACT-LOCAL-BUILD-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit Runtime provides npm run package:local as a cross-platform, host-native local validation build. It validates ArcForge and Runtime, packages a local-versioned sibling provider with commit and digest provenance, assembles local-channel unsigned Runtime resources, runs provisioning smoke, and emits only the current build's host installer in its result. The --resources-only mode prepares the same verified resources for development Desktop runs without Electron packaging.",
      "basis": "The implementation, help and README contract, pure target/argument tests, local-tag integration test, complete Runtime suite, provider test, resource smoke, distribution lock, and real macOS x64 DMG agree.",
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
        "verification: ArcForge check and embedded provider test passed 1 of 1",
        "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
        "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
        "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully"
      ]
    },
    {
      "id": "FACT-LOCAL-BUILD-IDENTITY-REPAIRED",
      "revision": 1,
      "status": "accepted",
      "statement": "Local build identity now fails closed before expensive work: build IDs use valid SemVer prerelease dot-segments without numeric leading zeroes, and result discovery matches both the local build marker and the current host's exact OS/architecture artifact suffix.",
      "basis": "Focused argument and cross-architecture artifact tests, direct reproduction checks, the existing real macOS x64 artifact, and the complete Runtime suite agree.",
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/README.md",
        "verification: local distribution build targeted tests passed 3 of 3",
        "verification: dev.01 is rejected before build planning",
        "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64",
        "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-LOCAL-BUILD-TECH",
      "fact_id": "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 14
      },
      "effect": "upheld",
      "reason": "The implementation keeps ArcForge Core/provider and Runtime resource responsibilities separate while adding an explicit local metadata lane that cannot enter governed release validation.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs"
      ]
    },
    {
      "id": "IMPACT-LOCAL-BUILD-DELIVERY",
      "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "Local outputs are labeled local, unsigned, repository-local and non-publishable while governed distributable installers remain restricted to immutable-tagged manual workflows.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        ".github/workflows/arckit-runtime-package.yml"
      ]
    },
    {
      "id": "IMPACT-LOCAL-BUILD-REALIZATION",
      "fact_id": "FACT-LOCAL-BUILD-REQUEST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The requested single local command exists and produced the provider, verified resources, and current-host Runtime installer.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
        "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully"
      ]
    },
    {
      "id": "IMPACT-LOCAL-BUILD-RISK",
      "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Fail-closed host/path/argument checks, local-only lock metadata, manifest and digest binding, provider capability checks, safe extraction, smoke convergence, full tests and a real installer build cover the material local packaging risks.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
        "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
        "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-LOCAL-BUILD-CONTRACT",
      "status": "resolved",
      "goal": "Establish the exact existing build entrypoints, output artifacts, and invocation contract for compiling the sibling ArcForge provider and arckit-runtime locally.",
      "reason": "The requested script boundary depends on repository build definitions and provider packaging behavior that are not yet accepted Case facts.",
      "derived_from": [
        "FACT-LOCAL-BUILD-REQUEST"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Current arckit-runtime and ../arcforge package scripts, provider packaging inputs, and existing distribution workflow evidence."
      ],
      "resolution": {
        "id": "GAP-LOCAL-BUILD-CONTRACT",
        "status": "resolved",
        "outcome": "The existing provider and Runtime build contracts are explicit: ArcForge compiles and packs the provider archive and manifests, while Runtime validates and embeds that archive, assembles governed resources, smoke-tests them, and invokes the current platform's Electron package target.",
        "reason": "Package scripts, provider packaging source, Runtime distribution assembly source, Desktop development resource lookup, and both governed workflows agree on the artifact and invocation boundary.",
        "evidence": [
          "../arcforge/package.json",
          "../arcforge/scripts/build-provider-package.mjs",
          "../arcforge/.github/workflows/package.yml",
          "../arcforge/README.md",
          "runtime/arckit-runtime/package.json",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/scripts/build-package-config.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          ".github/workflows/arckit-runtime-package.yml",
          "runtime/arckit-runtime/README.md"
        ],
        "occurred_at": "2026-08-17T08:32:46.954Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-LOCAL-BUILD",
      "status": "resolved",
      "goal": "Provide one cross-platform repository-local command that safely builds the sibling ArcForge provider, assembles and smoke-tests the matching Runtime resources, and produces the current host platform's unsigned Arckit Runtime installer for local validation.",
      "reason": "The accepted build contract is currently spread across two repositories and several release-oriented commands, so the maintainer still lacks the requested repeatable local entrypoint.",
      "derived_from": [
        "FACT-LOCAL-BUILD-REQUEST",
        "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
        "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
        "FACT-LOCAL-BUILD-GOVERNANCE"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "A documented local command with cross-platform path/process handling and fail-closed sibling/provider/target validation.",
        "Automated tests covering orchestration metadata, supported host target selection, and invalid local prerequisites.",
        "A real local provider build, Runtime resource smoke, host installer build, and repository checks."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-LOCAL-BUILD",
        "status": "resolved",
        "outcome": "Runtime now exposes npm run package:local, which validates both sibling repositories, builds a locally versioned ArcForge provider, assembles and smoke-tests local-only Runtime resources, and builds the current host's unsigned installer; resources-only mode supports faster Desktop testing.",
        "reason": "Unit and integration tests, complete Runtime checks, provider checks, a passing provisioning smoke, an exact provider digest, and a real macOS x64 DMG demonstrate the command and its governance boundary.",
        "evidence": [
          "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/package.json",
          "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/README.md",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/INDEX.md",
          "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
          "verification: ArcForge check and embedded provider test passed 1 of 1",
          "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
          "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
          "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
          "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully",
          "verification: arckit and ../arcforge git diff --check passed"
        ],
        "occurred_at": "2026-08-17T08:42:16.354Z"
      }
    },
    {
      "id": "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
      "status": "resolved",
      "goal": "Resolve review finding: Custom build IDs accept numeric SemVer prerelease segments with leading zeroes, causing a late packaging failure, and current artifact filtering omits the host architecture, so reusing one build ID across architectures can report another host's installer.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:2"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
        "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
      ],
      "resolution": {
        "id": "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
        "status": "resolved",
        "outcome": "Local build IDs now reject numeric dot-segments with leading zeroes before work begins, while artifact discovery requires the current host's exact Electron Builder OS/architecture suffix.",
        "reason": "Focused tests reproduce and reject dev.01, preserve valid hyphenated identifiers, reject x64 artifacts for an arm64 plan, accept the correct arm64 artifact, and the full Runtime suite remains green.",
        "evidence": [
          "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
          "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
          "runtime/arckit-runtime/README.md",
          "verification: local distribution build targeted tests passed 3 of 3",
          "verification: dev.01 is rejected before build planning",
          "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64",
          "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
          "verification: arckit and ../arcforge git diff --check passed"
        ],
        "occurred_at": "2026-08-17T08:47:56.468Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-17T08:29:01.704Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 3,
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-LOCAL-BUILD-IDENTITY"
        ],
        "evidence": [
          "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
          "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "review: content revision 2 inspected across all five completion dimensions",
          "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
          "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
        ],
        "occurred_at": "2026-08-17T08:45:06.393Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "implementation correctness: runtime/arckit-runtime/scripts/build-local-distribution.mjs composes ArcForge provider packaging, manifest/digest validation, Runtime checks, local distribution preparation, smoke validation, and exact host packaging without entering governed release metadata",
          "problem resolution: npm --prefix runtime/arckit-runtime run package:local built the sibling ../arcforge provider and a runnable macOS x64 Runtime DMG from one repository-local command",
          "verification credibility: the real local build validated provider SHA-256, capability resources, distribution smoke inventory, and produced a 97 MB DMG",
          "regression risk: npm --prefix runtime/arckit-runtime run check passed 191, failed 0, skipped 1 of 192 after the identity repair",
          "regression risk: runtime/arckit-runtime/test/local-distribution-build.test.mjs passed 3 of 3 including invalid SemVer identifiers and cross-architecture artifact exclusion",
          "minimality: changes are confined to the Runtime packaging orchestrator, package entrypoint, local tag parsing, focused tests, README, and matching technical supply-chain documentation",
          "verification: arckit and ../arcforge git diff --check passed; ../arcforge tracked worktree remains unchanged"
        ],
        "occurred_at": "2026-08-17T08:51:02.854Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
      "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
      "runtime/arckit-runtime/test/package-distribution.test.mjs",
      "review: content revision 2 inspected across all five completion dimensions",
      "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
      "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact",
      "implementation correctness: runtime/arckit-runtime/scripts/build-local-distribution.mjs composes ArcForge provider packaging, manifest/digest validation, Runtime checks, local distribution preparation, smoke validation, and exact host packaging without entering governed release metadata",
      "problem resolution: npm --prefix runtime/arckit-runtime run package:local built the sibling ../arcforge provider and a runnable macOS x64 Runtime DMG from one repository-local command",
      "verification credibility: the real local build validated provider SHA-256, capability resources, distribution smoke inventory, and produced a 97 MB DMG",
      "regression risk: npm --prefix runtime/arckit-runtime run check passed 191, failed 0, skipped 1 of 192 after the identity repair",
      "regression risk: runtime/arckit-runtime/test/local-distribution-build.test.mjs passed 3 of 3 including invalid SemVer identifiers and cross-architecture artifact exclusion",
      "minimality: changes are confined to the Runtime packaging orchestrator, package entrypoint, local tag parsing, focused tests, README, and matching technical supply-chain documentation",
      "verification: arckit and ../arcforge git diff --check passed; ../arcforge tracked worktree remains unchanged"
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
      "goal": "Read the current ArcForge provider build and Arckit Runtime distribution assembly paths and accept the exact local build contract they jointly require.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The selected Case gap is the prerequisite for safe implementation: the local script boundary cannot be fixed until the existing provider artifact, Runtime resource assembly, platform packaging, and governance contracts are explicit.",
        "snapshot_token": "4346145e10aa8d5f849198f12a8926d5568f8322c28a855fbb9a19f380cfb0be",
        "selected_ref": "case-gap:CASE-20260817-001:GAP-LOCAL-BUILD-CONTRACT",
        "comparison_summary": "The user-requested contract gap is ready, blocking, and directly relevant. The four Project gaps require separate Cases and do not determine this local build contract.",
        "fresh_discovery_summary": "Repository inspection exposed no additional prerequisite candidate; it produced evidence for the selected contract and a downstream implementation obligation that must wait for this transition.",
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
            "reason": "This broad scenario-evaluation obligation needs an independent Case and does not establish the requested build interface."
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
            "reason": "Runtime timeout, compaction, and adapter resilience are independent of the bounded local packaging entrypoint."
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
            "reason": "Real permission-bearing security validation requires a separate project context and does not block local artifact assembly."
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
            "reason": "Cross-record audit acceptance remains important but is an independent Project obligation outside this script contract."
          },
          {
            "ref": "case-gap:CASE-20260817-001:GAP-LOCAL-BUILD-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and establishes the evidence needed to define a correct, safe local build entrypoint."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-LOCAL-BUILD-CONTRACT",
        "responsibility": "agent",
        "goal": "Establish the exact existing build entrypoints, output artifacts, and invocation contract for compiling the sibling ArcForge provider and arckit-runtime locally.",
        "reason": "The requested script boundary depends on repository build definitions and provider packaging behavior that are not yet accepted Case facts.",
        "derived_from": [
          "FACT-LOCAL-BUILD-REQUEST"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "",
          "user_impact": "high"
        },
        "evidence_required": [
          "Current arckit-runtime and ../arcforge package scripts, provider packaging inputs, and existing distribution workflow evidence."
        ]
      },
      "planned_transition": {
        "goal": "Read the current ArcForge provider build and Arckit Runtime distribution assembly paths and accept the exact local build contract they jointly require.",
        "expected_state_change": "Resolve the contract uncertainty and leave one evidence-bounded implementation gap without implementing against unaccepted discoveries."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-LOCAL-BUILD-CONTRACT",
          "status": "resolved",
          "outcome": "The existing provider and Runtime build contracts are explicit: ArcForge compiles and packs the provider archive and manifests, while Runtime validates and embeds that archive, assembles governed resources, smoke-tests them, and invokes the current platform's Electron package target.",
          "reason": "Package scripts, provider packaging source, Runtime distribution assembly source, Desktop development resource lookup, and both governed workflows agree on the artifact and invocation boundary.",
          "evidence": [
            "../arcforge/package.json",
            "../arcforge/scripts/build-provider-package.mjs",
            "../arcforge/.github/workflows/package.yml",
            "../arcforge/README.md",
            "runtime/arckit-runtime/package.json",
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/scripts/build-package-config.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            ".github/workflows/arckit-runtime-package.yml",
            "runtime/arckit-runtime/README.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "The sibling ArcForge provider's canonical local entrypoint is npm run package:provider. It compiles the CLI/provider TypeScript with tsconfig.cli.json and writes a versioned .tgz, release manifest, and checksums to ../arcforge/release/provider-release; explicit --version, --commit, and --tag values bind local provenance.",
            "basis": "ArcForge package scripts, provider package implementation, README, and governed provider job agree.",
            "evidence": [
              "../arcforge/package.json",
              "../arcforge/scripts/build-provider-package.mjs",
              "../arcforge/.github/workflows/package.yml",
              "../arcforge/README.md"
            ]
          },
          {
            "id": "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit Runtime development reads embedded setup resources from runtime/arckit-runtime/dist-package/resources. A complete local Runtime build must feed the provider archive and matching manifest/digest into prepare-distribution.mjs with a Runtime-version-compatible release tag, generate the Electron builder config, run the distribution smoke, and invoke the host platform's package target; installers are written under runtime/arckit-runtime/release.",
            "basis": "Runtime package scripts, distribution assembly code, Desktop resource resolution, and the governed package workflow define the same sequence and outputs.",
            "evidence": [
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ]
          },
          {
            "id": "FACT-LOCAL-BUILD-GOVERNANCE",
            "revision": 1,
            "status": "accepted",
            "statement": "Locally built provider and Runtime artifacts are for development validation only. They must preserve manifest and digest checks, use signing disabled, and must not be represented as substitutes for the immutable-tagged governed release artifacts produced by the manual GitHub workflows.",
            "basis": "The ArcForge and Runtime documentation and workflows distinguish local verification from governed release packaging while using the same validation boundaries.",
            "evidence": [
              "../arcforge/README.md",
              "../arcforge/.github/workflows/package.yml",
              "runtime/arckit-runtime/README.md",
              ".github/workflows/arckit-runtime-package.yml",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-LOCAL-BUILD-TECH",
            "fact_id": "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 13
            },
            "effect": "upheld",
            "reason": "The existing local build contract preserves the versioned ArcForge provider boundary, Runtime resource assembly, and Electron host structure already recorded by the technical foundation.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/scripts/build-provider-package.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/desktop/main.mjs"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-DELIVERY",
            "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The local validation path remains explicitly separate from immutable-tagged, operator-authorized release packaging.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/README.md",
              "runtime/arckit-runtime/README.md",
              "../arcforge/.github/workflows/package.yml",
              ".github/workflows/arckit-runtime-package.yml"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-REALIZATION",
            "fact_id": "FACT-LOCAL-BUILD-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The necessary build chain exists as separate commands, but the requested single repeatable repository-local entrypoint has not yet been implemented.",
            "gap_ids": [
              "GAP-IMPLEMENT-LOCAL-BUILD"
            ],
            "evidence": [
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-RISK",
            "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The future local entrypoint must preserve provenance, digest, target, and local-only labeling checks; no integrated implementation evidence exists yet.",
            "gap_ids": [
              "GAP-IMPLEMENT-LOCAL-BUILD"
            ],
            "evidence": [
              "../arcforge/scripts/build-provider-package.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-LOCAL-BUILD",
            "status": "open",
            "goal": "Provide one cross-platform repository-local command that safely builds the sibling ArcForge provider, assembles and smoke-tests the matching Runtime resources, and produces the current host platform's unsigned Arckit Runtime installer for local validation.",
            "reason": "The accepted build contract is currently spread across two repositories and several release-oriented commands, so the maintainer still lacks the requested repeatable local entrypoint.",
            "derived_from": [
              "FACT-LOCAL-BUILD-REQUEST",
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
              "FACT-LOCAL-BUILD-GOVERNANCE"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "A documented local command with cross-platform path/process handling and fail-closed sibling/provider/target validation.",
              "Automated tests covering orchestration metadata, supported host target selection, and invalid local prerequisites.",
              "A real local provider build, Runtime resource smoke, host installer build, and repository checks."
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
        "project_revision": 72,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The accepted facts establish a maintainer-local build convenience contract without changing Runtime product behavior, capabilities, business rules, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The contract concerns developer build orchestration and does not alter end-user actions, states, feedback, navigation, or recovery journeys.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual token, layout, theme, component presentation, or durable visual rule is affected by the local build contract.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Provider compilation, archive provenance, Runtime resource assembly, development resource lookup, smoke verification, and platform packaging relationships are directly recoverable from durable source and workflow evidence.",
            "fact_refs": [
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
              "FACT-LOCAL-BUILD-GOVERNANCE"
            ],
            "evidence": [
              "../arcforge/scripts/build-provider-package.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "../arcforge/.github/workflows/package.yml",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted request is not yet realized because the build chain has no single repository-local orchestration entrypoint.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REQUEST",
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-LOCAL-BUILD"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "An integrated local command could accidentally weaken provenance or release-boundary checks unless its implementation and a real host build prove those checks remain intact.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-LOCAL-BUILD"
            ]
          }
        ]
      },
      "evidence": [
        "../arcforge/package.json",
        "../arcforge/scripts/build-provider-package.mjs",
        "../arcforge/.github/workflows/package.yml",
        "../arcforge/README.md",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T08:32:46.954Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and document the local provider-plus-Runtime build entrypoint, preserve local/release governance boundaries, and verify it with automated checks and a real host-native installer build.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The build contract is now accepted, making the single ready implementation gap agent-owned, unblocked, directly user-visible, and fully verifiable on the current host.",
        "snapshot_token": "ee0678aedbf360de5bdad9c79ec13dd9a3890b124edddec2041e27c9117ba0b3",
        "selected_ref": "case-gap:CASE-20260817-001:GAP-IMPLEMENT-LOCAL-BUILD",
        "comparison_summary": "The local build implementation is the only ready Case candidate and directly realizes the accepted request. The four Project candidates remain independent Case-required obligations.",
        "fresh_discovery_summary": "Implementation and real-build verification did not expose another prerequisite or downstream product obligation; one result-reporting precision issue was corrected inside the selected claim before acceptance.",
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
            "reason": "This broad scenario-evaluation obligation remains independent of the bounded local build implementation."
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
            "reason": "Runtime timeout, compaction, and adapter resilience are not prerequisites for assembling local provider and installer artifacts."
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
            "reason": "Permission-bearing security validation requires a separate real project and is outside this local build command."
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
            "reason": "Strict cross-record audit acceptance remains a separate Project-level validation Case."
          },
          {
            "ref": "case-gap:CASE-20260817-001:GAP-IMPLEMENT-LOCAL-BUILD",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and its accepted contract permits implementation and real host verification in one claim."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-LOCAL-BUILD",
        "responsibility": "agent",
        "goal": "Provide one cross-platform repository-local command that safely builds the sibling ArcForge provider, assembles and smoke-tests the matching Runtime resources, and produces the current host platform's unsigned Arckit Runtime installer for local validation.",
        "reason": "The accepted build contract is currently spread across two repositories and several release-oriented commands, so the maintainer still lacks the requested repeatable local entrypoint.",
        "derived_from": [
          "FACT-LOCAL-BUILD-REQUEST",
          "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
          "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
          "FACT-LOCAL-BUILD-GOVERNANCE"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "A documented local command with cross-platform path/process handling and fail-closed sibling/provider/target validation.",
          "Automated tests covering orchestration metadata, supported host target selection, and invalid local prerequisites.",
          "A real local provider build, Runtime resource smoke, host installer build, and repository checks."
        ]
      },
      "planned_transition": {
        "goal": "Implement and document the local provider-plus-Runtime build entrypoint, preserve local/release governance boundaries, and verify it with automated checks and a real host-native installer build.",
        "expected_state_change": "Resolve the requested build gap with a repeatable command, durable technical facts, tested failure boundaries, and direct macOS x64 artifact evidence."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-LOCAL-BUILD",
          "status": "resolved",
          "outcome": "Runtime now exposes npm run package:local, which validates both sibling repositories, builds a locally versioned ArcForge provider, assembles and smoke-tests local-only Runtime resources, and builds the current host's unsigned installer; resources-only mode supports faster Desktop testing.",
          "reason": "Unit and integration tests, complete Runtime checks, provider checks, a passing provisioning smoke, an exact provider digest, and a real macOS x64 DMG demonstrate the command and its governance boundary.",
          "evidence": [
            "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/package.json",
            "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/README.md",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "arckit/tech/INDEX.md",
            "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
            "verification: ArcForge check and embedded provider test passed 1 of 1",
            "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
            "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
            "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
            "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully",
            "verification: arckit and ../arcforge git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOCAL-BUILD-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit Runtime provides npm run package:local as a cross-platform, host-native local validation build. It validates ArcForge and Runtime, packages a local-versioned sibling provider with commit and digest provenance, assembles local-channel unsigned Runtime resources, runs provisioning smoke, and emits only the current build's host installer in its result. The --resources-only mode prepares the same verified resources for development Desktop runs without Electron packaging.",
            "basis": "The implementation, help and README contract, pure target/argument tests, local-tag integration test, complete Runtime suite, provider test, resource smoke, distribution lock, and real macOS x64 DMG agree.",
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/README.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
              "verification: ArcForge check and embedded provider test passed 1 of 1",
              "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
              "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-LOCAL-BUILD-TECH",
            "fact_id": "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 14
            },
            "effect": "upheld",
            "reason": "The implementation keeps ArcForge Core/provider and Runtime resource responsibilities separate while adding an explicit local metadata lane that cannot enter governed release validation.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-DELIVERY",
            "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "Local outputs are labeled local, unsigned, repository-local and non-publishable while governed distributable installers remain restricted to immutable-tagged manual workflows.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-REALIZATION",
            "fact_id": "FACT-LOCAL-BUILD-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The requested single local command exists and produced the provider, verified resources, and current-host Runtime installer.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
              "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully"
            ]
          },
          {
            "id": "IMPACT-LOCAL-BUILD-RISK",
            "fact_id": "FACT-LOCAL-BUILD-GOVERNANCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Fail-closed host/path/argument checks, local-only lock metadata, manifest and digest binding, provider capability checks, safe extraction, smoke convergence, full tests and a real installer build cover the material local packaging risks.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
              "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192"
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
            "area_ref": "technical_foundation",
            "observed_revision": 13,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron Desktop host, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3. Runtime packages trusted capabilities separately from an Arckit skill payload and a versioned ArcForge Embedded Provider; Desktop Setup Readiness owns provisioning while the policy-neutral Runtime Kernel continues natural $using-arckit execution. ArcForge Core is the sole implementation of overlapping provisioning semantics, including typed source-upgrade assessment, last-applied target evidence, managed repair/migration and transactional backup/restore; CLI, Desktop and Embedded Provider are adapters, and Runtime consumes capability-gated provider artifacts without deriving installation targets or drift classes. Repository-local validation reuses these boundaries through explicit local metadata and unsigned host-native artifacts, and its local refs cannot enter governed release-trigger validation.",
              "reason": "The accepted local build implementation makes the development-only provider and Runtime assembly lane explicit without duplicating provisioning semantics or weakening release validation.",
              "evidence": [
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
                "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
                "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
                "runtime/arckit-runtime/test/package-distribution.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The technical foundation now distinguishes a validated local build lane from the unchanged governed release validator.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and synchronized to supported Codex targets through governed availability-aware installation. Governed Runtime/Desktop installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A separate repository-local validation entrypoint may build current-host unsigned artifacts only when their provider, Runtime metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by the governed workflows.",
              "reason": "The local build command gives maintainers executable validation evidence while preserving operator-authorized immutable-tag distribution as the only governed release lane.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "delivery/skills/arckit-git-branching/references/platform-release-triggers.md",
                "runtime/arckit-runtime/README.md",
                "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
                ".github/workflows/arckit-runtime-package.yml"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The delivery decision now explicitly separates non-release local validation artifacts from governed distributable installers.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/README.md",
          ".github/workflows/arckit-runtime-package.yml",
          "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64"
        ]
      },
      "invariant_assessment": {
        "project_revision": 72,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The implementation adds a maintainer-local engineering entrypoint without changing Runtime product outcomes, end-user capabilities, business rules, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The maintainer command, supported host modes, help output, resources-only continuation, result locations, and fail-closed argument behavior are durably recoverable.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: npm --prefix runtime/arckit-runtime run package:local -- --help passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The local CLI build entrypoint does not establish or revise visual tokens, layout, theme, component presentation, or platform visual rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The local provider/runtime orchestration, host mapping, provenance, local metadata lane, release-validator exclusion and governance rationale are aligned across the technical source, code, tests and command documentation.",
            "fact_refs": [
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The requested single command produced the exact local provider, verified Runtime resources, and a current-host unsigned installer, while resources-only behavior is directly covered by the plan tests and smoke path.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REQUEST",
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
              "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
              "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Cross-platform host selection and invalid-input tests, local-tag integration, manifest/digest/capability enforcement, complete repository checks, resource convergence and real host packaging provide repeatable proportionate evidence for the material risks.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "verification: ArcForge check and embedded provider test passed 1 of 1",
              "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
              "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
              "verification: arckit and ../arcforge git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "verification: npm --prefix runtime/arckit-runtime run package:local -- --build-id 20260817.1 passed on macOS x64",
        "verification: ArcForge check and embedded provider test passed 1 of 1",
        "verification: provider 0.1.8-local.20260817.1 SHA-256 391b9d8c827d5672c6eda7381c6353ebd0cb9aef53f7ccd47c080235f1721593",
        "verification: distribution smoke passed with missing 0, changed 0, same 14, shared asset installed",
        "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
        "verification: Arckit-Runtime-0.1.0-local.20260817.1-local-20260817.1-mac-x64.dmg built successfully",
        "verification: arckit and ../arcforge git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T08:42:16.354Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 2 for implementation correctness, problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary gaps and state impacts are closed, so the derived completion review is the only ready Case candidate and the required terminal semantic check.",
        "snapshot_token": "231037e17f26fa7571a9b03199bf7abaf3e777ca1f8facace5b7b22cf9c6a4e5",
        "selected_ref": "case-gap:CASE-20260817-001:CASE-20260817-001:completion-review:1",
        "comparison_summary": "The completion review is the only ready Case candidate. Each Project gap requires a separate Case and does not supersede review of this completed implementation.",
        "fresh_discovery_summary": "Review found one bounded build-identity correctness issue covering custom SemVer identifiers and same-id cross-architecture artifact attribution.",
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
            "reason": "The broad scenario-evaluation Project gap remains separate from this implementation review."
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
            "reason": "Runtime resilience work is a separate Case and does not replace completion review of this local build command."
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
            "reason": "Permission-bearing validation requires a different project context and is not part of this review."
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
            "reason": "Cross-record audit acceptance is an independent Project obligation."
          },
          {
            "ref": "case-gap:CASE-20260817-001:CASE-20260817-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case action and must assess the current content revision before resolution."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-001:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:2"
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
        "goal": "Review content revision 2 for implementation correctness, problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record actionable findings as ordinary repair gaps or mark the reviewed revision clean without changing implementation content."
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-LOCAL-BUILD-IDENTITY",
              "kind": "error",
              "statement": "Custom build IDs accept numeric SemVer prerelease segments with leading zeroes, causing a late packaging failure, and current artifact filtering omits the host architecture, so reusing one build ID across architectures can report another host's installer.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
                "runtime/arckit-runtime/test/local-distribution-build.test.mjs"
              ],
              "evidence": [
                "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
                "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
              ]
            }
          ],
          "evidence": [
            "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
            "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "review: content revision 2 inspected across all five completion dimensions",
            "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
            "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
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
        "project_revision": 73,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The review finding affects local build identity validation, not Runtime product outcomes, end-user capabilities, business rules, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The documented custom build-id option can accept an identifier that later fails packaging, and result attribution is ambiguous when the same ID exists for another architecture.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The finding does not affect visual tokens, layout, theme, component presentation, or visual platform rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The intended local identity contract is clear, but validation and artifact attribution do not yet enforce it for all documented inputs.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The default real build succeeds, but the accepted claim that the command fails closed and emits only the current host artifact is not true for the two reviewed identity edge cases.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Existing tests do not cover SemVer-invalid custom IDs or same-ID cross-architecture artifact filtering, so the local identity risk needs focused regression evidence.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "review: content revision 2 inspected across all five completion dimensions",
        "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
        "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T08:45:06.393Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Reject SemVer-invalid numeric build-id segments before checks or packaging, bind artifact discovery to the current OS/architecture suffix, and add focused regressions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The completion review finding is the only ready Case gap and directly threatens documented fail-closed identity validation and current-host artifact attribution.",
        "snapshot_token": "af15ed96446805ea8068add3a97ab37f46374482061a1d21828ba768ece4dd06",
        "selected_ref": "case-gap:CASE-20260817-001:CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
        "comparison_summary": "The review repair is the sole ready Case candidate and blocks a clean completion review. The four Project gaps remain separate Case-required work.",
        "fresh_discovery_summary": "Focused repair and regression execution exposed no additional local build identity or packaging obligation.",
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
            "reason": "The Project scenario-evaluation gap is independent of this focused review repair."
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
            "reason": "Broader Runtime resilience remains outside local artifact identity correction."
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
            "reason": "Permission-bearing security validation requires another project context."
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
            "reason": "Cross-record audit acceptance remains a distinct Project Case."
          },
          {
            "ref": "case-gap:CASE-20260817-001:CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "It is the only ready Case candidate and is fully bounded by two reproducible identity failures."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
        "responsibility": "agent",
        "goal": "Resolve review finding: Custom build IDs accept numeric SemVer prerelease segments with leading zeroes, causing a late packaging failure, and current artifact filtering omits the host architecture, so reusing one build ID across architectures can report another host's installer.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:2"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
          "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
          "review reproduction: build id dev.01 passes assertBuildId while semver.valid(0.1.8-local.dev.01) returns null",
          "review reproduction: a macOS arm64 plan accepts a same-build-id macOS x64 DMG in isCurrentLocalArtifact"
        ]
      },
      "planned_transition": {
        "goal": "Reject SemVer-invalid numeric build-id segments before checks or packaging, bind artifact discovery to the current OS/architecture suffix, and add focused regressions.",
        "expected_state_change": "Resolve the review finding with early identity validation and exact current-host artifact attribution."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY",
          "status": "resolved",
          "outcome": "Local build IDs now reject numeric dot-segments with leading zeroes before work begins, while artifact discovery requires the current host's exact Electron Builder OS/architecture suffix.",
          "reason": "Focused tests reproduce and reject dev.01, preserve valid hyphenated identifiers, reject x64 artifacts for an arm64 plan, accept the correct arm64 artifact, and the full Runtime suite remains green.",
          "evidence": [
            "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
            "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
            "runtime/arckit-runtime/README.md",
            "verification: local distribution build targeted tests passed 3 of 3",
            "verification: dev.01 is rejected before build planning",
            "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64",
            "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
            "verification: arckit and ../arcforge git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOCAL-BUILD-IDENTITY-REPAIRED",
            "revision": 1,
            "status": "accepted",
            "statement": "Local build identity now fails closed before expensive work: build IDs use valid SemVer prerelease dot-segments without numeric leading zeroes, and result discovery matches both the local build marker and the current host's exact OS/architecture artifact suffix.",
            "basis": "Focused argument and cross-architecture artifact tests, direct reproduction checks, the existing real macOS x64 artifact, and the complete Runtime suite agree.",
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "runtime/arckit-runtime/README.md",
              "verification: local distribution build targeted tests passed 3 of 3",
              "verification: dev.01 is rejected before build planning",
              "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192"
            ]
          }
        ],
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
            "id": "CR-LOCAL-BUILD-IDENTITY",
            "resolution": "resolved",
            "reason": "Build IDs are validated as SemVer prerelease components and artifact results are constrained to the current host architecture.",
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: local distribution build targeted tests passed 3 of 3",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192"
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
        "project_revision": 73,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The identity repair does not change Runtime product outcomes, end-user capabilities, business rules, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Documented custom build IDs now reject invalid SemVer numeric segments immediately, and the result reports only the selected host's artifact.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair does not affect visual tokens, layout, theme, component presentation, or visual platform rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Build identity now maps deterministically from a valid local SemVer identifier and supported host tuple to exactly one platform artifact suffix.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The two edge cases that invalidated exact fail-closed and current-host result claims are repaired and directly regression-tested.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: dev.01 is rejected before build planning",
              "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused reproductions are now permanent regression tests and the complete Runtime suite plus diff checks show no broader regression.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: local distribution build targeted tests passed 3 of 3",
              "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
              "verification: arckit and ../arcforge git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/README.md",
        "verification: local distribution build targeted tests passed 3 of 3",
        "verification: dev.01 is rejected before build planning",
        "verification: macOS x64 plan matches only the existing local mac-x64 DMG and excludes mac-arm64",
        "verification: Arckit Runtime check passed 191, failed 0, skipped 1 of 192",
        "verification: arckit and ../arcforge git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T08:47:56.468Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the fresh five-dimension semantic completion review against content revision 3.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and the single prior review finding are resolved at content revision 3; the fresh completion review is the only ready Case-local obligation and is required before closeout.",
        "snapshot_token": "79ba755310ea026e84bda820d215b4e0813f1b760569edc9c39a2604516d615f",
        "selected_ref": "case-gap:CASE-20260817-001:CASE-20260817-001:completion-review:2",
        "comparison_summary": "The completion review directly gates the requested local-build Case. Four unrelated Project gaps require separate Cases and do not supersede this ready closeout obligation.",
        "fresh_discovery_summary": "Review of the repaired implementation, documentation, tests, real host package, and full Runtime verification found no new ordinary gap or state impact.",
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
            "reason": "This repository-wide scenario evaluation needs a separate Case and is not required to validate the local provider/Runtime build lane."
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
            "reason": "Runtime resilience and adapter expansion remains separate from the bounded local packaging workflow completed here."
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
            "reason": "Permission-bearing real-project security validation requires a separate controlled project and does not block local build verification."
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
            "reason": "Cross-record audit acceptance is a broader ledger-governance Case and is not introduced or worsened by this implementation."
          },
          {
            "ref": "case-gap:CASE-20260817-001:CASE-20260817-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case-local obligation and clean completion is required to resolve the user's requested delivery."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-001:completion-review:2",
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
        "goal": "Perform the fresh five-dimension semantic completion review against content revision 3.",
        "expected_state_change": "Record a clean review with no findings and resolve the Case without changing its accepted content or Project State."
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "implementation correctness: runtime/arckit-runtime/scripts/build-local-distribution.mjs composes ArcForge provider packaging, manifest/digest validation, Runtime checks, local distribution preparation, smoke validation, and exact host packaging without entering governed release metadata",
            "problem resolution: npm --prefix runtime/arckit-runtime run package:local built the sibling ../arcforge provider and a runnable macOS x64 Runtime DMG from one repository-local command",
            "verification credibility: the real local build validated provider SHA-256, capability resources, distribution smoke inventory, and produced a 97 MB DMG",
            "regression risk: npm --prefix runtime/arckit-runtime run check passed 191, failed 0, skipped 1 of 192 after the identity repair",
            "regression risk: runtime/arckit-runtime/test/local-distribution-build.test.mjs passed 3 of 3 including invalid SemVer identifiers and cross-architecture artifact exclusion",
            "minimality: changes are confined to the Runtime packaging orchestrator, package entrypoint, local tag parsing, focused tests, README, and matching technical supply-chain documentation",
            "verification: arckit and ../arcforge git diff --check passed; ../arcforge tracked worktree remains unchanged"
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
        "project_revision": 73,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The completion review records no new product outcome, business rule, user capability, or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The documented command, optional resources-only path, clear local-only result, and fail-fast identity validation preserve a recoverable maintainer interaction.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The completion review and local build workflow do not alter any visual surface, token, layout, theme, or component presentation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The final implementation and technical record consistently explain source selection, local metadata, validation reuse, signing isolation, and deterministic host artifact identity.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "One command demonstrably builds and embeds the sibling provider, verifies the Runtime distribution, and packages only the current host artifact under local-only metadata.",
            "fact_refs": [
              "FACT-LOCAL-PROVIDER-BUILD-CONTRACT",
              "FACT-LOCAL-RUNTIME-BUILD-CONTRACT",
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
              "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
              "verification: real macOS x64 provider and Runtime DMG build completed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Real packaging, digest and capability smoke checks, focused edge-case tests, the complete Runtime suite, and clean diff checks credibly cover the material local-build and release-isolation risks.",
            "fact_refs": [
              "FACT-LOCAL-BUILD-GOVERNANCE",
              "FACT-LOCAL-BUILD-REALIZED",
              "FACT-LOCAL-BUILD-IDENTITY-REPAIRED"
            ],
            "evidence": [
              "verification: provider archive SHA-256 matched its manifest",
              "verification: distribution smoke missing 0 and changed 0",
              "verification: Runtime check passed 191, failed 0, skipped 1 of 192",
              "verification: targeted local distribution tests passed 3 of 3",
              "verification: arckit and ../arcforge git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/build-local-distribution.mjs",
        "runtime/arckit-runtime/test/local-distribution-build.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: real macOS x64 local provider and Runtime build succeeded",
        "verification: Runtime check passed 191, failed 0, skipped 1 of 192",
        "verification: local distribution targeted tests passed 3 of 3",
        "verification: arckit and ../arcforge git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T08:51:02.854Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-LOCAL-BUILD-CONTRACT",
      "GAP-IMPLEMENT-LOCAL-BUILD",
      "CASE-20260817-001:review-finding:CR-LOCAL-BUILD-IDENTITY"
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
    "updated_at": "2026-08-17T08:51:02.854Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
