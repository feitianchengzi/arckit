# Platform Integration

## 判断顺序

1. SwiftUI 原生 API 能否覆盖真实体验？能覆盖则使用 SwiftUI。
2. 是否只是展示系统 UI？是则用局部 representable，不进入领域层。
3. 是否是长期业务能力？是则定义 protocol + adapter/service，View 只依赖稳定接口。
4. 是否需要 Info.plist、entitlements、Developer 后台、App Group、Keychain Group、Associated Domains 或 Privacy Manifest？

## Bridge 边界

UIKit/AppKit bridge 隔离在 service、adapter、representable、coordinator 或 platform helper。不要让业务 model 依赖 Apple UI 类型，不要让多个页面各自写系统桥接。

允许 bridge 的典型原因：SwiftUI 无替代、系统 API 必须、性能或物理体验需要、平台控件已内建滚动惯性、缩放锚点、回弹、文本选择或系统面板交互。

## 常见能力

- PhotosPicker：View 可持有选择状态；读取、压缩、上传交给媒体管线；处理取消、读取失败、文件过大。
- Keychain：只存敏感凭据；错误区分未找到、重复写入、系统状态异常、数据格式错误。
- WidgetKit：共享数据小、稳定、可序列化；图片路径 Widget 可访问；点击 URL 使用业务 id。
- 权限：用户理解用途时请求；拒绝后有降级；权限文案和实际用途一致。
- Universal Link：App、AASA、域名、fallback、冷热启动一起验证。

## 分享媒体

分享先拆 payload：文字、URL、本地图片文件、预览和 fallback。`ShareLink` 的 `item` 是核心 payload；`subject`、`message`、`preview` 只传目标系统可能使用的辅助信息。

分享海报要能脱离 App 独立表达内容名称、简介或核心价值、App 名称或 icon、二维码或打开入口。生成图片时显式设置输出逻辑尺寸、实际像素尺寸、renderer scale、JPEG/PNG 格式、压缩质量和文件体积预算。

二维码按最终导出文件验证，检查实际像素、quiet zone、对比度、JPEG 损伤、海报缩放和社交 App 二次压缩。面向微信分享海报，3:4 海报可参考 `1440x1920 @ scale 1`；二维码区域建议至少约 `180px` 实际像素宽高，并保留白底 quiet zone。

系统相册级缩放、平移、惯性和回弹优先使用 `UIScrollView` bridge。外层只传 SwiftUI content、reset id、zoom 状态回调；UIKit 类型不进入业务 model/service。

## 发布配置

代码用到的能力必须和 Bundle ID、Signing Team、entitlements、Associated Domains、App Groups、Push capability、Background Modes、Keychain Sharing、Privacy Manifest、Info.plist 权限文案、URL Types 保持一致。日志和埋点不得记录 API Key、token、完整个人内容、完整敏感 URL 或大对象。

发布能力要在仓库中留下可 review 的配置记录，至少写清 capability、entitlement、服务端文件、验证路径和 owner。例如 Associated Domains 要记录 `applinks:`、AASA URL、cold/warm start 验证和 iOS/server 责任边界。
