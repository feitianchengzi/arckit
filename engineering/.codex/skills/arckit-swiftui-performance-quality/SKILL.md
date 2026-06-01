---
name: arckit-swiftui-performance-quality
description: SwiftUI 性能、卡顿治理和质量回归 skill。用于页面卡顿、动画掉帧、View body 重计算、display model、列表性能、图片内存、MainActor 压力、异步任务调度、Instruments、测试、质量门、回归检查。用户提到卡、掉帧、不流畅、首屏慢、列表慢、动画卡顿、性能优化、质量检查、回归测试时使用。
---

# ArcKit SwiftUI Performance Quality

## 目标

定位并治理 SwiftUI 页面卡顿、动画掉帧、列表慢、首屏慢和质量回归。Agent 执行时不要泛泛“优化”，而要找出具体风险路径，并把重计算、主线程压力、异步任务和刷新范围降下来。

## 执行流程

1. 先确认卡顿路径：首屏、滚动、切页、手势、动画、图片加载、网络返回后刷新、数据解析。
2. 审查相关 View body：移除排序、过滤、JSON decode、DateFormatter 创建、文件 IO、同步图片处理等重计算或副作用。
3. 把复杂展示准备前置到 display model、缓存、service 或异步任务；View 只消费轻量描述。
4. 审查 observable 粒度，避免小状态变化刷新整页或长列表。
5. 整理 `.task`、`Task`、网络请求、图片加载的生命周期：去重、取消、限流，切页/消失时不堆任务。
6. 检查列表行和图片：控制尺寸、缓存、解码、预取并发和内存峰值。
7. 涉及动画/手势时确认每帧更新是否局部化，动画期间不触发重数据链路。
8. 增加可回归验证：单元测试、交互手测、长列表/弱网场景，必要时给出 Instruments 项目和观察指标。

## 读取资源

- 卡顿定位、body 审查、display model、Observable 粒度、异步任务回归：`references/performance-quality-review.md`
- 手势/动画掉帧：`arckit-swiftui-interaction-motion`
- 图片内存、列表图片加载：`arckit-swiftui-media-pipeline`
- 状态粒度和数据流：`arckit-swiftui-state-dataflow`

## 核心规则

| 风险 | 执行要求 |
| --- | --- |
| body 重计算 | 前置到 display model/cache |
| 主线程压力 | 解析、压缩、IO 移出主路径 |
| Observable 过大 | 缩小可观察状态范围 |
| `.task` 重复 | 使用 task id、取消、去重 |
| 列表慢 | 行轻量化，图片尺寸和缓存受控 |
| 动画卡顿 | 每帧更新局部化，结束后提交 |

## 最低交付标准

- 明确指出性能风险来自哪条路径。
- 关键 View body 无明显重计算、副作用或同步 IO。
- 复杂展示数据有 display model/cache/预处理。
- 异步任务有取消、去重或并发边界。
- 关键路径有测试、手测步骤或 Instruments 建议。

## 降级/停止条件

- 小文案、纯样式、无关键路径的小修，不做性能体系化改造。
- 没有复现条件时，先增加观察点或给出可复现路径，不凭感觉大改。
- 如果卡顿根因是手势互斥或媒体管线，分别切到对应 skill。
