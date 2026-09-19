package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestMapTaskStateToFeedbackStatus(t *testing.T) {
	cases := map[string]string{
		models.TaskStatePending:       models.FeedbackStatusConverted,
		models.TaskStatePendingReview: models.FeedbackStatusConverted,
		models.TaskStateInProgress:    models.FeedbackStatusInProgress,
		models.TaskStateBlocked:       models.FeedbackStatusInProgress,
		models.TaskStateCompleted:     models.FeedbackStatusCompleted,
		models.TaskStateAccepted:      models.FeedbackStatusCompleted,
		models.TaskStateCancelled:     models.FeedbackStatusIgnored,
	}

	for taskState, expected := range cases {
		if actual := mapTaskStateToFeedbackStatus(taskState); actual != expected {
			t.Fatalf("task state %s mapped to %s, want %s", taskState, actual, expected)
		}
	}
}

func TestFeedbackStatusFromData(t *testing.T) {
	data := `{"feedback_state":"in_progress","status":"developing"}`
	if actual := feedbackStatusFromData(&data, models.FeedbackStatusPending); actual != models.FeedbackStatusInProgress {
		t.Fatalf("status from data = %s, want %s", actual, models.FeedbackStatusInProgress)
	}

	invalid := `not-json`
	if actual := feedbackStatusFromData(&invalid, models.FeedbackStatusAccepted); actual != models.FeedbackStatusAccepted {
		t.Fatalf("invalid data fallback = %s, want %s", actual, models.FeedbackStatusAccepted)
	}
}

func TestFeedbackTriageAndCustomerStatus(t *testing.T) {
	cases := []struct {
		name         string
		feedback     models.Feedback
		wantTriage   string
		wantCustomer string
	}{
		{
			name:         "new feedback waits for triage",
			feedback:     models.Feedback{Status: models.FeedbackStatusPending},
			wantTriage:   models.FeedbackTriagePending,
			wantCustomer: "submitted",
		},
		{
			name:         "linked task pending review is accepted for customer",
			feedback:     models.Feedback{Status: models.FeedbackStatusConverted, TriageStatus: models.FeedbackTriageAccepted},
			wantTriage:   models.FeedbackTriageAccepted,
			wantCustomer: "reviewing",
		},
		{
			name:         "task progress is customer developing",
			feedback:     models.Feedback{Status: models.FeedbackStatusInProgress, TriageStatus: models.FeedbackTriageAccepted},
			wantTriage:   models.FeedbackTriageAccepted,
			wantCustomer: "developing",
		},
		{
			name:         "cancelled task keeps accepted triage but closes customer view",
			feedback:     models.Feedback{Status: models.FeedbackStatusIgnored, TriageStatus: models.FeedbackTriageAccepted},
			wantTriage:   models.FeedbackTriageAccepted,
			wantCustomer: "ignored",
		},
		{
			name:         "console ignored feedback is customer ignored",
			feedback:     models.Feedback{Status: models.FeedbackStatusIgnored, TriageStatus: models.FeedbackTriageIgnored},
			wantTriage:   models.FeedbackTriageIgnored,
			wantCustomer: "ignored",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := feedbackTriageStatus(tc.feedback); actual != tc.wantTriage {
				t.Fatalf("triage status = %s, want %s", actual, tc.wantTriage)
			}
			if actual := customerStatusFromFeedback(tc.feedback); actual != tc.wantCustomer {
				t.Fatalf("customer status = %s, want %s", actual, tc.wantCustomer)
			}
		})
	}
}

func TestRestoredFeedbackProjectsPendingState(t *testing.T) {
	data := `{"feedback_state":"ignored","status":"ignored","keep":"value"}`
	updated := mergeFeedbackData(&data, models.FeedbackStatusPending, nil)
	if updated == nil {
		t.Fatal("restored feedback data is nil")
	}

	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(*updated), &payload); err != nil {
		t.Fatalf("restored feedback data is invalid json: %v", err)
	}
	if payload["feedback_state"] != models.FeedbackStatusPending {
		t.Fatalf("feedback_state = %v, want pending", payload["feedback_state"])
	}
	if payload["status"] != "analyzing" {
		t.Fatalf("status = %v, want analyzing", payload["status"])
	}
	if payload["keep"] != "value" {
		t.Fatalf("unrelated metadata was not preserved: %#v", payload)
	}
}

func TestRestoreFeedbackRejectsAPIKeyBeforeDatabaseAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/apikey/feedbacks/7/restore", nil)
	context.Params = gin.Params{{Key: "id", Value: "7"}}

	RestoreFeedback(context)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusForbidden, recorder.Body.String())
	}
}

