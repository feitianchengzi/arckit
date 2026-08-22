# wireframe-style.css 与线框图样式

## 位置与用途

- **位置**：`arckit/interaction/wireframe-style.css`（interaction 根目录，全目录唯一一份）
- **用途**：所有线框图 HTML（default.html、子视图 .html）共用的统一样式，保证线框图视觉一致、便于审查

## 引用方式

各页面 HTML 用相对路径引用根目录 CSS。例如子目录 `auth-flow/login/` 下的 default.html：

```html
<link rel="stylesheet" href="../../wireframe-style.css">
```

根据层级回退到 interaction 根。脚本 [new-page-design.sh](../scripts/new-page-design.sh) 会确保 interaction 根目录存在该文件（从 skill 的 assets 复制）。

## 业务开发中的维护（与 HTML 同步）

为支撑 HTML 线框图正确渲染，**凡新增或修改线框图 HTML 时**：若使用了新的类名、选择器或组件样式，须同步在 `wireframe-style.css` 中补充对应规则；仅改文案或 DOM 结构且未引入新样式时，可只改 HTML。这样保证线框图与统一样式始终一致、审查与后续代码生成可依赖同一份样式。**扩写须遵守下方「扩写规则」**。

## 扩写规则（强制）

在 `wireframe-style.css` 中新增或修改样式时须遵守：

1. **通用组件、不耦合业务**：只定义通用语义类名（如 `.card`、`.list-item`），禁止业务专属类（如 `.login-form`、`.order-card`）；按角色/形态命名，不按场景/功能命名。
2. **不重复定义**：扩写前在文件中搜索是否已有相同或近似视觉的类；同一视觉只保留一份规则，微调优先用现有类扩展（如 `.card.compact`）或组合；新规则按既有区块（Header、Navigation、Form Controls、Cards、Modal 等）归类插入。

自检：是否为通用组件、是否搜索过已有类、是否仅用 `:root` 变量。

## 极简线框图定义（强制）

线框图**仅**做结构表达，视觉上为**极简线框图风格**：

- **允许**：灰度（仅使用 `:root` 中的 `--gray-0`～`--gray-6`、`--white`）、1px 线框/边框、占位块、虚线框、简单圆角与间距。
- **禁止**：任何品牌色、主题色或彩色（包括 `#xxx` 非灰度、`rgb/rgba` 非灰、内联 `style` 中的颜色）。不在本文件中定义或引用彩色；品牌与 Token 仅存在于 `arckit/visual/_library/design-tokens.yaml`，不用于线框图 HTML。
- **扩展**：若需新增类名，只可沿用现有灰度变量与线框语义，不得引入新色值。

## 线框图 HTML 结构层级

填充 default.html 或 wireframe-page-template 时**必须**遵守以下 DOM 层级，避免业务内容与 device-frame 平级。

| 层级 | 类名 | 作用 | 说明 |
|------|------|------|------|
| 画布 | `.wireframe-canvas` | 衬底 + 居中容器 | 其内**有且仅有**一个直接子元素 `.device-frame` |
| 设备框 | `.device-frame` | 设备视口、宽度由平台决定 | 无/.tablet/.desktop；整体在 canvas 内居中 |
| 业务 UI | 导航、内容区、弹窗占位等 | 页面线框内容 | **全部**放在 `.device-frame` **内部**，不得与 device-frame 平级 |

- **正确**：`wireframe-canvas` > `device-frame` >（`nav-bar` / `toolbar` + `content-area` / 其他业务块）
- **错误**：`wireframe-canvas` 下出现 `device-frame` 与 业务内容 作为兄弟节点

完整说明与示例见 [assets/wireframe-page-template.html](../assets/wireframe-page-template.html) 顶部注释。

## 内容要点

- CSS 变量：灰度、间距、圆角（无彩色变量）
- 基础重置
- 状态区：details/summary
- `.wireframe-canvas` / `.device-frame`（见上表）
- `.nav-bar` 等

## CONVENTIONS 与 interaction 结构

- 规范全文：assets/conventions-template.md（init 时复制为 interaction/CONVENTIONS.md）
- 交互文档结构：assets/interaction-template.md（new-page-design 时复制为各页面 interaction.md）
