# Engineering 内置 Skills 管理

状态：✅ 已实现

## 目标与范围

Engineering 是 ArcOrbit 内置 Skills 的安装后管理页面，管理本机 Chat 与 Automation 两个场景对随包 Skills 的使用方式。页面只展示由当前 ArcOrbit 分发资源和受信 ArcForge 安装关系共同证明的内置 Skills。

用户自行安装的用户级、项目级、on-demand catalog 或本地目录 Skills 不进入 Engineering 的列表、计数、搜索、错误提示或写操作。它们继续遵循 Codex 自身的发现和配置，不被 Engineering 启用、停用、替换、导入或删除。若非可信副本与内置 Skill 同名，运行绑定按既有可信来源规则在当前线程抑制该副本；这不是页面管理动作，不修改其文件或 Codex 全局配置。Engineering 不写项目，不修改 Project/Case 模型，也不为 Gap 预绑定技能。

## 安装后身份

内置 Skill 使用 `builtin:<skillName>` 稳定身份。身份来自 ArcOrbit 当前分发包声明的精确技能路径、来源清单、catalog v2 安装条目及内容摘要，不按名称前缀、description 或用户目录同名副本推断。

Setup Readiness 负责内置 Skills 的首次安装、更新、内容漂移恢复和旧项目受管理副本清理。Engineering 只消费已验证安装结果；安装未完成、更新待确认或内容冲突时，页面显示整体读取失败并引导用户返回环境检查，不提供绕过安装门禁的操作。

## 场景集合

每个内置 Skill 在 Chat 与 Automation 中分别配置为直接发现、按需使用或停用。直接发现把受信安装目录加入当前场景的 Agent 根；按需使用只把受信 qualifiedName 和内容摘要加入显式调用范围；停用不向该场景提供该内置 Skill。

`arcforge-on-demand` 是 ArcForge Provider 随 ArcOrbit 提供的内置入口，默认直接发现，可以停用，不能设置为按需加载自身。该入口只在用户显式调用或宿主程序显式配置调用时工作；可见、已安装或位于按需集合均不构成调用授权。

Automation 固定直接发现官方 `arckit-state-driven-loop`，不能停用或替换。Chat 可独立配置该官方核心。所有场景拒绝第三方同名核心覆盖，但该保护不把用户同名目录纳入 Engineering 管理。

## 页面与操作

页面在同一紧凑工作区中提供：

- Chat / Automation 场景切换与生效时机说明；
- 内置总数、直接发现、按需使用和已停用数量；
- 按名称或说明搜索，以及按当前使用状态筛选；
- 每行名称、简述、安装状态、可展开安装路径和使用方式；
- 单项使用方式保存、场景默认恢复、刷新和错误重试。

页面没有来源筛选、本地目录导入、第三方替换或用户 Skill 删除入口。无匹配结果只表示当前搜索或状态筛选没有命中内置 Skill，不建议添加本地来源。

## 生效与执行

Chat 在下一条消息边界读取新的内置 Skill 配置，必要时重建 app-server 并恢复同一 thread；历史内容保持不变。Automation Run 在启动时固定配置，续轮、修复、压缩与 Git closeout 使用同一绑定；下一次 Run 才读取新配置。

场景绑定只列出 ArcOrbit 内置 Skills、受管理名称、内置停用路径及内置按需范围。Codex 用户级和项目级 Skills 由原生 inventory 决定；ArcOrbit 不把它们加入额外 roots 或按需范围，也不改变无同名冲突条目的原生可用性。与内置或退役核心同名的非可信副本只在当前线程被抑制，以保证绑定身份和页面选择成立；其安装文件及全局配置保持不变。

## 持久化与恢复

应用数据目录保存 `engineering/scene-skills.json`。保存使用 revision 防止陈旧覆盖，并只接受 `builtin:*` 变更。旧配置中本地路径、已知第三方 Skill 或非内置场景键不会进入页面和场景绑定；恢复默认只清除当前场景的内置配置，不改写这些外部来源或 Codex 全局配置。

读取失败保留搜索和场景选择，页面显示可重试错误。保存失败保留当前列表与用户选择，revision 冲突要求刷新后重新操作。Chat 快捷入口进入 Chat 场景，返回后原会话和草稿保持。

## 旧项目副本清理

旧项目受管理副本清理属于 Setup Readiness。环境检查先生成精确清单，用户查看完整路径和原因并明确确认后才删除；第三方、归属不明、内容已修改、链接目录和无可靠历史证据的目标全部保留。Engineering 不展示或执行该清理。

## 验收

- snapshot、计数、搜索、筛选和错误信息只包含可信 `builtin:*` Skills。
- Renderer 即使收到混合来源 payload 也只投影内置 Skills；直接 IPC 写入非内置 id 被拒绝。
- 页面不存在本地导入、第三方替换、来源筛选或用户 Skill 删除入口。
- Chat 与 Automation 分别保存内置使用方式；Automation 核心始终锁定，恢复默认只影响内置配置。
- 无内置同名冲突的用户级和项目级 Skills 保持 Codex 原生可用性；同名副本只受运行信任边界的线程级抑制，Engineering 操作不修改其全局配置或文件。
- 紧凑列表、摘要计数、搜索、状态筛选、键盘焦点、窄窗口布局、加载和失败恢复具有行为级验证。
