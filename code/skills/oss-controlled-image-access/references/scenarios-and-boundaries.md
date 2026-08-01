# 场景和边界

## 真实使用场景

1. 用户在服务端仓库中说：“用这个 skill 带我实现 OSS 图片可控访问。”
   - agent 先扫描服务端配置、路由和图片 URL 生成逻辑。
   - agent 直接实现图片网关、OSS 签名服务和业务接口 URL 输出。
   - agent 在需要 OSS endpoint、Bucket、AccessKey 配置时让用户配置到安全位置。

2. 用户在客户端仓库中说：“服务端要改成图片网关，我这边要怎么配合？”
   - agent 不实现 OSS 签名。
   - agent 找 API service、URL 归一化函数、图片加载、缓存、分享页和 `og:image` 代码。
   - agent 删除或替换公开 OSS/CDN base URL 拼接，例如 `VITE_OSS_PUBLIC_BASE_URL`。
   - agent 确保客户端把稳定网关 URL 当不透明字符串使用，并验证或说明 302 跟随和签名 URL 不持久化。

3. 用户在同时包含服务端和客户端的仓库中说：“一步一步帮我接起来。”
   - agent 先改服务端，再改/验证客户端。
   - agent 尽量做端到端最小验证。
   - agent 不在客户端迁移完成前建议 Bucket 私有化。
   - agent 最后输出人类需要完成的云资源和私有化步骤。

4. 用户在运维仓库中说：“帮我把部署配置补好。”
   - agent 补环境变量模板和 secret 说明。
   - agent 先判断部署形态和入口拓扑，避免把镜像包部署误当源码构建。
   - agent 不要求用户立刻把 Bucket 改私有。
   - agent 把 Bucket 私有化放到最后发布门禁。

5. 用户只在文档仓或空目录中说：“我不知道怎么开始。”
   - agent 输出接入契约、跨仓步骤、人类操作清单和验收计划。
   - agent 不假装已经改完服务端或客户端。

6. 用户在上线排障中贴出 `404`、`502`、`SignatureDoesNotMatch`、`lstat /core-service`、容器名冲突或 Caddy/nginx/API Gateway 配置。
   - agent 先判断错误属于部署、入口网关、网络、HTTP 方法、RAM/STS 签名还是 OSS 权限。
   - agent 按后端本机、入口机到后端、公网域名、浏览器/客户端的层次验证。
   - agent 不把所有问题都归咎于 OSS 或 RAM。

7. 用户说：“后端网关通了，接下来前端/客户端怎么改？”
   - agent 读取客户端迁移 reference。
   - agent 先检查业务接口实际返回的图片字段，再检查客户端是否二次拼接 OSS/CDN base。
   - agent 覆盖列表、详情、头像、上传预览、分享页、SSR/OpenGraph、缓存和构建环境变量。
   - agent 输出客户端验证证据或跨仓 handoff，不把后端 302 成功当成全链路完成。

## 适用边界

使用本 skill：

- 从 OSS 公开直链迁移到服务端可控访问。
- 实现或设计稳定图片网关 URL。
- 服务端生成短时 OSS GET 签名 URL。
- 客户端或分享页配合网关图片加载。
- 前端/客户端从公开 OSS/CDN base URL 拼接迁移到稳定网关 URL 消费。
- 规划 RAM 权限、部署环境变量、secret 管理、Bucket 私有化顺序。
- 初版先不用 CDN，后续可升级 CDN。

不使用本 skill：

- 只问 OSS 或 CDN 价格对比。
- 只做通用 DDoS、安全科普，不涉及项目接入。
- 只需要阿里云控制台手工操作且不需要代码、配置或跨角色协作。
- 已明确采用完全不同架构，例如后端代理全部图片流量且不使用 OSS 签名。

## 默认假设

- 初版目标是“先跑通流程，再切私有”。
- 图片主要是封面、头像、分享页图片等可展示资源。
- 数据库理想状态保存 OSS object key，而不是永久公开 URL。
- 客户端可以跟随 HTTP 302；若是 Native、小程序或特殊图片库，需要实测。
- 服务端业务接口是客户端最终契约来源；前端最好不需要知道网关 base，除非为历史 object key 做过渡兼容。
