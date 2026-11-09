package handler

import (
	"net/http"

	"todo/response"

	"github.com/gin-gonic/gin"
)

// GetAgentCapabilities exposes only customer-facing runtime capabilities.
// It lets the embedded SDK avoid offering media controls that the configured
// Agent cannot actually consume.
func GetAgentCapabilities(c *gin.Context) {
	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"image_understanding": agentVisionEnabled(),
	}))
}
