package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	agentTurnAccepted     = "accepted"
	agentTurnRunning      = "running"
	agentTurnInterrupting = "interrupting"
	agentTurnInterrupted  = "interrupted"
	agentTurnCompleted    = "completed"
	agentTurnFailed       = "failed"

	// GORM splits the OpenHands initialism into open_hands. Keep raw SQL and
	// map-based updates aligned with the model's actual PostgreSQL column.
	agentTurnOpenHandsConversationColumn = "open_hands_conversation_id"
)

var errAgentTurnInterrupted = errors.New("agent turn interrupted")

type agentTurnReceipt struct {
	DB     *gorm.DB
	Record models.AgentTurn
	Replay *AgentMessageResponse
}

type agentTurnStatusResponse struct {
	TurnID string `json:"turn_id"`
	State  string `json:"state"`
}

func agentTurnID(projectID uint, customUserID, clientMessageID string) string {
	raw := fmt.Sprintf("%d\x00%s\x00%s", projectID, strings.TrimSpace(customUserID), strings.TrimSpace(clientMessageID))
	digest := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(digest[:])
}

func beginAgentTurn(db *gorm.DB, projectID uint, customUserID string, feedbackID uint, req *AgentMessageRequestSession) (*agentTurnReceipt, error) {
	if db == nil || req == nil || projectID == 0 || strings.TrimSpace(customUserID) == "" {
		return nil, fmt.Errorf("Agent Turn 作用域无效")
	}
	if len(req.ClientMessageID) > 128 {
		return nil, fmt.Errorf("client_message_id过长")
	}
	if strings.TrimSpace(req.ClientMessageID) == "" {
		req.ClientMessageID = uuid.NewString()
	}
	req.ClientMessageID = strings.TrimSpace(req.ClientMessageID)
	raw, _ := json.Marshal(req)
	requestHash := sha256.Sum256(raw)
	record := models.AgentTurn{
		ID:              agentTurnID(projectID, customUserID, req.ClientMessageID),
		ClientMessageID: req.ClientMessageID,
		RequestHash:     hex.EncodeToString(requestHash[:]),
		ProjectID:       projectID,
		CustomUserID:    strings.TrimSpace(customUserID),
		FeedbackID:      feedbackID,
		State:           agentTurnAccepted,
		Response:        "null",
	}
	result := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&record)
	if result.Error != nil {
		return nil, result.Error
	}
	receipt := &agentTurnReceipt{DB: db, Record: record}
	if result.RowsAffected > 0 {
		return receipt, nil
	}
	var stored models.AgentTurn
	if err := db.First(&stored, "id = ?", record.ID).Error; err != nil {
		return nil, err
	}
	if stored.RequestHash != record.RequestHash || stored.FeedbackID != feedbackID {
		return nil, fmt.Errorf("同一client_message_id不能发送不同内容")
	}
	receipt.Record = stored
	if stored.State == agentTurnCompleted {
		var replay AgentMessageResponse
		if json.Unmarshal([]byte(stored.Response), &replay) == nil && replay.MessageID > 0 {
			receipt.Replay = &replay
			return receipt, nil
		}
	}
	if stored.State == agentTurnInterrupted || stored.State == agentTurnInterrupting {
		receipt.Replay = interruptedAgentTurnResponse(stored)
		return receipt, nil
	}
	if stored.State == agentTurnFailed {
		return nil, fmt.Errorf("上一轮处理失败，请重新发送")
	}
	return nil, fmt.Errorf("消息正在处理，请稍后重试")
}

func interruptedAgentTurnResponse(turn models.AgentTurn) *AgentMessageResponse {
	return &AgentMessageResponse{
		TurnID:            turn.ClientMessageID,
		Status:            agentTurnInterrupted,
		Interrupted:       true,
		CustomerMessageID: turn.CustomerMessageID,
		ConversationID:    turn.ConversationID,
		SenderType:        "agent",
	}
}

func (t *agentTurnReceipt) BindLocal(conversationID string, customerMessageID uint) error {
	if t == nil {
		return nil
	}
	updates := map[string]interface{}{"conversation_id": conversationID, "customer_message_id": customerMessageID}
	if err := t.DB.Model(&models.AgentTurn{}).Where("id = ?", t.Record.ID).Updates(updates).Error; err != nil {
		return err
	}
	t.Record.ConversationID = conversationID
	t.Record.CustomerMessageID = customerMessageID
	return nil
}

// BindOpenHands publishes the provider conversation id before waiting for the
// result, allowing a concurrent interrupt request to reach the real Agent.
func (t *agentTurnReceipt) BindOpenHands(conversationID string) (bool, error) {
	if t == nil || strings.TrimSpace(conversationID) == "" {
		return false, nil
	}
	if err := t.DB.Model(&models.AgentTurn{}).Where("id = ?", t.Record.ID).Updates(map[string]interface{}{
		agentTurnOpenHandsConversationColumn: conversationID,
		"state":                              clause.Expr{SQL: "CASE WHEN state = ? THEN ? ELSE state END", Vars: []interface{}{agentTurnAccepted, agentTurnRunning}},
	}).Error; err != nil {
		return false, err
	}
	t.Record.OpenHandsConversationID = conversationID
	var current models.AgentTurn
	if err := t.DB.Select("state").First(&current, "id = ?", t.Record.ID).Error; err != nil {
		return false, err
	}
	return current.State == agentTurnInterrupting || current.State == agentTurnInterrupted, nil
}

