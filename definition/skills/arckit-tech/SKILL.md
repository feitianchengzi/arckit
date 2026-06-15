---
name: arckit-tech
description: "维护 arckit/tech/ 下的技术方案、架构说明、数据模型和 API 契约。用于用户要求查询、新建、更新、拆分或归档可沉淀的技术设计、实现约束、模型或接口契约时；输出变更涉及的 tech 路径和一句话摘要。"
---

# ArcKit Tech

管理 `arckit/tech/` 的技术文档与数据契约，遵循「INDEX 驱动、动态拆解、Progressive Disclosure」原则。

## 过程 Handoff 接收规则

本 skill 是结果型 skill，`arckit/tech/` 仍是技术方案、模型和契约事实的 source of truth。可以接收 `arckit-architecture-decision`、`arckit-domain-modeling`、`arckit-decision-framework`、`arckit-verify-implementation` 或 `arckit-project-governance-workflow` 的 handoff，但接收不等于自动写入。

- 先把 handoff 当作候选输入，按下方 INDEX 全局分析和技术域归属判定决定并入、新建、拆分、归档或暂不采纳。
- 只把已确认的架构结论、约束、模型、接口和决策理由写入结果文档。
- 候选方案讨论、实现过程、排期、临时绕过和未验证推断不得写入 tech 主线。
- 仍需讨论的权衡交回 `arckit-architecture-decision`；影响目标、任务或路线图的内容交回 `arckit-project-governance-workflow`。

## 核心结构

```
tech/
├── INDEX.md                 # 【入口】缩进树形索引（每级一句+文档行数）
├── CONVENTIONS.md          # 规范
├── _shared/                # 公共资产（所有 models/contracts 统一在此）
│   ├── models/             # 数据模型 YAML（扁平）
│   └── contracts/          # API 契约 YAML（扁平）
├── [tech-domain]/          # 技术领域（有归属用分级嵌套）
│   ├── research.md         # 调研（300-600行）
│   ├── solution.md         # 方案（300-500行）
│   ├── decision.md         # 决策记录
│   └── [sub-domain]/       # 子领域（深度不限）
├── _spikes/                # POC
└── _archive/
```

## INDEX.md 约定（动态拆解的依据）

```markdown
# 技术索引

✅ 已采用 | 🔬 调研中 | 📋 调研完成 | ❌ 已废弃 | ⚪ 待定

- user-management/ 用户管理：认证方案、权限模型、会话策略。✅
  - auth-solution.md 认证方案：JWT实现、Refresh Token、多端登录。✅ (420行)
  - rbac-solution.md 权限模型：RBAC设计、资源树、动态策略。✅ (380行)
- _shared/models/ 数据模型：跨领域实体定义。
  - User.yaml 用户实体：基础属性、关系映射、索引策略。✅ (85行)
- _shared/contracts/ API契约：接口规范定义。
  - auth-login.yaml 登录接口：请求参数、响应结构、错误码。✅ (120行)
```

**关键**：
- 直接写文件名/目录名（不用链接语法）
- 一句话总结列出2-3个核心技术点/模块
- 每个文档后标注行数，models/contracts 也标注便于监控复杂度
- 依赖关系在 _map/RELATIONS.md 维护，不写在 INDEX 行内

## 正文规范（强制）

`arckit/tech/` 下的主文档是**技术结果规格**，描述已定稿的技术方案、数据契约与模型事实。完整规范见 [`../_arckit_shared/content-spec.md`](../_arckit_shared/content-spec.md)，以下为执行摘要。

**语体**：陈述式、现在时，写「方案采用 X 架构」「接口响应结构为 Y」。禁止改版叙事（「本次改为…」）、落地建议（「可先硬编码」「MVP 阶段暂时」）、过程叙事（在非 research 文档中）。

**禁止混入**：成本/排期/版本迭代计划；工程实施建议（简化方案、临时绕过）；Markdown 文件内的大段可运行业务代码（完整函数体、类实现、服务脚本）。

