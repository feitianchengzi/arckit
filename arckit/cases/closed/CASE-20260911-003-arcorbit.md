# 支持在 ArcOrbit 组织页面从组织成员直接添加项目成员

Case: CASE-20260911-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-12T03:18:16.506Z

## User Intent

让用户在组织页面的项目上下文中直接选择已有组织成员加入项目，无需仅依赖邀请链接。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260911-003",
  "title": "支持在 ArcOrbit 组织页面从组织成员直接添加项目成员",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-11T08:29:00.125Z",
  "updated_at": "2026-09-12T03:18:16.506Z",
  "user_intent": "让用户在组织页面的项目上下文中直接选择已有组织成员加入项目，无需仅依赖邀请链接。",
  "expected_outcome": "ArcOrbit 提供从同组织成员中直接添加项目成员的可用入口，权限边界明确，服务端确认后刷新成员事实，重复添加及失败恢复有可信验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260911-003-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 ArcOrbit 组织页面支持从已有组织成员直接添加项目成员，而非只能使用邀请链接。",
      "basis": "当前用户明确需求。",
      "evidence": [
        "current_instruction"
      ]
    },
    {
      "id": "FACT-20260911-003-002",
      "revision": 1,
      "status": "superseded",
      "statement": "仓库中的 POST /projects/:id/members 接口接受 organization_member_id，校验目标成员与项目属于同一组织，新增角色为 member，并支持重复添加幂等返回；当前 handler 未校验操作者的项目管理权限。",
      "basis": "直接读取服务端路由、handler 和 API 文档；不代表已验证线上部署。",
      "evidence": [
        "services/workshop-api/router/router.go:167",
        "services/workshop-api/handler/project.go:571",
        "services/workshop-api/api/project.md:724"
      ]
    },
    {
      "id": "FACT-20260911-003-003",
      "revision": 1,
      "status": "superseded",
      "statement": "现有组织治理规格因服务端直接添加缺少 caller 权限校验而明确关闭入口；Platform Coordinator 将 direct_add_project_member 标为 unavailable，现有项目成员命令只有更新和删除。",
      "basis": "现有规格、客户端实现及已关闭组织治理 Case 一致说明该能力是明确排除项。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "runtime/arcorbit/src/platform-coordinator.mjs:266",
        "runtime/arcorbit/src/platform-coordinator.mjs:480",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:301",
        "arckit/cases/closed/CASE-20260818-002-optimize-arcorbit-organization-member-and-product-management.md"
      ]
    },
    {
      "id": "FACT-20260911-003-004",
      "revision": 1,
      "status": "superseded",
      "statement": "项目 owner/admin 可以从项目所属组织选择一位已有组织成员直接加入项目，新增角色固定为 member；组织管理角色不替代项目角色。服务端在新建及幂等返回前验证操作者项目权限。邀请加入独立保留，成功后刷新成员事实，网络结果不明先核对，成功后刷新失败仅重读，旧响应不覆盖新项目或账户。",
      "basis": "用户直接添加需求、现有项目邀请权限边界及已完成的稳定定义；最新快照未改变这些依据。",
      "evidence": [
        "services/workshop-api/handler/project.go:776",
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "FACT-20260911-003-005",
      "revision": 1,
      "status": "accepted",
      "statement": "契约工作仅修订定义文档与状态线框，静态检查通过，包含 8 个带触发条件、组件清单和交互行为的状态及 7 个 Sheet 投影；重规划时已确认产物与记录仍存在。客户端直接添加入口与服务端授权保护未由该工作实现或验证。",
      "basis": "已完成的文件变更和确定性检查记录，以及本次只读核对；未重复实施。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/contract-verification.json",
        "arckit/interaction/platform-workspace/member-add.html"
      ]
    },
    {
      "id": "FACT-20260911-003-006",
      "revision": 1,
      "status": "superseded",
      "statement": "源码已实现项目 owner/admin 从同组织成员直接添加项目成员。服务端在目标查询、幂等成功和新增前校验操作者；新增角色固定 member，重复请求保留原关系。客户端通过固定命令重新核对账户、项目权限及组织成员关系，候选完整分页且已有成员禁选；确认成功后刷新，刷新失败仅重读，结果不明先核对，旧项目或账户响应不覆盖当前界面。",
      "basis": "实际生产源码及对应行为测试。",
      "evidence": [
        "services/workshop-api/handler/project.go",
        "services/workshop-api/api/project.md",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
        "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
      ]
    },
    {
      "id": "FACT-20260911-003-007",
      "revision": 1,
      "status": "accepted",
      "statement": "最终 44 项定向测试通过；完整 ArcOrbit 回归 675 项通过、30 项跳过、零失败，随后焦点修正及新增分页测试通过最终定向和 Electron 复验。真实 PostgreSQL race 测试验证拒绝越权、跨组织和个人项目、身份字段区分、幂等关系保留、八请求并发唯一新增以及事件失败回滚。Go 模块回归通过。生产 Renderer 在真实 Electron 中验证入口权限、选择、搜索、成功刷新、焦点恢复和项目切换；其服务数据为确定性替身，未验证线上部署或安装包。",
      "basis": "实际命令退出结果及持久测试输出，验证层次和先后范围已明确记录。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
        "arckit/cases/evidence/CASE-20260911-003/implementation-regression.tap",
        "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
        "arckit/cases/evidence/CASE-20260911-003/implementation-go-regression.txt",
        "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json",
        "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
      ]
    },
    {
      "id": "FACT-20260911-003-008",
      "revision": 1,
      "status": "accepted",
      "statement": "按用户要求，本功能保持 Workshop 服务代码与接口不变。ArcOrbit 主进程保留项目 owner/admin 操作限制、同组织选择、固定 member 角色和独立邀请入口。现有直接添加接口要求已认证并校验目标同组织，但不校验 caller 项目角色；客户端限制不构成服务端保护。成功必须验证响应目标并刷新，未知结果先核对，刷新失败仅重读，旧响应不得覆盖新上下文。",
      "basis": "用户最新范围约束及修订后的稳定文档。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "services/workshop-api/api/project.md"
      ]
    },
    {
      "id": "FACT-20260911-003-009",
      "revision": 1,
      "status": "superseded",
      "statement": "本 Case 的服务端 handler 与 API 文档已恢复到 HEAD，新增服务端测试移至历史证据，服务目录无 Git 差异。此前 PostgreSQL 结果只证明已撤回版本，不能证明恢复后存在 caller role 保护。客户端仍会将空响应或不匹配项目和用户的响应报告为成功，尚未完成修订契约的实施验证。",
      "basis": "字节及 Git 检查与生产客户端确定性复现。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json",
        "arckit/cases/evidence/CASE-20260911-003/review-response-identity.json"
      ]
    },
    {
      "id": "FACT-20260911-003-010",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 主进程对直接添加响应验证有效成员关系 ID、目标 project_id 与所选组织成员的 user_id；空、缺字段或不匹配响应保持 outcome_unknown，先核对成员事实，未确认时需要单独用户重试。写入期间账户变化不确认成功，已有关系角色和职责不重写。客户端项目角色、组织关系、分页、刷新失败及过期上下文回归共 101 项通过。服务目录无差异，未执行线上请求或安装包验收。",
      "basis": "生产协调器修复及确定性行为回归，验证输出持久保存。",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/test/project-member-add.test.mjs",
        "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
        "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
      ]
    },
    {
      "id": "FACT-20260911-003-011",
      "revision": 1,
      "status": "accepted",
      "statement": "添加弹窗显示项目所属组织与项目名称，并在搜索列表之外持续显示所选成员姓名和用户身份。搜索隐藏候选或没有匹配时仍明确显示实际提交对象。77 项定向测试及生产 Renderer 的隔离 Electron 测试通过，服务目录无差异。",
      "basis": "生产源码修复、实际命令退出结果和确定性服务数据下的真实 Renderer 行为验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/fixtures/project-member-add-electron.mjs",
        "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260911-003-001",
      "fact_id": "FACT-20260911-003-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 45
      },
      "effect": "upheld",
      "reason": "直接添加与独立邀请保留，范围改为客户端接入。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
      ]
    },
    {
      "id": "IMPACT-20260911-003-002",
      "fact_id": "FACT-20260911-003-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 68
      },
      "effect": "upheld",
      "reason": "角色入口、选择、确认及恢复契约可恢复。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md"
      ]
    },
    {
      "id": "IMPACT-20260911-003-003",
      "fact_id": "FACT-20260911-003-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "identity_and_access",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "明确客户端限制与既有 API 校验的不同边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260911-003-004",
      "fact_id": "FACT-20260911-003-010",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "客户端响应核验及恢复符合已接受的服务端不变契约。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap"
      ]
    },
    {
      "id": "IMPACT-20260911-003-005",
      "fact_id": "FACT-20260911-003-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "identity_and_access",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "不再声明服务端项目角色保护；原接口及其限制明确保留。",
      "gap_ids": [],
      "evidence": [
        "services/workshop-api/api/project.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260911-003-001",
      "status": "resolved",
      "goal": "建立从组织成员直接添加项目成员的明确产品、交互与授权契约，替换旧的禁用约定。",
      "reason": "服务端接口存在，但操作者授权缺失，且旧规格明确禁止该入口；这些边界决定客户端接入与服务端必要改动的范围，必须先形成一致的实施依据。",
      "derived_from": [
        "FACT-20260911-003-001",
        "FACT-20260911-003-002",
        "FACT-20260911-003-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "既有禁用契约与当前需求冲突，阻塞一致实施。",
        "uncertainty": "需明确允许直接添加的操作者及服务端授权边界。",
        "risk": "仅增加客户端按钮不能建立服务端权限保护。",
        "user_impact": "直接解决用户无法从组织成员选择加入项目的问题。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "可恢复的直接添加产品及权限规则，明确与邀请加入的关系",
        "项目上下文、同组织成员选择、已有成员处理、提交及失败恢复交互",
        "现有服务端契约与所需授权保护的技术依据"
      ],
      "resolution": {
        "id": "GAP-20260911-003-001",
        "status": "resolved",
        "outcome": "产品、交互和技术契约已一致定义，旧禁用约定已修订。",
        "reason": "现有项目邀请授权提供权限依据；重新读取确认规格、交互策略、状态线框及技术方案仍完整覆盖目标选择、权限、幂等与恢复。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/member-add.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
        ],
        "occurred_at": "2026-09-11T08:38:55.812Z"
      }
    },
    {
      "id": "GAP-20260911-003-002",
      "status": "resolved",
      "goal": "实现并验证符合已定契约的同组织成员直接添加能力及服务端项目权限保护。",
      "reason": "契约要求客户端入口与服务端授权共同成立，现有客户端仍禁用，服务端缺少 caller 项目权限校验。",
      "derived_from": [
        "FACT-20260911-003-004",
        "FACT-20260911-003-005",
        "FACT-20260911-003-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户要求的实际能力尚未兑现",
        "uncertainty": "实现、回归与部署证据尚未形成",
        "risk": "越权添加、错误身份、重复提交及异步上下文污染",
        "user_impact": "组织项目可以直接选人加入"
      },
      "responsibility": "agent",
      "evidence_required": [
        "项目详情成员选择、完整分页、已有成员禁选与受限 IPC/Adapter 的行为证据",
        "服务端 owner/admin 成功，普通成员、非成员、仅组织管理员拒绝，含重复添加路径",
        "跨组织、个人项目、ID 区分、幂等与事件事务验证",
        "成功刷新、刷新失败、结果不明核对及项目/账户切换的恢复验证",
        "明确区分源码、实际界面及线上服务授权的验证范围"
      ],
      "resolution": {
        "id": "GAP-20260911-003-002",
        "status": "resolved",
        "outcome": "直接添加源码实现及隔离行为验证完成。",
        "reason": "生产 Renderer、受限主进程命令和服务端授权共同实现既定契约；定向测试、真实 PostgreSQL 并发事务测试及 Electron 页面验证通过，明确排除线上部署和安装包声明。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json",
          "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
          "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
          "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
        ],
        "occurred_at": "2026-09-11T08:58:15.522Z"
      }
    },
    {
      "id": "GAP-20260911-003-004",
      "status": "resolved",
      "goal": "确立并落实服务端保持原样的范围与预期。",
      "reason": "用户最新指令否定此前新增服务端授权的范围。",
      "derived_from": [
        "current_operator_input",
        "FACT-20260911-003-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "后续客户端验收依据",
        "uncertainty": "权限限制归属",
        "risk": "错误授权声明",
        "user_impact": "明确要求"
      },
      "responsibility": "agent",
      "evidence_required": [
        "服务目录恢复证明",
        "一致的产品、交互与技术预期",
        "历史验证适用范围说明"
      ],
      "resolution": {
        "id": "GAP-20260911-003-004",
        "status": "resolved",
        "outcome": "客户端接入既有接口的范围已明确，服务端修改已撤回。",
        "reason": "服务文件与 HEAD 字节一致，服务目录 Git 状态为空；稳定文档区分客户端限制与服务端实际行为。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
        ],
        "occurred_at": "2026-09-11T09:31:06.666Z"
      }
    },
    {
      "id": "GAP-20260911-003-003",
      "status": "resolved",
      "goal": "修正并验证客户端符合保持服务端不变的直接添加契约。",
      "reason": "空响应和目标不匹配响应仍被当作成功；客户端兼容性需要按修订契约验证。",
      "derived_from": [
        "FACT-20260911-003-008",
        "FACT-20260911-003-009"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "真实成功反馈与 Case 完成",
        "uncertainty": "现有响应契约下的恢复",
        "risk": "错误报告已加入",
        "user_impact": "可靠直接添加"
      },
      "responsibility": "agent",
      "evidence_required": [
        "合法、空、缺字段和项目或用户不匹配响应的行为验证",
        "客户端项目角色、组织关系、分页及身份字段兼容验证",
        "结果不明核对、刷新失败重读与上下文切换验证",
        "服务目录保持无差异"
      ],
      "resolution": {
        "id": "GAP-20260911-003-003",
        "status": "resolved",
        "outcome": "客户端响应身份核验与恢复回归完成。",
        "reason": "只有有效成员关系 ID、匹配项目及所选用户的响应才确认成功；不完整或错误目标响应进入结果核对，账户变化不确认成功。101 项定向测试通过，服务目录保持无差异。",
        "evidence": [
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/test/project-member-add.test.mjs",
          "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
          "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
        ],
        "occurred_at": "2026-09-11T09:34:37.247Z"
      }
    },
    {
      "id": "CASE-20260911-003:review-finding:FINDING-20260911-003-001",
      "status": "resolved",
      "goal": "Resolve review finding: 添加弹窗未显示组织身份；选择成员 A 后搜索 B 会隐藏 A，但仍保留 A 的选择并允许提交。需使组织、项目及所选成员明确可见，或使隐藏选择失效，并补充实际 Renderer 行为验证。保持服务端不变。",
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
        "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/fixtures/project-member-add-electron.mjs",
        "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md:84"
      ],
      "resolution": {
        "id": "CASE-20260911-003:review-finding:FINDING-20260911-003-001",
        "status": "resolved",
        "outcome": "组织、项目和所选成员持续明确显示，搜索后提交对象验证通过。",
        "reason": "组织按项目 organization_id 匹配；所选成员摘要独立于搜索列表。真实 Electron 验证搜索其他成员及无结果时仍展示所选身份，并仅提交该成员一次。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
          "arckit/cases/evidence/CASE-20260911-003/selection-fix-focused.tap"
        ],
        "occurred_at": "2026-09-12T03:16:05.019Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-11T08:29:00.125Z"
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
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260911-003-001"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
          "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json",
          "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
        ],
        "occurred_at": "2026-09-12T03:10:56.797Z"
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
          "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md",
          "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
          "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
        ],
        "occurred_at": "2026-09-12T03:18:16.506Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
      "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json",
      "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json",
      "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md",
      "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md"
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
      "goal": "接受一致、可恢复的直接添加项目成员契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "上次写回因 snapshot_stale 未被接受。最新可信快照中本 Case 的事实及契约缺口未变，相关 Project 决策未改变该契约依据；已有文档和证据经重新读取确认仍有效。",
        "snapshot_token": "77560bc19e84bce900f7d31bdb250dd5045e055840aa67c14b2bbecbbd7b54ed",
        "selected_ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
        "comparison_summary": "仍选择直接添加契约；四项 Project 验证事项与两项人工事项暂缓。Engineering 实施不在最新候选目录中，不再作为 persisted candidate 提交。",
        "fresh_discovery_summary": "未发现替代当前选择的新候选。已完成的契约文档作为本轮证据复用，依赖该契约的实现仅记录为后续义务。",
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
            "reason": "不阻塞当前直接添加契约。"
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
            "reason": "当前契约不改变 Runtime 内核。"
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
              "user_impact": "真实项目安全验证"
            },
            "reason": "当前项目成员授权在本 Case 内明确，不扩大为通用安全验证。"
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
            "reason": "独立验证事项，不阻塞当前契约。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公共发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布仍属独立人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重新打包授权",
              "uncertainty": "",
              "risk": "",
              "user_impact": "封装验收"
            },
            "reason": "独立人工打包事项。"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "旧禁用契约阻塞实施",
              "uncertainty": "操作者权限与恢复边界",
              "risk": "客户端按钮不能代替服务端授权",
              "user_impact": "从组织成员直接加入项目"
            },
            "reason": "最新快照仍保留该缺口，已有持久文档足以支持契约完成主张。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-003-001",
        "responsibility": "agent",
        "goal": "建立从组织成员直接添加项目成员的明确产品、交互与授权契约，替换旧的禁用约定。",
        "reason": "服务端接口存在，但操作者授权缺失，且旧规格明确禁止该入口；这些边界决定客户端接入与服务端必要改动的范围，必须先形成一致的实施依据。",
        "derived_from": [
          "FACT-20260911-003-001",
          "FACT-20260911-003-002",
          "FACT-20260911-003-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "既有禁用契约与当前需求冲突，阻塞一致实施。",
          "uncertainty": "需明确允许直接添加的操作者及服务端授权边界。",
          "risk": "仅增加客户端按钮不能建立服务端权限保护。",
          "user_impact": "直接解决用户无法从组织成员选择加入项目的问题。"
        },
        "evidence_required": [
          "可恢复的直接添加产品及权限规则，明确与邀请加入的关系",
          "项目上下文、同组织成员选择、已有成员处理、提交及失败恢复交互",
          "现有服务端契约与所需授权保护的技术依据"
        ]
      },
      "planned_transition": {
        "goal": "接受一致、可恢复的直接添加项目成员契约。",
        "expected_state_change": "复用已完成文档，以项目 owner/admin 授权、同组织成员单选、服务端确认和明确恢复路径替换旧禁用规则，并记录尚未实现的义务。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-003-001",
          "status": "resolved",
          "outcome": "产品、交互和技术契约已一致定义，旧禁用约定已修订。",
          "reason": "现有项目邀请授权提供权限依据；重新读取确认规格、交互策略、状态线框及技术方案仍完整覆盖目标选择、权限、幂等与恢复。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/member-add.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-003-004",
            "revision": 1,
            "status": "accepted",
            "statement": "项目 owner/admin 可以从项目所属组织选择一位已有组织成员直接加入项目，新增角色固定为 member；组织管理角色不替代项目角色。服务端在新建及幂等返回前验证操作者项目权限。邀请加入独立保留，成功后刷新成员事实，网络结果不明先核对，成功后刷新失败仅重读，旧响应不覆盖新项目或账户。",
            "basis": "用户直接添加需求、现有项目邀请权限边界及已完成的稳定定义；最新快照未改变这些依据。",
            "evidence": [
              "services/workshop-api/handler/project.go:776",
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "FACT-20260911-003-005",
            "revision": 1,
            "status": "accepted",
            "statement": "契约工作仅修订定义文档与状态线框，静态检查通过，包含 8 个带触发条件、组件清单和交互行为的状态及 7 个 Sheet 投影；重规划时已确认产物与记录仍存在。客户端直接添加入口与服务端授权保护未由该工作实现或验证。",
            "basis": "已完成的文件变更和确定性检查记录，以及本次只读核对；未重复实施。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/contract-verification.json",
              "arckit/interaction/platform-workspace/member-add.html"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260911-003-001",
            "fact_id": "FACT-20260911-003-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 45
            },
            "effect": "upheld",
            "reason": "组织治理能力的持久规格明确直接添加与邀请的独立边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ]
          },
          {
            "id": "IMPACT-20260911-003-002",
            "fact_id": "FACT-20260911-003-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 68
            },
            "effect": "upheld",
            "reason": "直接添加遵守远端治理角色边界，交互源与投影明确选择、反馈和恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/member-add.html"
            ]
          },
          {
            "id": "IMPACT-20260911-003-003",
            "fact_id": "FACT-20260911-003-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "identity_and_access",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "明确项目角色授权，要求服务端在幂等响应前同样校验。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260911-003-004",
            "fact_id": "FACT-20260911-003-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "契约已明确，但生产实现与权限验证尚未完成。",
            "gap_ids": [
              "GAP-20260911-003-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260911-003-002",
            "status": "open",
            "goal": "实现并验证符合已定契约的同组织成员直接添加能力及服务端项目权限保护。",
            "reason": "契约要求客户端入口与服务端授权共同成立，现有客户端仍禁用，服务端缺少 caller 项目权限校验。",
            "derived_from": [
              "FACT-20260911-003-004",
              "FACT-20260911-003-005",
              "FACT-20260911-003-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "用户要求的实际能力尚未兑现",
              "uncertainty": "实现、回归与部署证据尚未形成",
              "risk": "越权添加、错误身份、重复提交及异步上下文污染",
              "user_impact": "组织项目可以直接选人加入"
            },
            "responsibility": "agent",
            "evidence_required": [
              "项目详情成员选择、完整分页、已有成员禁选与受限 IPC/Adapter 的行为证据",
              "服务端 owner/admin 成功，普通成员、非成员、仅组织管理员拒绝，含重复添加路径",
              "跨组织、个人项目、ID 区分、幂等与事件事务验证",
              "成功刷新、刷新失败、结果不明核对及项目/账户切换的恢复验证",
              "明确区分源码、实际界面及线上服务授权的验证范围"
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
            "area_ref": "identity_and_access",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. ArcOrbit 产品反馈要求有效 Workshop 登录，并以服务端 current-user 的不可变业务 ID 作为反馈身份；退出或切换账户会关闭旧反馈上下文。Codex authentication 是独立于 ArcOrbit/Workshop authentication 的状态域，由 `codex login status` 退出码确认。未认证用户必须显式选择 ChatGPT、API Key 或明确支持的 Enterprise Access Token；ChatGPT 还必须显式选择 system-browser 或 device-auth，所有选项均无默认值。组织项目直接添加成员采用项目 owner/admin 授权，组织管理角色不自动取得项目权限；目标必须属于项目同一组织，新增角色固定为 member。服务端在新建及幂等返回前验证当前操作者，客户端按钮与缓存不替代服务端授权。",
              "reason": "直接添加与项目邀请都改变项目访问范围，采用一致的项目管理权限；用户要求新增加入方式，没有要求扩大普通成员或组织管理员的项目权限。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/arcorbit-distribution.md",
                "https://learn.chatgpt.com/docs/auth",
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "services/workshop-api/handler/project.go:776"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 认证方式或 Workshop 身份边界变化，或项目直接添加的操作者权限、组织归属及角色规则变化时重审。"
            },
            "gap_refs": [],
            "reason": "最新快照中的身份决策仍未包含直接添加授权，本轮接受该契约时同步记录，保留现有其他身份规则。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
        ]
      },
      "invariant_assessment": {
        "project_revision": 369,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "规格替换旧禁用规则，明确能力、权限、加入方式和验收意义。",
            "fact_refs": [
              "FACT-20260911-003-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互源、治理入口与状态线框覆盖选择、提交、反馈、恢复和上下文连续性。",
            "fact_refs": [
              "FACT-20260911-003-004"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "arckit/interaction/platform-workspace/member-add.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "成员管理行为沿用已有灰度线框和弹层语义，没有建立或修改品牌、主题、tokens 或长期视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术方案明确身份字段、固定命令、授权顺序、幂等事务、投影归属及验证边界。",
            "fact_refs": [
              "FACT-20260911-003-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "定义已完成，客户端入口与服务端授权保护仍未实现。",
            "fact_refs": [
              "FACT-20260911-003-005",
              "FACT-20260911-003-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
            ],
            "gap_refs": [
              "GAP-20260911-003-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "现有授权缺口已有源码证据，文档检查不能证明越权、并发和恢复风险已受控，保留实施验证义务。",
            "fact_refs": [
              "FACT-20260911-003-002",
              "FACT-20260911-003-005"
            ],
            "evidence": [
              "services/workshop-api/handler/project.go:571",
              "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
            ],
            "gap_refs": [
              "GAP-20260911-003-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/member-add.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/cases/evidence/CASE-20260911-003/contract-verification.json"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-082731323Z-a3d5793d",
      "occurred_at": "2026-09-11T08:38:55.812Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证已接受的直接添加项目成员契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "契约已由可信提交接受，当前 fresh snapshot 中实现缺口直接阻塞用户要求的成员添加能力。",
        "snapshot_token": "c35459ddebb6fcb97a2817832bfb236605d12511dad1f69242720c0dfcf3a864",
        "selected_ref": "case-gap:CASE-20260911-003:GAP-20260911-003-002",
        "comparison_summary": "选择直接添加实现与验证；四项通用 Project 验证需要独立 Case，两项人工事项与当前实现无依赖关系，均暂缓。",
        "fresh_discovery_summary": "发现组织成员分页异常可能返回部分列表，已作为既定完整候选要求的一部分修复并验证；未发现需要替代当前选择的新候选。",
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
              "user_impact": "通用动态选择验证"
            },
            "reason": "独立验证事项，不阻塞已接受成员管理契约的实现。"
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
            "reason": "当前工作不改变 Runtime 内核。"
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
              "user_impact": "真实项目安全验证"
            },
            "reason": "当前项目成员授权在本 Case 内实现验证，不扩大为通用安全验收。"
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
            "reason": "独立审计事项，不阻塞当前功能。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公共发布和归档",
              "uncertainty": "提供方及所有者事实",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布仍属独立人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重新打包授权",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Release 封装验收"
            },
            "reason": "本轮不消费或改变该人工授权边界。"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "实际成员添加能力尚未兑现",
              "uncertainty": "实现和行为验证",
              "risk": "越权、错误身份、重复提交及异步上下文污染",
              "user_impact": "从组织成员直接加入项目"
            },
            "reason": "契约和权限依据已经接受，可在一个实现主张内完成客户端、服务端及对应验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-003-002",
        "responsibility": "agent",
        "goal": "实现并验证符合已定契约的同组织成员直接添加能力及服务端项目权限保护。",
        "reason": "契约要求客户端入口与服务端授权共同成立，现有客户端仍禁用，服务端缺少 caller 项目权限校验。",
        "derived_from": [
          "FACT-20260911-003-004",
          "FACT-20260911-003-005",
          "FACT-20260911-003-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户要求的实际能力尚未兑现",
          "uncertainty": "实现、回归与部署证据尚未形成",
          "risk": "越权添加、错误身份、重复提交及异步上下文污染",
          "user_impact": "组织项目可以直接选人加入"
        },
        "evidence_required": [
          "项目详情成员选择、完整分页、已有成员禁选与受限 IPC/Adapter 的行为证据",
          "服务端 owner/admin 成功，普通成员、非成员、仅组织管理员拒绝，含重复添加路径",
          "跨组织、个人项目、ID 区分、幂等与事件事务验证",
          "成功刷新、刷新失败、结果不明核对及项目/账户切换的恢复验证",
          "明确区分源码、实际界面及线上服务授权的验证范围"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证已接受的直接添加项目成员契约。",
        "expected_state_change": "客户端提供受项目角色限制的同组织成员选择；服务端独立授权；重复添加、失败恢复和上下文隔离具有可重复证据。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-003-002",
          "status": "resolved",
          "outcome": "直接添加源码实现及隔离行为验证完成。",
          "reason": "生产 Renderer、受限主进程命令和服务端授权共同实现既定契约；定向测试、真实 PostgreSQL 并发事务测试及 Electron 页面验证通过，明确排除线上部署和安装包声明。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json",
            "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
            "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
            "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-003-006",
            "revision": 1,
            "status": "accepted",
            "statement": "源码已实现项目 owner/admin 从同组织成员直接添加项目成员。服务端在目标查询、幂等成功和新增前校验操作者；新增角色固定 member，重复请求保留原关系。客户端通过固定命令重新核对账户、项目权限及组织成员关系，候选完整分页且已有成员禁选；确认成功后刷新，刷新失败仅重读，结果不明先核对，旧项目或账户响应不覆盖当前界面。",
            "basis": "实际生产源码及对应行为测试。",
            "evidence": [
              "services/workshop-api/handler/project.go",
              "services/workshop-api/api/project.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
            ]
          },
          {
            "id": "FACT-20260911-003-007",
            "revision": 1,
            "status": "accepted",
            "statement": "最终 44 项定向测试通过；完整 ArcOrbit 回归 675 项通过、30 项跳过、零失败，随后焦点修正及新增分页测试通过最终定向和 Electron 复验。真实 PostgreSQL race 测试验证拒绝越权、跨组织和个人项目、身份字段区分、幂等关系保留、八请求并发唯一新增以及事件失败回滚。Go 模块回归通过。生产 Renderer 在真实 Electron 中验证入口权限、选择、搜索、成功刷新、焦点恢复和项目切换；其服务数据为确定性替身，未验证线上部署或安装包。",
            "basis": "实际命令退出结果及持久测试输出，验证层次和先后范围已明确记录。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
              "arckit/cases/evidence/CASE-20260911-003/implementation-regression.tap",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
              "arckit/cases/evidence/CASE-20260911-003/implementation-go-regression.txt",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json",
              "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260911-003-002",
            "revision": 1,
            "reason": "其中服务端尚未校验操作者权限的现状已被实际修复及 PostgreSQL 验证替代。",
            "evidence": [
              "services/workshop-api/handler/project.go",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt"
            ]
          },
          {
            "id": "FACT-20260911-003-003",
            "revision": 1,
            "reason": "旧禁用规格已修订，客户端 unavailable 和缺少添加命令的现状已由本轮实现替代。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-20260911-003-005",
            "fact_id": "FACT-20260911-003-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "identity_and_access",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "项目角色授权由服务端执行，客户端身份核对和按钮状态不替代服务端权限保护。",
            "gap_ids": [],
            "evidence": [
              "services/workshop-api/handler/project.go",
              "services/workshop-api/handler/project_member_add_test.go",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260911-003-004",
            "fact_id": "FACT-20260911-003-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "此前缺失的客户端入口与服务端授权已实现并通过对应验证；结论限于源码和已执行验证环境。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt"
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
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
          "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
        ]
      },
      "invariant_assessment": {
        "project_revision": 370,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "已接受的直接添加与邀请边界保持成立，API 权限说明和规格索引已反映实现及验证范围。",
            "fact_refs": [
              "FACT-20260911-003-004",
              "FACT-20260911-003-006"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/spec/_map/feature-matrix.md",
              "services/workshop-api/api/project.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互契约与实际选择、提交、核对、刷新恢复和上下文失效行为对应。",
            "fact_refs": [
              "FACT-20260911-003-006",
              "FACT-20260911-003-007"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json",
              "runtime/arcorbit/test/project-member-add.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "成员选择复用现有 modal-overlay、platform-action-panel、字段、列表和按钮样式，没有新增主题或视觉 tokens；实际 Electron 流程验证焦点恢复。",
            "fact_refs": [
              "FACT-20260911-003-006"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定命令、身份字段、服务端授权顺序、事务与恢复实现遵守已接受技术契约，API 文档同步修订。",
            "fact_refs": [
              "FACT-20260911-003-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "services/workshop-api/api/project.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "既定客户端与服务端实现要求具有源码、定向测试、真实数据库及 Renderer 证据；不把这些证据扩大为线上部署或安装包验收。",
            "fact_refs": [
              "FACT-20260911-003-006",
              "FACT-20260911-003-007"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "越权、字段混淆、重复写入、事务分裂、分页遗漏及旧响应污染均有相应行为证据；线上状态保持明确未验证，不声明已受控。",
            "fact_refs": [
              "FACT-20260911-003-007"
            ],
            "evidence": [
              "services/workshop-api/handler/project_member_add_test.go",
              "runtime/arcorbit/test/project-member-add.test.mjs",
              "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
              "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
              "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/implementation-verification.json",
        "arckit/cases/evidence/CASE-20260911-003/implementation-focused.tap",
        "arckit/cases/evidence/CASE-20260911-003/implementation-regression.tap",
        "arckit/cases/evidence/CASE-20260911-003/implementation-postgres.txt",
        "arckit/cases/evidence/CASE-20260911-003/implementation-go-regression.txt",
        "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-082731323Z-a3d5793d",
      "occurred_at": "2026-09-11T08:58:15.522Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修订为服务端保持原样的客户端接入契约，并撤回本 Case 服务端变更。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "用户明确要求保持服务端不变，优先修正与旧契约冲突的实施范围。",
        "snapshot_token": "1d8c9a4538d979775249768656256dd59de0d9cda88d5298c4ee56e9d7aeb11b",
        "selected_ref": "fresh-gap:CASE-20260911-003:GAP-20260911-003-004",
        "comparison_summary": "新的范围约束优先于原完成检查；四项 Project 事项需要独立 Case，两项人工事项不属于当前授权范围。",
        "fresh_discovery_summary": "服务端三处修改均可撤回；既有客户端仍存在空响应和错误目标响应被当作成功的问题。",
        "considered": [
          {
            "ref": "fresh-gap:CASE-20260911-003:GAP-20260911-003-004",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "旧契约与用户最新范围冲突",
              "uncertainty": "需明确现有接口与客户端限制的区别",
              "risk": "错误声称服务端授权已受控",
              "user_impact": "直接落实服务端不变的要求"
            },
            "reason": "先形成修订后的实施和验收依据。"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "范围已改变，当前不能按旧契约完成检查。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立场景验证，不解决当前范围冲突。"
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
              "user_impact": ""
            },
            "reason": "独立 Runtime 工作。"
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
              "user_impact": ""
            },
            "reason": "独立真实项目验证，不扩大本次服务端范围。"
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
              "user_impact": ""
            },
            "reason": "独立跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公开发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布仍由人工负责。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重打包授权被拒绝",
              "uncertainty": "",
              "risk": "",
              "user_impact": "安装包验收"
            },
            "reason": "当前指令未恢复该授权。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-003-004",
        "status": "open",
        "goal": "确立并落实服务端保持原样的范围与预期。",
        "reason": "用户最新指令否定此前新增服务端授权的范围。",
        "derived_from": [
          "current_operator_input",
          "FACT-20260911-003-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "后续客户端验收依据",
          "uncertainty": "权限限制归属",
          "risk": "错误授权声明",
          "user_impact": "明确要求"
        },
        "responsibility": "agent",
        "evidence_required": [
          "服务目录恢复证明",
          "一致的产品、交互与技术预期",
          "历史验证适用范围说明"
        ],
        "resolution": null
      },
      "planned_transition": {
        "goal": "修订为服务端保持原样的客户端接入契约，并撤回本 Case 服务端变更。",
        "expected_state_change": "替换旧服务端授权要求，保留可恢复的客户端实施义务。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-003-004",
          "status": "resolved",
          "outcome": "客户端接入既有接口的范围已明确，服务端修改已撤回。",
          "reason": "服务文件与 HEAD 字节一致，服务目录 Git 状态为空；稳定文档区分客户端限制与服务端实际行为。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-003-008",
            "revision": 1,
            "status": "accepted",
            "statement": "按用户要求，本功能保持 Workshop 服务代码与接口不变。ArcOrbit 主进程保留项目 owner/admin 操作限制、同组织选择、固定 member 角色和独立邀请入口。现有直接添加接口要求已认证并校验目标同组织，但不校验 caller 项目角色；客户端限制不构成服务端保护。成功必须验证响应目标并刷新，未知结果先核对，刷新失败仅重读，旧响应不得覆盖新上下文。",
            "basis": "用户最新范围约束及修订后的稳定文档。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "services/workshop-api/api/project.md"
            ]
          },
          {
            "id": "FACT-20260911-003-009",
            "revision": 1,
            "status": "accepted",
            "statement": "本 Case 的服务端 handler 与 API 文档已恢复到 HEAD，新增服务端测试移至历史证据，服务目录无 Git 差异。此前 PostgreSQL 结果只证明已撤回版本，不能证明恢复后存在 caller role 保护。客户端仍会将空响应或不匹配项目和用户的响应报告为成功，尚未完成修订契约的实施验证。",
            "basis": "字节及 Git 检查与生产客户端确定性复现。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json",
              "arckit/cases/evidence/CASE-20260911-003/review-response-identity.json"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260911-003-004",
            "revision": 1,
            "reason": "服务端新增 caller role 校验不再属于接受范围，以客户端接入既有接口契约替代。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
            ]
          },
          {
            "id": "FACT-20260911-003-006",
            "revision": 1,
            "reason": "服务端实现已撤回，客户端完整成功核验尚未成立。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260911-003-001",
            "fact_id": "FACT-20260911-003-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 45
            },
            "effect": "upheld",
            "reason": "直接添加与独立邀请保留，范围改为客户端接入。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ]
          },
          {
            "id": "IMPACT-20260911-003-002",
            "fact_id": "FACT-20260911-003-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 68
            },
            "effect": "upheld",
            "reason": "角色入口、选择、确认及恢复契约可恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ]
          },
          {
            "id": "IMPACT-20260911-003-003",
            "fact_id": "FACT-20260911-003-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "identity_and_access",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "明确客户端限制与既有 API 校验的不同边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260911-003-004",
            "fact_id": "FACT-20260911-003-009",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "客户端缺少成功响应目标验证。",
            "gap_ids": [
              "GAP-20260911-003-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/review-response-identity.json"
            ]
          },
          {
            "id": "IMPACT-20260911-003-005",
            "fact_id": "FACT-20260911-003-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "identity_and_access",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "不再声明服务端项目角色保护；原接口及其限制明确保留。",
            "gap_ids": [],
            "evidence": [
              "services/workshop-api/api/project.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260911-003-003",
            "status": "open",
            "goal": "修正并验证客户端符合保持服务端不变的直接添加契约。",
            "reason": "空响应和目标不匹配响应仍被当作成功；客户端兼容性需要按修订契约验证。",
            "derived_from": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-009"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "真实成功反馈与 Case 完成",
              "uncertainty": "现有响应契约下的恢复",
              "risk": "错误报告已加入",
              "user_impact": "可靠直接添加"
            },
            "responsibility": "agent",
            "evidence_required": [
              "合法、空、缺字段和项目或用户不匹配响应的行为验证",
              "客户端项目角色、组织关系、分页及身份字段兼容验证",
              "结果不明核对、刷新失败重读与上下文切换验证",
              "服务目录保持无差异"
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
            "area_ref": "identity_and_access",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "认证仍限定于配置的执行与任务来源，授权受用户批准、工作区、沙箱和可信入口约束。Runtime 会话保持服务端支持的七天不活动窗口，成功登录、启动恢复或 token 刷新通过轮换凭据续期；超期、凭据缺失或失效、退出和服务端拒绝要求重新登录。产品反馈使用有效 Workshop 登录及 current-user 不可变业务 ID，账户变化关闭旧上下文。Codex 认证独立，以 codex login status 退出码确认；认证方式和 ChatGPT 浏览器或 device-auth 路径均由用户显式选择，无默认值。组织项目直接添加由 ArcOrbit 主进程限制为项目 owner/admin，组织角色不替代项目角色；目标同组织，新增角色固定 member。Workshop 服务保持原样：现有接口要求已认证并校验目标同组织，但不校验 caller 项目角色。客户端限制不能替代或被描述为服务端保护，本功能不要求服务端修改或发布。",
              "reason": "用户明确要求服务端保持不变，修订预期事实和客户端逻辑。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "services/workshop-api/api/project.md"
              ],
              "confidence": "high",
              "resume_condition": "认证域或直接添加客户端角色、服务端范围改变时重审。"
            },
            "gap_refs": [],
            "reason": "替换已失效的服务端新增授权要求，保留其他认证边界。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
        ]
      },
      "invariant_assessment": {
        "project_revision": 370,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "能力与服务端不变范围已同步到稳定规格。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口、角色限制、选择和恢复语义保持明确。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "范围与权限归属修订没有改变视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "现有 API、客户端限制及历史验证适用范围有明确依据。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-009"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "服务端恢复已证明，但客户端成功核验仍未兑现。",
            "fact_refs": [
              "FACT-20260911-003-009"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/review-response-identity.json"
            ],
            "gap_refs": [
              "GAP-20260911-003-003"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "错误成功反馈已有复现，仍待修复验证；既有服务端角色校验缺失明确保留，不声明受客户端保护。",
            "fact_refs": [
              "FACT-20260911-003-009",
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/review-response-identity.json",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": [
              "GAP-20260911-003-003"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/client-only-contract-verification.json"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-092441742Z-45ae06db",
      "occurred_at": "2026-09-11T09:31:06.666Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修正客户端成功响应核验并验证既有接口下的恢复行为。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "修订后的客户端契约已接受，当前实现缺口可直接推进。",
        "snapshot_token": "515445c8a08e25b2d957039740916b62bc123b35a916070533aab5a1fd3ac0a0",
        "selected_ref": "case-gap:CASE-20260911-003:GAP-20260911-003-003",
        "comparison_summary": "选择直接影响可靠添加的客户端缺口；独立 Project 验证和其他 Case 的人工事项继续暂缓。",
        "fresh_discovery_summary": "响应验证错误必须保留写入结果不明语义，已在所选缺口内修正并验证；未发现需要另立范围的前置问题。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "真实成功反馈与 Case 完成",
              "uncertainty": "现有响应契约下的恢复",
              "risk": "错误报告已加入",
              "user_impact": "可靠直接添加"
            },
            "reason": "已接受契约和复现证据明确，能够完成客户端修复。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立场景验证。"
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
              "user_impact": ""
            },
            "reason": "独立 Runtime 工作。"
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
              "user_impact": ""
            },
            "reason": "独立真实项目验证，不扩大本次服务端范围。"
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
              "user_impact": ""
            },
            "reason": "独立跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公开发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布需要人工事实。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重打包请求被拒绝",
              "uncertainty": "",
              "risk": "",
              "user_impact": "安装包验收"
            },
            "reason": "当前指令未恢复重打包授权。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-003-003",
        "responsibility": "agent",
        "goal": "修正并验证客户端符合保持服务端不变的直接添加契约。",
        "reason": "空响应和目标不匹配响应仍被当作成功；客户端兼容性需要按修订契约验证。",
        "derived_from": [
          "FACT-20260911-003-008",
          "FACT-20260911-003-009"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "真实成功反馈与 Case 完成",
          "uncertainty": "现有响应契约下的恢复",
          "risk": "错误报告已加入",
          "user_impact": "可靠直接添加"
        },
        "evidence_required": [
          "合法、空、缺字段和项目或用户不匹配响应的行为验证",
          "客户端项目角色、组织关系、分页及身份字段兼容验证",
          "结果不明核对、刷新失败重读与上下文切换验证",
          "服务目录保持无差异"
        ]
      },
      "planned_transition": {
        "goal": "修正客户端成功响应核验并验证既有接口下的恢复行为。",
        "expected_state_change": "关闭客户端实现缺口，恢复实现一致性影响为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-003-003",
          "status": "resolved",
          "outcome": "客户端响应身份核验与恢复回归完成。",
          "reason": "只有有效成员关系 ID、匹配项目及所选用户的响应才确认成功；不完整或错误目标响应进入结果核对，账户变化不确认成功。101 项定向测试通过，服务目录保持无差异。",
          "evidence": [
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/test/project-member-add.test.mjs",
            "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
            "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-003-010",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 主进程对直接添加响应验证有效成员关系 ID、目标 project_id 与所选组织成员的 user_id；空、缺字段或不匹配响应保持 outcome_unknown，先核对成员事实，未确认时需要单独用户重试。写入期间账户变化不确认成功，已有关系角色和职责不重写。客户端项目角色、组织关系、分页、刷新失败及过期上下文回归共 101 项通过。服务目录无差异，未执行线上请求或安装包验收。",
            "basis": "生产协调器修复及确定性行为回归，验证输出持久保存。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/test/project-member-add.test.mjs",
              "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
              "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260911-003-009",
            "revision": 1,
            "reason": "服务端恢复与历史验证限制继续成立，但客户端错误成功反馈已修复，由新的实现证据替代当前缺口声明。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260911-003-004",
            "fact_id": "FACT-20260911-003-010",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "客户端响应核验及恢复符合已接受的服务端不变契约。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap"
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
        "project_revision": 371,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "保持已接受的客户端接入范围，规格索引同步实际验证状态。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/spec/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "未知结果核对、显式重试和已确认后只刷新符合稳定交互。",
            "fact_refs": [
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/test/project-member-add.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "主进程响应核验与行为测试没有改变视觉规则或界面样式。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定接口、身份字段区分及客户端与服务端的边界保持明确。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "services/workshop-api/api/project.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "合法与无效响应、客户端限制及恢复路径具有生产逻辑行为证据；服务目录无差异。",
            "fact_refs": [
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
              "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "错误成功反馈和重复写入恢复风险有定向回归；结论限定客户端，不声明既有服务端 caller role 缺失已受控，也不扩展为线上或安装包验证。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json",
              "runtime/arcorbit/test/project-member-add.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/client-only-focused.tap",
        "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260911-092441742Z-45ae06db",
      "occurred_at": "2026-09-11T09:34:37.247Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查当前客户端直接添加实现的五个完成维度。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前任务与现有 Case 意图一致，普通义务已闭合，选择尚未获验收的完成审查。",
        "snapshot_token": "2f062e1031dbe7ca21b8679bdeca7e62c67780aab50ffd6082165ab1f7673ceb",
        "selected_ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
        "comparison_summary": "完成审查直接推进当前需求；四项 Project 工作和其他两个 Case 的人工事项均暂缓。",
        "fresh_discovery_summary": "重新核对历史审查记录与现有源码，提交对象显示缺陷仍存在，作为本次 Review finding 提交。",
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
              "user_impact": ""
            },
            "reason": "通用场景评估不直接解决当前成员添加需求。"
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
              "user_impact": ""
            },
            "reason": "Runtime 韧性是独立工作，不阻塞本次审查提交。"
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
              "user_impact": ""
            },
            "reason": "真实权限项目验证超出当前客户端接入范围。"
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
              "user_impact": ""
            },
            "reason": "跨记录审计是独立项目义务。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可、发布与归档不属于本任务，不请求人工处理。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "Release 封装验收独立于当前客户端功能审查。"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接对应当前任务，已有实现及证据可供审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-003:completion-review:1",
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
        "goal": "审查当前客户端直接添加实现的五个完成维度。",
        "expected_state_change": "记录提交对象显示缺陷，由 Ledger 派生 Agent 修复义务，保留 Case 未完成状态。"
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
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260911-003-001",
              "kind": "error",
              "statement": "添加弹窗未显示组织身份；选择成员 A 后搜索 B 会隐藏 A，但仍保留 A 的选择并允许提交。需使组织、项目及所选成员明确可见，或使隐藏选择失效，并补充实际 Renderer 行为验证。保持服务端不变。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/fixtures/project-member-add-electron.mjs"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md:84"
              ]
            }
          ],
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
            "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json",
            "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
          ],
          "reviewed_content_revision": 4
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
        "project_revision": 375,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "直接添加、独立邀请、客户端权限及服务端不变的预期明确，提交前显示对象的要求可恢复。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "选择、提交、未知结果核对和刷新恢复的稳定交互要求明确；发现属于实现遗漏。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本次发现涉及对象显示与选择行为，没有建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定客户端命令、身份字段及既有 API 边界明确，未将客户端限制描述为服务端保护。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "响应核验符合已接受事实，但提交前明确展示组织与目标成员的要求未完全实现。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md"
            ],
            "gap_refs": [
              "CASE-20260911-003:review-finding:FINDING-20260911-003-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "现有测试证明响应及恢复行为，但未覆盖搜索隐藏所选对象后的误提交风险；不扩大历史服务端测试或安装包证据的适用范围。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
              "arckit/cases/evidence/CASE-20260911-003/implementation-electron.json"
            ],
            "gap_refs": [
              "CASE-20260911-003:review-finding:FINDING-20260911-003-001"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
        "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json",
        "当前 platform-coordinator.mjs SHA-256 与验证记录一致：62d04ed7f4758c452e6fe6c120cfd8b36c8ea875b1a1d6bf42cc3bae55918636",
        "git status --short services/workshop-api：空"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260912-030846534Z-817ef9a7",
      "occurred_at": "2026-09-12T03:10:56.797Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修复组织身份缺失和搜索隐藏所选成员后的对象不明确问题。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的审查发现直接影响提交对象的明确性，已有充分依据实施并验证。",
        "snapshot_token": "0225f7d95be007ce8e469bf011e992d96687501cf2e0478b992500b8bf2dcc6e",
        "selected_ref": "case-gap:CASE-20260911-003:CASE-20260911-003:review-finding:FINDING-20260911-003-001",
        "comparison_summary": "选择当前唯一可由 Agent 推进的 Case 修复；四项项目工作需要独立 Case，两项其他 Case 工作属于人工责任，均不阻塞本修复。",
        "fresh_discovery_summary": "源码确认隐藏选择问题；修复及验证未发现改变当前验收范围的新缺口。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:review-finding:FINDING-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞当前 Case 完成",
              "uncertainty": "已有明确复现",
              "risk": "提交对象不明确",
              "user_impact": "可靠选择项目成员"
            },
            "reason": "直接服务当前需求，可在客户端局部修复并验证。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立场景评估不阻塞当前修复。"
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
              "user_impact": ""
            },
            "reason": "Runtime 韧性属于独立范围。"
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
              "user_impact": ""
            },
            "reason": "真实受控资源验证不属于本次客户端修复。"
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
              "user_impact": ""
            },
            "reason": "跨记录审计需要独立验收上下文。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公开发布",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可与发布决定属于其他 Case 的人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重新打包授权",
              "uncertainty": "",
              "risk": "",
              "user_impact": "封装验收"
            },
            "reason": "其他 Case 的打包授权不阻塞隔离 Renderer 验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-003:review-finding:FINDING-20260911-003-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 添加弹窗未显示组织身份；选择成员 A 后搜索 B 会隐藏 A，但仍保留 A 的选择并允许提交。需使组织、项目及所选成员明确可见，或使隐藏选择失效，并补充实际 Renderer 行为验证。保持服务端不变。",
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
          "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/fixtures/project-member-add-electron.mjs",
          "arckit/cases/evidence/CASE-20260911-003/completion-review-client-only.md",
          "arckit/spec/agentic-software-development/arcorbit-organization-management.md:84"
        ]
      },
      "planned_transition": {
        "goal": "修复组织身份缺失和搜索隐藏所选成员后的对象不明确问题。",
        "expected_state_change": "以生产 Renderer 行为证据关闭审查修复 Gap，后续独立进行完成审查。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260911-003:review-finding:FINDING-20260911-003-001",
          "status": "resolved",
          "outcome": "组织、项目和所选成员持续明确显示，搜索后提交对象验证通过。",
          "reason": "组织按项目 organization_id 匹配；所选成员摘要独立于搜索列表。真实 Electron 验证搜索其他成员及无结果时仍展示所选身份，并仅提交该成员一次。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
            "arckit/cases/evidence/CASE-20260911-003/selection-fix-focused.tap"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-003-011",
            "revision": 1,
            "status": "accepted",
            "statement": "添加弹窗显示项目所属组织与项目名称，并在搜索列表之外持续显示所选成员姓名和用户身份。搜索隐藏候选或没有匹配时仍明确显示实际提交对象。77 项定向测试及生产 Renderer 的隔离 Electron 测试通过，服务目录无差异。",
            "basis": "生产源码修复、实际命令退出结果和确定性服务数据下的真实 Renderer 行为验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/fixtures/project-member-add-electron.mjs",
              "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md"
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
        "project_revision": 375,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "修复落实既有提交前展示对象要求，无需改变产品范围。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "持续显示选择对象，保持既有提交、核对及刷新恢复语义。",
            "fact_refs": [
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "仅补充现有弹窗文本内容，未改变视觉规则、样式或主题。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "组织从项目关系匹配，固定命令与服务端不变边界保持成立。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "组织及目标显示要求由生产 Renderer 实现，并通过实际 Electron 验证。",
            "fact_refs": [
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "搜索隐藏选择与空结果风险具有实际 Renderer 回归，验证结论限定客户端，不声明服务端角色保护或安装包验收。",
            "fact_refs": [
              "FACT-20260911-003-011",
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
        "arckit/cases/evidence/CASE-20260911-003/selection-fix-focused.tap"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260912-030846534Z-817ef9a7",
      "occurred_at": "2026-09-12T03:16:05.019Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查内容修订 5 的五个完成维度。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "提交后快照确认全部普通义务闭合，当前内容修订 5 已具备独立完成审查条件。",
        "snapshot_token": "ed49f49c8080e25f4de5b67705db915f43f200a973b6172589c706ae9dc2942d",
        "selected_ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:2",
        "comparison_summary": "选择当前 Case 完成审查；四项独立项目工作及两项其他 Case 人工责任均不阻塞本功能验收。",
        "fresh_discovery_summary": "核对当前实现与验证证据，未发现优先于完成审查的新工作。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 唯一剩余义务，直接决定功能完成判断。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立场景评估不阻塞当前功能审查。"
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
              "user_impact": ""
            },
            "reason": "Runtime 韧性属于独立工作范围。"
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
              "user_impact": ""
            },
            "reason": "真实受控项目安全验证不属于本 Case 客户端验收范围。"
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
              "user_impact": ""
            },
            "reason": "跨记录审计需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公开发布",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布属于其他 Case 的人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "重新打包授权",
              "uncertainty": "",
              "risk": "",
              "user_impact": "封装验收"
            },
            "reason": "Release 封装验收不阻塞本 Case 已界定的客户端验收。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-003:completion-review:2",
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
        "goal": "独立审查内容修订 5 的五个完成维度。",
        "expected_state_change": "提交无新发现的完成审查结果，由可信 Ledger 判断 Case 完成。"
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
            "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md",
            "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
            "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
          ],
          "reviewed_content_revision": 5
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
        "project_revision": 375,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "直接添加、独立邀请及客户端范围的稳定预期明确且与实现一致。",
            "fact_refs": [
              "FACT-20260911-003-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "组织、项目与目标明确展示，提交及恢复语义保持一致。",
            "fact_refs": [
              "FACT-20260911-003-010",
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs",
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "界面复用既有弹窗、列表和按钮样式，新增文本未引入独立视觉规则。",
            "fact_refs": [
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/project-member-add.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定命令、关系身份、客户端权限和服务端保持原样的边界明确。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "当前生产实现与响应核验、对象展示及恢复行为证据一致，先前发现已修复。",
            "fact_refs": [
              "FACT-20260911-003-010",
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "主要客户端风险有定向行为测试和实际 Renderer 证据；未将历史服务端测试扩大为当前服务保护或部署验收。",
            "fact_refs": [
              "FACT-20260911-003-008",
              "FACT-20260911-003-010",
              "FACT-20260911-003-011"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-003/completion-review-revision-5.md",
        "arckit/cases/evidence/CASE-20260911-003/selection-fix-verification.md",
        "arckit/cases/evidence/CASE-20260911-003/client-only-verification.json"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260912-030846534Z-817ef9a7",
      "occurred_at": "2026-09-12T03:18:16.506Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260911-003-001",
      "GAP-20260911-003-002",
      "GAP-20260911-003-004",
      "GAP-20260911-003-003",
      "CASE-20260911-003:review-finding:FINDING-20260911-003-001"
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
    "updated_at": "2026-09-12T03:18:16.506Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
