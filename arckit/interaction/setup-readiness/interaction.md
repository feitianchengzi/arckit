# Setup Readiness 交互

## 页面定位

Setup Readiness 是 Desktop 的全局资源、Codex CLI 与项目能力准备页面。应用冷启动时检查全部已关联本地项目；运行期间只有新增或改变 Product Workspace 本地关联、用户主动恢复或“重新检查”才再次检查 Arckit skills。项目集全部、具体项目、Workset 或其它纯查看切换不进入本页，解除关联也不产生无意义检查。Codex 缺失、损坏、需要更新或尚未认证时，用户在本页完成官方 standalone 安装、更新和显式登录；它只在受信资源、Codex 或当前项目能力尚未达到可运行状态时成为主路由，当前检查通过后继续原路由。

页面不承担 GitHub 出包、ArcForge 治理编辑、Codex 凭证管理或 Runtime task 执行。它只展示当前安装包锁定的资源、Codex 安装/认证状态、目标目录、plan/drift、需要的确认和可恢复结果。

## 交互策略

### 核心任务

用户先恢复可执行且已认证的 Codex CLI，再确认应用将如何为明确关联的本地项目准备 ArcOrbit Agent 能力；全过程不预选登录方式、不泄露凭证、不静默替换外部 Codex，也不写入 Codex 用户级 skill 目录。同名 skill 只有在用户逐项选择、确认 recovery 备份和当前 bundled source 后才能兜底覆盖。

### 主路径

1. 应用启动后只从 ArcOrbit 当前数据身份读取 source store 与关系，并自动校验 distribution lock、trusted resources、ArcForge provider、skill payload，随后执行 Codex executable discovery、`codex --version` 和 `codex login status`；全局检查不写任意 Agent skill 目录，也不读取 Codex credential file，旧 Runtime 数据不参与检查或恢复。
2. Codex 缺失或损坏时，用户确认后由 main process 调用当前平台官方 standalone installer；安装或更新结束后页面自动重新发现 executable 和版本，不要求重启 ArcOrbit。
3. Codex 未认证时，页面先显示无默认值的凭证类型选择；选择 ChatGPT 后再显示无默认值的浏览器/设备码流程选择。完成当前层级选择前“继续登录”始终禁用。
4. 官方登录流程结束、取消、超时或失败后自动重新运行 `codex login status`；只有退出码确认已认证才继续后续全局检查。
5. 全局环境 ready 时显示短暂成功结果并继续 Login 或工作区；没有项目绑定时不把任意项目声明为 skills ready。Codex ready 不等于 Workshop 已登录，Workshop ready 也不等于 Codex 已认证。
6. 用户新增或改变 Product Workspace 本地绑定时，页面锁定该 Product Workspace 和规范化项目根，并对全部当前关联 roots 读取关系、项目适用性与 drift；解除绑定只更新关联，不进入检查。task start 只断言最近成功状态包含当前 task root，失败时返回本页等待用户主动重新检查，不在 start 路径扫描 skills。
7. 需要安装或升级 skills 时，页面默认展示来源、版本、项目身份、项目绝对写入目标、Codex 用户级写入边界、变更分类及数量；完整逐项计划作为可选明细，不承担确认门槛。
8. 用户阅读默认可见的写入与变更摘要后勾选确认框。确认框与“安装并继续”位于同一动作区域；未确认时该区域直接说明“请先确认上方写入目标与变更摘要”，确认后提示消失并立即启用主动作。
9. source upgrade 和用户级迁移先展示受管理缺失、provider 管理迁移、已有内容变化、未验证受管理目标、未受管理冲突和 catalog 同名版本冲突；每项同时显示 diagnostic code、skill、目标类型与路径、双方 digest、所有权依据和可用动作。
10. missing 与可证明的 managed migration 进入 fresh repair/upgrade plan；changed 或未验证的受管理目标由用户查看 diff 后选择备份并恢复或保留并退出；项目 skill、loader、共享资源或 catalog 的同名冲突具有唯一 bundled source 映射时，提供“备份并使用当前应用包覆盖所选同名 skill”。
11. 仅存在 `managed-stale` 时，页面不要求用户先展开安装计划；主区直接显示全部关系可证明的旧路径、逐路径选择和默认未选择的全选控件，底部固定显示“确认并清理所选”主动作。独立确认列出最终绝对路径与 confirmation digest。
12. 用户确认 fresh plan 或 cleanup confirmation 后，系统执行事务化 apply 或 removal，持续展示 source、项目目录、按需 catalog、项目 loader、关系和 discoverability 阶段。
13. 项目 post-drift、用户级 managed target 迁移检查与 Codex project discoverability probe 成功后，页面开放“继续”或“恢复任务”。

