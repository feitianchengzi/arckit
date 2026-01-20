/**
 * TagManager - 项目标签管理组件
 * 用于管理项目的所有标签（新建、编辑、删除）
 * 类似GitHub的标签管理界面
 */

import { useState, useMemo } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { TrashIcon, PencilIcon, XIcon } from '@/components/ui'
import { tagsApi, type Tag } from '@/lib/api/endpoints/tags'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { argbToCssColor, cssColorToArgb, parseTags, stringifyTags, type ParsedTag } from '@/lib/utils/tagParser'
import clsx from 'clsx'

export interface TagManagerProps {
  projectId: string
  tags: Tag[]
  currentTags?: string | null // 当前任务的tags字符串
  onTagsChange?: (tagsString: string) => void | Promise<void> // 标签变化回调
  onClose: () => void
  className?: string
}

export function TagManager({ projectId, tags, currentTags, onTagsChange, onClose, className }: TagManagerProps) {
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  
  // 获取项目的所有任务，用于提取标签的实际颜色
  const { data: allTasks } = useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => tasksApi.listByProject(projectId),
    enabled: !!projectId,
  })
  
  // 从所有任务中提取每个标签实际使用的颜色
  const tagColorMap = useMemo(() => {
    const colorMap = new Map<string, string>()
    
    // allTasks 是 Task[] 数组
    if (allTasks && Array.isArray(allTasks)) {
      allTasks.forEach((task: any) => {
        if (task.tags) {
          const parsedTags = parseTags(task.tags)
          parsedTags.forEach((tag: ParsedTag) => {
            const tagNameLower = tag.name.toLowerCase()
            // 如果该标签还没有颜色记录，则设置（第一个找到的颜色）
            if (!colorMap.has(tagNameLower)) {
              colorMap.set(tagNameLower, tag.color)
            }
          })
        }
      })
    }
    
    // 如果提供了当前任务的tags，也从中提取颜色（优先级更高，会覆盖之前的）
    if (currentTags) {
      const currentParsedTags = parseTags(currentTags)
      currentParsedTags.forEach((tag: ParsedTag) => {
        colorMap.set(tag.name.toLowerCase(), tag.color)
      })
    }
    
    return colorMap
  }, [allTasks, currentTags])

  // 删除标签
  const deleteMutation = useMutation({
    mutationFn: async ({ tagId, tagName }: { tagId: number; tagName: string }) => {
      // 先删除项目标签
      await tagsApi.delete(String(tagId))
      
      // 如果提供了当前任务的tags和回调函数，则同步更新任务
      if (currentTags && onTagsChange) {
        const currentParsedTags = parseTags(currentTags)
        // 检查当前任务是否使用了这个标签
        const hasTag = currentParsedTags.some(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        )
        
        if (hasTag) {
          // 从当前任务中移除该标签
          const newTags = currentParsedTags.filter(
            (t) => t.name.toLowerCase() !== tagName.toLowerCase()
          )
          const newTagsString = stringifyTags(newTags)
          // 更新任务的标签
          await onTagsChange(newTagsString)
        }
      }
      
      return { tagId, tagName }
    },
    onSuccess: () => {
      // 刷新标签列表
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || '删除标签失败')
    },
  })

  // 更新标签
  const updateMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: number; name: string }) =>
      tagsApi.update(String(tagId), { name }),
    onSuccess: () => {
      // 刷新标签列表
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] })
      setEditingTagId(null)
      setEditingName('')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || '更新标签失败')
    },
  })

  const handleDelete = (tagId: number, tagName: string) => {
    const message = currentTags && onTagsChange
      ? `确定要删除标签"${tagName}"吗？\n\n该标签将从当前任务中移除。`
      : `确定要删除标签"${tagName}"吗？\n\n注意：删除标签不会影响已使用该标签的任务。`
    
    if (window.confirm(message)) {
      deleteMutation.mutate({ tagId, tagName })
    }
  }

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditingName(tag.name)
    setError('')
  }

  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditingName('')
    setError('')
  }

  const handleSaveEdit = (tagId: number) => {
    if (!editingName.trim()) {
      setError('标签名称不能为空')
      return
    }

    // 检查是否与其他标签重名
    if (
      tags.some(
        (tag) =>
          tag.id !== tagId && tag.name.toLowerCase() === editingName.trim().toLowerCase()
      )
    ) {
      setError('该标签名称已存在')
      return
    }

    updateMutation.mutate({ tagId, name: editingName.trim() })
  }

  // 获取标签的实际颜色（从任务中提取，如果没有则使用默认颜色）
  const getTagColor = (tagName: string): string => {
    // 先从实际使用的颜色中查找
    const actualColor = tagColorMap.get(tagName.toLowerCase())
    if (actualColor) {
      return actualColor
    }
    
    // 如果没有找到实际颜色，使用默认颜色（基于标签名称生成一致的颜色）
    const colors = [
      'ffff6b6b', // 红色
      'ffff8c42', // 橙色
      'ffffd93d', // 黄色
      'ff6bcf7f', // 绿色
      'ff4d9de0', // 蓝色
      'ff9b59b6', // 紫色
      'ffff6ba9', // 粉色
      'ff5fc3e4', // 青色
    ]
    // 使用标签名称的哈希值来选择颜色
    let hash = 0
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 shadow-lg', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">管理项目标签</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 标签列表 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无标签</p>
            <p className="text-sm mt-1">使用下方的"新建标签"按钮创建第一个标签</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => {
              const isEditing = editingTagId === tag.id
              const tagColor = getTagColor(tag.name)
              const bgColor = argbToCssColor(tagColor)

              return (
                <div
                  key={tag.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    isEditing
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {/* 标签预览 */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => {
                            setEditingName(e.target.value)
                            setError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(tag.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          placeholder="标签名称"
                          autoFocus
                        />
                        {error && (
                          <p className="text-xs text-red-600">{error}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: bgColor }}
                        >
                          {tag.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(tag.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveEdit(tag.id)}
                          loading={updateMutation.isPending}
                          disabled={!editingName.trim()}
                        >
                          保存
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={updateMutation.isPending}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tag)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                          title="编辑标签"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag.id, tag.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="删除标签"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-600">
          {currentTags && onTagsChange
            ? '💡 提示：删除标签后会自动从当前任务中移除'
            : '💡 提示：删除标签不会影响已使用该标签的任务'}
        </p>
      </div>
    </div>
  )
}

