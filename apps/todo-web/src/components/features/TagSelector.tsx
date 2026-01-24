/**
 * TagSelector - 标签选择器组件（下拉菜单+checkbox）
 * 用于在待办中选择/取消选择标签
 * 数据源：项目标签数组 + 待办tags字段
 * 操作：更新本地选中状态，点击保存后调用任务更新API
 * 
 * 交互设计：
 * - 下拉菜单+checkbox UI
 * - 延迟保存：选择/取消选择操作不立即调用API
 * - 保存按钮：提供明确的"保存"按钮，用户确认后再更新
 * - 避免频繁请求：减少不必要的API调用，提升用户体验
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, ConfirmDialog } from '@/components/ui'
import { TagDisplay } from './TagDisplay'
import { TagCreator } from './TagCreator'
import { TagEditor } from './TagEditor'
import { useTagStore } from '@/store/tagStore'
import { tagsApi } from '@/lib/api/endpoints/tags'
import { parseTaskTags, buildTaskTags, buildTagName, type ProjectTag } from '@/lib/utils/tagUtils'
import { PlusIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@/components/ui'
import clsx from 'clsx'

export interface TagSelectorProps {
  /** 项目ID */
  projectId: string
  /** 当前任务的tags字段（标签ID字符串，如 "1,2,3"） */
  currentTags?: string | null
  /** 标签变化回调（保存时调用） */
  onTagsChange: (tagsString: string) => void | Promise<void>
  className?: string
  /** 是否显示创建新标签按钮 */
  showCreateButton?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

