package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

// HealthResponse 健康检查响应结构
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
}

// HealthCheck 健康检查接口处理函数
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 从环境变量读取服务名称，默认todo
	serviceName := os.Getenv("SERVICE_NAME")
	if serviceName == "" {
		serviceName = "todo"
	}

	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Service:   serviceName,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
