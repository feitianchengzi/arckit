import clsx from 'clsx'
import type { User } from '@/types'

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
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示首字母
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.textContent = initial
            }
          }}
        />
      ) : (
        initial
      )}
    </div>
  )

  return avatarElement
}

