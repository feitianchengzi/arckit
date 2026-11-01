# Cloud、版本和构建关联

## 配置
从 app/ciProduct、workflows、repository 关系定位资源。缺产品或仓库时先完成首次 onboarding/托管平台授权，不能凭 appId 推断 Cloud 可用。修改已有 workflow 前保存配置、比较差异，不关闭其他业务依赖的触发器。

无既有配置时参考：Version Build 监听版本 tag，Archive 主应用 shared scheme 并上传 App Store Connect；后续内测分发由 Agent 调用 API 完成。仅在项目明确需要时配置独立验证 workflow，不从通用分支建议自动新增 Release Validation。名称不强制。环境 IDs、API 请求体以当前官方 schema 和实际查询为准，不硬编码历史 ID。

APP_STORE_ELIGIBLE 代表可用于后续审核，不代表正式发布或已入组。默认保留后续 App Store 使用能力；有明确 internal-only 要求才改 audience。

TestFlight post-action 是可选既有配置，不是本 skill 的交付依赖。不要求用户补配，不用其字段不可读作为阻塞理由；保持现有设置，不擅自删除。无论是否有 post-action，都读取实际组状态：已有本次 build 则跳过，否则通过 API 入组。构建上传仍须真实验证，不把 Archive 成功当作上传成功。

skill 在当前 Agent 会话中追踪并执行 API 分发；中断后再次调用续接。只推 tag、且没有 Agent 或其他执行器运行时，本 skill 不会自行启动。若用户另要完全无人值守，需要单独接入可信 CI/调度执行器；不把本次 API 成功描述成未来 tag 已自动分发，也不向不受信任 PR/tag 注入管理密钥。

## 版本默认与 Git
优先遵循项目最新 tag 规范、同发布单元历史和稳定线。无需隐式调用 Git skill，也不继承其“push 后停止”范围。

本入口已经明确授权内部测试目标，Agent 按项目版本事实及既有规范选择 tag，不再询问“内测还是外测”，也不以新增 tag→渠道配置为前置。tag 仍表达版本阶段：已有 alpha/beta/rc 阶段保持，不由 beta 推断外测、不由 stable 推断正式上架。若项目有明确相冲突的分发策略才澄清具体冲突。

无约定时：保留有效营销版本，无有效值用 1.0.0；预发布默认 beta；tag 为 vMAJOR.MINOR.PATCH-beta.N，N 从 1 开始且无前导零。已有 alpha/rc/stable/tag 前缀不迁移。

先查远端 tags，再分配序号；先查同 SHA 既有构建，避免重复。tag 基础版本对齐目标提交的 app 版本；构建号独立，结合 Cloud 实际编号和已上传版本避免碰撞。多 target 使用 Xcode 实际设置，不全仓库替换所有 MARKETING_VERSION。

在合适的 ci_scripts 阶段添加完整 tag 语法/版本校验并保留原脚本；只有版本归档 workflow 强制 tag，普通验证允许无 tag。CI_TAG、CI_WORKFLOW、CI_BUILD_NUMBER 参照官方变量文档。

执行前展示 branch/remote/SHA/tag/提交文件范围，这是范围说明，不是重复许可。仅推当前已确认目标分支及 tag；未知远端、保护规则、需要切换稳定线时问具体决定。

区分 staged/unstaged/untracked 的原有改动，检查秘密与产物。只提交交付相关且归属明确的文件；不自动 stash/revert/提交用户其他改动。原有代码改动决定交付内容但授权不明时问，不悄悄交付旧 HEAD。

先提交并确认 SHA，推分支，再创建 annotated tag 指向该 SHA，仅推该 tag。已有 tag 同 SHA 续接，异 SHA 停止，不 force。远端竞争重新读取，不能覆盖。推送只证明触发事件已发出。

## run → build 与等待
GET /v1/ciWorkflows/{id}/buildRuns，核对 sourceCommit、sourceBranchOrTag、workflow 与目标 tag/SHA，再 GET /v1/ciBuildRuns/{id}/builds 得到 ASC builds。多 run 按同一意图、进行中/成功状态判断；禁止只选最新上传。

