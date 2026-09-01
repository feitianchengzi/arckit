/**
 * OSS URL 辅助函数（业务层）
 * 提供业务级别的 URL 获取函数，如 getAvatarUrl 等
 */

import { isObjectKey } from './sdk'
import { getOssResourceLoader } from './load'

/**
 * 同步获取头像 URL（仅当缓存命中时）
 * 用于需要立即获取 URL 的场景，避免异步延迟
 */
export function getAvatarUrlSync(avatar: string | undefined | null): string | null {
  if (!avatar) {
    return null
  }
  
  // 如果已经是完整 URL，直接返回
  if (!isObjectKey(avatar)) {
    return avatar
  }
  
  // 如果是 objectKey，尝试同步获取缓存
  const resourceLoader = getOssResourceLoader()
  return resourceLoader.getUrlSync(avatar)
}

/**
 * 将头像值（可能是 objectKey 或完整 URL）转换为可访问的 URL
 * 如果是 objectKey，使用 OssResourceLoadManager 获取签名 URL（自动缓存和请求合并）
 * 如果是完整 URL，直接返回
 * 
 * @param avatar 头像值（objectKey 或完整 URL）
 * @returns 可访问的头像 URL，如果转换失败返回 null
 */
export async function getAvatarUrl(avatar: string | undefined | null): Promise<string | null> {
  console.log('[getAvatarUrl] 开始处理头像:', avatar)
  
  if (!avatar) {
    console.log('[getAvatarUrl] 头像为空，返回 null')
    return null
  }
  
  // 如果已经是完整 URL，直接返回
  if (!isObjectKey(avatar)) {
    console.log('[getAvatarUrl] 检测到完整 URL，直接返回:', avatar)
    return avatar
  }
  
  // 如果是 objectKey，使用 OssResourceLoadManager 获取 URL
  console.log('[getAvatarUrl] 检测到 objectKey，使用 OssResourceLoadManager 获取 URL:', avatar)
  try {
    const resourceLoader = getOssResourceLoader()
    const url = await resourceLoader.getUrl(avatar)
    console.log('[getAvatarUrl] 获取文件 URL 成功:', url)
    return url
  } catch (error) {
    console.error('[getAvatarUrl] 获取头像 URL 失败:', error)
    console.error('[getAvatarUrl] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      avatar
    })
    return null
  }
}

