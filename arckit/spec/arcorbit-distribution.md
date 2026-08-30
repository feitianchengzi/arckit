# ArcOrbit 分发与安装

## 目标

ArcOrbit 通过可追溯的桌面安装包交付。内部用户只需要取得并运行所选平台的安装包，并把 Workshop Project 关联到本地项目，即可获得 Runtime/Desktop、受信 ledger 能力、`$using-arckit` Agent 入口以及只在关联项目中生效的 Arckit skills。

安装包是一次完整产品交付，不要求用户另行 clone Arckit 或 ArcForge 仓库，也不要求先安装 ArcForge Desktop、ArcForge CLI、Node、npm 或 Homebrew。Codex CLI 缺失、版本不可验证或尚未登录时，Setup Readiness 提供官方 standalone 安装、更新和显式登录恢复流程；操作系统权限、外部任务源账号和签名信任仍属于对应平台的显式前置条件。

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

Desktop 只在应用冷启动时自动执行完整的协调式 Setup Readiness：先检查全局资源，再从 Desktop Store 读取全部已关联本地 Product Workspace 的规范化项目根，并检查这些项目相对于当前内置 payload 的 skills 安装关系与 drift。没有已关联本地项目时只执行全局检查。该启动范围不依赖关闭应用前界面显示“项目集全部”还是某个具体项目。运行期间新增或改变本地项目关联后立即再检查全部当前关联 roots；用户也可以从 Setup 恢复页主动“重新检查”。项目集、具体项目、Workset 或其它纯查看范围切换、解除关联和 Runtime task start 都不得自动重新扫描 skills；task start 只消费最近一次成功检查建立的 readiness，并对当前 task root 不在已验证 roots 中的情况 fail closed。这些检查都不进入 Runtime `preflightRun` 或 Agent Loop。

Setup Readiness 检查：

- 安装包内 Runtime trusted resources 完整且 digest 与 distribution lock 一致；
- ArcForge Embedded Provider 版本和 digest 一致；
- Arckit skill payload 版本、来源 commit、manifest 和文件 digest 一致；
- Codex CLI discovery 已完整结束，executable 来源可识别、可启动且 `codex --version` 成功；
- Codex 登录状态由 `codex login status` 的退出码确认；
- Product Workspace 对应的规范化本地项目根和 Codex 项目级 skill 目标可解析；
- 当前项目的 skills 安装关系、项目适用性判断和 drift 状态可读取；
- Codex 用户级 skill 目录不存在由 ArcOrbit 管理的 Arckit skill 或 `arcforge-on-demand` loader。

状态至少包括：

- `ready`：全局受信资源有效，且当前关联项目的必须 skills 可被 Codex 从项目目录发现；
- `needs-project`：全局资源有效，但当前操作尚未确定关联本地项目；
- `needs-install`：当前关联项目尚未建立 Arckit 安装关系；
- `needs-confirmation`：计划会写入项目目录、迁移历史受管理用户级副本或覆盖受管理副本；
- `drifted`：目标与当前 payload 不一致；
- `conflict`：项目 target、loader、共享资源或用户按需 catalog 中存在不能安全选定来源的同名内容；若 provider 能证明当前 bundle 与目标一一对应，必须同时提供带备份的显式覆盖恢复动作；
- `blocked`：资源损坏、权限不足、provider 失败，或 Codex 安装与认证恢复仍未成功。

应用启动时，只有全局资源和全部已关联本地项目都达到 `ready` 才开放 Automation；任一项目出现 `needs-install`、`drifted`、`conflict` 或 `blocked` 都进入安装、修复或人工恢复界面。没有本地项目时，全局检查通过只允许进入普通工作区，不替任意未来项目声明 skills ready。只有当前任务对应项目达到 `ready` 才可以启动该任务。

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

## 首次安装行为

首次启动从安装包内的离线 payload 建立应用管理的本地维护源，不从 GitHub 下载 `main`、`latest` 或未锁定资源，也不在 Codex 用户级目录安装 Arckit skills。用户把 Workshop Project 绑定到本地项目后，Desktop 才为该项目生成 provisioning plan。

Desktop 展示：

