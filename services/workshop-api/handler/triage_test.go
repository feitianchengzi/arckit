package handler

import (
	"testing"
)

func TestClassifyType(t *testing.T) {
	tests := []struct {
		name     string
		title    string
		content  string
		wantType string
	}{
		{"bug report", "登录崩溃", "应用打开后白屏无法使用", "bug"},
		{"feature request", "建议新增", "希望支持导出PDF功能", "feature"},
		{"question", "怎么用", "请问如何配置邮件通知", "question"},
		{"mixed bug keywords", "报错error", "页面加载失败500", "bug"},
		{"empty content", "", "", "other"},
		{"neutral feedback", "体验一般", "整体还行但有些地方需要优化", "feature"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := classifyType(tt.title + " " + tt.content)
			if got != tt.wantType {
				t.Errorf("classifyType() = %v, want %v", got, tt.wantType)
			}
		})
	}
}

func TestClassifyPriority(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		issueType string
		want     string
	}{
		{"urgent bug", "线上崩溃了紧急修复", "bug", "P1"},
		{"production incident", "生产环境数据丢失", "bug", "P1"},
		{"normal bug", "按钮点击无反应", "bug", "P2"},
		{"feature request", "希望支持暗黑模式", "feature", "P2"},
		{"question", "怎么修改密码", "question", "P3"},
		{"neutral", "整体体验不错", "other", "P3"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := classifyPriority(tt.text, tt.issueType)
			if got != tt.want {
				t.Errorf("classifyPriority() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestClassifyActionability(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		issueType string
		want     string
	}{
		{"bug with steps", "步骤1打开页面步骤2点击登录", "bug", "可直接行动"},
		{"bug without context", "登录不了", "bug", "需补充信息"},
		{"question type", "怎么配置", "question", "需确认后行动"},
		{"feature type", "建议新增导出", "feature", "需评估后行动"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := classifyActionability(tt.text, tt.issueType)
			if got != tt.want {
				t.Errorf("classifyActionability() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNeedsMoreInfo(t *testing.T) {
	tests := []struct {
		name      string
		text      string
		runeCount int
		want      bool
	}{
		{"too short", "不行", 3, true},
		{"has steps", "步骤如下1.打开2.点击3.提交", 30, false},
		{"has version info", "版本2.1.0环境下出现", 20, false},
		{"medium length", "这是一个比较详细的问题描述包含了足够的上下文信息", 30, false},
		{"short neutral", "整体还行", 4, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := needsMoreInfo(tt.text, tt.runeCount)
			if got != tt.want {
				t.Errorf("needsMoreInfo() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestScoreClarity(t *testing.T) {
	tests := []struct {
		name      string
		text      string
		runeCount int
		minScore  float64
	}{
		{"detailed with steps", "步骤1.打开页面2.点击登录3.输入账号密码版本2.1.0环境Windows", 60, 0.7},
		{"short vague", "不行", 2, 0.2},
		{"medium length", "这是一个比较详细的问题描述包含了足够的上下文信息帮助理解问题", 40, 0.5},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := scoreClarity(tt.text, tt.runeCount)
			if got < tt.minScore {
				t.Errorf("scoreClarity() = %v, want >= %v", got, tt.minScore)
			}
		})
	}
}

func TestScoreImpact(t *testing.T) {
	tests := []struct {
		name      string
		text      string
		issueType string
		minScore  float64
	}{
		{"all users affected", "所有用户无法登录", "bug", 0.7},
		{"single user bug", "我这里按钮点不了", "bug", 0.5},
		{"feature request", "建议新增导出", "feature", 0.3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := scoreImpact(tt.text, tt.issueType)
			if got < tt.minScore {
				t.Errorf("scoreImpact() = %v, want >= %v", got, tt.minScore)
			}
		})
	}
}

func TestScoreUrgency(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		issueType string
		priority string
		minScore float64
	}{
		{"P1 bug", "线上崩溃", "bug", "P1", 0.8},
		{"P2 bug", "按钮无反应", "bug", "P2", 0.5},
		{"P3 question", "怎么用", "question", "P3", 0.2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := scoreUrgency(tt.text, tt.issueType, tt.priority)
			if got < tt.minScore {
				t.Errorf("scoreUrgency() = %v, want >= %v", got, tt.minScore)
			}
		})
	}
}

func TestBuildReasoning(t *testing.T) {
	tests := []struct {
		name               string
		issueType          string
		priority           string
		actionability      string
		needsClarification bool
		clarity            float64
		impact             float64
		urgency            float64
		wantContains       string
	}{
		{"urgent bug", "bug", "P1", "可直接行动", false, 0.8, 0.9, 0.9, "缺陷类反馈"},
		{"vague feedback", "other", "P3", "需确认后行动", true, 0.3, 0.4, 0.3, "信息不足"},
		{"feature request", "feature", "P2", "需评估后行动", false, 0.7, 0.5, 0.6, "功能需求类反馈"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildReasoning(tt.issueType, tt.priority, tt.actionability, tt.needsClarification, tt.clarity, tt.impact, tt.urgency)
			if len(got) == 0 {
				t.Error("buildReasoning() returned empty string")
			}
		})
	}
}

func TestAnalyzeFeedback(t *testing.T) {
	tests := []struct {
		name    string
		title   string
		content string
	}{
		{"bug report", "登录页面崩溃", "打开登录页面后应用白屏无法操作，所有用户都遇到此问题，线上环境紧急"},
		{"feature request", "建议新增", "希望能支持批量导出功能，目前只能单个导出很不方便"},
		{"question", "怎么配置", "请问如何配置邮件通知功能"},
		{"short feedback", "体验差", "太差了"},
		{"detailed bug", "数据同步失败", "步骤：1.打开设置页面2.点击同步按钮3.等待10秒后出现error500错误。版本2.1.0，环境Windows 11，Chrome浏览器。影响所有用户，生产环境。"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := analyzeFeedback(tt.title, tt.content)
			if result.Type == "" {
				t.Error("analyzeFeedback() returned empty type")
			}
			if result.Priority == "" {
				t.Error("analyzeFeedback() returned empty priority")
			}
			if result.Confidence < 0 || result.Confidence > 1 {
				t.Errorf("analyzeFeedback() confidence = %v, want [0, 1]", result.Confidence)
			}
			if result.Clarity < 0 || result.Clarity > 1 {
				t.Errorf("analyzeFeedback() clarity = %v, want [0, 1]", result.Clarity)
			}
			if result.Impact < 0 || result.Impact > 1 {
				t.Errorf("analyzeFeedback() impact = %v, want [0, 1]", result.Impact)
			}
			if result.Urgency < 0 || result.Urgency > 1 {
				t.Errorf("analyzeFeedback() urgency = %v, want [0, 1]", result.Urgency)
			}
			if result.Reasoning == "" {
				t.Error("analyzeFeedback() returned empty reasoning")
			}
		})
	}
}

func TestRound2(t *testing.T) {
	tests := []struct {
		input float64
		want  float64
	}{
		{0.123, 0.12},
		{0.125, 0.13},
		{0.126, 0.13},
		{0.0, 0.0},
		{1.0, 1.0},
		{0.999, 1.0},
	}
	for _, tt := range tests {
		got := round2(tt.input)
		if got != tt.want {
			t.Errorf("round2(%v) = %v, want %v", tt.input, got, tt.want)
		}
	}
}
