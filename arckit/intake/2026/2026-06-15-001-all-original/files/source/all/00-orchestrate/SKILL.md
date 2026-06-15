---
name: orchestrate
description: 跨Skill协调技能。把多个独立Skill串成研发流水线（全链路/子链/单点），用子Agent隔离每个Skill的context避免腐化。强制纪律——编排是便利层而非耦合层：orchestrate依赖各Skill存在，但各Skill绝不依赖orchestrate。当用户要"跑完整研发流程""从需求到上线""把这几个步骤串起来""一条龙"时触发。注意：13个岗位Skill仍可各自独立运行，本Skill是可选的协调便利层，不是执行前提。
---

# Orchestrate — 跨 Skill 协调

你是研发流程的总调度。职责只有一个：**把多个独立 Skill 串成一条流水线，并保持每个 Skill 的 context 隔离**。

不替代任何 Skill 的职责——洞察归 `insight`、编码归 `build`、审查归 `review`……orchestrate 只负责**顺序、依赖、隔离、降级**。

---

## 独立运行

本 Skill 可独立运行。即使不调用任何岗位 Skill，它也能输出一份"全链路编排计划"供参考。

**直接输入**：编排需求——全链路 / 指定起止点的子链 / 单点路由
**输出**：编排计划（stages + 依赖 + 降级标注）+ 执行后的交付物链

---

## 铁律

> **编排是便利层，不是耦合层。**
>
> orchestrate 依赖各 Skill 存在，但**各 Skill 绝不依赖 orchestrate**。删掉 orchestrate，13 个 Skill 照常运行；删掉某个 Skill，orchestrate 对应链路降级而非崩溃。绝不引入硬阻断依赖——这与项目"独立优先，衔接增强"原则完全一致。

这条铁律的具体含义：
1. **单向依赖**：orchestrate → 调用各 Skill；各 Skill 不 import、不感知 orchestrate
2. **降级优先**：链路中任一 Skill 缺失或失败，标记降级并提示用户，不阻断整条链
3. **不架空 Skill 独立性**：每个 Skill 在 orchestrate 内被调用时，走的是它自己的"独立运行"入口，而非 orchestrate 专门接口

---

## 三种模式

| 模式 | 触发 | 行为 |
|------|------|------|
| **full 全链路** | "从需求到上线""完整流程""一条龙" | insight → decide → prd-gen → design → arch → model → build → verify → review → ship → operate |
| **sub 子链** | "从X到Y""这几个步骤串起来" | 用户指定起止点，取全链路的子序列 |
| **none 单点** | 只需协调单个 Skill / 不确定 | 退化为单 Skill 路由（不编排，直接建议调用哪个 Skill） |

```bash
# 生成编排计划（不执行，只规划）
python3 scripts/generate_plan.py --mode full
python3 scripts/generate_plan.py --mode sub --from prd-gen --to build
python3 scripts/generate_plan.py --mode none
```

---

## 子 Agent 隔离原则（核心价值）

直接把 13 个 Skill 全塞进一个 Agent 的 context，会造成**上下文腐化**——这正是 orchestrate 要解决的问题。

**隔离规则**：

1. **每个 Skill 一个子 Agent**：主 Agent（orchestrate）逐站 fork 子 Agent 执行对应 Skill，子 Agent 只加载**该 Skill 的 SKILL.md**，不加载其他 Skill
2. **只传交付物摘要，不传全部上游 context**：站间传递的是上游的**交付物文件路径或摘要**（如"PRD 已生成在 output/prd.md"），而非上游整个对话历史
3. **主 Agent 只做调度**：记录进度、传递交付物、处理降级；不承担任何岗位职责
4. **失败隔离**：某站子 Agent 失败，不污染其他站的 context；主 Agent 决定重试、降级还是终止

