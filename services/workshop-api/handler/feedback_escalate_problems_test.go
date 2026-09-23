package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"todo/models"

	"github.com/gin-gonic/gin"
)

func TestShouldMarkAgentMessageUnresolved(t *testing.T) {
	t.Run("low confidence marks unresolved", func(t *testing.T) {
		if !shouldMarkAgentMessageUnresolved(0.74, "已知答案") {
			t.Fatal("confidence 0.74 should mark unresolved")
		}
	})

	t.Run("high confidence without fallback phrase is resolved", func(t *testing.T) {
		if shouldMarkAgentMessageUnresolved(0.9, "ArcOrbit 是桌面自动化运行时") {
			t.Fatal("high confidence should not mark unresolved")
		}
	})

	t.Run("fallback phrase marks unresolved regardless of confidence", func(t *testing.T) {
		if !shouldMarkAgentMessageUnresolved(0.88, arcOrbitAgentNoResultReply()) {
			t.Fatal("no-result reply should mark unresolved")
		}
		if !shouldMarkAgentMessageUnresolved(0.9, "我这边查不到支付流水，建议转人工") {
			t.Fatal("handoff phrase should mark unresolved")
		}
	})

	t.Run("mid-confidence success with follow-up promise is not unresolved", func(t *testing.T) {
		if shouldMarkAgentMessageUnresolved(0.86, "已按文档说明功能类型；补充信息后我会记录并转交 ArcOrbit 平台团队评估跟进。") {
			t.Fatal("mid-confidence answered reply with follow-up promise must not mark unresolved")
		}
		if shouldMarkAgentMessageUnresolved(0.83, "这是当前实现的真实体验问题；我已记录，会转交 ArcOrbit 平台团队跟进。") {
			t.Fatal("mid-confidence explained reply with follow-up promise must not mark unresolved")
		}
	})

	t.Run("unavailable reply marks unresolved", func(t *testing.T) {
		if !shouldMarkAgentMessageUnresolved(0, arcOrbitAgentUnavailableReply()) {
			t.Fatal("unavailable reply should mark unresolved")
		}
	})
}

func TestApplyAgentMessageUnresolvedMetadata(t *testing.T) {
	msg := &AgentMessageRecord{}
	applyAgentMessageUnresolvedMetadata(msg, 0.74, "慢")
	if msg.Metadata == nil {
		t.Fatal("metadata should be set")
	}
	var meta map[string]interface{}
	if err := json.Unmarshal([]byte(*msg.Metadata), &meta); err != nil {
		t.Fatalf("metadata json: %v", err)
	}
	if meta["unresolved"] != true {
		t.Fatalf("unresolved = %#v", meta["unresolved"])
	}

	existing := `{"openhands_conversation_id":"oh-1"}`
	msg2 := &AgentMessageRecord{Metadata: strPtr(existing)}
	applyAgentMessageUnresolvedMetadata(msg2, 0.9, "未找到可靠依据")
	var meta2 map[string]interface{}
	if err := json.Unmarshal([]byte(*msg2.Metadata), &meta2); err != nil {
		t.Fatalf("merged metadata json: %v", err)
	}
	if meta2["openhands_conversation_id"] != "oh-1" {
		t.Fatalf("openhands id lost: %#v", meta2)
	}
	if meta2["unresolved"] != true {
		t.Fatalf("unresolved = %#v", meta2["unresolved"])
	}

	msg3 := &AgentMessageRecord{}
	applyAgentMessageUnresolvedMetadata(msg3, 0.95, "正常高置信回复")
	if msg3.Metadata != nil {
		t.Fatalf("resolved message should not gain metadata: %s", *msg3.Metadata)
	}
}

