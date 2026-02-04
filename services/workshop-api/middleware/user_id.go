package middleware

import (
	"net/http"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
)

const userIDKey = "userID"

// ExtractUserID 中间件：从Header的UUID查询用户表获取用户ID并存储到context中
// 如果获取失败，不会中断请求，handler可以通过GetUserID检查是否获取成功
func ExtractUserID() gin.HandlerFunc {
	return func(c *gin.Context) {
		db := GetDB(c)
		if db == nil {
			c.Next()
			return
		}

		// 从Header获取UUID，然后查询用户表
		headerInfo := GetHeaderInfo(c)
		if headerInfo != nil && headerInfo.UserID != "" {
			var user models.User
			if err := db.Select("id").Where("uuid = ?", headerInfo.UserID).First(&user).Error; err == nil {
				if user.ID != 0 {
					c.Set(userIDKey, user.ID)
				}
			}
		}

		c.Next()
	}
}

// GetUserID 从context中获取用户ID
// 如果用户ID不存在或为0，返回0和false
func GetUserID(c *gin.Context) (uint, bool) {
	val, exists := c.Get(userIDKey)
	if !exists {
		return 0, false
	}

	userID, ok := val.(uint)
	if !ok || userID == 0 {
		return 0, false
	}

	return userID, true
}

// RequireUserID 从context中获取用户ID，如果不存在则返回错误响应
// 用于handler中需要用户ID的场景
func RequireUserID(c *gin.Context) (uint, bool) {
	userID, ok := GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, response.NewErrorResponse(response.CodeUnauthorized, "缺少用户ID", nil))
		return 0, false
	}
	return userID, true
}
