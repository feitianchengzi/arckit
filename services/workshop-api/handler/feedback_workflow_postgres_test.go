package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
)

const feedbackWorkflowPostgresDSNEnv = "WORKSHOP_TEST_POSTGRES_DSN"

// Run these integration tests with a disposable PostgreSQL database, for example:
// WORKSHOP_TEST_POSTGRES_DSN="host=/tmp/postgres port=5432 user=postgres dbname=postgres sslmode=disable" go test ./handler -run TestFeedbackWorkflowPostgresTransactions

type feedbackWorkflowTestFixture struct {
	db      *gorm.DB
	user    models.User
	project models.Project
}

func openFeedbackWorkflowPostgres(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv(feedbackWorkflowPostgresDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run PostgreSQL transaction tests", feedbackWorkflowPostgresDSNEnv)
	}

	config := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Silent),
	}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open PostgreSQL admin connection: %v", err)
	}
	schema := fmt.Sprintf("feedback_workflow_test_%d", time.Now().UnixNano())
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
	var currentSchema string
	if err := db.Raw("SELECT current_schema()").Scan(&currentSchema).Error; err != nil {
		t.Fatalf("read PostgreSQL test schema: %v", err)
	}
	if currentSchema != schema {
		t.Fatalf("current PostgreSQL schema = %q, want %q", currentSchema, schema)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
		&models.Task{},
		&models.TaskAttachment{},
		&models.Feedback{},
		&models.FeedbackMessage{},
		&models.FeedbackMessageAttachment{},
		&models.FeedbackNotification{},
		&models.FeedbackTaskLink{},
	); err != nil {
		t.Fatalf("migrate PostgreSQL feedback workflow fixture: %v", err)
	}
	return db
}

func seedFeedbackWorkflowFixture(t *testing.T, db *gorm.DB) feedbackWorkflowTestFixture {
	t.Helper()
	user := models.User{Username: "feedback-workflow-test-user"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create workflow test user: %v", err)
	}
	project := models.Project{Name: "Feedback workflow transaction test", CreatorID: user.ID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create workflow test project: %v", err)
	}
	member := models.ProjectMember{
		ProjectID: project.ID,
		UserID:    user.ID,
		Role:      models.ProjectRoleOwner,
	}
	if err := db.Create(&member).Error; err != nil {
		t.Fatalf("create workflow test project member: %v", err)
	}
	return feedbackWorkflowTestFixture{db: db, user: user, project: project}
}

func (fixture feedbackWorkflowTestFixture) createFeedback(t *testing.T, triageStatus string) models.Feedback {
	t.Helper()
	data := fmt.Sprintf(`{"feedback_state":%q,"status":%q,"keep":"value"}`, triageStatus, triageStatus)
	feedback := models.Feedback{
		ProjectID:    fixture.project.ID,
		ShortID:      fmt.Sprintf("PG-%d", time.Now().UnixNano()),
		Title:        "Feedback workflow transaction",
		Content:      "Exercise real PostgreSQL workflow behavior",
		Status:       triageStatus,
		TriageStatus: triageStatus,
		Data:         &data,
	}
	if err := fixture.db.Create(&feedback).Error; err != nil {
		t.Fatalf("create workflow test feedback: %v", err)
	}
	return feedback
}

func performFeedbackWorkflowRequest(db *gorm.DB, userID uint, method string, path string, feedbackID uint, body string, handler gin.HandlerFunc) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(method, path, strings.NewReader(body))
	context.Request.Header.Set("Content-Type", "application/json")
	context.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", feedbackID)}}
	context.Set("db", db)
	context.Set("userID", userID)
	handler(context)
	return recorder
}

func waitForFeedbackRowLockWaiters(t *testing.T, db *gorm.DB, minimum int) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		var waiting int64
		if err := db.Raw(`
			SELECT COUNT(*)
			FROM pg_stat_activity
			WHERE datname = current_database()
				AND pid <> pg_backend_pid()
				AND wait_event_type = 'Lock'
				AND query ILIKE '%feedbacks%FOR UPDATE%'
		`).Scan(&waiting).Error; err != nil {
			t.Fatalf("inspect PostgreSQL lock waiters: %v", err)
		}
		if waiting >= int64(minimum) {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("did not observe %d PostgreSQL feedback row-lock waiters", minimum)
}

