# SwiftUI 状态与 Service 代码模式

## 状态选择

```text
持久化领域数据 -> @Model + @Query
简单 UI 状态 -> @State
父子双向编辑 -> @Binding
复杂关联状态 -> @Observable class
外部能力 -> Service protocol + @Environment
```

## @State：简单 UI 状态

```swift
struct LoginView: View {
    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack {
            TextField("用户名", text: $username)
            SecureField("密码", text: $password)

            Button("登录") {
                Task { await login() }
            }
            .disabled(isLoading)

            if isLoading {
                ProgressView()
            }

            if let errorMessage {
                Text(errorMessage)
            }
        }
    }

    @MainActor
    private func login() async {
        isLoading = true
        defer { isLoading = false }
        // View 协调用户操作、Service 调用和 UI 状态。
    }
}
```

## @Observable：复杂关联状态

当多个 `@State` 变量互相关联，且 View 中状态转换开始难以阅读时，抽成独立状态对象。状态对象表达自身状态和计算属性，不访问 Service。

```swift
import Observation

@Observable
final class SearchState {
    var query = ""
    var results: [Item] = []
    var isSearching = false
    var selectedCategory: Category?
    var error: Error?

    var hasResults: Bool {
        !results.isEmpty
    }
}

struct SearchView: View {
    @State private var state = SearchState()
    @Environment(\.searchService) private var searchService

    var body: some View {
        VStack {
            SearchBar(text: $state.query)
                .onSubmit {
                    Task { await search() }
                }

            ResultsListView(items: state.results)
        }
    }

    @MainActor
    private func search() async {
        state.isSearching = true
        defer { state.isSearching = false }

        do {
            state.results = try await searchService.search(query: state.query)
        } catch {
            state.error = error
        }
    }
}
```

## Service 协议与 Environment 注入

Service 表达外部能力或技术通道。接口使用稳定数据类型，不泄漏 `UIImage`、`UIViewController`、SwiftUI `View`、`Color` 等 UI 类型。

```swift
protocol OCRServiceProtocol: Sendable {
    func recognizeText(in imageData: Data) async throws -> String
}

struct VisionOCRService: OCRServiceProtocol {
    func recognizeText(in imageData: Data) async throws -> String {
        // 纯技术实现，不包含产品判断。
        try await performOCR(imageData)
    }
}

private struct OCRServiceKey: EnvironmentKey {
    nonisolated(unsafe) static let defaultValue: any OCRServiceProtocol = VisionOCRService()
}

extension EnvironmentValues {
    var ocrService: any OCRServiceProtocol {
        get { self[OCRServiceKey.self] }
        set { self[OCRServiceKey.self] = newValue }
    }
}
```

## 反模式

```swift
@Observable
final class BadViewModel {
    @Environment(\.dataService) var dataService

    func load() async {
        // 状态模型不应直接依赖 Environment 或 Service。
    }
}

protocol BadUploadService: Sendable {
    func upload(image: UIImage) async throws
}
```

## 检查清单

- [ ] 简单 UI 状态留在 View。
- [ ] 复杂关联状态才抽 `@Observable`。
- [ ] 状态模型不依赖 Service、Environment、其他 Model。
- [ ] View 负责协调 Service 调用和业务组合。
- [ ] Service 使用 protocol + Environment 注入。
- [ ] Service 接口不泄漏 SwiftUI/UIKit/AppKit 类型。
