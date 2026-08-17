# Feedback SDK 接入 API（V1 / V2）

本文档说明移动端 WebView 如何以函数方式接入反馈组件。

## 1. 页面路由

- 提交页：`/submit`
- 状态页：`/status`

生产接入不再支持通过 URL 参数传入 `api_key` 或 `project_id`。

## 控制台 iframe 接入

反馈平台控制台的 V2 通过 iframe 打开 `/sdk-v2/index.html?embed=web`，SDK 加载后会向父页面发送 `feedback-sdk:ready`，父页面再以 `postMessage` 发送配置。现有待办 Web 与 iOS 继续使用稳定的 `/sdk`，不受 V2 影响：

```ts
iframe.contentWindow?.postMessage({
  source: 'feedback-sdk-host',
  type: 'feedback-sdk:configure',
  config: { apiKey, projectId, customUserId, theme },
}, sdkOrigin)
```

打开页面时，再发送路由命令：

```ts
iframe.contentWindow?.postMessage({
  source: 'feedback-sdk-host',
  type: 'feedback-sdk:open',
  mode: 'submit', // 或 'status'
}, sdkOrigin)
```

SDK 在生产环境只接受来自同源父页面的消息，以及本机开发来源（`localhost` / `127.0.0.1`，任意端口）；如需明确限制来源，可设置 `VITE_SDK_PARENT_ORIGINS`（逗号分隔）或兼容旧配置的 `VITE_SDK_PARENT_ORIGIN`。

`feedback-console-web` 是兼容保留的旧 `source` 值；新的接入应使用 `feedback-sdk-host`。

V2 的嵌入页会自行渲染全屏遮罩、反馈卡片和关闭按钮。接入方只需承载一个全屏透明 iframe、发送配置及打开命令；不应提供容器、尺寸、关闭按钮、遮罩样式或跨 iframe 读取 SDK DOM。SDK 通过 `feedback-sdk:close` 通知接入方隐藏 iframe。

## 2. 全局桥接对象

组件启动后会挂载 `window.FeedbackSDK`：

- `configure(config)`
- `openSubmit()`
- `openStatus()`
- `getUnreadCount()`
- `getConfig()`
- `setTheme(theme)`
- `getTheme()`
- `useSystemTheme()`

配置结构：

```ts
type FeedbackSDKConfig = {
  apiKey?: string
  projectId?: number
  customUserId?: string
  gatewayUrl?: string
  feedbackV2Enabled?: boolean
  feedbackV2NotificationsEnabled?: boolean
  feedbackV2AuthMode?: 'session' | 'apiKey'
  feedbackSessionToken?: string
  theme?: 'light' | 'dark' | 'system'
}
```

## 3. 推荐接入流程（移动端）

1. WebView 加载完成后调用 `window.FeedbackSDK.configure(...)`
2. 调用 `window.FeedbackSDK.openSubmit()` 或 `window.FeedbackSDK.openStatus()`

示例：

```js
window.FeedbackSDK.configure({
  apiKey: 'ak_xxx',
  projectId: 81,
  customUserId: 'user_123',
  theme: 'system',
})

window.FeedbackSDK.openSubmit()
```

### V2 鉴权模式

V2 对所有客户端统一支持两种显式模式。两种模式的提交反馈、状态查询、消息会话和附件能力相同。

安全模式由宿主服务保存 API Key 并短期注入 token：

```js
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2NotificationsEnabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: 'fbs_<short-lived-token>',
  gatewayUrl: 'https://api.feitianchengzi.com',
})
```

`feedbackV2NotificationsEnabled` 默认为关闭。开启后，SDK 会读取 V2 未读通知，并在打开某条反馈会话后只标记该条反馈的通知为已读；不开启则不会新增任何通知 API 请求。

### 未读数与入口角标

角标由接入方的原生或网页入口展示，SDK 只提供未读数。读取操作不会修改已读状态：

```js
const unreadCount = await window.FeedbackSDK.getUnreadCount()
// unreadCount > 0 时由宿主展示红点或数量
```

跨域 iframe 无法直接访问 `contentWindow`，可用下列请求/响应协议；`request_id` 由接入方生成并用于匹配响应：

```js
iframe.contentWindow?.postMessage({
  source: 'feedback-sdk-host',
  type: 'feedback-sdk:get-unread-count',
  request_id: 'unread-001',
}, sdkOrigin)

window.addEventListener('message', (event) => {
  if (event.origin !== sdkOrigin) return
  if (event.data?.source !== 'feedback-sdk-web') return
  if (event.data?.type !== 'feedback-sdk:unread-count') return
  if (event.data?.request_id !== 'unread-001') return
  renderFeedbackBadge(event.data.unread_count)
})
```

