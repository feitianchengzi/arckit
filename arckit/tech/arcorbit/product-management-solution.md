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

正式录入先验证可访问项目、GitHub 地址及本地 Git 工作目录的远端对应关系，再将产品资料与 idea 元数据原子写入该目录。用户可以选择已有目录，或授权应用在选定父目录创建/clone 工作目录；空白 Idea 的私有 Agent cwd 保持不变。正式目录绑定完成且记录重新读取成功才清理临时事实。部分成功步骤有回执，重新恢复不重建资源。

## Git 共享

产品管理记录在资料分支 `arcorbit/product` 共享。同步使用 Git plumbing 和独立临时 index，只修改管理记录；不切换当前开发分支、不改变用户 index、不包含本机未提交代码。首次资料提交不引入用户未提交材料。正式记录始终位于关联工作目录；只有未完成 Idea 保存在本机临时库。读取资料分支后把已采纳记录写入关联工作目录，普通 Git clone/checkout 中已有 `arckit/product/` 的内容也能直接恢复。最后读取的远端 commit/content digest 属于本机同步控制。

读取远端后比较基线和本机变更。远端有变化且本机有编辑时展示双方，用户选择保留本机或采用远端后建立新的基线；缺少决定不发布。推送使用普通 fast-forward 规则；并发提交被拒绝后重新读取，不强推。推送响应丢失时通过远端 commit 核对结果。失败保留资料与已生成提交。

只在真实推送或远端核对成功后显示已共享；没有仓库、仅本机修改、未读取、冲突和失败各自可见。共享只覆盖管理记录；资产引用正文依然按原项目 Git 流程共享。其他设备显式读取同一资料分支。

## 页面与恢复

Product 目录保持全部可访问项目；Idea 列表从本机临时库和当前 Workset 关联的本地目录恢复。详情中的 Work/Feedback/Automation 摘要来自现有投影并携带项目身份导航。Today 责任源逻辑保持独立，新消息与本机未完成接入/资料草稿单列，不生成 Today 状态或完成字段。

持久记录与消息分区按需读取；warm render 不全盘扫描材料或 Git。刷新使用串行写入、single-flight 读取和对象修订号，迟到结果不能覆盖当前编辑。IPC 只开放受限 product 命令和场景 chat 命令，并验证主窗口来源。

## 验证边界

验证空白/材料起点、重启续接、重复提交、过期提案、未知协议、符号链接、权限失败和账号切换。两个独立 checkout 验证共享、并发冲突与开发工作区/index 不变。动态工具用实际 app-server 消息契约测试；Product 场景和普通 Chat/Automation 回归分别验证。外部账号未授权的真实资源不在测试中创建。
