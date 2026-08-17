/**
 * 筛选条件本地存储工具
 * 用于保存和恢复页面筛选条件
 */

import type { DateRange } from '@/components/features/DateRangeFilter'

export type { DateRange }

export interface ProjectFilterState {
  statusFilter: string[]
  creatorFilter: number[]
  executorFilter: number[]
  tagFilter: number[]
  priorityFilter: number[]
  dateRange: DateRange | null
}

export interface MyTaskFilterState {
  statusFilter: string[]
  creatorFilter: number[]
  executorFilter: number[]
  tagFilter: string[]
  priorityFilter: number[]
  dateRange: DateRange | null
}

const STORAGE_KEY_TASKS = 'task_filter_state'
const STORAGE_KEY_PROJECT = 'project_filter_state'

/**
 * 保存"我的待办"页面的筛选条件
 */
export function saveTaskFilterState(state: MyTaskFilterState): void {
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
export function loadTaskFilterState(): Partial<MyTaskFilterState> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS)
    if (!stored) return null
    
    return JSON.parse(stored) as Partial<MyTaskFilterState>
  } catch (error) {
    console.error('恢复筛选条件失败:', error)
    return null
  }
}

/**
 * 保存"项目详情"页面的筛选条件
 */
export function saveProjectFilterState(projectId: string, state: ProjectFilterState): void {
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
export function loadProjectFilterState(projectId: string): Partial<ProjectFilterState> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const key = `${STORAGE_KEY_PROJECT}_${projectId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    
    return JSON.parse(stored) as Partial<ProjectFilterState>
  } catch (error) {
    console.error('恢复筛选条件失败:', error)
    return null
  }
}
