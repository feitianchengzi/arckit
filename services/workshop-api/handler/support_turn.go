package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"strings"
	"todo/models"
)

// supportTurn keeps receipt + customer/agent messages in one transaction. A
// crashed/failed request rolls back as a unit; a completed retry replays the result.
type supportTurn struct {
	DB     *gorm.DB
	Replay *AgentMessageResponse
	id     string
	done   bool
}

func beginSupportTurn(db *gorm.DB, scope string, req AgentMessageRequestSession) (*supportTurn, error) {
	if len(req.ClientMessageID) > 128 {
		return nil, fmt.Errorf("client_message_id过长")
	}
	key := strings.TrimSpace(req.ClientMessageID)
	if key == "" {
		key = uuid.NewString()
	}
	id := sha256.Sum256([]byte(scope + "\x00" + key))
	raw, _ := json.Marshal(req)
	hash := sha256.Sum256(raw)
	row := models.SupportTurn{ID: hex.EncodeToString(id[:]), RequestHash: hex.EncodeToString(hash[:]), Response: "null"}
	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	receipt := &supportTurn{DB: tx, id: row.ID}
	result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
	if result.Error != nil {
		receipt.Rollback()
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		var stored models.SupportTurn
		if err := tx.First(&stored, "id = ?", row.ID).Error; err != nil {
			receipt.Rollback()
			return nil, err
		}
		if stored.RequestHash != row.RequestHash {
			receipt.Rollback()
			return nil, fmt.Errorf("同一client_message_id不能发送不同内容")
		}
		var replay AgentMessageResponse
		if json.Unmarshal([]byte(stored.Response), &replay) != nil || replay.MessageID == 0 {
			receipt.Rollback()
			return nil, fmt.Errorf("消息正在处理，请稍后重试")
		}
		receipt.Replay = &replay
	}
	return receipt, nil
}
func (t *supportTurn) Rollback() {
	if !t.done {
		t.DB.Rollback()
		t.done = true
	}
}
func (t *supportTurn) Complete(response AgentMessageResponse) error {
	raw, err := json.Marshal(response)
	if err != nil {
		return err
	}
	if err = t.DB.Model(&models.SupportTurn{}).Where("id = ?", t.id).Update("response", string(raw)).Error; err != nil {
		return err
	}
	if err = t.DB.Commit().Error; err != nil {
		return err
	}
	t.done = true
	return nil
}
