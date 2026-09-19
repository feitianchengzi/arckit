---
name: arckit-interaction
description: "查询、创建、更新或审计 arckit/interaction/ 的交互策略、可交互原型和说明，也支持交互候选方案探索、比较及采纳整合。维护软件预期事实，不把原型模拟或生产现状当作已确认要求。"
---

# ArcKit Interaction

维护页面级交互预期。交互策略是源，可交互原型与交互说明是投影；遵循 INDEX 驱动、页面归属和渐进式披露。上线不终止预期维护，生产实现只提供证据。

## 边界

- 正式交互事实保持在 `arckit/interaction/` 的页面目录；候选放在 `_explorations/`，不混入正式策略、索引条目或验收要求。
- 原型必须包含可操作路径，同时保留 `interaction.md`。允许本地模拟数据和状态逻辑，不连接真实业务执行，不声称模拟成功证明生产契约。
- 有适用的正式视觉规范时遵守该规范；没有时采用极简灰度线框。候选视觉只能在探索中应用。
- 视觉方向、Tokens 和组件规范归 `arckit/visual/`；本 skill 使用并报告缺口，不私自建立第二套视觉事实。
- 候选、截图、代码和外部 handoff 都是输入证据，不能自动变成正式事实。用户已明确的选择直接落实；未确认的方向取舍不由 Agent 静默决定。

## 工作流

### 1. 识别意图与上下文

区分查询、正式维护、探索比较、采纳整合；不强制每次设计都做多方案。
有 `case_gap` 时先读 [Case Gap Contract](../_arckit_shared/case-gap-contract.md) 并结合完整上下文进入 managed-case；否则 standalone。只回传事实结果，不写 Case/Project State、不规定后续 gap。
查询从 INDEX 按需读取，包含候选查询时再读探索索引，不执行写入。

### 2. 确定归属与依据

读取 `arckit/interaction/INDEX.md`、目标页策略、相关产品事实和适用视觉规范。变更前读 [索引与拆分](references/index-analysis.md)。已有页面默认并入；跨页分别归属并记录导航关系。`_explorations/`、`_shared/`、`_map/`、`_archive/` 是基础设施，不是业务页面。
探索或采纳时读取 [探索与采纳](references/exploration.md)；先确定候选基线与写入范围，再创建产物。未确认事项可以形成探索材料，不能为此强行建立正式页面。

### 3. 确认策略与视觉依据

正式维护判断：
- 投影变更：主任务、路径、状态流、反馈和边界不变，更新相应投影。
- 源变更：上述规则变化，先更新 `interaction.md` 的交互策略，再同步原型与说明。
- 源缺失：先补足有依据的交互策略；缺少依据时保留问题，不编造确认。

读取 [原型与视觉应用](references/wireframe-style.md)，记录适用视觉来源和主题。缺失组件沿用有依据的通用规则，无法确定的列为视觉缺口；正式原型不能偷偷使用候选视觉。

### 4. 制作或更新产物

按 [操作步骤](references/operations.md) 维护完整入口 `default.html`、`interaction.md` 及必要的本地脚本、样式和场景。初始化使用 `scripts/new-page-design.sh`，支持 iOS / iPad / macOS / Web / Desktop。
关键输入、选择、导航、弹层和状态变化可连续操作；异常状态可重复触达。复杂原型拆分代码资源而不把入口降为占位骨架。平台语义有歧义时参考 [data-kit 映射](references/data-kit-mappings.md)。
采纳组合方案时形成完整正式稿，不能留下“布局参考 A、行为参考 B”的拼装指令。正式正文遵守 [规格内容规范](../_arckit_shared/content-spec.md)。

### 5. 验证与同步

按 [操作步骤中的验收清单](references/operations.md) 实际操作主路径、恢复路径、键盘和窄窗，检查视觉引用、草稿/焦点/阅读位置连续性、模拟边界及说明一致性。未运行的检查明确报告，不凭截图宣称行为通过。
更新 INDEX、受影响的 `_map/RELATIONS.md` 和 feature-matrix；纯探索只登记探索索引，不把候选写成正式覆盖。视觉缺口或变更影响通过明确引用交接给 visual，不隐式调用另一 skill。

## 输出

输出前读取 [设计产物结果契约](../_arckit_shared/design-result-contract.md)，按精确格式返回 document_scope、适用的 fact_result 和 exploration_result。
正式事实判断沿用 Case Gap Contract v2；纯探索且没有正式事实判断时 fact_result 为 null。区分产物完成、正式事实影响和当前目标必需的人工决定；未来采纳尚未决定不等于本轮探索受阻。
跨域同步由同一 Agent 在当前授权和 selected gap 内组织，交接不要求另开角色、轮次或 gap；独立新取舍回传 Agent 判断，不自动扩展本轮。
汇报产物与预览入口、依据、实际验证和未验证项、跨域影响及剩余工作；skill 不决定 gap/Case 完成或 Loop 续轮。
