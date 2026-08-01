# iOS SwiftUI 落地

使用条件：目标项目是 iOS SwiftUI App。

## 默认形态

- 在 `Profile`、`Settings` 或同类用户中心页面默认只增加一个“反馈中心”入口；反馈中心内部用 segmented control、tabs 或同等导航切换“用户反馈”和“我的反馈”。
- 接入方案由参数 UI 的 `integrationMode` 决定：`sdk-webview` 使用 SDK V2 页面，并继续按 `sdkAuthMode=apiKey|session` 配置；`native-api` 使用独立的原生 SwiftUI 表单和列表，不能自动继承 SDK V2 契约。iOS 26+ SwiftUI 项目优先尝试 `WebView/WebPage`，只有项目最低版本、平台能力、SDK 行为或验证结果不满足时才降级到 `WKWebView` wrapper。
- 用独立 Feature 或 Platform Adapter 承载反馈实现，不要把 WebKit delegate、JavaScript 拼接或 URLRequest 直接堆进 Profile 页面。
- 新增 `FeedbackPlatformCredentialProviding` 或同等 provider 边界，让 UI 不直接知道凭证来源。
- 只有用户明确要求分开、平台限制无法合并、或既有导航规范强制分开时，才在用户中心拆成两个独立入口；拆分时必须说明原因。

## SDK WebView

- 优先选择承载层：
  - iOS 26+ 且项目已使用 SwiftUI `WebView/WebPage` 时，优先用 `WebView(page)`，但必须自定义 `WebPage.Configuration` 和 `WebPage.DialogPresenting`。
  - 如果项目最低版本低于 iOS 26、需要完整 `WKUIDelegate`/`WKNavigationDelegate` 可控性、或 SwiftUI `WebPage` 验证无法覆盖 SDK 行为，再使用独立 `WKWebView` wrapper。
- 页面可用后注入配置并调用 `openSubmit()` 或 `openStatus()`；`webView(_:didFinish:)` 只能作为开始 readiness 检查的信号，不能直接等同于 SDK 可用。
- 注入配置前，必须通过 `evaluateJavaScript` 或等价机制确认 `window.FeedbackSDK.configure`、`window.FeedbackSDK.openSubmit`、`window.FeedbackSDK.openStatus` 都是 function。SDK 未 ready 时短间隔重试；只有 `configure` 调用成功后才把 coordinator/store 标记为已配置。
- 如果 `configure` 或 open 调用失败，错误态和日志不得包含 API Key；保留当前选择的 action，待 SDK ready 后继续打开对应 `openSubmit()` 或 `openStatus()`。
- 默认在同一个反馈中心页面内复用 WebView；切换“用户反馈 / 我的反馈”时分别调用 `openSubmit()` / `openStatus()`，不要无必要地重新加载 SDK 页面。
- JavaScript 注入和错误日志都不得输出完整 API Key。
- 加载地址必须是 `https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web`，并显式设置 `feedbackV2Enabled: true`。
- `apiKey` 模式注入 API Key、数字型 `projectId` 和稳定 `customUserId`；`session` 模式只注入短期 `feedbackSessionToken`，不得同时注入前三者。
- Session token 由 `FeedbackSessionProviding` 或同等 adapter 从宿主服务获取，只驻留内存；登出、切换账号和过期时丢弃并重取。
- Session 模式必须消费 SDK 的 `feedback-sdk:refresh-session` 主动事件：合并并发刷新，重新取 token 后只再次 `configure`，不因刷新重载页面或丢失当前 action。等待 `configure`、open 或未读调用报错后才重取 token 只能作为有限兜底。
- 开启通知后，由原生入口渲染角标；通过 `evaluateJavaScript("window.FeedbackSDK.getUnreadCount()")` 读取不会改变已读状态的数量，0 时隐藏。
- 顶层 WebView 加载 `?embed=web` 时，SDK 的 `window.parent.postMessage` 会回到当前页面。用 document-start user script 监听 `feedback-sdk:unread-changed` 与 `feedback-sdk:refresh-session`，校验当前文档 origin、`event.source === window`、SDK source/type 后再转给原生 bridge；原生 handler 继续校验 main frame、HTTPS 和固定 SDK host。

### SwiftUI WebView/WebPage 承载

使用条件：iOS 26+ SwiftUI 项目，且用户没有明确要求 `WKWebView` wrapper。

必须生成的结构：

