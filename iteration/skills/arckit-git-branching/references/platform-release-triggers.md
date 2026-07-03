# Platform Git Trigger Tags

本 reference 只定义平台无关的 release branch 和 tag 触发约定。它不描述构建、上传、审核、账号、签名或外部平台配置步骤。

## 分支

- `release/vx.x.x`：版本稳定线。
- 普通提交进入 `release/vx.x.x` 后，可以通过 push 触发远端验证 workflow。
- 出包触发必须使用 tag push，不使用渠道分支。

## Tag 约定

- `tf/vx.x.x-bN`：内部测试包。
- `beta/vx.x.x-rcN`：公开测试、公测或外部测试候选。
- `appstore/vx.x.x`：正式发布候选。

`N` 从 1 开始递增。没有可见历史时，推荐 `b1` 或 `rc1`，不要为了查历史而运行命令。

## Prompt 到推荐

- 用户表达内测、内部测试、测试分发且未明确公开测试：推荐 `tf/vx.x.x-bN`。
- 用户表达公测、外部测试、公开链接、beta：推荐 `beta/vx.x.x-rcN`。
- 用户表达正式发布、生产发布、上架、发布候选：推荐 `appstore/vx.x.x`。
- 用户同时表达平台发布和测试分发时，优先按测试分发推荐；只有明确正式上架时才推荐正式候选。

## 远端触发契约

推荐远端 workflow 预先监听：

- `release/v*` branch push：版本线验证。
- `tf/v*` tag push：内部测试出包。
- `beta/v*` tag push：公开测试出包。
- `appstore/v*` tag push：正式候选出包。

agent 只负责推荐、创建和 push branch/tag。push 后不继续追踪远端 workflow、构建产物、上传状态或发布平台状态。

## 输出给主流程

- 推荐目标分支。
- 推荐 tag。
- 需要 push 的 branch/tag。
- 远端 workflow 需要监听的 pattern。