- 来源版本和 commit；
- 当前 Product Workspace、本地项目名称和规范化绝对路径；
- 将作为项目常驻能力安装的 source user-ambient skills；
- 将按项目适用性判断的 source project-ambient skills；
- 将进入用户按需 catalog 的 skills和只写入当前项目的按需 loader；
- 当前项目的 Codex 目标目录；
- 历史受管理用户级目标及其迁移或清理 disposition；
- 现有同名目录、changed、extra 和 managed-stale；
- 将写入的关系记录位置。

用户确认后，provider 执行同一份 fresh plan 对应的事务化 apply：

- source `user-ambient` 表示该能力对每个关联项目默认常驻，实际目标是 `<project-root>/.codex/skills/<skill>`；ArcOrbit 不把它写入 `~/.codex/skills`；
- source `project-ambient` 只在当前项目的 applicability assessment 为 `suitable` 或用户显式 override 后写入同一项目级目录；`unsuitable` 与 `needs-input` 不进入 apply；
- source `user-on-demand` 内容保存在 ArcForge 用户 catalog 作为非 Codex 发现的控制面资产，轻量 `arcforge-on-demand` loader 只写入当前项目的 `.codex/skills`，并把解析范围绑定到该项目；
- 共享 assets 只随当前项目内的消费 skills 写入项目级目标，不创建用户级共享副本；
- 应用关系以 ArcOrbit consumer identity 保存当前来源、profile、availability、项目根、目标、managed names、assessment 和 source digest；每个项目独立 drift、修复和升级。

ArcForge 用户 catalog 不属于 Codex skill 应用目标，也不使 catalog 中的内容成为用户级 ambient skill。未受当前关系管理的同名目录不会被静默覆盖；但用户明确选择目标、确认备份位置和当前 bundled source 后，可以进入同名 skill 兜底覆盖。普通 extra 只显示为 `uncertain` 或 `unrelated`；只有历史关系确认管理过的旧目标可以显示为 `managed-stale`，删除仍需单独确认。

## 项目级能力

Product Workspace 的本地绑定是项目级 plan 的唯一目标来源。Desktop 不依据当前进程 cwd、最近打开目录或 Runtime Gap 猜测目标；同一本地项目被多个 Workshop Project 引用时复用同一个规范化项目根和关系，同一来源版本不会重复安装。

每项 project applicability 由当前 Agent 或用户根据项目规格、源码和任务事实判断；`unsuitable` 或 `needs-input` 不进入 apply。项目级 apply 使用 fresh plan、drift、确认、事务和关系记录语义。冷启动、绑定新增或改变以及用户主动恢复触发 fresh 检查；payload 升级和关系 drift 在这些边界被发现。task preflight 只断言缓存状态和 task root 覆盖，不重新读取项目 skills；Runtime 不预先为 Gap 绑定项目级 skill。

解除 Product Workspace 绑定或移除本地项目不会静默删除项目目录中的受管理 skills。Desktop 保留关系并将其标为未关联，用户从设置中查看精确项目路径后才可单独确认移除。

## 修复与升级

安装新版本 ArcOrbit 时，Desktop 比较旧维护源、现有目标和新 payload：

1. 先依据旧关系中的实际目标、最后应用摘要和旧维护源检查现有目标，不使用新 provider 重新计算的目标位置冒充旧目标事实；
2. 把差异分类为可修复的受管理缺失、provider 管理的路径/策略/loader 迁移、已有内容变化、未受管理同名冲突和 catalog 同名版本冲突；
3. 受管理缺失和能够由关系与摘要证明的 provider 迁移进入待确认 upgrade plan，不作为用户内容冲突阻断；
4. 已有内容变化在旧 source 保持 current 时展示逐目标/文件差异，用户选择“备份本地内容并恢复受管理副本”或保留当前内容并退出；
5. 同名冲突不进入普通 apply；provider 能证明目标位于允许边界且与当前 bundled source 一一对应时，页面提供“备份并使用当前应用包覆盖所选同名 skill”，否则用户在外部消除冲突后重新检查；
6. 处置完成后重新生成 plan，对新 payload 执行 source switch、受管理目标 apply、关系迁移和 post-drift；
7. 成功后保留足以回滚本次切换的上一份来源快照和本轮用户内容备份引用。

