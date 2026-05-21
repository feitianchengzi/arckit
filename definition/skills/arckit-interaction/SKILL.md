---
name: arckit-interaction
description: "Maintain interaction strategy, minimal wireframe-style HTML, and interaction docs in arckit/interaction/ (grayscale + line-only; no brand/color). Interaction strategy is the source; wireframes and specs are projections. INDEX-driven analysis, hierarchical flows, cross-references. Outputs document scope (query: path + summary; change: path + source_basis + summary). Triggers on interaction, wireframe, data-kit, 交互."
---

# ArcKit Interaction — 交互设计维护

管理 `arckit/interaction/` 的交互策略、线框图与交互文档，遵循「INDEX 驱动、动态拆解、渐进式揭示」原则。交互策略是源，线框与交互规范是投影；执行流程、脚本入口和路径约定保持稳定。

## 核心结构

```
interaction/
├── INDEX.md                 # 【入口】缩进树形索引（每级一句+文件行数）
├── CONVENTIONS.md          # 规范
├── wireframe-style.css    # 线框图统一样式（各 default.html 共用一个 CSS，根目录唯一）
├── [flow-or-page]/         # 流程/页面（有归属用分级嵌套）
│   ├── default.html        # 主线框图（含所有状态，200-500行，引用根目录 wireframe-style.css）
│   ├── interaction.md      # 交互文档（含交互策略与规范投影）
│   └── [sub-flow]/         # 子流程（深度不限）
└── _archive/
```

## INDEX.md 约定（动态拆解的依据）

```markdown
# 交互设计索引

✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃

- auth-flow/ 认证流程：登录注册、密码找回、邮箱验证。✅
  - login/ 登录页面：账密登录、社交登录、记住我选项。✅
    - default.html 登录线框：加载、成功、空状态、错误状态。✅ (285行)
    - interaction.md 登录交互：状态、导航、弹窗与错误处理。✅ (120行)
  - register/ 注册页面：多步注册、邮箱验证、服务条款确认。✅
    - default.html 注册线框：表单、协议、验证与反馈状态。✅ (420行)
    - interaction.md 注册交互：步骤流转、校验、错误恢复。✅ (160行)
  - password-reset/ 密码重置：找回密码完整流程。🟡
    - request/ 请求重置：输入邮箱、发送验证码、倒计时提示。🟡
      - default.html 请求重置线框：输入、倒计时、成功与错误状态。🟡 (180行)
      - interaction.md 请求重置交互：验证码发送、倒计时、失败恢复。🟡 (90行)
```

**关键**：
- 直接写文件名/目录名（不用链接语法）
- 一句话总结列出2-3个核心UI场景/状态
- 每个 HTML 文件后标注行数，便于判断是否需拆分子视图
- 依赖关系在 _map/RELATIONS.md 维护，不写在 INDEX 行内

## 正文规范（强制）

`arckit/interaction/` 下的主文档是**交互事实规格**，描述流程、状态与系统响应规则。完整规范见 [`../_arckit_shared/content-spec.md`](../_arckit_shared/content-spec.md)，以下为执行摘要。

**语体**：陈述式、现在时。`interaction.md` 写「用户触发 A，系统响应 B」「在 X 状态下，Y 不可用」。禁止改版叙事（「这个页面我们后来改成了…」）、落地建议、过程叙事。

**两类载体的规则**：
- `default.html`（线框图）：是交付物本身，HTML 结构不受文字语体约束；但禁止品牌色/主题色，禁止业务逻辑脚本（保持极简灰度线框风格）
- `interaction.md`（交互文档）：纯文字规范，禁止实现代码；描述交互规则与状态机，不写设计变更历史

**禁止混入**：成本/排期/版本迭代；在 `interaction.md` 中写实现代码；交互方案讨论过程（历史上考虑过哪些方案）写进正文。

**历史内容处置**：① 已废弃的流程/页面归档至 `_archive/`，更新 INDEX；② 有对照价值的旧交互规则移入 `interaction.md` 末尾 `## 历史对照` 附录块；③ 附录块内仍用陈述式。

---

## 源-投影原则（强制）

`interaction.md` 中的「交互策略」是同一页面/流程的交互源，定义核心任务、主路径、决策点、状态流、反馈机制、异常恢复和输入输出边界。`default.html` 是该策略的线框投影，`interaction.md` 中的状态、导航、行为、弹窗、错误和加载章节是该策略的规范投影。

执行任何变更时，必须判断本次请求属于哪一类：

