# 以 C 为目标的 TDD 落地方案

> 迭代：【3】20261117 · 上游文档：`直接反馈体验优化方案.md`、`设计稿/feedback-direct.html`
> 范式：测试先行（RED → GREEN → REFACTOR），每轮循环以「先写失败测试」开始，实现仅以让测试变绿为边界，测试稳定后才允许重构。

---

## 1. 目标与范围

**C 的完整定义**（B 是其地基，不是可选项）：

| 层 | 内容 | 归属 |
|---|---|---|
| 地基 | 有结构化结果时「仍未解决」优先进预填核对，不丢对话上下文 | B（P0） |
| 地基 | 手填表单：用户语言 label、placeholder 示例、核心事实必填、辅助字段可「不确定」降级 | B（P0） |
| 主体 | 单框自然语言输入 →「整理为结构化信息」→ 需求/问题字段组预填核对 → 建卡 | C（P2） |
| 主体 | 「直接原样提交」逃生通道；整理失败回落手填 | C（P2） |
| 横切 | 列表类型徽标 + 类型筛选（服务端过滤） | P1 |

**不在本方案范围**：`feedback-console` 管理端类型分流（独立迭代）、视觉走查的主观评判（设计稿评审承担）、模型分类质量评估（离线人工评估，非单元测试可覆盖）。

**总原则**：C 落地 = B 全部 + 单框 + 类型横切；顺序上 B 先红绿、C 后红绿，P1 与 C 可并行但依赖 Cycle 1 的契约测试。

### 1.1 样式与设计规范红线（所有循环通用，违反即红）

新增功能必须**严格复用** `feedback-sdk-web` 既有样式体系，设计稿（`设计稿/feedback-direct.html`）只作为**行为与信息架构**的评审依据，其 CSS **不是**实现来源。具体约束：

| # | 约束 | 落点 |
|---|---|---|
| S1 | 容器/区块用 `.sdk-collection`；按钮用 `.sdk-button` / `.sdk-button.primary`；输入用 `.sdk-input` | `globals.css:191-204` |
| S2 | 只用 Tailwind 语义 token（`text-xs`、`text-foreground-secondary`、`text-error`、`text-success`、`bg-primary-light`、`rounded` 等，`tailwind.config.ts` 映射 CSS 变量）；**禁止**硬编码新色值、新圆角、新字号，**禁止**在组件内写新 class 规则 | 全部新组件 |
| S3 | 状态文案遵循既有无障碍模式：加载/提示 `role="status"`，错误 `role="alert"` + `text-error`（`AgentChatPanel.tsx:277`、`ClarificationReview.tsx:24-26` 模式） | C2/C4/C5 |
| S4 | 表单区块结构对齐 `ManualFeedbackForm` 现状：`<section aria-label>` + `<h3>` + `text-xs` label + 复选确认 + 底部双按钮（次 `sdk-button` / 主 `sdk-button primary`） | C2/C4 |
| S5 | 文案措辞风格对齐相邻组件（短句、中文全角标点、「提交后由处理团队分析」类口径）；新增用户可见文案与 `manualFields`/设计稿对照表单一来源，不另造说法 | C2/C4/C6 |
| S6 | 可见性开关/能力位渲染不引入新视觉分支，仅控制挂载 | D5/C4 |
| S7 | `npm run build:check`（tsc）与既有组件测试是样式的机械护栏；S1–S5 由下表约定的**约定测试**与 C8 人工走查双重把关 | 全程 |

**约定测试（style-convention tests）**：在 C2/C4/C6 的 RED 中各加一条「样式约定」用例——断言新渲染节点的 class 词表属于既有集合（如按钮必须含 `sdk-button`、区块必须含 `sdk-collection`、无内联 `style` 属性、无裸 `#hex` 色值出现在 class 之外）。这不是像素测试，只锁「没绕过设计系统」。

---

## 2. 现状资产盘点

### 2.1 可直接复用的链路（不新建后端会话协议）

```
单框「整理」──复用──▶ AgentChatPanel.send()
                        └─ sendStandaloneAgentMessage / sendAgentMessage
                             └─ response.need_collect | clarification
                                  └─ onNeedCollect({ question, structured })
                                       └─ SDKSupportPage.setStructured
                                            └─ ClarificationReview 预填核对
                                                 └─ 确认 → submitFeedbackV2({ structured, conversationId, clientRequestId })
```

关键复用点：

