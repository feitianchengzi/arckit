package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"

	"todo/models"

	"github.com/gin-gonic/gin"
)

// PRD 安全验收 AC-F04：AI 分诊初判与分诊决策同权，member 触发必须 403。
func TestTriageHandlerRejectsMemberRole(t *testing.T) {
	dsn := strings.TrimSpace(os.Getenv(feedbackWorkflowPostgresDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run triage handler permission tests", feedbackWorkflowPostgresDSNEnv)
	}

	gin.SetMode(gin.TestMode)

	cases := []struct {
		name       string
		role       string
		wantStatus int
	}{
		{"owner can triage", models.ProjectRoleOwner, http.StatusOK},
		{"admin can triage", models.ProjectRoleAdmin, http.StatusOK},
		{"member cannot triage", models.ProjectRoleMember, http.StatusForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db := openTriagePermissionTestDB(t)
			defer closeTriagePermissionTestDB(t, db)
			if err := db.AutoMigrate(&models.Feedback{}); err != nil {
				t.Fatalf("migrate feedback: %v", err)
			}

			user := models.User{Username: "triage-handler-" + tc.role}
			if err := db.Create(&user).Error; err != nil {
				t.Fatalf("create user: %v", err)
			}
			project := models.Project{Name: "Triage handler test", CreatorID: user.ID}
			if err := db.Create(&project).Error; err != nil {
				t.Fatalf("create project: %v", err)
			}
			member := models.ProjectMember{ProjectID: project.ID, UserID: user.ID, Role: tc.role}
			if err := db.Create(&member).Error; err != nil {
				t.Fatalf("create member: %v", err)
			}
			feedback := models.Feedback{ProjectID: project.ID, Title: "E2E", Content: "登录无响应", Status: models.FeedbackStatusPending}
			if err := db.Create(&feedback).Error; err != nil {
				t.Fatalf("create feedback: %v", err)
			}

			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			feedbackID := strconv.FormatUint(uint64(feedback.ID), 10)
			context.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/feedbacks/"+feedbackID+"/triage", nil)
			context.Params = gin.Params{{Key: "id", Value: feedbackID}}
			context.Set("db", db)
			context.Set("userID", user.ID)

			TriageHandler(context)

			if recorder.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tc.wantStatus, recorder.Body.String())
			}
			if tc.wantStatus == http.StatusOK {
				var body struct {
					Data struct {
						Triage map[string]any `json:"triage"`
					} `json:"data"`
				}
				if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if body.Data.Triage == nil || body.Data.Triage["type"] == nil {
					t.Fatalf("expected triage payload, got %s", recorder.Body.String())
				}
			}
		})
	}
}
