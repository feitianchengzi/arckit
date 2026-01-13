package handler

import (
	"net/http"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateUserRequest 创建用户请求结构
type CreateUserRequest struct {
	Username string `json:"username,omitempty"` // 用户名（可选，优先使用Header中的值）
	Avatar   string `json:"avatar,omitempty"`   // 头像地址（可选）
}

// CreateUserResponse 创建用户响应结构
type CreateUserResponse struct {
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// CreateUser 根据网关UUID创建用户
// 网关路由: POST /todo-service/v1/user/users
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从网关Header获取用户UUID（X-User-ID）
// 2. 检查用户是否已存在（根据UUID）
// 3. 如果不存在，使用网关提供的UUID创建新用户
// 4. 如果已存在，返回现有用户信息
func CreateUser(c *gin.Context) {
	// 1. 获取Header信息
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "未获取到用户信息，请确保已通过网关认证", nil))
		return
	}

	// 2. 解析请求体（必填，至少提供一个字段）
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 检查是否至少提供了一个字段
	if req.Username == "" && req.Avatar == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeUserMissingFields, "至少需要提供一个字段（username或avatar）", nil))
		return
	}

	// 4. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 5. 使用网关提供的UUID查询用户
	userUUID := headerInfo.UserID
	var user models.User
	err := db.Where("uuid = ?", userUUID).First(&user).Error

	if err == nil {
		// 用户已存在，返回现有用户信息
		resp := CreateUserResponse{
			Username:  user.Username,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
		return
	}

	if err != gorm.ErrRecordNotFound {
		// 查询出错
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserQueryFailed, "查询用户失败: "+err.Error(), nil))
		return
	}

	// 6. 用户不存在，创建新用户
	// 使用请求体中的字段，如果某个字段为空字符串，则不设置（使用默认值）
	username := req.Username
	if username == "" {
		// 如果请求体中username为空，使用Header中的用户名
		username = headerInfo.Username
	}

	user = models.User{
		UUID:     userUUID, // 使用网关提供的UUID
		Username: username,
		Avatar:   req.Avatar,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserCreateFailed, "创建用户失败: "+err.Error(), nil))
		return
	}

	// 6. 返回成功响应
	resp := CreateUserResponse{
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// GetUserResponse 查询用户响应结构
type GetUserResponse struct {
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// GetUser 根据UUID查询用户
// 网关路由: GET /todo-service/v1/user/users
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从Header信息获取用户UUID
// 2. 查询用户信息
// 3. 返回用户信息
func GetUser(c *gin.Context) {
	// 1. 获取Header信息
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "未获取到用户信息，请确保已通过网关认证", nil))
		return
	}

	// 2. 从Header信息获取用户UUID
	userUUID := headerInfo.UserID

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 4. 查询用户
	var user models.User
	if err := db.Where("uuid = ?", userUUID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeUserNotFound, "用户不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserQueryFailed, "查询用户失败: "+err.Error(), nil))
		return
	}

	// 5. 返回成功响应
	resp := GetUserResponse{
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// UpdateUserRequest 更新用户请求结构
type UpdateUserRequest struct {
	Username *string `json:"username,omitempty"` // 用户名（可选）
	Avatar   *string `json:"avatar,omitempty"`   // 头像地址（可选）
}

// UpdateUserResponse 更新用户响应结构
type UpdateUserResponse struct {
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// UpdateUser 更新用户信息
// 网关路由: PUT /todo-service/v1/user/users
// 认证级别: user (需要JWT认证)
// 权限规则：用户只能更新自己的信息（使用Header中的UUID）
// 流程：
// 1. 从网关Header获取当前用户UUID
// 2. 更新用户信息
// 3. 返回更新后的用户信息
func UpdateUser(c *gin.Context) {
	// 1. 获取Header信息
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "未获取到用户信息，请确保已通过网关认证", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 检查是否至少提供了一个更新字段
	if req.Username == nil && req.Avatar == nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeUserMissingFields, "至少需要提供一个更新字段（username或avatar）", nil))
		return
	}

	// 4. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 5. 查询用户（使用Header中的UUID）
	var user models.User
	if err := db.Where("uuid = ?", headerInfo.UserID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeUserNotFound, "用户不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserQueryFailed, "查询用户失败: "+err.Error(), nil))
		return
	}

	// 6. 构建更新字段
	updates := make(map[string]interface{})
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Avatar != nil {
		updates["avatar"] = *req.Avatar
	}

	// 7. 更新用户信息
	if err := db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserUpdateFailed, "更新用户失败: "+err.Error(), nil))
		return
	}

	// 8. 重新查询用户以获取最新数据
	if err := db.First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserQueryFailed, "查询更新后的用户信息失败: "+err.Error(), nil))
		return
	}

	// 9. 返回成功响应
	resp := UpdateUserResponse{
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}
