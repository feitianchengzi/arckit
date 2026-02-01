/**
 * 项目成员列表组件
 * 显示项目所有成员，包括头像、用户名、角色等
 */

import { useState, useRef, useCallback } from 'react'
import { Button, EmptyStateView, RoleSelect, ConfirmDialog, TextField } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { PlusIcon, CogIcon, XIcon } from '@/components/ui/icons'
import { useThemeStore } from '@/store/themeStore'

// 复制图标
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

// 已复制图标（勾选）
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
import type { ProjectMember, ProjectRole } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDeleteProjectMember, useSetMemberRole, useAddProjectMember } from '@/hooks/useProjects'
import { useCreateInvitation } from '@/hooks/useInvitations'
import { useOrganizationStore } from '@/store/organizationStore'
import { useOrganizationMembers } from '@/hooks/useOrganizations'
import clsx from 'clsx'

export interface ProjectMemberListProps {
  members: ProjectMember[]
  projectId: number
  canAddMember?: boolean
  canManage?: boolean // 是否有管理权限（owner/admin）
  onViewMembers?: () => void
  onMemberClick?: (member: ProjectMember) => void // 点击成员时的回调
  creatorFilter?: number | 'ME' | null // 创建人筛选
  executorFilter?: number | 'ME' | 'UNASSIGNED' | null // 执行人筛选
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
    member: 'bg-[#DBDBDC] text-gray-700', // 介于 gray-200 和 gray-300 之间的自定义灰色
  }
  return colors[role]
}

