# Spec Relations

## 许可与商业使用

`licensing-and-commercial-use.md` 定义仓库各组件对外使用、修改、分发、竞争性产品、商业授权、商标和许可证随包交付的稳定规则。它约束 `arckit-skill-system.md` 的独立 skill 分发和 `arcorbit-distribution.md` 的安装包内容；实际许可证文本位于仓库根 `LICENSE` 与 `runtime/arcorbit/LICENSE`，公开范围摘要位于根 `LICENSING.md`。

## Runtime 分发与安装

`arcorbit-distribution.md` 定义用户从人工选择的 GitHub 安装包进入全局资源检查、Product Workspace 项目级 skills provisioning、旧用户级 managed target 迁移、修复、升级和清理的产品行为。它依赖 `agentic-software-development/skill-architecture.md` 的 Agent 原生 skill 边界和 `arcorbit-platform-capabilities.md` 的本地项目绑定，并在 Runtime task 启动前衔接 `agentic-software-development/runtime-automation-workspace.md`。

对应技术事实位于 `arckit/tech/arcorbit/installer-supply-chain.md`；Runtime 持续执行语义仍由 `arckit/tech/arcorbit/solution.md` 定义。

## Agent 软件研发操作层

阅读顺序是 `problem-background.md`、`solution-principles.md`、`product-concepts.md`、`product-architecture.md`、`skill-architecture.md`、`controller-worker-loop.md`。`loop-engineering-research.md` 是研究输入，按需在修订 loop、runtime 或外部 adapter 相关规格前读取。

`agentic-software-development/problem-background.md` 定义 Agent 软件研发操作层要解决的根问题，是本模块的决策起点。

`agentic-software-development/solution-principles.md` 基于问题背景推导解决原则，是从问题到产品概念的过渡层。

`agentic-software-development/product-concepts.md` 基于解决思路定义产品概念，是产品架构的概念词典；其中 Project State 是最高层产品对象，Case 保存事项事实与动态 Gap，software invariants 持续指导显式判断发现，一个 Round 只完成一个 Case Gap，Desktop Runtime、Codex 类 Agent 和 Skill 是分层协作机制。

`agentic-software-development/product-architecture.md` 描述产品概念如何组合成系统整体，避免混入具体实现细节；主轴是 Project State 通过多个可并行 Case Loops 持续推进、通过串行 canonical commit 聚合，并定义 Desktop Runtime、Codex 类 Agent 和 Skill 的产品职责边界。

`agentic-software-development/skill-architecture.md` 基于产品架构从 skill 角度定义 Arckit 预期如何实现。

`agentic-software-development/controller-worker-loop.md` 定义人类直接使用 Codex 与 Desktop Runtime 如何复用同一连贯 Agent Loop，并规定 invariant-guided 候选发现、单 acceptance claim Gap、trusted snapshot、round closeout、post-commit fresh-read 和 ledger 写回门禁。

`agentic-software-development/runtime-automation-workspace.md` 定义 Desktop 如何以 Work Sync 发布的本地待办状态驱动 Runtime loop，是 `controller-worker-loop.md` 在本地任务输入、串行调度、按需人工介入与异常恢复上的产品表面约束；Workshop 实时连接、REST 对账和 mutation 属于 Work。对应交互事实位于 `arckit/interaction/automation-workspace/` 和 `arckit/interaction/task-browser/`，可靠事件与恢复技术契约位于 `arckit/tech/arcorbit/realtime-synchronization-solution.md`。

`agentic-software-development/arcorbit-platform-capabilities.md` 在 `runtime-automation-workspace.md` 的自动执行核心外，定义 ArcOrbit 如何接入 Workshop 的组织、Project、成员、完整待办和用户反馈能力，并用 Desktop 本地 Product Workspace 与多产品工作集形成平台入口。它还定义与 Workset Feedback、验收问题相互独立的 ArcOrbit 产品反馈中心；对应交互事实位于 `arckit/interaction/product-feedback-center/`，技术边界位于 `arckit/tech/arcorbit/product-feedback-integration.md`。它保留 `product-architecture.md`、`controller-worker-loop.md` 和 `runtime-automation-workspace.md` 的单活动执行、持久 thread、trusted ledger、人工介入与恢复边界，不把服务端协作数据复制为第二个本地真相源。

`agentic-software-development/arcorbit-work-management.md` 从平台能力规格拆出 Work 的完整日常待办边界，定义本地 Task Projection 查询、Work-owned WebSocket/REST/mutation、父子任务树、详情与评论附件、字段维护、受控状态动作和替代 Todo 网页端的验收口径。它消费 `arcorbit-platform-capabilities.md` 的 Product Workspace 与顶部产品范围，并向 `runtime-automation-workspace.md` 的 Automation 发布本地任务状态；对应页面事实位于 `arckit/interaction/task-browser/`，技术方案位于 `arckit/tech/arcorbit/platform-composition-solution.md` 与 `realtime-synchronization-solution.md`。

`agentic-software-development/arcorbit-planned-workspaces.md` 定义绑定本地 Product Workspace 的真实 Codex Chat，以及 Idea、Release、Operations 和 Engineering 的团队计划展示面，并把主导航组织为 Personal、Product Lifecycle 和 Organization 三组。Chat 只持久化独立自由会话、消息与 thread binding，不调用 state-driven Runtime、ledger、Automation 或其他对象转换；对应技术边界位于 `arckit/tech/arcorbit/desktop-execution-solution.md`。Engineering 用 Profile Library、State Model、Capability Mapping、Lifecycle Mapping、变更预览和 Apply 确认表达可管理 Domain Profile，明确排除 entry skills；其余计划页面消费现有 Product Workspace、Task、Feedback、Run、ledger、代码/配置/测试/运行证据和 release workflow 事实，但不因此建立新的服务端、Profile persistence、发布、监控或市场平台合约。对应交互事实位于 `arckit/interaction/chat-workspace/`、`idea-workspace/`、`release-workspace/`、`operations-workspace/` 和 `engineering-profile/`。

`agentic-software-development/arcorbit-organization-management.md` 从平台能力规格拆出组织治理的稳定行为，定义 Organization Center 不受 Workset 裁剪、角色决定项目可见性、成员页只展示已有关系、项目上下文通用邀请与邀请码加入。对应交互事实位于 `arckit/interaction/platform-workspace/`，技术实现位于 `arckit/tech/arcorbit/platform-composition-solution.md`。

`agentic-software-development/loop-engineering-research.md` 保存吴恩达三层 loop 与 2026 loop engineering 架构调研结果，是候选输入，不直接作为已确认产品需求。