- **发送与会话状态**已集中在 `AgentChatPanel.tsx:112` 的 `send`（会话 id、草稿、need_collect 上报、消息流合并）。
- **核对与建卡**已完整：`ClarificationReview.tsx`（必填/unknown 校验）+ `SDKSupportPage.tsx:173` 确认流 + `v2.ts:201 submitFeedbackV2`（幂等 clientRequestId、clarification confirmed 标记）。
- **字段组切换**已存在：`structured.ts` 的 `isFeatureClarification / visibleClarificationFields / coreClarificationFields / missingClarificationFields`，`ClarificationReview.test.tsx` 已覆盖 feature 字段组。
- **后端契约已就绪**：`feedback_clarification.go` 强制 `validClarificationRequestType`（bug/feature/question/other）+ confirmed + 必填字段；`agent_clarification_test.go`、`agent_autonomous_classification_test.go`（不问客户类型）已护栏。

### 2.2 现有测试资产（全部作为回归基线）

| 层 | 位置 | 规模 |
|---|---|---|
| SDK 组件/页面/域单测 | `apps/feedback-sdk-web/src/**/*.test.{ts,tsx}` | 23 个文件（`npm test` = `vitest run`） |
| 其中与本方案直接相关 | `SDKSupportPage.test.tsx`（手填/确认流）、`ClarificationReview.test.tsx`（字段组/unknown）、`AgentChatPanel.test.tsx`（need_collect/standalone）、`structured.test.ts`、`v2.agent.test.ts`（提交契约） | — |
| 手填表单 | **无专项测试**（`ManualFeedbackForm.tsx` 零覆盖） | 本方案 Cycle 2 补 |
| 后端 handler | `agent_clarification_test.go`、`agent_autonomous_classification_test.go`、`feedback_creation_idempotency_test.go`、`agent_conversation_test.go` 等 | `go test ./handler/...` |
| 本地设计稿冒烟 | `【3】20261117/设计稿` jsdom 43 项（方案评审资产，非产品代码） | 不进产品 CI |

### 2.3 数据通路事实（决定 P1 怎么测）

- 提交：`submitFeedbackV2` 把 `structured` 写进 `data.structured`（`v2.ts:218`）。
- 列表：`GET /feedbacks` 返回的 `FeedbackRecord.data` 已含该 JSON，但 `feedbackToItem`（`api.ts:367`）**不解析** → `FeedbackItem` 无类型字段（`types.ts:12`）。
- 筛选：仓库已有明确立场——`v2.agent.test.ts`「sends search and date/status to the server rather than filtering one client page」。**类型筛选必须走服务端参数，禁止客户端分页内过滤。**
- 手填现状：`ManualFeedbackForm.tsx:36` 硬编码 `request_type:'other'` + 全量 `unknown_fields`，三框全必填，无测试。

---

## 3. 架构决策（推荐值，实施按此执行）

| # | 决策 | 推荐 | 理由 |
|---|---|---|---|
| D1 | 单框「整理」的发送方 | **复用 `AgentChatPanel.send`**（提升为 ref/context 暴露给单框组件），不绕道独立调 `sendStandaloneAgentMessage` | 会话 id 状态、消息流、草稿迁移、need_collect 上报都在 `send` 里；绕道会产生双会话与消息不进流的割裂 |
| D2 | 手填降级的 `request_type` | 保留 `'other'`，UI 文案标「一般反馈 · 待团队分析」 | 后端 `validClarificationRequestType` 只收四值；类型后置归团队是既定产品原则，不为手填新开类型 |
| D3 | 原样提交的载荷 | `content` = 单框原文，**不带** `structured`（列表徽标显示「待分析」） | 「原样 = 不经模型断言」；带伪造 structured 违背「类型是分析结论」。前提：后端允许无 structured 建卡 → Cycle 7 用 Go 测试先验证该契约 |
| D4 | 类型筛选 | 后端 `GET /feedbacks` 新增 `request_type` 查询参数，SDK 透传 | 与既有「服务端过滤」立场一致；客户端过滤在分页下结果错误 |
| D5 | C 的启用方式 | 单框与三框并存，由 `sdkConfig` 能力位（如 `directBox: true`）选择形态 | 测试可覆盖开关两分支；可灰度回退 B |
| D6 | 模型输出 | 一切整理链路测试 **mock `sendStandaloneAgentMessage` 响应结构**（`need_collect/clarification`） | 模型输出不确定，单测只测协议与状态机；分类质量靠既有 prompt 护栏测试 + 离线评估 |

---

## 4. 测试策略

### 4.1 分层

```
L1 纯函数单测（最快红绿）：structured.ts / api.ts 映射 / 单框校验与载荷构造
L2 组件测试：ManualFeedbackForm、DirectFeedbackBox、ClarificationReview（已有，扩展）
L3 页面集成：SDKSupportPage（路由形态切换、确认建卡、列表徽标与筛选）
L4 后端契约：handler httptest + Postgres fixture（载荷校验、筛选、幂等）
L5 手动验收：对照设计稿三档评审路径（不自动化）
```

