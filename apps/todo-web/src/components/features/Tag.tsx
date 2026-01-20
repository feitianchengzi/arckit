/**
 * Tag - 标签显示组件
 * 显示为椭圆胶囊样式，带背景色
 */

import clsx from 'clsx'
import { argbToCssColor } from '@/lib/utils/tagParser'
import type { ParsedTag } from '@/lib/utils/tagParser'

export interface TagProps {
  tag: ParsedTag
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function Tag({ tag, size = 'md', className, onClick }: TagProps) {
  const bgColor = argbToCssColor(tag.color)
  
  // 根据背景色计算文字颜色（浅色背景用深色字，深色背景用浅色字）
  const textColor = getContrastColor(bgColor)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
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
      {tag.name}
    </span>
  )
}

/**
 * 根据背景色计算对比度高的文字颜色
 */
function getContrastColor(bgColor: string): string {
  // 移除#号
  const hex = bgColor.replace('#', '')
  
  // 转换为RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // 计算亮度（使用相对亮度公式）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // 如果背景较亮，返回深色文字；如果背景较暗，返回浅色文字
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

