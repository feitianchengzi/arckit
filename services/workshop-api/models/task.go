package models

import (
	"time"

	"gorm.io/gorm"
)

// Task 任务表
type Task struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`                                                                                       // 主键
	ProjectID    uint           `json:"project_id" gorm:"not null;index;index:idx_tasks_project_updated_at,priority:1;index:idx_tasks_project_father,priority:1"` // 外键：关联的项目ID
	FatherID     *uint          `json:"father_id,omitempty" gorm:"index;index:idx_tasks_project_father,priority:2"`                                               // 外键：父任务ID（可为空，支持任务层级）
	Content      string         `json:"content" gorm:"type:text;not null"`                                                                                        // 任务内容
	State        string         `json:"state" gorm:"type:varchar(50);not null;default:'pending';index"`                                                           // 任务状态
	CreatorID    uint           `json:"creator_id" gorm:"not null;index"`                                                                                         // 外键：创建者ID（保留历史记录，不级联删除）
	ExecutorID   *uint          `json:"executor_id,omitempty" gorm:"index"`                                                                                       // 外键：执行者ID（可为空，保留历史记录，不级联删除）
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`                                                                                         // 创建时间
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime;index:idx_tasks_project_updated_at,priority:2"`                                           // 更新时间
	CompletionAt *time.Time     `json:"completion_at,omitempty"`                                                                                                  // 完成时间（可为空）
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`                                                                       // 软删除时间
	Priority     *int           `json:"priority,omitempty" gorm:"type:int"`                                                                                       // 优先级（可为空，0为最高，数值越大优先级越低）
	Tags         *string        `json:"tags,omitempty" gorm:"type:text"`                                                                                          // 标签（用逗号分割，可为空）

	// belongs to：由fixForeignKeyConstraints函数创建正确的外键约束
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`

	// self-referencing：任务层级（级联删除）
	Parent   *Task  `json:"parent,omitempty" gorm:"foreignKey:FatherID;references:ID"`
	Children []Task `json:"children,omitempty" gorm:"foreignKey:FatherID;references:ID;constraint:OnDelete:CASCADE"`

	// 用户关联（不级联删除，保留历史）
	Creator  User  `json:"creator,omitempty" gorm:"foreignKey:CreatorID;references:ID"`
	Executor *User `json:"executor,omitempty" gorm:"foreignKey:ExecutorID;references:ID"`

	// 任务附件关联（级联删除）
	Attachments []TaskAttachment `json:"attachments,omitempty" gorm:"foreignKey:TaskID;references:ID;constraint:OnDelete:CASCADE"`
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
