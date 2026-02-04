package handler

import (
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

func notifyProjectEvent(c *gin.Context, db *gorm.DB, projectID uint, actorID uint, event string, data any) {
	if projectID == 0 || event == "" {
		return
	}
	actor := buildActor(c, db, actorID)
	realtime.NotifyProject(projectID, actor, event, data)
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
