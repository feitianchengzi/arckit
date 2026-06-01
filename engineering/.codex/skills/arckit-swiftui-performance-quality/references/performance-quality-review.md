# SwiftUI 性能与质量评审

## 评审入口

遇到以下情况加载本 reference：

- 页面卡顿。
- 动画掉帧。
- 首屏慢。
- 列表滚动慢。
- 切页时卡。
- 图片加载导致内存压力。
- 异步任务重复触发。

## 渲染路径检查

View body 中不应出现：

- JSON decode。
- 大数组排序。
- 大量过滤。
- DateFormatter 创建。
- 正则解析。
- 文件 IO。
- 网络请求。
- 图片压缩。

这些应移到 display model、service、cache 或预处理任务。

## Display Model 检查

适合预处理：

- 展示文案。
- 标签排序。
- 日期格式化。
- 富字段组合。
- JSON 子结构展开。
- 多来源字段兜底。

display model 应有缓存或生命周期边界，避免每帧重建。

## Observable 粒度检查

风险信号：

- 一个 observable 包含整个页面所有状态。
- 拖拽 offset 放在全局状态。
- 每次小交互刷新整个列表。
- 子 View 读取过宽状态对象。

优化方向：

- 局部 `@State`。
- 拆小 observable。
- 传值给子组件。
- 只在提交时更新共享状态。

## 异步任务检查

- `.task(id:)` 是否稳定？
- 切换 id 时是否取消旧任务？
- 是否重复加载同一数据？
- 快速翻页是否堆叠请求？
- 错误和取消是否区分？
- 是否在 MainActor 做重计算？

## 图片和列表检查

- 列表行是否轻量？
- 图片是否有尺寸约束？
- 是否缓存？
- 是否预取过多？
- 是否同步解码大图？
- 是否有失败态避免无限 spinner？

## 验证建议

- 小改动：单元测试 + 关键流程手测。
- 列表/动画问题：录屏或 Instruments Animation Hitches。
- 主线程问题：Time Profiler。
- 内存问题：Allocations / Memory Graph。
- 异步问题：日志 trace 和任务取消检查。

## 检查清单

- body 是否轻量？
- display model 是否缓存？
- observable 粒度是否合适？
- 异步任务是否可取消？
- 列表行是否可复用且轻量？
- 图片是否限尺寸和缓存？
- 是否有回归测试或可重复验证步骤？

## 推荐代码骨架

### Display Model

把展示格式化和兜底从 body 中移出。

```swift
struct SongDisplayModel: Identifiable, Equatable, Sendable {
    var id: String
    var title: String
    var subtitle: String
    var coverURL: URL?

    init(song: Song, formatter: DateFormatter) {
        id = song.id
        let trimmedTitle = song.title.trimmingCharacters(in: .whitespacesAndNewlines)
        title = trimmedTitle.isEmpty ? "未命名" : trimmedTitle
        subtitle = formatter.string(from: song.updatedAt)
        coverURL = song.coverURL
    }
}
```

Formatter 不要在 body 每次创建：

```swift
enum DisplayFormatters {
    static let shortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}
```

### ViewState 粒度

不要把拖拽、搜索输入、网络结果、弹窗全部塞进同一个 observable。

```swift
@Observable
final class SongListStore {
    private(set) var items: [SongDisplayModel] = []
    private(set) var isLoading = false
    private(set) var error: Error?

    @MainActor
    func update(items: [Song]) {
        self.items = items.map {
            SongDisplayModel(song: $0, formatter: DisplayFormatters.shortDate)
        }
    }
}
```

局部交互状态仍放 View：

```swift
struct SongListView: View {
    @State private var store = SongListStore()
    @State private var searchText = ""
    @State private var dragOffset: CGFloat = 0

    var body: some View {
        List(store.items) { item in
            SongRow(display: item)
        }
        .searchable(text: $searchText)
    }
}
```

### 可取消任务

使用 `.task(id:)` 表达生命周期，service 内部支持取消。

```swift
struct DetailView: View {
    let id: Song.ID
    @State private var state: DetailState = .loading
    @Environment(\.songService) private var songService

    var body: some View {
        content
            .task(id: id) {
                await load()
            }
    }

    @MainActor
    private func load() async {
        state = .loading
        do {
            let song = try await songService.fetchSong(id: id)
            try Task.checkCancellation()
            state = .loaded(song)
        } catch is CancellationError {
            state = .loading
        } catch {
            state = .failed(error)
        }
    }
}
```

### body 前后对比

不推荐：

```swift
var body: some View {
    List(songs.sorted { $0.updatedAt > $1.updatedAt }) { song in
        Text(DateFormatter.localizedString(from: song.updatedAt, dateStyle: .medium, timeStyle: .none))
    }
}
```

推荐：

```swift
let displayItems: [SongDisplayModel]

var body: some View {
    List(displayItems) { item in
        SongRow(display: item)
    }
}
```

## 验证要求

- body 中搜索 `sorted(`、`filter(`、`JSONDecoder`、`DateFormatter(`、同步 `Data(contentsOf:)`。
- 快速切换详情页，旧请求应取消或结果不覆盖新页面。
- 长列表滚动无明显掉帧，图片尺寸受控。
- 动画或拖拽过程没有全局 observable 每帧更新。
- 对性能改动补最小回归：display model 单测、任务取消手测、Instruments 观察项。
