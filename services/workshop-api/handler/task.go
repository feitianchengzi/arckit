package handler

import (
	"fmt"
	"net/http"
	"time"

	"todo/middleware"
	"todo/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Task错误消息ID定义 - 任务服务特定的错误消息
const (
	TaskErrNotMemberCannotCreate     = 1  // 您不是该项目的成员，无法创建任务
	TaskErrVerifyMemberFailed        = 2  // 验证项目成员身份失败
	TaskErrParentTaskNotFound        = 3  // 父任务不存在
	TaskErrQueryParentTaskFailed     = 4  // 查询父任务失败
	TaskErrParentTaskMustSameProject = 5  // 父任务必须属于同一项目
	TaskErrExecutorNotMember         = 6  // 指定的执行者不是该项目的成员
	TaskErrVerifyExecutorFailed      = 7  // 验证执行者身份失败
	TaskErrInvalidState              = 8  // 无效的任务状态
	TaskErrCreateTaskFailed          = 9  // 创建任务失败
	TaskErrTaskIDEmpty               = 10 // 任务ID不能为空
	TaskErrTaskNotFound              = 11 // 任务不存在
	TaskErrQueryTaskFailed           = 12 // 查询任务失败
	TaskErrNotMember                 = 13 // 您不是该项目的成员
	TaskErrVerifyPermissionFailed    = 14 // 验证权限失败
	TaskErrNoPermissionModify        = 15 // 您没有权限修改此任务
	TaskErrTaskCannotBeOwnParent     = 16 // 任务不能成为自己的父任务
	TaskErrUpdateTaskFailed          = 17 // 更新任务失败
	TaskErrProjectIDEmpty            = 18 // 项目ID不能为空
	TaskErrNotMemberCannotView       = 19 // 您不是该项目的成员，无法查看任务
	TaskErrQueryTaskTotalFailed      = 20 // 查询任务总数失败
	TaskErrNoPermissionDelete        = 21 // 您没有权限删除此任务
	TaskErrDeleteTaskFailed          = 22 // 删除任务失败
)

// CreateTaskRequest 创建任务请求结构
type CreateTaskRequest struct {
	ProjectID  uint   `json:"project_id" binding:"required"` // 项目ID（必填）
	FatherID   *uint  `json:"father_id,omitempty"`           // 父任务ID（可选，用于创建子任务）
	Content    string `json:"content" binding:"required"`    // 任务内容（必填）
	State      string `json:"state,omitempty"`               // 任务状态（可选，默认为pending）
	ExecutorID *uint  `json:"executor_id,omitempty"`         // 执行者ID（可选）
}

// CreateTaskResponse 创建任务响应结构
type CreateTaskResponse struct {
	ID           uint    `json:"id"`            // 任务ID
	ProjectID    uint    `json:"project_id"`    // 项目ID
	FatherID     *uint   `json:"father_id"`     // 父任务ID
	Content      string  `json:"content"`       // 任务内容
	State        string  `json:"state"`         // 任务状态
	CreatorID    uint    `json:"creator_id"`    // 创建者ID
	ExecutorID   *uint   `json:"executor_id"`   // 执行者ID
	CreatedAt    string  `json:"created_at"`    // 创建时间
	UpdatedAt    string  `json:"updated_at"`    // 更新时间
	CompletionAt *string `json:"completion_at"` // 完成时间
}

// CreateTask 创建新任务
// 网关路由: POST /todo-service/v1/user/tasks
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 直接查询项目成员表验证权限（项目成员都可以创建任务）
// 3. 如果指定了父任务，验证父任务是否存在且属于同一项目
// 4. 如果指定了执行者，验证执行者是否是项目成员
// 5. 创建任务
func CreateTask(c *gin.Context) {
	// 1. 解析请求体
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "请求参数错误: " + err.Error(),
		})
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 直接查询项目成员表验证权限（项目成员都可以创建任务）
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				HTTPStatus: http.StatusForbidden,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrNotMemberCannotCreate,
				Message:    "您不是该项目的成员，无法创建任务",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrVerifyMemberFailed,
			Message:    "验证项目成员身份失败: " + err.Error(),
		})
		return
	}

	// 5. 如果指定了父任务，验证父任务是否存在且属于同一项目
	if req.FatherID != nil {
		var parentTask models.Task
		if err := db.First(&parentTask, *req.FatherID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, models.ErrorResponse{
					HTTPStatus: http.StatusNotFound,
					HandlerID:  models.TaskHandlerID,
					MessageID:  TaskErrParentTaskNotFound,
					Message:    "父任务不存在",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrQueryParentTaskFailed,
				Message:    "查询父任务失败: " + err.Error(),
			})
			return
		}
		// 验证父任务是否属于同一项目
		if parentTask.ProjectID != req.ProjectID {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				HTTPStatus: http.StatusBadRequest,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrParentTaskMustSameProject,
				Message:    "父任务必须属于同一项目",
			})
			return
		}
	}

	// 6. 如果指定了执行者，验证执行者是否是项目成员
	if req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, models.ErrorResponse{
					HTTPStatus: http.StatusBadRequest,
					HandlerID:  models.TaskHandlerID,
					MessageID:  TaskErrExecutorNotMember,
					Message:    "指定的执行者不是该项目的成员",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrVerifyExecutorFailed,
				Message:    "验证执行者身份失败: " + err.Error(),
			})
			return
		}
	}

	// 7. 设置默认状态（如果未指定）
	state := req.State
	if state == "" {
		state = models.TaskStatePending
	}

	// 8. 验证状态是否有效
	if !models.IsValidState(state) {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrInvalidValue,
			Message:    "无效的任务状态",
		})
		return
	}

	// 9. 创建任务
	task := models.Task{
		ProjectID:  req.ProjectID,
		FatherID:   req.FatherID,
		Content:    req.Content,
		State:      state,
		CreatorID:  userID,
		ExecutorID: req.ExecutorID,
	}

	if err := db.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrCreateTaskFailed,
			Message:    "创建任务失败: " + err.Error(),
		})
		return
	}

	// 10. 返回成功响应
	var completionAt *string
	if task.CompletionAt != nil {
		completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
		completionAt = &completionAtStr
	}

	c.JSON(http.StatusCreated, CreateTaskResponse{
		ID:           task.ID,
		ProjectID:    task.ProjectID,
		FatherID:     task.FatherID,
		Content:      task.Content,
		State:        task.State,
		CreatorID:    task.CreatorID,
		ExecutorID:   task.ExecutorID,
		CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		CompletionAt: completionAt,
	})
}

