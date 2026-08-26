# 完善 ArcOrbit 的 Codex CLI 安装、更新与显式登录引导

Case: CASE-20260825-010
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-26T00:42:58.867Z

## User Intent

让用户在 ArcOrbit Setup Readiness 内安全完成 Codex CLI 检测、官方 standalone 安装或更新、显式认证方式选择、官方登录流程和自动重新验证，同时保持 Renderer 无命令与凭证权限。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-010",
  "title": "完善 ArcOrbit 的 Codex CLI 安装、更新与显式登录引导",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-25T15:41:27.837Z",
  "updated_at": "2026-08-26T00:42:58.867Z",
  "user_intent": "让用户在 ArcOrbit Setup Readiness 内安全完成 Codex CLI 检测、官方 standalone 安装或更新、显式认证方式选择、官方登录流程和自动重新验证，同时保持 Renderer 无命令与凭证权限。",
  "expected_outcome": "macOS、Linux 和 Windows 用户无需预装 Node/npm/Homebrew，即可在 ArcOrbit 内恢复 Codex CLI 环境并完成显式登录；只有 CLI、版本、登录状态及其他 Setup Readiness 检查全部成功时进入 ready，且外部安装、活动任务和敏感凭证边界得到保护。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit Setup Readiness currently discovers candidate Codex executables, verifies them with codex --version, and blocks skill provisioning when Codex is unavailable; its main/preload IPC surface has no Codex installation, update, login-status, login, or logout actions.",
      "basis": "Direct inspection of the current ArcOrbit implementation.",
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    },
    {
      "id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit must orchestrate OpenAI's official standalone installer for installation and update on macOS, Linux, and Windows; require an explicit, non-preselected authentication choice; use official Codex login processes; determine authentication with codex login status; pass API keys and supported enterprise access tokens only through stdin; never inspect Codex credential files; and keep Codex authentication independent from Workshop authentication. Current official documentation publishes the cross-platform installer commands and the specified login, status, logout, device-code, API-key, and enterprise access-token interfaces.",
      "basis": "Current operator-confirmed product decisions corroborated by official OpenAI documentation.",
      "evidence": [
        "Current operator input, 2026-08-25",
        "https://learn.chatgpt.com/docs/codex/cli",
        "https://learn.chatgpt.com/docs/auth"
      ]
    },
    {
      "id": "FACT-20260825-010-001",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit durable product, interaction, and technical artifacts now define the accepted Codex CLI standalone installation/update, explicit non-preselected authentication, readiness, process-ownership, recovery, external-install preservation, and credential-safety contract; the current production implementation has not yet realized it.",
      "basis": "Direct inspection of the updated durable artifacts and unchanged production boundary.",
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    },
    {
      "id": "FACT-20260825-010-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit production code now implements the durable Codex Setup contract through executable provenance, fixed macOS/Linux/Windows standalone installer orchestration, explicit non-preselected authentication, login-status verification, active-owner update guards, stdin-only API/access-token transport, typed main/preload/renderer actions, recoverable operation states, and automatic post-operation revalidation without application restart.",
      "basis": "Direct inspection and execution of the production implementation, focused cross-layer tests, real Electron Setup verification, current-host Codex status probing, and the complete ArcOrbit validation entrypoint.",
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
        "Verification: current-host CodexSetupManager inspection returned ready with executable provenance, version, authenticated status, and capability projection"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-CODEX-SETUP-PRODUCT-CAPABILITIES",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 32
      },
      "effect": "upheld",
      "reason": "The product capability is now explicitly and durably defined.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md"
      ]
    },
    {
      "id": "IMPACT-CODEX-SETUP-EXPERIENCE",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 48
      },
      "effect": "upheld",
      "reason": "The interaction source and synchronized wireframe now define all unselected choices, progress, cancellation, timeout, failure, retry and automatic revalidation states.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html"
      ]
    },
    {
      "id": "IMPACT-CODEX-SETUP-IDENTITY",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "identity_and_access",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "The identity decision now preserves Codex and Workshop authentication as separate state domains and defines supported explicit credential choices.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "https://learn.chatgpt.com/docs/auth"
      ]
    },
    {
      "id": "IMPACT-CODEX-SETUP-SECURITY",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "security_privacy_compliance",
        "revision": 5
      },
      "effect": "upheld",
      "reason": "The security decision now records stdin-only secret transport, zero credential-file access, redacted diagnostics and structured Renderer boundaries.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-CODEX-SETUP-TECHNICAL-FOUNDATION",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 36
      },
      "effect": "upheld",
      "reason": "The technical foundation now defines CodexSetupManager, process ownership, typed IPC, update guards and post-operation verification.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-20260825-010-001",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 12
      },
      "effect": "upheld",
      "reason": "The integration decision now identifies official standalone installer and Codex authentication commands as fixed main-process integrations with explicit recovery behavior.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "https://learn.chatgpt.com/docs/codex/cli",
        "https://learn.chatgpt.com/docs/auth"
      ]
    },
    {
      "id": "IMPACT-20260825-010-002",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 12
      },
      "effect": "upheld",
      "reason": "The validation decision now requires cross-platform installer, login-state, typed IPC, active-task guard and secret-leakage evidence.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-20260825-010-003",
      "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 7
      },
      "effect": "upheld",
      "reason": "The delivery decision now distinguishes ArcOrbit packaging from runtime orchestration of the official, non-redistributed Codex standalone installer.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-20260825-010-004",
      "fact_id": "FACT-20260825-010-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Production resolver, manager, IPC, Renderer and Runtime readiness boundaries now realize the accepted Codex Setup contract.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260825-010-005",
      "fact_id": "FACT-20260825-010-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Repeatable tests now cover fixed cross-platform installer specs, provenance and external-install preservation, active-owner update blocking, capability-gated explicit authentication, stdin-only secrets, sanitized failure/cancellation, status verification and Electron revalidation.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
        "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DURABLE-CODEX-SETUP-CONTRACT",
      "status": "resolved",
      "goal": "Make the accepted Codex CLI installation, update, explicit authentication, readiness-state, process-ownership, recovery, and credential-safety contract durably recoverable before implementation.",
      "reason": "The new operator-confirmed facts materially change product, interaction, identity, security, integration, and technical expectations, while current durable decisions and artifacts do not yet contain those boundaries. Implementation scope and acceptance depend on first establishing this contract.",
      "derived_from": [
        "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
        "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
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
        "Durable product specification covering install/update/authentication/readiness behavior and non-goals.",
        "Durable interaction specification covering explicit unselected choices, progress, success, cancellation, timeout, failure, retry, and automatic revalidation.",
        "Durable technical contract covering official platform installers, controlled process execution, typed IPC, running-task update guard, stdin-only secrets, status verification, and external-install preservation.",
        "Project decision changes that accurately reflect the accepted contract and cite official OpenAI documentation."
      ],
      "resolution": {
        "id": "GAP-DURABLE-CODEX-SETUP-CONTRACT",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "产品规格、交互策略/线框和技术方案已经共同覆盖安装、更新、显式认证、状态、恢复、进程与安全边界，并引用 OpenAI 官方安装和认证文档。",
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "https://learn.chatgpt.com/docs/codex/cli",
          "https://learn.chatgpt.com/docs/auth",
          "Verification: git diff --check passed",
          "Verification: 13 interaction details each contain one trigger, wireframe canvas/device frame, component list, and interaction behavior",
          "Verification: 29 installation/authentication/platform/security contract terms present; 0 missing"
        ],
        "occurred_at": "2026-08-25T16:00:10.487Z"
      }
    },
    {
      "id": "GAP-20260825-010-001",
      "status": "resolved",
      "goal": "Implement and verify the accepted Codex CLI installation, update and explicit authentication setup flow across resolver, controlled main-process manager, typed IPC, Setup Readiness renderer and existing Runtime consumers.",
      "reason": "The contract is now durable, but current production code still only discovers and version-probes Codex and has no installation, update, authentication or logout actions.",
      "derived_from": [
        "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
        "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
        "FACT-20260825-010-001"
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
        "Unit evidence for executable provenance, platform installer orchestration, operation state transitions, status exit-code handling, active-task update guards and retry/cancellation.",
        "Security evidence that API Key/Access Token enter only child stdin and never argv, environment, logs, errors, stores or shared Renderer state; ArcOrbit performs zero credential-file access.",
        "Typed main/preload/renderer evidence for no default selections, disabled continuation, capability-gated options and structured actions without arbitrary commands.",
        "Electron integration evidence for install/update/login success, cancellation, timeout and failure with automatic revalidation and no application restart.",
        "Regression evidence for existing Setup Readiness, Chat and Automation flows, plus platform-appropriate macOS, Linux and Windows installer validation."
      ],
      "resolution": {
        "id": "GAP-20260825-010-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "resolver、CodexSetupManager、main/preload typed IPC、Setup Renderer 和 Runtime consumers 已共同实现接受契约；定向、跨层、真实 Electron 与完整回归证据覆盖三平台固定 installer、显式认证、secret transport、活动 owner 门禁、失败恢复和无需重启的自动复核。",
        "evidence": [
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
          "Verification: real Setup Electron regression passed",
          "Verification: git diff --check passed",
          "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection",
          "https://learn.chatgpt.com/docs/codex/cli",
          "https://learn.chatgpt.com/docs/auth"
        ],
        "occurred_at": "2026-08-25T16:52:06.495Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-001",
      "status": "resolved",
      "goal": "Resolve review finding: 设备码登录由隐藏子进程执行，但 manager 和 Renderer 未投影经清理的验证 URL 与一次性 device code，用户无法完成官方 device-auth 流程。",
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
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:157",
        "runtime/arcorbit/src/codex-setup-manager.mjs:284",
        "runtime/arcorbit/desktop/renderer/renderer.js:725",
        "https://learn.chatgpt.com/docs/auth"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Device-auth 子进程的流式输出现在经 ANSI/control 清理、HTTPS 与 OpenAI/ChatGPT hostname 白名单过滤后，只将 verification_url 和 user_code 投影到当前 operation；Renderer 通过 textContent 显示 challenge，操作结束后既有生命周期会清除该数据。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: focused Codex Setup manager and Desktop Renderer suites — 64 passed, 0 failed",
          "Verification: real Setup Electron regression — 1 passed, 0 failed",
          "Verification: npm run check — 454 tests, 443 passed, 11 environment-gated skips, 0 failed",
          "Verification: git diff --check passed",
          "https://learn.chatgpt.com/docs/auth"
        ],
        "occurred_at": "2026-08-25T17:09:35.266Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
      "status": "resolved",
      "goal": "Resolve review finding: 登录取消、超时或失败后没有自动重新运行 `codex login status`；status probe 异常会直接 reject，非零退出码也始终映射为 selection-required，未实现 logged-out、expired 与 login-failed 的接受状态语义。",
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
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:62",
        "runtime/arcorbit/src/codex-setup-manager.mjs:92",
        "runtime/arcorbit/src/codex-setup-manager.mjs:104",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:158"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "CodexSetupManager 现在安全收敛 login status 的 spawn、timeout 和畸形结果；零退出码投影 authenticated，普通非零投影 logged-out，既有认证失效投影 expired，显式 logout 保持 logged-out。登录进程失败、超时或取消后先投影 rechecking 并 fresh-run status；只有 status 为零才返回 ready，否则投影无敏感诊断的 login-failed。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Codex Setup manager and Desktop Renderer suites — 67 passed, 0 failed",
          "Verification: real Setup Electron regression — 1 passed, 0 failed",
          "Verification: npm run check — 457 tests, 446 passed, 11 environment-gated skips, 0 failed",
          "Verification: git diff --check passed",
          "https://learn.chatgpt.com/docs/auth"
        ],
        "occurred_at": "2026-08-25T17:15:45.073Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
      "status": "resolved",
      "goal": "Resolve review finding: standalone migration 只改变 resolver 候选顺序并检查任意 Codex 是否可用；若 discovery 回退到原外部 executable，操作仍可能被当作成功，未证明 ArcOrbit 已选择 standalone 或 PATH 冲突已消除。",
      "reason": "omission found by completion review",
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
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-executable-resolver.mjs:104",
        "runtime/arcorbit/src/codex-setup-manager.mjs:139",
        "runtime/arcorbit/src/codex-setup-manager.mjs:102",
        "arckit/tech/arcorbit/installer-supply-chain.md:330"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "CodexSetupManager 的 migration 现在具有专用 postcondition：installer 完成并切换 resolver preference 后，fresh inspection 必须证明 executable 可用且 provenance 为 standalone。若 discovery 回退到 configured、npm、Homebrew 或 unknown-external，manager 返回 `migrate-failed` 和 `MIGRATION_POSTCONDITION_FAILED`，保留真实 command/provenance，并提示处理 executable 配置或 PATH 冲突。Resolver 测试同时证明 standalone 与 external 候选并存时，显式 preference 会实际选择、版本验证并缓存 standalone。",
        "evidence": [
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Resolver, Codex Setup Manager and Desktop Renderer suites — 78 passed, 0 failed",
          "Verification: real Setup Electron regression — 1 passed, 0 failed",
          "Verification: npm run check — 460 tests, 449 passed, 11 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T17:23:39.378Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
      "status": "resolved",
      "goal": "Resolve review finding: official installer 下载直接对响应调用 `arrayBuffer()`，没有执行 durable technical contract 要求的响应大小上限，留下不必要的内存与供应链资源风险。",
      "reason": "omission found by completion review",
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
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:270",
        "runtime/arcorbit/src/codex-setup-manager.mjs:273",
        "arckit/tech/arcorbit/installer-supply-chain.md:331"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "`runOfficialInstaller` 已移除无界 `arrayBuffer()`：先检查 Content-Length，再通过 Web Stream 逐块累计实际字节；任一边界超过固定 1 MiB 上限都会取消流并返回 `INSTALLER_RESPONSE_TOO_LARGE`，且不会启动 installer 进程。正常响应仍写入 owner-only 临时文件、执行并在结束后清理。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Codex Setup manager and Desktop Renderer suites — 68 passed, 0 failed",
          "Verification: real Setup Electron regression — 1 passed, 0 failed",
          "Verification: npm run check — 458 tests, 447 passed, 11 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T17:20:04.030Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-005",
      "status": "resolved",
      "goal": "Resolve review finding: 现有 Electron fixture 只验证 API Key 的 Renderer 成功路径，未通过生产 main/preload/manager 覆盖 install、update、浏览器/设备码登录的成功、取消、超时和失败，因此不足以支持已声明的 Electron 集成验收。",
      "reason": "omission found by completion review",
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
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs:36",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs:70",
        "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs:132",
        "Verification: focused resolver/manager/renderer suite passed 70 tests but did not exercise the missing production Electron recovery matrix"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-005",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Codex Setup IPC handlers 与登录输入收敛已抽成 Desktop main 实际注册的生产模块。Electron fixture 通过该模块、真实 `desktop/preload.cjs` 和真实 CodexSetupManager 执行受控矩阵；只有 resolver、installer 和 process 外部依赖在 main process 注入。测试证明安装与更新使用固定官方 URL，浏览器与设备码登录使用固定 argv，设备 challenge 经结构化事件投影，取消、超时和失败均执行 fresh status recheck、清除 operation 并返回稳定结果。",
        "evidence": [
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-ipc.html",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
          "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T17:34:18.823Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-006",
      "status": "resolved",
      "goal": "Resolve review finding: 生产 Codex Setup IPC handlers 没有校验调用窗口 sender，也没有接收或验证一次性 confirmation id、operation id 与调用时的 authoritative snapshot。安装、更新、迁移、取消和登录等高权限动作因此可以绕过 Renderer 确认直接调用；并发调用还可能在前置检查完成后排队执行。现有 Electron 矩阵只证明成功与恢复路径，没有证明未授权 sender、缺失确认、过期状态或重放调用会 fail closed。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:7"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:14",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:23",
        "runtime/arcorbit/desktop/main.mjs:409",
        "runtime/arcorbit/desktop/main.mjs:673",
        "arckit/tech/arcorbit/installer-supply-chain.md:365",
        "arckit/tech/arcorbit/installer-supply-chain.md:376",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs:47",
        "Verification: git diff --check passed; static review found no negative IPC authority/confirmation/replay assertion in the production Electron matrix"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-006",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "生产 IPC 现在验证调用窗口 sender；安装、更新、迁移和退出使用由 main-process 原生对话框签发、绑定 action 与 authoritative snapshot、消费即失效的一次性 confirmation；取消必须匹配当前 operation id；所有 mutation 在同一串行临界区内重新检查 fresh state。负向测试证明未授权 sender、缺失或过期确认、确认重放、错误 operation id 和并发陈旧前置条件均被拒绝。",
        "evidence": [
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 72 passed, 0 failed",
          "Verification: real Setup Electron authority and recovery matrix — 1 passed, 0 failed",
          "Verification: npm run check with real Setup Electron matrix — 463 tests, 453 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T17:48:53.651Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-007",
      "status": "resolved",
      "goal": "Resolve review finding: Codex browser、device、API Key 和 Access Token 登录 IPC 仍只校验 sender，未取得或消费绑定 authoritative snapshot 的一次性 confirmation。主窗口 Renderer 因此可以直接启动登录流程；现有 Electron 矩阵也直接调用 loginCodex，未证明缺失、过期或重放登录确认会 fail closed。这没有完整解决 FINDING-006 明确包含的登录高权限动作确认边界。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:8"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:44",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:47",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:50",
        "runtime/arcorbit/desktop/renderer/renderer.js:314",
        "runtime/arcorbit/desktop/renderer/renderer.js:320",
        "runtime/arcorbit/desktop/renderer/renderer.js:323",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:194",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:201",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:208",
        "arckit/tech/arcorbit/installer-supply-chain.md:376",
        "Verification: 72 focused tests passed while no test required a login confirmation id"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-007",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "生产 main/preload/Renderer 与 Codex Setup IPC 已将全部登录方式纳入统一确认边界。confirmation 绑定当前 authoritative snapshot 和规范化 method/flow、消费即失效；API Key 与 Access Token secret 不进入确认请求或确认存储。Node 与真实 Electron 负向测试直接证明缺失确认、登录意图错配和重放均被拒绝。",
        "evidence": [
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 73 passed, 0 failed",
          "Verification: real Setup Electron authority and recovery matrix — 1 passed, 0 failed",
          "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T18:01:28.685Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-008",
      "status": "resolved",
      "goal": "Resolve review finding: Renderer 只根据 operation 是否存在显示并启用取消按钮，忽略 operation.cancellable 和 operation.id。登录失败后的 rechecking 状态明确标记 cancellable=false 且没有 id；安装或登录任务结束后的 fresh inspection 期间也可能保留旧 operation 但 manager 已清除 controller。用户会看到可用取消动作，但点击无反馈或收到 OPERATION_NOT_ACTIVE，违反可取消阶段必须绑定当前 operation id 的交互语义。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:8"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:147",
        "runtime/arcorbit/src/codex-setup-manager.mjs:154",
        "runtime/arcorbit/src/codex-setup-manager.mjs:286",
        "runtime/arcorbit/desktop/renderer/renderer.js:328",
        "runtime/arcorbit/desktop/renderer/renderer.js:330",
        "runtime/arcorbit/desktop/renderer/renderer.js:721",
        "runtime/arcorbit/desktop/renderer/renderer.js:722",
        "arckit/interaction/setup-readiness/interaction.md:164",
        "Verification: focused tests exercise active cancellation and rechecking observation but do not assert that the cancel control is hidden or disabled during non-cancellable phases"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-008",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Renderer 现在仅在 operation.cancellable=true 且 operation.id 非空时显示并启用取消按钮，点击处理器也重复执行同一双重门禁。真实 Electron fixture 证明活动可取消 operation 的控件可用，而无 id、cancellable=false 的 rechecking 状态隐藏并禁用控件；即使强制派发点击事件也不会调用取消 IPC。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 73 passed, 0 failed",
          "Verification: real Setup Electron matrix — 1 passed, 0 failed",
          "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T18:06:16.965Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
      "status": "resolved",
      "goal": "Resolve review finding: 成功的 install、update、migrate、login 或 logout task 结束后，manager 先清除 currentController/currentOperationId，再开始 fresh inspection，但旧 snapshot 仍保留 cancellable=true 和 operation id。Renderer 因此继续显示并启用取消按钮，而点击必然得到 OPERATION_NOT_ACTIVE；FINDING-008 所描述的成功后 fresh-inspection 窗口仍未解决。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:10"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs:141",
        "runtime/arcorbit/src/codex-setup-manager.mjs:143",
        "runtime/arcorbit/src/codex-setup-manager.mjs:280",
        "runtime/arcorbit/desktop/renderer/renderer.js:721",
        "Direct probe: while the post-install probe was blocked, snapshot.operation retained id and cancellable=true, while cancel returned OPERATION_NOT_ACTIVE",
        "Verification: existing Electron matrix injects a synthetic cancellable=false rechecking snapshot but does not hold the production manager inside successful post-task inspection"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "共享 mutation 成功路径现在在清除 currentController/currentOperationId 后、调用 fresh inspect 前立即发布 `checking` 与 `{kind, phase:'rechecking', cancellable:false}`；失败复核复用同一状态发布边界。阻塞 post-install probe 的单元测试和真实 Electron production main/preload/manager 矩阵均证明该窗口没有 operation id、不可取消，旧 operation id 被 OPERATION_NOT_ACTIVE 拒绝，最终成功状态仍正常完成。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "Verification: Codex Setup Manager — 23 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 86 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: full ArcOrbit inventory — 472 tests: 459 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax checks passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T18:29:23.274Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-010",
      "status": "resolved",
      "goal": "Resolve review finding: install、update 和 migration 未启用 failure recheck。若 installer 在部分写入后失败、超时或被取消，catch 路径直接复用操作前 snapshot，并将 operation 清空；它不会执行 durable contract 要求的 fresh executable discovery/version probe，因此可能错误显示 Codex 仍缺失或继续显示旧版本/来源。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:10"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:116",
        "runtime/arcorbit/src/codex-setup-manager.mjs:146",
        "runtime/arcorbit/src/codex-setup-manager.mjs:178",
        "runtime/arcorbit/src/codex-setup-manager.mjs:188",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:304",
        "arckit/spec/arcorbit-distribution.md:154",
        "arckit/tech/arcorbit/installer-supply-chain.md:338",
        "Direct probe: an installer that made Codex available and then threw PROCESS_TIMEOUT produced probes=1, status=install-failed, installation.available=false"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-010",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "共用 mutation 失败路径现在区分 login 与 installer 语义。install、update、migrate 启用 failure recheck：controller 清除后先投影不可取消的 rechecking，再执行 fresh inspection；返回时保留 cancelled 或对应 operation-failed 状态及原错误 code，同时采用最新 executable provenance、command 和 version projection。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 21 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 84 passed, 0 failed",
          "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: npm run check — 470 tests: 457 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron cases reran outside sandbox and passed 2/2",
          "Verification: node syntax check passed",
          "Verification: no ARC_DEBUG or temporary console markers remain"
        ],
        "occurred_at": "2026-08-25T18:18:03.575Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-011",
      "status": "resolved",
      "goal": "Resolve review finding: logout 只要求 `codex logout` 子进程退出码为 0，随后通用 inspect 若发现 `codex login status` 仍为 0，就返回 ready/authenticated 且 error=null。技术契约明确要求 logout 必须以非零 status 复核，异常结果应保留可重试错误；当前实现会把未真正退出误报为成功。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:10"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:91",
        "runtime/arcorbit/src/codex-setup-manager.mjs:101",
        "runtime/arcorbit/src/codex-setup-manager.mjs:268",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:169",
        "arckit/spec/arcorbit-distribution.md:152",
        "arckit/tech/arcorbit/installer-supply-chain.md:357",
        "Direct probe: logout exit 0 followed by login status exit 0 returned status=ready, authentication=authenticated, error=null"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-011",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "CodexSetupManager 的 logout 现在执行专用 postcondition：fresh inspection 只有得到 selection-required/logged-out 才成功；仍 authenticated 返回 logout-failed/LOGOUT_POSTCONDITION_FAILED，status probe 异常返回 logout-failed 与原稳定 status error。负向测试同时验证错误可重试且敏感诊断不进入 snapshot。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 22 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 85 passed, 0 failed",
          "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: full ArcOrbit inventory — 471 tests: 458 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron files reran outside sandbox and passed 2/2",
          "Verification: node syntax check passed and no ARC_DEBUG or temporary console markers were found"
        ],
        "occurred_at": "2026-08-25T18:24:53.187Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-012",
      "status": "resolved",
      "goal": "Resolve review finding: login 子进程退出码为 0 后，通用成功路径虽 fresh-run `codex login status`，却没有要求复核结果必须 authenticated。若 status 非零，manager 返回 `selection-required`、`logged-out` 且 `error=null`，把未完成认证投影成普通未选择状态，而不是接受契约要求的可重试 `login-failed`。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:13"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:125",
        "runtime/arcorbit/src/codex-setup-manager.mjs:153",
        "runtime/arcorbit/src/codex-setup-manager.mjs:154",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
        "arckit/spec/arcorbit-distribution.md:152",
        "arckit/spec/arcorbit-distribution.md:154",
        "arckit/tech/arcorbit/installer-supply-chain.md:357",
        "Direct probe: login --with-api-key exit 0 followed by login status exit 1 returned status=selection-required, authentication=logged-out, error=null"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-012",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "login mutation 现在复用既有 validatePostcondition 边界，要求 fresh inspection 同时得到 status=ready 与 authentication.authenticated=true；否则触发 LOGIN_POSTCONDITION_FAILED，并由既有 failure recheck 收敛为无敏感信息的 login-failed。新增负向测试证明登录子进程退出 0、status 持续非零时不会再返回无错误 logged-out，且一次性 secret 不进入 snapshot。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 24 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 87 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: full ArcOrbit inventory — 473 tests: 460 passed, 11 environment-gated skips, 2 GUI-sandbox aborts; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax and git diff checks passed; no temporary debug markers found"
        ],
        "occurred_at": "2026-08-25T18:40:35.241Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-013",
      "status": "resolved",
      "goal": "Resolve review finding: official installer 返回成功后，install 的通用成功路径没有要求 fresh discovery/version probe 必须证明 Codex 可用。若 installer 退出 0 但 discovery 仍为 missing，manager 返回 `missing` 且 `error=null`，没有投影稳定的 install-failed 分类、失败位置或重试反馈，仍把 process exit 当成了足够的成功依据。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:13"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:125",
        "runtime/arcorbit/src/codex-setup-manager.mjs:153",
        "runtime/arcorbit/src/codex-setup-manager.mjs:154",
        "runtime/arcorbit/src/codex-setup-manager.mjs:205",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:287",
        "arckit/spec/arcorbit-distribution.md:154",
        "arckit/tech/arcorbit/installer-supply-chain.md:336",
        "arckit/tech/arcorbit/installer-supply-chain.md:338",
        "Direct probe: installerRunner completed successfully while fresh probe remained unavailable; manager returned status=missing, installation.available=false, error=null"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-013",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "install mutation 现在通过既有 validatePostcondition 边界要求 fresh inspection 的 installation.available=true。若 installer 成功但 discovery 仍 missing，则抛出 INSTALL_POSTCONDITION_FAILED，并由既有 failure recheck 收敛为 install-failed，同时保留最新安装投影和可重试错误。新增负向测试重复证明该行为。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 25 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 88 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: full ArcOrbit inventory — 474 tests: 461 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T18:45:53.444Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-014",
      "status": "resolved",
      "goal": "Resolve review finding: standalone update 的通用成功路径没有要求 fresh discovery/version probe 继续证明 Codex 可用且仍为 standalone。若 installer 退出 0 后 discovery 变为 missing，manager 返回 `missing`、installation.available=false、error=null，而不是稳定、可重试的 `update-failed`；process exit 仍可替代 update 的成功后置条件。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:15"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:229",
        "runtime/arcorbit/src/codex-setup-manager.mjs:241",
        "arckit/tech/arcorbit/installer-supply-chain.md:336",
        "Direct probe: proven standalone update installer returned success, subsequent probe returned missing; manager returned status=missing, installation.available=false, error=null",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
        "arckit/spec/arcorbit-distribution.md:123",
        "arckit/spec/arcorbit-distribution.md:125"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-014",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "update mutation 现在复用既有 validatePostcondition/failure-recheck 边界，要求 fresh inspection 的 installation.available=true 且 provenance=standalone。否则产生 UPDATE_POSTCONDITION_FAILED，并在再次 fresh inspection 后稳定投影 update-failed、真实 installation state/provenance 与可重试错误。新增负向测试同时覆盖 post-probe missing 和回退到 configured external。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 27 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 90 passed, 0 failed",
          "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 476 tests: 463 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T18:55:28.884Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-015",
      "status": "resolved",
      "goal": "Resolve review finding: install mutation 未启用活动 Codex owner 门禁。即使 activeOwners 返回正在运行的 Automation execution，manager 仍执行 official installer，owner provider 未被调用；这违反 durable technical contract 对 install、update、migration 统一进程所有权检查的要求，并可能在活动 Codex 进程期间改变 executable。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:15"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:205",
        "runtime/arcorbit/src/codex-setup-manager.mjs:226",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
        "arckit/tech/arcorbit/installer-supply-chain.md:338",
        "Direct probe: activeOwners returned one Automation owner, yet install invoked installerRunner once, never called activeOwners, and returned ready"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-015",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "install mutation 已启用共用 `guardOwners` 边界。prepare 完成后、创建 operation/controller 和执行 installer 前，manager 会查询 activeOwners；任何活动 Automation、Chat 或 Codex owner 都产生 CODEX_OWNER_ACTIVE。新增负向测试证明 owner provider 被调用一次且 installer 完全未启动。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 26 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 89 passed, 0 failed",
          "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 475 tests: 462 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T18:52:25.629Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-016",
      "status": "resolved",
      "goal": "Resolve review finding: 生产 `runControlledProcess` 在 cancel 或 timeout 时调用 `child.kill()` 后立即 reject，而不是等待 child `close`。上层 mutation 因此会在 installer/login 子进程仍可能运行时开始 fresh discovery/login-status recheck，造成状态竞态。直接探针中，子进程收到 SIGTERM 后延迟 700ms 退出，但 Promise 在 251ms 即返回 ABORT_ERR；现有取消/超时测试使用注入 runner，未覆盖真实进程终止顺序。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:17"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:517",
        "runtime/arcorbit/src/codex-setup-manager.mjs:521",
        "runtime/arcorbit/src/codex-setup-manager.mjs:534",
        "arckit/tech/arcorbit/installer-supply-chain.md:338",
        "Direct process probe: SIGTERM handler delayed exit by 700ms while runControlledProcess rejected with ABORT_ERR after 251ms",
        "Verification: Codex Setup Manager — 27 passed, 0 failed despite the reproduced production lifecycle race"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-016",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "`runControlledProcess` 现在暂存取消或超时错误，先请求子进程终止，必要时在 2 秒后强制 kill，并仅在 child `close` 后以原始 ABORT_ERR 或 PROCESS_TIMEOUT 拒绝。真实 Node 子进程测试分别证明 cancel 与 timeout 在收到 SIGTERM 后仍保持 Promise pending，直到延迟退出产生 close；上层 mutation 因此不会再与仍运行的 installer/login 并发执行 fresh recheck。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: direct real-child cancel and timeout close-order regression passed",
          "Verification: Codex Setup Manager — 28 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 91 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 477 tests: 464 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T19:08:17.443Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
      "status": "resolved",
      "goal": "Resolve review finding: active-owner guard 只抛出 `CODEX_OWNER_ACTIVE` 和 owner 数量，没有返回 durable technical contract 指定的 `CODEX_UPDATE_ACTIVE_TASKS` 或无敏感 owner/execution refs；Renderer 因而无法兑现交互契约要求的具体 Chat/Automation 阻塞 owner 列表。现有测试只断言 installer 未启动和当前实现 code，没有验证恢复投影。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:17"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:550",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:355",
        "arckit/interaction/setup-readiness/interaction.md:37",
        "arckit/interaction/setup-readiness/interaction.md:88",
        "arckit/tech/arcorbit/installer-supply-chain.md:338"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "manager 现在对活动 owner 返回 `CODEX_UPDATE_ACTIVE_TASKS`，将净化、去重、限长后的 `{kind,id}` 写入 authoritative error snapshot；Renderer 显示 Automation/Chat/Codex 阻塞引用并禁用 install/update/migrate。直接测试证明错误和 snapshot 一致、敏感或异常字段不投影、installer 不启动；生产 preload/IPC 与真实 Electron Renderer 回归证明跨层恢复投影可见且 fail closed。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 93 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 479 tests: 466 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
          "Verification: syntax checks, git diff --check and temporary-marker scan passed"
        ],
        "occurred_at": "2026-08-25T19:22:54.560Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
      "status": "resolved",
      "goal": "Resolve review finding: API Key 与 Access Token 当前作为不可覆盖的原始字符串写入 `spec.stdin`，`runControlledProcess` 直接 `child.stdin.end(String(stdin))`；没有追加 durable technical contract 要求的 line terminator，也没有在 spawn/write 后覆盖可控 secret buffer。现有测试反而断言 stdin 与原始 secret 完全相等，未证明 framing 与内存生命周期边界。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:17"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:387",
        "runtime/arcorbit/src/codex-setup-manager.mjs:504",
        "runtime/arcorbit/src/codex-setup-manager.mjs:537",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:39",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
        "arckit/tech/arcorbit/installer-supply-chain.md:346",
        "arckit/tech/arcorbit/installer-supply-chain.md:353"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "`buildCodexLoginSpec` 现在只为 API Key/Access Token 创建 `secret + \\n` 的 Buffer；`runControlledProcess` 在 child stdin 写入完成回调中归零该 Buffer，并在 process finish 与注入 runner 退出时执行兜底清理。真实 Node child 回归证明收到恰好一条以换行结束的凭证输入，且 child 尚未 close 时源 Buffer 已全部归零；manager 注入测试还证明 runner 完成后的 Buffer 不再保留 secret。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: real child received exactly one newline-terminated stdin record and the source Buffer was zeroed before child close",
          "Verification: Codex Setup Manager — 29 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 92 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 478 tests: 465 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax and git diff checks passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-25T19:14:12.043Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-019",
      "status": "resolved",
      "goal": "Resolve review finding: 非-standalone update 前置条件返回 `UPDATE_EXTERNAL_INSTALL`，而 durable technical contract 定义的稳定恢复 code 是 `CODEX_EXTERNAL_INSTALLATION`。当前测试没有覆盖该拒绝路径的 code，导致实现与可恢复错误契约漂移。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:17"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:236",
        "arckit/tech/arcorbit/installer-supply-chain.md:327",
        "Verification: source/test search found no CODEX_EXTERNAL_INSTALLATION assertion in production manager tests"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-019",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "`update()` 的 fresh precondition 现在对所有非-standalone provenance 返回 durable stable code `CODEX_EXTERNAL_INSTALLATION`。新增参数化负向测试覆盖 configured、npm、homebrew 与 unknown-external，证明错误 stage 保持 update、真实 provenance 保留且 installer 完全未启动。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 31 passed, 0 failed",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 480 tests: 467 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
          "Verification: syntax checks, git diff --check and temporary-marker scan passed"
        ],
        "occurred_at": "2026-08-25T19:25:31.333Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-020",
      "status": "resolved",
      "goal": "Resolve review finding: CodexSetupManager 的 operation projection 只有 id、kind、phase 与 cancellable，没有 durable technical contract 要求的 started_at；Renderer 因而无法显示 login-in-progress 的等待时间。安装、更新或登录后的自动复核也只投影通用 rechecking，没有依次展示 executable discovery、version probe、login status 与后续 readiness。现有测试只验证 rechecking 存在，未覆盖这些可观察状态要求。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:21"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/arcorbit/installer-supply-chain.md:323",
        "arckit/interaction/setup-readiness/interaction.md:87",
        "arckit/interaction/setup-readiness/interaction.md:96",
        "arckit/interaction/setup-readiness/interaction.md:167",
        "runtime/arcorbit/src/codex-setup-manager.mjs:120",
        "runtime/arcorbit/src/codex-setup-manager.mjs:147",
        "runtime/arcorbit/desktop/renderer/renderer.js:741",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:587",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs:68",
        "Direct event probe: phases=[starting,downloading,executing,discovering,rechecking], operation_keys=[id,kind,phase,cancellable], has_started_at=false",
        "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced projection omission"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-020",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "CodexSetupManager 现在为每次 mutation 创建一个 ISO started_at，并在启动、进度、device-auth 与不可取消复核阶段保持一致。自动复核依次发布 rechecking-executable、rechecking-version、rechecking-login-status、rechecking-readiness；Renderer 将阶段转成可读反馈并每秒更新等待时间。Manager、静态 Renderer 和真实 Electron production matrix 均直接验证该行为。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 480 tests: 467 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary diagnostic markers added"
        ],
        "occurred_at": "2026-08-25T19:40:48.870Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-021",
      "status": "resolved",
      "goal": "Resolve review finding: CodexSetupManager 新增的自动复核阶段没有绑定对应的真实工作。`probeExecutable` 内部同时执行 executable discovery 与 `codex --version`，但 manager 只在整个 probe 返回后才发布 `rechecking-version`；随后 `rechecking-login-status` 与 `rechecking-readiness` 几乎立即发布。真正的 project skill readiness 则由 `refreshAfterCodexOperation` 在 manager 已清空 operation 后执行。因此 Renderer 显示的 version 与其它 readiness 阶段是瞬时标签，不能可信表示当前正在执行或失败的复核步骤。现有测试只断言四个 phase 的数组顺序，没有阻塞各底层动作来验证阶段时序。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:22"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs:56",
        "runtime/arcorbit/src/codex-setup-manager.mjs:58",
        "runtime/arcorbit/src/codex-setup-manager.mjs:72",
        "runtime/arcorbit/src/codex-setup-manager.mjs:85",
        "runtime/arcorbit/src/codex-executable-resolver.mjs:37",
        "runtime/arcorbit/src/codex-executable-resolver.mjs:49",
        "runtime/arcorbit/desktop/main.mjs:335",
        "runtime/arcorbit/desktop/main.mjs:337",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:606",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs:72",
        "arckit/interaction/setup-readiness/interaction.md:167",
        "Direct timing probe: while the combined discovery/version probe was blocked, events=[rechecking-executable]; after release, rechecking-version, rechecking-login-status and rechecking-readiness were all emitted at 92ms",
        "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced phase-to-work mismatch"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-021",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "生产 resolver 现在在 discovery 和每次真实 version probe 开始时发布阶段；CodexSetupManager 在 login-status 工作开始前发布对应阶段，并在真实 skill readiness 检查结束前持续保留 rechecking-readiness。main process 将 readiness callback 注入 manager，操作完成后不再在 operation 清除后另行复核。时间感知单元测试和真实 Electron production matrix 分别阻塞四个底层动作，证明每个可见阶段都覆盖实际工作窗口。",
        "evidence": [
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 95 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 481 tests: 468 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary diagnostic markers added"
        ],
        "occurred_at": "2026-08-25T19:52:50.507Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-022",
      "status": "resolved",
      "goal": "Resolve review finding: 生产 `rechecking-readiness` callback 调用完整 `skillProvisioningManager.check({quiet:true})`，而该检查会通过同一个 resolver 再次执行 executable discovery 与 `codex --version`。因此“其它 readiness”阶段仍隐藏第二次 Codex probe，没有完全解决阶段到真实工作的映射问题。若第一次 manager probe 与 login status 成功、第二次 skill probe 瞬时失败，CodexSetupManager 最终仍可投影 ready，SkillProvisioningManager 则投影 blocked/CODEX_UNAVAILABLE；Desktop aggregate 会保留 status=blocked，却将该 skill error 清空为 error=null，用户无法理解或恢复。新增 manager 与 Electron 时序测试只注入可阻塞的空 readiness callback，未执行生产 SkillProvisioningManager，也未覆盖重复 probe 或该分歧状态。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:23"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/desktop/main.mjs:103",
        "runtime/arcorbit/desktop/main.mjs:108",
        "runtime/arcorbit/desktop/main.mjs:112",
        "runtime/arcorbit/desktop/main.mjs:353",
        "runtime/arcorbit/desktop/main.mjs:365",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
        "runtime/arcorbit/src/codex-setup-manager.mjs:59",
        "runtime/arcorbit/src/codex-setup-manager.mjs:124",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs:600",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:110",
        "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,error:null,can_continue:false}",
        "Verification: focused Codex Setup Manager and Skill Provisioning Manager suites — 37 passed, 0 failed despite the uncovered production composition defect"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-022",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "CodexSetupManager 现在把本次 inspection 的受控 executable probe 直接交给 recheckReadiness；SkillProvisioningManager 仅在显式收到 codexProbeResult 时复用该证据，普通 check/assertReady 仍自行探测。Desktop main 使用这一窄接口完成生产组合。实际双-manager 回归证明安装前后只有 CodexSetupManager 执行两次必要 probe，post-operation Skill readiness 的 probe 调用数为零；独立 Skill check 随后仍自行探测并正确阻塞。真实 Electron 还证明 readiness callback 收到与 executable/version 阶段相同的 standalone probe。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 102 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 482 tests accounted for; 469 passed, 11 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG, temporary console or diagnostic markers found"
        ],
        "occurred_at": "2026-08-25T20:06:30.180Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-023",
      "status": "resolved",
      "goal": "Resolve review finding: Codex executable/version readiness 尚未形成单一架构所有者。Durable technical contract 将 Codex discovery/version 归 CodexSetupManager、项目 skill 文件归 SkillProvisioningManager，但生产 `checkCombinedSetupReadiness` 仍并行调用 `skillProvisioningManager.check()` 与 `codexSetupManager.check()`，前者默认通过同一 resolver 再次 discovery/version；Chat 与 Automation preflight 也先 `codexSetupManager.assertReady()`、再调用会自行 probe 的 `skillProvisioningManager.assertReady()`。因此最新 `codexProbeResult` 接口只修复 post-operation callback，未治理普通启动、手动 recheck 和执行前置路径的双重事实所有权。若 Skill probe 瞬时返回 CODEX_UNAVAILABLE 而 Codex manager 返回 ready，aggregate 会保留 status=blocked、清除 skill error，产生 error=null、can_continue=false 的不可解释状态。现有双-manager 测试只证明 post-operation probe 复用，未覆盖普通 aggregate/preflight 的单 probe、一致性或分歧恢复。应先把 CodexSetupManager/其协调层确立为唯一 Codex readiness authority，让 SkillProvisioningManager 只消费显式、同轮的受控 Codex 证据或完全移除其 Codex 探测与状态所有权，再继续后续 review。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:24"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md:280",
        "arckit/tech/arcorbit/installer-supply-chain.md:313",
        "arckit/tech/arcorbit/installer-supply-chain.md:317",
        "arckit/tech/arcorbit/installer-supply-chain.md:359",
        "runtime/arcorbit/desktop/main.mjs:103",
        "runtime/arcorbit/desktop/main.mjs:108",
        "runtime/arcorbit/desktop/main.mjs:117",
        "runtime/arcorbit/desktop/main.mjs:129",
        "runtime/arcorbit/desktop/main.mjs:324",
        "runtime/arcorbit/desktop/main.mjs:346",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:46",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:645",
        "runtime/arcorbit/src/codex-executable-resolver.mjs:20",
        "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,can_continue:false,error:null}",
        "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 102 passed, 0 failed despite no ordinary aggregate/preflight single-probe assertion",
        "Verification: source/test search found probe-count coverage only for post-operation readiness reuse"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-023",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "生产 SkillProvisioningManager 的 Codex probe 现在通过 CodexSetupManager 权威检查取得；普通 aggregate 不再并行执行第二次 resolver probe，Chat 与 Automation preflight 将 Codex assertReady 返回的同轮证据显式传给 Skill 断言，post-operation 继续复用 mutation inspection 的 raw probe。纯组合层对旧 Skill=CODEX_UNAVAILABLE、最新 Codex=ready 的分歧返回 SETUP_EVIDENCE_STALE，避免 blocked/error=null 或误放行。",
        "evidence": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 104 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 485 tests accounted for; 471 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
          "Verification: final affected suites — 60 passed, 0 failed",
          "Verification: syntax checks and git diff --check passed; temporary diagnostic-marker scan found no matches"
        ],
        "occurred_at": "2026-08-26T00:17:27.118Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-024",
      "status": "resolved",
      "goal": "Resolve review finding: 生产普通 Setup readiness 与 Codex post-operation readiness 存在锁顺序环：`SkillProvisioningManager.check()` 持有 Skill 串行队列并通过 `codexProbe` 等待 `CodexSetupManager.check()`；活动 Codex mutation 同时持有 Codex 队列，并在 `recheckReadiness` 中等待另一个 Skill check。直接生产-manager 探针在释放 installer 后仍超时，状态停留于 Codex `rechecking-readiness` 与 Skill `checking`，因此手动检查或其它并发检查可能永久不返回。应由单一协调层确定调用顺序，消除 manager 间双向等待，并增加真实并发回归。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:25"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/desktop/main.mjs: Skill codexProbe awaits codexSetupManager.check while Codex recheckReadiness calls skillProvisioningManager.check",
        "runtime/arcorbit/src/codex-setup-manager.mjs: mutation and check share the Codex operation queue",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs: check holds its runExclusive queue across codexProbe",
        "Direct production-manager lock-order probe: after installer release, Promise.race timed out at 500ms with {codex_status:'checking',codex_operation:'rechecking-readiness',skill_status:'checking'}",
        "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite the reproduced deadlock"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-024",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "新增 Desktop Setup 协调入口，普通 readiness 先完成 CodexSetupManager fresh check，再把同轮 probe 证据显式传给 SkillProvisioningManager。生产 Skill fallback 只读取 CodexSetupManager 当前 authoritative snapshot，不再等待其操作队列；post-operation 路径继续传递 mutation inspection 的 raw probe。真实双 manager 回归证明活动 install 与并发普通 readiness 均在超时界限内完成，Codex operation 清空且 Skill 状态 ready。",
        "evidence": [
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: lock-order regression completed both active install and concurrent ordinary readiness without timeout",
          "Verification: focused Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 92 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 105 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 486 accounted for; 472 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
          "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
        ],
        "occurred_at": "2026-08-26T00:33:35.603Z"
      }
    },
    {
      "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-025",
      "status": "resolved",
      "goal": "Resolve review finding: `CodexSetupManager.assertReady()` 直接调用 `inspect({announce:false})`，没有进入 manager 的串行队列，也未拒绝活动 mutation。Chat 或 Automation preflight 与安装并发时，inspection 会发布并保存新的非操作 snapshot，从而把仍在运行且可取消的 `{installing, operation_id}` 覆盖成 `operation=null`；Renderer 会失去活动状态与取消入口，而后台 installer 仍继续运行。应让 preflight 遵守同一 operation authority，在活动 mutation 时稳定 fail closed 或串行等待，并增加并发 preflight/operation 投影回归。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:25"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs: assertReady calls inspect directly while check uses runExclusive",
        "runtime/arcorbit/desktop/main.mjs: both Chat and Automation preflight invoke codexSetupManager.assertReady",
        "Direct production-manager probe before preflight: {status:'installing',operation_id:'present',cancellable:true}",
        "Direct production-manager probe after concurrent assertReady: {preflight_code:'CODEX_SETUP_NOT_READY',status:'missing',operation:null,error:null} while the installer remained active",
        "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite no active-operation/preflight concurrency assertion"
      ],
      "resolution": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-025",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "`CodexSetupManager.assertReady()` 现在通过 `runExclusive` 排入与 mutation/check 相同的队列。活动 installer 和 post-operation recheck 完成前，preflight 保持 pending，不执行独立 inspection；因此 authoritative snapshot 持续保留活动 `{operation_id,cancellable}`。队列释放后，preflight 再执行 fresh inspection 并按最终 readiness 成功或 fail closed。新增生产 manager 并发回归直接证明活动 install 期间状态保持 `installing`、operation id 不变且可取消，install 完成后 preflight 才返回 ready。",
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "Verification: preflight waits for the active mutation without replacing its operation projection",
          "Verification: Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 93 passed, 0 failed",
          "Verification: Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 106 passed, 0 failed",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
          "Verification: syntax, whitespace and temporary diagnostic-marker checks passed"
        ],
        "occurred_at": "2026-08-26T00:38:56.654Z"
      }
    }
  ],
  "content_revision": 27,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T15:41:27.837Z"
    },
    "additional_cycles_authorized": 10,
    "cycle_count": 13,
    "reviewed_content_revision": 27,
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
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-001",
          "FINDING-20260825-010-002",
          "FINDING-20260825-010-003",
          "FINDING-20260825-010-004",
          "FINDING-20260825-010-005"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused resolver/manager/renderer suite passed 70 tests",
          "Verification: git diff --check passed",
          "https://learn.chatgpt.com/docs/codex/cli",
          "https://learn.chatgpt.com/docs/auth"
        ],
        "occurred_at": "2026-08-25T17:00:13.396Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 7,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-006"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
          "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T17:39:14.480Z"
      },
      {
        "cycle": 3,
        "autonomous_cycle": 3,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 8,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-007",
          "FINDING-20260825-010-008"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 72 passed, 0 failed",
          "Accepted prior verification: real Setup Electron matrix — 1 passed, 0 failed",
          "Accepted prior verification: npm run check — 463 tests, 453 passed, 10 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-25T17:52:36.869Z"
      },
      {
        "cycle": 4,
        "autonomous_cycle": 4,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 10,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-009",
          "FINDING-20260825-010-010",
          "FINDING-20260825-010-011"
        ],
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: focused Resolver, Codex Setup IPC, Manager and Desktop Renderer suites — 82 passed, 0 failed",
          "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
          "Accepted verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed",
          "Direct probe reproduced all three postcondition defects despite the green suites"
        ],
        "occurred_at": "2026-08-25T18:12:29.273Z"
      },
      {
        "cycle": 5,
        "autonomous_cycle": 5,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 13,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-012",
          "FINDING-20260825-010-013"
        ],
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 23 passed, 0 failed",
          "Verification: git diff --check passed",
          "Direct probe: successful login process plus nonzero status reproduced selection-required/logged-out/error=null",
          "Direct probe: successful installer plus missing discovery reproduced missing/error=null"
        ],
        "occurred_at": "2026-08-25T18:35:57.780Z"
      },
      {
        "cycle": 6,
        "autonomous_cycle": 6,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 15,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-014",
          "FINDING-20260825-010-015"
        ],
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: existing Codex Setup Manager suite — 25 passed, 0 failed",
          "Direct probe reproduced update success followed by missing discovery returning status=missing and error=null",
          "Direct probe reproduced install proceeding with an active Automation owner while activeOwners was never called"
        ],
        "occurred_at": "2026-08-25T18:48:29.017Z"
      },
      {
        "cycle": 7,
        "autonomous_cycle": 7,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 17,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-016",
          "FINDING-20260825-010-017",
          "FINDING-20260825-010-018",
          "FINDING-20260825-010-019"
        ],
        "evidence": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Verification: Codex Setup Manager — 27 passed, 0 failed",
          "Verification: git diff --check passed",
          "Direct process probe reproduced promise rejection before child close"
        ],
        "occurred_at": "2026-08-25T19:02:58.886Z"
      },
      {
        "cycle": 8,
        "autonomous_cycle": 8,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 21,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-020"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: focused cross-layer suites — 94 passed, 0 failed",
          "Direct event probe reproduced missing started_at and opaque rechecking projection",
          "Canonical prior verification: complete inventory — 480 tests, 467 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2"
        ],
        "occurred_at": "2026-08-25T19:32:53.375Z"
      },
      {
        "cycle": 9,
        "autonomous_cycle": 9,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 22,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-010-021"
        ],
        "evidence": [
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Direct timing probe reproduced phase-to-work mismatch",
          "Verification: focused cross-layer suites — 94 passed, 0 failed",
          "Verification: syntax checks and git diff --check passed"
        ],
        "occurred_at": "2026-08-25T19:44:12.551Z"
      },
      {
        "cycle": 10,
        "autonomous_cycle": 10,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 23,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "findings"
        },
        "finding_ids": [
          "FINDING-20260825-010-022"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Direct aggregate projection probe: duplicate Codex probe failure yields status=blocked, error=null, can_continue=false",
          "Verification: focused manager and skill-readiness suites — 37 passed, 0 failed"
        ],
        "occurred_at": "2026-08-25T19:57:03.358Z"
      },
      {
        "cycle": 11,
        "autonomous_cycle": 11,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 24,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "findings"
        },
        "finding_ids": [
          "FINDING-20260825-010-023"
        ],
        "evidence": [
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Direct aggregate projection probe reproduced blocked/error-null divergence",
          "Verification: focused cross-layer suites — 102 passed, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-26T00:06:27.000Z"
      },
      {
        "cycle": 12,
        "autonomous_cycle": 12,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 25,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "findings"
        },
        "finding_ids": [
          "FINDING-20260825-010-024",
          "FINDING-20260825-010-025"
        ],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Direct production-manager preflight probe reproduced active operation projection loss",
          "Direct production-manager lock-order probe reproduced a 500ms non-settling cycle",
          "Verification: focused Completion Review suites — 91 passed, 0 failed"
        ],
        "occurred_at": "2026-08-26T00:23:38.788Z"
      },
      {
        "cycle": 13,
        "autonomous_cycle": 13,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 27,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: independent Completion Review core suites — 93 passed, 0 failed",
          "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed",
          "Verification: preflight remained pending during active install while the same operation id and cancellable projection remained authoritative",
          "Verification: ordinary readiness and post-operation readiness completed without a manager lock-order timeout",
          "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
          "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
          "Verification: syntax checks, git diff --check and temporary diagnostic-marker scan passed"
        ],
        "occurred_at": "2026-08-26T00:42:58.867Z"
      }
    ],
    "evidence": [
      "arckit/spec/arcorbit-distribution.md",
      "arckit/interaction/setup-readiness/interaction.md",
      "arckit/tech/arcorbit/installer-supply-chain.md",
      "runtime/arcorbit/src/codex-executable-resolver.mjs",
      "runtime/arcorbit/src/codex-setup-manager.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/codex-setup-manager.test.mjs",
      "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
      "Verification: focused resolver/manager/renderer suite passed 70 tests",
      "Verification: git diff --check passed",
      "https://learn.chatgpt.com/docs/codex/cli",
      "https://learn.chatgpt.com/docs/auth",
      "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
      "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
      "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
      "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
      "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 72 passed, 0 failed",
      "Accepted prior verification: real Setup Electron matrix — 1 passed, 0 failed",
      "Accepted prior verification: npm run check — 463 tests, 453 passed, 10 environment-gated skips, 0 failed",
      "Verification: focused Resolver, Codex Setup IPC, Manager and Desktop Renderer suites — 82 passed, 0 failed",
      "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
      "Accepted verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
      "Direct probe reproduced all three postcondition defects despite the green suites",
      "Verification: Codex Setup Manager — 23 passed, 0 failed",
      "Direct probe: successful login process plus nonzero status reproduced selection-required/logged-out/error=null",
      "Direct probe: successful installer plus missing discovery reproduced missing/error=null",
      "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
      "Verification: existing Codex Setup Manager suite — 25 passed, 0 failed",
      "Direct probe reproduced update success followed by missing discovery returning status=missing and error=null",
      "Direct probe reproduced install proceeding with an active Automation owner while activeOwners was never called",
      "Verification: Codex Setup Manager — 27 passed, 0 failed",
      "Direct process probe reproduced promise rejection before child close",
      "Verification: focused cross-layer suites — 94 passed, 0 failed",
      "Direct event probe reproduced missing started_at and opaque rechecking projection",
      "Canonical prior verification: complete inventory — 480 tests, 467 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
      "Direct timing probe reproduced phase-to-work mismatch",
      "Verification: syntax checks and git diff --check passed",
      "runtime/arcorbit/src/skill-provisioning-manager.mjs",
      "Direct aggregate projection probe: duplicate Codex probe failure yields status=blocked, error=null, can_continue=false",
      "Verification: focused manager and skill-readiness suites — 37 passed, 0 failed",
      "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
      "Direct aggregate projection probe reproduced blocked/error-null divergence",
      "Verification: focused cross-layer suites — 102 passed, 0 failed",
      "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
      "Direct production-manager preflight probe reproduced active operation projection loss",
      "Direct production-manager lock-order probe reproduced a 500ms non-settling cycle",
      "Verification: focused Completion Review suites — 91 passed, 0 failed",
      "Verification: independent Completion Review core suites — 93 passed, 0 failed",
      "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed",
      "Verification: preflight remained pending during active install while the same operation id and cancellable projection remained authoritative",
      "Verification: ordinary readiness and post-operation readiness completed without a manager lock-order timeout",
      "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
      "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
      "Verification: syntax checks, git diff --check and temporary diagnostic-marker scan passed"
    ],
    "escalation": null,
    "human_authorizations": [
      {
        "additional_cycles": 10,
        "authorized_by": "human",
        "reason": "用户明确授权追加 10 轮 Completion Review，并要求首先确认既有复查问题背后是否存在架构级合理性问题；若存在，应先完成架构治理再继续后续 review。",
        "evidence": [
          "Current operator input, 2026-08-26"
        ],
        "effective_max_cycles": 20,
        "occurred_at": "2026-08-26T00:02:43.457Z"
      }
    ]
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 Codex CLI 安装、更新、显式认证、ready 判定、进程所有权、恢复和凭证安全成为可恢复的产品、交互、技术与 Project 决策事实。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "使用 global snapshot 20f43577a87ca000512ea8a3e8636f2caa3d8a5f77c7c1389c32de56018ea639 和 CASE-20260825-010 fresh selection token，在同一持久线程中重新比较全部 persisted candidates。",
        "snapshot_token": "44384f1fbb78c692c9645b3aa1076842b58702b4f6d109fbe1f2aee4229491ad",
        "selected_ref": "case-gap:CASE-20260825-010:GAP-DURABLE-CODEX-SETUP-CONTRACT",
        "comparison_summary": "两个 Case Gap 均为 ready 且具有高 blocking、risk 和 user impact。CASE-20260825-011 另有高 urgency，但属于并发 Case；当前线程已经完成 CASE-20260825-010 契约产物和验证，只因 stale token 尚未被 ledger 接受。为保持 one-gap、same-thread 和 do-not-repeat-completed-work 约束，本轮继续提交 Codex Setup 契约 Gap。四个 Project Gap 仍需独立 Case。",
        "fresh_discovery_summary": "Fresh state 新增 CASE-20260825-011 的 closed-Case reuse ready candidate；没有发现会否定或改变已完成 Codex Setup 契约主张的 workspace 事实。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 验证动态 Gap 选择，不直接建立当前 Codex Setup 契约。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "面向通用 Runtime resilience 与 adapter 验收，不是当前设置契约的直接阻塞。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要真实 permission-bearing project 的独立安全验证；当前轮只接受具体凭证安全契约。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计风险较高，但不直接阻塞本线程已完成的 Codex Setup 契约。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:GAP-DURABLE-CODEX-SETUP-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接承接当前持久线程和已完成但未入账的产品、交互、技术契约工作；可立即形成可信单一验收主张。"
          },
          {
            "ref": "case-gap:CASE-20260825-011:GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是 fresh state 中新增的高紧迫并发 Case，但其实现、持久契约和验证与当前 Codex Setup 主张无共同验收边界；切换会遗留已完成但未接受的当前工作。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DURABLE-CODEX-SETUP-CONTRACT",
        "responsibility": "agent",
        "goal": "Make the accepted Codex CLI installation, update, explicit authentication, readiness-state, process-ownership, recovery, and credential-safety contract durably recoverable before implementation.",
        "reason": "The new operator-confirmed facts materially change product, interaction, identity, security, integration, and technical expectations, while current durable decisions and artifacts do not yet contain those boundaries. Implementation scope and acceptance depend on first establishing this contract.",
        "derived_from": [
          "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
          "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable product specification covering install/update/authentication/readiness behavior and non-goals.",
          "Durable interaction specification covering explicit unselected choices, progress, success, cancellation, timeout, failure, retry, and automatic revalidation.",
          "Durable technical contract covering official platform installers, controlled process execution, typed IPC, running-task update guard, stdin-only secrets, status verification, and external-install preservation.",
          "Project decision changes that accurately reflect the accepted contract and cite official OpenAI documentation."
        ]
      },
      "planned_transition": {
        "goal": "让 Codex CLI 安装、更新、显式认证、ready 判定、进程所有权、恢复和凭证安全成为可恢复的产品、交互、技术与 Project 决策事实。",
        "expected_state_change": "关闭持久契约 Gap，将五个既有 threatened decision impacts 更新为 upheld，补充相关 Project 决策关系，并建立一个必须等待 post-commit fresh-read 的实现与验证 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DURABLE-CODEX-SETUP-CONTRACT",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "产品规格、交互策略/线框和技术方案已经共同覆盖安装、更新、显式认证、状态、恢复、进程与安全边界，并引用 OpenAI 官方安装和认证文档。",
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "https://learn.chatgpt.com/docs/codex/cli",
            "https://learn.chatgpt.com/docs/auth",
            "Verification: git diff --check passed",
            "Verification: 13 interaction details each contain one trigger, wireframe canvas/device frame, component list, and interaction behavior",
            "Verification: 29 installation/authentication/platform/security contract terms present; 0 missing"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-010-001",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit durable product, interaction, and technical artifacts now define the accepted Codex CLI standalone installation/update, explicit non-preselected authentication, readiness, process-ownership, recovery, external-install preservation, and credential-safety contract; the current production implementation has not yet realized it.",
            "basis": "Direct inspection of the updated durable artifacts and unchanged production boundary.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260825-010-001",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 12
            },
            "effect": "upheld",
            "reason": "The integration decision now identifies official standalone installer and Codex authentication commands as fixed main-process integrations with explicit recovery behavior.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "https://learn.chatgpt.com/docs/codex/cli",
              "https://learn.chatgpt.com/docs/auth"
            ]
          },
          {
            "id": "IMPACT-20260825-010-002",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 12
            },
            "effect": "upheld",
            "reason": "The validation decision now requires cross-platform installer, login-state, typed IPC, active-task guard and secret-leakage evidence.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-20260825-010-003",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "The delivery decision now distinguishes ArcOrbit packaging from runtime orchestration of the official, non-redistributed Codex standalone installer.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-20260825-010-004",
            "fact_id": "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted durable contract is not yet implemented in the current resolver, main/preload IPC or Setup renderer.",
            "gap_ids": [
              "GAP-20260825-010-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          },
          {
            "id": "IMPACT-20260825-010-005",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Credential leakage, external-install conflicts, active-task updates and three-platform installer behavior remain unproven until implementation and proportional tests exist.",
            "gap_ids": [
              "GAP-20260825-010-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-CODEX-SETUP-PRODUCT-CAPABILITIES",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "The product capability is now explicitly and durably defined.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ]
          },
          {
            "id": "IMPACT-CODEX-SETUP-EXPERIENCE",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 47
            },
            "effect": "upheld",
            "reason": "The interaction source and synchronized wireframe now define all unselected choices, progress, cancellation, timeout, failure, retry and automatic revalidation states.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "id": "IMPACT-CODEX-SETUP-IDENTITY",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "identity_and_access",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "The identity decision now preserves Codex and Workshop authentication as separate state domains and defines supported explicit credential choices.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "https://learn.chatgpt.com/docs/auth"
            ]
          },
          {
            "id": "IMPACT-CODEX-SETUP-SECURITY",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "The security decision now records stdin-only secret transport, zero credential-file access, redacted diagnostics and structured Renderer boundaries.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-CODEX-SETUP-TECHNICAL-FOUNDATION",
            "fact_id": "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 35
            },
            "effect": "upheld",
            "reason": "The technical foundation now defines CodexSetupManager, process ownership, typed IPC, update guards and post-operation verification.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260825-010-001",
            "status": "open",
            "goal": "Implement and verify the accepted Codex CLI installation, update and explicit authentication setup flow across resolver, controlled main-process manager, typed IPC, Setup Readiness renderer and existing Runtime consumers.",
            "reason": "The contract is now durable, but current production code still only discovers and version-probes Codex and has no installation, update, authentication or logout actions.",
            "derived_from": [
              "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
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
              "Unit evidence for executable provenance, platform installer orchestration, operation state transitions, status exit-code handling, active-task update guards and retry/cancellation.",
              "Security evidence that API Key/Access Token enter only child stdin and never argv, environment, logs, errors, stores or shared Renderer state; ArcOrbit performs zero credential-file access.",
              "Typed main/preload/renderer evidence for no default selections, disabled continuation, capability-gated options and structured actions without arbitrary commands.",
              "Electron integration evidence for install/update/login success, cancellation, timeout and failure with automatic revalidation and no application restart.",
              "Regression evidence for existing Setup Readiness, Chat and Automation flows, plus platform-appropriate macOS, Linux and Windows installer validation."
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
            "observed_revision": 30,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者，并允许在新建、编辑和 Inspector 中修改完整七状态。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 同时提供 Codex CLI executable/version 检测、macOS/Linux/Windows 官方 standalone 安装与更新、独立登录状态检测、无默认值的显式认证方式选择、官方登录/logout 流程和操作后的自动重新验证；只有 Codex 与其它 readiness 条件全部通过才进入 ready。",
              "reason": "接受用户确认的完整 Codex 环境恢复能力，同时保留外部安装、活动任务和认证安全边界。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/arcorbit-distribution.md",
                "https://learn.chatgpt.com/docs/codex/cli",
                "https://learn.chatgpt.com/docs/auth"
              ],
              "confidence": "high",
              "resume_condition": "当官方 installer/auth CLI、外部安装迁移政策、支持平台或 ready 条件改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "Codex Setup 已成为明确的 Desktop 产品能力。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 46,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。确认界面明确说明将创建新 Task、删除旧 Task、生成新 id，且评论、附件和执行关系不会迁移。提交先创建目标 Task，确认成功后才删除源 Task；创建失败保留源 Task和草稿，删除失败则显示源、目标 Task 及可恢复状态，允许重试删除或明确保留两者。源删除确认后 Automation 安全停止旧 execution；目标 Task 不继承旧 execution。ArcOrbit 主窗口只使用应用自定义标题栏；标题区域支持拖动和双击最大化/还原，原生边缘缩放继续可用，应用内最小化、最大化/还原和关闭按钮必须真实控制当前窗口、保持可聚焦，并同步反映当前窗口状态。Setup Readiness 在 Codex 缺失、损坏、更新或未认证时原位提供恢复：安装/更新展示下载、执行、发现与复核进度；登录先选择无默认值的凭证类型，ChatGPT 再选择无默认值的浏览器或设备码流程，选择完成前继续按钮禁用。成功、取消、超时和失败都重新验证状态并提供明确反馈与重试；活动 Codex owner 阻止更新，外部安装显示所有权而不被静默替换。",
              "reason": "持久交互现在覆盖 Codex 设置的选择、进度、恢复和自动复核语义。",
              "evidence": [
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当认证层级、可见方式、安装进度、取消/超时或外部安装恢复行为改变时重审。"
            },
            "gap_refs": [],
            "reason": "补齐所选 Gap 要求的完整用户旅程和恢复状态。",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "area_ref": "identity_and_access",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. ArcOrbit 产品反馈要求有效 Workshop 登录，并以服务端 current-user 的不可变业务 ID 作为反馈身份；退出或切换账户会关闭旧反馈上下文。Codex authentication 是独立于 ArcOrbit/Workshop authentication 的状态域，由 `codex login status` 退出码确认。未认证用户必须显式选择 ChatGPT、API Key 或明确支持的 Enterprise Access Token；ChatGPT 还必须显式选择 system-browser 或 device-auth，所有选项均无默认值。",
              "reason": "Codex executor identity and Workshop product identity must not be conflated or silently inferred.",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/arcorbit-distribution.md",
                "https://learn.chatgpt.com/docs/auth"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 官方认证方式、企业 token 支持、状态检测或与 Workshop 身份的边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "明确 Codex 的独立认证主体、方式和状态来源。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "https://learn.chatgpt.com/docs/auth"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 11,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。Codex Setup 额外通过固定 main-process allowlist 集成 OpenAI 官方 macOS/Linux/Windows standalone installer 和 `codex login`、`login status`、`logout` 接口；网络、权限、process、capability 与 status 失败分别恢复，Renderer 不能提供 URL、argv、environment 或 shell。",
              "reason": "Codex 安装与认证是新增的受控外部集成，必须沿用 main-process adapter 边界。",
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "https://learn.chatgpt.com/docs/codex/cli",
                "https://learn.chatgpt.com/docs/auth"
              ],
              "confidence": "high",
              "resume_condition": "当官方 installer URL、认证命令、capability detection 或 process ownership 改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "把官方 installer/auth CLI 纳入可恢复、受限的外部集成事实。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 34,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 在 main process 使用独立 ChatCoordinator 和 kind=chat Store ownership，并复用 Codex Conversation 层；Chat 与 Automation owner 不共享活动 turn 或 lease。typed Chat IPC、共享 Conversation Surface、结构化 gap_rounds、Semantic Case Command materialization、Work-owned Task Projection/Sync、64-grapheme display_title 和有界 workspace-lane arbiter 的既有边界保持不变。Setup Readiness 增加由 main process 持有的 CodexSetupManager：它维护安装/认证状态、executable provenance、固定三平台 installer、固定登录命令、活动 Codex owner 更新门禁、stdin-only secret transport 和操作后 discovery/version/login-status 复核。preload 只暴露 snapshot/install/update/migrate/login/cancel/logout/recheck/subscribe 等 typed actions，Renderer 不能覆盖 executable、cwd、URL、timeout、environment、args 或 shell command。",
              "reason": "以独立 manager 和 typed IPC 扩展 Desktop setup plane，同时保持 Runtime、Chat、Automation 和 Renderer 的既有所有权边界。",
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/src/codex-executable-resolver.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/preload.cjs"
              ],
              "confidence": "high",
              "resume_condition": "当 manager process host、installer execution、IPC 枚举、active-owner guard 或 post-operation verification 改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Codex Setup 的受控进程和 IPC 结构成为新的技术基础事实。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "security_privacy_compliance",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime 与 Workshop 服务凭据继续保持在受控存储和 main-process 边界内；ArcOrbit 产品反馈 bundled-static Project 107 API Key 例外及其最小权限、可轮换、不得进入 URL/Renderer/IPC/log 的规则保持不变。真实 Chat 的 Renderer 只能使用类型化 IPC，不能选择任意 cwd/thread/method、读取 raw JSON-RPC、获得 Codex 进程或文件系统通用权限。Codex command、file change 和 permissions request 必须通过异步受限 approvalProvider 返回；窗口关闭、超时、session/request 不匹配或用户拒绝均 fail closed。Chat session/thread ownership 与 Automation task session/thread/lease 双向隔离。Codex Setup 同样只接受 typed actions：ChatGPT 凭证完全留在官方流程和系统浏览器；ArcOrbit 不访问 Codex credential file 或管理 OAuth token。API Key/Access Token 只通过一次性专用 IPC 进入 main process，并直接写入 child stdin；不得进入 argv、environment、日志、错误、analytics、普通配置、Desktop Store 或共享 Renderer state，第一版不持久化。installer URL、executable 和参数均由 main-process allowlist 固定。",
              "reason": "安装脚本执行和用户 secret 输入扩大了 setup trust boundary，必须明确 fail-closed 控制。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "https://learn.chatgpt.com/docs/auth"
              ],
              "confidence": "high",
              "resume_condition": "当 secret 持久化、系统凭证库、installer integrity、认证输出或 Renderer 输入边界改变时重审。"
            },
            "gap_refs": [
              "GAP-security-real-project-validation"
            ],
            "reason": "把 stdin-only secret、零 credential-file access 和固定 process allowlist 纳入安全决策。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 11,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation 和安全验证义务保持不变。Codex Setup 还必须以 resolver/manager 单元测试、typed main/preload/renderer 测试和 Electron 集成证据证明：macOS/Linux/Windows 固定官方 standalone installer；安装后无需重启即可 discovery/version 复核；standalone update 成功复核且活动 Codex owner 阻断；外部 npm/Homebrew/configured installation 不被静默替换；安装与认证状态、取消、超时、失败和重试正确；所有凭证/流程默认未选且未完成选择时不能继续；每个可见方式只物化固定 argv；API Key/Access Token 仅进入 stdin且不泄漏到 argv/environment/log/error/store/shared Renderer state；ArcOrbit 对 Codex credential file 零访问；login/logout 只由 `codex login status` 退出码复核；Codex/Workshop auth 独立；Setup、Chat 与 Automation 原有流程保持通过。",
              "reason": "验证矩阵必须直接证明跨平台恢复能力和高风险凭证/进程边界，而不是仅检查文档或 happy path。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当支持平台、installer/auth CLI、secret transport、状态模型或 Runtime consumers 改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "建立与风险成比例的 Codex Setup 验证口径。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and ArcOrbit applies its locked payload only to normalized local project roots explicitly associated through Product Workspaces; it does not install bundled skills, shared assets or loaders into the Codex user-level skill directory. Source availability recommendations remain generic, while ArcOrbit uses a project-only invocation policy, per-project relations and confirmed migration of legacy managed user targets. Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows. Codex CLI is not bundled or redistributed in ArcOrbit v1: Setup Readiness downloads and executes OpenAI's current official standalone installer for macOS/Linux/Windows only after explicit user confirmation, records no installer bytes in the product, preserves external installations unless the user separately confirms migration, and revalidates the selected executable after install/update.",
              "reason": "Codex setup is a runtime delivery orchestration boundary, not a change to ArcOrbit's governed package contents or redistribution rights.",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "https://learn.chatgpt.com/docs/codex/cli"
              ],
              "confidence": "high",
              "resume_condition": "当 ArcOrbit redistributes Codex, changes official installer ownership, adds platforms, or changes migration/rollback policy时重审。"
            },
            "gap_refs": [],
            "reason": "明确官方 installer 的按需调用、非再分发和外部安装保护。",
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
          "Current operator input, 2026-08-25",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "https://learn.chatgpt.com/docs/codex/cli",
          "https://learn.chatgpt.com/docs/auth"
        ]
      },
      "invariant_assessment": {
        "project_revision": 256,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Codex Setup capability, states, ready rule, recovery and non-goals are now durable product facts.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The source interaction strategy and synchronized grayscale wireframe cover explicit selection, disabled continuation, progress, success, cancellation, timeout, failure, retry and revalidation.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
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
            "reason": "The accepted facts establish setup behavior and trust boundaries but do not revise the durable visual language, theme, tokens or component styling.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The manager ownership, platform allowlist, typed IPC, state model, active-owner guard, secret transport and verification order are durably explained with rationale and official contracts.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "https://learn.chatgpt.com/docs/codex/cli",
              "https://learn.chatgpt.com/docs/auth"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The current production implementation still lacks the accepted installation, update, authentication manager, typed IPC and Setup renderer behavior.",
            "fact_refs": [
              "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": [
              "GAP-20260825-010-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The contract identifies credential, installer, external-install and active-task risks, but repeatable implementation evidence across three operating systems does not yet exist.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": [
              "GAP-20260825-010-001"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "arckit/tech/_map/RELATIONS.md",
        "Verification: git diff --check passed",
        "Verification: index line-count checks passed for all four primary artifacts",
        "Verification: interaction structure check passed for 13 states",
        "Verification: contract coverage check passed for 29 required terms"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-153626614Z-4027174e",
      "occurred_at": "2026-08-25T16:00:10.487Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在生产代码中实现并验证受控 Codex CLI 安装、更新、显式认证、typed IPC、Setup Readiness 交互、Runtime ready 门禁和凭证安全边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh canonical snapshot 583191ac6224252b0801a7e9271aa1807f44dc8a81046e55cbf7ec0af332c7aa，比较全部 persisted candidates，并检查实现与验证过程中显露的 fresh evidence。",
        "snapshot_token": "1d41893ebd225eb4f969a0a3f53c5c5a650d2affeed0f50652b5125311cc3f0c",
        "selected_ref": "case-gap:CASE-20260825-010:GAP-20260825-010-001",
        "comparison_summary": "CASE-010 的实现 Gap 是唯一 ready Case Gap，直接承接当前待办，且同时具有高 blocking、risk 和 user impact。四个 Project Gap 均需建立独立 Case，不应取代当前已界定的实现验收边界。",
        "fresh_discovery_summary": "未发现优先级更高的新 Gap。完整回归中曾出现两项 Electron SIGABRT，但隔离到可启动 GUI 的环境后均通过，证明其为沙箱执行限制而非新的产品回归。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 验证通用动态 Gap 选择，不直接实现当前 Codex Setup 能力。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "面向通用 Runtime resilience 与 adapters，范围独立于当前 Setup 实现。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "要求真实 permission-bearing project 的独立安全验证；当前 Gap 已具备针对 Codex Setup secret/process 边界的比例化证据。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计风险较高但需独立 Case，且不直接阻塞当前用户事项。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:GAP-20260825-010-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "唯一 ready 且直接兑现已接受 Codex Setup 产品、交互、技术与安全契约的候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260825-010-001",
        "responsibility": "agent",
        "goal": "Implement and verify the accepted Codex CLI installation, update and explicit authentication setup flow across resolver, controlled main-process manager, typed IPC, Setup Readiness renderer and existing Runtime consumers.",
        "reason": "The contract is now durable, but current production code still only discovers and version-probes Codex and has no installation, update, authentication or logout actions.",
        "derived_from": [
          "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
          "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
          "FACT-20260825-010-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Unit evidence for executable provenance, platform installer orchestration, operation state transitions, status exit-code handling, active-task update guards and retry/cancellation.",
          "Security evidence that API Key/Access Token enter only child stdin and never argv, environment, logs, errors, stores or shared Renderer state; ArcOrbit performs zero credential-file access.",
          "Typed main/preload/renderer evidence for no default selections, disabled continuation, capability-gated options and structured actions without arbitrary commands.",
          "Electron integration evidence for install/update/login success, cancellation, timeout and failure with automatic revalidation and no application restart.",
          "Regression evidence for existing Setup Readiness, Chat and Automation flows, plus platform-appropriate macOS, Linux and Windows installer validation."
        ]
      },
      "planned_transition": {
        "goal": "在生产代码中实现并验证受控 Codex CLI 安装、更新、显式认证、typed IPC、Setup Readiness 交互、Runtime ready 门禁和凭证安全边界。",
        "expected_state_change": "关闭实现 Gap，以新的生产实现事实取代旧实现边界事实，并将 accepted-facts realization 与 material-risk evidence impacts 更新为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260825-010-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "resolver、CodexSetupManager、main/preload typed IPC、Setup Renderer 和 Runtime consumers 已共同实现接受契约；定向、跨层、真实 Electron 与完整回归证据覆盖三平台固定 installer、显式认证、secret transport、活动 owner 门禁、失败恢复和无需重启的自动复核。",
          "evidence": [
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
            "Verification: real Setup Electron regression passed",
            "Verification: git diff --check passed",
            "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection",
            "https://learn.chatgpt.com/docs/codex/cli",
            "https://learn.chatgpt.com/docs/auth"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-010-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit production code now implements the durable Codex Setup contract through executable provenance, fixed macOS/Linux/Windows standalone installer orchestration, explicit non-preselected authentication, login-status verification, active-owner update guards, stdin-only API/access-token transport, typed main/preload/renderer actions, recoverable operation states, and automatic post-operation revalidation without application restart.",
            "basis": "Direct inspection and execution of the production implementation, focused cross-layer tests, real Electron Setup verification, current-host Codex status probing, and the complete ArcOrbit validation entrypoint.",
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
              "Verification: current-host CodexSetupManager inspection returned ready with executable provenance, version, authenticated status, and capability projection"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-CODEX-SETUP-CURRENT-BOUNDARY",
            "revision": 1,
            "reason": "The production boundary has changed: installation, update, authentication, logout and recheck actions now exist behind the controlled CodexSetupManager and typed IPC.",
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "FACT-20260825-010-001",
            "revision": 1,
            "reason": "Its durable-contract assertion remains represented by the accepted contract, but its temporal claim that production has not realized the contract is now obsolete and replaced by local:fact:codex_setup_implemented.",
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260825-010-004",
            "fact_id": "FACT-20260825-010-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Production resolver, manager, IPC, Renderer and Runtime readiness boundaries now realize the accepted Codex Setup contract.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260825-010-005",
            "fact_id": "FACT-20260825-010-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Repeatable tests now cover fixed cross-platform installer specs, provenance and external-install preservation, active-owner update blocking, capability-gated explicit authentication, stdin-only secrets, sanitized failure/cancellation, status verification and Electron revalidation.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
              "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection"
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
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The durable product contract remains authoritative and the production Setup capability now realizes its install, update, authentication, readiness and recovery expectations.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implemented Setup surface matches the durable unselected choices, disabled continuation, progress, cancellation, failure, retry and automatic revalidation states.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The new Setup panel uses the existing Desktop controls, spacing, status and action styling without introducing a competing visual language; the real Electron fixture verifies the rendered state transitions.",
            "fact_refs": [
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Manager ownership, fixed platform installer allowlist, executable provenance, typed IPC, active-owner gate, secret transport and verification order remain aligned with the durable technical solution and are directly represented in production code.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted Codex Setup contract is now realized across resolver, manager, main/preload IPC, Renderer and existing Runtime readiness consumers.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Credential leakage, arbitrary command construction, external-install replacement, active-owner updates, platform installer selection, failure recovery and readiness revalidation have repeatable unit, cross-layer, Electron and full-suite evidence proportionate to the implemented boundary.",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
              "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused manager/resolver/renderer suites passed",
        "Verification: real Setup Electron regression passed",
        "Verification: npm run check — 452 tests, 441 passed, 11 environment-gated skips, 0 failed",
        "Verification: git diff --check passed",
        "Verification: credential-boundary scan found no auth.json access, secret persistence, or secret console projection",
        "https://learn.chatgpt.com/docs/codex/cli",
        "https://learn.chatgpt.com/docs/auth"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T16:52:06.495Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 Codex Setup 实现的正确性、问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion Review 是当前唯一 ready 且直接阻塞 Case closeout 的候选；其余四个 Project Gap 都需要独立 Case。",
        "snapshot_token": "5530e1bdab708f5b99cf7f88f3e4c5d4fa73e302f0b87e82bee7ae94f1b0358e",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:1",
        "comparison_summary": "已比较全部五个 persisted candidates；Completion Review 可在当前 Case 执行，四个 Project Gap 均为 case_required，不能替代当前 review。",
        "fresh_discovery_summary": "独立审查发现五项实现或验证 finding；它们通过 completion_review_result 提交，由 ledger 在提交后派生修复 Gap，本轮不提前创建 canonical Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，且不阻塞 CASE-20260825-010 当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，不能在当前 Completion Review 中展开。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 permission-bearing Case；当前 review 仅评估 CASE-010 已实现内容。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "虽具高紧迫性，但需要独立 Case，不能取代当前 Case closeout review。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "唯一 ready 候选，负责审查当前实现并决定 Case 能否关闭。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:1",
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
        "goal": "独立审查 Codex Setup 实现的正确性、问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录五项 Completion Review findings，并由 trusted ledger 在提交后派生后续修复 Gap；Case 保持 unresolved。"
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
              "id": "FINDING-20260825-010-001",
              "kind": "error",
              "statement": "设备码登录由隐藏子进程执行，但 manager 和 Renderer 未投影经清理的验证 URL 与一次性 device code，用户无法完成官方 device-auth 流程。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "arckit/interaction/setup-readiness/interaction.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:157",
                "runtime/arcorbit/src/codex-setup-manager.mjs:284",
                "runtime/arcorbit/desktop/renderer/renderer.js:725",
                "https://learn.chatgpt.com/docs/auth"
              ]
            },
            {
              "id": "FINDING-20260825-010-002",
              "kind": "error",
              "statement": "登录取消、超时或失败后没有自动重新运行 `codex login status`；status probe 异常会直接 reject，非零退出码也始终映射为 selection-required，未实现 logged-out、expired 与 login-failed 的接受状态语义。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:62",
                "runtime/arcorbit/src/codex-setup-manager.mjs:92",
                "runtime/arcorbit/src/codex-setup-manager.mjs:104",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:158"
              ]
            },
            {
              "id": "FINDING-20260825-010-003",
              "kind": "omission",
              "statement": "standalone migration 只改变 resolver 候选顺序并检查任意 Codex 是否可用；若 discovery 回退到原外部 executable，操作仍可能被当作成功，未证明 ArcOrbit 已选择 standalone 或 PATH 冲突已消除。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-executable-resolver.mjs",
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-executable-resolver.mjs:104",
                "runtime/arcorbit/src/codex-setup-manager.mjs:139",
                "runtime/arcorbit/src/codex-setup-manager.mjs:102",
                "arckit/tech/arcorbit/installer-supply-chain.md:330"
              ]
            },
            {
              "id": "FINDING-20260825-010-004",
              "kind": "omission",
              "statement": "official installer 下载直接对响应调用 `arrayBuffer()`，没有执行 durable technical contract 要求的响应大小上限，留下不必要的内存与供应链资源风险。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:270",
                "runtime/arcorbit/src/codex-setup-manager.mjs:273",
                "arckit/tech/arcorbit/installer-supply-chain.md:331"
              ]
            },
            {
              "id": "FINDING-20260825-010-005",
              "kind": "omission",
              "statement": "现有 Electron fixture 只验证 API Key 的 Renderer 成功路径，未通过生产 main/preload/manager 覆盖 install、update、浏览器/设备码登录的成功、取消、超时和失败，因此不足以支持已声明的 Electron 集成验收。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
                "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs"
              ],
              "evidence": [
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs:36",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs:70",
                "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs:132",
                "Verification: focused resolver/manager/renderer suite passed 70 tests but did not exercise the missing production Electron recovery matrix"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused resolver/manager/renderer suite passed 70 tests",
            "Verification: git diff --check passed",
            "https://learn.chatgpt.com/docs/codex/cli",
            "https://learn.chatgpt.com/docs/auth"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品契约；Codex Setup 的目标、状态、ready 条件和恢复要求仍可从 durable spec 准确恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "设备码、等待、取消、超时、失败和重新验证的正确交互预期仍由 durable interaction artifact 明确定义，review finding 是实现偏差而非预期丢失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "本次 review 未发现 Setup panel 引入竞争性视觉语言或偏离现有 Desktop 控件体系。",
            "fact_refs": [
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "arckit/interaction/setup-readiness/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 对 device code、状态复核、migration postcondition、installer bound 和验证矩阵的要求仍清晰可恢复，并直接支持定位本次实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "https://learn.chatgpt.com/docs/auth"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 不新增或修改 accepted fact/impact；实现偏差已作为 review findings 提交，ledger 将在提交后派生开放修复 Gap，届时由 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；验证缺口本身已作为 review finding 提交，需等待 ledger 派生修复 Gap 后基于新证据重新判断。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused resolver/manager/renderer suite passed 70 tests",
        "https://learn.chatgpt.com/docs/auth"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:00:13.396Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "安全捕获官方 device-auth challenge，只向当前 operation 投影经清理的验证 URL 与一次性代码，并在 Renderer 中显示给用户。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较全部九个 persisted candidates 后，FINDING-001 是五个 ready Case gaps 中直接阻断用户完成已公开 device-auth 路径的实现错误；四个 Project gaps 均需要独立 Case。",
        "snapshot_token": "b99520d42f88b4278794cf6169098c92b954c36d52c80c7cc9261e3f325564d8",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-001",
        "comparison_summary": "五个 review findings 均 blocking/high-risk；优先选择使公开认证方式实际不可用的 FINDING-001。认证状态复核、migration 后置条件、下载大小上限和 Electron 验证矩阵继续保留为 ready gaps。",
        "fresh_discovery_summary": "实现和验证未发现需要抢占 persisted candidates 的 fresh gap；本轮严格限定在设备码 challenge 的安全投影与可见呈现。",
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
            "reason": "需要独立 Case，不属于 CASE-20260825-010 当前 review finding 修复边界。"
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
            "reason": "需要独立 Case，不能替代当前用户阻塞型认证修复。"
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
            "reason": "需要独立 permission-bearing Case；当前工作仅修复已确认的 Setup 实现错误。"
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
            "reason": "虽具高紧迫性，但需要独立 Case，不能在当前 Case 中展开。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "公开的 device-auth 选项当前无法由用户完成，是直接的实现正确性与用户阻塞问题。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "认证失败与复核状态语义仍重要，但本轮 one-gap 约束下排在完全不可完成的 device-auth 路径之后。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "migration 后置条件仍需修复，但不如当前公开认证路径完全不可完成直接。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "installer 响应大小上限是材料性风险，保留到后续 fresh selection。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "完整 Electron 恢复矩阵仍缺失；本轮只添加足以证明所选设备码修复的定向与真实 Electron 回归证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 设备码登录由隐藏子进程执行，但 manager 和 Renderer 未投影经清理的验证 URL 与一次性 device code，用户无法完成官方 device-auth 流程。",
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
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "arckit/interaction/setup-readiness/interaction.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:157",
          "runtime/arcorbit/src/codex-setup-manager.mjs:284",
          "runtime/arcorbit/desktop/renderer/renderer.js:725",
          "https://learn.chatgpt.com/docs/auth"
        ]
      },
      "planned_transition": {
        "goal": "安全捕获官方 device-auth challenge，只向当前 operation 投影经清理的验证 URL 与一次性代码，并在 Renderer 中显示给用户。",
        "expected_state_change": "关闭 FINDING-001；原始认证输出仍不进入 Renderer 或 snapshot，其余四个 review-finding gaps 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Device-auth 子进程的流式输出现在经 ANSI/control 清理、HTTPS 与 OpenAI/ChatGPT hostname 白名单过滤后，只将 verification_url 和 user_code 投影到当前 operation；Renderer 通过 textContent 显示 challenge，操作结束后既有生命周期会清除该数据。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: focused Codex Setup manager and Desktop Renderer suites — 64 passed, 0 failed",
            "Verification: real Setup Electron regression — 1 passed, 0 failed",
            "Verification: npm run check — 454 tests, 443 passed, 11 environment-gated skips, 0 failed",
            "Verification: git diff --check passed",
            "https://learn.chatgpt.com/docs/auth"
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
          "FINDING-20260825-010-001"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有 durable product contract 仍准确规定显式 device-auth 与 ready 条件；本轮实现使该公开能力可实际完成，没有改变产品含义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "https://learn.chatgpt.com/docs/auth"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "验证 URL 与一次性代码只在当前认证 operation 中投影，并复用现有可访问状态区域显示，符合 durable device-auth 交互与操作后清理语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有 operation status 区域且未修改主题、token、组件样式或 durable visual-language 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "受控进程仍由 main process 持有；新增边界只允许从官方认证输出派生两个结构化字段，不暴露 raw output、任意 URL、argv、environment 或新 IPC 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "https://learn.chatgpt.com/docs/auth"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "所选 device-auth challenge 已实现，但接受契约中的认证状态复核、standalone migration 后置条件、installer 下载边界和完整 Electron 恢复验证仍有 persisted open gaps。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "设备码 challenge 的域名约束、最小投影、raw-output 隔离和生命周期清理已有重复测试与真实 Electron 回归证据；其余状态、迁移、资源边界和 Electron 矩阵风险尚未全部形成可信证据。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: focused Codex Setup manager and Desktop Renderer suites — 64 passed, 0 failed",
              "Verification: real Setup Electron regression — 1 passed, 0 failed",
              "Verification: npm run check — 454 tests, 443 passed, 11 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: focused Codex Setup manager and Desktop Renderer suites — 64 passed, 0 failed",
        "Verification: real Setup Electron regression — 1 passed, 0 failed",
        "Verification: npm run check — 454 tests, 443 passed, 11 environment-gated skips, 0 failed",
        "Verification: git diff --check passed",
        "https://learn.chatgpt.com/docs/auth"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:09:35.266Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让登录操作和独立认证检查始终以 fresh codex login status 形成可恢复的 authenticated、logged-out、expired 或 login-failed 状态。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较全部八个 persisted candidates 后，FINDING-002 是四个 ready Case gaps 中唯一剩余的实现错误，影响所有登录方式的最终状态和 Runtime ready 可信度；三个 omission 在本轮 one-gap 约束下继续延后。",
        "snapshot_token": "52850147e3cf926d066dfd5828b29e660cb452372ed696cb28a6725a10cf9a30",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-002",
        "comparison_summary": "FINDING-002 直接影响登录取消、超时、失败和 fresh status probe 的状态正确性，优先于 migration 后置条件、installer 下载边界及验证矩阵 omission。四个 Project gaps 均需要独立 Case。",
        "fresh_discovery_summary": "实现和验证没有发现需要抢占 persisted candidates 的 fresh gap；本轮严格限定于认证状态探测、失败复核和状态分类。",
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
            "reason": "需要独立 Case，不属于当前 Codex Setup review finding 修复边界。"
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
            "reason": "需要独立 Case，不能替代当前认证状态机修复。"
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
            "reason": "需要独立 permission-bearing Case；当前工作只修复已确认的本地认证状态错误。"
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
            "reason": "虽具高紧迫性，但需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该实现错误使全部登录方式在取消、超时、失败或 status probe 异常后产生不可信状态，并可能错误影响 ready 门禁。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "migration 后置条件仍需修复，但影响显式迁移路径，不及全认证状态机错误广泛。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "installer 响应大小上限是材料性资源风险，保留到后续 fresh selection。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "完整 Electron 恢复矩阵应在剩余实现 findings 修复后基于 fresh state 扩充。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
        "responsibility": "agent",
        "goal": "Resolve review finding: 登录取消、超时或失败后没有自动重新运行 `codex login status`；status probe 异常会直接 reject，非零退出码也始终映射为 selection-required，未实现 logged-out、expired 与 login-failed 的接受状态语义。",
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
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:62",
          "runtime/arcorbit/src/codex-setup-manager.mjs:92",
          "runtime/arcorbit/src/codex-setup-manager.mjs:104",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:158"
        ]
      },
      "planned_transition": {
        "goal": "让登录操作和独立认证检查始终以 fresh codex login status 形成可恢复的 authenticated、logged-out、expired 或 login-failed 状态。",
        "expected_state_change": "关闭 FINDING-002；登录失败、超时和取消会先投影 rechecking 并重新探测，status probe 异常转为可重试状态，其余三个 findings 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "CodexSetupManager 现在安全收敛 login status 的 spawn、timeout 和畸形结果；零退出码投影 authenticated，普通非零投影 logged-out，既有认证失效投影 expired，显式 logout 保持 logged-out。登录进程失败、超时或取消后先投影 rechecking 并 fresh-run status；只有 status 为零才返回 ready，否则投影无敏感诊断的 login-failed。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Codex Setup manager and Desktop Renderer suites — 67 passed, 0 failed",
            "Verification: real Setup Electron regression — 1 passed, 0 failed",
            "Verification: npm run check — 457 tests, 446 passed, 11 environment-gated skips, 0 failed",
            "Verification: git diff --check passed",
            "https://learn.chatgpt.com/docs/auth"
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
          "FINDING-20260825-010-002"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有 durable product contract 仍准确规定 Codex 登录方式、独立认证状态和 ready 条件；本轮实现修复未改变产品含义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "https://learn.chatgpt.com/docs/auth"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "登录成功、失败、取消和超时现在都经过可观察的 rechecking 状态，并形成可重试且不保留 secret 的结果，符合 durable interaction artifact。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有修改主题、token、组件样式或 durable visual-language 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "认证事实仍只来自受控 main-process login status 退出码；实现不解析 status 输出或 credential file，不向 Renderer 暴露 raw diagnostics。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "设备码和认证状态机现已实现，但 standalone migration 后置条件、installer 响应大小边界和完整 Electron 恢复验证仍有 persisted open gaps。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "登录状态分类、失败复核、探测异常收敛和敏感诊断隔离已有重复测试及完整回归证据；迁移、下载资源边界和生产 Electron 恢复矩阵风险仍未全部受控。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused Codex Setup manager and Desktop Renderer suites — 67 passed, 0 failed",
              "Verification: real Setup Electron regression — 1 passed, 0 failed",
              "Verification: npm run check — 457 tests, 446 passed, 11 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused Codex Setup manager and Desktop Renderer suites — 67 passed, 0 failed",
        "Verification: real Setup Electron regression — 1 passed, 0 failed",
        "Verification: npm run check — 457 tests, 446 passed, 11 environment-gated skips, 0 failed",
        "Verification: git diff --check passed",
        "https://learn.chatgpt.com/docs/auth"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:15:45.073Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让官方 Codex installer 响应在写入和执行前受到固定大小上限约束，并以重复测试证明声明长度与实际流式字节均无法绕过边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部 7 个 persisted candidates；优先选择能直接控制官方 installer 供应链资源风险、边界明确且可独立重复验证的 FINDING-004。",
        "snapshot_token": "d0aa4b4ca7d4a96b672c249fa55ad0d6a944452bb41a930037c9d81284158f28",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-004",
        "comparison_summary": "4 个 Project Gap 均需独立 Case；FINDING-003 涉及迁移正确性，FINDING-005 涉及较宽的 Electron 验证矩阵。FINDING-004 是当前最小、直接且高风险的供应链资源边界修复，并应先于最终 Electron 矩阵验收完成。",
        "fresh_discovery_summary": "检查 durable contract、生产下载路径和测试后，未发现需要抢占 persisted candidates 的 fresh Gap。",
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
            "reason": "需要独立 Case，且不属于当前 Codex Setup review finding 的最小修复范围。"
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
            "reason": "需要独立 Case；当前 active Case 已有可直接推进的高风险 ready Gap。"
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
            "reason": "需要独立真实权限项目 Case，不在本轮 Codex Setup 修复边界内。"
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
            "reason": "虽然紧迫，但需独立 Case；不会抢占当前 active Case 的 blocking review finding。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "迁移后置条件仍重要，但本轮供应链下载资源边界更小、更直接且可独立验收。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "直接暴露官方 installer 下载的无界内存与供应链资源风险；合同、实现位置和验收证据均已明确。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "Electron 恢复矩阵范围较宽，并应在剩余实现修复完成后验证最终生产行为。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
        "responsibility": "agent",
        "goal": "Resolve review finding: official installer 下载直接对响应调用 `arrayBuffer()`，没有执行 durable technical contract 要求的响应大小上限，留下不必要的内存与供应链资源风险。",
        "reason": "omission found by completion review",
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
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:270",
          "runtime/arcorbit/src/codex-setup-manager.mjs:273",
          "arckit/tech/arcorbit/installer-supply-chain.md:331"
        ]
      },
      "planned_transition": {
        "goal": "让官方 Codex installer 响应在写入和执行前受到固定大小上限约束，并以重复测试证明声明长度与实际流式字节均无法绕过边界。",
        "expected_state_change": "生产下载路径不再整体物化无界响应；超过 1 MiB 的响应在 installer 进程启动前被拒绝，正常下载与临时文件清理保持有效。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "`runOfficialInstaller` 已移除无界 `arrayBuffer()`：先检查 Content-Length，再通过 Web Stream 逐块累计实际字节；任一边界超过固定 1 MiB 上限都会取消流并返回 `INSTALLER_RESPONSE_TOO_LARGE`，且不会启动 installer 进程。正常响应仍写入 owner-only 临时文件、执行并在结束后清理。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Codex Setup manager and Desktop Renderer suites — 68 passed, 0 failed",
            "Verification: real Setup Electron regression — 1 passed, 0 failed",
            "Verification: npm run check — 458 tests, 447 passed, 11 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-004"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有产品契约仍准确规定官方 standalone installer、受控安装和 ready 条件；本轮只实现既定资源边界，不改变产品含义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "超限下载沿用既有可恢复安装失败状态和稳定错误边界，不新增选择、导航或恢复语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件、布局或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现直接兑现 durable technical contract 的响应大小上限：固定常量、Content-Length 预检、实际流式累计、超限取消、稳定错误和执行前拒绝均可从代码恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "installer 响应大小边界现已实现，但 standalone migration 后置条件与完整生产 Electron 恢复矩阵仍是 persisted open gaps。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "下载资源风险已有声明长度、无长度流式越界、正常执行、临时清理、真实 Electron 与完整回归证据；迁移选择正确性和生产 Electron 恢复矩阵风险仍未全部受控。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused Codex Setup manager and Desktop Renderer suites — 68 passed, 0 failed",
              "Verification: real Setup Electron regression — 1 passed, 0 failed",
              "Verification: npm run check — 458 tests, 447 passed, 11 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused Codex Setup manager and Desktop Renderer suites — 68 passed, 0 failed",
        "Verification: real Setup Electron regression — 1 passed, 0 failed",
        "Verification: npm run check — 458 tests, 447 passed, 11 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:20:04.030Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 standalone migration 的成功事实绑定 fresh executable discovery，明确拒绝任何 external executable 回退或未解决的配置/PATH 冲突。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部 6 个 persisted candidates；优先修复决定迁移结果真实性的 FINDING-003，再让最终 Electron 矩阵验证稳定后的生产行为。",
        "snapshot_token": "92f29f96865ebd11892a38203ed591af869b51632f31ee34d8867d3d3308cda3",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-003",
        "comparison_summary": "4 个 Project Gap 均需独立 Case。两个 ready Case Gap 中，FINDING-003 是生产正确性前置条件；FINDING-005 是最终跨层验证义务，应在迁移行为修复后执行。",
        "fresh_discovery_summary": "检查 resolver、manager、durable migration contract 和现有测试后，未发现需要抢占 persisted candidates 的 fresh Gap。",
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
            "reason": "需要独立 Case，不属于当前 Codex Setup review finding 的最小修复范围。"
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
            "reason": "需要独立 Case；当前 active Case 仍有 blocking ready Gap。"
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
            "reason": "需要真实权限项目和独立 Case，不在当前迁移正确性边界内。"
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
            "reason": "需要独立 Case，不抢占当前 active Case 的迁移正确性缺口。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前实现可能把 external executable 回退误判为迁移成功，直接影响用户环境、所有权和后续更新行为的真实性。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "Electron 恢复矩阵应覆盖本轮修复后的最终 migration 和 Setup 行为，因此暂缓。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
        "responsibility": "agent",
        "goal": "Resolve review finding: standalone migration 只改变 resolver 候选顺序并检查任意 Codex 是否可用；若 discovery 回退到原外部 executable，操作仍可能被当作成功，未证明 ArcOrbit 已选择 standalone 或 PATH 冲突已消除。",
        "reason": "omission found by completion review",
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
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-executable-resolver.mjs:104",
          "runtime/arcorbit/src/codex-setup-manager.mjs:139",
          "runtime/arcorbit/src/codex-setup-manager.mjs:102",
          "arckit/tech/arcorbit/installer-supply-chain.md:330"
        ]
      },
      "planned_transition": {
        "goal": "让 standalone migration 的成功事实绑定 fresh executable discovery，明确拒绝任何 external executable 回退或未解决的配置/PATH 冲突。",
        "expected_state_change": "迁移仅在 fresh inspection 返回 available standalone 时成功；否则返回 migrate-failed、实际 external provenance 和稳定可恢复错误。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "CodexSetupManager 的 migration 现在具有专用 postcondition：installer 完成并切换 resolver preference 后，fresh inspection 必须证明 executable 可用且 provenance 为 standalone。若 discovery 回退到 configured、npm、Homebrew 或 unknown-external，manager 返回 `migrate-failed` 和 `MIGRATION_POSTCONDITION_FAILED`，保留真实 command/provenance，并提示处理 executable 配置或 PATH 冲突。Resolver 测试同时证明 standalone 与 external 候选并存时，显式 preference 会实际选择、版本验证并缓存 standalone。",
          "evidence": [
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Resolver, Codex Setup Manager and Desktop Renderer suites — 78 passed, 0 failed",
            "Verification: real Setup Electron regression — 1 passed, 0 failed",
            "Verification: npm run check — 460 tests, 449 passed, 11 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-003"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有产品契约仍准确规定外部安装保留、显式 standalone migration 和操作后重新验证；本轮只兑现既定成功条件。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "迁移成功和失败现在与实际 executable 选择一致；冲突路径保留真实 external 状态、稳定错误及可重试恢复提示。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "resolver preference、fresh discovery、provenance 分类、migration postcondition 和稳定失败语义均直接对应 durable technical contract，可从实现和测试恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "device-auth、认证状态、installer 大小边界和 migration postcondition 已实现，但完整生产 Electron 恢复矩阵仍是 persisted open Gap。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "迁移的 standalone 成功、external 回退、真实 command/provenance 和配置/PATH 冲突已有重复测试及全套回归证据；生产 Electron install/update/browser/device-auth 恢复矩阵仍未完整形成。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused Resolver, Codex Setup Manager and Desktop Renderer suites — 78 passed, 0 failed",
              "Verification: real Setup Electron regression — 1 passed, 0 failed",
              "Verification: npm run check — 460 tests, 449 passed, 11 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused Resolver, Codex Setup Manager and Desktop Renderer suites — 78 passed, 0 failed",
        "Verification: real Setup Electron regression — 1 passed, 0 failed",
        "Verification: npm run check — 460 tests, 449 passed, 11 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:23:39.378Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让真实 Electron 测试通过生产 main 使用的 typed IPC、生产 sandboxed preload 和真实 CodexSetupManager，覆盖安装、更新、浏览器/设备码登录以及取消、超时和失败后的重新验证。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "FINDING-005 是当前 Case 唯一 ready Gap，直接阻塞 Codex Setup 实现的验证可信度；其余四个 persisted Project Gap 均需独立 Case，不能在本轮推进。",
        "snapshot_token": "b7a87ea49572986505a7d1b4028776559fdaf0097eb67b521c66b3ff7936f7df",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
        "comparison_summary": "比较了全部五个 persisted candidates。唯一 ready Case Gap 被选中；四个 Project Gap 因 case_required 延后。",
        "fresh_discovery_summary": "工作区检查确认现有 Electron fixture 绕过生产 preload、main IPC 输入收敛和真实 manager；未发现会改变本轮验收对象或范围的独立 fresh Gap。",
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
            "reason": "高风险、高不确定性，但需要独立 Case，且不覆盖当前 Codex Setup 验证缺口。"
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
            "reason": "高风险、urgency medium，但需要独立 Case。"
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
            "reason": "高风险、urgency medium，但需要真实 permission-bearing 项目的独立 Case。"
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
            "reason": "高风险、urgency high，但需要独立 Case，不能替代当前 Case 的最后一个验证义务。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前 Case 唯一 ready Gap；验证边界明确、可重复，并直接阻塞实现风险证据闭合。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-005",
        "responsibility": "agent",
        "goal": "Resolve review finding: 现有 Electron fixture 只验证 API Key 的 Renderer 成功路径，未通过生产 main/preload/manager 覆盖 install、update、浏览器/设备码登录的成功、取消、超时和失败，因此不足以支持已声明的 Electron 集成验收。",
        "reason": "omission found by completion review",
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
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs:36",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs:70",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs:132",
          "Verification: focused resolver/manager/renderer suite passed 70 tests but did not exercise the missing production Electron recovery matrix"
        ]
      },
      "planned_transition": {
        "goal": "让真实 Electron 测试通过生产 main 使用的 typed IPC、生产 sandboxed preload 和真实 CodexSetupManager，覆盖安装、更新、浏览器/设备码登录以及取消、超时和失败后的重新验证。",
        "expected_state_change": "Electron 集成证据不再由测试专用 Codex API 模拟；生产跨层恢复矩阵成为可重复回归测试，FINDING-005 可被解决。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-005",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Codex Setup IPC handlers 与登录输入收敛已抽成 Desktop main 实际注册的生产模块。Electron fixture 通过该模块、真实 `desktop/preload.cjs` 和真实 CodexSetupManager 执行受控矩阵；只有 resolver、installer 和 process 外部依赖在 main process 注入。测试证明安装与更新使用固定官方 URL，浏览器与设备码登录使用固定 argv，设备 challenge 经结构化事件投影，取消、超时和失败均执行 fresh status recheck、清除 operation 并返回稳定结果。",
          "evidence": [
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-ipc.html",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
            "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-005"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有产品契约仍准确规定安装、更新、显式登录、自动复核和 ready 条件；本轮仅使其生产 Electron 验收证据成立。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装后 selection-required、登录 ready、设备码 challenge，以及取消、超时和失败后的 rechecking 与重试状态均与 durable interaction artifact 一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "生产 main、preload 与 manager 的关系现在由共享 typed IPC 模块明确表达；fixture 仅在 manager 已有外部依赖边界注入受控行为，没有向 Renderer 暴露命令、URL、环境或测试控制入口。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现及其跨层 Electron 证据现在共同覆盖 accepted Codex Setup contract，包括此前五项 review finding 的实现与验证边界。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "固定 installer、fresh discovery、browser/device argv、device challenge、取消、超时、失败与重新验证现在都有真实 Electron 跨生产边界证据，并由聚焦和完整回归重复验证。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
              "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-ipc.html",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
        "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:34:18.823Z"
    },
    {
      "round": 9,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查已完成的 Codex Setup 实现，判断实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较当前快照中的全部 persisted candidates；四个 Project gaps 均需要独立 Case，CASE-20260825-010 的 Completion Review 是唯一 ready candidate，也是关闭当前 Case 前的阻塞步骤。",
        "snapshot_token": "917d34bcb1d5e50fda8e393c61cd3b548f58f654539465900bd34a86813a9e10",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:2",
        "comparison_summary": "唯一 ready candidate 是当前 Case 的 Completion Review；其 blocking、risk 和 user impact 均为 high。其余四个 persisted Project gaps 虽有高风险或高紧迫性，但 eligibility 均为 case_required，不能在本轮替代当前审查。",
        "fresh_discovery_summary": "独立审查发现一项新的 IPC authority/state-gate omission；该问题通过 completion_review_result 声明，由 ledger 提交后派生普通修复 Gap，本轮不预建 canonical Gap 或修改实现。",
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
            "reason": "需要独立 Case 验证动态 gap selection 场景，不属于当前 Codex Setup Completion Review 的关闭边界。"
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
            "reason": "需要独立 Case 处理 Runtime resilience 与 adapter 验收，不能替代当前 Case 的阻塞型 Completion Review。"
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
            "reason": "需要独立 permission-bearing Case；当前审查只判断 CASE-20260825-010 的实现与证据。"
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
            "reason": "虽具有高紧迫性和高风险，但必须建立独立 Case，不能越过当前 Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case gaps 已关闭；这是当前 Case 唯一 ready candidate，必须独立审查五个完成维度。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:7"
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
        "goal": "独立审查已完成的 Codex Setup 实现，判断实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录带一项 IPC authority/state-gate omission 的 Completion Review findings，由 ledger 派生下一轮普通修复 Gap。"
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
              "id": "FINDING-20260825-010-006",
              "kind": "omission",
              "statement": "生产 Codex Setup IPC handlers 没有校验调用窗口 sender，也没有接收或验证一次性 confirmation id、operation id 与调用时的 authoritative snapshot。安装、更新、迁移、取消和登录等高权限动作因此可以绕过 Renderer 确认直接调用；并发调用还可能在前置检查完成后排队执行。现有 Electron 矩阵只证明成功与恢复路径，没有证明未授权 sender、缺失确认、过期状态或重放调用会 fail closed。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:14",
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:23",
                "runtime/arcorbit/desktop/main.mjs:409",
                "runtime/arcorbit/desktop/main.mjs:673",
                "arckit/tech/arcorbit/installer-supply-chain.md:365",
                "arckit/tech/arcorbit/installer-supply-chain.md:376",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs:47",
                "Verification: git diff --check passed; static review found no negative IPC authority/confirmation/replay assertion in the production Electron matrix"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
            "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
          ],
          "reviewed_content_revision": 7
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品契约；安装、更新、显式认证、自动复核、外部安装保护和 ready 条件仍可从 durable spec 准确恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户确认、无默认认证选择、进度、取消、失败、重试和重新验证的交互预期仍由 durable interaction artifact 明确定义；本次 finding 是 main-process 实现门禁偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮审查未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 明确规定 typed IPC、sender、operation id、capability、authoritative snapshot 与一次性 confirmation 门禁，足以直接定位本次实现遗漏，技术决策本身仍清晰可恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 不新增或修改 accepted fact/impact；安全门禁偏差已作为 review finding 提交，需等待 ledger 派生开放修复 Gap 后基于 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；IPC authority、confirmation 与重放拒绝的证据缺口已作为 review finding 提交，需在派生修复 Gap 中形成重复、负向验证证据。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused Resolver, Codex Setup Manager, Desktop Renderer and real Electron suites — 79 passed, 0 failed",
        "Verification: npm run check with real Setup Electron matrix — 460 tests, 450 passed, 10 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:39:14.480Z"
    },
    {
      "round": 10,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "使 Codex Setup 高权限 IPC 在 sender、一次性确认、authoritative snapshot、operation id 和串行前置条件上 fail closed，并以负向 Electron 证据证明。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部 persisted obligations；四个 Project Gap 均需另建 Case，FINDING-006 是当前 Case 唯一 ready、blocking/high-risk 候选。",
        "snapshot_token": "e8615a7cee0096c81a783e270d6dab77cfd35958ccfd7d3daf49f816d68fe3ab",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-006",
        "comparison_summary": "FINDING-006 直接阻塞当前 Case 的 Completion Review，且涉及高权限 IPC、确认绕过和并发重放风险；其优先级高于四个需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "实现和验证未发现超出 FINDING-006 边界的新 Gap；后续 Completion Review 候选必须等待本轮提交后的 fresh snapshot。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，不能在当前 Codex Setup Case 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，且不阻塞当前 Case 的审查修复。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要真实 permission-bearing project 和独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "虽具高风险与紧迫性，但必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-006",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 唯一 ready Gap，直接阻塞 Completion Review，并暴露高权限 IPC 绕过及重放风险。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-006",
        "responsibility": "agent",
        "goal": "Resolve review finding: 生产 Codex Setup IPC handlers 没有校验调用窗口 sender，也没有接收或验证一次性 confirmation id、operation id 与调用时的 authoritative snapshot。安装、更新、迁移、取消和登录等高权限动作因此可以绕过 Renderer 确认直接调用；并发调用还可能在前置检查完成后排队执行。现有 Electron 矩阵只证明成功与恢复路径，没有证明未授权 sender、缺失确认、过期状态或重放调用会 fail closed。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:7"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:14",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:23",
          "runtime/arcorbit/desktop/main.mjs:409",
          "runtime/arcorbit/desktop/main.mjs:673",
          "arckit/tech/arcorbit/installer-supply-chain.md:365",
          "arckit/tech/arcorbit/installer-supply-chain.md:376",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs:47",
          "Verification: git diff --check passed; static review found no negative IPC authority/confirmation/replay assertion in the production Electron matrix"
        ]
      },
      "planned_transition": {
        "goal": "使 Codex Setup 高权限 IPC 在 sender、一次性确认、authoritative snapshot、operation id 和串行前置条件上 fail closed，并以负向 Electron 证据证明。",
        "expected_state_change": "解决 FINDING-20260825-010-006，将对应 review finding 标记为已处理，使当前 Case 可在 post-commit fresh snapshot 中重新进入 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-006",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "生产 IPC 现在验证调用窗口 sender；安装、更新、迁移和退出使用由 main-process 原生对话框签发、绑定 action 与 authoritative snapshot、消费即失效的一次性 confirmation；取消必须匹配当前 operation id；所有 mutation 在同一串行临界区内重新检查 fresh state。负向测试证明未授权 sender、缺失或过期确认、确认重放、错误 operation id 和并发陈旧前置条件均被拒绝。",
          "evidence": [
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 72 passed, 0 failed",
            "Verification: real Setup Electron authority and recovery matrix — 1 passed, 0 failed",
            "Verification: npm run check with real Setup Electron matrix — 463 tests, 453 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-006"
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、迁移、退出、显式确认及 ready 条件没有改变；实现继续兑现既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "高权限动作使用 main-process 原生确认，取消只作用于当前可见 operation；成功、取消、失败和复核语义仍与 durable interaction artifact 一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "sender authority、原生确认、action/snapshot 绑定、一次性消费、operation id 和临界区内 fresh precondition 均由明确的生产边界实现并由测试恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Codex Setup 的 typed IPC 与安全确认边界现已完整实现，修复了 Completion Review 指出的实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复负向测试直接证明未授权 sender、过期或重放 confirmation、错误 operation id 及排队陈旧状态均 fail closed；完整回归证明既有 Setup、Chat、Automation 等边界未回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused suites — 72 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: npm run check — 463 tests, 453 passed, 10 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: 72 focused Node tests passed",
        "Verification: real Setup Electron matrix passed",
        "Verification: full check — 463 tests, 453 passed, 10 skipped, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:48:53.651Z"
    },
    {
      "round": 11,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 8 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部 persisted obligations；四个 Project Gap 均要求独立 Case，Completion Review 3 是当前 Case 唯一 ready 且直接阻塞关闭的候选。",
        "snapshot_token": "f8d9ef629e8d5564bd2c138bacf9a4868a78d9f54d109ff2af2a2f83c8ee1659",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:3",
        "comparison_summary": "Completion Review 3 的 blocking、risk 和 user impact 均为 high，并且是当前 Case 唯一可执行候选；其余四项虽有高风险或紧迫性，但 eligibility 均为 case_required。",
        "fresh_discovery_summary": "独立审查发现登录 confirmation 门禁遗漏和不可取消 operation 的交互错误；二者仅作为 Completion Review findings 提交，由 ledger 在下一 fresh snapshot 派生普通修复 Gap。",
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
            "reason": "需要独立 Case 验证动态 Gap selection 场景，不能替代当前 Completion Review。"
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
            "reason": "需要独立 Case 处理 Runtime resilience 与 adapter 验收。"
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
            "reason": "需要真实 permission-bearing project 和独立 Case。"
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
              "user_impact": "high"
            },
            "reason": "虽具高紧迫性和高风险，但必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:3",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case gaps 已关闭；这是当前 Case 唯一 ready candidate，必须独立完成五维审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:3",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:8"
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
        "goal": "独立审查 content revision 8 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录两个 Completion Review findings，由 trusted ledger 派生后续普通修复 Gap；本轮不修改实现、事实、impact 或 Project State。"
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
              "id": "FINDING-20260825-010-007",
              "kind": "omission",
              "statement": "Codex browser、device、API Key 和 Access Token 登录 IPC 仍只校验 sender，未取得或消费绑定 authoritative snapshot 的一次性 confirmation。主窗口 Renderer 因此可以直接启动登录流程；现有 Electron 矩阵也直接调用 loginCodex，未证明缺失、过期或重放登录确认会 fail closed。这没有完整解决 FINDING-006 明确包含的登录高权限动作确认边界。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
                "runtime/arcorbit/desktop/preload.cjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:44",
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:47",
                "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:50",
                "runtime/arcorbit/desktop/renderer/renderer.js:314",
                "runtime/arcorbit/desktop/renderer/renderer.js:320",
                "runtime/arcorbit/desktop/renderer/renderer.js:323",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:194",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:201",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:208",
                "arckit/tech/arcorbit/installer-supply-chain.md:376",
                "Verification: 72 focused tests passed while no test required a login confirmation id"
              ]
            },
            {
              "id": "FINDING-20260825-010-008",
              "kind": "error",
              "statement": "Renderer 只根据 operation 是否存在显示并启用取消按钮，忽略 operation.cancellable 和 operation.id。登录失败后的 rechecking 状态明确标记 cancellable=false 且没有 id；安装或登录任务结束后的 fresh inspection 期间也可能保留旧 operation 但 manager 已清除 controller。用户会看到可用取消动作，但点击无反馈或收到 OPERATION_NOT_ACTIVE，违反可取消阶段必须绑定当前 operation id 的交互语义。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "arckit/interaction/setup-readiness/interaction.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:147",
                "runtime/arcorbit/src/codex-setup-manager.mjs:154",
                "runtime/arcorbit/src/codex-setup-manager.mjs:286",
                "runtime/arcorbit/desktop/renderer/renderer.js:328",
                "runtime/arcorbit/desktop/renderer/renderer.js:330",
                "runtime/arcorbit/desktop/renderer/renderer.js:721",
                "runtime/arcorbit/desktop/renderer/renderer.js:722",
                "arckit/interaction/setup-readiness/interaction.md:164",
                "Verification: focused tests exercise active cancellation and rechecking observation but do not assert that the cancel control is hidden or disabled during non-cancellable phases"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 72 passed, 0 failed",
            "Accepted prior verification: real Setup Electron matrix — 1 passed, 0 failed",
            "Accepted prior verification: npm run check — 463 tests, 453 passed, 10 environment-gated skips, 0 failed"
          ],
          "reviewed_content_revision": 8
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
        "project_revision": 261,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品目标或验收含义；安装、更新、显式认证、重新验证与 ready 条件仍可从 durable spec 恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 已明确无默认认证选择、operation 期间禁用重复动作以及只有可取消阶段使用当前 operation id；本轮 findings 是实现偏差，不是长期交互语义缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮审查未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 明确规定 sender、operation id、capability、authoritative snapshot 与一次性 confirmation 门禁，足以直接识别登录路径的实现遗漏；技术决策本身仍清晰可恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 不新增或修改 accepted fact/impact；实现偏差已作为 review findings 提交，需等待 ledger 派生开放修复 Gap 后基于 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；登录 confirmation 与不可取消状态 UI 的负向证据缺口已作为 review findings 提交，需在派生修复 Gap 中形成重复验证证据。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused suites — 72 passed, 0 failed",
        "Accepted verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Accepted verification: full check — 463 tests, 453 passed, 10 skipped, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T17:52:36.869Z"
    },
    {
      "round": 12,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 browser、device、API Key 与 Access Token 登录全部通过绑定 authoritative snapshot 和所选 method/flow 的一次性 main-process confirmation，并以负向跨层测试证明 fail closed。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh snapshot 重新比较七个 persisted candidates。FINDING-007 仍为 ready，Case content revision 仍为 8，既有实现和验收证据保持 current；本次属于已完成 transition 的 rejected-claim repair，因此继续提交 FINDING-007。FINDING-008 与并发新增的 CASE-20260825-013 Gap 均 deferred，四个 Project Gap 仍需独立 Case。",
        "snapshot_token": "279b4b05b32eb592cb5c149c44b6c09f74051d2cee46e57436ded2075bcc431b",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-007",
        "comparison_summary": "保留并重新绑定 FINDING-007 的单一验收主张；FINDING-008 留待该 transition 被接受后的 fresh round，CASE-20260825-013 由其独立 Case 推进。",
        "fresh_discovery_summary": "fresh snapshot 新增了 CASE-20260825-013 的 ready Gap，但未使 FINDING-007 的身份、实现结果或验收证据过时。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在 CASE-20260825-010 transition 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且不属于当前 Codex Setup finding。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能替代当前 claim repair。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-007",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "既有实现和验证已完成，Gap 在 fresh snapshot 中仍 ready；仅上次 invariant_ref 编码使 claim 被拒绝。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-008",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "依 one-gap 约束保持开放，等待 FINDING-007 被接受后的 fresh round。"
          },
          {
            "ref": "case-gap:CASE-20260825-013:local:gap:materialize-create-case-identities",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻断没有现有 Case 的 Automation 待办进入执行循环。",
              "uncertainty": "真实 payload 和代码链已经确认根因，主要设计边界已明确。",
              "risk": "身份和跨引用物化错误可能污染 canonical Case，必须原子校验并覆盖空值、重复 handle、未知引用和回滚。",
              "user_impact": "当前待办直接停在 Runtime 尚未收束，无法继续自动开发。"
            },
            "reason": "这是并发新增的独立 Case Gap；本次 repair 必须保留仍 current 的既成 FINDING-007 验收主张，不能切换到另一 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-007",
        "responsibility": "agent",
        "goal": "Resolve review finding: Codex browser、device、API Key 和 Access Token 登录 IPC 仍只校验 sender，未取得或消费绑定 authoritative snapshot 的一次性 confirmation。主窗口 Renderer 因此可以直接启动登录流程；现有 Electron 矩阵也直接调用 loginCodex，未证明缺失、过期或重放登录确认会 fail closed。这没有完整解决 FINDING-006 明确包含的登录高权限动作确认边界。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:8"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:44",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:47",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs:50",
          "runtime/arcorbit/desktop/renderer/renderer.js:314",
          "runtime/arcorbit/desktop/renderer/renderer.js:320",
          "runtime/arcorbit/desktop/renderer/renderer.js:323",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:194",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:201",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:208",
          "arckit/tech/arcorbit/installer-supply-chain.md:376",
          "Verification: 72 focused tests passed while no test required a login confirmation id"
        ]
      },
      "planned_transition": {
        "goal": "让 browser、device、API Key 与 Access Token 登录全部通过绑定 authoritative snapshot 和所选 method/flow 的一次性 main-process confirmation，并以负向跨层测试证明 fail closed。",
        "expected_state_change": "解决 FINDING-007；登录 IPC 拒绝缺失、过期、错配及重放 confirmation，secret 保持在实际登录调用边界内。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-007",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "生产 main/preload/Renderer 与 Codex Setup IPC 已将全部登录方式纳入统一确认边界。confirmation 绑定当前 authoritative snapshot 和规范化 method/flow、消费即失效；API Key 与 Access Token secret 不进入确认请求或确认存储。Node 与真实 Electron 负向测试直接证明缺失确认、登录意图错配和重放均被拒绝。",
          "evidence": [
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 73 passed, 0 failed",
            "Verification: real Setup Electron authority and recovery matrix — 1 passed, 0 failed",
            "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-007"
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
        "project_revision": 262,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、显式认证、官方登录流程、自动复核与 ready 条件没有改变；生产实现继续遵循既有 durable product contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "登录仍要求无默认值的显式 method/flow 选择，并在启动外部流程前显示 main-process 原生确认；交互预期保持清晰且可恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "typed IPC 现在明确表达 sender authority、authoritative snapshot、登录意图绑定、一次性消费与 secret 排除边界，技术契约已同步对应签名。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-007 已修复，但已知 FINDING-008 表明 non-cancellable operation 仍可能投影可用取消控件，因此尚不能声明整个 accepted Setup interaction 已完整实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-008"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "登录 confirmation 风险已有 Node、真实 Electron 和完整回归证据，但不可取消状态 UI 的负向证据与修复仍由 FINDING-008 保持开放。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-008"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused suites — 73 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Verification: full check — 464 tests, 454 passed, 10 skipped, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T18:01:28.685Z"
    },
    {
      "round": 13,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "使取消控件只在当前 operation 明确可取消且具有有效 id 时显示、启用和调用取消 IPC，并以真实 Electron 负向场景证明 rechecking 等不可取消阶段不会触发取消。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部六个 persisted candidates。四个 Project Gap 需要独立 Case；CASE-20260825-013 的身份物化 Gap 虽为 ready，但当前指令明确要求继续 CASE-20260825-010。FINDING-008 是该 Case 唯一剩余、blocking=high 且 risk=high 的 ready Gap。",
        "snapshot_token": "e6f91c5ef4194ebc0f5e4e7c0ba499874b3326677158da54844c68c7232cef72",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-008",
        "comparison_summary": "选择 CASE-20260825-010 的唯一剩余 Gap FINDING-008；CASE-20260825-013 的 ready Gap 因属于另一 Case 而延后，四个 Project Gap 因 case_required 排除。",
        "fresh_discovery_summary": "检查 Renderer、manager 生命周期与现有测试后，未发现需要替代所选 persisted candidate 的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在 CASE-20260825-010 内推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且不属于当前 Codex Setup review finding。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能替代当前 Case 唯一 ready Gap。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-008",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是 CASE-20260825-010 唯一剩余 Gap；错误的取消控件会向用户提供无法兑现的操作并违反当前 operation id 绑定语义。"
          },
          {
            "ref": "case-gap:CASE-20260825-013:local:gap:materialize-create-case-identities",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻断没有现有 Case 的 Automation 待办进入执行循环。",
              "uncertainty": "真实 payload 和代码链已经确认根因，主要设计边界已明确。",
              "risk": "身份和跨引用物化错误可能污染 canonical Case，必须原子校验并覆盖空值、重复 handle、未知引用和回滚。",
              "user_impact": "当前待办直接停在 Runtime 尚未收束，无法继续自动开发。"
            },
            "reason": "该 Gap 属于 CASE-20260825-013；当前指令明确要求继续 CASE-20260825-010，因此留待独立 Case 轮次。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-008",
        "responsibility": "agent",
        "goal": "Resolve review finding: Renderer 只根据 operation 是否存在显示并启用取消按钮，忽略 operation.cancellable 和 operation.id。登录失败后的 rechecking 状态明确标记 cancellable=false 且没有 id；安装或登录任务结束后的 fresh inspection 期间也可能保留旧 operation 但 manager 已清除 controller。用户会看到可用取消动作，但点击无反馈或收到 OPERATION_NOT_ACTIVE，违反可取消阶段必须绑定当前 operation id 的交互语义。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:8"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:147",
          "runtime/arcorbit/src/codex-setup-manager.mjs:154",
          "runtime/arcorbit/src/codex-setup-manager.mjs:286",
          "runtime/arcorbit/desktop/renderer/renderer.js:328",
          "runtime/arcorbit/desktop/renderer/renderer.js:330",
          "runtime/arcorbit/desktop/renderer/renderer.js:721",
          "runtime/arcorbit/desktop/renderer/renderer.js:722",
          "arckit/interaction/setup-readiness/interaction.md:164",
          "Verification: focused tests exercise active cancellation and rechecking observation but do not assert that the cancel control is hidden or disabled during non-cancellable phases"
        ]
      },
      "planned_transition": {
        "goal": "使取消控件只在当前 operation 明确可取消且具有有效 id 时显示、启用和调用取消 IPC，并以真实 Electron 负向场景证明 rechecking 等不可取消阶段不会触发取消。",
        "expected_state_change": "解决 FINDING-008；Renderer 的显示、启用和点击路径统一绑定 operation.cancellable 与 operation.id，不可取消或无 id 状态 fail closed。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-008",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Renderer 现在仅在 operation.cancellable=true 且 operation.id 非空时显示并启用取消按钮，点击处理器也重复执行同一双重门禁。真实 Electron fixture 证明活动可取消 operation 的控件可用，而无 id、cancellable=false 的 rechecking 状态隐藏并禁用控件；即使强制派发点击事件也不会调用取消 IPC。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/interaction/setup-readiness/interaction.md",
            "Verification: focused Codex Setup IPC, Manager and Desktop Renderer suites — 73 passed, 0 failed",
            "Verification: real Setup Electron matrix — 1 passed, 0 failed",
            "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
          "FINDING-20260825-010-008"
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
        "project_revision": 262,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、显式认证、自动复核与 ready 条件没有改变；取消控件修复继续兑现既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "取消控件现在只在当前 operation 明确可取消且具有 id 时可见可用，与 durable interaction artifact 的可取消阶段语义一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "manager 投影的 operation cancellability/id 与 Renderer 显示、启用和 IPC 调用门禁现已形成一致且可测试的生命周期边界。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Codex Setup 的实际取消交互现在符合已接受契约：只有可取消且具备当前 operation id 的阶段才能提供或执行取消动作。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "静态 Renderer 断言、真实 Electron 活动/不可取消状态矩阵及完整回归共同证明取消操作在无 id 或不可取消阶段 fail closed，且既有 Setup 行为未回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused suites — 73 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/interaction/setup-readiness/interaction.md",
        "Verification: focused suites — 73 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Verification: full check — 464 tests, 454 passed, 10 skipped, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T18:06:16.965Z"
    },
    {
      "round": 14,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 10 的 Codex Setup 实现，覆盖实现正确性、问题真实解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部五个 persisted candidates。四个 Project Gap 均需独立 Case；当前指令要求继续 CASE-20260825-010，而 Completion Review 4 是该 Case 唯一 ready candidate，且 blocking、risk 与 user impact 均为 high。",
        "snapshot_token": "68136392bc44d8331d5a8b7dd890ac08e0622a4f2639cdb3dddc8a80f4f0047a",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:4",
        "comparison_summary": "选择 CASE-20260825-010 的 Completion Review 4；四个 Project Gap 因 case_required 排除。",
        "fresh_discovery_summary": "CASE content revision 仍为 10，审查对象与证据未变化。独立审查形成的三个 findings 属于 Completion Review 结果，不作为替代 persisted candidate 的 fresh ordinary Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在 CASE-20260825-010 的 Completion Review 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且不属于当前 Codex Setup 完成审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能替代当前 Case 的完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:4",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "CASE-20260825-010 的普通 Gap 已全部关闭，必须独立检查实现正确性、问题解决、验证可信度、回归风险和最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:4",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:10"
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
        "goal": "独立审查 content revision 10 的 Codex Setup 实现，覆盖实现正确性、问题真实解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 findings 型 Completion Review；不修改 Case 内容，由 trusted ledger 在后续 fresh snapshot 中派生普通修复 Gap。"
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
              "id": "FINDING-20260825-010-009",
              "kind": "error",
              "statement": "成功的 install、update、migrate、login 或 logout task 结束后，manager 先清除 currentController/currentOperationId，再开始 fresh inspection，但旧 snapshot 仍保留 cancellable=true 和 operation id。Renderer 因此继续显示并启用取消按钮，而点击必然得到 OPERATION_NOT_ACTIVE；FINDING-008 所描述的成功后 fresh-inspection 窗口仍未解决。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:141",
                "runtime/arcorbit/src/codex-setup-manager.mjs:143",
                "runtime/arcorbit/src/codex-setup-manager.mjs:280",
                "runtime/arcorbit/desktop/renderer/renderer.js:721",
                "Direct probe: while the post-install probe was blocked, snapshot.operation retained id and cancellable=true, while cancel returned OPERATION_NOT_ACTIVE",
                "Verification: existing Electron matrix injects a synthetic cancellable=false rechecking snapshot but does not hold the production manager inside successful post-task inspection"
              ]
            },
            {
              "id": "FINDING-20260825-010-010",
              "kind": "omission",
              "statement": "install、update 和 migration 未启用 failure recheck。若 installer 在部分写入后失败、超时或被取消，catch 路径直接复用操作前 snapshot，并将 operation 清空；它不会执行 durable contract 要求的 fresh executable discovery/version probe，因此可能错误显示 Codex 仍缺失或继续显示旧版本/来源。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:116",
                "runtime/arcorbit/src/codex-setup-manager.mjs:146",
                "runtime/arcorbit/src/codex-setup-manager.mjs:178",
                "runtime/arcorbit/src/codex-setup-manager.mjs:188",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:304",
                "arckit/spec/arcorbit-distribution.md:154",
                "arckit/tech/arcorbit/installer-supply-chain.md:338",
                "Direct probe: an installer that made Codex available and then threw PROCESS_TIMEOUT produced probes=1, status=install-failed, installation.available=false"
              ]
            },
            {
              "id": "FINDING-20260825-010-011",
              "kind": "error",
              "statement": "logout 只要求 `codex logout` 子进程退出码为 0，随后通用 inspect 若发现 `codex login status` 仍为 0，就返回 ready/authenticated 且 error=null。技术契约明确要求 logout 必须以非零 status 复核，异常结果应保留可重试错误；当前实现会把未真正退出误报为成功。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:91",
                "runtime/arcorbit/src/codex-setup-manager.mjs:101",
                "runtime/arcorbit/src/codex-setup-manager.mjs:268",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:169",
                "arckit/spec/arcorbit-distribution.md:152",
                "arckit/tech/arcorbit/installer-supply-chain.md:357",
                "Direct probe: logout exit 0 followed by login status exit 0 returned status=ready, authentication=authenticated, error=null"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Resolver, Codex Setup IPC, Manager and Desktop Renderer suites — 82 passed, 0 failed",
            "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
            "Accepted verification: npm run check — 464 tests, 454 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed",
            "Direct probe reproduced all three postcondition defects despite the green suites"
          ],
          "reviewed_content_revision": 10
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品目标或验收含义；安装、更新、显式认证、自动复核与 ready 条件仍由 durable product specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 明确规定 operation 期间的取消绑定、自动重新验证和 logout 恢复语义；本轮 findings 是实际实现偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 清楚规定成功后的 operation 生命周期、installer 取消后的 fresh discovery 以及 logout 的非零 status postcondition，足以直接定位三项实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 不新增或修改 accepted fact/impact；实际实现偏差已作为 review findings 提交，需等待 ledger 派生开放修复 Gap 后基于 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的三个 postcondition 缺口已作为 review findings 提交，需在派生修复 Gap 中形成重复负向证据。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused suites — 82 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Accepted verification: full check — 464 tests, 454 passed, 10 skipped, 0 failed",
        "Verification: git diff --check passed",
        "Direct probes reproduced stale cancellable operation, skipped failure discovery, and unenforced logout postcondition"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T18:12:29.273Z"
    },
    {
      "round": 15,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 install、update、migrate 在 installer 失败、超时或取消后执行 fresh executable discovery，同时保留原操作失败分类，并以部分写入回归测试证明状态投影已更新。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部七个 persisted candidates。四个 Project Gap 均需独立 Case；CASE-20260825-010 的三个 review finding 均为 blocking/risk high。选择 FINDING-010，因为它影响 install、update、migrate 三条恢复路径，并可能在部分写入后持续投影过期 executable 状态，影响范围与状态风险最高。",
        "snapshot_token": "218fd45363ce8e5dbeaa50a2123666e1175adee64a72177d23fd151269a1067a",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-010",
        "comparison_summary": "选择 FINDING-010；FINDING-009 与 FINDING-011 延后。四个 Project Gap 因 case_required 排除。",
        "fresh_discovery_summary": "代码推演与既有直接 probe 完全匹配 persisted finding；本轮未发现替代 persisted candidates 的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在当前 Codex Setup 修复 Case 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且不属于当前 installer failure recovery 缺口。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能替代当前 Case 的 review finding 修复。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-009",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "成功后的短暂 stale-cancel 窗口仍重要，但影响范围小于三条 installer mutation 的持久状态不一致。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-010",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "部分安装后失败、超时或取消会使 install、update、migrate 三条路径继续投影过期 executable 状态；修复边界明确且可重复验证。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-011",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "logout postcondition 仍需修复，但只影响单一认证退出路径，等待下一 fresh snapshot 重新比较。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-010",
        "responsibility": "agent",
        "goal": "Resolve review finding: install、update 和 migration 未启用 failure recheck。若 installer 在部分写入后失败、超时或被取消，catch 路径直接复用操作前 snapshot，并将 operation 清空；它不会执行 durable contract 要求的 fresh executable discovery/version probe，因此可能错误显示 Codex 仍缺失或继续显示旧版本/来源。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:10"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:116",
          "runtime/arcorbit/src/codex-setup-manager.mjs:146",
          "runtime/arcorbit/src/codex-setup-manager.mjs:178",
          "runtime/arcorbit/src/codex-setup-manager.mjs:188",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:304",
          "arckit/spec/arcorbit-distribution.md:154",
          "arckit/tech/arcorbit/installer-supply-chain.md:338",
          "Direct probe: an installer that made Codex available and then threw PROCESS_TIMEOUT produced probes=1, status=install-failed, installation.available=false"
        ]
      },
      "planned_transition": {
        "goal": "让 install、update、migrate 在 installer 失败、超时或取消后执行 fresh executable discovery，同时保留原操作失败分类，并以部分写入回归测试证明状态投影已更新。",
        "expected_state_change": "FINDING-010 resolved；installer failure recovery 使用 fresh installation/authentication projection，且不会把失败误报为成功。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-010",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "共用 mutation 失败路径现在区分 login 与 installer 语义。install、update、migrate 启用 failure recheck：controller 清除后先投影不可取消的 rechecking，再执行 fresh inspection；返回时保留 cancelled 或对应 operation-failed 状态及原错误 code，同时采用最新 executable provenance、command 和 version projection。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 21 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 84 passed, 0 failed",
            "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: npm run check — 470 tests: 457 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron cases reran outside sandbox and passed 2/2",
            "Verification: node syntax check passed",
            "Verification: no ARC_DEBUG or temporary console markers remain"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、失败恢复、自动重新验证与 ready 条件没有改变；实现现在更完整地兑现既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "失败或取消后的重新检查继续使用既有 rechecking 与可重试反馈语义，没有引入新的交互决策。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 仍独占 installer lifecycle；失败后 fresh discovery、不可取消 recheck 和稳定错误分类现在与 durable technical contract 一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-010 已修复，但成功后 stale cancellable operation 与 logout postcondition 两项已知偏差仍未关闭，因此尚不能重新确认整个 accepted Setup contract 已完全实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-011"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Installer failure recovery 现有重复单元、跨层、真实 Electron 与完整回归证据，但 FINDING-009 和 FINDING-011 对应风险仍开放。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 84 passed, 0 failed",
              "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-011"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 21 passed, 0 failed",
        "Verification: focused cross-layer suites — 84 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Verification: complete test inventory accounted for — 457 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-164751053Z-cda7f3ee",
      "occurred_at": "2026-08-25T18:18:03.575Z"
    },
    {
      "round": 16,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 logout 只有在 fresh `codex login status` 明确证明会话已退出时成功；仍认证或无法复核时保留可重试失败。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case-scoped fresh snapshot 比较全部 persisted candidates。四个 Project Gap 均需另建 Case；两个当前 Case Gap 同为 blocking/high-risk，FINDING-011 会把未真正退出误报为成功并直接歪曲认证事实与恢复结果，因此优先于仅影响短暂取消控件窗口的 FINDING-009。",
        "snapshot_token": "a6eeef3c0b5ad55ea9547e87dea6669768d419c4bd08e6ebf4f314b6025340f7",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-011",
        "comparison_summary": "选择 FINDING-011；延后同为 ready 的 FINDING-009；四个 Project Gap 因 case_required 而不属于当前 Case transition。",
        "fresh_discovery_summary": "检查实现、测试与 durable contract 后未发现需要在本轮加入的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在当前 CASE-20260825-010 的单 Gap transition 中处理。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且范围超出当前 Codex Setup finding。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "虽具高风险与紧迫性，但需要独立 Case，不能替代当前开放 review finding。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-009",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "成功操作后的短暂取消控件可能无效。"
            },
            "reason": "同为 ready 且需修复，但影响集中在成功后 fresh-inspection 的短暂交互窗口；本轮优先处理会误报认证事实的 logout postcondition。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-011",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "未真正退出会被误报为成功和 authenticated/ready。"
            },
            "reason": "直接违反 logout 必须由 fresh login-status 非零结果复核的 durable contract，并会错误陈述用户认证状态。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-011",
        "responsibility": "agent",
        "goal": "Resolve review finding: logout 只要求 `codex logout` 子进程退出码为 0，随后通用 inspect 若发现 `codex login status` 仍为 0，就返回 ready/authenticated 且 error=null。技术契约明确要求 logout 必须以非零 status 复核，异常结果应保留可重试错误；当前实现会把未真正退出误报为成功。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:10"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:91",
          "runtime/arcorbit/src/codex-setup-manager.mjs:101",
          "runtime/arcorbit/src/codex-setup-manager.mjs:268",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:169",
          "arckit/spec/arcorbit-distribution.md:152",
          "arckit/tech/arcorbit/installer-supply-chain.md:357",
          "Direct probe: logout exit 0 followed by login status exit 0 returned status=ready, authentication=authenticated, error=null"
        ]
      },
      "planned_transition": {
        "goal": "让 logout 只有在 fresh `codex login status` 明确证明会话已退出时成功；仍认证或无法复核时保留可重试失败。",
        "expected_state_change": "FINDING-011 resolved；logout 不再可能在 postcondition 未满足时返回 ready/authenticated 且 error=null。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-011",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "CodexSetupManager 的 logout 现在执行专用 postcondition：fresh inspection 只有得到 selection-required/logged-out 才成功；仍 authenticated 返回 logout-failed/LOGOUT_POSTCONDITION_FAILED，status probe 异常返回 logout-failed 与原稳定 status error。负向测试同时验证错误可重试且敏感诊断不进入 snapshot。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 22 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 85 passed, 0 failed",
            "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: full ArcOrbit inventory — 471 tests: 458 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron files reran outside sandbox and passed 2/2",
            "Verification: node syntax check passed and no ARC_DEBUG or temporary console markers were found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、显式认证、logout 和自动复核的产品含义没有改变；修复使实际 logout 结果符合既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "logout 异常结果现在保持可重试错误，而不再误导用户已成功退出；既有反馈与恢复语义仍可从 durable interaction artifact 恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占认证进程与状态复核；专用 logout postcondition、稳定错误分类和 fresh status probe 现在与 durable technical contract 一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-011 已修复，但成功操作后的 stale cancellable operation 偏差仍开放，因此尚不能确认整个 accepted Codex Setup contract 已完全实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-009"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "logout postcondition 已有重复单元、跨层、真实 Electron 与完整回归证据，但 FINDING-009 对应的成功后 operation 生命周期风险仍未关闭。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused cross-layer suites — 85 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete test inventory accounted for — 458 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-009"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: focused cross-layer suites — 85 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Verification: complete test inventory accounted for — 458 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox",
        "Verification: node syntax check passed and no temporary debug markers were found"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-182121444Z-d2be50b0",
      "occurred_at": "2026-08-25T18:24:53.187Z"
    },
    {
      "round": 17,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在 install、update、migrate、login 和 logout 成功后开始 fresh inspection 前，立即清除取消身份并发布不可取消的 rechecking 状态，同时以生产 manager 和真实 Electron 证明旧 operation 不能再触发取消。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit fresh snapshot 比较全部 persisted candidates。四个 Project Gap 均需独立 Case；FINDING-009 是当前 Case 唯一 ready Gap，直接威胁成功操作后的取消交互与 operation 生命周期一致性，因此选择推进。",
        "snapshot_token": "45e084908795bee1bebecd23678ae457e7d88e3fdcc1669542351269a55a8e37",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-009",
        "comparison_summary": "选择唯一 ready Case Gap FINDING-009；四个 Project Gap 因 case_required 而排除。",
        "fresh_discovery_summary": "代码、测试和真实 Electron 路径检查未发现需要在本轮新增的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在当前 Codex Setup transition 中处理。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，范围超出当前成功后 operation 生命周期缺口。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实 permission-bearing project 与独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能替代当前唯一 ready review-finding Gap。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-009",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "成功操作后的 fresh-inspection 窗口会显示必然失败的取消动作。"
            },
            "reason": "这是当前 Case 唯一 ready Gap；共享 mutation 成功路径可完整解释 stale cancellable operation 与 OPERATION_NOT_ACTIVE 的时序。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
        "responsibility": "agent",
        "goal": "Resolve review finding: 成功的 install、update、migrate、login 或 logout task 结束后，manager 先清除 currentController/currentOperationId，再开始 fresh inspection，但旧 snapshot 仍保留 cancellable=true 和 operation id。Renderer 因此继续显示并启用取消按钮，而点击必然得到 OPERATION_NOT_ACTIVE；FINDING-008 所描述的成功后 fresh-inspection 窗口仍未解决。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:10"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs:141",
          "runtime/arcorbit/src/codex-setup-manager.mjs:143",
          "runtime/arcorbit/src/codex-setup-manager.mjs:280",
          "runtime/arcorbit/desktop/renderer/renderer.js:721",
          "Direct probe: while the post-install probe was blocked, snapshot.operation retained id and cancellable=true, while cancel returned OPERATION_NOT_ACTIVE",
          "Verification: existing Electron matrix injects a synthetic cancellable=false rechecking snapshot but does not hold the production manager inside successful post-task inspection"
        ]
      },
      "planned_transition": {
        "goal": "在 install、update、migrate、login 和 logout 成功后开始 fresh inspection 前，立即清除取消身份并发布不可取消的 rechecking 状态，同时以生产 manager 和真实 Electron 证明旧 operation 不能再触发取消。",
        "expected_state_change": "FINDING-009 resolved；成功后的 fresh-inspection 窗口不再保留 stale operation id 或 cancellable=true，Renderer 不再提供无效取消动作。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "共享 mutation 成功路径现在在清除 currentController/currentOperationId 后、调用 fresh inspect 前立即发布 `checking` 与 `{kind, phase:'rechecking', cancellable:false}`；失败复核复用同一状态发布边界。阻塞 post-install probe 的单元测试和真实 Electron production main/preload/manager 矩阵均证明该窗口没有 operation id、不可取消，旧 operation id 被 OPERATION_NOT_ACTIVE 拒绝，最终成功状态仍正常完成。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/interaction/setup-readiness/interaction.md",
            "Verification: Codex Setup Manager — 23 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 86 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: full ArcOrbit inventory — 472 tests: 459 passed, 11 environment-gated skips, 2 GUI-sandbox SIGABRT; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax checks passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、认证、logout、自动复核与 ready 条件没有改变；修复使成功后的状态投影更完整地兑现既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "成功任务进入 fresh inspection 后现在明确投影不可取消的 rechecking 状态，与 durable interaction artifact 的取消绑定和自动复核语义一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占 operation lifecycle；controller、operation id、可取消状态与 fresh inspection 的转换现在形成单一、明确且可测试的技术边界。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最后一项已知 Codex Setup 实现偏差已修复；生产 manager、Renderer 门禁和真实 Electron IPC 投影现在共同实现 accepted Setup contract 的 operation 生命周期要求。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "阻塞 fresh probe 的重复单元测试、生产 main/preload/manager Electron 矩阵、跨层套件和完整回归清单共同证明成功后取消身份及时失效，且既有 Setup、Chat、Automation 与 Desktop 行为未回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 86 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete test inventory accounted for — 459 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 23 passed, 0 failed",
        "Verification: focused cross-layer suites — 86 passed, 0 failed",
        "Verification: real Setup Electron matrix — 1 passed, 0 failed",
        "Verification: complete test inventory accounted for — 459 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox",
        "Verification: syntax and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-182121444Z-d2be50b0",
      "occurred_at": "2026-08-25T18:29:23.274Z"
    },
    {
      "round": 18,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 13 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion Review 是当前唯一 ready 且直接阻塞 CASE-20260825-010 closeout 的候选；其余四个 Project Gap 均需独立 Case。",
        "snapshot_token": "8e1dd82bc69045cb3f7f972755988ee9919d48eb57658f333444e44de4caeb57",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:5",
        "comparison_summary": "已比较全部五个 persisted candidates。选择当前 Case 的 Completion Review；四个高风险 Project Gap 均为 case_required，不能在本轮替代或并入审查。",
        "fresh_discovery_summary": "独立静态审查与两个直接负向探针发现登录和安装成功路径各缺少一个强制后置条件；本轮仅提交 review findings，等待 Ledger 派生普通修复 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不阻塞当前 Case 的 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Runtime resilience Case，不能并入当前实现审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要 permission-bearing 独立 Case；当前审查只评估 CASE-010 已实现内容。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "虽具高紧迫性，但需要独立 Case，不能取代当前 closeout review。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:5",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "唯一 ready 候选，负责判断当前实现、验证与回归证据能否支持 Case closeout。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:5",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:13"
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
        "goal": "独立审查 content revision 13 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录两项 Completion Review findings，由 trusted Ledger 在提交后派生普通修复 Gap；Case 保持 unresolved。"
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
              "id": "FINDING-20260825-010-012",
              "kind": "error",
              "statement": "login 子进程退出码为 0 后，通用成功路径虽 fresh-run `codex login status`，却没有要求复核结果必须 authenticated。若 status 非零，manager 返回 `selection-required`、`logged-out` 且 `error=null`，把未完成认证投影成普通未选择状态，而不是接受契约要求的可重试 `login-failed`。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:125",
                "runtime/arcorbit/src/codex-setup-manager.mjs:153",
                "runtime/arcorbit/src/codex-setup-manager.mjs:154",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
                "arckit/spec/arcorbit-distribution.md:152",
                "arckit/spec/arcorbit-distribution.md:154",
                "arckit/tech/arcorbit/installer-supply-chain.md:357",
                "Direct probe: login --with-api-key exit 0 followed by login status exit 1 returned status=selection-required, authentication=logged-out, error=null"
              ]
            },
            {
              "id": "FINDING-20260825-010-013",
              "kind": "error",
              "statement": "official installer 返回成功后，install 的通用成功路径没有要求 fresh discovery/version probe 必须证明 Codex 可用。若 installer 退出 0 但 discovery 仍为 missing，manager 返回 `missing` 且 `error=null`，没有投影稳定的 install-failed 分类、失败位置或重试反馈，仍把 process exit 当成了足够的成功依据。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:125",
                "runtime/arcorbit/src/codex-setup-manager.mjs:153",
                "runtime/arcorbit/src/codex-setup-manager.mjs:154",
                "runtime/arcorbit/src/codex-setup-manager.mjs:205",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:287",
                "arckit/spec/arcorbit-distribution.md:154",
                "arckit/tech/arcorbit/installer-supply-chain.md:336",
                "arckit/tech/arcorbit/installer-supply-chain.md:338",
                "Direct probe: installerRunner completed successfully while fresh probe remained unavailable; manager returned status=missing, installation.available=false, error=null"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 23 passed, 0 failed",
            "Verification: git diff --check passed",
            "Direct probe: successful login process plus nonzero status reproduced selection-required/logged-out/error=null",
            "Direct probe: successful installer plus missing discovery reproduced missing/error=null"
          ],
          "reviewed_content_revision": 13
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品目标或验收含义；安装、登录、自动复核、稳定失败分类和 ready 条件仍由 durable product specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 仍明确要求安装和登录结果自动重新验证，并为失败提供明确反馈与重试；本轮 findings 是实际实现偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 清楚规定 installer process exit 不能替代 discovery/version post-probe，且 login 只有 fresh status 为零才可报告成功，足以直接定位两项实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 不新增或修改 accepted fact/impact；实现偏差已作为 review findings 提交，需等待 Ledger 派生开放修复 Gap 后基于 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的两个成功后置条件缺口已作为 review findings 提交，后续修复 Gap 需要加入可重复负向测试。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 23 passed, 0 failed",
        "Verification: git diff --check passed",
        "Direct probes reproduced both unenforced success postconditions despite the green manager suite"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:35:57.780Z"
    },
    {
      "round": 19,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "为 login mutation 增加 authoritative success postcondition，并以 process exit 0、fresh status 非零的负向回归证明未认证结果会稳定投影为可重试 login-failed。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "两个 ready Case Gap 均为 blocking/high risk。选择 FINDING-012，因为它影响浏览器、设备码、API Key 与 Access Token 的全部登录成功路径，并直接决定 authentication 与 Runtime ready 事实；FINDING-013 影响范围集中在 installer 成功后的异常 discovery。",
        "snapshot_token": "b3cc429d28b9b3673cf52d7c37c8830cea47d06cb96db41f011cd2c03fd97837",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-012",
        "comparison_summary": "选择 FINDING-012；同为 ready 的 FINDING-013 延后。四个 Project Gap 均需独立 Case，不能在当前 Case transition 中推进。",
        "fresh_discovery_summary": "生产代码、专用负向回归和跨层验证未发现需要取代 persisted candidates 的 fresh Gap；installer 成功后置条件仍由 persisted FINDING-013 完整承载。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不能并入当前 Codex Setup 修复。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Runtime resilience Case，范围超出当前登录后置条件。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要 permission-bearing 独立 Case，不能替代当前 ready finding。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "虽具高风险和紧迫性，但需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-012",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "所有可见登录方式都可能把未建立认证投影成无错误 logged-out。"
            },
            "reason": "影响全部登录方式和 authoritative authentication/ready 事实，且可通过共享 login mutation 的专用后置条件最小修复。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-013",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "installer 成功但 discovery 仍缺失时缺少明确失败与重试反馈。"
            },
            "reason": "同为高风险 ready Gap，但影响集中在安装成功后的异常复核；按单 Gap 约束等待下一轮。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-012",
        "responsibility": "agent",
        "goal": "Resolve review finding: login 子进程退出码为 0 后，通用成功路径虽 fresh-run `codex login status`，却没有要求复核结果必须 authenticated。若 status 非零，manager 返回 `selection-required`、`logged-out` 且 `error=null`，把未完成认证投影成普通未选择状态，而不是接受契约要求的可重试 `login-failed`。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:13"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:125",
          "runtime/arcorbit/src/codex-setup-manager.mjs:153",
          "runtime/arcorbit/src/codex-setup-manager.mjs:154",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
          "arckit/spec/arcorbit-distribution.md:152",
          "arckit/spec/arcorbit-distribution.md:154",
          "arckit/tech/arcorbit/installer-supply-chain.md:357",
          "Direct probe: login --with-api-key exit 0 followed by login status exit 1 returned status=selection-required, authentication=logged-out, error=null"
        ]
      },
      "planned_transition": {
        "goal": "为 login mutation 增加 authoritative success postcondition，并以 process exit 0、fresh status 非零的负向回归证明未认证结果会稳定投影为可重试 login-failed。",
        "expected_state_change": "FINDING-012 resolved；任何登录方式只有 fresh status 明确证明 ready/authenticated 才能成功，否则返回 LOGIN_POSTCONDITION_FAILED 且不泄漏 secret。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-012",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "login mutation 现在复用既有 validatePostcondition 边界，要求 fresh inspection 同时得到 status=ready 与 authentication.authenticated=true；否则触发 LOGIN_POSTCONDITION_FAILED，并由既有 failure recheck 收敛为无敏感信息的 login-failed。新增负向测试证明登录子进程退出 0、status 持续非零时不会再返回无错误 logged-out，且一次性 secret 不进入 snapshot。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 24 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager and Desktop Renderer — 87 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: full ArcOrbit inventory — 473 tests: 460 passed, 11 environment-gated skips, 2 GUI-sandbox aborts; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax and git diff checks passed; no temporary debug markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "显式登录、fresh status 复核、失败重试和 ready 条件没有改变；生产实现现在更准确地兑现既有产品契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "登录流程未被 status 确认时现在投影明确、可重试的 login-failed，而不再与普通未选择状态混淆，符合既有交互恢复语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占登录进程和 status 复核；login 专用后置条件沿用既有 mutation validator/failure-recheck 边界，没有扩大 Renderer 或 secret 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-012 已修复，但 installer process 成功而 fresh discovery 仍缺失时尚未强制 install-failed，因此 accepted Codex Setup contract 仍有一项已知实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-013"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "登录成功后置条件已有重复负向单元、跨层、真实 Electron 与完整回归证据，但 FINDING-013 对应的 installer 假成功风险仍开放。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: focused cross-layer suites — 87 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete test inventory accounted for — 460 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-013"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 24 passed, 0 failed",
        "Verification: focused cross-layer suites — 87 passed, 0 failed",
        "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete test inventory accounted for — 460 passed, 11 gated skips, 2 sandbox-only aborts rerun successfully outside sandbox",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:40:35.241Z"
    },
    {
      "round": 20,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "要求 install 的 fresh post-probe 明确证明 Codex CLI 可用，否则返回稳定、可重试的 install-failed，并加入负向回归。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 canonical snapshot 比较全部 persisted candidates；FINDING-013 是当前 Case 唯一 ready 且直接阻塞收束的 Gap，四个 Project Gap 均需另建 Case。",
        "snapshot_token": "1c6161096e2208eb83796a93bb3768145bb5682b4ad0d5bfab8c2e90d9c70300",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-013",
        "comparison_summary": "FINDING-013 是唯一 ready candidate，具有 high blocking/high risk，并且是 CASE-20260825-010 的最后一个开放 Gap；所有 Project Gap 的 eligibility 均为 case_required。",
        "fresh_discovery_summary": "实现、契约和验证检查未发现应抢占所选 persisted Gap 的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在当前 Case 的单 Gap transition 中处理。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，且不应抢占当前 Case 唯一开放的阻塞 finding。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要具备真实权限资源的独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能并入当前 Codex Setup 修复 transition。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-013",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前 Case 唯一 ready 且最后开放的 Gap；installer 假成功直接违反 accepted Setup contract。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-013",
        "responsibility": "agent",
        "goal": "Resolve review finding: official installer 返回成功后，install 的通用成功路径没有要求 fresh discovery/version probe 必须证明 Codex 可用。若 installer 退出 0 但 discovery 仍为 missing，manager 返回 `missing` 且 `error=null`，没有投影稳定的 install-failed 分类、失败位置或重试反馈，仍把 process exit 当成了足够的成功依据。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:13"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:125",
          "runtime/arcorbit/src/codex-setup-manager.mjs:153",
          "runtime/arcorbit/src/codex-setup-manager.mjs:154",
          "runtime/arcorbit/src/codex-setup-manager.mjs:205",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:287",
          "arckit/spec/arcorbit-distribution.md:154",
          "arckit/tech/arcorbit/installer-supply-chain.md:336",
          "arckit/tech/arcorbit/installer-supply-chain.md:338",
          "Direct probe: installerRunner completed successfully while fresh probe remained unavailable; manager returned status=missing, installation.available=false, error=null"
        ]
      },
      "planned_transition": {
        "goal": "要求 install 的 fresh post-probe 明确证明 Codex CLI 可用，否则返回稳定、可重试的 install-failed，并加入负向回归。",
        "expected_state_change": "FINDING-013 被解决；installer process exit 不再能够替代 executable discovery/version 成功证据。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-013",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "install mutation 现在通过既有 validatePostcondition 边界要求 fresh inspection 的 installation.available=true。若 installer 成功但 discovery 仍 missing，则抛出 INSTALL_POSTCONDITION_FAILED，并由既有 failure recheck 收敛为 install-failed，同时保留最新安装投影和可重试错误。新增负向测试重复证明该行为。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 25 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 88 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: full ArcOrbit inventory — 474 tests: 461 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、自动复核、稳定失败分类、重试和 ready 条件没有改变；实现现在准确兑现 durable product contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "installer 未被 fresh discovery 确认可用时，现在投影明确且可重试的 install-failed，而不再显示无错误的 missing 状态。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占 installer 生命周期；install 专用后置条件复用既有 validator、fresh inspection 和 failure-recheck 边界，没有扩大 Renderer 或进程权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最后一项已知 Codex Setup 实现偏差已修复；installer process success 现在必须由 fresh executable discovery/version 成功证据确认。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "专用负向单元测试、跨层套件、真实 Setup Electron 矩阵和完整回归清单共同证明 installer 假成功风险已受控，且相关桌面行为未回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 25 passed, 0 failed",
              "Verification: focused cross-layer suites — 88 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete test inventory accounted for — 461 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 25 passed, 0 failed",
        "Verification: focused cross-layer suites — 88 passed, 0 failed",
        "Verification: real Setup Electron production matrix — 1 passed, 0 failed",
        "Verification: complete inventory accounted for — 474 tests with 461 passed, 11 gated skips and 2 GUI-sandbox failures rerun successfully outside sandbox",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:45:53.444Z"
    },
    {
      "round": 21,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 15 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit canonical snapshot 比较全部 persisted candidates；Completion Review 6 是当前 Case 唯一 ready candidate，四个 Project Gap 均需独立 Case。",
        "snapshot_token": "d3ecd70927e7db4ce0b5074beeddc6fa55a89dd3cc78c95399d580f09f0062eb",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:6",
        "comparison_summary": "所有普通 Case Gap 已关闭；Completion Review 6 以 high blocking/high risk 成为唯一 ready candidate。四个 Project Gap 的 eligibility 均为 case_required，不能并入本轮审查。",
        "fresh_discovery_summary": "选择前没有 fresh candidate 取代 persisted Completion Review；审查过程中发现的实现偏差作为 review findings 提交，不在同轮修复。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能在当前 Completion Review 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能取代当前 Case 的完成审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实权限资源和独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case，不能并入当前 Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:6",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 已闭合，必须独立审查实现正确性、问题解决、验证可信度、回归风险与最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:6",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:15"
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
        "goal": "独立审查 content revision 15 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 Completion Review findings；本轮不修改实现、Case facts、impacts、普通 gaps 或 Project State。"
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
              "id": "FINDING-20260825-010-014",
              "kind": "error",
              "statement": "standalone update 的通用成功路径没有要求 fresh discovery/version probe 继续证明 Codex 可用且仍为 standalone。若 installer 退出 0 后 discovery 变为 missing，manager 返回 `missing`、installation.available=false、error=null，而不是稳定、可重试的 `update-failed`；process exit 仍可替代 update 的成功后置条件。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/src/codex-setup-manager.mjs:229",
                "runtime/arcorbit/src/codex-setup-manager.mjs:241",
                "arckit/tech/arcorbit/installer-supply-chain.md:336"
              ],
              "evidence": [
                "Direct probe: proven standalone update installer returned success, subsequent probe returned missing; manager returned status=missing, installation.available=false, error=null",
                "runtime/arcorbit/src/codex-setup-manager.mjs:229",
                "runtime/arcorbit/src/codex-setup-manager.mjs:241",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
                "arckit/spec/arcorbit-distribution.md:123",
                "arckit/spec/arcorbit-distribution.md:125",
                "arckit/tech/arcorbit/installer-supply-chain.md:336"
              ]
            },
            {
              "id": "FINDING-20260825-010-015",
              "kind": "omission",
              "statement": "install mutation 未启用活动 Codex owner 门禁。即使 activeOwners 返回正在运行的 Automation execution，manager 仍执行 official installer，owner provider 未被调用；这违反 durable technical contract 对 install、update、migration 统一进程所有权检查的要求，并可能在活动 Codex 进程期间改变 executable。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/src/codex-setup-manager.mjs:205",
                "runtime/arcorbit/src/codex-setup-manager.mjs:226",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
                "arckit/tech/arcorbit/installer-supply-chain.md:338"
              ],
              "evidence": [
                "Direct probe: activeOwners returned one Automation owner, yet install invoked installerRunner once, never called activeOwners, and returned ready",
                "runtime/arcorbit/src/codex-setup-manager.mjs:205",
                "runtime/arcorbit/src/codex-setup-manager.mjs:226",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
                "arckit/tech/arcorbit/installer-supply-chain.md:338"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: existing Codex Setup Manager suite — 25 passed, 0 failed",
            "Direct probe reproduced update success followed by missing discovery returning status=missing and error=null",
            "Direct probe reproduced install proceeding with an active Automation owner while activeOwners was never called"
          ],
          "reviewed_content_revision": 15
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品目标或验收含义；安装、更新、自动复核、失败重试与活动 owner 保护仍由 durable product specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 仍定义安装与更新后的自动复核、明确失败反馈和重试；本轮 findings 是实际实现偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical contract 明确要求 installer success 由 fresh discovery/version 证明，并要求 install、update、migration 统一执行 active-owner guard，足以直接定位两项实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不新增或修改 accepted fact/impact；实现偏差作为 review findings 提交，需由 Ledger 派生普通修复 Gap 后基于 fresh snapshot 重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的 update postcondition 与 install owner guard 偏差已作为 review findings 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: existing manager suite passed 25 tests while two direct negative probes reproduced uncovered contract deviations"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:48:29.017Z"
    },
    {
      "round": 22,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 install mutation 在启动 official installer 前检查全部活动 Codex owner，并在存在 Automation 或 Chat owner 时 fail closed。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token 89b16b117b10b2c78959007d74b2f3c4a58d42e3034032a70c4889722cf89172 比较全部持久候选。两个 Case Gap 均为 high blocking/high risk；FINDING-015 涉及活动进程期间替换 executable 的即时并发与所有权风险，优先于 FINDING-014 的更新结果状态偏差。",
        "snapshot_token": "89b16b117b10b2c78959007d74b2f3c4a58d42e3034032a70c4889722cf89172",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-015",
        "comparison_summary": "选择 FINDING-015；FINDING-014 保持 ready 并等待提交后的 fresh snapshot。四个 Project Gap 均需独立 Case，不具备当前 Case 内执行资格。",
        "fresh_discovery_summary": "工作区检查未发现比持久化 FINDING-015 更高优先级、且可在当前 Case 内执行的新 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap 修复",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需要独立场景验证 Case"
            },
            "reason": "Project Gap 需要新建独立 Case，不能替代当前 Case 的 ready review finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap 修复",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需要独立 Runtime resilience Case"
            },
            "reason": "Project Gap 需要独立 Case，当前 transition 不扩展到 Runtime resilience 工作。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap 修复",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需要真实权限项目与独立 Case"
            },
            "reason": "需要真实 permission-bearing project 和独立 Case，不属于当前实现修复。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap 修复",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需要独立审计 Case"
            },
            "reason": "虽具高紧迫性，但必须通过独立 Case 推进，不能在当前 Case 内选择。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-014",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "更新失败可能被误报为无错误 missing"
            },
            "reason": "仍需修复，但其结果状态风险低于活动 Codex owner 存在时执行 installer 的即时进程所有权风险；依照单 Gap 契约等待 fresh post-commit read。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-015",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "活动执行期间可能改变正在使用的 executable"
            },
            "reason": "当前实现明确缺少 install owner guard；可复用既有 mutation 边界完成最小修复，并能以直接负向测试证明 fail closed。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-015",
        "responsibility": "agent",
        "goal": "Resolve review finding: install mutation 未启用活动 Codex owner 门禁。即使 activeOwners 返回正在运行的 Automation execution，manager 仍执行 official installer，owner provider 未被调用；这违反 durable technical contract 对 install、update、migration 统一进程所有权检查的要求，并可能在活动 Codex 进程期间改变 executable。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:15"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:205",
          "runtime/arcorbit/src/codex-setup-manager.mjs:226",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
          "arckit/tech/arcorbit/installer-supply-chain.md:338",
          "Direct probe: activeOwners returned one Automation owner, yet install invoked installerRunner once, never called activeOwners, and returned ready"
        ]
      },
      "planned_transition": {
        "goal": "让 install mutation 在启动 official installer 前检查全部活动 Codex owner，并在存在 Automation 或 Chat owner 时 fail closed。",
        "expected_state_change": "FINDING-015 被解决；install、update、migration 统一执行 active-owner guard，且回归测试证明被阻止时 installer 调用次数为零。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-015",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "install mutation 已启用共用 `guardOwners` 边界。prepare 完成后、创建 operation/controller 和执行 installer 前，manager 会查询 activeOwners；任何活动 Automation、Chat 或 Codex owner 都产生 CODEX_OWNER_ACTIVE。新增负向测试证明 owner provider 被调用一次且 installer 完全未启动。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 26 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 89 passed, 0 failed",
            "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 475 tests: 462 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、更新、迁移及活动 owner 保护的产品含义没有改变；install 实现现在更准确兑现既有 durable product contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "存在活动 Codex owner 时，install 现在在建立可见 operation 或启动 installer 前返回稳定的 owner-active 错误，符合既有阻断与恢复语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process CodexSetupManager 继续独占 installer 生命周期；install 现在复用 update/migration 已有的串行 active-owner guard，没有扩大 Renderer、IPC 或 process 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-015 已修复，但 standalone update 仍未要求 fresh discovery 证明 Codex 可用且 provenance 为 standalone，因此 accepted Codex Setup contract 尚有一项已知实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-014"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "install owner guard 已有直接负向单元、跨层、真实 Electron 和完整回归证据，但 FINDING-014 对应的 update 假成功风险仍开放。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 26 passed, 0 failed",
              "Verification: focused cross-layer suites — 89 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 462 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-014"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 26 passed, 0 failed",
        "Verification: focused cross-layer suites — 89 passed, 0 failed",
        "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete inventory — 475 tests: 462 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:52:25.629Z"
    },
    {
      "round": 23,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "为 standalone update 增加 authoritative success postcondition，要求 fresh inspection 同时证明 executable 可用且 provenance 为 standalone。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token cbcd1f6bb2cc3d1c4de114076ab67803cfc1329fe3b7311be69f905f93996686 比较全部持久候选。FINDING-014 是当前 Case 内唯一 ready Gap，且直接威胁 accepted realization 与风险证据，因此被选择。",
        "snapshot_token": "cbcd1f6bb2cc3d1c4de114076ab67803cfc1329fe3b7311be69f905f93996686",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-014",
        "comparison_summary": "选择唯一 ready 的 FINDING-014；四个 Project Gap 均需独立 Case，不能在当前 Case transition 内推进。",
        "fresh_discovery_summary": "工作区核对确认 update 缺少专用 validatePostcondition；未发现会改变本轮对象、范围或验收方式的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需独立真实场景 Case"
            },
            "reason": "需要新建独立 Case，不能替代当前 Case 的 ready review finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 Runtime resilience Case"
            },
            "reason": "属于跨 Runtime adapter/resilience 的独立范围，当前 Case 不具备直接执行资格。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需真实 permission-bearing project"
            },
            "reason": "需要独立 Case 和真实受控资源，不能在当前 Case 中选择。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Gap",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 ledger audit Case"
            },
            "reason": "虽具高紧迫性，但必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-014",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "更新假成功会留下错误状态与不可置信的恢复反馈"
            },
            "reason": "唯一 ready Case Gap；现有代码和直接复现已经充分界定最小修复与负向验收。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-014",
        "responsibility": "agent",
        "goal": "Resolve review finding: standalone update 的通用成功路径没有要求 fresh discovery/version probe 继续证明 Codex 可用且仍为 standalone。若 installer 退出 0 后 discovery 变为 missing，manager 返回 `missing`、installation.available=false、error=null，而不是稳定、可重试的 `update-failed`；process exit 仍可替代 update 的成功后置条件。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:15"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:229",
          "runtime/arcorbit/src/codex-setup-manager.mjs:241",
          "arckit/tech/arcorbit/installer-supply-chain.md:336",
          "Direct probe: proven standalone update installer returned success, subsequent probe returned missing; manager returned status=missing, installation.available=false, error=null",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
          "arckit/spec/arcorbit-distribution.md:123",
          "arckit/spec/arcorbit-distribution.md:125"
        ]
      },
      "planned_transition": {
        "goal": "为 standalone update 增加 authoritative success postcondition，要求 fresh inspection 同时证明 executable 可用且 provenance 为 standalone。",
        "expected_state_change": "installer 成功但 post-probe missing 或回退到 external provenance 时，manager 保留 fresh 安装投影并返回 update-failed/UPDATE_POSTCONDITION_FAILED；proven standalone 的既有成功路径保持不变。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-014",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "update mutation 现在复用既有 validatePostcondition/failure-recheck 边界，要求 fresh inspection 的 installation.available=true 且 provenance=standalone。否则产生 UPDATE_POSTCONDITION_FAILED，并在再次 fresh inspection 后稳定投影 update-failed、真实 installation state/provenance 与可重试错误。新增负向测试同时覆盖 post-probe missing 和回退到 configured external。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 27 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 90 passed, 0 failed",
            "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 476 tests: 463 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "standalone 更新、自动复核、稳定失败分类和重试的产品含义没有改变；生产实现现在准确兑现 durable product contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "update 未被 fresh discovery 证明成功时现在投影明确、可重试的 update-failed，并保留最新安装来源与状态，符合既有自动复核和失败恢复语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占 update 生命周期；专用后置条件复用 install/migration 已有的 validator、fresh inspection 和 failure-recheck 边界，没有扩大 Renderer、IPC 或 process 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最后一项已知 Codex Setup 实现偏差已修复；install、update、migration 的 installer process success 均必须由各自 authoritative fresh postcondition 证明。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "update missing/external 假成功已有重复负向单元测试，并由跨层套件、真实 Setup Electron 矩阵和完整回归清单证明相关边界未回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 27 passed, 0 failed",
              "Verification: focused cross-layer suites — 90 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 463 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 27 passed, 0 failed",
        "Verification: focused cross-layer suites — 90 passed, 0 failed",
        "Verification: real Setup Electron matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete inventory — 476 tests: 463 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T18:55:28.884Z"
    },
    {
      "round": 24,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 17 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token 1d9ed8405472bb36bda41350366ce4ec049be59a23baf51e2fbbfeb50b04ae6f 比较全部持久候选。所有普通 Case Gap 已闭合，Completion Review 7 是当前 Case 唯一 ready 候选，并阻塞 Case resolution。",
        "snapshot_token": "1d9ed8405472bb36bda41350366ce4ec049be59a23baf51e2fbbfeb50b04ae6f",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:7",
        "comparison_summary": "选择 Completion Review 7；四个 Project Gap 均需独立 Case，不能替代当前 Case 的 completion gate。",
        "fresh_discovery_summary": "选择前未发现新的 ready ordinary Case Gap；审查执行中发现的问题作为 completion review findings 提交，不在本轮继续修复。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion gate",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需独立真实场景 Case"
            },
            "reason": "需要独立 Case，不能在当前 Completion Review 中推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion gate",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 Runtime resilience Case"
            },
            "reason": "属于独立 Runtime resilience 范围，当前 Case 不具备执行资格。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion gate",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需真实 permission-bearing project"
            },
            "reason": "需要独立 Case 与真实受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion gate",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 ledger audit Case"
            },
            "reason": "虽具高紧迫性，但必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:7",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "决定当前实现能否可信关闭"
            },
            "reason": "所有普通 Case Gap 已闭合；这是唯一 ready Case candidate，也是关闭前必须完成的五维语义自查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:7",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:17"
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
        "goal": "独立审查 content revision 17 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "提交 findings 的 Completion Review 结果，由 Ledger 派生后续普通修复 Gap。"
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
              "id": "FINDING-20260825-010-016",
              "kind": "error",
              "statement": "生产 `runControlledProcess` 在 cancel 或 timeout 时调用 `child.kill()` 后立即 reject，而不是等待 child `close`。上层 mutation 因此会在 installer/login 子进程仍可能运行时开始 fresh discovery/login-status recheck，造成状态竞态。直接探针中，子进程收到 SIGTERM 后延迟 700ms 退出，但 Promise 在 251ms 即返回 ABORT_ERR；现有取消/超时测试使用注入 runner，未覆盖真实进程终止顺序。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:517",
                "runtime/arcorbit/src/codex-setup-manager.mjs:521",
                "runtime/arcorbit/src/codex-setup-manager.mjs:534",
                "arckit/tech/arcorbit/installer-supply-chain.md:338",
                "Direct process probe: SIGTERM handler delayed exit by 700ms while runControlledProcess rejected with ABORT_ERR after 251ms",
                "Verification: Codex Setup Manager — 27 passed, 0 failed despite the reproduced production lifecycle race"
              ]
            },
            {
              "id": "FINDING-20260825-010-017",
              "kind": "omission",
              "statement": "active-owner guard 只抛出 `CODEX_OWNER_ACTIVE` 和 owner 数量，没有返回 durable technical contract 指定的 `CODEX_UPDATE_ACTIVE_TASKS` 或无敏感 owner/execution refs；Renderer 因而无法兑现交互契约要求的具体 Chat/Automation 阻塞 owner 列表。现有测试只断言 installer 未启动和当前实现 code，没有验证恢复投影。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:550",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:355",
                "arckit/interaction/setup-readiness/interaction.md:37",
                "arckit/interaction/setup-readiness/interaction.md:88",
                "arckit/tech/arcorbit/installer-supply-chain.md:338"
              ]
            },
            {
              "id": "FINDING-20260825-010-018",
              "kind": "omission",
              "statement": "API Key 与 Access Token 当前作为不可覆盖的原始字符串写入 `spec.stdin`，`runControlledProcess` 直接 `child.stdin.end(String(stdin))`；没有追加 durable technical contract 要求的 line terminator，也没有在 spawn/write 后覆盖可控 secret buffer。现有测试反而断言 stdin 与原始 secret 完全相等，未证明 framing 与内存生命周期边界。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:387",
                "runtime/arcorbit/src/codex-setup-manager.mjs:504",
                "runtime/arcorbit/src/codex-setup-manager.mjs:537",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:39",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
                "arckit/tech/arcorbit/installer-supply-chain.md:346",
                "arckit/tech/arcorbit/installer-supply-chain.md:353"
              ]
            },
            {
              "id": "FINDING-20260825-010-019",
              "kind": "error",
              "statement": "非-standalone update 前置条件返回 `UPDATE_EXTERNAL_INSTALL`，而 durable technical contract 定义的稳定恢复 code 是 `CODEX_EXTERNAL_INSTALLATION`。当前测试没有覆盖该拒绝路径的 code，导致实现与可恢复错误契约漂移。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:236",
                "arckit/tech/arcorbit/installer-supply-chain.md:327",
                "Verification: source/test search found no CODEX_EXTERNAL_INSTALLATION assertion in production manager tests"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 27 passed, 0 failed",
            "Verification: git diff --check passed",
            "Direct process probe reproduced promise rejection before child close"
          ],
          "reviewed_content_revision": 17
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改产品目标或验收含义；安装、更新、取消/超时后自动复核、失败恢复与凭证安全仍由 durable product specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 明确定义可取消阶段、自动重新验证和具体阻塞 owner 展示；本轮 finding 是生产实现偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 Completion Review 未发现或修改视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical artifact 已明确 child termination 后再 recheck、稳定 owner/external-install codes、owner refs、secret line terminator 与可控 buffer 清理，足以直接定位实现偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不新增或修改 accepted fact/impact；发现的实现偏差作为 review findings 提交，需由 Ledger 派生普通修复 Gap 后在 fresh snapshot 中重新评估 realization。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的真实进程终止、owner 恢复投影、secret lifecycle 和稳定错误码偏差已作为 review findings 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: Codex Setup Manager — 27 passed, 0 failed",
        "Verification: git diff --check passed",
        "Direct process probe: ABORT_ERR returned after 251ms while the child delayed SIGTERM exit by 700ms"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:02:58.886Z"
    },
    {
      "round": 25,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让生产 runControlledProcess 的取消与超时在 bounded termination 后等待 child close，再向上层返回原始 ABORT_ERR 或 PROCESS_TIMEOUT，并以真实子进程回归证明 recheck 不会提前开始。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token bfc80fdd4d558a96fbe43e0a7ed51f1decfc3d019edf67e6b1b73a3c82669cdd 比较全部持久候选。四个 Case repair Gap 均为 high-blocking/high-risk；FINDING-016 已由真实子进程探针直接复现，并影响所有 installer/login cancel 与 timeout 后的 authoritative recheck 时序，因此优先。",
        "snapshot_token": "bfc80fdd4d558a96fbe43e0a7ed51f1decfc3d019edf67e6b1b73a3c82669cdd",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-016",
        "comparison_summary": "选择 FINDING-016；FINDING-017、018、019 均保持 ready 但延后至 post-commit fresh round。四个 Project Gap 均需独立 Case，不能替代当前 Case repair。",
        "fresh_discovery_summary": "执行前未发现新的 fresh candidate；全量验证仅暴露新回归测试在高并发下的过短启动窗口，已在本 Gap 的既定证据边界内稳定化，没有产生新的产品或实现 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case repair",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需独立真实场景 Case"
            },
            "reason": "需要独立 Case，不能在当前修复轮推进。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case repair",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 Runtime resilience Case"
            },
            "reason": "属于独立 Runtime resilience 范围。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case repair",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需真实 permission-bearing project"
            },
            "reason": "需要独立 Case 与真实受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case repair",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 ledger audit Case"
            },
            "reason": "虽具高紧迫性，但必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-016",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "取消或超时后的状态复核可能与仍运行的子进程竞态"
            },
            "reason": "真实子进程探针已直接复现，且公共 process primitive 影响 installer 与 login 的 cancel/timeout 路径。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-017",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "活动 owner 恢复信息不完整"
            },
            "reason": "重要但不改变 FINDING-016 的修复边界；等待下一 fresh round。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-018",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "secret stdin framing 与内存生命周期缺乏保证"
            },
            "reason": "安全风险高，但属于独立 secret lifecycle 主张；等待下一 fresh round。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-019",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "外部安装恢复错误码与契约漂移"
            },
            "reason": "范围较窄且不影响本轮 child lifecycle 修复；等待下一 fresh round。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-016",
        "responsibility": "agent",
        "goal": "Resolve review finding: 生产 `runControlledProcess` 在 cancel 或 timeout 时调用 `child.kill()` 后立即 reject，而不是等待 child `close`。上层 mutation 因此会在 installer/login 子进程仍可能运行时开始 fresh discovery/login-status recheck，造成状态竞态。直接探针中，子进程收到 SIGTERM 后延迟 700ms 退出，但 Promise 在 251ms 即返回 ABORT_ERR；现有取消/超时测试使用注入 runner，未覆盖真实进程终止顺序。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:17"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:517",
          "runtime/arcorbit/src/codex-setup-manager.mjs:521",
          "runtime/arcorbit/src/codex-setup-manager.mjs:534",
          "arckit/tech/arcorbit/installer-supply-chain.md:338",
          "Direct process probe: SIGTERM handler delayed exit by 700ms while runControlledProcess rejected with ABORT_ERR after 251ms",
          "Verification: Codex Setup Manager — 27 passed, 0 failed despite the reproduced production lifecycle race"
        ]
      },
      "planned_transition": {
        "goal": "让生产 runControlledProcess 的取消与超时在 bounded termination 后等待 child close，再向上层返回原始 ABORT_ERR 或 PROCESS_TIMEOUT，并以真实子进程回归证明 recheck 不会提前开始。",
        "expected_state_change": "FINDING-016 被解决；生产 cancel/timeout 生命周期与 durable termination/recheck 契约一致，其他三个 review finding 保持开放。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-016",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "`runControlledProcess` 现在暂存取消或超时错误，先请求子进程终止，必要时在 2 秒后强制 kill，并仅在 child `close` 后以原始 ABORT_ERR 或 PROCESS_TIMEOUT 拒绝。真实 Node 子进程测试分别证明 cancel 与 timeout 在收到 SIGTERM 后仍保持 Promise pending，直到延迟退出产生 close；上层 mutation 因此不会再与仍运行的 installer/login 并发执行 fresh recheck。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: direct real-child cancel and timeout close-order regression passed",
            "Verification: Codex Setup Manager — 28 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 91 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 477 tests: 464 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "取消、超时、自动复核和可恢复失败的产品含义未改变，且继续由 durable distribution specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "可取消阶段、终止后自动复核与失败恢复语义继续由 durable interaction artifact 明确定义；本轮实现更准确兑现该语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改或重新解释视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占受控子进程生命周期；cancel/timeout 现在执行有界终止并等待 close 后才允许 recheck，直接兑现 durable technical contract，未扩大 Renderer、IPC 或 process 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-016 已修复，但 owner blocker projection、secret stdin lifecycle 与 external-install error contract 三项实现偏差仍开放，Codex Setup accepted contract 尚未完全实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "真实 child cancel/timeout 顺序已有直接、跨层、Electron 与完整回归证据，但其余三个 Completion Review 风险仍缺少满足 durable contract 的实现与验证。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 28 passed, 0 failed",
              "Verification: focused cross-layer suites — 91 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 464 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: direct real-child cancellation and timeout settle only after close",
        "Verification: Codex Setup Manager — 28 passed, 0 failed",
        "Verification: focused cross-layer suites — 91 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete inventory — 477 tests: 464 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:08:17.443Z"
    },
    {
      "round": 26,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 API Key 与 Access Token 以附带 line terminator 的可覆盖 Buffer 进入受控 child stdin，并在写入完成后清理，同时以真实进程和回归测试证明 framing、归零与无泄漏边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token d366298a83d745296b6c0141d6ec93cd9fa430a100f7936a58b79959f387df 比较全部 7 个 persisted candidates。三个 ordinary Case Gap 均 ready；FINDING-018 直接影响 API Key/Access Token 的高风险凭证生命周期和 durable security contract，因此优先于 owner 恢复投影与单一错误码漂移。",
        "snapshot_token": "d366298a83d745296b6c0141d6ec93cd9fa430a100f7936a58b79959f387df71",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-018",
        "comparison_summary": "选择 FINDING-018；四个 Project Gap 需要独立 Case，FINDING-017 与 FINDING-019 保持 ready 并延后。",
        "fresh_discovery_summary": "本轮实际代码与验证检查未发现需要改变 selected Gap 对象、范围或验收方式的新 candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需独立真实场景验证"
            },
            "reason": "需要独立 Case，不能替代当前 Case 的实现修复。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 Runtime resilience Case"
            },
            "reason": "属于独立 Runtime resilience 范围。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需真实 permission-bearing project"
            },
            "reason": "需要独立 Case 与真实受控资源，不能替代当前已定位的凭证实现修复。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需独立 ledger audit Case"
            },
            "reason": "必须通过独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-017",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "活动 owner 的具体恢复信息尚不完整"
            },
            "reason": "同样阻塞 Case，但主要影响 owner 阻塞恢复投影；相较之下 selected Gap 直接处理敏感凭证内存与 framing 边界。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-018",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "API Key/Access Token 的安全登录边界"
            },
            "reason": "代码与 durable contract 已直接界定修复范围；凭证 framing 和可控内存清理具有最高即时安全风险，并可用真实 child 稳定验证。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-019",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "外部安装拒绝的稳定恢复分类"
            },
            "reason": "错误码契约漂移仍需修复，但影响面小于当前凭证生命周期风险。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
        "responsibility": "agent",
        "goal": "Resolve review finding: API Key 与 Access Token 当前作为不可覆盖的原始字符串写入 `spec.stdin`，`runControlledProcess` 直接 `child.stdin.end(String(stdin))`；没有追加 durable technical contract 要求的 line terminator，也没有在 spawn/write 后覆盖可控 secret buffer。现有测试反而断言 stdin 与原始 secret 完全相等，未证明 framing 与内存生命周期边界。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:17"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:387",
          "runtime/arcorbit/src/codex-setup-manager.mjs:504",
          "runtime/arcorbit/src/codex-setup-manager.mjs:537",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:39",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:141",
          "arckit/tech/arcorbit/installer-supply-chain.md:346",
          "arckit/tech/arcorbit/installer-supply-chain.md:353"
        ]
      },
      "planned_transition": {
        "goal": "让 API Key 与 Access Token 以附带 line terminator 的可覆盖 Buffer 进入受控 child stdin，并在写入完成后清理，同时以真实进程和回归测试证明 framing、归零与无泄漏边界。",
        "expected_state_change": "FINDING-018 被解决；生产登录过程兑现 durable secret stdin lifecycle，FINDING-017 与 FINDING-019 保持开放。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "`buildCodexLoginSpec` 现在只为 API Key/Access Token 创建 `secret + \\n` 的 Buffer；`runControlledProcess` 在 child stdin 写入完成回调中归零该 Buffer，并在 process finish 与注入 runner 退出时执行兜底清理。真实 Node child 回归证明收到恰好一条以换行结束的凭证输入，且 child 尚未 close 时源 Buffer 已全部归零；manager 注入测试还证明 runner 完成后的 Buffer 不再保留 secret。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: real child received exactly one newline-terminated stdin record and the source Buffer was zeroed before child close",
            "Verification: Codex Setup Manager — 29 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 92 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 478 tests: 465 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax and git diff checks passed; no ARC_DEBUG or temporary console markers found"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "显式认证、stdin-only secret transport、自动状态复核和失败恢复的产品含义没有改变，并继续由 durable distribution specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户仍通过无默认值的显式方式输入一次性凭证，Renderer 立即清空输入，登录完成后自动复核；本轮只收紧 main-process 内部 framing 与内存生命周期。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未建立、修改或重新解释任何视觉主题、token、组件样式、布局或 durable presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占固定登录命令与 stdin 生命周期；带行终止符的可覆盖 Buffer、写入完成清理和 runner 兜底清理直接兑现 durable technical contract，未扩大 Renderer、IPC、argv 或 environment 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-018 已修复，但 owner blocker projection 与 external-install error contract 两项实现偏差仍开放，Codex Setup accepted contract 尚未完全实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "secret framing、真实 child 写入后归零、注入 runner 兜底清理、跨层和 Electron 路径已有重复证据，但剩余两项 Completion Review 风险仍缺少满足 durable contract 的实现与验证。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 29 passed, 0 failed",
              "Verification: focused cross-layer suites — 92 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 465 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: real child received one newline-terminated stdin record and the source Buffer was zeroed before child close",
        "Verification: Codex Setup Manager — 29 passed, 0 failed",
        "Verification: focused cross-layer suites — 92 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete inventory — 478 tests: 465 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:14:12.043Z"
    },
    {
      "round": 27,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 install、update 和 migration 的 active-owner guard 返回 `CODEX_UPDATE_ACTIVE_TASKS`，通过 authoritative snapshot 携带无敏感 owner refs，并让 Renderer 禁用相关动作、显示具体阻塞项。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token e88eed0138ae8381e54bfba36e67e443653bc0b11cd83fb2eae0205f3b958c98 比较全部 persisted candidates；当前 Case 的两个 ready finding 均为高阻塞、高风险，但 FINDING-017 同时影响稳定恢复码、无敏感 owner 投影和用户可见恢复路径，因此优先于单点错误码偏差 FINDING-019。",
        "snapshot_token": "e88eed0138ae8381e54bfba36e67e443653bc0b11cd83fb2eae0205f3b958c98",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-017",
        "comparison_summary": "选择 FINDING-017；FINDING-019 保持 ready 并延后。四个 Project Gap 均需要独立 Case，不能在当前 Case transition 中处理。",
        "fresh_discovery_summary": "工作区检查未发现优先级高于 persisted ready findings 的 fresh Gap；本轮只处理所选 persisted Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide"
            },
            "reason": "属于跨场景 Project 验证，不能并入当前 Codex Setup Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "runtime-wide"
            },
            "reason": "属于 Runtime resilience 与 adapter 验收，不是当前 Case 的局部修复。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "security-wide"
            },
            "reason": "需要真实 permission-bearing project，当前 Case 不具备该独立验收边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "project-wide"
            },
            "reason": "属于 Project/Iteration/Case 跨记录审计，不能并入当前实现 transition。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-017",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接阻断 durable owner recovery contract，且同时影响 manager、IPC snapshot 与用户可见恢复列表。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-019",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "稳定 external-install code 偏差仍需修复，但影响面小于 owner guard 的跨层恢复缺口。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
        "responsibility": "agent",
        "goal": "Resolve review finding: active-owner guard 只抛出 `CODEX_OWNER_ACTIVE` 和 owner 数量，没有返回 durable technical contract 指定的 `CODEX_UPDATE_ACTIVE_TASKS` 或无敏感 owner/execution refs；Renderer 因而无法兑现交互契约要求的具体 Chat/Automation 阻塞 owner 列表。现有测试只断言 installer 未启动和当前实现 code，没有验证恢复投影。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:17"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:550",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:302",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:355",
          "arckit/interaction/setup-readiness/interaction.md:37",
          "arckit/interaction/setup-readiness/interaction.md:88",
          "arckit/tech/arcorbit/installer-supply-chain.md:338"
        ]
      },
      "planned_transition": {
        "goal": "让 install、update 和 migration 的 active-owner guard 返回 `CODEX_UPDATE_ACTIVE_TASKS`，通过 authoritative snapshot 携带无敏感 owner refs，并让 Renderer 禁用相关动作、显示具体阻塞项。",
        "expected_state_change": "FINDING-017 resolved；Codex Setup owner guard、snapshot 和 Renderer 恢复投影符合 durable technical/interaction contract，Case 仅剩 FINDING-019。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "manager 现在对活动 owner 返回 `CODEX_UPDATE_ACTIVE_TASKS`，将净化、去重、限长后的 `{kind,id}` 写入 authoritative error snapshot；Renderer 显示 Automation/Chat/Codex 阻塞引用并禁用 install/update/migrate。直接测试证明错误和 snapshot 一致、敏感或异常字段不投影、installer 不启动；生产 preload/IPC 与真实 Electron Renderer 回归证明跨层恢复投影可见且 fail closed。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 93 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 479 tests: 466 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
            "Verification: syntax checks, git diff --check and temporary-marker scan passed"
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
          "FINDING-20260825-010-017"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "活动 owner 阻断、外部安装保护和可恢复 Setup 行为的产品含义未改变，并继续由 durable distribution specification 清晰定义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer 现在按 durable interaction contract 禁用被 owner 阻塞的安装类动作，并直接列出具体 Chat/Automation 摘要。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未建立、修改或重新解释视觉主题、token、布局或 durable presentation 规则；只在既有错误面板中投影结构化 blocker 内容。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占 mutation 和 owner guard；稳定 code 与净化 refs 通过 authoritative snapshot 到达 Renderer，IPC 不依赖异常自定义字段保真，也未扩大 Renderer 权限或主动 interrupt owner。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-017 已修复，但非-standalone update 仍返回错误的稳定 code；Codex Setup accepted contract 尚未完全实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "owner stable code、无敏感 refs、installer 零启动、生产 IPC snapshot 和真实 Renderer 展示已有重复证据，但 FINDING-019 的 external-install recovery code 风险仍开放。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 93 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 466 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-019"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused cross-layer suites — 93 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete inventory — 479 tests: 466 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:22:54.560Z"
    },
    {
      "round": 28,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "将非-standalone update 前置条件的错误码对齐为 `CODEX_EXTERNAL_INSTALLATION`，并以 configured、npm、homebrew、unknown-external 四类负向测试证明稳定拒绝和 installer 零启动。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case selection token e015c19265e4891cacf15d46d73e490708d07120d792597614cfb7af507e1943 比较全部 persisted candidates。四个 Project Gap 均需要独立 Case；FINDING-019 是当前 Case 唯一 ready candidate，因此选中。",
        "snapshot_token": "e015c19265e4891cacf15d46d73e490708d07120d792597614cfb7af507e1943",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-019",
        "comparison_summary": "FINDING-019 是唯一可在当前 Case 推进的 ready Gap；所有 Project Gap 因需要独立 Case而排除。",
        "fresh_discovery_summary": "代码、测试与 durable contract 检查未发现会改变本轮对象、范围或验收方式的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide"
            },
            "reason": "跨场景动态选择验证不属于当前 Codex Setup Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "runtime-wide"
            },
            "reason": "Runtime resilience 与 adapter 验收需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "security-wide"
            },
            "reason": "需要 permission-bearing real project，不能并入当前 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "project-wide"
            },
            "reason": "Project、Iteration 与 Case 跨记录审计需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-019",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "这是当前 Case 唯一 ready Gap，且直接修复 durable external-install recovery contract 漂移。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-019",
        "responsibility": "agent",
        "goal": "Resolve review finding: 非-standalone update 前置条件返回 `UPDATE_EXTERNAL_INSTALL`，而 durable technical contract 定义的稳定恢复 code 是 `CODEX_EXTERNAL_INSTALLATION`。当前测试没有覆盖该拒绝路径的 code，导致实现与可恢复错误契约漂移。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:17"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:236",
          "arckit/tech/arcorbit/installer-supply-chain.md:327",
          "Verification: source/test search found no CODEX_EXTERNAL_INSTALLATION assertion in production manager tests"
        ]
      },
      "planned_transition": {
        "goal": "将非-standalone update 前置条件的错误码对齐为 `CODEX_EXTERNAL_INSTALLATION`，并以 configured、npm、homebrew、unknown-external 四类负向测试证明稳定拒绝和 installer 零启动。",
        "expected_state_change": "FINDING-019 resolved；已知 Codex Setup 实现偏差全部关闭，普通 Gap 清空，后续状态仅能由 post-commit fresh snapshot 决定。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-019",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "`update()` 的 fresh precondition 现在对所有非-standalone provenance 返回 durable stable code `CODEX_EXTERNAL_INSTALLATION`。新增参数化负向测试覆盖 configured、npm、homebrew 与 unknown-external，证明错误 stage 保持 update、真实 provenance 保留且 installer 完全未启动。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Verification: Codex Setup Manager — 31 passed, 0 failed",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 480 tests: 467 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron tests reran outside sandbox and passed 2/2",
            "Verification: syntax checks, git diff --check and temporary-marker scan passed"
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
          "FINDING-20260825-010-019"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "外部安装继续由其原所有者维护，ArcOrbit 不会静默更新或替换；durable product specification 的行为含义未改变。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "外部安装仍显示来源并提供独立 migration 路径；稳定 recovery code 现在与该既有交互语义一致。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未建立、修改或重新解释视觉主题、token、组件样式、布局或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续以 executable provenance 决定 update 或 migration；本轮仅把拒绝码对齐 durable contract，没有扩大 Renderer、IPC 或 installer 权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最后一个已知 Codex Setup 实现偏差已修复；外部 executable 不会进入 direct update installer，并返回接受契约定义的稳定恢复码。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "四种外部 provenance 的重复负向测试直接证明稳定 code、保留真实来源和 installer 零启动；定向与完整回归未发现相关回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "Verification: Codex Setup Manager — 31 passed, 0 failed",
              "Verification: focused cross-layer suites — 94 passed, 0 failed",
              "Verification: complete inventory accounted for — 467 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "Verification: Codex Setup Manager — 31 passed, 0 failed",
        "Verification: focused cross-layer suites — 94 passed, 0 failed",
        "Verification: complete inventory — 480 tests: 467 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, diff and temporary-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:25:31.333Z"
    },
    {
      "round": 29,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 21 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的全部普通 Gap 已关闭；四个 Project Gap 均需建立独立 Case，completion-review:8 是唯一 ready 且可在当前 Case 推进的 persisted candidate。",
        "snapshot_token": "e7717359037c2a6ba0308b1c1abc3ac6988382433f874415e2c1299af3e8618f",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:8",
        "comparison_summary": "四个 Project Gap 均因 eligibility=case_required 而排除；completion-review:8 具备 high blocking、high risk 和 high user impact，是当前 Case 唯一 ready 候选。",
        "fresh_discovery_summary": "执行前未发现会改变候选选择的 fresh Gap；Completion Review 发现的实现遗漏作为 review finding 提交，等待 Ledger 在 post-commit state 中派生普通修复 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 验证多类真实软件场景，不属于当前 Codex Setup Case 的完成审查范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 推进 Runtime resilience 与 adapter acceptance，不应并入当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要具有真实受控资源的独立 Case，不属于当前实现审查的可写范围。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "虽然 urgency 和 risk 均高，但必须建立独立 Case，不能取代当前 Case 的完成门禁。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:8",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 已关闭，必须独立检查五个完成维度后才能判定 Case 是否可收束。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:8",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:21"
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
        "goal": "独立审查 content revision 21 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 Completion Review finding；不修改 Case 内容，由 Ledger 据 finding 派生下一轮普通修复 Gap，Case 保持 unresolved。"
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
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260825-010-020",
              "kind": "omission",
              "statement": "CodexSetupManager 的 operation projection 只有 id、kind、phase 与 cancellable，没有 durable technical contract 要求的 started_at；Renderer 因而无法显示 login-in-progress 的等待时间。安装、更新或登录后的自动复核也只投影通用 rechecking，没有依次展示 executable discovery、version probe、login status 与后续 readiness。现有测试只验证 rechecking 存在，未覆盖这些可观察状态要求。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md:323",
                "arckit/interaction/setup-readiness/interaction.md:87",
                "arckit/interaction/setup-readiness/interaction.md:96",
                "arckit/interaction/setup-readiness/interaction.md:167",
                "runtime/arcorbit/src/codex-setup-manager.mjs:120",
                "runtime/arcorbit/src/codex-setup-manager.mjs:147",
                "runtime/arcorbit/desktop/renderer/renderer.js:741",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:587",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs:68",
                "Direct event probe: phases=[starting,downloading,executing,discovering,rechecking], operation_keys=[id,kind,phase,cancellable], has_started_at=false",
                "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced projection omission"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused cross-layer suites — 94 passed, 0 failed",
            "Direct event probe reproduced missing started_at and opaque rechecking projection",
            "Canonical prior verification: complete inventory — 480 tests, 467 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2"
          ],
          "reviewed_content_revision": 21
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改 Codex 安装、认证、恢复或 readiness 的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 已明确要求登录等待时间和 executable、version、login-status、其它 readiness 的分阶段复核；本轮 finding 是生产投影遗漏，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 未发现或改变视觉主题、token、组件样式、布局或 presentation 规则；finding 仅涉及状态内容与时间投影。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical artifact 明确定义 operation.started_at 与受控复核阶段，足以定位生产实现和测试的偏差；既有 main-process ownership、typed IPC 与权限边界仍清晰。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不接受新的 realization 主张或修改既有 fact/impact；发现的实现遗漏作为 review finding 提交，待 Ledger 派生普通修复 Gap 后在 fresh snapshot 中重新评估。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的等待时间和分阶段复核偏差已作为 review finding 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused cross-layer suites — 94 passed, 0 failed",
        "Direct event probe: operation lacks started_at and automatic verification remains one generic rechecking phase"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:32:53.375Z"
    },
    {
      "round": 30,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 Codex Setup operation 贯穿投影 started_at，并把自动复核拆分为 executable、version、login status 与其它 readiness 阶段，同时由 Renderer 显示等待时间。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 仅有一个 ready 的普通修复 Gap；四个 Project Gap 均需要独立 Case，不能取代当前 Case 的阻塞修复。",
        "snapshot_token": "1d91b9fe1aac9c30419c40a58b4b494da6c40e8d81af783d653daab0e38ff0e3",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-020",
        "comparison_summary": "FINDING-020 是唯一 ready、agent-owned 且直接阻塞当前 Case 完成的候选；其 blocking 与 risk 均为 high。四个 Project Gap 虽有高风险或高紧迫性，但 eligibility 均为 case_required。",
        "fresh_discovery_summary": "执行前及修复验证期间未发现会改变本轮对象、范围或验收方式的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 验证多类真实软件场景，不属于当前 Codex Setup 修复范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 推进 Runtime resilience 与 adapter acceptance，不能并入当前修复。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要具有真实受控资源的独立安全验证 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "虽然风险与紧迫性均高，但必须由独立 Case 推进。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-020",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是当前 Case 唯一 ready 候选，直接阻塞 accepted Codex Setup contract 的 realization 与下一次 Completion Review。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-020",
        "responsibility": "agent",
        "goal": "Resolve review finding: CodexSetupManager 的 operation projection 只有 id、kind、phase 与 cancellable，没有 durable technical contract 要求的 started_at；Renderer 因而无法显示 login-in-progress 的等待时间。安装、更新或登录后的自动复核也只投影通用 rechecking，没有依次展示 executable discovery、version probe、login status 与后续 readiness。现有测试只验证 rechecking 存在，未覆盖这些可观察状态要求。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:21"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/tech/arcorbit/installer-supply-chain.md:323",
          "arckit/interaction/setup-readiness/interaction.md:87",
          "arckit/interaction/setup-readiness/interaction.md:96",
          "arckit/interaction/setup-readiness/interaction.md:167",
          "runtime/arcorbit/src/codex-setup-manager.mjs:120",
          "runtime/arcorbit/src/codex-setup-manager.mjs:147",
          "runtime/arcorbit/desktop/renderer/renderer.js:741",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:587",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs:68",
          "Direct event probe: phases=[starting,downloading,executing,discovering,rechecking], operation_keys=[id,kind,phase,cancellable], has_started_at=false",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced projection omission"
        ]
      },
      "planned_transition": {
        "goal": "让 Codex Setup operation 贯穿投影 started_at，并把自动复核拆分为 executable、version、login status 与其它 readiness 阶段，同时由 Renderer 显示等待时间。",
        "expected_state_change": "生产 manager、Renderer 与跨层测试兑现 operation 可观察性契约；FINDING-020 对应 Gap 和 review finding 被解决。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-020",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "CodexSetupManager 现在为每次 mutation 创建一个 ISO started_at，并在启动、进度、device-auth 与不可取消复核阶段保持一致。自动复核依次发布 rechecking-executable、rechecking-version、rechecking-login-status、rechecking-readiness；Renderer 将阶段转成可读反馈并每秒更新等待时间。Manager、静态 Renderer 和真实 Electron production matrix 均直接验证该行为。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 480 tests: 467 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary diagnostic markers added"
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
          "FINDING-20260825-010-020"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、认证、恢复与 readiness 的产品含义未改变；修复继续兑现既有 durable distribution specification。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer 现在显示登录等待时间，并依次投影 executable、version、login status 与其它 readiness，直接兑现既有交互契约。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未建立、修改或重新解释视觉主题、token、组件样式或布局规则；仅完善既有反馈区域的状态文本。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续独占 operation 生命周期与复核；started_at 和显式阶段通过既有 typed snapshot 到达 Renderer，没有扩大 IPC、命令或凭证权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最后一个已知 Codex Setup operation 可观察性偏差已修复；生产 manager 与 Renderer 现在实现 durable contract 定义的开始时间、等待反馈和分阶段自动复核。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复单元事件证据验证同一 started_at、四阶段顺序和不可取消复核；真实 Electron 验证跨 main/preload/Renderer 的等待时间与阶段显示，完整 inventory 未发现相关回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 94 passed, 0 failed",
              "Verification: real Setup Electron production matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 467 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 480 tests: 467 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks, git diff --check and temporary-marker scan passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:40:48.870Z"
    },
    {
      "round": 31,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 22 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的普通 Gap 已全部关闭；四个 Project Gap 均需要独立 Case，completion-review:9 是唯一 ready 且可在当前 Case 推进的 persisted candidate。",
        "snapshot_token": "a239bc4a095ad1b69775c023006e363e0c64ff9cfacde4f372df108e5e1831df",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:9",
        "comparison_summary": "四个 Project Gap 因 eligibility=case_required 排除；completion-review:9 具有 high blocking、high risk 和 high user impact，是当前 Case 唯一 ready 候选。",
        "fresh_discovery_summary": "选择前未发现改变候选排序的 fresh Gap；审查期间发现的复核阶段时序偏差作为 review finding 提交，等待 Ledger 在 post-commit state 中派生普通修复 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 验证多类真实软件场景，不属于当前 Codex Setup Case 的完成审查范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要独立 Case 推进 Runtime resilience 与 adapter acceptance，不能并入当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要具有真实受控资源的独立 Case，不属于当前实现审查范围。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "虽然 urgency 与 risk 均高，但必须建立独立 Case，不能取代当前 Case 的完成门禁。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:9",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 已关闭，必须独立检查五个完成维度后才能判断 Case 是否可以收束。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:9",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:22"
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
        "goal": "独立审查 content revision 22 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 Completion Review finding；不修改 Case 内容，由 Ledger 派生下一轮普通修复 Gap，Case 保持 unresolved。"
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
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260825-010-021",
              "kind": "error",
              "statement": "CodexSetupManager 新增的自动复核阶段没有绑定对应的真实工作。`probeExecutable` 内部同时执行 executable discovery 与 `codex --version`，但 manager 只在整个 probe 返回后才发布 `rechecking-version`；随后 `rechecking-login-status` 与 `rechecking-readiness` 几乎立即发布。真正的 project skill readiness 则由 `refreshAfterCodexOperation` 在 manager 已清空 operation 后执行。因此 Renderer 显示的 version 与其它 readiness 阶段是瞬时标签，不能可信表示当前正在执行或失败的复核步骤。现有测试只断言四个 phase 的数组顺序，没有阻塞各底层动作来验证阶段时序。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/src/codex-executable-resolver.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs:56",
                "runtime/arcorbit/src/codex-setup-manager.mjs:58",
                "runtime/arcorbit/src/codex-setup-manager.mjs:72",
                "runtime/arcorbit/src/codex-setup-manager.mjs:85",
                "runtime/arcorbit/src/codex-executable-resolver.mjs:37",
                "runtime/arcorbit/src/codex-executable-resolver.mjs:49",
                "runtime/arcorbit/desktop/main.mjs:335",
                "runtime/arcorbit/desktop/main.mjs:337",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:606",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs:72",
                "arckit/interaction/setup-readiness/interaction.md:167",
                "Direct timing probe: while the combined discovery/version probe was blocked, events=[rechecking-executable]; after release, rechecking-version, rechecking-login-status and rechecking-readiness were all emitted at 92ms",
                "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced phase-to-work mismatch"
              ]
            }
          ],
          "evidence": [
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Direct timing probe reproduced phase-to-work mismatch",
            "Verification: focused cross-layer suites — 94 passed, 0 failed",
            "Verification: syntax checks and git diff --check passed"
          ],
          "reviewed_content_revision": 22
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改安装、认证、恢复或 readiness 的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 已明确要求自动复核依次显示 executable、version、login status 与其它 readiness；本轮 finding 是生产时序投影偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有发现或改变视觉主题、token、组件样式、布局或 presentation 规则；finding 只涉及状态时序与可观察性。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical artifact 仍明确规定 discovery、version、login status 与后续 readiness 的受控复核顺序；现有 main-process ownership、typed IPC 和权限边界仍可恢复，finding 定位的是生产实现未准确映射该生命周期。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不接受新的 realization 主张或修改既有 fact/impact；发现的阶段时序偏差作为 review finding 提交，待 Ledger 派生普通修复 Gap 后在 fresh snapshot 中重新评估。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的阶段与真实工作时序偏差已作为 review finding 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Direct timing probe: version, login-status and readiness phases appeared only after the combined discovery/version probe completed",
        "Verification: focused cross-layer suites — 94 passed, 0 failed",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:44:12.551Z"
    },
    {
      "round": 32,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 executable、version、login status 与 readiness 阶段分别覆盖其对应真实复核工作，并以时间感知测试证明阶段时序。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "在当前 snapshot 中，FINDING-021 是唯一 ready、agent-responsible 且无阻塞依赖的 Case Gap；四个 Project Gap 均需另建 Case，不能在当前 Case transition 中处理。",
        "snapshot_token": "6d1776617f0aaaa7562f31e096dfc76ae2d32857b4d7c608d4a6e5335d0611f6",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-021",
        "comparison_summary": "FINDING-021 直接阻塞当前 Case 收束，且风险与 blocking 均为 high；其余候选虽然具有项目级风险，但 eligibility 为 case_required。",
        "fresh_discovery_summary": "源码核查与既有 timing probe 未发现优先级更高的新鲜 Gap；本轮只处理持久化的 FINDING-021。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-021",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前 Case 唯一 ready Gap，直接阻塞实现收束。"
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
            "reason": "需要独立 Case，不能替代当前 ready Case Gap。"
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
            "reason": "需要独立 Case，且不直接阻塞当前 Codex Setup 修复。"
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
            "reason": "需要独立 Case，当前轮无权预先展开。"
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
            "reason": "需要真实 permission-bearing 项目与独立 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-021",
        "responsibility": "agent",
        "goal": "Resolve review finding: CodexSetupManager 新增的自动复核阶段没有绑定对应的真实工作。`probeExecutable` 内部同时执行 executable discovery 与 `codex --version`，但 manager 只在整个 probe 返回后才发布 `rechecking-version`；随后 `rechecking-login-status` 与 `rechecking-readiness` 几乎立即发布。真正的 project skill readiness 则由 `refreshAfterCodexOperation` 在 manager 已清空 operation 后执行。因此 Renderer 显示的 version 与其它 readiness 阶段是瞬时标签，不能可信表示当前正在执行或失败的复核步骤。现有测试只断言四个 phase 的数组顺序，没有阻塞各底层动作来验证阶段时序。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:22"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/src/codex-setup-manager.mjs:56",
          "runtime/arcorbit/src/codex-setup-manager.mjs:58",
          "runtime/arcorbit/src/codex-setup-manager.mjs:72",
          "runtime/arcorbit/src/codex-setup-manager.mjs:85",
          "runtime/arcorbit/src/codex-executable-resolver.mjs:37",
          "runtime/arcorbit/src/codex-executable-resolver.mjs:49",
          "runtime/arcorbit/desktop/main.mjs:335",
          "runtime/arcorbit/desktop/main.mjs:337",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:606",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs:72",
          "arckit/interaction/setup-readiness/interaction.md:167",
          "Direct timing probe: while the combined discovery/version probe was blocked, events=[rechecking-executable]; after release, rechecking-version, rechecking-login-status and rechecking-readiness were all emitted at 92ms",
          "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 94 passed, 0 failed despite the reproduced phase-to-work mismatch"
        ]
      },
      "planned_transition": {
        "goal": "让 executable、version、login status 与 readiness 阶段分别覆盖其对应真实复核工作，并以时间感知测试证明阶段时序。",
        "expected_state_change": "解决 FINDING-021，使当前 Case 重新进入 Completion Review 候选生成条件。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-021",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "生产 resolver 现在在 discovery 和每次真实 version probe 开始时发布阶段；CodexSetupManager 在 login-status 工作开始前发布对应阶段，并在真实 skill readiness 检查结束前持续保留 rechecking-readiness。main process 将 readiness callback 注入 manager，操作完成后不再在 operation 清除后另行复核。时间感知单元测试和真实 Electron production matrix 分别阻塞四个底层动作，证明每个可见阶段都覆盖实际工作窗口。",
          "evidence": [
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Resolver, Setup IPC, Setup Manager and Desktop Renderer suites — 95 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 481 tests: 468 passed, 11 environment-gated skips, 2 GUI-sandbox failures; both Electron files reran outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary diagnostic markers added"
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
          "FINDING-20260825-010-021"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、认证、恢复与 ready 条件的产品含义未改变；修复仅使自动复核反馈准确覆盖实际工作。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer 继续依次显示 executable、version、login status 与其它 readiness，且这些阶段现在真实对应底层工作窗口。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改或重新解释视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "main-process manager 继续拥有复核生命周期；resolver stage callback 与注入的 readiness callback 明确建立阶段到真实工作的关系，没有扩大 IPC、Renderer、命令或凭证权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 resolver、manager 与 Desktop main 现在兑现 durable contract 所定义的分阶段自动复核可观察性。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "时间感知测试分别阻塞 discovery、version、login status 与 readiness，直接证明阶段覆盖真实执行窗口；定向、真实 Electron 与完整 inventory 未发现功能回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 95 passed, 0 failed",
              "Verification: real Setup Electron production matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 468 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused cross-layer suites — 95 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 481 tests accounted for; 468 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:52:50.507Z"
    },
    {
      "round": 33,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 23 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 fresh snapshot 中只有 content revision 23 的 Completion Review 为 ready；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "aa370fbcca52f0730115abfdf517e1e4dd2f69b84a46ca864d80aa0a339e3e38",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:10",
        "comparison_summary": "Completion Review 直接阻塞当前 Case 收束，blocking、risk 与 user impact 均为 high；其余候选 eligibility 均为 case_required。",
        "fresh_discovery_summary": "审查开始前未发现其它 ready fresh candidate；源码审查形成的缺陷作为 Completion Review finding 提交，不在本轮修复。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:10",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 唯一 ready 候选，负责独立审查全部五个完成维度。"
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
            "reason": "需要独立 Case，不能替代当前 Completion Review。"
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
            "reason": "需要独立 Case，不属于当前 Codex Setup 审查范围。"
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
            "reason": "需要独立 Case，当前轮不预先展开。"
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
            "reason": "需要 permission-bearing 项目与独立 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:10",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:23"
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
        "goal": "独立审查 content revision 23 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 Completion Review findings，并由 trusted Ledger 派生下一轮普通修复 Gap。"
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
            "minimality": "findings"
          },
          "findings": [
            {
              "id": "FINDING-20260825-010-022",
              "kind": "error",
              "statement": "生产 `rechecking-readiness` callback 调用完整 `skillProvisioningManager.check({quiet:true})`，而该检查会通过同一个 resolver 再次执行 executable discovery 与 `codex --version`。因此“其它 readiness”阶段仍隐藏第二次 Codex probe，没有完全解决阶段到真实工作的映射问题。若第一次 manager probe 与 login status 成功、第二次 skill probe 瞬时失败，CodexSetupManager 最终仍可投影 ready，SkillProvisioningManager 则投影 blocked/CODEX_UNAVAILABLE；Desktop aggregate 会保留 status=blocked，却将该 skill error 清空为 error=null，用户无法理解或恢复。新增 manager 与 Electron 时序测试只注入可阻塞的空 readiness callback，未执行生产 SkillProvisioningManager，也未覆盖重复 probe 或该分歧状态。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/main.mjs:103",
                "runtime/arcorbit/desktop/main.mjs:108",
                "runtime/arcorbit/desktop/main.mjs:112",
                "runtime/arcorbit/desktop/main.mjs:353",
                "runtime/arcorbit/desktop/main.mjs:365",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
                "runtime/arcorbit/src/codex-setup-manager.mjs:59",
                "runtime/arcorbit/src/codex-setup-manager.mjs:124",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs:600",
                "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:110",
                "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,error:null,can_continue:false}",
                "Verification: focused Codex Setup Manager and Skill Provisioning Manager suites — 37 passed, 0 failed despite the uncovered production composition defect"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Direct aggregate projection probe: duplicate Codex probe failure yields status=blocked, error=null, can_continue=false",
            "Verification: focused manager and skill-readiness suites — 37 passed, 0 failed"
          ],
          "reviewed_content_revision": 23
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未修改安装、认证、恢复或 readiness 的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "durable interaction artifact 已明确要求 executable、version、login status 与其它 readiness 的顺序和可见失败位置；finding 是生产组合偏差，不是长期交互预期缺失。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有发现或改变视觉主题、token、组件样式、布局或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "durable technical artifact 明确定义 aggregate 检查顺序和阶段边界，足以定位重复 Codex probe 与错误清除问题；main-process ownership 和 typed IPC 边界仍可恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不接受新的 realization 主张或修改既有 fact/impact；发现的生产组合偏差作为 review finding 提交，待 Ledger 派生普通修复 Gap 后在 fresh snapshot 中重新评估。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；现有绿色测试未覆盖的重复 probe 与无错误 blocked projection 已作为 review finding 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Direct aggregate projection probe: {status:blocked,error:null,can_continue:false}",
        "Verification: focused manager and skill-readiness suites — 37 passed, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T19:57:03.358Z"
    },
    {
      "round": 34,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 post-operation Skill readiness 复用 CodexSetupManager 已验证的 executable probe，消除 rechecking-readiness 内隐藏的第二次 Codex probe，并保留独立 Skill check 的正常探测能力。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 snapshot 中 FINDING-022 是唯一 ready、agent-responsible 且无依赖阻塞的 Case Gap；四个 Project Gap 均为 case_required，不能在当前 Case transition 中处理。",
        "snapshot_token": "dae5c671f07da1ae91927aca0239067200a4b364d8b3562e31cb09e6164de048",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-022",
        "comparison_summary": "FINDING-022 直接阻塞当前 Case 收束，blocking 与 risk 均为 high；其他候选需要独立 Case，不能替代当前生产组合修复。",
        "fresh_discovery_summary": "源码与测试核查没有发现必须先于 FINDING-022 接受的新鲜前置 Gap；本轮仅完成该持久化 Gap。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-022",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前 Case 唯一 ready Gap；重复 Codex probe 和无错误 blocked projection 直接阻塞可信收束。"
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
            "reason": "需要独立 Case，不能替代当前 ready Case Gap。"
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
            "reason": "需要独立 Case，且不直接阻塞当前 Codex Setup 修复。"
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
            "reason": "需要独立 Case，当前轮不预先展开。"
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
            "reason": "需要真实 permission-bearing 项目与独立 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-022",
        "responsibility": "agent",
        "goal": "Resolve review finding: 生产 `rechecking-readiness` callback 调用完整 `skillProvisioningManager.check({quiet:true})`，而该检查会通过同一个 resolver 再次执行 executable discovery 与 `codex --version`。因此“其它 readiness”阶段仍隐藏第二次 Codex probe，没有完全解决阶段到真实工作的映射问题。若第一次 manager probe 与 login status 成功、第二次 skill probe 瞬时失败，CodexSetupManager 最终仍可投影 ready，SkillProvisioningManager 则投影 blocked/CODEX_UNAVAILABLE；Desktop aggregate 会保留 status=blocked，却将该 skill error 清空为 error=null，用户无法理解或恢复。新增 manager 与 Electron 时序测试只注入可阻塞的空 readiness callback，未执行生产 SkillProvisioningManager，也未覆盖重复 probe 或该分歧状态。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:23"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/main.mjs:103",
          "runtime/arcorbit/desktop/main.mjs:108",
          "runtime/arcorbit/desktop/main.mjs:112",
          "runtime/arcorbit/desktop/main.mjs:353",
          "runtime/arcorbit/desktop/main.mjs:365",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
          "runtime/arcorbit/src/codex-setup-manager.mjs:59",
          "runtime/arcorbit/src/codex-setup-manager.mjs:124",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs:600",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs:110",
          "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,error:null,can_continue:false}",
          "Verification: focused Codex Setup Manager and Skill Provisioning Manager suites — 37 passed, 0 failed despite the uncovered production composition defect"
        ]
      },
      "planned_transition": {
        "goal": "让 post-operation Skill readiness 复用 CodexSetupManager 已验证的 executable probe，消除 rechecking-readiness 内隐藏的第二次 Codex probe，并保留独立 Skill check 的正常探测能力。",
        "expected_state_change": "解决 FINDING-022，使自动复核阶段只覆盖对应真实工作，避免同一操作产生 Codex ready 与 Skill CODEX_UNAVAILABLE 的分歧投影。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-022",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "CodexSetupManager 现在把本次 inspection 的受控 executable probe 直接交给 recheckReadiness；SkillProvisioningManager 仅在显式收到 codexProbeResult 时复用该证据，普通 check/assertReady 仍自行探测。Desktop main 使用这一窄接口完成生产组合。实际双-manager 回归证明安装前后只有 CodexSetupManager 执行两次必要 probe，post-operation Skill readiness 的 probe 调用数为零；独立 Skill check 随后仍自行探测并正确阻塞。真实 Electron 还证明 readiness callback 收到与 executable/version 阶段相同的 standalone probe。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 102 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 482 tests accounted for; 469 passed, 11 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG, temporary console or diagnostic markers found"
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
          "FINDING-20260825-010-022"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、认证、恢复与 ready 条件的产品含义未改变；修复仅消除自动复核中的重复 Codex probe。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer 继续依次显示 executable、version、login status 与其它 readiness；其它 readiness 阶段现在不再隐藏第二次 Codex executable/version 工作。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改或重新解释视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "CodexSetupManager 继续拥有 executable/version/login-status 生命周期；SkillProvisioningManager 通过显式结果参数复用已验证证据，独立检查仍保持原探测边界，没有扩大 IPC、Renderer、命令或凭证权限。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 manager、Skill Provisioning 与 Desktop 组合现在只执行一次 post-operation Codex executable/version 复核，并继续完成登录状态及其它 readiness 检查。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "实际双-manager 测试直接证明 post-operation Skill probe 调用数为零且独立检查仍探测；真实 Electron 验证同一 probe 跨阶段传递，定向和完整 inventory 未发现功能回归。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 102 passed, 0 failed",
              "Verification: real Setup Electron production matrix — 1 passed, 0 failed",
              "Verification: complete inventory accounted for — 469 passed, 11 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: focused cross-layer suites — 102 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 482 tests accounted for; 469 passed, 11 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-183203526Z-52748020",
      "occurred_at": "2026-08-25T20:06:30.180Z"
    },
    {
      "round": 35,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "接受用户追加 10 轮 Completion Review 的授权，并保留架构合理性优先审查指令。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前唯一 ready 候选是 Completion Review 预算耗尽的人类决定；用户已明确授权追加 10 轮。其余四个 persisted Project Gap 均需要独立 Case，不能在当前 Case 的本轮中选择。",
        "snapshot_token": "1e1dd0ac750eeab28e195956841f149b6645136603d6004b32c21bc169fe92a3",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:human-decision",
        "comparison_summary": "人类预算决定是唯一 ready 且阻塞当前 Case 的候选，因此优先于四个 case_required Project Gap。",
        "fresh_discovery_summary": "当前用户输入提供了权威的 10 轮预算授权和架构优先审查要求；在取得独立 review 证据前，不将潜在架构问题预判为新的普通 Gap。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:human-decision",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是唯一 ready 候选，且用户已提供所需的明确人类决定。"
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
            "reason": "需要独立 Case，不能与当前 Case 的预算授权主张混合。"
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
            "reason": "需要独立 Case，且不阻塞当前 Completion Review 预算恢复。"
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
            "reason": "需要独立 Case，不能在当前 Case 的单一主张中推进。"
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
            "reason": "需要独立 Case，不能在当前 Case 的单一主张中推进。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:human-decision",
        "responsibility": "human",
        "goal": "Decide how to handle the exhausted completion review budget.",
        "reason": "The autonomous completion review budget is exhausted.",
        "derived_from": [
          "case_result",
          "content_revision:24"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "explicit human disposition"
        ]
      },
      "planned_transition": {
        "goal": "接受用户追加 10 轮 Completion Review 的授权，并保留架构合理性优先审查指令。",
        "expected_state_change": "Completion Review 预算增加 10 个周期；Case 内容不变，后续 fresh snapshot 应重新产生可执行的 Completion Review 候选。"
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
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": {
          "additional_cycles": 10,
          "authorized_by": "human",
          "reason": "用户明确授权追加 10 轮 Completion Review，并要求首先确认既有复查问题背后是否存在架构级合理性问题；若存在，应先完成架构治理再继续后续 review。",
          "evidence": [
            "Current operator input, 2026-08-26"
          ]
        }
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只接受 review 预算授权，不建立、修改或否定产品预期。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变用户旅程、交互状态、反馈或恢复语义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不涉及视觉语言、布局、组件或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "预算授权不接受任何架构结论；架构合理性将在续开的首轮 Completion Review 中依据实现和 durable technical evidence 独立判断。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮不主张实际软件状态已经实现或偏离任何接受事实。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受风险已受控结论，只授权继续取得独立审查证据。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:02:43.457Z"
    },
    {
      "round": 36,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 24 的架构合理性、实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion Review 11 是当前 Case 唯一 ready 候选，并直接承接用户授权的架构优先复查要求；四个 Project Gap 均需要独立 Case。",
        "snapshot_token": "e2c709505899d1bfd9366fa8a44e35eaf31784c3f3d1287610c15351d36495ce",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:11",
        "comparison_summary": "选择阻塞当前 Case 的 Completion Review 11；四个 Project Gap 虽具有高风险或高不确定性，但均为 case_required，不能在本轮推进。",
        "fresh_discovery_summary": "架构优先审查发现普通 aggregate check 与执行 preflight 仍重复拥有 Codex executable/version readiness；该 finding 必须由 Ledger 派生为下一轮普通修复 Gap，本轮不直接实施治理。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:11",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "唯一 ready 的当前 Case 候选，且用户明确要求先检查架构合理性。"
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
            "reason": "需要独立 Case，不能与当前 Completion Review 混合。"
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
            "reason": "需要独立 Case，且不优先于当前 Case 的 review 门禁。"
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
            "reason": "需要独立 Case，不能在 Completion Review 主张中推进。"
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
            "reason": "需要独立 Case，不能在 Completion Review 主张中推进。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:11",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:24"
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
        "goal": "独立审查 content revision 24 的架构合理性、实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录一个架构级 Completion Review finding，并由 Ledger 在下一 fresh snapshot 中派生普通修复 Gap；本轮不修改 Case 内容或生产文件。"
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
            "minimality": "findings"
          },
          "findings": [
            {
              "id": "FINDING-20260825-010-023",
              "kind": "error",
              "statement": "Codex executable/version readiness 尚未形成单一架构所有者。Durable technical contract 将 Codex discovery/version 归 CodexSetupManager、项目 skill 文件归 SkillProvisioningManager，但生产 `checkCombinedSetupReadiness` 仍并行调用 `skillProvisioningManager.check()` 与 `codexSetupManager.check()`，前者默认通过同一 resolver 再次 discovery/version；Chat 与 Automation preflight 也先 `codexSetupManager.assertReady()`、再调用会自行 probe 的 `skillProvisioningManager.assertReady()`。因此最新 `codexProbeResult` 接口只修复 post-operation callback，未治理普通启动、手动 recheck 和执行前置路径的双重事实所有权。若 Skill probe 瞬时返回 CODEX_UNAVAILABLE 而 Codex manager 返回 ready，aggregate 会保留 status=blocked、清除 skill error，产生 error=null、can_continue=false 的不可解释状态。现有双-manager 测试只证明 post-operation probe 复用，未覆盖普通 aggregate/preflight 的单 probe、一致性或分歧恢复。应先把 CodexSetupManager/其协调层确立为唯一 Codex readiness authority，让 SkillProvisioningManager 只消费显式、同轮的受控 Codex 证据或完全移除其 Codex 探测与状态所有权，再继续后续 review。",
              "responsibility": "agent",
              "artifact_refs": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/src/codex-executable-resolver.mjs",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
                "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
              ],
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md:280",
                "arckit/tech/arcorbit/installer-supply-chain.md:313",
                "arckit/tech/arcorbit/installer-supply-chain.md:317",
                "arckit/tech/arcorbit/installer-supply-chain.md:359",
                "runtime/arcorbit/desktop/main.mjs:103",
                "runtime/arcorbit/desktop/main.mjs:108",
                "runtime/arcorbit/desktop/main.mjs:117",
                "runtime/arcorbit/desktop/main.mjs:129",
                "runtime/arcorbit/desktop/main.mjs:324",
                "runtime/arcorbit/desktop/main.mjs:346",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs:46",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs:645",
                "runtime/arcorbit/src/codex-executable-resolver.mjs:20",
                "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,can_continue:false,error:null}",
                "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 102 passed, 0 failed despite no ordinary aggregate/preflight single-probe assertion",
                "Verification: source/test search found probe-count coverage only for post-operation readiness reuse"
              ]
            }
          ],
          "evidence": [
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Direct aggregate projection probe reproduced blocked/error-null divergence",
            "Verification: focused cross-layer suites — 102 passed, 0 failed",
            "Verification: git diff --check passed"
          ],
          "reviewed_content_revision": 24
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未改变安装、认证、恢复或 ready 条件的产品含义；durable product specification 仍保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Durable interaction artifact 仍明确要求顺序清晰、失败可见且可恢复的 Setup Readiness；finding 定位的是生产架构未稳定实现该语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有发现或改变视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Durable technical artifact 已明确 CodexSetupManager 与 SkillProvisioningManager 的职责边界、同次 probe 复用和 aggregate 顺序，足以解释并定位生产双 owner 偏差；长期技术决策本身仍可恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不接受新的 realization 主张或修改既有 fact/impact；发现的架构偏差作为 review finding 提交，待 Ledger 派生普通修复 Gap 后重新评估。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的双 owner 与无错误阻塞风险已经作为 review finding 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Direct aggregate projection probe: {status:blocked,can_continue:false,error:null}",
        "Verification: focused cross-layer suites — 102 passed, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:06:27.000Z"
    },
    {
      "round": 37,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "确立 CodexSetupManager 为生产 Codex executable/version readiness 的唯一权威，并让普通 aggregate、Chat/Automation preflight 与 post-operation Skill readiness 复用同轮证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较全部 persisted candidates 后，四个 Project Gap 均需新 Case，只有 FINDING-023 是当前 Case 内 ready、无阻塞且高风险/高阻塞的 Agent Gap。",
        "snapshot_token": "ff277ec199b1fda3ae858e278990d288d8f33cf645f3ec8030ebb833f332fc8b",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-023",
        "comparison_summary": "FINDING-023 直接阻塞当前 Case 的 Completion Review，并涉及普通启动、手动复核及执行 preflight 的双重事实所有权；其他候选均为 case_required Project Gap，不能在本轮推进。",
        "fresh_discovery_summary": "实现与验证未发现需要抢占本轮的新独立 Gap；旧 Skill/Codex 投影分歧的恢复语义已在所选 Gap 内一并收紧。",
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
            "reason": "需要独立 Case，且不应抢占当前 Case 的 blocking review finding。"
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
            "reason": "需要独立 Case；本轮只推进当前 Case 内唯一 ready Gap。"
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
            "reason": "需要独立、具真实权限资源的 Case，当前不能在本 Case 内接受。"
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
            "reason": "虽具有高风险和高紧迫性，但需要独立 Case，不能取代当前 blocking repair。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-023",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前 Case 唯一 ready Gap，直接阻塞 Completion Review，并影响 Setup、Chat 与 Automation 的权威 readiness 边界。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-023",
        "responsibility": "agent",
        "goal": "Resolve review finding: Codex executable/version readiness 尚未形成单一架构所有者。Durable technical contract 将 Codex discovery/version 归 CodexSetupManager、项目 skill 文件归 SkillProvisioningManager，但生产 `checkCombinedSetupReadiness` 仍并行调用 `skillProvisioningManager.check()` 与 `codexSetupManager.check()`，前者默认通过同一 resolver 再次 discovery/version；Chat 与 Automation preflight 也先 `codexSetupManager.assertReady()`、再调用会自行 probe 的 `skillProvisioningManager.assertReady()`。因此最新 `codexProbeResult` 接口只修复 post-operation callback，未治理普通启动、手动 recheck 和执行前置路径的双重事实所有权。若 Skill probe 瞬时返回 CODEX_UNAVAILABLE 而 Codex manager 返回 ready，aggregate 会保留 status=blocked、清除 skill error，产生 error=null、can_continue=false 的不可解释状态。现有双-manager 测试只证明 post-operation probe 复用，未覆盖普通 aggregate/preflight 的单 probe、一致性或分歧恢复。应先把 CodexSetupManager/其协调层确立为唯一 Codex readiness authority，让 SkillProvisioningManager 只消费显式、同轮的受控 Codex 证据或完全移除其 Codex 探测与状态所有权，再继续后续 review。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:24"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "arckit/tech/arcorbit/installer-supply-chain.md:280",
          "arckit/tech/arcorbit/installer-supply-chain.md:313",
          "arckit/tech/arcorbit/installer-supply-chain.md:317",
          "arckit/tech/arcorbit/installer-supply-chain.md:359",
          "runtime/arcorbit/desktop/main.mjs:103",
          "runtime/arcorbit/desktop/main.mjs:108",
          "runtime/arcorbit/desktop/main.mjs:117",
          "runtime/arcorbit/desktop/main.mjs:129",
          "runtime/arcorbit/desktop/main.mjs:324",
          "runtime/arcorbit/desktop/main.mjs:346",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:46",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:58",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:645",
          "runtime/arcorbit/src/codex-executable-resolver.mjs:20",
          "Direct aggregate projection probe: skill={status:blocked,error:CODEX_UNAVAILABLE} plus codex={status:ready,error:null} produced {status:blocked,can_continue:false,error:null}",
          "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 102 passed, 0 failed despite no ordinary aggregate/preflight single-probe assertion",
          "Verification: source/test search found probe-count coverage only for post-operation readiness reuse"
        ]
      },
      "planned_transition": {
        "goal": "确立 CodexSetupManager 为生产 Codex executable/version readiness 的唯一权威，并让普通 aggregate、Chat/Automation preflight 与 post-operation Skill readiness 复用同轮证据。",
        "expected_state_change": "解决 FINDING-023，消除生产双 probe/双 owner，并为任何旧证据分歧提供明确、不可误放行的恢复错误。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-023",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "生产 SkillProvisioningManager 的 Codex probe 现在通过 CodexSetupManager 权威检查取得；普通 aggregate 不再并行执行第二次 resolver probe，Chat 与 Automation preflight 将 Codex assertReady 返回的同轮证据显式传给 Skill 断言，post-operation 继续复用 mutation inspection 的 raw probe。纯组合层对旧 Skill=CODEX_UNAVAILABLE、最新 Codex=ready 的分歧返回 SETUP_EVIDENCE_STALE，避免 blocked/error=null 或误放行。",
          "evidence": [
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: focused Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 104 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 485 tests accounted for; 471 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
            "Verification: final affected suites — 60 passed, 0 failed",
            "Verification: syntax checks and git diff --check passed; temporary diagnostic-marker scan found no matches"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "安装、认证、恢复和 ready 条件的产品含义未改变；实现只统一现有 readiness 事实来源。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness 继续保持顺序清晰、失败可见且可恢复；旧证据分歧现在提供明确的重新检查错误。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改或重新解释视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "CodexSetupManager 统一拥有生产 discovery/version/authentication inspection；SkillProvisioningManager 只消费显式同轮证据并继续拥有项目 skill 文件检查，符合 durable ownership contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产普通检查、Chat preflight、Automation preflight 与 post-operation 路径均复用 CodexSetupManager 的同轮证据，实际软件状态实现接受的 Setup ownership 边界。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "单 probe 计数、同轮 preflight 复用、分歧恢复、真实 Electron 生产链路和完整 inventory 提供了可重复且与风险相称的证据。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused suites — 104 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory — 471 passed, 12 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: focused suites — 104 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 485 accounted for; 471 passed, 12 gated skips, 2 sandbox-only failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:17:27.118Z"
    },
    {
      "round": 38,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 25 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 中全部 persisted candidates 后，四个 Project Gap 均需要独立 Case；当前 Case 唯一 ready 且直接阻塞收束的候选是 content revision 25 的 Completion Review。",
        "snapshot_token": "e7651658ef8e3acaec76a99379016222471a7a0859eba33857121389ea9b46bd",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:12",
        "comparison_summary": "Completion Review 是当前 Case 唯一 ready candidate，具有高阻塞、高风险和高用户影响；四个 Project Gap 均为 case_required，不能在当前 Case 内替代审查。",
        "fresh_discovery_summary": "选择前未发现需要抢占 Completion Review 的 fresh Gap；审查执行中发现的两个缺陷作为 review findings 提交，由 Ledger 在写回后派生普通修复 Gap。",
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
            "reason": "需要独立 Case 验证多类真实软件场景，不能在当前 Case 的 Completion Review 中推进。"
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
            "reason": "需要独立 Case 处理 Runtime 韧性与 adapter 验收，不属于当前 Setup Case 的审查候选。"
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
            "reason": "需要具备真实受控权限资源的独立 Case，当前无法在 Completion Review 中接受。"
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
            "reason": "虽有高风险和高紧迫性，但需要独立 Case，不能替代当前 Case 的收束审查。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:12",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 唯一 ready candidate；全部普通 Gap 已闭合，必须独立检查实现正确性、问题解决、验证可信度、回归风险与最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:12",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:25"
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
        "goal": "独立审查 content revision 25 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 Completion Review findings，并由 trusted Ledger 派生后续普通修复 Gap；本轮不修改 Case 内容或实现。"
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
            "minimality": "findings"
          },
          "findings": [
            {
              "id": "FINDING-20260825-010-024",
              "kind": "error",
              "statement": "生产普通 Setup readiness 与 Codex post-operation readiness 存在锁顺序环：`SkillProvisioningManager.check()` 持有 Skill 串行队列并通过 `codexProbe` 等待 `CodexSetupManager.check()`；活动 Codex mutation 同时持有 Codex 队列，并在 `recheckReadiness` 中等待另一个 Skill check。直接生产-manager 探针在释放 installer 后仍超时，状态停留于 Codex `rechecking-readiness` 与 Skill `checking`，因此手动检查或其它并发检查可能永久不返回。应由单一协调层确定调用顺序，消除 manager 间双向等待，并增加真实并发回归。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/main.mjs: Skill codexProbe awaits codexSetupManager.check while Codex recheckReadiness calls skillProvisioningManager.check",
                "runtime/arcorbit/src/codex-setup-manager.mjs: mutation and check share the Codex operation queue",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs: check holds its runExclusive queue across codexProbe",
                "Direct production-manager lock-order probe: after installer release, Promise.race timed out at 500ms with {codex_status:'checking',codex_operation:'rechecking-readiness',skill_status:'checking'}",
                "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite the reproduced deadlock"
              ]
            },
            {
              "id": "FINDING-20260825-010-025",
              "kind": "error",
              "statement": "`CodexSetupManager.assertReady()` 直接调用 `inspect({announce:false})`，没有进入 manager 的串行队列，也未拒绝活动 mutation。Chat 或 Automation preflight 与安装并发时，inspection 会发布并保存新的非操作 snapshot，从而把仍在运行且可取消的 `{installing, operation_id}` 覆盖成 `operation=null`；Renderer 会失去活动状态与取消入口，而后台 installer 仍继续运行。应让 preflight 遵守同一 operation authority，在活动 mutation 时稳定 fail closed 或串行等待，并增加并发 preflight/operation 投影回归。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/codex-setup-manager.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/test/codex-setup-manager.test.mjs",
                "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/src/codex-setup-manager.mjs: assertReady calls inspect directly while check uses runExclusive",
                "runtime/arcorbit/desktop/main.mjs: both Chat and Automation preflight invoke codexSetupManager.assertReady",
                "Direct production-manager probe before preflight: {status:'installing',operation_id:'present',cancellable:true}",
                "Direct production-manager probe after concurrent assertReady: {preflight_code:'CODEX_SETUP_NOT_READY',status:'missing',operation:null,error:null} while the installer remained active",
                "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite no active-operation/preflight concurrency assertion"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Direct production-manager preflight probe reproduced active operation projection loss",
            "Direct production-manager lock-order probe reproduced a 500ms non-settling cycle",
            "Verification: focused Completion Review suites — 91 passed, 0 failed"
          ],
          "reviewed_content_revision": 25
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未改变安装、认证、恢复或 ready 条件的产品含义；durable product specification 仍保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Durable interaction artifact 仍明确要求活动操作可见、可取消且恢复状态可信；本轮 finding 定位的是生产并发实现未稳定兑现该语义。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有发现或改变视觉主题、token、布局、组件样式或 presentation 规则；缺陷属于状态所有权与并发协调。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Durable technical artifact 仍清楚定义 CodexSetupManager、SkillProvisioningManager 与协调层的职责边界，足以解释并定位双向 manager 调用和未串行 preflight 的偏差。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "Completion Review 不接受新的实现符合性主张或修改既有 fact/impact；发现的并发偏差作为 review findings 提交，待 Ledger 派生普通修复 Gap 后重新评估。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "not_relevant",
            "reason": "本轮不接受新的风险已受控声明；绿色测试未覆盖的 operation 投影丢失与锁顺序死锁已作为 review findings 提交。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Direct production-manager preflight probe: active install projection changed from operation_id/cancellable=true to operation=null",
        "Direct production-manager lock-order probe: timed out at 500ms in rechecking-readiness/checking",
        "Verification: focused Completion Review suites — 91 passed, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:23:38.788Z"
    },
    {
      "round": 39,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "由单一 Desktop 协调层规定 Codex→Skill 调用顺序，移除 Skill→Codex 队列反向等待，并以真实双 manager 并发回归证明普通 readiness 与 post-operation readiness 均可完成。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 CASE-20260825-010 的 case-scoped selection token 比较全部 persisted candidates。两个 Case Gap 均为高阻塞、高风险；FINDING-024 是上游锁序环，可使所有并发 readiness 永久不返回，因而优先于状态投影缺陷 FINDING-025。四个 Project Gap 均需独立 Case。",
        "snapshot_token": "c76f9bd46aaaa5b0a05522b022e106901feaa7384017d346130fca00a7ed94d6",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-024",
        "comparison_summary": "选择 FINDING-024 以先消除 Codex 与 Skill manager 的双向等待；FINDING-025 延后到写回后的 fresh-read。",
        "fresh_discovery_summary": "执行前未发现需要加入比较的新 fresh candidate；实现与验证过程中也未发现改变本轮主张边界的新工作。",
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
            "reason": "需要独立 Case 验证动态 Gap 选择场景，不属于当前 Codex Setup 并发修复。"
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
            "reason": "属于独立 Runtime resilience/adapters 事项，当前 Case 不覆盖。"
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
            "reason": "需要真实 permission-bearing 项目与独立 Case。"
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
            "reason": "虽具有高 urgency，但需独立 Case，不能扩展当前 Setup Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-024",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "可稳定复现的锁序环会永久阻塞普通 readiness 与 post-operation readiness，是两个 ready Gap 中更上游的架构缺陷。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-025",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "并发 preflight 覆盖 operation projection 同样重要，但属于独立 operation-authority 缺陷，必须在本轮写回后的 fresh snapshot 中重新选择。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-024",
        "responsibility": "agent",
        "goal": "Resolve review finding: 生产普通 Setup readiness 与 Codex post-operation readiness 存在锁顺序环：`SkillProvisioningManager.check()` 持有 Skill 串行队列并通过 `codexProbe` 等待 `CodexSetupManager.check()`；活动 Codex mutation 同时持有 Codex 队列，并在 `recheckReadiness` 中等待另一个 Skill check。直接生产-manager 探针在释放 installer 后仍超时，状态停留于 Codex `rechecking-readiness` 与 Skill `checking`，因此手动检查或其它并发检查可能永久不返回。应由单一协调层确定调用顺序，消除 manager 间双向等待，并增加真实并发回归。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:25"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/desktop/main.mjs: Skill codexProbe awaits codexSetupManager.check while Codex recheckReadiness calls skillProvisioningManager.check",
          "runtime/arcorbit/src/codex-setup-manager.mjs: mutation and check share the Codex operation queue",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs: check holds its runExclusive queue across codexProbe",
          "Direct production-manager lock-order probe: after installer release, Promise.race timed out at 500ms with {codex_status:'checking',codex_operation:'rechecking-readiness',skill_status:'checking'}",
          "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite the reproduced deadlock"
        ]
      },
      "planned_transition": {
        "goal": "由单一 Desktop 协调层规定 Codex→Skill 调用顺序，移除 Skill→Codex 队列反向等待，并以真实双 manager 并发回归证明普通 readiness 与 post-operation readiness 均可完成。",
        "expected_state_change": "FINDING-024 被解决；生产普通检查与 Skill fallback 不再形成双向 manager 等待，FINDING-025 继续开放。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-024",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "新增 Desktop Setup 协调入口，普通 readiness 先完成 CodexSetupManager fresh check，再把同轮 probe 证据显式传给 SkillProvisioningManager。生产 Skill fallback 只读取 CodexSetupManager 当前 authoritative snapshot，不再等待其操作队列；post-operation 路径继续传递 mutation inspection 的 raw probe。真实双 manager 回归证明活动 install 与并发普通 readiness 均在超时界限内完成，Codex operation 清空且 Skill 状态 ready。",
          "evidence": [
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: lock-order regression completed both active install and concurrent ordinary readiness without timeout",
            "Verification: focused Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 92 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 105 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 486 accounted for; 472 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
            "Verification: syntax checks and git diff --check passed; no ARC_DEBUG or temporary console markers found"
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
          "CASE-20260825-010:review-finding:FINDING-20260825-010-024"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮不改变安装、认证、恢复或 ready 条件的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness 的活动操作、顺序检查、失败反馈与恢复语义仍由 durable interaction artifact 明确定义；本轮消除了会阻止该流程继续的锁序环。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮事实与修复不建立、修改或冲突任何视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Desktop 协调层现在明确拥有跨 manager 调用顺序；CodexSetupManager 继续拥有 executable/version/auth inspection，SkillProvisioningManager 只消费显式或当前权威证据，符合 durable ownership contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "FINDING-024 的锁序缺陷已修复，但 fresh Case state 仍包含 FINDING-025：活动 mutation 期间的 assertReady 可能覆盖 operation projection，因此完整接受事实尚未全部稳定实现。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "Direct production-manager preflight probe recorded in CASE-20260825-010 content revision 25"
            ],
            "gap_refs": [
              "CASE-20260825-010:review-finding:FINDING-20260825-010-025"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "锁序风险由真实双 manager 并发回归直接覆盖；跨层、真实 Electron 和完整 inventory 提供了与修复风险相称的可重复证据，剩余 FINDING-025 也已有直接复现证据。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 105 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory — 472 passed, 12 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: focused cross-layer suites — 105 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 486 accounted for; 472 passed, 12 gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks and git diff --check passed; temporary diagnostic-marker scan found no matches"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:33:35.603Z"
    },
    {
      "round": 40,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 Codex preflight 进入与 check、mutation 相同的串行 operation authority，并以活动安装与并发 preflight 回归证明 operation projection 在操作完成前保持完整。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 CASE-20260825-010 的 fresh case-scoped selection token 比较全部 persisted candidates。FINDING-025 是当前 Case 唯一 ready Gap，直接威胁活动操作可见性与取消入口；四个 Project Gap 均需独立 Case，因此选择 FINDING-025。",
        "snapshot_token": "a75477ad87f44328130c9090f1f9d20251f5f140cfdfbd8c833e6d9783045e27",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-025",
        "comparison_summary": "选择唯一 ready 的 FINDING-025；Project Gap 因需要独立 Case 而延后。",
        "fresh_discovery_summary": "本轮执行前未发现需要加入比较的新 fresh candidate；实现和验证没有显露改变本轮主张边界的新工作。",
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
            "reason": "需要独立 Case 验证动态 Gap 选择场景，不属于当前 Codex Setup operation-authority 修复。"
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
            "reason": "属于独立 Runtime resilience/adapters 事项，当前 Case 不覆盖。"
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
            "reason": "需要真实 permission-bearing 项目与独立 Case。"
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
            "reason": "虽具有高 urgency，但需独立 Case，不能扩展当前 Setup Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:review-finding:FINDING-20260825-010-025",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是当前 Case 唯一 ready Gap；并发 preflight 会覆盖活动 operation projection，使 Renderer 丢失操作状态和取消入口。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-025",
        "responsibility": "agent",
        "goal": "Resolve review finding: `CodexSetupManager.assertReady()` 直接调用 `inspect({announce:false})`，没有进入 manager 的串行队列，也未拒绝活动 mutation。Chat 或 Automation preflight 与安装并发时，inspection 会发布并保存新的非操作 snapshot，从而把仍在运行且可取消的 `{installing, operation_id}` 覆盖成 `operation=null`；Renderer 会失去活动状态与取消入口，而后台 installer 仍继续运行。应让 preflight 遵守同一 operation authority，在活动 mutation 时稳定 fail closed 或串行等待，并增加并发 preflight/operation 投影回归。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:25"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs: assertReady calls inspect directly while check uses runExclusive",
          "runtime/arcorbit/desktop/main.mjs: both Chat and Automation preflight invoke codexSetupManager.assertReady",
          "Direct production-manager probe before preflight: {status:'installing',operation_id:'present',cancellable:true}",
          "Direct production-manager probe after concurrent assertReady: {preflight_code:'CODEX_SETUP_NOT_READY',status:'missing',operation:null,error:null} while the installer remained active",
          "Verification: current Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 91 passed, 0 failed despite no active-operation/preflight concurrency assertion"
        ]
      },
      "planned_transition": {
        "goal": "让 Codex preflight 进入与 check、mutation 相同的串行 operation authority，并以活动安装与并发 preflight 回归证明 operation projection 在操作完成前保持完整。",
        "expected_state_change": "FINDING-025 被解决；Chat/Automation preflight 不再与活动 mutation 并发 inspection，也不会覆盖活动 operation id 或取消状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-010:review-finding:FINDING-20260825-010-025",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "`CodexSetupManager.assertReady()` 现在通过 `runExclusive` 排入与 mutation/check 相同的队列。活动 installer 和 post-operation recheck 完成前，preflight 保持 pending，不执行独立 inspection；因此 authoritative snapshot 持续保留活动 `{operation_id,cancellable}`。队列释放后，preflight 再执行 fresh inspection 并按最终 readiness 成功或 fail closed。新增生产 manager 并发回归直接证明活动 install 期间状态保持 `installing`、operation id 不变且可取消，install 完成后 preflight 才返回 ready。",
          "evidence": [
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "Verification: preflight waits for the active mutation without replacing its operation projection",
            "Verification: Codex Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 93 passed, 0 failed",
            "Verification: Resolver, Setup IPC, Setup Manager, Skill Provisioning Manager and Desktop Renderer suites — 106 passed, 0 failed",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
            "Verification: syntax, whitespace and temporary diagnostic-marker checks passed"
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
          "CASE-20260825-010:review-finding:FINDING-20260825-010-025"
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮不改变安装、认证、恢复或 ready 条件的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness 仍要求活动操作可见、可取消且完成后重新验证；preflight 现在等待 operation authority 释放，不再破坏这些交互状态。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮事实与修复不建立、修改或冲突任何视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "CodexSetupManager 的 check、mutation 与 preflight 现在共享单一串行 operation authority；Desktop Chat/Automation preflight 继续消费该 manager 的 authoritative evidence，符合 durable ownership contract。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "FINDING-024 与 FINDING-025 所暴露的两个并发偏差均已修复；普通 readiness、post-operation readiness 和 Chat/Automation preflight 现在共同实现接受的 Setup ownership、活动操作投影与恢复边界。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "活动 install/preflight 并发回归直接验证 operation projection 不被覆盖；跨层套件、真实 Electron 和完整 inventory 提供了与并发和状态所有权风险相称的可重复证据。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: focused cross-layer suites — 106 passed, 0 failed",
              "Verification: real Setup Electron matrix — 1 passed, 0 failed",
              "Verification: complete inventory — 473 passed, 12 gated skips, 2 sandbox-only failures rerun successfully outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "Verification: focused cross-layer suites — 106 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax, whitespace and temporary diagnostic-marker checks passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:38:56.654Z"
    },
    {
      "round": 41,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 27 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 case-scoped selection token 比较全部 persisted candidates。四个 Project Gap 均需另建 Case；当前 Case 唯一 ready 且具高阻塞、高风险、高用户影响的候选是 Completion Review 13。",
        "snapshot_token": "5387e86facaafd97f3175fb8b7a7b37f76d9a3a525568198f01a21f0038743fb",
        "selected_ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:13",
        "comparison_summary": "选择 Completion Review 13，对所有已关闭的普通 Gap 和 content revision 27 实施五维独立审查；四个 Project Gap 因需要独立 Case 而延期。",
        "fresh_discovery_summary": "代码、接线、并发时序、测试和工作树卫生检查未发现需要加入本轮比较的新 fresh Gap。",
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
            "reason": "需要独立 Case 执行隔离的真实软件场景评估，不属于当前 Codex Setup Case 的收束范围。"
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
            "reason": "Runtime resilience 与 adapter acceptance 需要独立 Case，不能替代当前 ready Completion Review。"
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
            "reason": "真实 permission-bearing project 验证需要独立受控 Case。"
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
            "reason": "跨记录审计虽具高风险和高紧迫性，但必须由独立 Case 承担。"
          },
          {
            "ref": "case-gap:CASE-20260825-010:CASE-20260825-010:completion-review:13",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 的普通 Gap 和 state impacts 已全部关闭；该候选是唯一 ready obligation，并直接门禁 Case 收束。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-010:completion-review:13",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:27"
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
        "goal": "独立审查 content revision 27 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 clean Completion Review；若 trusted Ledger 接受该命令，当前 Case 满足 resolved 条件。"
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
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: independent Completion Review core suites — 93 passed, 0 failed",
            "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed",
            "Verification: preflight remained pending during active install while the same operation id and cancellable projection remained authoritative",
            "Verification: ordinary readiness and post-operation readiness completed without a manager lock-order timeout",
            "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
            "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
            "Verification: syntax checks, git diff --check and temporary diagnostic-marker scan passed"
          ],
          "reviewed_content_revision": 27
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
        "project_revision": 263,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 未改变安装、认证、恢复或 ready 条件的产品含义；durable product specification 仍完整保存接受结果。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "活动操作可见、可取消和完成后重新验证的语义保持可恢复；并发 preflight 回归证明 operation projection 在操作完成前不会被覆盖。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 未发现或改变视觉主题、token、布局、组件样式或 presentation 规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "CodexSetupManager 持有 check、mutation 与 preflight 的单一串行 authority；Desktop 协调层规定 Codex→Skill 顺序，Skill 只消费显式或当前权威证据，职责与锁序均可由 durable technical contract 恢复。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立审查未发现 durable Setup contract 与生产实现之间的新偏差；FINDING-024 和 FINDING-025 的并发缺陷均由直接时序回归证明已闭合。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "并发 preflight、manager 锁序、跨层接线、真实 Electron 和完整 inventory 提供了可重复且与 Setup 状态所有权、安全和回归风险相称的证据。",
            "fact_refs": [
              "FACT-CODEX-SETUP-ACCEPTED-CONTRACT",
              "FACT-20260825-010-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: independent Completion Review core suites — 93 passed, 0 failed",
              "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed",
              "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
              "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: independent Completion Review core suites — 93 passed, 0 failed",
        "Verification: independent Completion Review cross-layer suites — 106 passed, 0 failed",
        "Verification: real Setup Electron production matrix outside GUI sandbox — 1 passed, 0 failed",
        "Verification: complete ArcOrbit inventory — 487 accounted for; 473 passed, 12 environment-gated skips, 2 GUI-sandbox failures rerun outside sandbox and passed 2/2",
        "Verification: syntax checks, git diff --check and temporary diagnostic-marker scan passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-000046026Z-b27121fc",
      "occurred_at": "2026-08-26T00:42:58.867Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DURABLE-CODEX-SETUP-CONTRACT",
      "GAP-20260825-010-001",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-001",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-002",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-003",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-004",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-005",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-006",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-007",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-008",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-009",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-010",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-011",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-012",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-013",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-014",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-015",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-016",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-017",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-018",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-019",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-020",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-021",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-022",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-023",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-024",
      "CASE-20260825-010:review-finding:FINDING-20260825-010-025"
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
    "updated_at": "2026-08-26T00:42:58.867Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
