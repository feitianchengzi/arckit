# Product 资产与场景协作

## 架构与事实所有权

Product Coordinator 属于 Desktop 应用层，消费既有 Platform、Chat transport 和本机文件能力，不进入 Automation Kernel。Workshop Project 的身份、名称、组织、成员与 git_url 仍由既有服务器所有。Product 列表以全部可访问 Catalog 为基础，附加本机 Idea；读取失败不移除 Catalog 项目。

临时 Idea 库只保存未完成录入的草稿。正式资料从当前产品集关联项目目录的 `arckit/product/record.json` 读取。正式记录写入并验证成功后删除临时事实；恢复时按 Idea id 去重。本机 Product 控制记录保存稳定 UUID、材料路径、开发目录绑定、远端项目关联、接入执行回执与同步基线。场景会话独立持久化，复用 Chat Coordinator 与 Conversation Surface/Composer，不创建 Case、Iteration、执行租约或第二套 Automation。远端关联包含当前服务器和用户作用域，切换账号不能把旧账号的项目关联当作当前可写身份。

## 产品资料协议

仓库中的固定文件为 `arckit/product/record.json`，协议 `arcorbit-product/v1`。记录包含 product_id、revision、status、description、vision、audience、principles、assets 和可空的 idea。idea 非空时包含稳定 id、名称、created_at、recorded_at，表示已完成正式录入；产品状态仍独立。status 为 null、exploring、active、paused、archived；null 显示尚未设置。assets 为标题、类型和仓库相对路径引用，正文留在既有权威文档中。Workshop 名称与组织不复制成资料权威字段。

版本、字段类型、长度、枚举、引用路径和重复引用由同一确定性维护模块校验。写入使用预期 revision、串行化和原子替换；旧 revision 不覆盖新事实。未知版本、损坏内容、越界路径和符号链接异常保留原文件。直接编辑和 Agent 采纳调用同一维护入口；材料内容、Agent 推测或原型状态不自动成为已接受事实。

可复用的 `arckit-product-assets` skill 位于 `definition/skills/`，包含协议说明、读写校验入口及维护规则。Desktop 使用相同模块，Agent 通过原生 skill 发现或场景显式 skill 输入使用；skill 不复制 Runtime 工作流，也不把安装治理隐藏为依赖。

## 本机工作环境

每个 Idea 在 ArcOrbit userData 的 product-workspaces/UUID 下有固定 Agent cwd，空白 Idea 也有可恢复工作环境。材料目录是另一个显式授权的读取范围，正式开发目录是既有 Workspace Control 的绑定。三者不是同一身份；不会因添加材料调用会初始化 ledger 的 addProject。

材料读取工具只返回明确授权目录中的有限文件列表或文本，拒绝越界、符号链接逃逸、敏感凭据文件和过大文件。原型与图片可以保留为资产引用；不可解析材料明确返回限制。用户选择更换目录或复制材料时展示源与目标；写入目标须显式选择且不得覆盖已有文件。

## Agent 工具与会话

场景调用为 Chat Coordinator 注入应用持有的上下文、skill 输入和动态工具。普通 Chat 没有这些业务工具；Renderer 不能传入任意命令、路径权限、凭据或工具实现。

