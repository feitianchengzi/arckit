# ArcOrbit 产品反馈 SDK 接入方案

## 方案概述

ArcOrbit 使用 Feedback SDK WebView V2 提供自身产品反馈中心。Electron main process 持有固定 Project 107、内置项目专用 API Key、Workshop 稳定用户身份、SDK WebContents 和未读状态；普通用户无需也无法配置反馈参数。

## 接入契约

- `integrationMode=sdk-webview`。
- `sdkAuthMode=apiKey`，不推断宿主 Session endpoint。
- `credentialStrategy=bundled-static`：Key 写在产品代码中并进入打包产物，轮换需改代码并重新构建。
- `notificationsEnabled=true`，使用 `getUnreadCount()` 和受校验的 `feedback-sdk:unread-changed` 信号。
- `projectId=107`，不由用户选择、持久化或覆盖。
- SDK 页面固定为 `https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web`，网关固定为 `https://api.feitianchengzi.com`。

## Electron 承载与安全边界

主 `file://` Renderer 不嵌入跨域 SDK，也不获得 API Key。反馈中心使用独立 BrowserWindow 本地壳和受限 WebContents：`nodeIntegration=false`、`contextIsolation=true`、`sandbox=true`，无 ArcOrbit preload；只允许固定 SDK HTTPS origin，拒绝新窗口和非允许导航。

API Key 不进入 URL、window title、日志、分析事件、Renderer snapshot 或 IPC。由于 Key 随源码和客户端分发，任何获得源码或打包产物的人都可能提取它；这是用户明确接受的当前产品决策，不宣称静态保密。Key 必须保持项目专用、权限范围最小且可轮换。

## 内置配置与轮换

`runtime/arcorbit/src/product-feedback-service.mjs` 保存固定 Project ID 和 API Key 常量。应用启动时不读取 userData、环境变量或 secret store，也不暴露保存、清除或更新凭据的 IPC 和设置页。轮换流程是修改 Key 常量、运行回归、重新构建并发布客户端；旧构建继续持有旧 Key，因此平台侧撤销策略必须与客户端升级节奏协调。

## 用户身份与 SDK 生命周期

main process 每次准备或打开反馈中心时从当前 Workshop source 读取不可变用户 ID，作为 `customUserId`。未登录、读取失败或 ID 为空时不配置 SDK；退出、会话失效或账户切换会销毁旧上下文并清空未读投影。

SDK 配置包含：`feedbackV2Enabled=true`、`feedbackV2AuthMode=apiKey`、内置 `apiKey`、`projectId=107`、fresh `customUserId`、固定 gateway、系统主题和 `feedbackV2NotificationsEnabled=true`。一个健康页面只 configure 一次；提交反馈与我的反馈只切换 action。

SDK 文档身份由固定 HTTPS origin、`/sdk-v2` 路径空间和 `embed=web` 共同确定，不要求当前 URL 与入口 `index.html` 完全相等。SDK 通过 history state 进入 submit、status 或其子路由时仍是同一个已配置文档。后台未读刷新只在该文档内调用 `getUnreadCount()`，不执行 `loadURL`、重复 configure 或重复 open，因此不会销毁 SDK 管理的进行中草稿。

首次创建 WebContents、当前文档不属于 SDK 文档身份、运行配置或稳定用户身份变化、以及用户明确重试时允许加载固定入口。配置或身份变化先使旧配置失效并停止旧未读监听；关闭、退出或账户切换销毁旧上下文。导航 allowlist 仍独立校验固定 HTTPS origin，文档健康判断不扩大 Renderer、IPC 或远端访问权限。

## 未读角标生命周期

登录后 main process 可在不显示窗口时准备 SDK 并调用 `getUnreadCount()`。远端监听器只接受同 origin、同 window、`source=feedback-sdk-web`、`type=feedback-sdk:unread-changed` 的信号；信号不携带可信 count，只触发 main process 重新查询。后台每 60 秒刷新；Renderer 只接收非负整数，显示 1–99 或 `99+`，0 隐藏；退出登录清零。

## IPC 与失败恢复

主 preload 只暴露状态、打开反馈中心、刷新未读和订阅未读事件；不暴露凭据保存/清除、任意 URL、通用网络或脚本执行。反馈壳 preload 只暴露模式切换、重试、关闭和脱敏状态。

- `requires_auth`：打开 Workshop 登录设置，不创建远端 WebContents。
- 内置 Key 缺失：服务初始化失败，必须由新客户端构建修复。
- SDK 文档、readiness、认证或网络失败：显示脱敏类别并允许重试或关闭。
- 非允许导航或新窗口：直接拒绝。

## 验证边界

- Project ID 固定为 107，Key 非空，credential strategy 为 `bundled-static`。
- 设置页面和 main preload 不存在凭据保存、清除或反馈平台配置动作。
- 主 Renderer、反馈壳、URL、日志和 IPC 不含 Key 或 custom user ID。
- 未登录和 identity missing 失败关闭；账户切换销毁旧 WebContents。
- SDK URL、导航 allowlist、SDK 文档身份、同页模式切换、未读信号校验、0 隐藏、99+ 上限和退出清零有自动化证据。
- submit/status 路由上的后台未读刷新不重载文档、不重复 configure，并通过真实 Electron 草稿保持路径验证。

## 来源

- `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md`
- `arckit/interaction/product-feedback-center/interaction.md`
- `runtime/arcorbit/desktop/main.mjs`
- `runtime/arcorbit/desktop/product-feedback/`
- `runtime/arcorbit/src/product-feedback-service.mjs`
- `runtime/arcorbit/src/product-feedback-window.mjs`
- `runtime/arcorbit/test/product-feedback-service.test.mjs`
- `runtime/arcorbit/test/product-feedback-window.test.mjs`