**各文档类型边界**：
- `solution.md`：架构、数据流、组件职责、短伪代码或引用契约均可；禁止完整实现代码
- `research.md`：方案选型分析本身是结果交付物——候选方案的简洁陈述（是什么/适用场景/权衡）、选定方案及理由均属于正式内容；未选用方案简洁说明即可；禁止时间性过程叙述（会议流水账、「反复讨论后」）、成本/排期、落地建议
- `decision.md`：决策结论及理由、ADR 格式的「不选 X 原因」；禁止成本/排期/简化建议
- `_shared/contracts/*.yaml` 和 `models/*.yaml`：**是结果规格本身**，不受「禁止代码」约束，按 Schema 规范完整维护

**历史内容处置**：① 已过时直接删除；② 有保留价值的移入文档末尾 `## 历史对照` 或 `## 弃用说明` 附录块；③ 附录块内仍用陈述式。

---

## 工作流（必读：先意图识别，再分支）

### 意图识别（第一步，必做）

根据用户输入判断意图：**查询** 或 **变更**。

- **查询**：仅需知道「有哪些 / 在哪 / 对应哪个文件」等，不修改任何文件。典型表述：列出、查看、有哪些、找、定位、某方案/模型/API 在哪、INDEX 里有什么、某个领域下有哪些方案。
- **变更**：新建、更新、拆分、归档等会改动目录或文件的操作。

**若判定为查询**：
1. 只读 `arckit/tech/INDEX.md`（必要时按需读少量相关文档）。
2. 输出 `document_scope` 后**结束**，不执行任何写操作。输出格式见下方「最终输出：document_scope」之 `scope_kind: query`。

**若判定为变更**：继续执行「INDEX 全局分析」及后续步骤；执行结束后必须输出 `document_scope`，格式见 `scope_kind: change`。

---

### 最终输出：document_scope（每次调用结束前必须输出）

本 Skill 的**唯一 Output Contract** 是 `document_scope`：调用方据此知道本次在 `arckit/tech/` 下涉及了哪些文件，以及每项的一句话总结。

**查询结束时**（只读，无写操作）：
```yaml
document_scope:
  scope_kind: query
  root: arckit/tech/
  paths:
    - path: user-management/auth-solution.md
      summary: 认证方案文档，JWT 与 Refresh Token 实现
```

**变更结束时**（执行了新建/更新/拆分/归档等）：
```yaml
document_scope:
  scope_kind: change
  root: arckit/tech/
  created:
    - path: user-management/rbac-solution.md
      summary: 新增 RBAC 权限方案与资源树设计
  updated:
    - path: user-management/auth-solution.md
      summary: 补充多端登录与会话策略
  deleted:
    - path: legacy/old-auth.md
      summary: 归档至 _archive，已由新方案替代
```

- 每项必须包含 `path`（相对于 `arckit/tech/`）和 `summary`（一句话描述：查询时为文档内容简述，变更时为本次修改/新增/删除内容简述）。
- 空列表用 `[]`，无则省略该键。

---

### 执行变更前：INDEX 全局分析 + 域归属判定

变更前按顺序执行以下步骤：

**第一步：读取并解析 INDEX.md**（必做）

**第二步：域归属判定**（必做，先于体积分析）

新内容落地前，判断 INDEX 中是否已有**职责覆盖同一技术域**的文件：

- 有同域文件 → **默认并入**（更新/重写该文件对应章节），不新建平行 solution/research
- 有同域文件但职责已明显分化 → 阐明拆分理由，再新建
- 无同域文件 → 新建，路径按 INDEX 枝命名
- 发现多个文件域重叠 → 先合并再处理变更，合并记入 `document_scope.reorganized`

**第三步：体积与层级分析**（按下方「综合分析指标与拆分策略」判断是否需拆分）→ 输出分析结果 YAML → 按结果执行。**详细步骤与输出示例**见 [references/index-analysis.md](references/index-analysis.md)。

---

