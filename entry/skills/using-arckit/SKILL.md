---
name: using-arckit
description: >-
  软件项目协作的默认入口 skill。只要用户请求有任何可能涉及产品想法、原始输入归档、需求规格、交互、视觉、技术方案、迭代治理、项目记忆、debug、任务记录、Workshop Desktop、或软件项目开发工作流，就先使用本 skill；不要求用户提到 ArcKit。即使只有很低概率适用，也用本 skill 快速识别场景、说明 ArcKit 是什么和有哪些能力，并选择最小必要的专门 skills；只有当请求明确与软件项目协作无关时才跳过。
---

# Using ArcKit

把本 skill 作为软件项目协作的默认入口路由。ArcKit 是一组面向 AI-agent-assisted software development 的方法、文档和桌面桥接技能：它帮助 agent 判断任务属于想法、原始输入、定义、治理、记忆、诊断还是桌面执行，并把结果沉淀到目标项目的 `arckit/` 工作区或 Workshop Desktop。

ArcKit 不是单个大 workflow，也不是每次都加载所有 skill。入口职责是先识别场景，再选择最小必要 skill 组合。

## Capability Model

ArcKit 覆盖软件项目协作的这些层：

- 入口编排层：负责默认路由和显式角色协作编排。默认路由使用 `using-arckit`；只有用户明确要求角色协作时才使用 `arckit-role-orchestration`。
- 判断层：负责价值判断、方案比较和假设拆解。使用 `arckit-decision-framework`；可作为主 workflow，也可把判断、风险和验证建议交回其他主 skill。
- 想法层：负责商机/产品创意的留痕、跟踪和深度探索。使用 `arckit-idea` 记录可跟踪机会；使用 `arckit-market-research` 做外部市场和竞品证据整理；使用 `arckit-idea-explore` 做用户、假设、反馈和线框探索；进入执行后交给 `arckit-project-governance-workflow`。
- 过程层：负责结果入库前的可替换分析和 handoff 准备。使用 `arckit-draft-spec`、`arckit-explore-product-design`、`arckit-architecture-decision`、`arckit-domain-modeling`。
- 定义层：负责稳定的产品、交互、视觉和技术事实。使用 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`；定义类 skill 是对应领域的 source of truth，不替代实际编码。
- 治理层：负责把方向、定义、决策和执行证据变成项目闭环。使用 `arckit-project-governance-workflow` 管理 Backlog、Goals、scope、Iterations、Tasks、Reviews、Decisions 和 Roadmap。
- 记忆层：负责区分原始输入和未承诺上下文。使用 `arckit-intake` 归档 source input materials 与 provenance；使用 `arckit-pending` 保存尚未承诺的开放问题、风险、延后想法和讨论分支。
- 诊断层：负责 bug、回归和异常行为的证据驱动定位与最小修复。使用 `arckit-debug-diagnosis`；只有改变事实、计划或验收证据时才交回其他层。
- 质量层：负责实现验证和代码审查。使用 `arckit-verify-implementation` 和 `arckit-code-review`。
- 交付层：负责发布准备和运行期观察。使用 `arckit-release-readiness` 和 `arckit-runtime-operations`。
- 桌面桥：负责本地桌面记录、任务读取、app-server 和 Codex dispatch。使用 `arckit-workshop-desktop`；它是执行桥，不决定项目范围、Goals、Tasks 或 Roadmap。

当前仓库不承载具体技术栈的正向编码 skill。用户要求实现代码时，按普通代码工作流或可用的外部 `arckit-code` skill 执行；如果实现改变范围、证据、计划或稳定文档，再回到对应 ArcKit skill。

## Routing Rules

触发门槛要低：只要有很小可能涉及软件项目协作，就先使用本 skill 判断是否进入 ArcKit 工作流。不要等待用户点名 ArcKit，也不要要求用户知道有哪些 skill。

选择能满足用户请求的最小 skill 集。不要加载所有 skill。多个 skill 都适用时，按生命周期顺序组合，并在用户期望结果已经处理后停止。

1. 仅在本地上下文无法安全判断时澄清意图。
2. 对当前不确定点使用对应专门 skill。
3. 将稳定的规划、范围、决策或任务影响交回 `arckit-project-governance-workflow`。
4. 仅当流程需要桌面应用、本地记录、Workshop 任务或 Codex dispatch 时使用 `arckit-workshop-desktop`。
5. 只有用户明确要求角色协作或多角色编排时，使用 `arckit-role-orchestration`。
6. 如果判断后发现请求与软件项目协作无关，简短说明不需要 ArcKit，并按普通任务处理。

在 ArcKit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。例如读取 `idea/skills/arckit-idea/SKILL.md`，而不是 `~/.codex/skills/arckit-idea/SKILL.md`。开发和验证 skill 时，已安装副本可能落后于源码。

## Coordination Rules

用以下规则处理过程、结果、治理和实现之间的交接。

- **定义优先还是治理优先**：用户问“做什么、怎么表现、规则是什么、技术怎么定”时，先进入定义或对应过程 skill；用户问“怎么推进、排期、拆任务、验收、复盘、路线图”时，先进入 `arckit-project-governance-workflow`。
- **过程 handoff 临时保存**：过程 skill 的输出默认只作为当前回合交接。如果用户需要后续复用、跨回合继续、或暂不入库，把 handoff 摘要、来源、开放问题和建议下游保存到 `arckit-pending`；不要把未确认内容直接写进 `arckit/spec`、`arckit/interaction`、`arckit/visual` 或 `arckit/tech`。
- **结果入库边界**：结果 skill 只接收可确认事实。`assumptions`、`gaps`、`risks`、`open_questions` 和被拒绝方案保留为 pending、治理风险或过程记录，不能静默写成稳定规格。
- **编码交接**：进入普通代码工作流或外部 `arckit-code` 前，先形成最小 `implementation_handoff`：`scope`、`source_docs`、`tasks`、`acceptance`、`constraints`、`evidence_expected`。如果这些信息缺失，先回到对应定义 skill 或治理 skill。
- **质量证据查找顺序**：验证、审查、发布和运行期判断优先读取用户当前要求，其次读取 governance task/review，再读取 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech`，最后读取代码 diff、测试输出、日志或运行指标。
- **完整流程也要裁剪**：即使用户显式要求“完整流程”或角色协作，也按当前项目阶段裁剪必要阶段；`arckit-role-orchestration` 输出计划后仍需用户确认再执行。

