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
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @param credentials STS 临时凭证（包含 region、bucket_name、root_path 等）
 * @param onProgress 上传进度回调 (0-1)
 * @param callbackUrl 可选：OSS callback URL，上传成功后OSS会向此URL发送POST请求
 * @param callbackBody 可选：OSS callback body，传递给callback的数据
 * @returns 上传结果，包含 objectKey 和可选的签名URL
 */
export interface UploadResult {
  objectKey: string
  url?: string // 可选的签名URL，如果需要立即访问
}

export async function uploadToOSS(
  file: File | Blob,
  credentials: STSCredentials,
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
    // objectKey = root_path + avatars/ + 文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = getFileExtension(file.name || 'image.jpg')
    const fileName = `${timestamp}_${randomStr}.${fileExt}`
    
    // 使用 joinPath 正确拼接路径
    const objectKey = joinPath(credentials.RootPath, `avatars/${fileName}`)
    
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
      putOptions.callback = {
        url: callbackUrl,
        body: callbackBody || `object=${objectKey}&bucket=${credentials.BucketName}`,
        contentType: 'application/x-www-form-urlencoded',
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
 * 上传头像到 OSS 并自动更新用户头像
 * 支持两种方式：
 * 1. 使用 OSS callback（推荐）：上传成功后OSS自动调用后端接口更新头像
 * 2. 直接更新：上传成功后前端调用API更新头像
 * 
 * @param file 要上传的头像文件
 * @param credentials STS 临时凭证
 * @param onProgress 上传进度回调 (0-1)
 * @param useCallback 是否使用 OSS callback（默认 false，使用直接更新方式）
 * @param callbackUrl 可选：OSS callback URL（如果 useCallback 为 true）
 * @returns 上传结果，包含 objectKey 和可选的签名URL
 */
export async function uploadAvatarAndUpdate(
  file: File | Blob,
  credentials: STSCredentials,
  onProgress?: (progress: number) => void,
  useCallback: boolean = false,
  callbackUrl?: string
): Promise<UploadResult> {
  try {
    // 1. 上传文件到 OSS
    let uploadResult: UploadResult
    
    if (useCallback && callbackUrl) {
      // 使用 OSS callback 方式
      // callback body 包含 objectKey，后端可以根据此更新用户头像
      const callbackBody = `object=\${object}&bucket=\${bucket}`
      uploadResult = await uploadToOSS(file, credentials, onProgress, callbackUrl, callbackBody)
      console.log('✅ 头像上传成功（使用 callback）:', uploadResult.objectKey)
    } else {
      // 直接上传方式
      uploadResult = await uploadToOSS(file, credentials, onProgress)
      
      // 2. 上传成功后，直接调用API更新用户头像
      const { todoUserApi } = await import('../api/endpoints/auth')
      await todoUserApi.updateUser(0, { avatar: uploadResult.objectKey })
      
      console.log('✅ 头像上传并更新成功:', uploadResult.objectKey)
    }
    
    return uploadResult
  } catch (error) {
    console.error('❌ 头像上传失败:', error)
    throw error
  }
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
  try {
    const OSS = await loadOSSSDK()
    
    // 创建 OSS 客户端
    // Region 直接使用接口返回值
    const client = new OSS({
      region: credentials.Region, // 直接使用，例如: "oss-cn-beijing"
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: credentials.Secure,
      authorizationV4: credentials.AuthorizationV4,
    })
    
    // 生成签名 URL
    const signedUrl = client.signatureUrl(objectKey, {
      expires,
    })
    
    return signedUrl
  } catch (error) {
    console.error('生成签名 URL 失败:', error)
    throw error
  }
}
