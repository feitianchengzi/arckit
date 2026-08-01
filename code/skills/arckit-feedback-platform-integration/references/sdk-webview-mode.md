# SDK WebView V2

使用条件：`integrationMode=sdk-webview`。本文件只描述 SDK V2 页面接入，不是原生 API 契约。

## 快速接入基线

本文件记录的是平台提供的 SDK WebView V2 版本化接入契约。常规接入读取本文件后直接实现，不需要联网重新确认以下内容：SDK 页面 URL、`configure` 字段、`openSubmit()` / `openStatus()`、未读数 API、已记录的 iframe 未读 postMessage 协议或 API Key 来源。

执行顺序：加载固定入口并等待 SDK ready，按选定认证模式调用 `configure`，打开提交反馈或“我的反馈”，最后按需接入未读角标。

不得下载、枚举或反向分析 `https://feedback.feitianchengzi.com/sdk-v2/assets/` 下的压缩 JavaScript 来重新发现本文件已经给出的协议。只有两种情况进入线上核验：

- 用户明确要求核验当前线上版本；此时优先读取平台正式、可读文档或明确 API 响应，并限制请求范围。
- 真实运行、测试或平台错误响应与本文件冲突；先记录具体冲突，再做针对该冲突的最小核验。

如果只有分析压缩静态资源才能继续，停止并向用户说明缺失契约，不自行开展逆向分析。

## 承载方式门禁

实现前先区分三种承载：

- 原生 WebView：iOS/Android 加载 SDK 页面后，可通过 `evaluateJavaScript` 在该 WebView 文档上下文调用 `window.FeedbackSDK`。
- Web 同页：只有宿主页面已通过平台支持的 loader 或现有实现取得 `window.FeedbackSDK` 时，才能直接使用本文的 Web configure 代码。当前契约没有提供 loader URL，不得自行猜测 script 地址。
- Web 跨域 iframe：父页面不能直接访问 iframe 内的 SDK global，必须读取 [Web iframe 宿主协议](web-iframe-host.md)，通过 postMessage 完成 ready、configure、open、未读、关闭和 Session 刷新。

若宿主已有与 V1 一致的同源 `/sdk` 代理，可以直接访问 iframe 的 `contentWindow.FeedbackSDK`；加载绝对地址 `https://feedback.feitianchengzi.com/sdk-v2/...` 时按跨域协议实现。不要把同源直接调用代码用于跨域 iframe。

## 固定入口与公共配置

原生 WebView 或跨域 iframe 加载页面：

```text
https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web
```

默认网关：

```text
https://api.feitianchengzi.com
```

页面和 SDK ready 后调用 `configure`，再用 `openSubmit()` 打开提交反馈、用 `openStatus()` 打开“我的反馈”。同一个反馈中心内复用页面，不因 action 切换重复加载或重复配置。

## 客户端直连模式

适用：Web、iOS、Android 快速接入，接受项目专用且可轮换的 API Key 存在于客户端。

Web 同页（前提是宿主已具备 `window.FeedbackSDK`）：

```javascript
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2AuthMode: 'apiKey',
  apiKey: runtimeConfig.apiKey,
  projectId: runtimeConfig.projectId,
  customUserId: stableUserOrInstallationId(),
  gatewayUrl: 'https://api.feitianchengzi.com',
  theme: 'system',
  feedbackV2NotificationsEnabled: runtimeConfig.notificationsEnabled,
})

window.FeedbackSDK.openSubmit()
// 我的反馈：window.FeedbackSDK.openStatus()
```

iOS `WKWebView`：

```swift
let configuration = WKWebViewConfiguration()
configuration.defaultWebpagePreferences.allowsContentJavaScript = true
let webView = WKWebView(frame: .zero, configuration: configuration)
webView.navigationDelegate = coordinator
webView.uiDelegate = coordinator
webView.load(URLRequest(url: URL(string: "https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web")!))

let config: [String: Any] = [
    "feedbackV2Enabled": true,
    "feedbackV2AuthMode": "apiKey",
    "apiKey": credentialProvider.apiKey,
    "projectId": credentialProvider.projectId,
    "customUserId": feedbackUserStore.stableUserOrInstallationId,
    "gatewayUrl": "https://api.feitianchengzi.com",
    "theme": "system",
    "feedbackV2NotificationsEnabled": notificationsEnabled,
]
let data = try JSONSerialization.data(withJSONObject: config)
let configJSON = String(data: data, encoding: .utf8) ?? "{}"
webView.evaluateJavaScript("window.FeedbackSDK?.configure(\(configJSON)); window.FeedbackSDK?.openSubmit();")
```

