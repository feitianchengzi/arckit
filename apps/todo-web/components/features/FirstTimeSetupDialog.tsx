/**
 * 首次登录设置对话框
 */

'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { isValidUsername } from '@/lib/utils/validators'

export interface FirstTimeSetupDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (data: { username: string; avatar?: string }) => Promise<void>
  defaultEmail?: string
}

export function FirstTimeSetupDialog({
  open,
  onClose,
  onComplete,
  defaultEmail,
}: FirstTimeSetupDialogProps) {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string>()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 验证并提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证用户名
    if (!isValidUsername(username)) {
      setError('用户名长度为2-20个字符，支持中英文、数字、下划线')
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete({ username, avatar })
      // 成功后关闭对话框
      onClose()
    } catch (err: any) {
      setError(err.message || '设置失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 跳过设置
  const handleSkip = async () => {
    // 使用邮箱前缀作为默认用户名
    const defaultUsername = defaultEmail?.split('@')[0] || `user${Date.now()}`
    
    setIsSubmitting(true)
    try {
      await onComplete({ username: defaultUsername })
      onClose()
    } catch (err) {
      setError('操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="欢迎使用待办管理系统！🎉"
      description="完善你的个人信息"
      maxWidth="md"
      showCloseButton={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 用户名输入 */}
        <div>
          <TextField
            id="username"
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名（2-20字符）"
            required
            fullWidth
            helperText={`${username.length}/20`}
            maxLength={20}
          />
        </div>

        {/* 头像上传 */}
        <div>
          <AvatarUpload
            value={avatar}
            onChange={setAvatar}
            maxSize={200}
            recommendedSize="50x50"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1"
          >
            跳过
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!username || isSubmitting}
            className="flex-1"
          >
            完成设置
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          跳过后可在设置页面修改
        </p>
      </form>
    </Dialog>
  )
}

