/**
 * OSS SDK 共享工具
 * 提供 OSS SDK 加载、路径工具等共享功能
 */

// 声明全局 OSS 类型
declare global {
  interface Window {
    OSS?: any
  }
}

/**
 * 动态加载 OSS Browser SDK
 * 使用 CDN 方式加载，避免增加 bundle 大小
 */
export async function loadOSSSDK(): Promise<any> {
  // 检查是否已经加载
  if (window.OSS) {
    return window.OSS
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.23.0.min.js'
    script.async = true
    
    script.onload = () => {
      if (window.OSS) {
        resolve(window.OSS)
      } else {
        reject(new Error('OSS SDK 加载失败'))
      }
    }
    
    script.onerror = () => {
      reject(new Error('无法加载 OSS SDK'))
    }
    
    document.head.appendChild(script)
  })
}

/**
 * 规范化 OSS objectKey，确保缓存、签名和 data-oss-key 使用同一种格式。
 * OSS objectKey 不应以 / 开头；如果传入的是已签名 URL，则取 pathname。
 */
export function normalizeObjectKey(value: string): string {
  if (!value) return ''

  let key = value.trim()

  if (/^https?:\/\//i.test(key)) {
    try {
      key = new URL(key).pathname
    } catch {
      // 解析失败时继续走普通字符串兜底。
    }
  } else {
    key = key.split('?')[0].split('#')[0]
  }

  try {
    key = decodeURIComponent(key)
  } catch {
    // 保留原值，避免异常中断图片加载自愈。
  }

  return key.replace(/^\/+/, '')
}

/**
 * 根据 STS 剩余时间计算安全的签名 URL 有效期。
 */
export function getSafeSignedUrlExpires(
  stsExpiration: string,
  requestedExpires: number = 3600,
  clockSkewSeconds: number = 30
): number {
  const expirationMs = new Date(stsExpiration).getTime()
  if (!Number.isFinite(expirationMs)) {
    return requestedExpires
  }

  const remainingSeconds = Math.floor((expirationMs - Date.now()) / 1000)
  const safeRemaining = remainingSeconds - clockSkewSeconds

  return Math.max(1, Math.min(requestedExpires, safeRemaining))
}

/**
 * 路径拼接工具函数
 * 确保路径正确拼接，处理斜杠
 */
export function joinPath(a: string, b: string): string {
  const left = (a || '').replace(/^\/+|\/+$/g, '')
  const right = (b || '').replace(/^\/+/, '')
  return left ? `${left}/${right}` : right
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg'
}

/**
 * 判断字符串是否为 OSS objectKey（而不是完整的 URL）
 * objectKey 格式：不包含 http:// 或 https://，通常包含路径分隔符
 */
export function isObjectKey(value: string): boolean {
  return !value.startsWith('http://') && !value.startsWith('https://') && value.includes('/')
}
