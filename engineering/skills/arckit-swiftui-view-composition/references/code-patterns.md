# SwiftUI View 组织代码模式

## 一个文件一个主 View

```swift
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

## 子 View 接收数据和回调

子 View 做展示和局部交互，不直接访问页面级 Service、`@Query` 或 `modelContext`。

```swift
struct ManualListItemView: View {
    let manual: Manual
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(manual.title)
                Spacer()
            }
        }
    }
}
```

## 父 View 协调数据和业务

```swift
struct ManualListView: View {
    @Query private var manuals: [Manual]
    @Environment(\.manualService) private var manualService
    @State private var selectedManual: Manual?

    var body: some View {
        List(manuals) { manual in
            ManualListItemView(manual: manual) {
                selectedManual = manual
            }
        }
    }
}
```

## 状态矩阵

页面至少考虑真实产品状态：

```swift
enum ContentState<Value> {
    case loading
    case empty
    case loaded(Value)
    case failed(Error)
}
```

页面落地时要覆盖 loading、empty、error、success；涉及网络、图片、AI 生成或本地数据时补 retry/recover。

## DesignTokens 使用

```swift
Text(manual.title)
    .font(DesignTokens.Typography.title)
    .foregroundStyle(DesignTokens.Colors.primaryText)
    .padding(DesignTokens.Spacing.md)
```

不要在页面中散落硬编码色值、字号、圆角和间距。已有项目的 token 命名优先于示例命名。

## 反模式

```swift
struct ManualListView: View { ... }
struct ManualDetailView: View { ... }
struct ManualEditView: View { ... }
```

```swift
struct ManualRowView: View {
    @Environment(\.manualService) private var manualService
    @Query private var manuals: [Manual]
}
```

## 检查清单

- [ ] View 拆分有明确视觉、功能或复用边界。
- [ ] 子 View 输入清楚，通过闭包回传事件。
- [ ] 子 View 不直接访问页面级 Service、`@Query`、`modelContext`。
- [ ] 页面覆盖 loading/empty/error/success。
- [ ] 有关键 Preview。
- [ ] 使用 DesignTokens，支持 Dynamic Type、VoiceOver 和多语言文本长度。
