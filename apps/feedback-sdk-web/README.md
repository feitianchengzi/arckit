# feedback-sdk-web

Web-first SDK component workspace for feedback submission and status tracking.

## Scope (Production)

- Submit feedback UI (`/submit`)
- User feedback status page (`/status`)
- Mobile WebView-ready responsive layout (single production style, no debug toolbar)

## Dev

```bash
npm install
npm run dev
```

## Build (Production)

```bash
# 1) 复制模板并填写生产配置
cp env.production.template .env.production

# 2) 产出生产构建
npm run build
```

## Deploy (OSS)

```bash
cd webapps/feedback-sdk-web
npm run deploy:oss
```

部署安全规则：

- 默认前缀：`OSS_PREFIX=sdk`
- 仅清理并上传该前缀目录
- 默认禁止根目录部署（需显式 `ALLOW_ROOT_DEPLOY=1` 才允许）
- 如需部署 SDK 后同步外层根入口，设置 `SYNC_ROOT_INDEX=1`
- 根入口目标由 `ROOT_INDEX_TARGET` 控制，当前推荐保持 `/console`，避免 SDK 部署把默认首页切到组件页

推荐 OSS 配置：

```env
OSS_PREFIX=sdk
ALLOW_ROOT_DEPLOY=0
SYNC_ROOT_INDEX=1
ROOT_INDEX_TARGET=/console
```

这只会额外覆盖 bucket 根目录的 `index.html`，不会清理或覆盖 `console/`。
控制台公网入口使用 `/console`，不要写成 `/console/`，否则 OSS 可能按目录入口处理。
根入口 redirect 会自动追加 `deploy_v=<timestamp>`，避免部署后浏览器继续命中旧入口缓存。

## Isolated V2 Deploy

V2 用于给反馈控制台单独升级，现有 `/sdk`（待办 Web 和 iOS）不会被修改：

```bash
cd webapps/feedback-sdk-web
npm run deploy:oss:v2
```

该命令固定构建到 `/sdk-v2`，且只会上传 `sdk-v2/` 下的新文件：不删除对象、不写 bucket 根目录、不触碰 `/sdk`。上传顺序为版本化静态资源、`sdk-v2/index.html`、SPA 别名，确保入口文件最后切换。它默认信任 `workshop.feitianchengzi.com`、`feedback.feitianchengzi.com` 和 `jinghong.wang` 三个宿主入口；如需调整，部署前显式设置 `VITE_SDK_PARENT_ORIGINS`。

完成 V2 页面验收后，再在反馈控制台的部署环境中设置：

```env
VITE_FEEDBACK_SDK_URL=https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web
```

然后单独发布反馈控制台。留空此变量会继续使用稳定的 V1 `/sdk`。

## Managed Releases and Forced Upgrades

正式环境应使用不可变 release + channel，而不是反复覆盖同一份 SDK 资源：

V3 必须构建为独立产品契约，并使用独立 channel 名称，避免改写 V2 的 channel 清单：

```bash
npm run build:release:v3 -- 3.0.0-canary.20261031
python3 scripts/sdk_release.py publish \
  --version 3.0.0-canary.20261031 \
  --dist-dir dist \
  --env-file .env \
  --compatible-contracts v3 \
  --source-commit "$(git rev-parse HEAD)"
python3 scripts/sdk_release.py promote \
  --version 3.0.0-canary.20261031 \
  --channel v3-canary \
  --env-file .env \
  --alias sdk-v3-canary:v3 \
  --confirm-promote v3-canary:3.0.0-canary.20261031
```

验收通过后，把同一不可变产物提升到 `v3-stable` 并只维护 `/sdk-v3`。不要在 V3 promote 命令中加入 `/sdk` 或 `/sdk-v2`。

```bash
# 低内存串行构建；Node 堆上限默认 1 GiB。
npm run build:release -- 2.0.0-canary.20261014

# 将同一份产物分别发布到需要承载 SDK 的 bucket。发布过的版本不可覆盖。
python3 scripts/sdk_release.py publish \
  --version 2.0.0-canary.20261014 \
  --dist-dir dist \
  --env-file .env \
  --compatible-contracts v1,v2 \
  --source-commit "$(git rev-parse HEAD)"

# 灰度入口；只影响显式使用 /sdk-v2-canary 的测试宿主。
python3 scripts/sdk_release.py promote \
  --version 2.0.0-canary.20261014 \
  --channel canary \
  --env-file .env \
  --alias sdk-v2-canary:v2 \
  --confirm-promote canary:2.0.0-canary.20261014
```

发布结构：