### 决策点

- 用户可以确认当前 fresh plan、返回检查详情，或退出应用；不存在跳过必须能力并启动 Runtime 的路径。
- Codex 安装、更新、认证和 skills apply 是不同确认域；一个动作的确认不能替另一个动作继续。
- 凭证类型、ChatGPT 登录流程和外部安装迁移都默认未选择；说明或推荐不产生选择，只有用户点击后的 typed action 可以继续。
- 当前 standalone Codex 可以一键更新；检测到 npm、Homebrew、自定义或未知外部安装时显示来源且不静默创建第二份，用户继续使用原安装或进入独立迁移确认。
- 任一 Automation execution、Chat turn 或其它 Codex 任务运行时，更新/迁移禁用并列出阻塞 owner；页面不提供“强制终止并更新”。
- 普通安装只以当前 plan 的确认框作为主动作启用条件。展开或收起完整安装明细不改变确认状态，也不作为不可见的附加门槛。
- 同名未受管理目录不能使用普通确认继续；missing managed target 和关系可证明的 provider-managed migration 不是本地内容冲突，可以进入明确的 repair/upgrade plan。
- changed managed target 与缺少最后应用摘要的未验证受管理目标不能静默覆盖。用户可以查看文件差异，选择“备份本地内容并恢复”形成新 plan，或保留当前内容并退出。
- 同名目标不能进入普通 apply。ArcOrbit 当前数据身份没有关系时不查询或迁移旧 Runtime 关系；provider 能以 fresh assessment 证明冲突目标处于允许边界且与当前 bundled source 一一对应时，页面提供独立的“备份并使用当前应用包覆盖所选同名 skill”确认。该动作先完整保存全部已选内容，再以当前应用包为权威来源写入并建立当前 ArcOrbit 关系；未选择项不变。
- 每个非 ready 状态至少提供一种与当前分类相符的处理手段。无法安全自动处理的错误提供明确的外部恢复条件、受影响路径和重新检查入口，不只留下无结果的重试。
- `managed-stale` 清理使用独立 confirmation，不和普通 apply 捆绑。`drifted` 页面直接展示可选路径和固定清理主动作，不把唯一恢复入口放入折叠详情。
- ArcOrbit 不向 `~/.codex/skills` 安装 bundled skill 或 `arcforge-on-demand` loader。source user-ambient 在关联项目中解释为默认项目常驻，source project-ambient 仍要求适用性判断；user-on-demand catalog 是非 Codex 发现的控制面，loader 只安装到当前项目。
- 没有明确 Product Workspace 绑定时不生成 skill apply plan；页面不允许手输任意目标目录。
- 项目集、具体项目、Workset 和其它纯查看范围只改变业务投影，不触发 Setup；用户需要即时复核时使用独立“重新检查”。
- 旧版受管理用户级 target 只有在关系所有权可证明、具体路径可见且用户确认 disposition 后才迁移或移除；用户保留冲突内容时，相关项目不能显示 scope-clean ready。
- 签名或系统信任问题只提供平台恢复入口，不把“忽略风险”伪装成 ready。

### 信息揭示