### 4.2 红绿纪律

1. **每个测试独立红**：写完测试先跑，确认失败原因指向「未实现的行为」，而不是拼写/mock 错误。
2. **GREEN 只做最小实现**：不顺手重构、不提前抽象；出现「测试需要但设计没有」的接口，先补测试意图再补实现。
3. **REFACTOR 仅在测试全绿后**：改名/提函数/合并重复，改完全绿才算本轮完成。
4. **失败处理**：红的原因不对 → 修测试；实现无法变绿 → 说明架构决策（D1–D6）有误，**回到 §3 修订决策，不硬写实现绕过测试**。
5. **现有 23 个测试文件是护栏**：任何循环不得以「先删测试换绿」结束；label/行为变更允许**同步修改**既有断言，但必须在提交说明中列出生效差异。

### 4.3 Mock 原则

- 页面层沿用现有模式：`vi.mock('@/lib/feedback/v2')`、`vi.mock('@/components/sdk/AgentChatPanel')`（`SDKSupportPage.test.tsx:7-10` 已示范）。
- 新增整理链路：在 v2 mock 中补 `sendStandaloneAgentMessage: vi.fn()`；响应按 `AgentMessageResponse` 协议构造（`need_collect` / `clarification.summary` / `conversation_id`）。
- Go 层沿用 `openFeedbackWorkflowPostgres` + `httptest` fixture（`feedback_creation_idempotency_test.go` 模式）。
- **不 mock**：`structured.ts` 等纯函数（真跑）、sessionStorage（jsdom 真跑）。

### 4.4 明确不测

- 像素级视觉与审美评判（L5 走查承担；**样式约定本身有测试**，见 §1.1 约定测试）。
- 文案逐字措辞（S5 靠对照表与走查；但文案所在的语义结构如 `role`/`aria-label` 有测试）。
- 真实模型分类正确率（离线评估，非 TDD 对象）。
- OSS 上传等已覆盖域。

---

## 5. TDD 循环序列

依赖关系：

```
C0 基线 ──▶ C1 契约 ──▶ C2 手填P0 ──▶ C3 路由P0 ──▶ C5 整理接线 ──▶ C8 回归
                │                        ▲    │
                ├──▶ C4 单框组件 ─────────┘    │
                │                              │
                └──▶ C6 列表徽标/筛选（含 L4 服务端）─┤
                             C7 后端载荷契约（D3 前提）─┘
```

C4/C6 可与 C2/C3 并行（不同文件）；**C5 依赖 C3（路由）+ C4（单框）**；**C6/C7 依赖 C1**。

---

### Cycle 0 — 基线护栏（半天内）

**RED**：无（基线轮）。
**执行**：

```bash
cd apps/feedback-sdk-web && npm test        # 23 文件全绿
cd apps/feedback-sdk-web && npm run build:check
cd services/workshop-api && go test ./handler/...
```

**完成定义**：三命令结果记录在案（通过数/耗时）；后续每轮循环结束至少跑受影响包，C8 跑全量。基线本身有红 → 先修基线，不进 C1。

---

### Cycle 1 — 契约层：类型字段与单框纯函数（L1）

**目标**：让「类型」成为一等数据，并把单框的输入/载荷规则固化为纯函数——后面所有组件测试都建立在这层之上。

**RED**（新增 `api.type.test.ts`、`structured.directbox.test.ts`；扩展 `structured.test.ts`）：

| 测试 | 断言要点 |
|---|---|
| `feedbackToItem 解析 data.structured.request_type` | `data` 含 `structured.request_type:'feature'` → `FeedbackItem.requestType === 'feature'`；`data` 缺失/坏 JSON → `requestType === undefined`（不抛错） |
| `directBox 校验：空/纯空格拒绝` | `validateDirectBox('')`、`('   ')` 返回错误文案（对齐 `validateMedia` 的 string 惯例）；正常文本返回 `''`；>8000 拒绝 |
| `directBox 原样提交载荷` | `buildRawSubmit(text)` → `content === text.trim()`、`structured === undefined`（D3） |
| `手填载荷类型契约` | `buildManualSubmit(draft)` → `request_type === 'other'`、`unknown_fields` 覆盖三个辅助字段、`clarification.confirmed === true`（D2，锁死现状后端可收） |
| `类型标签映射` | `typeLabel('feature')→'需求'`、`'bug'→'Bug'`、`'question'→'问题'`、`undefined→'待分析'`、`'other'→'一般反馈'` |

