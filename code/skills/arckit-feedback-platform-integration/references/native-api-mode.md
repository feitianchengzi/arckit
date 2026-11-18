# 原生 API 模式

使用条件：`integrationMode=native-api`。使用原生 HTTP client 和原生 UI，不加载 SDK 页面。V2 HTTP API 已由当前项目路由与 handler 确认，可以直接用于原生接入；`window.FeedbackSDK`、`feedbackV2Enabled` 和 `feedback-sdk:*` 是 WebView 配置/消息，不是 HTTP 请求字段。

## 契约来源与配置过程

本契约按 2026-10-10 的 Arckit 工作区源码核对，不代表生产环境已经部署相同版本。下面路径是维护源定位线索；安装到其他项目后无需依赖这些仓库文件才能接入：

- `apps/feedback-console/src/pages/FeedbackProjectSettingsPage.tsx`：项目设置、Key 生成与接入示例。
- `packages/feedback-sdk-web/src/lib/sdk/config.ts`、`bridge.ts`：运行时配置与 WebView 宿主桥。
- `packages/feedback-sdk-web/src/lib/feedback/v2.ts`、`realtime.ts`：SDK HTTP client 与实际实时通道选择。
- `services/workshop-api/router/router.go`、`handler/feedback.go`、`feedback_session.go`、`feedback_session_handlers.go`、`feedback_workflow.go`、`feedback_session_oss.go`、`feedback_notification.go`：路由、鉴权、请求与响应依据。
- `services/workshop-api/docs/feedback-sdk-v2-integration.md`：V2 基础设计；其“SDK 不使用 WebSocket”已落后于实现。可选能力与其他已知差异见 [扩展与限制](native-api-extensions.md)。

执行顺序：

1. 在反馈控制台创建或选择项目，进入项目设置，取得正整数 Project ID。API Key 管理创建网关 Key，当前页面申请 `permissions=[read,write]`、`allowed_services=[workshop]`、约一年有效期，明文仅创建时展示。使用专用、可轮换 Key；**项目专用命名不证明 Key 已被网关锁定为单项目**，业务服务还会校验 Key 所属用户的项目成员身份。`feedback-access-keys` 是公开查询访问 key，不能替代此 Bearer API Key。
2. 新接入默认使用本 skill 已核验的最新稳定版，当前 `nativeApiVersion=v2`，即使只需提交/列表也使用 V2。只有用户明确指定 V1，或已有项目存在已确认的兼容约束时，才记录原因与依据并读取 [V1 兼容声明](native-api-v1.md)。已有 V1 代码、旧示例或采集器限制本身不构成兼容约束；不得因 V2 请求失败自动降级。未来更高版本须先取得并核验平台契约，不能猜测端点或仅修改版本号。
3. V2 显式选择 `nativeAuthMode=session|apiKey`；V1 仅 `apiKey`。确认 `gatewayUrl`、稳定用户身份、凭证 provider 和可选 `nativeNotificationsEnabled`。这些是接入方配置字段，不是服务端 JSON 字段，也不是 SDK bridge 的配置名。
4. `session` 模式接入已鉴权的宿主会话 endpoint；`apiKey` 模式从安全 provider 读取 Key、projectId、customUserId。账号切换时取消旧请求，清除列表/消息/附件凭证和 token，再初始化新身份；迟到响应不能写回新账号。
5. 原生客户端按下文路径发起请求，完成提交、列表、会话、附件和所选通知能力。配置未就绪时显示未配置态。

SDK WebView 的现有流程则是选择 V2 auth mode → `configure` 显式注入网关及认证字段 → `openSubmit/openStatus`。配置实现合并构建默认值与运行时值；原生 client 不应依赖这些隐式默认值或加载 iOS WebView 示例作为原生 API 证明。

## 认证与部署前提

`gatewayUrl` 是服务域名，不包含 `/workshop/v2`；示例 `https://api.feitianchengzi.com`，本地可用 `http://localhost:8081`，真实地址由部署方确认。HTTP 请求统一使用 `Authorization: Bearer <credential>`；JSON POST 使用 `Content-Type: application/json`。客户端不能自行伪造网关身份/范围 Header。

