package handler

import (
	"encoding/json"
	"testing"
)

func TestUpdateTaskRequestTracksExplicitPriority(t *testing.T) {
	tests := []struct {
		name         string
		body         string
		wantSet      bool
		wantPriority *int
	}{
		{name: "omitted", body: `{}`, wantSet: false},
		{name: "cleared", body: `{"priority":null}`, wantSet: true},
		{name: "highest", body: `{"priority":0}`, wantSet: true, wantPriority: intPointer(0)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var request UpdateTaskRequest
			if err := json.Unmarshal([]byte(tt.body), &request); err != nil {
				t.Fatalf("unmarshal update request: %v", err)
			}
			if request.prioritySet != tt.wantSet {
				t.Fatalf("prioritySet = %v, want %v", request.prioritySet, tt.wantSet)
			}
			if tt.wantPriority == nil {
				if request.Priority != nil {
					t.Fatalf("Priority = %v, want nil", *request.Priority)
				}
				return
			}
			if request.Priority == nil || *request.Priority != *tt.wantPriority {
				t.Fatalf("Priority = %v, want %d", request.Priority, *tt.wantPriority)
			}
		})
	}
}

func intPointer(value int) *int {
	return &value
}
