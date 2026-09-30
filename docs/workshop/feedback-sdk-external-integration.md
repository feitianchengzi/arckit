# Feedback SDK 外部客户集成指南

面向将 Feedback SDK 嵌入自有产品的外部客户。SDK 以 **iframe / WebView** 方式集成（部署为静态 SPA，宿主通过 postMessage / evaluateJavaScript 注入配置），不是 npm 组件包。

## 1. 集成方式

SDK 入口是一个部署到 CDN/OSS 的 HTML 页面，宿主用 iframe（Web）或 WebView（iOS/Android）加载，通过 `window.FeedbackSDK` bridge 注入配置。

### 1.1 Web（iframe + postMessage）

```html
<iframe id="feedback-sdk" src="https://your-sdk-host/sdk-v2/index.html?embed=web"
        style="border:0;width:100%;height:100%"></iframe>
<script>
  const sdk = document.getElementById('feedback-sdk');
  window.addEventListener('message', (event) => {
    if (event.data?.source !== 'feedback-sdk-web') return;
    if (event.data.type === 'feedback-sdk:ready') {
      sdk.contentWindow.postMessage({
        source: 'feedback-sdk-host',
        type: 'feedback-sdk:configure',
        config: {
          gatewayUrl: 'https://your-gateway.example.com',
          feedbackV2Enabled: true,
          feedbackV2AuthMode: 'session',
          feedbackSessionToken: '<fbs_ token from your backend>',
          locale: 'zh-CN',          // 'zh-CN' | 'en-US'
          theme: 'light',           // 'light' | 'dark' | 'system'
          parentOrigins: ['https://your-app.example.com']
        }
      }, 'https://your-sdk-host');
    }
    if (event.data.type === 'feedback-sdk:unread-changed') {
      // event.data.unread_count：未读消息数，用于宿主展示红点
      updateUnreadBadge(event.data.unread_count);
    }
  });
</script>
```

### 1.2 iOS / Android（WebView + evaluateJavaScript）

加载 SDK URL 后，通过 `evaluateJavaScript` 调用 bridge：

```javascript
window.FeedbackSDK.configure({
  gatewayUrl: 'https://your-gateway.example.com',
  feedbackV2Enabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: '<fbs_ token>',
  locale: 'en-US',
  theme: 'system'
});
window.FeedbackSDK.openStatus();   // 打开"我的反馈"
// window.FeedbackSDK.openSubmit(); // 打开提交反馈
```

## 2. 鉴权模式（二选一）

| 模式 | 配置 | 适用 | 安全性 |
|---|---|---|---|
| **session**（推荐） | 宿主后端用 API Key 换取 15 分钟 `fbs_` token，下发客户端 | 外部客户封装 | 客户端不持有长期凭证；token 过期由宿主刷新 |
| **apiKey** | 客户端直接持有 API Key + projectId + customUserId | 内部/受信场景 | API Key 长期有效，泄露风险高 |

### 2.1 session 模式 token 获取（宿主后端调用，勿在客户端调用）

```http
POST /workshop/v2/apikey/feedback-sessions
Authorization: Bearer <server-held-api-key>
Content-Type: application/json

{ "project_id": 78, "custom_user_id": "stable-user-id" }
```

返回 `{ "token": "fbs_...", "expires_at": "..." }`，下发客户端注入 SDK。token 过期时 SDK 通过 `feedback-sdk:refresh-session` postMessage 请求宿主刷新（Web）或宿主轮询刷新（移动端）。

## 3. bridge API

`window.FeedbackSDK` 暴露的方法：

| 方法 | 说明 |
|---|---|
| `configure(config)` | 注入/合并运行时配置，触发 `feedback-sdk:configured` 事件 |
| `openSubmit()` | 跳转提交反馈页 |
| `openStatus()` | 跳转"我的反馈"页 |
| `getUnreadCount()` | 返回当前未读消息数（Promise） |
| `getConfig()` | 返回当前合并配置 |
| `setTheme(theme)` / `getTheme()` / `useSystemTheme()` | 主题 |
| `setLocale(locale)` / `getLocale()` | 切换语言（`zh-CN` / `en-US`） |
| `setImageFromNative(payload)` | 原生图片选择器回传 |

## 4. postMessage 协议（Web iframe）

**宿主 → SDK：**
- `feedback-sdk:configure`（config）— 注入配置
- `feedback-sdk:open`（mode: `submit`/`status`）— 打开页面
- `feedback-sdk:get-unread-count` — 查询未读

**SDK → 宿主：**
- `feedback-sdk:ready` — SDK 就绪，可注入配置
- `feedback-sdk:unread-changed`（unread_count）— 未读数变化
- `feedback-sdk:refresh-session` — session token 过期，请宿主刷新后重新 configure
- `feedback-sdk:close` — 客户关闭 SDK

## 5. 配置项

| 字段 | 必填 | 说明 |
|---|---|---|
| `gatewayUrl` | 是 | 网关地址。**未配置时 SDK 报错而非连默认内部域名** |
| `feedbackV2Enabled` | 是 | 启用 V2（智能客服、消息、通知） |
| `feedbackV2AuthMode` | 是 | `session` 或 `apiKey` |
| `feedbackSessionToken` | session 模式必填 | `fbs_` token |
| `apiKey` / `projectId` / `customUserId` | apiKey 模式必填 | 直连凭证 |
| `locale` | 否 | `zh-CN`（默认）/ `en-US` |
| `theme` | 否 | `light`（默认）/ `dark` / `system` |
| `parentOrigins` | Web 推荐 | 允许 postMessage 的宿主 origin 列表 |

## 6. 实时消息通道（V2 WebSocket）

V2 SDK 通过 WebSocket 接收客服回复的实时推送（`feedback.message.created`）：

- **session 模式**：连接 `wss://<gatewayUrl>/workshop/v2/feedback/projects/0/ws`，通过 WebSocket subprotocol `nebula-auth.<fbs_ token>` 携带 token。workshop-api 自验证 token 解析 project scope，加入项目房间。**无需网关注入 header，自包含**。
- **apiKey 模式**：连接 `wss://<gatewayUrl>/workshop/v2/apikey/projects/<projectId>/ws?project_id=&custom_user_id=`，subprotocol 携带 apiKey。依赖网关对 WS 握手的鉴权支持。
- 断线自动重连（5s 退避）；session token 过期触发 `feedback-sdk:refresh-session`。

## 7. 安全要点

- 不要在客户端代码/示例中硬编码 API Key。session 模式下客户端只持有短期 `fbs_` token。
- `parentOrigins` 应限定为你的实际域名，避免任意来源 postMessage。
- `custom_user_id` 使用业务稳定 ID，不使用邮箱/手机号等明文 PII。

## 8. 最小集成清单

1. 部署 SDK 静态产物（`build:v2`）到你的 CDN/OSS，`VITE_GATEWAY_URL` 构建期注入或运行时 configure。
2. 宿主后端实现 `/feedback-sessions` 代理，下发 `fbs_` token。
3. 宿主前端/移动端用 iframe/WebView 加载 SDK，configure 注入 `gatewayUrl` + session token + `parentOrigins`。
4. 监听 `feedback-sdk:unread-changed` 展示未读红点；监听 `feedback-sdk:refresh-session` 刷新 token。