### Session

宿主服务持有 API Key，从其当前登录会话派生 `custom_user_id`，调用：

```http
POST /workshop/v2/apikey/feedback-sessions
Authorization: Bearer <server-held-api-key>
Content-Type: application/json

{"project_id":78,"custom_user_id":"stable-user-id"}
```

HTTP 201，响应：

```json
{"code":"OK","data":{"token":"fbs_<payload>.<signature>","token_type":"Bearer","project_id":78,"custom_user_id":"stable-user-id","expires_at":"2026-10-10T04:15:00Z"}}
```

Key 所属用户必须为项目成员。用户 ID 去空白后非空、最长 128 字节（Go `len(string)`）。token 有效期 15 分钟，只保存内存；宿主 endpoint 不接受客户端任意用户 ID 代签。客户端用 token 访问 `/workshop/v2/feedback/*`，项目与用户范围由 token 决定，**不发送** `project_id`、`custom_user_id`。

原生 client 根据 `expires_at` 提前刷新，合并并发刷新；401 时最多换取一次并重试一次。它不等待 WebView 的 `feedback-sdk:refresh-session` 事件。创建反馈与 Agent 消息没有幂等键，结果不明的超时不得自动重发；普通追加消息重试保留同一 `client_message_id`。

服务端/网关需部署 feedback auth 支持，配置相同的 `FEEDBACK_SESSION_SIGNING_KEY`（至少 32 字节），以及与之不同的 `FEEDBACK_GATEWAY_SHARED_SECRET`（至少 32 字节）。这些仅由运维管理，不交给客户端。控制台 `/v2/user/feedback-sessions` 属于控制台登录流程，不代替宿主 endpoint。

### API Key

客户端发送 API Key；各接口按下表显式携带范围。Key 即使存储在 Keychain 或本地忽略文件中，运行时仍可提取。`custom_user_id` 本身不是登录凭证，直连不能提供宿主认证的用户身份保证：游客使用持久高熵随机 ID；需要可信账号隔离时选择 Session。不要以可猜测账号编号作为直连身份秘密。

## V2 核心接口全表

下表路径均相对 `/workshop/v2`。`id` 为反馈 ID，`attachment_id` 为消息响应中的附件 ID。Session 列使用 token；API Key 列使用 Key。表中范围只添加在 API Key 请求中。

| 能力 | 方法 | Session 路径 | API Key 路径 | API Key 范围 |
| --- | --- | --- | --- | --- |
| 创建反馈及首条消息 | POST | `/feedback/feedbacks` | `/apikey/feedbacks` | body: `project_id, custom_user_id` |
| 我的反馈列表 | GET | `/feedback/feedbacks` | `/apikey/feedbacks` | query: `project_id, custom_user_id` |
| 消息列表 | GET | `/feedback/feedbacks/:id/messages` | `/apikey/feedbacks/:id/messages` | query: `custom_user_id` |
| 追加用户消息 | POST | `/feedback/feedbacks/:id/messages` | `/apikey/feedbacks/:id/messages` | body: `custom_user_id` |
| 上传策略 | POST | `/feedback/upload-policies` | `/apikey/feedbacks/upload-policies` | body: `project_id, custom_user_id` |
| 用户前缀只读凭证 | GET | `/feedback/oss/credentials` | `/apikey/feedbacks/oss/credentials` | query: `project_id, custom_user_id` |
| 单附件只读凭证 | GET | `/feedback/feedbacks/:id/attachments/:attachment_id/oss/credentials` | `/apikey/feedbacks/:id/attachments/:attachment_id/oss/credentials` | query: `custom_user_id` |
| 通知/未读数 | GET | `/feedback/notifications` | `/apikey/feedback-notifications` | query: `project_id, custom_user_id` |
| 标记已读 | POST | `/feedback/notifications/read` | `/apikey/feedback-notifications/read` | body: `project_id, custom_user_id` |

不要从 URL 对称性构造未列出的原生 CRUD。Session 没有单条反馈 GET、编辑或删除路由；使用列表记录进入会话。成员级 PUT/DELETE、分诊、转待办和交付通知不属于最终用户接入契约。

