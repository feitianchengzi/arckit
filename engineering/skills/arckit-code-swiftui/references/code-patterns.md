# SwiftUI 代码模式参考

> 编写和审查 Swift/SwiftUI 代码时加载此文件。所有示例遵循 SKILL.md 中定义的 MV 架构和质量标准。

## 1. Struct / Class / Enum 用法

### Struct（默认选择，值语义）

```swift
struct UserProfile {
    var name: String
    var age: Int
    var email: String
    
    var displayName: String {
        name.isEmpty ? "未设置" : name
    }
    
    var isValid: Bool {
        !name.isEmpty && age > 0 && email.contains("@")
    }
}
```

### Class（仅在需要引用语义时：@Observable、@Model）

```swift
import Observation

@Observable
final class UserSession {
    var currentUser: UserProfile?
    var isAuthenticated: Bool = false
    
    // 基于自身状态的业务逻辑
    var canAccessPremium: Bool {
        isAuthenticated && currentUser?.isPremium == true
    }
}
```

### Enum（状态机、选项集、错误类型）

```swift
enum LoadingState {
    case idle
    case loading
    case loaded([Item])
    case error(Error)
}

enum UserRole {
    case admin, user, guest
}

enum DataError: Error {
    case notFound
    case invalidFormat
    case networkError(underlying: Error)
}
```

**规则**：优先 struct → 需要引用语义时 class → 有限状态集用 enum。

---

## 2. 状态管理模式

### @State — 简单 UI 状态

```swift
struct LoginView: View {
    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack {
            TextField("用户名", text: $username)
            SecureField("密码", text: $password)
            
            Button("登录") {
                Task { await login() }
            }
            .disabled(isLoading)
            
            if isLoading { ProgressView() }
        }
        .alert("错误", isPresented: $showAlert) {
            Button("确定", role: .cancel) { }
        } message: {
            if let errorMessage { Text(errorMessage) }
        }
    }
    
    private func login() async {
        isLoading = true
        defer { isLoading = false }
        // 业务逻辑...
    }
}
```

### @Observable — 复杂状态模型

当 @State 变量超过 5-6 个且相互关联时，抽取为独立状态模型。

```swift
import Observation

@Observable
final class SearchState {
    var query = ""
    var results: [Item] = []
    var isSearching = false
    var selectedCategory: Category?
    var priceRange: ClosedRange<Double> = 0...1000
    var sortOrder: SortOrder = .relevance
    var error: Error?
    
    var hasActiveFilters: Bool {
        selectedCategory != nil || priceRange != 0...1000 || sortOrder != .relevance
    }
    
    var filteredResults: [Item] {
        results.filter { item in
            if let category = selectedCategory, item.category != category { return false }
            return item.price >= priceRange.lowerBound && item.price <= priceRange.upperBound
        }
    }
}

struct SearchView: View {
    @State private var searchState = SearchState()
    @Environment(\.searchService) private var searchService
    
    var body: some View {
        VStack {
            SearchBar(text: $searchState.query)
                .onSubmit { Task { await performSearch() } }
            
            FilterOptionsView(
                selectedCategory: $searchState.selectedCategory,
                priceRange: $searchState.priceRange,
                sortOrder: $searchState.sortOrder
            )
            
            if searchState.isSearching {
                ProgressView()
            } else {
                ResultsListView(items: searchState.filteredResults)
            }
        }
    }
    
    private func performSearch() async {
        searchState.isSearching = true
        defer { searchState.isSearching = false }
        do {
            searchState.results = try await searchService.search(
                query: searchState.query,
                category: searchState.selectedCategory
            )
        } catch {
            searchState.error = error
        }
    }
}
```

### 反模式

