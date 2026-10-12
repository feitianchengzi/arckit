package handler

import (
	"net/http"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ConversationMessageView 统一会话视图条目：聚合 agent_message_records 与 feedback_messages。
// source 标记来源：agent（智能客服会话消息）/ feedback（反馈消息流，含客户首条与客服跟进）。
type ConversationMessageView struct {
	ID          uint                                `json:"id"`
	Source      string                              `json:"source"` // agent | feedback
	SenderType  string                              `json:"sender_type"`
	Content     string                              `json:"content"`
	Confidence   *float64                            `json:"confidence,omitempty"`
	Attachments []FeedbackMessageAttachmentResponse  `json:"attachments,omitempty"`
	CreatedAt   time.Time                            `json:"created_at"`
}

// aggregateConversationMessages 按 feedback_id 聚合两条消息流为统一会话视图：
// agent_message_records（客户与 Agent 的咨询 + Agent 回答 + 客服经 P3 同步的回复）
// 与 feedback_messages（反馈消息流：客户首条、客服 developer 回复、system 消息）。
// 按 created_at 升序合并，source 标注来源表。feedback 来源消息带附件（agent 来源无附件）。
func aggregateConversationMessages(db *gorm.DB, feedbackID uint) []ConversationMessageView {
	var agentRecords []AgentMessageRecord
	_ = db.Where("feedback_id = ?", feedbackID).
		Order("created_at ASC, id ASC").
		Find(&agentRecords).Error

	var feedbackMessages []models.FeedbackMessage
	_ = db.Preload("Attachments", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("created_at ASC, id ASC")
	}).Where("feedback_id = ?", feedbackID).
		Order("created_at ASC, id ASC").
		Find(&feedbackMessages).Error

	// P3 的 syncDeveloperReplyToAgentMessages 把客服 developer 回复复制进 agent_message_records，
	// 但 feedback_messages 里本就有该原始记录。聚合时去重：agent 表里 sender_type=developer 且
	// 内容与 feedback 表某条 developer 消息相同的记录是复制件，跳过，避免统一视图重复展示。
	// 不用时间窗判定——agent_message_records.created_at 是 timestamp without time zone，
	// feedback_messages.created_at 是 timestamp with time zone，两者相减会差一个时区（8h），
	// 时间窗不可靠。内容相同 + 同为 developer 即可判定为 P3 复制件。
	feedbackDeveloperContents := make(map[string]bool, len(feedbackMessages))
	for _, m := range feedbackMessages {
		if m.SenderType == "developer" {
			feedbackDeveloperContents[m.Content] = true
		}
	}
	isMirroredDeveloper := func(r AgentMessageRecord) bool {
		return r.SenderType == "developer" && feedbackDeveloperContents[r.Content]
	}

	views := make([]ConversationMessageView, 0, len(agentRecords)+len(feedbackMessages))
	for _, r := range agentRecords {
		if isMirroredDeveloper(r) {
			continue // 跳过 P3 复制件，保留 feedback 原始记录
		}
		views = append(views, ConversationMessageView{
			ID:         r.ID,
			Source:     "agent",
			SenderType: r.SenderType,
			Content:    r.Content,
			Confidence: r.Confidence,
			CreatedAt:  r.CreatedAt,
		})
	}
	for _, m := range feedbackMessages {
		attachments := make([]FeedbackMessageAttachmentResponse, 0, len(m.Attachments))
		for _, a := range m.Attachments {
			attachments = append(attachments, buildFeedbackMessageAttachmentResponse(a))
		}
		views = append(views, ConversationMessageView{
			ID:          m.ID,
			Source:      "feedback",
			SenderType:  m.SenderType,
			Content:     m.Content,
			Attachments: attachments,
			CreatedAt:   m.CreatedAt,
		})
	}

	// 合并后按 created_at 升序排序（稳定：同时间保持 agent 在前）
	sortConversationMessagesByTime(views)
	return views
}

// sortConversationMessagesByTime 按创建时间升序排序会话视图，时间相同者保持 agent 在 feedback 前。
func sortConversationMessagesByTime(views []ConversationMessageView) {
	for i := 1; i < len(views); i++ {
		for j := i; j > 0; j-- {
			if views[j].CreatedAt.Before(views[j-1].CreatedAt) {
				views[j], views[j-1] = views[j-1], views[j]
			} else {
				break
			}
		}
	}
}

// GetFeedbackConversationMessages 返回某反馈的统一会话视图（user/apikey 模式共用）。
// 鉴权与 GetFeedbackMessages 一致：项目成员校验 + apiKey 模式额外校验客户归属。
// GET /workshop/v2/user/feedbacks/:id/conversation-messages
// GET /workshop/v2/apikey/feedbacks/:id/conversation-messages
func GetFeedbackConversationMessages(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}
	if _, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "查看会话消息"); !ok {
		return
	}
	if isAPIKeyRequest(c) {
		if _, ok := requireCustomerFeedbackAccess(c, feedback, c.Query("custom_user_id")); !ok {
			return
		}
	}
	views := aggregateConversationMessages(db, feedback.ID)
	c.JSON(http.StatusOK, response.NewSuccessResponse(views))
}
