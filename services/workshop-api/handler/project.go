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
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateProjectRequest 创建项目请求结构
type CreateProjectRequest struct {
	Name   string `json:"name" binding:"required"`    // 项目名称（必填）
	GitURL string `json:"git_url" binding:"required"` // Git地址（必填）
}

// ProjectMemberResponse 项目成员响应结构
type ProjectMemberResponse struct {
	ID        uint   `json:"id"`         // 成员关系ID
	UserID    uint   `json:"user_id"`    // 用户ID
	Role      string `json:"role"`       // 角色
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 加入时间
	IsMe      bool   `json:"is_me"`      // 是否是当前用户自己
}

// CreateProjectResponse 创建项目响应结构
type CreateProjectResponse struct {
	ID        uint                    `json:"id"`         // 项目ID
	Name      string                  `json:"name"`       // 项目名称
	GitURL    string                  `json:"git_url"`    // Git地址
	CreatorID uint                    `json:"creator_id"` // 创建者ID
	Members   []ProjectMemberResponse `json:"members"`    // 项目成员列表
}

// CreateProject 创建新项目
// 网关路由: POST /todo-service/v1/user/projects
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 事务操作：创建项目并将创建者加入项目成员（role=owner）
func CreateProject(c *gin.Context) {
	// 1. 解析请求体
	var req CreateProjectRequest
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

	// 4. 在事务中创建项目和项目成员
	var project models.Project
	err := db.Transaction(func(tx *gorm.DB) error {
		// 创建项目
		project = models.Project{
			Name:      req.Name,
			GitURL:    req.GitURL,
			CreatorID: userID,
		}
		if err := tx.Create(&project).Error; err != nil {
			return err
		}

		// 将创建者加入项目成员（role=owner）
		member := models.ProjectMember{
			ProjectID: project.ID,
			UserID:    userID,
			Role:      models.ProjectRoleOwner,
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectCreateFailed, "创建项目失败: "+err.Error(), nil))
		return
	}

	// 5. 查询项目成员（包含创建者）
	var members []models.ProjectMember
	if err := db.Where("project_id = ?", project.ID).Preload("User").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
		return
	}

	// 6. 转换为响应格式
	memberResponses := make([]ProjectMemberResponse, 0, len(members))
	for _, member := range members {
		memberResponses = append(memberResponses, ProjectMemberResponse{
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
	resp := CreateProjectResponse{
		ID:        project.ID,
		Name:      project.Name,
		GitURL:    project.GitURL,
		CreatorID: project.CreatorID,
		Members:   memberResponses,
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// ProjectResponse 项目响应结构（用于查询接口）
type ProjectResponse struct {
	ID        uint                    `json:"id"`         // 项目ID
	Name      string                  `json:"name"`       // 项目名称
	GitURL    string                  `json:"git_url"`    // Git地址
	CreatorID uint                    `json:"creator_id"` // 创建者ID
	CreatedAt string                  `json:"created_at"` // 创建时间
	UpdatedAt string                  `json:"updated_at"` // 更新时间
	Members   []ProjectMemberResponse `json:"members"`    // 项目成员列表
}

// GetUserProjectsResponse 查询用户项目响应结构
type GetUserProjectsResponse struct {
	Projects []ProjectResponse `json:"projects"` // 项目列表
	Total    int64             `json:"total"`    // 项目总数
}

// GetUserProjects 根据用户ID查询所有参与的项目
// 网关路由: GET /todo-service/v1/user/projects
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从Header UUID获取用户ID（通过中间件ExtractUserID）
// 2. 查询该用户参与的所有项目（通过project_members表）
// 3. 为每个项目查询并包含项目成员信息
func GetUserProjects(c *gin.Context) {
	// 1. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 2. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 3. 查询用户参与的所有项目（通过project_members表）
	var projectMembers []models.ProjectMember
	if err := db.Where("user_id = ?", userID).Preload("Project").Find(&projectMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员关系失败: "+err.Error(), nil))
		return
	}

	// 4. 提取项目ID列表
	projectIDs := make([]uint, 0, len(projectMembers))
	projectMap := make(map[uint]models.Project)
	for _, pm := range projectMembers {
		projectIDs = append(projectIDs, pm.ProjectID)
		projectMap[pm.ProjectID] = pm.Project
	}

	// 5. 查询所有项目的成员信息
	var allMembers []models.ProjectMember
	if len(projectIDs) > 0 {
		if err := db.Where("project_id IN ?", projectIDs).Preload("User").Find(&allMembers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
			return
		}
	}

	// 6. 按项目ID分组成员
	membersByProject := make(map[uint][]models.ProjectMember)
	for _, member := range allMembers {
		membersByProject[member.ProjectID] = append(membersByProject[member.ProjectID], member)
	}

	// 7. 构建响应
	projectResponses := make([]ProjectResponse, 0, len(projectMap))
	for _, project := range projectMap {
		// 转换项目成员
		members := membersByProject[project.ID]
		memberResponses := make([]ProjectMemberResponse, 0, len(members))
		for _, member := range members {
			memberResponses = append(memberResponses, ProjectMemberResponse{
				ID:        member.ID,
				UserID:    member.UserID,
				Role:      member.Role,
				Username:  member.User.Username,
				Avatar:    member.User.Avatar,
				CreatedAt: member.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				IsMe:      member.UserID == userID,
			})
		}

		projectResponses = append(projectResponses, ProjectResponse{
			ID:        project.ID,
			Name:      project.Name,
			GitURL:    project.GitURL,
			CreatorID: project.CreatorID,
			CreatedAt: project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Members:   memberResponses,
		})
	}

	// 8. 返回成功响应
	resp := GetUserProjectsResponse{
		Projects: projectResponses,
		Total:    int64(len(projectResponses)),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// UpdateProjectRequest 更新项目请求结构
type UpdateProjectRequest struct {
	Name   *string `json:"name,omitempty"`    // 项目名称（可选）
	GitURL *string `json:"git_url,omitempty"` // Git地址（可选）
}

// UpdateProjectResponse 更新项目响应结构
type UpdateProjectResponse struct {
	ID        uint                    `json:"id"`         // 项目ID
	Name      string                  `json:"name"`       // 项目名称
	GitURL    string                  `json:"git_url"`    // Git地址
	CreatorID uint                    `json:"creator_id"` // 创建者ID
	CreatedAt string                  `json:"created_at"` // 创建时间
	UpdatedAt string                  `json:"updated_at"` // 更新时间
	Members   []ProjectMemberResponse `json:"members"`    // 项目成员列表
}

// UpdateProject 更新项目信息
// 网关路由: PUT /todo-service/v1/user/projects/:id
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以更新项目信息
// - member：无权限更新项目
// 流程：
// 1. 从请求获取用户ID
// 2. 查询项目
// 3. 验证用户权限（owner/admin）
// 4. 更新项目信息
// 5. 返回更新后的项目信息（包含成员列表）
func UpdateProject(c *gin.Context) {
	// 1. 获取项目ID
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectIDEmpty, "项目ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateProjectRequest
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

	// 5. 查询项目
	var project models.Project
	if err := db.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否是项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 验证权限：只有owner和admin可以更新项目
	if member.Role != models.ProjectRoleOwner && member.Role != models.ProjectRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "您没有权限更新此项目，只有项目所有者和管理员可以更新", nil))
		return
	}

	// 8. 构建更新字段
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.GitURL != nil {
		updates["git_url"] = *req.GitURL
	}

	// 9. 如果没有要更新的字段，直接返回当前项目信息
	if len(updates) == 0 {
		// 查询项目成员
		var members []models.ProjectMember
		if err := db.Where("project_id = ?", project.ID).Preload("User").Find(&members).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
			return
		}

		// 转换为响应格式
		memberResponses := make([]ProjectMemberResponse, 0, len(members))
		for _, m := range members {
			memberResponses = append(memberResponses, ProjectMemberResponse{
				ID:        m.ID,
				UserID:    m.UserID,
				Role:      m.Role,
				Username:  m.User.Username,
				Avatar:    m.User.Avatar,
				CreatedAt: m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				IsMe:      m.UserID == userID,
			})
		}

		resp := UpdateProjectResponse{
			ID:        project.ID,
			Name:      project.Name,
			GitURL:    project.GitURL,
			CreatorID: project.CreatorID,
			CreatedAt: project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Members:   memberResponses,
		}
		c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
		return
	}

	// 10. 更新项目信息
	if err := db.Model(&project).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectUpdateFailed, "更新项目失败: "+err.Error(), nil))
		return
	}

	// 11. 重新查询项目以获取最新数据
	if err := db.First(&project, project.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询更新后的项目信息失败: "+err.Error(), nil))
		return
	}

	// 12. 查询项目成员
	var members []models.ProjectMember
	if err := db.Where("project_id = ?", project.ID).Preload("User").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
		return
	}

	// 13. 转换为响应格式
	memberResponses := make([]ProjectMemberResponse, 0, len(members))
	for _, m := range members {
		memberResponses = append(memberResponses, ProjectMemberResponse{
			ID:        m.ID,
			UserID:    m.UserID,
			Role:      m.Role,
			Username:  m.User.Username,
			Avatar:    m.User.Avatar,
			CreatedAt: m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			IsMe:      m.UserID == userID,
		})
	}

	// 15. 返回成功响应
	resp := UpdateProjectResponse{
		ID:        project.ID,
		Name:      project.Name,
		GitURL:    project.GitURL,
		CreatorID: project.CreatorID,
		CreatedAt: project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Members:   memberResponses,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// InviteProjectMemberRequest 邀请项目成员请求结构
type InviteProjectMemberRequest struct {
	Role      string `json:"role,omitempty"`       // 邀请的角色（可选，默认为member）
	ExpiresIn int    `json:"expires_in,omitempty"` // 过期时间（小时，可选，0表示永不过期）
	MaxUses   int    `json:"max_uses,omitempty"`   // 最大使用次数（可选，默认1）
}

// InviteProjectMemberResponse 邀请项目成员响应结构
type InviteProjectMemberResponse struct {
	InviteCode string `json:"invite_code"`          // 邀请码
	InviteLink string `json:"invite_link"`          // 邀请链接
	Role       string `json:"role"`                 // 角色
	MaxUses    int    `json:"max_uses"`             // 最大使用次数
	UsedCount  int    `json:"used_count"`           // 已使用次数
	ExpiresAt  string `json:"expires_at,omitempty"` // 过期时间
	CreatedAt  string `json:"created_at"`           // 创建时间
}

// InviteProjectMember 邀请项目成员（生成邀请码）
// 网关路由: POST /todo-service/v1/user/projects/:id/invitations
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以邀请成员
// - member：无权限邀请成员
// 流程：
// 1. 从请求获取用户ID
// 2. 查询项目
// 3. 验证用户权限（owner/admin）
// 4. 生成邀请码
// 5. 创建邀请记录（支持设置最大使用次数，默认1）
// 6. 返回邀请码和邀请链接
func InviteProjectMember(c *gin.Context) {
	// 1. 获取项目ID
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectIDEmpty, "项目ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req InviteProjectMemberRequest
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

	// 5. 查询项目
	var project models.Project
	if err := db.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 6. 验证用户是否是项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 验证权限：只有owner和admin可以邀请成员
	if member.Role != models.ProjectRoleOwner && member.Role != models.ProjectRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "您没有权限邀请项目成员，只有项目所有者和管理员可以邀请", nil))
		return
	}

	// 8. 设置默认角色
	role := req.Role
	if role == "" {
		role = models.ProjectRoleMember
	}

	// 9. 验证角色是否有效
	if !models.IsValidProjectRole(role) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的项目角色", nil))
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
	invitation := models.ProjectInvitation{
		ProjectID:  project.ID,
		InviteCode: inviteCode,
		Role:       role,
		InviterID:  userID,
		ExpiresAt:  expiresAt,
		MaxUses:    maxUses,
		UsedCount:  0,
	}

	if err := db.Create(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectCreateFailed, "创建邀请失败: "+err.Error(), nil))
		return
	}

	// 14. 构建响应
	inviteResp := InviteProjectMemberResponse{
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

// JoinProjectRequest 加入项目请求结构
type JoinProjectRequest struct {
	InviteCode string `json:"invite_code" binding:"required"` // 邀请码（必填）
}

// JoinProjectResponse 加入项目响应结构
type JoinProjectResponse struct {
	ID          uint   `json:"id"`           // 成员关系ID
	ProjectID   uint   `json:"project_id"`   // 项目ID
	UserID      uint   `json:"user_id"`      // 用户ID
	Role        string `json:"role"`         // 角色
	ProjectName string `json:"project_name"` // 项目名称
	CreatedAt   string `json:"created_at"`   // 加入时间
}

// JoinProject 加入项目（使用邀请码）
// 网关路由: POST /todo-service/v1/user/projects/join
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 解析邀请码
// 3. 查询邀请记录
// 4. 验证邀请是否有效（未过期、未达到最大使用次数）
// 5. 检查用户是否已经是项目成员
// 6. 创建项目成员关系
// 7. 增加邀请使用计数
// 8. 返回加入成功信息
func JoinProject(c *gin.Context) {
	// 1. 解析请求体
	var req JoinProjectRequest
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

	// 4. 查询邀请记录
	var invitation models.ProjectInvitation
	if err := db.Where("invite_code = ?", req.InviteCode).First(&invitation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectInviteInvalid, "邀请码无效", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询邀请记录失败: "+err.Error(), nil))
		return
	}

	// 5. 验证邀请是否过期
	if invitation.IsExpired() {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectInviteExpired, "该邀请码已过期", nil))
		return
	}

	// 6. 验证邀请是否已达到最大使用次数
	if invitation.IsUsed() {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectInviteUsed, "该邀请码已达到最大使用次数", nil))
		return
	}

	// 7. 查询项目
	var project models.Project
	if err := db.First(&project, invitation.ProjectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 8. 检查用户是否已经是项目成员
	var existingMember models.ProjectMember
	err := db.Where("project_id = ? AND user_id = ?", project.ID, userID).First(&existingMember).Error
	if err == nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectAlreadyMember, "您已经是该项目的成员", nil))
		return
	}
	if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "检查项目成员失败: "+err.Error(), nil))
		return
	}

	// 9. 在事务中创建项目成员并增加邀请使用计数
	var newMember models.ProjectMember
	err = db.Transaction(func(tx *gorm.DB) error {
		// 创建项目成员
		newMember = models.ProjectMember{
			ProjectID: project.ID,
			UserID:    userID,
			Role:      invitation.Role,
		}
		if err := tx.Create(&newMember).Error; err != nil {
			return err
		}

		// 增加邀请使用计数
		invitation.UsedCount++
		// 如果是首次使用，记录首次使用时间（用于兼容）
		if invitation.UsedAt == nil {
			now := time.Now()
			invitation.UsedAt = &now
		}
		if err := tx.Save(&invitation).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectCreateFailed, "加入项目失败: "+err.Error(), nil))
		return
	}

	// 10. 返回成功响应
	resp := JoinProjectResponse{
		ID:          newMember.ID,
		ProjectID:   newMember.ProjectID,
		UserID:      newMember.UserID,
		Role:        newMember.Role,
		ProjectName: project.Name,
		CreatedAt:   newMember.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// generateInviteCode 生成邀请码
func generateInviteCode() string {
	// 使用UUID生成邀请码
	uuid := uuid.New().String()
	// 移除连字符，转换为大写
	return strings.ReplaceAll(strings.ToUpper(uuid), "-", "")
}

// buildInviteLink 构建邀请链接
func buildInviteLink(inviteCode string) string {
	// 这里可以根据实际的前端地址构建链接
	// 例如：https://your-frontend.com/join?code=INVITECODE
	return fmt.Sprintf("/join?code=%s", inviteCode)
}

// DeleteProject 删除项目
// 网关路由: DELETE /todo-service/v1/user/projects/:id
// 认证级别: user (需要JWT认证)
// 权限规则：只有项目所有者可以删除项目
// 流程：
// 1. 从请求获取用户ID
// 2. 查询项目
// 3. 验证用户是项目所有者
// 4. 删除项目（数据库会自动级联删除：项目成员、任务、邀请）
// 注意：依赖数据库外键约束的 ON DELETE CASCADE 实现级联删除
func DeleteProject(c *gin.Context) {
	// 1. 获取项目ID
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectIDEmpty, "项目ID不能为空", nil))
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

	// 4. 查询项目
	var project models.Project
	if err := db.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 5. 验证用户是否是项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 6. 验证权限：只有owner可以删除项目
	if member.Role != models.ProjectRoleOwner {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "只有项目所有者可以删除项目", nil))
		return
	}

	// 7. 删除项目（会级联删除项目成员和任务）
	if err := db.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectUpdateFailed, "删除项目失败: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
	data := gin.H{
		"message": "项目删除成功",
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}

