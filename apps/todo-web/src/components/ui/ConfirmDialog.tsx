'use client'

/**
 * ConfirmDialog - 确认对话框组件
 */

import { Fragment } from 'react'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onCancel}
      />
      
      {/* 对话框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-surface-elevated rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          
          {/* 内容 */}
          <p className="text-sm text-foreground-secondary">{message}</p>
          
          {/* 按钮组 */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            
            <Button
              variant={variant}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}



