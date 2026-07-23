package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"todo/models"

	"github.com/gin-gonic/gin"
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
