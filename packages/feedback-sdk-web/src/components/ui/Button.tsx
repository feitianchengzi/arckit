import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', fullWidth = false, loading = false, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variant === 'primary' && 'bg-primary text-white hover:bg-primary-hover',
          variant === 'secondary' && 'border border-border bg-surface-active text-foreground hover:bg-surface-hover',
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? '处理中...' : children}
      </button>
    )
  },
)

Button.displayName = 'Button'
