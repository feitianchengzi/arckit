# ArcOrbit 安装包供应链

## 定位

ArcOrbit 安装包供应链把仓库内 Runtime、trusted ledger capabilities、Arckit skills 和 ArcForge provisioning engine 组合成一份可验证的 Electron 分发物。供应链属于 Desktop setup 与 delivery plane，不进入 Runtime Kernel 的语义或调度路径。

Git branch 决定代码生命周期，release intent tag 决定不可变版本基线，人工 `workflow_dispatch` 决定何时真正构建以及构建哪些目标。workflow 不监听 push 自动出包，不创建或移动 tag。

## 产品与兼容身份

ArcOrbit 是该 Electron Desktop/Runtime 的产品身份，Arckit 是它执行的软件研发协议与 skill 体系。源码、构建和分发的新 canonical locator 使用一组一致的 ArcOrbit 标识：

```text
runtime/arcorbit/
@arckit/arcorbit
bin/arcorbit.mjs
arcorbit
.github/workflows/arcorbit-package.yml
Resources/arcorbit/
ArcOrbit-<version>-<channel>-<build>-<os>-<arch>.<ext>
arcorbit-<target>-<version>
```

CLI package 同时保留 `arckit-runtime` bin alias，并指向与 `arcorbit` 相同的入口。别名只用于已有脚本的升级连续性，不参与当前帮助文本、README 示例、artifact 名称或 productName。

以下标识保持稳定，因为它们连接既有安装、外部服务或持久记录：

- Electron `appId` 为 `com.feitianchengzi.arckit.runtime`。产品名改变时不创建新的应用数据域；
- Workshop `app_id` 默认值为 `arckit-runtime`。它是服务端识别契约，独立于 Desktop 展示名称；
- `arckit-runtime-result/v2`、`arckit-runtime-gate/v2`、`arckit-runtime-distribution/v1`、`arckit-runtime-distribution-attestation/v1` 等已发布 schema id 保持稳定；
- `arckit-runtime://runs/RUN-...` 保持为 ledger 中既有和新增 Runtime 过程记录的 opaque ref；
- 已有 release tag、closed Case、Runtime result、provenance 和 checksum 内容不可因更名重写。

打包资源的 canonical root 是 `Resources/arcorbit/`。读取器在升级恢复时可以接受 `Resources/arckit-runtime/`，但新的分发物只写入 canonical root。仓库路径、package name、可执行名、workflow、当前文档交叉引用和测试 fixture 随源码迁移到 ArcOrbit 身份；稳定 schema、URI、bundle 和外部 app id 由兼容测试防止误改。

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
  -> Setup Readiness / CodexSetupManager / SkillProvisioningManager
  -> Product Workspace local-project binding
  -> ArcForge Embedded Provider
  -> <project-root>/.codex/skills + ~/.arcforge catalog/relations

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
- `runtime/arcorbit/config/capability-policy.json`。

packaged resource root 由应用启动时显式提供给 capability registry。registry 不再依赖源码仓库中 `src` 上方固定层级推断生产资源位置。项目仓库 capability 仍可作为 project source 被扫描，但同一受信 Runtime capability 只允许解析到应用内 repository source。

### Arckit skill payload

skill payload 是 Arckit tag 对应 commit 的只读快照，包含：

- `arcforge.skill-project.json`；
- 被默认 profile 选中的所有 skill 目录；
- profile 引用的共享 assets；
- payload manifest、逐目录 digest 和 source commit。

payload 不是已安装目录。Desktop 首次运行把它复制到应用数据目录的版本化 source store；只有 Product Workspace 提供规范化本地项目根后，ArcForge provider 才把选中能力应用到该项目的消费目标。

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

Arckit payload manifest 是 Runtime 供应链契约，不进入通用 ArcForge 配置。Embedded Provider 负责把 manifest 中的显式资源声明转换为 Core 的 source 输入；Core 将自动发现和显式声明合并为 canonical source snapshot，并在同一 availability plan 中产出 skills、shared assets、loader 与各自目标。ArcOrbit 通过 invocation override 把 source `user-ambient` 解释为当前关联项目的默认常驻能力，把 `project-ambient` 交给 project assessment，并把 on-demand loader 的 Agent target 限制到当前项目；它不修改维护源 manifest。apply 与 drift 只消费该 fresh plan，不重新推导 target 或 shared asset 目标。

