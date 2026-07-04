/**
 * useTasks - 待办管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, CreateTaskInput, UpdateTaskInput, type TaskListFilters } from '@/lib/api/endpoints/tasks'
import { tasksToTodos } from '@/lib/utils/taskMapper'
import { flattenTaskTree } from '@/lib/utils/taskTree'
import { useAuthStore } from '@/store/authStore'
import type { ApiMeta } from '@/types/api'

export interface TaskListData {
  todos: ReturnType<typeof tasksToTodos>
  todoTree: ReturnType<typeof tasksToTodos>
  meta: ApiMeta
  total: number
}

export interface UseTaskListOptions {
  enabled?: boolean
  filters?: TaskListFilters
}

/**
 * 获取项目的待办列表
 * 返回所有待办的扁平列表（用于项目详情页面显示）
 */
export function useTaskList(projectId: string, options?: UseTaskListOptions) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const filtersKey = JSON.stringify(options?.filters ?? {})
  
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', filtersKey],
    queryFn: async () => {
      const result = await tasksApi.listTreeByProject(projectId, {
        filters: options?.filters,
      })
      const todoTree = tasksToTodos(result.tasks)
      const todos = flattenTaskTree(todoTree)
      
      return {
        todos,
        todoTree,
        meta: result.meta,
        total: result.total,
      } as TaskListData
    },
    enabled: (options?.enabled !== false) && !!projectId && isAuthenticated, // 支持外部控制是否启用查询
  })
}

/**
 * 获取待办详情
 * 注意：后端没有单独的获取待办详情接口，我们从待办列表中查找
 */
export function useTask(projectId: string, taskId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId],
    queryFn: async () => {
      // 获取所有任务（包括子任务）
      const { tasks: allTasks } = await tasksApi.listByProject(projectId, { page: 1, pageSize: 200 }) // 不需要 user_id
      // console.log('🔍 [任务详情页-待办列表] 获取到的任务列表:', JSON.stringify(allTasks, null, 2))
      const todos = tasksToTodos(allTasks)
      // console.log('🔍 [任务详情页-待办列表] 转换后的待办列表:', JSON.stringify(todos, null, 2))
      
      // 找到目标任务
      const task = todos.find(t => t.id.toString() === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }
      
      // 构建子待办列表
      const children = todos.filter(t => t.parentId === task.id)
      // console.log('🔍 [任务详情页-待办列表] 子待办列表:', JSON.stringify(children, null, 2))
      if (children.length > 0) {
        task.children = children
      }
      
      // 查找父任务（如果有）
      if (task.parentId) {
        const parentTask = todos.find(t => t.id === task.parentId)
        if (parentTask) {
          // 将父任务信息附加到任务对象上（用于导航）
          ;(task as any).parentTask = {
            id: parentTask.id,
            title: parentTask.title,
            content: parentTask.content,
          }
        }
      }
      
      return task
    },
    enabled: !!projectId && !!taskId && isAuthenticated, // 只需要检查是否已登录
  })
}

/**
 * 创建待办
 */
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input), // 不需要 user_id
    onSuccess: (data, variables) => {
      console.log('✅ 待办创建成功，刷新待办列表')
      // 使待办列表缓存失效并强制刷新
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      queryClient.refetchQueries({ queryKey: ['projects', projectId, 'tasks'] })
      
      // 如果创建了子任务，也需要使父任务的详情缓存失效
      if (variables.parentId) {
        queryClient.invalidateQueries({ 
          queryKey: ['projects', projectId, 'tasks', variables.parentId.toString()] 
        })
        queryClient.refetchQueries({ 
          queryKey: ['projects', projectId, 'tasks', variables.parentId.toString()] 
        })
      }
      
      // 注意：不再自动跳转，由调用方决定跳转逻辑
    },
  })
}

/**
 * 更新待办
 */
export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      tasksApi.update(projectId, taskId, input), // 不需要 user_id
    onSuccess: () => {
      // 使待办列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      // 使待办详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks', taskId] })
    },
  })
}

/**
 * 删除待办
 */
export function useDeleteTask(projectId: string | number) {
  const queryClient = useQueryClient()
  const projectIdStr = String(projectId)
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(projectIdStr, taskId), // 不需要 user_id
    onSuccess: () => {
      // 使待办列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectIdStr, 'tasks'] })
    },
  })
}

/**
 * 更新待办状态
 */
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.updateStatus(projectId, taskId, status), // 不需要 user_id
    onSuccess: (_, variables) => {
      // 使待办列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      // 使待办详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks', variables.taskId] })
    },
  })
}
