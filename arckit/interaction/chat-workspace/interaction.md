# Chat Workspace - 交互规范

## 交互策略

Chat 承接绑定本地 Product Workspace 的自由 Codex 对话。用户先确定工作区，再以独立会话提问、讨论或请求 Agent 操作；系统持续展示用户消息、Agent 正文、折叠 reasoning、工具活动、权限请求和运行状态。Chat 不要求用户先创建待办，也不把对话自动转成 Idea、Work、Case 或其他正式对象。

每个 Chat session 固定对应一个本地项目根和一个持久 Codex thread。会话与 Automation task session、task thread、Run、Case、队列和 human Gate 相互隔离。切换会话或离开页面不停止正在生成的回答；停止操作只 interrupt 当前会话的当前 turn，并保留部分输出。

核心任务包括：建立或恢复会话、提交消息、阅读流式回答、理解工具与权限状态、随时停止生成、从失败或重启中恢复、重命名或删除会话。页面使用双栏结构，左栏只管理自由 Chat session，右栏同时容纳 transcript 和 Composer，不提供后续对象转换 Inspector。

## 页面结构

- 顶部显示 `Personal / Chat`、当前 Product Workspace、Codex 连接状态和新建对话按钮。
- 左栏显示会话列表。每项包含标题、最近时间、工作区、活动/中断/失败状态和更多菜单。
- 右栏顶部显示会话标题、工作区和重命名、删除入口。
- transcript 按时间显示用户消息、Agent 正文、reasoning disclosure、工具活动、权限请求和错误恢复提示。
- Composer 位于右栏底部，包含多行输入、发送或停止主按钮、快捷键说明和当前权限边界摘要。
- 页面不显示“转为 Idea”“创建 Work”或“形成后续事项”。

## 主路径

1. 用户进入或重新进入 Chat，系统立即显示 Chat 页面壳和内存中最近一次会话、草稿与消息投影，同时在后台读取 fresh snapshot；导航不等待 IPC 返回。
2. 没有会话时，用户选择一个已绑定且可用的 Product Workspace；系统展示空白 Composer 和建议问题，不立即创建持久空会话。
3. 用户输入第一条非空消息并发送；系统创建 session，固定工作区，立即显示用户消息，并在首个 turn 前持久化 Codex thread id。
4. Agent 正文和工具活动以稳定消息项流式更新。页面在用户处于底部时跟随新内容；用户上滚后保持阅读位置。
5. 用户继续发送消息时，系统在同一 session 和 thread 启动新 turn。用户可切换其他会话，活动会话继续更新并在列表显示状态。
6. 用户可停止当前生成；系统发出 interrupt，保留部分回答并标记“已中断”。用户随后发送“继续”或新的要求时启动同一 thread 的新 turn。
7. 用户可重命名会话，或经确认删除会话。删除活动会话时系统先停止 turn，进入终态后再删除本地记录。

## 会话列表与新建

- 会话按 `updated_at` 倒序排列；活动会话持续置顶，但不会改变用户当前选中项。
- “新建对话”建立一个临时草稿视图。用户未发送消息就返回其他会话时，不生成空历史记录。
- 新对话默认使用当前顶部选择的单个 Product Workspace；范围是“项目集全部”或没有有效本地绑定时，发送前必须显式选择一个工作区。
- 第一条消息成功进入本地队列后，临时草稿成为持久 session；标题取第一条用户消息的有界摘要。
- 标题支持就地重命名。空白标题不保存，取消编辑恢复原值。
- 会话列表只显示 `kind=chat` 的自由会话。Automation task session、acceptance feedback session 和旧的无归属默认 session 不进入列表。

## 消息与内容体验

- 用户消息提交后立即显示；同一提交使用客户端幂等键，双击发送或 IPC 重试不会产生两条消息或两个 turn。
- Agent 正文按稳定 `thread_id + turn_id + item_id` 更新同一消息。生成中显示状态，完成后移除运行指示。
- Markdown 正文支持标题、段落、列表、引用、链接、表格和代码块；代码块提供复制，不自动执行。
- reasoning 只有在 Codex 提供非空 summary 时出现，生成中可展开，完成后默认折叠；界面不伪造内部思考。
- 工具活动按 item 原位显示开始、运行、完成、失败和有界目标。完整命令输出、文件正文、raw JSON-RPC 和协议 payload 只进入诊断证据，不进入普通消息正文。
- 权限请求显示操作、目标、工作区和影响范围，并提供允许或拒绝。处理前对应 turn 保持等待；拒绝结果作为工具状态回到 transcript。
- 已中断回答保留可见正文和“已中断”标记。系统不把 interrupt 描述为可恢复同一 turn；后续输入是同一 thread 的新 turn。
- turn 失败保留用户消息、部分 Agent 输出和具体错误。可恢复错误显示“重试”与“编辑后发送”；不可恢复的 thread 丢失显示已建立替代 thread 的恢复记录。

