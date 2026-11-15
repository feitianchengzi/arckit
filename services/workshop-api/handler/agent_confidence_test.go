package handler

import (
	"strings"
	"testing"
)

func TestParseAgentConfidence(t *testing.T) {
	cases := []struct {
		name            string
		content         string
		wantConfidence  float64
		wantContentTrim string
	}{
		{
			name:            "trailing marker is parsed and stripped",
			content:         "该问题由 middleware.ExtractUserID 处理。\n[confidence:0.92]",
			wantConfidence:  0.92,
			wantContentTrim: "该问题由 middleware.ExtractUserID 处理。",
		},
		{
			name:            "inline marker without newline",
			content:         "答案正文 [confidence:0.6]",
			wantConfidence:  0.6,
			wantContentTrim: "答案正文",
		},
		{
			name:            "unanswerable reply keeps low confidence text",
			content:         "抱歉，仓库中没有找到与该问题相关的实现。\n[confidence:0.2]",
			wantConfidence:  0.2,
			wantContentTrim: "抱歉，仓库中没有找到与该问题相关的实现。",
		},
		{
			name:           "missing marker falls back to default",
			content:        "普通回答，没有标注。",
			wantConfidence: defaultAgentConfidence,
		},
		{
			name:           "invalid marker value falls back to default",
			content:        "回答正文\n[confidence:abc]",
			wantConfidence: defaultAgentConfidence,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			content, confidence := parseAgentConfidence(tc.content)
			if confidence != tc.wantConfidence {
				t.Fatalf("confidence = %v, want %v", confidence, tc.wantConfidence)
			}
			if tc.wantContentTrim != "" && strings.TrimSpace(content) != tc.wantContentTrim {
				t.Fatalf("content = %q, want %q", content, tc.wantContentTrim)
			}
			if strings.Contains(content, "[confidence:") {
				t.Fatalf("content still contains marker: %q", content)
			}
		})
	}
}

func TestBuildAgentQueryWithConfidenceInstruction(t *testing.T) {
	query := "如何配置 API Key？"
	wrapped := buildAgentQueryWithConfidenceInstruction(query)
	if !strings.Contains(wrapped, query) {
		t.Fatalf("wrapped query lost original content: %q", wrapped)
	}
	if !strings.Contains(wrapped, "[confidence:") {
		t.Fatalf("wrapped query missing confidence instruction: %q", wrapped)
	}
}

func TestParseAgentStructuredSummary(t *testing.T) {
	cases := []struct {
		name         string
		content      string
		wantParsed   bool
		wantPosition string
		wantPhenom   string
		wantExpect   string
		wantStripped string
	}{
		{
			name:         "无摘要块时保持原文",
			content:      "未找到可靠依据，请补充复现步骤。",
			wantParsed:   false,
			wantStripped: "未找到可靠依据，请补充复现步骤。",
		},
		{
			name:         "解析成功并剥离协议块",
			content:      "未找到可靠依据。\n[summary]\n{\"position\":\"导出页\",\"phenomenon\":\"CSV 中文乱码\",\"expect\":\"Excel 正常显示中文\"}\n[/summary]",
			wantParsed:   true,
			wantPosition: "导出页",
			wantPhenom:   "CSV 中文乱码",
			wantExpect:   "Excel 正常显示中文",
			wantStripped: "未找到可靠依据。",
		},
		{
			name:         "字段允许为空由客户补填",
			content:      "[summary]\n{\"position\":\"\",\"phenomenon\":\"点击导出无反应\",\"expect\":\"\"}\n[/summary]",
			wantParsed:   true,
			wantPhenom:   "点击导出无反应",
			wantStripped: "",
		},
		{
			name:         "JSON 非法时剥离但不给结构化数据",
			content:      "我还不确定。\n[summary]\n{position: 导出页}\n[/summary]",
			wantParsed:   false,
			wantStripped: "我还不确定。",
		},
		{
			name:         "三字段全空视为无效",
			content:      "我还不确定。\n[summary]\n{\"position\":\"\",\"phenomenon\":\"  \",\"expect\":\"\"}\n[/summary]",
			wantParsed:   false,
			wantStripped: "我还不确定。",
		},
		{
			name:         "未闭合的残块按协议垃圾截断",
			content:      "我还不确定。\n[summary]\n{\"position\":\"导出页\"}",
			wantParsed:   false,
			wantStripped: "我还不确定。",
		},
		{
			name:         "与 confidence 标注共存",
			content:      "未找到可靠依据。\n[summary]\n{\"position\":\"登录页\",\"phenomenon\":\"点击无响应\",\"expect\":\"正常登录\"}\n[/summary]",
			wantParsed:   true,
			wantPosition: "登录页",
			wantPhenom:   "点击无响应",
			wantExpect:   "正常登录",
			wantStripped: "未找到可靠依据。",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			summary, stripped := parseAgentStructuredSummary(tc.content)

			if tc.wantParsed {
				if summary == nil {
					t.Fatalf("summary = nil, want parsed")
				}
				if summary.Position != tc.wantPosition {
					t.Fatalf("Position = %q, want %q", summary.Position, tc.wantPosition)
				}
				if summary.Phenomenon != tc.wantPhenom {
					t.Fatalf("Phenomenon = %q, want %q", summary.Phenomenon, tc.wantPhenom)
				}
				if summary.Expect != tc.wantExpect {
					t.Fatalf("Expect = %q, want %q", summary.Expect, tc.wantExpect)
				}
			} else if summary != nil {
				t.Fatalf("summary = %+v, want nil", summary)
			}

			if stripped != tc.wantStripped {
				t.Fatalf("stripped = %q, want %q", stripped, tc.wantStripped)
			}
			if strings.Contains(stripped, "[summary]") || strings.Contains(stripped, "[/summary]") {
				t.Fatalf("stripped 仍含协议残留: %q", stripped)
			}
		})
	}
}

func TestBuildAgentQueryRequiresSummaryOnlyWhenLowConfidence(t *testing.T) {
	wrapped := buildAgentQueryWithConfidenceInstruction("导出乱码")
	if !strings.Contains(wrapped, "[summary]") {
		t.Fatalf("prompt 缺少结构化摘要指令: %q", wrapped)
	}
	if !strings.Contains(wrapped, "phenomenon") || !strings.Contains(wrapped, "position") || !strings.Contains(wrapped, "expect") {
		t.Fatalf("prompt 缺少三字段说明: %q", wrapped)
	}
	if !strings.Contains(wrapped, "低于 0.75") {
		t.Fatalf("prompt 未限定仅低置信输出摘要块: %q", wrapped)
	}
}