func (t *agentTurnReceipt) ShouldInterrupt() bool {
	if t == nil {
		return false
	}
	var current models.AgentTurn
	if err := t.DB.Select("state").First(&current, "id = ?", t.Record.ID).Error; err != nil {
		return false
	}
	return current.State == agentTurnInterrupting || current.State == agentTurnInterrupted
}

func (t *agentTurnReceipt) LatestOpenHandsConversationID(localConversationID string) string {
	if t == nil || strings.TrimSpace(localConversationID) == "" {
		return ""
	}
	var previous models.AgentTurn
	err := t.DB.Select(agentTurnOpenHandsConversationColumn).
		Where("project_id = ? AND custom_user_id = ? AND conversation_id = ? AND "+agentTurnOpenHandsConversationColumn+" <> ''", t.Record.ProjectID, t.Record.CustomUserID, localConversationID).
		Order("updated_at DESC").First(&previous).Error
	if err != nil {
		return ""
	}
	return previous.OpenHandsConversationID
}

func (t *agentTurnReceipt) MarkInterrupted() error {
	if t == nil {
		return nil
	}
	now := time.Now()
	return t.DB.Model(&models.AgentTurn{}).Where("id = ? AND state <> ?", t.Record.ID, agentTurnCompleted).Updates(map[string]interface{}{
		"state": agentTurnInterrupted, "completed_at": &now, "error": "",
	}).Error
}

func (t *agentTurnReceipt) Fail(err error) {
	if t == nil || err == nil || errors.Is(err, errAgentTurnInterrupted) {
		return
	}
	now := time.Now()
	_ = t.DB.Model(&models.AgentTurn{}).Where("id = ? AND state NOT IN ?", t.Record.ID, []string{agentTurnCompleted, agentTurnInterrupted}).Updates(map[string]interface{}{
		"state": agentTurnFailed, "completed_at": &now, "error": err.Error(),
	}).Error
}

func (t *agentTurnReceipt) Complete(tx *gorm.DB, result AgentMessageResponse) error {
	if t == nil {
		return nil
	}
	raw, err := json.Marshal(result)
	if err != nil {
		return err
	}
	now := time.Now()
	updated := tx.Model(&models.AgentTurn{}).
		Where("id = ? AND state IN ?", t.Record.ID, []string{agentTurnAccepted, agentTurnRunning}).
		Updates(map[string]interface{}{"state": agentTurnCompleted, "response": string(raw), "completed_at": &now, "error": ""})
	if updated.Error != nil {
		return updated.Error
	}
	if updated.RowsAffected == 0 {
		return errAgentTurnInterrupted
	}
	return nil
}

func interruptAgentTurn(c *gin.Context, projectID uint, customUserID string) {
	turnID := strings.TrimSpace(c.Param("turnId"))
	if turnID == "" || len(turnID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少有效的 Turn ID", nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	var turn models.AgentTurn
	if err := db.First(&turn, "id = ?", agentTurnID(projectID, customUserID, turnID)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeNotFound, "运行中的 Agent 任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "查询 Agent 任务失败", nil))
		return
	}
	if turn.State == agentTurnCompleted || turn.State == agentTurnFailed || turn.State == agentTurnInterrupted {
		c.JSON(http.StatusOK, response.NewSuccessResponse(agentTurnStatusResponse{TurnID: turnID, State: turn.State}))
		return
	}
	now := time.Now()
	updated := db.Model(&models.AgentTurn{}).
		Where("id = ? AND state IN ?", turn.ID, []string{agentTurnAccepted, agentTurnRunning, agentTurnInterrupting}).
		Updates(map[string]interface{}{"state": agentTurnInterrupting, "stop_requested_at": &now})
	if updated.Error != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "停止 Agent 任务失败", nil))
		return
	}
	if updated.RowsAffected == 0 {
		if err := db.First(&turn, "id = ?", turn.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "查询 Agent 任务失败", nil))
			return
		}
		c.JSON(http.StatusOK, response.NewSuccessResponse(agentTurnStatusResponse{TurnID: turnID, State: turn.State}))
		return
	}
	if turn.OpenHandsConversationID != "" {
		agent := getAgentServerByProject(db, projectID)
		if agent == nil {
			_ = db.Model(&models.AgentTurn{}).Where("id = ?", turn.ID).Update("state", agentTurnRunning).Error
			c.JSON(http.StatusServiceUnavailable, response.NewErrorResponse(response.CodeInternalError, "Agent 服务暂时无法停止，请重试", nil))
			return
		}
		if err := ohInterruptConversation(agent, turn.OpenHandsConversationID); err != nil {
			_ = db.Model(&models.AgentTurn{}).Where("id = ?", turn.ID).Update("state", agentTurnRunning).Error
			c.JSON(http.StatusBadGateway, response.NewErrorResponse(response.CodeInternalError, "Agent 暂未停止，请重试", nil))
			return
		}
	}
	completed := time.Now()
	if err := db.Model(&models.AgentTurn{}).Where("id = ? AND state <> ?", turn.ID, agentTurnCompleted).Updates(map[string]interface{}{
		"state": agentTurnInterrupted, "completed_at": &completed, "error": "",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "保存停止状态失败", nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(agentTurnStatusResponse{TurnID: turnID, State: agentTurnInterrupted}))
}

func InterruptAgentTurnFromSession(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	interruptAgentTurn(c, scope.ProjectID, scope.CustomUserID)
}

func InterruptAgentTurnByAPIKey(c *gin.Context) {
	scope, ok := parseStandaloneScopeQuery(c)
	if !ok {
		return
	}
	interruptAgentTurn(c, scope.ProjectID, scope.CustomUserID)
}
