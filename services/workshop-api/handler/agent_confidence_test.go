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
