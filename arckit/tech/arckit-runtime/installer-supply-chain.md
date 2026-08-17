# Arckit Runtime 安装包供应链

## 定位

Arckit Runtime 安装包供应链把仓库内 Runtime、trusted ledger capabilities、Arckit skills 和 ArcForge provisioning engine 组合成一份可验证的 Electron 分发物。供应链属于 Desktop setup 与 delivery plane，不进入 Runtime Kernel 的语义或调度路径。

Git branch 决定代码生命周期，release intent tag 决定不可变版本基线，人工 `workflow_dispatch` 决定何时真正构建以及构建哪些目标。workflow 不监听 push 自动出包，不创建或移动 tag。

## 组件边界

```text
Arckit Git tag
  -> Runtime/Desktop source
  -> repository trusted capabilities
  -> Arckit skill source snapshot + availability manifest

ArcForge GitHub Release
  -> versioned embedded-provider artifact

manual GitHub workflow_dispatch
  -> validate tag/channel/baseline/version
  -> resolve and verify ArcForge provider
  -> create distribution lock
  -> build selected Electron targets
  -> checksums + provenance + Actions artifacts
  -> optional draft GitHub Release

installed Desktop
  -> Setup Readiness / SkillProvisioningManager
  -> ArcForge Embedded Provider
  -> Codex user/project targets + ~/.arcforge catalog/relations

Runtime Kernel
  -> packaged trusted entrypoints
  -> $using-arckit natural trigger
  -> no installed-skill tree inspection
```

## 三类受版本控制的资源

### Runtime trusted resources

Runtime 自己调用的 capability manifests 和 ledger scripts 随应用打包，来源包括：

- `entry/skills/using-arckit/arckit.capability.json`；
- `entry/skills/arckit-development-ledger/arckit.capability.json`；
- ledger manifest 声明的 trusted scripts 与 schema/reference 依赖；
- `runtime/arckit-runtime/config/capability-policy.json`。

packaged resource root 由应用启动时显式提供给 capability registry。registry 不再依赖源码仓库中 `src` 上方固定层级推断生产资源位置。项目仓库 capability 仍可作为 project source 被扫描，但同一受信 Runtime capability 只允许解析到应用内 repository source。

### Arckit skill payload

skill payload 是 Arckit tag 对应 commit 的只读快照，包含：

- `arcforge.skill-project.json`；
- 被默认 profile 选中的所有 skill 目录；
- profile 引用的共享 assets；
- payload manifest、逐目录 digest 和 source commit。

payload 不是已安装目录。Desktop 首次运行把它复制到应用数据目录的版本化 source store，再由 ArcForge provider 应用到消费目标。

### ArcForge Embedded Provider

ArcForge provider 是 ArcForge 仓库独立产出的稳定 GitHub Release artifact。它包含：

- ESM provider entrypoint；
- provider 使用的 `core` 与 `shared` modules；
- `arcforge-on-demand` loader source；
- package manifest、API schema/version 和 checksums；
- ArcForge license。

它不包含 ArcForge Desktop UI，不安装 shell shim，不修改 PATH，不启动外部 ArcForge 进程，也不把 ArcForge governance skills 加入 Codex ambient skills。

### 语义复用与能力边界

ArcForge Core 是 skill source 发现与标准化、availability plan、事务化 apply、drift、catalog 和 relation 的唯一语义实现。ArcForge CLI、ArcForge Desktop 与 Embedded Provider 是同一 Core 上的不同适配面；它们不维护平行的扫描、目标解析、复制或漂移规则。

各适配面允许存在以下差异：

- ArcForge CLI/Desktop 可以暴露治理、维护、发布准备和交互能力，Embedded Provider 只暴露 Runtime provisioning 所需的稳定 JSON API；
- Embedded Provider 作为独立不可变 artifact 发布，Runtime 可以固定到落后于 ArcForge 主干的 provider 版本；
- provider package 只携带其入口以及入口实际依赖的 `core`、`shared` 和 loader 资源。

已经由 provider capability 声明的重叠能力必须与 Core 保持相同语义。新增能力先进入 Core；只有 Runtime 消费该能力时，provider 才增加输入转换、结果投影和 capability 声明。provider 不复制 Core 算法，Runtime 不复制 provider 或 Core 的安装算法。

Arckit payload manifest 是 Runtime 供应链契约，不进入通用 ArcForge 配置。Embedded Provider 负责把 manifest 中的显式资源声明转换为 Core 的 source 输入；Core 将自动发现和显式声明合并为 canonical source snapshot，并在同一 availability plan 中产出 skills、shared assets、loader 与各自目标。apply 与 drift 只消费该 fresh plan，不重新推导 shared asset 目标。

