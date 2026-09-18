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

const knowledgeTestDSNEnv = "WORKSHOP_TEST_POSTGRES_DSN"

func TestListKnowledgeSourcesEmpty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "list-src-user")
	project := createKnowledgeTestProject(t, db, user.ID, "list-src-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/workshop/v2/user/projects/1/knowledge/sources", nil)
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	ListKnowledgeSourcesHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var resp struct {
		Code string      `json:"code"`
		Data interface{} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Code != "OK" {
		t.Fatalf("code = %s, want OK", resp.Code)
	}
}

func TestCreateAndListKnowledgeSource(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "crud-src-user")
	project := createKnowledgeTestProject(t, db, user.ID, "crud-src-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := KnowledgeSourceCreateRequest{
		Name:       "customer-repo-001",
		SourceType: models.KnowledgeSourceTypeCodeRepo,
		Scope:      models.KnowledgeScopeProject,
		RepoURL:    strPtr("https://github.com/example/repo.git"),
		Branch:     strPtr("main"),
	}
	bodyBytes, _ := json.Marshal(body)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/projects/1/knowledge/sources", bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateKnowledgeSourceHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("create status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	// Now list
	recorder2 := httptest.NewRecorder()
	ctx2, _ := gin.CreateTestContext(recorder2)
	ctx2.Request = httptest.NewRequest(http.MethodGet, "/workshop/v2/user/projects/1/knowledge/sources", nil)
	ctx2.Set("db", db)
	ctx2.Set("userID", user.ID)
	ctx2.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	ListKnowledgeSourcesHandler(ctx2)

	if recorder2.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d; body=%s", recorder2.Code, http.StatusOK, recorder2.Body.String())
	}

	var listResp struct {
		Code string `json:"code"`
		Data []struct {
			ID         uint   `json:"id"`
			Name       string `json:"name"`
			SourceType string `json:"source_type"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder2.Body.Bytes(), &listResp); err != nil {
		t.Fatalf("unmarshal list response: %v", err)
	}
	if len(listResp.Data) != 1 {
		t.Fatalf("list count = %d, want 1", len(listResp.Data))
	}
	if listResp.Data[0].Name != "customer-repo-001" {
		t.Fatalf("name = %s, want customer-repo-001", listResp.Data[0].Name)
	}
}

func TestCreateKnowledgeSourceDuplicateRejects(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "dup-src-user")
	project := createKnowledgeTestProject(t, db, user.ID, "dup-src-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := KnowledgeSourceCreateRequest{
		Name:       "dup-source",
		SourceType: models.KnowledgeSourceTypeFAQ,
		Scope:      models.KnowledgeScopePublic,
	}
	bodyBytes, _ := json.Marshal(body)

	// First create
	rec1 := httptest.NewRecorder()
	ctx1, _ := gin.CreateTestContext(rec1)
	ctx1.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/projects/1/knowledge/sources", bytes.NewReader(bodyBytes))
	ctx1.Request.Header.Set("Content-Type", "application/json")
	ctx1.Set("db", db)
	ctx1.Set("userID", user.ID)
	ctx1.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}
	CreateKnowledgeSourceHandler(ctx1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("first create status = %d, want %d; body=%s", rec1.Code, http.StatusOK, rec1.Body.String())
	}

	// Duplicate should fail
	rec2 := httptest.NewRecorder()
	ctx2, _ := gin.CreateTestContext(rec2)
	ctx2.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/projects/1/knowledge/sources", bytes.NewReader(bodyBytes))
	ctx2.Request.Header.Set("Content-Type", "application/json")
	ctx2.Set("db", db)
	ctx2.Set("userID", user.ID)
	ctx2.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}
	CreateKnowledgeSourceHandler(ctx2)
	if rec2.Code != http.StatusConflict {
		t.Fatalf("duplicate create status = %d, want %d; body=%s", rec2.Code, http.StatusConflict, rec2.Body.String())
	}
}

func TestMemberCannotCreateKnowledgeSource(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "member-src-user")
	project := createKnowledgeTestProject(t, db, user.ID, "member-src-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleMember)

	body := KnowledgeSourceCreateRequest{
		Name:       "member-attempt",
		SourceType: models.KnowledgeSourceTypeCodeRepo,
		Scope:      models.KnowledgeScopeProject,
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/projects/1/knowledge/sources", bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateKnowledgeSourceHandler(ctx)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("member create status = %d, want %d; body=%s", rec.Code, http.StatusForbidden, rec.Body.String())
	}
}

func TestDeleteKnowledgeSource(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "del-src-user")
	project := createKnowledgeTestProject(t, db, user.ID, "del-src-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	src := models.KnowledgeSource{
		ProjectID:  &project.ID,
		Name:       "to-delete",
		SourceType: models.KnowledgeSourceTypeFAQ,
		Status:     models.KnowledgeSourceStatusNotSynced,
		Scope:      models.KnowledgeScopePublic,
	}
	if err := db.Create(&src).Error; err != nil {
		t.Fatalf("create source: %v", err)
	}

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/workshop/v2/user/projects/1/knowledge/sources/1", nil)
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{
		{Key: "id", Value: fmt.Sprintf("%d", project.ID)},
		{Key: "sourceId", Value: fmt.Sprintf("%d", src.ID)},
	}

	DeleteKnowledgeSourceHandler(ctx)

	if rec.Code != http.StatusOK {
		t.Fatalf("delete status = %d, want %d; body=%s", rec.Code, http.StatusOK, rec.Body.String())
	}

	// Verify deleted
	var count int64
	db.Model(&models.KnowledgeSource{}).Where("id = ?", src.ID).Count(&count)
	if count != 0 {
		t.Fatalf("source still exists after delete, count = %d", count)
	}
}

func TestKnowledgeRetrieveTestHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "retrieve-test-user")
	project := createKnowledgeTestProject(t, db, user.ID, "retrieve-test-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := `{"query": "如何登录"}`
	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/workshop/v2/user/projects/1/knowledge/retrieve-test", bytes.NewReader([]byte(body)))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	KnowledgeRetrieveTestHandler(ctx)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			NeedCollect bool `json:"need_collect"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !resp.Data.NeedCollect {
		t.Fatal("expected need_collect=true without agent configured")
	}
}

func TestGetKnowledgeWorkspaceHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupKnowledgeTestDB(t)
	defer teardownKnowledgeTestDB(t, db)

	user := createKnowledgeTestUser(t, db, "ws-user")
	project := createKnowledgeTestProject(t, db, user.ID, "ws-project")
	createKnowledgeTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	rec := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(rec)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/workshop/v2/user/projects/1/knowledge/workspace", nil)
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	GetKnowledgeWorkspaceHandler(ctx)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			Enabled bool `json:"enabled"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Data.Enabled {
		t.Fatal("expected enabled=false without workspace configured")
	}
}

// --- helpers ---

func setupKnowledgeTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv(knowledgeTestDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run knowledge handler tests", knowledgeTestDSNEnv)
	}

	config := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Silent),
	}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open admin connection: %v", err)
	}
	schema := fmt.Sprintf("knowledge_test_%d", time.Now().UnixNano())
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
		&models.Feedback{},
		&models.FeedbackMessage{},
		&models.FeedbackTaskLink{},
		&models.Task{},
		&models.KnowledgeWorkspace{},
		&models.KnowledgeSource{},
	); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}

	return db
}

func teardownKnowledgeTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Errorf("get sql db: %v", err)
		return
	}
	sqlDB.Close()
}

func createKnowledgeTestUser(t *testing.T, db *gorm.DB, name string) models.User {
	t.Helper()
	user := models.User{Username: name}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user %s: %v", name, err)
	}
	return user
}

func createKnowledgeTestProject(t *testing.T, db *gorm.DB, creatorID uint, name string) models.Project {
	t.Helper()
	project := models.Project{Name: name, CreatorID: creatorID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create project %s: %v", name, err)
	}
	return project
}

func createKnowledgeTestMember(t *testing.T, db *gorm.DB, projectID, userID uint, role string) models.ProjectMember {
	t.Helper()
	member := models.ProjectMember{ProjectID: projectID, UserID: userID, Role: role}
	if err := db.Create(&member).Error; err != nil {
		t.Fatalf("create member: %v", err)
	}
	return member
}

func strPtr(s string) *string {
	return &s
}
