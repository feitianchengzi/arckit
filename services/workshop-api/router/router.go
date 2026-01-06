package router

import (
	"todo/handler"
	"todo/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter 配置路由
// 网关路由格式: /{service}/{version}/{auth_level}/{path}
// 网关已经处理了认证并转发了header，我们直接匹配完整路由路径
// serviceName: 服务名称，用于路由前缀
func SetupRouter(serviceName string) *gin.Engine {
	r := gin.Default()

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
		{
			userGroup.GET("/header-info", handler.GetHeaderInfo)
			userGroup.POST("/projects", handler.CreateProject) // 创建新项目
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
