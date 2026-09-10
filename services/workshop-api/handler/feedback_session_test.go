package handler

import "testing"

func TestResolveFeedbackSessionCustomerID(t *testing.T) {
	t.Setenv(feedbackConsoleProjectEnv, "78")

	customUserID, bypassMembership := resolveFeedbackSessionCustomerID(true, 78, 23, "console_spoofed")
	if customUserID != "console_23" || !bypassMembership {
		t.Fatalf("Console session = (%q, %v), want (%q, true)", customUserID, bypassMembership, "console_23")
	}

	customUserID, bypassMembership = resolveFeedbackSessionCustomerID(true, 79, 23, "customer_23")
	if customUserID != "customer_23" || bypassMembership {
		t.Fatalf("ordinary user session = (%q, %v), want (%q, false)", customUserID, bypassMembership, "customer_23")
	}

	customUserID, bypassMembership = resolveFeedbackSessionCustomerID(false, 78, 23, "api_key_customer")
	if customUserID != "api_key_customer" || bypassMembership {
		t.Fatalf("API Key session = (%q, %v), want (%q, false)", customUserID, bypassMembership, "api_key_customer")
	}
}

func TestResolveFeedbackSessionCustomerIDWithInvalidConfig(t *testing.T) {
	for _, value := range []string{"", "0", "invalid"} {
		t.Run(value, func(t *testing.T) {
			t.Setenv(feedbackConsoleProjectEnv, value)
			customUserID, bypassMembership := resolveFeedbackSessionCustomerID(true, 78, 23, "customer_23")
			if customUserID != "customer_23" || bypassMembership {
				t.Fatalf("session with config %q = (%q, %v), want (%q, false)", value, customUserID, bypassMembership, "customer_23")
			}
		})
	}
}
