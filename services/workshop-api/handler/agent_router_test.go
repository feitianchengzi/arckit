package handler

import (
	"strings"
	"testing"
)

// 问题：短句负向启发式（len<=15 且无技术词 → 闲聊）把所有非技术短消息
// 截胡成同一句固定兜底文案"您好！请问有什么可以帮您的？"，
// 导致"你能做什么""？？"等消息永远走不到 OpenHands/LLM。
// 规格：本地只做正向白名单命中；未命中一律放行 Agent（返回 nil）。

const boilerplateFallback = "您好！请问有什么可以帮您的？"

// TestClassifyIntentNoShortSentenceHijack 短句/纯标点不得被负向启发式判为闲聊。
func TestClassifyIntentNoShortSentenceHijack(t *testing.T) {
	cases := []string{
		"？？",
		"?",
		"。。。",
		"继续",
		"嗯？这个bug怎么修", // 含"bug"但按旧规则也可能被短句层截胡
	}
	for _, q := range cases {
		if got := classifyIntent(q); got == IntentConversational && !matchesAny(strings.ToLower(q), conversationalRulePatterns()) {
			t.Errorf("classifyIntent(%q) = %s，短句不得被负向启发式判为闲聊", q, got)
		}
	}

	// 纯标点与无语义短句必须放行（unknown → OpenHands）
	for _, q := range []string{"？？", "?", "。。。"} {
		if got := classifyIntent(q); got != IntentUnknown {
			t.Errorf("classifyIntent(%q) = %s, want %s（放行 Agent）", q, got, IntentUnknown)
		}
	}
}

// TestClassifyAndRespondNeverReturnsBoilerplate 任何输入都不得再返回固定兜底废话。
func TestClassifyAndRespondNeverReturnsBoilerplate(t *testing.T) {
	inputs := []string{
		"你能做什么",
		"？？",
		"继续",
		"这个功能怎么用",
		"随便什么没规则命中的句子",
		"asdfghjkl",
	}
	for _, q := range inputs {
		resp, _ := classifyAndRespond(q)
		if resp != nil && resp.Content == boilerplateFallback {
			t.Errorf("classifyAndRespond(%q) 返回了固定兜底文案，禁止硬编码分流", q)
		}
	}
}

// TestClassifyAndRespondReleasesUnmatchedToAgent 未命中白名单必须返回 nil 放行。
func TestClassifyAndRespondReleasesUnmatchedToAgent(t *testing.T) {
	cases := []struct {
		query string
		want  *AgentResponse // nil = 必须放行
	}{
		{query: "？？", want: nil},
		{query: "继续", want: nil},
		{query: "", want: nil},
		// 真闲聊仍走本地白名单（毫秒级）
		{query: "你好", want: &AgentResponse{}},
		{query: "谢谢你", want: &AgentResponse{}},
	}
	for _, tc := range cases {
		resp, intent := classifyAndRespond(tc.query)
		if tc.want == nil {
			if resp != nil {
				t.Errorf("classifyAndRespond(%q) = %q, want nil（放行 Agent），intent=%s", tc.query, resp.Content, intent)
			}
			continue
		}
		if resp == nil {
			t.Errorf("classifyAndRespond(%q) = nil, want 本地白名单回复，intent=%s", tc.query, intent)
		}
	}
}

// TestCapabilityInquiryGetsRealAnswer "你能做什么"是能力咨询，必须有真实回答。
func TestCapabilityInquiryGetsRealAnswer(t *testing.T) {
	for _, q := range []string{"你能做什么", "你会什么", "有什么功能", "怎么用"} {
		resp, intent := classifyAndRespond(q)
		if resp == nil {
			t.Errorf("classifyAndRespond(%q) = nil，能力咨询应命中本地白名单", q)
			continue
		}
		if intent != IntentConversational {
			t.Errorf("classifyAndRespond(%q) intent = %s, want %s", q, intent, IntentConversational)
		}
		if resp.Content == boilerplateFallback || !strings.Contains(resp.Content, arcOrbitAgentName) {
			t.Errorf("classifyAndRespond(%q) = %q，应返回能力介绍（含姓名小橙）而非兜底废话", q, resp.Content)
		}
		if resp.Confidence < 0.9 {
			t.Errorf("classifyAndRespond(%q) confidence = %f，白名单命中应为高置信", q, resp.Confidence)
		}
	}
}

