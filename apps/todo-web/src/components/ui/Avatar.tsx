import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { User } from '@/types'
import { getAvatarUrl, getAvatarUrlSync } from '@/lib/oss/urlHelper'

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
  const lastAvatarRef = useRef<string | undefined>(avatar)

  useEffect(() => {
    // 如果 avatar 没有变化，不重新加载
    if (lastAvatarRef.current === avatar && avatarUrl) {
      console.log('[Avatar] avatar 未变化，跳过重新加载:', avatar)
      return
    }
    
    // 更新 ref
    lastAvatarRef.current = avatar
    
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

    // 如果是 objectKey，先尝试同步获取缓存（避免异步延迟）
    const cachedUrl = getAvatarUrlSync(avatar)
    if (cachedUrl) {
      console.log('[Avatar] ⚡ 同步获取缓存 URL 成功:', cachedUrl.substring(0, 50) + '...')
      setAvatarUrl(cachedUrl)
      setIsLoading(false)
      return
    }

    // 缓存未命中，异步获取
    console.log('[Avatar] 缓存未命中，异步获取 URL:', avatar)
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
          data-oss-key={avatar || undefined}
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
          onLoad={(e) => {
            const img = e.target as HTMLImageElement
            const startTime = performance.now()
            
            // 使用重试机制获取性能数据
            const checkPerformance = (retryCount = 0): void => {
              const perfEntries = performance.getEntriesByName(img.src, 'resource') as PerformanceResourceTiming[]
              
              if (perfEntries.length > 0) {
                const entry = perfEntries[0]
                const transferSize = entry.transferSize || 0
                const decodedBodySize = entry.decodedBodySize || 0
                const encodedBodySize = entry.encodedBodySize || 0
                
                // 更准确的缓存状态判断
                let cacheStatus = 'network'
                if (transferSize === 0 && decodedBodySize > 0) {
                  cacheStatus = 'disk-cache' // 从磁盘缓存加载
                } else if (transferSize > 0 && transferSize < decodedBodySize) {
                  cacheStatus = 'memory-cache' // 从内存缓存加载
                } else if (transferSize === decodedBodySize && decodedBodySize > 0) {
                  cacheStatus = 'network' // 从网络加载
                } else if (transferSize === 0 && decodedBodySize === 0) {
                  // 可能是性能数据还没准备好，或者使用了 Service Worker 缓存
                  cacheStatus = 'unknown-cache'
                }
                
                // 计算加载时间
                const loadTime = performance.now() - startTime
                
                console.log('[Avatar] 图片加载成功:', {
                  url: avatarUrl?.substring(0, 50) + '...',
                  cacheStatus,
                  transferSize,
                  encodedBodySize,
                  decodedBodySize,
                  duration: entry.duration.toFixed(2) + 'ms',
                  loadTime: loadTime.toFixed(2) + 'ms',
                  objectKey: avatar,
                  timing: {
                    dns: (entry.domainLookupEnd - entry.domainLookupStart).toFixed(2) + 'ms',
                    connect: (entry.connectEnd - entry.connectStart).toFixed(2) + 'ms',
                    response: (entry.responseEnd - entry.requestStart).toFixed(2) + 'ms',
                    load: (entry.loadEventEnd - entry.fetchStart).toFixed(2) + 'ms',
                  },
                  retryCount,
                })
              } else if (retryCount < 3) {
                // 如果性能数据未就绪，重试（最多3次）
                setTimeout(() => checkPerformance(retryCount + 1), 50 * (retryCount + 1))
              } else {
                // 重试3次后仍无数据，使用备用方法
                const loadTime = performance.now() - startTime
                console.log('[Avatar] 图片加载成功（性能数据未就绪，已重试3次）:', {
                  url: avatarUrl?.substring(0, 50) + '...',
                  objectKey: avatar,
                  loadTime: loadTime.toFixed(2) + 'ms',
                  note: '性能数据可能还未准备好，图片可能使用了浏览器缓存',
                  hint: '如果 loadTime < 50ms，很可能使用了浏览器缓存',
                })
              }
            }
            
            // 延迟检查，确保性能数据已准备好
            requestAnimationFrame(() => {
              setTimeout(() => checkPerformance(), 50)
            })
          }}
        />
      ) : (
        initial
      )}
    </div>
  )

  return avatarElement
}