func TestBuildEscalationProblemTitle(t *testing.T) {
	t.Run("title is problem generated not raw customer message", func(t *testing.T) {
		triage := analyzeFeedback("", "支付回调超时，订单已扣款但状态未更新")
		title := buildEscalationProblemTitle(
			[]string{"在吗", "支付回调超时，订单 ORD-2001 已扣款但状态未更新"},
			[]string{"在的，请说", "我这边查不到支付流水，建议转人工"},
			triage,
		)
		if title == "在吗" || title == "支付回调超时，订单 ORD-2001 已扣款但状态未更新" {
			t.Fatalf("title = %q, want problem-generated title with classification prefix", title)
		}
		if !strings.Contains(title, "支付") && !strings.Contains(title, "回调") && !strings.Contains(title, "订单") {
			t.Fatalf("title should retain problem core: %q", title)
		}
		if utf8Len(title) > 24 {
			t.Fatalf("title length = %d > 24: %q", utf8Len(title), title)
		}
	})

	t.Run("latency complaint becomes experience problem title", func(t *testing.T) {
		triage := analyzeFeedback("", "你就是有点太慢了，回复要等很久")
		title := buildEscalationProblemTitle(
			[]string{"你就是有点太慢了，回复要等很久"},
			[]string{"我这边查不到可靠依据，建议转人工"},
			triage,
		)
		if title == "你就是有点太慢了，回复要等很久" {
			t.Fatalf("title must not be raw customer message: %q", title)
		}
		if !strings.Contains(title, "慢") && !strings.Contains(title, "延迟") && !strings.Contains(title, "等待") && !strings.Contains(title, "体验") {
			t.Fatalf("title should reflect latency problem: %q", title)
		}
		if !strings.HasPrefix(title, "体验：") {
			t.Fatalf("latency title prefix should be 体验 even if triage type is feature: %q (type=%s)", title, triage.Type)
		}
	})
}

