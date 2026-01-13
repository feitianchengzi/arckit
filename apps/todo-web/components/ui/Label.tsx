'use client'

import { LabelHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Label 组件 - 标签
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      required = false,
      size = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <label
        ref={ref}
        className={clsx(
          'font-medium text-gray-700',
          {
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'



