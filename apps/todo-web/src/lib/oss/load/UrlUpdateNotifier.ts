/**
 * URL 更新通知器
 * 当 ErrorInterceptor 成功修复图片 URL 后，通知所有使用相同 objectKey 的图片元素更新
 */

// 全局 URL 缓存：objectKey -> 最新的有效 URL
const urlCache = new Map<string, string>()

// 事件名称
const URL_UPDATE_EVENT = 'oss-url-updated'

/**
 * 通知 URL 已更新
 * @param objectKey OSS objectKey
 * @param newUrl 新的 URL
 */
export function notifyUrlUpdated(objectKey: string, newUrl: string): void {
  // 更新缓存
  urlCache.set(objectKey, newUrl)
  
  // 触发自定义事件，通知所有监听者
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(URL_UPDATE_EVENT, {
      detail: { objectKey, newUrl },
    })
    window.dispatchEvent(event)
    
    console.log('[UrlUpdateNotifier] 📢 通知 URL 已更新:', {
      objectKey,
      newUrl: newUrl.substring(0, 50) + '...',
    })
  }
}

/**
 * 订阅 URL 更新事件
 * @param objectKey 要监听的 objectKey
 * @param callback 回调函数，接收新的 URL
 * @returns 取消订阅函数
 */
export function subscribeUrlUpdate(
  objectKey: string,
  callback: (newUrl: string) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  // 检查缓存中是否已有 URL
  const cachedUrl = urlCache.get(objectKey)
  if (cachedUrl) {
    // 立即调用回调，使用缓存的 URL
    console.log('[UrlUpdateNotifier] ⚡ 使用缓存的 URL:', {
      objectKey,
      cachedUrl: cachedUrl.substring(0, 50) + '...',
    })
    callback(cachedUrl)
  }
  
  // 监听全局事件
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ objectKey: string; newUrl: string }>
    if (customEvent.detail.objectKey === objectKey) {
      console.log('[UrlUpdateNotifier] 📨 收到 URL 更新通知:', {
        objectKey,
        newUrl: customEvent.detail.newUrl.substring(0, 50) + '...',
      })
      callback(customEvent.detail.newUrl)
    }
  }
  
  window.addEventListener(URL_UPDATE_EVENT, handler)
  
  // 返回取消订阅函数
  return () => {
    window.removeEventListener(URL_UPDATE_EVENT, handler)
  }
}

/**
 * 获取缓存的 URL（同步）
 * @param objectKey OSS objectKey
 * @returns 缓存的 URL，如果没有则返回 null
 */
export function getCachedUrl(objectKey: string): string | null {
  return urlCache.get(objectKey) || null
}

/**
 * 清除缓存
 * @param objectKey 可选的 objectKey，如果不提供则清除所有缓存
 */
export function clearCache(objectKey?: string): void {
  if (objectKey) {
    urlCache.delete(objectKey)
  } else {
    urlCache.clear()
  }
}
