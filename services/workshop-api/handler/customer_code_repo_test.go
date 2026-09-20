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

const customerCodeRepoTestDSNEnv = "WORKSHOP_TEST_POSTGRES_DSN"

func setupCustomerCodeRepoTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := strings.TrimSpace(os.Getenv(customerCodeRepoTestDSNEnv))
	if dsn == "" {
		t.Skipf("set %s to run customer code repo handler tests", customerCodeRepoTestDSNEnv)
	}

	config := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Silent),
	}
	admin, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		t.Fatalf("open admin connection: %v", err)
	}
	schema := fmt.Sprintf("customer_code_repo_test_%d", time.Now().UnixNano())
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
		&CustomerCodeRepo{},
	); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}

	return db
}

func teardownCustomerCodeRepoTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Errorf("get sql db: %v", err)
		return
	}
	sqlDB.Close()
}

func createCustomerCodeRepoTestUser(t *testing.T, db *gorm.DB, name string) models.User {
	t.Helper()
	user := models.User{Username: name}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user %s: %v", name, err)
	}
	return user
}

func createCustomerCodeRepoTestProject(t *testing.T, db *gorm.DB, creatorID uint, name string) models.Project {
	t.Helper()
	project := models.Project{Name: name, CreatorID: creatorID}
	if err := db.Create(&project).Error; err != nil {
		t.Fatalf("create project %s: %v", name, err)
	}
	return project
}

func createCustomerCodeRepoTestMember(t *testing.T, db *gorm.DB, projectID, userID uint, role string) models.ProjectMember {
	t.Helper()
	member := models.ProjectMember{ProjectID: projectID, UserID: userID, Role: role}
	if err := db.Create(&member).Error; err != nil {
		t.Fatalf("create member: %v", err)
	}
	return member
}

// TestCreateCustomerCodeRepoWithRepoURL 测试使用repo_url创建代码仓库
func TestCreateCustomerCodeRepoWithRepoURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "create-repo-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "create-repo-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := CustomerCodeRepoRequest{
		CustomerID: "customer-001",
		RepoURL:    "https://github.com/example/repo.git",
		Branch:     "main",
		AutoSync:   true,
	}
	bodyBytes, _ := json.Marshal(body)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			ID       uint   `json:"id"`
			RepoURL  string `json:"repo_url"`
			AutoSync bool   `json:"auto_sync"`
			Status   string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Code != "OK" {
		t.Fatalf("code = %s, want OK", resp.Code)
	}
	if resp.Data.RepoURL != "https://github.com/example/repo.git" {
		t.Fatalf("repo_url = %s, want https://github.com/example/repo.git", resp.Data.RepoURL)
	}
	if !resp.Data.AutoSync {
		t.Fatal("auto_sync = false, want true")
	}
	if resp.Data.Status != "ready" {
		t.Fatalf("status = %s, want ready", resp.Data.Status)
	}
}

// TestCreateCustomerCodeRepoWithRepoPath 测试兼容旧的repo_path字段
func TestCreateCustomerCodeRepoWithRepoPath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "create-repo-user-path")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "create-repo-project-path")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := CustomerCodeRepoRequest{
		CustomerID: "customer-002",
		RepoPath:   "/projects/customer-002/repo",
		Branch:     "main",
	}
	bodyBytes, _ := json.Marshal(body)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			ID       uint   `json:"id"`
			RepoURL  string `json:"repo_url"`
			RepoPath string `json:"repo_path"`
			Status   string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Code != "OK" {
		t.Fatalf("code = %s, want OK", resp.Code)
	}
	// 兼容旧字段：repo_path应该被存储
	if resp.Data.RepoPath != "/projects/customer-002/repo" {
		t.Fatalf("repo_path = %s, want /projects/customer-002/repo", resp.Data.RepoPath)
	}
}

// TestCreateCustomerCodeRepoValidation 测试创建代码仓库的参数验证
func TestCreateCustomerCodeRepoValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "validation-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "validation-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	tests := []struct {
		name       string
		body       CustomerCodeRepoRequest
		wantStatus int
	}{
		{
			name:       "缺少customer_id",
			body:       CustomerCodeRepoRequest{RepoURL: "https://github.com/example/repo.git"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "缺少repo_url和repo_path",
			body:       CustomerCodeRepoRequest{CustomerID: "customer-003"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "无效的repo_url",
			body:       CustomerCodeRepoRequest{CustomerID: "customer-004", RepoURL: "not-a-url"},
			wantStatus: http.StatusOK, // 后端不验证URL格式
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tt.body)

			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
			ctx.Request.Header.Set("Content-Type", "application/json")
			ctx.Set("db", db)
			ctx.Set("userID", user.ID)
			ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

			CreateCustomerCodeRepoHandler(ctx)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tt.wantStatus, recorder.Body.String())
			}
		})
	}
}

