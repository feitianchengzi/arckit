/**
 * 项目成员列表组件
 * 显示项目所有成员，包括头像、用户名、角色等
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyStateView, RoleSelect, ConfirmDialog } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { PlusIcon, CogIcon, XIcon } from '@/components/ui/icons'
import type { ProjectMember, ProjectRole } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDeleteProjectMember, useSetMemberRole } from '@/hooks/useProjects'
import clsx from 'clsx'

export interface ProjectMemberListProps {
  members: ProjectMember[]
  projectId: number
  canAddMember?: boolean
  canManage?: boolean // 是否有管理权限（owner/admin）
  onViewMembers?: () => void
  onMemberClick?: (member: ProjectMember) => void // 点击成员时的回调
  className?: string
}

const getRoleLabel = (role: ProjectRole): string => {
  const labels: Record<ProjectRole, string> = {
    owner: '所有者',
    admin: '管理员',
    member: '成员',
  }
  return labels[role]
}

const getRoleColor = (role: ProjectRole): string => {
  const colors: Record<ProjectRole, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-gray-100 text-gray-700',
  }
  return colors[role]
}

export function ProjectMemberList({
  members,
  projectId,
  canAddMember = false,
  canManage = false,
  onViewMembers,
  onMemberClick,
  className,
}: ProjectMemberListProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [isManaging, setIsManaging] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null)
  
  // 用于跟踪每个成员的角色变更请求状态，防止频繁请求
  const roleChangeInProgress = useRef<Set<number>>(new Set())
  const roleChangeTimers = useRef<Map<number, NodeJS.Timeout>>(new Map())
  
  const deleteMember = useDeleteProjectMember(String(projectId))
  const setMemberRole = useSetMemberRole(String(projectId))

  // 判断当前用户角色
  const currentUserMember = members?.find((m: ProjectMember) => {
    const memberUsername = m.username || m.user?.username
    return memberUsername === currentUser?.username
  })
  const currentUserRole = currentUserMember?.role || null
  const isOwner = currentUserRole === 'owner'
  const isAdmin = currentUserRole === 'admin' || isOwner

  // 处理角色变更（直接请求API，带防抖保护）
  const handleRoleChange = useCallback(async (member: ProjectMember, newRole: 'admin' | 'member') => {
    // 如果角色没有变化，不执行请求
    if (member.role === newRole) {
      return
    }
    
    // 如果该成员正在请求中，取消之前的请求
    if (roleChangeInProgress.current.has(member.user_id)) {
      return
    }
    
    // 清除之前的防抖定时器
    const existingTimer = roleChangeTimers.current.get(member.user_id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      roleChangeTimers.current.delete(member.user_id)
    }
    
    // 设置防抖定时器（300ms）
    const timer = setTimeout(async () => {
      // 标记为请求中
      roleChangeInProgress.current.add(member.user_id)
      
      try {
        await setMemberRole.mutateAsync({
          targetUserId: member.user_id,
          role: newRole,
        })
      } catch (error) {
        console.error('设置角色失败:', error)
      } finally {
        // 请求完成后移除标记
        roleChangeInProgress.current.delete(member.user_id)
        roleChangeTimers.current.delete(member.user_id)
      }
    }, 300)
    
    roleChangeTimers.current.set(member.user_id, timer)
  }, [setMemberRole])

  // 处理删除成员
  const handleDeleteClick = (member: ProjectMember) => {
    const memberUsername = member.username || member.user?.username
    const isCurrentUser = memberUsername === currentUser?.username

    // 权限检查
    if (!isCurrentUser) {
      if (currentUserRole === 'member') return
      if (currentUserRole === 'admin' && member.role === 'owner') return
      if (isOwner && member.role === 'owner') return
    }

    setMemberToDelete(member)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return

    try {
      await deleteMember.mutateAsync(memberToDelete.user_id)
      setShowDeleteConfirm(false)
      setMemberToDelete(null)
    } catch (error) {
      console.error('删除成员失败:', error)
    }
  }

  return (
    <div className={className}>
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">成员</h3>
        <div className="flex items-center gap-2">
          {canAddMember && (
            <button
              onClick={() => navigate(`/projects/${projectId}/invite`)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title="添加成员"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          )}
          {/* 管理按钮常驻，因为成员可以离开 */}
          {members && members.length > 0 && (
            <>
              {!isManaging ? (
                <button
                  onClick={() => setIsManaging(true)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  title="管理成员"
                >
                  <CogIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsManaging(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  title="退出管理"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 成员列表 */}
      {!members || members.length === 0 ? (
        <EmptyStateView
          title="还没有成员"
          message="添加成员加入项目"
          actionLabel={canAddMember ? "添加新成员" : undefined}
          onAction={canAddMember ? () => navigate(`/projects/${projectId}/invite`) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {(() => {
            // 排序规则：自己 -> owner -> admin -> member
            const sortedMembers = [...members].sort((a, b) => {
              const aUsername = a.username || a.user?.username || ''
              const bUsername = b.username || b.user?.username || ''
              const aIsCurrentUser = aUsername === currentUser?.username
              const bIsCurrentUser = bUsername === currentUser?.username
              
              // 自己排第一
              if (aIsCurrentUser && !bIsCurrentUser) return -1
              if (!aIsCurrentUser && bIsCurrentUser) return 1
              
              // 如果都是自己或都不是自己，按角色排序
              const roleOrder: Record<ProjectRole, number> = {
                owner: 1,
                admin: 2,
                member: 3,
              }
              
              // 如果都是自己，保持原顺序
              if (aIsCurrentUser && bIsCurrentUser) return 0
              
              // 按角色排序
              return roleOrder[a.role] - roleOrder[b.role]
            })

            return sortedMembers.map((member) => {
              const memberUsername = member.username || member.user?.username || '未知用户'
              const memberAvatar = member.avatar || member.user?.avatar
              const isCurrentUser = memberUsername === currentUser?.username

              // 权限判断
              // 只有 owner/admin 可以编辑其他人的角色（不能编辑 owner 角色，不能编辑自己）
              const canEditRole = isAdmin && member.role !== 'owner' && !isCurrentUser
              
              // 删除权限：
              // - 任何人都可以离开（删除自己）
              // - owner/admin 可以移除其他人（但不能移除 owner）
              const canDeleteSelf = isCurrentUser // 任何人都可以离开
              const canDeleteOthers = isAdmin && member.role !== 'owner' && !isCurrentUser // owner/admin 可以移除其他人
              const canDelete = canDeleteSelf || canDeleteOthers
              const deleteButtonLabel = isCurrentUser ? '离开' : '移除'
              
              // 检查该成员是否正在请求中
              const isRoleChanging = roleChangeInProgress.current.has(member.user_id)

            return (
              <div
                key={member.id}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  isManaging ? "bg-gray-50" : "hover:bg-gray-50",
                  !isManaging && onMemberClick && "cursor-pointer"
                )}
                onClick={() => {
                  // 非管理模式下，点击成员触发筛选
                  if (!isManaging && onMemberClick) {
                    onMemberClick(member)
                  }
                }}
              >
                {/* 头像 */}
                <Avatar
                  user={{
                    username: memberUsername,
                    avatar: memberAvatar,
                  }}
                  size="md"
                  showTooltip={true}
                />

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {memberUsername}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">（我）</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isManaging && canEditRole ? (
                      // 管理模式下，直接显示下拉选择框
                      <div className="w-32">
                        <select
                          value={member.role === 'owner' ? 'admin' : member.role}
                          onChange={(e) => {
                            const newRole = e.target.value as 'admin' | 'member'
                            handleRoleChange(member, newRole)
                          }}
                          disabled={isRoleChanging || setMemberRole.isPending}
                          className={clsx(
                            "px-2 py-1 text-xs border border-gray-300 rounded-md",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                            "disabled:bg-gray-100 disabled:cursor-not-allowed",
                            "bg-white text-gray-900"
                          )}
                        >
                          <option value="member">成员</option>
                          <option value="admin">管理员</option>
                        </select>
                        {isRoleChanging && (
                          <span className="ml-2 text-xs text-gray-500">更新中...</span>
                        )}
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 管理模式下显示操作按钮 */}
                {isManaging && (
                  <div className="flex items-center gap-2">
                    {/* 普通成员只能看到自己的"离开"按钮 */}
                    {canDeleteSelf && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteClick(member)}
                        disabled={deleteMember.isPending}
                      >
                        离开
                      </Button>
                    )}
                    {/* owner/admin 可以看到其他人的"移除"按钮 */}
                    {canDeleteOthers && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(member)}
                        disabled={deleteMember.isPending}
                      >
                        移除
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
            })
          })()}
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username ? "确认离开项目" : "确认移除成员"}
        message={
          memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username
            ? `确定要离开项目吗？离开后将无法访问该项目。`
            : `确定要移除成员 "${memberToDelete?.user?.username || memberToDelete?.username || '未知用户'}" 吗？此操作不可撤销。`
        }
        confirmLabel={memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username ? "离开" : "移除"}
        cancelLabel="取消"
        variant={memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username ? undefined : "danger"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setMemberToDelete(null)
        }}
      />
    </div>
  )
}

