# 客户支持通道 — 工作量评估与推进计划

> 基于 arcorbit 客户端现状（2026-09-17 核实）+ 场景差距分析，评估实现 PRD 需求的工作量与推进节奏。

---

## 一、现状能力盘点

| 能力域 | 现状 | 文件 | 可复用度 |
|--------|------|------|----------|
| **Workshop API 通信层** | ✅ 完整 HTTP REST + 认证 | `task-source-adapter.mjs` (790行) | 100% |
| **WebSocket 实时更新** | ✅ 断线重连 + cursor 恢复 | `workshop-realtime-adapter.mjs` (352行) | 100% |
| **Task CRUD** | ✅ 创建/更新/状态/标签/树形 | `workshop-platform-adapter.mjs` (836行) | 100% |
| **Feedback V2** | ✅ 消息/通知/附件/转任务 | `workshop-platform-adapter.mjs` + `platform-coordinator.mjs` | 95% |
| **自动化执行引擎** | ✅ 3201行完整引擎 | `automation-coordinator.mjs` | 100% |
| **Today 引导系统** | ✅ 智能判断当前应做事项 | `today-guidance.mjs` + `today-workspace.mjs` | 80% |
| **组织与成员管理** | ✅ CRUD + 角色 + 项目成员 | `platform-coordinator.mjs` | 100% |
| **Renderer 状态管理** | ⚠️ 手写状态机，无组件化 | `renderer.js` (1017行) | 需重构 |

**关键发现**：arcorbit 客户端已具备 80% 的基础能力，核心差距在 **双向通信通道** 和 **草稿状态管理**。

---

## 二、需求模块工作量评估

### 第一批：立即启动（1-2 周）

| 模块 | 工作内容 | 工作量 | 负责人 | 依赖 |
|------|----------|--------|--------|------|
| **triage 门控修复** | 修复 `requireFeedbackProjectMember` 不查 role 的 bug | **1人日** | 后端 | 无 |
| **capabilities 字段** | Postgres migration + 权限逻辑切换 | **3人日** | 后端 | 无 |
| **FeedbackMessage state** | Postgres migration 加 `state` 字段 | **1人日** | 后端 | 无 |

**小计**：5 人日（后端），可并行

---

### 前置基础设施：双向通信通道（2-3 周）

> 这是设计稿遗漏的关键依赖，桥1/2/3 都依赖此通道。

| 模块 | 工作内容 | 工作量 | 负责人 | 依赖 |
|------|----------|--------|--------|------|
| **runtime → workshop-api 回写** | 新增 HTTP POST 能力，支持草稿/进展回写 | **5人日** | 后端 | FeedbackMessage state |
| **workshop-api → runtime 事件推送** | 复用 per-project cursor，runtime 监听 WebSocket | **8人日** | 后端+客户端 | 无 |
| **FeedbackMessage 草稿状态** | 新增 `pending_review` / `sent` 状态流转 | **3人日** | 后端 | FeedbackMessage state |
| **客户端 IPC 扩展** | preload.cjs 新增草稿相关 API | **2人日** | 客户端 | runtime 回写能力 |

**小计**：18 人日（含后端12 + 客户端6）

---

### 第二批：桥1 — Task→Case 追溯（1-2 周）

| 模块 | 工作内容 | 工作量 | 负责人 | 依赖 |
|------|----------|--------|--------|------|
| **task-source-adapter 扩展** | 拉取 FeedbackTaskLink，runtime 感知 Task 关联的 Feedback | **3人日** | 客户端 | 双向通信 |
| **Gap.derived_from 追溯** | 前缀泛化 `customer-feedback:<id>`，SKILL.md 记录语义 | **2人日** | 协议层 | FeedbackTaskLink |
| **Today 引导扩展** | 新增"待分诊"引导段 | **2人日** | 客户端 | 桥1 |

**小计**：7 人日

---

### 第三批：桥2 + 桥3（2-3 周）

