package router

import (
	"os"
	"strings"
	"todo/handler"
	"todo/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter 配置路由
// 网关路由格式: /{service}/{version}/{auth_level}/{path}
// 网关已经处理了认证并转发了header，我们直接匹配完整路由路径
// serviceName: 服务名称，用于路由前缀
func SetupRouter(serviceName string) *gin.Engine {
	r := gin.Default()

	// CORS 配置：只有在环境变量中配置了 CORS_ALLOW_ORIGINS 时才启用 CORS 中间件
	// 如果网关已经处理了 CORS，这里就不需要再添加，避免重复的 CORS 头
	if corsAllowOrigins := os.Getenv("CORS_ALLOW_ORIGINS"); corsAllowOrigins != "" {
		corsConfig := getCORSConfig()
		r.Use(cors.New(corsConfig))
	}

	// 全局中间件：提取header信息和注入数据库连接
	r.Use(middleware.ExtractHeaderInfo())
	r.Use(middleware.InjectDB())

	registerVersionRoutes(r, serviceName, "v1", false)
	registerVersionRoutes(r, serviceName, "v2", true)

	return r
}

func registerVersionRoutes(r *gin.Engine, serviceName string, version string, enableFeedbackWorkflow bool) {
	// 路由格式: /{service}/{version}/{auth_level}/{path}
	versionGroup := r.Group("/" + serviceName + "/" + version)
	{
		// public级别路由 - 无需认证
		// 示例：GET /todo-service/v1/public/health
		publicGroup := versionGroup.Group("/public")
		{
			publicGroup.GET("/health", handler.HealthCheck)
			publicGroup.GET("/feedbacks", handler.GetPublicFeedbacksByKey) // 通过 key 查询反馈（独立 public 接口）
		}

		// user级别路由 - 需要JWT认证
		// 网关已经验证了认证，如果请求到达这里，说明认证通过
		// 示例：GET /todo-service/v1/user/header-info
		userGroup := versionGroup.Group("/user")
		userGroup.Use(middleware.ExtractUserID()) // 提取用户ID中间件
		registerBusinessRoutes(userGroup)
		if enableFeedbackWorkflow {
			registerFeedbackWorkflowRoutes(userGroup)
			registerFeedbackNotificationRoutes(userGroup)
			userGroup.POST("/feedback-sessions", handler.CreateFeedbackSession)
			userGroup.POST("/feedbacks/:id/upload-policies", handler.CreateFeedbackDeveloperUploadPolicy)
		}
		userGroup.POST("/projects/:id/feedback-access-keys", handler.CreateProjectFeedbackAccessKey)           // 创建项目反馈访问 key（管理员/所有者）
		userGroup.GET("/projects/:id/feedback-access-keys", handler.GetProjectFeedbackAccessKeys)              // 查询项目反馈访问 key 列表（管理员/所有者）
		userGroup.DELETE("/projects/:id/feedback-access-keys/:key_id", handler.DeleteProjectFeedbackAccessKey) // 删除项目反馈访问 key（管理员/所有者）

		// apikey级别路由 - 需要API密钥认证
		// 网关已经验证了认证，如果请求到达这里，说明认证通过
		// 示例：GET /todo-service/v1/apikey/header-info
		apikeyGroup := versionGroup.Group("/apikey")
		apikeyGroup.Use(middleware.ExtractUserID()) // 提取用户ID中间件
		registerBusinessRoutes(apikeyGroup)
		if enableFeedbackWorkflow {
			registerFeedbackWorkflowRoutes(apikeyGroup)
			registerFeedbackNotificationAPIKeyRoutes(apikeyGroup)
			apikeyGroup.POST("/feedback-sessions", handler.CreateFeedbackSession)
			apikeyGroup.POST("/feedbacks/upload-policies", handler.CreateFeedbackUploadPolicyByAPIKey)
			apikeyGroup.GET("/feedbacks/oss/credentials", handler.GetFeedbackAPIKeyOSSTempCredentials)

			// feedback 是仅供 SDK 使用的窄权限认证级别。范围由网关校验
			// 的短期 token 注入，不能复用 API Key 的项目成员权限。
			feedbackGroup := versionGroup.Group("/feedback")
			feedbackGroup.Use(middleware.ExtractFeedbackSessionScope())
			registerFeedbackSessionRoutes(feedbackGroup)
		}
	}
}

// getCORSConfig 从环境变量读取 CORS 配置
// 注意：此函数只在环境变量 CORS_ALLOW_ORIGINS 有值时才会被调用
func getCORSConfig() cors.Config {
	// 从环境变量读取允许的来源列表
	allowOriginsEnv := os.Getenv("CORS_ALLOW_ORIGINS")

	var allowedOrigins []string
	var allowOriginFunc func(origin string) bool

	if allowOriginsEnv != "" {
		// 解析环境变量中的来源列表（逗号分隔）
		origins := strings.Split(allowOriginsEnv, ",")
		for _, origin := range origins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				allowedOrigins = append(allowedOrigins, origin)
			}
		}

		// 如果配置了具体来源，支持精确匹配和前缀匹配
		if len(allowedOrigins) > 0 {
			allowOriginFunc = func(origin string) bool {
				for _, allowedOrigin := range allowedOrigins {
					// 精确匹配
					if origin == allowedOrigin {
						return true
					}
					// 前缀匹配：如果配置的是基础 URL（如 http://localhost），匹配所有端口
					// 例如：http://localhost 匹配 http://localhost:8000, http://localhost:3000 等
					if strings.HasPrefix(origin, allowedOrigin+":") {
						return true
					}
				}
				return false
			}
		}
	}

	// 如果配置了 CORS_ALLOW_ORIGINS 但解析后为空，拒绝所有来源
	if allowOriginFunc == nil {
		allowOriginFunc = func(origin string) bool {
			return false
		}
	}

	return cors.Config{
		AllowOriginFunc:  allowOriginFunc,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "Authorization", "X-User-ID", "X-User-Username", "X-User-AppID", "X-User-SessionID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
}

