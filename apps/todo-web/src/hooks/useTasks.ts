/**
 * useTasks - 待办管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tasksApi, CreateTaskInput, UpdateTaskInput } from '@/lib/api/endpoints/tasks'
import { tasksToTodos, taskToTodo } from '@/lib/utils/taskMapper'
import { useAuthStore } from '@/store/authStore'

/**
 * 获取项目的待办列表
 * 返回所有待办的扁平列表（用于项目详情页面显示）
 */
export function useTaskList(projectId: string, options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      const tasks = await tasksApi.listByProject(projectId) // 不需要 user_id
      console.log('🔍 [项目详情页-待办列表] 获取到的任务列表:', JSON.stringify(tasks, null, 2))
      // 转换为 Todo 模型，返回扁平列表
      const todos = tasksToTodos(tasks)
      console.log('🔍 [项目详情页-待办列表] 转换后的待办列表:', JSON.stringify(todos, null, 2))
      
      // 构建待办树关系（用于子待办显示）
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
      
      // 返回所有待办（扁平列表），用于在项目详情页面显示
      // 子待办会在待办详情页面中通过 children 字段显示
      return todos
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
      const allTasks = await tasksApi.listByProject(projectId) // 不需要 user_id
      console.log('🔍 [任务详情页-待办列表] 获取到的任务列表:', JSON.stringify(allTasks, null, 2))
      const todos = tasksToTodos(allTasks)
      console.log('🔍 [任务详情页-待办列表] 转换后的待办列表:', JSON.stringify(todos, null, 2))
      
      // 找到目标任务
      const task = todos.find(t => t.id.toString() === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }
      
      // 构建子待办列表
      const children = todos.filter(t => t.parentId === task.id)
      console.log('🔍 [任务详情页-待办列表] 子待办列表:', JSON.stringify(children, null, 2))
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
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(projectId, taskId), // 不需要 user_id
    onSuccess: () => {
      // 使待办列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
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
