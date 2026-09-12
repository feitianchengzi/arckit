# Scene Skills 技术方案

状态：✅ 已采用

## 分层

`SkillProvisioningManager` 负责分发包校验并调用 ArcForge Embedded Provider；Provider 负责统一用户 catalog 的安装、完整性检查、来源关系与旧项目迁移；`SceneSkillManager` 负责来源发现、稳定身份、持久场景 revision、核心保护和绑定解析；Codex adapter 负责进程级 roots 和原生技能排除。Desktop/IPC/renderer 只调用领域 API。Loop kernel、ledger 协议与 capability-policy 不承载场景列表。

## 配置与目录

应用数据目录保存场景配置 `engineering/scene-skills.json`，每次保存检查 revision 并原子替换。来源以 builtin、catalog qualifiedName 或规范化本地路径识别。安装使用 `catalog/<skillName>` 稳定路径，共享资产为 `catalog/<assetName>`；来源相对路径仅保存在关系中用于重新应用。共享资源的兄弟相对引用保持有效。

场景设置值为 direct、on-demand、disabled；旧 boolean true/false 分别兼容为 direct/disabled。来源模式只作为默认推荐，配置转换不搬动文件。

## 解析契约

scene binding 包含 scene、revision、选中 skills 的身份/名称/路径/摘要、受管理名称及禁用路径。核心来源从可信应用 catalog 解析，不从同名用户目录解析。普通同名启用项拒绝歧义并提示替换。发现只是结构化 metadata，不做语义路由。

Codex adapter 初始化后设置 `skills/extraRoots/set`，使用 `skills/list` 检查实际发现和同名副本，启动配置对未选中的受管理副本设置线程局部 `skills.config`。禁止 `skills/config/write`，不修改用户或项目 config。能力缺失时显式失败，不静默降级为未隔离的会话。

Automation 在 Desktop startRun 解析并将 binding 写入该 run 私有目录，通过 CLI 文件参数传给 adapter；所有 Loop 复用该绑定。Chat 在消息开始读取 binding，配置改变时关闭空闲 adapter 后恢复原 thread。技能正文保持按需加载，入口可显式传 skill input。

## 迁移安全

ArcOrbit 校验随包 checksum、Provider lock 与 `stable-catalog/v1`、`project-skill-migration/v1` capabilities。`inspectProvisioningPlan` 复用 `createProvisioningPlan`，后者调用既有 `createAvailabilityPlanFromSource`；执行继续走 `applyProvisioningPlan` / `applyAvailabilityFromSource`，复用目录事务、catalog v2 写入与 applied source 关系提交。

`catalog-only` 复用安装引擎与 catalog/index.json，所有来源模式可存储；不产生原生 agent 目录副本。arcforge-on-demand 使用 Provider 自身的正式来源独立计划/登记，与 Arckit 来源清单合并展示。安装提交绑定两个计划摘要；发生部分失败时重新检查剩余计划，不隐式删除。

ArcOrbit 通过 Provider 的 inspectCatalogEntries/queryCatalog 获取元数据和解析结果，不自行读取索引、拼接目标或重复实现 digest。queryCatalog 的 allowedSkills 仅限制当前查询，通用用户 catalog 保持完整。scene binding 包含直接发现技能、按需 qualifiedName/摘要和 catalogContext；配置摘要变化按原会话恢复规则处理。

检查返回安装、更新、无需变更、待登记、冲突与共享资源目标；没有变更时不写 catalog 或关系。UI 先展示完整安装更新清单，提交当前 digest 与 confirmed 后才执行。Provider 复核来源与目标，并在变更失败时沿用现有事务恢复。目标内容偏离已记录基线时阻断覆盖；来源有新内容则展示更新。

旧副本通过 `planProjectSkillMigration` 基于可信源与历史关系生成单独清单。`applyProjectSkillMigration` 同时要求已验证的替代安装关系、当前清理计划摘要和明确确认；安装动作不调用删除。内容变化、未知/冲突归属和链接保留。清理更新同一套 applied source 记录并保存迁移结果；删除不创建备份。

