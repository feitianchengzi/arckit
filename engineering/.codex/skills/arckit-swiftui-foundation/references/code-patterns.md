# SwiftUI Foundation 代码模式

本文件只保留工程底座层面的通用代码模式。状态管理、View 拆分和导航代码模式已经拆到对应 skill。

## 类型选择

优先级：

1. `struct`：默认选择，适合值语义数据、DTO、配置、轻量模型。
2. `final class`：仅在需要引用语义时使用，例如 `@Observable` 状态对象、SwiftData `@Model`。
3. `enum`：有限状态、路由、错误类型、选项集。

```swift
struct UserProfile: Sendable {
    var name: String
    var email: String

    var displayName: String {
        name.isEmpty ? "未设置" : name
    }
}

enum LoadingState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(Error)
}
```

## App 入口骨架

App 入口只做根容器、依赖装配和全局配置，不塞具体业务逻辑。

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
```

## 目录职责

```text
Sources/{PackageName}/
├── App/              # App 入口、Root、全局依赖装配
├── Navigation/       # 路由、导航状态、外部入口分发
├── Models/           # 领域模型、SwiftData entity、Observable state
├── Services/         # 外部能力、API、系统 adapter、环境注入
├── Views/            # 页面和组件
├── DesignSystem/     # tokens、基础组件、主题
└── Utils/            # 与业务低耦合的工具
```

## 文件组织基线

- 一个 SwiftUI View 文件默认只放一个主 View 和对应 `#Preview`。
- App 入口、Root、Navigation、Service、Model 不混放。
- `Utils/` 不能反向依赖项目业务层。
- 新增系统能力前先确认是否需要 capability、entitlements、Info.plist。

## 并发基线

- 使用 Swift Concurrency：`async/await`、`Task`、`actor`、`@MainActor`。
- UI 状态更新保持在 MainActor 语义下。
- 不新增 `NSThread`、`performSelector(on:)`、裸 GCD 线程调度。
- `.task`、网络请求、图片加载等长期任务要有取消或去重意识。

## Foundation 检查清单

- [ ] 工程目录职责清楚。
- [ ] App 入口不包含业务细节。
- [ ] 基础 DesignTokens 有入口。
- [ ] 至少有一个 service 注入样板或可替换边界。
- [ ] 至少有一个可运行测试样板。
- [ ] 新工程可通过构建验证。
