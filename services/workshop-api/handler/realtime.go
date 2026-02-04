package handler

import (
	"net/http"
	"strconv"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/realtime"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

const (
	wsReadLimit  = 1024
	wsPongWait   = 60 * time.Second
	wsPingPeriod = (wsPongWait * 9) / 10
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return realtime.IsOriginAllowed(r.Header.Get("Origin"))
	},
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

	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := realtime.NewClient(conn)
	realtime.DefaultHub.Join(projectID, client)
	actor := buildActor(c, db, userID)
	_ = client.WriteJSON(realtime.NewEvent(projectID, actor, "system.connected", gin.H{
		"message": "connected",
	}))

	conn.SetReadLimit(wsReadLimit)
	_ = conn.SetReadDeadline(time.Now().Add(wsPongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(wsPongWait))
	})

	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(wsPingPeriod)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := client.Ping(); err != nil {
					_ = conn.Close()
					return
				}
			case <-done:
				return
			}
		}
	}()

	defer func() {
		close(done)
		realtime.DefaultHub.Leave(projectID, client)
		client.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
