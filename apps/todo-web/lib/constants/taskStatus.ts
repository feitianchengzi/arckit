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
    bgColor: 'bg-green-100',
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

