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
  Endpoint: string // OSS服务端点地址
  BucketName: string // OSS存储桶名称
}

/** 获取 STS Token 响应（API返回格式） */
export interface GetSTSTokenResponse {
  access_key_id: string
  access_key_secret: string
  security_token: string
  expiration: string // ISO 8601 格式的时间字符串
  endpoint: string // OSS服务端点地址
  bucket_name: string // OSS存储桶名称
}

export const uploadApi = {
  /**
   * 获取 STS 临时凭证
   * GET /workshop/v1/user/oss/credentials
   * 
   * 用于上传文件到 OSS，返回临时凭证
   * 临时凭证有效期为1小时，过期后需要重新获取
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
        Endpoint: responseData.endpoint,
        BucketName: responseData.bucket_name,
      }
    } catch (error: any) {
      console.error('❌ 获取 STS Token 失败')
      console.error('请求 URL:', '/user/oss/credentials')
      console.error('响应状态:', error.response?.status)
      console.error('错误信息:', error.response?.data || error.message)
      throw error
    }
  },
}
