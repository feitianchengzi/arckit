package handler

import (
	"encoding/json"
	"github.com/google/uuid"
	"strings"
	"testing"
	"todo/models"
)

func TestClarificationFollowupDoesNotMatchSavedDraftAsLocalAction(t *testing.T) {
	t.Setenv("OPENHANDS_ENABLED", "false")
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&models.CodeChunk{}); err != nil {
		t.Fatal(err)
	}
	prior := AgentMessageRecord{SenderType: "agent"}
	persistClarificationMetadata(&prior, &AgentClarification{Summary: AgentStructuredSummary{Expect: "我想提个建议：每天发送财务邮件"}})
	response, err := processWithAgent(nil, db, 987654, 0, "环境版本我不知道", []AgentMessageRecord{prior, {SenderType: "customer", Content: "环境版本我不知道"}}, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	if !response.NeedCollect || response.Confidence != 0 || response.Content != arcOrbitAgentNoResultReply() {
		t.Fatalf("followup intercepted by canned action instead of retrieval: %+v", response)
	}
}

func TestClarificationMultiTurnEvidenceAndReadiness(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "订单列表点击导出没有反应，我想下载CSV。"}}
	first := &AgentStructuredSummary{Position: "订单列表", Phenomenon: "点击导出没有反应", Expect: "下载CSV", Environment: "Chrome", Evidence: map[string]string{"environment": "我在 Chrome 129 使用"}}
	state := mergeClarification(nil, first, history)
	if state.ReadyToConfirm || state.Summary.Environment != "" || !containsField(state.MissingFields, "request_type") {
		t.Fatalf("unsupported environment accepted or premature readiness: %+v", state)
	}
	meta := &AgentMessageRecord{SenderType: "agent"}
	persistClarificationMetadata(meta, state)
	history = append(history, *meta)
	history = append(history, AgentMessageRecord{SenderType: "customer", Content: "进入订单列表，点导出。Chrome 129，每次都发生，影响财务对账，这是功能故障。"})
	second := &AgentStructuredSummary{ReproductionSteps: "进入订单列表，点导出", Environment: "Chrome 129", Frequency: "每次都发生", Impact: "影响财务对账", RequestType: "bug", Evidence: map[string]string{"request_type": "这是功能故障"}}
	response := &AgentResponse{Content: "补充信息已收到", Confidence: 0.98, Structured: second}
	applyClarification(response, history)
	if response.Clarification == nil || !response.Clarification.ReadyToConfirm || response.Clarification.Summary.Position != "订单列表" {
		t.Fatalf("lost state or did not complete: %+v", response)
	}
	if !response.NeedCollect || !strings.Contains(response.Content, "尚未创建反馈") {
		t.Fatal("must require user confirmation")
	}
}

func TestClarificationUnknownsDoNotInventCoreFacts(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "环境我不知道；问题位置也不知道。这是故障。"}}
	state := mergeClarification(nil, &AgentStructuredSummary{RequestType: "bug", UnknownFields: []string{"environment", "position", "impact"}, Evidence: map[string]string{"request_type": "这是故障", "environment": "环境我不知道", "position": "问题位置也不知道", "impact": "影响所有人"}}, history)
	if !containsField(state.Summary.UnknownFields, "environment") || containsField(state.Summary.UnknownFields, "position") || containsField(state.Summary.UnknownFields, "impact") {
		t.Fatalf("invalid unknown handling: %+v", state)
	}
	if !containsField(state.MissingFields, "position") || state.ReadyToConfirm {
		t.Fatal("core facts cannot be waived")
	}
}

func TestClarificationMissingFactsOverrideModelClaimOfCompleteness(t *testing.T) {
	r := &AgentResponse{Content: "信息已收齐，马上提交", Confidence: 0.99, NeedCollect: true}
	applyClarification(r, nil)
	if strings.Contains(r.Content, "信息已收齐") || strings.Contains(r.Content, "马上提交") || !strings.Contains(r.Content, "尚未创建反馈") {
		t.Fatalf("model completeness claim leaked despite missing fields: %s", r.Content)
	}
	if len(r.Clarification.Questions) > 2 || r.Clarification.ReadyToConfirm {
		t.Fatal("must keep bounded questions and collecting status")
	}
}

