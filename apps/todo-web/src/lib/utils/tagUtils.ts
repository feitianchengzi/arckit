/**
 * 标签系统统一工具函数库
 * 根据 tag-system-design.md 规范实现
 */

/**
 * 解析后的标签信息
 */
export interface ParsedTag {
  displayName: string  // 解析后的显示名称
  color: string        // 解析后的颜色（8位ARGB格式，带#号）
}

/**
 * API返回的标签数据
 */
export interface ApiTag {
  id: number
  project_id: number
  name: string  // 格式: "[Bug](#ffff0000)"
  created_at: string
  updated_at: string
}

/**
 * 前端使用的标签数据（包含解析后的信息）
 */
export interface ProjectTag {
  id: number
  project_id: number
  name: string  // 完整格式："[Bug](#ffff0000)"
  displayName: string  // 解析后的名称："Bug"
  color: string  // 解析后的颜色："#ffff0000"
  created_at: string
  updated_at: string
}

/**
 * 解析标签name字段
 * 输入: "[Bug](#ffff0000)"
 * 输出: { displayName: "Bug", color: "#ffff0000" }
 */
export function parseTagName(name: string): ParsedTag {
  // 正则：\[([^\]]+)\]\(#([a-fA-F0-9]{8})\)
  // 匹配：[name](#8位颜色)
  const pattern = /\[([^\]]+)\]\(#([a-fA-F0-9]{8})\)/
  const match = name.match(pattern)
  
  if (!match) {
    // 如果格式不匹配，返回默认值
    console.warn(`标签名称格式不正确: ${name}`)
    return {
      displayName: name,
      color: '#ffff0000', // 默认红色
    }
  }
  
  const displayName = match[1]
  const colorHex = match[2]
  
  // 确保颜色是8位格式，并添加#号
  const normalizedColor = normalizeColorTo8Digit(colorHex)
  
  return {
    displayName,
    color: normalizedColor,
  }
}

/**
 * 组装标签name字段
 * 输入: displayName="Bug", color="#ffff0000"
 * 输出: "[Bug](#ffff0000)"
 */
export function buildTagName(displayName: string, color: string): string {
  // 确保color是8位格式
  const normalizedColor = normalizeColorTo8Digit(color)
  // 移除#号（因为name中不需要）
  const colorHex = normalizedColor.replace('#', '')
  // 组装格式：[name](#color)
  return `[${displayName}](#${colorHex})`
}

/**
 * 解析任务tags字段
 * 输入: "1,2,3" 或 null 或 ""
 * 输出: [1, 2, 3] 或 []
 */
export function parseTaskTags(tagsString: string | null | undefined): number[] {
  if (!tagsString || tagsString.trim() === '') {
    return []
  }
  // 按逗号分割，转换为数字数组
  return tagsString
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id))
}

/**
 * 组装任务tags字段
 * 输入: [1, 2, 3]
 * 输出: "1,2,3"
 */
export function buildTaskTags(tagIds: number[]): string {
  // 将标签ID数组转换为逗号分隔的字符串
  return tagIds.join(',')
}

/**
 * 颜色规范化函数
 * 将任意格式的颜色转换为8位ARGB格式（带#号）
 * 输入: "ff0000" 或 "#ff0000" 或 "ffff0000" 或 "#ffff0000"
 * 输出: "#ffff0000"
 */
export function normalizeColorTo8Digit(color: string): string {
  // 移除#号
  let hex = color.replace('#', '')
  
  // 如果是8位，添加#号返回
  if (hex.length === 8) {
    return `#${hex}`
  }
  
  // 如果是6位，添加ff前缀
  if (hex.length === 6) {
    return `#ff${hex}`
  }
  
  // 其他情况，尝试补全或返回默认值
  if (hex.length < 6) {
    // 如果长度不足6位，补0
    const padded = hex.padEnd(6, '0')
    return `#ff${padded}`
  }
  
  // 如果长度超过8位，截取前8位
  if (hex.length > 8) {
    return `#${hex.slice(0, 8)}`
  }
  
  // 默认返回红色
  return '#ffff0000'
}

/**
 * 将API返回的标签数据转换为前端使用的格式
 * 输入: ApiTag
 * 输出: ProjectTag（包含解析后的displayName和color）
 */
export function transformTagFromAPI(tag: ApiTag): ProjectTag {
  const parsed = parseTagName(tag.name)
  
  return {
    ...tag,
    displayName: parsed.displayName,
    color: parsed.color,
  }
}

/**
 * 根据标签ID查找标签信息
 */
export function findTagById(projectTags: ProjectTag[], tagId: number): ProjectTag | undefined {
  return projectTags.find(tag => tag.id === tagId)
}

/**
 * 将ARGB颜色转换为CSS颜色（用于显示）
 * 输入: "#ffff0000" (ARGB格式)
 * 输出: "#ff0000" (RGB格式，忽略alpha通道)
 */
export function argbToCssColor(argb: string): string {
  if (!argb) {
    return '#ff6b6b' // 默认红色
  }
  
  // 移除可能存在的#号
  const hex = argb.replace('#', '')
  
  // ARGB格式：前两位是alpha，后六位是RGB
  if (hex.length === 8) {
    return `#${hex.slice(2)}` // 忽略alpha通道，只取RGB
  }
  
  // RGB格式（6位），直接返回
  if (hex.length === 6) {
    return `#${hex}`
  }
  
  // 如果格式不对，尝试补全或返回默认值
  if (hex.length < 6) {
    // 如果长度不足6位，补0
    const padded = hex.padEnd(6, '0')
    return `#${padded}`
  }
  
  // 默认返回红色
  return '#ff6b6b'
}

/**
 * 根据背景色计算对比度高的文字颜色
 * 输入: "#ff0000" (CSS颜色)
 * 输出: "#ffffff" 或 "#000000"
 */
export function getContrastColor(bgColor: string): string {
  // 移除#号
  const hex = bgColor.replace('#', '')
  
  // 如果是8位ARGB格式，只取RGB部分
  const rgbHex = hex.length === 8 ? hex.slice(2) : hex
  
  // 转换为RGB
  const r = parseInt(rgbHex.substring(0, 2), 16)
  const g = parseInt(rgbHex.substring(2, 4), 16)
  const b = parseInt(rgbHex.substring(4, 6), 16)
  
  // 计算亮度（使用相对亮度公式）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // 如果背景较亮，返回深色文字；如果背景较暗，返回浅色文字
  return luminance > 0.5 ? '#000000' : '#ffffff'
}



