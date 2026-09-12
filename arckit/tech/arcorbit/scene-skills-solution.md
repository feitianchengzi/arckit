# ArcOrbit 内置 Skills 管理方案

状态：✅ 已采用

## 分层

`SkillProvisioningManager` 校验分发资源并调用 ArcForge Embedded Provider；Provider 负责 ArcOrbit 内置 Skills 的统一 catalog 安装、完整性、来源关系与旧项目迁移；`SceneSkillManager` 只负责内置 Skill 身份、场景 revision、核心保护和绑定解析；Codex adapter 负责进程级 extra roots、同名核心抑制和原生用户配置保留。Desktop IPC 与 Renderer 只调用受限领域 API。

Setup Readiness 拥有安装、更新、漂移恢复与清理确认。Engineering 是安装后管理投影，不调用安装或文件删除能力。

## 可信内置集合

内置集合来自 `BundledSkillCatalog.getCatalog()`。该方法只在 ArcOrbit 分发声明、Provider 安装关系和当前内容摘要一致且状态 ready 时返回 Skills；每项具有 `builtin:<skillName>`、安装目录、`SKILL.md` 路径、内容摘要、推荐 availability、qualifiedName 和 catalog 上下文。

`SceneSkillManager` 不扫描 `~/.codex/skills`、`~/.agents/skills`、项目 `.codex/skills`、项目 `.agents/skills` 或用户 catalog 的其他条目来构造 Engineering inventory。snapshot 和 mutation 因此共享同一可信内置集合，不存在仅靠 Renderer 过滤的旁路。

## 持久状态

应用数据目录保存 `engineering/scene-skills.json`，保持现有 v1 revision 与 Chat/Automation 场景键兼容。场景设置值为 `direct`、`on-demand`、`disabled`，旧 boolean 值分别归一化为 direct 和 disabled。

写操作要求当前 revision，并同时验证目标 id 以 `builtin:` 开头、目标存在于当前可信集合且 source 为 builtin。恢复默认只删除当前场景的 `builtin:*` 键。旧 `localPaths`、`knownSkills` 和非内置场景键可以被兼容读取，但不进入 snapshot、mutation 或运行绑定，也不会因恢复默认被改写。

## Engineering snapshot

snapshot 返回：

- 当前配置 revision 与内置 catalog 版本；
- Chat/Automation 的内置总数、直接发现数、按需使用数和停用数；
- 每个内置 Skill 的名称、说明、受信安装路径、安装状态、核心保护和两场景使用方式；
- 只与内置集合读取有关的错误。

snapshot 不返回用户、项目、本地目录或非随包 catalog 条目，也不返回它们的路径和错误。Renderer 仍对 `source === builtin` 做防御性过滤，避免不合约 payload 进入页面。

## 场景绑定

`resolveScene` 只从可信内置集合解析额外能力。binding 包含直接发现的内置 Skills、内置按需 qualifiedName 与摘要、全部内置名称和退役核心名称、未选内置路径及 catalogContext。Automation 缺少官方核心时失败关闭。

Codex adapter 将直接发现的内置目录设置为 `skills/extraRoots/set`，再读取工作区原生 `skills/list`。它只覆盖受管理内置同名项、明确停用的内置路径和 Codex 已经标记 disabled 的原生项；无关用户/项目 Skill 不进入 ArcOrbit binding，也不会被 ArcOrbit 启用或停用。受保护核心的用户同名副本仍由 managedNames 线程级关闭，文件保持不变。

## 按需边界

按需集合只包含 ArcOrbit 内置且当前场景设置为 on-demand 的 qualifiedName。`arcforge-on-demand` 直接发现时才提供只读 catalog 工具和同范围命令。list/resolve 都传入绑定时固定的 allowedSkills 与内容摘要；调用授权仍只来自用户显式调用或宿主程序显式配置。

用户 catalog 的其他条目不进入 Engineering 的按需集合。用户仍可通过其自行配置的 Codex 能力或其他明确入口管理这些来源，ArcOrbit 不复制第二份安装状态。

## 并发与恢复

SceneSkillManager 串行 mutation，revision 冲突拒绝陈旧保存。Chat 下一条消息解析新绑定，配置摘要变化时关闭空闲 adapter 并恢复原 thread；Automation 在 Run 启动时固定绑定。安装内容变化使旧 binding 摘要失效并要求重新解析，不把更新当成场景配置失败。

安装未 ready 时 `getCatalog()` 失败，Engineering 保留既有页面状态并提示返回 Setup Readiness。mutation 在 fresh inventory 上再次校验 id 和 source，防止伪造 IPC 操作非内置 Skill。

## 验证

领域测试覆盖可信 inventory、非内置排除、伪造 mutation 拒绝、默认恢复、核心保护、独立场景 revision 与 binding 校验。Renderer 测试覆盖混合 payload 防御、紧凑摘要、搜索、状态筛选、保存反馈和 Chat 返回。IPC 测试证明主窗口限制且不存在本地导入通道；Electron 测试检查实际内置列表、核心锁定、草稿保持与窄窗口布局。

Setup Readiness 的安装更新、来源替换审查、内容漂移和旧项目精确清理继续由既有 provisioning 与 migration 测试独立覆盖。
