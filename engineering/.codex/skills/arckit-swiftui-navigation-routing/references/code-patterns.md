# SwiftUI 导航代码模式

## Route 定义

路由使用稳定业务 id，不把临时对象、不可序列化对象或 UI 状态塞进 route。

```swift
enum AppRoute: Hashable {
    case home
    case detail(id: Item.ID)
    case settings
    case profile(id: User.ID)
}
```

## NavigationManager

```swift
import Observation
import SwiftUI

@Observable
final class NavigationManager {
    var path = NavigationPath()

    func navigate(to route: AppRoute) {
        path.append(route)
    }

    func goBack() {
        if !path.isEmpty {
            path.removeLast()
        }
    }

    func goToRoot() {
        path.removeLast(path.count)
    }
}
```

## App 注入

```swift
@main
struct MyApp: App {
    @State private var navigationManager = NavigationManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(navigationManager)
        }
    }
}
```

## NavigationStack

```swift
struct RootView: View {
    @Environment(NavigationManager.self) private var navigationManager

    var body: some View {
        @Bindable var navigationManager = navigationManager

        NavigationStack(path: $navigationManager.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .home:
                        HomeView()
                    case .detail(let id):
                        DetailView(id: id)
                    case .settings:
                        SettingsView()
                    case .profile(let id):
                        ProfileView(id: id)
                    }
                }
        }
    }
}
```

## macOS NavigationSplitView

```swift
struct MacRootView: View {
    @State private var selectedSection: Section? = .home
    @State private var selectedItem: Item.ID?

    var body: some View {
        NavigationSplitView {
            List(Section.allCases, selection: $selectedSection) { section in
                Label(section.title, systemImage: section.icon)
                    .tag(section)
            }
        } content: {
            if let selectedSection {
                ItemListView(section: selectedSection, selectedItem: $selectedItem)
            }
        } detail: {
            if let selectedItem {
                ItemDetailView(id: selectedItem)
            } else {
                ContentUnavailableView("请选择内容", systemImage: "sidebar.left")
            }
        }
    }
}
```

## 外部入口解析

Universal Link、URL Scheme、Widget、Push 都应先解析成 `AppRoute`，再交给统一导航入口。

```swift
struct RouteParser {
    func parse(url: URL) -> AppRoute? {
        guard url.pathComponents.count >= 3 else { return nil }

        if url.pathComponents[1] == "items" {
            return .detail(id: url.pathComponents[2])
        }

        return nil
    }
}
```

## 检查清单

- [ ] Route 使用稳定业务 id。
- [ ] 页面不分散持有多套导航状态。
- [ ] 外部入口先解析成统一 route。
- [ ] 链接生成和解析有 round-trip 检查。
- [ ] 冷启动、热启动、已登录/未登录路径明确。