// canModifyTask 检查用户是否有权限修改任务
// owner/admin：可以修改任意任务
// member：只能修改自己创建或分配给自己执行的任务
func canModifyTask(db *gorm.DB, userID uint, task models.Task) (bool, error) {
	// 查询用户在项目中的角色
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
		return false, err
	}

	// owner 或 admin 可以修改任意任务
	if member.Role == models.ProjectRoleOwner || member.Role == models.ProjectRoleAdmin {
		return true, nil
	}

	// member 只能修改自己创建或分配给自己执行的任务
	if member.Role == models.ProjectRoleMember {
		if task.CreatorID == userID || (task.ExecutorID != nil && *task.ExecutorID == userID) {
			return true, nil
		}
	}

	return false, nil
}

// UpdateTaskRequest 更新任务请求结构
type UpdateTaskRequest struct {
	Content    *string `json:"content,omitempty"`     // 任务内容（可选）
	State      *string `json:"state,omitempty"`       // 任务状态（可选）
	ExecutorID *uint   `json:"executor_id,omitempty"` // 执行者ID（可选）
	FatherID   *uint   `json:"father_id,omitempty"`   // 父任务ID（可选）
}

// UpdateTaskResponse 更新任务响应结构
type UpdateTaskResponse struct {
	ID           uint    `json:"id"`            // 任务ID
	ProjectID    uint    `json:"project_id"`    // 项目ID
	FatherID     *uint   `json:"father_id"`     // 父任务ID
	Content      string  `json:"content"`       // 任务内容
	State        string  `json:"state"`         // 任务状态
	CreatorID    uint    `json:"creator_id"`    // 创建者ID
	ExecutorID   *uint   `json:"executor_id"`   // 执行者ID
	CreatedAt    string  `json:"created_at"`    // 创建时间
	UpdatedAt    string  `json:"updated_at"`    // 更新时间
	CompletionAt *string `json:"completion_at"` // 完成时间
}