// DeleteProjectMemberRequest 删除项目成员请求结构
type DeleteProjectMemberRequest struct {
	TargetUserID uint `json:"target_user_id" binding:"required"` // 要删除的用户ID（必填）
}

// UpdateProjectMemberRoleRequest 更新项目成员角色请求结构
type UpdateProjectMemberRoleRequest struct {
	TargetUserID uint   `json:"target_user_id" binding:"required"` // 要更新的用户ID（必填）
	Role         string `json:"role" binding:"required"`           // 目标角色：admin/member
}

// UpdateProjectMemberRoleResponse 更新项目成员角色响应结构
type UpdateProjectMemberRoleResponse struct {
	ID        uint   `json:"id"`         // 成员关系ID
	ProjectID uint   `json:"project_id"` // 项目ID
	UserID    uint   `json:"user_id"`    // 用户ID
	Role      string `json:"role"`       // 角色
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// DeleteProjectMember 删除项目成员
// 网关路由: DELETE /todo-service/v1/user/projects/:id/members
// 认证级别: user (需要JWT认证)
// 权限规则：
// - 可以删除自己（不需要额外权限）
// - owner/admin：可以删除其他成员
// - 如果所有者删除自己，需要转移所有权：
//  1. 优先选择第一个管理员改为所有者
//  2. 如果没有管理员，选择第一个成员改为所有者
//  3. 如果项目只有所有者一个人，删除失败
//
// 流程：
// 1. 判断项目ID
// 2. 验证项目成员身份
// 3. 验证删除的目标ID是不是自己
//   - 如果是自己，直接继续
//   - 如果不是自己，需要验证当前用户是否是管理员或所有者
//
// 4. 查询目标成员
// 5. 执行权限交接流程（如果删除的是所有者）
// 6. 删除项目成员
func DeleteProjectMember(c *gin.Context) {
	// 1. 获取项目ID
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectIDEmpty, "项目ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req DeleteProjectMemberRequest
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

	// 5. 查询项目
	var project models.Project
	if err := db.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 6. 验证当前用户是否是项目成员
	var currentMember models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, currentUserID).First(&currentMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 7. 判断是否删除自己
	var targetMember models.ProjectMember
	isDeletingSelf := req.TargetUserID == currentUserID

	if isDeletingSelf {
		// 删除自己，直接使用已查询的currentMember，允许继续执行
		targetMember = currentMember
	} else {
		// 删除他人，需要先验证权限：只有owner和admin可以删除其他成员
		if currentMember.Role != models.ProjectRoleOwner && currentMember.Role != models.ProjectRoleAdmin {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "您没有权限删除项目成员，只有项目所有者和管理员可以删除", nil))
			return
		}

		// 查询目标成员
		if err := db.Where("project_id = ? AND user_id = ?", project.ID, req.TargetUserID).First(&targetMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotMember, "该用户不是项目成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
			return
		}
	}

	// 8. 如果删除的是所有者，需要转移所有权
	if targetMember.Role == models.ProjectRoleOwner {
		// 在事务中处理所有权转移和删除
		err := db.Transaction(func(tx *gorm.DB) error {
			// 查询所有项目成员（排除要删除的所有者）
			var allMembers []models.ProjectMember
			if err := tx.Where("project_id = ? AND user_id != ?", project.ID, req.TargetUserID).Find(&allMembers).Error; err != nil {
				return err
			}

			// 如果项目只有所有者一个人，删除失败
			if len(allMembers) == 0 {
				return gorm.ErrRecordNotFound
			}

			// 查找第一个管理员
			var newOwner *models.ProjectMember
			for i := range allMembers {
				if allMembers[i].Role == models.ProjectRoleAdmin {
					newOwner = &allMembers[i]
					break
				}
			}

			// 如果没有管理员，选择第一个成员
			if newOwner == nil {
				newOwner = &allMembers[0]
			}

			// 将新所有者改为owner
			if err := tx.Model(newOwner).Update("role", models.ProjectRoleOwner).Error; err != nil {
				return err
			}

			// 删除原所有者
			if err := tx.Delete(&targetMember).Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectNoPermission, "无法删除项目所有者，项目至少需要保留一个成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectUpdateFailed, "删除项目成员失败: "+err.Error(), nil))
			return
		}
	} else {
		// 9. 删除非所有者成员
		if err := db.Delete(&targetMember).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectUpdateFailed, "删除项目成员失败: "+err.Error(), nil))
			return
		}
	}

	// 10. 返回成功响应
	data := gin.H{
		"message": "项目成员删除成功",
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}