func TestExtractUnresolvedProblems(t *testing.T) {
	t.Run("resolved turns are not recorded as problems", func(t *testing.T) {
		messages := []AgentMessageRecord{
			{ID: 1, SenderType: "customer", Content: "在吗"},
			{ID: 2, SenderType: "agent", Content: "在的，请说", Confidence: floatPtr(0.95)},
			{ID: 3, SenderType: "customer", Content: "ArcOrbit 是什么产品啊？"},
			{ID: 4, SenderType: "agent", Content: "ArcOrbit 是桌面自动化运行时", Confidence: floatPtr(0.86)},
		}
		problems := extractUnresolvedProblems(messages, nil, "在吗", "在吗")
		if len(problems) != 0 {
			t.Fatalf("problems = %d, want 0 for fully resolved conversation: %+v", len(problems), problems)
		}
	})

	t.Run("low confidence turn becomes one problem", func(t *testing.T) {
		messages := []AgentMessageRecord{
			{ID: 1, SenderType: "customer", Content: "在吗"},
			{ID: 2, SenderType: "agent", Content: "在的，请说", Confidence: floatPtr(0.95)},
			{ID: 3, SenderType: "customer", Content: "反正就是慢，提个bug"},
			{ID: 4, SenderType: "agent", Content: "我这边查不到可靠依据，建议转人工", Confidence: floatPtr(0.74)},
		}
		problems := extractUnresolvedProblems(messages, nil, "在吗", "在吗")
		if len(problems) != 1 {
			t.Fatalf("problems = %d, want 1: %+v", len(problems), problems)
		}
		p := problems[0]
		if p.Title == "在吗" || p.Title == "反正就是慢，提个bug" {
			t.Fatalf("problem title = %q, want generated problem title", p.Title)
		}
		if !strings.Contains(p.Content, "慢") && !strings.Contains(p.Content, "bug") {
			t.Fatalf("problem content should keep core issue: %q", p.Content)
		}
		if !containsUint(p.EvidenceMessageIDs, 3) || !containsUint(p.EvidenceMessageIDs, 4) {
			t.Fatalf("evidence ids = %v, want include customer+agent low-conf turn", p.EvidenceMessageIDs)
		}
	})

	t.Run("metadata unresolved is respected", func(t *testing.T) {
		meta := `{"unresolved":true}`
		messages := []AgentMessageRecord{
			{ID: 10, SenderType: "customer", Content: "支付失败"},
			{ID: 11, SenderType: "agent", Content: "已按文档处理", Confidence: floatPtr(0.9), Metadata: &meta},
		}
		problems := extractUnresolvedProblems(messages, nil, "支付失败", "支付失败")
		if len(problems) != 1 {
			t.Fatalf("problems = %d, want 1 from metadata.unresolved", len(problems))
		}
	})

	t.Run("multiple distinct unresolved topics split into multiple problems", func(t *testing.T) {
		messages := []AgentMessageRecord{
			{ID: 1, SenderType: "customer", Content: "支付回调一直超时"},
			{ID: 2, SenderType: "agent", Content: "未找到可靠依据，建议转人工", Confidence: floatPtr(0.7)},
			{ID: 3, SenderType: "customer", Content: "另外图片上传也报错"},
			{ID: 4, SenderType: "agent", Content: "我这边查不到上传日志，建议转人工", Confidence: floatPtr(0.72)},
		}
		problems := extractUnresolvedProblems(messages, nil, "支付回调一直超时", "支付回调一直超时")
		if len(problems) != 2 {
			t.Fatalf("problems = %d, want 2 distinct topics: %+v", len(problems), problems)
		}
	})

	t.Run("explicit escalate reason becomes problem when all turns resolved", func(t *testing.T) {
		reason := "客户坚持要求人工核对支付流水"
		messages := []AgentMessageRecord{
			{ID: 1, SenderType: "customer", Content: "在吗"},
			{ID: 2, SenderType: "agent", Content: "在的", Confidence: floatPtr(0.95)},
		}
		problems := extractUnresolvedProblems(messages, &reason, "在吗", "在吗")
		if len(problems) != 1 {
			t.Fatalf("problems = %d, want 1 fallback problem from reason", len(problems))
		}
		if !strings.Contains(problems[0].Content, "人工核对支付流水") {
			t.Fatalf("fallback content missing reason: %q", problems[0].Content)
		}
	})

	t.Run("no customer messages and no reason returns empty", func(t *testing.T) {
		problems := extractUnresolvedProblems(nil, nil, "标题", "内容")
		if len(problems) != 0 {
			t.Fatalf("problems = %d, want 0", len(problems))
		}
	})
}