默认摘要显示当前 Runtime 版本、Arckit payload、ArcForge provider、Codex 安装状态、executable 来源、版本、独立认证状态、当前 Product Workspace、项目绝对路径、项目级 Codex 写入目标、Codex 用户级写入边界、Arckit skill 总数、项目默认常驻/项目适用/按需分类数量、项目级 ArcForge loader target 数、变更分类及数量和整体 readiness。Arckit skill 总数不包含 loader，user-on-demand catalog 不与项目常驻 skills 合并。完整明细补充逐 skill availability、文件 drift、plan digest 和关系记录位置，不重复承担关键写入边界的首次揭示。`drifted` 状态立即揭示旧用户级 managed-stale 绝对路径、选择状态和清理动作。

ChatGPT 密码、验证码、MFA/SSO、私钥、完整环境变量、Codex credential file、token 和 GitHub token 永不进入页面。API Key/Access Token 仅存在于当前一次性安全输入控件，不进入共享 Renderer state；提交后立即清空。签名信息只显示公开证书身份、签名状态和公证状态。

### 状态流

```text
checking
  -> codex-missing -> confirm-install -> installing -> codex-recheck
  -> codex-broken/install-failed -> repair/retry -> codex-recheck
  -> codex-installed -> auth-checking
auth-checking
  -> authenticated -> global-ready -> continue/needs-project
  -> selection-required -> choose-credential -> choose-chatgpt-flow/enter-one-time-secret -> login-in-progress
login-in-progress
  -> status-recheck -> authenticated/selection-required/login-failed
  -> cancel/timeout -> status-recheck
codex-installed
  -> confirm-update -> updating -> codex-recheck -> auth-checking
needs-project
  -> bind-project -> project-checking
project-checking
  -> ready -> continue/resume-task
  -> needs-install -> review-visible-summary -> confirm-plan -> applying -> ready
  -> drifted -> select-managed-stale -> confirm-removal -> removing -> recheck -> ready
  -> conflict -> inspect-diagnostics -> select-same-name-targets -> confirm-backup-and-overwrite -> recovering -> recheck
  -> blocked -> recover/retry -> checking
```

plan 展示后如果 source、target、policy、关系或内容 digest 改变，确认失效并返回 `checking`。apply 不接受旧 plan digest。

### Codex CLI 恢复

- `missing` 首屏说明不需要 Node、npm 或 Homebrew，显示当前平台与官方 standalone 来源；“安装 Codex CLI”只有在用户确认后执行。
- `broken` 显示候选 executable、来源和版本探测失败摘要，提供重新检查；仅在 standalone 所有权明确时提供修复/重装，外部来源提供所有权说明和显式迁移入口。
- `installed` 显示绝对 executable 的安全缩略、来源和版本。standalone 可更新；外部来源显示“由外部安装维护”，不伪装成已由 ArcOrbit 管理。
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

### 反馈机制

- 检查阶段逐项显示 pending、passed 或 failed，不用单一无限 loading 覆盖所有工作。
- plan 阶段将“将新增”“将更新”“不会处理”和“需单独确认清理”分开。
- plan 阶段在确认框旁持续显示当前启用条件；未确认时说明下一步，确认后即时启用主动作，不要求用户猜测禁用原因。
- drifted 阶段在首屏显示 managed-stale 路径、所有权说明、已选数量和固定清理按钮；默认不选择任何路径，部分选择和全选状态明确可见。
- plan 始终显示当前项目根、项目级 Codex target 和是否包含旧用户级 managed target 迁移；不会只显示抽象的 Codex 用户目标。
- upgrade assessment 将“受管理缺失”“provider 管理迁移”“本地内容变化”“未验证受管理目标”“未受管理冲突”和“catalog 同名版本冲突”分开，不把汇总计数当作用户修改证据。
- 执行阶段显示事务阶段和最近完成项，不展示 provider 原始 JSON。
- 完成结果明确区分 resources 校验、skills post-drift 和 Codex discoverability。
- 错误保留稳定 code、skill 名、目标类型、受影响路径、当前与 bundled digest 和恢复动作；详细诊断可以复制。已知 availability diagnostic 不得被投影成只有 `SETUP_FAILED` 和 `No target paths were reported` 的页面。