Android `WebView`：先用 JSON serializer 生成配置，不要把 token、Key 或用户 ID 直接拼进 JavaScript 字符串。

```kotlin
webView.settings.javaScriptEnabled = true
webView.loadUrl("https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web")

val config = JSONObject()
  .put("feedbackV2Enabled", true)
  .put("feedbackV2AuthMode", "apiKey")
  .put("apiKey", credentialProvider.apiKey)
  .put("projectId", credentialProvider.projectId)
  .put("customUserId", feedbackUserStore.stableUserOrInstallationId)
  .put("gatewayUrl", "https://api.feitianchengzi.com")
  .put("theme", "system")
  .put("feedbackV2NotificationsEnabled", notificationsEnabled)

webView.evaluateJavascript(
  "window.FeedbackSDK?.configure(${config}); window.FeedbackSDK?.openSubmit();",
  null,
)
```

## 宿主服务安全模式

适用：产品已有可信服务端。服务端保存 API Key，客户端只短期持有按当前登录用户换取的 Session token。

Web 同页（前提是宿主已具备 `window.FeedbackSDK`）：

```javascript
const { token } = await fetch('/api/feedback/session', {
  method: 'POST',
  credentials: 'include',
}).then((response) => response.json())

window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: token,
  gatewayUrl: 'https://api.feitianchengzi.com',
  theme: 'system',
  feedbackV2NotificationsEnabled: runtimeConfig.notificationsEnabled,
})
window.FeedbackSDK.openSubmit()
```

iOS 配置 payload：

```swift
let token = try await feedbackSessionProvider.fetchToken()
let config: [String: Any] = [
    "feedbackV2Enabled": true,
    "feedbackV2AuthMode": "session",
    "feedbackSessionToken": token,
    "gatewayUrl": "https://api.feitianchengzi.com",
    "theme": "system",
    "feedbackV2NotificationsEnabled": notificationsEnabled,
]
let data = try JSONSerialization.data(withJSONObject: config)
let configJSON = String(data: data, encoding: .utf8) ?? "{}"
webView.evaluateJavaScript("window.FeedbackSDK?.configure(\(configJSON)); window.FeedbackSDK?.openSubmit();")
```

Android 配置 payload：

```kotlin
val token = feedbackSessionProvider.fetchToken()
val config = JSONObject()
  .put("feedbackV2Enabled", true)
  .put("feedbackV2AuthMode", "session")
  .put("feedbackSessionToken", token)
  .put("gatewayUrl", "https://api.feitianchengzi.com")
  .put("theme", "system")
  .put("feedbackV2NotificationsEnabled", notificationsEnabled)

webView.evaluateJavascript(
  "window.FeedbackSDK?.configure(${config}); window.FeedbackSDK?.openSubmit();",
  null,
)
```

Session 配置不得同时传 `apiKey`、`projectId` 或 `customUserId`。token 只保存在内存中，不能写入 URL、日志、本地存储或持久 Cookie。

### 宿主服务换取 token

宿主服务以服务端保存的 API Key 调用：

```http
POST /workshop/v2/apikey/feedback-sessions
```

请求包含 `project_id` 与从当前服务端登录会话派生的稳定用户 ID；宿主服务把平台返回的短期 `token` 转交客户端。未获得平台的完整请求头、响应、过期和错误码契约时，先保留 adapter 边界并标记待确认，不要自行发明字段。

宿主 endpoint 必须鉴权，并从当前 session 派生用户 ID；不要信任客户端提交任意用户 ID。API Key 和 token 不得进入 URL、日志或持久化。

## 通知与入口角标

所有 SDK V2 项目都可选择在 `configure` 中加入：

```javascript
feedbackV2NotificationsEnabled: true
```

