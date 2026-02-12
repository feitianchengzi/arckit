package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateTaskRequest 创建任务请求结构
type CreateTaskRequest struct {
	ProjectID  uint    `json:"project_id" binding:"required"` // 项目ID（必填）
	FatherID   *uint   `json:"father_id,omitempty"`           // 父任务ID（可选，用于创建子任务）
	Content    string  `json:"content" binding:"required"`    // 任务内容（必填）
	State      string  `json:"state,omitempty"`               // 任务状态（可选，默认为pending）
	ExecutorID *uint   `json:"executor_id,omitempty"`         // 执行者ID（可选）
	Priority   *int    `json:"priority,omitempty"`            // 优先级（可选，0为最高，数值越大优先级越低）
	Tags       *string `json:"tags,omitempty"`                // 标签（可选，用逗号分割）
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
	Priority     *int    `json:"priority"`      // 优先级
	Tags         *string `json:"tags"`          // 标签
	CreatedAt    string  `json:"created_at"`    // 创建时间
	UpdatedAt    string  `json:"updated_at"`    // 更新时间
	CompletionAt *string `json:"completion_at"` // 完成时间
}

// CreateTask 创建新任务
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
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
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
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员，无法创建任务", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 5. 如果指定了父任务，验证父任务是否存在且属于同一项目
	if req.FatherID != nil {
		var parentTask models.Task
		if err := db.First(&parentTask, *req.FatherID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskParentNotFound, "父任务不存在", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询父任务失败: "+err.Error(), nil))
			return
		}
		// 验证父任务是否属于同一项目
		if parentTask.ProjectID != req.ProjectID {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskParentMustSameProject, "父任务必须属于同一项目", nil))
			return
		}
		// 注意：创建任务时不需要检查循环引用，因为新任务还没有ID，不会形成循环
		// 但为了代码一致性，我们可以在创建后检查（虽然这种情况理论上不会发生）
	}

	// 6. 如果指定了执行者，验证执行者是否是项目成员
	if req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, "指定的执行者不是该项目的成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证执行者身份失败: "+err.Error(), nil))
			return
		}
	}

	// 7. 设置默认状态（如果未指定）
	state := req.State
	if state == "" {
		state = models.TaskStatePendingReview
	}

	// 8. 验证状态是否有效
	if !models.IsValidState(state) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, "无效的任务状态", nil))
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
		Priority:   req.Priority,
		Tags:       req.Tags,
	}

	if err := db.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskCreateFailed, "创建任务失败: "+err.Error(), nil))
		return
	}

	// 10. 返回成功响应
	var completionAt *string
	if task.CompletionAt != nil {
		completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
		completionAt = &completionAtStr
	}

	resp := CreateTaskResponse{
		ID:           task.ID,
		ProjectID:    task.ProjectID,
		FatherID:     task.FatherID,
		Content:      task.Content,
		State:        task.State,
		CreatorID:    task.CreatorID,
		ExecutorID:   task.ExecutorID,
		Priority:     task.Priority,
		Tags:         task.Tags,
		CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		CompletionAt: completionAt,
	}
	notifyProjectEvent(c, db, task.ProjectID, userID, "task.created", resp)
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// checkCircularReference 检查循环引用
// 当设置任务的father_id时，向上遍历父任务链，检查是否形成循环
// 参数：
//   - db: 数据库连接
//   - taskID: 当前任务ID
//   - newFatherID: 新的父任务ID
//   - maxDepth: 最大检查深度（防止无限循环，最多20层）
//
// 返回：
//   - error: 如果检测到循环引用或超过最大深度，返回错误；否则返回nil
func checkCircularReference(db *gorm.DB, taskID uint, newFatherID uint, maxDepth int) error {
	if maxDepth <= 0 {
		maxDepth = 20 // 默认最大深度20层
	}

	visited := make(map[uint]bool)
	currentID := newFatherID

	// 向上遍历父任务链
	for depth := 0; currentID != 0 && depth < maxDepth; depth++ {
		// 检测直接循环：如果新父任务就是当前任务本身
		if currentID == taskID {
			return fmt.Errorf("检测到循环引用：目标任务的父任务链中包含当前任务")
		}

		// 检测间接循环：如果已经访问过这个任务ID
		if visited[currentID] {
			return fmt.Errorf("检测到循环引用：父任务链中存在循环")
		}

		visited[currentID] = true

		// 查询当前任务的父任务
		var task models.Task
		if err := db.Select("father_id").First(&task, currentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// 任务不存在，但这不是循环引用问题，可能是数据不一致
				// 这种情况会在后续的父任务验证中被捕获
				currentID = 0
				break
			}
			return fmt.Errorf("查询父任务链失败: %w", err)
		}

		// 如果父任务为空，说明到达根节点，没有循环
		if task.FatherID == nil {
			return nil
		}

		currentID = *task.FatherID
	}

	// 达到最大深度仍未到根节点，拒绝设置，避免无法完成循环检测
	if currentID != 0 {
		return fmt.Errorf("父任务层级超过%d层，无法设置父任务", maxDepth)
	}

	return nil
}

