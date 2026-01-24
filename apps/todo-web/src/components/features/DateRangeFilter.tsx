import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import clsx from 'clsx'

export interface DateRange {
  startDate: string | null
  endDate: string | null
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

// 快捷操作类型
type QuickOption = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'clear'

// 获取快捷操作的日期范围
function getQuickDateRange(option: QuickOption): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  switch (option) {
    case 'today': {
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(today),
        endDate: formatDate(end),
      }
    }
    case 'yesterday': {
      const start = new Date(yesterday)
      const end = new Date(yesterday)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      }
    }
    case 'thisWeek': {
      const start = new Date(today)
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // 周一
      start.setDate(diff)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      }
    }
    case 'lastWeek': {
      const start = new Date(today)
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // 本周周一
      start.setDate(diff - 7) // 上周周一
      const end = new Date(start)
      end.setDate(end.getDate() + 6) // 上周周日
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      }
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      }
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      }
    }
    case 'clear':
      return {
        startDate: null,
        endDate: null,
      }
    default:
      return {
        startDate: null,
        endDate: null,
      }
  }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期显示
function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null)

  // 计算弹窗位置
  useEffect(() => {
    if (showPicker && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    } else {
      setPickerPosition(null)
    }
  }, [showPicker])

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
        setShowQuickOptions(false)
      }
    }

    if (showPicker || showQuickOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showPicker, showQuickOptions])

  const handleQuickOption = (option: QuickOption) => {
    const range = getQuickDateRange(option)
    onChange(range)
    setShowQuickOptions(false)
    setShowPicker(false)
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      startDate: e.target.value || null,
    })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: e.target.value || null,
    })
  }

  const hasFilter = value.startDate !== null || value.endDate !== null

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      {/* 日期筛选按钮 */}
      <button
        type="button"
        onClick={() => {
          setShowPicker(!showPicker)
          setShowQuickOptions(false)
        }}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 text-sm border rounded-md transition-colors h-[28px]",
          "max-w-[140px] min-w-[80px]",
          hasFilter
            ? "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-400 font-medium"
            : "text-foreground-secondary border-border bg-surface-elevated hover:bg-surface-hover"
        )}
      >
        <svg
          className={clsx("w-4 h-4 flex-shrink-0", hasFilter ? "text-orange-500 dark:text-orange-400" : "text-foreground-tertiary")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="truncate flex-1 min-w-0 text-left whitespace-nowrap">
          {hasFilter
            ? value.startDate && value.endDate
              ? `${formatDisplayDate(value.startDate)}-${formatDisplayDate(value.endDate)}`
              : value.startDate
              ? `${formatDisplayDate(value.startDate)}`
              : `${formatDisplayDate(value.endDate)}`
            : '日期'}
        </span>
        {hasFilter && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange({ startDate: null, endDate: null })
            }}
            className="ml-0.5 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 flex-shrink-0"
            title="清除"
          >
            ×
          </button>
        )}
      </button>

      {/* 日期选择器面板 - 使用 Portal 渲染到 body */}
      {showPicker && pickerPosition && createPortal(
        <div 
          ref={pickerRef}
          className="fixed z-[100] border border-border rounded-lg shadow-lg p-4 min-w-[320px]"
          style={{
            top: `${pickerPosition.top}px`,
            left: `${pickerPosition.left}px`,
            backgroundColor: 'var(--color-surface-elevated)',
            zIndex: 100
          }}
          onClick={(e) => {
            // 阻止事件冒泡，防止触发父级的点击外部关闭逻辑
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            // 阻止事件冒泡，防止触发父级的点击外部关闭逻辑
            e.stopPropagation()
          }}
        >
          {/* 快捷操作 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">快捷选择</span>
              <button
                type="button"
                onClick={() => setShowQuickOptions(!showQuickOptions)}
                className="text-xs text-foreground-secondary hover:text-foreground"
              >
                {showQuickOptions ? '收起' : '展开'}
              </button>
            </div>
            {showQuickOptions && (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('today')}
                  className="text-xs"
                >
                  今天
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('yesterday')}
                  className="text-xs"
                >
                  昨天
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('thisWeek')}
                  className="text-xs"
                >
                  本周
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('lastWeek')}
                  className="text-xs"
                >
                  上周
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('thisMonth')}
                  className="text-xs"
                >
                  本月
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickOption('lastMonth')}
                  className="text-xs"
                >
                  上月
                </Button>
              </div>
            )}
          </div>

          {/* 日期范围输入 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                开始日期
              </label>
              <input
                type="date"
                value={value.startDate || ''}
                onChange={handleStartDateChange}
                max={value.endDate || undefined}
                className="w-full px-2 py-1.5 text-sm border border-border bg-surface-elevated text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                结束日期
              </label>
              <input
                type="date"
                value={value.endDate || ''}
                onChange={handleEndDateChange}
                min={value.startDate || undefined}
                className="w-full px-2 py-1.5 text-sm border border-border bg-surface-elevated text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickOption('clear')}
              className="flex-1 text-xs"
            >
              清除
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowPicker(false)}
              className="flex-1 text-xs"
            >
              确定
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

