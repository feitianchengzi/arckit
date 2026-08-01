# 执行阶段

## 契约阶段

先定义稳定契约，再改代码。

最小契约：

```text
GET {image_gateway_base_url}/{objectKey}
```

示例：

```text
https://api.example.com/assets/covers/2026/xxx.webp
```

默认参数：

```text
allowedPrefixes: covers/, avatars/
signedUrlTTL: 3600 seconds
redirectStatus: 302 Found
redirectCacheControl: no-store
```

迁移期策略：

- 相对路径或 object key：转成图片网关 URL。
- 第三方 `http/https` 图片：可以先原样返回，后续清洗。
- 已是 OSS 公开 URL：优先规划迁移为 object key；短期不确定时先不要破坏现有展示。

## 服务端阶段

目标：

```text
object key -> 稳定网关 URL -> OSS 短时签名 URL
```

步骤：

1. 增加 OSS 配置读取。
2. 增加 OSS SDK 或签名服务。
3. 增加图片网关路由。
4. 增加 object key 白名单和路径安全校验。
5. 修改业务接口的图片 URL 生成逻辑。
6. 添加最小测试。

推荐配置：

```env
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket
OSS_CREDENTIALS_MODE=ecs_ram_role
OSS_ECS_RAM_ROLE_NAME=your-role-name
OSS_ECS_RAM_ROLE_METADATA_URL=http://100.100.100.200/latest/meta-data/ram/security-credentials
OSS_IMAGE_GATEWAY_BASE_URL=https://api.example.com/assets
OSS_SIGNED_URL_TTL_SECONDS=3600
OSS_CREDENTIAL_REFRESH_EARLY_SECONDS=300
```

如果选择 RAM 用户 AccessKey 快速跑通，改用：

```env
OSS_CREDENTIALS_MODE=access_key
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
```

凭证模式细节见 [credential-modes.md](credential-modes.md)。

## 客户端和分享页阶段

目标：客户端不理解 OSS，只消费服务端返回的 URL。

步骤：

1. 找到 API service、图片 URL 归一化函数、图片组件、缓存、分享页和 `og:image` 入口。
2. 确认业务接口返回的图片字段是稳定网关 URL，或有明确 object key 兼容策略。
3. 删除或替换自行拼 OSS/CDN base URL 的逻辑；前端不得再依赖 `VITE_OSS_PUBLIC_BASE_URL` 这类公开 OSS base。
4. 确认图片加载支持 HTTP 302，且不会把 302 后的 OSS 签名 URL 持久缓存。
5. 失败时重试稳定网关 URL 或刷新业务数据。
6. 分享出去的是业务页面 URL，不是 OSS 签名 URL；分享元数据优先使用稳定网关 URL。

详细迁移见 [client-share-page-migration.md](client-share-page-migration.md)。

## 运维阶段

目标：部署时能安全提供配置，且最后再切私有。

步骤：

1. 补环境变量模板，并标注固定值、默认值和必须替换值。
2. 判断部署形态：源码构建、镜像包、CI/CD 或托管平台。
3. 判断公网入口拓扑：域名解析、入口机、反向代理/网关、后端地址。
4. 把 AccessKey 放到 secret 管理，或把 ECS RAM 角色绑定到实例。
5. 确认日志不会打印完整签名 URL query。
6. 打开 OSS 访问日志、云监控或费用告警。
7. 把 Bucket 私有化作为最终发布门禁。

## 私有化阶段

前置条件：

- 后端本机网关 URL 能返回 `302` 签名 URL。
- 入口机能访问后端服务。
- 公网域名网关 URL 能显示图片。
- 客户端/分享页能显示图片，且 Network 或客户端日志显示入口是稳定网关 URL。
- 服务端能生成 OSS 签名 URL。
- 部署环境已有 OSS 配置和凭证模式。
- 有回滚方案。

动作：

1. 人类在 OSS 控制台把 Bucket ACL 改为私有。
2. 验证 OSS 裸 URL 不能直接访问。
3. 验证图片网关 URL 仍能显示图片。
4. 若失败，回滚 Bucket ACL 或恢复旧 URL 策略。

## 后续 CDN 升级

只有 OSS-only 网关跑通后，或用户明确要求 CDN 时才做。

升级时保持客户端契约不变：

```text
同一个稳定图片网关 URL
-> 服务端生成 CDN 鉴权 URL
-> CDN 返回缓存图片
-> CDN 回源 OSS
```
