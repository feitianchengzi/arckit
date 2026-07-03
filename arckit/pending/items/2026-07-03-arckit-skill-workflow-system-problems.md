# Arckit Skill 工作流系统问题

## 状态

- 状态: open
- 类型: workflow
- 来源: agent 对话
- 创建时间: 2026-07-03
- 更新时间: 2026-07-03
- 当前决策: 记录并拆解；不要一次性提升所有事项

## 背景

用户在实际试用当前 Arckit skills 时观察到：系统表现得像一组彼此孤立的单 skill 执行入口。一个描述 skill 使用反馈的 prompt，通常只会触发直接相关的 skill 维护流程，而不会围绕它组合出更完整的软件研发流程。

关键预期是：skill、prompt、workflow patch 或 `SKILL.md` 也是 AI 时代的软件产物。维护它们应该被视为软件研发活动，而不是狭义的文档编辑。用户的一句话可能同时包含需求、决策、架构信号、工作流纠偏、实现指令、验证需要和项目事实。

本 item 记录问题集合，便于后续逐项拆解、提升或修复。

## 未决事项

拆解并解决 Arckit skill 工作流系统问题，使多 skill、多阶段的软件研发流程能自然形成。

## 当前判断

当前系统已经包含许多正确概念：作为 runtime workflow compiler 的 `using-arckit`、workflow memory、artifact impact scan、Skill First 验证，以及 `arckit/` 下的结果文档域。问题在于这些概念还没有被稳定落实为可执行契约。

主要失败模式是：

1. 用户 prompt 明确提到目标 skill 或具体动作。
2. agent 直接跳到最明显的专门 skill。
3. 专门 skill 完成眼前的产物编辑。
4. prompt 中更广泛的信号没有被路由到 `arckit/spec`、`arckit/tech`、项目治理、pending context、验证或 workflow memory。

## 问题拆解

