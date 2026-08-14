# Arckit Runtime 分发与安装

## 目标

Arckit Runtime 通过可追溯的桌面安装包交付。内部用户只需要取得并运行所选平台的安装包，即可获得 Runtime/Desktop、受信 ledger 能力、`$using-arckit` Agent 入口以及按可用性策略安装的 Arckit skills。

安装包是一次完整产品交付，不要求用户另行 clone Arckit 或 ArcForge 仓库，也不要求先安装 ArcForge Desktop 或 ArcForge CLI。Codex 登录、操作系统权限、外部任务源账号和签名信任仍属于对应平台的显式前置条件。

## 产品边界

- Runtime Kernel 继续负责持续 Agent thread、Case Loop、trusted ledger、任务源和恢复，不负责 skill 选择、skill 内容解释或安装目录扫描。
- Desktop 的 Setup Readiness 负责安装前置能力、skills provisioning、安装状态、修复和升级提示。
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

Desktop 在启动 Runtime task 前执行独立的 Setup Readiness，不把该流程塞入 Runtime `preflightRun` 或 Agent Loop。

Setup Readiness 检查：

- 安装包内 Runtime trusted resources 完整且 digest 与 distribution lock 一致；
- ArcForge Embedded Provider 版本和 digest 一致；
- Arckit skill payload 版本、来源 commit、manifest 和文件 digest 一致；
- Codex CLI 可启动且登录状态可恢复；
- Codex 用户级 skill 目标可解析；
- 当前 skills 安装关系和 drift 状态可读取。

状态至少包括：

- `ready`：受信资源有效且必须的 skills 可被 Codex 使用；
- `needs-install`：尚未建立 Arckit 安装关系；
- `needs-confirmation`：计划会写入用户目录或覆盖受管理副本；
- `drifted`：目标与当前 payload 不一致；
- `conflict`：同名目标包含未受当前关系管理的内容；
- `blocked`：资源损坏、Codex 不可用、权限不足或 provider 失败。

只有 `ready` 可以直接启动任务。其它状态进入安装、修复或人工恢复界面。

## 首次安装行为

首次启动从安装包内的离线 payload 建立应用管理的本地维护源，不从 GitHub 下载 `main`、`latest` 或未锁定资源。

Desktop 展示：

- 来源版本和 commit；
- 将要安装的 user-ambient skills；
- 将进入用户按需 catalog 的 skills；
- Codex 目标目录；
- 现有同名目录、changed、extra 和 managed-stale；
- 将写入的关系记录位置。

用户确认后，provider 执行同一份 fresh plan 对应的事务化 apply：

- `user-ambient` skills 写入 Codex 用户级 skill 目录；
- `user-on-demand` skills 写入 ArcForge catalog，并安装轻量 `arcforge-on-demand` loader；
- `project-ambient` skills 不在首次启动时写入任意项目；
- 共享 assets 随 ambient 目标按 manifest 安装；
- 应用关系记录当前来源、profile、availability、目标、managed names 和 source digest。

未受当前关系管理的同名目录不会被静默覆盖。普通 extra 只显示为 `uncertain` 或 `unrelated`；只有历史关系确认管理过的旧目标可以显示为 `managed-stale`，删除仍需单独确认。

## 项目级能力

用户添加项目后，Desktop 可以为该项目生成 project-ambient plan。每项 project applicability 由当前 Agent 或用户根据项目规格、源码和任务事实判断；`unsuitable` 或 `needs-input` 不进入 apply。

项目级 apply 与用户级首次安装使用同一 plan、drift、确认、事务和关系记录语义。Runtime 不预先为 Gap 绑定项目级 skill。

## 修复与升级

安装新版本 Arckit Runtime 时，Desktop 比较旧维护源、现有目标和新 payload：

1. 先确认现有目标相对旧维护源是否有本地 drift；
2. 有未确认 drift 时保留旧维护源并停止升级 apply；
3. 目标干净时原子切换应用管理的维护源；
4. 对新 payload 重新生成 plan 和 drift；
5. 用户确认后 apply，并更新同一关系记录；
6. 成功后保留足以回滚本次切换的上一份来源快照。

“修复”只把当前锁定 payload 重新应用到已确认的受管理目标。它不删除 unrelated 内容，不从远端获取新版本，也不改变 availability 策略。

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
- GitHub workflow 失败只保留构建日志和 artifacts；不会 fallback 到开发者本机出包。
- 缺少签名 secrets、GitHub 权限或 release 授权属于人工责任；代码、配置、测试或可复现构建失败属于 Agent 可继续修复的责任。

## 验收口径

- workflow 只能由人工 dispatch 激活，并在构建前验证 tag、版本、渠道和基线。
- 操作者可以独立选择平台，也可以一次选择全部受支持平台。
- 安装包在无 ArcForge 或 Arckit checkout 的用户环境中包含完整 provisioning 输入。
- Runtime trusted ledger 使用应用内受信资源；Codex Agent 使用目标目录中按策略安装的 skills；两者不会混用消费副本。
- 首次安装、drift、修复、升级和清理都展示目标并要求相应确认。
- 构建产物可以追溯到 Runtime commit、Arckit payload commit、ArcForge provider 版本、manifest digest、构建 run 和 release intent tag。