## Routing Patterns

下面按真实项目常见流转给出组合参考。已有上游产物时跳过对应步骤，只选择当前任务真正需要的最小 skill 集。

- **收到客户资料、会议纪要、截图或旧文档，尚未判断含义**：先用 `arckit-intake` 归档 source input materials、provenance 和可引用 ID。若用户随后要求分析，再按内容进入 `arckit-market-research`、`arckit-decision-framework`、`arckit-draft-spec`、`arckit-domain-modeling` 或结果型定义 skill。
- **一个模糊想法需要判断是否值得做**：用 `arckit-decision-framework` 拆假设、价值和风险；需要外部证据时接 `arckit-market-research`；需要用户研究或线框探索时接 `arckit-idea-explore`；需要长期留痕时接 `arckit-idea`；决定进入执行后交给 `arckit-project-governance-workflow` 建 Goal、scope 或 roadmap。
- **已有方向，要变成可执行版本**：如果缺少产品、交互、视觉或技术定义，先补定义；如果定义足够但缺少推进方式，使用 `arckit-project-governance-workflow` 明确 Goal、scope、优先级和迭代边界；最后形成可交给编码工作流的 `implementation_handoff`。
- **正在定义一个功能、页面或模块**：产品行为先落 `arckit-spec`；页面流程和状态接 `arckit-interaction`；视觉系统或组件规则接 `arckit-visual`；架构、数据模型和 API 接 `arckit-tech`。如果材料还不成熟，先用对应过程 skill 生成 handoff。定义变化若影响任务、风险或路线图，交回 `arckit-project-governance-workflow`。
- **准备实现、改代码或重构**：正向编码走普通代码工作流或外部 `arckit-code` skill。若实现过程中发现产品、交互、视觉、技术方案或验收口径不清，回到对应定义 skill；实现改变计划或证据时，交回 `arckit-project-governance-workflow`。
- **执行中出现争议、变更、延期或暂不决定的问题**：能立即做取舍的用 `arckit-decision-framework`；影响目标、排序、任务或 roadmap 的进 `arckit-project-governance-workflow`；暂不承诺但未来可能有价值的上下文放入 `arckit-pending`。
- **代码审查、测试、验收或复盘后需要收口**：代码审查用 `arckit-code-review`；实现验收用 `arckit-verify-implementation`；再用 `arckit-project-governance-workflow` 记录 Review、Decision、Roadmap 或后续 Task。若验收暴露稳定行为、交互、视觉或技术事实变化，再回写对应定义 skill。
- **出现 bug、回归、偶发失败或性能退化**：先用 `arckit-debug-diagnosis` 做证据驱动诊断和最小修复；若需要运行期信号，接 `arckit-runtime-operations`；若根因改变产品行为、技术方案、验收证据或计划，再更新对应定义 skill 并交回 `arckit-project-governance-workflow`。
- **发布或运行期工作**：发布准备用 `arckit-release-readiness`；运行健康、SLA/SLO、baseline 或告警观察用 `arckit-runtime-operations`；重要结论交回 `arckit-project-governance-workflow`。
- **需要本地桌面记录、任务派发或 Codex dispatch**：先由 `arckit-project-governance-workflow` 或对话确认任务已经足够明确，再用 `arckit-workshop-desktop` 创建记录、读取任务、打开应用或发送已批准工作。Workshop Desktop 是执行桥，不替代项目事实源。
- **用户明确要求角色协作**：使用 `arckit-role-orchestration` 生成角色协作计划，经用户确认后再进入具体 skill。

## Source of Truth

- 原始输入事实：`arckit-intake` 只记录 source input materials 和 provenance，不代表已接受需求、任务或决策。
- 产品定义事实：`arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech` 分别是产品行为、交互、视觉和技术方案的 source of truth。
- 项目治理事实：`arckit-project-governance-workflow` 是 Goals、Iterations、Tasks、Reviews、Decisions 和 Roadmap 的控制层。
- 未承诺上下文：`arckit-pending` 记录尚未承诺的开放问题、风险和延后想法，不等同于 backlog、spec 或 decision。
- 桌面执行记录：Workshop Desktop 记录是面向人的工作笔记和执行桥，不是已接受的项目事实。

## Output

当本 skill 路由工作时，输出一个简短路由说明，包含：

- 选中的 skill 或 skill 集
- 适用原因
- 使用顺序
- 是否涉及 Workshop Desktop 或 Codex dispatch

结果落点按 skill 说明：

- `arckit-intake` -> `arckit/intake/`
- `arckit-spec` -> `arckit/spec/`
- `arckit-interaction` -> `arckit/interaction/`
- `arckit-visual` -> `arckit/visual/`
- `arckit-tech` -> `arckit/tech/`
- `arckit-project-governance-workflow` -> Goals、Iterations、Tasks、Reviews、Decisions、Roadmap
- `arckit-pending` -> `arckit/pending/`
- `arckit-workshop-desktop` -> Workshop Desktop 记录
- 无需沉淀 -> 仅作为对话回答