**GREEN**：`api.ts feedbackToItem` 解析 `data`；`structured.ts`（或新 `directbox.ts`）落 4 个纯函数；`FeedbackItem`/`types.ts:12` 增 `requestType?: string`。

**REFACTOR**：类型标签映射单点化（设计稿与列表共用），无行为变化。

**完成定义**：新测试全绿 + 既有 23 文件无回归（`feedbackToItem` 改动会触碰 `SDKSupportPage.test` 的列表 mock，允许同步补 `data` 字段）。

---

### Cycle 2 — 手填表单 P0（L2）

**目标**：`ManualFeedbackForm` 从「三术语框全必填」变为设计稿 B 档形态。**先改测试，再改组件。**

**RED**（新建 `ManualFeedbackForm.test.tsx`；同步修改 `SDKSupportPage.test.tsx` 中 `getByLabelText('问题位置')` 等既有断言）：

| 测试 | 断言要点 |
|---|---|
| 用户语言 label | label 为「你看到了什么（例如：点导出后提示没有权限）」类文案；不再是裸「实际现象」（对照 `manualFields` 设计稿 hint） |
| placeholder 示例 | 每框有具体示例 placeholder（A 档现状无 → 红） |
| 核心事实必填 | 三框（位置/现象/期望）**全必填真实内容**——与后端 core 规则一致（`agent_clarification.go:215`：position/phenomenon/expect 为 core，不可标 unknown、不可占位）；任一空 → 提交禁用 |
| 不降级 core | 手填表单**不渲染** core 框的「不确定」勾选（负向断言）——「暂时无法提供」能力只属于核对表单的非 core 字段（`ClarificationReview` 已实现，非本迭代新增）；手填写入 `unknown_fields` 的仍仅为三个辅助字段（reproduction_steps/environment/impact） |
| 类型不可选 | 表单内**无**任何 `request_type` 选择控件（负向断言，锁 D2/prompt 原则） |
| 草稿与重试 | 提交失败已填值保留、`clientRequestId` 不变（现有 `SDKSupportPage.test` 手填重试用例语义迁移至此组件级） |
| 确认勾选 | 无确认勾选提交禁用（保持现有语义） |
| **样式约定（S1–S5）** | 区块含 `sdk-collection` 与 `aria-label="直接反馈"`；按钮含 `sdk-button`（主操作含 `primary`）；输入为 `sdk-input`；错误为 `role="alert"`+`text-error`；无内联 `style`、无新色值 |

**GREEN**：改 `ManualFeedbackForm.tsx`——label/placeholder/必填规则接 Cycle 1 纯函数；`unknown_fields` 由勾选状态构造（替代硬编码三连）；文案说明「提交后由团队分析，不会自动判定为故障或需求」。**样式只允许 S1–S5 词表内组合，不新增 CSS 文件改动。**

**REFACTOR**：三框渲染循环与降级逻辑提纯；与设计稿 `manualFields` 文案对照表保持单一来源。

**完成定义**：组件测试 + 修改后的 `SDKSupportPage.test` 全绿。**本轮回调既有断言必须逐条列出生效差异**（label 变更是用户可见行为变更）。

---

### Cycle 3 — 路由 P0：核对优先（L3）

**目标**：修复「有结构化结果时点『仍未解决』仍进空白手填、丢弃 structured」的断点（方案 §2 断点 3）。

**RED**（扩展 `SDKSupportPage.test.tsx`；AgentChatPanel 保持现有 mock 模式）：

| 测试 | 断言要点 |
|---|---|
| 核对优先 | mock `onNeedCollect` 已产生 `structured(bug)` → 点「仍未解决，提交反馈」→ **不出现**手填（`问题位置` 等不在文档），**出现** `ClarificationReview`（`核对结构化反馈`）且字段预填 |
| 无结构化进手填 | 未分析直接点「仍未解决 / 直接反馈」→ 手填出现，核对不出现 |
| 回落入口仍在 | 核对态提供「改为直接填写」→ 手填出现且不丢已有 structured（回到核对可再进） |
| 确认流不破坏 | 既有 `requires fact confirmation...` 用例保持绿（核对 → 确认 → 建卡一次） |

**GREEN**：`SDKSupportPage.openManual` 与 `AgentChatPanel` 底部按钮（`AgentChatPanel.tsx:289`）按 `hasUnsubmittedSummary/structured` 分流——有 structured 时按钮行为 = 聚焦/展示核对而非 `setManualOpen(true)`；`!manualOpen && structured` 互斥逻辑改为状态机显式表达（`'chat' | 'review' | 'manual' | 'raw'` 单一 `formMode`，消灭布尔组合漂移）。

