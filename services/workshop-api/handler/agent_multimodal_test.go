package handler

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"os/exec"
	"strconv"
	"strings"
	"testing"
	"time"
	"todo/middleware"
)

func TestVisionFirstAndSubsequentTurnsNeverDropImage(t *testing.T) {
	t.Setenv("AGENT_VISION_ENABLED", "true")
	t.Setenv("LLM_API_KEY", "test-key")
	for _, existing := range []string{"", "existing"} {
		t.Run("conversation="+existing, func(t *testing.T) {
			var received map[string]interface{}
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if r.Method == "POST" && (r.URL.Path == "/api/conversations" || strings.HasSuffix(r.URL.Path, "/events")) {
					if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
						t.Error(err)
					}
					w.Write([]byte(`{"id":"existing"}`))
					return
				}
				if strings.Contains(r.URL.Path, "/events/search") {
					w.Write([]byte(`{"items":[{"source":"agent","llm_message":{"content":[{"text":"图片已读取"}]}}]}`))
					return
				}
				w.Write([]byte(`{"execution_status":"finished"}`))
			}))
			defer server.Close()
			_, err := callOpenHandsAgentSync(&OpenHandsAgent{URL: server.URL}, "查看图片", existing, []string{"https://bucket.example/image.png"}, "/project/7")
			if err != nil {
				t.Fatal(err)
			}
			raw, _ := json.Marshal(received)
			if !strings.Contains(string(raw), "https://bucket.example/image.png") {
				t.Fatalf("image lost on turn %q: %s", existing, raw)
			}
		})
	}
}
func TestAgentMediaReferencesRejectUntrustedInputs(t *testing.T) {
	prefix := feedbackAttachmentPrefix(7, "alice")
	valid := AgentAttachmentInput{Type: "image", ObjectKey: prefix + "a.png", MimeType: "image/png", Size: 100}
	if err := validateAgentMedia("", []AgentAttachmentInput{valid}, prefix); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []AgentAttachmentInput{{Type: "image", URL: "http://169.254.169.254/latest/meta-data", MimeType: "image/png", Size: 100}, {Type: "image", ObjectKey: feedbackAttachmentPrefix(7, "bob") + "a.png", MimeType: "image/png", Size: 100}, {Type: "image", ObjectKey: prefix + "../bob/a.png", MimeType: "image/png", Size: 100}, {Type: "audio", ObjectKey: prefix + "a.webm", MimeType: "audio/webm", Size: 100, DurationMS: 61000}} {
		if validateAgentMedia("", []AgentAttachmentInput{tc}, prefix) == nil {
			t.Fatalf("accepted invalid media: %+v", tc)
		}
	}
	if validateAgentMedia("   ", nil, prefix) == nil {
		t.Fatal("accepted empty message")
	}
}
func TestSignedMediaResourceIsObjectBoundAndTemporary(t *testing.T) {
	t.Setenv("OSS_ACCESS_KEY_ID", "test-ak")
	t.Setenv("OSS_ACCESS_KEY_SECRET", "test-secret")
	t.Setenv("OSS_BUCKET_NAME", "test-bucket")
	t.Setenv("OSS_REGION", "cn-hangzhou")
	u, err := signAgentObjectURL("feedbacks/v2/7/a/image.png", time.Unix(1700000000, 0))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(u, "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/feedbacks/v2/7/a/image.png?") || !strings.Contains(u, "Expires=1700000900") || !strings.Contains(u, "Signature=") {
		t.Fatalf("invalid object grant %s", u)
	}
}

func TestNativeAudioUsesOriginalAudioAndRequiresTranscript(t *testing.T) {
	t.Setenv("AGENT_AUDIO_MODEL", "native-test")
	t.Setenv("AGENT_AUDIO_API_KEY", "test-key")
	for _, valid := range []bool{true, false} {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var payload map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				t.Error(err)
			}
			raw, _ := json.Marshal(payload)
			if !strings.Contains(string(raw), `"input_audio"`) || !strings.Contains(string(raw), `"data":"UklGRg=="`) {
				t.Errorf("original audio missing: %s", raw)
			}
			content := `{"transcript":"导出失败","observation":"背景有提示音"}`
			if !valid {
				content = `{"observation":"无转写"}`
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"choices": []interface{}{map[string]interface{}{"message": map[string]string{"content": content}}}})
		}))
		t.Setenv("AGENT_AUDIO_BASE_URL", server.URL)
		result, err := understandAgentAudio(context.Background(), []byte("RIFF"))
		server.Close()
		if valid && (err != nil || result.Transcript != "导出失败") {
			t.Fatalf("native audio failed: %+v %v", result, err)
		}
		if !valid && err == nil {
			t.Fatal("accepted uncheckable audio interpretation")
		}
	}
}

