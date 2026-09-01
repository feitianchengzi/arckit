import { HTMLAttributes } from 'react'
import clsx from 'clsx'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl bg-surface-elevated p-4 shadow-sm', className)}
      {...props}
    />
  )
}
