'use client'

/**
 * 项目成员管理页面
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, LoadingView, ErrorView, EmptyStateView, RoleSelect, ConfirmDialog } from '@/components/ui'
import { useProject, useProjectMembers, useDeleteProjectMember, useSetMemberRole } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import type { ProjectMember, ProjectRole } from '@/types'

export default function ProjectMembersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const currentUser = useAuthStore((state) => state.user)
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: members, isLoading: membersLoading, error, refetch } = useProjectMembers(projectId)
  const deleteMember = useDeleteProjectMember(projectId)
  const setMemberRole = useSetMemberRole(projectId)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null)
  const [roleEditId, setRoleEditId] = useState<number | null>(null)
  const [newRole, setNewRole] = useState<ProjectRole>('member')
  
  // 加载状态
  if (projectLoading || membersLoading) {
    return <LoadingView size="lg" text="加载成员列表..." />
  }
  
  // 错误状态
  if (error || !project) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取成员列表，请稍后重试"
        onRetry={() => refetch()}
      />
    )
  }
  
  // 当前用户在项目中的角色
  const currentUserMember = members?.find((m: ProjectMember) => m.user_id === currentUser?.id)
  const isOwner = currentUserMember?.role === 'owner'
  const isAdmin = currentUserMember?.role === 'admin' || isOwner
  
  // 处理删除成员（移除或离开）
  const handleDeleteClick = (member: ProjectMember) => {
    // 如果是自己，可以离开
    if (member.user_id === currentUser?.id) {
      setMemberToDelete(member)
      setShowDeleteConfirm(true)
      return
    }
    
    // 只有 owner 可以删除其他成员
    if (!isOwner) {
      return
    }
    
    // 不能删除 owner
    if (member.role === 'owner') {
      alert('不能删除项目所有者')
      return
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
      
      // 如果是离开项目（删除自己），跳转到项目列表
      if (memberToDelete.user_id === currentUser?.id) {
        router.push('/projects')
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || '操作失败，请重试')
    }
  }
  
  // 处理角色编辑
  const handleRoleEdit = (member: ProjectMember) => {
    // 只有 owner 可以编辑角色
    if (!isOwner) return
    // 不能编辑 owner 的角色
    if (member.role === 'owner') return
    // 不能编辑自己的角色
    if (member.user_id === currentUser?.id) return
    
    setRoleEditId(member.id)
    setNewRole(member.role === 'admin' ? 'member' : 'admin')
  }
  
  const handleRoleSave = async (memberId: number) => {
    const member = members?.find((m: ProjectMember) => m.id === memberId)
    if (!member) return
    
    try {
      await setMemberRole.mutateAsync({
        targetUserId: member.user_id,
        role: newRole,
      })
      setRoleEditId(null)
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || '更新角色失败，请重试')
    }
  }
  
  const handleRoleCancel = () => {
    setRoleEditId(null)
    setNewRole('member')
  }
  
  // 获取角色标签
  const getRoleLabel = (role: ProjectRole) => {
    const labels: Record<ProjectRole, string> = {
      owner: '所有者',
      admin: '管理员',
      member: '成员',
    }
    return labels[role]
  }
  
  // 获取角色颜色
  const getRoleColor = (role: ProjectRole) => {
    const colors: Record<ProjectRole, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    }
    return colors[role]
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <BackIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">成员</h1>
            <p className="mt-1 text-gray-600">项目：{project.name}</p>
          </div>
        </div>
        
        {/* 添加新成员按钮 */}
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => router.push(`/projects/${projectId}/invite`)}
          >
            添加新成员
          </Button>
        )}
      </div>
      
      {/* 成员列表 */}
      <div className="bg-white rounded-lg shadow">
        {!members || members.length === 0 ? (
          <EmptyStateView
            title="还没有成员"
            message="添加成员加入项目"
            actionLabel="添加新成员"
            onAction={() => router.push(`/projects/${projectId}/invite`)}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member: ProjectMember) => {
              const isEditing = roleEditId === member.id
              const canEdit = isOwner && member.role !== 'owner' && member.user_id !== currentUser?.id
              const isCurrentUser = member.user_id === currentUser?.id
              // owner 可以删除其他成员，非 owner 只能删除（离开）自己
              const canDelete = (isOwner && member.role !== 'owner') || (isCurrentUser && !isOwner)
              const deleteButtonLabel = isCurrentUser ? '离开' : '移除'
              
              return (
                <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* 头像 */}
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-semibold">
                        {member.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      
                      {/* 用户信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-gray-900">
                            {member.user?.username || '未知用户'}
                          </p>
                          {member.user_id === currentUser?.id && (
                            <span className="text-xs text-gray-500">（我）</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          用户 ID: {member.user_id}
                        </p>
                      </div>
                      
                      {/* 角色 */}
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <RoleSelect
                              value={newRole}
                              onChange={(role) => setNewRole(role as ProjectRole)}
                              disabled={setMemberRole.isPending}
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleRoleSave(member.id)}
                              loading={setMemberRole.isPending}
                            >
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleRoleCancel}
                              disabled={setMemberRole.isPending}
                            >
                              取消
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRoleEdit(member)}
                              >
                                编辑角色
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 ml-4">
                      {canDelete && (
                        <Button
                          size="sm"
                          variant={isCurrentUser ? "secondary" : "danger"}
                          onClick={() => handleDeleteClick(member)}
                          disabled={deleteMember.isPending}
                        >
                          {deleteButtonLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={memberToDelete?.user_id === currentUser?.id ? "确认离开项目" : "确认移除成员"}
        message={
          memberToDelete?.user_id === currentUser?.id
            ? `确定要离开项目 "${project.name}" 吗？离开后将无法访问该项目。`
            : `确定要移除成员 "${memberToDelete?.user?.username || '未知用户'}" 吗？此操作不可撤销。`
        }
        confirmLabel={memberToDelete?.user_id === currentUser?.id ? "离开" : "移除"}
        cancelLabel="取消"
        variant={memberToDelete?.user_id === currentUser?.id ? "secondary" : "danger"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setMemberToDelete(null)
        }}
      />
    </div>
  )
}

// ==================== 图标组件 ====================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
