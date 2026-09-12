# 技能安装与发现验证记录

本轮将 ArcOrbit 内置技能收敛到 ArcForge 用户 catalog 的稳定路径，并实现 direct / on-demand / disabled 场景配置。安装包含 Arckit 的 13 个技能及 ArcForge 的 arcforge-on-demand 入口；源码、来源记录与安装对象分别保留身份。未修改真实用户安装目录、未删除真实项目技能、未替换已安装的桌面应用。

本轮结果：ArcForge 46 项、ArcOrbit 123 项相关回归通过；真实 Codex 与桌面只读命令 3 项测试通过；类型检查、分发 smoke 和隔离 Electron 场景页面验证通过。

## 验证范围

- ArcForge 的安装计划、稳定路径更新、来源冲突、完整包摘要、事务回滚、共享关系移除、旧目录清理及 skill 契约检查。
- ArcOrbit 的场景默认值、使用方式切换、按需候选与 exact resolve 限制、旧线程只读命令（通过桌面 --arcforge-catalog 执行，不依赖 RunAsNode 或全局 CLI）、安装更新与任务活动独立、确认边界、renderer 和 adapter。
- 真实 Codex app-server：使用隔离 CODEX_HOME 与本地假模型服务，检查实际模型请求中的技能描述、动态工具和受限命令；没有调用真实模型推理。
- 分发 smoke：临时 home/project 验证先检查、确认安装、再次确认清理、普通 catalog 索引、共享资源及重复检查。
- Electron 场景页面使用隔离应用目录检查核心保护、替换、Chat 场景保存和草稿保留。

旧版本 catalog 字段仅保留读取兼容，新的安装不生成版本目录。旧目录只有在安装关系保存了完整包证据且无其他安装关系引用时才列为待删；修改、未知归属、链接均保留。本地安装不承担运行任务的技能切换策略，不检查 Chat / Automation 活动状态。

## Skill 维护后交接

正式维护源由 ArcForge Git 工作区确认。之前扩展 Agent 自主触发的方向已按用户纠正撤回，以文末“显式调用契约”为准。

## 2026-09-12：旧来源身份的无版本冲突修复

只读复现真实 catalog：`arckit-pending` 的当前来源标识为 `1cd26ade127a5deeb2614f83`，内置来源 `arckit` 对应 `689d11e356a6a690c808f74b`；内容摘要不同且缺少可排序的 SemVer。原适配层只展示阻断，没有接入 ArcForge 已有的显式来源选择。

现在检查会生成待确认的来源替换方案，显示原来源路径、新来源路径、标识、摘要和共享副本影响。ArcOrbit 仅构造 `catalogSourceSelections` 并交给 Provider 重新规划；用户确认后仍由 Provider 校验 fresh plan digest 并事务应用。ArcForge 将 catalog-only 模式下的来源选择校验扩展到所有已选 catalog 技能，兼容 direct 和 on-demand。漂移、链接、未知目标及其他阻断不会因来源选择被忽略；确认后内容变化使计划失效。清理仍单独确认。

验证：ArcOrbit 相关 86 项、补充清单渲染 3 项、ArcForge Provider/catalog 14 项通过（部分用例重叠）；新增真实 Provider 集成覆盖历史来源、缺失 SemVer、direct/on-demand、无确认不写入、本地修改保护、来源变化撤销确认以及最终确认安装。类型检查、语法检查、分发 smoke 通过。真实目录仅执行只读检查，结果从冲突变为待确认来源替换；没有安装、覆盖或清理真实技能。已重新生成本地 Provider 和分发资源，未替换已安装的桌面应用。

## 2026-09-12：恢复任务误阻断安装（此方案已撤回）

真实 store 中唯一被判定活动的对象是 `EXEC-39edd856-1903-4575-a9c4-6a0fba0b0301`，phase 为 recovery；关联 Run `RUN-20260911-094827203Z-9de08d28` 已于 `2026-09-11T09:51:07.499Z` 以 failed 结束。原 owner 投影把所有 active_executions 无条件算作活动进程。

技能更新入口现在向 owner 投影提供 RunManager 的实时 isRunActive；仅对已确认无活动 Run 的 recovery 记录解除阻断，缺少实时判据、启动中、运行中及 Chat 等待审批仍保守阻断。任务记录和恢复上下文保留。真正活动的 owner 在安装确认前展示，执行前再次检查；使用独立 `SKILL_UPDATE_ACTIVE_TASKS` 错误并列出类型和 ID。Automation 获取技能绑定前统一检查环境 ready，覆盖恢复重试启动路径。实际技能、任务记录和已安装桌面应用均未修改。

验证：owner/setup/renderer 106 项通过、1 项条件跳过；场景技能 19 项通过。覆盖恢复记录无活动 Run、恢复记录仍有活动 Run、未知运行态、启动中、Chat 等待审批及确认后的新活动任务。语法检查和 diff 空白检查通过。

## 2026-09-12：安装与任务执行解耦

用户纠正边界：技能安装更新属于本地环境，不能受 Chat 或 Automation 是否运行影响。撤回上一节恢复状态特判、SKILL_UPDATE_ACTIVE_TASKS 和额外的启动门禁；删除技能安装/清理入口的 activeOwners 依赖。Codex 可执行程序自身的升级保护属于另一条流程，本次不改。

仍通过 ArcForge 的计划摘要和显式确认执行安装与独立清理。既有绑定不被主动改写；Chat 下一轮和 Automation 新 Run 读取更新后的 catalog。旧绑定不能把新内容当成已验证的旧内容加载，冲突在使用侧提示重新解析；不宣称稳定目录能为任意 Agent 文件读取提供旧版本快照。

验证：105 项 setup/owner/renderer 测试通过、1 项条件跳过；新增真实 Provider 集成测试通过，验证安装和确认清理均不读取任务活动状态、安装不隐式清理、旧绑定保持原值、旧按需绑定在加载时报告变化、新绑定成功加载更新技能。语法检查和 diff 检查通过。未更新真实技能或替换桌面应用。

## 2026-09-12：显式调用契约

维护模式：修复正式 Skill 项目中的通用工具集成 skill。目标与工作副本均为相邻 ArcForge Git 仓库的 skills/arcforge-on-demand。正文保持显式调用后的查询、语义选择、exact resolve 和单技能加载；宿主协议细节留在 ArcOrbit 上下文。metadata 设置 allow_implicit_invocation: false。不新增自动触发器、关键词路由或技能发现流程，也不把 direct/on-demand 配置视为调用授权。

代表性场景：用户显式指定技能；用户显式调用入口并给出任务意图；Runtime 配置特定场景的显式调用；没有入口调用的普通任务即使缺少能力也不得查询。候选选择可以由 Agent 判断，入口触发不由 Agent 自主决定。

post_maintenance_handoff:
  recommended_next_step: verify_with_skill_first
  reason: "已修正触发契约和宿主提示，建议隔离验证显式调用与普通任务的区别。"
  formal_source_path: /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/skills/arcforge-on-demand
  working_copy_path: /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/skills/arcforge-on-demand
  maintenance_source_path: /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arcforge/skills/arcforge-on-demand
  validation_required: true
  governance_required: false
  arcforge_action_hint: none
  user_confirmation_required: false

可选验证：在临时 home/catalog 中执行以上四种场景，观察显式调用后选择正确技能，普通任务不查询，禁用范围不能绕过。只允许临时目录写入，不修改真实 catalog。已执行本地契约测试，未执行独立 Agent 语义验证；未覆盖已安装副本，分发和同步仍走既有计划确认流程。
