/**
 * TagCreator - 标签创建组件
 * 包含标签名称输入和颜色选择器
 */

import { useState } from 'react'
import { Button } from '@/components/ui'
import { cssColorToArgb } from '@/lib/utils/tagParser'
import type { ParsedTag } from '@/lib/utils/tagParser'

export interface TagCreatorProps {
  onSave: (tag: ParsedTag) => void | Promise<void>
  onCancel: () => void
  existingTags?: ParsedTag[]
  className?: string
}

// 预设颜色板
const PRESET_COLORS = [
  '#ff0000', // 红色
  '#ff8000', // 橙色
  '#ffd700', // 金色
  '#32cd32', // 绿色
  '#00bfff', // 天蓝色
  '#4169e1', // 蓝色
  '#9370db', // 紫色
  '#ff1493', // 深粉色
  '#ff69b4', // 粉色
  '#00ced1', // 青色
  '#ff6347', // 番茄红
  '#ffa500', // 橙色
  '#ffff00', // 黄色
  '#90ee90', // 浅绿色
  '#87ceeb', // 天蓝色
  '#4682b4', // 钢蓝色
  '#ba55d3', // 中紫色
  '#dc143c', // 深红色
]

export function TagCreator({ onSave, onCancel, existingTags = [], className }: TagCreatorProps) {
  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    // 验证标签名称
    if (!tagName.trim()) {
      setError('标签名称不能为空')
      return
    }
    
    // 检查是否已存在同名标签
    if (existingTags.some(tag => tag.name.toLowerCase() === tagName.trim().toLowerCase())) {
      setError('该标签名称已存在')
      return
    }
    
    setError('')
    setIsSaving(true)
    
      try {
        const tag: ParsedTag = {
          name: tagName.trim(),
          color: cssColorToArgb(selectedColor),
        }
        await onSave(tag)
        // 保存成功后重置表单
        setTagName('')
        setSelectedColor(PRESET_COLORS[0])
        setError('')
      } catch (err: any) {
        setError(err.message || '创建标签失败')
      } finally {
        setIsSaving(false)
      }
  }
  
  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          标签名称
        </label>
        <input
          type="text"
          value={tagName}
          onChange={(e) => {
            setTagName(e.target.value)
            setError('')
          }}
          placeholder="输入标签名称"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          maxLength={100}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择颜色
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${selectedColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-500'}
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {/* 显示当前选中的颜色预览 */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-600">预览：</span>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: selectedColor }}
          >
            {tagName || '标签名称'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={isSaving}
          disabled={!tagName.trim()}
        >
          创建
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          取消
        </Button>
      </div>
    </div>
  )
}