Codex app-server 在 thread/start 注册 dynamicTools，在同一 thread/resume 恢复工具。item/tool/call 由主进程按场景身份、线程和参数验证后执行，返回 success 与 contentItems。工具声明让 Agent 知道如何调用；实际代码、当前账号权限和已确认计划决定它能做什么。工具活动和结果进入共享消息列表。契约依据 [Codex app-server 文档](https://learn.chatgpt.com/docs/app-server) 与本机生成的 experimental JSON Schema。

工具覆盖读取当前产品事实、读取授权材料、提出资料或接入计划，以及执行已确认计划。提案携带基础 revision；用户编辑产生新 revision 后旧提案不能直接采纳。外部变更的确认绑定具体参数摘要与作用域，修改方案使原确认失效。Agent 的自然语言“已完成”不能替代工具回执。

场景 prompt 说明当前目标、对象身份、工具边界和事实来源；可复用维护方法由 skill 承担。启动和停止复用 Chat 行为，线程绑定先持久化再继续执行。重启将未结束运行标记中断，继续使用同一 cwd 与线程。环境故障不删除 Idea。

## 接入与部分成功

关联已有项目先核对当前 Catalog。创建项目只调用既有 Platform project.create；组织和成员仍服从服务器权限。成员管理从同一项目进入 Organization，邀请结果只表示邀请已创建。

接入计划展示新建/已有项目、组织、名称、GitHub 主体/仓库名或现有地址、材料目录与开发目录安排。GitHub 使用设备已认证 gh 能力执行固定参数的新建私有仓库操作；不可用时保留未完成录入的临时 Idea。选择已有地址不声称拥有仓库写权限。

每个外部创建先持久化 started，再执行并持久化实际结果。成功步骤不重做。网络错误、进程中断或响应丢失造成不确定时进入待核对，禁止自动重放无幂等保证的创建；用户核对已有资源后显式关联。只读重试、关联和保留本机草稿始终可用。

正式录入先验证可访问项目、GitHub 地址及本地 Git 工作目录的远端对应关系，再将产品资料与 idea 元数据原子写入该目录。用户通过原生目录选择器选择已有对应仓库或创建一个空文件夹；应用在这个明确目标内准备/clone 工作目录；空白 Idea 的私有 Agent cwd 保持不变。正式目录绑定完成且记录重新读取成功才清理临时事实。部分成功步骤有回执，重新恢复不重建资源。

## Git 共享

产品管理记录在资料分支 `arcorbit/product` 共享。同步使用 Git plumbing 和独立临时 index，只修改管理记录；不切换当前开发分支、不改变用户 index、不包含本机未提交代码。首次资料提交不引入用户未提交材料。正式记录始终位于关联工作目录；只有未完成 Idea 保存在本机临时库。读取资料分支后把已采纳记录写入关联工作目录，普通 Git clone/checkout 中已有 `arckit/product/` 的内容也能直接恢复。最后读取的远端 commit/content digest 属于本机同步控制。

读取远端后比较基线和本机变更。远端有变化且本机有编辑时展示双方，用户选择保留本机或采用远端后建立新的基线；缺少决定不发布。推送使用普通 fast-forward 规则；并发提交被拒绝后重新读取，不强推。推送响应丢失时通过远端 commit 核对结果。失败保留资料与已生成提交。

只在真实推送或远端核对成功后显示已共享；没有仓库、仅本机修改、未读取、冲突和失败各自可见。共享只覆盖管理记录；资产引用正文依然按原项目 Git 流程共享。其他设备显式读取同一资料分支。

## 页面与恢复

Product 目录保持全部可访问项目；Idea 列表从本机临时库和当前 Workset 关联的本地目录恢复。详情中的 Work/Feedback/Automation 摘要来自现有投影并携带项目身份导航。Today 责任源逻辑保持独立，新消息与本机未完成接入/资料草稿单列，不生成 Today 状态或完成字段。

持久记录与消息分区按需读取；warm render 不全盘扫描材料或 Git。刷新使用串行写入、single-flight 读取和对象修订号，迟到结果不能覆盖当前编辑。IPC 只开放受限 product 命令和场景 chat 命令，并验证主窗口来源。

## 验证边界

验证空白/材料起点、重启续接、重复提交、过期提案、未知协议、符号链接、权限失败和账号切换。两个独立 checkout 验证共享、并发冲突与开发工作区/index 不变。动态工具用实际 app-server 消息契约测试；Product 场景和普通 Chat/Automation 回归分别验证。外部账号未授权的真实资源不在测试中创建。

## Agent 主导接入控制

首次材料起点由场景 prepare 动作持久化 attempt 后发送明确任务；prepare 是 single-flight，重开只恢复不重发。会话正常结束、失败和中断形成可恢复分析控制状态；正式完成只认原执行回执。未执行新准备动作前不会重置中断。

product_context 包含产品事实、实际候选与接入所缺信息；product_environment 只读检测授权目录 Git 根/origin、GitHub 当前账号及组织，远端查询失败独立返回未知。目录来自主进程授权，命令固定且输出脱敏，不把凭据和任意 shell 交给 Renderer。图片材料工具返回有界、校验格式的 inputImage 数据；大文件和设计源文件只列引用与限制。

提案允许缺少待用户决定的字段，确认与执行使用严格校验；不完整提案可以被保存继续整理。资料、方案和材料修改统一使基础修订改变，旧建议及确认失效。review 命令以同一 revision 原子保存人修改后的资料与方案，可绑定具体 proposal_id；基础事实改变时拒绝覆盖。Renderer 本机未保存草稿在发送用户消息前提交，不把过期建议假装为当前事实。

阶段投影由会话状态、分析控制、缺失字段、执行状态及 formal 事实组成；Agent 不能直接设置正式状态。人通过界面保存的结果作为带来源的会话事件反馈，普通 Chat 的默认 prompt 与工具不变。

旧场景线程的动态工具声明不可通过 thread/resume 替换；已有检测事实也通过原有 product_context 返回。场景上下文不强制执行环境检查；Agent 自主决定使用快捷工具或原生命令，缓存带时间且可显式刷新。新建线程额外可按需调用 product_environment。图片工具结果按原生 contentItems 返回，消息列表保留图片提供记录而不展开 base64。

## 环境能力与原生探索

Product 场景按 turn/start 注入 readOnly、networkAccess=false 的原生沙箱；这一参数对新建和恢复的线程均生效，不改普通 Chat/Automation 的默认策略。原生读取范围由场景指令约束，当前 Codex readOnly 策略是文件系统只读而非所选目录的硬隔离；需要突破沙箱时复用现有用户审批，不自动批准。业务写入只由主进程执行已确认方案。

共享命令运行器将进程环境、已保存代理、Codex executable path entries 与常见 CLI 安装目录组合为一致环境，供 Product 的 Git/gh 检测、正式执行及场景 Codex 使用。Codex path entries 是可选补充，未就绪时不阻断独立业务操作；Git 查询用 -C 指向材料，不依赖 Agent 私有目录。场景环境或可执行程序改变时在下一轮重建 app-server 进程并恢复相同 thread，不丢弃会话；活动轮不切换进程。运行器只做确定性程序解析、执行、有界输出与错误事实封装；不执行登录、安装或修复。绝对路径保留其身份，程序路径与环境摘要不包含 token 值。

product_environment 保留原工具参数并返回分阶段 diagnostics；不依赖扩展旧线程 dynamicTools。product_context 提供工具环境摘要、授权范围、原生探索边界和已缓存检测时间。Agent 可在同一线程用原生命令检查路径、安装、仓库与故障，原生和业务工具证据分别说明，必要时重新调用环境工具核对。新版提示词与 skill 不再禁止全部原生命令，也不要求固定检查顺序。

失败诊断记录 requested command、resolved executable、argv、cwd、stage、exit_code、error_code、signal、timed_out、checked_at 和截断脱敏 stderr。无启动退出码时保留 null；解析和 realpath 失败另记阶段。成功 Git 根不因 origin 失败丢失；已认证用户不因组织查询失败降级。诊断进入工具结果和可展开的页面详情；不持久化完整环境或凭据。

## 目录计划与交互上下文

接入 plan.directory=material|selected，workspace_path 为本机正式目录；主进程原生目录选择授予该 Idea 目标路径，Agent 可建议已授权路径或已关联项目目录，不能凭提案取得任意写入授权。共享 interaction 投影向 Renderer 与 product_context 提供标签、选项、当前值、路径、效果、缺项和动作。每轮场景注入读取最新上下文的要求，兼容已有动态工具与线程。未采纳 proposal 和已保存 plan 分开描述。

执行前校验目标授权、真实路径、源目标不嵌套、仓库根/origin、外来产品及材料冲突。空目标克隆对应仓库；已有仓库须对应相同 GitHub。复制排除 .git、敏感文件、依赖缓存和符号链接；同内容允许恢复，不同内容不覆盖。目录准备和复制回执与远端创建回执分开；源保留，原 Git 历史不迁移，也不提交/推送。旧 managed 临时记录转换为待选择目标并清除确认，已正式记录保留绑定。绝对路径和授权只在本机控制中保存。
