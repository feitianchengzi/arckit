package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// StringSlice 用于 jsonb 列的 []string 自定义类型
type StringSlice []string

// Value 实现 driver.Valuer
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	return json.Marshal(s)
}

// Scan 实现 sql.Scanner
func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = StringSlice{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("StringSlice.Scan: expected []byte, got %T", value)
	}
	return json.Unmarshal(bytes, s)
}

// Project 项目表
// 使用项目成员表（project_members）管理项目成员和权限，不再使用团队概念
type Project struct {
	ID             uint           `json:"id" gorm:"primaryKey;autoIncrement"`                 // 主键
	Name           string         `json:"name" gorm:"type:varchar(200);not null;index"`       // 项目名称
	GitURL         *string        `json:"git_url,omitempty" gorm:"type:varchar(500);index"`   // 项目Git地址（可空）
	OrganizationID *uint          `json:"organization_id,omitempty" gorm:"index"`             // 外键：组织ID（可空，非空时级联删除）
	CreatorID      uint           `json:"creator_id" gorm:"not null;index"`                   // 外键：创建者ID（保留历史记录，不级联删除）
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`                   // 创建时间
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                   // 更新时间
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"` // 软删除时间

	// belongs to：组织关联（级联删除）
	Organization Organization `json:"organization,omitempty" gorm:"foreignKey:OrganizationID;references:ID"`

	// has many：级联删除约束
	Creator            User                       `json:"creator,omitempty" gorm:"foreignKey:CreatorID;references:ID"`
	Members            []ProjectMember            `json:"members,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Tasks              []Task                     `json:"tasks,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Tags               []Tag                      `json:"tags,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Feedbacks          []Feedback                 `json:"feedbacks,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	FeedbackAccessKeys []ProjectFeedbackAccessKey `json:"feedback_access_keys,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName 指定表名
func (Project) TableName() string {
	return "projects"
}

// ProjectMember 项目成员表
// 替代原来的 teams 和 user_teams 表
// 用户通过此表直接关联到项目，并包含角色信息
type ProjectMember struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`                                                                // 主键
	ProjectID    uint           `json:"project_id" gorm:"not null;index;uniqueIndex:uniq_project_user,priority:1,where:delete_at IS NULL"` // 外键：项目ID
	UserID       uint           `json:"user_id" gorm:"not null;index;uniqueIndex:uniq_project_user,priority:2,where:delete_at IS NULL"`    // 外键：用户ID
	Role         string         `json:"role" gorm:"type:varchar(50);not null;default:'member'"`                                            // 角色：owner, admin, member等
	Duty         *string        `json:"duty,omitempty" gorm:"type:varchar(200)"`                                                           // 职能/职责（可为空）
	IsExternal   bool           `json:"is_external" gorm:"not null;default:false"`                                                         // 是否为组织外部成员，默认为false
	Capabilities StringSlice    `json:"capabilities" gorm:"type:jsonb;not null;default:'[]'"`                                              // 细粒度能力列表，如 ["triage", "manage_code_repos"]
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`                                                                  // 加入时间
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                                                                  // 更新时间
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`                                                // 软删除时间

	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
	User    User    `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

// TableName 指定表名
func (ProjectMember) TableName() string {
	return "project_members"
}

// BeforeCreate GORM hook：确保 Capabilities 非 nil，避免 NOT NULL 约束冲突
func (m *ProjectMember) BeforeCreate(tx *gorm.DB) error {
	if m.Capabilities == nil {
		m.Capabilities = StringSlice{}
	}
	return nil
}

// 项目成员角色常量
const (
	ProjectRoleOwner  = "owner"  // 所有者（项目创建者）
	ProjectRoleAdmin  = "admin"  // 管理员
	ProjectRoleMember = "member" // 成员
)

// 项目成员能力常量
const (
	CapabilityTriage           = "triage"            // 反馈分诊
	CapabilityManageCodeRepos  = "manage_code_repos" // 管理代码仓库
	CapabilityManageKnowledge  = "manage_knowledge"  // 管理知识库
	CapabilityManageOpenHands  = "manage_open_hands" // 管理 OpenHands 配置
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

// HasCapability 检查成员是否具有指定能力
// 支持两种模式：
// 1. 显式 capabilities 字段检查
// 2. 角色默认能力映射（owner/admin 默认拥有 triage 能力）
func (m *ProjectMember) HasCapability(capability string) bool {
	// 首先检查显式设置的 capabilities
	for _, c := range m.Capabilities {
		if c == capability {
			return true
		}
	}

	// 然后检查角色默认能力
	switch m.Role {
	case ProjectRoleOwner, ProjectRoleAdmin:
		// owner 和 admin 默认拥有 triage 能力
		if capability == CapabilityTriage {
			return true
		}
	}

	return false
}

// DefaultCapabilitiesForRole 返回角色的默认能力列表
func DefaultCapabilitiesForRole(role string) []string {
	switch role {
	case ProjectRoleOwner, ProjectRoleAdmin:
		return []string{CapabilityTriage}
	default:
		return []string{}
	}
}

// ProjectInvitation 项目邀请表
// 用于存储项目邀请信息，生成邀请码供用户加入项目
type ProjectInvitation struct {
	ID         uint           `json:"id" gorm:"primaryKey;autoIncrement"`                       // 主键
	ProjectID  uint           `json:"project_id" gorm:"not null;index"`                         // 外键：项目ID（constraint在关联字段上定义）
	InviteCode string         `json:"invite_code" gorm:"type:varchar(64);uniqueIndex;not null"` // 邀请码（唯一）
	Role       string         `json:"role" gorm:"type:varchar(50);not null;default:'member'"`   // 邀请的角色（默认member）
	InviterID  uint           `json:"inviter_id" gorm:"not null;index"`                         // 外键：邀请者ID
	ExpiresAt  *time.Time     `json:"expires_at,omitempty" gorm:"index"`                        // 过期时间（可选）
	MaxUses    int            `json:"max_uses" gorm:"not null;default:1"`                       // 最大使用次数（默认1）
	UsedCount  int            `json:"used_count" gorm:"not null;default:0"`                     // 已使用次数
	UsedAt     *time.Time     `json:"used_at,omitempty"`                                        // 首次使用时间（保留用于兼容）
	CreatedAt  time.Time      `json:"created_at" gorm:"autoCreateTime"`                         // 创建时间
	UpdatedAt  time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                         // 更新时间
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`       // 软删除时间

	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Inviter User    `json:"inviter,omitempty" gorm:"foreignKey:InviterID;references:ID"`
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

// IsUsed 检查邀请是否已达到最大使用次数
func (pi *ProjectInvitation) IsUsed() bool {
	return pi.UsedCount >= pi.MaxUses
}
