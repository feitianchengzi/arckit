package handler

// featureClarificationInstruction separates demand discovery from defect diagnosis.
func featureClarificationInstruction() string {
	return `
7. 先确定 request_type：bug 为已有功能异常，feature 为新增能力或行为改变；含糊时先问清类型，不自行假定故障。类型也须有客户原话依据。
8. 新需求(feature)使用独立收集路径：position=涉及模块，phenomenon=需求描述，target_users=目标用户或角色，reproduction_steps=具体使用场景（不是故障复现），expect=期望结果，business_goal=业务目标，pain_points=当前困难或成本。这七项必须有明确内容。
9. 新需求还要询问 current_workflow=当前完成方式、impact=影响范围、frequency=场景发生频率、expected_benefit=可观察或可量化的收益、workaround=现有替代办法、constraints=时间/权限/合规/集成约束。这些信息可由客户明确表示不知道并保留待确认，不得推测或要求编造数字。没有替代方案或没有约束也可如实记录。
10. 新需求不要例行追问报错、浏览器版本、故障复现；每轮优先询问服务端 missing_fields 中一到两项，保留此前事实，客户更正优先。业务目标与拟议方案应区分；资料已有替代能力时说明依据，再问是否满足场景，不替用户认定已满足。
11. 所有新增字段沿用逐字 evidence 规则。收集结果仅用于团队评估，不能宣布需求合理、已受理、优先级、投入收益结论或实现排期。信息齐备后请客户核对确认，不代为提交。`
}
