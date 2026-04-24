/**
 * 任务树形结构工具函数
 * 将扁平的任务列表转换为树形结构
 */

import { TODO_STATUS_SORT_ORDER } from '@/lib/constants/taskStatus'
import type { Todo } from '@/types'

/**
 * 将扁平的任务列表转换为树形结构
 * @param todos 扁平的任务列表
 * @returns 树形结构的任务列表（只包含根任务，子任务嵌套在 children 中）
 */
export function buildTaskTree(todos: Todo[]): Todo[] {
  // 创建任务映射表
  const taskMap = new Map<number, Todo>()
  const rootTasks: Todo[] = []
  
  // 第一遍遍历：创建所有任务的副本（避免修改原对象）
  todos.forEach(todo => {
    const taskCopy: Todo = {
      ...todo,
      children: [], // 初始化 children 数组
    }
    taskMap.set(todo.id, taskCopy)
  })
  
  // 第二遍遍历：建立父子关系
  todos.forEach(todo => {
    const taskCopy = taskMap.get(todo.id)!
    
    if (todo.parentId) {
      // 有父任务，添加到父任务的 children 中
      const parent = taskMap.get(todo.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(taskCopy)
      } else {
        // 父任务不存在（可能是数据问题），仍然作为根任务
        rootTasks.push(taskCopy)
      }
    } else {
      // 没有父任务，是根任务
      rootTasks.push(taskCopy)
    }
  })
  
  // 递归排序：先按状态排序，再按创建时间倒序
  const sortTasks = (tasks: Todo[]): Todo[] => {
    return tasks
      .sort((a, b) => {
        // 先按状态排序
        const statusDiff = (TODO_STATUS_SORT_ORDER[a.status] || 999) - (TODO_STATUS_SORT_ORDER[b.status] || 999)
        if (statusDiff !== 0) return statusDiff
        
        // 状态相同，按创建时间倒序（最新的在前）
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .map(task => ({
        ...task,
        children: task.children ? sortTasks(task.children) : [],
      }))
  }
  
  return sortTasks(rootTasks)
}

/**
 * 从树形结构中提取所有任务（扁平化）
 * @param tree 树形结构的任务列表
 * @returns 扁平的任务列表
 */
export function flattenTaskTree(tree: Todo[]): Todo[] {
  const result: Todo[] = []
  
  const traverse = (tasks: Todo[]) => {
    tasks.forEach(task => {
      result.push(task)
      if (task.children && task.children.length > 0) {
        traverse(task.children)
      }
    })
  }
  
  traverse(tree)
  return result
}

/**
 * 统计树形结构中的任务数量
 * @param tree 树形结构的任务列表
 * @returns 总任务数（包括所有子任务）
 */
export function countTasksInTree(tree: Todo[]): number {
  return flattenTaskTree(tree).length
}
