# ArcOrbit · Thing

[打开正式原型](default.html) · [交互规范](interaction.md) · [异常场景工具](scenarios.html)

`default.html` 可直接在浏览器打开，无需构建或业务服务。规范主题是 `arckit/visual/themes/light.yaml`；入口引用 visual 自动生成的 CSS。重建视觉映射：

```sh
python3 arckit/visual/_library/build-preview.py
```

## 体验入口

- #101：编辑目标与标准，添加资料/约定/子事情；直接 Auto。
- #102：先分析，消息中保存约定，从成果页查看方案，再开始 Auto。
- Feedback #103：补充要求、暂停并讨论、调整安排、明确继续。
- Workshop Todo #104：处理决定或先讨论。
- #105：查看成果，逐项检查标准，提出并处理验收问题，再确认验收。
- 列表底部“发起事情”：首条输入建立自己负责的待评审事情；切换事情与刷新检查草稿保持。
- 左侧业务导航：Chat 旁的“Thing”为新独立入口，其他页面直接打开对应原型并保留当前事情；窄窗通过顶栏“页面导航”访问。保留 PERSONAL、PRODUCT、PRODUCT LIFECYCLE、ORGANIZATION 四组类别，无新增项目列表、关注分组和资源入口。
- 左下个人中心：打开完整“账户与 Runtime”；样本验证码为 `123456`。字段和行为的代码映射见 [个人中心能力](account-capabilities.md)。

## 本地场景与模拟边界

所有项目、消息、Agent 回应、执行、检查、资料和成果都是本地样本，不连接 Workshop、Codex、Runtime、Git 或外部服务。正式预期由 interaction.md 表达；模拟成功不证明生产协议可用。

默认 Auto 每 15 秒推进一条本地场景记录；`?autoplay=off` 关闭计时推进，测试调用同一 `tick()`。已有进展与完成取决于场景事实，不按计划数量推算；调整安排后不会继续播放旧场景的完成结果。

正式原型存储键为 `arcorbit-interaction-project-workbench-v1`；异常场景工具使用 `-scenarios` 独立后缀。候选仍使用 `arcorbit-project-desk-v2`。三者不互相读取。scenarios.html 提供离线、提交失败、无权限、版本变化、空筛选、暂停/停止/失败/外部等待、加载与重置入口。恢复连接不清除草稿。

模拟资料支持文本和链接内容，不上传文件或抓取链接。语音明确禁用。线程身份、自动执行、并发槽位和权限均为本地投影；真实创建成功但首条发送失败、服务端幂等、跨进程恢复及真实授权需生产验证。旧页面多为静态状态投影，不声称其业务流程已升级为可操作原型。

## 文件职责

- `model.js`：隔离样本、状态、存储、身份与本地业务变化。
- `work-progress.js`：按事情投影进展与可变安排；`detail-content.js`：共用资料/成果/标准与详情投影。
- `views.js`：主导航、列表、消息与场景结构；`app.js`：动作、表单、滚动、焦点与进展调度。
- `account-settings.js`：个人中心完整能力与本地交互；`verify-account.cjs`：生产控件覆盖与操作链验证。
- `navigation.js`：并列业务页面与窄窗导航入口；`scenarios*.js/html`：独立验证工具。
- `styles.css`、`desk.css`、`detail-content.css`：页面布局与内容结构；`visual.css`：正式组件规则的页面应用。颜色与文字层级消费 visual 变量。
- `verify.cjs`：完整主路径回归及截图；`verify-states.cjs`：异常恢复、键盘、幂等样张与窄窗。

## 验证

从仓库根目录，使用当前 ArcOrbit 开发依赖中的 Electron：

```sh
node runtime/arcorbit/node_modules/electron/cli.js arckit/interaction/project-workbench/verify.cjs
node runtime/arcorbit/node_modules/electron/cli.js arckit/interaction/project-workbench/verify-states.cjs
node runtime/arcorbit/node_modules/electron/cli.js arckit/interaction/project-workbench/verify-account.cjs
```

三个脚本使用独立临时浏览器存储；检查时禁止 HTTP(S) 外部请求。报告为 `verification.json` 、`verification-states.json` 和 `verification-account.json`，截图可由验证脚本重新生成到 `previews/`，不保留在版本库。正式设计无 runtime/design 资源依赖；上述 Electron 仅为本地验证工具。

采纳来源、原始候选与迁移记录位于 [V2 探索记录](../_explorations/project-workbench-v2/exploration.md)。
