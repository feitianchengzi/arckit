package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// 独立客服会话作用域解析：apikey 模式从 query 取 project_id + custom_user_id。
// 这些 400 分支此前只靠 curl 手测，此处固化为回归。
func TestParseStandaloneScopeQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name        string
		query       string
		wantOK      bool
		wantProject uint
		wantCustom  string
	}{
		{"valid", "project_id=11&custom_user_id=u-1", true, 11, "u-1"},
		{"custom_user_id 裁剪空白", "project_id=11&custom_user_id=%20u-1%20", true, 11, "u-1"},
		{"custom_user_id 恰好 128", "project_id=11&custom_user_id=" + strings.Repeat("a", 128), true, 11, strings.Repeat("a", 128)},
		{"缺 project_id", "custom_user_id=u-1", false, 0, ""},
		{"project_id=0", "project_id=0&custom_user_id=u-1", false, 0, ""},
		{"缺 custom_user_id", "project_id=11", false, 0, ""},
		{"custom_user_id 仅空白", "project_id=11&custom_user_id=%20", false, 0, ""},
		{"custom_user_id 超 128", "project_id=11&custom_user_id=" + strings.Repeat("a", 129), false, 0, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)
			c.Request = httptest.NewRequest(http.MethodGet, "/agent-chats/conversations?"+tc.query, nil)

			scope, ok := parseStandaloneScopeQuery(c)

			if ok != tc.wantOK {
				t.Fatalf("ok = %v, want %v; body=%s", ok, tc.wantOK, recorder.Body.String())
			}
			if !tc.wantOK {
				if recorder.Code != http.StatusBadRequest {
					t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
				}
				return
			}
			if recorder.Body.Len() != 0 {
				t.Fatalf("成功路径不应写响应体: %s", recorder.Body.String())
			}
			if scope.ProjectID != tc.wantProject {
				t.Fatalf("ProjectID = %d, want %d", scope.ProjectID, tc.wantProject)
			}
			if scope.CustomUserID != tc.wantCustom {
				t.Fatalf("CustomUserID = %q, want %q", scope.CustomUserID, tc.wantCustom)
			}
		})
	}
}

// 独立会话不绑定反馈，feedback_id 一律用 0 占位；
// 会话查询与消息落库都以此过滤，改动会破坏与绑定会话的隔离。
func TestStandaloneConversationFeedbackIDIsZero(t *testing.T) {
	if standaloneConversationFeedbackID != 0 {
		t.Fatalf("standaloneConversationFeedbackID = %d, want 0", standaloneConversationFeedbackID)
	}
}

// 独立会话按 (project_id, custom_user_id, feedback_id=0) 三维隔离。
// 会话复用、跨客户不越权、跨项目不串，是「反馈建议」页客服入口的正确性前提。
func TestStandaloneConversationIsolation(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)

	// 首次调用创建会话，且不绑定反馈
	first, err := GetOrCreateStandaloneConversation(db, "", 11, "user-a")
	if err != nil {
		t.Fatalf("create first conversation: %v", err)
	}
	if first.FeedbackID != standaloneConversationFeedbackID {
		t.Fatalf("FeedbackID = %d, want %d", first.FeedbackID, standaloneConversationFeedbackID)
	}
	if first.ProjectID != 11 || first.CustomUserID != "user-a" {
		t.Fatalf("scope = project=%d user=%q, want 11/user-a", first.ProjectID, first.CustomUserID)
	}

	// 同 scope 再调用复用同一条，不新建
	reused, err := GetOrCreateStandaloneConversation(db, "", 11, "user-a")
	if err != nil {
		t.Fatalf("reuse conversation: %v", err)
	}
	if reused.ID != first.ID {
		t.Fatalf("reused.ID = %q, want %q", reused.ID, first.ID)
	}

	// 显式指定自己名下的 conversationID，返回同一条
	byID, err := GetOrCreateStandaloneConversation(db, first.ID, 11, "user-a")
	if err != nil {
		t.Fatalf("get by own conversation id: %v", err)
	}
	if byID.ID != first.ID {
		t.Fatalf("byID.ID = %q, want %q", byID.ID, first.ID)
	}

	// 不同客户不共享会话
	otherUser, err := GetOrCreateStandaloneConversation(db, "", 11, "user-b")
	if err != nil {
		t.Fatalf("create other user conversation: %v", err)
	}
	if otherUser.ID == first.ID {
		t.Fatal("不同 custom_user_id 必须得到不同会话")
	}

	// 不同项目不共享会话
	otherProject, err := GetOrCreateStandaloneConversation(db, "", 22, "user-a")
	if err != nil {
		t.Fatalf("create other project conversation: %v", err)
	}
	if otherProject.ID == first.ID {
		t.Fatal("不同 project_id 必须得到不同会话")
	}

	// 指定他人名下的 conversationID 不越权：回落到调用方自己的作用域
	foreign, err := GetOrCreateStandaloneConversation(db, first.ID, 11, "user-b")
	if err != nil {
		t.Fatalf("cross-customer get: %v", err)
	}
	if foreign.ID == first.ID {
		t.Fatal("越权：不能通过 conversationID 读取他人会话")
	}
	if foreign.CustomUserID != "user-b" {
		t.Fatalf("foreign.CustomUserID = %q, want user-b", foreign.CustomUserID)
	}

	// 列表只返回该作用域下的会话
	convs, err := GetStandaloneConversations(db, 11, "user-a")
	if err != nil {
		t.Fatalf("list conversations: %v", err)
	}
	if len(convs) != 1 || convs[0].ID != first.ID {
		ids := make([]string, 0, len(convs))
		for _, conv := range convs {
			ids = append(ids, conv.ID)
		}
		t.Fatalf("list = %v, want only %q", ids, first.ID)
	}
	for _, conv := range convs {
		if conv.FeedbackID != standaloneConversationFeedbackID {
			t.Fatalf("listed conversation %q FeedbackID = %d, want %d", conv.ID, conv.FeedbackID, standaloneConversationFeedbackID)
		}
	}

	// 空 custom_user_id 直接拒绝
	if _, err := GetOrCreateStandaloneConversation(db, "", 11, "   "); err == nil {
		t.Fatal("空白 custom_user_id 应返回错误")
	}
}

