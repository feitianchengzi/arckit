# ArcOrbit 分发与安装


## 目标

ArcOrbit 通过可追溯的桌面安装包交付。内部用户只需要取得并运行所选平台的安装包，并把 Workshop Project 关联到本地项目，即可获得 Runtime/Desktop、受信 ledger 能力、`$using-arckit` Agent 入口以及按 Chat / Automation 场景配置的 Arckit skills。

安装包是一次完整产品交付，不要求用户另行 clone Arckit 或 ArcForge 仓库，也不要求先安装 ArcForge Desktop、ArcForge CLI、Node、npm 或 Homebrew。Codex CLI 缺失、版本不可验证或尚未登录时，Setup Readiness 提供官方 standalone 安装、更新和显式登录恢复流程；操作系统权限、外部任务源账号和签名信任仍属于对应平台的显式前置条件。

## Codex Model 与 Level 设置

ArcOrbit 的账号与 Runtime 设置分别维护当前设备的 Chat 默认 Model/Level（推理级别）和 Automation 默认 Model/Level；保存任一场景不会改写另一场景。Model 候选来自当前 Codex 的可见模型清单，Level 候选来自所选模型支持的推理级别。四个字段始终可手动编辑；清单加载中、查询失败、接口不可用、空清单或当前值不在清单时，用户仍能输入、保存及重试查询。清单只是候选信息，不代表账户已经获得模型执行授权。

未配置或存储字段非法时，两个场景均使用 Model gpt-6-astra、Level high。升级时，旧版单组 `settings.codex.model/reasoning_effort` 的有效值同时成为 Chat 与 Automation 初始值，此后独立保存；已有场景化有效值按字段保留。安装升级、应用重启、账户切换和清单刷新均不重置选择；清单推荐默认级别不覆盖用户配置。保存要求每个值为 1–200 个字符的非空文本，去除首尾空白并拒绝控制字符，不要求人工输入必须出现在清单中。

“保存 Codex 配置”只保存 Chat 与 Automation 的两组 Model/Level，并在设置页原位反馈结果；“保存并同步”同时保存设置草稿并执行既有 Workshop 同步。只有持久保存成功才显示配置已保存，失败保留四个草稿供重试。查询使用已保存的代理设置，未保存的代理草稿不参与查询。

新建 Chat 会话继承 Chat 默认值，并把自己的 Model/Level 作为本机会话控制事实。Chat Composer 在输入框附近持续显示这两个值，通过列表选择同一模型清单中的选项，Level 随所选模型更新；切换模型时不支持的旧级别选择 medium（若支持）或首项，清单不可用时保留已保存值与发送能力；调整只作用于当前会话或尚未发送的新会话草稿，不改写 Chat 默认值或 Automation 默认值。既有会话重新打开后恢复自身选择，后续消息保持同一 thread。消息被本地接受时固定该 turn 的 Model/Level，因此发送后对 Composer 的调整只作用于下一 turn。

Automation 新 Run 读取 Automation 默认值并在启动记录中固定；活动 Run 的后续自动轮次继续使用该启动配置。设置页改动不影响已有 Chat 会话，Composer 改动也不影响 Automation；两者都不打断执行或创建替代 thread。人工接管的交互式 Codex CLI 继续恢复原 thread，并遵循其已有配置；独立启动的 CLI 不读取 ArcOrbit Desktop 偏好。实际模型执行失败仍使用既有 Chat 和 Automation 恢复入口。

本地 Model/Level 偏好不改写用户全局 Codex 配置，也不改变 Workshop 账户、项目治理或执行授权。查询由可信主进程执行；页面只能发起固定清单请求并取得非敏感候选。

验收覆盖缺省值、旧单组配置兼容迁移、两个场景独立保存和重启恢复、未知当前值保留、完整分页及中途失败、超时关闭、人工输入重试、异步刷新不覆盖草稿、Composer 会话级选择、Chat 同 thread 后续消息采用新值、已接受 turn 参数固定，以及 Automation Run 参数固定且不受 Chat 调整影响。

### Agent YOLO 模式

