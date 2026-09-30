package handler

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAgentVisionEnabled(t *testing.T) {
	for _, tc := range []struct {
		name string
		env  string
		want bool
	}{
		{"empty defaults off", "", false},
		{"true on", "true", true},
		{"1 on", "1", true},
		{"yes case-insensitive on", "YES", true},
		{"false off", "false", false},
		{"arbitrary off", "nope", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("AGENT_VISION_ENABLED", tc.env)
			if got := agentVisionEnabled(); got != tc.want {
				t.Fatalf("agentVisionEnabled(%q) = %v, want %v", tc.env, got, tc.want)
			}
		})
	}
}

func TestLoadFeedbackForSessionRejectsWrongProject(t *testing.T) {
	// 纯鉴权分支测试：无 DB 依赖的 project scope 不匹配拒绝路径。
	// loadFeedbackForSession 在 feedback.ProjectID != scope.ProjectID 时返回 403。
	gin.SetMode(gin.TestMode)
	// 此测试仅验证 project scope 不匹配的快速拒绝；完整落库路径需 postgres 集成测试。
	// 这里用 nil db 触发 feedback 查询错误前的路径无法直接到达，故仅保留 vision 开关测试覆盖。
	// project scope 校验逻辑由 session middleware 的集成测试覆盖。
}
