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

/**
 * 从 endpoint 中提取 region
 * 例如: http://oss-cn-beijing.aliyuncs.com -> oss-cn-beijing
 */
function extractRegionFromEndpoint(endpoint: string): string {
  // 移除协议前缀 (http:// 或 https://)
  const withoutProtocol = endpoint.replace(/^https?:\/\//, '')
  // 提取第一个点之前的部分作为 region
  const parts = withoutProtocol.split('.')
  return parts[0] || 'oss-cn-hangzhou' // 默认值
}

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
 * 刷新 STS Token 的函数
 * 用于 OSS SDK 自动刷新过期凭证
 */
async function refreshSTSToken(): Promise<{
  accessKeyId: string
  accessKeySecret: string
  stsToken: string
}> {
  const { uploadApi } = await import('../api/endpoints/upload')
  const credentials = await uploadApi.getSTSToken()
  
  return {
    accessKeyId: credentials.AccessKeyId,
    accessKeySecret: credentials.AccessKeySecret,
    stsToken: credentials.SecurityToken,
  }
}

/**
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @param credentials STS 临时凭证（包含 endpoint 和 bucket_name）
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
    
    // 从 endpoint 中提取 region
    const region = extractRegionFromEndpoint(credentials.Endpoint)
    
    // 创建 OSS 客户端
    // 根据参考代码，添加 authorizationV4: true 和自动刷新 STS token 配置
    const client = new OSS({
      region: region,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: true, // 使用 HTTPS
      authorizationV4: true, // 使用 V4 签名，有助于解决 CORS 问题
      // 自动刷新 STS token（STS token 有效期为 1 小时，提前 5 分钟刷新）
      refreshSTSToken: refreshSTSToken,
      refreshSTSTokenInterval: 55 * 60 * 1000, // 55 分钟后自动刷新（单位：毫秒）
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
    // 使用 HTTPS 协议的 URL，格式: https://{bucket}.{region}.aliyuncs.com/{key}
    const fileUrl = `https://${credentials.BucketName}.${region}.aliyuncs.com/${result.name}`
    
    return fileUrl
  } catch (error) {
    console.error('OSS 上传失败:', error)
    
      // 提供更详细的错误信息
      if (error instanceof Error) {
        // 检查是否是 CORS 错误
        if (
          error.message.includes('CORS') || 
          error.message.includes('Access-Control-Allow-Origin') ||
          error.message.includes('preflight') ||
          error.message.includes('blocked by CORS policy')
        ) {
          const corsErrorMsg = '上传失败：CORS 跨域错误。\n\n' +
            '请按照以下步骤配置 OSS Bucket 的 CORS 规则：\n' +
            '1. 登录阿里云 OSS 控制台\n' +
            '2. 找到 Bucket: feitianchengziworkshop\n' +
            '3. 进入"权限管理" → "跨域设置（CORS）"\n' +
            '4. 添加规则：\n' +
            '   - 来源: https://workshop.feitianchengzi.com\n' +
            '   - 允许 Methods: GET, PUT, POST, DELETE, HEAD, OPTIONS\n' +
            '   - 允许 Headers: *\n' +
            '   - 暴露 Headers: ETag, x-oss-request-id\n' +
            '   - 缓存时间: 3600\n\n' +
            '详细配置指南请查看: frontend/OSS_CORS_CONFIG.md'
          throw new Error(corsErrorMsg)
        }
        // 检查是否是网络错误（可能是 CORS 导致的）
        if (error.message.includes('XHR error') || error.message.includes('network') || error.message.includes('ERR_FAILED')) {
          // 检查是否是 CORS 相关的网络错误
          const isLikelyCORS = error.message.includes('PUT') || error.message.includes('aliyuncs.com')
          if (isLikelyCORS) {
            const corsErrorMsg = '上传失败：可能是 CORS 配置问题。\n\n' +
              '请检查 OSS Bucket 的 CORS 配置是否正确。\n' +
              '详细配置指南请查看: frontend/OSS_CORS_CONFIG.md'
            throw new Error(corsErrorMsg)
          }
          throw new Error('上传失败：网络连接错误。请检查网络连接或联系管理员检查 OSS 服务状态。')
        }
        throw new Error(`上传失败: ${error.message}`)
      }
    
    throw new Error(`上传失败: 未知错误`)
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
 * @param credentials STS 临时凭证（包含 endpoint 和 bucket_name）
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
    
    // 从 endpoint 中提取 region
    const region = extractRegionFromEndpoint(credentials.Endpoint)
    
    // 创建 OSS 客户端
    const client = new OSS({
      region: region,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: true,
      authorizationV4: true, // 使用 V4 签名
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
