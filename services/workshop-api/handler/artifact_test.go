package handler

import (
	"bytes"
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

const artifactTestDSNEnv = "WORKSHOP_TEST_POSTGRES_DSN"

func TestArtifactDeliveryHandlerAcceptedTaskWritesURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupArtifactTestDB(t)
	defer teardownArtifactTestDB(t, db)

	user := createArtifactTestUser(t, db, "artifact-user")
	project := createArtifactTestProject(t, db, user.ID, "artifact-project")
	createArtifactTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	task := models.Task{
		ProjectID:  project.ID,
		CreatorID:  user.ID,
		Content:    "实现登录功能",
		State:      models.TaskStateAccepted,
		ExecutorID: &user.ID,
	}
	if err := db.Create(&task).Error; err != nil {
		t.Fatalf("create task: %v", err)
	}

	body := ArtifactDeliveryRequest{
		ArtifactURL: "https://builds.example.com/v1.0.0/login.tar.gz",
		BuildID:     "build-001",
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/tasks/1/artifact", bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", task.ID)}}

	ArtifactDeliveryHandler(ctx)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			TaskID       uint   `json:"task_id"`
			ArtifactURL  string `json:"artifact_url"`
			BuildID      string `json:"build_id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Data.ArtifactURL != "https://builds.example.com/v1.0.0/login.tar.gz" {
		t.Fatalf("artifact_url = %s, want expected URL", resp.Data.ArtifactURL)
	}

	// Verify task was updated
	var updatedTask models.Task
	db.First(&updatedTask, task.ID)
	if updatedTask.ArtifactURL == nil || *updatedTask.ArtifactURL != "https://builds.example.com/v1.0.0/login.tar.gz" {
		t.Fatal("task artifact_url not updated in DB")
	}
}

func TestArtifactDeliveryHandlerNonAcceptedTaskRejects(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupArtifactTestDB(t)
	defer teardownArtifactTestDB(t, db)

	user := createArtifactTestUser(t, db, "artifact-reject-user")
	project := createArtifactTestProject(t, db, user.ID, "artifact-reject-project")
	createArtifactTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	task := models.Task{
		ProjectID:  project.ID,
		CreatorID:  user.ID,
		Content:    "进行中的任务",
		State:      models.TaskStateInProgress,
		ExecutorID: &user.ID,
	}
	if err := db.Create(&task).Error; err != nil {
		t.Fatalf("create task: %v", err)
	}

	body := ArtifactDeliveryRequest{
		ArtifactURL: "https://builds.example.com/artifact.tar.gz",
		BuildID:     "build-002",
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/tasks/1/artifact", bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", task.ID)}}

	ArtifactDeliveryHandler(ctx)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", rec.Code, http.StatusBadRequest, rec.Body.String())
	}
}

func TestArtifactDeliveryHandlerMemberCannotDeliver(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupArtifactTestDB(t)
	defer teardownArtifactTestDB(t, db)

	user := createArtifactTestUser(t, db, "artifact-member-user")
	project := createArtifactTestProject(t, db, user.ID, "artifact-member-project")
	createArtifactTestMember(t, db, project.ID, user.ID, models.ProjectRoleMember)

	task := models.Task{
		ProjectID:  project.ID,
		CreatorID:  user.ID,
		Content:    "member task",
		State:      models.TaskStateAccepted,
	}
	if err := db.Create(&task).Error; err != nil {
		t.Fatalf("create task: %v", err)
	}

	body := ArtifactDeliveryRequest{
		ArtifactURL: "https://builds.example.com/x.tar.gz",
		BuildID:     "build-003",
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/tasks/1/artifact", bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", task.ID)}}

	ArtifactDeliveryHandler(ctx)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d; body=%s", rec.Code, http.StatusForbidden, rec.Body.String())
	}
}

func TestTaskHasArtifactURLField(t *testing.T) {
	task := models.Task{}
	if task.ArtifactURL != nil {
		t.Fatal("new task should have nil artifact_url")
	}
	url := "https://example.com/build.tar.gz"
	task.ArtifactURL = &url
	if task.ArtifactURL == nil || *task.ArtifactURL != url {
		t.Fatal("artifact_url setter failed")
	}
}

func TestTaskHasSourceFeedbackIDField(t *testing.T) {
	task := models.Task{}
	if task.SourceFeedbackID != nil {
		t.Fatal("new task should have nil source_feedback_id")
	}
	fbID := uint(42)
	task.SourceFeedbackID = &fbID
	if task.SourceFeedbackID == nil || *task.SourceFeedbackID != 42 {
		t.Fatal("source_feedback_id setter failed")
	}
}

// --- helpers ---

func setupArtifactTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv(artifactTestDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run artifact delivery tests", artifactTestDSNEnv)
	}

	config := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Silent),
	}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open admin connection: %v", err)
	}
	schema := fmt.Sprintf("artifact_test_%d", time.Now().UnixNano())
	if err := admin.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatalf("create schema: %v", err)
	}
	t.Cleanup(func() {
		admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`)
		sqlDB, _ := admin.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	})

	db, err := gorm.Open(postgres.Open(dsn+" search_path="+schema), config)
	if err != nil {
		t.Fatalf("open schema connection: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
		&models.Task{},
		&models.Feedback{},
		&models.FeedbackMessage{},
		&models.FeedbackTaskLink{},
	); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}

	return db
}

func teardownArtifactTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Errorf("get sql db: %v", err)
		return
	}
	sqlDB.Close()
}

func createArtifactTestUser(t *testing.T, db *gorm.DB, name string) models.User {
	t.Helper()
	user := models.User{Username: name}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user %s: %v", name, err)
	}
	return user
}

func createArtifactTestProject(t *testing.T, db *gorm.DB, creatorID uint, name string) models.Project {
	t.Helper()
	project := models.Project{Name: name, CreatorID: creatorID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create project %s: %v", name, err)
	}
	return project
}

func createArtifactTestMember(t *testing.T, db *gorm.DB, projectID, userID uint, role string) models.ProjectMember {
	t.Helper()
	member := models.ProjectMember{ProjectID: projectID, UserID: userID, Role: role}
	if err := db.Create(&member).Error; err != nil {
		t.Fatalf("create member: %v", err)
	}
	return member
}
