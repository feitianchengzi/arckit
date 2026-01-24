/**
 * Drawer - 右侧抽屉组件
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  width?: string
  showBackButton?: boolean // 是否显示回退按钮
  onBack?: () => void // 回退按钮的回调
}

export function Drawer({ open, onClose, children, title, width = 'w-full md:w-[600px]', showBackButton = false, onBack }: DrawerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // ESC 键关闭抽屉和动画控制
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    
    if (open) {
      // 打开时：先显示元素，然后触发动画
      setIsVisible(true)
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      
      // 使用 requestAnimationFrame 确保 DOM 更新后再触发动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      // 关闭时：先触发关闭动画，等待动画完成后再隐藏元素
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = ''
      }, 300) // 与 transition 时间一致 (300ms)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('keydown', handleEsc)
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!isVisible) return null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩层 - 渐隐渐显动画，黑色浅一些 */}
      <div
        className={clsx(
          'absolute inset-0 bg-black transition-opacity duration-300 ease-in-out',
          isAnimating ? 'opacity-30' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* 抽屉内容 - 从右侧滑入滑出 */}
      <div
        className={clsx(
          'absolute right-0 top-0 bottom-0',
          'shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          width,
          'flex flex-col',
          'overflow-hidden',
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ backgroundColor: 'var(--color-surface-elevated)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - 回退按钮（左上角）、标题（中间）、关闭按钮（右上角） */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ 
            borderBottomColor: 'var(--color-divider)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          {/* 左侧：回退按钮或占位 */}
          <div className="flex-shrink-0 w-10">
            {showBackButton && onBack ? (
              <button
                onClick={onBack}
                className="p-2 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                aria-label="返回"
                title="返回"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            ) : null}
          </div>
          
          {/* 中间：标题 */}
          <div className="flex-1 text-center">
            {title ? (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            ) : (
              <h2 className="text-lg font-semibold text-foreground">待办详情</h2>
            )}
          </div>
          
          {/* 右侧：关闭按钮 */}
          <div className="flex-shrink-0 w-10 flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
              aria-label="关闭"
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

