package handler

import (
	"errors"
	"net/http"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CreateOrganizationRequest 创建组织请求结构
type CreateOrganizationRequest struct {
	Name        string `json:"name" binding:"required"` // 组织名称（必填）
	Description string `json:"description"`             // 组织描述（可选）
}

// OrganizationMemberResponse 组织成员响应结构
type OrganizationMemberResponse struct {
	ID        uint   `json:"id"`         // 成员关系ID
	UserID    uint   `json:"user_id"`    // 用户ID
	Role      string `json:"role"`       // 角色
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 加入时间
	IsMe      bool   `json:"is_me"`      // 是否是当前用户自己
}

// CreateOrganizationResponse 创建组织响应结构
type CreateOrganizationResponse struct {
	ID          uint                         `json:"id"`          // 组织ID
	Name        string                       `json:"name"`        // 组织名称
	Description string                       `json:"description"` // 组织描述
	CreatorID   uint                         `json:"creator_id"`  // 创建者ID
	Members     []OrganizationMemberResponse `json:"members"`     // 组织成员列表
	CreatedAt   string                       `json:"created_at"`  // 创建时间
}

// CreateOrganization 创建新组织
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 事务操作：创建组织并将创建者加入组织成员（role=owner）
func CreateOrganization(c *gin.Context) {
	// 1. 解析请求体
	var req CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
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

	// 4. 在事务中创建组织和组织成员
	var organization models.Organization
	err := db.Transaction(func(tx *gorm.DB) error {
		// 创建组织
		organization = models.Organization{
			Name:        req.Name,
			Description: req.Description,
			CreatorID:   userID,
		}
		if err := tx.Create(&organization).Error; err != nil {
			return err
		}

		// 将创建者加入组织成员（role=owner）
		member := models.OrganizationMember{
			OrganizationID: organization.ID,
			UserID:         userID,
			Role:           models.OrganizationRoleOwner,
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationCreateFailed, "创建组织失败: "+err.Error(), nil))
		return
	}

	// 5. 查询组织成员（包含创建者）
	var members []models.OrganizationMember
	if err := db.Where("organization_id = ?", organization.ID).Preload("User").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织成员失败: "+err.Error(), nil))
		return
	}

	// 6. 转换为响应格式
	memberResponses := make([]OrganizationMemberResponse, 0, len(members))
	for _, member := range members {
		memberResponses = append(memberResponses, OrganizationMemberResponse{
			ID:        member.ID,
			UserID:    member.UserID,
			Role:      member.Role,
			Username:  member.User.Username,
			Avatar:    member.User.Avatar,
			CreatedAt: member.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			IsMe:      member.UserID == userID,
		})
	}

	// 7. 返回成功响应
	resp := CreateOrganizationResponse{
		ID:          organization.ID,
		Name:        organization.Name,
		Description: organization.Description,
		CreatorID:   organization.CreatorID,
		Members:     memberResponses,
		CreatedAt:   organization.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// OrganizationResponse 组织响应结构（用于查询接口）
type OrganizationResponse struct {
	ID          uint    `json:"id"`                   // 组织ID
	Name        string  `json:"name"`                 // 组织名称
	Description string  `json:"description"`          // 组织描述
	CreatorID   uint    `json:"creator_id"`           // 创建者ID
	CreatedAt   string  `json:"created_at"`           // 创建时间
	UpdatedAt   string  `json:"updated_at"`           // 更新时间
	DeletedAt   *string `json:"deleted_at,omitempty"` // 删除时间（如果存在）
}

// GetUserOrganizationsResponse 查询用户组织响应结构
type GetUserOrganizationsResponse struct {
	Organizations []OrganizationResponse `json:"organizations"` // 组织列表
	Total         int64                  `json:"total"`         // 组织总数
}

// GetUserOrganizationsRequest 查询用户组织请求结构
type GetUserOrganizationsRequest struct {
	IncludeDeleted bool `form:"include_deleted"` // 是否包含已删除的记录（可选，默认false）
	Page           int  `form:"page"`            // 页码（可选，默认1）
	PageSize       int  `form:"page_size"`       // 每页条数（可选，默认50，最大200）
}

// GetUserOrganizations 根据用户ID查询所有参与的组织
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从Header UUID获取用户ID（通过中间件ExtractUserID）
// 2. 查询该用户参与的所有组织（通过organization_members表）
func GetUserOrganizations(c *gin.Context) {
	// 1. 绑定查询参数
	var req GetUserOrganizationsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		// 如果绑定失败，使用默认值（include_deleted=false）
		req.IncludeDeleted = false
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

	// 4. 构建查询条件
	query := db.Model(&models.Organization{}).
		Joins("JOIN organization_members om ON om.organization_id = organizations.id").
		Where("om.user_id = ?", userID)
	if req.IncludeDeleted {
		query = query.Unscoped()
	} else {
		query = query.Where("om.delete_at IS NULL")
	}

	// 5. 解析分页参数
	pagination, paginated := ParsePagination(c)

	// 6. 查询组织总数（仅分页时）
	var total int64
	if paginated {
		countQuery := query.Distinct("organizations.id").Session(&gorm.Session{})
		if err := countQuery.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织总数失败: "+err.Error(), nil))
			return
		}
	}

	// 7. 查询组织列表
	query = query.Distinct().Order("organizations.updated_at DESC").Order("organizations.id DESC")
	if paginated {
		query = query.Offset(pagination.Offset).Limit(pagination.Limit)
	}
	var organizations []models.Organization
	if err := query.Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 8. 构建响应
	organizationResponses := make([]OrganizationResponse, 0, len(organizations))
	for _, organization := range organizations {
		var deletedAt *string
		if organization.DeletedAt.Valid {
			deletedAtStr := organization.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
			deletedAt = &deletedAtStr
		}

		organizationResponses = append(organizationResponses, OrganizationResponse{
			ID:          organization.ID,
			Name:        organization.Name,
			Description: organization.Description,
			CreatorID:   organization.CreatorID,
			CreatedAt:   organization.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   organization.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			DeletedAt:   deletedAt,
		})
	}

	// 9. 返回成功响应
	if !paginated {
		total = int64(len(organizationResponses))
	}
	resp := GetUserOrganizationsResponse{
		Organizations: organizationResponses,
		Total:         total,
	}
	if paginated {
		c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(resp, response.Meta{
			Page:     pagination.Page,
			PageSize: pagination.PageSize,
			Total:    int(total),
		}))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// GetOrganizationMembersRequest 查询组织成员请求结构
type GetOrganizationMembersRequest struct {
	IncludeDeleted bool `form:"include_deleted"` // 是否包含已删除的记录（可选，默认false）
	Page           int  `form:"page"`            // 页码（可选，默认1）
	PageSize       int  `form:"page_size"`       // 每页条数（可选，默认50，最大200）
}

// GetOrganizationMembersResponse 查询组织成员响应结构
type GetOrganizationMembersResponse struct {
	Members []OrganizationMemberResponse `json:"members"` // 组织成员列表
	Total   int64                        `json:"total"`   // 成员总数
}

// GetOrganizationMembers 查询组织成员列表
// 认证级别: user (需要JWT认证)
// 权限规则：只有组织成员可以查看成员列表
// 流程：
// 1. 从请求获取用户ID
// 2. 查询组织
// 3. 验证用户是否是组织成员
// 4. 查询组织成员列表
func GetOrganizationMembers(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
		return
	}

	// 2. 绑定查询参数
	var req GetOrganizationMembersRequest
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

	// 5. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否是组织成员
	var member models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 构建成员查询条件
	memberQuery := db.Where("organization_id = ?", organization.ID).Order("created_at DESC").Order("id DESC")
	if req.IncludeDeleted {
		memberQuery = memberQuery.Unscoped()
	}

	// 8. 解析分页参数
	pagination, paginated := ParsePagination(c)

	// 9. 查询组织成员总数（仅分页时）
	var total int64
	if paginated {
		countQuery := memberQuery.Model(&models.OrganizationMember{}).Session(&gorm.Session{})
		if err := countQuery.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织成员总数失败: "+err.Error(), nil))
			return
		}
	}

	// 10. 查询组织成员列表
	if paginated {
		memberQuery = memberQuery.Offset(pagination.Offset).Limit(pagination.Limit)
	}
	var members []models.OrganizationMember
	if err := memberQuery.Preload("User").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织成员失败: "+err.Error(), nil))
		return
	}

	// 9. 转换为响应格式
	memberResponses := make([]OrganizationMemberResponse, 0, len(members))
	for _, m := range members {
		memberResponses = append(memberResponses, OrganizationMemberResponse{
			ID:        m.ID,
			UserID:    m.UserID,
			Role:      m.Role,
			Username:  m.User.Username,
			Avatar:    m.User.Avatar,
			CreatedAt: m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			IsMe:      m.UserID == userID,
		})
	}

	// 11. 返回成功响应
	if !paginated {
		total = int64(len(memberResponses))
	}
	resp := GetOrganizationMembersResponse{
		Members: memberResponses,
		Total:   total,
	}
	if paginated {
		c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(resp, response.Meta{
			Page:     pagination.Page,
			PageSize: pagination.PageSize,
			Total:    int(total),
		}))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// UpdateOrganizationRequest 更新组织请求结构
