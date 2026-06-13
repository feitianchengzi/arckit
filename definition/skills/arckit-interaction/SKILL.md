---
name: arckit-interaction
description: "维护 arckit/interaction/ 下的页面级交互策略、灰度线框 HTML 和交互文档。用于用户要求查询、新建、更新、拆分或归档页面流程、状态、表单、导航、线框或交互规则时；输出涉及的 interaction 路径、依据和摘要。"
---

# ArcKit Interaction — 交互设计维护

管理 `arckit/interaction/` 的交互策略、线框图与交互文档，遵循「INDEX 驱动、页面拆分、动态拆解、Progressive Disclosure」原则。交互策略是源，线框与交互规范是投影；执行流程、脚本入口和路径约定保持稳定。

## 核心结构

```
interaction/
├── INDEX.md                 # 【入口】页面索引（每页一句+文件行数）
├── CONVENTIONS.md          # 规范
├── wireframe-style.css    # 线框图统一样式（各 default.html 共用一个 CSS，根目录唯一）
├── [page-name]/            # 页面目录（严格按页面拆分；一级目录不得用流程/功能域命名）
│   ├── default.html        # 页面主线框图（含页面所有关键状态，200-500行，引用根目录 wireframe-style.css）
│   ├── interaction.md      # 页面交互文档（含交互策略与规范投影）
│   └── [page-subview].html # 可选：同一页面内过多状态/弹窗的子视图投影
└── _archive/
```

## INDEX.md 约定（动态拆解的依据）

```markdown
# 交互设计索引

✅ 已完成 | 🟡 进行中 | ⚪ 计划中 | 🔴 已废弃

- login/ 登录页面：账密登录、社交登录、错误恢复。✅
  - default.html 登录线框：加载、成功、空状态、错误状态。✅ (285行)
  - interaction.md 登录交互：状态、导航、弹窗与错误处理。✅ (120行)
- register/ 注册页面：多步注册、邮箱验证、服务条款确认。✅
  - default.html 注册线框：表单、协议、验证与反馈状态。✅ (420行)
  - interaction.md 注册交互：步骤流转、校验、错误恢复。✅ (160行)
- password-reset-request/ 密码重置请求页面：输入邮箱、发送验证码、倒计时提示。🟡
  - default.html 请求重置线框：输入、倒计时、成功与错误状态。🟡 (180行)
  - interaction.md 请求重置交互：验证码发送、倒计时、失败恢复。🟡 (90行)
```

**关键**：
- 直接写文件名/目录名（不用链接语法）
- 一句话总结列出2-3个页面核心场景/状态
- 每个 HTML 文件后标注行数，便于判断是否需拆分子视图
- 依赖关系在 _map/RELATIONS.md 维护，不写在 INDEX 行内

## 正文规范（强制）

`arckit/interaction/` 下的主文档是**交互事实规格**，描述流程、状态与系统响应规则。完整规范见 [`../_arckit_shared/content-spec.md`](../_arckit_shared/content-spec.md)，以下为执行摘要。

**语体**：陈述式、现在时。`interaction.md` 写「用户触发 A，系统响应 B」「在 X 状态下，Y 不可用」。禁止改版叙事（「这个页面我们后来改成了…」）、落地建议、过程叙事。

**两类载体的规则**：
- `default.html`（线框图）：是交付物本身，HTML 结构不受文字语体约束；但禁止品牌色/主题色，禁止业务逻辑脚本（保持极简灰度线框风格）
- `interaction.md`（交互文档）：纯文字规范，禁止实现代码；描述交互规则与状态机，不写设计变更历史

**禁止混入**：成本/排期/版本迭代；在 `interaction.md` 中写实现代码；交互方案讨论过程（历史上考虑过哪些方案）写进正文。

**历史内容处置**：① 已废弃的页面归档至 `_archive/`，更新 INDEX；② 有对照价值的旧交互规则移入 `interaction.md` 末尾 `## 历史对照` 附录块；③ 附录块内仍用陈述式。

---

## 源-投影原则（强制）

`interaction.md` 中的「交互策略」是同一页面的交互源，定义该页面的核心任务、主路径、决策点、状态流、反馈机制、异常恢复和输入输出边界。`default.html` 是该策略的线框投影，`interaction.md` 中的状态、导航、行为、弹窗、错误和加载章节是该策略的规范投影。

