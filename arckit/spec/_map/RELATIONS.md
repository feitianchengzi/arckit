# Spec Relations

## Agent 软件研发操作层

阅读顺序是 `problem-background.md`、`solution-principles.md`、`product-concepts.md`、`product-architecture.md`、`skill-architecture.md`、`controller-worker-loop.md`。`loop-engineering-research.md` 是研究输入，按需在修订 loop、runtime、workflow memory 或外部 adapter 相关规格前读取。

`agentic-software-development/problem-background.md` 定义 Agent 软件研发操作层要解决的根问题，是本模块的决策起点。

`agentic-software-development/solution-principles.md` 基于问题背景推导解决原则，是从问题到产品概念的过渡层。

`agentic-software-development/product-concepts.md` 基于解决思路定义产品概念，是产品架构的概念词典；其中 Project State 是最高层产品对象，Case 和 Loop 服务于 Project State 的持续推进，Desktop Runtime、Codex 类 Agent 和 Skill 是分层协作机制。

`agentic-software-development/product-architecture.md` 描述产品概念如何组合成系统整体，避免混入具体实现细节；主轴是 Project State 通过 Case 和 Loop 被持续推进，并定义 Desktop Runtime、Codex 类 Agent 和 Skill 的产品职责边界。

`agentic-software-development/skill-architecture.md` 基于产品架构从 skill 角度定义 Arckit 预期如何实现。

`agentic-software-development/controller-worker-loop.md` 定义人类 Runtime、Controller Agent、Worker Agent 和 Desktop Runtime 如何围绕同一轮软件研发任务协作，并规定 Desktop 恢复控制态和 ledger 写回门禁。

`agentic-software-development/loop-engineering-research.md` 保存吴恩达三层 loop 与 2026 loop engineering 架构调研结果，是候选输入，不直接作为已确认产品需求。
