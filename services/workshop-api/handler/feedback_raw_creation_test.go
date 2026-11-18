package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"todo/middleware"
	"todo/models"
)

// Raw (unstructured) direct submission is the escape hatch when the model is
// unavailable: the card must be created without any structured assertion, and
// the client_request_id receipt must keep working exactly like the manual path.
func TestRawFeedbackCreatesWithoutStructured(t *testing.T) {
	for _, mode := range []string{"session", "apikey"} {
		t.Run(mode, func(t *testing.T) {
			db := openFeedbackWorkflowPostgres(t)
			fx := seedFeedbackWorkflowFixture(t, db)
			db.AutoMigrate(&models.ProjectEvent{})
			request := func(user, content, receipt string) *httptest.ResponseRecorder {
				body := map[string]interface{}{"project_id": fx.project.ID, "custom_user_id": user, "title": "原样提交", "content": content, "client_request_id": receipt}
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

			first := request("raw-owner", "希望支持跨项目批量导出", "raw-1")
			var created struct {
				Data FeedbackResponse `json:"data"`
			}
			json.Unmarshal(first.Body.Bytes(), &created)
			if first.Code != http.StatusCreated || created.Data.ID == 0 {
				t.Fatalf("raw create failed: %d %s", first.Code, first.Body.String())
			}

			var fb models.Feedback
			if err := db.First(&fb, created.Data.ID).Error; err != nil {
				t.Fatalf("created card not readable: %v", err)
			}
			if fb.Data != nil && strings.Contains(*fb.Data, "structured") {
				t.Fatalf("raw submission must not fabricate structured data: %s", *fb.Data)
			}

			retry := request("raw-owner", "希望支持跨项目批量导出", "raw-1")
			var again struct {
				Data FeedbackResponse `json:"data"`
			}
			json.Unmarshal(retry.Body.Bytes(), &again)
			if retry.Code != http.StatusOK || again.Data.ID != created.Data.ID {
				t.Fatalf("raw retry not idempotent: %d %s / %d %s", retry.Code, retry.Body.String(), again.Data.ID, first.Body.String())
			}

			changed := request("raw-owner", "另一件事", "raw-1")
			if changed.Code < http.StatusBadRequest {
				t.Fatalf("changed raw facts reused receipt: %d %s", changed.Code, changed.Body.String())
			}
		})
	}
}
