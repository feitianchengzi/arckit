package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
)

func TestBuildEscalationProblemSummary(t *testing.T) {
	t.Run("builds single problem content from customer questions without first-message-only", func(t *testing.T) {
		problems := extractUnresolvedProblems([]AgentMessageRecord{
			{SenderType: "customer", Content: "在吗"},
			{SenderType: "agent", Content: "在的，请说", Confidence: floatPtr(0.95)},
			{SenderType: "customer", Content: "订单支付后一直显示待支付，刷新也没用"},
			{SenderType: "agent", Content: "未找到可靠依据，建议转人工", Confidence: floatPtr(0.72)},
			{SenderType: "customer", Content: "订单号 ORD-10086，已经扣款了"},
			{SenderType: "agent", Content: "建议转人工", Confidence: floatPtr(0.7)},
			{SenderType: "system", Content: "升级提示"},
		}, nil, "在吗", "在吗")

		if len(problems) != 1 {
			t.Fatalf("problems = %d, want 1: %+v", len(problems), problems)
		}
		content := problems[0].Content
		if !strings.Contains(content, "ORD-10086") {
			t.Fatalf("content missing later question: %q", content)
		}
		if !strings.Contains(content, "待支付") {
			t.Fatalf("content missing core issue: %q", content)
		}
		if strings.Count(content, "在吗") > 1 {
			t.Fatalf("content should not be raw first message dump: %q", content)
		}
	})

	t.Run("appends escalate reason", func(t *testing.T) {
		reason := "需要人工核对支付流水"
		problems := extractUnresolvedProblems([]AgentMessageRecord{
			{SenderType: "customer", Content: "退款没到账"},
			{SenderType: "agent", Content: "建议转人工", Confidence: floatPtr(0.7)},
		}, &reason, "退款没到账", "退款没到账")
		if len(problems) != 1 {
			t.Fatalf("problems = %d, want 1", len(problems))
		}
		if !strings.Contains(problems[0].Content, "需要人工核对支付流水") {
			t.Fatalf("content missing reason: %q", problems[0].Content)
		}
	})

	t.Run("falls back when no customer messages and no reason", func(t *testing.T) {
		problems := extractUnresolvedProblems(nil, nil, "标题", "内容")
		if len(problems) != 0 {
			t.Fatalf("problems = %+v, want empty", problems)
		}
	})
}

