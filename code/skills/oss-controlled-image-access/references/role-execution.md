# 角色执行细节

## 服务端仓库

agent 可直接做：

- 找配置结构、路由注册、图片 URL 生成函数。
- 增加 OSS 配置字段。
- 增加 OSS 签名服务。
- 增加图片网关路由。
- 修改业务接口输出稳定图片网关 URL。
- 补最小测试或验证命令。

服务端必须实现：

```go
type OSSConfig struct {
    PublicBaseURL          string
    Endpoint               string
    Bucket                 string
    CredentialsMode        string
    AccessKeyID            string
    AccessKeySecret        string
    ECSRAMRoleName         string
    ECSRAMRoleMetadataURL  string
    ImageGatewayBaseURL    string
    SignedURLTTLSeconds    int64
    CredentialRefreshEarly int64
    AllowedPrefixes        []string
}
```

图片 URL 解析原则：

```go
func resolvePublicImageURL(value string) string {
    text := strings.TrimSpace(value)
    if text == "" {
        return text
    }
    if strings.HasPrefix(strings.ToLower(text), "http://") ||
        strings.HasPrefix(strings.ToLower(text), "https://") {
        return text
    }
    base := strings.TrimRight(config.LoadConfig().OSS.ImageGatewayBaseURL, "/")
    if base == "" {
        return text
    }
    return base + "/" + strings.TrimLeft(text, "/")
}
```

网关 handler 必须：

- 去掉 `objectKey` 开头的 `/`。
- 拒绝空 key。
- 拒绝 `..`、反斜杠等路径穿越。
- 拒绝 `http://` 和 `https://`。
- 只允许已知前缀，例如 `covers/`、`avatars/`。
- 生成短时 OSS GET 签名 URL。
- 返回 `302 Found`，`Location` 为签名 URL。
- 对 `302` 响应设置 `Cache-Control: no-store`。

签名逻辑封装：

```go
GenerateSignedGetURL(objectKey string, ttl time.Duration) (string, error)
```

凭证和签名要求：

- 支持至少一种凭证模式；生产推荐 ECS RAM 角色，快速跑通可用 RAM 用户 AccessKey。
- 使用 STS 临时凭证时，签名 URL 必须带 `security-token`。
- 使用 OSS V1 签名且带 `security-token` 时，`security-token` 必须参与 canonicalized resource 的签名串。
- 测试必须覆盖静态 AccessKey、ECS RAM 角色临时凭证、非法 object key、非允许前缀和 `SignatureDoesNotMatch` 可防回归场景。

日志规则：不要打印完整签名 URL。

## 客户端仓库

agent 可直接做：

- 找 API service、图片 URL 归一化函数、图片加载入口、分享页、分享参数或 `og:image`。
- 删除或绕开自行拼 OSS/CDN base URL 的逻辑，例如 `VITE_OSS_PUBLIC_BASE_URL`、`NEXT_PUBLIC_OSS_PUBLIC_BASE_URL` 或硬编码 Bucket 域名。
- 确认图片 URL 被当成不透明字符串。
- 验证图片加载库是否跟随 302。
- 增加失败重试：重试稳定网关 URL 或刷新业务数据。
- 检查浏览器缓存、Service Worker、localStorage、IndexedDB、状态管理和图片预加载，确认不会持久化 OSS 签名 URL。
- 更新前端 `.env.example` 或构建配置：移除公开 OSS base；如必须兼容 object key，使用网关 base，并标注为过渡配置。
- 检查构建产物或源码搜索结果，确认没有 Bucket 裸域名、`OSSAccessKeyId`、`AccessKeySecret`。

agent 不应做：

- 不在客户端实现 OSS 签名。
- 不在客户端保存 AccessKey。
- 不把 302 后的 OSS 签名 URL 当长期缓存地址。
- 不在客户端从 `Location` 响应头提取并保存 OSS 签名 URL。

典型 Web 迁移：

```ts
export function resolveAssetUrl(url: string | undefined): string {
  const text = typeof url === 'string' ? url.trim() : ''
  if (!text) return ''
  if (/^https?:\/\//i.test(text) || text.startsWith('data:')) return text
  return text
}
```

如果服务端暂时仍返回 object key，短期兼容可以拼网关 base，但不能拼 OSS 公网 base：

```ts
const gatewayBase = String(import.meta.env.VITE_ASSET_GATEWAY_BASE_URL || '').replace(/\/+$/, '')
return gatewayBase ? `${gatewayBase}/${text.replace(/^\/+/, '')}` : text
```

更完整的客户端迁移细节见 [client-share-page-migration.md](client-share-page-migration.md)。

## 同仓多角色

当同一仓库同时包含服务端和客户端：

1. 先完成服务端图片网关和业务接口 URL 输出。
2. 再修改客户端消费逻辑。
3. 检查客户端是否仍有公开 OSS/CDN base URL 拼接、签名 URL 持久缓存或分享元数据旧逻辑。
4. 运行服务端测试和客户端构建/类型检查中成本最低的一组验证。
5. 如果能启动本地服务，验证一张 object key 图片从业务接口到页面展示的完整链路。

## 分享页或 SSR

agent 可直接做：

- 页面内图片使用稳定网关 URL。
- `og:image` 第一阶段可先使用同一个网关 URL。
- 确认 HTML 缓存、SSR 缓存或静态生成结果不写入 OSS 签名 URL。
- 确认预加载、JSON-LD、`twitter:image` 等元数据不使用 OSS 签名 URL。
- 如果社交平台无法稳定抓取 302 或签名图片，记录后续缺口：生成低清公开分享卡片图。

不要因为社交爬虫边界情况阻塞初版，除非用户当前任务就是分享卡片兼容性。

## 运维仓库

agent 可直接做：

- 补环境变量模板。
- 补 secret 配置说明。
- 补部署形态说明：源码构建、镜像包部署、CI/CD 或托管平台。
- 补入口拓扑说明：DNS、入口机、反向代理/网关、后端服务地址。
- 补日志脱敏说明。
- 补 OSS 监控、访问日志、费用告警操作说明。
- 把 Bucket 私有化写成最后发布门禁。

agent 不应做：

- 不把 AccessKeySecret 写进仓库。
- 不擅自执行生产 Bucket 私有化。

## 文档仓或未知仓库

agent 应输出：

- 稳定图片网关 URL 契约。
- 服务端改造清单。
- 客户端改造清单。
- 运维配置清单。
- 人类云控制台操作清单。
- 验收顺序和阻塞项。
