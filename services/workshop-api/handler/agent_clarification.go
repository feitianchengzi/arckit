package handler

import (
	"encoding/json"
	"strings"
)

// AgentClarification is a recoverable draft, not a product decision or user confirmation.
type AgentClarification struct {
	Status         string                 `json:"status"`
	Summary        AgentStructuredSummary `json:"summary"`
	MissingFields  []string               `json:"missing_fields"`
	Questions      []string               `json:"questions"`
	ReadyToConfirm bool                   `json:"ready_to_confirm"`
}
type clarificationField struct {
	key, question string
	value         func(*AgentStructuredSummary) *string
	core          bool
}

var clarificationFields = []clarificationField{
	{"request_type", "请描述具体操作、实际发生的情况和期望结果。", func(s *AgentStructuredSummary) *string { return &s.RequestType }, true},
	{"position", "问题发生在哪个页面或模块？", func(s *AgentStructuredSummary) *string { return &s.Position }, true},
	{"phenomenon", "实际发生了什么？请描述具体表现或报错。", func(s *AgentStructuredSummary) *string { return &s.Phenomenon }, true},
	{"expect", "你期望得到什么结果？", func(s *AgentStructuredSummary) *string { return &s.Expect }, true},
	{"reproduction_steps", "按什么操作步骤可以重现？无法复现时请明确说明。", func(s *AgentStructuredSummary) *string { return &s.ReproductionSteps }, false},
	{"environment", "使用什么设备、浏览器或应用版本？不清楚的部分可以说不知道。", func(s *AgentStructuredSummary) *string { return &s.Environment }, false},
	{"impact", "这个问题影响了哪些工作或用户？", func(s *AgentStructuredSummary) *string { return &s.Impact }, false},
	{"frequency", "发生频率如何，是每次还是偶发？", func(s *AgentStructuredSummary) *string { return &s.Frequency }, false},
	{"business_goal", "这个需求想解决什么业务目标？", func(s *AgentStructuredSummary) *string { return &s.BusinessGoal }, false},
	{"workaround", "目前有什么替代办法？", func(s *AgentStructuredSummary) *string { return &s.Workaround }, false},
	{"target_users", "哪些用户或角色会使用这个功能？", func(s *AgentStructuredSummary) *string { return &s.TargetUsers }, false},
	{"current_workflow", "目前如何完成这项工作？不清楚可以明确说不知道。", func(s *AgentStructuredSummary) *string { return &s.CurrentWorkflow }, false},
	{"pain_points", "现有方式有哪些具体困难或成本？", func(s *AgentStructuredSummary) *string { return &s.PainPoints }, false},
	{"expected_benefit", "期望带来什么可观察或可量化的收益？不清楚可以明确说明。", func(s *AgentStructuredSummary) *string { return &s.ExpectedBenefit }, false},
	{"constraints", "有哪些时间、权限、合规或集成限制？没有或不清楚请明确说明。", func(s *AgentStructuredSummary) *string { return &s.Constraints }, false},
}

func latestClarification(history []AgentMessageRecord) *AgentClarification {
	for i := len(history) - 1; i >= 0; i-- {
		if history[i].SenderType != "agent" || history[i].Metadata == nil {
			continue
		}
		var meta struct {
			Clarification *AgentClarification `json:"clarification"`
		}
		if json.Unmarshal([]byte(*history[i].Metadata), &meta) == nil && meta.Clarification != nil {
			return meta.Clarification
		}
	}
	return nil
}
func buildClarificationContext(query string, history []AgentMessageRecord) string {
	if state := latestClarification(history); state != nil {
		raw, _ := json.Marshal(state)
		return query + "\n\n以下是服务端保存的待确认澄清草稿，保留有依据的信息、结合本轮客户原话修正并继续询问缺失信息，不能视为用户已确认：\n" + string(raw)
	}
	return query
}
func containsField(fields []string, key string) bool {
	for _, v := range fields {
		if v == key {
			return true
		}
	}
	return false
}
func isUnknownAnswer(v string) bool {
	for _, phrase := range []string{"不知道", "不清楚", "无法确定", "不确定", "不了解", "无法复现", "无法重现", "不适用"} {
		if strings.Contains(v, phrase) {
			return true
		}
	}
	return false
}
func isPlaceholder(v string) bool {
	switch strings.TrimSpace(v) {
	case "", "未知", "未提供", "待确认", "待补充", "不详", "unknown", "N/A", "null":
		return true
	}
	return false
}
func customerEvidence(history []AgentMessageRecord, quote string) bool {
	quote = strings.TrimSpace(quote)
	if quote == "" {
		return false
	}
	for _, m := range history {
		if m.SenderType == "customer" && strings.Contains(m.Content, quote) {
			return true
		}
	}
	return false
}