- **投影变更**：只调整布局、控件表达、状态展示或局部规则，核心任务、主路径、状态流、反馈机制不变。处理方式：保持交互策略不变，更新对应投影产物。
- **源变更**：改变核心任务、主路径、决策点、状态流、反馈机制、异常恢复或输入输出边界。处理方式：先更新「交互策略」，再同步更新 `default.html` 与交互规范章节。
- **源缺失**：目标 `interaction.md` 没有「交互策略」章节。处理方式：先补最小必要策略，再执行产物更新。

策略源不是额外讨论稿；它是后续线框和规范是否成立的执行约束。

---

## 工作流（必读：先意图识别，再分支）

### 意图识别（第一步，必做）

根据用户输入判断意图：**查询** 或 **变更**。

- **查询**：仅需知道「有哪些 / 在哪 / 对应哪个文件」等，不修改任何文件。典型表述：列出、查看、有哪些、找、定位、某页面在哪、INDEX 里有什么、某个流程下有哪些页面。
- **变更**：新建、更新、拆分、归档等会改动目录或文件的操作。

**若判定为查询**：
1. 只读 `arckit/interaction/INDEX.md`（必要时按需读少量相关文档）。
2. 输出「文档范围」后**结束**，不执行任何写操作。输出格式见下方「最终输出：文档范围」之 `scope_kind: query`。

**若判定为变更**：继续执行「INDEX 全局分析」及后续步骤；执行结束后必须输出「文档范围」，格式见 `scope_kind: change`。

---

### 最终输出：文档范围（每次调用结束前必须输出）

本 Skill 的**唯一结果形态**是「文档范围」：调用方据此知道本次在 `arckit/interaction/` 下涉及了哪些文件，以及每项的一句话总结。

**查询结束时**（只读，无写操作）：
```yaml
document_scope:
  scope_kind: query
  root: arckit/interaction/
  paths:
    - path: auth-flow/login/default.html
      summary: 登录页主线框图，含账密/社交登录状态
    - path: auth-flow/login/interaction.md
      summary: 登录页交互文档，含导航、弹窗与错误处理
```

**变更结束时**（执行了新建/更新/拆分/归档等）：
```yaml
document_scope:
  scope_kind: change
  root: arckit/interaction/
  created:
    - path: auth-flow/register/default.html
      source_basis: 注册策略要求多步推进、邮箱验证前置、协议确认在提交前完成
      summary: 新增注册页线框图，多步注册与邮箱验证
  updated:
    - path: auth-flow/login/default.html
      source_basis: 登录策略要求单列主路径、错误就地反馈、找回密码作为恢复路径
      summary: 新增忘记密码入口与错误态样式
  deleted:
    - path: legacy/welcome.html
      source_basis: 新首页策略已覆盖欢迎页的首次进入路径
      summary: 归档至 _archive，已由新首页替代
```

- 每项必须包含 `path`（相对于 `arckit/interaction/`）和 `summary`（一句话描述：查询时为文档内容简述，变更时为本次修改/新增/删除内容简述）。
- 变更项必须包含 `source_basis`，说明本次修改依据的交互策略；若为纯归档，说明替代策略或废弃依据。
- 空列表用 `[]`，无则省略该键。

---

### 执行变更前：INDEX 全局分析 + 域归属判定

变更前按顺序执行以下步骤：

**第一步：读取并解析 INDEX.md**（必做）

**第二步：域归属判定**（必做，先于体积分析）

新内容落地前，判断 INDEX 中是否已有**覆盖同一流程/页面域**的文件：

- 有同域文件 → **默认并入**（更新 `default.html` 或 `interaction.md` 的对应部分），不新建平行线框或文档
- 有同域文件但职责已明显分化（如主流程 vs 独立子流程）→ 阐明拆分理由，再新建
- 无同域文件 → 新建，路径按 INDEX 枝命名
- 发现多个文件域重叠 → 先合并再处理变更，合并记入 `document_scope.reorganized`

**第三步：交互策略确认**（必做）

读取目标 `interaction.md` 的「交互策略」章节；若是新建页面/流程，则先在模板中补齐最小必要策略。判定本次请求是投影变更、源变更还是源缺失，并据此决定是否先更新策略源。

**第四步：体积与层级分析**（按下方「综合分析指标与拆分策略」判断是否需拆分）→ 输出分析结果 YAML → 按结果执行。**详细步骤与输出示例**见 [references/index-analysis.md](references/index-analysis.md)。

