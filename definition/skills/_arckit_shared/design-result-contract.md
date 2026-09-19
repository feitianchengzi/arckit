# 交互与视觉产物结果契约

供 arckit-interaction / arckit-visual 输出时读取。document_scope 记录文件操作；fact_result 记录正式事实判断；exploration_result 记录候选工作。三者均不是 Loop transition，不决定 gap 或 Case 完成。

## document_scope

```yaml
document_scope:
  scope_kind: change
  root: arckit/interaction/
  created:
    - path: _explorations/navigation/exploration.md
      source_basis: 用户要求比较两种导航方式，未要求采纳
      summary: 两套候选的入口、基线和比较
  updated: []
  deleted: []
  reorganized: []
```

- scope_kind 只取 query / change；候选文件的写入也算 change，但不意味着正式事实更新。
- root 为项目相对路径，取 arckit/interaction/ 或 arckit/visual/。path 为相对于 root 的文件路径，不包含 root 前缀，不越过所属域。
- 查询使用 paths 数组，每项必须有 path、summary；不输出 created/updated/deleted/reorganized。
- 变更使用 created/updated/deleted 数组，每项必须有 path、source_basis、summary；source_basis 写用户要求、策略或采纳依据，不能用候选冒充正式策略。
- reorganized 每项包含 from_paths、to_paths（均为相对 root 的数组）、source_basis、summary；对应物理增删改仍列入前述数组。
- 空数组可省略或写 []。归档在 deleted 中列原路径、created 中列新路径；summary 说明归档目标及依据。
- 跨域操作分别输出两个域的 document_scope，不能把另一个域的路径混进本域 root。当前 Agent 汇总，不引入新执行角色。

## exploration_result

存在探索或采纳工作时输出：

```yaml
exploration_result:
  mode: managed_case
  case_id: CASE-YYYYMMDD-NNN
  gap_id: GAP-example
  objective: 制作并比较两种导航方案
  artifact_status: complete
  formal_fact_effect: none
  artifacts:
    - path: arckit/interaction/_explorations/navigation/exploration.md
      status: 候选
      basis_refs: [arckit/interaction/navigation/interaction.md]
      baseline: 当前正式策略的版本或内容摘要
      evidence: 已检查两个入口和同一任务路径，比较记录完整
  decision:
    required_for_current_objective: false
    question: 最终采纳哪个方案
    basis: 本次仅要求提供候选与比较，尚不要求采纳
  adoption: []
  remaining_work: []
fact_result: null
```

- mode 为 managed_case / standalone；standalone 的 case_id 和 gap_id 为空。managed-case 使用输入绑定，不自行生成或更新 Case revision。
- artifact_status 为 complete / partial / blocked，只描述本次受托产物目标；不是整个设计、gap 或 Case 的完成状态。
- formal_fact_effect 为 none / confirmed_existing / updated；它必须与正式事实判断一致，不由候选数量或文件写入推断。
- artifacts 的 path、basis_refs 为项目相对路径；每项列候选状态、基线及实际证据。没有正式基线时明确尚无，引用用户输入依据，不编造版本。
- decision 指出是否需要用户决定才能满足当前目标。问题仅影响未来采纳时，required_for_current_objective 为 false，不把本轮探索报告成被人工阻塞。
- adoption 每项列 source_refs、adopted_parts、excluded_parts、decision_basis、target_paths。部分采纳后正式产物仍须完整；未完成部分记 remaining_work。
- 纯探索且没有正式事实判断时 fact_result 为 null。既不把候选报为 updated，也不以 not_applicable 声称该事实域无关。
- 正式事实已更新或已确认时，仍使用 Case Gap Contract 的 arckit-fact-result/v2，附非空事实、依据和证据。
- 当前目标要求确定正式方向、但缺少必要用户选择时，fact_result 使用 needs_human；候选产物仍可 complete。当前目标未要求选择时，不因未来选择自动使用 needs_human。
- 已更新部分正式事实但另一部分待决定时，fact_result 可报告实际 updated，unresolved 与 human_decision_required 如实列出当前必要决定，exploration_result 不得宣称全部采纳完成。
- 探索自身因输入或工具缺失而受阻时，用 artifact_status: blocked 和 remaining_work 说明原因；没有正式事实判断仍用 fact_result: null，不伪造事实判断。

## 与 Loop 的边界

同一 Agent 根据当前目标和证据判断 gap 是否满足验收，决定 partial、提交或人工交接。设计 skill 的 complete、needs_human 或跨域待同步不能直接转换成 gap resolution。
跨域交接只是事实归属、输入输出和剩余义务的说明。同一已授权结论涉及视觉规范与原型时，Agent 可以在同一 gap 内显式使用两个 skill 完成同步；skill 不强制另开线程、角色、轮次或 gap。若出现新的独立设计取舍，回传问题，由 Agent 按 Loop 判断后续安排。