### 操作入口（详细步骤见 reference）

1. **新建技术领域**：`bash scripts/new-domain.sh <domain-name> [tech-dir]`；创建目录，再更新 INDEX.md。
2. **技术调研**：research.md >700行 需先拆则先拆；用 assets/research-template.md 创建 research.md、更新 INDEX 与 decision-log。
3. **方案设计**：`bash scripts/new-solution.sh <domain-name> <solution-name> [tech-dir]`；solution.md >450行 需先拆则先拆；创建 solution.md（路径即标识），再更新 INDEX 与 _map。
4. **决策记录**：在 decision.md 添加决策、更新 decision-log、同步 solution 与 INDEX 状态。
5. **定义数据模型**：`bash scripts/new-model.sh <entity-name> [tech-dir]`；统一在 _shared/models/，创建 YAML（路径即标识），再更新 INDEX 与 _map。
6. **定义 API 契约**：`bash scripts/new-contract.sh <endpoint-name> [tech-dir]`；统一在 _shared/contracts/，创建 YAML（路径即标识），再更新 INDEX 与 _map。
7. **通用模型管理**：_shared/ 下被多领域引用的模型，用 $ref 引用。
8. **动态拆解**：按分析结果执行拆分方式（按模块拆方案/拆调研/拆决策/按子领域/平级化）。
9. **归档方案**：移入 _archive/，更新 INDEX 与 _map。

以上 1～9 的详细执行步骤见 [references/operations.md](references/operations.md)。

## 综合分析指标与拆分策略

| 维度 | 指标 | 阈值 | 拆分方式 |
|------|------|------|---------|
| 单文件长度 | solution.md | >500行（强制） | 按模块拆为多个 solution 或子领域 |
| 单文件长度 | research.md | >800行（强制） | 按候选方案拆为多个 research |
| 单文件长度 | decision.md | >500行（强制） | 按决策主题拆为子领域 decision |
| 单文件长度 | INDEX.md | >150行（强制） | 按领域分二级 INDEX |
| 单文件长度 | model/contract YAML | >200行 | 拆分为多个模型/契约 |
| 层级深度 | 嵌套层数 | >3层 | 平级化：将深层子领域提升 |
| 领域规模 | 单领域方案数 | >6个 | 按子领域分组 |
| _shared 规模 | models/ 文件数 | >15个 | 提示按领域整理（保持扁平） |

## 必须更新的文件

| 操作 | 更新 |
|------|------|
| 新建领域 | INDEX.md |
| 新建调研 | INDEX.md（含行数）、_map/decision-log.md |
| 新建方案 | INDEX.md（含行数）、_map/RELATIONS.md、feature-matrix.md |
| 新建模型 | INDEX.md（_shared/models 部分+行数）、_map/RELATIONS.md、feature-matrix.md |
| 新建 API | INDEX.md（_shared/contracts 部分+行数）、_map/RELATIONS.md、feature-matrix.md |
| 拆分领域 | INDEX.md（树形改造） |
| 归档 | INDEX.md、_map/* |

## 状态标识

```
技术方案: ✅ 已采用 | 🔬 调研中 | 📋 调研完成 | ❌ 已废弃 | ⚪ 待定
数据模型/API: ✅ 已定义 | 🟡 设计中 | ⚪ 待定义
```

## 参考资源

- INDEX 全局分析（步骤与示例）：[references/index-analysis.md](references/index-analysis.md)
- 九类操作详细步骤：[references/operations.md](references/operations.md)
- YAML Schema 参考：[references/schemas.md](references/schemas.md)
- 脚本：初始化 [scripts/init-tech.sh](scripts/init-tech.sh)、新建领域 [scripts/new-domain.sh](scripts/new-domain.sh)、新建方案 [scripts/new-solution.sh](scripts/new-solution.sh)、新建模型 [scripts/new-model.sh](scripts/new-model.sh)、新建契约 [scripts/new-contract.sh](scripts/new-contract.sh)；模板文件在 assets/
