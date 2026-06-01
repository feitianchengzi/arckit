# 媒体管线规则

## 统一图片组件能力

真实项目中的远程图片组件至少应具备：

- URL 输入。
- fallback URL。
- loading 状态。
- failure 状态。
- retry。
- memory cache。
- disk cache 或 URLCache。
- 占位。
- 图片尺寸约束。
- accessibility label 策略。

不要让不同页面各自定义失败态。

## 图片失败处理

失败态应区分：

- 没有图片。
- 网络失败。
- 解码失败。
- fallback 失败。
- 权限/文件不可访问。

用户是否可重试由场景决定。列表中可弱化，详情页/头像/上传应明确。

## 图片查看器

图片查看器要定义：

- 初始适配方式。
- 最大/最小缩放。
- 缩放锚点。
- pan 边界。
- 双击行为。
- 与翻页/关闭手势的互斥。
- 切换图片时状态重置。

以触点为中心缩放优先；SwiftUI 手势不足时允许封装 UIKit 手势。

## 上传处理

上传前管线：

1. 读取数据。
2. 判断格式。
3. 规范方向。
4. 限制最大像素。
5. 压缩到大小上限。
6. 输出 `Data`、`fileName`、`mimeType`。

网络层只接受处理后的 payload。

## Widget 和分享

Widget：

- 使用 App Group 可访问图片。
- 缓存图大小受控。
- 数据结构不要依赖主 App runtime。

分享：

- 优先本地缓存封面。
- 超时后不阻塞分享面板。
- metadata 和分享 URL 同步。

## 基础音视频

第一版媒体 skill 可覆盖：

- AVPlayer 基础播放。
- 播放/暂停/错误状态。
- 音频 session 基础配置。
- 中断后的保守降级。

涉及低延迟实时音频、录音、合成、复杂调度时，应在本 skill 内增补 reference，成熟后拆独立 skill。

## 检查清单

- 是否避免散落 `AsyncImage`？
- 是否有统一失败态？
- 是否有 retry 策略？
- 是否支持缓存和 fallback？
- 上传是否先压缩再传输？
- 图片查看器是否处理手势冲突？
- Widget/分享是否优先使用可访问缓存？

## 推荐代码骨架

### 媒体状态

统一组件先统一状态，避免不同页面各自处理 loading/failure。

```swift
enum RemoteImageState: Equatable, Sendable {
    case idle
    case loading
    case loaded(ImageAsset)
    case failed(RemoteImageError)
}

struct ImageAsset: Equatable, Sendable {
    var data: Data
    var sourceURL: URL
    var cacheKey: String
}

enum RemoteImageError: Error, Equatable, Sendable {
    case missingURL
    case network
    case decoding
    case fallbackFailed
    case fileUnavailable
}
```

### 缓存 Actor

缓存层不依赖 SwiftUI `Image` 或 UIKit `UIImage`。UI 层需要显示时再解码。

```swift
actor ImageCache {
    private var memory: [String: Data] = [:]
    private let directory: URL

    init(directory: URL) {
        self.directory = directory
    }

    func data(for key: String) async -> Data? {
        if let data = memory[key] {
            return data
        }

        let fileURL = directory.appending(path: key)
        guard let data = try? Data(contentsOf: fileURL) else {
            return nil
        }
        memory[key] = data
        return data
    }

    func store(_ data: Data, for key: String) async throws {
        memory[key] = data
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try data.write(to: directory.appending(path: key), options: [.atomic])
    }
}
```

### Loader

Loader 负责 URL、fallback、缓存和下载；View 只消费状态。

```swift
struct RemoteImageRequest: Sendable {
    var url: URL?
    var fallbackURL: URL?
    var cacheKey: String
}

struct RemoteImageLoader: Sendable {
    var cache: ImageCache
    var session: URLSession = .shared

    func load(_ request: RemoteImageRequest) async -> RemoteImageState {
        guard let url = request.url else {
            return .failed(.missingURL)
        }

        if let cached = await cache.data(for: request.cacheKey) {
            return .loaded(ImageAsset(data: cached, sourceURL: url, cacheKey: request.cacheKey))
        }

        do {
            let data = try await fetch(url)
            try await cache.store(data, for: request.cacheKey)
            return .loaded(ImageAsset(data: data, sourceURL: url, cacheKey: request.cacheKey))
        } catch {
            guard let fallbackURL = request.fallbackURL else {
                return .failed(.network)
            }
            return await load(RemoteImageRequest(
                url: fallbackURL,
                fallbackURL: nil,
                cacheKey: request.cacheKey + ".fallback"
            ))
        }
    }
}
```

### SwiftUI 组件

组件可以使用 `Image` 展示，但状态和缓存仍保持平台中立。

```swift
struct RemoteImageView<Placeholder: View>: View {
    let request: RemoteImageRequest
    let loader: RemoteImageLoader
    let placeholder: () -> Placeholder

    @State private var state: RemoteImageState = .idle

    var body: some View {
        content
            .task(id: request.cacheKey) {
                state = .loading
                state = await loader.load(request)
            }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .idle, .loading:
            placeholder()
        case .loaded(let asset):
            PlatformImage(data: asset.data)
        case .failed:
            Button("重试") {
                Task { state = await loader.load(request) }
            }
        }
    }
}
```

`PlatformImage` 放在平台适配文件中：iOS 可内部使用 `UIImage`，macOS 可内部使用 `NSImage`。调用方不直接依赖平台图片类型。

```swift
struct PlatformImage: View {
    let data: Data

    var body: some View {
        #if os(iOS) || os(tvOS) || os(visionOS)
        if let image = UIImage(data: data) {
            Image(uiImage: image).resizable()
        }
        #elseif os(macOS)
        if let image = NSImage(data: data) {
            Image(nsImage: image).resizable()
        }
        #endif
    }
}
```

### 上传 Payload

上传前处理属于媒体管线，网络层只接收稳定 payload。

```swift
struct UploadImagePayload: Sendable {
    var data: Data
    var fileName: String
    var mimeType: String
    var pixelSize: CGSize
}

protocol ImagePreparing: Sendable {
    func prepareImage(data: Data, maxPixel: Int, maxBytes: Int) async throws -> UploadImagePayload
}
```

### 图片查看器状态

查看器状态独立，不混进全局业务状态。

```swift
struct ImageViewerState: Equatable {
    var scale: CGFloat = 1
    var offset: CGSize = .zero
    var anchor: UnitPoint = .center

    mutating func reset() {
        scale = 1
        offset = .zero
        anchor = .center
    }
}
```

## 验证要求

- 远程图片：无 URL、主 URL 失败、fallback 成功、fallback 失败、重试。
- 缓存：首次下载、二次读取、磁盘文件缺失、Widget/App Group 路径。
- 上传：方向、超大图、超限大小、压缩失败、mimeType。
- 查看器：触点缩放、缩放后 pan、切图重置、缩放态禁用翻页。
