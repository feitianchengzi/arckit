# Feedback V2 发布与回滚 Runbook

本 Runbook 保持现有 `./deploy.sh prod` 的镜像发布流程不变。数据库迁移在镜像启动前显式执行，因为生产部署脚本不会上传或自动执行 `database/migrations`。

## 发布前

1. 确认 Workshop 分支已通过 `go test ./...`，网关 scoped-token 分支已通过 `go test ./...`。
2. 在 Workshop 与 API Gateway 的生产环境文件中设置相同的 `FEEDBACK_SESSION_SIGNING_KEY` 和相同的 `FEEDBACK_GATEWAY_SHARED_SECRET`。两种密钥各自至少 32 字节，且不得相同。
3. 确认 `CORS_ALLOW_ORIGINS` 包含 SDK 域名；确认 OSS Bucket 的现有 CORS 规则允许该域名对 bucket endpoint 的 `POST`。
4. 确认 API Gateway 已部署支持 `/workshop/v2/feedback/*` 的 `feedback` 认证级别。仅部署 Workshop 不会使浏览器 scoped token 生效。
5. 在 RDS 可访问的受控环境创建带时间戳的完整备份。保留备份文件和校验结果，直到灰度期结束。

## 数据库迁移

迁移文件：

```text
database/migrations/20260715_feedback_sdk_v2_hardening_up.sql
```

使用现有生产数据库连接执行。命令中的连接参数应从受控环境变量注入，不能写进 shell 历史或日志：

```bash
PGPASSWORD=REPLACE_WITH_PRIVATE_SECRET psql \
  "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER sslmode=$DB_SSLMODE" \
  -v ON_ERROR_STOP=1 \
  -f database/migrations/20260715_feedback_sdk_v2_hardening_up.sql
```

该脚本是单事务且可重复执行，完成以下变化：

- 新增 `feedback_messages.client_message_id` 和 customer 消息幂等唯一索引。
- 为历史反馈回填带 `metadata.source = feedback_initial` 的首条消息。
- 同步历史反馈的最近客户消息时间。

执行后校验：

```sql
SELECT COUNT(*) AS feedbacks_without_initial_message
FROM feedbacks f
WHERE f.delete_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM feedback_messages m
    WHERE m.feedback_id = f.id
      AND m.delete_at IS NULL
      AND m.metadata ->> 'source' = 'feedback_initial'
  );

SELECT indexname
FROM pg_indexes
WHERE tablename = 'feedback_messages'
  AND indexname = 'uniq_feedback_messages_customer_client_active';
```

第一条查询应返回 `0`，第二条应返回唯一索引。

## 发布与灰度

1. 先部署 API Gateway 的 scoped-token 分支，确认 `/workshop/v2/feedback/*` 经网关可达。
2. 按原流程从 Workshop 项目根目录执行 `./deploy.sh prod`，不要修改部署脚本。
3. 健康检查：`GET /workshop/v2/public/health`。
4. 先在独立测试项目配置控制台 `VITE_FEEDBACK_V2_PROJECT_IDS=<project_id>`，并让该项目的宿主服务开始交换 token。
5. 验证 token 过期刷新、跨用户隔离、首条消息、图片上传策略、幂等重试、开发者回复和待办状态回写。
6. 观察错误率和 OSS CORS，再逐项目扩大该环境变量；未列入的项目继续走 V1。

## 回滚

- 灰度开关回滚：从 `VITE_FEEDBACK_V2_PROJECT_IDS` 移除项目并重新发布控制台/SDK，停止该项目新增 V2 SDK 流量，不需要数据库回滚。
- 应用回滚：可直接部署上一个 Workshop 或网关镜像；V1 数据与接口不受 V2 表字段影响。
- 数据库回滚：`20260715_feedback_sdk_v2_hardening_down.sql` 只删除幂等字段和索引。历史首条消息回填是前向数据迁移，绝不在已有真实 V2 会话后直接删除。
- 如需回到迁移前的完整数据状态，停止 V2 灰度并恢复发布前备份到受控窗口；恢复前确认不丢失迁移后真实用户的新消息。
