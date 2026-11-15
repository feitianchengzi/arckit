package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetAgentCapabilitiesReflectsVisionConfiguration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		name    string
		value   string
		enabled bool
	}{
		{name: "disabled by default", value: "", enabled: false},
		{name: "enabled", value: "true", enabled: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("AGENT_VISION_ENABLED", tc.value)
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest(http.MethodGet, "/agent-capabilities", nil)

			GetAgentCapabilities(context)

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
			}
			var envelope struct {
				Data struct {
					ImageUnderstanding bool `json:"image_understanding"`
				} `json:"data"`
			}
			if err := json.Unmarshal(recorder.Body.Bytes(), &envelope); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if envelope.Data.ImageUnderstanding != tc.enabled {
				t.Fatalf("image_understanding = %v, want %v", envelope.Data.ImageUnderstanding, tc.enabled)
			}
		})
	}
}
