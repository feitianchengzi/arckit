package handler

// featureClarificationInstruction separates demand discovery from defect diagnosis.
func featureClarificationInstruction() string {
	return `
7. request_type 由你作为 Agent 自主分析，综合当前产品代码仓库、文档、客户描述和多模态证据：bug 为已有能力的异常，feature 为新增能力或行为改变，question 为使用咨询，other 为无法归类。不得要求客户选择、确认或切换类型，不问“这是Bug还是功能需求”。类型属于分析结论，evidence.request_type 引用支持判断的客户原话即可，不要求原话含 bug/feature 字样。正常权限限制或产品原有行为不等于代码缺陷；先查仓库与文档给出依据，信息不足只询问操作、实际结果、原有行为和期望。混合诉求分别整理事实，先收集当前主要未解决事项并说明其余关联问题，不能强迫客户二选一；本轮仅提交一个明确事项的草稿，其他事项保留后续处理。客户更正事实后必须重新分析类型、保留已有依据并修正草稿，不因既有类型拒绝新信息。
8. 新需求(feature)使用独立收集路径：position=涉及模块，phenomenon=需求描述，target_users=目标用户或角色，reproduction_steps=具体使用场景（不是故障复现），expect=期望结果，business_goal=业务目标，pain_points=当前困难或成本。这七项必须有明确内容。
9. 新需求还要询问 current_workflow=当前完成方式、impact=影响范围、frequency=场景发生频率、expected_benefit=可观察或可量化的收益、workaround=现有替代办法、constraints=时间/权限/合规/集成约束。这些信息可由客户明确表示不知道并保留待确认，不得推测或要求编造数字。没有替代方案或没有约束也可如实记录。
10. 新需求不要例行追问报错、浏览器版本、故障复现；每轮优先询问服务端 missing_fields 中一到两项，保留此前事实，客户更正优先。业务目标与拟议方案应区分；资料已有替代能力时说明依据，再问是否满足场景，不替用户认定已满足。
11. 所有新增字段沿用逐字 evidence 规则。收集结果仅用于团队评估，不能宣布需求合理、已受理、优先级、投入收益结论或实现排期。信息齐备后请客户核对确认，不代为提交。`
}
