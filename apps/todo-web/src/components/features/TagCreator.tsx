/**
 * TagCreator - 标签创建组件
 * 包含标签名称输入和颜色选择器
 */

import { useState } from 'react'
import { Button } from '@/components/ui'
import { argbToCssColor } from '@/lib/utils/tagParser'
import type { ParsedTag } from '@/lib/utils/tagParser'

export interface TagCreatorProps {
  onSave: (tag: ParsedTag) => void | Promise<void>
  onCancel: () => void
  existingTags?: ParsedTag[]
  className?: string
}

// 预设颜色板（8位ARGB格式）
const PRESET_COLORS_ARGB = [
  'ffff0000', // 红色
  'ffff8000', // 橙色
  'ffffd700', // 金色
  'ff32cd32', // 绿色
  'ff00bfff', // 天蓝色
  'ff4169e1', // 蓝色
  'ff9370db', // 紫色
  'ffff1493', // 深粉色
  'ffff69b4', // 粉色
  'ff00ced1', // 青色
  'ffff6347', // 番茄红
  'ffffa500', // 橙色
  'ffffff00', // 黄色
  'ff90ee90', // 浅绿色
  'ff87ceeb', // 天蓝色
  'ff4682b4', // 钢蓝色
  'ffba55d3', // 中紫色
  'ffdc143c', // 深红色
]

export function TagCreator({ onSave, onCancel, existingTags = [], className }: TagCreatorProps) {
  const [tagName, setTagName] = useState('')
  const [selectedColorArgb, setSelectedColorArgb] = useState(PRESET_COLORS_ARGB[0])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // 将8位ARGB转换为CSS颜色（用于显示）
  const selectedColorCss = argbToCssColor(selectedColorArgb)
  
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
          color: selectedColorArgb, // 直接使用8位ARGB格式
        }
        await onSave(tag)
        // 保存成功后重置表单
        setTagName('')
        setSelectedColorArgb(PRESET_COLORS_ARGB[0])
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
          {PRESET_COLORS_ARGB.map((colorArgb) => {
            const colorCss = argbToCssColor(colorArgb)
            return (
              <button
                key={colorArgb}
                type="button"
                onClick={() => setSelectedColorArgb(colorArgb)}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all
                  ${selectedColorArgb === colorArgb ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-500'}
                `}
                style={{ backgroundColor: colorCss }}
                title={`${colorArgb} (${colorCss})`}
              />
            )
          })}
        </div>
        {/* 显示当前选中的颜色预览 */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-600">预览：</span>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: selectedColorCss }}
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

