# Platform Git Trigger Contract

本 reference 定义平台无关的分支、tag 和远端 workflow 触发契约。它不描述构建、上传、审核、账号、签名或外部平台配置步骤。

## Core Model

- 分支决定代码生命周期。
- tag 决定远端出包意图。
- tag 不强制绑定 `release/*`。
- 已存在的 `release/*` 是版本稳定线，不能被同版本或更低版本 tag 绕过。
- 出包触发使用 tag push，不使用渠道分支。

## Branch Policy

`main`

- 唯一长期开发主线。
- 日常迭代、新功能、小修复默认进入 `main`。

`feature/<topic>`

- 可选隔离分支。
- 仅用于长周期、高风险、多人协作、实验性开发或需要独立评审的工作。
- 完成后合回 `main`，不直接合入 `release/*`。

`release/vx.x.x`

- 版本稳定线，从 `main` 在准备发布某个版本时拆出。
- 创建后版本范围冻结，只接收该版本发布所需的 bugfix、配置修正、文案修正和兼容性修复。
- 不接收新功能、无关重构或实验代码。

`hotfix/<topic>`

- 可选紧急修复分支。
- 如果对应 `release/*` 仍活跃，优先直接在 `release/*` 上修复。
- 只有 release 已归档、删除，或需要从正式发布 tag 拉出干净修复线时使用。

## Merge Policy

- `feature/* -> main`
- `main -> release/vx.x.x` 只用于首次创建 release。
- `release/*` 创建后，不再整体合并 `main`。
- `main --cherry-pick/backport--> release/vx.x.x` 只用于明确属于该版本的必要修复。
- `release/vx.x.x -> main` 用于 release 修复回流。
- `hotfix/* -> main`，并按需同步到活跃 `release/*`。
- 多个 `release/*` 活跃时，每个 release/hotfix 修复都要评估是否同步到其它 release 线。

## Tag Policy

Tag naming:

- `tf/vx.x.x-bN`：内部测试包。
- `beta/vx.x.x-rcN`：外部测试、公测或 beta 候选。
- `appstore/vx.x.x`：正式发布候选。

Prompt mapping:

- 内测、内部测试、测试分发且未明确公开测试：`tf/vx.x.x-bN`
- 公测、外部测试、公开链接、beta：`beta/vx.x.x-rcN`
- 正式发布、生产发布、上架、发布候选：`appstore/vx.x.x`
- 同时表达平台发布和测试分发时，优先按测试分发推荐；只有明确正式上架时才推荐正式候选。

Baseline rules:

- `tf/*` 可以基于 `main` 或 `release/*`。
- `beta/*` 默认应基于 `release/*`；如果用户明确要从 `main` 出外部测试，先说明风险并等待确认。
- `appstore/*` 必须基于 `release/*`、正式发布修复线，或用户明确确认的发布候选 commit；不要默认从 `main` 直接创建。
- 如果 `release/vx.x.x` 已存在，`tf/vx.x.x-*`、`beta/vx.x.x-*`、`appstore/vx.x.x` 默认都应基于该 release 线。
- 如果已有更高版本 `release/*`，不要从 `main` 给更低版本直接打 tag；先确认对应 release/hotfix 基线。
- 如果目标版本没有 `release/*`，内部测试可以基于 `main`，不要强迫创建 release 分支。
- 如果目标版本没有 `release/*`，外部测试或正式候选应建议先创建 `release/vx.x.x`，但必须由用户确认。

`N` 从 1 开始递增。没有可见历史时，推荐 `b1` 或 `rc1`，不要为了查历史而运行命令。

## Workflow Patterns

远端 workflow 推荐监听：

- `release/v*` branch push：版本线验证。
- `tf/v*` tag push：内部测试出包。
- `beta/v*` tag push：外部测试或公测出包。
- `appstore/v*` tag push：正式候选出包。

agent 只负责推荐、创建和 push branch/tag。push 后不继续追踪远端 workflow、构建产物、上传状态或发布平台状态。

## Git Checks

推荐或执行前必须检查：

- 当前分支和工作区状态。
- 本地和远端是否存在目标 `release/vx.x.x`。
- 是否存在更高版本活跃 `release/*`。
- 本地和远端是否已存在目标 tag。
- 当前 commit 是否位于推荐基线分支上。

## Failure Evidence

远端 workflow 失败但没有具体错误时，先让用户收集失败原因，不要进入本地构建、上传或猜测修复。

优先收集：

- 触发 branch 或 tag。
- commit hash。
- workflow 名称、运行时间和失败阶段。
- workflow UI 中的失败标题和具体错误。
- 平台发送到开发者、维护者或发布负责人的通知邮件原文。
- 如果平台 UI 的 logs/artifacts 显示成功但总状态失败，继续查平台级发布、上传或处理阶段的失败通知。

拿到具体失败原因前，只输出“去哪里找错误”和“需要粘贴哪些信息”，不能给出修复方案。
