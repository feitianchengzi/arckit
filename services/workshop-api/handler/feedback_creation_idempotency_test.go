package handler

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"todo/middleware"
	"todo/models"
)

func confirmedFeedbackData() map[string]interface{} {
	return map[string]interface{}{"structured": AgentStructuredSummary{RequestType: "feature", Position: "订单", Phenomenon: "自动发送日报", Expect: "每天自动收到日报", TargetUsers: "财务", ReproductionSteps: "每天对账前", BusinessGoal: "及时对账", PainPoints: "手工耗时", UnknownFields: []string{"current_workflow", "impact", "frequency", "expected_benefit", "workaround", "constraints"}}, "clarification": map[string]bool{"confirmed": true}}
}
func TestConfirmedConversationCreatesOneFeedback(t *testing.T) {
	for _, mode := range []string{"session", "apikey"} {
		t.Run(mode, func(t *testing.T) {
			db := openFeedbackWorkflowPostgres(t)
			fx := seedFeedbackWorkflowFixture(t, db)
			if err := db.AutoMigrate(&models.ProjectEvent{}); err != nil {
				t.Fatal(err)
			}
			conv := AgentConversation{ID: uuid.NewString(), ProjectID: fx.project.ID, CustomUserID: "owner"}
			db.Create(&conv)
			db.Create(&AgentMessageRecord{ConversationID: conv.ID, ProjectID: conv.ProjectID, SenderType: "customer", Content: "希望自动发送日报"})
			request := func(user string, data map[string]interface{}) *httptest.ResponseRecorder {
				body := map[string]interface{}{"project_id": fx.project.ID, "custom_user_id": user, "title": "日报需求", "content": "自动发送日报", "conversation_id": conv.ID}
				if mode == "apikey" {
					if data != nil {
						raw, _ := json.Marshal(data)
						body["data"] = string(raw)
					}
				} else if data != nil {
					body["data"] = data
				}
				raw, _ := json.Marshal(body)
				r := httptest.NewRecorder()
				c, _ := gin.CreateTestContext(r)
				path := "/workshop/v2/feedback/feedbacks"
				if mode == "apikey" {
					path = "/workshop/v2/apikey/feedbacks"
				}
				c.Request = httptest.NewRequest("POST", path, strings.NewReader(string(raw)))
				c.Request.Header.Set("Content-Type", "application/json")
				c.Set("db", db)
				c.Set("userID", fx.user.ID)
				if mode == "session" {
					c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: fx.project.ID, CustomUserID: user, SessionID: "s"})
					CreateFeedbackFromSession(c)
				} else {
					CreateFeedback(c)
				}
				return r
			}
			if r := request("owner", nil); r.Code != 400 {
				t.Fatalf("conversation bypassed confirmation: %d %s", r.Code, r.Body)
			}
			if r := request("other", confirmedFeedbackData()); r.Code != 403 {
				t.Fatalf("cross customer: %d %s", r.Code, r.Body)
			}
			var wg sync.WaitGroup
			rs := make(chan *httptest.ResponseRecorder, 2)
			for i := 0; i < 2; i++ {
				wg.Add(1)
				go func() { defer wg.Done(); rs <- request("owner", confirmedFeedbackData()) }()
			}
			wg.Wait()
			close(rs)
			ids := []uint{}
			for r := range rs {
				if r.Code != 201 && r.Code != 200 {
					t.Fatalf("creation: %d %s", r.Code, r.Body)
				}
				var body struct {
					Data FeedbackResponse `json:"data"`
				}
				json.Unmarshal(r.Body.Bytes(), &body)
				ids = append(ids, body.Data.ID)
			}
			if ids[0] == 0 || ids[0] != ids[1] {
				t.Fatalf("duplicate cards: %v", ids)
			}
			var count int64
			db.Model(&models.Feedback{}).Where("project_id = ?", fx.project.ID).Count(&count)
			if count != 1 {
				t.Fatalf("created %d cards", count)
			}
			var records []AgentMessageRecord
			db.Where("conversation_id = ?", conv.ID).Find(&records)
			if len(records) != 1 || records[0].FeedbackID != ids[0] {
				t.Fatalf("lost conversation link: %+v", records)
			}
			if r := request("owner", nil); r.Code != 400 {
				t.Fatalf("unconfirmed replay bypass: %d", r.Code)
			}
		})
	}
}

func TestManualFeedbackCreatesOnceWithoutConversation(t *testing.T) {
	for _, mode := range []string{"session", "apikey"} {
		t.Run(mode, func(t *testing.T) {
			db := openFeedbackWorkflowPostgres(t)
			fx := seedFeedbackWorkflowFixture(t, db)
			db.AutoMigrate(&models.ProjectEvent{})
			request := func(user, content, timestamp string) *httptest.ResponseRecorder {
				data := map[string]interface{}{"structured": AgentStructuredSummary{RequestType: "other", Position: "报表", Phenomenon: content, Expect: "获得文件", UnknownFields: []string{"reproduction_steps", "environment", "impact"}}, "clarification": map[string]interface{}{"confirmed": true, "confirmed_at": timestamp}}
				body := map[string]interface{}{"project_id": fx.project.ID, "custom_user_id": user, "title": "客户直接反馈", "content": content, "client_request_id": "manual-retry"}
				if mode == "apikey" {
					raw, _ := json.Marshal(data)
					body["data"] = string(raw)
				} else {
					body["data"] = data
				}
				raw, _ := json.Marshal(body)
				w := httptest.NewRecorder()
				c, _ := gin.CreateTestContext(w)
				path := "/workshop/v2/feedback/feedbacks"
				if mode == "apikey" {
					path = "/workshop/v2/apikey/feedbacks"
				}
				c.Request = httptest.NewRequest("POST", path, strings.NewReader(string(raw)))
				c.Request.Header.Set("Content-Type", "application/json")
				c.Set("db", db)
				c.Set("userID", fx.user.ID)
				if mode == "session" {
					c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: fx.project.ID, CustomUserID: user, SessionID: "test"})
					CreateFeedbackFromSession(c)
				} else {
					CreateFeedback(c)
				}
				return w
			}
			first := request("manual-owner", "导出失败", "first")
			second := request("manual-owner", "导出失败", "retry")
			var a, b struct{ Data FeedbackResponse }
			json.Unmarshal(first.Body.Bytes(), &a)
			json.Unmarshal(second.Body.Bytes(), &b)
			if first.Code != 201 || second.Code != 200 || a.Data.ID == 0 || a.Data.ID != b.Data.ID {
				t.Fatalf("retry not idempotent: %d %s / %d %s", first.Code, first.Body, second.Code, second.Body)
			}
			changed := request("manual-owner", "另一问题", "third")
			if changed.Code < 400 {
				t.Fatalf("changed facts reused receipt: %s", changed.Body)
			}
			other := request("other-owner", "导出失败", "first")
			var o struct{ Data FeedbackResponse }
			json.Unmarshal(other.Body.Bytes(), &o)
			if o.Data.ID == 0 || o.Data.ID == a.Data.ID {
				t.Fatalf("receipt crossed customer scope: %s", other.Body)
			}
		})
	}
}
