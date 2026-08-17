# Restore Setup Readiness recovery actions for changed managed skills

Case: CASE-20260817-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-17T15:14:29.006Z

## User Intent

Ensure ArcOrbit Setup Readiness always offers a safe, applicable recovery action when an installed managed skill differs from the bundled payload, including a confirmed bundled-content reinstall fallback.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260817-003",
  "title": "Restore Setup Readiness recovery actions for changed managed skills",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-17T14:42:20.124Z",
  "updated_at": "2026-08-17T15:14:29.006Z",
  "user_intent": "Ensure ArcOrbit Setup Readiness always offers a safe, applicable recovery action when an installed managed skill differs from the bundled payload, including a confirmed bundled-content reinstall fallback.",
  "expected_outcome": "A changed arckit-development-ledger installation can be resolved from the upgrade recovery screen without leaving the user trapped; every blocking classification exposes at least one bounded recovery path and tests prove the fallback behavior.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-SETUP-RECOVERY-NO-ACTION",
      "revision": 1,
      "status": "accepted",
      "statement": "In a locally built ArcOrbit launch, Setup Readiness detects changed content at /Users/Glare/.codex/skills/arckit-development-ledger, displays that it will not overwrite it automatically, then reaches “需要选择升级恢复方式” with only exit and recheck actions, so the user cannot continue or restore from the bundled application content.",
      "basis": "Direct user reproduction against the current local ArcOrbit installer, including the affected skill and target path.",
      "evidence": [
        "Current user report dated 2026-08-17"
      ]
    },
    {
      "id": "FACT-SETUP-RECOVERY-ROOT-CAUSE",
      "revision": 1,
      "status": "accepted",
      "statement": "After the product rename, ArcOrbit uses /Users/Glare/Library/Application Support/@arckit/arcorbit as its provisioning consumer root while the existing relationship remains under the prior @arckit/runtime consumer root. With the bundled source already current, arckit-development-ledger is ordinary changed drift and is also assessed as unowned; ArcOrbit publishes source_upgrade=null and can_recover=false, so renderer recovery controls are absent.",
      "basis": "Direct read-only execution of the packaged ArcForge provider and the current ArcOrbit SkillProvisioningManager against the reproduced local state, corroborated by the exact manager and renderer branches.",
      "evidence": [
        "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
        "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
      ]
    },
    {
      "id": "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Every blocking Setup Readiness conflict must offer at least one applicable handling path; when no narrower managed repair is available, the user must be able to explicitly confirm a safe fallback that backs up the current target and reinstalls the content bundled with the current ArcOrbit application.",
      "basis": "Explicit user expectation in the current Case request.",
      "evidence": [
        "Current user request dated 2026-08-17"
      ]
    },
    {
      "id": "FACT-SETUP-RECOVERY-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit preserves the pre-rename Electron userData identity, classifies ordinary changed targets through the ArcForge provider, exposes managed restore or explicit backup-and-reinstall according to provider capability, and offers bounded external recovery guidance when automated recovery is unavailable. ArcForge keeps unmanaged targets outside ordinary apply and performs the fallback as backup, bundled-source replacement, Core apply, relation establishment, and rollback-safe verification.",
      "basis": "Direct source and stable interaction/technical fact-source changes across ArcOrbit and ArcForge, with capability-gated API projection and no renderer-owned provisioning inference.",
      "evidence": [
        "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
        "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
        "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
        "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries."
      ]
    },
    {
      "id": "FACT-SETUP-RECOVERY-VERIFIED",
      "revision": 1,
      "status": "accepted",
      "statement": "The reported arckit-development-ledger dead end is resolved in the local packaged application: the conflict has an applicable backup-and-reinstall action, the prior content is preserved, bundled content and a new relationship are committed, and readiness converges to ready without touching the live user installation during verification.",
      "basis": "Passing full and focused automated suites plus a disposable-home execution against the provider and payload embedded in the built ArcOrbit application.",
      "evidence": [
        "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
        "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
        "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
        "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SETUP-RECOVERY-INTERACTION",
      "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "The stable Setup Readiness interaction now guarantees an applicable recovery or external handling action and the renderer exposes the provider-backed bundled reinstall fallback.",
      "gap_ids": [],
      "evidence": [
        "Current user report dated 2026-08-17",
        "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
        "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
        "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
        "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
        "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
        "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
        "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
        "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
        "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
        "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
      ]
    },
    {
      "id": "IMPACT-SETUP-RECOVERY-REALIZATION",
      "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Automated and packaged-resource evidence shows the accepted fallback behavior is realized for the reported skill without modifying the live installation.",
      "gap_ids": [],
      "evidence": [
        "Current user report dated 2026-08-17",
        "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
        "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
        "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
        "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
        "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
        "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
        "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
        "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
        "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
        "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
      ]
    },
    {
      "id": "IMPACT-SETUP-RECOVERY-TECHNICAL",
      "fact_id": "FACT-SETUP-RECOVERY-ROOT-CAUSE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The durable technical source now makes stable userData identity and the ArcOrbit/ArcForge recovery transaction boundary explicit, and implementation follows that boundary.",
      "gap_ids": [],
      "evidence": [
        "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
        "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
        "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
        "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
        "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
        "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
        "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
        "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
        "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
        "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-SETUP-RECOVERY-DIAGNOSIS",
      "status": "resolved",
      "goal": "Identify and prove the exact code and state-classification cause that leaves a changed managed skill with no applicable recovery action on the Setup Readiness upgrade-recovery screen.",
      "reason": "A safe fix depends on whether the missing action originates in provider classification, plan construction, main-process capability exposure, or renderer visibility logic.",
      "derived_from": [
        "FACT-SETUP-RECOVERY-NO-ACTION"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "A stable automated reproduction matching the reported changed-skill state and UI action set, plus code-path evidence that excludes competing classification and IPC hypotheses."
      ],
      "resolution": {
        "id": "GAP-SETUP-RECOVERY-DIAGNOSIS",
        "status": "resolved",
        "outcome": "The dead end is caused by the ArcOrbit consumer-root identity change combined with the ordinary drift branch's unconditional changed-target conflict and false recovery capability, not by IPC loss or renderer event failure.",
        "reason": "The packaged provider and the readiness manager independently reproduced the exact path, classification, public snapshot, and action outcome reported by the user.",
        "evidence": [
          "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
          "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
        ],
        "occurred_at": "2026-08-17T14:48:01.270Z"
      }
    },
    {
      "id": "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
      "status": "resolved",
      "goal": "Implement a safe Setup Readiness recovery path for ordinary changed or unowned targets so every blocking classification exposes an applicable action, including an explicit backup-and-reinstall-from-current-bundle fallback, then verify the reported arckit-development-ledger path end to end.",
      "reason": "The renamed ArcOrbit consumer root has no saved ArcForge relationship, and the ordinary drift branch currently exposes neither provider classification nor a recovery capability; recovery semantics must preserve content before a confirmed bundled reinstall and establish a valid post-recovery relationship.",
      "derived_from": [
        "FACT-SETUP-RECOVERY-NO-ACTION",
        "FACT-SETUP-RECOVERY-ROOT-CAUSE",
        "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
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
        "Interaction source and implementation expose at least one applicable recovery action for every blocking conflict classification.",
        "Automated tests prove explicit confirmation, backup preservation, bundled-content reinstall, relation establishment, stale assessment rejection, rollback behavior, and unchanged safe managed-upgrade recovery.",
        "A packaged-resource reproduction of /Users/Glare/.codex/skills/arckit-development-ledger reaches an actionable snapshot and a disposable-home end-to-end recovery reaches ready without modifying the user's live installed skill."
      ],
      "resolution": {
        "id": "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
        "status": "resolved",
        "outcome": "Setup Readiness now preserves the prior consumer identity and offers provider-backed managed restore, confirmed backup-and-reinstall from the current bundle, or explicit external recovery guidance; the exact reported skill converges to ready in packaged-resource verification.",
        "reason": "Stable interaction and technical sources, implementation tests, provider tests, distribution smoke, packaged asar inspection, and a disposable-home end-to-end recovery all agree.",
        "evidence": [
          "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
          "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
          "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
          "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
          "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
          "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
          "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
          "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
        ],
        "occurred_at": "2026-08-17T15:08:20.999Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-17T14:42:20.124Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 2,
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
        "outcome": "clean",
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
          "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation.",
          "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources.",
          "DMG SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d."
        ],
        "occurred_at": "2026-08-17T15:14:29.006Z"
      }
    ],
    "evidence": [
      "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
      "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation.",
      "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources.",
      "DMG SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d."
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
      "goal": "Prove the exact state and code path that removes all recovery actions for the reported changed managed skill.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh canonical Project and Case state place the reproduced high-impact diagnosis gap ahead of broader project obligations because it directly blocks recovery implementation.",
        "snapshot_token": "3f424ba436d7cb2a2e93e69842254e302d63bddf06f3d89b9cb74af1a9a3f7d2",
        "selected_ref": "case-gap:CASE-20260817-003:GAP-SETUP-RECOVERY-DIAGNOSIS",
        "comparison_summary": "Compared the ready diagnosis gap with all four persisted Project gaps; only the diagnosis gap is in the active Case, directly user-blocking, and immediately verifiable without opening another Case.",
        "fresh_discovery_summary": "No higher-priority fresh gap was discovered; the investigation instead produced a bounded downstream implementation gap after resolving the selected diagnosis.",
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
            "reason": "Broader evaluation work remains valuable but does not explain or unblock the reproduced Setup Readiness dead end."
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
            "reason": "Broader runtime resilience work is deferred while the active user-blocking recovery defect has a bounded Case gap."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This separate project validation obligation is outside the active changed-skill recovery Case."
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
            "reason": "Cross-record audit remains deferred because it does not unblock the exact recovery classification defect."
          },
          {
            "ref": "case-gap:CASE-20260817-003:GAP-SETUP-RECOVERY-DIAGNOSIS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This ready Case gap directly blocks a safe implementation and now has an exact read-only reproduction across provider, manager, and renderer state."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SETUP-RECOVERY-DIAGNOSIS",
        "responsibility": "agent",
        "goal": "Identify and prove the exact code and state-classification cause that leaves a changed managed skill with no applicable recovery action on the Setup Readiness upgrade-recovery screen.",
        "reason": "A safe fix depends on whether the missing action originates in provider classification, plan construction, main-process capability exposure, or renderer visibility logic.",
        "derived_from": [
          "FACT-SETUP-RECOVERY-NO-ACTION"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "A stable automated reproduction matching the reported changed-skill state and UI action set, plus code-path evidence that excludes competing classification and IPC hypotheses."
        ]
      },
      "planned_transition": {
        "goal": "Prove the exact state and code path that removes all recovery actions for the reported changed managed skill.",
        "expected_state_change": "Accept the reproduced root cause, resolve the diagnosis gap, and leave one implementation gap that binds the threatened interaction, realization, technical, and risk obligations."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SETUP-RECOVERY-DIAGNOSIS",
          "status": "resolved",
          "outcome": "The dead end is caused by the ArcOrbit consumer-root identity change combined with the ordinary drift branch's unconditional changed-target conflict and false recovery capability, not by IPC loss or renderer event failure.",
          "reason": "The packaged provider and the readiness manager independently reproduced the exact path, classification, public snapshot, and action outcome reported by the user.",
          "evidence": [
            "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
            "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SETUP-RECOVERY-ROOT-CAUSE",
            "revision": 1,
            "status": "accepted",
            "statement": "After the product rename, ArcOrbit uses /Users/Glare/Library/Application Support/@arckit/arcorbit as its provisioning consumer root while the existing relationship remains under the prior @arckit/runtime consumer root. With the bundled source already current, arckit-development-ledger is ordinary changed drift and is also assessed as unowned; ArcOrbit publishes source_upgrade=null and can_recover=false, so renderer recovery controls are absent.",
            "basis": "Direct read-only execution of the packaged ArcForge provider and the current ArcOrbit SkillProvisioningManager against the reproduced local state, corroborated by the exact manager and renderer branches.",
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ]
          },
          {
            "id": "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Every blocking Setup Readiness conflict must offer at least one applicable handling path; when no narrower managed repair is available, the user must be able to explicitly confirm a safe fallback that backs up the current target and reinstalls the content bundled with the current ArcOrbit application.",
            "basis": "Explicit user expectation in the current Case request.",
            "evidence": [
              "Current user request dated 2026-08-17"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SETUP-RECOVERY-TECHNICAL",
            "fact_id": "FACT-SETUP-RECOVERY-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "undetermined",
            "reason": "The recovery boundary must be settled between ArcOrbit orchestration and ArcForge provisioning semantics, including relation establishment and rollback after an explicit fallback reinstall.",
            "gap_ids": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SETUP-RECOVERY-INTERACTION",
            "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 9
            },
            "effect": "threatened",
            "reason": "The settled interaction contract requires typed changed-content recovery actions, but the reproduced screen exposes no applicable resolution action.",
            "gap_ids": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ],
            "evidence": [
              "Current user report dated 2026-08-17",
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ]
          },
          {
            "id": "IMPACT-SETUP-RECOVERY-REALIZATION",
            "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The realized Desktop blocks on changed managed content without the recovery controls required by accepted interaction facts.",
            "gap_ids": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ],
            "evidence": [
              "Current user report dated 2026-08-17",
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
            "status": "open",
            "goal": "Implement a safe Setup Readiness recovery path for ordinary changed or unowned targets so every blocking classification exposes an applicable action, including an explicit backup-and-reinstall-from-current-bundle fallback, then verify the reported arckit-development-ledger path end to end.",
            "reason": "The renamed ArcOrbit consumer root has no saved ArcForge relationship, and the ordinary drift branch currently exposes neither provider classification nor a recovery capability; recovery semantics must preserve content before a confirmed bundled reinstall and establish a valid post-recovery relationship.",
            "derived_from": [
              "FACT-SETUP-RECOVERY-NO-ACTION",
              "FACT-SETUP-RECOVERY-ROOT-CAUSE",
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
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
              "Interaction source and implementation expose at least one applicable recovery action for every blocking conflict classification.",
              "Automated tests prove explicit confirmation, backup preservation, bundled-content reinstall, relation establishment, stale assessment rejection, rollback behavior, and unchanged safe managed-upgrade recovery.",
              "A packaged-resource reproduction of /Users/Glare/.codex/skills/arckit-development-ledger reaches an actionable snapshot and a disposable-home end-to-end recovery reaches ready without modifying the user's live installed skill."
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
        "project_revision": 78,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The user's fallback outcome is now an accepted Case fact with explicit safety and authority boundaries.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
            ],
            "evidence": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
              "Current user request dated 2026-08-17"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The current screen still lacks an applicable recovery action until the bounded implementation gap updates the durable interaction source and runtime behavior.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-NO-ACTION",
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
            ],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ],
            "gap_refs": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This diagnosis changes action availability and recovery semantics, not the established visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "undetermined",
            "reason": "Provider ownership, relationship establishment, and transactional rollback for the fallback must be made explicit in the implementation round.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-ROOT-CAUSE",
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
            ],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ],
            "gap_refs": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The existing implementation reproduces the accepted dead end and does not yet realize the accepted fallback contract.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-NO-ACTION",
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
            ],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ],
            "gap_refs": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "A destructive fallback is only credible after tests prove confirmation, backup, relationship establishment, stale-state rejection, and rollback.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
            ],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
            ],
            "gap_refs": [
              "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
            ]
          }
        ]
      },
      "evidence": [
        "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
        "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T14:48:01.270Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Deliver and verify an applicable Setup Readiness recovery path for the reported changed skill and all safely classifiable conflicts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh canonical state makes the Case implementation gap the only ready Case obligation; it remains higher priority than broader Project gaps because it directly blocks the reproduced user launch.",
        "snapshot_token": "3e11e83b23086ef303da203c2fc60868f43e558b0b7b3ae55181c7e07659e582",
        "selected_ref": "case-gap:CASE-20260817-003:GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
        "comparison_summary": "Compared the implementation gap with all four Project gaps; the Case gap is bounded, user-blocking, fully implemented, and now verifiable through the built package.",
        "fresh_discovery_summary": "No new implementation gap remains after full suites and packaged recovery; normal completion review should inspect the resulting content revision next.",
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
            "reason": "Broader Agent scenario evaluation remains a separate Project obligation and does not block closing the verified recovery implementation."
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
            "reason": "Broader Runtime resilience remains deferred because the active Case now has direct implementation and packaged evidence."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Security real-project validation is outside this bounded Setup Readiness recovery Case."
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
            "reason": "Cross-record audit remains a separate Project-level obligation and is not required to accept this implementation evidence."
          },
          {
            "ref": "case-gap:CASE-20260817-003:GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This ready high-impact gap directly realizes the user's requested recovery path and now has complete implementation, regression, and packaged-resource evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
        "responsibility": "agent",
        "goal": "Implement a safe Setup Readiness recovery path for ordinary changed or unowned targets so every blocking classification exposes an applicable action, including an explicit backup-and-reinstall-from-current-bundle fallback, then verify the reported arckit-development-ledger path end to end.",
        "reason": "The renamed ArcOrbit consumer root has no saved ArcForge relationship, and the ordinary drift branch currently exposes neither provider classification nor a recovery capability; recovery semantics must preserve content before a confirmed bundled reinstall and establish a valid post-recovery relationship.",
        "derived_from": [
          "FACT-SETUP-RECOVERY-NO-ACTION",
          "FACT-SETUP-RECOVERY-ROOT-CAUSE",
          "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Interaction source and implementation expose at least one applicable recovery action for every blocking conflict classification.",
          "Automated tests prove explicit confirmation, backup preservation, bundled-content reinstall, relation establishment, stale assessment rejection, rollback behavior, and unchanged safe managed-upgrade recovery.",
          "A packaged-resource reproduction of /Users/Glare/.codex/skills/arckit-development-ledger reaches an actionable snapshot and a disposable-home end-to-end recovery reaches ready without modifying the user's live installed skill."
        ]
      },
      "planned_transition": {
        "goal": "Deliver and verify an applicable Setup Readiness recovery path for the reported changed skill and all safely classifiable conflicts.",
        "expected_state_change": "Resolve the implementation gap, accept implementation and packaged verification facts, and reconcile all threatened Case impacts to upheld before completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION",
          "status": "resolved",
          "outcome": "Setup Readiness now preserves the prior consumer identity and offers provider-backed managed restore, confirmed backup-and-reinstall from the current bundle, or explicit external recovery guidance; the exact reported skill converges to ready in packaged-resource verification.",
          "reason": "Stable interaction and technical sources, implementation tests, provider tests, distribution smoke, packaged asar inspection, and a disposable-home end-to-end recovery all agree.",
          "evidence": [
            "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
            "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
            "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
            "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
            "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
            "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
            "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
            "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SETUP-RECOVERY-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit preserves the pre-rename Electron userData identity, classifies ordinary changed targets through the ArcForge provider, exposes managed restore or explicit backup-and-reinstall according to provider capability, and offers bounded external recovery guidance when automated recovery is unavailable. ArcForge keeps unmanaged targets outside ordinary apply and performs the fallback as backup, bundled-source replacement, Core apply, relation establishment, and rollback-safe verification.",
            "basis": "Direct source and stable interaction/technical fact-source changes across ArcOrbit and ArcForge, with capability-gated API projection and no renderer-owned provisioning inference.",
            "evidence": [
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries."
            ]
          },
          {
            "id": "FACT-SETUP-RECOVERY-VERIFIED",
            "revision": 1,
            "status": "accepted",
            "statement": "The reported arckit-development-ledger dead end is resolved in the local packaged application: the conflict has an applicable backup-and-reinstall action, the prior content is preserved, bundled content and a new relationship are committed, and readiness converges to ready without touching the live user installation during verification.",
            "basis": "Passing full and focused automated suites plus a disposable-home execution against the provider and payload embedded in the built ArcOrbit application.",
            "evidence": [
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SETUP-RECOVERY-INTERACTION",
            "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "The stable Setup Readiness interaction now guarantees an applicable recovery or external handling action and the renderer exposes the provider-backed bundled reinstall fallback.",
            "gap_ids": [],
            "evidence": [
              "Current user report dated 2026-08-17",
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ]
          },
          {
            "id": "IMPACT-SETUP-RECOVERY-REALIZATION",
            "fact_id": "FACT-SETUP-RECOVERY-NO-ACTION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Automated and packaged-resource evidence shows the accepted fallback behavior is realized for the reported skill without modifying the live installation.",
            "gap_ids": [],
            "evidence": [
              "Current user report dated 2026-08-17",
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ]
          },
          {
            "id": "IMPACT-SETUP-RECOVERY-TECHNICAL",
            "fact_id": "FACT-SETUP-RECOVERY-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The durable technical source now makes stable userData identity and the ArcOrbit/ArcForge recovery transaction boundary explicit, and implementation follows that boundary.",
            "gap_ids": [],
            "evidence": [
              "Read-only packaged-provider reproduction on 2026-08-17: the ArcOrbit consumer root has zero provisioning relations while the prior @arckit/runtime consumer root has one; arckit-development-ledger is changed and classified as unmanaged-conflict plus unverified-managed with canBackupAndRestore=false.",
              "Read-only ArcOrbit readiness-manager reproduction on 2026-08-17: status=conflict, source_upgrade=null, can_apply=false, can_recover=false, can_continue=false, and the sole conflict is /Users/Glare/.codex/skills/arckit-development-ledger.",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs analyzePlan/publicSnapshot map ordinary changed drift to conflict with can_recover=false; runtime/arcorbit/desktop/renderer/renderer.js hides recovery unless can_recover is true.",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
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
        "project_revision": 78,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted fallback outcome is durably expressed in Case facts and the Setup Readiness interaction source.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
              "FACT-SETUP-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction source, wireframe, renderer actions, and packaged snapshot consistently expose applicable recovery behavior.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-IMPLEMENTED",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The change adds recovery wording and action availability within the existing Setup Readiness component language without introducing or revising a visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Stable userData identity, provider capability ownership, confirmation, transaction, relation, and rollback boundaries are explicit and realized without duplicating provisioning semantics in Runtime.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-ROOT-CAUSE",
              "FACT-SETUP-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The packaged disposable-home run reproduces the exact skill classification and proves backup, reinstall, relationship, and ready convergence.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Fresh assessment rejection, explicit confirmation, backup retention, provider/Core rollback, full regression suites, distribution smoke, and packaged recovery provide proportionate repeatable risk evidence.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-IMPLEMENTED",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
              "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
              "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
              "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
              "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
              "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
              "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
              "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "ArcOrbit fixes Electron persistence identity in runtime/arcorbit/desktop/main.mjs and runtime/arcorbit/src/desktop-user-data.mjs so the product rename continues using appData/@arckit/runtime.",
        "ArcOrbit readiness and renderer implement ordinary-conflict assessment, backup-and-reinstall projection, explicit confirmation, external recovery guidance, stale digest rejection, and safe post-recovery recheck in runtime/arcorbit/src/skill-provisioning-manager.mjs and runtime/arcorbit/desktop/renderer/renderer.js.",
        "ArcForge src/provider/index.ts declares conflict-reinstall-recovery/v1, treats absent unowned targets as non-overwriting managed repair, preserves unmanaged conflicts outside ordinary apply, and implements explicit backup-and-reinstall with Core apply relation establishment and rollback.",
        "arckit/interaction/setup-readiness/interaction.md and default.html define an applicable action for every non-ready classification and the confirmed current-bundle reinstall fallback; arckit/tech/arcorbit/installer-supply-chain.md defines stable userData and provider transaction boundaries.",
        "Final ArcOrbit full check: 197 tests, 196 passed, 1 explicit Electron layout skip, 0 failed; focused recovery/renderer/identity/distribution suite: 19 passed.",
        "Final ArcForge full suite: 61 passed, 0 failed; final provider typecheck and focused provider test passed.",
        "Packaged-resource disposable-home reproduction with ArcForge provider 0.1.8-local.20260817150427 classified arckit-development-ledger as unmanaged-conflict, exposed backup-and-reinstall, preserved the local backup, installed bundled content, established one relation, and converged to ready while the live user skill was untouched.",
        "Unsigned local installer runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817150427-local-20260817150427-mac-x64.dmg is 97 MB with SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d; packaged app.asar contains the stable userData binding."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T15:08:20.999Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete semantic review of content revision 2.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Ordinary Case work is closed; completion review is the only ready Case candidate.",
        "snapshot_token": "be3f49812c0caa5524ef92d59a529a9da61d86555deabf3fc6cdeb4f65df0e33",
        "selected_ref": "case-gap:CASE-20260817-003:CASE-20260817-003:completion-review:1",
        "comparison_summary": "Selected the terminal Case gate; four unrelated Project gaps require separate Cases.",
        "fresh_discovery_summary": "Review and verification exposed no more important fresh gap.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260817-003:CASE-20260817-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Required terminal review."
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-003:completion-review:1",
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
        "goal": "Complete semantic review of content revision 2.",
        "expected_state_change": "Record a clean five-dimension review without content mutation and resolve the Case."
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
          "reviewer": "agent",
          "outcome": "clean",
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
            "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation.",
            "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources.",
            "DMG SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d."
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
        "project_revision": 78,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The durable fallback expectation is implemented and reviewed.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
              "FACT-SETUP-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Each non-ready state has an automated action or external recovery guide.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-IMPLEMENTED",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing Setup Readiness styling is reused; no durable visual rule changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Stable userData and the provider-owned transaction are explicit in documentation and code.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-ROOT-CAUSE",
              "FACT-SETUP-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reported conflict now supports backup, bundled reinstall, ownership establishment, and ready convergence.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-FALLBACK-CONTRACT",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
              "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Stale digest rejection, rollback, backup retention, regressions, package inspection, and isolated execution provide proportionate evidence.",
            "fact_refs": [
              "FACT-SETUP-RECOVERY-IMPLEMENTED",
              "FACT-SETUP-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
              "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation.",
              "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources.",
              "DMG SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "ArcOrbit full check passed 196 tests with one explicit Electron layout skip and zero failures; ArcForge passed all 61 tests.",
        "Packaged-resource reproduction for arckit-development-ledger proved backup-and-reinstall, relation establishment, ready convergence, and no live-user-skill mutation.",
        "Diff review found the ArcOrbit and ArcForge implementation consistent with durable interaction and technical sources.",
        "DMG SHA-256 e2a73e0c8902f6507071484defe1d01bb885bd229aa6f8bde0e0d42019d6828d."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T15:14:29.006Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-SETUP-RECOVERY-DIAGNOSIS",
      "GAP-SETUP-RECOVERY-FALLBACK-IMPLEMENTATION"
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
    "updated_at": "2026-08-17T15:14:29.006Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
