package handler

import (
	"encoding/json"
	"net/http"
	"sort"
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
	Confidence  *float64                            `json:"confidence,omitempty"`
	Attachments []FeedbackMessageAttachmentResponse `json:"attachments,omitempty"`
	CreatedAt   time.Time                           `json:"created_at"`
}

// aggregateConversationMessages 按 feedback_id 聚合两条消息流为统一会话视图：
// agent_message_records（客户与 Agent 的咨询 + Agent 回答 + 客服经 P3 同步的回复）
// 与 feedback_messages（反馈消息流：客户首条、客服 developer 回复、system 消息）。
// 按 created_at 升序合并，source 标注来源表。feedback 来源消息带附件（agent 来源无附件）。
func aggregateConversationMessages(db *gorm.DB, feedbackID uint) []ConversationMessageView {
	views, _ := loadConversationMessages(db, feedbackID)
	return views
}

func loadConversationMessages(db *gorm.DB, feedbackID uint) ([]ConversationMessageView, error) {
	var agentRecords []AgentMessageRecord
	if err := db.Where("feedback_id = ?", feedbackID).
		Order("created_at ASC, id ASC").
		Find(&agentRecords).Error; err != nil {
		return nil, err
	}

	var feedbackMessages []models.FeedbackMessage
	if err := db.Preload("Attachments", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("created_at ASC, id ASC")
	}).Where("feedback_id = ? AND state = ?", feedbackID, models.FeedbackMessageStateSent).
		Order("created_at ASC, id ASC").
		Find(&feedbackMessages).Error; err != nil {
		return nil, err
	}

	// Mirrored replies must carry their original message ID; identical text is
	// legitimate for distinct replies and must never be used as identity.
	feedbackIDs := map[uint]bool{}
	for _, m := range feedbackMessages {
		feedbackIDs[m.ID] = true
	}
	isMirroredDeveloper := func(r AgentMessageRecord) bool {
		if r.SenderType != "developer" || r.Metadata == nil {
			return false
		}
		var meta struct {
			FeedbackMessageID uint `json:"feedback_message_id"`
		}
		_ = json.Unmarshal([]byte(*r.Metadata), &meta)
		return meta.FeedbackMessageID > 0 && feedbackIDs[meta.FeedbackMessageID]
	}

	views := make([]ConversationMessageView, 0, len(agentRecords)+len(feedbackMessages))
	for _, r := range agentRecords {
		if isMirroredDeveloper(r) {
			continue // 跳过 P3 复制件，保留 feedback 原始记录
		}
		views = append(views, ConversationMessageView{
			ID:          r.ID,
			Source:      "agent",
			SenderType:  r.SenderType,
			Content:     r.Content,
			Confidence:  r.Confidence,
			CreatedAt:   r.CreatedAt,
			Attachments: agentRecordAttachments(r),
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
	return views, nil
}

// sortConversationMessagesByTime 按创建时间升序排序会话视图，时间相同者保持 agent 在 feedback 前。
func sortConversationMessagesByTime(views []ConversationMessageView) {
	sort.SliceStable(views, func(i, j int) bool {
		if views[i].CreatedAt.Equal(views[j].CreatedAt) {
			if views[i].Source != views[j].Source {
				return views[i].Source < views[j].Source
			}
			return views[i].ID < views[j].ID
		}
		return views[i].CreatedAt.Before(views[j].CreatedAt)
	})
}

// respondConversationPage keeps the historical data-array shape while making
// long conversations navigable. Missing pagination parameters retain legacy
// all-history behavior; SDK always supplies explicit page/page_size.
// conversationIdentityQuery pages identifiers before fetching bodies/media so a
// long-running support thread never loads its entire history per page.
const conversationIdentityQuery = `(SELECT am.id, 'agent' AS source, am.created_at FROM agent_message_records am
 WHERE am.feedback_id = ? AND am.delete_at IS NULL AND NOT (am.sender_type='developer' AND EXISTS
 (SELECT 1 FROM feedback_messages fm WHERE fm.feedback_id=am.feedback_id AND fm.delete_at IS NULL AND fm.state='sent'
 AND CAST(fm.id AS TEXT)=am.metadata->>'feedback_message_id'))
 UNION ALL SELECT fm.id, 'feedback' AS source, fm.created_at FROM feedback_messages fm
 WHERE fm.feedback_id = ? AND fm.delete_at IS NULL AND fm.state='sent') AS entries`

func loadConversationPage(db *gorm.DB, feedbackID uint, offset, limit int) ([]ConversationMessageView, int, error) {
	var count int64
	if err := db.Raw("SELECT COUNT(*) FROM "+conversationIdentityQuery, feedbackID, feedbackID).Scan(&count).Error; err != nil {
		return nil, 0, err
	}
	var keys []struct {
		ID        uint
		Source    string
		CreatedAt time.Time
	}
	if err := db.Raw("SELECT * FROM "+conversationIdentityQuery+" ORDER BY created_at ASC, source ASC, id ASC OFFSET ? LIMIT ?", feedbackID, feedbackID, offset, limit).Scan(&keys).Error; err != nil {
		return nil, 0, err
	}
	agentIDs := []uint{}
	feedbackIDs := []uint{}
	for _, k := range keys {
		if k.Source == "agent" {
			agentIDs = append(agentIDs, k.ID)
		} else {
			feedbackIDs = append(feedbackIDs, k.ID)
		}
	}
	views := make([]ConversationMessageView, 0, len(keys))
	if len(agentIDs) > 0 {
		var records []AgentMessageRecord
		if err := db.Where("feedback_id = ? AND id IN ?", feedbackID, agentIDs).Find(&records).Error; err != nil {
			return nil, 0, err
		}
		for _, r := range records {
			views = append(views, ConversationMessageView{ID: r.ID, Source: "agent", SenderType: r.SenderType, Content: r.Content, Confidence: r.Confidence, CreatedAt: r.CreatedAt, Attachments: agentRecordAttachments(r)})
		}
	}
	if len(feedbackIDs) > 0 {
		var records []models.FeedbackMessage
		if err := db.Preload("Attachments").Where("feedback_id = ? AND id IN ?", feedbackID, feedbackIDs).Find(&records).Error; err != nil {
			return nil, 0, err
		}
		for _, r := range records {
			attachments := make([]FeedbackMessageAttachmentResponse, 0, len(r.Attachments))
			for _, att := range r.Attachments {
				attachments = append(attachments, buildFeedbackMessageAttachmentResponse(att))
			}
			views = append(views, ConversationMessageView{ID: r.ID, Source: "feedback", SenderType: r.SenderType, Content: r.Content, CreatedAt: r.CreatedAt, Attachments: attachments})
		}
	}
	sortConversationMessagesByTime(views)
	return views, int(count), nil
}
func respondConversationPage(c *gin.Context, db *gorm.DB, feedbackID uint) {
	if c.Query("page") == "" && c.Query("page_size") == "" {
		views, err := loadConversationMessages(db, feedbackID)
		if err != nil {
			lifecycleError(c, err)
			return
		}
		c.JSON(200, response.NewSuccessResponse(views))
		return
	}
	pagination, _ := ParsePagination(c)
	views, total, err := loadConversationPage(db, feedbackID, pagination.Offset, pagination.Limit)
	if err != nil {
		lifecycleError(c, err)
		return
	}
	c.JSON(200, response.NewSuccessResponseWithMeta(views, response.Meta{Page: pagination.Page, PageSize: pagination.PageSize, Total: total}))
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
	respondConversationPage(c, db, feedback.ID)
}
