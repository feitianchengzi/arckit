# 交互设计索引

## 使用说明
- ✅ 已完成 | 🟡 设计中 | ⚪ 待设计 | 🔴 已废弃
- 📐 线框图 | 📋 交互文档

## 交互设计地图

<!-- 直接写文件名/目录名（不用链接语法），每级一句总结，行数如 (285行)；依赖关系在 _map/RELATIONS.md -->

- login/ 登录页面：七天滚动会话恢复、临时错误保活与不可绕过的 Workshop 验证码登录门禁。✅
  - default.html 登录线框：会话恢复、未登录入口、验证码已发送和登录失败。✅ (65行)
  - interaction.md 登录交互：七天会话续期、启动路由、验证码反馈与失败恢复。✅ (134行)
- setup-readiness/ 环境准备页面：全局资源检查、关联项目 skills 计划、用户级迁移、managed-stale 直接清理、事务 apply 与阻塞恢复。✅
  - default.html 环境准备线框：全局检查、项目计划、managed-stale 首屏选择与确认、执行、完成、typed 升级迁移和失败恢复。✅ (115行)
  - interaction.md 环境准备交互：项目绑定门禁、项目 target、用户级 managed 迁移、直接可选清理、备份恢复与异常恢复。✅ (176行)
- platform-workspace/ 多产品平台工作区：以三组主导航连接个人协作、产品全生命周期和组织能力，并保留真实 Workset、Feedback 与 Organization 行为。✅
  - default.html 平台首页线框：三组导航、全局产品范围、Feedback 双栏、开发者消息/附件/未读和转待办恢复状态。✅ (142行)
  - collaboration-views.html 治理线框：组织概览矩阵、成员已有关系和项目上下文通用邀请。✅ (7行)
  - states.html 平台状态线框：Workset 多选、普通成员有限范围、邀请码加入和部分失败。✅ (6行)
  - interaction.md 平台交互：三组导航、产品范围/治理解耦、组织三级管理与 Feedback 单行列表、内部滚动、共享图片查看和流转。✅ (157行)
- chat-workspace/ Chat 页面：按项目分组浏览最近与历史会话，并在显式项目归属下进行本地 Codex 对话。✅
  - default.html Chat 线框：项目分组、每组最近 10 条与历史入口、新对话项目切换、生成/停止、权限和失败恢复。✅ (55行)
  - interaction.md Chat 交互：项目分组排序、历史展开、新会话归属、session/thread 生命周期、Composer、恢复和 Automation 隔离。✅ (120行)
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
- automation-workspace/ 自动化指挥中心：可靠实时同步、普通待办与验收问题双队列、人工 Gate、Runtime/CLI 接力与恢复。✅
  - default.html 指挥中心线框：顶部产品范围、现代补取、旧服务兼容、立即同步、双队列、人工等待、Runtime/CLI 接管与恢复。✅ (313行)
  - authentication.html 账号设置线框：已登录摘要、七天无活动失效恢复与退出。✅ (51行)
  - intervention-workbench.html 介入工作台线框：Chat 共享消息面、固定三栏与 Composer、完整时间及逐 Gap 执行全貌。✅ (98行)
  - runtime-recovery.html 恢复中心线框：领取冲突、启动失败、用户说明续跑、安全停止、外部状态变化与任务源异常。✅ (137行)
  - interaction.md 自动化指挥中心交互：现代游标恢复、旧服务无 ID 通知、立即同步、全局产品范围、双队列、人工 Gate 与 Runtime/CLI 接力。✅ (399行)
- task-browser/ Work 同屏任务浏览：创建和编辑产品限定待办，并以七状态列表和右侧 Inspector 执行检查、验收与受控人工处置。✅
  - default.html Work 任务浏览线框：顶部产品范围、面板内七状态、同屏 Inspector、待评审确认、运行/验收、恢复与冲突。✅ (217行)
  - daily-work.html Work 日常管理子视图：弹出菜单筛选、单行父子任务树、评论图片自动加载与独立浏览窗口。✅ (60行)
  - task-form.html 待办表单子视图：产品联动成员/父待办/标签、语义优先级和标签生命周期管理。✅ (45行)
  - interaction.md 任务浏览交互：弹出菜单筛选、单行任务树、评论图片独立浏览、产品限定维护、验收问题与受控状态操作。✅ (261行)
