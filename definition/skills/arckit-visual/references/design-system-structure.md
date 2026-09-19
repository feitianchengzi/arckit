# Design System 结构与规格格式

## 核心结构

```
visual/
├── INDEX.md                 # 【入口】缩进树形索引（每级一句+文件行数）
├── CONVENTIONS.md          # 视觉规范
├── _library/               # Design System 核心
│   ├── brief.md            # 品牌方向与视觉策略（风格源）
│   ├── design-tokens.yaml  # Design Tokens（色彩、字体、间距、圆角、阴影、动效曲线）
│   ├── component-catalog.yaml # 组件视觉规格目录
│   ├── style-preview.html  # Design Token 与组件样式预览页
│   └── preview-server.py   # 本地预览服务
├── _explorations/          # 候选风格、比较与采纳记录（独立索引）
├── themes/                 # 主题配置
└── _archive/
```

## INDEX.md 约定（动态拆解的依据）

```markdown
# 视觉设计系统索引

✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃

- _library/ Design System 核心：Tokens、品牌、组件规格。✅
  - brief.md 品牌方向与视觉策略：调性、层级、色彩角色、字体节奏、组件性格。✅ (85行)
  - design-tokens.yaml Design Tokens：色彩体系、字体阶梯、间距尺度、圆角、阴影。✅ (120行)
  - component-catalog.yaml 组件视觉目录：组件角色、变体、尺寸、状态与 Token 引用。🟡 (60行)
  - style-preview.html Token 与样式预览页。✅ (240行)
- themes/ 主题配置：亮色、暗色、无障碍适配。🟡
  - light.yaml 亮色主题：Token 覆盖值。✅ (40行)
  - dark.yaml 暗色主题：Token 覆盖值。🟡 (35行)
```

**关键**：
- 直接写文件名/目录名（不用链接语法）
- 一句话总结列出核心内容范围
- 每个文件后标注行数，便于判断是否需拆分
- 依赖关系在 _map/RELATIONS.md 维护，不写在 INDEX 行内


## 综合分析指标与拆分策略

| 维度 | 指标 | 阈值 | 拆分方式 |
|------|------|------|---------|
| 单文件长度 | design-tokens.yaml | >300行（强制） | 拆到 tokens/ 目录（color-tokens.yaml / typography-tokens.yaml 等） |
| 单文件长度 | component-catalog.yaml | >200行（强制） | 按组件类别拆分 |
| 单文件长度 | INDEX.md | >150行（强制） | 按类别分二级 INDEX |
| 层级深度 | 嵌套层数 | >3层 | 平级化：将深层子类别提升 |
| 组件数量 | component-catalog.yaml 下组件数 | >15个 | 按组件类别拆分（form-components.yaml / layout-components.yaml 等） |

## Design Tokens 结构约定

```yaml
# design-tokens.yaml 推荐结构
color:
  primary: { value: "#...", description: "主色调" }
  secondary: { value: "#...", description: "辅助色" }
  # semantic
  surface: { value: "#...", description: "背景面" }
  on-surface: { value: "#...", description: "背景面上的文字" }
  error: { value: "#...", description: "错误状态" }

typography:
  display: { family: "...", size: "...", weight: "...", line-height: "..." }
  headline: { ... }
  body: { ... }
  caption: { ... }

spacing:
  xs: { value: "4px" }
  sm: { value: "8px" }
  md: { value: "16px" }
  lg: { value: "24px" }
  xl: { value: "32px" }

radius:
  sm: { value: "4px" }
  md: { value: "8px" }
  lg: { value: "16px" }
  full: { value: "9999px" }

shadow:
  sm: { value: "0 1px 2px rgba(0,0,0,0.05)" }
  md: { value: "0 4px 6px rgba(0,0,0,0.1)" }
  lg: { value: "0 10px 15px rgba(0,0,0,0.1)" }

motion:
  duration:
    fast: { value: "150ms" }
    normal: { value: "300ms" }
    slow: { value: "500ms" }
  easing:
    ease-out: { value: "cubic-bezier(0, 0, 0.2, 1)" }
    ease-in-out: { value: "cubic-bezier(0.4, 0, 0.2, 1)" }
```

## 组件视觉规格约定

```yaml
# component-catalog.yaml 推荐结构
name: Button
description: 操作按钮
variants:
  primary:
    default: { bg: "{color.primary}", text: "{color.on-primary}", border: "none" }
    hover: { bg: "{color.primary-hover}", ... }
    active: { bg: "{color.primary-active}", ... }
    disabled: { bg: "{color.disabled}", text: "{color.on-disabled}", ... }
  secondary: { ... }
  ghost: { ... }
sizes:
  sm: { height: "32px", padding: "{spacing.sm} {spacing.md}", font: "{typography.caption}" }
  md: { height: "40px", padding: "{spacing.sm} {spacing.lg}", font: "{typography.body}" }
  lg: { height: "48px", padding: "{spacing.md} {spacing.xl}", font: "{typography.body}" }
```

## 必须更新的文件

| 操作 | 更新 |
|------|------|
| 新建 Token/组件 | INDEX.md（含行数）、_map/RELATIONS.md、feature-matrix.md |
| 更新 Token/组件 | INDEX.md（更新行数）、feature-matrix.md（若状态变更） |
| 拆分文件 | INDEX.md（添加拆分后的条目） |
| 归档 | INDEX.md、_map/RELATIONS.md、feature-matrix.md |

## 状态标识

```
✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃
```