// registerBusinessRoutes 注册业务路由
// 用于 user 和 apikey 两个认证级别，使其执行完全相同的接口
func registerBusinessRoutes(group *gin.RouterGroup) {
	group.GET("/header-info", handler.GetHeaderInfo)
	group.GET("/projects/:id/ws", handler.ConnectProjectWebsocket)
	group.POST("/users", handler.CreateUser)                                           // 根据网关UUID创建用户
	group.GET("/users", handler.GetUser)                                               // 根据Header中的UUID查询用户
	group.PUT("/users", handler.UpdateUser)                                            // 更新用户信息
	group.GET("/oss/credentials", handler.GetOSSTempCredentials)                       // 获取OSS临时访问凭证
	group.POST("/organizations", handler.CreateOrganization)                           // 创建新组织
	group.GET("/organizations", handler.GetUserOrganizations)                          // 根据用户UUID查询所有参与的组织
	group.PUT("/organizations/:id", handler.UpdateOrganization)                        // 更新组织信息
	group.DELETE("/organizations/:id", handler.DeleteOrganization)                     // 删除组织（仅所有者）
	group.GET("/organizations/:id/members", handler.GetOrganizationMembers)            // 查询组织成员列表
	group.POST("/organizations/:id/invitations", handler.InviteOrganizationMember)     // 邀请组织成员（生成邀请码）
	group.POST("/organizations/join", handler.JoinOrganization)                        // 加入组织（使用邀请码）
	group.DELETE("/organizations/:id/members", handler.DeleteOrganizationMember)       // 删除组织成员
	group.PUT("/organizations/:id/members/role", handler.UpdateOrganizationMemberRole) // 设置成员角色（仅所有者）
	group.POST("/projects", handler.CreateProject)                                     // 创建新项目
	group.GET("/projects", handler.GetUserProjects)                                    // 根据用户UUID查询所有参与的项目
	group.GET("/organization/projects", handler.GetOrganizationProjects)               // 管理员查询组织所有项目
	group.PUT("/projects/:id", handler.UpdateProject)                                  // 更新项目信息
	group.DELETE("/projects/:id", handler.DeleteProject)                               // 删除项目（仅所有者）
	group.POST("/projects/:id/invitations", handler.InviteProjectMember)               // 邀请项目成员（生成邀请码）
	group.POST("/projects/join", handler.JoinProject)                                  // 加入项目（使用邀请码）
	group.POST("/projects/:id/members", handler.AddProjectMember)                      // 添加项目成员（通过组织成员ID，无权限限制）
	group.DELETE("/projects/:id/members", handler.DeleteProjectMember)                 // 删除项目成员
	group.PUT("/projects/:id/members/role", handler.UpdateProjectMemberRole)           // 设置成员角色（仅所有者）
	group.POST("/tasks", handler.CreateTask)                                           // 创建新任务
	group.PUT("/tasks/:id", handler.UpdateTask)                                        // 更新任务
	group.GET("/tasks", handler.GetTasks)                                              // 查询项目的所有任务
	group.GET("/tasks/tree", handler.GetTaskTree)                                      // 按时间范围查询任务层级
	group.DELETE("/tasks/:id", handler.DeleteTask)                                     // 删除任务
	group.POST("/tasks/attachments", handler.CreateTaskAttachment)                     // 创建任务附件
	group.GET("/tasks/attachments", handler.GetTaskAttachments)                        // 查询任务附件列表
	group.PUT("/tasks/attachments/:id", handler.UpdateTaskAttachment)                  // 更新任务附件
	group.DELETE("/tasks/attachments/:id", handler.DeleteTaskAttachment)               // 删除任务附件
	group.POST("/feedbacks", handler.CreateFeedback)                                   // 创建反馈
	group.GET("/feedbacks", handler.GetFeedbacks)                                      // 查询反馈
	group.PUT("/feedbacks/:id", handler.UpdateFeedback)                                // 更新反馈
	group.DELETE("/feedbacks/:id", handler.DeleteFeedback)                             // 删除反馈（管理员/所有者）
	group.GET("/projects/:id/tags", handler.GetTags)                                   // 查询项目的所有标签
	group.POST("/projects/:id/tags", handler.CreateTag)                                // 创建标签
	group.PUT("/tags/:id", handler.UpdateTag)                                          // 更新标签
	group.DELETE("/tags/:id", handler.DeleteTag)                                       // 删除标签
}

