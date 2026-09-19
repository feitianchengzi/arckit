package handler

import (
	"testing"
)

func TestDeliveryNotificationRequest(t *testing.T) {
	req := DeliveryNotificationRequest{
		ArtifactURL: "https://example.com/build.zip",
		Message:     "构建已完成，请查收。",
	}
	if req.ArtifactURL == "" {
		t.Error("ArtifactURL should not be empty")
	}
	if req.Message == "" {
		t.Error("Message should not be empty")
	}
}