**REFACTOR**：把 `manualOpen`/`structured`/`created` 的布尔纠缠收敛为 `formMode` 状态机（这是本方案唯一允许的结构性重构，必须在 C3 绿后进行，重构后全量组件测试仍绿）。

**完成定义**：4 条新测试 + 全量 vitest 绿。

---

### Cycle 4 — 单框组件（L2）

**目标**：纯呈现与本地状态的单框（不含整理网络调用，那是 C5）。

**RED**（新建 `DirectFeedbackBox.test.tsx`）：

| 测试 | 断言要点 |
|---|---|
| 渲染 | 单个 textarea（`aria-label` 含「反馈描述」）、「整理为结构化信息」「直接原样提交」两按钮、图片上传入口、降级说明文案（模型不可用 → 回落手填） |
| 空提交拦截 | 空/空格：整理与原样提交均禁用 |
| 草稿持久 | 输入写入 `sessionStorage`（scope key），重挂载恢复 |
| 原样提交 | 点击 → 调 `submitFeedbackV2` 一次，参数 `content===trim 文本`、`structured===undefined`（D3）、带 `clientRequestId`（幂等）；成功 `onCreated` |
| 整理触发 | 点「整理」→ `onRequestAnalyze(text)` 回调宿主（本组件不直连网络，D1 预留口）；分析中按钮禁用（`analyzing` prop） |
| 图片 | 沿用 `ManualFeedbackForm` 上传语义（成功/失败/移除），复用测试模式 |
| 能力位 | `sdkConfig.directBox=false` 时不渲染本组件（D5 分支） |
| **样式约定（S1–S6）** | 单框区块 `sdk-collection`；「整理」为主操作 `sdk-button primary`、原样提交为次级 `sdk-button`（与核对表单主次一致）；textarea 为 `sdk-input`；分析中 `role="status"`；无内联 `style`、无新色值；组件不新增任何 `globals.css` 规则 |

**GREEN**：新组件 `DirectFeedbackBox.tsx`（纯受控：props 含 `analyzing/onRequestAnalyze/onRawSubmit/onFallback`），`SDKSupportPage` 按 D5 能力位装配。**纯样式复用（S1–S6）：本组件不修改 `globals.css`/`tailwind.config.ts`；如断言揭示必须新增主题色，回 §1.1 评审后才能落。**

**REFACTOR**：与 `ManualFeedbackForm` 提取共享子件（图片区、确认勾选、错误行），无行为变化。

**完成定义**：新测试绿；`SDKSupportPage.test` 两分支（能力位开/关）各一条冒烟绿。

---

### Cycle 5 — 整理链路接线（L3，本方案核心）

**目标**：单框 → Agent 分析 → 需求/问题字段组核对 → 建卡，全链路集成测试。

**RED**（扩展 `SDKSupportPage.test.tsx` + `AgentChatPanel.test.tsx`）：

| 测试 | 断言要点 |
|---|---|
| AgentChatPanel 暴露发送能力 | ref/context 可拿到 `send`；调用后走 `sendStandaloneAgentMessage`、need_collect 正常经 `onNeedCollect` 上报（mock fetch 断言 path/body） |
| 整理成功 → 需求字段组 | mock 整理响应 `clarification.summary.request_type='feature'` → 点「整理」→ 分析中态 → `ClarificationReview` 出现**需求字段组**（谁会用到/为什么需要…）+「类型由分析判定」提示 |
| 整理成功 → 问题字段组 | 响应 `request_type='bug'` → 问题字段组（复位/环境/影响…） |
| 建卡载荷 | 核对确认 → 提交 → `submitFeedbackV2` 收到 `structured.request_type='feature'`、`conversationId===整理会话 id`、`clientRequestId` 稳定 |
| 整理失败回落 | mock `sendStandaloneAgentMessage` reject → 出现回落手填（Cycle 2 形态）+ 错误文案，单框草稿不丢 |
| 多轮整理 | 二次整理覆盖旧 structured（`mergeStructuredSummary` 语义已有测试，此处验证接线不丢证据） |
| 会话一致 | 整理会话 id 与 AgentChatPanel 已有会话一致，不新建平行会话（D1 回归） |

**GREEN**：`SDKSupportPage` 接 `onRequestAnalyze` → 调用 C5 暴露的 `send`；`formMode` 状态机补 `'analyzing'`；回落分支复用 C2 手填。

**REFACTOR**：分析态/错误态并入 `formMode` 状态机；删除临时布尔。

