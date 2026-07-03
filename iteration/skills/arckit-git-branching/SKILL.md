---
name: arckit-git-branching
description: 当用户需要选择、创建或治理 main、feature/*、release/*、hotfix/* 分支，处理发布线修复回流、多版本并行，或表达发布/出包/测试分发/应用商店发布意图时作为候选能力使用。软件项目首轮应先由 using-arckit 编译 workflow frame 后路由到本 skill；本 skill 只负责分支规范、tag 规范和通过 git push 远端分支或 tag 触发已配置的远端 workflow；不负责本地构建、测试、archive、导出、上传、发布前验证、外部平台配置、账号授权或真实发布平台操作。
---

# Arckit Git Branching

本 skill 只管理 Git 分支和 Git tag 触发契约。发布意图在这里被转译为：推荐 `release/*` 分支、推荐 tag、确认后创建并 push 到远端，让已配置的远端 workflow 自行出包。

## 硬约束

- `main` 是默认开发和集成分支。
- `feature/<topic>` 只在需要隔离高风险、长周期、多人协作或实验性工作时使用。
- `release/vx.x.x` 是唯一发布稳定分支；内测、公测和正式发布是 tag 触发意图，不是分支类型。
- 不使用 `testflight/*`、`beta/*`、`appstore/*` 作为分支类型。
- `hotfix/<topic>` 只作为正式发布后紧急修复的可选分支。
- 发布线修复必须回流到 `main`；存在后续 `release/*` 时要评估是否同步。
- 出包触发只通过 `git push` 远端分支或 tag 进行：`git push origin release/vx.x.x`、`git push origin <tag>`。
- 本 skill 不输出、不计划、不执行本地构建、测试、archive、导出、上传、提交审核、签名、provisioning、Transporter、Organizer、App Store Connect 操作或发布前验证。
- 本 skill 不修改项目版本号/build 号文件；版本/build 只用于推荐 branch/tag 名称，除非用户另行明确要求修改工程版本。
- 任何创建分支、切换分支、打 tag、push、合并、删除或重置操作前，必须先检查工作区状态并请求用户确认。

## 主流程

### 1. 先定模式

输入：用户原话。

动作：
- `recommend-git-trigger`：用户表达发布、出包、测试分发、应用商店发布、内测、公测、正式发布或发布候选意图，但尚未明确确认执行 Git 操作。
- `apply-git-trigger`：用户已确认采用某个推荐方案，要求创建/推送 `release/*` 或 tag。
- `branch-policy`：用户只询问分支规范、多版本并行、release/hotfix/feature 选择。
- `branch-maintenance`：用户明确要求创建、切换、合并、删除普通分支，或处理 release/hotfix 回流。

退出条件：只能选一个模式。发布类 prompt 默认先进入 `recommend-git-trigger`，不能展开成发布执行计划。

### 2. 推荐 Git 触发方案

仅在 `recommend-git-trigger` 模式执行。

动作：
- 不运行命令，不读取工程文件，不检查 App Store Connect 或外部平台状态。
- 根据用户 prompt 推断渠道：
  - 内测、内部测试、TestFlight 且未说明外部/公测：推荐内部测试 tag。
  - 外部测试、公测、public link、beta：推荐公开测试 tag。
  - 正式发布、上架、App Store 候选、生产发布：推荐正式候选 tag。
- 推荐版本/build：
  - 优先使用用户原话或当前对话中可见的版本/build。
  - 没有可见版本时，给出可修改默认值 `v1.0.0`。
  - 内部测试默认 build 序号从 `b1` 开始；公开测试默认候选序号从 `rc1` 开始。
- 读取 [references/platform-release-triggers.md](references/platform-release-triggers.md) 获取 tag 命名规则；如果 prompt 明确是 Apple/TestFlight/App Store 场景，再读取 Apple reference。
- 输出推荐方案，必须包含：目标分支、目标 tag、远端触发方式、假设的远端 workflow 监听规则、等待用户确认的 Git 操作。

退出条件：给出可执行的 Git 触发建议后停止，等待用户确认。

### 3. 确认后执行 Git 触发

仅在 `apply-git-trigger` 模式执行。

动作：
- 先运行 Git 状态检查：当前分支、工作区是否干净、目标远端是否存在。
- 如果工作区不干净或推荐方案缺少版本/tag，停止并让用户确认处理方式。
- 按已确认方案执行最小 Git 操作：
  - 创建或切换 `release/vx.x.x`。
  - 创建确认过的 tag。
  - push `release/vx.x.x` 到远端。
  - push tag 到远端。
- 只报告 Git 命令结果和远端 workflow 应被哪个 branch/tag 触发；不要继续跟踪远端构建、测试、上传或发布状态。

退出条件：分支/tag 已 push，或因 Git 状态/权限/网络失败而停止并报告。

### 4. 分支规范和维护

动作：
- `branch-policy`：直接给出分支选择建议，不需要读取仓库。
- `branch-maintenance`：先检查 `git status --short` 和当前分支；执行任何写操作前报告计划并等待确认。
- 日常迭代使用 `main`；必要隔离使用 `feature/<topic>`；版本稳定线使用 `release/vx.x.x`；正式发布后紧急修复可选 `hotfix/<topic>`。
- 如果涉及发布线修复，必须说明修复回流到 `main`，以及是否需要同步到其他 `release/*`。

退出条件：给出建议，或在用户确认后完成明确的 Git 操作。

## Reference 路由

- 平台无关的 tag 命名和远端 workflow 触发契约：读 [references/platform-release-triggers.md](references/platform-release-triggers.md)。
- Apple/TestFlight/App Store 的 tag 约定：只在 prompt 明确涉及 Apple 平台或 TestFlight/App Store 时读 [references/xcode-cloud-release-triggers.md](references/xcode-cloud-release-triggers.md)。

## 最终汇报字段

- 选定模式。
- 推荐或已执行的目标分支。
- 推荐或已执行的 tag。
- 远端触发方式：push branch、push tag，或二者。
- 已执行的 Git 操作；如未执行，说明等待确认或阻塞原因。
- 远端 workflow 需要预先监听的 branch/tag pattern。
- 发布线修复回流计划，如适用。
