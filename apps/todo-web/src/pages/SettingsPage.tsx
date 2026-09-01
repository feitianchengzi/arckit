/**
 * 设置页面
 * 用户资料和账户操作
 */

import { useEffect, useState } from 'react'
import { ErrorView, LoadingView } from '@/components/ui'
import { AvatarCropUpload } from '@/components/ui/AvatarCropUpload'
import { useFirstTimeSetup, useLogout } from '@/hooks/useAuth'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'
import { showGlobalToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const setUser = useAuthStore((state) => state.setUser)
  const currentUser = useAuthStore((state) => state.user)
  const logoutMutation = useLogout()
  const updateUserMutation = useFirstTimeSetup()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '')
      setAvatar(currentUser.avatar || '')
      return
    }

    setIsLoading(true)
    todoUserApi.getCurrentUser()
      .then((user) => {
        setUser(user)
        setUsername(user.username || '')
        setAvatar(user.avatar || '')
      })
      .catch((err) => {
        console.error('[SettingsPage] 获取用户信息失败:', err)
        setError('无法获取用户信息')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [currentUser?.username, currentUser?.avatar, setUser])

  if (isLoading) {
    return <LoadingView size="lg" text="加载用户信息..." />
  }

  if (error && !currentUser) {
    return (
      <ErrorView
        title="加载失败"
        message={error || '无法获取用户信息，请稍后重试'}
        onRetry={() => window.location.reload()}
      />
    )
  }

  const initialUsername = currentUser?.username || ''
  const trimmedUsername = username.trim()

  const handleSaveName = async () => {
    if (isSavingName) return

    if (!trimmedUsername) {
      setUsername(initialUsername)
      showGlobalToast('名称不能为空，修改失败', 'error', 2500)
      return
    }

    if (trimmedUsername === initialUsername) {
      setUsername(initialUsername)
      return
    }

    setIsSavingName(true)

    try {
      await updateUserMutation.mutateAsync({
        username: trimmedUsername,
        avatar: avatar.trim() || '',
      })

      setUsername(trimmedUsername)
      showGlobalToast('名称已更新', 'success', 2000)
    } catch (err: any) {
      setUsername(initialUsername)
      showGlobalToast(err?.message || '名称更新失败', 'error', 2500)
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-2xl font-semibold text-foreground">用户资料</h1>

      <div
        className="mt-6 overflow-hidden rounded-lg border border-border bg-surface-elevated"
      >
        <div className="grid gap-3 border-b border-divider px-4 py-4 md:grid-cols-[minmax(120px,1fr)_320px] md:items-center md:px-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">头像</h2>
          </div>
          <AvatarCropUpload
            value={avatar}
            onChange={(nextAvatar) => {
              setAvatar(nextAvatar)
              if (currentUser) {
                setUser({ ...currentUser, avatar: nextAvatar })
              }
              showGlobalToast('头像已更新', 'success', 2000)
            }}
            outputSize={200}
            showLabel={false}
            variant="compact"
          />
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(120px,1fr)_320px] md:items-center md:px-5">
          <label htmlFor="profile-username" className="text-sm font-medium text-foreground">
            名称
          </label>
          <div>
            <input
              id="profile-username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
              }}
              onBlur={handleSaveName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                }
              }}
              className="h-9 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-foreground-tertiary focus:ring-1 focus:ring-foreground-tertiary/15 disabled:cursor-not-allowed disabled:bg-surface-disabled"
              placeholder="请输入名称"
              disabled={isSavingName}
              maxLength={20}
              required
            />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">账户访问</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-elevated">
          <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <div>
              <p className="text-sm font-medium text-foreground">退出当前账户</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('确定要退出登录吗？')) {
                  logoutMutation.mutate()
                }
              }}
              disabled={logoutMutation.isPending}
              className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-error transition-colors hover:bg-error-light focus:outline-none focus:ring-1 focus:ring-error/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              退出登录
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
