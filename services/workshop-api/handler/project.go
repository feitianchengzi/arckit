package handler

import (
	"net/http"

	"todo/middleware"
	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateProjectRequest 创建项目请求结构
type CreateProjectRequest struct {
	Name   string `json:"name" binding:"required"`    // 项目名称（必填）
	GitURL string `json:"git_url" binding:"required"` // Git地址（必填）
}

// CreateProjectResponse 创建项目响应结构
type CreateProjectResponse struct {
	ID        uint   `json:"id"`         // 项目ID
	Name      string `json:"name"`       // 项目名称
	GitURL    string `json:"git_url"`    // Git地址
	CreatorID uint   `json:"creator_id"` // 创建者ID
}

// CreateProject 创建新项目
// 网关路由: POST /todo-service/v1/user/projects
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从网关Header获取用户UUID（X-User-ID）
// 2. 使用UUID查询用户，不存在则使用网关提供的UUID创建新用户
// 3. 事务操作：创建项目并将创建者加入项目成员（role=owner）
func CreateProject(c *gin.Context) {
	// 1. 获取Header信息
	headerInfo := middleware.GetHeaderInfo(c)
	if headerInfo == nil || headerInfo.UserID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未获取到用户信息，请确保已通过网关认证",
		})
		return
	}

	// 2. 解析请求体
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数错误: " + err.Error(),
		})
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "数据库连接未初始化",
		})
		return
	}

	// 4. 查询或创建用户（使用网关提供的UUID）
	userUUID := headerInfo.UserID
	var user models.User
	err := db.Where("uuid = ?", userUUID).First(&user).Error
	if err != nil {
		// 用户不存在，使用网关提供的UUID创建新用户
		user = models.User{
			UUID:     userUUID, // 使用网关提供的UUID
			Username: headerInfo.Username,
			Avatar:   "", // 可从Header或其他来源获取
		}
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "创建用户失败: " + err.Error(),
			})
			return
		}
	}

	// 5. 在事务中创建项目和项目成员
	var project models.Project
	err = db.Transaction(func(tx *gorm.DB) error {
		// 创建项目
		project = models.Project{
			Name:      req.Name,
			GitURL:    req.GitURL,
			CreatorID: user.ID,
		}
		if err := tx.Create(&project).Error; err != nil {
			return err
		}

		// 将创建者加入项目成员（role=owner）
		member := models.ProjectMember{
			ProjectID: project.ID,
			UserID:    user.ID,
			Role:      models.ProjectRoleOwner,
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建项目失败: " + err.Error(),
		})
		return
	}

	// 6. 返回成功响应
	c.JSON(http.StatusCreated, CreateProjectResponse{
		ID:        project.ID,
		Name:      project.Name,
		GitURL:    project.GitURL,
		CreatorID: project.CreatorID,
	})
}
