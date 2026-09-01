import React, { useState, useEffect } from 'react'
import { OssResourceManager } from '@/lib/oss/OssResourceManager'

export interface ImageItem {
  key: string
}

export interface ImageGalleryProps {
  images: ImageItem[]
  onImageClick: (key: string) => void
  resolveImage?: (key: string) => Promise<string>
}

function GalleryImage({
  image,
  index,
  onImageClick,
  resolveImage,
}: {
  image: ImageItem
  index: number
  onImageClick: (key: string) => void
  resolveImage: (key: string) => Promise<string>
}) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    resolveImage(image.key).then((resolvedUrl) => {
      if (active && resolvedUrl) setUrl(resolvedUrl)
    }).catch(() => {
      if (active) setUrl('')
    })
    return () => { active = false }
  }, [image.key, resolveImage])

  if (!url) {
    return <div className="w-32 h-32 bg-surface-active animate-pulse rounded-md flex-shrink-0" />
  }

  return (
    <div
      className="w-32 h-32 bg-surface-active rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-border"
      onClick={() => onImageClick(image.key)}
    >
      <img
        src={url}
        alt={`图片 ${index + 1}`}
        data-oss-key={image.key}
        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
      />
    </div>
  )
}

export function ImageGallery({ images, onImageClick, resolveImage = OssResourceManager.resolve }: ImageGalleryProps) {
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
          {images.map((image, index) => (
            <GalleryImage
              key={image.key}
              image={image}
              index={index}
              onImageClick={onImageClick}
              resolveImage={resolveImage}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
