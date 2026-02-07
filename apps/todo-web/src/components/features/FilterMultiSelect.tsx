import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronDownIcon } from '@/components/ui/icons'

export interface FilterMultiSelectOption<T extends string | number> {
  value: T
  label: string
  disabled?: boolean
}

interface FilterMultiSelectProps<T extends string | number> {
  label: string
  icon?: ReactNode
  value: T[]
  options: FilterMultiSelectOption<T>[]
  onChange: (value: T[]) => void
  placeholder?: string
  allLabel?: string
  className?: string
  buttonClassName?: string
  menuClassName?: string
  active?: boolean
  disabled?: boolean
  maxLabelCount?: number
}

export function FilterMultiSelect<T extends string | number>({
  label,
  icon,
  value,
  options,
  onChange,
  placeholder = '全部',
  allLabel = '全部',
  className,
  buttonClassName,
  menuClassName,
  active = false,
  disabled = false,
  maxLabelCount = 1,
}: FilterMultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const isAllSelected = options.length > 0 && value.length === options.length

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 6 + window.scrollY,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 160),
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current && triggerRef.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedLabel = useMemo(() => {
    if (options.length === 0) return '无选项'
    if (value.length === 0 || isAllSelected) return allLabel
    if (value.length <= maxLabelCount) {
      const labels = options
        .filter(option => value.includes(option.value))
        .map(option => option.label)
      return labels.join(', ') || placeholder
    }
    return `已选${value.length}项`
  }, [allLabel, isAllSelected, maxLabelCount, options, placeholder, value])

  const handleToggleOption = (optionValue: T) => {
    const current = new Set(value)
    if (current.has(optionValue)) {
      current.delete(optionValue)
    } else {
      current.add(optionValue)
    }
    onChange(Array.from(current))
  }

  const handleSelectAll = () => {
    if (options.length === 0) return
    const selectable = options.filter(option => !option.disabled).map(option => option.value)
    onChange(selectable)
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <label
        className={clsx(
          'flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap',
          active ? 'text-warning' : 'text-foreground-secondary'
        )}
      >
        {icon}
        {label}
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (disabled) return
            setOpen(prev => !prev)
          }}
          className={clsx(
            'px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[100px] max-w-[160px] flex items-center justify-between gap-1',
            active ? 'text-warning font-medium' : 'text-foreground',
            disabled && 'opacity-60 cursor-not-allowed',
            buttonClassName
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
        </button>

        {open && position && createPortal(
          <div
            ref={menuRef}
            data-filter-popover="true"
            className={clsx(
              'absolute border border-border rounded-md shadow-xl z-[120] py-1 bg-surface-elevated',
              menuClassName
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              minWidth: `${position.width}px`,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={disabled || options.length === 0}
              >
                全选
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground-secondary hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={disabled}
              >
                清除
              </button>
            </div>
            {options.map(option => (
              <label
                key={String(option.value)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 hover:bg-surface-hover',
                  option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <input
                  type="checkbox"
                  disabled={option.disabled}
                  checked={value.includes(option.value)}
                  onChange={() => {
                    if (option.disabled) return
                    handleToggleOption(option.value)
                  }}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
