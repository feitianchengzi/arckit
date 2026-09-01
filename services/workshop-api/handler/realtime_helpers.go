package handler

import (
	"log"

	"todo/middleware"
	"todo/models"
	"todo/realtime"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func buildActor(c *gin.Context, db *gorm.DB, userID uint) realtime.Actor {
	actor := realtime.Actor{ID: userID}
	if c != nil {
		if header := middleware.GetHeaderInfo(c); header != nil && header.Username != "" {
			actor.Username = header.Username
		}
	}
	if db != nil && userID != 0 && (actor.Username == "" || actor.Avatar == "") {
		var user models.User
		if err := db.Select("username", "avatar").First(&user, userID).Error; err == nil {
			if actor.Username == "" {
				actor.Username = user.Username
			}
			if actor.Avatar == "" {
				actor.Avatar = user.Avatar
			}
		}
	}
	return actor
}

// recordProjectEvent writes the event on the supplied transaction. Mutation
// handlers use this before commit so domain state and its invalidation event
// cannot become visible independently.
func recordProjectEvent(c *gin.Context, tx *gorm.DB, projectID uint, actorID uint, event string, data any) error {
	actor := buildActor(c, tx, actorID)
	_, err := realtime.RecordProject(tx, projectID, actor, event, data)
	return err
}

// notifyProjectEvent records an event for handlers that cannot yet include it
// in their mutation transaction. Recording is synchronous so failures are
// visible in logs and events are never silently dropped by a goroutine.
func notifyProjectEvent(c *gin.Context, db *gorm.DB, projectID uint, actorID uint, event string, data any) {
	if db == nil || projectID == 0 || event == "" {
		return
	}
	actor := buildActor(c, db, actorID)
	if _, err := realtime.RecordProject(db, projectID, actor, event, data); err != nil {
		log.Printf("record project event %q for project %d: %v", event, projectID, err)
	}
}

func notifyProjectEventByTaskID(c *gin.Context, db *gorm.DB, taskID uint, actorID uint, event string, data any) {
	if db == nil || taskID == 0 {
		return
	}
	var task models.Task
	if err := db.Select("project_id").First(&task, taskID).Error; err != nil {
		return
	}
	notifyProjectEvent(c, db, task.ProjectID, actorID, event, data)
}
