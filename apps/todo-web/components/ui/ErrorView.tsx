'use client'

import { Button } from './Button'

export interface ErrorViewProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/**
 * ErrorView 组件 - 错误提示
 */
export function ErrorView({
  title = '出错了',
  message = '请稍后重试',
  onRetry,
}: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* 错误图标 */}
      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center">
        <svg
          className="w-8 h-8 text-error"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      {/* 错误信息 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      
      {/* 重试按钮 */}
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          重试
        </Button>
      )}
    </div>
  )
}

