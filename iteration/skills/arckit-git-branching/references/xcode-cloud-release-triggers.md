# Xcode Cloud Git Trigger Tags

本 reference 只定义 Apple 项目使用 Xcode Cloud 时的 Git branch/tag 触发约定。它不包含本地 Xcode 构建、archive、导出、上传、签名、App Store Connect 账号或审核流程。

## 推荐约定

- 稳定线：`release/vx.x.x`
- 内部 TestFlight：`tf/vx.x.x-bN`
- 外部 TestFlight / 公测：`beta/vx.x.x-rcN`
- App Store 候选：`appstore/vx.x.x`

## 默认推荐

- 同时表达 Apple 平台发布和 TestFlight 分发意图时，默认推荐内部 TestFlight。
- 没有可见版本时，推荐版本 `v1.0.0`。
- 没有可见 build 序号时，内部 TestFlight 推荐 `b1`，外部 TestFlight 推荐 `rc1`。
- 因此内部 TestFlight 的默认 tag 是 `tf/v1.0.0-b1`，但必须说明可由用户修改。

## Xcode Cloud 监听规则

Xcode Cloud workflow 应由用户预先配置为监听 Git 远端事件：

- `release/v*` branch push：验证 release 线。
- `tf/v*` tag push：生成内部 TestFlight 包。
- `beta/v*` tag push：生成外部 TestFlight 或公测包。
- `appstore/v*` tag push：生成 App Store 候选包。

agent 在本 skill 中只做 Git 层动作：推荐分支/tag，确认后创建并 push 到远端。push 后停止，不追踪 Xcode Cloud 的构建、上传、处理、测试组或审核状态。

## Xcode Cloud 失败原因入口

当用户反馈 Xcode Cloud 或 TestFlight 首次出包失败，但没有具体错误时，先收集失败原因，不要盲改项目配置。

优先检查顺序：

1. 开发者账号邮箱或 App Store Connect 相关通知邮箱。Apple 可能把具体失败原因发到邮件里，尤其是上传、处理或 App Store Connect 准备阶段失败时。
2. Xcode Cloud 的 Build 历史。`Preparing build for App Store Connect failed` 可能只是泛化标题；即使 logs 和 artifacts 看起来成功，也不代表上传或 App Store Connect 准备阶段成功。
3. App Store Connect / TestFlight 页面。首次上传在成功前可能看不到任何上传历史或失败记录，不能把“没有历史”当成没有失败原因。

需要用户粘贴给 agent 的最小信息：

- 触发 tag 或 branch，例如 `tf/vx.x.x-bN`。
- commit hash。
- Xcode Cloud workflow 名称和失败时间。
- Build 历史里的失败标题。
- 开发者邮箱收到的具体失败原因原文。
- 如果 TestFlight 没有上传历史，明确说明是否是首次上传。

拿到失败原因原文后，再按错误内容进入 debug、配置修复或平台配置协作；本 reference 不提供具体修复方案。

## 禁止扩展

不要把 Apple 发布意图扩展成本机执行：

- `xcodebuild`
- archive
- exportArchive
- Organizer 上传
- Transporter / altool
- App Store Connect build 查询
- 签名或 provisioning 处理
- TestFlight 测试信息或测试组维护
