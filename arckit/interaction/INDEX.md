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
- platform-workspace/ 多产品平台工作区：以全局顶部产品集范围推进多个产品，并用 Feedback 开发者工作台和独立 Organization Center 完成研发协作。✅
  - default.html 平台首页线框：Advance/Platform 分组、全局产品范围、Feedback 双栏详情与转待办恢复状态。✅ (103行)
  - collaboration-views.html 治理线框：组织概览矩阵、成员已有关系和项目上下文通用邀请。✅ (7行)
  - states.html 平台状态线框：Workset 多选、普通成员有限范围、邀请码加入和部分失败。✅ (6行)
  - interaction.md 平台交互：全局产品范围/治理解耦、组织三级管理、Feedback 开发者处理工作台与推进页面边界。✅ (135行)
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
  - interaction.md 任务浏览交互：项目与状态筛选、列表选择、右侧 Inspector、验收问题 Composer、受控状态操作和并发冲突处理。✅ (188行)
