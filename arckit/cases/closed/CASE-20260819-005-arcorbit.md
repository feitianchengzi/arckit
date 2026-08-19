# 诊断并修复 ArcOrbit 产品反馈输入被清空

Case: CASE-20260819-005
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-19T19:14:41.484Z

## User Intent

查明 ArcOrbit 产品反馈页面在用户输入反馈正文期间意外清空内容的实际触发链，并在后续 fresh rounds 中完成证据指向的必要修复与回归验证。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260819-005",
  "title": "诊断并修复 ArcOrbit 产品反馈输入被清空",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-19T18:57:18.032Z",
  "updated_at": "2026-08-19T19:14:41.484Z",
  "user_intent": "查明 ArcOrbit 产品反馈页面在用户输入反馈正文期间意外清空内容的实际触发链，并在后续 fresh rounds 中完成证据指向的必要修复与回归验证。",
  "expected_outcome": "产品反馈正文输入在窗口刷新、异步状态同步或界面更新过程中保持稳定；只有用户明确清除、成功提交后的既定重置或关闭反馈上下文时才可丢弃草稿。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-product-feedback-draft-cleared-report",
      "revision": 1,
      "status": "accepted",
      "statement": "用户报告：在 ArcOrbit 产品反馈页面输入反馈正文时，已输入文字会被意外清空，表现类似页面自动重新绘制；用户明确期望输入过程中不发生这种重置。",
      "basis": "当前操作人的原始问题报告；该事实接受的是报告内容与期望，不等同于已经复现或确认根因。",
      "evidence": [
        "original_user_input: ArcOrbit的产品反馈页面，在反馈内容的输入过程中会出现输入文字被清空的问题，就像页面被自动重新绘制了一样，预期不应该出现这种情况"
      ]
    },
    {
      "id": "FACT-product-feedback-sdk-route-reload-root-cause",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 产品反馈输入被清空的根因是宿主把 SDK 的正常 history 路由误判成文档缺失：openSubmit 将入口文档路由到 /sdk-v2/submit，而每 60 秒的未读刷新经 service.refreshUnread() 调用 surface.prepare()；prepare() 要求当前 URL 与固定 index.html?embed=web 完全相等，因此执行 loadURL，销毁当前表单文档并重新配置、打开 submit，未提交正文随之丢失。",
      "basis": "生产调用链、真实 SDK 脚本行为和隐藏真实 Electron 文档生命周期夹具完全匹配用户所见的自动重绘与正文清空。",
      "evidence": [
        "runtime/arcorbit/src/product-feedback-window.mjs:27-46",
        "runtime/arcorbit/src/product-feedback-window.mjs:85-128",
        "runtime/arcorbit/desktop/main.mjs:317-322",
        "https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web",
        "Hidden real Electron diagnosis 2026-08-20: routed URL /sdk-v2/submit, injected draft present before strict URL reload and absent afterward."
      ]
    },
    {
      "id": "FACT-product-feedback-draft-preservation-repair-boundary",
      "revision": 1,
      "status": "accepted",
      "statement": "必要修复边界是让已配置的、仍位于允许 Feedback SDK origin 的健康 WebContents 在 submit/status history 路由上继续作为同一 SDK 文档使用；后台未读刷新只能读取现有 SDK 状态，不得因路径不同而 loadURL 或重新 configure/open。只有首次加载、实际文档缺失/失效或用户明确重试时才允许重载，并需覆盖路由后刷新不丢草稿的回归。",
      "basis": "根因位于宿主对 SDK 文档身份的错误判定；窗口没有被重建，SDK history 路由本身不替换文档，输入只在宿主 loadURL 后消失，因此修复应限于文档身份和重载门禁。",
      "evidence": [
        "runtime/arcorbit/src/product-feedback-window.mjs:19-46",
        "runtime/arcorbit/src/product-feedback-window.mjs:49-87",
        "runtime/arcorbit/src/product-feedback-window.mjs:131-153",
        "Hidden real Electron diagnosis 2026-08-20 document identity result."
      ]
    },
    {
      "id": "FACT-product-feedback-draft-preservation-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 产品反馈 surface 现在把固定 HTTPS origin 下带 embed=web 的 /sdk-v2 路径识别为同一健康 SDK 文档。已配置的 submit/status route 在 open/prepare 和后台未读刷新期间不再 loadURL 或重复 configure，进行中草稿与文档身份保持；配置或稳定用户身份变化、显式 retry、首次加载和无效文档仍重新加载固定入口。",
      "basis": "实现严格落在已接受修复边界内；自动化覆盖文档身份、草稿保持、模式切换、显式重试和身份变化，真实 Electron 证明生产 SDK submit 路由执行等价未读刷新后文档与草稿均未变化。",
      "evidence": [
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "Focused product feedback tests: 9 passed, 0 failed.",
        "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
        "Real Electron preservation verification 2026-08-20: routedUrl=/sdk-v2/submit?embed=web; recognized=true; reloaded=false; before/after draft='typed feedback draft'; before/after document UUID identical."
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-product-feedback-draft-realization-undetermined",
      "fact_id": "FACT-product-feedback-draft-cleared-report",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产 surface 已消除后台未读刷新造成的文档重载，自动化和真实 Electron 均证明进行中正文保持。",
      "gap_ids": [],
      "evidence": [
        "FACT-product-feedback-draft-preservation-realized",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "Real Electron preservation verification 2026-08-20."
      ]
    },
    {
      "id": "IMPACT-product-feedback-draft-interaction-contract-threatened",
      "fact_id": "FACT-product-feedback-sdk-route-reload-root-cause",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "稳定交互源和线框投影已明确后台未读刷新复用同一 SDK 文档、不打断输入或清空正文，并说明身份切换、关闭与重试边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html",
        "arckit/interaction/INDEX.md"
      ]
    },
    {
      "id": "IMPACT-product-feedback-sdk-route-lifecycle-threatened",
      "fact_id": "FACT-product-feedback-draft-preservation-repair-boundary",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "稳定技术方案、生产实现和专项测试现在一致表达 SDK 文档身份、配置失效、后台刷新与显式重载边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "arckit/tech/INDEX.md",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-product-feedback-draft-reset-diagnosis",
      "status": "resolved",
      "goal": "建立产品反馈正文被清空的可复现条件、实际状态/渲染触发链、已确认根因及必要修复边界。",
      "reason": "清空可能来自窗口或 WebContents 重建、SDK 页面导航、身份/配置重复注入、异步刷新、表单状态重置等不同路径；不同结论会改变修复对象和验证方式，因此必须先完成诊断。",
      "derived_from": [
        "FACT-product-feedback-draft-cleared-report"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "根因未知，直接阻塞可信修复。",
        "uncertainty": "尚未确认稳定触发条件、状态所有者和实际执行路径。",
        "risk": "未经证据直接修改可能掩盖偶发时序问题或引入反馈提交回归。",
        "user_impact": "用户可能丢失尚未提交的反馈正文。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "记录可重复的触发路径与环境/时序条件，或说明无法稳定复现时的观察路径。",
        "代码逻辑推演必须完整匹配触发条件、表现、状态变化、位置和时序；若不能 100% 匹配，则使用唯一 ARC_DEBUG 标记把关键运行事件写入 arckit/debug/product-feedback-draft-reset.log 并执行复现。",
        "日志、测试或等价运行证据能够区分 WebContents/窗口重建、SDK 导航、身份或配置重复同步、异步刷新及表单内部重置等关键竞争假设。",
        "形成证据支持的根因结论与最小必要修复边界，不在本 Gap 内消费该新结论实施下游修复。"
      ],
      "resolution": {
        "id": "GAP-product-feedback-draft-reset-diagnosis",
        "status": "resolved",
        "outcome": "已确认产品反馈正文被清空的根因：SDK openSubmit 将同一文档通过 history 路由到 /sdk-v2/submit；ArcOrbit 后台未读刷新调用 prepare()，其严格入口 URL 相等判断把正常路由误判为未加载并执行 loadURL，销毁当前表单文档，随后重新 configure/openSubmit。",
        "reason": "生产代码、真实 SDK bundle 和真实 Electron 夹具在触发条件、URL 状态、文档替换、草稿消失、发生位置与时序上完全一致，并排除了窗口/WebContents 重建和 SDK 表单自身清空作为必要原因。",
        "evidence": [
          "runtime/arcorbit/src/product-feedback-window.mjs:27-32,36-46,49-87,96-128",
          "runtime/arcorbit/desktop/main.mjs:317-322",
          "Feedback SDK document and bundle observed 2026-08-20: openSubmit routes the same document to /sdk-v2/submit using history state.",
          "Hidden real Electron diagnosis 2026-08-20: routedUrl=https://feedback.feitianchengzi.com/sdk-v2/submit?embed=web; before='typed feedback draft'; strict URL condition reloaded=true; after=null; final route returned to /sdk-v2/submit.",
          "Focused product feedback tests: 9 passed, 0 failed."
        ],
        "occurred_at": "2026-08-19T19:04:08.825Z"
      }
    },
    {
      "id": "GAP-product-feedback-draft-preservation-fix",
      "status": "resolved",
      "goal": "使 ArcOrbit 在 Feedback SDK submit/status 同源路由和后台未读刷新期间保持同一健康 SDK 文档与进行中草稿，并让该交互和技术边界可持久恢复、可回归验证。",
      "reason": "已确认严格入口 URL 相等判断会把正常 SDK history 路由误判为文档缺失并执行 loadURL；需要在证据界定的宿主边界修复，而不能通过停用未读或表单外部缓存掩盖根因。",
      "derived_from": [
        "FACT-product-feedback-sdk-route-reload-root-cause",
        "FACT-product-feedback-draft-preservation-repair-boundary"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞用户问题解决和 Case closure。",
        "uncertainty": "根因与修复边界已确认，剩余不确定性低。",
        "risk": "修改必须保持首次加载、显式重试、身份切换、模式切换和远端导航安全边界。",
        "user_impact": "修复后避免用户丢失未提交反馈正文。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "生产 surface 在已配置且处于允许 SDK origin 的 submit/status route 时，open/prepare 不调用 loadURL 或重复 configure。",
        "后台 refreshUnread 在进行中 submit 草稿存在时保持同一文档和草稿内容。",
        "首次加载、实际失效、显式 retry、submit/status 切换、未读刷新和 URL 安全边界专项测试通过。",
        "真实 Electron 使用 SDK 路由后执行等价后台未读刷新，正文仍保留。",
        "稳定 interaction/technical evidence 明确草稿保持与文档身份边界；临时诊断文件或标记无残留。"
      ],
      "resolution": {
        "id": "GAP-product-feedback-draft-preservation-fix",
        "status": "resolved",
        "outcome": "ArcOrbit 现在按固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 识别健康 Feedback SDK 文档；submit/status 路由与后台未读刷新复用同一文档并保持草稿，只有首次加载、无效文档、配置/身份变化或显式重试才重新加载。",
        "reason": "生产实现、专项测试、完整 ArcOrbit 检查、稳定 Interaction/Tech 来源和真实 Electron 草稿保持结果一致，且导航、身份切换和显式恢复边界均被保留。",
        "evidence": [
          "runtime/arcorbit/src/product-feedback-window.mjs:29-67,253-266",
          "runtime/arcorbit/test/product-feedback-window.test.mjs:16-28,57-170",
          "arckit/interaction/product-feedback-center/interaction.md:16-23,36-38,50-63,79-88",
          "arckit/interaction/product-feedback-center/default.html:28-29",
          "arckit/tech/arcorbit/product-feedback-integration.md:26-38,49-56",
          "Focused product feedback tests: 9 passed, 0 failed.",
          "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
          "Real Electron preservation verification 2026-08-20: /sdk-v2/submit recognized=true, reloaded=false, draft value and document UUID unchanged after equivalent unread refresh."
        ],
        "occurred_at": "2026-08-19T19:11:25.517Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-19T18:57:18.032Z"
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
          "Fresh source review: runtime/arcorbit/src/product-feedback-window.mjs recognizes only the fixed HTTPS origin, /sdk-v2 path space and embed=web as a reusable SDK document, while configuration/identity changes and retry retain explicit reload behavior.",
          "Fresh focused verification: node --test test/product-feedback-window.test.mjs test/product-feedback-service.test.mjs — 9 passed, 0 failed.",
          "Fresh full verification: npm run check — 224 tests, 222 passed, 2 skipped, 0 failed.",
          "Accepted real Electron evidence: submit route recognized=true, reloaded=false, draft value and document UUID unchanged after equivalent unread refresh.",
          "Stable interaction and technical sources consistently define draft preservation, SDK document identity, identity switching, retry and navigation boundaries.",
          "git diff --check passed; no temporary product-feedback-draft-reset.log exists and no temporary diagnostic marker remains outside durable Case evidence."
        ],
        "occurred_at": "2026-08-19T19:14:41.484Z"
      }
    ],
    "evidence": [
      "Fresh source review: runtime/arcorbit/src/product-feedback-window.mjs recognizes only the fixed HTTPS origin, /sdk-v2 path space and embed=web as a reusable SDK document, while configuration/identity changes and retry retain explicit reload behavior.",
      "Fresh focused verification: node --test test/product-feedback-window.test.mjs test/product-feedback-service.test.mjs — 9 passed, 0 failed.",
      "Fresh full verification: npm run check — 224 tests, 222 passed, 2 skipped, 0 failed.",
      "Accepted real Electron evidence: submit route recognized=true, reloaded=false, draft value and document UUID unchanged after equivalent unread refresh.",
      "Stable interaction and technical sources consistently define draft preservation, SDK document identity, identity switching, retry and navigation boundaries.",
      "git diff --check passed; no temporary product-feedback-draft-reset.log exists and no temporary diagnostic marker remains outside durable Case evidence."
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
      "goal": "通过生产调用链、真实 Feedback SDK 路由和隐藏 Electron 文档生命周期夹具，确认清空正文的实际触发链，并界定最小修复边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户可见的未提交内容丢失由未知根因阻塞修复；该 Case Gap 具有最高直接用户影响和信息增益，并且可通过生产调用链与真实 SDK WebContents 复现。",
        "snapshot_token": "e0970d68c219ba8d6876278a1bac3861d360423c0bc35389da47177d522741f2",
        "selected_ref": "case-gap:CASE-20260819-005:GAP-product-feedback-draft-reset-diagnosis",
        "comparison_summary": "选择产品反馈草稿重置诊断。四个 Project gaps 均不构成该故障的依赖：agent scenario evaluation、runtime resilience/adapters、security real-project validation、cross-record audit 延后。",
        "fresh_discovery_summary": "Round opening 时没有发现需取代 persisted diagnosis Gap 的 fresh candidate；诊断过程中形成的修复义务作为下轮候选写回，不在本轮消费。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前反馈故障诊断。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前未提交正文丢失问题。"
            },
            "reason": "属于通用场景验证，与当前输入状态回归无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前反馈故障诊断。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前反馈正文丢失更直接。"
            },
            "reason": "Runtime 韧性与 adapter 验收不是当前 Feedback SDK 文档重载的前置条件。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前反馈故障诊断。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前反馈正文丢失更直接。"
            },
            "reason": "当前诊断不需要改变凭据或权限边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前反馈故障诊断。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前反馈正文丢失更直接。"
            },
            "reason": "跨记录审计与 SDK WebContents 的页面生命周期无直接依赖。"
          },
          {
            "ref": "case-gap:CASE-20260819-005:GAP-product-feedback-draft-reset-diagnosis",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "根因未知，直接阻塞可信修复。",
              "uncertainty": "需区分窗口重建、SDK 路由、身份同步、未读刷新和表单内部重置。",
              "risk": "未经证据修改可能掩盖时序问题。",
              "user_impact": "用户会丢失未提交反馈正文。"
            },
            "reason": "唯一直接承接当前用户问题且已 ready 的 Case Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-product-feedback-draft-reset-diagnosis",
        "responsibility": "agent",
        "goal": "建立产品反馈正文被清空的可复现条件、实际状态/渲染触发链、已确认根因及必要修复边界。",
        "reason": "清空可能来自窗口或 WebContents 重建、SDK 页面导航、身份/配置重复注入、异步刷新、表单状态重置等不同路径；不同结论会改变修复对象和验证方式，因此必须先完成诊断。",
        "derived_from": [
          "FACT-product-feedback-draft-cleared-report"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "根因未知，直接阻塞可信修复。",
          "uncertainty": "尚未确认稳定触发条件、状态所有者和实际执行路径。",
          "risk": "未经证据直接修改可能掩盖偶发时序问题或引入反馈提交回归。",
          "user_impact": "用户可能丢失尚未提交的反馈正文。"
        },
        "evidence_required": [
          "记录可重复的触发路径与环境/时序条件，或说明无法稳定复现时的观察路径。",
          "代码逻辑推演必须完整匹配触发条件、表现、状态变化、位置和时序；若不能 100% 匹配，则使用唯一 ARC_DEBUG 标记把关键运行事件写入 arckit/debug/product-feedback-draft-reset.log 并执行复现。",
          "日志、测试或等价运行证据能够区分 WebContents/窗口重建、SDK 导航、身份或配置重复同步、异步刷新及表单内部重置等关键竞争假设。",
          "形成证据支持的根因结论与最小必要修复边界，不在本 Gap 内消费该新结论实施下游修复。"
        ]
      },
      "planned_transition": {
        "goal": "通过生产调用链、真实 Feedback SDK 路由和隐藏 Electron 文档生命周期夹具，确认清空正文的实际触发链，并界定最小修复边界。",
        "expected_state_change": "诊断 Gap 被证据充分地关闭；根因和修复边界成为 accepted facts；依赖这些新事实的实现与验证义务作为新的 open Gap 留待 post-commit fresh read。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-product-feedback-draft-reset-diagnosis",
          "status": "resolved",
          "outcome": "已确认产品反馈正文被清空的根因：SDK openSubmit 将同一文档通过 history 路由到 /sdk-v2/submit；ArcOrbit 后台未读刷新调用 prepare()，其严格入口 URL 相等判断把正常路由误判为未加载并执行 loadURL，销毁当前表单文档，随后重新 configure/openSubmit。",
          "reason": "生产代码、真实 SDK bundle 和真实 Electron 夹具在触发条件、URL 状态、文档替换、草稿消失、发生位置与时序上完全一致，并排除了窗口/WebContents 重建和 SDK 表单自身清空作为必要原因。",
          "evidence": [
            "runtime/arcorbit/src/product-feedback-window.mjs:27-32,36-46,49-87,96-128",
            "runtime/arcorbit/desktop/main.mjs:317-322",
            "Feedback SDK document and bundle observed 2026-08-20: openSubmit routes the same document to /sdk-v2/submit using history state.",
            "Hidden real Electron diagnosis 2026-08-20: routedUrl=https://feedback.feitianchengzi.com/sdk-v2/submit?embed=web; before='typed feedback draft'; strict URL condition reloaded=true; after=null; final route returned to /sdk-v2/submit.",
            "Focused product feedback tests: 9 passed, 0 failed."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-product-feedback-sdk-route-reload-root-cause",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 产品反馈输入被清空的根因是宿主把 SDK 的正常 history 路由误判成文档缺失：openSubmit 将入口文档路由到 /sdk-v2/submit，而每 60 秒的未读刷新经 service.refreshUnread() 调用 surface.prepare()；prepare() 要求当前 URL 与固定 index.html?embed=web 完全相等，因此执行 loadURL，销毁当前表单文档并重新配置、打开 submit，未提交正文随之丢失。",
            "basis": "生产调用链、真实 SDK 脚本行为和隐藏真实 Electron 文档生命周期夹具完全匹配用户所见的自动重绘与正文清空。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs:27-46",
              "runtime/arcorbit/src/product-feedback-window.mjs:85-128",
              "runtime/arcorbit/desktop/main.mjs:317-322",
              "https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web",
              "Hidden real Electron diagnosis 2026-08-20: routed URL /sdk-v2/submit, injected draft present before strict URL reload and absent afterward."
            ]
          },
          {
            "id": "FACT-product-feedback-draft-preservation-repair-boundary",
            "revision": 1,
            "status": "accepted",
            "statement": "必要修复边界是让已配置的、仍位于允许 Feedback SDK origin 的健康 WebContents 在 submit/status history 路由上继续作为同一 SDK 文档使用；后台未读刷新只能读取现有 SDK 状态，不得因路径不同而 loadURL 或重新 configure/open。只有首次加载、实际文档缺失/失效或用户明确重试时才允许重载，并需覆盖路由后刷新不丢草稿的回归。",
            "basis": "根因位于宿主对 SDK 文档身份的错误判定；窗口没有被重建，SDK history 路由本身不替换文档，输入只在宿主 loadURL 后消失，因此修复应限于文档身份和重载门禁。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs:19-46",
              "runtime/arcorbit/src/product-feedback-window.mjs:49-87",
              "runtime/arcorbit/src/product-feedback-window.mjs:131-153",
              "Hidden real Electron diagnosis 2026-08-20 document identity result."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-product-feedback-draft-interaction-contract-threatened",
            "fact_id": "FACT-product-feedback-sdk-route-reload-root-cause",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "当前稳定交互没有明确记录进行中反馈草稿在后台未读刷新与同文档 SDK 路由间必须保持，且实际行为已违反用户接受的交互预期。",
            "gap_ids": [
              "GAP-product-feedback-draft-preservation-fix"
            ],
            "evidence": [
              "FACT-product-feedback-draft-cleared-report",
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "arckit/interaction/product-feedback-center/interaction.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-sdk-route-lifecycle-threatened",
            "fact_id": "FACT-product-feedback-draft-preservation-repair-boundary",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "宿主当前用固定入口 URL 代表 SDK 文档身份，与 SDK 的同源 history 路由契约冲突；需要修复并让该生命周期边界可验证、可恢复。",
            "gap_ids": [
              "GAP-product-feedback-draft-preservation-fix"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-draft-realization-undetermined",
            "fact_id": "FACT-product-feedback-draft-cleared-report",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "真实 Electron 复现已把“可能未兑现”提升为已确认的现实违背：后台未读刷新会重载 SDK 文档并丢弃未提交正文。",
            "gap_ids": [
              "GAP-product-feedback-draft-preservation-fix"
            ],
            "evidence": [
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "Hidden real Electron diagnosis 2026-08-20: draft present before reload and null afterward."
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-product-feedback-draft-preservation-fix",
            "status": "open",
            "goal": "使 ArcOrbit 在 Feedback SDK submit/status 同源路由和后台未读刷新期间保持同一健康 SDK 文档与进行中草稿，并让该交互和技术边界可持久恢复、可回归验证。",
            "reason": "已确认严格入口 URL 相等判断会把正常 SDK history 路由误判为文档缺失并执行 loadURL；需要在证据界定的宿主边界修复，而不能通过停用未读或表单外部缓存掩盖根因。",
            "derived_from": [
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "FACT-product-feedback-draft-preservation-repair-boundary"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接阻塞用户问题解决和 Case closure。",
              "uncertainty": "根因与修复边界已确认，剩余不确定性低。",
              "risk": "修改必须保持首次加载、显式重试、身份切换、模式切换和远端导航安全边界。",
              "user_impact": "修复后避免用户丢失未提交反馈正文。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "生产 surface 在已配置且处于允许 SDK origin 的 submit/status route 时，open/prepare 不调用 loadURL 或重复 configure。",
              "后台 refreshUnread 在进行中 submit 草稿存在时保持同一文档和草稿内容。",
              "首次加载、实际失效、显式 retry、submit/status 切换、未读刷新和 URL 安全边界专项测试通过。",
              "真实 Electron 使用 SDK 路由后执行等价后台未读刷新，正文仍保留。",
              "稳定 interaction/technical evidence 明确草稿保持与文档身份边界；临时诊断文件或标记无残留。"
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
        "project_revision": 127,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮确认的是既有产品反馈能力的实现缺陷与技术触发链，没有建立或改变产品范围、用户群、核心能力集合或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "用户已明确输入期间不得意外清空，但稳定交互来源尚未明确后台未读刷新与 SDK 路由期间的草稿保持语义，实际行为也已违背该预期。",
            "fact_refs": [
              "FACT-product-feedback-draft-cleared-report",
              "FACT-product-feedback-sdk-route-reload-root-cause"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-product-feedback-draft-preservation-fix"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "故障来自 SDK 文档生命周期与状态重载，不建立或改变颜色、布局、组件外观、主题或其他视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "当前固定入口 URL 身份判断与 SDK 的同源 history route 契约冲突，文档加载、刷新与重试边界需要按已确认修复边界重新实现并留存证据。",
            "fact_refs": [
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "FACT-product-feedback-draft-preservation-repair-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-product-feedback-draft-preservation-fix"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "真实 Electron 已确认后台未读刷新会销毁反馈表单文档并清空未提交正文，软件尚未兑现当前 Case 接受的稳定输入预期。",
            "fact_refs": [
              "FACT-product-feedback-draft-cleared-report",
              "FACT-product-feedback-sdk-route-reload-root-cause"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-product-feedback-draft-preservation-fix"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "未提交正文丢失风险及其触发链由生产源码、真实 SDK 路由和真实 Electron 文档替换结果共同支持，能够重复核对且未宣称风险已经受控。",
            "fact_refs": [
              "FACT-product-feedback-sdk-route-reload-root-cause"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs:27-46",
              "runtime/arcorbit/desktop/main.mjs:317-322",
              "Feedback SDK route evidence observed from its production document/bundle on 2026-08-20.",
              "Hidden Electron result: routedUrl=/sdk-v2/submit; before='typed feedback draft'; reloaded=true; after=null.",
              "node --test test/product-feedback-window.test.mjs test/product-feedback-service.test.mjs: 9 passed, 0 failed."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Trusted post-commit snapshot e25c0fb85ac2f62188b721d1447e664c7c2630fc606e8e56190ce62155de1b78 observed_after_commit=true at Project r127.",
        "runtime/arcorbit/src/product-feedback-window.mjs:27-46 strict entry-URL checks in open/prepare.",
        "runtime/arcorbit/desktop/main.mjs:317-322 refreshUnread every 60 seconds.",
        "Production Feedback SDK observed 2026-08-20: openSubmit routes to /sdk-v2/submit with history state.",
        "Hidden real Electron diagnosis: routedUrl=/sdk-v2/submit; before typed draft; host-equivalent URL check caused reload; after=null.",
        "Focused tests: 9 passed, 0 failed.",
        "git diff --check passed; no ARC_DEBUG:product-feedback-draft-reset marker or temporary log remained."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260819-185607069Z",
      "occurred_at": "2026-08-19T19:04:08.825Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在宿主 SDK 文档身份门禁内修复错误重载，补齐路由、草稿、重试和身份变化回归，并同步稳定交互及技术边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Gap 是唯一 ready 的 Case Gap，直接承接已接受根因，阻塞用户问题解决和 Case closure；修复边界已明确且可通过自动化与真实 Electron 验证。",
        "snapshot_token": "b1f81f3390868cf30c9c86932149c5b9f55eb893d0dddff8ae898e73b6b92c8a",
        "selected_ref": "case-gap:CASE-20260819-005:GAP-product-feedback-draft-preservation-fix",
        "comparison_summary": "选择草稿保持修复。agent scenario evaluation、runtime resilience/adapters、security real-project validation、cross-record audit 四个 Project gaps 均不构成当前已确认修复的依赖，继续延后。",
        "fresh_discovery_summary": "本轮没有发现需要先于当前修复建立的 fresh candidate；实现和验证未暴露新的普通工作义务。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前草稿丢失问题。"
            },
            "reason": "通用场景验证与当前 SDK 文档生命周期修复无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前草稿丢失更直接。"
            },
            "reason": "Runtime 韧性和 adapter 验收不是 Feedback SDK WebContents 修复的前置条件。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前草稿丢失更直接。"
            },
            "reason": "本轮保持既有凭据与权限边界，不依赖真实权限项目验证。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "当前范围未改变。",
              "risk": "high",
              "user_impact": "当前草稿丢失更直接。"
            },
            "reason": "跨记录审计与 SDK 页面重载修复无直接依赖。"
          },
          {
            "ref": "case-gap:CASE-20260819-005:GAP-product-feedback-draft-preservation-fix",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞用户问题解决和 Case closure。",
              "uncertainty": "根因与修复边界已确认，剩余不确定性低。",
              "risk": "必须保持首次加载、显式重试、身份切换、模式切换和导航安全边界。",
              "user_impact": "避免用户丢失未提交反馈正文。"
            },
            "reason": "唯一直接承接已接受根因并可在本轮完整实现、验证的 ready Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-product-feedback-draft-preservation-fix",
        "responsibility": "agent",
        "goal": "使 ArcOrbit 在 Feedback SDK submit/status 同源路由和后台未读刷新期间保持同一健康 SDK 文档与进行中草稿，并让该交互和技术边界可持久恢复、可回归验证。",
        "reason": "已确认严格入口 URL 相等判断会把正常 SDK history 路由误判为文档缺失并执行 loadURL；需要在证据界定的宿主边界修复，而不能通过停用未读或表单外部缓存掩盖根因。",
        "derived_from": [
          "FACT-product-feedback-sdk-route-reload-root-cause",
          "FACT-product-feedback-draft-preservation-repair-boundary"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞用户问题解决和 Case closure。",
          "uncertainty": "根因与修复边界已确认，剩余不确定性低。",
          "risk": "修改必须保持首次加载、显式重试、身份切换、模式切换和远端导航安全边界。",
          "user_impact": "修复后避免用户丢失未提交反馈正文。"
        },
        "evidence_required": [
          "生产 surface 在已配置且处于允许 SDK origin 的 submit/status route 时，open/prepare 不调用 loadURL 或重复 configure。",
          "后台 refreshUnread 在进行中 submit 草稿存在时保持同一文档和草稿内容。",
          "首次加载、实际失效、显式 retry、submit/status 切换、未读刷新和 URL 安全边界专项测试通过。",
          "真实 Electron 使用 SDK 路由后执行等价后台未读刷新，正文仍保留。",
          "稳定 interaction/technical evidence 明确草稿保持与文档身份边界；临时诊断文件或标记无残留。"
        ]
      },
      "planned_transition": {
        "goal": "在宿主 SDK 文档身份门禁内修复错误重载，补齐路由、草稿、重试和身份变化回归，并同步稳定交互及技术边界。",
        "expected_state_change": "健康 SDK submit/status 文档在后台未读刷新时被复用且草稿保持；显式重试和配置/身份变化仍重新加载；相关 threatened impacts 转为 upheld，普通 Gap 闭合并进入 completion review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-product-feedback-draft-preservation-fix",
          "status": "resolved",
          "outcome": "ArcOrbit 现在按固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 识别健康 Feedback SDK 文档；submit/status 路由与后台未读刷新复用同一文档并保持草稿，只有首次加载、无效文档、配置/身份变化或显式重试才重新加载。",
          "reason": "生产实现、专项测试、完整 ArcOrbit 检查、稳定 Interaction/Tech 来源和真实 Electron 草稿保持结果一致，且导航、身份切换和显式恢复边界均被保留。",
          "evidence": [
            "runtime/arcorbit/src/product-feedback-window.mjs:29-67,253-266",
            "runtime/arcorbit/test/product-feedback-window.test.mjs:16-28,57-170",
            "arckit/interaction/product-feedback-center/interaction.md:16-23,36-38,50-63,79-88",
            "arckit/interaction/product-feedback-center/default.html:28-29",
            "arckit/tech/arcorbit/product-feedback-integration.md:26-38,49-56",
            "Focused product feedback tests: 9 passed, 0 failed.",
            "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
            "Real Electron preservation verification 2026-08-20: /sdk-v2/submit recognized=true, reloaded=false, draft value and document UUID unchanged after equivalent unread refresh."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-product-feedback-draft-preservation-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 产品反馈 surface 现在把固定 HTTPS origin 下带 embed=web 的 /sdk-v2 路径识别为同一健康 SDK 文档。已配置的 submit/status route 在 open/prepare 和后台未读刷新期间不再 loadURL 或重复 configure，进行中草稿与文档身份保持；配置或稳定用户身份变化、显式 retry、首次加载和无效文档仍重新加载固定入口。",
            "basis": "实现严格落在已接受修复边界内；自动化覆盖文档身份、草稿保持、模式切换、显式重试和身份变化，真实 Electron 证明生产 SDK submit 路由执行等价未读刷新后文档与草稿均未变化。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "Focused product feedback tests: 9 passed, 0 failed.",
              "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
              "Real Electron preservation verification 2026-08-20: routedUrl=/sdk-v2/submit?embed=web; recognized=true; reloaded=false; before/after draft='typed feedback draft'; before/after document UUID identical."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-draft-realization-undetermined",
            "fact_id": "FACT-product-feedback-draft-cleared-report",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产 surface 已消除后台未读刷新造成的文档重载，自动化和真实 Electron 均证明进行中正文保持。",
            "gap_ids": [],
            "evidence": [
              "FACT-product-feedback-draft-preservation-realized",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "Real Electron preservation verification 2026-08-20."
            ]
          },
          {
            "id": "IMPACT-product-feedback-draft-interaction-contract-threatened",
            "fact_id": "FACT-product-feedback-sdk-route-reload-root-cause",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "稳定交互源和线框投影已明确后台未读刷新复用同一 SDK 文档、不打断输入或清空正文，并说明身份切换、关闭与重试边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "arckit/interaction/INDEX.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-sdk-route-lifecycle-threatened",
            "fact_id": "FACT-product-feedback-draft-preservation-repair-boundary",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "稳定技术方案、生产实现和专项测试现在一致表达 SDK 文档身份、配置失效、后台刷新与显式重载边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "arckit/tech/INDEX.md",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
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
            "observed_revision": 19,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. 顶部命令栏提供唯一的“产品反馈”入口，登录用户无需配置即可向内置 Project 107 提交反馈并在同一窗口查看自己的反馈；入口按 1-99、99+ 显示未读，零未读隐藏，退出账户清零；未登录或 SDK 失败时提供脱敏恢复。产品反馈中心在 submit/status 路由和后台未读刷新期间复用同一健康 SDK 文档；后台刷新不重载页面、不打断输入或清空进行中正文，身份切换、关闭或显式重试结束旧草稿上下文。",
              "reason": "已确认并修复后台未读刷新误重载 SDK 文档的问题，稳定交互源、线框投影和真实 Electron 行为现在一致。",
              "evidence": [
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/interaction/product-feedback-center/default.html",
                "runtime/arcorbit/src/product-feedback-window.mjs",
                "runtime/arcorbit/test/product-feedback-window.test.mjs",
                "Real Electron preservation verification 2026-08-20."
              ],
              "confidence": "high",
              "resume_condition": "当入口位置、草稿生命周期、配置责任、角标语义、模式切换或恢复责任变化时重审。"
            },
            "gap_refs": [],
            "reason": "补充已接受且已实现的产品反馈草稿保持与后台同步交互语义。",
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "FACT-product-feedback-draft-preservation-realized"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 21,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes existing Workshop services without requiring backend changes: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。产品反馈 SDK 文档身份由固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 共同确定；已配置文档在 submit/status 路由和未读刷新期间不执行 loadURL 或重复 configure，配置/身份变化、无效文档与显式 retry 才重新加载固定入口。",
              "reason": "SDK 使用 history route 表达 submit/status，宿主必须按文档身份而非固定入口 URL 判断健康状态，才能同时保持草稿、未读和安全边界。",
              "evidence": [
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "runtime/arcorbit/src/product-feedback-window.mjs",
                "runtime/arcorbit/test/product-feedback-window.test.mjs",
                "Real Electron preservation verification 2026-08-20."
              ],
              "confidence": "high",
              "resume_condition": "当 Renderer origin、Electron WebContents API、Feedback SDK loader/route 契约或反馈身份配置变化时重审。"
            },
            "gap_refs": [],
            "reason": "补充已验证的 SDK 文档身份、后台刷新和受控重载技术边界。",
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "FACT-product-feedback-draft-preservation-realized"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "对 ArcOrbit 产品反馈草稿保持修复执行 implementation-focused completion review，并在无发现时关闭当前 Case。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/interaction/product-feedback-center/default.html",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "runtime/arcorbit/src/product-feedback-window.mjs",
          "runtime/arcorbit/test/product-feedback-window.test.mjs",
          "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
          "Real Electron preservation verification 2026-08-20."
        ]
      },
      "invariant_assessment": {
        "project_revision": 127,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮兑现既有产品反馈能力和交互质量，不改变产品范围、用户群、能力集合或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互源与线框投影明确后台未读刷新、同文档模式路由、草稿保持和上下文结束边界。",
            "fact_refs": [
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只补充既有线框状态中的行为说明，没有改变布局、颜色、主题、组件视觉或视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "SDK 文档身份、配置比较、后台刷新、身份切换、显式重试和导航安全边界在稳定技术方案、生产实现和测试中一致。",
            "fact_refs": [
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "专项测试与真实 Electron 均证明 submit 路由上的等价后台未读刷新不重载文档，草稿内容和文档身份保持。",
            "fact_refs": [
              "FACT-product-feedback-draft-cleared-report",
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "Focused product feedback tests: 9 passed, 0 failed.",
              "Real Electron preservation verification 2026-08-20."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "草稿丢失风险由根因修复、专项回归、完整检查和真实 SDK Electron 路径共同验证为受控，同时显式重载和身份切换边界仍有覆盖。",
            "fact_refs": [
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
              "Real Electron preservation verification 2026-08-20: recognized=true, reloaded=false, draft and document UUID unchanged.",
              "git diff --check passed; no temporary ARC_DEBUG marker or diagnosis log remained."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Trusted post-commit snapshot 7ece819f65b2ead5e636d31a4d79b47a1675198d2a9471d13ddc1a912e891495 observed_after_commit=true at Project r127 / Case content r1.",
        "runtime/arcorbit/src/product-feedback-window.mjs: healthy SDK document identity and controlled configuration invalidation.",
        "runtime/arcorbit/test/product-feedback-window.test.mjs: route identity, draft preservation, mode switch, retry and identity-change regression.",
        "Focused product feedback tests: 9 passed, 0 failed.",
        "npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
        "Real Electron preservation verification 2026-08-20: /sdk-v2/submit recognized; no reload; draft and document identity unchanged.",
        "arckit-interaction document_scope=change; updated product-feedback-center/interaction.md, product-feedback-center/default.html and INDEX.md; fact_result=managed_case/updated.",
        "arckit-tech document_scope=change; updated arcorbit/product-feedback-integration.md and INDEX.md; fact_result=managed_case/updated.",
        "git diff --check passed; INDEX line counts match; no temporary fixture, ARC_DEBUG marker or diagnosis log remained."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260819-185607069Z",
      "occurred_at": "2026-08-19T19:11:25.517Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 Case content revision 2 执行 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality 五维审阅。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的普通 Gap 与 state impacts 已全部关闭；四个 Project Gap 均需另建 Case，唯一 ready 候选是绑定 content revision 2 的 completion review。",
        "snapshot_token": "9c6678c56a774d6a8350f3df68f42cdc50eec38ca114537a0847ec41ea078321",
        "selected_ref": "case-gap:CASE-20260819-005:CASE-20260819-005:completion-review:1",
        "comparison_summary": "completion review 直接阻塞当前 Case 关闭且已有完整实现与验证证据；四个 Project Gap 与本次产品反馈修复无直接依赖，均因 case_required 延后。",
        "fresh_discovery_summary": "审阅未发现需要新增的修复 Gap、人工决策或外部等待事项。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "与当前反馈草稿问题无直接关联。"
            },
            "reason": "需要独立 Case 验证动态 Gap 选择场景，不能替代当前实现审阅。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "当前 Case 未引入相关不确定性。",
              "risk": "high",
              "user_impact": "与本次反馈草稿保持修复无直接关联。"
            },
            "reason": "属于 Runtime 韧性与 adapter 验收工作，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "high",
              "user_impact": "当前修复未改变既有凭据和权限边界。"
            },
            "reason": "需要独立的真实权限项目验证，不能在本轮消费。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "当前 Case 未暴露新的跨记录漂移。",
              "risk": "high",
              "user_impact": "与当前反馈表单问题无直接关联。"
            },
            "reason": "严格跨记录审计需要独立 Case；当前 transition 仅完成实现审阅。"
          },
          {
            "ref": "case-gap:CASE-20260819-005:CASE-20260819-005:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是关闭当前 Case 前唯一 ready 且必要的实现审阅义务。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260819-005:completion-review:1",
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
        "goal": "对 Case content revision 2 执行 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality 五维审阅。",
        "expected_state_change": "记录可信 completion review 结果；若无 finding，则关闭当前 Case。"
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
            "Fresh source review: runtime/arcorbit/src/product-feedback-window.mjs recognizes only the fixed HTTPS origin, /sdk-v2 path space and embed=web as a reusable SDK document, while configuration/identity changes and retry retain explicit reload behavior.",
            "Fresh focused verification: node --test test/product-feedback-window.test.mjs test/product-feedback-service.test.mjs — 9 passed, 0 failed.",
            "Fresh full verification: npm run check — 224 tests, 222 passed, 2 skipped, 0 failed.",
            "Accepted real Electron evidence: submit route recognized=true, reloaded=false, draft value and document UUID unchanged after equivalent unread refresh.",
            "Stable interaction and technical sources consistently define draft preservation, SDK document identity, identity switching, retry and navigation boundaries.",
            "git diff --check passed; no temporary product-feedback-draft-reset.log exists and no temporary diagnostic marker remains outside durable Case evidence."
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "ArcOrbit 产品反馈输入清空问题已完成根因修复、真实环境验证和 implementation-focused completion review；当前 Case 可关闭。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "CASE-20260819-005 content revision 2 completion review outcome: clean.",
          "Fresh focused tests: 9 passed, 0 failed.",
          "Fresh npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
          "Accepted real Electron draft-preservation verification 2026-08-20."
        ]
      },
      "invariant_assessment": {
        "project_revision": 128,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只审阅已经完成的实现与证据，不建立或改变产品范围、能力集合、用户群或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互来源完整描述同文档模式切换、后台未读刷新、草稿保持以及关闭、身份切换和重试边界，审阅未发现歧义或遗漏。",
            "fact_refs": [
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮实现与审阅没有改变布局、主题、颜色、组件视觉或其他视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "稳定技术方案、生产实现和测试一致表达 SDK 文档身份、配置比较、未读刷新、显式重试、身份切换及导航安全边界。",
            "fact_refs": [
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "源码审阅、专项测试、完整检查和真实 Electron 结果共同证明后台未读刷新不再重载 submit/status 文档或清除进行中正文。",
            "fact_refs": [
              "FACT-product-feedback-draft-cleared-report",
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "Fresh focused tests: 9 passed, 0 failed.",
              "Fresh npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
              "Real Electron preservation verification 2026-08-20."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "草稿丢失风险由针对性回归、完整测试套件和真实 SDK Electron 文档身份验证共同覆盖；显式重试、身份变化及导航边界也保留了回归证据。",
            "fact_refs": [
              "FACT-product-feedback-sdk-route-reload-root-cause",
              "FACT-product-feedback-draft-preservation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "Fresh focused tests: 9 passed, 0 failed.",
              "Fresh npm run check: 224 tests, 222 passed, 2 skipped, 0 failed.",
              "Real Electron preservation verification 2026-08-20: recognized=true, reloaded=false, draft and document UUID unchanged.",
              "git diff --check passed; no temporary diagnosis log remains."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Trusted post-commit snapshot f18363cc9288ac8ceb0d869735f11ab1d087c83e96b2e98c55c8fbd633a92db6 observed_after_commit=true at Project revision 128 and Case content revision 2.",
        "Production source and tests were freshly inspected for implementation correctness and boundary preservation.",
        "Focused product feedback tests freshly passed: 9/9.",
        "Full ArcOrbit check freshly passed: 222 passed, 2 skipped, 0 failed out of 224 tests.",
        "Previously accepted real Electron preservation evidence directly exercises the reported failure path.",
        "Stable Interaction and Tech documents match production behavior.",
        "No completion-review findings were identified across all five dimensions."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260819-185607069Z",
      "occurred_at": "2026-08-19T19:14:41.484Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-product-feedback-draft-reset-diagnosis",
      "GAP-product-feedback-draft-preservation-fix"
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
    "updated_at": "2026-08-19T19:14:41.484Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