执行任何变更时，必须判断本次请求属于哪一类：

- **投影变更**：只调整布局、控件表达、状态展示或局部规则，核心任务、主路径、状态流、反馈机制不变。处理方式：保持交互策略不变，更新对应投影产物。
- **源变更**：改变核心任务、主路径、决策点、状态流、反馈机制、异常恢复或输入输出边界。处理方式：先更新「交互策略」，再同步更新 `default.html` 与交互规范章节。
- **源缺失**：目标 `interaction.md` 没有「交互策略」章节。处理方式：先补最小必要策略，再执行产物更新。

策略源不是额外讨论稿；它是后续线框和规范是否成立的执行约束。

---

## 状态投影质量门槛（强制）

源-投影不能把原型压缩成摘要。复杂流程的 `default.html` 必须把交互策略中的关键任务阶段投影为可见状态，而不是只在 `interaction.md` 中描述。

**复杂流程判定**：满足任一条件即按复杂流程处理：
- 包含 3 个及以上任务阶段或决策点
- 包含 Sheet / Alert / ConfirmationDialog / 权限请求 / 长任务执行
- 包含错误恢复、失败重试、中断恢复、返回修正、稍后继续等恢复路径
- 包含多个输入来源、批处理、支付、权限、生成、导入导出等高风险操作

**复杂流程的 HTML 要求**：
- `default.html` 必须用独立 `<details>` 状态块表达关键阶段；第一个状态设置 `open`
- 每个状态必须包含：`触发条件`、`.wireframe-canvas > .device-frame`、`组件清单`、`交互行为`
- 状态名称必须来自真实任务阶段，例如「入口」「选择来源」「预览结果」「返回修正」「执行中」「完成结果」「网络失败恢复」「权限拒绝恢复」
- 关键阶段不得只作为同一设备框里的连续 section；除非它们确实是同屏渐进揭示，并在交互策略中说明
- 若 Sheet / Alert / overlay 状态过多，允许在同一页面目录内拆出 `overlays.html` 等页面子视图 HTML；拆分后必须在 INDEX 与 `interaction.md` 中交叉引用
- 策略章节不能替代线框状态；策略中的关键状态、决策点和异常恢复必须在 HTML 中可见

**简单页面**仍可用加载/内容/空/错误等基础状态，但不能删去用户明确要求的业务阶段。

---

## 工作流（必读：先意图识别，再分支）

### 意图识别（第一步，必做）

根据用户输入判断意图：**查询** 或 **变更**。

- **查询**：仅需知道「有哪些 / 在哪 / 对应哪个文件」等，不修改任何文件。典型表述：列出、查看、有哪些、找、定位、某页面在哪、INDEX 里有什么、某个流程下有哪些页面。
- **变更**：新建、更新、拆分、归档等会改动目录或文件的操作。

**若判定为查询**：
1. 只读 `arckit/interaction/INDEX.md`（必要时按需读少量相关文档）。
2. 输出 `document_scope` 后**结束**，不执行任何写操作。输出格式见下方「最终输出：document_scope」之 `scope_kind: query`。

**若判定为变更**：继续执行「INDEX 全局分析」及后续步骤；执行结束后必须输出 `document_scope`，格式见 `scope_kind: change`。

---

### 最终输出：document_scope（每次调用结束前必须输出）

本 Skill 的**唯一 Output Contract** 是 `document_scope`：调用方据此知道本次在 `arckit/interaction/` 下涉及了哪些页面文件，以及每项的一句话总结。

**查询结束时**（只读，无写操作）：
```yaml
document_scope:
  scope_kind: query
  root: arckit/interaction/
  paths:
    - path: login/default.html
      summary: 登录页主线框图，含账密/社交登录状态
    - path: login/interaction.md
      summary: 登录页交互文档，含导航、弹窗与错误处理
```