export const ProjectMemberList = ({ 
  members, 
  projectId, 
  canAddMember = false, 
  canManage = false,
  onViewMembers,
  onMemberClick,
  creatorFilter,
  executorFilter,
  className 
}: ProjectMemberListProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const theme = useThemeStore((state) => state.theme)
  const [isManaging, setIsManaging] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  // 邀请相关状态
  const createInvitation = useCreateInvitation(String(projectId))
  const [role, setRole] = useState<ProjectRole>('member')
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [maxUses, setMaxUses] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  
  // 用于跟踪每个成员的角色变更请求状态，防止频繁请求
  const roleChangeInProgress = useRef<Set<number>>(new Set())
  const roleChangeTimers = useRef<Map<number, NodeJS.Timeout>>(new Map())
  
  const deleteMember = useDeleteProjectMember(String(projectId))
  const setMemberRole = useSetMemberRole(String(projectId))
  
  const { currentOrganizationId } = useOrganizationStore()
  const { data: orgMembers } = useOrganizationMembers(currentOrganizationId ?? 0, false)
  const addProjectMember = useAddProjectMember(String(projectId))
  const [addingMemberId, setAddingMemberId] = useState<number | null>(null)

  const potentialMembers = orgMembers?.filter(om => 
    // 过滤掉已经是项目成员的用户
    !members.some(pm => pm.user_id === om.user_id) &&
    // 过滤掉当前用户（创建人/自己）
    om.user_id !== currentUser?.id
  ) || []

  const handleAddMember = async (organizationMemberId: number, userId: number) => {
    setAddingMemberId(userId)
    try {
      await addProjectMember.mutateAsync({ organizationMemberId })
    } catch (error) {
      console.error('添加成员失败:', error)
    } finally {
      setAddingMemberId(null)
    }
  }

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
      await deleteMember.mutateAsync({ targetUserId: memberToDelete.user_id })
      setShowDeleteConfirm(false)
      setMemberToDelete(null)
    } catch (error) {
      console.error('删除成员失败:', error)
    }
  }
  
  // 生成邀请
  const handleGenerate = async () => {
    setInviteError('')
    setInviteCode('')
    setInviteLink('')
    
    try {
      const invitationInput: any = {
        project_id: projectId,
        role,
        expires_in_hours: parseInt(expiresInHours) || 0,
      }
      
      // 如果输入了邀请人数，添加到请求中
      if (maxUses.trim() !== '') {
        const maxUsesNum = parseInt(maxUses)
        if (!isNaN(maxUsesNum) && maxUsesNum > 0) {
          invitationInput.max_uses = maxUsesNum
        }
      }
      
      const invitation = await createInvitation.mutateAsync(invitationInput)
      
      setInviteCode(invitation.invite_code)
      
      // 生成邀请链接
      if (invitation.invite_link && invitation.invite_link.startsWith('http')) {
        setInviteLink(invitation.invite_link)
      } else {
        const baseUrl = window.location.origin
        const basePath = import.meta.env.BASE_URL || '/workshop/'
        const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
        setInviteLink(`${baseUrl}${normalizedBasePath}/join/${invitation.invite_code}`)
      }
    } catch (err: any) {
      setInviteError(err.response?.data?.message || '生成邀请失败，请重试')
    }
  }
  
  // 复制到剪贴板
  const handleCopy = async (type: 'code' | 'link') => {
    const text = type === 'code' ? inviteCode : inviteLink
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      alert('复制失败，请手动复制')
    }
  }
  
  // 关闭邀请表单并重置状态
  const handleCloseInviteForm = () => {
    setShowInviteForm(false)
    setInviteCode('')
    setInviteLink('')
    setInviteError('')
    setMaxUses('')
    setRole('member')
    setExpiresInHours('24')
  }

  return (
    <div className={className}>
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">成员</h3>
        {!showInviteForm && (
          <div className="flex items-center gap-2">
            {canAddMember && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
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
                    className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                    title="管理成员"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsManaging(false)}
                    className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                    title="退出管理"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 成员列表或邀请表单 */}
      {showInviteForm && canAddMember ? (
        /* 邀请表单 - 覆盖成员列表 */
        <div className="p-4 bg-surface-elevated rounded-lg border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">邀请新成员</h4>
            <button
              onClick={handleCloseInviteForm}
              className="p-1 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
              title="取消"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* 选择角色 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              成员角色
            </label>
            <RoleSelect
              value={role}
              onChange={setRole}
              disabled={createInvitation.isPending}
            />
          </div>
          
          {/* 过期时间 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              过期时间（小时）
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              disabled={createInvitation.isPending}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="1">1 小时</option>
              <option value="6">6 小时</option>
              <option value="24">24 小时</option>
              <option value="72">3 天</option>
              <option value="168">7 天</option>
              <option value="0">永不过期</option>
            </select>
          </div>
          
          {/* 邀请人数 */}
          <div className="space-y-2">
            <TextField
              id="maxUses"
              label="邀请人数（可选）"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="留空则默认1人"
              helperText="不填写则默认1人，填写后该邀请码可被指定次数的人使用"
              disabled={createInvitation.isPending}
              fullWidth
            />
          </div>
          
          {/* 生成按钮 */}
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={createInvitation.isPending}
            fullWidth
            size="sm"
          >
            {createInvitation.isPending ? '生成中...' : '生成邀请'}
          </Button>
          
          {/* 错误提示 */}
          {inviteError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{inviteError}</p>
            </div>
          )}
          
          {/* 邀请码和链接 */}
          {inviteCode && (
            <div className="space-y-3 pt-4 border-t border-divider">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  邀请码
                </label>
                <div className="flex gap-2 items-center min-w-0">
                  <input
                    type="text"
                    value={inviteCode}
                    readOnly
                    disabled
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-md bg-surface-disabled font-mono text-foreground-secondary cursor-not-allowed"
                  />
                  <button
                    onClick={() => handleCopy('code')}
                    className="flex-shrink-0 p-2 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                    title={copied === 'code' ? '已复制' : '复制邀请码'}
                  >
                    {copied === 'code' ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  邀请链接
                </label>
                <div className="flex gap-2 items-center min-w-0">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    disabled
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-md bg-surface-disabled text-foreground-secondary cursor-not-allowed truncate"
                  />
                  <button
                    onClick={() => handleCopy('link')}
                    className="flex-shrink-0 p-2 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                    title={copied === 'link' ? '已复制' : '复制邀请链接'}
                  >
                    {copied === 'link' ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 从组织添加成员 */}
          {potentialMembers.length > 0 && (
            <div className="pt-4 mt-4 border-t border-divider">
              <h4 className="text-sm font-semibold text-foreground mb-3">从组织添加成员</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {potentialMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-surface-hover border border-transparent hover:border-border transition-all">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ avatar: member.avatar, username: member.username }} className="w-8 h-8" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.username}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            member.role === 'owner' ? "bg-purple-500" :
                            member.role === 'admin' ? "bg-blue-500" : "bg-gray-400"
                          )}></span>
                          <span className="text-xs text-foreground-tertiary">
                            组织{member.role === 'owner' ? '所有者' : member.role === 'admin' ? '管理员' : '成员'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleAddMember(member.id, member.user_id)}
                      loading={addingMemberId === member.user_id}
                      disabled={addProjectMember.isPending && addingMemberId !== member.user_id}
                    >
                      邀请
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !members || members.length === 0 ? (
        <EmptyStateView
          title="还没有成员"
          message="添加成员加入项目"
          actionLabel={canAddMember ? "添加新成员" : undefined}
          onAction={canAddMember ? () => setShowInviteForm(true) : undefined}
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

              // 检查是否为组织成员
              // 如果没有当前组织ID，或者组织成员列表尚未加载，默认为true（不显示非组织成员标记）
              const isOrgMember = !currentOrganizationId || !orgMembers || orgMembers.some(om => om.user_id === member.user_id)

            return (
              <div
                key={member.id}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  isManaging ? "bg-surface-hover" : "hover:bg-surface-hover",
                  !isManaging && onMemberClick && "cursor-pointer"
                )}
                style={{ 
                  backgroundColor: theme === 'dark' 
                    ? '#333338' // 介于 zinc-700 (#3f3f46) 和 zinc-800 (#27272a) 之间
                    : 'var(--color-surface-active)' 
                }}
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
                    <p className="text-sm font-medium text-foreground truncate">
                      {memberUsername}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs text-foreground-secondary">（我）</span>
                    )}
                    {!isOrgMember && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700" title="该成员不在当前组织中">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-[10px]">非组织成员</span>
                      </div>
                    )}
                    {/* 筛选状态图标 */}
                {!isManaging && onMemberClick && (
                  <div className="flex items-center gap-1">
                    {/* 执行人筛选图标 */}
                    {(executorFilter === member.user_id || (executorFilter === 'ME' && currentUser?.id === member.user_id)) && (
                      <svg className="w-3 h-3 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {/* 创建人筛选图标 */}
                    {(creatorFilter === member.user_id || (creatorFilter === 'ME' && currentUser?.id === member.user_id)) && (
                      <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </div>
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
                            "px-2 py-1 text-xs border border-border rounded-md bg-surface-elevated text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                            "disabled:bg-surface-disabled disabled:cursor-not-allowed",
                            "bg-surface-elevated text-foreground"
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

