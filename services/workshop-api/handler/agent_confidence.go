package handler

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// PRD F-03 置信度分级：≥0.9 高置信直接回复；0.75≤c<0.9 中置信；<0.75 低置信升级收集。
const (
	agentConfidenceHighThreshold = 0.9
	agentConfidenceLowThreshold  = 0.75
	// OpenHands 路径未返回自评标注时的保守默认值（中置信区间，走草稿确认）。
	defaultAgentConfidence = 0.85
)

// agentConfidenceMarkerRe 匹配回复末尾的自评标注，如 "[confidence:0.87]"。
var agentConfidenceMarkerRe = regexp.MustCompile(`\[confidence:\s*([0-9.]+)\s*\]`)

// agentConfidenceLooseMarkerRe 匹配任意 confidence 标注形态（含非法值），
// 仅用于把标注从回复正文中剥离，避免客户看到协议残留。
var agentConfidenceLooseMarkerRe = regexp.MustCompile(`\[confidence:[^\]]*\]`)

// AgentStructuredSummary 低置信时由 Agent 总结的问题结构（PRD F-01 三字段），
// 用于在客户提交反馈前预填表单。字段允许为空——模型不确定时留空由客户补填，
// 不允许用编造内容占位。
type AgentStructuredSummary struct {
	Position   string `json:"position"`
	Phenomenon string `json:"phenomenon"`
	Expect     string `json:"expect"`
}

// IsEmpty 三个字段全空视为无效总结，交由前端退回提问原文。
func (s *AgentStructuredSummary) IsEmpty() bool {
	return s != nil && strings.TrimSpace(s.Position) == "" &&
		strings.TrimSpace(s.Phenomenon) == "" &&
		strings.TrimSpace(s.Expect) == ""
}

// agentSummaryBlockRe 匹配回复中的结构化总结块，如 "[summary]\n{...}\n[/summary]"。
var agentSummaryBlockRe = regexp.MustCompile(`(?s)\[summary\]\s*(.*?)\s*\[/summary\]`)

// buildAgentQueryWithConfidenceInstruction 在客户问题后附加置信度自评要求，
// 使 OpenHands 回复末尾携带可解析的 [confidence:x] 标注。
// 低置信时额外要求输出结构化问题总结，供反馈表单预填（复用同一注入+剥离协议）。
func buildAgentQueryWithConfidenceInstruction(query string) string {
	return query + `

回答要求：
1. 基于代码仓库与项目文档回答；若信息不足以可靠回答，请如实说明未找到依据。
2. 在回答的最末尾单独一行输出自评置信度标注，格式必须严格为 [confidence:0.00]（0~1 的小数，例如 [confidence:0.92]）。
3. 若自评置信度低于 0.75（信息不足或无法可靠回答），在置信度标注之后额外输出一个结构化问题总结块，格式必须严格为：
[summary]
{"position":"问题出现的位置或模块，无法判断填空字符串","phenomenon":"问题现象，用客户能理解的话概括","expect":"客户期望的正确结果，无法判断填空字符串"}
[/summary]
该块只在置信度低于 0.75 时输出；高于或等于 0.75 时绝不要输出。JSON 必须合法，不要在 JSON 外补充任何解释。`
}

// parseAgentStructuredSummary 解析并剥离回复中的 [summary] 块。
// 返回解析结果与剥离协议残留后的正文。
// JSON 非法或三字段全空时剥离残留但返回 nil，交由前端退回提问原文；
// 未闭合的残块同样按协议垃圾截断，避免客户看到 [summary] 之类的内部标记。
func parseAgentStructuredSummary(content string) (*AgentStructuredSummary, string) {
	stripped := strings.TrimSpace(agentSummaryBlockRe.ReplaceAllString(content, ""))
	// 模型格式崩坏时可能只输出了开标记：其后内容不可信，一律截断
	if idx := strings.Index(stripped, "[summary]"); idx >= 0 {
		stripped = strings.TrimSpace(stripped[:idx])
	}

	match := agentSummaryBlockRe.FindStringSubmatch(content)
	if match == nil {
		return nil, stripped
	}

	var parsed AgentStructuredSummary
	if err := json.Unmarshal([]byte(strings.TrimSpace(match[1])), &parsed); err != nil {
		return nil, stripped
	}
	if parsed.IsEmpty() {
		return nil, stripped
	}
	return &parsed, stripped
}

// buildQueryWithHistory 将对话历史注入到当前问题前，确保 OpenHands 在会话过期重建后仍能获取完整上下文。
// history 仅保留最近 maxHistory 条有效消息，避免 prompt 过长。
func buildQueryWithHistory(query string, history []AgentMessageRecord, maxHistory int) string {
	if len(history) == 0 {
		return query
	}
	// 取最近 N 条（不含最后一条，因为最后一条是刚存入的当前 customer 消息）
	start := 0
	if len(history) > maxHistory {
		start = len(history) - maxHistory
	}
	relevant := history[start : len(history)-1]
	if len(relevant) == 0 {
		return query
	}

	var sb strings.Builder
	sb.WriteString("以下是此前的对话记录，请基于此上下文回答用户最后一个问题：\n\n")
	for _, m := range relevant {
		role := "客户"
		if m.SenderType == "agent" {
			role = arcOrbitAgentName
		} else if m.SenderType == "developer" {
			role = "技术支持"
		}
		sb.WriteString(fmt.Sprintf("%s: %s\n\n", role, m.Content))
	}
	sb.WriteString(fmt.Sprintf("客户: %s", query))
	return sb.String()
}

// parseAgentConfidence 解析并剥离回复末尾的 [confidence:x] 标注。
// 无标注时回退 defaultAgentConfidence；有非法标注则剥离但同样回退默认值。
func parseAgentConfidence(content string) (string, float64) {
	stripped := strings.TrimSpace(agentConfidenceLooseMarkerRe.ReplaceAllString(content, ""))
	stripped = strings.TrimSpace(stripped)

	matches := agentConfidenceMarkerRe.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		if stripped == content {
			return content, defaultAgentConfidence
		}
		return stripped, defaultAgentConfidence
	}

	last := matches[len(matches)-1]
	value, err := strconv.ParseFloat(last[1], 64)
	if err != nil || value < 0 || value > 1 {
		return stripped, defaultAgentConfidence
	}

	return stripped, value
}
