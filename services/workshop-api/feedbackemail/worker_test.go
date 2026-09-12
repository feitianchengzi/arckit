package feedbackemail

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestLoadConfigDefaultsDisabled(t *testing.T) {
	t.Setenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED", "")
	t.Setenv("FEEDBACK_NOTIFICATION_EMAIL_URL", "")
	t.Setenv("FEEDBACK_NOTIFICATION_SHARED_SECRET", "")
	config, err := LoadConfigFromEnv()
	if err != nil {
		t.Fatalf("disabled config should not require notification credentials: %v", err)
	}
	if config.Enabled {
		t.Fatal("email worker must default to disabled")
	}
}

func TestLoadConfigEnabledRequiresSafeValues(t *testing.T) {
	t.Setenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED", "true")
	t.Setenv("FEEDBACK_NOTIFICATION_EMAIL_URL", "http://auth-server:4433/v1/internal/notification-emails")
	t.Setenv("FEEDBACK_NOTIFICATION_SHARED_SECRET", "0123456789abcdef0123456789abcdef")
	t.Setenv("FEEDBACK_CONSOLE_BASE_URL", "https://feedback.feitianchengzi.com/console")
	config, err := LoadConfigFromEnv()
	if err != nil {
		t.Fatalf("valid enabled config rejected: %v", err)
	}
	if !config.Enabled || config.MaxAttempts != 8 {
		t.Fatalf("unexpected config: %#v", config)
	}
}

