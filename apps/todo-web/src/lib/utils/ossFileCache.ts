/**
 * OSS 文件缓存管理
 * 实现本地图片缓存、signatureUrl 生成、缓存管理
 */

import { STSCredentials } from '../api/endpoints/upload'
import { getSignedUrl } from './ossUpload'

/**
 * OSS 文件缓存数据结构
 */
export interface OSSFileCache {
  objectKey: string        // 文件的 objectKey
  signatureUrl: string     // 签名 URL
  expiresAt: number        // 过期时间戳（毫秒）
  localImageUrl: string    // 本地缓存的图片地址（blob URL 或 IndexedDB key）
}

/**
 * 缓存存储键前缀
 */
const CACHE_PREFIX = 'oss_file_cache_'

/**
 * 从 localStorage 获取缓存
 */
function getCacheFromStorage(objectKey: string): OSSFileCache | null {
  try {
    const key = `${CACHE_PREFIX}${objectKey}`
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const data = JSON.parse(cached) as OSSFileCache
    return data
  } catch (error) {
    console.error('读取缓存失败:', error)
    return null
  }
}

/**
 * 保存缓存到 localStorage
 */
function saveCacheToStorage(cache: OSSFileCache): void {
  try {
    const key = `${CACHE_PREFIX}${cache.objectKey}`
    localStorage.setItem(key, JSON.stringify(cache))
  } catch (error) {
    console.error('保存缓存失败:', error)
    // 如果存储空间不足，尝试清理旧缓存
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldCaches()
      // 重试一次
      try {
        localStorage.setItem(key, JSON.stringify(cache))
      } catch (retryError) {
        console.error('重试保存缓存失败:', retryError)
      }
    }
  }
}

/**
 * 清理旧的缓存（保留最近使用的）
 */
function clearOldCaches(): void {
  try {
    const keys: Array<{ key: string; expiresAt: number }> = []
    
    // 收集所有缓存键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const data = JSON.parse(cached) as OSSFileCache
            keys.push({ key, expiresAt: data.expiresAt })
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
    
    // 按过期时间排序，删除最旧的 50%
    keys.sort((a, b) => a.expiresAt - b.expiresAt)
    const toDelete = keys.slice(0, Math.floor(keys.length / 2))
    
    toDelete.forEach(({ key }) => {
      localStorage.removeItem(key)
    })
    
    console.log(`清理了 ${toDelete.length} 个旧缓存`)
  } catch (error) {
    console.error('清理旧缓存失败:', error)
  }
}

/**
 * 验证本地缓存是否有效
 */
async function isLocalCacheValid(localImageUrl: string): Promise<boolean> {
  console.log('[isLocalCacheValid] 验证本地缓存有效性:', localImageUrl)
  
  if (!localImageUrl) {
    console.log('[isLocalCacheValid] localImageUrl 为空，返回 false')
    return false
  }
  
  try {
    // 如果是 blob URL，尝试访问
    if (localImageUrl.startsWith('blob:')) {
      console.log('[isLocalCacheValid] 检测到 blob URL，尝试访问')
      const response = await fetch(localImageUrl, { method: 'HEAD' })
      const isValid = response.ok
      console.log('[isLocalCacheValid] blob URL 访问结果:', isValid, response.status)
      return isValid
    }
    
    // 其他类型的本地 URL 暂时认为有效
    console.log('[isLocalCacheValid] 非 blob URL，认为有效')
    return true
  } catch (error) {
    console.error('[isLocalCacheValid] 验证失败:', error)
    return false
  }
}

/**
 * 下载图片并缓存到本地
 */
async function downloadAndCacheImage(
  signatureUrl: string,
  objectKey: string
): Promise<string> {
  console.log('[downloadAndCacheImage] 开始下载图片:', {
    objectKey,
    signatureUrl: signatureUrl.substring(0, 100) + '...'
  })
  
  try {
    // 1. 下载图片
    console.log('[downloadAndCacheImage] 发起 fetch 请求...')
    const response = await fetch(signatureUrl)
    console.log('[downloadAndCacheImage] fetch 响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`)
    }
    
    console.log('[downloadAndCacheImage] 开始读取 blob...')
    const blob = await response.blob()
    console.log('[downloadAndCacheImage] blob 读取成功:', {
      size: blob.size,
      type: blob.type
    })
    
    // 2. 创建 Blob URL 并缓存
    const localImageUrl = URL.createObjectURL(blob)
    console.log('[downloadAndCacheImage] 创建 Blob URL 成功:', localImageUrl)
    
    return localImageUrl
  } catch (error) {
    console.error('[downloadAndCacheImage] 下载并缓存图片失败:', error)
    console.error('[downloadAndCacheImage] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      objectKey,
      signatureUrl: signatureUrl.substring(0, 100) + '...'
    })
    throw error
  }
}

/**
 * 获取文件 URL（优先使用本地缓存）
 * 
 * @param objectKey OSS 对象 Key
 * @param credentials STS 临时凭证（可选，如果缓存中没有 signatureUrl 或已过期，会重新获取）
 * @returns 可访问的文件 URL（本地缓存 URL 或 signatureUrl）
 */
