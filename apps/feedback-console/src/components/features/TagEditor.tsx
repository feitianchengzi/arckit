/**
 * TagEditor - 标签编辑组件（内联编辑）
 * 用于编辑标签的名称和颜色
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { normalizeColorTo8Digit, argbToCssColor, buildTagName } from '@/lib/utils/tagUtils'

export interface TagEditorProps {
  /** 当前标签名称 */
  currentName: string
  /** 当前标签颜色（8位ARGB格式，带#号） */
  currentColor: string
  /** 保存回调 */
  onSave: (displayName: string, color: string) => void | Promise<void>
  /** 取消回调 */
  onCancel: () => void
  /** 已存在的标签列表（用于检查重名） */
  existingTags?: Array<{ displayName: string; id?: number }>
  /** 当前编辑的标签ID（用于排除自己） */
  currentTagId?: number
  className?: string
}

// 预设颜色板（8位ARGB格式，不带#号）
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

export function TagEditor({
  currentName,
  currentColor,
  onSave,
  onCancel,
  existingTags = [],
  currentTagId,
  className,
}: TagEditorProps) {
  const [tagName, setTagName] = useState(currentName)
  const [selectedColorArgb, setSelectedColorArgb] = useState(
    currentColor.replace('#', '')
  )
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // 将8位ARGB转换为CSS颜色（用于显示）
  const selectedColorCss = argbToCssColor(`#${selectedColorArgb}`)
  
  const handleSave = async () => {
    // 验证标签名称
    if (!tagName.trim()) {
      setError('标签名称不能为空')
      return
    }
    
    // 检查是否已存在同名标签（排除自己）
    if (existingTags.some(
      tag => tag.displayName.toLowerCase() === tagName.trim().toLowerCase() 
        && tag.id !== currentTagId
    )) {
      setError('该标签名称已存在')
      return
    }
    
    setError('')
    setIsSaving(true)
    
    try {
      // 确保颜色是8位格式
      const normalizedColor = normalizeColorTo8Digit(`#${selectedColorArgb}`)
      await onSave(tagName.trim(), normalizedColor)
    } catch (err: any) {
      setError(err.message || '更新标签失败')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 监听ESC键取消编辑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])
  
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
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            }
          }}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择颜色
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {PRESET_COLORS_ARGB.map((colorArgb) => {
            const colorCss = argbToCssColor(`#${colorArgb}`)
            const isSelected = selectedColorArgb === colorArgb
            return (
              <button
                key={colorArgb}
                type="button"
                onClick={() => setSelectedColorArgb(colorArgb)}
                className={`
                  w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all flex-shrink-0
                  ${isSelected 
                    ? 'border-4 border-gray-900 ring-1 ring-gray-200' 
                    : 'border-2 border-gray-300 hover:border-gray-500'
                  }
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
          保存
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