| 模块 | 工作内容 | 工作量 | 负责人 | 依赖 |
|------|----------|--------|--------|------|
| **closeout → 草稿回写（桥2）** | runtime closeout 扩展，写入进展草稿 | **5人日** | 后端+客户端 | 双向通信 + state |
| **草稿确认流程** | Feedback 详情 UI 加草稿确认面板 | **5人日** | 客户端 | 桥2 |
| **客户追问 → steer（桥3）** | workshop-api → runtime 事件路由 + steer 注入 | **8人日** | 后端+客户端 | 双向通信 + 桥1 |
| **SDK 实时推送** | SDK 侧 WebSocket/SSE 订阅 | **5人日** | SDK | workshop-api WS |

**小计**：23 人日

---

### 并行：智能客服知识库（3-4 周）

| 模块 | 工作内容 | 工作量 | 负责人 | 依赖 |
|------|----------|--------|--------|------|
| **WeKnora 部署** | 文档知识库部署 + workspace 绑定机制 | **5人日** | 运维+后端 | 无 |
| **知识源摄入管道** | 项目文档/arckit facts/FAQ 同步 | **8人日** | 后端 | WeKnora |
| **代码 RAG 管道** | tree-sitter 分块 + BGE-M3 + pgvector | **15人日** | 后端 | 无 |
| **置信度合并算法** | 归一化 + 来源加权 + 阈值判定 | **3人日** | 后端 | 两套检索 |
| **检索接口 /retrieve** | workshop-api 新增端点 | **3人日** | 后端 | 置信度算法 |
| **知识源管理面板（F-09）** | 前端 UI：同步状态/重建索引/检索测试 | **8人日** | 客户端 | 知识源摄入 |
| **草稿确认界面** | 处理人确认/驳回/转人工 | **3人日** | 客户端 | 检索接口 |

**小计**：45 人日（含后端37 + 客户端8）

---

### 延后（本期不做）

| 模块 | 说明 |
|------|------|
| **产物交付 track** | 部署不在本期，PRD 已声明搁置 |
| **代码语义检索（完整版）** | 智能客服 MVP 先用文档检索，代码 RAG 作为第二批 |
| **AI 分诊初判** | 依赖知识库，可后续迭代 |

---

## 三、总工作量汇总

| 批次 | 内容 | 工作量 | 周期 |
|------|------|--------|------|
| 第一批 | triage 门控 + capabilities + FeedbackMessage state | 5 人日 | 1 周 |
| 前置基础设施 | 双向通信通道 | 18 人日 | 2-3 周 |
| 第二批 | 桥1（Task→Case 追溯） | 7 人日 | 1-2 周 |
| 第三批 | 桥2+桥3（草稿回写+客户追问） | 23 人日 | 2-3 周 |
| 并行 | 智能客服知识库 | 45 人日 | 3-4 周 |
| **合计** | **核心链路（不含知识库）** | **53 人日** | **6-9 周** |
| **合计** | **含知识库全量** | **98 人日** | **9-13 周** |

---

## 四、推进计划（建议节奏）

### 阶段一：基础设施 + Bug 修复（第 1-3 周）

```
Week 1:
  ├─ [后端] triage 门控修复（1天）
  ├─ [后端] capabilities migration + 权限逻辑（3天）
  └─ [后端] FeedbackMessage state migration（1天）

Week 2-3:
  ├─ [后端] runtime → workshop-api 回写通道（5天）
  ├─ [后端] workshop-api → runtime 事件推送（5天）
  ├─ [客户端] preload.cjs 草稿 API 扩展（2天）
  └─ [后端] 草稿状态流转逻辑（3天）
```

**里程碑**：双向通信通道打通，草稿状态可流转

### 阶段二：桥1 + 桥2（第 4-6 周）

