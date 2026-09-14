# Platform Git Trigger Contract

本 reference 定义平台无关的分支、tag 和远端 workflow 触发契约。它不描述构建、上传、审核、账号、签名或外部平台配置步骤。

## Operation Authorization

操作级授权及其有效期以 [SKILL.md 的入口授权门禁](../SKILL.md#入口授权门禁) 为准。下列示例用于应用该门禁，不新增授权。

代表性判断：

- “git commit”“提交这些改动”“把改动提交一下” -> 只授权在当前分支 stage/commit，不授权分支变更或 push。
- 当前 `main` + “git commit” -> 保持 `main` 并提交。
- 当前 `feature/a` + “git commit” -> 保持 `feature/a` 并提交。
- “创建 feature/a 后提交” -> 检查状态并按明确授权创建/切换后提交。
- “按分支规范准备发布” -> 先推荐 release/tag 基线，不执行分支或 tag 写操作。
- 已明确授权某 tag 与基线的创建/推送，随后仅补充版本说明 -> 原授权仍有效且目标未变时继续执行，不重复确认。
- 只要求创建 tag -> 不因这项授权自行创建、切换或 push 分支。

## Core Model

- 分支决定代码生命周期。
- tag 标识版本，远端 workflow 按约定识别出包意图。
- tag 不强制绑定 `release/*`。
- 已存在的 `release/*` 是版本稳定线；同一发布单元的版本基线按下方 Baseline Policy 核对，不能绕过对应稳定线。
- 默认推荐通过 tag push 触发出包，不推荐为渠道创建分支；已有 CI 的实际触发方式以 Workflow Patterns 为准，不自动改造。

## Branch Policy

`main`

- 唯一长期开发主线。
- 日常迭代、新功能、小修复默认进入 `main`。

`feature/<topic>`

- 可选隔离分支。
- 仅用于长周期、高风险、多人协作、实验性开发或需要独立评审的工作。
- 上述条件只支持推荐，不授权自动创建；必须由用户明确要求或确认。
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

- `vx.x.x-alpha.N`：早期预发布，例如 `v1.2.3-alpha.1`。
- `vx.x.x-beta.N`：beta 测试版本，例如 `v1.2.3-beta.1`。
- `vx.x.x-rc.N`：正式发布候选，例如 `v1.2.3-rc.1`。
- `vx.x.x`：正式版本，例如 `v1.2.3`；tag 不代表部署或平台发布已成功。
- 默认采用 SemVer 版本部分，`v` 是 Git tag 前缀。已有版本/tag 约定优先，不自动重命名历史 tag 或修改 CI。
- 独立发布单元可采用 `<unit>/v<version>`；已有命名空间及包管理生态要求优先。同一产品的不同平台构建不必分别命名。
- tag 表达版本；构建号和分发渠道由项目构建/发布配置管理，不编码为平台渠道前缀。

Prompt mapping:

- 明确 alpha、beta、发布候选或正式版本时，使用对应阶段的 tag；无需依次经历全部阶段。
- 内测、公测、测试分发或环境名称只表达分发意图，不能单独决定 alpha/beta/rc；结合项目版本事实推荐，信息不足时说明待确定阶段。
- “正式发布候选”使用 `-rc.N`，“正式版本”使用无预发布后缀的 tag。

`N` 在同一发布单元、目标版本和预发布阶段内从 1 开始递增，使用独立数字段（如 `rc.2`、`rc.10`），按 SemVer 规则排序。结合下方 Git Checks 中的 tag 历史检查选择序号；历史不可见时不能把 `.1` 当成已确认可用的序号。

版本命名与排序依据：[Semantic Versioning 2.0.0](https://semver.org/)。

## Baseline Policy

- 先根据仓库版本声明、历史 tag 和发布配置确定发布单元及维护线归属；版本比较、tag 历史和维护线检查仅在同一发布单元内进行。归属不明时报告缺口，不拿其他单元的高版本约束当前发布，也不自动引入新的分支命名体系。
- tag 阶段由版本成熟度决定，下列基线偏好由发布用途决定；两者分别判断。
- 内部测试 tag 可以基于 `main` 或 `release/*`。
- 外部测试或公测 tag 默认应基于 `release/*`；如果用户明确要从 `main` 出外部测试，先说明风险并等待确认。
- 正式发布候选或正式版本 tag 必须基于 `release/*`、正式发布修复线，或用户明确确认的发布候选 commit；不要默认从 `main` 直接创建。
- 如果 `release/vx.x.x` 已存在，该版本的预发布和正式 tag 默认都应基于该 release 线。
- 如果已有更高版本 `release/*`，不要从 `main` 给更低版本直接打 tag；先确认对应 release/hotfix 基线。
- 如果目标版本没有 `release/*`，内部测试可以基于 `main`，不要强迫创建 release 分支。
- 如果目标版本没有 `release/*`，外部测试或正式候选应建议先创建 `release/vx.x.x`，但必须由用户确认。

## Workflow Patterns

先只读核对仓库内 CI 的触发事件、ref 过滤及手动输入。已有配置决定实际触发行为，下面仅是无既有约定时的推荐 pattern；不以建议覆盖项目事实。

远端 workflow 推荐监听：

- `release/v*` branch push：版本线验证。
- `v*` tag push：版本出包入口；使用命名空间时采用对应 `<unit>/v*`。
- workflow 应校验完整 tag，再区分 `-alpha.N`、`-beta.N`、`-rc.N` 和正式版本；`v*` 本身不能区分阶段。
- 版本阶段与构建目标、环境或分发渠道的映射以项目配置为准，不预设平台专用监听规则。
- 已有流程采用手动输入既有 tag 时，报告对应输入和配置位置；push 该 tag 不等于启动流水线，Git 授权不包含手动启动。
- 建议命名与现有监听条件不匹配时，报告差异与预期影响，不自动改 CI，也不声称 tag push 必然出包。

agent 只负责推荐、创建和 push branch/tag。push 后不继续追踪远端 workflow、构建产物、上传状态或发布平台状态。

如果仓库中找不到 fastlane、CI、远端 workflow 或平台发布配置，只能报告“远端监听不可见”或请求用户确认监听规则。配置不可见不构成本机 fallback 的理由；不要改走本机构建、归档、导出、上传、签名或发布平台操作。

## Git Checks

推荐或执行前允许读取 Git 状态/历史及仓库内版本、发布说明和 CI 配置；文件读取不构成构建或平台操作授权。Git 只读命令例如 `git status`、`git branch`、`git tag`、`git ls-remote`、`git log`、`git rev-parse`、`git show`、`git merge-base`。

必须检查：

- 当前分支和工作区状态，用于判断操作环境；不以当前 HEAD 代替用户指定的发布目标。
- 目标 remote、本地和远端是否存在同一发布单元的目标 `release/vx.x.x` 或项目已明确映射的维护线。
- 同一发布单元是否存在更高版本活跃 `release/*`。
- 本地和远端是否已存在目标 tag，以及选择预发布序号所需的同版本同阶段 tag 历史；远端不可访问时报告未知。
- 将目标基线或用户指定的 commit 解析为目标 commit SHA，检查其是否符合 Baseline Policy；使用分支基线时核对目标 commit 的包含关系，使用明确确认的候选 commit 例外时记录依据。
- 核对目标 commit 中的版本声明和相关 CI 配置；读取当前工作区文件时，标明与目标 commit 的差异，不能把未提交配置当作已生效的远端规则。
- tag 应指向上述目标 commit；当前分支可以不同，创建 tag 本身不要求切换分支。

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
