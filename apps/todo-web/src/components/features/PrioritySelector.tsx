/**
 * PrioritySelector - 优先级选择器组件
 * 参考GitHub的优先级样式设计
 * 
 * 优先级定义：数字越小优先级越高
 * - 0: 🔴 最高 (Urgent)
 * - 1: 🟠 高 (High)
 * - 2: 🟡 中 (Medium)
 * - 3: 🟢 低 (Low)
 * - null/undefined: 无优先级
 */

import { useState } from 'react'
import clsx from 'clsx'

export interface PrioritySelectorProps {
  value?: number | null
  onChange: (priority: number | null) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface PriorityLevel {
  value: number | null
  label: string
  icon: string
  color: string
  bgColor: string
  hoverBg: string
  description?: string
}

const PRIORITY_LEVELS: PriorityLevel[] = [
  {
    value: 0,
    label: '最高',
    icon: '🔴',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    hoverBg: 'hover:bg-red-100',
    description: '紧急且重要，需要立即处理',
  },
  {
    value: 1,
    label: '高',
    icon: '🟠',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-100',
    description: '重要任务，优先处理',
  },
  {
    value: 2,
    label: '中',
    icon: '🟡',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    hoverBg: 'hover:bg-yellow-100',
    description: '正常优先级',
  },
  {
    value: 3,
    label: '低',
    icon: '🟢',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    hoverBg: 'hover:bg-green-100',
    description: '不紧急，可以延后处理',
  },
  {
    value: null,
    label: '无',
    icon: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    hoverBg: 'hover:bg-gray-100',
    description: '未设置优先级',
  },
]

export function PrioritySelector({
  value,
  onChange,
  disabled = false,
  size = 'md',
  className,
}: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentPriority = PRIORITY_LEVELS.find((p) => p.value === value) || PRIORITY_LEVELS[4]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const handleSelect = (priority: number | null) => {
    onChange(priority)
    setIsOpen(false)
  }

  return (
    <div className={clsx('relative', className)}>
      {/* 选择按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-md transition-all',
          'border border-gray-300',
          currentPriority.color,
          currentPriority.bgColor,
          sizeClasses[size],
          !disabled && currentPriority.hoverBg,
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">{currentPriority.icon}</span>
        <span>{currentPriority.label}</span>
        <ChevronIcon
          className={clsx('transition-transform flex-shrink-0', {
            'w-3 h-3': size === 'sm',
            'w-4 h-4': size === 'md',
            'w-5 h-5': size === 'lg',
            'transform rotate-180': isOpen,
          })}
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

          {/* 菜单内容 */}
          <div
            className={clsx(
              'absolute z-20 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200',
              'py-1 max-h-80 overflow-auto'
            )}
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              选择优先级
            </div>
            {PRIORITY_LEVELS.map((priority) => {
              const isSelected = priority.value === value
              return (
                <button
                  key={priority.value ?? 'none'}
                  type="button"
                  onClick={() => handleSelect(priority.value)}
                  className={clsx(
                    'w-full px-3 py-2 text-left flex items-start gap-3',
                    'transition-colors',
                    priority.hoverBg,
                    isSelected && priority.bgColor
                  )}
                >
                  <span className="flex-shrink-0 text-lg mt-0.5">
                    {priority.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={clsx('font-medium', priority.color)}>
                      {priority.label}
                      {isSelected && (
                        <span className="ml-2 text-xs text-primary">✓</span>
                      )}
                    </div>
                    {priority.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {priority.description}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * PriorityBadge - 优先级徽章（只读显示）
 */
export interface PriorityBadgeProps {
  value?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriorityBadge({ value, size = 'md', className }: PriorityBadgeProps) {
  const priority = PRIORITY_LEVELS.find((p) => p.value === value) || PRIORITY_LEVELS[4]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-md',
        'border border-gray-300',
        priority.color,
        priority.bgColor,
        sizeClasses[size],
        className
      )}
    >
      <span className="flex-shrink-0">{priority.icon}</span>
      <span>{priority.label}</span>
    </span>
  )
}

/**
 * 获取优先级配置（用于其他组件）
 */
export function getPriorityConfig(value?: number | null): PriorityLevel {
  return PRIORITY_LEVELS.find((p) => p.value === value) || PRIORITY_LEVELS[4]
}

// 箭头图标组件
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}


