import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { User } from '@/types'
import { getAvatarUrl, getAvatarUrlSync } from '@/lib/oss/urlHelper'
import { subscribeUrlUpdate, notifyUrlUpdated } from '@/lib/oss/load/UrlUpdateNotifier'
import { ENABLE_AVATAR_LOGS } from '@/lib/oss/load/logConfig'

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
  const failedUrlsRef = useRef<Set<string>>(new Set()) // 记录加载失败的 URL，避免重复尝试
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 用于延迟处理错误
  const errorRetryCountRef = useRef<Map<string, number>>(new Map()) // 记录每个 objectKey 的错误重试次数

  useEffect(() => {
    // 如果 avatar 没有变化，不重新加载
    if (lastAvatarRef.current === avatar && avatarUrl) {
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] avatar 未变化，跳过重新加载:', avatar)
      }
      return
    }
    
    // 更新 ref
    lastAvatarRef.current = avatar
    
    // 清除之前的重试计数（avatar 变化时重置）
    if (avatar) {
      errorRetryCountRef.current.delete(avatar)
    }
    
    if (ENABLE_AVATAR_LOGS) {
      console.log('[Avatar] 开始加载头像, avatar:', avatar)
    }
    
    if (!avatar) {
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] 没有头像，使用默认首字母')
      }
      setAvatarUrl(null)
      setIsLoading(false)
      failedUrlsRef.current.clear() // 清除失败记录
      return
    }

    // 如果是完整 URL，检查是否之前加载失败过
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      if (failedUrlsRef.current.has(avatar)) {
        // 之前加载失败过，直接使用 placeholder，不触发请求
        if (ENABLE_AVATAR_LOGS) {
          console.log('[Avatar] URL 之前加载失败过，跳过:', avatar)
        }
        setAvatarUrl(null)
        setIsLoading(false)
        return
      }
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] 检测到完整 URL，直接使用:', avatar)
      }
      setAvatarUrl(avatar)
      setIsLoading(false)
      return
    }

    // 如果是 objectKey，先尝试同步获取缓存（避免异步延迟）
    const cachedUrl = getAvatarUrlSync(avatar)
    if (cachedUrl) {
      // 检查缓存的 URL 是否之前加载失败过
      if (failedUrlsRef.current.has(cachedUrl)) {
        if (ENABLE_AVATAR_LOGS) {
          console.log('[Avatar] 缓存的 URL 之前加载失败过，跳过:', cachedUrl.substring(0, 50) + '...')
        }
        setAvatarUrl(null)
        setIsLoading(false)
        return
      }
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] ⚡ 同步获取缓存 URL 成功:', cachedUrl.substring(0, 50) + '...')
      }
      setAvatarUrl(cachedUrl)
      setIsLoading(false)
      return
    }

    // 缓存未命中，异步获取
    if (ENABLE_AVATAR_LOGS) {
      console.log('[Avatar] 缓存未命中，异步获取 URL:', avatar)
    }
    setIsLoading(true)
    getAvatarUrl(avatar)
      .then((url) => {
        if (url && failedUrlsRef.current.has(url)) {
          // 如果获取到的 URL 之前加载失败过，直接使用 placeholder
          if (ENABLE_AVATAR_LOGS) {
            console.log('[Avatar] 获取到的 URL 之前加载失败过，跳过:', url.substring(0, 50) + '...')
          }
          setAvatarUrl(null)
          setIsLoading(false)
          return
        }
        if (ENABLE_AVATAR_LOGS) {
          console.log('[Avatar] 获取头像 URL 成功:', url)
        }
        setAvatarUrl(url)
        setIsLoading(false)
      })
      .catch((error) => {
        if (ENABLE_AVATAR_LOGS) {
          console.error('[Avatar] 获取头像 URL 失败:', error)
          console.error('[Avatar] 错误详情:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            avatar
          })
        }
        setAvatarUrl(null)
        setIsLoading(false)
      })
  }, [avatar])

  // 订阅 URL 更新事件（当 ErrorInterceptor 成功修复图片后，会通知所有使用相同 objectKey 的组件）
  useEffect(() => {
    if (!avatar || avatar.startsWith('http://') || avatar.startsWith('https://')) {
      // 不是 objectKey，不需要订阅
      return
    }

    if (ENABLE_AVATAR_LOGS) {
      console.log('[Avatar] 订阅 URL 更新事件:', avatar)
    }
    
    // 订阅 URL 更新
    const unsubscribe = subscribeUrlUpdate(avatar, (newUrl) => {
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] 📨 收到 URL 更新通知，更新头像:', {
          objectKey: avatar,
          newUrl: newUrl.substring(0, 50) + '...',
        })
      }
      
      // 清除所有失败记录，因为新 URL 已经成功
      failedUrlsRef.current.clear()
      // 清除重试计数
      errorRetryCountRef.current.delete(avatar)
      // 更新头像 URL
      setAvatarUrl(newUrl)
      setIsLoading(false)
    })

    // 清理函数
    return () => {
      if (ENABLE_AVATAR_LOGS) {
        console.log('[Avatar] 取消订阅 URL 更新事件:', avatar)
      }
      unsubscribe()
    }
  }, [avatar])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  // 用户图标 SVG（placeholder）
  const UserIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )

  const avatarElement = (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br from-orange-400 to-orange-500 text-white font-semibold',
        'border border-gray-200 relative overflow-hidden',
        sizeClasses[size],
        className
      )}
      title={showTooltip ? username : undefined}
    >
      {isLoading ? (
        // 加载中显示用户图标
        <UserIcon className="w-1/2 h-1/2 opacity-80" />
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full rounded-full object-cover"
          data-oss-key={avatar || undefined}
          onError={(e) => {
            // 如果图片加载失败，等待 ErrorInterceptor 自动修复
            const target = e.target as HTMLImageElement
            const failedUrl = target.src
            const objectKey = target.getAttribute('data-oss-key')
            
            // 清除之前的延迟处理
            if (errorTimeoutRef.current) {
              clearTimeout(errorTimeoutRef.current)
            }
            
            // 如果图片有 data-oss-key，说明可能是 OSS 图片，等待 ErrorInterceptor 修复
            if (objectKey && failedUrl.includes('aliyuncs.com')) {
              // 检查重试次数
              const retryCount = errorRetryCountRef.current.get(objectKey) || 0
              const MAX_AVATAR_RETRY = 2 // Avatar 组件最多等待 2 次
              
              if (retryCount >= MAX_AVATAR_RETRY) {
                if (ENABLE_AVATAR_LOGS) {
                  console.log('[Avatar] 已达到最大重试次数，使用 placeholder:', {
                    objectKey,
                    retryCount
                  })
                }
                if (failedUrl) {
                  failedUrlsRef.current.add(failedUrl)
                }
                setAvatarUrl(null)
                return
              }
              
              // 增加重试计数
              errorRetryCountRef.current.set(objectKey, retryCount + 1)
              
              if (ENABLE_AVATAR_LOGS) {
                console.log('[Avatar] 图片加载失败，等待 ErrorInterceptor 自动修复:', {
                  objectKey,
                  failedUrl: failedUrl.substring(0, 50) + '...',
                  retryCount: retryCount + 1,
                  maxRetry: MAX_AVATAR_RETRY
                })
              }
              
              // 等待一段时间，让 ErrorInterceptor 有机会修复（缩短等待时间）
              errorTimeoutRef.current = setTimeout(() => {
                // 检查图片 src 是否已被 ErrorInterceptor 更新
                const currentSrc = target.src
                if (currentSrc !== failedUrl && currentSrc.includes('aliyuncs.com')) {
                  if (ENABLE_AVATAR_LOGS) {
                    console.log('[Avatar] ErrorInterceptor 已更新 URL，图片应该会自动重新加载:', {
                      oldUrl: failedUrl.substring(0, 50) + '...',
                      newUrl: currentSrc.substring(0, 50) + '...'
                    })
                  }
                  // URL 已更新，更新 React 状态以匹配新的 URL
                  setAvatarUrl(currentSrc)
                  // 不设置 avatarUrl 为 null，让图片尝试加载新 URL
                  // 如果新 URL 也失败，会在下一次 onError 中处理
                  return
                }
                
                // ErrorInterceptor 没有修复，或者修复后仍然失败
                if (ENABLE_AVATAR_LOGS) {
                  console.log('[Avatar] ErrorInterceptor 未修复或修复失败，使用 placeholder')
                }
                if (failedUrl) {
                  failedUrlsRef.current.add(failedUrl)
                }
                setAvatarUrl(null)
              }, 300) // 缩短等待时间到 300ms，ErrorInterceptor 修复很快
            } else {
              // 不是 OSS 图片，或者没有 objectKey，直接标记为失败
              if (failedUrl) {
                failedUrlsRef.current.add(failedUrl)
              }
              setAvatarUrl(null)
            }
          }}
          onLoad={(e) => {
            // 图片加载成功，清除错误处理延迟和重试计数
            if (errorTimeoutRef.current) {
              clearTimeout(errorTimeoutRef.current)
              errorTimeoutRef.current = null
            }
            
            const img = e.target as HTMLImageElement
            const currentSrc = img.src
            const objectKey = img.getAttribute('data-oss-key')
            
            // 清除该 objectKey 的重试计数
            if (objectKey) {
              errorRetryCountRef.current.delete(objectKey)
            }
            
            // 检查是否是因为收到 URL 更新通知而触发的加载
            // 如果当前 src 与 avatarUrl 不匹配，说明是收到通知后更新的，此时不应该再次通知
            const isFromNotification = currentSrc !== avatarUrl
            
            // 如果当前 src 与 avatarUrl 不匹配，说明 ErrorInterceptor 或其他通知更新了 URL
            // 更新 React 状态以匹配实际的图片 URL
            if (isFromNotification) {
              if (ENABLE_AVATAR_LOGS) {
                console.log('[Avatar] 检测到图片 URL 已更新（可能是 ErrorInterceptor 修复或其他通知）:', {
                  oldUrl: avatarUrl?.substring(0, 50) + '...',
                  newUrl: currentSrc.substring(0, 50) + '...'
                })
              }
              setAvatarUrl(currentSrc)
              // 清除失败记录，因为新 URL 已经成功加载
              failedUrlsRef.current.delete(currentSrc)
            }
            
            // 当图片加载成功且不是因为收到通知而触发的加载时，通知其他使用相同 objectKey 的图片元素更新
            // 这样可以避免连锁通知的问题
            if (objectKey && !isFromNotification) {
              if (ENABLE_AVATAR_LOGS) {
                console.log('[Avatar] 图片加载成功，通知其他使用相同 objectKey 的图片元素:', {
                  objectKey,
                  successUrl: currentSrc.substring(0, 50) + '...'
                })
              }
              // 通知其他使用相同 objectKey 的图片元素更新
              notifyUrlUpdated(objectKey, currentSrc)
            }
            
            if (!ENABLE_AVATAR_LOGS) {
              return // 如果不需要日志，直接返回，不执行性能检查
            }
            
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
                  isFromNotification,
                  timing: {
                    dns: (entry.domainLookupEnd - entry.domainLookupStart).toFixed(2) + 'ms',
                    connect: (entry.connectEnd - entry.connectStart).toFixed(2) + 'ms',
                    response: (entry.responseEnd - entry.requestStart).toFixed(2) + 'ms',
                    load: ((entry as any).loadEventEnd ? ((entry as any).loadEventEnd - entry.fetchStart).toFixed(2) : 'N/A') + 'ms',
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
                  isFromNotification,
                  loadTime: loadTime.toFixed(2) + 'ms',
                  note: '性能数据可能还未准备好，图片可能使用了浏览器缓存',
                  hint: '如果 loadTime < 50ms，很可能使用了浏览器缓存',
                })
              }
            }
            
            // 延迟检查，确保性能数据已准备好
            if (ENABLE_AVATAR_LOGS) {
              requestAnimationFrame(() => {
                setTimeout(() => checkPerformance(), 50)
              })
            }
          }}
        />
      ) : (
        // 没有头像时显示用户图标和首字母的组合
        <>
          <UserIcon className="absolute w-1/2 h-1/2 opacity-60" />
          <span className="relative z-10">{initial}</span>
        </>
      )}
    </div>
  )

  return avatarElement
}

