/**
 * TagManager - 项目标签管理组件
 * 用于管理项目的所有标签（创建、更新、删除）
 * 类似GitHub的标签管理界面
 * 
 * 职责：
 * - 管理项目标签（创建、更新、删除）
 * - 数据源：项目标签数组
 * - 操作：调用标签相关API，更新项目标签数组
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { TrashIcon, PencilIcon, XIcon } from '@/components/ui'
import { tagsApi } from '@/lib/api/endpoints/tags'
import { useTagStore } from '@/store/tagStore'
import { TagDisplay, TagCreator } from './'
import { buildTagName, type ProjectTag } from '@/lib/utils/tagUtils'
import clsx from 'clsx'

export interface TagManagerProps {
  /** 项目ID */
  projectId: string
  /** 关闭回调 */
  onClose: () => void
  className?: string
}

export function TagManager({ projectId, onClose, className }: TagManagerProps) {
  const queryClient = useQueryClient()
  const { 
    projectTagsMap, 
    loadProjectTags, 
    addTag, 
    updateTag, 
    deleteTag, 
    getProjectTags 
  } = useTagStore()
  
  const [showCreator, setShowCreator] = useState(false)
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  
  const projectTags = getProjectTags(projectId)
  
  // 加载项目标签
  if (!projectTagsMap[projectId]) {
    loadProjectTags(projectId).catch(console.error)
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
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      
      setShowCreator(false)
    } catch (error: any) {
      console.error('创建标签失败:', error)
      throw error
    }
  }
  
  // 开始编辑标签
  const handleStartEdit = (tag: ProjectTag) => {
    setEditingTagId(tag.id)
    setEditingName(tag.displayName)
  }
  
  // 保存编辑
  const handleSaveEdit = async (tagId: number) => {
    const tag = projectTags.find(t => t.id === tagId)
    if (!tag) return
    
    try {
      // 保持原颜色，只更新名称
      const name = buildTagName(editingName, tag.color)
      
      const updatedTag = await tagsApi.update(tagId.toString(), { name })
      
      // 更新状态
      updateTag(projectId, tagId, updatedTag)
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      
      setEditingTagId(null)
      setEditingName('')
    } catch (error: any) {
      console.error('更新标签失败:', error)
      throw error
    }
  }
  
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditingName('')
  }
  
  // 删除标签
  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('确定要删除这个标签吗？删除后，已使用该标签的待办仍会保留标签ID，但标签将不再显示。')) {
      return
    }
    
    setIsDeleting(tagId)
    try {
      await tagsApi.delete(tagId.toString())
      
      // 更新状态
      deleteTag(projectId, tagId)
      
      // 刷新查询缓存
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
    } catch (error: any) {
      console.error('删除标签失败:', error)
      alert('删除标签失败: ' + (error.message || '未知错误'))
    } finally {
      setIsDeleting(null)
    }
  }
  
  return (
    <div className={clsx('bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full', className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">标签管理</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* 标签列表 */}
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {projectTags.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无标签
          </div>
        ) : (
          projectTags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* 标签显示 */}
              <div className="flex-1">
                {editingTagId === tag.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(tag.id)
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveEdit(tag.id)}
                      disabled={!editingName.trim()}
                    >
                      保存
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <TagDisplay tag={tag} size="md" />
                )}
              </div>
              
              {/* 操作按钮 */}
              {editingTagId !== tag.id && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(tag)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="编辑标签"
                    title="编辑标签"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag.id)}
                    disabled={isDeleting === tag.id}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    aria-label="删除标签"
                    title="删除标签"
                  >
                    {isDeleting === tag.id ? (
                      <span className="text-sm">删除中...</span>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 创建新标签 */}
      {showCreator ? (
        <div className="border-t border-gray-200 pt-4">
          <TagCreator
            onSave={handleCreateTag}
            onCancel={() => setShowCreator(false)}
            existingTags={projectTags}
          />
        </div>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreator(true)}
          className="w-full"
        >
          创建新标签
        </Button>
      )}
    </div>
  )
}
