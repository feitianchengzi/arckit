package handler

import (
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestConversationHistoryKeepsLatestWindowInChronologicalOrder(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	conversation := AgentConversation{ID: uuid.NewString(), ProjectID: 11}
	if err := db.Create(&conversation).Error; err != nil {
		t.Fatal(err)
	}
	stamp := time.Now()
	for i := 1; i <= 25; i++ {
		if err := SaveMessage(db, &AgentMessageRecord{ConversationID: conversation.ID, ProjectID: 11, SenderType: "customer", Content: fmt.Sprint(i), CreatedAt: stamp}); err != nil {
			t.Fatal(err)
		}
	}
	history, err := GetConversationHistory(db, conversation.ID, 20)
	if err != nil {
		t.Fatal(err)
	}
	if len(history) != 20 || history[0].Content != "6" || history[19].Content != "25" {
		t.Fatalf("latest turn lost or history reversed: %+v", history)
	}
}

// TestLinkStandaloneConversationToFeedback 验证提交反馈时把独立会话（feedback_id=0）
// 关联到新建反馈，且不越权关联他客户/他项目的会话。DB-gated，无 DSN 跳过。
func TestLinkStandaloneConversationToFeedback(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)

	t.Run("links own standalone conversation to new feedback", func(t *testing.T) {
		convID := uuid.New().String()
		conv := AgentConversation{
			ID:           convID,
			FeedbackID:   standaloneConversationFeedbackID,
			ProjectID:    11,
			CustomUserID: "c1",
		}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create standalone conv: %v", err)
		}

		record := AgentMessageRecord{ConversationID: convID, ProjectID: 11, FeedbackID: 0, SenderType: "customer", Content: "Original consultation"}
		if err := db.Create(&record).Error; err != nil {
			t.Fatal(err)
		}
		if err := linkStandaloneConversationToFeedback(db, convID, 9001, 11, "c1"); err != nil {
			t.Fatalf("link: %v", err)
		}

		var got AgentConversation
		if err := db.Where("id = ?", convID).First(&got).Error; err != nil {
			t.Fatalf("reload: %v", err)
		}

		var linked AgentMessageRecord
		if err := db.First(&linked, record.ID).Error; err != nil {
			t.Fatal(err)
		}
		if linked.FeedbackID != 9001 {
			t.Fatalf("message feedback_id=%d, want 9001", linked.FeedbackID)
		}
		if got.FeedbackID != 9001 {
			t.Fatalf("feedback_id = %d, want 9001", got.FeedbackID)
		}
	})

	t.Run("does not link conversation belonging to another customer", func(t *testing.T) {
		convID := uuid.New().String()
		conv := AgentConversation{
			ID:           convID,
			FeedbackID:   standaloneConversationFeedbackID,
			ProjectID:    11,
			CustomUserID: "c2",
		}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}

		// c1 试图关联 c2 的会话：校验不通过，静默跳过（不报错也不关联）
		if err := linkStandaloneConversationToFeedback(db, convID, 9002, 11, "c1"); err != nil {
			t.Fatalf("link should silently skip, got err: %v", err)
		}

		var got AgentConversation
		if err := db.Where("id = ?", convID).First(&got).Error; err != nil {
			t.Fatalf("reload: %v", err)
		}
		if got.FeedbackID != standaloneConversationFeedbackID {
			t.Fatalf("feedback_id = %d, want unchanged 0 (跨客户不应关联)", got.FeedbackID)
		}
	})

	t.Run("does not relink an already bound conversation", func(t *testing.T) {
		convID := uuid.New().String()
		conv := AgentConversation{
			ID:           convID,
			FeedbackID:   7777, // 已绑定到其他反馈
			ProjectID:    11,
			CustomUserID: "c1",
		}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}

		if err := linkStandaloneConversationToFeedback(db, convID, 9003, 11, "c1"); err != nil {
			t.Fatalf("link: %v", err)
		}

		var got AgentConversation
		if err := db.Where("id = ?", convID).First(&got).Error; err != nil {
			t.Fatalf("reload: %v", err)
		}
		if got.FeedbackID != 7777 {
			t.Fatalf("feedback_id = %d, want unchanged 7777 (已绑定会话不应被改绑)", got.FeedbackID)
		}
	})

	t.Run("empty conversation id is a no-op", func(t *testing.T) {
		if err := linkStandaloneConversationToFeedback(db, "", 9004, 11, "c1"); err != nil {
			t.Fatalf("empty id should no-op, got err: %v", err)
		}
	})
}
