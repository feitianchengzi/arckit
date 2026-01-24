'use client'

/**
 * 带裁切功能的头像上传组件
 * 用户上传图片后可以裁切，然后再保存
 */

import { useState, useRef, useEffect } from 'react'
import { ImageCropDialog } from './ImageCropDialog'
import { uploadApi } from '@/lib/api/endpoints/upload'
import { compressImage, dataURLtoFile } from '@/lib/utils/imageCompress'
import { getAvatarUrl, getAvatarUrlSync } from '@/lib/oss/urlHelper'

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 同步外部value到preview（支持 objectKey 自动转换）
  useEffect(() => {
    console.log('[AvatarCropUpload] value 变化:', value)
    
    if (!value) {
      setPreview(undefined)
      return
    }
    
    // 如果是完整 URL（http/https），直接使用
    if (value.startsWith('http://') || value.startsWith('https://')) {
      console.log('[AvatarCropUpload] 检测到完整 URL，直接使用:', value)
      setPreview(value)
      return
    }
    
    // 如果是 objectKey，先尝试同步获取缓存（避免异步延迟）
    const cachedUrl = getAvatarUrlSync(value)
    if (cachedUrl) {
      console.log('[AvatarCropUpload] ⚡ 同步获取缓存 URL 成功:', cachedUrl.substring(0, 50) + '...')
      setPreview(cachedUrl)
      return
    }
    
    // 缓存未命中，异步获取
    console.log('[AvatarCropUpload] 缓存未命中，异步获取 URL:', value)
    getAvatarUrl(value)
      .then((url) => {
        console.log('[AvatarCropUpload] 获取头像 URL 成功:', url)
        if (url) {
          setPreview(url)
        } else {
          setPreview(undefined)
        }
      })
      .catch((error) => {
        console.error('[AvatarCropUpload] 获取头像 URL 失败:', error)
        setPreview(undefined)
      })
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

  // 裁切完成，上传到 OSS
  const handleCropComplete = async (croppedImage: string) => {
    // 先显示预览（本地预览）
    setPreview(croppedImage)
    setShowCropDialog(false)
    
    // 开始上传流程
    setIsUploading(true)
    setUploadProgress(0)
    setError('')
    
    try {
      // 1. 压缩图片（确保文件大小不会太大）
      const compressedImage = await compressImage(croppedImage, 200, 0.8)
      
      // 2. 转换为 File 对象
      const file = dataURLtoFile(compressedImage, 'avatar.jpg')
      
      // 3. 获取 STS 临时凭证
      const credentials = await uploadApi.getSTSToken()
      
      // 4. 上传到 OSS 并自动更新用户头像
      const { uploadAvatarToOSS } = await import('@/lib/oss/uploadApi')
      const uploadResult = await uploadAvatarToOSS(
        file,
        credentials,
        (progress) => {
          setUploadProgress(progress)
        },
        false // 使用直接更新方式（不使用 callback）
      )
      
      // 5. 生成签名URL用于预览
      const { getSignedUrl } = await import('@/lib/oss/upload')
      const previewUrl = await getSignedUrl(uploadResult.objectKey, credentials)
      
      // 6. 更新预览和调用回调（传递 objectKey）
      setPreview(previewUrl)
      onChange(uploadResult.objectKey) // 传递 objectKey 而不是 URL
      
      console.log('✅ 头像上传成功:', uploadResult.objectKey)
    } catch (err) {
      console.error('❌ 头像上传失败:', err)
      const errorMessage = err instanceof Error ? err.message : '上传失败，请重试'
      setError(errorMessage)
      // 上传失败时，保留本地预览，但显示错误
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
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
              data-oss-key={value && !value.startsWith('http') ? value : undefined}
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
          
          {/* 上传进度遮罩 */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1" />
                <div className="text-white text-xs mt-1">
                  {Math.round(uploadProgress * 100)}%
                </div>
              </div>
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
            {isUploading ? '上传中...' : preview ? '更换头像' : '上传头像'}
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



