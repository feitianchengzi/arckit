/**
 * 验证工具函数
 */

import { CodeType } from '@/types/auth'

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 智能识别输入类型（邮箱或手机号）
 * @returns 'email' | 'sms' | null
 */
export function detectInputType(input: string): CodeType | null {
  const trimmed = input.trim()
  
  if (isValidEmail(trimmed)) {
    return 'email'
  }
  
  if (isValidPhone(trimmed)) {
    return 'sms'
  }
  
  return null
}

/**
 * 验证用户名格式
 * 规则：2-20个字符，支持中英文、数字、下划线
 */
export function isValidUsername(username: string): boolean {
  if (username.length < 2 || username.length > 20) {
    return false
  }
  const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
  return usernameRegex.test(username)
}

/**
 * 验证验证码格式
 * 规则：6位数字
 */
export function isValidVerificationCode(code: string): boolean {
  const codeRegex = /^\d{6}$/
  return codeRegex.test(code)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

/**
 * 验证图片文件
 */
export function validateImageFile(
  file: File,
  maxSizeKB: number = 200
): { valid: boolean; error?: string } {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、GIF 格式',
    }
  }

  // 验证文件大小
  const maxSizeBytes = maxSizeKB * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小不能超过 ${maxSizeKB}KB`,
    }
  }

  return { valid: true }
}

