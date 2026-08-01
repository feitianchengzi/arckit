# Dependency Injection

## 默认选择

从 0 项目默认使用 `AppDependencies` 做应用级装配，Feature 使用构造注入：

```swift
@MainActor
struct AppDependencies {
    var homeService: any HomeService

    static let live = AppDependencies(
        homeService: DefaultHomeService()
    )
}

struct RootView: View {
    let dependencies: AppDependencies

    var body: some View {
        NavigationStack {
            HomeView(
                store: HomeStore(service: dependencies.homeService)
            )
        }
    }
}
```

Store 的依赖从 init 进入，测试直接传 fake。不要为了单个测试新增全局可变 singleton。

## EnvironmentKey 取舍

`EnvironmentKey` 适合跨大量页面、低频变化、稳定的横切依赖，例如 theme、logger、analytics、router、global settings。

Feature service 默认不通过每个子 View 的 `@Environment` 直接读取。若项目已有成熟 Environment 注入，可以在 Root/App 层把 Environment service 适配为 Store 构造参数，保持 Store 和子 View 边界清楚。

## 禁止形状

```swift
@Observable
final class BadStore {
    @Environment(\.homeService) var service
}
```

状态对象不持有 `@Environment`。子 View 不直接访问页面级 service；子 View 通过 display model、binding 和 action closure 表达输入输出。