// TestActionRulesDoNotSwallowQuestions 过宽的操作类规则（如裸"我想/我要"）
// 不得吞掉普通提问；未命中具体操作子类必须放行 Agent。
func TestActionRulesDoNotSwallowQuestions(t *testing.T) {
	questions := []string{
		"我想问一下这个函数什么意思",
		"我要怎么查日志",
	}
	for _, q := range questions {
		resp, _ := classifyAndRespond(q)
		if resp != nil {
			t.Errorf("classifyAndRespond(%q) = %q，普通提问不得被操作类规则截胡", q, resp.Content)
		}
		if got := classifyIntent(q); got == IntentAction {
			t.Errorf("classifyIntent(%q) = action，普通提问不应判为操作类", q)
		}
	}

	// 真正的操作请求仍应命中
	if resp, intent := classifyAndRespond("我要提交一个bug"); resp == nil || intent != IntentAction {
		t.Errorf("提交bug请求未命中操作类本地引导: resp=%v intent=%s", resp, intent)
	}
}

// TestGreetingLocalWhitelistKeepsWorking 既有问候白名单不能被重构破坏。
func TestGreetingLocalWhitelistKeepsWorking(t *testing.T) {
	resp, intent := classifyAndRespond("你好")
	if resp == nil || intent != IntentConversational {
		t.Fatalf("问候语应本地回复: resp=%v intent=%s", resp, intent)
	}
	if strings.Contains(resp.Content, boilerplateFallback) {
		t.Errorf("问候回复不应是兜底文案: %q", resp.Content)
	}
}

// TestProductSubjectCapabilityQuestionsReleaseToAgent 产品/主题主语的能力问题
// （如 "arcorbit能做什么"）必须放行 Agent，禁止被无锚定的能力白名单截胡成
// "我是小橙，可以帮您解答…" —— 为快丢准确性是回归。
func TestProductSubjectCapabilityQuestionsReleaseToAgent(t *testing.T) {
	queries := []string{
		"arcorbit能做什么",
		"ArcOrbit 有什么功能",
		"arcorbit怎么用",
		"ArcOrbit如何使用",
		"这个平台能做什么",
		"这个功能怎么用",
		"如何使用项目管理功能？",
	}
	for _, q := range queries {
		resp, intent := classifyAndRespond(q)
		if resp != nil {
			t.Errorf("classifyAndRespond(%q) = %q (intent=%s)，带产品/主题主语的问题必须放行 Agent",
				q, resp.Content, intent)
		}
		if got := classifyIntent(q); got == IntentConversational {
			t.Errorf("classifyIntent(%q) = conversational，产品问题不应判为闲聊", q)
		}
	}
}

// TestBareSelfCapabilityInquiryStillLocal 纯自指能力咨询（无产品主语）仍走本地白名单。
func TestBareSelfCapabilityInquiryStillLocal(t *testing.T) {
	for _, q := range []string{"你能做什么", "你会什么", "有什么功能", "怎么用", "你是谁"} {
		resp, intent := classifyAndRespond(q)
		if resp == nil {
			t.Errorf("classifyAndRespond(%q) = nil，纯能力咨询应命中本地白名单", q)
			continue
		}
		if intent != IntentConversational {
			t.Errorf("classifyAndRespond(%q) intent = %s, want %s", q, intent, IntentConversational)
		}
		if !strings.Contains(resp.Content, arcOrbitAgentName) {
			t.Errorf("本地能力回复缺少姓名 %q: %q", arcOrbitAgentName, resp.Content)
		}
	}
}