// UpdateTask 更新任务
// 网关路由: PUT /todo-service/v1/user/tasks/:id
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以修改任意任务
// - member：只能修改自己创建或分配给自己执行的任务
func UpdateTask(c *gin.Context) {
	// 1. 获取任务ID
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrTaskIDEmpty,
			Message:    "任务ID不能为空",
		})
		return
	}

	// 2. 解析请求体
	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "请求参数错误: " + err.Error(),
		})
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 4. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询任务
	var task models.Task
	if err := db.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				HTTPStatus: http.StatusNotFound,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrTaskNotFound,
				Message:    "任务不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrQueryTaskFailed,
			Message:    "查询任务失败: " + err.Error(),
		})
		return
	}

	// 6. 验证权限（canModifyTask内部会查询项目成员表）
	canModify, err := canModifyTask(db, userID, task)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				HTTPStatus: http.StatusForbidden,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrNotMember,
				Message:    "您不是该项目的成员",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrVerifyPermissionFailed,
			Message:    "验证权限失败: " + err.Error(),
		})
		return
	}
	if !canModify {
		c.JSON(http.StatusForbidden, models.ErrorResponse{
			HTTPStatus: http.StatusForbidden,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrNoPermissionModify,
			Message:    "您没有权限修改此任务",
		})
		return
	}

	// 7. 如果指定了父任务，验证父任务是否存在且属于同一项目
	if req.FatherID != nil {
		var parentTask models.Task
		if err := db.First(&parentTask, *req.FatherID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, models.ErrorResponse{
					HTTPStatus: http.StatusNotFound,
					HandlerID:  models.TaskHandlerID,
					MessageID:  TaskErrParentTaskNotFound,
					Message:    "父任务不存在",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrQueryParentTaskFailed,
				Message:    "查询父任务失败: " + err.Error(),
			})
			return
		}
		// 验证父任务是否属于同一项目
		if parentTask.ProjectID != task.ProjectID {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				HTTPStatus: http.StatusBadRequest,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrParentTaskMustSameProject,
				Message:    "父任务必须属于同一项目",
			})
			return
		}
		// 防止任务成为自己的父任务
		if parentTask.ID == task.ID {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				HTTPStatus: http.StatusBadRequest,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrTaskCannotBeOwnParent,
				Message:    "任务不能成为自己的父任务",
			})
			return
		}
	}

	// 8. 如果指定了执行者，验证执行者是否是项目成员
	if req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, models.ErrorResponse{
					HTTPStatus: http.StatusBadRequest,
					HandlerID:  models.TaskHandlerID,
					MessageID:  TaskErrExecutorNotMember,
					Message:    "指定的执行者不是该项目的成员",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrVerifyExecutorFailed,
				Message:    "验证执行者身份失败: " + err.Error(),
			})
			return
		}
	}

	// 9. 如果指定了状态，验证状态是否有效
	if req.State != nil {
		if !models.IsValidState(*req.State) {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				HTTPStatus: http.StatusBadRequest,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrInvalidState,
				Message:    "无效的任务状态",
			})
			return
		}
		// 如果状态变为已完成，设置完成时间
		if *req.State == models.TaskStateCompleted && task.State != models.TaskStateCompleted {
			now := time.Now()
			task.CompletionAt = &now
		} else if *req.State != models.TaskStateCompleted && task.CompletionAt != nil {
			// 如果状态从已完成变为其他状态，清除完成时间
			task.CompletionAt = nil
		}
	}

	// 10. 更新任务字段
	updates := make(map[string]interface{})
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.State != nil {
		updates["state"] = *req.State
	}
	if req.ExecutorID != nil {
		updates["executor_id"] = *req.ExecutorID
	}
	if req.FatherID != nil {
		updates["father_id"] = *req.FatherID
	}
	if task.CompletionAt != nil {
		updates["completion_at"] = task.CompletionAt
	} else if req.State != nil && *req.State != models.TaskStateCompleted {
		// 如果状态不是已完成，清除完成时间
		updates["completion_at"] = nil
	}

	if len(updates) > 0 {
		if err := db.Model(&task).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrUpdateTaskFailed,
				Message:    "更新任务失败: " + err.Error(),
			})
			return
		}
		// 重新查询任务以获取最新数据
		db.First(&task, task.ID)
	}

	// 11. 返回成功响应
	var completionAt *string
	if task.CompletionAt != nil {
		completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
		completionAt = &completionAtStr
	}

	c.JSON(http.StatusOK, UpdateTaskResponse{
		ID:           task.ID,
		ProjectID:    task.ProjectID,
		FatherID:     task.FatherID,
		Content:      task.Content,
		State:        task.State,
		CreatorID:    task.CreatorID,
		ExecutorID:   task.ExecutorID,
		CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		CompletionAt: completionAt,
	})
}

