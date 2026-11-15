package handler

import (
	"strings"
	"testing"
)

func TestUnknownRequestTypeAsksFactsNeverCustomerClassification(t *testing.T) {
	state := mergeClarification(nil, nil, []AgentMessageRecord{{SenderType: "customer", Content: "这里不对"}})
	if state.ReadyToConfirm {
		t.Fatal("unclassified intake cannot be submitted")
	}
	for _, question := range state.Questions {
		for _, forbidden := range []string{"故障", "功能建议", "使用咨询", "类型", "bug", "feature"} {
			if strings.Contains(strings.ToLower(question), forbidden) {
				t.Fatalf("delegated Agent classification to customer: %q", question)
			}
		}
	}
	if !strings.Contains(strings.Join(state.Questions, " "), "实际") {
		t.Fatal("must ask concrete observed behavior")
	}
}
func TestAgentInfersTypeFromFactsWithoutAskingUserToNameIt(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "昨天还能导出，现在点击没有反应"}}
	candidate := &AgentStructuredSummary{RequestType: "bug", Phenomenon: "点击没有反应", Evidence: map[string]string{"request_type": "昨天还能导出，现在点击没有反应", "phenomenon": "点击没有反应"}}
	state := mergeClarification(nil, candidate, history)
	if state.Summary.RequestType != "bug" {
		t.Fatal("Agent classification should be grounded in facts, not require user to say bug")
	}
	for _, q := range state.Questions {
		if strings.Contains(q, "类型") {
			t.Fatal("must not ask customer classify")
		}
	}
}
func TestAgentReclassificationRetainsGroundedFacts(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "在报表页导出有问题"}, {SenderType: "customer", Content: "更正一下，单项目导出正常，我需要跨项目汇总"}}
	previous := &AgentClarification{Summary: AgentStructuredSummary{RequestType: "bug", Position: "报表页", Phenomenon: "导出有问题", Evidence: map[string]string{"position": "报表页"}}}
	candidate := &AgentStructuredSummary{RequestType: "feature", Phenomenon: "需要跨项目汇总", Evidence: map[string]string{"request_type": "单项目导出正常，我需要跨项目汇总", "phenomenon": "我需要跨项目汇总"}}
	state := mergeClarification(previous, candidate, history)
	if state.Summary.RequestType != "feature" || state.Summary.Position != "报表页" {
		t.Fatalf("classification correction lost facts: %+v", state.Summary)
	}
	if containsField(state.MissingFields, "environment") {
		t.Fatal("feature must not demand bug environment")
	}
	if !containsField(state.MissingFields, "target_users") || state.ReadyToConfirm {
		t.Fatal("feature must collect analysis facts")
	}
}
func TestClassificationPromptOwnsDecisionAndExpectedPermissionsBoundary(t *testing.T) {
	prompt := featureClarificationInstruction()
	for _, expected := range []string{"Agent", "不得要求客户", "仓库", "权限", "混合", "更正"} {
		if !strings.Contains(prompt, expected) {
			t.Fatalf("missing classification policy %q", expected)
		}
	}
	if strings.Contains(prompt, "先问清类型") {
		t.Fatal("prompt still delegates classification")
	}
}
