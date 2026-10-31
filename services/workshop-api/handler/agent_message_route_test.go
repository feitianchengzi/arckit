package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetAgentConversationMessagesUsesConversationIDOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/workshop/v2/apikey/agent-conversations/conversation-1/messages", nil)
	context.Params = gin.Params{{Key: "conversationId", Value: "conversation-1"}}

	GetAgentConversationMessagesHandler(context)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusInternalServerError, recorder.Body.String())
	}
	if strings.Contains(recorder.Body.String(), "反馈ID不能为空") {
		t.Fatalf("conversation-only route must not require feedback id; body=%s", recorder.Body.String())
	}
}

func TestGetAgentConversationMessagesRejectsMissingConversationID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/workshop/v2/apikey/agent-conversations//messages", nil)

	GetAgentConversationMessagesHandler(context)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "缺少对话ID") {
		t.Fatalf("missing conversation id error not returned; body=%s", recorder.Body.String())
	}
}
