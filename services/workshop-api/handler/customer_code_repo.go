package handler

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os/exec"
	"regexp"
	"strings"
	"time"
	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// ProjectGitHubRepoRequest is the public Console contract for the single
// GitHub repository used as a project's OpenHands workspace. The legacy
// customer-code-repo endpoints still support local paths for operators; this
// contract deliberately accepts GitHub HTTPS URLs only so ordinary project
// members cannot point the server at arbitrary hosts or local directories.
type ProjectGitHubRepoRequest struct {
	RepoURL string `json:"repo_url" binding:"required"`
	Branch  string `json:"branch,omitempty"`
}

var (
	githubOwnerPattern = regexp.MustCompile(`^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$`)
	githubRepoPattern  = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)
	gitBranchPattern   = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$`)
)

func customerCodeRepoResponse(repo CustomerCodeRepo) CustomerCodeRepoResponse {
	lastSyncedAt := ""
	if !repo.LastSyncedAt.IsZero() {
		lastSyncedAt = repo.LastSyncedAt.UTC().Format(time.RFC3339)
	}
	return CustomerCodeRepoResponse{
		ID:           repo.ID,
		ProjectID:    repo.ProjectID,
		CustomerID:   repo.CustomerID,
		RepoPath:     repo.RepoPath,
		RepoURL:      repo.RepoURL,
		Branch:       repo.Branch,
		AutoSync:     repo.AutoSync,
		Status:       repo.Status,
		LastSyncedAt: lastSyncedAt,
	}
}

func normalizeGitHubRepoURL(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Scheme != "https" || !strings.EqualFold(parsed.Hostname(), "github.com") || parsed.Port() != "" || parsed.User != nil {
		return "", fmt.Errorf("仓库地址必须是 https://github.com/owner/repo")
	}
	if parsed.RawQuery != "" || parsed.Fragment != "" || strings.Contains(parsed.EscapedPath(), "%") {
		return "", fmt.Errorf("仓库地址不能包含查询参数、片段或转义路径")
	}
	parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(parts) != 2 {
		return "", fmt.Errorf("仓库地址必须包含 GitHub owner 和 repository")
	}
	owner := parts[0]
	repo := strings.TrimSuffix(parts[1], ".git")
	if !githubOwnerPattern.MatchString(owner) || !githubRepoPattern.MatchString(repo) || repo == "." || repo == ".." {
		return "", fmt.Errorf("GitHub owner 或 repository 格式无效")
	}
	return fmt.Sprintf("https://github.com/%s/%s.git", owner, repo), nil
}

func normalizeGitBranch(raw string) (string, error) {
	branch := strings.TrimSpace(raw)
	if branch == "" {
		branch = "main"
	}
	if !gitBranchPattern.MatchString(branch) || strings.Contains(branch, "..") || strings.Contains(branch, "//") ||
		strings.Contains(branch, "@{") || strings.HasSuffix(branch, "/") || strings.HasSuffix(branch, ".") || strings.HasSuffix(branch, ".lock") {
		return "", fmt.Errorf("分支名称格式无效")
	}
	return branch, nil
}

func saveProjectGitHubRepo(db *gorm.DB, projectID uint, repoURL, branch string) (CustomerCodeRepo, error) {
	var repo CustomerCodeRepo
	err := db.Transaction(func(tx *gorm.DB) error {
		findErr := tx.Where("project_id = ?", projectID).
			Order("CASE WHEN status = 'ready' THEN 0 ELSE 1 END, id DESC").
			First(&repo).Error
		if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return fmt.Errorf("查询代码仓库失败: %w", findErr)
		}

		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			repo = CustomerCodeRepo{
				ProjectID:  projectID,
				CustomerID: fmt.Sprintf("project-%d", projectID),
				RepoURL:    repoURL,
				Branch:     branch,
				AutoSync:   true,
				Status:     "syncing",
			}
			if createErr := tx.Create(&repo).Error; createErr != nil {
				return fmt.Errorf("创建代码仓库配置失败: %w", createErr)
			}
		} else {
			updates := map[string]interface{}{
				"repo_url":  repoURL,
				"branch":    branch,
				"auto_sync": true,
				"status":    "syncing",
			}
			if updateErr := tx.Model(&repo).Updates(updates).Error; updateErr != nil {
				return fmt.Errorf("更新代码仓库配置失败: %w", updateErr)
			}
			repo.RepoURL = repoURL
			repo.Branch = branch
			repo.AutoSync = true
			repo.Status = "syncing"
		}

		// Keep the existing project metadata field in sync so project lists and
		// the V3 OpenHands configuration do not show different repository URLs.
		if updateErr := tx.Model(&models.Project{}).Where("id = ?", projectID).Update("git_url", repoURL).Error; updateErr != nil {
			return fmt.Errorf("更新项目 Git 地址失败: %w", updateErr)
		}
		return nil
	})
	return repo, err
}

// UpsertProjectGitHubRepoHandler creates or updates the one repository that is
// mounted into OpenHands for a project, then starts an asynchronous sync.
// PUT /api/v1/projects/{projectId}/code-repo
func UpsertProjectGitHubRepoHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	if _, ok = requireFeedbackProjectMember(c, db, projectID, "配置 GitHub 代码仓库"); !ok {
		return
	}

	var req ProjectGitHubRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	repoURL, err := normalizeGitHubRepoURL(req.RepoURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	branch, err := normalizeGitBranch(req.Branch)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	repo, err := saveProjectGitHubRepo(db, projectID, repoURL, branch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "保存代码仓库配置失败: "+err.Error(), nil))
		return
	}

	go syncCodeRepo(db, repo)
	c.JSON(http.StatusOK, response.NewSuccessResponse(customerCodeRepoResponse(repo)))
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
	// UI 文案承诺"正在同步索引"：本地路径创建后必须启动索引管道，
	// 否则仓库永远零 chunks、检索恒未命中。
	status := "ready"
	if req.RepoPath != "" {
		status = "syncing"
	}
	repo := CustomerCodeRepo{
		ProjectID:  projectID,
		CustomerID: req.CustomerID,
		RepoPath:   req.RepoPath,
		RepoURL:    req.RepoURL,
		Branch:     branch,
		AutoSync:   req.AutoSync,
		Status:     status,
	}

	if err := db.Create(&repo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建代码仓库记录失败: "+err.Error(), nil))
		return
	}

	if req.RepoPath != "" {
		created := repo
		go runCodeIndexPipeline(db, projectID, created)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(customerCodeRepoResponse(repo)))
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
	if err := db.Where("project_id = ?", projectID).
		Order("CASE WHEN status = 'ready' THEN 0 WHEN status = 'syncing' THEN 1 ELSE 2 END, id DESC").
		Find(&repos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询代码仓库失败: "+err.Error(), nil))
		return
	}

	var responses []CustomerCodeRepoResponse
	for _, repo := range repos {
		responses = append(responses, customerCodeRepoResponse(repo))
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

	// 异步执行 git clone/pull：落点统一为 per-project 工作区，成功后回写 repo_path。
	go syncCodeRepo(db, repo)

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"repo_id": repoID,
		"status":  "syncing",
	}))
}

// errCodeRepoNoSource 仓库既无 RepoURL 也无 RepoPath，无可同步内容。
var errCodeRepoNoSource = fmt.Errorf("repo_url 和 repo_path 均为空，无可同步内容")

// cloneOrPullRepo 执行客户代码仓库的 git clone/pull，返回索引落点目录。
// 纯 git 操作，不碰 DB 与索引，便于单测落点：
//   - RepoURL 配置且 RepoPath 为空：clone 到 ohClonedRepoDir(projectID)（per-project 工作区），
//     落点即该目录。替换原先硬编码的 /workspace/customer-repos/{pid}/{cid}。
//   - RepoPath 是 git 工作树：pull origin branch，落点为 RepoPath。
//   - RepoPath 是普通目录（非 git）：无远端可拉，落点为 RepoPath（快照即最新）。
//   - 两者皆空：返回 errCodeRepoNoSource，由调用方置 error。
func cloneOrPullRepo(repo CustomerCodeRepo) (string, error) {
	if repo.RepoURL != "" {
		cloneDir := strings.TrimSpace(repo.RepoPath)
		if cloneDir == "" {
			cloneDir = ohClonedRepoDir(repo.ProjectID)
		}
		if dirExists(cloneDir) && exec.Command("git", "-C", cloneDir, "rev-parse", "--is-inside-work-tree").Run() == nil {
			if err := exec.Command("git", "-C", cloneDir, "remote", "set-url", "origin", repo.RepoURL).Run(); err != nil {
				return cloneDir, err
			}
			if err := exec.Command("git", "-C", cloneDir, "fetch", "--prune", "origin", repo.Branch).Run(); err != nil {
				return cloneDir, err
			}
			return cloneDir, exec.Command("git", "-C", cloneDir, "checkout", "-B", repo.Branch, "origin/"+repo.Branch).Run()
		}
		return cloneDir, exec.Command("git", "clone", "-b", repo.Branch, repo.RepoURL, cloneDir).Run()
	}
	if repo.RepoPath == "" {
		return "", errCodeRepoNoSource
	}
	if err := exec.Command("git", "-C", repo.RepoPath, "rev-parse", "--is-inside-work-tree").Run(); err != nil {
		// 普通目录快照：没有可拉取的远端，磁盘内容即最新。
		return repo.RepoPath, nil
	}
	return repo.RepoPath, exec.Command("git", "-C", repo.RepoPath, "pull", "origin", repo.Branch).Run()
}

// persistCodeRepoSyncResult 回写同步结果：cloneDir 非空时一并写 repo_path（fresh clone 落点回写），
// 否则只更新 status + last_synced_at。调用方通过传空 cloneDir 控制 是否回写 repo_path。
func persistCodeRepoSyncResult(db *gorm.DB, repo CustomerCodeRepo, cloneDir string, status string) {
	updates := map[string]interface{}{
		"status":         status,
		"last_synced_at": time.Now(),
	}
	if cloneDir != "" {
		updates["repo_path"] = cloneDir
	}
	db.Model(&repo).Updates(updates)
}

// syncCodeRepo 编排一次代码仓库同步：clone/pull → 回写结果 → 触发索引。
// 保留既有兜底语义：脏工作区 pull 失败仍按 ready+索引处理，避免检索永远未命中。
func syncCodeRepo(db *gorm.DB, repo CustomerCodeRepo) {
	cloneDir, err := cloneOrPullRepo(repo)

	if err == errCodeRepoNoSource {
		db.Model(&repo).Updates(map[string]interface{}{"status": "error"})
		return
	}

	if err != nil && repo.RepoURL != "" {
		log.Printf("[code-repo] remote sync failed project=%d repo=%d url=%s path=%s: %v",
			repo.ProjectID, repo.ID, repo.RepoURL, cloneDir, err)
		persistCodeRepoSyncResult(db, repo, "", "error")
		return
	}

	if err != nil {
		// 本地脏工作区 pull 失败很常见（开发仓有未提交修改）：
		// 磁盘内容仍可索引，不得直接 error 导致检索永远未命中。
		log.Printf("[code-repo] git sync failed project=%d repo=%d path=%s clone_dir=%s: %v (fallback: index local snapshot)",
			repo.ProjectID, repo.ID, repo.RepoPath, cloneDir, err)
		// fresh clone 失败时落点目录可能不存在，不回写 repo_path（传空跳过），保留既有兜底。
		writeDir := cloneDir
		if repo.RepoURL != "" && repo.RepoPath == "" {
			writeDir = ""
		}
		persistCodeRepoSyncResult(db, repo, writeDir, "ready")
		runCodeIndexPipeline(db, repo.ProjectID, repo)
		return
	}

	// 成功：fresh clone 回写 repo_path=per-project 工作区；pull/快照 cloneDir==RepoPath，回写幂等。
	persistCodeRepoSyncResult(db, repo, cloneDir, "ready")
	// fresh clone 的调用参数仍带空 RepoPath；索引必须使用刚刚成功的实际落点，
	// 不能等待下一次从 DB 重新加载，否则首次同步会被误判为“仓库路径为空”。
	repo.RepoPath = cloneDir
	runCodeIndexPipeline(db, repo.ProjectID, repo)
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
