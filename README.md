# Arckit

Arckit 是飞天橙子团队的 AI Agent Skills 中心，用来沉淀、维护和共享我们在真实项目开发中验证过的工作方法。

这个仓库会收录两类 skills：

- 团队在真实 2B 和 2C 项目交付中沉淀出来的 skills
- 从外部发现、筛选、审查，并适配到我们研发流程中的优质 skills

Arckit 的目标不是简单堆放提示词，而是把可复用的软件项目状态、定义事实和诊断方法整理成 agent 能稳定执行的能力包。

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

如果后续某个项目只需要具体技术栈 coding skills，应从 `arckit-code` 选择；如果只需要 Arckit 中的状态驱动 loop、定义事实或诊断 skills，应通过 ArcForge 的推荐安装或治理流程选择，而不是复制整个 Arckit 仓库。

---

## 定位

Arckit 面向 AI-agent-assisted software development，目标是指导 agent 辅助人类完成软件项目开发。当前仓库刻意收敛为验证 `Project State -> Case -> Loop` 所需的最小能力面：项目对话 Controller、研发状态账本、产品/交互/视觉/技术事实维护，以及通用 debug 诊断。

它关注的问题包括：

- 如何把用户输入转成受控 round，并由项目状态和 case gap 驱动下一轮
- 如何把产品、交互、视觉和技术结论维护为稳定事实
- 如何把研发事项维护成跨轮次、可恢复、可验证的状态记录
- 如何沉淀工程诊断和回归定位经验
- 如何让 Runtime 只从明确的保留能力集合中选择 skill

当用户诉求超出当前保留能力，例如代码审查、发布出包、运行运维、商业决策或专用技术栈编码时，Controller 把边界写入 active case 的 `open_questions`、`pending_handoffs` 或 `human_decision_required`，再交给 `arckit-code`、ArcForge、项目自身工具或对应 external adapter。

项目中的 `arckit/project/` 和 `arckit/cases/` 用于保存研发状态账本数据。`arckit-development-ledger` 维护 project state、development case record、project_state_delta、completion audit 和索引；schema 与脚本属于 skill，自身不写入目标项目数据区。

## 目录结构

```text
arckit/
  entry/
    skills/        项目对话 Controller 与 development ledger
  definition/
    skills/        产品规格、交互设计、视觉设计和技术方案
  engineering/
    skills/        通用工程诊断、回归定位和代码调查工作流
  runtime/
    arckit-runtime/ 只消费当前保留 capability policy 的控制面
```

## 分类说明

### `entry/`

用于软件项目对话 Controller、执行门禁、worker packet、report intake、closeout，以及 Project State/iteration/case 账本维护。

当前保留：

- `using-arckit`
- `arckit-development-ledger`

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

用于技术栈无关的工程诊断、回归分析和代码层面问题处理。

Arckit 不维护“某个技术栈具体如何编码”的 skill。SwiftUI、前端框架、后端框架、平台 SDK、认证接入等具体 coding workflow 统一放到 `arckit-code` 中维护。

典型内容包括：

- bug 定位与 debug 诊断
- 回归分析
- 实现问题排查
- 代码调查路径
- 证据驱动的必要修复建议

当前保留：

- `arckit-debug-diagnosis`

### Runtime capability policy

Runtime 的显式能力策略位于 `runtime/arckit-runtime/config/capability-policy.json`。该文件把上面 7 个保留 skill 分成三个互斥 execution plane：`using-arckit` 只用于 Controller 协议，`arckit-development-ledger` 只作为 Runtime 状态与写回能力，其余 5 个 skill 才能绑定给 Worker。Runtime 注册表扫描 manifest、应用策略分组并解析 invocation：Controller planning/review 通过 manifest 声明的 `$using-arckit` Agent skill trigger 执行；项目初始化与 ledger writeback 直接调用 `arckit-development-ledger` 声明的受信任 runtime entrypoint。Runtime 不复制这两个 skill 的语义流程或账本脚本，也不在内核代码中写死每轮路线或 skill 序列。Controller plan 或既有 packet 绑定非法 Worker skill 时会失败关闭。

`arckit/intake/`、`arckit/pending/`、`arckit/spec/_archive/`、closed cases 和 runtime evidence 中可能保存历史 `SKILL.md` 文本或已移除名称；它们是项目数据和历史证据，不属于当前 skill source，也不会进入 Runtime capability policy。

## Skill 组合原则

Skill 之间可以形成软组合，但不应让一个 skill 隐式 import 另一个 skill。Runtime execution plane 可以通过 capability manifest 显式绑定某个 skill：Agent 语义能力使用 `$skill-name` trigger，确定性脚本能力使用受信任 `runtime_entrypoints`。这种绑定属于 Runtime 调用 skill，不是 skill 间隐藏依赖。

推荐做法：

- 产物型 skill 可以接收用户、Controller worker report、稳定事实源或 external adapter 的明确材料，但仍应能独立完成自己的产物维护。
- 不要把关键执行步骤藏在另一个 skill 里；如果必须复用，写清楚输入、输出和人工触发条件。
- 未确认内容保留在 active case 的 `open_questions` 或 `pending_handoffs`；不得发明已移除 skill 作为隐式前置依赖。

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
