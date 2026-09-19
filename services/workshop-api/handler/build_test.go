package handler

import (
	"testing"
)

func TestBuildStatusResponse(t *testing.T) {
	status := BuildStatus{
		TaskID:      1,
		Status:      "completed",
		ArtifactURL: "https://example.com/artifact.zip",
	}
	if status.TaskID != 1 {
		t.Errorf("TaskID = %d, want 1", status.TaskID)
	}
	if status.Status != "completed" {
		t.Errorf("Status = %s, want completed", status.Status)
	}
}