type UpdateOrganizationRequest struct {
	Name        *string `json:"name,omitempty"`        // 组织名称（可选）
	Description *string `json:"description,omitempty"` // 组织描述（可选）
}

// UpdateOrganizationResponse 更新组织响应结构
type UpdateOrganizationResponse struct {
	ID          uint   `json:"id"`          // 组织ID
	Name        string `json:"name"`        // 组织名称
	Description string `json:"description"` // 组织描述
	CreatorID   uint   `json:"creator_id"`  // 创建者ID
	CreatedAt   string `json:"created_at"`  // 创建时间
	UpdatedAt   string `json:"updated_at"`  // 更新时间
}

// UpdateOrganization 更新组织信息
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以更新组织信息
// - member：无权限更新组织
// 流程：
// 1. 从请求获取用户ID
// 2. 查询组织
// 3. 验证用户权限（owner/admin）
// 4. 更新组织信息
// 5. 返回更新后的组织信息
func UpdateOrganization(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateOrganizationRequest
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

	// 5. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否是组织成员
	var member models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 验证权限：只有owner和admin可以更新组织
	if member.Role != models.OrganizationRoleOwner && member.Role != models.OrganizationRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNoPermission, "您没有权限更新此组织，只有组织所有者和管理员可以更新", nil))
		return
	}

	// 8. 构建更新字段
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	// 9. 如果没有要更新的字段，直接返回当前组织信息
	if len(updates) == 0 {
		resp := UpdateOrganizationResponse{
			ID:          organization.ID,
			Name:        organization.Name,
			Description: organization.Description,
			CreatorID:   organization.CreatorID,
			CreatedAt:   organization.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   organization.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
		return
	}

	// 10. 更新组织信息
	if err := db.Model(&organization).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationUpdateFailed, "更新组织失败: "+err.Error(), nil))
		return
	}

	// 11. 重新查询组织以获取最新数据
	if err := db.First(&organization, organization.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询更新后的组织信息失败: "+err.Error(), nil))
		return
	}

	// 12. 返回成功响应
	resp := UpdateOrganizationResponse{
		ID:          organization.ID,
		Name:        organization.Name,
		Description: organization.Description,
		CreatorID:   organization.CreatorID,
		CreatedAt:   organization.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   organization.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// DeleteOrganization 删除组织
// 认证级别: user (需要JWT认证)
// 权限规则：只有组织所有者可以删除组织
// 流程：
// 1. 从请求获取用户ID
// 2. 查询组织
// 3. 验证用户是组织所有者
// 4. 应用层级联软删除：先软删除该组织的成员、邀请、下属项目，再软删除组织
// 注意：使用软删除，需在应用层显式软删除关联数据，数据库 ON DELETE CASCADE 仅在物理删除时触发
func DeleteOrganization(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
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

	// 4. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 5. 验证用户是否是组织成员
	var member models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}

	// 6. 验证权限：只有owner可以删除组织
	if member.Role != models.OrganizationRoleOwner {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNoPermission, "只有组织所有者可以删除组织", nil))
		return
	}

	// 7. 在事务中级联软删除：组织下项目全链路数据 + 组织自身
	err := db.Transaction(func(tx *gorm.DB) error {
		projectIDs := tx.Model(&models.Project{}).Select("id").Where("organization_id = ?", organization.ID)
		taskIDs := tx.Model(&models.Task{}).Select("id").Where("project_id IN (?)", projectIDs)

		// 7.1 软删除该组织下所有项目的任务附件
		if err := tx.Where("task_id IN (?)", taskIDs).Delete(&models.TaskAttachment{}).Error; err != nil {
			return err
		}
		// 7.2 软删除该组织下所有项目的任务
		if err := tx.Where("project_id IN (?)", projectIDs).Delete(&models.Task{}).Error; err != nil {
			return err
		}
		// 7.3 软删除该组织下所有项目的标签
		if err := tx.Where("project_id IN (?)", projectIDs).Delete(&models.Tag{}).Error; err != nil {
			return err
		}
		// 7.4 软删除该组织下所有项目的成员
		if err := tx.Where("project_id IN (?)", projectIDs).Delete(&models.ProjectMember{}).Error; err != nil {
			return err
		}
		// 7.5 软删除该组织下所有项目的邀请
		if err := tx.Where("project_id IN (?)", projectIDs).Delete(&models.ProjectInvitation{}).Error; err != nil {
			return err
		}
		// 7.6 软删除该组织下的所有项目
		if err := tx.Where("organization_id = ?", organization.ID).Delete(&models.Project{}).Error; err != nil {
			return err
		}
		// 7.7 软删除该组织的所有成员
		if err := tx.Where("organization_id = ?", organization.ID).Delete(&models.OrganizationMember{}).Error; err != nil {
			return err
		}
		// 7.8 软删除该组织的所有邀请
		if err := tx.Where("organization_id = ?", organization.ID).Delete(&models.OrganizationInvitation{}).Error; err != nil {
			return err
		}
		// 7.9 软删除组织
		if err := tx.Delete(&organization).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationUpdateFailed, "删除组织失败: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
	data := gin.H{
		"message": "组织删除成功",
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}

// InviteOrganizationMemberRequest 邀请组织成员请求结构
type InviteOrganizationMemberRequest struct {
	Role      string `json:"role,omitempty"`       // 邀请的角色（可选，默认为member）
	ExpiresIn int    `json:"expires_in,omitempty"` // 过期时间（小时，可选，0表示永不过期）
	MaxUses   int    `json:"max_uses,omitempty"`   // 最大使用次数（可选，默认1）
}

// InviteOrganizationMemberResponse 邀请组织成员响应结构
type InviteOrganizationMemberResponse struct {
	InviteCode string `json:"invite_code"`          // 邀请码
	InviteLink string `json:"invite_link"`          // 邀请链接
	Role       string `json:"role"`                 // 角色
	MaxUses    int    `json:"max_uses"`             // 最大使用次数
	UsedCount  int    `json:"used_count"`           // 已使用次数
	ExpiresAt  string `json:"expires_at,omitempty"` // 过期时间
	CreatedAt  string `json:"created_at"`           // 创建时间
}

// InviteOrganizationMember 邀请组织成员（生成邀请码）
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以邀请成员
// - member：无权限邀请成员
// 流程：
// 1. 从请求获取用户ID
// 2. 查询组织
// 3. 验证用户权限（owner/admin）
// 4. 生成邀请码
// 5. 创建邀请记录（支持设置最大使用次数，默认1）
// 6. 返回邀请码和邀请链接
func InviteOrganizationMember(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req InviteOrganizationMemberRequest
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

	// 5. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否是组织成员
	var member models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 验证权限：只有owner和admin可以邀请成员
	if member.Role != models.OrganizationRoleOwner && member.Role != models.OrganizationRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNoPermission, "您没有权限邀请组织成员，只有组织所有者和管理员可以邀请", nil))
		return
	}

	// 8. 设置默认角色
	role := req.Role
	if role == "" {
		role = models.OrganizationRoleMember
	}

	// 9. 验证角色是否有效
	if !models.IsValidOrganizationRole(role) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的组织角色", nil))
		return
	}

	// 10. 生成邀请码（使用UUID）
	inviteCode := generateInviteCode()

	// 11. 设置过期时间
	var expiresAt *time.Time
	if req.ExpiresIn > 0 {
		exp := time.Now().Add(time.Duration(req.ExpiresIn) * time.Hour)
		expiresAt = &exp
	}

	// 12. 设置最大使用次数（默认1）
	maxUses := req.MaxUses
	if maxUses <= 0 {
		maxUses = 1
	}

	// 13. 创建邀请记录
	invitation := models.OrganizationInvitation{
		OrganizationID: organization.ID,
		InviteCode:     inviteCode,
		Role:           role,
		InviterID:      userID,
		ExpiresAt:      expiresAt,
		MaxUses:        maxUses,
		UsedCount:      0,
	}

	if err := db.Create(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationCreateFailed, "创建邀请失败: "+err.Error(), nil))
		return
	}

	// 14. 构建响应
	inviteResp := InviteOrganizationMemberResponse{
		InviteCode: inviteCode,
		InviteLink: buildInviteLink(inviteCode),
		Role:       role,
		MaxUses:    invitation.MaxUses,
		UsedCount:  invitation.UsedCount,
		CreatedAt:  invitation.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if expiresAt != nil {
		inviteResp.ExpiresAt = expiresAt.Format("2006-01-02T15:04:05Z07:00")
	}

	// 15. 返回成功响应
	c.JSON(http.StatusCreated, response.NewSuccessResponse(inviteResp))
}

