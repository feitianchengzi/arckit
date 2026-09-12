# State Driven Loop 能力合并与验证

用户确认的目标：合并 using-arckit 和 arckit-development-ledger，最终名称为 arckit-state-driven-loop；整体整理架构与内容，保留通过逐轮 Gap 推进 Project State 的核心选择。

## 实现边界

- 正式维护源：entry/skills/arckit-state-driven-loop；原有两个包合并为一个，Ledger scripts/schema 迁入包内，保留此前 semantic review-finding 修复。
- 同一 manifest 提供 agent_skill invocation（agent_loop/task_closeout）和 runtime_entrypoints。policy 允许同一包绑定两种接口，仍拒绝同一 binding 内重复 id；trusted script 来源和路径包含校验保持。
- SKILL.md 重新组织为恢复状态、绑定 Case、选 Gap、执行、可信提交/fresh-read、Review 与交接。metadata 只给紧凑入口，manifest 只承担机器接口，协议细节按需披露；删除重复会话流程与重复恢复文件。
- Runtime closeout prompt 改为 manifest trigger、phase、可信完成事实、任务范围来源与授权；Git 收尾方法迁入 skill reference。没有改变收尾政策、Review budget、单 Gap 验收或持久 thread。
- 分发只携带一个完整核心包；场景开关不再维护双 skill 联动。旧 Chat 选择兼容到新身份，新配置优先；旧入口在当前场景禁用，不仅凭名称删除用户文件。
- 当前架构规格、技术说明、交互引用、README 和 AGENTS 已更新；历史 Case/记录保留旧名字，不改写历史证据。

## 验证结果

- 完整 `npm run check --workspace @arckit/arcorbit` 完成语法检查与 722 项测试：首次 688 通过、30 跳过、4 失败。
- 两项断言已修正并复测：旧 Case 测试不再要求 Runtime 强迫创建 Case；升级测试按 macOS realpath 比较路径。Case transition 17 项全部通过；场景/能力复测中的其余 18 项通过。
- 两项 Electron 启动失败经授权在沙箱外复测均通过：experience-realization 与 task-replacement-sheet。上述四项失败均有成功复测，30 项条件跳过未宣称通过。
- 分发 fixture 校验实际载荷、校验和、单包可信入口；semantic command、协议恢复、原子记账、同线程 Loop、Review/finding/修复相关测试均通过。
- 包内 JSON 可解析、Markdown 引用存在、git diff --check 通过。
- 未执行真实隔离 Agent 行为实验；源码改动不代表已更新用户安装技能或当前运行的 ArcOrbit 应用。

## 维护后交接

使用 arcforge-skill-creator：本任务是混合能力的合并维护，已有 scripts/schema 是确定性承载；无需新造 Ledger、增加语义路由或引入第二 Agent。场景覆盖普通开发逐轮推进、停止后恢复、Review finding 后修复、协议不兼容恢复，以及旧版场景偏好升级。

```yaml
post_maintenance_handoff:
  recommended_next_step: verify_then_sync
  reason: 合并影响 Agent 入口和渐进式协议读取；确定性回归已验证，隔离 Agent 行为与安装分发需独立验证。
  formal_source_path: entry/skills/using-arckit + entry/skills/arckit-development-ledger
  working_copy_path: entry/skills/arckit-state-driven-loop
  maintenance_source_path: entry/skills/arckit-state-driven-loop
  validation_required: true
  governance_required: true
  arcforge_action_hint: drift
  user_confirmation_required: true
```

本仓库是已确认的正式 Skill 维护源，本轮直接在维护源完成用户授权的合并。交接的确认要求只针对后续隔离执行和安装目标覆盖，不表示本次源码维护尚待批准。

可选 Skill First 验证：在独立临时项目中用新 skill 完成“调查缺陷 -> 接受原因 -> 下一 Gap 修复 -> Review finding -> 下一 Gap 修复 -> clean”，随后验证停止/恢复。仅允许写隔离项目，观察单 Gap 因果边界、按需 reference 读取、typed refs 和 receipt 后 fresh-read。临时路径建议使用 OS tmpdir 下唯一目录，不把它作为生产 evidence。

ArcForge 治理输入：以上维护源；应用目标尚未选择。先审计结构并检查实际安装副本 drift，再按明确目标执行更新；本次未 apply/share/push，未覆盖安装副本。

## Completion Review 修复

第一轮审查发现规格索引摘要仍写双能力 policy。可信 Review 已派生独立修复 Gap；post-commit fresh-read 后修正摘要为单包双接口，并更新相应行数。检索现行架构入口未再发现双包 policy 描述。最后场景和能力回归 18/18 通过，Case transition 回归 17/17 通过。
