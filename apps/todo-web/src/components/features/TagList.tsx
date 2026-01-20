/**
 * TagList - 标签列表组件
 * 用于显示多个标签
 */

import { Tag } from './Tag'
import { parseTags } from '@/lib/utils/tagParser'
import type { TagProps } from './Tag'
import { XIcon } from '@/components/ui'
import clsx from 'clsx'

export interface TagListProps {
  tagsString?: string | null
  size?: TagProps['size']
  className?: string
  onTagClick?: (tag: ReturnType<typeof parseTags>[0]) => void
  showDelete?: boolean // 是否显示删除按钮
  onDelete?: (tag: ReturnType<typeof parseTags>[0]) => void // 删除回调
}

export function TagList({ 
  tagsString, 
  size = 'sm', 
  className, 
  onTagClick,
  showDelete = false,
  onDelete 
}: TagListProps) {
  const tags = parseTags(tagsString)
  
  if (tags.length === 0) {
    return null
  }
  
  const handleDelete = (e: React.MouseEvent, tag: ReturnType<typeof parseTags>[0]) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(tag)
    }
  }
  
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className || ''}`}>
      {tags.map((tag, index) => (
        <div key={`${tag.name}-${index}`} className="relative inline-flex items-center group">
          <Tag
            tag={tag}
            size={size}
            onClick={onTagClick ? () => onTagClick(tag) : undefined}
          />
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => handleDelete(e, tag)}
              className={clsx(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 text-white',
                'flex items-center justify-center opacity-0 group-hover:opacity-100',
                'transition-opacity hover:bg-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
              )}
              aria-label={`删除标签 ${tag.name}`}
              title={`删除标签 ${tag.name}`}
            >
              <XIcon className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

