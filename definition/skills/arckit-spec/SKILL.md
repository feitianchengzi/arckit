---
name: arckit-spec
description: "维护 arckit/spec/ 下的产品功能规格、行为规则、验收口径和模块化规格索引。默认由 using-arckit 在判断本轮需要查询或维护稳定产品预期事实时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。输出变更涉及的 spec 路径和一句话摘要。"
---

# ArcKit Spec

管理 `arckit/spec/` 的功能规格，遵循「INDEX 驱动、动态拆解、Progressive Disclosure」原则。

## 过程 Handoff 接收规则

本 skill 是结果型 skill，`arckit/spec/` 仍是产品功能事实的 source of truth。可以接收 `arckit-draft-spec`、`arckit-domain-modeling` 或 `arckit-decision-framework` 的 handoff，也可以接收用户或外部 adapter 提供的明确材料，但接收不等于自动写入。

- 先把 handoff 当作候选输入，按下方 INDEX 全局分析和域归属判定决定并入、新建、拆分、归档或暂不采纳。
- 只把稳定行为、规则、验收口径和已确认边界写入主文档。
- 调研过程、候选方案、未验证推断、执行计划和角色分工不得写入 spec 主线。
- handoff 中的来源、风险和开放问题可转为 `source_basis`、待确认项或交给 `arckit-pending`。

## 核心结构

```
spec/
├── INDEX.md                 # 【入口】缩进树形索引（每级一句+文档行数）
├── GLOSSARY.md             # 术语表
├── CONVENTIONS.md          # 规范
├── [module]/               # 模块（有归属用分级嵌套、无归属用平级）
│   ├── feature.md          # 功能规格（300-500行）
│   └── [sub-module]/       # 子模块（深度不限）
└── _archive/
```

## INDEX.md 约定（动态拆解的依据）

```markdown
# 产品功能索引

🟢 已实现 | 🟡 开发中 | ⚪ 计划中 | 🔴 已废弃

- user-management/ 用户管理：账号认证、权限控制与组织关系。🟢
  - authentication.md 用户认证：登录登出、会话管理、Token刷新。🟢 (325行)
  - authorization.md 权限控制：角色分配、资源权限校验、策略引擎。🟢 (480行)
  - account/ 账户管理：个人资料、偏好设置、通知配置。🟡
    - profile.md 个人资料：查看编辑信息、头像上传、隐私设置。🟡 (210行)
```

**关键**：
- 直接写文件名/目录名（不用链接语法）
- 一句话总结列出2-3个核心场景/功能点
- 每个文档后标注行数（如 `(325行)`），便于 AI 快速判断是否需拆解
- 依赖关系在 _map/RELATIONS.md 维护，不写在 INDEX 行内

## 正文规范（强制）

`arckit/spec/` 下的主文档是**结果规格**，描述目标系统当前有效的功能行为事实。完整规范见 [`../_arckit_shared/content-spec.md`](../_arckit_shared/content-spec.md)，以下为执行摘要。

**语体**：陈述式、现在时，写「该功能支持 X」「在 A 状态下系统响应 B」。禁止改版叙事（「本次将 X 改为 Y」）、落地建议（「可先简化」「早期阶段暂时」）、过程叙事。

**禁止混入**：成本/排期/版本迭代计划；工程实施建议（简化方案、临时绕过）；任何代码（spec 文档不出现代码，伪代码也应极其克制）。

**历史内容处置**：① 已过时的描述直接删除；② 有保留价值（如弃用说明）的整段移入文档末尾 `## 历史对照` 或 `## 弃用说明` 附录块，不与主线穿插；③ 附录块内仍用陈述式。

---

## 工作流（必读：先意图识别，再分支）

### 意图识别（第一步，必做）

根据用户输入判断意图：**查询** 或 **变更**。

- **查询**：仅需知道「有哪些 / 在哪 / 对应哪个文件」等，不修改任何文件。典型表述：列出、查看、有哪些、找、定位、某功能在哪、INDEX 里有什么、某个模块下有哪些功能。
- **变更**：新建、更新、拆分、归档等会改动目录或文件的操作。

**若判定为查询**：
1. 只读 `arckit/spec/INDEX.md`（必要时按需读少量相关文档）。
2. 输出 `document_scope` 后**结束**，不执行任何写操作。输出格式见下方「最终输出：document_scope」之 `scope_kind: query`。

**若判定为变更**：继续执行「INDEX 全局分析」及后续步骤；执行结束后必须输出 `document_scope`，格式见 `scope_kind: change`。

