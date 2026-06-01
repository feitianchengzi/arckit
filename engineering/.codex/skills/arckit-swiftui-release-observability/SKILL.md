---
name: arckit-swiftui-release-observability
description: SwiftUI App 发布配置和线上观测 skill。用于 entitlements、Associated Domains、AASA、App Groups、Push capability、Privacy Manifest、Info.plist 权限文案、App Store/TestFlight、构建配置、版本发布、埋点、日志、崩溃、MetricKit、性能指标、线上问题排查。用户提到发布、上架、TestFlight、证书、能力配置、Universal Link 部署、隐私清单、埋点、日志、崩溃、线上监控时使用。
---

# ArcKit SwiftUI Release Observability

## 目标

让 SwiftUI App 的发布配置和线上反馈闭环可验证。Agent 执行时不要只改代码，要同时检查 capability、entitlements、服务端文件、隐私声明、TestFlight 验证、日志和关键事件。

## 执行流程

1. 列出功能涉及的发布能力：Bundle ID、Signing、entitlements、Associated Domains、AASA、App Groups、Push、Background Modes、Keychain Sharing、URL Types、Privacy Manifest、Info.plist 权限文案。
2. 检查代码、Xcode capability、entitlements、Developer 后台、服务端文件是否成套一致。
3. 对 Universal Link、Widget、Push、权限、分享落地页等端到端路径写出验证方式。
4. 补齐隐私和权限文案：实际用到什么能力，就声明什么能力；文案和功能一致。
5. 定义关键观测：事件、错误日志、崩溃上下文、性能指标、网络失败、长流程耗时。
6. 对日志和埋点做脱敏：不记录 token、API Key、用户敏感内容或大对象。
7. 发布前给出构建、TestFlight、冷启动/热启动 deep link、弱网、权限拒绝等验证清单。

## 读取资源

- entitlements、Associated Domains、AASA、Privacy Manifest、TestFlight、埋点、日志、崩溃、指标：`references/release-observability.md`
- 具体系统能力接入：`arckit-swiftui-system-integration`
- Universal Link/Deep Link 路由解析：`arckit-swiftui-navigation-routing`
- 性能指标和回归：`arckit-swiftui-performance-quality`

## 核心规则

| 场景 | 执行要求 |
| --- | --- |
| Universal Link | App、AASA、域名、fallback、冷热启动一起验证 |
| Widget/App Group | capability、group id、共享容器一致 |
| Push | capability、权限、token、服务端链路一致 |
| Privacy | Manifest/Info.plist 与真实使用匹配 |
| 埋点 | 事件名稳定，属性可控，不重复 |
| 日志 | 分类清楚，线上脱敏 |

## 最低交付标准

- 发布能力配置成套，不能只改 Swift 代码。
- 权限文案、Privacy Manifest、entitlements 与实际功能一致。
- 关键用户路径有开始、成功、失败、取消或等价观测。
- 日志不泄漏敏感信息。
- TestFlight/发布前有可执行验证清单。

## 降级/停止条件

- 本地原型或纯内部重构不强行引入埋点体系。
- 需要开发者后台或服务端文件但本地不可完成时，提交代码侧变更并记录明确外部待办。
- 如果问题只是系统 API 接入实现，先使用 `arckit-swiftui-system-integration`，发布 skill 负责最终配置和验证。
