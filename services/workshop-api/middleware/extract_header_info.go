package middleware

import (
	"github.com/gin-gonic/gin"
)

// HeaderInfo 存储从请求头中提取的信息
type HeaderInfo struct {
	UserID    string
	Username  string
	AppID     string
	SessionID string
}

const headerInfoKey = "headerInfo"

// ExtractHeaderInfo 中间件：从请求头中提取header信息并存储到context中
func ExtractHeaderInfo() gin.HandlerFunc {
	return func(c *gin.Context) {
		headerInfo := HeaderInfo{
			UserID:    c.GetHeader("X-User-ID"),
			Username:  c.GetHeader("X-User-Username"),
			AppID:     c.GetHeader("X-User-AppID"),
			SessionID: c.GetHeader("X-User-SessionID"),
		}

		// 将headerInfo存储到context中
		c.Set(headerInfoKey, headerInfo)

		c.Next()
	}
}

// GetHeaderInfo 从context中获取HeaderInfo
// 可以在handler中使用此函数获取header信息
func GetHeaderInfo(c *gin.Context) *HeaderInfo {
	if val, exists := c.Get(headerInfoKey); exists {
		if headerInfo, ok := val.(HeaderInfo); ok {
			return &headerInfo
		}
	}
	return nil
}

