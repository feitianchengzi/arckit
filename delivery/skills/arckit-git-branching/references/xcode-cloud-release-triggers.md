# Xcode Cloud Git Trigger Contract

本 reference 只补充 Apple 项目使用 Xcode Cloud 时的 Git trigger pattern 和失败证据入口。平台无关分支/tag 规则以 [platform-release-triggers.md](platform-release-triggers.md) 为准。

## Workflow Patterns

- `release/v*` branch push：验证 release 线。
- tag 使用通用版本命名，例如 `v1.2.3-beta.1`、`v1.2.3-rc.1`、`v1.2.3`，不另设 Apple 专用前缀。
- 监听 `v*`（或项目既有命名空间）时，应区分预发布与正式版本；具体匹配方式以 Xcode Cloud workflow 配置为准。
- 内部 TestFlight、外部 TestFlight 或 App Store 候选包由项目 workflow 的分发配置决定，不直接从 tag 阶段推断；已有监听规则不自动迁移。

agent 在本 skill 中只做 Git 层动作：推荐分支/tag，确认后创建并 push 到远端。push 后停止，不追踪 Xcode Cloud 的构建、上传、处理、测试组或审核状态。

## Apple Defaults

- 同时表达 Apple 平台发布和 TestFlight 分发意图时，默认推荐内部 TestFlight；此处只决定分发建议，不决定 tag 的版本阶段。
- 版本及预发布序号按通用 Tag Policy 确定，不设置 Apple 专用初始版本或 tag 序号。
- 平台 build number 与 tag 的预发布序号分别管理，不将内部/外部测试映射为 `bN`/`rcN`。

## Failure Evidence

当用户反馈 Xcode Cloud 或 TestFlight 首次出包失败，但没有具体错误时，先收集失败原因，不要盲改项目配置。

优先检查顺序：

1. 开发者账号邮箱或 App Store Connect 相关通知邮箱。Apple 可能把具体失败原因发到邮件里，尤其是上传、处理或 App Store Connect 准备阶段失败时。
2. Xcode Cloud 的 Build 历史。`Preparing build for App Store Connect failed` 可能只是泛化标题；即使 logs 和 artifacts 看起来成功，也不代表上传或 App Store Connect 准备阶段成功。
3. App Store Connect / TestFlight 页面。首次上传在成功前可能看不到任何上传历史或失败记录，不能把“没有历史”当成没有失败原因。

需要用户粘贴给 agent 的最小信息：

- 触发 tag 或 branch，例如 `v1.2.3-beta.1`。
- commit hash。
- Xcode Cloud workflow 名称和失败时间。
- Build 历史里的失败标题。
- 开发者邮箱收到的具体失败原因原文。
- 如果 TestFlight 没有上传历史，明确说明是否是首次上传。

拿到失败原因原文后，再按错误内容进入 debug、配置修复或平台配置协作；本 reference 不提供具体修复方案。

## Boundary

不要把 Apple 发布意图扩展成本机执行：

- `xcodebuild`
- archive
- exportArchive
- Organizer 上传
- Transporter / altool
- App Store Connect build 查询
- 签名或 provisioning 处理
- TestFlight 测试信息或测试组维护
