/**
 * 内容处理工具函数
 */

/**
 * 提取内容的第一行非空文本
 * 跳过开头的空格、换行等空白字符，返回第一个有内容的行
 * 
 * @param content 原始内容
 * @returns 第一行非空文本
 */
export function getFirstNonEmptyLine(content: string): string {
  if (!content) return ''
  
  // 按行分割
  const lines = content.split(/\r?\n/)
  
  // 找到第一个非空行（去除首尾空格后不为空）
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  
  // 如果所有行都是空的，返回空字符串
  return ''
}

/**
 * 判断内容是否有多行（去除首尾空白后）
 * 
 * @param content 原始内容
 * @returns 是否有多行
 */
export function hasMultipleLines(content: string): boolean {
  if (!content) return false
  
  // 去除首尾空白
  const trimmed = content.trim()
  
  // 检查是否包含换行符
  return trimmed.includes('\n') || trimmed.includes('\r')
}

/**
 * 截取第一行内容，如果超过指定长度则添加省略号
 * 
 * @param content 原始内容
 * @param maxLength 最大长度（默认不限制）
 * @returns 截取后的第一行内容
 */
export function getTruncatedFirstLine(content: string, maxLength?: number): string {
  const firstLine = getFirstNonEmptyLine(content)
  
  if (maxLength && firstLine.length > maxLength) {
    return firstLine.substring(0, maxLength) + '...'
  }
  
  return firstLine
}
