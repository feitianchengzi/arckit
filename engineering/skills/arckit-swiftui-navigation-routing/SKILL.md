---
name: arckit-swiftui-navigation-routing
description: SwiftUI 导航、路由和外部入口统一 skill。用于 NavigationStack、NavigationPath、Tab、sheet、fullScreenCover、modal、Deep Link、Universal Link、URL Scheme、Widget 点击、Push 通知、分享链接跳转、路由解析/生成 round-trip 测试。用户提到跳转、路由、分享打开 App、Universal Link、deeplink、scheme、Widget 跳详情、Push 打开页面、导航混乱时使用。
---

# ArcKit SwiftUI Navigation Routing

## 目标

统一 App 内导航和 App 外入口，确保按钮、Universal Link、URL Scheme、Widget、Push、分享落地页都能进入同一套 route/parser/router。

## 执行流程

1. 列出入口和目标：App 内点击、Tab、sheet、fullScreenCover、Universal Link、scheme、Widget、Push、分享落地页。
2. 定义 route/target 类型，表达业务目标，不表达 UI 细节。
3. 定义 URL builder 和 parser；公开链接使用跨设备可解析 id。
4. 将 `onOpenURL`、`onContinueUserActivity`、Widget URL、Push payload 统一转成 route。
5. UI 层消费 route，不在多个 View 中重复解析 URL。
6. 为链接生成/解析保留 round-trip 测试或明确检查点。
7. 涉及 Universal Link 时，同时检查 AASA、Associated Domains、fallback 页和发布配置。

## 读取资源

- 路由和外部入口 playbook：`references/routing-playbook.md`
- 导航代码模式：`references/code-patterns.md`
- 发布配置：`arckit-swiftui-release-observability`
- 系统入口：`arckit-swiftui-system-integration`

## 核心规则

- 所有外部入口进入统一 parser/router。
- Universal Link 优先作为公开分享链接。
- URL Scheme 用于 Widget、调试、fallback 唤起和历史兼容。
- 路由对象只管理导航状态，不夹业务加载逻辑。

## 最低交付标准

- 有统一 route/target 表达。
- 外部入口统一进入 parser/router。
- 无效链接有降级或忽略策略。
- 公开分享链接不依赖本机临时 id。
- 链接生成和解析一致性可验证。

## 降级/停止条件

- 单个 NavigationStack 内普通按钮跳转，不必做完整 deep link 设计。
- 页面内局部 tab/segmented control 不属于全局路由。
- 纯展开/折叠 UI 状态不要进入全局 route。
