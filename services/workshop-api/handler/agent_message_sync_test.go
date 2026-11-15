package handler

import (
	"testing"

	"todo/models"

	"github.com/google/uuid"
)

// TestSyncDeveloperReplyToAgentMessages 验证客服回复显式归属到反馈关联的会话，
// 而非反查"最近一条消息"拿 conversation_id。DB-gated，无 DSN 跳过。
func TestSyncDeveloperReplyToAgentMessages(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)

	t.Run("writes developer reply into the feedback's conversation", func(t *testing.T) {
		// 反馈 8001 关联了一条会话（P1 关联后的形态）
		convID := uuid.New().String()
		conv := AgentConversation{
			ID:           convID,
			FeedbackID:   8001,
			ProjectID:    11,
			CustomUserID: "c1",
		}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}
		feedback := models.Feedback{ID: 8001, ProjectID: 11}

		syncDeveloperReplyToAgentMessages(db, feedback, "已定位到问题，正在修复")

		var records []AgentMessageRecord
		if err := db.Where("feedback_id = ? AND sender_type = ?", 8001, "developer").Find(&records).Error; err != nil {
			t.Fatalf("query developer records: %v", err)
		}
		if len(records) != 1 {
			t.Fatalf("developer records = %d, want 1", len(records))
		}
		if records[0].ConversationID != convID {
			t.Fatalf("conversation_id = %q, want %q (应归属反馈关联的会话)", records[0].ConversationID, convID)
		}
		if records[0].Content != "已定位到问题，正在修复" {
			t.Fatalf("content = %q", records[0].Content)
		}
	})

	t.Run("uses the latest conversation when feedback has multiple", func(t *testing.T) {
		// 两条会话，GetFeedbackConversations 按 created_at DESC 返回，取第一条（最新）
		older := AgentConversation{ID: uuid.New().String(), FeedbackID: 8002, ProjectID: 11, CustomUserID: "c1"}
		newer := AgentConversation{ID: uuid.New().String(), FeedbackID: 8002, ProjectID: 11, CustomUserID: "c1"}
		if err := db.Create(&older).Error; err != nil {
			t.Fatalf("create older: %v", err)
		}
		if err := db.Create(&newer).Error; err != nil {
			t.Fatalf("create newer: %v", err)
		}
		feedback := models.Feedback{ID: 8002, ProjectID: 11}

		syncDeveloperReplyToAgentMessages(db, feedback, "跟进中")

		var records []AgentMessageRecord
		if err := db.Where("feedback_id = ? AND sender_type = ?", 8002, "developer").Find(&records).Error; err != nil {
			t.Fatalf("query: %v", err)
		}
		if len(records) != 1 {
			t.Fatalf("records = %d, want 1", len(records))
		}
		if records[0].ConversationID != newer.ID {
			t.Fatalf("conversation_id = %q, want latest %q", records[0].ConversationID, newer.ID)
		}
	})

	t.Run("no conversation is a no-op, does not fabricate conversation id", func(t *testing.T) {
		// 反馈 8003 没有任何关联会话
		feedback := models.Feedback{ID: 8003, ProjectID: 11}

		syncDeveloperReplyToAgentMessages(db, feedback, "不应写入")

		var records []AgentMessageRecord
		if err := db.Where("feedback_id = ? AND sender_type = ?", 8003, "developer").Find(&records).Error; err != nil {
			t.Fatalf("query: %v", err)
		}
		if len(records) != 0 {
			t.Fatalf("records = %d, want 0 (无会话不应写入 agent_message_records)", len(records))
		}
	})
}

