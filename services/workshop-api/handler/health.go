package handler

import (
	"net/http"
	"os"
	"time"

	"todo/response"

	"github.com/gin-gonic/gin"
)

// HealthResponse 健康检查响应结构
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
}

var healthReadiness = func() bool { return true }

// ConfigureHealthReadiness binds the process-level readiness dependency before
// the HTTP server starts. Passing nil restores the compatibility default used
// by isolated handler tests and embedded consumers.
func ConfigureHealthReadiness(check func() bool) {
	if check == nil {
		healthReadiness = func() bool { return true }
		return
	}
	healthReadiness = check
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

	ready := healthReadiness()
	status := "ok"
	statusCode := http.StatusOK
	if !ready {
		status = "unavailable"
		statusCode = http.StatusServiceUnavailable
	}
	healthResp := HealthResponse{
		Status:    status,
		Timestamp: time.Now(),
		Service:   serviceName,
	}

	c.JSON(statusCode, response.NewSuccessResponse(healthResp))
}