Runtime 对 manifest、provider plan 和 drift 做完整性交叉校验，并在 provider capability 缺失或声明资源未进入 plan 时 fail closed。Renderer 只投影 provider 返回的 shared asset destinations，不根据用户 home 或 Agent 目录规则构造 fallback 目标。

## Embedded Provider API

provider 暴露稳定的版本化入口，输入和输出只使用 JSON-compatible values：

- `inspectProvider()`：返回 API version、provider version、build commit 和 loader digest；
- `createProvisioningPlan(options)`：解析 source/profile/availability/targets/project assessments、显式 shared assets 和历史关系；
- `driftProvisioningPlan(options)`：对 fresh plan 比较目录、catalog、policy 和 target extras；
- `applyProvisioningPlan(options)`：要求 fresh plan digest 与 `confirm=true`，事务化写入目标、catalog 和关系；
- `listProvisioningRelations(options)`：读取指定 source/consumer 的已保存关系；
- `assessProvisioningUpgrade(options)`：按关系所有权、最后应用摘要与 fresh drift 产出 typed 冲突和允许的恢复动作；
- `recoverProvisioningUpgrade(options)`：要求 fresh assessment digest 与显式确认，执行受管理恢复或带备份的当前 bundle 重装；
- `removeManagedProvisioning(options)`：只接受显式 managed paths 与 confirmation digest。

所有入口显式接收：

- `sourceRoot`：应用管理的本地维护源；
- `consumerRoot`：关系记录归属 root；
- `stateRoot`：ArcForge 状态根，默认由 Desktop 解析为用户标准 ArcForge home；
- `homeDir`：ArcForge catalog 所在用户 home；ArcOrbit 不把它作为 Codex ambient target；
- `agentTargetIds=["codex"]` 和非空 `projectTargetDirs`；每个目录都来自 Product Workspace 的规范化本地项目根；
- profile、skills selection、project assessments 和 invocation overrides；
- `cacheDir`：只在明确允许远程来源时使用，安装包默认离线来源不使用远程 cache。

provider 不依赖进程级 `ARCFORGE_HOME` 才能隔离状态。CLI 可以继续用环境变量兼容入口，但 embedded API 以显式 `stateRoot` 为准。ArcOrbit 的项目 plan 缺少 `projectTargetDirs` 时返回 `needs-project`，不能回退到 `homeDir/.codex/skills`。

plan 包含稳定 digest，digest 覆盖 source identity、source policy、selected skills、shared assets、content digests、目标、历史 managed set、loader 和 project assessments。shared asset plan item 包含 source-relative identity、内容 digest 和 Core 解析出的 destinations。apply 重新扫描 source 与目标；fresh digest 不一致时拒绝写入。

同一规范化项目根只形成一组有效 relation。多个 Workshop Project 绑定同一本地项目时共享该 relation；不同项目各自保存 target、assessment、managed set 与 drift。`consumerRoot` 始终是 ArcOrbit userData，关系状态仍写入显式 `stateRoot`，两者都不是应用目标。Renderer 只接收 provider 返回的项目 target，不拼接 `.codex/skills` fallback。

## 应用资源布局

Electron bundle 使用以下逻辑布局：

