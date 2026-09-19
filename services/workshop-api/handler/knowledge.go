package handler

import (
	"fmt"
	"net/http"
	"time"
	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// KnowledgeSourceCreateRequest 创建知识源请求
type KnowledgeSourceCreateRequest struct {
	Name       string  `json:"name" binding:"required"`
	SourceType string  `json:"source_type" binding:"required"`
	Scope      string  `json:"scope" binding:"required"`
	RepoURL    *string `json:"repo_url,omitempty"`
	Branch     *string `json:"branch,omitempty"`
}

// KnowledgeSourceResponse 知识源响应
type KnowledgeSourceResponse struct {
	ID             uint    `json:"id"`
	ProjectID      *uint   `json:"project_id,omitempty"`
	Name           string  `json:"name"`
	SourceType     string  `json:"source_type"`
	Status         string  `json:"status"`
	Scope          string  `json:"scope"`
	RepoURL        *string `json:"repo_url,omitempty"`
	Branch         *string `json:"branch,omitempty"`
	LastIndexedAt  *string `json:"last_indexed_at,omitempty"`
	LastIndexError *string `json:"last_index_error,omitempty"`
}

// KnowledgeWorkspaceResponse 知识库工作空间响应
type KnowledgeWorkspaceResponse struct {
	Enabled             bool   `json:"enabled"`
	ProjectID           *uint  `json:"project_id,omitempty"`
	WeknoraWorkspaceID  string `json:"weknora_workspace_id,omitempty"`
	Scope               string `json:"scope,omitempty"`
}

// ListKnowledgeSourcesHandler 查询项目知识源列表
// GET /api/v1/projects/{projectId}/knowledge/sources
func ListKnowledgeSourcesHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, projectID, "查询知识源")
	if !ok {
		return
	}

	var sources []models.KnowledgeSource
	if err := db.Where("project_id = ? OR project_id IS NULL", projectID).Find(&sources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询知识源失败: "+err.Error(), nil))
		return
	}

	var resp []KnowledgeSourceResponse
	for _, src := range sources {
		r := KnowledgeSourceResponse{
			ID:         src.ID,
			ProjectID:  src.ProjectID,
			Name:       src.Name,
			SourceType: src.SourceType,
			Status:     src.Status,
			Scope:      src.Scope,
			RepoURL:    src.RepoURL,
			Branch:     src.Branch,
		}
		if src.LastIndexedAt != nil {
			s := src.LastIndexedAt.Format("2006-01-02T15:04:05Z")
			r.LastIndexedAt = &s
		}
		r.LastIndexError = src.LastIndexError
		resp = append(resp, r)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// CreateKnowledgeSourceHandler 创建知识源
// POST /api/v1/projects/{projectId}/knowledge/sources
func CreateKnowledgeSourceHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "管理知识库")
	if !ok {
		return
	}
	_ = userID

	var req KnowledgeSourceCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	if !models.IsValidKnowledgeSourceType(req.SourceType) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的知识源类型", nil))
		return
	}
	if !models.IsValidKnowledgeScope(req.Scope) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的知识源范围", nil))
		return
	}

	// 检查同名重复
	var existing models.KnowledgeSource
	if err := db.Where("project_id = ? AND name = ? AND delete_at IS NULL", projectID, req.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "同名知识源已存在", nil))
		return
	}

	src := models.KnowledgeSource{
		ProjectID:  &projectID,
		Name:       req.Name,
		SourceType: req.SourceType,
		Status:     models.KnowledgeSourceStatusNotSynced,
		Scope:      req.Scope,
		RepoURL:    req.RepoURL,
		Branch:     req.Branch,
	}

	if err := db.Create(&src).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建知识源失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(KnowledgeSourceResponse{
		ID:         src.ID,
		ProjectID:  src.ProjectID,
		Name:       src.Name,
		SourceType: src.SourceType,
		Status:     src.Status,
		Scope:      src.Scope,
		RepoURL:    src.RepoURL,
		Branch:     src.Branch,
	}))
}

