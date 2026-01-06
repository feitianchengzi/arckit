package middleware

import (
	"todo/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const dbKey = "db"

// InjectDB 中间件：将数据库连接注入到context中
func InjectDB() gin.HandlerFunc {
	return func(c *gin.Context) {
		db := database.GetDB()
		if db != nil {
			c.Set(dbKey, db)
		}
		c.Next()
	}
}

// GetDB 从context中获取数据库连接
func GetDB(c *gin.Context) *gorm.DB {
	if val, exists := c.Get(dbKey); exists {
		if db, ok := val.(*gorm.DB); ok {
			return db
		}
	}
	return nil
}
