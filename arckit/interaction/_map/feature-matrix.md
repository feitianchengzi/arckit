# Interaction Feature Matrix

| Page | Status | Core task | Projected states |
|---|---|---|---|
| `login/` | ✅ | 启动时恢复 Workshop 会话；未登录时通过不可绕过的验证码门禁建立当前用户项目来源 | 会话恢复、未登录入口、验证码已发送、登录失败 |
| `setup-readiness/` | ✅ | 在 Runtime task 和 Workshop 路由前校验受信资源、区分 managed repair/migration 与内容冲突，并完成受确认的安装、备份恢复或升级 | 正在检查、安装计划、执行中、已准备完成、升级恢复、阻塞恢复 |
| `platform-workspace/` | ✅ | 通过本地 Workset 同时推进多个产品，并在不受 Workset 裁剪的 Organization Center 中逐层管理组织、成员和项目 | 多产品 Today、Workset 多选、组织概览、成员已有关系、项目详情与通用邀请、Feedback 完整正文转待办与项目成员选择、邀请码加入、有限可见范围、部分失败、Automation/Workbench/Recovery 交接 |
| `product-feedback-center/` | ✅ | 在 ArcOrbit 内向固定 Project 107 提交反馈、查看当前账户反馈并感知未读变化 | 未读角标、SDK 加载、提交反馈、我的反馈、需要登录、SDK 失败恢复 |
| `automation-workspace/` | ✅ | 登录后分别观察普通待办与验收问题队列，由统一执行仲裁器串行启动 ready 队首；当前 Case 可在 Runtime 与交互式 Codex CLI 之间显式交接，并保留待办级消息、用量与异常观察 | 已登录账号摘要、会话失效；双队列总览、问题等待/运行/待人工/阻塞；项目范围切换、自动执行、CLI 接管、人工介入、完成续接、写回失败；领取冲突、启动失败、安全停止、用量诊断 |
| `task-browser/` | ✅ | 在 Work 内以七状态列表和同屏右侧 Inspector 浏览任务；列表与 Inspector 在固定页面框架内独立纵向滚动；completed 可提出验收问题，accepted 只显示验收通过，并执行有权限的人工状态处置 | 待处理列表与 Inspector、待评审确认、进行中任务、已完成问题详情与 Composer、已验收只读结果、已阻塞恢复、取消确认、当前范围为空、同步或版本冲突 |
