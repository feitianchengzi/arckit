# Make same-name skill conflicts recoverable

Case: CASE-20260826-009
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-26T12:58:55.759Z

## User Intent

Ensure ArcOrbit Setup Readiness exposes actionable diagnostics and a user-confirmed, backup-first fallback that can replace conflicting same-name skills without deleting unrelated content.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-009",
  "title": "Make same-name skill conflicts recoverable",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-26T10:59:03.135Z",
  "updated_at": "2026-08-26T12:58:55.759Z",
  "user_intent": "Ensure ArcOrbit Setup Readiness exposes actionable diagnostics and a user-confirmed, backup-first fallback that can replace conflicting same-name skills without deleting unrelated content.",
  "expected_outcome": "Every same-name bundled skill conflict has a visible recovery path that preserves the current copy, confirms exact overwrite targets, applies the selected packaged copy transactionally, and can roll back or hand the backup to the user.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-009-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The current packaged availability plan produces five CATALOG_VERSION_CONFLICT diagnostics for changed user-on-demand skills whose old and incoming copies lack valid Semantic Versions; drift throws a plain error before Setup can expose the targets or a recovery action, and no write has started.",
      "basis": "Direct read-only invocation of the installed ArcForge provider reproduced all five diagnostics and checksum verification proved the bundled resources intact.",
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/dist/core/skill-catalog.js",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/dist/core/skill-availability-drift.js",
        "Local packaged-provider reproduction, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260826-009-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The operator requires same-name skill conflicts to remain recoverable through an explicit fallback that can overwrite the conflicting skill after preserving the previous copy; the product must not leave users in an unrecoverable Setup state.",
      "basis": "Explicit operator requirement in the current conversation.",
      "evidence": [
        "Current operator input, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260826-009-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit now has a durable recovery contract requiring availability diagnostics to remain typed and actionable, and allowing eligible same-name project skill, loader, shared-asset, and catalog conflicts to be explicitly selected, fully backed up, transactionally overwritten from the current bundle, rolled back on failure, and rechecked without modifying unrelated targets.",
      "basis": "Updated product specification, interaction state model and grayscale wireframe, technical supply-chain contract, and acceptance criteria.",
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "FACT-20260826-009-004",
      "revision": 1,
      "status": "accepted",
      "statement": "The rebuilt ArcOrbit resources now expose each of the five CATALOG_VERSION_CONFLICT items with its real skill name, destination, current and incoming digests, and safe-recovery eligibility; a user-selected backup-and-overwrite-selected action preserves all selected copies and a recovery manifest, updates only selected catalog targets, rolls back on failure, and rechecks to ready.",
      "basis": "Source inspection, provider and manager regression suites, Renderer contract checks, full ArcOrbit check, and an isolated end-to-end run using the provider embedded in dist-package.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
        "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-009-001",
      "fact_id": "FACT-20260826-009-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 36
      },
      "effect": "upheld",
      "reason": "The required fallback is implemented and packaged with explicit selection, backup-first replacement, and safe recheck.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "../arcforge/src/provider/index.ts",
        "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
      ]
    },
    {
      "id": "IMPACT-20260826-009-002",
      "fact_id": "FACT-20260826-009-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 56
      },
      "effect": "upheld",
      "reason": "Setup now shows typed conflicts, paths and digests, keeps selection empty by default, confirms exact targets, and exposes backup evidence.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md"
      ]
    },
    {
      "id": "IMPACT-20260826-009-003",
      "fact_id": "FACT-20260826-009-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 39
      },
      "effect": "upheld",
      "reason": "Blocking plan diagnostics are assessed before drift and the provider implements bounded, digest-bound, transactional selected overwrite.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "../arcforge/src/provider/index.ts",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260826-009-004",
      "fact_id": "FACT-20260826-009-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 18
      },
      "effect": "upheld",
      "reason": "Focused provider, manager and Renderer regressions plus the full ArcOrbit suite and packaged-resource acceptance cover the failure and recovery path.",
      "gap_ids": [],
      "evidence": [
        "../arcforge/tests/provider.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
        "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
      ]
    },
    {
      "id": "IMPACT-20260826-009-005",
      "fact_id": "FACT-20260826-009-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 19
      },
      "effect": "upheld",
      "reason": "The owner-only recovery area, manifest lifecycle, all-before-replace ordering, and rollback responsibility are durably specified.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-009-001",
      "status": "resolved",
      "goal": "Establish an unambiguous product, interaction, data-safety, technical, and acceptance contract for actionable diagnostics plus backup-first explicit overwrite of conflicting same-name skills.",
      "reason": "Implementation targets, confirmation data, backup ownership, rollback semantics, and package-validation obligations depend on this recovery contract and cannot safely be inferred from the current generic error path.",
      "derived_from": [
        "FACT-20260826-009-001",
        "FACT-20260826-009-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "urgency": "high",
        "risk": "high",
        "user_blocking": true
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable product and interaction expectations name the same-name overwrite fallback and prohibit silent overwrite.",
        "Durable technical contract defines diagnostic projection, exact target confirmation, backup, transactional replacement, rollback, and unrelated-skill preservation.",
        "Acceptance criteria cover the reproduced five-conflict upgrade and generic same-name conflict recovery."
      ],
      "resolution": {
        "id": "GAP-20260826-009-001",
        "status": "resolved",
        "outcome": "The product, interaction, technical, data-safety, and acceptance contract now defines typed diagnostics and a user-selected backup-first same-name overwrite fallback.",
        "reason": "The durable documents specify eligibility, visible targets and digests, default-empty selection, confirmation freshness, complete pre-backup, transactional replacement, rollback, and preservation of unrelated content.",
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md"
        ],
        "occurred_at": "2026-08-26T12:38:33.684Z"
      }
    },
    {
      "id": "GAP-20260826-009-002",
      "status": "resolved",
      "goal": "Implement typed blocking-diagnostic projection and backup-and-overwrite-selected across ArcForge provider, SkillProvisioningManager, Setup Renderer, packaged resources, and focused regression tests.",
      "reason": "The recovery contract is settled, but the current installed flow still throws before exposing diagnostics and has no selectable transactional overwrite action.",
      "derived_from": [
        "FACT-20260826-009-001",
        "FACT-20260826-009-002",
        "FACT-20260826-009-003"
      ],
      "blocked_by": [
        "GAP-20260826-009-001"
      ],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high",
        "urgency": "high",
        "user_blocking": true
      },
      "responsibility": "agent",
      "evidence_required": [
        "The reproduced five CATALOG_VERSION_CONFLICT diagnostics reach Setup with exact recovery targets and no raw SETUP_FAILED compression.",
        "Eligible selected conflicts are fully backed up before replacement, committed transactionally, rolled back on injected failure, and leave unselected or unrelated content unchanged.",
        "Renderer selection and confirmation states plus rebuilt packaged provider/payload pass focused and package-level regression tests."
      ],
      "resolution": {
        "id": "GAP-20260826-009-002",
        "status": "resolved",
        "outcome": "ArcOrbit now preserves typed blocking diagnostics and offers an explicit default-empty backup-and-overwrite-selected recovery for safe same-name skill targets, with transactional source activation, rollback, manifest evidence, and recheck.",
        "reason": "Provider, manager, Renderer, packaged resources, and regression tests implement the settled contract; an isolated real packaged-provider run reproduced all five conflicts and reached ready after selected overwrite.",
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
          "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26",
          "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T12:57:32.758Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Project default autonomous completion review policy.",
      "snapshotted_at": "2026-08-26T10:59:03.135Z"
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
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
          "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
          "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26",
          "git diff --check passed in Arckit and ArcForge, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T12:58:55.759Z"
      }
    ],
    "evidence": [
      "../arcforge/src/provider/index.ts",
      "../arcforge/tests/provider.test.mjs",
      "runtime/arcorbit/src/skill-provisioning-manager.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
      "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
      "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26",
      "git diff --check passed in Arckit and ArcForge, 2026-08-26"
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
      "goal": "Establish the durable product, interaction, data-safety, technical, and acceptance contract for actionable same-name diagnostics and backup-first explicit overwrite.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user-blocking Case gap is the only ready Case-scoped candidate and must establish the safety contract before implementation.",
        "snapshot_token": "fce41704e461ad1fbcc1340d16845844d697430aeb0c93d8f9411b7c145edb6d",
        "selected_ref": "case-gap:CASE-20260826-009:GAP-20260826-009-001",
        "comparison_summary": "Selected the high-risk, user-blocking recovery-contract gap; four repository-wide Project gaps require separate Cases and are deferred.",
        "fresh_discovery_summary": "The contract work exposed a downstream provider, manager, Renderer, and package-regression implementation obligation, recorded as a new Case gap for the next round.",
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
            "reason": "Repository-wide scenario evaluation is outside this bounded Setup recovery Case."
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
            "reason": "General Runtime resilience requires a separate Case and does not unblock this recovery contract."
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
            "reason": "Real permission-bearing validation requires its own controlled project context."
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
            "reason": "Cross-record auditing is unrelated to the immediate user-blocking Setup recovery contract."
          },
          {
            "ref": "case-gap:CASE-20260826-009:GAP-20260826-009-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "risk": "high",
              "urgency": "high",
              "user_blocking": true
            },
            "reason": "It directly governs whether the reproduced five-conflict state can be made safely recoverable."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-009-001",
        "responsibility": "agent",
        "goal": "Establish an unambiguous product, interaction, data-safety, technical, and acceptance contract for actionable diagnostics plus backup-first explicit overwrite of conflicting same-name skills.",
        "reason": "Implementation targets, confirmation data, backup ownership, rollback semantics, and package-validation obligations depend on this recovery contract and cannot safely be inferred from the current generic error path.",
        "derived_from": [
          "FACT-20260826-009-001",
          "FACT-20260826-009-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "urgency": "high",
          "user_blocking": true
        },
        "evidence_required": [
          "Durable product and interaction expectations name the same-name overwrite fallback and prohibit silent overwrite.",
          "Durable technical contract defines diagnostic projection, exact target confirmation, backup, transactional replacement, rollback, and unrelated-skill preservation.",
          "Acceptance criteria cover the reproduced five-conflict upgrade and generic same-name conflict recovery."
        ]
      },
      "planned_transition": {
        "goal": "Establish the durable product, interaction, data-safety, technical, and acceptance contract for actionable same-name diagnostics and backup-first explicit overwrite.",
        "expected_state_change": "The governing documents and Project decisions define a safe recovery path, and the remaining implementation work becomes one explicit downstream Case gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-009-001",
          "status": "resolved",
          "outcome": "The product, interaction, technical, data-safety, and acceptance contract now defines typed diagnostics and a user-selected backup-first same-name overwrite fallback.",
          "reason": "The durable documents specify eligibility, visible targets and digests, default-empty selection, confirmation freshness, complete pre-backup, transactional replacement, rollback, and preservation of unrelated content.",
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/tech/arcorbit/installer-supply-chain.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-009-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit now has a durable recovery contract requiring availability diagnostics to remain typed and actionable, and allowing eligible same-name project skill, loader, shared-asset, and catalog conflicts to be explicitly selected, fully backed up, transactionally overwritten from the current bundle, rolled back on failure, and rechecked without modifying unrelated targets.",
            "basis": "Updated product specification, interaction state model and grayscale wireframe, technical supply-chain contract, and acceptance criteria.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260826-009-005",
            "fact_id": "FACT-20260826-009-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 19
            },
            "effect": "upheld",
            "reason": "The owner-only recovery area, manifest lifecycle, all-before-replace ordering, and rollback responsibility are durably specified.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-009-001",
            "fact_id": "FACT-20260826-009-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 36
            },
            "effect": "threatened",
            "reason": "The fallback capability is now specified but remains to be implemented and packaged.",
            "gap_ids": [
              "GAP-20260826-009-002"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-20260826-009-002",
            "fact_id": "FACT-20260826-009-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 56
            },
            "effect": "threatened",
            "reason": "The complete recovery journey is documented but the live Renderer does not yet expose it.",
            "gap_ids": [
              "GAP-20260826-009-002"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-20260826-009-003",
            "fact_id": "FACT-20260826-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 39
            },
            "effect": "threatened",
            "reason": "The provider and manager contract is settled but the current code still discards blocking diagnostics before drift.",
            "gap_ids": [
              "GAP-20260826-009-002"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-20260826-009-004",
            "fact_id": "FACT-20260826-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 18
            },
            "effect": "threatened",
            "reason": "The required regression matrix is specified but not yet implemented and executed.",
            "gap_ids": [
              "GAP-20260826-009-002"
            ],
            "evidence": []
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260826-009-002",
            "status": "open",
            "goal": "Implement typed blocking-diagnostic projection and backup-and-overwrite-selected across ArcForge provider, SkillProvisioningManager, Setup Renderer, packaged resources, and focused regression tests.",
            "reason": "The recovery contract is settled, but the current installed flow still throws before exposing diagnostics and has no selectable transactional overwrite action.",
            "derived_from": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-002",
              "FACT-20260826-009-003"
            ],
            "blocked_by": [
              "GAP-20260826-009-001"
            ],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high",
              "user_blocking": true
            },
            "responsibility": "agent",
            "evidence_required": [
              "The reproduced five CATALOG_VERSION_CONFLICT diagnostics reach Setup with exact recovery targets and no raw SETUP_FAILED compression.",
              "Eligible selected conflicts are fully backed up before replacement, committed transactionally, rolled back on injected failure, and leave unselected or unrelated content unchanged.",
              "Renderer selection and confirmation states plus rebuilt packaged provider/payload pass focused and package-level regression tests."
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
            "area_ref": "product_capabilities",
            "observed_revision": 35,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在每次应用启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift，界面当前选择项目集全部或具体项目都不缩小检查范围，任一项目未 ready 时不启动 Automation。trusted Case binding 的既有能力和边界保持不变。 Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。",
              "reason": "同名 skill 冲突必须从终止状态变为受控、可回退的产品能力。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当启动检查项目作用域、skill drift 状态、Setup 恢复入口或 Automation gate 改变时重审。；当同名冲突目标类别、用户选择范围或 bundled source 权威规则改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "The user explicitly requires a recoverable same-name overwrite fallback.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 55,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格：未分配、分配给他人或非待处理均不进入当前用户候选；当前用户且待处理只继续检查项目连接、项目授权和全局领取，不隐式修改这些事实。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用启动会在进入 Automation 前检查全部关联本地项目；发现 skill drift 时直接呈现既有 Setup Readiness 安装、修复或人工恢复路径，无需用户先切换到具体项目。 Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。",
              "reason": "The recovery journey must expose the exact choice and consequence instead of a generic terminal error.",
              "evidence": [
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/task-form.html",
                "arckit/interaction/_map/feature-matrix.md",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 新建表单字段、Automation 候选条件、当前用户身份来源、项目资格条件或提示响应方式改变时重审；其余既有交互恢复条件保持。；当诊断字段、选择模型、确认内容或回滚反馈改变时重审。"
            },
            "gap_refs": [],
            "reason": "The generic SETUP_FAILED page does not support an informed recovery decision.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 18,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread 和 Case 绑定收据继续保持既有所有权边界。ArcOrbit Desktop Store 额外拥有全局 `platform.ui_preferences.work_inspector_width_px`，用于保存 360–640px 的 Work Inspector 用户选择宽度；它不属于 Workshop Task、按项目 workspace preference、Work Sync 投影或 Automation。缺失或非法值使用 440，窗口临时约束产生的有效宽度不写回保存值，任务、项目、Workset、登录身份切换和应用重启均不重置该偏好。 同名 skill 兜底覆盖的旧内容由 ArcOrbit userData 下仅当前用户可访问的 recovery area 和原子 recovery manifest 持有；全部已选项完成备份后才开始替换，失败时目标、catalog、loader 与 relation 回滚，未选内容不变。",
              "reason": "Backup ownership and transaction ordering are part of the durable local-state recovery model.",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Inspector 偏好作用域、Store schema、同步或恢复所有权改变时重审。；当 recovery root、manifest schema、保留策略或 rollback ownership 改变时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "The fallback adds material recoverable local state that needs explicit ownership.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 38,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好通过 Desktop Store v15 的 `platform.ui_preferences.work_inspector_width_px` 归一化与持久化；`platformSnapshot` 在首次 Work 布局前提供恢复值，preload 只新增目的限定的 `setWorkInspectorWidth(widthPx)` typed action。Renderer 在拖拽期间仅更新 grid track，在 pointerup、键盘调整结束或双击复位时持久化；当前窗口有效宽度与保存值分离，且不通过重新创建 Inspector DOM 完成调宽。应用启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；显式空 roots 清除既有 project plan 并执行 global-only。aggregate 只有在全部项目 ready 且不是 first-install 时才允许启动 Automation，Renderer 项目筛选不参与该启动作用域。 SkillProvisioningManager 在 drift 前消费 plan blocking diagnostics 并建立 recovery assessment；provider 以 `backup-and-overwrite-selected` 承载四类同名目标，绑定安全 root、唯一 bundled source、双方 digest 和 fresh confirmation，在一个事务中完成预备份、替换、catalog/loader/relation 提交与 post-drift。",
              "reason": "The root cause is a diagnostic lifecycle and provider transaction capability gap, not resource corruption.",
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store root 解析、project plan 复用、aggregate gate 或 Setup manager 所有权变化时重审。；当 availability diagnostic 生命周期、provider recovery API 或事务边界改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The implemented boundary must prevent typed diagnostics from being lost and centralize overwrite safety in the provider.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 17,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup 和跨平台窗口验证义务保持不变。Work Inspector 还必须以 Store、main/preload、Renderer 和 DOM/CSS focused tests 证明：440 默认；360/640 边界与非法值归一化；v14→v15 幂等迁移；pointerup、16/48px 键盘调整和双击复位持久化；应用重启恢复；任务、项目与 Workset 切换不重置；420px 列表保护和临时窗口收窄不覆盖保存值；separator ARIA；调宽不丢失选择、滚动、评论/验收草稿或附件状态；属性两列/窄宽度单列；内容、协作、completed/accepted 验收分区正确。Work 连续验收还必须证明最新项向下一条较旧待办切换、中间或末尾项向相邻较新待办切换、树补全项不参与计算、无相邻项时不强制错误选择、服务器确认失败不会提前改变选择，并且请求等待期间产生的较新任务选择不会被旧验收成功回调覆盖。Setup Readiness 还必须证明启动与具体项目复查使用相同的全部本地 roots、空 roots 不复用旧 plan、项目筛选不改变范围，以及 needs-install、drifted、conflict、blocked、checking 和 first-install 都不会提前启动 Automation。 Setup 回归还必须覆盖双方无有效 SemVer 且内容不同的五项 catalog 冲突、四类同名目标、eligible/ineligible assessment、默认空选择、fresh digest 拒绝、完整预备份、故障注入全量回滚、recovery manifest、未选目标不变、post-drift 和 packaged-provider 复现。",
              "reason": "The shipped regression escaped because this exact upgrade shape was absent from validation.",
              "evidence": [
                "runtime/arcorbit/test/work-task-selection.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "Verification: focused 58 passed, 0 failed",
                "Verification: ArcOrbit corpus completed without functional regression failures after authorized Electron rerun",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 排序、分页、树补全、状态 mutation、请求期间浏览或选择刷新生命周期改变时重审连续验收验证；其余既有条件保持。；当恢复 target kind、confirmation schema、事务阶段或 package resource generation 改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "The exact five-conflict package upgrade and generic safety matrix must become executable release evidence.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 288,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The capability, safety limits, non-goals, and acceptance behavior are recoverable from the updated specification.",
            "fact_refs": [
              "FACT-20260826-009-003"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The diagnostic, selection, confirmation, progress, success, and failure states are durably specified and wireframed.",
            "fact_refs": [
              "FACT-20260826-009-003"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This round reuses the existing grayscale Setup components and introduces no new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Diagnostic lifecycle, eligibility proof, backup ownership, transaction, rollback, and post-drift are explained in the supply-chain contract.",
            "fact_refs": [
              "FACT-20260826-009-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The governing contract is realized, but the current software still reproduces the terminal five-conflict path until the implementation gap closes.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-002",
              "FACT-20260826-009-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260826-009-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The failure has credible reproduction evidence and a complete validation contract, but transactional recovery and package regression evidence remain outstanding.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260826-009-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-26T12:38:33.684Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete typed diagnostic projection and selectable backup-first overwrite recovery through provider, manager, Renderer, package resources, and regressions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The only ready Case-scoped candidate is the user-blocking implementation gap; the repository-wide Project gaps remain unrelated to this bounded recovery fix.",
        "snapshot_token": "7114659e0dcf1f41e11d0f72ebe937c55ef3019275d6c733c44f332be333381a",
        "selected_ref": "case-gap:CASE-20260826-009:GAP-20260826-009-002",
        "comparison_summary": "Selected the same-name recovery implementation gap over four unrelated repository-wide validation and resilience gaps.",
        "fresh_discovery_summary": "Implementation and isolated packaged-resource acceptance exposed no additional unresolved Case gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Requires a separate Case and does not block this conflict recovery."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Requires a separate Case and is outside this bounded Setup recovery."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Requires a separate permission-bearing validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Requires a separate Case and is unrelated to provider conflict recovery."
          },
          {
            "ref": "case-gap:CASE-20260826-009:GAP-20260826-009-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It directly implements the settled recovery contract and removes the reproduced unrecoverable state."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-009-002",
        "responsibility": "agent",
        "goal": "Implement typed blocking-diagnostic projection and backup-and-overwrite-selected across ArcForge provider, SkillProvisioningManager, Setup Renderer, packaged resources, and focused regression tests.",
        "reason": "The recovery contract is settled, but the current installed flow still throws before exposing diagnostics and has no selectable transactional overwrite action.",
        "derived_from": [
          "FACT-20260826-009-001",
          "FACT-20260826-009-002",
          "FACT-20260826-009-003"
        ],
        "blocked_by": [
          "GAP-20260826-009-001"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high",
          "user_blocking": true
        },
        "evidence_required": [
          "The reproduced five CATALOG_VERSION_CONFLICT diagnostics reach Setup with exact recovery targets and no raw SETUP_FAILED compression.",
          "Eligible selected conflicts are fully backed up before replacement, committed transactionally, rolled back on injected failure, and leave unselected or unrelated content unchanged.",
          "Renderer selection and confirmation states plus rebuilt packaged provider/payload pass focused and package-level regression tests."
        ]
      },
      "planned_transition": {
        "goal": "Complete typed diagnostic projection and selectable backup-first overwrite recovery through provider, manager, Renderer, package resources, and regressions.",
        "expected_state_change": "Resolve the implementation gap, record verified behavior, and uphold the threatened product, interaction, technical, and quality decisions."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-009-002",
          "status": "resolved",
          "outcome": "ArcOrbit now preserves typed blocking diagnostics and offers an explicit default-empty backup-and-overwrite-selected recovery for safe same-name skill targets, with transactional source activation, rollback, manifest evidence, and recheck.",
          "reason": "Provider, manager, Renderer, packaged resources, and regression tests implement the settled contract; an isolated real packaged-provider run reproduced all five conflicts and reached ready after selected overwrite.",
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
            "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26",
            "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-009-004",
            "revision": 1,
            "status": "accepted",
            "statement": "The rebuilt ArcOrbit resources now expose each of the five CATALOG_VERSION_CONFLICT items with its real skill name, destination, current and incoming digests, and safe-recovery eligibility; a user-selected backup-and-overwrite-selected action preserves all selected copies and a recovery manifest, updates only selected catalog targets, rolls back on failure, and rechecks to ready.",
            "basis": "Source inspection, provider and manager regression suites, Renderer contract checks, full ArcOrbit check, and an isolated end-to-end run using the provider embedded in dist-package.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
              "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-009-001",
            "fact_id": "FACT-20260826-009-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 36
            },
            "effect": "upheld",
            "reason": "The required fallback is implemented and packaged with explicit selection, backup-first replacement, and safe recheck.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "../arcforge/src/provider/index.ts",
              "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
            ]
          },
          {
            "id": "IMPACT-20260826-009-002",
            "fact_id": "FACT-20260826-009-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 56
            },
            "effect": "upheld",
            "reason": "Setup now shows typed conflicts, paths and digests, keeps selection empty by default, confirms exact targets, and exposes backup evidence.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/setup-readiness/interaction.md"
            ]
          },
          {
            "id": "IMPACT-20260826-009-003",
            "fact_id": "FACT-20260826-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 39
            },
            "effect": "upheld",
            "reason": "Blocking plan diagnostics are assessed before drift and the provider implements bounded, digest-bound, transactional selected overwrite.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "../arcforge/src/provider/index.ts",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260826-009-004",
            "fact_id": "FACT-20260826-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "Focused provider, manager and Renderer regressions plus the full ArcOrbit suite and packaged-resource acceptance cover the failure and recovery path.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
              "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
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
        "project_revision": 289,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The fallback behavior is both durably specified and implemented.",
            "fact_refs": [
              "FACT-20260826-009-002",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "../arcforge/src/provider/index.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Renderer realizes the documented selection, confirmation, conflict-detail, and recovery-evidence states.",
            "fact_refs": [
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This change reuses existing Setup row and control styling and does not establish a new visual-language decision.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implemented provider and manager boundaries follow the durable supply-chain contract.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The diagnosed five-conflict path and requested fallback are realized and verified end to end.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-002",
              "FACT-20260826-009-003",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26",
              "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Regression coverage proves default-empty selection, exact-path forwarding, unrelated preservation, owner-only backup metadata, stale assessment rejection, rollback behavior, and package-level recovery.",
            "fact_refs": [
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
        "Isolated packaged-resource five-conflict recovery acceptance, 2026-08-26"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-26T12:57:32.758Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the mandatory evidence-backed review of the same-name skill recovery implementation.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations and impacts are closed, so the derived agent completion review is the only ready Case-scoped candidate.",
        "snapshot_token": "37980cc2251a133fb99e44517cb497a5ca89ed3398e9dc612f96476df4adb56f",
        "selected_ref": "case-gap:CASE-20260826-009:CASE-20260826-009:completion-review:1",
        "comparison_summary": "Selected the mandatory completion review; four unrelated Project gaps remain deferred to separate Cases.",
        "fresh_discovery_summary": "Review of implementation, tests, package evidence, rollback boundaries, and scope found no new Case gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Separate Project validation Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Separate Runtime resilience Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Separate permission-bearing validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "scope": "repository-wide"
            },
            "reason": "Separate cross-record audit Case."
          },
          {
            "ref": "case-gap:CASE-20260826-009:CASE-20260826-009:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "uncertainty": "low"
            },
            "reason": "Mandatory evidence-backed review after all ordinary obligations closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-009:completion-review:1",
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
        "goal": "Complete the mandatory evidence-backed review of the same-name skill recovery implementation.",
        "expected_state_change": "Record a clean review and resolve the Case if all dimensions remain credible."
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
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/dist-package/resources/provisioning/distribution-lock.json",
            "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
            "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26",
            "git diff --check passed in Arckit and ArcForge, 2026-08-26"
          ],
          "reviewed_content_revision": 2
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
        "project_revision": 289,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implemented fallback realizes the settled recoverability expectation.",
            "fact_refs": [
              "FACT-20260826-009-002",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer behavior matches the documented default-empty, exact-target confirmation and recovery evidence journey.",
            "fact_refs": [
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The change reuses existing Setup styling and introduces no new visual-system decision.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Provider-owned eligibility and transaction semantics remain aligned with the durable technical contract.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reproduced five-diagnostic failure and requested fallback are implemented and accepted end to end.",
            "fact_refs": [
              "FACT-20260826-009-001",
              "FACT-20260826-009-002",
              "FACT-20260826-009-003",
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26",
              "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused and full regression evidence covers diagnostics preservation, explicit selection, backup permissions and manifest, partial preservation, stale assessment, rollback, package embedding and final recheck.",
            "fact_refs": [
              "FACT-20260826-009-004"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "ArcOrbit npm run check: 525 tests, 0 failures, 2026-08-26",
        "Isolated packaged-resource five-conflict recovery: conflict -> ready/committed, 2026-08-26"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-26T12:58:55.759Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-009-001",
      "GAP-20260826-009-002"
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
    "updated_at": "2026-08-26T12:58:55.759Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