func TestEscalateFeedbackPostgres(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("FEEDBACK_V2_NOTIFICATION_PROJECT_IDS", "")
	db := openFeedbackWorkflowPostgres(t)
	fixture := seedFeedbackWorkflowFixture(t, db)

	t.Run("user channel escalates pending feedback to task", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{"reason":"agent cannot answer"}`, EscalateFeedbackHandler)
		if response.Code != http.StatusOK {
			t.Fatalf("escalate status = %d, want 200; body=%s", response.Code, response.Body.String())
		}

		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal escalate response: %v", err)
		}
		if envelope.Data.TaskID == nil || envelope.Data.AlreadyEscalated {
			t.Fatalf("escalate response = %#v", envelope.Data)
		}
		if envelope.Data.Triage.Type == "" {
			t.Fatalf("escalate triage missing: %#v", envelope.Data.Triage)
		}

		// 反馈状态推进
		var updated models.Feedback
		if err := db.First(&updated, feedback.ID).Error; err != nil {
			t.Fatalf("reload escalated feedback: %v", err)
		}
		if updated.TriageStatus != models.FeedbackTriageAccepted {
			t.Fatalf("triage status = %s, want accepted", updated.TriageStatus)
		}

		// 系统消息写入
		var messageCount int64
		if err := db.Model(&models.FeedbackMessage{}).Where("feedback_id = ? AND content LIKE ?", feedback.ID, "%升级人工处理%").Count(&messageCount).Error; err != nil {
			t.Fatalf("count escalate messages: %v", err)
		}
		if messageCount != 1 {
			t.Fatalf("escalate message count = %d, want 1", messageCount)
		}

		// 任务存在且 pending_review
		var task models.Task
		if err := db.First(&task, *envelope.Data.TaskID).Error; err != nil {
			t.Fatalf("load escalated task: %v", err)
		}
		if task.State != models.TaskStatePendingReview || task.SourceFeedbackID == nil || *task.SourceFeedbackID != feedback.ID {
			t.Fatalf("escalated task = %#v", task)
		}
	})

	t.Run("escalate is idempotent when task already exists", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		first := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID, `{}`, EscalateFeedbackHandler)
		if first.Code != http.StatusOK {
			t.Fatalf("first escalate status = %d; body=%s", first.Code, first.Body.String())
		}
		second := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID, `{}`, EscalateFeedbackHandler)
		if second.Code != http.StatusOK {
			t.Fatalf("second escalate status = %d; body=%s", second.Code, second.Body.String())
		}

		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(second.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal second escalate: %v", err)
		}
		if !envelope.Data.AlreadyEscalated {
			t.Fatalf("second escalate should report already_escalated: %#v", envelope.Data)
		}

		var taskCount int64
		if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", feedback.ID).Count(&taskCount).Error; err != nil {
			t.Fatalf("count escalated tasks: %v", err)
		}
		if taskCount != 1 {
			t.Fatalf("escalated task count = %d, want 1 (idempotent)", taskCount)
		}
	})

	t.Run("apikey channel with matching custom user id escalates", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		customID := "customer-abc"
		feedback.CustomUserID = &customID
		if err := db.Save(&feedback).Error; err != nil {
			t.Fatalf("set custom user id: %v", err)
		}

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/apikey/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			fmt.Sprintf(`{"custom_user_id":%q}`, customID), EscalateFeedbackHandler)
		if response.Code != http.StatusOK {
			t.Fatalf("apikey escalate status = %d; body=%s", response.Code, response.Body.String())
		}

		var taskCount int64
		if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", feedback.ID).Count(&taskCount).Error; err != nil {
			t.Fatalf("count apikey escalated tasks: %v", err)
		}
		if taskCount != 1 {
			t.Fatalf("apikey escalated task count = %d, want 1", taskCount)
		}
	})

	t.Run("apikey channel with wrong custom user id is rejected", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		customID := "customer-abc"
		feedback.CustomUserID = &customID
		if err := db.Save(&feedback).Error; err != nil {
			t.Fatalf("set custom user id: %v", err)
		}

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/apikey/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{"custom_user_id":"someone-else"}`, EscalateFeedbackHandler)
		if response.Code != http.StatusForbidden {
			t.Fatalf("wrong custom user escalate status = %d, want 403; body=%s", response.Code, response.Body.String())
		}

		var taskCount int64
		if err := db.Model(&models.Task{}).Where("source_feedback_id = ?", feedback.ID).Count(&taskCount).Error; err != nil {
			t.Fatalf("count rejected escalate tasks: %v", err)
		}
		if taskCount != 0 {
			t.Fatalf("rejected escalate task count = %d, want 0", taskCount)
		}
	})

	t.Run("ignored feedback cannot escalate", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriageIgnored)
		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID, `{}`, EscalateFeedbackHandler)
		if response.Code != http.StatusConflict {
			t.Fatalf("ignored escalate status = %d, want 409; body=%s", response.Code, response.Body.String())
		}
	})

	t.Run("escalate agent session creates problem feedbacks and keeps container hidden", func(t *testing.T) {
		feedback := fixture.createAgentSessionFeedback(t, "在吗")
		fixture.seedAgentConversation(t, feedback.ID, []AgentMessageRecord{
			{SenderType: "customer", Content: "在吗"},
			{SenderType: "agent", Content: "在的，请说", Confidence: floatPtr(0.95)},
			{SenderType: "customer", Content: "支付回调超时，订单 ORD-2001 已扣款但状态未更新"},
			{SenderType: "agent", Content: "我这边查不到支付流水，建议转人工", Confidence: floatPtr(0.7)},
		})

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost,
			fmt.Sprintf("/workshop/v2/user/feedbacks/%d/escalate", feedback.ID), feedback.ID,
			`{"reason":"agent low confidence"}`, EscalateFeedbackHandler)
		if response.Code != http.StatusOK {
			t.Fatalf("escalate status = %d, want 200; body=%s", response.Code, response.Body.String())
		}

		var envelope struct {
			Data EscalateFeedbackResponse `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if len(envelope.Data.CreatedFeedbackIDs) != 1 {
			t.Fatalf("created = %#v, want 1 problem feedback", envelope.Data)
		}

		var problem models.Feedback
		if err := db.First(&problem, envelope.Data.CreatedFeedbackIDs[0]).Error; err != nil {
			t.Fatalf("load problem: %v", err)
		}
		if problem.Title == "在吗" || problem.Title == "支付回调超时，订单 ORD-2001 已扣款但状态未更新" {
			t.Fatalf("title = %q, want generated problem title not customer message", problem.Title)
		}
		if !strings.Contains(problem.Content, "支付回调超时") || !strings.Contains(problem.Content, "ORD-2001") {
			t.Fatalf("content = %q, want full problem summary", problem.Content)
		}
		if !strings.Contains(problem.Content, "agent low confidence") {
			t.Fatalf("content missing escalate reason: %q", problem.Content)
		}
		data := parseFeedbackPayload(problem.Data)
		if escalated, _ := data["escalated"].(bool); !escalated {
			t.Fatalf("problem data.escalated = %#v, want true", data["escalated"])
		}
		if source, _ := data["source"].(string); source != "agent_chat" {
			t.Fatalf("problem data.source = %#v, want agent_chat", data["source"])
		}

		var container models.Feedback
		if err := db.First(&container, feedback.ID).Error; err != nil {
			t.Fatalf("reload container: %v", err)
		}
		containerData := parseFeedbackPayload(container.Data)
		if escalated, _ := containerData["escalated"].(bool); escalated {
			t.Fatalf("container data.escalated = %#v, want stay hidden", containerData["escalated"])
		}
		if container.Title != "在吗" {
			t.Fatalf("container title = %q, want unchanged session first message", container.Title)
		}
	})

	t.Run("GetFeedbacks hides agent session container; shows problem feedback after escalate", func(t *testing.T) {
		hidden := fixture.createAgentSessionFeedback(t, "首句问题")
		shownNormal := fixture.createFeedback(t, models.FeedbackTriagePending)
		fixture.seedAgentConversation(t, hidden.ID, []AgentMessageRecord{
			{SenderType: "customer", Content: "登录一直失败"},
			{SenderType: "agent", Content: "建议转人工", Confidence: floatPtr(0.7)},
		})

		list := performGetFeedbacksRequest(db, fixture.user.ID,
			fmt.Sprintf("project_id=%d&page=1&page_size=50", fixture.project.ID))
		if list.Code != http.StatusOK {
			t.Fatalf("list status = %d; body=%s", list.Code, list.Body.String())
		}
		ids := feedbackIDsFromListResponse(t, list)
		if has := containsUint(ids, hidden.ID); has {
			t.Fatalf("unescalated agent session feedback %d should be hidden, got %v", hidden.ID, ids)
		}
		if !containsUint(ids, shownNormal.ID) {
			t.Fatalf("normal feedback %d missing from list: %v", shownNormal.ID, ids)
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
			t.Fatalf("created = %#v, want 1", envelope.Data)
		}

		list = performGetFeedbacksRequest(db, fixture.user.ID,
			fmt.Sprintf("project_id=%d&page=1&page_size=50", fixture.project.ID))
		if list.Code != http.StatusOK {
			t.Fatalf("list after escalate status = %d; body=%s", list.Code, list.Body.String())
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

func performGetFeedbacksRequest(db *gormDB, userID uint, query string) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	path := "/workshop/v2/user/feedbacks"
	if query != "" {
		path += "?" + query
	}
	ctx.Request = httptest.NewRequest(http.MethodGet, path, nil)
	ctx.Set("db", db)
	ctx.Set("userID", userID)
	GetFeedbacks(ctx)
	return recorder
}

func feedbackIDsFromListResponse(t *testing.T, recorder *httptest.ResponseRecorder) []uint {
	t.Helper()
	var envelope struct {
		Data []FeedbackResponse `json:"data"`
		Meta response.Meta      `json:"meta"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &envelope); err != nil {
		t.Fatalf("unmarshal list response: %v; body=%s", err, recorder.Body.String())
	}
	ids := make([]uint, 0, len(envelope.Data))
	for _, item := range envelope.Data {
		ids = append(ids, item.ID)
	}
	return ids
}

func containsUint(values []uint, target uint) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
