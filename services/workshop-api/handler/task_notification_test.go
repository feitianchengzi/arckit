package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"todo/models"
)

func notificationUintPointer(value uint) *uint { return &value }
func notificationIntPointer(value int) *int    { return &value }

func TestTaskNotificationDefaultsPreferAssignmentEvents(t *testing.T) {
	preference := models.DefaultTaskNotificationPreference(12, 7)
	created := taskNotificationMutation{
		Created: true,
		Task:    models.Task{ID: 44, ProjectID: 12, ExecutorID: notificationUintPointer(7)},
	}
	if event := selectTaskNotificationEvent(preference, created, 7); event != "assigned_to_me" {
		t.Fatalf("expected assigned_to_me, got %q", event)
	}

	oldTask := models.Task{ID: 44, ProjectID: 12, ExecutorID: notificationUintPointer(8)}
	updatedTask := oldTask
	updatedTask.ExecutorID = notificationUintPointer(9)
	if event := selectTaskNotificationEvent(preference, taskNotificationMutation{Task: updatedTask, PreviousTask: &oldTask}, 7); event != "assignee_changed" {
		t.Fatalf("expected assignee_changed, got %q", event)
	}
}

func TestTaskNotificationDefaultsLeaveOtherChangesOff(t *testing.T) {
	preference := models.DefaultTaskNotificationPreference(12, 7)
	oldTask := models.Task{ID: 44, ProjectID: 12, State: models.TaskStatePending, Priority: notificationIntPointer(2)}
	updatedTask := oldTask
	updatedTask.State = models.TaskStateInProgress
	updatedTask.Priority = notificationIntPointer(1)
	updatedTask.Content = "changed"
	if event := selectTaskNotificationEvent(preference, taskNotificationMutation{Task: updatedTask, PreviousTask: &oldTask}, 7); event != "" {
		t.Fatalf("expected no notification for default optional switches, got %q", event)
	}

	preference.NotifyPriorityChanged = true
	if event := selectTaskNotificationEvent(preference, taskNotificationMutation{Task: updatedTask, PreviousTask: &oldTask}, 7); event != "priority_changed" {
		t.Fatalf("expected selected priority event, got %q", event)
	}
}

func TestTaskNotificationChoosesSingleHighestPriorityEvent(t *testing.T) {
	preference := models.DefaultTaskNotificationPreference(12, 7)
	preference.NotifyStatusChanged = true
	preference.NotifyContentChanged = true
	oldTask := models.Task{ID: 44, ProjectID: 12, State: models.TaskStatePending, ExecutorID: notificationUintPointer(8), Content: "before"}
	updatedTask := oldTask
	updatedTask.ExecutorID = notificationUintPointer(7)
	updatedTask.State = models.TaskStateInProgress
	updatedTask.Content = "after"
	if event := selectTaskNotificationEvent(preference, taskNotificationMutation{Task: updatedTask, PreviousTask: &oldTask}, 7); event != "assigned_to_me" {
		t.Fatalf("expected one assigned_to_me event, got %q", event)
	}
	if summary := describeTaskChanges(taskNotificationMutation{Task: updatedTask, PreviousTask: &oldTask}); summary != "更新了执行人、状态、内容" {
		t.Fatalf("unexpected summary %q", summary)
	}
}

func TestSendTaskNotificationEmailUsesInternalContract(t *testing.T) {
	var received taskNotificationEmailRequest
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get(taskNotificationSecretHeader) != "0123456789abcdef0123456789abcdef" {
			t.Error("missing internal notification secret")
		}
		if err := json.NewDecoder(request.Body).Decode(&received); err != nil {
			t.Errorf("decode request: %v", err)
		}
		writer.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(server.Close)
	t.Setenv("TASK_NOTIFICATION_EMAIL_ENDPOINT", server.URL)
	t.Setenv("NOTIFICATION_INTERNAL_SHARED_SECRET", "0123456789abcdef0123456789abcdef")

	expected := taskNotificationEmailRequest{
		RecipientUserID: "550e8400-e29b-41d4-a716-446655440000",
		Template:        taskNotificationTemplate,
		IdempotencyKey:  "task-1-user-2",
		Data: taskNotificationEmailData{
			EventType: "assigned_to_me",
			TaskURL:   "https://workshop.feitianchengzi.com/projects/3/tasks/1",
		},
	}
	if err := sendTaskNotificationEmail(context.Background(), expected); err != nil {
		t.Fatal(err)
	}
	if received.Template != taskNotificationTemplate || received.Data.EventType != "assigned_to_me" {
		t.Fatalf("unexpected gateway request: %#v", received)
	}
}

func TestTaskNotificationDeliveryAvailabilityRequiresExplicitSafeConfig(t *testing.T) {
	t.Setenv("TASK_NOTIFICATION_EMAILS_ENABLED", "true")
	t.Setenv("TASK_NOTIFICATION_EMAIL_ENDPOINT", "http://172.17.0.1:4433/v1/internal/notification-emails")
	t.Setenv("NOTIFICATION_INTERNAL_SHARED_SECRET", "0123456789abcdef0123456789abcdef")
	t.Setenv("WORKSHOP_WEB_URL", "https://workshop.feitianchengzi.com")
	if !taskNotificationDeliveryAvailable() {
		t.Fatal("expected complete production configuration to enable delivery")
	}
	if taskURL := taskNotificationURL(3, 42); taskURL != "https://workshop.feitianchengzi.com/projects/3/tasks/42" {
		t.Fatalf("unexpected task deep link %q", taskURL)
	}
	t.Setenv("WORKSHOP_WEB_URL", "http://workshop.feitianchengzi.com")
	if taskNotificationDeliveryAvailable() {
		t.Fatal("public task links must require HTTPS")
	}
}

func TestTaskNotificationDeliveryAvailabilityReusesExistingFeedbackChannel(t *testing.T) {
	t.Setenv("TASK_NOTIFICATION_EMAILS_ENABLED", "")
	t.Setenv("TASK_NOTIFICATION_EMAIL_ENDPOINT", "")
	t.Setenv("NOTIFICATION_INTERNAL_SHARED_SECRET", "")
	t.Setenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED", "true")
	t.Setenv("FEEDBACK_NOTIFICATION_EMAIL_URL", "http://172.17.0.1:4433/v1/internal/notification-emails")
	t.Setenv("FEEDBACK_NOTIFICATION_SHARED_SECRET", "0123456789abcdef0123456789abcdef")
	t.Setenv("WORKSHOP_WEB_URL", "https://workshop.feitianchengzi.com")
	if !taskNotificationDeliveryAvailable() {
		t.Fatal("expected the existing feedback delivery channel to remain a compatible fallback")
	}
}
