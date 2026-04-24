import { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback, type ReactNode } from 'react'
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

const MENU_GAP = 6
const VIEWPORT_PADDING = 8
const MIN_MENU_WIDTH = 160

interface MenuPosition {
  top: number
  left: number
  maxHeight: number
  minWidth: number
  maxWidth: number
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
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedValueSet = useMemo(() => new Set(value), [value])
  const selectableOptions = useMemo(
    () => options.filter(option => !option.disabled),
    [options]
  )
  const selectedSelectableCount = useMemo(
    () => selectableOptions.filter(option => selectedValueSet.has(option.value)).length,
    [selectableOptions, selectedValueSet]
  )
  const isAllSelected = selectableOptions.length > 0 && selectedSelectableCount === selectableOptions.length

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const menuElement = menuRef.current
    const naturalWidth = menuElement.scrollWidth
    const naturalHeight = menuElement.scrollHeight
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const maxWidth = Math.max(viewportWidth - VIEWPORT_PADDING * 2, MIN_MENU_WIDTH)
    const minWidth = Math.max(Math.round(triggerRect.width), MIN_MENU_WIDTH)
    const renderedWidth = Math.min(Math.max(naturalWidth, minWidth), maxWidth)
    const spaceBelow = Math.max(
      viewportHeight - triggerRect.bottom - MENU_GAP - VIEWPORT_PADDING,
      0
    )
    const spaceAbove = Math.max(
      triggerRect.top - MENU_GAP - VIEWPORT_PADDING,
      0
    )
    const shouldOpenBelow =
      spaceBelow >= naturalHeight || spaceBelow >= spaceAbove
    const availableHeight = shouldOpenBelow ? spaceBelow : spaceAbove
    const renderedHeight = Math.min(naturalHeight, availableHeight)

    let top = shouldOpenBelow
      ? triggerRect.bottom + MENU_GAP
      : triggerRect.top - MENU_GAP - renderedHeight

    if (shouldOpenBelow) {
      top = Math.min(top, viewportHeight - VIEWPORT_PADDING - renderedHeight)
    } else {
      top = Math.max(top, VIEWPORT_PADDING)
    }

    let left = triggerRect.left
    const maxLeft = viewportWidth - VIEWPORT_PADDING - renderedWidth
    left = Math.min(left, maxLeft)
    left = Math.max(left, VIEWPORT_PADDING)

    setMenuPosition({
      top,
      left,
      maxHeight: Math.max(availableHeight, 0),
      minWidth,
      maxWidth,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    updateMenuPosition()
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current && triggerRef.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
      setOpen(false)
    }

    const handleViewportChange = () => {
      updateMenuPosition()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open, updateMenuPosition])

  const selectedLabel = useMemo(() => {
    if (options.length === 0) return '无选项'
    if (value.length === 0) return allLabel
    // 仅在存在多个可选项且被全选时才折叠为“全部”
    if (isAllSelected && selectableOptions.length > 1) return allLabel
    if (value.length <= maxLabelCount) {
      const labels = options
        .filter(option => selectedValueSet.has(option.value))
        .map(option => option.label)
      return labels.join(', ') || placeholder
    }
    return `已选${value.length}项`
  }, [allLabel, isAllSelected, maxLabelCount, options, placeholder, selectableOptions.length, selectedValueSet, value.length])

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
      <div>
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

        {open && createPortal(
          <div
            ref={menuRef}
            data-filter-popover="true"
            className={clsx(
              'fixed border border-border rounded-md shadow-xl z-[120] py-1 bg-surface-elevated overflow-y-auto',
              menuClassName
            )}
            style={{
              top: `${menuPosition?.top ?? 0}px`,
              left: `${menuPosition?.left ?? 0}px`,
              minWidth: `${menuPosition?.minWidth ?? MIN_MENU_WIDTH}px`,
              maxWidth: `${menuPosition?.maxWidth ?? MIN_MENU_WIDTH}px`,
              maxHeight: `${menuPosition?.maxHeight ?? 0}px`,
              width: 'max-content',
              visibility: menuPosition ? 'visible' : 'hidden',
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
                <span className="text-sm text-foreground whitespace-nowrap">{option.label}</span>
              </label>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
