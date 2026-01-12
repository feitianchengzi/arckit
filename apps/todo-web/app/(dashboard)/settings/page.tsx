'use client'

/**
 * 设置页面
 * 用户设置和偏好
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextField, LoadingView, ErrorView } from '@/components/ui'
import { AvatarCropUpload } from '@/components/ui/AvatarCropUpload'
import { useAuthStore } from '@/store/authStore'
import { useLogout, useFirstTimeSetup } from '@/hooks/useAuth'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { getAuthInfo } from '@/lib/utils/tokenManager'

export default function SettingsPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const currentUser = useAuthStore((state) => state.user)
  const logoutMutation = useLogout()
  const updateUserMutation = useFirstTimeSetup()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // 初始化表单数据
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '')
      setAvatar(currentUser.avatar || '')
    } else {
      // 如果 store 中没有用户信息，尝试从 localStorage 获取或查询
      setIsLoading(true)
      const authInfo = getAuthInfo()
      if (authInfo?.userId) {
        // 尝试获取当前用户信息
        todoUserApi.getCurrentUser()
          .then((user) => {
            setUser(user)
            setUsername(user.username || '')
            setAvatar(user.avatar || '')
          })
          .catch((err) => {
            console.error('获取用户信息失败:', err)
            setError('无法获取用户信息')
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
        setError('未登录，请先登录')
      }
    }
  }, [currentUser, setUser])
  
  // 加载状态
  if (isLoading) {
    return <LoadingView size="lg" text="加载用户信息..." />
  }
  
  // 错误状态
  if (error && !currentUser) {
    return (
      <ErrorView
        title="加载失败"
        message={error || '无法获取用户信息，请稍后重试'}
        onRetry={() => window.location.reload()}
      />
    )
  }
  
  // 处理保存
  const handleSave = async () => {
    if (!username.trim()) {
      setSaveError('用户名不能为空')
      return
    }
    
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    
    try {
      // 调用更新用户信息接口
      await updateUserMutation.mutateAsync({
        username: username.trim(),
        avatar: avatar.trim() || '',
      })
      
      setSaveSuccess(true)
      setIsEditing(false)
      
      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err?.message || '保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 处理取消
  const handleCancel = () => {
    if (currentUser) {
      setUsername(currentUser.username || '')
      setAvatar(currentUser.avatar || '')
    }
    setIsEditing(false)
    setSaveError('')
    setSaveSuccess(false)
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">设置</h1>
        <p className="mt-2 text-gray-600">管理您的账户设置和偏好</p>
      </div>
      
      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">账户信息</h2>
          {!isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              编辑
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            {/* 用户名 */}
            <TextField
              id="username"
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              disabled={isSaving}
            />
            
            {/* 头像上传 */}
            <AvatarCropUpload
              value={avatar}
              onChange={setAvatar}
              outputSize={200}
              label="头像"
              showLabel={true}
            />
            
            {/* 成功提示 */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">保存成功！</p>
              </div>
            )}
            
            {/* 错误提示 */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{saveError}</p>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 显示当前用户信息 */}
            <div className="flex items-center gap-4">
              {/* 头像 */}
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="用户头像"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold">
                  {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
              {/* 用户信息 */}
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">
                  {currentUser?.username || '未知用户'}
                </p>
                <p className="text-sm text-gray-500">
                  用户 ID: {currentUser?.id || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* 详细信息 */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">用户名</p>
                <p className="mt-1 text-sm text-gray-900">{currentUser?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">注册时间</p>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser?.created_at
                    ? new Date(currentUser.created_at).toLocaleDateString('zh-CN')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 退出登录 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">账户操作</h2>
          <p className="mt-1 text-sm text-gray-500">
            退出登录后需要重新登录才能使用
          </p>
        </div>
        
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('确定要退出登录吗？')) {
              logoutMutation.mutate()
            }
          }}
          disabled={logoutMutation.isPending}
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}
