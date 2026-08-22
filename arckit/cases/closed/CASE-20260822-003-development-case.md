# 兼容旧镜像回滚健康确认

Case: CASE-20260822-003
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-22T12:12:07.767Z

## User Intent

补齐 Workshop 服务发布脚本对无 Docker HEALTHCHECK 的旧生产镜像的回滚确认，使候选发布失败后能够验证已恢复服务，而不是产生误导性的人工介入提示。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260822-003",
  "title": "兼容旧镜像回滚健康确认",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-22T12:06:40.287Z",
  "updated_at": "2026-08-22T12:12:07.767Z",
  "user_intent": "补齐 Workshop 服务发布脚本对无 Docker HEALTHCHECK 的旧生产镜像的回滚确认，使候选发布失败后能够验证已恢复服务，而不是产生误导性的人工介入提示。",
  "expected_outcome": "部署脚本优先使用 Docker health 状态，并在旧镜像没有 health 配置时等待容器内公开 HTTP health 成功；自动化测试覆盖该兼容回滚路径。",
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
      "statement": "当前 remote-deploy.sh 在候选失败后确实恢复旧 image ID，但 wait_until_healthy 把缺少 Docker Health 配置的容器立即判为失败；当前生产基线镜像的 Dockerfile 没有 HEALTHCHECK，因此旧服务可能已经恢复且 HTTP 可用，却仍被误报为需要人工介入。",
      "basis": "The rollback and health branches plus the repository baseline Dockerfile deterministically establish the compatibility mismatch.",
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/Dockerfile",
        "Verification: repository baseline Dockerfile inspection shows the pre-upgrade image has no HEALTHCHECK, 2026-08-22"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 远端发布的健康等待现在对新镜像继续使用 Docker health，并在恢复的旧镜像没有 health 元数据时循环请求容器内公开 HTTP health；自动化模拟确认旧服务恢复成功时不会再误报需要人工介入。",
      "basis": "The implementation branches and deterministic rollback fixture directly establish both modern and legacy health confirmation paths.",
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "旧镜像回滚模拟现在让第一次容器内 HTTP health 失败、第二次成功，并断言恰好发生两次探测且没有人工介入提示，因此发布脚本的启动等待行为已有直接可重复证据。",
      "basis": "The stateful fake Docker fixture and deployment regression assertions directly demonstrate retry rather than immediate success.",
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-LEGACY-ROLLBACK-HEALTH-PROBE",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "The deployment lifecycle can now validate both the Broker-aware candidate image and the immediately previous no-HEALTHCHECK image during automatic rollback.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-legacy-rollback-health-probe",
      "status": "resolved",
      "goal": "Make rollback health waiting compatible with old images that lack Docker HEALTHCHECK while retaining strict Broker-aware health for new images.",
      "reason": "A first deployment of the new release must be able to roll back to the immediately previous image without a false manual-intervention result.",
      "derived_from": [
        "FACT-001"
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
        "Missing Docker health metadata falls back to the public HTTP health endpoint instead of failing immediately",
        "The fallback waits through startup and passes for a restored legacy image",
        "Existing candidate health failure and rollback ordering tests remain green"
      ],
      "resolution": {
        "id": "GAP-legacy-rollback-health-probe",
        "status": "resolved",
        "outcome": "wait_until_healthy still accepts only Docker healthy for health-enabled images, but when health metadata is absent it repeatedly probes the container's public HTTP health endpoint; the rollback simulation proves a healthy legacy image no longer requests manual intervention.",
        "reason": "Shell syntax, existing migration/candidate/rollback simulations, and the added missing-health rollback simulation all pass deterministically.",
        "evidence": [
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
          "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
          "Verification: bash syntax and remote deployment ordering/rollback suite passed including a legacy image without Docker health metadata, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T12:09:06.569Z"
      }
    },
    {
      "id": "GAP-legacy-rollback-retry-evidence",
      "responsibility": "agent",
      "goal": "Prove that legacy rollback HTTP confirmation retries a failed startup probe before accepting the restored service.",
      "reason": "The implementation loop existed, but the current fixture only proved immediate HTTP success and did not substantiate the startup-wait claim.",
      "derived_from": [
        "FACT-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "evidence_required": [
        "A deterministic legacy rollback test fails the first HTTP probe and succeeds a later probe",
        "The deployment still reports rollback success without requesting manual intervention",
        "All existing deployment scenarios remain green"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-legacy-rollback-retry-evidence",
        "status": "resolved",
        "outcome": "The deployment fixture now counts legacy HTTP probes; the compatibility scenario forces the first probe to fail, requires exactly two attempts, and confirms no manual-intervention message after the second succeeds.",
        "reason": "The complete deployment suite passes with the delayed legacy health response and all earlier failure-path assertions intact.",
        "evidence": [
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
          "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
          "Verification: legacy rollback HTTP probe failed once, retried, succeeded on the second attempt, and the full deployment script suite passed, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T12:10:55.506Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "using-arckit default autonomous completion review policy",
      "snapshotted_at": "2026-08-22T12:06:40.287Z"
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
          "Review: health-enabled candidates remain governed by Docker healthy/unhealthy states; only missing health metadata uses the public HTTP compatibility probe.",
          "Review: missing-health fallback is bounded by the existing attempt and interval settings, retries startup failures, and returns failure with logs when the bound is exhausted.",
          "Verification: bash syntax, migration failure preservation, unhealthy candidate rollback, normal health success, and first-failure/second-success legacy HTTP fallback scenarios all passed, 2026-08-22.",
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-08-22T12:12:07.767Z"
      }
    ],
    "evidence": [
      "Review: health-enabled candidates remain governed by Docker healthy/unhealthy states; only missing health metadata uses the public HTTP compatibility probe.",
      "Review: missing-health fallback is bounded by the existing attempt and interval settings, retries startup failures, and returns failure with logs when the bound is exhausted.",
      "Verification: bash syntax, migration failure preservation, unhealthy candidate rollback, normal health success, and first-failure/second-success legacy HTTP fallback scenarios all passed, 2026-08-22.",
      "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
      "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
      "arckit/tech/arcorbit/realtime-synchronization-solution.md"
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
      "goal": "Add a bounded public-HTTP fallback for rollback images without Docker health metadata and verify it alongside all existing deployment failure paths.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The legacy rollback health-probe gap is the only ready candidate in this Case and directly blocks a truthful first-upgrade rollback result.",
        "snapshot_token": "98e48b07243b70f4a0b3fcabcad046ee55f35db4bf3aca798eb16b2d54e1cd51",
        "selected_ref": "case-gap:CASE-20260822-003:GAP-legacy-rollback-health-probe",
        "comparison_summary": "Selected the Case-local rollback compatibility gap; all four Project gaps require separate Cases and are unrelated to this bounded deployment correction.",
        "fresh_discovery_summary": "No additional fresh gap was found while implementing and testing the HTTP fallback for legacy rollback images.",
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
            "reason": "The generic Agent scenario evaluation is a separate Project Case."
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
            "reason": "The Runtime resilience backlog is not part of the service deployment script."
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
            "reason": "Permission-bearing project validation needs separate authority and scope."
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
            "reason": "The repository-wide cross-record audit is independent from this deployment fallback."
          },
          {
            "ref": "case-gap:CASE-20260822-003:GAP-legacy-rollback-health-probe",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This gap is directly reproducible and is the only remaining work required for truthful rollback compatibility."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-legacy-rollback-health-probe",
        "responsibility": "agent",
        "goal": "Make rollback health waiting compatible with old images that lack Docker HEALTHCHECK while retaining strict Broker-aware health for new images.",
        "reason": "A first deployment of the new release must be able to roll back to the immediately previous image without a false manual-intervention result.",
        "derived_from": [
          "FACT-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Missing Docker health metadata falls back to the public HTTP health endpoint instead of failing immediately",
          "The fallback waits through startup and passes for a restored legacy image",
          "Existing candidate health failure and rollback ordering tests remain green"
        ]
      },
      "planned_transition": {
        "goal": "Add a bounded public-HTTP fallback for rollback images without Docker health metadata and verify it alongside all existing deployment failure paths.",
        "expected_state_change": "The first-upgrade rollback path can confirm a restored old service without weakening strict health handling for new candidate images."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-legacy-rollback-health-probe",
          "status": "resolved",
          "outcome": "wait_until_healthy still accepts only Docker healthy for health-enabled images, but when health metadata is absent it repeatedly probes the container's public HTTP health endpoint; the rollback simulation proves a healthy legacy image no longer requests manual intervention.",
          "reason": "Shell syntax, existing migration/candidate/rollback simulations, and the added missing-health rollback simulation all pass deterministically.",
          "evidence": [
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
            "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
            "Verification: bash syntax and remote deployment ordering/rollback suite passed including a legacy image without Docker health metadata, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 远端发布的健康等待现在对新镜像继续使用 Docker health，并在恢复的旧镜像没有 health 元数据时循环请求容器内公开 HTTP health；自动化模拟确认旧服务恢复成功时不会再误报需要人工介入。",
            "basis": "The implementation branches and deterministic rollback fixture directly establish both modern and legacy health confirmation paths.",
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-LEGACY-ROLLBACK-HEALTH-PROBE",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "The deployment lifecycle can now validate both the Broker-aware candidate image and the immediately previous no-HEALTHCHECK image during automatic rollback.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
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
        "project_revision": 166,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This bounded fix corrects deployment health confirmation without changing the accepted user-facing capability.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No end-user action, state, feedback, or recovery interaction changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language rule is affected.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical solution now explicitly distinguishes Broker-aware candidate readiness from legacy rollback HTTP confirmation.",
            "fact_refs": [
              "FACT-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The health-wait branch directly realizes FACT-002 and its test fixture exercises the exact no-health-metadata rollback path.",
            "fact_refs": [
              "FACT-002"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Deterministic failure simulation proves migration failure preserves the old service, candidate unhealthy triggers rollback, and a legacy rollback without Docker health metadata is confirmed by HTTP.",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "Verification: bash syntax and remote deployment ordering/rollback suite passed including a legacy image without Docker health metadata, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
        "../../hoewo/workshop-todo/deploy/README.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: bash syntax and remote deployment ordering/rollback suite passed including a legacy image without Docker health metadata, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T12:09:06.569Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Make the fake Docker HTTP probe fail a configured number of attempts and require the legacy rollback scenario to succeed only on its second probe.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Fresh pre-review inspection found that the implementation retried a legacy HTTP probe but the regression fixture only demonstrated immediate success, leaving the startup-wait claim under-evidenced.",
        "snapshot_token": "6f7339079b205f33242c9a6f65b093b334e71b683a4a18d5bc5a7500ce914aff",
        "selected_ref": "fresh-gap:CASE-20260822-003:GAP-legacy-rollback-retry-evidence",
        "comparison_summary": "Selected the fresh verification gap ahead of Completion Review so the review binds evidence for both fallback success and retry behavior; unrelated Project gaps remain separate Cases.",
        "fresh_discovery_summary": "The legacy rollback test configured missing Docker health metadata but allowed its first HTTP probe to succeed, so it did not prove that wait_until_healthy survives a still-starting old container.",
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
            "reason": "The generic Agent scenario evaluation is a separate Project Case."
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
            "reason": "The Runtime resilience backlog is unrelated to this deployment fixture."
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
            "reason": "Permission-bearing validation needs separate authority and scope."
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
            "reason": "The repository-wide cross-record audit is independent."
          },
          {
            "ref": "case-gap:CASE-20260822-003:CASE-20260822-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Completion Review must bind the strengthened retry evidence rather than approve the prior content revision."
          },
          {
            "ref": "fresh-gap:CASE-20260822-003:GAP-legacy-rollback-retry-evidence",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "A deterministic first-failure/second-success scenario is the minimum credible evidence that rollback waits through old-service startup."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-legacy-rollback-retry-evidence",
        "responsibility": "agent",
        "goal": "Prove that legacy rollback HTTP confirmation retries a failed startup probe before accepting the restored service.",
        "reason": "The implementation loop existed, but the current fixture only proved immediate HTTP success and did not substantiate the startup-wait claim.",
        "derived_from": [
          "FACT-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "A deterministic legacy rollback test fails the first HTTP probe and succeeds a later probe",
          "The deployment still reports rollback success without requesting manual intervention",
          "All existing deployment scenarios remain green"
        ]
      },
      "planned_transition": {
        "goal": "Make the fake Docker HTTP probe fail a configured number of attempts and require the legacy rollback scenario to succeed only on its second probe.",
        "expected_state_change": "The accepted rollback behavior gains direct repeatable evidence that it waits through transient legacy service startup."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-legacy-rollback-retry-evidence",
          "status": "resolved",
          "outcome": "The deployment fixture now counts legacy HTTP probes; the compatibility scenario forces the first probe to fail, requires exactly two attempts, and confirms no manual-intervention message after the second succeeds.",
          "reason": "The complete deployment suite passes with the delayed legacy health response and all earlier failure-path assertions intact.",
          "evidence": [
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
            "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
            "Verification: legacy rollback HTTP probe failed once, retried, succeeded on the second attempt, and the full deployment script suite passed, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "旧镜像回滚模拟现在让第一次容器内 HTTP health 失败、第二次成功，并断言恰好发生两次探测且没有人工介入提示，因此发布脚本的启动等待行为已有直接可重复证据。",
            "basis": "The stateful fake Docker fixture and deployment regression assertions directly demonstrate retry rather than immediate success.",
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh"
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
        "project_revision": 166,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This round strengthens verification without changing product behavior.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user interaction changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual rule changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The test evidence now matches the documented legacy startup-wait behavior without changing its technical boundary.",
            "fact_refs": [
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The fixture and assertion directly realize FACT-003's retry claim.",
            "fact_refs": [
              "FACT-003"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "A deterministic transient failure now proves the bounded wait instead of inferring it from loop structure.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "Verification: legacy rollback HTTP probe failed once, retried, succeeded on the second attempt, and the full deployment script suite passed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
        "Verification: legacy rollback HTTP probe failed once, retried, succeeded on the second attempt, and the full deployment script suite passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T12:10:55.506Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the five-dimension Completion Review against content revision 2 and close the Case only if the legacy rollback compatibility change is clean.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh inspection found no ordinary gap after the legacy rollback fallback and delayed-start verification were completed; the latest content revision is ready for semantic review.",
        "snapshot_token": "49ddc6a340a9da30c22afa2892c57d129c61ab608eae984a0e6b2a91eb6b52b8",
        "selected_ref": "case-gap:CASE-20260822-003:CASE-20260822-003:completion-review:1",
        "comparison_summary": "Selected the only ready Case candidate; the four unrelated Project gaps remain case-required and do not block this deployment compatibility closeout.",
        "fresh_discovery_summary": "Source and fixture review after the retry-evidence correction found no additional correctness, compatibility, regression, or scope gap.",
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
            "reason": "The generic Agent scenario evaluation is a separate Project Case."
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
            "reason": "The Runtime resilience backlog is unrelated to this deployment closeout."
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
            "reason": "Permission-bearing project validation requires a separate Case."
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
            "reason": "The repository-wide cross-record audit is independent."
          },
          {
            "ref": "case-gap:CASE-20260822-003:CASE-20260822-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary gaps and threatened impacts are closed, and this review binds the latest retry evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-003:completion-review:1",
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
        "goal": "Perform the five-dimension Completion Review against content revision 2 and close the Case only if the legacy rollback compatibility change is clean.",
        "expected_state_change": "A clean review closes the Case without adding new content facts or findings."
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
            "Review: health-enabled candidates remain governed by Docker healthy/unhealthy states; only missing health metadata uses the public HTTP compatibility probe.",
            "Review: missing-health fallback is bounded by the existing attempt and interval settings, retries startup failures, and returns failure with logs when the bound is exhausted.",
            "Verification: bash syntax, migration failure preservation, unhealthy candidate rollback, normal health success, and first-failure/second-success legacy HTTP fallback scenarios all passed, 2026-08-22.",
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
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
        "project_revision": 166,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The Case corrects a deployment confirmation edge without changing the accepted product capability.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user journey or interaction state is affected.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual rule is affected.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implementation and durable technical note consistently define strict new-image readiness and bounded legacy-image HTTP confirmation.",
            "fact_refs": [
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The production script and stateful fixture directly realize the accepted fallback and retry facts.",
            "fact_refs": [
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The exact first-upgrade rollback compatibility boundary and its transient startup behavior are covered by deterministic failure simulations.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "Verification: complete deployment script suite including delayed legacy HTTP recovery passed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: complete deployment script suite including delayed legacy HTTP recovery passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T12:12:07.767Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-legacy-rollback-health-probe",
      "GAP-legacy-rollback-retry-evidence"
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
    "updated_at": "2026-08-22T12:12:07.767Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
