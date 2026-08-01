# Navigation

## Route

```swift
enum AppRoute: Hashable, Sendable {
    case home
    case item(id: String)
}
```

Route 表达业务目标，不表达 UI 细节。只携带稳定 id 和必要上下文，不传大对象、DTO 或 View。

## URL Parser

外部入口统一进入 parser，再转换为 AppRoute：

```swift
protocol RouteParsing: Sendable {
    func parse(_ url: URL) -> AppRoute?
    func url(for route: AppRoute) -> URL?
}
```

Universal Link、URL Scheme、Widget、Push、分享回流进入同一套 route/parser/router。

## 等价性

外部入口和 App 内入口进入同一业务目标时，必须得到等价资源身份、display model、权限状态和主操作能力。不能只验证“能打开页面”。

## 测试

公开链接要有 parse/build round-trip 测试。无效链接有 fallback 或忽略策略。
