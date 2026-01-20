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
 * 输入: "[Bug](#ffff0000),[Add](#ffabc101)" 或 "[Bug](#ff0000)"
 * 输出: [{ name: "Bug", color: "ffff0000" }, { name: "Add", color: "ffabc101" }]
 * 
 * 支持两种颜色格式：
 * - 8位ARGB格式（如：ffff0000）
 * - 6位RGB格式（如：ff0000）会自动补全为8位ARGB（ff前缀）
 */
export function parseTags(tagsString: string | null | undefined): ParsedTag[] {
  if (!tagsString || !tagsString.trim()) {
    return []
  }

  const tags: ParsedTag[] = []
  // 修改正则，支持6位或8位颜色值
  const tagPattern = /\[([^\]]+)\]\(#([a-fA-F0-9]{6,8})\)/g
  let match

  while ((match = tagPattern.exec(tagsString)) !== null) {
    const name = match[1]
    let color = match[2]
    
    // 如果是6位RGB格式，自动补全为8位ARGB格式（添加ff作为alpha通道）
    if (color.length === 6) {
      color = 'ff' + color
    }
    
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
 * 输入: "ffff0000" (ARGB格式) 或 "ff0000" (RGB格式)
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

