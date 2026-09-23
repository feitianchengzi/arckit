package handler

import (
	"testing"
	"time"
)

func TestVerifyFeedbackSessionToken(t *testing.T) {
	// 用与签发一致的签名 key，签发一个合法 session token。
	t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "test-signing-key-must-be-at-least-32-bytes-long")

	t.Run("合法 token 解出 project/customer/session 且未过期", func(t *testing.T) {
		token, _, err := signFeedbackSessionToken(42, "customer_42", time.Now())
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		scope, err := verifyFeedbackSessionToken(token, time.Now())
		if err != nil {
			t.Fatalf("verify: %v", err)
		}
		if scope.ProjectID != 42 || scope.CustomUserID != "customer_42" || scope.SessionID == "" {
			t.Fatalf("unexpected scope: %+v", scope)
		}
	})

	t.Run("过期 token 被拒绝", func(t *testing.T) {
		token, _, err := signFeedbackSessionToken(42, "customer_42", time.Now().Add(-1*time.Hour))
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		if _, err := verifyFeedbackSessionToken(token, time.Now()); err == nil {
			t.Fatal("expired token should be rejected")
		}
	})

	t.Run("签名错误被拒绝", func(t *testing.T) {
		token, _, err := signFeedbackSessionToken(42, "customer_42", time.Now())
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "another-signing-key-must-be-at-least-32-bytes-long")
		if _, err := verifyFeedbackSessionToken(token, time.Now()); err == nil {
			t.Fatal("tampered token should be rejected")
		}
	})

	t.Run("非 fbs_ 前缀被拒绝", func(t *testing.T) {
		if _, err := verifyFeedbackSessionToken("not_a_valid_token", time.Now()); err == nil {
			t.Fatal("malformed token should be rejected")
		}
	})

	t.Run("未配置签名 key 被拒绝", func(t *testing.T) {
		// 先在有 key 时签发合法 token，再清空 key 验证，确认验证侧拒绝。
		token, _, err := signFeedbackSessionToken(42, "customer_42", time.Now())
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "")
		if _, err := verifyFeedbackSessionToken(token, time.Now()); err == nil {
			t.Fatal("missing signing key should reject verification")
		}
	})
}