func TestBuildFeedbackResponseIncludesWorkflowProjection(t *testing.T) {
	data := `{"converted_task_id":42,"task_state":"in_progress"}`
	feedback := models.Feedback{
		ID:           7,
		ProjectID:    3,
		ShortID:      "FLOW42",
		Title:        "状态同步",
		Content:      "验证工作流响应",
		Status:       models.FeedbackStatusInProgress,
		TriageStatus: models.FeedbackTriageAccepted,
		Data:         &data,
	}
	response := buildFeedbackResponse(feedback)
	if response.TriageStatus != models.FeedbackTriageAccepted {
		t.Fatalf("triage status = %s, want %s", response.TriageStatus, models.FeedbackTriageAccepted)
	}
	if response.CustomerStatus != "developing" {
		t.Fatalf("customer status = %s, want developing", response.CustomerStatus)
	}
	if response.TaskID == nil || *response.TaskID != 42 {
		t.Fatalf("task id = %#v, want 42", response.TaskID)
	}
	if response.TaskState != "in_progress" {
		t.Fatalf("task state = %s, want in_progress", response.TaskState)
	}
}

func TestFeedbackSessionAttachmentConstraints(t *testing.T) {
	t.Setenv("OSS_ROOT_PATH", "/workshop")
	prefix := feedbackAttachmentPrefix(12, "customer-42")
	size := int64(1024)
	objectKey := prefix + "screenshot.png"
	mimeType := "image/png"

	attachment, err := buildFeedbackMessageAttachment(FeedbackMessageAttachmentInput{
		Type:      "image",
		ObjectKey: &objectKey,
		MimeType:  &mimeType,
		Size:      &size,
	}, prefix)
	if err != nil {
		t.Fatalf("valid scoped image attachment rejected: %v", err)
	}
	if attachment.ObjectKey == nil || *attachment.ObjectKey != objectKey {
		t.Fatalf("object key = %#v, want %q", attachment.ObjectKey, objectKey)
	}

	outsideKey := "workshop/feedbacks/v2/other-user/screenshot.png"
	if _, err := buildFeedbackMessageAttachment(FeedbackMessageAttachmentInput{
		Type:      "image",
		ObjectKey: &outsideKey,
		MimeType:  &mimeType,
		Size:      &size,
	}, prefix); err == nil {
		t.Fatal("attachment outside session prefix should be rejected")
	}

	httpURL := "http://example.com/image.png"
	if _, err := buildFeedbackMessageAttachment(FeedbackMessageAttachmentInput{
		Type: "url",
		URL:  &httpURL,
	}, prefix); err == nil {
		t.Fatal("non-HTTPS URL attachment should be rejected")
	}
}

func TestV2APIKeyFeedbackRequiresCustomUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(http.MethodPost, "/workshop/v2/apikey/feedbacks", strings.NewReader(`{"project_id":1,"title":"test","content":"test"}`))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request

	CreateFeedback(context)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
	}
}

func TestInitialFeedbackMessageMetadataHasStableSource(t *testing.T) {
	metadata := initialFeedbackMessageMetadata(false)
	if metadata == nil {
		t.Fatal("initial feedback metadata should not be nil")
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(*metadata), &parsed); err != nil {
		t.Fatalf("metadata is invalid json: %v", err)
	}
	if parsed["source"] != "feedback_initial" {
		t.Fatalf("metadata source = %v", parsed["source"])
	}
}

func TestFeedbackEmailEventTypeDistinguishesInitialAndReply(t *testing.T) {
	initial := models.FeedbackMessage{
		SenderType: models.FeedbackMessageSenderCustomer,
		Metadata:   initialFeedbackMessageMetadata(false),
	}
	if got := feedbackEmailEventType(initial); got != models.FeedbackEmailEventNewFeedback {
		t.Fatalf("initial event = %s, want %s", got, models.FeedbackEmailEventNewFeedback)
	}
	if got := feedbackEmailEventType(models.FeedbackMessage{SenderType: models.FeedbackMessageSenderCustomer}); got != models.FeedbackEmailEventCustomerReply {
		t.Fatalf("reply event = %s, want %s", got, models.FeedbackEmailEventCustomerReply)
	}
}

func TestFeedbackEmailNotificationsDefaultOff(t *testing.T) {
	t.Setenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED", "")
	if feedbackEmailNotificationsEnabled() {
		t.Fatal("email notifications must default to disabled")
	}
	t.Setenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED", "true")
	if !feedbackEmailNotificationsEnabled() {
		t.Fatal("email notifications should be enabled only after explicit opt-in")
	}
}

func TestBuildFeedbackTaskAttachmentCommentUsesRichAttachmentMarkers(t *testing.T) {
	imageKey := "workshop/feedbacks/v2/12/user/screenshot.png"
	fileKey := "workshop/feedbacks/v2/12/user/log.txt"
	externalURL := "https://example.com/spec.pdf"
	content := buildFeedbackTaskAttachmentComment(models.Feedback{
		ID:      7,
		ShortID: "FB7",
	}, models.FeedbackMessage{
		SenderType: models.FeedbackMessageSenderCustomer,
		Metadata:   initialFeedbackMessageMetadata(false),
	}, []models.FeedbackMessageAttachment{
		{Type: models.FeedbackAttachmentTypeImage, ObjectKey: &imageKey},
		{Type: models.FeedbackAttachmentTypeFile, ObjectKey: &fileKey},
		{Type: models.FeedbackAttachmentTypeURL, URL: &externalURL},
	})

	for _, expected := range []string{
		"来源反馈 #FB7 的附件：",
		"[image](" + imageKey + ")",
		"[file](" + fileKey + ")",
		"[link](" + externalURL + ")",
	} {
		if !strings.Contains(content, expected) {
			t.Fatalf("attachment comment missing %q: %s", expected, content)
		}
	}
}

