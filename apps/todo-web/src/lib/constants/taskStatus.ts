/**
 * 任务状态常量和工具
 */

import type { TodoStatus } from '@/types'

// 状态显示配置
export const TODO_STATUS_CONFIG: Record<TodoStatus, {
  label: string
  color: string
  bgColor: string
}> = {
  'PENDING_REVIEW': {
    label: '待评审',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  'PENDING': {
    label: '待处理',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  'IN_PROGRESS': {
    label: '进行中',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  'COMPLETED': {
    label: '已完成',
    color: 'text-green-700',
    bgColor: 'bg-green-50 ring-1 ring-green-200/80',
  },
  'ACCEPTED': {
    label: '已验收',
    color: 'text-emerald-950',
    bgColor: 'bg-gradient-to-r from-emerald-300 via-green-200 to-lime-200 ring-1 ring-emerald-300/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
  },
  'CANCELLED': {
    label: '已取消',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  'BLOCKED': {
    label: '已阻塞',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
}

export const TODO_STATUS_SORT_ORDER: Record<TodoStatus, number> = {
  'PENDING_REVIEW': 1,
  'PENDING': 2,
  'IN_PROGRESS': 3,
  'COMPLETED': 4,
  'ACCEPTED': 5,
  'CANCELLED': 6,
  'BLOCKED': 7,
}

const DONE_TODO_STATUSES: TodoStatus[] = ['COMPLETED', 'ACCEPTED']

export function isDoneStatus(status: TodoStatus): boolean {
  return DONE_TODO_STATUSES.includes(status)
}

/**
 * 获取状态显示文本
 */
export function getStatusLabel(status: TodoStatus): string {
  return TODO_STATUS_CONFIG[status]?.label || status
}

/**
 * 获取状态颜色类名
 */
export function getStatusColor(status: TodoStatus): string {
  return TODO_STATUS_CONFIG[status]?.color || 'text-gray-700'
}

/**
 * 获取状态背景色类名
 */
export function getStatusBgColor(status: TodoStatus): string {
  return TODO_STATUS_CONFIG[status]?.bgColor || 'bg-gray-100'
}
