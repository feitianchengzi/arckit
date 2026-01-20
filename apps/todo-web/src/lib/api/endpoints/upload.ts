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
}

/** 获取 STS Token 响应 */
export interface GetSTSTokenResponse {
  AccessKeyId: string
  AccessKeySecret: string
  SecurityToken: string
  Expiration: string
}

export const uploadApi = {
  /**
   * 获取 STS 临时凭证
   * POST /{service}/v1/user/upload/sts-token
   * 
   * 用于上传文件到 OSS，返回临时凭证
   */
  getSTSToken: async (): Promise<STSCredentials> => {
    try {
      const response = await apiClient.post('/user/upload/sts-token', {})
      
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: {...}}
      const responseData = handleResponse<GetSTSTokenResponse>(response)
      
      return {
        AccessKeyId: responseData.AccessKeyId,
        AccessKeySecret: responseData.AccessKeySecret,
        SecurityToken: responseData.SecurityToken,
        Expiration: responseData.Expiration,
      }
    } catch (error: any) {
      console.error('❌ 获取 STS Token 失败')
      console.error('请求 URL:', '/user/upload/sts-token')
      console.error('响应状态:', error.response?.status)
      console.error('错误信息:', error.response?.data || error.message)
      throw error
    }
  },
}
