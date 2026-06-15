# 产品研发全生命周期 Skill 体系

> 一个Skill = 一个岗位的一个核心职责。不多做，不少做。
> 核心原则：**完整健壮，可输出高质量内容，而非简练。**

## 体系总览

```
┌─────────────────────────────────────────────────────────────────┐
│                      产品研发生命周期                             │
├─────────────────────────────────────────────────────────────────┤
│  产品经理 (01-pm)    │  设计师    │  架构师     │  工程师    │  SRE    │
│                      │ (02-design)│(03-architect)│(04-engineer)│(06-sre) │
│                      │           │             │            │         │
│  insight  市场洞察    │           │             │            │         │
│  decide  决策判断     │  design   │   arch      │ build-fe   │  ship   │
│  prd-gen PRD生成     │  产品设计  │   技术架构   │ build-be   │  部署发布│
│                      │           │   model     │   verify   │  operate│
│                      │           │   领域建模   │   测试验证  │  运营监控│
└─────────────────────────────────────────────────────────────────┘
```

## 13个Skill一览

| # | Skill | 岗位 | 核心问题 | 一个交付物 | 铁律 |
|---|-------|------|---------|-----------|------|
| 1 | `insight` | 产品经理 | 市场有什么机会？ | 竞品/趋势报告 | 没有一手数据就不能下结论 |
| 2 | `decide` | 产品经理 | 值不值得做？ | 决策文档 | 没有拆解假设就不能推荐方案 |
| 3 | `prd-gen` | 产品经理 | PRD怎么写？ | 可评审的产品需求文档 | 没有4层输入覆盖评估就不能生成 |
| 4 | `design` | 设计师 | 界面应该长什么样？ | 设计系统+页面稿 | 没有signature元素就不能交付 |
| 5 | `arch` | 架构师 | 系统怎么拆？ | 架构文档+ADR | 没有权衡分析就不能选技术 |
| 6 | `model` | 架构师 | 业务边界在哪？ | 领域模型+上下文图 | 没有战略设计就不能做战术建模 |
| 7 | `build` | 工程师 | 编码任务路由 | 路由到 build-fe / build-be | 没有失败测试就不能写产品代码 |
| 8 | `build-fe` | 前端工程师 | 界面怎么实现？ | 可交互组件+测试 | 没有交互测试就不能写组件实现 |
| 9 | `build-be` | 后端工程师 | API怎么实现？ | 可运行服务+API契约 | 没有契约定义就不能写业务逻辑 |
| 10 | `verify` | QA | 功能真的能用吗？ | 测试报告+质量门禁 | 没有新鲜证据就不能声称完成 |
| 11 | `review` | 主任工程师 | 代码质量达标吗？ | 审查报告(C/I/M) | 技术评估而非情感表演 |
| 12 | `ship` | 发布工程师 | 怎么安全上线？ | 发布记录+回滚方案 | 没有通过门禁就不能发布 |
| 13 | `operate` | SRE | 线上健康吗？ | 健康报告/调试报告 | 没有根因调查就不能提修复 |

## 可选协调层：orchestrate

`00-orchestrate/` 是一个**可选**的跨 Skill 协调层，把多个独立 Skill 串成研发流水线（全链路 / 子链 / 单点），用子 Agent 隔离每个 Skill 的 context，避免 13 个 Skill 全塞进一个 context 造成的腐化。

**纪律：编排是便利层，不是耦合层。** orchestrate 依赖各 Skill 存在，但各 Skill 绝不依赖它——删掉 orchestrate，13 个岗位 Skill 照常运行；删掉某个 Skill，orchestrate 对应链路降级而非崩溃。它不属于 13 个岗位 Skill，是独立的元协调 Skill。

```bash
python3 00-orchestrate/scripts/generate_plan.py --mode full                        # 全链路计划
python3 00-orchestrate/scripts/generate_plan.py --mode sub --from prd-gen --to build  # 子链
python3 00-orchestrate/scripts/generate_plan.py --mode none                        # 不编排（单 Skill 路由）
```

## 衔接关系

每个Skill**独立可运行**，Agent可按需调用任意Skill完成任务。衔接关系是**质量增强**而非执行前提：有上游交付物时输出质量更高，无时降级运行。

```
insight ──→ decide ──→ prd-gen ──→ design ──→ arch ──→ model
  ↑            │                      │          │         │
  │            ↓                      ↓          ↓         ↓
  │        [决策文档]              [设计系统]    [ADR]   [领域模型]
  │            │                      │          │         │
  │            ↓                      ↓          ↓         ↓
operate ←── ship ←── review ←── verify ←── build-fe ←─────┘
                                    ↑      ←── build-be ←──┘
```

### 衔接双原则