func registerFeedbackWorkflowRoutes(group *gin.RouterGroup) {
	group.GET("/feedbacks/:id/messages", handler.GetFeedbackMessages)    // 查询反馈消息
	group.POST("/feedbacks/:id/messages", handler.CreateFeedbackMessage) // 创建反馈消息
	group.GET("/feedbacks/:id/attachments/:attachment_id/oss/credentials", handler.GetFeedbackAttachmentOSSCredentials)
	group.POST("/feedbacks/:id/convert-to-task", handler.ConvertFeedbackToTask) // 将反馈流转为待办
	group.POST("/feedbacks/:id/ignore", handler.IgnoreFeedback)                 // 标记反馈为暂不处理
	group.POST("/feedbacks/:id/restore", handler.RestoreFeedback)               // 将已忽略反馈恢复为待处理
	group.GET("/tasks/attachments/:id/oss/credentials", handler.GetFeedbackTaskAttachmentOSSCredentials)
}

func registerFeedbackSessionRoutes(group *gin.RouterGroup) {
	group.POST("/upload-policies", handler.CreateFeedbackUploadPolicy)
	group.GET("/oss/credentials", handler.GetFeedbackSessionOSSTempCredentials)
	group.GET("/notifications", handler.GetFeedbackNotificationsFromSession)
	group.POST("/notifications/read", handler.MarkFeedbackNotificationsReadFromSession)
	group.POST("/feedbacks", handler.CreateFeedbackFromSession)
	group.GET("/feedbacks", handler.GetFeedbacksFromSession)
	group.GET("/feedbacks/:id/messages", handler.GetFeedbackMessagesFromSession)
	group.POST("/feedbacks/:id/messages", handler.CreateFeedbackMessageFromSession)
	group.GET("/feedbacks/:id/attachments/:attachment_id/oss/credentials", handler.GetFeedbackAttachmentOSSCredentialsFromSession)
}

func registerFeedbackNotificationRoutes(group *gin.RouterGroup) {
	group.GET("/feedback-notifications", handler.GetFeedbackNotifications)
	group.POST("/feedback-notifications/read", handler.MarkFeedbackNotificationsRead)
}

func registerFeedbackNotificationAPIKeyRoutes(group *gin.RouterGroup) {
	group.GET("/feedback-notifications", handler.GetFeedbackNotificationsByAPIKey)
	group.POST("/feedback-notifications/read", handler.MarkFeedbackNotificationsReadByAPIKey)
}
