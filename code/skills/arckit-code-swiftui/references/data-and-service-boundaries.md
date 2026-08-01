# Data And Service Boundaries

## Service 设计

Service 负责外部能力、API、系统 adapter、缓存或持久化边界。View 只依赖稳定接口，不直接拼 URL、处理 token、解析底层错误码、访问 Keychain 或操作文件路径。

Service API 返回领域模型、稳定错误类型、`Data`、`URL`、MIME type、业务 id 或领域枚举；不要把 Apple UI 类型泄漏到业务层。

## 网络

- 优先使用项目现有 URLSession/APIClient 抽象。
- 使用 async/await，支持取消、超时和错误映射。
- DTO 到领域模型映射放在 service 或 mapper。
- 资源详情响应不默认等于完整领域模型；若页面依赖列表、搜索、推荐位或分享入口携带的摘要字段，service/mapper 必须定义保留、补全或合并策略，并覆盖“详情成功但摘要字段缺失”的路径。
- 错误至少区分网络、认证、权限、业务错误、超时、取消和解析失败。
- token refresh 使用 single-flight，避免并发刷新覆盖。
- 分页明确 cursor/page、去重、刷新和空页策略。
- 上传下载明确文件 URL、MIME type、filename、进度、取消和失败恢复。
- 网络日志脱敏，不记录 token、密钥和完整敏感 payload。

## 本地数据

结构化持久数据沿用 SwiftData/Core Data 或项目当前存储。简单偏好使用 UserDefaults/AppStorage。敏感凭据使用 Keychain。Widget/扩展共享数据放入 App Group container。大文件和图片缓存使用 FileManager、URLCache 或项目缓存 actor。

SwiftData schema 变化需要迁移或读取兼容路径。缓存身份要区分原图、缩略图、fallback、远端 URL 和本地文件。离线同步队列、冲突合并和后台刷新不要写在 View 或 `@Query` 派生逻辑中。

缓存不仅有 payload 生命周期，也有 refresh metadata 生命周期。refresh key 必须表达请求语义，例如范围、筛选、分页、季度、用户维度；同一领域实体的列表摘要、详情补全、用户态、媒体资源不能共用一个通用 `lastSyncedAt` 判断新鲜度。只有对应 payload 成功落库后，才更新对应 refresh metadata。

## 媒体管线

不要在页面散落 `AsyncImage`；优先统一远程图片组件或 loader。图片状态至少表达 loading、success、failure、fallback、retrying。长列表图片尺寸、解码、缓存和取消受控。

上传前把平台图片转换为 `Data`、`URL`、MIME type、filename。头像、证件照或用户原图上传前按项目隐私策略处理 EXIF、位置元数据和方向。

## AI 生成链路

Prompt builder、schema、validator 和 generation service 不写在 View 中。View 只协调输入、生成状态、取消、重试和结果展示。stream 状态区分 connecting、streaming、validating、success、failed、cancelled。生成结果保存前先通过领域校验。

模型输出必须经过结构抽取、decode/parse、领域模型转换、领域校验和质量检查；质量门要在代码里实现，不能只依赖 prompt。涉及积分、额度、订阅或扣费时，区分扣费前失败、扣费后失败、取消和重试，防止重复点击造成权益状态不一致。