1. **增强优先**：每个Skill启动时检测上游交付物，有则利用增强输出质量，无则降级运行而非拒绝执行
2. **契约建议**：上游输出格式是建议而非强制，下游Skill应能容错解析，缺失字段标注待补充

> 旧版"衔接三铁律"（前置验证/输出契约/不可跳步）已废止。Skill间不再有硬阻断依赖。

### 衔接明细

| 衔接点 | 上游交付物 | 下游增强 | 无上游时向用户澄清 |
|--------|-----------|---------|-------------------|
| insight→decide | 竞品报告 | 决策有市场数据支撑 | "决策所需市场数据从何而来？" |
| decide→prd-gen | 决策文档 | PRD有方向性约束 | "PRD方向和优先级是否已明确？" |
| prd-gen→design | PRD文档 | 设计有验收标准 | "验收标准是什么？交互规格？" |
| design→arch | 设计系统 | 架构有组件规格约束 | "技术约束有哪些？" |
| arch→model | ADR | 建模有系统边界 | "核心业务流程？子域？边界？" |
| model→build-be | 领域模型 | 编码有DDD结构 | "技术栈？项目结构？" |
| design→build-fe | 设计系统 | 前端有组件规格约束 | "样式变量在哪？组件规格？" |
| arch→build-fe/build-be | ADR | 编码有技术选型约束 | "技术栈？编码规范？" |
| build-fe/build-be→verify | 源代码 | 验证有明确测试目标 | "待验证代码路径？验收标准？" |
| verify→review | 测试报告 | 审查有验证依据 | "审查范围？哪些文件/PR？" |
| review→ship | 审查报告 | 发布有质量门禁 | "代码是否已审查？若未审查请确认风险" |
| ship→operate | 发布记录 | 监控有发布基线 | "监控目标？健康检查URL？日志路径？" |
| operate→insight | 运营数据 | 洞察有用户反馈维度 | "是否有用户反馈/客诉数据？" |

## 目录结构

```
all/
├── README.md                    # 本文件
├── 00-orchestrate/              # 跨Skill协调（可选便利层，不耦合）
│   ├── SKILL.md                 # 编排纪律：便利层非耦合层 + 子Agent隔离
│   └── scripts/
│       └── generate_plan.py     # 生成编排计划（不执行，只规划）
├── 01-pm/                       # 产品经理
│   ├── insight/                 # 市场洞察
│   │   ├── SKILL.md             # 含内置通道+扩展CLI+降级方案
│   │   ├── scripts/
│   │   └── references/
│   │       ├── competitive-framework.md
│   │       └── trend-signals.md
│   ├── decide/                  # 决策判断
│   │   ├── SKILL.md             # 三套递进工具+自动路由
│   │   ├── scripts/
│   │   │   └── init-template.sh
│   │   └── references/
│   │       ├── first-principles-template.md  ← 原始decision-toolkit
│   │       ├── value-assessment-template.md   ← 原始decision-toolkit
│   │       ├── socratic-template.md           ← 原始decision-toolkit
│   │       └── usage-guide.md                 ← 原始decision-toolkit README
│   └── prd-gen/                 # PRD生成 ← 原始prd-gen-0.7.5
│       ├── SKILL.md             # 多数据源适配+4层输入生成PRD
│       ├── scripts/
│       │   ├── context_collector.py
│       │   └── generate.py
│       └── references/
│           ├── prd_template_agent.md
│           ├── prd_template_deep.md
│           ├── prd_template_feature.md
│           ├── prd_template_hybrid.md
│           └── prd_template_simple.md
├── 02-design/                   # 设计师
│   └── design/                  # 产品设计
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
│           ├── anti-ai-defaults.md
│           └── reasoning-rules.md
├── 03-architect/                # 架构师
│   ├── arch/                    # 技术架构
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   └── references/
│   │       ├── adr-template.md
│   │       ├── tradeoff-matrix.md
│   │       └── patterns.md
│   └── model/                   # 领域建模 ← 原始ddd-toolkit-0.3.1
│       ├── SKILL.md
│       ├── scripts/             ← 原始ddd-toolkit脚本
│       │   ├── generate_context_map.py
│       │   ├── generate_dependency_graph.py
│       │   ├── generate_domain_model.py
│       │   ├── generate_event_storming.py
│       │   ├── validate_event_storming.py
│       │   ├── validate_modeling.py
│       │   └── validate_strategy.py
│       └── references/          ← 原始ddd-toolkit示例
│           ├── example-ecommerce-modeling.md
│           ├── example-ecommerce-event-storming.md
│           └── example-ecommerce-graph-data.json
├── 04-engineer/                 # 工程师
│   ├── build/                   # 编码路由（分发到 build-fe / build-be）
│   │   ├── SKILL.md             # 路由规则+共享铁律
│   │   ├── scripts/
│   │   └── references/
│   │       ├── tdd-antirationalization.md
│   │       └── red-flags.md
│   ├── build-fe/                # 前端工程
│   │   ├── SKILL.md             # 组件驱动+TDD+无障碍+性能优化
│   │   ├── scripts/
│   │   │   ├── scaffold_fe.py   # 前端项目脚手架
│   │   │   └── check_fe_standards.py  # 前端代码标准检查
│   │   └── references/
│   │       ├── component-patterns.md
│   │       └── fe-testing-strategy.md
│   ├── build-be/                # 后端工程
│   │   ├── SKILL.md             # 契约驱动+TDD+分层架构+可观测性
│   │   ├── scripts/
│   │   │   ├── scaffold_be.py   # 后端项目脚手架
│   │   │   └── check_api_contract.py  # API契约一致性检查
│   │   └── references/
│   │       ├── api-patterns.md
│   │       └── error-handling.md
│   └── verify/                  # 测试验证
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
│           ├── e2e-strategy.md
│           ├── perf-baseline.md
│           └── security-checklist.md
├── 05-lead/                     # 主任工程师
│   └── review/                  # 代码审查
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
│           ├── code-quality.md
│           ├── performance.md
│           └── business-logic.md
└── 06-sre/                      # SRE
    ├── ship/                    # 部署发布
    │   ├── SKILL.md             # 含灰度8种实现方式+监控命令
    │   ├── scripts/
    │   └── references/
    │       ├── release-checklist.md
    │       └── rollback-strategies.md
    └── operate/                 # 运营监控
        ├── SKILL.md             # 含降级采集+基线建立+数据驱动迭代
        ├── scripts/
        └── references/
            ├── debugging-methodology.md
            └── sla-definitions.md
```

