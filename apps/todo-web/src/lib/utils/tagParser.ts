/**
 * tagParser - 标签字符串解析工具
 * 
 * 格式说明：
 * - 标签存储在任务的tags字段中，格式为字符串："[Bug](#ffff0000),[Add](#ffabc101),..."
 * - 每个tag格式：`[名称](#颜色)`
 * - 多个tag用逗号分隔
 */

export interface ParsedTag {
  name: string
  color: string // 格式：ffff0000 (ARGB格式，不带#)
}

/**
 * 解析tags字符串
 * 输入: "[Bug](#ffff0000),[Add](#ffabc101)"
 * 输出: [{ name: "Bug", color: "ffff0000" }, { name: "Add", color: "ffabc101" }]
 */
export function parseTags(tagsString: string | null | undefined): ParsedTag[] {
  if (!tagsString || !tagsString.trim()) {
    return []
  }

  const tags: ParsedTag[] = []
  const tagPattern = /\[([^\]]+)\]\(#([a-fA-F0-9]{8})\)/g
  let match

  while ((match = tagPattern.exec(tagsString)) !== null) {
    const name = match[1]
    const color = match[2]
    tags.push({ name, color })
  }

  return tags
}

/**
 * 将ParsedTag数组转换为tags字符串
 * 输入: [{ name: "Bug", color: "ffff0000" }, { name: "Add", color: "ffabc101" }]
 * 输出: "[Bug](#ffff0000),[Add](#ffabc101)"
 */
export function stringifyTags(tags: ParsedTag[]): string {
  return tags.map(tag => `[${tag.name}](#${tag.color})`).join(',')
}

/**
 * 将ARGB颜色转换为CSS颜色
 * 输入: "ffff0000" (ARGB格式)
 * 输出: "#ff0000" (RGB格式，忽略alpha通道)
 */
export function argbToCssColor(argb: string): string {
  // ARGB格式：前两位是alpha，后六位是RGB
  // 如果alpha是ff（不透明），直接返回RGB部分
  // 如果alpha不是ff，需要处理透明度（这里简化处理，只返回RGB）
  if (argb.length === 8) {
    return `#${argb.slice(2)}` // 忽略alpha通道，只取RGB
  }
  return `#${argb}` // 如果格式不对，直接返回
}

/**
 * 将CSS颜色转换为ARGB格式
 * 输入: "#ff0000" 或 "ff0000"
 * 输出: "ffff0000" (ARGB格式，alpha默认为ff)
 */
export function cssColorToArgb(cssColor: string): string {
  // 移除#号
  const hex = cssColor.replace('#', '')
  
  // 如果是RGB格式（6位），添加alpha通道ff
  if (hex.length === 6) {
    return `ff${hex}`
  }
  
  // 如果已经是ARGB格式（8位），直接返回
  if (hex.length === 8) {
    return hex
  }
  
  // 默认返回红色（如果格式不对）
  return 'ffff0000'
}

