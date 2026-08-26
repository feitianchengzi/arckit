# Arckit

Arckit 是面向真实软件项目的 Agent 协作与交接协议层。它让人类、Codex 类单 Agent 和多 Agent 自动化平台，能够围绕同一组项目事实、Case 状态、受边界约束的 Worker packet、证据和 handoff 持续推进工作。

Arckit 采用 Apache License 2.0 开源。仓库中的 ArcOrbit Desktop 与 Runtime 采用 PolyForm Perimeter License 1.0.1，允许个人、团队和企业内部使用及修改，但不允许对外提供与 ArcOrbit 竞争的产品或服务，即使该产品或服务免费。完整范围见 [LICENSING.md](LICENSING.md)。

这个仓库是 Arckit skills 的 source of truth，保存飞天橙子团队在真实 2B、2C 项目中验证过的协作方法，以及经过审查和本地化适配的外部方法。它不以堆积提示词或模拟固定研发流水线为目标，而是把可恢复的项目状态、稳定事实维护、工程诊断和安全交接整理成 Agent 能独立理解、可靠执行的能力包。

## 产品主轴：Project State → Case → Loop

Arckit 用三个不同尺度的对象推进软件项目：

```text
Project State
  识别项目整体位置与宏观 gap，选择当前 Case
        ↓
Case State
  承载一个有边界研发事项的完整推进上下文，暴露待处理 gap
        ↓
Loop
  选择一个 gap，执行一次有证据的状态转移，写回结果并交接下一责任方
        ↺ 重新读取最新 Case State
```

- **Project State** 是可恢复的软件项目对象。它记录宏观完整性、目标、项目级 gap、active Case 与 Case 选择，不保存某一轮的 prompt、Worker 顺序或 continuation 指令。
- **Case** 是实际研发推进单元。它同时管理 product、interaction、visual、technical、implementation、verification 六个结果 facet，以及 open questions、pending handoffs、内容 revision 和完成态复审。
- **Loop** 是一次有边界的运行周期。它从 Case 的真实 gap 出发，形成计划、执行和证据，接受或拒绝 claims，提交一个可验证的 Case State delta，并明确下一责任方。

这个模型不规定“先写文档再写代码”。规格先行、代码先行和混合推进都可以成立，顺序由当前事实和 Case gap 决定。一次 Loop 完成不代表 Case 已解决，Case 解决也不代表 Project 维度自动提升。

Case 的六个 facet、问题和 handoff 都满足后，只能得到 `base_ready`。当前内容 revision 还必须通过 correctness、completeness、minimality 三维完成态复审；发现项需要修复或有证据地处置，复审干净后 Case 才能关闭。`deferred` 不是完成，只有带 owner 和恢复条件的 handoff 才能转移责任。

## 产品理念

### 状态驱动，而不是流程驱动

状态只描述事实、目标和 gap，不保存 skill 名或固定角色序列。Controller 每一轮都从最新 Project/Case 状态、capability manifest 和证据边界动态选择能力；Runtime 内核不内置初始业务 gap、固定 Worker 路线或 skill 调用顺序。

### 稳定事实优先于对话记忆

产品、交互、视觉和技术结论进入各自明确的事实源；项目状态进入 canonical ledger；原始 prompt、流式事件和过程日志只作为运行证据。下一轮从仓库中的最新状态恢复，而不是依赖上一轮 Agent 还“记得”什么。

### 语义判断与确定性控制分离

Agent 负责理解意图、选择 gap、分析证据和提出状态 claims；Runtime 负责 schema、授权、路径、证据、revision 和生命周期 gate；ledger 负责确定性审计、原子写回和派生状态。Worker 不能自行关闭 Case，Runtime 也不替 Agent 判断产品事实是否正确。

### Claim 不是事实，证据才能推动状态

Worker report 只提出 claim。Controller 必须依据持久证据明确接受或拒绝，ledger 再验证 transition 是否与当前 Case revision 和完整 candidate gap 一致。过期 frame、缺失 evidence、越权路径或强于实际状态的 resolved 声明都会失败关闭。

### 来源与投影分离

稳定策略、规则和契约是 source；索引、线框、预览、状态摘要等是 projection。变更必须先判断影响的是源还是投影，避免从展示产物反向发明事实，也避免实现变化后仍把旧 definition 标记为一致。

### 人工与自动化使用同一语义