账号与 Runtime 设置提供当前设备统一的 YOLO 开关，默认关闭；只有显式开启并成功保存才生效。它覆盖 Chat、Idea、Release、项目事情台会话、Automation 与应用发起的终端 Agent 接力。开启时 Agent 跳过命令审批并解除 Codex 文件系统和网络沙箱限制；应用业务工具的角色校验、对象归属及业务确认继续生效。

开关保存后作用于后续接受的会话消息、新启动 Run 和终端接力；活动消息与 Run 保持启动时配置。关闭后后续调用恢复常规审批与场景沙箱，同一会话保持原 thread。旧设置缺失此项时保持关闭，非布尔值不能开启；保存失败保留草稿与已保存的有效设置。模型设置与 YOLO 开关独立，清单查询失败不阻止保存。开关不修改用户全局 Codex 配置，也不改变账号认证或托管环境施加的权限上限。

## 产品身份

`ArcOrbit` 是监督式 Desktop/Runtime 产品的正式名称。`Arckit Runtime` 只表示该产品的历史名称，不作为新界面、安装包、文档标题或开发入口的当前品牌。

Arckit 继续表示软件研发协议、Project/Case/Loop ledger 和 skills 体系；ArcOrbit 是承载该协议自动化运行形态的产品。ArcForge 继续表示独立的 skill provisioning 产品与 embedded provider。ArcOrbit 不改变这两个名称或它们的职责边界。

新版本使用以下产品与开发身份：

| 身份面 | 当前身份 |
| --- | --- |
| 产品与窗口名称 | `ArcOrbit` |
| 仓库组件路径 | `runtime/arcorbit/` |
| Node package | `@arckit/arcorbit` |
| CLI 与可执行文件 | `arcorbit` |
| 安装包与 Actions artifact 前缀 | `ArcOrbit-`、`arcorbit-` |
| 构建 workflow | `.github/workflows/arcorbit-package.yml` |
| 安装包内部 Runtime resource root | `arcorbit/` |

以下值是升级连续性标识，不是产品展示名称：

- Electron application id 保持 `com.feitianchengzi.arckit.runtime`，使已安装应用沿用原有平台身份和 userData；
- Workshop task-source `app_id` 保持 `arckit-runtime`，直到服务端通过独立兼容迁移接受新身份；
- 已发布的 `arckit-runtime-*` schema version、`arckit-runtime://runs/...` opaque ref 和 distribution lock/attestation schema 保持可读、可验证，不因品牌更名失效；
- CLI `arckit-runtime` 作为兼容别名继续进入同一入口，新的文档和示例只使用 `arcorbit`；
- 已关闭 Case、既有 Runtime result、历史 provenance、发布 tag 和其中记录的旧路径或名称保持原样。

当代码读取可迁移的本地资源布局或配置时，优先使用 ArcOrbit 当前身份，并只在升级恢复边界内接受旧身份。兼容别名不得重新出现在用户可见品牌、当前 artifact 名称或新的权威文档标题中。

## 产品边界

- Runtime Kernel 继续负责持续 Agent thread、Case Loop、trusted ledger、任务源和恢复，不负责 skill 选择、skill 内容解释或安装目录扫描。
- Desktop 的 Setup Readiness 负责全局资源准备和逐关联项目的 skills provisioning、安装状态、修复与升级提示。
- ArcForge Embedded Provider 只提供确定性的 source/profile/availability、plan、drift、apply 和关系记录能力，不作为 Runtime capability，不进入 Agent prompt，也不安装完整 ArcForge 产品。
- Arckit skill payload、Runtime trusted capability resources 和 ArcForge provider 是三个独立的版本化资源，安装包通过一份 distribution lock 将它们绑定。
- 安装包不静默修改 Claude、Cursor 或其它 Agent。当前 Runtime 交付只配置 Codex 目标。

## 人工出包意图

GitHub workflow 只接受人工触发，不因 `main`、`release/*` 或 tag push 自动开始出包。操作者在触发时显式选择以下内容：

- 已存在的 release intent tag；
- 目标平台与架构，或全部受支持目标；
- 签名策略；
- 仅生成 Actions artifact，或同时创建 draft GitHub Release。

tag 仍是不可变的出包意图和版本基线：

- `tf/vx.x.x-bN` 表示内部测试包；
- `beta/vx.x.x-rcN` 表示外部测试或公测候选；
- `appstore/vx.x.x` 表示正式发布候选。

