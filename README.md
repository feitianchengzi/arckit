# Arckit

Arckit 是飞天橙子团队的 AI Agent Skills 中心，用来沉淀、维护和共享我们在真实项目开发中验证过的工作方法。

这个仓库会收录两类 skills：

- 团队在真实 2B 和 2C 项目交付中沉淀出来的 skills
- 从外部发现、筛选、审查，并适配到我们研发流程中的优质 skills

Arckit 的目标不是简单堆放提示词，而是把可复用的产品、设计、研发、质量和交付经验整理成 agent 能稳定执行的工作流。

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

如果后续某个项目只需要具体技术栈 coding skills，应从 `arckit-code` 选择；如果只需要 Arckit 中的生命周期、治理、诊断或交付 skills，应通过 ArcForge 的推荐安装或治理流程选择，而不是复制整个 Arckit 仓库。

---

## 定位

Arckit 面向 AI-agent-assisted software development，服务于从想法到交付的完整项目生命周期。

它关注的问题包括：

- 如何从机会和用户反馈中提炼有效项目方向
- 如何把想法定义成可执行的产品、交互、视觉和技术方案
- 如何让 agent 在不同项目和会话中复用上下文
- 如何沉淀工程诊断、代码审查、测试验证和发布运维经验
- 如何让团队使用同一套经过审查的 skills，而不是各自维护零散提示词

## 目录结构

```text
arckit/
  idea/
    skills/        想法、机会、用户反馈和早期问题分析
  thinking/
    skills/        跨生命周期过程型思考能力、决策框架、草案生成、候选比较和 handoff 准备
  iteration/
    skills/        迭代管理、里程碑、优先级和执行节奏
  definition/
    skills/        产品规格、交互设计、视觉设计和技术方案
  memory/
    skills/        agent 记忆、项目上下文索引、未决议题和跨会话导航
  media/
    skills/        视频制作、社交运营、发布流程和多平台适配
  engineering/
    skills/        通用工程诊断、实现协作、回归定位和代码调查工作流
  quality/
    skills/        代码审查、测试策略、验收检查、真实场景评测和发布质量评估
  delivery/
    skills/        部署、发布、运行环境、监控和故障处理
```

## 分类说明

### `idea/`

用于机会发现、想法收集、用户反馈分析、竞品观察和早期问题定义。

如果一个 skill 主要帮助判断“这个方向是否值得做”，应放在 `idea/skills/`。

### `thinking/`

用于跨生命周期的过程型思考能力，包括决策框架、结构化分析、问题重构、草案生成、候选方案比较、批评修正和结果入库前的 handoff 准备。

如果一个 skill 承担的是可替换的分析、推理、生成、比较、批评或 handoff 准备，而不是某个阶段的长期产物维护流程，应放在 `thinking/skills/`。

### `iteration/`

用于项目迭代管理、版本节奏、里程碑规划、任务优先级和执行推进。

如果一个 skill 主要帮助决定“什么时候做、先做什么、如何推进”，应放在 `iteration/skills/`。

### `definition/`

用于定义项目是什么、如何工作、如何被用户感知，以及技术上如何组织。

典型内容包括：

- 产品规格
- 交互策略
- 视觉规范
- 技术方案
- 数据模型
- 系统边界

### `media/`

用于内容生产和运营类工作流。

典型内容包括：

- 视频制作
- 社交媒体运营
- 发布排期
- 多平台内容适配
- 素材整理和复用

### `memory/`

用于帮助 agent 理解、维护和复用项目上下文。

典型内容包括：

- `AGENTS.md`
- `CLAUDE.md`
- 项目原始输入登记
- 项目索引
- 上下文地图
- 关键决策记录
- 项目未决议题
- 跨会话记忆维护规则

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

### `quality/`

用于验证实现是否正确、可靠、可维护。

典型内容包括：

- 代码审查
- 测试策略
- 回归检查
- 验收检查
- 真实研发活动评测
- 安全审查
- 发布前质量评估

### `delivery/`

用于把系统交付到真实环境，并保障运行。

典型内容包括：

- 部署
- 发布
- 环境配置
- 监控
- 运维
- 故障处理
- 回滚方案

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
- `arckit-release-readiness`

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
- 登录流程的验收检查属于 `quality/skills/`
- 线上认证服务部署属于 `delivery/skills/`

## 项目状态

Arckit 是飞天橙子团队在 AI Agent 协作开发中的长期沉淀仓库。

它会随着真实 2B 和 2C 项目的推进持续演化。我们优先收录已经被项目验证、能显著提升产品定义、工程诊断、质量保障或交付效率的 skills。