同一个 Controller 协议既支持人在 Codex 对话中直接协作，也支持 Runtime 自动创建 Worker、收集 report 和写回 ledger。桥接方式可以不同，但相同事实与证据应得到相同的 gap 选择、accepted delta、Case resolution 和 handoff。

### 人类判断保持显式

审美判断、商业优先级、组织审批和发布授权不能由 skill 静默代替。能力可以整理分析、证据和待决上下文，但必须把最终责任交给人类或明确的 external adapter。自主完成态复审达到 Case 预算上限后，也必须进入 human-only handoff。

## 产品架构

```text
ArcOrbit Desktop
  项目、对话、运行状态、证据、gate 与人工控制
        ↓
ArcOrbit Runtime Kernel
  状态恢复、Controller/Worker 调度、确定性 guard 与 ledger writeback
        ↓
Codex-like Agents
  语义 Controller 与受边界约束的 Worker 执行
        ↓
Arckit Skills
  可复用协议、事实维护方法、诊断方法、schema 与 trusted entrypoints
        ↓
Project Repository
  Project/Case ledger、稳定事实、代码、证据与 handoff
```

- **Desktop** 拥有产品和运行控制界面，让人观察状态、发起对话、授权执行、暂停或纠正运行。
- **Runtime** 拥有 Loop 控制、capability policy、执行 gate 和写回协调；它保持 policy-neutral，不复制 Controller 语义或 ledger 工作流。
- **Codex 类 Agent** 负责语义推理、工作区执行、证据收集和结构化 claims。
- **Skills** 位于能力底层，声明自己的触发场景、输入、输出、写入边界和禁止决策。

Runtime 的详细行为和命令见 [ArcOrbit](runtime/arcorbit/README.md)。

## 能力分层与可替换边界

当前仓库中的所有 skills，都是飞天橙子团队在真实项目中持续实践、验证和沉淀下来的 Arckit 能力。分层是为了说明每类能力在完整框架中承担什么职责，以及它们如何协作；它不是重要性排序，也不表示 `entry/` 之外的能力可有可无。按它们在 state-driven loop 中承担的职责，可以分成三层：

```text
状态驱动核心    entry/                         Controller 语义 + canonical ledger
事实与工程能力  definition/ + engineering/     预期事实维护 + 通用工程诊断
具体编码能力    code/                          项目技术栈实践 + 专项接入
手动上下文能力  memory/                        显式按需的 pending 记录与整理
                         ↑
                  ArcForge 管理来源、类型、安装与 drift
```

### 第一层：`entry/` 状态驱动核心系统

`entry/` 下的两个 skill 共同构成 Arckit 在 skills 层的最小核心系统：一个负责理解和推进状态，另一个负责可靠保存状态。

| 执行平面 | Skill | 核心职责 |
| --- | --- | --- |
| Controller | [`using-arckit`](entry/skills/using-arckit/) | 从 Project State 选择 Case、从 Case 选择真实 gap，计划一次 transition，形成 Worker packet，接收 report，并区分 round outcome、Case resolution、Project impact 与 handoff |
| Runtime | [`arckit-development-ledger`](entry/skills/arckit-development-ledger/) | 维护 Project、Iteration、Case canonical state，通过 trusted entrypoint 审计 transition、原子写回并重新派生 gap 与 handoff |

`using-arckit` 提供 state-driven loop 的语义：每一轮为什么开始、选择什么 gap、接受哪些 claims、下一步交给谁。`arckit-development-ledger` 提供确定性状态内核：schema、revision、审计、原子提交和可恢复投影。前者不直接写 ledger，后者不替 Agent 做语义判断；两者合在一起，才让人工对话和 Runtime 自动桥接能够沿同一条 Project State → Case → Loop 主轴推进。

这里的“核心系统”特指 skills 层的状态驱动内核。Desktop 仍负责产品与人工控制，Runtime 仍负责调度、gate 和 writeback 协调，Codex 类 Agent 仍负责语义推理与工作区执行。`entry/` 让项目能够按同一套状态语义持续推进，后续两层则让每次 Loop 拥有经过实践验证的事实维护、工程诊断和具体实现能力；三层共同组成完整的 Arckit 能力框架。

Controller 不能绑定给普通 Worker，ledger 也只能由 Runtime 调用其受信任入口。非法、未知或越过执行平面的绑定会失败关闭，而不是被静默忽略。

