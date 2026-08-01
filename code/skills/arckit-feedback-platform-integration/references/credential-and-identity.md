# 凭证与用户身份策略

## 先按接入方式分流

SDK WebView V2 与原生 API 的凭证契约彼此独立：

- `integrationMode=sdk-webview`：继续选择 `sdkAuthMode=apiKey|session`。
- `integrationMode=native-api`：只遵循已确认的原生 API 契约。不要把 SDK V2 的 `feedbackSessionToken`、通知协议或会话换取接口套到原生请求。

## SDK V2 客户端直连

`sdkAuthMode=apiKey` 时，客户端配置同时包含：

- `feedbackV2Enabled: true`
- `feedbackV2AuthMode: "apiKey"`
- `apiKey`
- 数字型 `projectId`
- 稳定 `customUserId`

该模式无论 Key 来自源码、本地忽略配置还是客户端 secret store，最终都会进入客户端运行环境，不能描述为不可提取。必须使用项目专用、可轮换、权限范围最小的 Key。

可选承载策略：

- `source-static`：写入专用客户端配置文件；记录用户接受客户端暴露风险。
- `local-ignored`：确认配置路径已被 git ignore；它只防止提交到仓库，不消除客户端暴露风险。
- `secret-store`：通过本地安全 UI 或 secret handle 注入；它降低协作过程泄露，但不保证运行时 Key 不可提取。

## SDK V2 宿主服务会话

`sdkAuthMode=session` 时：

- API Key 和 `projectId` 由宿主服务配置。
- 宿主服务用当前登录用户的稳定 ID 换取短期 token。
- 客户端 `configure` 只传 `feedbackSessionToken`、`gatewayUrl`、主题和可选通知开关；不要同时传 API Key、`projectId` 或 `customUserId`。
- token 只保存在内存中，过期后重新获取；不得进入 URL、日志、分析事件、崩溃上下文或本地持久化。
- 客户端登出、切换账号或宿主会话失效时，丢弃旧 token 并重新获取。

宿主服务必须独立鉴权，不能接受客户端任意提交的 `customUserId` 后直接代换 token；稳定用户 ID 应从服务端当前登录会话派生。

## 原生 API 凭证边界

原生 API 是独立方案。当前 reference 记录哪个版本的接口，就只按该版本实现和汇报。若平台尚未提供与 SDK V2 对应的原生 API 文档：

- 不推测 endpoint、认证头、请求体、会话 token、通知或未读接口。
- 不把 SDK V2 的 `/workshop/v2/apikey/feedback-sessions` 当成原生反馈 CRUD 接口。
- 把“V2 原生 API 契约待平台提供”列为产品缺口；需要的最小信息包括 endpoint、认证、请求/响应 schema、附件、会话/消息和未读语义。

## customUserId

- 有登录体系：使用不可变业务用户 ID，避免手机号、邮箱、昵称等可识别信息。
- 无登录体系：生成安装级游客 ID，持久化到 Keychain、SharedPreferences、localStorage 或同等存储，避免“我的反馈”断档。
- 退出登录、切换账号、游客升级登录时，必须明确反馈归属策略。
- SDK V2 Session 模式由宿主服务从已认证会话派生用户 ID；不要信任客户端自由填写的用户 ID。

## 可观察性边界

日志可以记录认证模式、项目 ID（若非敏感）、配置状态、token 是否存在及错误类别。任何模式都不得记录完整 API Key、Session token、完整配置对象或可反推出真实用户身份的样本。