从旧版本的用户级 provisioning 迁移时，旧关系中能够证明由 ArcOrbit 管理的 `~/.codex/skills` 目标和 loader 进入 `managed-migration`，与至少一个关联项目的项目级安装在同一受确认事务中迁移。内容与最后应用摘要不同或摘要缺失时先备份并要求逐目标 disposition；用户选择保留时，ArcOrbit 不删除该目录，也不把相关项目声明为 scope-clean ready。`uncertain`、`unrelated` 或没有关系所有权证据的用户级目录永不自动删除。用户级 catalog 可以保留，因为它不是 Codex 发现目录；旧用户级 loader 必须迁移或经独立确认移除。

关系记录保存每个受管理目标最后一次成功 apply 的内容摘要、有效目标、availability/policy、provider 能力版本和 shared-loader 所有权证据。旧关系缺少完成安全分类所需的摘要时，现有内容差异进入“未验证的受管理目标”，不得静默覆盖；用户仍可查看差异并明确选择备份后恢复。检查阶段尚未发生写入时，结果显示“未写入”，不显示成 apply 回滚。

“修复”只把当前锁定 payload 重新应用到已确认的项目级受管理目标。它不删除 unrelated 内容，不从远端获取新版本，也不修改维护源的 availability 推荐；ArcOrbit 的项目目标覆盖属于产品调用策略。

### 同名 skill 兜底覆盖

同名 skill 冲突是可恢复状态，不得只压缩为无目标、无动作的 `SETUP_FAILED`。plan 在进入 drift 前保留项目 skill、项目 loader、共享资源和 catalog entry 的 typed diagnostic；页面逐项显示稳定 code、skill 名、目标类型、绝对路径、当前与 bundled digest、阻塞原因和允许动作。

只有 provider fresh assessment 同时证明目标属于允许的项目根或 ArcForge catalog、skill 名安全、目标不是文件系统根或越界路径、且存在唯一同名 bundled source 时，才允许兜底覆盖。页面默认不选择任何项，允许逐项或全选可恢复项；确认摘要列出 skill、绝对目标、当前与 bundled digest 和备份位置。

该动作独立于普通安装、受管理恢复和 `managed-stale` 删除。确认携带 fresh assessment digest；执行前再次核对目标、当前内容和 bundled source。provider 必须在第一次替换前，把全部已选目标备份到仅当前用户可访问的 recovery area 并写入 manifest。catalog 版本冲突中的确认表示用户明确选择当前应用包内来源；旧内容保留在 recovery area，不删除 catalog index 中其它来源声明。

任一备份、替换、catalog、loader 或关系提交失败时，整个选择集合回滚到确认前状态；回滚不完整时列出备份 manifest 与残留路径。未选择项和无关内容始终不变；仍有未处置冲突时保持非 ready。权限、只读文件系统、越界目标或 source 映射不唯一时保留逐项诊断，并给出精确外部恢复条件和“重新检查”，不得显示成只能重装应用的资源损坏。

卸载桌面应用不会静默删除用户级或项目级 skills。用户需要先在 Desktop 中选择“移除受 Arckit 管理的 skills”，查看精确目录并单独确认；应用关系以外的目录不在清理范围内。

## 签名与发布授权

- `disabled` 允许生成明确标记为 unsigned 的内部测试 artifact。
- `auto` 在配置完整 secrets 时签名，否则生成 unsigned artifact 并在 provenance 中标记。
- `required` 在任何目标缺少所需签名或公证凭据时失败。
- macOS 签名和公证、Windows 代码签名分别使用 GitHub Environment secrets，不进入仓库或 artifact 日志。
- 创建 draft GitHub Release 是人工 dispatch 的显式选择；workflow 不自动发布正式 release，也不上传到应用商店。

## 失败与恢复

