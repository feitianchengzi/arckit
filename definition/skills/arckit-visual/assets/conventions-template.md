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

**线框图与页面结构**：由 `arckit/interaction/` 维护（arckit-interaction skill）。

## 视觉系统规范

- 聚焦 **Design Tokens**、**组件状态/尺寸变体**、**主题与无障碍对比度**，不做业务页面 1:1 视觉稿。
- Token 变更后通过 `style-preview.html` + `preview-server.py` 自检。

## 状态标识

- ✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃
