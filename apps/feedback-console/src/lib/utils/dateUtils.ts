/**
 * 日期时间工具函数
 */

/**
 * 格式化日期为相对时间显示
 * @param dateString 日期字符串
 * @returns 相对时间字符串（"刚刚"、"1分钟前"、"1小时前"、"昨天"、"前天" 或具体日期）
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  // 如果时间差为负数（未来时间），返回具体日期
  if (diffMs < 0) {
    return date.toLocaleDateString('zh-CN')
  }
  
  // 计算时间差
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  // 刚刚（1分钟内）
  if (diffSeconds < 60) {
    return '刚刚'
  }
  
  // x分钟前（1分钟到59分钟）
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }
  
  // x小时前（1小时到23小时）
  if (diffHours < 24) {
    return `${diffHours}小时前`
  }
  
  // 昨天（24小时到48小时前）
  if (diffDays === 1) {
    return '昨天'
  }
  
  // 前天（48小时到72小时前）
  if (diffDays === 2) {
    return '前天'
  }
  
  // 更早的日期显示具体日期
  return date.toLocaleDateString('zh-CN')
}
