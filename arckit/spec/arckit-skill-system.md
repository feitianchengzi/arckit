# Arckit 技能系统规格

更新时间：2026-06-13

## 1. 系统定位

Arckit 是围绕本仓库维护的软件项目开发技能包。系统通过一组可组合的 agent skills 支持软件项目在创意、定义、迭代、工程、质量、交付和记忆阶段持续推进。

本仓库是 Arckit 的方法中心。仓库内 skill 定义生命周期工作流、稳定产物、职责边界和 agent 协作规则。技术栈专属编码实践不属于本仓库职责，应维护在独立的代码实践仓库中，例如 `arckit-code`。

Workshop Desktop 是独立桌面软件。Arckit 通过 skill 和脚本把 Workshop Desktop 接入为本地桌面执行桥，用于记录、任务、app-server 调用、安装更新和 Codex dispatch，不把它并入治理模型。

## 2. 入口路由

Arckit 使用 `using-arckit` 作为入口 skill。该 skill 独立位于 `entry/skills/using-arckit/`，负责解释当前可用 skill 集合，识别用户场景，选择最小必要 skill 集，并组织执行顺序。

Arckit 不在本仓库内额外维护 Skill Pack 或 Profile 层来列出技能。技能集合说明和组合策略由 `using-arckit` 承担。

`using-arckit` 支持以下行为：

- 根据用户目标识别生命周期阶段和期望产物。
- 选择最小相关 skill 集，而不是默认加载全部 skill。
- 把稳定的规划、范围、决策、任务和路线图影响交回 `project-governance-workflow`。
- 仅在流程需要本地桌面记录、Workshop 任务、app-server 调用、安装更新、打开应用或 Codex dispatch 时引入 `arckit-workshop-desktop`。

入口 skill 不属于 `iteration/skills/`。`iteration/skills/` 保留项目节奏、治理执行、任务/记录桥接和迭代控制能力。

## 3. 规格边界

每个执行型 skill 必须通过 frontmatter description、触发条件、使用场景和产物边界自描述。技能正文不承担主要触发职责。

skill description 是主要触发表面，必须说明：

- skill 拥有的产物或操作。
- 适用的用户意图。
- 稳定输出形态。
- 主要职责边界。

执行型 skill 不依赖正文中的“不要用本 skill，改用其他 skill”来修正触发。若需要此类正文说明才能避免误触发，说明 description 或技能划分需要修订。

跨 skill 组合主要由 `using-arckit` 或横向方法 skill 自身 description 负责。产品产物型 skill 描述自己的流程、产物和关键判断点，不硬编码横向方法 skill 名称。

## 4. Workshop Desktop 桥接

`arckit-workshop-desktop` 是 Workshop Desktop 的 Arckit 桥接 skill，位于 `iteration/skills/`。该位置反映它服务于执行节奏、任务记录、工作交接和本地桌面操作。

该 skill 通过随附脚本提供稳定接口：

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs <command>
```

脚本负责以下能力：

- 状态检查。
- 安装和更新检测。
- GitHub latest release 查询。
- 安装计划输出。
- 应用打开。
- app-server 连接发现。
- 记录创建。
- 项目和任务列表查询。
- 支持的 JSON-RPC 调用。

Workshop Desktop 安装和更新使用 `hoewo/workshop-desktop` GitHub 最新 release。脚本选择平台匹配的 release asset，只在用户明确批准 `ensure --yes` 时下载和安装。

截至 2026-06-13，latest release 元数据为 `v0.1.16`，`darwin/x64` 平台选择 `Workshop.Todo-0.1.16-universal-mac.zip`。

只读状态检查的稳定接口是：

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs status
```

agent 不默认追加 `ps`、`pgrep`、`lsof`、`find` 或手动 app 目录扫描。这些低层诊断只在用户明确要求时执行。

## 5. 治理与桌面执行分离

`project-governance-workflow` 是项目控制层，负责 Backlog、Goal、scope、Iteration、Task、Review、Decision、Roadmap 和项目文档结构。

`arckit-workshop-desktop` 是桌面执行桥，负责检查、打开、安装、更新、读取、写入记录和调用 Workshop Desktop 本地 app server。