### 第二层：`definition/` 与 `engineering/` 事实与工程能力

这一层把 state-driven loop 落到真实软件项目的事实治理和工程推进中。`definition/` 负责把已经确认的产品、交互、视觉和技术预期维护成稳定事实，使下一轮 Agent 不依赖对话记忆重新猜测项目；`engineering/` 提供开发过程中可复用、技术栈无关的工程能力，让问题诊断和必要修复建立在可复现证据上。这些都是 Arckit 随仓库交付的一等 Worker 能力。

| 能力域 | Skill | 主要职责 |
| --- | --- | --- |
| Definition | [`arckit-spec`](definition/skills/arckit-spec/) | 维护产品行为、业务规则、功能规格与验收口径 |
| Definition | [`arckit-interaction`](definition/skills/arckit-interaction/) | 维护页面级交互策略、状态、异常恢复、灰度线框与交互规范 |
| Definition | [`arckit-visual`](definition/skills/arckit-visual/) | 维护视觉策略、Design Tokens、主题、组件视觉规格与预览 |
| Definition | [`arckit-tech`](definition/skills/arckit-tech/) | 维护技术方案、架构边界、数据模型、API 契约与技术决策 |
| Engineering | [`arckit-debug-diagnosis`](engineering/skills/arckit-debug-diagnosis/) | 通过复现、日志、代码和测试证据定位 bug、回归、数据异常与性能退化，并约束必要修复 |

定义类 skill 既可在 managed Case 中返回 `fact_result`，也可独立查询或维护对应事实源。它们只接受已经确认的稳定预期；未确认假设、方案权衡或视觉方向应继续留在 active Case，而不是写成事实。

Arckit 推荐直接使用这些经过验证的能力，形成从状态识别、稳定事实维护到工程诊断的完整闭环。框架同时保留能力扩展边界：如果用户已经拥有职责等价、同样成熟的规格、设计、架构或诊断 skill，可以把自己的能力接入 Worker 层，而不必改变 Controller 和 ledger 的核心语义。这里的“等价”不是名称相似，而是能够接受有边界的 Worker packet、遵守事实与写入边界，并返回可验证 evidence 和结构化 claims。

当前 Runtime policy 刻意收敛为 7 个受管能力：1 个 Controller、1 个 Runtime ledger 和上述 5 个 Worker，并通过 [capability policy](runtime/arcorbit/config/capability-policy.json) 分到互斥执行平面。若要让自动化 Runtime 调用用户自己的等价 Worker，必须显式提供相应 capability manifest 并修改 policy，或者把工作交给明确的 external adapter；只替换已安装目录中的 skill 名称不会自动生效。

### 第三层：`code/` 具体编码与专项接入能力

`code/` 面向具体语言、框架、平台、SDK 或云服务，把上游已经明确的目标和事实真正落成高质量实现。它们沉淀了飞天橙子在具体技术栈和专项接入中的工程实践，并按适用范围进入相关项目或在需要时加载。它们不会仅因为位于本仓库就自动进入 Runtime capability policy，而是由 Agent、项目上下文或显式 policy 在合适的 Loop 中选择。

| Skill | 推荐可用性 | 主要职责 |
| --- | --- | --- |
| [`arckit-code-swiftui`](code/skills/arckit-code-swiftui/) | 项目级常驻 `project-ambient` | 为实际采用 SwiftUI 的 Apple 客户端项目提供默认架构、工程结构、状态模型、平台能力和验证实践 |
| [`arckit-feedback-platform-integration`](code/skills/arckit-feedback-platform-integration/) | 用户级按需 `user-on-demand` | 在需要时指导 Web、iOS、Android 或 WebView 产品接入反馈平台 |
| [`oss-controlled-image-access`](code/skills/oss-controlled-image-access/) | 用户级按需 `user-on-demand` | 在需要时推进阿里云 OSS 图片资源从公开直链迁移到服务端可控访问 |

项目级 skill 只应安装到满足适用条件的目标项目；用户级按需 skill 进入 ArcForge catalog，在用户明确调用时再加载，不应长期暴露在每个 Agent 的常驻 skill 列表中。代码审查、发布、运维、商业决策等当前未保留能力仍交给项目工具、用户自选 skill 或明确的 external adapter。

`memory/skills/arckit-pending/` 同样采用用户级按需模式。它只在用户显式调用时维护目标项目的 `arckit/pending/`，不自动接收 Runtime handoff，不替代 active Case，也不进入 Runtime capability policy。

