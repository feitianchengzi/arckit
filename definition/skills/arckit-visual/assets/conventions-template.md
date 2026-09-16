# 视觉设计系统规范（arckit/visual）

## 目录结构

```
arckit/visual/
├── INDEX.md                      # 视觉系统索引
├── CONVENTIONS.md                # 本文件
├── _library/
│   ├── brief.md                  # 品牌方向与视觉策略
│   ├── design-tokens.yaml        # Design Tokens
│   ├── component-catalog.yaml    # 组件视觉目录
│   ├── style-preview.html        # Token/样式预览
│   └── preview-server.py         # 本地预览服务
├── themes/                       # 主题（可选，亮色/暗色等）
└── _archive/
```

**可交互原型与页面结构**：由 `arckit/interaction/` 维护（arckit-interaction skill）。

## 视觉系统规范

- 聚焦 **Design Tokens**、**组件状态/尺寸变体**、**主题与无障碍对比度**，完整业务页面由 interaction 原型承载，并应用本域规范。
- Token 变更后通过 `style-preview.html` + `preview-server.py` 自检，并列出受影响的 interaction 原型与映射更新，未同步项明确交接。

## 状态标识

- ✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃

## 探索与采纳

候选在 `_explorations/<topic>/` 独立维护 brief、Tokens/主题和预览，独立索引登记，不混入正式事实。记录问题、固定条件、基线、比较、选择依据和正式目标。
支持整案或部分组合采纳；用户已有选择直接落实，未确认的审美方向交付比较后保留待决定。组合后正式规范必须完整一致，交互原型同步应用。生产实现不自动批准候选，有效预期不因上线归档。
