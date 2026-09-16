# 实施与验收矩阵

基线：用户最终确认原型 project-workbench-v2 与 2026-09-16 实施要求。以下“实现核对”表示逐项检查生产代码与契约；“自动验证”另外给出可复现测试。GUI 使用生产 Renderer 与隔离 IPC 数据，未执行真实远端写入或计费 Agent 调用。

| ID | 预期 | 实现/验证证据 | 状态 |
|---|---|---|---|
| NAV-01 | 默认新事情台 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-02 | 全部事情与需要关注 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-03 | 真实项目范围 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-04 | 全部旧页面二级菜单 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-05 | 旧页面业务隔离 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-06 | 回新页面恢复状态 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-07 | 登录与Setup门禁 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| NAV-08 | 账号与产品反馈可达 | shell：index.html / renderer.js；surface.show、project；桌面门禁保持原调用 | 实现核对 + Electron 入口验证 |
| LIST-01 | 两行紧凑顶部 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-02 | 44px单行与完整标题 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-03 | 状态搜索组合 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-04 | 执行人与优先级筛选 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-05 | 底部固定唯一创建 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-06 | 空结果清除筛选 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-07 | 父子事情定位 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| LIST-08 | 刷新不抢选择 | surface.render、select、project；model.visibleTasks；project-workbench.css | 实现核对 + 模型测试 / Electron |
| DETAIL-01 | 紧凑标题与有限动作 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-02 | 属性面板及编辑 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-03 | Markdown正文与派生标题 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-04 | 四个稳定类别 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-05 | 当前工作与来源 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-06 | 实际进展与剩余问题 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-07 | 可变计划按需展开 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-08 | 安排待生效/暂停保持 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| DETAIL-09 | 完成标准共用 | surface.renderDetail、overview、properties；coordinator 的 plan/criteria/report 命令 | 实现核对 + 场景版本测试 / Electron |
| CONTEXT-01 | 添加文本链接附件 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-02 | 资料预览与移除 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-03 | 上下文引用及读取边界 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-04 | 新增编辑采纳约定 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-05 | 留言与Agent消息分离 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-06 | 留言交给Agent先入草稿 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| CONTEXT-07 | 消息保存约定及来源定位 | surface.context / material.preview；共享 attachment 服务与 scene.context / agreements | 实现核对 + 资料作用域测试 |
| RESULT-01 | 阶段成果可见 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| RESULT-02 | 成果打开与版本来源 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| RESULT-03 | 验证证据与声明区分 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| RESULT-04 | 验收检查及变更失效 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| RESULT-05 | 独立验收问题及修复 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| RESULT-06 | 已验收只读 | surface.results；coordinator acceptance / asset.preview；真实 run.activity / feedback store | 实现核对 + 目标失效与文件范围测试 |
| CHAT-01 | 默认隐藏中央弹层 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-02 | 背景inert且右列表可用 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-03 | 关闭恢复标签页滚动焦点 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-04 | 首条创建self待评审 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-05 | 发送重试不重复事情 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-06 | 同事情Chat至Auto绑定 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-07 | 运行消息追加与生效 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-08 | 暂停讨论显式继续 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-09 | 逐事情草稿持久化 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-10 | 流式消息与工具结果 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-11 | 真实权限决定 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-12 | Model Level配置 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| CHAT-13 | 语音未实现禁用 | surface 消息弹层与逐事情草稿；task Chat coordinator / steering / persistent thread binding | 实现核对 + Chat/串行会话测试 / Electron |
| RUNTIME-01 | 全项目此设备状态概览 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-02 | 待处理优先及空闲设置 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-03 | 点选跨项目清除筛选定位 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-04 | 关闭外部点击Esc | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-05 | 直接Auto资格与排队 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-06 | 暂停停止恢复 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-07 | 外部等待与决定 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| RUNTIME-08 | 同thread串行执行仲裁 | runtimeGroups；显式 requested_tasks；原 Automation 停止/恢复/外部等待；task-turn-lock | 实现核对 + Automation 回归 / Electron |
| ACTIVITY-01 | 真实事件时间和操作者 | surface.activity；scene-store 时间/actor/request_id/message_id；真实 Run 历史 | 实现核对 + 场景事件测试 |
| ACTIVITY-02 | 分类筛选 | surface.activity；scene-store 时间/actor/request_id/message_id；真实 Run 历史 | 实现核对 + 场景事件测试 |
| ACTIVITY-03 | 关联消息定位 | surface.activity；scene-store 时间/actor/request_id/message_id；真实 Run 历史 | 实现核对 + 场景事件测试 |
| ACTIVITY-04 | 旧历史不伪造 | surface.activity；scene-store 时间/actor/request_id/message_id；真实 Run 历史 | 实现核对 + 场景事件测试 |
| RECOVERY-01 | 网络权限冲突保留输入 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-02 | 初始加载错误与重试 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-03 | 重启会话和运行恢复 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-04 | 输入法和快捷发送 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-05 | 消息与详情独立阅读位置 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-06 | 760抽屉及底部创建 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-07 | 390无溢出 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| RECOVERY-08 | 后台刷新不抢焦点 | surface.refresh / selectionEpoch / showDialog / persist；原 Chat/Auto 恢复；响应式 CSS | 实现核对 + 恢复回归 / Electron |
| AGENT-01 | 共享业务能力目录 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-02 | UI与Agent共用权限命令 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-03 | 结构化工作判断与场景 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-04 | 工具结果及事件关联 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-05 | 资料授权范围与版本 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-06 | 权威事实分域 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |
| AGENT-07 | 不导入原型假数据 | workbench protocol/coordinator/software-capabilities/agent-bridge；原服务命令与 Run Manager 接入 | 实现核对 + 工具桥及能力适配测试 |

## 证据索引与解释

- 生产入口：`runtime/arcorbit/desktop/renderer/project-workbench-surface.mjs`、`project-workbench-model.mjs`、`project-workbench.css`。
- 协调与能力：`runtime/arcorbit/src/workbench/`；共用服务扩展见技术方案。
- 自动验证：`runtime/arcorbit/test/project-workbench.test.mjs`、`automation-coordinator.test.mjs`、`chat-coordinator.test.mjs`、`desktop-renderer.test.mjs`。
- GUI：`runtime/arcorbit/test/fixtures/project-workbench-electron.mjs`；本目录 `electron-verification.json` 和三张验收截图。
- 汇总与边界：[verification.md](verification.md)。
- DETAIL-08 / CHAT-07 的“生效”只声称消息已送达、安排可读取或已被工具读取；不把 Runtime 的投递成功显示成 Agent 已执行完修改。
- CONTEXT-03：本机上下文选择是引用授权。附件进入上下文不等于模型已经读取实际文件。
- RESULT-03：Agent 报告、用户整理消息、实际文件 SHA-256 和运行/Git 回执保持不同来源。
- RESULT-06：已验收事情的业务编辑/发送按钮及主进程命令受只读限制；仍可阅读消息与文件。
- AGENT-01：注册现有 Platform/Release/Product/Engineering/Feedback 能力，复用原服务；任务正文改用核心事情命令，任务删除/跨项目替换仍走旧页面，避免运行中的事情身份失效。此轮没有把这些身份迁移操作暴露为 Agent 任意调用。