workflow 不创建、移动或覆盖 tag。tag 不存在、tag 与选择的渠道不一致、版本不一致或基线不符合分支规范时，出包在构建前失败。

## 分支和基线规则

- `main` 是唯一长期开发主线。
- `release/vx.x.x` 从 `main` 创建后冻结版本范围，不再整体合并 `main`。
- release 所需修复通过明确的 cherry-pick/backport 进入 release，并从 release 回流 `main`。
- `hotfix/*` 只在活跃 release 不适合作为修复线时使用。
- 如果目标版本的 `release/vx.x.x` 已存在，同版本所有渠道 tag 默认必须位于该 release 历史上。
- 没有目标 release 时，`tf/*` 可以基于 `main`。
- `beta/*` 默认基于 release；从 `main` 出包需要操作者在 dispatch 中显式确认例外。
- `appstore/*` 必须基于 release、正式修复线，或由操作者明确确认的发布候选 commit。

## 支持的安装包

人工触发可以选择一个目标或全部目标：

| 目标 | 安装包 | 架构 |
| --- | --- | --- |
| macOS | DMG | Apple Silicon arm64 |
| macOS | DMG | Intel x64 |
| Windows | NSIS installer | x64 |
| Linux | AppImage | x64 |

每个 artifact 名称包含产品名、Runtime 版本、渠道、操作系统和架构。每次 run 同时生成 SHA-256 checksums、distribution lock 和构建 provenance 摘要。

## Setup Readiness

冷启动从 Desktop Store 读取全部关联项目，校验随包 checksum、distribution lock、trusted resources 和 skill payload，调用 ArcForge Embedded Provider 检查消费方 catalog 并展示待安装更新清单，用户确认后安装，再通过 Provider 展示项目 `.codex/skills` 中有可靠归属证据且内容未修改的旧副本清理清单；用户明确确认后才删除。用户级和第三方目录保持不变；不创建备份，也不重新安装项目技能。具体归属与失败规则见 [场景技能规格](agentic-software-development/arcorbit-scene-skills.md)。

新增或改变本地项目关联后重新检查全部关联 roots；纯查看切换、解除绑定和 task start 不触发迁移。task start 断言最近 ready 状态包含当前项目。没有本地项目时只声明全局资源 ready。

页面呈现 checking、ready、blocked，显示内置技能版本/数量和已清理、保留、失败的具体路径。失败允许重试；Codex executable、版本和认证仍按以下独立流程检查。没有项目技能安装或覆盖确认步骤。

### Codex CLI 安装与更新

Codex CLI 环境检查拥有独立安装状态：

- `checking`：重新执行 executable discovery 与版本探测；
- `missing`：所有可用 discovery source 均已完成且没有发现 executable，可由用户确认安装；
- `check-failed`：至少一个已启用 discovery source 未完成，当前结果不能证明 Codex 缺失；
- `installing`：正在调用当前平台的 OpenAI 官方 standalone installer；
- `installed`：当前 executable 已通过 `codex --version`；
- `updating`：正在通过已证明 owner 更新当前 active installation；
- `broken`：发现候选 executable，但版本探测失败；状态保留候选绝对路径和已识别来源，不显示为“未发现”；
- `install-failed`：下载、网络、权限、执行或安装后验证失败，可重试。

安装检查同时维护完整 installation inventory 与唯一 active binding。每个 installation 具有稳定 execution scope、绝对 executable、当前版本、安装来源、来源置信度和健康状态；Windows Native 与每个 WSL distro 是不同 execution scope，不能互相证明已安装。Setup 默认展示 active binding，并在存在多个健康 installation、PATH 遮蔽或来源冲突时展示其它候选和选择原因，不把任一健康候选静默丢弃。

安装来源至少包括 `standalone`、`npm`、`homebrew`、`configured`、`desktop-runtime` 和 `unknown-external`。npm 与 Homebrew 只有在对应包管理器能够证明 package/cask 记录且其 executable 与候选一致时才属于已证明来源；路径模式只能形成推断。ArcOrbit 自身成功完成的 standalone 安装记录可以证明后续管理权，既有 canonical standalone 路径没有记录时只形成可确认推断。来源无法证明不影响 Codex 继续使用，但禁止无确认地修改或卸载。