- 任一平台矩阵任务失败不产出该目标的可发布状态。
- checksum、lock、payload 或 provider 校验失败时，应用不得进入 skills apply。
- apply 失败时 provider 回滚目标目录、catalog 和关系记录；回滚不完整时显示具体残留路径并停止 Runtime task。
- 同名兜底覆盖失败时保留 recovery manifest、备份位置和逐目标回滚结果，不把失败重新折叠成无目标的 setup 错误。
- GitHub workflow 失败只保留构建日志和 artifacts；不会 fallback 到开发者本机出包。
- 缺少签名 secrets、GitHub 权限或 release 授权属于人工责任；代码、配置、测试或可复现构建失败属于 Agent 可继续修复的责任。

## 验收口径

- workflow 只能由人工 dispatch 激活，并在构建前验证 tag、版本、渠道和基线。
- 操作者可以独立选择平台，也可以一次选择全部受支持平台。
- 安装包在无 ArcForge 或 Arckit checkout 的用户环境中包含完整 provisioning 输入。
- Runtime trusted ledger 使用应用内受信资源；Codex Agent 只使用关联项目 `.codex/skills` 中按策略安装的 skills 和 loader；两者不会混用消费副本，ArcOrbit 不创建 Codex 用户级副本。
- 全局 Setup Readiness 不会在没有项目绑定时写入 Agent 目录；每个关联项目都有独立 plan、关系、drift 和 ready 结果。
- 应用启动会对 Desktop Store 中全部已关联本地项目执行 fresh project skill drift 检查；关闭前选择项目集全部或具体项目不会改变检查范围，任一未 ready 项目都会阻止 Automation 启动。
- 新增或改变本地项目关联会再次检查全部当前关联 roots；纯查看范围切换、解除关联和 task start 不重新扫描，主动“重新检查”入口保持可用。
- 旧版受管理用户级 targets 只在所有权、目标、备份和 disposition 可见并经确认后迁移；未知或无关用户目录保持不变。
- 首次安装、drift、修复、升级和清理都展示目标并要求相应确认。
- source upgrade 能区分受管理缺失、provider 管理迁移、用户内容变化和未受管理冲突；每个非 ready 状态都提供与其风险相符的可执行恢复动作或明确的外部恢复条件。
- 当前 catalog 中同名、无有效 SemVer 且内容与 bundle 不同的 skill 显示 `CATALOG_VERSION_CONFLICT`、目标、双方 digest 和“备份并使用当前应用包覆盖所选同名 skill”，不会只显示 `SETUP_FAILED` 或 `No target paths were reported`。
- 项目 skill、项目 loader、共享资源和 catalog entry 的同名冲突都遵守 fresh digest、默认未选、逐项确认、先完整备份再替换、失败全量回滚和未选目标不变；无法证明安全目标或唯一 bundled source 时只提供精确外部恢复条件。
- 受管理内容变化只有在逐目标差异可见且用户明确选择备份或放弃本地内容后才能恢复；missing 和可证明的 managed migration 不得被错误标记为用户修改。
- macOS、Linux 和 Windows 缺少 Codex 时都能从 Setup Readiness 确认运行官方 standalone installer，安装后无需重启即可发现并验证 executable。
- proven standalone、npm 与 Homebrew Codex 可以从 ArcOrbit 通过各自 owner adapter 发起更新；活动 Codex 任务会阻止更新，inferred 或自定义安装不会被静默替换或制造第二份 PATH 候选。
- 未登录时没有任何认证选项被预选，当前层级未完成选择时不能继续；每个可见登录命令只在用户明确选择后执行。
- 浏览器登录、设备码登录、API Key 和明确支持的企业 Access Token 均在完成后以 `codex login status` 退出码复核；取消、超时、网络、权限和认证失败均可恢复或重试。
- ArcOrbit 不访问 Codex 凭证文件；API Key 和 Access Token 只进入受控子进程 stdin，不出现在命令参数、日志、错误、普通配置或共享 Renderer state。
- Setup Readiness 只有在 Codex executable、版本、认证和其它全局/项目检查全部通过时投影 `ready`；Codex 与 Workshop 登录状态保持独立。
- 构建产物可以追溯到 Runtime commit、Arckit payload commit、ArcForge provider 版本、manifest digest、构建 run 和 release intent tag。
