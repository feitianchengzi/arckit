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
- platform-workspace/ 多产品平台工作区：以本地 Workset 同时组织 Workshop 产品、团队、完整待办与普通反馈，并保留 ArcOrbit Automation 执行核心。✅
  - default.html 平台首页线框：六入口平台壳、Today 多产品态势与 Products 多选产品集。✅ (9行)
  - collaboration-views.html 协作线框：真实 Organization/Project Member、完整七状态团队待办和反馈双通道。✅ (7行)
  - states.html 平台状态线框：同步、空产品集、部分区段失败与既有人工介入/恢复入口。✅ (7行)
  - interaction.md 平台交互：Workset 展示边界、团队/工作/反馈事实源、Automation 隔离和未成立能力记录。✅ (89行)
- automation-workspace/ 自动化指挥中心：项目来源、普通待办与验收反馈双队列、统一执行仲裁、Runtime/交互式 CLI 接力、人工关注与安全恢复。✅
  - default.html 指挥中心线框：项目列表与范围、待办/反馈独立指标与队列、自动领取、Runtime/CLI 接管、空态与恢复。✅ (291行)
  - authentication.html 账号设置线框：已登录摘要、七天无活动失效恢复与退出。✅ (51行)
  - intervention-workbench.html 介入工作台线框：固定三栏与 Composer、可折叠思考、结构化结果、Agent 正式消息及单行工具活动。✅ (99行)
  - runtime-recovery.html 恢复中心线框：领取冲突、启动失败、用户反馈续跑、安全停止、外部状态变化与任务源异常。✅ (137行)
  - interaction.md 自动化指挥中心交互：双队列总览、执行仲裁、同待办验收反馈续跑，以及 Runtime/CLI/反馈接力和消息层级。✅ (367行)
- task-browser/ 任务浏览页面：浏览七种服务器状态，在 completed/accepted 详情追踪全部验收问题，并执行受控人工处置。✅
  - default.html 任务浏览线框：待处理、待评审确认、进行中、完成/验收反馈详情、阻塞恢复、取消、空态与版本冲突。✅ (230行)
  - interaction.md 任务浏览交互：项目与状态筛选、反馈列表与 Composer、Inspector、受控状态操作和并发冲突处理。✅ (183行)