macOS、Linux 和 Windows 均使用 OpenAI 官方文档发布的 standalone installer。ArcOrbit 固定平台、下载来源和执行方式，负责下载/执行编排、进度、失败分类与重试；Renderer 只能提交安装、更新、取消或重新检查等结构化动作，不能提供 URL、路径、参数或 shell 命令。安装成功后无需重启 ArcOrbit，系统立即重新执行 executable discovery 和 `codex --version`。

Desktop discovery 不把 GUI 进程 `PATH` 当作用户环境的完整事实。它依次检查显式 executable 配置、当前会话最近一次成功路径、当前进程 `PATH`、standalone 与常见 Node/package-manager 目录，并在 macOS/Linux 没有发现候选时读取用户 login shell 的 `PATH`。任一可选目录或 shell source 失败都独立形成诊断，不得压掉其它已经可验证的候选；只有 discovery 完整且没有候选时才能显示 `missing`。

版本探测失败与 discovery 异常使用结构化状态和稳定错误码，不依赖展示文案推断。瞬时 executable 启动错误在进入 `broken` 前执行一次有界重试；失败后仍保留候选路径、来源和安全摘要。Setup 页面分别展示 executable、installation state、来源、版本与认证，不把“找到但不可运行”或“检查未完成”表达为“没有安装”。

发现 npm、Homebrew、自定义路径或其它外部安装时，ArcOrbit 显示当前来源并继续验证该 executable，不静默安装第二份 standalone Codex，也不修改系统或用户 `PATH`。已有健康 installation 时默认继续使用同一 owner；只有完全没有健康 installation 时才生成新安装建议。macOS、Linux、Windows Native 的默认建议为官方 standalone；npm 或 Homebrew 仅在对应工具已存在、版本要求满足、全局目标对当前用户可写且用户明确选择该维护方式时可用。ArcOrbit 不为了安装 Codex 自动安装 Node、npm、Homebrew 或 WSL。

每项安装建议包含 `method`、`suitability`、原因和阻塞条件。`recommended` 表示满足全部前置条件且不会覆盖健康 binding；`available` 表示可以选择但不是默认；`blocked` 表示平台、架构、权限、包管理器、执行域或冲突条件不成立。多安装冲突、来源不明或 WSL distro 未确定时不自动选择安装目标。

更新可用性是独立于 installation health 的咨询状态：`unknown`、`checking`、`up-to-date`、`update-available`、`ahead-of-channel`、`channel-mismatch`、`owner-conflict`、`check-failed` 或 `unsupported-owner`。当前版本始终来自 active binding 的绝对 executable；最新版本来自同一 owner 和同一 execution scope 的发布源。standalone 使用 OpenAI 官方 release channel，npm 使用证明该 installation 的 npm registry 配置，Homebrew 使用证明该 installation 的 brew/cask 元数据。网络或代理失败只能产生 `check-failed`，不能产生 `up-to-date`，也不阻止已经健康且已认证的 Codex 继续运行。

ArcOrbit 对成功的更新检查设置有界缓存，并提供绕过缓存的主动重新检查。执行更新前重新读取 active binding、owner、当前版本和活动任务，避免用陈旧检查结果修改 installation。更新动作只调用该 owner 的固定 adapter；来源已证明的 standalone、npm 和 Homebrew 分别使用自己的官方更新方式。configured、desktop-runtime、unknown external 或 owner-conflict 只展示外部维护说明或显式迁移入口。

任何安装或更新成功都必须满足 postcondition：目标命令结束、完整 discovery 重跑、目标绝对 executable 的 `codex --version` 成功、active binding 与用户选择一致，且当前版本达到本次目标。操作失败时保留此前健康 binding；更新了非 active installation、更新后仍被其它路径遮蔽或 owner 发生变化都属于可恢复冲突，不报告成功。

任何 Automation execution、Chat turn 或其它由 ArcOrbit 持有的 Codex 任务仍在运行时，更新和迁移保持禁用，并明确列出阻塞原因。安装、更新或迁移不接管现有 Codex 任务，不以杀死活动任务换取更新。

