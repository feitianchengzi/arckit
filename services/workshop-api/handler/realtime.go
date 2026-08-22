package handler

import (
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
