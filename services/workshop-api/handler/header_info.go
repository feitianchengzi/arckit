package handler

import (
	"net/http"
	"strings"

	"todo/middleware"
	"todo/response"

	"github.com/gin-gonic/gin"
)

// GetHeaderInfo 返回从请求头中提取的信息
func GetHeaderInfo(c *gin.Context) {
	// 从路径中提取 auth_level (user/apikey/admin)
	// 路径格式: /{service}/v1/{auth_level}/header-info
	path := c.Request.URL.Path
	pathParts := strings.Split(path, "/")
	var method string
	if len(pathParts) >= 4 {
		method = pathParts[3] // 获取 auth_level
	}

	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil {
		data := gin.H{
			"method":    method,
			"userID":    "",
			"username":  "",
			"appID":     "",
			"sessionID": "",
		}
		c.JSON(http.StatusOK, response.NewSuccessResponse(data))
		return
	}

	data := gin.H{
		"method":    method,
		"userID":    headerInfo.UserID,
		"username":  headerInfo.Username,
		"appID":     headerInfo.AppID,
		"sessionID": headerInfo.SessionID,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}