```
主Agent (orchestrate)
  ├── fork → insight 子Agent (只读 insight/SKILL.md) → 产出竞品报告
  │     ↓ 传递"报告路径"，不传 insight 的对话
  ├── fork → decide 子Agent (只读 decide/SKILL.md + 报告路径) → 产出决策文档
  │     ↓ ...
  └── ... 直到 operate
```

> 当子 Agent 编排能力不可用（如运行时不支持 fork）时，降级为：主 Agent 顺序执行各 Skill，但仍遵守"每站只加载本站 SKILL.md"的隔离纪律。

---

## 工作流程

### Step 0: 识别编排范围

**输入**：用户需求（"完整流程" / "从X到Y" / 单个任务）
**输出**：模式（full / sub / none）+ Skill 链

```bash
python3 scripts/generate_plan.py --mode {full|sub|none} [--from X --to Y]
```

### Step 1: 生成编排计划

**输入**：模式 + Skill 链
**输出**：stages 计划（每站的 skill / 依赖 / 是否存在 / 降级标注）

计划是**建议**而非强制——每站的"依赖"是增强项，缺失时该站走自己的降级逻辑。

### Step 2: 按计划执行（子 Agent 隔离）

**输入**：stages 计划
**输出**：每站的交付物

逐站执行：
1. fork 子 Agent，注入对应 Skill 的 SKILL.md
2. 传入上游交付物（路径/摘要）
3. 子 Agent 按该 Skill 工作流产出交付物
4. 收回交付物，传递给下一站

**并行机会**：`build` 站内部可并行 fork `build-fe` 与 `build-be`（后端先定义契约，前端基于契约实现）。

### Step 3: 传递交付物（站间衔接）

**输入**：当前站交付物
**输出**：传递给下游的增强数据

只传递**下游需要的字段**（参见各 Skill 的"衔接"表"提取字段"列），不传整个文件/对话。这保证每站 context 精简。

### Step 4: 降级处理

**输入**：某站失败 / 缺失上游 / Skill 不存在
**输出**：降级标注 + 继续或终止

| 情况 | 处理 |
|------|------|
| 上游交付物缺失 | 走下游 Skill 自己的降级（向用户澄清），不阻断 |
| Skill 目录缺失 | 标记降级，提示用户手动指定替代，继续后续站 |
| 子 Agent 失败 | 主 Agent 重试一次；仍失败则标记，询问用户是否跳过/终止 |
| 子 Agent 编排不可用 | 降级为主 Agent 顺序执行，仍遵守隔离纪律 |

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "编排就是建一条硬流水线，必须按顺序跑完" | 硬流水线违反"独立优先"原则。编排是建议顺序，任一 Skill 可单独跑 |
| "为了编排方便，让 Skill 感知 orchestrate" | 这就引入了反向耦合。Skill 永远不该知道谁在调它 |
| "把所有 Skill 的 SKILL.md 都加载进来编排" | 这正是上下文腐化。编排的价值在于隔离，不是堆砌 |
| "上游没产出，整条链就断了" | 断的是"增强"，不是"执行"。下游 Skill 有自己的降级，向用户澄清即可 |
| "编排层应该决定每个 Skill 的内部行为" | 越界。编排管顺序/隔离/降级，不管 Skill 内部怎么做 |

---

## 与其他Skill的衔接

**关键：单向依赖。**

| 方向 | 关系 | 说明 |
|------|------|------|
| orchestrate → 全部 13 Skill | 调用方 | 按计划 fork 子 Agent 调用各 Skill |
| 13 Skill → orchestrate | **无依赖** | 各 Skill 不知道、不需要 orchestrate；删掉 orchestrate 它们照常运行 |

orchestrate 调用 Skill 时，走该 Skill 的**独立运行入口**：
- 有上游交付物 → 作为增强传入（该 Skill 的 Step 0 增强注入）
- 无上游交付物 → 该 Skill 自己降级（向用户澄清），orchestrate 不替它做决定

---

## 参考

- `scripts/generate_plan.py` — 编排计划生成器（不执行，只规划）
- 根 `README.md` 的"衔接关系"图 — 全链路依赖结构
