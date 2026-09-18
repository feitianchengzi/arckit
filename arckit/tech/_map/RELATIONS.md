# Tech Relations

## Runtime

`arcorbit/solution.md` 定义 Runtime Kernel 与 Automation Supervisor 的运行期职责。

`arcorbit/installer-supply-chain.md` 定义安装包构建、受信资源打包、ArcForge embedded provider、CodexSetupManager 的官方 standalone installer/认证/typed IPC、Product Workspace 项目 targets、用户级 managed 迁移和 Desktop Setup Readiness；它在 Chat 或 task start 前向 `arcorbit/solution.md` 提供已验证的 Codex executable、独立认证状态和当前关联项目运行前提。

`arcorbit/state-condition-ledger-solution.md` 定义安装包中 trusted ledger resources 的语义契约。安装供应链只校验、定位和打包这些资源，不复制其写回逻辑。

该方案同时承接 `arckit/spec/agentic-software-development/product-concepts.md` 的通用 Loop/场景 State、事实与实现载体概念，以及 `controller-worker-loop.md` 的 Gap 资格、探索采纳、粒度与局部依赖规则；规定选择语义在现有状态与 transition 中的承载、完整 invariant assessment 和 Agent/Ledger/Runtime 校验边界。Runtime 消费可信结果，不按场景、文件或工具重新推断业务选择。

`arcorbit/desktop-execution-solution.md` 定义安装完成后的自由 Chat、Automation Desktop session、共享 Codex Conversation 层，以及消费 `arckit/spec/arcorbit-distribution.md` 的 Chat/Automation 独立 Model/Level、旧配置迁移、清单查询、Chat 会话选择与 turn/Run 固定契约；交互投影分别位于 `arckit/interaction/chat-workspace/` 和 `arckit/interaction/automation-workspace/authentication.html`。Setup Readiness 是两类 session 的项目级前置 gate，不进入 Chat transcript、task session、Case Loop 或 execution lease。

`arcorbit/platform-composition-solution.md` 定义 Workshop 组织/项目/成员/待办/普通反馈与 ArcOrbit 本地 Product Workspace、独立 Organization Center、多产品 workset 和既有 Automation execution plane 的组合边界；它只消费 `arcorbit/desktop-execution-solution.md` 的公开投影和命令，不改变 Runtime Kernel。

`arcorbit/realtime-synchronization-solution.md` 定义 Workshop 持久项目事件、PostgreSQL 提交后跨实例分发、项目 WebSocket 与补取接口，以及 Work-owned Realtime Adapter、本地 Task Projection Store、项目对账和人工 Gate 隔离。它把 `arcorbit/solution.md` 的 Task Source Adapter 收敛为 Work Sync 独占边界，Automation 只消费本地状态，不进入 Runtime Kernel。

`arcorbit/product-feedback-integration.md` 定义 ArcOrbit 自身产品反馈中心的 Feedback SDK WebView V2、Electron WebContents、内置静态项目凭据、Workshop current-user 身份和有界 IPC。它与 `arcorbit/platform-composition-solution.md` 的 Workshop Feedback V1/V2 管理能力、`arcorbit/desktop-execution-solution.md` 的验收问题队列相互独立，并复用 `arcorbit/solution.md` 的主进程认证边界。

## Product Mapping

`repository-governance/monorepo-solution.md` 定义 Arckit、ArcOrbit、Workshop Todo 与 Workshop Feedback 的源码共置、目录许可、历史导入和私有运维隔离边界；所有公开 app、service、package 与发布物遵守该仓库级方案，`arckit-ops` 只通过公开配置契约参与部署。

`arckit/spec/arcorbit-distribution.md` 对应 `arcorbit/installer-supply-chain.md`，定义人工出包、安装、修复、升级和失败恢复的产品行为。

`arckit/spec/agentic-software-development/runtime-automation-workspace.md` 对应 `arcorbit/solution.md`、`arcorbit/desktop-execution-solution.md` 与 `arcorbit/realtime-synchronization-solution.md`，定义 task-driven Runtime 工作区、基于 Work 本地投影的任务发现、降级恢复和人工 Gate 行为。

`arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 对应 `arcorbit/platform-composition-solution.md`，定义多产品平台能力、Workshop 事实边界、团队/待办/反馈行为与受保护核心。

`arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md` 中的真实 Chat 对应 `arcorbit/desktop-execution-solution.md` 与 `arckit/interaction/chat-workspace/`，复用 Codex transport 与中性消息投影，但不复用 state-driven Runtime、Automation lease、Case 或 ledger；Operations 保持计划展示，Engineering 使用 `scene-skills-solution.md` 提供真实内置 Skills 安装后管理；Release 的真实本地能力使用独立 Release 规格和方案。

`arckit/spec/agentic-software-development/arcorbit-work-management.md` 对应 `arcorbit/platform-composition-solution.md` 与 `arcorbit/realtime-synchronization-solution.md` 的本地 Work Task 投影、任务树、父子关系、评论附件、受限 mutation 和 Work-owned 同步契约，并由 `arckit/interaction/task-browser/` 投影为同屏日常待办页面。

同一产品规格中的 ArcOrbit 产品反馈中心对应 `arcorbit/product-feedback-integration.md` 与 `arckit/interaction/product-feedback-center/`，不对应 Workset Feedback 管理或验收问题执行。

`arckit/spec/agentic-software-development/arcorbit-organization-management.md` 对应同一平台组合方案中的组织治理、分页、项目归属、成员关系与邀请加入契约。

Product 管理以 `arckit/spec/agentic-software-development/arcorbit-product-management.md` 为产品源，技术协议在 `arckit/tech/arcorbit/product-management-solution.md`；页面为 `product-list` → `product-detail`、`idea-workspace` → `idea-add`，Today 通过 `today-workspace/product-continuity.html` 续接原对象。原 Lifecycle 页面保持独立。

Release 本地交付工作台：产品源为 arckit/spec/agentic-software-development/arcorbit-release-workspace.md，技术源为 arckit/tech/arcorbit/release-workspace-solution.md，页面源为 arckit/interaction/release-workspace/interaction.md。复用已有项目绑定与 Chat/Idea 基础层。


Engineering 内置 Skills 管理以 arcorbit-scene-skills.md 为产品源，scene-skills-solution.md 为技术源，engineering-profile/ 为交互投影。可信 inventory 与 mutation 只覆盖 ArcOrbit 随包 Skills，Codex 用户/项目 Skills 保持原生所有权。

`arcorbit/project-workbench-solution.md` 对应 `arckit/spec/agentic-software-development/arcorbit-project-workbench.md` 与 `arckit/interaction/project-workbench/`，生产实现位于 `runtime/arcorbit/src/workbench/` 和独立 project-workbench renderer 模块。

无标题栏主窗口：interaction/CONVENTIONS.md、visual/_library/brief.md 及 AppShell、tech/arcorbit/solution.md 共同定义独立窗口控件、局部避让和底部设置同步时间戳。生产无标题栏与底部同步投影已更新；实现及验证范围见 arckit/cases/evidence/CASE-20260917-003/implementation-verification.json，Windows/Linux 原生执行与 macOS 原生悬停面板未人工验证。历史页面线框中的标题栏不作为当前窗口外壳验收依据。
