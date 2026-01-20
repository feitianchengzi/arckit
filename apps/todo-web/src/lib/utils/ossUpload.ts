/**
 * OSS 上传工具
 * 使用阿里云 OSS Browser SDK 上传文件
 */

import { STSCredentials } from '../api/endpoints/upload'

// 声明全局 OSS 类型
declare global {
  interface Window {
    OSS?: any
  }
}

// OSS 配置（从环境变量读取）
const OSS_REGION = import.meta.env.VITE_OSS_REGION || 'oss-cn-hangzhou'
const OSS_BUCKET = import.meta.env.VITE_OSS_BUCKET || 'feitianchengziworkshop'

/**
 * 动态加载 OSS Browser SDK
 * 使用 CDN 方式加载，避免增加 bundle 大小
 */
async function loadOSSSDK(): Promise<any> {
  // 检查是否已经加载
  if (window.OSS) {
    return window.OSS
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.18.0.min.js'
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
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @param credentials STS 临时凭证
 * @param onProgress 上传进度回调 (0-1)
 * @returns OSS 文件 URL
 */
export async function uploadToOSS(
  file: File | Blob,
  credentials: STSCredentials,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // 加载 OSS SDK
    const OSS = await loadOSSSDK()
    
    // 创建 OSS 客户端
    const client = new OSS({
      region: OSS_REGION,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: OSS_BUCKET,
      secure: true, // 使用 HTTPS
    })
    
    // 生成文件路径
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = getFileExtension(file.name || 'image.jpg')
    const key = `avatars/${timestamp}_${randomStr}.${fileExt}`
    
    // 上传文件
    const result = await client.multipartUpload(key, file, {
      progress: (p: number) => {
        if (onProgress) {
          onProgress(p)
        }
      },
    })
    
    // 返回文件 URL
    // 使用 HTTPS 协议的 URL
    const fileUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${result.name}`
    
    return fileUrl
  } catch (error) {
    console.error('OSS 上传失败:', error)
    throw new Error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg'
}

/**
 * 获取带签名的访问 URL（可选，如果需要临时访问链接）
 * @param fileUrl OSS 文件 URL
 * @param credentials STS 临时凭证
 * @param expires 过期时间（秒），默认 3600
 */
export async function getSignedUrl(
  fileUrl: string,
  credentials: STSCredentials,
  expires: number = 3600
): Promise<string> {
  try {
    const OSS = await loadOSSSDK()
    
    // 从 URL 中提取 key
    const urlParts = fileUrl.split('.aliyuncs.com/')
    if (urlParts.length < 2) {
      throw new Error('无效的 OSS URL')
    }
    
    const key = urlParts[1]
    
    // 创建 OSS 客户端
    const client = new OSS({
      region: OSS_REGION,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: OSS_BUCKET,
      secure: true,
    })
    
    // 生成签名 URL
    const signedUrl = client.signatureUrl(key, {
      expires,
      method: 'GET',
    })
    
    return signedUrl
  } catch (error) {
    console.error('生成签名 URL 失败:', error)
    throw error
  }
}