// TestCreateCustomerCodeRepoDuplicate 测试创建重复的代码仓库
func TestCreateCustomerCodeRepoDuplicate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "duplicate-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "duplicate-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := CustomerCodeRepoRequest{
		CustomerID: "customer-005",
		RepoURL:    "https://github.com/example/repo.git",
		Branch:     "main",
	}
	bodyBytes, _ := json.Marshal(body)

	// 第一次创建
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("first create status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	// 第二次创建（重复）
	recorder2 := httptest.NewRecorder()
	ctx2, _ := gin.CreateTestContext(recorder2)
	ctx2.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	ctx2.Request.Header.Set("Content-Type", "application/json")
	ctx2.Set("db", db)
	ctx2.Set("userID", user.ID)
	ctx2.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(ctx2)

	if recorder2.Code != http.StatusConflict {
		t.Fatalf("duplicate create status = %d, want %d; body=%s", recorder2.Code, http.StatusConflict, recorder2.Body.String())
	}
}

// TestGetCustomerCodeReposWithRepoURL 测试查询代码仓库列表包含repo_url字段
func TestGetCustomerCodeReposWithRepoURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "list-repo-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "list-repo-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	// 创建代码仓库
	body := CustomerCodeRepoRequest{
		CustomerID: "customer-006",
		RepoURL:    "https://github.com/example/repo.git",
		Branch:     "main",
		AutoSync:   true,
	}
	bodyBytes, _ := json.Marshal(body)

	createRecorder := httptest.NewRecorder()
	createCtx, _ := gin.CreateTestContext(createRecorder)
	createCtx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	createCtx.Request.Header.Set("Content-Type", "application/json")
	createCtx.Set("db", db)
	createCtx.Set("userID", user.ID)
	createCtx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(createCtx)

	// 查询列表
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), nil)
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	GetCustomerCodeReposHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data []struct {
			ID         uint   `json:"id"`
			CustomerID string `json:"customer_id"`
			RepoURL    string `json:"repo_url"`
			AutoSync   bool   `json:"auto_sync"`
			Branch     string `json:"branch"`
			Status     string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Code != "OK" {
		t.Fatalf("code = %s, want OK", resp.Code)
	}
	if len(resp.Data) != 1 {
		t.Fatalf("len(data) = %d, want 1", len(resp.Data))
	}
	if resp.Data[0].RepoURL != "https://github.com/example/repo.git" {
		t.Fatalf("repo_url = %s, want https://github.com/example/repo.git", resp.Data[0].RepoURL)
	}
	if !resp.Data[0].AutoSync {
		t.Fatal("auto_sync = false, want true")
	}
}

// TestDeleteCustomerCodeRepo 测试删除代码仓库
func TestDeleteCustomerCodeRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "delete-repo-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "delete-repo-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	// 创建代码仓库
	body := CustomerCodeRepoRequest{
		CustomerID: "customer-007",
		RepoURL:    "https://github.com/example/repo.git",
		Branch:     "main",
	}
	bodyBytes, _ := json.Marshal(body)

	createRecorder := httptest.NewRecorder()
	createCtx, _ := gin.CreateTestContext(createRecorder)
	createCtx.Request = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID), bytes.NewReader(bodyBytes))
	createCtx.Request.Header.Set("Content-Type", "application/json")
	createCtx.Set("db", db)
	createCtx.Set("userID", user.ID)
	createCtx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(createCtx)

	// 获取创建的ID
	var createResp struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	json.Unmarshal(createRecorder.Body.Bytes(), &createResp)

	// 删除代码仓库
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos/%d", project.ID, createResp.Data.ID), nil)
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{
		{Key: "id", Value: fmt.Sprintf("%d", project.ID)},
		{Key: "repoId", Value: fmt.Sprintf("%d", createResp.Data.ID)},
	}

	DeleteCustomerCodeRepoHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var resp struct {
		Code string `json:"code"`
		Data struct {
			Status string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Code != "OK" {
		t.Fatalf("code = %s, want OK", resp.Code)
	}
	if resp.Data.Status != "deleted" {
		t.Fatalf("status = %s, want deleted", resp.Data.Status)
	}
}