// canModifyTask 检查用户是否有权限修改任务
// 权限规则：
// - 如果任务状态为 in_progress（执行中），只有执行者和管理员/所有者可以修改，其他人不允许修改
// - 如果任务状态不是 in_progress，任何项目成员都可以修改
func canModifyTask(db *gorm.DB, userID uint, task models.Task) (bool, error) {
	// 查询用户在项目中的角色（验证用户是项目成员）
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
		return false, err
	}

	// 特殊规则：如果任务状态为 in_progress（执行中），只有执行者和管理员/所有者可以修改
	if task.State == models.TaskStateInProgress {
		// owner 或 admin 可以修改执行中的任务
		if member.Role == models.ProjectRoleOwner || member.Role == models.ProjectRoleAdmin {
			return true, nil
		}
		// 只有执行者可以修改执行中的任务
		if task.ExecutorID != nil && *task.ExecutorID == userID {
			return true, nil
		}
		// 其他人都不能修改执行中的任务
		return false, nil
	}

	// 非执行中状态的任务，任何项目成员都可以修改
	return true, nil
}

// UpdateTaskRequest 更新任务请求结构
type UpdateTaskRequest struct {
	Content     *string `json:"content,omitempty"`     // 任务内容（可选）
	State       *string `json:"state,omitempty"`       // 任务状态（可选）
	ExecutorID  *uint   `json:"executor_id,omitempty"` // 执行者ID（可选，可设置为null来清空）
	FatherID    *uint   `json:"father_id,omitempty"`   // 父任务ID（可选，可设置为null来清空）
	Priority    *int    `json:"priority,omitempty"`    // 优先级（可选，0为最高，数值越大优先级越低）
	Tags        *string `json:"tags,omitempty"`        // 标签（可选，用逗号分割）
	executorIDSet bool  `json:"-"`                     // 内部标志：executor_id是否在JSON中被显式设置
	fatherIDSet bool    `json:"-"`                     // 内部标志：father_id是否在JSON中被显式设置
}

// UnmarshalJSON 自定义JSON反序列化，用于检测字段是否被显式设置
func (r *UpdateTaskRequest) UnmarshalJSON(data []byte) error {
	// 检查原始JSON中是否包含father_id字段
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err == nil {
		if _, exists := raw["executor_id"]; exists {
			r.executorIDSet = true
		}
		if _, exists := raw["father_id"]; exists {
			r.fatherIDSet = true
		}
	}

	// 使用临时结构体避免递归调用
	type Alias struct {
		Content    *string `json:"content,omitempty"`
		State      *string `json:"state,omitempty"`
		ExecutorID *uint   `json:"executor_id,omitempty"`
		FatherID   *uint   `json:"father_id,omitempty"`
		Priority   *int    `json:"priority,omitempty"`
		Tags       *string `json:"tags,omitempty"`
	}

	var aux Alias
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// 复制字段
	r.Content = aux.Content
	r.State = aux.State
	r.ExecutorID = aux.ExecutorID
	r.FatherID = aux.FatherID
	r.Priority = aux.Priority
	r.Tags = aux.Tags

	return nil
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
	Priority     *int    `json:"priority"`      // 优先级
	Tags         *string `json:"tags"`          // 标签
	CreatedAt    string  `json:"created_at"`    // 创建时间
	UpdatedAt    string  `json:"updated_at"`    // 更新时间
	CompletionAt *string `json:"completion_at"` // 完成时间
}

