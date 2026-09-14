---
name: arckit-git-branching
description: 当用户明确询问或要求 Git 分支策略/维护、release/feature/hotfix 选择、多版本并行、发布线回流、tag 出包触发或远端 workflow 失败证据时使用。普通 status/add/commit/log/diff 不单独触发；没有显式分支操作授权时必须保持当前分支，不负责非 Git 发布实现、平台账号配置或无证据修复。
---

# Arckit Git Branching

把发布相关请求收敛到 Git 层：分支决定代码生命周期，tag 标识版本，远端 workflow 按约定识别出包意图。tag 不强制绑定 `release/*`，但必须尊重已存在的版本稳定线。

## 使用边界

- 默认保持命令执行前的当前分支；不得根据任务规模、风险、发布规范或先前策略讨论自行创建或切换分支。
- 用户只要求 `status`、`add`、`commit`、`log`、`diff` 或其他非分支操作时，只授权该操作；`git commit` 必须提交到当前分支，不授权创建、切换、合并或删除分支。
- 创建、切换、合并、删除、回流或 push 分支必须来自用户对该操作和目标分支的显式要求或确认；一种 Git 写操作的授权不能传递为另一种操作的授权。
- release/tag/出包规则只约束用户明确选择的 release 或 tag 操作，不自动改变普通提交所在分支，也不把“推荐 feature/release”变成执行授权。
- 只处理 `main`、`feature/*`、`release/*`、`hotfix/*` 的分支策略和合并流向。
- tag 默认使用 `vx.x.x` 或 `vx.x.x-alpha.N`、`vx.x.x-beta.N`、`vx.x.x-rc.N`，命名细节见 reference；已有项目 tag 约定不自动迁移。
- 发布、出包或测试分发意图默认只做 Git trigger：推荐基线和 tag，确认后最多创建并 push release 分支或 tag。
- 禁止把发布意图扩展成本机出包、归档、导出、上传、签名或发布平台操作，除非用户明确说“不要走 tag，改成本机发布”或等价指令。
- 找不到 CI 或远端 workflow 配置时，只报告远端监听不可见或需要用户确认监听规则；不得 fallback 到本机构建、归档或上传。
- branch/tag 写操作前必须检查 Git 状态，并确认具体操作和目标仍在用户授权范围内。
- push 后停止，不跟踪远端构建、上传或发布平台状态。
- 远端失败但缺少具体错误时，只收集失败原因原文，不猜测修复。

## 模式选择

- `branch-policy`：用户询问分支规范、多版本并行、release/hotfix/feature 选择。
- `branch-maintenance`：用户明确要求创建、切换、合并、删除或回流某个分支，或明确确认此前推荐的具体分支操作。
- `recommend-git-trigger`：用户表达发布、出包、测试分发、应用商店发布、内测、公测、正式发布或发布候选意图，但尚未确认 Git 操作。
- `apply-git-trigger`：用户已确认目标基线和 tag，要求创建/推送分支或 tag。
- `workflow-failure-evidence`：用户反馈 branch/tag 触发后的远端 workflow 失败、缺少日志、缺少上传历史或不知道失败原因在哪里看。

发布类 prompt 尚未满足执行授权与目标条件时进入 `recommend-git-trigger`；条件已满足时直接进入 `apply-git-trigger`，不重复请求同一授权。两种模式都不展开成平台发布计划。

## 入口授权门禁

1. 先读取当前分支和工作区，只把它们作为事实，不从分支规范推导写操作。
2. 结合最新指令与会话中仍有效的明确授权，确定本轮 Git 操作及目标；补充信息不使原授权自动失效。先前策略讨论、skill 规则和风险判断不能补充授权；目标改变、授权被撤回或实际操作超出范围时重新澄清。
3. 如果没有明确的分支生命周期操作，保持当前分支，不进入 `branch-maintenance`。用户只要求 commit 时，交给普通 Git 提交流程在当前分支完成。
4. 如果用户只询问策略，进入 `branch-policy` 或 `recommend-git-trigger`，只输出建议；推荐分支不等于获准创建或切换。
5. 只有分支操作及目标明确时才进入 `branch-maintenance`；目标不明确或实际操作超出确认范围时停止并澄清。

## Reference 路由

- 分支建议/维护时读取 [通用 reference](references/platform-release-triggers.md) 的 Branch Policy、Merge Policy；tag 建议/执行时读取 Tag Policy、Baseline Policy、Workflow Patterns、Git Checks；失败收集时读取 Failure Evidence。完整策略与检查清单在该 reference 维护。
- Apple / Xcode Cloud / TestFlight 场景再读取 [平台补充](references/xcode-cloud-release-triggers.md)：触发建议读取 Workflow Patterns、Apple Defaults、Boundary；失败收集读取 Failure Evidence、Boundary。平台补充保留专项经验，版本/tag 规则沿用通用 reference。

## 操作协议

### 分支规范或维护

- 按 reference 的 Branch Policy 和 Merge Policy 输出建议。
- 执行前复述本轮获准的分支操作和目标；若用户没有显式授权分支变更，报告保持当前分支并停止分支维护。
- 涉及 release/hotfix 时，必须按 reference 说明冻结范围、必要修复的进入方式、hotfix 适用条件及回流计划。

### 推荐 tag 触发

- 按 reference 的 Git Checks 只读检查 Git 状态、目标 refs，以及仓库内版本声明和 CI 配置；命令与信息范围以该清单为准。不得运行构建、测试、归档、上传、签名、平台查询或依赖安装命令。
- 按 Tag Policy 确定版本阶段与 tag，按 Baseline Policy 确定基线，并解析目标 commit SHA；同一发布单元内核对历史，工作区当前 HEAD 不代替目标 commit。
- 按 Workflow Patterns 区分推荐监听方式和实际配置；配置不可见或与建议不符时报告差异，不自动迁移。
- 输出推荐基线、目标 commit、tag、实际触发证据或缺口，以及需要授权的 Git 操作，然后停止；已有明确执行授权的任务按模式选择进入 apply。

### 执行 tag 触发

- 按 Git Checks 重新核对当前分支、工作区、远端、目标 release/tag 和目标 commit，确认仍符合已授权方案。
- 如果工作区不干净、tag 已存在、缺少版本/tag，或目标基线违反规则，停止并请求确认。
- 只执行已确认的最小 Git 操作：必要时切换/创建基线分支，对已确认的目标 commit 创建 tag，push 相关分支，push tag；创建 tag 本身不要求切换分支，各项分支操作仍须单独在授权范围内；不得追加构建、测试、归档、上传、签名、平台查询或远端状态追踪。
- push 完成后只报告 Git 结果和配置证据支持的远端触发预期；手动触发流程仅说明对应 tag 输入，不自动启动。未见配置时明确未知，不声称已出包或发布成功。

### 收集失败原因

- 按通用 Failure Evidence 收集触发信息、运行信息和错误原文；涉及 Apple 时按平台 reference 的优先检查顺序和最小信息清单补充，尤其核对首次上传无历史的情况。
- 拿到失败原因原文后，再交给 debug、平台配置或实现修复任务。

## 最终汇报

- 选定模式。
- 推荐或已执行的发布单元、基线分支及目标 commit SHA。
- 推荐或已执行的 tag。
- 远端实际触发方式、监听 pattern 或手动输入，以及配置证据或未知项；推荐方案与实际配置不符时列出差异。
- 已执行的 Git 操作；如未执行，说明等待确认或阻塞原因。
- 如涉及失败收集：已建议检查的失败信息入口和仍缺少的失败原因原文。
- 如涉及 release/hotfix：回流和同步计划。
