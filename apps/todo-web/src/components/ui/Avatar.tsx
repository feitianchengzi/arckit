import { useState, useEffect } from 'react'
import clsx from 'clsx'
import type { User } from '@/types'
import { getAvatarUrl } from '@/lib/oss/urlHelper'

export interface AvatarProps {
  user?: User | { username?: string; avatar?: string } | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

const sizeClasses = {
  xs: 'w-4 h-4 text-xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function Avatar({ user, size = 'sm', className, showTooltip = false }: AvatarProps) {
  const username = user?.username || '未知'
  const avatar = user?.avatar
  const initial = username.charAt(0).toUpperCase()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('[Avatar] 开始加载头像, avatar:', avatar)
    
    if (!avatar) {
      console.log('[Avatar] 没有头像，使用默认首字母')
      setAvatarUrl(null)
      setIsLoading(false)
      return
    }

    // 如果是完整 URL，直接使用
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      console.log('[Avatar] 检测到完整 URL，直接使用:', avatar)
      setAvatarUrl(avatar)
      setIsLoading(false)
      return
    }

    // 如果是 objectKey，需要转换为签名 URL
    console.log('[Avatar] 检测到 objectKey，开始转换:', avatar)
    setIsLoading(true)
    getAvatarUrl(avatar)
      .then((url) => {
        console.log('[Avatar] 获取头像 URL 成功:', url)
        setAvatarUrl(url)
      })
      .catch((error) => {
        console.error('[Avatar] 获取头像 URL 失败:', error)
        console.error('[Avatar] 错误详情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          avatar
        })
        setAvatarUrl(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [avatar])

  const avatarElement = (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br from-orange-400 to-orange-500 text-white font-semibold',
        'border border-gray-200',
        sizeClasses[size],
        className
      )}
      title={showTooltip ? username : undefined}
    >
      {isLoading ? (
        // 加载中显示首字母
        initial
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示首字母
            const target = e.target as HTMLImageElement
            console.error('[Avatar] 图片加载失败:', {
              src: target.src,
              avatar,
              avatarUrl,
              error: e
            })
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.textContent = initial
            }
          }}
          onLoad={() => {
            console.log('[Avatar] 图片加载成功:', avatarUrl)
          }}
        />
      ) : (
        initial
      )}
    </div>
  )

  return avatarElement
}

