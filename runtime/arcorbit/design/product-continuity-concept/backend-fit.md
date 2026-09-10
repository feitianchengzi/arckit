# 两个远端来源下的 Product / Today 探索策略

状态：候选交互方案；不改变正式规格，不新增服务端，不表示相关客户端整合已经实现。

## 已核对的边界

- Workshop Project 已有 id/name/git_url/organization_id 和成员关系；没有产品理念、版本、迭代字段。证据：services/workshop-api/models/project.go；runtime/arcorbit/src/workshop-platform-adapter.mjs 的 createProject/updateProject。
- Task 已有 project_id、content、state、executor_id、tags；Tag 是项目内名称。没有原生 iteration_id、截止日期、周期计划。证据：services/workshop-api/models/task.go、tag.go。
- Feedback 已有消息、当前用户通知及已读接口、转待办、关联任务状态。证据：services/workshop-api/router/router.go，handler/feedback_workflow.go，models/feedback_workflow.go。
- Today 已能从 Work、Chat、Automation 和本地恢复状态派生当前用户责任；本机配置与共享项目权限分开。证据：runtime/arcorbit/src/desktop/today-workspace.mjs。生产已有能力继续保留。
- 目前仓库地址已进入平台模型；本次检查没有发现可直接复用的 Product 文档编辑、版本发布聚合客户端。这些需要新增客户端/Agent 工具适配，但无需自建新服务端。

## 交互策略：Product

Product 以现有 Workshop Project id 作为共享产品身份，名称、组织、成员、仓库关系来自原项目。目录也显示本机 Idea 草稿，清晰标注“仅此设备”；同一个 Git URL 不自动合并不同项目。共享项目没有仓库时也可以使用 Work 和 Feedback。

产品理念、产品说明、定义、设计、决策和迭代计划存放在已关联仓库文档中。客户端读取与投影，Agent 理解现有目录并提出资料落点，用户可直接编辑。优先复用原文档，不自动创建平行权威源。本原型用 product/vision.md 和 product/iterations.md 作为示意路径，正式路径按仓库事实确定。

状态流：仓库版本 → 本机修改 → 查看本次差异 → 确认提交到仓库 → 读回结果。表单编辑、Agent 编辑均只改变本机草稿；仓库确认之前不宣称团队已同步。仓库不可用/没有写权限/远端版本变化时保留草稿；远端变化先核对差异，再由用户选择当前内容或仓库内容。受保护分支沿用 GitHub PR 规则，PR 未合并前不能显示资料分支已更新。本版只模拟可直接写入的资料分支及写入受阻，不模拟 PR 审批。

没有仓库时支持本机资料草稿及继续 Idea 接入，不承诺跨设备恢复；已经有项目但没有仓库时在现有项目设置关联仓库。共享项目身份、仓库资料、当前设备目录使用独立状态，接入成功不等于草稿已推送。

轻量迭代采用“仓库计划 + 稳定的项目待办标签”。计划保存名称、目标、标签；任务通过现有 tags 字段关联。修改迭代名称不重命名标签；新建迭代不会自动归入全部旧任务。标签关系的变更在 Work 完成，Product 只读统计。跳转携带 project id + 显式标签；返回恢复产品页签。资料提交和待办标签修改是两个独立操作，无跨来源原子事务。

版本记录来自 GitHub Releases，区分正式发布、预发布和草稿；Git tag 和待办验收完成均不等于正式发布，更不等于部署上线。没有接入部署与分析平台时不展示线上健康、用户增长、营收、渠道归因或精确上线率。

## 交互策略：Today

Today 在客户端聚合可访问产品的来源对象。人工责任依据当前用户角色和原来源责任判定；示例中待办执行人为当前用户。对象用来源 + id 去重。跳转到 Work/Automation/Chat 原操作台，源动作成功后刷新 Today，同一责任才消失。没有独立的 Today 完成状态。

反馈新消息单独展示，读取现有当前用户通知。只有打开消息或显式已读成功后减少未读；已读不会把反馈标记解决。回复在 Feedback 发送，任务完成依据原关联状态展示。未读不是当前用户被分配了任务。

本机未完成接入、暂停执行和待提交资料可以继续；它们明确属于当前设备，不伪装成团队共享责任。Today 的项目配置职责继续保留，本稿用本机连接摘要和跳转承接，不重设计完整配置台。

来源读取失败时保留缓存，标注“最近记录 / 待刷新”，不显示“全部处理完”。依赖不可用来源的写入暂停，本机草稿可继续编辑。恢复来源后重新派生责任与摘要，不额外维护一套完成记录。本机 Runtime 也不能代表其他设备的运行总量。

## 闭环取舍

| 预期能力 | 本轮承载 | 程度 |
| --- | --- | --- |
| 产品目录、组织成员、仓库关联 | 现有 Workshop Project | 原接口可支撑，新增 Product 客户端投影 |
| 待办状态、验收与反馈协作 | 现有 Task / Feedback + 原页面 | 可闭环 |
| 理念与核心资产 | 已有仓库文档 + Git 提交 | 换方案闭环，需要客户端编辑/冲突/权限适配 |
| 版本迭代 | 仓库计划 + 项目待办 tags | 轻量闭环；不做独立云端迭代对象、复杂排期 |
| 已发布版本 | GitHub Releases | 可读取真实发布记录，客户端集成待做 |
| Today 责任、消息、设备恢复 | 原来源实时读取或本地缓存投影 | 可闭环，未读/责任/本机动作分开 |
| 空白 Idea 与产品对话 | ArcOrbit 本机草稿 / Codex thread | 单设备闭环，暂不承诺团队对话与草稿同步 |
| 线上运营效果、部署健康、跨设备运行总览 | 当前无可信数据来源 | 本轮不展示指标，原 Lifecycle 页面仍保留 |

## 外部能力核验

GitHub Releases API 返回 draft、prerelease、published_at 等字段，能区分版本发布状态：[官方文档](https://docs.github.com/en/rest/releases/releases)。
GitHub 分支保护可以要求评审和检查；资料提交需遵守原仓库规则：[官方文档](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)。

## document_scope / fact_result

- scope_kind: change；根目录 runtime/arcorbit/design/product-continuity-concept/。
- updated: Product / Today 可交互演示、README、state-map；created: backend-fit.md、support-model.js、today-views.js。
- source_basis: 用户明确只用现有待办反馈服务器和 GitHub，保留 Product Lifecycle 原页面。
- summary: 用共享项目、仓库资料、标签迭代及来源责任组成 Product / Today 闭环，补充本机草稿与同步失败状态。
- fact_result: 探索方案与本地原型；canonical arckit/interaction/spec/tech、生产代码与服务端均未修改。
