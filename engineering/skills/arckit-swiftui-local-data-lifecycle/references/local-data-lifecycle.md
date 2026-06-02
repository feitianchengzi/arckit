# 本地数据生命周期规则

## 数据分类

先按生命周期分类：

- 临时 UI 状态。
- 草稿。
- 用户偏好。
- 敏感凭据。
- 结构化业务数据。
- 文件缓存。
- 可导出作品。
- Widget 共享数据。

不同分类不应混用存储。

## 存储选择表

| 类型 | 存储 |
| --- | --- |
| 草稿 / 作品 / 历史 | SwiftData 或文件 + index |
| 小型偏好 | UserDefaults / AppStorage |
| 凭据 | Keychain |
| 图片/文件缓存 | FileManager / URLCache |
| Widget 数据 | App Group |
| 临时处理 | temporary directory |

## 生命周期契约

每类数据要写清楚：

- 创建时机。
- 更新时机。
- 保存时机。
- 删除时机。
- 崩溃后恢复策略。
- 是否参与备份。
- 是否参与迁移。
- 是否共享给 Widget。

## 迁移

迁移要考虑：

- 新字段默认值。
- 字段重命名。
- 枚举值变化。
- 旧 id 规则。
- JSON 格式变化。
- 部分记录损坏。

迁移失败不能默认导致 App 不可用。核心路径应有降级。

## 草稿

草稿策略必须明确：

- 离开页面是否保存。
- 新建是否覆盖。
- 保存成功是否清理。
- 失败是否保留。
- 多次编辑是否版本化。

## 缓存

缓存策略必须明确：

- key。
- 过期。
- 最大体积。
- 清理时机。
- 是否可重建。
- 是否允许用户手动清理。

## Widget 共享

Widget 数据要求：

- 小。
- 稳定。
- Codable。
- 不依赖主 App 内存。
- 使用业务可解析 id。
- 图片和文件路径在 App Group 内。

## 检查清单

- 数据是否分类？
- 存储是否匹配分类？
- 是否有迁移和降级策略？
- 草稿覆盖是否有确认？
- 缓存是否可清理？
- Widget 数据是否可独立读取？
- 损坏数据是否不会阻断主路径？

## 推荐代码骨架

### 数据生命周期契约

每类本地数据先写成契约，再选存储。

```swift
struct LocalDataPolicy: Sendable {
    enum Storage: Sendable {
        case swiftData
        case userDefaults
        case keychain
        case fileCache
        case appGroup
        case temporary
    }

    var storage: Storage
    var isUserVisible: Bool
    var isRecoverable: Bool
    var participatesInBackup: Bool
    var maxAgeSeconds: TimeInterval?
}
```

### SwiftData Entity

SwiftData entity 保持领域数据，不放 loading、alert、sheet 等 UI 状态。

```swift
@Model
final class WorkItem {
    @Attribute(.unique) var id: String
    var title: String
    var createdAt: Date
    var updatedAt: Date

    init(id: String, title: String, createdAt: Date = .now) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = createdAt
    }
}
```

### 草稿 Store

草稿策略独立，避免页面退出时散落保存逻辑。

```swift
struct DraftSnapshot: Codable, Equatable, Sendable {
    var id: String
    var title: String
    var body: String
    var updatedAt: Date
}

protocol DraftStoreProtocol: Sendable {
    func load(id: String) async throws -> DraftSnapshot?
    func save(_ draft: DraftSnapshot) async throws
    func delete(id: String) async throws
}
```

### 文件缓存

缓存必须可清理、可重建，不应阻断主路径。

```swift
actor FileCache {
    private let directory: URL
    private let maxAgeSeconds: TimeInterval

    init(directory: URL, maxAgeSeconds: TimeInterval) {
        self.directory = directory
        self.maxAgeSeconds = maxAgeSeconds
    }

    func store(_ data: Data, key: String) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try data.write(to: directory.appending(path: key), options: [.atomic])
    }

    func removeExpired(now: Date = .now) throws {
        let urls = try FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.contentModificationDateKey]
        )

        for url in urls {
            let values = try url.resourceValues(forKeys: [.contentModificationDateKey])
            guard let modifiedAt = values.contentModificationDate else { continue }
            if now.timeIntervalSince(modifiedAt) > maxAgeSeconds {
                try? FileManager.default.removeItem(at: url)
            }
        }
    }
}
```

### Widget 快照

Widget 读取快照，不读取复杂 SwiftData 对象图。

```swift
struct WidgetSnapshot: Codable, Sendable {
    var title: String
    var subtitle: String
    var imageFileName: String?
    var routeURL: URL
    var updatedAt: Date
}

protocol WidgetSnapshotStoreProtocol: Sendable {
    func save(_ snapshot: WidgetSnapshot) async throws
    func load() async throws -> WidgetSnapshot?
}
```

### 损坏降级

本地数据读取失败要隔离坏数据，尽量不阻断主路径。

```swift
enum LocalDataError: Error, Sendable {
    case notFound
    case corrupted(identifier: String)
    case migrationFailed(underlying: Error)
    case unavailable(underlying: Error)
}
```

## 验证要求

- 草稿：退出保存、保存成功清理、失败保留、新建覆盖确认。
- 迁移：旧字段、旧枚举、缺字段、部分记录损坏。
- 缓存：过期清理、容量清理、文件缺失可重建。
- Widget：App 写入后扩展可读取，图片路径在 App Group 内。
- 损坏数据：坏记录不导致 App 主路径崩溃。
