/**
 * 获取带签名的访问 URL（如果需要临时访问链接）
 */

import { STSCredentials } from '../../api/endpoints/upload'
import { loadOSSSDK } from '../sdk'

/**
 * 获取带签名的访问 URL（如果需要临时访问链接）
 * @param objectKey OSS 对象 Key（例如：workshop/avatars/xxx.jpg）
 * @param credentials STS 临时凭证（包含 region、bucket_name 等）
 * @param expires 过期时间（秒），默认 3600
 * @param forceDownload 是否强制下载（设置 Content-Disposition 为 attachment），默认 false
 */
export async function getSignedUrl(
  objectKey: string,
  credentials: STSCredentials,
  expires: number = 3600,
  forceDownload: boolean = false
): Promise<string> {
  const normalizedObjectKey = objectKey.trim().replace(/^\/+/, '')
  if (!normalizedObjectKey) {
    throw new Error('OSS 对象 Key 为空')
  }

  console.log('[getSignedUrl] 开始生成签名 URL:', {
    objectKey: normalizedObjectKey,
    expires,
    region: credentials.Region,
    bucket: credentials.BucketName,
    forceDownload
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
    const fileName = normalizedObjectKey.split('/').pop() || 'download'
    
    const signedUrl = client.signatureUrl(normalizedObjectKey, {
      expires,
      response: {
        'content-disposition': forceDownload ? `attachment; filename="${encodeURIComponent(fileName)}"` : undefined,
      },
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
