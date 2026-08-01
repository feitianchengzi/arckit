# 原生 API 模式

使用条件：参数 UI 或等价配置返回 `integrationMode=native-api`。不要加载 SDK 页面；基于请求和响应参数设计原生反馈中心，反馈中心内部包含提交表单和“我的反馈”列表。

## 版本与能力边界

本模式是独立的原生 API 接入，不是 SDK WebView V2 的“原生实现”。下文只记录当前已确认的 `/workshop/v1/apikey/feedbacks` 契约：

- 不把 SDK V2 的 `feedbackV2AuthMode`、`feedbackSessionToken`、`feedbackV2NotificationsEnabled` 或 iframe 消息协议用于原生 API。
- `/workshop/v2/apikey/feedback-sessions` 只用于 SDK V2 Session token 换取，不能当成原生反馈 CRUD、消息或未读接口。
- 若用户需要与 SDK V2 能力对应的原生 API，先向平台取得 endpoint、认证、请求/响应 schema、附件、会话/消息、已读/未读契约；未取得前标记为产品缺口，不推测实现。
- 最终汇报必须写明本轮使用的是已确认的 V1 原生接口，不能笼统声称“已完成 V2 原生接入”。

## 接口

Base URL:

```text
https://api.feitianchengzi.com/workshop/v1/apikey/feedbacks
```

Headers:

```http
Authorization: Bearer <apiKey>
Content-Type: application/json
```

`Content-Type` 仅 POST 必需。API Key 仍受凭证策略约束；生产更推荐后端代理或后端运行时配置，避免客户端长期持有 Bearer Token。

## 提交反馈

```http
POST /workshop/v1/apikey/feedbacks
```

请求 JSON：

```json
{
  "project_id": 50,
  "title": "搜索体验反馈",
  "content": "搜索历史记录加载太慢，希望优化。",
  "custom_user_id": "app_user_123",
  "file": "feedbacks/20260609_demo.jpeg",
  "data": "{\"source\":\"ios\",\"feedback_state\":\"pending\"}"
}
```

字段口径：

- `project_id`: 必填数字。
- `title`: 必填或至少由 UI 强制非空。
- `content`: 必填或至少由 UI 强制非空。
- `custom_user_id`: 必填，用于“我的反馈”归属；使用业务用户 ID 或持久游客 ID。
- `file`: 可选字符串。当前接口样例接收已上传文件路径；没有文件上传接口时，不要在 UI 中承诺本地附件上传已完成。
- `data`: 可选字符串，内容通常是 JSON string。可传 `source`、`app_version`、`device`、`feedback_state` 等扩展字段；不要放敏感个人信息。

实测提交响应：

```json
{
  "code": "OK",
  "data": {
    "id": 22,
    "project_id": 50,
    "short_id": "50D9DAC63BDD",
    "title": "Codex API probe",
    "content": "...",
    "custom_user_id": "codex_api_probe_20260613",
    "user_phone": null,
    "user_email": null,
    "file": "",
    "data": "{\"source\":\"ios\",\"feedback_state\":\"pending\",\"probe\":true}",
    "created_at": "2026-06-12T19:35:31Z",
    "updated_at": "2026-06-12T19:35:31Z"
  }
}
```

## 查询“我的反馈”

```http
GET /workshop/v1/apikey/feedbacks?project_id=50&custom_user_id=app_user_123&page=1&page_size=50
```

实测查询响应：

```json
{
  "code": "OK",
  "data": [
    {
      "id": 22,
      "project_id": 50,
      "short_id": "50D9DAC63BDD",
      "title": "Codex API probe",
      "content": "...",
      "custom_user_id": "codex_api_probe_20260613",
      "user_phone": null,
      "user_email": null,
      "file": "",
      "data": "{\"source\":\"ios\",\"feedback_state\":\"pending\",\"probe\":true}",
      "created_at": "2026-06-12T19:35:31Z",
      "updated_at": "2026-06-12T19:35:31Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 1
  }
}
```

## 推荐模型

- `FeedbackAPIEnvelope<T>`: `code: String`, `data: T`, `meta: FeedbackPaginationMeta?`
- `FeedbackItem`: `id`, `projectId`, `shortId`, `title`, `content`, `customUserId`, `userPhone`, `userEmail`, `file`, `data`, `createdAt`, `updatedAt`
- `FeedbackPaginationMeta`: `page`, `pageSize`, `total`
- `FeedbackCreateRequest`: `projectId`, `title`, `content`, `customUserId`, `file`, `data`

## UI 引导

- 默认只在 Profile/Settings 中提供一个“反馈中心”入口；反馈中心内部用 tabs、segmented control 或同等导航切换“提交反馈”和“我的反馈”。
- “提交反馈”action 最小包含标题、内容、可选联系方式或附件占位、提交按钮、提交中、提交成功、提交失败。
- “我的反馈”action 使用 `custom_user_id` 查询，展示标题、内容摘要、`short_id`、创建时间、附件路径和 `data` 中可解析的状态。
- `data` 是字符串字段，解析失败时保留原文，不要让列表崩溃。
- `meta.total == 0` 时展示空态；请求失败时展示可重试错误态。
- 支持附件前，先确认是否存在文件上传接口；只有拿到远端 `file` 路径后再提交反馈。
- HTTP 非 2xx 或 `code != "OK"` 都按失败处理，且错误日志不得包含 API Key。
- 只有用户明确要求分开、平台限制无法合并、或既有产品导航强约束时，才把“提交反馈”和“我的反馈”拆成两个独立入口，并在最终回复说明原因。
