package handler

import (
	"encoding/json"
	"fmt"
	"strings"
)

// validateFeedbackClarification validates opt-in structured submissions. Explicit
// confirmation is an API assertion by the scoped customer, not a model decision.
func validateFeedbackClarification(data *string) error {
	if data == nil || strings.TrimSpace(*data) == "" {
		return nil
	}
	var envelope map[string]json.RawMessage
	if err := json.Unmarshal([]byte(*data), &envelope); err != nil {
		return fmt.Errorf("反馈结构必须是合法 JSON")
	}
	raw, ok := envelope["structured"]
	if !ok {
		return nil
	}
	var summary AgentStructuredSummary
	if string(raw) == "null" || json.Unmarshal(raw, &summary) != nil {
		return fmt.Errorf("structured 必须是问题结构对象")
	}
	var confirmation struct {
		Confirmed bool `json:"confirmed"`
	}
	if json.Unmarshal(envelope["clarification"], &confirmation) != nil || !confirmation.Confirmed {
		return fmt.Errorf("请先检查结构化信息并明确确认提交")
	}
	if !validClarificationRequestType(summary.RequestType) {
		return fmt.Errorf("请先选择反馈类型 request_type")
	}
	for _, field := range clarificationFields {
		if !isRequiredClarificationFieldForType(summary.RequestType, field.key) {
			continue
		}
		value := strings.TrimSpace(*field.value(&summary))
		if isPlaceholder(value) {
			if !isCoreClarificationField(summary.RequestType, field.key) && containsField(summary.UnknownFields, field.key) {
				continue
			}
			return fmt.Errorf("结构化信息缺少 %s，请补充后确认", field.key)
		}
		if isUnknownAnswer(value) {
			if isCoreClarificationField(summary.RequestType, field.key) || !containsField(summary.UnknownFields, field.key) {
				return fmt.Errorf("信息 %s 不能用未知占位；辅助信息请明确标为待核实", field.key)
			}
		}
		if len(value) > 8000 {
			return fmt.Errorf("结构化信息字段 %s 过长", field.key)
		}
	}
	for _, key := range summary.UnknownFields {
		found := false
		for _, field := range clarificationFields {
			if field.key == key && !isCoreClarificationField(summary.RequestType, field.key) {
				found = true
			}
		}
		if !found {
			return fmt.Errorf("unknown_fields 含无效或核心字段 %s", key)
		}
	}
	return nil
}
