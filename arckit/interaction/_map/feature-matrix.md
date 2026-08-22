# Interaction Feature Matrix

| Page | Status | Core task | Projected states |
|---|---|---|---|
| `login/` | ✅ | 启动时恢复 Workshop 会话；未登录时通过不可绕过的验证码门禁建立当前用户项目来源 | 会话恢复、未登录入口、验证码已发送、登录失败 |
| `setup-readiness/` | ✅ | 先校验全局受信资源，再为明确关联项目区分 managed repair/migration、managed-stale 与内容冲突，并完成项目级安装、用户级迁移、直接可选清理或备份恢复 | 全局检查、项目安装计划、managed-stale 直接清理、执行中、项目已准备、升级迁移、阻塞恢复 |
| `platform-workspace/` | ✅ | 通过三组主导航连接个人协作、产品全生命周期和组织能力，并保留 Workset、Feedback 与 Organization 的真实平台行为 | Personal/Product Lifecycle/Organization 导航、多产品 Today、Workset 多选、组织概览、Feedback 转待办、有限范围与部分失败 |
| `chat-workspace/` | ✅ | 在尚未确定正式形态时与 Agent 自由问答，并在用户确认后预览 Idea 或 Work 转换 | 新对话、产品上下文、问答正文、待确认事实、形态转换预览 |
| `idea-workspace/` | ✅ | 探索和讨论产品创意，比较问题、用户、证据与风险，并在确认后预览正式项目转换 | 探索中、讨论中、已确认、团队观点、开始项目预览 |
| `release-workspace/` | ✅ | 对齐候选版本、发布门禁、跨平台产物与上线健康，不替代人工发版授权 | 准备中、验证与签名、release-intent、上线观察、回退关注 |
| `operations-workspace/` | ✅ | 组织对外市场动作、渠道内容和效果信号，并把发现回流到产品生命周期 | 待发布、进行中、已复盘、示意信号、Idea/Work/Feedback 回流 |
| `engineering-profile/` | ✅ | 选择、编辑、比较和应用由 State Model、Capability Mapping 与 Lifecycle Mapping 组成的 Domain Profile | Profile Library、草稿编辑、跨行业比较、兼容性检查、Apply 确认、稳定 Loop Kernel |
| `product-feedback-center/` | ✅ | 在 ArcOrbit 内向固定 Project 107 提交反馈、查看当前账户反馈并感知未读变化 | 未读角标、SDK 加载、提交反馈、我的反馈、需要登录、SDK 失败恢复 |
| `automation-workspace/` | ✅ | 登录后通过持久事件和 REST 确认实时同步项目任务，分别观察普通待办与验收问题队列，由统一执行仲裁器串行启动 ready 队首；人工 Gate 在重连和对账中保持等待 | 实时/补取/降级/游标过期、双队列总览、问题等待/运行/待人工/阻塞、项目范围切换、自动执行、CLI 接管、人工介入、完成续接、写回失败、领取冲突与用量诊断 |
| `task-browser/` | ✅ | 在 Work 内创建和编辑产品限定待办，并以七状态列表和同屏右侧 Inspector 浏览任务；成员、父待办和标签随产品联动，优先级使用语义档位，标签支持选择和生命周期管理 | 创建/编辑 Sheet、产品成员/父待办/标签联动、语义优先级、标签创建编辑删除、待处理列表与 Inspector、待评审确认、运行/验收、阻塞恢复、取消确认、空态与冲突 |