// GetTasksRequest 查询任务请求结构（通过查询参数）
// 使用查询参数: ?project_id=1

// TaskResponse 任务响应结构
type TaskResponse struct {
	ID           uint    `json:"id"`            // 任务ID
	ProjectID    uint    `json:"project_id"`    // 项目ID
	FatherID     *uint   `json:"father_id"`     // 父任务ID
	Content      string  `json:"content"`       // 任务内容
	State        string  `json:"state"`         // 任务状态
	CreatorID    uint    `json:"creator_id"`    // 创建者ID
	ExecutorID   *uint   `json:"executor_id"`   // 执行者ID
	CreatedAt    string  `json:"created_at"`    // 创建时间
	UpdatedAt    string  `json:"updated_at"`    // 更新时间
	CompletionAt *string `json:"completion_at"` // 完成时间
}

// GetTasksResponse 查询任务响应结构
type GetTasksResponse struct {
	Tasks []TaskResponse `json:"tasks"` // 任务列表
	Total int64          `json:"total"` // 任务总数
}

// GetTasks 查询项目的所有任务
// 网关路由: GET /todo-service/v1/user/tasks?project_id=1
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 直接查询项目成员表验证权限
// 3. 查询项目的所有任务
func GetTasks(c *gin.Context) {
	// 1. 获取项目ID（查询参数）
	projectIDStr := c.Query("project_id")
	if projectIDStr == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrProjectIDEmpty,
			Message:    "项目ID不能为空",
		})
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 解析项目ID
	var projectID uint
	if _, err := fmt.Sscanf(projectIDStr, "%d", &projectID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "无效的项目ID",
		})
		return
	}

	// 5. 直接查询项目成员表验证权限
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				HTTPStatus: http.StatusForbidden,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrNotMemberCannotView,
				Message:    "您不是该项目的成员，无法查看任务",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrVerifyMemberFailed,
			Message:    "验证项目成员身份失败: " + err.Error(),
		})
		return
	}

	// 6. 查询项目的所有任务
	var tasks []models.Task
	var total int64
	if err := db.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrQueryTaskTotalFailed,
			Message:    "查询任务总数失败: " + err.Error(),
		})
		return
	}
	if err := db.Where("project_id = ?", projectID).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrQueryTaskFailed,
			Message:    "查询任务失败: " + err.Error(),
		})
		return
	}

	// 7. 转换为响应格式
	taskResponses := make([]TaskResponse, 0, len(tasks))
	for _, task := range tasks {
		var completionAt *string
		if task.CompletionAt != nil {
			completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
			completionAt = &completionAtStr
		}

		taskResponses = append(taskResponses, TaskResponse{
			ID:           task.ID,
			ProjectID:    task.ProjectID,
			FatherID:     task.FatherID,
			Content:      task.Content,
			State:        task.State,
			CreatorID:    task.CreatorID,
			ExecutorID:   task.ExecutorID,
			CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CompletionAt: completionAt,
		})
	}

	// 9. 返回成功响应
	c.JSON(http.StatusOK, GetTasksResponse{
		Tasks: taskResponses,
		Total: total,
	})
}

