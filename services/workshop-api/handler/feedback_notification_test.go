package handler

import (
	"strings"
	"testing"
	"unicode/utf8"

	"todo/models"
)

func TestFeedbackNotificationTypeForMessage(t *testing.T) {
	tests := []struct {
		name    string
		message models.FeedbackMessage
		want    string
	}{
		{
			name:    "customer reply notifies developers",
			message: models.FeedbackMessage{SenderType: models.FeedbackMessageSenderCustomer, MessageType: models.FeedbackMessageTypeText},
			want:    models.FeedbackNotificationTypeCustomerMessage,
		},
		{
			name:    "developer reply notifies customer",
			message: models.FeedbackMessage{SenderType: models.FeedbackMessageSenderDeveloper, MessageType: models.FeedbackMessageTypeText},
			want:    models.FeedbackNotificationTypeDeveloperMessage,
		},
		{
			name:    "task status change notifies customer",
			message: models.FeedbackMessage{SenderType: models.FeedbackMessageSenderSystem, MessageType: models.FeedbackMessageTypeStatusChange},
			want:    models.FeedbackNotificationTypeStatusChange,
		},
		{
			name:    "task conversion notifies customer",
			message: models.FeedbackMessage{SenderType: models.FeedbackMessageSenderSystem, MessageType: models.FeedbackMessageTypeTaskLink},
			want:    models.FeedbackNotificationTypeStatusChange,
		},
		{
			name:    "internal system message stays silent",
			message: models.FeedbackMessage{SenderType: models.FeedbackMessageSenderSystem, MessageType: models.FeedbackMessageTypeSystem},
			want:    "",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if actual := feedbackNotificationTypeForMessage(test.message); actual != test.want {
				t.Fatalf("notification type = %q, want %q", actual, test.want)
			}
		})
	}
}

func TestNormalizeFeedbackNotificationIDs(t *testing.T) {
	ids, valid := normalizeFeedbackNotificationIDs([]uint{4, 2, 4, 9})
	if !valid {
		t.Fatal("valid notification IDs rejected")
	}
	if got := len(ids); got != 3 || ids[0] != 4 || ids[1] != 2 || ids[2] != 9 {
		t.Fatalf("normalized IDs = %#v, want [4 2 9]", ids)
	}

	if _, valid := normalizeFeedbackNotificationIDs([]uint{1, 0}); valid {
		t.Fatal("zero notification ID should be rejected")
	}
	tooMany := make([]uint, maxFeedbackNotificationReadIDs+1)
	for i := range tooMany {
		tooMany[i] = uint(i + 1)
	}
	if _, valid := normalizeFeedbackNotificationIDs(tooMany); valid {
		t.Fatal("more than the read ID limit should be rejected")
	}
}

func TestFeedbackNotificationPreviewKeepsUTF8Intact(t *testing.T) {
	content := strings.Repeat("用户补充 ", 40)
	preview := feedbackNotificationPreview(content)
	if !strings.HasSuffix(preview, "...") {
		t.Fatalf("long preview = %q, want ellipsis", preview)
	}
	if !utf8.ValidString(preview) {
		t.Fatalf("preview is invalid UTF-8: %q", preview)
	}
}