| ID | 问题 | 分析 | 建议优化 | 候选落点 |
|---|---|---|---|---|
| P01 | 入口编排被绕过。 | 明确的 skill 名称或具体动作词会导致 agent 直接执行专门 skill。 | 将 `using-arckit` 设为软件协作任务的强制前置门禁。 | `entry/skills/using-arckit/` |
| P02 | Skill 维护被当成文件编辑。 | `SKILL.md` 和 prompt 变更没有被视为实现产物。 | 将 skill、prompt、workflow patch、metadata、eval 定义为软件实现产物。 | `arckit/spec/arckit-skill-system.md` |
| P03 | 最终目标和当前阶段混在一起。 | “更新一个 skill” 可能隐藏需求分析、决策或 workflow 纠偏需要。 | 专门 skill 执行前必须明确 `final_goal`、`current_phase`、`missing_piece` 和 `phase_reason`。 | `using-arckit` |
| P04 | 多 skill 组合是软约束。 | skill 提到 handoff，但 handoff 没有作为输出契约强制执行。 | 为相关 skill 增加强制 `artifact_handoff`、`next_capabilities` 和 `why_not_selected` 输出。 | Skill 契约 |
| P05 | Artifact impact scan 发生太晚。 | 到最终响应时，agent 已经把任务框定为完成。 | 读完上下文后先做初始 artifact impact scan，最终响应前再复扫。 | `using-arckit` |
| P06 | Artifact impact scan 太容易被跳过。 | 小任务、类似代码的任务或 skill 编辑会被视为没有项目事实影响。 | 所有 Arckit 任务使用同一组 scan targets；任务大小不能决定 skipped 状态。 | workflow memory + `using-arckit` |
| P07 | Workflow memory 有候选但没有 accepted 规则。 | 已有学习信号不能可靠改变未来 workflow frame。 | 审查成熟 candidates，并将确认的项目级 workflow patches 提升为 accepted。 | `~/.arckit/workflows` |
| P08 | 专门 skill description 与入口路由竞争。 | 强 description 会让专门 skill 在组合前抢占任务。 | 专门 skill description 只定义能力，入口统一决定组合。 | Skill authoring rules |
| P09 | `arcforge-skill-creator` 边界过窄。 | 它维护目标 skill 文件和 post-handoff，但不强制项目事实路由。 | 要求检测 spec、tech、governance、pending、verification 和 workflow-memory 影响。 | `arcforge-skill-creator` |
| P10 | Skill First 验证目标行为，不验证完整 workflow 覆盖。 | 目标 skill 可以通过验证，但上下游 Arckit 文档仍被遗漏。 | 增加验证用例：skill 反馈必须同时更新或路由项目 artifacts。 | `arcforge-skill-first` |
| P11 | Prompt 没有像代码一样治理。 | Prompt 变更缺少设计、审查、验证、回归和发布语义。 | 将 prompt/skill 变更视为代码级变更，包含 source、tests、validation 和 lifecycle。 | `arckit/tech` |
| P12 | 过程型 skill 输出没有被稳定接收。 | decision、architecture、draft、domain handoff 可能只停留在回答里。 | 主 workflow 必须对每个过程 handoff 选择 accept、pending、promote 或 reject。 | `using-arckit` |
| P13 | 项目事实会丢失。 | 维护 prompt 中的稳定决策可能没有写入 `arckit/`。 | 如果 prompt 改变稳定行为或架构，必须路由到结果型 skill。 | `arckit/spec`, `arckit/tech` |
| P14 | Workflow 纠偏捕获不足。 | 用户关于“以后应该怎么做”的反馈可能只影响当前编辑。 | 除非明确一次性，否则 workflow-level correction 应成为 signal 或 candidate。 | `arckit-workflow-memory` |
| P15 | 动态 workflow 组合缺少硬决策模型。 | 入口 skill 说要动态组合，但缺少紧凑可执行的决策表。 | 按缺口增加能力选择规则：证据、定义、决策、实现、验证、治理、记忆。 | `using-arckit/references/routing-notes.md` |
| P16 | Runtime compiler 冗长但约束力不足。 | 许多规则描述理想，但 agent 仍可在完成眼前任务后收尾。 | 将关键规则转成必经检查点和停止条件。 | `using-arckit` |
| P17 | 缺少用户 prompt 拆解。 | 一条用户消息可能同时包含即时任务、稳定事实、workflow 纠偏和治理信号。 | 在 skill 选择前增加 prompt-signal decomposition 步骤。 | `using-arckit` |
| P18 | `arckit/` 结果域没有被稳定考虑。 | Skill 工作常被限定在源文件，而不是项目知识表面。 | 将 `arckit/spec`、`tech`、`interaction`、`visual`、`pending` 和 governance 设为显式 artifact targets。 | `using-arckit` |
| P19 | 确认规则不清晰。 | agent 可能因为边界模糊而避免写事实，或过度写入事实。 | 为稳定事实、候选事实、workflow memory 和 accepted patches 定义确认规则。 | `workflow-orchestration-memory` spec |
| P20 | Governance 没有连接 skill 维护。 | Skill 系统变化可能影响 roadmap、tasks、验证策略或发布策略。 | 当广义 skill-system 变化影响执行方向时，路由到项目治理。 | `arckit-project-governance-workflow` |
| P21 | 任务拆解路径较弱。 | 用户可能只需要拆解和分发，但 agent 会跳向实现。 | 识别 planning/dispatch-only 当前阶段，目标满足时在 handoff 后停止。 | `using-arckit` + governance |
| P22 | 验证过于局部。 | 检查已编辑文件不能验证预期 workflow 组合是否发生。 | 增加 workflow-level verification：已选 skill、跳过 skill、artifact routing 和 closeout。 | `arckit-verify-implementation` 或 Skill First |
| P23 | Accepted workflow 提升不是正常 closeout 的一部分。 | 重复纠偏停留在 candidates，没有面向用户的提升决策。 | 增加定期 candidate review 和显式 promotion/deprecation 步骤。 | `arckit-workflow-memory` |
| P24 | 入口 skill 避免固定流程，但缺少 patch 组合清晰度。 | “不要 hardcode” 可能退化成临场路由。 | 用 workflow patches 修改 frame 字段，而不是固定 A-to-B-to-C 脚本。 | workflow memory schema |
| P25 | 结果记忆和过程记忆混在对话里。 | 最终回答可能提到洞察，但没有写入任何 durable surface。 | 每次 closeout 必须说明哪些洞察进入结果文档、pending、workflow memory，或因何不写。 | `using-arckit` |
| P26 | 当前源码和已安装 skill 副本可能分叉。 | agent 可能读取已安装副本，而不是当前仓库源码。 | 保留并验证 Arckit 源仓库工作的 source-path preference。 | `using-arckit` + Skill First tests |
| P27 | Skill artifacts 缺少统一生命周期。 | 创建、维护、验证、同步、发布被拆开，但没有建模成一个生命周期。 | 定义从 intake 到 accepted workflow/source sync 的 skill artifact lifecycle。 | `arckit/spec` 或 `arckit/tech` |
| P28 | 一行 skill 修复隐藏架构决策。 | 具体 skill 规则可能体现架构政策。 | 在目标 skill 编辑前或同时提取 architecture decisions。 | `arckit-architecture-decision` -> `arckit-tech` |
| P29 | Pending context 使用不足。 | 未确认分析要么丢失，要么过早写成事实。 | 用 promotion rules 将未解决分析保存为 pending。 | `arckit/pending` |
| P30 | 系统缺少编排回归 fixture。 | 测试主要验证单个 skill 或文件结构，不验证多阶段路由。 | 增加多信号 prompt 和预期 artifact impact coverage 的 Skill First 场景。 | `arcforge-skill-first` |