Runtime 对 manifest、provider plan 和 drift 做完整性交叉校验，并在 provider capability 缺失或声明资源未进入 plan 时 fail closed。Renderer 只投影 provider 返回的 shared asset destinations，不根据用户 home 或 Agent 目录规则构造 fallback 目标。

## Embedded Provider API

provider 暴露稳定的版本化入口，输入和输出只使用 JSON-compatible values：

- `inspectProvider()`：返回 API version、provider version、build commit 和 loader digest；
- `createProvisioningPlan(options)`：解析 source/profile/availability/targets/project assessments、显式 shared assets 和历史关系；
- `driftProvisioningPlan(options)`：对 fresh plan 比较目录、catalog、policy 和 target extras；
- `applyProvisioningPlan(options)`：要求 fresh plan digest 与 `confirm=true`，事务化写入目标、catalog 和关系；
- `listProvisioningRelations(options)`：读取指定 source/consumer 的已保存关系；
- `removeManagedProvisioning(options)`：只接受显式 managed paths 与 confirmation digest。

所有入口显式接收：

- `sourceRoot`：应用管理的本地维护源；
- `consumerRoot`：关系记录归属 root；
- `stateRoot`：ArcForge 状态根，默认由 Desktop 解析为用户标准 ArcForge home；
- `homeDir`：Agent 用户级目标与 catalog 的用户 home；
- `agentTargetIds` 和可选 `projectTargetDirs`；
- profile、skills selection、project assessments 和 invocation overrides；
- `cacheDir`：只在明确允许远程来源时使用，安装包默认离线来源不使用远程 cache。

provider 不依赖进程级 `ARCFORGE_HOME` 才能隔离状态。CLI 可以继续用环境变量兼容入口，但 embedded API 以显式 `stateRoot` 为准。

plan 包含稳定 digest，digest 覆盖 source identity、source policy、selected skills、shared assets、content digests、目标、历史 managed set、loader 和 project assessments。shared asset plan item 包含 source-relative identity、内容 digest 和 Core 解析出的 destinations。apply 重新扫描 source 与目标；fresh digest 不一致时拒绝写入。

## 应用资源布局

Electron bundle 使用以下逻辑布局：

```text
Resources/
  arckit-runtime/
    trusted-capabilities/
    schemas/
  provisioning/
    arcforge-provider/
    arckit-skills/
    distribution-lock.json
    checksums.txt
```

需要由 Node.js 以真实文件路径读取或执行的资源放入 `extraResources` 或明确的 `asarUnpack` 范围。ledger scripts、provider modules 和 source payload 不依赖 asar 虚拟目录的可执行语义。

应用数据目录使用：

```text
<Electron userData>/runtime/
<Electron userData>/skill-sources/arckit/current/
<Electron userData>/skill-sources/arckit/versions/<payload-digest>/
<Electron userData>/skill-sources/arckit/previous/<payload-digest>/
```

`current` 是 applied relation 的稳定 source root。升级先对旧 `current` 运行 drift；只有目标干净或用户处理完冲突后，才把 staging source 原子替换为新的 `current`。Windows 不依赖 symlink。

ArcForge catalog 和共享关系状态继续使用用户标准 ArcForge home，使 standalone ArcForge 能读取同一治理事实。Desktop 通过显式 `stateRoot` 调用 provider，不修改进程全局环境。

## Distribution Lock

每个安装包包含 `arckit-runtime-distribution/v1` lock，至少记录：

- Runtime product version、package channel、platform 和 architecture；
- Arckit repository、release intent tag、commit 和 source tree digest；
- Runtime trusted resource digest；
- skill payload profile、availability manifest digest 和 payload digest；
- ArcForge provider API version、release version、commit、artifact name 和 SHA-256；
- Electron、Node.js 和 electron-builder versions；
- GitHub repository、workflow name、run id、run attempt 和 source ref；
- signing mode、签名结果和 notarization result，不包含凭据；
- expected artifact naming pattern 和 external-attestation contract。embedded lock 不能在不形成循环哈希的情况下包含最终 installer SHA-256。

package 完成后，`arckit-runtime-distribution-attestation/v1` 把最终 artifact filename、SHA-256 与所嵌入 lock 的 digest 绑定。installer 下载校验使用外部 attestation，运行时资源校验继续使用 embedded lock 和资源 checksums。

