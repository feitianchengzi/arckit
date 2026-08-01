# Web iframe 宿主协议

使用条件：普通 Web 产品通过跨域 iframe 加载 SDK V2 页面。动态参数沿用 V1 的 `apiKey`、`projectId`、`customUserId` 等来源；V2 开关、认证模式、网关和主题按接入选择写入固定配置。

## 固定值与消息方向

```javascript
const sdkUrl = 'https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web'
const sdkOrigin = 'https://feedback.feitianchengzi.com'
const hostSource = 'feedback-sdk-host'
const sdkSource = 'feedback-sdk-web'
```

iframe -> 宿主：

- `feedback-sdk:ready`：SDK 已安装消息监听器，可以接收配置。
- `feedback-sdk:close`：用户按 Escape、点击遮罩或关闭 SDK。
- `feedback-sdk:unread-changed`：未读数变化，payload 含 `unread_count`。
- `feedback-sdk:unread-count`：对未读请求的响应，回传 `request_id` 和 `unread_count`。
- `feedback-sdk:refresh-session`：Session 已过期，请宿主重新获取 token 并再次 configure。

宿主 -> iframe：

- `feedback-sdk:configure`：payload 使用 `config` 字段。
- `feedback-sdk:open`：payload 使用 `mode: 'submit' | 'status'`。
- `feedback-sdk:get-unread-count`：payload 使用唯一 `request_id`。

配置与打开没有跨域 `configured` 回执；`feedback-sdk:configured` 是 iframe 内部 DOM 事件。宿主收到 `ready` 后按顺序发送 configure 和 open，浏览器会保持同一 source/target 的消息顺序。

## 最小宿主实现

HTML：

```html
<iframe
  id="feedback-frame"
  title="反馈中心"
  src="https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web"
  hidden
></iframe>
```

客户端直连示例：

```javascript
const sdkOrigin = 'https://feedback.feitianchengzi.com'
const hostSource = 'feedback-sdk-host'
const sdkSource = 'feedback-sdk-web'
const iframe = document.querySelector('#feedback-frame')
let sdkReady = false
let pendingMode = 'submit'

function feedbackConfig() {
  const runtime = feedbackRuntimeConfig() // V1 已有动态参数来源
  return {
    feedbackV2Enabled: true,
    feedbackV2AuthMode: 'apiKey',
    apiKey: runtime.apiKey,
    projectId: runtime.projectId,
    customUserId: stableUserId(),
    gatewayUrl: 'https://api.feitianchengzi.com',
    theme: 'system',
    feedbackV2NotificationsEnabled: true,
  }
}

function postToFeedback(message) {
  iframe.contentWindow?.postMessage({ source: hostSource, ...message }, sdkOrigin)
}

function configureAndOpen() {
  postToFeedback({ type: 'feedback-sdk:configure', config: feedbackConfig() })
  postToFeedback({ type: 'feedback-sdk:open', mode: pendingMode })
}

function openFeedback(mode = 'submit') {
  pendingMode = mode
  iframe.hidden = false
  if (sdkReady) configureAndOpen()
}

window.addEventListener('message', (event) => {
  if (event.origin !== sdkOrigin) return
  if (event.source !== iframe.contentWindow) return
  if (event.data?.source !== sdkSource) return

  switch (event.data.type) {
    case 'feedback-sdk:ready':
      sdkReady = true
      configureAndOpen()
      break
    case 'feedback-sdk:close':
      iframe.hidden = true
      break
    case 'feedback-sdk:unread-changed':
      renderFeedbackBadge(Number(event.data.unread_count) || 0)
      break
  }
})
```

若配置需要异步读取，把 `configureAndOpen()` 改为 async，并在发送 configure/open 前等待运行时配置和稳定用户 ID；不要把凭证放进 iframe URL。

## Session 模式

Session 模式的宿主配置只包含短期 token 和固定字段：

```javascript
async function sessionConfig() {
  const { token } = await fetch('/api/feedback/session', {
    method: 'POST',
    credentials: 'include',
  }).then((response) => response.json())

  return {
    feedbackV2Enabled: true,
    feedbackV2AuthMode: 'session',
    feedbackSessionToken: token,
    gatewayUrl: 'https://api.feitianchengzi.com',
    theme: 'system',
    feedbackV2NotificationsEnabled: true,
  }
}
```

Session 接入把最小宿主实现中的 `feedbackConfig()` 替换为 `sessionConfig()`；收到 `feedback-sdk:refresh-session` 时重新获取 token，再发送一次 `feedback-sdk:configure`。不要把旧 token 写入 URL、日志或持久化；并发刷新应复用同一个进行中的请求。

## 未读请求

```javascript
const requestId = crypto.randomUUID()

postToFeedback({
  type: 'feedback-sdk:get-unread-count',
  request_id: requestId,
})
```

只接受同一个 `request_id` 的 `feedback-sdk:unread-count` 响应。读取不会修改已读状态，`unread_count` 为 0 时隐藏角标。

## Origin 与安全门禁

- 宿主发送消息时 `targetOrigin` 固定为 `https://feedback.feitianchengzi.com`，不使用 `*`。
- 宿主接收消息时同时校验 `event.origin`、`event.source === iframe.contentWindow` 和 `event.data.source === 'feedback-sdk-web'`。
- SDK 会校验父页面 origin。公开 V2 构建中可见的允许项为 `https://workshop.feitianchengzi.com`、`https://feedback.feitianchengzi.com`，以及 HTTP `localhost` / `127.0.0.1`（可带端口）。第三方生产域名必须先由平台加入允许范围；该检查发生在 configure 之前，宿主代码不能绕过。
- API Key、Session token 和完整配置对象不得写入 URL、日志、分析事件或持久化。
- 生产部署验证 ready 是否到达、configure/open 是否生效，以及宿主 origin 是否已获平台授权。

## 与 V1 的关系

- V1 的动态参数来源和 V2 保持一致；宿主继续在运行时取得 API Key、项目 ID 和稳定用户 ID。
- V1 iframe 已使用 `feedback-sdk:ready`、`feedback-sdk:configure` 和 `feedback-sdk:open`；V2 延续这些消息并增加 `feedback-sdk-host`、未读和 Session 刷新。
- V2 宿主统一使用 `source: 'feedback-sdk-host'`。不要复制 V1 仅适用于平台 Console 的 `feedback-console-web` 作为新接入默认值。
