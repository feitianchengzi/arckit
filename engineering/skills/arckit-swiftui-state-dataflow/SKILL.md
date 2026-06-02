---
name: arckit-swiftui-state-dataflow
description: SwiftUI 状态、数据流和分层边界 skill。用于处理 @State、@Binding、@Observable、@Query、@Environment、SwiftData、Service 注入、View/Model/Service 职责、业务状态与 UI 状态拆分、服务层去 UIKit/AppKit 类型依赖、ViewModel/状态模型边界。用户提到状态混乱、数据流、SwiftData、Observable、ViewModel、Service、架构边界、业务逻辑放哪、服务层不该依赖 UI 类型时使用。
---

# ArcKit SwiftUI State Dataflow

## 目标

为真实 SwiftUI 功能确定状态归属、数据流和 View/Model/Service 边界，避免 ViewModel 膨胀、Service 污染 UI 类型、状态多源复制和副作用散落。

## 执行流程

1. 列出功能中的状态：持久化数据、非持久化业务状态、局部 UI 状态、系统环境值。
2. 画出数据流：用户操作 -> View -> Service/Model -> 状态更新 -> View 渲染。
3. 选择状态工具：简单 UI 用 `@State`，父子编辑用 `@Binding`，持久化查询用 `@Query`，关联业务状态用 `@Observable`。
4. 定义 Model、Service、View 职责。Model 表达领域数据，Service 表达外部能力，View 做协调。
5. 检查 Service 接口是否泄漏 `UIImage`、`UIViewController`、`Color`、`View` 等 UI 类型；必要时改为 `Data`、`URL`、DTO、领域模型。
6. 对关键 Model、Service、状态转换保留可测试边界。

## 读取资源

- 详细规则和检查表：`references/state-dataflow-rules.md`
- 状态和 Service 代码模式：`references/code-patterns.md`

## 核心规则

| 层 | 可以 | 禁止 |
| --- | --- | --- |
| Model | 领域数据、领域约束、基于自身的计算属性 | 依赖 View、Service、UI 状态 |
| Service | 网络、存储、系统能力、算法通道 | 产品决策、导航、弹窗、UI 状态 |
| View | 持有状态、调用 Service、组合 UI、协调业务 | 底层网络、Keychain、重型解析、系统桥接细节 |
| Utils | 项目独立工具 | 依赖业务对象和 View |

## 状态决策

```text
需要管理什么？
├─ 持久化领域数据 → @Model / SwiftData + @Query
├─ 非持久化业务状态 → @Observable
├─ 简单 UI 状态 → @State
├─ 父子双向编辑 → @Binding
└─ 外部能力 → Service + @Environment
```

## 最低交付标准

- 每个关键状态有唯一事实来源。
- View、Model、Service 职责明确。
- Service 接口不泄漏 SwiftUI/UIKit/AppKit 类型。
- 异步副作用不在 body 中触发。
- 关键状态转换可测试。

## 降级/停止条件

- 只改纯展示样式或文案时，不做完整状态重构。
- 单个局部 `@State` 足以表达的小交互，不引入 `@Observable`。
- 既有项目已有清晰数据流时，沿用项目模式，只修正明显边界问题。
