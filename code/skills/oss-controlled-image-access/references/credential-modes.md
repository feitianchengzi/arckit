# 凭证模式

## 先确认身份类型

阿里云 RAM 里常见对象不同：

- RAM 用户：可以创建长期 `AccessKeyId` / `AccessKeySecret`。容易配置，适合先跑通或非 ECS 环境，但长期密钥需要严格 secret 管理。
- 用户组：给多个 RAM 用户批量授权；本流程通常不用它作为服务端身份。
- RAM 角色：推荐生产方式。ECS、ACK、函数计算等运行环境扮演角色后拿临时凭证，不应要求用户在聊天中提供长期密钥。

不要把 RAM 角色说成会直接给长期 `AccessKeySecret`。如果用户已经创建角色，先判断服务端是否运行在能扮演该角色的环境。

## 模式选择

### access_key

适用：

- 快速跑通流程。
- 服务不在阿里云 ECS/ACK/函数计算上。
- 代码还未支持运行环境临时凭证。

配置示例：

```env
OSS_CREDENTIALS_MODE=access_key
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
```

要求：

- `AccessKeySecret` 只能进入服务器环境变量、部署平台 secret、Secret Manager 或本机 `.env`。
- 不要把 `AccessKeySecret` 发到聊天里。
- 生产权限应收窄到 `oss:GetObject` 的图片前缀。

### ecs_ram_role

适用：

- core-service 跑在阿里云 ECS 上。
- ECS 实例已绑定 RAM 角色。
- 服务端代码支持访问 ECS metadata 临时凭证。

配置示例：

```env
OSS_CREDENTIALS_MODE=ecs_ram_role
OSS_ECS_RAM_ROLE_NAME=your-role-name
OSS_ECS_RAM_ROLE_METADATA_URL=http://100.100.100.200/latest/meta-data/ram/security-credentials
OSS_CREDENTIAL_REFRESH_EARLY_SECONDS=300
```

说明：

- `OSS_ECS_RAM_ROLE_METADATA_URL` 是阿里云 ECS metadata 固定入口，ECS 内部访问；通常可原样使用。
- `OSS_ECS_RAM_ROLE_NAME` 必须替换为用户实际绑定到 ECS 的角色名。
- `OSS_CREDENTIAL_REFRESH_EARLY_SECONDS=300` 表示临时凭证过期前 5 分钟刷新；通常可原样使用。
- 如果 core-service 在 Docker 内运行，只要容器网络能访问 ECS metadata 即可；若访问不到，需要检查容器网络、安全策略或改用其他凭证模式。

验证：

```bash
curl http://100.100.100.200/latest/meta-data/ram/security-credentials
curl http://100.100.100.200/latest/meta-data/ram/security-credentials/{roleName}
```

第二条应返回包含 `Code: Success`、`AccessKeyId`、`AccessKeySecret`、`SecurityToken`、`Expiration` 的 JSON。不要把完整 JSON 发到聊天里；可以只说明 `Code` 和 role 名。

### 其他运行环境

ACK、函数计算、其他云服务器、本地 Docker 或跨云部署不要直接套用 ECS metadata。需要先确认对应凭证来源，例如：

- ACK RAM Role for ServiceAccount / workload identity。
- 函数计算运行角色。
- 部署平台 secret。
- STS AssumeRole 服务端中转。

无法确认时，输出待适配 handoff，不要假装 `ecs_ram_role` 已完成。

## 权限建议

初期临时验证可以用只读 OSS 权限，但生产建议收窄到图片目录：

```text
Action: oss:GetObject
Resource: acs:oss:*:*:{bucket}/covers/*
Resource: acs:oss:*:*:{bucket}/avatars/*
```

如果项目还有其他图片目录，把目录加入白名单；不要默认给全 Bucket 管理权限。

## STS 签名 URL 规则

使用 STS 临时凭证生成 OSS V1 signed URL 时：

- URL query 必须包含 `OSSAccessKeyId`、`Expires`、`Signature`。
- 如果凭证包含 `SecurityToken`，URL query 必须包含 `security-token`。
- `security-token` 不只是 query 参数，还必须参与 `StringToSign` 的 canonicalized resource。

示意：

```text
StringToSign:
GET


{expires}
/{bucket}/{objectKey}?security-token={SecurityToken}
```

如果签名时漏掉 `?security-token=...`，OSS 会返回：

```text
SignatureDoesNotMatch
The request signature we calculated does not match the signature you provided.
```

服务端测试必须覆盖：

- 静态 AccessKey 签名 URL。
- STS 凭证签名 URL 包含 `security-token`。
- STS 场景下 `security-token` 参与签名串。
- 签名 URL 不泄露 `AccessKeySecret`。

## Env 输出标注规则

给用户 env 模板时必须区分：

- 可原样使用：例如 ECS metadata URL、TTL、刷新提前量的默认值。
- 项目契约默认：例如 `covers,avatars`，如果项目目录不同必须调整。
- 必须替换：Bucket、endpoint、API 域名、RAM role 名、AccessKeyId/Secret。

不要只贴一段 env 然后让用户猜哪些值要改。
