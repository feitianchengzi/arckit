package handler

import (
	"testing"

	"todo/models"
)

func TestMapTaskStateToFeedbackStatus(t *testing.T) {
	cases := map[string]string{
		models.TaskStatePending:       models.FeedbackStatusConverted,
		models.TaskStatePendingReview: models.FeedbackStatusConverted,
		models.TaskStateInProgress:    models.FeedbackStatusInProgress,
		models.TaskStateBlocked:       models.FeedbackStatusInProgress,
		models.TaskStateCompleted:     models.FeedbackStatusCompleted,
		models.TaskStateAccepted:      models.FeedbackStatusCompleted,
		models.TaskStateCancelled:     models.FeedbackStatusIgnored,
	}

	for taskState, expected := range cases {
		if actual := mapTaskStateToFeedbackStatus(taskState); actual != expected {
			t.Fatalf("task state %s mapped to %s, want %s", taskState, actual, expected)
		}
	}
}

func TestFeedbackStatusFromData(t *testing.T) {
	data := `{"feedback_state":"in_progress","status":"developing"}`
	if actual := feedbackStatusFromData(&data, models.FeedbackStatusPending); actual != models.FeedbackStatusInProgress {
		t.Fatalf("status from data = %s, want %s", actual, models.FeedbackStatusInProgress)
	}

	invalid := `not-json`
	if actual := feedbackStatusFromData(&invalid, models.FeedbackStatusAccepted); actual != models.FeedbackStatusAccepted {
		t.Fatalf("invalid data fallback = %s, want %s", actual, models.FeedbackStatusAccepted)
	}
}
