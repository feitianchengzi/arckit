# ArcOrbit · Chat

[完整原型](default.html) · [交互策略](interaction.md) · [异常场景工具](scenarios.html) · [状态辅助稿](states.html)

直接用浏览器打开 `default.html`，无需启动业务服务。左侧保持四组应用导航，中间为居中的对话与 Composer，右侧为按项目分组的会话列表。原来的静态主稿保留为 `states.html`，辅助说明也改为右侧列表，不再作为产品入口。

## 可连续体验

- 从右侧列表切换 Atlas / Borealis 会话；展开各项目历史，返回时检查各自草稿和阅读位置。
- 从列表底部新建对话，先切换项目、填写 Model/Level 与文本，再发送。首条发送之前不会产生空 session。
- 发送后查看逐段回复、切换到其他会话，再返回；修改模型只影响下次 turn，停止保留部分回答。
- 重命名、删除确认/取消；删除活动会话先进入停止阶段，失败保留记录。
- 左下个人中心打开与 Thing 共用的账户与 Runtime；技能入口链接已有 Engineering 原型，当前页保持打开。
- 在场景工具中触发离线、下一次提交失败、权限请求、运行失败、无工作区、无历史、长消息与代码、模型清单不可用；恢复或重置后重试。
- 在 760px 及以下打开右侧会话抽屉，选择会话后收起；Esc 关闭并回到触发按钮。

## 依据与模拟边界

交互源为本目录 `interaction.md`；采用 `arckit/visual/_library/brief.md`、`components/conversation.yaml`、`state-contract.md` 和 `themes/light.yaml`。样式读取共享生成 Tokens，正文与对话保持原有字号，内容与输入区最大阅读宽度 760px。共用 Thing 的导航与账户组件通过显式页面适配器接入，不共享 Chat/Thing 业务模型或存储。

默认每 900ms 推进一段本地回答。`?autoplay=off` 关闭自动推进，验证使用相同 `ChatPrototype.tick()`。不存在真实模型调用、目录选择、任务源同步或文件写入；工作区表单输入只是路径样本。真实目录选择和 Setup Readiness 保留 `workspace-setup.html` 作为辅助流程依据。

普通原型存储键 `arcorbit-interaction-chat-v1`，场景工具使用 `-scenarios` 后缀，与 Thing 分开。刷新恢复持久会话、草稿、配置与阅读状态；未终结的 turn 标记为中断，不自动重新运行。清单仅展示本地候选，复制代码实际尝试浏览器剪贴板并在拒绝时提供反馈。

Markdown 本地实现从仓库受限渲染器提取，支持段落、列表、标题、引用、链接、代码及表格；拒绝 HTML 注入和非 HTTP(S) 外链。它不执行代码或任务引用，不导入生产业务模块。

真实 app-server 幂等、thread 丢失确认及替代绑定、跨进程停止和恢复、操作系统目录对话框、网络权限均未连接或验证；原型可操作成功不证明这些生产协议成立。生产页面和 spec 已同步栏位及抽屉规则；生产验证独立记录在 `arckit/cases/evidence/CASE-20260917-001/chat-electron.json`。

## 文件与验证

模型在 `model.js`，视图在 `views.js`，行为与场景在 `app.js`，页面布局在 `chat.css`，受限文本呈现在 `markdown.js`；超过八种状态按职责拆分，不把入口拆成静态子视图。`states.html` 与 `workspace-setup.html` 仅作辅助说明。

从仓库根目录运行：

```sh
node runtime/arcorbit/node_modules/electron/cli.js arckit/interaction/chat-workspace/verify.cjs
```

检查主路径、后台会话、模型固定、草稿与滚动恢复、输入法、错误重试、工作区绑定、个人中心、390–1500px 布局和 200% 缩放。结果在 `verification.json`，截图在未跟踪的 `previews/`。共用导航修改另运行 Thing 的 `verify-states.cjs`，确认旧目的地、窄窗菜单与恢复行为仍可用。
