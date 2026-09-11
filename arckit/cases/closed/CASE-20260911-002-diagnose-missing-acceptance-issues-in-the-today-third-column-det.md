# Diagnose missing acceptance issues in the Today third-column detail

Case: CASE-20260911-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-11T08:25:32.839Z

## User Intent

解决用户在 Today 第三栏详情提出验收问题后，仍看不到问题列表和对应处理状态的问题，跟进已关闭的 CASE-20260904-001 所未覆盖的实际使用路径。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260911-002",
  "title": "Diagnose missing acceptance issues in the Today third-column detail",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-11T07:55:30.496Z",
  "updated_at": "2026-09-11T08:25:32.839Z",
  "user_intent": "解决用户在 Today 第三栏详情提出验收问题后，仍看不到问题列表和对应处理状态的问题，跟进已关闭的 CASE-20260904-001 所未覆盖的实际使用路径。",
  "expected_outcome": "Today 第三栏详情在成功提交验收问题后直接显示该任务的问题原文、当前处理状态及可用进展，并以实际数据来源和页面行为验证结果。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260911-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户明确指出目标位置是 Today 页面的第三栏详情，并报告在该位置提出验收问题后仍看不到问题列表及对应处理状态。",
      "basis": "当前用户的直接使用反馈；这是症状报告，不是已确认的技术根因。",
      "evidence": [
        "Current operator input, 2026-09-11",
        "arckit/cases/closed/CASE-20260904-001-show-acceptance-issues-and-processing-status-directly-in-today.md"
      ]
    },
    {
      "id": "FACT-20260911-002-002",
      "revision": 1,
      "status": "superseded",
      "statement": "当前 Today 第三栏调用 renderTodaySourceContext，直接读取责任项的 acceptance_feedback_items；deriveTodayWorkspace 优先采用 platform.today_tasks 或 platform.tasks。Work Inspector 则按任务身份从 Automation snapshot 另取验收问题。原 Today 回归直接在平台任务 fixture 中注入了问题字段，没有验证这两个实际数据来源之间的连接。",
      "basis": "只读检查当前 Renderer、Today 投影及原聚焦测试，证明存在尚未验证的数据来源边界；尚未通过运行复现确认其是用户症状的根因。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1752",
        "runtime/arcorbit/desktop/renderer/renderer.js:1886",
        "runtime/arcorbit/desktop/renderer/renderer.js:2542",
        "runtime/arcorbit/src/desktop/today-workspace.mjs:247",
        "runtime/arcorbit/test/today-workspace.test.mjs:123"
      ]
    },
    {
      "id": "FACT-20260911-002-003",
      "revision": 1,
      "status": "superseded",
      "statement": "隔离运行当前生产提交和刷新函数确认：独立验收问题成功落盘并由 Automation enrichTask 投影，但 Platform today_tasks 来自 Work Task Projection，不含该字段；Today 优先采用平台数组且不关联 Automation 问题集合，导致第三栏空态。连续两次完整刷新仍复现，控制实验仅补入问题集合即可显示原文和 queued 状态。",
      "basis": "生产函数实际执行，外部 Work/账号/消息接口为合成替身，Store 使用临时磁盘文件；运行后读取带唯一标记的日志。该证据证明源码缺陷，不代表用户安装包现场或 Electron DOM 验收。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs",
        "arckit/cases/evidence/CASE-20260911-002/trace.json",
        "arckit/debug/today-third-column-missing-issues.log"
      ]
    },
    {
      "id": "FACT-20260911-002-004",
      "revision": 1,
      "status": "accepted",
      "statement": "原 Today 测试预先向 platform.tasks 注入 acceptance_feedback_items，Renderer 相关测试仅检查源码模式，均未验证独立问题来源到 Today 的连接。当前 Today 测试 10/10 通过仍可复现缺陷；四个相关测试文件共 151 项，150 通过，另一个失败来自现有 Engineering 页面与旧文案断言不一致。",
      "basis": "检查旧 fixture 与断言，并实际运行 Today 测试及重复运行四文件测试；本轮没有修改生产文件或 Engineering 改动。",
      "evidence": [
        "runtime/arcorbit/test/today-workspace.test.mjs:123",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1764",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:995",
        "arckit/cases/evidence/CASE-20260911-002/diagnosis.md"
      ]
    },
    {
      "id": "FACT-20260911-002-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Platform 的 today_tasks 现按项目和任务身份关联 Desktop Store 独立验收问题的展示字段，不依赖 Automation 查看筛选或 Workset，不覆盖或持久改写 Work Task。Today 提交确认后要求新鲜刷新，已有旧请求进行中时等待其结束再读取；保留较新用户选择。",
      "basis": "生产代码修改与分离来源、临时磁盘 Store、生产提交和刷新函数的行为回归。",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-acceptance-flow.test.mjs"
      ]
    },
    {
      "id": "FACT-20260911-002-006",
      "revision": 1,
      "status": "accepted",
      "statement": "154 项相关代码回归及 2 项 Electron 回归通过。真实开发态 Renderer 的 Today 第三栏提交后显示问题原文和 queued，事件刷新后显示 running 与最新进展；截图已读取核对。临时日志已删除，诊断入口已转换为回归，历史 trace 保留。",
      "basis": "实际测试命令、Electron DOM 断言、截图检查和临时标记搜索；外部账号、Work 数据与执行来源为合成 fixture，未替换安装包。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/verification.md",
        "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
        "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
        "runtime/arcorbit/test/today-acceptance-electron.test.mjs",
        "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260911-002-001",
      "fact_id": "FACT-20260911-002-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "当前源码在真实第三栏兑现问题原文、状态、进展和提交连续性。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
        "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
      ]
    },
    {
      "id": "IMPACT-20260911-002-002",
      "fact_id": "FACT-20260911-002-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "补充的分离来源、范围、身份、并发及真实页面验证覆盖了原测试遗漏，明确不冒充安装包或现场验收。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
        "arckit/cases/evidence/CASE-20260911-002/verification.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260911-002-001",
      "status": "resolved",
      "goal": "建立 Today 第三栏提交验收问题后列表缺失的可复现因果证据，明确问题数据从持久来源、刷新与任务投影到第三栏渲染的丢失边界，以及此前验证未覆盖的条件。",
      "reason": "根因尚未确认；数据来源、投影、刷新时序或运行版本的不同结论会改变必要修复对象和验收范围，必须先完成诊断。",
      "derived_from": [
        "FACT-20260911-002-001",
        "FACT-20260911-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞当前用户反馈的可信修复",
        "uncertainty": "尚未确认实际执行路径与数据丢失位置",
        "risk": "重复依赖预先填充的数据测试可能再次误判完成",
        "user_impact": "用户无法在 Today 第三栏查看刚提交的问题及处理状态"
      },
      "responsibility": "agent",
      "evidence_required": [
        "使用实际来源结构复现 Today 第三栏提交前后的行为",
        "核对问题持久来源、Automation snapshot、平台任务和 Today 责任项的身份与数据内容",
        "逻辑不能完整解释症状时，采集并读取有唯一标记且脱敏的运行时 .log",
        "明确已确认根因、排除的竞争解释及必要修复边界",
        "说明原测试为何未捕获实际路径问题"
      ],
      "resolution": {
        "id": "GAP-20260911-002-001",
        "status": "resolved",
        "outcome": "已建立源码缺陷的可重复因果证据。",
        "reason": "同一任务成功提交后，磁盘和 Automation 均有一条问题，平台任务缺少问题字段，Today 为零条；连续完整刷新不能恢复。仅补入同一问题集合的控制实验使原渲染函数显示问题，排除了本复现中的保存失败、刷新缺失、身份错配、状态或选择丢失。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs",
          "arckit/cases/evidence/CASE-20260911-002/trace.json",
          "arckit/cases/evidence/CASE-20260911-002/diagnosis.md",
          "arckit/debug/today-third-column-missing-issues.log"
        ],
        "occurred_at": "2026-09-11T08:04:55.086Z"
      }
    },
    {
      "id": "GAP-20260911-002-002",
      "status": "resolved",
      "goal": "Today 第三栏从独立验收问题来源正确显示当前 Work 责任项的问题原文、处理状态和进展，并以分离来源的提交刷新及真实页面行为证明。",
      "reason": "生产路径已确认缺失问题集合关联；修复须保留 Work 任务所有权，处理 Today 与 Automation 范围差异，不能再依赖预填平台字段。",
      "derived_from": [
        "FACT-20260911-002-003",
        "FACT-20260911-002-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户报告的实际功能仍未修复",
        "uncertainty": "修复后的页面、筛选与并发行为待验证",
        "risk": "关联错误或过期快照可能隐藏问题或显示其他任务的问题",
        "user_impact": "在 Today 第三栏直接查看验收问题及处理状态"
      },
      "responsibility": "agent",
      "evidence_required": [
        "保持 Task/project 身份和 Work 状态所有权的独立问题集合关联",
        "不预填平台问题字段的提交、刷新、原文、状态与进展验证",
        "空集合、错配身份、问题更新、Today 与 Automation 项目范围差异验证",
        "选择连续性与刷新并发验证",
        "真实 Today 第三栏页面验证，并说明运行版本和现场覆盖边界",
        "转换诊断缺陷断言为回归断言，清理不再需要的临时诊断输出"
      ],
      "resolution": {
        "id": "GAP-20260911-002-002",
        "status": "resolved",
        "outcome": "源码修复及开发态页面验收完成。",
        "reason": "按项目与任务身份关联独立问题集合，不覆盖 Work 事实；提交成功后等待旧刷新结束再读取新快照。分离来源测试覆盖范围差异、错配、状态更新、清空、失败与选择连续性；真实 Electron 第三栏确认提交、列表显示及进展更新。",
        "evidence": [
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
          "arckit/cases/evidence/CASE-20260911-002/verification.md",
          "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
          "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
        ],
        "occurred_at": "2026-09-11T08:19:55.409Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-11T07:55:30.496Z"
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
          "arckit/cases/evidence/CASE-20260911-002/completion-review.md",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
          "runtime/arcorbit/test/fixtures/today-acceptance-state.mjs",
          "runtime/arcorbit/test/fixtures/today-acceptance-electron.mjs",
          "runtime/arcorbit/test/today-acceptance-electron.test.mjs",
          "arckit/cases/evidence/CASE-20260911-002/verification.md",
          "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
          "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
          "本轮五文件回归：154 passed，0 failed，0 skipped；git diff --check 通过。"
        ],
        "occurred_at": "2026-09-11T08:25:32.839Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260911-002/completion-review.md",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
      "runtime/arcorbit/test/fixtures/today-acceptance-state.mjs",
      "runtime/arcorbit/test/fixtures/today-acceptance-electron.mjs",
      "runtime/arcorbit/test/today-acceptance-electron.test.mjs",
      "arckit/cases/evidence/CASE-20260911-002/verification.md",
      "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
      "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
      "本轮五文件回归：154 passed，0 failed，0 skipped；git diff --check 通过。"
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
      "goal": "确认 Today 第三栏提交后问题列表缺失的数据边界及旧测试遗漏。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "最新可信快照确认 Case 创建完成；当前诊断直接阻塞用户反馈的可信修复。",
        "snapshot_token": "ecc6386321127f0d0d5a277aa05186c434663e080249c73a53eb1279b2fcc8bd",
        "selected_ref": "case-gap:CASE-20260911-002:GAP-20260911-002-001",
        "comparison_summary": "选择 Today 第三栏诊断；四项 Project 验证与 Engineering 实现暂缓，两个无关人工授权事项排除。",
        "fresh_discovery_summary": "选择时没有发现需要替代诊断的新候选。本轮运行证据确认缺失连接，形成后续修复义务，不在本轮执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "通用场景验证"
            },
            "reason": "不直接解决当前第三栏缺失问题。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "Runtime 韧性"
            },
            "reason": "当前症状需要先验证具体提交和投影路径。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "真实权限边界验证"
            },
            "reason": "与本次合成数据隔离诊断无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "跨记录一致性"
            },
            "reason": "当前用户问题是业务数据进入 Today 的边界，不是 Ledger 审计。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "owner authorization",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "公开发布与归档"
            },
            "reason": "凭据、许可和发布决定属于无关人工责任，本轮未获得新的授权。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Release 封装验收"
            },
            "reason": "独立的重新打包授权事项，不消费本轮诊断权限。"
          },
          {
            "ref": "case-gap:CASE-20260911-001:GAP-20260911-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "requested user behavior remains absent",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Engineering 场景技能实现"
            },
            "reason": "保留现有工作区改动；当前明确焦点是 Today 第三栏。"
          },
          {
            "ref": "case-gap:CASE-20260911-002:GAP-20260911-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞当前用户反馈的可信修复",
              "uncertainty": "实际数据丢失边界尚未确认",
              "risk": "预填字段测试可能再次误判",
              "user_impact": "第三栏看不到刚提交的问题及状态"
            },
            "reason": "必须先以真实函数和独立来源结构建立可复现因果证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-002-001",
        "responsibility": "agent",
        "goal": "建立 Today 第三栏提交验收问题后列表缺失的可复现因果证据，明确问题数据从持久来源、刷新与任务投影到第三栏渲染的丢失边界，以及此前验证未覆盖的条件。",
        "reason": "根因尚未确认；数据来源、投影、刷新时序或运行版本的不同结论会改变必要修复对象和验收范围，必须先完成诊断。",
        "derived_from": [
          "FACT-20260911-002-001",
          "FACT-20260911-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞当前用户反馈的可信修复",
          "uncertainty": "尚未确认实际执行路径与数据丢失位置",
          "risk": "重复依赖预先填充的数据测试可能再次误判完成",
          "user_impact": "用户无法在 Today 第三栏查看刚提交的问题及处理状态"
        },
        "evidence_required": [
          "使用实际来源结构复现 Today 第三栏提交前后的行为",
          "核对问题持久来源、Automation snapshot、平台任务和 Today 责任项的身份与数据内容",
          "逻辑不能完整解释症状时，采集并读取有唯一标记且脱敏的运行时 .log",
          "明确已确认根因、排除的竞争解释及必要修复边界",
          "说明原测试为何未捕获实际路径问题"
        ]
      },
      "planned_transition": {
        "goal": "确认 Today 第三栏提交后问题列表缺失的数据边界及旧测试遗漏。",
        "expected_state_change": "通过隔离执行生产提交、刷新、Coordinator、Today 投影和 HTML 渲染函数建立诊断事实，记录必要修复范围而不实施下游修复。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-002-001",
          "status": "resolved",
          "outcome": "已建立源码缺陷的可重复因果证据。",
          "reason": "同一任务成功提交后，磁盘和 Automation 均有一条问题，平台任务缺少问题字段，Today 为零条；连续完整刷新不能恢复。仅补入同一问题集合的控制实验使原渲染函数显示问题，排除了本复现中的保存失败、刷新缺失、身份错配、状态或选择丢失。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs",
            "arckit/cases/evidence/CASE-20260911-002/trace.json",
            "arckit/cases/evidence/CASE-20260911-002/diagnosis.md",
            "arckit/debug/today-third-column-missing-issues.log"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "隔离运行当前生产提交和刷新函数确认：独立验收问题成功落盘并由 Automation enrichTask 投影，但 Platform today_tasks 来自 Work Task Projection，不含该字段；Today 优先采用平台数组且不关联 Automation 问题集合，导致第三栏空态。连续两次完整刷新仍复现，控制实验仅补入问题集合即可显示原文和 queued 状态。",
            "basis": "生产函数实际执行，外部 Work/账号/消息接口为合成替身，Store 使用临时磁盘文件；运行后读取带唯一标记的日志。该证据证明源码缺陷，不代表用户安装包现场或 Electron DOM 验收。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs",
              "arckit/cases/evidence/CASE-20260911-002/trace.json",
              "arckit/debug/today-third-column-missing-issues.log"
            ]
          },
          {
            "id": "FACT-20260911-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "原 Today 测试预先向 platform.tasks 注入 acceptance_feedback_items，Renderer 相关测试仅检查源码模式，均未验证独立问题来源到 Today 的连接。当前 Today 测试 10/10 通过仍可复现缺陷；四个相关测试文件共 151 项，150 通过，另一个失败来自现有 Engineering 页面与旧文案断言不一致。",
            "basis": "检查旧 fixture 与断言，并实际运行 Today 测试及重复运行四文件测试；本轮没有修改生产文件或 Engineering 改动。",
            "evidence": [
              "runtime/arcorbit/test/today-workspace.test.mjs:123",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1764",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:995",
              "arckit/cases/evidence/CASE-20260911-002/diagnosis.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260911-002-001",
            "fact_id": "FACT-20260911-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "缺失连接已由运行证据确认，既有第三栏原位显示预期尚未兑现。",
            "gap_ids": [
              "GAP-20260911-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/trace.json"
            ]
          },
          {
            "id": "IMPACT-20260911-002-002",
            "fact_id": "FACT-20260911-002-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "诊断证据已可信，但旧测试无法防止实际来源连接回归，修复后的页面与范围验证仍未完成。",
            "gap_ids": [
              "GAP-20260911-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/diagnosis.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260911-002-002",
            "status": "open",
            "goal": "Today 第三栏从独立验收问题来源正确显示当前 Work 责任项的问题原文、处理状态和进展，并以分离来源的提交刷新及真实页面行为证明。",
            "reason": "生产路径已确认缺失问题集合关联；修复须保留 Work 任务所有权，处理 Today 与 Automation 范围差异，不能再依赖预填平台字段。",
            "derived_from": [
              "FACT-20260911-002-003",
              "FACT-20260911-002-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "用户报告的实际功能仍未修复",
              "uncertainty": "修复后的页面、筛选与并发行为待验证",
              "risk": "关联错误或过期快照可能隐藏问题或显示其他任务的问题",
              "user_impact": "在 Today 第三栏直接查看验收问题及处理状态"
            },
            "responsibility": "agent",
            "evidence_required": [
              "保持 Task/project 身份和 Work 状态所有权的独立问题集合关联",
              "不预填平台问题字段的提交、刷新、原文、状态与进展验证",
              "空集合、错配身份、问题更新、Today 与 Automation 项目范围差异验证",
              "选择连续性与刷新并发验证",
              "真实 Today 第三栏页面验证，并说明运行版本和现场覆盖边界",
              "转换诊断缺陷断言为回归断言，清理不再需要的临时诊断输出"
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
        "project_revision": 366,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "独立验收问题、进展可见及来源任务保持 completed 的产品预期已有明确持久定义；诊断暴露的是实现缺失，不改变预期。",
            "fact_refs": [
              "FACT-20260911-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/cases/evidence/CASE-20260911-002/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Today 交互文档明确要求提交确认后保留有效选择并在第三栏直接刷新问题原文、状态和进展，无需重新定义用户路径。",
            "fact_refs": [
              "FACT-20260911-002-001",
              "FACT-20260911-002-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "证据确认是输入数据缺失；控制实验中的既有模板可显示问题，未建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work Sync 拥有 Task 投影、Automation 拥有独立问题项的既有边界仍清楚；诊断记录了两者至 Today 的缺失连接，未以新增持久双写改变所有权。",
            "fact_refs": [
              "FACT-20260911-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/cases/evidence/CASE-20260911-002/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "当前源码仍会在问题成功保存和刷新后显示空态，本轮没有实施修复。",
            "fact_refs": [
              "FACT-20260911-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/trace.json"
            ],
            "gap_refs": [
              "GAP-20260911-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "独立来源遗漏已有可重复证据，但修复后的真实页面、范围与并发回归证据尚缺；原测试通过不能作为功能完成依据。",
            "fact_refs": [
              "FACT-20260911-002-003",
              "FACT-20260911-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/diagnosis.md",
              "arckit/cases/evidence/CASE-20260911-002/trace.json"
            ],
            "gap_refs": [
              "GAP-20260911-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs",
        "arckit/cases/evidence/CASE-20260911-002/trace.json",
        "arckit/cases/evidence/CASE-20260911-002/diagnosis.md",
        "arckit/debug/today-third-column-missing-issues.log"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-075329301Z-1fd44deb",
      "occurred_at": "2026-09-11T08:04:55.086Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "兑现 Today 第三栏独立验收问题展示与提交后刷新。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "可信提交后快照已接受根因，当前修复 Gap 直接对应用户反馈且没有前置阻塞。",
        "snapshot_token": "216f23afde93adf99da0ef510e7aca9512da20b5c547c539b43c9a0e55903d06",
        "selected_ref": "case-gap:CASE-20260911-002:GAP-20260911-002-002",
        "comparison_summary": "选择 Today 修复；四项 Project 验证和 Engineering 实现暂缓，两项无关人工授权事项排除。",
        "fresh_discovery_summary": "未发现需要替代当前修复 Gap 的新候选；提交刷新并发与页面验证均在既定验收范围内。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "通用场景评估"
            },
            "reason": "不直接解除当前第三栏功能缺失。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "Runtime 韧性"
            },
            "reason": "当前缺陷已有具体因果证据，无需扩大至通用 Runtime 工作。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "真实权限边界验证"
            },
            "reason": "与本次隔离修复验证无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "跨记录一致性"
            },
            "reason": "当前问题属于业务投影连接，不是 Ledger 审计。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "owner authorization",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "公开发布和归档"
            },
            "reason": "无关人工决定，本轮没有新的发布或许可授权。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Release 封装验收"
            },
            "reason": "保留独立重打包授权边界，本轮只运行隔离开发态 Electron。"
          },
          {
            "ref": "case-gap:CASE-20260911-001:GAP-20260911-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "requested user behavior remains absent",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Engineering 场景技能"
            },
            "reason": "保留并行工作区改动，当前焦点是 Today 第三栏。"
          },
          {
            "ref": "case-gap:CASE-20260911-002:GAP-20260911-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "用户报告的实际功能仍未修复",
              "uncertainty": "修复后的页面、筛选与并发行为待验证",
              "risk": "关联错误或过期快照可能隐藏问题或显示其他任务的问题",
              "user_impact": "在 Today 第三栏直接查看验收问题及处理状态"
            },
            "reason": "根因已接受，可以直接完成受证据约束的修复与既定验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-002-002",
        "responsibility": "agent",
        "goal": "Today 第三栏从独立验收问题来源正确显示当前 Work 责任项的问题原文、处理状态和进展，并以分离来源的提交刷新及真实页面行为证明。",
        "reason": "生产路径已确认缺失问题集合关联；修复须保留 Work 任务所有权，处理 Today 与 Automation 范围差异，不能再依赖预填平台字段。",
        "derived_from": [
          "FACT-20260911-002-003",
          "FACT-20260911-002-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户报告的实际功能仍未修复",
          "uncertainty": "修复后的页面、筛选与并发行为待验证",
          "risk": "关联错误或过期快照可能隐藏问题或显示其他任务的问题",
          "user_impact": "在 Today 第三栏直接查看验收问题及处理状态"
        },
        "evidence_required": [
          "保持 Task/project 身份和 Work 状态所有权的独立问题集合关联",
          "不预填平台问题字段的提交、刷新、原文、状态与进展验证",
          "空集合、错配身份、问题更新、Today 与 Automation 项目范围差异验证",
          "选择连续性与刷新并发验证",
          "真实 Today 第三栏页面验证，并说明运行版本和现场覆盖边界",
          "转换诊断缺陷断言为回归断言，清理不再需要的临时诊断输出"
        ]
      },
      "planned_transition": {
        "goal": "兑现 Today 第三栏独立验收问题展示与提交后刷新。",
        "expected_state_change": "在 Today 数据组装边界补齐身份关联，保障提交后新鲜读取，以分离来源回归和真实 Electron 第三栏证明实现，并清理临时诊断代码。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-002-002",
          "status": "resolved",
          "outcome": "源码修复及开发态页面验收完成。",
          "reason": "按项目与任务身份关联独立问题集合，不覆盖 Work 事实；提交成功后等待旧刷新结束再读取新快照。分离来源测试覆盖范围差异、错配、状态更新、清空、失败与选择连续性；真实 Electron 第三栏确认提交、列表显示及进展更新。",
          "evidence": [
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
            "arckit/cases/evidence/CASE-20260911-002/verification.md",
            "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
            "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-002-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Platform 的 today_tasks 现按项目和任务身份关联 Desktop Store 独立验收问题的展示字段，不依赖 Automation 查看筛选或 Workset，不覆盖或持久改写 Work Task。Today 提交确认后要求新鲜刷新，已有旧请求进行中时等待其结束再读取；保留较新用户选择。",
            "basis": "生产代码修改与分离来源、临时磁盘 Store、生产提交和刷新函数的行为回归。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs"
            ]
          },
          {
            "id": "FACT-20260911-002-006",
            "revision": 1,
            "status": "accepted",
            "statement": "154 项相关代码回归及 2 项 Electron 回归通过。真实开发态 Renderer 的 Today 第三栏提交后显示问题原文和 queued，事件刷新后显示 running 与最新进展；截图已读取核对。临时日志已删除，诊断入口已转换为回归，历史 trace 保留。",
            "basis": "实际测试命令、Electron DOM 断言、截图检查和临时标记搜索；外部账号、Work 数据与执行来源为合成 fixture，未替换安装包。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/verification.md",
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
              "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
              "runtime/arcorbit/test/today-acceptance-electron.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/reproduce.mjs"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260911-002-002",
            "revision": 1,
            "reason": "Today 来源连接已实现，旧实现描述不再代表当前状态；诊断文档继续保存历史依据。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/cases/evidence/CASE-20260911-002/verification.md"
            ]
          },
          {
            "id": "FACT-20260911-002-003",
            "revision": 1,
            "reason": "修复后相同提交刷新路径能够显示问题；旧缺陷观察作为历史 trace 保留。",
            "evidence": [
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260911-002-001",
            "fact_id": "FACT-20260911-002-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "当前源码在真实第三栏兑现问题原文、状态、进展和提交连续性。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
              "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
            ]
          },
          {
            "id": "IMPACT-20260911-002-002",
            "fact_id": "FACT-20260911-002-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "补充的分离来源、范围、身份、并发及真实页面验证覆盖了原测试遗漏，明确不冒充安装包或现场验收。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/verification.md"
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
        "project_revision": 366,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "独立问题、状态进展可见及源任务保持 completed 的既有产品规则未改变。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有第三栏原位展示、失败保留草稿与较新选择优先的交互预期保持明确。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/cases/evidence/CASE-20260911-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "只补齐数据与刷新，复用既有第三栏列表、状态徽标和滚动区，未改变视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "保持 Work Task 与独立问题的所有权，仅在 Today 投影中组合展示字段，无持久双写或额外磁盘读取。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/cases/evidence/CASE-20260911-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "分离来源提交刷新与实际 Electron 第三栏均证明当前源码兑现相关预期。",
            "fact_refs": [
              "FACT-20260911-002-005",
              "FACT-20260911-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
              "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "已覆盖来源遗漏、身份错配、筛选差异、旧刷新、较新选择和失败恢复；验证范围及开发态警告均明确记录。",
            "fact_refs": [
              "FACT-20260911-002-006"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-002/verification.md",
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/verification.md",
        "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
        "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
        "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
        "runtime/arcorbit/test/today-acceptance-electron.test.mjs"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-075329301Z-1fd44deb",
      "occurred_at": "2026-09-11T08:19:55.409Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "复核 Today 第三栏修复的正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "最新可信快照确认普通 Gap 与相关 impacts 已闭合；完成复核直接决定当前用户问题能否可信收束。",
        "snapshot_token": "b1a41d6f1942e3edfd93b67547188d3a219bd29d0e306905e216af72cf93b8a0",
        "selected_ref": "case-gap:CASE-20260911-002:CASE-20260911-002:completion-review:1",
        "comparison_summary": "选择当前 Case 的 ready 完成复核；另一项 agent 实现属于独立 Case，两个人工候选需要用户决定，四个 Project 候选需独立 Case。",
        "fresh_discovery_summary": "本轮检查未发现需要新增候选的实施错误、遗漏或多余改动；未声称穷尽其他潜在工作。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "通用场景可靠性"
            },
            "reason": "需独立场景验证 Case，不阻塞当前有明确证据的 Today 复核。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "Runtime 长期运行可靠性"
            },
            "reason": "当前修复未改变 Runtime 韧性或 adapter 边界。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "真实受控资源验证待完成",
              "risk": "high",
              "user_impact": "权限安全"
            },
            "reason": "需独立受控项目与权限证据，不扩张本轮隔离页面复核。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "跨记录一致性"
            },
            "reason": "需独立审计 Case；当前没有发现阻塞 Today 完成判断的记录冲突。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "公开发布与归档",
              "uncertainty": "所有者确认待完成",
              "risk": "high",
              "user_impact": "凭据、许可与发布安全"
            },
            "reason": "属于人工责任，本轮不能代替所有者作出确认。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "重新打包请求曾被拒绝",
              "uncertainty": "",
              "risk": "",
              "user_impact": "最终封装验收"
            },
            "reason": "需要人工恢复打包授权，当前复核不构成该授权。"
          },
          {
            "ref": "case-gap:CASE-20260911-001:GAP-20260911-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "场景技能契约实现",
              "uncertainty": "",
              "risk": "迁移与消费者隔离",
              "user_impact": "Engineering、Chat 和 Automation 技能配置"
            },
            "reason": "属于独立 Case，保留其并发改动，不阻塞 Today 完成复核。"
          },
          {
            "ref": "case-gap:CASE-20260911-002:CASE-20260911-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 普通工作已闭合，须独立检查五个完成维度后才能收束。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-002:completion-review:1",
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
        "goal": "复核 Today 第三栏修复的正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "提交仅包含完成复核结果的单一主张，由 Ledger 判断 Case 收束。"
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
            "arckit/cases/evidence/CASE-20260911-002/completion-review.md",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
            "runtime/arcorbit/test/fixtures/today-acceptance-state.mjs",
            "runtime/arcorbit/test/fixtures/today-acceptance-electron.mjs",
            "runtime/arcorbit/test/today-acceptance-electron.test.mjs",
            "arckit/cases/evidence/CASE-20260911-002/verification.md",
            "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
            "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
            "本轮五文件回归：154 passed，0 failed，0 skipped；git diff --check 通过。"
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
        "project_revision": 366,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "独立问题、状态进展可见和来源任务保持 completed 的长期规则清楚且未改变。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "第三栏原位展示、确认后刷新与较新选择优先的预期明确，修复没有引入不同交互语义。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本 Case 补齐数据与刷新，复用既有列表和徽标；未建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work Task 和独立问题保持各自所有权，只在 Today 查询投影中组合展示字段，无持久双写或额外来源读取。",
            "fact_refs": [
              "FACT-20260911-002-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/cases/evidence/CASE-20260911-002/completion-review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "重新执行的分离来源测试和已检查的真实 Renderer 证据支持当前源码实现主张；没有将其扩张为安装包已更新。",
            "fact_refs": [
              "FACT-20260911-002-005",
              "FACT-20260911-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
              "arckit/cases/evidence/CASE-20260911-002/today-third-column.png",
              "arckit/cases/evidence/CASE-20260911-002/completion-review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "来源遗漏、项目错配、筛选差异、旧请求并发、较新选择和失败恢复均有行为证据；替身、GUI 复用证据及现场覆盖限制明确。",
            "fact_refs": [
              "FACT-20260911-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-acceptance-flow.test.mjs",
              "arckit/cases/evidence/CASE-20260911-002/verification.md",
              "arckit/cases/evidence/CASE-20260911-002/completion-review.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-002/completion-review.md",
        "arckit/cases/evidence/CASE-20260911-002/verification.md",
        "arckit/cases/evidence/CASE-20260911-002/today-electron.json",
        "arckit/cases/evidence/CASE-20260911-002/today-third-column.png"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-075329301Z-1fd44deb",
      "occurred_at": "2026-09-11T08:25:32.839Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260911-002-001",
      "GAP-20260911-002-002"
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
    "updated_at": "2026-09-11T08:25:32.839Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
