---
name: arckit-visual
description: "维护 arckit/visual/ 下的视觉风格策略、Design Tokens、主题和组件视觉规格。用于用户要求查询、新建、更新、拆分或归档品牌调性、视觉语言、token、主题或组件视觉规则时；输出涉及的 visual 路径、依据和摘要。"
---

# ArcKit Visual — 视觉设计系统维护

管理 `arckit/visual/` 的视觉风格策略与 Design System，遵循「INDEX 驱动、动态拆解、Progressive Disclosure」原则。风格是源，视觉规范是投影；执行流程、脚本入口和路径约定保持稳定。专注于建立和维护系统化的视觉语言，不做业务页面的视觉稿。

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

## 正文规范（强制）

`arckit/visual/` 下的主文档是**设计系统结果规格**，描述视觉语言的当前有效定义。完整规范见 [`../_arckit_shared/content-spec.md`](../_arckit_shared/content-spec.md)（TECH-012），以下为执行摘要。

**语体**：陈述式、现在时，写「主色调取值为 #...，用于主操作场景」「按钮 hover 态背景色为 {color.primary-hover}」。YAML 的 `description` 字段同样适用——描述「是什么、用于何场景」，禁止写「本次新增了此 Token」。

**禁止混入**：成本/排期/版本迭代；Token 或组件的 CSS/HTML 实现片段（规格定义值，不写实现代码）；品牌演进历史的流水账。

**历史内容处置**：① 已废弃的 Token 或组件规格直接删除或归档至 `_archive/`；② 有对照价值的保留在文档末尾 `## 历史对照` 附录块；③ 附录块内仍用陈述式。

---

## 源-投影原则（强制）

`_library/brief.md` 中的「视觉策略」是 Design System 的风格源，定义品牌气质、信息层级、色彩角色、字体节奏、空间密度、组件性格、状态表达和主题策略。`design-tokens.yaml`、`component-catalog.yaml`、`themes/` 与 `style-preview.html` 是该风格源的规范投影。

执行任何变更时，必须判断本次请求属于哪一类：

- **投影变更**：只调整 Token 值、组件变体、主题覆盖或预览展示，品牌气质、信息层级、色彩角色、字体节奏、空间密度、状态表达不变。处理方式：保持视觉策略不变，更新对应投影产物。
- **源变更**：改变品牌气质、信息层级、色彩角色、字体节奏、空间密度、组件性格、状态表达或主题策略。处理方式：先更新 `_library/brief.md` 的「视觉策略」，再同步更新 tokens、组件规格、主题和预览。
- **源缺失**：`_library/brief.md` 没有「视觉策略」章节。处理方式：先补最小必要策略，再执行规范更新。

风格源不是品牌讨论稿；它是后续视觉规范是否成立的执行约束。

---

## 工作流（必读：先意图识别，再分支）

### 意图识别（第一步，必做）

根据用户输入判断意图：**查询** 或 **变更**。

- **查询**：仅需知道「有哪些 / 在哪 / 对应哪个文件」等，不修改任何文件。典型表述：列出、查看、有哪些 Token、当前色彩体系、某组件的视觉规格。
- **变更**：新建、更新、拆分、归档等会改动目录或文件的操作。

**若判定为查询**：
1. 只读 `arckit/visual/INDEX.md`（必要时按需读少量相关文档）。
2. 输出 `document_scope` 后**结束**，不执行任何写操作。输出格式见下方「最终输出：document_scope」之 `scope_kind: query`。

**若判定为变更**：继续执行「INDEX 全局分析」及后续步骤；执行结束后必须输出 `document_scope`，格式见 `scope_kind: change`。

---

### 最终输出：document_scope（每次调用结束前必须输出）

本 Skill 的**唯一 Output Contract** 是 `document_scope`：调用方据此知道本次在 `arckit/visual/` 下涉及了哪些文件，以及每项的一句话总结。

**查询结束时**（只读，无写操作）：
```yaml
document_scope:
  scope_kind: query
  root: arckit/visual/
  paths:
    - path: _library/design-tokens.yaml
      summary: Design Tokens，含色彩体系与字体阶梯
```

