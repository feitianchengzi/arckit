# Cloud、版本和构建关联

## 配置
从 app/ciProduct、workflows、repository 关系定位资源。缺产品或仓库时先完成首次 onboarding/托管平台授权，不能凭 appId 推断 Cloud 可用。修改已有 workflow 前保存配置、比较差异，不关闭其他业务依赖的触发器。

无既有配置时参考：Version Build 监听版本 tag，Archive 主应用 shared scheme，内部 TestFlight 分发；存在 release 验证策略时另配 Build/Analyze/Test。名称不强制。环境 IDs、API 请求体以当前官方 schema 和实际查询为准，不硬编码历史 ID。

APP_STORE_ELIGIBLE 代表可用于后续审核，不代表正式发布或已入组。默认保留后续 App Store 使用能力；有明确 internal-only 要求才改 audience。

API 不公开的 post-action 字段不猜 payload，使用网页/Xcode UI；无浏览器工具时给 workflow、Archive action、内部组及具体动作让用户补齐。用户确认与 API 回读分开记录，用真实构建入组验证。组的自动分发开关不能代替 Cloud 分发配置。

无人值守的后续 tag 分发优先原生 Cloud post-action。Agent 本次 API 补入组不证明未来 tag 自动分发，最终分别报告。原生能力不足时将可信 CI 后处理列为具体缺口，不把管理密钥注入不受信任 PR/tag。

## 版本默认与 Git
优先遵循项目最新 tag 规范、同发布单元历史和稳定线。无需隐式调用 Git skill，也不继承其“push 后停止”范围。

无约定时：保留有效营销版本，无有效值用 1.0.0；内测阶段 beta；tag 为 vMAJOR.MINOR.PATCH-beta.N，N 从 1 开始且无前导零。阶段与分发渠道分开。已有 alpha/rc/stable/tag 前缀不迁移。

先查远端 tags，再分配序号；先查同 SHA 既有构建，避免重复。tag 基础版本对齐目标提交的 app 版本；构建号独立，结合 Cloud 实际编号和已上传版本避免碰撞。多 target 使用 Xcode 实际设置，不全仓库替换所有 MARKETING_VERSION。

在合适的 ci_scripts 阶段添加完整 tag 语法/版本校验并保留原脚本；只有版本归档 workflow 强制 tag，普通验证允许无 tag。CI_TAG、CI_WORKFLOW、CI_BUILD_NUMBER 参照官方变量文档。

执行前展示 branch/remote/SHA/tag/提交文件范围，这是范围说明，不是重复许可。仅推当前已确认目标分支及 tag；未知远端、保护规则、需要切换稳定线时问具体决定。

区分 staged/unstaged/untracked 的原有改动，检查秘密与产物。只提交交付相关且归属明确的文件；不自动 stash/revert/提交用户其他改动。原有代码改动决定交付内容但授权不明时问，不悄悄交付旧 HEAD。

先提交并确认 SHA，推分支，再创建 annotated tag 指向该 SHA，仅推该 tag。已有 tag 同 SHA 续接，异 SHA 停止，不 force。远端竞争重新读取，不能覆盖。推送只证明触发事件已发出。

## run → build 与等待
GET /v1/ciWorkflows/{id}/buildRuns，核对 sourceCommit、sourceBranchOrTag、workflow 与目标 tag/SHA，再 GET /v1/ciBuildRuns/{id}/builds 得到 ASC builds。多 run 按同一意图、进行中/成功状态判断；禁止只选最新上传。

每次等待 15–60 秒，遵守 Retry-After，持续提供进度。单轮默认等待预算 30 分钟，可随用户要求调整；超时保存 runId 和下一步查询，报告 pending，不另发构建、不谎称离线继续监控。获取 actions/issues 后基于证据修复。修复源码需新 commit/tag，不移动旧 tag。

Cloud 成功后还要核对 ASC VALID、未过期、内部测试状态。关联不清就停止分发。手动 API start build 只在明确触发失败、已核实不重复且能保持 tag/commit 语义时采用。

官方（2026-09-18 核对）：
- https://developer.apple.com/documentation/appstoreconnectapi/xcode-cloud-workflows-and-builds
- https://developer.apple.com/documentation/appstoreconnectapi/build-runs
- https://developer.apple.com/documentation/appstoreconnectapi/get-v1-ciworkflows-_id_-buildruns
- https://developer.apple.com/documentation/xcode/environment-variable-reference