// JoinOrganizationRequest 加入组织请求结构
type JoinOrganizationRequest struct {
	InviteCode string `json:"invite_code" binding:"required"` // 邀请码（必填）
}

var (
	errOrganizationInviteInvalid = errors.New("organization invite invalid")
	errOrganizationInviteExpired = errors.New("organization invite expired")
	errOrganizationInviteUsed    = errors.New("organization invite used")
	errOrganizationAlreadyMember = errors.New("organization already member")
	errOrganizationNotFound      = errors.New("organization not found")
)

// JoinOrganizationResponse 加入组织响应结构
type JoinOrganizationResponse struct {
	ID               uint   `json:"id"`                // 成员关系ID
	OrganizationID   uint   `json:"organization_id"`   // 组织ID
	UserID           uint   `json:"user_id"`           // 用户ID
	Role             string `json:"role"`              // 角色
	OrganizationName string `json:"organization_name"` // 组织名称
	CreatedAt        string `json:"created_at"`        // 加入时间
}

// JoinOrganization 加入组织（使用邀请码）
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 解析邀请码
// 3. 查询邀请记录
// 4. 验证邀请是否有效（未过期、未达到最大使用次数）
// 5. 检查用户是否已经是组织成员
// 6. 创建组织成员关系
// 7. 增加邀请使用计数
// 8. 返回加入成功信息
func JoinOrganization(c *gin.Context) {
	// 1. 解析请求体
	var req JoinOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
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

	// 4. 在事务中校验邀请码并创建组织成员（并发安全）
	var (
		newMember    models.OrganizationMember
		organization models.Organization
	)
	err := db.Transaction(func(tx *gorm.DB) error {
		// 4.1 锁定邀请码记录，防止并发超用
		var invitation models.OrganizationInvitation
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("invite_code = ?", req.InviteCode).
			First(&invitation).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return errOrganizationInviteInvalid
			}
			return err
		}

		// 4.2 校验邀请码状态
		if invitation.IsExpired() {
			return errOrganizationInviteExpired
		}
		if invitation.IsUsed() {
			return errOrganizationInviteUsed
		}

		// 4.3 查询组织
		if err := tx.First(&organization, invitation.OrganizationID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return errOrganizationNotFound
			}
			return err
		}

		// 4.4 创建组织成员（并发下唯一约束兜底）
		newMember = models.OrganizationMember{
			OrganizationID: organization.ID,
			UserID:         userID,
			Role:           invitation.Role,
		}
		if err := tx.Create(&newMember).Error; err != nil {
			if isUniqueViolation(err, "uniq_org_user") {
				return errOrganizationAlreadyMember
			}
			return err
		}

		// 4.5 增加邀请码使用计数（条件更新避免并发超用）
		now := time.Now()
		updateResult := tx.Model(&models.OrganizationInvitation{}).
			Where("id = ? AND used_count < max_uses", invitation.ID).
			Updates(map[string]interface{}{
				"used_count": gorm.Expr("used_count + 1"),
				"used_at":    gorm.Expr("COALESCE(used_at, ?)", now),
			})
		if updateResult.Error != nil {
			return updateResult.Error
		}
		if updateResult.RowsAffected == 0 {
			return errOrganizationInviteUsed
		}

		// 4.6 将该用户在该组织下所有项目中的项目成员记录的 IsExternal 改为 false（若存在）
		subQuery := tx.Model(&models.Project{}).Select("id").Where("organization_id = ?", organization.ID)
		if err := tx.Model(&models.ProjectMember{}).Where("user_id = ? AND project_id IN (?)", userID, subQuery).Update("is_external", false).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		switch {
		case errors.Is(err, errOrganizationInviteInvalid):
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationInviteInvalid, "邀请码无效", nil))
		case errors.Is(err, errOrganizationInviteExpired):
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationInviteExpired, "该邀请码已过期", nil))
		case errors.Is(err, errOrganizationInviteUsed):
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationInviteUsed, "该邀请码已达到最大使用次数", nil))
		case errors.Is(err, errOrganizationAlreadyMember):
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationAlreadyMember, "您已经是该组织的成员", nil))
		case errors.Is(err, errOrganizationNotFound):
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
		default:
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationCreateFailed, "加入组织失败: "+err.Error(), nil))
		}
		return
	}

	// 10. 返回成功响应
	resp := JoinOrganizationResponse{
		ID:               newMember.ID,
		OrganizationID:   newMember.OrganizationID,
		UserID:           newMember.UserID,
		Role:             newMember.Role,
		OrganizationName: organization.Name,
		CreatedAt:        newMember.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// DeleteOrganizationMemberRequest 删除组织成员请求结构
type DeleteOrganizationMemberRequest struct {
	TargetUserID uint `json:"target_user_id" binding:"required"` // 要删除的用户ID（必填）
}

// DeleteOrganizationMember 删除组织成员
// 认证级别: user (需要JWT认证)
// 权限规则：
// - 可以删除自己（不需要额外权限）
// - owner/admin：可以删除其他成员
// - 如果所有者删除自己，需要转移所有权：
//  1. 优先选择第一个管理员改为所有者
//  2. 如果没有管理员，选择第一个成员改为所有者
//  3. 如果组织只有所有者一个人，删除失败
//
// 流程：
// 1. 判断组织ID
// 2. 验证组织成员身份
// 3. 验证删除的目标ID是不是自己
//   - 如果是自己，直接继续
//   - 如果不是自己，需要验证当前用户是否是管理员或所有者
//
// 4. 查询目标成员
// 5. 执行权限交接流程（如果删除的是所有者）
// 6. 删除组织成员
func DeleteOrganizationMember(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req DeleteOrganizationMemberRequest
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

	// 4. 获取当前用户ID
	currentUserID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 6. 验证当前用户是否是组织成员
	var currentMember models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, currentUserID).First(&currentMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 判断是否删除自己
	var targetMember models.OrganizationMember
	isDeletingSelf := req.TargetUserID == currentUserID

	if isDeletingSelf {
		// 删除自己，直接使用已查询的currentMember，允许继续执行
		targetMember = currentMember
	} else {
		// 删除他人，需要先验证权限：只有owner和admin可以删除其他成员
		if currentMember.Role != models.OrganizationRoleOwner && currentMember.Role != models.OrganizationRoleAdmin {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNoPermission, "您没有权限删除组织成员，只有组织所有者和管理员可以删除", nil))
			return
		}

		// 查询目标成员
		if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, req.TargetUserID).First(&targetMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotMember, "该用户不是组织成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织成员失败: "+err.Error(), nil))
			return
		}
	}

	// 8. 如果删除的是所有者，需要转移所有权
	if targetMember.Role == models.OrganizationRoleOwner {
		// 在事务中处理所有权转移和删除
		err := db.Transaction(func(tx *gorm.DB) error {
			// 查询所有组织成员（排除要删除的所有者）
			var allMembers []models.OrganizationMember
			if err := tx.Where("organization_id = ? AND user_id != ?", organization.ID, req.TargetUserID).Find(&allMembers).Error; err != nil {
				return err
			}

			// 如果组织只有所有者一个人，删除失败
			if len(allMembers) == 0 {
				return gorm.ErrRecordNotFound
			}

			// 查找第一个管理员
			var newOwner *models.OrganizationMember
			for i := range allMembers {
				if allMembers[i].Role == models.OrganizationRoleAdmin {
					newOwner = &allMembers[i]
					break
				}
			}

			// 如果没有管理员，选择第一个成员
			if newOwner == nil {
				newOwner = &allMembers[0]
			}

			// 将新所有者改为owner
			if err := tx.Model(newOwner).Update("role", models.OrganizationRoleOwner).Error; err != nil {
				return err
			}

			// 删除原所有者
			if err := tx.Delete(&targetMember).Error; err != nil {
				return err
			}

			// 将该用户在该组织下所有项目中的项目成员改为外部成员
			subQuery := tx.Model(&models.Project{}).Select("id").Where("organization_id = ?", organization.ID)
			if err := tx.Model(&models.ProjectMember{}).Where("user_id = ? AND project_id IN (?)", targetMember.UserID, subQuery).Update("is_external", true).Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationNoPermission, "无法删除组织所有者，组织至少需要保留一个成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationUpdateFailed, "删除组织成员失败: "+err.Error(), nil))
			return
		}
	} else {
		// 9. 删除非所有者成员，并将该用户在该组织下所有项目中的项目成员改为外部成员
		err := db.Transaction(func(tx *gorm.DB) error {
			subQuery := tx.Model(&models.Project{}).Select("id").Where("organization_id = ?", organization.ID)
			if err := tx.Model(&models.ProjectMember{}).Where("user_id = ? AND project_id IN (?)", targetMember.UserID, subQuery).Update("is_external", true).Error; err != nil {
				return err
			}
			if err := tx.Delete(&targetMember).Error; err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationUpdateFailed, "删除组织成员失败: "+err.Error(), nil))
			return
		}
	}

	// 10. 返回成功响应
	data := gin.H{
		"message": "组织成员删除成功",
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}

