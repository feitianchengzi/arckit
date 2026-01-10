/**
 * useProjects - 项目管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { projectsApi, CreateProjectInput, UpdateProjectInput } from '@/lib/api/endpoints/projects'

/**
 * 获取项目列表
 */
export function useProjectList() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })
}

/**
 * 获取项目详情
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId, // 只在有 projectId 时查询
  })
}

/**
 * 创建项目
 */
export function useCreateProject() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: (data) => {
      // 使项目列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // 跳转到项目详情
      router.push(`/projects/${data.id}`)
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
      // 更新项目列表缓存
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // 更新项目详情缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: () => {
      // 使项目列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // 跳转回项目列表
      router.push('/projects')
    },
  })
}

/**
 * 获取项目成员
 */
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectsApi.getMembers(projectId),
    enabled: !!projectId,
  })
}

