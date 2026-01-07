package models

import (
	"time"
)

// Project 项目表
// 使用项目成员表（project_members）管理项目成员和权限，不再使用团队概念
type Project struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`              // 主键
	Name      string    `json:"name" gorm:"type:varchar(200);not null;index"`    // 项目名称
	GitURL    string    `json:"git_url" gorm:"type:varchar(500);not null;index"` // 项目Git地址
	CreatorID uint      `json:"creator_id" gorm:"not null;index"`                // 外键：创建者ID（⚠️ 保留历史记录，即使用户离职也不级联删除）
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`                // 创建时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`                // 更新时间

	// 关联关系
	Creator User            `json:"creator,omitempty" gorm:"foreignKey:CreatorID"` // 创建者（⚠️ 注意：即使创建者离职，该关联仍然保留，用于历史记录追踪）
	Members []ProjectMember `json:"members,omitempty" gorm:"foreignKey:ProjectID"` // 项目成员列表
	Tasks   []Task          `json:"tasks,omitempty" gorm:"foreignKey:ProjectID"`   // 项目下的任务
}

// TableName 指定表名
func (Project) TableName() string {
	return "projects"
}

// ProjectMember 项目成员表
// 替代原来的 teams 和 user_teams 表
// 用户通过此表直接关联到项目，并包含角色信息
type ProjectMember struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`                     // 主键
	ProjectID uint      `json:"project_id" gorm:"not null;index"`                       // 外键：项目ID
	UserID    uint      `json:"user_id" gorm:"not null;index"`                          // 外键：用户ID
	Role      string    `json:"role" gorm:"type:varchar(50);not null;default:'member'"` // 角色：owner, admin, member等
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`                       // 加入时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`                       // 更新时间

	// 关联关系
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	User    User    `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (ProjectMember) TableName() string {
	return "project_members"
}

// 项目成员角色常量
const (
	ProjectRoleOwner  = "owner"  // 所有者（项目创建者）
	ProjectRoleAdmin  = "admin"  // 管理员
	ProjectRoleMember = "member" // 成员
)

// IsValidProjectRole 验证角色是否有效
func IsValidProjectRole(role string) bool {
	validRoles := []string{
		ProjectRoleOwner,
		ProjectRoleAdmin,
		ProjectRoleMember,
	}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}

// ProjectInvitation 项目邀请表
// 用于存储项目邀请信息，生成邀请码供用户加入项目
type ProjectInvitation struct {
	ID         uint       `json:"id" gorm:"primaryKey;autoIncrement"`                       // 主键
	ProjectID  uint       `json:"project_id" gorm:"not null;index"`                         // 外键：项目ID
	InviteCode string     `json:"invite_code" gorm:"type:varchar(64);uniqueIndex;not null"` // 邀请码（唯一）
	Role       string     `json:"role" gorm:"type:varchar(50);not null;default:'member'"`   // 邀请的角色（默认member）
	InviterID  uint       `json:"inviter_id" gorm:"not null;index"`                         // 外键：邀请者ID
	ExpiresAt  *time.Time `json:"expires_at,omitempty" gorm:"index"`                        // 过期时间（可选）
	UsedAt     *time.Time `json:"used_at,omitempty"`                                        // 使用时间（已使用则不为空）
	CreatedAt  time.Time  `json:"created_at" gorm:"autoCreateTime"`                         // 创建时间
	UpdatedAt  time.Time  `json:"updated_at" gorm:"autoUpdateTime"`                         // 更新时间

	// 关联关系
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	Inviter User    `json:"inviter,omitempty" gorm:"foreignKey:InviterID"`
}

// TableName 指定表名
func (ProjectInvitation) TableName() string {
	return "project_invitations"
}

// IsExpired 检查邀请是否过期
func (pi *ProjectInvitation) IsExpired() bool {
	if pi.ExpiresAt == nil {
		return false // 没有设置过期时间，永不过期
	}
	return time.Now().After(*pi.ExpiresAt)
}

// IsUsed 检查邀请是否已被使用
func (pi *ProjectInvitation) IsUsed() bool {
	return pi.UsedAt != nil
}
