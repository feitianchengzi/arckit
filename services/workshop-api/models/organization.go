package models

import (
	"time"

	"gorm.io/gorm"
)

// Organization 组织表
type Organization struct {
	ID          uint           `json:"id" gorm:"primaryKey;autoIncrement"`                 // 主键
	Name        string         `json:"name" gorm:"type:varchar(200);not null;index"`       // 组织名称
	Description string         `json:"description" gorm:"type:text"`                       // 组织描述（可选）
	CreatorID   uint           `json:"creator_id" gorm:"not null;index"`                   // 外键：创建者ID（保留历史记录，不级联删除）
	CreatedAt   time.Time      `json:"created_at" gorm:"autoCreateTime"`                   // 创建时间
	UpdatedAt   time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                   // 更新时间
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"` // 软删除时间

	// has many：级联删除约束
	Creator  User                 `json:"creator,omitempty" gorm:"foreignKey:CreatorID;references:ID"`
	Members  []OrganizationMember `json:"members,omitempty" gorm:"foreignKey:OrganizationID;references:ID;constraint:OnDelete:CASCADE"`
	Projects []Project            `json:"projects,omitempty" gorm:"foreignKey:OrganizationID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName 指定表名
func (Organization) TableName() string {
	return "organizations"
}

// OrganizationMember 组织成员表
// 用户通过此表关联到组织，并包含角色信息
type OrganizationMember struct {
	ID             uint           `json:"id" gorm:"primaryKey;autoIncrement"`                     // 主键
	OrganizationID uint           `json:"organization_id" gorm:"not null;index"`                  // 外键：组织ID（级联删除）
	UserID         uint           `json:"user_id" gorm:"not null;index"`                          // 外键：用户ID
	Role           string         `json:"role" gorm:"type:varchar(50);not null;default:'member'"` // 角色：owner, admin, member等
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`                       // 加入时间
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                       // 更新时间
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`     // 软删除时间

	Organization Organization `json:"organization,omitempty" gorm:"foreignKey:OrganizationID;references:ID"`
	User         User         `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

// TableName 指定表名
func (OrganizationMember) TableName() string {
	return "organization_members"
}

// 组织成员角色常量
const (
	OrganizationRoleOwner  = "owner"  // 所有者（组织创建者）
	OrganizationRoleAdmin  = "admin"  // 管理员
	OrganizationRoleMember = "member" // 成员
)

// IsValidOrganizationRole 验证角色是否有效
func IsValidOrganizationRole(role string) bool {
	validRoles := []string{
		OrganizationRoleOwner,
		OrganizationRoleAdmin,
		OrganizationRoleMember,
	}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}