Workshop Desktop 记录是面向人的工作材料。记录本身不是仓库中已接受的项目事实。只有在治理或文档 skill 明确把记录提升到仓库文档后，相关内容才成为项目事实。

## 6. 创意、探索与决策方法

`arckit-idea` 维护 `arckit/idea/` 下的长期商机和产品创意记录。该 skill 用于保存、跟踪、更新和归档业务机会或产品创意。

`arckit-idea-explore` 维护 `arckit/idea-explore/{idea-name}/` 下的深度产品创意探索产物。该 skill 的稳定产物是 `idea.md` 和 `idea.html`，内容包括核心假设、模拟用户研究、支持率判断、MVP 方向、行动计划和可视化线框图。

`decision-framework` 是横向决策方法 skill。它既可作为独立决策工作流，也可在其他主工作流的关键判断点提供辅助方法。

`decision-framework` 支持以下判断场景：

- 价值判断。
- 选项比较。
- 假设分析。
- 第一性原理拆解。
- 产品价值评估。
- 苏格拉底式追问。
- 嵌入式轻量决策片段。

当 `decision-framework` 作为辅助方法使用时，它不创建独立决策文件，除非用户明确要求。它返回小型决策片段给主工作流，由主工作流写入自己的文档、记录、任务或规格。

主产物 skill 不硬编码 `decision-framework`。主产物 skill 只描述自身关键判断点，agent 根据 `decision-framework` 的 description 在相关时机识别它可作为辅助方法。

## 7. 当前技能角色

| Skill | 角色 |
| --- | --- |
| `using-arckit` | 位于 `entry/skills/` 的 Arckit 软件项目入口路由和 workflow composer。 |
| `project-governance-workflow` | Goals、scope、iterations、tasks、reviews、decisions、roadmap 和项目文档结构的治理控制层。 |
| `arckit-workshop-desktop` | Workshop Desktop 本地执行桥，用于 app 检查、安装、记录、任务、app-server 调用和 Codex dispatch。 |
| `decision-framework` | 横向决策方法和独立决策工作流，也可向主工作流提供轻量决策片段。 |
| `arckit-idea` | `arckit/idea/` 下的商机和产品创意记录维护。 |
| `arckit-idea-explore` | `arckit/idea-explore/{idea-name}/` 下的深度产品创意探索产物维护。 |
| `arckit-spec` | `arckit/spec/` 下的稳定产品行为和功能规格维护。 |
| `arckit-interaction` | `arckit/interaction/` 下的页面级交互策略、灰度线框 HTML 和交互文档维护。 |
| `arckit-visual` | `arckit/visual/` 下的视觉策略、design tokens、主题和组件视觉规格维护。 |
| `arckit-tech` | `arckit/tech/` 下的技术方案、架构、数据模型和 API 契约维护。 |
| `arckit-pending` | `arckit/pending/` 下的未决项目级讨论项保存。 |
| `arckit-debug-diagnosis` | 基于证据的 bug、回归和失败诊断。 |

## 8. 开发与验证规则

在 Arckit 源仓库内开发或验证 skill 时，agent 优先读取当前仓库中的源 skill 路径，而不是用户级已安装副本。用户级安装副本可能落后于当前源码。

示例：读取 `idea/skills/arckit-idea/SKILL.md`，而不是 `~/.codex/skills/arckit-idea/SKILL.md`。

Skill 变更使用 Skill First 模拟验证。子代理模拟用于测试另一个 agent 是否能在没有隐藏上下文的情况下遵守技能边界。

已验证的行为包括：

- `using-arckit` 在 source-path preference 加入后，可以把商机登记请求路由到当前仓库源 `arckit-idea`。
- `arckit-workshop-desktop` 的只读边界收紧后，子代理只运行稳定 `status` 命令。
- `decision-framework`、`arckit-idea`、`arckit-idea-explore` 的 description 需要承担触发和边界责任，避免正文补救式说明。

## 9. 后续规格关注点

后续可继续完善：

- 使用 ArcForge 治理已创建和已验证的 skills，进入审计、正式化、安装、同步、发布或共享流程。
- 继续 forward-test `using-arckit`，覆盖一个主 skill 与一个横向辅助方法协作的混合场景。
- 当多 skill workflow 的 token 成本成为实际问题时，把 `decision-framework` 的长方法细节拆到 references 中。
