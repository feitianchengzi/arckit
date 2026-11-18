---
name: arckit-feedback-platform-integration
description: 引导 Web、iOS、Android 或 WebView 产品接入反馈平台；支持 SDK WebView V2 与独立的原生 API 方案，并处理客户端直连、宿主服务会话、稳定用户身份和可选未读角标。用于创建或选择反馈项目、生成安全配置、实现“提交反馈 / 我的反馈”入口，或升级已有反馈接入；原生 API 覆盖 V1 兼容与已核验的 V2 HTTP 契约，不混用 WebView bridge。
---

# 反馈平台接入

先确认真实接入边界，再采集参数和写代码。已有 WebView、入口、provider 或测试桩只代表客户端壳或占位实现，不代表平台接入完成。

## 硬约束

- 新接入默认使用本 skill 已核验的最新稳定版本，当前为 V2；原生默认 `nativeApiVersion=v2`。只有用户明确指定，或已有项目存在已确认的兼容约束时才使用 V1，并记录原因与依据。参数采集器的能力限制不能改变版本默认值，V2 请求失败不得自动降级；“最新”以已核验的平台契约为准，不猜测更高版本。

- `integrationMode` 先选择 `sdk-webview|native-api`：WebView 选择 `sdkAuthMode=apiKey|session`；原生默认 `nativeApiVersion=v2` 并选择 `nativeAuthMode`，满足上述例外时才选 V1，V1 仅 API Key、V2 支持 API Key 或 Session。
- 原生 V2 直接使用已核验的 HTTP 契约；不得把 SDK `configure` 字段、iframe 消息或 JavaScript bridge 当成 HTTP API。每次维护声明须核对当前配置 UI、路由、handler 与 client，未知或冲突的扩展能力保留限制。
- `apiKey` 直连模式会把 Key 交付到客户端；必须使用项目专用、可轮换的 Key，并明确客户端可提取风险。
- `session` 模式由宿主服务保存 API Key，并按当前用户换取短期 token；API Key 和 token 都不得进入 URL、日志或客户端持久化。
- SDK WebView 常规接入直接使用本 skill 内置的 V2 reference 作为版本化实施契约；不得下载或反向分析 `/sdk-v2/assets/` 来重新发现已记录的 URL、配置字段、方法或消息协议。
- Web 同页、原生 WebView 与跨域 iframe 是不同承载；跨域 iframe 必须使用 `ready -> configure -> open` 宿主协议并校验 origin/source，不能直接访问 iframe 内的 SDK global。
- 默认通过参数 UI 或等价安全配置流采集选择与参数。除非 UI 不可用且用户明确接受客户端源码静态配置，不要求用户在对话中粘贴 API Key。
- 默认只提供一个“反馈中心”入口，内部切换“提交反馈 / 我的反馈”；只有用户要求、平台限制或既有导航强约束时才拆分。

## 主流程

### 1. 识别现状与接入方式

输入：目标平台、现有反馈代码、登录体系和入口位置。

动作：把现状归类为客户端壳、占位实现或完整接入；通过 UI 或等价配置确认 `integrationMode`。若选择 SDK WebView，再确认 `sdkAuthMode`、是否开启 `notificationsEnabled`，以及承载属于原生 WebView、已具备 SDK global 的 Web 同页还是跨域 iframe。原生方案先读取 [原生 API 模式](references/native-api-mode.md)，按最新稳定版默认规则确定版本，再明确认证、网关地址、宿主 endpoint 与可选原生通知；采用 V1 时记录用户指定或兼容约束依据，不能仅因现有示例或采集器使用 V1 而沿用。

退出条件：接入方式、目标平台、入口形态和稳定用户 ID 来源已明确；否则只做安全占位并报告缺口。

### 2. 完成平台与参数门禁

输入：接入方式及所需凭证。

