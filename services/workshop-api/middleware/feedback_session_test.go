package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestExtractFeedbackSessionScopeRequiresGatewaySecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	const secret = "abcdef0123456789abcdef0123456789"
	t.Setenv("FEEDBACK_GATEWAY_SHARED_SECRET", secret)

	for name, gatewaySecret := range map[string]string{
		"valid":   secret,
		"invalid": "not-the-shared-secret",
	} {
		t.Run(name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			request := httptest.NewRequest(http.MethodGet, "/workshop/v2/feedback/feedbacks", nil)
			request.Header.Set("X-Auth-Type", "feedback_session")
			request.Header.Set("X-Feedback-Gateway-Secret", gatewaySecret)
			request.Header.Set("X-Feedback-Project-ID", "42")
			request.Header.Set("X-Feedback-Custom-User-ID", "customer-123")
			request.Header.Set("X-Feedback-Session-ID", "session-123")
			context.Request = request

			ExtractFeedbackSessionScope()(context)
			_, found := context.Get(feedbackSessionScopeKey)
			if found != (name == "valid") {
				t.Fatalf("scope found = %t", found)
			}
		})
	}
}