## 并发与恢复

管理器串行化 mutation，revision 拒绝陈旧覆盖；场景集合原子保存。目录消失、核心冲突、安装内容漂移在解析阶段报告。Chat 和 Automation 拥有独立 app-server；临时 roots 不跨进程共享。Desktop 安装/清理与 Chat、Automation 的活动状态独立，不读取 owner 清单。更新不主动修改已有绑定；Chat 下一轮、Automation 新 Run 重新解析技能，旧绑定对已变更内容的校验在使用侧处理，不把 registry 名称冲突交给目录扫描顺序处理。

## 验证

领域测试覆盖保护、选择、替换、持久化、来源与冲突；adapter 测试检查初始化、重复 turn、恢复、同名排除和缺失能力；迁移测试使用临时项目验证无备份删除与第三方保留；DOM 与 Electron 测试检查页面真实状态和导航。

## Codex 路径与终端接管

本机 Codex 0.153.4 实测 `skills/extraRoots/set` 接收目录列表，`skills.config` 禁用键使用规范化的 `SKILL.md` 文件路径。文件夹开关被解析但不生效；集成测试保留该回归。`thread/start` 与 `thread/resume` 的 `config` 支持 `skills.config` 点号键；不通过全局 config/write 持久化。

终端接管继续恢复原 thread，并在交接指令中携带此次运行选中的绝对 SKILL.md 路径，先读取官方入口，其他技能按 Gap 加载。CLI 没有沿用 app-server 进程 roots，不能把旧线程历史中的项目安装路径视为可用来源。

用户原生技能默认继承 Codex 的 disabled 状态；显式场景开关优先。同名项目技能只在其所属项目参与解析，普通用户/项目默认来源遵循项目优先，显式选择的不同版本冲突须修正配置。ArcForge v2 catalog 按 ready 状态、目标与内容摘要验证后作为候选，冲突或漂移项不可启用。

完整包证据使用可选 packageDigest，保留既有 contentDigest 的兼容语义，覆盖 dist 等实际安装资源。CLI resolve、确认执行和迁移验证使用同一证据。此前独立 catalog 的旧目录保留，不作隐式删除；新管理状态只写标准 catalog v2 和 applied source 关系。

随包来源通过 declaredSkillPaths / declaredSharedAssetPaths 限定精确相对路径；开发态使用同一声明机制，避免仓库历史副本参与当前来源选择。路径声明写入既有安装上下文，普通 applied drift/run 重用该范围、来源身份与目标策略。

旧 catalog/consumers/ 和 catalog/versions/ 不再作为新安装目标。变更目标时将原安装证据保留在同一关系的 retiredTargets 中；迁移计划根据完整包摘要和其它关系引用检查生成待删清单。安装不自动删除这些目标，也不清空父目录。

## 按需传输

只有 arcforge-on-demand 直接可发现时，Codex adapter 提供只读 arcforge_catalog 工具。list 返回当前按需集合的最小元数据，resolve 复用 ArcForge 路径与内容校验，并检查绑定时摘要。动态工具不返回禁用技能；普通全局 CLI 的 catalog 查询不被场景配置改写。

本地协议的 thread/resume 无动态工具注册参数。为保留原 thread，adapter 同时提供通过桌面 --arcforge-catalog 入口调用随包 provider/catalog-query.js 的明确只读命令及不可变范围文件。新线程用动态工具，旧线程在工具不可用时用同范围命令；不假定全局 ArcForge CLI 或 Node 已安装，不启用正式包关闭的 Electron RunAsNode fuse。范围文件只承载会话配置，不是第二份安装索引。两种传输均禁止使用全局查询绕过场景限制；这是 Agent 使用协议，不能清除线程历史或替代文件系统权限隔离。

按需入口的触发权属于用户显式调用或宿主程序明确配置的调用。工具可用和场景按需集合只是接口与范围，不是调用指令。Agent 只在调用发生后进行候选语义选择，不自行发现隐藏技能。通用 skill 不引用 ArcOrbit 工具名或线程回退机制；这些细节由宿主会话上下文提供。
