# Today 第三栏修复验证

日期：2026-09-11。验证对象：当前工作区源码、Electron 31.7.7；未打包、未替换 `/Applications/arcorbit.app`，未连接真实账号或启动真实 Agent。

## 实现

- Platform Coordinator 组装 `today_tasks` 时，从同一次读取的 Desktop Store 独立验收问题集合按 `(source_project_id, source_task_id)` 关联。只附加 feedback_id、original_feedback、status、progress、created_at、updated_at 展示字段，并按创建时间倒序排列。
- 只给可访问 Catalog 项目的真实 Work Task 附加数据，不扩张 Today 责任范围；不依赖 Automation 当前项目/任务筛选，不覆盖 Work 正文、状态或责任，不向 Work Task 持久写入问题，也不添加磁盘读取。
- Today 成功提交问题后要求 `afterMutation` 刷新。若已有旧快照请求进行中，先等待其结束，再读提交后的新快照；普通刷新仍保持既有去重行为。已有较新用户选择不被提交回调覆盖。

## 证据与命令

仓库根目录：

```sh
node --test runtime/arcorbit/test/today-acceptance-flow.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs
```

结果：154 项通过，0 失败，0 跳过。最后一次 helper 串行化调整后，新增 flow 测试再次 3/3 通过。原诊断入口 `node arckit/cases/evidence/CASE-20260911-002/reproduce.mjs` 现在运行这组修复回归，不再断言缺陷存在。

新增 flow 测试实际执行生产提交、Platform/Automation Coordinator、刷新及 Today 渲染函数，覆盖：

- 空问题集合 → 提交落盘 → 第三栏显示转义后的问题原文与 queued 状态。
- Today 项目不在 Workset 内，Automation 任务列表只看其他项目，问题仍正确显示。
- 同 Task ID 不同项目不串入问题；Work 源投影没有问题字段，状态和正文保持不变。
- 问题变为 resolved、进展更新和集合清空后使用新事实渲染。
- 确认提交完成时已有旧快照仍被 barrier 挂起；提交保持等待，释放旧快照后再读取新快照，保留提交期间的新选择。
- 提交失败保留草稿和选择，不发布虚假问题。

在 `runtime/arcorbit` 目录执行：

```sh
ARCORBIT_ELECTRON_TODAY_ACCEPTANCE_TEST=1 ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test test/today-acceptance-electron.test.mjs test/today-task-edit-electron.test.mjs
```

结果：2 项通过，0 失败，0 跳过。新 Electron 用例加载真实 index.html/renderer，点击 Today → 需要你处理 → 已完成责任项，在第三栏输入并点击“提出验收问题”，通过测试 IPC 调用生产 Coordinator 并写入隔离磁盘 Store。DOM 断言确认当前责任保持选中、列表直接存在、原文与 queued 可见；模拟独立问题进展事件后，同一条目显示 running 和“正在验证第三栏”。既有 Today 内容编辑成功/失败回归仍通过。

- `today-electron.json`：实际 DOM 结果、Electron 版本及警告。
- `today-third-column.png`：已读取核对的第三栏截图，问题原文、running 状态和进展均在现有内部滚动区可见。
- `git diff --check`、两个生产修改文件的 `node --check`：通过。

## 限制、警告与现场保护

这是开发态真实 Renderer/DOM + 生产 Coordinator 验证；Work 数据、账号与执行来源为合成 fixture，队列暂停，不证明用户已安装版本被更新。没有实施安装包、发布或既有 Release 授权事项。

Electron 的既有开发态 CSP 安全警告单独保存在 JSON warnings，业务 errors 为空；本轮不扩张至 CSP 策略修改。GUI harness 初期经历了主模块启动等待、过早点击静态按钮、未发进展通知和缺少偏好接口等测试设置问题；最终用例已分别修正，最终结果来自重新运行，未把失败运行当成验收通过。

工作区同时存在 Engineering 等其他改动。本轮仅修改 Today 数据组装、提交刷新和相关测试；未回滚它们。上一轮 Engineering 旧文案断言失败已随并行工作消失，不属于本次 Today 修复功劳；本轮在 desktop-renderer.test 中仅加强了 Today 提交后刷新断言。

## 诊断清理

原临时 `.log` 已删除，其完整合成事件仍可从历史 `trace.json` 恢复；旧 harness 已转换为正式回归入口。生产代码与可执行测试中搜索 `ARC_DEBUG:today-third-column-missing-issues` 无结果；历史诊断文档/trace 保留该标记作为证据。临时 Store 与 Electron userData 在 finally 清理。没有新增产品日志或 debug flag。

本轮仅提交普通修复 Gap 的实现验收，不包含 Completion Review；后者须由下一次可信快照派生并重新选择。