### 异常恢复

- bundled resource digest 失败：禁用 apply，提供重新安装当前应用的说明。
- Codex 不可用：提供内建的官方 standalone 安装、修复、显式登录或重新检测入口，保留 Arckit plan。
- 目标无权限：显示精确目录，用户修复权限后重新检查。
- provider apply 失败且回滚完整：显示未发生持久变更并允许重试。
- provider apply 回滚不完整：列出残留路径，禁止继续 Runtime，提供复制诊断。
- source upgrade 前发现受管理目标缺失：保留旧 source，将目标列入 repair/upgrade plan，确认后补齐并迁移关系。
- source upgrade 前发现关系可证明的 provider 路径、策略或 shared-loader 迁移：展示旧/新目标与所有权依据，纳入受确认的 upgrade plan。
- 发现旧版 ArcOrbit 关系管理的用户级 skill 或 loader：同时展示用户级旧目标、每个关联项目的新目标与备份/移除动作；只有事务成功且用户级 managed target 已按 disposition 收束后，项目进入 scope-clean ready。
- source upgrade 前发现已有内容变化或缺少最后应用摘要：保留旧 source，展示文件 diff；“备份本地内容并恢复”先保存可定位的备份，再生成恢复计划，“保留当前内容”不允许进入 Runtime。
- 发现任一同名 skill 冲突：普通 apply 保持禁用；当前 bundle 能为冲突的项目 skill、loader、共享资源或 catalog entry 提供确定 source 映射时，显示“备份并使用当前应用包覆盖所选同名 skill”，否则显示逐项目标与具体外部恢复条件并在用户处理后重新检查。
- App 离线：bundled payload 仍可安装；不把网络失败当作首次安装阻塞。

### 输入输出边界

输入包括 distribution lock 校验结果、provider inspect、source state、Product Workspace、本地项目根、project applicability assessment、plan、drift、Codex installation/auth snapshot、一次性 secret action 和用户确认。页面不接受用户手输任意 source、target、installer URL、executable、参数或 shell 命令。

输出包括 Codex install/update/migrate/login/logout/cancel/recheck typed action、被确认的 plan digest、typed upgrade disposition、逐目标备份/恢复确认、同名 skill 选择与 `backup-and-overwrite-selected` 确认、单独 cleanup confirmation、retry、打开平台恢复入口、复制诊断和继续路由。Codex process 只由 Electron main process 的 CodexSetupManager 编排；skill 文件写入只由 SkillProvisioningManager 编排，并由 ArcForge provider 执行 provisioning 事务。

## 页面状态

### 正在检查

- 页面进入后立即开始，不要求用户先点击。
- “继续”禁用；“退出”可用。
- 每个检查项有独立状态和失败摘要。
- 检查结束后原位进入 ready、plan、conflict 或 blocked。

### 安装计划

- 顶部显示 Runtime、Arckit payload、ArcForge provider 和 release intent tag。
- 顶部同时显示当前 Product Workspace、本地项目名称和规范化绝对路径；没有项目时只显示绑定入口，不显示 apply。
- 中部按项目默认常驻、项目适用、用户按需 catalog 与项目 loader 分组。
- 摘要先显示 Arckit payload 总数及各项目应用数量，ArcForge on-demand loader 作为项目级独立 target 显示，不计入 Arckit skill 数。
- 目标摘要显示新增、same、changed、managed-stale、uncertain 数量。
- 如果包含旧用户级关系，单列将迁移、将备份、保留不处理和需要独立确认移除的绝对路径。
- 项目绝对目标、Codex 用户级写入边界、变更分类及数量默认可见；“查看完整安装明细”只展开逐 skill、文件 drift、plan digest 和关系位置。
- “安装并继续”仅在当前 plan 的确认框选中时启用。未选中时，确认区显示“请先确认上方写入目标与变更摘要”；展开或收起完整明细不改变按钮状态。
- 用户勾选确认框后，页面在同一动作区域即时移除未满足提示并启用“安装并继续”；取消勾选立即恢复提示和禁用状态。
- 确认动作携带 plan digest；页面显示确认后的写入边界。

