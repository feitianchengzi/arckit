# Apple 系统能力边界

## 集成判断

接系统能力前先判断：

- SwiftUI 是否已有原生 API。
- 是否必须桥接 UIKit/AppKit。
- 是否需要 entitlements。
- 是否需要 Info.plist 权限文案。
- 是否需要 Developer 后台配置。
- 是否需要 App Group 或 Keychain Group。

## 隔离规则

系统能力隔离在：

- service。
- adapter。
- representable。
- coordinator。
- platform helper。

不要让业务 model 依赖 Apple UI 类型。不要让多个页面各自写系统桥接。

## 常见能力注意点

### PhotosPicker

- View 可持有 PhotosPicker 选择状态。
- 数据读取、压缩、上传交给媒体管线。
- 处理取消、读取失败、文件过大。

### ShareSheet

- UIKit share sheet 可接受。
- iPad 需要 popover anchor。
- 分享内容、链接、封面 metadata 要统一。
- 不要在 service 内直接 present。

### Keychain

- 只存敏感凭据。
- 错误不能全部吞成 nil。
- 读取失败、未配置、系统失败要区分。

### WidgetKit

- 共享数据要小、稳定、可序列化。
- 图片路径需 Widget 可访问。
- 点击 URL 使用业务 id。

### 权限

- 在用户理解用途时请求。
- 拒绝后有降级路径。
- 权限文案和实际用途一致。

## UIKit/AppKit 使用准则

允许：

- SwiftUI 无替代。
- 系统 API 只能通过 UIKit/AppKit。
- 性能或手势能力 SwiftUI 无法满足。

要求：

- 封装清楚。
- 不扩散到业务层。
- 提供降级或失败处理。

## 检查清单

- 是否优先评估 SwiftUI 原生方案？
- 桥接是否被隔离？
- 是否需要 entitlements？
- 权限文案是否齐全？
- 敏感数据是否进 Keychain？
- Widget/App Group 路径是否可访问？
- 系统失败是否有用户可理解状态？

## 决策机制

接入系统能力时先做三段判断：

1. SwiftUI 原生 API 能否覆盖？能覆盖则直接使用 SwiftUI。
2. 是否只是展示系统 UI？是则用局部 representable，不进入领域层。
3. 是否是长期业务能力？是则定义 protocol + adapter/service，View 只依赖稳定接口。

| 能力 | 首选 | 需要桥接时 |
| --- | --- | --- |
| 相册选择 | `PhotosPicker` | 复杂裁剪/旧系统兼容 |
| 分享 | SwiftUI `ShareLink` | 自定义 `UIActivityViewController` metadata |
| Widget | WidgetKit | 不适用 |
| 通知 | UserNotifications service | 不适用 |
| Keychain | Keychain service | 不适用 |
| 高级手势 | SwiftUI Gesture | UIKit recognizer adapter |

## 推荐代码骨架

### 权限状态

权限不是简单 Bool，要区分未请求、拒绝、受限和系统失败。

```swift
enum PermissionState: Equatable, Sendable {
    case notDetermined
    case granted
    case denied
    case restricted
    case unavailable
}

protocol PhotoPermissionServiceProtocol: Sendable {
    func currentState() async -> PermissionState
    func requestAccess() async -> PermissionState
}
```

### 系统 Adapter

Adapter 返回稳定数据，不把 UIKit/AppKit 类型暴露给业务。

```swift
struct PickedPhotoPayload: Sendable {
    var data: Data
    var fileName: String
    var mimeType: String
}

protocol PhotoImporting: Sendable {
    func loadPhoto(from item: PhotosPickerItem) async throws -> PickedPhotoPayload
}
```

`PhotosPickerItem` 是 SwiftUI PhotosUI 边界类型，可以停留在 View/adapter 边界；业务 service 不应继续向下依赖它。

### Keychain Service

Keychain 错误要分类，不要把所有失败吞成 nil。

```swift
enum SecureStoreError: Error, Sendable {
    case itemNotFound
    case duplicateItem
    case unexpectedStatus(OSStatus)
    case invalidData
}

protocol SecureStoreProtocol: Sendable {
    func save(_ data: Data, key: String) throws
    func load(key: String) throws -> Data
    func delete(key: String) throws
}
```

### UIKit Bridge 边界

桥接只负责呈现系统能力，不负责业务决策。

```swift
struct ActivityView: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
```

如果需要 iPad popover anchor，不要在业务 service 内 present；由 View 层或 representable coordinator 处理。

### App Group 路径

共享路径集中管理，Widget 和 App 使用同一套 key。

```swift
struct SharedContainer: Sendable {
    var groupIdentifier: String

    func containerURL() throws -> URL {
        guard let url = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: groupIdentifier
        ) else {
            throw SharedContainerError.unavailable
        }
        return url
    }
}
```

## 验证要求

- 权限：首次请求、拒绝、系统设置关闭、恢复授权。
- Bridge：多次打开/关闭不泄漏状态，iPad 分享不崩溃。
- Keychain：未找到、重复写入、删除后读取、系统错误映射。
- App Group：主 App 写入，Widget 可独立读取。
- Info.plist/entitlements：代码用到的能力都有配置。
