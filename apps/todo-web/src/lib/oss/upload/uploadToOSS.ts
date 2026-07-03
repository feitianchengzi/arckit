/**
 * 上传文件到 OSS（内部函数，仅供 oss/uploadApi 使用）
 * 注意：业务代码不应直接使用此函数，应使用 oss/uploadApi 中提供的业务接口
 */

import { STSCredentials, uploadApi } from '../../api/endpoints/upload'
import { loadOSSSDK, getFileExtension } from '../sdk'
import { generateObjectKey } from './generateObjectKey'
import type { OSSDirectory, UploadResult } from './types'
import { getAccessToken } from '../../utils/tokenManager'

/**
 * 刷新 STS Token 的函数
 * 用于 OSS SDK 自动刷新过期凭证
 */
async function refreshSTSToken(): Promise<{
  accessKeyId: string
  accessKeySecret: string
  stsToken: string
}> {
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
 * 上传文件到 OSS（内部函数，仅供 oss/uploadApi 使用）
 * 注意：业务代码不应直接使用此函数，应使用 oss/uploadApi 中提供的业务接口
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
    
    if (error instanceof Error) {
      const message = error.message
      const isCorsError =
        message.includes('CORS') ||
        message.includes('Access-Control-Allow-Origin') ||
        message.includes('preflight') ||
        message.includes('blocked by CORS policy')

      const isNetworkError =
        message.includes('XHR error') ||
        message.includes('network') ||
        message.includes('ERR_FAILED')

      if (isCorsError || isNetworkError) {
        console.warn('OSS 上传疑似被跨域或网络策略拦截，请检查 Bucket CORS 配置。', {
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          bucket: credentials.BucketName,
          region: credentials.Region,
          secure: credentials.Secure,
          originalMessage: message,
        })
      }
    }
    
    throw new Error('上传失败，请重试')
  }
}
