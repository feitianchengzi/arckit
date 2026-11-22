package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"todo/models"
)

func TestAgentTurnPersistsInterruptionAndRejectsLateCompletion(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&models.AgentTurn{}); err != nil {
		t.Fatal(err)
	}
	req := AgentMessageRequestSession{Content: "分析导出失败", ClientMessageID: "agent-turn-stop-1"}
	turn, err := beginAgentTurn(db, 7, "alice", 0, &req)
	if err != nil {
		t.Fatal(err)
	}
	if err = turn.BindLocal("conversation-1", 42); err != nil {
		t.Fatal(err)
	}
	if err = turn.MarkInterrupted(); err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	err = turn.Complete(tx, AgentMessageResponse{TurnID: req.ClientMessageID, MessageID: 88, ConversationID: "conversation-1"})
	tx.Rollback()
	if !errors.Is(err, errAgentTurnInterrupted) {
		t.Fatalf("late completion error = %v, want interrupted", err)
	}
	replay, err := beginAgentTurn(db, 7, "alice", 0, &req)
	if err != nil {
		t.Fatal(err)
	}
	if replay.Replay == nil || !replay.Replay.Interrupted || replay.Replay.CustomerMessageID != 42 {
		t.Fatalf("interrupted replay = %#v", replay.Replay)
	}
}

func TestAgentTurnScopeAndEarlyStopRemainBounded(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&models.AgentTurn{}); err != nil {
		t.Fatal(err)
	}
	req := AgentMessageRequestSession{Content: "问题", ClientMessageID: "same-public-turn"}
	alice, err := beginAgentTurn(db, 11, "alice", 0, &req)
	if err != nil {
		t.Fatal(err)
	}
	if err = alice.MarkInterrupted(); err != nil {
		t.Fatal(err)
	}
	stop, err := alice.BindOpenHands("oh-late-created")
	if err != nil {
		t.Fatal(err)
	}
	if !stop {
		t.Fatal("late provider conversation was allowed to run after interruption")
	}
	bobReq := AgentMessageRequestSession{Content: "问题", ClientMessageID: "same-public-turn"}
	bob, err := beginAgentTurn(db, 11, "bob", 0, &bobReq)
	if err != nil {
		t.Fatal(err)
	}
	if alice.Record.ID == bob.Record.ID {
		t.Fatal("different customers shared one scoped turn id")
	}
}

func TestOpenHandsInterruptUsesImmediateProviderEndpoint(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/conversations/oh-123/interrupt" {
			http.Error(w, "unexpected request", http.StatusBadRequest)
			return
		}
		called = true
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true}`))
	}))
	defer server.Close()
	if err := ohInterruptConversation(&OpenHandsAgent{URL: server.URL}, "oh-123"); err != nil {
		t.Fatal(err)
	}
	if !called {
		t.Fatal("provider interrupt endpoint was not called")
	}
}