func TestStandaloneHistoryPaginationAndScope(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	now := time.Now()
	for i := 0; i < 3; i++ {
		conv := AgentConversation{ID: fmt.Sprintf("history-%d", i), ProjectID: 11, CustomUserID: "customer", CreatedAt: now.Add(time.Duration(i) * time.Minute), UpdatedAt: now.Add(time.Duration(i) * time.Minute)}
		if err := db.Create(&conv).Error; err != nil {
			t.Fatal(err)
		}
		for j := 0; j < 3; j++ {
			msg := AgentMessageRecord{ConversationID: conv.ID, ProjectID: 11, SenderType: "customer", Content: fmt.Sprintf("问题-%d-%d", i, j), CreatedAt: now.Add(time.Duration(j) * time.Second)}
			if err := db.Create(&msg).Error; err != nil {
				t.Fatal(err)
			}
		}
	}
	foreign := AgentConversation{ID: "foreign", ProjectID: 11, CustomUserID: "other"}
	db.Create(&foreign)
	request := func(path string, messages bool) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", path, nil)
		c.Set("db", db)
		if messages {
			c.Params = gin.Params{{Key: "conversationId", Value: "history-2"}}
			listStandaloneMessages(c, standaloneScope{ProjectID: 11, CustomUserID: "customer"})
		} else {
			listStandaloneConversations(c, standaloneScope{ProjectID: 11, CustomUserID: "customer"})
		}
		return w
	}
	var list struct {
		Data []struct {
			ID    string `json:"id"`
			Title string `json:"title"`
			Count int    `json:"message_count"`
		}
		Meta struct {
			Total int `json:"total"`
		}
	}
	w := request("/agent-chats/conversations?page=2&page_size=1", false)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatal(err)
	}
	if list.Meta.Total != 3 || len(list.Data) != 1 || list.Data[0].ID != "history-1" || list.Data[0].Title != "问题-1-0" || list.Data[0].Count != 3 {
		t.Fatalf("bad page: %s", w.Body.String())
	}
	var records struct {
		Data []AgentMessageRecord
		Meta struct {
			Total int `json:"total"`
		}
	}
	w = request("/agent-chats/conversations/history-2/messages?page=1&page_size=2", true)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	json.Unmarshal(w.Body.Bytes(), &records)
	if records.Meta.Total != 3 || len(records.Data) != 2 || records.Data[0].Content != "问题-2-1" || records.Data[1].Content != "问题-2-2" {
		t.Fatalf("bad latest page: %s", w.Body.String())
	}
	w = request("/agent-chats/conversations/history-2/messages?page=2&page_size=2", true)
	json.Unmarshal(w.Body.Bytes(), &records)
	if len(records.Data) != 1 || records.Data[0].Content != "问题-2-0" {
		t.Fatalf("bad older page: %s", w.Body.String())
	}
}
