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
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <div className={clsx('flex items-center gap-1 flex-wrap', className)}>
      {PRIORITY_LEVELS.map((priority) => {
        const isSelected = priority.value === value
        return (
          <label
            key={priority.value ?? 'none'}
            className={clsx(
              'inline-flex items-center gap-1 font-medium rounded transition-all cursor-pointer',
              'border h-5',
              sizeClasses[size],
              isSelected
                ? clsx(
                    priority.color,
                    priority.bgColor,
                    'border-primary shadow-sm'
                  )
                : clsx(
                    'border-border bg-surface-elevated text-foreground',
                    !disabled && 'hover:bg-surface-hover hover:border-border-hover'
                  ),
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name="priority"
              value={priority.value ?? 'none'}
              checked={isSelected}
              onChange={() => !disabled && onChange(priority.value)}
              disabled={disabled}
              className="sr-only"
            />
            <span className="flex-shrink-0 text-xs leading-none">{priority.icon}</span>
            <span className="text-xs leading-none">{priority.label}</span>
          </label>
        )
      })}
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
        'border border-border',
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



