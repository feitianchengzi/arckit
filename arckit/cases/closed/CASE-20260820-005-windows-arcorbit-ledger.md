# 修复 Windows ArcOrbit 项目绑定时 ledger 模块解析失败

Case: CASE-20260820-005
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-20T15:26:39.083Z

## User Intent

恢复 Windows 安装版 ArcOrbit 的项目目录绑定能力，并确保 trusted ledger capability 的解析符合打包运行时边界。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260820-005",
  "title": "修复 Windows ArcOrbit 项目绑定时 ledger 模块解析失败",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-20T15:17:04.228Z",
  "updated_at": "2026-08-20T15:26:39.083Z",
  "user_intent": "恢复 Windows 安装版 ArcOrbit 的项目目录绑定能力，并确保 trusted ledger capability 的解析符合打包运行时边界。",
  "expected_outcome": "Windows 安装版选择项目目录时不再依赖目标项目预装 `.agents/skills/arckit-development-ledger`，能够从受信任的打包能力位置完成项目绑定；相关路径解析获得可重复的 Windows 回归证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
      "revision": 1,
      "status": "accepted",
      "statement": "Windows 安装版 ArcOrbit 在选择项目目录进行绑定时，尝试从目标项目 `D:\\workspace\\repos\\JuSong\\.agents\\skills\\arckit-development-ledger\\scripts\\trusted-ledger-operations.mjs` 导入模块，并因该模块不存在而使 `arckit:pick-project` 失败。",
      "basis": "用户提供的实际 Windows 运行错误；调用栈同时指出导入发起方位于安装包 `resources\\app.asar\\src\\ledger-scripts.mjs`。",
      "evidence": [
        "Current operator input, 2026-08-20: ERR_MODULE_NOT_FOUND during arckit:pick-project",
        "Reported importer: C:\\Users\\xxx\\AppData\\Local\\Programs\\arcorbit\\resources\\app.asar\\src\\ledger-scripts.mjs",
        "Reported missing target: D:\\workspace\\repos\\JuSong\\.agents\\skills\\arckit-development-ledger\\scripts\\trusted-ledger-operations.mjs"
      ]
    },
    {
      "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
      "revision": 1,
      "status": "accepted",
      "statement": "在 Windows 中，当 packaged repository capability root 位于 C: 而目标项目 manifest 位于 D: 时，`path.relative` 返回带 D: 盘符的绝对路径；`capability-registry.mjs` 当前 `isWithin` 谓词没有拒绝绝对路径或不同卷，因而把目标项目 capability 错标为 `repository`。加载顺序随后允许该同 ID 项目 capability 覆盖真正的 packaged capability，最终使 `ledger-scripts.mjs` 从项目 `.agents/skills` 目录导入 `trusted-ledger-operations.mjs`。",
      "basis": "静态调用链与用户报告的 C:/D: 路径完全一致；隔离 `node:path.win32` 推演得到 `relative=D:\\workspace\\...`、`currentIsWithin=true`、`crossVolume=true`。",
      "evidence": [
        "runtime/arcorbit/src/capability-registry.mjs:19-37",
        "runtime/arcorbit/src/capability-registry.mjs:74-105",
        "runtime/arcorbit/src/capability-registry.mjs:142-183",
        "runtime/arcorbit/src/capability-registry.mjs:185-215",
        "runtime/arcorbit/src/ledger-scripts.mjs:16-39",
        "Current operator error report",
        "node:path.win32 isolated proof executed 2026-08-20"
      ]
    },
    {
      "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP",
      "revision": 1,
      "status": "accepted",
      "statement": "现有 capability-policy 测试验证 canonical/legacy packaged 根选择和同一主机临时目录行为，但没有模拟 Windows 不同盘符下 packaged root 与目标项目的同 ID manifest 竞争，因此未捕获跨盘来源误分类。",
      "basis": "检查 `runtime/arcorbit/test/capability-policy.test.mjs` 并执行其全部 3 个测试；测试均通过，但没有 cross-drive、`path.win32` 或不同 volume 场景。",
      "evidence": [
        "runtime/arcorbit/test/capability-policy.test.mjs",
        "node --test runtime/arcorbit/test/capability-policy.test.mjs: 3 passed, 0 failed",
        "rg test audit: no cross-drive capability containment coverage"
      ]
    },
    {
      "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit capability 来源判断现在使用可注入 path API 的 `isPathWithin`，拒绝 `path.relative` 返回的绝对路径，并仅把空路径或非绝对、非父目录路径视为 contained。`path.win32` 回归证明 C: packaged capability root 与 D: project manifest 不相包含；集成回归证明项目同 ID capability 不能覆盖 repository capability，最终 entrypoint 保持在 packaged repository 根内。",
      "basis": "直接代码变更、Windows 路径语义测试、同 ID capability 加载测试和 ArcOrbit 全量检查。",
      "evidence": [
        "runtime/arcorbit/src/capability-registry.mjs",
        "runtime/arcorbit/test/capability-policy.test.mjs",
        "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
      "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 22
      },
      "effect": "upheld",
      "reason": "不同卷的项目 manifest 不再被误标为 repository，同 ID 项目 capability 无法覆盖 manifest-resolved packaged ledger capability。",
      "gap_ids": [],
      "evidence": [
        "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
        "runtime/arcorbit/src/capability-registry.mjs",
        "runtime/arcorbit/test/capability-policy.test.mjs"
      ]
    },
    {
      "id": "IMPACT-WINDOWS-BINDING-REALIZATION",
      "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "原始 C:/D: 触发条件已由 `path.win32` 回归覆盖，项目绑定的 ledger entrypoint 保持在 packaged trusted capability。",
      "gap_ids": [],
      "evidence": [
        "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
        "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK",
      "fact_id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "跨盘来源误分类已被绝对路径拒绝规则控制，并有可重复的 Windows 路径与同 ID capability 选择证据。",
      "gap_ids": [],
      "evidence": [
        "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
        "runtime/arcorbit/test/capability-policy.test.mjs",
        "npm --prefix runtime/arcorbit run check: 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
      "status": "resolved",
      "goal": "确定 Windows 安装版 `arckit:pick-project` 为何解析到目标项目 `.agents/skills`，并建立唯一、可验证的修复边界。",
      "reason": "具体修复对象取决于尚未接受的根因：可能位于 packaged capability manifest 解析、Windows 路径/URL 转换或遗留项目 skill fallback。依照单 Gap 因果边界，本轮不能在根因建立前预先实施下游修复。",
      "derived_from": [
        "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
        "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
        "IMPACT-WINDOWS-BINDING-REALIZATION"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Windows 用户无法完成项目绑定。",
        "uncertainty": "错误目标已知，但选择该目标的代码路径与条件尚未建立。",
        "risk": "错误修复可能破坏开发态 fallback、其他平台打包能力解析或 trusted capability 边界。",
        "user_impact": "ArcOrbit 的核心入口流程在 Windows 安装版完全失败。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "`ledger-scripts.mjs` 到最终模块 URL/路径的完整解析链证据",
        "开发态与 packaged 模式的能力来源及 fallback 条件",
        "Windows 路径或 file URL 处理证据",
        "现有测试覆盖与缺口",
        "能够唯一界定后续修复位置和验收方式的根因结论"
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
        "status": "resolved",
        "outcome": "已确认 Windows 跨盘路径被错误判定为 repository 内路径，导致目标项目同 ID capability 覆盖打包 trusted capability；修复边界位于 capability 来源包含判断及其 Windows 跨盘回归覆盖。",
        "reason": "代码链、用户 C:/D: 错误路径和 `node:path.win32` 隔离推演完整匹配触发条件、位置、时序与最终异常。",
        "evidence": [
          "runtime/arcorbit/src/capability-registry.mjs:19-37,74-105,142-183,185-215",
          "runtime/arcorbit/src/project-initializer.mjs:8-33",
          "runtime/arcorbit/src/ledger-scripts.mjs:16-39",
          "Isolated node:path.win32 proof: relative C:→D: is an absolute D: path while current predicate returns true"
        ],
        "occurred_at": "2026-08-20T15:21:51.404Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
      "status": "resolved",
      "goal": "修复 capability 来源包含判断，使 Windows 不同盘符的项目 manifest 永远不能冒充或覆盖 packaged repository capability，并补充可重复的跨盘回归测试。",
      "reason": "诊断已证明 `isWithin` 对跨盘绝对 relative path 返回 true；必要修复应限定在 volume-aware/absolute-safe containment 与同 ID capability 优先级回归，不能通过复制项目 skill 或绕过 trusted source 规则掩盖。",
      "derived_from": [
        "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
        "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP",
        "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
        "IMPACT-WINDOWS-BINDING-REALIZATION",
        "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Windows 跨盘项目仍无法可靠绑定。",
        "uncertainty": "根因已确定，具体最小实现需验证 path API 注入或 containment helper 的跨平台测试方式。",
        "risk": "未修复时项目内容可以越过 repository source 隔离。",
        "user_impact": "Windows 安装版核心项目绑定路径不可用。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Windows C: packaged root 与 D: project root 的同 ID manifest 回归测试",
        "项目 manifest 被标记为 project 且不能覆盖 packaged repository capability 的断言",
        "packaged trusted ledger entrypoint 仍解析到 resources/arcorbit/trusted-capabilities 的断言",
        "相关 capability、初始化和 Runtime 测试通过",
        "临时诊断标记无残留"
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
        "status": "resolved",
        "outcome": "containment 现在拒绝不同卷产生的绝对 relative path，并精确处理父目录边界；Windows C: packaged root 与 D: project manifest 被正确隔离，项目同 ID capability 不能覆盖 trusted repository capability。",
        "reason": "根因路径已最小修复，跨盘路径测试、同 ID capability 选择测试和 ArcOrbit 全量检查均通过。",
        "evidence": [
          "runtime/arcorbit/src/capability-registry.mjs",
          "runtime/arcorbit/test/capability-policy.test.mjs",
          "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-20T15:24:57.324Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-20T15:17:04.228Z"
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
          "Reviewed final diff for runtime/arcorbit/src/capability-registry.mjs and runtime/arcorbit/test/capability-policy.test.mjs",
          "Targeted capability-policy suite rerun: 5 passed, 0 failed",
          "Independent path.win32 boundary matrix: same path, descendant, sibling, parent/outside, cross-drive and cross-UNC-server; 6 passed",
          "Prior accepted full ArcOrbit check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
          "git diff --check passed",
          "No ARC_DEBUG marker or temporary logging remains"
        ],
        "occurred_at": "2026-08-20T15:26:39.083Z"
      }
    ],
    "evidence": [
      "Reviewed final diff for runtime/arcorbit/src/capability-registry.mjs and runtime/arcorbit/test/capability-policy.test.mjs",
      "Targeted capability-policy suite rerun: 5 passed, 0 failed",
      "Independent path.win32 boundary matrix: same path, descendant, sibling, parent/outside, cross-drive and cross-UNC-server; 6 passed",
      "Prior accepted full ArcOrbit check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
      "git diff --check passed",
      "No ARC_DEBUG marker or temporary logging remains"
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
      "goal": "通过调用链、能力来源判定、Windows `path.win32` 推演、打包资源检查和现有测试审计，建立唯一根因与必要修复边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Windows 项目绑定当前完全阻断，且必须先建立根因才能界定安全修复；该 Case Gap 是唯一 ready 的当前用户事项。",
        "snapshot_token": "9aef4bffd95e897e8a4ad0783c0cb81fedcd8b18aea2c1c6feeab6952d4469a0",
        "selected_ref": "case-gap:CASE-20260820-005:GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
        "comparison_summary": "选择 Windows ledger 解析诊断 Gap。GAP-cross-record-audit 虽为高风险高紧迫事项，但需要另建 Case；GAP-runtime-resilience-and-adapters、GAP-agent-scenario-evaluation、GAP-security-real-project-validation 均为长期 Project Gap，不能解除当前项目绑定阻断，故全部暂缓。",
        "fresh_discovery_summary": "本轮未发现需要取代 selected Gap 的其他 fresh candidate；诊断结果新增一个只能在 post-commit fresh-read 后选择的实现义务。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻断当前 Windows 项目绑定。",
              "uncertainty": "长期场景验证仍有高不确定性。",
              "risk": "长期质量风险高。",
              "user_impact": "低于当前完全阻断的用户路径。"
            },
            "reason": "需要独立 Case，且不是当前故障的前置条件。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接解除当前模块解析错误。",
              "uncertainty": "长期韧性和 adapter 验收仍未完成。",
              "risk": "长期运行风险高。",
              "user_impact": "当前用户绑定故障更直接。"
            },
            "reason": "需要独立 Case，当前先处理已复现的核心入口阻断。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前诊断。",
              "uncertainty": "仍需真实权限项目证据。",
              "risk": "安全风险高。",
              "user_impact": "低于当前项目绑定完全失败。"
            },
            "reason": "需要外部真实项目条件和独立 Case，不是本轮根因定位前置。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不解除当前 Windows 入口故障。",
              "uncertainty": "跨记录漂移风险已知。",
              "risk": "高。",
              "user_impact": "当前 Windows 用户路径完全不可用，优先级更高。"
            },
            "reason": "虽具有高紧迫性，但需要独立 Case；当前用户故障优先。"
          },
          {
            "ref": "case-gap:CASE-20260820-005:GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Windows 用户无法完成项目绑定。",
              "uncertainty": "本轮开始时尚未确定跨盘包含判断、打包资源或 fallback 中哪个是根因。",
              "risk": "错误修复可能破坏 trusted capability 来源隔离。",
              "user_impact": "ArcOrbit 核心入口在 Windows 安装版完全失败。"
            },
            "reason": "唯一与当前用户阻断直接对应且已就绪的 Case Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
        "responsibility": "agent",
        "goal": "确定 Windows 安装版 `arckit:pick-project` 为何解析到目标项目 `.agents/skills`，并建立唯一、可验证的修复边界。",
        "reason": "具体修复对象取决于尚未接受的根因：可能位于 packaged capability manifest 解析、Windows 路径/URL 转换或遗留项目 skill fallback。依照单 Gap 因果边界，本轮不能在根因建立前预先实施下游修复。",
        "derived_from": [
          "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
          "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
          "IMPACT-WINDOWS-BINDING-REALIZATION"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Windows 用户无法完成项目绑定。",
          "uncertainty": "错误目标已知，但选择该目标的代码路径与条件尚未建立。",
          "risk": "错误修复可能破坏开发态 fallback、其他平台打包能力解析或 trusted capability 边界。",
          "user_impact": "ArcOrbit 的核心入口流程在 Windows 安装版完全失败。"
        },
        "evidence_required": [
          "`ledger-scripts.mjs` 到最终模块 URL/路径的完整解析链证据",
          "开发态与 packaged 模式的能力来源及 fallback 条件",
          "Windows 路径或 file URL 处理证据",
          "现有测试覆盖与缺口",
          "能够唯一界定后续修复位置和验收方式的根因结论"
        ]
      },
      "planned_transition": {
        "goal": "通过调用链、能力来源判定、Windows `path.win32` 推演、打包资源检查和现有测试审计，建立唯一根因与必要修复边界。",
        "expected_state_change": "关闭未知根因，接受跨盘包含判断错误及测试缺口事实，并留下一个绑定该事实的实现 Gap；本轮不消费新事实实施修复。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
          "status": "resolved",
          "outcome": "已确认 Windows 跨盘路径被错误判定为 repository 内路径，导致目标项目同 ID capability 覆盖打包 trusted capability；修复边界位于 capability 来源包含判断及其 Windows 跨盘回归覆盖。",
          "reason": "代码链、用户 C:/D: 错误路径和 `node:path.win32` 隔离推演完整匹配触发条件、位置、时序与最终异常。",
          "evidence": [
            "runtime/arcorbit/src/capability-registry.mjs:19-37,74-105,142-183,185-215",
            "runtime/arcorbit/src/project-initializer.mjs:8-33",
            "runtime/arcorbit/src/ledger-scripts.mjs:16-39",
            "Isolated node:path.win32 proof: relative C:→D: is an absolute D: path while current predicate returns true"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
            "revision": 1,
            "status": "accepted",
            "statement": "在 Windows 中，当 packaged repository capability root 位于 C: 而目标项目 manifest 位于 D: 时，`path.relative` 返回带 D: 盘符的绝对路径；`capability-registry.mjs` 当前 `isWithin` 谓词没有拒绝绝对路径或不同卷，因而把目标项目 capability 错标为 `repository`。加载顺序随后允许该同 ID 项目 capability 覆盖真正的 packaged capability，最终使 `ledger-scripts.mjs` 从项目 `.agents/skills` 目录导入 `trusted-ledger-operations.mjs`。",
            "basis": "静态调用链与用户报告的 C:/D: 路径完全一致；隔离 `node:path.win32` 推演得到 `relative=D:\\workspace\\...`、`currentIsWithin=true`、`crossVolume=true`。",
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs:19-37",
              "runtime/arcorbit/src/capability-registry.mjs:74-105",
              "runtime/arcorbit/src/capability-registry.mjs:142-183",
              "runtime/arcorbit/src/capability-registry.mjs:185-215",
              "runtime/arcorbit/src/ledger-scripts.mjs:16-39",
              "Current operator error report",
              "node:path.win32 isolated proof executed 2026-08-20"
            ]
          },
          {
            "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP",
            "revision": 1,
            "status": "accepted",
            "statement": "现有 capability-policy 测试验证 canonical/legacy packaged 根选择和同一主机临时目录行为，但没有模拟 Windows 不同盘符下 packaged root 与目标项目的同 ID manifest 竞争，因此未捕获跨盘来源误分类。",
            "basis": "检查 `runtime/arcorbit/test/capability-policy.test.mjs` 并执行其全部 3 个测试；测试均通过，但没有 cross-drive、`path.win32` 或不同 volume 场景。",
            "evidence": [
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 3 passed, 0 failed",
              "rg test audit: no cross-drive capability containment coverage"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK",
            "fact_id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "跨盘误分类不仅导致缺模块；目标项目同 ID manifest 能被当作 repository source 并覆盖 packaged trusted capability，形成尚未修复的信任边界风险。",
            "gap_ids": [
              "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
            ],
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs:142-215",
              "node:path.win32 isolated proof executed 2026-08-20",
              "arckit/tech/arcorbit/solution.md:160-171"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
            "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 22
            },
            "effect": "threatened",
            "reason": "根因已建立，但 packaged trusted capability 仍可被跨盘项目 manifest 覆盖，尚未兑现 manifest-resolved trusted capability 边界。",
            "gap_ids": [
              "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
            ],
            "evidence": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "runtime/arcorbit/src/capability-registry.mjs:142-215"
            ]
          },
          {
            "id": "IMPACT-WINDOWS-BINDING-REALIZATION",
            "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "诊断已完成但 Windows 项目绑定实现仍未修复；承接义务转移到跨盘 capability containment 实现 Gap。",
            "gap_ids": [
              "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
            ],
            "evidence": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "Current operator error report"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
            "status": "open",
            "goal": "修复 capability 来源包含判断，使 Windows 不同盘符的项目 manifest 永远不能冒充或覆盖 packaged repository capability，并补充可重复的跨盘回归测试。",
            "reason": "诊断已证明 `isWithin` 对跨盘绝对 relative path 返回 true；必要修复应限定在 volume-aware/absolute-safe containment 与同 ID capability 优先级回归，不能通过复制项目 skill 或绕过 trusted source 规则掩盖。",
            "derived_from": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP",
              "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
              "IMPACT-WINDOWS-BINDING-REALIZATION",
              "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "Windows 跨盘项目仍无法可靠绑定。",
              "uncertainty": "根因已确定，具体最小实现需验证 path API 注入或 containment helper 的跨平台测试方式。",
              "risk": "未修复时项目内容可以越过 repository source 隔离。",
              "user_impact": "Windows 安装版核心项目绑定路径不可用。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Windows C: packaged root 与 D: project root 的同 ID manifest 回归测试",
              "项目 manifest 被标记为 project 且不能覆盖 packaged repository capability 的断言",
              "packaged trusted ledger entrypoint 仍解析到 resources/arcorbit/trusted-capabilities 的断言",
              "相关 capability、初始化和 Runtime 测试通过",
              "临时诊断标记无残留"
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
        "evidence": [
          "现有 technical_foundation 决定和 `arckit/tech/arcorbit/solution.md` 已明确项目同 ID manifest 不得覆盖 repository source；本轮建立的是实现偏差，不改变长期技术决定。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 150,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Product Workspace 的本地项目绑定能力和当前 Case 的恢复目标均已有明确持久事实；本轮根因不改变产品期望，只暴露实现偏差。",
            "fact_refs": [
              "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/cases/active/CASE-20260820-005-windows-arcorbit-ledger.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "“添加本地项目后完成绑定”的用户旅程仍清楚且可恢复；当前失败由实现 Gap 承接，不需要改变交互语义。",
            "fact_refs": [
              "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:75-76",
              "arckit/cases/active/CASE-20260820-005-windows-arcorbit-ledger.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮事实只涉及主进程 capability 来源解析与 Windows 文件系统边界，没有建立或改变视觉语言事实。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "权威技术方案已明确 repository source 与目标项目同 ID manifest 的隔离规则；本轮接受的跨盘根因完整解释实际偏差和必要修复边界。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md:160-171",
              "runtime/arcorbit/src/capability-registry.mjs:19-37,74-105,142-215",
              "runtime/arcorbit/src/ledger-scripts.mjs:16-39"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Windows 跨盘项目绑定仍会选择项目 capability，实际软件尚未兑现 packaged trusted capability 和可用绑定路径。",
            "fact_refs": [
              "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION"
            ],
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs:142-215",
              "Current operator error report"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "隔离推演已可信证明跨盘项目 manifest 能越过 repository source 分类，但该信任边界风险尚未被实现修复和回归测试控制。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP"
            ],
            "evidence": [
              "node:path.win32 isolated proof executed 2026-08-20",
              "runtime/arcorbit/src/capability-registry.mjs:142-215",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 3 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
            ]
          }
        ]
      },
      "evidence": [
        "用户错误中的安装盘 C: 与项目盘 D:",
        "`pick-project → addProject → ensureArckitProject → loadRuntimeCapabilityForEntrypoint → runLedgerScript` 调用链",
        "`node:path.win32` 隔离输出：relative 为 D: 绝对路径、currentIsWithin=true、crossVolume=true",
        "当前 macOS 安装包与本地 dist-package 均含 packaged trusted-ledger-operations.mjs，排除通用打包清单遗漏",
        "node --test runtime/arcorbit/test/capability-policy.test.mjs: 3 passed, 0 failed",
        "未添加临时日志或 `ARC_DEBUG` 标记"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260820-151555206Z",
      "occurred_at": "2026-08-20T15:21:51.404Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修正 capability 路径包含判断并补齐 Windows 跨盘和同 ID 来源优先级回归测试。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Gap 是唯一 ready 的当前 Case Gap，直接解除 Windows 项目绑定阻断和 trusted capability 来源越界风险。",
        "snapshot_token": "2b31a3639365b2c29ba9bb75efc36335278b8194a5988d6138f01cdee3d2df20",
        "selected_ref": "case-gap:CASE-20260820-005:GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
        "comparison_summary": "选择 Windows 跨盘 capability containment 实现 Gap。四个 Project Gap 均需另建 Case，且不能解除当前用户阻断，因此暂缓。",
        "fresh_discovery_summary": "本轮未发现新的实质 Gap；实现和验证均落在已接受的修复边界内。普通工作闭合后仍需由下一轮执行 Completion Review。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不解除当前 Windows 绑定故障。",
              "uncertainty": "长期场景验证仍有高不确定性。",
              "risk": "长期质量风险高。",
              "user_impact": "低于当前核心入口阻断。"
            },
            "reason": "需要独立 Case，不是当前实现前置。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接修复 capability 来源误判。",
              "uncertainty": "长期韧性验收仍开放。",
              "risk": "长期运行风险高。",
              "user_impact": "当前 Windows 项目绑定影响更直接。"
            },
            "reason": "需要独立 Case，暂缓。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前实现。",
              "uncertainty": "仍需真实权限项目证据。",
              "risk": "安全风险高。",
              "user_impact": "低于当前已复现入口故障。"
            },
            "reason": "需要独立 Case 和真实外部条件。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不解除当前 Windows 入口阻断。",
              "uncertainty": "跨记录漂移风险已知。",
              "risk": "高。",
              "user_impact": "当前用户故障优先。"
            },
            "reason": "虽为高紧迫长期事项，但需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260820-005:GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Windows 跨盘项目无法可靠绑定。",
              "uncertainty": "根因已确定，实现可直接验证。",
              "risk": "项目内容可越过 repository source 隔离。",
              "user_impact": "ArcOrbit 核心项目绑定路径不可用。"
            },
            "reason": "唯一就绪且直接承接已接受根因和三个 threatened impacts 的 Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
        "responsibility": "agent",
        "goal": "修复 capability 来源包含判断，使 Windows 不同盘符的项目 manifest 永远不能冒充或覆盖 packaged repository capability，并补充可重复的跨盘回归测试。",
        "reason": "诊断已证明 `isWithin` 对跨盘绝对 relative path 返回 true；必要修复应限定在 volume-aware/absolute-safe containment 与同 ID capability 优先级回归，不能通过复制项目 skill 或绕过 trusted source 规则掩盖。",
        "derived_from": [
          "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
          "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-TEST-GAP",
          "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
          "IMPACT-WINDOWS-BINDING-REALIZATION",
          "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Windows 跨盘项目仍无法可靠绑定。",
          "uncertainty": "根因已确定，具体最小实现需验证 path API 注入或 containment helper 的跨平台测试方式。",
          "risk": "未修复时项目内容可以越过 repository source 隔离。",
          "user_impact": "Windows 安装版核心项目绑定路径不可用。"
        },
        "evidence_required": [
          "Windows C: packaged root 与 D: project root 的同 ID manifest 回归测试",
          "项目 manifest 被标记为 project 且不能覆盖 packaged repository capability 的断言",
          "packaged trusted ledger entrypoint 仍解析到 resources/arcorbit/trusted-capabilities 的断言",
          "相关 capability、初始化和 Runtime 测试通过",
          "临时诊断标记无残留"
        ]
      },
      "planned_transition": {
        "goal": "修正 capability 路径包含判断并补齐 Windows 跨盘和同 ID 来源优先级回归测试。",
        "expected_state_change": "Windows 不同盘符的项目 manifest 被判定为 project source，无法覆盖 packaged repository capability；相关 threatened impacts 由直接代码和自动化证据转为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT",
          "status": "resolved",
          "outcome": "containment 现在拒绝不同卷产生的绝对 relative path，并精确处理父目录边界；Windows C: packaged root 与 D: project manifest 被正确隔离，项目同 ID capability 不能覆盖 trusted repository capability。",
          "reason": "根因路径已最小修复，跨盘路径测试、同 ID capability 选择测试和 ArcOrbit 全量检查均通过。",
          "evidence": [
            "runtime/arcorbit/src/capability-registry.mjs",
            "runtime/arcorbit/test/capability-policy.test.mjs",
            "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit capability 来源判断现在使用可注入 path API 的 `isPathWithin`，拒绝 `path.relative` 返回的绝对路径，并仅把空路径或非绝对、非父目录路径视为 contained。`path.win32` 回归证明 C: packaged capability root 与 D: project manifest 不相包含；集成回归证明项目同 ID capability 不能覆盖 repository capability，最终 entrypoint 保持在 packaged repository 根内。",
            "basis": "直接代码变更、Windows 路径语义测试、同 ID capability 加载测试和 ArcOrbit 全量检查。",
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WINDOWS-TRUSTED-LEDGER-RESOLUTION",
            "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 22
            },
            "effect": "upheld",
            "reason": "不同卷的项目 manifest 不再被误标为 repository，同 ID 项目 capability 无法覆盖 manifest-resolved packaged ledger capability。",
            "gap_ids": [],
            "evidence": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
              "runtime/arcorbit/src/capability-registry.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs"
            ]
          },
          {
            "id": "IMPACT-WINDOWS-BINDING-REALIZATION",
            "fact_id": "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "原始 C:/D: 触发条件已由 `path.win32` 回归覆盖，项目绑定的 ledger entrypoint 保持在 packaged trusted capability。",
            "gap_ids": [],
            "evidence": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-WINDOWS-CAPABILITY-TRUST-RISK",
            "fact_id": "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "跨盘来源误分类已被绝对路径拒绝规则控制，并有可重复的 Windows 路径与同 ID capability 选择证据。",
            "gap_ids": [],
            "evidence": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED",
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "npm --prefix runtime/arcorbit run check: 0 failed"
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
          "修复实现既有 `technical_foundation` 和 `arckit/tech/arcorbit/solution.md` 的 trusted repository source 决定，不改变长期软件定义。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 150,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本地项目绑定能力的产品期望未改变，并由当前 Case 与既有产品规格持续明确。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/cases/active/CASE-20260820-005-windows-arcorbit-ledger.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "添加本地项目并完成绑定的交互语义保持不变；主进程实现现在能够支持该既有路径。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:75-76",
              "runtime/arcorbit/test/capability-policy.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅修改主进程 capability 路径来源判断和自动化测试，没有建立或改变视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现与权威技术方案一致：Runtime 只选择 repository source，目标项目同 ID manifest 不能覆盖 trusted capability；新的 helper 和测试明确恢复了该边界。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md:160-171",
              "runtime/arcorbit/src/capability-registry.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受的跨盘根因获得直接实现修复；原始 C:/D: 条件和 packaged entrypoint 优先级均有自动化实现证据。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 231 tests, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "信任边界风险由最小 containment 修复控制；跨盘路径、项目覆盖尝试及全量回归提供可重复且与风险成比例的证据。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "node --test runtime/arcorbit/test/capability-policy.test.mjs: 5 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "`isPathWithin` rejects absolute relative paths and precise parent traversal",
        "Windows `path.win32` C:→D: regression passed",
        "project same-ID capability override regression passed",
        "packaged repository entrypoint assertion passed",
        "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
        "No `ARC_DEBUG` marker or temporary console logging remains",
        "git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260820-151555206Z",
      "occurred_at": "2026-08-20T15:24:57.324Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立复核 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case Gap 和 impacts 已闭合，Completion Review 是唯一 ready 的 Case 义务。",
        "snapshot_token": "769e1b0c126632c5f53ddf7a9f82f9c83eaf0cda67a936dd72dc7f79d538a219",
        "selected_ref": "case-gap:CASE-20260820-005:CASE-20260820-005:completion-review:1",
        "comparison_summary": "选择 CASE-20260820-005 Completion Review。四个 Project Gap 均需另建 Case且与当前 Case 收尾无直接依赖，因此暂缓。",
        "fresh_discovery_summary": "独立审查未发现新的错误、遗漏或过量实现，未产生 fresh repair Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Case 收尾。",
              "uncertainty": "长期场景验证仍有高不确定性。",
              "risk": "长期质量风险高。",
              "user_impact": "低于完成当前修复审查。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Completion Review。",
              "uncertainty": "长期韧性验收仍开放。",
              "risk": "长期运行风险高。",
              "user_impact": "与本次跨盘修复无直接依赖。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Case 关闭。",
              "uncertainty": "仍需真实权限项目证据。",
              "risk": "安全风险高。",
              "user_impact": "不是本次已界定信任边界修复的前置。"
            },
            "reason": "需要独立 Case 和外部条件。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Case 收尾。",
              "uncertainty": "跨记录漂移风险已知。",
              "risk": "高。",
              "user_impact": "当前 Case 已进入唯一 Review 义务。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260820-005:CASE-20260820-005:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "普通工作已闭合，Review 是 Case resolved 的最后门槛。",
              "uncertainty": "低；实现和测试证据已完整。",
              "risk": "需独立检查信任边界修复是否真实、最小且无回归。",
              "user_impact": "决定当前 Windows 修复能否可信关闭。"
            },
            "reason": "唯一 ready 的当前 Case candidate。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260820-005:completion-review:1",
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
        "goal": "独立复核 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "若五个维度均 clean，则接受 clean Completion Review 并关闭 Case；若发现问题，则只创建对应 review finding Gap。"
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
            "Reviewed final diff for runtime/arcorbit/src/capability-registry.mjs and runtime/arcorbit/test/capability-policy.test.mjs",
            "Targeted capability-policy suite rerun: 5 passed, 0 failed",
            "Independent path.win32 boundary matrix: same path, descendant, sibling, parent/outside, cross-drive and cross-UNC-server; 6 passed",
            "Prior accepted full ArcOrbit check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
            "git diff --check passed",
            "No ARC_DEBUG marker or temporary logging remains"
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
          "Review confirms the implementation realizes the existing technical_foundation decision without changing Project software definitions or invariants."
        ]
      },
      "invariant_assessment": {
        "project_revision": 150,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本地项目绑定的产品期望保持清楚，最终实现与当前 Case 的预期结果一致。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/cases/active/CASE-20260820-005-windows-arcorbit-ledger.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "添加本地项目并完成绑定的既有旅程保持完整；审查未发现需要改变交互语义的实现问题。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:75-76",
              "runtime/arcorbit/test/capability-policy.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 的内容仅涉及主进程路径来源判断和测试，没有视觉事实或呈现改动。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "最终 diff 精确实现 repository source 隔离规则；绝对 relative path、父目录边界和同 ID capability 优先级均可由代码和测试恢复。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md:160-171",
              "runtime/arcorbit/src/capability-registry.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立审查确认实现直接阻断原始 C:/D: 误分类链，target project capability 不再能成为 selected repository entrypoint。",
            "fact_refs": [
              "FACT-WINDOWS-PICK-PROJECT-MODULE-NOT-FOUND",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/capability-registry.mjs",
              "Targeted capability-policy suite: 5 passed, 0 failed",
              "Independent path.win32 boundary matrix: 6 passed",
              "Prior full ArcOrbit check: 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "信任边界控制具有根因级实现、跨盘确定性测试、同 ID 来源集成测试、额外边界矩阵和全量回归；证据与风险相称。",
            "fact_refs": [
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-MISCLASSIFICATION",
              "FACT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "Targeted capability-policy suite: 5 passed, 0 failed",
              "Independent path.win32 boundary matrix: 6 passed",
              "npm --prefix runtime/arcorbit run check: 231 tests, 229 passed, 2 environment-gated skips, 0 failed",
              "git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Implementation correctness: `isPathWithin` rejects absolute relative paths and precisely rejects `..` traversal while allowing same-path and descendants",
        "Problem resolution: original Windows C: installer/D: project condition is directly represented by path.win32 regression",
        "Verification credibility: targeted 5-test suite, independent 6-case boundary matrix and prior 231-test full check all passed",
        "Regression risk: packaged canonical/legacy root behavior and repository priority tests remain green",
        "Minimality: one containment helper replacement and two focused regression tests; no packaging, ledger, project initialization or fallback rewrites",
        "No temporary diagnostic code remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260820-151555206Z",
      "occurred_at": "2026-08-20T15:26:39.083Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-WINDOWS-LEDGER-RESOLUTION",
      "GAP-IMPLEMENT-WINDOWS-CROSS-DRIVE-CAPABILITY-CONTAINMENT"
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
    "updated_at": "2026-08-20T15:26:39.083Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
