/**
 * useProjects - 项目管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { projectsApi, CreateProjectInput, UpdateProjectInput } from '@/lib/api/endpoints/projects'
import { useAuthStore } from '@/store/authStore'

/**
 * 获取项目列表
 */
export function useProjectList() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(), // 不需要 user_id，网关自动识别
    // 只在已登录且用户已完成首次设置（有 username）时查询
    enabled: isAuthenticated && !!user && !!user.username,
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
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input), // 不需要 user_id
    onSuccess: (data) => {
      console.log('✅ 项目创建成功，刷新列表')
      // 使项目列表缓存失效，强制刷新
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projects'] })
      
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectsApi.getMembers(projectId), // 不需要 user_id
    enabled: !!projectId && isAuthenticated,
  })
}

/**
 * 删除项目成员
 */
export function useDeleteProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async (targetUserId: number) => {
      if (!user?.id) {
        throw new Error('无法获取用户ID，请先登录')
      }
      return projectsApi.deleteMember(projectId, targetUserId, user.id)
    },
    onSuccess: () => {
      // 使成员列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      // 使项目详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

/**
 * 设置成员角色
 */
export function useSetMemberRole(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async ({ targetUserId, role }: { targetUserId: number; role: 'admin' | 'member' }) => {
      if (!user?.id) {
        throw new Error('无法获取用户ID，请先登录')
      }
      return projectsApi.setMemberRole(projectId, targetUserId, role, user.id)
    },
    onSuccess: () => {
      // 使成员列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      // 使项目详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

