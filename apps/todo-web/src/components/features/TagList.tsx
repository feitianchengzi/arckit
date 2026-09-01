/**
 * TagList - 标签列表显示组件
 * 用于显示多个标签
 */

import { TagDisplay } from './TagDisplay'
import { useTagStore } from '@/store/tagStore'
import { argbToCssColor, parseTaskTags, findTagById, type ProjectTag } from '@/lib/utils/tagUtils'
import clsx from 'clsx'

export interface TagListProps {
  /** 项目ID */
  projectId: string
  /** 任务的tags字段（标签ID字符串，如 "1,2,3"） */
  tagsString?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'linear'
  maxVisible?: number
  /** 标签点击回调 */
  onTagClick?: (tag: ProjectTag) => void
  /** 是否显示删除按钮 */
  showDelete?: boolean
  /** 删除回调 */
  onDelete?: (tag: ProjectTag) => void
}

export function TagList({ 
  projectId,
  tagsString, 
  size = 'sm', 
  className, 
  variant = 'default',
  maxVisible,
  onTagClick,
  showDelete = false,
  onDelete 
}: TagListProps) {
  const projectTags = useTagStore((state) => state.getProjectTags(projectId))
  const tagIds = parseTaskTags(tagsString)
  
  // 根据标签ID查找标签信息
  const tags = tagIds
    .map(id => findTagById(projectTags, id))
    .filter((tag): tag is ProjectTag => tag !== undefined)
  
  if (variant === 'linear') {
    const visibleTags = tags.slice(0, maxVisible ?? 2)

    return (
      <span className={clsx('task-list-labels', className)} aria-label="任务标签">
        {visibleTags.map((tag) => (
          <span className="task-list-label" key={tag.id} title={tag.displayName}>
            <span className="task-list-label-dot" style={{ background: argbToCssColor(tag.color) }} />
            <span>{tag.displayName}</span>
          </span>
        ))}
      </span>
    )
  }

  if (tags.length === 0) {
    return null
  }
  
  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)}>
      {tags.map((tag) => (
        <div key={tag.id} className="relative inline-flex items-center group">
          <TagDisplay
            tag={tag}
            size={size}
            onClick={onTagClick ? () => onTagClick(tag) : undefined}
          />
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(tag)
              }}
              className={clsx(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 text-white',
                'flex items-center justify-center opacity-0 group-hover:opacity-100',
                'transition-opacity hover:bg-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
              )}
              aria-label={`删除标签 ${tag.displayName}`}
              title={`删除标签 ${tag.displayName}`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
