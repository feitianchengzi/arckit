# Tech Relations

## Runtime

`arcorbit/solution.md` 定义 Runtime Kernel 与 Automation Supervisor 的运行期职责。

`arcorbit/installer-supply-chain.md` 定义安装包构建、受信资源打包、ArcForge embedded provider、Product Workspace 项目 targets、用户级 managed 迁移和 Desktop Setup Readiness；它在 task start 前向 `arcorbit/solution.md` 提供当前关联项目已满足的运行前提。

`arcorbit/state-condition-ledger-solution.md` 定义安装包中 trusted ledger resources 的语义契约。安装供应链只校验、定位和打包这些资源，不复制其写回逻辑。

`arcorbit/desktop-execution-solution.md` 定义安装完成后的 Desktop session 与执行模型。Setup Readiness 是其前置 gate，不进入 task session、Case Loop 或 execution lease。

`arcorbit/platform-composition-solution.md` 定义 Workshop 组织/项目/成员/待办/普通反馈与 ArcOrbit 本地 Product Workspace、独立 Organization Center、多产品 workset 和既有 Automation execution plane 的组合边界；它只消费 `arcorbit/desktop-execution-solution.md` 的公开投影和命令，不改变 Runtime Kernel。

`arcorbit/realtime-synchronization-solution.md` 定义 Workshop 持久项目事件、PostgreSQL 提交后跨实例分发、项目 WebSocket 与补取接口，以及 ArcOrbit Realtime Adapter、项目级刷新、降级对账和人工 Gate 隔离。它扩展 `arcorbit/solution.md` 的 Task Source Adapter 和 Automation Coordinator，但不进入 Runtime Kernel。

`arcorbit/product-feedback-integration.md` 定义 ArcOrbit 自身产品反馈中心的 Feedback SDK WebView V2、Electron WebContents、内置静态项目凭据、Workshop current-user 身份和有界 IPC。它与 `arcorbit/platform-composition-solution.md` 的 Workshop Feedback V1/V2 管理能力、`arcorbit/desktop-execution-solution.md` 的验收问题队列相互独立，并复用 `arcorbit/solution.md` 的主进程认证边界。

## Product Mapping

`arckit/spec/arcorbit-distribution.md` 对应 `arcorbit/installer-supply-chain.md`，定义人工出包、安装、修复、升级和失败恢复的产品行为。

`arckit/spec/agentic-software-development/runtime-automation-workspace.md` 对应 `arcorbit/solution.md`、`arcorbit/desktop-execution-solution.md` 与 `arcorbit/realtime-synchronization-solution.md`，定义 task-driven Runtime 工作区、实时任务发现、降级恢复和人工 Gate 行为。

`arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 对应 `arcorbit/platform-composition-solution.md`，定义多产品平台能力、Workshop 事实边界、团队/待办/反馈行为与受保护核心。

`arckit/spec/agentic-software-development/arcorbit-work-management.md` 对应 `arcorbit/platform-composition-solution.md` 的 Work Task 查询、任务树、父子关系、评论附件、受限 mutation 和缓存刷新契约，并由 `arckit/interaction/task-browser/` 投影为同屏日常待办页面。

同一产品规格中的 ArcOrbit 产品反馈中心对应 `arcorbit/product-feedback-integration.md` 与 `arckit/interaction/product-feedback-center/`，不对应 Workset Feedback 管理或验收问题执行。

`arckit/spec/agentic-software-development/arcorbit-organization-management.md` 对应同一平台组合方案中的组织治理、分页、项目归属、成员关系与邀请加入契约。