```
Week 4:
  ├─ [客户端] task-source-adapter 扩展 FeedbackTaskLink（3天）
  └─ [协议层] Gap.derived_from 前缀泛化（2天）

Week 5-6:
  ├─ [后端+客户端] closeout → 草稿回写（5天）
  ├─ [客户端] 草稿确认流程 UI（5天）
  └─ [客户端] Today 引导扩展（2天）
```

**里程碑**：客户反馈→分诊→Task→开发→进展草稿→确认→回复客户 全链路跑通

### 阶段三：桥3 + 智能客服 MVP（第 7-10 周）

```
Week 7-8:
  ├─ [后端+客户端] 客户追问 → steer 注入（8天）
  └─ [SDK] 实时推送（5天）

Week 9-10:
  ├─ [运维+后端] WeKnora 部署 + workspace 绑定（5天）
  ├─ [后端] 知识源摄入管道（8天）
  └─ [后端] 置信度合并 + 检索接口（6天）
```

**里程碑**：客户追问闭环 + 智能客服 MVP 上线

### 阶段四：智能客服完整版（第 11-13 周）

```
Week 11-13:
  ├─ [后端] 代码 RAG 管道（15天）
  ├─ [客户端] 知识源管理面板（8天）
  └─ [客户端] 草稿确认界面（3天）
```

**里程碑**：智能客服完整版上线，支持文档+代码双检索

---

## 五、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| **双向通信通道工程量** | 设计稿遗漏，是最大隐藏工程量 | 作为前置基础设施先行，不压缩工期 |
| **Renderer 巨型单文件** | 新增视图继续膨胀，维护成本高 | 草稿确认面板独立为 `draft-surface.mjs`，逐步组件化 |
| **代码 RAG 管道复杂** | 15人日，是知识库最大工作量 | 先文档检索 MVP，代码 RAG 可延后 |
| **WeKnora 选型风险** | 外部依赖，部署和运维不确定性 | 试点期降级方案：转追问收集 |
| **置信度阈值拍脑袋** | 初期 0.75 可能不准 | Q-03 标注集回测，初期保守（宁转收集不误直答） |

---

## 六、关键决策点

| 决策项 | 建议 | 理由 |
|--------|------|------|
| **derived_from 语义** | 前缀泛化 `customer-feedback:<id>` | 改动面小，SKILL.md 记录语义泛化即可 |
| **双向通信形态** | 复用 per-project cursor | 已有 WebSocket 基础，零增量部署 |
| **草稿落点** | 并入 Feedback 详情对话面板 | 避免页面膨胀，草稿作为 system 消息的 pending 状态 |
| **代码 RAG 节奏** | 先文档检索，代码 RAG 第二批 | 文档检索覆盖 question/consultation 类，代码检索主要服务 issue 类 |

---

## 七、验收节点

| 节点 | 验收场景 | 对应 PRD |
|------|----------|----------|
| **阶段一完成** | triage 门控修复 + capabilities 权限生效 | AC-F04 |
| **阶段二完成** | 客户反馈→分诊→Task→开发→进展草稿→确认→回复 | AC-F01~F07 |
| **阶段三完成** | 客户追问→steer 注入 + 智能客服 MVP | AC-F08, AC-F09 |
| **阶段四完成** | 知识源管理 + 代码检索 + 草稿确认界面 | AC-F10, AC-F08 |

---

## 附录：arcorbit 客户端需新增的文件

| 文件 | 职责 | 阶段 |
|------|------|------|
| `src/feedback-triage.mjs` | 分诊门控逻辑 + capabilities 查询 | 阶段一 |
| `src/draft-manager.mjs` | 草稿状态管理 + 回写通道 | 阶段二 |
| `src/draft-surface.mjs` | 草稿确认 UI 组件 | 阶段二 |
| `src/knowledge-manager.mjs` | 知识源管理 + 检索测试 | 阶段四 |
| `src/knowledge-surface.mjs` | 知识库管理面板 UI | 阶段四 |
| `src/steer-router.mjs` | 客户追问→steer 事件路由 | 阶段三 |