// UpdateProjectMemberRole 更新项目成员角色
// 网关路由: PUT /todo-service/v1/user/projects/:id/members/role
// 认证级别: user (需要JWT认证)
// 权限规则：只有项目所有者可以修改成员角色（admin/member）
// 流程：
// 1. 从请求获取当前用户ID
// 2. 查询项目
// 3. 验证当前用户是项目所有者
// 4. 查询目标成员（使用target_user_id）
// 5. 校验目标角色（admin/member），且目标成员不能是owner
// 6. 更新角色并返回成员信息
func UpdateProjectMemberRole(c *gin.Context) {
	// 1. 获取项目ID
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectIDEmpty, "项目ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateProjectMemberRoleRequest
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

	// 5. 查询项目
	var project models.Project
	if err := db.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotFound, "项目不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目失败: "+err.Error(), nil))
		return
	}

	// 6. 验证当前用户是否是项目所有者
	var currentMember models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, currentUserID).First(&currentMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}
	if currentMember.Role != models.ProjectRoleOwner {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNoPermission, "只有项目所有者可以设置成员权限", nil))
		return
	}

	// 7. 校验目标角色（仅支持admin/member）
	if req.Role != models.ProjectRoleAdmin && req.Role != models.ProjectRoleMember {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的角色，仅支持 admin 或 member", nil))
		return
	}

	// 8. 查询目标成员
	var targetMember models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", project.ID, req.TargetUserID).Preload("User").First(&targetMember).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeProjectNotMember, "目标用户不是项目成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询项目成员失败: "+err.Error(), nil))
		return
	}

	// 9. 目标成员不能是owner
	if targetMember.Role == models.ProjectRoleOwner {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeProjectNoPermission, "不能修改项目所有者的角色", nil))
		return
	}

	// 10. 更新角色
	if err := db.Model(&targetMember).Update("role", req.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectUpdateFailed, "更新成员角色失败: "+err.Error(), nil))
		return
	}

	// 11. 重新查询获取更新时间与用户信息
	if err := db.Preload("User").First(&targetMember, targetMember.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "查询成员信息失败: "+err.Error(), nil))
		return
	}

	// 12. 返回成功响应
	resp := UpdateProjectMemberRoleResponse{
		ID:        targetMember.ID,
		ProjectID: targetMember.ProjectID,
		UserID:    targetMember.UserID,
		Role:      targetMember.Role,
		Username:  targetMember.User.Username,
		Avatar:    targetMember.User.Avatar,
		UpdatedAt: targetMember.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}