## 后续拆解用示例场景

用户说：

> 我实际试用了一个 skill，它的 workflow 里有很多不应该出现的步骤。skill 内容不够硬也不够具体。我的预期是这个 skill 只处理分支规范和 tag 规范，优先根据用户 prompt 推荐配置，确认后直接操作。如果需要发布版本，就只通过 push 到远程仓库来触发 Xcode Cloud workflow。

预期 workflow：

1. 识别这是 skill 维护任务，同时也是 Arckit workflow-system correction。
2. 将 prompt 拆成目标 skill 规则、项目级 skill-system 事实、workflow 纠偏，以及可能的 release/governance 影响。
3. 使用 `arcforge-skill-creator` 修改目标 skill。
4. 对持久 skill-system 规则或 release-trigger 架构决策，考虑 `arckit-spec` 或 `arckit-tech`。
5. 使用 `arckit-workflow-memory` 记录“skill 维护不能跳过 artifact impact scan”的可复用纠偏。
6. 当信号尚不足以成为结果事实时，使用 `arckit-pending` 暂存。

## 建议拆解顺序

1. 定义 skill、prompt、workflow artifact 的生命周期模型。
2. 收紧 `using-arckit` 的 prompt-signal decomposition 和 runtime compiler 检查点。
3. 收紧 `arcforge-skill-creator` 的 handoff 和 artifact impact 职责。
4. 为多阶段 skill 维护 prompt 增加 Skill First 验证场景。
5. 审查 workflow memory candidates，决定哪些提升为 accepted project-level workflow patches。
6. 将本 pending item 中已确认的持久结论提升到 `arckit/spec` 和 `arckit/tech`。

## 重访条件

- 准备将这些问题拆成具体实现任务时。
- 更新 `using-arckit`、`arcforge-skill-creator` 或 `arcforge-skill-first` 时。
- 审查 workflow memory candidates 并决定是否提升为 accepted 时。
- 未来 agent 再次把 skill 维护当成单 skill 文件编辑处理时。

## 相关区域

- `entry/skills/using-arckit/`
- `memory/skills/arckit-workflow-memory/`
- `memory/skills/arckit-pending/`
- `arckit/spec/arckit-skill-system.md`
- `arckit/spec/workflow-orchestration-memory.md`
- `arckit/tech/workflow-orchestration-memory/solution.md`
- `arcforge-skill-creator`
- `arcforge-skill-first`

## 备注

- 不要一次性提升所有事项。每个问题都需要独立证据、目标 artifact 和验收决策。
- 本 pending item 是拆解控制文档，不是所有结论的最终 source of truth。

## 结果

尚未提升。
