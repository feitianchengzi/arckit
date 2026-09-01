import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delay?: number
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  className,
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        let top = 0
        let left = 0
        
        // 简单的定位逻辑，后续可以优化
        switch (position) {
          case 'top':
            top = rect.top - 8 // 8px gap
            left = rect.left + rect.width / 2
            break
          case 'bottom':
            top = rect.bottom + 8
            left = rect.left + rect.width / 2
            break
          case 'left':
            top = rect.top + rect.height / 2
            left = rect.left - 8
            break
          case 'right':
            top = rect.top + rect.height / 2
            left = rect.right + 8
            break
        }
        
        setCoords({ top, left })
        setIsVisible(true)
      }
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div 
          className={clsx(
            'fixed z-[9999] px-2 py-1 text-xs rounded shadow-lg pointer-events-none transition-opacity duration-200',
            'bg-white text-gray-900 border border-gray-200',
            'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
            className
          )}
          style={{
            top: coords.top,
            left: coords.left,
            transform: position === 'top' ? 'translate(-50%, -100%)' :
                       position === 'bottom' ? 'translate(-50%, 0)' :
                       position === 'left' ? 'translate(-100%, -50%)' :
                       'translate(0, -50%)'
          }}
        >
          {content}
          {/* Arrow */}
          <div 
            className={clsx(
              'absolute w-2 h-2 rotate-45 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              position === 'top' && 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r',
              position === 'bottom' && 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l',
              position === 'left' && 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r',
              position === 'right' && 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
            )}
          />
        </div>,
        document.body
      )}
    </>
  )
}