- `sdk-releases/<version>/`：不可变构建；同一版本内容不同会拒绝上传。
- `sdk-channels/canary.json`：灰度通道的唯一切换点。
- `sdk-channels/stable.json`：正式通道的唯一切换点。
- `/sdk`、`/sdk-v2`：无缓存的轻量 loader；保留现有接入 URL。

V3 验收通过后，可让旧 V1/V2 宿主在下次打开时集中升级，同时继续使用原接入协议：

```bash
python3 scripts/sdk_release.py promote \
  --version 3.0.0 \
  --channel stable \
  --env-file .env \
  --alias sdk:v1 \
  --alias sdk-v2:v2 \
  --alias sdk-v3:v3 \
  --minimum-version 3.0.0 \
  --force-upgrade-after 2026-11-01T00:00:00+08:00 \
  --confirm-promote stable:3.0.0
```

回滚使用相同的 `promote` 命令把 `stable` 指回已经发布的旧版本；不需要重新构建或删除 OSS 对象。Todo Web 的 `/sdk` 位于另一个 OSS bucket，需用 `apps/todo-web/.env` 对同一 release 再执行一次 `publish/promote`，从而保留同源 iframe 访问。

## Cleanup Legacy Root Objects

用于清理历史上部署在 bucket 根目录的旧 SDK 文件，默认仅预览，不会删除：

```bash
cd webapps/feedback-sdk-web
npm run cleanup:root
```

确认执行删除（双重确认参数）：

```bash
npm run cleanup:root -- --execute --confirm-root-cleanup
```

默认会保留前缀：`console/`、`sdk/`、`sdk-releases/`、`sdk-channels/`；所有以 `sdk-` 开头的托管 release、channel 和 alias 命名空间也始终受保护。
如需自定义：

```bash
npm run cleanup:root -- --keep-prefixes console,sdk,static --execute --confirm-root-cleanup
```

## API 接入

- V1（默认兼容）：`/workshop/v1/apikey/feedbacks`
- V2（显式灰度）：安全模式使用 `/workshop/v2/feedback/*`；直连 API Key 模式使用 `/workshop/v2/apikey/*`

运行时配置来源（按优先级）：

1. `window.FeedbackSDK.configure(...)` 运行时注入
2. 本地存储：`sdk_feedback_api_key`、`sdk_feedback_project_id`、`sdk_feedback_custom_user_id`
3. 环境变量：`VITE_SDK_FEEDBACK_API_KEY`、`VITE_SDK_FEEDBACK_PROJECT_ID`

移动端 WebView 示例：

```js
window.FeedbackSDK.configure({
  apiKey: 'ak_xxx',
  projectId: 81,
  customUserId: 'u_123',
})
window.FeedbackSDK.openSubmit()
```

V2 安全模式示例。`feedbackSessionToken` 必须由宿主服务交换并短期注入，不能把 Workshop API Key 或 token 写进 Vite 环境变量、URL 或本地存储：

```js
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2NotificationsEnabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: 'fbs_<short-lived-scoped-token>',
  gatewayUrl: 'https://api.feitianchengzi.com',
})
```

V2 直连 API Key 模式示例。它保持 V1 的简单接入体验，但 API Key 可被客户端提取，必须由接入方明确接受这个风险：

```js
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2NotificationsEnabled: true,
  feedbackV2AuthMode: 'apiKey',
  apiKey: 'ak_<project-scoped-key>',
  projectId: 81,
  customUserId: 'stable-high-entropy-install-or-user-id',
  gatewayUrl: 'https://api.feitianchengzi.com',
})
```

说明：

- 开发态默认走 Vite 代理 `/gateway` 转发到 `https://api.feitianchengzi.com`，用于规避本地 3100 端口跨域白名单限制。
- 生产接入不再支持通过 URL 传入 `api_key` / `project_id`。
- V2 会话 token 过期时，iframe SDK 会向受信任父页面发送刷新请求；宿主重新注入 token 后自动重试一次。直连 API Key 模式不需要 token 刷新。
- 两种 V2 模式都使用服务端签发的 OSS PostObject 上传策略和受限只读凭证，覆盖反馈首条附件与后续消息附件。
- `feedbackV2NotificationsEnabled` 是独立灰度开关；未显式设置为 `true` 时，SDK 不会请求通知接口，也不会改变现有 V2 会话行为。
- 接入方可调用 `await window.FeedbackSDK.getUnreadCount()` 在自己的入口展示红点或未读数字；该调用不会修改已读状态。
- 完整 V2 合约见 Workshop 项目的 `docs/feedback-sdk-v2-integration.md`。

## SDK 接入文档

- [docs/SDK_INTEGRATION_API.md](./docs/SDK_INTEGRATION_API.md)
