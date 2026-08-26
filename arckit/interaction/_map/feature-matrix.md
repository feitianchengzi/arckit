# Interaction Feature Matrix

| Page | Status | Core task | Projected states |
|---|---|---|---|
| `login/` | ✅ | 启动时恢复 Workshop 会话；未登录时通过不可绕过的验证码门禁建立当前用户项目来源 | 会话恢复、未登录入口、验证码已发送、登录失败 |
| `setup-readiness/` | ✅ | 先校验全局受信资源，在无默认选择和无凭证管理的边界内恢复 Codex standalone 安装/更新与官方认证，再以可见项目写入摘要引导 skills 安装 | 全局检查、Codex 缺失/安装/更新、两级认证选择、官方登录与 status 复核、外部安装/活动任务阻断、项目安装计划、managed-stale 清理、执行中、项目已准备、升级迁移、阻塞恢复 |
| `platform-workspace/` | ✅ | 通过三组主导航连接个人协作、产品全生命周期和组织能力，并让 Organization Project Detail 与 Feedback 承载各自真实处理行为 | Personal/Product Lifecycle/Organization 导航、Workset 多选、组织概览、项目连接缺口、Feedback 主工作台与窄窗口收敛、转待办与仅重试关联、有限范围与部分失败 |
| `today-workspace/` | ✅ | 从现有跨模块事实派生唯一下一步，在日常状态下汇总活动执行、人工事项和多产品连接/工作全貌 | 首次准备唯一动作、六项准备关系、无项目分流、创建并委托、全局总闸、多产品健康执行、人工事项、完成审查、部分未知、无权限交接 |
| `chat-workspace/` | ✅ | 按 Product Workspace 分组浏览最近与历史会话，并在首条消息前显式确认、切换或原位绑定新会话项目归属 | 项目分组、每组最近 10 条、历史展开/收起、新对话项目切换、流式消息、工具/权限、停止、中断/失败恢复、删除确认、工作区阻塞与绑定 Sheet |
| `idea-workspace/` | ✅ | 探索和讨论产品创意，比较问题、用户、证据与风险，并在确认后预览正式项目转换 | 探索中、讨论中、已确认、团队观点、开始项目预览 |
| `release-workspace/` | ✅ | 对齐候选版本、发布门禁、跨平台产物与上线健康，不替代人工发版授权 | 准备中、验证与签名、release-intent、上线观察、回退关注 |
| `operations-workspace/` | ✅ | 组织对外市场动作、渠道内容和效果信号，并把发现回流到产品生命周期 | 待发布、进行中、已复盘、示意信号、Idea/Work/Feedback 回流 |
| `engineering-profile/` | ✅ | 选择、编辑、比较和应用由 State Model、Capability Mapping 与 Lifecycle Mapping 组成的 Domain Profile | Profile Library、草稿编辑、跨行业比较、兼容性检查、Apply 确认、稳定 Loop Kernel |
| `product-feedback-center/` | ✅ | 在 ArcOrbit 内向固定 Project 107 提交反馈、查看当前账户反馈并感知未读变化 | 未读角标、SDK 加载、提交反馈、我的反馈、需要登录、SDK 失败恢复 |
| `automation-workspace/` | ✅ | 登录后只消费 Work 发布的本地待办状态，以本地 workspace lane 串行仲裁普通待办与验收问题，并在最多 3 条独立 lane 间并行；候选不可领取时解释首要原因并原位修复 | Work 同步健康摘要、资格原因引导、双队列总览、活动执行选择、槽位容量、lane 串行、跨 workspace 并行、问题等待/运行/待人工/阻塞、项目范围切换、CLI 接管、人工介入、完成续接、Work 动作失败、领取冲突与用量诊断 |
| `task-browser/` | ✅ | 在 Work 的单行控制轨中组合本地查询，并用 Work-owned 同步和任务树/Inspector 完成详情、评论附件、产品限定维护、编辑七状态兜底及引导式状态动作；Automation 只消费确认结果 | 本地查询、Work Sync、单行控制轨与窄窗口收敛、多维筛选、任务树、完整详情、评论附件、新建/编辑七状态 Picker、Inspector 下一步动作、待评审/执行人/项目连接引导、标签生命周期、运行/验收查看、外部状态恢复、空态与冲突 |