## 创建反馈与消息

Session 创建 body（API Key 模式额外加范围，且 `data` 必须改为 JSON **字符串**）：

```json
{"title":"搜索异常","content":"输入后无结果","data":{"source":"ios","app_version":"1.0"},"attachments":[]}
```

- title/content 必填；客户端 trim 后非空，title 控制 UTF-8 长度 ≤200 字节以满足 Session handler 的实际限制。API Key handler 没有相同的 trim/长度前置校验，原生 UI 仍统一约束，不能把文档的“200 字符”当成 200 个汉字。
- Session `data` 接受 JSON 值，推荐对象；API Key `data` 为可选 string，例如 `"{\"source\":\"ios\"}"`。两者**响应** `data` 字段均为 JSON string 或 null。
- API Key 创建还支持 `user_phone`、`user_email`、旧 `file` 和 `callback_url`；普通原生 V2 不需要这些字段，不把它们复制到 Session body。附件使用 `attachments`。
- 成功 201，`data` 为 Feedback。创建反馈与 customer 首条消息在同一事务中完成；首条消息 `metadata.source=feedback_initial`，不要再次发送正文制造重复消息。

追加消息 body：

```json
{"content":"补充复现步骤","client_message_id":"unique-stable-uuid","metadata":{"app_version":"1.0"},"attachments":[]}
```

`content` 与附件至少有一个；`metadata` 是 JSON 值，推荐对象。本 skill 要求 V2 `client_message_id` 始终非空、≤128 字节：Session handler 强制必填，API Key handler 当前允许省略，但省略即失去幂等保障。首次 201，幂等重试 200；同一 feedback + custom user + client ID 返回原消息，重试不能换 ID 或复用 ID 发送不同内容。响应 `data` 为 Message。

列表参数 `page=1&page_size=50`，page_size 上限 200，超限截断，非法值回默认。反馈列表按 `created_at DESC,id DESC`，消息按 `created_at ASC,id ASC`。消息超过一页时必须继续分页才能看到最新回复；进入会话、回到前台和发送成功后刷新，活跃会话可约 30 秒轮询，离开后停止。

## 响应模型

所有 HTTP API 成功 envelope 为 `{"code":"OK","data":...}`；分页增加 `meta:{page,page_size,total}`。错误为 `{"code":"...","error":{"message":"...","details":...}}`，data/meta/details 可缺省。HTTP 非 2xx 或 code 非 OK 都按失败处理。日期为 RFC3339/ISO 8601 字符串，解码应兼容时区和小数秒；可选字段兼容省略/null，枚举兼容未知值。

| 模型 | 字段 |
| --- | --- |
| Feedback | 数字 `id,project_id`；字符串 `short_id,title,content,status,triage_status,customer_status,created_at,updated_at`；可空字符串 `custom_user_id,user_phone,user_email,file,data`；可选 `task_id:number,task_state:string,deleted_at,last_message_at,last_customer_message_at,last_developer_message_at` |
| Message | 数字 `id,feedback_id,project_id`；`sender_type:customer/developer/system`；可选 `sender_user_id:number,sender_custom_user_id:string,client_message_id:string`；字符串 `message_type,content,created_at,updated_at`；可选 JSON `metadata`；`attachments:Attachment[]` |
| Attachment | 数字 `id,message_id`；`type:image/file/url`；可选字符串 `object_key,url,file_name,mime_type`，可选数字 `size`；`created_at,updated_at` |
| Notification | 数字 `id,project_id,feedback_id,message_id`；可选 `feedback_short_id,feedback_title`；字符串 `message_type,message_preview,sender_type,type,created_at`；可选 `read_at` |

用户状态优先读取 `customer_status`：`submitted/reviewing/developing/completed/released/ignored`；不要用扩展 `data.feedback_state` 覆盖当前正式状态。`status` 是工作流状态，`triage_status` 是控制台受理状态。未知状态安全降级显示，不使解码失败。

## 附件：申请、上传、引用、读取

