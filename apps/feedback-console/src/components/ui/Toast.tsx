/**
 * Toast 组件 - 全局提示消息
 * 
 * 功能：
 * 1. 类似 Android Toast 的效果
 * 2. 固定在窗口顶部居中显示
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

  const typeStyles = {
    success: 'bg-surface-elevated dark:bg-surface-elevated border-l-4 border-l-green-500',
    info: 'bg-surface-elevated dark:bg-surface-elevated border-l-4 border-l-blue-500',
    warning: 'bg-surface-elevated dark:bg-surface-elevated border-l-4 border-l-yellow-500',
    error: 'bg-surface-elevated dark:bg-surface-elevated border-l-4 border-l-red-500',
  }

  const iconStyles = {
    success: 'text-green-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  }

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  }

  return createPortal(
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isExiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border border-border min-w-[280px] max-w-[90vw] ${typeStyles[type]}`}
      >
        <div className={iconStyles[type]}>{icons[type]}</div>
        <span className="text-foreground font-medium text-sm">{message}</span>
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
