# 个人中心能力与代码依据

## 定位

Thing 左下角完整个人中心按钮打开“账户与 Runtime”模态弹出页；窄窗通过页面导航菜单进入同一个弹出页。运行状态面板的“执行设置”继续管理本机自动领取、项目执行参与和并行情况，与个人中心分开。

本轮依据用户 2026-09-17 的要求保留现有能力，并优化布局与反馈。控件基线来自 `runtime/arcorbit/desktop/renderer/index.html` 的 `settingsOverlay`；行为依据为同目录 `renderer.js` 的 `openSettings`、`renderSettingsForm`、`renderAuthPanel`、`saveSettings`、`login`、`logout`，以及 `codex-settings-form.mjs`。没有通过静态原型反推未实现的新服务能力。

## 能力映射

| 能力 | 代码事实 | 原型入口与结果 |
|---|---|---|
| 工作空间同步 | `workbenchSyncSettings` → `projectWorkbenchCommand('sync')` | 同步项目与事情；失败保留内容，恢复连接后重试 |
| 产品反馈 | `workbenchFeedbackSettings` → `openProductFeedback` | 打开已有产品反馈原型，保留 Thing 的阅读与草稿 |
| 账号摘要 | `authStatusPill`、`authIdentity`、`authDescription` | 已登录、过期、未登录与操作反馈 |
| 邮箱/手机验证码 | `data-auth-type`、`authTarget`、`authCode`、`sendVerificationButton` | 切换类型、填写账号、发送与倒计时；错误保留输入 |
| 登录并同步 | `loginButton` → `loginWithCode` | 错误码可重试，成功恢复账户能力 |
| 退出登录 | `logoutButton` → `logoutAuth` | 活动执行存在时展示停止执行和清理快照的确认，取消保持账号；未登录门禁不可 Esc 关闭 |
| 任务源开关及服务 | `taskSourceEnabled`、`taskSourceBaseUrl`、`taskSourceServiceName` | 高级设置中编辑，统一保存并同步 |
| 三种认证模式 | `taskSourceAuthMode` | Workshop 登录、Bearer Token、用户请求头；按选择显示对应字段 |
| 令牌与请求头 | `taskSourceToken`、`taskSourceUserId`、`taskSourceUsername`、`taskSourceAppId`、`taskSourceSessionId` | 密码字段留空保留配置；各请求头字段可编辑 |
| YOLO | `codexYoloMode` | 默认关闭；保存后作用于后续消息、新 Run 和终端接力，活动调用不变 |
| Chat 与 Automation 默认值 | `codexChatModel/Effort`、`codexAutomationModel/Effort` | 两组独立字段，可手动输入；清单更新不覆盖草稿 |
| 模型清单 | `refreshCodexModelsButton` | 加载、可用与不可用；Level 候选跟随 Model，失败允许手动保存 |
| 独立 Codex 保存 | `saveCodexSettingsButton` | 仅保存两组 Model/Level 与 YOLO，不提交任务源和代理草稿 |
| Codex 代理 | `codexProxyEnabled`、`codexProxyUrl` | 开关及地址；通过保存并同步提交，仅影响后续启动 |
| 完整保存 | `saveSettingsButton` | 保存配置与任务源、代理；区分“保存失败”与“已保存但同步未完成” |
| 关闭与返回 | `closeSettingsButton`、overlay 关闭 | 关闭、Esc、背景点击恢复个人中心焦点；未登录门禁及提交中不关闭 |

## 本轮体验优化

- 保留现有工作空间、Workshop 账户、Codex Runtime 分区，高级任务源默认折叠。
- 左下角头像、姓名和图标构成同一个可键盘操作的按钮；模态层约束焦点，内部独立滚动，窄窗双列字段收为单列。
- 保存并同步以及登录成功后暂时保留弹出页，便于查看结果或继续修改。生产代码当前在这些动作成功后关闭设置；这是本轮明确的原型优化，尚未写入生产。
- 其他页面的产品反馈原型以新标签打开；生产为专用受限窗口。原型不伪造窗口接入结果。

## 本地模拟边界与验证

`account-settings.js` 使用 Thing 的隔离样本存储保存普通设置；不发送验证码、不启动 Codex、不访问任务服务。验证码样本为 `123456`，邮箱或手机号使用任意格式有效的样本。退出后的样本任务仍留在隔离模型中以便继续体验，模态登录门禁阻止访问；这不代表已经验证生产快照清理或安全停止协议。

令牌、验证码和 Session ID 不持久保存、不发送到网络；只保留“已配置”的非敏感标记。真正的凭据保存、任务同步、登录恢复和退出停止需生产验证。清单为已有默认模型的本地候选，不声称实时模型可用性。

`scenarios.html` 可触达账户过期、清单不可用、离线、下一次提交失败及恢复；切换场景不替换个人中心中未提交的输入。重置样本后可重新体验。

`verify-account.cjs` 从生产 HTML 提取设置区全部带 ID 的 input/select/button，检查原型中 26 个对应控件均存在；实际操作两种认证类型、三种任务源模式、两类保存、失败恢复、退出确认、模型清单、焦点和窄窗。报告见 `verification-account.json`。该验证只证明原型覆盖与模拟行为，不证明生产服务可用。

## 外观

设置内的外观选择遵循 ../CONVENTIONS.md 的本机外观契约；选择立即生效并独立保存，不提交账户和 Codex 表单草稿。使用 visual/themes/dark.yaml 与 light.yaml。原型以独立 localStorage 保存模拟偏好，系统模式读取浏览器媒体查询；保存失败恢复原值并显示错误。生产由本机偏好 owner 维护，原型存储不复用生产键。