**变更结束时**（执行了新建/更新/拆分/归档等）：
```yaml
document_scope:
  scope_kind: change
  root: arckit/interaction/
  created:
    - path: register/default.html
      source_basis: 注册策略要求多步推进、邮箱验证前置、协议确认在提交前完成
      summary: 新增注册页线框图，多步注册与邮箱验证
  updated:
    - path: login/default.html
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

### 执行变更前：INDEX 全局分析 + 页面归属判定

变更前按顺序执行以下步骤：

**第一步：读取并解析 INDEX.md**（必做）

**第二步：页面归属判定**（必做，先于体积分析）

新内容落地前，必须先映射到具体页面。`arckit/interaction/` 的一级目录严格代表页面，不代表流程、功能域、模块组或任务域：

- 已有目标页面 → **默认并入**该页面目录，更新 `default.html` 或 `interaction.md` 的对应部分
- 同一页面状态过多 → 在该页面目录内新增子视图 HTML（如 `overlays.html`、`promote-states.html`），不新建流程级目录
- 跨多个页面 → 分别更新多个页面目录，并在 `_map/RELATIONS.md` 记录页面间关系
- 无目标页面 → 新建页面目录，路径使用页面名，不使用流程名
- 发现现有目录按流程/功能域组织 → 先重组为页面目录，再处理变更，重组记入 `document_scope.reorganized`

**第三步：交互策略确认**（必做）

读取目标 `interaction.md` 的「交互策略」章节；若是新建页面，则先在模板中补齐最小必要策略。判定本次请求是投影变更、源变更还是源缺失，并据此决定是否先更新策略源。

**第四步：体积与层级分析**（按下方「综合分析指标与拆分策略」判断是否需拆分）→ 输出分析结果 YAML → 按结果执行。**详细步骤与输出示例**见 [references/index-analysis.md](references/index-analysis.md)。

**第五步：投影一致性自查**（变更后必做）

- `default.html` 是否体现交互策略的核心任务、主路径、决策点和信息揭示顺序
- `interaction.md` 的状态、导航、行为、弹窗、错误和加载章节是否覆盖策略中的状态流、反馈机制和异常恢复
- 线框图中的状态区、反馈位置、禁用/错误/空/加载表达是否与交互规范一致
- 复杂流程是否把关键任务阶段投影为独立 `<details>` 状态块，而不是压缩成单屏 section
- 每个状态是否都包含触发条件、组件清单、交互行为
- Sheet / Alert / overlay / 恢复路径是否在 HTML 中可见；若拆分到 `overlays.html` 等页面子视图，INDEX 与 `interaction.md` 是否引用
- 若策略变化，是否同步更新所有受影响投影；若仅投影变化，是否没有暗中改变策略

---

### 操作入口（详细步骤见 reference）

1. **新建页面**：`bash scripts/new-page-design.sh <page-name> <view-name> <platform> [interaction-dir]`，platform: iOS | iPad | macOS。填充 default.html 时须保持层级：wireframe-canvas > device-frame > 业务内容（见 [references/wireframe-style.md](references/wireframe-style.md)「线框图 HTML 结构层级」）。
2. **更新线框/交互规范**：先确认交互策略，再更新 `default.html` 或 `interaction.md` 的规范章节；修改 HTML 时保持上述 DOM 层级。
3. **动态拆解**：按分析结果执行拆分方式。
4. **归档设计**：移入 _archive/，更新 INDEX 与 _map。

以上 1～4 的详细执行步骤见 [references/operations.md](references/operations.md)。

## 综合分析指标与拆分策略

| 维度 | 指标 | 阈值 | 拆分方式 |
|------|------|------|---------|
| 单文件长度 | default.html | >500行（强制） | 按区域/状态拆为子视图 HTML |
| 单文件长度 | interaction.md | >500行（强制） | 按页面内场景拆章节，必要时新增同页面子视图 |
| 单文件长度 | INDEX.md | >150行（强制） | 按页面分二级 INDEX |
| 层级深度 | 嵌套层数 | >3层 | 收敛到页面目录，避免深层流程目录 |
| 页面复杂度 | 单页面状态数 | >8个 | 在同一页面目录内拆子视图 HTML |

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

## 页面拆分硬规则

- `arckit/interaction/` 一级目录必须是一张真实页面或一个稳定路由/页签，不得是流程、功能域、模块组或任务域。
- 流程只能体现在页面的「交互策略」、状态表和 `default.html` 的 `<details>` 状态块中。
- 同一流程跨多个页面时，按页面拆到多个目录，并在 `_map/RELATIONS.md` 记录先后关系。
- 同一页面过复杂时，只能在该页面目录下拆子视图 HTML；不得把子状态或子任务提升为一级目录。
- 现有 interaction 底子若按流程域组织，变更时优先重组为页面目录。

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