## 复用来源追踪

| Skill | 原始来源 | 复用方式 | 修改内容 |
|-------|---------|---------|---------|
| `decide` | decision-thinking-toolkit-1.0.0 | ✅ **直接复用**原始模板和脚本 | SKILL.md重写为入口+铁律+衔接；references/使用原始文件；新增usage-guide.md |
| `model` | ddd-toolkit-0.3.1 | ✅ **直接复用**scripts和references | SKILL.md重写为入口+铁律+反合理化+FAQ；补回交互式图表特性和校验参数说明 |
| `prd-gen` | prd-gen-0.7.5 | ✅ **直接复用**全部文件 | 无修改，完整保留原始skill |
| `insight` | Agent-Reach设计模式 | 参考设计 | 重新实现，采用tier分级+降级方案模式 |
| `design` | frontend-design + ui-ux-pro-max | 参考设计 | 两轮设计流程+反AI默认风格+数据驱动推理 |
| `arch` | 原创设计 | 原创 | ADR模板+权衡矩阵+架构模式库 |
| `build` | superpowers TDD | 参考设计 | 改为路由分发器，编码职责拆分到 build-fe / build-be |
| `build-fe` | superpowers TDD + frontend | 参考设计 | 组件驱动开发+无障碍+性能优化+前端测试策略 |
| `build-be` | superpowers TDD + backend | 参考设计 | 契约驱动+分层架构+DomainError+可观测性 |
| `verify` | playwright-mcp + superpowers | 参考设计 | 验证门控+Playwright策略+性能/安全检查 |
| `review` | superpowers两阶段审查 | 参考设计 | 反谄媚规则+YAGNI检查 |
| `ship` | gstack canary/ship | 参考设计 | 增加灰度8种实现方式+监控命令 |
| `operate` | superpowers调试 + gstack investigate | 参考设计 | 增加降级采集+基线建立+数据驱动迭代 |

## 设计原则

1. **完整健壮优先于简练** — Skill的价值在于能输出高质量内容，而非字数少
2. **一个Skill只回答一个核心问题，只产出一个交付物** — 岗位职责边界清晰
3. **铁律+反合理化表是纪律型Skill的灵魂** — 没有这两样，Agent会找理由绕过流程
4. **胶水层而非包装层** — Skill是操作手册，不是运行时
5. **独立优先，衔接增强** — 每个Skill可独立运行，衔接关系是质量增强而非执行前提
6. **直接复用优先** — ddd-toolkit/decision-toolkit/prd-gen的原始文件直接复用，不重新发明
7. **降级方案必备** — 每个依赖外部工具的环节都有降级方案，确保在任何环境下都能产出

## 参考项目与借鉴模式

