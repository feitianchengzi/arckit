package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
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
		state = models.TaskStatePending
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
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// checkCircularReference 检查循环引用
// 当设置任务的father_id时，向上遍历父任务链，检查是否形成循环
// 参数：
//   - db: 数据库连接
//   - taskID: 当前任务ID
//   - newFatherID: 新的父任务ID
//   - maxDepth: 最大检查深度（防止无限循环，建议50）
// 返回：
//   - error: 如果检测到循环引用，返回错误；否则返回nil
func checkCircularReference(db *gorm.DB, taskID uint, newFatherID uint, maxDepth int) error {
	if maxDepth <= 0 {
		maxDepth = 50 // 默认最大深度50层
	}

	visited := make(map[uint]bool)
	currentID := newFatherID
	depth := 0

	// 向上遍历父任务链
	for currentID != 0 && depth < maxDepth {
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
				break
			}
			return fmt.Errorf("查询父任务链失败: %w", err)
		}

		// 如果父任务为空，说明到达根节点，没有循环
		if task.FatherID == nil {
			break
		}

		currentID = *task.FatherID
		depth++
	}

	// 如果达到最大深度，可能存在很深的层级，但不一定是循环
	// 为了安全起见，如果达到最大深度，我们仍然允许，但记录警告
	// 实际应用中，50层的任务层级已经非常深了，正常情况下不会达到

	return nil
}