func TestBuildFeedbackTaskAttachmentCommentKeepsSupplementContext(t *testing.T) {
	imageKey := "workshop/feedbacks/v2/12/user/supplement.png"
	content := buildFeedbackTaskAttachmentComment(models.Feedback{
		ID:      7,
		ShortID: "FB7",
	}, models.FeedbackMessage{
		SenderType: models.FeedbackMessageSenderCustomer,
		Content:    "补充复现步骤",
	}, []models.FeedbackMessageAttachment{{
		Type:      models.FeedbackAttachmentTypeImage,
		ObjectKey: &imageKey,
	}})

	for _, expected := range []string{
		"用户补充（反馈 #FB7）：",
		"补充复现步骤",
		"[image](" + imageKey + ")",
	} {
		if !strings.Contains(content, expected) {
			t.Fatalf("supplement comment missing %q: %s", expected, content)
		}
	}
}

func TestBuildFeedbackTaskAttachmentCommentKeepsTextOnlyCustomerFollowUp(t *testing.T) {
	content := buildFeedbackTaskAttachmentComment(models.Feedback{
		ID:      7,
		ShortID: "FB7",
	}, models.FeedbackMessage{
		SenderType: models.FeedbackMessageSenderCustomer,
		Content:    "补充日志：点击保存后页面一直加载。",
	}, nil)

	for _, expected := range []string{
		"用户补充（反馈 #FB7）：",
		"补充日志：点击保存后页面一直加载。",
	} {
		if !strings.Contains(content, expected) {
			t.Fatalf("text-only follow-up comment missing %q: %s", expected, content)
		}
	}
}

func TestRequireFeedbackTriagePermission(t *testing.T) {
	dsn := strings.TrimSpace(os.Getenv(feedbackWorkflowPostgresDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run triage permission tests", feedbackWorkflowPostgresDSNEnv)
	}

	gin.SetMode(gin.TestMode)

	cases := []struct {
		name       string
		role       string
		wantStatus int
	}{
		{
			name:       "owner can triage",
			role:       models.ProjectRoleOwner,
			wantStatus: http.StatusOK,
		},
		{
			name:       "admin can triage",
			role:       models.ProjectRoleAdmin,
			wantStatus: http.StatusOK,
		},
		{
			name:       "member cannot triage",
			role:       models.ProjectRoleMember,
			wantStatus: http.StatusForbidden,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db := openTriagePermissionTestDB(t)
			defer closeTriagePermissionTestDB(t, db)

			user := models.User{Username: "triage-perm-test-" + tc.role}
			if err := db.Create(&user).Error; err != nil {
				t.Fatalf("create triage permission test user: %v", err)
			}

			project := models.Project{Name: "Triage permission test", CreatorID: user.ID}
			if err := db.Create(&project).Error; err != nil {
				t.Fatalf("create triage permission test project: %v", err)
			}

			member := models.ProjectMember{
				ProjectID: project.ID,
				UserID:    user.ID,
				Role:      tc.role,
			}
			if err := db.Create(&member).Error; err != nil {
				t.Fatalf("create triage permission test member: %v", err)
			}

			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/feedbacks/1/ignore", nil)

			context.Set("db", db)
			context.Set("userID", user.ID)

			userID, ok := requireFeedbackTriagePermission(context, db, project.ID, "忽略反馈")

			if tc.wantStatus == http.StatusOK {
				if !ok {
					t.Fatalf("expected permission granted, got denied; body=%s", recorder.Body.String())
				}
				if userID != user.ID {
					t.Fatalf("userID = %d, want %d", userID, user.ID)
				}
			} else {
				if ok {
					t.Fatalf("expected permission denied, got granted")
				}
				if recorder.Code != tc.wantStatus {
					t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tc.wantStatus, recorder.Body.String())
				}
			}
		})
	}
}

func openTriagePermissionTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv(feedbackWorkflowPostgresDSNEnv))
	config := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Silent),
	}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open PostgreSQL admin connection: %v", err)
	}
	schema := fmt.Sprintf("triage_perm_test_%d", time.Now().UnixNano())
	if err := admin.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatalf("create PostgreSQL test schema: %v", err)
	}
	t.Cleanup(func() {
		if err := admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`).Error; err != nil {
			t.Errorf("drop PostgreSQL test schema: %v", err)
		}
	})

	db, err := gorm.Open(postgres.Open(dsn+" search_path="+schema), config)
	if err != nil {
		t.Fatalf("open schema-scoped PostgreSQL connection: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
	); err != nil {
		t.Fatalf("migrate PostgreSQL triage permission fixture: %v", err)
	}
	return db
}

func closeTriagePermissionTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Errorf("get underlying SQL DB: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		t.Errorf("close triage permission test DB: %v", err)
	}
}
