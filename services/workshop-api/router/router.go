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

	// CORS 配置：从环境变量读取允许的来源
	corsConfig := getCORSConfig()
	r.Use(cors.New(corsConfig))

	// 全局中间件：提取header信息和注入数据库连接
	r.Use(middleware.ExtractHeaderInfo())
	r.Use(middleware.InjectDB())

	// v1接口组
	// 路由格式: /{service}/v1/{auth_level}/{path}
	v1 := r.Group("/" + serviceName + "/v1")
	{
		// public级别路由 - 无需认证
		// 示例：GET /todo-service/v1/public/health
		publicGroup := v1.Group("/public")
		{
			publicGroup.GET("/health", handler.HealthCheck)
		}

		// user级别路由 - 需要JWT认证
		// 网关已经验证了认证，如果请求到达这里，说明认证通过
		// 示例：GET /todo-service/v1/user/header-info
		userGroup := v1.Group("/user")
		userGroup.Use(middleware.ExtractUserID()) // 提取用户ID中间件
		{
			userGroup.GET("/header-info", handler.GetHeaderInfo)
			userGroup.POST("/users", handler.CreateUser)                                 // 根据网关UUID创建用户
			userGroup.GET("/users/:uuid", handler.GetUser)                               // 根据UUID查询用户
			userGroup.PUT("/users/:uuid", handler.UpdateUser)                            // 更新用户信息
			userGroup.POST("/projects", handler.CreateProject)                           // 创建新项目
			userGroup.GET("/projects", handler.GetUserProjects)                          // 根据用户UUID查询所有参与的项目
			userGroup.PUT("/projects/:id", handler.UpdateProject)                        // 更新项目信息
			userGroup.DELETE("/projects/:id", handler.DeleteProject)                     // 删除项目（仅所有者）
			userGroup.POST("/projects/:id/invitations", handler.InviteProjectMember)     // 邀请项目成员（生成邀请码）
			userGroup.POST("/projects/join", handler.JoinProject)                        // 加入项目（使用邀请码）
			userGroup.DELETE("/projects/:id/members", handler.DeleteProjectMember)       // 删除项目成员
			userGroup.PUT("/projects/:id/members/role", handler.UpdateProjectMemberRole) // 设置成员角色（仅所有者）
			userGroup.POST("/tasks", handler.CreateTask)                                 // 创建新任务
			userGroup.PUT("/tasks/:id", handler.UpdateTask)                              // 更新任务
			userGroup.GET("/tasks", handler.GetTasks)                                    // 查询项目的所有任务
			userGroup.DELETE("/tasks", handler.DeleteTasks)                              // 删除任务（支持批量）
		}

		// apikey级别路由 - 需要API密钥认证
		// 网关已经验证了认证，如果请求到达这里，说明认证通过
		// 示例：GET /todo-service/v1/apikey/header-info
		apikeyGroup := v1.Group("/apikey")
		{
			apikeyGroup.GET("/header-info", handler.GetHeaderInfo)
		}
	}

	return r
}

// getCORSConfig 从环境变量读取 CORS 配置
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

	// 如果没有配置或配置为空，使用默认策略（允许所有 localhost 和 127.0.0.1）
	if allowOriginFunc == nil {
		allowOriginFunc = func(origin string) bool {
			return strings.HasPrefix(origin, "http://localhost") ||
				strings.HasPrefix(origin, "http://127.0.0.1") ||
				strings.HasPrefix(origin, "https://localhost") ||
				strings.HasPrefix(origin, "https://127.0.0.1")
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
