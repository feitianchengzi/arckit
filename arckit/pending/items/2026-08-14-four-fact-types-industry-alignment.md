# Arckit 四类事实与 AI 软件 Agent 行业概念对齐

## Status

- State: parked
- Type: product
- Source: 2026-08-13 至 2026-08-14 用户对话、当前 Arckit 产品规格与公开行业资料调研
- Created: 2026-08-14
- Updated: 2026-08-14
- Decision: 保留四类事实作为 Arckit 当前内部模型；行业映射、`fact` 总称的语义边界和对外术语尚待专门评审，不立即修改稳定规格。

## Background

讨论从“当前项目关于事实有几个定义”开始。当前稳定规格将事实系统分为预期事实、实现事实、过程事实和工作方式事实。随后进一步询问 AI 软件 Agent 行业是否存在相关讨论，并将 Arckit 的四分类与 specification-driven development、repository/runtime state、agent trace/episodic memory、procedural memory、`AGENTS.md` 和 Agent Skills 等行业概念进行了初步对照。

## Pending Item

判断 Arckit 是否应继续以“四类事实”作为统一产品术语，以及未来对外表达时应当：

- 保持 `fact` 作为覆盖四类可恢复项目记录的总称；
- 改用更宽的 `knowledge/state domain` 等上位词；
- 或保留中文内部术语，同时为英文语境分别使用 intent/specification、observed implementation state、process record 和 procedural guidance。

该问题也包括四分类与行业 memory taxonomy 的关系：Arckit 按软件项目语义和权威边界分类，行业常按 semantic、episodic、procedural 和 working memory 的存储与召回方式分类，两者不应被误认为一一对应。

## Current Judgment

四类事实都有明确的行业邻近概念，但未发现行业普遍采用这四个名称组成统一 taxonomy。Arckit 的独特之处不是分别发明四个概念，而是把分散在规格驱动开发、实现 grounding、运行轨迹和 Agent 操作知识中的概念，统一纳入可恢复、可追溯、有权威边界的软件项目事实系统。

当前没有足够理由修改稳定规格。更需要补强的是上位定义：Arckit 中的 `fact` 是否专指经证据确认的描述性命题，还是泛指具有来源、状态、revision 和权威边界的 canonical project record。若采用后者，需要明确说明预期、规则、风险和开放问题为什么可以进入这一总称，避免与日常语言及英文 `fact` 的“客观真值”含义冲突。

## Evidence and Uncertainty

### Accepted Facts

- 当前 `product-architecture.md` 明确将事实系统分为四类：预期事实、实现事实、过程事实和工作方式事实。
- 当前 `product-concepts.md` 分别定义：预期事实表达“应该是什么”，实现事实表达“现在是什么”，过程事实保存尚未稳定的探索、判断、证据、风险和开放问题，工作方式事实表达人和 Agent 应该如何协作。
- GitHub Spec Kit 将 specification 视为 Coding Agent 生成、测试和验证实现的 source of truth，并使用 “intent is the source of truth” 描述行业方向。
- Anthropic 的长周期 Agent 实践使用 Git 历史、进度文件和结构化更新恢复跨上下文的工作与实现状态。
- OpenAI Agents SDK tracing 记录模型生成、工具调用、handoff、guardrail 和自定义运行事件；这类 raw trace 提供过程证据，但不自动等于经过筛选的项目过程事实。
- CoALA 与 LangChain 使用 semantic、episodic、procedural memory 等认知记忆分类组织 Agent 知识与经验。
- `AGENTS.md` 和 Agent Skills 已形成跨 Coding Agent 使用的仓库指令与可复用程序性知识载体，可作为工作方式事实的行业邻近实现。

### Assumptions

- 对外用户更容易理解 specification、implementation state、trace 和 instructions，而不是直接接受四者都属于 `fact`。
- 保留统一事实系统有利于 Arckit 的来源治理、revision、状态恢复和 Agent handoff，但这一收益尚未通过用户研究或跨项目评测验证。
- 中文“事实”的可接受边界可能宽于英文 `fact`，国际化时可能需要不同术语而非直接翻译。

### Gaps

- 尚未形成 Arckit `fact` 上位概念的严格定义及纳入/排除标准。
- 尚未判断“过程事实”中风险、开放问题和未稳定判断是否应继续称为事实，还是应属于 process context/evidence。
- 尚未判断“工作方式事实”应与 Agent instructions、skills、policy 和 procedural memory 如何区分。
- 尚未建立四类事实与 semantic、episodic、procedural、working memory 的正式对照矩阵。
- 尚未进行面向产品用户、Agent framework 开发者或英文读者的术语理解测试。
- 尚未确认是否需要调整 `problem-background.md` 中“工作流事实”与当前“工作方式事实”的历史用词差异。

### Risks

- `fact` 过宽可能使未确认判断或规范性要求被误读为已经客观成立。
- 直接采用行业 memory taxonomy 会把软件语义分类误降为存储实现分类，弱化预期与实现之间的关键区分。
- 为追求行业同名而过早改词，可能破坏现有 Project State、Case、definition skills 和文档之间已经建立的语义一致性。
- 继续保留多个近义词而不定义关系，会导致工作方式事实、工作流事实、Agent instructions 和 procedural memory 在后续文档中漂移。

## Revisit When

- 准备对外发布 Arckit 产品概念、协议说明或英文文档时。
- 计划修改事实系统、Project State 或 Case 的 canonical 语义时。
- 用户或贡献者再次对 `fact`、过程事实或工作方式事实产生理解分歧时。
- 已具备跨项目案例或用户研究，可以验证四分类是否帮助 Agent 恢复状态和正确行动时。

## Related Areas

- `arckit/spec/agentic-software-development/product-concepts.md`
- `arckit/spec/agentic-software-development/product-architecture.md`
- `arckit/spec/agentic-software-development/problem-background.md`
- `arckit/spec/agentic-software-development/solution-principles.md`
- `entry/skills/arckit-development-ledger/`
- `definition/skills/`
- `AGENTS.md`

## Notes

- 初步行业映射：预期事实约等于 specification/intent/desired state；实现事实约等于 repository/runtime/observed state；过程事实部分对应 trajectory/trace/episodic memory；工作方式事实约等于 procedural memory/repository instructions/skills。
- 预期事实和实现事实都可能属于 semantic/declarative knowledge；过程事实横跨 episodic memory 与 working state；工作方式事实最接近 procedural memory。因此行业 memory taxonomy 只能辅助解释，不能替代 Arckit 分类。
- 公开参考：GitHub Spec Kit、Anthropic 的 context engineering 与 long-running agent harness、OpenAI Agents SDK tracing、CoALA、LangChain memory、AGENTS.md 和 Agent Skills specification。

## Outcome

尚未提升为稳定产品概念修订或术语变更任务。