动作：引导用户打开 `https://feedback.feitianchengzi.com` 创建或选择项目。客户端直连需取得数字型 `Project ID` 和项目专用 API Key；宿主服务模式需确认服务端持有这两项并有当前登录用户；原生 API 按已选版本和认证采集，V2 Session 也由宿主服务持有 Key。读取 [安全 UI 与参数回传契约](references/secure-parameter-handoff.md) 执行采集。

退出条件：取得结构化配置结果或明确的运行时配置接口。未满足时不得创建默认启用的空 Key、占位 token 或静态 provider。

### 3. 固化凭证与用户身份

输入：参数回传、登录/游客状态和账号切换行为。

动作：读取 [凭证与用户身份策略](references/credential-and-identity.md)，确定 API Key、Session token、`projectId` 与 `customUserId` 的来源和生命周期。

退出条件：身份稳定、账号切换语义明确，且任何日志、URL、持久化或最终输出都不会泄露凭证。

### 4. 实现所选接入

输入：已通过门禁的结构化配置。

动作：

- `sdk-webview`：读取 [SDK WebView V2](references/sdk-webview-mode.md) 后按承载与认证模式实现；Web 跨域 iframe 额外读取 [Web iframe 宿主协议](references/web-iframe-host.md)。按需实现 SDK 未读数和宿主入口角标。只有用户明确要求核验当前线上契约，或真实运行结果与 reference 冲突时，才按 reference 的核验边界处理。
- `native-api`：读取 [原生 API 模式](references/native-api-mode.md)，落实其中配置、认证、请求/响应、分页、消息幂等、附件和通知；V1 兼容、智能客服/实时扩展按其中入口继续读取，不宣称可选能力全部等价。
- iOS SwiftUI：额外读取 [iOS SwiftUI 落地](references/ios-swiftui.md)。

退出条件：提交反馈与“我的反馈”可切换，配置只在依赖就绪后生效，错误态不泄露凭证。

### 5. 验证和交付

输入：实现结果和选择的能力。

动作：验证页面或请求、身份稳定性、入口切换、错误态与凭证边界；SDK V2 额外验证认证字段互斥，开启通知时验证未读读取不改变已读状态、0 隐藏角标、跨域消息校验 origin/source/type/request ID。宿主服务模式还要验证客户端不保存 API Key 或 token，并能响应 SDK 的主动 Session 刷新事件，而不只是等待下一次调用失败。

退出条件：已完成的能力有证据；原生按 reference 的验收项核对所选能力，未验证的部署、已知扩展限制和服务端差异被明确列出。

## macOS 参数 UI

本地环境可使用内置采集器配置 SDK V2 或原生 API（默认 V2）：

```bash
swift skills/arckit-feedback-platform-integration/scripts/collect_feedback_config.swift \
  --output /private/tmp/feedback-config.json \
  --static-swift-output ios/App/FeedbackPlatformStaticConfig.generated.swift \
  --local-json-output ios/App/FeedbackPlatform.local.json
```

脚本支持 SDK V2 与原生 V2 的 API Key/Session、通知开关、网关与宿主 endpoint；原生默认 V2，选择 V1 必须填写例外依据，且只允许 API Key、关闭通知。Session 不采集 Key，Project ID 可留空由宿主管理；保存配置不代表宿主接口已联调。脚本不把 API Key 输出到 stdout。运行 GUI 或访问 Keychain 时按环境权限规则申请授权。

## 最终汇报

- 目标平台、已有实现归类、平台官网引导结果。
- `integrationMode`；SDK WebView 还要说明承载方式、`sdkAuthMode` 和通知开关。
- 反馈入口形态及拆分原因（如有）。
- `Project ID`、API Key、Session token、`customUserId` 的来源与生命周期策略，不包含凭证明文。
- 修改文件、验证证据、未完成风险。
- 原生 API 的 `nativeApiVersion`、版本选择依据（使用 V1 时必须说明例外原因）、`nativeAuthMode`、所选通知/附件/扩展能力，及源码核对、静态检查、真实联调各自的证据范围。
