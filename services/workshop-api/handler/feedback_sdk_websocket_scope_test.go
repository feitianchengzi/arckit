package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestResolveFeedbackSDKWebsocketScope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "test-signing-key-must-be-at-least-32-bytes-long")

	newContext := func(subprotocols ...string) *gin.Context {
		req := httptest.NewRequest("GET", "/workshop/v2/feedback/projects/1/ws", nil)
		if len(subprotocols) > 0 {
			// 模拟浏览器 WebSocket 握手携带 Sec-WebSocket-Protocol
			req.Header.Set("Sec-WebSocket-Protocol", joinSecWebSocketProtocol(subprotocols))
		}
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Request = req
		return c
	}

	t.Run("subprotocol 合法 token 解出 scope", func(t *testing.T) {
		token, _, err := signFeedbackSessionToken(42, "customer_42", time.Now())
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		c := newContext(wsAuthSubprotocolPrefix + token)
		scope, ok := resolveFeedbackSDKWebsocketScope(c)
		if !ok {
			t.Fatalf("expected scope resolved, got not ok (body=%s)", c.Writer.Header().Get("X-Test-Body"))
		}
		if scope.ProjectID != 42 || scope.CustomUserID != "customer_42" || scope.SessionID == "" {
			t.Fatalf("unexpected scope: %+v", scope)
		}
	})

	t.Run("无任何凭证返回 401 且不升级", func(t *testing.T) {
		c := newContext()
		scope, ok := resolveFeedbackSDKWebsocketScope(c)
		if ok {
			t.Fatalf("expected rejection, got scope: %+v", scope)
		}
		if c.Writer.Status() != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", c.Writer.Status())
		}
	})

	t.Run("subprotocol token 非法被拒绝", func(t *testing.T) {
		c := newContext(wsAuthSubprotocolPrefix + "fbs_invalid.token")
		if _, ok := resolveFeedbackSDKWebsocketScope(c); ok {
			t.Fatal("invalid token must be rejected")
		}
		if c.Writer.Status() != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", c.Writer.Status())
		}
	})

	t.Run("subprotocol 前缀不匹配时回退到 401", func(t *testing.T) {
		c := newContext("other-protocol")
		if _, ok := resolveFeedbackSDKWebsocketScope(c); ok {
			t.Fatal("non-auth subprotocol must not resolve scope")
		}
	})
}

// joinSecWebSocketProtocol 还原 gorilla websocket.Subprotocols 解析所需的
// Sec-WebSocket-Protocol 头格式（逗号分隔）。
func joinSecWebSocketProtocol(protocols []string) string {
	if len(protocols) == 0 {
		return ""
	}
	out := ""
	for i, p := range protocols {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}
