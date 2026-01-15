'use client'

/**
 * StatusBadge - 状态徽章组件
 */

import clsx from 'clsx'
import type { TodoStatus } from '@/types'
import { getStatusLabel, getStatusColor, getStatusBgColor } from '@/lib/constants/taskStatus'

export interface StatusBadgeProps {
  status: TodoStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        getStatusColor(status),
        getStatusBgColor(status),
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
          'px-4 py-1.5 text-base': size === 'lg',
        },
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}