// UpdateOrganizationMemberRoleRequest 更新组织成员角色请求结构
type UpdateOrganizationMemberRoleRequest struct {
	TargetUserID uint   `json:"target_user_id" binding:"required"` // 要更新的用户ID（必填）
	Role         string `json:"role" binding:"required"`           // 目标角色：admin/member
}

// UpdateOrganizationMemberRoleResponse 更新组织成员角色响应结构
type UpdateOrganizationMemberRoleResponse struct {
	ID        uint   `json:"id"`         // 成员关系ID
	UserID    uint   `json:"user_id"`    // 用户ID
	Role      string `json:"role"`       // 角色
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// UpdateOrganizationMemberRole 更新组织成员角色
// 认证级别: user (需要JWT认证)
// 权限规则：只有组织所有者可以修改成员角色（admin/member）
// 流程：
// 1. 从请求获取当前用户ID
// 2. 查询组织
// 3. 验证当前用户是组织所有者
// 4. 查询目标成员（使用target_user_id）
// 5. 校验目标角色（admin/member），且目标成员不能是owner
// 6. 更新角色并返回成员信息
func UpdateOrganizationMemberRole(c *gin.Context) {
	// 1. 获取组织ID
	organizationID := c.Param("id")
	if organizationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationIDEmpty, "组织ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateOrganizationMemberRoleRequest
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

	// 4. 获取当前用户ID
	currentUserID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询组织
	var organization models.Organization
	if err := db.First(&organization, organizationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotFound, "组织不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织失败: "+err.Error(), nil))
		return
	}

	// 6. 验证当前用户是否是组织所有者
	var currentMember models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, currentUserID).First(&currentMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNotMember, "您不是该组织的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "验证组织成员身份失败: "+err.Error(), nil))
		return
	}
	if currentMember.Role != models.OrganizationRoleOwner {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeOrganizationNoPermission, "只有组织所有者可以设置成员权限", nil))
		return
	}

	// 7. 校验目标角色（仅支持admin/member）
	if req.Role != models.OrganizationRoleAdmin && req.Role != models.OrganizationRoleMember {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的角色，仅支持 admin 或 member", nil))
		return
	}

	// 8. 查询目标成员
	var targetMember models.OrganizationMember
	if err := db.Where("organization_id = ? AND user_id = ?", organization.ID, req.TargetUserID).Preload("User").First(&targetMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeOrganizationNotMember, "目标用户不是组织成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询组织成员失败: "+err.Error(), nil))
		return
	}

	// 9. 目标成员不能是owner
	if targetMember.Role == models.OrganizationRoleOwner {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeOrganizationNoPermission, "不能修改组织所有者的角色", nil))
		return
	}

	// 10. 更新角色
	if err := db.Model(&targetMember).Update("role", req.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationUpdateFailed, "更新成员角色失败: "+err.Error(), nil))
		return
	}

	// 11. 重新查询获取更新时间与用户信息
	if err := db.Preload("User").First(&targetMember, targetMember.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeOrganizationQueryFailed, "查询成员信息失败: "+err.Error(), nil))
		return
	}

	// 12. 返回成功响应
	resp := UpdateOrganizationMemberRoleResponse{
		ID:        targetMember.ID,
		UserID:    targetMember.UserID,
		Role:      targetMember.Role,
		Username:  targetMember.User.Username,
		Avatar:    targetMember.User.Avatar,
		UpdatedAt: targetMember.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}