**完成定义**：7 条集成测试绿 + 全量 vitest 绿。**此轮是 C 的验收核心，测试全绿即 C 主链路成立。**

---

### Cycle 6 — 列表类型徽标与服务端筛选（L3 + L4，P1）

**RED**：

前端（扩展 `SDKSupportPage.test.tsx`、`api.type.test.ts` 已在 C1）：

| 测试 | 断言要点 |
|---|---|
| 徽标渲染 | `items` 含 `requestType:'feature'` → 列表出现「需求」徽标；`undefined` → 「待分析」 |
| 筛选控件 | 类型下拉（全部/需求/Bug/问题/一般反馈/待分析）可选 |
| 筛选走服务端 | 选「需求」→ `fetchFeedbackItemsV2` 收到 `request_type:'feature'` 参数（**断言传参，不断言客户端过滤**，对齐 `v2.agent.test` 立场） |
| 重置分页 | 筛选变化 `page` 回 1 |
| **样式约定（徽标/下拉）** | 徽标为语义 token 组合（如 `text-xs rounded` + `bg-primary-light`/既有色板），复用设计稿已评审的徽标语义色（需求紫/问题橙/一般灰）但值取自 tailwind 主题色，不硬编码；下拉为既有筛选控件同款（对齐 `反馈状态` 下拉的 class）；无内联 `style` |

后端（新建 `feedback_query_type_test.go`）：

| 测试 | 断言要点 |
|---|---|
| `ListFeedback 过滤 request_type` | seed 两张卡（`data.structured.request_type` 分别 bug/feature）→ `?request_type=feature` 只回 feature；缺省参数回全部；非法值 400 或忽略（择一写死） |
| 与既有 q/status 组合 | 组合过滤结果正确（对齐现有 query 测试模式） |

**GREEN**：后端 `feedback_query.go` 增 `request_type` 过滤（`data` JSON LIKE/JSONB 提取，与 `agent_session` 过滤同模式）；`v2.ts fetchFeedbackItemsV2` 透传参数；`feedbackToItem` 徽标数据已在 C1；`SDKSupportPage` 渲染徽标与下拉。

**REFACTOR**：徽标/下拉 i18n 文案进词条表。

**完成定义**：前端 + `go test ./handler/` 绿。

---

### Cycle 7 — 后端载荷契约补洞（L4，D3 前提）

**RED**（扩展 `feedback_creation_idempotency_test.go` 或新建 `feedback_raw_creation_test.go`）：

| 测试 | 断言要点 |
|---|---|
| 无 structured 可建卡 | `POST /feedbacks` 不带 `data.structured` → 201，卡片可查（**D3 原样提交的前提，先于前端原样提交上线**） |
| 无 structured 与幂等共存 | 同 `client_request_id` 重试仍幂等（现有 manual 幂等用例去掉 structured 后仍过） |
| structured 路径不回退 | 现有 `TestStructuredSubmissionRequiresConfirmationAndCore` 保持全绿（C 不得放宽确认/类型校验） |
| 单框长文本 | `content` 超长（>8000 或现上限）→ 明确 400 文案，前端 Cycle 4 的超长拦截与之对齐 |

**GREEN**：若 create 路径实际已允许无 structured → 本循环仅落测试（characterization，防回归）；若强制要求 → 放开为「可选」，但 `structured` 存在时校验不减。

**完成定义**：Go 测试绿；**此循环必须先于 C5 的原样提交测试合并**（否则 D3 是空中楼阁）。

---

### Cycle 8 — 回归与验收门禁

```bash
cd apps/feedback-sdk-web && npm test          # 全量 vitest
cd apps/feedback-sdk-web && npm run build:check
cd services/workshop-api && go test ./handler/...
node smoke-feedback-direct.js                 # 设计稿 43 项（方案资产，防评审稿漂移）
```

**L5 手动验收**（对照设计稿一键演示三路径，逐项打勾）：

1. A 档断点行为在产品中已消失：有分析结果点「仍未解决」→ 进核对，不进空白手填。
2. B 档手填：用户语言 + 示例 + 不确定降级 + 单必填框。
3. C 档：单框含「希望/建议」→ 整理 → 需求字段组 → 建卡 → 列表「需求」徽标 → 筛选只出需求。
4. 原样提交：列表显示「待分析」；整理失败回落手填，草稿不丢。
5. 对话路径提需求全程不受影响（`agent_autonomous_classification` 行为）。
6. **样式走查（S1–S7）**：新入口与表单和相邻面板（核对表单/咨询历史）并排目视无违和——按钮/输入/区块同款、无突兀色与字号、暗色模式（`.dark`）不破；`grep` 新增源码无内联 `style=`、无 `#hex` 字面量（约定测试已锁，走查兜底审美层）。

