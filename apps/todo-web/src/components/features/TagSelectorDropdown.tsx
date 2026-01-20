/**
 * TagSelectorDropdown - 标签下拉选择器组件
 * 类似GitHub的标签选择方式，节省空间
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { TagList, TagCreator } from './'
import { TagManager } from './TagManager'
import { tagsApi } from '@/lib/api/endpoints/tags'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { parseTags, stringifyTags, argbToCssColor } from '@/lib/utils/tagParser'
import type { ParsedTag } from '@/lib/utils/tagParser'
import { PlusIcon, XIcon, CogIcon, ChevronDownIcon } from '@/components/ui'
import clsx from 'clsx'

export interface TagSelectorDropdownProps {
  projectId: string
  currentTags?: string | null // 当前任务的tags字符串
  onTagsChange: (tagsString: string) => void | Promise<void>
  className?: string
  showCreateButton?: boolean // 是否显示创建新标签按钮
}

export function TagSelectorDropdown({
  projectId,
  currentTags,
  onTagsChange,
  className,
  showCreateButton = true,
}: TagSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 获取项目的所有标签
  const { data: projectTags = [], isLoading, refetch } = useQuery({
    queryKey: ['projects', projectId, 'tags'],
    queryFn: () => tagsApi.listByProject(projectId),
    enabled: !!projectId,
  })
  
  // 获取项目的所有任务，用于提取标签的实际颜色
  const { data: allTasks } = useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => tasksApi.listByProject(projectId),
    enabled: !!projectId,
  })
  
  // 解析当前任务的标签
  const currentParsedTags = parseTags(currentTags)
  
  // 从所有任务中提取每个标签实际使用的颜色
  const tagColorMap = useMemo(() => {
    const colorMap = new Map<string, string>()
    
    // 从所有任务中提取标签颜色
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
  
  // 构建可用标签列表
  const projectTagMap = new Map<string, ParsedTag>()
  currentParsedTags.forEach(tag => {
    projectTagMap.set(tag.name.toLowerCase(), tag)
  })
  
  const availableTags: ParsedTag[] = []
  
  // 添加项目标签
  projectTags.forEach(projectTag => {
    const existingTag = projectTagMap.get(projectTag.name.toLowerCase())
    if (existingTag) {
      // 如果当前任务已使用，使用当前任务中的颜色
      availableTags.push(existingTag)
    } else {
      // 如果项目标签在任务中未使用，从所有任务中查找实际颜色
      availableTags.push({
        name: projectTag.name,
        color: getTagColor(projectTag.name), // 使用实际颜色或默认颜色
      })
    }
  })
  
  // 添加当前任务中使用的但不在项目标签列表中的标签
  currentParsedTags.forEach(tag => {
    if (!projectTags.some(pt => pt.name.toLowerCase() === tag.name.toLowerCase())) {
      availableTags.push(tag)
    }
  })
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCreator(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // 处理标签切换（添加/移除）
  const handleTagToggle = async (tag: ParsedTag) => {
    const isSelected = currentParsedTags.some(
      t => t.name.toLowerCase() === tag.name.toLowerCase()
    )
    
    let newTags: ParsedTag[]
    
    if (isSelected) {
      // 移除标签
      newTags = currentParsedTags.filter(
        t => t.name.toLowerCase() !== tag.name.toLowerCase()
      )
    } else {
      // 添加标签
      newTags = [...currentParsedTags, tag]
    }
    
    setIsUpdating(true)
    try {
      await onTagsChange(stringifyTags(newTags))
    } catch (err) {
      console.error('更新标签失败:', err)
    } finally {
      setIsUpdating(false)
    }
  }
  
  // 处理创建新标签
  const handleCreateTag = async (tag: ParsedTag) => {
    try {
      // 先调用API创建项目标签
      await tagsApi.create(projectId, {
        project_id: parseInt(projectId),
        name: tag.name,
      })
      
      // 刷新项目标签列表
      await refetch()
      
      // 将新标签添加到当前任务
      const newTags = [...currentParsedTags, tag]
      await onTagsChange(stringifyTags(newTags))
      
      // 关闭创建器
      setShowCreator(false)
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || '创建标签失败')
    }
  }
  
  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'inline-flex items-center justify-between gap-2',
          'px-3 py-1 text-sm border border-gray-300 rounded-md',
          'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isOpen && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <div className="flex items-center gap-2">
          {currentParsedTags.length > 0 ? (
            <>
              <span className="text-gray-600">标签</span>
              <span className="text-gray-400">({currentParsedTags.length})</span>
            </>
          ) : (
            <span className="text-gray-500">选择标签...</span>
          )}
        </div>
        <ChevronDownIcon
          className={clsx(
            'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden flex flex-col">
          {/* 可用标签列表 */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="text-sm text-gray-500 text-center py-4">加载标签中...</div>
            ) : availableTags.length === 0 && !showCreator ? (
              <div className="text-sm text-gray-500 text-center py-4">暂无可用标签</div>
            ) : (
              <div className="space-y-1">
                {availableTags.map((tag, index) => {
                  const isSelected = currentParsedTags.some(
                    t => t.name.toLowerCase() === tag.name.toLowerCase()
                  )
                  const bgColor = argbToCssColor(tag.color)
                  
                  return (
                    <label
                      key={`${tag.name}-${index}`}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer',
                        'transition-all hover:bg-gray-50',
                        isSelected && 'bg-primary/5',
                        isUpdating && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isUpdating && handleTagToggle(tag)}
                        disabled={isUpdating}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      
                      {/* 标签颜色点 */}
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                        style={{ backgroundColor: bgColor }}
                      />
                      
                      {/* 标签名称 */}
                      <span className="flex-1 text-gray-900">{tag.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* 底部操作按钮 */}
          {showCreateButton && (
            <div className="px-2 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManager(true)}
                className="flex items-center gap-1 flex-1"
              >
                <CogIcon className="w-4 h-4" />
                管理
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-1 flex-1"
              >
                {showCreator ? (
                  <>
                    <XIcon className="w-4 h-4" />
                    取消
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    新建
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* 标签创建器 */}
          {showCreator && (
            <div className="px-2 py-2 border-t border-gray-200 bg-white">
              <TagCreator
                onSave={handleCreateTag}
                onCancel={() => setShowCreator(false)}
                existingTags={availableTags}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 标签管理器（弹出层） */}
      {showManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl">
            <TagManager
              projectId={projectId}
              tags={projectTags}
              currentTags={currentTags}
              onTagsChange={onTagsChange}
              onClose={() => setShowManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}


