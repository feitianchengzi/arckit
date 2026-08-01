# 人类协作动作

## 需要人类介入的情况

agent 不能直接完成这些事，除非用户已经提供安全工具或明确授权：

- 登录阿里云控制台。
- 创建 RAM 用户或 RAM 角色。
- 查看或生成 AccessKeySecret。
- 配置生产 secret。
- 修改生产 Bucket ACL。
- 打开生产监控、费用告警或访问日志。
- 执行发布、回滚或生产验证。

## 给用户的操作说明格式

需要人类介入时，使用直接说明：

```text
现在需要你做：
1. 打开阿里云 OSS 控制台。
2. 进入目标 Bucket。
3. 先不要改 ACL；确认 Bucket 名称和 region。
4. 把 Bucket 名称和 endpoint 告诉我；AccessKeySecret 不要发到聊天里。
```

## RAM 权限

建议人类创建专用 RAM 用户或 RAM 角色，给服务端最小读权限。二者用途不同：

- RAM 用户：生成长期 AccessKey，适合快速跑通或非 ECS 环境。
- RAM 角色：推荐生产方式，绑定到 ECS/ACK/函数计算等运行环境，由服务端获取临时凭证。

不要把 RAM 角色说成可以直接生成长期 `AccessKeySecret`。如果用户已创建 RAM 角色，下一步是绑定运行环境并配置对应凭证模式，不是索要 secret。

最小读权限：

```text
Action: oss:GetObject
Resource: acs:oss:*:*:{bucket}/covers/*
Resource: acs:oss:*:*:{bucket}/avatars/*
```

如果项目还有其他图片目录，把目录加入白名单；不要直接给全 Bucket 权限，除非用户明确处于临时验证阶段并接受风险。

## Secret 配置

如果使用 RAM 用户 AccessKey，让用户把这些值配置到安全位置：

```env
OSS_CREDENTIALS_MODE=access_key
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_IMAGE_GATEWAY_BASE_URL=https://api.example.com/assets
OSS_SIGNED_URL_TTL_SECONDS=3600
```

如果使用 ECS RAM 角色，推荐配置：

```env
OSS_CREDENTIALS_MODE=ecs_ram_role
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket
OSS_ECS_RAM_ROLE_NAME=your-role-name
OSS_ECS_RAM_ROLE_METADATA_URL=http://100.100.100.200/latest/meta-data/ram/security-credentials
OSS_IMAGE_GATEWAY_BASE_URL=https://api.example.com/assets
OSS_ALLOWED_PREFIXES=covers,avatars
OSS_SIGNED_URL_TTL_SECONDS=3600
OSS_CREDENTIAL_REFRESH_EARLY_SECONDS=300
```

说明：

- `OSS_ECS_RAM_ROLE_METADATA_URL` 通常可原样使用，只适用于 ECS metadata。
- `OSS_ALLOWED_PREFIXES` 是项目允许访问的 object key 前缀，默认 `covers,avatars`，如果项目不同要调整。
- `OSS_SIGNED_URL_TTL_SECONDS=3600` 和 `OSS_CREDENTIAL_REFRESH_EARLY_SECONDS=300` 是推荐默认值，可按安全和缓存需求调整。
- `OSS_ECS_RAM_ROLE_NAME`、Bucket、endpoint、API 域名必须替换为真实值。

聊天中可以让用户提供：

- region
- endpoint
- Bucket 名称
- 允许前缀
- TTL
- RAM 角色名称
- 是否已完成 secret 配置

聊天中不要索要：

- `OSS_ACCESS_KEY_SECRET`
- STS token
- 完整签名 URL

## UI 协作

如果当前环境有 UI 或 `request_user_input`，优先用于非敏感确认：

- 当前仓库角色是否识别正确。
- 允许前缀选择。
- TTL 选择。
- 是否现在只生成 handoff。
- 是否进入 Bucket 私有化门禁。

如果有安全 secret store UI，可以让用户在 UI 中填写密钥；否则只给用户配置说明。

## Bucket 私有化门禁

不要一开始让用户改私有。只有满足以下条件时才要求用户操作：

- 服务端网关 URL 能展示图片。
- 客户端或分享页能展示图片。
- 部署环境已配置 OSS secret。
- 已有回滚方案。

操作说明：

```text
现在可以进入 Bucket 私有化验证：
1. 打开 OSS 控制台，进入目标 Bucket。
2. 将 Bucket ACL 从公共读改为私有。
3. 保存后告诉我“已改私有”。
4. 我会继续验证：OSS 裸 URL 应失败，图片网关 URL 应成功。
```
