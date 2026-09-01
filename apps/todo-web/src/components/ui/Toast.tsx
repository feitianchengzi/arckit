/**
 * Toast 组件 - 全局提示消息
 * 
 * 功能：
 * 1. 全局轻量提示
 * 2. 固定在窗口右下角显示
 * 3. 支持深色/浅色模式
 * 4. 自动消失
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  duration?: number
  type?: 'success' | 'info' | 'warning' | 'error'
}

export function Toast({ message, visible, onClose, duration = 2000, type = 'success' }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsExiting(false)
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 300) // 等待动画完成
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose, message, type])

  if (!visible) return null

  const iconStyles: Record<NonNullable<ToastProps['type']>, string> = {
    success: 'bg-green-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-500 text-white',
  }

  const icons = {
    success: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8h.01M12 12v5" />
      </svg>
    ),
    warning: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 7v7m0 3h.01" />
      </svg>
    ),
    error: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18 18 6M6 6l12 12" />
      </svg>
    ),
  }

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 sm:bottom-5 sm:right-5 ${
        isExiting ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className="flex min-h-10 w-fit max-w-[calc(100vw-32px)] items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.14)] sm:max-w-sm"
      >
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${iconStyles[type]}`}>
          {icons[type]}
        </div>
        <span className="min-w-0 truncate text-sm font-medium text-foreground">{message}</span>
        <button
          type="button"
          onClick={() => {
            setIsExiting(true)
            setTimeout(onClose, 180)
          }}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-foreground-tertiary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          aria-label="关闭提示"
          title="关闭提示"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

// 使用 hook 来管理 toast
import { useCallback } from 'react'

let toastHandler: ((message: string, type?: ToastProps['type'], duration?: number) => void) | null = null

export function useToast() {
  const [toastState, setToastState] = useState<{
    visible: boolean
    message: string
    type: ToastProps['type']
    duration: number
  }>({
    visible: false,
    message: '',
    type: 'success',
    duration: 2000,
  })

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'success', duration = 2000) => {
    setToastState({ visible: true, message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }))
  }, [])

  const toastComponent = (
    <Toast
      message={toastState.message}
      visible={toastState.visible}
      onClose={hideToast}
      type={toastState.type}
      duration={toastState.duration}
    />
  )

  return { showToast, hideToast, toastComponent }
}

// 全局 toast 方法（用于非 React 组件中调用）
export function showGlobalToast(message: string, type: ToastProps['type'] = 'success', duration = 2000) {
  if (toastHandler) {
    toastHandler(message, type, duration)
  } else {
    console.warn('Toast handler not initialized')
  }
}

export function setToastHandler(handler: typeof toastHandler) {
  toastHandler = handler
}
