'use client'

/**
 * StatusSelect - 状态选择器组件
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { TodoStatus } from '@/types'
import { getStatusLabel, getStatusColor, getStatusBgColor } from '@/lib/constants/taskStatus'

export interface StatusSelectProps {
  value: TodoStatus
  onChange: (status: TodoStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const ALL_STATUSES: TodoStatus[] = ['PENDING_REVIEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED', 'CANCELLED', 'BLOCKED']
const MENU_GAP = 4
const VIEWPORT_PADDING = 8
const MIN_MENU_WIDTH = 120
const MAX_MENU_WIDTH = 148
const MENU_TEXT_COLOR_MAP: Record<TodoStatus, string> = {
  'PENDING_REVIEW': 'text-amber-700 dark:text-amber-300',
  'PENDING': 'text-gray-700 dark:text-gray-200',
  'IN_PROGRESS': 'text-blue-700 dark:text-blue-300',
  'COMPLETED': 'text-green-700 dark:text-green-300',
  'ACCEPTED': 'text-emerald-500 dark:text-emerald-300',
  'CANCELLED': 'text-red-700 dark:text-red-300',
  'BLOCKED': 'text-orange-700 dark:text-orange-300',
}

interface MenuPosition {
  top: number
  left: number
  maxHeight: number
}

export function StatusSelect({ value, onChange, disabled = false, size = 'md' }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const currentConfig = {
    label: getStatusLabel(value),
    color: getStatusColor(value),
    bgColor: getStatusBgColor(value),
  }

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const menuElement = menuRef.current
    const measuredWidth = menuElement.getBoundingClientRect().width
    const menuWidth = Math.min(
      Math.max(measuredWidth, MIN_MENU_WIDTH),
      MAX_MENU_WIDTH
    )
    const naturalMenuHeight = menuElement.scrollHeight
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const spaceBelow = Math.max(
      viewportHeight - buttonRect.bottom - MENU_GAP - VIEWPORT_PADDING,
      0
    )
    const spaceAbove = Math.max(
      buttonRect.top - MENU_GAP - VIEWPORT_PADDING,
      0
    )

    const shouldOpenBelow =
      spaceBelow >= naturalMenuHeight || spaceBelow >= spaceAbove
    const availableHeight = shouldOpenBelow ? spaceBelow : spaceAbove
    const renderedHeight = Math.min(naturalMenuHeight, availableHeight)

    let top = shouldOpenBelow
      ? buttonRect.bottom + MENU_GAP
      : buttonRect.top - MENU_GAP - renderedHeight

    if (shouldOpenBelow) {
      top = Math.min(top, viewportHeight - VIEWPORT_PADDING - renderedHeight)
    } else {
      top = Math.max(top, VIEWPORT_PADDING)
    }

    let left = buttonRect.right - menuWidth
    const maxLeft = viewportWidth - VIEWPORT_PADDING - menuWidth
    left = Math.min(left, maxLeft)
    left = Math.max(left, VIEWPORT_PADDING)

    setMenuPosition({
      top,
      left,
      maxHeight: availableHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null)
      return
    }

    updateMenuPosition()
  }, [isOpen, updateMenuPosition])

  useEffect(() => {
    if (!isOpen) return

    const handleViewportChange = () => {
      updateMenuPosition()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updateMenuPosition])
  
  return (
    <div className="relative">
      {/* 选择按钮 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
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
      {isOpen && createPortal(
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 选项列表 */}
          <div 
            ref={menuRef}
            role="menu"
            className="fixed z-[101] min-w-[120px] overflow-auto rounded-md border border-border bg-surface-elevated shadow-lg dark:bg-surface-hover"
            style={{
              top: `${menuPosition?.top ?? 0}px`,
              left: `${menuPosition?.left ?? 0}px`,
              maxHeight: `${menuPosition?.maxHeight ?? 0}px`,
              width: 'max-content',
              minWidth: `${MIN_MENU_WIDTH}px`,
              maxWidth: `${MAX_MENU_WIDTH}px`,
            }}
          >
            {ALL_STATUSES.map((status) => {
              return (
                <button
                  key={status}
                  type="button"
                  role="menuitemradio"
                  aria-checked={status === value}
                  onClick={() => {
                    onChange(status)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full whitespace-nowrap px-4 py-2 text-left',
                    'transition-colors hover:bg-surface-hover dark:hover:bg-surface-active',
                    {
                      'bg-surface-hover dark:bg-surface-active': status === value,
                    }
                  )}
                >
                  <span
                    className={clsx(
                      'text-sm font-medium drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]',
                      MENU_TEXT_COLOR_MAP[status] || getStatusColor(status)
                    )}
                  >
                    {getStatusLabel(status)}
                  </span>
                </button>
              )
            })}
          </div>
        </>,
        document.body
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
