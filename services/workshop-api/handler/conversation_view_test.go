package handler

import (
	"testing"
	"time"

	"todo/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TestAggregateConversationMessages 验证按 feedback_id 聚合 agent_message_records 与
// feedback_messages 为统一会话视图：两表合并、按 created_at 排序、标注来源。
// DB-gated，无 DSN 跳过。
func TestAggregateConversationMessages(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)

	t.Run("merges agent and feedback messages ordered by created_at", func(t *testing.T) {
		feedbackID := uint(8101)
		convID := uuid.New().String()
		conv := AgentConversation{ID: convID, FeedbackID: feedbackID, ProjectID: 11, CustomUserID: "c1"}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}

		// agent 表：客户问 + Agent 答（时间早）
		early := time.Now().Add(-2 * time.Minute)
		mustCreateAgentRecord(t, db, AgentMessageRecord{
			ConversationID: convID, FeedbackID: feedbackID, ProjectID: 11,
			SenderType: "customer", Content: "导出乱码怎么办", CreatedAt: early,
		})
		conf := 0.9
		mustCreateAgentRecord(t, db, AgentMessageRecord{
			ConversationID: convID, FeedbackID: feedbackID, ProjectID: 11,
			SenderType: "agent", Content: "已定位到导出代码", Confidence: &conf, CreatedAt: early.Add(1 * time.Minute),
		})

		// feedback 表：客服跟进（时间晚）
		late := early.Add(3 * time.Minute)
		mustCreateFeedbackMessage(t, db, models.FeedbackMessage{
			FeedbackID: feedbackID, ProjectID: 11, SenderType: "developer",
			Content: "已修复，请验证", CreatedAt: late,
		})

		views := aggregateConversationMessages(db, feedbackID)
		if len(views) != 3 {
			t.Fatalf("views = %d, want 3", len(views))
		}
		// 按 created_at 升序
		if views[0].Content != "导出乱码怎么办" {
			t.Fatalf("views[0] = %q, want 客户提问", views[0].Content)
		}
		if views[1].Content != "已定位到导出代码" {
			t.Fatalf("views[1] = %q, want agent 回答", views[1].Content)
		}
		if views[2].Content != "已修复，请验证" {
			t.Fatalf("views[2] = %q, want 客服跟进", views[2].Content)
		}
		// 来源标记
		if views[0].Source != "agent" {
			t.Fatalf("views[0].source = %q, want agent", views[0].Source)
		}
		if views[2].Source != "feedback" {
			t.Fatalf("views[2].source = %q, want feedback", views[2].Source)
		}
	})

	t.Run("agent messages carry confidence, feedback messages do not", func(t *testing.T) {
		feedbackID := uint(8102)
		convID := uuid.New().String()
		conv := AgentConversation{ID: convID, FeedbackID: feedbackID, ProjectID: 11, CustomUserID: "c1"}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}
		conf := 0.85
		mustCreateAgentRecord(t, db, AgentMessageRecord{
			ConversationID: convID, FeedbackID: feedbackID, ProjectID: 11,
			SenderType: "agent", Content: "agent 答", Confidence: &conf, CreatedAt: time.Now(),
		})
		mustCreateFeedbackMessage(t, db, models.FeedbackMessage{
			FeedbackID: feedbackID, ProjectID: 11, SenderType: "developer",
			Content: "客服跟进", CreatedAt: time.Now().Add(time.Minute),
		})

		views := aggregateConversationMessages(db, feedbackID)
		if len(views) != 2 {
			t.Fatalf("views = %d, want 2", len(views))
		}
		// agent 来源带 confidence
		var agentView *ConversationMessageView
		for i := range views {
			if views[i].Source == "agent" {
				agentView = &views[i]
			}
		}
		if agentView == nil || agentView.Confidence == nil || *agentView.Confidence != 0.85 {
			t.Fatalf("agent view confidence = %v, want 0.85", agentView)
		}
	})

	t.Run("empty feedback returns empty view", func(t *testing.T) {
		views := aggregateConversationMessages(db, 8199)
		if len(views) != 0 {
			t.Fatalf("views = %d, want 0", len(views))
		}
	})

	t.Run("dedupes developer reply mirrored to agent table by P3 sync", func(t *testing.T) {
		// P3 的 syncDeveloperReplyToAgentMessages 把客服回复复制进 agent_message_records，
		// 但 feedback_messages 里本就有这条 developer 消息。聚合时去重：保留 feedback 原始记录，
		// 跳过 agent 表里 content 相同的 developer 复制件，避免视图重复展示。
		// 不依赖时间窗：两表 created_at 时区不同（agent 表 timestamp without tz 读作 UTC，
		// feedback 表 timestamp with tz），时间差不可靠，只用 content + sender_type 判定。
		feedbackID := uint(8103)
		convID := uuid.New().String()
		conv := AgentConversation{ID: convID, FeedbackID: feedbackID, ProjectID: 11, CustomUserID: "c1"}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatalf("create conv: %v", err)
		}
		base := time.Now()
		// feedback 表：客服原始回复
		mustCreateFeedbackMessage(t, db, models.FeedbackMessage{
			FeedbackID: feedbackID, ProjectID: 11, SenderType: "developer",
			Content: "已修复，请验证", CreatedAt: base,
		})
		// agent 表：P3 同步的复制件（内容相同）
		mustCreateAgentRecord(t, db, AgentMessageRecord{
			ConversationID: convID, FeedbackID: feedbackID, ProjectID: 11,
			SenderType: "developer", Content: "已修复，请验证", CreatedAt: base.Add(13 * time.Millisecond),
		})
		// agent 表：另一条真实的 agent 回答（不应被去重）
		conf := 0.9
		mustCreateAgentRecord(t, db, AgentMessageRecord{
			ConversationID: convID, FeedbackID: feedbackID, ProjectID: 11,
			SenderType: "agent", Content: "已定位代码", Confidence: &conf, CreatedAt: base.Add(-1 * time.Minute),
		})

		views := aggregateConversationMessages(db, feedbackID)
		// 应为 2 条：agent 回答 + 客服回复（agent 表的 developer 复制件被去重）
		if len(views) != 2 {
			t.Fatalf("views = %d, want 2 (agent 回答 + 客服回复，复制件去重)", len(views))
		}
		// 客服回复只出现一次，且来源是 feedback（原始记录）
		devCount := 0
		for _, v := range views {
			if v.SenderType == "developer" {
				devCount++
				if v.Source != "feedback" {
					t.Fatalf("developer 来源 = %q, want feedback (应保留原始记录)", v.Source)
				}
			}
		}
		if devCount != 1 {
			t.Fatalf("developer 出现 %d 次, want 1", devCount)
		}
	})
}

func mustCreateAgentRecord(t *testing.T, db *gorm.DB, r AgentMessageRecord) {
	t.Helper()
	if err := db.Create(&r).Error; err != nil {
		t.Fatalf("create agent record: %v", err)
	}
}

func mustCreateFeedbackMessage(t *testing.T, db *gorm.DB, m models.FeedbackMessage) {
	t.Helper()
	if err := db.Create(&m).Error; err != nil {
		t.Fatalf("create feedback message: %v", err)
	}
}
