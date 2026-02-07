package handler

import (
	"net/http"
	"os"
	"strconv"

	"todo/middleware"
	"todo/models"
	"todo/response"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	sts20150401 "github.com/alibabacloud-go/sts-20150401/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
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

	// 7. 创建用户
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeUserCreateFailed, "创建用户失败: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
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

// GetOSSTempCredentialsResponse OSS临时凭证响应结构
type GetOSSTempCredentialsResponse struct {
	AccessKeyId     string `json:"access_key_id"`     // 临时AccessKeyId
	AccessKeySecret string `json:"access_key_secret"` // 临时AccessKeySecret
	SecurityToken   string `json:"security_token"`    // SecurityToken
	Expiration      string `json:"expiration"`        // 过期时间
	BucketName      string `json:"bucket_name"`       // OSS Bucket名称
	Region          string `json:"region"`            // OSS Region（用于前端构建region: 'oss-' + region）
	RootPath        string `json:"root_path"`         // OSS根目录路径（允许操作的根目录）
	AuthorizationV4 bool   `json:"authorization_v4"`  // 使用V4签名（推荐）
	Secure          bool   `json:"secure"`            // 使用HTTPS协议
}

// GetOSSTempCredentials 为客户端生成临时的OSS访问凭证
// 网关路由: GET /todo-service/v1/user/oss/credentials
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 验证用户身份（通过中间件RequireUserID）
// 2. 从环境变量读取OSS和STS配置
// 3. 调用阿里云STS服务生成临时凭证
// 4. 返回临时凭证信息
func GetOSSTempCredentials(c *gin.Context) {
	// 1. 验证用户身份（如果没有用户身份就直接返回错误）
	_, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 2. 获取Header信息（用于会话名称）
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "未获取到用户信息，请确保已通过网关认证", nil))
		return
	}

	// 3. 从环境变量读取配置
	accessKeyId := os.Getenv("OSS_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET_NAME")
	roleArn := os.Getenv("OSS_RAM_ROLE_ARN")
	region := os.Getenv("OSS_REGION")
	rootPath := os.Getenv("OSS_ROOT_PATH")

	// 4. 验证必要的环境变量
	if accessKeyId == "" || accessKeySecret == "" {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "OSS配置不完整：缺少OSS_ACCESS_KEY_ID或OSS_ACCESS_KEY_SECRET", nil))
		return
	}
	if bucketName == "" {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "OSS配置不完整：缺少OSS_BUCKET_NAME", nil))
		return
	}
	if roleArn == "" {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "OSS配置不完整：缺少OSS_RAM_ROLE_ARN", nil))
		return
	}
	if region == "" {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "OSS配置不完整：缺少OSS_REGION", nil))
		return
	}

	// 5. 创建STS客户端配置
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKeyId),     // RAM用户的AccessKey ID
		AccessKeySecret: tea.String(accessKeySecret), // RAM用户的AccessKey Secret
	}

	// 设置STS服务的Endpoint（必须使用HTTPS）
	// 根据region构建STS endpoint，格式：sts.{region}.aliyuncs.com
	stsEndpoint := "sts." + region + ".aliyuncs.com"
	config.Endpoint = tea.String(stsEndpoint)

	// 6. 创建STS客户端
	client, err := sts20150401.NewClient(config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建STS客户端失败: "+err.Error(), nil))
		return
	}

	// 7. 构建AssumeRole请求参数
	durationSeconds, err := strconv.ParseInt("900", 10, 64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "解析凭证有效期失败: "+err.Error(), nil))
		return
	}
	request := &sts20150401.AssumeRoleRequest{
		DurationSeconds: tea.Int64(durationSeconds),                     // 临时凭证的有效期，单位为秒（15分钟）
		RoleArn:         tea.String(roleArn),                            // RAM角色的ARN
		RoleSessionName: tea.String("oss-session-" + headerInfo.UserID), // 自定义会话名称，使用用户ID
	}

	// 8. 发送请求并获取临时访问凭证
	stsResponse, err := client.AssumeRoleWithOptions(request, &util.RuntimeOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取临时凭证失败: "+err.Error(), nil))
		return
	}

	// 9. 返回成功响应
	creds := stsResponse.Body.Credentials
	resp := GetOSSTempCredentialsResponse{
		AccessKeyId:     tea.StringValue(creds.AccessKeyId),
		AccessKeySecret: tea.StringValue(creds.AccessKeySecret),
		SecurityToken:   tea.StringValue(creds.SecurityToken),
		Expiration:      tea.StringValue(creds.Expiration),
		BucketName:      bucketName,
		Region:          "oss-" + region,
		RootPath:        rootPath,
		AuthorizationV4: true,
		Secure:          true,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}
