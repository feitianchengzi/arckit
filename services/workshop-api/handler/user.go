package handler

import (
	"net/http"

	"todo/middleware"
	"todo/models"

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
	ID        uint   `json:"id"`         // 用户ID
	UUID      string `json:"uuid"`       // 用户UUID
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
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 解析请求体（可选）
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 请求体解析失败不影响，使用Header中的信息
		req = CreateUserRequest{}
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "数据库连接未初始化",
		})
		return
	}

	// 4. 使用网关提供的UUID查询用户
	userUUID := headerInfo.UserID
	var user models.User
	err := db.Where("uuid = ?", userUUID).First(&user).Error

	if err == nil {
		// 用户已存在，返回现有用户信息
		c.JSON(http.StatusOK, CreateUserResponse{
			ID:        user.ID,
			UUID:      user.UUID,
			Username:  user.Username,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
		return
	}

	if err != gorm.ErrRecordNotFound {
		// 查询出错
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询用户失败: " + err.Error(),
		})
		return
	}

	// 5. 用户不存在，创建新用户
	// 优先使用请求体中的用户名，否则使用Header中的用户名
	username := req.Username
	if username == "" {
		username = headerInfo.Username
	}

	user = models.User{
		UUID:     userUUID, // 使用网关提供的UUID
		Username: username,
		Avatar:   req.Avatar,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建用户失败: " + err.Error(),
		})
		return
	}

	// 6. 返回成功响应
	c.JSON(http.StatusCreated, CreateUserResponse{
		ID:        user.ID,
		UUID:      user.UUID,
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// GetUserResponse 查询用户响应结构
type GetUserResponse struct {
	ID        uint   `json:"id"`         // 用户ID
	UUID      string `json:"uuid"`       // 用户UUID
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// GetUser 根据UUID查询用户
// 网关路由: GET /todo-service/v1/user/users/:uuid
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从路径参数获取用户UUID
// 2. 查询用户信息
// 3. 返回用户信息
func GetUser(c *gin.Context) {
	// 1. 获取Header信息（可选，用于验证认证）
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 从路径参数获取UUID
	uuid := c.Param("uuid")
	if uuid == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "用户UUID不能为空",
		})
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "数据库连接未初始化",
		})
		return
	}

	// 4. 查询用户
	var user models.User
	if err := db.Where("uuid = ?", uuid).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "用户不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询用户失败: " + err.Error(),
		})
		return
	}

	// 5. 返回成功响应
	c.JSON(http.StatusOK, GetUserResponse{
		ID:        user.ID,
		UUID:      user.UUID,
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// UpdateUserRequest 更新用户请求结构
type UpdateUserRequest struct {
	Username *string `json:"username,omitempty"` // 用户名（可选）
	Avatar   *string `json:"avatar,omitempty"`   // 头像地址（可选）
}

// UpdateUserResponse 更新用户响应结构
type UpdateUserResponse struct {
	ID        uint   `json:"id"`         // 用户ID
	UUID      string `json:"uuid"`       // 用户UUID
	Username  string `json:"username"`   // 用户名
	Avatar    string `json:"avatar"`     // 头像地址
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// UpdateUser 更新用户信息
// 网关路由: PUT /todo-service/v1/user/users/:uuid
// 认证级别: user (需要JWT认证)
// 权限规则：用户只能更新自己的信息（Header中的UUID必须与路径参数中的UUID一致）
// 流程：
// 1. 从网关Header获取当前用户UUID
// 2. 从路径参数获取要更新的用户UUID
// 3. 验证权限（只能更新自己的信息）
// 4. 更新用户信息
// 5. 返回更新后的用户信息
func UpdateUser(c *gin.Context) {
	// 1. 获取Header信息
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 从路径参数获取UUID
	uuid := c.Param("uuid")
	if uuid == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "用户UUID不能为空",
		})
		return
	}

	// 3. 验证权限：只能更新自己的信息
	if headerInfo.UserID != uuid {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "您只能更新自己的信息",
		})
		return
	}

	// 4. 解析请求体
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	// 5. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "数据库连接未初始化",
		})
		return
	}

	// 6. 查询用户
	var user models.User
	if err := db.Where("uuid = ?", uuid).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "用户不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询用户失败: " + err.Error(),
		})
		return
	}

	// 7. 构建更新字段
	updates := make(map[string]interface{})
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Avatar != nil {
		updates["avatar"] = *req.Avatar
	}

	// 8. 如果没有要更新的字段，直接返回当前用户信息
	if len(updates) == 0 {
		c.JSON(http.StatusOK, UpdateUserResponse{
			ID:        user.ID,
			UUID:      user.UUID,
			Username:  user.Username,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
		return
	}

	// 9. 更新用户信息
	if err := db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "更新用户失败: " + err.Error(),
		})
		return
	}

	// 10. 重新查询用户以获取最新数据
	if err := db.First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询更新后的用户信息失败: " + err.Error(),
		})
		return
	}

	// 11. 返回成功响应
	c.JSON(http.StatusOK, UpdateUserResponse{
		ID:        user.ID,
		UUID:      user.UUID,
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}
