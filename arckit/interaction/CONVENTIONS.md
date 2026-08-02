# 交互设计文档规范（arckit/interaction）

## 目录结构

```
arckit/interaction/
├── INDEX.md                      # 交互设计地图
├── CONVENTIONS.md                # 本文件
├── wireframe-style.css           # 线框统一样式（根目录唯一）
├── [flow-or-page]/               # 流程/页面
│   ├── default.html              # 主线框图（data-kit 标注）
│   ├── [sub-view].html           # 子视图（复杂页面拆分时）
│   └── interaction.md            # 交互说明
└── _archive/
```

**Design Tokens / 组件视觉 / 主题**：由 `arckit/visual/` 维护（arckit-visual skill），与本目录分离。

## 线框图规范

- **视觉风格（强制）**: 极简线框图 — 仅使用 wireframe-style.css 中的灰度与线框类，禁止内联彩色样式，禁止在 HTML 或 CSS 中引入非灰度色值。
- **扩写 wireframe-style.css**：仅添加通用组件类（不与具体业务耦合）；扩写前在文件中搜索，避免重复定义；按既有区块归类插入。详见 references/wireframe-style.md「扩写规则」。
- 格式: 自包含 HTML，样式仅来自根目录 wireframe-style.css（相对路径引用）
- 状态: 至少 4 个（加载中/成功/空状态/错误）
- 标注: 关键节点使用 data-kit 属性标注目标平台控件
- 弹窗: 直接渲染在页面中，不使用 position:fixed
- 设备: `.device-frame`（iOS）/ `.tablet`（iPad）/ `.desktop`（macOS）

## 复杂页面拆分

- default.html 为整体骨架（各区域占位）
- 再平铺各区域独立 .html（sidebar.html、editor-area.html 等）

## 状态标识

- ✅ 已完成 | 🟡 设计中 | ⚪ 待设计 | 🔴 已废弃
