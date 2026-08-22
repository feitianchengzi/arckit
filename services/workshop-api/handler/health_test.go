package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthCheckReflectsProcessReadiness(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Cleanup(func() { ConfigureHealthReadiness(nil) })

	ready := true
	ConfigureHealthReadiness(func() bool { return ready })
	router := gin.New()
	router.GET("/health", HealthCheck)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/health", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("ready health status = %d, want %d", recorder.Code, http.StatusOK)
	}

	ready = false
	recorder = httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/health", nil))
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("degraded health status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
}
