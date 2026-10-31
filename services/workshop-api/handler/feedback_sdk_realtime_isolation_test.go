package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"todo/middleware"
	"todo/models"
	"todo/realtime"
)

func TestFeedbackSDKRealtimeCustomerIsolation(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	customerA, customerB := "customer-a", "customer-b"
	fb := models.Feedback{ProjectID: fx.project.ID, Title: "private", Content: "private customer body", Status: "pending", CustomUserID: &customerA, ShortID: "isolation"}
	if err := db.Create(&fb).Error; err != nil {
		t.Fatal(err)
	}
	filter := feedbackSDKEventFilter(db, middleware.FeedbackSessionScope{ProjectID: fx.project.ID, CustomUserID: customerA})
	other := feedbackSDKEventFilter(db, middleware.FeedbackSessionScope{ProjectID: fx.project.ID, CustomUserID: customerB})
	event := realtime.NewEvent(fx.project.ID, realtime.Actor{}, "feedback.message.created", gin.H{"id": 17, "feedback_id": fb.ID, "content": "PRIVATE BODY"})
	minimal, ok := filter(event)
	if !ok {
		t.Fatal("owner event dropped")
	}
	raw, _ := json.Marshal(minimal)
	if strings.Contains(string(raw), "PRIVATE") || strings.Contains(string(raw), "content") {
		t.Fatalf("body leaked: %s", raw)
	}
	if _, ok := other(event); ok {
		t.Fatal("other customer's event delivered")
	}
	if _, ok := filter(realtime.NewEvent(fx.project.ID, realtime.Actor{}, "task.created", gin.H{"id": fb.ID})); ok {
		t.Fatal("internal project event delivered")
	}
	t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "test-signing-key-at-least-32-characters")
	t.Run("connection closes when signed session expires", func(t *testing.T) {
		token, _, err := signFeedbackSessionToken(fx.project.ID, customerA, time.Now().Add(-feedbackSessionLifetime+2*time.Second))
		if err != nil {
			t.Fatal(err)
		}
		server := httptest.NewServer(httpHandlerForSDKSocket(db))
		defer server.Close()
		dialer := websocket.Dialer{Subprotocols: []string{"feedback-v2", wsAuthSubprotocolPrefix + token}}
		conn, _, err := dialer.Dial("ws"+strings.TrimPrefix(server.URL, "http")+"/ws", nil)
		if err != nil {
			t.Fatal(err)
		}
		defer conn.Close()
		var connected map[string]interface{}
		if err := conn.ReadJSON(&connected); err != nil {
			t.Fatal(err)
		}
		conn.SetReadDeadline(time.Now().Add(4 * time.Second))
		if _, _, err := conn.ReadMessage(); err == nil {
			t.Fatal("expected expired connection to close")
		} else if timeout, ok := err.(interface{ Timeout() bool }); ok && timeout.Timeout() {
			t.Fatal("expired socket remained open")
		}
	})
	for _, customer := range []string{customerA, customerB} {
		t.Run(customer, func(t *testing.T) {
			token, _, err := signFeedbackSessionToken(fx.project.ID, customer, time.Now())
			if err != nil {
				t.Fatal(err)
			}
			server := httptest.NewServer(httpHandlerForSDKSocket(db))
			defer server.Close()
			dialer := websocket.Dialer{Subprotocols: []string{"feedback-v2", wsAuthSubprotocolPrefix + token}}
			conn, _, err := dialer.Dial("ws"+strings.TrimPrefix(server.URL, "http")+"/ws", nil)
			if err != nil {
				t.Fatal(err)
			}
			defer conn.Close()
			if conn.Subprotocol() != "feedback-v2" {
				t.Fatalf("negotiated protocol=%q", conn.Subprotocol())
			}
			var connected map[string]interface{}
			if err := conn.ReadJSON(&connected); err != nil {
				t.Fatal(err)
			}
			realtime.DefaultHub.Broadcast(fx.project.ID, event)
			// An owner-only marker event proves a receiver isn't consuming an unrelated event.
			if customer == customerA {
				var received map[string]interface{}
				if err := conn.ReadJSON(&received); err != nil {
					t.Fatal(err)
				}
				if received["type"] != "feedback.message.created" || received["content"] != nil {
					t.Fatalf("unexpected event: %+v", received)
				}
			} else {
				conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
				if _, _, err := conn.ReadMessage(); err == nil {
					t.Fatal("other customer received event")
				}
			}
		})
	}
}

func httpHandlerForSDKSocket(db *gorm.DB) http.Handler {
	r := gin.New()
	r.Use(func(c *gin.Context) { c.Set("db", db); c.Next() })
	r.GET("/ws", ConnectFeedbackSDKWebsocket)
	return r
}
func TestFeedbackSDKSocketExpiry(t *testing.T) {
	t.Setenv("FEEDBACK_SESSION_SIGNING_KEY", "test-signing-key-at-least-32-characters")
	token, expiry, err := signFeedbackSessionToken(1, "c", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	r := httptest.NewRequest("GET", "/ws", nil)
	r.Header.Set("Sec-WebSocket-Protocol", "feedback-v2, "+wsAuthSubprotocolPrefix+token)
	if !feedbackSDKSocketExpiry(r).Equal(time.Unix(expiry.Unix(), 0)) {
		t.Fatal("socket expiry must match signed token expiry")
	}
}