```swift
// ❌ 状态模型依赖 Service
@Observable
final class BadViewModel {
    @Environment(\.dataService) var dataService  // ❌ 禁止
    func loadData() async { /* ❌ 状态模型不应调用 Service */ }
}

// ❌ 过多独立 @State 管理复杂关联状态
struct BadView: View {
    @State private var query = ""
    @State private var results: [Item] = []
    @State private var isSearching = false
    @State private var selectedCategory: Category?
    @State private var priceRange: ClosedRange<Double> = 0...1000
    @State private var sortOrder: SortOrder = .relevance
    @State private var error: Error?
    // ❌ 应该用 @Observable 统一管理
}
```

---

## 3. Service 层模式

完整流程：协议定义 → 实现 → EnvironmentKey → EnvironmentValues 扩展 → View 注入使用。

### 协议定义

```swift
// 数据通道
protocol DataServiceProtocol: Sendable {
    func fetch() async throws -> [Item]
    func save(_ item: Item) async throws
}

// 系统服务封装
protocol CameraServiceProtocol: Sendable {
    func capturePhoto() async throws -> UIImage
    func requestPermission() async -> Bool
}

// 复杂算法
protocol OCRServiceProtocol: Sendable {
    func recognizeText(in image: UIImage) async throws -> String
}
```

### 实现（不包含业务逻辑）

```swift
struct VisionOCRService: OCRServiceProtocol {
    func recognizeText(in image: UIImage) async throws -> String {
        // 纯技术实现，不包含业务判断
        let request = VNRecognizeTextRequest()
        let handler = VNImageRequestHandler(cgImage: image.cgImage!)
        try handler.perform([request])
        guard let observations = request.results else {
            throw OCRError.noTextFound
        }
        return observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n")
    }
}
```

### 环境注入（完整模板）

```swift
// 1. EnvironmentKey
private struct OCRServiceKey: EnvironmentKey {
    nonisolated(unsafe) static let defaultValue: any OCRServiceProtocol = VisionOCRService()
}

// 2. EnvironmentValues 扩展
extension EnvironmentValues {
    var ocrService: any OCRServiceProtocol {
        get { self[OCRServiceKey.self] }
        set { self[OCRServiceKey.self] = newValue }
    }
}

// 3. View 中注入使用
struct PhotoProcessingView: View {
    @Environment(\.ocrService) private var ocrService
    @State private var image: UIImage?
    @State private var recognizedText = ""
    @State private var isProcessing = false
    
    var body: some View {
        VStack {
            if let image { Image(uiImage: image) }
            
            Button("识别文字") {
                Task { await processImage() }
            }
            .disabled(isProcessing || image == nil)
            
            if isProcessing { ProgressView() }
            Text(recognizedText)
        }
    }
    
    // View 决定何时调用 Service，处理业务逻辑
    private func processImage() async {
        guard let image else { return }
        isProcessing = true
        defer { isProcessing = false }
        do {
            recognizedText = try await ocrService.recognizeText(in: image)
            if recognizedText.isEmpty { /* 业务逻辑在 View 处理 */ }
        } catch { /* 错误处理 */ }
    }
}
```

### 反模式

```swift
// ❌ Service 包含业务逻辑
struct BadOCRService: OCRServiceProtocol {
    func recognizeText(in image: UIImage) async throws -> String {
        let text = /* OCR 实现 */
        if text.count < 10 { return "文本太短，请重新拍摄" }  // ❌ 业务判断
        return text
    }
}
```

---

## 4. 并发模式

### async/await + @MainActor