// UpdateTask 更新任务
// 认证级别: user (需要JWT认证)
// 权限规则：
// - 如果任务状态为 in_progress（执行中），只有执行者和管理员/所有者可以修改，其他人不允许修改
// - 如果任务状态不是 in_progress，任何项目成员都可以修改
func UpdateTask(c *gin.Context) {
	// 1. 获取任务ID
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskIDEmpty, "任务ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
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
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 6. 验证权限（canModifyTask内部会查询项目成员表）
	canModify, err := canModifyTask(db, userID, task)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证权限失败: "+err.Error(), nil))
		return
	}
	if !canModify {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "您没有权限修改此任务", nil))
		return
	}

	// 7. 如果指定了父任务，验证父任务是否存在且属于同一项目
	// 如果father_id被显式设置（包括设置为null），需要验证
	if req.fatherIDSet {
		if req.FatherID != nil {
			// 设置了具体的父任务ID，需要验证
			var parentTask models.Task
			if err := db.First(&parentTask, *req.FatherID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskParentNotFound, "父任务不存在", nil))
					return
				}
				c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询父任务失败: "+err.Error(), nil))
				return
			}
			// 验证父任务是否属于同一项目
			if parentTask.ProjectID != task.ProjectID {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskParentMustSameProject, "父任务必须属于同一项目", nil))
				return
			}
			// 防止任务成为自己的父任务
			if parentTask.ID == task.ID {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskCannotBeOwnParent, "任务不能成为自己的父任务", nil))
				return
			}
			// 检查循环引用：向上遍历父任务链，确保不会形成循环
			if err := checkCircularReference(db, task.ID, *req.FatherID, 20); err != nil {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskCircularReference, err.Error(), nil))
				return
			}
		}
		// 如果 req.FatherID == nil 且 req.fatherIDSet == true，说明显式设置为null，这是允许的，不需要验证
	}

	// 8. 如果指定了执行者（且不为null），验证执行者是否是项目成员
	if req.executorIDSet && req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, "指定的执行者不是该项目的成员", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证执行者身份失败: "+err.Error(), nil))
			return
		}
	}

	// 9. 如果指定了状态，验证状态是否有效
	if req.State != nil {
		if !models.IsValidState(*req.State) {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, "无效的任务状态", nil))
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
	// 如果executor_id被显式设置（包括设置为null），则更新
	if req.executorIDSet {
		if req.ExecutorID != nil {
			updates["executor_id"] = *req.ExecutorID
		} else {
			// 显式设置为null，清空executor_id
			updates["executor_id"] = nil
		}
	}
	// 如果father_id被显式设置（包括设置为null），则更新
	if req.fatherIDSet {
		if req.FatherID != nil {
			updates["father_id"] = *req.FatherID
		} else {
			// 显式设置为null，清空father_id
			updates["father_id"] = nil
		}
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.Tags != nil {
		updates["tags"] = *req.Tags
	}
	if task.CompletionAt != nil {
		updates["completion_at"] = task.CompletionAt
	} else if req.State != nil && *req.State != models.TaskStateCompleted {
		// 如果状态不是已完成，清除完成时间
		updates["completion_at"] = nil
	}

	if len(updates) > 0 {
		if err := db.Model(&task).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskUpdateFailed, "更新任务失败: "+err.Error(), nil))
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

	resp := UpdateTaskResponse{
		ID:           task.ID,
		ProjectID:    task.ProjectID,
		FatherID:     task.FatherID,
		Content:      task.Content,
		State:        task.State,
		CreatorID:    task.CreatorID,
		ExecutorID:   task.ExecutorID,
		Priority:     task.Priority,
		Tags:         task.Tags,
		CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		CompletionAt: completionAt,
	}
	notifyProjectEvent(c, db, task.ProjectID, userID, "task.updated", resp)
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// GetTasksRequest 查询任务请求结构（通过查询参数）
// 支持的查询参数:
//   - project_id (必填): 项目ID，例如 ?project_id=1
//   - updated_after (可选): 更新时间过滤，ISO 8601格式，例如 ?updated_after=2024-01-01T12:00:00Z
//   - state (可选): 任务状态过滤（多选），例如 ?state=pending&state=completed
//   - creator_id (可选): 创建者ID过滤（多选），例如 ?creator_id=1&creator_id=2
//   - executor_id (可选): 执行者ID过滤（多选），例如 ?executor_id=3
//   - tags (可选): 标签过滤（多选），例如 ?tags=重要&tags=紧急
//   - priority (可选): 优先级过滤（多选），例如 ?priority=0&priority=1
//   - start_time/end_time (可选): 创建时间范围过滤（ISO 8601格式）
//   - search_key (可选): 关键字搜索（content 模糊匹配）
//   - father_id (可选): 父任务ID过滤
//   - 不提供: 查询所有任务
//   - 为0: 查询所有父任务ID为空的任务（顶级任务）
//   - 其他值: 查询指定父任务ID的子任务，例如 ?father_id=5
type GetTasksRequest struct {
	ProjectID      uint     `form:"project_id" binding:"required"` // 项目ID（必填）
	UpdatedAfter   string   `form:"updated_after"`                 // 更新时间过滤（可选，ISO 8601格式）
	States         []string `form:"state"`                         // 任务状态过滤（可选，多选）
	CreatorIDs     []string `form:"creator_id"`                    // 创建者ID过滤（可选，多选）
	ExecutorIDs    []string `form:"executor_id"`                   // 执行者ID过滤（可选，多选）
	Tags           []string `form:"tags"`                          // 标签过滤（可选，多选）
	Priorities     []string `form:"priority"`                      // 优先级过滤（可选，多选）
	StartTime      string   `form:"start_time"`                    // 开始时间过滤（可选，ISO 8601格式）
	EndTime        string   `form:"end_time"`                      // 结束时间过滤（可选，ISO 8601格式）
	SearchKey      string   `form:"search_key"`                    // 搜索关键词（可选）
	FatherID       *uint    `form:"father_id"`                     // 父任务ID过滤（可选）
	IncludeDeleted bool     `form:"include_deleted"`               // 是否包含已删除的记录（可选，默认false）
	Page           int      `form:"page"`                          // 页码（可选，默认1）
	PageSize       int      `form:"page_size"`                     // 每页条数（可选，默认50，最大200）
}

