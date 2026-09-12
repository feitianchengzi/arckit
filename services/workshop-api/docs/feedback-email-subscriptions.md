# 反馈邮件订阅（V2）

## 目标与隔离原则

该能力只服务于 Feedback V2 的项目成员，不改变 V1、SDK 会话、登录验证码或其他 Gateway 消费方：

- 默认关闭：`FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED` 缺省为 `false`。
- 用户主动订阅：每位项目成员只修改自己的项目订阅，默认不开启邮件。
- 反馈优先：提交反馈只在同一事务写入轻量 outbox，不同步调用 SMTP。
- Gateway 固定模板：Workshop 只传用户 UUID 与结构化反馈数据，不能指定邮箱、主题或 HTML。
- 邮箱服务端解析：Auth Server 优先读取用户已验证的独立订阅邮箱，未设置时回退到当前启用账号的绑定邮箱。
- 独立密钥：事务邮件共享密钥不得与 JWT、API Key 或 Feedback Session 密钥复用。

## 数据与调用链

1. Console 调用 `GET/PUT /workshop/v2/user/feedback-subscription` 管理当前成员的设置。
2. 新反馈或用户补充消息写入时，Workshop 为符合订阅条件的项目成员写入 `feedback_email_deliveries`。
3. Workshop worker 使用 `FOR UPDATE SKIP LOCKED` 领取任务，并调用 Auth Server：
   `POST /v1/internal/notification-emails`。
4. Auth Server 校验 `X-Nebula-Internal-Secret`，根据全局用户 UUID 解析有效收件邮箱，渲染固定模板后使用现有 SMTP 通道发送。Workshop 和 Console 都不能在投递请求中指定收件人。
5. 成功后 outbox 标记为 `sent`；网络、限流和 5xx 按指数退避重试，最多默认 8 次。

普通重试由 outbox 唯一约束 `(message_id, recipient_user_id)` 抑制。邮件使用由 delivery ID 派生的稳定 `Message-ID`，用于降低 SMTP 超时后的重复展示概率。SMTP 不提供严格 exactly-once 语义，极端的“服务端已接收邮件但客户端超时”仍可能产生重复邮件。

## API

### 查询自己的订阅

```http
GET /workshop/v2/user/feedback-subscription?project_id=78
Authorization: Bearer ...
```

未创建订阅时返回默认值：邮件关闭、新反馈和用户补充两类事件均预选。

### 更新自己的订阅

```http
PUT /workshop/v2/user/feedback-subscription
Authorization: Bearer ...
Content-Type: application/json

{
  "project_id": 78,
  "email_enabled": true,
  "notify_new_feedback": true,
  "notify_customer_replies": true
}
```

只有当前项目成员可以查询或修改订阅。项目所有者不能替其他成员开启邮件。

### 独立订阅邮箱

独立订阅邮箱是 Gateway 账号级设置，会用于该用户未来收到的所有反馈项目通知，但不会修改登录账号邮箱。未设置时自动使用账号邮箱；两处均为空时不能开启邮件订阅。

```http
GET /auth-server/v1/user/notification-email
POST /auth-server/v1/user/notification-email/verification
PUT /auth-server/v1/user/notification-email
DELETE /auth-server/v1/user/notification-email
Authorization: Bearer ...
```

设置独立邮箱需要先向目标地址发送专用验证码，再提交邮箱和 6 位验证码。该验证码使用独立 purpose，不能与登录、注册或重置密码验证码互换。删除独立邮箱后立即恢复账号邮箱兜底；如果账号也没有邮箱，接口返回 `has_email=false`，Console 会引导用户重新设置。

邮件深链进入 Console 的 `/feedbacks/email/:feedback_id` 独立响应式页面，并使用
`GET /workshop/v2/user/feedbacks/:id` 读取目标反馈。页面不加载 Console 侧栏和项目总览；
未登录时先进入登录页，登录成功后回到原始深链。后端接口仅注册在 V2 `user` 路由，
并再次校验项目成员身份；V1、API Key 与 Feedback Session 均不开放。

