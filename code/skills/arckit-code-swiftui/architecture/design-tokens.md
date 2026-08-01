# Design Tokens

## 默认规则

稳定视觉值必须通过 `DesignTokens` 或项目既有设计系统访问。颜色默认来自 Asset Catalog 的语义 colorset；系统色可直接引用；临时调试色不能进入长期代码。

```swift
enum DesignTokens {
    enum Colors {
        static let background = Color("Background")
        static let surface = Color("Surface")
        static let textPrimary = Color("TextPrimary")
        static let textSecondary = Color("TextSecondary")
        static let accent = Color.accentColor
        static let error = Color("Error")
    }
}
```

不要在 View 中散落 `Color(red:green:blue:)`、hex、硬编码字号、间距和圆角。新 token 先补 Asset Catalog 或项目设计系统入口，再在 View 中使用。

## View 使用

```swift
Text(item.title)
    .font(DesignTokens.Typography.body)
    .foregroundStyle(DesignTokens.Colors.textPrimary)
    .padding(DesignTokens.Spacing.md)
```

已有项目若使用 SwiftGen、R.swift、品牌 SDK 或自有 Theme，沿用现有入口，但保持同样原则：View 不直接持有散落视觉常量。
