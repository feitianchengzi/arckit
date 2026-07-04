---
name: arckit-git-branching
description: 处理 Git 分支规范、release/feature/hotfix 选择、多版本并行、发布线修复回流、tag 出包触发和远端 workflow 失败原因收集。默认由 using-arckit 在判断本轮发布/出包意图应收敛到 Git 契约时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。不负责非 Git 发布实现、平台账号配置或无证据修复。
---

# Arckit Git Branching

把发布相关请求收敛到 Git 层：分支决定代码生命周期，tag 决定远端出包意图。tag 不强制绑定 `release/*`，但必须尊重已存在的版本稳定线。

## 使用边界

- 只处理 `main`、`feature/*`、`release/*`、`hotfix/*` 的分支策略和合并流向。
- 只处理 `tf/*`、`beta/*`、`appstore/*` 的 tag 命名、基线选择和 push 触发。
- TestFlight、App Store 或应用商店发布意图默认只做 Git trigger：推荐基线和 tag，确认后最多创建并 push release 分支或 tag。
- 禁止把发布意图扩展成本机出包、归档、导出、上传、签名或商店平台操作；不得调用 `xcodebuild`、archive、exportArchive、Organizer、Transporter、altool、App Store Connect 上传/查询、签名或 provisioning 处理，除非用户明确说“不要走 tag，改成本机上传”或等价指令。
- 找不到 fastlane、CI、Xcode Cloud 或远端 workflow 配置时，只报告远端监听不可见或需要用户确认监听规则；不得 fallback 到本机构建、归档或上传。
- 写操作前必须检查 Git 状态并等待用户确认。
- push 后停止，不跟踪远端构建、上传或发布平台状态。
- 远端失败但缺少具体错误时，只收集失败原因原文，不猜测修复。

## 模式选择

- `branch-policy`：用户询问分支规范、多版本并行、release/hotfix/feature 选择。
- `branch-maintenance`：用户要求创建、切换、合并、删除分支，或处理 release/hotfix 回流。
- `recommend-git-trigger`：用户表达发布、出包、测试分发、应用商店发布、内测、公测、正式发布或发布候选意图，但尚未确认 Git 操作。
- `apply-git-trigger`：用户已确认目标基线和 tag，要求创建/推送分支或 tag。
- `workflow-failure-evidence`：用户反馈 branch/tag 触发后的远端 workflow 失败、缺少日志、缺少上传历史或不知道失败原因在哪里看。

发布类 prompt 默认先进入 `recommend-git-trigger`，不要展开成平台发布计划。

## Reference 路由

- 分支策略、tag 基线、检查清单和平台无关 workflow pattern：读 [references/platform-release-triggers.md](references/platform-release-triggers.md)。
- Apple / Xcode Cloud / TestFlight 场景下的 workflow pattern 和失败证据入口：读 [references/xcode-cloud-release-triggers.md](references/xcode-cloud-release-triggers.md)。

## 操作协议

### 分支规范或维护

- 按 reference 的 Branch Policy 和 Merge Policy 输出建议。
- 若涉及 release：必须说明 `release/*` 创建后冻结，不再整体合并 `main`；必要修复通过 cherry-pick/backport 进入 release。
- 若涉及 hotfix：必须说明它是可选分支；能在活跃 `release/*` 上修复时优先使用 `release/*`。

### 推荐 tag 触发

- 只做 Git 状态检查：当前分支、工作区、本地/远端 `release/*`、本地/远端目标 tag。
- 只允许 Git 只读检查命令，例如 `git status`、`git branch`、`git tag`、`git ls-remote`、`git log`、`git rev-parse`；不得运行构建、测试、归档、上传、签名、平台查询或依赖安装命令。
- 根据用户意图推荐 tag：内部测试 `tf/*`，外部测试/公测 `beta/*`，正式候选 `appstore/*`。
- 根据已有 release 状态推荐基线：
  - 目标 `release/vx.x.x` 已存在：优先基于该 release。
  - 目标 release 不存在且是内部测试：可以基于 `main`。
  - 目标 release 不存在且是外部测试或正式候选：建议创建 release，但等待用户确认。
- 输出推荐基线、tag、远端监听 pattern、远端 workflow 配置是否可见、确认后将执行的 Git 操作，然后停止。

### 执行 tag 触发

- 检查当前分支、工作区、远端、目标 release、目标 tag。
- 如果工作区不干净、tag 已存在、缺少版本/tag，或目标基线违反规则，停止并请求确认。
- 只执行已确认的最小 Git 操作：必要时切换/创建基线分支，创建 tag，push 相关分支，push tag；不得追加构建、测试、归档、上传、签名、平台查询或远端状态追踪。
- push 完成后只报告 Git 结果和远端 workflow 应被哪个 branch/tag 触发。

### 收集失败原因

- 收集触发 branch/tag、commit、workflow 名称、失败时间、失败标题、具体错误和平台通知。
- Apple 首次上传导致 TestFlight 看不到上传历史时，优先检查开发者账号邮箱；Xcode Cloud Build 泛化标题和成功 artifacts 不能证明整体成功。
- 拿到失败原因原文后，再交给 debug、平台配置或实现修复任务。

## 最终汇报

- 选定模式。
- 推荐或已执行的基线分支/commit。
- 推荐或已执行的 tag。
- 远端触发方式和监听 pattern。
- 已执行的 Git 操作；如未执行，说明等待确认或阻塞原因。
- 如涉及失败收集：已建议检查的失败信息入口和仍缺少的失败原因原文。
- 如涉及 release/hotfix：回流和同步计划。
