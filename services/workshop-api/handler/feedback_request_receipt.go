package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"strings"
	"todo/models"
)

// The receipt and feedback are committed together. Retrying after a lost response
// returns the same feedback; a changed payload cannot silently reuse that receipt.
func lockFeedbackRequest(tx *gorm.DB, projectID uint, customer, key string, payload interface{}) (string, *models.Feedback, error) {
	key = strings.TrimSpace(key)
	if key == "" {
		return "", nil, nil
	}
	if len(key) > 128 {
		return "", nil, fmt.Errorf("提交标识过长，请重新打开反馈表单")
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", nil, err
	}
	var normalized map[string]interface{}
	if err = json.Unmarshal(raw, &normalized); err != nil {
		return "", nil, err
	}
	// Confirmation timestamps can change across a transport retry; the facts cannot.
	if value, ok := normalized["data"].(string); ok {
		var data interface{}
		if json.Unmarshal([]byte(value), &data) == nil {
			normalized["data"] = data
		}
	}
	if data, ok := normalized["data"].(map[string]interface{}); ok {
		if confirmation, ok := data["clarification"].(map[string]interface{}); ok {
			delete(confirmation, "confirmed_at")
		}
	}
	raw, _ = json.Marshal(normalized)
	hash := sha256.Sum256(raw)
	id := sha256.Sum256([]byte(fmt.Sprintf("feedback/%d/%s\x00%s", projectID, customer, key)))
	row := models.SupportTurn{ID: hex.EncodeToString(id[:]), RequestHash: hex.EncodeToString(hash[:]), Response: "null"}
	result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
	if result.Error != nil {
		return "", nil, result.Error
	}
	if result.RowsAffected > 0 {
		return row.ID, nil, nil
	}
	var stored models.SupportTurn
	if err := tx.First(&stored, "id = ?", row.ID).Error; err != nil {
		return "", nil, err
	}
	if stored.RequestHash != row.RequestHash {
		return "", nil, fmt.Errorf("提交内容已变化，请重新核对后提交")
	}
	var receipt struct {
		FeedbackID uint `json:"feedback_id"`
	}
	if json.Unmarshal([]byte(stored.Response), &receipt) != nil || receipt.FeedbackID == 0 {
		return "", nil, fmt.Errorf("反馈正在提交，请稍后重试")
	}
	var feedback models.Feedback
	if err := tx.Where("id = ? AND project_id = ? AND custom_user_id = ?", receipt.FeedbackID, projectID, customer).First(&feedback).Error; err != nil {
		return "", nil, err
	}
	return row.ID, &feedback, nil
}
func finishFeedbackRequest(tx *gorm.DB, id string, feedbackID uint) error {
	if id == "" {
		return nil
	}
	raw, _ := json.Marshal(map[string]uint{"feedback_id": feedbackID})
	return tx.Model(&models.SupportTurn{}).Where("id = ?", id).Update("response", string(raw)).Error
}
