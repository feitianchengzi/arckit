/**
 * useTasks - 任务管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { tasksApi, CreateTaskInput, UpdateTaskInput } from '@/lib/api/endpoints/tasks'
import { tasksToTodos, taskToTodo } from '@/lib/utils/taskMapper'
import { useAuthStore } from '@/store/authStore'

/**
 * 获取项目的任务列表
 * 返回所有任务的扁平列表（用于项目详情页面显示）
 */
export function useTaskList(projectId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      const tasks = await tasksApi.listByProject(projectId) // 不需要 user_id
      // 转换为 Todo 模型，返回扁平列表
      const todos = tasksToTodos(tasks)
      
      // 构建任务树关系（用于子任务显示）
      const todoMap = new Map(todos.map(todo => [todo.id, todo]))
      todos.forEach(todo => {
        if (todo.parentId) {
          const parent = todoMap.get(todo.parentId)
          if (parent) {
            if (!parent.children) {
              parent.children = []
            }
            parent.children.push(todo)
          }
        }
      })
      
      // 返回所有任务（扁平列表），用于在项目详情页面显示
      // 子任务会在任务详情页面中通过 children 字段显示
      return todos
    },
    enabled: !!projectId && isAuthenticated, // 只需要检查是否已登录
  })
}

/**
 * 获取任务详情
 * 注意：后端没有单独的获取任务详情接口，我们从任务列表中查找
 */
export function useTask(projectId: string, taskId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId],
    queryFn: async () => {
      // 获取所有任务（包括子任务）
      const allTasks = await tasksApi.listByProject(projectId) // 不需要 user_id
      const todos = tasksToTodos(allTasks)
      
      // 找到目标任务
      const task = todos.find(t => t.id.toString() === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }
      
      // 构建子任务列表
      const children = todos.filter(t => t.parentId === task.id)
      if (children.length > 0) {
        task.children = children
      }
      
      return task
    },
    enabled: !!projectId && !!taskId && isAuthenticated, // 只需要检查是否已登录
  })
}

/**
 * 创建任务
 */
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input), // 不需要 user_id
    onSuccess: (data, variables) => {
      console.log('✅ 任务创建成功，刷新任务列表')
      // 使任务列表缓存失效并强制刷新
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
 * 更新任务
 */
export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      tasksApi.update(projectId, taskId, input), // 不需要 user_id
    onSuccess: () => {
      // 使任务列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      // 使任务详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks', taskId] })
    },
  })
}

/**
 * 删除任务
 */
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(projectId, taskId), // 不需要 user_id
    onSuccess: () => {
      // 使任务列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
    },
  })
}

/**
 * 更新任务状态
 */
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.updateStatus(projectId, taskId, status), // 不需要 user_id
    onSuccess: (_, variables) => {
      // 使任务列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      // 使任务详情缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks', variables.taskId] })
    },
  })
}