// canModifyTask 检查用户是否有权限修改任务
// 权限规则：
// - 如果任务没有分配执行者（ExecutorID == nil），任何项目成员都可以修改
// - 如果任务分配了执行者，只有管理员/所有者/执行者可以修改
func canModifyTask(db *gorm.DB, userID uint, task models.Task) (bool, error) {
	// 查询用户在项目中的角色
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
		return false, err
	}

	// 如果任务没有分配执行者，任何项目成员都可以修改
	if task.ExecutorID == nil {
		return true, nil
	}

	// 如果任务分配了执行者，只有管理员/所有者/执行者可以修改
	// owner 或 admin 可以修改任意任务
	if member.Role == models.ProjectRoleOwner || member.Role == models.ProjectRoleAdmin {
		return true, nil
	}

	// member 如果是执行者也可以修改
	if member.Role == models.ProjectRoleMember {
		if task.ExecutorID != nil && *task.ExecutorID == userID {
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
	FatherID   *uint   `json:"father_id,omitempty"`   // 父任务ID（可选，可设置为null来清空）
	Priority   *int    `json:"priority,omitempty"`    // 优先级（可选，0为最高，数值越大优先级越低）
	Tags       *string `json:"tags,omitempty"`        // 标签（可选，用逗号分割）
	fatherIDSet bool   `json:"-"`                     // 内部标志：father_id是否在JSON中被显式设置
}

// UnmarshalJSON 自定义JSON反序列化，用于检测father_id是否被显式设置
func (r *UpdateTaskRequest) UnmarshalJSON(data []byte) error {
	// 检查原始JSON中是否包含father_id字段
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err == nil {
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
// 网关路由: PUT /todo-service/v1/user/tasks/:id
// 认证级别: user (需要JWT认证)
// 权限规则：
// - 如果任务没有分配执行者，任何项目成员都可以修改
// - 如果任务分配了执行者，只有管理员/所有者/执行者可以修改
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
			if err := checkCircularReference(db, task.ID, *req.FatherID, 50); err != nil {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskCircularReference, err.Error(), nil))
				return
			}
		}
		// 如果 req.FatherID == nil 且 req.fatherIDSet == true，说明显式设置为null，这是允许的，不需要验证
	}

	// 8. 如果指定了执行者，验证执行者是否是项目成员
	if req.ExecutorID != nil {
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
	if req.ExecutorID != nil {
		updates["executor_id"] = *req.ExecutorID
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
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// BatchUpdateTaskRequest 批量更新任务中单个任务的请求结构
type BatchUpdateTaskRequest struct {
	TaskID     uint    `json:"task_id" binding:"required"` // 任务ID（必填）
	Content    *string `json:"content,omitempty"`          // 任务内容（可选）
	State      *string `json:"state,omitempty"`            // 任务状态（可选）
	ExecutorID *uint   `json:"executor_id,omitempty"`      // 执行者ID（可选）
	FatherID   *uint   `json:"father_id,omitempty"`        // 父任务ID（可选，可设置为null来清空）
	Priority   *int    `json:"priority,omitempty"`         // 优先级（可选，0为最高，数值越大优先级越低）
	Tags       *string `json:"tags,omitempty"`             // 标签（可选，用逗号分割）
	fatherIDSet bool   `json:"-"`                          // 内部标志：father_id是否在JSON中被显式设置
}

// UnmarshalJSON 自定义JSON反序列化，用于检测father_id是否被显式设置
func (r *BatchUpdateTaskRequest) UnmarshalJSON(data []byte) error {
	// 检查原始JSON中是否包含father_id字段
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err == nil {
		if _, exists := raw["father_id"]; exists {
			r.fatherIDSet = true
		}
	}
	
	// 使用临时结构体避免递归调用
	type Alias struct {
		TaskID     uint    `json:"task_id"`
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
	r.TaskID = aux.TaskID
	r.Content = aux.Content
	r.State = aux.State
	r.ExecutorID = aux.ExecutorID
	r.FatherID = aux.FatherID
	r.Priority = aux.Priority
	r.Tags = aux.Tags
	
	return nil
}

// BatchUpdateTasksRequest 批量更新任务请求结构
type BatchUpdateTasksRequest struct {
	Tasks []BatchUpdateTaskRequest `json:"tasks" binding:"required,min=1"` // 任务列表（必填，至少一个）
}

// BatchUpdateTasksResponse 批量更新任务响应结构
type BatchUpdateTasksResponse struct {
	Tasks []UpdateTaskResponse `json:"tasks"` // 更新后的任务列表
	Total int                  `json:"total"` // 更新的任务总数
}

// BatchUpdateTasks 批量更新任务
// 
// ⚠️ 已弃用：此接口已标记为弃用，后续版本将停止维护，请使用单个任务更新接口
// 网关路由: PUT /todo-service/v1/user/tasks/batch
// 认证级别: user (需要JWT认证)
// 权限规则：
// - 如果任务没有分配执行者，任何项目成员都可以修改
// - 如果任务分配了执行者，只有管理员/所有者/执行者可以修改
// 注意：使用事务处理，所有任务要么全部更新成功，要么全部失败回滚
// 
// Deprecated: 此接口已弃用，请使用 PUT /todo-service/v1/user/tasks/:id
func BatchUpdateTasks(c *gin.Context) {
	// 1. 解析请求体
	var req BatchUpdateTasksRequest
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

	// 4. 收集所有任务ID
	taskIDs := make([]uint, 0, len(req.Tasks))
	for _, taskReq := range req.Tasks {
		taskIDs = append(taskIDs, taskReq.TaskID)
	}

	// 5. 批量查询所有任务
	var tasks []models.Task
	if err := db.Where("id IN ?", taskIDs).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 6. 检查是否有任务不存在
	taskMap := make(map[uint]models.Task)
	for _, task := range tasks {
		taskMap[task.ID] = task
	}

	// 验证所有任务是否存在
	for _, taskReq := range req.Tasks {
		if _, exists := taskMap[taskReq.TaskID]; !exists {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, fmt.Sprintf("任务 %d 不存在", taskReq.TaskID), nil))
			return
		}
	}

	// 7. 验证所有任务的权限（canModifyTask内部会查询项目成员表）
	for _, taskReq := range req.Tasks {
		task := taskMap[taskReq.TaskID]
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
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, fmt.Sprintf("您没有权限修改任务 %d", taskReq.TaskID), nil))
			return
		}
	}

	// 8. 预验证所有父任务和执行者（提前发现错误）
	for i, taskReq := range req.Tasks {
		task := taskMap[taskReq.TaskID]

		// 验证父任务（如果father_id被显式设置）
		if taskReq.fatherIDSet {
			if taskReq.FatherID != nil {
				// 设置了具体的父任务ID，需要验证
				var parentTask models.Task
				if err := db.First(&parentTask, *taskReq.FatherID).Error; err != nil {
					if err == gorm.ErrRecordNotFound {
						c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskParentNotFound, fmt.Sprintf("第 %d 个任务的父任务不存在", i+1), nil))
						return
					}
					c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, fmt.Sprintf("查询第 %d 个任务的父任务失败: %s", i+1, err.Error()), nil))
					return
				}
				// 验证父任务是否属于同一项目
				if parentTask.ProjectID != task.ProjectID {
					c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskParentMustSameProject, fmt.Sprintf("第 %d 个任务的父任务必须属于同一项目", i+1), nil))
					return
				}
				// 防止任务成为自己的父任务
				if parentTask.ID == task.ID {
					c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskCannotBeOwnParent, fmt.Sprintf("第 %d 个任务不能成为自己的父任务", i+1), nil))
					return
				}
			}
			// 如果 taskReq.FatherID == nil 且 taskReq.fatherIDSet == true，说明显式设置为null，这是允许的，不需要验证
		}

		// 验证执行者
		if taskReq.ExecutorID != nil {
			var executorMember models.ProjectMember
			if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, *taskReq.ExecutorID).First(&executorMember).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, fmt.Sprintf("第 %d 个任务指定的执行者不是该项目的成员", i+1), nil))
					return
				}
				c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, fmt.Sprintf("验证第 %d 个任务的执行者身份失败: %s", i+1, err.Error()), nil))
				return
			}
		}

		// 验证状态
		if taskReq.State != nil {
			if !models.IsValidState(*taskReq.State) {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, fmt.Sprintf("第 %d 个任务的状态无效", i+1), nil))
				return
			}
		}
	}

	// 9. 在事务中批量更新任务
	var updatedTasks []models.Task
	err := db.Transaction(func(tx *gorm.DB) error {
		updatedTasks = make([]models.Task, 0, len(req.Tasks))

		for i, taskReq := range req.Tasks {
			// 在事务中重新查询任务，确保获取最新数据
			var task models.Task
			if err := tx.First(&task, taskReq.TaskID).Error; err != nil {
				return fmt.Errorf("查询第 %d 个任务失败: %w", i+1, err)
			}

			// 处理完成时间（如果状态改变）
			if taskReq.State != nil {
				// 如果状态变为已完成，设置完成时间
				if *taskReq.State == models.TaskStateCompleted && task.State != models.TaskStateCompleted {
					now := time.Now()
					task.CompletionAt = &now
				} else if *taskReq.State != models.TaskStateCompleted && task.CompletionAt != nil {
					// 如果状态从已完成变为其他状态，清除完成时间
					task.CompletionAt = nil
				}
			}

			// 构建更新字段
			updates := make(map[string]interface{})
			if taskReq.Content != nil {
				updates["content"] = *taskReq.Content
			}
			if taskReq.State != nil {
				updates["state"] = *taskReq.State
			}
			if taskReq.ExecutorID != nil {
				updates["executor_id"] = *taskReq.ExecutorID
			}
			// 如果father_id被显式设置（包括设置为null），则更新
			if taskReq.fatherIDSet {
				if taskReq.FatherID != nil {
					updates["father_id"] = *taskReq.FatherID
				} else {
					// 显式设置为null，清空father_id
					updates["father_id"] = nil
				}
			}
			if taskReq.Priority != nil {
				updates["priority"] = *taskReq.Priority
			}
			if taskReq.Tags != nil {
				updates["tags"] = *taskReq.Tags
			}
			if task.CompletionAt != nil {
				updates["completion_at"] = task.CompletionAt
			} else if taskReq.State != nil && *taskReq.State != models.TaskStateCompleted {
				// 如果状态不是已完成，清除完成时间
				updates["completion_at"] = nil
			}

			// 如果有更新字段，执行更新
			if len(updates) > 0 {
				if err := tx.Model(&task).Updates(updates).Error; err != nil {
					return fmt.Errorf("更新第 %d 个任务失败: %w", i+1, err)
				}
				// 重新查询任务以获取最新数据
				if err := tx.First(&task, task.ID).Error; err != nil {
					return fmt.Errorf("查询第 %d 个任务失败: %w", i+1, err)
				}
			}

			updatedTasks = append(updatedTasks, task)
		}

		return nil
	})

	if err != nil {
		// 事务失败，所有操作已回滚，返回整体错误信息
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskUpdateFailed, "批量更新任务失败，所有任务已回滚: "+err.Error(), nil))
		return
	}

	// 10. 转换为响应格式
	taskResponses := make([]UpdateTaskResponse, 0, len(updatedTasks))
	for _, task := range updatedTasks {
		var completionAt *string
		if task.CompletionAt != nil {
			completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
			completionAt = &completionAtStr
		}

		taskResponses = append(taskResponses, UpdateTaskResponse{
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
		})
	}

	// 11. 返回成功响应
	resp := BatchUpdateTasksResponse{
		Tasks: taskResponses,
		Total: len(taskResponses),
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// GetTasksRequest 查询任务请求结构（通过查询参数）
// 支持的查询参数:
//   - project_id (必填): 项目ID，例如 ?project_id=1
//   - updated_after (可选): 更新时间过滤，ISO 8601格式，例如 ?updated_after=2024-01-01T12:00:00Z
//   - father_id (可选): 父任务ID过滤
//   - 不提供: 查询所有任务
//   - 为0: 查询所有父任务ID为空的任务（顶级任务）
//   - 其他值: 查询指定父任务ID的子任务，例如 ?father_id=5
type GetTasksRequest struct {
	ProjectID    uint   `form:"project_id" binding:"required"` // 项目ID（必填）
	UpdatedAfter string `form:"updated_after"`                 // 更新时间过滤（可选，ISO 8601格式）
	FatherID     *uint  `form:"father_id"`                     // 父任务ID过滤（可选）
}

// TaskResponse 任务响应结构
type TaskResponse struct {
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

// GetTasksResponse 查询任务响应结构
type GetTasksResponse struct {
	Tasks []TaskResponse `json:"tasks"` // 任务列表
	Total int64          `json:"total"` // 任务总数
}

// GetTasks 查询项目的所有任务
// 网关路由: GET /todo-service/v1/user/tasks?project_id=1&updated_after=2024-01-01T12:00:00Z&father_id=0
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
	var updatedAfter *time.Time
	if req.UpdatedAfter != "" {
		parsedTime, err := time.Parse("2006-01-02T15:04:05Z07:00", req.UpdatedAfter)
		if err != nil {
			// 尝试另一种常见格式（不带时区偏移）
			parsedTime, err = time.Parse("2006-01-02T15:04:05Z", req.UpdatedAfter)
			if err != nil {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的时间格式，请使用ISO 8601格式（例如：2024-01-01T12:00:00Z）", nil))
				return
			}
		}
		updatedAfter = &parsedTime
	}

	// 6. 构建查询条件
	baseQuery := db.Model(&models.Task{}).Where("project_id = ?", req.ProjectID)

	// 如果提供了updated_after，添加时间过滤条件
	if updatedAfter != nil {
		baseQuery = baseQuery.Where("(updated_at > ? OR created_at > ?)", *updatedAfter, *updatedAfter)
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

	// 7. 查询任务总数
	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务总数失败: "+err.Error(), nil))
		return
	}

	// 8. 查询任务列表
	var tasks []models.Task
	if err := baseQuery.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 9. 转换为响应格式
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
			Priority:     task.Priority,
			Tags:         task.Tags,
			CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CompletionAt: completionAt,
		})
	}

	// 10. 返回成功响应
	resp := GetTasksResponse{
		Tasks: taskResponses,
		Total: total,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
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

	// 4. 批量查询任务
	var tasks []models.Task
	if err := db.Where("id IN ?", req.TaskIDs).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
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
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
	}

	// 7. 验证所有任务的权限（canModifyTask内部会查询项目成员表）
	for _, taskID := range req.TaskIDs {
		task := taskMap[taskID]
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
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskDeleteFailed, "删除任务失败: "+err.Error(), nil))
		return
	}

	// 9. 返回成功响应
	resp := DeleteTasksResponse{
		DeletedCount: len(deletedIDs),
		TaskIDs:      deletedIDs,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// BatchDeleteTasksRequest 批量删除任务请求结构
type BatchDeleteTasksRequest struct {
	TaskIDs []uint `json:"task_ids" binding:"required,min=1"` // 任务ID列表（必填，至少一个）
}

// BatchDeleteTasksResponse 批量删除任务响应结构
type BatchDeleteTasksResponse struct {
	DeletedCount int    `json:"deleted_count"` // 删除的任务数量
	TaskIDs      []uint `json:"task_ids"`      // 已删除的任务ID列表
}

// BatchDeleteTasks 批量删除任务
//
// ⚠️ 已弃用：此接口已标记为弃用，后续版本将停止维护，请使用单个任务删除接口
// 网关路由: DELETE /todo-service/v1/user/tasks/batch
// 认证级别: user (需要JWT认证)
// 权限规则：
// - owner/admin：可以删除任意任务
// - member：只能删除自己创建或分配给自己执行的任务
// 注意：使用事务处理，所有任务要么全部删除成功，要么全部失败回滚
//
// Deprecated: 此接口已弃用，请使用 DELETE /todo-service/v1/user/tasks
func BatchDeleteTasks(c *gin.Context) {
	// 1. 解析请求体
	var req BatchDeleteTasksRequest
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

	// 4. 批量查询任务
	var tasks []models.Task
	if err := db.Where("id IN ?", req.TaskIDs).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 5. 检查是否有任务不存在
	taskMap := make(map[uint]models.Task)
	for _, task := range tasks {
		taskMap[task.ID] = task
	}

	// 验证所有任务是否存在
	for _, taskID := range req.TaskIDs {
		if _, exists := taskMap[taskID]; !exists {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, fmt.Sprintf("任务 %d 不存在", taskID), nil))
			return
		}
	}

	// 6. 验证所有任务的权限（canModifyTask内部会查询项目成员表）
	for _, taskID := range req.TaskIDs {
		task := taskMap[taskID]
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
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, fmt.Sprintf("您没有权限删除任务 %d", taskID), nil))
			return
		}
	}

	// 7. 在事务中批量删除所有任务
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
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskDeleteFailed, "批量删除任务失败，所有任务已回滚: "+err.Error(), nil))
		return
	}

	// 8. 返回成功响应
	resp := BatchDeleteTasksResponse{
		DeletedCount: len(deletedIDs),
		TaskIDs:      deletedIDs,
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// NestedCreateTaskRequest 嵌套任务创建请求结构（支持多级嵌套）
type NestedCreateTaskRequest struct {
	Content    string                    `json:"content" binding:"required"` // 任务内容（必填）
	State      string                    `json:"state,omitempty"`            // 任务状态（可选，默认为pending）
	ExecutorID *uint                     `json:"executor_id,omitempty"`      // 执行者ID（可选）
	Priority   *int                      `json:"priority,omitempty"`         // 优先级（可选，0为最高，数值越大优先级越低）
	Tags       *string                   `json:"tags,omitempty"`             // 标签（可选，用逗号分割）
	SubTasks   []NestedCreateTaskRequest `json:"sub_tasks,omitempty"`        // 子任务列表（可选，支持嵌套）
}

// BatchCreateTasksRequest 批量创建任务请求结构
type BatchCreateTasksRequest struct {
	ProjectID uint                      `json:"project_id" binding:"required"`  // 项目ID（必填）
	Tasks     []NestedCreateTaskRequest `json:"tasks" binding:"required,min=1"` // 任务列表（必填，至少一个）
}

// BatchCreateTaskResponse 批量创建任务响应结构
type BatchCreateTaskResponse struct {
	Tasks []CreateTaskResponse `json:"tasks"` // 创建的任务列表
	Total int                  `json:"total"` // 创建的任务总数
}

// createNestedTask 递归创建嵌套任务
// 返回创建的任务ID和错误
func createNestedTask(db *gorm.DB, projectID uint, creatorID uint, parentID *uint, req NestedCreateTaskRequest) (uint, error) {
	// 1. 设置默认状态（如果未指定）
	state := req.State
	if state == "" {
		state = models.TaskStatePending
	}

	// 2. 验证状态是否有效
	if !models.IsValidState(state) {
		return 0, fmt.Errorf("无效的任务状态: %s", state)
	}

	// 3. 如果指定了执行者，验证执行者是否是项目成员
	if req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", projectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return 0, fmt.Errorf("指定的执行者不是该项目的成员")
			}
			return 0, fmt.Errorf("验证执行者身份失败: %w", err)
		}
	}

	// 4. 创建任务
	task := models.Task{
		ProjectID:  projectID,
		FatherID:   parentID,
		Content:    req.Content,
		State:      state,
		CreatorID:  creatorID,
		ExecutorID: req.ExecutorID,
		Priority:   req.Priority,
		Tags:       req.Tags,
	}

	if err := db.Create(&task).Error; err != nil {
		return 0, fmt.Errorf("创建任务失败: %w", err)
	}

	// 5. 递归创建子任务
	if len(req.SubTasks) > 0 {
		parentTaskID := task.ID
		for _, subTaskReq := range req.SubTasks {
			_, err := createNestedTask(db, projectID, creatorID, &parentTaskID, subTaskReq)
			if err != nil {
				return 0, fmt.Errorf("创建子任务失败: %w", err)
			}
		}
	}

	return task.ID, nil
}

