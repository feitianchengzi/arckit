# SwiftUI App Template

ArcKit SwiftUI 工程底座模板。通常不要直接复制本目录，优先使用 skill 根目录下的脚手架脚本生成项目。

## Structure

- `{{PROJECT_NAME}}.xcodeproj/` - Xcode project file
- `{{PROJECT_NAME}}/` - Main application directory
- `{{PACKAGE_NAME}}/` - Swift Package directory

## Usage

在仓库根目录执行：

```
bash .codex/skills/arckit-swiftui-foundation/scripts/create-ios-app.sh --name HelloWorld --package HelloWorldPackage --bundle-id com.example.HelloWorld --output ios
```

## Placeholders

生成项目时会替换以下占位符：

- `{{PROJECT_NAME}}` - Project name
- `{{PACKAGE_NAME}}` - Package name (default: `{{PROJECT_NAME}}Package`)
- `{{BUNDLE_IDENTIFIER}}` - Bundle identifier
- `{{ORGANIZATION_NAME}}` - Organization name
- `{{IOS_VERSION}}` - Minimum iOS version
- `{{MACOS_VERSION}}` - Minimum macOS version
- `{{WATCHOS_VERSION}}` - Minimum watchOS version
- `{{TVOS_VERSION}}` - Minimum tvOS version
- `{{VISIONOS_VERSION}}` - Minimum visionOS version
