package router

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func hasRoute(engine *gin.Engine, method string, path string) bool {
	for _, route := range engine.Routes() {
		if route.Method == method && route.Path == path {
			return true
		}
	}
	return false
}

func requireRoute(t *testing.T, engine *gin.Engine, method string, path string) {
	t.Helper()
	if !hasRoute(engine, method, path) {
		t.Fatalf("route %s %s is not registered", method, path)
	}
}

func forbidRoute(t *testing.T, engine *gin.Engine, method string, path string) {
	t.Helper()
	if hasRoute(engine, method, path) {
		t.Fatalf("route %s %s should not be registered", method, path)
	}
}

func TestFeedbackWorkflowRoutesAreV2Only(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := SetupRouter("workshop")

	requireRoute(t, engine, http.MethodPost, "/workshop/v1/apikey/feedbacks")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/apikey/feedbacks")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/apikey/projects")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/apikey/oss/credentials")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/apikey/feedback-sessions")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/user/feedback-sessions")

	requireRoute(t, engine, http.MethodGet, "/workshop/v2/user/feedbacks/:id/messages")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/user/feedbacks/:id/messages")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/user/feedbacks/:id/convert-to-task")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/apikey/feedbacks/:id/messages")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/apikey/feedbacks/:id/messages")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/feedback/oss/credentials")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/feedback/upload-policies")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/feedback/feedbacks")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/feedback/feedbacks")
	requireRoute(t, engine, http.MethodGet, "/workshop/v2/feedback/feedbacks/:id/messages")
	requireRoute(t, engine, http.MethodPost, "/workshop/v2/feedback/feedbacks/:id/messages")

	forbidRoute(t, engine, http.MethodGet, "/workshop/v1/user/feedbacks/:id/messages")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/user/feedbacks/:id/messages")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/user/feedbacks/:id/convert-to-task")
	forbidRoute(t, engine, http.MethodGet, "/workshop/v1/apikey/feedbacks/:id/messages")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/apikey/feedbacks/:id/messages")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/apikey/feedback-sessions")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/user/feedback-sessions")
	forbidRoute(t, engine, http.MethodPost, "/workshop/v1/feedback/feedbacks")
}
