package handler

import (
	"strings"
	"testing"
)

// 人设规格：智能客服姓名为小橙（arcOrbitAgentName），代表 ArcOrbit 平台官方客服，
// 所有 LLM 路径共享同一人设（严谨性 + 体验约束），本地关键文案与兜底
// 必须声明姓名身份，禁止"智能客服助手/技术支持助手/无身份兜底"多套口径。

func TestArcOrbitPersonaDeclaresPlatformIdentityAndRigor(t *testing.T) {
	if arcOrbitAgentName != "小橙" {
		t.Errorf("arcOrbitAgentName = %q, want 姓名为小橙", arcOrbitAgentName)
	}
	if !strings.Contains(arcOrbitAgentPersona, arcOrbitAgentName) {
		t.Errorf("人设正文必须包含统一身份名称 %q", arcOrbitAgentName)
	}
	if !strings.Contains(arcOrbitAgentPersona, "ArcOrbit") || !strings.Contains(arcOrbitAgentPersona, "代表") {
		t.Error("人设正文必须声明代表 ArcOrbit 平台回复")
	}
	for _, want := range []string{"禁止编造", "依据", "转人工"} {
		if !strings.Contains(arcOrbitAgentPersona, want) {
			t.Errorf("人设缺少严谨性约束关键词 %q", want)
		}
	}
	if !strings.Contains(arcOrbitAgentPersona, "中文") {
		t.Error("人设应要求中文回复")
	}
}

func TestGetSystemPromptUsesArcOrbitPersona(t *testing.T) {
	prompt := GetSystemPrompt(1)
	if !strings.Contains(prompt, arcOrbitAgentName) {
		t.Error("系统提示必须包含客服姓名小橙")
	}
	if !strings.Contains(prompt, arcOrbitAgentPersona) {
		t.Error("系统提示必须以共享人设为单一事实来源")
	}
	if strings.Contains(prompt, "专业的技术支持助手") {
		t.Error("系统提示不得停留在无平台归属的通用助手口径")
	}
}

func TestBuildArcOrbitAgentPromptInjectsPersonaFirst(t *testing.T) {
	query := "如何配置 API Key？"
	wrapped := buildArcOrbitAgentPrompt(buildAgentQueryWithConfidenceInstruction(query))
	if !strings.Contains(wrapped, query) {
		t.Error("prompt 丢失原始问题")
	}
	if !strings.Contains(wrapped, "[confidence:") {
		t.Error("prompt 丢失置信度指令")
	}
	if !strings.HasPrefix(strings.TrimSpace(wrapped), strings.TrimSpace(arcOrbitAgentPersona)) {
		t.Error("OpenHands prompt 必须以 ArcOrbit 人设置顶")
	}
}

func TestLocalWhitelistRepliesDeclareArcOrbit(t *testing.T) {
	for _, q := range []string{"你好", "你能做什么", "我要提交一个bug"} {
		resp, _ := classifyAndRespond(q)
		if resp == nil {
			t.Fatalf("classifyAndRespond(%q) = nil, want 本地白名单回复", q)
		}
		if !strings.Contains(resp.Content, arcOrbitAgentName) {
			t.Errorf("本地回复 %q 缺少平台身份 %q: %q", q, arcOrbitAgentName, resp.Content)
		}
	}
}

func TestFailureFallbacksDeclarePlatform(t *testing.T) {
	for _, reply := range []string{arcOrbitAgentUnavailableReply(), arcOrbitAgentNoResultReply()} {
		if !strings.Contains(reply, arcOrbitAgentName) {
			t.Errorf("兜底文案缺少平台身份 %q: %q", arcOrbitAgentName, reply)
		}
		if !strings.Contains(reply, "跟进") && !strings.Contains(reply, "转人工") {
			t.Errorf("兜底文案应给出后续处理路径: %q", reply)
		}
		if strings.Contains(reply, "我暂时无法回答您的问题") && !strings.Contains(reply, arcOrbitAgentName) {
			t.Errorf("旧无身份兜底仍在使用: %q", reply)
		}
	}
}

func TestBuildQueryWithHistoryUsesArcOrbitRole(t *testing.T) {
	history := []AgentMessageRecord{
		{SenderType: "customer", Content: "在吗"},
		{SenderType: "agent", Content: "在的"},
		{SenderType: "customer", Content: "订单怎么查"},
	}
	out := buildQueryWithHistory("订单怎么查", history, 20)
	if !strings.Contains(out, arcOrbitAgentName+":") {
		t.Errorf("历史中客服角色标注应为 %q，got:\n%s", arcOrbitAgentName, out)
	}
	if strings.Contains(out, "客服助手:") {
		t.Errorf("历史中不得再使用旧角色标签 客服助手:\n%s", out)
	}
}

func TestLocalSearchReplyDeclaresPlatform(t *testing.T) {
	results := []CodeChunkResult{
		{FilePath: "app/order.go", SymbolName: "ListOrders", Snippet: "func ListOrders() {}"},
	}
	reply := buildLocalSearchReply(results)
	if !strings.Contains(reply, arcOrbitAgentName) {
		t.Errorf("本地检索回复缺少平台身份: %q", reply)
	}
	if !strings.Contains(reply, "app/order.go") {
		t.Errorf("本地检索回复应保留代码依据: %q", reply)
	}
}
