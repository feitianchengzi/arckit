'use client'

/**
 * StatusSelect - 状态选择器组件
 */

import { useState } from 'react'
import clsx from 'clsx'
import type { TodoStatus } from '@/types'
import { getStatusLabel, getStatusColor, getStatusBgColor } from '@/lib/constants/taskStatus'

export interface StatusSelectProps {
  value: TodoStatus
  onChange: (status: TodoStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const ALL_STATUSES: TodoStatus[] = ['PENDING_REVIEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED']

export function StatusSelect({ value, onChange, disabled = false, size = 'md' }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentConfig = {
    label: getStatusLabel(value),
    color: getStatusColor(value),
    bgColor: getStatusBgColor(value),
  }
  
  return (
    <div className="relative">
      {/* 选择按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center gap-2 font-medium rounded-full transition-colors',
          currentConfig.color,
          currentConfig.bgColor,
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-sm': size === 'md',
            'px-4 py-1.5 text-base': size === 'lg',
          },
          'hover:opacity-80',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span>{currentConfig.label}</span>
        <ChevronIcon
          className={clsx(
            'transition-transform',
            {
              'w-3 h-3': size === 'sm',
              'w-4 h-4': size === 'md',
              'w-5 h-5': size === 'lg',
            },
            { 'transform rotate-180': isOpen }
          )}
        />
      </button>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 选项列表 */}
          <div 
            className="absolute z-50 mt-1 border border-border rounded-md shadow-lg min-w-[160px] right-0"
            style={{ backgroundColor: 'var(--color-surface-elevated)' }}
          >
            {ALL_STATUSES.map((status) => {
              const statusConfig = {
                label: getStatusLabel(status),
                color: getStatusColor(status),
                bgColor: getStatusBgColor(status),
              }
              
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onChange(status)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full px-4 py-2 text-left',
                    'hover:bg-surface-hover transition-colors',
                    {
                      'bg-primary-light': status === value,
                    }
                  )}
                >
                  <span className={clsx('text-sm font-medium', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== 图标组件 ====================

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}


