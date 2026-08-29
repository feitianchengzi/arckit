import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button, EmptyStateView, ErrorView, LoadingView } from '@/components/ui'
import { ProjectMemberList } from '@/components/features/ProjectMemberList'
import { showGlobalToast } from '@/components/ui/Toast'
import { useOrganizationMembers } from '@/hooks/useOrganizations'
import { useAddProjectMember, useProject, useProjectMembers } from '@/hooks/useProjects'
import { decodeProjectId } from '@/lib/utils/projectRouting'
import { useAuthStore } from '@/store/authStore'
import { useOrganizationStore } from '@/store/organizationStore'
import type { ProjectMember } from '@/types'

export default function FeedbackProjectMembersPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const projectId = decodeProjectId(id) ?? ''
  const numericProjectId = Number(projectId)
  const currentUser = useAuthStore((state) => state.user)
  const currentOrganizationId = useOrganizationStore((state) => state.currentOrganizationId)
  const setCurrentOrganizationId = useOrganizationStore((state) => state.setCurrentOrganizationId)

  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(projectId)
  const { data: members = [], isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useProjectMembers(projectId)
  const projectOrganizationId = Number(project?.organization_id)
  const organizationId = Number.isFinite(projectOrganizationId) && projectOrganizationId > 0
    ? projectOrganizationId
    : currentOrganizationId ?? 0
  const {
    data: organizationMembers = [],
    isLoading: organizationMembersLoading,
    isFetching: organizationMembersFetching,
    error: organizationMembersError,
    refetch: refetchOrganizationMembers,
  } = useOrganizationMembers(organizationId)
  const addProjectMember = useAddProjectMember(projectId)
  const [addingMemberId, setAddingMemberId] = useState<number | null>(null)

  useEffect(() => {
    if (Number.isFinite(projectOrganizationId) && projectOrganizationId > 0) {
      setCurrentOrganizationId(projectOrganizationId)
    }
  }, [projectOrganizationId, setCurrentOrganizationId])

  useEffect(() => {
    if (organizationId > 0) {
      void refetchOrganizationMembers()
    }
  }, [organizationId, refetchOrganizationMembers])

  const currentProjectMember = members.find((member: ProjectMember) => {
    if (member.is_me) return true
    const username = member.username || member.user?.username
    return Boolean(username && username === currentUser?.username)
  })
  const isCreator = Boolean(project?.creator?.username && project.creator.username === currentUser?.username)
  const canManageMembers = isCreator || currentProjectMember?.role === 'owner' || currentProjectMember?.role === 'admin'

  const availableOrganizationMembers = useMemo(
    () => organizationMembers.filter((organizationMember) => (
      !members.some((projectMember: ProjectMember) => projectMember.user_id === organizationMember.user_id)
    )),
    [members, organizationMembers],
  )

  const handleAddMember = async (organizationMemberId: number, userId: number, username: string) => {
    setAddingMemberId(userId)
    try {
      await addProjectMember.mutateAsync({ organizationMemberId })
      await refetchMembers()
      showGlobalToast(`已将 ${username} 添加到项目`, 'success')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || '添加成员失败'
      showGlobalToast(message, 'error', 3000)
    } finally {
      setAddingMemberId(null)
    }
  }

  if (!projectId || !Number.isFinite(numericProjectId)) {
    return <ErrorView title="无效路径" message="项目标识格式不正确" />
  }

  if (projectLoading || membersLoading) {
    return <LoadingView size="lg" text="加载项目成员..." />
  }

  if (projectError || membersError || !project) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取项目成员，请稍后重试"
        onRetry={() => {
          void refetchProject()
          void refetchMembers()
        }}
      />
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] min-h-0 w-full max-w-6xl flex-col gap-4 overflow-hidden lg:h-[calc(100vh-4.5rem)]">
      <header className="flex shrink-0 items-center justify-between gap-4 rounded-lg border border-divider bg-surface-elevated px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/feedbacks/projects/${id}`)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
            aria-label="返回反馈列表"
            title="返回反馈列表"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">项目成员 · {project.name}</h1>
            <p className="mt-0.5 text-xs text-foreground-secondary">组织成员加入项目后，才能查看和处理该项目的反馈。</p>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-surface px-2.5 py-1 text-xs text-foreground-secondary">
          已加入 {members.length} 人
        </span>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:overflow-hidden">
        <section className="min-h-0 overflow-y-auto rounded-lg border border-divider bg-surface-elevated p-4">
          <ProjectMemberList
            members={members}
            projectId={numericProjectId}
            canAddMember={false}
            canManage={canManageMembers}
          />
        </section>

        <section className="min-h-0 overflow-y-auto rounded-lg border border-divider bg-surface-elevated p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">从组织添加</h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              {canManageMembers ? '选择已经加入组织、但尚未加入此项目的成员。' : '只有项目所有者或管理员可以添加成员。'}
            </p>
          </div>

          {organizationMembersLoading || (organizationMembersFetching && organizationMembers.length === 0) ? (
            <LoadingView size="sm" text="加载组织成员..." />
          ) : organizationMembersError ? (
            <EmptyStateView
              title="组织成员加载失败"
              message="请重试获取最新的组织成员"
              actionLabel="重新加载"
              onAction={() => void refetchOrganizationMembers()}
            />
          ) : !canManageMembers ? (
            <EmptyStateView title="暂无管理权限" message="请联系项目所有者或管理员添加成员" />
          ) : availableOrganizationMembers.length === 0 ? (
            <EmptyStateView title="没有可添加的成员" message="组织成员都已加入该项目，或组织中还没有其他成员" />
          ) : (
            <div className="space-y-2">
              {availableOrganizationMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border border-divider bg-surface px-3 py-3">
                  <Avatar user={{ username: member.username, avatar: member.avatar }} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{member.username}</p>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      组织{member.role === 'owner' ? '所有者' : member.role === 'admin' ? '管理员' : '成员'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={addingMemberId === member.user_id}
                    disabled={addProjectMember.isPending && addingMemberId !== member.user_id}
                    onClick={() => handleAddMember(member.id, member.user_id, member.username)}
                  >
                    添加到项目
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