```text
Resources/
  arcorbit/
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

Codex 消费目录使用：

```text
<Product Workspace project root>/.codex/skills/<skill>/
<Product Workspace project root>/.codex/skills/_arckit_shared/
<Product Workspace project root>/.codex/skills/arcforge-on-demand/
```

ArcOrbit 不向 `<user-home>/.codex/skills/` 写入 bundled Arckit skill、shared asset 或 loader。`user-on-demand` 内容可以存在于 ArcForge catalog；catalog 是 provider 的控制面状态，不属于 Codex ambient discovery target，只有项目目录中的 loader 能在该项目上下文解析它。

Desktop 在 Electron ready 前把 `userData` 固定为系统 `appData/@arckit/arcorbit`。该目录是 ArcOrbit 唯一的 Desktop 状态、source store 和 ArcForge consumer relation 身份；应用不读取、迁移或复用 `appData/@arckit/runtime`。新身份没有 relation 且目标已存在时，Setup Readiness 按未受管理冲突处理，并通过 provider 声明的备份与当前 bundle 重装动作建立新的关系。

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

本地 provider 使用 `local.<build-id>` SemVer prerelease、`local/arcorbit-<build-id>` release ref、当前 Git commit 和 dirty marker。Runtime lock 使用 `local/v<product-version>-<build-id>` source ref、`channel: local`、`repository: local/*`、`workflow: local-build` 和 `signing: disabled`。`prepare-distribution` 只在本地入口接受这一 metadata lane；受治理的 release-trigger validator 仍只接受既有 `tf/*`、`beta/*` 和 `appstore/*` tag。

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

## ArcOrbit GitHub workflow

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

- macOS Developer ID、以 `APPLE_API_KEY_BASE64` CI secret 注入并在 `RUNNER_TEMP` 解码为 owner-only `.p8` 临时文件的 notarization Team API key，或 Apple ID app-specific password；API key 存在时不向构建步骤注入 Apple ID credentials，避免底层工具优先选择个人账号认证；

workflow 根据渠道选择 `internal`、`beta` 或 `appstore` GitHub Environment。`signing` gate 只控制 macOS：`disabled` 不使用 signing secrets，`auto` 只有在构建后验签通过时才记录 `signed`，`required` 在构建前检查 Developer ID 签名和 notarization 配置并在结果缺失时失败。Windows 与 Linux matrix 使用 effective `disabled` signing mode，不注入代码签名 secrets，并把产物记录为 unsigned 或 not-applicable；Linux checksum 不被称为代码签名。

日志、lock 和 provenance 只保存 secret 名称是否配置、签名结果、证书公开标识和公证结果，不保存 secret value、私钥路径或完整环境。

## Desktop Setup Readiness

Desktop 由 Electron main process 持有独立 `CodexSetupManager` 与 `SkillProvisioningManager`。前者拥有 Codex discovery、官方 installer、版本、认证与 logout 子进程；后者拥有项目 skill 文件写入。Renderer 只通过窄 IPC 请求 setup snapshot 和结构化动作；preload 不暴露任意 URL、路径、参数、shell command、process handle 或 provider module handle。

Manager 分为全局资源检查和项目准备。全局检查校验 bundle、provider、source store 与 Codex executable，不生成 Agent apply plan。应用启动的 coordinated check 从 Desktop Store fresh-read 全部本地 Product Workspace roots，去重并规范化后一次性交给项目准备；Renderer 的当前项目筛选不参与该作用域。空 roots 以显式空集合清除既有项目 plan 并回到 global-only，不复用上一次检查的项目作用域。项目准备只接受 Automation/Product Workspace Coordinator 已解析的项目 id、规范化绝对根路径和绑定证据。

项目准备顺序：

1. 校验 distribution lock 与 bundled resources；
2. 把 payload staging 到 source store；
3. 校验 Product Workspace 绑定与本地项目根，向 provider 传入 `projectTargetDirs`、完整 skill selection、project assessments 和 ArcOrbit project-only invocation override；
4. 由 ArcForge Core/provider 依据旧 relation 的已记录目标、最后应用摘要、旧 source 和 provider capability 生成 typed source-upgrade assessment；旧版用户级 managed targets 与新的项目 target 同时进入 assessment；
5. assessment 将目标区分为 `managed-repair`、`managed-migration`、`local-content-conflict`、`unverified-managed` 和 `unmanaged-conflict`，并携带旧/新目标、摘要、文件差异、所有权依据和允许动作；
6. 生成与 assessment 一致的新项目 plan 和 drift，把纯数据结果交给 Renderer；
7. 接收包含项目根、assessment digest、plan digest 和逐类 disposition 的用户确认；
8. 调用 provider fresh-read，在同一事务中执行 source switch、项目目标 apply、catalog、项目 loader、关系迁移、旧用户级 managed target 处置和已确认备份；
9. 重新 assessment/drift，并以项目根启动 Codex discoverability probe；
10. 项目状态为 `ready` 且不存在未处置的旧用户级 managed target 后，开放该项目的 Runtime task start。

ArcForge Core 是 upgrade classification 与迁移语义的唯一实现。Embedded Provider 暴露 capability-gated typed assessment/apply；Runtime 不从 `missing`/`changed` 计数、路径形态或 skill 名称推断分类，也不复制 catalog 或 loader 迁移规则。provider artifact 不具备 Runtime 要求的 source-upgrade reconciliation capability 时，构建和 Setup Readiness 都 fail closed。

关系记录为每个项目根和受管理 destination 保存最后成功 apply 的内容摘要、有效 mode/policy、project assessment、source/provider identity 和 shared-loader 所有权证据。旧记录没有摘要时，Core 只能把仍存在且内容不同的目标标记为 `unverified-managed`；它不能把这种状态自动提升为安全迁移。关系证明的 missing destination 没有可被覆盖的本地内容，归类为 `managed-repair`。provider 造成的用户级到项目级目标变化、策略变化或 shared loader 迁移，只有在旧目标与最后应用摘要一致、目标缺失，或 shared loader 的受管理更新证据成立时才归类为 `managed-migration`。

`local-content-conflict` 和 `unverified-managed` 的写入动作要求逐目标 disposition。备份并恢复在 source switch 前把现有目录事务化保存到应用数据中的不可变 recovery area，记录内容摘要和可展示引用，再把恢复动作纳入同一 fresh plan；任一步失败恢复原目标、source、catalog 和 relation。

旧版关系能够证明所有权的 `<user-home>/.codex/skills/<managed-name>` 和用户级 loader 进入用户目标迁移集合。项目副本写入与旧用户目标移除属于同一事务；内容变化先备份，用户选择保留时不删除，也不把项目投影为 `scope-clean ready`。没有关系所有权证据的用户级目录只报告为 `uncertain` 或 `unrelated`，永不进入移除集合。解除绑定或删除本地项目记录只把 relation 标为未关联；项目目标清理由用户查看绝对路径后独立确认。

`unmanaged-conflict` 永不进入普通 apply replacement set。fresh assessment 能为全部阻塞目标证明唯一 bundled source 映射时，provider 额外允许 `backup-and-reinstall`：它先保存每个现有目标，以当前 source store 内容替换冲突目标，再通过 Core 的事务化 apply 写入 catalog、loader 与新的 consumer relation。assessment digest 变化、source 映射缺失、备份失败、目标提交失败或关系提交失败都会 fail closed；覆盖前的内容保持可恢复。Runtime 只选择并转发 provider 声明的动作，不从路径或 `changed` 计数自行提升可覆盖性。检查阶段没有写入时，snapshot 使用 `write_state: not_started`，Renderer 不把它投影为 rollback。

Manager 不修改现有 `preflightRun` 的 kernel 语义。Automation Coordinator 在 start 前用 task 的本地项目绑定请求对应项目 readiness，再组合 Setup Readiness 和 Runtime preflight 两个独立结果，避免 Runtime 通过文件扫描推断 Agent native skill discovery。

Codex discoverability 解析一个经过 `--version` 验证的绝对 executable，而不假设 Desktop GUI 进程继承交互式 shell 的 `PATH`。解析顺序覆盖显式配置、当前 `PATH`、常见用户级安装目录以及 NVM/FNM 的版本目录；Node 版本管理器中的 CLI 同时携带其 sibling `bin` 目录作为子进程 `PATH` 前缀，保证 `#!/usr/bin/env node` 启动器可执行。解析失败保持 Setup blocked，不修改系统或用户 `PATH`。

Windows 的 npm 安装通常暴露 `.cmd`/`.bat` command shim。版本探测不得把这类文件直接交给 `execFile`，也不得用拼接用户路径的 shell 字符串；必须通过固定 PowerShell 脚本启动，并仅用结构化环境变量传递 executable 和 JSON 参数。原生 executable 继续使用直接参数边界。

同一次成功 probe 的 executable 与必要 `PATH` 前缀由 Desktop 进程持有，并由 Runtime child、Codex app-server 和交互式 CLI handoff 共同复用。Setup 重试会重新解析并替换该结果；未成功 probe 的裸命令不得进入任务执行链路。

### Codex installation 与 authentication manager

`CodexSetupManager` 维护与 Workshop session、SkillProvisioningManager project relation 和 Runtime execution 分离的 snapshot：

```text
installation: checking | missing | installing | installed | updating | broken | install-failed
authentication: checking | selection-required | login-in-progress | authenticated | logged-out | expired | login-failed
executable: absolute path + required PATH prefix + detected owner
operation: opaque id + kind + phase + started_at + cancellable
last_error: stable code + safe summary + recovery actions
```

`detected owner` 至少区分 `standalone`、`npm`、`homebrew`、`configured` 和 `unknown-external`。来源判断只使用 executable 路径、resolver provenance 和固定的安装元数据，不读取 Codex auth storage。外部 executable 继续参与版本和认证 probe；manager 不为它静默创建 standalone 副本。只有当前 executable 的 standalone 所有权可证明时，`update` 才直接进入 installer；其它来源返回 `CODEX_EXTERNAL_INSTALLATION`，由 UI 解释外部所有权或发起独立、显式的 standalone migration confirmation。迁移成功后 discovery 必须证明 ArcOrbit 实际选择的新 executable 且没有未解释的 PATH precedence 冲突。

平台 installer 规格来自 OpenAI 官方 Codex CLI 文档，并固定在 main-process allowlist：

| 平台 | 官方 standalone 入口 | 受控执行边界 |
| --- | --- | --- |
| macOS、Linux | `https://chatgpt.com/codex/install.sh` | manager 下载到 owner-only 临时文件，校验响应和大小上限后以固定系统 shell 执行；不拼接 Renderer 输入 |
| Windows | `https://chatgpt.com/codex/install.ps1` | manager 下载到 owner-only 临时文件，以固定 PowerShell executable 和固定 policy/file 参数执行；不把 URL 或用户内容插入 script |

同一官方 installer 用于安装和 standalone 更新。临时脚本、下载响应和子进程在 operation 结束后清理；installer 不进入 ArcOrbit 包，不被重新分发。网络、HTTP、临时文件、权限、process exit 和 post-probe 各自映射稳定错误 code。stdout/stderr 只经过界限化、控制字符清理和敏感模式屏蔽后形成进度/诊断，不能作为成功事实；成功必须重新运行 executable discovery 与 `codex --version`。固定来源和当前命令以 [Codex CLI 官方安装文档](https://learn.chatgpt.com/docs/codex/cli) 为权威证据，版本升级时通过契约测试显式更新 allowlist。

install、update 和 migration 在 main process 内互斥，并先向 Automation Coordinator、ChatCoordinator 和其它 Codex process owner 查询 active operation。存在 running/starting/waiting-approval Codex task 或 turn 时返回 `CODEX_UPDATE_ACTIVE_TASKS`，携带无敏感的 owner/execution refs；manager 不主动 interrupt 它们。应用退出、窗口销毁或用户取消只在当前 phase 可安全终止时发出 bounded termination，随后 fresh discovery，绝不根据“进程已退出”推断安装成功。

认证命令同样只从固定枚举物化：

| 结构化选择 | executable 参数 | stdin |
| --- | --- | --- |
| ChatGPT / system-browser | `login` | 无 |
| ChatGPT / device-auth | `login --device-auth` | 无 |
| API Key | `login --with-api-key` | 一次性 secret + line terminator |
| Enterprise Access Token | `login --with-access-token` | 一次性 secret + line terminator |
| status | `login status` | 无 |
| logout | `logout` | 无 |

选择由 Renderer 以 `credential_type` 与必要的 `auth_flow` 枚举提交；两者都没有默认值。main process 拒绝缺失、未知或当前 capability 不支持的组合，也不接受自由参数。设备码和 Access Token 的可见性由固定产品 policy 与当前 executable 的 capability probe 共同决定；不可见选项不能通过 IPC 强行调用。命令契约以 [Codex 官方认证文档](https://learn.chatgpt.com/docs/auth) 为权威证据。

API Key 或 Access Token 只存在于当前安全输入控件的一次性值和对应 IPC 调用的瞬时 payload，不写入共享 Renderer store、Desktop Store、配置、analytics、错误或日志。preload 暴露专用 secret action 并立即清空调用侧输入；main process 在 spawn 成功后直接写入 child stdin、结束 stdin 并覆盖可控 buffer，不把值放入 argv、environment 或 operation snapshot。通用 IPC tracing、exception serialization 和 process diagnostics 对该 action 只记录 operation id 与 secret-present boolean。第一版不持久化 secret；未来持久化只能由单独接受的操作系统安全凭证库契约提供。

ChatGPT username/password、验证码、MFA 和 SSO 始终由 Codex 与系统浏览器处理。ArcOrbit 不打开、读取、复制、监视或解析 `~/.codex/auth.json` 或任何 Codex credential-store 实现，不刷新 OAuth token。浏览器和 device-auth child 的可展示进度来自有界、已清理的官方进程输出；device code 只作为当前 operation 的短期交互提示，不进入持久状态或日志。

`codex login status` 的退出码是认证事实的唯一来源。退出码为零投影 `authenticated`；非零且先前为 authenticated 投影 `expired`，其它非零投影 `logged-out`，spawn/timeout 等探测错误投影 `login-failed`。manager 不解析 status 输出或 credential file 来提升认证状态。任一 login 子进程结束、取消或超时后都重新运行 status；只有 status 为零才报告成功。logout 也必须在结束后以非零 status 复核，结果异常则保留可重试错误。

Setup aggregate snapshot 按固定顺序组合：resource lock → executable discovery → `codex --version` → `codex login status` → project skill readiness。启动检查中的 project skill readiness 覆盖 Desktop Store 中全部已关联本地项目，不受关闭前产品筛选状态影响；任一 root 的 missing、changed、stale 或 conflict 都使 aggregate 保持非 ready。只有全部通过才投影 Runtime `ready` 并允许 Automation 启动。安装/更新后的 fresh discovery 替换所有 Codex process owner 使用的 executable；登录/退出只改变 Codex authentication domain，不读写 Workshop authentication。SkillProvisioningManager 可以在 Codex 恢复期间保留已经生成的 project plan，但不能越过 aggregate gate 启动 Runtime。

preload IPC 至少限定为：

```text
codexSetup.snapshot()
codexSetup.install({ confirmation_id })
codexSetup.update({ confirmation_id })
codexSetup.migrateToStandalone({ confirmation_id })
codexSetup.login({ credential_type, auth_flow, confirmation_id })
codexSetup.loginWithSecret({ credential_type, secret, confirmation_id })
codexSetup.cancel({ operation_id })
codexSetup.logout({ confirmation_id })
codexSetup.recheck()
codexSetup.subscribe(listener)
```

main process 为每个动作校验当前 snapshot、窗口 sender、operation id、capability 和一次性 confirmation；Renderer 不能覆盖 executable、cwd、URL、timeout、environment 或 args。事件只包含状态枚举、阶段、有限进度、稳定错误和 recovery action，不包含 argv、raw stdout/stderr、secret、auth file、token 或完整 environment。

Desktop 自身的 Node 工作不依赖主机 shell 中的 `node`，也不把 Electron 应用 executable 重新解释为 Node。开发态 CLI 继续由明确的 standalone Node 启动；Desktop 在 `app.whenReady()` 后使用 Electron `utilityProcess.fork()` 以 `app.asar` 中的 Runtime module 作为入口，stdout/stderr 保留结果与事件流，`process.parentPort` 只接收带 schema 的 steer/interrupt 控制消息，utility environment 会剔除外部遗留的 Electron-to-Node bootstrap 输入。project initialization 与 trusted ledger writeback 在同一受信进程内调用 manifest-resolved module API；trusted entrypoint 不再通过 `process.execPath` 嵌套执行自己的 CLI wrapper。外部 Codex 仍是经过 Setup probe 的独立 executable，并保持自身 stdio/RPC 生命周期。

分发构建在签名前通过 `@electron/fuses` 显式关闭 `RunAsNode`、Node options 与 CLI inspect fuses，并启用 ASAR 完整性与 only-load-from-ASAR 约束。Desktop Renderer 仍由 `BrowserWindow.loadFile()` 从 `app.asar` 的 `file://` 入口加载，因此 `GrantFileProtocolExtraPrivileges` 保持启用；该权限只维持包内页面及其本地模块和样式的加载契约，不允许把 Electron executable 解释为 Node。构建验证必须读取实际 packaged fuse wire，证明设置该环境变量也不能把 ArcOrbit executable 转成 Node；packaged smoke 同时证明 Renderer 首屏资源、utility Runtime 与 trusted ledger 均可加载，且不会产生额外 Browser/GPU/Renderer 应用树。该边界使“无意打开新窗口”从每层调用者都要记住的环境约定，变成 Desktop host API、in-process trusted API 和二进制 fuse 共同保证的结构约束。

## 更新、回滚与清理

升级是 source switch + governed reapply，不是目录覆盖：

- 旧目标 assessment 含 `local-content-conflict`、`unverified-managed` 或 `unmanaged-conflict` 且没有有效 disposition 时不切换 source；
- ordinary drift 或 consumer relation 缺失产生的 `unmanaged-conflict` 只有在 provider 声明 `backup-and-reinstall` 可用且用户独立确认后才使用当前 bundle 内容；
- `managed-repair` 与 `managed-migration` 进入可确认 plan，不被折叠成无动作的 source conflict；
- 用户级到项目级的受管理迁移只有在至少一个明确项目 target、旧目标所有权和 disposition 同时存在时执行，不产生临时用户级 fallback；
- 新 source staging 校验失败时删除 staging，不影响 current；
- current 切换失败时恢复 previous；
- provider apply 失败时同时回滚项目目标、旧用户目标、用户内容备份移动、catalog、项目 loader 和 relation；
- apply 成功并 post-drift clean 后才清理超过保留数量的旧 source；
- managed-stale 只报告，清理需要具体路径与单独 confirmation digest；
- 解除 Product Workspace 绑定不隐式删除项目 Agent 目录；
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
- source user-ambient 到项目常驻 override、project-ambient assessment、user-on-demand catalog 与项目 loader；
- 无项目根时 `needs-project` 且不写用户级目录、多个项目独立 relation、同根绑定去重与项目路径变化；
- clean project install、项目 target drift、项目级 shared assets 和以项目 cwd 执行的 Codex discoverability；
- macOS、Linux 和 Windows 的固定 standalone installer allowlist、下载/执行失败分类、安装后 fresh discovery 与 `--version` 验证；
- standalone update、活动 Automation/Chat/Codex owner 阻断，以及 npm/Homebrew/configured/unknown external installation 不产生静默副本；
- installation 与 authentication 状态转换、重复动作互斥、取消/超时、退出后 fresh probe 和应用无需重启的恢复；
- 无默认认证选择、缺失选择拒绝、device/access-token capability gating，以及每个可见方式只映射固定 argv；
- API Key/Access Token 只进入 stdin，argv/environment/log/error/store/Renderer shared state 均无 secret，并对恶意值和 spawn failure 做泄漏回归；
- `codex login status` 退出码判定、login/logout 后复核、Codex/Workshop auth domain 隔离，以及对 auth file 零访问；
- aggregate ready 同时要求 executable、version、login status、全局资源和项目 skills，旧 Setup/Chat/Automation 流程保持通过；
- 旧用户级 managed skills/loader 到项目 target 的 typed migration、内容备份、用户保留阻断 scope-clean ready，以及 unrelated 用户目录保持不变；
- source upgrade 对 missing managed target、provider destination/policy migration、managed loader update、local content change、legacy unverified relation 和 unmanaged conflict 的 typed classification；
- assessment/plan freshness、逐类 disposition、内容备份、atomic source switch、repair/migration、关系摘要升级和 explicit cleanup；
- ArcOrbit 独立的 `appData/@arckit/arcorbit` Electron userData 身份、不读取旧 Runtime 状态，以及无 relation 冲突的 stale assessment 拒绝、备份、bundle 重装、关系建立和失败回滚；
- 检查阶段 `write_state: not_started`、apply 回滚完整/不完整和每个非 ready 状态的可执行恢复投影；
- signing mode gate，不使用真实 secrets；
- DMG、NSIS 和 AppImage artifact existence smoke checks。

真实签名、公证、GitHub Environment secrets、draft release 授权和内部用户安装反馈是外部验收证据，不由本地测试伪造。