// TaskResponse 任务响应结构
type TaskResponse struct {
	ID           uint    `json:"id"`                   // 任务ID
	ProjectID    uint    `json:"project_id"`           // 项目ID
	FatherID     *uint   `json:"father_id"`            // 父任务ID
	Content      string  `json:"content"`              // 任务内容
	State        string  `json:"state"`                // 任务状态
	CreatorID    uint    `json:"creator_id"`           // 创建者ID
	ExecutorID   *uint   `json:"executor_id"`          // 执行者ID
	Priority     *int    `json:"priority"`             // 优先级
	Tags         *string `json:"tags"`                 // 标签
	CreatedAt    string  `json:"created_at"`           // 创建时间
	UpdatedAt    string  `json:"updated_at"`           // 更新时间
	CompletionAt *string `json:"completion_at"`        // 完成时间
	DeletedAt    *string `json:"deleted_at,omitempty"` // 删除时间（如果存在）
}

// GetTasksResponse 查询任务响应结构
type GetTasksResponse struct {
	Tasks []TaskResponse `json:"tasks"` // 任务列表
	Total int64          `json:"total"` // 任务总数
}

func parseISOTime(value string) (*time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	parsedTime, err := time.Parse("2006-01-02T15:04:05Z07:00", value)
	if err != nil {
		parsedTime, err = time.Parse("2006-01-02T15:04:05Z", value)
		if err != nil {
			return nil, err
		}
	}
	return &parsedTime, nil
}

func isEmptyArrayToken(value string) bool {
	compact := strings.Join(strings.Fields(value), "")
	return compact == "[]"
}

func splitAndTrim(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		for _, item := range strings.Split(value, ",") {
			trimmed := strings.TrimSpace(item)
			if trimmed == "" {
				continue
			}
			if isEmptyArrayToken(trimmed) {
				continue
			}
			out = append(out, trimmed)
		}
	}
	return out
}

func parseUintList(values []string) ([]uint, error) {
	parts := splitAndTrim(values)
	if len(parts) == 0 {
		return nil, nil
	}
	out := make([]uint, 0, len(parts))
	for _, part := range parts {
		parsed, err := strconv.ParseUint(part, 10, 64)
		if err != nil {
			return nil, err
		}
		out = append(out, uint(parsed))
	}
	return out, nil
}

func parseIntList(values []string) ([]int, error) {
	parts := splitAndTrim(values)
	if len(parts) == 0 {
		return nil, nil
	}
	out := make([]int, 0, len(parts))
	for _, part := range parts {
		parsed, err := strconv.Atoi(part)
		if err != nil {
			return nil, err
		}
		out = append(out, parsed)
	}
	return out, nil
}

