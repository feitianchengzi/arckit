# 发现、配置和恢复

## 发现顺序
1. 读取适用 AGENTS.md，记录 cwd、Git root、branch、HEAD、upstream、remote 和原有 dirty files。
2. 查找 xcodeproj/xcworkspace、Package.swift、XcodeGen/Tuist 生成源及 CI。用 xcodebuild -list/-showBuildSettings 获取实际配置，不仅正则读取 pbxproj。
3. 识别主 app、扩展、测试和多平台 targets。版本只要求同一分发单元相关 targets 对齐。
4. 查找明确的团队、bundle ID、版本规范和交付配置。不跨全盘扫描私钥，不读取用户其他项目作为默认身份。
5. 发现已有 ASC CLI、Fastlane、MCP 或脚本并评估复用；无入口使用附带脚本。无 Node 18+ 时说明依赖，不能擅自全局安装。

可推断字段直接采用并说明依据。多团队、多主应用、缺凭据或 Bundle ID 命名依据时集中询问最少字段。已有有效营销版本保持；没有时默认 1.0.0。默认应用名为产品名，组名为“产品名 Internal”。Developer Team ID 与 API Issuer ID 不同，不能互换。

## 记录契约
优先沿用项目现有路径。否则非秘密共享配置可放 arckit/delivery/apple.json，进度放 Git common dir 下 arckit-appstore-delivery/<发布单元>/state.json（不提交）。通过 git rev-parse --git-common-dir 处理 worktree；写入前检查该发布单元是否有并发任务，避免同时分配 tag。

配置：schemaVersion、发布单元、platform、project/workspace、scheme、teamId、bundleIds、appId、workflowId、groupId、remote、tag 规则来源、测试成员策略。凭据仅从环境或明确的本机配置引用；共享配置不含绝对私钥路径、成员邮箱或 token。

进度：schemaVersion、repo 标识、发布单元、目标 SHA/tag、获准范围及指令来源、资源 IDs、runId/buildId、阶段状态、verifiedAt、证据摘要、pendingHumanAction 和下一步查询。旧记录不提供无限授权，当前用户指令优先。

使用同目录临时文件及原子 rename，权限 0600，保留上一个有效记录。解析失败不盲目覆盖。恢复时无论记录是否完整，都重新查询关键远端事实。这个版本由 Agent 维护记录，不宣称附带 API 客户端是自动状态机或常驻服务。

## 幂等键
- team + bundleIdentifier
- app + platform
- product + repository + workflow
- app + internal group
- app + 规范化 tester email
- workflow + tag + SHA → run → build

匹配多个候选时消歧。写前记录 intended change，写后记录 ID 和回读结果。写超时为 outcome_unknown：查询再决定，不直接重放。409 也先查冲突资源。

已存在匹配 run 则续接；同提交已交付则报告完成；只有代码变动或明确重建意图才新发构建。不能每次调用自动增加 tag 序号。

