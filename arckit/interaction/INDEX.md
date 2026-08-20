# 交互设计索引

## 使用说明
- ✅ 已完成 | 🟡 设计中 | ⚪ 待设计 | 🔴 已废弃
- 📐 线框图 | 📋 交互文档

## 交互设计地图

<!-- 直接写文件名/目录名（不用链接语法），每级一句总结，行数如 (285行)；依赖关系在 _map/RELATIONS.md -->

- login/ 登录页面：七天滚动会话恢复、临时错误保活与不可绕过的 Workshop 验证码登录门禁。✅
  - default.html 登录线框：会话恢复、未登录入口、验证码已发送和登录失败。✅ (65行)
  - interaction.md 登录交互：七天会话续期、启动路由、验证码反馈与失败恢复。✅ (134行)
- setup-readiness/ 环境准备页面：独立 ArcOrbit 状态检查、skills 安装计划、typed 升级恢复、事务 apply 与阻塞恢复。✅
  - default.html 环境准备线框：检查、计划、执行、完成、typed 升级恢复和失败恢复。✅ (91行)
  - interaction.md 环境准备交互：启动门禁、typed drift 分类、备份恢复、bundle 重装兜底与异常恢复。✅ (154行)
- platform-workspace/ 多产品平台工作区：以三组主导航连接个人协作、产品全生命周期和组织能力，并保留真实 Workset、Feedback 与 Organization 行为。✅
  - default.html 平台首页线框：Personal/Product Lifecycle/Organization 分组、全局产品范围、Feedback 双栏详情与转待办恢复状态。✅ (109行)
  - collaboration-views.html 治理线框：组织概览矩阵、成员已有关系和项目上下文通用邀请。✅ (7行)
  - states.html 平台状态线框：Workset 多选、普通成员有限范围、邀请码加入和部分失败。✅ (6行)
  - interaction.md 平台交互：三组导航、计划展示边界、全局产品范围/治理解耦、组织三级管理与 Feedback 开发者工作台。✅ (146行)
- chat-workspace/ Chat 页面：自由 Agent 问答、可选产品上下文和确认后的 Idea/Work 形态预览。✅
  - default.html Chat 线框：最近对话、Agent 正文、待确认事实与目标形态动作。✅ (13行)
  - interaction.md Chat 交互：自由讨论、显式确认、形态转换预览与 Automation thread 边界。✅ (36行)
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
- automation-workspace/ 自动化指挥中心：全局产品范围、普通待办与验收问题双队列、验收问题筛选、Runtime/CLI 接力与恢复。✅
  - default.html 指挥中心线框：顶部产品范围、仅看验收问题、项目绑定、双队列、Runtime/CLI 接管与恢复。✅ (299行)
  - authentication.html 账号设置线框：已登录摘要、七天无活动失效恢复与退出。✅ (51行)
  - intervention-workbench.html 介入工作台线框：固定三栏与 Composer、可折叠思考、结构化结果、Agent 正式消息及单行工具活动。✅ (99行)
  - runtime-recovery.html 恢复中心线框：领取冲突、启动失败、用户说明续跑、安全停止、外部状态变化与任务源异常。✅ (137行)
  - interaction.md 自动化指挥中心交互：全局产品范围、仅看验收问题、账户头像、双队列与 Runtime/CLI 接力。✅ (383行)
- task-browser/ Work 同屏任务浏览：在 Work 面板以七状态列表和右侧 Inspector 执行任务检查、验收与受控人工处置。✅
  - default.html Work 任务浏览线框：顶部产品范围、面板内七状态、同屏 Inspector、待评审确认、运行/验收、恢复与冲突。✅ (217行)
  - interaction.md 任务浏览交互：项目与状态筛选、列表选择、面板内独立滚动、右侧 Inspector、验收问题 Composer、受控状态操作和并发冲突处理。✅ (189行)