// GetTasks 查询项目的所有任务
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 绑定查询参数到GetTasksRequest结构体
// 2. 从请求获取用户ID
// 3. 直接查询项目成员表验证权限
// 4. 解析可选的updated_after参数
// 5. 根据father_id参数构建查询条件
// 6. 查询项目的所有任务（根据提供的参数进行过滤）
func GetTasks(c *gin.Context) {
	// 1. 绑定查询参数
	var req GetTasksRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "参数绑定失败: "+err.Error(), nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 直接查询项目成员表验证权限
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员，无法查看任务", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 5. 解析可选的updated_after参数
	updatedAfter, err := parseISOTime(req.UpdatedAfter)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的更新时间格式，请使用ISO 8601格式（例如：2024-01-01T12:00:00Z）", nil))
		return
	}

	// 5.1 解析开始/结束时间（创建时间范围）
	startTime, err := parseISOTime(req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的开始时间格式，请使用ISO 8601格式（例如：2024-01-01T12:00:00Z）", nil))
		return
	}
	endTime, err := parseISOTime(req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的结束时间格式，请使用ISO 8601格式（例如：2024-01-01T12:00:00Z）", nil))
		return
	}
	if startTime != nil && endTime != nil && endTime.Before(*startTime) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "结束时间不能早于开始时间", nil))
		return
	}

	// 5.2 解析状态/创建者/执行者/标签/优先级/搜索关键词
	states := splitAndTrim(req.States)
	if len(states) > 0 {
		for _, state := range states {
			if !models.IsValidState(state) {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, fmt.Sprintf("无效的任务状态: %s", state), nil))
				return
			}
		}
	}

	creatorIDs, err := parseUintList(req.CreatorIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "creator_id 参数格式错误", nil))
		return
	}
	executorIDs, err := parseUintList(req.ExecutorIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "executor_id 参数格式错误", nil))
		return
	}
	priorities, err := parseIntList(req.Priorities)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "priority 参数格式错误", nil))
		return
	}
	tags := splitAndTrim(req.Tags)
	searchKey := strings.TrimSpace(req.SearchKey)

	// 6. 构建查询条件
	baseQuery := db.Model(&models.Task{}).Where("project_id = ?", req.ProjectID)

	// 如果 include_deleted 为 true，使用 Unscoped() 查询包含已删除的记录
	if req.IncludeDeleted {
		baseQuery = baseQuery.Unscoped()
	}

	// 如果提供了updated_after，添加时间过滤条件
	if updatedAfter != nil {
		baseQuery = baseQuery.Where("updated_at > ?", *updatedAfter)
	}

	// 如果提供了开始/结束时间，按创建时间过滤
	if startTime != nil {
		baseQuery = baseQuery.Where("created_at >= ?", *startTime)
	}
	if endTime != nil {
		baseQuery = baseQuery.Where("created_at <= ?", *endTime)
	}

	// 如果提供了状态过滤
	if len(states) > 0 {
		baseQuery = baseQuery.Where("state IN ?", states)
	}

	// 如果提供了创建者过滤
	if len(creatorIDs) > 0 {
		baseQuery = baseQuery.Where("creator_id IN ?", creatorIDs)
	}

	// 如果提供了执行者过滤
	if len(executorIDs) > 0 {
		baseQuery = baseQuery.Where("executor_id IN ?", executorIDs)
	}

	// 如果提供了优先级过滤
	if len(priorities) > 0 {
		baseQuery = baseQuery.Where("priority IN ?", priorities)
	}

	// 如果提供了标签过滤（多选，任一标签匹配）
	if len(tags) > 0 {
		tagConditions := make([]string, 0, len(tags))
		tagArgs := make([]interface{}, 0, len(tags))
		for _, tag := range tags {
			tagConditions = append(tagConditions, "tags LIKE ?")
			tagArgs = append(tagArgs, "%"+tag+"%")
		}
		baseQuery = baseQuery.Where("("+strings.Join(tagConditions, " OR ")+")", tagArgs...)
	}

	// 如果提供了搜索关键词（匹配内容）
	if searchKey != "" {
		like := "%" + searchKey + "%"
		baseQuery = baseQuery.Where("content LIKE ?", like)
	}

	// 如果提供了father_id，添加父任务ID过滤条件
	if req.FatherID != nil {
		if *req.FatherID == 0 {
			// father_id为0，查询所有父任务ID为空的任务
			baseQuery = baseQuery.Where("father_id IS NULL")
		} else {
			// father_id有值，查询指定父任务ID的任务
			baseQuery = baseQuery.Where("father_id = ?", *req.FatherID)
		}
	}

	// 7. 解析分页参数
	pagination, paginated := ParsePagination(c)

	// 8. 查询任务总数（仅分页时）
	var total int64
	if paginated {
		countQuery := baseQuery.Session(&gorm.Session{})
		if err := countQuery.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务总数失败: "+err.Error(), nil))
			return
		}
	}

	// 9. 查询任务列表
	baseQuery = baseQuery.Order("updated_at DESC").Order("id DESC")
	if paginated {
		baseQuery = baseQuery.Offset(pagination.Offset).Limit(pagination.Limit)
	}
	var tasks []models.Task
	if err := baseQuery.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 10. 转换为响应格式
	taskResponses := make([]TaskResponse, 0, len(tasks))
	for _, task := range tasks {
		var completionAt *string
		if task.CompletionAt != nil {
			completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
			completionAt = &completionAtStr
		}

		var deletedAt *string
		if task.DeletedAt.Valid {
			deletedAtStr := task.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
			deletedAt = &deletedAtStr
		}

		taskResponses = append(taskResponses, TaskResponse{
			ID:           task.ID,
			ProjectID:    task.ProjectID,
			FatherID:     task.FatherID,
			Content:      task.Content,
			State:        task.State,
			CreatorID:    task.CreatorID,
			ExecutorID:   task.ExecutorID,
			Priority:     task.Priority,
			Tags:         task.Tags,
			CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CompletionAt: completionAt,
			DeletedAt:    deletedAt,
		})
	}

	// 11. 返回成功响应
	if !paginated {
		total = int64(len(taskResponses))
	}
	resp := GetTasksResponse{
		Tasks: taskResponses,
		Total: total,
	}
	if paginated {
		c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(resp, response.Meta{
			Page:     pagination.Page,
			PageSize: pagination.PageSize,
			Total:    int(total),
		}))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// DeleteTaskResponse 删除任务响应结构