- `FeedbackWebView` 或同等独立 View 持有 `WebPage`，外层继续使用 `WebView(page)`。
- `WebPage` 必须通过 `WebPage(configuration:dialogPresenter:)` 创建，不要只写 `WebPage()`。
- `WebPage.Configuration.defaultNavigationPreferences.allowsContentJavaScript = true`。
- Debug 构建中设置 `page.isInspectable = true`。
- 保留 SDK 初始化逻辑：加载 `https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web`，ready 后调用 `FeedbackSDK.configure(payload)`，再调用当前 action 对应的 `openSubmit()` 或 `openStatus()`。
- mode 切换时复用同一个 `page`，只调用 `openSubmit()` / `openStatus()`，不要重建页面。

图片上传/文件输入必须接入：

- 实现 `WebPage.DialogPresenting.handleFileInputPrompt(parameters:initiatedBy:)`。
- 该方法必须最终返回 `.selected([URL])` 或 `.cancel`。
- 如果用户从照片图库选图得到的是 `Data` 或 `PhotosPickerItem`/`PHPickerResult`，先写入 app 临时目录，再把临时文件 URL 返回给 WebKit。
- 如果提供“文件”入口，返回 `fileImporter`/`UIDocumentPicker` 得到的可读 URL。
- 如果提供“拍照”入口，通常需要 UIKit `UIImagePickerController` 或 AVFoundation；如果用户要求不用 UIKit，则只生成相册/文件版本并明确不支持拍照。
- 弹窗取消、权限拒绝、没有可读文件、临时文件写入失败时返回 `.cancel`，不要悬挂 continuation 或让网页一直等待。

SwiftUI-first 取舍：

- 可以不用 `WKWebView` 也能支持图片上传；关键是 `WebPage.DialogPresenting.handleFileInputPrompt`。
- 完全不用 UIKit 时，优先组合 SwiftUI `PhotosPicker`、`.fileImporter` 和 `.confirmationDialog`，但拍照能力通常不能覆盖。
- 如需“相册 + 拍照 + 文件”完整入口，允许在 SwiftUI `WebView` 承载下使用 UIKit bridge 呈现 `PHPickerViewController`、`UIImagePickerController` 或 `UIDocumentPickerViewController`；这不等于切回 `WKWebView`。

Info.plist 必须同步：

- 相册选择：`NSPhotoLibraryUsageDescription`。
- 拍照：`NSCameraUsageDescription`，文案必须覆盖“拍摄图片用于提交反馈”，不能只写扫码。

### WKWebView wrapper 承载

使用条件：项目不能用 iOS 26 `WebPage`，或 SwiftUI `WebPage` 验证无法满足 SDK 行为。

- 用 `UIViewRepresentable` 包装底层 `WKWebView`。
- 设置 `navigationDelegate`、`uiDelegate`。
- 设置 `configuration.defaultWebpagePreferences.allowsContentJavaScript = true` 或等价 WebKit 配置。
- Debug 构建中设置 `webView.isInspectable = true`。
- 保留 SDK 初始化和 mode 切换逻辑。
- 用受限的 `WKScriptMessageHandler` 接收上面的未读变化和 Session 主动刷新事件；销毁 WebView 时移除 handler 并取消进行中的 token 请求。
- 对图片上传实现或确认 `WKUIDelegate.webView(_:runOpenPanelWith:initiatedByFrame:completionHandler:)`，并返回可读文件 URL。

## 原生 API

- 原生 API 是独立方案。只按 [原生 API 模式](native-api-mode.md) 中已确认的版本实现；平台未给出 V2 对应原生契约时，不推测 endpoint、Session 或未读接口。
- 用独立 service/client 承载 URLRequest、Authorization、Codable 模型和分页。
- 提交表单和“我的反馈”列表作为同一个反馈中心内的两个 action/view，使用 ViewModel 管理加载、提交中、成功、失败、空态和重试。
- `data` 字段按 JSON string 处理，解析失败保留原文。

## Xcode 项目

- 如果项目使用 Xcode 文件系统同步 root group，可以直接新增 Swift 文件。
- 如果是传统 `.pbxproj` 文件引用，必须同步 target membership。

## 凭证与用户 ID

- SDK `apiKey` 模式下，用户明确允许源码静态配置且已提供真实参数时，把 `Project ID` 和 `API Key` 集中放在一个专用配置文件，并在注释中标明客户端可提取、生产如需升级请迁移到宿主服务 Session。
- SDK `session` 模式下，客户端不保存 API Key、Project ID 或 customUserId 配置 payload；服务端从已认证会话派生稳定用户 ID 并换取 token。
- 参数未提供时停止请求参数，不要写默认启用的占位静态配置。
- 用户未选择源码静态配置时，不要把 API Key 放进 `Info.plist`、`.xcconfig`、Build Settings、源码常量或任何会进入安装包的资源；使用 secret store、本地忽略配置或后端运行时配置。
- 有登录用户时使用业务用户 ID；无登录用户时生成 `guest-<UUID>` 并优先持久化到 Keychain。