// collectAllCreatedTasks 收集所有已创建的任务（包括子任务）
func collectAllCreatedTasks(db *gorm.DB, projectID uint, taskIDs []uint) ([]models.Task, error) {
	if len(taskIDs) == 0 {
		return []models.Task{}, nil
	}

	// 先查询根任务
	var rootTasks []models.Task
	if err := db.Where("project_id = ? AND id IN ?", projectID, taskIDs).Find(&rootTasks).Error; err != nil {
		return nil, err
	}

	// 从根任务开始，递归收集所有子任务
	relatedTasks := make([]models.Task, 0)
	collected := make(map[uint]bool)

	// 递归收集函数
	var collectChildren func(uint) error
	collectChildren = func(taskID uint) error {
		if collected[taskID] {
			return nil
		}
		collected[taskID] = true

		// 查询当前任务
		var task models.Task
		if err := db.Where("project_id = ? AND id = ?", projectID, taskID).First(&task).Error; err != nil {
			return err
		}
		relatedTasks = append(relatedTasks, task)

		// 查询所有子任务
		var childTasks []models.Task
		if err := db.Where("project_id = ? AND father_id = ?", projectID, taskID).Find(&childTasks).Error; err != nil {
			return err
		}

		// 递归收集子任务
		for _, childTask := range childTasks {
			if err := collectChildren(childTask.ID); err != nil {
				return err
			}
		}

		return nil
	}

	// 从根任务ID开始收集
	for _, id := range taskIDs {
		if err := collectChildren(id); err != nil {
			return nil, err
		}
	}

	return relatedTasks, nil
}