**完成定义**：四命令全绿 + L5 清单全勾 + 每条 C1–C7 的 RED 测试仍在文件中（无一被删除）。

---

## 6. 每轮循环的记录格式（提交粒度）

每个 Cycle 结束产出一条提交，说明中固定四行：

```
RED:    <新增/修改的测试文件与用例名>
GREEN:  <实现改动文件>
REFACTOR: <重构动作或 none>
差异:   <对既有断言的生效差异，无则写 none>
```

禁止把两个 Cycle 的红绿混进同一提交。

---

## 7. 风险与应对

| 风险 | 应对 |
|---|---|
| D1（复用 `AgentChatPanel.send`）暴露成本高于预期 | 先在 C5 RED 中用最小 ref 断言探底；若污染组件过大，回 §3 改为「宿主持有 conversationId + 独立发送 + 消息回灌」，**修订决策后再实现，不写两套** |
| 后端无 structured 建卡实际被拒 | C7 先行（其测试独立于前端），D3 失败则原样提交改为「带 `request_type:'other'` + 标记 `raw:true`」，同步修订设计稿与本表 |
| 改 label 破坏 `SDKSupportPage.test` 既有断言 | C2 允许同步修改，逐条列差异；禁止静默删用例 |
| `formMode` 状态机重构触碰面大 | 严格限定在 C3 绿后单轮完成，重构提交不含任何新行为 |
| 列表 `data` JSON 提取性能 | 与现有 `agent_session` LIKE 同模式；数据量超阈值再上 JSONB 索引（超出本迭代） |
| 能力位分支漏测 | D5 要求开/关两分支各有冒烟（C4 完成定义） |

---

## 8. 追溯矩阵（测试 ↔ 设计稿评审点）

| 设计稿评审点 | 覆盖测试 |
|---|---|
| A 档断点（需求丢类型） | C3「核对优先」+ C2「类型不可选」+ C7「无 structured 可建卡」 |
| B 档预填核对 / 手填降级 | C2 全表 + C3 回落入口 + C5 整理失败回落 |
| C 档单框 → 整理 → 字段组 | C4 全表 + C5 前 4 条 |
| C 档「类型由分析判定」 | C5 需求/问题字段组 + 既有 `agent_autonomous_classification_test.go` |
| C 档原样提交 | C4「原样提交」+ C7「无 structured 可建卡」 |
| 列表徽标 / 类型筛选 | C1 类型映射 + C6 全表 |
| 样式不偏离既有设计系统 | C2/C4/C6「样式约定」测试 + C8 L5 第 6 项走查（§1.1 S1–S7） |
| 一键演示三路径（原型） | L5 手动清单 1–4 |

---

## 9. 工作量与里程碑（粗估，按测试先行节奏）

| Cycle | 粗估 | 里程碑 |
|---|---|---|
| C0 基线 | 0.5 d | M0 |
| C1 契约 | 0.5–1 d | M1：类型成为一等数据 |
| C2 手填 P0 | 1 d | M2：B 档手填达标 |
| C3 路由 P0 | 0.5–1 d | M3：断点修复，B 档完整 |
| C4 单框 | 1 d | — |
| C5 整理接线 | 1–1.5 d | **M4：C 主链路成立（核心里程碑）** |
| C6 徽标/筛选 | 1 d（前后端各半） | M5：P1 完成 |
| C7 后端契约 | 0.5 d | 与 C5 前合并 |
| C8 回归 | 0.5 d | M6：可发布 |

关键路径：**C1 → C2 → C3 → C5**；C4、C6、C7 为旁路并行。全程约 6–8 个工作日（单人）。

---

## 10. 实施记录（2026-11-17）

### 10.1 红绿执行摘要

