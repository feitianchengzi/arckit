package realtime

import (
	"encoding/json"
	"testing"
)

func TestNewEventDerivesEntity(t *testing.T) {
	event := NewEvent(12, Actor{ID: 7}, "task.updated", map[string]any{"task_id": 41})
	if event.SchemaVersion != EventSchemaVersion || event.Entity != "task" || event.ProjectID != 12 {
		t.Fatalf("unexpected event envelope: %#v", event)
	}
}

func TestSubjectIDFromJSON(t *testing.T) {
	tests := []struct {
		entity string
		data   string
		want   string
	}{
		{"task", `{"task_id":41}`, "41"},
		{"feedback", `{"feedback_id":9}`, "9"},
		{"project_member", `{"user_id":7}`, "7"},
		{"tag", `{"id":3}`, "3"},
		{"project_invitation", `{"invite_code":"abc"}`, "abc"},
	}
	for _, test := range tests {
		if got := subjectIDFromJSON(json.RawMessage(test.data), test.entity); got != test.want {
			t.Errorf("subjectIDFromJSON(%s, %s) = %q, want %q", test.data, test.entity, got, test.want)
		}
	}
}
