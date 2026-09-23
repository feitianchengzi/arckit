package handler

import (
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

// buildAgentQueryWithConfidenceInstruction 在客户问题后附加置信度自评要求，
// 使 OpenHands 回复末尾携带可解析的 [confidence:x] 标注。
func buildAgentQueryWithConfidenceInstruction(query string) string {
	return query + `

回答要求：
1. 基于代码仓库与项目文档回答；若信息不足以可靠回答，请如实说明未找到依据。
2. 在回答的最末尾单独一行输出自评置信度标注，格式必须严格为 [confidence:0.00]（0~1 的小数，例如 [confidence:0.92]）。`
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
