# Arckit

Arckit 是飞天橙子团队的 AI Agent Skills 中心，用来沉淀、维护和共享我们在真实项目开发中验证过的工作方法。

这个仓库会收录两类 skills：

- 团队在真实 2B 和 2C 项目交付中沉淀出来的 skills
- 从外部发现、筛选、审查，并适配到我们研发流程中的优质 skills

Arckit 的目标不是简单堆放提示词，而是把可复用的产品、设计、研发、质量和交付经验整理成 agent 能稳定执行的工作流。

## 定位

Arckit 面向 AI-agent-assisted software development，服务于从想法到交付的完整项目生命周期。

它关注的问题包括：

- 如何从机会和用户反馈中提炼有效项目方向
- 如何把想法定义成可执行的产品、交互、视觉和技术方案
- 如何让 agent 在不同项目和会话中复用上下文
- 如何沉淀工程实现、代码审查、测试验证和发布运维经验
- 如何让团队使用同一套经过审查的 skills，而不是各自维护零散提示词

## 目录结构

```text
arckit/
  idea/
    skills/        想法、机会、用户反馈和早期问题分析
  iteration/
    skills/        迭代管理、里程碑、优先级和执行节奏
  definition/
    skills/        产品规格、交互设计、视觉设计和技术方案
  memory/
    skills/        agent 记忆、项目上下文索引和跨会话导航
  engineering/
    skills/        工程实现、平台开发、前后端实践和编码工作流
  quality/
    skills/        代码审查、测试策略、验收检查和发布质量评估
  delivery/
    skills/        部署、发布、运行环境、监控和故障处理
```

## 分类说明

### `idea/`

用于机会发现、想法收集、用户反馈分析、竞品观察和早期问题定义。

如果一个 skill 主要帮助判断“这个方向是否值得做”，应放在 `idea/skills/`。

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

### `memory/`

用于帮助 agent 理解、维护和复用项目上下文。

典型内容包括：

- `AGENTS.md`
- `CLAUDE.md`
- 项目索引
- 上下文地图
- 关键决策记录
- 跨会话记忆维护规则

### `engineering/`

用于具体工程实现。

典型内容包括：

- 前端开发
- 后端开发
- 移动端开发
- 认证与权限
- 平台集成
- 代码生成与重构
- 具体技术栈实践

### `quality/`

用于验证实现是否正确、可靠、可维护。

典型内容包括：

- 代码审查
- 测试策略
- 回归检查
- 验收检查
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
    ios-swiftui-development/
      SKILL.md
      references/
      scripts/
```

命名建议：

- 使用 lowercase kebab-case
- 名字表达主要用途
- 避免过宽泛的名称

示例：

- `product-spec`
- `interaction-strategy`
- `visual-system`
- `ios-swiftui-development`
- `server-deployment`

`SKILL.md` 应聚焦核心工作流。详细参考资料、脚本、模板、示例或资产，可以放在 skill 目录内的 `references/`、`scripts/`、`templates/` 或 `assets/` 中。

## 推荐管理工具

推荐使用 [SkillOps](https://github.com/feitianchengzi/skillops) 管理 Arckit 中的 skills。

SkillOps 是一个 GitHub-first 的 AI Agent Skills 工作台，面向个人开发者和小团队。它不替代具体 agent 的运行时，也不是公共 marketplace，而是负责 skill 从草稿到团队采用之间的生命周期管理：

- 扫描 Git 仓库中的 `SKILL.md`
- 审计 skill 的质量和安全风险
- 按项目 profile 组织不同 skill 集合
- 将 profile 应用到目标 agent 目录
- 检查源仓库和目标项目之间的 skill 漂移
- 生成私有或公开发布前的 publish plan

推荐流程：

```text
write skill -> audit -> group by profile -> share with team -> publish from GitHub -> monitor drift
```

Arckit 采用“阶段目录 / `skills` / 具体 skill”的结构。使用 SkillOps 时，可以让它递归扫描仓库中的 `SKILL.md`，并用 profile 控制不同项目需要启用哪些 skills。

示例配置：

```json
{
  "version": 1,
  "sourceDir": ".",
  "teamRepo": "github.com/feitianchengzi/arckit",
  "profiles": [
    {
      "name": "default",
      "description": "All Arckit skills for local experimentation.",
      "skills": ["*"],
      "targets": ["claude", "codex", "cursor"]
    }
  ]
}
```

常用命令：

```bash
skillops scan --root .
skillops audit --root .
skillops drift --root . --profile default --target .skillops/skills
skillops apply-profile --root . --profile default --target .skillops/skills
skillops publish-plan --root . --visibility private
```

如果后续某个项目只需要 iOS、鉴权或部署相关 skills，应通过 SkillOps profile 做选择，而不是复制整个 Arckit 仓库。

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

当一个 skill 横跨多个目录时，优先放到 agent 实际执行动作最接近的目录。

例如：

- 认证架构方案属于 `definition/skills/`
- 网关登录的具体实现步骤属于 `engineering/skills/`
- 登录流程的验收检查属于 `quality/skills/`
- 线上认证服务部署属于 `delivery/skills/`

## 项目状态

Arckit 是飞天橙子团队在 AI Agent 协作开发中的长期沉淀仓库。

它会随着真实 2B 和 2C 项目的推进持续演化。我们优先收录已经被项目验证、能显著提升产品定义、工程实现、质量保障或交付效率的 skills。
