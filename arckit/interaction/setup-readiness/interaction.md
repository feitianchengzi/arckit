# Setup Readiness 交互

## 页面定位

本地环境检查负责可执行且已认证的 Codex、内置技能目录与旧项目副本迁移。冷启动检查全部已关联项目；新增或改变关联时重查，纯浏览范围切换不触发。技能选择由 Engineering 管理。

## 主路径

1. 校验随包资源并通过 ArcForge 只读生成安装更新计划。默认展示全部技能（包含 on-demand）的安装、更新、无需变更、待登记或冲突状态，来源类型、内容版本、来源和目标路径，以及共享资源目标。勾选确认后点击“确认安装与更新”才写入，不包含删除授权。
2. 通过 ArcForge 生成旧副本清理清单，只包含有可靠归属证据且未修改的副本；环境检查不执行删除。默认展开完整路径和处理原因，用户勾选已查看清单后点击“确认删除清单中的 N 项”才执行，不创建备份。
3. 保留修改过的副本、第三方、归属不明、共享 loader 与目录链接，显示保留原因。
4. 完成 Codex executable、版本和登录状态检查；缺失或未认证时使用下面的恢复流程。
5. 显示内置技能版本和数量，以及待确认、已清理、保留、失败路径。待清理时允许“暂不清理，继续使用”；没有待确认项或写入的普通启动恢复原页面。确认后执行前重核计划摘要，计划变化必须重新检查与确认。
6. 权限或资源错误显示具体路径与原因，修复后重新检查；失败不回退到旧安装模式。

## 状态与交互

- checking：显示正在检查，不开放新的 Agent 执行。
- ready：目录与全部已关联项目检查通过，允许继续；不把尚未绑定的项目声明为已准备。
- blocked：显示错误原因、失败阶段和重试入口。
- Engineering 保存提示明确 Chat 在下一条消息生效、Automation 在下一次运行生效；本页不重复技能配置入口的功能。

### Codex CLI 恢复

- `missing` 首屏说明不需要 Node、npm 或 Homebrew，显示 `recommended` standalone；已存在且满足版本/写权限的 npm 或 Homebrew 作为 `available` 选项，阻塞方法不进入可执行选择。
- `broken` 显示候选 executable、owner hint 和版本探测失败摘要，提供重新检查；其它健康候选仍保留在 inventory，任一可选 source 失败不把整机误报为 missing。
- `installed` 显示 active executable、execution scope、owner/confidence、installed version、独立 update state 与 latest version；多个候选逐项显示 active/shadowed 选择原因。
- `check-failed` 只作用于对应 discovery 或 update consultation；更新查询失败显示代理/网络恢复说明，不能隐藏健康 installation、清除认证状态或阻止继续使用。
- proven owner 的 `update-available` 显示“更新 Codex”，`up-to-date`、`ahead-of-channel`、`channel-mismatch`、`owner-conflict` 和 `unsupported-owner` 均显示对应说明而不伪造可更新动作；主动“检查更新”绕过缓存。
- `installing` 与 `updating` 显示下载、执行、重新发现、版本复核四阶段。失败保留已完成阶段、稳定 code、可重试动作和“当前安装是否仍可用”，不把 installer 退出零直接显示为成功。
- 存在活动 Codex owner 时更新按钮禁用，旁边直接列出阻塞的 Chat/Automation 摘要；owner 结束后自动重新计算可更新性。

### Codex 登录选择

- 凭证类型页展示 ChatGPT 账号、API Key，以及 capability 明确支持时的企业 Access Token；所有 radio/card 默认未选，“继续登录”禁用并解释“请选择凭证类型”。
- 选择 ChatGPT 后进入第二级浏览器/设备码选择；两个流程仍默认未选，返回上一级会清除 ChatGPT flow 选择但保留用户已明确选择的凭证类型。
- 设备码不受支持时不显示为可选 card，并在说明区解释可用性；不自动切换到浏览器登录。
- API Key/Access Token 页使用不持久化的 masked 输入和一次性提交；取消或提交立即清空控件，复制、回显和“记住我”不可用。
- `login-in-progress` 显示官方流程类型、等待时间和取消动作。系统浏览器凭证不回到 ArcOrbit；device code 只在当前 operation 中显示。
- 成功、取消、超时和失败都先显示“正在重新验证登录状态”；只有 status probe 成功后显示“Codex 已登录”。失败页允许重试当前明确方式或返回重新选择，不保留 secret。
- logout 是已认证摘要中的独立显式动作；退出后重新检查，不改变 Workshop 账号状态。

## 导航与安全

继续返回进入检查前的页面。重试只执行本次环境检查，不重复 Codex 安装或登录。Codex 与 Workshop 登录相互独立；API Key / Access Token 仅通过受控子进程 stdin 传递，不进入日志、普通配置或共享 renderer 状态。安装外部 Codex 仍需要相应明确操作，Arckit 旧项目技能迁移按产品契约自动执行。

键盘可访问重新检查与继续操作，进度通过状态文本反馈。清理与保留列表使用可换行绝对路径，不只用颜色表示成功或错误。

依据：[场景技能规格](../../spec/agentic-software-development/arcorbit-scene-skills.md)、[分发与安装](../../spec/arcorbit-distribution.md)。
