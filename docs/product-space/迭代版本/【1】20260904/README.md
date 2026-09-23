# 客户支持通道迭代【1】20260904 — 文档索引

"客户支持通道"迭代:给 arc 的需求开发 loop 接对客入口(智能客服 + 反馈 SDK)与对客出口(产物交付),打通"反馈→智能客服→分诊→Task→Codex loop→草稿→验收→产物交付"全链路。代码完成,待生产部署。

## 阅读顺序

1. **先读** [`迭代总结.md`](./迭代总结.md) — 迭代全貌,目标/架构/已完成能力/本轮收尾/客户身份与分类/部署依赖。本目录的权威收口文档。
2. **需求** [`customer-support-prd.md`](./customer-support-prd.md) — US-01~US-09、F-01~F-10 详细规格。
3. **部署** [`部署文档.md`](./部署文档.md) — 生产部署操作、前置依赖、验收标准。

## 核心权威文档(保留)

| 文档 | 内容 |
|---|---|
| `迭代总结.md` | 迭代收口:目标、架构分层、已完成能力、本轮改动、封装要点 |
| `customer-support-prd.md` | 需求 PRD(US/F 规格、边界、验收条件) |
| `customer-support-sequence-diagrams.md` | 各环节时序图 |
| `feedback-status-lifecycle.md` | 反馈/分诊/Agent 状态流转与生命周期 |
| `scenario-gap-analysis.md` | 基于代码核实的场景串联与缺口分析 |
| `智能客服-信息架构重设计.md` | 智能客服信息架构系统性重设计 |
| `implementation-handoff.md` | 工程实现交接:改动文件清单、API 端点、DDL、E2E 验收记录 |
| `openhands-integration-plan.md` | 技术方案:OpenHands Agent 基础设施与集成 |
| `智能客服Agent-LLM技术方案.md` | 技术方案:Agent 消息处理、工具调用、对话管理 |
| `部署文档.md` | 生产部署操作与验收 |
| `设计稿/` | 客户端支持助手/内部工作台/通信基础设施/链路演示原型 |

## 关联外部文档

- `../../产品规划/customer-support-orchestration-plan.md` — 权威实现编排计划
- `../../../docs/workshop/feedback-sdk-external-integration.md` — SDK 外部客户集成指南(本轮新增)

## 归档文档

见 [`归档/README.md`](./归档/README.md) — 已被取代/重复/过时的过程文档(handoff-pending、workload、技术方案-工作总结、knowledge-base、channel-design),保留备溯源,非权威。
