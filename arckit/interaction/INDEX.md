# 交互设计索引

## 使用说明
- ✅ 已完成 | 🟡 设计中 | ⚪ 待设计 | 🔴 已废弃
- 📐 线框图 | 📋 交互文档

## 交互设计地图

<!-- 直接写文件名/目录名（不用链接语法），每级一句总结，行数如 (285行)；依赖关系在 _map/RELATIONS.md -->

- login/ 登录页面：启动会话恢复与不可绕过的 Workshop 验证码登录门禁。✅
  - default.html 登录线框：会话恢复、未登录入口、验证码已发送和登录失败。✅ (65行)
  - interaction.md 登录交互：启动路由、验证码反馈、失败恢复与成功进入 Command Center。✅ (128行)
- automation-workspace/ 自动化指挥中心：项目来源、分层自动领取控制、确定性串行队列、Runtime/交互式 CLI 接力、待办级独立 Workbench、用量观察、人工关注与安全恢复。✅
  - default.html 指挥中心线框：项目列表与范围、自动领取配置缺口、Runtime/CLI 接管、Case 已完成待远端收尾、空态与恢复。✅ (286行)
  - authentication.html 账号设置线框：已登录摘要、会话失效恢复与退出。✅ (51行)
  - intervention-workbench.html 介入工作台线框：固定三栏与 Composer、中间独立滚动消息、Loop/Agent 优先及单行工具活动。✅ (98行)
  - runtime-recovery.html 恢复中心线框：领取冲突、启动失败、安全停止、外部状态变化、多活动任务与任务源异常。✅ (122行)
  - interaction.md 自动化指挥中心交互：登录后会话状态、本地优先 Case 恢复、Runtime/CLI 执行权接力、三段收尾状态与失败恢复。✅ (339行)
- task-browser/ 任务浏览页面：在项目范围内浏览七种服务器状态并执行受控人工处置。✅
  - default.html 任务浏览线框：待处理、待评审确认、进行中、完成验收、阻塞恢复、取消、空态与版本冲突。✅ (215行)
  - interaction.md 任务浏览交互：项目与状态双轴筛选、Inspector、受控状态操作和并发冲突处理。✅ (179行)
