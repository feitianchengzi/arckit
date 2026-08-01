# Platform Adapter

## Adapter 边界

系统能力隔离在 service、adapter、representable、coordinator 或 platform helper。业务 model 不依赖 Apple UI 类型。

```swift
protocol KeychainStoring: Sendable {
    func data(for key: String) throws -> Data?
    func set(_ data: Data, for key: String) throws
    func remove(_ key: String) throws
}
```

## App Group

```swift
protocol AppGroupPathProviding: Sendable {
    func containerURL() throws -> URL
}
```

App、Widget、扩展共享路径集中管理，业务 key 稳定。

## UIKit/AppKit Bridge

Representable 只暴露稳定输入、输出回调和 reset id。Delegate/coordinator 不进入业务 model/service。

```swift
struct PlatformZoomView<Content: View>: UIViewRepresentable {
    let resetID: AnyHashable
    let content: Content
}
```

系统级滚动、缩放、输入、文本选择、系统面板优先复用平台控件，不用 SwiftUI 手写底层物理。

## 配置同步

使用系统能力时同步检查 Info.plist、entitlements、Privacy Manifest、App Group、Associated Domains、Developer/服务端配置和验证路径。