export function TagSelector({
  projectId,
  currentTags,
  onTagsChange,
  className,
  showCreateButton = true,
  size = 'md',
}: TagSelectorProps) {
  const queryClient = useQueryClient()
  const { 
    projectTagsMap, 
    loadProjectTags, 
    addTag,
    updateTag,
    deleteTag,
    getProjectTags 
  } = useTagStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  
  // 加载项目标签
  useEffect(() => {
    if (projectId && !projectTagsMap[projectId]) {
      loadProjectTags(projectId).catch(console.error)
    }
  }, [projectId, projectTagsMap, loadProjectTags])
  
  // 初始化选中状态（从currentTags解析）
  useEffect(() => {
    const tagIds = parseTaskTags(currentTags)
    setSelectedTagIds(tagIds)
  }, [currentTags])
  
  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const viewportWidth = window.innerWidth
          const dropdownHeight = 384 // max-h-96 = 384px
          const dropdownWidth = 320 // w-80 = 320px
          
          // 计算垂直位置：优先向下，如果空间不够则向上
          let top = rect.bottom + 4
          if (top + dropdownHeight > viewportHeight) {
            top = rect.top - dropdownHeight - 4
            if (top < 8) {
              // 如果向上也不够，则向下但限制高度
              top = rect.bottom + 4
            }
          }
          
          // 计算水平位置：优先左对齐
          let left = rect.left
          if (left + dropdownWidth > viewportWidth) {
            left = viewportWidth - dropdownWidth - 8
          }
          if (left < 8) {
            left = 8
          }
          
          setDropdownPosition({ top, left })
        }
      }
      
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    } else {
      setDropdownPosition(null)
    }
  }, [isOpen])
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])
  
  const projectTags = getProjectTags(projectId)
  
  // 已选中的标签
  const selectedTags = projectTags.filter(tag => selectedTagIds.includes(tag.id))
  
  // 切换标签选中状态（本地状态，不立即调用API）
  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        // 取消选择
        return prev.filter(id => id !== tagId)
      } else {
        // 选择
        return [...prev, tagId]
      }
    })
  }
  
  // 保存标签选择（调用API）
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const tagsString = buildTaskTags(selectedTagIds)
      await onTagsChange(tagsString)
      setIsOpen(false)
    } catch (error) {
      console.error('保存标签失败:', error)
      // 恢复之前的状态
      const tagIds = parseTaskTags(currentTags)
      setSelectedTagIds(tagIds)
    } finally {
      setIsSaving(false)
    }
  }
  
  // 创建新标签
  const handleCreateTag = async (displayName: string, color: string) => {
    try {
      const name = buildTagName(displayName, color)
      
      const newTag = await tagsApi.create(projectId, {
        project_id: parseInt(projectId, 10),
        name,
      })
      
      // 更新状态
      addTag(projectId, newTag)
      
      // 自动选中新创建的标签
      setSelectedTagIds(prev => [...prev, newTag.id])
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      
      setShowCreator(false)
    } catch (error: any) {
      console.error('创建标签失败:', error)
      throw error
    }
  }
  
  // 更新标签（即时操作）
  const handleUpdateTag = async (tagId: number, displayName: string, color: string) => {
    try {
      const name = buildTagName(displayName, color)
      
      const updatedTag = await tagsApi.update(tagId.toString(), { name })
      
      // 更新状态
      updateTag(projectId, tagId, updatedTag)
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      
      setEditingTagId(null)
    } catch (error: any) {
      console.error('更新标签失败:', error)
      throw error
    }
  }
  
  // 删除标签（即时操作，带确认）
  const handleDeleteTag = async (tagId: number) => {
    try {
      await tagsApi.delete(tagId.toString())
      
      // 更新状态
      deleteTag(projectId, tagId)
      
      // 如果该标签已选中，从选中列表中移除
      setSelectedTagIds(prev => prev.filter(id => id !== tagId))
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      
      setDeletingTagId(null)
    } catch (error: any) {
      console.error('删除标签失败:', error)
      alert('删除标签失败: ' + (error.message || '未知错误'))
      setDeletingTagId(null)
    }
  }
  
  // 检查是否有未保存的更改
  const hasUnsavedChanges = () => {
    const currentTagIds = parseTaskTags(currentTags)
    return JSON.stringify(currentTagIds.sort()) !== JSON.stringify(selectedTagIds.sort())
  }
  
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-xs h-5',
    md: 'px-1.5 py-1 text-xs h-5',
    lg: 'px-2 py-1.5 text-sm h-6',
  }
  
  // 按钮显示文本
  const getButtonText = () => {
    if (selectedTags.length === 0) {
      return '选择标签'
    }
    if (selectedTags.length === 1) {
      return selectedTags[0].displayName
    }
    return `已选 ${selectedTags.length} 个标签`
  }
  
  return (
    <>
      <div className={clsx('relative', className)}>
        {/* 选择按钮 */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'inline-flex items-center gap-1.5 font-medium rounded transition-all',
            'border border-gray-300 bg-white',
            'hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
            sizeClasses[size],
            hasUnsavedChanges() && 'border-orange-400 bg-orange-50'
          )}
        >
        {/* 显示已选中的标签（最多显示2个） */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.slice(0, 2).map(tag => (
                <TagDisplay key={tag.id} tag={tag} size="sm" />
              ))}
              {selectedTags.length > 2 && (
                <span className="text-xs text-gray-500">+{selectedTags.length - 2}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500">{getButtonText()}</span>
          )}
        </div>
        <ChevronDownIcon
          className={clsx(
            'transition-transform flex-shrink-0 text-gray-400',
            {
              'w-3 h-3': size === 'sm',
              'w-4 h-4': size === 'md',
              'w-5 h-5': size === 'lg',
              'transform rotate-180': isOpen,
            }
          )}
        />
        </button>
      </div>
      
      {/* 下拉菜单 - 使用 Portal 渲染到 body */}
      {isOpen && dropdownPosition && createPortal(
        <>
          {/* 遮罩层，点击关闭 */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          {/* 下拉菜单 */}
          <div
            ref={dropdownRef}
            className={clsx(
              'fixed z-[70] w-80 bg-white rounded-lg shadow-lg border border-gray-200',
              'flex flex-col max-h-96'
            )}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
          {/* 标签列表区域（可滚动） */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {projectTags.length > 0 ? (
              <div className="py-1">
                {projectTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  const isEditing = editingTagId === tag.id
                  
                  return (
                    <div
                      key={tag.id}
                      className={clsx(
                        'px-3 py-2',
                        'hover:bg-gray-50 transition-colors',
                        isEditing && 'bg-gray-50'
                      )}
                    >
                      {isEditing ? (
                        <TagEditor
                          currentName={tag.displayName}
                          currentColor={tag.color}
                          onSave={(displayName, color) => handleUpdateTag(tag.id, displayName, color)}
                          onCancel={() => setEditingTagId(null)}
                          existingTags={projectTags}
                          currentTagId={tag.id}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTagToggle(tag.id)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <TagDisplay tag={tag} size="sm" />
                          </label>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTagId(tag.id)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="编辑标签"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingTagId(tag.id)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="删除标签"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                暂无标签
              </div>
            )}
          </div>
          
          {/* 底部操作区域（固定，不滚动） */}
          <div className="flex-shrink-0 border-t border-gray-200">
            {/* 创建新标签 */}
            {showCreateButton && (
              <>
                {!showCreator ? (
                  <div className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setShowCreator(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      创建新标签
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white">
                    <TagCreator
                      onSave={handleCreateTag}
                      onCancel={() => setShowCreator(false)}
                      existingTags={projectTags}
                    />
                  </div>
                )}
              </>
            )}
            
            {/* 保存按钮（仅在有待保存更改时显示，且不在创建标签模式下） */}
            {hasUnsavedChanges() && !showCreator && (
              <div className="px-3 py-2 bg-white border-t border-gray-200">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={isSaving}
                  className="w-full"
                >
                  保存更改
                </Button>
              </div>
            )}
          </div>
          </div>
        </>,
        document.body
      )}
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deletingTagId !== null}
        title="删除标签"
        message={`确定要删除标签"${projectTags.find(t => t.id === deletingTagId)?.displayName || ''}"吗？删除后，已使用该标签的待办仍会保留标签ID，但标签将不再显示。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => {
          if (deletingTagId !== null) {
            handleDeleteTag(deletingTagId)
          }
        }}
        onCancel={() => setDeletingTagId(null)}
      />
    </>
  )
}