SDK 在状态页加载、前台恢复和用户读完某条会话后，也会主动发送 `feedback-sdk:unread-changed` 与 `unread_count`，接入方可据此刷新入口角标。

直连模式保留 V1 的简单配置方式，SDK 直接走 `/workshop/v2/apikey/*`。API Key 会存在于客户端，接入方必须明确接受泄露和滥用风险：

```js
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2NotificationsEnabled: true,
  feedbackV2AuthMode: 'apiKey',
  apiKey: 'ak_xxx',
  projectId: 81,
  customUserId: 'stable-high-entropy-install-or-user-id',
  gatewayUrl: 'https://api.feitianchengzi.com',
})
```

直连模式的 `customUserId` 应是稳定且不可猜测的 ID；无登录系统时请在客户端首次启动生成 UUID 并持久化，不能使用手机号、邮箱或递增账号编号。

深色模式：

```js
// 初始化时指定
window.FeedbackSDK.configure({ theme: 'dark' })

// 运行中切换
window.FeedbackSDK.setTheme('light')
window.FeedbackSDK.setTheme('dark')

// 跟随系统外观
window.FeedbackSDK.useSystemTheme()
// 或 window.FeedbackSDK.setTheme('system')
```

## 4. 配置优先级（高 -> 低）

1. `window.FeedbackSDK.configure(...)`
2. 本地存储（sdk_feedback_*）
3. 环境变量（VITE_SDK_FEEDBACK_*）

## 5. `customUserId` 策略（“我的反馈”关键）

“我的反馈”列表是按 `project_id + custom_user_id` 查询的。  
如果 `customUserId` 变化，用户会看不到之前提交的历史反馈。

有登录系统（推荐）：

1. 使用你们业务登录用户的稳定 ID（建议脱敏后的内部ID）
2. 通过 `window.FeedbackSDK.configure({ customUserId })` 注入
3. 同一账号在同一项目下应保持同一个 `customUserId`

无登录系统（游客模式）：

1. App 首次启动生成随机 ID（如 UUID）
2. 持久化到本地（iOS 可用 `UserDefaults` 或 Keychain）
3. 每次打开组件都注入同一个 `customUserId`

不建议：

- 直接使用手机号、邮箱等明文 PII 作为 `customUserId`
- 频繁重置 `customUserId`

iOS 无登录示例（宿主 App 侧）：

```swift
let key = "feedback_guest_custom_user_id_v1"
let customUserId: String = {
  let old = UserDefaults.standard.string(forKey: key) ?? ""
  if !old.isEmpty { return old }
  let generated = "ios_guest_" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
  UserDefaults.standard.set(generated, forKey: key)
  return generated
}()
```

## 6. 组件内部接口

提交反馈：

- `POST /workshop/v1/apikey/feedbacks`
- Header: `Authorization: Bearer ak_xxx`
- 字段：`project_id`、`title`、`content`、`custom_user_id`、`file`（可选）、`data`（可选）

查询反馈状态：

- `GET /workshop/v1/apikey/feedbacks`
- Header: `Authorization: Bearer ak_xxx`
- 参数：`project_id`、`custom_user_id`、`page`、`page_size`

图片上传：

1. `GET /workshop/v1/apikey/oss/credentials` 获取临时凭证
2. 前端直传 OSS，路径前缀固定 `feedbacks/`
3. 提交反馈时将 OSS objectKey 写入 `file`

## 7. 状态同步与回调（当前能力）

已确认的服务端能力：

1. 创建反馈支持 `callback_url`（仅创建时）
: 服务会 GET `callback_url` 并带 `short_id`，失败会导致创建回滚  
参考：`Server/workshop-todo/api/feedback.md` 与 `Server/workshop-todo/handler/feedback.go`

2. 反馈状态变更（如开发完成）没有独立 callback API 文档
: 当前未发现“状态更新后主动回调第三方”的接口说明

3. 管理端可通过项目 WebSocket 收到 `feedback.updated` 事件
: 路由 `GET /workshop/v1/{auth_level}/projects/:id/ws`（偏管理端/登录体系）

结论：

- SDK 组件侧当前建议继续使用查询接口轮询刷新状态（现有实现即此方式）
- “状态更新 callback 接口（面向 SDK 接入方）”已记录为待确认需求，暂不开发

## 8. 安全建议

- 函数注入优于 URL 传参，但 `apiKey` 仍在客户端运行时可见。
- 生产建议改为服务端签发短期 token（绑定项目与用户、带过期时间），WebView 只持有短 token。