func TestSendUsesInternalSecretAndStableTemplate(t *testing.T) {
	var captured gatewayRequest
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(internalSecretHeader); got != "0123456789abcdef0123456789abcdef" {
			t.Fatalf("unexpected internal secret header")
		}
		if err := json.NewDecoder(r.Body).Decode(&captured); err != nil {
			t.Fatalf("decode payload: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":"OK","data":{"status":"sent"}}`))
	}))
	defer server.Close()

	worker := NewWorker(nil, Config{
		Enabled:        true,
		Endpoint:       server.URL,
		SharedSecret:   "0123456789abcdef0123456789abcdef",
		ConsoleBaseURL: "https://feedback.feitianchengzi.com/console",
		RequestTimeout: time.Second,
		MaxAttempts:    8,
	})
	err := worker.send(t.Context(), deliveryData{
		Delivery: models.FeedbackEmailDelivery{
			ID:         9,
			ProjectID:  78,
			FeedbackID: 42,
			EventType:  models.FeedbackEmailEventNewFeedback,
		},
		ProjectName:     "反馈平台",
		FeedbackTitle:   "无法上传图片",
		FeedbackShort:   "ABC123",
		MessageContent:  "选择文件后没有反应",
		MessageAt:       time.Date(2026, 9, 4, 10, 0, 0, 0, time.UTC),
		RecipientUUID:   "550e8400-e29b-41d4-a716-446655440000",
		AttachmentCount: 1,
	})
	if err != nil {
		t.Fatalf("send failed: %v", err)
	}
	if captured.Template != templateFeedbackCustomerMessage || captured.RecipientUserID == "" {
		t.Fatalf("unexpected payload: %#v", captured)
	}
	if captured.Data.ConsoleURL != "https://feedback.feitianchengzi.com/console/feedbacks/email/42" {
		t.Fatalf("unexpected feedback URL: %s", captured.Data.ConsoleURL)
	}
}

func TestRetryDelayIsBounded(t *testing.T) {
	if retryDelay(1) != time.Minute {
		t.Fatalf("first retry should wait one minute")
	}
	if retryDelay(20) != time.Hour {
		t.Fatalf("retry delay must be capped at one hour")
	}
}

func TestGatewayStatusRetryClassification(t *testing.T) {
	for _, testCase := range []struct {
		status        int
		wantPermanent bool
	}{
		{status: http.StatusUnauthorized, wantPermanent: false},
		{status: http.StatusNotFound, wantPermanent: false},
		{status: http.StatusUnprocessableEntity, wantPermanent: true},
		{status: http.StatusInternalServerError, wantPermanent: false},
	} {
		t.Run(fmt.Sprintf("status_%d", testCase.status), func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(testCase.status)
			}))
			defer server.Close()
			worker := NewWorker(nil, Config{
				Enabled:        true,
				Endpoint:       server.URL,
				SharedSecret:   "0123456789abcdef0123456789abcdef",
				ConsoleBaseURL: "https://feedback.feitianchengzi.com/console",
				RequestTimeout: time.Second,
			})
			err := worker.send(t.Context(), deliveryData{
				Delivery:    models.FeedbackEmailDelivery{ID: 1, ProjectID: 1, FeedbackID: 1, EventType: models.FeedbackEmailEventNewFeedback},
				ProjectName: "P", RecipientUUID: "550e8400-e29b-41d4-a716-446655440000", MessageAt: time.Now(),
			})
			var typed *deliveryError
			if !errors.As(err, &typed) || typed.permanent != testCase.wantPermanent {
				t.Fatalf("error = %#v, want permanent=%v", err, testCase.wantPermanent)
			}
		})
	}
}

func TestLoadDeliveryDataRechecksSubscriptionAndMembership(t *testing.T) {
	db := openWorkerPostgres(t)
	user := models.User{UUID: "550e8400-e29b-41d4-a716-446655440000", Username: "subscriber"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	project := models.Project{Name: "Feedback", CreatorID: user.ID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create project: %v", err)
	}
	member := models.ProjectMember{ProjectID: project.ID, UserID: user.ID, Role: models.ProjectRoleOwner}
	if err := db.Create(&member).Error; err != nil {
		t.Fatalf("create member: %v", err)
	}
	feedback := models.Feedback{ProjectID: project.ID, ShortID: "SAFE1", Title: "Security", Content: "test"}
	if err := db.Create(&feedback).Error; err != nil {
		t.Fatalf("create feedback: %v", err)
	}
	message := models.FeedbackMessage{ProjectID: project.ID, FeedbackID: feedback.ID, SenderType: models.FeedbackMessageSenderCustomer, MessageType: models.FeedbackMessageTypeText, Content: "private content"}
	if err := db.Create(&message).Error; err != nil {
		t.Fatalf("create message: %v", err)
	}
	subscription := models.FeedbackSubscription{ProjectID: project.ID, UserID: user.ID, EmailEnabled: true, NotifyNewFeedback: true, NotifyCustomerReplies: true}
	if err := db.Create(&subscription).Error; err != nil {
		t.Fatalf("create subscription: %v", err)
	}
	delivery := models.FeedbackEmailDelivery{
		ProjectID: project.ID, FeedbackID: feedback.ID, MessageID: message.ID, RecipientUserID: user.ID,
		EventType: models.FeedbackEmailEventNewFeedback, Status: models.FeedbackEmailDeliveryPending, NextAttemptAt: time.Now(),
	}
	if err := db.Create(&delivery).Error; err != nil {
		t.Fatalf("create delivery: %v", err)
	}
	worker := NewWorker(db, Config{})
	if _, err := worker.loadDeliveryData(t.Context(), delivery); err != nil {
		t.Fatalf("active subscriber should be deliverable: %v", err)
	}
	var delivered gatewayRequest
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		if request.Header.Get(internalSecretHeader) != "0123456789abcdef0123456789abcdef" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err := json.NewDecoder(request.Body).Decode(&delivered); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer gateway.Close()
	processingWorker := NewWorker(db, Config{
		Enabled:        true,
		Endpoint:       gateway.URL,
		SharedSecret:   "0123456789abcdef0123456789abcdef",
		ConsoleBaseURL: "https://feedback.feitianchengzi.com/console",
		RequestTimeout: time.Second,
		MaxAttempts:    3,
	})
	found, err := processingWorker.processOne(t.Context())
	if err != nil || !found {
		t.Fatalf("process delivery: found=%v err=%v", found, err)
	}
	if delivered.RecipientUserID != user.UUID || delivered.Data.FeedbackTitle != feedback.Title {
		t.Fatalf("unexpected gateway delivery payload: %#v", delivered)
	}
	var sent models.FeedbackEmailDelivery
	if err := db.First(&sent, delivery.ID).Error; err != nil {
		t.Fatalf("reload sent delivery: %v", err)
	}
	if sent.Status != models.FeedbackEmailDeliverySent || sent.SentAt == nil || sent.AttemptCount != 1 {
		t.Fatalf("delivery was not marked sent: %#v", sent)
	}

	if err := db.Model(&subscription).Update("email_enabled", false).Error; err != nil {
		t.Fatalf("disable subscription: %v", err)
	}
	assertPermanentDeliveryError(t, worker, delivery, "unsubscribed user")

	if err := db.Model(&subscription).Update("email_enabled", true).Error; err != nil {
		t.Fatalf("reenable subscription: %v", err)
	}
	if err := db.Delete(&member).Error; err != nil {
		t.Fatalf("remove project member: %v", err)
	}
	assertPermanentDeliveryError(t, worker, delivery, "removed project member")
}

func TestProcessOneRetriesTransientGatewayFailure(t *testing.T) {
	db := openWorkerPostgres(t)
	user := models.User{UUID: "550e8400-e29b-41d4-a716-446655440001", Username: "retry-subscriber"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	project := models.Project{Name: "Retry feedback", CreatorID: user.ID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create project: %v", err)
	}
	if err := db.Create(&models.ProjectMember{ProjectID: project.ID, UserID: user.ID, Role: models.ProjectRoleOwner}).Error; err != nil {
		t.Fatalf("create member: %v", err)
	}
	feedback := models.Feedback{ProjectID: project.ID, ShortID: "RETRY1", Title: "Retry delivery", Content: "test"}
	if err := db.Create(&feedback).Error; err != nil {
		t.Fatalf("create feedback: %v", err)
	}
	message := models.FeedbackMessage{ProjectID: project.ID, FeedbackID: feedback.ID, SenderType: models.FeedbackMessageSenderCustomer, MessageType: models.FeedbackMessageTypeText, Content: "retry me"}
	if err := db.Create(&message).Error; err != nil {
		t.Fatalf("create message: %v", err)
	}
	if err := db.Create(&models.FeedbackSubscription{
		ProjectID: project.ID, UserID: user.ID, EmailEnabled: true,
		NotifyNewFeedback: true, NotifyCustomerReplies: true,
	}).Error; err != nil {
		t.Fatalf("create subscription: %v", err)
	}
	delivery := models.FeedbackEmailDelivery{
		ProjectID: project.ID, FeedbackID: feedback.ID, MessageID: message.ID, RecipientUserID: user.ID,
		EventType: models.FeedbackEmailEventNewFeedback, Status: models.FeedbackEmailDeliveryPending, NextAttemptAt: time.Now(),
	}
	if err := db.Create(&delivery).Error; err != nil {
		t.Fatalf("create delivery: %v", err)
	}

	calls := 0
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		if calls == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer gateway.Close()
	worker := NewWorker(db, Config{
		Enabled: true, Endpoint: gateway.URL,
		SharedSecret:   "0123456789abcdef0123456789abcdef",
		ConsoleBaseURL: "https://feedback.feitianchengzi.com/console",
		RequestTimeout: time.Second, MaxAttempts: 3,
	})

	if found, err := worker.processOne(t.Context()); !found || err == nil {
		t.Fatalf("first attempt should be retained for retry: found=%v err=%v", found, err)
	}
	var retrying models.FeedbackEmailDelivery
	if err := db.First(&retrying, delivery.ID).Error; err != nil {
		t.Fatalf("reload retrying delivery: %v", err)
	}
	if retrying.Status != models.FeedbackEmailDeliveryPending || retrying.AttemptCount != 1 || retrying.NextAttemptAt.Before(time.Now()) {
		t.Fatalf("unexpected retry state: %#v", retrying)
	}
	if err := db.Model(&retrying).Update("next_attempt_at", time.Now().Add(-time.Second)).Error; err != nil {
		t.Fatalf("make retry due: %v", err)
	}
	if found, err := worker.processOne(t.Context()); !found || err != nil {
		t.Fatalf("second attempt should succeed: found=%v err=%v", found, err)
	}
	var sent models.FeedbackEmailDelivery
	if err := db.First(&sent, delivery.ID).Error; err != nil {
		t.Fatalf("reload sent delivery: %v", err)
	}
	if sent.Status != models.FeedbackEmailDeliverySent || sent.AttemptCount != 2 || sent.SentAt == nil || calls != 2 {
		t.Fatalf("unexpected sent state: delivery=%#v calls=%d", sent, calls)
	}
}

func assertPermanentDeliveryError(t *testing.T, worker *Worker, delivery models.FeedbackEmailDelivery, label string) {
	t.Helper()
	_, err := worker.loadDeliveryData(t.Context(), delivery)
	var typed *deliveryError
	if !errors.As(err, &typed) || !typed.permanent {
		t.Fatalf("%s error = %#v, want permanent delivery rejection", label, err)
	}
}

func openWorkerPostgres(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv("WORKSHOP_TEST_POSTGRES_DSN"))
	if dsn == "" {
		t.Skip("set WORKSHOP_TEST_POSTGRES_DSN to run PostgreSQL worker tests")
	}
	config := &gorm.Config{DisableForeignKeyConstraintWhenMigrating: true, Logger: logger.Default.LogMode(logger.Silent)}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open PostgreSQL: %v", err)
	}
	schema := fmt.Sprintf("feedback_email_worker_test_%d", time.Now().UnixNano())
	if err := admin.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatalf("create schema: %v", err)
	}
	t.Cleanup(func() {
		if err := admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`).Error; err != nil {
			t.Errorf("drop schema: %v", err)
		}
	})
	db, err := gorm.Open(postgres.Open(dsn+" search_path="+schema), config)
	if err != nil {
		t.Fatalf("open schema: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{}, &models.Project{}, &models.ProjectMember{}, &models.Feedback{}, &models.FeedbackMessage{},
		&models.FeedbackMessageAttachment{}, &models.FeedbackSubscription{}, &models.FeedbackEmailDelivery{},
	); err != nil {
		t.Fatalf("migrate worker fixture: %v", err)
	}
	return db
}