1. 申请上传策略：body 为 `{"type":"image","file_name":"screen.png","mime_type":"image/png","size":120034}`；API Key 增加范围。返回 `data:{object_key,upload_url,fields:{string:string},expires_at}`，有效期 10 分钟。
2. 用 multipart/form-data POST 到返回的 `upload_url`，先写全部 `fields`，最后写二进制 `file`；文件 MIME/实际字节数必须和申请一致。由 HTTP 库生成 boundary，不向 OSS 发送 Workshop Bearer。OSS HTTP 201 才算上传成功，它不是 Workshop JSON envelope。
3. 创建反馈/消息时提交 `{"type":"image","object_key":"<returned-key>","file_name":"screen.png","mime_type":"image/png","size":120034}`。`image/file` 必须有 object_key、mime_type、正数 size，不能同时有 url；`url` 必须只有有效 HTTPS url，不提供 object_key。不要自己构造 key 或将本地路径当作上传成功。
4. 读取消息附件优先申请**单附件**凭证，覆盖开发者附件；用户前缀凭证只覆盖本人上传范围。响应 `data` 包含 `access_key_id,access_key_secret,security_token,expiration,bucket_name,region,root_path,authorization_v4,secure`。用这些字段通过相应 OSS 签名方式生成短期 HTTPS URL；凭证仅 GetObject、≤15 分钟，内存保存，不能写入日志、磁盘或用于上传。私有 object key 不能直接拼接公开 URL。

图片 MIME：`image/jpeg,image/png,image/webp,image/gif`，单张 ≤10 MiB。文件 MIME：`application/pdf,text/plain,text/csv,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation`，单文件 ≤20 MiB。每条消息最多 10 个附件、总大小 ≤20 MiB。用户 key 前缀为 `<OSS_ROOT_PATH>/feedbacks/v2/<project_id>/<sha256(custom_user_id)>/`，以服务端返回为准。

OSS 上传要求部署方配置 Bucket、服务端签名权限；Web 承载另需 Bucket CORS 允许 POST。策略过期可重新申请并重新上传，不能把旧 key 冒充新策略结果。

## 通知与已读

仅在原生接入显式开启通知且服务端 `FEEDBACK_V2_NOTIFICATION_PROJECT_IDS` 包含该项目或 `*` 时启用；未开放时接口返回 404，不等同于零未读。

- GET 支持 `feedback_id`、`unread_only=true` 和分页；返回 `data:{notifications:Notification[],unread_count:number}` 与 meta。`unread_count` 是当前收件人整个项目内的未读通知总数，**不随 feedback_id/unread_only/page 筛选变化**，也不是未读反馈条数。
- 查询列表、消息和未读数均不标记已读。进入并展示某条会话后 POST `{"feedback_id":10}`，或 `{"notification_ids":[1,2]}`。notification_ids 最多 100 个正整数；两者至少一个，同时提供按交集处理；API Key 增加范围。
- 返回 `data:{marked_count:number,read_at:string}`。随后刷新角标；0 隐藏。用户通常收到 `developer_message/status_change`，成员收到 `customer_message`。
- 没有单独 `/unread-count` 路由，也没有全项目无条件“全部已读”请求。

## 错误、可选能力与验收

400：检查字段、data 类型、附件限制或 Session 缺少幂等键；401：Session 有限刷新，Key 模式回报凭证失效；403：检查项目成员/用户范围，不更换身份绕过；404：区分记录不存在、路由未部署和通知未开放；5xx/网络错误：显示重试态，非幂等写入结果未知时先查列表/历史。错误日志不得包含 Authorization、token、STS、完整配置或身份样本。

智能客服与 WebSocket 按需读取 [扩展与限制](native-api-extensions.md)，不能默认宣称两种认证模式的所有可选能力等价。

原生交付至少验证：两种 data 编码、创建后首条消息、超过一页的消息、相同 client_message_id 重试、账号切换与迟到响应、跨用户访问拒绝、上传失败/过期、用户及开发者附件读取；启用 Session 再验过期/并发刷新，启用通知再验“读取不标记、会话只读当前反馈、0 隐藏、404 降级”。未进行真实服务联调时明确报告仅完成静态契约核对，不声称线上可用。
