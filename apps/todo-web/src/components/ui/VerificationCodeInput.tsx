/**
 * 验证码输入组件
 * 包含输入框和发送验证码按钮（带倒计时）
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'

export interface VerificationCodeInputProps {
  /** 验证码值 */
  value: string
  /** 值改变回调 */
  onChange: (value: string) => void
  /** 发送验证码回调 */
  onSendCode: () => Promise<void>
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string
  /** 发送按钮是否禁用（例如：用户名未填写时） */
  sendButtonDisabled?: boolean
}

const COUNTDOWN_SECONDS = 60

export function VerificationCodeInput({
  value,
  onChange,
  onSendCode,
  disabled,
  error,
  sendButtonDisabled,
}: VerificationCodeInputProps) {
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendCode = async () => {
    if (countdown > 0 || isSending || sendButtonDisabled) return

    setIsSending(true)
    try {
      await onSendCode()
      // 成功后开始倒计时
      setCountdown(COUNTDOWN_SECONDS)
    } catch (error) {
      // 错误由父组件处理
      console.error('发送验证码失败:', error)
    } finally {
      setIsSending(false)
    }
  }

  // 按钮文字
  const getButtonText = () => {
    if (isSending) return '发送中...'
    if (countdown > 0) return `${countdown}秒后重新发送`
    return '发送验证码'
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        验证码
      </label>
      
      <div className="flex gap-2">
        {/* 验证码输入框 */}
        <div className="flex-1">
          <input
            type="text"
            maxLength={6}
            value={value}
            onChange={(e) => {
              // 只允许数字
              const numericValue = e.target.value.replace(/\D/g, '')
              onChange(numericValue)
            }}
            placeholder="请输入6位验证码"
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleSendCode}
          disabled={countdown > 0 || isSending || sendButtonDisabled}
          loading={isSending}
          className="whitespace-nowrap"
        >
          {getButtonText()}
        </Button>
      </div>

      {/* 辅助文字或错误提示 */}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : countdown > 0 ? (
        <p className="text-sm text-gray-500">{countdown}秒后可重新发送</p>
      ) : (
        <p className="text-sm text-gray-500">请输入收到的6位验证码</p>
      )}
    </div>
  )
}