**变更结束时**（执行了新建/更新/拆分/归档等）：
```yaml
document_scope:
  scope_kind: change
  root: arckit/visual/
  created:
    - path: _library/component-catalog.yaml
      source_basis: 视觉策略要求操作组件具备清晰层级、明确状态和紧凑尺寸
      summary: 新增卡片组件视觉规格，含 elevated/outlined 变体
  updated:
    - path: _library/design-tokens.yaml
      source_basis: 视觉策略要求界面保持轻量层次，阴影仅用于可交互浮层
      summary: 新增 shadow 层级 Token（shadow-sm/md/lg/xl）
  deleted:
    - path: _library/component-catalog.yaml
      source_basis: 当前组件视觉策略已由拆分后的组件类别文件承接
      summary: 归档至 _archive，已由新 button.yaml 替代
```

- 每项必须包含 `path`（相对于 `arckit/visual/`）和 `summary`（一句话描述：查询时为文档内容简述，变更时为本次修改/新增/删除内容简述）。
- 变更项必须包含 `source_basis`，说明本次修改依据的视觉策略；若为纯归档，说明替代策略或废弃依据。
- 空列表用 `[]`，无则省略该键。

---

### 执行变更前：INDEX 全局分析 + 域归属判定

变更前按顺序执行以下步骤：

**第一步：读取并解析 INDEX.md**（必做）

**第二步：域归属判定**（必做，先于体积分析）

新内容落地前，判断 INDEX 中是否已有**覆盖同一视觉域**的文件（如新组件规格与已有组件类别的归属）：

- 有同域文件 → **默认并入**（更新该文件），不新建平行组件 YAML 或 Token 文件
- 有同域文件但职责已明显分化 → 阐明拆分理由，再新建
- 无同域文件 → 新建，路径按 INDEX 枝命名
- 发现多个文件域重叠 → 先合并再处理变更，合并记入 `document_scope.reorganized`

**第三步：视觉策略确认**（必做）

读取 `_library/brief.md` 的「视觉策略」章节；若是首次初始化或源缺失，则先补最小必要策略。判定本次请求是投影变更、源变更还是源缺失，并据此决定是否先更新风格源。

**第四步：体积与层级分析**（按下方「综合分析指标与拆分策略」判断是否需拆分）→ 输出分析结果 YAML → 按结果执行。**详细步骤与输出示例**见 [references/index-analysis.md](references/index-analysis.md)。

**第五步：投影一致性自查**（变更后必做）

- `design-tokens.yaml` 是否体现视觉策略中的色彩角色、字体节奏、空间密度、圆角/阴影/动效性格
- `component-catalog.yaml` 是否用 tokens 表达组件角色、变体、尺寸和状态，而不是另起一套视觉规则
- `themes/` 是否只改变主题变量，不改变视觉策略中的层级、密度和组件性格
- `style-preview.html` 是否展示关键 token、组件状态和主题效果，便于验收风格投影
- 若策略变化，是否同步更新所有受影响投影；若仅投影变化，是否没有暗中改变风格源

---

### 操作入口（详细步骤见 reference）

1. **初始化 Design System**（项目首次）：`bash scripts/init-design-system.sh "<项目名>" [visual-dir]`，创建 _library/、themes/、INDEX.md、CONVENTIONS.md。
2. **新建/更新 Design Tokens**：编辑 `_library/design-tokens.yaml`，按层级组织（colors/typography/spacing/corner_radius/shadows/animation）。
3. **新建/更新组件视觉规格**：编辑 `_library/component-catalog.yaml`，定义组件角色、视觉变体、尺寸变体、状态和 Token 引用。
4. **新建/更新主题**：在 `themes/` 下编辑主题配置，覆盖 Token 值。
5. **更新品牌方向与视觉策略**：编辑 `_library/brief.md`，维护品牌调性、色彩倾向、字体策略、设计原则和视觉策略。
6. **动态拆解**：按分析结果执行拆分方式。
7. **归档**：移入 _archive/，更新 INDEX 与 _map。

以上操作的详细执行步骤见 [references/operations.md](references/operations.md)。

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

## 参考资源

- INDEX 全局分析（步骤与示例）：[references/index-analysis.md](references/index-analysis.md)
- 操作详细步骤：[references/operations.md](references/operations.md)
- Design Tokens 模板：[assets/design-tokens-template.yaml](assets/design-tokens-template.yaml)
- 组件视觉目录模板：[assets/component-catalog-template.yaml](assets/component-catalog-template.yaml)
- 视觉预览模板：[assets/style-preview-template.html](assets/style-preview-template.html)
- 脚本：[scripts/init-design-system.sh](scripts/init-design-system.sh)
