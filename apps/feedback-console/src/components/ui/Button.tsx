'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

/**
 * Button 组件
 * 
 * 变体：
 * - primary: 主要按钮（蓝色背景）
 * - secondary: 次要按钮（灰色背景）
 * - danger: 危险按钮（红色背景）
 * - ghost: 幽灵按钮（透明背景）
 * 
 * 尺寸：
 * - sm: 小号
 * - md: 中号（默认）
 * - lg: 大号
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          // 基础样式
          'inline-flex items-center justify-center',
          'font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          // 变体样式
          {
            'bg-primary text-white hover:bg-primary-700 focus:ring-primary': variant === 'primary',
            'bg-surface-active text-foreground hover:bg-surface-hover focus:ring-gray-500': variant === 'secondary',
            'bg-error text-white hover:bg-red-600 focus:ring-error': variant === 'danger',
            'bg-transparent text-primary hover:bg-primary-light focus:ring-primary': variant === 'ghost',
          },
          
          // 尺寸样式
          {
            'px-3 py-1.5 text-sm rounded-md': size === 'sm',
            'px-4 py-2 text-base rounded-md': size === 'md',
            'px-6 py-3 text-lg rounded-lg': size === 'lg',
          },
          
          // 宽度
          {
            'w-full': fullWidth,
          },
          
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'



