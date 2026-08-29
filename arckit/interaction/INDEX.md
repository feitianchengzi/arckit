# 交互设计索引

## 使用说明
- ✅ 已完成 | 🟡 设计中 | ⚪ 待设计 | 🔴 已废弃
- 📐 线框图 | 📋 交互文档

## 交互设计地图

<!-- 直接写文件名/目录名（不用链接语法），每级一句总结，行数如 (285行)；依赖关系在 _map/RELATIONS.md -->

- CONVENTIONS.md 跨页面体验契约：单一应用标题栏、macOS 原生 traffic lights、Windows/Linux 应用控件、可读字号、状态反馈、键盘焦点和对比度。✅ (81行)

- login/ 登录页面：七天滚动会话恢复、临时错误保活与不可绕过的 Workshop 验证码登录门禁。✅
  - default.html 登录线框：会话恢复、未登录入口、验证码已发送和登录失败。✅ (65行)
  - interaction.md 登录交互：七天会话续期、启动路由、验证码反馈与失败恢复。✅ (134行)
- setup-readiness/ 环境准备页面：冷启动与新关联检查、无副作用项目查看、Codex standalone 安装/更新、无默认值显式认证、项目写入确认、用户级迁移、同名 skill 选择与备份覆盖、事务 apply 与阻塞恢复。✅
  - default.html 环境准备线框：检查触发边界、Codex 缺失/安装/认证选择/登录复核、可见项目写入摘要、managed-stale 清理、执行、完成、升级迁移和失败恢复。✅ (177行)
  - interaction.md 环境准备交互：冷启动/新关联/主动重试、纯查看不检查、Codex 安装状态、两级无默认认证、用户级 managed 迁移、备份恢复与异常恢复。✅ (241行)
- platform-workspace/ 多产品平台应用壳：以三组主导航连接个人协作、产品全生命周期和组织能力，并保留真实 Workset、会话新鲜度与同记录恢复的主工作台式 Feedback 和 Organization 行为。✅
  - default.html 平台应用壳线框：三组导航、全局产品范围、Feedback 单行控制轨、会话未读与刷新、窄窗口收敛、剩余高度双栏、已忽略恢复和转待办恢复状态。✅ (177行)
  - collaboration-views.html 治理线框：组织概览矩阵、成员已有关系、项目邀请与项目连接缺口就地修复。✅ (13行)
  - states.html 平台状态线框：Workset 多选、普通成员有限范围、邀请码加入和部分失败。✅ (6行)
  - interaction.md 平台交互：三组导航、产品范围/治理解耦、组织项目连接引导与 Feedback 单行控制轨、会话自动/手动刷新、已读边界、剩余高度双栏、同记录恢复、共享图片查看和流转。✅ (168行)
- today-workspace/ Today 个人推进首页：从现有事实选择唯一下一步，并在日常状态下汇总跨产品执行、人工事项与连接/工作全貌。✅
  - default.html Today 主线框：首次准备唯一动作、总闸启动、健康多产品执行、人工事项、完成审查和部分未知。✅ (127行)
  - readiness-details.html 准备关系子视图：六项完整关系、无项目分流、多产品连接/工作摘要、创建并交给 ArcOrbit 与无权限交接。✅ (72行)
  - interaction.md Today 交互：动作优先级、事实派生、准备关系、多产品表达、创建委托、恢复与跨页面就地引导。✅ (212行)
- chat-workspace/ Chat 页面：按项目分组浏览最近与历史会话，以 session 独立阅读位置进行本地 Codex 对话。✅
  - default.html Chat 线框：项目分组、每组最近 10 条与历史入口、新对话项目切换、生成/停止、权限、失败恢复和工作区阻塞直达动作。✅ (55行)
  - workspace-setup.html 工作区绑定子视图：从 Chat 原位选择项目、目录并检查 Setup Readiness，同时保留草稿。✅ (12行)
  - interaction.md Chat 交互：项目分组排序、历史展开、新会话归属、session 独立滚动、Composer、恢复和 Automation 隔离。✅ (122行)
- idea-workspace/ Idea 页面：创意探索、团队讨论、证据与风险比较，以及确认后的正式项目转换预览。✅
  - default.html Idea 线框：创意漏斗、详情、团队观点与开始项目动作。✅ (14行)
  - interaction.md Idea 交互：探索/讨论/确认状态、团队观点和项目转换边界。✅ (35行)
