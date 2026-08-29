/**
 * 全局错误拦截器
 * 监听图片加载失败（403 错误），自动修复
 * 
 * 设计文档：frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md
 */

import { OssResourceLoadManager } from './OssResourceLoadManager'
import { notifyUrlUpdated } from './UrlUpdateNotifier'
import { normalizeObjectKey } from '../sdk'
import {
  describeImageElement,
  describeSignedUrl,
  errorOssImageDiag,
  logOssImageDiag,
  warnOssImageDiag,
} from './diagnostics'

// 记录每个图片元素已经修复的次数，避免无限循环
const fixedImages = new WeakMap<HTMLImageElement, number>()
const MAX_RETRY_COUNT = 2 // 每个图片最多修复 2 次
let initialized = false

/**
 * 初始化全局错误拦截器
 * 监听 window error 事件，自动修复 OSS 图片加载失败（403 错误）
 */
export function initErrorInterceptor(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (initialized) {
    return
  }

  // 监听全局错误事件（捕获阶段）
  window.addEventListener('error', handleImageError, true)
  initialized = true

  console.log('[ErrorInterceptor] ✅ 全局错误拦截器已初始化')
  logOssImageDiag('interceptor.initialized')
}

function getObjectKeyFromImage(img: HTMLImageElement): string {
  const dataKey = img.getAttribute('data-oss-key')
  if (dataKey) {
    return normalizeObjectKey(dataKey)
  }

  return normalizeObjectKey(img.src)
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

  // 从 data-oss-key 属性获取 objectKey；缺失时从 OSS URL pathname 兜底反推。
  const objectKey = getObjectKeyFromImage(img)
  if (!objectKey) {
    console.warn('[ErrorInterceptor] ⚠️ 图片加载失败，但无法识别 objectKey:', src.substring(0, 80) + '...')
    warnOssImageDiag('interceptor.error.noObjectKey', {
      image: describeImageElement(img),
    })
    return
  }

  img.setAttribute('data-oss-key', objectKey)

  // 检查该图片已经修复的次数
  const retryCount = fixedImages.get(img) || 0
  logOssImageDiag('interceptor.error.captured', {
    objectKey,
    retryCount,
    maxRetry: MAX_RETRY_COUNT,
    image: describeImageElement(img),
  })

  if (retryCount >= MAX_RETRY_COUNT) {
    console.warn('[ErrorInterceptor] ⚠️ 图片已修复超过最大次数，停止修复:', {
      objectKey,
      retryCount,
      maxRetry: MAX_RETRY_COUNT,
      src: src.substring(0, 50) + '...',
    })
    warnOssImageDiag('interceptor.error.maxRetry', {
      objectKey,
      retryCount,
      maxRetry: MAX_RETRY_COUNT,
      image: describeImageElement(img),
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
  const resourceLoader = OssResourceLoadManager.getInstance()
  logOssImageDiag('interceptor.refresh.start', {
    objectKey,
    retryCount: retryCount + 1,
    oldUrl: describeSignedUrl(src),
  })
  
  resourceLoader.refresh(objectKey)
    .then((newUrl) => {
      console.log('[ErrorInterceptor] ✅ 自动修复成功，更新图片 URL:', {
        objectKey,
        oldUrl: src.substring(0, 50) + '...',
        newUrl: newUrl.substring(0, 50) + '...',
        retryCount: retryCount + 1,
      })

      // 如果图片成功加载，清除重试计数并通知所有相关图片元素
      const onLoadSuccess = () => {
        fixedImages.delete(img)
        img.removeEventListener('load', onLoadSuccess)
        img.removeEventListener('error', onRetryError)
        logOssImageDiag('interceptor.refresh.imageLoaded', {
          objectKey,
          retryCount: retryCount + 1,
          image: describeImageElement(img),
        })
        
        // 通知所有使用相同 objectKey 的图片元素更新 URL
        notifyUrlUpdated(objectKey, newUrl)
      }

      const onRetryError = () => {
        img.removeEventListener('load', onLoadSuccess)
        img.removeEventListener('error', onRetryError)
        warnOssImageDiag('interceptor.refresh.replacedUrlStillFailed', {
          objectKey,
          retryCount: retryCount + 1,
          image: describeImageElement(img),
          newUrl: describeSignedUrl(newUrl),
        })
      }

      img.addEventListener('load', onLoadSuccess, { once: true })
      img.addEventListener('error', onRetryError, { once: true })

      logOssImageDiag('interceptor.refresh.success.setImageSrc', {
        objectKey,
        retryCount: retryCount + 1,
        oldUrl: describeSignedUrl(src),
        newUrl: describeSignedUrl(newUrl),
        sameUrl: src === newUrl,
      })

      // 静默替换 img.src
      img.src = newUrl

      // 注意：不需要手动触发 load 事件，浏览器会自动加载新 URL
    })
    .catch((error) => {
      console.error('[ErrorInterceptor] ❌ 自动修复失败:', {
        objectKey,
        error: error instanceof Error ? error.message : String(error),
        retryCount: retryCount + 1,
      })
      errorOssImageDiag('interceptor.refresh.failed', {
        objectKey,
        retryCount: retryCount + 1,
        error: error instanceof Error ? error.message : String(error),
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
  initialized = false
  console.log('[ErrorInterceptor] ✅ 全局错误拦截器已销毁')
  logOssImageDiag('interceptor.destroyed')
}
