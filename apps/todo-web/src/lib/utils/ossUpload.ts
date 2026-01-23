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
 * 路径拼接工具函数
 * 确保路径正确拼接，处理斜杠
 */
function joinPath(a: string, b: string): string {
  const left = (a || '').replace(/\/+$/g, '')
  const right = (b || '').replace(/^\/+/, '')
  return left ? `${left}/${right}` : right
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
 * 计算 STS Token 刷新时间间隔
 * 根据 expiration 时间计算，提前 1 分钟刷新（安全窗口）
 */
function calculateRefreshInterval(expiration: string): number {
  const expirationTime = new Date(expiration).getTime()
  const now = Date.now()
  const safetyWindow = 60 * 1000 // 1 分钟安全窗口
  const interval = expirationTime - now - safetyWindow
  
  // 确保间隔至少为 1 分钟
  return Math.max(interval, 60 * 1000)
}

/**
 * OSS 文件目录类型
 */
export type OSSDirectory = 'avatars' | 'attachments' | 'documents' | string

/**
 * 生成 OSS objectKey
 * @param rootPath OSS 根路径
 * @param directory 文件目录（例如：'avatars'、'attachments'、'documents'）
 * @param fileName 文件名
 * @returns 完整的 objectKey
 */
export function generateObjectKey(
  rootPath: string,
  directory: OSSDirectory,
  fileName: string
): string {
  return joinPath(rootPath, `${directory}/${fileName}`)
}

/**
 * 上传结果接口
 */
export interface UploadResult {
  objectKey: string
  url?: string // 可选的签名URL，如果需要立即访问
}

/**
 * 上传文件到 OSS（内部函数，仅供 ossUploadApi.ts 使用）
 * 注意：业务代码不应直接使用此函数，应使用 ossUploadApi.ts 中提供的业务接口
 * 
 * @param file 要上传的文件
 * @param credentials STS 临时凭证（包含 region、bucket_name、root_path 等）
 * @param directory 文件目录（例如：'avatars'、'attachments'、'documents'）
 * @param onProgress 上传进度回调 (0-1)
 * @param callbackUrl 可选：OSS callback URL，上传成功后OSS会向此URL发送POST请求
 * @param callbackBody 可选：OSS callback body，传递给callback的数据
 * @returns 上传结果，包含 objectKey 和可选的签名URL
 * @internal 仅供内部使用
 */
export async function uploadToOSS(
  file: File | Blob,
  credentials: STSCredentials,
  directory: OSSDirectory,
  onProgress?: (progress: number) => void,
  callbackUrl?: string,
  callbackBody?: string
): Promise<UploadResult> {
  try {
    // 加载 OSS SDK
    const OSS = await loadOSSSDK()
    
    // 创建 OSS 客户端
    // Region 直接使用接口返回值（完整格式，例如 "oss-cn-beijing"）
    // 使用 API 返回的配置：authorizationV4 和 secure
    const client = new OSS({
      region: credentials.Region, // 直接使用，例如: "oss-cn-beijing"
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: credentials.Secure, // 使用接口返回值
      authorizationV4: credentials.AuthorizationV4, // 使用接口返回值
      // 自动刷新 STS token，根据 expiration 计算刷新时间
      refreshSTSToken: refreshSTSToken,
      refreshSTSTokenInterval: calculateRefreshInterval(credentials.Expiration),
    })
    
    // 生成文件路径
    // objectKey = root_path + directory/ + 文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = file instanceof File ? file.name : 'image.jpg'
    const fileExt = getFileExtension(fileName)
    const finalFileName = `${timestamp}_${randomStr}.${fileExt}`
    
    // 使用 generateObjectKey 生成 objectKey（支持多目录）
    const objectKey = generateObjectKey(credentials.RootPath, directory, finalFileName)
    
    // 构建上传选项
    const putOptions: any = {
      progress: (p: number) => {
        if (onProgress) {
          onProgress(p)
        }
      },
    }
    
    // 如果提供了 callback URL，配置 callback
    if (callbackUrl) {
      // 获取 access token 添加到 header
      const { getAccessToken } = await import('./tokenManager')
      const accessToken = getAccessToken()
      
      const callbackHeaders: Record<string, string> = {}
      if (accessToken) {
        callbackHeaders['Authorization'] = `Bearer ${accessToken}`
      }
      
      putOptions.callback = {
        url: callbackUrl,
        body: callbackBody || `object=${objectKey}&bucket=${credentials.BucketName}`,
        contentType: 'application/x-www-form-urlencoded',
        headers: callbackHeaders, // OSS SDK 使用 headers 传递自定义 header
      }
    }
    
    // 上传文件
    const result = await client.put(objectKey, file, putOptions)
    
    // 检查上传结果
    if (result?.res?.status !== 200) {
      throw new Error(`OSS upload failed: ${result?.res?.status}`)
    }
    
    // 返回 objectKey（主要返回值）
    // 如果需要立即访问，可以生成签名URL
    const uploadResult: UploadResult = {
      objectKey,
    }
    
    // 如果需要URL，使用 SDK 的 signatureUrl 方法生成访问 URL
    // 禁止手拼 URL，使用 SDK 方法
    uploadResult.url = client.signatureUrl(objectKey, {
      expires: 3600, // 1小时有效期
    })
    console.log("++ uploadResult", uploadResult)
    return uploadResult
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
 * 判断字符串是否为 OSS objectKey（而不是完整的 URL）
 * objectKey 格式：不包含 http:// 或 https://，通常包含路径分隔符
 */
function isObjectKey(avatar: string): boolean {
  return !avatar.startsWith('http://') && !avatar.startsWith('https://') && avatar.includes('/')
}

/**
 * 获取带签名的访问 URL（如果需要临时访问链接）
 * @param objectKey OSS 对象 Key（例如：workshop/avatars/xxx.jpg）
 * @param credentials STS 临时凭证（包含 region、bucket_name 等）
 * @param expires 过期时间（秒），默认 3600
 */
export async function getSignedUrl(
  objectKey: string,
  credentials: STSCredentials,
  expires: number = 3600
): Promise<string> {
  console.log('[getSignedUrl] 开始生成签名 URL:', {
    objectKey,
    expires,
    region: credentials.Region,
    bucket: credentials.BucketName
  })
  
  try {
    console.log('[getSignedUrl] 加载 OSS SDK...')
    const OSS = await loadOSSSDK()
    console.log('[getSignedUrl] OSS SDK 加载成功')
    
    // 创建 OSS 客户端
    // Region 直接使用接口返回值
    console.log('[getSignedUrl] 创建 OSS 客户端...')
    const client = new OSS({
      region: credentials.Region, // 直接使用，例如: "oss-cn-beijing"
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: credentials.Secure,
      authorizationV4: credentials.AuthorizationV4,
    })
    console.log('[getSignedUrl] OSS 客户端创建成功')
    
    // 生成签名 URL
    console.log('[getSignedUrl] 调用 client.signatureUrl...')
    const signedUrl = client.signatureUrl(objectKey, {
      expires,
    })
    console.log('[getSignedUrl] 签名 URL 生成成功:', signedUrl.substring(0, 100) + '...')
    
    return signedUrl
  } catch (error) {
    console.error('[getSignedUrl] 生成签名 URL 失败:', error)
    console.error('[getSignedUrl] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      objectKey,
      region: credentials.Region,
      bucket: credentials.BucketName
    })
    throw error
  }
}

/**
 * 将头像值（可能是 objectKey 或完整 URL）转换为可访问的 URL
 * 如果是 objectKey，优先使用本地缓存，否则获取 STS 凭证并生成签名 URL
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
  
  // 如果是 objectKey，使用缓存管理获取 URL（优先使用本地缓存）
  console.log('[getAvatarUrl] 检测到 objectKey，开始获取文件 URL:', avatar)
  try {
    const { getFileUrl } = await import('./ossFileCache')
    console.log('[getAvatarUrl] 调用 getFileUrl:', avatar)
    const url = await getFileUrl(avatar)
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