func TestEscalateAgentSessionSplitsProblemsPostgres(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("FEEDBACK_V2_NOTIFICATION_PROJECT_IDS", "")
	db := openFeedbackWorkflowPostgres(t)
	fixture := seedFeedbackWorkflowFixture(t, db)

	t.Run("only unresolved turns create feedbacks with generated titles", func(t *testing.T) {
		feedback := fixture.createAgentSessionFeedback(t, "在吗")
		fixture.seedAgentConversation(t, feedback.ID, []AgentMessageRecord{
			{SenderType: "customer", Content: "在吗"},
			{SenderType: "agent", Content: "在的，请说", Confidence: floatPtr(0.95)},
			{SenderType: "customer", Content: "ArcOrbit 是什么产品啊？"},
			{SenderType: "agent", Content: "ArcOrbit 是桌面自动化运行时", Confidence: floatPtr(0.86)},
			{SenderType: "customer", Content: "反正就是太慢了，提个bug"},
			{SenderType: "agent", Content: "我这边查不到可靠依据，建议转人工", Confidence: floatPtr(0.74)},
		})

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{"reason":"low confidence"}`, EscalateFeedbackHandler)
		if response.Code != http.StatusOK {
			t.Fatalf("escalate status = %d; body=%s", response.Code, response.Body.String())
		}

		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if envelope.Data.ProblemCount != 1 || len(envelope.Data.CreatedFeedbackIDs) != 1 {
			t.Fatalf("split = %#v, want exactly 1 problem feedback", envelope.Data)
		}

		var problem models.Feedback
		if err := db.First(&problem, envelope.Data.CreatedFeedbackIDs[0]).Error; err != nil {
			t.Fatalf("load problem feedback: %v", err)
		}
		if problem.Title == "在吗" || problem.Title == "反正就是太慢了，提个bug" || problem.Title == "ArcOrbit 是什么产品啊？" {
			t.Fatalf("problem title = %q, want generated from problem not customer message", problem.Title)
		}
		if strings.Contains(problem.Title, "ArcOrbit 是什么") {
			t.Fatalf("resolved product question leaked into title: %q", problem.Title)
		}
		if !strings.Contains(problem.Content, "慢") && !strings.Contains(problem.Content, "bug") {
			t.Fatalf("problem content missing unresolved issue: %q", problem.Content)
		}
		if strings.Contains(problem.Content, "ArcOrbit 是什么产品") {
			t.Fatalf("resolved turn leaked into problem content: %q", problem.Content)
		}

		data := parseFeedbackPayload(problem.Data)
		if data["escalated"] != true {
			t.Fatalf("problem data.escalated = %#v", data["escalated"])
		}
		if data["source"] != "agent_chat" {
			t.Fatalf("problem data.source = %#v", data["source"])
		}
		fromID, _ := data["from_conversation_feedback_id"].(float64)
		if uint(fromID) != feedback.ID {
			t.Fatalf("from_conversation_feedback_id = %#v, want %d", data["from_conversation_feedback_id"], feedback.ID)
		}

		// 容器会话保持隐藏：不写 escalated
		var container models.Feedback
		if err := db.First(&container, feedback.ID).Error; err != nil {
			t.Fatalf("reload container: %v", err)
		}
		containerData := parseFeedbackPayload(container.Data)
		if containerData["escalated"] == true {
			t.Fatalf("container should stay hidden, data = %#v", containerData)
		}
		if container.Title != "在吗" {
			t.Fatalf("container title should stay original session first message: %q", container.Title)
		}

		// 每个问题各自有主任务
		var taskCount int64
		if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", problem.ID).Count(&taskCount).Error; err != nil {
			t.Fatalf("count tasks: %v", err)
		}
		if taskCount != 1 {
			t.Fatalf("problem task count = %d, want 1", taskCount)
		}
		var containerTask int64
		if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", feedback.ID).Count(&containerTask).Error; err != nil {
			t.Fatalf("count container tasks: %v", err)
		}
		if containerTask != 0 {
			t.Fatalf("container task count = %d, want 0", containerTask)
		}

		// 幂等：再次 escalate 不重复建问题反馈
		again := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{"reason":"low confidence"}`, EscalateFeedbackHandler)
		if again.Code != http.StatusOK {
			t.Fatalf("second escalate status = %d; body=%s", again.Code, again.Body.String())
		}
		var envelope2 struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(again.Body.Bytes(), &envelope2); err != nil {
			t.Fatalf("unmarshal second: %v", err)
		}
		if !envelope2.Data.AlreadyEscalated || envelope2.Data.ProblemCount != 0 {
			t.Fatalf("second escalate = %#v, want already_escalated with 0 new problems", envelope2.Data)
		}
		var totalProblems int64
		if err := db.Model(&models.Feedback{}).Where("id <> ? AND data LIKE ?", feedback.ID, fmt.Sprintf(`%%"from_conversation_feedback_id":%d%%`, feedback.ID)).Count(&totalProblems).Error; err != nil {
			t.Fatalf("count problem feedbacks: %v", err)
		}
		if totalProblems != 1 {
			t.Fatalf("problem feedback count = %d, want 1 (idempotent)", totalProblems)
		}
	})

	t.Run("multiple unresolved topics create multiple feedbacks", func(t *testing.T) {
		feedback := fixture.createAgentSessionFeedback(t, "支付问题")
		fixture.seedAgentConversation(t, feedback.ID, []AgentMessageRecord{
			{SenderType: "customer", Content: "支付回调一直超时"},
			{SenderType: "agent", Content: "未找到可靠依据，建议转人工", Confidence: floatPtr(0.7)},
			{SenderType: "customer", Content: "另外图片上传也报错"},
			{SenderType: "agent", Content: "我这边查不到上传日志，建议转人工", Confidence: floatPtr(0.72)},
		})

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{}`, EscalateFeedbackHandler)
		if response.Code != http.StatusOK {
			t.Fatalf("escalate status = %d; body=%s", response.Code, response.Body.String())
		}
		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if envelope.Data.ProblemCount != 2 || len(envelope.Data.CreatedFeedbackIDs) != 2 {
			t.Fatalf("split = %#v, want 2 problems", envelope.Data)
		}
		for _, id := range envelope.Data.CreatedFeedbackIDs {
			var problem models.Feedback
			if err := db.First(&problem, id).Error; err != nil {
				t.Fatalf("load problem %d: %v", id, err)
			}
			if problem.Title == "支付回调一直超时" || problem.Title == "另外图片上传也报错" {
				t.Fatalf("problem title raw customer message: %q", problem.Title)
			}
			var taskCount int64
			if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", problem.ID).Count(&taskCount).Error; err != nil {
				t.Fatalf("count tasks: %v", err)
			}
			if taskCount != 1 {
				t.Fatalf("problem %d task count = %d, want 1", problem.ID, taskCount)
			}
		}
	})

	t.Run("list shows only problem feedbacks after escalate", func(t *testing.T) {
		hidden := fixture.createAgentSessionFeedback(t, "首句问题")
		shownNormal := fixture.createFeedback(t, models.FeedbackTriagePending)
		fixture.seedAgentConversation(t, hidden.ID, []AgentMessageRecord{
			{SenderType: "customer", Content: "登录一直失败"},
			{SenderType: "agent", Content: "建议转人工", Confidence: floatPtr(0.7)},
		})

		list := performGetFeedbacksRequest(db, fixture.user.ID,
			fmt.Sprintf("project_id=%d&page=1&page_size=100", fixture.project.ID))
		if list.Code != http.StatusOK {
			t.Fatalf("list status = %d; body=%s", list.Code, list.Body.String())
		}
		ids := feedbackIDsFromListResponse(t, list)
		if containsUint(ids, hidden.ID) {
			t.Fatalf("unescalated agent session %d should be hidden: %v", hidden.ID, ids)
		}
		if !containsUint(ids, shownNormal.ID) {
			t.Fatalf("normal feedback %d missing: %v", shownNormal.ID, ids)
		}

		esc := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", hidden.ID), hidden.ID, `{}`, EscalateFeedbackHandler)
		if esc.Code != http.StatusOK {
			t.Fatalf("escalate status = %d; body=%s", esc.Code, esc.Body.String())
		}
		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(esc.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if len(envelope.Data.CreatedFeedbackIDs) != 1 {
			t.Fatalf("created = %#v, want 1 problem", envelope.Data)
		}

		list = performGetFeedbacksRequest(db, fixture.user.ID,
			fmt.Sprintf("project_id=%d&page=1&page_size=100", fixture.project.ID))
		if list.Code != http.StatusOK {
			t.Fatalf("list after status = %d; body=%s", list.Code, list.Body.String())
		}
		ids = feedbackIDsFromListResponse(t, list)
		if containsUint(ids, hidden.ID) {
			t.Fatalf("session container %d must stay hidden: %v", hidden.ID, ids)
		}
		if !containsUint(ids, envelope.Data.CreatedFeedbackIDs[0]) {
			t.Fatalf("problem feedback %d should be visible: %v", envelope.Data.CreatedFeedbackIDs[0], ids)
		}
	})
}

func floatPtr(v float64) *float64 { return &v }

func utf8Len(s string) int {
	return len([]rune(s))
}