export async function getFileUrl(
  objectKey: string,
  credentials?: STSCredentials
): Promise<string> {
  console.log('[getFileUrl] 开始获取文件 URL, objectKey:', objectKey)
  
  // 1. 检查本地缓存
  const cached = getCacheFromStorage(objectKey)
  console.log('[getFileUrl] 检查本地缓存:', cached ? {
    objectKey: cached.objectKey,
    hasLocalImageUrl: !!cached.localImageUrl,
    hasSignatureUrl: !!cached.signatureUrl,
    expiresAt: cached.expiresAt,
    isExpired: cached.expiresAt < Date.now()
  } : '无缓存')
  
  // 2. 优先使用本地图片缓存
  if (cached && cached.localImageUrl) {
    console.log('[getFileUrl] 发现本地缓存，验证有效性:', cached.localImageUrl)
    const isValid = await isLocalCacheValid(cached.localImageUrl)
    console.log('[getFileUrl] 本地缓存有效性:', isValid)
    if (isValid) {
      console.log('[getFileUrl] 使用本地缓存:', cached.localImageUrl)
      return cached.localImageUrl
    } else {
      // 本地缓存失效，清除
      console.log('[getFileUrl] 本地缓存失效，清除')
      cached.localImageUrl = ''
    }
  }
  
  // 3. 如果没有本地缓存，检查 signatureUrl
  let signatureUrl = cached?.signatureUrl
  let expiresAt = cached?.expiresAt
  console.log('[getFileUrl] 检查 signatureUrl:', {
    hasSignatureUrl: !!signatureUrl,
    expiresAt,
    isExpired: expiresAt ? expiresAt < Date.now() : true
  })
  
  // 4. 如果 signatureUrl 不存在或已过期，重新生成
  if (!signatureUrl || !expiresAt || expiresAt < Date.now()) {
    console.log('[getFileUrl] signatureUrl 不存在或已过期，重新生成')
    // 如果没有提供 credentials，需要获取
    let finalCredentials = credentials
    if (!finalCredentials) {
      console.log('[getFileUrl] 获取 STS 凭证...')
      const { uploadApi } = await import('../api/endpoints/upload')
      finalCredentials = await uploadApi.getSTSToken()
      console.log('[getFileUrl] STS 凭证获取成功:', {
        bucket: finalCredentials.BucketName,
        region: finalCredentials.Region,
        rootPath: finalCredentials.RootPath
      })
    }
    
    console.log('[getFileUrl] 生成签名 URL, objectKey:', objectKey)
    signatureUrl = await getSignedUrl(objectKey, finalCredentials, 3600)
    expiresAt = Date.now() + 3600 * 1000 // 1小时后过期
    console.log('[getFileUrl] 签名 URL 生成成功:', signatureUrl.substring(0, 100) + '...')
  } else {
    console.log('[getFileUrl] 使用缓存的 signatureUrl')
  }
  
  // 5. 下载图片并缓存到本地
  let localImageUrl = ''
  try {
    console.log('[getFileUrl] 开始下载图片并缓存到本地, signatureUrl:', signatureUrl.substring(0, 100) + '...')
    localImageUrl = await downloadAndCacheImage(signatureUrl, objectKey)
    console.log('[getFileUrl] 图片下载并缓存成功, localImageUrl:', localImageUrl)
  } catch (error) {
    console.error('[getFileUrl] 下载图片失败，使用 signatureUrl:', error)
    console.error('[getFileUrl] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      objectKey,
      signatureUrl: signatureUrl.substring(0, 100) + '...'
    })
    // 如果下载失败，直接返回 signatureUrl
    console.log('[getFileUrl] 返回 signatureUrl:', signatureUrl.substring(0, 100) + '...')
    return signatureUrl
  }
  
  // 6. 更新缓存
  const newCache: OSSFileCache = {
    objectKey,
    signatureUrl,
    expiresAt,
    localImageUrl,
  }
  console.log('[getFileUrl] 更新缓存:', {
    objectKey,
    hasLocalImageUrl: !!localImageUrl,
    expiresAt
  })
  saveCacheToStorage(newCache)
  
  console.log('[getFileUrl] 返回本地缓存 URL:', localImageUrl)
  return localImageUrl
}

/**
 * 清除指定 objectKey 的缓存
 */
export function clearFileCache(objectKey: string): void {
  try {
    const key = `${CACHE_PREFIX}${objectKey}`
    const cached = localStorage.getItem(key)
    if (cached) {
      const data = JSON.parse(cached) as OSSFileCache
      // 如果存在 blob URL，释放它
      if (data.localImageUrl && data.localImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(data.localImageUrl)
      }
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

/**
 * 清除所有 OSS 文件缓存
 */
export function clearAllFileCaches(): void {
  try {
    const keysToDelete: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const data = JSON.parse(cached) as OSSFileCache
            // 如果存在 blob URL，释放它
            if (data.localImageUrl && data.localImageUrl.startsWith('blob:')) {
              URL.revokeObjectURL(data.localImageUrl)
            }
          }
        } catch {
          // 忽略解析错误
        }
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key))
    console.log(`清除了 ${keysToDelete.length} 个文件缓存`)
  } catch (error) {
    console.error('清除所有缓存失败:', error)
  }
}