## Composer

- Composer 支持多行文本和输入法组合；`Enter` 发送，`Shift+Enter` 换行。输入法正在组合时按 Enter 不提交。
- 空白消息不可发送。发送后保留焦点，并只清除已被接受的文本；IPC 失败时草稿保持原样。
- turn 活动时主按钮变为“停止”，调用当前 turn 的 interrupt。Composer 仍可编辑草稿，但在当前 turn 进入 completed、interrupted 或 failed 前不启动同一会话的第二个 turn。
- 当前 turn 完成后，已有草稿保持不变，用户显式发送才进入下一 turn。
- 页面切换、窗口失焦和会话切换都不自动提交、清空或中断 Composer。

## 状态模型

### 初始与空状态

- 有可用工作区且无历史时显示工作区选择、能力边界和建议问题。
- 没有可用本地 Product Workspace 时禁用发送，解释需要本地目录与 Setup Readiness，并提供“前往工作区设置”。
- 首次没有可显示投影时，会话列表和 transcript 保持 Chat 页面骨架；已有投影时后台同步状态出现在页面内且不遮挡阅读或 Composer。
- 后台同步成功后按 owner freshness 规则更新列表与 transcript；失败时保留当前投影、显示就地重试，不回退到旧页面，也不创建默认假会话。

### 运行状态

- `starting`：本地用户消息已接受，正在初始化 app-server、恢复或创建 thread。
- `running`：turn 已开始，Agent 或工具事件持续更新。
- `waiting_approval`：Codex 请求用户批准，Composer 草稿可编辑，停止仍可用。
- `interrupting`：停止请求已发出，主按钮禁用并显示“正在停止”，直到 turn 终态。
- `completed`：turn 正常结束，可以发送下一条消息。
- `interrupted`：部分输出已保存，可以在同一 thread 开始新 turn。
- `failed`：显示错误、保留输入与上下文，并按可恢复性提供动作。

### 后台与重启恢复

- 用户切换到另一会话时，原会话继续接收事件；列表使用状态标记区分运行、等待批准和失败。
- 应用关闭时 main process 对活动 Chat turns 发出 interrupt，并尽力持久化到最后一个语义消息边界。
- 重启后 session、消息、草稿和 thread 绑定恢复。之前未形成终态的 turn 显示“应用退出时中断”，不会自动重启或重复用户请求。
- 下一条消息先 resume 持久 thread；瞬时 resume 失败保留绑定和恢复入口，只有 Codex 明确确认 thread 不存在时才创建替代 thread。

## 删除确认

- 删除入口打开 ConfirmationDialog，展示会话标题、工作区、消息数量和当前运行状态。
- 非活动会话确认后只删除该 session 的本地消息、草稿、运行引用和 thread 绑定，不影响同项目其他 Chat 或 Automation 数据。
- 活动会话确认后先进入 `interrupting`；interrupt 成功或 turn 已终结后执行删除。停止失败时保留会话并显示恢复错误，不执行部分删除。
- 确认文案明确说明本操作不承诺擦除 Codex 自身可能保留的底层 thread 数据。

## 滚动、选择与反馈

- 用户在 transcript 底部阈值内时，新消息和 delta 自动保持最新内容可见。
- 用户主动上滚时，更新不改变当前阅读位置，并显示“回到最新”及未读消息数。
- 切换会话前保存当前草稿和滚动锚点；返回时恢复两者。
- 复制、重试、权限决定、重命名和删除均提供就地成功或失败反馈，不使用全局静默失败。

## 键盘与可访问性

- 会话列表、更多菜单、权限请求、停止、重试和删除确认均可通过键盘访问，并有可见焦点。
- 发送与停止按钮拥有随状态变化的可访问名称；运行、等待批准、中断和失败状态通过文字与辅助技术通知，不只依赖图标或颜色。
- 流式 delta 不逐字符触发播报；Agent 消息完成、权限请求和错误形成有界通知。
- `Esc` 只关闭当前菜单或弹窗，不停止 turn；停止必须由明确按钮或其快捷操作触发。

## 边界

- Chat 直接使用 Codex 对话能力，但不调用 state-driven Runtime、`$using-arckit`、trusted ledger 或 Automation Coordinator。
- Chat 不创建或修改 Workshop Project、Task、Feedback、Idea、Project State、Case 或 acceptance feedback。
- Product Workspace 决定 `cwd`、workspace root、skill discovery 与 sandbox 边界；Renderer 不获得文件系统、Codex 凭据或通用 RPC 能力。
- Chat 的停止不释放 Automation human Gate，不改变远端任务状态，也不抢占 Automation task thread lease。
- Chat 不提供附件、语音、共享链接、跨设备同步、会话分支或模型管理；Composer 专注文本自由对话。
