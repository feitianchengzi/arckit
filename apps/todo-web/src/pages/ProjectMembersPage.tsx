
/**
 * 项目成员管理页面
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView, RoleSelect, ConfirmDialog } from '@/components/ui'
import { useProject, useProjectMembers, useDeleteProjectMember, useSetMemberRole } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { getAuthInfo } from '@/lib/utils/tokenManager'
import type { ProjectMember, ProjectRole } from '@/types'

export default function ProjectMembersPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  
  const currentUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: project, isLoading: projectLoading } = useProject(String(projectId))
  const { data: members, isLoading: membersLoading, error, refetch } = useProjectMembers(String(projectId))
  
  // 监听成员列表变化，打印日志
  useEffect(() => {
    if (members) {
      // console.log('📋 [成员列表更新] 成员列表已更新')
      // console.log('📋 [成员列表更新] 成员数量:', members.length)
      // console.log('📋 [成员列表更新] 成员详细信息:')
      // members.forEach((member: ProjectMember, index: number) => {
      //   console.log(`📋 [成员列表更新] 成员 ${index + 1}:`, {
      //     id: member.id,
      //     project_id: member.project_id,
      //     user_id: member.user_id,
      //     role: member.role,
      //     username: member.username || member.user?.username,
      //     avatar: member.avatar || member.user?.avatar,
      //     created_at: member.created_at,
      //     updated_at: member.updated_at,
      //     user: member.user,
      //   })
      // })
      // console.log('📋 [成员列表更新] 完整成员列表:', JSON.stringify(members, null, 2))
    }
  }, [members])
  const deleteMember = useDeleteProjectMember(projectId)
  const setMemberRole = useSetMemberRole(projectId)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null)
  const [roleEditId, setRoleEditId] = useState<number | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member')
  
  // 如果已认证但没有用户信息，尝试加载用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      // 只在认证且没有 username 时加载，避免无限循环
      if (!isAuthenticated || currentUser?.username) {
        return
      }
      
      try {
        console.log('📥 成员页面：加载用户信息...')
        
        // 尝试获取当前登录用户信息
        try {
          console.log('📥 成员页面：获取当前登录用户信息...')
          const user = await todoUserApi.getCurrentUser()
          useAuthStore.getState().setUser(user)
          console.log('✅ 成员页面：用户信息加载成功, username:', user.username)
        } catch (getUserError: any) {
          // 如果获取失败（404 = 用户不存在），创建新用户
          console.log('⚠️ 成员页面：获取用户失败')
          
          if (getUserError.response?.status === 404) {
            console.log('用户不存在，创建新用户...')
            
            try {
              const userResponse = await todoUserApi.createOrGetUser({ username: '新用户' })
              const newUser = {
                id: 0, // API 不返回数据库 ID
                uuid: '', // 网关会处理 UUID
                username: userResponse.username || '',
                avatar: userResponse.avatar || '',
                created_at: userResponse.created_at || '',
                updated_at: userResponse.updated_at || '',
              }
              
              useAuthStore.getState().setUser(newUser)
              console.log('✅ 成员页面：新用户创建成功')
            } catch (createError) {
              console.error('❌ 成员页面：创建用户失败:', createError)
            }
          }
        }
      } catch (error) {
        console.error('❌ 成员页面：获取用户信息失败:', error)
      }
    }
    
    loadUserInfo()
  }, [isAuthenticated, currentUser?.username]) // 只依赖 username，避免无限循环
  
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
  
  // 当前用户在项目中的角色（通过 is_me 字段）
  const currentUserMember = members?.find((m: ProjectMember) => m.is_me === true)
  
  // 判断是否是项目创建者
  // 通过 username 比较
  const isCreator = project.creator?.username === currentUser?.username
  
  // 当前用户的角色（从成员列表获取，如果找不到但用户是创建者，则默认为 owner）
  const currentUserRole: ProjectRole | null = currentUserMember?.role || (isCreator ? 'owner' : null)
  
  // 判断是否是 owner（在成员列表中或者是创建者且不在成员列表中）
  const isOwner = currentUserRole === 'owner'
  
  // 判断是否是 admin（admin 或 owner，owner 默认也是 admin）
  const isAdmin = currentUserRole === 'admin' || isOwner
  
  // 是否有权限添加成员（admin 或 owner）
  // owner 默认也是 admin，所以有权限
  const canAddMember = isAdmin
  
  console.log('👤 当前用户权限检查:', { 
    currentUsername: currentUser?.username,
    projectCreatorUsername: project.creator?.username,
    isCreator,
    currentUserRole,
    members: members?.map(m => ({ 
      id: m.id, 
      role: m.role, 
      username: m.user?.username || (m as any).username 
    })),
    currentUserMember,
    isOwner,
    isAdmin,
    canAddMember
  })
  
  // 处理删除成员（移除或离开）
  const handleDeleteClick = (member: ProjectMember) => {
    // 通过 username 匹配当前用户（因为 API 不返回数据库 ID）
    const memberUsername = member.username || member.user?.username
    const isCurrentUser = memberUsername === currentUser?.username
    
    // 如果是自己，任何角色都可以离开
    if (isCurrentUser) {
      setMemberToDelete(member)
      setShowDeleteConfirm(true)
      return
    }
    
    // 如果不是自己，需要检查权限
    // member：不能删除其他成员
    if (currentUserRole === 'member') {
      return // member 只能离开，不能删除其他成员
    }
    
    // admin：可以删除其他成员，但不能删除 owner
    if (currentUserRole === 'admin') {
      if (member.role === 'owner') {
        alert('不能删除项目所有者')
        return
      }
      setMemberToDelete(member)
      setShowDeleteConfirm(true)
      return
    }
    
    // owner：可以删除其他成员，但不能删除自己（已在上面处理）
    if (isOwner) {
      // owner 不能删除其他 owner（虽然通常只有一个 owner）
      if (member.role === 'owner') {
        alert('不能删除项目所有者')
        return
      }
      setMemberToDelete(member)
      setShowDeleteConfirm(true)
      return
    }
  }
  
  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return
    
    console.log('🔍 [删除确认] 开始删除成员流程')
    console.log('🔍 [删除确认] 要删除的成员:', {
      id: memberToDelete.id,
      user_id: memberToDelete.user_id,
      username: memberToDelete.username || memberToDelete.user?.username,
      role: memberToDelete.role,
    })
    console.log('🔍 [删除确认] 当前用户:', {
      id: currentUser?.id,
      username: currentUser?.username,
      role: currentUserRole,
    })
    console.log('🔍 [删除确认] 项目ID:', projectId)
    
    try {
      // 根据API文档，不需要传递 currentUserId，网关会自动识别当前用户
      console.log('🔍 [删除确认] 调用 deleteMember.mutateAsync')
      console.log('🔍 [删除确认] 参数:', { targetUserId: memberToDelete.user_id })
      
      await deleteMember.mutateAsync({
        targetUserId: memberToDelete.user_id,
      })
      
      console.log('✅ [删除确认] mutateAsync 成功')
      setShowDeleteConfirm(false)
      setMemberToDelete(null)
      
      // 如果是离开项目（删除自己），跳转到项目列表
      const memberUsername = memberToDelete.username || memberToDelete.user?.username
      if (memberUsername === currentUser?.username) {
        console.log('🔍 [删除确认] 删除的是自己，跳转到项目列表')
        navigate('/projects')
      }
    } catch (err: any) {
      console.error('❌ [删除确认] 删除成员失败:', err?.message)
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || '操作失败，请重试'
      alert(errorMessage)
    }
  }
  
  // 处理角色编辑
  const handleRoleEdit = (member: ProjectMember) => {
    // 只有 owner 可以编辑角色
    if (!isOwner) return
    // 不能编辑 owner 的角色
    if (member.role === 'owner') return
    // 不能编辑自己的角色（通过 username 匹配，因为 API 可能不返回数据库 ID）
    const memberUsername = member.username || member.user?.username
    if (memberUsername === currentUser?.username) return
    
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
      // 主动刷新成员列表以确保显示最新数据
      await refetch()
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
            onClick={() => navigate(-1)}
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
        {/* 项目创建者（owner）或管理员（admin）可以添加成员 */}
        {canAddMember && (
          <Button
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/invite`)}
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
            actionLabel={canAddMember ? "添加新成员" : undefined}
            onAction={canAddMember ? () => navigate(`/projects/${projectId}/invite`) : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member: ProjectMember) => {
              const isEditing = roleEditId === member.id
              // 通过 username 匹配当前用户（因为 API 不返回数据库 ID）
              const memberUsername = member.username || member.user?.username
              const isCurrentUser = memberUsername === currentUser?.username
              
              // 只有 owner 可以编辑其他成员的角色
              // 不能编辑 owner 的角色，不能编辑自己的角色
              const canEdit = isOwner && member.role !== 'owner' && !isCurrentUser
              
              // 删除/离开权限判断：
              // 1. 如果是自己，任何角色都可以离开
              // 2. 如果不是自己：
              //    - member：不能删除其他成员
              //    - admin：可以删除其他成员（但不能删除 owner）
              //    - owner：可以删除其他成员（但不能删除其他 owner）
              const canDelete = isCurrentUser || 
                               (currentUserRole === 'admin' && member.role !== 'owner') ||
                               (isOwner && member.role !== 'owner')
              
              const deleteButtonLabel = isCurrentUser ? '离开' : '移除'
              
              return (
                <div key={member.id} className="p-6 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* 头像 */}
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-semibold">
                        {((member.username || member.user?.username)?.charAt(0)?.toUpperCase() || 'U')}
                      </div>
                      
                      {/* 用户信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-foreground">
                            {memberUsername || '未知用户'}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-foreground-secondary">（我）</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 角色 */}
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <RoleSelect
                              value={newRole}
                              onChange={(role) => setNewRole(role as 'admin' | 'member')}
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
        title={memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username ? "确认离开项目" : "确认移除成员"}
        message={
          memberToDelete && (memberToDelete.username || memberToDelete.user?.username) === currentUser?.username
            ? `确定要离开项目 "${project.name}" 吗？离开后将无法访问该项目。`
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

// ==================== 图标组件 ====================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