Runtime product version 来自 release intent tag：

- `tf/v1.2.3-b4` 的 product version 是 `1.2.3`，channel/build label 是 `tf/b4`；
- `beta/v1.2.3-rc2` 的 product version 是 `1.2.3`，channel/build label 是 `beta/rc2`；
- `appstore/v1.2.3` 的 product version 是 `1.2.3`，channel 是 `appstore`。

Electron package 的 SemVer prerelease metadata 与 artifact label 表达 channel/build；正式 product version 不由 workflow 自增，也不从历史 GitHub Release 猜测。

## 本地验证构建

本地验证入口由 Runtime 仓库中的 Node.js 脚本提供，并要求 ArcForge 与 Arckit 是可读取的本地 checkout。入口在两个仓库各自的依赖已经安装后，使用同一组受控构建原语完成 ArcForge type check、embedded provider test、provider package、Runtime tests、distribution resource assembly、payload smoke 和当前主机 Electron package。脚本不安装依赖、不访问 release registry，也不修改 release branch 或 tag。

本地 provider 使用 `local.<build-id>` SemVer prerelease、`local/arckit-runtime-<build-id>` release ref、当前 Git commit 和 dirty marker。Runtime lock 使用 `local/v<product-version>-<build-id>` source ref、`channel: local`、`repository: local/*`、`workflow: local-build` 和 `signing: disabled`。`prepare-distribution` 只在本地入口接受这一 metadata lane；受治理的 release-trigger validator 仍只接受既有 `tf/*`、`beta/*` 和 `appstore/*` tag。

本地入口保留 provider manifest、capability、archive SHA-256、safe extraction、payload checksums、trusted capability digest 与 smoke convergence 校验。默认结果是当前主机架构的 unsigned installer；resources-only 模式在完成相同资源组装和 smoke 后停止，使开发态 Desktop 直接读取 `dist-package/resources`。本地产物只用于开发验证，不具备发布授权、签名、公证、GitHub Environment 或 draft release 证据，也不作为 governed release artifact 被上传或引用。

## ArcForge provider 供应链

ArcForge 仓库提供人工 workflow：

1. 操作者选择已存在且合规的 release intent tag；
2. workflow 校验 package version、tag、commit 和 branch baseline；
3. 执行 type check 与 provider tests；
4. 构建 provider package；
5. 生成 `.tgz`、API manifest 和 SHA-256；
6. 上传 Actions artifact；
7. 仅在操作者显式选择时创建 draft GitHub Release 或向既有 draft 添加 assets。

ArcForge provider release 使用 immutable version asset。Arckit workflow 输入明确的 provider release tag 和 expected SHA-256；禁止下载 `latest`。跨私有仓库读取需要专用最小权限 secret，缺失时属于人工配置责任。

provider manifest 同时声明 API version 与细粒度 capabilities。API version 约束入口兼容性，capability 约束 Runtime 实际依赖的行为；Runtime 构建只接受满足 required capabilities 的精确 artifact。ArcForge 主干新增但 Runtime 尚未使用的能力不要求立即进入 provider，Runtime 采用能力时必须先发布包含该 capability 的 provider，再更新安装包锁定版本。

## Arckit Runtime GitHub workflow

workflow 只配置 `workflow_dispatch`，输入包括：

- `release_tag`：必须是已存在的 `tf/*`、`beta/*` 或 `appstore/*`；
- `target`：`macos-arm64`、`macos-x64`、`windows-x64`、`linux-x64` 或 `all`；
- `signing`：`disabled`、`auto` 或 `required`；
- `publish`：`artifact-only` 或 `draft-release`；
- `arcforge_release`：精确 ArcForge provider release tag；
- `arcforge_sha256`：预期 provider artifact digest；
- `allow_main_baseline`：仅用于明确接受 beta 从 main 基线出包的例外。

workflow 首先在 Linux validation job 完成：

- fetch 完整分支与 tag history；
- 确认 `release_tag` 指向 checkout commit；
- 解析并验证渠道和 product version；
- 检查同版本 release 和更高版本稳定线；
- 校验 `package.json` 与应用 manifest 的版本契约；
- 下载并校验 ArcForge provider；
- 执行 Runtime tests 和 package-input validation；
- 生成不含平台 artifact digest 的 build lock seed。

validation 成功后才展开所选 matrix。每个 matrix job 从相同 tag checkout、下载同一 provider artifact、验证同一 digest、组装 payload、构建对应安装包并生成 target lock/checksum。`all` 只展开受支持的四个目标，不添加未声明平台。

