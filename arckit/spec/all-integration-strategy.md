# all 候选 Skill 整合策略草案

更新时间：2026-06-15

## 1. 背景

`all/` 是同事提供的一套产品研发全生命周期 skill 体系。它以岗位角色组织能力，覆盖市场洞察、产品决策、PRD、设计、架构、领域建模、前后端实现、验证、代码审查、发布和运营监控。

本仓库 Arckit 的定位不是堆放多套平行 skill，而是维护一组经过审查、可组合、可长期复用的软件项目协作能力。当前 Arckit 已按能力域组织 source of truth：

- `entry/skills/`：入口路由和工作流组合。
- `idea/skills/`：机会、创意和早期探索。
- `thinking/skills/`：过程型思考能力，包括分析、推理、决策、草案生成、候选方案比较、批评修正和结果入库前的 handoff 准备。
- `definition/skills/`：结果型事实源维护能力，包括产品规格、交互、视觉和技术事实的结构、落点、索引、拆分、归档和正文规范。
- `iteration/skills/`：项目治理、迭代、任务和执行桥。
- `memory/skills/`：原始输入、未决上下文和项目记忆。
- `engineering/skills/`：技术栈无关的诊断和工程协作。
- `quality/skills/`：验证、审查和质量门禁。
- `delivery/skills/`：发布、部署、运行和故障处理。

因此，`all/` 应作为候选素材包进行吸收，不应以原目录结构直接成为正式 Arckit 体系。

## 2. 整合目标

整合目标是保留 `all/` 中有价值的方法、纪律、模板、脚本和贡献痕迹，同时遵守 Arckit 的原子能力和目录规范。

最终状态应满足：