等待按下述分阶段观测和时间边界执行。获取 actions/issues 后基于证据修复；修复源码需新 commit/tag，不移动旧 tag。

Cloud 成功后还要核对 ASC VALID、未过期、内部测试状态。关联不清就停止分发。手动 API start build 只在明确触发失败、已核实不重复且能保持 tag/commit 语义时采用。

## 构建等待与异常诊断

- 分别观测归档、导出、上传、Apple 处理和 TestFlight 可用状态。整体 RUNNING 只表示 run 未结束，不能直接解释为仍在编译或归档。
- 结合 ciBuildRuns/{id}/actions、相关 action 的 issues/日志、buildUploads 及 builds/buildBetaDetail 判断阶段。使用当前官方 schema 与真实资源关系；按 app、版本、构建号及关联证据核对上传记录，不取最新记录代替本次产物。端点无权限或证据不可见时说明限制，不猜测结果。
- 已有关联 build ID 而详情返回 404 时，主动检查上传记录及资源关联，不能只重复请求 build。归档/导出成功、对应上传已完成但 build 详情尚不可读时，定位到“上传后的 Apple 处理或可见性同步阶段”；具体内部原因未知，上传完成本身不证明 TestFlight 可用。404 单独不能证明正在处理或构建失败。
- 同一阶段持续 5 分钟没有实质变化时，升级诊断，检查 issues、上传错误及阶段日志。该阈值触发调查，不判定失败；新的查询时间不算进展。记录诊断结果，无新证据时不每轮重复拉取全部日志。
- 每次查询记录 observedAt、资源类型/ID、响应状态、平台状态、阶段判断及其依据。平台返回的 startedDate/finishedDate 等单独记录；缺失时标记未知，不用 Agent 首次观察时间代替平台实际完成时间。只保存必要摘要，不落盘 token、签名 URL 或完整敏感响应。
- 进度反馈优先说明新增证据；状态未变时简短说明当前阶段和已等待时间，避免反复承诺“继续等待”。没有失败证据时，不推断签名故障或轮询导致平台阻塞。

## 等待上限与人工接手

- 开始跟踪时记录本轮 waitStartedAt 和 waitDeadline，默认总预算 30 分钟，可由用户明确调整。预算覆盖归档至 TestFlight 可用期间的等待、查询、诊断和重试；阶段变化、404、网络重试或工具返回 running 都不重置截止时间。这是 Agent 执行边界，不是 Apple 服务时限或失败判据。
- 正常每次等待 15–60 秒，遵守 Retry-After；每次查询、重试或等待前检查剩余预算。Retry-After 超过剩余预算时不提前重试，直接进入人工交接。
- 达到截止时间且目标未被验证完成时，结束本轮自动执行，不再发起新轮询、重试、后台监控或自动续轮。保存原 runId、已知 upload/build ID、目标 SHA/tag、时间记录、最新阶段证据、诊断结果及下一步查询，报告 pending / 等待人工决定。
- 交接说明已完成什么、哪里仍未知、已经检查什么，以及可在 Apple 后台查看的原 run/构建。用户可选择稍后续接、人工处理或结束任务；不要求用户再操作才能让 Agent 停止。停止自动等待不取消 Apple 云端任务，也不意味着交付完成。
- 会话中断后恢复原 run，并保留原截止时间；预算已耗尽时保持交接状态。只有用户明确要求继续等待才开启新预算，记录该指令；不会自动新建 tag/run 或重建。用户要求停止时立即停止后续自动动作。

官方（阶段观测入口于 2026-11-01 核对，执行时检查当前 schema）：
- https://developer.apple.com/documentation/appstoreconnectapi/xcode-cloud-workflows-and-builds
- https://developer.apple.com/documentation/appstoreconnectapi/build-runs
- https://developer.apple.com/documentation/appstoreconnectapi/get-v1-ciworkflows-_id_-buildruns
- https://developer.apple.com/documentation/xcode/environment-variable-reference
- https://developer.apple.com/documentation/appstoreconnectapi/get-v1-cibuildruns-_id_-actions
- https://developer.apple.com/documentation/appstoreconnectapi/build-uploads
