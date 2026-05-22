# 设计令牌（Design Tokens）参考

> 设置设计系统、处理颜色/字体/间距时加载此文件。核心规则：所有设计值必须通过 DesignTokens 访问，颜色必须来自 Asset Catalog。

## 核心规则

- 所有语义颜色必须在 Asset Catalog 中定义
- 颜色访问格式：`Color("ColorName", bundle: .module)`
- **禁止**在 DesignTokens 中直接使用色值（`Color(hex:)` / `Color(red:green:blue:)`）
- **例外**：系统颜色可直接引用（`Color.blue` 等）
- 所有设计值必须通过 `DesignTokens.*` 访问

## DesignTokens 完整代码

```swift
// DesignTokens.swift
import SwiftUI

enum DesignTokens {
    
    // MARK: - Colors（全部来自 Asset Catalog）
    enum Colors {
        // 主色调
        static let primary = Color("Primary", bundle: .module)
        static let primaryVariant = Color("PrimaryVariant", bundle: .module)
        
        // 辅助色
        static let secondary = Color("Secondary", bundle: .module)
        static let secondaryVariant = Color("SecondaryVariant", bundle: .module)
        
        // 背景色
        static let background = Color("Background", bundle: .module)
        static let surface = Color("Surface", bundle: .module)
        
        // 文本色
        static let textPrimary = Color("TextPrimary", bundle: .module)
        static let textSecondary = Color("TextSecondary", bundle: .module)
        static let textDisabled = Color("TextDisabled", bundle: .module)
        
        // 状态色
        static let error = Color("Error", bundle: .module)
        static let success = Color("Success", bundle: .module)
        static let warning = Color("Warning", bundle: .module)
        static let info = Color("Info", bundle: .module)
        
        // 系统颜色（例外：可直接引用）
        static let systemBlue = Color.blue
        static let systemRed = Color.red
        static let systemGreen = Color.green
        static let systemOrange = Color.orange
        static let systemGray = Color.gray
    }
    
    // MARK: - Typography
    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold)
        static let title1 = Font.system(size: 28, weight: .bold)
        static let title2 = Font.system(size: 22, weight: .bold)
        static let title3 = Font.system(size: 20, weight: .semibold)
        static let headline = Font.system(size: 17, weight: .semibold)
        static let body = Font.system(size: 17, weight: .regular)
        static let callout = Font.system(size: 16, weight: .regular)
        static let subheadline = Font.system(size: 15, weight: .regular)
        static let footnote = Font.system(size: 13, weight: .regular)
        static let caption1 = Font.system(size: 12, weight: .regular)
        static let caption2 = Font.system(size: 11, weight: .regular)
    }
    
    // MARK: - Spacing
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    enum CornerRadius {
        static let sm: CGFloat = 4
        static let md: CGFloat = 8
        static let lg: CGFloat = 12
        static let xl: CGFloat = 16
    }
}
```

## Asset Catalog 目录结构

```
Resources/
└── {PackageName}Assets.xcassets/
    ├── Contents.json
    └── Colors/
        ├── Primary.colorset/
        │   └── Contents.json
        ├── PrimaryVariant.colorset/
        │   └── Contents.json
        ├── Secondary.colorset/
        │   └── Contents.json
        ├── SecondaryVariant.colorset/
        │   └── Contents.json
        ├── Background.colorset/
        │   └── Contents.json
        ├── Surface.colorset/
        │   └── Contents.json
        ├── TextPrimary.colorset/
        │   └── Contents.json
        ├── TextSecondary.colorset/
        │   └── Contents.json
        ├── TextDisabled.colorset/
        │   └── Contents.json
        ├── Error.colorset/
        │   └── Contents.json
        ├── Success.colorset/
        │   └── Contents.json
        ├── Warning.colorset/
        │   └── Contents.json
        └── Info.colorset/
            └── Contents.json
```

## Colorset 配置模板

每个 `.colorset/Contents.json` 必须同时配置 Light 和 Dark 模式：

```json
{
  "colors": [
    {
      "color": {
        "color-space": "srgb",
        "components": {
          "alpha": "1.000",
          "blue": "0.800",
          "green": "0.400",
          "red": "0.200"
        }
      },
      "idiom": "universal"
    },
    {
      "appearances": [
        {
          "appearance": "luminosity",
          "value": "dark"
        }
      ],
      "color": {
        "color-space": "srgb",
        "components": {
          "alpha": "1.000",
          "blue": "0.900",
          "green": "0.500",
          "red": "0.300"
        }
      },
      "idiom": "universal"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
```

**要点**：第一个 `color` 对象为 Light 模式（无 appearances），第二个为 Dark 模式（`luminosity: dark`）。

## View 中使用设计令牌

```swift
struct LoginView: View {
    var body: some View {
        VStack(spacing: DesignTokens.Spacing.md) {
            Text("欢迎登录")
                .foregroundStyle(DesignTokens.Colors.textPrimary)
                .font(DesignTokens.Typography.headline)
            
            Button("登录") { /* ... */ }
                .foregroundStyle(DesignTokens.Colors.primary)
                .padding(DesignTokens.Spacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.md)
                        .fill(DesignTokens.Colors.surface)
                )
        }
        .padding(DesignTokens.Spacing.lg)
        .background(DesignTokens.Colors.background)
    }
}
```

## 反模式

```swift
// ❌ 在 DesignTokens 中使用十六进制色值
static let primary = Color(hex: "#3498db")

// ❌ 在 DesignTokens 中使用 RGB 构造器
static let secondary = Color(red: 0.5, green: 0.5, blue: 0.5)

// ❌ 在 View 中直接使用色值（绕过 DesignTokens）
Text("错误示例")
    .foregroundStyle(Color(hex: "#FF0000"))

// ❌ 在 View 中硬编码间距
VStack(spacing: 16) { ... }  // 应使用 DesignTokens.Spacing.md

// ❌ 在 View 中硬编码字体
Text("标题").font(.system(size: 22, weight: .bold))  // 应使用 DesignTokens.Typography.title2
```

## 设计令牌扩展指南

如需添加新的设计值：

1. **颜色**：在 Asset Catalog 中创建 `.colorset`（含 Light/Dark） → 在 `DesignTokens.Colors` 中添加 `Color("Name", bundle: .module)`
2. **字体**：在 `DesignTokens.Typography` 中添加静态属性
3. **间距/圆角**：在对应枚举中添加静态属性
4. **新类别**：在 `DesignTokens` 中添加新枚举（如 `Shadows`、`Borders`）