```swift
struct ContentView: View {
    @State private var data: Data?
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack {
            if isLoading { ProgressView() }
            else if let errorMessage { Text("错误: \(errorMessage)") }
            else { Text("数据已加载") }
        }
        .task { await loadData() }  // 使用 .task 修饰符
    }
    
    @MainActor
    private func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let service = NetworkService()
            data = try await service.fetchData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

### Actor（保护共享可变状态）

```swift
actor Counter {
    private var value: Int = 0
    func increment() { value += 1 }
    func getValue() -> Int { value }
}
```

### 异步网络请求

```swift
struct NetworkService: Sendable {
    func fetchData() async throws -> Data {
        let url = URL(string: "https://api.example.com/data")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
```

### 禁止的并发方式

```swift
// ❌ NSThread.detachNewThread { ... }
// ❌ self.perform(#selector(loadData), on: thread, with: nil, waitUntilDone: false)
// ❌ DispatchQueue.main.async { ... }
// ❌ let queue = DispatchQueue(label: "..."); queue.async { ... }
// 除非与现有 OC 代码交互，否则一律使用 Swift Concurrency
```

---

## 5. 文件组织模式

### 一个文件一个 View + Preview

```swift
// ManualListView.swift — 只包含此 View
import SwiftUI
import SwiftData

struct ManualListView: View {
    @Query private var manuals: [Manual]
    
    var body: some View {
        List(manuals) { manual in
            ManualListItemView(manual: manual)
        }
    }
}

#Preview {
    ManualListView()
        .modelContainer(for: Manual.self, inMemory: true)
}
```

### 子视图独立文件

```swift
// ManualListItemView.swift — 独立组件
import SwiftUI

struct ManualListItemView: View {
    let manual: Manual
    
    var body: some View {
        HStack {
            Text(manual.title)
            Spacer()
        }
    }
}

#Preview {
    ManualListItemView(manual: Manual(title: "示例手册"))
}
```

### 反模式

```swift
// ❌ 同一文件多个 View
struct ManualListView: View { ... }
struct ManualDetailView: View { ... }  // ❌ 应放独立文件
struct ManualEditView: View { ... }    // ❌ 应放独立文件
```

---

## 6. 协议与泛型模式

### 协议用于 Service 接口

```swift
protocol StorageServiceProtocol: Sendable {
    func save(_ data: Data, key: String) async throws
    func load(key: String) async throws -> Data?
}

struct FileStorageService: StorageServiceProtocol {
    func save(_ data: Data, key: String) async throws { /* 实现 */ }
    func load(key: String) async throws -> Data? { nil }
}

private struct StorageServiceKey: EnvironmentKey {
    nonisolated(unsafe) static let defaultValue: any StorageServiceProtocol = FileStorageService()
}

extension EnvironmentValues {
    var storageService: any StorageServiceProtocol {
        get { self[StorageServiceKey.self] }
        set { self[StorageServiceKey.self] = newValue }
    }
}
```

### 泛型提高复用性

```swift
struct Repository<T: Identifiable> {
    private var items: [T] = []
    mutating func add(_ item: T) { items.append(item) }
    func find(id: T.ID) -> T? { items.first { $0.id == id } }
}

protocol Cacheable {
    associatedtype Key: Hashable
    var cacheKey: Key { get }
}
```

### 反模式

```swift
// ❌ 不必要的协议抽象
protocol StringConvertible {
    func toString() -> String
}
extension String: StringConvertible {
    func toString() -> String { self }  // ❌ 过度抽象
}
```

---

## 7. 综合示例

一个完整的 View 文件，展示所有规范的综合应用。

```swift
// ManualDetailView.swift
import SwiftUI
import SwiftData

struct ManualDetailView: View {
    // 持久化数据
    @Query private var manuals: [Manual]
    @Environment(\.modelContext) private var modelContext
    
    // 业务数据（独立 Model）
    @State private var viewModel = ManualDetailState()
    
    // Service 环境注入
    @Environment(\.ocrService) private var ocrService
    
    // 简单 UI 状态
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    let manual: Manual
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 子 View 拆分：接收数据，不直接访问 Service
                ManualHeaderView(manual: manual)
                ManualContentView(manual: manual, state: viewModel)
                
                if isLoading { ProgressView() }
                if let errorMessage {
                    Text("错误: \(errorMessage)")
                        .foregroundStyle(DesignTokens.Colors.error)
                }
            }
            .padding()
        }
        .task { await loadDetails() }
    }
    
    @MainActor
    private func loadDetails() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await ocrService.recognizeText(in: manual.coverImage)
            viewModel.update(with: result)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Manual.schema, configurations: config)
    let manual = Manual(title: "示例手册")
    container.mainContext.insert(manual)
    
    return ManualDetailView(manual: manual)
        .modelContainer(container)
}
```

---

## 8. 导航管理模式

集中式 `NavigationManager`，所有路由统一维护。

### iOS — NavigationStack + NavigationPath

```swift
// Navigation/AppRoute.swift
enum AppRoute: Hashable {
    case home
    case detail(Item)
    case settings
    case profile(User)
}