| 项目 | 借鉴了什么 |
|------|-----------|
| superpowers (obra) | 铁律模式、反合理化表、验证门控、TDD流程、两阶段审查、3次失败规则 |
| gstack (Garry Tan) | 角色即Skill、sections模块化、canary监控、office-hours景观感知 |
| Agent-Reach | 胶水层模式、tier分级、自诊断、声明式路由、降级方案 |
| skill-creator (Anthropic) | 渐进式披露、eval驱动迭代、SKILL.md结构规范 |
| frontend-design (Anthropic) | 两轮设计、反AI默认风格、signature元素 |
| ui-ux-pro-max | 数据驱动推理、BM25搜索、Master+Overrides |
| ddd-toolkit | 强制三步流程、双模式校验、交互式可视化、7个Python脚本 |
| decision-toolkit | 三套递进工具、自动路由、组合使用模式、完整模板 |
| prd-gen | 4层输入覆盖评估、5套PRD模板、多数据源适配（local/GitHub）、项目概览延续性 |
| playwright-mcp | 能力分层、无障碍快照、测试断言 |

## 质量保障工具

### 衔接增强检测

衔接双原则（增强优先/契约建议）可通过脚本自动检测：

```bash
# 全链路增强检测（检查11个衔接点的增强状态，建议模式，不阻断）
python3 scripts/validate_handoff.py --output-dir ./output

# 单 Skill 上游检测
python3 scripts/check_prerequisite.py --skill build --upstream-dir ./output --json
```

每个衔接点检测上游交付物存在性+内容契约，缺失时输出降级方式建议而非阻断。

### pre-commit hooks

```bash
# 安装（首次）
pre-commit install

# 手动运行
pre-commit run --all-files
```

包含：Python/Shell 语法检查、SKILL.md 规范检查（铁律/反合理化/衔接存在性）、禁止 `__pycache__`、行尾空白清理。

### Agent 运行时 Hooks

pre-commit 是 git 提交时的检查；**Agent 运行时 Hooks** 补上了编码过程中的强制执行——把铁律从"写进 SKILL.md 靠自觉遵守"变成"Agent 每次写文件后自动触发"。

配置在 `.claude/settings.json`（项目级，随仓库共享给所有协作者）：

| Hook | 触发点 | 执行检查 | 来源铁律 |
|------|--------|---------|---------|
| `scripts/hooks/post_edit.py` | Edit/Write/MultiEdit/NotebookEdit 后 | 代码文件→`check_yagni`（过度设计）；审查/报告 `.md`→`check_flattery`（反谄媚） | review / build |
| `scripts/hooks/pre_bash.py` | Bash 执行 `git commit` 前 | `validate_handoff` 衔接完整性提醒 | 衔接双原则 |

设计原则与项目一致：
1. **降级优先**：任何异常（stdin 格式、git 不可用、脚本缺失）一律静默通过，绝不中断 Agent
2. **温和提醒**：默认 `exit 0` + stderr 反馈，Claude 看到提醒但不强制中断（避免启发式正则误报阻断流程）；设 `HOOK_BLOCK=1` 切硬阻断（`exit 2`）
3. **胶水层**：复用现有 `check_flattery` / `check_yagni` / `validate_handoff` 的 CLI，不改其逻辑

```bash
# 人工调试（不依赖 Claude Code harness）
echo '{"tool_input":{"file_path":"README.md"}}' | python3 scripts/hooks/post_edit.py

# 切硬阻断模式（命中即 exit 2 阻断工具）
HOOK_BLOCK=1 python3 scripts/hooks/post_edit.py < payload.json
```

### Skill 有效性评估

`scripts/eval/` 回答一个之前无法回答的问题：**这 13 个 Skill 到底有没有让 Agent 输出变好？**

这是 verify 铁律对 Skill 体系自身的反观——单元测试验证的是脚本函数正确性，而 Skill 是否提升了 Agent 输出质量，需要 A/B 对比证据。

```bash
# A/B 对比：同一输入带/不带 SKILL.md 各跑一次，评分对比
python3 scripts/eval/run_eval.py \
  --cases-dir scripts/eval/cases/ \
  --outputs-dir out/ \
  --report out/eval_report.md

# 单独给一个输出打分（scorer 是确定性纯 Python，零 LLM 依赖）
python3 scripts/eval/scorer.py --output-file out.txt --rubric-file scripts/eval/cases/review_flattery.json
```

评分器 `scorer.py` 与 LLM 调用解耦：用户在 LLM 端跑两次（带/不带 SKILL.md），把输出交给 `run_eval.py` 打分对比，保持零平台依赖。详见 `scripts/eval/README.md`。

### 单元测试

```bash
cd scripts && python3 tests/test_skills.py
# 21个测试覆盖：route_tool / check_yagni / check_flattery / check_prerequisite / validate_handoff
```
