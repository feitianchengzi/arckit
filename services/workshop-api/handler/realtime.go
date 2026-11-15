package handler

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/realtime"
	"todo/response"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

const (
	wsReadLimit  = 1024
	wsPongWait   = 60 * time.Second
	wsPingPeriod = (wsPongWait * 9) / 10
)

const wsAuthSubprotocolPrefix = "nebula-auth."

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return realtime.IsOriginAllowed(r.Header.Get("Origin"))
	},
}

func websocketSubprotocols(r *http.Request) []string {
	requested := websocket.Subprotocols(r)
	if len(requested) == 0 {
		return nil
	}

	protocols := make([]string, 0, len(requested))
	for _, protocol := range requested {
		protocol = strings.TrimSpace(protocol)
		if protocol == "" {
			continue
		}
		if strings.HasPrefix(protocol, wsAuthSubprotocolPrefix) {
			continue
		}
		protocols = append(protocols, protocol)
	}
	if len(protocols) == 0 {
		return nil
	}
	return protocols
}

// ConnectFeedbackSDKWebsocket upgrades a WebSocket connection for the embedded
// Feedback SDK (V2 session mode). Unlike ConnectProjectWebsocket, the SDK runs
// in a browser iframe/WebView and cannot set custom Authorization headers on the
// WebSocket handshake, so the feedback session token is carried in the
// Sec-WebSocket-Protocol field as "nebula-auth.<token>". workshop-api verifies
// the self-signed fbs_ token itself (no gateway header injection required),
// derives the project/customer scope. Outbound events are checked against
// feedback ownership and reduced to invalidation IDs, never project payloads.
// Websocket route: GET /{service}/v2/feedback/projects/:id/ws
func ConnectFeedbackSDKWebsocket(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接未初始化"})
		return
	}

	scope, ok := resolveFeedbackSDKWebsocketScope(c)
	if !ok {
		return
	}
	projectID := scope.ProjectID

	upgrader := wsUpgrader
	upgrader.Subprotocols = websocketSubprotocols(c.Request)
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	// SDK 客户在项目房间接收前必须经过客户所有权过滤。
	client := realtime.NewClient(conn, 0)
	client.SetFilter(feedbackSDKEventFilter(db, scope))
	// A socket may outlive its handshake. Enforce token expiry without waiting
	// for a new HTTP request or a ping timeout.
	expiresAt := feedbackSDKSocketExpiry(c.Request)
	expiryTimer := time.AfterFunc(time.Until(expiresAt), client.Close)
	defer expiryTimer.Stop()
	realtime.DefaultHub.Join(projectID, client)
	defer func() {
		realtime.DefaultHub.Leave(projectID, client)
		client.Close()
	}()

	connected := gin.H{"type": "system.connected", "project_id": projectID}
	done := make(chan struct{})
	go func() {
		_ = client.WritePump(wsPingPeriod, connected)
		close(done)
		client.Close()
	}()

	conn.SetReadLimit(wsReadLimit)
	_ = conn.SetReadDeadline(time.Now().Add(wsPongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(wsPongWait))
	})

	for {
		select {
		case <-done:
			return
		default:
		}
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// feedbackSDKEventFilter deliberately sends invalidation IDs only. The full
// project event can contain customer content, actor data, and internal task data.
func feedbackSDKEventFilter(db *gorm.DB, scope middleware.FeedbackSessionScope) func(any) (any, bool) {
	return func(payload any) (any, bool) {
		raw, err := json.Marshal(payload)
		if err != nil {
			return nil, false
		}
		var event struct {
			Event     string          `json:"event"`
			ProjectID uint            `json:"project_id"`
			Data      json.RawMessage `json:"data"`
		}
		if json.Unmarshal(raw, &event) != nil || event.ProjectID != scope.ProjectID || (event.Event != "feedback.updated" && event.Event != "feedback.message.created") {
			return nil, false
		}
		var data struct {
			ID         uint `json:"id"`
			FeedbackID uint `json:"feedback_id"`
		}
		if json.Unmarshal(event.Data, &data) != nil {
			return nil, false
		}
		feedbackID := data.FeedbackID
		if event.Event == "feedback.updated" {
			feedbackID = data.ID
		}
		if feedbackID == 0 {
			return nil, false
		}
		var count int64
		if db.Model(&models.Feedback{}).Where("id = ? AND project_id = ? AND custom_user_id = ?", feedbackID, scope.ProjectID, scope.CustomUserID).Count(&count).Error != nil || count != 1 {
			return nil, false
		}
		result := gin.H{"type": event.Event, "project_id": scope.ProjectID, "feedback_id": feedbackID}
		if event.Event == "feedback.message.created" {
			result["message_id"] = data.ID
		}
		return result, true
	}
}

func feedbackSDKSocketExpiry(r *http.Request) time.Time {
	for _, protocol := range websocket.Subprotocols(r) {
		if !strings.HasPrefix(protocol, wsAuthSubprotocolPrefix) {
			continue
		}
		token := strings.TrimPrefix(protocol, wsAuthSubprotocolPrefix)
		// Only inspect claims after verifying the signed token.
		if _, err := verifyFeedbackSessionToken(token, time.Now()); err != nil {
			return time.Now()
		}
		parts := strings.SplitN(strings.TrimPrefix(token, feedbackSessionTokenPrefix), ".", 2)
		if len(parts) != 2 {
			return time.Now()
		}
		raw, err := base64.RawURLEncoding.DecodeString(parts[0])
		if err != nil {
			return time.Now()
		}
		var claims feedbackSessionClaims
		if json.Unmarshal(raw, &claims) != nil || claims.ExpiresAt <= 0 {
			return time.Now()
		}
		return time.Unix(claims.ExpiresAt, 0)
	}
	// Legacy trusted-gateway scope cannot keep a socket open indefinitely.
	return time.Now().Add(feedbackSessionLifetime)
}

// resolveFeedbackSDKWebsocketScope resolves the feedback session scope for a
// SDK WebSocket handshake. It prefers a token carried in the
// "nebula-auth.<token>" WebSocket subprotocol (browser WebSocket cannot set
// Authorization headers), and falls back to gateway-injected scope headers
// when the gateway already validated the session.
func resolveFeedbackSDKWebsocketScope(c *gin.Context) (middleware.FeedbackSessionScope, bool) {
	// 1) Subprotocol 携带的 session token：workshop-api 自验证。
	for _, protocol := range websocket.Subprotocols(c.Request) {
		protocol = strings.TrimSpace(protocol)
		if !strings.HasPrefix(protocol, wsAuthSubprotocolPrefix) {
			continue
		}
		token := strings.TrimPrefix(protocol, wsAuthSubprotocolPrefix)
		if token == "" {
			continue
		}
		scope, err := verifyFeedbackSessionToken(token, time.Now())
		if err == nil {
			return scope, true
		}
	}

	// 2) 网关已校验并注入 scope header 的场景（session 模式）。
	if scope, ok := middleware.TryFeedbackSessionScope(c); ok {
		return scope, true
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少有效的反馈会话凭证"})
	return middleware.FeedbackSessionScope{}, false
}

// ConnectProjectWebsocket upgrades the connection and joins the project room.
// Websocket route: GET /{service}/v1/{auth_level}/projects/:id/ws
func ConnectProjectWebsocket(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID64, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "项目ID格式错误"})
		return
	}
	projectID := uint(projectID64)

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接未初始化"})
		return
	}

	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "您不是该项目成员"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "验证项目成员失败: " + err.Error()})
		return
	}

	upgrader := wsUpgrader
	upgrader.Subprotocols = websocketSubprotocols(c.Request)
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := realtime.NewClient(conn, userID)
	realtime.DefaultHub.Join(projectID, client)
	actor := buildActor(c, db, userID)
	defer func() {
		realtime.DefaultHub.Leave(projectID, client)
		client.Close()
	}()

	// Join before reading the replay bounds. An event committed during this
	// query is then either included by the cursor or buffered on the socket;
	// there is no query-to-subscribe loss window.
	store := realtime.DefaultStore
	if store == nil {
		store = realtime.NewStore(db)
	}
	earliestID, latestID, err := store.Bounds(projectID)
	if err != nil {
		return
	}
	connected := realtime.Event{SchemaVersion: realtime.EventSchemaVersion, Event: "system.connected", ProjectID: projectID, Actor: actor, OccurredAt: time.Now().UTC().Format(time.RFC3339Nano), Data: gin.H{
		"message":           "connected",
		"earliest_event_id": earliestID,
		"latest_event_id":   latestID,
	}}
	// The client joins before the bounds query so no committed event can fall
	// through a query-to-subscribe gap. The write pump sends this handshake
	// directly before draining any domain events queued during the query.
	done := make(chan struct{})
	go func() {
		_ = client.WritePump(wsPingPeriod, connected)
		close(done)
		client.Close()
	}()

	conn.SetReadLimit(wsReadLimit)
	_ = conn.SetReadDeadline(time.Now().Add(wsPongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(wsPongWait))
	})

	for {
		select {
		case <-done:
			return
		default:
		}
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// GetProjectEvents replays durable project events after a client cursor.
func GetProjectEvents(c *gin.Context) {
	projectID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "项目ID格式错误", nil))
		return
	}
	projectID := uint(projectID64)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeProjectNotMember, "您不是该项目成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeProjectQueryFailed, "验证项目成员失败: "+err.Error(), nil))
		return
	}
	afterID, err := parseUint64Query(c.Query("after_id"), 0)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "after_id 格式错误", nil))
		return
	}
	limit64, err := parseUint64Query(c.Query("limit"), realtime.DefaultReplayLimit)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "limit 格式错误", nil))
		return
	}
	store := realtime.DefaultStore
	if store == nil {
		store = realtime.NewStore(db)
	}
	events, earliest, latest, err := store.Replay(projectID, afterID, int(limit64))
	if err != nil {
		if err == realtime.ErrCursorExpired {
			c.JSON(http.StatusGone, response.NewErrorResponse(response.CodeEventCursorExpired, "事件游标已超过保留窗口，请执行完整刷新", gin.H{"earliest_event_id": earliest, "latest_event_id": latest}))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "读取项目事件失败: "+err.Error(), nil))
		return
	}
	next := afterID
	if len(events) > 0 {
		next = events[len(events)-1].ID
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{"events": events, "earliest_event_id": earliest, "latest_event_id": latest, "next_after_id": next, "has_more": next < latest}))
}

func parseUint64Query(value string, defaultValue int) (uint64, error) {
	if strings.TrimSpace(value) == "" {
		return uint64(defaultValue), nil
	}
	return strconv.ParseUint(value, 10, 64)
}
