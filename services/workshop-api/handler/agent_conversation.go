package handler

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentConversation Agent 对话
type AgentConversation struct {
	ID           string         `json:"id" gorm:"primaryKey;type:varchar(128)"`
	FeedbackID   uint           `json:"feedback_id" gorm:"not null;index"`
	ProjectID    uint           `json:"project_id" gorm:"not null;index"`
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`
}

func (AgentConversation) TableName() string {
	return "agent_conversations"
}

// AgentMessageRecord Agent 消息记录
type AgentMessageRecord struct {
	ID             uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	ConversationID string         `json:"conversation_id" gorm:"type:varchar(128);not null;index"`
	FeedbackID     uint           `json:"feedback_id" gorm:"not null;index"`
	ProjectID      uint           `json:"project_id" gorm:"not null;index"`
	SenderType     string         `json:"sender_type" gorm:"type:varchar(32);not null"` // customer, agent, system
	Content        string         `json:"content" gorm:"type:text;not null"`
	ToolCalls      *string        `json:"tool_calls,omitempty" gorm:"type:jsonb"` // JSON array of tool calls
	ToolResults    *string        `json:"tool_results,omitempty" gorm:"type:jsonb"` // JSON array of tool results
	Confidence     *float64       `json:"confidence,omitempty" gorm:"type:decimal(3,2)"`
	Metadata       *string        `json:"metadata,omitempty" gorm:"type:jsonb"`
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`
}

func (AgentMessageRecord) TableName() string {
	return "agent_message_records"
}

// CreateConversation 创建新对话
func CreateConversation(db *gorm.DB, feedbackID, projectID uint) (*AgentConversation, error) {
	conv := &AgentConversation{
		ID:         uuid.New().String(),
		FeedbackID: feedbackID,
		ProjectID:  projectID,
	}

	if err := db.Create(conv).Error; err != nil {
		return nil, err
	}

	return conv, nil
}

// GetConversation 获取对话
func GetConversation(db *gorm.DB, conversationID string) (*AgentConversation, error) {
	var conv AgentConversation
	if err := db.Where("id = ?", conversationID).First(&conv).Error; err != nil {
		return nil, err
	}
	return &conv, nil
}

// GetOrCreateConversation 获取或创建对话
func GetOrCreateConversation(db *gorm.DB, conversationID string, feedbackID, projectID uint) (*AgentConversation, error) {
	if conversationID != "" {
		conv, err := GetConversation(db, conversationID)
		if err == nil {
			return conv, nil
		}
	}

	return CreateConversation(db, feedbackID, projectID)
}

// SaveMessage 保存消息
func SaveMessage(db *gorm.DB, msg *AgentMessageRecord) error {
	return db.Create(msg).Error
}

// GetConversationHistory 获取对话历史
func GetConversationHistory(db *gorm.DB, conversationID string, limit int) ([]AgentMessageRecord, error) {
	if limit <= 0 {
		limit = 20
	}

	var messages []AgentMessageRecord
	err := db.Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Limit(limit).
		Find(&messages).Error

	return messages, err
}

// GetFeedbackConversations 获取反馈关联的所有对话
func GetFeedbackConversations(db *gorm.DB, feedbackID uint) ([]AgentConversation, error) {
	var convs []AgentConversation
	err := db.Where("feedback_id = ?", feedbackID).
		Order("created_at DESC").
		Find(&convs).Error
	return convs, err
}

// GetConversationMessages 获取对话的所有消息
func GetConversationMessages(db *gorm.DB, conversationID string) ([]AgentMessageRecord, error) {
	var messages []AgentMessageRecord
	err := db.Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// FormatHistoryForLLM 将消息历史格式化为 LLM 可读格式
func FormatHistoryForLLM(messages []AgentMessageRecord) []map[string]string {
	var history []map[string]string

	for _, msg := range messages {
		role := "user"
		if msg.SenderType == "agent" || msg.SenderType == "system" {
			role = "assistant"
		}

		history = append(history, map[string]string{
			"role":    role,
			"content": msg.Content,
		})
	}

	return history
}

// BuildMessages 构建 LLM 消息列表
func BuildMessages(systemPrompt string, history []map[string]string, currentQuery string) []map[string]string {
	var messages []map[string]string

	// 系统提示
	messages = append(messages, map[string]string{
		"role":    "system",
		"content": systemPrompt,
	})

	// 历史消息（最近10条）
	if len(history) > 10 {
		history = history[len(history)-10:]
	}
	messages = append(messages, history...)

	// 当前问题
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": currentQuery,
	})

	return messages
}

// GetSystemPrompt 获取系统提示（人设单一事实来源：arcOrbitAgentPersona）。
func GetSystemPrompt(projectID uint) string {
	return arcOrbitAgentPersona + `

## 能力
- 搜索客户代码仓库，查找相关函数、类、模块的实现
- 搜索项目文档，了解需求和设计
- 搜索产品知识库，获取FAQ和最佳实践

## 回复格式
- 先直接回答问题
- 再提供相关来源（文件路径、文档链接）
- 如有代码示例，用代码块展示

## 工具调用
如果你需要搜索信息，请使用以下格式：
` + "```json" + `
{
  "tool": "工具名称",
  "params": {
    "query": "搜索关键词"
  }
}
` + "```" + `

可用工具：
- search_customer_code: 搜索客户代码仓库
- search_customer_docs: 搜索项目文档
- search_product_knowledge: 搜索产品知识库`
}
