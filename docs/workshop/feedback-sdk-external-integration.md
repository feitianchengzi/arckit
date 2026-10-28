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
    if (event.origin !== 'https://your-sdk-host' || event.source !== sdk.contentWindow) return;
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

- **session 模式**：连接 `wss://<gatewayUrl>/workshop/v2/feedback/projects/0/ws`，提供应用子协议 `feedback-v2` 和凭证子协议 `nebula-auth.<fbs_ token>`；服务端仅协商应用子协议，自验证 token。只向客户发送其本人反馈的最小变更通知，SDK 再经鉴权 HTTP 拉取正文。
- **apiKey 模式**：SDK 当前使用轮询刷新，不建立 API Key WebSocket 连接。
- 断线自动重连（5s 退避）；session token 过期触发 `feedback-sdk:refresh-session`。

## 7. 安全要点

- 不要在客户端代码/示例中硬编码 API Key。session 模式下客户端只持有短期 `fbs_` token。
- `parentOrigins` 应限定为你的实际域名，避免任意来源 postMessage。
- `custom_user_id` 使用业务稳定 ID，不使用邮箱/手机号等明文 PII。

## 8. 最小集成清单

1. 部署 SDK 静态产物（`build:v2`）到你的 CDN/OSS，`VITE_GATEWAY_URL` 构建期注入或运行时 configure。
   跨域 iframe 首次配置前尚无运行时白名单，必须在构建时设置 `VITE_SDK_PARENT_ORIGINS=https://your-app.example.com`（多个 origin 用逗号分隔）；不能仅靠 configure 消息里的 `parentOrigins` 为自身授权。生产包不会自动信任 localhost。
2. 宿主后端实现 `/feedback-sessions` 代理，下发 `fbs_` token。
3. 宿主前端/移动端用 iframe/WebView 加载 SDK，configure 注入 `gatewayUrl` + session token + `parentOrigins`。
4. 监听 `feedback-sdk:unread-changed` 展示未读红点；监听 `feedback-sdk:refresh-session` 刷新 token。


## 9. 智能客服与多轮澄清的使用流程

### 接入方准备

1. 为产品建立独立项目，配置仓库并同步索引。仓库中的 Markdown 可作为问答依据；应先用知识检索确认真实命中，不能仅依赖“已同步”标签。
2. 配置 OpenHands 地址、模型与有效模型 Key。使用项目 Key 时，服务端必须配置至少 32 字符的 `OPENHANDS_CONFIG_ENCRYPTION_KEY`。健康检查只能确认进程存活，还需执行真实有依据的问答。API 与 OpenHands 必须看到同一项目工作区。
3. 生产网关验证 Session 签名及到期时间后，注入受内部共享密钥保护的客户 scope。普通 HTTP Session 接口不能直接绕过网关使用；WebSocket 自验证短期 token。
4. SDK 开启 `feedbackV2Enabled`；需要红点时同时开启 `feedbackV2NotificationsEnabled`，后端以 `FEEDBACK_V2_NOTIFICATION_PROJECT_IDS` 显式启用相应项目。
5. 图片与文件需要另外配置 OSS/STS；模型可用不等于附件上传可用。宿主必须处理 `feedback-sdk:refresh-session`，重新从自有后端取得 token 并注入。

### 最终用户

1. 在外部系统打开“咨询 / 反馈”，进入智能客服，描述问题。能依据项目资料回答的问题直接获得回答与来源。
2. 无法解决时，继续在同一会话回答澄清问题。系统整理位置、实际现象、期望结果、复现步骤、环境、影响、发生频率及诉求类型；已有信息跨轮保存。模型提供的信息需要客户原话依据，缺失信息继续追问，不替客户编造。
3. 查看结构化草稿并补充或纠正。辅助信息确实不知道时显式标为待确认，不能把待确认内容当作事实；位置、现象、期望仍须提供。
4. 明确确认草稿，再提交反馈。确认前不会自动创建反馈卡片。已有反馈会追加信息，避免因每次低置信回答重复建卡。
5. 在“我的反馈”查看状态、开发者回复并继续补充；打开会话后标记通知已读。

### 处理团队与需求判断

团队查看结构化事实、原话依据和待确认项，区分产品缺陷、功能建议及使用咨询，评估影响范围、复现性和期望结果。诉求类型是判断辅助，不是已接受需求；优先级、方案与交付日期仍由团队决定。

受理后把反馈流转为待办；任务执行、完成及验收状态会同步到反馈。交付产物通过正式交付接口回写并通知客户。V2 不允许直接修改反馈状态来模拟完成，应由关联待办驱动。

### 新需求澄清

先确认诉求类型，再采用不同的信息完整性规则。故障保留位置、现象、期望、复现步骤、环境、影响的校验。新需求必须明确所属模块、需求描述、期望结果、目标用户、使用场景、业务目标和当前痛点；当前流程、影响、频率、预期收益、替代办法、约束也会询问，允许客户明确标记待确认。新需求不要求故障复现或浏览器环境。

接口新增 `target_users`、`current_workflow`、`pain_points`、`expected_benefit`、`constraints`；`reproduction_steps` 在 feature 类型表示使用场景。结构化提交必须包含有效 `request_type`。类型切换后重新计算缺失项，编辑后重新确认。字段采用客户原话证据跨轮合并；信息齐备仅代表可供核对，不代表需求已受理或已评定合理性。