- release-workspace/ Release 页面：版本候选、发布门禁、跨平台产物和上线健康监控计划。✅
  - default.html Release 线框：release train、验证与签名门禁、产物和上线观察。✅ (13行)
  - interaction.md Release 交互：发版准备、人工授权、线上监控和未接入边界。✅ (34行)
- operations-workspace/ Operations 页面：外部市场动作、渠道内容、负责人、时间窗口和效果信号回流。✅
  - default.html Operations 线框：运营动作、受众与渠道、内容主题和示意效果信号。✅ (14行)
  - interaction.md Operations 交互：待发布/进行中/已复盘状态、回流关系和外部平台边界。✅ (34行)
- engineering-profile/ Engineering 页面：选择、编辑、比较和应用由 State、领域能力及生命周期解释组成的 Domain Profile。✅
  - default.html Engineering 线框：Profile Library、State/Capabilities 编辑、跨行业比较与 Apply 确认。✅ (29行)
  - interaction.md Engineering 交互：Profile 草稿管理、变更预览、稳定 Loop Kernel 与无真实写入边界。✅ (42行)
- product-feedback-center/ ArcOrbit 产品反馈中心：在受限 SDK 窗口内提交产品反馈、查看我的反馈并从未配置或加载失败中恢复。✅
  - default.html 产品反馈中心线框：SDK 加载、可用内容、账户/配置恢复和 SDK 失败恢复。✅ (54行)
  - interaction.md 产品反馈中心交互：单一入口、同窗模式切换、草稿保持、Project 107、未读角标和脱敏恢复。✅ (88行)
- automation-workspace/ 自动化指挥中心：以统一 Project Catalog 保持跨页面项目可见性并在覆盖安装后自动重建派生状态，同时消费 Work 本地待办状态，以 workspace lane 管理双队列串行、跨项目并行、Case 绑定恢复、统一人工介入与 Runtime/CLI 接力。✅
  - default.html 指挥中心线框：顶部产品范围、覆盖安装自动重建、项目同步降级、Work 同步健康摘要、双队列、活动执行选择、并发容量、人工介入原因、Runtime/CLI 接管与恢复。✅ (346行)
  - authentication.html 账号设置线框：已登录摘要、七天无活动失效恢复与退出。✅ (51行)
  - intervention-workbench.html 介入工作台线框：单行有界待办标题、Chat 共享消息面、固定三栏与 Composer、完整时间及逐 Gap 执行全貌。✅ (99行)
  - runtime-recovery.html 恢复中心线框：领取冲突、启动失败、Case 绑定待确认、用户说明续跑、安全停止、lane 局部外部变化与 Work Sync 异常。✅ (152行)
  - eligibility-guidance.html 资格引导子视图：本地目录、待评审、全局总闸和无权限责任的原位解释与直接动作。✅ (39行)
  - interaction.md 自动化指挥中心交互：统一 Project Catalog、覆盖安装自愈、逐项目 Task Readiness、Work 本地状态消费、资格原因与 Case 绑定就地恢复、external handoff 人工介入投影、统一待办标题、双队列、workspace lane 串行与跨项目并行。✅ (438行)
- task-browser/ Work 同屏任务浏览：以本地 Task Projection、单行控制轨和剩余高度列表/可持久调宽 Inspector 创建、分区检查、协作、验收并同步待办。✅
  - default.html Work 任务浏览线框：顶部产品范围、Inspector 引导动作、编辑兜底提示、Automation 消费、运行/验收、恢复与冲突。✅ (218行)
  - daily-work.html Work 日常管理子视图：本地状态/搜索/筛选控制轨、窄窗口收敛、可调宽分区 Inspector 与图片浏览。✅ (96行)
  - task-form.html 待办表单子视图：创建/编辑产品切换、执行人 Automation 资格提示、跨产品复制确认、目标字段联动和分步失败恢复。✅ (45行)
  - readiness-guidance.html 执行资格子视图：待评审确认、执行人不匹配、项目连接缺口和无权限责任交接。✅ (39行)
  - interaction.md 任务浏览交互：本地七状态计数、Work-owned 同步、新建执行人 Automation 提示、编辑七状态兜底、Inspector 引导动作、持久宽度、紧凑分区、跨产品受控替换与图片浏览。✅ (305行)
