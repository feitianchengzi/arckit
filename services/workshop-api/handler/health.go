package handler

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthResponse 健康检查响应结构
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
}

// HealthCheck 健康检查接口处理函数
// 网关路由: GET /todo-service/v1/public/health
// 认证级别: public (无需认证)
func HealthCheck(c *gin.Context) {
	// 从环境变量读取服务名称，默认todo-service
	serviceName := os.Getenv("SERVICE_NAME")
	if serviceName == "" {
		serviceName = "todo"
	}

	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Service:   serviceName,
	}

	c.JSON(http.StatusOK, response)
}
