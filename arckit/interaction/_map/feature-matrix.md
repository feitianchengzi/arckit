# Interaction Feature Matrix

| Page | Status | Core task | Projected states |
|---|---|---|---|
| `login/` | ✅ | 启动时恢复 Workshop 会话；未登录时通过不可绕过的验证码门禁建立当前用户项目来源 | 会话恢复、未登录入口、验证码已发送、登录失败 |
| `setup-readiness/` | ✅ | 在 Runtime task 和 Workshop 路由前校验受信资源、区分 managed repair/migration 与内容冲突，并完成受确认的安装、备份恢复或升级 | 正在检查、安装计划、执行中、已准备完成、升级恢复、阻塞恢复 |
| `platform-workspace/` | ✅ | 通过本地 Workset 同时选择并展示多个 Workshop 产品，在同一平台壳中协调团队、完整七状态待办、普通反馈与 ArcOrbit 执行 | 多产品 Today、产品集多选、组织/成员、跨产品 Work、Feedback V1/验收反馈双通道、同步、空集、部分区段失败、Automation/Workbench/Recovery 交接 |
| `automation-workspace/` | ✅ | 登录后分别观察普通待办与验收反馈队列，由统一执行仲裁器串行启动 ready 队首；当前 Case 可在 Runtime 与交互式 Codex CLI 之间显式交接，并保留待办级消息、用量与异常观察 | 已登录账号摘要、会话失效；双队列总览、反馈等待/运行/待人工/阻塞；项目范围切换、自动执行、CLI 接管、人工介入、完成续接、写回失败；领取冲突、启动失败、安全停止、用量诊断 |
| `task-browser/` | ✅ | 浏览七种服务器任务状态，在 completed/accepted 右侧详情查看全部验收问题和进展、提交独立反馈，并执行有权限的人工状态处置 | 待处理列表、待评审确认、进行中任务、完成/验收反馈详情与 Composer、已阻塞恢复、取消确认、当前范围为空、同步或版本冲突 |
