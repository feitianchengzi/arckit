import React, { useState, useEffect } from 'react'
import { OssResourceManager } from '@/lib/oss/OssResourceManager'
import { subscribeUrlUpdate } from '@/lib/oss/load/UrlUpdateNotifier'
import { normalizeObjectKey } from '@/lib/oss/sdk'
import {
  describeImageElement,
  describeSignedUrl,
  errorOssImageDiag,
  logOssImageDiag,
} from '@/lib/oss/load/diagnostics'

const IMAGE_URL_RETRY_DELAYS = [0, 800, 2000]

export interface ImageItem {
  key: string
}

export interface ImageGalleryProps {
  images: ImageItem[]
  onImageClick: (key: string) => void
}

function GalleryImage({
  image,
  index,
  onImageClick,
}: {
  image: ImageItem
  index: number
  onImageClick: (key: string) => void
}) {
  const objectKey = normalizeObjectKey(image.key)
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    let retryTimer: number | undefined
    setUrl('')

    logOssImageDiag('gallery.mount', {
      objectKey,
      rawKey: image.key,
      index,
    })

    const unsubscribe = subscribeUrlUpdate(objectKey, (newUrl) => {
      logOssImageDiag('gallery.urlUpdate.received', {
        objectKey,
        active,
        url: describeSignedUrl(newUrl),
      })
      if (active) setUrl(newUrl)
    })

    const resolveUrl = (attempt = 0) => {
      logOssImageDiag('gallery.resolve.start', {
        objectKey,
        attempt,
      })

      OssResourceManager.resolve(objectKey).then(u => {
        logOssImageDiag('gallery.resolve.success', {
          objectKey,
          attempt,
          active,
          url: describeSignedUrl(u),
        })
        if (active && u) setUrl(u)
      }).catch(error => {
        if (!active) return

        const nextAttempt = attempt + 1
        if (nextAttempt < IMAGE_URL_RETRY_DELAYS.length) {
          logOssImageDiag('gallery.resolve.retryScheduled', {
            objectKey,
            attempt,
            nextAttempt,
            delayMs: IMAGE_URL_RETRY_DELAYS[nextAttempt],
            error: error instanceof Error ? error.message : String(error),
          })
          retryTimer = window.setTimeout(
            () => resolveUrl(nextAttempt),
            IMAGE_URL_RETRY_DELAYS[nextAttempt]
          )
          return
        }

        console.error('[ImageGallery] 图片 URL 解析失败:', {
          objectKey,
          error: error instanceof Error ? error.message : String(error),
        })
        errorOssImageDiag('gallery.resolve.failed', {
          objectKey,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }

    resolveUrl()

    return () => {
      active = false
      if (retryTimer) window.clearTimeout(retryTimer)
      unsubscribe()
      logOssImageDiag('gallery.unmount', {
        objectKey,
      })
    }
  }, [image.key, index, objectKey])

  if (!url) {
    return (
      <div className="w-32 h-32 bg-surface-active animate-pulse rounded-md flex-shrink-0" />
    )
  }

  return (
    <div
      className="w-32 h-32 bg-surface-active rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-border"
      onClick={() => onImageClick(objectKey)}
    >
      <img
        src={url}
        alt={`图片 ${index + 1}`}
        data-oss-key={objectKey}
        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
        onLoad={(event) => {
          logOssImageDiag('gallery.img.load', {
            objectKey,
            image: describeImageElement(event.currentTarget),
          })
        }}
        onError={(event) => {
          errorOssImageDiag('gallery.img.error', {
            objectKey,
            image: describeImageElement(event.currentTarget),
          })
        }}
      />
    </div>
  )
}

export function ImageGallery({ images, onImageClick }: ImageGalleryProps) {
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const galleryRef = React.useRef<HTMLDivElement>(null)

  // 处理滚动事件
  useEffect(() => {
    const handleScroll = () => {
      if (!galleryRef.current) return
      
      const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current
      
      // 计算是否显示左右按钮
      setShowLeftButton(scrollLeft > 10) // 留一点缓冲
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10) // 留一点缓冲
    }

    const galleryElement = galleryRef.current
    if (galleryElement) {
      galleryElement.addEventListener('scroll', handleScroll)
      // 初始计算
      handleScroll()
    }

    return () => {
      if (galleryElement) {
        galleryElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [images.length])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!galleryRef.current) return
    const scrollAmount = direction === 'left' ? -200 : 200
    const newScrollLeft = galleryRef.current.scrollLeft + scrollAmount
    galleryRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative my-2">
      {/* 左右箭头 */}
      {images.length > 1 && (
        <>
          {showLeftButton && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              aria-label="上一张"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {showRightButton && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              aria-label="下一张"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}
      
      {/* 图片画廊 */}
      <div 
        ref={galleryRef}
        className="overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-2 min-w-max">
          {images.map((img, index) => (
            <GalleryImage
              key={normalizeObjectKey(img.key) || index}
              image={img}
              index={index}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
