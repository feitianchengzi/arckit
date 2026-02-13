package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ProjectFeedbackAccessKeyResponse 项目反馈访问密钥响应
type ProjectFeedbackAccessKeyResponse struct {
	ID        uint   `json:"id"`
	ProjectID uint   `json:"project_id"`
	ShortID   string `json:"short_id"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func buildProjectFeedbackAccessKeyResponse(key models.ProjectFeedbackAccessKey) ProjectFeedbackAccessKeyResponse {
	return ProjectFeedbackAccessKeyResponse{
		ID:        key.ID,
		ProjectID: key.ProjectID,
		ShortID:   key.ShortID,
		CreatedAt: key.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: key.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func parseProjectIDFromPath(c *gin.Context) (uint, bool) {
	projectIDStr := strings.TrimSpace(c.Param("id"))
	if projectIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "项目ID不能为空", nil))
		return 0, false
	}

	var projectID uint
	if _, err := fmt.Sscanf(projectIDStr, "%d", &projectID); err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的项目ID", nil))
		return 0, false
	}
	return projectID, true
}

func ensureProjectAdminOrOwner(c *gin.Context, db *gorm.DB, projectID uint, action string) bool {
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return false
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员，无法"+action, nil))
			return false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return false
	}

	if member.Role != models.ProjectRoleOwner && member.Role != models.ProjectRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "您没有权限"+action+"，只有项目所有者和管理员可以操作", nil))
		return false
	}

	return true
}

// CreateProjectFeedbackAccessKey 创建项目反馈访问 key
// 认证级别: user (需要JWT认证)
// 权限: 项目管理员/所有者
func CreateProjectFeedbackAccessKey(c *gin.Context) {
	projectID, ok := parseProjectIDFromPath(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	if ok := ensureProjectAdminOrOwner(c, db, projectID, "创建反馈访问 key"); !ok {
		return
	}

	key := models.ProjectFeedbackAccessKey{
		ProjectID: projectID,
	}
	if err := db.Create(&key).Error; err != nil {
		if isUniqueViolation(err, "uniq_feedback_access_key_short_id") {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈访问 key 已存在，请重试", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyCreateFailed, "创建反馈访问 key 失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusCreated, response.NewSuccessResponse(buildProjectFeedbackAccessKeyResponse(key)))
}

// GetProjectFeedbackAccessKeys 查询项目反馈访问 key 列表
// 认证级别: user (需要JWT认证)
// 权限: 项目管理员/所有者
func GetProjectFeedbackAccessKeys(c *gin.Context) {
	projectID, ok := parseProjectIDFromPath(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	if ok := ensureProjectAdminOrOwner(c, db, projectID, "查看反馈访问 key"); !ok {
		return
	}

	query := db.Model(&models.ProjectFeedbackAccessKey{}).
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Order("id DESC")

	pagination, _ := ParsePagination(c)

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyQueryFailed, "查询反馈访问 key 总数失败: "+err.Error(), nil))
		return
	}

	var keys []models.ProjectFeedbackAccessKey
	if err := query.Offset(pagination.Offset).Limit(pagination.Limit).Find(&keys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyQueryFailed, "查询反馈访问 key 失败: "+err.Error(), nil))
		return
	}

	respItems := make([]ProjectFeedbackAccessKeyResponse, len(keys))
	for i, item := range keys {
		respItems[i] = buildProjectFeedbackAccessKeyResponse(item)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(respItems, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}

// DeleteProjectFeedbackAccessKey 删除项目反馈访问 key
// 认证级别: user (需要JWT认证)
// 权限: 项目管理员/所有者
func DeleteProjectFeedbackAccessKey(c *gin.Context) {
	projectID, ok := parseProjectIDFromPath(c)
	if !ok {
		return
	}

	keyIDStr := strings.TrimSpace(c.Param("key_id"))
	if keyIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "key_id 不能为空", nil))
		return
	}

	var keyID uint
	if _, err := fmt.Sscanf(keyIDStr, "%d", &keyID); err != nil || keyID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的 key_id", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	if ok := ensureProjectAdminOrOwner(c, db, projectID, "删除反馈访问 key"); !ok {
		return
	}

	var accessKey models.ProjectFeedbackAccessKey
	if err := db.Where("id = ? AND project_id = ?", keyID, projectID).First(&accessKey).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackAccessKeyNotFound, "反馈访问 key 不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyQueryFailed, "查询反馈访问 key 失败: "+err.Error(), nil))
		return
	}

	deletedAt := time.Now()
	if err := db.Delete(&accessKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyDeleteFailed, "删除反馈访问 key 失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"id":         accessKey.ID,
		"project_id": accessKey.ProjectID,
		"short_id":   accessKey.ShortID,
		"deleted_at": deletedAt.Format("2006-01-02T15:04:05Z07:00"),
	}))
}

// GetPublicFeedbacksByKey 公共接口：通过 key 查询项目反馈
// 认证级别: public (无需认证)
func GetPublicFeedbacksByKey(c *gin.Context) {
	key := strings.TrimSpace(c.Query("key"))
	if key == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "key 不能为空", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var accessKey models.ProjectFeedbackAccessKey
	if err := db.Where("short_id = ?", strings.ToUpper(key)).First(&accessKey).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackAccessKeyNotFound, "反馈访问 key 不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackAccessKeyQueryFailed, "查询反馈访问 key 失败: "+err.Error(), nil))
		return
	}

	query := db.Model(&models.Feedback{}).
		Where("project_id = ?", accessKey.ProjectID).
		Order("created_at DESC").
		Order("id DESC")

	if shortID := strings.TrimSpace(c.Query("short_id")); shortID != "" {
		query = query.Where("short_id = ?", shortID)
	}
	if userPhone := strings.TrimSpace(c.Query("user_phone")); userPhone != "" {
		query = query.Where("user_phone = ?", userPhone)
	}
	if userEmail := strings.TrimSpace(c.Query("user_email")); userEmail != "" {
		query = query.Where("user_email = ?", userEmail)
	}
	if customUserID := strings.TrimSpace(c.Query("custom_user_id")); customUserID != "" {
		query = query.Where("custom_user_id = ?", customUserID)
	}

	pagination, _ := ParsePagination(c)

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈总数失败: "+err.Error(), nil))
		return
	}

	var feedbacks []models.Feedback
	if err := query.Offset(pagination.Offset).Limit(pagination.Limit).Find(&feedbacks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	respItems := make([]FeedbackResponse, len(feedbacks))
	for i, item := range feedbacks {
		respItems[i] = buildFeedbackResponse(item)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(respItems, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}