// New model claims require a verbatim customer quote; readiness is computed locally.
func mergeClarification(previous *AgentClarification, candidate *AgentStructuredSummary, history []AgentMessageRecord) *AgentClarification {
	state := &AgentClarification{Status: "collecting", MissingFields: []string{}, Questions: []string{}}
	if previous != nil {
		raw, _ := json.Marshal(previous.Summary)
		_ = json.Unmarshal(raw, &state.Summary)
	}
	if state.Summary.Evidence == nil {
		state.Summary.Evidence = map[string]string{}
	}
	if state.Summary.UnknownFields == nil {
		state.Summary.UnknownFields = []string{}
	}
	if candidate != nil {
		for _, f := range clarificationFields {
			value := strings.TrimSpace(*f.value(candidate))
			quote := strings.TrimSpace(candidate.Evidence[f.key])
			if quote == "" && customerEvidence(history, value) {
				quote = value
			}
			if !customerEvidence(history, quote) {
				continue
			}
			unknown := containsField(candidate.UnknownFields, f.key) && isUnknownAnswer(quote)
			if unknown && !isCoreClarificationField(state.Summary.RequestType, f.key) {
				*f.value(&state.Summary) = ""
				if !containsField(state.Summary.UnknownFields, f.key) {
					state.Summary.UnknownFields = append(state.Summary.UnknownFields, f.key)
				}
				state.Summary.Evidence[f.key] = quote
				continue
			}
			if isPlaceholder(value) || isUnknownAnswer(value) {
				continue
			}
			if f.key == "request_type" && value != "bug" && value != "feature" && value != "question" && value != "other" {
				continue
			}
			*f.value(&state.Summary) = value
			state.Summary.Evidence[f.key] = quote
			filtered := state.Summary.UnknownFields[:0]
			for _, key := range state.Summary.UnknownFields {
				if key != f.key {
					filtered = append(filtered, key)
				}
			}
			state.Summary.UnknownFields = filtered
		}
	}
	if !validClarificationRequestType(state.Summary.RequestType) {
		state.MissingFields = []string{"request_type"}
		state.Questions = []string{"你在哪个页面进行了什么操作，实际发生了什么？", "原来如何完成这项工作，你期望得到什么结果？"}
		return state
	}
	for _, f := range clarificationFields {
		if isRequiredClarificationFieldForType(state.Summary.RequestType, f.key) && isPlaceholder(*f.value(&state.Summary)) && (isCoreClarificationField(state.Summary.RequestType, f.key) || !containsField(state.Summary.UnknownFields, f.key)) {
			state.MissingFields = append(state.MissingFields, f.key)
			if len(state.Questions) < 2 {
				state.Questions = append(state.Questions, clarificationQuestion(state.Summary.RequestType, f))
			}
		}
	}
	state.ReadyToConfirm = len(state.MissingFields) == 0
	if state.ReadyToConfirm {
		state.Status = "ready"
	}
	return state
}
func applyClarification(response *AgentResponse, history []AgentMessageRecord) {
	previous := latestClarification(history)
	if previous == nil && response.Resolution == "answered" && !response.NeedCollect {
		response.Structured = nil
		return
	}
	candidate := mergeClarification(nil, response.Structured, history)
	groundedReport := candidate.Summary.Phenomenon != "" && (candidate.Summary.Expect != "" || candidate.Summary.RequestType == "bug" || candidate.Summary.RequestType == "feature")
	if previous == nil && !groundedReport && !response.NeedCollect && !shouldMarkAgentMessageUnresolved(response.Confidence, response.Content) {
		response.Structured = nil
		return
	}
	state := mergeClarification(previous, response.Structured, history)
	response.Clarification = state
	response.Structured = &state.Summary
	response.NeedCollect = true
	if state.ReadyToConfirm {
		response.Content = "信息已整理，请检查下方结构化草稿，修正后确认提交。尚未创建反馈，优先级和实现方案由团队评估。"
	} else {
		// The model may claim completeness while the evidence gate rejects a
		// field. Present the server's actual state and only its bounded questions.
		response.Content = "当前问题尚未确认解决，已整理为待核对草稿，尚未创建反馈。为便于准确记录并供团队判断，请补充：\n" + strings.Join(state.Questions, "\n")
	}
}
func persistClarificationMetadata(msg *AgentMessageRecord, state *AgentClarification) {
	if state == nil {
		return
	}
	meta := map[string]interface{}{}
	if msg.Metadata != nil {
		_ = json.Unmarshal([]byte(*msg.Metadata), &meta)
	}
	meta["clarification"] = state
	meta["unresolved"] = true
	raw, _ := json.Marshal(meta)
	text := string(raw)
	msg.Metadata = &text
}

func isRequiredClarificationField(key string) bool {
	switch key {
	case "position", "phenomenon", "expect", "reproduction_steps", "environment", "impact":
		return true
	}
	return false
}

func validClarificationRequestType(kind string) bool {
	return kind == "bug" || kind == "feature" || kind == "question" || kind == "other"
}
func isCoreClarificationField(kind, key string) bool {
	if key == "request_type" || key == "position" || key == "phenomenon" || key == "expect" {
		return true
	}
	return kind == "feature" && containsField([]string{"target_users", "reproduction_steps", "business_goal", "pain_points"}, key)
}
func isRequiredClarificationFieldForType(kind, key string) bool {
	if key == "request_type" {
		return true
	}
	if kind == "feature" {
		return containsField([]string{"position", "phenomenon", "expect", "target_users", "reproduction_steps", "business_goal", "pain_points", "current_workflow", "impact", "frequency", "expected_benefit", "workaround", "constraints"}, key)
	}
	return isRequiredClarificationField(key)
}
func clarificationQuestion(kind string, field clarificationField) string {
	if kind == "feature" {
		switch field.key {
		case "position":
			return "希望在哪个页面或模块增加功能？"
		case "phenomenon":
			return "具体希望增加什么能力？"
		case "reproduction_steps":
			return "请举一个使用场景：谁在什么情况下，如何使用这个功能？"
		case "impact":
			return "这个需求影响哪些工作或用户，范围多大？不清楚可以明确说明。"
		case "frequency":
			return "这个使用场景多久出现一次？不清楚可以明确说明。"
		}
	}
	return field.question
}