---

### 最终输出：document_scope（每次调用结束前必须输出）

本 Skill 的**唯一 Output Contract** 是 `document_scope`：调用方据此知道本次在 `arckit/spec/` 下涉及了哪些文件，以及每项的一句话总结。

**查询结束时**（只读，无写操作）：
```yaml
document_scope:
  scope_kind: query
  root: arckit/spec/
  paths:
    - path: user-management/authentication.md
      summary: 用户认证功能规格，登录登出与会话管理
```

**变更结束时**（执行了新建/更新/拆分/归档等）：
```yaml
document_scope:
  scope_kind: change
  root: arckit/spec/
  created:
    - path: user-management/profile.md
      summary: 新增个人资料功能规格，编辑与隐私设置
  updated:
    - path: user-management/authentication.md
      summary: 补充多端登录与 Token 刷新规则
  deleted:
    - path: legacy/legacy-auth.md
      summary: 归档至 _archive，已由新认证模块替代
```

- 每项必须包含 `path`（相对于 `arckit/spec/`）和 `summary`（一句话描述：查询时为文档内容简述，变更时为本次修改/新增/删除内容简述）。
- 空列表用 `[]`，无则省略该键。

---

### 执行变更前：INDEX 全局分析 + 域归属判定

变更前按顺序执行以下步骤：

**第一步：读取并解析 INDEX.md**（必做）

**第二步：域归属判定**（必做，先于体积分析）

新内容落地前，判断 INDEX 中是否已有**职责覆盖同一功能域**的文件：

- 有同域文件 → **默认并入**（更新/重写该文件对应章节），不新建平行 feature.md
- 有同域文件但职责已明显分化 → 阐明拆分理由，再新建
- 无同域文件 → 新建，路径按 INDEX 枝命名
- 发现多个文件域重叠 → 先合并再处理变更，合并记入 `document_scope.reorganized`

**第三步：体积与层级分析**（按下方「综合分析指标与拆分策略」判断是否需拆分）→ 输出分析结果 YAML → 按结果执行。**详细步骤与输出示例**见 [references/index-analysis.md](references/index-analysis.md)。

---

### 操作入口（详细步骤见 reference）

1. **新建功能模块**：`bash scripts/new-module.sh <module-name> [spec-dir]`；创建目录，再更新 INDEX.md。
2. **新建功能规格**：`bash scripts/new-feature.sh <module-name> <feature-name> [spec-dir]`；创建 feature.md（路径即标识），再更新 INDEX 与 _map。
3. **更新功能**：先看分析结果，需拆分则先拆再改；否则直接改 feature.md，更新行数与 _map。
4. **动态拆解**：按分析结果执行拆分方式（按子功能/按模块分组/平级化）。
5. **归档功能**：移入 _archive/，更新 INDEX 与 _map。

以上 1～5 的详细执行步骤见 [references/operations.md](references/operations.md)。

## 综合分析指标与拆分策略

| 维度 | 指标 | 阈值 | 拆分方式 |
|------|------|------|---------|
| 单文件长度 | feature.md | >500行（强制）、>450行（警告） | 按子功能/场景拆为子模块 |
| 单文件长度 | INDEX.md | >150行（强制）、>120行（警告） | 按模块分二级 INDEX |
| 层级深度 | 嵌套层数 | >4层 | 平级化：将深层子模块提升 |
| 模块规模 | 单模块 feature 数 | >8个 | 按业务相关性分 2-3 个子模块 |

## 必须更新的文件

| 操作 | 更新 |
|------|------|
| 新建功能 | INDEX.md（含行数）、_map/feature-matrix.md、RELATIONS.md |
| 更新功能 | INDEX.md（更新行数）、feature-matrix.md（若状态变更） |
| 拆分功能 | INDEX.md（树形改造）、feature-matrix.md、RELATIONS.md |
| 归档 | INDEX.md、feature-matrix.md、RELATIONS.md |

## 状态标识

```
🟢 已实现 | 🟡 开发中 | ⚪ 计划中 | 🔴 已废弃
```

## 参考资源

- INDEX 全局分析（步骤与示例）：[references/index-analysis.md](references/index-analysis.md)
- 五类操作详细步骤：[references/operations.md](references/operations.md)
- 脚本：初始化 [scripts/init-spec.sh](scripts/init-spec.sh)、新建模块 [scripts/new-module.sh](scripts/new-module.sh)、新建功能 [scripts/new-feature.sh](scripts/new-feature.sh)；模板文件在 assets/
