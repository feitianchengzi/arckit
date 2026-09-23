package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	todoDatabase "todo/database"
	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// 端到端缺陷：仓库路径不存在时 Walk 得到 0 文件，管道把 status 标成 synced，
// 前端显示"已同步"，检索却永远为空。
func TestRunCodeIndexPipelineMissingPathMarksSyncFailed(t *testing.T) {
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)
	ensureKnowledgeSourceTable(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "pipeline-missing-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "pipeline-missing-project")

	repo := CustomerCodeRepo{
		ProjectID:  project.ID,
		CustomerID: "missing-path-customer",
		RepoPath:   filepath.Join(t.TempDir(), "does-not-exist"),
		Branch:     "main",
		Status:     "ready",
	}
	if err := db.Create(&repo).Error; err != nil {
		t.Fatalf("create repo: %v", err)
	}

	runCodeIndexPipeline(db, project.ID, repo)

	var src models.KnowledgeSource
	if err := db.Where("project_id = ? AND name = ?", project.ID, "code-repo-"+strconv.FormatUint(uint64(repo.ID), 10)).First(&src).Error; err != nil {
		t.Fatalf("knowledge source: %v", err)
	}
	if src.Status != models.KnowledgeSourceStatusSyncFailed {
		t.Fatalf("status = %s, want %s（路径缺失不得伪 synced）", src.Status, models.KnowledgeSourceStatusSyncFailed)
	}
	if src.LastIndexError == nil || strings.TrimSpace(*src.LastIndexError) == "" {
		t.Fatal("last_index_error 必须给出原因，否则用户无法排障")
	}
	if src.LastIndexedAt == nil {
		t.Fatal("last_indexed_at 应记录失败时间")
	}
}

// 空目录（0 个可索引文件）同样不得标 synced。
func TestRunCodeIndexPipelineEmptyDirMarksSyncFailed(t *testing.T) {
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)
	ensureKnowledgeSourceTable(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "pipeline-empty-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "pipeline-empty-project")

	emptyDir := t.TempDir()
	repo := CustomerCodeRepo{
		ProjectID:  project.ID,
		CustomerID: "empty-dir-customer",
		RepoPath:   emptyDir,
		Branch:     "main",
		Status:     "ready",
	}
	if err := db.Create(&repo).Error; err != nil {
		t.Fatalf("create repo: %v", err)
	}

	runCodeIndexPipeline(db, project.ID, repo)

	var src models.KnowledgeSource
	if err := db.Where("project_id = ? AND name = ?", project.ID, "code-repo-"+strconv.FormatUint(uint64(repo.ID), 10)).First(&src).Error; err != nil {
		t.Fatalf("knowledge source: %v", err)
	}
	if src.Status != models.KnowledgeSourceStatusSyncFailed {
		t.Fatalf("status = %s, want %s（0 文件不得伪 synced）", src.Status, models.KnowledgeSourceStatusSyncFailed)
	}
	if src.LastIndexError == nil || strings.TrimSpace(*src.LastIndexError) == "" {
		t.Fatal("last_index_error 必须说明未扫到可索引文件")
	}
}

// 检索层：code_chunks 表缺失时 SQL 失败被吞成空结果 → 200 + 空数组 → 前端"未命中"。
// 规格：底层错误必须上抛，Handler 不得把 DB 故障包装成"真未命中"。
// 通过 Handler 用例覆盖（共享 DSN 上 code_chunks 可能存在）。
func TestSearchCodeChunksByVectorDoesNotSwallowDBError(t *testing.T) {
	// 占位：错误上抛契约由 TestSearchHandlerSurfacesDBErrorNotEmptyHit 断言。
	// 修复后 searchCodeChunksByVector 将返回 error；此处先保证用例文件编译。
	t.Run("handler-surfaces-error", func(t *testing.T) {
		// 见同文件 TestSearchHandlerSurfacesDBErrorNotEmptyHit
	})
}

// Handler 契约：code_chunks 表缺失（DB 故障）→ 5xx，不得 200 + 空 results。
// 用共享 DSN 上临时摘表模拟根因场景，cleanup 必须恢复。
func TestSearchHandlerSurfacesDBErrorNotEmptyHit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dsn := strings.TrimSpace(os.Getenv(customerCodeRepoTestDSNEnv))
	if dsn == "" {
		t.Skipf("set %s", customerCodeRepoTestDSNEnv)
	}
	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	// 与 database 包 Migrate 测试并行共享物理表：必须持同一把 DDL 锁。
	ddlLock := func(fn func() error) error {
		return todoDatabase.WithKnowledgeDDLLock(admin, fn)
	}
	// 摘表模拟"迁移从未应用"的线上状态；cleanup 必须恢复，禁止 DROP 后不建回。
	renamed := false
	if err := ddlLock(func() error {
		if err := admin.Exec(`CREATE SCHEMA IF NOT EXISTS code_index`).Error; err != nil {
			return err
		}
		var exists *string
		if err := admin.Raw(`SELECT to_regclass('code_index.code_chunks')`).Scan(&exists).Error; err != nil {
			return err
		}
		if exists != nil && *exists != "" {
			if err := admin.Exec(`ALTER TABLE code_index.code_chunks RENAME TO code_chunks_search_error_probe`).Error; err != nil {
				return err
			}
			renamed = true
		}
		return nil
	}); err != nil {
		t.Fatalf("locked rename: %v", err)
	}
	t.Cleanup(func() {
		_ = todoDatabase.WithKnowledgeDDLLock(admin, func() error {
			if renamed {
				return admin.Exec(`ALTER TABLE IF EXISTS code_index.code_chunks_search_error_probe RENAME TO code_chunks`).Error
			}
			return nil
		})
	})

	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)
	if err := db.AutoMigrate(&models.KnowledgeSource{}); err != nil {
		t.Fatalf("migrate knowledge_source: %v", err)
	}

	user := createCustomerCodeRepoTestUser(t, db, "search-err-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "search-err-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	body := `{"query":"LoginUser"}`
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost,
		"/workshop/v2/user/projects/"+strconv.FormatUint(uint64(project.ID), 10)+"/knowledge/search-code",
		strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: strconv.FormatUint(uint64(project.ID), 10)}}

	SearchCodeChunksHandler(ctx)

	if recorder.Code == http.StatusOK {
		t.Fatalf("code_chunks 表缺失被吞成空命中（200）: %s", recorder.Body.String())
	}
	if recorder.Code < 500 {
		t.Fatalf("期望 5xx 暴露故障，实际 status=%d body=%s", recorder.Code, recorder.Body.String())
	}
}

func ensureKnowledgeSourceTable(t *testing.T, db *gorm.DB) {
	t.Helper()
	if err := db.AutoMigrate(&models.KnowledgeSource{}); err != nil {
		t.Fatalf("migrate knowledge_source: %v", err)
	}
	_ = db.Exec(`CREATE SCHEMA IF NOT EXISTS code_index`).Error
	_ = db.AutoMigrate(&models.CodeChunk{})
}
