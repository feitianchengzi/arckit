# 发现与恢复

发布单元以团队/应用/平台识别；同一 app 的 iOS 与 macOS 分别选构建、准备资料、提交和核验。目标多义时询问平台或应用，不从目录第一个工程猜测。

## 当前事实

读取应用 bundleId、项目生成源、targets、版本、构建号、已有 App Store 配置、素材与审核记录；再读取后台版本、关联构建及 review submissions。工作区只用于解释事实，选定已上传构建是送审对象。

查找 Cloud run/已有交付记录对 build 的 SHA 关联；能取得对应源码则从该版本读取语言与功能。缺少关联时，使用构建/归档、用户提供的对应截图或后台事实；当前工作区与构建一致性未知时标记缺口，不自动重建或误用新功能截图。

首次没有批准版本时全量检查；后续以已批准资料为基线生成差异；拒审重提保留拒审条目与逐项回应。资料修改可复用同构建，代码变化必须先完成新 TF 构建。已有相同构建已送审时读取并回传既有提交，不重发；其他构建已在审核则说明冲突，不撤回替换。

## 状态与本地文件

公共可共享产物默认 `arckit/app-store-submission/<platform>/<version>-<build>/`：文案、无敏感信息的摘要、素材 manifest、最终截图及来源说明。既有素材目录可以直接引用，不为送审复制一套文件；消费记录保存原 manifest 路径、摘要及本次构建复用依据。可沿用用户既有目录。账号密码、私人联系方式、signed upload URL、原始 API 响应不写入这些文件。

运行状态放 Git common dir 的 `arckit-appstore-submission/<appId>/<platform>/state.json`；目录 0700、文件 0600。无 Git 时使用用户指定仓库外受控目录，不能假装已经有 Git common dir。通过排他文件锁或已有项目锁串行同一发布单元，锁冲突只读查询并交接；不覆盖另一个进行中的任务。

最小恢复字段：schemaVersion、appId、platform、credentialProfile、buildId、version、buildNumber、uploadedDate、versionId、submissionId、素材 manifest 路径/摘要、非秘密审核摘要 digest、确认来源/时间、stage、已完成资源 ID、最后核验时间、阻塞及下一动作。声明确认记录来自真实会话，不由脚本生成授权。

stage 使用 discovered / build_selected / preparing / awaiting_input / awaiting_confirmation / ready_to_submit / submitted / not_submitted / outcome_unknown。

恢复时先读取远端，再决定下一步。价格、地区、版本资料可能被其他人改动；当前状态与确认摘要不一致时只重新确认变化部分。请求结果未知时通过 app/platform/version/build 关联查找，不能直接重发创建或提交。

最终提交只回读当前结果：默认最多 3 次查询、累计不超过 60 秒，遵从 Retry-After，超过上限即保存恢复点。等待目标是确认提交，不是等待 Apple 审核。
