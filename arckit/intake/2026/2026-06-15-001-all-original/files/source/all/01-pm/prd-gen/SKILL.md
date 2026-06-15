---
name: prd-gen
description: PRD 文档生成 skill。基于需求卡片 + 项目历史上下文生成高质量产品需求文档，长期维护项目概览以保持延续性输出。支持多种数据源（本地文件/GitHub）。触发条件：「生成PRD」「给 #xxx 写PRD」「帮我出需求文档」。
---

# prd-gen Skill
<!-- version: 0.8.0 -->

---

## 核心目的

**将一份需求输入变成一份可直接评审的产品需求文档（PRD）。**

「可直接评审」的标准：开发、设计、测试拿到文档后不需要再回来问 PM 任何问题，就能开始工作。

---

## 独立运行

本Skill可独立运行，无需任何上游Skill的交付物。

**直接输入**：需求卡片（card_id + project_id）+ 用户配置
**有上游增强时**：`decide` 的决策文档可提供方向性约束，`insight` 的洞察报告可提供市场背景
**无上游时**：主动向用户澄清"PRD的方向和优先级是否已明确？"若不明确，先引导用户澄清再生成

---

## 铁律

> **没有4层输入覆盖评估就不能生成。**
>
> 跳过输入评估直接生成 = 不看原料就炒菜。缺哪层就标注缺哪层的影响，但不能假装不缺。

---

## 数据源

PRD 生成所需数据通过抽象数据源层获取，支持以下数据源：

| 数据源 | 标识 | 依赖 | 说明 |
|--------|------|------|------|
| 本地文件 | `local` | 无（默认） | 从本地 JSON/Markdown 文件读取数据，零外部依赖 |
| GitHub | `github` | gh CLI | 将 GitHub Issues 映射为卡片，Projects 映射为项目 |

**默认使用 local 模式，无需任何外部依赖。** GitHub 数据源为可选适配器，安装 gh CLI 后自动启用。

### 数据源选择

```bash
# 默认：local 模式（零依赖）
python3 scripts/generate.py --card-id 106 --project-id my-project

# GitHub 模式（需安装 gh CLI）
python3 scripts/generate.py --card-id 106 --project-id my-project --data-source github --gh-repo owner/repo
```

---

## 输入增强

生成高质量 PRD 需要以下四层输入，**缺失不阻断生成，但影响对应章节质量**：

| 层 | 内容 | 获取方式 | 缺失影响 |
|----|------|---------|---------|
| **1. 目标输入** | 标题 + 描述 + AC | 数据源 `get_card()` | **唯一可能阻断的层** |
| **2. 项目概览文档** | 产品定位 + 功能历史 + 设计约定 | 本地概览文件 | 背景/用户场景章节质量下降 |
| **3. 项目历史记录** | 全量已关闭条目 | 数据源 `search_cards()` | 功能范围章节无历史参照 |
| **4. 代码仓设计约定** | 接口约定/数据模型/非功能约束/设计决策 | 数据源 `get_repo_file()` | 验收标准/技术约束章节质量下降；无代码仓时所有约定类章节均标注「未经代码验证」 |

---

## 输入覆盖度评估

生成前评估四层输入的覆盖情况，输出章节质量预测，**不打分不设阈值**。

### 阻断条件（仅两种）

1. 目标输入拉取失败
2. 目标标题和描述均为空

其他所有情况均生成，缺失章节标注 `⚠️ [待补充]`。

---

## 项目概览文档（延续性生成基础）

**路径**：`data/overviews/project_overview_{project_id}.md`

| 章节 | 内容 | 维护方式 |
|------|------|---------|
| 产品定位 | 给谁用 + 核心问题 + 边界 | **必须经用户确认，不自动生成** |
| 已交付功能清单 | 按迭代分组的已关闭条目 | 自动更新 |
| 当前迭代重点 | 进行中条目摘要 | 自动更新 |
| 历史 PRD 文档 | 本地 prds/ 目录扫描 | 自动更新 |
| 核心设计约定 | 接口约定/数据模型/非功能/决策约定 | 有代码仓时从代码推导；无时从历史 PRD 文档提取，标注「未经代码验证」 |

### 产品定位澄清流程

产品定位是概览的核心，**不能推断或随意归纳，必须基于全量输入并经用户确认**。

---

## PRD 输出目标

由用户配置或命令行参数 `--output-target` 指定：

| 目标 | 说明 | 可用性 |
|------|------|--------|
| `local`（默认） | 仅保存本地文件 | ✅ 始终可用 |
| `card_content` | 写回数据源卡片内容区域 | ✅ GitHub 数据源支持 |

---

## 生成深度（复杂度感知）

根据输入类型和标题关键词自动判断生成深度，**所有关键词可在用户配置中覆盖**：

| 复杂度 | 判断条件 | 模板 | 章节 |
|--------|---------|------|------|
| `simple` | 类型为 bug；或标题含修复/调整/优化类关键词 | `references/prd_template_simple.md` | 背景 / 改动范围 / AC / 影响评估 |
| `standard` | story/task 类，无 simple/complex 特征 | agent / feature / hybrid 模板 | 完整 6-7 章 |
| `complex` | epic/feature 类；或标题含重构/迁移/架构类关键词；或同迭代关联条目 ≥ 10 | `references/prd_template_deep.md` | 标准章节 + 现状分析 / 方案对比 / 分阶段交付 / 风险 / 迁移方案 |

---

