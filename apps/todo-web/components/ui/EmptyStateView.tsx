'use client'

import { Button } from './Button'

export interface EmptyStateViewProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * EmptyStateView 组件 - 空状态
 */
export function EmptyStateView({
  title = '暂无数据',
  message,
  actionLabel,
  onAction,
}: EmptyStateViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12">
      {/* 空状态图标 */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      
      {/* 空状态信息 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
      
      {/* 操作按钮 */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