Codex snapshot 非 ready 时，Chat 或 Automation 的 Codex preflight 在没有活动 Setup mutation 的前提下执行 fresh executable、版本与认证检查，使用户在 ArcOrbit 外部完成安装或升级后无需依赖旧失败状态。活动 Setup mutation 期间 preflight 立即 fail closed；Codex fresh check 不重新扫描项目 skills，项目 skills 继续使用最近一次协调式 Setup Readiness 建立的受控 snapshot。

安装发现、版本查询、installer 下载、npm registry 和 Homebrew metadata 请求统一使用 ArcOrbit 当前代理配置。代理只进入受控 main-process operation environment，不进入 Renderer state；凭证在日志和错误中脱敏。代理不可用、DNS/连接失败和发布源响应异常分别形成稳定诊断，用户可以修复代理后重新检查而无需重启应用。

### Codex 显式认证

安装状态达到 `installed` 后，Setup Readiness 才进入独立认证检查。认证状态至少包括：

- `checking`：运行 `codex login status`；
- `selection-required`：尚未认证，等待用户选择凭证类型和必要的认证流程；
- `login-in-progress`：官方 Codex 登录子进程正在运行；
- `authenticated`：登录子进程结束后重新运行的 `codex login status` 退出码为零；
- `logged-out`：当前未认证；
- `expired`：此前已认证的状态在 fresh status probe 中失效；
- `login-failed`：取消、超时、进程失败或 status 复核失败，可重试或重新选择。

登录方式使用无默认值的两级选择：

1. 用户先显式选择 `ChatGPT 账号`、`API Key`，或仅在当前 Codex 明确支持时可见的 `企业 Access Token`；
2. 选择 ChatGPT 账号后，再显式选择 `系统浏览器登录` 或 `设备码登录`。

任何凭证类型和 ChatGPT 流程都不得预选，也不得根据操作系统、终端能力、环境变量或历史登录方式静默推断。“继续登录”在完成当前层级全部选择前保持禁用。设备码或企业 Access Token 只有在官方产品政策和本机 CLI capability 均明确支持时显示；不可用时解释原因，不自动改选其它方式。

ChatGPT 登录完全交给 `codex login` 或 `codex login --device-auth` 的官方流程和系统浏览器；ArcOrbit 不收集用户名、密码、验证码、MFA 或 SSO 凭证。API Key 与受支持的企业 Access Token 只通过 stdin 传给对应官方 login 命令，默认不持久化，不进入命令参数、日志、普通配置或共享 Renderer state。ArcOrbit 不读取、复制、上传或解析 Codex 凭证文件，不刷新或管理 Codex OAuth token。

浏览器与设备码登录都明确反馈等待、成功、取消、超时和失败。取消或超时先终止本次受控登录子进程，再 fresh-run `codex login status`；只有退出码确认认证成功才进入 `authenticated`。`codex logout` 使用独立显式动作，完成后同样重新检查。Codex 认证与 ArcOrbit/Workshop 账号始终是两个独立状态域，任一方登录或退出都不替另一方改变状态。

最终 Runtime `ready` 同时要求：Codex executable 可执行、`codex --version` 成功、`codex login status` 退出码为零，以及当前全局资源和项目级 Setup Readiness 其它检查全部通过。任何安装、更新、登录或退出结果都会按这个顺序自动重新验证；失败保留稳定错误分类、可复制的无敏感诊断和重试入口。

## 首次安装、场景能力与升级

所有内置 skill 连同脚本、references、共享资源安装到应用数据目录的统一 catalog。用户 ArcForge catalog 的其他来源保持独立，应用不覆盖或纳入 Engineering 管理。Engineering 只保存 ArcOrbit 内置 Skills 的场景选择；Chat 按内置默认值工作，Automation 保留官方核心，普通内置 Skill 可配置为直接发现、按需使用或停用。

升级准备并校验新版本后使用稳定身份恢复用户显式选择，旧 catalog 版本保留供已有运行引用。明确确认清单后才清理关联项目中来源可证明的 Arckit 副本；修改过或缺少可验证基线的受管理 Arckit 保留并报告；符合条件的清理不创建备份。第三方、归属不明和目录链接保留并报告。来源损坏或权限失败时阻止启动并显示具体恢复条件。

