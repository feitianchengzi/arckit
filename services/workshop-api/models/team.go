package models

import (
	"time"
)

// Team 团队表
type Team struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`           // 主键
	Name      string    `json:"name" gorm:"type:varchar(200);not null;index"` // 团队名称
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`             // 创建时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`             // 更新时间

	// 关联关系
	Users    []User    `json:"users,omitempty" gorm:"many2many:user_teams;"` // 团队成员
	Projects []Project `json:"projects,omitempty" gorm:"foreignKey:TeamID"`  // 团队下的项目（一个团队可以有多个项目）
}

// TableName 指定表名
func (Team) TableName() string {
	return "teams"
}

// UserTeam 用户和团队关联表
type UserTeam struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`                     // 主键
	TeamID    uint      `json:"team_id" gorm:"not null;index"`                          // 外键：团队ID
	UserID    uint      `json:"user_id" gorm:"not null;index"`                          // 外键：用户ID
	Role      string    `json:"role" gorm:"type:varchar(50);not null;default:'member'"` // 角色：owner, admin, member等
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`                       // 加入时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`                       // 更新时间

	// 关联关系
	Team Team `json:"team,omitempty" gorm:"foreignKey:TeamID"`
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (UserTeam) TableName() string {
	return "user_teams"
}

// 团队角色常量
const (
	TeamRoleOwner  = "owner"  // 所有者
	TeamRoleAdmin  = "admin"  // 管理员
	TeamRoleMember = "member" // 成员
)