### 执行中

- 页面锁定返回和重复提交动作。
- 阶段顺序为 source staging、project target directories、catalog、project loader、relationship、user-target migration、post-drift、Codex probe。
- 应用退出请求先交给 main process 完成当前事务或回滚。
- 执行结果到达前不把 Runtime 标记 ready。

### Codex 安装与认证

- 安装/更新与登录各自显示独立状态，不将 `installed` 当成 `authenticated`。
- 所有安装、更新和认证动作在当前 operation 期间禁用重复提交；可取消阶段使用同一个 operation id。
- 登录选择没有默认卡片；键盘焦点从标题进入第一项，选中后通过状态区域播报“继续登录”已启用。
- secret 输入不进入草稿恢复；页面刷新、后退、取消、失败或提交都会清空。
- 自动重新验证依次显示 executable、version、login status 和其它 readiness，不用一个不透明 spinner 隐藏失败位置。

### 已准备完成

- 显示全部关键检查为 passed。
- 显示当前项目已安装的默认常驻数、适用项目 skill 数、catalog 中 user-on-demand 数和项目级 ArcForge loader target 数；四项之和不得作为 Arckit skill 总数。
- 完成结果明确显示“Codex 用户级写入：无”，并列出当前项目 target；旧用户级 managed targets 尚未收束时不显示完成。
- 首次启动由用户点击继续；普通启动可以在短暂停留后自动路由。
- 用户可以打开安装详情，但不能在完成页面直接删除 skills。

### Managed-stale 清理

- 页面标题直接说明发现 managed-stale 路径，主区在检查摘要之前显示关系可证明的旧用户级绝对路径。
- 每个路径使用独立复选框；默认全部未选择。“全选已证明路径”只改变当前可见集合，不能扩展 provider 证明边界。
- 底部固定动作显示“确认并清理所选（N）”；未选择路径、正在请求 removal plan 或正在删除时保持禁用。
- “查看完整计划与写入目标”保留为辅助详情，展示 source、项目 targets、plan digest 和 cleanup 依据，但不承载唯一清理入口。
- 独立 ConfirmationDialog 列出最终选择的每个绝对路径与 confirmation digest，并把取消放在确认动作之前。
- removal plan 或删除失败时，错误在当前页面持久显示；用户可以调整选择后重试，不丢失当前选择。
- 删除完成后重新检查，不复用旧 confirmation digest；仍有未选 stale 路径时继续停留在本状态。

### 冲突检查

- 受管理缺失、provider 管理迁移、changed/未验证受管理目标和同名 uncertain 目录分组显示；只有 managed-stale 时进入独立清理状态。
- missing 与可证明的 managed migration 提供“查看修复计划”；它们不显示为用户内容变化。
- changed 或未验证受管理目标提供查看文件 diff、“备份本地内容并恢复”和“保留当前内容并退出”。备份结果显示稳定引用和打开位置。
- 同名冲突逐项显示 diagnostic code、skill、目标类型与绝对路径、当前与 bundled digest；具有完整 source 映射时提供“选择兜底覆盖”。
- uncertain 目录不提供批量删除。
- 任何处理动作完成后重新生成 plan，不复用旧确认。

### 同名 skill 兜底覆盖

