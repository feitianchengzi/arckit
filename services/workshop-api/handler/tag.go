package handler

import (
	"net/http"
	"strconv"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateTagRequest 创建标签请求结构
type CreateTagRequest struct {
	ProjectID uint   `json:"project_id" binding:"required"` // 项目ID（必填）
	Name      string `json:"name" binding:"required"`       // 标签名称（必填）
}

// UpdateTagRequest 更新标签请求结构
type UpdateTagRequest struct {
	Name string `json:"name" binding:"required"` // 标签名称（必填）
}

// TagResponse 标签响应结构
type TagResponse struct {
	ID        uint    `json:"id"`                   // 标签ID
	ProjectID uint    `json:"project_id"`           // 项目ID
	Name      string  `json:"name"`                 // 标签名称
	CreatedAt string  `json:"created_at"`           // 创建时间
	UpdatedAt string  `json:"updated_at"`           // 更新时间
	DeletedAt *string `json:"deleted_at,omitempty"` // 删除时间（如果存在）
}

// GetTagsRequest 查询标签请求结构
type GetTagsRequest struct {
	IncludeDeleted bool `form:"include_deleted"` // 是否包含已删除的记录（可选，默认false）
}

// GetTags 查询项目的所有标签
// 网关路由: GET /todo-service/v1/user/projects/:id/tags?include_deleted=true
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func GetTags(c *gin.Context) {
	// 1. 从URL参数获取项目ID
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "项目ID格式错误", nil))
		return
	}

	// 2. 绑定查询参数
	var req GetTagsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		// 如果绑定失败，使用默认值（include_deleted=false）
		req.IncludeDeleted = false
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 4. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 验证用户是否为项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTagNotMember, "您不是该项目的成员，无法查看标签", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 6. 构建查询条件
	query := db.Where("project_id = ?", projectID).Order("created_at DESC")
	if req.IncludeDeleted {
		query = query.Unscoped()
	}

	// 7. 查询项目的所有标签
	var tags []models.Tag
	if err := query.Find(&tags).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "查询标签失败: "+err.Error(), nil))
		return
	}

	// 8. 转换为响应格式
	tagResponses := make([]TagResponse, len(tags))
	for i, tag := range tags {
		var deletedAt *string
		if tag.DeletedAt.Valid {
			deletedAtStr := tag.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
			deletedAt = &deletedAtStr
		}

		tagResponses[i] = TagResponse{
			ID:        tag.ID,
			ProjectID: tag.ProjectID,
			Name:      tag.Name,
			CreatedAt: tag.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: tag.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			DeletedAt: deletedAt,
		}
	}

	resp := tagResponses
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// CreateTag 创建新标签
// 网关路由: POST /todo-service/v1/user/projects/:id/tags
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func CreateTag(c *gin.Context) {
	// 1. 从URL参数获取项目ID
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "项目ID格式错误", nil))
		return
	}

	// 2. 解析请求体
	var req CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 验证项目ID是否匹配
	if req.ProjectID != uint(projectID) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "URL中的项目ID与请求体中的项目ID不匹配", nil))
		return
	}

	// 4. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 5. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 6. 验证用户是否为项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTagNotMember, "您不是该项目的成员，无法创建标签", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 检查标签名称是否已存在（同一项目内）
	var existingTag models.Tag
	if err := db.Where("project_id = ? AND name = ?", projectID, req.Name).First(&existingTag).Error; err == nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "该标签名称已存在", nil))
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "检查标签名称失败: "+err.Error(), nil))
		return
	}

	// 8. 创建标签
	tag := models.Tag{
		ProjectID: uint(projectID),
		Name:      req.Name,
	}
	if err := db.Create(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagCreateFailed, "创建标签失败: "+err.Error(), nil))
		return
	}

	// 9. 返回创建的标签
	tagResponse := TagResponse{
		ID:        tag.ID,
		ProjectID: tag.ProjectID,
		Name:      tag.Name,
		CreatedAt: tag.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: tag.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		DeletedAt: nil,
	}

	notifyProjectEvent(c, db, tag.ProjectID, userID, "tag.created", tagResponse)
	c.JSON(http.StatusOK, response.NewSuccessResponse(tagResponse))
}

// UpdateTag 更新标签
// 网关路由: PUT /todo-service/v1/user/tags/:id
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func UpdateTag(c *gin.Context) {
	// 1. 从URL参数获取标签ID
	tagIDStr := c.Param("id")
	tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "标签ID格式错误", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 4. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询标签
	var tag models.Tag
	if err := db.First(&tag, tagID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTagNotFound, "标签不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "查询标签失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否为项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", tag.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTagNotMember, "您不是该项目的成员，无法更新标签", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 检查新标签名称是否已存在（同一项目内，排除当前标签）
	var existingTag models.Tag
	if err := db.Where("project_id = ? AND name = ? AND id != ?", tag.ProjectID, req.Name, tagID).First(&existingTag).Error; err == nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "该标签名称已存在", nil))
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "检查标签名称失败: "+err.Error(), nil))
		return
	}

	// 8. 更新标签
	tag.Name = req.Name
	if err := db.Save(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagUpdateFailed, "更新标签失败: "+err.Error(), nil))
		return
	}

	// 9. 返回更新后的标签
	var deletedAt *string
	if tag.DeletedAt.Valid {
		deletedAtStr := tag.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		deletedAt = &deletedAtStr
	}

	tagResponse := TagResponse{
		ID:        tag.ID,
		ProjectID: tag.ProjectID,
		Name:      tag.Name,
		CreatedAt: tag.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: tag.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		DeletedAt: deletedAt,
	}

	notifyProjectEvent(c, db, tag.ProjectID, userID, "tag.updated", tagResponse)
	c.JSON(http.StatusOK, response.NewSuccessResponse(tagResponse))
}

// DeleteTag 删除标签
// 网关路由: DELETE /todo-service/v1/user/tags/:id
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func DeleteTag(c *gin.Context) {
	// 1. 从URL参数获取标签ID
	tagIDStr := c.Param("id")
	tagID, err := strconv.ParseUint(tagIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "标签ID格式错误", nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 查询标签
	var tag models.Tag
	if err := db.First(&tag, tagID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTagNotFound, "标签不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "查询标签失败: "+err.Error(), nil))
		return
	}

	// 5. 验证用户是否为项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", tag.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTagNotMember, "您不是该项目的成员，无法删除标签", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 6. 删除标签
	if err := db.Delete(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTagDeleteFailed, "删除标签失败: "+err.Error(), nil))
		return
	}

	notifyProjectEvent(c, db, tag.ProjectID, userID, "tag.deleted", gin.H{
		"id": tag.ID,
	})
	c.JSON(http.StatusOK, response.NewSuccessResponse(nil))
}
