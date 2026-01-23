/**
 * OSS 上传业务接口
 * 提供业务级别的上传函数，避免业务调用出错导致文件上传错乱
 * 
 * 使用方式：
 * - 上传头像：使用 uploadAvatarToOSS()
 * - 上传附件：使用 uploadAttachmentToOSS()
 * - 上传文档：使用 uploadDocumentToOSS()
 * 
 * 注意：不要直接使用 oss/upload 中的 uploadToOSS，应使用本文件提供的业务接口
 */

import type { STSCredentials } from '../api/endpoints/upload'
import type { UploadResult } from './upload'
import { uploadToOSS } from './upload'

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
export async function uploadAvatarToOSS(
  file: File | Blob,
  credentials: STSCredentials,
  onProgress?: (progress: number) => void,
  useCallback: boolean = false,
  callbackUrl?: string
): Promise<UploadResult> {
  try {
    // 1. 上传文件到 OSS（使用 avatars 目录）
    let uploadResult: UploadResult
    
    if (useCallback && callbackUrl) {
      // 使用 OSS callback 方式
      // callback body 包含 objectKey，后端可以根据此更新用户头像
      const callbackBody = `object=\${object}&bucket=\${bucket}`
      uploadResult = await uploadToOSS(file, credentials, 'avatars', onProgress, callbackUrl, callbackBody)
      console.log('✅ 头像上传成功（使用 callback）:', uploadResult.objectKey)
    } else {
      // 直接上传方式
      uploadResult = await uploadToOSS(file, credentials, 'avatars', onProgress)
      
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
 * 上传附件到 OSS
 * 
 * @param file 要上传的附件文件
 * @param credentials STS 临时凭证
 * @param onProgress 上传进度回调 (0-1)
 * @param callbackUrl 可选：OSS callback URL
 * @param callbackBody 可选：OSS callback body
 * @returns 上传结果，包含 objectKey 和可选的签名URL
 */
export async function uploadAttachmentToOSS(
  file: File | Blob,
  credentials: STSCredentials,
  onProgress?: (progress: number) => void,
  callbackUrl?: string,
  callbackBody?: string
): Promise<UploadResult> {
  try {
    const uploadResult = await uploadToOSS(file, credentials, 'attachments', onProgress, callbackUrl, callbackBody)
    console.log('✅ 附件上传成功:', uploadResult.objectKey)
    return uploadResult
  } catch (error) {
    console.error('❌ 附件上传失败:', error)
    throw error
  }
}

/**
 * 上传文档到 OSS
 * 
 * @param file 要上传的文档文件
 * @param credentials STS 临时凭证
 * @param onProgress 上传进度回调 (0-1)
 * @param callbackUrl 可选：OSS callback URL
 * @param callbackBody 可选：OSS callback body
 * @returns 上传结果，包含 objectKey 和可选的签名URL
 */
export async function uploadDocumentToOSS(
  file: File | Blob,
  credentials: STSCredentials,
  onProgress?: (progress: number) => void,
  callbackUrl?: string,
  callbackBody?: string
): Promise<UploadResult> {
  try {
    const uploadResult = await uploadToOSS(file, credentials, 'documents', onProgress, callbackUrl, callbackBody)
    console.log('✅ 文档上传成功:', uploadResult.objectKey)
    return uploadResult
  } catch (error) {
    console.error('❌ 文档上传失败:', error)
    throw error
  }
}

