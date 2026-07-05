# Arckit

Arckit 是飞天橙子团队的 AI Agent Skills 中心，用来沉淀、维护和共享我们在真实项目开发中验证过的工作方法。

这个仓库会收录两类 skills：

- 团队在真实 2B 和 2C 项目交付中沉淀出来的 skills
- 从外部发现、筛选、审查，并适配到我们研发流程中的优质 skills

Arckit 的目标不是简单堆放提示词，而是把可复用的软件项目定义、产品设计、技术方案、项目记忆和诊断经验整理成 agent 能稳定执行的工作流。

## 推荐安装方式

推荐通过 [ArcForge](https://github.com/feitianchengzi/arcforge.git) 安装和治理 Arckit。

ArcForge 是飞天橙子的本地优先、GitHub 优先的 agent skill 治理工作台。它不替代 Codex、Claude、Cursor 等 agent 的运行时，也不是公共 marketplace；它负责让 agent 从 GitHub 或本地 Skill 项目中识别、审计、应用和检查 skills，而不是让用户手动复制目录。

如果你还没有安装 ArcForge，请先打开 ArcForge 仓库，并让 agent 执行：

```text
执行 skills/arcforge-install
```

ArcForge 安装完成后会进入推荐 Skill 项目阶段。此时可以让 agent 选择安装 `arckit`、`arckit-code`，或两个都安装。

这样安装的原因是：

- `arckit` 仓库继续作为 GitHub-first 的 skills source of truth。
- Codex、Claude、Cursor 的用户级或项目级 skills 目录只是应用目标，不应该手动当成维护源。
- ArcForge 会先区分来源、维护源和应用目标，再由 agent 执行安装或同步，减少漏文件、旧文件残留和误覆盖。
- ArcForge 可以保存来源关系，后续用 drift 检查已安装副本是否偏离本仓库。

如果后续某个项目只需要具体技术栈 coding skills，应从 `arckit-code` 选择；如果只需要 Arckit 中的定义、思考、记忆或诊断 skills，应通过 ArcForge 的推荐安装或治理流程选择，而不是复制整个 Arckit 仓库。

---

## 定位

Arckit 面向 AI-agent-assisted software development，目标是指导 agent 辅助人类完成软件项目开发。当前仓库围绕真实开发协作中最基础、最高频的工作面组织能力：入口编排、项目记忆、定义前思考、产品/交互/视觉/技术事实维护，以及通用 debug 诊断。

它关注的问题包括：

- 如何把想法定义成可执行的产品、交互、视觉和技术方案
- 如何把一句自然语言需求维护成跨轮次的研发事项记录，并持续补齐未满足的软件工程结构
- 如何让 agent 在不同项目和会话中复用上下文
- 如何沉淀工程诊断和回归定位经验
- 如何让团队使用同一套经过审查的 skills，而不是各自维护零散提示词

当用户诉求进入项目治理、代码审查、质量评测、发布出包、运行运维、Workshop Desktop、多角色协作或长期想法管理时，Arckit 先沉淀可复用的开发事实、决策依据、定义文档、诊断证据和 `arckit-pending` 交接项，再交给 `arckit-code`、ArcForge、项目自身工具或对应外部 adapter 继续执行。

项目中的 `arckit/cases/` 用于保存 development case record。它记录一个研发事项跨轮次的目标、当前缺口、结构状态、未决问题、handoff 和 completion audit，并通过 `tools/arckit-case/arckit-case.mjs` 维护。

## 目录结构

```text
arckit/
  entry/
    skills/        首轮入口编排、后续消息适配和场景 workflow frame
  memory/
    skills/        原始输入、未决议题、workflow memory 和跨会话导航
  thinking/
    skills/        跨生命周期过程型思考能力、决策框架、草案生成、候选比较和 handoff 准备
  definition/
    skills/        产品规格、交互设计、视觉设计和技术方案
  engineering/
    skills/        通用工程诊断、回归定位和代码调查工作流
```

## 分类说明

### `entry/`

用于软件项目协作入口、场景 workflow resolution、workflow frame 编译和后续用户消息适配。

当前保留：

- `using-arckit`
- `arckit-turn-adaptation`

### `memory/`

用于帮助 agent 理解、维护和复用项目上下文。

当前保留：

- `arckit-intake`
- `arckit-pending`
- `arckit-workflow-memory`

### `thinking/`

用于跨生命周期的过程型思考能力，包括决策框架、结构化分析、问题重构、草案生成、候选方案比较、批评修正和结果入库前的 handoff 准备。

如果一个 skill 承担的是可替换的分析、推理、生成、比较、批评或 handoff 准备，而不是某个阶段的长期产物维护流程，应放在 `thinking/skills/`。

当前保留：

- `arckit-decision-framework`
- `arckit-draft-spec`
- `arckit-explore-product-design`
- `arckit-architecture-decision`
- `arckit-domain-modeling`

### `definition/`

用于定义项目是什么、如何工作、如何被用户感知，以及技术上如何组织。

典型内容包括：

- 产品规格
- 交互策略
- 视觉规范
- 技术方案
- 数据模型
- 系统边界

当前保留：

- `arckit-spec`
- `arckit-interaction`
- `arckit-visual`
- `arckit-tech`

### `engineering/`

用于技术栈无关的工程诊断、实现协作、变更收敛和代码层面问题处理。

Arckit 不维护“某个技术栈具体如何编码”的 skill。SwiftUI、前端框架、后端框架、平台 SDK、认证接入等具体 coding workflow 统一放到 `arckit-code` 中维护。

典型内容包括：

- bug 定位与 debug 诊断
- 回归分析
- 实现问题排查
- 代码调查路径
- 重构边界判断
- 跨技术栈通用的工程协作流程

当前保留：

- `arckit-debug-diagnosis`

## Skill 组合原则

Skill 可以形成软组合，但不应设计成运行时硬依赖。Agent 的 skill 机制主要依靠触发描述加载对应 `SKILL.md`，没有稳定的 `import` 或 `require` 语义来保证一个 skill 自动加载另一个 skill。

推荐做法：

- 过程型方法放在横向能力目录，例如 `thinking/skills/arckit-decision-analysis/` 或 `thinking/skills/arckit-draft-spec/`。
- 产物型 skill 可以在正文中说明“可参考”某个方法型 skill 的结论，但仍应能独立完成自己的产物维护。
- 不要把关键执行步骤藏在另一个 skill 里；如果必须复用，写清楚输入、输出和人工触发条件。
- 多 skill 协作时，优先把关系设计成“上游分析结果 -> 下游产物沉淀”，而不是“下游必须自动调用上游”。

## Skill 收录原则

每个 skill 应该满足以下标准：

- 来自真实项目问题，而不是抽象想象
- 有明确触发场景，agent 能判断什么时候应该使用
- 有清晰边界，避免覆盖过宽
- 能产出可验证的结果
- 对团队研发流程有复用价值
- 没有危险、含糊或绕过用户确认的指令
- 引用外部内容时，应注明来源和适配原因

外部引入的 skills 不应直接原样堆放。进入 Arckit 前，应先经过筛选、审查和本地化适配。

## Skill 文件约定

每个 skill 应该是一个独立目录，并包含必需的 `SKILL.md`：

```text
engineering/
  skills/
    arckit-debug-diagnosis/
      SKILL.md
      references/
      scripts/
```

命名建议：

- 使用 lowercase kebab-case
- 名字表达主要用途
- 避免过宽泛的名称

示例：

- `arckit-spec`
- `arckit-interaction`
- `arckit-visual`
- `arckit-debug-diagnosis`

`SKILL.md` 应聚焦核心工作流。详细参考资料、脚本、模板、示例或资产，可以放在 skill 目录内的 `references/`、`scripts/`、`templates/` 或 `assets/` 中。

## 使用方式

推荐把 Arckit 作为团队共享的 skills source of truth。

基本流程：

```text
发现问题 -> 沉淀 skill -> 审查 skill -> 分类入库 -> 项目中使用 -> 根据反馈迭代
```

对团队内部来说，Arckit 应该承担三个角色：

- 经验沉淀中心：把真实项目中的有效方法固化下来
- Agent 协作基础设施：让不同成员和不同 agent 使用一致的工作流
- 项目交付加速器：减少重复解释、重复决策和重复试错

## 维护建议

新增或修改 skill 时，建议检查：

- 这个 skill 解决的是不是高频或高价值问题
- 描述是否足够清楚，能否支持 agent 正确触发
- 指令是否过宽，是否可能误导 agent
- 是否依赖团队私有上下文，是否需要脱敏
- 是否有真实项目验证
- 是否应该放在当前目录，还是更适合其他生命周期阶段

当一个 skill 横跨多个目录时，优先放到 agent 实际执行动作最接近的目录。若 skill 是全生命周期可复用的过程能力，优先放到横向能力目录。

例如：

- 认证架构方案属于 `definition/skills/`
- 通用 debug 和回归诊断流程属于 `engineering/skills/`
- 网关登录的具体实现步骤属于 `arckit-code`
- 登录流程的验收检查、发布出包或线上运维先由 Arckit 固化预期事实、风险和交接输入，再交给对应外部 adapter 或专门 skill 执行

## 项目状态

Arckit 是飞天橙子团队在 AI Agent 协作开发中的长期沉淀仓库。

它会随着真实 2B 和 2C 项目的推进持续演化。当前工程目标是让 agent 稳定完成软件项目开发中的理解、定义、记录、诊断和交接工作，并在真实使用反馈中扩展治理、质量、交付和运营类能力。
