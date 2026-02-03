/**
 * 筛选条件本地存储工具
 * 用于保存和恢复页面筛选条件
 */

import type { DateRange } from '@/components/features/DateRangeFilter'

export type { DateRange }

export interface TaskFilterState {
  statusFilter: string[] | 'ALL'
  creatorFilter: number | 'ME' | null
  executorFilter: number | 'ME' | 'UNASSIGNED' | null
  tagFilter: number | { projectId: string; tagId: number } | null
  priorityFilter: number | null | 'ALL' | 'NONE'
  dateRange: DateRange | null
}

const STORAGE_KEY_TASKS = 'task_filter_state'
const STORAGE_KEY_PROJECT = 'project_filter_state'

/**
 * 保存"我的待办"页面的筛选条件
 */
export function saveTaskFilterState(state: TaskFilterState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(state))
  } catch (error) {
    console.error('保存筛选条件失败:', error)
  }
}

/**
 * 恢复"我的待办"页面的筛选条件
 */
export function loadTaskFilterState(): Partial<TaskFilterState> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS)
    if (!stored) return null
    
    return JSON.parse(stored) as Partial<TaskFilterState>
  } catch (error) {
    console.error('恢复筛选条件失败:', error)
    return null
  }
}

/**
 * 保存"项目详情"页面的筛选条件
 */
export function saveProjectFilterState(projectId: string, state: TaskFilterState): void {
  if (typeof window === 'undefined') return
  
  try {
    const key = `${STORAGE_KEY_PROJECT}_${projectId}`
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.error('保存筛选条件失败:', error)
  }
}

/**
 * 恢复"项目详情"页面的筛选条件
 */
export function loadProjectFilterState(projectId: string): Partial<TaskFilterState> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const key = `${STORAGE_KEY_PROJECT}_${projectId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    
    return JSON.parse(stored) as Partial<TaskFilterState>
  } catch (error) {
    console.error('恢复筛选条件失败:', error)
    return null
  }
}