- ArcKit 仍只有一套正式能力入口。
- 新增或从 `all/` 迁移的正式 skill 默认使用 `arckit-` 前缀；`using-arckit` 是默认入口命名例外。本轮已前缀化迁移 `decision-framework` 和 `project-governance-workflow`；后续若再发现非 `arckit-` 前缀正式 skill，需要记录旧名、目标名、触发面变化和过渡兼容方式。
- 角色视角被保留为显式协作层，而不是基础 skill 单元。
- 过程 skill 与结果 skill 分离：过程 skill 负责推理、生成草案和准备 handoff；结果 skill 负责维护 `arckit/` 长期事实源。
- 现有 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech` 的核心定义不扩展为生成型流程，只轻量增强其接收外部草案或 handoff 的能力。
- 具体技术栈编码 skill 长期归属 `arckit-code` 或外部引用，不放入本仓库正式能力；本轮不迁移、不确定 `arckit-code` 命名空间，只记录问题和候选素材。
- 所有稳定产物默认落入目标项目的 `arckit/` 工作区，而不是 `all/output` 或独立 `data/` 体系。
- 有复用价值的脚本跟随对应能力迁移，并明确副作用、输入、输出和降级方式。

## 3. 核心判断

### 3.1 角色不是原子能力

`all/` 以 PM、设计师、架构师、工程师、QA、Tech Lead、SRE 等角色组织内容。这个视角对理解研发协作有帮助，但不适合作为基础 skill 划分。

一个角色通常由多种能力组成：

| 角色 | 可能组合的 Arckit 能力 |
| --- | --- |
| PM | 市场洞察、决策判断、规格维护、治理推进 |
| Designer | 交互策略、视觉系统、页面状态、文案规则 |
| Architect | 技术方案、ADR、领域建模、API 契约 |
| Engineer | 外部 `arckit-code` 编码技能、调试诊断、实现反馈 |
| QA / Lead | 验证证据、代码审查、质量门禁 |
| SRE | 发布准备、灰度、回滚、运行监控、故障处理 |

因此角色协作应作为显式触发的组合 skill，而不是默认入口。

### 3.2 all 不是强阻断流程

`all/` 的设计是强引导流程，不是硬阻断流水线。它强调：

- 每个 skill 独立可运行。
- 上游产物存在时增强质量。
- 上游产物缺失时降级运行并标注风险。
- `orchestrate` 只生成编排计划，不替代各岗位 skill。

这个思想与 Arckit 的组合原则兼容，但需要从 `output/` 文件扫描模型改为 Arckit 工作区事实源模型。

### 3.3 all 的价值在规则和工具，不在目录

`all/` 的优点包括：

- 铁律和反合理化表能抑制 agent 偷懒、脑补、跳验证、空泛赞美和过度自信。
- `quality` 和 `delivery` 相关能力能补齐当前 Arckit 空白。
- 大量脚本能把部分规则变成可执行检查或生成器。
- 角色链路能帮助用户理解多角色协作。

主要缺点包括：

- 与 Arckit 现有能力重叠。
- 角色和能力混在一起。
- 包含具体前后端编码 skill，越过本仓库边界。
- 部分 `SKILL.md` 过长，context 成本较高。
- 产物体系依赖 `output/`、`data/` 和文件名 glob，未对齐 Arckit 工作区。
- 部分脚本是启发式检查，适合作提醒，不适合作硬阻断。

### 3.4 过程 skill 和结果 skill 必须分离

现有 Arckit 定义类 skill 的核心是结果维护，而不是生成过程：

- `arckit-spec` 维护 `arckit/spec/` 下的稳定产品行为事实。
- `arckit-interaction` 维护 `arckit/interaction/` 下的页面交互策略、状态和灰度线框投影。
- `arckit-visual` 维护 `arckit/visual/` 下的视觉策略、Design Tokens、主题和组件视觉规格。
- `arckit-tech` 维护 `arckit/tech/` 下的技术方案、架构说明、数据模型和 API 契约。

这些结果 skill 的核心职责是：

- 约定产物位置和目录结构。
- 维护 `INDEX.md` 和必要映射。
- 判断查询或变更。
- 执行域归属判定、动态拆分、归档和行数更新。
- 把内容改写成稳定事实源语体。
- 输出 `document_scope`。

它们不应内置某个固定的生成流程。`all/` 中的 `prd-gen`、`design`、`arch` 更适合作为过程 skill：负责分析输入、推导候选、生成草案、批评修正和输出 handoff。这里的“过程 skill”不要求必须是通用思考方法，只要它承担的是可替换的分析、生成、比较或批评过程，就适合放入 `thinking/skills/`。未来不同团队可以替换过程 skill；当 agent 能力足够强时，也可以绕过过程 skill，直接由结果 skill 维护结果。

## 4. 总体整合策略

使用以下处理方式：

| `all/` 内容类型 | 处理方式 |
| --- | --- |
| 角色协作视角 | 提炼为显式触发的 `entry` 协作 skill |
| 早期外部市场研究能力 | 新建 `idea/skills/arckit-market-research` |
| 与现有结果 skill 相关的生成/推理方法 | 拆成 `thinking/skills/` 下的过程 skill |
| 现有结果 skill | 保持核心定义不变，只增强“接收 handoff 并入库”的说明 |
| 当前 Arckit 缺失的质量/交付能力 | 新建 `arckit-` 前缀正式 skill 补齐 |
| 具体技术栈编码能力 | 长期归属 `arckit-code`，本轮忽略不迁移 |
| 脚本 | 跟随目标能力迁移，去中心化 |
| 模板和长示例 | 放入目标 skill 的 `references/` 或 `templates/` |
| 启发式检查 | 默认 warning，不做硬阻断 |
| `output/` 上游检测模型 | 改为读取目标项目 `arckit/` 工作区和索引 |

早期市场研究虽然也是过程能力，但主要动作是外部证据采集和机会识别，归入 `idea/skills/`；规格草案、产品设计探索、架构决策、领域建模等生成/推理过程归入 `thinking/skills/`。

过程 skill 与结果 skill 通过 `process_handoff` 或领域化 handoff 连接。过程 skill 不直接维护 `arckit/*` 事实源，除非用户明确要求继续进入结果入库阶段并由对应结果 skill 执行。

### 4.1 正式 skill 写法要求

从 `all/` 迁移时，不应只搬运原文。每个正式 skill 都要按新的 skill 要求重新收敛：

- `SKILL.md` 的 frontmatter 只保留 `name` 和 `description`；description 必须说明能力做什么、何时触发、何时不该触发。
- `SKILL.md` 正文只保留核心工作流、必要约束和资源路由，避免长篇背景、角色宣言、重复解释和泛化口号。
- 大模板、长示例、检查清单和领域说明放入 `references/` 或 `templates/`，由 `SKILL.md` 明确什么时候读取。
- 稳定、重复、易错的操作才放入 `scripts/`；脚本必须说明输入、输出、副作用和失败时如何降级。
- 原子能力 skill 不使用“我是 PM / 设计师 / 架构师”等角色身份作为触发或职责边界。
- 过程 skill 默认只输出草案、候选、批评结论或 `process_handoff`，不直接维护 `arckit/*` 长期事实源。
- 结果 skill 可以接收过程 handoff，但只沉淀已确认事实；假设、缺口和风险必须保留标记，不能静默写成规格或方案。
- 如果一个迁移项需要多个详细分支，优先在 `SKILL.md` 中放选择规则，再把分支细节放入同级 reference 文件，避免一次加载过多上下文。

### 4.2 命名规则

新增或从 `all/` 迁移的正式 skill 使用以下命名规则：

- 默认使用 `arckit-` 前缀。
- 原名足够达义时可保留为后缀，以减少贡献来源和语义映射损耗。
- 原名过于角色化、过宽、过窄、缩写化或与现有能力容易混淆时，使用更描述性的名称，并在文档中记录来源。
- `using-arckit` 作为默认入口 skill 保留命名例外；除此之外，现有非 `arckit-` 前缀的正式 Arckit skill 后续都应迁移到 `arckit-` 前缀。
- 非前缀 skill 的改名不必和本轮 `all/` 整合强绑定，但需要在迁移计划中记录旧名、目标名、触发面变化和过渡兼容方式。

二次复核后的推荐名：

| `all/` 原名 | 不建议直接使用 | 推荐正式名 | 说明 |
| --- | --- | --- | --- |
| `insight` | `arckit-insight` | `arckit-market-research` | `insight` 过泛；该能力主要是竞品、行业趋势和用户反馈采集，放入 `idea/skills/` 更达义 |
| `decide` | `arckit-decide` | `arckit-decision-framework` | 仓库已有 `decision-framework`；采用直接前缀迁移能降低触发漂移和迁移成本，同时保留“决策框架”语义 |
| `prd-gen` | `arckit-prd-gen` | `arckit-draft-spec` | Arckit 结果层叫 spec，不应把 PRD 格式固化为核心概念；该过程负责生成规格草案 |
| `design` | `arckit-design` | `arckit-explore-product-design` | `design` 太宽，容易和 `arckit-interaction`、`arckit-visual` 混淆；该能力是产品设计探索过程 |
| `arch` | `arckit-arch` | `arckit-architecture-decision` | `arch` 是缩写且过泛；该能力核心是架构决策、技术选型和 ADR |
| `model` | `arckit-model` | `arckit-domain-modeling` | `model` 太泛；该能力核心是 DDD 领域建模 |
| `verify` | `arckit-verify` | `arckit-verify-implementation` | `verify` 过宽；该能力验证实现是否可用，和 code review 区分 |
| `review` | `arckit-review` | `arckit-code-review` | `review` 过宽；该能力明确审代码质量和规格符合度 |
| `ship` | `arckit-ship` | `arckit-release-readiness` | `ship` 偏口语；该能力核心是发布前门禁、灰度和回滚准备 |
| `operate` | `arckit-operate` | `arckit-runtime-operations` | `operate` 过宽；调试部分进入 `arckit-debug-diagnosis`，剩余能力是运行监控和运维 |
| `orchestrate` | `arckit-orchestrate` | `arckit-role-orchestration` | `orchestrate` 过泛；该能力是显式触发的角色协作/流程编排 |

### 4.3 实际项目使用路由规则

迁移后的 ArcKit 不应因为能力变多而默认跑完整链路。`using-arckit` 仍是默认入口，但它只负责选择最小必要 skill 集，而不是把所有过程和结果 skill 串成一个强流程。

默认路由优先级：

| 用户当前意图 | 默认 skill | 说明 |
| --- | --- | --- |
| 查竞品、看趋势、找用户评价、补外部证据 | `arckit-market-research` | 输出外部证据和市场研究 handoff，不直接沉淀规格 |
| 判断是否值得做、比较方案、拆假设 | `arckit-decision-framework` | 可独立输出决策片段，也可把判断交回主 workflow |
| 探索一个产品创意、模拟用户、生成线框 | `arckit-idea-explore` | 可读取市场研究结果作为增强输入 |
| 登记或更新商机/产品创意 | `arckit-idea` | 只做长期留痕和索引维护 |
| 草拟产品行为规格 | `arckit-draft-spec` | 只输出规格草案或 handoff，除非用户明确要求入库 |
| 维护稳定产品行为事实 | `arckit-spec` | 只沉淀已确认事实 |
| 探索交互和视觉候选 | `arckit-explore-product-design` | 输出交互/视觉候选，不直接写结果事实源 |
| 维护交互或视觉事实 | `arckit-interaction` / `arckit-visual` | 分别维护对应结果目录 |
| 做架构决策或领域建模 | `arckit-architecture-decision` / `arckit-domain-modeling` | 输出技术 handoff |
| 维护技术方案、模型或 API 契约 | `arckit-tech` | 只沉淀已确认技术事实 |
| 实现、改代码、接入具体技术栈 | `arckit-code` 或普通代码工作流 | 本仓库不承载正向 coding skill |
| 验证实现、审查代码、准备发布、观察运行 | `arckit-verify-implementation` / `arckit-code-review` / `arckit-release-readiness` / `arckit-runtime-operations` | 必须先明确 scope |
| 多角色、端到端、完整研发链路 | `arckit-role-orchestration` | 只在显式触发时生成计划 |

默认最短路径规则：

- 不因为用户提出软件项目请求就默认跑完整研发链路。
- 不因为存在 `arckit-role-orchestration` 就默认进入角色编排。
- 用户说“生成/草拟/先看看”时，默认只输出过程草案或 handoff。
- 用户说“生成并沉淀/写入 arckit/”时，才在过程 skill 完成后调用对应结果 skill。
- 用户说“按完整流程推进/多角色协作/从想法到上线”时，才触发 `arckit-role-orchestration`。
- 如果用户授权“按计划继续执行”，`arckit-role-orchestration` 输出计划后可以继续进入第一步 skill；否则先等待确认。
- 即使用户要求完整流程，也必须按当前项目阶段裁剪，不默认执行从市场研究到运行期观察的全生命周期链路。
- 用户问“做什么、怎么表现、规则是什么、技术怎么定”时，优先进入定义或对应过程 skill；用户问“怎么推进、排期、拆任务、验收、复盘、路线图”时，优先进入治理 skill。

### 4.4 handoff 入库规则

结果 skill 接收 handoff 时必须保持 source of truth 边界：

- `accepted_facts` 可以进入结果事实源，但仍要经过结果 skill 的 INDEX、域归属、拆分和正文语体规则。
- `assumptions`、`gaps`、`risks`、`rejected_items` 不能静默写成规格、交互、视觉或技术事实。
- 未确认但有价值的上下文应交给 `arckit-pending`，或保留在过程输出中等待用户确认。
- `suggested_paths` 只是建议落点，不能绕过结果 skill 的域归属判定。
- 结果 skill 入库后仍必须输出自己的 `document_scope`，过程 handoff 不能替代结果 skill 的输出契约。

四个定义类结果 skill 需要轻量增强同类分支：

```text
输入是 process_handoff:
1. 识别 target_result_skill 是否匹配当前 skill。
2. 只提取 accepted_facts 作为候选事实。
3. 将 assumptions/gaps/risks/rejected_items 保留为未承诺上下文。
4. 按当前 INDEX 和域归属规则决定落点。
5. 更新结果文档和 INDEX。
6. 输出 document_scope。
```

## 5. 阶段计划

### 阶段 A：补齐低冲突空白能力

优先吸收当前 Arckit 空白且与现有 skill 冲突小的部分：

| 新目标 | 来源 | 主要保留内容 |
| --- | --- | --- |
| `quality/skills/arckit-verify-implementation/` | `all/04-engineer/verify` | 新鲜验证证据、测试报告、E2E、性能和安全验证门禁 |
| `quality/skills/arckit-code-review/` | `all/05-lead/review` | 两阶段审查、C/I/M 分级、反谄媚、YAGNI 检查 |
| `delivery/skills/arckit-release-readiness/` | `all/06-sre/ship` | 发布门禁、灰度策略、发布确认、回滚方案 |
| `delivery/skills/arckit-runtime-operations/` | `all/06-sre/operate` 的监控部分 | 健康检查、基线采集、告警规则、运行报告 |

这一阶段不处理角色协作和具体编码。

### 阶段 B：拆出过程 skill，保护结果 skill 核心

把 `all/` 中与现有结果 skill 相关的生成/推理能力拆成过程 skill。外部市场研究放入 `idea/skills/`，其它规格、设计、架构和建模过程放入 `thinking/skills/`。结果 skill 只接收这些过程产物作为输入，不吸收其核心流程。

| 来源 | 目标 | 处理方式 |
| --- | --- | --- |
| `all/01-pm/insight` | `idea/skills/arckit-market-research` | 新建外部市场证据采集过程 skill，吸收竞品、行业趋势、用户公开反馈和差异化机会研究；`arckit-idea-explore` 只引用其输出作为增强输入 |
| `all/01-pm/decide` | `thinking/skills/arckit-decision-framework` | 在原 `decision-framework` 基础上前缀化迁移，合并第一性原理、价值评估、苏格拉底追问、假设脆弱度评估；保持过程型决策能力定位 |
| `all/01-pm/prd-gen` | `thinking/skills/arckit-draft-spec` | 作为规格草案生成过程，输出给 `arckit-spec` 的 handoff |
| `all/02-design/design` | `thinking/skills/arckit-explore-product-design` | 作为产品设计探索过程，输出给 `arckit-interaction` 和 `arckit-visual` 的 handoff |
| `all/03-architect/arch` | `thinking/skills/arckit-architecture-decision` | 作为架构决策过程，输出给 `arckit-tech` 的 handoff |
| `all/03-architect/model` | `thinking/skills/arckit-domain-modeling` | 优先独立为领域建模过程 skill，输出给 `arckit-tech` 的模型/上下文 handoff |
| `all/06-sre/operate` 的调试部分 | `engineering/skills/arckit-debug-diagnosis` | 合并四阶段根因调查、三次失败后审视架构、调试报告 |

这一阶段的原则是：结果 skill 名称、触发表面和产物规则不扩大；过程 skill 可替换、可禁用、可由 `using-arckit` 按用户意图组合。

### 阶段 C：角色协作显式化

新建一个显式触发的角色协作 skill，建议路径：

```text
entry/skills/arckit-role-orchestration/
```

触发条件应非常明确，例如：

- 用户要求“按角色协作”。
- 用户要求“模拟 PM、设计、架构、工程、QA、SRE 的团队流程”。
- 用户要求“从想法到上线跑完整研发链路”。
- 用户要求“组织多角色交接计划”。

该 skill 只负责：

- 识别协作范围。
- 把角色映射到原子能力 skill。
- 生成执行顺序、交付物交接清单和降级提醒。
- 在需要时建议使用子代理隔离上下文。

该 skill 不负责：

- 直接承担市场洞察、PRD、设计、架构、编码、验证、发布等岗位工作。
- 默认加载全部能力。
- 把上游缺失设计为硬阻断。

建议输出契约：

```yaml
orchestration_plan:
  source_skill: arckit-role-orchestration
  trigger_reason: ""
  collaboration_scope: ""
  selected_roles: []
  selected_skills: []
  execution_order: []
  handoff_checkpoints: []
  missing_inputs: []
  degradation_notes: []
  requires_user_confirmation: []
```

`orchestration_plan` 只是执行计划，不代表已经调用其中列出的 skill，也不写入任何长期事实源。若用户只提出普通单点需求，入口 skill 不应默认转入该角色编排。

### 阶段 D：具体编码能力本轮暂缓

`all/04-engineer/build`、`build-fe`、`build-be` 原则上属于 `arckit-code` 仓库范围，不进入本仓库正式能力。但本轮不迁移这些 coding skill，只记录问题并暂时忽略。

| 来源 | 处理 |
| --- | --- |
| `all/04-engineer/build` | 本轮忽略；只保留“前端/后端/全栈路由”作为后续参考，不迁成正式 skill |
| `all/04-engineer/build-fe` | 本轮忽略；后续若迁移，应重新整理为 Web 前端 coding skill，而不是原样搬目录 |
| `all/04-engineer/build-be` | 本轮忽略；后续若迁移，应重新整理为 API 服务 coding skill，而不是原样搬目录 |
| `all/04-engineer/build/scripts/*` | 本轮忽略；多数脚本未被 `build/SKILL.md` 调用，且依赖旧产物格式 |
| `all/04-engineer/build-fe/scripts/*` | 本轮忽略；可作为后续 Web 前端 skill 的候选脚本 |
| `all/04-engineer/build-be/scripts/*` | 本轮忽略；可作为后续 API 服务 skill 的候选脚本 |

暂缓原因：

- `build/` 本身只是路由壳，但目录下 `red-flags.md`、`tdd-antirationalization.md`、`check_tdd.py`、`extract_from_arch.py`、`extract_from_model.py`、`scaffold.py` 都没有被 `build/SKILL.md` 实际引用，资源和流程脱节。
- `build-fe/` 和 `build-be/` 的 `SKILL.md` 过长，许多具体示例直接写在正文中；references 主要在末尾列名，没有形成清晰的渐进加载规则。
- `extract_from_arch.py`、`extract_from_model.py` 依赖 `all` 旧产物格式，不能直接适配 Arckit 的 `arckit/tech` 结果文档。
- `scaffold.py`、`scaffold_fe.py`、`scaffold_be.py` 会生成具体技术栈模板和安装命令，迁移前需要重新确认它们是否符合 `arckit-code` 现有 skill 风格。
- 目录内存在 `__pycache__` 等运行产物，正式迁移前需要清理。

后续若单独迁移，应从 `arckit-code-swiftui` 和 `arckit-feedback-platform-integration` 的现有结构重新设计：一个正式 skill 对应一个具体技术域、平台或 SDK 接入能力，`SKILL.md` 只保留核心流程，细节进入该 skill 自己的 `references/`、`architecture/`、`scripts/` 或 `templates/`。

### 阶段 E：既有非前缀 skill 命名清理

该阶段不属于 `all/` 内容迁移本身，但会影响入口路由和后续文档一致性，应单独处理：

| 现有 skill | 目标名 | 处理方式 |
| --- | --- | --- |
| `thinking/skills/decision-framework` | `thinking/skills/arckit-decision-framework` | 已直接前缀化迁移；吸收 `all/01-pm/decide` 的可复用模板和脚本 |
| `iteration/skills/project-governance-workflow` | `iteration/skills/arckit-project-governance-workflow` | 已直接前缀化迁移；不改变治理模型 |
| `entry/skills/using-arckit` | 保持 `using-arckit` | 默认入口命名例外 |

改名完成后已同步更新 `using-arckit` 的路由表和主要文档引用。`using-arckit` 可以按用户意图选择 `arckit-market-research`、`arckit-decision-framework`、`arckit-draft-spec` 等过程 skill，但不能因为它是入口就默认触发 `arckit-role-orchestration`。

## 6. 过程 skill 与结果 skill 的接口

### 6.0 通用 handoff 最小契约

过程 skill 默认不直接写入 `arckit/*` 长期事实源，而是输出 handoff。不同领域可以扩展字段，但最小契约应保持一致：

```yaml
process_handoff:
  kind: ""
  source_skill: ""
  target_result_skill: ""
  suggested_root: ""
  suggested_paths: []
  source_refs: []
  accepted_facts: []
  assumptions: []
  gaps: []
  evidence: []
  risks: []
  rejected_items: []
```

字段含义：

- `accepted_facts` 只放可被结果 skill 考虑入库的稳定事实。
- `assumptions`、`gaps`、`risks` 和 `rejected_items` 不得被结果 skill 静默改写成事实。
- `suggested_paths` 只是建议落点，最终路径由结果 skill 按自己的 INDEX、域归属和拆分规则决定。
- `source_refs` 必须尽量引用 intake、pending、已有 `arckit/*` 文档、用户输入或外部来源，避免无法追溯的结论。
- 市场研究可使用领域化的 `market_research_handoff`，但仍应包含来源、事实、推断、假设、缺口和可信度。
- 如果 handoff 需要跨回合继续、暂不入库或等待用户确认，默认把摘要、来源、开放问题和建议下游交给 `arckit-pending`，而不是只留在对话中。

### 6.0.1 实现交接最小契约

本仓库不承载正向 coding skill，但定义、治理和质量流程需要能把工作稳定交给普通代码 workflow 或外部 `arckit-code`。进入编码前应形成最小 `implementation_handoff`：

```yaml
implementation_handoff:
  scope: ""
  source_docs: []
  tasks: []
  acceptance: []
  constraints: []
  evidence_expected: []
  open_questions: []
```

使用规则：

- `source_docs` 引用 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech`、governance task 或用户输入。
- `tasks` 必须足够小且可验证；如果缺少 Goal、Iteration 或验收证据，先回到 `arckit-project-governance-workflow`。
- `acceptance` 和 `constraints` 来自结果事实源；不能把过程 skill 的未确认假设当成实现要求。
- `evidence_expected` 描述完成后应提供的测试、截图、日志、diff、运行结果或 review 证据。

### 6.0.2 质量和交付证据查找顺序

`arckit-verify-implementation`、`arckit-code-review`、`arckit-release-readiness` 和 `arckit-runtime-operations` 不应只看当前 diff 或当前对话。默认按以下顺序找依据：

1. 用户当前请求和明确验收口径。
2. `arckit-project-governance-workflow` 中的 Task、Review、Decision、Roadmap 或 scope。
3. `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech` 中的稳定事实。
4. 代码 diff、commit、测试输出、构建日志、运行日志、监控指标或发布记录。
5. 若依据不足，输出 `blocked` 或 `pass_with_risk`，并说明缺少什么证据。

### 6.1 `insight` -> `idea/skills/arckit-market-research`

决策：新建 `idea/skills/arckit-market-research`，不把 `insight` 仅作为 `arckit-idea-explore` 的 reference。

目标：把 `insight` 从 PM 角色能力拆成早期外部证据采集过程 skill，用于采集竞品、行业趋势、用户公开反馈和差异化机会。它不直接生成产品规格，也不替代 `arckit-idea` 或 `arckit-idea-explore` 的长期记录和探索产物。

独立成 skill 的原因：

- 用户可能只要求“查竞品”“看趋势”“找用户评价”，这类任务不一定围绕一个已命名产品创意，也不应强制进入 `arckit/idea-explore/{idea-name}/` 产物流程。
- `insight` 的核心能力是外部证据获取、来源标注、交叉验证和信息缺口识别；`arckit-idea-explore` 的核心能力是围绕单个创意做假设、模拟用户、支持率判断和线框图。
- 市场研究输出可以同时服务 `arckit-idea-explore`、后续前缀化后的决策 skill、`arckit-draft-spec` 和 `arckit-explore-product-design`，不应被内嵌到某一个创意探索 skill。
- 外部信息采集涉及网络访问、渠道可用性、时间敏感性和降级方案，需要独立触发边界和输出契约。

迁移内容：

- 多平台信息源采集思路。
- 竞品分析、趋势分析、用户反馈归纳和差异化机会识别。
- 渠道路由和来源可信度标注。
- 可复用的数据采集脚本，但必须确认网络访问、副作用、来源合规性和当前 agent 环境是否真的支持对应渠道。

调整要求：

- 不使用 `arckit-insight` 作为正式名，避免过泛。
- 不保留“产品经理的眼睛”等角色身份表述。
- 不承诺 17+ 渠道都稳定可用；正式 skill 应优先使用当前 agent 可用的搜索、浏览和本地命令能力，CLI/MCP 渠道只作为可选增强。
- `check_channels.sh` 可作为轻量环境检查脚本迁移；`collect.py`、`generate_report.py` 本轮不迁，后续若使用必须改造为平台无关、可降级、可说明副作用的工具；不能把 Claude Code/WebSearch 等不可由脚本直接调用的能力伪装成脚本能力。
- 输出应标注来源、时间、可信度、观察、推断和待验证假设。
- 默认输出 `market_research_handoff` 或 `market_research_report`，不直接维护 `arckit/idea/`、`arckit/idea-explore/` 或 `arckit/spec/`。
- `arckit-idea-explore` 可在竞品分析阶段读取该输出作为增强输入，但不能内置或默认触发市场研究流程。
- 已确认的机会或创意需要长期留痕时，交给 `arckit-idea`；需要用户/假设/线框探索时，交给 `arckit-idea-explore`。

建议 handoff：

```yaml
market_research_handoff:
  kind: market_research
  source_skill: arckit-market-research
  target_candidate_skills:
    - arckit-idea-explore
    - arckit-idea
    - arckit-draft-spec
    - arckit-explore-product-design
  research_goal: ""
  collected_at: ""
  sources: []
  facts: []
  observations: []
  inferences: []
  signals: []
  assumptions: []
  gaps: []
  confidence: ""
```

### 6.2 `decide` -> `thinking/skills/arckit-decision-framework`

决策：将现有 `thinking/skills/decision-framework` 前缀化迁移为 `thinking/skills/arckit-decision-framework`，并吸收 `all/decide` 的可复用方法。不新建并行的 `arckit-decision-analysis`，避免决策类 skill 触发面分裂。

目标：让 `all/decide` 的决策方法进入 `thinking/` 过程能力，同时保留现有 `decision-framework` 的触发语义和用户心智。

迁移内容：

- `first-principles-template.md`
- `value-assessment-template.md`
- `socratic-template.md`
- `usage-guide.md` 中可复用部分
- `route_tool.py`
- `evaluate_assumptions.py`
- `generate_decision_doc.py`

调整要求：

- 删除“PM 大脑”等角色身份表述。
- 不把“决策”绑定到 PM 角色；它应作为所有生命周期阶段都可调用的过程方法。
- `SKILL.md` 保留工具选择逻辑和轻量嵌入规则。
- 大模板进入 `templates/`。
- 独立决策文件只在用户明确需要时生成；作为辅助方法时返回决策片段给主 workflow。
- 改名后同步更新 `using-arckit`、策略文档、README/AGENTS 中所有 `decision-framework` 引用。

### 6.3 `prd-gen` -> `thinking/skills/arckit-draft-spec`

目标：把 `prd-gen` 变成可替换的规格草案生成过程，而不是扩展 `arckit-spec` 的核心定义。

迁移内容：

- 四层输入覆盖评估。
- 简单/标准/复杂规格模板选择逻辑。
- PRD 模板中可转为规格模板的内容。
- `validate_prd.py` 中的章节质量检查。
- `context_collector.py` 和 `data_source.py` 中可平台无关复用的部分作为候选素材记录，本轮不直接迁入脚本。

调整要求：

- 过程 skill 默认输出 `process_handoff.kind = spec_draft`，不直接维护 `arckit/spec/INDEX.md`。
- 不把 GitHub Issue、card_id、Project 概念作为必需输入。
- 输入来源可以包括需求卡片、会议纪要、`arckit/intake/` 记录、历史 `arckit/spec/`、`arckit/tech/` 技术约定。
- 输出必须标注已确认事实、假设、缺口、证据和建议落点。
- 若用户要求“生成并沉淀”，由 `using-arckit` 或当前 agent 在过程完成后调用 `arckit-spec` 执行入库。
- `arckit-spec` 只需轻量增强：当输入是 PRD 草案、规格草案或 `process_handoff` 时，只提取已确认稳定行为事实；未确认假设不得静默变成规格。

建议 handoff：

```yaml
process_handoff:
  kind: spec_draft
  source_skill: arckit-draft-spec
  target_result_skill: arckit-spec
  suggested_root: arckit/spec/
  suggested_paths: []
  accepted_facts: []
  assumptions: []
  gaps: []
  evidence: []
```

### 6.4 `design` -> `thinking/skills/arckit-explore-product-design`

目标：把 `design` 变成可替换的产品设计探索过程，输出交互候选和视觉候选，而不是替代 `arckit-interaction` 或 `arckit-visual`。

迁移内容：

- signature 元素。
- 反 AI 默认风格。
- 数据驱动风格推理。
- 两轮设计流程中的 brainstorm、critique、build 计划和二次 critique。
- 页面唯一任务、页面职责、用户视角文案原则。
- 配色、字体、空间密度、布局方向和组件性格候选。
- `check_ai_defaults.py`
- `validate_signature.py`
- `init_design_system.py` 中可映射到 Arckit 视觉结果结构的部分作为候选素材记录，本轮不直接迁入脚本。

调整要求：

- 过程 skill 默认输出 `process_handoff.kind = design_exploration`。
- 不直接写 `arckit/interaction/` 或 `arckit/visual/`。
- 交互候选交给 `arckit-interaction` 入库；视觉候选交给 `arckit-visual` 入库。
- 不保留 `design-system/{project}/MASTER.md` 和 `pages/{page}.md` 作为正式目录；映射到 `arckit/visual/_library/brief.md`、`design-tokens.yaml`、`component-catalog.yaml` 和 `arckit/interaction/[page]/`。
- CSS/HTML 生产实现不进入该过程 skill；最多作为探索预览或非正式示意。
- `arckit-interaction` 和 `arckit-visual` 只需轻量增强：当输入是设计探索 handoff 时，分别提取交互事实和视觉事实并按各自结果规范入库。

建议 handoff：

```yaml
process_handoff:
  kind: design_exploration
  source_skill: arckit-explore-product-design
  target_result_skills:
    - arckit-interaction
    - arckit-visual
  interaction_candidates: []
  visual_candidates: []
  signature_rationale: ""
  rejected_defaults: []
  assumptions: []
  gaps: []
  evidence: []
```

### 6.5 `arch` -> `thinking/skills/arckit-architecture-decision`

目标：把 `arch` 变成可替换的架构决策过程，输出 ADR 草案、权衡依据和系统拆分候选，而不是把 `arckit-tech` 变成架构生成器。

迁移内容：

- ADR 模板和生成脚本。
- 技术选型权衡矩阵。
- 系统拆分检查。
- 架构约束澄清。
- “没有权衡分析不能选技术”的纪律。

调整要求：

- 过程 skill 默认输出 `process_handoff.kind = architecture_decision`。
- 不直接维护 `arckit/tech/INDEX.md`、`solution.md` 或 `decision.md`。
- `arckit-tech` 只需轻量增强：当输入是架构决策 handoff 或 ADR 草案时，将被接受的技术事实写入对应 `solution.md`、`decision.md`、models 或 contracts。
- `generate_arch_doc.py` 本轮不迁；若后续保留，应改为辅助生成 `arckit-tech` 可入库的 solution/decision 草案，而不是默认生成一个独立“大架构文档”。

建议 handoff：

```yaml
process_handoff:
  kind: architecture_decision
  source_skill: arckit-architecture-decision
  target_result_skill: arckit-tech
  suggested_root: arckit/tech/
  decision_summary: ""
  options: []
  tradeoffs: []
  recommended_option: ""
  assumptions: []
  risks: []
  suggested_paths: []
  evidence: []
```

### 6.6 `model` -> `thinking/skills/arckit-domain-modeling`

目标：把 DDD 战略设计、事件风暴和战术建模作为独立领域建模过程，输出给 `arckit-tech` 的模型 handoff。该能力不并入 `arckit-architecture-decision`：`arch` 负责架构决策、技术选型和 ADR，`model` 负责业务语义边界、限界上下文、领域事件、聚合和不变量。

迁移内容：

- 战略设计：子域、核心域/支撑域/通用域、限界上下文和上下文关系。
- 事件风暴：领域事件、命令、角色、聚合候选和关键业务流程。
- 战术建模：聚合根、实体、值对象、领域服务、领域事件和不变量。
- quick 校验规则，包括事件命名、上下文依赖、聚合大小、聚合间引用和不变量归属。
- PlantUML、依赖图和示例数据可保留为可视化辅助，但不作为正式事实源。

调整要求：

- 删除“架构师的建模手”等角色身份表述。
- 不使用旧 `output/` 目录作为正式产物落点。
- 不把后端代码骨架、Repository 或 Service 实现作为该 skill 的职责；需要编码时交给 `arckit-code`。
- 生成脚本和校验脚本可迁移，但必须改造为输出 handoff，或读写临时工作文件；正式入库仍由 `arckit-tech` 执行。
- `generate_dependency_graph.py` 只作为浏览器可视化辅助，不能替代 `arckit/tech/_shared/models`、contracts、solution 或 decision。
- `arckit-tech` 只接收已确认的领域模型事实；假设、缺口、争议边界必须保留标记，不得静默写成模型。

建议 handoff：

```yaml
process_handoff:
  kind: domain_modeling
  source_skill: arckit-domain-modeling
  target_result_skill: arckit-tech
  suggested_root: arckit/tech/
  bounded_contexts: []
  context_relationships: []
  aggregates: []
  entities: []
  value_objects: []
  domain_events: []
  invariants: []
  assumptions: []
  gaps: []
  evidence: []
  suggested_paths:
    models: []
    contracts: []
    solution: []
    decision: []
```

### 6.7 `operate` 调试部分 -> `arckit-debug-diagnosis`

目标：增强已有 debug 诊断能力，不把它变成 SRE 大 skill。

迁移内容：

- 完整读取错误信息。
- 稳定复现和最小复现。
- 近期变更检查。
- 多组件逐层诊断。
- 单一假设测试。
- 三次修复失败后停止并质疑架构。
- 调试报告模板。
- `debugging-methodology.md`
- `debug_report.py`

调整要求：

- 保持“最小修复”和证据驱动诊断。
- 运行健康检查、基线和告警不进入该 skill，放入 `delivery/skills/arckit-runtime-operations`。
- 发现架构问题时交回 `arckit-tech` 或后续前缀化后的项目治理 skill，不在 debug skill 中做长期架构重写。

### 6.8 `verify` -> `quality/skills/arckit-verify-implementation`

目标：补齐实现验证能力，用于在实现完成后收集新鲜证据、运行测试、检查端到端流程、性能基线和安全风险。它验证“实现是否按已接受事实和验收口径工作”，不替代代码审查，也不替代 `arckit-spec`、`arckit-tech` 的结果维护。

迁移内容：

- 新鲜验证证据纪律。
- E2E、性能、安全检查清单。
- `generate_verify_report.py` 中可复用部分；`gate_check.py`、`run_e2e.sh`、`security_scan.py` 本轮不迁，后续若使用必须先说明外部命令、副作用和适用项目。

调整要求：

- 输出验证报告和证据摘要，不直接修改产品或技术事实。
- 发现规格、交互、视觉或技术定义缺口时，交回对应结果 skill。
- 发现任务、验收或发布风险时，交回后续前缀化后的项目治理 skill 或 `arckit-release-readiness`。
- 测试、扫描和外部命令必须说明副作用、运行范围和失败时的降级方式。

建议 handoff：

```yaml
verification_handoff:
  kind: implementation_verification
  source_skill: arckit-verify-implementation
  verified_scope: []
  evidence: []
  failed_checks: []
  risks: []
  suggested_followups: []
  affected_result_skills: []
```

### 6.9 `review` -> `quality/skills/arckit-code-review`

目标：补齐代码审查能力，用于审查实现质量、业务逻辑一致性、性能风险、YAGNI 和 agent 迎合式输出。它审代码和变更风险，不负责重新实现，也不替代验证运行。

迁移内容：

- 两阶段审查。
- C/I/M 分级。
- 业务逻辑、代码质量、性能 reference。
- `check_flattery.py`、`check_yagni.py`、`generate_review_report.py` 中可复用部分。

调整要求：

- 输出发现列表、严重度、证据位置和建议修复方向。
- 默认不改代码；若用户要求修复，应转入普通代码工作流或对应 `arckit-code` skill。
- 启发式检查只作为 warning，不作为硬阻断。
- 若审查发现需求或技术事实不清，交回对应结果 skill，而不是在 review skill 中补写事实源。

建议 handoff：

```yaml
code_review_handoff:
  kind: code_review
  source_skill: arckit-code-review
  reviewed_scope: []
  findings: []
  evidence: []
  risks: []
  suggested_followups: []
```

### 6.10 `ship` -> `delivery/skills/arckit-release-readiness`

目标：补齐发布准备能力，用于发布前门禁、灰度策略、确认清单和回滚准备。它判断“是否准备好发布”，不负责长期运维监控，也不替代项目治理。

迁移内容：

- 发布检查清单。
- 灰度监控和回滚策略。
- `canary_monitor.py` 中可复用部分；`prepare_release.sh`、`gate_check.py`、`rollback.sh` 本轮不迁，后续若使用必须先说明生产环境副作用并要求用户确认。

调整要求：

- 涉及部署、回滚、网络、生产环境或外部系统的脚本必须显式要求用户确认。
- 输出发布准备报告，不静默执行发布。
- 发布风险、未满足门禁和回滚缺口必须清晰列出。
- 发布完成后的运行观察交给 `arckit-runtime-operations`。

建议 handoff：

```yaml
release_readiness_handoff:
  kind: release_readiness
  source_skill: arckit-release-readiness
  release_scope: []
  gates: []
  unmet_gates: []
  canary_plan: ""
  rollback_plan: ""
  risks: []
  required_confirmations: []
```

### 6.11 `operate` 运行部分 -> `delivery/skills/arckit-runtime-operations`

目标：补齐运行监控和运维观察能力，用于健康检查、运行基线、指标分析、SLA/SLO 和告警建议。它处理系统运行状态，不承担 debug 最小修复，也不做发布决策。

迁移内容：

- SLA 定义。
- 健康检查、基线采集、指标分析。
- `health_check.sh`、`collect_baseline.py`、`analyze_metrics.py` 中可复用部分。

调整要求：

- 调试方法论和 debug report 迁入 `arckit-debug-diagnosis`，不留在 runtime operations。
- 运行脚本必须说明目标环境、读取范围、写入副作用和失败降级。
- 输出运行观察报告、异常信号和建议后续动作。
- 若发现可复现 bug，交给 `arckit-debug-diagnosis`；若影响发布策略，交给 `arckit-release-readiness`。

建议 handoff：

```yaml
runtime_operations_handoff:
  kind: runtime_operations
  source_skill: arckit-runtime-operations
  observed_scope: []
  health_checks: []
  baseline_metrics: []
  anomalies: []
  sla_risks: []
  suggested_followups: []
```

## 7. 脚本迁移规则

脚本按以下规则分类。脚本不是迁移理由本身，只有当它能稳定减少重复劳动、降低易错步骤或提供可复用检查时才进入正式 skill：

| 类型 | 处理 |
| --- | --- |
| 确定性生成器 | 跟随目标 skill 迁移，可作为正式工具 |
| 确定性校验器 | 跟随目标 skill 迁移，可作为验证步骤 |
| 启发式检查器 | 跟随目标 skill 迁移，但默认输出 warning |
| 会执行 git/npm/curl/kubectl 的脚本 | 迁移前必须写清副作用，并要求用户确认风险 |
| 脚手架生成器 | 本轮默认不迁移；后续若单独迁移，归入 `arckit-code` |
| 依赖 `output/` glob 的脚本 | 适配 ArcKit 工作区和索引后再正式使用 |
| hooks、全局配置、eval 和测试脚本 | 默认不迁移；除非后续证明它们应成为仓库治理工具或某个 skill 的必要验证资源 |

根目录 `scripts/check_prerequisite.py`、`scripts/validate_handoff.py` 以及各 skill 内部的 `check_prerequisites.py` 属于 prerequisite 检查脚本族。它们的思想可以保留，但不应成为全局强流程。本轮优先采用分散策略：哪个过程 skill 需要确认上游事实，就在该 skill 自己的 `scripts/` 或 workflow 中提供轻量检查，读取目标项目：

```text
arckit/spec/
arckit/interaction/
arckit/visual/
arckit/tech/
arckit/intake/
arckit/pending/
```

只有当多个过程 skill 出现实质重复，且确实需要统一事实源发现契约时，才考虑抽成 `entry` 或共享工具。即使集中，也只能作为可选发现/增强检查，不作为所有流程的硬阻断入口。

`all/.claude/settings.json`、`.pre-commit-config.yaml`、`all/scripts/hooks/*`、`all/scripts/eval/*`、`all/scripts/test_scripts.sh` 和 `all/scripts/tests/*` 本轮不迁移。它们不属于某个原子 skill 的核心执行资源；若后续要保留，应先判断是进入仓库治理工具、仓库级验证工具，还是某个具体 skill 的局部验证资源。

## 8. 贡献保留策略

尽量保留同事贡献，但不保留不合适的组织形态。

建议：

- 能保留 Git 历史时使用 `git mv` 迁移脚本和模板；若来源目录是未跟踪文件或无法保留历史，则在迁移后的 reference、脚本注释或策略文档中保留 provenance。
- 在迁移后的 reference 文件中保留来源说明，例如“来源：`all/03-architect/model`，已按 Arckit 定义层规范适配”。
- 对大段原文只保留必要工作流和模板，删除角色身份、重复解释和与 Arckit 冲突的路径约定。
- 对暂不吸收的内容建立候选清单，避免丢失讨论上下文。
- 不长期保留 `all/` 作为正式入口目录。

## 9. 已确认补充决策

本轮讨论已确认以下策略：

- `arckit-role-orchestration` 的 description 是否保留 “role collaboration workflow” 关键词不重要；重要约束是它必须由用户或入口 skill 显式触发才生效，不能因为普通产品、设计、架构、工程请求而默认启动多角色流程。
- 除 `using-arckit` 这个默认入口外，现有非 `arckit-` 前缀正式 Arckit skill 后续都应迁移到 `arckit-` 前缀；本轮已处理 `decision-framework` 和 `project-governance-workflow`。
- `decision-framework` 的目标名采用 `arckit-decision-framework`，不另建并行的 `arckit-decision-analysis`。
- `project-governance-workflow` 的目标名采用 `arckit-project-governance-workflow`；本轮只做命名和引用迁移，不改变治理模型。
- `all/01-pm/insight` 独立迁移为 `idea/skills/arckit-market-research`，不作为 `arckit-idea-explore` 的 reference 子流程；`arckit-idea-explore` 只读取其输出作为增强输入。
- `all` 中具体 coding 能力本轮继续忽略，不再追问迁入哪个 `arckit-code` 目录和命名空间。
- 迁移后 `using-arckit` 必须按用户当前意图选择最小必要 skill 集，不默认跑完整研发链路。
- `arckit-role-orchestration` 只在用户明确要求多角色、端到端或完整研发流程时触发；若用户授权按计划继续执行，才从编排计划进入第一步 skill。
- 过程 skill 输出 handoff 不等于结果入库；只有用户明确要求沉淀，或入口判断需要维护长期事实源时，才调用对应结果 skill。
- 结果 skill 接收 handoff 时只能把 `accepted_facts` 当候选事实处理，`assumptions`、`gaps`、`risks` 和 `rejected_items` 不得静默入库。
- `check_prerequisite.py` 优先分散到需要它的过程 skill 内部；只有出现跨 skill 重复和一致性压力时，才考虑集中为共享发现工具。
- 新增或迁移 skill 不默认创建 `agents/openai.yaml`，也不默认引入统一 quick validation 脚本；只有当前目录或同类 skill 已形成稳定约定，或该 skill 的触发/输出风险需要快速校验时才补。
- 不默认为关键 skill 增加 eval cases；只有触发边界高度模糊、输出质量反复不稳，或后续迁移引入明显回归风险时再加。
- `README.md` 和 `AGENTS.md` 中 `thinking/` 的目录定义已同步更新为跨生命周期的过程型思考能力。
- `verify`、`review`、`ship` 和 `operate` 运行部分都需要在正式迁移时具备各自 handoff 契约，不能只停留在阶段表。
- `all` 中 hooks、全局配置、eval 和测试脚本本轮不迁移；后续若保留，先判断是否属于仓库治理工具或具体 skill 的局部验证资源。

## 10. 本轮实施记录

2026-06-15 已按本策略完成第一轮迁移实施：

- 使用 `arckit-intake` 保存原始 `all/`：`arckit/intake/2026/2026-06-15-001-all-original/`，intake id 为 `IN-20260615-001`。
- 新建显式角色协作 skill：`entry/skills/arckit-role-orchestration/`。
- 新建外部市场研究 skill：`idea/skills/arckit-market-research/`。
- 前缀化并增强决策 skill：`thinking/skills/arckit-decision-framework/`，吸收 `all/01-pm/decide` 的模板和脚本。
- 新建过程型 thinking skills：`arckit-draft-spec`、`arckit-explore-product-design`、`arckit-architecture-decision`、`arckit-domain-modeling`。
- 前缀化治理 skill：`iteration/skills/arckit-project-governance-workflow/`，保留原治理模型，同步 `agents/openai.yaml` 和既有 eval skill name。
- 新建质量 skills：`quality/skills/arckit-verify-implementation/`、`quality/skills/arckit-code-review/`。
- 新建交付 skills：`delivery/skills/arckit-release-readiness/`、`delivery/skills/arckit-runtime-operations/`。
- 补迁 `all/06-sre/operate` 调试部分到 `engineering/skills/arckit-debug-diagnosis/`：`references/debugging-methodology.md` 和 `scripts/debug_report.py`。
- 给 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech` 增加 handoff 接收规则，但不扩展其核心结果维护定义。
- 更新 `using-arckit` 路由，使其按当前意图选择最小必要 skill 集，并明确 `arckit-role-orchestration` 必须显式触发。
- 重写 `entry/skills/arckit-role-orchestration/scripts/generate_plan.py`，移除旧 `all` 阶段名和 `build/build-fe/build-be` 链路，改为当前 `arckit-*` skill 与外部 `arckit-code` implementation handoff。
- 清理 `thinking/skills/arckit-decision-framework/` 的旧 `skill.json` 和根级 `README.md`，并将 `scripts/init-template.sh` 默认输出从旧 `$HOME/.openclaw/workspace` 改为当前工作目录。
- 删除 `thinking/skills/arckit-decision-framework/templates/README.md` 的重复副本，统一保留 `references/all-usage-guide.md` 作为使用指南引用。
- `all/04-engineer/build`、`build-fe`、`build-be` 仍按策略忽略，未迁入本仓库正式 skill。
- hooks、全局配置、根级 eval 和测试脚本仍未迁移。
- 新增 `.gitignore` 忽略根目录原始 `all/` 副本和 Python 生成产物，避免误提交本轮 intake 以外的候选包和 `.pyc` 噪声。
- 清理根目录 `all/` 与 intake 原始副本中的 `.gitignore`、`__pycache__`、`.pyc` 等无效归档噪声；保留旧 `build/` 下的文档和脚本作为原始信息。
- 补充实际项目使用约定：定义/治理优先级、过程 handoff 临时保存、`implementation_handoff`、质量/交付证据查找顺序，以及完整流程裁剪规则。
- 补充主要过程 skill 的领域 handoff 到通用 `process_handoff` 的映射说明，避免单独触发过程 skill 时丢失入库边界。
- 增强 `arckit-pending`，新增 `Type: process_handoff` 和可选 `Process Handoff` 区块，用于保存跨回合复用但尚未确认入库的过程产物。

仍需后续单独评估：

- 是否删除或归档仓库根目录的原始 `all/` 副本。本轮已完成 intake 保存，但未把根目录 `all/` 作为正式入口保留。
- copied scripts 是否需要进一步适配输入输出和 provenance 注释。当前 `SKILL.md` 均把它们标为可选辅助，不作为强流程。
- 未迁脚本的后续取舍：`collect.py`、`generate_report.py`、`context_collector.py`、`data_source.py`、`init_design_system.py`、`generate_arch_doc.py`、`gate_check.py`、`run_e2e.sh`、`security_scan.py`、`prepare_release.sh`、`rollback.sh`。
- 后续若迁移 coding 能力，应在 `arckit-code` 中重新设计，不从本仓库延伸。

## 11. 暂定结论

`all/` 的整合方向是：

```text
角色视角 -> 显式协作 skill
推理/生成纪律 -> 拆入 thinking 下的过程 skill
验证/交付纪律 -> 拆入 quality/delivery 下的新 skill
结果维护 -> 继续由 arckit-spec / interaction / visual / tech 负责
模板脚本 -> 跟随过程 skill 或对应结果 skill 迁移
编码实现 -> 本轮忽略，长期归属 arckit-code
产物路径 -> 统一改为目标项目 arckit/ 工作区
```

更精确地说：

```text
thinking = 过程能力，负责分析、推理、草案、候选、批评和 handoff
definition = 结果能力，负责长期事实源的结构、落点、索引、拆分、归档和正文规范
```

这能保留 `all/` 的主要贡献，同时避免 ArcKit 出现两套并行体系，也避免把可替换的生成流程固化进长期结果 skill。
