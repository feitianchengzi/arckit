'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * TextField 组件 - 文本输入框
 * 
 * 状态：
 * - 默认
 * - focus
 * - error
 * - disabled
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col gap-1', { 'w-full': fullWidth })}>
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={clsx(
            // 基础样式
            'px-3 py-2 text-base',
            'border rounded-md',
            'transition-colors',
            'bg-surface-elevated text-foreground',
            'placeholder:text-foreground-tertiary',
            
            // 状态样式
            {
              'border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50': !error,
              'border-error focus:border-error focus:ring-2 focus:ring-error focus:ring-opacity-50': error,
              'bg-surface-disabled cursor-not-allowed': props.disabled,
            },
            
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        
        {(error || helperText) && (
          <p
            id={error ? `${props.id}-error` : undefined}
            className={clsx('text-sm', {
              'text-error': error,
              'text-foreground-secondary': !error,
            })}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

TextField.displayName = 'TextField'



