package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"todo/models"

	"github.com/gin-gonic/gin"
)

// UI 文案承诺"仓库已添加，正在同步索引"，但 Create 只写 status=ready 且从不触发
// runCodeIndexPipeline：本地路径仓库添加后永远零 chunks，检索恒未命中。
func TestCreateCustomerCodeRepoTriggersIndexPipeline(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)
	ensureKnowledgeSourceTable(t, db)

	user := createCustomerCodeRepoTestUser(t, db, "create-triggers-index-user")
	project := createCustomerCodeRepoTestProject(t, db, user.ID, "create-triggers-index-project")
	createCustomerCodeRepoTestMember(t, db, project.ID, user.ID, models.ProjectRoleAdmin)

	// 指向不存在的路径：创建后必须启动索引管道，最终 knowledge_source 不得是假 synced。
	body := CustomerCodeRepoRequest{
		CustomerID: "create-index-customer",
		RepoPath:   "/definitely/missing/arckit-repo-" + time.Now().Format("150405"),
		Branch:     "main",
	}
	bodyBytes, _ := json.Marshal(body)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost,
		fmt.Sprintf("/workshop/v2/user/projects/%d/code-repos", project.ID),
		bytes.NewReader(bodyBytes))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("db", db)
	ctx.Set("userID", user.ID)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", project.ID)}}

	CreateCustomerCodeRepoHandler(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body=%s", recorder.Code, recorder.Body.String())
	}

	var resp struct {
		Data struct {
			ID     uint   `json:"id"`
			Status string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Data.Status != "syncing" && resp.Data.Status != "ready" {
		t.Fatalf("status = %s, want syncing/ready", resp.Data.Status)
	}

	// 等待异步管道（缺失路径应快速失败并落 knowledge_source）。
	deadline := time.Now().Add(3 * time.Second)
	var src models.KnowledgeSource
	for time.Now().Before(deadline) {
		err := db.Where("project_id = ? AND name = ?", project.ID, fmt.Sprintf("code-repo-%d", resp.Data.ID)).First(&src).Error
		if err == nil && src.Status != "" && src.Status != models.KnowledgeSourceStatusIndexing {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}

	if src.ID == 0 {
		t.Fatal("创建后未触发索引管道：knowledge_source 从未创建（UI 已提示正在同步索引）")
	}
	if src.Status == models.KnowledgeSourceStatusSynced {
		t.Fatalf("路径缺失却标 synced（伪成功）: error=%v", src.LastIndexError)
	}
}
