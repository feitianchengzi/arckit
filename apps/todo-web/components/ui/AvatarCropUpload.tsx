'use client'

/**
 * 带裁切功能的头像上传组件
 * 用户上传图片后可以裁切，然后再保存
 */

import { useState, useRef, useEffect } from 'react'
import { ImageCropDialog } from './ImageCropDialog'

export interface AvatarCropUploadProps {
  /** 头像 URL */
  value?: string
  /** 上传成功回调 */
  onChange: (url: string) => void
  /** 输出尺寸（像素） */
  outputSize?: number
  /** 标签文字 */
  label?: string
  /** 是否显示标签 */
  showLabel?: boolean
}

export function AvatarCropUpload({
  value,
  onChange,
  outputSize = 200,
  label = '头像',
  showLabel = true,
}: AvatarCropUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value)
  const [originalImage, setOriginalImage] = useState<string>('')
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 同步外部value到preview
  useEffect(() => {
    setPreview(value)
  }, [value])

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setError('')

    try {
      // 读取文件并显示裁切对话框
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setOriginalImage(dataUrl)
        setShowCropDialog(true)
      }
      reader.onerror = () => {
        setError('文件读取失败')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('处理图片失败，请重试')
    }

    // 重置 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 裁切完成
  const handleCropComplete = (croppedImage: string) => {
    setPreview(croppedImage)
    onChange(croppedImage)
    setShowCropDialog(false)
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
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

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
        </div>

        {/* 上传按钮和说明 */}
        <div className="flex-1">
          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-50 transition-colors"
          >
            {preview ? '更换头像' : '上传头像'}
          </button>
          <p className="mt-1 text-xs text-gray-500">
            支持 JPG、PNG、GIF 等图片格式
          </p>
          <p className="text-xs text-gray-500">
            上传后可裁切调整
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 错误提示 */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 裁切对话框 */}
      {showCropDialog && (
        <ImageCropDialog
          open={showCropDialog}
          onClose={() => setShowCropDialog(false)}
          imageSrc={originalImage}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          outputSize={outputSize}
        />
      )}
    </div>
  )
}