// DeleteTasksRequest 删除任务请求结构
type DeleteTasksRequest struct {
	TaskIDs []uint `json:"task_ids" binding:"required,min=1"` // 任务ID列表（必填，至少一个）
}

// DeleteTasksResponse 删除任务响应结构
type DeleteTasksResponse struct {
	DeletedCount int    `json:"deleted_count"` // 删除的任务数量
	TaskIDs      []uint `json:"task_ids"`      // 已删除的任务ID列表
}

// DeleteTasks 删除任务（支持批量删除）
// 网关路由: DELETE /todo-service/v1/user/tasks
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以删除任意任务
// - member：只能删除自己创建或分配给自己执行的任务
// 注意：使用事务处理，所有任务要么全部删除成功，要么全部失败回滚
func DeleteTasks(c *gin.Context) {
	// 1. 解析请求体
	var req DeleteTasksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			HTTPStatus: http.StatusBadRequest,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrBadRequest,
			Message:    "请求参数错误: " + err.Error(),
		})
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.DefaultHandlerID,
			MessageID:  models.ErrDatabaseNotInit,
			Message:    "数据库连接未初始化",
		})
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 批量查询任务
	var tasks []models.Task
	if err := db.Where("id IN ?", req.TaskIDs).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrQueryTaskFailed,
			Message:    "查询任务失败: " + err.Error(),
		})
		return
	}

	// 6. 检查是否有任务不存在
	taskMap := make(map[uint]models.Task)
	for _, task := range tasks {
		taskMap[task.ID] = task
	}

	// 验证所有任务是否存在
	for _, taskID := range req.TaskIDs {
		if _, exists := taskMap[taskID]; !exists {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				HTTPStatus: http.StatusNotFound,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrTaskNotFound,
				Message:    "任务不存在",
			})
			return
		}
	}

	// 7. 验证所有任务的权限（canModifyTask内部会查询项目成员表）
	for _, taskID := range req.TaskIDs {
		task := taskMap[taskID]
		canModify, err := canModifyTask(db, userID, task)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, models.ErrorResponse{
					HTTPStatus: http.StatusForbidden,
					HandlerID:  models.DefaultHandlerID,
					MessageID:  models.ErrForbidden,
					Message:    "您不是该项目的成员",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				HTTPStatus: http.StatusInternalServerError,
				HandlerID:  models.DefaultHandlerID,
				MessageID:  models.ErrQueryFailed,
				Message:    "验证权限失败: " + err.Error(),
			})
			return
		}
		if !canModify {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				HTTPStatus: http.StatusForbidden,
				HandlerID:  models.TaskHandlerID,
				MessageID:  TaskErrNoPermissionDelete,
				Message:    "您没有权限删除此任务",
			})
			return
		}
	}

	// 8. 在事务中批量删除所有任务
	var deletedIDs []uint
	err := db.Transaction(func(tx *gorm.DB) error {
		// 批量删除任务
		if err := tx.Where("id IN ?", req.TaskIDs).Delete(&models.Task{}).Error; err != nil {
			return err
		}

		// 记录已删除的任务ID
		deletedIDs = req.TaskIDs
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			HTTPStatus: http.StatusInternalServerError,
			HandlerID:  models.TaskHandlerID,
			MessageID:  TaskErrDeleteTaskFailed,
			Message:    "删除任务失败: " + err.Error(),
		})
		return
	}

	// 9. 返回成功响应
	c.JSON(http.StatusOK, DeleteTasksResponse{
		DeletedCount: len(deletedIDs),
		TaskIDs:      deletedIDs,
	})
}
