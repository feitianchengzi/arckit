/**
 * 全局错误拦截器
 * 监听图片加载失败（403 错误），自动修复
 * 
 * 设计文档：frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md
 */

import { getOssResourceLoader } from './index'

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

  // 检查是否是 403 错误（通过尝试获取图片的 HTTP 状态）
  // 注意：error 事件中无法直接获取 HTTP 状态码，但我们可以通过其他方式判断
  // 如果图片加载失败且是 OSS URL，很可能是 403 或其他网络错误
  
  console.log('[ErrorInterceptor] 🔧 检测到 OSS 图片加载失败，开始自动修复:', {
    objectKey,
    src: src.substring(0, 50) + '...',
    note: '可能是 403 错误（URL 过期）或其他网络错误',
  })

  // 自动修复：重新获取签名 URL
  const resourceLoader = getOssResourceLoader()
  
  resourceLoader.refresh(objectKey)
    .then((newUrl) => {
      console.log('[ErrorInterceptor] ✅ 自动修复成功，更新图片 URL:', {
        objectKey,
        oldUrl: src.substring(0, 50) + '...',
        newUrl: newUrl.substring(0, 50) + '...',
      })
      
      // 静默替换 img.src
      img.src = newUrl
      
      // 注意：不需要手动触发 load 事件，浏览器会自动加载新 URL
    })
    .catch((error) => {
      console.error('[ErrorInterceptor] ❌ 自动修复失败:', {
        objectKey,
        error: error instanceof Error ? error.message : String(error),
      })
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

