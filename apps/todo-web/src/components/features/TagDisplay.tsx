/**
 * TagDisplay - 标签显示组件
 * 用于显示单个标签（带颜色）
 * 输入：标签name字段或标签对象
 * 处理：解析name字段，提取displayName和color用于显示
 */

import clsx from 'clsx'
import { parseTagName, argbToCssColor, getContrastColor, type ProjectTag } from '@/lib/utils/tagUtils'

export interface TagDisplayProps {
  /** 标签对象（推荐使用） */
  tag?: ProjectTag
  /** 或者直接传入标签name字段（格式: "[Bug](#ffff0000)"） */
  tagName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function TagDisplay({ 
  tag, 
  tagName, 
  size = 'md', 
  className, 
  onClick 
}: TagDisplayProps) {
  // 优先使用tag对象，如果没有则解析tagName
  let displayName: string
  let color: string
  
  if (tag) {
    displayName = tag.displayName
    color = tag.color
  } else if (tagName) {
    const parsed = parseTagName(tagName)
    displayName = parsed.displayName
    color = parsed.color
  } else {
    // 如果没有提供任何信息，不渲染
    return null
  }
  
  // 转换为CSS颜色（用于显示）
  const bgColor = argbToCssColor(color)
  const textColor = getContrastColor(bgColor)
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 h-4',
    md: 'text-[10px] px-2 py-0 h-4',
    lg: 'text-xs px-2.5 py-0 h-5',
  }
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded font-medium leading-none',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onClick={onClick}
    >
      {displayName}
    </span>
  )
}

