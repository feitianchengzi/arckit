import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorView, LoadingView, EmptyStateView } from '@/components/ui'
import { FeedbackManagementDialog } from '@/components/features/FeedbackManagementDialog'
import { useProject } from '@/hooks/useProjects'
import { decodeProjectId } from '@/lib/utils/projectRouting'
import { useOrganizationStore } from '@/store/organizationStore'

export default function FeedbackProjectDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const decodedProjectId = decodeProjectId(id)
  const projectId = decodedProjectId ?? ''
  const { data: project, isLoading, error, refetch } = useProject(projectId)
  const setCurrentOrganizationId = useOrganizationStore((state) => state.setCurrentOrganizationId)
  const settingsPath = `/feedbacks/projects/${id}/settings`
  const membersPath = `/feedbacks/projects/${id}/members`

  useEffect(() => {
    if (typeof project?.organization_id !== 'number') return
    setCurrentOrganizationId(project.organization_id)
  }, [project?.organization_id, setCurrentOrganizationId])

  if (!decodedProjectId) {
    return <ErrorView title="无效路径" message="项目标识格式不正确" />
  }

  if (isLoading) {
    return <LoadingView size="lg" text="加载反馈详情..." />
  }

  if (error) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取项目反馈详情，请稍后重试"
        onRetry={() => refetch()}
      />
    )
  }

  if (!project) {
    return <EmptyStateView title="项目不存在" message="请从左侧重新选择项目" />
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col gap-3 overflow-hidden lg:h-[calc(100vh-4.5rem)]">
      <div className="min-h-0 flex-1">
        <FeedbackManagementDialog
          open={true}
          onClose={() => {}}
          projectId={projectId}
          projectName={project.name}
          embedded
          onOpenMembers={() => navigate(membersPath)}
          onOpenSettings={() => navigate(settingsPath)}
        />
      </div>
    </div>
  )
}
