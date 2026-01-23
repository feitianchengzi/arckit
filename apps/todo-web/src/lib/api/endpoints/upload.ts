/**
 * TODO 后端 API - 文件上传相关接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'

/** STS 临时凭证响应 */
export interface STSCredentials {
  AccessKeyId: string
  AccessKeySecret: string
  SecurityToken: string
  Expiration: string // ISO 8601 格式的时间字符串
  BucketName: string // OSS存储桶名称
  Region: string // OSS区域标识，格式为 oss-{region}，例如 oss-cn-beijing
  RootPath: string // OSS根目录路径，例如 /workshop
  AuthorizationV4: boolean // 是否使用V4签名，固定为 true
  Secure: boolean // 是否使用HTTPS协议，固定为 true
}

/** 获取 STS Token 响应（API返回格式） */
export interface GetSTSTokenResponse {
  access_key_id: string
  access_key_secret: string
  security_token: string
  expiration: string // ISO 8601 格式的时间字符串
  bucket_name: string // OSS存储桶名称
  region: string // OSS区域标识，格式为 oss-{region}，例如 oss-cn-beijing
  root_path: string // OSS根目录路径，例如 /workshop
  authorization_v4: boolean // 是否使用V4签名，固定为 true
  secure: boolean // 是否使用HTTPS协议，固定为 true
}

export const uploadApi = {
  /**
   * 获取 STS 临时凭证
   * GET /workshop/v1/user/oss/credentials
   * 
   * 用于上传文件到 OSS，返回临时凭证
   * 临时凭证有效期为15分钟（900秒），过期后需要重新获取
   */
  getSTSToken: async (): Promise<STSCredentials> => {
    try {
      const response = await apiClient.get('/user/oss/credentials')
      
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: {...}}
      const responseData = handleResponse<GetSTSTokenResponse>(response)
      
      // 将API返回的字段名（snake_case）映射到代码中使用的字段名（PascalCase）
      return {
        AccessKeyId: responseData.access_key_id,
        AccessKeySecret: responseData.access_key_secret,
        SecurityToken: responseData.security_token,
        Expiration: responseData.expiration,
        BucketName: responseData.bucket_name,
        Region: responseData.region,
        RootPath: responseData.root_path,
        AuthorizationV4: responseData.authorization_v4,
        Secure: responseData.secure,
      }
    } catch (error: any) {
      console.error('❌ 获取 STS Token 失败:', error.message)
      throw error
    }
  },
}
