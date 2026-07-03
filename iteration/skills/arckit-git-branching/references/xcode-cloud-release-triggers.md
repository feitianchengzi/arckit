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
