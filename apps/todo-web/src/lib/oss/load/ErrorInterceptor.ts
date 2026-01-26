/**
 * 全局错误拦截器
 * 监听图片加载失败（403 错误），自动修复
 * 
 * 设计文档：frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md
 */

import { getOssResourceLoader } from './index'
import { notifyUrlUpdated } from './UrlUpdateNotifier'

// 记录每个图片元素已经修复的次数，避免无限循环
const fixedImages = new WeakMap<HTMLImageElement, number>()
const MAX_RETRY_COUNT = 2 // 每个图片最多修复 2 次

// 全局 URL 缓存：存储每个 objectKey 的最新可用 URL
const urlCache = new Map<string, string>()

/**
 * 事件名称：OSS 图片 URL 更新
 */
const OSS_IMAGE_URL_UPDATED_EVENT = 'oss-image-url-updated'

/**
 * 触发全局事件，通知所有使用相同 objectKey 的图片元素更新 URL
 */
function notifyUrlUpdated(objectKey: string, newUrl: string): void {
  // 更新全局缓存
  urlCache.set(objectKey, newUrl)
  
  // 触发自定义事件
  const event = new CustomEvent(OSS_IMAGE_URL_UPDATED_EVENT, {
    detail: { objectKey, newUrl }
  })
  window.dispatchEvent(event)
  
  console.log('[ErrorInterceptor] 📢 已通知所有图片元素更新 URL:', {
    objectKey,
    newUrl: newUrl.substring(0, 50) + '...',
  })
}

/**
 * 获取缓存的 URL（如果存在）
 */
export function getCachedUrl(objectKey: string): string | null {
  return urlCache.get(objectKey) || null
}

/**
 * 初始化全局错误拦截器
 * 监听 window error 事件，自动修复 OSS 图片加载失败（403 错误）
 */
export function initErrorInterceptor(): void {
  if (typeof window === 'undefined') {
    return
  }

  // 监听全局错误事件（捕获阶段）
  window.addEventListener('error', handleImageError, true)

  console.log('[ErrorInterceptor] ✅ 全局错误拦截器已初始化')
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: ErrorEvent): void {
  const target = event.target

  // 只处理图片加载错误
  if (!(target instanceof HTMLImageElement)) {
    return
  }

  const img = target
  const src = img.src

  // 只处理 OSS 图片（aliyuncs.com）
  if (!src.includes('aliyuncs.com')) {
    return
  }

  // 从 data-oss-key 属性获取 objectKey
  const objectKey = img.getAttribute('data-oss-key')
  if (!objectKey) {
    console.warn('[ErrorInterceptor] ⚠️ 图片加载失败，但未找到 data-oss-key 属性:', src)
    return
  }

  // 检查该图片已经修复的次数
  const retryCount = fixedImages.get(img) || 0
  if (retryCount >= MAX_RETRY_COUNT) {
    console.warn('[ErrorInterceptor] ⚠️ 图片已修复超过最大次数，停止修复:', {
      objectKey,
      retryCount,
      maxRetry: MAX_RETRY_COUNT,
      src: src.substring(0, 50) + '...',
    })
    return
  }

  // 检查是否是 403 错误（通过尝试获取图片的 HTTP 状态）
  // 注意：error 事件中无法直接获取 HTTP 状态码，但我们可以通过其他方式判断
  // 如果图片加载失败且是 OSS URL，很可能是 403 或其他网络错误
  
  console.log('[ErrorInterceptor] 🔧 检测到 OSS 图片加载失败，开始自动修复:', {
    objectKey,
    src: src.substring(0, 50) + '...',
    retryCount: retryCount + 1,
    maxRetry: MAX_RETRY_COUNT,
    note: '可能是 403 错误（URL 过期）或其他网络错误',
  })

  // 记录修复次数
  fixedImages.set(img, retryCount + 1)

  // 自动修复：重新获取签名 URL
  const resourceLoader = getOssResourceLoader()
  
  resourceLoader.refresh(objectKey)
    .then((newUrl) => {
      console.log('[ErrorInterceptor] ✅ 自动修复成功，更新图片 URL:', {
        objectKey,
        oldUrl: src.substring(0, 50) + '...',
        newUrl: newUrl.substring(0, 50) + '...',
        retryCount: retryCount + 1,
      })
      
      // 静默替换 img.src
      img.src = newUrl
      
      // 如果图片成功加载，清除重试计数并通知所有相关图片元素
      const onLoadSuccess = () => {
        fixedImages.delete(img)
        img.removeEventListener('load', onLoadSuccess)
        
        // 通知所有使用相同 objectKey 的图片元素更新 URL
        notifyUrlUpdated(objectKey, newUrl)
      }
      img.addEventListener('load', onLoadSuccess, { once: true })
      
      // 注意：不需要手动触发 load 事件，浏览器会自动加载新 URL
    })
    .catch((error) => {
      console.error('[ErrorInterceptor] ❌ 自动修复失败:', {
        objectKey,
        error: error instanceof Error ? error.message : String(error),
        retryCount: retryCount + 1,
      })
      // 修复失败，不减少重试计数，让下次可以再试（但受 MAX_RETRY_COUNT 限制）
    })
}

/**
 * 销毁全局错误拦截器
 */
export function destroyErrorInterceptor(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.removeEventListener('error', handleImageError, true)
  console.log('[ErrorInterceptor] ✅ 全局错误拦截器已销毁')
}

