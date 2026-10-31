package handler

import (
	"encoding/json"
	"testing"
	"todo/models"
)

func TestSupportTurnReplayAndConflict(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&models.SupportTurn{}); err != nil {
		t.Fatal(err)
	}
	req := AgentMessageRequestSession{Content: "导出失败", ClientMessageID: "turn-1"}
	first, err := beginSupportTurn(db, "project7/alice", req)
	if err != nil {
		t.Fatal(err)
	}
	if first.Replay != nil {
		t.Fatal("first request replayed")
	}
	expected := AgentMessageResponse{MessageID: 12, ConversationID: "conversation-1", Content: "请补充复现步骤"}
	if err = first.Complete(expected); err != nil {
		t.Fatal(err)
	}
	again, err := beginSupportTurn(db, "project7/alice", req)
	if err != nil {
		t.Fatal(err)
	}
	defer again.Rollback()
	if again.Replay == nil || again.Replay.MessageID != 12 {
		t.Fatal("completed turn did not replay")
	}
	req.Content = "不同内容"
	if _, err = beginSupportTurn(db, "project7/alice", req); err == nil {
		t.Fatal("accepted mismatched idempotency content")
	}
	other, err := beginSupportTurn(db, "project7/bob", req)
	if err != nil {
		t.Fatal(err)
	}
	other.Rollback()
	raw, _ := json.Marshal(expected)
	if len(raw) == 0 {
		t.Fatal("empty contract")
	}
}
func TestSupportTurnRollbackAllowsSafeRetry(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&models.SupportTurn{}); err != nil {
		t.Fatal(err)
	}
	req := AgentMessageRequestSession{Content: "问题", ClientMessageID: "retry-1"}
	first, err := beginSupportTurn(db, "scope", req)
	if err != nil {
		t.Fatal(err)
	}
	first.Rollback()
	second, err := beginSupportTurn(db, "scope", req)
	if err != nil {
		t.Fatal(err)
	}
	defer second.Rollback()
	if second.Replay != nil {
		t.Fatal("rolled-back turn replayed")
	}
}
