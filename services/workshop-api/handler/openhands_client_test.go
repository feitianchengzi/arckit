package handler

import (
	"strings"
	"testing"
)

// ohLLMConfig 必须下传 temperature（DB 字段 LLMTemperature，默认 0.0），
// 否则模型以默认随机采样运行，检索结果每次不同 → 前端"一会有内容一会没内容"。

func TestOhLLMConfigIncludesDeterministicTemperature(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-key")

	agent := &OpenHandsAgent{LLMTemperature: 0}
	cfg, err := ohLLMConfig(agent)
	if err != nil {
		t.Fatalf("ohLLMConfig() error = %v", err)
	}
	raw, ok := cfg["temperature"]
	if !ok {
		t.Fatal("ohLLMConfig() 缺少 temperature，LLM 非确定性采样会导致检索结果抖动")
	}
	if got, ok := raw.(float64); !ok || got != 0 {
		t.Errorf("temperature = %#v, want float64(0)", raw)
	}
}

func TestOhLLMConfigUsesAgentConfiguredTemperature(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-key")

	agent := &OpenHandsAgent{LLMTemperature: 0.2}
	cfg, err := ohLLMConfig(agent)
	if err != nil {
		t.Fatalf("ohLLMConfig() error = %v", err)
	}
	if got := cfg["temperature"]; got != float64(0.2) {
		t.Errorf("temperature = %#v, want 0.2（以 DB 配置为准）", got)
	}
}

func TestOhLLMConfigPrefersEncryptedProjectCredential(t *testing.T) {
	t.Setenv(openHandsConfigEncryptionKeyEnv, strings.Repeat("project-master-", 3))
	t.Setenv("LLM_API_KEY", "server-key")
	t.Setenv("LLM_MODEL", "server-model")
	t.Setenv("LLM_BASE_URL", "https://server.example/v1")
	encrypted, err := encryptOpenHandsLLMAPIKey(7, "project-key")
	if err != nil {
		t.Fatalf("encrypt project key: %v", err)
	}
	agent := &OpenHandsAgent{
		ProjectID:          7,
		LLMAPIKeyEncrypted: encrypted,
		LLMModel:           "project-model",
		LLMBaseURL:         "https://project.example/v1",
	}

	cfg, err := ohLLMConfig(agent)
	if err != nil {
		t.Fatalf("ohLLMConfig: %v", err)
	}
	if cfg["api_key"] != "project-key" || cfg["model"] != "project-model" || cfg["base_url"] != "https://project.example/v1" {
		t.Fatalf("project config did not override server config: %#v", cfg)
	}
}

func TestOhLLMConfigAllowsUnconfiguredDeploymentButRejectsAgentCall(t *testing.T) {
	t.Setenv("LLM_API_KEY", "")
	if openHandsLLMConfigured(&OpenHandsAgent{}) {
		t.Fatal("agent unexpectedly reported an LLM credential")
	}
	if _, err := ohLLMConfig(&OpenHandsAgent{}); err == nil {
		t.Fatal("LLM request config unexpectedly succeeded without any key")
	}
}

// openHandsEnabled 让 .env 的 OPENHANDS_ENABLED 真正生效（此前是无效配置）。
func TestOpenHandsEnabled(t *testing.T) {
	cases := []struct {
		env  string
		set  bool
		want bool
	}{
		{set: false, want: true},
		{set: true, env: "true", want: true},
		{set: true, env: "1", want: true},
		{set: true, env: "false", want: false},
		{set: true, env: "0", want: false},
		{set: true, env: "FALSE", want: false},
		{set: true, env: "  ", want: true},
	}
	for _, tc := range cases {
		if tc.set {
			t.Setenv("OPENHANDS_ENABLED", tc.env)
		} else {
			t.Setenv("OPENHANDS_ENABLED", "")
			// 清空等价于未配置：t.Setenv("") 设置空串，openHandsEnabled 应视为未配置
		}
		if got := openHandsEnabled(); got != tc.want {
			t.Errorf("openHandsEnabled() with OPENHANDS_ENABLED set=%v env=%q = %v, want %v", tc.set, tc.env, got, tc.want)
		}
	}
}