type DeleteTaskResponse struct {
	TaskID    uint   `json:"task_id"`    // 已删除的任务ID
	DeletedAt string `json:"deleted_at"` // 删除时间
}

// DeleteTask 删除任务
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以删除任意任务
// - member：只能删除自己创建或分配给自己执行的任务
// 注意：删除任务时会级联删除关联的附件
func DeleteTask(c *gin.Context) {
	// 1. 获取任务ID（从路径参数）
	taskIDStr := c.Param("id")
	if taskIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "任务ID不能为空", nil))
		return
	}

	var taskID uint
	if _, err := fmt.Sscanf(taskIDStr, "%d", &taskID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的任务ID", nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 查询任务
	var task models.Task
	if err := db.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 5. 验证权限（canModifyTask内部会查询项目成员表）
	canModify, err := canModifyTask(db, userID, task)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证权限失败: "+err.Error(), nil))
		return
	}
	if !canModify {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "您没有权限删除此任务", nil))
		return
	}

	// 6. 在事务中删除任务及其附件
	deletedAt := time.Now()
	err = db.Transaction(func(tx *gorm.DB) error {
		// 先级联删除任务附件（软删除）
		if err := tx.Where("task_id = ?", taskID).Delete(&models.TaskAttachment{}).Error; err != nil {
			return err
		}

		// 删除任务（软删除）
		if err := tx.Delete(&task).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskDeleteFailed, "删除任务失败: "+err.Error(), nil))
		return
	}

	// 7. 返回成功响应
	resp := DeleteTaskResponse{
		TaskID:    taskID,
		DeletedAt: deletedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	notifyProjectEvent(c, db, task.ProjectID, userID, "task.deleted", resp)
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// CreateTaskAttachmentRequest 创建任务附件请求结构
type CreateTaskAttachmentRequest struct {
	TaskID  uint   `json:"task_id" binding:"required"` // 任务ID（必填）
	Type    string `json:"type" binding:"required"`    // 附件类型：text/file/url（必填）
	Content string `json:"content" binding:"required"` // 内容：文本内容或URL（必填）
}

// CreateTaskAttachmentResponse 创建任务附件响应结构
type CreateTaskAttachmentResponse struct {
	ID        uint   `json:"id"`         // 附件ID
	TaskID    uint   `json:"task_id"`    // 任务ID
	CreatorID uint   `json:"creator_id"` // 创建者ID
	Type      string `json:"type"`       // 附件类型
	Content   string `json:"content"`    // 内容
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// CreateTaskAttachment 创建任务附件
// 认证级别: user (需要JWT认证)
// 权限规则：与任务修改权限相同
func CreateTaskAttachment(c *gin.Context) {
	// 1. 解析请求体
	var req CreateTaskAttachmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 2. 验证附件类型
	if !models.IsValidAttachmentType(req.Type) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskAttachmentInvalidType, "无效的附件类型，支持的类型：text/file/url", nil))
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 4. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询任务
	var task models.Task
	if err := db.First(&task, req.TaskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 6. 验证权限（canModifyTask内部会查询项目成员表）
	canModify, err := canModifyTask(db, userID, task)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证权限失败: "+err.Error(), nil))
		return
	}
	if !canModify {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "您没有权限为此任务添加附件", nil))
		return
	}

	// 7. 创建附件
	attachment := models.TaskAttachment{
		TaskID:    req.TaskID,
		CreatorID: userID,
		Type:      req.Type,
		Content:   req.Content,
	}

	if err := db.Create(&attachment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentCreateFailed, "创建附件失败: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
	resp := CreateTaskAttachmentResponse{
		ID:        attachment.ID,
		TaskID:    attachment.TaskID,
		CreatorID: attachment.CreatorID,
		Type:      attachment.Type,
		Content:   attachment.Content,
		CreatedAt: attachment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: attachment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	notifyProjectEvent(c, db, task.ProjectID, userID, "task_attachment.created", resp)
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// GetTaskAttachmentsRequest 查询任务附件请求结构
type GetTaskAttachmentsRequest struct {
	TaskID         uint `form:"task_id" binding:"required"` // 任务ID（必填）
	IncludeDeleted bool `form:"include_deleted"`            // 是否包含已删除的记录（可选，默认false）
	Page           int  `form:"page"`                       // 页码（可选，默认1）
	PageSize       int  `form:"page_size"`                  // 每页条数（可选，默认50，最大200）
}

// TaskAttachmentResponse 任务附件响应结构
type TaskAttachmentResponse struct {
	ID        uint    `json:"id"`                   // 附件ID
	TaskID    uint    `json:"task_id"`              // 任务ID
	CreatorID uint    `json:"creator_id"`           // 创建者ID
	Type      string  `json:"type"`                 // 附件类型
	Content   string  `json:"content"`              // 内容
	CreatedAt string  `json:"created_at"`           // 创建时间
	UpdatedAt string  `json:"updated_at"`           // 更新时间
	DeletedAt *string `json:"deleted_at,omitempty"` // 删除时间（如果存在）
}

// GetTaskAttachmentsResponse 查询任务附件响应结构
type GetTaskAttachmentsResponse struct {
	Attachments []TaskAttachmentResponse `json:"attachments"` // 附件列表
	Total       int64                    `json:"total"`       // 附件总数
}

// GetTaskAttachments 查询任务的所有附件
// 认证级别: user (需要JWT认证)
// 权限规则：项目成员均可查看
func GetTaskAttachments(c *gin.Context) {
	// 1. 绑定查询参数
	var req GetTaskAttachmentsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "参数绑定失败: "+err.Error(), nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 查询任务
	var task models.Task
	if err := db.First(&task, req.TaskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 5. 验证用户是否为项目成员
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员，无法查看附件", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	// 6. 构建查询条件
	query := db.Where("task_id = ?", req.TaskID).Order("created_at DESC").Order("id DESC")
	if req.IncludeDeleted {
		query = query.Unscoped()
	}

	// 7. 解析分页参数
	pagination, paginated := ParsePagination(c)

	// 8. 查询附件总数（仅分页时）
	var total int64
	if paginated {
		countQuery := query.Model(&models.TaskAttachment{}).Session(&gorm.Session{})
		if err := countQuery.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentQueryFailed, "查询附件总数失败: "+err.Error(), nil))
			return
		}
	}

	// 9. 查询附件列表
	if paginated {
		query = query.Offset(pagination.Offset).Limit(pagination.Limit)
	}
	var attachments []models.TaskAttachment
	if err := query.Find(&attachments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentQueryFailed, "查询附件失败: "+err.Error(), nil))
		return
	}

	// 9. 转换为响应格式
	attachmentResponses := make([]TaskAttachmentResponse, 0, len(attachments))
	for _, attachment := range attachments {
		var deletedAt *string
		if attachment.DeletedAt.Valid {
			deletedAtStr := attachment.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
			deletedAt = &deletedAtStr
		}

		attachmentResponses = append(attachmentResponses, TaskAttachmentResponse{
			ID:        attachment.ID,
			TaskID:    attachment.TaskID,
			CreatorID: attachment.CreatorID,
			Type:      attachment.Type,
			Content:   attachment.Content,
			CreatedAt: attachment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: attachment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			DeletedAt: deletedAt,
		})
	}

	// 10. 返回成功响应
	if !paginated {
		total = int64(len(attachmentResponses))
	}
	resp := GetTaskAttachmentsResponse{
		Attachments: attachmentResponses,
		Total:       total,
	}
	if paginated {
		c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(resp, response.Meta{
			Page:     pagination.Page,
			PageSize: pagination.PageSize,
			Total:    int(total),
		}))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// UpdateTaskAttachmentRequest 更新任务附件请求结构