## 发布顺序

1. 生成全新的共享密钥：`openssl rand -base64 48`。
2. 先执行 Gateway Auth 数据库迁移：

   ```bash
   psql "$AUTH_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f deploy/migrations/20260906_notification_email_preferences_up.sql
   ```

3. 部署 Gateway/Auth Server，设置：
   - `NOTIFICATION_INTERNAL_SHARED_SECRET=<新密钥>`
   - `NOTIFICATION_EMAIL_ALLOWED_LINK_HOSTS=feedback.feitianchengzi.com`
4. 执行 Workshop 数据库迁移：

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f database/migrations/20260904_feedback_email_subscriptions_up.sql
   ```

5. 部署 Workshop，但先保持 `FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED=false`。
6. 部署 Console，验证订阅 UI、成员权限、独立邮箱验证码和账号邮箱兜底。
7. 配置 Workshop：
   - `FEEDBACK_NOTIFICATION_EMAIL_URL=http://host.docker.internal:4433/v1/internal/notification-emails`
   - `FEEDBACK_NOTIFICATION_SHARED_SECRET=<与 Gateway 相同的新密钥>`
   - `FEEDBACK_CONSOLE_BASE_URL=https://feedback.feitianchengzi.com/console`
8. 用测试项目和测试账号开启订阅，最后设置 `FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED=true` 并重启 Workshop。

Gateway 与 Workshop 的 Compose 示例已声明所需配置；Workshop Compose 增加了 `host.docker.internal:host-gateway`，不要求把两个已有 Docker 网络合并。

Auth Server 的直接端口应同时由云防火墙/安全组限制为本机或可信私网来源。共享密钥是应用层的第二道保护，不应替代网络访问控制。

## 验收

- 未订阅成员不会产生 outbox 记录或收到邮件。
- 已订阅成员只收到所选事件类型。
- 非项目成员访问订阅 API 返回 403。
- 未设置独立邮箱时使用账号邮箱；两者都没有时，Console 禁止开启并提示设置。
- 独立邮箱必须通过专用验证码确认，且登录验证码不能用于保存订阅邮箱。
- 停止 Gateway 后提交反馈仍成功，outbox 保留并在恢复后重试。
- 邮件中的按钮进入对应项目，并通过 `feedback_id` 读取和选中准确反馈，即使该记录已不在列表第一页。
- 登录验证码发送与注册/登录接口回归正常。

## 运维与回滚

紧急停止邮件只需将 Workshop 的 `FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED=false` 并重启；反馈和站内通知不受影响。不要在回滚应用时立即执行 down migration，以免丢失用户订阅偏好和待投递记录。

常用检查：

```sql
SELECT status, count(*)
FROM feedback_email_deliveries
GROUP BY status;

SELECT id, attempt_count, next_attempt_at, left(last_error, 160)
FROM feedback_email_deliveries
WHERE status IN ('pending', 'failed')
ORDER BY updated_at DESC
LIMIT 50;
```

当前发送通道是飞书邮箱 SMTP（`smtp.feishu.cn`），不是飞书开放平台消息 API。代码不假设“每天 500 次”额度；实际限额应以邮箱管理员配置和服务端退信/限流结果为准。

Gateway 当前的邮箱验证码登录流程没有把 `users.is_verified` 持久化为真，因此账号邮箱兜底不能依赖该历史字段，否则现有正常账号会全部失效。独立订阅邮箱使用自己的 `verified_at`，必须经本功能的专用验证码写入。投递接口仍不允许调用方提供邮箱，收件地址只能由 Auth Server 从已验证独立邮箱或启用账号邮箱中解析；账号历史验证状态的修复应作为独立认证改造评审和发布，避免本功能改变所有 Gateway 消费方的登录行为。
