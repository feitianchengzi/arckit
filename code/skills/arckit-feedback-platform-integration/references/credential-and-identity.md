# 凭证与用户身份策略

## 先按接入方式分流

先区分 WebView 配置字段与原生 HTTP 认证：

- `integrationMode=sdk-webview`：继续选择 `sdkAuthMode=apiKey|session`。
- `integrationMode=native-api`：默认 `nativeApiVersion=v2`（当前已核验最新稳定版），按主流程的 V1 例外规则确定版本后选择 `nativeAuthMode`；V2 Session 使用下述宿主换取机制及 HTTP Bearer token，原生 client 自行刷新，不使用 SDK bridge 事件。

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

按 [原生 API 模式](native-api-mode.md) 配置：V1 仅 API Key，V2 可选 API Key 或 Session。原生 Session 使用相同的服务端交换 endpoint，但客户端不需要 `configure`、`feedbackSessionToken` 字段或 iframe 通知。上面的 Key 风险、宿主身份派生、token 内存存储及账号切换规则同样适用。

使用“项目专用 Key”是运营隔离建议，不保证网关 Key 本身只有单项目权限；当前服务仍校验 Key 所属用户的项目成员身份。直连 customUserId 可由持 Key 的客户端填写，不应宣称为可信登录隔离；需要认证身份保证时使用宿主 Session。

## customUserId

- 有登录体系：使用不可变业务用户 ID，避免手机号、邮箱、昵称等可识别信息。
- 无登录体系：生成安装级游客 ID，持久化到 Keychain、SharedPreferences、localStorage 或同等存储，避免“我的反馈”断档。
- 退出登录、切换账号、游客升级登录时，必须明确反馈归属策略。
- SDK V2 Session 模式由宿主服务从已认证会话派生用户 ID；不要信任客户端自由填写的用户 ID。

## 可观察性边界

日志可以记录认证模式、项目 ID（若非敏感）、配置状态、token 是否存在及错误类别。任何模式都不得记录完整 API Key、Session token、完整配置对象或可反推出真实用户身份的样本。
