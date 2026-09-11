# Today 第三栏验收问题缺失：诊断证据

后续状态：本文件保留修复前的历史诊断。修复实现、验证与临时日志清理见同目录 `verification.md`；`reproduce.mjs` 已转换为修复回归入口，原运行事件保存在 `trace.json`。

## 结论与边界

2026-09-11，在当前工作区源码的隔离运行中确认一个足以独立造成用户症状的缺陷：Today 使用平台的 Work 任务投影，却未接入 Automation 拥有的验收问题集合。提交成功、完整刷新和当前责任选择均正常时，第三栏仍显示空问题列表。

这不是用户现场抓包或 Electron DOM 验收。测试使用合成项目、任务、账号、已完成 Run/Case/session/thread；磁盘 Store 与消息接口由受控 adapter 提供，Work Sync 使用符合真实输出结构的固定任务快照，网络和模型执行不发生。生产 Automation Coordinator、Platform Coordinator、Today 派生函数，以及从当前 Renderer 原样加载的 `performTodayAction`、`refreshSnapshot`、`renderTodaySourceContext` 实际执行；无关 DOM、认证、偏好持久化与定时提示函数为替身。队列暂停，故问题状态为 queued。当前用户安装包版本、现场具体问题记录与真实 DOM 尚未核验，不能把本证据称为现场端到端验收。

## 可重复运行

从仓库根目录执行：

```sh
node arckit/cases/evidence/CASE-20260911-002/reproduce.mjs
```

脚本产生 `arckit/debug/today-third-column-missing-issues.log`，标记为 `ARC_DEBUG:today-third-column-missing-issues`，并保存相同运行事件与生产文件 SHA-256 到同目录 `trace.json`。本轮已运行并读取 `.log`。临时 Store 使用 `mkdtemp` 创建并在 finally 清理，不读写真实 Desktop 用户数据；测试对象全部为合成数据。首次搭建 fixture 时缺少 `platform.workspace_preferences` 导致初始化失败，补齐后正式复现成功。

| 真实函数执行后 | 磁盘问题数 | Automation task 问题数 | Platform Today 字段 | Today 问题数 | 第三栏 HTML |
| --- | --- | --- | --- | --- | --- |
| 提交前完整刷新 | 0 | 0 | 不存在 | 0 | 空态 |
| Today 提交回调与完整刷新 | 1 | 1 | 不存在 | 0 | 空态 |
| 再次完整刷新 | 1 | 1 | 不存在 | 0 | 空态 |
| 仅向平台任务注入同一问题集合的控制实验 | 未改 | 1 | 存在 | 1 | 原文与 queued 状态 |

前三步中的 Task/project 均为 `t`/`p`，选择保持 `work:t:completed`，源任务保持 completed，平台错误为空，提交错误为空，消息写入一次。控制实验只改变输入，不修改生产代码。

## 因果链

1. Renderer `performTodayAction` 的 `raise_acceptance_issue` 调用 `submitAcceptanceFeedback`，随后调用完整 `refreshSnapshot`。
2. `automation-coordinator.mjs` 的提交函数写入独立的 `automation.acceptance_feedback_items`，保留 source_task_id/source_project_id 与旧完成来源，不把问题写入 Work Task。
3. Automation `enrichTask` 把这些问题附加到 snapshot.tasks，刷新确实取得 1 条问题。
4. `platform-coordinator.mjs` 的 `today_tasks` 从 `localTaskResult(workProjection, projectId)` 派生；普通 Work tasks 同样来自 Work Projection，不携带 Automation 的问题字段。这符合 Work 任务与独立验收问题分别拥有事实的边界。
5. `today-workspace.mjs` 使用 `platform.today_tasks || platform.tasks || automation.tasks || []`。平台数组已存在，故不会采用 Automation enriched task；`workInterventions` 仅展开平台任务，没有按任务身份补入问题集合。
6. `renderTodaySourceContext` 读取 `item.acceptance_feedback_items || []`，因此生成空态。控制实验给同一 item 补入集合后，完全相同的函数生成问题原文与状态，锁定了缺失连接边界。

在本复现范围内排除：提交未成功、未落盘、刷新未执行、仅多刷新一次即可恢复、源任务不再 completed、责任选择丢失、项目/任务身份不同、显示模板没有列表能力。尚不排除真实现场额外存在旧包、刷新并发、项目筛选或 DOM 行为问题；这些不是复现该缺陷的必要条件。

## 旧证据遗漏

`runtime/arcorbit/test/today-workspace.test.mjs` 的 “completed Work responsibility preserves acceptance issue text, status, progress, and selection” 直接把 acceptance_feedback_items 写进 platform.tasks fixture。它证明字段已存在时会被保留，不能证明真实提交路径能把该字段提供给 Today。`desktop-renderer.test.mjs` 的相关检查是源码模式断言，未跨越独立事实源。

本轮确定性检查：

- 上述复现脚本成功，证明缺陷仍存在；不是修复通过测试。
- `node --test runtime/arcorbit/test/today-workspace.test.mjs`：10/10 通过，包括遗漏真实来源连接的旧测试。
- `node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs`：151 项，150 通过、1 失败；重复运行结果相同。失败位于 `desktop-renderer.test.mjs:995`，仍期待 Engineering 旧文案 `ORGANIZATION · DOMAIN PROFILE MANAGEMENT`。当前已有的 Engineering 改动已替换该页面；本诊断没有修改它，不能宣称整个套件通过。

## 必要修复与验收范围（本轮未执行）

在 Today 的展示组合边界把独立问题集合按可靠的 Task/project 身份关联到 Work 责任项；保持 Work 对 Task 状态、内容、责任和 Today 范围的所有权，不把 Automation 整个 Task 覆盖到平台任务，也不新增持久双写。处理 Automation 查看筛选与 Today 跨项目范围可能不同的情况，不能简单依赖一个被过滤的任务数组。

必须用分离的来源数据测试真实提交、刷新与第三栏问题原文/状态/进展；覆盖来源更新、空集合、错配身份、选择连续性、刷新并发，以及项目范围差异；以实际页面验证补齐本轮仅 HTML 生成的边界。既有稳定预期无需改写：`arckit/interaction/today-workspace/interaction.md` 已要求成功后在同一第三栏直接显示列表，`arckit/spec/agentic-software-development/runtime-automation-workspace.md` 已定义独立问题持久化、进展及保持 completed，`arckit/tech/arcorbit/platform-composition-solution.md` 已定义 Work Sync 的 Task 投影所有权。

## 现场保护与日志状态

本轮仅新增诊断脚本、报告和生成的 trace/log；未修改任何生产文件、规范、skill 或 canonical Ledger。工作区已有的 Engineering 与其他未提交改动全部保留。没有在产品代码加入临时日志。独立诊断 harness 中的观察点和脱敏 `.log` 暂留供下一轮修复对照；修复验收时应转换缺陷断言为回归断言，并清理不再需要的临时诊断输出，保留本次 trace 作为证据。using-arckit 要求本轮先提交已确认因果事实，由写回后的 fresh snapshot 重新选择修复 Gap。
