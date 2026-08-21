# ArcOrbit 内置 Arckit skills 改为项目级安装

Case: CASE-20260821-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-21T17:20:24.499Z

## User Intent

调整 ArcOrbit 的内置 Arckit skill provisioning，使这些 skills 只应用到产品关联的本地项目，不再写入 Codex 用户级 skill 目录。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260821-001",
  "title": "ArcOrbit 内置 Arckit skills 改为项目级安装",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-21T15:44:07.092Z",
  "updated_at": "2026-08-21T17:20:24.499Z",
  "user_intent": "调整 ArcOrbit 的内置 Arckit skill provisioning，使这些 skills 只应用到产品关联的本地项目，不再写入 Codex 用户级 skill 目录。",
  "expected_outcome": "ArcOrbit 为关联本地项目生成并应用可审计的项目级 skill plan；不再新增用户级 Arckit skill、catalog loader 或等价消费副本；已有受管理用户级副本通过明确、可恢复且不误删无关内容的迁移规则处理；规格、技术契约、实现和测试保持一致。",
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
      "statement": "操作者要求 ArcOrbit 当前安装到 Codex 用户级范围的内置 Arckit skills 改为只安装到产品关联的本地项目目录，并停止用户级安装。",
      "basis": "当前操作者输入是本轮最高权威增量。",
      "evidence": [
        "Current operator input, 2026-08-21"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 SkillProvisioningManager 选择全部非 project-ambient bundled skills，但 provisioning options 只传入 homeDir 和 agentTargetIds=[codex]，没有传入关联项目的 projectTargetDirs；现有测试据此验证 ambient skill 和 on-demand loader 使用用户级目标，而 project-ambient 仅被 deferred。",
      "basis": "当前仓库实现、测试和稳定分发规格相互印证。",
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:302",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:400",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:353",
        "arckit/spec/arcorbit-distribution.md:110",
        "arckit/tech/arcorbit/installer-supply-chain.md:118"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 的锁定 Arckit payload 继续作为 userData 中的维护源，但全局 Setup Readiness 不生成 Agent apply plan；Product Workspace 提供的规范化本地项目根是唯一 Codex 消费目标。source user-ambient 在每个关联项目中解释为默认常驻，project-ambient 经过项目适用性判断，user-on-demand catalog 保持非 Codex 发现的控制面且 loader 只安装到项目，shared assets 只随项目消费 skill 写入；ArcOrbit 不向 Codex 用户级目录安装 bundled skill、shared asset 或 loader。",
      "basis": "操作者方向已通过产品、交互和技术事实源形成一致、可恢复的稳定契约。",
      "evidence": [
        "Current operator input, 2026-08-21",
        "arckit/spec/arcorbit-distribution.md:88",
        "arckit/spec/arcorbit-distribution.md:114",
        "arckit/spec/arcorbit-distribution.md:128",
        "arckit/interaction/setup-readiness/interaction.md:17",
        "arckit/tech/arcorbit/installer-supply-chain.md:115",
        "arckit/tech/arcorbit/installer-supply-chain.md:175"
      ]
    },
    {
      "id": "FACT-004",
      "revision": 1,
      "status": "accepted",
      "statement": "旧版 ArcOrbit 关系能够证明所有权的 Codex 用户级 skills 和 loader 只在明确项目 target、旧目标、备份和逐目标 disposition 可见并经确认后迁移；内容变化先备份，用户选择保留时不删除且项目不能进入 scope-clean ready；uncertain、unrelated 或没有关系所有权证据的目录永不自动删除，解除项目绑定也不隐式清理项目目录。",
      "basis": "ArcForge 关系所有权与 destructive-action 边界已被稳定产品、交互和技术契约共同采用。",
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:146",
        "arckit/spec/arcorbit-distribution.md:158",
        "arckit/interaction/setup-readiness/interaction.md:28",
        "arckit/interaction/setup-readiness/interaction.md:71",
        "arckit/tech/arcorbit/installer-supply-chain.md:299",
        "arckit/tech/arcorbit/installer-supply-chain.md:319"
      ]
    },
    {
      "id": "FACT-005",
      "revision": 1,
      "status": "accepted",
      "statement": "操作者明确授权修改 /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge 中的权威 ArcForge Provider，并允许重建、测试以及更新 ArcOrbit 锁定使用的 Provider artifact。",
      "basis": "当前操作者输入“授权”直接回应此前列明路径和操作范围的唯一授权请求。",
      "evidence": [
        "Current operator input, 2026-08-21: 授权",
        "Previous handoff explicitly requested ArcForge repository modification, Provider rebuild, testing and ArcOrbit artifact locking"
      ]
    },
    {
      "id": "FACT-006",
      "revision": 1,
      "status": "accepted",
      "statement": "当前权威 ArcForge embedded Provider 已接受 projectTargetDirs、availabilityOverrides 和 projectAssessments，但其通用 resolver 仍把 user-ambient skill 写入 homeDir 下的用户级 Agent 目录，只把 project-ambient 写入项目目录；user-on-demand catalog 位于 Provider stateRoot 控制面，而 arcforge-on-demand loader 仍固定写入用户级 Agent 目录，shared assets 跟随这些现有 ambient 目标。Provider 能力集合及 ArcOrbit 锁定 manifest 均未声明能把全部 Codex 消费副本强制限定到项目的 capability，因此兑现 FACT-003 必须修改权威 Provider并重建、测试和更新 ArcOrbit 锁定 artifact，不能只在 Runtime 复制目标算法。",
      "basis": "ArcForge 权威源码、Provider 测试和 ArcOrbit 锁定 manifest 的直接交叉核验。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:195",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:211",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:70",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:76",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:4"
      ]
    },
    {
      "id": "FACT-007",
      "revision": 1,
      "status": "accepted",
      "statement": "权威 ArcForge Provider 与 ArcOrbit 已实现 project-only provisioning：所有关联 Product Workspace 根组成明确的项目目标集；user-ambient、经评估适用的 project-ambient、shared assets 和 on-demand loader 只投影到这些项目，user-on-demand catalog 保持 ArcForge stateRoot 控制面，无项目的 task preflight 不回退用户级目标；旧 relation 证明的用户级 managed targets 通过显式、可回滚 cleanup 迁移且 unrelated 内容保留。ArcOrbit 已锁定并验证包含 project-only-provisioning/v1 的本地 Provider artifact。",
      "basis": "权威 ArcForge/ArcOrbit 源码、自动化迁移与多项目测试、重建 manifest 和 distribution smoke 的直接证据。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:239",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:90",
        "runtime/arcorbit/test/automation-coordinator.test.mjs:1036",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:8",
        "ArcForge npm test: 61 passed",
        "ArcOrbit npm run check: 233 passed, 2 skipped",
        "npm run smoke:distribution: passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "新的 delivery 契约已明确 ArcOrbit 只向关联项目提供 Codex-discoverable skills，并定义旧用户级 managed target 的安全迁移。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 27
      },
      "effect": "upheld",
      "reason": "Setup Readiness 的全局检查、项目绑定门禁、项目 plan、迁移确认和恢复路径已成为可恢复交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html"
      ]
    },
    {
      "id": "IMPACT-003",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 24
      },
      "effect": "upheld",
      "reason": "provider projectTargetDirs、调用级 availability override、项目 relation、catalog/loader 和 Runtime preflight 边界已形成技术方案。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-004",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 12
      },
      "effect": "upheld",
      "reason": "维护源、ArcForge catalog、ArcOrbit consumer relation 和逐项目 target 的所有权与存储关系已经明确。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:128",
        "arckit/tech/arcorbit/installer-supply-chain.md:146",
        "arckit/tech/arcorbit/installer-supply-chain.md:166"
      ]
    },
    {
      "id": "IMPACT-005",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "SkillProvisioningManager 现在要求明确项目根、向 Provider 传入全部关联 projectTargetDirs 和 project-only policy，并且 task preflight 缺少项目时 fail-closed。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:228",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:344",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:90"
      ]
    },
    {
      "id": "IMPACT-006",
      "fact_id": "FACT-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Provider 只从既有 availability relation、asset relation 和 provisioning evidence 生成旧目标 cleanup；测试证明用户级 managed skill、asset 和 loader 被确认式事务迁移，unrelated 内容保留，晚期失败可回滚。",
      "gap_ids": [],
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:563",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:239",
        "ArcForge npm test: 61 passed"
      ]
    },
    {
      "id": "IMPACT-007",
      "fact_id": "FACT-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "权威 Provider 已声明并实现 project-only-provisioning/v1，ArcOrbit 要求该 capability 且已重建、锁定并通过 distribution smoke 验证对应 artifact。",
      "gap_ids": [],
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:30",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:10",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:8",
        "Provider artifact sha256: 6122479d363d298eeab7d9c99ef11e24ef602b76f3a1d8be157efb1a11eb95d7"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-project-local-skill-provisioning-contract",
      "status": "resolved",
      "goal": "建立 ArcOrbit 内置 Arckit skills 的项目级 provisioning 与迁移契约，明确受影响的 skill modes、关联项目目标目录、触发时机、用户级 catalog/loader 边界，以及历史受管理用户级副本的安全处置。",
      "reason": "后续代码对象、Provider 输入、Setup Readiness 状态、升级迁移和验收测试都会随这些边界变化；当前稳定规格仍规定用户级安装，且实现尚未接入 projectTargetDirs，因此必须先接受这一前置契约。",
      "derived_from": [
        "FACT-001",
        "FACT-002",
        "IMPACT-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "它决定后续实现、迁移和测试的准确范围。",
        "uncertainty": "项目绑定目标已存在，但受影响 modes、on-demand loader/catalog 和历史副本迁移语义尚未形成 durable contract。",
        "risk": "直接改变用户文件写入位置和既有受管理关系，错误处理可能遗留重复 skill 或误删无关内容。",
        "user_impact": "当前用户级安装行为与操作者要求直接冲突。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新后的稳定产品规格明确只向 ArcOrbit 关联本地项目安装",
        "技术契约明确 projectTargetDirs、关系记录归属、Setup Readiness 与项目绑定的衔接",
        "明确 user-ambient、user-on-demand、project-ambient、loader、catalog 和 shared assets 的目标规则",
        "明确历史受管理用户级副本的可见、需确认、可恢复迁移规则，并保留 unrelated/uncertain 内容"
      ],
      "resolution": {
        "id": "GAP-project-local-skill-provisioning-contract",
        "status": "resolved",
        "outcome": "ArcOrbit 内置 Arckit skills 的项目目标、availability 解释、Setup Readiness 触发、catalog/loader 边界、关系归属和旧用户级 managed target 迁移规则已形成稳定契约。",
        "reason": "产品规格、页面级交互源与线框、技术供应链方案和索引投影已一致更新并通过差异与结构校验。",
        "evidence": [
          "arckit/spec/arcorbit-distribution.md:88",
          "arckit/spec/arcorbit-distribution.md:114",
          "arckit/spec/arcorbit-distribution.md:128",
          "arckit/spec/arcorbit-distribution.md:146",
          "arckit/interaction/setup-readiness/interaction.md:5",
          "arckit/interaction/setup-readiness/interaction.md:26",
          "arckit/interaction/setup-readiness/default.html:35",
          "arckit/tech/arcorbit/installer-supply-chain.md:115",
          "arckit/tech/arcorbit/installer-supply-chain.md:175",
          "arckit/tech/arcorbit/installer-supply-chain.md:278",
          "git diff --check"
        ],
        "occurred_at": "2026-08-21T15:59:52.216Z"
      }
    },
    {
      "id": "GAP-project-local-skill-provisioning-implementation",
      "status": "resolved",
      "goal": "实现并验证 ArcOrbit 项目级 skill provisioning，使 Product Workspace 关联项目成为唯一 Codex 消费目标，并按已接受契约完成用户级 managed target 迁移。",
      "reason": "稳定契约已经成立，但当前 SkillProvisioningManager、Setup Readiness 投影和测试仍实现用户级 provisioning，尚不能证明实际软件符合 FACT-003 与 FACT-004。",
      "derived_from": [
        "FACT-002",
        "FACT-003",
        "FACT-004",
        "IMPACT-005",
        "IMPACT-006"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "实际软件仍违反操作者要求，Runtime task 也没有项目级 readiness gate。",
        "uncertainty": "需要验证当前 embedded provider 对项目 loader、调用级 override 和用户目标迁移的真实能力。",
        "risk": "涉及跨多个项目、历史用户级副本、关系迁移和事务回滚。",
        "user_impact": "在实现完成前，ArcOrbit 仍可能继续向 Codex 用户级目录安装 skills。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "SkillProvisioningManager 只为明确 Product Workspace 根生成 projectTargetDirs plan，缺少项目时不回退用户级目标",
        "source user-ambient、project-ambient、user-on-demand catalog、项目 loader 和 shared assets 按契约投影到正确目标",
        "旧用户级 managed skills/loader 的 ownership classification、备份、迁移、保留阻断和 unrelated preservation 可重复验证",
        "Desktop Setup Readiness 与 task preflight 使用逐项目 ready 状态并展示真实 provider targets",
        "自动化测试覆盖 clean project install、多项目关系、项目路径变化、无项目、用户级迁移、冲突、回滚、drift 与 Codex project discoverability"
      ],
      "resolution": {
        "id": "GAP-project-local-skill-provisioning-implementation",
        "status": "resolved",
        "outcome": "ArcForge Provider 已提供 project-only-provisioning/v1；ArcOrbit 为全部关联 Product Workspace 根生成项目级 plan，无项目时只做全局资源检查且 task preflight fail-closed。user-ambient、适用的 project-ambient、shared assets 和 on-demand loader 只写入项目，catalog 保持 stateRoot 控制面；旧 relation 证明的用户级 skill、asset 和 loader 通过显式 cleanup、备份与事务回滚迁移，unknown/unrelated 内容保持不变。",
        "reason": "权威源码、ArcOrbit 集成、Provider artifact、全量测试和 distribution smoke 形成一致且可重复的实现证据；fresh state 未出现反证。",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:166",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:563",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:30",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:10",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:228",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:344",
          "runtime/arcorbit/src/automation-coordinator.mjs:918",
          "runtime/arcorbit/desktop/main.mjs:78",
          "ArcForge npm test: 61 passed",
          "ArcOrbit npm run check: 233 passed, 2 environment-gated skips",
          "ArcOrbit distribution smoke: missing=0, changed=0, same=14, managed_stale=0, uncertain=0",
          "Provider artifact sha256: 6122479d363d298eeab7d9c99ef11e24ef602b76f3a1d8be157efb1a11eb95d7",
          "git diff --check"
        ],
        "occurred_at": "2026-08-21T17:03:55.932Z"
      }
    },
    {
      "id": "GAP-accept-arcforge-provider-authorization",
      "responsibility": "agent",
      "goal": "核验操作者回复“授权”的具体语境，并接受其对 ArcForge Provider 仓库修改、重建、测试和 ArcOrbit artifact 锁定范围的授权事实。",
      "reason": "下游跨仓库实现必须建立在明确、可恢复的授权事实之上。",
      "derived_from": [
        "FACT-001",
        "FACT-003",
        "FACT-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "授权事实未接受前不能安全推进权威 Provider 修改。",
        "uncertainty": "需把简短回复与此前明确请求的路径和动作绑定。",
        "risk": "防止跨工作区越权。",
        "user_impact": "解除项目级安装实现的执行阻塞。"
      },
      "evidence_required": [
        "当前操作者输入“授权”",
        "此前 handoff 明确列出的 ArcForge 仓库路径及 Provider 修改、重建、测试、artifact 锁定范围"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-accept-arcforge-provider-authorization",
        "status": "resolved",
        "outcome": "已确认操作者授权修改相邻 ArcForge 权威 Provider 仓库，并允许重建、测试及更新 ArcOrbit 锁定使用的 Provider artifact。",
        "reason": "“授权”紧邻并直接回应此前包含唯一具体路径和操作范围的授权请求，没有其他竞争指代。",
        "evidence": [
          "Current operator input: 授权",
          "Previous handoff: authorize /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge modification, Provider rebuild/testing and ArcOrbit artifact locking"
        ],
        "occurred_at": "2026-08-21T16:40:53.430Z"
      }
    },
    {
      "id": "GAP-verify-arcforge-project-only-provider-capability",
      "responsibility": "agent",
      "goal": "核验权威 ArcForge embedded Provider 是否已经支持 ArcOrbit 所需的项目专属 skill、shared asset、on-demand loader 和历史用户目标迁移语义。",
      "reason": "implementation Gap 的修改对象和验收范围取决于 Provider 现有能力，且该事实尚未进入 canonical Case。",
      "derived_from": [
        "FACT-002",
        "FACT-003",
        "FACT-004",
        "FACT-005",
        "GAP-project-local-skill-provisioning-implementation"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "决定后续实现是否必须修改、重建并重新锁定权威 Provider artifact。",
        "uncertainty": "projectTargetDirs 已存在，但各种 availability mode、loader 和 capability manifest 的实际行为尚未形成 accepted fact。",
        "risk": "错误地只改 ArcOrbit 会保留用户级目标；在 Runtime 重写算法又会违反 Provider 所有权边界。",
        "user_impact": "项目级安装目标无法在该边界明确前可信实现。"
      },
      "evidence_required": [
        "权威 ArcForge Provider 输入与 capability manifest",
        "availability resolver 对 user-ambient、project-ambient、user-on-demand、shared assets 和 loader 的实际目标规则",
        "Provider 自动化测试对当前目标位置的断言",
        "ArcOrbit 锁定 Provider manifest 的 capability 集合"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-verify-arcforge-project-only-provider-capability",
        "status": "resolved",
        "outcome": "已确认当前 ArcForge Provider 接受 projectTargetDirs，但只将 project-ambient skill 投影到项目；user-ambient skill 仍投影到 homeDir 下的用户级 Agent 目录，user-on-demand catalog 保持 stateRoot 控制面而 loader 仍投影到用户级 Agent 目录，shared assets 跟随现有 ambient 目标。Provider 与 ArcOrbit 锁定 manifest 均未声明项目专属 provisioning capability。",
        "reason": "权威 resolver、Provider公开能力、自动化测试和 ArcOrbit锁定 artifact manifest 给出一致证据。",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:143",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:195",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:200",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:211",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:394",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:70",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:76",
          "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:96",
          "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:1"
        ],
        "occurred_at": "2026-08-21T16:44:34.006Z"
      }
    },
    {
      "id": "CASE-20260821-001:review-finding:REVIEW-001",
      "status": "resolved",
      "goal": "Resolve review finding: 项目级 Provider 与 task preflight 已正确实现，但 Desktop 常规 Setup/首次 Product Workspace 绑定没有把项目上下文传过 preload/Renderer，也没有对应端到端测试；逐项目 readiness 只能在任务 preflight 失败后被动显露。",
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
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/desktop/preload.cjs:5",
        "runtime/arcorbit/desktop/renderer/renderer.js:157",
        "runtime/arcorbit/desktop/main.mjs:78",
        "runtime/arcorbit/desktop/main.mjs:229",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:332",
        "Focused completion review tests: 52 passed"
      ],
      "resolution": {
        "id": "CASE-20260821-001:review-finding:REVIEW-001",
        "status": "resolved",
        "outcome": "Desktop preload 接受受限 Setup 输入；Renderer 在首次绑定、项目选择和普通 retry 时传递本地 Product Workspace ID；main process 从 fresh Desktop Store 校验该 ID并生成规范化的全部关联项目根，Provider plan 展示 project roots、skill/shared asset/loader targets。无项目仍执行 global resource-only check，task preflight 继续使用同一项目集合并 fail-closed。",
        "reason": "实现接线、受信上下文解析、项目路径变化验证、UI plan 投影、聚焦回归和全量检查共同覆盖了 completion review 指出的遗漏；fresh Project revision 155 未产生反证。",
        "evidence": [
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:3",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:22",
          "runtime/arcorbit/desktop/preload.cjs:5",
          "runtime/arcorbit/desktop/main.mjs:79",
          "runtime/arcorbit/desktop/main.mjs:230",
          "runtime/arcorbit/desktop/renderer/renderer.js:153",
          "runtime/arcorbit/desktop/renderer/renderer.js:278",
          "runtime/arcorbit/desktop/renderer/renderer.js:413",
          "runtime/arcorbit/desktop/renderer/renderer.js:1455",
          "runtime/arcorbit/desktop/renderer/renderer.js:2018",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:349",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:375",
          "Focused manager/automation/Desktop tests: 54 passed, 0 failed",
          "ArcOrbit npm run check: 235 passed, 2 environment-gated skips, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-21T17:17:17.969Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-21T15:44:07.092Z"
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
          "REVIEW-001"
        ],
        "evidence": [
          "ArcForge Provider implementation and migration evidence accepted at content revision 4",
          "runtime/arcorbit/desktop/preload.cjs:5",
          "runtime/arcorbit/desktop/renderer/renderer.js:153",
          "runtime/arcorbit/desktop/renderer/renderer.js:157",
          "runtime/arcorbit/desktop/main.mjs:78",
          "runtime/arcorbit/desktop/main.mjs:229",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:305",
          "Focused completion review tests: 52 passed, 0 failed"
        ],
        "occurred_at": "2026-08-21T17:08:58.178Z"
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
          "Direct review of runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "Direct review of runtime/arcorbit/desktop/main.mjs Setup IPC and task preflight wiring",
          "Direct review of runtime/arcorbit/desktop/preload.cjs bounded API",
          "Direct review of runtime/arcorbit/desktop/renderer/renderer.js retry, project-selection, first-binding and plan rendering paths",
          "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop resolves project-scoped Setup checks from the trusted local workspace store",
          "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop Setup IPC behavior preserves global checks and sends fresh associated roots",
          "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 54 passed, 0 failed",
          "npm run check: 235 passed, 2 environment-gated skips, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-21T17:20:24.499Z"
      }
    ],
    "evidence": [
      "ArcForge Provider implementation and migration evidence accepted at content revision 4",
      "runtime/arcorbit/desktop/preload.cjs:5",
      "runtime/arcorbit/desktop/renderer/renderer.js:153",
      "runtime/arcorbit/desktop/renderer/renderer.js:157",
      "runtime/arcorbit/desktop/main.mjs:78",
      "runtime/arcorbit/desktop/main.mjs:229",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:305",
      "Focused completion review tests: 52 passed, 0 failed",
      "Direct review of runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
      "Direct review of runtime/arcorbit/desktop/main.mjs Setup IPC and task preflight wiring",
      "Direct review of runtime/arcorbit/desktop/preload.cjs bounded API",
      "Direct review of runtime/arcorbit/desktop/renderer/renderer.js retry, project-selection, first-binding and plan rendering paths",
      "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop resolves project-scoped Setup checks from the trusted local workspace store",
      "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop Setup IPC behavior preserves global checks and sends fresh associated roots",
      "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 54 passed, 0 failed",
      "npm run check: 235 passed, 2 environment-gated skips, 0 failed",
      "git diff --check: passed"
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
      "goal": "把操作者确认的项目级安装方向沉淀为完整、无歧义且相互一致的产品、Setup Readiness 交互和安装供应链技术契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Gap 是唯一 ready 的 Case Gap，直接决定当前用户事项后续实现、迁移和验收边界，阻塞程度和用户影响高于四个通用 Project Gap。",
        "snapshot_token": "cee93e66deb8a0d257b8020c631e8a6dfda7be12fee235fcbbf5aa99fd11fc21",
        "selected_ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-contract",
        "comparison_summary": "已重新比较 fresh snapshot catalog 中全部五个 persisted candidates。当前 Case Gap selected；四个 Project Gap 均需另建 Case，且不直接解决当前安装范围冲突，因此 deferred。",
        "fresh_discovery_summary": "未发现改变本轮契约验收主张的 fresh candidate；契约完成后暴露的实现义务仅写为下一轮 open Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前项目级 provisioning 契约。",
              "uncertainty": "动态 Gap 场景仍需独立验证。",
              "risk": "高，但属于通用 Agent 场景验证。",
              "user_impact": "对当前用户需求仅有间接影响。"
            },
            "reason": "需独立 Case，且不建立本次安装目标和迁移边界。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前契约维护。",
              "uncertainty": "Runtime 韧性和 adapter 验收仍待处理。",
              "risk": "高。",
              "user_impact": "与当前 skill 安装位置没有直接因果关系。"
            },
            "reason": "属于长运行韧性与 adapter 边界，不应吞并当前 provisioning 事项。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前契约。",
              "uncertainty": "真实权限项目证据仍缺失。",
              "risk": "高。",
              "user_impact": "当前未要求真实受控资源验证。"
            },
            "reason": "需具备真实权限资源的独立项目，不是本轮稳定安装契约。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前产品契约。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "不直接修复用户级 skill 安装行为。"
            },
            "reason": "这是 ledger 跨记录审计事项，应保持独立。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "它决定后续实现、迁移和测试的准确范围。",
              "uncertainty": "项目绑定目标已存在，但受影响 modes、on-demand loader/catalog 和历史副本迁移语义尚未形成 durable contract。",
              "risk": "直接改变用户文件写入位置和既有受管理关系，错误处理可能遗留重复 skill 或误删无关内容。",
              "user_impact": "当前用户级安装行为与操作者要求直接冲突。"
            },
            "reason": "唯一 ready 且直接服务当前用户意图的 Case Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-project-local-skill-provisioning-contract",
        "responsibility": "agent",
        "goal": "建立 ArcOrbit 内置 Arckit skills 的项目级 provisioning 与迁移契约，明确受影响的 skill modes、关联项目目标目录、触发时机、用户级 catalog/loader 边界，以及历史受管理用户级副本的安全处置。",
        "reason": "后续代码对象、Provider 输入、Setup Readiness 状态、升级迁移和验收测试都会随这些边界变化；当前稳定规格仍规定用户级安装，且实现尚未接入 projectTargetDirs，因此必须先接受这一前置契约。",
        "derived_from": [
          "FACT-001",
          "FACT-002",
          "IMPACT-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "它决定后续实现、迁移和测试的准确范围。",
          "uncertainty": "项目绑定目标已存在，但受影响 modes、on-demand loader/catalog 和历史副本迁移语义尚未形成 durable contract。",
          "risk": "直接改变用户文件写入位置和既有受管理关系，错误处理可能遗留重复 skill 或误删无关内容。",
          "user_impact": "当前用户级安装行为与操作者要求直接冲突。"
        },
        "evidence_required": [
          "更新后的稳定产品规格明确只向 ArcOrbit 关联本地项目安装",
          "技术契约明确 projectTargetDirs、关系记录归属、Setup Readiness 与项目绑定的衔接",
          "明确 user-ambient、user-on-demand、project-ambient、loader、catalog 和 shared assets 的目标规则",
          "明确历史受管理用户级副本的可见、需确认、可恢复迁移规则，并保留 unrelated/uncertain 内容"
        ]
      },
      "planned_transition": {
        "goal": "把操作者确认的项目级安装方向沉淀为完整、无歧义且相互一致的产品、Setup Readiness 交互和安装供应链技术契约。",
        "expected_state_change": "当前 Gap 被稳定文档证据解决；delivery、interaction、data 和 technical Project decisions 获得新的项目级 provisioning 结论；尚未实现的现实差距作为独立 open Gap 保留。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-project-local-skill-provisioning-contract",
          "status": "resolved",
          "outcome": "ArcOrbit 内置 Arckit skills 的项目目标、availability 解释、Setup Readiness 触发、catalog/loader 边界、关系归属和旧用户级 managed target 迁移规则已形成稳定契约。",
          "reason": "产品规格、页面级交互源与线框、技术供应链方案和索引投影已一致更新并通过差异与结构校验。",
          "evidence": [
            "arckit/spec/arcorbit-distribution.md:88",
            "arckit/spec/arcorbit-distribution.md:114",
            "arckit/spec/arcorbit-distribution.md:128",
            "arckit/spec/arcorbit-distribution.md:146",
            "arckit/interaction/setup-readiness/interaction.md:5",
            "arckit/interaction/setup-readiness/interaction.md:26",
            "arckit/interaction/setup-readiness/default.html:35",
            "arckit/tech/arcorbit/installer-supply-chain.md:115",
            "arckit/tech/arcorbit/installer-supply-chain.md:175",
            "arckit/tech/arcorbit/installer-supply-chain.md:278",
            "git diff --check"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 的锁定 Arckit payload 继续作为 userData 中的维护源，但全局 Setup Readiness 不生成 Agent apply plan；Product Workspace 提供的规范化本地项目根是唯一 Codex 消费目标。source user-ambient 在每个关联项目中解释为默认常驻，project-ambient 经过项目适用性判断，user-on-demand catalog 保持非 Codex 发现的控制面且 loader 只安装到项目，shared assets 只随项目消费 skill 写入；ArcOrbit 不向 Codex 用户级目录安装 bundled skill、shared asset 或 loader。",
            "basis": "操作者方向已通过产品、交互和技术事实源形成一致、可恢复的稳定契约。",
            "evidence": [
              "Current operator input, 2026-08-21",
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/spec/arcorbit-distribution.md:114",
              "arckit/spec/arcorbit-distribution.md:128",
              "arckit/interaction/setup-readiness/interaction.md:17",
              "arckit/tech/arcorbit/installer-supply-chain.md:115",
              "arckit/tech/arcorbit/installer-supply-chain.md:175"
            ]
          },
          {
            "id": "FACT-004",
            "revision": 1,
            "status": "accepted",
            "statement": "旧版 ArcOrbit 关系能够证明所有权的 Codex 用户级 skills 和 loader 只在明确项目 target、旧目标、备份和逐目标 disposition 可见并经确认后迁移；内容变化先备份，用户选择保留时不删除且项目不能进入 scope-clean ready；uncertain、unrelated 或没有关系所有权证据的目录永不自动删除，解除项目绑定也不隐式清理项目目录。",
            "basis": "ArcForge 关系所有权与 destructive-action 边界已被稳定产品、交互和技术契约共同采用。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:146",
              "arckit/spec/arcorbit-distribution.md:158",
              "arckit/interaction/setup-readiness/interaction.md:28",
              "arckit/interaction/setup-readiness/interaction.md:71",
              "arckit/tech/arcorbit/installer-supply-chain.md:299",
              "arckit/tech/arcorbit/installer-supply-chain.md:319"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "Setup Readiness 的全局检查、项目绑定门禁、项目 plan、迁移确认和恢复路径已成为可恢复交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "id": "IMPACT-003",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 23
            },
            "effect": "upheld",
            "reason": "provider projectTargetDirs、调用级 availability override、项目 relation、catalog/loader 和 Runtime preflight 边界已形成技术方案。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-004",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "维护源、ArcForge catalog、ArcOrbit consumer relation 和逐项目 target 的所有权与存储关系已经明确。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:128",
              "arckit/tech/arcorbit/installer-supply-chain.md:146",
              "arckit/tech/arcorbit/installer-supply-chain.md:166"
            ]
          },
          {
            "id": "IMPACT-005",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "现有 SkillProvisioningManager 仍未传入 projectTargetDirs，并仍以用户级目标生成 plan，实际软件尚未兑现新契约。",
            "gap_ids": [
              "GAP-project-local-skill-provisioning-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:302",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:400",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27"
            ]
          },
          {
            "id": "IMPACT-006",
            "fact_id": "FACT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "安全迁移规则已定义，但尚无实现与自动化证据证明 managed 用户目标、内容备份、unknown preservation 和事务回滚真实成立。",
            "gap_ids": [
              "GAP-project-local-skill-provisioning-implementation"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:158",
              "arckit/tech/arcorbit/installer-supply-chain.md:303"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "新的 delivery 契约已明确 ArcOrbit 只向关联项目提供 Codex-discoverable skills，并定义旧用户级 managed target 的安全迁移。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-project-local-skill-provisioning-implementation",
            "status": "open",
            "goal": "实现并验证 ArcOrbit 项目级 skill provisioning，使 Product Workspace 关联项目成为唯一 Codex 消费目标，并按已接受契约完成用户级 managed target 迁移。",
            "reason": "稳定契约已经成立，但当前 SkillProvisioningManager、Setup Readiness 投影和测试仍实现用户级 provisioning，尚不能证明实际软件符合 FACT-003 与 FACT-004。",
            "derived_from": [
              "FACT-002",
              "FACT-003",
              "FACT-004",
              "IMPACT-005",
              "IMPACT-006"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "实际软件仍违反操作者要求，Runtime task 也没有项目级 readiness gate。",
              "uncertainty": "需要验证当前 embedded provider 对项目 loader、调用级 override 和用户目标迁移的真实能力。",
              "risk": "涉及跨多个项目、历史用户级副本、关系迁移和事务回滚。",
              "user_impact": "在实现完成前，ArcOrbit 仍可能继续向 Codex 用户级目录安装 skills。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "SkillProvisioningManager 只为明确 Product Workspace 根生成 projectTargetDirs plan，缺少项目时不回退用户级目标",
              "source user-ambient、project-ambient、user-on-demand catalog、项目 loader 和 shared assets 按契约投影到正确目标",
              "旧用户级 managed skills/loader 的 ownership classification、备份、迁移、保留阻断和 unrelated preservation 可重复验证",
              "Desktop Setup Readiness 与 task preflight 使用逐项目 ready 状态并展示真实 provider targets",
              "自动化测试覆盖 clean project install、多项目关系、项目路径变化、无项目、用户级迁移、冲突、回滚、drift 与 Codex project discoverability"
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
            "area_ref": "experience_and_interaction",
            "observed_revision": 25,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit uses three primary navigation groups: Personal contains Today and Chat; Product Lifecycle contains Idea, Work, Automation, Release, Operations and Feedback; Organization contains Organization and Engineering. English UI consistently uses Release and Operations, while Chinese descriptions use 发布 and 运营. Existing Workset, Work, Automation, Feedback, Organization, account, product-feedback and execution semantics remain authoritative. The five new pages are independent planning presentations built from current project facts. Engineering is a Domain Profile management preview with a Profile Library, draft metadata, State Model editor, Capability Mapping, Lifecycle Mapping, cross-industry change preview and Review & Apply confirmation. Profile changes replace domain State semantics and skills together while the shared Loop Kernel and Idea-to-Feedback lifecycle remain stable; all controls are non-persistent demonstrations. Setup Readiness separates global resource readiness from per-Product Workspace project readiness: binding or task start opens a project-scoped plan, all Codex-discoverable bundled skills and loaders target that project, legacy managed user targets receive visible backup/migration dispositions, and no user-level Codex target is offered.",
              "reason": "The operator requires ArcOrbit bundled skills to be discoverable only within associated local projects, which changes the Setup Readiness main path, decisions and recovery states.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if project binding ownership, Codex project discovery, on-demand loading, or migration confirmation behavior changes."
            },
            "gap_refs": [],
            "reason": "Project-scoped provisioning materially changes the durable Setup Readiness journey and recovery semantics.",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. 产品反馈 Project ID 107 和项目专用 API Key 都是 ArcOrbit 产品代码常量并进入打包产物，不写入 userData；未读数量是运行期瞬时 UI 状态，反馈正文、消息和状态仍由 Feedback 平台拥有。ArcOrbit also owns the locked bundled-skill source store and consumer identity; ArcForge relation state records one effective project target set per normalized local project root, while the user catalog remains a non-Codex-discovery control-plane store rather than an Agent installation target.",
              "reason": "Project-only skill consumption requires explicit ownership of source, catalog, relation and per-project target state without moving canonical Project/Case state out of repositories.",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when relation ownership, catalog scope, project-root identity or target cleanup lifecycle changes."
            },
            "gap_refs": [],
            "reason": "The accepted contract clarifies which provisioning state ArcOrbit owns and which directory is only a project consumption target.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:128",
              "arckit/tech/arcorbit/installer-supply-chain.md:146"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 22,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes existing Workshop services without requiring backend changes: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。产品反馈 SDK 文档身份由固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 共同确定；已配置文档在 submit/status 路由和未读刷新期间不执行 loadURL 或重复 configure，配置/身份变化、无效文档与显式 retry 才重新加载固定入口。Skill provisioning separates a global bundle/provider/Codex check from per-Product Workspace readiness. The main-process manager passes non-empty projectTargetDirs, project assessments and an ArcOrbit project-only availability override to the embedded provider; bundled skills, shared assets and the on-demand loader target only the normalized project root, while the ArcForge catalog and relation state remain control-plane data. Legacy managed user targets migrate transactionally with ownership evidence, explicit dispositions and rollback; Runtime preflight remains policy-neutral and only consumes the resulting per-project readiness.",
              "reason": "The operator changed the Agent consumption boundary from Codex user scope to explicit Product Workspace project scope while preserving ArcForge Core/provider ownership of planning and migration semantics.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/arcorbit-distribution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the embedded provider target contract, Project Workspace identity, project loader behavior or Runtime preflight boundary changes."
            },
            "gap_refs": [],
            "reason": "The accepted contract establishes a new material provider target, readiness and migration architecture.",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and ArcOrbit applies its locked payload only to normalized local project roots explicitly associated through Product Workspaces; it does not install bundled skills, shared assets or loaders into the Codex user-level skill directory. Source availability recommendations remain generic, while ArcOrbit uses a project-only invocation policy, per-project relations and confirmed migration of legacy managed user targets. Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows.",
              "reason": "The operator explicitly replaced user-level ArcOrbit skill installation with project-associated local installation while preserving the governed installer and supply-chain boundaries.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if ArcOrbit supports another Agent, remote project targets, project-on-demand storage, or a different legacy migration policy."
            },
            "gap_refs": [],
            "reason": "The current delivery decision was threatened by the operator change and is now settled with a project-only consumption contract.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
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
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/spec/INDEX.md",
          "arckit/interaction/INDEX.md",
          "arckit/tech/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 152,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目级目标、availability 解释、首次绑定、升级迁移、解绑和验收口径已写入稳定产品规格及其索引关系。",
            "fact_refs": [
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/spec/_map/feature-matrix.md",
              "arckit/spec/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness 的交互源、状态流、决策点、恢复路径和灰度线框均表达全局检查、项目计划与用户级迁移。",
            "fact_refs": [
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮改变的是 Setup Readiness 的任务、状态和文案，没有建立或修改视觉 token、主题、品牌或组件视觉规则；线框继续使用既有灰度样式且未加入内联颜色。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "维护源、projectTargetDirs、调用级策略覆盖、逐项目 relation、catalog/loader 边界、迁移事务、preflight 和验证责任已形成完整技术方案。",
            "fact_refs": [
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/INDEX.md",
              "arckit/tech/_map/feature-matrix.md",
              "arckit/tech/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "稳定契约已经成立，但当前 SkillProvisioningManager 仍缺少 projectTargetDirs 并继续生成用户级目标；实现和现有测试尚未兑现 FACT-003。",
            "fact_refs": [
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:302",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:400",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "关系所有权、备份、未知目录保护和事务回滚规则已有稳定契约，但尚无实现与自动化验证支持这些风险控制主张。",
            "fact_refs": [
              "FACT-002",
              "FACT-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:158",
              "arckit/tech/arcorbit/installer-supply-chain.md:303"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-21",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "git diff --check",
        "INDEX line-count verification: spec 193, interaction HTML 91, interaction document 165, tech 358",
        "Wireframe check: no inline style or hexadecimal color added"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-154146210Z",
      "occurred_at": "2026-08-21T15:59:52.216Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "核验并接受操作者提供的 ArcForge Provider 跨仓库执行授权。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "操作者输入“授权”是当前最高权威增量。Agent 本轮可以完成对其语境、路径和操作范围的核验并形成 accepted fact；按分轮规则不能在同轮消费该事实执行下游实现。",
        "snapshot_token": "0e78182104be395dc18b2bed8d383a9b1a19a4dab7b3691f58a6780a406c2a96",
        "selected_ref": "fresh-gap:CASE-20260821-001:GAP-accept-arcforge-provider-authorization",
        "comparison_summary": "已比较五个 persisted candidates 与一个 fresh candidate。四个 Project Gap 均需独立 Case；implementation Gap 必须等待授权事实被接受后再 fresh-read；Agent-owned 授权核验是当前最小且最高阻塞的可完成推进。",
        "fresh_discovery_summary": "当前操作者输入形成了一个 Agent 可在本轮完成的 fresh Gap：核验“授权”是否对应此前明确列出的 ArcForge 仓库、Provider 重建、测试和 artifact 锁定范围，并将结论提交为 accepted fact。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞授权核验。",
              "uncertainty": "仍需独立场景证据。",
              "risk": "高。",
              "user_impact": "对当前事项为间接影响。"
            },
            "reason": "需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞授权核验。",
              "uncertainty": "Runtime 韧性工作仍待处理。",
              "risk": "高。",
              "user_impact": "与安装目标无直接因果关系。"
            },
            "reason": "需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞授权核验。",
              "uncertainty": "真实权限环境仍待验证。",
              "risk": "高。",
              "user_impact": "不直接解除当前实现边界。"
            },
            "reason": "需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞授权核验。",
              "uncertainty": "跨记录审计仍待真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前事项为间接影响。"
            },
            "reason": "需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "直接阻塞最终结果。",
              "uncertainty": "具体跨仓库实施需等待授权事实写回。",
              "risk": "涉及用户目录、项目关系与迁移回滚。",
              "user_impact": "未完成前仍可能写入用户级目录。"
            },
            "reason": "不能在同轮消费尚未接受的授权事实。"
          },
          {
            "ref": "fresh-gap:CASE-20260821-001:GAP-accept-arcforge-provider-authorization",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "解除权威 Provider 跨仓库修改的事实前置条件。",
              "uncertainty": "需要确认简短回复“授权”的具体指代范围。",
              "risk": "避免越权或误解授权边界。",
              "user_impact": "直接决定下一轮能否继续实施。"
            },
            "reason": "Agent 可依据当前输入和紧邻 handoff 在本轮完成语境核验并提交单一授权事实。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-accept-arcforge-provider-authorization",
        "responsibility": "agent",
        "goal": "核验操作者回复“授权”的具体语境，并接受其对 ArcForge Provider 仓库修改、重建、测试和 ArcOrbit artifact 锁定范围的授权事实。",
        "reason": "下游跨仓库实现必须建立在明确、可恢复的授权事实之上。",
        "derived_from": [
          "FACT-001",
          "FACT-003",
          "FACT-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "授权事实未接受前不能安全推进权威 Provider 修改。",
          "uncertainty": "需把简短回复与此前明确请求的路径和动作绑定。",
          "risk": "防止跨工作区越权。",
          "user_impact": "解除项目级安装实现的执行阻塞。"
        },
        "evidence_required": [
          "当前操作者输入“授权”",
          "此前 handoff 明确列出的 ArcForge 仓库路径及 Provider 修改、重建、测试、artifact 锁定范围"
        ]
      },
      "planned_transition": {
        "goal": "核验并接受操作者提供的 ArcForge Provider 跨仓库执行授权。",
        "expected_state_change": "新增授权 accepted fact 并解决本轮 Agent-owned fresh Gap；不执行依赖该事实的实现。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-accept-arcforge-provider-authorization",
          "status": "resolved",
          "outcome": "已确认操作者授权修改相邻 ArcForge 权威 Provider 仓库，并允许重建、测试及更新 ArcOrbit 锁定使用的 Provider artifact。",
          "reason": "“授权”紧邻并直接回应此前包含唯一具体路径和操作范围的授权请求，没有其他竞争指代。",
          "evidence": [
            "Current operator input: 授权",
            "Previous handoff: authorize /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge modification, Provider rebuild/testing and ArcOrbit artifact locking"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-005",
            "revision": 1,
            "status": "accepted",
            "statement": "操作者明确授权修改 /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge 中的权威 ArcForge Provider，并允许重建、测试以及更新 ArcOrbit 锁定使用的 Provider artifact。",
            "basis": "当前操作者输入“授权”直接回应此前列明路径和操作范围的唯一授权请求。",
            "evidence": [
              "Current operator input, 2026-08-21: 授权",
              "Previous handoff explicitly requested ArcForge repository modification, Provider rebuild, testing and ArcOrbit artifact locking"
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
        "evidence": [
          "授权改变可执行范围，不改变既有 Project 软件定义。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 153,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "授权核验不改变产品结果、能力、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "授权核验不改变 Setup Readiness 的用户动作、状态、反馈或恢复语义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "授权核验不涉及视觉语言或呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "授权仅扩大执行范围，不建立、修订或否定技术决策。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "授权已核验，但当前实现尚未改变，FACT-003 的项目专属消费目标仍未兑现。",
            "fact_refs": [
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:302",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:400"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "授权不构成迁移安全证据；备份、所有权分类、未知内容保护和回滚仍需实现验证。",
            "fact_refs": [
              "FACT-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:299",
              "arckit/tech/arcorbit/installer-supply-chain.md:319"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-21: 授权",
        "Previous handoff authorization scope: /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge; Provider rebuild, test and ArcOrbit artifact lock"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T16:40:53.430Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "读取并交叉核验 ArcForge 权威 Provider源码、availability resolver、Provider测试与 ArcOrbit锁定 manifest，接受当前项目专属能力边界事实。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "当前 persisted implementation Gap 明确包含对 embedded Provider 项目 loader、调用级覆盖和用户目标迁移能力的验证。权威源码的不同结论会改变下游修改对象、artifact 范围和验收方式，因此先选择并完成 Agent-owned Provider 能力边界核验 Gap。",
        "snapshot_token": "3add493f25c895aa6e602cac98994a4ddfc1c2a1c73c232320792fd26a6c8bc5",
        "selected_ref": "fresh-gap:CASE-20260821-001:GAP-verify-arcforge-project-only-provider-capability",
        "comparison_summary": "比较了 snapshot 中全部五个 persisted candidates 和本轮实际发现的一个 fresh candidate。四个 Project Gap 均需独立 Case且不直接阻止用户级 skill 写入；当前 Case implementation Gap 最相关，但其权威实现对象仍取决于 Provider 能力核验结果。fresh Provider 核验 Gap 可在本轮完成并直接消除这一不确定性，因此优先选择。",
        "fresh_discovery_summary": "读取 ArcForge 权威 Provider、availability resolver、Provider 测试及 ArcOrbit 锁定 manifest 后，发现当前 Provider 只把 project-ambient 投影到 projectTargetDirs；user-ambient、shared assets 和 on-demand loader 仍可进入 Codex 用户目录，且 manifest 没有项目专属 provisioning capability。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前项目级 provisioning 实现。",
              "uncertainty": "动态场景验证仍需独立真实软件证据。",
              "risk": "高，但属于通用 Agent 选择验证。",
              "user_impact": "与停止用户级 skill 写入仅间接相关。"
            },
            "reason": "需要独立 Case，且当前用户影响低于 Provider 能力边界。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 skill 目标调整。",
              "uncertainty": "Runtime 韧性和 adapter 验收仍待推进。",
              "risk": "高。",
              "user_impact": "不直接改变 skill 安装目录。"
            },
            "reason": "范围不同且需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Provider 核验。",
              "uncertainty": "真实权限项目验证仍缺证据。",
              "risk": "高。",
              "user_impact": "不能直接阻止用户级 skill 写入。"
            },
            "reason": "需要独立 Case和真实受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Provider 核验。",
              "uncertainty": "跨记录一致性仍需真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前 provisioning 只有间接影响。"
            },
            "reason": "需要独立 Case，不能替代实现前置事实核验。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "直接阻塞最终用户结果。",
              "uncertainty": "其修改对象、artifact 范围和测试边界取决于当前 Provider 是否已有项目专属能力。",
              "risk": "涉及跨仓库 Provider、历史用户目标、关系和回滚。",
              "user_impact": "未完成前仍可能向用户目录写入 skills。"
            },
            "reason": "Provider 能力边界是尚未接受且会改变该实现 Gap 范围的前置事实，必须先独立验收。"
          },
          {
            "ref": "fresh-gap:CASE-20260821-001:GAP-verify-arcforge-project-only-provider-capability",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "决定后续应只改 ArcOrbit 接线，还是同时改权威 ArcForge Provider并重建 artifact。",
              "uncertainty": "canonical Case 明确要求验证 project loader、override 和迁移能力。",
              "risk": "误判会在 Runtime 复制 Provider 算法或继续产生用户级目标。",
              "user_impact": "直接决定如何可靠停止用户级 skill 安装。"
            },
            "reason": "这是 Agent-owned、无未闭合依赖且可由现有权威源码和测试在本轮完成的最小前置核验。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-verify-arcforge-project-only-provider-capability",
        "responsibility": "agent",
        "goal": "核验权威 ArcForge embedded Provider 是否已经支持 ArcOrbit 所需的项目专属 skill、shared asset、on-demand loader 和历史用户目标迁移语义。",
        "reason": "implementation Gap 的修改对象和验收范围取决于 Provider 现有能力，且该事实尚未进入 canonical Case。",
        "derived_from": [
          "FACT-002",
          "FACT-003",
          "FACT-004",
          "FACT-005",
          "GAP-project-local-skill-provisioning-implementation"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "决定后续实现是否必须修改、重建并重新锁定权威 Provider artifact。",
          "uncertainty": "projectTargetDirs 已存在，但各种 availability mode、loader 和 capability manifest 的实际行为尚未形成 accepted fact。",
          "risk": "错误地只改 ArcOrbit 会保留用户级目标；在 Runtime 重写算法又会违反 Provider 所有权边界。",
          "user_impact": "项目级安装目标无法在该边界明确前可信实现。"
        },
        "evidence_required": [
          "权威 ArcForge Provider 输入与 capability manifest",
          "availability resolver 对 user-ambient、project-ambient、user-on-demand、shared assets 和 loader 的实际目标规则",
          "Provider 自动化测试对当前目标位置的断言",
          "ArcOrbit 锁定 Provider manifest 的 capability 集合"
        ]
      },
      "planned_transition": {
        "goal": "读取并交叉核验 ArcForge 权威 Provider源码、availability resolver、Provider测试与 ArcOrbit锁定 manifest，接受当前项目专属能力边界事实。",
        "expected_state_change": "新增 Provider 当前能力限制事实和 realization impact；保留 implementation Gap，等待 transition 接受后的 fresh-read 再实施下游改造。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-verify-arcforge-project-only-provider-capability",
          "status": "resolved",
          "outcome": "已确认当前 ArcForge Provider 接受 projectTargetDirs，但只将 project-ambient skill 投影到项目；user-ambient skill 仍投影到 homeDir 下的用户级 Agent 目录，user-on-demand catalog 保持 stateRoot 控制面而 loader 仍投影到用户级 Agent 目录，shared assets 跟随现有 ambient 目标。Provider 与 ArcOrbit 锁定 manifest 均未声明项目专属 provisioning capability。",
          "reason": "权威 resolver、Provider公开能力、自动化测试和 ArcOrbit锁定 artifact manifest 给出一致证据。",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:143",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:195",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:200",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:211",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:394",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:70",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:76",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:96",
            "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:1"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-006",
            "revision": 1,
            "status": "accepted",
            "statement": "当前权威 ArcForge embedded Provider 已接受 projectTargetDirs、availabilityOverrides 和 projectAssessments，但其通用 resolver 仍把 user-ambient skill 写入 homeDir 下的用户级 Agent 目录，只把 project-ambient 写入项目目录；user-on-demand catalog 位于 Provider stateRoot 控制面，而 arcforge-on-demand loader 仍固定写入用户级 Agent 目录，shared assets 跟随这些现有 ambient 目标。Provider 能力集合及 ArcOrbit 锁定 manifest 均未声明能把全部 Codex 消费副本强制限定到项目的 capability，因此兑现 FACT-003 必须修改权威 Provider并重建、测试和更新 ArcOrbit 锁定 artifact，不能只在 Runtime 复制目标算法。",
            "basis": "ArcForge 权威源码、Provider 测试和 ArcOrbit 锁定 manifest 的直接交叉核验。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:195",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:211",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:70",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:76",
              "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:4"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-007",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "ArcOrbit 所需的 project-only Provider policy尚未存在于权威 Provider或锁定 artifact，当前实际软件不能仅靠传入 projectTargetDirs 兑现 FACT-003。",
            "gap_ids": [
              "GAP-project-local-skill-provisioning-implementation"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28",
              "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:4"
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
        "evidence": [
          "该核验明确实际实现缺口，但不改变已经接受的项目专属产品、交互、技术和交付决策。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 153,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Provider 当前能力限制不建立、修改或否定项目专属安装的长期产品期望；它暴露的是实际实现尚未兑现。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮没有改变 Setup Readiness 的动作、状态、反馈、确认或恢复语义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Provider 能力核验不涉及视觉语言、token、主题、布局或组件呈现。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "稳定技术契约已明确 ArcForge Core/Provider拥有目标投影、catalog/loader和迁移算法，Runtime只传入项目目标和调用策略；本轮证据进一步确认下游应修改权威 Provider而非在 Runtime复制算法。",
            "fact_refs": [
              "FACT-003",
              "FACT-005",
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "当前 ArcOrbit manager 尚未传入项目目标，且权威 Provider即使收到 projectTargetDirs也仍把 user-ambient和 loader投影到用户目录；FACT-003尚未由实际软件实现。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-006"
            ],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:302",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:400",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:416"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Provider已有关系、冲突和恢复原语，但尚无项目专属目标 capability及对应迁移自动化证据，FACT-004要求的旧用户目标备份、保留阻断、unknown保护和事务回滚仍未被完整证明。",
            "fact_refs": [
              "FACT-004",
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:299",
              "arckit/tech/arcorbit/installer-supply-chain.md:319",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs"
            ],
            "gap_refs": [
              "GAP-project-local-skill-provisioning-implementation"
            ]
          }
        ]
      },
      "evidence": [
        "ArcForge authority: /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge",
        "ArcForge source is clean at inspection: git -C /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge status --short returned no entries",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:143-242",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:258-333",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:394-441",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:28-29",
        "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:51-110",
        "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:1-13"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T16:44:34.006Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "接受已完成的权威 ArcForge Provider、ArcOrbit 项目专属 provisioning、安全迁移、逐项目 readiness 和锁定 artifact 验证结果。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "fresh snapshot 显示两个 ready Case Gap。CASE-20260821-001 的实现工作已在被拒 transition 前完成且其 canonical Gap、facts、impacts 与 Case revision 均保持当前；拒绝仅源于并发 CASE-20260821-002 使 selection token 和 Project revision 更新。根据 repair contract，应保留仍然成立的验收主张，不重复实现，也不丢弃已完成证据。",
        "snapshot_token": "99e48b8ede7cfbb1682796cec37facee6d8e8cf2fce00fd3d7f4500f62a9f76d",
        "selected_ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-implementation",
        "comparison_summary": "比较了六个 persisted candidates。四个 Project Gap 仍需独立 Case；CASE-20260821-002 的可靠实时契约 Gap 属于并发独立事项，且其 fresh selection token 与当前 Case 分离。CASE-20260821-001 的 implementation Gap 仍为 ready，相关实现已经完成但尚未被 ledger 接受，因此继续选择它以记录真实软件状态。",
        "fresh_discovery_summary": "fresh state 新增了并发 CASE-20260821-002 及其 ready Gap，但没有发现会否定或改变本轮已完成 provisioning 实现、证据范围或验收语义的新事实。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已完成实现的 ledger 验收。",
              "uncertainty": "动态 Gap 场景仍需独立验证。",
              "risk": "高，但属于通用 Agent 行为风险。",
              "user_impact": "与停止用户级 skill 安装仅间接相关。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 provisioning 验收。",
              "uncertainty": "Runtime 韧性工作仍待独立界定。",
              "risk": "高。",
              "user_impact": "与 skill 目标位置没有直接因果关系。"
            },
            "reason": "范围不同且需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现与受控 fixture 验证。",
              "uncertainty": "真实权限资源验证仍待完成。",
              "risk": "高。",
              "user_impact": "不直接停止用户级 skill 写入。"
            },
            "reason": "需要独立 Case 和受控真实资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现验收。",
              "uncertainty": "跨记录一致性仍需真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前 provisioning 仅间接相关。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:GAP-project-local-skill-provisioning-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "实现已经完成但 canonical Case 仍将其及三个 impacts 记录为未完成。",
              "uncertainty": "FACT-006、授权事实、实现和验证证据均已成立。",
              "risk": "涉及多项目目标、旧用户副本、备份和事务回滚。",
              "user_impact": "接受后 Case 才能如实记录 ArcOrbit 已停止用户级 bundled skill、asset 和 loader provisioning。"
            },
            "reason": "Gap 身份和 Case revision 仍为当前，完成证据未被并发 Case 否定；这是 stale-token repair 中必须保留的验收主张。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞实时同步 Case 的后续实现，但不改变 CASE-20260821-001 的已完成 provisioning 状态。",
              "uncertainty": "可靠事件流契约仍待建立。",
              "risk": "高，涉及漏任务、重复调度、权限撤销和人工 gate。",
              "user_impact": "影响实时任务发现与恢复体验。"
            },
            "reason": "这是并发独立 Case；当前 repair 必须先处理已执行但因 stale token 未被接受的 CASE-20260821-001 transition。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-project-local-skill-provisioning-implementation",
        "responsibility": "agent",
        "goal": "实现并验证 ArcOrbit 项目级 skill provisioning，使 Product Workspace 关联项目成为唯一 Codex 消费目标，并按已接受契约完成用户级 managed target 迁移。",
        "reason": "稳定契约已经成立，但当前 SkillProvisioningManager、Setup Readiness 投影和测试仍实现用户级 provisioning，尚不能证明实际软件符合 FACT-003 与 FACT-004。",
        "derived_from": [
          "FACT-002",
          "FACT-003",
          "FACT-004",
          "IMPACT-005",
          "IMPACT-006"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "实际软件仍违反操作者要求，Runtime task 也没有项目级 readiness gate。",
          "uncertainty": "需要验证当前 embedded provider 对项目 loader、调用级 override 和用户目标迁移的真实能力。",
          "risk": "涉及跨多个项目、历史用户级副本、关系迁移和事务回滚。",
          "user_impact": "在实现完成前，ArcOrbit 仍可能继续向 Codex 用户级目录安装 skills。"
        },
        "evidence_required": [
          "SkillProvisioningManager 只为明确 Product Workspace 根生成 projectTargetDirs plan，缺少项目时不回退用户级目标",
          "source user-ambient、project-ambient、user-on-demand catalog、项目 loader 和 shared assets 按契约投影到正确目标",
          "旧用户级 managed skills/loader 的 ownership classification、备份、迁移、保留阻断和 unrelated preservation 可重复验证",
          "Desktop Setup Readiness 与 task preflight 使用逐项目 ready 状态并展示真实 provider targets",
          "自动化测试覆盖 clean project install、多项目关系、项目路径变化、无项目、用户级迁移、冲突、回滚、drift 与 Codex project discoverability"
        ]
      },
      "planned_transition": {
        "goal": "接受已完成的权威 ArcForge Provider、ArcOrbit 项目专属 provisioning、安全迁移、逐项目 readiness 和锁定 artifact 验证结果。",
        "expected_state_change": "解决 implementation Gap，将 IMPACT-005、IMPACT-006、IMPACT-007 更新为 upheld；不修改并发 CASE-20260821-002 或 Project revision 154 的实时同步推进内容。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-project-local-skill-provisioning-implementation",
          "status": "resolved",
          "outcome": "ArcForge Provider 已提供 project-only-provisioning/v1；ArcOrbit 为全部关联 Product Workspace 根生成项目级 plan，无项目时只做全局资源检查且 task preflight fail-closed。user-ambient、适用的 project-ambient、shared assets 和 on-demand loader 只写入项目，catalog 保持 stateRoot 控制面；旧 relation 证明的用户级 skill、asset 和 loader 通过显式 cleanup、备份与事务回滚迁移，unknown/unrelated 内容保持不变。",
          "reason": "权威源码、ArcOrbit 集成、Provider artifact、全量测试和 distribution smoke 形成一致且可重复的实现证据；fresh state 未出现反证。",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:166",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:563",
            "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:30",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:10",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:228",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:344",
            "runtime/arcorbit/src/automation-coordinator.mjs:918",
            "runtime/arcorbit/desktop/main.mjs:78",
            "ArcForge npm test: 61 passed",
            "ArcOrbit npm run check: 233 passed, 2 environment-gated skips",
            "ArcOrbit distribution smoke: missing=0, changed=0, same=14, managed_stale=0, uncertain=0",
            "Provider artifact sha256: 6122479d363d298eeab7d9c99ef11e24ef602b76f3a1d8be157efb1a11eb95d7",
            "git diff --check"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-007",
            "revision": 1,
            "status": "accepted",
            "statement": "权威 ArcForge Provider 与 ArcOrbit 已实现 project-only provisioning：所有关联 Product Workspace 根组成明确的项目目标集；user-ambient、经评估适用的 project-ambient、shared assets 和 on-demand loader 只投影到这些项目，user-on-demand catalog 保持 ArcForge stateRoot 控制面，无项目的 task preflight 不回退用户级目标；旧 relation 证明的用户级 managed targets 通过显式、可回滚 cleanup 迁移且 unrelated 内容保留。ArcOrbit 已锁定并验证包含 project-only-provisioning/v1 的本地 Provider artifact。",
            "basis": "权威 ArcForge/ArcOrbit 源码、自动化迁移与多项目测试、重建 manifest 和 distribution smoke 的直接证据。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:239",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:90",
              "runtime/arcorbit/test/automation-coordinator.test.mjs:1036",
              "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:8",
              "ArcForge npm test: 61 passed",
              "ArcOrbit npm run check: 233 passed, 2 skipped",
              "npm run smoke:distribution: passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-005",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "SkillProvisioningManager 现在要求明确项目根、向 Provider 传入全部关联 projectTargetDirs 和 project-only policy，并且 task preflight 缺少项目时 fail-closed。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:228",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:344",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:27",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:90"
            ]
          },
          {
            "id": "IMPACT-006",
            "fact_id": "FACT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Provider 只从既有 availability relation、asset relation 和 provisioning evidence 生成旧目标 cleanup；测试证明用户级 managed skill、asset 和 loader 被确认式事务迁移，unrelated 内容保留，晚期失败可回滚。",
            "gap_ids": [],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts:563",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs:239",
              "ArcForge npm test: 61 passed"
            ]
          },
          {
            "id": "IMPACT-007",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "权威 Provider 已声明并实现 project-only-provisioning/v1，ArcOrbit 要求该 capability 且已重建、锁定并通过 distribution smoke 验证对应 artifact。",
            "gap_ids": [],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/provider/index.ts:30",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:10",
              "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json:8",
              "Provider artifact sha256: 6122479d363d298eeab7d9c99ef11e24ef602b76f3a1d8be157efb1a11eb95d7"
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
          "Project revision 154 的新增推进上下文属于并发 CASE-20260821-002；本 transition 仅实现既有 provisioning 决策，不修改该并发事项或任何软件定义。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 154,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目专属安装、无用户级目标和旧 managed target 安全迁移的产品期望仍由稳定分发规格完整表达，实际实现现已与其一致；并发实时同步 Case 未改变这些期望。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness 继续按稳定交互源展示项目 targets、迁移分类和确认动作；task 与 acceptance-feedback 启动都传入真实项目路径，非 ready snapshot 会投影到现有 Setup 表面。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未改变视觉 token、主题、布局、品牌或组件视觉规则；并发 Project revision 变化也未改变本 transition 的视觉相关性。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现保持 ArcForge Core/Provider 拥有目标投影、catalog/loader 和迁移算法，ArcOrbit 仅传入项目集合、评估和调用级 policy；关系与 Runtime preflight 边界与稳定技术方案一致。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/sources.ts",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实际 Provider、ArcOrbit manager、Desktop preflight 和锁定 artifact 已共同实现 FACT-003 的项目唯一消费目标；多项目、无项目、project-ambient assessment 和 distribution smoke 均有直接证据。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/arcforge-provider.manifest.json",
              "ArcOrbit distribution smoke: passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "旧目标所有权、显式 cleanup、内容备份、unknown/unrelated preservation、事务回滚、冲突与 drift 均由可重复测试覆盖；全量测试和锁定 artifact smoke 未发现回归。",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "ArcForge npm test: 61 passed",
              "ArcOrbit npm run check: 233 passed, 2 environment-gated skips",
              "git diff --check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh trusted snapshot observed_at 2026-08-21T17:02:12.239Z",
        "CASE-20260821-001 remains content_revision 3 with implementation Gap ready",
        "ArcForge npm run check: passed",
        "ArcForge npm test: 61 passed",
        "ArcOrbit npm run check: 233 passed, 2 environment-gated skips",
        "Focused ArcOrbit manager/Desktop/Automation tests: 52 passed",
        "Local Provider artifact: 0.1.8-local.project-only-20260822",
        "Provider artifact sha256: 6122479d363d298eeab7d9c99ef11e24ef602b76f3a1d8be157efb1a11eb95d7",
        "ArcOrbit distribution smoke: passed with missing=0, changed=0, same=14, managed_stale=0, uncertain=0",
        "git diff --check"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T17:03:55.932Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立复核项目级 provisioning 实现的正确性、问题解决程度、验证可信度、回归风险与最小性，只提交 completion review result。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "CASE-001 的普通 Gap 和既有 impacts 已闭合，completion review 是其唯一 ready 候选，并直接决定该 Case 能否可信结束。四个 Project Gap 均需独立 Case；CASE-002 的实时同步契约属于并发独立事项。",
        "snapshot_token": "64e0188b98ba101af0919132d833a2a80e084c11c43bc83afbcf4b586ea240db",
        "selected_ref": "case-gap:CASE-20260821-001:CASE-20260821-001:completion-review:1",
        "comparison_summary": "比较了六个 persisted candidates。四个通用 Project Gap 均为 case_required；CASE-002 的 ready Gap 与本 Case 无因果依赖；CASE-001 completion review 具有最高阻塞性和直接用户影响，是当前唯一可闭合本 Case 的候选。",
        "fresh_discovery_summary": "选择前未发现会改变 review 对象或范围的 fresh candidate。Review 执行中发现 Desktop 常规 Setup/项目绑定入口缺失项目上下文；本轮只记录 REVIEW-001，由 ledger 自动派生后续普通 Gap，不提交 facts、impacts、gaps 或其他 content mutation。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 completion review。",
              "uncertainty": "仍需独立真实场景验证。",
              "risk": "高，但属于通用 Agent Loop 风险。",
              "user_impact": "与当前项目级 provisioning 的结束判断间接相关。"
            },
            "reason": "需独立 Case，不能替代当前 implementation-focused review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 review。",
              "uncertainty": "Runtime 韧性和 adapter 验收仍待独立界定。",
              "risk": "高。",
              "user_impact": "与 skill provisioning 完成判断无直接因果关系。"
            },
            "reason": "范围不同且需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 review。",
              "uncertainty": "真实权限项目证据仍缺失。",
              "risk": "高。",
              "user_impact": "不直接决定项目级 skill 目标是否完成。"
            },
            "reason": "需要独立 Case 和受控真实资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 completion review。",
              "uncertainty": "跨记录一致性仍需真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前 provisioning 仅间接相关。"
            },
            "reason": "需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:CASE-20260821-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "它是 CASE-001 结束前唯一剩余义务。",
              "uncertainty": "普通实现证据已充分，需核验五个完成维度。",
              "risk": "项目目标写入和旧用户目录迁移风险高。",
              "user_impact": "决定是否可声明项目级 provisioning 已完整解决。"
            },
            "reason": "当前 Case 唯一 ready 候选，且 completion review 不能由其他 Case 工作替代。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞 CASE-002 后续跨仓库实现，但不阻塞 CASE-001 review。",
              "uncertainty": "可靠事件、游标和授权生命周期仍需建立。",
              "risk": "高。",
              "user_impact": "影响实时任务同步，不影响 skill provisioning 审查对象。"
            },
            "reason": "并发独立 Case；本轮指令明确继续 CASE-001，且 Case-scoped review 应先闭合或暴露其 finding。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-001:completion-review:1",
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
        "goal": "独立复核项目级 provisioning 实现的正确性、问题解决程度、验证可信度、回归风险与最小性，只提交 completion review result。",
        "expected_state_change": "记录 REVIEW-001；ledger 从 finding 自动派生普通修复 Gap，Case 返回 working，content revision 保持不变。"
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
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "REVIEW-001",
              "kind": "omission",
              "statement": "项目级 Provider 与 task preflight 已正确实现，但 Desktop 常规 Setup/首次 Product Workspace 绑定没有把项目上下文传过 preload/Renderer，也没有对应端到端测试；逐项目 readiness 只能在任务 preflight 失败后被动显露。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/preload.cjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/preload.cjs:5",
                "runtime/arcorbit/desktop/renderer/renderer.js:157",
                "runtime/arcorbit/desktop/main.mjs:78",
                "runtime/arcorbit/desktop/main.mjs:229",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:332",
                "Focused completion review tests: 52 passed"
              ]
            }
          ],
          "evidence": [
            "ArcForge Provider implementation and migration evidence accepted at content revision 4",
            "runtime/arcorbit/desktop/preload.cjs:5",
            "runtime/arcorbit/desktop/renderer/renderer.js:153",
            "runtime/arcorbit/desktop/renderer/renderer.js:157",
            "runtime/arcorbit/desktop/main.mjs:78",
            "runtime/arcorbit/desktop/main.mjs:229",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:305",
            "Focused completion review tests: 52 passed, 0 failed"
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
        "evidence": [
          "稳定产品、交互和技术决策仍然准确；本轮只记录 implementation-focused completion review，不修改 Project State。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 154,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目专属消费、无用户级安装和安全迁移的产品结果仍由稳定分发规格明确表达；review finding 是 Desktop realization 遗漏，不使产品期望含糊或不可恢复。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "全局资源检查、项目绑定计划、逐项目 targets、迁移确认和恢复语义仍由稳定交互文档及线框完整表达；REVIEW-001 正是依据该持久期望识别实际实现遗漏。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
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
            "reason": "completion review 与发现的项目上下文接线遗漏均未建立、修改或否定视觉 token、主题、布局、品牌或组件呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "ArcForge Provider 继续拥有目标投影与迁移算法，ArcOrbit main process 负责项目上下文和 Setup gate；REVIEW-001 没有否定该边界，只暴露 Renderer/preload 尚未完整消费它。",
            "fact_refs": [
              "FACT-003",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/src/core/skill-availability.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "项目目标投影和 task preflight 已实现，但正常 Setup 与首次绑定没有主动建立逐项目 plan，稳定交互及 implementation evidence requirement 尚未被完整兑现。",
            "fact_refs": [
              "FACT-003",
              "FACT-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/preload.cjs:5",
              "runtime/arcorbit/desktop/renderer/renderer.js:157",
              "runtime/arcorbit/desktop/main.mjs:229"
            ],
            "gap_refs": [
              "CASE-20260821-001:review-finding:REVIEW-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Provider 迁移、rollback、unknown/unrelated preservation 证据仍可信，但 Desktop 首次绑定和常规 Setup 项目上下文没有实现及端到端测试，完整回归风险主张证据不足。",
            "fact_refs": [
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:305",
              "Focused completion review tests: 52 passed"
            ],
            "gap_refs": [
              "CASE-20260821-001:review-finding:REVIEW-001"
            ]
          }
        ]
      },
      "evidence": [
        "Direct completion review of ArcForge project-only target and relation migration implementation",
        "Direct completion review of ArcOrbit manager, task preflight, preload, Renderer and IPC wiring",
        "runtime/arcorbit/desktop/preload.cjs:5",
        "runtime/arcorbit/desktop/renderer/renderer.js:157",
        "runtime/arcorbit/desktop/main.mjs:78",
        "runtime/arcorbit/desktop/main.mjs:229",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:305",
        "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 52 passed, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T17:08:58.178Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "接受已完成的 Desktop 首次绑定、项目选择和常规 Setup retry 项目级 readiness 修复及其回归证据，不重复实现工作。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "fresh snapshot 显示 Project revision 已因 CASE-002 的可靠实时同步契约推进至 155，但 CASE-001 的 REVIEW-001 仍是 ready。四个 Project Gap 需要独立 Case；CASE-002 的实现 Gap 是并发独立工作；当前 repair contract 要求保留仍然有效的验收主张，因此选择已完成实现且尚未被 Ledger 接受的 REVIEW-001 修复。",
        "snapshot_token": "778e2fdb4c4ec956bd25b97679e66995c60f3f4c77b5fb1542b84c3d04de1b58",
        "selected_ref": "case-gap:CASE-20260821-001:CASE-20260821-001:review-finding:REVIEW-001",
        "comparison_summary": "重新比较了六个 persisted candidates。四个 Project Gap 为 case_required；CASE-002 候选已由契约 Gap 变为可靠实时同步 implementation Gap，但与 CASE-001 无因果依赖；REVIEW-001 仍是 CASE-001 唯一 ready、直接阻塞其 completion review 的 Gap。",
        "fresh_discovery_summary": "fresh Project revision 155 新增了可靠实时同步决策及 CASE-002 implementation Gap，但未改变 CASE-001 的项目级 provisioning 契约、实现范围、review finding 或验收证据；没有发现需要替换当前 acceptance claim 的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 的项目级 Setup 修复。",
              "uncertainty": "仍需独立真实软件场景证据。",
              "risk": "高，但属于通用 Agent Loop 风险。",
              "user_impact": "对当前 Desktop Setup 入口仅间接相关。"
            },
            "reason": "需要独立 Case，不能替代当前 review finding 修复。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 REVIEW-001。",
              "uncertainty": "Runtime 韧性和 adapter 验收边界仍待独立界定。",
              "risk": "高。",
              "user_impact": "与项目级 Setup Readiness 入口无直接因果关系。"
            },
            "reason": "范围不同且需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Desktop 接线修复。",
              "uncertainty": "真实权限项目证据仍缺失。",
              "risk": "高。",
              "user_impact": "不直接决定正常 Setup 是否传递项目上下文。"
            },
            "reason": "需要独立 Case 和受控真实资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 REVIEW-001。",
              "uncertainty": "跨记录一致性仍需真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前 provisioning 入口仅间接相关。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:CASE-20260821-001:review-finding:REVIEW-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "它是 CASE-001 重新进入 completion review 前唯一剩余普通 Gap。",
              "uncertainty": "缺失入口和验证范围已由 review 及完成的代码证据明确界定。",
              "risk": "未接受该修复会继续让全局 ready 掩盖项目 plan 和迁移确认。",
              "user_impact": "用户需要在首次绑定、项目切换和普通 retry 中主动看到项目级 targets。"
            },
            "reason": "fresh snapshot 仍将其列为 CASE-001 唯一 ready Gap，且已完成的修复尚未被 Ledger 接受。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞 CASE-002 的可靠实时同步结果，但不阻塞 CASE-001。",
              "uncertainty": "契约已收敛，剩余不确定性集中在跨仓库实现接线。",
              "risk": "涉及事务一致性、跨实例通知、断线恢复和人工 Gate。",
              "user_impact": "影响实时任务同步，不影响当前 Setup Readiness 修复。"
            },
            "reason": "并发独立 Case；其 fresh 推进不使 CASE-001 的既有 acceptance claim 过时。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-001:review-finding:REVIEW-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 项目级 Provider 与 task preflight 已正确实现，但 Desktop 常规 Setup/首次 Product Workspace 绑定没有把项目上下文传过 preload/Renderer，也没有对应端到端测试；逐项目 readiness 只能在任务 preflight 失败后被动显露。",
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
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/desktop/preload.cjs:5",
          "runtime/arcorbit/desktop/renderer/renderer.js:157",
          "runtime/arcorbit/desktop/main.mjs:78",
          "runtime/arcorbit/desktop/main.mjs:229",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:332",
          "Focused completion review tests: 52 passed"
        ]
      },
      "planned_transition": {
        "goal": "接受已完成的 Desktop 首次绑定、项目选择和常规 Setup retry 项目级 readiness 修复及其回归证据，不重复实现工作。",
        "expected_state_change": "解决 REVIEW-001 对应普通 Gap；内容修订后 completion review 重置为 pending，由 post-commit fresh snapshot 决定下一轮。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260821-001:review-finding:REVIEW-001",
          "status": "resolved",
          "outcome": "Desktop preload 接受受限 Setup 输入；Renderer 在首次绑定、项目选择和普通 retry 时传递本地 Product Workspace ID；main process 从 fresh Desktop Store 校验该 ID并生成规范化的全部关联项目根，Provider plan 展示 project roots、skill/shared asset/loader targets。无项目仍执行 global resource-only check，task preflight 继续使用同一项目集合并 fail-closed。",
          "reason": "实现接线、受信上下文解析、项目路径变化验证、UI plan 投影、聚焦回归和全量检查共同覆盖了 completion review 指出的遗漏；fresh Project revision 155 未产生反证。",
          "evidence": [
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:3",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:22",
            "runtime/arcorbit/desktop/preload.cjs:5",
            "runtime/arcorbit/desktop/main.mjs:79",
            "runtime/arcorbit/desktop/main.mjs:230",
            "runtime/arcorbit/desktop/renderer/renderer.js:153",
            "runtime/arcorbit/desktop/renderer/renderer.js:278",
            "runtime/arcorbit/desktop/renderer/renderer.js:413",
            "runtime/arcorbit/desktop/renderer/renderer.js:1455",
            "runtime/arcorbit/desktop/renderer/renderer.js:2018",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:349",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:375",
            "Focused manager/automation/Desktop tests: 54 passed, 0 failed",
            "ArcOrbit npm run check: 235 passed, 2 environment-gated skips, 0 failed",
            "git diff --check: passed"
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
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Project revision 155 的可靠实时同步决策与 CASE-001 provisioning 修复并行且兼容；本 transition 无需修改 Project State。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 155,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目专属消费、无用户级安装和安全迁移的产品结果保持不变，并继续由稳定分发规格明确表达；revision 155 新增的实时同步能力不改变该结果。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "首次绑定、项目选择、普通 retry、无项目全局检查、项目 plan 与迁移确认的稳定交互语义已由实际 Renderer/preload/main 接线兑现；revision 155 的 Automation 交互扩展与其不冲突。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮修复只复用既有 Setup plan 组件展示项目根和 loader targets；并发 Project revision 变化也未改变视觉 token、主题、布局或品牌规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 只传受限本地 workspace ID，main process 从受信 Desktop Store 解析项目根，ArcForge Provider 继续拥有目标投影和迁移算法；revision 155 新增的实时同步架构不改变该 provisioning 边界。",
            "fact_refs": [
              "FACT-003",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "项目专属 Provider、task preflight、首次绑定、项目选择和普通 Setup retry 共同使用受信关联项目集合；无项目路径不会回退到用户级 Agent 目标。",
            "fact_refs": [
              "FACT-003",
              "FACT-007"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "既有 Provider 迁移、rollback 和 unrelated preservation 证据保持有效；新增测试实际执行 global/scoped readiness、fresh 项目路径变化和 Renderer/preload/main 接线，聚焦及全量回归均无失败。",
            "fact_refs": [
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Focused manager/automation/Desktop tests: 54 passed, 0 failed",
              "ArcOrbit npm run check: 235 passed, 2 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh ledger snapshot token: cb76562cfa69d5be232452447076f2c7d96ced67c62f8e5318d92a0b665e9aa2",
        "Fresh CASE-001 selection token: 778e2fdb4c4ec956bd25b97679e66995c60f3f4c77b5fb1542b84c3d04de1b58",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:3",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:22",
        "runtime/arcorbit/desktop/preload.cjs:5",
        "runtime/arcorbit/desktop/main.mjs:230",
        "runtime/arcorbit/desktop/renderer/renderer.js:157",
        "runtime/arcorbit/desktop/renderer/renderer.js:278",
        "runtime/arcorbit/desktop/renderer/renderer.js:413",
        "runtime/arcorbit/desktop/renderer/renderer.js:1455",
        "runtime/arcorbit/desktop/renderer/renderer.js:2018",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:349",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:375",
        "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 54 passed, 0 failed",
        "npm run check: 235 passed, 2 environment-gated skips, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T17:17:17.969Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立复核 content revision 5 的 implementation correctness、problem resolution、verification credibility、regression risk 与 minimality，只提交 completion review result。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前指令明确继续 CASE-20260821-001。该 Case 的普通 Gap 和 state impacts 已全部闭合，completion-review:2 是唯一 ready 且直接阻塞 Case closure 的候选；其他 ready 工作属于并发 CASE-002。",
        "snapshot_token": "9b74480e20e1a955f44a7442f4258f0c2b150272898c0f93f9b95f182d824aff",
        "selected_ref": "case-gap:CASE-20260821-001:CASE-20260821-001:completion-review:2",
        "comparison_summary": "比较了六个 persisted candidates。四个 Project Gap 均为 case_required；CASE-002 realtime implementation 虽 ready 且高风险，但与 CASE-001 closure 无因果依赖；CASE-001 completion review 是当前 Case 唯一剩余义务，因此被选中。",
        "fresh_discovery_summary": "独立检查 revision 5 的实现、信任边界、入口接线、测试覆盖和回归结果，未发现会改变审查对象、验收边界或产生 finding 的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 completion review。",
              "uncertainty": "仍需独立真实软件场景证据。",
              "risk": "高，但属于通用 Agent Loop 风险。",
              "user_impact": "对当前项目级 provisioning closure 仅间接相关。"
            },
            "reason": "需要独立 Case，不能替代当前 implementation-focused review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 completion review。",
              "uncertainty": "Runtime 韧性和 adapter 验收边界仍待独立界定。",
              "risk": "高。",
              "user_impact": "与项目级 Setup Readiness 完成判断无直接因果关系。"
            },
            "reason": "范围不同且需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 completion review。",
              "uncertainty": "真实权限项目证据仍缺失。",
              "risk": "高。",
              "user_impact": "不直接决定项目级 skill 目标是否已经兑现。"
            },
            "reason": "需要独立 Case 和受控真实资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 CASE-001 completion review。",
              "uncertainty": "跨记录一致性仍需真实使用证据。",
              "risk": "高且紧迫。",
              "user_impact": "对当前 provisioning closure 仅间接相关。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-001:CASE-20260821-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "它是 CASE-001 结束前唯一剩余义务。",
              "uncertainty": "普通实现已闭合，需要独立核验五个完成维度。",
              "risk": "项目目标写入、旧用户目录迁移和 Desktop 入口接线均属高风险边界。",
              "user_impact": "直接决定能否可信声明项目级 provisioning 已完整解决。"
            },
            "reason": "当前 Case 唯一 ready 候选，且 completion review 不能由其他 Case 工作替代。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞 CASE-002 的跨仓库实现，但不阻塞 CASE-001 closure。",
              "uncertainty": "契约已收敛，剩余不确定性集中于实现与兼容性。",
              "risk": "事务一致性、跨实例恢复、撤权和人工 Gate 风险高。",
              "user_impact": "影响实时任务同步，不影响当前 skill provisioning 审查对象。"
            },
            "reason": "并发独立 Case；当前指令明确继续 CASE-001。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-001:completion-review:2",
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
        "goal": "独立复核 content revision 5 的 implementation correctness、problem resolution、verification credibility、regression risk 与 minimality，只提交 completion review result。",
        "expected_state_change": "记录 clean completion review；不修改 Case 内容或 Project State，并将 CASE-20260821-001 声明为 resolved。"
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
            "Direct review of runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "Direct review of runtime/arcorbit/desktop/main.mjs Setup IPC and task preflight wiring",
            "Direct review of runtime/arcorbit/desktop/preload.cjs bounded API",
            "Direct review of runtime/arcorbit/desktop/renderer/renderer.js retry, project-selection, first-binding and plan rendering paths",
            "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop resolves project-scoped Setup checks from the trusted local workspace store",
            "runtime/arcorbit/test/desktop-renderer.test.mjs: Desktop Setup IPC behavior preserves global checks and sends fresh associated roots",
            "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 54 passed, 0 failed",
            "npm run check: 235 passed, 2 environment-gated skips, 0 failed",
            "git diff --check: passed"
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
        "evidence": [
          "Project revision 155 的产品、交互、技术与交付决策仍准确；本轮只审查 CASE-001 content revision 5，不建立新的长期 Project 结论。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 155,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目专属消费、无用户级安装和安全迁移的产品结果保持准确且由稳定分发规格恢复；revision 155 的可靠实时能力不改变该 provisioning 结果。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "全局检查、首次绑定、项目选择、普通 retry、项目 targets、迁移确认和恢复语义均由稳定交互事实与实际 Desktop 接线一致表达。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion review 未建立、修改或否定视觉 token、主题、布局、品牌或组件呈现规则；实现仅复用既有 Setup plan 组件。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 仅提交受限本地 workspace ID，main process 从 fresh Desktop Store 恢复规范化项目根，ArcForge Provider 继续拥有投影和迁移算法；该边界与稳定供应链方案一致。",
            "fact_refs": [
              "FACT-003",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "本 Case 的项目专属 Provider、task preflight、首次绑定、项目选择和普通 retry 均使用受信关联项目集合；无项目仍只做全局资源检查且不回退用户级 Agent 目标。",
            "fact_refs": [
              "FACT-003",
              "FACT-007"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Provider ownership、备份、rollback、unknown/unrelated preservation 证据保持有效；本轮重新执行 global/scoped readiness、项目路径变化、Renderer/preload/main 接线及全量回归，未发现失败。两个环境门控测试分别针对 Electron sidebar layout 与 organization center，不覆盖本 Case 的 Setup 项目上下文边界。",
            "fact_refs": [
              "FACT-004",
              "FACT-007"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/tests/provider.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Focused completion review tests: 54 passed, 0 failed",
              "ArcOrbit npm run check: 235 passed, 2 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:3",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:22",
        "runtime/arcorbit/desktop/preload.cjs:5",
        "runtime/arcorbit/desktop/main.mjs:79",
        "runtime/arcorbit/desktop/main.mjs:230",
        "runtime/arcorbit/desktop/renderer/renderer.js:153",
        "runtime/arcorbit/desktop/renderer/renderer.js:278",
        "runtime/arcorbit/desktop/renderer/renderer.js:413",
        "runtime/arcorbit/desktop/renderer/renderer.js:1455",
        "runtime/arcorbit/desktop/renderer/renderer.js:2018",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:349",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:375",
        "node --test test/skill-provisioning-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs: 54 passed, 0 failed",
        "npm run check: 235 passed, 2 environment-gated skips, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-163854971Z",
      "occurred_at": "2026-08-21T17:20:24.499Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-project-local-skill-provisioning-contract",
      "GAP-project-local-skill-provisioning-implementation",
      "GAP-accept-arcforge-provider-authorization",
      "GAP-verify-arcforge-project-only-provider-capability",
      "CASE-20260821-001:review-finding:REVIEW-001"
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
    "updated_at": "2026-08-21T17:20:24.499Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
