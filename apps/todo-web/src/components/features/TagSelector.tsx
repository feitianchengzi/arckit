/**
 * TagSelector - 标签选择器组件
 * 用于在任务中选择/添加标签
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { TagList } from './'
import { TagCreator } from './TagCreator'
import { TagManager } from './TagManager'
import { tagsApi } from '@/lib/api/endpoints/tags'
import { parseTags, stringifyTags, argbToCssColor } from '@/lib/utils/tagParser'
import type { ParsedTag } from '@/lib/utils/tagParser'
import { PlusIcon, XIcon, CogIcon } from '@/components/ui'

export interface TagSelectorProps {
  projectId: string
  currentTags?: string | null // 当前任务的tags字符串
  onTagsChange: (tagsString: string) => void | Promise<void>
  className?: string
  showCreateButton?: boolean // 是否显示创建新标签按钮
}

export function TagSelector({
  projectId,
  currentTags,
  onTagsChange,
  className,
  showCreateButton = true,
}: TagSelectorProps) {
  const [showCreator, setShowCreator] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 获取项目的所有标签
  const { data: projectTags = [], isLoading, refetch } = useQuery({
    queryKey: ['projects', projectId, 'tags'],
    queryFn: () => tagsApi.listByProject(projectId),
    enabled: !!projectId,
  })
  
  // 解析当前任务的标签
  const currentParsedTags = parseTags(currentTags)
  
  // 从项目标签中解析出ParsedTag（项目标签的name字段就是标签名称）
  // 注意：项目标签API返回的是Tag对象，但我们需要从任务的tags字符串中解析颜色
  // 这里我们需要一个映射：项目标签名称 -> 任务中使用的标签（包含颜色）
  const projectTagMap = new Map<string, ParsedTag>()
  
  // 从当前任务的tags中提取标签信息（包含颜色）
  currentParsedTags.forEach(tag => {
    projectTagMap.set(tag.name.toLowerCase(), tag)
  })
  
  // 获取所有可用的标签（项目标签 + 当前任务已使用的标签）
  const availableTags: ParsedTag[] = []
  
  // 添加项目标签（如果任务中已使用，使用任务中的颜色；否则使用默认颜色）
  projectTags.forEach(projectTag => {
    const existingTag = projectTagMap.get(projectTag.name.toLowerCase())
    if (existingTag) {
      availableTags.push(existingTag)
    } else {
      // 如果项目标签在任务中未使用，使用默认颜色
      availableTags.push({
        name: projectTag.name,
        color: 'ffff6b6b', // 默认红色（8位ARGB格式）
      })
    }
  })
  
  // 添加当前任务中使用的但不在项目标签列表中的标签
  currentParsedTags.forEach(tag => {
    if (!projectTags.some(pt => pt.name.toLowerCase() === tag.name.toLowerCase())) {
      availableTags.push(tag)
    }
  })
  
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
  
  // 处理删除标签（从已选标签中删除）
  const handleDeleteTag = async (tag: ParsedTag) => {
    const newTags = currentParsedTags.filter(
      t => t.name.toLowerCase() !== tag.name.toLowerCase()
    )
    
    setIsUpdating(true)
    try {
      await onTagsChange(stringifyTags(newTags))
    } catch (err) {
      console.error('删除标签失败:', err)
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
    <div className={`space-y-3 ${className || ''}`}>
      {/* 当前选中的标签 */}
      {currentParsedTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            已选标签
          </label>
          <TagList
            tagsString={currentTags}
            size="sm"
            showDelete={true}
            onDelete={handleDeleteTag}
          />
        </div>
      )}
      
      {/* 可用标签列表 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            可用标签
          </label>
          {showCreateButton && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManager(true)}
                className="flex items-center gap-1"
                title="管理项目标签"
              >
                <CogIcon className="w-4 h-4" />
                管理
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-1"
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
        </div>
        
        {isLoading ? (
          <div className="text-sm text-gray-500">加载标签中...</div>
        ) : availableTags.length === 0 && !showCreator ? (
          <div className="text-sm text-gray-500">暂无可用标签</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag, index) => {
              const isSelected = currentParsedTags.some(
                t => t.name.toLowerCase() === tag.name.toLowerCase()
              )
              const bgColor = argbToCssColor(tag.color)
              // 计算文字颜色（浅色背景用深色字，深色背景用浅色字）
              const textColor = getContrastColor(bgColor)
              
              return (
                <button
                  key={`${tag.name}-${index}`}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={isUpdating}
                  className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium
                    transition-all
                    ${isSelected 
                      ? 'ring-2 ring-primary ring-offset-1' 
                      : 'hover:opacity-80'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{
                    backgroundColor: isSelected ? bgColor : `${bgColor}80`,
                    color: textColor,
                  }}
                >
                  {tag.name}
                  {isSelected && <XIcon className="w-3 h-3" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 标签创建器 */}
      {showCreator && (
        <div className="border-t border-gray-200 pt-3">
          <TagCreator
            onSave={handleCreateTag}
            onCancel={() => setShowCreator(false)}
            existingTags={availableTags}
          />
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