| Cycle | RED | GREEN 落点 | 结果 |
|---|---|---|---|
| C0 基线 | — | vitest 140 / go test / build:check | 全绿起步 |
| C1 契约 | `api.type.test.ts` 5 例 + `domain/feedback.test.ts` 5 例 | `feedbackToItem` 解析 `data.structured.request_type`；`validateDirectBox/buildRawSubmit/buildManualSubmit/typeLabel` | 6 红 → 绿 |
| C2 手填 P0 | 新建 `ManualFeedbackForm.test.tsx` 6 例；同步改 `SDKSupportPage.test` 旧 label 断言（生效差异：`问题位置/实际现象/期望结果` → 用户语言三问） | `ManualFeedbackForm` 用户语言 label + placeholder + `buildManualSubmit` | 7 红 → 绿 |
| C3 路由 | `ClarificationReview` 切换入口 + 页面路由 3 例 | `onSwitchToManual`；`openDirectFeedback` 分流；REFACTOR：`manualOpen/structured/created` 布尔组合收敛为 `formMode` 推导状态机 | 3 红 → 绿（重构期曾因 TDZ/窄化短暂红，修复后全绿） |
| C4 单框 | `DirectFeedbackBox.test.tsx` 8 例 + 能力位 2 例 | 新组件 `DirectFeedbackBox`；`FeedbackSDKConfig.directBox` 白名单 | 模块缺失红 → 绿 |
| C7 后端契约 | `feedback_raw_creation_test.go`（characterization，方案已预见可能直接绿） | 无 `data/structured` 建卡 + 幂等，**真跑 Postgres 验证通过** | 绿（锁死 D3 前提） |
| C5 接线 | 页面 mock 升级 forwardRef + 3 例集成 | `AgentChatPanel` `forwardRef` 暴露 `send`；`handleAnalyze`；`directBoxDowngraded` 运行时降级 | 3 红 → 绿（两轮修正：整理成功未退 manual 位、降级误关表单位） |
| C6 类型 | 页面 3 例 + `feedback_query_type_test.go`（真 RED：filter 返回全量） | 后端 `request_type/none` 过滤 + 400 非法值；前端徽标 + 筛选透传 | 红 → 绿 |
| C8 门禁 | — | 见 10.3 | 全绿 |

### 10.2 与方案的偏差（诚实记录）

1. **C2 必填契约修正**（开发前）：设计稿 B 档「另两框可勾不确定」与后端 core 规则（`agent_clarification.go:215`，position/phenomenon/expect 不可 unknown）冲突，按「测试揭示决策错误→回方案修订」改为三框全必填，降级能力仅保留在核对表单非 core 字段。方案 §Cycle 2 已同步修订。
2. **C4 REFACTOR（共享图片区）未执行**：手填附件是草稿字段（参与 confirmed 重置与持久化），单框附件是独立状态，语义不同；强行提取需引入状态同步层，评估为高风险低收益。两组件各自 ~20 行上传逻辑保留，测试覆盖提交/失败路径（上传成功路径沿袭既有无专项测试现状）。
3. **C7 为 characterization**：后端 `validateFeedbackClarification` 对 `data==nil` 本就放行，测试直接绿，按方案预期锁死契约而非驱动实现。
4. **Postgres 测试需显式 DSN**：`WORKSHOP_TEST_POSTGRES_DSN='host=127.0.0.1 port=5432 user=zqs dbname=postgres sslmode=disable'`；不设 DSN 时集成测试 SKIP，**不算全量验收**（文档 `api/feedback-multimodal.md:54` 已有此约束）。

### 10.3 投产门禁（本轮实测）

| 门禁 | 命令 | 结果 |
|---|---|---|
| 前端单测 | `cd apps/feedback-sdk-web && npm test` | **26 文件 / 177 例全绿**（基线 140 → +37） |
| 类型与构建 | `npm run build:check` | tsc + vite build 通过 |
| 后端全量 | `WORKSHOP_TEST_POSTGRES_DSN=… go test ./... -count=1` | **8 包全 ok**（含新增 raw/type 两测试） |
| 静态检查 | `go vet ./handler/` | 干净 |
| 设计稿冒烟 | `node smoke-feedback-direct.js` | ALL PASS（43 项，方案资产未漂移） |
| L5 手动验收 | 见 10.4 | **待人工执行** |

### 10.4 L5 手动验收清单（投产前人工过一遍）

1. 能力位开（`directBox:true`）：点「仍未解决」→ 单框；含「希望/建议」文字 → 整理 → 需求字段组 → 建卡 → 列表「需求」徽标 → 筛选只出需求。
2. 能力位关：点「仍未解决」→ 用户语言手填（示例 placeholder、三框必填、确认勾选）。
3. 有分析结果时点「仍未解决」→ 进核对不进空白手填；「改为直接填写」→ 手填 →「返回咨询并保留草稿」回核对且事实不丢。
4. 整理失败（可断网模拟）→ role=alert + 草稿不丢 →「改用手填」可提交。
5. 原样提交 → 列表「待分析」徽标 → 类型筛「待分析」只出该卡。
6. 对话路径提需求全程不受影响；暗色模式与相邻面板并排目视无违和（S1–S7 走查）。
7. 未带 DSN 的 `go test` 会 SKIP 集成测试——发布流水线必须配置 `WORKSHOP_TEST_POSTGRES_DSN`。