**第五步：投影一致性自查**（变更后必做）

- `default.html` 是否体现交互策略的核心任务、主路径、决策点和信息揭示顺序
- `interaction.md` 的状态、导航、行为、弹窗、错误和加载章节是否覆盖策略中的状态流、反馈机制和异常恢复
- 线框图中的状态区、反馈位置、禁用/错误/空/加载表达是否与交互规范一致
- 若策略变化，是否同步更新所有受影响投影；若仅投影变化，是否没有暗中改变策略

---

### 操作入口（详细步骤见 reference）

1. **新建页面/流程**：`bash scripts/new-page-design.sh <page-name> <view-name> <platform> [interaction-dir]`，platform: iOS | iPad | macOS。填充 default.html 时须保持层级：wireframe-canvas > device-frame > 业务内容（见 [references/wireframe-style.md](references/wireframe-style.md)「线框图 HTML 结构层级」）。
2. **更新线框/交互规范**：先确认交互策略，再更新 `default.html` 或 `interaction.md` 的规范章节；修改 HTML 时保持上述 DOM 层级。
3. **动态拆解**：按分析结果执行拆分方式。
4. **归档设计**：移入 _archive/，更新 INDEX 与 _map。

以上 1～4 的详细执行步骤见 [references/operations.md](references/operations.md)。

## 综合分析指标与拆分策略

| 维度 | 指标 | 阈值 | 拆分方式 |
|------|------|------|---------|
| 单文件长度 | default.html | >500行（强制） | 按区域/状态拆为子视图 HTML |
| 单文件长度 | interaction.md | >500行（强制） | 按交互场景拆为子流程 |
| 单文件长度 | INDEX.md | >150行（强制） | 按流程分二级 INDEX |
| 层级深度 | 嵌套层数 | >3层 | 平级化：将深层子流程提升 |
| 流程复杂度 | 单流程页面数 | >6个 | 按子流程分组 |

## 极简线框图风格（强制）

**所有 arckit/interaction 下产出的 HTML 线框图必须且仅使用极简线框图风格**：

- **仅允许**：灰度（`:root` 中的 `--gray-*` / `--white`）、线框（边框/描边）、占位符与结构表达。
- **禁止**：在 HTML 或 `wireframe-style.css` 中使用品牌色、主题色、彩色（含内联 `style`、额外色值）。扩展样式时只可新增使用现有灰度变量的类。
- **校验**：产出或更新线框图后自检：无 `color`/`background`/`border-color` 等使用十六进制彩色或非灰度变量；无内联彩色样式。

详见 [references/wireframe-style.md](references/wireframe-style.md)。

## wireframe-style.css

统一样式在 interaction 根目录 `wireframe-style.css`，各 HTML 用相对路径引用；脚本会确保根目录存在该文件。**扩写时须遵守** [references/wireframe-style.md](references/wireframe-style.md) 中的**扩写规则**：抽象为通用组件（不与具体业务耦合）、扩写前搜索避免重复定义、按既有区块归类添加。

## data-kit 标注（消除代码生成歧义）

参考 [references/data-kit-mappings.md](references/data-kit-mappings.md)：只标注语义有歧义的容器（如 `data-kit="NavigationStack"`）；弹窗必须标注展示方式（`data-kit="Sheet"`）。

## 必须更新的文件

| 操作 | 更新 |
|------|------|
| 新建设计 | INDEX.md（含行数）、_map/RELATIONS.md、feature-matrix.md；若线框图用到新样式则同步补齐 wireframe-style.css |
| 更新线框/交互规范 | INDEX.md（更新行数）、feature-matrix.md（若状态变更）；若涉及新样式/类名则同步更新 wireframe-style.css |
| 拆分子视图 | INDEX.md（添加子视图条目） |
| 归档 | INDEX.md、_map/RELATIONS.md、feature-matrix.md |

## 状态标识

```
✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃
```

## 参考资源

- INDEX 全局分析（步骤与示例）：[references/index-analysis.md](references/index-analysis.md)
- 操作详细步骤：[references/operations.md](references/operations.md)
- data-kit 映射：[references/data-kit-mappings.md](references/data-kit-mappings.md)
- 线框图统一样式说明：[references/wireframe-style.md](references/wireframe-style.md)；源文件 [assets/wireframe-style.css](assets/wireframe-style.css)（复制到 interaction 根后供各 HTML 引用）
- 脚本：[scripts/new-page-design.sh](scripts/new-page-design.sh)
