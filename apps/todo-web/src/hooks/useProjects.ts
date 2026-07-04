/**
 * useProjects - 项目管理 Hook
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { projectsApi, CreateProjectInput, UpdateProjectInput } from '@/lib/api/endpoints/projects'
import { buildFeedbackProjectPath, buildProjectPath } from '@/lib/utils/projectRouting'
import { useAuthStore } from '@/store/authStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { showGlobalToast } from '@/components/ui/Toast'
import type { Project } from '@/types'

export const PROJECT_LIST_PAGE_SIZE = 30

type ProjectQueryKey = readonly unknown[]

const getProjectListQueryParams = (queryKey: ProjectQueryKey) => {
  if (queryKey[0] !== 'projects') return null

  if (queryKey[1] === 'infinite') {
    const params = queryKey[2]
    return params && typeof params === 'object' ? (params as any) : null
  }

  const params = queryKey[1]
  return params && typeof params === 'object' ? (params as any) : null
}

const normalizeOrganizationId = (organizationId: number | null | undefined) => organizationId ?? null

const queryMatchesOrganization = (queryKey: ProjectQueryKey, organizationId: number | null) => {
  const params = getProjectListQueryParams(queryKey)
  if (!params || !('organizationId' in params)) return false
  return normalizeOrganizationId(params.organizationId) === organizationId
}

const insertProjectIntoCachedLists = (queryClient: ReturnType<typeof useQueryClient>, project: Project) => {
  const projectOrganizationId = normalizeOrganizationId(project.organization_id)
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['projects'] })

  queries.forEach((query) => {
    const queryKey = query.queryKey
    if (!queryMatchesOrganization(queryKey, projectOrganizationId)) return

    if (queryKey[1] === 'infinite') {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.pages?.length) return oldData

        const params = getProjectListQueryParams(queryKey)
        const searchKey = String(params?.searchKey ?? '').trim().toLowerCase()
        if (searchKey && !project.name.toLowerCase().includes(searchKey)) return oldData

        const pages = oldData.pages.map((page: any, pageIndex: number) => {
          const projects = Array.isArray(page.projects)
            ? page.projects.filter((item: Project) => item.id !== project.id)
            : []

          if (pageIndex === 0) {
            projects.unshift(project)
          }

          return {
            ...page,
            projects,
            total: typeof page.total === 'number' ? page.total + 1 : page.total,
            meta: page.meta
              ? {
                  ...page.meta,
                  total: typeof page.meta.total === 'number' ? page.meta.total + 1 : page.meta.total,
                }
              : page.meta,
          }
        })

        return { ...oldData, pages }
      })
      return
    }

    queryClient.setQueryData(queryKey, (oldData: unknown) => {
      if (!Array.isArray(oldData)) return oldData
      return [project, ...oldData.filter((item: Project) => item.id !== project.id)]
    })
  })
}

const removeProjectFromCachedLists = (queryClient: ReturnType<typeof useQueryClient>, projectId: string) => {
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['projects'] })

  queries.forEach((query) => {
    const queryKey = query.queryKey

    if (queryKey[1] === 'infinite') {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.pages?.length) return oldData

        const pages = oldData.pages.map((page: any) => ({
          ...page,
          projects: Array.isArray(page.projects)
            ? page.projects.filter((project: Project) => project.id.toString() !== projectId)
            : page.projects,
          total: typeof page.total === 'number' ? Math.max(0, page.total - 1) : page.total,
          meta: page.meta
            ? {
                ...page.meta,
                total: typeof page.meta.total === 'number' ? Math.max(0, page.meta.total - 1) : page.meta.total,
              }
            : page.meta,
        }))

        return { ...oldData, pages }
      })
      return
    }

    queryClient.setQueryData(queryKey, (oldData: unknown) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.filter((project: Project) => project.id.toString() !== projectId)
    })
  })
}

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
 * 分页获取项目列表，用于侧边栏滚动加载
 */
export function useInfiniteProjectList(
  organizationId?: number | null,
  pageSize = PROJECT_LIST_PAGE_SIZE,
  searchKey = ''
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const currentOrganizationId = useOrganizationStore((state) => state.currentOrganizationId)
  const resolvedOrganizationId = organizationId !== undefined ? organizationId : currentOrganizationId
  const normalizedSearchKey = searchKey.trim()

  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', { organizationId: resolvedOrganizationId, pageSize, searchKey: normalizedSearchKey }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      projectsApi.listPage({
        organizationId: resolvedOrganizationId,
        page: Number(pageParam) || 1,
        pageSize,
        searchKey: normalizedSearchKey,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = lastPage.meta?.page || allPages.length
      const currentPageSize = lastPage.meta?.page_size || pageSize
      const total = lastPage.meta?.total ?? lastPage.total

      if (lastPage.projects.length === 0 || currentPageSize <= 0) {
        return undefined
      }

      if (typeof total === 'number' && total > 0) {
        return currentPage * currentPageSize < total ? currentPage + 1 : undefined
      }

      return lastPage.projects.length >= pageSize ? allPages.length + 1 : undefined
    },
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
  const location = useLocation()
  const queryClient = useQueryClient()
  const setCurrentOrganizationId = useOrganizationStore((state) => state.setCurrentOrganizationId)
  const isFeedbackSection = location.pathname.startsWith('/feedbacks')
  
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input), // 不需要 user_id
    onSuccess: (data, variables) => {
      const organizationId = normalizeOrganizationId(data.organization_id ?? variables.organization_id)
      const project = { ...data, organization_id: organizationId }

      setCurrentOrganizationId(organizationId)
      insertProjectIntoCachedLists(queryClient, project)
      queryClient.setQueryData(['projects', project.id.toString()], project)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projects'], type: 'active' })

      showGlobalToast('项目创建成功', 'success', 2000)
      navigate(isFeedbackSection ? buildFeedbackProjectPath(project.id) : buildProjectPath(project.id), { replace: true })
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
    onSuccess: () => {
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
  const location = useLocation()
  const queryClient = useQueryClient()
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore()
  const isFeedbackSection = location.pathname.startsWith('/feedbacks')
  
  return useMutation({
    mutationFn: (input: string | { projectId: string; organizationId?: number | null }) => {
      const projectId = typeof input === 'string' ? input : input.projectId
      return projectsApi.delete(projectId)
    },
    onSuccess: async (_, input) => {
      const projectId = typeof input === 'string' ? input : input.projectId
      const organizationId = normalizeOrganizationId(
        typeof input === 'string' ? currentOrganizationId : input.organizationId ?? currentOrganizationId
      )
      setCurrentOrganizationId(organizationId)

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
      removeProjectFromCachedLists(queryClient, projectId)
      
      queryClient.invalidateQueries({ queryKey: ['projects'] })

      try {
        const nextPage = await projectsApi.listPage({
          organizationId,
          page: 1,
          pageSize: PROJECT_LIST_PAGE_SIZE,
        })
        const nextProject = nextPage.projects.find((project) => project.id.toString() !== projectId)

        if (nextProject) {
          navigate(
            isFeedbackSection ? buildFeedbackProjectPath(nextProject.id) : buildProjectPath(nextProject.id),
            { replace: true }
          )
          return
        }
      } catch (error) {
        console.error('删除项目后刷新项目列表失败:', error)
      }

      navigate(isFeedbackSection ? '/feedbacks' : '/projects', { replace: true })
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