type UpdateTaskAttachmentRequest struct {
	Content *string `json:"content,omitempty"` // 内容（可选，附件类型不可更新）
}

// UpdateTaskAttachmentResponse 更新任务附件响应结构
type UpdateTaskAttachmentResponse struct {
	ID        uint   `json:"id"`         // 附件ID
	TaskID    uint   `json:"task_id"`    // 任务ID
	CreatorID uint   `json:"creator_id"` // 创建者ID
	Type      string `json:"type"`       // 附件类型
	Content   string `json:"content"`    // 内容
	CreatedAt string `json:"created_at"` // 创建时间
	UpdatedAt string `json:"updated_at"` // 更新时间
}

// UpdateTaskAttachment 更新任务附件
// 认证级别: user (需要JWT认证)
// 权限规则：只有创建者可以修改附件（附件类型不可更新，只能更新内容）
func UpdateTaskAttachment(c *gin.Context) {
	// 1. 获取附件ID
	attachmentID := c.Param("id")
	if attachmentID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "附件ID不能为空", nil))
		return
	}

	// 2. 解析请求体
	var req UpdateTaskAttachmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 3. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 4. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 5. 查询附件
	var attachment models.TaskAttachment
	if err := db.First(&attachment, attachmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskAttachmentNotFound, "附件不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentQueryFailed, "查询附件失败: "+err.Error(), nil))
		return
	}

	// 6. 验证权限：只有创建者可以修改附件
	if attachment.CreatorID != userID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "只有创建者可以修改此附件", nil))
		return
	}

	// 7. 更新附件字段（只允许更新content，type不可更新）
	updates := make(map[string]interface{})
	if req.Content != nil {
		updates["content"] = *req.Content
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "没有需要更新的字段", nil))
		return
	}

	if err := db.Model(&attachment).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentUpdateFailed, "更新附件失败: "+err.Error(), nil))
		return
	}
	// 重新查询附件以获取最新数据
	db.First(&attachment, attachment.ID)

	// 8. 返回成功响应
	resp := UpdateTaskAttachmentResponse{
		ID:        attachment.ID,
		TaskID:    attachment.TaskID,
		CreatorID: attachment.CreatorID,
		Type:      attachment.Type,
		Content:   attachment.Content,
		CreatedAt: attachment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: attachment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	notifyProjectEventByTaskID(c, db, attachment.TaskID, userID, "task_attachment.updated", resp)
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// DeleteTaskAttachment 删除任务附件
// 认证级别: user (需要JWT认证)
// 权限规则：创建者可以删除，或者项目的管理者和所有者也可以删除
func DeleteTaskAttachment(c *gin.Context) {
	// 1. 获取附件ID
	attachmentID := c.Param("id")
	if attachmentID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "附件ID不能为空", nil))
		return
	}

	// 2. 从context获取数据库连接
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 3. 获取用户ID
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	// 4. 查询附件
	var attachment models.TaskAttachment
	if err := db.First(&attachment, attachmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskAttachmentNotFound, "附件不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentQueryFailed, "查询附件失败: "+err.Error(), nil))
		return
	}

	// 5. 验证权限：创建者可以删除，或者项目的管理者和所有者也可以删除
	if attachment.CreatorID != userID {
		// 如果不是创建者，检查是否是项目的管理员或所有者
		// 先查询任务以获取项目ID
		var task models.Task
		if err := db.First(&task, attachment.TaskID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
			return
		}

		// 查询用户在项目中的角色
		var member models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员，无法删除附件", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
			return
		}

		// 只有管理员和所有者可以删除非自己创建的附件
		if member.Role != models.ProjectRoleAdmin && member.Role != models.ProjectRoleOwner {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "只有创建者、项目管理员或所有者可以删除此附件", nil))
			return
		}
	}

	// 7. 删除附件（软删除）
	if err := db.Delete(&attachment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentDeleteFailed, "删除附件失败: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
	data := map[string]interface{}{
		"id":         attachment.ID,
		"deleted_at": time.Now().Format("2006-01-02T15:04:05Z07:00"),
	}
	notifyProjectEventByTaskID(c, db, attachment.TaskID, userID, "task_attachment.deleted", data)
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}
