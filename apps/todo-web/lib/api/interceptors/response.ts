/**
 * 统一响应处理拦截器
 * 
 * 功能：
 * 1. 自动解析 API 响应格式
 * 2. 统一错误处理
 * 3. 兼容旧格式响应
 */

import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  ApiPaginatedSuccessResponse,
  ApiErrorResponse,
  ApiMeta,
  LegacyApiResponse,
  LegacyPaginatedResponse,
} from '@/types/api'

// ==================== 响应处理函数 ====================

/**
 * 处理普通响应（无分页）
 * 
 * @param response Axios 响应对象
 * @returns 解析后的数据
 * @throws {ApiError} 如果响应包含错误
 * 
 * @example
 * const project = await handleResponse<Project>(response)
 */
export function handleResponse<T>(response: AxiosResponse): T {
  const data = response.data as ApiResponse<T>
  
  // 成功响应
  if (data.code === 'OK') {
    return (data as ApiSuccessResponse<T>).data
  }
  
  // 错误响应
  const errorResponse = data as ApiErrorResponse
  throw new ApiError(
    errorResponse.error.message,
    errorResponse.code,
    errorResponse.error.details,
    response.status
  )
}

/**
 * 处理分页响应
 * 
 * @param response Axios 响应对象
 * @returns 包含数据和分页信息的对象
 * @throws {ApiError} 如果响应包含错误
 * 
 * @example
 * const { data, meta } = await handlePaginatedResponse<Task>(response)
 */
export function handlePaginatedResponse<T>(
  response: AxiosResponse
): { data: T[]; meta: ApiMeta } {
  const result = response.data as ApiPaginatedResponse<T>
  
  // 成功响应
  if (result.code === 'OK') {
    const successResponse = result as ApiPaginatedSuccessResponse<T>
    return {
      data: successResponse.data,
      meta: successResponse.meta,
    }
  }
  
  // 错误响应
  const errorResponse = result as ApiErrorResponse
  throw new ApiError(
    errorResponse.error.message,
    errorResponse.code,
    errorResponse.error.details,
    response.status
  )
}

// ==================== API 错误类 ====================

/**
 * 统一 API 错误类
 * 
 * 封装了所有 API 错误信息，提供便捷的错误判断方法
 */
export class ApiError extends Error {
  /** 错误名称 */
  public readonly name = 'ApiError'