入口红点或数字由宿主 App、网站或原生导航渲染；SDK 只返回当前用户未读数。不开启不影响提交反馈或会话能力。

同页 SDK / WebView：

```javascript
const unreadCount = await window.FeedbackSDK.getUnreadCount()
renderFeedbackBadge(unreadCount) // 0 时隐藏；读取不会修改已读状态
```

跨域 iframe 不能读取 SDK 全局对象，使用精确 origin 与请求 ID 匹配异步返回：

```javascript
const sdkOrigin = 'https://feedback.feitianchengzi.com'
const requestId = crypto.randomUUID()

iframe.contentWindow?.postMessage({
  source: 'feedback-sdk-host',
  type: 'feedback-sdk:get-unread-count',
  request_id: requestId,
}, sdkOrigin)

window.addEventListener('message', (event) => {
  if (event.origin !== sdkOrigin) return
  if (event.data?.source !== 'feedback-sdk-web') return
  if (event.data?.type !== 'feedback-sdk:unread-count') return
  if (event.data?.request_id !== requestId) return
  renderFeedbackBadge(event.data.unread_count)
})
```

SDK 在状态页加载或读完会话后会主动发送 `feedback-sdk:unread-changed`。收到该事件后重新读取未读数；除非平台契约明确给出 payload，不推测事件里的 count 字段。跨域监听仍必须校验 `origin`、`source` 和 `type`。

## SDK 主动宿主事件

加载 `?embed=web` 的页面会通过 `window.parent.postMessage` 主动通知宿主。跨域 iframe 按 [Web iframe 宿主协议](web-iframe-host.md) 接收；原生 WebView 顶层加载该页面时 `window.parent === window`，需要在页面上下文监听同一组事件，并通过受限的原生 script message bridge 转交 App：

- `feedback-sdk:unread-changed`：重新调用 `getUnreadCount()`，再更新原生入口角标。
- `feedback-sdk:refresh-session`：仅 Session 模式处理；复用或启动一次进行中的 token 请求，取得新 token 后再次调用 `configure`。保留当前 action，不重新加载页面，也不把旧 token 写入日志或持久化。

原生 WebView 注入的监听器至少校验 `event.origin === window.location.origin`、`event.source === window`、`event.data.source === 'feedback-sdk-web'` 和允许的 `type`。原生 bridge 还要校验消息来自 main frame、HTTPS、固定 SDK host。配置、打开或未读调用失败后的重取可以作为有限兜底，但不能代替 `feedback-sdk:refresh-session` 主动刷新协议。

## Readiness、错误与文件输入

- WebView load finished 只表示文档加载完成。必须确认 `window.FeedbackSDK.configure/openSubmit/openStatus` 存在；开启通知时还要确认 `getUnreadCount` 存在。
- 只有 `configure` 成功后才标记已配置。SDK 未 ready 时短间隔重试，保留待打开的 action。
- 认证错误、脚本错误和诊断日志不得打印配置对象、API Key 或 token。
- iOS 图片上传属于网页 file input 链路。SwiftUI `WebPage` 实现 `WebPage.DialogPresenting.handleFileInputPrompt`；`WKWebView` 实现 `WKUIDelegate.runOpenPanel`，并返回可读文件 URL。
- Android 需要启用 WebView 的文件选择回调并验证选择结果能回传网页；不要只排查 JavaScript readiness。
- 相册、拍照和文件权限按平台声明；取消、拒绝或不可读文件必须结束回调，不能让页面一直等待。

## 验证矩阵

- 两种认证模式分别只出现各自字段；`feedbackV2Enabled` 始终为 `true`。
- 首次打开提交反馈，切换到“我的反馈”调用 `openStatus()`，切回不重复配置或重载。
- 直连模式使用数字型项目 ID 和稳定用户 ID，并明确 Key 可提取。
- Session 模式能消费 `feedback-sdk:refresh-session` 主动刷新过期 token；并发刷新复用同一请求，登出/切换账号会丢弃旧 token，客户端无 API Key 与 token 持久化。
- 通知关闭时核心反馈能力正常；开启时 0 隐藏角标，读取未读数不改变已读状态。
- iframe 消息拒绝错误 origin/source/type/request ID，且 `targetOrigin` 不使用 `*`。
