---
name: arckit-swiftui-foundation
description: Apple SwiftUI 客户端工程底座 skill。用于创建或整理 iOS/macOS/watchOS/tvOS/visionOS SwiftUI 项目、Xcode/SPM 工程结构、目录规范、App 入口、基础 DesignTokens、基础测试结构、技术栈约束、从 0 到 1 脚手架。用户提到新建 SwiftUI App、搭壳工程、项目结构、SPM、Xcode project、基础架构、工程初始化时使用。
---

# ArcKit SwiftUI Foundation

## 目标

建立或整理 Apple SwiftUI 客户端工程底座，让后续功能开发有稳定的目录、依赖、App 入口、基础设计系统、测试结构和构建验证。

## 执行流程

1. 先读取项目事实：优先查看 `arckit/spec`、`arckit/tech`、`arckit/interaction`、`arckit/visual`；没有这些文档时，从代码和用户需求中归纳最小事实。
2. 明确平台、最低系统版本、Bundle ID、包名、输出目录和是否需要 Swift Package。
3. 新建项目时直接执行脚手架命令：

```bash
bash .codex/skills/arckit-swiftui-foundation/scripts/create-ios-app.sh \
  --name MyApp \
  --package MyAppPackage \
  --bundle-id com.example.MyApp \
  --output ~/Projects
```

4. 整理或生成目录：`App/`、`Navigation/`、`Models/`、`Services/`、`Views/`、`DesignSystem/`、`Utils/`、`Tests/`。
5. 建立最小 RootView、基础 Navigation 容器、基础 DesignTokens、一个 service 注入样板和一个测试样板。
6. 识别涉及的专项 skill：状态、路由、媒体、系统能力、性能、本地数据、AI、发布观测等。
7. 完成后执行构建或依赖解析验证。

## 读取资源

- 创建/整理工程流程：`references/foundation-workflow.md`
- 基础代码模式：`references/code-patterns.md`
- DesignTokens：`references/design-tokens.md`
- 脚手架模板：`templates/ios-app-template/`
- 脚手架脚本：`scripts/create-ios-app.sh`

## 技术栈基线

| 项目 | 基线 |
| --- | --- |
| 语言 | Swift 6 或项目当前 Swift 版本 |
| UI | SwiftUI first |
| 状态 | Observation / SwiftUI state |
| 持久化 | SwiftData 优先，跟随项目约束 |
| 依赖 | Swift Package Manager 优先 |
| 并发 | Swift Concurrency |
| 测试 | Swift Testing / XCTest，跟随项目现状 |

UIKit/AppKit 不是绝对禁止；只在 SwiftUI 不覆盖或系统能力边界使用，并隔离在 adapter、representable、service 或 integration 层。

## 最低交付标准

- 工程可构建。
- App 入口、目录职责和 Package 边界清晰。
- Service 有协议或清晰可替换边界，并通过 Environment 注入。
- 基础 DesignTokens 有入口，稳定视觉值不散落硬编码。
- 至少有一个可运行测试样板。
- 已识别后续应加载的专项 skill。

## 降级/停止条件

- 如果用户只是修改既有项目中的一个局部功能，不要重排工程结构。
- 如果项目已有成熟目录和架构，沿用现有模式，不为了套模板迁移。
- 如果需要系统能力、路由、媒体、性能等专项设计，不在本 skill 中展开，切换到对应专项 skill。

## 高频组合

| 场景 | 组合 |
| --- | --- |
| 分享链接打开 App | `arckit-swiftui-navigation-routing` + `arckit-swiftui-system-integration` + `arckit-swiftui-release-observability` |
| Widget 点击进入内容 | `arckit-swiftui-system-integration` + `arckit-swiftui-local-data-lifecycle` + `arckit-swiftui-navigation-routing` |
| 图片查看、缩放、翻页 | `arckit-swiftui-media-pipeline` + `arckit-swiftui-interaction-motion` |
| 页面/动画卡顿 | `arckit-swiftui-performance-quality` + `arckit-swiftui-interaction-motion` + `arckit-swiftui-state-dataflow` |
| 头像选择和上传 | `arckit-swiftui-system-integration` + `arckit-swiftui-media-pipeline` + `arckit-swiftui-networking-api` |
| AI 生成内容 | `arckit-swiftui-ai-generation` + `arckit-swiftui-networking-api` + `arckit-swiftui-local-data-lifecycle` |
