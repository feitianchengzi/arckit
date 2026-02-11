/**
 * useProjects - 项目管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, CreateProjectInput, UpdateProjectInput } from '@/lib/api/endpoints/projects'
import { buildProjectPath } from '@/lib/utils/projectRouting'
import { useAuthStore } from '@/store/authStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { useOrganizationStore } from '@/store/organizationStore'

/**
 * 获取项目列表
 */
export function useProjectList(organizationId?: number | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const currentOrganizationId = useOrganizationStore((state) => state.currentOrganizationId)
  const resolvedOrganizationId = organizationId !== undefined ? organizationId : currentOrganizationId
  
  return useQuery({
    queryKey: ['projects', { organizationId: resolvedOrganizationId }],
    queryFn: () => projectsApi.list({ organizationId: resolvedOrganizationId }),
    enabled: isAuthenticated && !!user && !!user.username,
  })
}

/**
 * 获取项目详情
 */
export function useProject(projectId: string) {
  const queryClient = useQueryClient()
  const { currentOrganizationId } = useOrganizationStore()
  
  // 尝试从缓存中查找项目信息（包含 organizationId）
  const cachedInfo = useMemo(() => {
    // 获取所有 projects 相关的查询
    const queries = queryClient.getQueriesData({ queryKey: ['projects'] })
    
    for (const [key, data] of queries) {
      // key: ['projects', { organizationId: 123 }]
      // data: Project[]
      if (Array.isArray(data)) {
        const project = data.find((p: any) => p.id?.toString() === projectId)
        if (project) {
          // 尝试从 queryKey 中获取 organizationId
          const params = key[1] as { organizationId?: number } | undefined
          // 如果 queryKey 中有 organizationId，优先使用
          // 如果没有，则使用 project.organization_id
          const organizationId = params?.organizationId ?? project.organization_id
          
          return { project, organizationId }
        }
      }
    }
    return null
  }, [queryClient, projectId])

  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getById(projectId, cachedInfo?.organizationId ?? currentOrganizationId),
    enabled: !!projectId, // 只在有 projectId 时查询
    initialData: cachedInfo?.project,
  })
}

/**
 * 创建项目
 */
export function useCreateProject() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input), // 不需要 user_id
    onSuccess: (data) => {
      console.log('✅ 项目创建成功，刷新列表')
      // 使项目列表缓存失效，强制刷新
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projects'] })
      
      // 跳转到项目详情
      navigate(buildProjectPath(data.id))
    },
  })
}

/**
 * 更新项目
 */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.update(projectId, input),
    onSuccess: (data) => {
      // 更新项目详情缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      // 更新项目列表缓存并主动刷新（确保侧边栏立即更新）
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projects'] })
    },
  })
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: (_, projectId) => {
      // 立即取消该项目的所有正在进行的查询，避免请求已删除的项目数据
      queryClient.cancelQueries({ queryKey: ['projects', projectId] })
      queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] })
      queryClient.cancelQueries({ queryKey: ['projects', projectId, 'members'] })
      queryClient.cancelQueries({ queryKey: ['projects', projectId, 'invitations'] })
      
      // 移除该项目的所有相关查询缓存
      queryClient.removeQueries({ queryKey: ['projects', projectId] })
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'tasks'] })
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'members'] })
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'invitations'] })
      
      // 使项目列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // 跳转回项目列表
      navigate('/projects')
    },
  })
}

/**
 * 获取项目成员
 */
export function useProjectMembers(projectId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { currentOrganizationId } = useOrganizationStore()
  
  return useQuery({
    queryKey: ['projects', projectId, 'members', { organizationId: currentOrganizationId }],
    queryFn: async () => {
      return await projectsApi.getMembers(projectId, currentOrganizationId)
    },
    enabled: !!projectId && isAuthenticated,
  })
}

/**
 * 添加项目成员
 */
export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useMutation({
    mutationFn: async ({ organizationMemberId }: { organizationMemberId: number }) => {
      if (!isAuthenticated) {
        throw new Error('请先登录后再进行操作')
      }
      return projectsApi.addMember(projectId, organizationMemberId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/**
 * 删除项目成员
 * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
 * 权限：owner 和 admin 可以删除任何成员，任何成员都可以删除自己（离开项目）
 */
export function useDeleteProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: number }) => {
      // 检查是否已登录（网关会自动识别用户，不需要传递 user_id）
      if (!isAuthenticated) {
        throw new Error('请先登录后再进行操作')
      }
      // 根据API文档，不需要传递 currentUserId，网关会自动识别当前用户
      return projectsApi.deleteMember(projectId, targetUserId)
    },
    onSuccess: () => {
      // 使成员列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      // 使项目详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      // 使项目列表缓存失效（因为成员数量可能变化）
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/**
 * 设置成员角色
 * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
 */
export function useSetMemberRole(projectId: string) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useMutation({
    mutationFn: async ({ targetUserId, role }: { targetUserId: number; role: 'admin' | 'member' }) => {
      // 检查是否已登录（网关会自动识别用户，不需要 user.id）
      if (!isAuthenticated) {
        throw new Error('请先登录后再进行操作')
      }
      // 根据API文档，不需要传递 currentUserId，网关会自动识别当前用户
      return projectsApi.setMemberRole(projectId, targetUserId, role)
    },
    onSuccess: () => {
      // 使成员列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      // 使项目详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      // 使项目列表缓存失效（因为成员列表是从项目列表中获取的）
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // 主动刷新成员列表
      queryClient.refetchQueries({ queryKey: ['projects', projectId, 'members'] })
    },
  })
}
