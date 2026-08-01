# 客户端和分享页迁移

本文件在当前仓库包含 `client-repo`、`share-page-repo`，或服务端改造完成后需要交接客户端时读取。目标是让客户端只消费稳定图片网关 URL，不理解 OSS、不拼公开 OSS/CDN base URL、不缓存短时签名 URL。

## 迁移目标

客户端应看到并保存的长期 URL 只有两类：

- 服务端业务接口返回的稳定图片网关 URL，例如 `https://api.example.com/anime-calendar/v1/public/assets/covers/xxx.jpg`。
- 仍处于迁移期的第三方 `http/https` 图片 URL。

客户端不应依赖：

- OSS Bucket 裸域名。
- OSS 签名 URL 中的 `Expires`、`Signature`、`OSSAccessKeyId`、`security-token`。
- 本地构建变量中的公开 OSS/CDN base URL。

## 代码搜索入口

优先搜索：

```text
OSS_PUBLIC_BASE_URL
VITE_OSS_PUBLIC_BASE_URL
CDN
cdn
oss
resolveAssetUrl
resolveImageKeyUrl
imageUrl
coverImage
avatar
images_large
images_common
images_medium
images_small
images_grid
og:image
preload
prefetch
ServiceWorker
cache
```

还要检查：

- API service 层是否把 object key 拼成公开 OSS/CDN URL。
- 图片组件是否直接消费业务接口 URL。
- 列表、详情、搜索、收藏、用户头像、后台上传预览是否共用同一套 URL 归一化函数。
- 分享页、SSR 模板、OpenGraph 元数据是否使用稳定网关 URL。
- 构建配置和 `.env.example` 是否仍要求前端配置 OSS 公网 base URL。

## Web 客户端改造

推荐规则：

- 业务接口已经返回 `http/https` 时，前端直接使用，不再改写。
- 业务接口仍返回 object key 时，优先推动服务端修正；短期必须兼容时，用 `ASSET_GATEWAY_BASE_URL` 这类网关 base，而不是 OSS 公网 base。
- 前端 URL 工具函数只做本地上传路径、空值和历史兼容处理，不生成 OSS 签名，不拼 Bucket 裸域名。
- `<img>`、CSS background、预加载标签、图片查看器和上传预览都使用同一套 URL 解析规则。
- 不把 302 后的 OSS 签名 URL 写入状态管理、localStorage、IndexedDB、持久缓存或业务数据库。

反例：

```ts
const ossBase = import.meta.env.VITE_OSS_PUBLIC_BASE_URL
return `${ossBase}/${objectKey}`
```

推荐迁移成：

```ts
if (/^https?:\/\//i.test(text) || text.startsWith('data:')) return text
const gatewayBase = import.meta.env.VITE_ASSET_GATEWAY_BASE_URL || ''
return gatewayBase ? `${gatewayBase.replace(/\/+$/, '')}/${text.replace(/^\/+/, '')}` : text
```

如果服务端已经保证所有业务图片字段都是完整稳定网关 URL，前端应进一步简化为“完整 URL 直接用，非 URL 只作为历史兼容或报错观察”。

## Native、小程序和特殊图片库

必须实测：

- 图片组件是否跟随 HTTP 302。
- 302 后跨域 HTTPS 证书是否被接受。
- 图片库是否对同一稳定 URL 做过长磁盘缓存，导致签名过期后仍读失败。
- 是否有 HEAD 预检；如果有，服务端或网关是否支持 HEAD，或客户端是否能改为 GET。
- 是否有 Referer、User-Agent、Range 请求、WebP/AVIF 解码限制。

如果图片库不能可靠跟随 302，有两个可选后续方案：

- 服务端返回短时签名 URL 给该客户端，但禁止持久化，并需要更严格缓存控制。
- 服务端代理图片流量或接 CDN 鉴权，保持客户端 URL 稳定。

这两个方案是后续适配，不是默认初版。

## 分享页、SSR 和 OpenGraph

分享页必须区分三类 URL：

- 页面 URL：用户分享出去的业务页面地址。
- 页面内图片 URL：稳定图片网关 URL。
- 爬虫抓取图片：优先使用稳定网关 URL；如果目标平台不抓 302 或不接受短时签名跳转，记录后续低清公开分享卡片图方案。

SSR/SSG 检查点：

- `og:image`、`twitter:image`、JSON-LD、预加载 `<link rel="preload" as="image">` 不使用 OSS 签名 URL。
- 服务端渲染过程不把一次性签名 URL 写进 HTML 缓存。
- HTML 页面缓存时间不能长于其中图片签名 URL 的有效期；更推荐 HTML 缓存稳定网关 URL。

## 缓存和错误恢复

客户端缓存原则：

- 可以缓存稳定网关 URL。
- 不持久缓存 OSS 签名 URL。
- 图片加载失败时，先重新请求稳定网关 URL；如果业务数据可能过期，再刷新业务接口。
- 不用 `curl -I` 或 HEAD 结果推断图片不可用，除非确认网关支持 HEAD。

建议错误处理：

- `403` 或 OSS `SignatureDoesNotMatch`：清除短时 URL 缓存，重新请求稳定网关 URL。
- `404`：确认 object key 是否真实存在，或业务字段是否仍是旧 URL。
- `502`：先排查入口网关到后端，不先改客户端。

## 构建和环境变量

前端构建配置应移除或降级：

- `VITE_OSS_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_OSS_PUBLIC_BASE_URL`
- `OSS_PUBLIC_BASE_URL` 在前端包中的使用

如仍需要兼容 object key，可改为网关 base：

```env
VITE_ASSET_GATEWAY_BASE_URL=https://api.example.com/anime-calendar/v1/public/assets
```

但推荐最终状态是：前端无需知道图片网关 base，所有业务接口直接返回完整稳定 URL。

## 最小验收

客户端迁移完成前至少验证：

- 业务接口返回图片字段是稳定网关 URL，或客户端历史兼容明确可控。
- 前端构建产物不包含 OSS Bucket 裸域名和 AccessKey 字样。
- 列表页、详情页、头像、上传预览、分享页均能显示图片。
- 浏览器 Network 中首次请求是稳定网关 URL，随后可以看到 302 到 OSS 签名 URL。
- 刷新页面后仍请求稳定网关 URL，而不是复用旧签名 URL。
- Bucket 改私有后，裸 OSS URL 失败，客户端页面仍显示图片。

## 跨仓客户端 handoff

当前仓库不能改客户端时，输出：

```yaml
client_migration_handoff:
  image_fields_from_server:
    - "images.large/common/medium/small/grid"
    - "avatar"
    - "cover_image"
  stable_gateway_base: ""
  must_remove_or_replace:
    - "VITE_OSS_PUBLIC_BASE_URL"
    - "client-side OSS/CDN base URL concatenation"
    - "persistent cache of signed OSS URL"
  must_verify:
    - "image component follows 302"
    - "list/detail/avatar/share pages display images"
    - "browser or app refresh still uses stable gateway URL"
    - "private Bucket blocks naked OSS URL but gateway URL still works"
  special_clients:
    - "Native、小程序、SSR、Service Worker 或图片代理如存在，需要单独实测"
```