func TestClarificationPersistencePostgres(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	conv := AgentConversation{ID: uuid.NewString(), ProjectID: 11, CustomUserID: "clarification-customer"}
	if err := db.Create(&conv).Error; err != nil {
		t.Fatal(err)
	}
	customer := AgentMessageRecord{ConversationID: conv.ID, ProjectID: 11, SenderType: "customer", Content: "登录页点击无响应"}
	if err := SaveMessage(db, &customer); err != nil {
		t.Fatal(err)
	}
	state := mergeClarification(nil, &AgentStructuredSummary{Position: "登录页", Phenomenon: "点击无响应"}, []AgentMessageRecord{customer})
	msg := AgentMessageRecord{ConversationID: conv.ID, ProjectID: 11, SenderType: "agent", Content: "期望什么结果？"}
	raw, _ := json.Marshal(map[string]string{"openhands_conversation_id": "oh-existing"})
	metadata := string(raw)
	msg.Metadata = &metadata
	persistClarificationMetadata(&msg, state)
	if err := SaveMessage(db, &msg); err != nil {
		t.Fatal(err)
	}
	history, err := GetConversationHistory(db, conv.ID, 20)
	if err != nil {
		t.Fatal(err)
	}
	recovered := latestClarification(history)
	if recovered == nil || recovered.Summary.Position != "登录页" || recovered.ReadyToConfirm {
		t.Fatalf("bad recovery: %+v", recovered)
	}
	if getOpenHandsConversationID(history) != "oh-existing" {
		t.Fatal("metadata overwrote OpenHands mapping")
	}
}

func TestStructuredSubmissionRequiresConfirmationAndCore(t *testing.T) {
	valid := AgentStructuredSummary{RequestType: "bug", Position: "订单列表", Phenomenon: "点击导出无响应", Expect: "正常下载", ReproductionSteps: "点击导出", Environment: "Chrome", Impact: "对账受阻"}
	validate := func(summary AgentStructuredSummary, confirmed bool) error {
		raw, _ := json.Marshal(map[string]interface{}{"structured": summary, "clarification": map[string]bool{"confirmed": confirmed}})
		text := string(raw)
		return validateFeedbackClarification(&text)
	}
	if validate(valid, false) == nil {
		t.Fatal("unconfirmed model snapshot accepted")
	}
	if err := validate(valid, true); err != nil {
		t.Fatal(err)
	}
	valid.Position = "未知"
	if validate(valid, true) == nil {
		t.Fatal("confirmation bypassed missing core")
	}
	valid.Position = "订单列表"
	valid.Environment = ""
	valid.UnknownFields = []string{"environment"}
	if err := validate(valid, true); err != nil {
		t.Fatal(err)
	}
	valid.UnknownFields = []string{"position", "environment"}
	if validate(valid, true) == nil {
		t.Fatal("core unknown marker accepted")
	}
}

func TestPersonaNeverClaimsSubmissionBeforeConfirmation(t *testing.T) {
	for _, text := range []string{arcOrbitAgentUnavailableReply(), arcOrbitAgentNoResultReply()} {
		if strings.Contains(text, "已记录") || strings.Contains(text, "已转交") {
			t.Fatalf("premature promise: %s", text)
		}
	}
	if !strings.Contains(arcOrbitAgentPersona, "不得从权限规则推断") || !strings.Contains(arcOrbitAgentPersona, "当前项目") {
		t.Fatal("missing evidence or external-product boundary")
	}
}

func TestHighConfidenceDoesNotDiscardGroundedUnresolvedReport(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "在订单列表点导出无反应，我想下载CSV。"}}
	response := &AgentResponse{Content: "文档未说明按钮无反应的原因，需要补充排查信息。", Confidence: 0.88, Structured: &AgentStructuredSummary{Position: "订单列表", Phenomenon: "点导出无反应", Expect: "下载CSV"}}
	applyClarification(response, history)
	if response.Clarification == nil || !response.NeedCollect || response.Structured.Phenomenon != "点导出无反应" {
		t.Fatalf("confidence about missing docs must not discard customer report: %+v", response)
	}
}

