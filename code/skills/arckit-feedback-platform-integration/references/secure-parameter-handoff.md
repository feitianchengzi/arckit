# 安全 UI 与参数回传契约

通过 UI 或等价安全配置流选择接入方式并采集参数。默认不通过对话、命令行参数、环境变量或 stdin 传递真实 API Key。

## 决策层级

UI 按顺序采集：

1. `integrationMode`: `sdk-webview` 或 `native-api`。
2. 仅 SDK WebView：`sdkAuthMode`: `apiKey` 或 `session`。
3. 仅 SDK WebView：`notificationsEnabled`: 是否启用 SDK V2 未读能力。
4. 与所选模式兼容的 `credentialStrategy`、`projectId` 和用户 ID 模式。

不能把 `session` 作为第三种 `integrationMode`，也不能为 `native-api` 自动附加 SDK V2 认证或通知字段。

## 字段与条件

- `credentialStrategy`: `source-static`、`local-ignored`、`secret-store` 或 `backend-runtime`。
- SDK `apiKey`：选择前三种之一，采集正整数 `projectId` 和 API Key；Key 最终会进入客户端，UI 必须提示可提取风险。
- SDK `session`：固定 `backend-runtime`，采集或确认服务端使用的 `projectId`，不向客户端采集 API Key；客户端从宿主 endpoint 获取短期 token。
- `native-api`：按 [原生 API 模式](native-api-mode.md) 的独立凭证契约选择策略；SDK V2 字段为 `null` / `false`。
- `customUserIdMode`: `business-user-id` 或 `persistent-guest-id`。
- `customUserIdSource` 由选择派生，不让用户输入真实 ID 样本：业务用户可映射为 `AuthService.currentUser.id`，游客映射为平台等价持久存储。

`source-static` 只表示用户接受写入专用客户端配置文件。其他策略不得把 API Key 写入受版本控制的源码、测试 fixture、日志或普通报告。

## 本地 macOS 脚本

本 skill 自带 `scripts/collect_feedback_config.swift`：

```bash
swift skills/arckit-feedback-platform-integration/scripts/collect_feedback_config.swift \
  --output /private/tmp/feedback-config.json \
  --static-swift-output ios/App/FeedbackPlatformStaticConfig.generated.swift \
  --local-json-output ios/App/FeedbackPlatform.local.json
```

脚本以 AppKit 表单采集选择，按策略写入 Swift 静态配置、本地忽略配置或 macOS Keychain，只把状态、路径或 opaque handle 回传。运行 GUI 或 Keychain 操作时按环境权限规则申请授权。

## 结构化回传

SDK 客户端直连示例：

```json
{
  "integrationMode": "sdk-webview",
  "sdkAuthMode": "apiKey",
  "notificationsEnabled": true,
  "projectId": 97,
  "credentialStrategy": "secret-store",
  "apiKeyStatus": "stored",
  "apiKeyHandle": "secret://feedback-platform/project-97/api-key",
  "apiKeyOutputPath": null,
  "customUserIdMode": "persistent-guest-id",
  "customUserIdSource": "keychain:feedback.customUserId",
  "configuredByUser": true
}
```

SDK 宿主服务示例：

```json
{
  "integrationMode": "sdk-webview",
  "sdkAuthMode": "session",
  "notificationsEnabled": false,
  "projectId": 97,
  "credentialStrategy": "backend-runtime",
  "apiKeyStatus": "not-collected",
  "apiKeyHandle": null,
  "apiKeyOutputPath": null,
  "customUserIdMode": "business-user-id",
  "customUserIdSource": "server-authenticated-user",
  "configuredByUser": true
}
```

字段规则：

- `sdkAuthMode` 只在 `integrationMode=sdk-webview` 时非空。
- `notificationsEnabled` 只控制 SDK V2 未读能力，不代表原生 API 支持通知。
- `apiKeyStatus`: `written`、`stored`、`not-collected`、`missing`、`missing-output`、`cancelled` 或 `invalid`。
- `apiKeyHandle` 只能是引用，不能是 Key 明文。
- `apiKeyOutputPath` 是已写入路径，不包含文件内容。
- Session 模式的 `customUserIdSource` 应标识服务端认证会话，不回传真实用户 ID。

## Agent 后续动作

- SDK `apiKey`：从所选 provider 读取项目 ID、Key 和稳定用户 ID，生成 V2 `apiKey` configure。
- SDK `session`：接入宿主 `/api/feedback/session` 或等价 endpoint；客户端只消费短期 token。
- SDK 通知开启：实现同页 `getUnreadCount()` 或跨域 postMessage 协议，由宿主渲染 0 隐藏的角标。
- 原生 API：只读取独立 reference 中已确认的版本和接口；V2 对应能力未知时停止推测。
- `local-ignored`：修改前确认真实配置路径已被 git ignore。
- `secret-store`：只使用 handle 和运行时读取接口，不读取或打印明文。

## 失败与降级

- 用户取消：停止真实配置，不创建默认启用的占位 provider。
- 项目 ID 缺失或非正整数：回到平台确认；若完全由既有宿主后端管理，可用明确的运行时配置状态替代。
- Key 缺失或无效：提示重新生成/录入，不显示已输入内容。
- Session 模式缺少宿主 endpoint：可以完成客户端 adapter 和未配置态，但不能伪造 token 或降级成客户端 Key。
- UI 不可用：默认走宿主服务/安全运行时配置并标记凭证待接入；只有用户明确接受客户端暴露风险时才改走源码静态配置。