  constructor(
    /** 错误消息 */
    message: string,
    /** 错误码 */
    public readonly code: string,
    /** 错误详情 */
    public readonly details?: any,
    /** HTTP 状态码 */
    public readonly status?: number
  ) {
    super(message)
    
    // 确保 instanceof 正常工作
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  /**
   * 判断是否为特定错误码
   * 
   * @example
   * if (error.is('USER_NOT_FOUND')) {
   *   console.log('用户不存在')
   * }
   */
  is(code: string): boolean {
    return this.code === code
  }

  /**
   * 判断是否为认证错误
   * 
   * @example
   * if (error.isAuthError()) {
   *   router.push('/login')
   * }
   */
  isAuthError(): boolean {
    return [
      'UNAUTHORIZED',
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'AUTHENTICATION_FAILED',
    ].includes(this.code)
  }

  /**
   * 判断是否为权限错误
   * 
   * @example
   * if (error.isPermissionError()) {
   *   toast.error('您没有权限执行此操作')
   * }
   */
  isPermissionError(): boolean {
    return [
      'FORBIDDEN',
      'ACCESS_DENIED',
      'INSUFFICIENT_PERMISSION',
    ].includes(this.code)
  }

  /**
   * 判断是否为资源不存在错误
   * 
   * @example
   * if (error.isNotFoundError()) {
   *   router.push('/404')
   * }
   */
  isNotFoundError(): boolean {
    return this.code === 'NOT_FOUND' || this.code.endsWith('_NOT_FOUND')
  }

  /**
   * 判断是否为验证失败错误
   * 
   * @example
   * if (error.isValidationError()) {
   *   // 显示表单验证错误
   * }
   */
  isValidationError(): boolean {
    return [
      'VALIDATION_FAILED',
      'INVALID_REQUEST',
      'INVALID_PARAMETER',
    ].includes(this.code)
  }

  /**
   * 判断是否为网络错误
   * 
   * @example
   * if (error.isNetworkError()) {
   *   toast.error('网络连接失败，请检查网络')
   * }
   */
  isNetworkError(): boolean {
    return [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
    ].includes(this.code)
  }

  /**
   * 判断是否为服务器错误
   * 
   * @example
   * if (error.isServerError()) {
   *   toast.error('服务器错误，请稍后重试')
   * }
   */
  isServerError(): boolean {
    return [
      'INTERNAL_ERROR',
      'DATABASE_ERROR',
      'SERVICE_UNAVAILABLE',
    ].includes(this.code)
  }

  /**
   * 获取用户友好的错误消息
   * 
   * @example
   * toast.error(error.getUserMessage())
   */
  getUserMessage(): string {
    // 可以根据错误码返回更友好的消息
    const friendlyMessages: Record<string, string> = {
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'TIMEOUT': '请求超时，请稍后重试',
      'INTERNAL_ERROR': '服务器内部错误，请稍后重试',
      'SERVICE_UNAVAILABLE': '服务暂时不可用，请稍后重试',
      'UNAUTHORIZED': '请先登录',
      'TOKEN_EXPIRED': '登录已过期，请重新登录',
      'FORBIDDEN': '您没有权限执行此操作',
      'NOT_FOUND': '请求的资源不存在',
      'VALIDATION_FAILED': '输入数据验证失败',
    }

    return friendlyMessages[this.code] || this.message
  }

  /**
   * 转换为普通对象（用于日志记录）
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      status: this.status,
    }
  }
}

// ==================== 兼容性处理 ====================

/**
 * 检测并转换旧格式响应为新格式
 * 
 * @param response Axios 响应对象
 * @returns 转换后的响应对象
 */
export function normalizeResponse(response: AxiosResponse): AxiosResponse {
  const data = response.data

  // 已经是新格式
  if (data && typeof data === 'object' && 'code' in data) {
    return response
  }

  // 兼容旧格式：{ success: boolean, data: ..., message?: string }
  if (data && 'success' in data) {
    const legacyData = data as LegacyApiResponse<any>
    
    console.warn('⚠️ 检测到旧格式响应，建议后端迁移:', response.config.url)
    
    if (legacyData.success) {
      // 成功响应
      response.data = {
        code: 'OK',
        data: legacyData.data || data,
      }
    } else {
      // 错误响应
      response.data = {
        code: 'UNKNOWN_ERROR',
        error: {
          message: legacyData.message || '请求失败',
          details: null,
        },
      }
    }
    
    return response
  }

  // 兼容旧分页格式：{ data: [], total: number, page?: number }
  if (data && Array.isArray(data.data) && 'total' in data) {
    const legacyData = data as LegacyPaginatedResponse<any>
    
    console.warn('⚠️ 检测到旧分页格式响应，建议后端迁移:', response.config.url)
    
    response.data = {
      code: 'OK',
      data: legacyData.data,
      meta: {
        page: legacyData.page || 1,
        page_size: legacyData.page_size || legacyData.data.length,
        total: legacyData.total,
      },
    }
    
    return response
  }

  // 兼容直接返回数据的格式（无包装）
  if (data && typeof data === 'object') {
    console.warn('⚠️ 检测到无包装的响应，建议后端迁移:', response.config.url)
    
    response.data = {
      code: 'OK',
      data: data,
    }
    
    return response
  }

  // 无法识别的格式，保持原样
  return response
}

// ==================== 工具函数 ====================

/**
 * 判断响应是否成功
 * 
 * @param response Axios 响应对象
 * @returns 是否成功
 */
export function isSuccessResponse(response: AxiosResponse): boolean {
  const data = response.data
  return data && data.code === 'OK'
}

/**
 * 判断响应是否为错误
 * 
 * @param response Axios 响应对象
 * @returns 是否为错误
 */
export function isErrorResponse(response: AxiosResponse): boolean {
  const data = response.data
  return data && data.code !== 'OK' && 'error' in data
}

/**
 * 从错误中提取 ApiError
 * 
 * @param error 任意错误对象
 * @returns ApiError 实例，如果不是 ApiError 则返回 null
 */
export function extractApiError(error: any): ApiError | null {
  if (error instanceof ApiError) {
    return error
  }
  return null
}

/**
 * 创建标准的 ApiError
 * 用于在非 API 场景下创建统一的错误对象
 * 
 * @example
 * throw createApiError('用户名不能为空', 'VALIDATION_FAILED')
 */
export function createApiError(
  message: string,
  code: string = 'UNKNOWN_ERROR',
  details?: any
): ApiError {
  return new ApiError(message, code, details)
}

