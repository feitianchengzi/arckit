package handler

import (
	"net/http"

	"todo/middleware"
	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// User错误消息ID定义 - 用户服务特定的错误消息
const (
	UserErrMissingFields       = 1 // 至少需要提供一个字段（username或avatar）
	UserErrQueryUserFailed     = 2 // 查询用户失败
	UserErrCreateUserFailed    = 3 // 创建用户失败
	UserErrUserNotFound        = 4 // 用户不存在
	UserErrMissingUpdateFields = 5 // 至少需要提供一个更新字段（username或avatar）
	UserErrUpdateUserFailed    = 6 // 更新用户失败
	UserErrQueryUpdatedFailed  = 7 // 查询更新后的用户信息失败
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
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			HTTPStatus: http.StatusUnauthorized,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrUnauthorized,
			Message:    "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 解析请求体（必填，至少提供一个字段）
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "请求参数错误: " + err.Error(),
		})
		return
	}

	// 3. 检查是否至少提供了一个字段
	if req.Username == "" && req.Avatar == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrMissingFields,
			Message:    "至少需要提供一个字段（username或avatar）",
		})
		return
	}

	// 4. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 5. 使用网关提供的UUID查询用户
	userUUID := headerInfo.UserID
	var user models.User
	err := db.Where("uuid = ?", userUUID).First(&user).Error

	if err == nil {
		// 用户已存在，返回现有用户信息
		c.JSON(http.StatusOK, CreateUserResponse{
			Username:  user.Username,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
		return
	}

	if err != gorm.ErrRecordNotFound {
		// 查询出错
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrQueryUserFailed,
			Message:    "查询用户失败: " + err.Error(),
		})
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
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrCreateUserFailed,
			Message:    "创建用户失败: " + err.Error(),
		})
		return
	}

	// 6. 返回成功响应
	c.JSON(http.StatusCreated, CreateUserResponse{
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
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
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			HTTPStatus: http.StatusUnauthorized,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrUnauthorized,
			Message:    "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 从Header信息获取用户UUID
	userUUID := headerInfo.UserID

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 4. 查询用户
	var user models.User
	if err := db.Where("uuid = ?", userUUID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				HTTPStatus: http.StatusNotFound,
				HandlerID:  models.UserHandlerID,
				MessageID:  UserErrUserNotFound,
				Message:    "用户不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrQueryUserFailed,
			Message:    "查询用户失败: " + err.Error(),
		})
		return
	}

	// 5. 返回成功响应
	c.JSON(http.StatusOK, GetUserResponse{
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
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			HTTPStatus: http.StatusUnauthorized,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrUnauthorized,
			Message:    "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 解析请求体
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "请求参数错误: " + err.Error(),
		})
		return
	}

	// 3. 检查是否至少提供了一个更新字段
	if req.Username == nil && req.Avatar == nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrMissingUpdateFields,
			Message:    "至少需要提供一个更新字段（username或avatar）",
		})
		return
	}

	// 4. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 5. 查询用户（使用Header中的UUID）
	var user models.User
	if err := db.Where("uuid = ?", headerInfo.UserID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				HTTPStatus: http.StatusNotFound,
				HandlerID:  models.UserHandlerID,
				MessageID:  UserErrUserNotFound,
				Message:    "用户不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrQueryUserFailed,
			Message:    "查询用户失败: " + err.Error(),
		})
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
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrUpdateUserFailed,
			Message:    "更新用户失败: " + err.Error(),
		})
		return
	}

	// 8. 重新查询用户以获取最新数据
	if err := db.First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.UserHandlerID,
			MessageID:  UserErrQueryUpdatedFailed,
			Message:    "查询更新后的用户信息失败: " + err.Error(),
		})
		return
	}

	// 9. 返回成功响应
	c.JSON(http.StatusOK, UpdateUserResponse{
		Username:  user.Username,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}
