/**
 * OSS 上传类型定义
 */

/**
 * OSS 文件目录类型
 */
export type OSSDirectory = 'avatars' | 'attachments' | 'documents' | string

/**
 * 上传结果接口
 */
export interface UploadResult {
  objectKey: string
  url?: string // 可选的签名URL，如果需要立即访问
}