provider artifact 的 bytes 通过 SHA-256 和 release manifest 校验后写入唯一的临时 extraction root；列表校验、类型校验和解压都以该目录作为 tar 子进程 `cwd`，并只把 archive basename 作为归档参数。tar 不接收 archive 或 extraction destination 的绝对路径，因此 POSIX 与 Windows 保持同一本地文件语义，Windows 盘符不会被解释为远程 `host:archive` 地址或无效的 MSYS 目录。

workflow 不创建 release branch、tag 或 commit，不修改源仓库。`draft-release` 将各 target checksum 与对应安装包重新验算后合并为唯一且确定排序的 `checksums.txt`，并在写入 GitHub Release 前拒绝任何重复 asset basename；它只创建或更新与 `release_tag` 对应的 draft，重跑使用完整唯一资产集覆盖已有 draft assets。`tf` 和 `beta` draft 标记为 prerelease，`appstore` draft 不自动 publish。

## 签名边界

GitHub Environments 分离 internal、beta 和 appstore secrets。matrix job 只注入当前目标需要的 secrets：

- macOS Developer ID、以 CI secret 注入的 base64 `.p8` notarization API key，或 Apple ID app-specific password；
- Windows code-signing certificate 或受支持的远程 signing provider credentials。

workflow 根据渠道选择 `internal`、`beta` 或 `appstore` GitHub Environment，并只在 Windows matrix 中注入 electron-builder 的 `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD`。`disabled` 不使用 signing secrets。`auto` 只有在构建后平台验签通过时才记录 `signed`；`required` 在构建前检查目标所需配置，并在签名或公证结果缺失时失败。Linux checksum 不被称为代码签名。

日志、lock 和 provenance 只保存 secret 名称是否配置、签名结果、证书公开标识和公证结果，不保存 secret value、私钥路径或完整环境。

## Desktop Setup Readiness

Desktop 新增独立 `SkillProvisioningManager`，由 Electron main process 持有文件系统写权限。Renderer 只通过窄 IPC 请求 status、plan、apply、repair 和 remove；preload 不暴露任意路径执行或 provider module handle。

Manager 启动顺序：

1. 校验 distribution lock 与 bundled resources；
2. 把 payload staging 到 source store；
3. 由 ArcForge Core/provider 依据旧 relation 的已记录目标、最后应用摘要、旧 source 和 provider capability 生成 typed source-upgrade assessment；
4. assessment 将目标区分为 `managed-repair`、`managed-migration`、`local-content-conflict`、`unverified-managed` 和 `unmanaged-conflict`，并携带旧/新目标、摘要、文件差异、所有权依据和允许动作；
5. 生成与 assessment 一致的新 plan 和 drift，把纯数据结果交给 Renderer；
6. 接收包含 assessment digest、plan digest 和逐类 disposition 的用户确认；
7. 调用 provider fresh-read，在同一事务中执行 source switch、受管理目标 apply、catalog/loader/关系迁移和已确认备份；
8. 重新 assessment/drift 并做 Codex discoverability probe；
9. 状态为 `ready` 后开放 Runtime task start。

ArcForge Core 是 upgrade classification 与迁移语义的唯一实现。Embedded Provider 暴露 capability-gated typed assessment/apply；Runtime 不从 `missing`/`changed` 计数、路径形态或 skill 名称推断分类，也不复制 catalog 或 loader 迁移规则。provider artifact 不具备 Runtime 要求的 source-upgrade reconciliation capability 时，构建和 Setup Readiness 都 fail closed。

关系记录为每个受管理 destination 保存最后成功 apply 的内容摘要、有效 mode/policy、source/provider identity 和 shared-loader 所有权证据。旧记录没有摘要时，Core 只能把仍存在且内容不同的目标标记为 `unverified-managed`；它不能把这种状态自动提升为安全迁移。关系证明的 missing destination 没有可被覆盖的本地内容，归类为 `managed-repair`。provider 造成的目标或策略变化只有在旧目标与最后应用摘要一致、目标缺失，或 shared loader 的受管理更新证据成立时才归类为 `managed-migration`。

`local-content-conflict` 和 `unverified-managed` 的写入动作要求逐目标 disposition。备份并恢复在 source switch 前把现有目录事务化移动到应用数据中的不可变 recovery area，记录内容摘要和可展示引用，再把恢复动作纳入同一 fresh plan；任一步失败恢复原目标、source、catalog 和 relation。`unmanaged-conflict` 永不进入 provider replacement set。检查阶段没有写入时，snapshot 使用 `write_state: not_started`，Renderer 不把它投影为 rollback。

