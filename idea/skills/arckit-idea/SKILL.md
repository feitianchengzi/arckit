---
name: arckit-idea
description: |
  管理商机和产品创意的数据跟踪。用于新建或更新商机、产品创意记录，维护 arckit/idea/ 下对应分类的索引与详情文件。
  触发场景：用户描述新商机、新产品创意，或更新现有商机/创意的进展、状态、需求变更。
  触发关键词：商机、客户需求、产品创意、新想法、项目跟进、更新进展、客户反馈、创意、做一个、开发、合作。
---

# ArcKit Idea — 商机与产品创意管理

管理 `arckit/idea/` 下两类追踪数据：**商机**（客户驱动）和**产品创意**（内部驱动）。

## 目录结构

```
arckit/idea/
├── business-opportunities/
│   ├── business-opportunities.md   # 主索引
│   └── {商机名称}.md               # 详情文件
└── product-ideas/
    ├── product-ideas.md            # 主索引
    └── {创意名称}.md               # 详情文件
```

## 工作流

### 第一步：判断类型

| 用户说的 | 类型 |
|---------|------|
| 客户要求、项目合作、交付、客户名称、里程碑 | 商机 |
| 我想做、新想法、自研、创意、系统/应用/工具 | 产品创意 |

### 第二步：判断操作

- **新建**：用户描述新内容，未提及现有名称 → 创建详情文件 + 更新主索引
- **更新**：用户提及现有名称或明确说"更新/进展/完成" → 更新详情文件（追加记录）+ 视状态变更更新主索引

### 第三步：执行

**商机操作** → 字段规范见 [references/business-opportunities.md](references/business-opportunities.md)，详情模板见 [assets/business-opportunity-template.md](assets/business-opportunity-template.md)

**产品创意操作** → 字段规范见 [references/product-ideas.md](references/product-ideas.md)，详情模板见 [assets/product-idea-template.md](assets/product-idea-template.md)

## 通用规则

- 从用户输入中智能提取信息，不要求用户提供固定格式
- 信息不完整时基于描述合理推断，标注为推断内容
- 文件名使用中文名称，避免特殊字符
- 每次操作后必须同步更新主索引文件
