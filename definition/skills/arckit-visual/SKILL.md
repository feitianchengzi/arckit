---
name: arckit-visual
description: "查询、创建、更新或审计 arckit/visual/ 的视觉策略、Tokens、组件和主题，也支持候选风格探索、比较及采纳整合。维护视觉预期，不自行批准审美方向。"
---

# ArcKit Visual

维护视觉预期事实，风格策略是源，Tokens、组件、主题和样式预览是投影。遵循 INDEX 驱动、域归属和渐进式披露。有效预期持续维护，生产代码和截图只提供观察证据。

## 边界

- 正式视觉事实位于 `arckit/visual/`；候选隔离到 `_explorations/`，不混入正式策略、索引条目或验收要求。
- 业务页面完整呈现由 interaction 的可交互原型承载，visual 维护系统规范和组件预览，不另外维护一套正式页面。
- 用户已有明确选择或既有视觉依据时直接落实；无依据的品牌方向、审美和组件性格不能由 Agent 静默批准。可以先制作候选，不能先把假设写成正式策略。
- 本 skill 写入限 visual；原型消费和同步通过明确引用交接，不隐式调用另一 skill，不私自修改交互行为。

## 工作流

### 1. 识别意图与上下文

区分查询、正式维护、探索比较、采纳整合，不强制每次多方案。
有 `case_gap` 时先读 [Case Gap Contract](../_arckit_shared/case-gap-contract.md) 并基于完整上下文进入 managed-case，否则 standalone。只回传结果，不写 Case/Project State、不规定下一 gap。
查询从 INDEX 按需定位；查询候选另读探索索引，查询不执行写入。

### 2. 判断归属和依据

读取 INDEX、目标视觉域、用户输入和相关交互预期。正式同域材料默认并入，职责分化才拆分。首次创建或结构调整读 [结构与格式](references/design-system-structure.md) 和 [索引分析](references/index-analysis.md)。
探索与采纳先读 [探索与采纳](references/exploration.md)，确定基线、候选落点和待决定问题。联合探索引用交互主题，不复制一套比较记录。

### 3. 确认风格源

读取 `_library/brief.md` 的视觉策略，判断：
- 投影变更：品牌气质、层级、色彩角色、字体节奏、密度、组件性格和状态表达不变，更新相应规范产物。
- 源变更：上述策略变化，先更新 brief，再同步规范和预览。
- 源缺失：先补足有依据的策略；缺少依据时探索或返回待决定项，不编造确认。
正式正文遵守 [内容规范](../_arckit_shared/content-spec.md)，使用陈述式描述有效预期；候选比较与采纳历史留在探索区。

### 4. 维护与整合

按 [操作步骤](references/operations.md) 更新策略、Tokens、组件、主题与预览。首次初始化可用 `scripts/init-design-system.sh`，骨架和模板默认值不代表已获批准。
采纳支持整案或分项组合，核对当前基线后形成完整规范，不把候选拼装判断留给实施者。用户已授权的选择直接落地，尚未决定的取舍先交付比较材料。

### 5. 验证与消费者同步

检查 brief、Tokens、组件、主题和预览一致，组件引用有效，关键状态/主题可查看。运行现有预览检查，记录实际验证和未验证项；截图不能证明业务行为。
每次视觉变更或收到交互原型缺口时读 [原型消费与同步](references/prototype-consumers.md)：明确引用关系、映射更新和受影响页面，交接未完成的跨域同步，不声称全部完成。
更新 INDEX、受影响关系和 feature-matrix；纯探索只更新探索索引。有效预期不因上线归档，废弃材料才按操作步骤归档。

## 输出

输出前读取 [设计产物结果契约](../_arckit_shared/design-result-contract.md)，按精确格式返回 document_scope、适用的 fact_result 和 exploration_result。
正式事实判断沿用 Case Gap Contract v2；纯探索且没有正式事实判断时 fact_result 为 null。区分产物完成、正式事实影响和当前目标必需的人工决定；未来采纳尚未决定不等于本轮探索受阻。
跨域同步由同一 Agent 在当前授权和 selected gap 内组织，交接不要求另开角色、轮次或 gap；独立新取舍回传 Agent 判断，不自动扩展本轮。
汇报产物与预览入口、依据、实际验证和未验证项、跨域影响及剩余工作；skill 不决定 gap/Case 完成或 Loop 续轮。