Manager 不修改现有 `preflightRun` 的 kernel 语义。Automation Coordinator 在 start 前组合 Setup Readiness 和 Runtime preflight 两个独立结果，避免 Runtime 通过文件扫描推断 Agent native skill discovery。

Codex discoverability 解析一个经过 `--version` 验证的绝对 executable，而不假设 Desktop GUI 进程继承交互式 shell 的 `PATH`。解析顺序覆盖显式配置、当前 `PATH`、常见用户级安装目录以及 NVM/FNM 的版本目录；Node 版本管理器中的 CLI 同时携带其 sibling `bin` 目录作为子进程 `PATH` 前缀，保证 `#!/usr/bin/env node` 启动器可执行。解析失败保持 Setup blocked，不修改系统或用户 `PATH`。

Windows 的 npm 安装通常暴露 `.cmd`/`.bat` command shim。版本探测不得把这类文件直接交给 `execFile`，也不得用拼接用户路径的 shell 字符串；必须通过固定 PowerShell 脚本启动，并仅用结构化环境变量传递 executable 和 JSON 参数。原生 executable 继续使用直接参数边界。

同一次成功 probe 的 executable 与必要 `PATH` 前缀由 Desktop 进程持有，并由 Runtime child、Codex app-server 和交互式 CLI handoff 共同复用。Setup 重试会重新解析并替换该结果；未成功 probe 的裸命令不得进入任务执行链路。

Desktop 自身的 Node 脚本不依赖主机 shell 中的 `node`。开发态直接使用当前 Node executable；打包态使用当前 Electron executable 并为 ledger、project initialization、Runtime child 和后台 ledger command 注入 `ELECTRON_RUN_AS_NODE=1`。包内 `app.asar` 脚本路径继续作为 executable argument，但子进程 `cwd` 使用真实的 Electron `resourcesPath`，不把 ASAR 虚拟目录交给操作系统进程创建边界，因此 GUI 环境无需安装或暴露独立 Node CLI。Runtime CLI 只把该变量当作 Electron 到 Node 的启动引导：入口必须先清除 `ELECTRON_RUN_AS_NODE`，再加载 Runtime CLI 模块，使 Codex 和其他 Runtime 后代进程不会继承 Electron 专用模式。

## 更新、回滚与清理

升级是 source switch + governed reapply，不是目录覆盖：

- 旧目标 assessment 含 `local-content-conflict`、`unverified-managed` 或 `unmanaged-conflict` 且没有有效 disposition 时不切换 source；
- `managed-repair` 与 `managed-migration` 进入可确认 plan，不被折叠成无动作的 source conflict；
- 新 source staging 校验失败时删除 staging，不影响 current；
- current 切换失败时恢复 previous；
- provider apply 失败时同时回滚目标、用户内容备份移动、catalog、loader 和 relation；
- apply 成功并 post-drift clean 后才清理超过保留数量的旧 source；
- managed-stale 只报告，清理需要具体路径与单独 confirmation digest；
- app uninstall 不隐式删除外部 Agent 目录。

## 可验证性

本地和 CI 测试覆盖：

- tag/channel/version/baseline validation；
- target matrix selection 和 artifact naming；
- deterministic payload 与 lock digest；
- provider API compatibility 和 checksum rejection；
- ArcForge Core 与 Embedded Provider 对同一 source 输入产出一致的 canonical provisioning plan；
- manifest-declared shared assets 进入 Core plan、provider projection、transactional apply、relation 和 drift，并对缺失 capability 或遗漏资源 fail closed；
- packaged resource root resolution；
- clean install、existing unrelated skill、changed managed skill、managed-stale、apply rollback；
- user-ambient、user-on-demand loader/catalog 和 deferred project-ambient；
- source upgrade 对 missing managed target、provider destination/policy migration、managed loader update、local content change、legacy unverified relation 和 unmanaged conflict 的 typed classification；
- assessment/plan freshness、逐类 disposition、内容备份、atomic source switch、repair/migration、关系摘要升级和 explicit cleanup；
- 检查阶段 `write_state: not_started`、apply 回滚完整/不完整和每个非 ready 状态的可执行恢复投影；
- signing mode gate，不使用真实 secrets；
- DMG、NSIS 和 AppImage artifact existence smoke checks。

真实签名、公证、GitHub Environment secrets、draft release 授权和内部用户安装反馈是外部验收证据，不由本地测试伪造。
