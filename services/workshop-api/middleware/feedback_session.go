package middleware

import (
	"crypto/subtle"
	"net/http"
	"os"
	"strconv"
	"strings"

	"todo/response"

	"github.com/gin-gonic/gin"
)

const feedbackSessionScopeKey = "feedbackSessionScope"

func feedbackGatewaySharedSecret() ([]byte, bool) {
	secret := strings.TrimSpace(os.Getenv("FEEDBACK_GATEWAY_SHARED_SECRET"))
	if len(secret) < 32 {
		return nil, false
	}
	return []byte(secret), true
}

// FeedbackSessionScope is populated exclusively from headers injected by the
// gateway after it validates a short-lived feedback session token.
type FeedbackSessionScope struct {
	ProjectID    uint
	CustomUserID string
	SessionID    string
}

func ExtractFeedbackSessionScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		gatewaySecret, configured := feedbackGatewaySharedSecret()
		receivedSecret := []byte(c.GetHeader("X-Feedback-Gateway-Secret"))
		if !configured || c.GetHeader("X-Auth-Type") != "feedback_session" || len(receivedSecret) != len(gatewaySecret) || subtle.ConstantTimeCompare(receivedSecret, gatewaySecret) != 1 {
			c.Next()
			return
		}
		projectID, err := strconv.ParseUint(strings.TrimSpace(c.GetHeader("X-Feedback-Project-ID")), 10, 64)
		customUserID := strings.TrimSpace(c.GetHeader("X-Feedback-Custom-User-ID"))
		sessionID := strings.TrimSpace(c.GetHeader("X-Feedback-Session-ID"))
		if err == nil && projectID > 0 && customUserID != "" && len(customUserID) <= 128 && sessionID != "" {
			c.Set(feedbackSessionScopeKey, FeedbackSessionScope{
				ProjectID:    uint(projectID),
				CustomUserID: customUserID,
				SessionID:    sessionID,
			})
		}
		c.Next()
	}
}

func RequireFeedbackSessionScope(c *gin.Context) (FeedbackSessionScope, bool) {
	value, ok := c.Get(feedbackSessionScopeKey)
	if ok {
		if scope, ok := value.(FeedbackSessionScope); ok && scope.ProjectID != 0 && scope.CustomUserID != "" && scope.SessionID != "" {
			return scope, true
		}
	}
	if _, configured := feedbackGatewaySharedSecret(); !configured {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "反馈会话服务未配置网关内部认证", nil))
		return FeedbackSessionScope{}, false
	}

	c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "缺少有效的反馈会话范围", nil))
	return FeedbackSessionScope{}, false
}