- 列表只包含 provider 证明处于允许边界且具有唯一 bundled source 的项目 skill、loader、共享资源或 catalog entry；默认全部未选，支持逐项选择和“全选可恢复项”。
- 固定主动作显示“备份并使用当前应用包覆盖所选同名 skill（N）”；未选择、正在 fresh assessment 或存在已变更 digest 时禁用。
- 独立 ConfirmationDialog 列出每项绝对目标、当前与 bundled digest、recovery root 和 assessment digest，默认焦点为取消。
- 执行时先显示“正在备份 N 项”，只有全部备份和 manifest 写入成功后才进入替换；随后显示 catalog、loader、关系和 post-drift 阶段。
- 成功页提供 recovery manifest 与打开备份位置；仍有未选择冲突时回到新列表并保持非 ready。
- 失败页逐项显示已备份、已回滚或残留状态。回滚完整可重新检查；回滚不完整只开放复制诊断和打开 recovery 位置。

### 阻塞恢复

- 显示稳定错误 code、失败阶段、影响范围和是否已完整回滚。
- 检查阶段尚未写入时显示“未写入”；只有 apply 已开始并执行恢复时才显示“回滚完整/不完整”。
- 可恢复错误提供“重新检查”；资源损坏提供“重新安装应用”。
- 缺少 Codex 登录进入本页无默认值的登录方式选择；官方流程结束后自动重新 probe。
- 回滚不完整只提供诊断和人工修复说明，不开放继续按钮。

## 导航

- 应用启动且全局 Setup Readiness 非 ready：进入本页，隐藏 Login 和 Automation Workspace 的主操作。
- Codex CLI 与认证未 ready：停留本页完成安装、更新或显式登录；不得进入 Chat 或启动 Automation。
- 全局 ready 且 Workshop 认证未知：进入 Login 会话恢复；Codex authentication 与 Workshop authentication 独立，全局 ready 不代表任意项目 skills ready。
- Workshop 会话有效：进入 Automation Workspace；新增或改变具体项目的本地关联时再检查全部关联 roots，纯查看切换不检查。
- 设置页的“Arckit 能力”入口可以再次打开本页的只读状态；选择修复后才进入可写 plan。
- Runtime task start 只消费已建立的 readiness；状态非 ready 或不包含对应项目 root 时返回本页并 fail closed，用户主动重新检查和修复后才能再次 start，不自动领取其它远端任务。

## 确认与安全

- 安装、修复、升级 apply 使用一次确认，摘要包含 source、profile、Product Workspace、项目绝对目标、旧用户级迁移、changed 和 plan digest。
- “备份并使用当前应用包覆盖所选同名 skill”使用独立确认和 fresh assessment digest，默认焦点为取消；确认失效、备份失败、写入失败或关系提交失败都不允许进入 Runtime。
- managed-stale 清理使用独立 ConfirmationDialog，列出每个绝对路径；触发按钮和选择列表在 drifted 页面首屏直接可见。
- 移除全部 Arckit managed skills 是设置页中的独立流程，不出现在首次安装主路径。
- 页面不提供“信任所有”“无备份覆盖全部额外目录”或“删除未知 skills”。
- 页面不提供自动登录方式、默认凭证类型、从环境推断方式、保存 API Key/Access Token、读取 Codex auth file 或强制中断活动任务后更新。

## 加载与可访问性

- 检查与 apply 使用文本阶段、进度和图形三重表达，不只依赖颜色。
- 所有错误、目录和 digest 可复制；长路径允许换行和完整查看。
- 动作顺序保持稳定，键盘焦点在状态切换后进入新状态标题。
- 安装确认框通过可感知说明关联当前未满足条件；键盘切换确认后，按钮状态和说明通过状态区域同步更新。
- source、target、policy、关系或内容 digest 改变时，页面清除旧确认、显示“安装计划已更新，请重新确认”，并把焦点移到更新后的可见摘要。
- ConfirmationDialog 的默认焦点是取消；破坏性 cleanup 明确逐路径说明。
- Codex 两级选择每级都从未选择状态开始；禁用按钮的原因与选择变化通过可感知状态区域播报。
- installer/auth progress 不只依赖原始终端输出；device code、错误与恢复动作可键盘访问，超时倒计时有文本说明。