func TestHighConfidenceAnsweredDocsDoNotStartEmptyOrUnsupportedDraft(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "CSV 最多导出多少条？"}}
	for _, summary := range []*AgentStructuredSummary{nil, {}, {Phenomenon: "CSV 最多导出多少条？"}, {Phenomenon: "导出失败", Evidence: map[string]string{"phenomenon": "导出失败"}}} {
		response := &AgentResponse{Content: "根据 README.md，最多5000条。", Confidence: 0.95, Structured: summary}
		applyClarification(response, history)
		if response.NeedCollect || response.Clarification != nil || response.Structured != nil {
			t.Fatalf("answered docs spuriously collected: %+v", response)
		}
	}
}

func TestAnsweredResolutionDoesNotTreatConsultationSummaryAsIncident(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "订单页最多多少条，我想知道导出上限"}}
	r := &AgentResponse{Content: "README 说明最多5000条。", Confidence: .96, Resolution: "answered", Structured: &AgentStructuredSummary{Position: "订单页", Phenomenon: "最多多少条", Expect: "知道导出上限"}}
	applyClarification(r, history)
	if r.NeedCollect || r.Clarification != nil || r.Structured != nil {
		t.Fatalf("answered consultation became incident: %+v", r)
	}
	content, resolution := parseAgentResolution("回答\n[resolution:answered]\n[resolution:invalid]")
	if resolution != "answered" || content != "回答" {
		t.Fatalf("invalid resolution parsing: %q %q", content, resolution)
	}
}

func TestFeatureClarificationRequiresDemandFacts(t *testing.T) {
	summary := AgentStructuredSummary{RequestType: "feature", Position: "订单", Phenomenon: "定时发送报表", Expect: "自动收到日报", TargetUsers: "财务", ReproductionSteps: "每天对账前", BusinessGoal: "及时对账", PainPoints: "手工导出耗时", UnknownFields: []string{"current_workflow", "impact", "frequency", "expected_benefit", "workaround", "constraints"}}
	validate := func(s AgentStructuredSummary) error {
		raw, _ := json.Marshal(map[string]interface{}{"structured": s, "clarification": map[string]bool{"confirmed": true}})
		text := string(raw)
		return validateFeedbackClarification(&text)
	}
	if err := validate(summary); err != nil {
		t.Fatal(err)
	}
	summary.BusinessGoal = ""
	summary.UnknownFields = append(summary.UnknownFields, "business_goal")
	if validate(summary) == nil {
		t.Fatal("unknown core demand fact accepted")
	}
	summary.BusinessGoal = "及时对账"
	summary.UnknownFields = summary.UnknownFields[:6]
	summary.RequestType = "bug"
	if validate(summary) == nil {
		t.Fatal("switch to bug bypassed environment requirement")
	}
}
func TestFeatureClarificationEvidenceAndRecovery(t *testing.T) {
	history := []AgentMessageRecord{{SenderType: "customer", Content: "新增需求：财务每天对账前需要自动日报，目标及时对账，目前手工导出耗时。"}}
	first := mergeClarification(nil, &AgentStructuredSummary{RequestType: "feature", TargetUsers: "财务", BusinessGoal: "及时对账", PainPoints: "手工导出耗时", Evidence: map[string]string{"request_type": "新增需求"}}, history)
	if first.Summary.TargetUsers != "财务" || first.ReadyToConfirm || containsField(first.MissingFields, "environment") {
		t.Fatalf("bad demand draft: %+v", first)
	}
	history = append(history, AgentMessageRecord{SenderType: "customer", Content: "更正：目标用户是店长，收益还不知道。"})
	second := mergeClarification(first, &AgentStructuredSummary{TargetUsers: "店长", ExpectedBenefit: "每月省100小时", UnknownFields: []string{"expected_benefit"}, Evidence: map[string]string{"expected_benefit": "收益还不知道"}}, history)
	if second.Summary.TargetUsers != "店长" || second.Summary.BusinessGoal != "及时对账" || second.Summary.ExpectedBenefit != "" || !containsField(second.Summary.UnknownFields, "expected_benefit") {
		t.Fatalf("bad correction/unknown: %+v", second)
	}
	if len(second.Questions) > 2 {
		t.Fatal("unbounded questions")
	}
}
