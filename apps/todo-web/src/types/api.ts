/**
 * 统一 API 响应类型定义
 * 
 * 根据后端新的响应格式规范定义：
 * 
 * 成功响应：
 * {
 *   "code": "OK",
 *   "data": {...} | [...],
 *   "meta": { ... }  // 可选，仅分页时存在
 * }
 * 
 * 错误响应：
 * {
 *   "code": "ERROR_CODE",
 *   "error": {
 *     "message": "Error message",
 *     "details": null | {...}
 *   }
 * }
 */

// ==================== 响应码 ====================

/** 统一 API 响应码 */
export type ApiCode = 
  // 成功
  | 'OK'
  
  // 认证相关
  | 'UNAUTHORIZED'           // 未授权
  | 'TOKEN_EXPIRED'          // Token过期
  | 'INVALID_TOKEN'          // 无效Token
  | 'AUTHENTICATION_FAILED'  // 认证失败
  
  // 资源相关
  | 'NOT_FOUND'              // 资源不存在
  | 'USER_NOT_FOUND'         // 用户不存在
  | 'PROJECT_NOT_FOUND'      // 项目不存在
  | 'TASK_NOT_FOUND'         // 任务不存在
  | 'MEMBER_NOT_FOUND'       // 成员不存在
  
  // 权限相关
  | 'FORBIDDEN'              // 无权限
  | 'ACCESS_DENIED'          // 访问被拒绝
  | 'INSUFFICIENT_PERMISSION' // 权限不足
  
  // 业务逻辑
  | 'INVALID_REQUEST'        // 无效请求
  | 'INVALID_PARAMETER'      // 无效参数
  | 'VALIDATION_FAILED'      // 验证失败
  | 'ALREADY_EXISTS'         // 资源已存在
  | 'CONFLICT'               // 冲突
  | 'OPERATION_FAILED'       // 操作失败
  
  // 验证码相关
  | 'VERIFICATION_CODE_EXPIRED'   // 验证码过期
  | 'VERIFICATION_CODE_INVALID'   // 验证码无效
  | 'VERIFICATION_CODE_SEND_FAILED' // 验证码发送失败
  
  // 系统错误
  | 'INTERNAL_ERROR'         // 内部错误
  | 'SERVICE_UNAVAILABLE'    // 服务不可用
  | 'DATABASE_ERROR'         // 数据库错误
  | 'NETWORK_ERROR'          // 网络错误
  | 'TIMEOUT'                // 超时
  | 'UNKNOWN_ERROR'          // 未知错误
  
  // 允许其他自定义错误码
  | string

// ==================== 错误详情 ====================

/** API 错误详情 */
export interface ApiErrorDetail {
  /** 错误消息 */
  message: string
  /** 
   * 错误详细信息（可选）
   * 
   * 当错误需要补充额外信息时使用，例如：
   * - 验证错误的字段详情
   * - 业务规则冲突的具体原因
   * - 调试信息
   * 
   * 通常情况下为 null，特殊情况下包含具体内容
   * 
   * @example
   * // 验证错误
   * {
   *   "message": "Validation failed",
   *   "details": {
   *     "fields": {
   *       "email": "Invalid email format",
   *       "phone": "Phone number required"
   *     }
   *   }
   * }
   * 
   * @example
   * // 业务规则冲突
   * {
   *   "message": "Cannot delete project",
   *   "details": {
   *     "reason": "Project has active tasks",
   *     "task_count": 5
   *   }
   * }
   */
  details?: any
}

// ==================== 分页元数据 ====================

/** 分页元数据 */
export interface ApiMeta {
  /** 当前页码（从1开始） */
  page: number
  /** 每页数量 */
  page_size: number
  /** 总记录数 */
  total: number
}

// ==================== 响应类型 ====================

/** 统一成功响应（无分页） */
export interface ApiSuccessResponse<T> {
  /** 响应码，成功时为 OK */
  code: 'OK'
  /** 响应数据 */
  data: T
  /** 不存在 meta 字段 */
  meta?: never
  /** 不存在 error 字段 */
  error?: never
}

/** 统一成功响应（带分页） */
export interface ApiPaginatedSuccessResponse<T> {
  /** 响应码，成功时为 OK */
  code: 'OK'
  /** 响应数据（数组） */
  data: T[]
  /** 分页元数据 */
  meta: ApiMeta
  /** 不存在 error 字段 */
  error?: never
}

/** 统一错误响应 */
export interface ApiErrorResponse {
  /** 错误码，非 OK */
  code: Exclude<ApiCode, 'OK'>
  /** 不存在 data 字段 */
  data?: never
  /** 不存在 meta 字段 */
  meta?: never
  /** 错误详情 */
  error: ApiErrorDetail
}

/** 统一 API 响应（联合类型） */
export type ApiResponse<T> = 
  | ApiSuccessResponse<T>
  | ApiErrorResponse

/** 统一 API 分页响应（联合类型） */
export type ApiPaginatedResponse<T> = 
  | ApiPaginatedSuccessResponse<T>
  | ApiErrorResponse

// ==================== 工具类型 ====================

/**
 * 从 API 响应中提取数据类型
 * 
 * @example
 * type UserData = ExtractApiData<ApiResponse<User>> // User
 */
export type ExtractApiData<T> = T extends ApiSuccessResponse<infer D>
  ? D
  : T extends ApiPaginatedSuccessResponse<infer D>
  ? D[]
  : never

/**
 * 从 API 响应中提取分页元数据类型
 * 
 * @example
 * type MetaData = ExtractApiMeta<ApiPaginatedResponse<User>> // ApiMeta
 */
export type ExtractApiMeta<T> = T extends ApiPaginatedSuccessResponse<any>
  ? ApiMeta
  : never

// ==================== 兼容旧格式 ====================

/**
 * 旧格式响应（用于兼容）
 * @deprecated 请使用新的 ApiResponse<T> 类型
 */
export interface LegacyApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

/**
 * 旧格式分页响应（用于兼容）
 * @deprecated 请使用新的 ApiPaginatedResponse<T> 类型
 */
export interface LegacyPaginatedResponse<T> {
  data: T[]
  total: number
  page?: number
  page_size?: number
}