Runtime trusted ledger 仍从应用可信能力资源调用；Agent 从场景 binding 的绝对路径原生发现内置技能。Desktop adapter 配置内置 Skill 的进程 roots 和同名核心保护，不修改用户/项目 Codex 配置。原生用户和项目 Skills 按 Codex 既有可用性工作，不在 Engineering 显示或开关。

## 签名与发布授权

- `disabled` 允许生成明确标记为 unsigned 的内部测试 artifact。
- `auto` 在配置完整 secrets 时签名，否则生成 unsigned artifact 并在 provenance 中标记。
- `required` 在任何目标缺少所需签名或公证凭据时失败。
- macOS 签名和公证、Windows 代码签名分别使用 GitHub Environment secrets，不进入仓库或 artifact 日志。
- 创建 draft GitHub Release 是人工 dispatch 的显式选择；workflow 不自动发布正式 release，也不上传到应用商店。

## 失败与恢复

资源校验失败不安装 catalog、不清理项目；迁移失败记录具体路径，可幂等重试。配置 revision 冲突拒绝覆盖，内置来源消失或核心不可信时拒绝启动并要求返回 Setup Readiness 恢复。关闭内置 Skill 不删除 thread 历史，需要清空历史影响时新建 Chat。

平台构建失败保留日志和 artifacts，不产生该目标的可发布状态；签名、GitHub 权限和发布授权保持显式人工责任。

## 验收口径

- workflow 只能由人工 dispatch 激活，并在构建前验证 tag、版本、渠道和基线。
- 操作者可以独立选择平台，也可以一次选择全部受支持平台。
- 安装包在无 ArcForge 或 Arckit checkout 的用户环境中包含完整 provisioning 输入。
- 内置 skill 通过 ArcForge 确认安装到消费方 catalog，Automation 核心受保护，普通内置 Skill 可按场景配置；用户和项目 Skills 不进入 Engineering 的展示或操作。
- 首次启动和新增项目只生成清理清单：用户明确确认后，有可靠证据且未修改的 Arckit 才删除、无备份，修改/第三方/未知保留；重复检查幂等。
- 来源、选择、持久化、运行边界与实际 Codex 配置满足场景技能规格；项目目录无新增 skill 副本。
- macOS、Linux 和 Windows 缺少 Codex 时都能从 Setup Readiness 确认运行官方 standalone installer，安装后无需重启即可发现并验证 executable。
- proven standalone、npm 与 Homebrew Codex 可以从 ArcOrbit 通过各自 owner adapter 发起更新；活动 Codex 任务会阻止更新，inferred 或自定义安装不会被静默替换或制造第二份 PATH 候选。
- 未登录时没有任何认证选项被预选，当前层级未完成选择时不能继续；每个可见登录命令只在用户明确选择后执行。
- 浏览器登录、设备码登录、API Key 和明确支持的企业 Access Token 均在完成后以 `codex login status` 退出码复核；取消、超时、网络、权限和认证失败均可恢复或重试。
- ArcOrbit 不访问 Codex 凭证文件；API Key 和 Access Token 只进入受控子进程 stdin，不出现在命令参数、日志、错误、普通配置或共享 Renderer state。
- Setup Readiness 只有在 Codex executable、版本、认证和其它全局/项目检查全部通过时投影 `ready`；Codex 与 Workshop 登录状态保持独立。
- 构建产物可以追溯到 Runtime commit、Arckit payload commit、ArcForge provider 版本、manifest digest、构建 run 和 release intent tag。

## Desktop 外观

ArcOrbit 支持跟随系统、浅色、深色三种本机外观选项，默认跟随系统。用户在设置中选择后立即生效并独立保存；离线与未登录均可用，不依赖同步成功。偏好不上传、不跟随项目或账户变化，重启后恢复。保存失败恢复原选择并提供重试提示。

系统外观变化只影响跟随系统模式。主题切换不重载页面、不丢弃输入或选择、不打断运行；首个可见窗口内容采用当前有效主题。完整覆盖与例外见 visual/_library/brief.md，交互规则见 interaction/CONVENTIONS.md。验收覆盖三选项、系统变化、重启恢复、保存失败、主页面与浮层可读性、键盘焦点及亮色回归；规范与原型不能替代生产验证。
