/**
 * 头像上传组件
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { validateImageFile } from '@/lib/utils/validators'

export interface AvatarUploadProps {
  /** 头像 URL */
  value?: string
  /** 上传成功回调 */
  onChange: (url: string) => void
  /** 最大文件大小（KB） */
  maxSize?: number
  /** 推荐尺寸文字 */
  recommendedSize?: string
}

export function AvatarUpload({
  value,
  onChange,
  maxSize = 200,
  recommendedSize = '50x50',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value)
  const [error, setError] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 同步外部value到preview
  useEffect(() => {
    setPreview(value)
  }, [value])

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件
    const validation = validateImageFile(file, maxSize)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setError('')
    setIsUploading(true)

    try {
      // 生成预览
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setPreview(dataUrl)
        onChange(dataUrl)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('文件读取失败')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)

      // 注意：这里只是本地预览
      // 如果需要上传到服务器，需要添加上传逻辑：
      // const formData = new FormData()
      // formData.append('avatar', file)
      // const response = await uploadApi.uploadAvatar(formData)
      // onChange(response.url)
    } catch (err) {
      setError('上传失败，请重试')
      setIsUploading(false)
    }
  }

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 处理拖拽
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // 模拟 input change 事件
      const input = fileInputRef.current
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        头像（可选）
      </label>

      <div className="flex items-center gap-4">
        {/* 头像预览 */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer hover:border-primary transition-colors"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* 上传按钮和说明 */}
        <div className="flex-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {preview ? '更换头像' : '上传头像'}
          </button>
          <p className="mt-1 text-xs text-gray-500">
            支持 JPG、PNG，不超过 {maxSize}KB
          </p>
          <p className="text-xs text-gray-500">
            建议尺寸：{recommendedSize}
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 错误提示 */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

