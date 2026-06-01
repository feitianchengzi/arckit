---
name: arckit-swiftui-ai-generation
description: SwiftUI 客户端 AI 生成链路 skill。用于大模型/AI 生成、Prompt、SSE/streaming、结构化输出、JSON 解析、质量校验、生成重试、去重、超时、取消、防抖、成本控制、生成状态 UI、生成失败恢复。用户提到 AI 生成、自动创作、生成文案/音乐/内容、流式输出、prompt、模型返回格式、生成失败、重复生成、扣费生成时使用。
---

# ArcKit SwiftUI AI Generation

## 目标

把 AI 生成做成可约束、可解析、可取消、可恢复、可控成本的产品链路。Agent 执行时不要只发起模型请求，而要同时处理 prompt、schema、stream、解析、质量门、状态机、重试和权益/成本语义。

## 执行流程

1. 明确生成目标、用户输入、上下文、业务边界和不可接受输出。
2. 定义输入参数和输出 schema；如果是 JSON，schema 必须能被代码解码和校验。
3. 建立集中 prompt builder，不在 View 中拼 prompt；把角色、任务、格式、约束、示例、用户参数集中管理。
4. 实现请求链路：普通 HTTP 或 streaming/SSE；底层网络复用 networking skill。
5. 对模型输出做结构化抽取、解码和领域校验；不要把模型返回直接当可信业务数据。
6. 定义错误分类：网络、认证、超时、取消、解析失败、校验失败、重复失败、模型拒绝、空结果、权益不足。
7. 建立生成 UI 状态机：idle、validating input、generating、streaming、validating output、success、failed、retrying、cancelled。
8. 处理防抖、取消、同上下文单飞、重复生成、重试次数和成本/权益状态。
9. 为 prompt builder、解析、校验、错误映射、取消/重试补测试。

## 读取资源

- prompt、streaming、结构化输出、质量门、取消/重试、生成状态 UI、成本/权益检查：`references/ai-generation-pipeline.md`
- 底层 HTTP、鉴权、错误码：`arckit-swiftui-networking-api`
- 生成结果保存、历史、草稿：`arckit-swiftui-local-data-lifecycle`
- 长任务和卡顿风险：`arckit-swiftui-performance-quality`

## 核心规则

| 问题 | 执行要求 |
| --- | --- |
| Prompt 散落 | 集中 builder/service 管理 |
| 输出不稳定 | schema + decode + domain validate |
| 流式中断 | 有取消、超时、部分状态处理 |
| 重复生成 | 同上下文单飞、防抖、重试上限 |
| 成本不清 | 生成前后权益/扣费状态明确 |
| 失败泛化 | 错误分类后再映射 UI |

## 最低交付标准

- 输入约束、输出 schema 和领域校验明确。
- Prompt 不在 View 中临时拼接。
- 生成任务支持超时、取消、重试或明确说明不可取消。
- 失败状态能区分网络、解析、校验、空结果、权益等关键类型。
- 涉及成本/权益时，用户能理解生成前后状态。
- 解析和校验有测试。

## 降级/停止条件

- 本地固定规则生成不使用完整 AI 链路。
- 只改 prompt 少量文案且不影响 schema 时，聚焦 prompt builder，不重做状态机。
- 后端完全封装 AI 质量门时，客户端仍需处理状态、错误和结果可信边界。
