import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronDownIcon, XIcon } from '@/components/ui/icons'

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
  treatEmptyAsAll?: boolean
  showAllOption?: boolean
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
  treatEmptyAsAll = true,
  showAllOption = true,
  maxLabelCount = 1,
}: FilterMultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const normalizedValue = useMemo(() => {
    if (!treatEmptyAsAll || value.length > 0) return value
    return options.map(option => option.value)
  }, [options, treatEmptyAsAll, value])

  const isAllSelected = options.length > 0 && normalizedValue.length === options.length

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 160),
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
    const handleScroll = () => updatePosition()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
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
    if (normalizedValue.length <= maxLabelCount) {
      const labels = options
        .filter(option => normalizedValue.includes(option.value))
        .map(option => option.label)
      return labels.join(', ') || placeholder
    }
    return `已选${normalizedValue.length}项`
  }, [allLabel, isAllSelected, maxLabelCount, normalizedValue, options, placeholder, value.length])

  const handleToggleOption = (optionValue: T) => {
    const current = new Set(normalizedValue)
    if (current.has(optionValue)) {
      current.delete(optionValue)
    } else {
      current.add(optionValue)
    }
    const nextValues = Array.from(current)
    if (treatEmptyAsAll && nextValues.length === options.length) {
      onChange([])
      return
    }
    onChange(nextValues)
  }

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([])
      return
    }
    onChange(options.map(option => option.value))
  }

  const showClear = !disabled && value.length > 0 && !isAllSelected

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

        {showClear && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onChange([])
            }}
            className="absolute -right-1 -top-1 w-4 h-4 bg-warning hover:bg-warning/80 rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-colors z-10"
            aria-label="重置筛选"
          >
            <XIcon className="w-2.5 h-2.5" />
          </button>
        )}

        {open && position && createPortal(
          <div
            ref={menuRef}
            data-filter-popover="true"
            className={clsx(
              'fixed border border-border rounded-md shadow-xl z-[120] py-1 bg-surface-elevated',
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
            {showAllOption && (
              <label className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{allLabel}</span>
              </label>
            )}
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
                  checked={normalizedValue.includes(option.value)}
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
