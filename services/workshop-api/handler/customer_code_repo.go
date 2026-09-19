package handler

import (
	"fmt"
	"net/http"
	"os/exec"
	"time"
	"todo/middleware"
	"todo/response"

	"github.com/gin-gonic/gin"
)

// CustomerCodeRepoRequest 客户代码仓库请求
type CustomerCodeRepoRequest struct {
	CustomerID string `json:"customer_id" binding:"required"`
	RepoPath   string `json:"repo_path"`
	RepoURL    string `json:"repo_url"`
	Branch     string `json:"branch,omitempty"`
	AutoSync   bool   `json:"auto_sync,omitempty"`
}

// CustomerCodeRepoResponse 客户代码仓库响应
type CustomerCodeRepoResponse struct {
	ID           uint   `json:"id"`
	ProjectID    uint   `json:"project_id"`
	CustomerID   string `json:"customer_id"`
	RepoPath     string `json:"repo_path,omitempty"`
	RepoURL      string `json:"repo_url,omitempty"`
	Branch       string `json:"branch"`
	AutoSync     bool   `json:"auto_sync"`
	Status       string `json:"status"`
	LastSyncedAt string `json:"last_synced_at,omitempty"`
}

// CreateCustomerCodeRepoHandler 创建客户代码仓库
// POST /api/v1/projects/{projectId}/code-repos
func CreateCustomerCodeRepoHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "管理代码仓库")
	if !ok {
		return
	}
	_ = userID

	var req CustomerCodeRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 验证：必须提供repo_url或repo_path
	if req.RepoURL == "" && req.RepoPath == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "必须提供repo_url或repo_path", nil))
		return
	}

	// 检查是否已存在
	var existing CustomerCodeRepo
	if err := db.Where("project_id = ? AND customer_id = ?", projectID, req.CustomerID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "该客户的代码仓库已存在", nil))
		return
	}

	// 设置默认分支
	branch := req.Branch
	if branch == "" {
		branch = "main"
	}

	// 创建记录
	repo := CustomerCodeRepo{
		ProjectID:  projectID,
		CustomerID: req.CustomerID,
		RepoPath:   req.RepoPath,
		RepoURL:    req.RepoURL,
		Branch:     branch,
		AutoSync:   req.AutoSync,
		Status:     "ready",
	}

	if err := db.Create(&repo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建代码仓库记录失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(CustomerCodeRepoResponse{
		ID:         repo.ID,
		ProjectID:  repo.ProjectID,
		CustomerID: repo.CustomerID,
		RepoPath:   repo.RepoPath,
		RepoURL:    repo.RepoURL,
		Branch:     repo.Branch,
		AutoSync:   repo.AutoSync,
		Status:     repo.Status,
	}))
}

// GetCustomerCodeReposHandler 查询项目的所有客户代码仓库
// GET /api/v1/projects/{projectId}/code-repos
func GetCustomerCodeReposHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权
	_, ok = requireFeedbackProjectMember(c, db, projectID, "查询代码仓库")
	if !ok {
		return
	}

	var repos []CustomerCodeRepo
	if err := db.Where("project_id = ?", projectID).Find(&repos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询代码仓库失败: "+err.Error(), nil))
		return
	}

	var responses []CustomerCodeRepoResponse
	for _, repo := range repos {
		responses = append(responses, CustomerCodeRepoResponse{
			ID:         repo.ID,
			ProjectID:  repo.ProjectID,
			CustomerID: repo.CustomerID,
			RepoPath:   repo.RepoPath,
			RepoURL:    repo.RepoURL,
			Branch:     repo.Branch,
			AutoSync:   repo.AutoSync,
			Status:     repo.Status,
		})
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(responses))
}

// SyncCustomerCodeRepoHandler 同步客户代码仓库
// POST /api/v1/projects/{projectId}/code-repos/{repoId}/sync
func SyncCustomerCodeRepoHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "同步代码仓库")
	if !ok {
		return
	}
	_ = userID

	// 解析仓库ID
	repoIDStr := c.Param("repoId")
	if repoIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少仓库ID参数", nil))
		return
	}

	var repoID uint
	if _, err := fmt.Sscanf(repoIDStr, "%d", &repoID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的仓库ID", nil))
		return
	}

	// 查询仓库
	var repo CustomerCodeRepo
	if err := db.Where("id = ? AND project_id = ?", repoID, projectID).First(&repo).Error; err != nil {
		c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "代码仓库不存在", nil))
		return
	}

	// 更新状态为同步中
	if err := db.Model(&repo).Update("status", "syncing").Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新状态失败: "+err.Error(), nil))
		return
	}

	// 执行 git pull 或 git clone
	go func() {
		var cmd *exec.Cmd
		if repo.RepoURL != "" && repo.RepoPath == "" {
			// 使用repo_url，需要先clone
			cmd = exec.Command("git", "clone", "-b", repo.Branch, repo.RepoURL, fmt.Sprintf("/workspace/customer-repos/%d/%s", repo.ProjectID, repo.CustomerID))
		} else if repo.RepoPath != "" {
			if err := exec.Command("git", "-C", repo.RepoPath, "rev-parse", "--is-inside-work-tree").Run(); err != nil {
				// 普通目录快照：没有可拉取的远端，磁盘内容即最新，直接就绪并索引。
				db.Model(&repo).Updates(map[string]interface{}{
					"status":         "ready",
					"last_synced_at": time.Now(),
				})
				runCodeIndexPipeline(db, projectID, repo)
				return
			}
			// 使用本地路径，直接pull
			cmd = exec.Command("git", "-C", repo.RepoPath, "pull", "origin", repo.Branch)
		} else {
			db.Model(&repo).Updates(map[string]interface{}{
				"status": "error",
			})
			return
		}

		if err := cmd.Run(); err != nil {
			db.Model(&repo).Updates(map[string]interface{}{
				"status": "error",
			})
			return
		}

		// 更新状态为已完成
		db.Model(&repo).Updates(map[string]interface{}{
			"status":        "ready",
			"last_synced_at": time.Now(),
		})

		// 自动触发代码索引
		runCodeIndexPipeline(db, projectID, repo)
	}()

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"repo_id": repoID,
		"status":  "syncing",
	}))
}

// DeleteCustomerCodeRepoHandler 删除客户代码仓库
// DELETE /api/v1/projects/{projectId}/code-repos/{repoId}
func DeleteCustomerCodeRepoHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "删除代码仓库")
	if !ok {
		return
	}
	_ = userID

	// 解析仓库ID
	repoIDStr := c.Param("repoId")
	if repoIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少仓库ID参数", nil))
		return
	}

	var repoID uint
	if _, err := fmt.Sscanf(repoIDStr, "%d", &repoID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的仓库ID", nil))
		return
	}

	// 删除仓库
	if err := db.Where("id = ? AND project_id = ?", repoID, projectID).Delete(&CustomerCodeRepo{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "删除代码仓库失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"repo_id": repoID,
		"status":  "deleted",
	}))
}