func TestAudioActualDurationCannotTrustClientMetadata(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg unavailable; container installs it")
	}
	makeWAV := func(seconds int) []byte {
		var b bytes.Buffer
		b.WriteString("RIFF")
		binary.Write(&b, binary.LittleEndian, uint32(36+seconds*32000))
		b.WriteString("WAVEfmt ")
		binary.Write(&b, binary.LittleEndian, uint32(16))
		binary.Write(&b, binary.LittleEndian, uint16(1))
		binary.Write(&b, binary.LittleEndian, uint16(1))
		binary.Write(&b, binary.LittleEndian, uint32(16000))
		binary.Write(&b, binary.LittleEndian, uint32(32000))
		binary.Write(&b, binary.LittleEndian, uint16(2))
		binary.Write(&b, binary.LittleEndian, uint16(16))
		b.WriteString("data")
		binary.Write(&b, binary.LittleEndian, uint32(seconds*32000))
		b.Write(make([]byte, seconds*32000))
		return b.Bytes()
	}
	if result, err := normalizeAgentAudio(context.Background(), makeWAV(1)); err != nil || len(result) != 32044 {
		t.Fatalf("valid audio failed len=%d err=%v", len(result), err)
	}
	if _, err := normalizeAgentAudio(context.Background(), makeWAV(61)); err == nil {
		t.Fatal("accepted actual audio longer than 60s")
	}
	if _, err := normalizeAgentAudio(context.Background(), []byte("not audio")); err == nil {
		t.Fatal("accepted invalid audio bytes")
	}
}

func TestAgentMediaAccessRejectsOtherCustomerAndHistoricalObjectForgery(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	conv := AgentConversation{ID: "media-owner", ProjectID: 7, CustomUserID: "alice"}
	if err := db.Create(&conv).Error; err != nil {
		t.Fatal(err)
	}
	raw, _ := json.Marshal(map[string]interface{}{"attachments": []AgentAttachmentInput{{Type: "image", ObjectKey: feedbackAttachmentPrefix(7, "bob") + "private.png", MimeType: "image/png", Size: 100}}})
	meta := string(raw)
	msg := AgentMessageRecord{ConversationID: conv.ID, ProjectID: 7, SenderType: "customer", Content: "历史图片", Metadata: &meta}
	if err := db.Create(&msg).Error; err != nil {
		t.Fatal(err)
	}
	for _, user := range []string{"bob", "alice"} {
		recorder := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(recorder)
		c.Request = httptest.NewRequest("GET", "/media", nil)
		c.Set("db", db)
		c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: 7, CustomUserID: user, SessionID: "test"})
		c.Params = gin.Params{{Key: "conversationId", Value: conv.ID}, {Key: "messageId", Value: strconv.Itoa(int(msg.ID))}, {Key: "attachmentIndex", Value: "0"}}
		GetAgentMediaAccess(c)
		if recorder.Code != 403 && recorder.Code != 404 {
			t.Fatalf("%s obtained unauthorized object: %d %s", user, recorder.Code, recorder.Body)
		}
	}
}

func TestAPIKeyBoundAgentUsesMediaValidationAndCustomerScope(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, "pending")
	owner := "alice"
	if err := db.Model(&fb).Update("custom_user_id", owner).Error; err != nil {
		t.Fatal(err)
	}
	t.Setenv("AGENT_VISION_ENABLED", "false")
	for _, user := range []string{"alice", "bob"} {
		raw, _ := json.Marshal(map[string]interface{}{"custom_user_id": user, "content": "", "client_message_id": "image-turn", "attachments": []AgentAttachmentInput{{Type: "image", ObjectKey: feedbackAttachmentPrefix(fx.project.ID, user) + "a.png", MimeType: "image/png", Size: 100}}})
		r := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(r)
		c.Request = httptest.NewRequest("POST", "/workshop/v2/apikey/feedbacks/1/agent-message", bytes.NewReader(raw))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("db", db)
		c.Set("userID", fx.user.ID)
		c.Params = gin.Params{{Key: "id", Value: strconv.Itoa(int(fb.ID))}}
		AgentMessageHandler(c)
		expected := 503
		if user == "bob" {
			expected = 403
		}
		if r.Code != expected {
			t.Fatalf("%s media gate: %d %s", user, r.Code, r.Body)
		}
	}
	var count int64
	db.Model(&AgentMessageRecord{}).Count(&count)
	if count != 0 {
		t.Fatalf("rejected media persisted %d messages", count)
	}
}