## 执行流程

### Step 0: 增强注入

> 自动检测上游交付物，有则提取增强数据注入工作流，无则跳过。

```bash
python3 scripts/check_prerequisite.py --skill prd-gen --upstream-dir ./output --detect-enhancement
```

| 上游 | 提取字段 | 注入位置 | 增强效果 |
|------|---------|---------|---------|
| `decide` 决策文档 | 决策结论(做/不做)、优先级、约束条件 | Step 2 收集前置输入 | PRD有方向性约束，减少需求歧义 |

### Step 1：读取用户配置

**输入：** 用户配置文件 `data/config/user_{user_id}.json`（若不存在则使用默认配置）
**输出：** 配置参数（project_id、project_name、repo_key、prd_output_target、复杂度关键词）

```bash
# 用户配置文件位于 data/config/user_{user_id}.json
# 若不存在则使用默认配置
```

关键字段：`project_id`、`project_name`、`repo_key`（可选）、`prd_output_target`（可选，默认 `local`）、复杂度关键词配置（可选）

### Step 2：收集前置输入

**输入：** card_id + project_id + 数据源配置
**输出：** 四层输入数据（目标输入/项目概览/历史记录/代码仓约定）+ 输入覆盖度评估

```bash
python3 scripts/context_collector.py \
  --data-source {local|github} \
  collect --card-id {card_id} --project-id {project_id}
```

### Step 3：展示覆盖度评估

**输入：** 输入覆盖度评估结果
**输出：** 向用户展示的覆盖度消息（不阻断，直接进入下一步）

将 `input_coverage.user_message` 发送给用户（不阻断，直接进入下一步）。

### Step 4：生成 PRD

**输入：** 四层输入数据 + 模板选择（auto/agent/feature/hybrid/simple/deep）+ 输出目标
**输出：** PRD 文档（保存到本地/写回卡片/Wiki）

```bash
python3 scripts/generate.py \
  --card-id {card_id} \
  --project-id {project_id} \
  --data-source {local|github} \
  [--repo-key {repo_key}] \
  [--template auto|agent|feature|hybrid|simple|deep] \
  [--output-target local|card_content|wiki] \
  [--force]
```

### Step 5：告知用户

**输入：** PRD 文件路径 + 模板信息 + 输出目标 + 数据源
**输出：** 生成确认消息

```
✅ PRD 已生成

- 文件：{filename}
- 模板：{template_label}
- 写入目标：{output_target}
- 数据源：{data_source}
{若有 positioning_needed：提示刷新概览以提升后续 PRD 质量}
```

---

## 边界规则

- **不收集需求、不建卡**：该职责不在本 Skill 范围内
- **章节信息不足时**：标注 `⚠️ [待补充]`，不捏造内容
- **产品定位未确认时**：不静默写入，必须经用户确认
- **所有关键词和阈值**：来自用户配置或内置默认值，Skill 不硬编码业务逻辑

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "需求描述太简单，PRD随便写写就行" | 简单需求更需要精确PRD。模糊需求×模糊文档=灾难 |
| "历史PRD都没人看，写那么细干嘛" | 没人看≠不需要。可能是PRD质量太低不值得看，正确做法是提高质量 |
| "项目概览没有也不影响" | 没有概览=每份PRD都是孤岛。延续性断裂导致功能冲突和重复建设 |
| "代码仓约定不知道，跳过就行" | 跳过=PRD中的验收标准可能与现有系统不兼容。标注「未经代码验证」而非静默跳过 |
| "复杂度判断不重要，都用标准模板" | 用deep模板写简单bug修复=浪费时间；用simple模板写架构迁移=遗漏风险章节 |
| "先写了再说，覆盖度评估浪费时间" | 5分钟的评估避免2小时的返工。知道缺什么比假装不缺更高效 |

---

## 与其他Skill的衔接

| 方向 | 条件 | 增强方式 | 降级方式 |
|------|------|---------|---------|
| ← `decide` | 决策结论明确（做/不做） | 将决策文档作为PRD的需求输入，提升方向性 | 向用户澄清"PRD的方向和优先级是否已明确？" |
| ← `insight` | 有竞品/趋势报告 | 将市场洞察作为PRD的背景输入 | 向用户确认"是否需要市场背景补充PRD？"若需要则建议先运行insight |
| → `design` | PRD通过评审 | 将PRD中的验收标准作为设计需求 | 向用户确认"设计需求是否已有验收标准？" |
| → `arch` | PRD包含技术约束 | 将非功能需求传递给架构设计 | 向用户确认"非功能需求（性能/安全/可用性）是否已明确？" |

---

## 数据源配置详情

### local 模式

数据目录结构：
```
data/
  config/
    user_{user_id}.json    — 用户配置
  {project_id}/
    cards/
      {card_id}.json       — 卡片数据
    schema.json            — 项目 Schema
  {repo_key}/
    README.md              — 仓库文件
```

卡片 JSON 格式示例：
```json
{
  "card": {
    "id": "106",
    "seq_num": "106",
    "title": "用户注册功能优化",
    "content": "优化注册流程，减少步骤...",
    "type": "story",
    "priority": "option_1",
    "status": "in_progress",
    "plan_id": "sprint-12"
  }
}
```

### github 模式

- 需安装 `gh` CLI 并完成认证
- `--card-id` 对应 GitHub Issue 编号
- `--project-id` 对应仓库名
- `--gh-repo` 指定仓库（owner/repo 格式）
