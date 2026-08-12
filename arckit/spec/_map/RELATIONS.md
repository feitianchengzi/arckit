# Spec Relations

## Agent 软件研发操作层

阅读顺序是 `problem-background.md`、`solution-principles.md`、`product-concepts.md`、`product-architecture.md`、`skill-architecture.md`、`controller-worker-loop.md`。`loop-engineering-research.md` 是研究输入，按需在修订 loop、runtime 或外部 adapter 相关规格前读取。

`agentic-software-development/problem-background.md` 定义 Agent 软件研发操作层要解决的根问题，是本模块的决策起点。

`agentic-software-development/solution-principles.md` 基于问题背景推导解决原则，是从问题到产品概念的过渡层。

`agentic-software-development/product-concepts.md` 基于解决思路定义产品概念，是产品架构的概念词典；其中 Project State 是最高层产品对象，Case 保存事项事实与动态 Gap，software invariants 持续指导显式判断发现，一个 Round 只完成一个 Case Gap，Desktop Runtime、Codex 类 Agent 和 Skill 是分层协作机制。

`agentic-software-development/product-architecture.md` 描述产品概念如何组合成系统整体，避免混入具体实现细节；主轴是 Project State 通过多个可并行 Case Loops 持续推进、通过串行 canonical commit 聚合，并定义 Desktop Runtime、Codex 类 Agent 和 Skill 的产品职责边界。

`agentic-software-development/skill-architecture.md` 基于产品架构从 skill 角度定义 Arckit 预期如何实现。

`agentic-software-development/controller-worker-loop.md` 定义人类直接使用 Codex 与 Desktop Runtime 如何复用同一连贯 Agent Loop，并规定 invariant-guided 候选发现、单 acceptance claim Gap、trusted snapshot、round closeout、post-commit fresh-read 和 ledger 写回门禁。

`agentic-software-development/runtime-automation-workspace.md` 定义 Desktop 如何以任务服务器项目和待办驱动 Runtime loop，是 `controller-worker-loop.md` 在用户任务来源、串行调度、按需人工介入与异常恢复上的产品表面约束；对应交互事实位于 `arckit/interaction/automation-workspace/` 和 `arckit/interaction/task-browser/`。

`agentic-software-development/loop-engineering-research.md` 保存吴恩达三层 loop 与 2026 loop engineering 架构调研结果，是候选输入，不直接作为已确认产品需求。