func runBlockedFeedbackRequests(t *testing.T, db *gorm.DB, feedbackID uint, requests ...func() int) []int {
	t.Helper()
	blocker := db.Begin()
	if blocker.Error != nil {
		t.Fatalf("begin feedback row-lock blocker: %v", blocker.Error)
	}
	released := false
	defer func() {
		if !released {
			_ = blocker.Rollback().Error
		}
	}()
	var locked models.Feedback
	if err := blocker.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, feedbackID).Error; err != nil {
		_ = blocker.Rollback().Error
		t.Fatalf("lock feedback row before concurrent requests: %v", err)
	}

	statuses := make([]int, len(requests))
	var group sync.WaitGroup
	group.Add(len(requests))
	for index, request := range requests {
		go func() {
			defer group.Done()
			statuses[index] = request()
		}()
	}
	waitForFeedbackRowLockWaiters(t, db, len(requests))
	if err := blocker.Commit().Error; err != nil {
		t.Fatalf("release feedback row-lock blocker: %v", err)
	}
	released = true
	group.Wait()
	sort.Ints(statuses)
	return statuses
}

func TestFeedbackWorkflowPostgresTransactions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("FEEDBACK_V2_NOTIFICATION_PROJECT_IDS", "")
	db := openFeedbackWorkflowPostgres(t)
	fixture := seedFeedbackWorkflowFixture(t, db)

	t.Run("restore preserves identity metadata and history", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriageIgnored)
		initialMessage := models.FeedbackMessage{
			FeedbackID:  feedback.ID,
			ProjectID:   feedback.ProjectID,
			SenderType:  models.FeedbackMessageSenderCustomer,
			MessageType: models.FeedbackMessageTypeText,
			Content:     "original history",
		}
		if err := db.Create(&initialMessage).Error; err != nil {
			t.Fatalf("create original feedback history: %v", err)
		}

		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/restore", feedback.ID), feedback.ID, "", RestoreFeedback)
		if response.Code != http.StatusOK {
			t.Fatalf("restore status = %d, want 200; body=%s", response.Code, response.Body.String())
		}

		var restored models.Feedback
		if err := db.First(&restored, feedback.ID).Error; err != nil {
			t.Fatalf("reload restored feedback: %v", err)
		}
		if restored.ID != feedback.ID || restored.TriageStatus != models.FeedbackTriagePending || restored.Status != models.FeedbackStatusPending {
			t.Fatalf("restored feedback = %#v", restored)
		}
		var metadata map[string]interface{}
		if restored.Data == nil || json.Unmarshal([]byte(*restored.Data), &metadata) != nil {
			t.Fatalf("restored metadata is invalid: %#v", restored.Data)
		}
		if metadata["feedback_state"] != models.FeedbackStatusPending || metadata["status"] != "analyzing" || metadata["keep"] != "value" {
			t.Fatalf("restored metadata = %#v", metadata)
		}
		var messages []models.FeedbackMessage
		if err := db.Where("feedback_id = ?", feedback.ID).Order("id ASC").Find(&messages).Error; err != nil {
			t.Fatalf("load restored feedback history: %v", err)
		}
		if len(messages) != 2 || messages[0].ID != initialMessage.ID || messages[1].Content != "反馈已恢复为待处理" {
			t.Fatalf("restored feedback messages = %#v", messages)
		}
	})

	t.Run("restore rejects non ignored feedback", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/restore", feedback.ID), feedback.ID, "", RestoreFeedback)
		if response.Code != http.StatusConflict {
			t.Fatalf("restore non-ignored status = %d, want 409; body=%s", response.Code, response.Body.String())
		}
	})

	t.Run("restore rejects feedback linked to a primary task", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriageIgnored)
		task := models.Task{ProjectID: fixture.project.ID, Content: "linked task", State: models.TaskStatePendingReview, CreatorID: fixture.user.ID}
		if err := db.Create(&task).Error; err != nil {
			t.Fatalf("create linked task: %v", err)
		}
		link := models.FeedbackTaskLink{FeedbackID: feedback.ID, ProjectID: fixture.project.ID, TaskID: task.ID, RelationType: models.FeedbackTaskRelationConvertedTo, IsPrimary: true}
		if err := db.Create(&link).Error; err != nil {
			t.Fatalf("create primary feedback task link: %v", err)
		}
		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/restore", feedback.ID), feedback.ID, "", RestoreFeedback)
		if response.Code != http.StatusConflict {
			t.Fatalf("restore linked feedback status = %d, want 409; body=%s", response.Code, response.Body.String())
		}
	})

	t.Run("restore returns not found for a missing feedback", func(t *testing.T) {
		response := performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, "/workshop/v2/user/feedbacks/4294967295/restore", 4294967295, "", RestoreFeedback)
		if response.Code != http.StatusNotFound {
			t.Fatalf("restore missing feedback status = %d, want 404; body=%s", response.Code, response.Body.String())
		}
	})

	t.Run("concurrent restores serialize on the feedback row", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriageIgnored)
		request := func() int {
			return performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/restore", feedback.ID), feedback.ID, "", RestoreFeedback).Code
		}
		statuses := runBlockedFeedbackRequests(t, db, feedback.ID, request, request)
		if fmt.Sprint(statuses) != fmt.Sprint([]int{http.StatusOK, http.StatusConflict}) {
			t.Fatalf("concurrent restore statuses = %v, want [200 409]", statuses)
		}
		var messageCount int64
		if err := db.Model(&models.FeedbackMessage{}).Where("feedback_id = ? AND content = ?", feedback.ID, "反馈已恢复为待处理").Count(&messageCount).Error; err != nil {
			t.Fatalf("count concurrent restore messages: %v", err)
		}
		if messageCount != 1 {
			t.Fatalf("concurrent restore message count = %d, want 1", messageCount)
		}
		var restored models.Feedback
		if err := db.First(&restored, feedback.ID).Error; err != nil {
			t.Fatalf("reload concurrently restored feedback: %v", err)
		}
		if restored.TriageStatus != models.FeedbackTriagePending || restored.Status != models.FeedbackStatusPending {
			t.Fatalf("concurrently restored feedback = %#v", restored)
		}
	})

	t.Run("ignore and convert cannot both commit", func(t *testing.T) {
		feedback := fixture.createFeedback(t, models.FeedbackTriagePending)
		ignore := func() int {
			return performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/ignore", feedback.ID), feedback.ID, "", IgnoreFeedback).Code
		}
		convert := func() int {
			return performFeedbackWorkflowRequest(db, fixture.user.ID, http.MethodPost, fmt.Sprintf("/workshop/v2/user/feedbacks/%d/convert-to-task", feedback.ID), feedback.ID, `{}`, ConvertFeedbackToTask).Code
		}
		statuses := runBlockedFeedbackRequests(t, db, feedback.ID, ignore, convert)
		if fmt.Sprint(statuses) != fmt.Sprint([]int{http.StatusOK, http.StatusConflict}) && fmt.Sprint(statuses) != fmt.Sprint([]int{http.StatusCreated, http.StatusConflict}) {
			t.Fatalf("concurrent ignore/convert statuses = %v, want [200 409] or [201 409]", statuses)
		}
		var linkCount int64
		if err := db.Model(&models.FeedbackTaskLink{}).Where("feedback_id = ? AND is_primary = ?", feedback.ID, true).Count(&linkCount).Error; err != nil {
			t.Fatalf("count primary feedback task links: %v", err)
		}
		if linkCount > 1 {
			t.Fatalf("primary feedback task link count = %d, want at most 1", linkCount)
		}
		var taskCount int64
		linkedTaskIDs := db.Model(&models.FeedbackTaskLink{}).Select("task_id").Where("feedback_id = ? AND is_primary = ?", feedback.ID, true)
		if err := db.Model(&models.Task{}).Where("id IN (?)", linkedTaskIDs).Count(&taskCount).Error; err != nil {
			t.Fatalf("count converted feedback tasks: %v", err)
		}
		if taskCount != linkCount {
			t.Fatalf("converted task count = %d, primary link count = %d", taskCount, linkCount)
		}
		var messageCount int64
		if err := db.Model(&models.FeedbackMessage{}).Where("feedback_id = ?", feedback.ID).Count(&messageCount).Error; err != nil {
			t.Fatalf("count ignore/convert status messages: %v", err)
		}
		if messageCount != 1 {
			t.Fatalf("ignore/convert message count = %d, want 1", messageCount)
		}
		var finalFeedback models.Feedback
		if err := db.First(&finalFeedback, feedback.ID).Error; err != nil {
			t.Fatalf("reload ignore/convert feedback: %v", err)
		}
		if linkCount == 0 && finalFeedback.TriageStatus != models.FeedbackTriageIgnored {
			t.Fatalf("feedback without task link ended in triage status %q, want ignored", finalFeedback.TriageStatus)
		}
		if linkCount == 1 && finalFeedback.TriageStatus != models.FeedbackTriageAccepted {
			t.Fatalf("feedback with task link ended in triage status %q, want accepted", finalFeedback.TriageStatus)
		}
	})
}
