package models

import (
	"time"
)

// Task 任务表
type Task struct {
	ID           uint       `json:"id" gorm:"primaryKey;autoIncrement"`                             // 主键
	ProjectID    uint       `json:"project_id" gorm:"not null;index"`                               // 外键：关联的项目ID
	FatherID     *uint      `json:"father_id,omitempty" gorm:"index"`                               // 外键：父任务ID（可为空，支持任务层级）
	Content      string     `json:"content" gorm:"type:text;not null"`                              // 任务内容
	State        string     `json:"state" gorm:"type:varchar(50);not null;default:'pending';index"` // 任务状态
	CreatorID    uint       `json:"creator_id" gorm:"not null;index"`                               // 外键：创建者ID（保留历史记录，不级联删除）
	ExecutorID   *uint      `json:"executor_id,omitempty" gorm:"index"`                             // 外键：执行者ID（可为空，保留历史记录，不级联删除）
	CreatedAt    time.Time  `json:"created_at" gorm:"autoCreateTime"`                               // 创建时间
	UpdatedAt    time.Time  `json:"updated_at" gorm:"autoUpdateTime"`                               // 更新时间
	CompletionAt *time.Time `json:"completion_at,omitempty"`                                        // 完成时间（可为空）

	// 关联关系
	Project  Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`   // 所属项目
	Parent   *Task   `json:"parent,omitempty" gorm:"foreignKey:FatherID"`     // 父任务
	Children []Task  `json:"children,omitempty" gorm:"foreignKey:FatherID"`   // 子任务列表
	Creator  User    `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`   // 创建者（⚠️ 注意：即使创建者离职，该关联仍然保留，用于历史记录追踪）
	Executor *User   `json:"executor,omitempty" gorm:"foreignKey:ExecutorID"` // 执行者（⚠️ 注意：即使执行者离职，该关联仍然保留，用于历史记录追踪）
}

// TableName 指定表名
func (Task) TableName() string {
	return "tasks"
}

// 任务状态常量
const (
	TaskStatePending    = "pending"     // 待处理
	TaskStateInProgress = "in_progress" // 进行中
	TaskStateCompleted  = "completed"   // 已完成
	TaskStateCancelled  = "cancelled"   // 已取消
	TaskStateBlocked    = "blocked"     // 已阻塞
)

// IsValidState 验证任务状态是否有效
func IsValidState(state string) bool {
	validStates := []string{
		TaskStatePending,
		TaskStateInProgress,
		TaskStateCompleted,
		TaskStateCancelled,
		TaskStateBlocked,
	}
	for _, validState := range validStates {
		if state == validState {
			return true
		}
	}
	return false
}