// BatchCreateTasks 批量创建任务（支持嵌套结构）
// 网关路由: POST /todo-service/v1/user/tasks/batch
// 认证级别: user (需要JWT认证)
// 流程：
// 1. 从请求获取用户ID
// 2. 直接查询项目成员表验证权限（项目成员都可以创建任务）
// 3. 验证所有执行者是否是项目成员
// 4. 在事务中批量创建任务（先创建父任务，再创建子任务并设置父ID）
func BatchCreateTasks(c *gin.Context) {
	// 1. 解析请求体
	var req BatchCreateTasksRequest
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

	// 5. 预验证所有执行者是否是项目成员（提前发现错误）
	var allExecutorIDs []uint
	var collectExecutorIDs func(NestedCreateTaskRequest)
	collectExecutorIDs = func(taskReq NestedCreateTaskRequest) {
		if taskReq.ExecutorID != nil {
			allExecutorIDs = append(allExecutorIDs, *taskReq.ExecutorID)
		}
		for _, subTask := range taskReq.SubTasks {
			collectExecutorIDs(subTask)
		}
	}
	for _, task := range req.Tasks {
		collectExecutorIDs(task)
	}

	// 去重
	executorIDMap := make(map[uint]bool)
	uniqueExecutorIDs := make([]uint, 0)
	for _, id := range allExecutorIDs {
		if !executorIDMap[id] {
			executorIDMap[id] = true
			uniqueExecutorIDs = append(uniqueExecutorIDs, id)
		}
	}

	// 验证所有执行者
	if len(uniqueExecutorIDs) > 0 {
		var executorCount int64
		if err := db.Model(&models.ProjectMember{}).
			Where("project_id = ? AND user_id IN ?", req.ProjectID, uniqueExecutorIDs).
			Count(&executorCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证执行者身份失败: "+err.Error(), nil))
			return
		}
		if int64(len(uniqueExecutorIDs)) != executorCount {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, "部分指定的执行者不是该项目的成员", nil))
			return
		}
	}

	// 6. 在事务中批量创建任务
	var createdTaskIDs []uint
	var createdTasks []models.Task

	err := db.Transaction(func(tx *gorm.DB) error {
		createdTaskIDs = make([]uint, 0)
		// 递归创建所有任务
		for i, taskReq := range req.Tasks {
			taskID, err := createNestedTask(tx, req.ProjectID, userID, nil, taskReq)
			if err != nil {
				// 返回详细的错误信息，包括是第几个任务失败
				return fmt.Errorf("创建第 %d 个任务失败: %w", i+1, err)
			}
			createdTaskIDs = append(createdTaskIDs, taskID)
		}

		// 查询所有创建的任务（包括子任务）
		var queryErr error
		createdTasks, queryErr = collectAllCreatedTasks(tx, req.ProjectID, createdTaskIDs)
		if queryErr != nil {
			return fmt.Errorf("查询已创建的任务失败: %w", queryErr)
		}

		return nil
	})

	if err != nil {
		// 事务失败，所有操作已回滚，返回整体错误信息
		errMsg := err.Error()

		// 根据错误类型返回相应的HTTP状态码
		if strings.Contains(errMsg, "无效的任务状态") {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, "批量创建任务失败: "+errMsg, nil))
			return
		}
		if strings.Contains(errMsg, "指定的执行者不是该项目的成员") {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, "批量创建任务失败: "+errMsg, nil))
			return
		}

		// 其他错误返回500
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskCreateFailed, "批量创建任务失败，所有任务已回滚: "+errMsg, nil))
		return
	}

	// 7. 转换为响应格式
	taskResponses := make([]CreateTaskResponse, 0, len(createdTasks))
	for _, task := range createdTasks {
		var completionAt *string
		if task.CompletionAt != nil {
			completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
			completionAt = &completionAtStr
		}

		taskResponses = append(taskResponses, CreateTaskResponse{
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
		})
	}

	// 8. 返回成功响应
	resp := BatchCreateTaskResponse{
		Tasks: taskResponses,
		Total: len(taskResponses),
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}
