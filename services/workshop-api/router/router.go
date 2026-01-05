package router

import (
	"net/http"

	"todo/handler"
)

// SetupRouter 配置路由
func SetupRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// 健康检查接口
	mux.HandleFunc("/health", handler.HealthCheck)

	return mux
}
