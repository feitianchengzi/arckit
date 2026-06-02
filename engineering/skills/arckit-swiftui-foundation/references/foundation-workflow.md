# SwiftUI 工程底座工作流

## 适用范围

用于新建或整理 Apple SwiftUI 客户端工程。目标是建立可迭代的最小工程底座，而不是一次性构建所有能力。

## 立项输入

开始前确认：

- App 名称、Bundle ID、组织前缀。
- 目标平台和最低系统版本。
- 是否需要独立 Swift Package。
- 是否有既定 DesignTokens 或视觉规范。
- 是否需要 SwiftData、Widget、Push、Keychain、Universal Link 等系统能力。
- 构建方式：Xcode project、workspace、SPM package。

## 创建流程

1. 创建 App 壳和 package。
2. 建立 `App/`、`Navigation/`、`Models/`、`Services/`、`Views/`、`DesignSystem/`、`Utils/`。
3. 接入最小 RootView。
4. 接入基础 DesignTokens。
5. 建立一个 service protocol + environment key 样板。
6. 建立一个 model 或 utility 测试。
7. 跑构建验证。

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `App/` | App 入口、Root、全局依赖装配 |
| `Navigation/` | 路由、导航状态、入口分发 |
| `Models/` | 领域模型、SwiftData entity、Observable state |
| `Services/` | 外部能力、API、系统 adapter、环境注入 |
| `Views/` | 页面和组件 |
| `DesignSystem/` | tokens、基础组件、主题 |
| `Utils/` | 与项目业务低耦合的工具 |

## 底座质量门

- 工程可构建。
- 目录职责能解释清楚。
- App 入口不包含业务细节。
- Service 使用协议和环境注入。
- DesignTokens 有最小入口。
- 测试 target 可运行。
- 系统能力没有提前空配，确有需求再加。

## 资产使用

- 新工程优先使用 `scripts/create-ios-app.sh`。
- 代码模式参考 `references/code-patterns.md`。
- DesignTokens 参考 `references/design-tokens.md`。
- 模板资产在 `templates/ios-app-template/`。
