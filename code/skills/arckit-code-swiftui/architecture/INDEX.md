# Architecture Index

本目录定义 ArcKit SwiftUI 默认目标架构。新项目和新功能默认采用这些代码形状；已有代码偏离时，把偏离视为迁移成本输入，而不是照抄理由。

## 默认结构

```text
App
-> RootView
-> FeatureView
-> FeatureStore
-> FeatureService protocol
-> Service implementation
-> API / Persistence / Platform Adapter
-> Tests
```

默认目录：

```text
App/
DesignSystem/
Navigation/
Features/<FeatureName>/
Services/API/
Services/Persistence/
Services/Platform/
Shared/
```

## 读取顺序

从 0 项目先读 `project-structure.md`、`dependency-injection.md` 和 `design-tokens.md`。新增功能读 `feature-module.md`、`state-model.md` 和 `view-composition.md`。涉及外部数据读 `service-boundary.md`。涉及系统能力读 `platform-adapter.md`。涉及外部入口读 `navigation.md`。写完补 `testing.md`。

## 偏离处理

- 低成本：本次直接拉齐默认架构。
- 中成本：新增代码使用默认架构，旧代码用兼容层连接。
- 高成本：保持行为稳定，记录重构入口，不在功能任务中强迁移。