// DeleteKnowledgeSourceHandler 删除知识源
// DELETE /api/v1/projects/{projectId}/knowledge/sources/{sourceId}
func DeleteKnowledgeSourceHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "删除知识源")
	if !ok {
		return
	}
	_ = userID

	sourceIDStr := c.Param("sourceId")
	if sourceIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少知识源ID参数", nil))
		return
	}

	var sourceID uint
	if _, err := fmt.Sscanf(sourceIDStr, "%d", &sourceID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的知识源ID", nil))
		return
	}

	if err := db.Where("id = ? AND project_id = ?", sourceID, projectID).Delete(&models.KnowledgeSource{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "删除知识源失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"source_id": sourceID,
		"status":    "deleted",
	}))
}

// ReindexKnowledgeSourceHandler 触发重建索引
// POST /api/v1/projects/{projectId}/knowledge/sources/{sourceId}/reindex
func ReindexKnowledgeSourceHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "重建索引")
	if !ok {
		return
	}
	_ = userID

	sourceIDStr := c.Param("sourceId")
	if sourceIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少知识源ID参数", nil))
		return
	}

	var sourceID uint
	if _, err := fmt.Sscanf(sourceIDStr, "%d", &sourceID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的知识源ID", nil))
		return
	}

	var src models.KnowledgeSource
	if err := db.Where("id = ? AND project_id = ?", sourceID, projectID).First(&src).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "知识源不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询知识源失败: "+err.Error(), nil))
		return
	}

	// 标记为索引中
	if err := db.Model(&src).Update("status", models.KnowledgeSourceStatusIndexing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新状态失败: "+err.Error(), nil))
		return
	}

	// 异步触发索引重建
	go func() {
		config := DefaultCodeIndexConfig()
		now := time.Now()

		// 查找关联的客户代码仓库
		var repos []CustomerCodeRepo
		db.Where("project_id = ?", projectID).Find(&repos)

		if len(repos) == 0 {
			db.Model(&src).Updates(map[string]interface{}{
				"status":          models.KnowledgeSourceStatusSynced,
				"last_indexed_at": &now,
			})
			return
		}

		// 对每个代码仓库执行索引
		for _, repo := range repos {
			runCodeIndexPipeline(db, projectID, repo)
		}

		_ = config
	}()

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"source_id": sourceID,
		"status":    models.KnowledgeSourceStatusIndexing,
	}))
}

// KnowledgeRetrieveTestHandler 检索测试（返回原始 hits，不经草稿）
// POST /api/v1/projects/{projectId}/knowledge/retrieve-test
func KnowledgeRetrieveTestHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, projectID, "检索测试")
	if !ok {
		return
	}

	var req struct {
		Query string `json:"query" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 查询项目的 OpenHands Agent
	agent := getAgentServerByProject(db, projectID)
	if agent == nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 0,
			"data": RetrieveResponse{
				NeedCollect: true,
			},
			"message": "该项目未配置智能客服检索",
		})
		return
	}

	// 调用 OpenHands Agent 进行检索
	resp, err := callOpenHandsAgent(agent, req.Query, "")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 0,
			"data": RetrieveResponse{
				NeedCollect: true,
			},
			"message": "检索服务不可用: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": resp,
	})
}

// GetKnowledgeWorkspaceHandler 查看 workspace 绑定状态
// GET /api/v1/projects/{projectId}/knowledge/workspace
func GetKnowledgeWorkspaceHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, projectID, "查看知识库工作空间")
	if !ok {
		return
	}

	var ws models.KnowledgeWorkspace
	if err := db.Where("project_id = ? AND scope = ?", projectID, models.KnowledgeScopeProject).First(&ws).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusOK, response.NewSuccessResponse(KnowledgeWorkspaceResponse{
				Enabled: false,
			}))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询工作空间失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(KnowledgeWorkspaceResponse{
		Enabled:            true,
		ProjectID:          ws.ProjectID,
		WeknoraWorkspaceID: ws.WeknoraWorkspaceID,
		Scope:              ws.Scope,
	}))
}
