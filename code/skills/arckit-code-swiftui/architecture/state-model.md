# State Model

## 状态选择

```text
持久化领域数据 -> @Model + @Query 或 store/service 持久化边界
简单局部 UI 状态 -> @State
父子双向编辑 -> @Binding
复杂关联状态/异步流程 -> @Observable Store
外部能力 -> Service protocol + 构造注入
展示转换 -> display model
```

`@Observable` Store 表达关联状态、用户动作和异步流程。Store 可以依赖 service protocol，但不要持有 `@Environment`、SwiftUI `View`、UIKit/AppKit controller 或 `modelContext`。

## LoadableState

```swift
enum LoadableState<Value> {
    case idle
    case loading
    case loaded(Value)
    case empty
    case failed(AppError)
}
```

互斥页面状态用 enum，不用多个 Bool 拼状态。

## MutationState

```swift
enum MutationState {
    case idle
    case submitting
    case succeeded
    case failed(AppError)
}
```

提交态和加载态分开，避免提交失败覆盖页面已有数据。

## PermissionState

```swift
enum PermissionState: Sendable, Equatable {
    case notDetermined
    case authorized
    case denied
    case restricted
    case unavailable
    case failed(String)
}
```

权限不要压成 Bool；拒绝、受限、不可用和系统错误要能区分。

## Stale Result

异步任务基于输入身份更新状态。参数变化、页面消失或用户取消后，旧任务不得写回新状态。需要时用 task id、generation token 或 actor 边界防止过期结果。

## AppError

AppError 是 UI 和日志可理解的稳定错误分类，不直接展示底层错误字符串。