// Navigation/NavigationManager.swift
import Observation

@Observable
final class NavigationManager {
    var path = NavigationPath()
    
    func navigate(to route: AppRoute) {
        path.append(route)
    }
    
    func goBack() {
        if !path.isEmpty { path.removeLast() }
    }
    
    func goToRoot() {
        path.removeLast(path.count)
    }
}

// App 根节点注入
@main
struct MyApp: App {
    @State private var navigationManager = NavigationManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(navigationManager)
        }
    }
}

// View 中使用
struct ContentView: View {
    @Environment(NavigationManager.self) private var navManager
    
    var body: some View {
        @Bindable var navManager = navManager
        NavigationStack(path: $navManager.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .home:        HomeView()
                    case .detail(let item):  DetailView(item: item)
                    case .settings:    SettingsView()
                    case .profile(let user): ProfileView(user: user)
                    }
                }
        }
    }
}
```

### macOS — NavigationSplitView（3 列布局）

```swift
struct MacContentView: View {
    @State private var selectedSection: Section? = .home
    @State private var selectedItem: Item?
    
    var body: some View {
        NavigationSplitView {
            // 侧边栏
            List(Section.allCases, selection: $selectedSection) { section in
                Label(section.title, systemImage: section.icon)
                    .tag(section)
            }
            .navigationTitle("导航")
        } content: {
            // 内容列表
            if let selectedSection {
                ItemListView(section: selectedSection, selectedItem: $selectedItem)
            }
        } detail: {
            // 详情面板
            if let selectedItem {
                ItemDetailView(item: selectedItem)
            } else {
                Text("选择一项查看详情")
                    .foregroundStyle(.secondary)
            }
        }
    }
}
```

---

## 代码生成检查清单

生成或审查 iOS 代码时，逐项验证：

### 类型选择
- [ ] 优先使用 struct，仅在需要引用语义时用 class
- [ ] 使用 enum 表示状态机、选项集、错误类型

### 状态管理
- [ ] 简单 UI 状态用 @State
- [ ] 复杂关联状态用 @Observable 状态模型
- [ ] 状态模型不依赖 Service 或其他 Model

### Service 层
- [ ] Service 通过协议抽象 + 环境注入
- [ ] Service 不包含业务逻辑判断
- [ ] View 决定何时调用 Service

### 并发
- [ ] UI 更新用 @MainActor
- [ ] 异步操作用 async/await
- [ ] 使用 .task 修饰符触发异步加载
- [ ] 未使用 NSThread / DispatchQueue / GCD

### 文件组织
- [ ] 每个文件只含一个 View + #Preview
- [ ] 子视图放独立文件

### 协议与泛型
- [ ] 协议用于 Service 接口和依赖注入
- [ ] 无过度抽象

### 架构合规
- [ ] Model 独立（不依赖 Service / 其他 Model）
- [ ] View 是协调者（持有数据、访问 Service、组合逻辑）
- [ ] 子 View 不直接访问 Service / @Query / modelContext
- [ ] View 拆分合理（有明确动机，未过度拆分）

### 设计系统
- [ ] 颜色通过 DesignTokens.Colors 访问（来自 Asset Catalog）
- [ ] 无硬编码色值（Color(hex:) / Color(red:green:blue:)）
- [ ] 使用 DesignTokens.Typography / Spacing / CornerRadius

### 可访问性
- [ ] 支持 VoiceOver
- [ ] 支持 Dynamic Type

### 国际化
- [ ] 无硬编码用户可见文本
- [ ] 使用 LocalizedStringKey / .strings
- [ ] 支持中文和英文
