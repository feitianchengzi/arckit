---
name: arckit-idea
description: |
  管理 arckit/idea/ 下需要长期留痕的商机和产品创意记录。用于用户明确要求登记、保存、跟踪、更新、归档商机或产品创意时，维护对应分类的索引与详情文件。
  典型输入是客户需求、合作线索、内部产品创意、已有条目的进展、状态变化、补充信息或复盘记录；典型产物是 business-opportunities/ 或 product-ideas/ 下的详情文件和主索引。
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