## 项目中的事实与状态

安装后的 skills 主要维护目标项目中的这些路径：

| 路径 | 角色 |
| --- | --- |
| `arckit/project/` | Project State、Iteration State 及其可读投影 |
| `arckit/cases/active/` | 尚未解决的 Case canonical record |
| `arckit/cases/closed/` | 已通过审计并关闭的 Case record |
| `arckit/spec/` | 稳定产品规格与验收事实 |
| `arckit/interaction/` | 稳定交互策略、交互规范和灰度线框 |
| `arckit/visual/` | 稳定视觉策略、tokens、主题和组件规格 |
| `arckit/tech/` | 稳定技术方案、模型、契约与决策 |
| `arckit/debug/` | 诊断期间由真实复现产生的临时运行日志；完成后按规则清理 |

canonical state 只引用持久、可恢复的 evidence，不把 `/tmp` 等临时路径当成事实依据。Case transition 绑定 expected revision 和完整 selected gap；成功写回后必须重新读取状态再规划下一轮。

## 为什么使用 ArcForge 安装

推荐通过 [ArcForge](https://github.com/feitianchengzi/arcforge.git) 安装和治理 Arckit。ArcForge 是本地优先、GitHub 优先的 Agent skill 治理工作台：它负责识别来源、审计、应用、同步和 drift 检查，不替代 Codex、Claude、Cursor 等 Agent Runtime，也不是 Arckit 执行时必须依赖的上层 Runtime。

Arckit 不适合靠“复制整个仓库到用户 skills 目录”安装，原因是三层能力具有不同的适用范围和生命周期：

- **保持完整框架的职责分层**：核心、事实与工程、具体编码能力各自进入合适位置，不因安装方式混在同一个用户级目录中。
- **把 skill 放到正确位置**：用户常驻、项目常驻和用户按需是三种不同的可用性；ArcForge 会按 `arcforge.skill-project.json` 解析目标，而不是把所有内容都塞进用户级目录。
- **检查项目适用性**：`arckit-code-swiftui` 只有在目标项目确实包含 SwiftUI / Apple 客户端工作时才应进入项目目录。
- **提供按需发现**：Pending、反馈平台与 OSS 能力保存在用户级 catalog，通过轻量 loader 显式加载，减少常驻上下文和误触发。
- **维持来源与应用目标分离**：当前仓库是维护源和 source of truth，Codex、Claude、Cursor 的用户级或项目级目录只是消费副本。
- **支持安全更新**：安装前可以先看 plan 与 drift，识别缺失、变更、旧副本和覆盖风险；在支持的应用模式中还可以保存来源关系，便于后续复查和重新应用。

推荐安装 `entry/`、`definition/` 与 `engineering/` 下的完整协作能力，让状态驱动内核、预期事实维护和通用工程诊断可以直接闭环工作；`memory/` 与 `code/` 下的能力再按显式按需或项目适用性使用。已经拥有成熟等价能力的团队，可以在保持 Worker packet、evidence、claims、写入边界和 capability manifest 契约的前提下，用自己的 skill 替换对应职责。

如果还没有安装 ArcForge，请打开 ArcForge 仓库并让 Agent 执行：

```text
执行 skills/arcforge-install
```

安装完成后，选择 `arckit` 作为统一维护源。仓库根目录的 `arcforge.skill-project.json` 声明每个 skill 的推荐可用性：核心、事实维护与工程协作 skills 为用户级常驻，`arckit-code-swiftui` 为项目级常驻，`arckit-pending`、`arckit-feedback-platform-integration` 与 `oss-controlled-image-access` 为用户级按需。推荐保持以下关系：

```text
GitHub / 本地 Skill 项目     维护源与 source of truth
              ↓ ArcForge apply / drift
Agent 用户级或项目级目录     应用目标
```

不要把 Codex、Claude 或 Cursor 的已安装目录反过来当作维护源，也不建议手动复制整个仓库。ArcForge 通过来源策略、plan、drift、catalog 和受确认的 apply 减少漏文件、旧副本残留和误覆盖。

## 使用方式

### 在 Agent 对话中直接协作

安装 skills 后，可以让支持 Agent skills 的编码 Agent 使用 `using-arckit` 进入项目对话。Controller 会先恢复 Project 和 active Case，再从当前 candidate gaps 中规划一次 transition。当前 Agent 可以在同一对话执行 Worker packet，也可以把 packet 交给其他 Agent，并把结构化 report 带回 Controller。

需要单独维护稳定事实或进行诊断时，也可以直接触发相应 Worker skill。此时 skill 仍遵守自己的事实边界，但不会自行推断或写回 Case resolution。

### 通过 Desktop / Runtime 自动桥接

Runtime 使用同一个 `using-arckit` Agent skill 完成 Controller Plan 和 Controller Review，通过 capability manifest 调用 ledger 的 trusted entrypoints，并在策略允许时自动派发 Worker。Desktop 是推荐的可视化产品入口。

快速启动开发版 Desktop：

```bash
cd runtime/arcorbit
npm install
npm run desktop
```

也可以使用 Runtime CLI 初始化项目、预览 Controller frame 或执行自动 Loop；完整命令和 gate 语义见 [Runtime README](runtime/arcorbit/README.md#commands)。

## 仓库结构

```text
entry/                         项目对话 Controller 与 development ledger
definition/                    产品、交互、视觉和技术稳定事实维护
engineering/                   技术栈无关的工程诊断
code/                          语言、框架、平台、SDK 与云服务 coding skills
memory/                        显式按需的项目上下文维护能力
runtime/arcorbit/        Desktop 与状态驱动 Runtime 控制面
arckit/                        本仓库自身的项目状态、历史材料和验证证据
```

`idea/`、`thinking/`、`iteration/`、`media/`、`quality/`、`delivery/` 是预留能力域，目前没有保留的 Arckit skill。`memory/skills/arckit-pending/` 是用户显式加载的手动上下文维护能力；目标项目里的 `arckit/pending/` 是它维护的项目资料，不是 skill source，也不会进入 Runtime capability policy。archive、closed Case 和 Runtime evidence 中的历史 `SKILL.md` 文本同样不是当前 skill source。

## Skill 设计与收录原则

每个 skill 必须是对应能力域 `skills/` 下的自包含目录，至少包含 `SKILL.md`，并使用 lowercase kebab-case 命名。需要参与 Runtime 的能力还应通过 `arckit.capability.json` 显式声明调用方式、执行平面、输入输出、允许写入路径和禁止决策。

Skill 之间可以软协作，但不能依赖隐藏的 skill-to-skill import。推荐关系是“上游分析或证据 → 下游事实维护”，每个产物 skill 仍需独立说明自己的输入、输出和维护流程。Runtime 对 skill 的显式调用只能通过 capability manifest：语义工作使用 Agent skill trigger，确定性脚本使用 skill 内声明的 trusted entrypoint。

新增或修改 skill 时，应确认：

- 来自真实项目中的高频或高价值问题，而不是抽象角色想象。
- 触发场景、输入、输出、停止条件和事实边界足够明确。
- 能产生可验证结果，不绕过授权、人类判断或项目已有改动。
- primary purpose 符合所在能力域；具体语言、框架、平台、SDK 或云服务 coding workflow 应进入 `code/skills/`。
- 外部内容已注明来源、完成安全审查，并说明本地化适配原因。
- 修改经过真实场景验证，且没有恢复已移除 skill 的隐式依赖。

详细的仓库边界与目录规则见 [AGENTS.md](AGENTS.md)。

## 当前阶段

Arckit 当前优先验证的是：不同执行桥能否基于同一组仓库事实，以相同的 Project State → Case → Loop 语义推进真实软件项目；Runtime 能否保持确定性、可观察和 policy-neutral；Agent 能否在明确边界内完成事实维护、诊断、实现协作和安全交接。

能力扩展会继续来自真实项目反馈。新增能力必须先证明它能提高项目状态恢复、事实治理、handoff 质量、实现边界、诊断可靠性或安全续接，而不是仅仅增加一个新的 Agent 角色名称。

## License

- Arckit 及仓库中没有更具体许可证的内容： [Apache License 2.0](LICENSE)。
- `runtime/arcorbit/`： [PolyForm Perimeter License 1.0.1](runtime/arcorbit/LICENSE)。
- 商业授权、OEM、白标或竞争性产品与服务：`hi@feitianchengzi.com`。
- 商标规则与第三方组件边界见 [TRADEMARKS.md](TRADEMARKS.md) 和 [LICENSING.md](LICENSING.md)。
